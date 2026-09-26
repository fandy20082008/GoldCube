<p align="center">
  <img src="web/public/logo.svg?v=0.0.7" width="108" alt="GoldCube logo">
</p>

<h1 align="center">GoldCube</h1>

<p align="center">An open-source AI creation platform for a unified creative Agent, Canvas, and short-drama production, independently forked from VOZEB PRO</p>

<p align="center">
  <a href="https://github.com/fandy20082008/GoldCube"><img src="https://img.shields.io/github/stars/fandy20082008/GoldCube?style=flat-square&logo=github" alt="GoldCube GitHub stars"></a>
  <a href="VERSION"><img src="https://img.shields.io/badge/version-v0.0.7-2563eb?style=flat-square" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f97316?style=flat-square" alt="License"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=nextdotjs" alt="Next.js"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat-square&logo=postgresql" alt="PostgreSQL"></a>
</p>

<p align="center">
  <a href="docs/index.md">Documentation index</a> ·
  <a href="docs/content/docs/overview/configuration.mdx">0.0.7 release notes</a> ·
  <a href="#directory-and-file-guide">Directory and file guide</a> ·
  <a href="docs/content/docs/overview/page-gallery.mdx">Page gallery</a> ·
  <a href="https://linux.do">LINUX DO</a> ·
  <a href="docs/content/docs/business/commercial-license.mdx">Upstream commercial materials</a> ·
  <a href="DISCLAIMER.md">Upstream disclaimer</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

![VOZEB PRO home page](docs/public/screenshots/pages/01-home.webp)

This image shows an example of the upstream VOZEB PRO interface, not the current GoldCube interface.

VOZEB PRO brings the unified creative Agent, Canvas, short-drama production, asset library, and business administration together in one full-stack Next.js application. PostgreSQL stores accounts and business data. Media can be stored locally on the server or in S3-compatible object storage. Model, payment, and storage credentials remain on the server.

## About the GoldCube Fork

This independent fork is based on the older AGPL-licensed VOZEB-PRO commit `04b32d31ca00272e3866c85e9a8329036c63af72` (v0.0.7). It is not an officially authorized commercial edition from the original author and does not automatically incorporate newer upstream versions. The original license and copyright notices are retained; third-party materials remain subject to their respective licenses. The precise version terms must be checked against the original grants rather than assumed to be "only" or "or later."

The project publishes its own frontend, backend, proxy, Worker, and supporting build and deployment materials as open source while allowing commercial operation. Complete corresponding source code must still be provided for each running version; a repository description does not replace access to and verification of that version's source. See the [governance policy](docs/open-source/policy.md) and [release checklist](docs/open-source/release-checklist.md).

**Legal and contact scope:** The root-level `CLA.md`, `COMMERCIAL_LICENSE.md`, `LEGAL_NOTICE.md`, and `SECURITY.md` retain the text from the older upstream AGPL baseline. Their commercial prices, upstream email addresses, contributor agreement, and vulnerability response commitments are historical upstream materials, not GoldCube's current prices, contribution acceptance terms, or reporting channels. GoldCube's authority to grant closed-source licenses, payment and business channels, private vulnerability reporting channel, and responsible contacts remain unverified. The fork author's email `fandy2008_2019@qq.com` is available for community discussion only; it is not a confirmed channel for payments, license requests, or private vulnerability reports. Read the [commercial licensing history](docs/content/docs/business/commercial-license.mdx), [contribution guidance](docs/content/docs/business/cla.mdx), and [vulnerability reporting guidance](docs/content/docs/support/security.mdx) first. Do not send payments or sensitive information to GoldCube based on upstream materials.

## Core Features

