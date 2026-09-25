# 双仓统一发布清单与门禁

第19方案已确定公开完整源码快照、私有完整开发历史。`components.*.commit`和公开源码链接最终应指向**公开快照commit**；另以私有外置记录绑定开发commit、逐文件保留/变更/排除映射及其审核依据，不能把开发commit填作公开commit。旧祖先证明在私有来源环境保留。当前schema/CLI的快照来源接线尚待实现验收，缺项继续阻断；不得用空祖先、approved布尔或伪造公开链接绕过。R4和custom.12保持原独立身份。

用户批准的映射固定为：本地 `VOZEB-PRO` 对应 `fandy20082008/GoldCube`（app、frontend、worker、docs），本地 `GoldCube` 对应 `fandy20082008/GoldCube-Gateway`（proxy、品牌 shell、assets、代理 deployment 材料）。应用自身构建/部署材料仍须包含在应用完整源码归档中。拆仓不缩小供源范围，也不代表历史来源和权利已审核通过。

使用 [JSON 模板](../../scripts/check-goldcube-release.example.json) 建立每个版本唯一的外置清单。清单不能放入其自身引用的候选提交，否则产生自引用哈希；应保存在审计证据/发布附件中。所有未知项保持未知，不能将模板当成通过记录。

## 构建前

这里的`prebuild`指正式发布workflow，不是本地隔离审计构建。首次公开前可以先批准受限本地构建并保存独立原始记录，取得镜像法律文件/SBOM等证据；源码公开批准后再做真实匿名获取验收。该本地记录不能冒充本节脚本通过，不能填造公开URL或获得上传/部署权限。

现有受控 workflow 默认执行 `check-goldcube-release.mjs --phase prebuild`（省略 phase 也为 prebuild）。登记两仓精确 commit、公开完整源码归档 URL/SHA-256、来源/秘密/构建/供源人工证据和代理独立门禁记录 SHA-256。app、frontend、worker、docs 必须共享同一应用 commit 和完整源码归档。

该阶段不要求尚未生成的实际制品，返回 `deploymentReady: false`。它只允许进入构建，不能用作部署验收。完成来源、权利和秘密审核之前禁止上传源码或历史。

## 部署前

在同一清单补齐 `artifacts`、`deploymentApproval` 和 `prebuildRecordSha256`，从 CI 输出、注册表检查和实际交付包计算取得 digest，不根据源码 commit 猜测。`prebuildRecordSha256` 必须是构建前清单原始文件字节的 SHA-256（不是重新序列化后的摘要），并用 `--prebuild-record` 提供该外置原文件。脚本校验原始哈希、重新验证构建前记录，并逐项比较其余全部字段；仅允许补齐上述 3 个最终验收字段。更改候选、源码归档或审核证据均须重新审核并构建。保留两阶段原始清单及各自 SHA-256；验收人还须核对构建前哈希确实来自该次 CI 记录。

```text
node scripts/check-goldcube-release.mjs --phase deployment --record <仓库外的最终清单.json> --prebuild-record <仓库外的构建前原始清单.json> --tag <精确版本标签> --commit <应用40位commit> --repository fandy20082008/GoldCube --component app --image <清单中的app镜像目标>
```

最终门禁复用构建前审核、干净 Git、标签和旧基线检查，并要求以下 8 个制品角色完整登记：

| 角色                             | 制品要求                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| app、frontend、worker            | 同一自有 app 镜像 URI 和 SHA-256 digest，frontend 是镜像内前端                                  |
| docs                             | 自有 docs 镜像 URI 和 SHA-256 digest                                                            |
| proxy、shell、assets、deployment | 可下载的实际交付包 HTTPS URL 和 SHA-256；同一完整网关交付包可复用，但审核证据须证明角色覆盖完整 |

每项制品同时登记 `repository`、`sourceCommit`、`sourceArchiveSha256`、`digest`、`uri`、`verificationEvidence`。镜像 URI 必须为 `ghcr.io/<owner>/<image>@sha256:<64位摘要>`；gateway 制品摘要也使用 `sha256:` 前缀。外壳不能仅用 `serve.js` 单文件摘要冒充完整包。最终批准材料须覆盖本次完整制品集合。

脚本只检查记录结构及绑定，不访问 URL、不验证证据签署者或下载实际包，也不证明记录真实性。验收人必须实际校验源码下载、重建、制品摘要与部署后运行清单。`deploymentReady: true` 仅表示本地结构门禁已通过，远端保护和 SSH 防绕过仍需单独落实；没有最终清单不得新增部署。

统一源码入口应按当前运行版本展示此最终清单、两仓 pinned commit、两个归档及哈希与适用许可，不能指向浮动 main 代替对应源码。当前文档是入口设计与发布要求，不表示站点源码入口或公开归档已上线。
