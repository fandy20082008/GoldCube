# 首发提示词库范围与升级迁移

首发源码不携带 963 条聚合提示词载荷、同步脚本和专用远程封面抓取实现。文件与 PostgreSQL 提示词库的读取不再触发初始化、替换或删除。公共库新装为空；管理员创建、个人创建/导入/管理以及通用媒体能力保留。旧封面地址 `/api/public/prompt-images` 返回 410 且禁止缓存，不再请求第三方仓库。既有个人复制条目和管理员自建条目不得按文本相似度或来源字样清理。

## 历史数据处理

仅迁移 `scope=library` 且 `source` 等于或以冒号紧随以下前缀的条目：`vozeb-pro/original-author-prompts`、`tigerowo/awesome-gpt-image-2-prompts`。对应 `prompt_seed_sources` 同样匹配。原始开发库和生产数据不会因为源码更新自动改动；生产迁移需另行批准并安排维护窗口。

`web/scripts/retire-managed-prompt-library.mjs` 使用 `inventory`、`apply`、`rollback` 三种显式命令。`inventory` 为只读，生成 `plan.json`（总数、个人条目数、精确 ID/source 列表及哈希）和私有的 `original-prompts.json` 备份。将 `--evidence` 指向仓库、构建上下文和公开制品之外的访问受限目录；这些文件含真实提示词正文，不上传。file Provider 用 `--file` 指定绝对的 `prompts.json` 路径；PG Provider 从环境变量 `PROMPT_MIGRATION_DATABASE_URL` 读取连接，禁止将连接字串放入命令或日志。

执行前停写提示词业务并核对计划、备份哈希、备份恢复能力以及个人/管理员条目数量；按所选 Provider 显式执行 `apply`。文件模式在执行前校验整个原文件 SHA-256，仅隔离匹配公共条目并原子写回；PG 模式在可串行化事务中重新核对受管行及来源，按精确 ID/source 删除。执行后回读公共列表和数据数量，确认受管条目及旧封面 URL 不再可见，用户自建与导入照常。运行态旧封面只曾缓存在单进程内 Map，重启相关进程后缓存自然清空，无需遍历或删除对象存储。

回滚：文件模式要求当前文件哈希仍为迁移产物，否则拒绝覆盖后续编辑；PG 模式在事务中确认无受管行或 ID 冲突，再从私有备份恢复精确原行和来源。回滚前同样停写并保留独立数据库/文件快照；若后续数据已变化，停止自动回滚并由负责人逐项合并，不覆盖客户新数据。生产数据数量和真实 ID 只能在对应环境的只读清点后填写到私有发布证据，不得用仓库内 963 条推断实际库的行数。

本次仅有源码、离线脚本与合成数据回归；未连接生产文件/PG，未执行生产 inventory/apply/rollback。历史 `custom.12` 供源义务另行处理。
