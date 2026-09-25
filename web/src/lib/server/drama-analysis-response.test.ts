import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ReflectAdapter } from "next/dist/server/web/spec-extension/adapters/reflect";

import { streamDramaAnalysis } from "./drama-analysis-response";

describe("drama analysis keepalive response", () => {
    afterEach(() => vi.useRealTimers());

    it("preserves Next route's proxied Request rather than passing it to the native constructor", async () => {
        const original = new NextRequest("http://localhost/api/drama/analyze", { method: "POST", body: '{"phase":"content"}' });
        // AppRouteRouteModule.proxyNextRequest uses this adapter for Request getters.
        const request = new Proxy(original, { get: (target, property) => ReflectAdapter.get(target, property, target) });
        const response = streamDramaAnalysis(request, async (received, signal) => {
            expect(received).toBe(request);
            expect(signal.aborted).toBe(false);
            return Response.json({ code: 0, data: await received.json() });
        });
        await expect(response.json()).resolves.toEqual({ code: 0, data: { phase: "content" } });
    });

    it("keeps a slow analysis alive past the proxy idle timeout and returns one JSON result", async () => {
        vi.useFakeTimers();
        let complete!: (response: Response) => void;
        const response = streamDramaAnalysis(
            new Request("http://localhost/api/drama/analyze"),
            () =>
                new Promise((resolve) => {
                    complete = resolve;
                }),
        );
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let text = decoder.decode((await reader.read()).value);
        for (let index = 0; index < 3; index++) {
            await vi.advanceTimersByTimeAsync(15_000);
            text += decoder.decode((await reader.read()).value);
        }
        expect(text).toBe("\n\n\n\n");
        expect(response.headers.get("x-accel-buffering")).toBe("no");
        complete(Response.json({ code: 0, data: { shots: ["shot-1"] }, msg: "OK" }, { headers: { "x-vozeb-pro-points-remaining": "0" } }));
        text += decoder.decode((await reader.read()).value);
        expect(JSON.parse(text)).toEqual({ code: 0, data: { shots: ["shot-1"] }, msg: "OK", pointsRemaining: 0 });
        expect((await reader.read()).done).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("preserves final business errors and refunded points after headers were sent", async () => {
        const response = streamDramaAnalysis(new Request("http://localhost"), async () => Response.json({ code: 502, data: null, msg: "模型没有返回结构化剧本结果" }, { status: 502, headers: { "x-vozeb-pro-points-remaining": "24.5" } }));
        expect(await response.json()).toEqual({ code: 502, data: null, msg: "模型没有返回结构化剧本结果", pointsRemaining: 24.5 });
    });

    it("converts unexpected failures to a terminal error without exposing internal messages", async () => {
        const response = streamDramaAnalysis(new Request("http://localhost"), async () => {
            throw new Error("private upstream detail");
        });
        expect(await response.json()).toEqual({ code: 502, data: null, msg: "剧本整理连接已中断，请稍后重试" });
    });

    it.each(["", "invalid", "Infinity"])("omits an invalid points header (%s)", async (balance) => {
        const response = streamDramaAnalysis(new Request("http://localhost"), async () => Response.json({ code: 0, data: {} }, { headers: { "x-vozeb-pro-points-remaining": balance } }));
        expect(await response.json()).toEqual({ code: 0, data: {} });
    });

    it("cancels upstream work and clears heartbeats without closing an already cancelled stream", async () => {
        vi.useFakeTimers();
        let signal!: AbortSignal;
        let complete!: (response: Response) => void;
        const response = streamDramaAnalysis(new Request("http://localhost"), (_request, analysisSignal) => {
            signal = analysisSignal;
            return new Promise((resolve) => {
                complete = resolve;
            });
        });
        const reader = response.body!.getReader();
        await reader.read();
        await expect(reader.cancel()).resolves.toBeUndefined();
        expect(signal.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
        complete(Response.json({ code: 0, data: {} }));
        await vi.advanceTimersByTimeAsync(30_000);
        expect((await reader.read()).done).toBe(true);
    });

    it("does not start analysis when the request has already disconnected", async () => {
        vi.useFakeTimers();
        const abort = new AbortController();
        abort.abort();
        const analyze = vi.fn();
        const response = streamDramaAnalysis(new Request("http://localhost", { signal: abort.signal }), analyze);
        expect(await response.text()).toBe("");
        expect(analyze).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });
});
