---
name: wecom-advanced
description: |
  企业微信高级功能 SKILL — 会话内容存档、企业支付（红包/付款/对外收款）、电子发票、
  紧急通知应用、汇报、会议室管理
version: 1.0.0
domain: advanced
depends_on: wecom-core
doc_ids: [15329, 15330, 16316, 16318, 16547, 17312, 17367, 18890, 23100, 34444, 11478, 11543, 11544, 11545, 11546, 11438, 11652, 24952, 24953, 24937, 39973, 45410, 47982, 47983, 47984, 11630, 11631, 11633, 11634, 11974, 16595, 16654, 16655, 25844, 25845, 25846, 26566, 44913, 22789, 22512, 22517, 36019]
api_count: 40
callback_count: 3
triggers:
  - 会话内容存档
  - 会话存档
  - 企业支付
  - 企业红包
  - 对外收款
  - 电子发票
  - 紧急通知
  - 汇报
  - 会议室
  - msgaudit
  - 聊天记录
  - 收款
  - 付款
---

# WeCom Advanced SKILL (wecom-advanced)

> 企业微信高级功能 SKILL：覆盖会话内容存档、企业支付（红包/付款/对外收款）、电子发票、紧急通知应用、汇报、会议室管理等多个跨域能力，共 40 个 API + 3 个回调事件。

---

## 1. 会话内容存档

### 1.1 概述

会话内容存档允许企业合规存储成员的聊天记录（需成员同意）。

**权限要求**：需要开通「会话内容存档」功能（企业付费功能）。

### 1.2 API

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| A1 | 获取存档开启成员列表 | POST | `msgaudit/get_permit_user_list` |
| A2 | 获取会话内容 | - | 使用 SDK 拉取（非 HTTP） |
| A3 | 获取会话同意情况 | POST | `msgaudit/check_single_agree` |
| A4 | 获取内部群信息 | POST | `msgaudit/groupchat/get` |

### 1.3 关键说明

- 使用 C/C++ SDK 拉取会话内容（非 HTTP API），需要部署到服务器
- 聊天内容使用 RSA 加密，需要配置公钥/私钥
- 回调事件：`msgaudit_notify`（有新会话产生）、`sys_approval_change`（客户同意存档）

---

## 2. 企业支付

### 2.1 企业红包

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| P1 | 发放企业红包 | POST | 微信支付接口 |
| P2 | 查询红包记录 | POST | 微信支付接口 |

### 2.2 向员工付款

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| P3 | 向员工付款 | POST | 微信支付接口 |
| P4 | 查询付款记录 | POST | 微信支付接口 |

### 2.3 对外收款

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| P5 | 收款商户号管理 | POST | `externalpay/getmerchant` |
| P6 | 获取对外收款记录 | POST | `externalpay/get_bill_list` |
| P7 | 获取收款项目商户单号 | POST | `externalpay/get_trade_no` |
| P8 | 获取资金流水 | POST | `externalpay/get_fund_flow` |

### 2.4 创建对外收款账户

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| P9 | 提交图片 | POST (multipart) | `externalpay/apply/upload_image` |
| P10 | 提交创建申请 | POST | `externalpay/apply/submit` |
| P11 | 查询申请状态 | POST | `externalpay/apply/query` |

**签名算法**：企业支付接口需要使用微信支付签名（MD5/HMAC-SHA256），与 JS-SDK 签名不同。

---

## 3. 电子发票

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| I1 | 查询电子发票 | POST | `card/invoice/reimburse/getinvoiceinfo` |
| I2 | 更新发票状态 | POST | `card/invoice/reimburse/updateinvoicestatus` |
| I3 | 批量更新发票状态 | POST | `card/invoice/reimburse/updatestatusbatch` |
| I4 | 批量查询电子发票 | POST | `card/invoice/reimburse/getinvoiceinfobatch` |

---

## 4. 紧急通知应用

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| N1 | 发起语音电话 | POST | `pstncc/call` |
| N2 | 获取接听状态 | POST | `pstncc/getstatus` |

---

## 5. 汇报

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| R1 | 批量获取汇报记录单号 | POST | `oa/journal/get_record_list` |
| R2 | 获取汇报记录详情 | POST | `oa/journal/get_record_detail` |
| R3 | 获取汇报统计数据 | POST | `oa/journal/get_stat_list` |

