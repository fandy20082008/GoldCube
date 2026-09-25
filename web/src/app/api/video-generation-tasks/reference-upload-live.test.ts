import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyAdvancedConfig } from "@/lib/channel-protocol-registry";
import type { SystemGenerationChannelConfig } from "@/lib/server/generation-channel";
import { uploadVideoReferences, type VideoReferenceSubmission } from "@/lib/server/video-reference-upload";

const mocks = vi.hoisted(() => ({ settings: vi.fn() }));
vi.mock("@/lib/auth/store", async (original) => ({ ...(await original<typeof import("@/lib/auth/store")>()), getAuthSettings: mocks.settings }));
import { createUpstream } from "./video-generation-route";

describe("reference upload before video creation over TCP", () => {
    let server: Server;
    let base: string;
    let config: SystemGenerationChannelConfig;
    let requests: Array<{ path: string; authorization?: string; body: Buffer; contentType: string }>;
    let responseMode: "ok" | "reject" | "missing" | "business-error" | "source-error";
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8qkAAAAASUVORK5CYII=", "base64");

    beforeEach(async () => {
        vi.stubEnv("VOZEB_PRO_ALLOW_PRIVATE_UPSTREAMS", "1");
        vi.stubEnv("VOZEB_PRO_PRIVATE_UPSTREAM_HOSTS", "127.0.0.1");
        requests = [];
        responseMode = "ok";
        server = createServer(async (request, response) => {
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.from(chunk));
            requests.push({ path: request.url!, authorization: request.headers.authorization, contentType: request.headers["content-type"] || "", body: Buffer.concat(chunks) });
            if (request.url === "/source.png") {
                response.writeHead(responseMode === "source-error" ? 404 : 200, { "content-type": "image/png" });
                response.end(png);
                return;
            }
            response.setHeader("content-type", "application/json");
            if (request.url === "/v1/media") {
                response.statusCode = responseMode === "reject" ? 503 : 200;
                response.end(
                    JSON.stringify(responseMode === "missing" ? { data: [] } : responseMode === "business-error" ? { success: false, data: [{ url: base + "/uploaded.png" }] } : { code: 0, success: true, data: [{ url: base + "/uploaded.png" }] }),
                );
                return;
            }
            response.end(JSON.stringify({ task_id: "fixture-upload-video", status: "processing" }));
        });
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        if (!address || typeof address === "string") throw new Error("Fixture did not bind");
        base = `http://127.0.0.1:${address.port}`;
        config = {
            apiSource: "system",
            apiKey: "system",
            apiFormat: "openai",
            channelId: "fixture",
            baseUrl: base + "/v1",
            model: "Asd2.0-fast2",
            advancedConfig: {
                ...emptyAdvancedConfig(),
                protocol: "custom",
                createPath: "/videos",
                imageToVideoPath: "/videos",
                referenceUpload: { path: "/media", fileField: "file", urlField: "data[0].url" },
                requestTemplate: '{"model":"{model}","prompt":"{prompt}","duration":"{duration}","images":"{images_ref}","reference_videos":"{videos_ref}","reference_audios":"{audios_ref}","generate_audio":"{generate_audio}"}',
            },
        };
        mocks.settings.mockResolvedValue({ systemChannels: [{ id: "fixture", enabled: true, baseUrl: base + "/v1", apiKey: "fixture-upload-secret", apiFormat: "openai", advancedConfig: config.advancedConfig }] });
    });

    afterEach(async () => {
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        vi.unstubAllEnvs();
    });

    async function create(record?: (value: VideoReferenceSubmission) => Promise<void>) {
        return createUpstream("fixture-user", "", "", config, "Animate the supplied image", { videoSeconds: 10 }, [{ type: "image", url: base + "/source.png" }], { imageQuality: {}, videoQuality: {}, videoSeconds: {} }, "fixture-request", record);
    }

    it("uploads actual bytes and submits the returned URL as an array exactly once", async () => {
        const audit: VideoReferenceSubmission[] = [];
        const result = await create(async (value) => {
            audit.push(value);
        });
        expect(result.id).toBe("fixture-upload-video");
        expect(requests.map((r) => r.path)).toEqual(["/source.png", "/v1/media", "/v1/videos"]);
        expect(requests[0].authorization).toBeUndefined();
        expect(requests[1].authorization).toBe("Bearer fixture-upload-secret");
        const form = await new Request(base, { method: "POST", headers: { "content-type": requests[1].contentType }, body: new Uint8Array(requests[1].body) }).formData();
        const file = form.get("file") as File;
        expect(file.type).toBe("image/png");
        expect(Buffer.from(await file.arrayBuffer())).toEqual(png);
        expect(JSON.parse(requests[2].body.toString())).toEqual({ model: "Asd2.0-fast2", prompt: "Animate the supplied image", duration: 10, images: [base + "/uploaded.png"], generate_audio: true });
        expect(audit.at(-1)).toMatchObject({ stage: "submitting", imageCount: 1, uploadedCount: 1 });
        expect(JSON.stringify(audit)).not.toContain("secret");
        expect(JSON.stringify(audit)).not.toContain("uploaded.png");
    });

    it.each(["reject", "missing", "business-error", "source-error"] as const)("never creates a video when reference preparation fails: %s", async (mode) => {
        responseMode = mode;
        const record = vi.fn(async () => undefined);
        await expect(create(record)).rejects.toThrow("视频尚未提交");
        expect(requests.some((r) => r.path === "/v1/videos")).toBe(false);
        expect(record).toHaveBeenLastCalledWith(expect.objectContaining({ stage: "failed" }));
    });

    it("blocks submission if the template drops the uploaded image", async () => {
        config.advancedConfig!.requestTemplate = '{"model":"{{model}}","prompt":"{{prompt}}"}';
        const record = vi.fn(async () => undefined);
        await expect(create(record)).rejects.toThrow("未包含全部参考素材");
        expect(record).toHaveBeenLastCalledWith(expect.objectContaining({ stage: "failed" }));
        expect(requests.some((r) => r.path === "/v1/videos")).toBe(false);
    });

    it("omits an unset optional negative prompt instead of sending its placeholder", async () => {
        const template = JSON.parse(config.advancedConfig!.requestTemplate!);
        config.advancedConfig!.requestTemplate = JSON.stringify({ ...template, negative_prompt: "{negative_prompt}" });
        await create();
        expect(JSON.parse(requests.at(-1)!.body.toString())).not.toHaveProperty("negative_prompt");
    });

    it("preserves order and frame roles while uploading duplicate bytes once", async () => {
        const result = await uploadVideoReferences(config, [
            { type: "image", role: "reference", url: base + "/source.png" },
            { type: "image", role: "first_frame", url: base + "/source.png" },
        ]);
        expect(result.map((r) => r.role)).toEqual(["reference", "first_frame"]);
        expect(result.every((r) => r.url === base + "/uploaded.png")).toBe(true);
        expect(requests.filter((r) => r.path === "/v1/media")).toHaveLength(1);
    });

    it("does nothing for channels without upload configuration or requests without references", async () => {
        expect(await uploadVideoReferences(config, [])).toEqual([]);
        delete config.advancedConfig!.referenceUpload;
        const references = [{ type: "image" as const, url: base + "/source.png" }];
        expect(await uploadVideoReferences(config, references)).toBe(references);
        expect(requests).toHaveLength(0);
    });

    it("rejects upload paths that escape the channel base before sending credentials", async () => {
        config.advancedConfig!.referenceUpload!.path = "/../other";
        await expect(create()).rejects.toThrow("视频尚未提交");
        expect(requests).toHaveLength(0);
    });
});
