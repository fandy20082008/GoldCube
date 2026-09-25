# 自动化流程

双仓目标固定为 `fandy20082008/GoldCube`（本地主应用）和 `fandy20082008/GoldCube-Gateway`（本地代理/外壳）。参见[统一清单](../../docs/open-source/dual-repository-manifest.md)。当前 workflow 执行构建前门禁；实际部署必须另行运行 `--phase deployment`，绑定原始构建前清单及八类实际制品。两阶段清单哈希均归档，不能将构建成功当成部署批准。CODEOWNERS 已本地指向 `@fandy20082008`，尚未上传或启用远端强制评审。

## 发布策略：只允许受控手动发布

`docker-image.yml`（应用/前端/Worker）与 `docs-docker-image.yml`（文档站）只接受 `workflow_dispatch`。旧 `v*` / `VOZEB-PRO-v*` 标签与 GoldCube 标签均不会自动发布镜像；来源工作流的成功也不代表发布完成。两镜像流程保留原有质量、安全、架构构建和 digest 签名步骤。

手动输入 `release_tag` 必须是精确的 `goldcube-vX.Y.Z-custom.N`，并解析到本次所选 workflow ref 的 `github.sha`。发布门禁、质量、安全及构建 checkout 全部固定该 SHA；禁止用标签选择不同代码绕过工作流审核。不发布 `latest`，只生成该 GoldCube 版本标签，发布后以 digest 记录/部署，同一版本不得改写用途。

以上“同一版本不得改写”是发布政策；当前尚未配置 registry 标签不可变权限，同 tag 重复派发技术上可能覆盖标签，不能宣称已机器阻止。正式部署必须使用经记录的 digest，并在启用远端发布时验证重发与标签保护策略。

必须在自有仓库配置 `GOLDCUBE_APP_IMAGE` 和 `GOLDCUBE_DOCS_IMAGE` 变量，格式为 `ghcr.io/<当前仓库owner>/<自有镜像名>`；两目标不得相同。空值、继承的 `ghcr.io/csyqlz/...`、其他 owner、携带 tag/digest 的目标一律阻断，未提供默认值。当前没有配置或核验远端目标。

## 外置供源验收记录

`acceptance_record` 输入接收 `schemaVersion: 1` 的 JSON；也可用相同脚本读取仓库外的受控 JSON 文件。记录在冻结候选 commit 后制作，独立保存，不要求把包含自身 commit 的记录塞入同一提交。格式参考 `scripts/check-goldcube-release.example.json`，模板中的未知状态必须保留到真实验收完成，不能改成空泛的 `approved` 布尔。

记录必须绑定：

- 精确 `releaseTag`、`workflowCommit`、`applicationRepository` 和两个 `imageTargets`。
- `components.app/frontend/worker/docs` 均绑定应用候选 commit；`components.proxy` 指向独立 GoldCube 仓库及其精确 commit。相同源码归档可在同仓组件间复用。
- 每组件提供免费源码归档 HTTPS URL、SHA-256、人工审核人/时间，以及 `provenance`、`secrets`、`publicBuild`、`sourceDownload`、`sourceCompleteness` 的 `passed` 状态和可追溯 HTTPS 证据 URL。任何缺失、失败、未知均阻断。
- 代理还必须提供 `releaseGate`：本仓发布门禁通过状态、与代理 commit 一致的 `sourceCommit`、该验收记录的 `recordSha256`、通过报告 `reportUrl`；应用门禁不替代代理自身的范围/材料/制品检查。
- 这里代理 `releaseGate.status=passed` 仅表示本仓本地 release 检查成功，`recordSha256` 是其外置输入清单原始字节哈希；代理输出的 `releaseApproved:false` 仍表示尚需跨仓最终批准，两者不矛盾。
- 顶层 `approval` 为本次完整发布的真实人工批准人、结论和证据，不能以项目经理批准替代第三方授权。

脚本输出原始输入字节的 SHA-256（`recordSha256`），另以 `canonicalRecordSha256` 标识解析后 JSON 序列化哈希，并记录候选版本/目标。文件输入以实际文件字节为准；workflow 输入以该 JSON 字符串的 UTF-8 字节为准。审核人必须归档原记录及输出，不使用浮动远端 JSON 代替不可变验收记录。证据材料不得包含密钥或客户数据。

**机器只核对结构、绑定和 Git 状态，未自动访问证据 URL、下载/校验公网归档、重构建源码或鉴定人工审批真伪。** 对这些事实作出 `passed` 结论前，所列审核人必须完成实际操作并保存证据。普通 HTTPS 字段不是公网可访问性的机器认证。镜像生成后还须将实际 app/docs digest、代理制品哈希与该记录关联，按相同映射部署并回读 app/worker 同 digest 和用户源码入口。

## 本地和 SSH 发布入口

从待发布干净 checkout（含正确 tag 和完整历史）执行两个阶段，JSON 文件放在 checkout 外。构建前：

```text
node scripts/check-goldcube-release.mjs --phase prebuild --record /secure/prebuild.json --tag goldcube-v0.0.7-custom.N --commit <完整应用SHA> --repository fandy20082008/GoldCube --image ghcr.io/fandy20082008/<app-image> --component app
```

构建完成并填入实际制品后，部署前必须执行：

```text
node scripts/check-goldcube-release.mjs --phase deployment --record /secure/deployment.json --prebuild-record /secure/prebuild.json --tag goldcube-v0.0.7-custom.N --commit <完整应用SHA> --repository fandy20082008/GoldCube --image ghcr.io/fandy20082008/<app-image> --component app
```

检查退出码为 0 **且**输出 `deploymentReady:true`；prebuild 退出 0 仍为 `deploymentReady:false`，不能放行部署。文档镜像把组件改为 `docs` 并使用对应镜像目标。SSH/本地手动发布还必须执行代理本仓 release 检查和既有质量门禁，由实际发布负责人复核证据、留存两阶段原始清单哈希及最终 digest，部署后回读运行版本；不得在远程执行旧脚本跳过。命令本身不上传、不构建、不部署，也不能阻止持有 SSH 权限者绕开流程。

`node --test scripts/check-goldcube-release.test.mjs` 使用本地 Git fixture 验证拒绝错误 tag/commit、脏树、空/上游镜像目标、未知来源或不完整供源记录；不会访问公网、生产或执行真实镜像构建。

## 其他检查与尚未启用的远端强制措施

- `quality.yml`：主应用及文档格式、类型、测试与构建。
- `source-provenance.yml`：旧 AGPL 基线、已提交 HEAD 的 LICENSE、完整可达历史和受限提交检查；不单独构成发布许可。
- `node scripts/check-source-baseline.mjs` 与 `node --test scripts/check-source-baseline.test.mjs` 可本地检查。浅克隆、缺对象、历史损坏/grafts 或命令异常均失败；不能删除失败条件放行，也不自动 fetch 当前上游。

本地文件完成不代表 GitHub 已执行。远端自有仓库、受保护环境的真实审批人、必要检查/分支保护、镜像目标权限及首次非生产失败/成功演练均未配置或核验。当前两工作流未宣称已启用受保护审批环境；首次运行前必须由负责人补齐平台约束。机器记录校验不能代替平台权限边界和人工责任；全量来源、用户供源与真实浅历史缺口未解决时禁止新增对外发布。
