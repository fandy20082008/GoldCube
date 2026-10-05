# CHANGELOG

## Unreleased

## v0.0.7-custom.15

- Allow harmless punctuation, quote and whitespace differences in drama source fragments while rejecting lost, repeated or reordered content.
- Run adaptive left and right segmentation concurrently, await both before refunds, and log only content-free analysis timing and outcome metadata.

## v0.0.7-custom.14

- Preserve streamed text whitespace and prevent nested JSON from replacing an incomplete root.
- Reject incomplete structured text output with clear failure feedback; retain refunds and explicit user retries.
- Add content-free output-shape and completion diagnostics. Gateway and customer data remain unchanged.

## v0.0.7-custom.13

- Keep drama analysis failures visible per episode and restore billing after interrupted text responses. The default text deadline is ten minutes; shorter configured deadlines still apply. Transport failures do not automatically switch channels and resubmit.
- Activate the already-published removal of bundled aggregate prompt seeds, automatic synchronization and the dedicated cover proxy. Preserve existing records and user-created/imported prompts.
- Activate the already-published removal of WASM face/expression and subject-segmentation assistance. Preserve manual canvas tools and ordinary generation.
- Expose immutable corresponding sources for the actual application and Gateway deployment. Bind a locally built OCI artifact without claiming registry publication; the documentation service is not deployed.
- Native libvips source/relinking delivery work remains deferred by the project owner for this release. This is an outstanding delivery item, not a completed compliance check.


- Fix missing refunds after interrupted drama analysis when internal HTTP responses use Undici Headers; cover content and visual analysis at zero and nonzero cost. No new dependency or license change.

- Short-drama analysis now retains failure details per episode and stage. Interrupted text requests avoid automatic resubmission, preserve refund identity, and emit sanitized analysis diagnostics.

- 开源复核 10：修复 Gateway 规范归档的 Git 换行配置依赖；按老板确认落实其自有代码 AGPL-3.0-only 许可和第三方声明，建立逐文件权利/隐私处理表。材料与历史未知项仍阻断公开，未部署。

- Homepage: add English main-application license and dual-repository GitHub links after the existing copyright (local, not deployed).

- 本地实现双仓对应源码入口及运行版本绑定；补充受控旧基线取证、代码/素材来源盘点和候选/历史秘密扫描。公开权利、图片隐私和 Gateway 许可仍有缺口，候选包及隔离构建按实际结果单列，未上传或部署。

- 修复剧本整理内层文本超时与失败用量撤销：文本默认及最大等待按用户确认设为 10 分钟，支持更短管理员配置；读体中断不自动重发，失败回传余额。尚未部署。
- 固定主应用 GoldCube 与代理外壳 GoldCube-Gateway 的双仓映射，统一清单区分构建前审核和实际制品部署验收；补齐源码入口设计。源码与历史审核、实际供源和远端保护仍待完成，本次无业务部署。
- 补齐开源治理复核发现的实际升级脚本、代理独立检查和镜像发布入口遗漏；统一精确 GoldCube 标签的受控手动发布，缺来源/对应源码证据时阻断。远端保护、公开供源和历史审核仍待完成。

- 固定旧 AGPL 基线，接入来源声明、本地 Git 证据门禁和逐版源码交付验收；默认上游升级改为许可来源审核前置。公开源码、历史来源补审及远端分支保护仍待完成，不涉及业务部署。

- 修复剧本整理长等待被前置代理截断及 Agent SSE 心跳被全文缓冲；等待光晕位移速度提高为原来的 2 倍。已发布 custom.12；包含生产标识的验收与回滚记录保存在私有运维资料中。

- 普通图片结果增加上游 URL 检查点，处理或保存异常可恢复同一结果，并增加脱敏诊断；栈溢出具体触发点仍在调查；保护性修复已发布 custom.11。

- [支付] `.10` 已部署：充值中心人工渠道的固定卡密商城地址更新为 `https://catfk.com/shop/5TB4O8L4/ld8y4z`；仅修改 `manual` 模式的跳转地址，其它支付渠道交互保持不变。按要求未另行执行测试与线上验证，直接回滚版本为 `.9`。

