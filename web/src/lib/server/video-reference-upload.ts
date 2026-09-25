import { fileTypeFromBuffer } from "file-type";
import { getAuthSettings } from "@/lib/auth/store";
import { protocolAuthHeaders } from "@/lib/channel-protocol-registry";
import { CREATIVE_UPLOAD_MAX_BYTES } from "@/lib/creative-upload";
import type { VideoGenerationReference } from "@/lib/video-reference-contract";
import type { SystemGenerationChannelConfig } from "./generation-channel";
import { resolveModelRequestTimeoutMs } from "./model-request-policy";
import { readProviderValue } from "./provider-task-config";
import { readRequestBodyBytes } from "./request-body-limit";
import { fetchSafeOutbound } from "./safe-outbound-fetch";

export class VideoReferenceUploadError extends Error {}

export type VideoReferenceSubmission = {
    referenceCount: number;
    uploadedCount: number;
    imageCount: number;
    uploadPath: string;
    stage: "uploading" | "uploaded" | "failed" | "submitting";
};

export async function uploadVideoReferences(channel: SystemGenerationChannelConfig, references: VideoGenerationReference[], record?: (value: VideoReferenceSubmission) => Promise<void>) {
    const config = channel.advancedConfig?.referenceUpload;
    if (!config || !references.length) return references;
    const audit: VideoReferenceSubmission = { referenceCount: references.length, imageCount: references.filter((r) => r.type === "image").length, uploadedCount: 0, uploadPath: config.path, stage: "uploading" };
    await record?.({ ...audit });
    try {
        const settings = await getAuthSettings();
        const provider = settings.systemChannels.find((item) => item.id === channel.channelId && item.enabled);
        if (!provider || !/^\/(?!\/)/.test(config.path) || !config.fileField || !config.urlField) throw new Error("Invalid upload configuration");
        const base = new URL(provider.baseUrl.replace(/\/+$/, "") + "/");
        const target = new URL(config.path.slice(1), base);
        if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname) || target.username || target.password || target.hash) throw new Error("Invalid upload target");
        const signal = AbortSignal.timeout(resolveModelRequestTimeoutMs(channel, "video"));
        const uploaded = new Map<string, string>();
        const result: VideoGenerationReference[] = [];
        for (const reference of references) {
            let url = uploaded.get(reference.url);
            if (!url) {
                // Inputs were authorized and signed by the video route. Never send provider credentials to the source URL.
                const source = await fetchSafeOutbound(reference.url, { signal, cache: "no-store" });
                if (!source.ok) throw new Error("Reference read failed");
                const bytes = await readRequestBodyBytes(source, CREATIVE_UPLOAD_MAX_BYTES);
                const detected = await fileTypeFromBuffer(bytes);
                if (!detected?.mime.startsWith(reference.type + "/")) throw new Error("Reference media type mismatch");
                const form = new FormData();
                form.set(config.fileField, new Blob([bytes], { type: detected.mime }), `reference.${detected.ext}`);
                const response = await fetchSafeOutbound(target, { method: "POST", headers: protocolAuthHeaders(provider.apiKey, provider.advancedConfig, provider.apiFormat), body: form, signal, redirect: "error" });
                if (!response.ok) throw new Error("Upload rejected");
                const data = JSON.parse(new TextDecoder().decode(await readRequestBodyBytes(response, CREATIVE_UPLOAD_MAX_BYTES)));
                if (data.success === false || (data.code !== undefined && ![0, 200, "0", "200"].includes(data.code))) throw new Error("Upload failed");
                const value = readProviderValue(data, config.urlField);
                if (typeof value !== "string") throw new Error("Upload URL missing");
                const parsed = new URL(value);
                if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Invalid upload URL");
                url = value;
                uploaded.set(reference.url, url);
            }
            result.push({ ...reference, url });
            audit.uploadedCount += 1;
            await record?.({ ...audit });
        }
        await record?.({ ...audit, stage: "uploaded" });
        return result;
    } catch {
        await record?.({ ...audit, stage: "failed" });
        throw new VideoReferenceUploadError("参考素材上传到当前渠道失败，视频尚未提交，请稍后重试或联系管理员检查素材上传配置");
    }
}
