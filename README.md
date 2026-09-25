<p align="center">
  <img src="web/public/logo.svg?v=0.0.7" width="108" alt="VOZEB PRO logo">
</p>

<h1 align="center">VOZEB PRO</h1>

<p align="center">面向统一创作 Agent、Canvas 与短剧生产的开源 AI 创作平台</p>

<p align="center">
  <a href="https://github.com/fandy20082008/GoldCube"><img src="https://img.shields.io/github/stars/fandy20082008/GoldCube?style=flat-square&logo=github" alt="GoldCube GitHub stars"></a>
  <a href="VERSION"><img src="https://img.shields.io/badge/version-v0.0.7-2563eb?style=flat-square" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f97316?style=flat-square" alt="License"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=nextdotjs" alt="Next.js"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat-square&logo=postgresql" alt="PostgreSQL"></a>
</p>

<p align="center">
  <a href="https://www.vozeb.com">演示站</a> ·
  <a href="docs/index.md">文档索引</a> ·
  <a href="docs/content/docs/overview/configuration.mdx">0.0.7 发布说明</a> ·
  <a href="#目录与文件用途">目录与文件用途</a> ·
  <a href="docs/content/docs/overview/page-gallery.mdx">页面图册</a> ·
  <a href="https://linux.do">LINUX DO</a> ·
  <a href="docs/content/docs/business/commercial-license.mdx">上游商业资料</a> ·
  <a href="DISCLAIMER.md">上游免责声明</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a> ·
  <a href="CHANGELOG.md">更新记录</a>
</p>

![VOZEB PRO 首页](docs/public/screenshots/pages/01-home.webp)

图为 VOZEB PRO 上游界面示例，并非 GoldCube 当前界面。

VOZEB PRO 把统一创作 Agent、画布、短剧生产、素材库和商业运营后台放在同一套 Next.js 全栈应用中。PostgreSQL 保存账号与业务数据；媒体可写入服务器本地目录或 S3 兼容对象存储；模型、支付和存储密钥只在服务端使用。

## GoldCube 独立二开说明

本工作分支基于 VOZEB-PRO 旧 AGPL 提交 `04b32d31ca00272e3866c85e9a8329036c63af72`（v0.0.7）独立二开，不代表原作者官方授权商业版，不自动采用当前上游新版本。保留原许可与版权；第三方材料按各自许可证履行义务。具体版本限定按原始授权核对，不自行扩大为 only/or-later。

项目选择自有前端、后端、代理、Worker 和配套构建部署材料完全开源、可商业运营的路线。每个运行版本仍须提供对应的完整源码；仓库说明不能代替实际版本的源码下载与验收。详见 [治理规范](docs/open-source/policy.md) 与 [发布验收模板](docs/open-source/release-checklist.md)。

**法律与联系范围：**仓库根目录保留的 `CLA.md`、`COMMERCIAL_LICENSE.md`、`LEGAL_NOTICE.md` 和 `SECURITY.md` 与旧上游 AGPL 基线原文一致。其中的商业价格、上游邮箱、贡献协议和漏洞响应承诺是原项目历史资料，不是 GoldCube 当前报价、贡献接受条款或报告渠道。GoldCube 的闭源授权权利、收款与商务受理渠道、私密漏洞报告渠道及负责人尚待核实。二开作者邮箱 `fandy2008_2019@qq.com` 仅标识作者，未经确认不能用于付款、授权申请或漏洞报告。请先阅读[商业授权历史说明](docs/content/docs/business/commercial-license.mdx)、[贡献说明](docs/content/docs/business/cla.mdx)及[漏洞报告说明](docs/content/docs/support/security.mdx)；不要按上游资料向 GoldCube 汇款或发送敏感信息。

## 核心功能

