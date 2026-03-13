---
name: wecom-crm-transfer
description: 企业微信外部联系人·客户分配与继承 SKILL — 在职/离职客户转接、客户群继承、接替状态查询
version: 1.0.0
triggers:
  - 客户继承
  - 客户分配
  - 离职继承
  - 在职继承
  - transfer_customer
  - transfer_result
  - onjob_transfer
  - groupchat/transfer
  - 接替
  - 离职员工客户
  - 群主转让
  - 40097
  - 90500
prerequisite_skills:
  - wecom-core
domain: crm-transfer
api_count: 6
callback_count: 1
---

# WeCom CRM · Customer Transfer & Inheritance SKILL

> 覆盖企业微信「外部联系人 · 客户分配与继承」子域：在职继承（2 API）、离职继承（2 API）、客户群继承（2 API），以及接替失败回调事件。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 「客户联系」secret 或已配置到「可调用应用」列表的自建应用 secret | 客户联系使用范围 |
| 第三方应用 | 企业授权的 access_token | 「企业客户权限 → 客户联系 → 在职继承/离职分配」 |

> **关键**：接替成员必须在应用的可见范围内，且已配置客户联系功能、已实名、已激活企业微信。

### 1.2 管理后台配置

1. **企业微信管理后台 → 客户联系 → 权限配置** → 将应用添加到「可调用应用」列表
2. **接替成员前置条件**：已激活企业微信 + 已实名认证 + 已配置客户联系功能
3. **回调配置**：在应用管理中配置回调 URL / Token / EncodingAESKey（接收 transfer_fail 事件）

---

## 2. 核心概念

### 2.1 继承类型总览

| 维度 | 在职继承 | 离职继承 |
|------|---------|---------|
| 适用场景 | 在职成员间转移客户 | 已离职成员的客户交接 |
| 客户确认 | **需要**客户在 24h 内确认 | **无需**确认，24h 后自动接替 |
| transfer_success_msg | 支持自定义 | 不支持（无此参数） |
| 90 天转接次数限制 | 每位客户最多 **2** 次 | 不适用 |
| handover_userid 要求 | 在职成员 | **必须已离职** |

### 2.2 接替状态 (status)

| status | 含义 | 说明 |
|--------|------|------|
| 1 | 接替完毕 | 客户已由新成员跟进 |
| 2 | 等待接替 | 在职=等客户确认；离职=24h 自动完成中 |
| 3 | 客户拒绝 | 仅在职继承会出现（客户主动拒绝） |
| 4 | 接替成员客户达到上限 | 新成员客户数已满 |
| 5 | 无接替记录 | 仅在职 transfer_result 返回 |

### 2.3 客户群继承

| 维度 | 在职群转让 | 离职群继承 |
|------|-----------|-----------|
| 接口 | `groupchat/onjob_transfer` | `groupchat/transfer` |
| 群主要求 | 在职（用 90500 阻止离职） | **必须已离职**（用 90502 阻止在职） |
| 90 天限制 | 每群最多 **2** 次 | 不适用 |
| 每天上限 | 同一人的群每天最多 **300** 个 | 同一人的群每天最多 **300** 个 |
| 离职时限 | N/A | 旧群主离职不超过 **1 年** |
| 登录要求 | 新旧群主近一年内至少登录过一次 | 新群主 + 旧群主离职前一年内至少登录过一次 |

---

## 3. API 速查表

| ID | 接口名 | 方法 | 路径 | 说明 |
|----|--------|------|------|------|
| T1 | transfer_customer | POST | `/cgi-bin/externalcontact/transfer_customer` | 分配在职成员的客户 |
| T2 | transfer_result | POST | `/cgi-bin/externalcontact/transfer_result` | 查询在职客户接替状态 |
| T3 | resigned/transfer_customer | POST | `/cgi-bin/externalcontact/resigned/transfer_customer` | 分配离职成员的客户 |
| T4 | resigned/transfer_result | POST | `/cgi-bin/externalcontact/resigned/transfer_result` | 查询离职客户接替状态 |
| T5 | groupchat/onjob_transfer | POST | `/cgi-bin/externalcontact/groupchat/onjob_transfer` | 分配在职成员的客户群 |
| T6 | groupchat/transfer | POST | `/cgi-bin/externalcontact/groupchat/transfer` | 分配离职成员的客户群 |

**Base URL**: `https://qyapi.weixin.qq.com`
**所有接口均需附带 `?access_token=ACCESS_TOKEN` 查询参数。**

---

## 4. API 详细说明

### T1: 分配在职成员的客户

**POST** `/cgi-bin/externalcontact/transfer_customer?access_token=ACCESS_TOKEN`

#### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `handover_userid` | string | 是 | 原跟进成员的 userid |
| `takeover_userid` | string | 是 | 接替成员的 userid |
| `external_userid` | string[] | 是 | 客户的 external_userid 列表，每次最多 **100** 个 |
| `transfer_success_msg` | string | 否 | 转接成功后发给客户的消息，不填则使用默认文案 |

#### 请求示例

```json
{
  "handover_userid": "zhangsan",
  "takeover_userid": "lisi",
  "external_userid": [
    "woAJ2GCAAAXtWyujaWJHDDGi0mACAAAA",
    "woAJ2GCAAAXtWyujaWJHDDGi0mACBBBB"
  ],
  "transfer_success_msg": "您好，后续将由同事李四继续为您服务。"
}
```

#### Response Parameters