- [支付] `.9` 已部署：充值中心的人工渠道改为“卡密购买”，展示兑换说明，点击“确认并购买”直接在新窗口打开固定卡密商城，不创建平台支付订单；支付宝、微信、Stripe、PayPly 等其它支付渠道继续使用原结算流程。镜像 digest `sha256:8a67bc468f923a950baee656b2f128249590313102094ea25df92f9107630f83`，直接回滚版本为 `.8`。

- [Agent] `.8` 已部署：新上传的图片和视频草稿立即进入 `@` 素材候选；输入 `@` 或点击输入框下方的引用按钮均可选择，无需先发送、刷新或等待资产列表重新加载。已持久化资产与草稿按 ID 去重。镜像 digest `sha256:8d6005301b5f6dba132c3de6a7c29259bb49a0ae28198c4c62cd529d9dd21be1`，直接回滚版本为 `.7`。

- [Agent] 当真实图片或视频资产已经落库、父 Run 仍短暂处于 running 时，结果区立即显示真实媒体并隐藏等待光晕，避免完成边界同时显示占位与结果。
- [诊断] 核实 Agent 的 TTP-grok 任务：平台偏好、规划任务和渠道模板均保留 `16:9 / 720 / 15秒`，模板按最新文档使用 `ratio`；上游实际返回 H.264 `960x960`、15.042 秒并含 AAC 音轨。比例与清晰度偏差发生在上游，平台未改用无文档依据的字段或伪造百分比进度。
- [Agent] `.7` 已部署：图片或视频真实资产已经保存时，即使父 Run 短暂仍为 `running`，也立即用真实结果替换等待动效，不再等待 Run 状态收口或刷新页面。镜像 digest `sha256:ba4dd586723bd7dd45ae328f15e646bc8a2e69cac19eb8814064f3c3aa259dd5`，直接回滚版本为 `.6`。

- [视频] `.6` 已部署：自动等待统一为累计 30 分钟，提交与查询共享截止时间；上游明确失败立即终结，包括 HTTP 错误响应中的任务失败状态。截止仍未知时停止等待并保留原任务供检查，不重复生成。镜像 digest `sha256:be1d7226ea1d3009c5c766b068a464fbd72835f508decd31be5bad6a7d3efd43`。

- [Agent] `.5` 已部署：修复 Agent 模式媒体等待动效仍可能需要刷新。客户端现在从 `run.planned`、`run.snapshot` 和断线后的 Run 对账同步任务类型，状态表缺少当前 Run 时也会自动回填。图片和视频任务在规划确认后自动显示动效，纯文本对话不会显示，完成后仍由持久化资产替换等待态。提交 `4227f3a`，镜像 digest `sha256:364da5cfdb4ea9b2e692ac61c474b249a5f38db318f87cebca7d4cbbfb22a183`，直接回滚版本为 `.4`。

- [Agent] `.4` 已部署：智能模式从 `run.planned.tasks` 实时识别图片/视频并显示等待光晕；媒体子任务终态立即唤醒父 Agent，避免结果回显再等待最长 25 秒。发布提交 `f644abf`，镜像 digest `sha256:bbab574495fb69176a72eee9551113ff8f119ac3d3fd184671ec1cd45542ce83`，app/Worker 同 digest，PostgreSQL 未变。

- [Agent] 修复智能模式规划出图片或视频任务后等待光晕不显示：客户端从 `run.planned` 事件读取经过白名单过滤的任务摘要并同步当前 Run，显式生成模式为空时也能按任务类型在同页立即显示图片或视频等待态；完成后继续先刷新持久化消息与资产，再自动替换为真实结果。代码断点为 `e1f0209`，当前云端尚未更新。

- [性能] 媒体子任务完成、失败或进入人工检查后立即唤醒所属 Agent，并在同一 Worker 批次中先落库子任务结果再恢复父 Agent，避免父任务恰好错过结果后继续等待最长 25 秒；不增加图片或视频上游查询频率。

- [Agent] 修复图片/视频等待光晕仅在刷新后显示：发送时立即创建本地临时 Run 并随 SSE 同步状态，服务端 Run 返回后原子替换；任务完成时先刷新持久化消息与资产，再从等待态切换为真实结果。