- **统一创作 Agent**：文字问答、图片、视频和音频在同一会话中完成，支持参考素材、首帧/首尾帧、Skill、智能规划、手动逻辑模型、比例/画质/时长/数量、自定义像素、多结果、历史恢复、失败重试、WebP 预览和原件下载。
- **画布**：文本、图片、视频、音频与生成节点，支持拖拽、连线、缩放、撤销重做、导入导出和 Agent Run。
- **短剧生产线**：剧本、内容审核、角色/场景/道具、分镜、镜头视频、配音、字幕、版本和 FFmpeg 合成。
- **作品广场**：作品草稿、版本审核、发布分享、广场检索、作者主页、点赞关注、下架重发和内容治理。
- **模型与协议**：管理员维护渠道、协议、真实模型、逻辑模型、能力、优先级和默认值，覆盖 OpenAI、Gemini、Seedance 2.0、Stable Diffusion、A1111/Forge 和声明式自定义协议。
- **持久生成**：独立 Worker 负责图片、视频、音频和 Agent 任务续取，页面关闭或实例切换后继续查询原上游任务，并在生成运维中处理异常任务。
- **商业后台**：用户、套餐、促销、优惠券、邀请奖励、积分、CDK、订单、支付、退款、对账、财务流水、作品治理、公告、提示词和审计日志。
- **存储与备份**：本地媒体、S3 兼容对象存储、引用保护、对象迁移和脱敏业务数据导入导出。

## 开源与上游历史授权

本项目保留旧 VOZEB PRO 的 AGPL-3.0 许可与必要声明。遵守适用的 AGPL-3.0、提供对应源码并保留声明时，可以免费使用和商用。不能履行开源义务而需要闭源许可的，应向有权授权的各权利人取得明确许可；GoldCube 目前不公布独立的闭源授权方案。

根目录的[旧上游商业说明](COMMERCIAL_LICENSE.md)和[未签署协议模板](COMMERCIAL_LICENSE_AGREEMENT.md)仅作为原项目历史材料保留，不构成 GoldCube 的报价或对上游代码的转授权。

## 项目功能流程

所有流程图默认折叠，点击对应标题后即可查看，不会一次展示全部内容。

<details>
<summary><strong>01｜公开页面与登录注册流程</strong></summary>

```mermaid
flowchart LR
    HOME["首页 /<br/>产品介绍、功能入口、公告"] --> ACTION{"访客选择"}

    ACTION --> ANN["公告中心 /announcements<br/>查看置顶公告和平台通知"]
    ACTION --> GALLERY["作品广场 /gallery<br/>浏览、检索和查看公开作品"]
    ACTION --> LOGIN["登录 /login<br/>账号密码校验"]
    ACTION --> REGISTER["注册 /register<br/>注册策略与可选邮箱验证码"]
    ACTION --> FORGOT["找回密码 /forgot-password<br/>邮箱验证码与密码重置"]
    ACTION --> PRIVACY["隐私政策 /privacy"]
    ACTION --> TERMS["服务条款 /terms"]

    GALLERY --> SHARE["作品详情 /share/:slug<br/>预览、点赞、关注和举报"]
    SHARE --> CREATOR["作者主页 /u/:username<br/>查看公开作品"]

    REGISTER --> LOGIN
    FORGOT --> LOGIN
    LOGIN --> SESSION["创建登录 Session"]
    SESSION --> ROLE{"账号角色"}
    ROLE -->|普通用户| USER["用户工作区"]
    ROLE -->|管理员| ADMIN["商业 SaaS 管理后台"]

    INSTALL["安装向导 /install"] --> CHECK["检查运行环境和 PostgreSQL"]
    CHECK --> SCHEMA["初始化数据库表结构"]
    SCHEMA --> FIRST_ADMIN["创建首个管理员"]
    FIRST_ADMIN --> ADMIN
```

</details>

<details>
<summary><strong>02｜用户工作区页面导航</strong></summary>

```mermaid
flowchart TB
    USER["用户工作区<br/>加载用户、积分、模型和站点配置"]

    USER --> CREATE["统一创作 Agent /create<br/>文本、图片、视频、音频与服务端会话"]

    USER --> CANVAS["Canvas 项目 /canvas<br/>创建、搜索、重命名和删除"]
    CANVAS --> CANVAS_ID["Canvas 编辑器 /canvas/:id"]

    USER --> DRAMA["短剧项目 /drama<br/>项目和生产进度管理"]
    DRAMA --> DRAMA_ID["短剧编辑器 /drama/:id"]

    USER --> PROMPTS["公共提示词 /prompts"]
    USER --> MY_PROMPTS["我的提示词 /my-prompts"]
    USER --> ASSETS["我的素材 /assets"]
    USER --> HELP["帮助中心 /help"]
    USER --> PROFILE["个人中心 /profile"]
    USER --> BILLING["充值中心 /billing"]

    PROMPTS --> CREATE
    MY_PROMPTS --> CREATE
    ASSETS --> CREATE
    ASSETS --> CANVAS_ID
    ASSETS --> DRAMA_ID
```

