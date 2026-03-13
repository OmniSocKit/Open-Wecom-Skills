---
name: wecom-isv-license
description: |
  企业微信服务商代开发「接口调用许可」SKILL。覆盖许可帐号的订单管理（购买/续期/查询）、帐号激活与继承、自动激活配置，以及支付成功/退款回调处理。
  TRIGGER: 当用户提到接口调用许可、license、帐号购买、帐号激活、帐号续期、active_code、帐号继承、自动激活、provider_access_token 相关开发时触发。
  本 SKILL 聚焦许可帐号全生命周期管理，凭证体系和基础客户端继承自 wecom-isv-core。
version: 1.0.0
domain: isv-license
depends_on: wecom-isv-core
doc_ids: [95646, 95716, 95644, 95645, 95718, 95719, 95720, 95721]
triggers:
  - 接口调用许可
  - license
  - 帐号购买
  - 帐号激活
  - 帐号续期
  - active_code
  - 帐号继承
  - batch_transfer_license
  - 自动激活
  - auto_active
  - provider_access_token
  - 许可帐号
  - 基础帐号
  - 互通帐号
  - create_new_order
  - create_renew_order_job
  - license_pay_success
  - ISV license
  - 服务商许可管理
---

# WeCom ISV · API License SKILL (wecom-isv-license)

> 覆盖企业微信服务商代开发「接口调用许可」全生命周期：订单管理（购买/续期/查询）、帐号激活（单个/批量）、帐号继承、自动激活配置，以及 2 种回调事件（license_pay_success / license_refund）。
> 依赖 `wecom-isv-core` SKILL 提供的基础客户端和凭证体系。
> **重要**：License 相关接口全部使用 `provider_access_token`（服务商凭证），而非 suite_access_token 或 access_token。

---

## 1. 前置条件

### 1.1 依赖 SKILL

| SKILL | 用途 |
|-------|------|
| wecom-core | 通用请求规范、回调加解密、错误处理 |
| wecom-isv-core | ISVClient 基础客户端、三级凭证体系 |

### 1.2 权限与凭证

| 凭证 | 获取方式 | 用途 |
|------|---------|------|
| provider_access_token | POST `/service/get_provider_token` (corpid + provider_secret) | **所有** License API 的调用凭证 |

> **关键区分**：License 接口使用 `provider_access_token`，不要与 `suite_access_token`（代开发模版凭证）或 `access_token`（企业应用凭证）混淆。三种凭证各自独立，不可互换。

### 1.3 provider_access_token 获取

```
POST https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token
Body: {
  "corpid": "服务商的corpid",
  "provider_secret": "服务商的provider_secret"
}
Response: {
  "provider_access_token": "xxx",
  "expires_in": 7200
}
```

- `corpid`：服务商管理后台 → 服务商信息 → 基本信息中的 CorpID
- `provider_secret`：服务商管理后台 → 服务商信息 → 基本信息中的 ProviderSecret
- 有效期 7200 秒，**必须缓存**

### 1.4 前置配置

1. **已完成 wecom-isv-core 的全部前置配置**（服务商账号、代开发模版、回调 URL、IP 白名单）
2. **服务商管理后台已开通「接口调用许可」能力**
3. **已获取 provider_secret**（服务商管理后台 → 服务商信息 → 基本信息）
4. **回调 URL 已配置**：用于接收 license_pay_success / license_refund 事件

---

## 2. 核心概念

### 2.1 接口调用许可概述

自 2022 年起，企业微信要求第三方/代开发应用通过「接口调用许可」来管理帐号使用权。

```
核心流程:
服务商下单购买帐号 → 订单支付 → 帐号分配到企业 → 企业激活帐号给成员 → 成员使用应用
```

**核心规则**：
- 每个帐号对应一个企业成员，激活后该成员才能使用应用
- 未激活帐号的成员无法使用代开发/第三方应用
- 服务商为企业购买帐号，企业管理员或服务商分配并激活

### 2.2 帐号类型

| 类型 | type 值 | 说明 | 权限范围 |
|------|---------|------|----------|
| 基础帐号 | 1 | 企业内部使用的基本接口调用权限 | 通讯录、消息、应用管理等基础能力 |
| 互通帐号 | 2 | 支持与微信互通的高级权限 | 包含基础帐号全部权限 + 客户联系、客户群等 CRM 能力 |

> **重要**：互通帐号**包含**基础帐号的所有权限，无需同时购买两种帐号。

### 2.3 订单状态 (order_status)

| 值 | 含义 | 说明 |
|----|------|------|
| 0 | 待支付 | 订单已创建，等待企业管理员支付 |
| 1 | 已支付 | 支付成功，帐号已分配 |
| 2 | 已取消 | 主动取消或系统取消 |
| 3 | 已过期 | 未支付超时自动过期 |
| 4 | 已退款 | 已完成退款 |

### 2.4 订单类型 (order_type)

| 值 | 含义 | 创建方式 |
|----|------|---------|
| 1 | 购买帐号 | create_new_order |
| 2 | 续期帐号 | create_renew_order_job + submit_order_job |

### 2.5 核心术语

| 术语 | 说明 |
|------|------|
| active_code | 激活码，订单支付后生成，每个帐号对应一个激活码 |
| buyer_userid | 下单人（企业管理员）的 userid |
| account_duration | 帐号有效期，单位为月（1~36） |
| base_count | 基础帐号数量 |
| external_contact_count | 互通帐号数量 |
| handover_userid | 帐号继承中的交接人（离职成员） |
| takeover_userid | 帐号继承中的接收人（在职成员） |

### 2.6 生命周期状态机

```
                 ┌─────────────┐
                 │  服务商下单   │
                 └──────┬──────┘
                        │
                        ▼
               ┌─────────────────┐
               │  待支付 (status=0) │
               └────┬────┬───┬──┘
                    │    │   │
          支付成功   │    │   │  超时未支付
        ┌───────────┘    │   └───────────┐
        ▼                │               ▼
┌───────────────┐  主动取消  ┌───────────────┐
│ 已支付 (status=1) │        │ 已过期 (status=3) │
└───────┬───────┘        └───────────────┘
        │                ┌───────────────┐
        │    退款         │ 已取消 (status=2) │
        ├───────────────→└───────────────┘
        │
        ▼
┌───────────────────┐
│ 获取 active_code   │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ 激活帐号给成员     │
│ (active_account)   │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ 成员使用应用       │
└───────┬───────────┘
        │ 成员离职
        ▼
┌───────────────────┐
│ 帐号继承           │
│ (batch_transfer)   │
└───────────────────┘
```

---

## 3. API Quick Reference

### 3.1 订单管理 API

| # | API | 方法 | 路径 | 凭证 | 说明 |
|---|-----|------|------|------|------|
| L1 | 创建购买帐号订单 | POST | `/license/create_new_order` | provider_access_token | 下单购买基础/互通帐号 |
| L2 | 创建续期订单任务 | POST | `/license/create_renew_order_job` | provider_access_token | 异步创建续期任务 |
| L3 | 提交续期订单 | POST | `/license/submit_order_job` | provider_access_token | 提交续期任务生成订单 |
| L4 | 获取订单列表 | POST | `/license/list_order` | provider_access_token | 按企业/时间查询订单 |
| L5 | 获取订单详情 | POST | `/license/get_order` | provider_access_token | 查询单个订单信息 |
| L6 | 获取订单帐号列表 | POST | `/license/list_order_account` | provider_access_token | 获取订单内的帐号和激活码 |

### 3.2 帐号管理 API

| # | API | 方法 | 路径 | 凭证 | 说明 |
|---|-----|------|------|------|------|
| L7 | 激活帐号 | POST | `/license/active_account` | provider_access_token | 单个帐号激活 |
| L8 | 批量激活帐号 | POST | `/license/batch_active_account` | provider_access_token | 批量激活（推荐） |
| L9 | 获取激活码详情 | POST | `/license/get_active_info_by_code` | provider_access_token | 按激活码查询状态 |
| L10 | 获取企业帐号列表 | POST | `/license/list_actived_account` | provider_access_token | 企业已激活帐号列表 |
| L11 | 获取成员激活详情 | POST | `/license/get_active_info_by_user` | provider_access_token | 按成员查询激活信息 |
| L12 | 帐号继承 | POST | `/license/batch_transfer_license` | provider_access_token | 离职成员帐号转移 |

### 3.3 自动激活配置 API

| # | API | 方法 | 路径 | 凭证 | 说明 |
|---|-----|------|------|------|------|
| L13 | 设置自动激活 | POST | `/license/set_auto_active_status` | provider_access_token | 开启/关闭自动激活 |
| L14 | 获取自动激活状态 | POST | `/license/get_auto_active_status` | provider_access_token | 查询自动激活配置 |

---

## 4. API Details

### 4.1 L1: 创建购买帐号订单 (create_new_order)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/create_new_order?provider_access_token=TOKEN`
- **说明**: 为企业创建帐号购买订单

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| buyer_userid | 是 | string | 下单人的 userid（需为企业管理员） |
| account_count | 是 | object | 购买帐号数量 |
| account_count.base_count | 否 | int | 基础帐号数量（与 external_contact_count 至少填一个） |
| account_count.external_contact_count | 否 | int | 互通帐号数量 |
| account_duration | 是 | object | 帐号有效期 |
| account_duration.months | 是 | int | 有效期月数（1~36） |

**请求示例**:
```json
{
  "corpid": "wwxxxxxx",
  "buyer_userid": "admin001",
  "account_count": {
    "base_count": 100,
    "external_contact_count": 50
  },
  "account_duration": {
    "months": 12
  }
}
```

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "order_id": "ORDERID_xxx"
}
```

**关键规则**:
1. `buyer_userid` 必须是企业管理员，否则返回错误
2. `base_count` 和 `external_contact_count` 至少填一个，可同时填
3. `months` 范围 1~36，超出范围返回参数错误
4. 创建后订单状态为「待支付」(status=0)，需企业管理员确认支付
5. corpid 使用授权企业的 corpid（代开发场景下是加密的 corpid）

### 4.2 L2: 创建续期订单任务 (create_renew_order_job)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/create_renew_order_job?provider_access_token=TOKEN`
- **说明**: 创建帐号续期异步任务

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| account_list | 是 | array | 续期帐号列表 |
| account_list[].userid | 是 | string | 成员 userid |
| account_list[].type | 是 | int | 帐号类型：1=基础帐号, 2=互通帐号 |
| job_id | 否 | string | 可选，追加帐号到已有任务 |

**请求示例**:
```json
{
  "corpid": "wwxxxxxx",
  "account_list": [
    { "userid": "user001", "type": 1 },
    { "userid": "user002", "type": 2 }
  ]
}
```

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "jobid": "JOBID_xxx",
  "invalid_account_list": []
}
```

**关键规则**:
1. 这是**异步任务**，返回 `jobid` 后需调用 `submit_order_job` 提交
2. `invalid_account_list` 会返回无法续期的帐号（如帐号未激活）
3. 可多次调用同一 `job_id` 追加帐号到任务
4. type 必须与成员当前激活的帐号类型匹配

### 4.3 L3: 提交续期订单 (submit_order_job)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/submit_order_job?provider_access_token=TOKEN`
- **说明**: 提交续期任务，生成正式续期订单

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| jobid | 是 | string | 续期任务 ID（create_renew_order_job 返回） |
| buyer_userid | 是 | string | 下单人的 userid |
| account_duration | 是 | object | 续期时长 |
| account_duration.months | 是 | int | 续期月数（1~36） |

