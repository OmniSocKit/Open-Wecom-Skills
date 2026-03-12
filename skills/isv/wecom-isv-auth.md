---
name: wecom-isv-auth
description: |
  企业微信服务商代开发授权流程 SKILL。覆盖预授权码获取、授权链接拼接、永久授权码换取、授权信息查询、带参授权链接、权限详情查询，以及授权事件回调处理。
  TRIGGER: 当用户提到代开发授权、预授权码、pre_auth_code、授权链接、permanent_code、授权回调、create_auth、change_auth、cancel_auth、授权安装 相关开发时触发。
  本 SKILL 聚焦授权生命周期管理，凭证体系和基础客户端继承自 wecom-isv-core。
version: 1.0.0
domain: isv-auth
depends_on: wecom-isv-core
doc_ids: [97112, 97163, 97164, 98728, 98729, 98730, 98731]
triggers:
  - 代开发授权
  - 预授权码
  - pre_auth_code
  - 授权链接
  - permanent_code
  - 授权回调
  - create_auth
  - change_auth
  - cancel_auth
  - 授权安装
  - 授权变更
  - 取消授权
  - get_pre_auth_code
  - set_session_info
  - get_permanent_code
  - get_auth_info
  - get_customized_auth_url
  - get_app_permissions
  - ISV authorization
  - 服务商授权流程
---

# WeCom ISV · 授权流程 SKILL (wecom-isv-auth)

> 覆盖企业微信服务商代开发「授权流程」全生命周期：预授权码获取、授权链接拼接、临时授权码换永久码、授权信息查询、带参授权链接、权限详情查询，以及 3 种授权事件回调（create_auth / change_auth / cancel_auth）。
> 依赖 `wecom-isv-core` SKILL 提供的 WeComISVClient 基础客户端和三级凭证体系。

---

## 1. 前置条件

### 1.1 依赖 SKILL

| SKILL | 用途 |
|-------|------|
| wecom-core | 通用请求规范、回调加解密、错误处理 |
| wecom-isv-core | ISVClient 基础客户端、三级凭证体系、suite_access_token 管理 |

### 1.2 权限与凭证

| 凭证 | 获取方式 | 用途 |
|------|---------|------|
| suite_access_token | wecom-isv-core 管理 | 大部分授权 API 的调用凭证 |
| provider_access_token | 服务商 corpid + provider_secret | 仅 `get_customized_auth_url` 使用 |

### 1.3 前置配置

1. **已完成 wecom-isv-core 的全部前置配置**（服务商账号、代开发模版、回调 URL、IP 白名单）
2. **代开发模版回调 URL 已正常接收 suite_ticket**（授权 API 依赖 suite_access_token）
3. **redirect_uri 域名已在服务商管理后台配置为可信域名**
4. 如需使用 `get_customized_auth_url`，还需获取 **provider_access_token**（通过 `POST /service/get_provider_token`，使用服务商 corpid + provider_secret）

---

## 2. 核心概念

### 2.1 授权流程全景

```
服务商                            企业微信                          企业管理员
  │                                 │                                │
  ├─ 1. GET /service/get_pre_auth_code ─→                            │
  │    (suite_access_token)         │                                │
  ←── pre_auth_code (20分钟有效) ───┤                                │
  │                                 │                                │
  ├─ 2. POST /service/set_session_info ─→                            │
  │    (可选: 指定应用/授权类型)     │                                │
  │                                 │                                │
  ├─ 3. 拼接授权链接 ──────────────→│                                │
  │    (suite_id + pre_auth_code     │                                │
  │     + redirect_uri + state)      │                                │
  │                                 │─── 4. 展示授权页面 ──────────→│
  │                                 │                                │
  │                                 │←── 5. 管理员扫码确认授权 ─────┤
  │                                 │                                │
  ←── 6a. create_auth 回调 ─────────┤                                │
  │    (AuthCode, 推送到模版回调URL)  │                                │
  │                                 │                                │
  ←── 6b. 重定向到 redirect_uri ────┤                                │
  │    (?auth_code=xxx&state=xxx)    │                                │
  │                                 │                                │
  ├─ 7. POST /service/v2/get_permanent_code ─→                       │
  │    (auth_code)                  │                                │
  ←── permanent_code + auth_info ───┤                                │
  │                                 │                                │
  ├─ 8. 持久化存储 permanent_code    │                                │
  │    + auth_corpid                │                                │
  └─ 9. 开始调用业务 API ───────────→                                │
```

### 2.2 授权码体系

| 授权码类型 | 有效期 | 可复用 | 获取方式 |
|-----------|--------|--------|---------|
| pre_auth_code | 20 分钟 | 多次使用（生成多个授权链接） | `GET /service/get_pre_auth_code` |
| auth_code | 约 20 分钟 | **一次性**，换取后立即失效 | 授权成功后回调/重定向携带 |
| permanent_code | **永久有效** | 持久使用 | `POST /service/v2/get_permanent_code` |

### 2.3 授权链接格式

```
https://open.work.weixin.qq.com/3rdapp/install?suite_id=SUITE_ID&pre_auth_code=PRE_AUTH_CODE&redirect_uri=REDIRECT_URI&state=STATE
```

| 参数 | 必填 | 说明 |
|------|------|------|
| suite_id | 是 | 代开发应用模版 ID |
| pre_auth_code | 是 | 预授权码（20 分钟有效） |
| redirect_uri | 是 | 授权成功后重定向地址，**必须 URL encode** |
| state | 否 | 自定义参数，原样回传，**最长 128 字节** |

授权成功后重定向到：
```
{redirect_uri}?auth_code=xxx&state=xxx&expires_in=1200
```

### 2.4 两种凭证的 API 分布

| 凭证类型 | 使用的 API |
|---------|-----------|
| suite_access_token | get_pre_auth_code, set_session_info, get_permanent_code, get_auth_info, get_app_permissions |
| provider_access_token | get_customized_auth_url |

> **注意**：`get_customized_auth_url` 使用的是 **provider_access_token**（第三种凭证），不是 suite_access_token。这是服务商级别的凭证，通过服务商 corpid + provider_secret 获取。

### 2.5 授权类型 (auth_type)

| auth_type | 含义 | 使用场景 |
|-----------|------|---------|
| 0 | 正式授权 | 生产环境 |
| 1 | 测试授权 | 开发调试（不消耗授权名额） |

---

## 3. API 速查表

| 编号 | 名称 | 方法 | 路径 | 凭证 |
|------|------|------|------|------|
| A1 | 获取预授权码 | GET | `/service/get_pre_auth_code` | suite_access_token |
| A2 | 设置授权配置 | POST | `/service/set_session_info` | suite_access_token |
| A3 | 获取企业永久授权码 | POST | `/service/v2/get_permanent_code` | suite_access_token |
| A4 | 获取企业授权信息 | POST | `/service/get_auth_info` | suite_access_token |
| A5 | 获取企业凭证 | POST | `/service/get_corp_token` | suite_access_token |
| A6 | 获取带参授权链接 | POST | `/service/get_customized_auth_url` | provider_access_token |
| A7 | 获取应用接口权限详情 | POST | `/service/get_app_permissions` | suite_access_token |

> **A5** (get_corp_token) 已在 `wecom-isv-core` 中详细说明，本 SKILL 仅作引用。

---

## 4. API 详情

### 4.1 A1 — 获取预授权码

`GET /cgi-bin/service/get_pre_auth_code?suite_access_token=SUITE_ACCESS_TOKEN`

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| suite_access_token | string | 是 | URL query 参数 |

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| pre_auth_code | string | 预授权码 |
| expires_in | int | 有效期，固定 1200 秒（20 分钟） |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "pre_auth_code": "pCZaABCD1234567890",
  "expires_in": 1200
}
```

**注意:**
- 预授权码有效期 **20 分钟**，不要提前批量获取缓存
- 一个预授权码可用于生成多个授权链接（不同 redirect_uri / state）
- 每次生成授权链接前获取新的预授权码是最安全的做法

---

### 4.2 A2 — 设置授权配置

`POST /cgi-bin/service/set_session_info?suite_access_token=SUITE_ACCESS_TOKEN`

**请求参数 (JSON Body):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pre_auth_code | string | 是 | 预授权码 |
| session_info | object | 是 | 授权配置 |
| session_info.appid | int[] | 否 | 允许授权的应用 agentid 列表 |
| session_info.auth_type | int | 否 | 授权类型：0=正式(默认), 1=测试 |

**请求示例:**

```json
{
  "pre_auth_code": "pCZaABCD1234567890",
  "session_info": {
    "appid": [1, 2],
    "auth_type": 0
  }
}
```

**返回:** 标准 errcode / errmsg

**注意:**
- 必须在**拼接授权链接之前**调用（拿到 pre_auth_code 后、引导企业扫码前）
- `auth_type=1`（测试授权）仅用于开发调试，正式环境使用 `auth_type=0`
- `appid` 可以限制企业只能授权指定的应用，不传则展示模版下所有应用
- 此接口幂等，多次调用以最后一次为准

---

### 4.3 A3 — 获取企业永久授权码 (v2)

`POST /cgi-bin/service/v2/get_permanent_code?suite_access_token=SUITE_ACCESS_TOKEN`

**请求参数 (JSON Body):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| auth_code | string | 是 | 临时授权码（一次有效） |

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | 企业 access_token（可直接使用） |
| expires_in | int | access_token 有效期 |
| permanent_code | string | 企业永久授权码 |
| auth_corp_info | object | 授权企业信息 |
| auth_corp_info.corpid | string | 授权企业 corpid（服务商加密） |
| auth_corp_info.corp_name | string | 企业名称 |
| auth_corp_info.corp_type | string | 企业类型 |
| auth_corp_info.corp_round_logo_url | string | 圆形头像 |
| auth_corp_info.corp_square_logo_url | string | 方形头像 |
| auth_corp_info.corp_user_max | int | 企业最大成员数 |
| auth_corp_info.corp_full_name | string | 企业全称 |
| auth_corp_info.corp_scale | string | 企业规模 |
| auth_corp_info.corp_industry | string | 所属行业 |
| auth_corp_info.corp_sub_industry | string | 子行业 |
| auth_info | object | 授权信息 |
| auth_info.agent | object[] | 授权应用列表 |
| auth_info.agent[].agentid | int | 应用 ID |
| auth_info.agent[].name | string | 应用名称 |
| auth_info.agent[].square_logo_url | string | 应用头像 |
| auth_info.agent[].privilege | object | 权限信息 |
| auth_info.agent[].privilege.level | int | 权限等级 |
| auth_info.agent[].privilege.allow_party | int[] | 可见部门 ID 列表 |
| auth_info.agent[].privilege.allow_user | string[] | 可见成员 userid 列表 |
| auth_info.agent[].privilege.allow_tag | int[] | 可见标签 ID 列表 |
| auth_info.agent[].privilege.extra_party | int[] | 额外通讯录部门 |
| auth_info.agent[].privilege.extra_user | string[] | 额外通讯录成员 |
| auth_info.agent[].privilege.extra_tag | int[] | 额外通讯录标签 |
| auth_user_info | object | 授权管理员信息 |
| auth_user_info.userid | string | 管理员 userid |
| auth_user_info.open_userid | string | 管理员 open_userid |
| auth_user_info.name | string | 管理员名称 |
| auth_user_info.avatar | string | 管理员头像 |

**返回示例:**

```json
{
  "access_token": "xxxxxx",
  "expires_in": 7200,
  "permanent_code": "xxxx",
  "auth_corp_info": {
    "corpid": "xxxx",
    "corp_name": "示例企业",
    "corp_type": "verified",
    "corp_round_logo_url": "https://p.qlogo.cn/...",
    "corp_square_logo_url": "https://p.qlogo.cn/...",
    "corp_user_max": 50,
    "corp_full_name": "示例科技有限公司",
    "corp_scale": "1-50",
    "corp_industry": "IT",
    "corp_sub_industry": "软件"
  },
  "auth_info": {
    "agent": [{
      "agentid": 1,
      "name": "代开发应用",
      "square_logo_url": "https://p.qlogo.cn/...",
      "privilege": {
        "level": 1,
        "allow_party": [1, 2],
        "allow_user": ["user1"],
        "allow_tag": [1],
        "extra_party": [],
        "extra_user": [],
        "extra_tag": []
      }
    }]
  },
  "auth_user_info": {
    "userid": "admin_userid",
    "open_userid": "open_admin_userid",
    "name": "管理员",
    "avatar": "https://p.qlogo.cn/..."
  }
}
```

**关键规则:**
1. `auth_code` **一次有效**，重复使用返回错误码 84014
2. `permanent_code` **必须持久化**（数据库），与 auth_corpid 对应存储，丢失后无法重新获取
3. 返回的 `access_token` 可直接调用业务 API，无需再调 `get_corp_token`
4. 使用 **v2 版本路径**（`/service/v2/get_permanent_code`），非 v1
5. 返回的 corpid 是**服务商主体加密**后的值，非企业原始 corpid

---

### 4.4 A4 — 获取企业授权信息

`POST /cgi-bin/service/get_auth_info?suite_access_token=SUITE_ACCESS_TOKEN`

**请求参数 (JSON Body):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| auth_corpid | string | 是 | 授权企业的 corpid |
| permanent_code | string | 是 | 企业永久授权码 |

**请求示例:**

```json
{
  "auth_corpid": "wxXXXXXXXXXXXX",
  "permanent_code": "permanent_code_value"
}
```

**返回字段:**

返回结构与 A3 类似，但不包含 `access_token` 和 `permanent_code`，主要包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| auth_corp_info | object | 企业信息（同 A3） |
| auth_info | object | 授权应用信息（含 agent 列表和 privilege） |
| auth_user_info | object | 授权管理员信息 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "auth_corp_info": {
    "corpid": "wxXXXXXXXXXXXX",
    "corp_name": "示例企业",
    "corp_full_name": "示例科技有限公司"
  },
  "auth_info": {
    "agent": [{
      "agentid": 1,
      "name": "代开发应用",
      "privilege": {
        "level": 1,
        "allow_party": [1, 2, 3],
        "allow_user": ["user1", "user2"],
        "allow_tag": [1, 2]
      }
    }]
  },
  "auth_user_info": {
    "userid": "admin_userid",
    "open_userid": "open_admin_userid",
    "name": "管理员",
    "avatar": "https://p.qlogo.cn/..."
  }
}
```

