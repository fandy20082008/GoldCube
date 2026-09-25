import { afterEach, describe, expect, it, vi } from "vitest";

import { requestDramaAnalysis } from "./drama-analysis";
import { syncUserPointsFromHeaders } from "./points";

vi.mock("./points", () => ({ syncUserPointsFromHeaders: vi.fn() }));

describe("drama analysis API", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("opts into keepalive and reads JSON after whitespace with the final points balance", async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('\n\n{"code":0,"data":{"shots":[]},"pointsRemaining":0}'));
        vi.stubGlobal("fetch", fetch);
        await expect(requestDramaAnalysis({ phase: "content", requestId: "same-request" })).resolves.toEqual({ shots: [] });
        expect(fetch).toHaveBeenCalledWith("/api/drama/analyze", expect.objectContaining({ headers: { "Content-Type": "application/json", "X-Vozeb-Stream-Response": "1" }, body: '{"phase":"content","requestId":"same-request"}' }));
        expect(syncUserPointsFromHeaders).toHaveBeenLastCalledWith({ "x-vozeb-pro-points-remaining": 0 }, "system");
    });

    it("rejects terminal errors even with HTTP 200 and synchronizes refunds", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: 502, data: null, msg: "分析失败", pointsRemaining: 12 })));
        await expect(requestDramaAnalysis({ phase: "visual" })).rejects.toThrow("分析失败");
        expect(syncUserPointsFromHeaders).toHaveBeenLastCalledWith({ "x-vozeb-pro-points-remaining": 12 }, "system");
    });

    it("reports a truncated connection rather than accepting a partial result", async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('\n\n{"code":0,"data":'));
        vi.stubGlobal("fetch", fetch);
        await expect(requestDramaAnalysis({ phase: "content" })).rejects.toThrow("连接已中断");
        expect(fetch).toHaveBeenCalledOnce();
    });
});