**请求示例**:
```json
{
  "jobid": "JOBID_xxx",
  "buyer_userid": "admin001",
  "account_duration": {
    "months": 12
  }
}
```

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "order_id": "ORDERID_xxx"
}
```

**关键规则**:
1. 必须先调 `create_renew_order_job` 获取 jobid，再调本接口提交
2. 提交后生成正式订单，状态为「待支付」
3. 一个 jobid 只能提交一次

### 4.4 L4: 获取订单列表 (list_order)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/list_order?provider_access_token=TOKEN`
- **说明**: 按条件查询订单列表

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 否 | string | 筛选指定企业的订单（不传则查询所有企业） |
| start_time | 否 | int | 起始时间戳（秒） |
| end_time | 否 | int | 结束时间戳（秒） |
| cursor | 否 | string | 分页游标，首次不传 |
| limit | 否 | int | 每页数量，默认 100，最大 1000 |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "next_cursor": "CURSOR_xxx",
  "has_more": 1,
  "order_list": [
    {
      "order_id": "ORDERID_xxx",
      "order_type": 1,
      "order_status": 1,
      "corpid": "wwxxxxxx",
      "price": 10000,
      "account_count": {
        "base_count": 100,
        "external_contact_count": 50
      },
      "account_duration": {
        "months": 12
      },
      "create_time": 1640000000,
      "pay_time": 1640001000
    }
  ]
}
```

**关键规则**:
1. `has_more` 为 1 时需使用 `next_cursor` 翻页
2. `price` 单位为**分**
3. 不传 corpid 可查询服务商下所有企业的订单

### 4.5 L5: 获取订单详情 (get_order)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/get_order?provider_access_token=TOKEN`
- **说明**: 查询单个订单详细信息

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| order_id | 是 | string | 订单 ID |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "order": {
    "order_id": "ORDERID_xxx",
    "order_type": 1,
    "order_status": 1,
    "corpid": "wwxxxxxx",
    "price": 10000,
    "account_count": {
      "base_count": 100,
      "external_contact_count": 50
    },
    "account_duration": {
      "months": 12
    },
    "create_time": 1640000000,
    "pay_time": 1640001000
  }
}
```

### 4.6 L6: 获取订单帐号列表 (list_order_account)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/list_order_account?provider_access_token=TOKEN`
- **说明**: 获取订单内的帐号列表（含激活码）

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| order_id | 是 | string | 订单 ID |
| cursor | 否 | string | 分页游标 |
| limit | 否 | int | 每页数量，默认 100，最大 1000 |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "next_cursor": "",
  "has_more": 0,
  "account_list": [
    {
      "active_code": "ACTIVECODE_xxx",
      "userid": "",
      "type": 1
    }
  ]
}
```

**关键规则**:
1. 只有已支付订单 (status=1) 才会有帐号列表
2. `userid` 为空表示帐号尚未激活
3. `active_code` 是激活帐号的关键凭据

### 4.7 L7: 激活帐号 (active_account)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/active_account?provider_access_token=TOKEN`
- **说明**: 将帐号激活给指定成员

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| active_code | 是 | string | 激活码（从 list_order_account 获取） |
| userid | 是 | string | 目标成员的 userid |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

**关键规则**:
1. `active_code` 只能激活一次，激活后永久绑定到指定 userid
2. 激活后不可撤销，只能通过「帐号继承」转移
3. 同一 userid 不能重复激活同类型帐号（已有有效帐号时）

### 4.8 L8: 批量激活帐号 (batch_active_account)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/batch_active_account?provider_access_token=TOKEN`
- **说明**: 批量激活帐号（推荐使用）

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| active_list | 是 | array | 激活列表 |
| active_list[].active_code | 是 | string | 激活码 |
| active_list[].userid | 是 | string | 目标成员的 userid |

**请求示例**:
```json
{
  "corpid": "wwxxxxxx",
  "active_list": [
    { "active_code": "CODE_001", "userid": "user001" },
    { "active_code": "CODE_002", "userid": "user002" }
  ]
}
```

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "active_result": [
    { "active_code": "CODE_001", "userid": "user001", "errcode": 0 },
    { "active_code": "CODE_002", "userid": "user002", "errcode": 0 }
  ]
}
```

**关键规则**:
1. 单次最多激活 1000 个帐号
2. `active_result` 中每条记录有独立的 errcode，需逐条检查
3. 部分失败不影响其他帐号的激活

### 4.9 L9: 获取激活码详情 (get_active_info_by_code)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/get_active_info_by_code?provider_access_token=TOKEN`
- **说明**: 查询激活码的状态和关联信息

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| active_code | 是 | string | 激活码 |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "active_info": {
    "active_code": "ACTIVECODE_xxx",
    "type": 1,
    "status": 1,
    "userid": "user001",
    "create_time": 1640000000,
    "active_time": 1640001000,
    "expire_time": 1671537000
  }
}
```

### 4.10 L10: 获取企业帐号列表 (list_actived_account)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/list_actived_account?provider_access_token=TOKEN`
- **说明**: 查询企业下所有已激活帐号

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| cursor | 否 | string | 分页游标 |
| limit | 否 | int | 每页数量，默认 100，最大 1000 |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "next_cursor": "",
  "has_more": 0,
  "account_list": [
    {
      "userid": "user001",
      "type": 1,
      "expire_time": 1671537000,
      "active_time": 1640001000
    }
  ]
}
```

### 4.11 L11: 获取成员激活详情 (get_active_info_by_user)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/get_active_info_by_user?provider_access_token=TOKEN`
- **说明**: 查询指定成员的帐号激活信息

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| userid | 是 | string | 成员 userid |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "active_status": 1,
  "active_info_list": [
    {
      "active_code": "ACTIVECODE_xxx",
      "type": 1,
      "expire_time": 1671537000,
      "active_time": 1640001000
    }
  ]
}
```

**关键规则**:
1. `active_status` 表示成员当前是否有有效帐号
2. `active_info_list` 可能包含多条记录（基础帐号 + 互通帐号）

### 4.12 L12: 帐号继承 (batch_transfer_license)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/batch_transfer_license?provider_access_token=TOKEN`
- **说明**: 将离职成员的帐号转移给在职成员

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| transfer_list | 是 | array | 转移列表 |
| transfer_list[].handover_userid | 是 | string | 交接人（离职成员）的 userid |
| transfer_list[].takeover_userid | 是 | string | 接收人（在职成员）的 userid |

**请求示例**:
```json
{
  "corpid": "wwxxxxxx",
  "transfer_list": [
    {
      "handover_userid": "leaver001",
      "takeover_userid": "active_user001"
    }
  ]
}
```

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "transfer_result": [
    {
      "handover_userid": "leaver001",
      "takeover_userid": "active_user001",
      "errcode": 0
    }
  ]
}
```

**关键规则**:
1. 只能在**同一企业内**转移
2. `takeover_userid` 不能已有同类型的有效帐号
3. 转移后 `handover_userid` 的帐号立即失效，`takeover_userid` 立即生效
4. `transfer_result` 中每条记录有独立的 errcode

### 4.13 L13: 设置自动激活 (set_auto_active_status)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/set_auto_active_status?provider_access_token=TOKEN`
- **说明**: 开启/关闭企业的帐号自动激活

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |
| auto_active_status | 是 | int | 0=关闭, 1=开启 |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

**关键规则**:
1. 开启后，新成员加入企业会自动消耗未激活的帐号
2. 自动激活会优先消耗最早购买且即将到期的帐号
3. 建议在帐号充裕时开启，避免帐号不足导致新成员无法使用

### 4.14 L14: 获取自动激活状态 (get_auto_active_status)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/license/get_auto_active_status?provider_access_token=TOKEN`
- **说明**: 查询企业当前的自动激活配置

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 授权企业的 corpid |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "auto_active_status": 1
}
```

---

## 5. Callbacks

### 5.1 回调概述

License 相关回调通过**模版回调 URL** 推送，需在服务商管理后台配置。

| 回调事件 | InfoType | 触发时机 |
|---------|----------|---------|
| 订单支付成功 | license_pay_success | 企业管理员完成订单支付 |
| 订单退款 | license_refund | 订单退款完成 |

### 5.2 license_pay_success（订单支付成功）

解密后 XML 格式：

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[license_pay_success]]></InfoType>
  <TimeStamp>1640001000</TimeStamp>
  <OrderId><![CDATA[ORDERID_xxx]]></OrderId>
  <BuyerCorpId><![CDATA[wwxxxxxx]]></BuyerCorpId>
</xml>
```

**处理要求**:
- 收到后**立即响应** `"success"`（5 秒内）
- 根据 `OrderId` 调用 `get_order` 获取订单详情
- 调用 `list_order_account` 获取激活码列表
- 可自动执行 `batch_active_account` 激活帐号（如有预设分配方案）

### 5.3 license_refund（订单退款）

解密后 XML 格式：

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[license_refund]]></InfoType>
  <TimeStamp>1640001000</TimeStamp>
  <OrderId><![CDATA[ORDERID_xxx]]></OrderId>
  <BuyerCorpId><![CDATA[wwxxxxxx]]></BuyerCorpId>
</xml>
```

**处理要求**:
- 收到后**立即响应** `"success"`（5 秒内）
- 更新本地订单状态为已退款
- 检查已激活帐号是否受影响，更新帐号状态

---

## 6. Workflows

### 6.1 购买帐号完整流程

```
步骤 1: 获取 provider_access_token
    POST /service/get_provider_token
    → 缓存 provider_access_token（有效期 7200s）
    ↓
步骤 2: 创建购买订单
    POST /license/create_new_order
    Body: { corpid, buyer_userid, account_count, account_duration }
    → 获取 order_id
    ↓
步骤 3: 等待支付
    → 企业管理员在企业微信管理后台完成支付
    → 收到 license_pay_success 回调
    ↓
步骤 4: 获取帐号列表
    POST /license/list_order_account
    Body: { order_id }
    → 获取 active_code 列表
    ↓
步骤 5: 激活帐号
    POST /license/batch_active_account
    Body: { corpid, active_list: [{active_code, userid}] }
    → 帐号绑定到成员
    ↓
步骤 6: 验证激活结果
    POST /license/get_active_info_by_user
    Body: { corpid, userid }
    → 确认成员帐号已激活
```

### 6.2 续期帐号流程

```
步骤 1: 查询需续期的帐号
    POST /license/list_actived_account
    Body: { corpid }
    → 筛选即将到期的帐号（检查 expire_time）
    ↓
步骤 2: 创建续期任务
    POST /license/create_renew_order_job
    Body: { corpid, account_list: [{userid, type}] }
    → 获取 jobid
    → 检查 invalid_account_list 排除无效帐号
    ↓
步骤 3: 提交续期订单
    POST /license/submit_order_job
    Body: { jobid, buyer_userid, account_duration }
    → 获取 order_id
    ↓
步骤 4: 等待支付
    → 企业管理员完成支付
    → 收到 license_pay_success 回调
    → 帐号自动续期生效
```

### 6.3 帐号继承流程（成员离职）

```
步骤 1: 确认离职成员帐号
    POST /license/get_active_info_by_user
    Body: { corpid, userid: "leaver001" }
    → 获取帐号类型和到期时间
    ↓
步骤 2: 确认接收人无冲突帐号
    POST /license/get_active_info_by_user
    Body: { corpid, userid: "new_user001" }
    → 确认接收人无同类型有效帐号
    ↓
步骤 3: 执行帐号转移
    POST /license/batch_transfer_license
    Body: { corpid, transfer_list: [{handover_userid, takeover_userid}] }
    → 检查 transfer_result 中每条 errcode
    ↓
步骤 4: 验证转移结果
    POST /license/get_active_info_by_user
    Body: { corpid, userid: "new_user001" }
    → 确认接收人帐号已生效
```

### 6.4 自动激活配置流程

```
步骤 1: 检查帐号余量
    POST /license/list_order_account
    → 统计未激活帐号数量
    → 确认帐号充裕
    ↓
步骤 2: 查询当前状态
    POST /license/get_auto_active_status
    Body: { corpid }
    → 确认当前是否已开启
    ↓
步骤 3: 开启自动激活
    POST /license/set_auto_active_status
    Body: { corpid, auto_active_status: 1 }
    ↓
步骤 4: 定期监控
    → 定期查询帐号余量
    → 帐号不足时提醒购买或关闭自动激活
```

---

## 7. 代码模板

### 7.1 Python

```python
"""企业微信服务商代开发 — 接口调用许可管理"""
import os
import time
import logging
import threading
import requests

logger = logging.getLogger(__name__)


class WeComProviderClient:
    """provider_access_token 管理客户端

    License 相关接口全部使用 provider_access_token，
    与 WeComISVClient 的 suite_access_token 体系完全独立。
    """

    BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin"

    def __init__(
        self,
        corpid: str = None,
        provider_secret: str = None,
    ):
        self.corpid = corpid or os.environ["WECOM_PROVIDER_CORPID"]
        self.provider_secret = provider_secret or os.environ["WECOM_PROVIDER_SECRET"]
        self._token: str | None = None
        self._token_expires_at: float = 0
        self._lock = threading.Lock()

    @property
    def provider_access_token(self) -> str:
        """获取 provider_access_token（带缓存和自动刷新）"""
        if time.time() >= self._token_expires_at:
            with self._lock:
                if time.time() >= self._token_expires_at:
                    self._refresh_token()
        return self._token

    def _refresh_token(self):
        resp = requests.post(
            f"{self.BASE_URL}/service/get_provider_token",
            json={
                "corpid": self.corpid,
                "provider_secret": self.provider_secret,
            },
            timeout=10,
        ).json()
        if resp.get("errcode", 0) != 0:
            raise WeComLicenseError(resp["errcode"], resp["errmsg"])
        self._token = resp["provider_access_token"]
        self._token_expires_at = time.time() + resp["expires_in"] - 300

    def post(self, path: str, **kwargs) -> dict:
        """以 provider_access_token 调用 API"""
        url = f"{self.BASE_URL}{path}"
        params = kwargs.pop("params", {})
        params["provider_access_token"] = self.provider_access_token
        resp = requests.post(url, params=params, timeout=10, **kwargs).json()
        errcode = resp.get("errcode", 0)
        if errcode != 0:
            raise WeComLicenseError(errcode, resp.get("errmsg", ""))
        return resp


