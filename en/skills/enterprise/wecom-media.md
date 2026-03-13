---
name: wecom-media
description: 企业微信素材管理域 SKILL — 临时素材上传/获取、高清语音、永久图片上传、异步大文件上传
version: 1.0.0
domain: media
depends_on: wecom-core
doc_ids: [90253, 90254, 90255, 90256, 91054, 96219]
api_count: 6
callback_count: 1
triggers:
  - wecom media
  - wecom upload
  - 素材管理
  - 上传素材
  - 上传图片
  - 上传文件
  - media_id
  - uploadimg
  - upload_by_url
  - 临时素材
  - 永久图片
  - 异步上传
---

# WeCom Media SKILL (wecom-media)

> 企业微信素材管理域 SKILL：临时素材上传/获取、高清语音素材获取、永久图片上传、异步大文件上传。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. Prerequisites

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret 的 access_token | 完全公开（所有应用均可调用） |
| 第三方应用 | suite_access_token | 完全公开 |

> **核心规则**：`media_id` 在**同一企业内所有应用之间**可以共享，但**有效期仅 3 天**。

### 1.2 使用场景

素材管理是多个域的**底层依赖**：
- `wecom-message`：发送图片/语音/视频/文件消息需要 `media_id`
- `wecom-app`：设置应用头像需要 `logo_media_id`
- `wecom-crm-masssend`：群发消息附件需要 `media_id`
- `wecom-crm-contactway`：入群欢迎语素材需要 `media_id`

---

## 2. Core Concepts

### 2.1 素材体系

```
企业微信素材体系
├── 临时素材 (media_id, 3天有效)
│   ├── 同步上传 — multipart/form-data, ≤20MB
│   └── 异步上传 — CDN URL, ≤200MB (video/file)
├── 永久图片 (url, 永久有效)
│   └── 上传图片 — multipart/form-data, ≤2MB
└── 高清语音 (speex 16K, 通过 JSSDK 上传)
    └── 获取接口专用
```

### 2.2 临时素材类型与限制

| 类型 | type 值 | 最大大小 | 格式要求 | 说明 |
|------|---------|---------|---------|------|
| 图片 | `image` | 10MB | JPG, PNG | — |
| 语音 | `voice` | 2MB | AMR | 播放 ≤60s |
| 视频 | `video` | 10MB | MP4 | — |
| 文件 | `file` | 20MB | 任意 | — |

> **所有文件 size 必须 > 5 字节**

### 2.3 异步上传限制（大文件）

| 类型 | type 值 | 最大大小 | 格式要求 |
|------|---------|---------|---------|
| 视频 | `video` | 200MB | MP4 |
| 文件 | `file` | 200MB | 任意 |

> 图片和语音**不支持**异步上传。

### 2.4 永久图片上传限制

- 大小：5B ~ 2MB
- 返回 URL 永久有效
- 上传限制：3,000 张/月，1,000 张/天
- 主要用途：图文消息中的图片（避免 media_id 3天过期）

### 2.5 两种素材的对比

| 维度 | 临时素材 (media_id) | 永久图片 (url) |
|------|-------------------|---------------|
| 有效期 | 3 天 | 永久 |
| 上传方式 | multipart 或异步 CDN | 仅 multipart |
| 支持类型 | image/voice/video/file | 仅 image |
| 大小限制 | ≤20MB (同步), ≤200MB (异步) | ≤2MB |
| 频率限制 | 5,000 次/分钟 | 3,000 张/月 |
| 适用场景 | 发消息、欢迎语 | 图文消息中嵌入图片 |

---

## 3. API Quick Reference

| # | 接口 | 方法 | Endpoint | 幂等 |
|---|------|------|----------|------|
| M1 | 上传临时素材 | POST (multipart) | `media/upload` | 否 |
| M2 | 获取临时素材 | GET | `media/get` | 是 |
| M3 | 获取高清语音素材 | GET | `media/get/jssdk` | 是 |
| M4 | 上传图片（永久） | POST (multipart) | `media/uploadimg` | 否 |
| M5 | 异步上传临时素材 | POST | `media/upload_by_url` | 否 |
| M6 | 查询异步上传结果 | POST | `media/get_upload_by_url_result` | 是 |

---

## 4. API Details

### M1. 上传临时素材

```
POST https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=ACCESS_TOKEN&type=TYPE
```

