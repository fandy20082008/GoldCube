# VOZEB PRO 文档索引

GoldCube 是基于 VOZEB PRO 旧 AGPL 版本持续开发的 AI 创作工作台。主应用公开目标为 `fandy20082008/GoldCube`，代理与外壳公开目标为 `fandy20082008/GoldCube-Gateway`；实际可下载源码以运行版本入口为准。

## 产品与安装

- [功能总览](/docs/overview/features)
- [项目结构与流程](/docs/overview/project-structure)
- [页面功能图册](/docs/overview/page-gallery)
- [快速开始](/docs/overview/quick-start)
- [配置说明](/docs/overview/configuration)
- [生产上线基线](/docs/overview/production-readiness)
- [Docker 部署](/docs/overview/docker)
- [低内存部署](/docs/overview/low-memory)
- [Render 部署](/docs/overview/render)

## 创作与画布

- [画布节点操作手册](/docs/canvas/canvas-node-manual)
- [画布快捷键](/docs/canvas/canvas-shortcuts)
- [第三方提示词来源说明](/docs/overview/third-party-prompt-repositories)

## 开发与数据

- [本地开发](/docs/backend/local-development)
- [接口响应与敏感配置](/docs/backend/api-response)
- [数据库结构](/docs/backend/backend-database)
- [画布数据结构](/docs/backend/canvas-data-structure)
- [SD 自定义协议视频渠道配置](/docs/sd-custom-video-channel)

## 项目治理

- [旧 AGPL 与开源发布规范](open-source/policy.md)
- [双仓统一发布清单](open-source/dual-repository-manifest.md)
- [运行版本源码入口设计](open-source/source-entry-design.md)
- [发布验收模板](open-source/release-checklist.md)
- [提示词库升级迁移说明](open-source/prompt-library-retirement.md)

- [社区交流与致谢](/docs/support/community)
- [赞助支持](/docs/support/donate)
- [商业落地缺口](/docs/business/commercial-launch)
- [开源协议](/docs/business/license)
- [商业授权](/docs/business/commercial-license)
- [免责声明](/docs/business/disclaimer)
- [授权与合规警示](/docs/business/legal-notice)
- [贡献者协议](/docs/business/cla)
- [商务合作](/docs/business/business)
- [安全与漏洞提交](/docs/support/security)
- [待测试](/docs/progress/pending-test)
- [TODO](/docs/progress/todo)
- [更新日志](/docs/progress/changelog)

## 重要说明

- 默认使用 PostgreSQL 保存账号、配置、任务、积分、订单和运营数据。
- 创作会话、Canvas、我的素材、短剧和工作台记录保存在服务端；登录后可跨设备恢复，不依赖浏览器业务缓存。
- 图片、视频和音频按媒体登记保存在服务器数据目录或可选 S3 兼容对象存储，并由后台“本地媒体”和“外部存储”管理。
- 模型与支付密钥由服务端读取或加密保存，不通过普通用户接口下发。
- 实际可用镜像及其不可变摘要以各运行版本的发布清单为准；不要使用原作者镜像代替二开制品。
- 环境变量统一使用 `VOZEB_PRO_` 前缀；数据库默认名称与用户为 `vozeb_pro`。
