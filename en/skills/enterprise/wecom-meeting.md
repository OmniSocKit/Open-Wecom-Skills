---
name: wecom-meeting
description: 企业微信会议域 SKILL — 预约会议 CRUD、OA 会议室管理与预定、回调通知，含 Rooms/录制/网络研讨会参考
version: 1.0.0
triggers:
  - 会议
  - 预约会议
  - meeting
  - 会议室
  - meetingroom
  - 视频会议
  - meeting/create
  - meeting/cancel
  - meetingid
  - 会议录制
  - 网络研讨会
  - webinar
  - meeting_change
prerequisite_skills:
  - wecom-core
domain: meeting
api_count: 14
callback_count: 2
---

# WeCom · Meeting SKILL

> 覆盖企业微信「会议」全域：预约会议 CRUD（基础版+高级版）、OA 会议室管理与预定、会议状态回调。
> 附录含 Rooms 会议室、PSTN 电话入会、会议录制、网络研讨会等扩展子域 API 索引。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret 的 access_token | 管理后台 → 协作 → 会议 → API → 配置"可调用接口的应用" |
| 第三方应用 | suite_access_token | 应用详情内开启"会议接口权限" |
| 代开发应用 | 需开启"会议接口权限"，企业管理员确认 | 同上 |
| OA 会议室 | **"会议室" secret** 的 access_token | 仅自建应用可用，第三方不支持 |

> **关键**：OA 会议室接口使用的 access_token 来自"会议室" secret，而非普通应用 secret。混用会导致认证失败。

### 1.2 可见范围规则

- 会议创建者 (`admin_userid`) 和所有内部参会者必须在应用可见范围内
- 自建/第三方应用**只能**修改/取消/查询自己创建的会议
- 系统内置"会议"应用可查询所有成员的会议

### 1.3 两套 API 层级

| 层级 | 说明 | 额外字段 | 要求 |
|-----|------|---------|------|
| **基础版** | 核心 CRUD | — | 无 |
| **高级版** | 扩展设置 | `watermark_type`, `auto_record_type`, `enable_interpreter`, `host_key`, `mute_all` 等 | 购买 10+ 在线会议室或 20+ 商业账号 |

> 高级版字段在基础版 API 上使用会被静默忽略或报错。

---

## 2. 核心概念

### 2.1 会议状态 (status)

| 值 | 含义 | 值 | 含义 |
|----|------|----|------|
| 1 | 待开始 | 4 | 已取消 |
| 2 | 进行中 | 5 | 已过期 |
| 3 | 已结束 | | |

### 2.2 参会者响应状态

| 值 | 含义 |
|----|------|
| 0 | 未响应 |
| 1 | 暂定 |
| 2 | 已接受 |
| 3 | 已拒绝 |

### 2.3 提醒范围 (remind_scope)

| 值 | 含义 | 注意 |
|----|------|------|
| 1 | 不提醒 | — |
| 2 | 仅主持人（默认） | — |
| 3 | 所有成员 | — |
| 4 | 指定成员 | 需配合 `ring_users` 使用，`ring_users` 为空则无人收到通知 |

### 2.4 重要约束

| 约束 | 值 |
|------|-----|
| 标题最大长度 | 40 字节（20 汉字） |
| 描述最大长度 | 500 字节（创建）/ 600 字节（详情返回） |
| 位置最大长度 | 128 字符 |
| 密码格式 | 仅 4-6 位数字 |
| 最小会议时长 | 300 秒（5 分钟） |
| 参会者上限 | 100（标准）/ 按购买容量（付费） |
| 主持人上限 | 10 |
| 每日/每周重复上限 | 200 次 |
| 双周/每月重复上限 | 50 次 |

---

## 3. API 速查表

### 预约会议管理

| # | 接口 | 方法 | 路径 | 说明 |
|---|------|------|------|------|
| M1 | 创建预约会议 | POST | `meeting/create` | 基础版 + 高级版 |
| M2 | 修改预约会议 | POST | `meeting/update` | 仅可改自己创建的 |
| M3 | 取消预约会议 | POST | `meeting/cancel` | 仅待开始状态 |
| M4 | 获取会议详情 | POST | `meeting/get_info` | — |
| M5 | 获取成员会议ID列表 | POST | `meeting/get_user_meetingid` | 仅返回本应用创建的 |
| M6 | 结束会议 | POST | `meeting/end` | 高级版 |
| M7 | 获取已参会成员列表 | POST | `meeting/get_attendee_list` | 高级版，会议未开始返回空 |

### OA 会议室管理（使用"会议室" secret）

