---
name: wecom-security
description: |
  企业微信安全与管理 SKILL — 安全管理(文件防泄漏/设备管理/截屏录屏/操作日志/域名IP)、
  账号ID(自建⇔第三方对接/tmp_external_userid转换)、人事助手(花名册)、高级功能(成员申请审批)
version: 1.0.0
domain: security
depends_on: wecom-core
doc_ids: [45230, 47801, 50728, 50731, 50733, 54776, 54785, 55153, 55393, 55394, 39558, 39763, 46252, 48933, 48934, 48935, 48936, 53457, 53713, 53714, 53717, 53722, 53724]
api_count: 20
callback_count: 3
triggers:
  - 安全管理
  - 文件防泄漏
  - 设备管理
  - 截屏录屏
  - 操作日志
  - 账号ID
  - tmp_external_userid
  - 人事助手
  - 花名册
  - 高级功能
  - 成员申请
  - security
  - device
  - audit log
---

# WeCom Security SKILL (wecom-security)

> 企业微信安全与管理 SKILL：覆盖安全管理（文件防泄漏 / 设备管理 / 截屏录屏管理 / 操作日志 / 域名IP信息）、
> 账号ID管理（自建⇔第三方应用对接 / tmp_external_userid 转换）、人事助手（花名册 CRUD）、
> 高级功能（成员申请审批流程）等 20 个 API + 3 个回调事件。

---

## 1. Prerequisites

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret | 安全管理 / 花名册等对应权限 |
| 第三方应用 | suite_access_token | 对应授权 |

---

## 2. 安全管理

### 2.1 API

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| S1 | 文件防泄漏 | POST | `security/trustdevice/get_by_user` | 获取可信设备/配置防泄漏策略 |
| S2 | 设备管理 | POST | `security/trustdevice/*` | 设备审批/删除/列表/导入导出 |
| S3 | 截屏/录屏管理 | POST | `security/vip_submit_audit_log` | 配置截屏录屏权限 |
| S4 | 获取企业微信域名IP信息 | GET | `get_api_domain_ip` | 获取企微服务域名和IP |
| S5 | 获取成员操作记录 | POST | `security/get_file_oper_record` | 文件操作记录审计 |
| S6 | 获取管理端操作日志 | POST | `security/get_admin_oper_record` | 管理端操作记录 |

### 2.2 高级功能账号管理（安全域）

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| S7 | 分配高级功能账号 | POST | `security/set_pro_user` |
| S8 | 取消高级功能账号 | POST | `security/unset_pro_user` |
| S9 | 获取高级功能账号列表 | POST | `security/list_pro_user` |

### 2.3 回调通知

| 事件 | 说明 |
|------|------|
| `security_event` | 安全事件通知（文件泄漏/异常登录等） |

---

## 3. 账号ID

### 3.1 概述

帮助同时使用自建应用和第三方应用的企业，实现两种应用之间的数据打通。

### 3.2 API

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| A1 | 自建⇔第三方应用对接 | POST | `batch/userid/convert` | userid 在自建/第三方间转换 |
| A2 | tmp_external_userid 转换 | POST | `idconvert/convert_tmp_external_userid` | 临时外部联系人 ID 转永久 |

### 3.3 核心概念

- **自建应用**使用的 `userid`/`external_userid` 与**第三方应用**使用的可能不同
- `tmp_external_userid` 是临时分配的外部联系人标识，需要转换为永久 ID
- 使用 `corpid + userid` 组合在两种应用体系间唯一标识一个成员

---

## 4. 人事助手

### 4.1 花名册

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| H1 | 获取员工字段配置 | POST | `hr/get_fields` | 获取花名册自定义字段定义 |
| H2 | 获取员工花名册信息 | POST | `hr/get_staff_info` | 获取员工详细花名册数据 |
| H3 | 更新员工花名册信息 | POST | `hr/update_staff_info` | 更新花名册字段值 |

### 4.2 核心概念

- 花名册是企业微信内置的员工信息管理功能
- 字段配置分为**系统字段**（姓名/部门/职位）和**自定义字段**（自定义扩展）
- 花名册信息通过 `userid` 关联到通讯录成员

---

## 5. 高级功能（许可申请审批）

### 5.1 概述

企业微信高级功能需要按接口许可证购买。成员可以发起申请，管理员审批。

### 5.2 API

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| P1 | 设置审批单审批信息 | POST | `license/submit_order_audit` | 审批/驳回成员申请 |
| P2 | 批量获取申请单ID | POST | `license/list_order` | 按条件查询申请单列表 |
| P3 | 获取申请单详细信息 | POST | `license/get_order` | 获取单个申请单详情 |

### 5.3 回调

| 事件 | 说明 |
|------|------|
| `license_pay_submit` | 成员申请的提交回调 |
| `license_pay_cancel` | 成员申请的终止回调 |

---

## 6. Code Templates

