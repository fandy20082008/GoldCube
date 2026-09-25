# 自定义视频渠道参考素材上传

## 配置契约

需要先上传素材的渠道可在 `advancedConfig` 顶层配置：

```json
{
  "referenceUpload": {
    "path": "/media",
    "fileField": "file",
    "urlField": "data[0].url"
  }
}
```

路径相对于渠道 Base URL。例如 Base URL 为 `https://provider.example/v1` 时，上述配置请求 `https://provider.example/v1/media`，不要重复填写 `/v1/media`。上传目标必须保持同源且在 Base URL 路径范围内。没有该配置的渠道保持原有直接引用行为。

视频创建前，服务端读取已授权并签名的参考素材，用真实字节识别媒体格式，以 multipart 文件上传，使用响应中的 URL 构造创建请求。上游密钥仅发送给上传接口，不发送给素材来源。素材大小沿用平台现有上传限制。重复 URL 在同一请求内只上传一次，引用顺序及首尾帧角色保留。

自定义模板支持独立的 `{images_ref}` / `{{images}}` 等占位符，替换后保留数组、数字和布尔值的 JSON 类型。空音视频引用与未填写的负面提示词不发送。当前视频服务没有负面提示词输入配置，因此 `negative_prompt` 占位符被省略。

上传失败、返回 URL 无效或创建模板遗漏已上传素材时，在创建视频及扣费之前失败，用户可以重试。上游创建已发出但结果不明时继续遵循既有 `needs_review` 规则，不自动新建任务。创建与查询继续经过系统渠道代理及原有幂等计费链路。

## 诊断边界

持久任务的 `referenceSubmission` 记录引用数、图片数、已处理引用数、上传路径和阶段。`uploadedCount` 按引用计数，重复 URL 仍只上传一次。审计不保存签名 URL、客户媒体或密钥；`submitting` 表示提交前已确认所有上传 URL 存在于最终请求体，不代表模型成片已经采用了参考图。是否生成成功和画面一致性必须分别验收。

2026-09-14 用户提供的最新纵横科技文档明确：`POST /v1/media` 返回 `data[].url`，素材有效期 3 天；视频 `images` 为字符串数组，`duration` 为数字，`generate_audio` 为布尔值。文档也允许无鉴权的公网 HTTPS 素材直链，因此不能把上传说成所有在线 URL 的强制前提。本实现对显式启用该配置的渠道每次创建前重新上传。

## 回归

`reference-upload-live.test.ts` 使用本地随机端口 TCP 夹具，校验实际 PNG 字节、multipart 字段、鉴权范围、最终 URL 数组、模板漏图、上传失败和重复引用。视频 POST 路由测试另校验上传失败可重试，且不创建视频、不自动切换渠道。