- **Unified creative Agent:** Text chat, image, video, and audio creation in one conversation, with reference assets, first/last frames, Skills, intelligent planning, manual logical-model selection, aspect ratio, quality, duration and count controls, custom pixel dimensions, multiple results, history recovery, failure retry, WebP previews, and original-file downloads.
- **Canvas:** Text, image, video, audio, and generation nodes with drag-and-drop, connections, zoom, undo/redo, import/export, and Agent Runs.
- **Short-drama production:** Scripts, content review, characters, scenes, props, storyboards, shot videos, voiceovers, subtitles, versions, and FFmpeg composition.
- **Work gallery:** Drafts, version review, publishing and sharing, gallery search, creator profiles, likes and follows, takedown and republication, and content moderation.
- **Models and protocols:** Administrators manage channels, protocols, upstream and logical models, capabilities, priorities, and defaults for OpenAI, Gemini, Seedance 2.0, Stable Diffusion, A1111/Forge, and declarative custom protocols.
- **Persistent generation:** A separate Worker resumes image, video, audio, and Agent tasks, continues checking the same upstream task after a page closes or an instance changes, and supports handling exceptional tasks in generation operations.
- **Business administration:** Users, plans, promotions, coupons, referral rewards, points, CDKs, orders, payments, refunds, reconciliation, financial transactions, work moderation, announcements, prompts, and audit logs.
- **Storage and backups:** Local media, S3-compatible object storage, reference protection, object migration, and import/export of sanitized business data.

## Open Source and Historical Upstream Licensing

This project retains the older VOZEB PRO AGPL-3.0 license and required notices. Free use and commercial operation are permitted when the applicable AGPL-3.0 terms are followed, corresponding source is provided, and notices are retained. Anyone who cannot meet the open-source obligations and needs a closed-source license must obtain express permission from the relevant rights holders. GoldCube currently offers no separate published closed-source licensing program.

The root-level [historical upstream commercial information](COMMERCIAL_LICENSE.md) and [unsigned agreement template](COMMERCIAL_LICENSE_AGREEMENT.md) are retained solely as historical materials from the original project. They are neither a GoldCube price offer nor a sublicense of upstream code.

## Project Flows

All flowcharts are collapsed by default. Expand a heading to view its diagram.

<details>
<summary><strong>01 | Public pages and account access</strong></summary>

```mermaid
flowchart LR
    HOME["Home /<br/>Introduction, features, announcements"] --> ACTION{"Visitor action"}

    ACTION --> ANN["Announcements /announcements<br/>Pinned posts and platform notices"]
    ACTION --> GALLERY["Gallery /gallery<br/>Browse and search public works"]
    ACTION --> LOGIN["Log in /login<br/>Verify credentials"]
    ACTION --> REGISTER["Sign up /register<br/>Registration policy and optional email code"]
    ACTION --> FORGOT["Reset password /forgot-password<br/>Email code and password reset"]
    ACTION --> PRIVACY["Privacy policy /privacy"]
    ACTION --> TERMS["Terms of service /terms"]

    GALLERY --> SHARE["Work detail /share/:slug<br/>Preview, like, follow, report"]
    SHARE --> CREATOR["Creator profile /u/:username<br/>Public works"]

    REGISTER --> LOGIN
    FORGOT --> LOGIN
    LOGIN --> SESSION["Create login session"]
    SESSION --> ROLE{"Account role"}
    ROLE -->|User| USER["User workspace"]
    ROLE -->|Admin| ADMIN["SaaS administration"]

    INSTALL["Setup wizard /install"] --> CHECK["Check runtime and PostgreSQL"]
    CHECK --> SCHEMA["Initialize database schema"]
    SCHEMA --> FIRST_ADMIN["Create first administrator"]
    FIRST_ADMIN --> ADMIN
```

</details>

<details>
<summary><strong>02 | User workspace navigation</strong></summary>