**请求方式**：`multipart/form-data`，文件字段名为 `media`

**请求参数**：

| 参数 | 必须 | 位置 | 类型 | 说明 |
|------|------|------|------|------|
| access_token | 是 | query | string | 调用接口凭证 |
| type | 是 | query | string | 素材类型：image/voice/video/file |
| media | 是 | body (form-data) | file | 文件内容，含 filename/filelength/content-type |

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 素材类型 |
| media_id | string | 素材 ID，3 天内有效 |
| created_at | string | 上传时间戳 |

**返回示例**：

```json
{
    "errcode": 0,
    "errmsg": "",
    "type": "image",
    "media_id": "1G6nrLmr5EC3MMb_-zK1dDdzmd0p7cNliYu9V5w7o8K0",
    "created_at": "1380000000"
}
```

**频率限制**：5,000 次/分钟

---

### M2. 获取临时素材

```
GET https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证 |
| media_id | 是 | string | 素材 ID |

**返回说明**：

成功时返回文件的二进制内容（与普通 HTTP 下载相同），HTTP Headers 包含：
- `Content-Type`：文件 MIME 类型（如 `image/jpeg`）
- `Content-disposition`：`attachment; filename="MEDIA_ID.jpg"`
- `Content-Length`：文件大小

错误时返回 JSON：`{"errcode": 40007, "errmsg": "invalid media_id"}`

**支持断点下载**：可通过 `Range` 请求头实现分块下载（文件超过 20MB 时必须使用）。

**权限说明**：完全公开，`media_id` 在同一企业内所有应用之间可以共享。

---

### M3. 获取高清语音素材

```
GET https://qyapi.weixin.qq.com/cgi-bin/media/get/jssdk?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
```

**与 M2 的区别**：
- M2 获取的语音为 AMR 格式，8K 采样率
- M3 获取的语音为 **Speex** 格式，**16K** 采样率，音质更清晰
- M3 仅用于获取从 **JSSDK `uploadVoice`** 接口上传的语音

**返回说明**：成功时返回文件二进制（Content-Type: voice/speex），错误时返回 JSON。

**Speex 解码**：
- 官方解码库：https://speex.org/downloads/
- 微信解码库（含示例）：https://wximg.gtimg.com/shake_tv/mpwiki/declib.zip

---

### M4. 上传图片（永久）

```
POST https://qyapi.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN
```

**请求方式**：`multipart/form-data`，文件字段名为 `media`（或 `fieldNameHere`）

**请求参数**：

| 参数 | 必须 | 位置 | 类型 | 说明 |
|------|------|------|------|------|
| access_token | 是 | query | string | 调用接口凭证 |
| media | 是 | body (form-data) | file | 图片文件，5B ~ 2MB |

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| url | string | 图片 URL，**永久有效** |

**返回示例**：

```json
{
    "errcode": 0,
    "errmsg": "",
    "url": "http://p.qpic.cn/pic_wework/xxxx/0"
}
```

**频率限制**：3,000 张/月，1,000 张/天

> **用途**：主要用于发送图文消息时的图片。普通发图消息建议使用 M1 的临时素材。

---

### M5. 异步上传临时素材（生成任务）

```
POST https://qyapi.weixin.qq.com/cgi-bin/media/upload_by_url?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| scene | 是 | int | 场景值：1=入群欢迎语素材 |
| type | 是 | string | 素材类型：video / file |
| filename | 是 | string | 文件名，需包含后缀 |
| url | 是 | string | 文件的 CDN 下载链接，必须支持 `Range` 分块下载 |
| md5 | 是 | string | 文件 MD5（用于校验完整性） |

**请求示例**：

```json
{
    "scene": 1,
    "type": "video",
    "filename": "video.mp4",
    "url": "https://cdn.example.com/video.mp4",
    "md5": "d41d8cd98f00b204e9800998ecf8427e"
}
```

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| jobid | string | 异步任务 ID，用于查询结果 |