class WeComLicenseError(Exception):
    def __init__(self, errcode: int, errmsg: str):
        self.errcode = errcode
        self.errmsg = errmsg
        super().__init__(f"WeCom License Error [{errcode}]: {errmsg}")


class LicenseManager:
    """接口调用许可管理器 — 订单/帐号/自动激活全生命周期"""

    def __init__(self, client: WeComProviderClient):
        self.client = client

    # ─── L1: 创建购买帐号订单 ───

    def create_new_order(
        self,
        corpid: str,
        buyer_userid: str,
        *,
        base_count: int = 0,
        external_contact_count: int = 0,
        months: int = 12,
    ) -> str:
        """创建购买帐号订单

        Args:
            corpid: 授权企业的 corpid
            buyer_userid: 下单人 userid（需为企业管理员）
            base_count: 基础帐号数量
            external_contact_count: 互通帐号数量
            months: 有效期月数（1~36）

        Returns:
            order_id
        """
        if base_count <= 0 and external_contact_count <= 0:
            raise ValueError("base_count 和 external_contact_count 至少填一个且大于 0")
        if not 1 <= months <= 36:
            raise ValueError("months 必须在 1~36 范围内")

        body = {
            "corpid": corpid,
            "buyer_userid": buyer_userid,
            "account_count": {
                "base_count": base_count,
                "external_contact_count": external_contact_count,
            },
            "account_duration": {"months": months},
        }
        resp = self.client.post("/license/create_new_order", json=body)
        return resp["order_id"]

    # ─── L2: 创建续期订单任务 ───

    def create_renew_order_job(
        self,
        corpid: str,
        account_list: list[dict],
        job_id: str | None = None,
    ) -> dict:
        """创建帐号续期异步任务

        Args:
            corpid: 授权企业的 corpid
            account_list: [{"userid": "xxx", "type": 1}]，type: 1=基础, 2=互通
            job_id: 可选，追加帐号到已有任务

        Returns:
            {"jobid": "xxx", "invalid_account_list": [...]}
        """
        body: dict = {
            "corpid": corpid,
            "account_list": account_list,
        }
        if job_id:
            body["job_id"] = job_id
        resp = self.client.post("/license/create_renew_order_job", json=body)
        return {
            "jobid": resp["jobid"],
            "invalid_account_list": resp.get("invalid_account_list", []),
        }

    # ─── L3: 提交续期订单 ───

    def submit_order_job(
        self,
        jobid: str,
        buyer_userid: str,
        months: int = 12,
    ) -> str:
        """提交续期任务生成正式订单

        Args:
            jobid: 续期任务 ID
            buyer_userid: 下单人 userid
            months: 续期月数（1~36）

        Returns:
            order_id
        """
        if not 1 <= months <= 36:
            raise ValueError("months 必须在 1~36 范围内")
        body = {
            "jobid": jobid,
            "buyer_userid": buyer_userid,
            "account_duration": {"months": months},
        }
        resp = self.client.post("/license/submit_order_job", json=body)
        return resp["order_id"]

    # ─── L4: 获取订单列表 ───

    def list_orders(
        self,
        corpid: str | None = None,
        start_time: int | None = None,
        end_time: int | None = None,
        cursor: str = "",
        limit: int = 100,
    ) -> dict:
        """获取订单列表

        Args:
            corpid: 筛选企业（不传查全部）
            start_time: 起始时间戳（秒）
            end_time: 结束时间戳（秒）
            cursor: 分页游标
            limit: 每页数量（最大 1000）

        Returns:
            {"order_list": [...], "next_cursor": "xxx", "has_more": 0|1}
        """
        body: dict = {"limit": limit}
        if corpid:
            body["corpid"] = corpid
        if start_time is not None:
            body["start_time"] = start_time
        if end_time is not None:
            body["end_time"] = end_time
        if cursor:
            body["cursor"] = cursor
        resp = self.client.post("/license/list_order", json=body)
        return {
            "order_list": resp.get("order_list", []),
            "next_cursor": resp.get("next_cursor", ""),
            "has_more": resp.get("has_more", 0),
        }

    def list_all_orders(
        self,
        corpid: str | None = None,
        start_time: int | None = None,
        end_time: int | None = None,
    ) -> list[dict]:
        """获取全部订单（自动翻页）"""
        all_orders = []
        cursor = ""
        while True:
            result = self.list_orders(
                corpid=corpid,
                start_time=start_time,
                end_time=end_time,
                cursor=cursor,
                limit=1000,
            )
            all_orders.extend(result["order_list"])
            if not result["has_more"]:
                break
            cursor = result["next_cursor"]
        return all_orders

    # ─── L5: 获取订单详情 ───

    def get_order(self, order_id: str) -> dict:
        """获取订单详情

        Args:
            order_id: 订单 ID

        Returns:
            订单详情字典
        """
        resp = self.client.post("/license/get_order", json={"order_id": order_id})
        return resp.get("order", resp)

    # ─── L6: 获取订单帐号列表 ───

    def list_order_accounts(
        self,
        order_id: str,
        cursor: str = "",
        limit: int = 100,
    ) -> dict:
        """获取订单内的帐号列表（含激活码）

        Args:
            order_id: 订单 ID
            cursor: 分页游标
            limit: 每页数量（最大 1000）

        Returns:
            {"account_list": [...], "next_cursor": "xxx", "has_more": 0|1}
        """
        body: dict = {"order_id": order_id, "limit": limit}
        if cursor:
            body["cursor"] = cursor
        resp = self.client.post("/license/list_order_account", json=body)
        return {
            "account_list": resp.get("account_list", []),
            "next_cursor": resp.get("next_cursor", ""),
            "has_more": resp.get("has_more", 0),
        }

    def list_all_order_accounts(self, order_id: str) -> list[dict]:
        """获取订单全部帐号（自动翻页）"""
        all_accounts = []
        cursor = ""
        while True:
            result = self.list_order_accounts(order_id, cursor=cursor, limit=1000)
            all_accounts.extend(result["account_list"])
            if not result["has_more"]:
                break
            cursor = result["next_cursor"]
        return all_accounts

    # ─── L7: 激活帐号 ───

    def active_account(
        self,
        corpid: str,
        active_code: str,
        userid: str,
    ) -> None:
        """激活单个帐号

        Args:
            corpid: 授权企业的 corpid
            active_code: 激活码
            userid: 目标成员 userid
        """
        self.client.post(
            "/license/active_account",
            json={"corpid": corpid, "active_code": active_code, "userid": userid},
        )

    # ─── L8: 批量激活帐号 ───

    def batch_active_account(
        self,
        corpid: str,
        active_list: list[dict],
    ) -> list[dict]:
        """批量激活帐号

        Args:
            corpid: 授权企业的 corpid
            active_list: [{"active_code": "xxx", "userid": "xxx"}]

        Returns:
            激活结果列表，每条包含独立 errcode
        """
        if len(active_list) > 1000:
            raise ValueError("单次最多激活 1000 个帐号")
        resp = self.client.post(
            "/license/batch_active_account",
            json={"corpid": corpid, "active_list": active_list},
        )
        return resp.get("active_result", [])

    # ─── L9: 获取激活码详情 ───

    def get_active_info_by_code(
        self,
        corpid: str,
        active_code: str,
    ) -> dict:
        """按激活码查询状态

        Args:
            corpid: 授权企业的 corpid
            active_code: 激活码

        Returns:
            激活信息字典
        """
        resp = self.client.post(
            "/license/get_active_info_by_code",
            json={"corpid": corpid, "active_code": active_code},
        )
        return resp.get("active_info", resp)

    # ─── L10: 获取企业帐号列表 ───

    def list_actived_accounts(
        self,
        corpid: str,
        cursor: str = "",
        limit: int = 100,
    ) -> dict:
        """获取企业已激活帐号列表

        Args:
            corpid: 授权企业的 corpid
            cursor: 分页游标
            limit: 每页数量（最大 1000）

        Returns:
            {"account_list": [...], "next_cursor": "xxx", "has_more": 0|1}
        """
        body: dict = {"corpid": corpid, "limit": limit}
        if cursor:
            body["cursor"] = cursor
        resp = self.client.post("/license/list_actived_account", json=body)
        return {
            "account_list": resp.get("account_list", []),
            "next_cursor": resp.get("next_cursor", ""),
            "has_more": resp.get("has_more", 0),
        }

    def list_all_actived_accounts(self, corpid: str) -> list[dict]:
        """获取企业全部已激活帐号（自动翻页）"""
        all_accounts = []
        cursor = ""
        while True:
            result = self.list_actived_accounts(corpid, cursor=cursor, limit=1000)
            all_accounts.extend(result["account_list"])
            if not result["has_more"]:
                break
            cursor = result["next_cursor"]
        return all_accounts

    # ─── L11: 获取成员激活详情 ───

    def get_active_info_by_user(
        self,
        corpid: str,
        userid: str,
    ) -> dict:
        """按成员查询激活信息

        Args:
            corpid: 授权企业的 corpid
            userid: 成员 userid

        Returns:
            {"active_status": 0|1, "active_info_list": [...]}
        """
        resp = self.client.post(
            "/license/get_active_info_by_user",
            json={"corpid": corpid, "userid": userid},
        )
        return {
            "active_status": resp.get("active_status", 0),
            "active_info_list": resp.get("active_info_list", []),
        }

    # ─── L12: 帐号继承 ───

    def batch_transfer_license(
        self,
        corpid: str,
        transfer_list: list[dict],
    ) -> list[dict]:
        """帐号继承（离职成员帐号转移）

        Args:
            corpid: 授权企业的 corpid
            transfer_list: [{"handover_userid": "xxx", "takeover_userid": "xxx"}]

        Returns:
            转移结果列表，每条包含独立 errcode
        """
        resp = self.client.post(
            "/license/batch_transfer_license",
            json={"corpid": corpid, "transfer_list": transfer_list},
        )
        return resp.get("transfer_result", [])

    # ─── L13: 设置自动激活 ───

    def set_auto_active_status(
        self,
        corpid: str,
        auto_active_status: int,
    ) -> None:
        """设置企业帐号自动激活

        Args:
            corpid: 授权企业的 corpid
            auto_active_status: 0=关闭, 1=开启
        """
        if auto_active_status not in (0, 1):
            raise ValueError("auto_active_status 只能为 0 或 1")
        self.client.post(
            "/license/set_auto_active_status",
            json={"corpid": corpid, "auto_active_status": auto_active_status},
        )

    # ─── L14: 获取自动激活状态 ───

    def get_auto_active_status(self, corpid: str) -> int:
        """获取企业帐号自动激活状态

        Args:
            corpid: 授权企业的 corpid

        Returns:
            0=关闭, 1=开启
        """
        resp = self.client.post(
            "/license/get_auto_active_status",
            json={"corpid": corpid},
        )
        return resp.get("auto_active_status", 0)

    # ─── 回调处理 ───

    def handle_license_callback(self, info_type: str, data: dict) -> dict | None:
        """统一处理 License 回调事件

        Args:
            info_type: 回调类型（license_pay_success / license_refund）
            data: 解密后的回调数据

        Returns:
            license_pay_success → 订单详情
            license_refund → 订单详情
        """
        order_id = data.get("OrderId", "")
        buyer_corpid = data.get("BuyerCorpId", "")

        if info_type == "license_pay_success":
            logger.info(f"订单支付成功: order_id={order_id}, corpid={buyer_corpid}")
            return self.get_order(order_id)

        elif info_type == "license_refund":
            logger.info(f"订单已退款: order_id={order_id}, corpid={buyer_corpid}")
            return self.get_order(order_id)

        else:
            raise ValueError(f"未知的 License 回调类型: {info_type}")

    # ─── 便捷方法：购买并激活 ───

    def purchase_and_activate(
        self,
        corpid: str,
        buyer_userid: str,
        userid_list: list[str],
        *,
        account_type: int = 1,
        months: int = 12,
    ) -> str:
        """便捷方法：创建购买订单（激活需在支付回调后执行）

        Args:
            corpid: 授权企业的 corpid
            buyer_userid: 下单人 userid
            userid_list: 需要激活帐号的成员列表
            account_type: 1=基础帐号, 2=互通帐号
            months: 有效期月数

        Returns:
            order_id（支付后通过回调获取激活码并激活）
        """
        count = len(userid_list)
        if account_type == 1:
            order_id = self.create_new_order(
                corpid, buyer_userid, base_count=count, months=months
            )
        elif account_type == 2:
            order_id = self.create_new_order(
                corpid, buyer_userid, external_contact_count=count, months=months
            )
        else:
            raise ValueError("account_type 只能为 1（基础）或 2（互通）")

        logger.info(
            f"已创建购买订单: order_id={order_id}, "
            f"corpid={corpid}, count={count}, months={months}"
        )
        return order_id
```

### 7.2 TypeScript

```typescript
/** 企业微信服务商代开发 — 接口调用许可管理 */
import axios, { AxiosInstance } from 'axios';

// ─── 错误类 ───

export class WeComLicenseError extends Error {
  constructor(public errcode: number, public errmsg: string) {
    super(`WeCom License Error [${errcode}]: ${errmsg}`);
  }
}