```mermaid
flowchart TB
    USER["User workspace<br/>Load account, points, models, and site settings"]

    USER --> CREATE["Creative Agent /create<br/>Text, image, video, audio, and server-side conversations"]

    USER --> CANVAS["Canvas projects /canvas<br/>Create, search, rename, and delete"]
    CANVAS --> CANVAS_ID["Canvas editor /canvas/:id"]

    USER --> DRAMA["Short-drama projects /drama<br/>Projects and production progress"]
    DRAMA --> DRAMA_ID["Short-drama editor /drama/:id"]

    USER --> PROMPTS["Public prompts /prompts"]
    USER --> MY_PROMPTS["My prompts /my-prompts"]
    USER --> ASSETS["My assets /assets"]
    USER --> HELP["Help center /help"]
    USER --> PROFILE["Profile /profile"]
    USER --> BILLING["Billing /billing"]

    PROMPTS --> CREATE
    MY_PROMPTS --> CREATE
    ASSETS --> CREATE
    ASSETS --> CANVAS_ID
    ASSETS --> DRAMA_ID
```

</details>

<details>
<summary><strong>03 | Creative Agent generation</strong></summary>

```mermaid
flowchart TB
    START["User enters text or reference assets"] --> AGENT["Creative Agent /create"]
    AGENT --> CONTROL["Select Skill, intelligent planning, or logical model"]
    CONTROL --> PARAM["Set image, video, or audio preferences"]
    PARAM --> CHECK["Validate capabilities, assets, parameters, and points"]

    CHECK --> ROUTER["Logical-model routing"]
    ROUTER --> CREATE_TASK["Create idempotent generation task"]
    CREATE_TASK --> PROVIDER["Call upstream text, image, video, or audio service"]
    PROVIDER --> POLL["Check the same upstream task"]
    POLL --> RESULT{"Task result"}

    RESULT -->|Success| NORMALIZE["Download and normalize media"]
    RESULT -->|Failure| FAILED["Keep failure record and refund"]
    FAILED --> RETRY["User explicitly retries"]
    RETRY --> CREATE_TASK

    NORMALIZE --> SAVE["Register media ownership and stable URL"]
    SAVE --> MESSAGE["Return to current creative conversation"]
    MESSAGE --> OPERATE["Preview, download, save asset, or continue creating"]
```

</details>

<details>
<summary><strong>04 | Canvas creation</strong></summary>

```mermaid
flowchart LR
    LIST["Canvas projects /canvas"] --> CREATE["Create canvas"]
    LIST --> SEARCH["Search projects"]
    LIST --> RENAME["Rename project"]
    LIST --> DELETE["Delete project"]
    LIST --> OPEN["Open project"]

    CREATE --> EDITOR["Canvas editor /canvas/:id"]
    OPEN --> EDITOR

    EDITOR --> NODE{"Add node"}
    NODE --> TEXT["Text node"]
    NODE --> IMAGE["Image node"]
    NODE --> VIDEO["Video node"]
    NODE --> AUDIO["Audio node"]
    NODE --> GENERATE["Generation node"]

    TEXT --> CONNECT["Drag, zoom, and connect nodes"]
    IMAGE --> CONNECT
    VIDEO --> CONNECT
    AUDIO --> CONNECT
    GENERATE --> CONNECT

    CONNECT --> AGENT["Start Canvas Agent Run"]
    AGENT --> PLAN["Analyze nodes and connections"]
    PLAN --> TASK["Create image, video, or audio subtasks"]
    TASK --> RESULT["Write results to their nodes"]
    RESULT --> HISTORY["Undo, redo, and history"]
    HISTORY --> SAVE["Autosave on server"]
    SAVE --> EDITOR
```

</details>

<details>
<summary><strong>05 | Short-drama production</strong></summary>

```mermaid
flowchart LR
    LIST["Short-drama projects /drama"] --> CREATE["Create project"]
    CREATE --> CONFIG["Set episode count, aspect ratio, and shots"]
    CONFIG --> EDITOR["Short-drama editor /drama/:id"]

    EDITOR --> SCRIPT["Stage 1: Generate or edit script"]
    SCRIPT --> REVIEW["Stage 2: Content review and human approval"]
    REVIEW --> STORYBOARD["Stage 3: Storyboards and shot design"]
    STORYBOARD --> SHOTS["Stage 4: Generate shot images and videos"]

    SHOTS --> AUDIO["Generate voiceovers, sound effects, and music"]
    AUDIO --> SUBTITLE["Generate and proofread subtitles"]
    SUBTITLE --> VERSION["Save script, storyboard, and media versions"]
    VERSION --> COMPOSE["Compose final video with FFmpeg"]
    COMPOSE --> CHECK{"Composition result"}

    CHECK -->|Success| EXPORT["Preview and export final video"]
    CHECK -->|Failure| FIX["Identify failed shot or audio"]
    FIX --> SHOTS
```

</details>

<details>
<summary><strong>06 | Prompts, assets, accounts, and payments</strong></summary>

```mermaid
flowchart TB
    PROMPTS["Public prompts /prompts"] --> FIND["Search categories, tags, and keywords"]
    FIND --> USE["Use in Creative Agent"]

    MY["My prompts /my-prompts"] --> MANAGE["Create, edit, categorize, tag, and delete"]
    MANAGE --> SAVE_ASSET["Save as text asset"]
    MANAGE --> USE

    ASSETS["My assets /assets"] --> FILTER["Filter images, videos, audio, and text"]
    FILTER --> PREVIEW["Preview or download"]
    FILTER --> CONTINUE["Send to Agent, Canvas, or short drama"]
    FILTER --> DELETE["Delete after checking references"]

    HELP["Help center /help"] --> GUIDE["Agent, image, video, Canvas, drama, and account guides"]

    PROFILE["Profile /profile"] --> INFO["Update details and password"]
    PROFILE --> RIGHTS["View points, plans, orders, and usage"]
    PROFILE --> EXPORT["Export personal data"]
    PROFILE --> CANCEL_ACCOUNT["Request account deletion"]
    CANCEL_ACCOUNT --> ADMIN_REVIEW["Administrator accepts or rejects"]

    BILLING["Billing /billing"] --> PRODUCT["Select plan or points product"]
    PRODUCT --> ORDER["Create pending order"]
    ORDER --> CHECKOUT["Checkout /billing/checkout"]
    CHECKOUT --> CHANNEL["Select available payment channel"]
    CHANNEL --> PAY{"Payment result"}

    PAY -->|Success| SUCCESS["Payment success /billing/success"]
    SUCCESS --> CONFIRM["Confirm callback and order status"]
    CONFIRM --> GRANT["Credit plan or points"]
    GRANT --> REFRESH["Refresh balance and orders"]

    PAY -->|Cancelled or failed| CANCEL["Payment cancelled /billing/cancel"]
    CANCEL --> CHOICE{"Order handling"}
    CHOICE -->|Try again| CHECKOUT
    CHOICE -->|Abandon| CLOSE["Close or retain pending order"]
```

</details>

<details>
<summary><strong>07 | SaaS operations and finance</strong></summary>

```mermaid
flowchart TB
    ADMIN["Admin /admin"] --> ANALYSIS["Business analytics"]
    ADMIN --> PRODUCT["Product operations"]
    ADMIN --> FINANCE["Finance"]

    ANALYSIS --> OVERVIEW["Dashboard<br/>Users, revenue, points liability, orders, generation"]
    ANALYSIS --> USERS["User operations<br/>Accounts, roles, status, plans, points"]
    ANALYSIS --> LOGS["Call logs<br/>User, entry point, model, status, failure reason"]
    ANALYSIS --> GENERATION["Generation operations<br/>Find and cancel tasks, failures, retries"]

    PRODUCT --> PRODUCTS["Plan management<br/>Pricing, benefits, payment type, availability"]
    PRODUCT --> ORDERS["Order management<br/>Search, manual completion, closure, refunds"]

    FINANCE --> POINTS["Points rules<br/>Free allowance, model prices, parameter multipliers"]
    FINANCE --> PAYMENTS["Payment channels<br/>Merchant settings, callbacks, checks, status"]
    FINANCE --> CDK["CDK redemption<br/>Batch creation, filters, disabling, tracking"]
    FINANCE --> WALLET["Financial ledger<br/>Credits, charges, refunds, balance changes"]

    BILLING_ADMIN["Billing operations /admin/billing"] --> ORDERS
    BILLING_ADMIN --> PRODUCTS
    BILLING_ADMIN --> PAYMENTS

    PRODUCTS --> USER_BUY["User selects product"]
    USER_BUY --> ORDERS
    ORDERS --> PAYMENTS
    PAYMENTS --> PAY_RESULT{"Payment result"}

    PAY_RESULT -->|Success| WALLET
    PAY_RESULT -->|Failure| REFUND["Close order or issue refund"]
    REFUND --> WALLET

    POINTS --> GENERATION
    GENERATION --> WALLET
```