**返回示例**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "jobid": "jobid_xxx"
}
```

**权限说明**：需要客户联系权限。

**媒体文件限制**（异步上传专属）：
- 图片（image）：不支持
- 语音（voice）：不支持
- 视频（video）：≤200MB，仅 MP4
- 文件（file）：≤200MB

> **注意**：异步上传获得的 `media_id` 与同步上传 M1 获得的 `media_id` **使用场景不完全通用**。目前适配：获取临时素材(M2)、入群欢迎语素材管理。

---

### M6. 查询异步上传结果

```
POST https://qyapi.weixin.qq.com/cgi-bin/media/get_upload_by_url_result?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| jobid | 是 | string | M5 返回的异步任务 ID |

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| status | int | 任务状态：1=处理中, 2=完成, 3=异常 |
| detail | object | 任务结果详情（status=2 时） |
| detail.errcode | int | 结果错误码，0=成功 |
| detail.media_id | string | 素材 ID（成功时） |
| detail.created_at | string | 创建时间戳（成功时） |

**返回示例**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "status": 2,
    "detail": {
        "errcode": 0,
        "errmsg": "ok",
        "media_id": "3G6nrLmr5EC3MMb_-zK1dDdzmd0p7cNliYu9V5w7o8K0",
        "created_at": "1380000000"
    }
}
```

**任务结果错误码（detail.errcode）**：

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 830001 | 文件下载失败 |
| 830002 | 文件超过大小限制 |
| 830003 | 文件 MD5 校验失败 |
| 830004 | 文件格式不支持 |

---

## 5. Callbacks

### C1. upload_media_job_finish — 异步上传任务完成

**触发条件**：通过 M5 提交的异步上传任务处理完成（无论成功或失败）

**配置位置**：提交任务的应用的回调 URL

**回调 XML**：

```xml
<xml>
    <ToUserName><![CDATA[wx28dbb14e3720FAKE]]></ToUserName>
    <FromUserName><![CDATA[sys]]></FromUserName>
    <CreateTime>1425284517</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[upload_media_job_finish]]></Event>
    <JobId><![CDATA[jobid_S0MrnndvRG5fadSlLwiBqiDDbM143UqTmKP3152FZk4]]></JobId>
</xml>
```

| 参数 | 说明 |
|------|------|
| FromUserName | `sys`（系统事件） |
| MsgType | `event` |
| Event | `upload_media_job_finish` |
| JobId | 异步任务 ID，与 M5 返回的 jobid 对应 |

> **注意**：回调仅通知任务完成，不包含具体结果。收到回调后需调用 M6 查询实际结果。

---

## 6. Workflows

### 6.1 同步上传素材 → 发消息

```
1. 上传临时素材 (M1) → 获得 media_id
2. 使用 media_id 调用 wecom-message 发送消息
3. media_id 3 天后过期，需重新上传
```

### 6.2 异步上传大文件 → 入群欢迎语

```
1. 提交异步上传任务 (M5) → 获得 jobid
2. 等待回调 upload_media_job_finish (C1)
   或 轮询查询任务结果 (M6)
3. 获得 media_id → 用于入群欢迎语素材
```

### 6.3 图文消息中使用永久图片

```
1. 上传图片 (M4) → 获得永久 URL
2. 在图文消息（mpnews）的 content HTML 中使用 <img src="永久URL">
3. URL 永久有效，无需定期更新
```

---

## 7. Code Templates

### 7.1 Python

```python
"""WeCom Media Client — 素材管理"""
import os
import hashlib
from pathlib import Path
from wecom_core import WeComClient


