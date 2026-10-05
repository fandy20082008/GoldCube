import Link from "next/link";
import { readPublicRelease } from "@/lib/server/open-source-release";

export const dynamic = "force-dynamic";
export const metadata = { title: "开源许可与源码", alternates: { canonical: "/open-source" } };

export default async function OpenSourcePage() {
    const release = await readPublicRelease();
    return (
        <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-5 py-10 text-foreground" data-preserve-attribution>
            <Link href="/" className="text-sm underline">
                返回首页
            </Link>
            <h1 className="text-3xl font-semibold">开源许可与源码</h1>
            <p className="leading-7">GoldCube 主应用基于 VOZEB-PRO 旧 AGPL 版本二次开发。原作者版权、适用许可证及第三方声明随对应源码保留；源码免费获取。</p>
            {!release ? (
                <section role="status" className="rounded-xl border border-border bg-muted p-5">
                    <h2 className="text-lg font-semibold">当前版本源码信息暂不可用</h2>
                    <p className="mt-2 leading-7">当前部署尚未提供有效的版本绑定清单。此页面不代表对应源码已完成交付，请联系站点管理员补齐。</p>
                </section>
            ) : (
                <>
                    <section className="space-y-2 rounded-xl border border-border p-5">
                        <h2 className="text-lg font-semibold">版本 {release.releaseTag}</h2>
                        <p className="break-all text-sm">最终清单 SHA-256：{release.manifestSha256}</p>
                        <p className="text-sm text-muted-foreground">以下信息由部署清单固定。清单校验不替代源码下载、重建及运行制品核验。</p>
                        {release.docsDeployment === "not-deployed" && <p className="text-sm">文档站服务未部署；文档及构建材料仍包含在主应用完整源码中。</p>}
                        {release.deliveryStatus?.libvips === "deferred" && (
                            <p role="status" className="text-sm">
                                libvips 对应源码与重链接交付材料仍待补齐。本页面展示当前版本绑定，不表示该项许可交付已完成。
                            </p>
                        )}
                    </section>
                    {release.sources.map((source, index) => {
                        return (
                            <section key={source.repository} className="space-y-3 rounded-xl border border-border p-5">
                                <h2 className="text-xl font-semibold">{index === 0 ? "主应用 / 前后端 / Worker" : "网关 / 代理 / 品牌外壳"}</h2>
                                <a className="block break-all underline" href={`https://github.com/${source.repository}/tree/${source.commit}`}>
                                    {source.repository}
                                </a>
                                <p className="break-all text-sm">Commit：{source.commit}</p>
                                <a className="inline-block rounded-lg bg-foreground px-4 py-2 text-background" href={source.archiveUrl}>
                                    免费下载完整源码
                                </a>
                                <p className="break-all text-sm">源码 SHA-256：{source.archiveSha256}</p>
                                <div className="flex flex-wrap gap-4 text-sm underline">
                                    <a href={source.licenseUrl}>许可证与版权</a>
                                    <a href={source.noticesUrl}>第三方声明</a>
                                    <a href={source.buildUrl}>构建与部署说明</a>
                                </div>
                            </section>
                        );
                    })}
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">实际制品绑定</h2>
                        {release.artifacts.map((artifact) => (
                            <p key={artifact.role} className="break-all text-sm">
                                <strong>{artifact.role}</strong>：{artifact.digest}
                                {"archiveSha256" in artifact && <span className="block">制品归档 SHA-256：{artifact.archiveSha256}</span>}
                            </p>
                        ))}
                    </section>
                </>
            )}
        </main>
    );
}