| 参数 | 类型 | 说明 |
|------|------|------|
| `errcode` | int | 0=成功 |
| `errmsg` | string | 错误信息 |
| `customer` | object[] | 逐客户分配结果 |
| `customer[].external_userid` | string | 客户 ID |
| `customer[].errcode` | int | 该客户的分配结果，0=成功 |

#### 关键约束

1. `external_userid` 必须是 `handover_userid` 的客户
2. **90 自然日内**每位客户最多被转接 **2** 次
3. 客户需在 **24 小时**内确认接替，可以拒绝
4. 若接替成员转接前已是客户好友，不触发「添加企业客户事件」

---

### T2: 查询在职客户接替状态

**POST** `/cgi-bin/externalcontact/transfer_result?access_token=ACCESS_TOKEN`

#### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `handover_userid` | string | 是 | 原跟进成员 userid |
| `takeover_userid` | string | 是 | 接替成员 userid |
| `cursor` | string | 否 | 分页游标 |

#### Response Parameters

| 参数 | 类型 | 说明 |
|------|------|------|
| `customer` | object[] | 接替结果列表 |
| `customer[].external_userid` | string | 客户 ID |
| `customer[].status` | int | 1=完毕 2=等待 3=拒绝 4=上限 5=无记录 |
| `customer[].takeover_time` | int | 接替时间戳，未接替时为 0 |
| `next_cursor` | string | 分页游标，为空表示已获取全部 |

---

### T3: 分配离职成员的客户

**POST** `/cgi-bin/externalcontact/resigned/transfer_customer?access_token=ACCESS_TOKEN`

#### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `handover_userid` | string | 是 | 原跟进成员的 userid（**必须已离职**） |
| `takeover_userid` | string | 是 | 接替成员的 userid |
| `external_userid` | string[] | 是 | 客户的 external_userid 列表，每次最多 **100** 个 |

> **注意**：离职继承没有 `transfer_success_msg` 参数。离职继承无需客户确认，24h 后自动完成接替。

#### 关键约束

1. `handover_userid` **必须已离职**，否则返回 40097
2. 无需客户确认，24h 后自动完成
3. 不受 90 天 2 次转接限制
4. 可先通过 `get_unassigned_list` 获取离职成员的待分配客户列表

---

### T4: 查询离职客户接替状态

**POST** `/cgi-bin/externalcontact/resigned/transfer_result?access_token=ACCESS_TOKEN`

请求参数和响应结构同 T2，但 status 枚举无 5（无接替记录）。

#### 关键提示

- 分配后立即查询可能返回空 `customer` 数组，需等待一定时间再查
- 离职继承 24h 后自动完成，status=2 是正常中间态

---

### T5: 分配在职成员的客户群

**POST** `/cgi-bin/externalcontact/groupchat/onjob_transfer?access_token=ACCESS_TOKEN`

#### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `chat_id_list` | string[] | 是 | 客户群 ID 列表，每次最多 **100** 个 |
| `new_owner` | string | 是 | 新群主的 userid |

#### Response Parameters

| 参数 | 类型 | 说明 |
|------|------|------|
| `errcode` | int | 0=成功 |
| `errmsg` | string | 错误信息 |
| `failed_chat_list` | object[] | 转接失败的群列表 |
| `failed_chat_list[].chat_id` | string | 失败的群 ID |
| `failed_chat_list[].errcode` | int | 失败原因错误码 |
| `failed_chat_list[].errmsg` | string | 失败原因描述 |

#### 关键约束

1. **90 自然日内**每个客户群最多被转接 **2** 次
2. 同一人的群每天最多分配 **300** 个给新群主
3. 新旧群主需在最近一年内至少登录过一次企业微信

---

### T6: 分配离职成员的客户群

**POST** `/cgi-bin/externalcontact/groupchat/transfer?access_token=ACCESS_TOKEN`

请求参数同 T5（`chat_id_list` + `new_owner`），响应结构同 T5。

#### 关键约束

1. 群主**必须已离职**，否则返回 90500（应使用 T5 onjob_transfer）
2. 同一人的群每天最多分配 **300** 个
3. 旧群主的离职时间不能超过 **1 年**，且离职前一年内至少登录过一次

---

## 5. 回调事件

### E1: 客户接替失败事件 transfer_fail

**触发条件**：通过 T1/T3 接口分配客户后接替失败

> 仅 API 发起的转接失败才触发此回调，手动操作不产生回调。

#### 事件 XML

```xml
<xml>
  <ToUserName><![CDATA[toUser]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1403610513</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[change_external_contact]]></Event>
  <ChangeType><![CDATA[transfer_fail]]></ChangeType>
  <FailReason><![CDATA[customer_refused]]></FailReason>
  <UserID><![CDATA[zhangsan]]></UserID>
  <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mAAAA]]></ExternalUserID>
</xml>
```

#### 关键字段

| 字段 | 说明 |
|------|------|
| `Event` | 固定 `change_external_contact` |
| `ChangeType` | 固定 `transfer_fail` |
| `FailReason` | `customer_refused`=客户拒绝 / `customer_limit_exceed`=接替成员客户数达上限 |
| `UserID` | 接替成员的 userid（非原跟进人） |
| `ExternalUserID` | 客户的 external_userid |

---

## 6. 工作流

### 6.1 离职员工客户全量继承