// ─── 类型定义 ───

/** 帐号数量 */
interface AccountCount {
  base_count?: number;
  external_contact_count?: number;
}

/** 帐号有效期 */
interface AccountDuration {
  months: number;
}

/** 订单信息 */
interface OrderInfo {
  order_id: string;
  order_type: number;
  order_status: number;
  corpid: string;
  price: number;
  account_count: AccountCount;
  account_duration: AccountDuration;
  create_time: number;
  pay_time?: number;
}

/** 订单帐号 */
interface OrderAccount {
  active_code: string;
  userid: string;
  type: number;
}

/** 激活信息 */
interface ActiveInfo {
  active_code: string;
  type: number;
  status: number;
  userid: string;
  create_time: number;
  active_time: number;
  expire_time: number;
}

/** 激活结果 */
interface ActiveResult {
  active_code: string;
  userid: string;
  errcode: number;
}

/** 转移结果 */
interface TransferResult {
  handover_userid: string;
  takeover_userid: string;
  errcode: number;
}

/** 续期帐号项 */
interface RenewAccountItem {
  userid: string;
  type: number; // 1=基础, 2=互通
}

/** 激活项 */
interface ActiveItem {
  active_code: string;
  userid: string;
}

/** 转移项 */
interface TransferItem {
  handover_userid: string;
  takeover_userid: string;
}

/** 分页结果 */
interface PaginatedResult<T> {
  list: T[];
  next_cursor: string;
  has_more: boolean;
}

// ─── Provider 客户端 ───

export class WeComProviderClient {
  private static readonly BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private http: AxiosInstance;

  constructor(
    private corpid = process.env.WECOM_PROVIDER_CORPID!,
    private providerSecret = process.env.WECOM_PROVIDER_SECRET!,
  ) {
    this.http = axios.create({
      baseURL: WeComProviderClient.BASE_URL,
      timeout: 10_000,
    });
  }

  /** 获取 provider_access_token（带缓存） */
  async getProviderAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;
    const { data } = await this.http.post('/service/get_provider_token', {
      corpid: this.corpid,
      provider_secret: this.providerSecret,
    });
    if (data.errcode && data.errcode !== 0) {
      throw new WeComLicenseError(data.errcode, data.errmsg);
    }
    this.token = data.provider_access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return this.token!;
  }

  /** 以 provider_access_token 调用 API */
  async post<T = Record<string, unknown>>(
    path: string,
    body: object,
  ): Promise<T> {
    const token = await this.getProviderAccessToken();
    const { data } = await this.http.post<T & { errcode?: number; errmsg?: string }>(
      path,
      body,
      { params: { provider_access_token: token } },
    );
    const errcode = (data as any).errcode ?? 0;
    if (errcode !== 0) {
      throw new WeComLicenseError(errcode, (data as any).errmsg ?? '');
    }
    return data;
  }
}

// ─── License 管理器 ───

export class LicenseManager {
  constructor(private client: WeComProviderClient) {}

  // ─── L1: 创建购买帐号订单 ───

  async createNewOrder(
    corpid: string,
    buyerUserid: string,
    accountCount: AccountCount,
    months: number,
  ): Promise<string> {
    if (months < 1 || months > 36) throw new Error('months 必须在 1~36 范围内');
    const resp = await this.client.post<{ order_id: string }>(
      '/license/create_new_order',
      {
        corpid,
        buyer_userid: buyerUserid,
        account_count: accountCount,
        account_duration: { months },
      },
    );
    return resp.order_id;
  }

  // ─── L2: 创建续期订单任务 ───

  async createRenewOrderJob(
    corpid: string,
    accountList: RenewAccountItem[],
    jobId?: string,
  ): Promise<{ jobid: string; invalidAccountList: RenewAccountItem[] }> {
    const body: Record<string, unknown> = {
      corpid,
      account_list: accountList,
    };
    if (jobId) body.job_id = jobId;
    const resp = await this.client.post<{
      jobid: string;
      invalid_account_list?: RenewAccountItem[];
    }>('/license/create_renew_order_job', body);
    return {
      jobid: resp.jobid,
      invalidAccountList: resp.invalid_account_list ?? [],
    };
  }

  // ─── L3: 提交续期订单 ───

  async submitOrderJob(
    jobid: string,
    buyerUserid: string,
    months: number,
  ): Promise<string> {
    if (months < 1 || months > 36) throw new Error('months 必须在 1~36 范围内');
    const resp = await this.client.post<{ order_id: string }>(
      '/license/submit_order_job',
      {
        jobid,
        buyer_userid: buyerUserid,
        account_duration: { months },
      },
    );
    return resp.order_id;
  }

  // ─── L4: 获取订单列表 ───

  async listOrders(options: {
    corpid?: string;
    startTime?: number;
    endTime?: number;
    cursor?: string;
    limit?: number;
  } = {}): Promise<PaginatedResult<OrderInfo>> {
    const body: Record<string, unknown> = { limit: options.limit ?? 100 };
    if (options.corpid) body.corpid = options.corpid;
    if (options.startTime != null) body.start_time = options.startTime;
    if (options.endTime != null) body.end_time = options.endTime;
    if (options.cursor) body.cursor = options.cursor;
    const resp = await this.client.post<{
      order_list?: OrderInfo[];
      next_cursor?: string;
      has_more?: number;
    }>('/license/list_order', body);
    return {
      list: resp.order_list ?? [],
      next_cursor: resp.next_cursor ?? '',
      has_more: (resp.has_more ?? 0) === 1,
    };
  }

  /** 获取全部订单（自动翻页） */
  async listAllOrders(options: {
    corpid?: string;
    startTime?: number;
    endTime?: number;
  } = {}): Promise<OrderInfo[]> {
    const all: OrderInfo[] = [];
    let cursor = '';
    do {
      const result = await this.listOrders({ ...options, cursor, limit: 1000 });
      all.push(...result.list);
      cursor = result.next_cursor;
      if (!result.has_more) break;
    } while (cursor);
    return all;
  }

  // ─── L5: 获取订单详情 ───

  async getOrder(orderId: string): Promise<OrderInfo> {
    const resp = await this.client.post<{ order?: OrderInfo }>(
      '/license/get_order',
      { order_id: orderId },
    );
    return resp.order ?? (resp as unknown as OrderInfo);
  }

  // ─── L6: 获取订单帐号列表 ───

  async listOrderAccounts(
    orderId: string,
    cursor = '',
    limit = 100,
  ): Promise<PaginatedResult<OrderAccount>> {
    const body: Record<string, unknown> = { order_id: orderId, limit };
    if (cursor) body.cursor = cursor;
    const resp = await this.client.post<{
      account_list?: OrderAccount[];
      next_cursor?: string;
      has_more?: number;
    }>('/license/list_order_account', body);
    return {
      list: resp.account_list ?? [],
      next_cursor: resp.next_cursor ?? '',
      has_more: (resp.has_more ?? 0) === 1,
    };
  }

  /** 获取订单全部帐号（自动翻页） */
  async listAllOrderAccounts(orderId: string): Promise<OrderAccount[]> {
    const all: OrderAccount[] = [];
    let cursor = '';
    do {
      const result = await this.listOrderAccounts(orderId, cursor, 1000);
      all.push(...result.list);
      cursor = result.next_cursor;
      if (!result.has_more) break;
    } while (cursor);
    return all;
  }

  // ─── L7: 激活帐号 ───

  async activeAccount(corpid: string, activeCode: string, userid: string): Promise<void> {
    await this.client.post('/license/active_account', {
      corpid,
      active_code: activeCode,
      userid,
    });
  }

  // ─── L8: 批量激活帐号 ───

  async batchActiveAccount(
    corpid: string,
    activeList: ActiveItem[],
  ): Promise<ActiveResult[]> {
    if (activeList.length > 1000) throw new Error('单次最多激活 1000 个帐号');
    const resp = await this.client.post<{ active_result?: ActiveResult[] }>(
      '/license/batch_active_account',
      { corpid, active_list: activeList },
    );
    return resp.active_result ?? [];
  }

  // ─── L9: 获取激活码详情 ───

  async getActiveInfoByCode(corpid: string, activeCode: string): Promise<ActiveInfo> {
    const resp = await this.client.post<{ active_info?: ActiveInfo }>(
      '/license/get_active_info_by_code',
      { corpid, active_code: activeCode },
    );
    return resp.active_info ?? (resp as unknown as ActiveInfo);
  }

  // ─── L10: 获取企业帐号列表 ───

  async listActivedAccounts(
    corpid: string,
    cursor = '',
    limit = 100,
  ): Promise<PaginatedResult<{ userid: string; type: number; expire_time: number; active_time: number }>> {
    const body: Record<string, unknown> = { corpid, limit };
    if (cursor) body.cursor = cursor;
    const resp = await this.client.post<{
      account_list?: any[];
      next_cursor?: string;
      has_more?: number;
    }>('/license/list_actived_account', body);
    return {
      list: resp.account_list ?? [],
      next_cursor: resp.next_cursor ?? '',
      has_more: (resp.has_more ?? 0) === 1,
    };
  }

  // ─── L11: 获取成员激活详情 ───

  async getActiveInfoByUser(
    corpid: string,
    userid: string,
  ): Promise<{ activeStatus: number; activeInfoList: ActiveInfo[] }> {
    const resp = await this.client.post<{
      active_status?: number;
      active_info_list?: ActiveInfo[];
    }>('/license/get_active_info_by_user', { corpid, userid });
    return {
      activeStatus: resp.active_status ?? 0,
      activeInfoList: resp.active_info_list ?? [],
    };
  }

  // ─── L12: 帐号继承 ───

  async batchTransferLicense(
    corpid: string,
    transferList: TransferItem[],
  ): Promise<TransferResult[]> {
    const resp = await this.client.post<{ transfer_result?: TransferResult[] }>(
      '/license/batch_transfer_license',
      { corpid, transfer_list: transferList },
    );
    return resp.transfer_result ?? [];
  }

  // ─── L13: 设置自动激活 ───

  async setAutoActiveStatus(corpid: string, status: 0 | 1): Promise<void> {
    await this.client.post('/license/set_auto_active_status', {
      corpid,
      auto_active_status: status,
    });
  }

  // ─── L14: 获取自动激活状态 ───

  async getAutoActiveStatus(corpid: string): Promise<number> {
    const resp = await this.client.post<{ auto_active_status?: number }>(
      '/license/get_auto_active_status',
      { corpid },
    );
    return resp.auto_active_status ?? 0;
  }

  // ─── 回调处理 ───

  async handleLicenseCallback(
    infoType: string,
    data: Record<string, string>,
  ): Promise<OrderInfo | null> {
    const orderId = data.OrderId ?? '';
    switch (infoType) {
      case 'license_pay_success':
        return this.getOrder(orderId);
      case 'license_refund':
        return this.getOrder(orderId);
      default:
        throw new Error(`未知的 License 回调类型: ${infoType}`);
    }
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"
)

// ─── Provider 客户端 ───

// ProviderClient 服务商凭证客户端，管理 provider_access_token
type ProviderClient struct {
	CorpID         string
	ProviderSecret string

	token     string
	expiresAt time.Time
	mu        sync.RWMutex
	client    *HTTPClient // 来自 wecom-core
}

// NewProviderClient 创建 Provider 客户端
func NewProviderClient(corpID, providerSecret string) *ProviderClient {
	if corpID == "" {
		corpID = os.Getenv("WECOM_PROVIDER_CORPID")
	}
	if providerSecret == "" {
		providerSecret = os.Getenv("WECOM_PROVIDER_SECRET")
	}
	return &ProviderClient{
		CorpID:         corpID,
		ProviderSecret: providerSecret,
		client:         NewHTTPClient(), // 含 baseURL + timeout
	}
}

// GetProviderAccessToken 获取 provider_access_token（带缓存）
func (c *ProviderClient) GetProviderAccessToken(ctx context.Context) (string, error) {
	c.mu.RLock()
	if c.token != "" && time.Now().Before(c.expiresAt) {
		defer c.mu.RUnlock()
		return c.token, nil
	}
	c.mu.RUnlock()
	return c.refreshToken(ctx)
}

func (c *ProviderClient) refreshToken(ctx context.Context) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.token != "" && time.Now().Before(c.expiresAt) {
		return c.token, nil
	}
	req := map[string]string{
		"corpid":          c.CorpID,
		"provider_secret": c.ProviderSecret,
	}
	var resp struct {
		ErrCode             int    `json:"errcode"`
		ErrMsg              string `json:"errmsg"`
		ProviderAccessToken string `json:"provider_access_token"`
		ExpiresIn           int    `json:"expires_in"`
	}
	if err := c.client.Post(ctx, "/service/get_provider_token", req, &resp); err != nil {
		return "", err
	}
	if resp.ErrCode != 0 {
		return "", &WeComError{resp.ErrCode, resp.ErrMsg}
	}
	c.token = resp.ProviderAccessToken
	c.expiresAt = time.Now().Add(time.Duration(resp.ExpiresIn-300) * time.Second)
	return c.token, nil
}