</details>

<details>
<summary><strong>03｜统一创作 Agent 生成流程</strong></summary>

```mermaid
flowchart TB
    START["用户输入文字或参考素材"] --> AGENT["统一创作 Agent /create"]
    AGENT --> CONTROL["选择 Skill、智能规划或逻辑模型"]
    CONTROL --> PARAM["设置图片、视频或音频生成偏好"]
    PARAM --> CHECK["能力、素材、参数与积分校验"]

    CHECK --> ROUTER["逻辑模型路由"]
    ROUTER --> CREATE_TASK["创建幂等生成任务"]
    CREATE_TASK --> PROVIDER["调用文本、图片、视频或音频上游"]
    PROVIDER --> POLL["查询同一个上游任务"]
    POLL --> RESULT{"任务结果"}

    RESULT -->|成功| NORMALIZE["下载并规范化媒体"]
    RESULT -->|失败| FAILED["保留失败记录并退款"]
    FAILED --> RETRY["用户主动点击重试"]
    RETRY --> CREATE_TASK

    NORMALIZE --> SAVE["登记媒体归属和稳定地址"]
    SAVE --> MESSAGE["返回当前创作会话"]
    MESSAGE --> OPERATE["预览、下载、保存素材或继续创作"]
```

</details>

<details>
<summary><strong>04｜Canvas 创作流程</strong></summary>

```mermaid
flowchart LR
    LIST["Canvas 项目 /canvas"] --> CREATE["创建画布"]
    LIST --> SEARCH["搜索项目"]
    LIST --> RENAME["重命名项目"]
    LIST --> DELETE["删除项目"]
    LIST --> OPEN["打开项目"]

    CREATE --> EDITOR["Canvas 编辑器 /canvas/:id"]
    OPEN --> EDITOR

    EDITOR --> NODE{"添加节点"}
    NODE --> TEXT["文本节点"]
    NODE --> IMAGE["图片节点"]
    NODE --> VIDEO["视频节点"]
    NODE --> AUDIO["音频节点"]
    NODE --> GENERATE["生成节点"]

    TEXT --> CONNECT["拖拽、缩放和节点连线"]
    IMAGE --> CONNECT
    VIDEO --> CONNECT
    AUDIO --> CONNECT
    GENERATE --> CONNECT

    CONNECT --> AGENT["启动 Canvas Agent Run"]
    AGENT --> PLAN["分析节点和连接关系"]
    PLAN --> TASK["创建图片、视频或音频子任务"]
    TASK --> RESULT["结果写回对应节点"]
    RESULT --> HISTORY["撤销、重做和历史记录"]
    HISTORY --> SAVE["自动保存到服务器"]
    SAVE --> EDITOR
```

</details>

<details>
<summary><strong>05｜短剧生产流程</strong></summary>

```mermaid
flowchart LR
    LIST["短剧项目 /drama"] --> CREATE["创建短剧项目"]
    CREATE --> CONFIG["设置剧集数、画幅和镜头"]
    CONFIG --> EDITOR["短剧编辑器 /drama/:id"]

    EDITOR --> SCRIPT["第一阶段：生成或编辑剧本"]
    SCRIPT --> REVIEW["第二阶段：内容审核和人工确认"]
    REVIEW --> STORYBOARD["第三阶段：分镜和镜头设计"]
    STORYBOARD --> SHOTS["第四阶段：生成镜头图片和视频"]

    SHOTS --> AUDIO["生成配音、音效和背景音乐"]
    AUDIO --> SUBTITLE["生成并校对字幕"]
    SUBTITLE --> VERSION["保存剧本、分镜和媒体版本"]
    VERSION --> COMPOSE["使用 FFmpeg 合成成片"]
    COMPOSE --> CHECK{"合成结果"}

    CHECK -->|成功| EXPORT["预览并导出成片"]
    CHECK -->|失败| FIX["定位失败镜头或音频"]
    FIX --> SHOTS
```