```
步骤 1: 获取离职员工待分配客户列表
  GET /cgi-bin/externalcontact/get_unassigned_list (需通讯录 secret)
  ↓ 获得 handover_userid + external_userid 映射
步骤 2: 按每 100 个客户分批调用 T3 (resigned/transfer_customer)
  ↓ 收集每个客户的 errcode
步骤 3: 轮询 T4 (resigned/transfer_result) 查询接替状态
  ↓ 等待 status 从 2→1（最长 24h）
步骤 4: 处理失败
  ↓ errcode=40099 → 更换接替成员
  ↓ errcode=40100 → 等待前次转移完成
步骤 5: 监听 E1 (transfer_fail) 回调处理异步失败
```

### 6.2 在职客户转接 + 结果追踪

```
步骤 1: 调用 T1 (transfer_customer)
  ↓ 传入 handover_userid, takeover_userid, external_userid[]
  ↓ 可选设置 transfer_success_msg
步骤 2: 检查返回的 customer[].errcode
  ↓ 40128 → 90 天内已转接 2 次，跳过该客户
步骤 3: 定期轮询 T2 (transfer_result)
  ↓ status=1 → 完成
  ↓ status=2 → 等待客户确认（24h 内）
  ↓ status=3 → 客户拒绝，记录日志
  ↓ status=4 → 接替成员达上限，更换接替人
步骤 4: 监听 E1 回调获取异步失败通知
```

### 6.3 客户群批量继承

```
步骤 1: 获取客户群列表
  POST /cgi-bin/externalcontact/groupchat/list
  ↓ 按 owner_filter 筛选目标群主的群
步骤 2: 按每 100 个群分批调用 T5/T6
  ↓ 在职用 T5 (onjob_transfer)
  ↓ 离职用 T6 (groupchat/transfer)
步骤 3: 检查 failed_chat_list
  ↓ 90501 → 跳过非客户群
  ↓ 90500/90502 → 用错接口，切换到正确接口
步骤 4: 注意每天 300 群/人上限，超出部分次日继续
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom CRM 客户分配与继承管理器 — 依赖 wecom-core 的 WeComClient"""
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class TransferManager:
    """客户分配与继承管理器"""

    def __init__(self, client):
        """
        Args:
            client: WeComClient 实例（来自 wecom-core）
        """
        self.client = client

    # ── T1: 分配在职成员的客户 ──

    def transfer_customer(
        self,
        handover_userid: str,
        takeover_userid: str,
        external_userids: list[str],
        transfer_success_msg: Optional[str] = None,
    ) -> list[dict]:
        """
        分配在职成员的客户。每次最多 100 个客户。

        Returns:
            list[dict]: [{"external_userid": "wo...", "errcode": 0}, ...]
        """
        if len(external_userids) > 100:
            raise ValueError("每次最多转接 100 个客户")

        body = {
            "handover_userid": handover_userid,
            "takeover_userid": takeover_userid,
            "external_userid": external_userids,
        }
        if transfer_success_msg:
            body["transfer_success_msg"] = transfer_success_msg

        resp = self.client.post("/externalcontact/transfer_customer", json=body)
        return resp.get("customer", [])

    # ── T2: 查询在职客户接替状态 ──

    def get_transfer_result(
        self,
        handover_userid: str,
        takeover_userid: str,
    ) -> list[dict]:
        """
        查询在职客户接替状态（自动分页）。

        Returns:
            list[dict]: [{"external_userid": "wo...", "status": 1, "takeover_time": 1588262400}, ...]
        """
        results = []
        cursor = ""
        while True:
            body = {
                "handover_userid": handover_userid,
                "takeover_userid": takeover_userid,
                "cursor": cursor,
            }
            resp = self.client.post("/externalcontact/transfer_result", json=body)
            results.extend(resp.get("customer", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── T3: 分配离职成员的客户 ──

    def transfer_resigned_customer(
        self,
        handover_userid: str,
        takeover_userid: str,
        external_userids: list[str],
    ) -> list[dict]:
        """
        分配离职成员的客户。handover_userid 必须已离职。每次最多 100 个。
        离职继承无需客户确认，24h 后自动完成。
        """
        if len(external_userids) > 100:
            raise ValueError("每次最多转接 100 个客户")

        body = {
            "handover_userid": handover_userid,
            "takeover_userid": takeover_userid,
            "external_userid": external_userids,
        }
        resp = self.client.post(
            "/externalcontact/resigned/transfer_customer", json=body
        )
        return resp.get("customer", [])

    # ── T4: 查询离职客户接替状态 ──

    def get_resigned_transfer_result(
        self,
        handover_userid: str,
        takeover_userid: str,
    ) -> list[dict]:
        """查询离职客户接替状态（自动分页）。"""
        results = []
        cursor = ""
        while True:
            body = {
                "handover_userid": handover_userid,
                "takeover_userid": takeover_userid,
                "cursor": cursor,
            }
            resp = self.client.post(
                "/externalcontact/resigned/transfer_result", json=body
            )
            results.extend(resp.get("customer", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── T5: 分配在职成员的客户群 ──

    def transfer_groupchat_onjob(
        self,
        chat_id_list: list[str],
        new_owner: str,
    ) -> list[dict]:
        """
        分配在职成员的客户群。每次最多 100 个群。

        Returns:
            list[dict]: failed_chat_list，空列表表示全部成功
        """
        if len(chat_id_list) > 100:
            raise ValueError("每次最多转接 100 个客户群")

        body = {"chat_id_list": chat_id_list, "new_owner": new_owner}
        resp = self.client.post(
            "/externalcontact/groupchat/onjob_transfer", json=body
        )
        return resp.get("failed_chat_list", [])

    # ── T6: 分配离职成员的客户群 ──

    def transfer_groupchat_resigned(
        self,
        chat_id_list: list[str],
        new_owner: str,
    ) -> list[dict]:
        """
        分配离职成员的客户群。群主必须已离职。每次最多 100 个群。
        """
        if len(chat_id_list) > 100:
            raise ValueError("每次最多转接 100 个客户群")

        body = {"chat_id_list": chat_id_list, "new_owner": new_owner}
        resp = self.client.post(
            "/externalcontact/groupchat/transfer", json=body
        )
        return resp.get("failed_chat_list", [])

    # ── 高级工作流 ──

    def batch_transfer_resigned_customers(
        self,
        handover_userid: str,
        takeover_userid: str,
        external_userids: list[str],
        batch_size: int = 100,
    ) -> dict:
        """
        批量分配离职成员的客户（自动分批）。

        Returns:
            {"succeeded": [...], "failed": [{"external_userid": ..., "errcode": ...}]}
        """
        succeeded = []
        failed = []

        for i in range(0, len(external_userids), batch_size):
            batch = external_userids[i : i + batch_size]
            results = self.transfer_resigned_customer(
                handover_userid, takeover_userid, batch
            )
            for r in results:
                if r["errcode"] == 0:
                    succeeded.append(r["external_userid"])
                else:
                    failed.append(r)

        return {"succeeded": succeeded, "failed": failed}

    def poll_transfer_result(
        self,
        handover_userid: str,
        takeover_userid: str,
        resigned: bool = False,
        poll_interval: int = 60,
        max_polls: int = 30,
    ) -> list[dict]:
        """
        轮询接替状态直到全部完成或达到最大轮询次数。

        Args:
            resigned: True=离职继承, False=在职继承
            poll_interval: 轮询间隔秒数
            max_polls: 最大轮询次数

        Note:
            默认参数（60s x 30 = 30分钟）仅适用于演示。生产环境中：
            - 在职继承需客户确认（最长 24h），建议 poll_interval=300, max_polls=288
            - 离职继承 24h 自动完成，建议 poll_interval=600, max_polls=144
            或改用 transfer_fail 回调做异步通知。
        """
        query_fn = (
            self.get_resigned_transfer_result
            if resigned
            else self.get_transfer_result
        )

        for attempt in range(max_polls):
            results = query_fn(handover_userid, takeover_userid)
            pending = [r for r in results if r["status"] == 2]
            if not pending:
                logger.info(
                    "所有客户接替完成 (attempt=%d/%d)", attempt + 1, max_polls
                )
                return results
            logger.info(
                "还有 %d 个客户等待接替 (attempt=%d/%d)",
                len(pending), attempt + 1, max_polls,
            )
            time.sleep(poll_interval)

        logger.warning("达到最大轮询次数 %d，仍有客户未完成接替", max_polls)
        return query_fn(handover_userid, takeover_userid)
```