// Post 以 provider_access_token 调用 API
func (c *ProviderClient) Post(ctx context.Context, path string, reqBody, result interface{}) error {
	token, err := c.GetProviderAccessToken(ctx)
	if err != nil {
		return err
	}
	fullPath := fmt.Sprintf("%s?provider_access_token=%s", path, token)
	return c.client.Post(ctx, fullPath, reqBody, result)
}

// ─── 请求/响应结构体 ───

// AccountCount 帐号数量
type AccountCount struct {
	BaseCount            int `json:"base_count,omitempty"`
	ExternalContactCount int `json:"external_contact_count,omitempty"`
}

// AccountDuration 帐号有效期
type AccountDuration struct {
	Months int `json:"months"`
}

// OrderInfo 订单信息
type OrderInfo struct {
	OrderID         string          `json:"order_id"`
	OrderType       int             `json:"order_type"`
	OrderStatus     int             `json:"order_status"`
	CorpID          string          `json:"corpid"`
	Price           int             `json:"price"`
	AccountCount    AccountCount    `json:"account_count"`
	AccountDuration AccountDuration `json:"account_duration"`
	CreateTime      int64           `json:"create_time"`
	PayTime         int64           `json:"pay_time,omitempty"`
}

// OrderAccount 订单帐号
type OrderAccount struct {
	ActiveCode string `json:"active_code"`
	UserID     string `json:"userid"`
	Type       int    `json:"type"`
}

// ActiveInfo 激活信息
type ActiveInfo struct {
	ActiveCode string `json:"active_code"`
	Type       int    `json:"type"`
	Status     int    `json:"status"`
	UserID     string `json:"userid"`
	CreateTime int64  `json:"create_time"`
	ActiveTime int64  `json:"active_time"`
	ExpireTime int64  `json:"expire_time"`
}

// ActiveResult 激活结果
type ActiveResult struct {
	ActiveCode string `json:"active_code"`
	UserID     string `json:"userid"`
	ErrCode    int    `json:"errcode"`
}

// TransferResult 转移结果
type TransferResult struct {
	HandoverUserID string `json:"handover_userid"`
	TakeoverUserID string `json:"takeover_userid"`
	ErrCode        int    `json:"errcode"`
}

// RenewAccountItem 续期帐号项
type RenewAccountItem struct {
	UserID string `json:"userid"`
	Type   int    `json:"type"`
}

// ActiveItem 激活项
type ActiveItem struct {
	ActiveCode string `json:"active_code"`
	UserID     string `json:"userid"`
}

// TransferItem 转移项
type TransferItem struct {
	HandoverUserID string `json:"handover_userid"`
	TakeoverUserID string `json:"takeover_userid"`
}

// ─── License 管理器 ───

// LicenseManager 接口调用许可管理器
type LicenseManager struct {
	client *ProviderClient
}

// NewLicenseManager 创建 License 管理器
func NewLicenseManager(client *ProviderClient) *LicenseManager {
	return &LicenseManager{client: client}
}

// CreateNewOrder L1: 创建购买帐号订单
func (m *LicenseManager) CreateNewOrder(
	ctx context.Context,
	corpID, buyerUserID string,
	accountCount AccountCount,
	months int,
) (string, error) {
	if months < 1 || months > 36 {
		return "", fmt.Errorf("months 必须在 1~36 范围内")
	}
	req := map[string]interface{}{
		"corpid":           corpID,
		"buyer_userid":     buyerUserID,
		"account_count":    accountCount,
		"account_duration": AccountDuration{Months: months},
	}
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
		OrderID string `json:"order_id"`
	}
	if err := m.client.Post(ctx, "/license/create_new_order", req, &resp); err != nil {
		return "", err
	}
	return resp.OrderID, nil
}

// CreateRenewOrderJob L2: 创建续期订单任务
func (m *LicenseManager) CreateRenewOrderJob(
	ctx context.Context,
	corpID string,
	accountList []RenewAccountItem,
	jobID string,
) (string, []RenewAccountItem, error) {
	req := map[string]interface{}{
		"corpid":       corpID,
		"account_list": accountList,
	}
	if jobID != "" {
		req["job_id"] = jobID
	}
	var resp struct {
		ErrCode            int                `json:"errcode"`
		ErrMsg             string             `json:"errmsg"`
		JobID              string             `json:"jobid"`
		InvalidAccountList []RenewAccountItem `json:"invalid_account_list"`
	}
	if err := m.client.Post(ctx, "/license/create_renew_order_job", req, &resp); err != nil {
		return "", nil, err
	}
	return resp.JobID, resp.InvalidAccountList, nil
}

// SubmitOrderJob L3: 提交续期订单
func (m *LicenseManager) SubmitOrderJob(
	ctx context.Context,
	jobID, buyerUserID string,
	months int,
) (string, error) {
	if months < 1 || months > 36 {
		return "", fmt.Errorf("months 必须在 1~36 范围内")
	}
	req := map[string]interface{}{
		"jobid":            jobID,
		"buyer_userid":     buyerUserID,
		"account_duration": AccountDuration{Months: months},
	}
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
		OrderID string `json:"order_id"`
	}
	if err := m.client.Post(ctx, "/license/submit_order_job", req, &resp); err != nil {
		return "", err
	}
	return resp.OrderID, nil
}

// ListOrders L4: 获取订单列表
func (m *LicenseManager) ListOrders(
	ctx context.Context,
	corpID string,
	startTime, endTime int64,
	cursor string,
	limit int,
) ([]OrderInfo, string, bool, error) {
	req := map[string]interface{}{"limit": limit}
	if corpID != "" {
		req["corpid"] = corpID
	}
	if startTime > 0 {
		req["start_time"] = startTime
	}
	if endTime > 0 {
		req["end_time"] = endTime
	}
	if cursor != "" {
		req["cursor"] = cursor
	}
	var resp struct {
		ErrCode    int         `json:"errcode"`
		ErrMsg     string      `json:"errmsg"`
		OrderList  []OrderInfo `json:"order_list"`
		NextCursor string      `json:"next_cursor"`
		HasMore    int         `json:"has_more"`
	}
	if err := m.client.Post(ctx, "/license/list_order", req, &resp); err != nil {
		return nil, "", false, err
	}
	return resp.OrderList, resp.NextCursor, resp.HasMore == 1, nil
}

// GetOrder L5: 获取订单详情
func (m *LicenseManager) GetOrder(ctx context.Context, orderID string) (*OrderInfo, error) {
	var resp struct {
		ErrCode int       `json:"errcode"`
		ErrMsg  string    `json:"errmsg"`
		Order   OrderInfo `json:"order"`
	}
	if err := m.client.Post(ctx, "/license/get_order", map[string]string{"order_id": orderID}, &resp); err != nil {
		return nil, err
	}
	return &resp.Order, nil
}

// ListOrderAccounts L6: 获取订单帐号列表
func (m *LicenseManager) ListOrderAccounts(
	ctx context.Context,
	orderID, cursor string,
	limit int,
) ([]OrderAccount, string, bool, error) {
	req := map[string]interface{}{"order_id": orderID, "limit": limit}
	if cursor != "" {
		req["cursor"] = cursor
	}
	var resp struct {
		ErrCode     int            `json:"errcode"`
		ErrMsg      string         `json:"errmsg"`
		AccountList []OrderAccount `json:"account_list"`
		NextCursor  string         `json:"next_cursor"`
		HasMore     int            `json:"has_more"`
	}
	if err := m.client.Post(ctx, "/license/list_order_account", req, &resp); err != nil {
		return nil, "", false, err
	}
	return resp.AccountList, resp.NextCursor, resp.HasMore == 1, nil
}

// ActiveAccount L7: 激活帐号
func (m *LicenseManager) ActiveAccount(ctx context.Context, corpID, activeCode, userID string) error {
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	req := map[string]string{"corpid": corpID, "active_code": activeCode, "userid": userID}
	return m.client.Post(ctx, "/license/active_account", req, &resp)
}

// BatchActiveAccount L8: 批量激活帐号
func (m *LicenseManager) BatchActiveAccount(
	ctx context.Context,
	corpID string,
	activeList []ActiveItem,
) ([]ActiveResult, error) {
	if len(activeList) > 1000 {
		return nil, fmt.Errorf("单次最多激活 1000 个帐号")
	}
	req := map[string]interface{}{"corpid": corpID, "active_list": activeList}
	var resp struct {
		ErrCode      int            `json:"errcode"`
		ErrMsg       string         `json:"errmsg"`
		ActiveResult []ActiveResult `json:"active_result"`
	}
	if err := m.client.Post(ctx, "/license/batch_active_account", req, &resp); err != nil {
		return nil, err
	}
	return resp.ActiveResult, nil
}

// GetActiveInfoByCode L9: 获取激活码详情
func (m *LicenseManager) GetActiveInfoByCode(
	ctx context.Context,
	corpID, activeCode string,
) (*ActiveInfo, error) {
	req := map[string]string{"corpid": corpID, "active_code": activeCode}
	var resp struct {
		ErrCode    int        `json:"errcode"`
		ErrMsg     string     `json:"errmsg"`
		ActiveInfo ActiveInfo `json:"active_info"`
	}
	if err := m.client.Post(ctx, "/license/get_active_info_by_code", req, &resp); err != nil {
		return nil, err
	}
	return &resp.ActiveInfo, nil
}

// ListActivedAccounts L10: 获取企业帐号列表
func (m *LicenseManager) ListActivedAccounts(
	ctx context.Context,
	corpID, cursor string,
	limit int,
) ([]ActiveInfo, string, bool, error) {
	req := map[string]interface{}{"corpid": corpID, "limit": limit}
	if cursor != "" {
		req["cursor"] = cursor
	}
	var resp struct {
		ErrCode     int          `json:"errcode"`
		ErrMsg      string       `json:"errmsg"`
		AccountList []ActiveInfo `json:"account_list"`
		NextCursor  string       `json:"next_cursor"`
		HasMore     int          `json:"has_more"`
	}
	if err := m.client.Post(ctx, "/license/list_actived_account", req, &resp); err != nil {
		return nil, "", false, err
	}
	return resp.AccountList, resp.NextCursor, resp.HasMore == 1, nil
}

// GetActiveInfoByUser L11: 获取成员激活详情
func (m *LicenseManager) GetActiveInfoByUser(
	ctx context.Context,
	corpID, userID string,
) (int, []ActiveInfo, error) {
	req := map[string]string{"corpid": corpID, "userid": userID}
	var resp struct {
		ErrCode        int          `json:"errcode"`
		ErrMsg         string       `json:"errmsg"`
		ActiveStatus   int          `json:"active_status"`
		ActiveInfoList []ActiveInfo `json:"active_info_list"`
	}
	if err := m.client.Post(ctx, "/license/get_active_info_by_user", req, &resp); err != nil {
		return 0, nil, err
	}
	return resp.ActiveStatus, resp.ActiveInfoList, nil
}

// BatchTransferLicense L12: 帐号继承
func (m *LicenseManager) BatchTransferLicense(
	ctx context.Context,
	corpID string,
	transferList []TransferItem,
) ([]TransferResult, error) {
	req := map[string]interface{}{"corpid": corpID, "transfer_list": transferList}
	var resp struct {
		ErrCode        int              `json:"errcode"`
		ErrMsg         string           `json:"errmsg"`
		TransferResult []TransferResult `json:"transfer_result"`
	}
	if err := m.client.Post(ctx, "/license/batch_transfer_license", req, &resp); err != nil {
		return nil, err
	}
	return resp.TransferResult, nil
}

// SetAutoActiveStatus L13: 设置自动激活
func (m *LicenseManager) SetAutoActiveStatus(ctx context.Context, corpID string, status int) error {
	if status != 0 && status != 1 {
		return fmt.Errorf("auto_active_status 只能为 0 或 1")
	}
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	req := map[string]interface{}{"corpid": corpID, "auto_active_status": status}
	return m.client.Post(ctx, "/license/set_auto_active_status", req, &resp)
}

// GetAutoActiveStatus L14: 获取自动激活状态
func (m *LicenseManager) GetAutoActiveStatus(ctx context.Context, corpID string) (int, error) {
	var resp struct {
		ErrCode          int    `json:"errcode"`
		ErrMsg           string `json:"errmsg"`
		AutoActiveStatus int    `json:"auto_active_status"`
	}
	if err := m.client.Post(ctx, "/license/get_auto_active_status", map[string]string{"corpid": corpID}, &resp); err != nil {
		return 0, err
	}
	return resp.AutoActiveStatus, nil
}
```

### 7.4 Java

```java
package com.wecom.isv;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

// ─── 异常类 ───

public class WeComLicenseException extends RuntimeException {
    private final int errcode;
    private final String errmsg;