```python
"""WeCom Security & Management Client"""
from wecom_core import WeComClient


class SecurityClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── 安全管理 ──

    def get_file_oper_record(self, starttime: int, endtime: int,
                              userid: str | None = None,
                              cursor: str = "", limit: int = 100) -> dict:
        """S5: 获取成员操作记录"""
        body: dict = {"starttime": starttime, "endtime": endtime,
                       "cursor": cursor, "limit": limit}
        if userid:
            body["userid"] = userid
        return self.client.post("/security/get_file_oper_record", json=body)

    def get_admin_oper_record(self, starttime: int, endtime: int,
                               cursor: str = "", limit: int = 100) -> dict:
        """S6: 获取管理端操作日志"""
        return self.client.post("/security/get_admin_oper_record", json={
            "starttime": starttime, "endtime": endtime,
            "cursor": cursor, "limit": limit,
        })

    def get_api_domain_ip(self) -> dict:
        """S4: 获取企业微信域名IP信息"""
        return self.client.get("/get_api_domain_ip")

    # ── 账号ID ──

    def convert_userid(self, userid_list: list[str], source_agentid: int,
                        target_agentid: int) -> dict:
        """A1: userid 在自建/第三方应用间转换"""
        return self.client.post("/batch/userid/convert", json={
            "userid_list": userid_list,
            "source_agentid": source_agentid,
            "target_agentid": target_agentid,
        })

    def convert_tmp_external_userid(self, tmp_external_userid_list: list[str],
                                      business_type: int = 1) -> dict:
        """A2: tmp_external_userid 转换为永久 external_userid"""
        return self.client.post("/idconvert/convert_tmp_external_userid", json={
            "tmp_external_userid_list": tmp_external_userid_list,
            "business_type": business_type,
        })

    # ── 人事助手 ──

    def get_hr_fields(self) -> dict:
        """H1: 获取花名册字段配置"""
        return self.client.post("/hr/get_fields", json={})

    def get_staff_info(self, userid_list: list[str]) -> dict:
        """H2: 获取员工花名册信息"""
        return self.client.post("/hr/get_staff_info", json={"userid_list": userid_list})

    def update_staff_info(self, userid: str, field_value_list: list[dict]) -> None:
        """H3: 更新员工花名册信息"""
        self.client.post("/hr/update_staff_info", json={
            "userid": userid, "field_value_list": field_value_list,
        })

    # ── 高级功能 ──

    def submit_order_audit(self, order_id: str, action: int, remark: str = "") -> None:
        """P1: 审批成员申请 (action: 1=通过, 2=驳回)"""
        self.client.post("/license/submit_order_audit", json={
            "order_id": order_id, "action": action, "remark": remark,
        })

    def list_order(self, cursor: str = "", limit: int = 100, **kwargs) -> dict:
        """P2: 批量获取申请单ID"""
        return self.client.post("/license/list_order", json={
            "cursor": cursor, "limit": limit, **kwargs,
        })

    def get_order(self, order_id: str) -> dict:
        """P3: 获取申请单详情"""
        return self.client.post("/license/get_order", json={"order_id": order_id})
```

---


### 6.1 Java 示例

```java
public class WecomSecurityService {
    private final WeComClient client;

    public WecomSecurityService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-security 相关 API
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
class WecomSecurityService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-security 相关 API
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

### G1. 操作日志查询时间范围
操作日志查询的 starttime 和 endtime 差值最多 30 天。

### G2. tmp_external_userid 有时效性
`tmp_external_userid` 是临时分配的，需要尽快调用转换接口转为永久 ID。

### G3. 花名册字段的系统字段 vs 自定义字段
系统字段（如姓名）不可删除不可修改字段定义；自定义字段由企业管理员配置。获取信息时两者混合返回。

### G4. 高级功能需要企业购买许可证
高级功能接口只有在企业购买了对应许可证后才能使用。未购买时 API 会返回错误。

### G5. userid 转换需要两个 agentid
`convert_userid` 需要指定 source_agentid（来源应用）和 target_agentid（目标应用），两个应用必须属于同一企业。

---

## 8. References

| doc_id | 标题 |
|--------|------|
| 45230 | 文件防泄漏 |
| 47801 | 设备管理 |
| 55153 | 截屏/录屏管理 |
| 55393 | 获取成员操作记录 |
| 55394 | 获取管理端操作日志 |
| 54776 | 获取企业微信域名IP信息 |
| 39558 | 自建应用与第三方应用的对接 |
| 46252 | tmp_external_userid 的转换 |
| 48934 | 获取员工字段配置 |
| 48935 | 获取员工花名册信息 |
| 48936 | 更新员工花名册信息 |
| 53457 | 高级功能概述 |
| 53717 | 设置审批单审批信息 |
| 53722 | 批量获取申请单ID |
| 53724 | 获取申请单详细信息 |

**依赖 SKILL**：`wecom-core`


