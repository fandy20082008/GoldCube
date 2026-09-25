export const runtime = "nodejs";

export async function GET() {
    return Response.json({ code: 410, data: null, msg: "聚合提示词封面服务已停用" }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