</details>

<details>
<summary><strong>06｜提示词、素材、账户和支付流程</strong></summary>

```mermaid
flowchart TB
    PROMPTS["公共提示词 /prompts"] --> FIND["分类、标签和关键词检索"]
    FIND --> USE["用于统一 Agent 创作"]

    MY["我的提示词 /my-prompts"] --> MANAGE["创建、编辑、分类、标签和删除"]
    MANAGE --> SAVE_ASSET["保存为文本素材"]
    MANAGE --> USE

    ASSETS["我的素材 /assets"] --> FILTER["按图片、视频、音频和文本筛选"]
    FILTER --> PREVIEW["预览或下载"]
    FILTER --> CONTINUE["发送到 Agent、Canvas 或短剧"]
    FILTER --> DELETE["检查业务引用后删除"]

    HELP["帮助中心 /help"] --> GUIDE["查看 Agent、图片、视频、Canvas、短剧和账户说明"]

    PROFILE["个人中心 /profile"] --> INFO["修改资料和密码"]
    PROFILE --> RIGHTS["查看积分、套餐、订单和消费记录"]
    PROFILE --> EXPORT["导出个人数据"]
    PROFILE --> CANCEL_ACCOUNT["提交账号注销申请"]
    CANCEL_ACCOUNT --> ADMIN_REVIEW["管理员受理或拒绝"]

    BILLING["充值中心 /billing"] --> PRODUCT["选择套餐或积分商品"]
    PRODUCT --> ORDER["创建待支付订单"]
    ORDER --> CHECKOUT["订单支付 /billing/checkout"]
    CHECKOUT --> CHANNEL["选择可用支付渠道"]
    CHANNEL --> PAY{"支付结果"}

    PAY -->|成功| SUCCESS["支付成功 /billing/success"]
    SUCCESS --> CONFIRM["确认支付回调和订单状态"]
    CONFIRM --> GRANT["套餐或积分入账"]
    GRANT --> REFRESH["刷新用户余额和订单记录"]

    PAY -->|取消或失败| CANCEL["支付取消 /billing/cancel"]
    CANCEL --> CHOICE{"订单处理"}
    CHOICE -->|继续支付| CHECKOUT
    CHOICE -->|放弃支付| CLOSE["关闭或保留待支付订单"]
```

</details>

<details>
<summary><strong>07｜商业 SaaS 后台经营和财务流程</strong></summary>

```mermaid
flowchart TB
    ADMIN["管理后台 /admin"] --> ANALYSIS["经营分析"]
    ADMIN --> PRODUCT["商品运营"]
    ADMIN --> FINANCE["财务管理"]

    ANALYSIS --> OVERVIEW["经营看板<br/>用户、收入、积分负债、订单和生成指标"]
    ANALYSIS --> USERS["用户运营<br/>创建用户、角色、状态、套餐和积分"]
    ANALYSIS --> LOGS["调用记录<br/>用户、入口、模型、状态和失败原因"]
    ANALYSIS --> GENERATION["生成运营<br/>任务查询、取消、失败记录和重试"]

    PRODUCT --> PRODUCTS["套餐管理<br/>商品价格、权益、支付类型和上下架"]
    PRODUCT --> ORDERS["订单管理<br/>查询、人工完成、关闭和退款"]

    FINANCE --> POINTS["积分规则<br/>免费额度、模型单价和参数倍率"]
    FINANCE --> PAYMENTS["支付渠道<br/>商户配置、回调地址、检测和启停"]
    FINANCE --> CDK["CDK 兑换<br/>批量生成、筛选、停用和兑换追踪"]
    FINANCE --> WALLET["财务流水<br/>充值、扣费、退款和余额变化"]

    BILLING_ADMIN["财务运营 /admin/billing"] --> ORDERS
    BILLING_ADMIN --> PRODUCTS
    BILLING_ADMIN --> PAYMENTS

    PRODUCTS --> USER_BUY["用户选择商品"]
    USER_BUY --> ORDERS
    ORDERS --> PAYMENTS
    PAYMENTS --> PAY_RESULT{"支付结果"}

    PAY_RESULT -->|成功| WALLET
    PAY_RESULT -->|失败| REFUND["关闭订单或执行退款"]
    REFUND --> WALLET

    POINTS --> GENERATION
    GENERATION --> WALLET
```