**注意:**
- 通常在收到 `change_auth` 回调后调用，获取最新的授权信息（权限/可见范围可能变化）
- 需要 permanent_code，因此必须在首次授权时已持久化存储

---

### 4.5 A6 — 获取带参授权链接

`POST /cgi-bin/service/get_customized_auth_url?provider_access_token=PROVIDER_ACCESS_TOKEN`

> **注意**：此接口使用 **provider_access_token**，不是 suite_access_token。

**请求参数 (JSON Body):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| state | string | 否 | 自定义参数，原样回传 |
| templateid_list | string[] | 是 | 代开发模版 ID 列表 |

**请求示例:**

```json
{
  "state": "channel_001",
  "templateid_list": ["dk00000000000000001"]
}
```

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| qrcode_url | string | 授权二维码链接 |
| expires_in | int | 链接有效期（秒） |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "qrcode_url": "https://open.work.weixin.qq.com/3rdservice/...",
  "expires_in": 7200
}
```

**注意:**
- 使用 **provider_access_token**（服务商级凭证），获取方式：`POST /service/get_provider_token`（corpid + provider_secret）
- 适用于嵌入服务商自有平台的授权场景，无需拼接授权链接
- `templateid_list` 可指定多个模版，企业管理员扫码后可选择授权

---

### 4.6 A7 — 获取应用接口权限详情

`POST /cgi-bin/service/get_app_permissions?suite_access_token=SUITE_ACCESS_TOKEN`

**请求参数 (JSON Body):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| auth_corpid | string | 是 | 授权企业的 corpid |
| permanent_code | string | 是 | 企业永久授权码 |

**请求示例:**

```json
{
  "auth_corpid": "wxXXXXXXXXXXXX",
  "permanent_code": "permanent_code_value"
}
```

**返回字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| api_group | object[] | API 分组权限列表 |
| api_group[].group_name | string | API 分组名称 |
| api_group[].api_list | object[] | API 列表 |
| api_group[].api_list[].api_name | string | API 名称 |
| api_group[].api_list[].api_id | string | API 标识 |
| api_group[].api_list[].granted | int | 1=已授权, 0=未授权 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "api_group": [
    {
      "group_name": "通讯录读取",
      "api_list": [
        { "api_name": "获取成员详情", "api_id": "contact_read_member", "granted": 1 },
        { "api_name": "获取部门列表", "api_id": "contact_read_department", "granted": 1 }
      ]
    },
    {
      "group_name": "客户联系",
      "api_list": [
        { "api_name": "获取客户列表", "api_id": "crm_read", "granted": 0 }
      ]
    }
  ]
}
```

**注意:**
- 用于判断当前企业授权了哪些 API 权限
- 配合 `change_auth` 回调使用，权限变更时重新查询
- 未授权的 API 调用将返回 48002（API 接口无权限）

---

## 5. 回调事件

授权相关回调事件推送到**模版回调 URL**（非应用回调 URL）。

### 5.1 回调事件一览

| InfoType | 名称 | 特有字段 | 触发时机 |
|----------|------|---------|---------|
| create_auth | 授权成功 | AuthCode | 企业管理员完成扫码授权 |
| change_auth | 授权变更 | AuthCorpId | 企业修改权限/可见范围 |
| cancel_auth | 取消授权 | AuthCorpId | 企业管理员取消授权 |

> 以上事件均推送到**模版回调 URL**，使用 suite_key（suite_id 对应的 Token + EncodingAESKey）解密。

### 5.2 create_auth — 授权成功

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[create_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCode><![CDATA[temporary_auth_code]]></AuthCode>
</xml>
```

| 字段 | 说明 |
|------|------|
| SuiteId | 代开发应用模版 ID |
| InfoType | 固定 `create_auth` |
| TimeStamp | 时间戳 |
| AuthCode | 临时授权码（一次有效），用于换取 permanent_code |

**处理流程:**
1. 立即响应 `"success"`（5 秒内）
2. 用 AuthCode 调用 `POST /service/v2/get_permanent_code` 换取永久授权码
3. 持久化存储 `permanent_code` + `auth_corpid`（数据库）
4. 可选：记录 auth_corp_info（企业名称、规模等）用于后台管理

### 5.3 change_auth — 授权变更

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[change_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>
```

| 字段 | 说明 |
|------|------|
| AuthCorpId | 授权变更的企业 corpid |

**触发场景:**
- 企业管理员修改了应用可见范围
- 企业管理员确认/拒绝了新的权限申请
- 服务商修改模版权限后，企业管理员进行了操作

**处理流程:**
1. 立即响应 `"success"`
2. 调用 `POST /service/get_auth_info`（A4）获取最新授权信息
3. 对比并更新本地存储的权限、可见范围数据
4. 可选：调用 `POST /service/get_app_permissions`（A7）获取详细权限

### 5.4 cancel_auth — 取消授权

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[cancel_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>
```

| 字段 | 说明 |
|------|------|
| AuthCorpId | 取消授权的企业 corpid |

**处理流程:**
1. 立即响应 `"success"`
2. 标记该企业为「已取消授权」状态（**不要立即删除数据**，可能需要审计）
3. 停止该企业的定时任务、消息推送等服务
4. 清理该企业的 corp access_token 缓存
5. 可选：记录取消授权时间，用于数据统计

---

## 6. 典型工作流

### 6.1 首次授权流程

```
步骤 1: 获取预授权码
    GET /service/get_pre_auth_code?suite_access_token=SUITE_TOKEN
    → 获取 pre_auth_code（20 分钟有效）

步骤 2: 设置授权配置（可选）
    POST /service/set_session_info?suite_access_token=SUITE_TOKEN
    → 指定可授权的应用列表和授权类型

步骤 3: 拼接授权链接
    https://open.work.weixin.qq.com/3rdapp/install
      ?suite_id=SUITE_ID
      &pre_auth_code=PRE_AUTH_CODE
      &redirect_uri=URL_ENCODED_REDIRECT_URI
      &state=CUSTOM_STATE
    → 引导企业管理员打开此链接

步骤 4: 接收授权回调（两个通道同时触发）
    通道 A: create_auth 推送到模版回调 URL（含 AuthCode）
    通道 B: 重定向到 redirect_uri?auth_code=xxx&state=xxx

步骤 5: 换取永久授权码
    POST /service/v2/get_permanent_code?suite_access_token=SUITE_TOKEN
    Body: { "auth_code": "xxx" }
    → 获取 permanent_code + auth_corp_info + auth_info

步骤 6: 持久化存储
    存储到数据库: auth_corpid → permanent_code 映射
    记录企业信息: corp_name, corp_full_name, agent_list 等

步骤 7: 开始服务
    → 使用 permanent_code 获取 corp access_token
    → 调用业务 API（通讯录/消息/客户联系等）
```

### 6.2 授权变更处理

```
步骤 1: 收到 change_auth 回调
    → 获取 AuthCorpId

步骤 2: 查询最新授权信息
    POST /service/get_auth_info
    Body: { "auth_corpid": "xxx", "permanent_code": "xxx" }
    → 获取最新的 agent privilege（allow_party/allow_user/allow_tag）

步骤 3: 查询权限详情（可选）
    POST /service/get_app_permissions
    Body: { "auth_corpid": "xxx", "permanent_code": "xxx" }
    → 获取各 API 分组的授权状态

步骤 4: 更新本地数据
    → 对比旧数据，更新可见范围和权限
    → 记录变更日志
    → 如有新增权限，启用对应功能
    → 如有权限收回，停用对应功能并通知运营
```

### 6.3 取消授权处理

```
步骤 1: 收到 cancel_auth 回调
    → 获取 AuthCorpId

步骤 2: 停止服务
    → 停止该企业的定时任务（同步/推送等）
    → 清理 corp access_token 缓存

步骤 3: 数据处理
    → 标记企业状态为「已取消授权」
    → 保留 permanent_code（企业可能重新授权）
    → 记录取消时间

步骤 4: 通知运营（可选）
    → 发送企业取消授权通知
    → 更新统计面板
```

### 6.4 重新授权流程

```
企业取消授权后重新扫码授权
    → 触发 create_auth 回调（新的 AuthCode）
    → 调用 get_permanent_code 获取新的 permanent_code
    → 更新数据库中该企业的 permanent_code（新值替换旧值）
    → 更新企业状态为「已授权」
    → 重新启动服务
```

---

## 7. 代码模板

### 7.1 Python

```python
"""企业微信服务商代开发授权流程管理"""
from urllib.parse import quote
from wecom_isv_client import WeComISVClient  # 继承自 wecom-isv-core


class ISVAuthManager:
    """授权流程管理器，处理完整的授权生命周期"""

    AUTH_INSTALL_URL = "https://open.work.weixin.qq.com/3rdapp/install"

    def __init__(self, client: WeComISVClient):
        self.client = client

    # ─── A1: 获取预授权码 ───

    def get_pre_auth_code(self) -> dict:
        """获取预授权码（有效期 20 分钟）

        Returns:
            {"pre_auth_code": "xxx", "expires_in": 1200}
        """
        resp = self.client._make_suite_request(
            "GET", "/service/get_pre_auth_code"
        )
        return {
            "pre_auth_code": resp["pre_auth_code"],
            "expires_in": resp["expires_in"],
        }

    # ─── A2: 设置授权配置 ───

    def set_session_info(
        self,
        pre_auth_code: str,
        *,
        appid: list[int] | None = None,
        auth_type: int = 0,
    ) -> dict:
        """设置授权配置（在拼接授权链接之前调用）

        Args:
            pre_auth_code: 预授权码
            appid: 允许授权的应用 agentid 列表
            auth_type: 0=正式授权, 1=测试授权
        """
        session_info = {"auth_type": auth_type}
        if appid is not None:
            session_info["appid"] = appid
        body = {
            "pre_auth_code": pre_auth_code,
            "session_info": session_info,
        }
        return self.client._make_suite_request(
            "POST", "/service/set_session_info", json=body
        )

    # ─── 拼接授权链接 ───

    def build_auth_url(
        self,
        pre_auth_code: str,
        redirect_uri: str,
        state: str = "",
    ) -> str:
        """拼接授权安装链接

        Args:
            pre_auth_code: 预授权码
            redirect_uri: 授权成功后重定向地址（自动 URL encode）
            state: 自定义参数，原样回传（最长 128 字节）

        Returns:
            完整的授权链接 URL
        """
        if len(state.encode("utf-8")) > 128:
            raise ValueError("state 参数最长 128 字节")

        encoded_uri = quote(redirect_uri, safe="")
        url = (
            f"{self.AUTH_INSTALL_URL}"
            f"?suite_id={self.client.suite_id}"
            f"&pre_auth_code={pre_auth_code}"
            f"&redirect_uri={encoded_uri}"
        )
        if state:
            url += f"&state={state}"
        return url

    # ─── A3: 获取企业永久授权码 (v2) ───

    def get_permanent_code(self, auth_code: str) -> dict:
        """用临时授权码换取永久授权码

        Args:
            auth_code: 临时授权码（一次有效）

        Returns:
            包含 permanent_code, auth_corp_info, auth_info, auth_user_info
        """
        resp = self.client._make_suite_request(
            "POST",
            "/service/v2/get_permanent_code",
            json={"auth_code": auth_code},
        )
        # 自动注册到 ISVClient
        corpid = resp["auth_corp_info"]["corpid"]
        self.client.register_corp(corpid, resp["permanent_code"])
        return resp

    # ─── A4: 获取企业授权信息 ───

    def get_auth_info(self, auth_corpid: str, permanent_code: str) -> dict:
        """获取企业授权信息

        Args:
            auth_corpid: 授权企业的 corpid
            permanent_code: 企业永久授权码

        Returns:
            包含 auth_corp_info, auth_info, auth_user_info
        """
        return self.client._make_suite_request(
            "POST",
            "/service/get_auth_info",
            json={
                "auth_corpid": auth_corpid,
                "permanent_code": permanent_code,
            },
        )

    # ─── A7: 获取应用接口权限详情 ───

    def get_app_permissions(self, auth_corpid: str, permanent_code: str) -> dict:
        """获取应用接口权限详情

        Args:
            auth_corpid: 授权企业的 corpid
            permanent_code: 企业永久授权码

        Returns:
            包含 api_group 列表（各 API 分组的授权状态）
        """
        return self.client._make_suite_request(
            "POST",
            "/service/get_app_permissions",
            json={
                "auth_corpid": auth_corpid,
                "permanent_code": permanent_code,
            },
        )

    # ─── A6: 获取带参授权链接 ───

    def get_customized_auth_url(
        self,
        provider_access_token: str,
        templateid_list: list[str],
        state: str = "",
    ) -> dict:
        """获取带参授权链接（使用 provider_access_token）

        注意：此接口使用 provider_access_token，不是 suite_access_token

        Args:
            provider_access_token: 服务商凭证
            templateid_list: 代开发模版 ID 列表
            state: 自定义参数

        Returns:
            {"qrcode_url": "https://...", "expires_in": 7200}
        """
        import requests

        body = {"templateid_list": templateid_list}
        if state:
            body["state"] = state
        resp = requests.post(
            f"{self.client.BASE_URL}/service/get_customized_auth_url",
            params={"provider_access_token": provider_access_token},
            json=body,
            timeout=10,
        ).json()
        if resp.get("errcode", 0) != 0:
            from wecom_isv_client import WeComISVError
            raise WeComISVError(resp.get("errcode", -1), resp.get("errmsg", "unknown"))
        return resp

    # ─── 回调处理 ───

    def handle_auth_callback(self, info_type: str, data: dict) -> dict | None:
        """统一处理授权回调事件

        Args:
            info_type: 回调类型（create_auth / change_auth / cancel_auth）
            data: 解密后的回调数据

        Returns:
            create_auth → permanent_code 换取结果
            change_auth → get_auth_info 查询结果
            cancel_auth → None
        """
        if info_type == "create_auth":
            auth_code = data["AuthCode"]
            return self.get_permanent_code(auth_code)

        elif info_type == "change_auth":
            auth_corpid = data["AuthCorpId"]
            # 需要从数据库获取 permanent_code
            permanent_code = self._load_permanent_code(auth_corpid)
            if not permanent_code:
                raise RuntimeError(f"企业 {auth_corpid} 的 permanent_code 未找到")
            return self.get_auth_info(auth_corpid, permanent_code)

        elif info_type == "cancel_auth":
            auth_corpid = data["AuthCorpId"]
            self._handle_cancel_auth(auth_corpid)
            return None

        else:
            raise ValueError(f"未知的授权回调类型: {info_type}")

    def _load_permanent_code(self, auth_corpid: str) -> str | None:
        """从数据库加载 permanent_code（需业务层实现）

        示例实现:
            return db.query("SELECT permanent_code FROM corp_auth WHERE corpid = ?", auth_corpid)
        """
        # 先尝试从 ISVClient 内存缓存获取
        corp = self.client._corp_tokens.get(auth_corpid)
        if corp:
            return corp.get("permanent_code")
        # TODO: 从数据库加载
        return None

    def _handle_cancel_auth(self, auth_corpid: str):
        """处理取消授权（需业务层实现）

        示例实现:
            db.execute("UPDATE corp_auth SET status='cancelled' WHERE corpid = ?", auth_corpid)
            stop_scheduled_tasks(auth_corpid)
        """
        # 清理 ISVClient 内存缓存
        self.client._corp_tokens.pop(auth_corpid, None)
        # TODO: 更新数据库状态、停止服务

    # ─── 便捷方法：完整授权链接生成 ───

    def create_auth_url(
        self,
        redirect_uri: str,
        state: str = "",
        *,
        appid: list[int] | None = None,
        auth_type: int = 0,
    ) -> str:
        """一站式生成授权链接（获取预授权码 + 设置配置 + 拼接链接）

        Args:
            redirect_uri: 授权成功后重定向地址
            state: 自定义参数（最长 128 字节）
            appid: 允许授权的应用 agentid 列表
            auth_type: 0=正式授权, 1=测试授权

        Returns:
            完整的授权链接 URL
        """
        # 获取预授权码
        result = self.get_pre_auth_code()
        pre_auth_code = result["pre_auth_code"]

        # 设置授权配置
        if appid is not None or auth_type != 0:
            self.set_session_info(
                pre_auth_code, appid=appid, auth_type=auth_type
            )

        # 拼接授权链接
        return self.build_auth_url(pre_auth_code, redirect_uri, state)
```

**ISVClient 扩展方法（在 wecom-isv-core 的 WeComISVClient 基础上）:**

```python
# 在 WeComISVClient 中添加以下方法，用于 suite_access_token 级别的请求

def _make_suite_request(self, method: str, path: str, **kwargs) -> dict:
    """使用 suite_access_token 调用服务商级 API

    与 request() 方法不同，此方法用于无需 corp access_token 的 API
    """
    import requests as req_lib

    url = f"{self.BASE_URL}{path}"
    params = kwargs.pop("params", {})
    params["suite_access_token"] = self.suite_access_token
    resp = req_lib.request(
        method, url, params=params, timeout=10, **kwargs
    ).json()
    if resp.get("errcode", 0) != 0:
        raise WeComISVError(resp.get("errcode", -1), resp.get("errmsg", "unknown"))
    return resp
```

### 7.2 TypeScript

```typescript
/** 企业微信服务商代开发授权流程管理 */
import { WeComISVClient, WeComISVError } from './wecom-isv-client'; // 继承自 wecom-isv-core
import axios from 'axios';

/** 授权企业信息 */
interface AuthCorpInfo {
  corpid: string;
  corp_name: string;
  corp_type: string;
  corp_round_logo_url: string;
  corp_square_logo_url: string;
  corp_user_max: number;
  corp_full_name: string;
  corp_scale: string;
  corp_industry: string;
  corp_sub_industry: string;
}

/** 授权应用权限 */
interface AgentPrivilege {
  level: number;
  allow_party: number[];
  allow_user: string[];
  allow_tag: number[];
  extra_party: number[];
  extra_user: string[];
  extra_tag: number[];
}

/** 授权应用信息 */
interface AuthAgent {
  agentid: number;
  name: string;
  square_logo_url: string;
  privilege: AgentPrivilege;
}

/** 授权管理员信息 */
interface AuthUserInfo {
  userid: string;
  open_userid: string;
  name: string;
  avatar: string;
}

/** get_permanent_code 返回 */
interface PermanentCodeResult {
  access_token: string;
  expires_in: number;
  permanent_code: string;
  auth_corp_info: AuthCorpInfo;
  auth_info: { agent: AuthAgent[] };
  auth_user_info: AuthUserInfo;
}

/** get_auth_info 返回 */
interface AuthInfoResult {
  auth_corp_info: AuthCorpInfo;
  auth_info: { agent: AuthAgent[] };
  auth_user_info: AuthUserInfo;
}

/** API 权限详情 */
interface ApiPermissionItem {
  api_name: string;
  api_id: string;
  granted: number;
}

interface ApiGroupPermission {
  group_name: string;
  api_list: ApiPermissionItem[];
}

/** 带参授权链接返回 */
interface CustomizedAuthUrlResult {
  qrcode_url: string;
  expires_in: number;
}

export class ISVAuthManager {
  private static readonly AUTH_INSTALL_URL = 'https://open.work.weixin.qq.com/3rdapp/install';
  private static readonly BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';

  constructor(private client: WeComISVClient) {}

  /** A1: 获取预授权码（有效期 20 分钟） */
  async getPreAuthCode(): Promise<{ pre_auth_code: string; expires_in: number }> {
    const suiteToken = await this.client.getSuiteAccessToken();
    const { data } = await axios.get(
      `${ISVAuthManager.BASE_URL}/service/get_pre_auth_code`,
      { params: { suite_access_token: suiteToken }, timeout: 10_000 },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    return { pre_auth_code: data.pre_auth_code, expires_in: data.expires_in };
  }

  /** A2: 设置授权配置 */
  async setSessionInfo(
    preAuthCode: string,
    options?: { appid?: number[]; authType?: number },
  ): Promise<void> {
    const suiteToken = await this.client.getSuiteAccessToken();
    const sessionInfo: Record<string, unknown> = { auth_type: options?.authType ?? 0 };
    if (options?.appid) sessionInfo.appid = options.appid;
    const { data } = await axios.post(
      `${ISVAuthManager.BASE_URL}/service/set_session_info`,
      { pre_auth_code: preAuthCode, session_info: sessionInfo },
      { params: { suite_access_token: suiteToken }, timeout: 10_000 },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
  }

  /** 拼接授权安装链接 */
  buildAuthUrl(preAuthCode: string, redirectUri: string, state = ''): string {
    if (Buffer.byteLength(state, 'utf8') > 128) {
      throw new Error('state 参数最长 128 字节');
    }
    const encodedUri = encodeURIComponent(redirectUri);
    let url = `${ISVAuthManager.AUTH_INSTALL_URL}`
      + `?suite_id=${(this.client as any).suiteId}`
      + `&pre_auth_code=${preAuthCode}`
      + `&redirect_uri=${encodedUri}`;
    if (state) url += `&state=${state}`;
    return url;
  }

  /** A3: 获取企业永久授权码 (v2) */
  async getPermanentCode(authCode: string): Promise<PermanentCodeResult> {
    const suiteToken = await this.client.getSuiteAccessToken();
    const { data } = await axios.post(
      `${ISVAuthManager.BASE_URL}/service/v2/get_permanent_code`,
      { auth_code: authCode },
      { params: { suite_access_token: suiteToken }, timeout: 10_000 },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    // 自动注册到 ISVClient
    const corpId = data.auth_corp_info.corpid;
    this.client.registerCorp(corpId, data.permanent_code);
    return data as PermanentCodeResult;
  }

  /** A4: 获取企业授权信息 */
  async getAuthInfo(authCorpId: string, permanentCode: string): Promise<AuthInfoResult> {
    const suiteToken = await this.client.getSuiteAccessToken();
    const { data } = await axios.post(
      `${ISVAuthManager.BASE_URL}/service/get_auth_info`,
      { auth_corpid: authCorpId, permanent_code: permanentCode },
      { params: { suite_access_token: suiteToken }, timeout: 10_000 },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    return data as AuthInfoResult;
  }

  /** A7: 获取应用接口权限详情 */
  async getAppPermissions(
    authCorpId: string,
    permanentCode: string,
  ): Promise<{ api_group: ApiGroupPermission[] }> {
    const suiteToken = await this.client.getSuiteAccessToken();
    const { data } = await axios.post(
      `${ISVAuthManager.BASE_URL}/service/get_app_permissions`,
      { auth_corpid: authCorpId, permanent_code: permanentCode },
      { params: { suite_access_token: suiteToken }, timeout: 10_000 },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    return { api_group: data.api_group ?? [] };
  }

  /** A6: 获取带参授权链接（使用 provider_access_token） */
  async getCustomizedAuthUrl(
    providerAccessToken: string,
    templateidList: string[],
    state = '',
  ): Promise<CustomizedAuthUrlResult> {
    const body: Record<string, unknown> = { templateid_list: templateidList };
    if (state) body.state = state;
    const { data } = await axios.post(
      `${ISVAuthManager.BASE_URL}/service/get_customized_auth_url`,
      body,
      { params: { provider_access_token: providerAccessToken }, timeout: 10_000 },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    return { qrcode_url: data.qrcode_url, expires_in: data.expires_in };
  }

  /** 统一处理授权回调事件 */
  async handleAuthCallback(
    infoType: string,
    callbackData: Record<string, string>,
  ): Promise<PermanentCodeResult | AuthInfoResult | null> {
    switch (infoType) {
      case 'create_auth': {
        const authCode = callbackData.AuthCode;
        return this.getPermanentCode(authCode);
      }
      case 'change_auth': {
        const authCorpId = callbackData.AuthCorpId;
        const permanentCode = await this.loadPermanentCode(authCorpId);
        if (!permanentCode) throw new Error(`企业 ${authCorpId} 的 permanent_code 未找到`);
        return this.getAuthInfo(authCorpId, permanentCode);
      }
      case 'cancel_auth': {
        const authCorpId = callbackData.AuthCorpId;
        await this.handleCancelAuth(authCorpId);
        return null;
      }
      default:
        throw new Error(`未知的授权回调类型: ${infoType}`);
    }
  }

  /** 一站式生成授权链接 */
  async createAuthUrl(
    redirectUri: string,
    state = '',
    options?: { appid?: number[]; authType?: number },
  ): Promise<string> {
    const { pre_auth_code } = await this.getPreAuthCode();
    if (options?.appid || (options?.authType ?? 0) !== 0) {
      await this.setSessionInfo(pre_auth_code, options);
    }
    return this.buildAuthUrl(pre_auth_code, redirectUri, state);
  }

  /** 从数据库加载 permanent_code（需业务层实现） */
  private async loadPermanentCode(authCorpId: string): Promise<string | null> {
    // TODO: 从数据库加载
    // return await db.query('SELECT permanent_code FROM corp_auth WHERE corpid = ?', authCorpId);
    return null;
  }

  /** 处理取消授权（需业务层实现） */
  private async handleCancelAuth(authCorpId: string): Promise<void> {
    // TODO: 更新数据库状态、停止服务
    // await db.execute("UPDATE corp_auth SET status='cancelled' WHERE corpid = ?", authCorpId);
    // await stopScheduledTasks(authCorpId);
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/url"
)

const authInstallURL = "https://open.work.weixin.qq.com/3rdapp/install"

// ISVAuthManager 服务商代开发授权流程管理器
type ISVAuthManager struct {
	client *ISVClient // 继承自 wecom-isv-core
}

// NewISVAuthManager 创建授权管理器
func NewISVAuthManager(client *ISVClient) *ISVAuthManager {
	return &ISVAuthManager{client: client}
}

// ─── 响应结构体 ───

// AuthCorpInfo 授权企业信息
type AuthCorpInfo struct {
	CorpID            string `json:"corpid"`
	CorpName          string `json:"corp_name"`
	CorpType          string `json:"corp_type"`
	CorpRoundLogoURL  string `json:"corp_round_logo_url"`
	CorpSquareLogoURL string `json:"corp_square_logo_url"`
	CorpUserMax       int    `json:"corp_user_max"`
	CorpFullName      string `json:"corp_full_name"`
	CorpScale         string `json:"corp_scale"`
	CorpIndustry      string `json:"corp_industry"`
	CorpSubIndustry   string `json:"corp_sub_industry"`
}

// AgentPrivilege 应用权限信息
type AgentPrivilege struct {
	Level      int      `json:"level"`
	AllowParty []int    `json:"allow_party"`
	AllowUser  []string `json:"allow_user"`
	AllowTag   []int    `json:"allow_tag"`
	ExtraParty []int    `json:"extra_party"`
	ExtraUser  []string `json:"extra_user"`
	ExtraTag   []int    `json:"extra_tag"`
}

// AuthAgent 授权应用信息
type AuthAgent struct {
	AgentID       int            `json:"agentid"`
	Name          string         `json:"name"`
	SquareLogoURL string         `json:"square_logo_url"`
	Privilege     AgentPrivilege `json:"privilege"`
}

// AuthUserInfo 授权管理员信息
type AuthUserInfo struct {
	UserID     string `json:"userid"`
	OpenUserID string `json:"open_userid"`
	Name       string `json:"name"`
	Avatar     string `json:"avatar"`
}

// PermanentCodeResult get_permanent_code 返回结果
type PermanentCodeResult struct {
	BaseResp
	AccessToken   string       `json:"access_token"`
	ExpiresIn     int          `json:"expires_in"`
	PermanentCode string       `json:"permanent_code"`
	AuthCorpInfo  AuthCorpInfo `json:"auth_corp_info"`
	AuthInfo      struct {
		Agent []AuthAgent `json:"agent"`
	} `json:"auth_info"`
	AuthUserInfo AuthUserInfo `json:"auth_user_info"`
}

// AuthInfoResult get_auth_info 返回结果
type AuthInfoResult struct {
	BaseResp
	AuthCorpInfo AuthCorpInfo `json:"auth_corp_info"`
	AuthInfo     struct {
		Agent []AuthAgent `json:"agent"`
	} `json:"auth_info"`
	AuthUserInfo AuthUserInfo `json:"auth_user_info"`
}

// PreAuthCodeResult 预授权码返回结果
type PreAuthCodeResult struct {
	BaseResp
	PreAuthCode string `json:"pre_auth_code"`
	ExpiresIn   int    `json:"expires_in"`
}

// ApiPermissionItem API 权限项
type ApiPermissionItem struct {
	ApiName string `json:"api_name"`
	ApiID   string `json:"api_id"`
	Granted int    `json:"granted"`
}

// ApiGroupPermission API 分组权限
type ApiGroupPermission struct {
	GroupName string              `json:"group_name"`
	ApiList   []ApiPermissionItem `json:"api_list"`
}

// AppPermissionsResult 应用权限详情返回结果
type AppPermissionsResult struct {
	BaseResp
	ApiGroup []ApiGroupPermission `json:"api_group"`
}

// CustomizedAuthUrlResult 带参授权链接返回结果
type CustomizedAuthUrlResult struct {
	BaseResp
	QrcodeURL string `json:"qrcode_url"`
	ExpiresIn int    `json:"expires_in"`
}

// AuthCallbackData 授权回调解析后的数据
type AuthCallbackData struct {
	SuiteID    string
	InfoType   string
	TimeStamp  int64
	AuthCode   string // create_auth 时有值
	AuthCorpID string // change_auth / cancel_auth 时有值
}

// ─── A1: 获取预授权码 ───

// GetPreAuthCode 获取预授权码（有效期 20 分钟）
func (m *ISVAuthManager) GetPreAuthCode() (*PreAuthCodeResult, error) {
	suiteToken, err := m.client.GetSuiteAccessToken()
	if err != nil {
		return nil, fmt.Errorf("获取 suite_access_token 失败: %w", err)
	}
	reqURL := fmt.Sprintf("%s/service/get_pre_auth_code?suite_access_token=%s", baseURL, suiteToken)
	resp, err := m.client.httpClient.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result PreAuthCodeResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, &WeComError{result.ErrCode, result.ErrMsg}
	}
	return &result, nil
}

// ─── A2: 设置授权配置 ───

// SetSessionInfo 设置授权配置
func (m *ISVAuthManager) SetSessionInfo(preAuthCode string, appid []int, authType int) error {
	suiteToken, err := m.client.GetSuiteAccessToken()
	if err != nil {
		return fmt.Errorf("获取 suite_access_token 失败: %w", err)
	}
	sessionInfo := map[string]interface{}{"auth_type": authType}
	if len(appid) > 0 {
		sessionInfo["appid"] = appid
	}
	body := map[string]interface{}{
		"pre_auth_code": preAuthCode,
		"session_info":  sessionInfo,
	}
	reqURL := fmt.Sprintf("%s/service/set_session_info?suite_access_token=%s", baseURL, suiteToken)
	return m.postJSON(reqURL, body, nil)
}

// ─── 拼接授权链接 ───

// BuildAuthURL 拼接授权安装链接
func (m *ISVAuthManager) BuildAuthURL(preAuthCode, redirectURI, state string) (string, error) {
	if len([]byte(state)) > 128 {
		return "", fmt.Errorf("state 参数最长 128 字节")
	}
	encodedURI := url.QueryEscape(redirectURI)
	authURL := fmt.Sprintf(
		"%s?suite_id=%s&pre_auth_code=%s&redirect_uri=%s",
		authInstallURL, m.client.SuiteID, preAuthCode, encodedURI,
	)
	if state != "" {
		authURL += "&state=" + state
	}
	return authURL, nil
}

// ─── A3: 获取企业永久授权码 (v2) ───

// GetPermanentCode 用临时授权码换取永久授权码
func (m *ISVAuthManager) GetPermanentCode(authCode string) (*PermanentCodeResult, error) {
	suiteToken, err := m.client.GetSuiteAccessToken()
	if err != nil {
		return nil, fmt.Errorf("获取 suite_access_token 失败: %w", err)
	}
	reqURL := fmt.Sprintf("%s/service/v2/get_permanent_code?suite_access_token=%s", baseURL, suiteToken)
	var result PermanentCodeResult
	if err := m.postJSON(reqURL, map[string]string{"auth_code": authCode}, &result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, &WeComError{result.ErrCode, result.ErrMsg}
	}
	// 自动注册到 ISVClient
	m.client.RegisterCorp(result.AuthCorpInfo.CorpID, result.PermanentCode)
	return &result, nil
}

// ─── A4: 获取企业授权信息 ───

// GetAuthInfo 获取企业授权信息
func (m *ISVAuthManager) GetAuthInfo(authCorpID, permanentCode string) (*AuthInfoResult, error) {
	suiteToken, err := m.client.GetSuiteAccessToken()
	if err != nil {
		return nil, fmt.Errorf("获取 suite_access_token 失败: %w", err)
	}
	reqURL := fmt.Sprintf("%s/service/get_auth_info?suite_access_token=%s", baseURL, suiteToken)
	var result AuthInfoResult
	if err := m.postJSON(reqURL, map[string]string{
		"auth_corpid":    authCorpID,
		"permanent_code": permanentCode,
	}, &result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, &WeComError{result.ErrCode, result.ErrMsg}
	}
	return &result, nil
}

// ─── A7: 获取应用接口权限详情 ───

// GetAppPermissions 获取应用接口权限详情
func (m *ISVAuthManager) GetAppPermissions(authCorpID, permanentCode string) (*AppPermissionsResult, error) {
	suiteToken, err := m.client.GetSuiteAccessToken()
	if err != nil {
		return nil, fmt.Errorf("获取 suite_access_token 失败: %w", err)
	}
	reqURL := fmt.Sprintf("%s/service/get_app_permissions?suite_access_token=%s", baseURL, suiteToken)
	var result AppPermissionsResult
	if err := m.postJSON(reqURL, map[string]string{
		"auth_corpid":    authCorpID,
		"permanent_code": permanentCode,
	}, &result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, &WeComError{result.ErrCode, result.ErrMsg}
	}
	return &result, nil
}

// ─── A6: 获取带参授权链接 ───

// GetCustomizedAuthURL 获取带参授权链接（使用 provider_access_token）
func (m *ISVAuthManager) GetCustomizedAuthURL(providerAccessToken string, templateidList []string, state string) (*CustomizedAuthUrlResult, error) {
	body := map[string]interface{}{"templateid_list": templateidList}
	if state != "" {
		body["state"] = state
	}
	reqURL := fmt.Sprintf("%s/service/get_customized_auth_url?provider_access_token=%s", baseURL, providerAccessToken)
	var result CustomizedAuthUrlResult
	if err := m.postJSON(reqURL, body, &result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, &WeComError{result.ErrCode, result.ErrMsg}
	}
	return &result, nil
}

// ─── 回调处理 ───

// HandleAuthCallback 统一处理授权回调事件
func (m *ISVAuthManager) HandleAuthCallback(data *AuthCallbackData) (interface{}, error) {
	switch data.InfoType {
	case "create_auth":
		return m.GetPermanentCode(data.AuthCode)
	case "change_auth":
		permanentCode, err := m.loadPermanentCode(data.AuthCorpID)
		if err != nil {
			return nil, err
		}
		return m.GetAuthInfo(data.AuthCorpID, permanentCode)
	case "cancel_auth":
		m.handleCancelAuth(data.AuthCorpID)
		return nil, nil
	default:
		return nil, fmt.Errorf("未知的授权回调类型: %s", data.InfoType)
	}
}

// CreateAuthURL 一站式生成授权链接
func (m *ISVAuthManager) CreateAuthURL(redirectURI, state string, appid []int, authType int) (string, error) {
	result, err := m.GetPreAuthCode()
	if err != nil {
		return "", err
	}
	if len(appid) > 0 || authType != 0 {
		if err := m.SetSessionInfo(result.PreAuthCode, appid, authType); err != nil {
			return "", err
		}
	}
	return m.BuildAuthURL(result.PreAuthCode, redirectURI, state)
}

// ─── 内部方法 ───

func (m *ISVAuthManager) loadPermanentCode(authCorpID string) (string, error) {
	m.client.mu.RLock()
	corp, ok := m.client.corpTokens[authCorpID]
	m.client.mu.RUnlock()
	if ok && corp.PermanentCode != "" {
		return corp.PermanentCode, nil
	}
	// TODO: 从数据库加载
	return "", fmt.Errorf("企业 %s 的 permanent_code 未找到", authCorpID)
}

func (m *ISVAuthManager) handleCancelAuth(authCorpID string) {
	m.client.mu.Lock()
	delete(m.client.corpTokens, authCorpID)
	m.client.mu.Unlock()
	// TODO: 更新数据库状态、停止服务
}

func (m *ISVAuthManager) postJSON(reqURL string, body interface{}, result interface{}) error {
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}
	resp, err := m.client.httpClient.Post(reqURL, "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if result != nil {
		return json.NewDecoder(resp.Body).Decode(result)
	}
	// 仅检查 errcode
	var base BaseResp
	if err := json.NewDecoder(resp.Body).Decode(&base); err != nil {
		return err
	}
	if base.ErrCode != 0 {
		return &WeComError{base.ErrCode, base.ErrMsg}
	}
	return nil
}
```

> **Go 补充**: `baseURL`、`BaseResp`、`WeComError` 定义在 wecom-isv-core 的 Go 模板中。

### 7.4 Java

```java
package com.wecom.isv;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 企业微信服务商代开发授权流程管理器
 * <p>依赖 wecom-isv-core 提供的 WeComISVClient 基础客户端和三级凭证体系。</p>
 */
public class ISVAuthManager {

    private static final String AUTH_INSTALL_URL = "https://open.work.weixin.qq.com/3rdapp/install";
    private static final String BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";

    private final WeComISVClient client; // 继承自 wecom-isv-core

    public ISVAuthManager(WeComISVClient client) {
        this.client = client;
    }

    // ─── 响应类 ───

    /** 授权企业信息 */
    public static class AuthCorpInfo {
        @JsonProperty("corpid")             public String corpid;
        @JsonProperty("corp_name")          public String corpName;
        @JsonProperty("corp_type")          public String corpType;
        @JsonProperty("corp_round_logo_url") public String corpRoundLogoUrl;
        @JsonProperty("corp_square_logo_url") public String corpSquareLogoUrl;
        @JsonProperty("corp_user_max")      public int corpUserMax;
        @JsonProperty("corp_full_name")     public String corpFullName;
        @JsonProperty("corp_scale")         public String corpScale;
        @JsonProperty("corp_industry")      public String corpIndustry;
        @JsonProperty("corp_sub_industry")  public String corpSubIndustry;
    }

    /** 授权应用权限 */
    public static class AgentPrivilege {
        @JsonProperty("level")        public int level;
        @JsonProperty("allow_party")  public List<Integer> allowParty;
        @JsonProperty("allow_user")   public List<String> allowUser;
        @JsonProperty("allow_tag")    public List<Integer> allowTag;
        @JsonProperty("extra_party")  public List<Integer> extraParty;
        @JsonProperty("extra_user")   public List<String> extraUser;
        @JsonProperty("extra_tag")    public List<Integer> extraTag;
    }

    /** 授权应用信息 */
    public static class AuthAgent {
        @JsonProperty("agentid")         public int agentid;
        @JsonProperty("name")            public String name;
        @JsonProperty("square_logo_url") public String squareLogoUrl;
        @JsonProperty("privilege")       public AgentPrivilege privilege;
    }

    /** 授权管理员信息 */
    public static class AuthUserInfo {
        @JsonProperty("userid")        public String userid;
        @JsonProperty("open_userid")   public String openUserid;
        @JsonProperty("name")          public String name;
        @JsonProperty("avatar")        public String avatar;
    }

    /** 授权信息容器 */
    public static class AuthInfo {
        @JsonProperty("agent") public List<AuthAgent> agent;
    }

    /** get_permanent_code 返回结果 */
    public static class PermanentCodeResult {
        @JsonProperty("errcode")         public int errcode;
        @JsonProperty("errmsg")          public String errmsg;
        @JsonProperty("access_token")    public String accessToken;
        @JsonProperty("expires_in")      public int expiresIn;
        @JsonProperty("permanent_code")  public String permanentCode;
        @JsonProperty("auth_corp_info")  public AuthCorpInfo authCorpInfo;
        @JsonProperty("auth_info")       public AuthInfo authInfo;
        @JsonProperty("auth_user_info")  public AuthUserInfo authUserInfo;
    }

    /** get_auth_info 返回结果 */
    public static class AuthInfoResult {
        @JsonProperty("errcode")         public int errcode;
        @JsonProperty("errmsg")          public String errmsg;
        @JsonProperty("auth_corp_info")  public AuthCorpInfo authCorpInfo;
        @JsonProperty("auth_info")       public AuthInfo authInfo;
        @JsonProperty("auth_user_info")  public AuthUserInfo authUserInfo;
    }

    /** 预授权码返回结果 */
    public static class PreAuthCodeResult {
        @JsonProperty("errcode")        public int errcode;
        @JsonProperty("errmsg")         public String errmsg;
        @JsonProperty("pre_auth_code")  public String preAuthCode;
        @JsonProperty("expires_in")     public int expiresIn;
    }

    /** API 权限项 */
    public static class ApiPermissionItem {
        @JsonProperty("api_name") public String apiName;
        @JsonProperty("api_id")   public String apiId;
        @JsonProperty("granted")  public int granted;
    }

    /** API 分组权限 */
    public static class ApiGroupPermission {
        @JsonProperty("group_name") public String groupName;
        @JsonProperty("api_list")   public List<ApiPermissionItem> apiList;
    }

    /** 应用权限详情返回结果 */
    public static class AppPermissionsResult {
        @JsonProperty("errcode")   public int errcode;
        @JsonProperty("errmsg")    public String errmsg;
        @JsonProperty("api_group") public List<ApiGroupPermission> apiGroup;
    }

    /** 带参授权链接返回结果 */
    public static class CustomizedAuthUrlResult {
        @JsonProperty("errcode")    public int errcode;
        @JsonProperty("errmsg")     public String errmsg;
        @JsonProperty("qrcode_url") public String qrcodeUrl;
        @JsonProperty("expires_in") public int expiresIn;
    }

    /** 授权回调解析后的数据 */
    public static class AuthCallbackData {
        public String suiteId;
        public String infoType;
        public long timeStamp;
        public String authCode;   // create_auth 时有值
        public String authCorpId; // change_auth / cancel_auth 时有值
    }

    // ─── A1: 获取预授权码 ───

    /**
     * 获取预授权码（有效期 20 分钟）
     *
     * @return PreAuthCodeResult 包含 pre_auth_code 和 expires_in
     * @throws WeComISVException 当 API 返回错误时
     */
    public PreAuthCodeResult getPreAuthCode() throws WeComISVException {
        String suiteToken = client.getSuiteAccessToken();
        String url = BASE_URL + "/service/get_pre_auth_code?suite_access_token=" + suiteToken;
        PreAuthCodeResult result = client.httpGet(url, PreAuthCodeResult.class);
        if (result.errcode != 0) {
            throw new WeComISVException(result.errcode, result.errmsg);
        }
        return result;
    }

    // ─── A2: 设置授权配置 ───

    /**
     * 设置授权配置（在拼接授权链接之前调用）
     *
     * @param preAuthCode 预授权码
     * @param appid       允许授权的应用 agentid 列表（可为 null）
     * @param authType    0=正式授权, 1=测试授权
     * @throws WeComISVException 当 API 返回错误时
     */
    public void setSessionInfo(String preAuthCode, List<Integer> appid, int authType)
            throws WeComISVException {
        String suiteToken = client.getSuiteAccessToken();
        Map<String, Object> sessionInfo = new HashMap<>();
        sessionInfo.put("auth_type", authType);
        if (appid != null && !appid.isEmpty()) {
            sessionInfo.put("appid", appid);
        }
        Map<String, Object> body = new HashMap<>();
        body.put("pre_auth_code", preAuthCode);
        body.put("session_info", sessionInfo);
        String url = BASE_URL + "/service/set_session_info?suite_access_token=" + suiteToken;
        client.httpPostJSON(url, body);
    }

    // ─── 拼接授权链接 ───

    /**
     * 拼接授权安装链接
     *
     * @param preAuthCode 预授权码
     * @param redirectUri 授权成功后重定向地址（自动 URL encode）
     * @param state       自定义参数，原样回传（最长 128 字节）
     * @return 完整的授权链接 URL
     */
    public String buildAuthUrl(String preAuthCode, String redirectUri, String state) {
        if (state != null && state.getBytes(StandardCharsets.UTF_8).length > 128) {
            throw new IllegalArgumentException("state 参数最长 128 字节");
        }
        String encodedUri = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        StringBuilder url = new StringBuilder(AUTH_INSTALL_URL)
                .append("?suite_id=").append(client.getSuiteId())
                .append("&pre_auth_code=").append(preAuthCode)
                .append("&redirect_uri=").append(encodedUri);
        if (state != null && !state.isEmpty()) {
            url.append("&state=").append(state);
        }
        return url.toString();
    }

    // ─── A3: 获取企业永久授权码 (v2) ───

    /**
     * 用临时授权码换取永久授权码
     *
     * @param authCode 临时授权码（一次有效）
     * @return PermanentCodeResult 含 permanent_code、auth_corp_info 等
     * @throws WeComISVException 当 API 返回错误时
     */
    public PermanentCodeResult getPermanentCode(String authCode) throws WeComISVException {
        String suiteToken = client.getSuiteAccessToken();
        String url = BASE_URL + "/service/v2/get_permanent_code?suite_access_token=" + suiteToken;
        Map<String, String> body = Map.of("auth_code", authCode);
        PermanentCodeResult result = client.httpPostJSON(url, body, PermanentCodeResult.class);
        if (result.errcode != 0) {
            throw new WeComISVException(result.errcode, result.errmsg);
        }
        // 自动注册到 ISVClient
        client.registerCorp(result.authCorpInfo.corpid, result.permanentCode);
        return result;
    }

    // ─── A4: 获取企业授权信息 ───

    /**
     * 获取企业授权信息
     *
     * @param authCorpId    授权企业 corpid
     * @param permanentCode 永久授权码
     * @return AuthInfoResult 含企业信息、应用信息、管理员信息
     * @throws WeComISVException 当 API 返回错误时
     */
    public AuthInfoResult getAuthInfo(String authCorpId, String permanentCode)
            throws WeComISVException {
        String suiteToken = client.getSuiteAccessToken();
        String url = BASE_URL + "/service/get_auth_info?suite_access_token=" + suiteToken;
        Map<String, String> body = Map.of(
                "auth_corpid", authCorpId,
                "permanent_code", permanentCode
        );
        AuthInfoResult result = client.httpPostJSON(url, body, AuthInfoResult.class);
        if (result.errcode != 0) {
            throw new WeComISVException(result.errcode, result.errmsg);
        }
        return result;
    }

    // ─── A7: 获取应用接口权限详情 ───

    /**
     * 获取应用接口权限详情
     *
     * @param authCorpId    授权企业 corpid
     * @param permanentCode 永久授权码
     * @return AppPermissionsResult 含 API 分组权限列表
     * @throws WeComISVException 当 API 返回错误时
     */
    public AppPermissionsResult getAppPermissions(String authCorpId, String permanentCode)
            throws WeComISVException {
        String suiteToken = client.getSuiteAccessToken();
        String url = BASE_URL + "/service/get_app_permissions?suite_access_token=" + suiteToken;
        Map<String, String> body = Map.of(
                "auth_corpid", authCorpId,
                "permanent_code", permanentCode
        );
        AppPermissionsResult result = client.httpPostJSON(url, body, AppPermissionsResult.class);
        if (result.errcode != 0) {
            throw new WeComISVException(result.errcode, result.errmsg);
        }
        return result;
    }

    // ─── A6: 获取带参授权链接 ───

    /**
     * 获取带参授权链接（注意：使用 provider_access_token，而非 suite_access_token）
     *
     * @param providerAccessToken 服务商 provider_access_token
     * @param templateidList      代开发模版 ID 列表
     * @param state               自定义参数
     * @return CustomizedAuthUrlResult 含二维码链接和有效期
     * @throws WeComISVException 当 API 返回错误时
     */
    public CustomizedAuthUrlResult getCustomizedAuthUrl(
            String providerAccessToken,
            List<String> templateidList,
            String state) throws WeComISVException {
        Map<String, Object> body = new HashMap<>();
        body.put("templateid_list", templateidList);
        if (state != null && !state.isEmpty()) {
            body.put("state", state);
        }
        String url = BASE_URL + "/service/get_customized_auth_url?provider_access_token="
                + providerAccessToken;
        CustomizedAuthUrlResult result = client.httpPostJSON(
                url, body, CustomizedAuthUrlResult.class);
        if (result.errcode != 0) {
            throw new WeComISVException(result.errcode, result.errmsg);
        }
        return result;
    }

    // ─── 回调处理 ───

    /**
     * 统一处理授权回调事件
     *
     * @param data 解析后的授权回调数据
     * @return create_auth → PermanentCodeResult; change_auth → AuthInfoResult; cancel_auth → null
     * @throws WeComISVException 当 API 返回错误时
     */
    public Object handleAuthCallback(AuthCallbackData data) throws WeComISVException {
        switch (data.infoType) {
            case "create_auth":
                return getPermanentCode(data.authCode);
            case "change_auth": {
                String permanentCode = loadPermanentCode(data.authCorpId);
                if (permanentCode == null) {
                    throw new RuntimeException(
                            "企业 " + data.authCorpId + " 的 permanent_code 未找到");
                }
                return getAuthInfo(data.authCorpId, permanentCode);
            }
            case "cancel_auth":
                handleCancelAuth(data.authCorpId);
                return null;
            default:
                throw new IllegalArgumentException("未知的授权回调类型: " + data.infoType);
        }
    }

    /**
     * 一站式生成授权链接（获取预授权码 + 设置配置 + 拼接链接）
     *
     * @param redirectUri 授权成功后重定向地址
     * @param state       自定义参数（最长 128 字节）
     * @param appid       允许授权的应用 agentid 列表（可为 null）
     * @param authType    0=正式授权, 1=测试授权
     * @return 完整的授权链接 URL
     * @throws WeComISVException 当 API 返回错误时
     */
    public String createAuthUrl(String redirectUri, String state,
                                List<Integer> appid, int authType) throws WeComISVException {
        PreAuthCodeResult result = getPreAuthCode();
        if ((appid != null && !appid.isEmpty()) || authType != 0) {
            setSessionInfo(result.preAuthCode, appid, authType);
        }
        return buildAuthUrl(result.preAuthCode, redirectUri, state);
    }

    // ─── 内部方法 ───

    private String loadPermanentCode(String authCorpId) {
        // 先尝试从 ISVClient 内存缓存获取
        String code = client.getCachedPermanentCode(authCorpId);
        if (code != null) return code;
        // TODO: 从数据库加载
        // return db.queryForObject("SELECT permanent_code FROM corp_auth WHERE corpid = ?",
        //         String.class, authCorpId);
        return null;
    }

    private void handleCancelAuth(String authCorpId) {
        client.removeCorp(authCorpId);
        // TODO: 更新数据库状态、停止服务
        // db.update("UPDATE corp_auth SET status='cancelled' WHERE corpid = ?", authCorpId);
        // scheduledTaskService.stop(authCorpId);
    }
}
```

> **Java 补充**: `WeComISVClient`、`WeComISVException` 定义在 wecom-isv-core 的 Java 模板中。`httpGet()`、`httpPostJSON()` 为 `WeComISVClient` 提供的 HTTP 封装方法。

### 7.5 PHP

```php
<?php

namespace WeComISV;

use WeComISV\WeComISVClient;    // 继承自 wecom-isv-core
use WeComISV\WeComISVException; // 继承自 wecom-isv-core

/**
 * 企业微信服务商代开发授权流程管理器
 *
 * 覆盖预授权码获取、授权链接拼接、永久授权码换取、授权信息查询、
 * 带参授权链接、权限详情查询，以及授权事件回调处理。
 * 依赖 wecom-isv-core 提供的 WeComISVClient 基础客户端和三级凭证体系。
 */
class ISVAuthManager
{
    private const AUTH_INSTALL_URL = 'https://open.work.weixin.qq.com/3rdapp/install';
    private const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';

    private WeComISVClient $client;

    public function __construct(WeComISVClient $client)
    {
        $this->client = $client;
    }

    // ─── A1: 获取预授权码 ───

    /**
     * 获取预授权码（有效期 20 分钟）
     *
     * @return array{pre_auth_code: string, expires_in: int}
     * @throws WeComISVException
     */
    public function getPreAuthCode(): array
    {
        $suiteToken = $this->client->getSuiteAccessToken();
        $url = self::BASE_URL . '/service/get_pre_auth_code'
             . '?suite_access_token=' . $suiteToken;
        $result = $this->client->httpGet($url);
        $this->assertSuccess($result);
        return [
            'pre_auth_code' => $result['pre_auth_code'],
            'expires_in'    => $result['expires_in'],
        ];
    }

    // ─── A2: 设置授权配置 ───

    /**
     * 设置授权配置（在拼接授权链接之前调用）
     *
     * @param string     $preAuthCode 预授权码
     * @param int[]|null $appid       允许授权的应用 agentid 列表
     * @param int        $authType    0=正式授权, 1=测试授权
     * @throws WeComISVException
     */
    public function setSessionInfo(
        string $preAuthCode,
        ?array $appid = null,
        int $authType = 0
    ): void {
        $suiteToken = $this->client->getSuiteAccessToken();
        $sessionInfo = ['auth_type' => $authType];
        if ($appid !== null && count($appid) > 0) {
            $sessionInfo['appid'] = $appid;
        }
        $body = [
            'pre_auth_code' => $preAuthCode,
            'session_info'  => $sessionInfo,
        ];
        $url = self::BASE_URL . '/service/set_session_info'
             . '?suite_access_token=' . $suiteToken;
        $result = $this->client->httpPostJson($url, $body);
        $this->assertSuccess($result);
    }

    // ─── 拼接授权链接 ───

    /**
     * 拼接授权安装链接
     *
     * @param string $preAuthCode 预授权码
     * @param string $redirectUri 授权成功后重定向地址（自动 URL encode）
     * @param string $state       自定义参数，原样回传（最长 128 字节）
     * @return string 完整的授权链接 URL
     * @throws \InvalidArgumentException
     */
    public function buildAuthUrl(
        string $preAuthCode,
        string $redirectUri,
        string $state = ''
    ): string {
        if (strlen($state) > 128) {
            throw new \InvalidArgumentException('state 参数最长 128 字节');
        }
        $encodedUri = urlencode($redirectUri);
        $url = self::AUTH_INSTALL_URL
             . '?suite_id=' . $this->client->getSuiteId()
             . '&pre_auth_code=' . $preAuthCode
             . '&redirect_uri=' . $encodedUri;
        if ($state !== '') {
            $url .= '&state=' . $state;
        }
        return $url;
    }

    // ─── A3: 获取企业永久授权码 (v2) ───

    /**
     * 用临时授权码换取永久授权码
     *
     * @param string $authCode 临时授权码（一次有效）
     * @return array 含 permanent_code、auth_corp_info、auth_info、auth_user_info
     * @throws WeComISVException
     */
    public function getPermanentCode(string $authCode): array
    {
        $suiteToken = $this->client->getSuiteAccessToken();
        $url = self::BASE_URL . '/service/v2/get_permanent_code'
             . '?suite_access_token=' . $suiteToken;
        $result = $this->client->httpPostJson($url, ['auth_code' => $authCode]);
        $this->assertSuccess($result);
        // 自动注册到 ISVClient
        $corpId = $result['auth_corp_info']['corpid'];
        $this->client->registerCorp($corpId, $result['permanent_code']);
        return $result;
    }

    // ─── A4: 获取企业授权信息 ───

    /**
     * 获取企业授权信息
     *
     * @param string $authCorpId    授权企业 corpid
     * @param string $permanentCode 永久授权码
     * @return array 含 auth_corp_info、auth_info、auth_user_info
     * @throws WeComISVException
     */
    public function getAuthInfo(string $authCorpId, string $permanentCode): array
    {
        $suiteToken = $this->client->getSuiteAccessToken();
        $url = self::BASE_URL . '/service/get_auth_info'
             . '?suite_access_token=' . $suiteToken;
        $result = $this->client->httpPostJson($url, [
            'auth_corpid'    => $authCorpId,
            'permanent_code' => $permanentCode,
        ]);
        $this->assertSuccess($result);
        return $result;
    }

    // ─── A7: 获取应用接口权限详情 ───

    /**
     * 获取应用接口权限详情
     *
     * @param string $authCorpId    授权企业 corpid
     * @param string $permanentCode 永久授权码
     * @return array 含 api_group 分组权限列表
     * @throws WeComISVException
     */
    public function getAppPermissions(string $authCorpId, string $permanentCode): array
    {
        $suiteToken = $this->client->getSuiteAccessToken();
        $url = self::BASE_URL . '/service/get_app_permissions'
             . '?suite_access_token=' . $suiteToken;
        $result = $this->client->httpPostJson($url, [
            'auth_corpid'    => $authCorpId,
            'permanent_code' => $permanentCode,
        ]);
        $this->assertSuccess($result);
        return $result;
    }

    // ─── A6: 获取带参授权链接 ───

    /**
     * 获取带参授权链接（注意：使用 provider_access_token，而非 suite_access_token）
     *
     * @param string   $providerAccessToken 服务商 provider_access_token
     * @param string[] $templateidList      代开发模版 ID 列表
     * @param string   $state               自定义参数
     * @return array{qrcode_url: string, expires_in: int}
     * @throws WeComISVException
     */
    public function getCustomizedAuthUrl(
        string $providerAccessToken,
        array $templateidList,
        string $state = ''
    ): array {
        $body = ['templateid_list' => $templateidList];
        if ($state !== '') {
            $body['state'] = $state;
        }
        $url = self::BASE_URL . '/service/get_customized_auth_url'
             . '?provider_access_token=' . $providerAccessToken;
        $result = $this->client->httpPostJson($url, $body);
        $this->assertSuccess($result);
        return [
            'qrcode_url' => $result['qrcode_url'],
            'expires_in' => $result['expires_in'],
        ];
    }

    // ─── 回调处理 ───

    /**
     * 统一处理授权回调事件
     *
     * @param string $infoType     回调类型 (create_auth / change_auth / cancel_auth)
     * @param array  $callbackData 解析后的回调 XML 数据
     * @return array|null create_auth → permanent_code 结果; change_auth → auth_info 结果; cancel_auth → null
     * @throws WeComISVException
     * @throws \RuntimeException
     */
    public function handleAuthCallback(string $infoType, array $callbackData): ?array
    {
        switch ($infoType) {
            case 'create_auth':
                $authCode = $callbackData['AuthCode'];
                return $this->getPermanentCode($authCode);

            case 'change_auth':
                $authCorpId = $callbackData['AuthCorpId'];
                $permanentCode = $this->loadPermanentCode($authCorpId);
                if ($permanentCode === null) {
                    throw new \RuntimeException(
                        "企业 {$authCorpId} 的 permanent_code 未找到"
                    );
                }
                return $this->getAuthInfo($authCorpId, $permanentCode);

            case 'cancel_auth':
                $authCorpId = $callbackData['AuthCorpId'];
                $this->handleCancelAuth($authCorpId);
                return null;

            default:
                throw new \InvalidArgumentException("未知的授权回调类型: {$infoType}");
        }
    }

    /**
     * 一站式生成授权链接（获取预授权码 + 设置配置 + 拼接链接）
     *
     * @param string     $redirectUri 授权成功后重定向地址
     * @param string     $state       自定义参数（最长 128 字节）
     * @param int[]|null $appid       允许授权的应用 agentid 列表
     * @param int        $authType    0=正式授权, 1=测试授权
     * @return string 完整的授权链接 URL
     * @throws WeComISVException
     */
    public function createAuthUrl(
        string $redirectUri,
        string $state = '',
        ?array $appid = null,
        int $authType = 0
    ): string {
        $result = $this->getPreAuthCode();
        $preAuthCode = $result['pre_auth_code'];
        if ($appid !== null || $authType !== 0) {
            $this->setSessionInfo($preAuthCode, $appid, $authType);
        }
        return $this->buildAuthUrl($preAuthCode, $redirectUri, $state);
    }

    // ─── 内部方法 ───

    /**
     * 从数据库加载 permanent_code（需业务层实现）
     */
    private function loadPermanentCode(string $authCorpId): ?string
    {
        // 先尝试从 ISVClient 内存缓存获取
        $code = $this->client->getCachedPermanentCode($authCorpId);
        if ($code !== null) {
            return $code;
        }
        // TODO: 从数据库加载
        // return DB::table('corp_auth')
        //     ->where('corpid', $authCorpId)
        //     ->value('permanent_code');
        return null;
    }

    /**
     * 处理取消授权（需业务层实现）
     */
    private function handleCancelAuth(string $authCorpId): void
    {
        $this->client->removeCorp($authCorpId);
        // TODO: 更新数据库状态、停止服务
        // DB::table('corp_auth')
        //     ->where('corpid', $authCorpId)
        //     ->update(['status' => 'cancelled']);
        // ScheduledTaskService::stop($authCorpId);
    }

    /**
     * 校验 API 返回结果，非 0 errcode 时抛异常
     */
    private function assertSuccess(array $result): void
    {
        $errcode = $result['errcode'] ?? 0;
        if ($errcode !== 0) {
            throw new WeComISVException(
                $errcode,
                $result['errmsg'] ?? 'unknown error'
            );
        }
    }
}
```

> **PHP 补充**: `WeComISVClient`、`WeComISVException` 定义在 wecom-isv-core 的 PHP 模板中。`httpGet()`、`httpPostJson()` 为 `WeComISVClient` 提供的 HTTP 封装方法。PHP 8.0+ 类型声明语法。

---

## 8. 测试模板

### 8.1 Python (pytest)

```python
import pytest
from unittest.mock import patch, MagicMock
from wecom_isv_auth import ISVAuthManager
from wecom_isv_client import WeComISVClient, WeComISVError


@pytest.fixture
def client():
    c = WeComISVClient("test_suite_id", "test_suite_secret")
    c._suite_ticket = "test_ticket"
    c._suite_token = "mock_suite_token"
    c._suite_token_expires_at = float("inf")
    return c


@pytest.fixture
def auth_mgr(client):
    return ISVAuthManager(client)


class TestGetPreAuthCode:
    """A1: 获取预授权码"""

    @patch("requests.request")
    def test_获取预授权码成功(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "pre_auth_code": "pCZaABCD", "expires_in": 1200,
        })
        result = auth_mgr.get_pre_auth_code()
        assert result["pre_auth_code"] == "pCZaABCD"
        assert result["expires_in"] == 1200

    @patch("requests.request")
    def test_suite_token无效时抛异常(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 42009, "errmsg": "suite_access_token expired",
        })
        with pytest.raises(WeComISVError) as exc_info:
            auth_mgr.get_pre_auth_code()
        assert exc_info.value.errcode == 42009


class TestSetSessionInfo:
    """A2: 设置授权配置"""

    @patch("requests.request")
    def test_设置正式授权成功(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok"})
        auth_mgr.set_session_info("pre_code_xxx", auth_type=0)
        assert mock_req.called

    @patch("requests.request")
    def test_设置测试授权带应用列表(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok"})
        auth_mgr.set_session_info("pre_code_xxx", appid=[1, 2], auth_type=1)
        assert mock_req.called


class TestBuildAuthUrl:
    """授权链接拼接"""

    def test_正常拼接授权链接(self, auth_mgr):
        url = auth_mgr.build_auth_url(
            "pre_auth_code_xxx",
            "https://example.com/callback",
            "my_state",
        )
        assert "suite_id=test_suite_id" in url
        assert "pre_auth_code=pre_auth_code_xxx" in url
        assert "redirect_uri=https%3A%2F%2Fexample.com%2Fcallback" in url
        assert "state=my_state" in url

    def test_redirect_uri自动URL编码(self, auth_mgr):
        url = auth_mgr.build_auth_url(
            "code", "https://example.com/path?a=1&b=2", ""
        )
        assert "redirect_uri=https%3A%2F%2Fexample.com%2Fpath%3Fa%3D1%26b%3D2" in url

    def test_state超过128字节时抛异常(self, auth_mgr):
        long_state = "a" * 129
        with pytest.raises(ValueError, match="128 字节"):
            auth_mgr.build_auth_url("code", "https://example.com", long_state)

    def test_无state时不附加state参数(self, auth_mgr):
        url = auth_mgr.build_auth_url("code", "https://example.com", "")
        assert "state=" not in url


class TestGetPermanentCode:
    """A3: 获取企业永久授权码"""

    @patch("requests.request")
    def test_换取永久授权码成功(self, mock_req, auth_mgr, client):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "access_token": "corp_token", "expires_in": 7200,
            "permanent_code": "perm_code_xxx",
            "auth_corp_info": {"corpid": "corp_001", "corp_name": "测试企业"},
            "auth_info": {"agent": [{"agentid": 1, "name": "测试应用"}]},
            "auth_user_info": {"userid": "admin", "name": "管理员"},
        })
        result = auth_mgr.get_permanent_code("auth_code_xxx")
        assert result["permanent_code"] == "perm_code_xxx"
        assert result["auth_corp_info"]["corpid"] == "corp_001"
        # 验证自动注册到 client
        assert "corp_001" in client._corp_tokens

    @patch("requests.request")
    def test_auth_code重复使用报错(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 84014, "errmsg": "invalid auth_code",
        })
        with pytest.raises(WeComISVError) as exc_info:
            auth_mgr.get_permanent_code("used_code")
        assert exc_info.value.errcode == 84014


class TestGetAuthInfo:
    """A4: 获取企业授权信息"""

    @patch("requests.request")
    def test_获取授权信息成功(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "auth_corp_info": {"corpid": "corp_001", "corp_name": "测试企业"},
            "auth_info": {"agent": [{"agentid": 1, "privilege": {"allow_party": [1, 2]}}]},
            "auth_user_info": {"userid": "admin"},
        })
        result = auth_mgr.get_auth_info("corp_001", "perm_code")
        assert result["auth_info"]["agent"][0]["privilege"]["allow_party"] == [1, 2]


class TestGetAppPermissions:
    """A7: 获取应用接口权限详情"""

    @patch("requests.request")
    def test_获取权限详情成功(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "api_group": [
                {"group_name": "通讯录读取", "api_list": [
                    {"api_name": "获取成员详情", "api_id": "contact_read", "granted": 1},
                ]},
            ],
        })
        result = auth_mgr.get_app_permissions("corp_001", "perm_code")
        assert len(result["api_group"]) == 1
        assert result["api_group"][0]["api_list"][0]["granted"] == 1


class TestGetCustomizedAuthUrl:
    """A6: 获取带参授权链接"""

    @patch("requests.post")
    def test_获取带参授权链接成功(self, mock_post, auth_mgr):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "qrcode_url": "https://open.work.weixin.qq.com/3rdservice/xxx",
            "expires_in": 7200,
        })
        result = auth_mgr.get_customized_auth_url(
            "provider_token_xxx",
            ["dk00000001"],
            state="channel_001",
        )
        assert "qrcode_url" in result
        # 验证使用的是 provider_access_token，不是 suite_access_token
        call_kwargs = mock_post.call_args
        assert "provider_access_token" in str(call_kwargs)