| # | 接口 | 方法 | 路径 | 说明 |
|---|------|------|------|------|
| R1 | 添加会议室 | POST | `oa/meetingroom/add` | 仅自建应用 |
| R2 | 查询会议室 | POST | `oa/meetingroom/list` | 支持按城市/楼宇/楼层筛选 |
| R3 | 编辑会议室 | POST | `oa/meetingroom/edit` | 修改位置需 city+building+floor 一起传 |
| R4 | 删除会议室 | POST | `oa/meetingroom/del` | — |

### OA 会议室预定管理

| # | 接口 | 方法 | 路径 | 说明 |
|---|------|------|------|------|
| B1 | 查询预定信息 | POST | `oa/meetingroom/get_booking_info` | 按会议室+时间段查 |
| B2 | 预定会议室 | POST | `oa/meetingroom/book` | 8:00-23:00，最短 30 分钟 |
| B3 | 取消预定 | POST | `oa/meetingroom/cancel_book` | — |

---

## 4. API 详情

### M1 创建预约会议

```
POST meeting/create
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| admin_userid | 是 | string | 会议创建者 userid |
| title | 是 | string | 标题，≤40 字节 |
| meeting_start | 是 | int | 开始时间戳（须大于当前） |
| meeting_duration | 是 | int | 时长（秒），≥300 |
| description | 否 | string | 描述，≤500 字节 |
| location | 否 | string | 地点，≤128 字符 |
| cal_id | 否 | string | 关联日历 ID |
| attendees | 否 | object | `{ "userid": ["lisi", "wangwu"] }` |
| settings | 否 | object | 会议设置（见下） |
| reminders | 否 | object | 重复会议与提醒配置 |

**settings 子字段**

| Field | Type | Description |
|------|------|------|
| password | string | 入会密码，4-6 位数字 |
| enable_waiting_room | bool | 启用等候室 |
| allow_enter_before_host | bool | 允许主持人前入会 |
| enable_enter_mute | int | 入会静音：0=关, 1=开, 2=6人后自动(默认) |
| allow_external_user | bool | 允许外部人员 |
| remind_scope | int | 提醒范围（见 2.3） |
| hosts | object | `{ "userid": [...] }`，最多 10 人 |
| ring_users | object | `{ "userid": [...] }`，remind_scope=4 时必须 |

**reminders 子字段（重复会议）**

| Field | Type | Description |
|------|------|------|
| is_repeat | int | 1=重复, 0=单次 |
| repeat_type | int | 0=每天, 1=每周, 2=每月, 7=工作日 |
| repeat_until | int | 重复截止时间戳 |
| remind_before | int[] | 提前提醒秒数: 0/300/900/3600/86400 |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "meetingid": "XXXXXXXXX",
  "meeting_code": "123456789",
  "meeting_link": "https://meeting.com/jige",
  "excess_users": []
}
```

> `excess_users`：没有专业版账号的 userid 列表。

---

### M2 修改预约会议

```
POST meeting/update
```

与 M1 参数相同，额外必传 `meetingid`。修改 `meeting_start` 时必须同时传 `meeting_duration`，反之亦然。

---

### M3 取消预约会议

```
POST meeting/cancel
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| meetingid | 是 | string | 会议 ID |
| sub_meetingid | 否 | string | 子会议 ID（高级版，取消重复会议的单次） |

> 不传 `sub_meetingid` 取消重复会议时，取消**整个系列**。

---

### M4 获取会议详情

```
POST meeting/get_info
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| meetingid | 是 | string | 会议 ID |

**响应核心字段**

| Field | Type | Description |
|------|------|------|
| admin_userid | string | 创建者 |
| title | string | 标题 |
| meeting_start | int | 开始时间戳 |
| meeting_duration | int | 时长（秒） |
| status | int | 会议状态（见 2.1） |
| attendees.member | array | 内部成员 `[{userid, status}]` |
| attendees.tmp_external_user | array | 外部用户 `[{tmp_external_userid, status}]` |
| settings | object | 会议设置 |
| reminders | object | 重复配置 |

---

### M5 获取成员会议 ID 列表

```
POST meeting/get_user_meetingid
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| userid | 是 | string | 成员 userid |
| cursor | 否 | string | 分页游标 |
| begin_time | 否 | int | 起始时间戳 |
| end_time | 否 | int | 结束时间戳 |
| limit | 否 | int | 每页数量，最大 100 |

> 仅返回当前应用创建的会议 ID。

---

### R1 添加会议室

```
POST oa/meetingroom/add
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| name | 是 | string | 会议室名称，≤30 字符 |
| capacity | 是 | int | 容纳人数 |
| city | 否 | string | 所在城市 |
| building | 否 | string | 所在楼宇 |
| floor | 否 | string | 所在楼层 |
| equipment | 否 | int[] | 设备 ID 列表：1=电视, 2=电话, 3=投影, 4=白板, 5=视频 |
| coordinate | 否 | object | `{latitude, longitude}` |

**响应**

```json
{"errcode": 0, "errmsg": "ok", "meetingroom_id": 1}
```

---

### R2 查询会议室

```
POST oa/meetingroom/list
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| city | 否 | string | 按城市筛选 |
| building | 否 | string | 按楼宇筛选（需先填 city） |
| floor | 否 | string | 按楼层筛选（需先填 building） |
| equipment | 否 | int[] | 按设备筛选 |

---

### B1 查询预定信息

```
POST oa/meetingroom/get_booking_info
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| meetingroom_id | 否 | int | 会议室 ID（不填则查全部） |
| start_time | 否 | int | 查询起始时间戳 |
| end_time | 否 | int | 查询结束时间戳 |
| city | 否 | string | 按城市筛选 |
| building | 否 | string | 按楼宇筛选 |
| floor | 否 | string | 按楼层筛选 |

---

### B2 预定会议室

```
POST oa/meetingroom/book
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| meetingroom_id | 是 | int | 会议室 ID |
| subject | 否 | string | 会议主题 |
| start_time | 是 | int | 开始时间戳 |
| end_time | 是 | int | 结束时间戳 |
| booker | 是 | string | 预定人 userid |
| attendees | 否 | string[] | 参会人 userid 列表 |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "booking_id": "bk_xxxxxxxx",
  "schedule_id": "sc_xxxxxxxx"
}
```

> **约束**：仅 8:00-23:00 可预定，最短 30 分钟，自动取整到 30 分钟间隔，仅可预定无需审批的会议室。

---

### B3 取消预定

```
POST oa/meetingroom/cancel_book
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| meeting_id | 是 | string | 预定 ID |
| keep_schedule | 否 | int | 0=同时取消日程, 1=保留日程 |

---

## 5. 回调事件

### C1 meeting_change — 会议变更通知

**触发条件**：管理员在客户端修改或取消通过 API 创建的会议

**修改会议**

```xml
<xml>
  <ToUserName><![CDATA[CORPID]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1234567890</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[meeting_change]]></Event>
  <ChangeType><![CDATA[modify_meeting]]></ChangeType>
  <MeetingId><![CDATA[MEETINGID]]></MeetingId>
</xml>
```

**取消会议**

```xml
<xml>
  ...
  <Event><![CDATA[meeting_change]]></Event>
  <ChangeType><![CDATA[cancel_meeting]]></ChangeType>
  <MeetingId><![CDATA[MEETINGID]]></MeetingId>
</xml>
```

---

### C2 会议室预定取消回调

**触发条件**：用户在企业微信中取消会议室预定

回调发送给：① 会议室系统应用 ② 发起预定的自建应用

> **注意**：修改关联了会议室预定的日历/会议时，企业微信会自动取消并重新预定会议室，回调会同时收到一个取消事件和一个新预定事件。

---

## 6. 典型工作流

### W1 标准预约会议流

```
M1 创建预约会议 → 获取 meetingid + meeting_code + meeting_link
  → 分发 meeting_link 给参会者
  → C1 回调监听变更
  → M4 获取会议详情（检查状态）
  → M3 取消或 M6 结束
```

### W2 会议室预定配合日程

```
R2 查询空闲会议室 → B2 预定会议室 → M1 创建预约会议（关联 cal_id）
  → 会议结束后会议室自动释放
```

### W3 批量查询成员会议

```
M5 获取成员会议 ID 列表（分页） → 遍历 meetingid_list → M4 获取每条详情
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom Meeting Client — 会议管理"""
from wecom_core import WeComClient


class MeetingClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── M1 创建预约会议 ──
    def create_meeting(
        self,
        admin_userid: str,
        title: str,
        meeting_start: int,
        meeting_duration: int,
        description: str = "",
        location: str = "",
        attendees: list[str] | None = None,
        settings: dict | None = None,
        reminders: dict | None = None,
        cal_id: str = "",
    ) -> dict:
        """创建预约会议，返回 {meetingid, meeting_code, meeting_link}"""
        body: dict = {
            "admin_userid": admin_userid,
            "title": title,
            "meeting_start": meeting_start,
            "meeting_duration": meeting_duration,
        }
        if description:
            body["description"] = description
        if location:
            body["location"] = location
        if attendees:
            body["attendees"] = {"userid": attendees}
        if settings:
            body["settings"] = settings
        if reminders:
            body["reminders"] = reminders
        if cal_id:
            body["cal_id"] = cal_id
        resp = self.client.post("meeting/create", json=body)
        return {
            "meetingid": resp["meetingid"],
            "meeting_code": resp.get("meeting_code", ""),
            "meeting_link": resp.get("meeting_link", ""),
        }

    # ── M2 修改预约会议 ──
    def update_meeting(self, meetingid: str, **kwargs) -> None:
        """修改预约会议，仅传需要更新的字段"""
        body: dict = {"meetingid": meetingid}
        body.update(kwargs)
        self.client.post("meeting/update", json=body)

    # ── M3 取消预约会议 ──
    def cancel_meeting(
        self, meetingid: str, sub_meetingid: str = ""
    ) -> None:
        """取消预约会议。传 sub_meetingid 可取消重复会议的单次"""
        body: dict = {"meetingid": meetingid}
        if sub_meetingid:
            body["sub_meetingid"] = sub_meetingid
        self.client.post("meeting/cancel", json=body)

    # ── M4 获取会议详情 ──
    def get_meeting_info(self, meetingid: str) -> dict:
        """获取会议详情"""
        return self.client.post(
            "meeting/get_info", json={"meetingid": meetingid}
        )

    # ── M5 获取成员会议 ID 列表 ──
    def list_user_meetings(
        self,
        userid: str,
        begin_time: int = 0,
        end_time: int = 0,
        limit: int = 100,
    ) -> list[str]:
        """获取成员的会议 ID 列表，自动分页"""
        all_ids: list[str] = []
        cursor = ""
        while True:
            body: dict = {"userid": userid, "limit": limit}
            if cursor:
                body["cursor"] = cursor
            if begin_time:
                body["begin_time"] = begin_time
            if end_time:
                body["end_time"] = end_time
            resp = self.client.post(
                "meeting/get_user_meetingid", json=body
            )
            ids = resp.get("meetingid_list", [])
            all_ids.extend(ids)
            cursor = resp.get("next_cursor", "")
            if not cursor or len(ids) < limit:
                break
        return all_ids


class MeetingRoomClient:
    """OA 会议室管理（使用"会议室" secret）"""

    def __init__(self, client: WeComClient):
        self.client = client

    # ── R1 添加会议室 ──
    def add_room(
        self,
        name: str,
        capacity: int,
        city: str = "",
        building: str = "",
        floor: str = "",
        equipment: list[int] | None = None,
    ) -> int:
        """添加会议室，返回 meetingroom_id"""
        body: dict = {"name": name, "capacity": capacity}
        if city:
            body["city"] = city
        if building:
            body["building"] = building
        if floor:
            body["floor"] = floor
        if equipment:
            body["equipment"] = equipment
        resp = self.client.post("oa/meetingroom/add", json=body)
        return resp["meetingroom_id"]

    # ── R2 查询会议室 ──
    def list_rooms(self, **filters) -> list[dict]:
        """查询会议室列表，支持 city/building/floor/equipment 筛选"""
        resp = self.client.post("oa/meetingroom/list", json=filters)
        return resp.get("meetingroom_list", [])

    # ── R3 编辑会议室 ──
    def edit_room(self, meetingroom_id: int, **kwargs) -> None:
        body: dict = {"meetingroom_id": meetingroom_id}
        body.update(kwargs)
        self.client.post("oa/meetingroom/edit", json=body)

    # ── R4 删除会议室 ──
    def del_room(self, meetingroom_id: int) -> None:
        self.client.post(
            "oa/meetingroom/del",
            json={"meetingroom_id": meetingroom_id},
        )

    # ── B1 查询预定信息 ──
    def get_booking_info(
        self,
        meetingroom_id: int = 0,
        start_time: int = 0,
        end_time: int = 0,
    ) -> list[dict]:
        body: dict = {}
        if meetingroom_id:
            body["meetingroom_id"] = meetingroom_id
        if start_time:
            body["start_time"] = start_time
        if end_time:
            body["end_time"] = end_time
        resp = self.client.post(
            "oa/meetingroom/get_booking_info", json=body
        )
        return resp.get("booking_list", [])

    # ── B2 预定会议室 ──
    def book_room(
        self,
        meetingroom_id: int,
        start_time: int,
        end_time: int,
        booker: str,
        subject: str = "",
        attendees: list[str] | None = None,
    ) -> dict:
        """预定会议室，返回 {booking_id, schedule_id}"""
        body: dict = {
            "meetingroom_id": meetingroom_id,
            "start_time": start_time,
            "end_time": end_time,
            "booker": booker,
        }
        if subject:
            body["subject"] = subject
        if attendees:
            body["attendees"] = attendees
        resp = self.client.post("oa/meetingroom/book", json=body)
        return {
            "booking_id": resp.get("booking_id", ""),
            "schedule_id": resp.get("schedule_id", ""),
        }

    # ── B3 取消预定 ──
    def cancel_booking(
        self, meeting_id: str, keep_schedule: int = 0
    ) -> None:
        self.client.post(
            "oa/meetingroom/cancel_book",
            json={"meeting_id": meeting_id, "keep_schedule": keep_schedule},
        )
```

### 7.2 TypeScript

```typescript
/** WeCom Meeting Client — 会议管理 */
import { WeComClient } from './wecom-core';

interface MeetingSettings {
  password?: string;
  enable_waiting_room?: boolean;
  allow_enter_before_host?: boolean;
  enable_enter_mute?: number;
  allow_external_user?: boolean;
  remind_scope?: number;
  hosts?: { userid: string[] };
  ring_users?: { userid: string[] };
}

interface MeetingReminders {
  is_repeat?: number;
  repeat_type?: number;
  repeat_until?: number;
  remind_before?: number[];
}

interface CreateMeetingRequest {
  admin_userid: string;
  title: string;
  meeting_start: number;
  meeting_duration: number;
  description?: string;
  location?: string;
  cal_id?: string;
  attendees?: { userid: string[] };
  settings?: MeetingSettings;
  reminders?: MeetingReminders;
}

interface MeetingInfo {
  admin_userid: string;
  title: string;
  meeting_start: number;
  meeting_duration: number;
  description: string;
  location: string;
  status: number;
  attendees: {
    member: Array<{ userid: string; status: number }>;
    tmp_external_user?: Array<{ tmp_external_userid: string; status: number }>;
  };
  settings: MeetingSettings;
  reminders?: MeetingReminders;
}

export class MeetingClient {
  constructor(private client: WeComClient) {}

  /** M1 创建预约会议 */
  async createMeeting(req: CreateMeetingRequest): Promise<{
    meetingid: string;
    meeting_code: string;
    meeting_link: string;
  }> {
    const resp = await this.client.post('meeting/create', req);
    return {
      meetingid: resp.meetingid,
      meeting_code: resp.meeting_code || '',
      meeting_link: resp.meeting_link || '',
    };
  }

  /** M2 修改预约会议 */
  async updateMeeting(
    meetingid: string,
    updates: Partial<CreateMeetingRequest>,
  ): Promise<void> {
    await this.client.post('meeting/update', { meetingid, ...updates });
  }

  /** M3 取消预约会议 */
  async cancelMeeting(
    meetingid: string,
    subMeetingid?: string,
  ): Promise<void> {
    const body: Record<string, string> = { meetingid };
    if (subMeetingid) body.sub_meetingid = subMeetingid;
    await this.client.post('meeting/cancel', body);
  }

  /** M4 获取会议详情 */
  async getMeetingInfo(meetingid: string): Promise<MeetingInfo> {
    return this.client.post('meeting/get_info', { meetingid });
  }

  /** M5 获取成员会议 ID 列表（自动分页） */
  async listUserMeetings(
    userid: string,
    opts?: { begin_time?: number; end_time?: number; limit?: number },
  ): Promise<string[]> {
    const allIds: string[] = [];
    let cursor = '';
    const limit = opts?.limit || 100;
    do {
      const body: Record<string, unknown> = { userid, limit };
      if (cursor) body.cursor = cursor;
      if (opts?.begin_time) body.begin_time = opts.begin_time;
      if (opts?.end_time) body.end_time = opts.end_time;
      const resp = await this.client.post('meeting/get_user_meetingid', body);
      allIds.push(...(resp.meetingid_list || []));
      cursor = resp.next_cursor || '';
    } while (cursor);
    return allIds;
  }
}

export class MeetingRoomClient {
  constructor(private client: WeComClient) {}

  async addRoom(room: {
    name: string;
    capacity: number;
    city?: string;
    building?: string;
    floor?: string;
    equipment?: number[];
  }): Promise<number> {
    const resp = await this.client.post('oa/meetingroom/add', room);
    return resp.meetingroom_id;
  }

  async listRooms(
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const resp = await this.client.post('oa/meetingroom/list', filters || {});
    return resp.meetingroom_list || [];
  }

  async bookRoom(booking: {
    meetingroom_id: number;
    start_time: number;
    end_time: number;
    booker: string;
    subject?: string;
    attendees?: string[];
  }): Promise<{ booking_id: string; schedule_id: string }> {
    const resp = await this.client.post('oa/meetingroom/book', booking);
    return { booking_id: resp.booking_id, schedule_id: resp.schedule_id };
  }

  async cancelBooking(
    meetingId: string,
    keepSchedule = 0,
  ): Promise<void> {
    await this.client.post('oa/meetingroom/cancel_book', {
      meeting_id: meetingId,
      keep_schedule: keepSchedule,
    });
  }
}
```

### 7.3 Go

```go
package meeting

import (
	"context"

	wecom "your-module/wecom-core"
)

type MeetingClient struct {
	client *wecom.WeComClient
}

func NewMeetingClient(c *wecom.WeComClient) *MeetingClient {
	return &MeetingClient{client: c}
}

type BaseResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// ── M1 创建预约会议 ──

type CreateMeetingReq struct {
	AdminUserid     string           `json:"admin_userid"`
	Title           string           `json:"title"`
	MeetingStart    int64            `json:"meeting_start"`
	MeetingDuration int              `json:"meeting_duration"`
	Description     string           `json:"description,omitempty"`
	Location        string           `json:"location,omitempty"`
	CalID           string           `json:"cal_id,omitempty"`
	Attendees       *MeetingUsers    `json:"attendees,omitempty"`
	Settings        *MeetingSettings `json:"settings,omitempty"`
	Reminders       *MeetingReminder `json:"reminders,omitempty"`
}

type MeetingUsers struct {
	Userid []string `json:"userid"`
}

type MeetingSettings struct {
	Password             string        `json:"password,omitempty"`
	EnableWaitingRoom    bool          `json:"enable_waiting_room,omitempty"`
	AllowEnterBeforeHost bool          `json:"allow_enter_before_host,omitempty"`
	EnableEnterMute      int           `json:"enable_enter_mute,omitempty"`
	AllowExternalUser    bool          `json:"allow_external_user,omitempty"`
	RemindScope          int           `json:"remind_scope,omitempty"`
	Hosts                *MeetingUsers `json:"hosts,omitempty"`
	RingUsers            *MeetingUsers `json:"ring_users,omitempty"`
}

type MeetingReminder struct {
	IsRepeat       int   `json:"is_repeat,omitempty"`
	RepeatType     int   `json:"repeat_type,omitempty"`
	RepeatUntil    int64 `json:"repeat_until,omitempty"`
	RepeatInterval int   `json:"repeat_interval,omitempty"`
	RemindBefore   []int `json:"remind_before,omitempty"`
}

type CreateMeetingResp struct {
	BaseResp
	MeetingID   string   `json:"meetingid"`
	MeetingCode string   `json:"meeting_code"`
	MeetingLink string   `json:"meeting_link"`
	ExcessUsers []string `json:"excess_users"`
}

func (m *MeetingClient) CreateMeeting(ctx context.Context, req *CreateMeetingReq) (*CreateMeetingResp, error) {
	var resp CreateMeetingResp
	err := m.client.Post(ctx, "meeting/create", req, &resp)
	return &resp, err
}

// ── M2 修改预约会议 ──

func (m *MeetingClient) UpdateMeeting(ctx context.Context, meetingID string, updates map[string]interface{}) error {
	updates["meetingid"] = meetingID
	var resp BaseResp
	return m.client.Post(ctx, "meeting/update", updates, &resp)
}

// ── M3 取消预约会议 ──

func (m *MeetingClient) CancelMeeting(ctx context.Context, meetingID string, subMeetingID ...string) error {
	body := map[string]string{"meetingid": meetingID}
	if len(subMeetingID) > 0 && subMeetingID[0] != "" {
		body["sub_meetingid"] = subMeetingID[0]
	}
	var resp BaseResp
	return m.client.Post(ctx, "meeting/cancel", body, &resp)
}

// ── M4 获取会议详情 ──

type MeetingInfoResp struct {
	BaseResp
	AdminUserid     string           `json:"admin_userid"`
	Title           string           `json:"title"`
	MeetingStart    int64            `json:"meeting_start"`
	MeetingDuration int              `json:"meeting_duration"`
	Description     string           `json:"description"`
	Location        string           `json:"location"`
	Status          int              `json:"status"`
	Attendees       MeetingAttendees `json:"attendees"`
	Settings        MeetingSettings  `json:"settings"`
}

type MeetingAttendees struct {
	Member          []MemberStatus          `json:"member"`
	TmpExternalUser []TmpExternalUserStatus `json:"tmp_external_user"`
}

type MemberStatus struct {
	Userid string `json:"userid"`
	Status int    `json:"status"`
}

type TmpExternalUserStatus struct {
	TmpExternalUserid string `json:"tmp_external_userid"`
	Status            int    `json:"status"`
}

func (m *MeetingClient) GetMeetingInfo(ctx context.Context, meetingID string) (*MeetingInfoResp, error) {
	var resp MeetingInfoResp
	err := m.client.Post(ctx, "meeting/get_info",
		map[string]string{"meetingid": meetingID}, &resp)
	return &resp, err
}

// ── M5 获取成员会议 ID 列表 ──

type UserMeetingReq struct {
	Userid    string `json:"userid"`
	Cursor    string `json:"cursor,omitempty"`
	BeginTime int64  `json:"begin_time,omitempty"`
	EndTime   int64  `json:"end_time,omitempty"`
	Limit     int    `json:"limit,omitempty"`
}

type UserMeetingResp struct {
	BaseResp
	NextCursor    string   `json:"next_cursor"`
	MeetingIDList []string `json:"meetingid_list"`
}

func (m *MeetingClient) ListUserMeetings(ctx context.Context, userid string) ([]string, error) {
	var allIDs []string
	cursor := ""
	for {
		req := &UserMeetingReq{Userid: userid, Cursor: cursor, Limit: 100}
		var resp UserMeetingResp
		if err := m.client.Post(ctx, "meeting/get_user_meetingid", req, &resp); err != nil {
			return nil, err
		}
		allIDs = append(allIDs, resp.MeetingIDList...)
		cursor = resp.NextCursor
		if cursor == "" || len(resp.MeetingIDList) < 100 {
			break
		}
	}
	return allIDs, nil
}
```

---


### 7.4 Java 示例

```java
public class WecomMeetingService {
    private final WeComClient client;

    public WecomMeetingService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-meeting 相关 API
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
class WecomMeetingService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-meeting 相关 API
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

### T1 创建并查询会议

```python
def test_create_and_get_meeting():
    """创建预约会议 → 获取详情 → 验证状态"""
    client = MeetingClient(wecom_client)

    result = client.create_meeting(
        admin_userid="TestUser",
        title="测试会议",
        meeting_start=int(time.time()) + 3600,
        meeting_duration=1800,
        attendees=["lisi", "wangwu"],
    )
    assert result["meetingid"]
    assert result["meeting_code"]

    info = client.get_meeting_info(result["meetingid"])
    assert info["status"] == 1  # 待开始
    assert info["title"] == "测试会议"
```

### T2 会议室预定流程

```python
def test_room_booking_flow():
    """查询空闲会议室 → 预定 → 取消"""
    room_client = MeetingRoomClient(room_wecom_client)

    rooms = room_client.list_rooms()
    assert len(rooms) > 0

    now = int(time.time())
    start = now + 7200
    end = start + 3600

    booking = room_client.book_room(
        meetingroom_id=rooms[0]["meetingroom_id"],
        start_time=start,
        end_time=end,
        booker="TestUser",
        subject="测试预定",
    )
    assert booking["booking_id"]

    room_client.cancel_booking(booking["booking_id"])
```

---

## 9. Code Review 检查清单

- [ ] **CR1** 路径不含 `/cgi-bin/` 前缀
- [ ] **CR2** Python `post()` 使用 `json=body` keyword 参数
- [ ] **CR3** OA 会议室接口使用"会议室" secret 的 access_token，而非普通应用 secret
- [ ] **CR4** `meeting_duration` ≥ 300 秒
- [ ] **CR5** `hosts.userid` 不包含 `admin_userid`（会被自动过滤）
- [ ] **CR6** `remind_scope=4` 时 `ring_users` 不为空
- [ ] **CR7** 修改 `meeting_start` 时同时传 `meeting_duration`
- [ ] **CR8** `password` 格式为 4-6 位纯数字
- [ ] **CR9** 重复会议取消时明确是取消单次还是整个系列

---

## 10. 踩坑指南 (Gotcha Guide)

### G1 两套会议室 API 体系

**症状**：OA meetingroom 接口和 Rooms 接口返回的数据完全不同

**原因**：OA 会议室 (`oa/meetingroom/`) 用于基础会议室管理，Rooms (`meeting/rooms/`) 用于硬件设备集成，是完全独立的两套系统。

**解法**：明确需求后选择正确的 API 体系。

---

### G2 任一参会者无效则整个请求失败

**症状**：创建会议时返回错误

**原因**：`attendees.userid` 或 `hosts.userid` 中任何一个 userid 无效或不在应用可见范围内，整个请求失败。

**解法**：提交前校验所有 userid 的有效性和可见范围。

---

### G3 只能操作自己创建的会议

**症状**：修改/取消/查询会议返回权限错误

**原因**：自建/第三方应用只能操作自己创建的会议。

**解法**：如需查询所有会议，使用系统内置"会议"应用。

---

### G4 cal_id 第三方应用必传

**症状**：第三方应用创建会议后参会者看不到日程

**原因**：第三方应用不传 `cal_id` 时，会议不会关联到任何日历。

**解法**：第三方应用创建会议时必须传 `cal_id`。自建应用不传则默认使用每位参会者的默认日历。

---

### G5 会议未开始时参会者列表为空

**症状**：`get_attendee_list` 返回空列表

**原因**：该接口返回的是**实际参加过会议的成员**，会议未开始时无人参加。

**解法**：会议未开始时用 `get_info` 查看邀请列表（`attendees.member`）。

---

### G6 重复会议取消影响范围

**症状**：本意取消单次，结果整个系列被取消

**原因**：不传 `sub_meetingid` 时取消整个重复系列。

**解法**：取消重复会议的单次须使用高级版 API 并传入 `sub_meetingid`。

---

### G7 会议室预定时间约束

**症状**：预定 API 返回时间错误

**原因**：OA 会议室预定限制为 8:00-23:00，最短 30 分钟，且自动取整到 30 分钟间隔。

**解法**：确保预定时间在 8:00-23:00 范围内，时长 ≥30 分钟。

---

### G8 主持人自动过滤

**症状**：设置的主持人数与实际不符

**原因**：`hosts.userid` 中包含 `admin_userid`（创建者）时，创建者会被自动过滤掉，因为创建者隐式为主持人。

**解法**：不需要在 `hosts.userid` 中包含创建者。

---

### G9 高级版功能需要购买

**症状**：设置 `auto_record`, `watermark_type` 等字段无效或报错

**原因**：这些字段属于高级版 API，需购买 10+ 在线会议室。

**解法**：确认企业已购买相应授权，或仅使用基础版字段。

---

## 11. 扩展子域 API 索引

### Rooms 会议室（硬件设备集成）

| 接口 | 路径 |
|------|------|
| 预定 Rooms 会议室 | `meeting/rooms/book` |
| 释放 Rooms 会议室 | `meeting/rooms/release` |
| 获取 Rooms 详情 | `meeting/rooms/get_info` |
| 获取 Rooms 列表 | `meeting/rooms/list` |
| 呼叫 Rooms 会议室 | `meeting/rooms/call` |

### PSTN 电话入会

| 接口 | 路径 |
|------|------|
| 批量外呼 | `meeting/phone/callout` |
| 获取外呼状态 | `meeting/phone/get_callout_status` |
| 获取电话入会成员 ID | `meeting/phone/get_tmp_openid` |

### 会议录制

| 接口 | 路径 |
|------|------|
| 获取录制列表 | `meeting/record/list` |
| 获取录制文件地址 | `meeting/record/get_file_list` |
| 获取录制转写详情 | `meeting/record/transcript/get_detail` |

### 网络研讨会 (Webinar)

| 接口 | 路径 |
|------|------|
| 创建网络研讨会 | `meeting/webinar/create` |
| 修改网络研讨会 | `meeting/webinar/update` |
| 取消网络研讨会 | `meeting/webinar/cancel` |
| 获取报名配置 | `meeting/webinar/enroll/get_config` |

---

## 12. 参考链接

| 文档 | 链接 |
|------|------|
| 会议概述 | https://developer.work.weixin.qq.com/document/path/93705 |
| 创建预约会议（基础） | https://developer.work.weixin.qq.com/document/path/97454 |
| 创建预约会议（高级） | https://developer.work.weixin.qq.com/document/path/98148 |
| 会议室管理 | https://developer.work.weixin.qq.com/document/path/93619 |
| 会议室预定 | https://developer.work.weixin.qq.com/document/path/93620 |
| 会议回调通知 | https://developer.work.weixin.qq.com/document/path/97451 |
| 会议室回调 | https://developer.work.weixin.qq.com/document/path/95333 |
| 频率限制 | https://developer.work.weixin.qq.com/document/path/96212 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |


