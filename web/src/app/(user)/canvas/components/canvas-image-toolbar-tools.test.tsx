import { describe, expect, it, vi } from "vitest";

import { buildImageToolbarTools, defaultImageQuickToolIds, readImageQuickToolsConfig } from "./canvas-image-toolbar-tools";
import { CanvasNodeType, type CanvasNodeData } from "../types";

const node: CanvasNodeData = { id: "image", type: CanvasNodeType.Image, title: "图片", position: { x: 0, y: 0 }, width: 320, height: 240, metadata: { content: "/image.png" } };

describe("Canvas 图片快捷工具", () => {
    it("保留智能分层，首发不展示本地模型工具", () => {
        expect(defaultImageQuickToolIds).toContain("splitLayers");
        expect(defaultImageQuickToolIds).not.toContain("removeBackground");
        expect(defaultImageQuickToolIds).not.toContain("emotion");
        const handlers = Object.fromEntries(
            ["onUpload", "onToggleFreeResize", "onMaskEdit", "onCrop", "onSplit", "onSplitLayers", "onUpscale", "onSuperResolve", "onAngle", "onViewImage", "onCopyPrompt", "onReversePrompt"].map((key) => [key, vi.fn()]),
        ) as unknown as Parameters<typeof buildImageToolbarTools>[1];
        const tools = buildImageToolbarTools(node, handlers);
        expect(tools.map((tool) => tool.id)).toContain("splitLayers");
        expect(tools.map((tool) => tool.id)).not.toContain("removeBackground");
        expect(tools.map((tool) => tool.id)).not.toContain("emotion");
        expect(tools.find((tool) => tool.id === "splitLayers")?.title).toBe("智能分层");
        tools.find((tool) => tool.id === "splitLayers")?.onClick();
        expect(handlers.onSplitLayers).toHaveBeenCalledWith(node);
    });

    it("旧配置仍只接受已知工具 ID", () => {
        const result = readImageQuickToolsConfig({ ids: ["splitLayers", "unknown", "emotion"] });
        expect(result.ids).toEqual(["splitLayers"]);
    });
});