class TestHandleAuthCallback:
    """回调处理"""

    @patch("requests.request")
    def test_create_auth回调处理(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "permanent_code": "perm_xxx",
            "auth_corp_info": {"corpid": "corp_new"},
            "auth_info": {"agent": []}, "auth_user_info": {},
            "access_token": "token", "expires_in": 7200,
        })
        result = auth_mgr.handle_auth_callback("create_auth", {"AuthCode": "code_xxx"})
        assert result["permanent_code"] == "perm_xxx"

    @patch("requests.request")
    def test_change_auth回调处理(self, mock_req, auth_mgr, client):
        client.register_corp("corp_001", "perm_code_001")
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0,
            "auth_corp_info": {"corpid": "corp_001"},
            "auth_info": {"agent": [{"agentid": 1}]},
            "auth_user_info": {},
        })
        result = auth_mgr.handle_auth_callback("change_auth", {"AuthCorpId": "corp_001"})
        assert result["auth_corp_info"]["corpid"] == "corp_001"

    def test_cancel_auth回调处理(self, auth_mgr, client):
        client.register_corp("corp_001", "perm_code_001")
        result = auth_mgr.handle_auth_callback("cancel_auth", {"AuthCorpId": "corp_001"})
        assert result is None
        assert "corp_001" not in client._corp_tokens

    def test_未知回调类型抛异常(self, auth_mgr):
        with pytest.raises(ValueError, match="未知"):
            auth_mgr.handle_auth_callback("unknown_type", {})


