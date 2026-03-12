---
name: wecom-office-live
description: 企业微信直播域 SKILL — 预约直播、直播详情、观看明细、回放管理、直播回调
version: 1.0.0
domain: office-live
depends_on: wecom-core
doc_ids: [26267, 21995, 21999, 25240, 25243, 25516, 26465, 25244, 28367, 29984]
api_count: 10
callback_count: 1
triggers:
  - 直播
  - live
  - 预约直播
  - 直播回放
  - 直播观看
---

# WeCom Office Live SKILL (wecom-office-live)

> 企业微信直播域 SKILL：覆盖预约直播创建/修改/取消、直播详情获取、观看明细统计、回放管理等 10 个 API + 1 个回调事件。

---

## 1. Prerequisites

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret | 无特殊权限 |
| 第三方应用 | suite_access_token | 直播权限 |

---

## 2. API Quick Reference

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| V1 | 创建预约直播 | POST | `living/create` |
| V2 | 修改预约直播 | POST | `living/modify` |
| V3 | 取消预约直播 | POST | `living/cancel` |
| V4 | 获取成员直播ID列表 | POST | `living/get_living_id` |
| V5 | 获取直播详情 | GET | `living/get_living_info` |
| V6 | 获取直播观看明细 | POST | `living/get_watch_stat` |
| V7 | 删除直播回放 | POST | `living/delete_replay_data` |
| V8 | 在微信中观看直播 | POST | `living/get_living_share_info` |
| V9 | 获取跳转小程序商城的直播观众信息 | POST | `living/get_living_code` |

---

## 3. API Details

### V1. 创建预约直播

```
POST /cgi-bin/living/create?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| anchor_userid | 是 | string | 主播 userid |
| theme | 是 | string | 直播主题 |
| living_start | 是 | int | 开始时间戳 |
| living_duration | 是 | int | 直播时长（秒） |
| type | 否 | int | 0=通用, 1=小班课, 2=大班课, 3=企业培训, 4=活动直播 |
| description | 否 | string | 直播描述 |
| remind_time | 否 | int | 提前提醒秒数 |
| activity_cover_mediaid | 否 | string | 活动封面 media_id |
| activity_share_mediaid | 否 | string | 分享图 media_id |

**返回参数**：`{"livingid": "LIVING_ID"}`

### V5. 获取直播详情

```
GET /cgi-bin/living/get_living_info?access_token=ACCESS_TOKEN&livingid=LIVING_ID
```

**返回包含**：living_info（含 theme、living_start、living_duration、anchor_userid、living_range、viewer_num、comment_num、open_replay 等）。

### V6. 获取观看明细

```
POST /cgi-bin/living/get_watch_stat?access_token=ACCESS_TOKEN
```

**请求参数**：`{"livingid": "LIVING_ID", "next_key": "0"}`

**返回包含**：stat_info（含 users 数组，每个含 userid、watch_time、is_comment、invite_num 等），ending_watched_count, online_count 等。

---

## 4. Callbacks

### C1. living_status_change — 直播状态变更

**触发条件**：直播开始/结束/取消

```xml
<xml>
    <Event><![CDATA[living_status_change]]></Event>
    <LivingId><![CDATA[LIVING_ID]]></LivingId>
    <Status>1</Status>  <!-- 0=预约中, 1=直播中, 2=已结束, 3=已过期, 4=已取消 -->
</xml>
```

---

## 5. Code Templates

```python
"""WeCom Live Client — 直播管理"""
from wecom_core import WeComClient


class LiveClient:
    def __init__(self, client: WeComClient):
        self.client = client

    def create(self, anchor_userid: str, theme: str,
               living_start: int, living_duration: int, **kwargs) -> str:
        """V1: 创建预约直播，返回 livingid"""
        resp = self.client.post("/living/create", json={
            "anchor_userid": anchor_userid, "theme": theme,
            "living_start": living_start, "living_duration": living_duration,
            **kwargs,
        })
        return resp["livingid"]

    def modify(self, livingid: str, **kwargs) -> None:
        """V2: 修改预约直播"""
        self.client.post("/living/modify", json={"livingid": livingid, **kwargs})

    def cancel(self, livingid: str) -> None:
        """V3: 取消预约直播"""
        self.client.post("/living/cancel", json={"livingid": livingid})

    def get_living_id(self, userid: str, begin_time: int, end_time: int,
                      cursor: str = "", limit: int = 100) -> dict:
        """V4: 获取成员直播ID列表"""
        return self.client.post("/living/get_living_id", json={
            "userid": userid, "begin_time": begin_time,
            "end_time": end_time, "cursor": cursor, "limit": limit,
        })

    def get_living_info(self, livingid: str) -> dict:
        """V5: 获取直播详情"""
        return self.client.get("/living/get_living_info", params={"livingid": livingid})

    def get_watch_stat(self, livingid: str, next_key: str = "0") -> dict:
        """V6: 获取观看明细"""
        return self.client.post("/living/get_watch_stat", json={
            "livingid": livingid, "next_key": next_key,
        })

    def delete_replay(self, livingid: str) -> None:
        """V7: 删除直播回放"""
        self.client.post("/living/delete_replay_data", json={"livingid": livingid})
```

---


### 5.1 Java 示例

```java
public class WecomOfficeLiveService {
    private final WeComClient client;

    public WecomOfficeLiveService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-office-live 相关 API
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

### 5.2 PHP 示例

```php
<?php
class WecomOfficeLiveService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-office-live 相关 API
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

## 6. Gotcha Guide

### G1. 直播类型影响功能
不同 type 值对应不同的直播功能集合。例如 type=4（活动直播）支持活动封面和分享图。

### G2. 观看明细需分页
`get_watch_stat` 返回的数据可能很大，需使用 `next_key` 分页获取。

### G3. 直播开始前才能修改/取消
已经开始或已结束的直播不能修改/取消。

---

## 7. References

| doc_id | 标题 |
|--------|------|
| 26267 | 获取成员直播ID列表 |
| 21995 | 获取直播详情 |
| 21999 | 获取直播观看明细 |
| 25240 | 创建预约直播 |
| 25243 | 取消预约直播 |
| 25516 | 修改预约直播 |
| 28367 | 直播回调事件 |

**依赖 SKILL**：`wecom-core`


