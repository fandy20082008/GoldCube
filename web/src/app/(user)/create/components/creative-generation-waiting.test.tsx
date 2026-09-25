import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { CreativeAgentRun } from "@/services/api/creative";

import { CreativeGenerationWaiting, creativeGenerationWaitingCopy, formatCreativeWaitingTime, shouldShowCreativeMediaWaiting } from "./creative-generation-waiting";

describe("creative generation waiting", () => {
    it("uses the real task phase before elapsed-time comfort copy", () => {
        expect(creativeGenerationWaitingCopy({ mode: "image", runStatus: "planning", progressText: "正在理解需求并选择合适的创作能力", elapsedSeconds: 180 })).toContain("画面的氛围和细节");
        expect(creativeGenerationWaitingCopy({ mode: "text", runStatus: "planning", progressText: "正在理解需求并选择合适的创作能力", elapsedSeconds: 180 })).toContain("想法理顺");
        expect(creativeGenerationWaitingCopy({ mode: "video", runStatus: "planning", progressText: "正在理解需求并选择合适的创作能力", elapsedSeconds: 180 })).toContain("镜头");
        expect(creativeGenerationWaitingCopy({ mode: "video", runStatus: "running", progressText: "连接暂时中断，正在确认后台任务状态", elapsedSeconds: 180 })).toContain("任务仍在后台继续");
        expect(creativeGenerationWaitingCopy({ mode: "image", runStatus: "running", progressText: "检查完成，正在整理结果", elapsedSeconds: 180 })).toContain("整理最后的细节");
    });

    it("adapts the comfort copy by media type and natural elapsed minutes", () => {
        expect(creativeGenerationWaitingCopy({ mode: "image", runStatus: "running", progressText: "正在处理创作任务", elapsedSeconds: 20 })).toContain("画面正在一点点显现");
        expect(creativeGenerationWaitingCopy({ mode: "video", runStatus: "running", progressText: "正在处理创作任务", elapsedSeconds: 20 })).toContain("镜头正在一帧帧铺开");
        expect(creativeGenerationWaitingCopy({ mode: "video", runStatus: "running", progressText: "仍在上游处理中", elapsedSeconds: 60 })).toContain("慢慢铺开");
        expect(creativeGenerationWaitingCopy({ mode: "video", runStatus: "running", progressText: "仍在上游处理中", elapsedSeconds: 120 })).toContain("久等了");
        expect(creativeGenerationWaitingCopy({ mode: "video", runStatus: "running", progressText: "仍在上游处理中", elapsedSeconds: 180 })).toContain("一帧帧渲染");
    });

    it("formats the actual elapsed time without an artificial upper limit", () => {
        expect(formatCreativeWaitingTime(42)).toBe("42秒");
        expect(formatCreativeWaitingTime(72)).toBe("1分12秒");
        expect(formatCreativeWaitingTime(3_661)).toBe("1小时1分1秒");
    });

    it("shows the responsive ambient placeholder only for active image and video runs", () => {
        expect(shouldShowCreativeMediaWaiting("image", "planning")).toBe(true);
        expect(shouldShowCreativeMediaWaiting("video", "running")).toBe(true);
        expect(shouldShowCreativeMediaWaiting("text", "running")).toBe(false);
        expect(shouldShowCreativeMediaWaiting("audio", "running")).toBe(false);
        expect(shouldShowCreativeMediaWaiting("image", "paused")).toBe(false);
        expect(shouldShowCreativeMediaWaiting("video", "completed")).toBe(false);

        const imageMarkup = renderWaiting("image", "running");
        expect(imageMarkup).toContain('data-testid="creative-media-waiting-visual"');
        expect(imageMarkup).toContain('data-media-mode="image"');
        expect(imageMarkup).toContain('aria-label="图片生成等待动画"');
        expect(imageMarkup).toContain("aspect-video");
        expect(imageMarkup).toContain("w-full");
        expect(imageMarkup).toContain("max-w-[520px]");
        expect(imageMarkup).toContain("motion-safe:animate-pulse");

        expect(renderWaiting("audio", "running")).not.toContain('data-testid="creative-media-waiting-visual"');
        expect(renderWaiting("video", "paused")).not.toContain('data-testid="creative-media-waiting-visual"');
    });

    it.each(["image", "video"] as const)("shows the %s placeholder after intelligent planning determines the media task", (mode) => {
        const now = Date.now();
        const run = {
            id: "run-intelligent",
            conversationId: "conversation-one",
            inputMessageId: "input-one",
            assistantMessageId: "assistant-one",
            status: "running",
            assetIds: [],
            tasks: [{ id: `planned-${mode}`, title: mode === "image" ? "生成主图" : "生成视频", type: mode, model: `${mode}-model`, status: "ready" }],
            createdAt: now,
            updatedAt: now,
        } satisfies CreativeAgentRun;

        const markup = renderToStaticMarkup(<CreativeGenerationWaiting run={run} message={{ content: "方案已确定，正在创建任务", createdAt: now }} />);
        expect(markup).toContain('data-testid="creative-media-waiting-visual"');
        expect(markup).toContain(`data-media-mode="${mode}"`);
    });
});

function renderWaiting(mode: "image" | "video" | "audio", status: CreativeAgentRun["status"]) {
    const now = Date.now();
    const run = {
        id: `run-${mode}`,
        conversationId: "conversation-one",
        inputMessageId: "input-one",
        assistantMessageId: "assistant-one",
        status,
        generationPreferences: { mode },
        assetIds: [],
        tasks: [],
        createdAt: now,
        updatedAt: now,
    } satisfies CreativeAgentRun;

    return renderToStaticMarkup(<CreativeGenerationWaiting run={run} message={{ content: "正在处理创作任务", createdAt: now }} />);
}
