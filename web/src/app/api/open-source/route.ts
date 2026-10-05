import { readPublicRelease } from "@/lib/server/open-source-release";

export const dynamic = "force-dynamic";

export async function GET() {
    const release = await readPublicRelease();
    return Response.json(release ? { code: 0, data: release, msg: "success" } : { code: 503, data: null, msg: "Current source binding is unavailable" }, { status: release ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