</details>

<details>
<summary><strong>08｜后台模型、系统、存储和内容管理</strong></summary>

```mermaid
flowchart TB
    ADMIN["管理后台 /admin"] --> UPSTREAM["上游配置"]
    ADMIN --> SYSTEM["系统管理"]
    ADMIN --> STORAGE["存储与备份"]
    ADMIN --> CONTENT["内容运营"]

    UPSTREAM --> CHANNELS["模型渠道<br/>协议、Base URL、API Key 和模型目录"]
    CHANNELS --> LOGICAL["同步逻辑模型、优先级和默认模型"]
    LOGICAL --> VERIFY["在统一 Agent、Canvas 或短剧入口发起真实业务请求"]
    UPSTREAM --> SKILLS["Agent Skills<br/>分类、触发规则、能力约束和启停"]

    SYSTEM --> SITE["站点资料<br/>名称、Logo、SEO、首页内容和友情链接"]
    SYSTEM --> SETTINGS["基础设置<br/>注册、SMTP、默认参数、并发和安全"]
    SYSTEM --> DELETION["注销申请<br/>筛选、受理、拒绝和处理备注"]
    SYSTEM --> UPDATES["版本更新<br/>当前版本、Release、日志和升级检查"]

    STORAGE --> LOCAL["本地媒体<br/>分类、归属、期限和引用保护删除"]
    STORAGE --> S3["外部存储<br/>S3 配置、连接检测、对象管理和迁移"]
    STORAGE --> BACKUP["数据备份<br/>导入导出和完整备份边界"]

    CONTENT --> ANNOUNCEMENT["公告管理<br/>创建、编辑、置顶、发布和下线"]
    CONTENT --> PROMPT["提示词管理<br/>搜索、分类、标签和展示状态"]

    SETUP["初始化配置 /admin/setup"] --> SITE
    SETUP --> CHANNELS
    SETUP --> SETTINGS
    SETUP --> PRODUCTS["套餐商品"]
    SETUP --> PAYMENTS["支付渠道"]
    SETUP --> S3
    SETUP --> BACKUP

    ANNOUNCEMENT --> PUBLIC_ANN["用户公告中心"]
    PROMPT --> PUBLIC_PROMPT["用户公共提示词库"]
    LOGICAL --> GENERATION["用户生成任务"]
    SKILLS --> GENERATION
```

</details>

<details>
<summary><strong>09｜全平台服务端数据流程</strong></summary>

```mermaid
flowchart LR
    PAGE["所有用户页和管理页"] --> CLIENT["前端 API Service"]
    CLIENT --> ROUTE["Next.js Route Handler"]
    ROUTE --> AUTH["Session、用户归属和角色鉴权"]
    AUTH --> SERVICE["业务服务和任务编排"]

    SERVICE --> REPO["Repository<br/>参数化查询和事务"]
    REPO --> PG[("PostgreSQL 16")]

    SERVICE --> ROUTER["逻辑模型路由"]
    ROUTER --> PROVIDER["外部 AI 模型"]
    PROVIDER --> TASK["幂等任务和状态轮询"]

    TASK --> BILLING["积分扣费和套餐用量"]
    BILLING --> PG

    TASK -->|失败或取消| REFUND["幂等退款"]
    REFUND --> PG

    TASK --> MEDIA["媒体下载、规范化和登记"]
    MEDIA --> SWITCH{"存储位置"}
    SWITCH -->|本地| LOCAL["服务器数据目录"]
    SWITCH -->|外部| S3["S3 兼容对象存储"]
    MEDIA --> PG

    PG --> RESPONSE["统一返回 code / data / msg"]
    LOCAL --> RESPONSE
    S3 --> RESPONSE
    RESPONSE --> PAGE
```

</details>

一条生成任务只调用一次上游创建接口，轮询只查询同一个任务。只有上游明确失败并且用户点击重试，才会创建新的 attempt，避免重复消耗额度。平台规划提示词、模型理由和复盘详情只用于内部执行，不显示或持久化到生成型对话。

完整目录职责、Agent、媒体、计费和部署说明见[项目结构与流程](docs/content/docs/overview/project-structure.mdx)。