class MediaClient:
    """企业微信素材管理客户端"""

    # 临时素材大小限制 (bytes)
    SIZE_LIMITS = {
        "image": 10 * 1024 * 1024,   # 10MB
        "voice": 2 * 1024 * 1024,    # 2MB
        "video": 10 * 1024 * 1024,   # 10MB
        "file":  20 * 1024 * 1024,   # 20MB
    }
    ASYNC_SIZE_LIMIT = 200 * 1024 * 1024  # 200MB

    def __init__(self, client: WeComClient):
        self.client = client

    # ── M1 上传临时素材 ──

    def upload_media(self, media_type: str, filepath: str) -> dict:
        """上传临时素材，返回 {type, media_id, created_at}

        Args:
            media_type: image / voice / video / file
            filepath: 本地文件路径

        Raises:
            ValueError: 文件类型不支持或超过大小限制
        """
        if media_type not in self.SIZE_LIMITS:
            raise ValueError(f"不支持的素材类型: {media_type}")

        file_size = os.path.getsize(filepath)
        if file_size < 5:
            raise ValueError("文件大小必须 > 5 字节")
        if file_size > self.SIZE_LIMITS[media_type]:
            raise ValueError(
                f"{media_type} 文件不能超过 "
                f"{self.SIZE_LIMITS[media_type] // 1024 // 1024}MB"
            )

        filename = Path(filepath).name
        with open(filepath, "rb") as f:
            files = {"media": (filename, f)}
            return self.client.post(
                "/media/upload",
                params={"type": media_type},
                files=files,
            )

    # ── M2 获取临时素材 ──

    def get_media(self, media_id: str, save_path: str) -> str:
        """下载临时素材到本地文件

        Args:
            media_id: 素材 ID
            save_path: 保存路径

        Returns:
            实际保存的文件路径
        """
        import requests
        token = self.client.access_token
        url = f"{self.client.BASE_URL}/media/get"
        resp = requests.get(
            url,
            params={"access_token": token, "media_id": media_id},
            stream=True,
            timeout=30,
        )
        # 错误时返回 JSON
        if resp.headers.get("Content-Type", "").startswith("application/json"):
            data = resp.json()
            raise RuntimeError(f"获取素材失败: {data}")

        with open(save_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return save_path

    # ── M3 获取高清语音素材 ──

    def get_jssdk_media(self, media_id: str, save_path: str) -> str:
        """下载 JSSDK 上传的高清语音素材 (Speex 16K)"""
        import requests
        token = self.client.access_token
        url = f"{self.client.BASE_URL}/media/get/jssdk"
        resp = requests.get(
            url,
            params={"access_token": token, "media_id": media_id},
            stream=True,
            timeout=30,
        )
        if resp.headers.get("Content-Type", "").startswith("application/json"):
            data = resp.json()
            raise RuntimeError(f"获取高清语音失败: {data}")

        with open(save_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return save_path

    # ── M4 上传图片（永久）──

    def upload_image(self, filepath: str) -> str:
        """上传永久图片，返回图片 URL（永久有效）

        大小限制: 5B ~ 2MB
        频率限制: 3,000张/月，1,000张/天
        """
        file_size = os.path.getsize(filepath)
        if file_size < 5 or file_size > 2 * 1024 * 1024:
            raise ValueError("图片大小必须在 5B ~ 2MB 之间")

        filename = Path(filepath).name
        with open(filepath, "rb") as f:
            files = {"media": (filename, f)}
            resp = self.client.post("/media/uploadimg", files=files)
            return resp["url"]

    # ── M5 异步上传临时素材 ──

    def upload_by_url(
        self,
        scene: int,
        media_type: str,
        filename: str,
        url: str,
        md5: str,
    ) -> str:
        """提交异步上传任务，返回 jobid

        Args:
            scene: 场景值，1=入群欢迎语素材
            media_type: video / file（不支持 image/voice）
            filename: 文件名（含后缀）
            url: CDN 下载链接，必须支持 Range 分块下载
            md5: 文件 MD5 校验值
        """
        if media_type not in ("video", "file"):
            raise ValueError("异步上传仅支持 video 和 file 类型")

        resp = self.client.post(
            "/media/upload_by_url",
            json={
                "scene": scene,
                "type": media_type,
                "filename": filename,
                "url": url,
                "md5": md5,
            },
        )
        return resp["jobid"]

    # ── M6 查询异步上传结果 ──

    def get_upload_result(self, jobid: str) -> dict:
        """查询异步上传任务结果

        Returns:
            {"status": 1|2|3, "detail": {...}}
            status: 1=处理中, 2=完成, 3=异常
        """
        return self.client.post(
            "/media/get_upload_by_url_result",
            json={"jobid": jobid},
        )

    # ── 工具方法 ──

    @staticmethod
    def file_md5(filepath: str) -> str:
        """计算文件 MD5"""
        h = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
```

### 7.2 TypeScript

```typescript
/** WeCom Media Client — 素材管理 */
import { WeComClient } from './wecom-core';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024,
  voice: 2 * 1024 * 1024,
  video: 10 * 1024 * 1024,
  file: 20 * 1024 * 1024,
};

interface UploadResult {
  type: string;
  media_id: string;
  created_at: string;
}

interface AsyncUploadResult {
  status: 1 | 2 | 3; // 1=处理中, 2=完成, 3=异常
  detail: {
    errcode: number;
    errmsg: string;
    media_id?: string;
    created_at?: string;
  };
}

export class MediaClient {
  constructor(private client: WeComClient) {}

  /** M1: 上传临时素材 */
  async uploadMedia(mediaType: string, filepath: string): Promise<UploadResult> {
    const limit = SIZE_LIMITS[mediaType];
    if (!limit) throw new Error(`不支持的素材类型: ${mediaType}`);

    const stat = fs.statSync(filepath);
    if (stat.size < 5) throw new Error('文件大小必须 > 5 字节');
    if (stat.size > limit) throw new Error(`${mediaType} 文件不能超过 ${limit / 1024 / 1024}MB`);

    const filename = path.basename(filepath);
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('media', fs.createReadStream(filepath), { filename });

    return this.client.request('POST', '/media/upload', form, { type: mediaType });
  }

  /** M2: 获取临时素材 (返回 Buffer) */
  async getMedia(mediaId: string): Promise<Buffer> {
    const token = await (this.client as any).getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=${token}&media_id=${mediaId}`;
    const resp = await fetch(url);
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await resp.json();
      throw new Error(`获取素材失败: ${JSON.stringify(data)}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  }

  /** M3: 获取高清语音素材 (Speex 16K) */
  async getJssdkMedia(mediaId: string): Promise<Buffer> {
    const token = await (this.client as any).getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/media/get/jssdk?access_token=${token}&media_id=${mediaId}`;
    const resp = await fetch(url);
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await resp.json();
      throw new Error(`获取高清语音失败: ${JSON.stringify(data)}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  }

  /** M4: 上传永久图片，返回 URL */
  async uploadImage(filepath: string): Promise<string> {
    const stat = fs.statSync(filepath);
    if (stat.size < 5 || stat.size > 2 * 1024 * 1024) {
      throw new Error('图片大小必须在 5B ~ 2MB 之间');
    }

    const filename = path.basename(filepath);
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('media', fs.createReadStream(filepath), { filename });

    const resp = await this.client.request('POST', '/media/uploadimg', form);
    return resp.url as string;
  }

  /** M5: 异步上传临时素材 */
  async uploadByUrl(params: {
    scene: number;
    type: 'video' | 'file';
    filename: string;
    url: string;
    md5: string;
  }): Promise<string> {
    const resp = await this.client.request('POST', '/media/upload_by_url', params);
    return resp.jobid as string;
  }

  /** M6: 查询异步上传结果 */
  async getUploadResult(jobid: string): Promise<AsyncUploadResult> {
    return this.client.request('POST', '/media/get_upload_by_url_result', { jobid });
  }

  /** 工具: 计算文件 MD5 */
  static fileMd5(filepath: string): string {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filepath);
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    }) as unknown as string;
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
)