</details>

<details>
<summary><strong>08 | Models, system, storage, and content administration</strong></summary>

```mermaid
flowchart TB
    ADMIN["Admin /admin"] --> UPSTREAM["Upstream configuration"]
    ADMIN --> SYSTEM["System administration"]
    ADMIN --> STORAGE["Storage and backups"]
    ADMIN --> CONTENT["Content operations"]

    UPSTREAM --> CHANNELS["Model channels<br/>Protocol, base URL, API key, model catalog"]
    CHANNELS --> LOGICAL["Sync logical models, priorities, and defaults"]
    LOGICAL --> VERIFY["Make real requests through Agent, Canvas, or short drama"]
    UPSTREAM --> SKILLS["Agent Skills<br/>Categories, triggers, capabilities, status"]

    SYSTEM --> SITE["Site profile<br/>Name, logo, SEO, home content, links"]
    SYSTEM --> SETTINGS["General settings<br/>Registration, SMTP, defaults, concurrency, security"]
    SYSTEM --> DELETION["Deletion requests<br/>Filter, accept, reject, add notes"]
    SYSTEM --> UPDATES["Updates<br/>Current version, releases, logs, upgrade checks"]

    STORAGE --> LOCAL["Local media<br/>Type, ownership, retention, reference-safe deletion"]
    STORAGE --> S3["External storage<br/>S3 settings, connection checks, objects, migration"]
    STORAGE --> BACKUP["Data backups<br/>Import, export, full-backup boundary"]

    CONTENT --> ANNOUNCEMENT["Announcements<br/>Create, edit, pin, publish, unpublish"]
    CONTENT --> PROMPT["Prompt management<br/>Search, categories, tags, visibility"]

    SETUP["Initial setup /admin/setup"] --> SITE
    SETUP --> CHANNELS
    SETUP --> SETTINGS
    SETUP --> PRODUCTS["Plan products"]
    SETUP --> PAYMENTS["Payment channels"]
    SETUP --> S3
    SETUP --> BACKUP

    ANNOUNCEMENT --> PUBLIC_ANN["User announcements"]
    PROMPT --> PUBLIC_PROMPT["Public prompt library"]
    LOGICAL --> GENERATION["User generation tasks"]
    SKILLS --> GENERATION
```

</details>

<details>
<summary><strong>09 | Platform-wide server-side data flow</strong></summary>

```mermaid
flowchart LR
    PAGE["All user and admin pages"] --> CLIENT["Frontend API service"]
    CLIENT --> ROUTE["Next.js Route Handler"]
    ROUTE --> AUTH["Session, ownership, and role authorization"]
    AUTH --> SERVICE["Business services and task orchestration"]

    SERVICE --> REPO["Repository<br/>Parameterized queries and transactions"]
    REPO --> PG[("PostgreSQL 16")]

    SERVICE --> ROUTER["Logical-model routing"]
    ROUTER --> PROVIDER["External AI models"]
    PROVIDER --> TASK["Idempotent tasks and status checks"]

    TASK --> BILLING["Points charges and plan usage"]
    BILLING --> PG

    TASK -->|Failed or cancelled| REFUND["Idempotent refund"]
    REFUND --> PG

    TASK --> MEDIA["Download, normalize, and register media"]
    MEDIA --> SWITCH{"Storage destination"}
    SWITCH -->|Local| LOCAL["Server data directory"]
    SWITCH -->|External| S3["S3-compatible object storage"]
    MEDIA --> PG

    PG --> RESPONSE["Unified code / data / msg response"]
    LOCAL --> RESPONSE
    S3 --> RESPONSE
    RESPONSE --> PAGE
```

