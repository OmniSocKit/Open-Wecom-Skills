---
name: wecom-office-checkin
description: 企业微信打卡域 SKILL — 打卡记录/规则/排班/日报月报/人脸/补卡/设备打卡
version: 1.0.0
domain: office-checkin
depends_on: wecom-core
doc_ids: [14630, 14631, 25689, 25718, 25721, 25765, 25766, 25798, 16213, 39157, 44995, 52613]
api_count: 12
triggers:
  - 打卡
  - checkin
  - 考勤
  - 排班
  - 补卡
  - 日报
  - 月报
  - 人脸
---

# WeCom Office Checkin SKILL (wecom-office-checkin)

> 企业微信打卡（考勤）域 SKILL：覆盖打卡记录获取、打卡规则管理、排班管理、日报月报数据、人脸录入、补卡、设备打卡数据等 12 个 API。

---

## 1. Prerequisites

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 打卡应用 secret 的 access_token | 「打卡」应用的 secret |
| 第三方应用 | suite_access_token | 打卡权限 |

> **注意**：必须使用**打卡应用**的 secret，不能用通讯录同步助手的 secret。

---

## 2. Core Concepts

### 2.1 打卡类型

| 值 | 类型 | 说明 |
|----|------|------|
| 1 | 上下班打卡 | 固定时间打卡 |
| 2 | 外出打卡 | 外勤打卡 |
| 3 | 全部打卡 | 上下班 + 外出 |

### 2.2 打卡数据层次

```
打卡体系
├── 打卡规则 → 每组规则含时间/地点/Wi-Fi/人脸等
├── 排班信息 → 每人每天适用哪个规则班次
├── 打卡记录 → 每次具体的打卡行为
├── 日报数据 → 每人每天的考勤汇总
└── 月报数据 → 每人每月的考勤统计
```

---

## 3. API Quick Reference

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| K1 | 获取打卡记录数据 | POST | `checkin/getcheckindata` |
| K2 | 获取员工打卡规则 | POST | `checkin/getcheckinoption` |
| K3 | 获取打卡日报数据 | POST | `checkin/getcheckin_daydata` |
| K4 | 获取打卡月报数据 | POST | `checkin/getcheckin_monthdata` |
| K5 | 录入打卡人员人脸信息 | POST | `checkin/addcheckinuserface` |
| K6 | 获取打卡人员排班信息 | POST | `checkin/getcheckinschedulist` |
| K7 | 获取企业所有打卡规则 | POST | `checkin/getcorpcheckinoption` |
| K8 | 为打卡人员排班 | POST | `checkin/setcheckinschedulist` |
| K9 | 获取设备打卡数据 | POST | `checkin/get_hardware_checkin_data` |
| K10 | 为打卡人员补卡 | POST | `checkin/punch_correction` |
| K11 | 管理打卡规则 | POST | `checkin/add_checkin_option` |
| K12 | 添加打卡记录 | POST | `checkin/add_checkin_record` |

---

## 4. API Details

### K1. 获取打卡记录数据

```
POST /cgi-bin/checkin/getcheckindata?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| opencheckindatatype | 是 | int | 打卡类型：1=上下班, 2=外出, 3=全部 |
| starttime | 是 | int | 开始时间戳 |
| endtime | 是 | int | 结束时间戳（与 starttime 最多相差 30 天） |
| useridlist | 是 | array[string] | 用户 userid 列表（最多 100 个） |

**返回包含**：checkindata 数组，每条含 userid、groupname、checkin_type、exception_type、checkin_time、location_title、location_detail、wifiname、notes、mediaids 等。

### K3. 获取打卡日报数据

```
POST /cgi-bin/checkin/getcheckin_daydata?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| starttime | 是 | int | 开始日期时间戳 |
| endtime | 是 | int | 结束日期时间戳（最多 30 天） |
| useridlist | 是 | array[string] | 用户列表（最多 100） |

### K8. 为打卡人员排班

```
POST /cgi-bin/checkin/setcheckinschedulist?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| group_id | 是 | int | 打卡规则 ID |
| items | 是 | array | 排班项列表 |
| items[].userid | 是 | string | 成员 userid |
| items[].day | 是 | int | 排班日期时间戳（0 点） |
| items[].schedule_id | 是 | int | 班次 ID |

### K10. 为打卡人员补卡

```
POST /cgi-bin/checkin/punch_correction?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| userid | 是 | string | 成员 userid |
| day | 是 | int | 补卡日期（0 点时间戳） |
| offset | 是 | int | 打卡时间偏移秒数 |
| remark | 否 | string | 补卡备注 |

---

## 5. Code Templates

### 5.1 Python