// MediaClient 素材管理客户端
type MediaClient struct {
	Client *Client
}

// NewMediaClient 创建素材管理客户端
func NewMediaClient(client *Client) *MediaClient {
	return &MediaClient{Client: client}
}

// UploadResult 上传结果
type UploadResult struct {
	Type      string `json:"type"`
	MediaID   string `json:"media_id"`
	CreatedAt string `json:"created_at"`
}

// AsyncUploadDetail 异步上传详情
type AsyncUploadDetail struct {
	ErrCode   int    `json:"errcode"`
	ErrMsg    string `json:"errmsg"`
	MediaID   string `json:"media_id"`
	CreatedAt string `json:"created_at"`
}

// AsyncUploadResult 异步上传结果
type AsyncUploadResult struct {
	Status int                `json:"status"` // 1=处理中, 2=完成, 3=异常
	Detail AsyncUploadDetail  `json:"detail"`
}

var sizeLimits = map[string]int64{
	"image": 10 * 1024 * 1024,
	"voice": 2 * 1024 * 1024,
	"video": 10 * 1024 * 1024,
	"file":  20 * 1024 * 1024,
}

// UploadMedia M1: 上传临时素材
func (c *MediaClient) UploadMedia(mediaType, filePath string) (*UploadResult, error) {
	limit, ok := sizeLimits[mediaType]
	if !ok {
		return nil, fmt.Errorf("不支持的素材类型: %s", mediaType)
	}
	info, err := os.Stat(filePath)
	if err != nil {
		return nil, err
	}
	if info.Size() < 5 {
		return nil, fmt.Errorf("文件大小必须 > 5 字节")
	}
	if info.Size() > limit {
		return nil, fmt.Errorf("%s 文件不能超过 %dMB", mediaType, limit/1024/1024)
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("media", filepath.Base(filePath))
	if err != nil {
		return nil, err
	}
	if _, err = io.Copy(part, file); err != nil {
		return nil, err
	}
	writer.Close()

	token, err := c.Client.GetToken()
	if err != nil {
		return nil, err
	}
	url := fmt.Sprintf("%s/media/upload?access_token=%s&type=%s", baseURL, token, mediaType)
	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.Client.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
		UploadResult
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, &WeComError{result.ErrCode, result.ErrMsg}
	}
	return &result.UploadResult, nil
}

