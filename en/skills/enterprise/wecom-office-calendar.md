---
name: wecom-office-calendar
description: 企业微信日程日历域 SKILL — 日历 CRUD、日程 CRUD、重复日程、日程参与者管理、回调事件
version: 1.0.0
domain: office-calendar
depends_on: wecom-core
doc_ids: [18555, 26902, 44557, 44558, 44559, 26903, 41941, 44567, 44568, 44569, 44570, 44571, 44573, 26904, 44583, 44584, 44585, 44587, 45406]
api_count: 12
callback_count: 5
triggers:
  - 日程
  - 日历
  - calendar
  - schedule
  - 创建日程
  - 会议日程
---

# WeCom Office Calendar SKILL (wecom-office-calendar)

> 企业微信日程/日历域 SKILL：覆盖日历 CRUD、日程 CRUD（含重复日程）、日程参与者管理、5 种回调事件。

---

## 1. Prerequisites

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret | 日程权限 |
| 第三方应用 | suite_access_token | 日程权限 |

---

## 2. Core Concepts

### 2.1 日历与日程的关系

```
日历 (Calendar)
├── 日程 A (Schedule)
│   ├── 参与者列表
│   ├── 提醒设置
│   └── 重复规则 (可选)
├── 日程 B
└── 日程 C (重复日程 → 多次出现)
```

- 一个日历可以包含多个日程
- 日程可以设置为重复（每天/每周/每月/自定义）
- 参与者可以是企业成员或外部联系人

### 2.2 日程回执

参与者对日程邀请的回复：
| 值 | 含义 |
|----|------|
| 1 | 接受 |
| 2 | 暂定 |
| 3 | 拒绝 |

---

## 3. API Quick Reference

### 3.1 日历管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| L1 | 创建日历 | POST | `oa/calendar/add` |
| L2 | 更新日历 | POST | `oa/calendar/update` |
| L3 | 获取日历详情 | POST | `oa/calendar/get` |
| L4 | 删除日历 | POST | `oa/calendar/del` |

### 3.2 日程管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| E1 | 创建日程 | POST | `oa/schedule/add` |
| E2 | 更新日程 | POST | `oa/schedule/update` |
| E3 | 更新重复日程 | POST | `oa/schedule/update_repeat` |
| E4 | 新增日程参与者 | POST | `oa/schedule/add_attendees` |
| E5 | 删除日程参与者 | POST | `oa/schedule/del_attendees` |
| E6 | 获取日历下的日程列表 | POST | `oa/schedule/get_by_calendar` |
| E7 | 获取日程详情 | POST | `oa/schedule/get` |
| E8 | 取消日程 | POST | `oa/schedule/del` |

---

## 4. API Details

### E1. 创建日程

```
POST /cgi-bin/oa/schedule/add?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| schedule.organizer | 是 | string | 组织者 userid |
| schedule.summary | 是 | string | 日程标题 |
| schedule.description | 否 | string | 日程描述 |
| schedule.start_time | 是 | int | 开始时间戳 |
| schedule.end_time | 是 | int | 结束时间戳 |
| schedule.attendees | 否 | array | 参与者 [{userid}] |
| schedule.location | 否 | string | 地点 |
| schedule.cal_id | 否 | string | 日历 ID |
| schedule.reminders | 否 | object | 提醒设置 |
| schedule.is_repeat | 否 | int | 是否重复：0=否, 1=是 |
| schedule.repeat_rule | 否 | object | 重复规则（is_repeat=1 时） |

**返回参数**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "schedule_id": "SCHEDULE_ID"
}
```

### L1. 创建日历

```
POST /cgi-bin/oa/calendar/add?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| calendar.organizer | 是 | string | 组织者 userid |
| calendar.summary | 是 | string | 日历名称 |
| calendar.color | 否 | string | 日历颜色（如 "#FF0000"） |
| calendar.description | 否 | string | Description |
| calendar.shares | 否 | array | 共享成员 [{userid, readonly}] |
| agentid | 是 | int | 应用 ID |

---

## 5. Callbacks

| # | 事件 | ChangeType | 说明 |
|---|------|-----------|------|
| C1 | 删除日历 | `delete_calendar` | 日历被删除 |
| C2 | 修改日历 | `modify_calendar` | 日历设置变更 |
| C3 | 修改日程 | `modify_schedule` | 日程变更 |
| C4 | 删除日程 | `delete_schedule` | 日程被取消 |
| C5 | 日程回执 | `schedule_reply` | 参与者接受/拒绝 |

---

## 6. Code Templates

```python
"""WeCom Calendar Client — 日程日历管理"""
from wecom_core import WeComClient


class CalendarClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── 日历 ──

    def add_calendar(self, organizer: str, summary: str, agentid: int, **kwargs) -> str:
        """L1: 创建日历，返回 cal_id"""
        resp = self.client.post("/oa/calendar/add", json={
            "calendar": {"organizer": organizer, "summary": summary, **kwargs},
            "agentid": agentid,
        })
        return resp["cal_id"]

    def get_calendar(self, cal_id_list: list[str]) -> dict:
        """L3: 获取日历详情"""
        return self.client.post("/oa/calendar/get", json={"cal_id_list": cal_id_list})

    def update_calendar(self, calendar: dict) -> None:
        """L2: 更新日历"""
        self.client.post("/oa/calendar/update", json={"calendar": calendar})

    def del_calendar(self, cal_id: str) -> None:
        """L4: 删除日历"""
        self.client.post("/oa/calendar/del", json={"cal_id": cal_id})

    # ── 日程 ──

    def add_schedule(self, schedule: dict, agentid: int | None = None) -> str:
        """E1: 创建日程，返回 schedule_id"""
        body: dict = {"schedule": schedule}
        if agentid:
            body["agentid"] = agentid
        resp = self.client.post("/oa/schedule/add", json=body)
        return resp["schedule_id"]

    def get_schedule(self, schedule_id_list: list[str]) -> dict:
        """E7: 获取日程详情"""
        return self.client.post("/oa/schedule/get", json={"schedule_id_list": schedule_id_list})

    def update_schedule(self, schedule: dict) -> None:
        """E2: 更新日程"""
        self.client.post("/oa/schedule/update", json={"schedule": schedule})

    def del_schedule(self, schedule_id: str) -> None:
        """E8: 取消日程"""
        self.client.post("/oa/schedule/del", json={"schedule_id": schedule_id})

    def add_attendees(self, schedule_id: str, attendees: list[dict]) -> None:
        """E4: 新增参与者"""
        self.client.post("/oa/schedule/add_attendees", json={
            "schedule_id": schedule_id, "attendees": attendees,
        })

    def del_attendees(self, schedule_id: str, attendees: list[dict]) -> None:
        """E5: 删除参与者"""
        self.client.post("/oa/schedule/del_attendees", json={
            "schedule_id": schedule_id, "attendees": attendees,
        })

    def get_by_calendar(self, cal_id: str, offset: int = 0, limit: int = 500) -> dict:
        """E6: 获取日历下的日程列表"""
        return self.client.post("/oa/schedule/get_by_calendar", json={
            "cal_id": cal_id, "offset": offset, "limit": limit,
        })
```

---


### 6.1 Java 示例

```java
public class WecomOfficeCalendarService {
    private final WeComClient client;

    public WecomOfficeCalendarService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-office-calendar 相关 API
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

### 6.2 PHP 示例

```php
<?php
class WecomOfficeCalendarService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-office-calendar 相关 API
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

## 7. Gotcha Guide

### G1. 日程组织者权限
只有日程的组织者（organizer）才能更新/取消日程。其他参与者无权操作。

### G2. 重复日程更新
更新重复日程有专用接口 `update_repeat`。使用普通 `update` 接口会修改整个系列，而非单次。

### G3. 日历颜色格式
日历颜色为 HTML 颜色代码字符串，如 `"#FF0000"`。

### G4. 日历删除级联
删除日历会**级联删除**该日历下的所有日程，操作不可逆。

---

## 8. References

| doc_id | 标题 |
|--------|------|
| 18555 | 日程概述 |
| 26902 | 创建日历 |
| 26903 | 创建日程 |
| 44557-44573 | 日历/日程 CRUD |
| 44583-45406 | 回调事件 |

**依赖 SKILL**：`wecom-core`