class TestCreateAuthUrl:
    """一站式生成授权链接"""

    @patch("requests.request")
    def test_一站式生成授权链接(self, mock_req, auth_mgr):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "pre_auth_code": "auto_code", "expires_in": 1200,
        })
        url = auth_mgr.create_auth_url(
            "https://example.com/callback",
            state="from_home",
            auth_type=0,
        )
        assert "pre_auth_code=auto_code" in url
        assert "state=from_home" in url
```

---

## 9. Code Review 检查清单

| 编号 | 检查项 | 严重度 |
|------|--------|--------|
| R1 | pre_auth_code 是否在获取后 20 分钟内使用，未长期缓存 | HIGH |
| R2 | auth_code 是否仅使用一次，无重复调用 get_permanent_code | CRITICAL |
| R3 | permanent_code 是否持久化到数据库（非仅内存存储） | CRITICAL |
| R4 | redirect_uri 是否进行了 URL encode | HIGH |
| R5 | state 参数是否限制在 128 字节以内 | MEDIUM |
| R6 | get_permanent_code 是否使用 v2 版本路径（`/service/v2/`） | HIGH |
| R7 | get_customized_auth_url 是否使用 provider_access_token（非 suite_access_token） | CRITICAL |
| R8 | 授权回调是否在 5 秒内响应 `"success"` | HIGH |
| R9 | create_auth 回调是否正确提取 AuthCode 并换取永久授权码 | CRITICAL |
| R10 | change_auth 处理是否调用 get_auth_info 更新本地数据 | HIGH |
| R11 | cancel_auth 处理是否清理 token 缓存和停止服务 | HIGH |
| R12 | 授权回调是否推送到模版回调 URL（非应用回调 URL） | HIGH |
| R13 | 多企业场景是否按 corpid 维度独立管理 permanent_code | HIGH |
| R14 | 返回的 corpid 是否识别为服务商加密后的值（非企业原始 corpid） | MEDIUM |
| R15 | set_session_info 是否在拼接授权链接之前调用 | MEDIUM |
| R16 | 企业重新授权时是否正确更新 permanent_code（新值替换旧值） | HIGH |

---

## 10. 踩坑指南

### G1: pre_auth_code 有效期仅 20 分钟

pre_auth_code 有效期只有 20 分钟（1200 秒），不要提前批量获取缓存。最佳实践是在用户点击「授权安装」按钮时实时获取，然后立即拼接授权链接。

> 错误做法: 服务启动时获取一个 pre_auth_code 反复使用
> 正确做法: 每次需要授权链接时实时获取

### G2: auth_code 一次有效

`create_auth` 回调中的 AuthCode 和重定向 URL 中的 auth_code 是**同一个值**，且**一次有效**。换取 permanent_code 后立即失效，重复使用会返回 84014。

> 如果同时收到回调和重定向两个通道的 auth_code，只处理先到的那个，后到的忽略（做幂等处理）。

### G3: redirect_uri 必须 URL encode

授权链接中的 `redirect_uri` 必须进行 URL encode，否则企业微信无法正确解析。常见错误是直接拼接未编码的 URL，导致 `?` 和 `&` 被当作授权链接的参数。

```
# 错误
redirect_uri=https://example.com/callback?source=wecom&type=auth