</details>

A generation task calls the upstream creation endpoint only once; subsequent checks query the same task. A new attempt is created only after an explicit upstream failure and a user-initiated retry, avoiding duplicate usage. Platform planning prompts, model selection reasons, and review details are for internal execution only and are neither displayed nor persisted in generative conversations.

For the full directory map and details on Agents, media, billing, and deployment, see [Project Structure and Flows](docs/content/docs/overview/project-structure.mdx).

## Minimum Server Requirements

GoldCube calls external AI models and does not require a GPU. The server primarily runs the web application and PostgreSQL, downloads and stores media, and optionally performs FFmpeg transcoding.

| Usage | CPU | Memory | Disk | Notes |
| --- | --- | --- | --- | --- |
| Minimum startup | 1 core | 1 GB + 1 GB swap | 10 GB SSD | Published image, external PostgreSQL and S3/OSS; installation trials and low concurrency only |
| Small deployment | 2 cores | 2 GB + 1 GB swap | 20 GB SSD | Application and PostgreSQL on one host for a small user base; do not build images on the server |
| Recommended daily use | 2–4 cores | 4 GB | 40 GB+ SSD | Agent, Canvas, administration, and modest concurrency |
| Short-drama composition or frequent local video processing | 4+ cores | 8 GB+ | 80 GB+ SSD | FFmpeg, long video downloads, transcoding, and subtitle composition consume substantial CPU, memory, and temporary disk space |

The minimum environment also needs 64-bit Linux, Docker and Compose v2, PostgreSQL 16, a domain with HTTPS, and outbound access to model providers. Source development or building on the server calls for at least 2 GB of memory, preferably 4 GB. Increase disk capacity according to the amount of locally stored video. See [Low-Memory Server Deployment](docs/content/docs/overview/low-memory.mdx).

## Quick Start

> Users who installed 0.0.2 must delete the old database or database volume before installing 0.0.7 and reinitializing through `/install`. Reusing the old database or upgrading it in place is not supported.

### Docker Compose

Requirements: a Linux server running Docker Compose, a domain with HTTPS, and any model channels needed for your use case. The public repository is available below. For deployment, use the fixed commit and source archive corresponding to the running version.

```bash
git clone https://github.com/fandy20082008/GoldCube.git
cd GoldCube
cp .env.example .env
```

At a minimum, update:

```dotenv
NEXT_PUBLIC_SITE_URL=https://vozeb-pro.example.com
POSTGRES_PASSWORD=replace-with-a-strong-password
VOZEB_PRO_ENCRYPTION_KEY=replace-with-openssl-rand-hex-32
VOZEB_PRO_INSTALL_TOKEN=replace-with-one-time-openssl-rand-hex-32
VOZEB_PRO_MAINTENANCE_TOKEN=replace-with-another-openssl-rand-hex-32
VOZEB_PRO_WORKER_TOKEN=replace-with-a-distinct-openssl-rand-hex-32
```

Run the following command separately for each of the four secret variables, using a different output each time. The maintenance and Worker tokens must differ:

```bash
openssl rand -hex 32
```

After updating `.env`, start the services:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

`VOZEB_PRO_INSTALL_TOKEN` is used only to initialize the database and create the first administrator. Copy it from the server's `.env` into the setup wizard; it can be removed from the environment after setup. `VOZEB_PRO_MAINTENANCE_TOKEN` authorizes only externally scheduled maintenance, while `VOZEB_PRO_WORKER_TOKEN` authorizes internal task claims, heartbeats, and callbacks between the App and generation Worker. The Worker does not read the full `.env` containing database, payment, installation, or external maintenance credentials. See [Configuration](docs/content/docs/overview/configuration.mdx) for all variables.

Open `https://your-domain.example/install`, check the database, initialize the schema, and create the first administrator.

### Baota PostgreSQL

If PostgreSQL is already installed through Baota, use:

```bash
docker compose -f docker-compose.baota.yml up -d
```

Set the database URL in `.env` to the host loopback address:

```dotenv
VOZEB_PRO_DATABASE_PROVIDER=postgres
DATABASE_URL=postgres://user:password@127.0.0.1:5432/vozeb_pro
VOZEB_PRO_DATABASE_SSL=0
VOZEB_PRO_TRUSTED_PROXY_HOPS=1
```

When Baota Nginx proxies to the application, forward `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Forwarded-For`. See [Production Readiness](docs/content/docs/overview/production-readiness.mdx) and [Docker Deployment](docs/content/docs/overview/docker.mdx).

### Source Development

Requirements: Node.js 22, pnpm 10+, and PostgreSQL 16. Short-drama composition and local transcoding also require FFmpeg.

```bash
cp .env.example web/.env.local
cd web
pnpm install --frozen-lockfile
pnpm run dev
```

Visit `http://localhost:3000/install`. The documentation site runs separately from `docs/` on `http://localhost:3001`, leaving port `3000` for the main application:

```bash
cd docs
pnpm install --frozen-lockfile
pnpm run dev
```

`http://localhost:3000` should display the main VOZEB PRO application. If it shows the VOZEB PRO documentation center, you started the `docs/` subproject or an older documentation script. Stop that process and start the application from `web/`. The separate documentation site uses only `http://localhost:3001`.

## Initial Configuration

1. Initialize the database and create the first administrator at `/install`.
2. In the admin Model Channels section, use the five-step wizard to choose a protocol, configure a connection, fetch models, sync logical models, and enable the channel. Protocols without authentication need no API key; unknown upstream services can use a custom-protocol draft.
3. Set the default logical model and verify real text, image, video, and audio requests separately in the Creative Agent at `/create`.
4. Configure plans, points rules, and optional payment channels.
5. Configure SMTP, registration policy, and local or S3-compatible media storage.
6. Review launch items under Initial Setup, then test real generation, refunds, and backup restoration.

## Directory and File Guide

| Path | Contents |
| --- | --- |
| `web/src/app/` | Next.js pages, layouts, setup, user workspace, admin area, and local API Route Handlers |
| `web/src/lib/server/` | Agent orchestration, model routing, generation tasks, billing, media, object storage, payments, and server-side security |
| `web/src/lib/server/database/` | PostgreSQL schema, parameterized repositories, query mappings, and file-provider fallback |
| `web/src/components/` / `web/src/hooks/` | Shared UI, creation controls, asset selection, copy/download, and conversation interactions |
| `web/src/services/api/` / `web/src/stores/` | Typed browser clients for local APIs and transient user, theme, configuration, and asset state |
| `web/scripts/` | Low-memory production build, standalone launch, generation Worker, admin password reset, and release checks |
| `web/public/` | Site logo, favicon, and model brand icons |
| `docs/content/docs/` | Features, installation, deployment, database, commercial readiness, progress, and troubleshooting |
| `docs/public/screenshots/` | Sanitized WebP screenshots of user, public, and admin features |
| `.github/workflows/quality.yml` | Web and docs installation, type checks, tests, formatting checks, and production builds |
| `.github/workflows/docker-image.yml` | amd64/arm64 main-application images and GHCR multi-architecture manifest |
| `.github/workflows/docs-docker-image.yml` | amd64/arm64 documentation images and GHCR multi-architecture manifest |
| `.env.example` | Database, site, encryption, proxy, media, model, payment, and deployment variable template |
| `Dockerfile` / `docker-compose*.yml` | Standalone production image and standard, source, Baota, external-database, and low-memory deployment options |
| `VERSION` / `CHANGELOG.md` | Current version and release-level changes |
| `LICENSE` / `COMMERCIAL_LICENSE.md` | AGPL-3.0 license and retained historical upstream commercial information |
| `COMMERCIAL_LICENSE_AGREEMENT.md` | Unsigned upstream agreement template; not a GoldCube price offer or license |
| `DISCLAIMER.md` / `LEGAL_NOTICE.md` | Original upstream disclaimer and licensing/compliance notices |
| `CLA.md` / `SECURITY.md` | Retained upstream contributor agreement and security policy; see documentation for current guidance |
| `CONTRIBUTING.md` | How to submit issues, code, and documentation |

