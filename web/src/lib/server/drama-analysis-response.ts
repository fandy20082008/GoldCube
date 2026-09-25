// JSON permits leading whitespace. Reuse the Agent SSE 15s keepalive cadence
// so every proxy sees activity while analysis is awaiting a model response.
export function streamDramaAnalysis(request: Request, analyze: (request: Request, signal: AbortSignal) => Promise<Response>) {
    const abort = new AbortController();
    const encoder = new TextEncoder();
    let close: (cancelled?: boolean) => void = () => {};
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            let closed = false;
            const heartbeat = setInterval(() => controller.enqueue(encoder.encode("\n")), 15_000);
            close = (cancelled = false) => {
                if (closed) return;
                closed = true;
                clearInterval(heartbeat);
                request.signal.removeEventListener("abort", onAbort);
                if (!cancelled) controller.close();
            };
            const onAbort = () => {
                abort.abort();
                close();
            };
            request.signal.addEventListener("abort", onAbort, { once: true });
            if (request.signal.aborted) return onAbort();
            controller.enqueue(encoder.encode("\n"));
            void (async () => {
                try {
                    // Next wraps its request in a Proxy which native Request cannot clone.
                    const response = await analyze(request, abort.signal);
                    const payload = await response.json();
                    const pointsRemaining = response.headers.get("x-vozeb-pro-points-remaining");
                    const balance = pointsRemaining?.trim() ? Number(pointsRemaining) : undefined;
                    if (!closed) controller.enqueue(encoder.encode(JSON.stringify({ ...payload, ...(balance !== undefined && Number.isFinite(balance) ? { pointsRemaining: balance } : {}) })));
                } catch {
                    if (!closed) controller.enqueue(encoder.encode(JSON.stringify({ code: 502, data: null, msg: "剧本整理连接已中断，请稍后重试" })));
                } finally {
                    close();
                }
            })();
        },
        cancel() {
            close(true);
            abort.abort();
        },
    });
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
}