## 最低服务器配置

VOZEB PRO 调用外部 AI 模型，不要求 GPU。服务器主要承担 Web、PostgreSQL、媒体下载/存储和可选 FFmpeg 转码。

| 使用方式                   | CPU      | 内存           | 磁盘      | 说明                                                                |
| -------------------------- | -------- | -------------- | --------- | ------------------------------------------------------------------- |
| 最低可启动                 | 1 核     | 1GB + 1GB swap | 10GB SSD  | 使用发布镜像、外部 PostgreSQL 和外部 S3/OSS；只适合安装体验和低并发 |
| 标准小型部署               | 2 核     | 2GB + 1GB swap | 20GB SSD  | 应用与 PostgreSQL 同机，适合少量用户；不要在服务器现场构建镜像      |
| 推荐日常使用               | 2–4 核   | 4GB            | 40GB+ SSD | 适合统一 Agent、Canvas、后台和少量并发                              |
| 短剧合成或频繁本地视频处理 | 4 核以上 | 8GB 以上       | 80GB+ SSD | FFmpeg、长视频下载、转码和字幕合成会明显占用 CPU、内存和临时磁盘    |

最低环境还需要：64 位 Linux、Docker 与 Compose v2、PostgreSQL 16、可用域名和 HTTPS、能够访问模型上游的出站网络。源码开发或现场构建建议至少 2GB 内存，4GB 更稳妥；本地保存视频时请按实际媒体量扩大磁盘。完整说明见[低内存服务器部署](docs/content/docs/overview/low-memory.mdx)。

## 快速开始

> 安装过 0.0.2 的用户必须先删除旧数据库或数据库卷，再重新安装 0.0.7，并通过 `/install` 重新初始化数据库；不支持沿用旧数据库或原地升级。

### Docker Compose

环境要求：可运行 Docker Compose 的 Linux 服务器、HTTPS 域名，以及按业务需要准备的模型渠道。
以下仓库地址是首发公开目标；获准上传前不能据此获取本项目源码。实际部署请以对应运行版本的固定提交和源码归档为准。

```bash
git clone https://github.com/fandy20082008/GoldCube.git
cd GoldCube
cp .env.example .env
```

至少修改：

```dotenv
NEXT_PUBLIC_SITE_URL=https://vozeb-pro.example.com
POSTGRES_PASSWORD=replace-with-a-strong-password
VOZEB_PRO_ENCRYPTION_KEY=replace-with-openssl-rand-hex-32
VOZEB_PRO_INSTALL_TOKEN=replace-with-one-time-openssl-rand-hex-32
VOZEB_PRO_MAINTENANCE_TOKEN=replace-with-another-openssl-rand-hex-32
VOZEB_PRO_WORKER_TOKEN=replace-with-a-distinct-openssl-rand-hex-32
```

为四个变量分别执行一次下面的命令，并保存每次不同的输出。维护令牌与 Worker 令牌必须不同：

```bash
openssl rand -hex 32
```

写入 `.env` 后启动：

```bash
docker compose pull
docker compose up -d
docker compose ps
```

`VOZEB_PRO_INSTALL_TOKEN` 只用于初始化数据库和创建首个管理员，必须从服务器 `.env` 粘贴到安装向导；安装完成后可从环境变量中移除。`VOZEB_PRO_MAINTENANCE_TOKEN` 只授权外部计划维护任务，`VOZEB_PRO_WORKER_TOKEN` 只授权 App 与生成 Worker 的内部任务领取、心跳和回调。Worker 不读取包含数据库、支付、安装令牌或外部维护令牌的完整 `.env`。完整变量说明见[配置说明](docs/content/docs/overview/configuration.mdx)。

打开 `https://你的域名/install`，依次检查数据库、初始化表结构并创建首个管理员。

### 宝塔 PostgreSQL

宝塔已安装 PostgreSQL 时使用：

```bash
docker compose -f docker-compose.baota.yml up -d
```

`.env` 中的数据库连接使用宿主机回环地址：

```dotenv
VOZEB_PRO_DATABASE_PROVIDER=postgres
DATABASE_URL=postgres://user:password@127.0.0.1:5432/vozeb_pro
VOZEB_PRO_DATABASE_SSL=0
VOZEB_PRO_TRUSTED_PROXY_HOPS=1
```