### 7.2 TypeScript

```typescript
/**
 * WeCom CRM 客户分配与继承管理器
 * 依赖 wecom-core 的 WeComClient
 */

// ── 类型定义 ──

interface TransferCustomerRequest {
  handover_userid: string;
  takeover_userid: string;
  external_userid: string[];
  transfer_success_msg?: string;
}

interface TransferResultRequest {
  handover_userid: string;
  takeover_userid: string;
  cursor?: string;
}

interface GroupChatTransferRequest {
  chat_id_list: string[];
  new_owner: string;
}

interface CustomerTransferResult {
  external_userid: string;
  errcode: number;
}

/** status: 1=完毕 2=等待 3=拒绝 4=上限 5=无记录(仅在职) */
interface TransferStatusResult {
  external_userid: string;
  status: 1 | 2 | 3 | 4 | 5;
  takeover_time: number;
}

interface FailedChat {
  chat_id: string;
  errcode: number;
  errmsg: string;
}

// ── 管理器 ──

class TransferManager {
  constructor(private client: WeComClient) {}

  // T1: 分配在职成员的客户
  async transferCustomer(
    handoverUserid: string,
    takeoverUserid: string,
    externalUserids: string[],
    transferSuccessMsg?: string,
  ): Promise<CustomerTransferResult[]> {
    if (externalUserids.length > 100) {
      throw new Error("每次最多转接 100 个客户");
    }
    const body: TransferCustomerRequest = {
      handover_userid: handoverUserid,
      takeover_userid: takeoverUserid,
      external_userid: externalUserids,
    };
    if (transferSuccessMsg) {
      body.transfer_success_msg = transferSuccessMsg;
    }
    const resp = await this.client.post<{
      customer: CustomerTransferResult[];
    }>("/externalcontact/transfer_customer", body);
    return resp.customer ?? [];
  }

  // T2: 查询在职客户接替状态（自动分页）
  async getTransferResult(
    handoverUserid: string,
    takeoverUserid: string,
  ): Promise<TransferStatusResult[]> {
    const results: TransferStatusResult[] = [];
    let cursor = "";
    do {
      const resp = await this.client.post<{
        customer: TransferStatusResult[];
        next_cursor: string;
      }>("/externalcontact/transfer_result", {
        handover_userid: handoverUserid,
        takeover_userid: takeoverUserid,
        cursor,
      });
      results.push(...(resp.customer ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // T3: 分配离职成员的客户
  async transferResignedCustomer(
    handoverUserid: string,
    takeoverUserid: string,
    externalUserids: string[],
  ): Promise<CustomerTransferResult[]> {
    if (externalUserids.length > 100) {
      throw new Error("每次最多转接 100 个客户");
    }
    const resp = await this.client.post<{
      customer: CustomerTransferResult[];
    }>("/externalcontact/resigned/transfer_customer", {
      handover_userid: handoverUserid,
      takeover_userid: takeoverUserid,
      external_userid: externalUserids,
    });
    return resp.customer ?? [];
  }

  // T4: 查询离职客户接替状态（自动分页）
  async getResignedTransferResult(
    handoverUserid: string,
    takeoverUserid: string,
  ): Promise<TransferStatusResult[]> {
    const results: TransferStatusResult[] = [];
    let cursor = "";
    do {
      const resp = await this.client.post<{
        customer: TransferStatusResult[];
        next_cursor: string;
      }>("/externalcontact/resigned/transfer_result", {
        handover_userid: handoverUserid,
        takeover_userid: takeoverUserid,
        cursor,
      });
      results.push(...(resp.customer ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // T5: 分配在职成员的客户群
  async transferGroupChatOnjob(
    chatIdList: string[],
    newOwner: string,
  ): Promise<FailedChat[]> {
    if (chatIdList.length > 100) {
      throw new Error("每次最多转接 100 个客户群");
    }
    const resp = await this.client.post<{
      failed_chat_list: FailedChat[];
    }>("/externalcontact/groupchat/onjob_transfer", {
      chat_id_list: chatIdList,
      new_owner: newOwner,
    });
    return resp.failed_chat_list ?? [];
  }

  // T6: 分配离职成员的客户群
  async transferGroupChatResigned(
    chatIdList: string[],
    newOwner: string,
  ): Promise<FailedChat[]> {
    if (chatIdList.length > 100) {
      throw new Error("每次最多转接 100 个客户群");
    }
    const resp = await this.client.post<{
      failed_chat_list: FailedChat[];
    }>("/externalcontact/groupchat/transfer", {
      chat_id_list: chatIdList,
      new_owner: newOwner,
    });
    return resp.failed_chat_list ?? [];
  }

  // 批量分配离职客户（自动分批）
  async batchTransferResigned(
    handoverUserid: string,
    takeoverUserid: string,
    externalUserids: string[],
    batchSize = 100,
  ): Promise<{ succeeded: string[]; failed: CustomerTransferResult[] }> {
    const succeeded: string[] = [];
    const failed: CustomerTransferResult[] = [];

    for (let i = 0; i < externalUserids.length; i += batchSize) {
      const batch = externalUserids.slice(i, i + batchSize);
      const results = await this.transferResignedCustomer(
        handoverUserid, takeoverUserid, batch,
      );
      for (const r of results) {
        if (r.errcode === 0) {
          succeeded.push(r.external_userid);
        } else {
          failed.push(r);
        }
      }
    }
    return { succeeded, failed };
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"context"
	"fmt"
)

// ── 请求/响应结构体 ──

type TransferCustomerReq struct {
	HandoverUserid     string   `json:"handover_userid"`
	TakeoverUserid     string   `json:"takeover_userid"`
	ExternalUserid     []string `json:"external_userid"`
	TransferSuccessMsg string   `json:"transfer_success_msg,omitempty"`
}

type TransferCustomerResp struct {
	ErrCode  int                      `json:"errcode"`
	ErrMsg   string                   `json:"errmsg"`
	Customer []CustomerTransferResult `json:"customer"`
}

type CustomerTransferResult struct {
	ExternalUserid string `json:"external_userid"`
	ErrCode        int    `json:"errcode"`
}

type TransferResultReq struct {
	HandoverUserid string `json:"handover_userid"`
	TakeoverUserid string `json:"takeover_userid"`
	Cursor         string `json:"cursor,omitempty"`
}

type TransferResultResp struct {
	ErrCode    int                    `json:"errcode"`
	ErrMsg     string                 `json:"errmsg"`
	Customer   []TransferStatusResult `json:"customer"`
	NextCursor string                 `json:"next_cursor"`
}

// Status: 1=完毕 2=等待 3=拒绝 4=上限 5=无记录(仅在职)
type TransferStatusResult struct {
	ExternalUserid string `json:"external_userid"`
	Status         int    `json:"status"`
	TakeoverTime   int64  `json:"takeover_time"`
}

// ResignedTransferReq 离职继承请求（无 TransferSuccessMsg 字段）
type ResignedTransferReq struct {
	HandoverUserid string   `json:"handover_userid"`
	TakeoverUserid string   `json:"takeover_userid"`
	ExternalUserid []string `json:"external_userid"`
}

type GroupChatTransferReq struct {
	ChatIdList []string `json:"chat_id_list"`
	NewOwner   string   `json:"new_owner"`
}

type GroupChatTransferResp struct {
	ErrCode        int          `json:"errcode"`
	ErrMsg         string       `json:"errmsg"`
	FailedChatList []FailedChat `json:"failed_chat_list"`
}

type FailedChat struct {
	ChatId  string `json:"chat_id"`
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// ── 管理器 ──

type TransferManager struct {
	client *WeComClient
}

func NewTransferManager(client *WeComClient) *TransferManager {
	return &TransferManager{client: client}
}

// T1: 分配在职成员的客户
func (m *TransferManager) TransferCustomer(ctx context.Context, req *TransferCustomerReq) ([]CustomerTransferResult, error) {
	if len(req.ExternalUserid) > 100 {
		return nil, fmt.Errorf("每次最多转接 100 个客户")
	}
	var resp TransferCustomerResp
	if err := m.client.Post(ctx, "/externalcontact/transfer_customer", req, &resp); err != nil {
		return nil, err
	}
	return resp.Customer, nil
}

// T2: 查询在职客户接替状态（自动分页）
func (m *TransferManager) GetTransferResult(ctx context.Context, handoverUserid, takeoverUserid string) ([]TransferStatusResult, error) {
	var all []TransferStatusResult
	cursor := ""
	for {
		var resp TransferResultResp
		req := &TransferResultReq{
			HandoverUserid: handoverUserid,
			TakeoverUserid: takeoverUserid,
			Cursor:         cursor,
		}
		if err := m.client.Post(ctx, "/externalcontact/transfer_result", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.Customer...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// T3: 分配离职成员的客户
func (m *TransferManager) TransferResignedCustomer(ctx context.Context, handoverUserid, takeoverUserid string, externalUserids []string) ([]CustomerTransferResult, error) {
	if len(externalUserids) > 100 {
		return nil, fmt.Errorf("每次最多转接 100 个客户")
	}
	req := &ResignedTransferReq{
		HandoverUserid: handoverUserid,
		TakeoverUserid: takeoverUserid,
		ExternalUserid: externalUserids,
	}
	var resp TransferCustomerResp
	if err := m.client.Post(ctx, "/externalcontact/resigned/transfer_customer", req, &resp); err != nil {
		return nil, err
	}
	return resp.Customer, nil
}

// T4: 查询离职客户接替状态（自动分页）
func (m *TransferManager) GetResignedTransferResult(ctx context.Context, handoverUserid, takeoverUserid string) ([]TransferStatusResult, error) {
	var all []TransferStatusResult
	cursor := ""
	for {
		var resp TransferResultResp
		req := &TransferResultReq{
			HandoverUserid: handoverUserid,
			TakeoverUserid: takeoverUserid,
			Cursor:         cursor,
		}
		if err := m.client.Post(ctx, "/externalcontact/resigned/transfer_result", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.Customer...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// T5: 分配在职成员的客户群
func (m *TransferManager) TransferGroupChatOnjob(ctx context.Context, chatIdList []string, newOwner string) ([]FailedChat, error) {
	if len(chatIdList) > 100 {
		return nil, fmt.Errorf("每次最多转接 100 个客户群")
	}
	var resp GroupChatTransferResp
	req := &GroupChatTransferReq{ChatIdList: chatIdList, NewOwner: newOwner}
	if err := m.client.Post(ctx, "/externalcontact/groupchat/onjob_transfer", req, &resp); err != nil {
		return nil, err
	}
	return resp.FailedChatList, nil
}

// T6: 分配离职成员的客户群
func (m *TransferManager) TransferGroupChatResigned(ctx context.Context, chatIdList []string, newOwner string) ([]FailedChat, error) {
	if len(chatIdList) > 100 {
		return nil, fmt.Errorf("每次最多转接 100 个客户群")
	}
	var resp GroupChatTransferResp
	req := &GroupChatTransferReq{ChatIdList: chatIdList, NewOwner: newOwner}
	if err := m.client.Post(ctx, "/externalcontact/groupchat/transfer", req, &resp); err != nil {
		return nil, err
	}
	return resp.FailedChatList, nil
}

// 批量分配离职客户（自动分批）
func (m *TransferManager) BatchTransferResigned(ctx context.Context, handoverUserid, takeoverUserid string, externalUserids []string, batchSize int) (succeeded []string, failed []CustomerTransferResult, err error) {
	if batchSize <= 0 || batchSize > 100 {
		batchSize = 100
	}
	for i := 0; i < len(externalUserids); i += batchSize {
		end := i + batchSize
		if end > len(externalUserids) {
			end = len(externalUserids)
		}
		batch := externalUserids[i:end]
		results, err := m.TransferResignedCustomer(ctx, handoverUserid, takeoverUserid, batch)
		if err != nil {
			return succeeded, failed, err
		}
		for _, r := range results {
			if r.ErrCode == 0 {
				succeeded = append(succeeded, r.ExternalUserid)
			} else {
				failed = append(failed, r)
			}
		}
	}
	return succeeded, failed, nil
}
```