    public WeComLicenseException(int errcode, String errmsg) {
        super(String.format("WeCom License Error [%d]: %s", errcode, errmsg));
        this.errcode = errcode;
        this.errmsg = errmsg;
    }

    public int getErrcode() { return errcode; }
    public String getErrmsg() { return errmsg; }
}

// ─── 数据类型 ───

@JsonInclude(JsonInclude.Include.NON_NULL)
class AccountCount {
    @JsonProperty("base_count") public Integer baseCount;
    @JsonProperty("external_contact_count") public Integer externalContactCount;

    public AccountCount() {}
    public AccountCount(int baseCount, int externalContactCount) {
        this.baseCount = baseCount;
        this.externalContactCount = externalContactCount;
    }
}

class AccountDuration {
    @JsonProperty("months") public int months;

    public AccountDuration() {}
    public AccountDuration(int months) { this.months = months; }
}

class OrderInfo {
    @JsonProperty("order_id") public String orderId;
    @JsonProperty("order_type") public int orderType;
    @JsonProperty("order_status") public int orderStatus;
    @JsonProperty("corpid") public String corpid;
    @JsonProperty("price") public int price;
    @JsonProperty("account_count") public AccountCount accountCount;
    @JsonProperty("account_duration") public AccountDuration accountDuration;
    @JsonProperty("create_time") public long createTime;
    @JsonProperty("pay_time") public Long payTime;
}

class OrderAccount {
    @JsonProperty("active_code") public String activeCode;
    @JsonProperty("userid") public String userid;
    @JsonProperty("type") public int type;
}

class ActiveInfo {
    @JsonProperty("active_code") public String activeCode;
    @JsonProperty("type") public int type;
    @JsonProperty("status") public int status;
    @JsonProperty("userid") public String userid;
    @JsonProperty("create_time") public long createTime;
    @JsonProperty("active_time") public long activeTime;
    @JsonProperty("expire_time") public long expireTime;
}

class ActiveResult {
    @JsonProperty("active_code") public String activeCode;
    @JsonProperty("userid") public String userid;
    @JsonProperty("errcode") public int errcode;
}

class TransferResult {
    @JsonProperty("handover_userid") public String handoverUserid;
    @JsonProperty("takeover_userid") public String takeoverUserid;
    @JsonProperty("errcode") public int errcode;
}

class RenewAccountItem {
    @JsonProperty("userid") public String userid;
    @JsonProperty("type") public int type; // 1=基础, 2=互通

    public RenewAccountItem() {}
    public RenewAccountItem(String userid, int type) {
        this.userid = userid;
        this.type = type;
    }
}

class ActiveItem {
    @JsonProperty("active_code") public String activeCode;
    @JsonProperty("userid") public String userid;

    public ActiveItem() {}
    public ActiveItem(String activeCode, String userid) {
        this.activeCode = activeCode;
        this.userid = userid;
    }
}

class TransferItem {
    @JsonProperty("handover_userid") public String handoverUserid;
    @JsonProperty("takeover_userid") public String takeoverUserid;

    public TransferItem() {}
    public TransferItem(String handoverUserid, String takeoverUserid) {
        this.handoverUserid = handoverUserid;
        this.takeoverUserid = takeoverUserid;
    }
}

/** 分页结果 */
class PaginatedResult<T> {
    public List<T> list;
    public String nextCursor;
    public boolean hasMore;

    public PaginatedResult(List<T> list, String nextCursor, boolean hasMore) {
        this.list = list;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }
}

// ─── Provider 客户端 ───

class WeComProviderClient {
    private static final String BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";
    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");

    private final String corpid;
    private final String providerSecret;
    private final OkHttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private String token;
    private long tokenExpiresAt;

    public WeComProviderClient(String corpid, String providerSecret) {
        this.corpid = corpid != null ? corpid : System.getenv("WECOM_PROVIDER_CORPID");
        this.providerSecret = providerSecret != null ? providerSecret : System.getenv("WECOM_PROVIDER_SECRET");
        this.http = new OkHttpClient.Builder()
            .connectTimeout(java.time.Duration.ofSeconds(10))
            .readTimeout(java.time.Duration.ofSeconds(10))
            .build();
    }

    /** 获取 provider_access_token（带缓存和自动刷新） */
    public String getProviderAccessToken() throws IOException {
        lock.readLock().lock();
        try {
            if (token != null && System.currentTimeMillis() < tokenExpiresAt) {
                return token;
            }
        } finally {
            lock.readLock().unlock();
        }
        return refreshToken();
    }

    private String refreshToken() throws IOException {
        lock.writeLock().lock();
        try {
            if (token != null && System.currentTimeMillis() < tokenExpiresAt) {
                return token;
            }
            Map<String, String> body = Map.of(
                "corpid", corpid,
                "provider_secret", providerSecret
            );
            String json = mapper.writeValueAsString(body);
            Request request = new Request.Builder()
                .url(BASE_URL + "/service/get_provider_token")
                .post(RequestBody.create(json, JSON_TYPE))
                .build();
            try (Response response = http.newCall(request).execute()) {
                Map<String, Object> resp = mapper.readValue(response.body().string(), Map.class);
                int errcode = (int) resp.getOrDefault("errcode", 0);
                if (errcode != 0) {
                    throw new WeComLicenseException(errcode, (String) resp.get("errmsg"));
                }
                token = (String) resp.get("provider_access_token");
                int expiresIn = (int) resp.get("expires_in");
                tokenExpiresAt = System.currentTimeMillis() + (expiresIn - 300) * 1000L;
                return token;
            }
        } finally {
            lock.writeLock().unlock();
        }
    }

    /** 以 provider_access_token 调用 API */
    public Map<String, Object> post(String path, Object requestBody) throws IOException {
        String accessToken = getProviderAccessToken();
        String url = BASE_URL + path + "?provider_access_token=" + accessToken;
        String json = mapper.writeValueAsString(requestBody);
        Request request = new Request.Builder()
            .url(url)
            .post(RequestBody.create(json, JSON_TYPE))
            .build();
        try (Response response = http.newCall(request).execute()) {
            Map<String, Object> resp = mapper.readValue(response.body().string(), Map.class);
            int errcode = (int) resp.getOrDefault("errcode", 0);
            if (errcode != 0) {
                throw new WeComLicenseException(errcode, (String) resp.getOrDefault("errmsg", ""));
            }
            return resp;
        }
    }
}

// ─── License 管理器 ───

public class LicenseManager {
    private final WeComProviderClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    public LicenseManager(WeComProviderClient client) {
        this.client = client;
    }

    // ─── L1: 创建购买帐号订单 ───

    public String createNewOrder(
        String corpid,
        String buyerUserid,
        AccountCount accountCount,
        int months
    ) throws IOException {
        if (months < 1 || months > 36) {
            throw new IllegalArgumentException("months 必须在 1~36 范围内");
        }
        Map<String, Object> body = Map.of(
            "corpid", corpid,
            "buyer_userid", buyerUserid,
            "account_count", accountCount,
            "account_duration", new AccountDuration(months)
        );
        Map<String, Object> resp = client.post("/license/create_new_order", body);
        return (String) resp.get("order_id");
    }

    // ─── L2: 创建续期订单任务（异步，返回 job_id） ───

    public Map<String, Object> createRenewOrderJob(
        String corpid,
        List<RenewAccountItem> accountList,
        String jobId
    ) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("corpid", corpid);
        body.put("account_list", accountList);
        if (jobId != null && !jobId.isEmpty()) {
            body.put("job_id", jobId);
        }
        Map<String, Object> resp = client.post("/license/create_renew_order_job", body);
        Map<String, Object> result = new HashMap<>();
        result.put("jobid", resp.get("jobid"));
        result.put("invalid_account_list", resp.getOrDefault("invalid_account_list", List.of()));
        return result;
    }

    // ─── L3: 提交续期订单 ───

    public String submitOrderJob(
        String jobid,
        String buyerUserid,
        int months
    ) throws IOException {
        if (months < 1 || months > 36) {
            throw new IllegalArgumentException("months 必须在 1~36 范围内");
        }
        Map<String, Object> body = Map.of(
            "jobid", jobid,
            "buyer_userid", buyerUserid,
            "account_duration", new AccountDuration(months)
        );
        Map<String, Object> resp = client.post("/license/submit_order_job", body);
        return (String) resp.get("order_id");
    }

    // ─── L4: 获取订单列表 ───

    public PaginatedResult<OrderInfo> listOrders(
        String corpid,
        Long startTime,
        Long endTime,
        String cursor,
        int limit
    ) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("limit", limit);
        if (corpid != null) body.put("corpid", corpid);
        if (startTime != null) body.put("start_time", startTime);
        if (endTime != null) body.put("end_time", endTime);
        if (cursor != null && !cursor.isEmpty()) body.put("cursor", cursor);

        Map<String, Object> resp = client.post("/license/list_order", body);
        List<OrderInfo> orders = mapper.convertValue(
            resp.get("order_list"),
            mapper.getTypeFactory().constructCollectionType(List.class, OrderInfo.class)
        );
        String nextCursor = (String) resp.getOrDefault("next_cursor", "");
        boolean hasMore = Integer.valueOf(1).equals(resp.get("has_more"));
        return new PaginatedResult<>(orders, nextCursor, hasMore);
    }

    // ─── L5: 获取订单详情 ───

    public OrderInfo getOrder(String orderId) throws IOException {
        Map<String, Object> resp = client.post(
            "/license/get_order",
            Map.of("order_id", orderId)
        );
        return mapper.convertValue(resp.get("order"), OrderInfo.class);
    }

    // ─── L6: 获取订单帐号列表 ───

    public PaginatedResult<OrderAccount> listOrderAccounts(
        String orderId,
        String cursor,
        int limit
    ) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("order_id", orderId);
        body.put("limit", limit);
        if (cursor != null && !cursor.isEmpty()) body.put("cursor", cursor);

        Map<String, Object> resp = client.post("/license/list_order_account", body);
        List<OrderAccount> accounts = mapper.convertValue(
            resp.get("account_list"),
            mapper.getTypeFactory().constructCollectionType(List.class, OrderAccount.class)
        );
        String nextCursor = (String) resp.getOrDefault("next_cursor", "");
        boolean hasMore = Integer.valueOf(1).equals(resp.get("has_more"));
        return new PaginatedResult<>(accounts, nextCursor, hasMore);
    }

    // ─── L7: 激活帐号 ───

    public void activeAccount(
        String corpid,
        String activeCode,
        String userid
    ) throws IOException {
        client.post("/license/active_account", Map.of(
            "corpid", corpid,
            "active_code", activeCode,
            "userid", userid
        ));
    }

    // ─── L8: 批量激活帐号 ───

    public List<ActiveResult> batchActiveAccount(
        String corpid,
        List<ActiveItem> activeList
    ) throws IOException {
        if (activeList.size() > 1000) {
            throw new IllegalArgumentException("单次最多激活 1000 个帐号");
        }
        Map<String, Object> body = Map.of(
            "corpid", corpid,
            "active_list", activeList
        );
        Map<String, Object> resp = client.post("/license/batch_active_account", body);
        return mapper.convertValue(
            resp.get("active_result"),
            mapper.getTypeFactory().constructCollectionType(List.class, ActiveResult.class)
        );
    }

    // ─── L9: 获取激活码详情 ───

    public ActiveInfo getActiveInfoByCode(
        String corpid,
        String activeCode
    ) throws IOException {
        Map<String, Object> resp = client.post(
            "/license/get_active_info_by_code",
            Map.of("corpid", corpid, "active_code", activeCode)
        );
        return mapper.convertValue(resp.get("active_info"), ActiveInfo.class);
    }

    // ─── L10: 获取企业已激活帐号列表 ───

    public PaginatedResult<ActiveInfo> listActivedAccounts(
        String corpid,
        String cursor,
        int limit
    ) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("corpid", corpid);
        body.put("limit", limit);
        if (cursor != null && !cursor.isEmpty()) body.put("cursor", cursor);

        Map<String, Object> resp = client.post("/license/list_actived_account", body);
        List<ActiveInfo> accounts = mapper.convertValue(
            resp.get("account_list"),
            mapper.getTypeFactory().constructCollectionType(List.class, ActiveInfo.class)
        );
        String nextCursor = (String) resp.getOrDefault("next_cursor", "");
        boolean hasMore = Integer.valueOf(1).equals(resp.get("has_more"));
        return new PaginatedResult<>(accounts, nextCursor, hasMore);
    }

    // ─── L11: 获取成员激活详情 ───

    public Map<String, Object> getActiveInfoByUser(
        String corpid,
        String userid
    ) throws IOException {
        Map<String, Object> resp = client.post(
            "/license/get_active_info_by_user",
            Map.of("corpid", corpid, "userid", userid)
        );
        int activeStatus = (int) resp.get("active_status");
        List<ActiveInfo> activeInfoList = mapper.convertValue(
            resp.getOrDefault("active_info_list", List.of()),
            mapper.getTypeFactory().constructCollectionType(List.class, ActiveInfo.class)
        );
        return Map.of(
            "active_status", activeStatus,
            "active_info_list", activeInfoList
        );
    }

    // ─── L12: 帐号继承 ───

    public List<TransferResult> batchTransferLicense(
        String corpid,
        List<TransferItem> transferList
    ) throws IOException {
        Map<String, Object> body = Map.of(
            "corpid", corpid,
            "transfer_list", transferList
        );
        Map<String, Object> resp = client.post("/license/batch_transfer_license", body);
        return mapper.convertValue(
            resp.get("transfer_result"),
            mapper.getTypeFactory().constructCollectionType(List.class, TransferResult.class)
        );
    }

    // ─── L13: 设置自动激活 ───

    public void setAutoActiveStatus(String corpid, int status) throws IOException {
        if (status != 0 && status != 1) {
            throw new IllegalArgumentException("auto_active_status 只能为 0 或 1");
        }
        client.post("/license/set_auto_active_status", Map.of(
            "corpid", corpid,
            "auto_active_status", status
        ));
    }

    // ─── L14: 获取自动激活状态 ───

    public int getAutoActiveStatus(String corpid) throws IOException {
        Map<String, Object> resp = client.post(
            "/license/get_auto_active_status",
            Map.of("corpid", corpid)
        );
        return (int) resp.get("auto_active_status");
    }
}
```

### 7.5 PHP

```php
<?php
/**
 * 企业微信服务商代开发 — 接口调用许可管理
 *
 * 所有 License API 均使用 provider_access_token（服务商凭证），
 * 而非 suite_access_token 或 access_token。
 */

