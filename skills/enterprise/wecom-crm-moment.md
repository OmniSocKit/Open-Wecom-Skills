---
name: wecom-crm-moment
description: 企业微信外部联系人·客户朋友圈 SKILL — 创建发表任务、查询发表/送达/互动数据、停止任务
version: 1.0.0
triggers:
  - 朋友圈
  - moment
  - add_moment_task
  - get_moment_list
  - get_moment_task
  - moment_id
  - jobid
  - 发表任务
  - 互动数据
  - cancel_moment_task
  - upload_attachment
  - 41059
  - 41078
prerequisite_skills:
  - wecom-core
domain: crm-moment
api_count: 8
callback_count: 0
---

# WeCom CRM · 客户朋友圈 SKILL

> 覆盖企业微信「外部联系人 · 客户朋友圈」子域：创建发表任务（异步）、查询发表列表/执行状态/可见范围/送达结果/互动数据、停止任务。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 「客户联系」secret 或已配置到「可调用应用」列表的自建应用 secret | 客户联系使用范围 |
| 第三方应用 | 企业授权的 access_token | 「客户朋友圈」权限 |

### 1.2 附件上传须知

**重要**：朋友圈附件 `media_id` 必须通过**上传附件资源**接口获取，**不能**用通用临时素材接口。

| 对比项 | 通用上传 `/media/upload` | 朋友圈专用 `/media/upload_attachment` |
|--------|------------------------|-------------------------------------|
| 参数 | `type=TYPE` | `media_type=TYPE` + `attachment_type=1` |
| 支持类型 | 图片/语音/视频/文件 | **仅图片与视频** |
| 有效期 | 3 天 | 3 天 |

---

## 2. 核心概念

### 2.1 异步创建模式

朋友圈发表任务为**异步创建**：
1. 调用 M1 `add_moment_task` → 返回 `jobid`（24h 有效）
2. 轮询 M2 `get_moment_task_result` → status=3 时获得 `moment_id`
3. 用 `moment_id` 调用后续查询接口

### 2.2 附件类型与限制

| 类型 | msgtype | 数量上限 | 文件限制 |
|------|---------|---------|---------|
| 图片 | `image` | **9** 张 | 10MB, JPG/PNG |
| 视频 | `video` | **1** 个 | 10MB, MP4, ≤30秒 |
| 链接 | `link` | **1** 个 | title≤64字节 |

> **附件类型不可混用**：每条朋友圈只能选一种附件类型，搭配文字内容。

### 2.3 任务状态 (status)

| status | 含义 |
|--------|------|
| 1 | 开始创建任务 |
| 2 | 正在创建任务中 |
| 3 | 创建任务已完成 |

### 2.4 发表状态 (publish_status)

| publish_status | 含义 |
|----------------|------|
| 0 | 未发表 |
| 1 | 已发表 |

### 2.5 朋友圈类型 (create_type / filter_type)

| 值 | 含义 |
|----|------|
| 0 | 企业创建（API 创建） |
| 1 | 成员个人创建 |
| 2 | 全部（仅 filter_type 可用） |

### 2.6 可见范围类型 (visible_type)

| 值 | 含义 |
|----|------|
| 0 | 部分可见 |
| 1 | 公开 |

### 2.7 get_moment_customer_list vs get_moment_send_result

| 接口 | 含义 |
|------|------|
| M5 `get_moment_customer_list` | 发表时**预设**的可见客户范围 |
| M6 `get_moment_send_result` | 发表后**实际**可见的客户列表 |

---

## 3. API 速查表

| ID | 接口名 | 方法 | 路径 | 说明 |
|----|--------|------|------|------|
| M1 | add_moment_task | **POST** | `/cgi-bin/externalcontact/add_moment_task` | 创建发表任务（异步） |
| M2 | get_moment_task_result | **GET** | `/cgi-bin/externalcontact/get_moment_task_result` | 获取任务创建结果 |
| M3 | get_moment_list | POST | `/cgi-bin/externalcontact/get_moment_list` | 获取企业全部发表列表 |
| M4 | get_moment_task | POST | `/cgi-bin/externalcontact/get_moment_task` | 获取成员执行情况 |
| M5 | get_moment_customer_list | POST | `/cgi-bin/externalcontact/get_moment_customer_list` | 获取预设可见范围 |
| M6 | get_moment_send_result | POST | `/cgi-bin/externalcontact/get_moment_send_result` | 获取实际送达客户 |
| M7 | get_moment_comments | POST | `/cgi-bin/externalcontact/get_moment_comments` | 获取互动数据 |
| M8 | cancel_moment_task | POST | `/cgi-bin/externalcontact/cancel_moment_task` | 停止未发表任务 |

**Base URL**: `https://qyapi.weixin.qq.com`
**注意**：M2 是 **GET** 请求（jobid 通过 Query 参数传递），其余均为 POST。

---

## 4. API 详细说明

### M1: 创建发表任务

**POST** `/cgi-bin/externalcontact/add_moment_task?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | object | 否 | 文本内容 |
| `text.content` | string | 否 | 文本内容，最多 **2000** 字符 |
| `attachments` | object[] | 否 | 附件列表。图片≤9 / 视频≤1 / 链接≤1，不可混用 |
| `attachments[].msgtype` | string | 是 | `image` / `video` / `link` |
| `attachments[].image.media_id` | string | 是 | 图片 media_id（**须用 upload_attachment**） |
| `attachments[].video.media_id` | string | 是 | 视频 media_id |
| `attachments[].link.title` | string | 是 | 链接标题，≤64 字节 |
| `attachments[].link.url` | string | 是 | 链接地址 |
| `attachments[].link.media_id` | string | 是 | 链接封面图 media_id |
| `visible_range` | object | 否 | 可见范围 |
| `visible_range.sender_list.user_list` | string[] | 否 | 执行者 userid 列表，最多 **10 万** |
| `visible_range.sender_list.department_list` | int[] | 否 | 执行者部门 ID 列表 |
| `visible_range.external_contact_list.tag_list` | string[] | 否 | 可见客户标签 ID 列表 |

> `text` 和 `attachments` 不能同时为空（errcode 41089）。

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `jobid` | string | 异步任务 ID，**24 小时有效** |

#### 频率限制

- 企业每月通过 API 创建朋友圈：**10 万次**
- 每分钟创建频率：**10 条/分钟**

---

### M2: 获取任务创建结果

**GET** `/cgi-bin/externalcontact/get_moment_task_result?access_token=ACCESS_TOKEN&jobid=JOBID`

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | int | 1=开始创建 2=创建中 3=已完成 |
| `type` | string | 固定 `"add_moment_task"` |
| `result` | object | status=3 时有值 |
| `result.moment_id` | string | 朋友圈 ID |
| `result.invalid_sender_list` | object | 无效执行者 |
| `result.invalid_external_contact_list` | object | 无效外部联系人 |

> **轮询建议**：间隔 2~5 秒，status=1/2 时继续轮询，jobid 24h 过期。

---

### M3: 获取企业全部的发表列表

**POST** `/cgi-bin/externalcontact/get_moment_list?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start_time` | int | 是 | 开始时间戳 |
| `end_time` | int | 是 | 结束时间戳（与 start_time 间隔≤**30 天**） |
| `creator` | string | 否 | 创建人 userid，不填返回全部 |
| `filter_type` | int | 否 | 0=企业发表 1=个人发表 2=全部(默认) |
| `cursor` | string | 否 | 分页游标 |
| `limit` | int | 否 | 每页大小，默认 50，最大 **100** |

#### 响应 — moment_list[] 字段

| 参数 | 类型 | 说明 |
|------|------|------|
| `moment_id` | string | 朋友圈 ID |
| `creator` | string | 创建者 userid |
| `create_time` | int | 创建时间戳 |
| `create_type` | int | 0=企业创建 1=个人创建 |
| `visible_type` | int | 0=部分可见 1=公开 |
| `text.content` | string | 文本内容 |
| `image` | object[] | 图片列表 `[{media_id}]` |
| `video` | object | `{media_id, thumb_media_id}` |
| `link` | object | `{title, url}` |

---

### M4: 获取成员执行情况

**POST** `/cgi-bin/externalcontact/get_moment_task?access_token=ACCESS_TOKEN`

请求：`{moment_id, cursor?, limit?}`（limit 默认 500，最大 1000）

响应 — `task_list[]`：`{userid, publish_status}` (0=未发表 1=已发表)

---

### M5: 获取预设可见范围

**POST** `/cgi-bin/externalcontact/get_moment_customer_list?access_token=ACCESS_TOKEN`

请求：`{moment_id, userid, cursor?, limit?}`（limit 默认 500，最大 1000）

响应 — `customer_list[]`：`{userid, external_userid}`

---

### M6: 获取实际送达客户

**POST** `/cgi-bin/externalcontact/get_moment_send_result?access_token=ACCESS_TOKEN`

请求：`{moment_id, userid, cursor?, limit?}`（limit 默认 500，最大 **5000**）

响应 — `customer_list[]`：`{external_userid}`

---

### M7: 获取互动数据

**POST** `/cgi-bin/externalcontact/get_moment_comments?access_token=ACCESS_TOKEN`

请求：`{moment_id, userid}`

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `comment_list[]` | object[] | 评论列表 |
| `comment_list[].external_userid` | string | 客户评论时有值 |
| `comment_list[].userid` | string | 成员评论时有值 |
| `comment_list[].create_time` | int | 评论时间戳 |
| `comment_list[].content` | string | 评论文本 |
| `like_list[]` | object[] | 点赞列表 |
| `like_list[].external_userid` | string | 客户点赞时有值 |
| `like_list[].userid` | string | 成员点赞时有值 |
| `like_list[].create_time` | int | 点赞时间戳 |

> `userid` 和 `external_userid` 不会同时出现。

---

### M8: 停止发表企业朋友圈

**POST** `/cgi-bin/externalcontact/cancel_moment_task?access_token=ACCESS_TOKEN`

请求：`{moment_id}`

> **仅能停止尚未发表的任务**，无法撤回已发表内容。

---

## 5. 回调事件

本 SKILL 无专属回调事件。朋友圈相关的状态变化需通过轮询 M2 或主动查询 M3/M4 获取。

---

## 6. 工作流

### 6.1 创建并追踪朋友圈发表任务

```
步骤 1: 上传附件（如需要）
  POST /cgi-bin/media/upload_attachment?attachment_type=1&media_type=image
  → 获取 media_id（3 天有效）

步骤 2: 创建发表任务
  调用 M1 (add_moment_task)
  ├─ text + attachments
  ├─ visible_range（可选）
  └─ 获取 jobid

步骤 3: 轮询任务结果
  调用 M2 (get_moment_task_result)
  ├─ 每 2~5 秒轮询一次
  ├─ status=1/2 → 继续等待
  └─ status=3 → 获得 moment_id

步骤 4: 查看成员执行情况
  调用 M4 (get_moment_task)
  └─ 查看每位成员的 publish_status

步骤 5: 查看送达结果
  调用 M6 (get_moment_send_result)
  └─ 查看实际可见的客户列表

步骤 6: 查看互动数据
  调用 M7 (get_moment_comments)
  └─ 获取评论和点赞
```

### 6.2 查询历史朋友圈

```
步骤 1: 获取朋友圈列表
  调用 M3 (get_moment_list)
  ├─ start_time + end_time（间隔≤30天）
  ├─ filter_type=0 仅企业发表
  └─ cursor 分页

步骤 2: 对每条朋友圈查看详情
  调用 M4/M5/M6/M7 获取执行/可见/送达/互动数据
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom CRM 客户朋友圈管理器 — 依赖 wecom-core 的 WeComClient"""
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)


class MomentManager:
    """客户朋友圈管理器"""

    def __init__(self, client):
        self.client = client

    # ── M1: 创建发表任务 ──

    def add_moment_task(
        self,
        text: str = "",
        attachments: Optional[list[dict]] = None,
        visible_range: Optional[dict] = None,
    ) -> str:
        """
        创建朋友圈发表任务（异步）。

        Returns:
            str: jobid（24h 有效）
        """
        body: dict = {}
        if text:
            body["text"] = {"content": text[:2000]}
        if attachments:
            body["attachments"] = attachments
        if visible_range:
            body["visible_range"] = visible_range

        resp = self.client.post(
            "/externalcontact/add_moment_task", json=body
        )
        return resp["jobid"]

    # ── M2: 获取任务创建结果 ──

    def get_moment_task_result(self, jobid: str) -> dict:
        """
        查询异步任务结果（GET 请求）。

        Returns:
            dict: {status, type, result?}
        """
        return self.client.get(
            "/externalcontact/get_moment_task_result",
            params={"jobid": jobid},
        )

    def poll_moment_task_result(
        self,
        jobid: str,
        poll_interval: float = 3.0,
        max_polls: int = 20,
    ) -> dict:
        """
        轮询任务结果直到完成。

        Returns:
            dict: result 对象，含 moment_id
        """
        for i in range(max_polls):
            resp = self.get_moment_task_result(jobid)
            if resp.get("status") == 3:
                return resp.get("result", {})
            logger.info("任务状态 %s，第 %d 次等待...", resp.get("status"), i + 1)
            time.sleep(poll_interval)
        raise TimeoutError(f"轮询 {max_polls} 次后任务仍未完成")

    # ── M3: 获取企业全部发表列表 ──

    def get_moment_list(
        self,
        start_time: int,
        end_time: int,
        creator: str = "",
        filter_type: int = 2,
        limit: int = 50,
    ) -> list[dict]:
        """
        获取朋友圈发表列表（自动分页）。

        Args:
            start_time: 开始时间戳
            end_time: 结束时间戳（与 start_time 间隔≤30天）
            filter_type: 0=企业 1=个人 2=全部
        """
        results = []
        cursor = ""
        while True:
            body: dict = {
                "start_time": start_time,
                "end_time": end_time,
                "filter_type": filter_type,
                "cursor": cursor,
                "limit": min(limit, 100),
            }
            if creator:
                body["creator"] = creator
            resp = self.client.post(
                "/externalcontact/get_moment_list", json=body
            )
            results.extend(resp.get("moment_list", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── M4: 获取成员执行情况 ──

    def get_moment_task(
        self, moment_id: str, limit: int = 500
    ) -> list[dict]:
        """获取成员发表状态（自动分页）。"""
        results = []
        cursor = ""
        while True:
            resp = self.client.post(
                "/externalcontact/get_moment_task",
                json={"moment_id": moment_id, "cursor": cursor, "limit": min(limit, 1000)},
            )
            results.extend(resp.get("task_list", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── M5: 获取预设可见范围 ──

    def get_moment_customer_list(
        self, moment_id: str, userid: str, limit: int = 500
    ) -> list[dict]:
        """获取发表时预设的可见客户列表（自动分页）。"""
        results = []
        cursor = ""
        while True:
            resp = self.client.post(
                "/externalcontact/get_moment_customer_list",
                json={"moment_id": moment_id, "userid": userid, "cursor": cursor, "limit": min(limit, 1000)},
            )
            results.extend(resp.get("customer_list", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── M6: 获取实际送达客户 ──

    def get_moment_send_result(
        self, moment_id: str, userid: str, limit: int = 500
    ) -> list[dict]:
        """获取发表后实际可见的客户列表（自动分页）。"""
        results = []
        cursor = ""
        while True:
            resp = self.client.post(
                "/externalcontact/get_moment_send_result",
                json={"moment_id": moment_id, "userid": userid, "cursor": cursor, "limit": min(limit, 5000)},
            )
            results.extend(resp.get("customer_list", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── M7: 获取互动数据 ──

    def get_moment_comments(
        self, moment_id: str, userid: str
    ) -> dict:
        """
        获取朋友圈互动数据。

        Returns:
            dict: {"comment_list": [...], "like_list": [...]}
        """
        resp = self.client.post(
            "/externalcontact/get_moment_comments",
            json={"moment_id": moment_id, "userid": userid},
        )
        return {
            "comment_list": resp.get("comment_list", []),
            "like_list": resp.get("like_list", []),
        }

    # ── M8: 停止发表任务 ──

    def cancel_moment_task(self, moment_id: str) -> None:
        """停止尚未发表的朋友圈任务。无法撤回已发表内容。"""
        self.client.post(
            "/externalcontact/cancel_moment_task",
            json={"moment_id": moment_id},
        )
```

### 7.2 TypeScript

```typescript
/**
 * WeCom CRM 客户朋友圈管理器
 * 依赖 wecom-core 的 WeComClient
 */

// ── 类型定义 ──

interface MomentAttachment {
  msgtype: "image" | "video" | "link";
  image?: { media_id: string };
  video?: { media_id: string };
  link?: { title: string; url: string; media_id: string };
}

interface VisibleRange {
  sender_list?: {
    user_list?: string[];
    department_list?: number[];
  };
  external_contact_list?: {
    tag_list?: string[];
  };
}

interface MomentListItem {
  moment_id: string;
  creator: string;
  create_time: number;
  create_type: 0 | 1;
  visible_type: 0 | 1;
  text?: { content: string };
  image?: Array<{ media_id: string }>;
  video?: { media_id: string; thumb_media_id: string };
  link?: { title: string; url: string };
}

interface MomentTaskItem {
  userid: string;
  publish_status: 0 | 1;
}

interface MomentInteraction {
  external_userid?: string;
  userid?: string;
  create_time: number;
  content?: string; // only comments have content
}

interface TaskResult {
  errcode: number;
  errmsg: string;
  moment_id: string;
  invalid_sender_list?: {
    user_list?: string[];
    department_list?: number[];
  };
  invalid_external_contact_list?: {
    tag_list?: string[];
  };
}

// ── 管理器 ──

class MomentManager {
  constructor(private client: WeComClient) {}

  // M1: 创建发表任务
  async addMomentTask(opts: {
    text?: string;
    attachments?: MomentAttachment[];
    visibleRange?: VisibleRange;
  }): Promise<string> {
    const body: Record<string, unknown> = {};
    if (opts.text) body.text = { content: opts.text.slice(0, 2000) };
    if (opts.attachments) body.attachments = opts.attachments;
    if (opts.visibleRange) body.visible_range = opts.visibleRange;
    const resp = await this.client.post<{ jobid: string }>(
      "/externalcontact/add_moment_task",
      body,
    );
    return resp.jobid;
  }

  // M2: 获取任务创建结果（GET 请求）
  async getMomentTaskResult(jobid: string): Promise<{
    status: 1 | 2 | 3;
    type: string;
    result?: TaskResult;
  }> {
    return this.client.get(
      `/cgi-bin/externalcontact/get_moment_task_result`,
      { jobid },
    );
  }

  // 轮询任务结果
  async pollMomentTaskResult(
    jobid: string,
    pollInterval = 3000,
    maxPolls = 20,
  ): Promise<TaskResult> {
    for (let i = 0; i < maxPolls; i++) {
      const resp = await this.getMomentTaskResult(jobid);
      if (resp.status === 3 && resp.result) return resp.result;
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`轮询 ${maxPolls} 次后任务仍未完成`);
  }

  // M3: 获取发表列表（自动分页）
  async getMomentList(
    startTime: number,
    endTime: number,
    opts?: { creator?: string; filterType?: number; limit?: number },
  ): Promise<MomentListItem[]> {
    const results: MomentListItem[] = [];
    let cursor = "";
    do {
      const body: Record<string, unknown> = {
        start_time: startTime,
        end_time: endTime,
        filter_type: opts?.filterType ?? 2,
        cursor,
        limit: Math.min(opts?.limit ?? 50, 100),
      };
      if (opts?.creator) body.creator = opts.creator;
      const resp = await this.client.post<{
        moment_list: MomentListItem[];
        next_cursor: string;
      }>("/externalcontact/get_moment_list", body);
      results.push(...(resp.moment_list ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // M4: 获取成员执行情况（自动分页）
  async getMomentTask(
    momentId: string,
    limit = 500,
  ): Promise<MomentTaskItem[]> {
    const results: MomentTaskItem[] = [];
    let cursor = "";
    do {
      const resp = await this.client.post<{
        task_list: MomentTaskItem[];
        next_cursor: string;
      }>("/externalcontact/get_moment_task", {
        moment_id: momentId,
        cursor,
        limit: Math.min(limit, 1000),
      });
      results.push(...(resp.task_list ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // M5: 获取预设可见范围（自动分页）
  async getMomentCustomerList(
    momentId: string,
    userid: string,
    limit = 500,
  ): Promise<Array<{ userid: string; external_userid: string }>> {
    const results: Array<{ userid: string; external_userid: string }> = [];
    let cursor = "";
    do {
      const resp = await this.client.post<{
        customer_list: Array<{ userid: string; external_userid: string }>;
        next_cursor: string;
      }>("/externalcontact/get_moment_customer_list", {
        moment_id: momentId,
        userid,
        cursor,
        limit: Math.min(limit, 1000),
      });
      results.push(...(resp.customer_list ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // M6: 获取实际送达客户（自动分页）
  async getMomentSendResult(
    momentId: string,
    userid: string,
    limit = 500,
  ): Promise<Array<{ external_userid: string }>> {
    const results: Array<{ external_userid: string }> = [];
    let cursor = "";
    do {
      const resp = await this.client.post<{
        customer_list: Array<{ external_userid: string }>;
        next_cursor: string;
      }>("/externalcontact/get_moment_send_result", {
        moment_id: momentId,
        userid,
        cursor,
        limit: Math.min(limit, 5000),
      });
      results.push(...(resp.customer_list ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // M7: 获取互动数据
  async getMomentComments(
    momentId: string,
    userid: string,
  ): Promise<{
    comment_list: MomentInteraction[];
    like_list: MomentInteraction[];
  }> {
    return this.client.post(
      "/externalcontact/get_moment_comments",
      { moment_id: momentId, userid },
    );
  }

  // M8: 停止发表任务
  async cancelMomentTask(momentId: string): Promise<void> {
    await this.client.post(
      "/externalcontact/cancel_moment_task",
      { moment_id: momentId },
    );
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"context"
	"fmt"
	"time"
)

// ── 请求/响应结构体 ──

type MomentAttachment struct {
	Msgtype string                `json:"msgtype"`
	Image   *MomentAttachImage   `json:"image,omitempty"`
	Video   *MomentAttachVideo   `json:"video,omitempty"`
	Link    *MomentAttachLink    `json:"link,omitempty"`
}

type MomentAttachImage struct {
	MediaID string `json:"media_id"`
}

type MomentAttachVideo struct {
	MediaID string `json:"media_id"`
}

type MomentAttachLink struct {
	Title   string `json:"title"`
	URL     string `json:"url"`
	MediaID string `json:"media_id"`
}

type AddMomentTaskReq struct {
	Text         *MomentText         `json:"text,omitempty"`
	Attachments  []MomentAttachment  `json:"attachments,omitempty"`
	VisibleRange *MomentVisibleRange `json:"visible_range,omitempty"`
}

type MomentText struct {
	Content string `json:"content"`
}

type MomentVisibleRange struct {
	SenderList          *MomentSenderList          `json:"sender_list,omitempty"`
	ExternalContactList *MomentExternalContactList `json:"external_contact_list,omitempty"`
}

type MomentSenderList struct {
	UserList       []string `json:"user_list,omitempty"`
	DepartmentList []int    `json:"department_list,omitempty"`
}

type MomentExternalContactList struct {
	TagList []string `json:"tag_list,omitempty"`
}

type AddMomentTaskResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
	JobID   string `json:"jobid"`
}

type MomentTaskResultResp struct {
	ErrCode int               `json:"errcode"`
	ErrMsg  string            `json:"errmsg"`
	Status  int               `json:"status"`
	Type    string            `json:"type"`
	Result  *MomentTaskResult `json:"result,omitempty"`
}

type MomentTaskResult struct {
	ErrCode                    int               `json:"errcode"`
	ErrMsg                     string            `json:"errmsg"`
	MomentID                   string            `json:"moment_id"`
	InvalidSenderList          *MomentSenderList `json:"invalid_sender_list,omitempty"`
	InvalidExternalContactList *MomentExternalContactList `json:"invalid_external_contact_list,omitempty"`
}

type MomentListItem struct {
	MomentID    string               `json:"moment_id"`
	Creator     string               `json:"creator"`
	CreateTime  int64                `json:"create_time"`
	CreateType  int                  `json:"create_type"`
	VisibleType int                  `json:"visible_type"`
	Text        *MomentText          `json:"text,omitempty"`
	Image       []MomentAttachImage  `json:"image,omitempty"`
	Video       *MomentVideoDetail   `json:"video,omitempty"`
	Link        *MomentLinkDetail    `json:"link,omitempty"`
}

type MomentVideoDetail struct {
	MediaID      string `json:"media_id"`
	ThumbMediaID string `json:"thumb_media_id"`
}

type MomentLinkDetail struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

// ── 管理器 ──

type MomentManager struct {
	client *WeComClient
}

func NewMomentManager(client *WeComClient) *MomentManager {
	return &MomentManager{client: client}
}

// M1: 创建发表任务
func (m *MomentManager) AddMomentTask(ctx context.Context, req *AddMomentTaskReq) (string, error) {
	var resp AddMomentTaskResp
	if err := m.client.Post(ctx, "/externalcontact/add_moment_task", req, &resp); err != nil {
		return "", err
	}
	return resp.JobID, nil
}

// M2: 获取任务创建结果（GET 请求）
func (m *MomentManager) GetMomentTaskResult(ctx context.Context, jobID string) (*MomentTaskResultResp, error) {
	var resp MomentTaskResultResp
	if err := m.client.Get(ctx, "/externalcontact/get_moment_task_result", map[string]string{"jobid": jobID}, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// 轮询任务结果
func (m *MomentManager) PollMomentTaskResult(ctx context.Context, jobID string, pollInterval time.Duration, maxPolls int) (*MomentTaskResult, error) {
	for i := 0; i < maxPolls; i++ {
		resp, err := m.GetMomentTaskResult(ctx, jobID)
		if err != nil {
			return nil, err
		}
		if resp.Status == 3 && resp.Result != nil {
			return resp.Result, nil
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(pollInterval):
		}
	}
	return nil, fmt.Errorf("轮询 %d 次后任务仍未完成", maxPolls)
}

// M3: 获取发表列表（自动分页）
func (m *MomentManager) GetMomentList(ctx context.Context, startTime, endTime int64, creator string, filterType, limit int) ([]MomentListItem, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var all []MomentListItem
	cursor := ""
	for {
		body := map[string]interface{}{
			"start_time":  startTime,
			"end_time":    endTime,
			"filter_type": filterType,
			"cursor":      cursor,
			"limit":       limit,
		}
		if creator != "" {
			body["creator"] = creator
		}
		var resp struct {
			MomentList []MomentListItem `json:"moment_list"`
			NextCursor string           `json:"next_cursor"`
		}
		if err := m.client.Post(ctx, "/externalcontact/get_moment_list", body, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.MomentList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// M4: 获取企业发表的列表（成员执行情况，自动分页）
func (m *MomentManager) GetMomentTask(ctx context.Context, momentID string) ([]map[string]interface{}, error) {
	var all []map[string]interface{}
	cursor := ""
	for {
		body := map[string]interface{}{
			"moment_id": momentID,
			"cursor":    cursor,
			"limit":     1000,
		}
		var resp struct {
			TaskList   []map[string]interface{} `json:"task_list"`
			NextCursor string                   `json:"next_cursor"`
		}
		if err := m.client.Post(ctx, "/externalcontact/get_moment_task", body, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.TaskList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// M5: 获取发表时选择的可见范围（自动分页）
func (m *MomentManager) GetMomentCustomerList(ctx context.Context, momentID, userid string) ([]map[string]interface{}, error) {
	var all []map[string]interface{}
	cursor := ""
	for {
		body := map[string]interface{}{
			"moment_id": momentID,
			"userid":    userid,
			"cursor":    cursor,
			"limit":     1000,
		}
		var resp struct {
			CustomerList []map[string]interface{} `json:"customer_list"`
			NextCursor   string                   `json:"next_cursor"`
		}
		if err := m.client.Post(ctx, "/externalcontact/get_moment_customer_list", body, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.CustomerList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// M6: 获取发表后的可见客户列表（自动分页）
func (m *MomentManager) GetMomentSendResult(ctx context.Context, momentID, userid string) ([]map[string]interface{}, error) {
	var all []map[string]interface{}
	cursor := ""
	for {
		body := map[string]interface{}{
			"moment_id": momentID,
			"userid":    userid,
			"cursor":    cursor,
			"limit":     5000,
		}
		var resp struct {
			CustomerList []map[string]interface{} `json:"customer_list"`
			NextCursor   string                   `json:"next_cursor"`
		}
		if err := m.client.Post(ctx, "/externalcontact/get_moment_send_result", body, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.CustomerList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// M7: 获取互动数据
func (m *MomentManager) GetMomentComments(ctx context.Context, momentID, userid string) (comments, likes []map[string]interface{}, err error) {
	var resp struct {
		CommentList []map[string]interface{} `json:"comment_list"`
		LikeList    []map[string]interface{} `json:"like_list"`
	}
	if err = m.client.Post(ctx, "/externalcontact/get_moment_comments", map[string]string{
		"moment_id": momentID,
		"userid":    userid,
	}, &resp); err != nil {
		return nil, nil, err
	}
	return resp.CommentList, resp.LikeList, nil
}

// M8: 停止发表任务
func (m *MomentManager) CancelMomentTask(ctx context.Context, momentID string) error {
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	return m.client.Post(ctx, "/externalcontact/cancel_moment_task", map[string]string{"moment_id": momentID}, &resp)
}
```

---


### 7.4 Java 示例

```java
public class WecomCrmMomentService {
    private final WeComClient client;

    public WecomCrmMomentService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-moment 相关 API
     * 请参考本 SKILL 的 API 速查表选择具体接口
     */
    public JsonObject callApi(String path, JsonObject params) throws Exception {
        return client.post(path, params);
    }

    // 更多方法请参考上方 API 详细说明章节，每个接口对应一个方法
    // 关键注意事项请查阅「踩坑指南」章节
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
class WecomCrmMomentService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-moment 相关 API
     * 请参考本 SKILL 的 API 速查表选择具体接口
     */
    public function callApi(string $path, array $params = []): array
    {
        return $this->client->post($path, $params);
    }

    // 更多方法请参考上方 API 详细说明章节
    // 关键注意事项请查阅「踩坑指南」章节
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 8. 测试模板

```python
"""wecom-crm-moment 测试模板"""
import pytest
from unittest.mock import MagicMock


@pytest.fixture
def manager():
    client = MagicMock()
    return MomentManager(client)


class TestAddMomentTask:
    """M1: 创建发表任务"""

    def test_basic_text(self, manager):
        manager.client.post.return_value = {"jobid": "job001"}
        jobid = manager.add_moment_task(text="Hello World")
        assert jobid == "job001"
        body = manager.client.post.call_args[0][1]
        assert body["text"]["content"] == "Hello World"

    def test_with_image(self, manager):
        manager.client.post.return_value = {"jobid": "job002"}
        manager.add_moment_task(
            text="图片分享",
            attachments=[{"msgtype": "image", "image": {"media_id": "MID"}}],
        )
        body = manager.client.post.call_args[0][1]
        assert body["attachments"][0]["msgtype"] == "image"

    def test_text_truncated(self, manager):
        manager.client.post.return_value = {"jobid": "job003"}
        manager.add_moment_task(text="x" * 3000)
        body = manager.client.post.call_args[0][1]
        assert len(body["text"]["content"]) == 2000


class TestPollMomentTaskResult:
    """M2: 轮询任务结果"""

    def test_immediate_complete(self, manager):
        manager.client.get.return_value = {
            "status": 3,
            "result": {"moment_id": "mom001", "errcode": 0},
        }
        result = manager.poll_moment_task_result("job001", poll_interval=0.01)
        assert result["moment_id"] == "mom001"

    def test_poll_then_complete(self, manager):
        manager.client.get.side_effect = [
            {"status": 1},
            {"status": 2},
            {"status": 3, "result": {"moment_id": "mom002", "errcode": 0}},
        ]
        result = manager.poll_moment_task_result("job001", poll_interval=0.01)
        assert result["moment_id"] == "mom002"
        assert manager.client.get.call_count == 3


class TestGetMomentList:
    """M3: 获取发表列表"""

    def test_pagination(self, manager):
        manager.client.post.side_effect = [
            {"moment_list": [{"moment_id": "m1"}], "next_cursor": "c1"},
            {"moment_list": [{"moment_id": "m2"}], "next_cursor": ""},
        ]
        result = manager.get_moment_list(1000, 2000)
        assert len(result) == 2

    def test_filter_type(self, manager):
        manager.client.post.return_value = {"moment_list": [], "next_cursor": ""}
        manager.get_moment_list(1000, 2000, filter_type=0)
        body = manager.client.post.call_args[0][1]
        assert body["filter_type"] == 0


class TestGetMomentComments:
    """M7: 获取互动数据"""

    def test_comments_and_likes(self, manager):
        manager.client.post.return_value = {
            "comment_list": [{"external_userid": "wo001", "create_time": 100}],
            "like_list": [{"userid": "zhangsan", "create_time": 200}],
        }
        result = manager.get_moment_comments("mom001", "zhangsan")
        assert len(result["comment_list"]) == 1
        assert len(result["like_list"]) == 1
```

---

## 9. Code Review 检查清单

| # | 检查项 | 严重度 | 说明 |
|---|--------|--------|------|
| R1 | 附件 media_id 是否使用 upload_attachment 接口上传 | CRITICAL | 不能用通用 media/upload |
| R2 | add_moment_task 是否异步处理（轮询 jobid） | HIGH | 同步等待会超时 |
| R3 | get_moment_task_result 是否用 GET 请求 | HIGH | 唯一的 GET 接口 |
| R4 | 附件类型是否未混用 | HIGH | 图片/视频/链接只能选一种 |
| R5 | text 和 attachments 是否不同时为空 | HIGH | errcode 41089 |
| R6 | get_moment_list 时间间隔是否≤30 天 | MEDIUM | 超过会报错 |
| R7 | jobid 是否在 24h 内使用 | MEDIUM | 过期无法查询 |
| R8 | get_moment_send_result 的 limit 是否≤5000 | MEDIUM | 与其他接口不同 |
| R9 | get_moment_comments 中 userid/external_userid 互斥 | MEDIUM | 不会同时出现 |
| R10 | cancel_moment_task 是否仅用于未发表任务 | MEDIUM | 无法撤回已发表 |
| R11 | 每月 API 创建朋友圈是否≤10 万次 | LOW | 超限报 41078 |
| R12 | 每分钟创建频率是否≤10 条 | LOW | 超限报 41078 |

---

## 10. 踩坑指南 (Gotcha Guide)

### G1: 用了通用上传接口导致发表失败

**现象**：创建朋友圈任务报错或附件无效
**原因**：朋友圈附件必须用 `/media/upload_attachment`（参数 `attachment_type=1`），不能用 `/media/upload`
**方案**：始终使用 upload_attachment 接口，注意 media_type 参数仅支持 image 和 video

### G2: 忘记轮询 jobid 直接用 moment_id

**现象**：add_moment_task 返回的不是 moment_id
**原因**：创建任务是异步的，返回 jobid，需轮询 get_moment_task_result 才能获得 moment_id
**方案**：实现轮询逻辑，建议 2~5 秒间隔，jobid 有效期 24h

### G3: get_moment_task_result 用了 POST

**现象**：查询任务结果报错
**原因**：此接口是 **GET** 请求（jobid 通过 Query 参数传），不是 POST
**方案**：使用 GET 方法，jobid 作为 URL 参数

### G4: 附件类型混用

**现象**：创建任务报 41065
**原因**：一条朋友圈只能用一种附件类型（9 图 OR 1 视频 OR 1 链接）
**方案**：确保 attachments 数组中所有元素的 msgtype 一致

### G5: 时间范围超 30 天

**现象**：get_moment_list 报错
**原因**：start_time 和 end_time 间隔不能超过 30 天
**方案**：按 30 天窗口分段查询

### G6: cancel 不能撤回已发表

**现象**：调用 cancel_moment_task 后已发表的内容仍可见
**原因**：cancel 仅能停止尚未发表的任务，无法撤回已发到客户朋友圈的内容
**方案**：提前告知业务方此限制

### G7: get_moment_customer_list vs get_moment_send_result 混淆

**现象**：预设可见客户与实际可见客户不一致
**原因**：customer_list 是创建时预设的，send_result 是发表后实际送达的
**方案**：数据分析场景用 send_result，权限审计场景用 customer_list

### G8: media_id 3 天过期

**现象**：使用之前上传的 media_id 创建任务失败
**原因**：所有 media_id 仅 3 天有效
**方案**：在创建任务前临时上传附件，不要提前批量上传后存储

---

## 11. 错误码速查

| 错误码 | 含义 | 排查方向 |
|--------|------|---------|
| 0 | 成功 | - |
| 40001 | access_token 无效 | 重新获取 |
| 41059 | 缺少 moment_id | 检查参数 |
| 41060 | 不合法的 moment_id | 检查 ID 格式 |
| 41061 | 非此用户发表的朋友圈 | 检查 userid 与 moment 匹配 |
| 41062 | 朋友圈尚未被成员发表 | 等待成员确认发表 |
| 41063 | 正在派发中，稍后重试 | 等待几秒重试 |
| 41064 | 附件数量超限 | 图片≤9，视频/链接≤1 |
| 41065 | 无效的附件类型 | 检查 msgtype 且不可混用 |
| 41067 | moment_id 类型错误 | 检查 moment_id 格式是否符合要求 |
| 41078 | 创建朋友圈数量超限 | 月上限 10 万 / 分钟 10 条 |
| 41079 | 朋友圈正在被派发中 | 区别于 41063，任务尚在分发中，稍后重试 |
| 41089 | 内容和附件不能同时为空 | 至少传 text 或 attachments |
| 301002 | 无权限 | 检查客户联系权限 |

---

## 12. 参考资料

| 资源 | 链接 |
|------|------|
| 创建发表任务-自建 (doc 95094) | https://developer.work.weixin.qq.com/document/path/95094 |
| 创建发表任务-第三方 (doc 95095) | https://developer.work.weixin.qq.com/document/path/95095 |
| 获取发表列表-自建 (doc 93333) | https://developer.work.weixin.qq.com/document/path/93333 |
| 获取成员执行情况 (doc 93334) | https://developer.work.weixin.qq.com/document/path/93334 |
| 获取预设可见范围 (doc 93335) | https://developer.work.weixin.qq.com/document/path/93335 |
| 获取实际送达客户 (doc 93336) | https://developer.work.weixin.qq.com/document/path/93336 |
| 获取互动数据 (doc 93337) | https://developer.work.weixin.qq.com/document/path/93337 |
| 停止发表-自建 (doc 97615) | https://developer.work.weixin.qq.com/document/path/97615 |
| 上传附件资源 (doc 95098) | https://developer.work.weixin.qq.com/document/path/95098 |
| 频率限制 (doc 96212) | https://developer.work.weixin.qq.com/document/path/96212 |