---


### 7.4 Java 示例

```java
public class WecomCrmTransferService {
    private final WeComClient client;

    public WecomCrmTransferService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-transfer 相关 API
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
class WecomCrmTransferService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-transfer 相关 API
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
"""wecom-crm-transfer 测试模板"""
import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def manager():
    client = MagicMock()
    return TransferManager(client)


class TestTransferCustomer:
    """T1: 分配在职成员的客户"""

    def test_transfer_success(self, manager):
        manager.client.post.return_value = {
            "customer": [
                {"external_userid": "woAAA", "errcode": 0},
                {"external_userid": "woBBB", "errcode": 0},
            ]
        }
        results = manager.transfer_customer("zhangsan", "lisi", ["woAAA", "woBBB"])
        assert len(results) == 2
        assert all(r["errcode"] == 0 for r in results)
        call_body = manager.client.post.call_args[0][1]
        assert call_body["handover_userid"] == "zhangsan"
        assert "transfer_success_msg" not in call_body

    def test_transfer_with_msg(self, manager):
        manager.client.post.return_value = {"customer": [{"external_userid": "woAAA", "errcode": 0}]}
        manager.transfer_customer("zhangsan", "lisi", ["woAAA"], "您好，转接消息")
        call_body = manager.client.post.call_args[0][1]
        assert call_body["transfer_success_msg"] == "您好，转接消息"

    def test_over_100_raises(self, manager):
        with pytest.raises(ValueError, match="100"):
            manager.transfer_customer("zhangsan", "lisi", [f"wo{i}" for i in range(101)])

    def test_partial_failure(self, manager):
        manager.client.post.return_value = {
            "customer": [
                {"external_userid": "woAAA", "errcode": 0},
                {"external_userid": "woBBB", "errcode": 40128},
            ]
        }
        results = manager.transfer_customer("zhangsan", "lisi", ["woAAA", "woBBB"])
        assert results[1]["errcode"] == 40128  # 90天内已转接2次


class TestTransferResult:
    """T2: 查询接替状态"""

    def test_pagination(self, manager):
        manager.client.post.side_effect = [
            {"customer": [{"external_userid": "woA", "status": 1, "takeover_time": 100}], "next_cursor": "c1"},
            {"customer": [{"external_userid": "woB", "status": 2, "takeover_time": 0}], "next_cursor": ""},
        ]
        results = manager.get_transfer_result("zhangsan", "lisi")
        assert len(results) == 2
        assert manager.client.post.call_count == 2

    def test_status_values(self, manager):
        manager.client.post.return_value = {
            "customer": [
                {"external_userid": "wo1", "status": 1, "takeover_time": 100},
                {"external_userid": "wo2", "status": 3, "takeover_time": 0},
            ],
            "next_cursor": "",
        }
        results = manager.get_transfer_result("zhangsan", "lisi")
        assert results[0]["status"] == 1  # 接替完毕
        assert results[1]["status"] == 3  # 客户拒绝


class TestResignedTransfer:
    """T3: 分配离职成员的客户"""

    def test_no_transfer_msg_param(self, manager):
        """离职继承不支持 transfer_success_msg"""
        manager.client.post.return_value = {"customer": [{"external_userid": "woAAA", "errcode": 0}]}
        manager.transfer_resigned_customer("zhangsan", "lisi", ["woAAA"])
        call_body = manager.client.post.call_args[0][1]
        assert "transfer_success_msg" not in call_body

    def test_correct_endpoint(self, manager):
        manager.client.post.return_value = {"customer": []}
        manager.transfer_resigned_customer("zhangsan", "lisi", ["woAAA"])
        call_path = manager.client.post.call_args[0][0]
        assert "/resigned/transfer_customer" in call_path


class TestGroupChatTransfer:
    """T5/T6: 客户群继承"""

    def test_onjob_transfer(self, manager):
        manager.client.post.return_value = {"failed_chat_list": []}
        failed = manager.transfer_groupchat_onjob(["wr001", "wr002"], "lisi")
        assert failed == []
        call_path = manager.client.post.call_args[0][0]
        assert "onjob_transfer" in call_path

    def test_resigned_transfer(self, manager):
        manager.client.post.return_value = {
            "failed_chat_list": [
                {"chat_id": "wr003", "errcode": 90501, "errmsg": "not external group chat"}
            ]
        }
        failed = manager.transfer_groupchat_resigned(["wr003"], "lisi")
        assert len(failed) == 1
        assert failed[0]["errcode"] == 90501

    def test_over_100_groups_raises(self, manager):
        with pytest.raises(ValueError, match="100"):
            manager.transfer_groupchat_onjob([f"wr{i}" for i in range(101)], "lisi")


class TestBatchTransfer:
    """批量分配 + 轮询"""

    def test_batch_split(self, manager):
        """超过 100 个客户自动分批"""
        manager.client.post.return_value = {
            "customer": [{"external_userid": "woX", "errcode": 0}]
        }
        result = manager.batch_transfer_resigned_customers(
            "zhangsan", "lisi", [f"wo{i}" for i in range(150)], batch_size=100
        )
        assert manager.client.post.call_count == 2  # 分两批
```

---

## 9. Code Review 检查清单

| # | 检查项 | 严重度 | 说明 |
|---|--------|--------|------|
| R1 | 在职/离职接口路径是否正确区分 | CRITICAL | `/transfer_customer` vs `/resigned/transfer_customer` |
| R2 | 离职继承是否误传 transfer_success_msg | HIGH | 离职接口不支持此参数 |
| R3 | external_userid 是否超过 100 上限 | HIGH | API 硬限制 |
| R4 | chat_id_list 是否超过 100 上限 | HIGH | API 硬限制 |
| R5 | 是否检查逐客户 errcode（部分失败） | HIGH | 整体返回 0 但单个客户可能失败 |
| R6 | 是否正确处理 status 枚举值 | MEDIUM | 在职多 status=5，离职无 |
| R7 | 是否使用游标分页查询接替状态 | MEDIUM | next_cursor 为空才终止 |
| R8 | 群继承是否区分在职/离职接口 | HIGH | 90500=群主未离职, 90502=群主已离职 |
| R9 | 是否注意 90 天 2 次转接限制 | MEDIUM | 在职客户/群适用，离职不适用 |
| R10 | 是否注意每天 300 群/人限制 | MEDIUM | 超出需次日继续 |
| R11 | 是否监听 transfer_fail 回调 | MEDIUM | 异步失败唯一通知渠道 |
| R12 | FailReason 是否全覆盖处理 | MEDIUM | customer_refused + customer_limit_exceed |
| R13 | 是否使用正确的 access_token | CRITICAL | 必须用客户联系 secret |
| R14 | 离职 handover_userid 是否校验已离职 | HIGH | 否则返回 40097 |