// GetMedia M2: 获取临时素材（保存到文件）
func (c *MediaClient) GetMedia(mediaID, savePath string) error {
	token, err := c.Client.GetToken()
	if err != nil {
		return err
	}
	url := fmt.Sprintf("%s/media/get?access_token=%s&media_id=%s", baseURL, token, mediaID)
	resp, err := c.Client.httpClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	out, err := os.Create(savePath)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	return err
}

// UploadImage M4: 上传永久图片
func (c *MediaClient) UploadImage(filePath string) (string, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		return "", err
	}
	if info.Size() < 5 || info.Size() > 2*1024*1024 {
		return "", fmt.Errorf("图片大小必须在 5B ~ 2MB 之间")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("media", filepath.Base(filePath))
	io.Copy(part, file)
	writer.Close()

	token, err := c.Client.GetToken()
	if err != nil {
		return "", err
	}
	url := fmt.Sprintf("%s/media/uploadimg?access_token=%s", baseURL, token)
	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.Client.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	if code, ok := result["errcode"].(float64); ok && code != 0 {
		return "", fmt.Errorf("上传图片失败: %v", result["errmsg"])
	}
	return result["url"].(string), nil
}

// UploadByURL M5: 异步上传临时素材
func (c *MediaClient) UploadByURL(scene int, mediaType, filename, fileURL, fileMD5 string) (string, error) {
	result, err := c.Client.Request("POST", "/media/upload_by_url", map[string]interface{}{
		"scene":    scene,
		"type":     mediaType,
		"filename": filename,
		"url":      fileURL,
		"md5":      fileMD5,
	})
	if err != nil {
		return "", err
	}
	return result["jobid"].(string), nil
}

// GetUploadResult M6: 查询异步上传结果
func (c *MediaClient) GetUploadResult(jobid string) (map[string]interface{}, error) {
	return c.Client.Request("POST", "/media/get_upload_by_url_result", map[string]interface{}{
		"jobid": jobid,
	})
}

// FileMD5 工具函数：计算文件 MD5
func FileMD5(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
```

---


### 7.4 Java 示例

```java
import java.io.File;

public class WeComMediaService {
    private final WeComClient client;
    private final OkHttpClient http = new OkHttpClient();

    public WeComMediaService(WeComClient client) {
        this.client = client;
    }

    /** 上传临时素材 — ⚠️ 3天有效 */
    public String uploadMedia(String type, File file) throws Exception {
        String url = "https://qyapi.weixin.qq.com/cgi-bin/media/upload"
            + "?access_token=" + client.getAccessToken()
            + "&type=" + type;
        RequestBody fileBody = RequestBody.create(file, MediaType.parse("application/octet-stream"));
        MultipartBody body = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("media", file.getName(), fileBody)
            .build();
        Request req = new Request.Builder().url(url).post(body).build();
        try (Response resp = http.newCall(req).execute()) {
            JsonObject json = new Gson().fromJson(resp.body().string(), JsonObject.class);
            return json.get("media_id").getAsString();
        }
    }
}
```

**依赖 (Maven)**:
```xml
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>
```

### 7.5 PHP 示例

```php
<?php
class WeComMediaService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 上传临时素材 — ⚠️ 3天有效 */
    public function uploadMedia(string $type, string $filePath): string
    {
        $http = new \GuzzleHttp\Client(['timeout' => 30]);
        $resp = $http->post(
            "https://qyapi.weixin.qq.com/cgi-bin/media/upload",
            [
                'query'     => [
                    'access_token' => $this->client->getAccessToken(),
                    'type'         => $type,
                ],
                'multipart' => [
                    [
                        'name'     => 'media',
                        'contents' => fopen($filePath, 'r'),
                        'filename' => basename($filePath),
                    ],
                ],
            ]
        );
        $data = json_decode($resp->getBody()->getContents(), true);
        return $data['media_id'];
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 8. Test Templates

### 8.1 Python (pytest)

```python
"""Tests for WeComMedia client"""
import pytest
from unittest.mock import patch, MagicMock, mock_open
import os


@pytest.fixture
def client():
    from wecom_core import WeComClient
    with patch.object(WeComClient, '_refresh_token'):
        c = WeComClient("test_corp", "test_secret")
        c._token = "mock_token"
        c._token_expires_at = float('inf')
        return c


@pytest.fixture
def media_client(client):
    from wecom_media import MediaClient
    return MediaClient(client)


class TestUploadMedia:
    """M1: 上传临时素材"""

    @patch("os.path.getsize", return_value=1024)
    @patch("builtins.open", mock_open(read_data=b"fake_image"))
    def test_上传图片成功(self, mock_size, media_client):
        with patch.object(media_client.client, "post", return_value={
            "errcode": 0, "type": "image",
            "media_id": "MEDIA_ID_001", "created_at": "1380000000",
        }):
            result = media_client.upload_media("image", "/tmp/test.jpg")
            assert result["media_id"] == "MEDIA_ID_001"

    def test_不支持的素材类型(self, media_client):
        with pytest.raises(ValueError, match="不支持的素材类型"):
            media_client.upload_media("unknown", "/tmp/test.txt")

    @patch("os.path.getsize", return_value=3)
    def test_文件太小(self, mock_size, media_client):
        with pytest.raises(ValueError, match="5 字节"):
            media_client.upload_media("image", "/tmp/tiny.jpg")

    @patch("os.path.getsize", return_value=11 * 1024 * 1024)
    def test_图片超过10MB(self, mock_size, media_client):
        with pytest.raises(ValueError, match="10MB"):
            media_client.upload_media("image", "/tmp/big.jpg")


class TestUploadImage:
    """M4: 上传永久图片"""

    @patch("os.path.getsize", return_value=1024)
    @patch("builtins.open", mock_open(read_data=b"fake_image"))
    def test_上传永久图片成功(self, mock_size, media_client):
        with patch.object(media_client.client, "post", return_value={
            "errcode": 0, "url": "http://p.qpic.cn/xxx",
        }):
            url = media_client.upload_image("/tmp/test.png")
            assert url.startswith("http")

    @patch("os.path.getsize", return_value=3 * 1024 * 1024)
    def test_图片超过2MB(self, mock_size, media_client):
        with pytest.raises(ValueError, match="2MB"):
            media_client.upload_image("/tmp/big.png")


class TestAsyncUpload:
    """M5/M6: 异步上传"""

    def test_提交异步任务成功(self, media_client):
        with patch.object(media_client.client, "post", return_value={
            "errcode": 0, "errmsg": "ok", "jobid": "JOB_001",
        }):
            jobid = media_client.upload_by_url(
                scene=1, media_type="video",
                filename="video.mp4", url="https://cdn.example.com/v.mp4",
                md5="abc123",
            )
            assert jobid == "JOB_001"

    def test_不支持图片异步上传(self, media_client):
        with pytest.raises(ValueError, match="video 和 file"):
            media_client.upload_by_url(
                scene=1, media_type="image",
                filename="img.jpg", url="https://example.com/img.jpg",
                md5="abc123",
            )

    def test_查询任务结果_完成(self, media_client):
        with patch.object(media_client.client, "post", return_value={
            "errcode": 0, "status": 2,
            "detail": {"errcode": 0, "media_id": "MEDIA_002", "created_at": "1380000000"},
        }):
            result = media_client.get_upload_result("JOB_001")
            assert result["status"] == 2
            assert result["detail"]["media_id"] == "MEDIA_002"

    def test_查询任务结果_处理中(self, media_client):
        with patch.object(media_client.client, "post", return_value={
            "errcode": 0, "status": 1,
        }):
            result = media_client.get_upload_result("JOB_001")
            assert result["status"] == 1
```

---

## 9. Code Review Checklist

### 9.1 上传相关

| # | 检查项 | 严重度 |
|---|--------|--------|
| R1 | 上传是否使用 `multipart/form-data` 而非 JSON body | CRITICAL |
| R2 | 上传字段名是否为 `media`（非其他名称） | HIGH |
| R3 | `type` 参数是否在 query string 中传递（非 body） | HIGH |
| R4 | 是否校验文件大小（> 5B，不超限） | MEDIUM |
| R5 | 是否校验文件格式（image=JPG/PNG, voice=AMR, video=MP4） | MEDIUM |

### 9.2 获取相关

| # | 检查项 | 严重度 |
|---|--------|--------|
| R6 | 获取素材是否处理了**二进制 vs JSON** 两种响应（成功返回二进制，失败返回 JSON） | CRITICAL |
| R7 | 是否注意到 media_id **3 天过期**，有过期重试逻辑 | HIGH |
| R8 | 大文件下载是否使用流式写入（而非全部读入内存） | HIGH |
| R9 | 是否支持断点下载（Range header）处理超 20MB 文件 | MEDIUM |

### 9.3 异步上传

| # | 检查项 | 严重度 |
|---|--------|--------|
| R10 | CDN URL 是否支持 `Range` 分块下载 | HIGH |
| R11 | 文件 MD5 是否正确计算并传递 | HIGH |
| R12 | 是否处理 status=3 异常状态和 830001-830004 错误码 | HIGH |
| R13 | 是否意识到异步 media_id 的使用场景与同步 media_id **不完全通用** | MEDIUM |

### 9.4 通用

| # | 检查项 | 严重度 |
|---|--------|--------|
| R14 | 是否正确处理 `errcode != 0` 的错误响应 | CRITICAL |
| R15 | 是否有 `access_token` 过期重试机制（42001） | HIGH |
| R16 | 永久图片上传是否意识到频率限制（3,000/月，1,000/天） | MEDIUM |

---

## 10. Gotcha Guide

### G1. media_id 3 天过期

临时素材的 `media_id` 有效期仅 **3 天**。如果你存储了 `media_id` 供后续使用，必须实现过期检测和重新上传机制。

### G2. 获取素材返回的是二进制，不是 JSON

M2/M3 成功时直接返回文件的二进制内容（像普通 HTTP 文件下载），不是 JSON。只有**错误时**才返回 JSON `{"errcode": 40007, ...}`。代码必须先检查 `Content-Type` 判断成功/失败。

### G3. 永久图片 vs 临时素材用途不同

- `upload_media` (M1) 返回 `media_id` → 用于发送图片/语音/视频/文件消息
- `uploadimg` (M4) 返回 `url` → **仅用于图文消息 (mpnews) 中的嵌入图片**
- 两者不可互换

### G4. multipart 上传字段名必须是 "media"

企业微信要求上传文件字段名为 `media`，且 form-data 中必须包含 `filename`、`filelength`、`content-type` 信息。一些 HTTP 库默认不带 `filelength`，需手动设置。

### G5. 异步上传的 media_id 使用场景有限

通过 M5 异步上传获得的 `media_id` 目前**仅适配**以下场景：
- 获取临时素材 (M2)
- 入群欢迎语素材管理

其他场景（如发送应用消息）需使用 M1 同步上传的 `media_id`。

### G6. 异步上传 CDN URL 必须支持 Range

M5 的 `url` 参数对应的文件服务必须支持 HTTP `Range` 请求头（断点续传），否则企微后台无法分块下载，任务会失败（错误码 830001）。

### G7. 语音格式 AMR vs Speex

- M2 获取的语音：**AMR 8K 采样率**（普通质量）
- M3 获取的语音：**Speex 16K 采样率**（高清，需 JSSDK 上传）
- 如果你的场景需要语音识别，优先使用 M3 的高清语音

### G8. 上传永久图片的月/日限额

`uploadimg` (M4) 有严格的频率限制：**3,000 张/月**、**1,000 张/天**。这是企业级的总限额，不是单应用限额。大量图片上传场景需要做好配额管理。

---

## 11. References

| doc_id | 标题 | 说明 |
|--------|------|------|
| 90253 (10112) | 上传临时素材 | multipart 上传 + 文件限制 |
| 90254 (10115) | 获取临时素材 | 下载文件 + 断点下载 |
| 90255 (12250) | 获取高清语音素材 | Speex 16K + 解码库 |
| 90256 (13219) | 上传图片 | 永久图片 URL + 月限额 |
| 91054 (15104) | 素材管理概述 | 总览 |
| 96219 (42044) | 异步上传临时素材 | 大文件 CDN 上传 + 回调 |

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

**依赖 SKILL**：`wecom-core`（Token 管理、错误处理、请求基础设施）