- [Agent] 图片或视频生成处于规划、排队或运行状态时，在对话结果区显示稳定 16:9 的缓慢动态光晕占位；完成、失败、暂停、文本和音频任务不显示。动效适配浅深主题与减少动态偏好，移动端保持容器内响应式宽度。

- [视频] 根据最新上游接口文档更新云端 `SD 自定义协议` 渠道：启用 `Bwan-3.0`、`Cseadanco2.0K2`、`Cseadanco2.5K`、`Fmini`、`TTP-grok` 五个视频模型，统一使用 `/videos` 创建、`/tasks/:task_id` 查询和不含 `negative_prompt` 的参考图数组模板。模型绑定、密钥、计费、代码及其它渠道未变，未执行真实生成任务。

- [视频] 补齐显式启用媒体上传的自定义渠道参考图链路：先上传素材，再用返回 URL 创建视频；修复单大括号模板及数组类型，上传失败或模板遗漏图片时阻止提交。GCAI 已上线，单次真实单图视频已完成并验证画面采用参考商品，相关测试与验收边界见 BUG-14。

- [视频] 修复运行环境已配置公网域名、内部 Agent 却仍生成本地参考素材地址的问题：公开地址改为服务端运行时读取，Worker 恢复入口统一解析；生产构建增加真实编译模块的动态域名检查。GCAI 已上线，截图原图公网读取通过，真实计费视频终态未执行。

- [图片] 同步图片结果的防御性兜底已上线：若 `file-type` 已确认原始字节为 `image/*`，且 Sharp 精确抛出 `Maximum call stack size exceeded`，保留原始字节继续落盘；其它异常仍失败。源码提交 `95022a0`；因 Docker Desktop BuildKit 容器内长步骤 EOF，改由宿主机 production build 加已验证 v5 Linux 运行时组装镜像。GCAI app/Worker 已切至 `vozeb-pro:sharp-stack-overflow-fix-20260913`（`sha256:6ffc1d5d11e022a7d8ac8c3ce9d7d9e11d36ab484159261f5e7b78f8ba967981`），health/ready/Worker 心跳/依赖门禁通过，PostgreSQL 与数据卷未动。未自动发起计费任务，真实新任务终态待授权复核。
- [延迟] 新任务时间线显示平台创建到提交上游约 77ms，约 54–57 秒是上游生成耗时；另有首次 Agent 规划失败后约 65 秒人工重试间隔，暂未发现平台提交队列延迟。

- [图片] 修复 GEEK 生图渠道 `gpt-image-2.5-flare` 参考图编辑的 `Maximum call stack size exceeded`：目标渠道顶层、3 个图片模型和 4 个 operation 配置共 8 处协议从 `newapi` 精确调整为 `auto`，保留 `/images/edits`、`/images/generations` 和参考图能力；生产数据库即时生效，未改镜像、密钥、其它渠道或 PostgreSQL。旧任务使用旧配置快照，需新建任务做最终终态验证。

- [部署] 完成多渠道视频参考素材公共链路 v5 镜像闭环：GCAI app/Worker 同 digest，PostgreSQL 与数据卷不动，ready/health/心跳/依赖门禁通过；保留上一稳定镜像与数据库回滚基线，清理旧镜像和残包。真实计费视频终态待上游恢复后验证。

- [视频] 修复所有视频渠道共用的参考素材归一化问题：已完成 `provider-read` 签名的站内 PNG/JPEG 不再被二次回源读取，未签名站内素材仍严格受控读取与重签；本地专项测试 9/9、相关 Agent 回归 88/88 通过；新镜像已部署到 GCAI，生产签名素材回读 HTTP 200。真实视频终态待上游恢复后验证。`SD自定义协议` 模板和 `/v1/media` 地址另有独立配置风险，本轮未混改。
- [Agent] 修复智能规划未明确选择视频模型时绕过后台默认模型的问题；普通聊天仅在安全边界内允许自然语言回退，生成任务仍严格校验结构化计划。云端部署待恢复 SSH 并在上游解除限流后进行。
- [工程] 建立官方版本与 GoldCube 二开分支的升级隔离流程，补充升级门禁、不可变镜像和回滚资产规则。

## v0.0.7