---

## 10. 踩坑指南 (Gotcha Guide)

### G1: 在职继承需要客户确认，不是即时生效

**现象**：调用 T1 后立即查 T2 发现 status=2，以为转接失败
**原因**：在职继承需要客户在 24h 内点击确认，客户可以拒绝
**方案**：轮询 T2 或监听 transfer_fail 回调，不要假设即时完成

### G2: 离职继承 handover_userid 必须已离职

**现象**：对在职成员调用 T3 返回 40097
**原因**：离职继承接口要求 handover_userid 是已离职用户
**方案**：先确认用户离职状态；在职成员间转客户请用 T1

### G3: errcode=0 不代表所有客户都成功

**现象**：整体 errcode=0 但部分客户未被转接
**原因**：T1/T3 返回逐客户 errcode，每个客户独立判断
**方案**：遍历 `customer[]` 逐一检查 errcode，40128=频繁转接, 40099=客户数达上限

### G4: 群转接用错接口 — 90500 vs 90502

**现象**：调用群继承接口返回 90500 或 90502
**原因**：90500=群主未离职（应用 T5 onjob_transfer），90502=群主已离职（应用 T6 groupchat/transfer）
**方案**：先判断群主在职/离职状态，选择正确的接口

### G5: 90 天内转接 2 次限制

