import { syncUserPointsFromHeaders } from "./points";

export async function requestDramaAnalysis<T>(body: Record<string, unknown>): Promise<T> {
    const response = await fetch("/api/drama/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Vozeb-Stream-Response": "1" },
        body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { code?: number; data?: T; msg?: string; pointsRemaining?: number } | null;
    syncUserPointsFromHeaders(response.headers, "system");
    if (typeof payload?.pointsRemaining === "number" && Number.isFinite(payload.pointsRemaining)) syncUserPointsFromHeaders({ "x-vozeb-pro-points-remaining": payload.pointsRemaining }, "system");
    if (!response.ok || payload?.code !== 0 || !payload.data) throw new Error(payload?.msg || "剧本整理连接已中断，请稍后重试");
    return payload.data;
}
