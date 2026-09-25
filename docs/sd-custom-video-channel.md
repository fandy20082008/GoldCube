# SD 自定义协议视频渠道配置

本文用于管理员手动配置支持参考图片的视频渠道。配置前请以最新上游接口文档和 `/v1/models` 实际返回为准；本文不执行渠道创建、模型绑定、密钥写入或线上变更。

## 上游接口契约

上游文档示例 Base URL：

```text
https://cnd-coo-new.pages.dev/v1
```

该地址来自最新上游接口文档。写入生产环境前，管理员必须确认实际 Base URL、API Key 和可用模型；不得因为示例文档存在就跳过确认。2026-09-14 已按用户指令将云端现有 SD 自定义协议渠道更新为该地址。

| 项目 | 填写值 |
|---|---|
| 协议 | `custom` |
| API 格式 | `openai` |
| 创建视频路径 | `/videos` |
| 查询任务路径 | `/tasks/:task_id` |
| 参考素材上传路径 | `/media` |
| 创建接口 | `POST /v1/videos` |
| 查询接口 | `GET /v1/tasks/{task_id}` |

Base URL 已包含 `/v1` 时，路径只填写相对部分。例如 Base URL 为 `https://provider.example/v1`，创建路径填写 `/videos`，最终请求为 `https://provider.example/v1/videos`。不要重复填写 `/v1/videos`。

## 参考素材上传

在渠道 `advancedConfig` 中启用以下配置：

```json
{
  "referenceUpload": {
    "path": "/media",
    "fileField": "file",
    "urlField": "data[0].url"
  }
}
```

上传请求为 `multipart/form-data`，每个文件都使用名为 `file` 的字段。上传接口返回的 `data[].url` 用于后续视频创建请求。素材有效期按上游文档为 3 天；本地文件、站内签名地址或不稳定地址应优先通过该接口上传。

上游允许直接使用可公网访问的 HTTPS 图片 URL。对于稳定、无需鉴权且长期有效的公网地址，可以直接传入；不能访问公网的本地地址、内网地址、过期签名地址不能直接填写。

## 创建请求模板

创建路径使用 `/videos`，模板字段按上游契约填写：

```json
{
  "model": "{model}",
  "prompt": "{prompt}",
  "duration": "{duration}",
  "ratio": "{ratio}",
  "resolution": "{resolution}",
  "quality": "{quality}",
  "images": "{images_ref}",
  "reference_videos": "{videos_ref}",
  "reference_audios": "{audios_ref}",
  "generate_audio": "{generate_audio}"
}
```

平台模板渲染器会把占位符替换为最终 JSON 类型：

- `images` 必须是字符串数组；有多张参考图时保留数组顺序。
- `reference_videos` 和 `reference_audios`（如启用）是字符串数组。
- `duration` 是数字，不要在自定义逻辑中把它转换成带单位的文本。
- `generate_audio` 是布尔值 `true` 或 `false`。
- 空的参考音频、参考视频和未填写字段不会发送。
- 不要把数组手工拼成逗号分隔字符串，也不要把布尔值写成 `"true"`/`"false"`。

创建请求由平台服务端自动生成 `Idempotency-Key`。管理员不需要把该请求头写入模板。模板中不要增加 `extra`、上游专用模型名、上游任务 ID 或其它未在上游文档中声明的字段。

## 结果字段

请在管理员配置页面按真实响应核对以下字段：

| 用途 | 字段 |
|---|---|
| 创建任务 ID | `task_id` |
| 查询状态 | `status` |
| 视频结果地址 | `video_url`、`url` 或 `result_url` |

如果上游实际返回字段不同，应以最新接口文档和一次非生产验证响应为准，再填写平台对应的结果字段；不要猜测字段名。

## 能力标记与手动核对

建议的渠道能力标记：

```json
{
  "supportsReferenceImage": true,
  "supportsReferenceVideo": false,
  "supportsReferenceAudio": false
}
```

管理员手动绑定模型时需要核对：

1. 模型 ID 确实出现在 `/v1/models` 返回结果中，或已由上游管理员明确确认。
2. 模型支持图生视频，并接受 `images` 字符串数组。
3. 模型的时长、比例、分辨率和质量限制与平台表单一致。
4. 上游能够从公网读取平台上传接口返回的 URL。
5. 创建接口返回 `task_id`，查询接口能用该 ID 返回状态和最终视频地址。

模型绑定由管理员在后台手动完成。本文不替管理员选择逻辑模型、上游模型、优先级或计费价格，也不记录任何 API Key、Authorization、Cookie、SSH 信息、客户媒体或签名 URL。

## 配置后验证顺序

1. 先用管理员确认的 Base URL 和 API Key 测试 `GET /v1/models`，记录模型 ID，不记录密钥。
2. 上传一张无敏感信息的测试图片，确认 `POST /v1/media` 返回 `data[].url`。
3. 在后台手动绑定模型并保存配置。
4. 使用一张参考图发起一次低成本测试，检查最终创建请求中的 `images` 为数组。
5. 轮询 `/v1/tasks/{task_id}`，确认状态终态和视频结果地址。
6. 再验证无参考图的文生视频，确认普通请求没有错误携带空数组或无效字段。

2026-09-14 已将云端现有 `SD自定义协议` 渠道的 Base URL 更新为上游文档示例地址，并同步清理当前视频模板中未声明的 `negative_prompt` 字段；参考素材上传、创建、查询和模型数组均经前后快照核对保持预期。模型绑定、密钥、计费、业务代码和其它渠道未修改，且未发起真实生成任务。