**现象**：在职客户转接返回 40128
**原因**：90 自然日内同一客户最多被转接 2 次（在职继承专属限制）
**方案**：记录转接历史，在发起前校验；离职继承不受此限制

### G6: 客户群每天 300 个上限

**现象**：批量转群部分失败
**原因**：同一人的群每天最多分配 300 个给新群主
**方案**：分天执行，超出部分记录待次日继续

### G7: transfer_fail 回调中 UserID 是接替成员

**现象**：收到 transfer_fail 回调，误以为 UserID 是原跟进人
**原因**：XML 中 `<UserID>` 字段是接替成员的 userid，不是 handover_userid
**方案**：正确理解字段语义，UserID=接替成员

### G8: 离职群主离职超 1 年无法继承

**现象**：调用 T6 失败
**原因**：旧群主离职时间超过 1 年，或离职前一年内未登录过企业微信
**方案**：定期（月度）清理离职员工的群，不要积压超过 1 年

### G9: 分配后立即查询返回空结果

**现象**：调用 T3 后立即查 T4 返回空 customer 数组
**原因**：后端异步处理，需等待一定时间
**方案**：首次查询延迟 5-10 秒，后续按间隔轮询

### G10: 接替成员需满足前置条件

**现象**：转接返回 40098 或 84083
**原因**：接替成员未实名认证(40098)或未配置客户联系功能(84083)
**方案**：转接前校验接替成员状态，确保已实名 + 已激活 + 已配置客户联系

---

## 11. 错误码速查

### 客户转接

| 错误码 | 含义 | 排查方向 |
|--------|------|---------|
| 40096 | 不合法的 external_userid | 检查主体来源是否匹配 |
| 40097 | 该成员尚未离职 | 离职接口要求 handover_userid 必须已离职 |
| 40098 | 成员尚未实名认证 | 接替成员需先完成实名 |
| 40099 | 接替成员客户数达上限 | 更换接替成员 |
| 40100 | 外部联系人已在转移流程中 | 等待前次转移完成 |
| 40128 | 客户转接过于频繁 | 90 天内同一客户转接超过 2 次 |
| 84061 | 不是客户联系功能的成员 | 确认成员已配置客户联系 |
| 84062 | external_userid 不是企业联系人 | 确认客户关系存在 |
| 84083 | 需要配置客户联系功能 | 管理后台开启客户联系 |

### 客户群转接

| 错误码 | 含义 | 排查方向 |
|--------|------|---------|
| 90500 | 群主并未离职 | 应使用 T5 onjob_transfer |
| 90501 | 该群不是客户群 | 仅支持客户群（外部群） |
| 90502 | 群主已经离职 | 应使用 T6 groupchat/transfer |
| 90507 | 离职群正在继承处理中 | 不可重复发起 |
| 90508 | 离职群已经继承完成 | 无需重复操作 |

---

## 12. 参考资料

| 资源 | 链接 |
|------|------|
| 分配在职成员的客户 (doc 94096) | https://developer.work.weixin.qq.com/document/path/94096 |
| 查询客户接替状态 (doc 94097) | https://developer.work.weixin.qq.com/document/path/94097 |
| 分配离职成员的客户 (doc 94100) | https://developer.work.weixin.qq.com/document/path/94100 |
| 查询离职客户接替状态 (doc 94101) | https://developer.work.weixin.qq.com/document/path/94101 |
| 分配在职客户群 (doc 93878) | https://developer.work.weixin.qq.com/document/path/93878 |
| 分配离职客户群 (doc 92127) | https://developer.work.weixin.qq.com/document/path/92127 |
| 客户变更回调 (doc 92277) | https://developer.work.weixin.qq.com/document/path/92277 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |


