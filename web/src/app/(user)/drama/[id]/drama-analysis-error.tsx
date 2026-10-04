"use client";

export function DramaAnalysisError({ phase, error, onDismiss }: { phase: "content" | "visual"; error: string; onDismiss: () => void }) {
    return (
        <section role="alert" className="mx-3 mt-3 flex shrink-0 items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm" data-drama-analysis-error={phase}>
            <div className="min-w-0 flex-1">
                <h2 className="font-medium text-destructive">{phase === "content" ? "AI 整理未完成" : "视觉方案未完成"}</h2>
                <p className="mt-1 whitespace-pre-wrap break-words text-foreground">{error}</p>
                <p className="mt-1 text-xs text-muted-foreground">{phase === "content" ? "剧本内容已保留。请检查原因后，再点击「AI 整理」重试。" : "审核内容已保留。请检查原因后，重新生成视觉方案。"}</p>
            </div>
            <button
                type="button"
                className="shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                onClick={onDismiss}
                aria-label={phase === "content" ? "关闭 AI 整理失败提示" : "关闭视觉方案失败提示"}
            >
                关闭提示
            </button>
        </section>
    );
}
