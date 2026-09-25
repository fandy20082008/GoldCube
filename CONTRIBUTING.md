# 参与贡献

感谢你愿意参与 VOZEB PRO。可以通过 Issue、Pull Request、文档补充、测试反馈或渠道适配样例帮助项目继续完善。

## 提交前

- 先搜索现有 Issue 和代码，确认问题尚未解决。
- Bug 请提供版本、部署方式、入口、复现步骤、预期结果和脱敏日志。
- 新功能先说明使用场景、用户价值和不应影响的现有链路。
- 不要提交 `.env`、API Key、数据库、媒体原文件、备份、日志、构建产物或个人工作目录。
- 安全漏洞不要公开披露可利用细节；旧上游 [SECURITY.md](SECURITY.md) 中的邮箱不是 GoldCube 已核实的受理渠道。当前[漏洞提交说明](docs/content/docs/support/security.mdx)列明渠道核实前的处理方式。

## 本地开发

环境要求：Node.js 22、pnpm 10+、PostgreSQL 16；短剧合成和本地转码需要 FFmpeg。

```bash
cp .env.example web/.env.local
cd web
pnpm install --frozen-lockfile
pnpm run dev
```

文档站位于 `docs/`：

```bash
cd docs
pnpm install --frozen-lockfile
pnpm run dev
```

## 代码边界

- Route Handler 只负责 HTTP 入参、鉴权、服务调用和响应映射。
- 业务规则、任务编排和 Provider 适配放在 `web/src/lib/server/`。
- 数据库访问沿用 `web/src/lib/server/database/` 的参数化 Repository。
- 浏览器 API 请求放在 `web/src/services/api/`，跨页面状态放在 `web/src/stores/`。
- 图片、视频、Agent、Canvas、短剧、计费、媒体和存储改动必须保持现有失败、退款、重试和用户隔离语义。

来源与开源发布约束见[治理规范](docs/open-source/policy.md)，目录职责见[项目结构与流程](docs/content/docs/overview/project-structure.mdx)。

## 质量检查

提交前至少运行：

```bash
cd web
pnpm run typecheck
pnpm test
pnpm run format:check
pnpm run build

cd ../docs
pnpm run types:check
pnpm run build
```

涉及界面时还需检查桌面与移动端、浅色与深色主题、滚动和所有改动按钮。涉及真实模型渠道时请说明未执行的上游测试，避免无意消耗额度。

## Pull Request

- 一个 PR 只处理一个清晰问题，不夹带无关重构。
- 说明改动原因、主要文件、验证结果、兼容边界和仍需人工确认的事项。
- 新增或修改功能时同步更新 `docs/content/docs/progress/pending-test.mdx`、TODO 和必要的正式文档。
- 仓库保留的 [CLA.md](CLA.md) 属于旧上游历史协议，不作为 GoldCube 新贡献的自动接受条款。贡献条款和接收责任人经专项审核确认前，GoldCube 暂缓接受新贡献；参见[贡献与上游 CLA](docs/content/docs/business/cla.mdx)。

## 社区

旧上游社区信息见[基线社区文档](https://github.com/csyqlz/VOZEB-PRO/blob/04b32d31ca00272e3866c85e9a8329036c63af72/docs/content/docs/support/community.mdx)，不作为 GoldCube 官方群入口。公开仓库启用后，可用不含凭据、个人信息或漏洞细节的 Issue 交流普通问题。