# 正确
redirect_uri=https%3A%2F%2Fexample.com%2Fcallback%3Fsource%3Dwecom%26type%3Dauth
```

### G4: state 参数最长 128 字节

授权链接中的 `state` 参数最长 128 字节（非 128 个字符，中文占 3 字节）。超长会被截断或报错。

> 如果需要传递较多信息，建议在 state 中存一个短 ID（如 UUID），业务信息存数据库，授权成功后通过 ID 查询。

### G5: get_customized_auth_url 使用 provider_access_token

这是唯一一个使用 **provider_access_token** 的授权 API，其余都用 suite_access_token。provider_access_token 是服务商级别的凭证，通过 `POST /service/get_provider_token`（corpid + provider_secret）获取。

> 混用凭证类型会返回 40001（不合法的 secret）或 40014（不合法的 access_token）。

### G6: 代开发授权后返回的 corpid 是加密的

自 2022 年 6 月 28 日起，代开发应用通过 `get_permanent_code` 获取的 corpid 是**服务商主体加密**后的值，与企业在管理后台看到的 corpid 不同。

> 存储和匹配时必须使用加密后的 corpid。如需对接企业自建应用，需使用 ID 转换接口。

### G7: set_session_info 中 auth_type=1 仅用于测试

`auth_type=1`（测试授权）不消耗授权名额，但授权企业数有限制。正式上线后必须使用 `auth_type=0`。忘记切换会导致正式客户无法完成授权。

> 建议通过环境变量控制 auth_type，开发环境 =1，生产环境 =0。

### G8: permanent_code 必须持久化，无法重新获取

permanent_code 是企业授权的唯一凭证，丢失后**无法重新获取**（除非企业取消授权后重新授权）。必须持久化存储到数据库。

> 内存存储（如 ISVClient._corp_tokens）仅用于运行时缓存，服务重启后必须从数据库恢复。

### G9: 回调和重定向是两个独立通道

授权成功后，企业微信会同时触发两个通道：
1. **回调通道**: push `create_auth` 事件到模版回调 URL（服务端接收）
2. **重定向通道**: 浏览器跳转到 `redirect_uri?auth_code=xxx`（前端接收）

两个通道携带的 auth_code 相同，但到达时间可能不同。必须做**幂等处理**，确保只处理一次。

> 推荐以回调通道为主（更可靠），重定向通道作为备份。

### G10: cancel_auth 后不要立即删除数据

企业取消授权后可能重新授权。建议将企业状态标记为「已取消」而非直接删除数据，保留 permanent_code 以便审计和数据恢复。

> 可设置定时任务，取消授权超过一定时间（如 90 天）后再清理数据。

---

## 11. 授权域错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40001 | 不合法的 secret | 检查 provider_secret 是否正确（get_customized_auth_url） |
| 40014 | 不合法的 access_token | 检查凭证类型是否匹配（suite_access_token vs provider_access_token） |
| 40082 | suite_id 不合法 | 检查 suite_id 是否正确 |
| 40085 | suite_token 不合法 | suite_access_token 无效，重新获取 |
| 40086 | 不合法的 auth_corpid | 检查企业是否已授权、corpid 格式是否正确 |
| 40089 | 不合法的 permanent_code | 检查永久授权码是否正确 |
| 42009 | suite_access_token 已过期 | 重新获取 suite_access_token |
| 45009 | 调用频率超限 | 降频，确保 token 有缓存 |
| 60020 | IP 不在白名单 | 服务商管理后台添加 IP 白名单 |
| 84014 | 无效的临时授权码 | auth_code 已使用或已过期（一次有效） |
| 84015 | 企业已被取消授权 | 企业管理员已取消授权，无法继续操作 |
| 84019 | 预授权码已过期 | pre_auth_code 有效期仅 20 分钟 |
| 84062 | 未授权的应用 | 企业未授权该应用，检查 auth_info.agent 列表 |

---

## 12. 参考

### 12.1 官方文档

| 文档 | 链接 |
|------|------|
| 代开发流程 | https://developer.work.weixin.qq.com/document/path/97112 |
| 代开发授权应用 secret 获取 | https://developer.work.weixin.qq.com/document/path/97163 |
| 代开发授权应用 access_token 获取 | https://developer.work.weixin.qq.com/document/path/97164 |
| 获取预授权码 | https://developer.work.weixin.qq.com/document/path/98728 |
| 设置授权配置 | https://developer.work.weixin.qq.com/document/path/98729 |
| 获取企业永久授权码 | https://developer.work.weixin.qq.com/document/path/98730 |
| 获取企业授权信息 | https://developer.work.weixin.qq.com/document/path/98731 |
| 获取带参授权链接 | https://developer.work.weixin.qq.com/document/path/98732 |
| 获取应用权限详情 | https://developer.work.weixin.qq.com/document/path/98733 |
| 代开发应用权限说明 | https://developer.work.weixin.qq.com/document/path/98980 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |

### 12.2 能力索引（ISV 域）

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 凭证体系、suite_access_token、corp_token | wecom-isv-core |
| 授权流程、预授权码、永久授权码 | wecom-isv-auth（本 SKILL） |
| suite_ticket、回调加解密 | wecom-isv-core + wecom-core |
| 接口调用许可、帐号购买 | wecom-isv-license |
| 收银台、支付 | wecom-isv-billing |
| JS-SDK、前端签名 | wecom-isv-jssdk |
| 通讯录/消息/CRM | 复用对应域 SKILL，换 token 即可 |
