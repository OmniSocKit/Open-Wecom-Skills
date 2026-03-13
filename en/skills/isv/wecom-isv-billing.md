---
name: wecom-isv-billing
description: |
  企业微信服务商代开发收银台/应用收费 SKILL。覆盖商户号开通流程、定价策略配置、收款订单创建/查询/列表、到期拦截配置，以及支付成功/退款回调处理。
  TRIGGER: 当用户提到收银台、应用收费、收款订单、定价策略、ISV 支付、license/create_order、应用到期拦截、代开发收费 相关开发时触发。
  本 SKILL 聚焦代开发应用的收费与订单管理，凭证体系和基础客户端继承自 wecom-isv-core。
version: 1.0.0
domain: isv-billing
depends_on: wecom-isv-core
doc_ids: [97170, 97171, 97172, 97173, 97174, 97175]
triggers:
  - 收银台
  - 应用收费
  - 收款订单
  - 定价策略
  - ISV 支付
  - ISV billing
  - create_order
  - get_order_info
  - list_order
  - 应用到期拦截
  - 代开发收费
  - 商户号
  - order_pay_success
  - order_refund
  - 续费
  - 退款
  - provider_access_token 收费
  - 代开发应用付费
---

# WeCom ISV · 收银台/应用收费 SKILL (wecom-isv-billing)

> 覆盖企业微信服务商代开发「收银台」全流程：商户号开通、定价策略配置、收款订单创建/查询/列表、到期拦截配置，以及支付成功/退款回调处理。
> 依赖 `wecom-isv-core` SKILL 提供的 WeComISVClient 基础客户端和三级凭证体系。

---

## 1. 前置条件

### 1.1 依赖 SKILL

| SKILL | 用途 |
|-------|------|
| wecom-core | 通用请求规范、回调加解密、错误处理 |
| wecom-isv-core | ISVClient 基础客户端、三级凭证体系、provider_access_token 管理 |

### 1.2 权限与凭证

| 凭证 | 获取方式 | 用途 |
|------|---------|------|
| provider_access_token | 服务商 corpid + provider_secret | 创建订单、查询订单、获取订单列表 |
| suite_access_token | wecom-isv-core 管理 | 部分辅助查询接口 |

> **关键区分**：收银台相关的核心 API（创建订单、查询订单、订单列表）均使用 `provider_access_token`，不是 `suite_access_token`。这是因为收费行为的主体是服务商，而非代开发应用模版。

### 1.3 前置配置

1. **已完成 wecom-isv-core 的全部前置配置**（服务商账号、代开发模版、回调 URL、IP 白名单）
2. **已在服务商管理后台开通商户号**（关联微信支付商户号）
3. **已在服务商管理后台配置定价策略**（按人数/按时长/一次性收费）
4. **已确保企业已授权代开发应用**（拥有有效的 permanent_code）

### 1.4 商户号开通流程（后台操作，非 API）

```
步骤 1: 登录服务商管理后台
    https://open.work.weixin.qq.com → 应用代开发 → 选择代开发模版

步骤 2: 开通收费功能
    模版详情 → 收费管理 → 开通收费
    → 需要服务商企业已完成微信认证

步骤 3: 关联微信支付商户号
    收费管理 → 商户号配置 → 关联已有商户号
    → 或创建新商户号（跳转微信支付商户平台）
    → 商户号需完成微信支付签约

步骤 4: 配置收款账户
    确认收款账户信息（银行卡/对公账户）
    → 资金将结算到此账户
```

> **注意**：商户号开通是纯后台操作，无对应 API。开通过程中需要完成微信支付的签约和审核，通常需要 1-3 个工作日。

---

## 2. 核心概念

### 2.1 收银台概述

```
服务商代开发应用收费架构
├── 服务商侧
│   ├── 商户号管理（关联微信支付商户号）
│   ├── 定价策略配置（后台操作）
│   │   ├── 按人数计费（account_count）
│   │   ├── 按时长计费（account_duration）
│   │   └── 一次性收费
│   └── 订单管理（API 操作）
│       ├── 创建收款订单 → 获取支付链接
│       ├── 查询订单详情 → 确认支付状态
│       └── 获取订单列表 → 批量管理
├── 企业侧
│   ├── 打开应用 → 触发收银台/到期拦截页
│   ├── 管理员通过支付链接完成付款
│   └── 支付成功后应用解锁/续期
└── 回调通知
    ├── order_pay_success → 支付成功
    └── order_refund → 退款通知
```

### 2.2 核心流程

```
服务商配置定价策略（后台）
    → 开通商户号（后台）
    → 企业打开应用
    → 服务商创建收款订单（API）
    → 获取 order_url（支付链接）
    → 企业管理员打开 order_url 完成支付
    → 企业微信推送 order_pay_success 回调
    → 服务商确认订单状态、激活服务
```

### 2.3 定价模式

| 模式 | 参数 | 说明 |
|------|------|------|
| 按人数计费 | account_count | 购买 N 个账号许可，适合 SaaS 类应用 |
| 按时长计费 | account_duration | 购买 N 天/月/年的使用时长 |
| 一次性收费 | — | 一次付费永久使用（需后台配置固定价格） |
| 试用期 | — | 后台配置试用天数，到期后触发收银台 |

> **定价策略完全在后台配置**，API 创建订单时只需传 `account_count` 和/或 `account_duration`，服务端根据后台策略自动计算金额。

### 2.4 订单状态

| 值 | 状态 | 含义 | 后续操作 |
|----|------|------|---------|
| 0 | 待支付 | 订单已创建，等待企业支付 | 引导企业打开 order_url |
| 1 | 已支付 | 企业已完成支付 | 激活服务/增加账号 |
| 2 | 已取消 | 订单被手动取消 | 可重新创建订单 |
| 3 | 已过期 | 订单超时未支付（通常 24 小时） | 重新创建订单 |
| 4 | 已退款 | 订单已退款 | 回收服务/减少账号 |

### 2.5 凭证使用说明

```
provider_access_token（服务商凭证）
├── 创建收款订单 /license/create_order
├── 查询订单详情 /license/get_order_info
└── 获取订单列表 /license/list_order

获取方式:
    POST /service/get_provider_token
    Body: { corpid: 服务商corpid, provider_secret: 服务商密钥 }
    → 有效期 7200 秒，必须缓存
```

> **严禁混用凭证**：收银台 API 使用 `provider_access_token`，不是 `suite_access_token` 也不是企业的 `access_token`。三种凭证的主体不同（服务商 vs 代开发模版 vs 授权企业），混用会返回 `40001` 或 `40014`。

---

## 3. API 速查表

| 编号 | 名称 | 方法 | 路径 | 凭证 | 说明 |
|------|------|------|------|------|------|
| B1 | 创建收款订单 | POST | `/license/create_order` | provider_access_token | 创建订单，返回支付链接 |
| B2 | 获取订单详情 | POST | `/license/get_order_info` | provider_access_token | 查询单个订单状态和详情 |
| B3 | 获取订单列表 | POST | `/license/list_order` | provider_access_token | 按企业/时间范围查询订单 |

---

## 4. API 详情

### 4.1 B1 — 创建收款订单

`POST /cgi-bin/license/create_order?provider_access_token=PROVIDER_ACCESS_TOKEN`

**请求参数** (JSON Body):

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| corpid | string | 是 | 授权企业的 corpid |
| buyer_userid | string | 是 | 企业中下单人的 userid（通常为管理员） |
| account_count | int | 否 | 购买的账号数量（按人数计费时必填） |
| account_duration | int | 否 | 购买的时长（秒）（按时长计费时必填） |
| order_from | int | 否 | 订单来源：0=服务商后台创建(默认), 1=应用内创建 |

**请求示例:**

```json
{
  "corpid": "wwXXXXXXXXXXXXXXXX",
  "buyer_userid": "admin001",
  "account_count": 50,
  "account_duration": 31536000
}
```

**响应:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "order_id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "order_url": "https://open.work.weixin.qq.com/payOrder?order_id=XXXXX"
}
```

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| order_id | string | 订单 ID，全局唯一 |
| order_url | string | 支付页面链接，引导企业管理员打开完成支付 |

**关键规则:**
1. `corpid` 必须是已授权代开发应用的企业
2. `buyer_userid` 必须是该企业的管理员或有支付权限的成员
3. `account_count` 和 `account_duration` 根据后台定价策略决定是否必填
4. `order_url` 有有效期（通常 24 小时），过期后需重新创建订单
5. 同一企业未支付的订单可能会限制新订单创建（避免重复下单）
6. 创建订单不代表扣款，企业需打开 `order_url` 完成支付

---

### 4.2 B2 — 获取订单详情

`POST /cgi-bin/license/get_order_info?provider_access_token=PROVIDER_ACCESS_TOKEN`

**请求参数** (JSON Body):

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| order_id | string | 是 | 订单 ID |

**请求示例:**

```json
{
  "order_id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

**响应:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "order": {
    "order_id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "order_status": 1,
    "order_type": 0,
    "corpid": "wwXXXXXXXXXXXXXXXX",
    "price": 9900,
    "account_count": 50,
    "account_duration": 31536000,
    "create_time": 1640000000,
    "pay_time": 1640001000
  }
}
```

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| order.order_id | string | 订单 ID |
| order.order_status | int | 订单状态（见 2.4 状态表） |
| order.order_type | int | 订单类型：0=新购, 1=续费, 2=扩容 |
| order.corpid | string | 下单企业的 corpid |
| order.price | int | 订单金额（单位：分） |
| order.account_count | int | 购买的账号数量 |
| order.account_duration | int | 购买的时长（秒） |
| order.create_time | int | 订单创建时间（Unix 秒） |
| order.pay_time | int | 支付完成时间（Unix 秒），未支付时为 0 |

**关键规则:**
1. `price` 单位为**分**（人民币），9900 = 99.00 元
2. 支付前 `pay_time` 为 0，支付后才有值
3. 订单状态变更不会主动通知此接口，需配合回调使用
4. 查询不存在的 order_id 返回 errcode 非 0

---

### 4.3 B3 — 获取订单列表

`POST /cgi-bin/license/list_order?provider_access_token=PROVIDER_ACCESS_TOKEN`

**请求参数** (JSON Body):

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| corpid | string | 否 | 按企业筛选（不传则查询所有企业） |
| start_time | int | 否 | 起始时间（Unix 秒） |
| end_time | int | 否 | 结束时间（Unix 秒） |
| cursor | string | 否 | 分页游标，首次不填 |
| limit | int | 否 | 每页数量，默认 100，最大 1000 |

**请求示例:**

```json
{
  "corpid": "wwXXXXXXXXXXXXXXXX",
  "start_time": 1640000000,
  "end_time": 1640100000,
  "cursor": "",
  "limit": 100
}
```

**响应:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "order_list": [
    {
      "order_id": "ORDER_ID_1",
      "order_status": 1,
      "order_type": 0,
      "corpid": "wwXXXXXXXXXXXXXXXX",
      "price": 9900,
      "account_count": 50,
      "account_duration": 31536000,
      "create_time": 1640000000,
      "pay_time": 1640001000
    }
  ],
  "next_cursor": "NEXT_CURSOR_VALUE",
  "has_more": 0
}
```

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| order_list | object[] | 订单列表（每个元素结构同 B2 的 order） |
| next_cursor | string | 分页游标，has_more=1 时使用 |
| has_more | int | 是否还有更多数据：0=否, 1=是 |

**关键规则:**
1. `start_time` 和 `end_time` 是基于**订单创建时间**筛选，非支付时间
2. 不传 `corpid` 时查询服务商下所有企业的订单
3. 使用 `cursor` + `limit` 分页，`has_more=1` 时需继续翻页
4. 返回按创建时间倒序排列（最新的在前）

---

## 5. 回调事件

### 5.1 回调概述

收银台相关回调推送到**代开发模版回调 URL**（与 suite_ticket、授权事件同一通道）。

| InfoType | 名称 | 触发时机 |
|----------|------|---------|
| order_pay_success | 收款订单支付成功 | 企业完成支付后 |
| order_refund | 收款订单退款 | 退款操作完成后 |

> **通用规则**: 回调需在 5 秒内响应 `"success"`，否则企业微信会断连并重试（共 3 次）。建议立即应答，异步处理业务逻辑。

### 5.2 order_pay_success — 支付成功通知

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[order_pay_success]]></InfoType>
  <TimeStamp>1640001000</TimeStamp>
  <OrderId><![CDATA[XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX]]></OrderId>
  <BuyerCorpId><![CDATA[wwXXXXXXXXXXXXXXXX]]></BuyerCorpId>
</xml>
```

| 字段 | 说明 |
|------|------|
| SuiteId | 代开发应用模版 ID |
| InfoType | 固定为 `order_pay_success` |
| TimeStamp | 事件时间戳（Unix 秒） |
| OrderId | 已支付的订单 ID |
| BuyerCorpId | 购买企业的 corpid |

**处理流程:**
1. 立即响应 `"success"`
2. 使用 `OrderId` 调用 `B2(get_order_info)` 获取订单详情
3. 确认 `order_status == 1`（已支付）
4. 根据 `account_count` / `account_duration` 为企业激活服务
5. 更新数据库中企业的服务状态（有效期、账号数等）
6. 可选：向企业管理员发送支付成功通知消息

> **重要**：回调是支付成功的可靠通知渠道。不要轮询 `get_order_info` 来检测支付状态，这既低效又违反频率限制。

### 5.3 order_refund — 退款通知

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[order_refund]]></InfoType>
  <TimeStamp>1640100000</TimeStamp>
  <OrderId><![CDATA[XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX]]></OrderId>
  <BuyerCorpId><![CDATA[wwXXXXXXXXXXXXXXXX]]></BuyerCorpId>
</xml>
```

| 字段 | 说明 |
|------|------|
| SuiteId | 代开发应用模版 ID |
| InfoType | 固定为 `order_refund` |
| TimeStamp | 退款事件时间戳 |
| OrderId | 被退款的订单 ID |
| BuyerCorpId | 退款企业的 corpid |

**处理流程:**
1. 立即响应 `"success"`
2. 使用 `OrderId` 调用 `B2(get_order_info)` 确认订单状态为 4（已退款）
3. 回收企业对应的服务权益（减少账号数/缩短有效期）
4. 更新数据库中企业的服务状态
5. 记录退款日志（金额、时间、原因）

> **退款操作本身在微信支付商户后台完成**，不是通过企业微信 API。退款完成后企业微信推送此回调。

---

## 6. 典型工作流

### 6.1 首次收费流程

```
步骤 1: 配置定价策略（后台，一次性操作）
    服务商管理后台 → 代开发模版 → 收费管理
    → 设置定价模式（按人数/按时长/一次性）
    → 设置单价和试用期

步骤 2: 开通商户号（后台，一次性操作）
    收费管理 → 商户号配置
    → 关联微信支付商户号
    → 完成签约和审核

步骤 3: 创建收款订单（API）
    POST /license/create_order?provider_access_token=TOKEN
    Body: {
        corpid: "授权企业corpid",
        buyer_userid: "企业管理员userid",
        account_count: 50,
        account_duration: 31536000
    }
    → 获取 order_id 和 order_url

步骤 4: 引导企业支付
    → 将 order_url 通过应用消息/H5 页面展示给企业管理员
    → 管理员打开 order_url 完成微信支付

步骤 5: 接收支付回调
    模版回调 URL 收到 order_pay_success
    → 调用 get_order_info 确认支付
    → 激活企业服务

步骤 6: 确认服务激活
    → 更新企业服务状态
    → 记录订单信息
    → 通知企业管理员
```

### 6.2 续费流程

```
步骤 1: 检测服务即将到期
    定时任务检查企业服务有效期
    → 到期前 30/15/7/3/1 天发送续费提醒

步骤 2: 创建续费订单
    POST /license/create_order
    Body: {
        corpid: "企业corpid",
        buyer_userid: "管理员userid",
        account_duration: 31536000  // 续费一年
    }
    → 获取新的 order_url

步骤 3: 发送续费引导
    → 通过应用消息向管理员推送续费链接
    → 或在应用内展示续费入口

步骤 4: 等待支付 + 回调确认
    → order_pay_success 回调
    → 延长服务有效期
```

### 6.3 到期拦截与续费引导

```
步骤 1: 配置到期拦截（后台操作）
    服务商管理后台 → 代开发模版 → 收费管理 → 到期配置
    → 设置到期后拦截策略：
      ├── 完全拦截：到期后无法使用应用
      ├── 提醒式拦截：弹出续费提醒但可继续使用
      └── 自定义拦截页：跳转到服务商指定的续费页面

步骤 2: 企业服务到期
    → 企业成员打开应用
    → 企业微信自动展示拦截页/续费提醒

步骤 3: 服务商侧处理
    → 检测到企业到期，自动创建续费订单
    → 将 order_url 嵌入拦截页或续费提醒消息
    → 企业管理员完成续费

步骤 4: 续费成功
    → order_pay_success 回调
    → 解除到期拦截
    → 恢复服务
```

### 6.4 退款处理流程

```
步骤 1: 服务商在微信支付商户后台发起退款
    微信支付商户平台 → 交易中心 → 退款
    → 选择对应订单
    → 输入退款金额（支持部分退款）

步骤 2: 退款处理
    → 微信支付完成退款操作
    → 企业微信推送 order_refund 回调到模版回调 URL

步骤 3: 服务商处理退款回调
    → 调用 get_order_info 确认退款状态
    → 回收企业对应的服务权益
    → 更新服务状态

步骤 4: 善后处理
    → 记录退款日志
    → 通知运营团队
    → 可选：向企业发送退款确认通知
```

---

## 7. 代码模板

### 7.1 Python

```python
"""企业微信服务商代开发收银台/收费管理模块"""
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class ISVBillingManager:
    """收银台管理器，处理订单创建/查询和回调

    依赖 wecom-isv-core 的 WeComISVClient 提供 provider_access_token 管理。
    收银台 API 使用 provider_access_token 凭证。
    """

    def __init__(self, client):
        """初始化收银台管理器

        Args:
            client: WeComISVClient 实例（来自 wecom-isv-core）
        """
        self.client = client

    # ─── B1: 创建收款订单 ───

    def create_order(
        self,
        corpid: str,
        buyer_userid: str,
        *,
        account_count: Optional[int] = None,
        account_duration: Optional[int] = None,
        order_from: int = 0,
    ) -> dict:
        """创建收款订单

        Args:
            corpid: 授权企业的 corpid
            buyer_userid: 企业中下单人的 userid（管理员）
            account_count: 购买的账号数量（按人数计费时必填）
            account_duration: 购买的时长（秒）（按时长计费时必填）
            order_from: 订单来源，0=服务商后台(默认), 1=应用内

        Returns:
            {"order_id": "xxx", "order_url": "https://..."}

        Raises:
            WeComISVError: 创建失败时抛出
        """
        body: dict = {
            "corpid": corpid,
            "buyer_userid": buyer_userid,
        }
        if account_count is not None:
            body["account_count"] = account_count
        if account_duration is not None:
            body["account_duration"] = account_duration
        if order_from != 0:
            body["order_from"] = order_from

        resp = self.client._make_provider_request(
            "POST", "/license/create_order", json=body
        )
        logger.info(
            "收款订单已创建: order_id=%s, corpid=%s",
            resp.get("order_id"), corpid,
        )
        return {
            "order_id": resp["order_id"],
            "order_url": resp["order_url"],
        }

    # ─── B2: 获取订单详情 ───

    def get_order_info(self, order_id: str) -> dict:
        """获取收款订单详情

        Args:
            order_id: 订单 ID

        Returns:
            订单详情，包含 order_id, order_status, price, create_time 等
        """
        resp = self.client._make_provider_request(
            "POST", "/license/get_order_info", json={"order_id": order_id}
        )
        return resp.get("order", resp)

    # ─── B3: 获取订单列表 ───

    def list_orders(
        self,
        *,
        corpid: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        cursor: str = "",
        limit: int = 100,
    ) -> dict:
        """获取收款订单列表

        Args:
            corpid: 按企业筛选（不传查所有企业）
            start_time: 起始时间（Unix 秒）
            end_time: 结束时间（Unix 秒）
            cursor: 分页游标
            limit: 每页数量，默认 100，最大 1000

        Returns:
            {"order_list": [...], "next_cursor": "xxx", "has_more": 0}
        """
        body: dict = {"limit": min(limit, 1000)}
        if corpid:
            body["corpid"] = corpid
        if start_time is not None:
            body["start_time"] = start_time
        if end_time is not None:
            body["end_time"] = end_time
        if cursor:
            body["cursor"] = cursor

        return self.client._make_provider_request(
            "POST", "/license/list_order", json=body
        )

    # ─── 全量获取订单列表（自动分页）───

    def list_all_orders(
        self,
        *,
        corpid: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
    ) -> list[dict]:
        """全量获取订单列表（自动处理分页）

        Args:
            corpid: 按企业筛选
            start_time: 起始时间
            end_time: 结束时间

        Returns:
            所有订单的列表
        """
        all_orders = []
        cursor = ""
        while True:
            resp = self.list_orders(
                corpid=corpid,
                start_time=start_time,
                end_time=end_time,
                cursor=cursor,
                limit=1000,
            )
            all_orders.extend(resp.get("order_list", []))
            if resp.get("has_more", 0) == 0:
                break
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return all_orders

    # ─── 回调处理 ───

    def handle_billing_callback(self, info_type: str, data: dict) -> Optional[dict]:
        """统一处理收银台回调事件

        Args:
            info_type: 回调类型（order_pay_success / order_refund）
            data: 解密后的回调数据（XML 解析结果）

        Returns:
            order_pay_success → 订单详情
            order_refund → 订单详情
        """
        order_id = data.get("OrderId", "")
        buyer_corpid = data.get("BuyerCorpId", "")

        if info_type == "order_pay_success":
            logger.info(
                "收到支付成功回调: order_id=%s, corpid=%s",
                order_id, buyer_corpid,
            )
            # 查询订单详情确认支付状态
            order = self.get_order_info(order_id)
            if order.get("order_status") != 1:
                logger.warning(
                    "订单状态异常: order_id=%s, status=%s",
                    order_id, order.get("order_status"),
                )
            # TODO: 业务层激活服务
            self._activate_service(buyer_corpid, order)
            return order

        elif info_type == "order_refund":
            logger.info(
                "收到退款回调: order_id=%s, corpid=%s",
                order_id, buyer_corpid,
            )
            # 查询订单详情确认退款状态
            order = self.get_order_info(order_id)
            # TODO: 业务层回收服务
            self._deactivate_service(buyer_corpid, order)
            return order

        else:
            logger.warning("未知的收银台回调类型: %s", info_type)
            return None

    def _activate_service(self, corpid: str, order: dict):
        """激活企业服务（需业务层实现）

        示例实现:
            account_count = order.get("account_count", 0)
            account_duration = order.get("account_duration", 0)
            db.execute(
                "UPDATE corp_service SET status='active', "
                "account_count=account_count+?, expire_time=expire_time+? "
                "WHERE corpid=?",
                account_count, account_duration, corpid,
            )
        """
        logger.info("激活企业服务: corpid=%s, order_id=%s", corpid, order.get("order_id"))

    def _deactivate_service(self, corpid: str, order: dict):
        """回收企业服务（需业务层实现）

        示例实现:
            db.execute(
                "UPDATE corp_service SET status='refunded' WHERE corpid=? AND order_id=?",
                corpid, order.get("order_id"),
            )
        """
        logger.info("回收企业服务: corpid=%s, order_id=%s", corpid, order.get("order_id"))

    # ─── 便捷方法 ───

    def create_and_notify(
        self,
        corpid: str,
        buyer_userid: str,
        *,
        account_count: Optional[int] = None,
        account_duration: Optional[int] = None,
    ) -> dict:
        """创建订单并返回支付信息（便捷方法）

        创建订单后返回结构化的支付引导信息，可直接用于前端展示。

        Returns:
            {
                "order_id": "xxx",
                "order_url": "https://...",
                "corpid": "xxx",
                "message": "请引导企业管理员打开链接完成支付"
            }
        """
        result = self.create_order(
            corpid,
            buyer_userid,
            account_count=account_count,
            account_duration=account_duration,
            order_from=1,
        )
        return {
            **result,
            "corpid": corpid,
            "message": "请引导企业管理员打开链接完成支付",
        }

    def check_order_paid(self, order_id: str) -> bool:
        """检查订单是否已支付

        注意：此方法仅用于主动确认，正常流程应依赖回调通知。
        """
        order = self.get_order_info(order_id)
        return order.get("order_status") == 1
```

**ISVClient 扩展方法（在 wecom-isv-core 的 WeComISVClient 基础上）:**

```python
# 在 WeComISVClient 中添加以下方法，用于 provider_access_token 级别的请求

def _make_provider_request(self, method: str, path: str, **kwargs) -> dict:
    """使用 provider_access_token 调用服务商级 API

    与 request() 和 _make_suite_request() 不同，此方法用于需要
    provider_access_token 的 API（收银台、接口调用许可等）
    """
    import requests as req_lib

    url = f"{self.BASE_URL}{path}"
    params = kwargs.pop("params", {})
    params["provider_access_token"] = self.provider_access_token
    resp = req_lib.request(
        method, url, params=params, timeout=10, **kwargs
    ).json()
    if resp.get("errcode", 0) != 0:
        raise WeComISVError(resp.get("errcode", -1), resp.get("errmsg", "unknown"))
    return resp
```

### 7.2 TypeScript

```typescript
/** 企业微信服务商代开发收银台/收费管理模块 */
import { WeComISVClient, WeComISVError } from './wecom-isv-client'; // 继承自 wecom-isv-core

/** 收款订单信息 */
interface BillingOrder {
  order_id: string;
  order_status: OrderStatus;
  order_type: OrderType;
  corpid: string;
  price: number;            // 金额（单位：分）
  account_count: number;
  account_duration: number; // 时长（秒）
  create_time: number;      // Unix 秒
  pay_time: number;         // Unix 秒，未支付为 0
}

/** 订单状态 */
enum OrderStatus {
  Pending = 0,    // 待支付
  Paid = 1,       // 已支付
  Cancelled = 2,  // 已取消
  Expired = 3,    // 已过期
  Refunded = 4,   // 已退款
}

/** 订单类型 */
enum OrderType {
  New = 0,       // 新购
  Renew = 1,     // 续费
  Expand = 2,    // 扩容
}

/** 创建订单参数 */
interface CreateOrderParams {
  corpid: string;
  buyer_userid: string;
  account_count?: number;
  account_duration?: number;
  order_from?: number;
}

/** 创建订单结果 */
interface CreateOrderResult {
  order_id: string;
  order_url: string;
}

/** 订单列表查询参数 */
interface ListOrderParams {
  corpid?: string;
  start_time?: number;
  end_time?: number;
  cursor?: string;
  limit?: number;
}

/** 订单列表结果 */
interface ListOrderResult {
  order_list: BillingOrder[];
  next_cursor: string;
  has_more: number;
}

export class ISVBillingManager {
  constructor(private client: WeComISVClient) {}

  /** B1: 创建收款订单 */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const body: Record<string, unknown> = {
      corpid: params.corpid,
      buyer_userid: params.buyer_userid,
    };
    if (params.account_count !== undefined) {
      body.account_count = params.account_count;
    }
    if (params.account_duration !== undefined) {
      body.account_duration = params.account_duration;
    }
    if (params.order_from !== undefined && params.order_from !== 0) {
      body.order_from = params.order_from;
    }

    const resp = await this.client.makeProviderRequest<CreateOrderResult>(
      'POST', '/license/create_order', body,
    );
    return {
      order_id: resp.order_id,
      order_url: resp.order_url,
    };
  }

  /** B2: 获取订单详情 */
  async getOrderInfo(orderId: string): Promise<BillingOrder> {
    const resp = await this.client.makeProviderRequest<{ order: BillingOrder }>(
      'POST', '/license/get_order_info', { order_id: orderId },
    );
    return resp.order;
  }

  /** B3: 获取订单列表 */
  async listOrders(params: ListOrderParams = {}): Promise<ListOrderResult> {
    const body: Record<string, unknown> = {
      limit: Math.min(params.limit ?? 100, 1000),
    };
    if (params.corpid) body.corpid = params.corpid;
    if (params.start_time !== undefined) body.start_time = params.start_time;
    if (params.end_time !== undefined) body.end_time = params.end_time;
    if (params.cursor) body.cursor = params.cursor;

    return this.client.makeProviderRequest<ListOrderResult>(
      'POST', '/license/list_order', body,
    );
  }

  /** 全量获取订单列表（自动分页） */
  async listAllOrders(params: Omit<ListOrderParams, 'cursor' | 'limit'> = {}): Promise<BillingOrder[]> {
    const allOrders: BillingOrder[] = [];
    let cursor = '';

    do {
      const resp = await this.listOrders({
        ...params,
        cursor,
        limit: 1000,
      });
      allOrders.push(...(resp.order_list ?? []));
      if (resp.has_more === 0) break;
      cursor = resp.next_cursor ?? '';
    } while (cursor);

    return allOrders;
  }

  /** 处理支付成功回调 */
  async handlePaySuccess(orderId: string, buyerCorpId: string): Promise<BillingOrder> {
    const order = await this.getOrderInfo(orderId);
    if (order.order_status !== OrderStatus.Paid) {
      console.warn(`订单状态异常: order_id=${orderId}, status=${order.order_status}`);
    }
    // TODO: 业务层激活服务
    return order;
  }

  /** 处理退款回调 */
  async handleRefund(orderId: string, buyerCorpId: string): Promise<BillingOrder> {
    const order = await this.getOrderInfo(orderId);
    // TODO: 业务层回收服务
    return order;
  }

  /** 统一回调处理入口 */
  async handleBillingCallback(
    infoType: string,
    data: Record<string, string>,
  ): Promise<BillingOrder | null> {
    const orderId = data.OrderId ?? '';
    const buyerCorpId = data.BuyerCorpId ?? '';

    switch (infoType) {
      case 'order_pay_success':
        return this.handlePaySuccess(orderId, buyerCorpId);
      case 'order_refund':
        return this.handleRefund(orderId, buyerCorpId);
      default:
        console.warn(`未知的收银台回调类型: ${infoType}`);
        return null;
    }
  }

  /** 创建订单并返回支付引导信息 */
  async createAndNotify(params: Omit<CreateOrderParams, 'order_from'>): Promise<
    CreateOrderResult & { corpid: string; message: string }
  > {
    const result = await this.createOrder({ ...params, order_from: 1 });
    return {
      ...result,
      corpid: params.corpid,
      message: '请引导企业管理员打开链接完成支付',
    };
  }

  /** 检查订单是否已支付 */
  async checkOrderPaid(orderId: string): Promise<boolean> {
    const order = await this.getOrderInfo(orderId);
    return order.order_status === OrderStatus.Paid;
  }
}
```

**ISVClient 扩展方法（在 wecom-isv-core 的 WeComISVClient 基础上）:**

```typescript
// 在 WeComISVClient 中添加以下方法

/** 使用 provider_access_token 调用服务商级 API */
async makeProviderRequest<T = Record<string, unknown>>(
  method: 'GET' | 'POST',
  path: string,
  body?: object,
): Promise<T> {
  const providerToken = await this.getProviderAccessToken();
  const config = {
    method,
    url: path,
    params: { provider_access_token: providerToken },
    ...(body ? { data: body } : {}),
  };
  const { data } = await this.http.request<T & { errcode?: number; errmsg?: string }>(config);
  const errcode = data.errcode ?? 0;
  if (errcode !== 0) {
    throw new WeComISVError(errcode, data.errmsg ?? '');
  }
  return data;
}
```

### 7.3 Go

```go
package wecom

import (
	"context"
	"fmt"
	"log"
)

// ISVBillingManager 收银台管理器
type ISVBillingManager struct {
	client *ISVClient // 继承自 wecom-isv-core
}

// NewISVBillingManager 创建收银台管理器
func NewISVBillingManager(client *ISVClient) *ISVBillingManager {
	return &ISVBillingManager{client: client}
}

// ──────────────────── 请求/响应结构体 ────────────────────

// CreateOrderReq 创建收款订单请求
type CreateOrderReq struct {
	CorpID          string `json:"corpid"`
	BuyerUserID     string `json:"buyer_userid"`
	AccountCount    int    `json:"account_count,omitempty"`
	AccountDuration int    `json:"account_duration,omitempty"`
	OrderFrom       int    `json:"order_from,omitempty"`
}

// CreateOrderResp 创建收款订单响应
type CreateOrderResp struct {
	BaseResp
	OrderID  string `json:"order_id"`
	OrderURL string `json:"order_url"`
}

// BillingOrder 收款订单详情
type BillingOrder struct {
	OrderID         string `json:"order_id"`
	OrderStatus     int    `json:"order_status"`      // 0=待支付 1=已支付 2=已取消 3=已过期 4=已退款
	OrderType       int    `json:"order_type"`         // 0=新购 1=续费 2=扩容
	CorpID          string `json:"corpid"`
	Price           int    `json:"price"`              // 金额（单位：分）
	AccountCount    int    `json:"account_count"`
	AccountDuration int    `json:"account_duration"`   // 时长（秒）
	CreateTime      int64  `json:"create_time"`
	PayTime         int64  `json:"pay_time"`
}

// GetOrderInfoReq 获取订单详情请求
type GetOrderInfoReq struct {
	OrderID string `json:"order_id"`
}

// GetOrderInfoResp 获取订单详情响应
type GetOrderInfoResp struct {
	BaseResp
	Order BillingOrder `json:"order"`
}

// ListOrderReq 获取订单列表请求
type ListOrderReq struct {
	CorpID    string `json:"corpid,omitempty"`
	StartTime int64  `json:"start_time,omitempty"`
	EndTime   int64  `json:"end_time,omitempty"`
	Cursor    string `json:"cursor,omitempty"`
	Limit     int    `json:"limit,omitempty"`
}

// ListOrderResp 获取订单列表响应
type ListOrderResp struct {
	BaseResp
	OrderList  []BillingOrder `json:"order_list"`
	NextCursor string         `json:"next_cursor"`
	HasMore    int            `json:"has_more"`
}

// ──────────────────── 核心方法 ────────────────────

// CreateOrder B1: 创建收款订单
func (m *ISVBillingManager) CreateOrder(ctx context.Context, req *CreateOrderReq) (*CreateOrderResp, error) {
	var resp CreateOrderResp
	if err := m.client.ProviderPost(ctx, "/license/create_order", req, &resp); err != nil {
		return nil, fmt.Errorf("创建收款订单失败: %w", err)
	}
	log.Printf("收款订单已创建: order_id=%s, corpid=%s", resp.OrderID, req.CorpID)
	return &resp, nil
}

// GetOrderInfo B2: 获取订单详情
func (m *ISVBillingManager) GetOrderInfo(ctx context.Context, orderID string) (*BillingOrder, error) {
	req := &GetOrderInfoReq{OrderID: orderID}
	var resp GetOrderInfoResp
	if err := m.client.ProviderPost(ctx, "/license/get_order_info", req, &resp); err != nil {
		return nil, fmt.Errorf("获取订单详情失败: %w", err)
	}
	return &resp.Order, nil
}

// ListOrders B3: 获取订单列表
func (m *ISVBillingManager) ListOrders(ctx context.Context, req *ListOrderReq) (*ListOrderResp, error) {
	if req.Limit <= 0 {
		req.Limit = 100
	}
	if req.Limit > 1000 {
		req.Limit = 1000
	}
	var resp ListOrderResp
	if err := m.client.ProviderPost(ctx, "/license/list_order", req, &resp); err != nil {
		return nil, fmt.Errorf("获取订单列表失败: %w", err)
	}
	return &resp, nil
}

// ListAllOrders 全量获取订单列表（自动分页）
func (m *ISVBillingManager) ListAllOrders(ctx context.Context, corpID string, startTime, endTime int64) ([]BillingOrder, error) {
	var allOrders []BillingOrder
	cursor := ""

	for {
		req := &ListOrderReq{
			CorpID:    corpID,
			StartTime: startTime,
			EndTime:   endTime,
			Cursor:    cursor,
			Limit:     1000,
		}
		resp, err := m.ListOrders(ctx, req)
		if err != nil {
			return nil, err
		}
		allOrders = append(allOrders, resp.OrderList...)
		if resp.HasMore == 0 {
			break
		}
		cursor = resp.NextCursor
		if cursor == "" {
			break
		}
	}
	return allOrders, nil
}

// ──────────────────── 回调处理 ────────────────────

// BillingCallbackData 收银台回调数据
type BillingCallbackData struct {
	SuiteID     string `xml:"SuiteId"`
	InfoType    string `xml:"InfoType"`
	TimeStamp   int64  `xml:"TimeStamp"`
	OrderID     string `xml:"OrderId"`
	BuyerCorpID string `xml:"BuyerCorpId"`
}

// HandleBillingCallback 统一处理收银台回调
func (m *ISVBillingManager) HandleBillingCallback(ctx context.Context, data *BillingCallbackData) (*BillingOrder, error) {
	switch data.InfoType {
	case "order_pay_success":
		return m.handlePaySuccess(ctx, data)
	case "order_refund":
		return m.handleRefund(ctx, data)
	default:
		log.Printf("未知的收银台回调类型: %s", data.InfoType)
		return nil, fmt.Errorf("未知的回调类型: %s", data.InfoType)
	}
}

func (m *ISVBillingManager) handlePaySuccess(ctx context.Context, data *BillingCallbackData) (*BillingOrder, error) {
	log.Printf("收到支付成功回调: order_id=%s, corpid=%s", data.OrderID, data.BuyerCorpID)

	order, err := m.GetOrderInfo(ctx, data.OrderID)
	if err != nil {
		return nil, fmt.Errorf("查询订单详情失败: %w", err)
	}
	if order.OrderStatus != 1 {
		log.Printf("订单状态异常: order_id=%s, status=%d", data.OrderID, order.OrderStatus)
	}
	// TODO: 业务层激活服务
	return order, nil
}

func (m *ISVBillingManager) handleRefund(ctx context.Context, data *BillingCallbackData) (*BillingOrder, error) {
	log.Printf("收到退款回调: order_id=%s, corpid=%s", data.OrderID, data.BuyerCorpID)

	order, err := m.GetOrderInfo(ctx, data.OrderID)
	if err != nil {
		return nil, fmt.Errorf("查询订单详情失败: %w", err)
	}
	// TODO: 业务层回收服务
	return order, nil
}

// CheckOrderPaid 检查订单是否已支付
func (m *ISVBillingManager) CheckOrderPaid(ctx context.Context, orderID string) (bool, error) {
	order, err := m.GetOrderInfo(ctx, orderID)
	if err != nil {
		return false, err
	}
	return order.OrderStatus == 1, nil
}
```

**ISVClient 扩展方法（在 wecom-isv-core 的 ISVClient 基础上）:**

```go
// ProviderPost 使用 provider_access_token 调用服务商级 POST API
func (c *ISVClient) ProviderPost(ctx context.Context, path string, req interface{}, resp interface{}) error {
	providerToken, err := c.GetProviderAccessToken()
	if err != nil {
		return fmt.Errorf("获取 provider_access_token 失败: %w", err)
	}
	url := fmt.Sprintf("%s%s?provider_access_token=%s", baseURL, path, providerToken)

	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("序列化请求失败: %w", err)
	}

	httpResp, err := c.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("HTTP 请求失败: %w", err)
	}
	defer httpResp.Body.Close()

	if err := json.NewDecoder(httpResp.Body).Decode(resp); err != nil {
		return fmt.Errorf("解析响应失败: %w", err)
	}
	return nil
}
```

### 7.4 Java

```java
package com.wecom.isv;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 企业微信服务商代开发收银台/收费管理模块
 *
 * <p>依赖 wecom-isv-core 的 ISVClient 提供 provider_access_token 管理。
 * 收银台 API 使用 provider_access_token 凭证。</p>
 */
public class ISVBillingManager {

    private static final Logger logger = LoggerFactory.getLogger(ISVBillingManager.class);

    private final ISVClient client;

    public ISVBillingManager(ISVClient client) {
        this.client = client;
    }

    // ──────────────────── 请求/响应 DTO ────────────────────

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CreateOrderReq {
        @JsonProperty("corpid")
        private String corpid;
        @JsonProperty("buyer_userid")
        private String buyerUserid;
        @JsonProperty("account_count")
        private Integer accountCount;
        @JsonProperty("account_duration")
        private Integer accountDuration;
        @JsonProperty("order_from")
        private Integer orderFrom;

        public CreateOrderReq(String corpid, String buyerUserid) {
            this.corpid = corpid;
            this.buyerUserid = buyerUserid;
        }

        // Getters & Setters
        public String getCorpid() { return corpid; }
        public void setCorpid(String corpid) { this.corpid = corpid; }
        public String getBuyerUserid() { return buyerUserid; }
        public void setBuyerUserid(String buyerUserid) { this.buyerUserid = buyerUserid; }
        public Integer getAccountCount() { return accountCount; }
        public void setAccountCount(Integer accountCount) { this.accountCount = accountCount; }
        public Integer getAccountDuration() { return accountDuration; }
        public void setAccountDuration(Integer accountDuration) { this.accountDuration = accountDuration; }
        public Integer getOrderFrom() { return orderFrom; }
        public void setOrderFrom(Integer orderFrom) { this.orderFrom = orderFrom; }
    }

    public static class CreateOrderResp {
        @JsonProperty("order_id")
        private String orderId;
        @JsonProperty("order_url")
        private String orderUrl;

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getOrderUrl() { return orderUrl; }
        public void setOrderUrl(String orderUrl) { this.orderUrl = orderUrl; }
    }

    public static class BillingOrder {
        @JsonProperty("order_id")
        private String orderId;
        @JsonProperty("order_status")
        private int orderStatus;         // 0=待支付 1=已支付 2=已取消 3=已过期 4=已退款
        @JsonProperty("order_type")
        private int orderType;           // 0=新购 1=续费 2=扩容
        @JsonProperty("corpid")
        private String corpid;
        @JsonProperty("price")
        private int price;               // 金额（单位：分）
        @JsonProperty("account_count")
        private int accountCount;
        @JsonProperty("account_duration")
        private int accountDuration;     // 时长（秒）
        @JsonProperty("create_time")
        private long createTime;
        @JsonProperty("pay_time")
        private long payTime;

        // Getters & Setters
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public int getOrderStatus() { return orderStatus; }
        public void setOrderStatus(int orderStatus) { this.orderStatus = orderStatus; }
        public int getOrderType() { return orderType; }
        public void setOrderType(int orderType) { this.orderType = orderType; }
        public String getCorpid() { return corpid; }
        public void setCorpid(String corpid) { this.corpid = corpid; }
        public int getPrice() { return price; }
        public void setPrice(int price) { this.price = price; }
        public int getAccountCount() { return accountCount; }
        public void setAccountCount(int accountCount) { this.accountCount = accountCount; }
        public int getAccountDuration() { return accountDuration; }
        public void setAccountDuration(int accountDuration) { this.accountDuration = accountDuration; }
        public long getCreateTime() { return createTime; }
        public void setCreateTime(long createTime) { this.createTime = createTime; }
        public long getPayTime() { return payTime; }
        public void setPayTime(long payTime) { this.payTime = payTime; }
    }

    public static class GetOrderInfoResp {
        @JsonProperty("order")
        private BillingOrder order;

        public BillingOrder getOrder() { return order; }
        public void setOrder(BillingOrder order) { this.order = order; }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ListOrderReq {
        @JsonProperty("corpid")
        private String corpid;
        @JsonProperty("start_time")
        private Long startTime;
        @JsonProperty("end_time")
        private Long endTime;
        @JsonProperty("cursor")
        private String cursor;
        @JsonProperty("limit")
        private Integer limit;

        // Getters & Setters
        public String getCorpid() { return corpid; }
        public void setCorpid(String corpid) { this.corpid = corpid; }
        public Long getStartTime() { return startTime; }
        public void setStartTime(Long startTime) { this.startTime = startTime; }
        public Long getEndTime() { return endTime; }
        public void setEndTime(Long endTime) { this.endTime = endTime; }
        public String getCursor() { return cursor; }
        public void setCursor(String cursor) { this.cursor = cursor; }
        public Integer getLimit() { return limit; }
        public void setLimit(Integer limit) { this.limit = limit; }
    }

    public static class ListOrderResp {
        @JsonProperty("order_list")
        private List<BillingOrder> orderList;
        @JsonProperty("next_cursor")
        private String nextCursor;
        @JsonProperty("has_more")
        private int hasMore;

        public List<BillingOrder> getOrderList() { return orderList; }
        public void setOrderList(List<BillingOrder> orderList) { this.orderList = orderList; }
        public String getNextCursor() { return nextCursor; }
        public void setNextCursor(String nextCursor) { this.nextCursor = nextCursor; }
        public int getHasMore() { return hasMore; }
        public void setHasMore(int hasMore) { this.hasMore = hasMore; }
    }

    // ──────────────────── 核心方法 ────────────────────

    /**
     * B1: 创建收款订单
     *
     * @param corpid          授权企业的 corpid
     * @param buyerUserid     企业中下单人的 userid（管理员）
     * @param accountCount    购买的账号数量（按人数计费时必填，可为 null）
     * @param accountDuration 购买的时长（秒）（按时长计费时必填，可为 null）
     * @return CreateOrderResp 含 orderId 和 orderUrl
     * @throws WeComISVException 创建失败时抛出
     */
    public CreateOrderResp createOrder(String corpid, String buyerUserid,
                                       Integer accountCount, Integer accountDuration) {
        CreateOrderReq req = new CreateOrderReq(corpid, buyerUserid);
        req.setAccountCount(accountCount);
        req.setAccountDuration(accountDuration);

        CreateOrderResp resp = client.providerPost(
                "/license/create_order", req, CreateOrderResp.class);
        logger.info("收款订单已创建: order_id={}, corpid={}", resp.getOrderId(), corpid);
        return resp;
    }

    /**
     * B2: 获取订单详情
     *
     * @param orderId 订单 ID
     * @return BillingOrder 订单详情
     * @throws WeComISVException 查询失败时抛出
     */
    public BillingOrder getOrderInfo(String orderId) {
        Map<String, String> req = Map.of("order_id", orderId);
        GetOrderInfoResp resp = client.providerPost(
                "/license/get_order_info", req, GetOrderInfoResp.class);
        return resp.getOrder();
    }

    /**
     * B3: 获取订单列表
     *
     * @param req ListOrderReq 查询条件
     * @return ListOrderResp 订单列表（含分页信息）
     * @throws WeComISVException 查询失败时抛出
     */
    public ListOrderResp listOrders(ListOrderReq req) {
        if (req.getLimit() == null || req.getLimit() <= 0) {
            req.setLimit(100);
        }
        if (req.getLimit() > 1000) {
            req.setLimit(1000);
        }
        return client.providerPost(
                "/license/list_order", req, ListOrderResp.class);
    }

    /**
     * 全量获取订单列表（自动分页）
     *
     * @param corpid    按企业筛选（可为 null）
     * @param startTime 起始时间（Unix 秒，可为 null）
     * @param endTime   结束时间（Unix 秒，可为 null）
     * @return 所有订单的列表
     */
    public List<BillingOrder> listAllOrders(String corpid, Long startTime, Long endTime) {
        List<BillingOrder> allOrders = new ArrayList<>();
        String cursor = null;

        while (true) {
            ListOrderReq req = new ListOrderReq();
            req.setCorpid(corpid);
            req.setStartTime(startTime);
            req.setEndTime(endTime);
            req.setCursor(cursor);
            req.setLimit(1000);

            ListOrderResp resp = listOrders(req);
            if (resp.getOrderList() != null) {
                allOrders.addAll(resp.getOrderList());
            }
            if (resp.getHasMore() == 0) {
                break;
            }
            cursor = resp.getNextCursor();
            if (cursor == null || cursor.isEmpty()) {
                break;
            }
        }
        return allOrders;
    }

    // ──────────────────── 回调处理 ────────────────────

    public static class BillingCallbackData {
        private String suiteId;
        private String infoType;
        private long timeStamp;
        private String orderId;
        private String buyerCorpId;

        // Getters & Setters
        public String getSuiteId() { return suiteId; }
        public void setSuiteId(String suiteId) { this.suiteId = suiteId; }
        public String getInfoType() { return infoType; }
        public void setInfoType(String infoType) { this.infoType = infoType; }
        public long getTimeStamp() { return timeStamp; }
        public void setTimeStamp(long timeStamp) { this.timeStamp = timeStamp; }
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getBuyerCorpId() { return buyerCorpId; }
        public void setBuyerCorpId(String buyerCorpId) { this.buyerCorpId = buyerCorpId; }
    }

    /**
     * 统一处理收银台回调事件
     *
     * @param data 解密后的回调数据
     * @return 订单详情（未知类型返回 null）
     */
    public BillingOrder handleBillingCallback(BillingCallbackData data) {
        switch (data.getInfoType()) {
            case "order_pay_success":
                return handlePaySuccess(data);
            case "order_refund":
                return handleRefund(data);
            default:
                logger.warn("未知的收银台回调类型: {}", data.getInfoType());
                return null;
        }
    }

    private BillingOrder handlePaySuccess(BillingCallbackData data) {
        logger.info("收到支付成功回调: order_id={}, corpid={}", data.getOrderId(), data.getBuyerCorpId());
        BillingOrder order = getOrderInfo(data.getOrderId());
        if (order.getOrderStatus() != 1) {
            logger.warn("订单状态异常: order_id={}, status={}", data.getOrderId(), order.getOrderStatus());
        }
        // TODO: 业务层激活服务
        return order;
    }

    private BillingOrder handleRefund(BillingCallbackData data) {
        logger.info("收到退款回调: order_id={}, corpid={}", data.getOrderId(), data.getBuyerCorpId());
        BillingOrder order = getOrderInfo(data.getOrderId());
        // TODO: 业务层回收服务
        return order;
    }

    /**
     * 检查订单是否已支付
     *
     * <p>注意：此方法仅用于主动确认，正常流程应依赖回调通知。</p>
     */
    public boolean checkOrderPaid(String orderId) {
        BillingOrder order = getOrderInfo(orderId);
        return order.getOrderStatus() == 1;
    }
}
```

**ISVClient 扩展方法（在 wecom-isv-core 的 ISVClient 基础上）:**

```java
/**
 * 使用 provider_access_token 调用服务商级 POST API
 *
 * @param path     API 路径（不含 /cgi-bin/ 前缀）
 * @param req      请求体对象
 * @param respType 响应类型
 * @return 反序列化后的响应对象
 * @throws WeComISVException 请求失败时抛出
 */
public <T> T providerPost(String path, Object req, Class<T> respType) {
    String providerToken = getProviderAccessToken();
    String url = String.format("%s%s?provider_access_token=%s", baseUrl, path, providerToken);

    String body;
    try {
        body = objectMapper.writeValueAsString(req);
    } catch (Exception e) {
        throw new WeComISVException("序列化请求失败", e);
    }

    HttpRequest httpReq = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

    try {
        HttpResponse<String> httpResp = httpClient.send(httpReq, HttpResponse.BodyHandlers.ofString());
        return objectMapper.readValue(httpResp.body(), respType);
    } catch (Exception e) {
        throw new WeComISVException("HTTP 请求失败: " + path, e);
    }
}
```

### 7.5 PHP

```php
<?php
/**
 * 企业微信服务商代开发收银台/收费管理模块
 *
 * 依赖 wecom-isv-core 的 ISVClient 提供 provider_access_token 管理。
 * 收银台 API 使用 provider_access_token 凭证。
 */

namespace WeComISV;

use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

class ISVBillingManager
{
    private ISVClient $client;
    private LoggerInterface $logger;

    public function __construct(ISVClient $client, ?LoggerInterface $logger = null)
    {
        $this->client = $client;
        $this->logger = $logger ?? new NullLogger();
    }

    // ──────────────────── B1: 创建收款订单 ────────────────────

    /**
     * 创建收款订单
     *
     * @param string   $corpid          授权企业的 corpid
     * @param string   $buyerUserid     企业中下单人的 userid（管理员）
     * @param int|null $accountCount    购买的账号数量（按人数计费时必填）
     * @param int|null $accountDuration 购买的时长（秒）（按时长计费时必填）
     * @param int      $orderFrom       订单来源，0=服务商后台(默认), 1=应用内
     *
     * @return array{order_id: string, order_url: string}
     *
     * @throws WeComISVException
     */
    public function createOrder(
        string $corpid,
        string $buyerUserid,
        ?int $accountCount = null,
        ?int $accountDuration = null,
        int $orderFrom = 0
    ): array {
        $body = [
            'corpid'       => $corpid,
            'buyer_userid' => $buyerUserid,
        ];
        if ($accountCount !== null) {
            $body['account_count'] = $accountCount;
        }
        if ($accountDuration !== null) {
            $body['account_duration'] = $accountDuration;
        }
        if ($orderFrom !== 0) {
            $body['order_from'] = $orderFrom;
        }

        $resp = $this->client->providerPost('/license/create_order', $body);

        $this->logger->info('收款订单已创建', [
            'order_id' => $resp['order_id'] ?? '',
            'corpid'   => $corpid,
        ]);

        return [
            'order_id'  => $resp['order_id'],
            'order_url' => $resp['order_url'],
        ];
    }

    // ──────────────────── B2: 获取订单详情 ────────────────────

    /**
     * 获取收款订单详情
     *
     * @param string $orderId 订单 ID
     *
     * @return array 订单详情，包含 order_id, order_status, price, create_time 等
     *
     * @throws WeComISVException
     */
    public function getOrderInfo(string $orderId): array
    {
        $resp = $this->client->providerPost(
            '/license/get_order_info',
            ['order_id' => $orderId]
        );

        return $resp['order'] ?? $resp;
    }

    // ──────────────────── B3: 获取订单列表 ────────────────────

    /**
     * 获取收款订单列表
     *
     * @param string|null $corpid    按企业筛选（null 查所有企业）
     * @param int|null    $startTime 起始时间（Unix 秒）
     * @param int|null    $endTime   结束时间（Unix 秒）
     * @param string      $cursor    分页游标
     * @param int         $limit     每页数量，默认 100，最大 1000
     *
     * @return array{order_list: array, next_cursor: string, has_more: int}
     *
     * @throws WeComISVException
     */
    public function listOrders(
        ?string $corpid = null,
        ?int $startTime = null,
        ?int $endTime = null,
        string $cursor = '',
        int $limit = 100
    ): array {
        $body = ['limit' => min(max($limit, 1), 1000)];

        if ($corpid !== null) {
            $body['corpid'] = $corpid;
        }
        if ($startTime !== null) {
            $body['start_time'] = $startTime;
        }
        if ($endTime !== null) {
            $body['end_time'] = $endTime;
        }
        if ($cursor !== '') {
            $body['cursor'] = $cursor;
        }

        return $this->client->providerPost('/license/list_order', $body);
    }

    // ──────────────────── 全量获取订单列表（自动分页）────────────────────

    /**
     * 全量获取订单列表（自动处理分页）
     *
     * @param string|null $corpid    按企业筛选
     * @param int|null    $startTime 起始时间
     * @param int|null    $endTime   结束时间
     *
     * @return array 所有订单的列表
     */
    public function listAllOrders(
        ?string $corpid = null,
        ?int $startTime = null,
        ?int $endTime = null
    ): array {
        $allOrders = [];
        $cursor = '';

        while (true) {
            $resp = $this->listOrders($corpid, $startTime, $endTime, $cursor, 1000);
            $allOrders = array_merge($allOrders, $resp['order_list'] ?? []);

            if (($resp['has_more'] ?? 0) === 0) {
                break;
            }
            $cursor = $resp['next_cursor'] ?? '';
            if ($cursor === '') {
                break;
            }
        }

        return $allOrders;
    }

    // ──────────────────── 回调处理 ────────────────────

    /**
     * 统一处理收银台回调事件
     *
     * @param string $infoType 回调类型（order_pay_success / order_refund）
     * @param array  $data     解密后的回调数据（XML 解析结果）
     *
     * @return array|null 订单详情（未知类型返回 null）
     */
    public function handleBillingCallback(string $infoType, array $data): ?array
    {
        $orderId    = $data['OrderId'] ?? '';
        $buyerCorpId = $data['BuyerCorpId'] ?? '';

        switch ($infoType) {
            case 'order_pay_success':
                $this->logger->info('收到支付成功回调', [
                    'order_id' => $orderId,
                    'corpid'   => $buyerCorpId,
                ]);
                $order = $this->getOrderInfo($orderId);
                if (($order['order_status'] ?? -1) !== 1) {
                    $this->logger->warning('订单状态异常', [
                        'order_id' => $orderId,
                        'status'   => $order['order_status'] ?? 'unknown',
                    ]);
                }
                // TODO: 业务层激活服务
                $this->activateService($buyerCorpId, $order);
                return $order;

            case 'order_refund':
                $this->logger->info('收到退款回调', [
                    'order_id' => $orderId,
                    'corpid'   => $buyerCorpId,
                ]);
                $order = $this->getOrderInfo($orderId);
                // TODO: 业务层回收服务
                $this->deactivateService($buyerCorpId, $order);
                return $order;

            default:
                $this->logger->warning('未知的收银台回调类型', ['info_type' => $infoType]);
                return null;
        }
    }

    /**
     * 激活企业服务（需业务层实现）
     */
    private function activateService(string $corpid, array $order): void
    {
        $this->logger->info('激活企业服务', [
            'corpid'   => $corpid,
            'order_id' => $order['order_id'] ?? '',
        ]);
    }

    /**
     * 回收企业服务（需业务层实现）
     */
    private function deactivateService(string $corpid, array $order): void
    {
        $this->logger->info('回收企业服务', [
            'corpid'   => $corpid,
            'order_id' => $order['order_id'] ?? '',
        ]);
    }

    // ──────────────────── 便捷方法 ────────────────────

    /**
     * 创建订单并返回支付引导信息
     *
     * @return array{order_id: string, order_url: string, corpid: string, message: string}
     */
    public function createAndNotify(
        string $corpid,
        string $buyerUserid,
        ?int $accountCount = null,
        ?int $accountDuration = null
    ): array {
        $result = $this->createOrder(
            $corpid,
            $buyerUserid,
            $accountCount,
            $accountDuration,
            1  // order_from=应用内
        );

        return array_merge($result, [
            'corpid'  => $corpid,
            'message' => '请引导企业管理员打开链接完成支付',
        ]);
    }

    /**
     * 检查订单是否已支付
     *
     * 注意：此方法仅用于主动确认，正常流程应依赖回调通知。
     */
    public function checkOrderPaid(string $orderId): bool
    {
        $order = $this->getOrderInfo($orderId);
        return ($order['order_status'] ?? -1) === 1;
    }
}
```

**ISVClient 扩展方法（在 wecom-isv-core 的 ISVClient 基础上）:**

```php
/**
 * 使用 provider_access_token 调用服务商级 POST API
 *
 * @param string $path API 路径（不含 /cgi-bin/ 前缀）
 * @param array  $body 请求体
 *
 * @return array 解析后的响应数据
 *
 * @throws WeComISVException
 */
public function providerPost(string $path, array $body): array
{
    $providerToken = $this->getProviderAccessToken();
    $url = sprintf('%s%s?provider_access_token=%s', $this->baseUrl, $path, $providerToken);

    $options = [
        'http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/json',
            'content' => json_encode($body, JSON_UNESCAPED_UNICODE),
            'timeout' => 10,
        ],
    ];

    $context  = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        throw new WeComISVException("HTTP 请求失败: {$path}");
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        throw new WeComISVException("解析响应失败: {$path}");
    }

    if (($data['errcode'] ?? 0) !== 0) {
        throw new WeComISVException(
            sprintf('API 错误 [%d]: %s', $data['errcode'], $data['errmsg'] ?? ''),
            $data['errcode']
        );
    }

    return $data;
}
```

---

## 8. 测试模板

### 8.1 Python (pytest)

```python
import pytest
from unittest.mock import patch, MagicMock, PropertyMock
from isv_billing import ISVBillingManager


@pytest.fixture
def mock_client():
    """模拟 WeComISVClient"""
    client = MagicMock()
    client.BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin"
    return client


@pytest.fixture
def billing(mock_client):
    """创建 BillingManager 实例"""
    return ISVBillingManager(mock_client)


class TestCreateOrder:
    """B1: 创建收款订单"""

    def test_创建订单_按人数计费_成功(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "order_id": "ORDER_001",
            "order_url": "https://open.work.weixin.qq.com/payOrder?order_id=ORDER_001",
        }
        result = billing.create_order(
            corpid="wwCorpXXX",
            buyer_userid="admin001",
            account_count=50,
        )
        assert result["order_id"] == "ORDER_001"
        assert "order_url" in result
        mock_client._make_provider_request.assert_called_once_with(
            "POST",
            "/license/create_order",
            json={
                "corpid": "wwCorpXXX",
                "buyer_userid": "admin001",
                "account_count": 50,
            },
        )

    def test_创建订单_按时长计费_成功(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "order_id": "ORDER_002",
            "order_url": "https://open.work.weixin.qq.com/payOrder?order_id=ORDER_002",
        }
        result = billing.create_order(
            corpid="wwCorpXXX",
            buyer_userid="admin001",
            account_duration=31536000,  # 一年
        )
        assert result["order_id"] == "ORDER_002"

    def test_创建订单_混合计费_人数加时长(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order_id": "ORDER_003",
            "order_url": "https://example.com/pay",
        }
        result = billing.create_order(
            corpid="wwCorpXXX",
            buyer_userid="admin001",
            account_count=100,
            account_duration=31536000,
        )
        call_args = mock_client._make_provider_request.call_args
        body = call_args[1]["json"]
        assert body["account_count"] == 100
        assert body["account_duration"] == 31536000

    def test_创建订单_应用内来源(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order_id": "ORDER_004",
            "order_url": "https://example.com/pay",
        }
        billing.create_order(
            corpid="wwCorpXXX",
            buyer_userid="admin001",
            account_count=10,
            order_from=1,
        )
        call_args = mock_client._make_provider_request.call_args
        body = call_args[1]["json"]
        assert body["order_from"] == 1

    def test_创建订单_企业未授权_失败(self, billing, mock_client):
        from wecom_isv_client import WeComISVError
        mock_client._make_provider_request.side_effect = WeComISVError(84015, "企业已被取消授权")
        with pytest.raises(WeComISVError) as exc_info:
            billing.create_order(
                corpid="wwCorpInvalid",
                buyer_userid="admin001",
                account_count=10,
            )
        assert exc_info.value.errcode == 84015


class TestGetOrderInfo:
    """B2: 获取订单详情"""

    def test_获取已支付订单详情(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "order": {
                "order_id": "ORDER_001",
                "order_status": 1,
                "order_type": 0,
                "corpid": "wwCorpXXX",
                "price": 9900,
                "account_count": 50,
                "account_duration": 31536000,
                "create_time": 1640000000,
                "pay_time": 1640001000,
            },
        }
        order = billing.get_order_info("ORDER_001")
        assert order["order_status"] == 1
        assert order["price"] == 9900  # 99.00 元
        assert order["pay_time"] > 0

    def test_获取待支付订单_pay_time为0(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "order": {
                "order_id": "ORDER_005",
                "order_status": 0,
                "pay_time": 0,
            },
        }
        order = billing.get_order_info("ORDER_005")
        assert order["order_status"] == 0
        assert order["pay_time"] == 0

    def test_查询不存在的订单_失败(self, billing, mock_client):
        from wecom_isv_client import WeComISVError
        mock_client._make_provider_request.side_effect = WeComISVError(95001, "订单不存在")
        with pytest.raises(WeComISVError):
            billing.get_order_info("INVALID_ORDER")


class TestListOrders:
    """B3: 获取订单列表"""

    def test_按企业查询订单列表(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "order_list": [
                {"order_id": "ORDER_001", "order_status": 1},
                {"order_id": "ORDER_002", "order_status": 0},
            ],
            "next_cursor": "",
            "has_more": 0,
        }
        result = billing.list_orders(corpid="wwCorpXXX")
        assert len(result["order_list"]) == 2
        assert result["has_more"] == 0

    def test_分页查询(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order_list": [{"order_id": "ORDER_100"}],
            "next_cursor": "CURSOR_VALUE",
            "has_more": 1,
        }
        result = billing.list_orders(corpid="wwCorpXXX", limit=1)
        assert result["has_more"] == 1
        assert result["next_cursor"] == "CURSOR_VALUE"

    def test_limit最大1000(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order_list": [], "next_cursor": "", "has_more": 0,
        }
        billing.list_orders(limit=5000)
        call_args = mock_client._make_provider_request.call_args
        body = call_args[1]["json"]
        assert body["limit"] == 1000  # 自动截断


class TestListAllOrders:
    """全量获取订单（自动分页）"""

    def test_自动分页获取全部订单(self, billing, mock_client):
        mock_client._make_provider_request.side_effect = [
            {
                "errcode": 0, "errmsg": "ok",
                "order_list": [{"order_id": f"ORDER_{i}"} for i in range(3)],
                "next_cursor": "page2",
                "has_more": 1,
            },
            {
                "errcode": 0, "errmsg": "ok",
                "order_list": [{"order_id": "ORDER_3"}],
                "next_cursor": "",
                "has_more": 0,
            },
        ]
        orders = billing.list_all_orders(corpid="wwCorpXXX")
        assert len(orders) == 4
        assert mock_client._make_provider_request.call_count == 2


class TestCallbackHandling:
    """回调处理"""

    def test_支付成功回调(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order": {"order_id": "ORDER_001", "order_status": 1, "price": 9900},
        }
        result = billing.handle_billing_callback(
            "order_pay_success",
            {"OrderId": "ORDER_001", "BuyerCorpId": "wwCorpXXX"},
        )
        assert result is not None
        assert result["order_status"] == 1

    def test_退款回调(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order": {"order_id": "ORDER_001", "order_status": 4},
        }
        result = billing.handle_billing_callback(
            "order_refund",
            {"OrderId": "ORDER_001", "BuyerCorpId": "wwCorpXXX"},
        )
        assert result is not None
        assert result["order_status"] == 4

    def test_未知回调类型(self, billing, mock_client):
        result = billing.handle_billing_callback(
            "unknown_type",
            {"OrderId": "ORDER_001", "BuyerCorpId": "wwCorpXXX"},
        )
        assert result is None


class TestConvenienceMethods:
    """便捷方法"""

    def test_check_order_paid_已支付(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order": {"order_id": "ORDER_001", "order_status": 1},
        }
        assert billing.check_order_paid("ORDER_001") is True

    def test_check_order_paid_未支付(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order": {"order_id": "ORDER_001", "order_status": 0},
        }
        assert billing.check_order_paid("ORDER_001") is False

    def test_create_and_notify(self, billing, mock_client):
        mock_client._make_provider_request.return_value = {
            "errcode": 0, "errmsg": "ok",
            "order_id": "ORDER_001",
            "order_url": "https://example.com/pay",
        }
        result = billing.create_and_notify(
            corpid="wwCorpXXX",
            buyer_userid="admin001",
            account_count=50,
        )
        assert "order_id" in result
        assert "order_url" in result
        assert result["corpid"] == "wwCorpXXX"
        assert "message" in result
```

---

## 9. Code Review 检查清单

### 9.1 收银台专项审核

| 编号 | 检查项 | 严重度 |
|------|--------|--------|
| R1 | 收银台 API 是否使用 `provider_access_token`（非 suite_access_token 或 access_token） | CRITICAL |
| R2 | provider_access_token 是否有缓存机制（有效期 7200 秒） | HIGH |
| R3 | provider_secret / provider_access_token 是否从环境变量读取，未硬编码 | CRITICAL |
| R4 | API 路径是否为 `/license/*` 格式（非 `/service/*`） | HIGH |
| R5 | 代码路径是否不含 `/cgi-bin/` 前缀（客户端 base URL 已包含） | CRITICAL |
| R6 | 创建订单后是否通过回调确认支付（非轮询 get_order_info） | HIGH |
| R7 | 订单金额 price 是否按**分**处理（非元） | HIGH |
| R8 | 订单列表分页是否正确使用 cursor + has_more（非 next_cursor 为空判断） | MEDIUM |
| R9 | 回调处理是否在 5 秒内响应 "success"，业务逻辑异步执行 | HIGH |
| R10 | 退款处理是否包含服务回收逻辑（减少账号/缩短有效期） | HIGH |
| R11 | 是否处理了 order_url 过期场景（过期后重新创建订单） | MEDIUM |
| R12 | Python post() 是否使用 `json=body` 关键字参数（非位置参数） | CRITICAL |
| R13 | Go 模板是否使用 `c.client.ProviderPost(ctx, path, req, &resp)` 4 参数签名 | HIGH |
| R14 | 是否避免同一企业重复创建未支付订单 | MEDIUM |
| R15 | 商户号开通流程是否明确标注为后台操作（非 API） | MEDIUM |

---

## 10. 踩坑指南

### G1: 凭证类型混用

收银台 API 使用 `provider_access_token`，这是最常犯的错误。三种凭证的用途完全不同：

| 凭证 | 主体 | 用途 |
|------|------|------|
| provider_access_token | 服务商 | 收银台、接口调用许可 |
| suite_access_token | 代开发模版 | 授权管理、预授权码 |
| corp access_token | 授权企业 | 通讯录、消息、CRM 等业务 API |

→ 在代码中明确区分三种凭证的获取和使用场景，建议封装为独立方法。

### G2: 订单金额单位是分

`get_order_info` 返回的 `price` 字段单位是**分**（人民币），不是元。`9900` = 99.00 元。在前端展示时必须除以 100。

→ 建议在类型定义或工具方法中统一处理金额转换，避免在业务代码中手动计算。

```python
def price_to_yuan(price_fen: int) -> str:
    """分转元（保留两位小数）"""
    return f"{price_fen / 100:.2f}"
```

### G3: order_url 有有效期

`create_order` 返回的 `order_url` 不是永久有效的，通常 24 小时后过期。过期后企业打开链接会看到"订单已失效"，需要服务商重新创建订单。

→ 创建订单时记录创建时间，在引导支付前检查是否过期。如已过期，重新调用 `create_order`。

### G4: 不要轮询检测支付状态

支付成功后企业微信会通过 `order_pay_success` 回调通知。不要定时轮询 `get_order_info` 来检测支付状态，这既低效又容易触发频率限制。

→ 正常流程：依赖回调。仅在以下场景主动查询：
- 回调可能丢失时的补偿机制（定时对账，频率控制在每小时一次以内）
- 用户在前端主动点击"已完成支付"按钮时

### G5: 退款在微信支付商户后台操作

企业微信不提供退款 API。退款需要在微信支付商户后台手动操作或通过微信支付 API 发起。退款完成后企业微信推送 `order_refund` 回调。

→ 退款流程：
1. 服务商运营在微信支付商户平台发起退款
2. 微信支付处理退款（1-7 个工作日到账）
3. 企业微信推送 `order_refund` 回调
4. 服务商系统回收服务权益

### G6: 定价策略是后台配置

定价策略（按人数/按时长/一次性/试用期）完全在服务商管理后台配置，没有对应的 API。`create_order` 只需传 `account_count` 和 `account_duration`，金额由后台策略自动计算。

→ 如需动态调整定价，只能通过后台手动修改。建议在设计架构时将定价逻辑与订单创建解耦。

### G7: 到期拦截是后台配置

到期拦截策略（完全拦截/提醒式/自定义页面）也是后台配置，没有 API。到期后企业微信自动拦截，不需要服务商代码介入。

→ 但服务商需要维护企业的服务有效期数据，在即将到期时主动发送续费提醒。

### G8: 同一企业重复创建未支付订单

如果企业有未支付的订单，再次创建可能返回错误或创建新订单（具体行为取决于后台配置）。部分场景下可能同时存在多个待支付订单。

→ 创建订单前先查询该企业的待支付订单列表，避免重复创建。如有待支付订单，优先引导支付已有订单。

```python
def create_or_reuse_order(self, corpid: str, buyer_userid: str, **kwargs) -> dict:
    """创建订单前检查是否有未支付订单"""
    existing = self.list_orders(corpid=corpid)
    pending = [o for o in existing.get("order_list", []) if o.get("order_status") == 0]
    if pending:
        # 复用最新的待支付订单
        return self.get_order_info(pending[0]["order_id"])
    return self.create_order(corpid, buyer_userid, **kwargs)
```

### G9: 回调必须 5 秒内响应

与所有企业微信回调一样，收银台回调必须在 5 秒内响应 `"success"`。如果业务处理较重（如数据库写入、消息推送），必须异步执行。

→ 回调处理器模式：

```python
@app.post("/callback")
async def billing_callback(request):
    data = decrypt_callback(request)
    # 立即响应
    background_tasks.add_task(billing.handle_billing_callback, data["InfoType"], data)
    return Response("success")
```

### G10: provider_access_token 的获取

`provider_access_token` 通过服务商的 `corpid` + `provider_secret` 获取（非 suite_id + suite_secret）。这两对凭证完全不同：

```
suite_id + suite_secret + suite_ticket → suite_access_token（代开发模版凭证）
服务商 corpid + provider_secret → provider_access_token（服务商凭证）
```

→ 确保在 ISVClient 中维护两套独立的 token 管理逻辑。

---

## 11. 收银台域错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40001 | 不合法的 access_token | 检查是否误用了 suite_access_token 或 corp access_token |
| 40014 | 不合法的 access_token | token 格式错误或已失效 |
| 41001 | 缺少 access_token | URL 未携带 provider_access_token |
| 42001 | access_token 已过期 | provider_access_token 已过期，需重新获取 |
| 45009 | 调用频率超限 | 降频，确保 token 有缓存 |
| 60020 | IP 不在白名单 | 服务商管理后台添加 IP 白名单 |
| 84015 | 企业已被取消授权 | 企业管理员取消了代开发应用的授权 |
| 84066 | 商户号未开通 | 需在服务商管理后台开通商户号 |
| 84067 | 定价策略未配置 | 需在服务商管理后台配置定价策略 |
| 84068 | 订单不存在 | order_id 无效或已被删除 |
| 84069 | buyer_userid 无效 | 用户不是该企业的成员或无支付权限 |
| 84070 | 存在未支付订单 | 同一企业有未支付的订单，需先处理 |

---

## 12. 参考

### 12.1 官方文档

| 文档 | 链接 |
|------|------|
| 代开发应用收费概述 | https://developer.work.weixin.qq.com/document/path/97170 |
| 创建收款订单 | https://developer.work.weixin.qq.com/document/path/97171 |
| 获取订单详情 | https://developer.work.weixin.qq.com/document/path/97172 |
| 获取订单列表 | https://developer.work.weixin.qq.com/document/path/97173 |
| 收银台回调 | https://developer.work.weixin.qq.com/document/path/97174 |
| 到期拦截配置 | https://developer.work.weixin.qq.com/document/path/97175 |
| 获取 provider_access_token | https://developer.work.weixin.qq.com/document/path/91200 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |

### 12.2 能力索引（ISV 域）

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 凭证体系、suite_access_token、代开发基座 | wecom-isv-core |
| 授权流程、预授权码、授权链接 | wecom-isv-auth |
| suite_ticket、授权通知、回调事件 | wecom-isv-callback |
| 接口调用许可、帐号购买 | wecom-isv-license |
| 收银台、支付、定价、收款 | **wecom-isv-billing**（本 SKILL） |
| JS-SDK、agentConfig、前端签名 | wecom-isv-jssdk |
| 通讯录、成员、部门 | wecom-contact（复用，换 token 即可） |
| 消息推送、群聊 | wecom-message（复用，换 token 即可） |
| 客户联系、CRM | wecom-crm-*（复用，换 token 即可） |