- [回归修复] 恢复短剧“本集设置”按钮收缩面板，并修复模型能力档案误隐藏 2K/4K 尺寸预设。
- [Agent] 统一三类 Agent 规划，支持精简上下文和安全流式响应。
- [短剧] 支持 Word、多集管理，并优化分析、审核、分镜和生成。
- [Canvas] 完善分层、去背、图生视频、整理、下载和大画布性能。
- [生成] 增加 2K/4K，修复比例、参考图、多结果、重试与计费，并缩短结果等待。
- [系统] 完善模型接入、媒体存储、移动端体验及授权声明。

## v0.0.6

- [首页] 重做公开首页首屏、导航、输入体验和作品展示；作品随机读取作品广场的图片与视频，点击即可预览，并完成手机端与浅深主题适配。
- [创作] 统一 `/create` 的 Agent、图片、视频和音频创作入口，保留附件、Skill、智能规划、模型与生成参数；结果展示、素材引用、历史恢复和失败重试更加清晰稳定。
- [Canvas] 升级自研画布、节点编辑、连线、框选、项目保存与 Agent 协作，完善素材引用、视频首尾帧和服务端持久化。
- [短剧] 重构短剧生产工作区，收敛剧本、内容审核、分镜和镜头生成四个阶段，并将角色、场景、道具等统一放入项目资产管理。
- [生成] 完善文本、图片、视频和音频任务状态、上游协议与异常处理，支持多结果、明确审核原因，并避免重复生成和重复扣费。
- [后台] 优化模型渠道、生成运维、成本保护、数据维护、支付与经营看板，后台权限和移动端布局同步收敛。
- [安全] 新增管理员 TOTP MFA、注册协议确认、请求级 CSP nonce 与脱敏审计，强化账户、媒体、备份和部署安全边界。
- [性能] 优化 Worker 调度、服务端分页、PostgreSQL 定向查询和长会话加载，降低后台与创作页面的无效请求。

## v0.0.5

- [安全] 修复 CodeQL 报告的 10 条代码扫描告警：图片内部请求统一走受控传输，外部媒体继续执行 DNS/IP 固定和重定向校验；渠道域名使用结构化 URL 匹配，协议 HTML 文档通过解析器提取可见文本，验证码使用无偏加密随机数，提示词标题实体只解码一次。
- [Skill] 新增 Agent Skill 改为在关闭弹窗前直接保存到服务端，保存失败会保留当前表单供重试；离开后台、进入工作台、刷新或重新返回后不再丢失。
- [界面] `/create` 灵感发现、作品广场、个人作品与创作者主页统一使用横向优先的响应式瀑布流：首批作品从左到右铺满当前行，后续作品进入当前最短列，桌面不再只占左侧一列。
- [工程] 更新 Web 运行与开发依赖、Docs Fumadocs 与搜索引擎，并同步 Gitleaks 固定提交；Dependabot 只自动分组可验证的小版本，暂缓当前工具链、Actions 和 Docker Node 的不兼容主版本升级。

## v0.0.4

- [工作台] 图片与视频结果框按当前创作对话展示全部独立生成轮次，新建对话才清空结果；历史卡汇总该对话全部结果和耗时，后续输出不自动改标题；图片桌面端一行 4 个并自动换行，刷新、跨轮次选择、删除和重试保持稳定记录关联。
- [工作台] 图片输入在 React 水合前已经填写时会接管 DOM 草稿，首次登录 Session 水合不再清空；公共模型目录就绪后才开放生成。同一对话连续两轮结果与公开消息在刷新后完整恢复，视频工作台同样按稳定 `creativeConversationId` 恢复成功、失败和生成中结果。
- [Agent] 生图与视频工作台的规划和任务提交由同一请求链收口，任务创建后不再残留“思考中”；站内永久参考图直接复用稳定 URL，服务端按上游协议转换为 URL、multipart 或 base64。
- [Agent] 未显式选择 Skill 时规划器不再自动注入普通 Skill，默认提示词优化与智能规划保持不变；离开或刷新创作页后自动恢复最近运行中的原会话，工作台任务可返回对应 Agent 对话。
- [模型] 公共模型目录在后台配置变化和页面重新可见时刷新；生图工作台只展示图片模型，视频工作台只展示视频与音频模型，统一 Agent、Canvas 和短剧按实际能力展示。
- [图片] OpenAI 图生图使用官方 `/v1/images/edits` multipart，Sub2API 使用 `image_urls`，Stable Diffusion 使用内联 `init_images`，Gemini 使用 `inlineData`；上游一次返回多张图片时完整保存，并在图片工作台、Canvas 和短剧候选资产中展示全部结果。
- [视频] 视频请求使用跨运行时 Undici multipart，提交前预占并发槽，快速重复点击只创建一个任务；刷新后可继续查看或取消原任务，参考素材不再误发为 `text/plain` 或 `[object FormData]`。
- [生成] 修复 Docker 和代理环境中长耗时生成被 Undici 默认 5 分钟响应超时提前中断的问题；系统代理、生成 Route、页面恢复和 Worker 生命周期覆盖最长视频请求及落盘余量，原业务超时与上游协议保持不变。
- [上游] `chatgpt2api` 按标准 OpenAI 兼容协议请求，不新增专用协议或猜测异步查询路径；图片接口仅返回任务 ID、网页内容或无效 JSON 时保留原任务进入待确认，不切换渠道、不退款、不重复创建。
- [积分] 修复 PostgreSQL 当日钱包的小数余额参数被误推断为整数的问题，`1.7/1.8` 等小数模型价格不再导致普通用户扣费返回 500。
- [计费] AI 消费幂等键由服务端绑定用户、业务请求、逻辑模型、渠道、上游模型和调用类型生成，客户端请求头不能控制本地流水；参数冲突返回 409，零积分调用继续记录并支持失败撤销。
- [支付] 上游表单只在服务端解析为受控 action、method 和隐藏字段，并从当前用户订单读取已保存参数；带动态 CSP 和一次性 nonce 的隔离页自动提交，生产环境拒绝公网 HTTP 支付地址，Checkout 使用统一业务响应。
- [Canvas] 项目列表和素材弹窗使用服务端分页，删除、新增或越界页会重新对齐；保存请求携带最后确认版本，PostgreSQL 与文件 Provider 均拒绝旧快照，版本时间严格单调递增。
- [数据] Agent 对话和 Canvas 删除改为服务端聚合硬删除：关联消息、Run、任务和生成记录不会在刷新后恢复；独占媒体随之回收，仍被素材库、其他项目、头像或作品引用的媒体继续保留。
- [数据库] PostgreSQL 在线读取收敛为实体、状态、分页和聚合查询；完整认证、提示词、生成记录与注销快照只允许备份事务使用，媒体过期清理和对象存储迁移改为有界批次。
- [备份] 后台业务 JSON 导入固定为无删除的账号配置恢复：PostgreSQL 使用表锁、事务和实体 upsert，文件 Provider 写入失败回滚全部原文件；不完整业务包不能冒充整库灾难恢复。
- [后台] 渠道管理取消探测、批量检测、能力验证和验证记录；管理员通过用户工作台真实请求验证能力，运行时自动故障切换和只读健康统计保持不变。
- [Skill] GitHub 公开 Skill 固定到不可变 commit、校验内容哈希并默认停用，不因缺少 SPDX 许可证拒绝导入；后台文本模型将内容整理为中文用途、关键词、工作区和项目原生规则，安装命令、脚本、环境变量、外部 API 与密钥示例不直接进入表单。
- [界面] 套餐选择弹窗按商品数量自适应宽度，移除重复标题与无意义周期占位，压缩价格、积分、权益和操作区；最多 8 个套餐保持桌面紧凑多列与 390px/430px 单卡切换。
- [界面] Agent Skills 桌面卡片使用独立双列流，长规则内容不再撑高相邻卡片；移动端保持单列。
- [构建] 默认构建按环境可用资源执行，不再强制单 Worker 或固定 Node 堆；仍支持 `NEXT_BUILD_CPUS` 和 `NODE_OPTIONS` 显式限制。Web 与文档站固定 Next.js 追踪及 Turbopack 根目录，避免临时根锁文件改变 Standalone 入口。
- [构建] Linux Standalone 会把当前平台的 Sharp 与 libvips pnpm 原生包复制到独立产物，避免服务启动后因缺少 `libvips-cpp` 使 API 返回 500；多架构镜像完整读取 Buildx inspect 输出后再提取 digest，避免 `pipefail` 将成功推送误判为失败。
- [工程] 根目录、CI、Web 与 Docs 统一使用 pnpm 11.9.0；新增 ESLint、Playwright E2E、Dependabot、CODEOWNERS、Issue/PR 模板和第三方许可证清单，发布检查覆盖审计、格式、测试、类型、生产构建和 Standalone 产物。
- [供应链] 固定已修复的 `brace-expansion` 2.1.4/5.0.9、Undici 8.9.0/7.29.0，并更新 `fast-uri`、`hono` 与 `ip-address`，消除已披露的拒绝服务、缓存解析、请求走私、CRLF、SSRF 与 ReDoS 风险。
- [供应链] Docker 镜像仅在正式 Tag 门禁通过后发布 `latest`，同时生成 SPDX SBOM、对不可变 digest 签名并附加证明。

- [安全] 系统渠道代理只允许已绑定逻辑模型的受控创建、查询和取消路径，未知方法、路径、模型或计费类型会在调用上游前拒绝；公开 Session 改为显式字段白名单，认证限流组合可信代理 IP、账号与设备，密码重置不再暴露邮箱是否存在。
- [数据库] PostgreSQL 用户、Session、邮箱验证码、积分、CDK 和公告写入改为实体级 Repository 与事务更新，积分并发使用行锁和幂等流水，停止用完整认证快照覆盖在线数据。
- [工程] 短剧项目页的 Header 和剧本编辑区拆为同目录职责组件，并覆盖桌面与移动端真实项目回归。

## v0.0.3

- [Agent] Agent 规划兼容 Chat Completions、Responses、Gemini 和声明式自定义协议。文本候选最多等待 3 分钟，失败后自动切换健康绑定；多结果按完成顺序返回，内部规划与复盘内容不进入用户对话。
- [生成] 图片、视频和音频任务由持久化 Worker 执行，支持任务租约、心跳检查、HMAC 回调与 PostgreSQL 跨实例通知。视频任务最多等待 30 分钟，查询中断后继续复用原上游任务 ID，仅在上游明确失败后开放手动重试。
- [上游] 协议中心支持 OpenAI、Gemini、Seedance 2.0、Stable Diffusion、A1111/Forge 和自定义创建、查询、取消协议。Seedance 2.0 特价协议使用独立内容端点回退，不改变官方 NewAPI；同名模型可跨渠道合并绑定。
- [创作] 图片、视频、Canvas 和短剧统一尺寸优先级、参考素材复用、失败重试和历史恢复规则。相同提示词的主动提交分别保留，手动重试在原记录中继续；视频时长按最终渠道能力归一化，精确图片输出按目标宽高规范化。
- [Canvas/短剧] Canvas 使用摘要列表加载并隔离损坏媒体，图片比例、节点拖动、全景查看与定位操作保持一致。短剧支持并发退避续排、分镜图片/视频预览及 FFmpeg/FFprobe 能力检查。
- [作品] 作品模块包含草稿、版本审核、发布分享、广场检索、内容治理和作者主页。公开互动提供点赞与关注，发布记录支持下架、重新上架和保留源素材的永久删除。
- [商业] 套餐促销、优惠券和邀请奖励形成完整使用链路。支付系统支持支付宝官方支付与当面付、渠道锁定、金额和币种校验、幂等回调、整单退款及对账，并提供 Stripe、支付宝、微信 Native 与 PayPly 协议适配。
- [后台] 管理后台按九个业务分组组织导航，并提供生成运维、公开账号 ID、作品与媒体管理、人工接管及移动端布局。有效套餐用户的主操作显示为“续费套餐”。
- [界面] 首页入口依次为“Agent 创作、生图工作台、短剧项目、作品广场”。作品发布入口仅对登录用户显示；“我的素材”使用紧凑卡片和弹窗详情，生成与审核状态、复选框、媒体查看器和图标按钮适配浅深主题；统一创作入口的 Skill 分类支持正常点击筛选。
- [安全] 私有媒体支持用途绑定签名、分层限流、Range/ETag/HEAD 请求和引用删除保护。主应用与文档站的依赖审计及 CI 发布检查会阻止中危及以上已知漏洞进入发布流程。
- [性能] 素材、Canvas、公告和会话采用服务端分页或摘要/详情分离；短剧成本与财务摘要使用 PostgreSQL 定向聚合，减少页面请求、数据库连接占用和重复查询。
- [工程] 移动端工作区导航会在路由变化后自动关闭。生产构建将 TypeScript 检查与 Next.js 构建分进程执行，降低 1GB 内存环境的峰值占用；Compose 与 Render Blueprint 均包含主应用、Worker、数据库、健康检查和持久卷配置。生产镜像携带当前 CPU 架构对应的 Sharp 与 libvips 原生运行库，并在构建阶段验证 Sharp 可加载。
- [安装] 0.0.3 不支持沿用 0.0.2 数据库或原地升级。部署前必须删除旧数据库并重新安装项目，再通过 `/install` 完成初始化；安装页会分别生成加密密钥、一次性安装令牌与共享维护令牌。数据库初始化和首个管理员创建必须提交同一安装令牌，公开注册不会自动提升管理员；安装完成后令牌失效并可从 App 环境移除，Worker 不会获得该令牌。
- [品牌/文档] 站点 Logo、ICO、favicon、manifest、登录页、管理后台和助手头像统一使用“无限进化”品牌资源；README、部署说明、API 文档和数据库文档与当前发布保持一致。

## v0.0.2

- [性能] 图片、视频工作台历史从“会话列表后逐条请求消息与附件”的 `1 + 2N` 请求改为单个服务端摘要；PostgreSQL 通过一次用户/来源定向查询返回记录关联与有限搜索文本，文件 Provider 保持同契约。点击记录后才分页加载最新 50 条消息，并支持向前加载长对话且保持滚动位置。
- [性能] 后台财务摘要从订单、支付、渠道和对账四次 PostgreSQL 聚合收敛为一次 CTE 查询，并为订单与支付流水补充独立时间索引；日期筛选不再依赖复合索引前缀。
- [修复] 财务对账异常按真实订单/支付流水粒度计数，同一订单存在多条失败流水时不再重复统计“已支付但缺少成功流水”，已退款订单保留原成功支付流水也不再误报状态异常。
- [性能] `/create` 创作首页底部概览改用单个用户摘要接口；PostgreSQL 只投影最近画布统计、最多 4 条运行任务和 8 条去重媒体，文件 Provider 保持相同契约，不再在首屏拉取全部画布项目和 100 条完整生成日志。
- [性能] 管理后台概览改用近 7 日服务端生成运营摘要；PostgreSQL 通过时间索引和单次聚合 SQL 返回趋势与分布，文件 Provider 保持相同口径。首页不再拉取 80 条完整生成日志、提示词分页或媒体列表，媒体卡片改用 summary-only，生成日志管理页保持原分页与筛选行为。
- [修复] 系统文本调用显式携带逻辑模型计费标识；工作台、统一 Agent 和自动复盘使用区分候选绑定的稳定幂等键，取消请求会中断服务端规划，规划成功但会话或 Run 保存失败会退款；0 积分文本模型的失败调用也会按消费流水撤销套餐次数，避免重复规划、错误别名计价和免费次数未返还导致的扣费偏差。
- [修复] 创作 Agent 图片恢复 `v0.0.1` 的全视口预览：遮罩覆盖完整窗口，原图居中，关闭按钮位于右上角，图片工具栏固定在底部；缩略图尺寸限制不再污染预览弹层。
- [体验] Agent 生成图片和视频卡片按媒体真实宽高比绘制边框，并兼容未保存尺寸的旧记录；缓存图片和已加载视频也能补读原始尺寸，横图、方图和竖图保持紧凑布局。
- [文档] GitHub 首页新增 9 组默认折叠的项目功能流程图，覆盖公开访问、用户工作区、生成链路、Canvas、短剧、支付、商业后台、上游与存储管理及全平台服务端数据流。
- [体验] 创作 Agent 对话内的图片和视频改为紧凑附件预览：单项最大 280px，桌面多媒体双列展示，图片保持原比例并限制超长竖图高度，同时避免底部输入框遮挡媒体标题和操作。
- [修复] Canvas 生成图片节点在未选中时改用当前浅色/深色主题边框，不再以透明边框直接贴在画布上；选中、关联和批量图片状态保持原有高亮规则。
- [修复] 文本等模型扣费统一按逻辑模型 ID 命中后台单价，已有上游模型单价会按启用绑定优先级继续生效；前端预计积分与服务端实扣使用同一价格，后台可完整重置旧别名价格；配置为 0 积分的模型仍执行幂等、套餐次数限制和失败用量回滚。
- [安全] 媒体 WebP 预览宽度收敛为有限档位，本地预览使用有界内存缓存并合并重复转码，S3 首次预览避免并发重复生成；媒体代理补齐同站资源、禁止 MIME 嗅探和禁止索引响应头。
- [修复] 短剧项目保存保留已接受的客户端单调更新时间，并在 PostgreSQL 与文件 Provider 中执行条件更新；多页面并发编辑不再静默覆盖新快照，冲突会提示刷新后重试。

## v0.0.1

- [工程] 修复对象存储迁移测试夹具写死 Windows 路径导致 GitHub Linux runner 误判文件不存在的问题，并为质量、主应用镜像和文档镜像工作流增加清晰运行名称与步骤名称。
- [体验] 版本更新弹窗在 GitHub 私有仓库或网络不可达时继续显示本地版本记录，并明确说明远端暂不可用，不再误报为版本数据失败。
- [文档] README 首屏改为公开首页截图；补充完整用户端、管理后台、平台能力与部署功能清单，以及仓库目录、关键文件职责、参与贡献指南、VOZEB 开源 QQ 交流群、赞助二维码和项目致谢；公开文案统一使用“画布”和“VOZEB PRO”，并移除旧 QQ、爱发电及未确认的 Telegram/X/Instagram 默认入口。
- [首发] 发布统一 AI 创作工作台，包含 Agent 对话、图片工作台、视频工作台、画布、短剧生产线、提示词和服务端素材库。
- [Agent] 支持服务端创作会话、Skill、智能规划、手动逻辑模型、多参考素材、幂等 Run、SSE 恢复、任务重试和简洁生成结果；平台提示词、模型理由和内部复盘不写入生成型对话。
- [生成] 文本、图片、视频和音频统一通过服务端逻辑模型路由与候选渠道执行，支持能力校验、异步轮询、失败退款、积分实时同步和生成记录；单个任务不会自动重复调用上游创建接口。
- [视频] 支持文生视频、图生视频、参考视频/音频、目标时长持久化与结果规范化，并为 GlobalAiOpc 提供隔离的目录、文本、图片和视频协议适配。
- [Canvas] 支持文本、图片、视频、音频和生成节点、连线、缩放、撤销重做、导入导出及 Agent Run 持久化。
- [短剧] 支持剧本分析、内容审核、角色/场景/道具、分镜、镜头生成、配音、字幕、版本、成本、剪映导出和 FFmpeg 合成。
- [数据] PostgreSQL 保存账号、配置、创作会话、Canvas、素材、短剧、任务、积分、订单和运营数据；文件 Provider 作为单机回退，不使用浏览器业务缓存保存项目数据。
- [媒体] 上传和生成媒体按日期时间与 UUID 命名并登记用户、来源、原文件名和业务引用；页面使用 WebP 预览，下载返回原文件；删除前执行跨业务引用保护。
- [存储] 支持服务器本地媒体与 S3 兼容对象存储开关、连接检测、对象管理和本地媒体迁移；开关只影响新写入，历史媒体按登记 Provider 读取。
- [商业] 提供用户、套餐、积分、CDK、商品、订单、支付渠道、退款、对账、财务流水、公告、提示词、生成运营和审计日志后台。
- [账户] 支持注册策略、SMTP、密码重置、个人资料、服务端分页账务记录、数据导出和账号注销申请。
- [备份] 管理后台支持脱敏业务数据导入导出，并明确 PostgreSQL、服务器媒体和对象存储的完整备份边界。
- [部署] 提供标准、宝塔 PostgreSQL、外部数据库和低内存 Docker Compose，以及 Render Blueprint、健康探针、安装向导和首次管理员初始化。
- [文档] 补齐快速开始、配置、生产基线、数据库、项目结构、核心流程图和用户端/公开页/管理后台 42 张脱敏 WebP 功能截图。
