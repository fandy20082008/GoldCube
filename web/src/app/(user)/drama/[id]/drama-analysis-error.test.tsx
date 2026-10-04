import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DramaAnalysisError } from "./drama-analysis-error";

describe("drama analysis failure feedback", () => {
    it.each([
        { phase: "content" as const, title: "AI 整理未完成", action: "AI 整理" },
        { phase: "visual" as const, title: "视觉方案未完成", action: "重新生成视觉方案" },
    ])("keeps $phase errors readable and explicitly dismissible", ({ phase, title, action }) => {
        const markup = renderToStaticMarkup(<DramaAnalysisError phase={phase} error={'超时 <script>alert("private")</script>'} onDismiss={() => undefined} />);
        expect(markup).toContain('role="alert"');
        expect(markup).toContain(title);
        expect(markup).toContain(action);
        expect(markup).toContain('type="button"');
        expect(markup).toContain("关闭提示");
        expect(markup).toContain("&lt;script&gt;");
        expect(markup).not.toContain("<script>");
    });
});