See [Project Structure and Flows](docs/content/docs/overview/project-structure.mdx) for a fuller directory tree and the roles of key source entry points, services, Route Handlers, repositories, and task stores.

## Page Gallery

<table>
  <tr>
    <td width="50%"><img src="docs/public/screenshots/pages/02-create.webp" alt="Creative Agent"></td>
    <td width="50%"><img src="docs/public/screenshots/pages/03a-canvas-editor.webp" alt="Canvas editor"></td>
  </tr>
  <tr>
    <td width="50%">Short-drama editor: scripts, content review, storyboards, and shot generation</td>
    <td width="50%"><img src="docs/public/screenshots/pages/20-admin-overview.webp" alt="Business dashboard"></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/public/screenshots/pages/34-admin-channels.webp" alt="Model channels"></td>
    <td width="50%">Prompts: create, import, and manage your own</td>
  </tr>
</table>

See the [Page Gallery](docs/content/docs/overview/page-gallery.mdx) for descriptions and approved screenshots of user, public, and admin features.

## Data and Security

- PostgreSQL stores users, sessions, settings, creative conversations, Canvas projects, assets, short dramas, generation tasks, points, and orders.
- With external storage disabled, new media goes only to `VOZEB_PRO_DATA_DIR`; when enabled, it goes only to S3-compatible object storage. Existing media is read from its registered provider.
- Business records retain stable internal `storageKey` values, not base64, object keys, or temporary signed URLs.
- Never commit `.env`, API keys, payment secrets, databases, media, backups, logs, or build artifacts to Git.
- Check exact sources and licenses before upgrading the fork; review changes on an isolated branch rather than overwriting the fork. See the [governance policy](docs/open-source/policy.md).
- Production images use versioned immutable tags with recorded digests; `local-fix` must not become a new formal release tag.
- Production backups must cover both PostgreSQL and local media or object storage.

## Verification

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

## Documentation and Licenses

- [Features](docs/content/docs/overview/features.mdx)
- [Project structure](docs/content/docs/overview/project-structure.mdx)
- [Configuration](docs/content/docs/overview/configuration.mdx)
- [Database schema](docs/content/docs/backend/backend-database.mdx)
- [Pending tests](docs/content/docs/progress/pending-test.mdx)
- [Contributing](CONTRIBUTING.md)
- [Vulnerability reporting guidance](docs/content/docs/support/security.mdx)
- [AGPL-3.0](LICENSE)
- [Historical upstream commercial licensing](docs/content/docs/business/commercial-license.mdx)
- [Unsigned upstream commercial agreement template](COMMERCIAL_LICENSE_AGREEMENT.md)
- [Historical upstream disclaimer](DISCLAIMER.md)
- [Historical upstream licensing and compliance notice](LEGAL_NOTICE.md)
- [Contributing and historical upstream CLA](docs/content/docs/business/cla.mdx)

## Community

For the original author's community contacts, see the [community documentation at the older upstream AGPL baseline](https://github.com/csyqlz/VOZEB-PRO/blob/04b32d31ca00272e3866c85e9a8329036c63af72/docs/content/docs/support/community.mdx). That link points to upstream documentation, not an official GoldCube community group. Discuss deployment, model-channel integration, bug reproduction, and contributions through this repository. The GoldCube fork author can also be contacted for community discussion via QQ: `2201389466` or email: `fandy2008_2019@qq.com`. These contacts are not confirmed channels for payments, licensing, or private vulnerability reports. Do not publish API keys, database passwords, payment secrets, private keys, or unsanitized production logs.

## Acknowledgments

- Thanks to the [LINUX DO](https://linux.do) community, related open-source prompt repositories, the Codex and Claude Code ecosystems, and all open-source tools and infrastructure used by this project.