namespace WeComISV;

use GuzzleHttp\Client;
use RuntimeException;

// ─── 异常类 ───

class WeComLicenseException extends RuntimeException
{
    private int $errcode;
    private string $errmsg;

    public function __construct(int $errcode, string $errmsg)
    {
        $this->errcode = $errcode;
        $this->errmsg = $errmsg;
        parent::__construct("WeCom License Error [{$errcode}]: {$errmsg}");
    }

    public function getErrcode(): int { return $this->errcode; }
    public function getErrmsg(): string { return $this->errmsg; }
}

// ─── Provider 客户端 ───

class WeComProviderClient
{
    private const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';

    private string $corpid;
    private string $providerSecret;
    private Client $http;
    private ?string $token = null;
    private float $tokenExpiresAt = 0;

    public function __construct(?string $corpid = null, ?string $providerSecret = null)
    {
        $this->corpid = $corpid ?? getenv('WECOM_PROVIDER_CORPID');
        $this->providerSecret = $providerSecret ?? getenv('WECOM_PROVIDER_SECRET');
        $this->http = new Client([
            'base_uri' => self::BASE_URL,
            'timeout'  => 10,
        ]);
    }

    /** 获取 provider_access_token（带缓存和自动刷新） */
    public function getProviderAccessToken(): string
    {
        if ($this->token !== null && time() < $this->tokenExpiresAt) {
            return $this->token;
        }
        return $this->refreshToken();
    }

    private function refreshToken(): string
    {
        $response = $this->http->post('/service/get_provider_token', [
            'json' => [
                'corpid'          => $this->corpid,
                'provider_secret' => $this->providerSecret,
            ],
        ]);
        $data = json_decode($response->getBody()->getContents(), true);
        $errcode = $data['errcode'] ?? 0;
        if ($errcode !== 0) {
            throw new WeComLicenseException($errcode, $data['errmsg'] ?? '');
        }
        $this->token = $data['provider_access_token'];
        $this->tokenExpiresAt = time() + $data['expires_in'] - 300;
        return $this->token;
    }

    /** 以 provider_access_token 调用 API */
    public function post(string $path, array $body = []): array
    {
        $token = $this->getProviderAccessToken();
        $response = $this->http->post($path, [
            'query' => ['provider_access_token' => $token],
            'json'  => $body,
        ]);
        $data = json_decode($response->getBody()->getContents(), true);
        $errcode = $data['errcode'] ?? 0;
        if ($errcode !== 0) {
            throw new WeComLicenseException($errcode, $data['errmsg'] ?? '');
        }
        return $data;
    }
}

// ─── License 管理器 ───

class LicenseManager
{
    private WeComProviderClient $client;

    public function __construct(WeComProviderClient $client)
    {
        $this->client = $client;
    }

    // ─── L1: 创建购买帐号订单 ───

    /**
     * 创建购买帐号订单
     *
     * @param string $corpid          授权企业的 corpid
     * @param string $buyerUserid     下单人 userid（需为企业管理员）
     * @param int    $baseCount       基础帐号数量
     * @param int    $externalCount   互通帐号数量
     * @param int    $months          有效期月数（1~36）
     * @return string order_id
     */
    public function createNewOrder(
        string $corpid,
        string $buyerUserid,
        int $baseCount = 0,
        int $externalCount = 0,
        int $months = 12
    ): string {
        if ($baseCount <= 0 && $externalCount <= 0) {
            throw new \InvalidArgumentException('base_count 和 external_contact_count 至少填一个且大于 0');
        }
        if ($months < 1 || $months > 36) {
            throw new \InvalidArgumentException('months 必须在 1~36 范围内');
        }
        $resp = $this->client->post('/license/create_new_order', [
            'corpid'           => $corpid,
            'buyer_userid'     => $buyerUserid,
            'account_count'    => [
                'base_count'             => $baseCount,
                'external_contact_count' => $externalCount,
            ],
            'account_duration' => ['months' => $months],
        ]);
        return $resp['order_id'];
    }

    // ─── L2: 创建续期订单任务（异步，返回 job_id） ───

    /**
     * 创建帐号续期异步任务
     *
     * @param string      $corpid       授权企业的 corpid
     * @param array       $accountList  [["userid" => "xxx", "type" => 1], ...]
     * @param string|null $jobId        可选，追加帐号到已有任务
     * @return array{jobid: string, invalid_account_list: array}
     */
    public function createRenewOrderJob(
        string $corpid,
        array $accountList,
        ?string $jobId = null
    ): array {
        $body = [
            'corpid'       => $corpid,
            'account_list' => $accountList,
        ];
        if ($jobId !== null && $jobId !== '') {
            $body['job_id'] = $jobId;
        }
        $resp = $this->client->post('/license/create_renew_order_job', $body);
        return [
            'jobid'                => $resp['jobid'],
            'invalid_account_list' => $resp['invalid_account_list'] ?? [],
        ];
    }

    // ─── L3: 提交续期订单 ───

    /**
     * 提交续期任务生成正式订单
     *
     * @param string $jobid        续期任务 ID
     * @param string $buyerUserid  下单人 userid
     * @param int    $months       续期月数（1~36）
     * @return string order_id
     */
    public function submitOrderJob(
        string $jobid,
        string $buyerUserid,
        int $months = 12
    ): string {
        if ($months < 1 || $months > 36) {
            throw new \InvalidArgumentException('months 必须在 1~36 范围内');
        }
        $resp = $this->client->post('/license/submit_order_job', [
            'jobid'            => $jobid,
            'buyer_userid'     => $buyerUserid,
            'account_duration' => ['months' => $months],
        ]);
        return $resp['order_id'];
    }

    // ─── L4: 获取订单列表 ───

    /**
     * 获取订单列表
     *
     * @param string|null $corpid     筛选企业（不传查全部）
     * @param int|null    $startTime  起始时间戳（秒）
     * @param int|null    $endTime    结束时间戳（秒）
     * @param string      $cursor     分页游标
     * @param int         $limit      每页数量（最大 1000）
     * @return array{order_list: array, next_cursor: string, has_more: bool}
     */
    public function listOrders(
        ?string $corpid = null,
        ?int $startTime = null,
        ?int $endTime = null,
        string $cursor = '',
        int $limit = 100
    ): array {
        $body = ['limit' => $limit];
        if ($corpid !== null) $body['corpid'] = $corpid;
        if ($startTime !== null) $body['start_time'] = $startTime;
        if ($endTime !== null) $body['end_time'] = $endTime;
        if ($cursor !== '') $body['cursor'] = $cursor;

        $resp = $this->client->post('/license/list_order', $body);
        return [
            'order_list'  => $resp['order_list'] ?? [],
            'next_cursor' => $resp['next_cursor'] ?? '',
            'has_more'    => ($resp['has_more'] ?? 0) === 1,
        ];
    }

    // ─── L5: 获取订单详情 ───

    /**
     * @param string $orderId 订单 ID
     * @return array 订单详情
     */
    public function getOrder(string $orderId): array
    {
        $resp = $this->client->post('/license/get_order', [
            'order_id' => $orderId,
        ]);
        return $resp['order'];
    }

    // ─── L6: 获取订单帐号列表 ───

    /**
     * @param string $orderId 订单 ID
     * @param string $cursor  分页游标
     * @param int    $limit   每页数量
     * @return array{account_list: array, next_cursor: string, has_more: bool}
     */
    public function listOrderAccounts(
        string $orderId,
        string $cursor = '',
        int $limit = 100
    ): array {
        $body = ['order_id' => $orderId, 'limit' => $limit];
        if ($cursor !== '') $body['cursor'] = $cursor;

        $resp = $this->client->post('/license/list_order_account', $body);
        return [
            'account_list' => $resp['account_list'] ?? [],
            'next_cursor'  => $resp['next_cursor'] ?? '',
            'has_more'     => ($resp['has_more'] ?? 0) === 1,
        ];
    }

    // ─── L7: 激活帐号 ───

    /**
     * @param string $corpid     授权企业 corpid
     * @param string $activeCode 激活码
     * @param string $userid     待激活成员 userid
     */
    public function activeAccount(
        string $corpid,
        string $activeCode,
        string $userid
    ): void {
        $this->client->post('/license/active_account', [
            'corpid'      => $corpid,
            'active_code' => $activeCode,
            'userid'      => $userid,
        ]);
    }

    // ─── L8: 批量激活帐号 ───

    /**
     * @param string $corpid     授权企业 corpid
     * @param array  $activeList [["active_code" => "xxx", "userid" => "yyy"], ...]
     * @return array 激活结果列表
     */
    public function batchActiveAccount(
        string $corpid,
        array $activeList
    ): array {
        if (count($activeList) > 1000) {
            throw new \InvalidArgumentException('单次最多激活 1000 个帐号');
        }
        $resp = $this->client->post('/license/batch_active_account', [
            'corpid'      => $corpid,
            'active_list' => $activeList,
        ]);
        return $resp['active_result'] ?? [];
    }

    // ─── L9: 获取激活码详情 ───

    /**
     * @param string $corpid     授权企业 corpid
     * @param string $activeCode 激活码
     * @return array 激活详情
     */
    public function getActiveInfoByCode(
        string $corpid,
        string $activeCode
    ): array {
        $resp = $this->client->post('/license/get_active_info_by_code', [
            'corpid'      => $corpid,
            'active_code' => $activeCode,
        ]);
        return $resp['active_info'];
    }

    // ─── L10: 获取企业已激活帐号列表 ───

    /**
     * @param string $corpid  授权企业 corpid
     * @param string $cursor  分页游标
     * @param int    $limit   每页数量
     * @return array{account_list: array, next_cursor: string, has_more: bool}
     */
    public function listActivedAccounts(
        string $corpid,
        string $cursor = '',
        int $limit = 100
    ): array {
        $body = ['corpid' => $corpid, 'limit' => $limit];
        if ($cursor !== '') $body['cursor'] = $cursor;

        $resp = $this->client->post('/license/list_actived_account', $body);
        return [
            'account_list' => $resp['account_list'] ?? [],
            'next_cursor'  => $resp['next_cursor'] ?? '',
            'has_more'     => ($resp['has_more'] ?? 0) === 1,
        ];
    }

    // ─── L11: 获取成员激活详情 ───

    /**
     * @param string $corpid  授权企业 corpid
     * @param string $userid  成员 userid
     * @return array{active_status: int, active_info_list: array}
     */
    public function getActiveInfoByUser(
        string $corpid,
        string $userid
    ): array {
        $resp = $this->client->post('/license/get_active_info_by_user', [
            'corpid' => $corpid,
            'userid' => $userid,
        ]);
        return [
            'active_status'    => $resp['active_status'],
            'active_info_list' => $resp['active_info_list'] ?? [],
        ];
    }

    // ─── L12: 帐号继承 ───

    /**
     * @param string $corpid       授权企业 corpid
     * @param array  $transferList [["handover_userid" => "a", "takeover_userid" => "b"], ...]
     * @return array 转移结果列表
     */
    public function batchTransferLicense(
        string $corpid,
        array $transferList
    ): array {
        $resp = $this->client->post('/license/batch_transfer_license', [
            'corpid'        => $corpid,
            'transfer_list' => $transferList,
        ]);
        return $resp['transfer_result'] ?? [];
    }

    // ─── L13: 设置自动激活 ───

    /**
     * @param string $corpid  授权企业 corpid
     * @param int    $status  0=关闭, 1=开启
     */
    public function setAutoActiveStatus(string $corpid, int $status): void
    {
        if ($status !== 0 && $status !== 1) {
            throw new \InvalidArgumentException('auto_active_status 只能为 0 或 1');
        }
        $this->client->post('/license/set_auto_active_status', [
            'corpid'             => $corpid,
            'auto_active_status' => $status,
        ]);
    }

    // ─── L14: 获取自动激活状态 ───

    /**
     * @param string $corpid 授权企业 corpid
     * @return int 0=关闭, 1=开启
     */
    public function getAutoActiveStatus(string $corpid): int
    {
        $resp = $this->client->post('/license/get_auto_active_status', [
            'corpid' => $corpid,
        ]);
        return $resp['auto_active_status'];
    }
}
```

---

## 8. Test Templates

### 8.1 Python (pytest)

```python
import pytest
from unittest.mock import patch, MagicMock
from wecom_license import WeComProviderClient, LicenseManager, WeComLicenseError


@pytest.fixture
def provider_client():
    c = WeComProviderClient("test_corpid", "test_secret")
    c._token = "mock_provider_token"
    c._token_expires_at = float("inf")
    return c


@pytest.fixture
def manager(provider_client):
    return LicenseManager(provider_client)


class TestProviderToken:
    @patch("requests.post")
    def test_获取provider_access_token成功(self, mock_post):
        c = WeComProviderClient("corpid", "secret")
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "provider_access_token": "new_token", "expires_in": 7200,
        })
        token = c.provider_access_token
        assert token == "new_token"
        mock_post.assert_called_once()

    @patch("requests.post")
    def test_获取token失败抛异常(self, mock_post):
        c = WeComProviderClient("corpid", "secret")
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 40013, "errmsg": "invalid corpid",
        })
        with pytest.raises(WeComLicenseError) as exc_info:
            _ = c.provider_access_token
        assert exc_info.value.errcode == 40013

    def test_缓存有效期内不重复请求(self, provider_client):
        # token 已缓存且未过期
        token = provider_client.provider_access_token
        assert token == "mock_provider_token"


class TestCreateNewOrder:
    @patch("requests.post")
    def test_创建购买订单成功(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok", "order_id": "ORDER_001",
        })
        order_id = manager.create_new_order(
            "wwxxxxxx", "admin001", base_count=100, months=12,
        )
        assert order_id == "ORDER_001"

    def test_帐号数量不能全为零(self, manager):
        with pytest.raises(ValueError, match="至少填一个"):
            manager.create_new_order("wwxxxxxx", "admin001", months=12)

    def test_月数超范围报错(self, manager):
        with pytest.raises(ValueError, match="1~36"):
            manager.create_new_order(
                "wwxxxxxx", "admin001", base_count=10, months=0,
            )


class TestRenewOrder:
    @patch("requests.post")
    def test_创建续期任务成功(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "jobid": "JOB_001", "invalid_account_list": [],
        })
        result = manager.create_renew_order_job(
            "wwxxxxxx",
            [{"userid": "user001", "type": 1}],
        )
        assert result["jobid"] == "JOB_001"
        assert result["invalid_account_list"] == []

    @patch("requests.post")
    def test_提交续期订单成功(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok", "order_id": "ORDER_002",
        })
        order_id = manager.submit_order_job("JOB_001", "admin001", 12)
        assert order_id == "ORDER_002"


class TestAccountActivation:
    @patch("requests.post")
    def test_单个激活成功(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
        })
        manager.active_account("wwxxxxxx", "CODE_001", "user001")
        mock_post.assert_called_once()

    @patch("requests.post")
    def test_批量激活成功(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "active_result": [
                {"active_code": "CODE_001", "userid": "user001", "errcode": 0},
                {"active_code": "CODE_002", "userid": "user002", "errcode": 0},
            ],
        })
        result = manager.batch_active_account("wwxxxxxx", [
            {"active_code": "CODE_001", "userid": "user001"},
            {"active_code": "CODE_002", "userid": "user002"},
        ])
        assert len(result) == 2
        assert all(r["errcode"] == 0 for r in result)

    def test_批量激活超限报错(self, manager):
        big_list = [{"active_code": f"CODE_{i}", "userid": f"user_{i}"} for i in range(1001)]
        with pytest.raises(ValueError, match="1000"):
            manager.batch_active_account("wwxxxxxx", big_list)


class TestAccountTransfer:
    @patch("requests.post")
    def test_帐号继承成功(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "transfer_result": [
                {"handover_userid": "leaver", "takeover_userid": "active", "errcode": 0},
            ],
        })
        result = manager.batch_transfer_license("wwxxxxxx", [
            {"handover_userid": "leaver", "takeover_userid": "active"},
        ])
        assert len(result) == 1
        assert result[0]["errcode"] == 0


class TestAutoActive:
    @patch("requests.post")
    def test_开启自动激活(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
        })
        manager.set_auto_active_status("wwxxxxxx", 1)
        mock_post.assert_called_once()

    @patch("requests.post")
    def test_查询自动激活状态(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok", "auto_active_status": 1,
        })
        status = manager.get_auto_active_status("wwxxxxxx")
        assert status == 1

    def test_非法状态值报错(self, manager):
        with pytest.raises(ValueError, match="0 或 1"):
            manager.set_auto_active_status("wwxxxxxx", 2)


class TestCallback:
    @patch("requests.post")
    def test_支付成功回调(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "order": {"order_id": "ORDER_001", "order_status": 1},
        })
        result = manager.handle_license_callback(
            "license_pay_success",
            {"OrderId": "ORDER_001", "BuyerCorpId": "wwxxxxxx"},
        )
        assert result["order_id"] == "ORDER_001"

    @patch("requests.post")
    def test_退款回调(self, mock_post, manager):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "order": {"order_id": "ORDER_001", "order_status": 4},
        })
        result = manager.handle_license_callback(
            "license_refund",
            {"OrderId": "ORDER_001", "BuyerCorpId": "wwxxxxxx"},
        )
        assert result["order_status"] == 4

    def test_未知回调类型报错(self, manager):
        with pytest.raises(ValueError, match="未知"):
            manager.handle_license_callback("unknown_type", {})


class TestPagination:
    @patch("requests.post")
    def test_自动翻页获取全部订单(self, mock_post, manager):
        mock_post.side_effect = [
            MagicMock(json=lambda: {
                "errcode": 0, "errmsg": "ok",
                "order_list": [{"order_id": "O1"}],
                "next_cursor": "cursor_1", "has_more": 1,
            }),
            MagicMock(json=lambda: {
                "errcode": 0, "errmsg": "ok",
                "order_list": [{"order_id": "O2"}],
                "next_cursor": "", "has_more": 0,
            }),
        ]
        orders = manager.list_all_orders(corpid="wwxxxxxx")
        assert len(orders) == 2
        assert mock_post.call_count == 2
```

---

## 9. Code Review Checklist

### 9.1 License 专项审核

| 维度 | 检查项 | 级别 |
|------|--------|------|
| 凭证 | License API 使用 provider_access_token，非 suite_access_token 或 access_token | CRITICAL |
| 凭证 | provider_secret 从环境变量读取，未硬编码 | CRITICAL |
| 凭证 | provider_access_token 有缓存机制，未频繁调用 get_provider_token | HIGH |
| 正确 | 路径不包含 `/cgi-bin/` 前缀（客户端 baseURL 已包含） | CRITICAL |
| 正确 | 续期流程分两步：先 create_renew_order_job 再 submit_order_job | HIGH |
| 正确 | months 参数校验在 1~36 范围内 | HIGH |
| 正确 | base_count 和 external_contact_count 至少填一个 | HIGH |
| 健壮 | batch_active_account 逐条检查 active_result 中的 errcode | HIGH |
| 健壮 | batch_transfer_license 逐条检查 transfer_result 中的 errcode | HIGH |
| 健壮 | 分页接口正确处理 has_more + next_cursor 翻页 | HIGH |
| 健壮 | 批量激活不超过 1000 条限制 | MEDIUM |
| 业务 | 支付回调 5 秒内响应 "success" | HIGH |
| 业务 | active_code 激活后不可重复使用 | HIGH |
| 业务 | 帐号继承前检查接收人无同类型有效帐号 | MEDIUM |
| 业务 | 自动激活开启前确认帐号余量充裕 | MEDIUM |
| 安全 | corpid 使用授权企业的加密 corpid（代开发场景） | MEDIUM |

### 9.2 通用审核（继承自 wecom-core）

| 维度 | 检查项 | 级别 |
|------|--------|------|
| 安全 | 回调请求签名验证存在 | CRITICAL |
| 安全 | Token 未明文记录日志 | CRITICAL |
| 健壮 | 请求超时设置（建议 10s） | HIGH |
| 健壮 | 错误码正确抛出异常 | HIGH |

---

## 10. Gotcha Guide

### 10.1 高频踩坑

| # | 坑点 | 正确做法 |
|---|------|---------|
| 1 | 用 suite_access_token 或 access_token 调用 License API | License 全系列 API 使用 **provider_access_token** |
| 2 | 续期直接调 submit_order_job | 续期是异步两步操作：先 `create_renew_order_job` 获取 jobid，再 `submit_order_job` |
| 3 | active_code 激活失败后重试相同 code + 不同 userid | active_code 一旦绑定 userid 不可更改，即使激活失败也可能已绑定 |
| 4 | 帐号继承时接收人已有同类型帐号 | 继承前调 `get_active_info_by_user` 确认接收人无同类型有效帐号 |
| 5 | 开启自动激活后不监控帐号余量 | 定期检查未激活帐号数量，不足时提醒购买或关闭自动激活 |
| 6 | 未处理 batch_active_account 的逐条 errcode | `active_result` 每条记录有独立 errcode，部分成功部分失败时需逐条处理 |
| 7 | 订单创建后认为帐号已生效 | 订单需企业管理员支付后才生效，需等待 `license_pay_success` 回调 |
| 8 | 互通帐号和基础帐号分别购买给同一成员 | 互通帐号已包含基础帐号所有权限，无需重复购买 |
| 9 | 回调处理超过 5 秒 | 回调必须 5 秒内响应 `"success"`，耗时逻辑放异步队列 |
| 10 | corpid 使用企业原始 corpid | 代开发场景下 corpid 是服务商主体加密的 corpid |
| 11 | price 字段当作「元」处理 | `price` 单位是**分**，显示时需除以 100 |
| 12 | 路径写成 `/cgi-bin/license/...` | 客户端 baseURL 已含 `/cgi-bin`，路径直接从 `/license/...` 开始 |

### 10.2 License 相关错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40001 | 不合法的 access_token | 确认使用 provider_access_token 而非其他类型 token |
| 41001 | 缺少 access_token 参数 | 请求 URL 缺少 provider_access_token 参数 |
| 42001 | access_token 已过期 | 重新获取 provider_access_token |
| 60020 | IP 不在白名单 | 服务商管理后台添加 IP 白名单 |
| 60123 | 帐号已激活 | active_code 已经激活绑定，不可重复使用 |
| 60124 | 激活码不存在 | 检查 active_code 是否正确 |
| 60125 | 帐号类型不匹配 | 续期时 type 必须与已激活帐号类型一致 |
| 60126 | 用户已有同类型帐号 | 转移/激活前检查目标用户是否已有同类型有效帐号 |
| 60127 | 订单不存在 | 检查 order_id 是否正确 |
| 60128 | jobid 不存在或已提交 | 检查 jobid 是否正确，同一 jobid 只能提交一次 |

---

## 11. References

### 11.1 官方文档

| 文档 | 链接 |
|------|------|
| 接口调用许可概述 | https://developer.work.weixin.qq.com/document/path/95644 |
| 购买帐号 | https://developer.work.weixin.qq.com/document/path/95646 |
| 续期帐号 | https://developer.work.weixin.qq.com/document/path/95716 |
| 激活帐号 | https://developer.work.weixin.qq.com/document/path/95645 |
| 帐号继承 | https://developer.work.weixin.qq.com/document/path/95718 |
| 自动激活配置 | https://developer.work.weixin.qq.com/document/path/95719 |
| License 回调通知 | https://developer.work.weixin.qq.com/document/path/95720 |
| 获取 provider_access_token | https://developer.work.weixin.qq.com/document/path/91200 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |

### 11.2 能力索引（ISV 域）

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 代开发基座、凭证体系、三级凭证 | wecom-isv-core |
| 授权流程、预授权码、授权链接 | wecom-isv-auth |
| suite_ticket、授权通知、回调事件 | wecom-isv-callback |
| 接口调用许可、帐号购买、订单、激活 | **wecom-isv-license（本 SKILL）** |
| 收银台、支付、定价、收款 | wecom-isv-billing |
| JS-SDK、agentConfig、前端签名 | wecom-isv-jssdk |
| 通讯录、成员、部门 | wecom-contact（复用，换 token 即可） |
| 消息推送、群聊 | wecom-message（复用，换 token 即可） |
| 客户联系、CRM | wecom-crm-*（复用，换 token 即可） |