---

## 6. 会议室管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| MR1 | 会议室管理（增删改查） | POST | `oa/meetingroom/*` |
| MR2 | 会议室预定管理 | POST | `oa/meetingroom/book/*` |

### 回调事件

| 事件 | 说明 |
|------|------|
| `meetingroom_status_change` | 会议室状态变更 |
| `meetingroom_book_change` | 会议室预定变更 |

---

## 7. Code Templates

```python
"""WeCom Advanced Features Client"""
from wecom_core import WeComClient


class AdvancedClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── 会话内容存档 ──

    def get_permit_user_list(self, type_: int = 1) -> dict:
        """A1: 获取存档开启的成员列表"""
        return self.client.post("/msgaudit/get_permit_user_list", json={"type": type_})

    def check_single_agree(self, info: list[dict]) -> dict:
        """A3: 获取会话同意情况"""
        return self.client.post("/msgaudit/check_single_agree", json={"info": info})

    def get_groupchat(self, roomid: str) -> dict:
        """A4: 获取内部群信息"""
        return self.client.post("/msgaudit/groupchat/get", json={"roomid": roomid})

    # ── 对外收款 ──

    def get_bill_list(self, begin_time: int, end_time: int,
                      cursor: str = "", limit: int = 100) -> dict:
        """P6: 获取对外收款记录"""
        return self.client.post("/externalpay/get_bill_list", json={
            "begin_time": begin_time, "end_time": end_time,
            "cursor": cursor, "limit": limit,
        })

    # ── 电子发票 ──

    def get_invoice_info(self, card_id: str, encrypt_code: str) -> dict:
        """I1: 查询电子发票"""
        return self.client.post("/card/invoice/reimburse/getinvoiceinfo", json={
            "card_id": card_id, "encrypt_code": encrypt_code,
        })

    def update_invoice_status(self, card_id: str, encrypt_code: str,
                               reimburse_status: str) -> None:
        """I2: 更新发票状态"""
        self.client.post("/card/invoice/reimburse/updateinvoicestatus", json={
            "card_id": card_id, "encrypt_code": encrypt_code,
            "reimburse_status": reimburse_status,
        })

    # ── 汇报 ──

    def get_journal_list(self, starttime: int, endtime: int,
                         cursor: int = 0, limit: int = 100) -> dict:
        """R1: 批量获取汇报记录单号"""
        return self.client.post("/oa/journal/get_record_list", json={
            "starttime": starttime, "endtime": endtime,
            "cursor": cursor, "limit": limit,
        })

    def get_journal_detail(self, journaluuid: str) -> dict:
        """R2: 获取汇报记录详情"""
        return self.client.post("/oa/journal/get_record_detail", json={
            "journaluuid": journaluuid,
        })
```

---


### 7.1 Java 示例

```java
public class WecomAdvancedService {
    private final WeComClient client;

    public WecomAdvancedService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-advanced 相关 API
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

### 7.2 PHP 示例

```php
<?php
class WecomAdvancedService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-advanced 相关 API
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

## 8. Gotcha Guide

### G1. 会话存档需要 C SDK
会话内容拉取不通过 HTTP API，需要使用企微提供的 C/C++ SDK 部署到服务器。

### G2. 企业支付使用微信支付签名
企业红包和付款走微信支付体系，签名算法（MD5/HMAC-SHA256）与企业微信其他 API 不同。

### G3. 发票 encrypt_code 加密
电子发票的 `encrypt_code` 是加密后的编码，需要先解密才能使用。

### G4. 会话存档需要成员同意
只有成员同意存档后，才能拉取该成员的聊天记录。可通过 `check_single_agree` 检查同意状态。

---

## 9. References

| doc_id 范围 | 说明 |
|------------|------|
| 15329-34444 | 会话内容存档 |
| 11478-47984 | 企业支付 |
| 11630-11974 | 电子发票 |
| 16595-16655 | 紧急通知 |
| 25844-44913 | 汇报 |
| 22789-36019 | 会议室 |

**依赖 SKILL**：`wecom-core`