```python
"""WeCom Checkin Client — 打卡管理"""
from wecom_core import WeComClient


class CheckinClient:
    def __init__(self, client: WeComClient):
        self.client = client

    def get_checkin_data(self, opencheckindatatype: int, starttime: int,
                         endtime: int, useridlist: list[str]) -> dict:
        """K1: 获取打卡记录"""
        return self.client.post("/checkin/getcheckindata", json={
            "opencheckindatatype": opencheckindatatype,
            "starttime": starttime, "endtime": endtime,
            "useridlist": useridlist,
        })

    def get_checkin_option(self, useridlist: list[str], datetime_: int) -> dict:
        """K2: 获取员工打卡规则"""
        return self.client.post("/checkin/getcheckinoption", json={
            "datetime": datetime_, "useridlist": useridlist,
        })

    def get_daydata(self, starttime: int, endtime: int, useridlist: list[str]) -> dict:
        """K3: 获取打卡日报"""
        return self.client.post("/checkin/getcheckin_daydata", json={
            "starttime": starttime, "endtime": endtime, "useridlist": useridlist,
        })

    def get_monthdata(self, starttime: int, endtime: int, useridlist: list[str]) -> dict:
        """K4: 获取打卡月报"""
        return self.client.post("/checkin/getcheckin_monthdata", json={
            "starttime": starttime, "endtime": endtime, "useridlist": useridlist,
        })

    def add_user_face(self, userid: str, userface: str) -> None:
        """K5: 录入人脸（userface 为 base64 图片数据）"""
        self.client.post("/checkin/addcheckinuserface", json={
            "userid": userid, "userface": userface,
        })

    def get_schedule(self, group_id: int, useridlist: list[str],
                     starttime: int, endtime: int) -> dict:
        """K6: 获取排班信息"""
        return self.client.post("/checkin/getcheckinschedulist", json={
            "group_id": group_id, "starttime": starttime,
            "endtime": endtime, "useridlist": useridlist,
        })

    def set_schedule(self, group_id: int, items: list[dict]) -> None:
        """K8: 设置排班"""
        self.client.post("/checkin/setcheckinschedulist", json={
            "group_id": group_id, "items": items,
        })

    def punch_correction(self, userid: str, day: int, offset: int, remark: str = "") -> None:
        """K10: 补卡"""
        self.client.post("/checkin/punch_correction", json={
            "userid": userid, "day": day, "offset": offset, "remark": remark,
        })

    def get_corp_option(self) -> dict:
        """K7: 获取企业所有打卡规则"""
        return self.client.post("/checkin/getcorpcheckinoption", json={})

    def get_hardware_data(self, filter_type: int, starttime: int,
                          endtime: int, useridlist: list[str]) -> dict:
        """K9: 获取设备打卡数据"""
        return self.client.post("/checkin/get_hardware_checkin_data", json={
            "filter_type": filter_type, "starttime": starttime,
            "endtime": endtime, "useridlist": useridlist,
        })
```

---


### 5.2 Java 示例

```java
public class WecomOfficeCheckinService {
    private final WeComClient client;

    public WecomOfficeCheckinService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-office-checkin 相关 API
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

### 5.3 PHP 示例

```php
<?php
class WecomOfficeCheckinService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-office-checkin 相关 API
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

### G1. 时间范围限制
`starttime` 和 `endtime` 差值最多 30 天，超过会报错。大范围查询需分批。

### G2. useridlist 限制
单次最多 100 个 userid。大企业需分批查询。

### G3. 必须使用打卡应用的 Secret
不能使用通讯录或其他应用的 secret。必须在管理后台找到"打卡"应用获取其 secret。

### G4. 时间戳为秒级
所有时间参数为 Unix 时间戳（秒），不是毫秒。

### G5. 日报/月报 vs 原始记录
- `getcheckindata` 返回每次打卡的原始记录
- `getcheckin_daydata` 返回每人每天的考勤汇总（迟到/早退/旷工等）
- `getcheckin_monthdata` 返回每人每月的统计

根据场景选择合适的接口，避免拉取原始数据后自行计算。

---

## 7. References

| doc_id | 标题 |
|--------|------|
| 14630 | 获取打卡记录数据 |
| 14631 | 获取员工打卡规则 |
| 25689 | 获取打卡日报数据 |
| 25718 | 录入打卡人员人脸信息 |
| 25721 | 获取打卡人员排班信息 |
| 25765 | 获取企业所有打卡规则 |
| 25766 | 为打卡人员排班 |
| 25798 | 获取打卡月报数据 |
| 16213 | 获取设备打卡数据 |
| 39157 | 为打卡人员补卡 |
| 44995 | 管理打卡规则 |
| 52613 | 添加打卡记录 |

**依赖 SKILL**：`wecom-core`