宝塔 Nginx 反向代理到应用后，应转发 `Host`、`X-Forwarded-Host`、`X-Forwarded-Proto` 和 `X-Forwarded-For`。详细步骤见[生产上线基线](docs/content/docs/overview/production-readiness.mdx)和[Docker 部署](docs/content/docs/overview/docker.mdx)。

### 源码开发

环境要求：Node.js 22、pnpm 10+、PostgreSQL 16；短剧合成和本地转码还需要 FFmpeg。

```bash
cp .env.example web/.env.local
cd web
pnpm install --frozen-lockfile
pnpm run dev
```

访问 `http://localhost:3000/install`。文档站在 `docs/` 中独立运行，并固定使用 `http://localhost:3001`，不会占用主应用的 `3000` 端口：

```bash
cd docs
pnpm install --frozen-lockfile
pnpm run dev
```

`http://localhost:3000` 必须显示 VOZEB PRO 主应用；如果看到“VOZEB PRO 文档中心”，说明启动的是 `docs/` 子项目或旧版文档脚本，请停止该进程并从 `web/` 启动主应用。独立文档站只使用 `http://localhost:3001`。

## 首次配置顺序

1. 在 `/install` 完成数据库初始化和首个管理员创建。
2. 在后台“模型渠道”按五步向导选择协议、配置连接、获取模型、同步逻辑模型并确认启用；无鉴权协议无需 API Key，未知上游可生成自定义协议草稿。
3. 设置默认逻辑模型，并在 `/create` 统一 Agent 中分别发起文本、图片、视频和音频真实业务请求验证。
4. 配置套餐、积分规则和可选支付渠道。
5. 配置 SMTP、注册策略、本地媒体或 S3 兼容对象存储。
6. 在“初始化配置”检查上线项，再验证真实生成、退款和备份恢复。

## 目录与文件用途

| 路径                                        | 文件里是什么                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `web/src/app/`                              | Next.js 页面、布局、安装页、用户工作区、管理后台和本站 API Route Handler   |
| `web/src/lib/server/`                       | Agent 编排、模型路由、生成任务、计费、媒体、对象存储、支付和服务端安全逻辑 |
| `web/src/lib/server/database/`              | PostgreSQL 表结构、参数化 Repository、查询映射和文件 Provider 回退         |
| `web/src/components/` / `web/src/hooks/`    | 跨页面 UI、创作控件、素材选择、复制下载和会话交互                          |
| `web/src/services/api/` / `web/src/stores/` | 浏览器访问本站 API 的类型化客户端，以及用户、主题、配置和素材瞬时状态      |
| `web/scripts/`                              | 低内存生产构建、standalone 启动、生成 Worker、管理员密码重置和发布检查脚本 |
| `web/public/`                               | 站点 Logo、浏览器图标和模型品牌图标                                        |
| `docs/content/docs/`                        | 功能、安装、部署、数据库、商业准备、进度和排障文档                         |
| `docs/public/screenshots/`                  | 用户端、公开页和管理后台的脱敏 WebP 功能截图                               |
| `.github/workflows/quality.yml`             | Web 与文档的安装、类型检查、测试、格式检查和生产构建                       |
| `.github/workflows/docker-image.yml`        | 主应用 amd64/arm64 镜像构建与 GHCR 多架构合并                              |
| `.github/workflows/docs-docker-image.yml`   | 文档站 amd64/arm64 镜像构建与 GHCR 多架构合并                              |
| `.env.example`                              | 数据库、站点、加密、代理、媒体、模型、支付和部署变量模板                   |
| `Dockerfile` / `docker-compose*.yml`        | standalone 生产镜像，以及标准、源码、宝塔、外部数据库和低内存部署拓扑      |
| `VERSION` / `CHANGELOG.md`                  | 当前版本号和版本级变更记录                                                 |
| `LICENSE` / `COMMERCIAL_LICENSE.md`         | AGPL-3.0 许可，以及保留的旧上游商业说明                                     |
| `COMMERCIAL_LICENSE_AGREEMENT.md`           | 旧上游未签署的商业协议参考模板，不构成 GoldCube 报价或授权                  |
| `DISCLAIMER.md` / `LEGAL_NOTICE.md`         | 上游免责声明、公开授权与合规告示原文                                       |
| `CLA.md` / `SECURITY.md`                    | 保留的旧上游贡献协议和安全策略原文；当前入口见文档站说明                    |
| `CONTRIBUTING.md`                           | 开发者提交 Issue、代码和文档的流程                                         |

更完整的目录树、关键源码入口、Service、Route Handler、Repository 和任务 Store 职责见[项目结构与流程](docs/content/docs/overview/project-structure.mdx)。

## 页面展示

<table>
  <tr>
    <td width="50%"><img src="docs/public/screenshots/pages/02-create.webp" alt="统一创作 Agent"></td>
    <td width="50%"><img src="docs/public/screenshots/pages/03a-canvas-editor.webp" alt="Canvas 编辑器"></td>
  </tr>
  <tr>
    <td width="50%">短剧生产编辑器：剧本、内容审核、分镜与镜头生成</td>
    <td width="50%"><img src="docs/public/screenshots/pages/20-admin-overview.webp" alt="经营看板"></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/public/screenshots/pages/34-admin-channels.webp" alt="模型渠道"></td>
    <td width="50%">提示词：自行创建、导入和管理</td>
  </tr>
</table>

用户端、公开页和管理后台的功能说明与已授权截图见[页面功能图册](docs/content/docs/overview/page-gallery.mdx)。

## 数据与安全

- PostgreSQL 保存用户、会话、设置、创作会话、Canvas、素材、短剧、生成任务、积分和订单。
- 外部存储关闭时新媒体只写 `VOZEB_PRO_DATA_DIR`；开启时新媒体只写 S3 兼容对象存储。历史媒体按登记 Provider 读取。
- 业务记录保存稳定站内 `storageKey`，不保存 base64、对象 Key 或临时签名 URL。
- `.env`、API Key、支付密钥、数据库、媒体文件、备份、日志和构建产物不得提交 Git。
- 二开升级应先核对精确来源与许可，在隔离分支评审后合入；不得直接覆盖二开目录。规则见[治理规范](docs/open-source/policy.md)。
- 生产镜像使用带版本的不可变标签并记录 digest；禁止把 `local-fix` 作为新的正式发布标签。
- 生产备份必须同时覆盖 PostgreSQL 和本地媒体或对象存储，不能只备份其中一部分。

## 验证

```bash
cd web
pnpm test
pnpm run typecheck
pnpm run format:check
pnpm run build

cd ../docs
pnpm run types:check
pnpm run build
```

## 文档与协议

- [功能总览](docs/content/docs/overview/features.mdx)
- [目录与文件用途](docs/content/docs/overview/project-structure.mdx)
- [配置说明](docs/content/docs/overview/configuration.mdx)
- [数据库结构](docs/content/docs/backend/backend-database.mdx)
- [待测试](docs/content/docs/progress/pending-test.mdx)
- [参与贡献](CONTRIBUTING.md)
- [漏洞报告渠道说明](docs/content/docs/support/security.mdx)
- [AGPL-3.0](LICENSE)
- [上游商业授权历史说明](docs/content/docs/business/commercial-license.mdx)
- [旧上游商业协议模板](COMMERCIAL_LICENSE_AGREEMENT.md)
- [旧上游免责声明](DISCLAIMER.md)
- [旧上游授权与合规告示](LEGAL_NOTICE.md)
- [贡献与旧上游 CLA](docs/content/docs/business/cla.mdx)

## 社区交流

原作者的社区联系方式见[上游旧 AGPL 基线的社区文档](https://github.com/csyqlz/VOZEB-PRO/blob/04b32d31ca00272e3866c85e9a8329036c63af72/docs/content/docs/support/community.mdx)。此链接指向上游文档，并非 GoldCube 官方交流群。欢迎通过本项目仓库交流部署、模型渠道适配、Bug 复现和代码贡献；请勿公开 API Key、数据库密码、支付密钥、私钥或未经脱敏的生产日志。

## 致谢

- 感谢 [LINUX DO](https://linux.do) 社区、相关提示词开源仓库、Codex / Claude Code 生态，以及项目使用的所有开源工具与基础设施。
