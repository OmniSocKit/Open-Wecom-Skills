---
name: wecom-isv-provider
description: |
  企业微信服务商级管理 SKILL。覆盖 provider_access_token 凭证管理、服务商后台免登、通讯录 ID 转译、corpid 转换、企业推广注册、应用可见范围设置、企业详情获取、API 域名 IP 段获取。
  TRIGGER: 当用户提到 provider_access_token、服务商凭证、服务商后台免登、get_login_info、推广注册、register_code、corpid_to_opencorpid、ID 转译、userid_to_openuserid、服务商管理 相关开发时触发。
  本 SKILL 聚焦服务商自身管理接口，凭证体系和基础客户端继承自 wecom-isv-core。
version: 1.0.0
domain: isv-provider
depends_on: wecom-isv-core
doc_ids: [90927, 91150, 95327, 95439, 97568, 98088, 98089, 98090]
triggers:
  - provider_access_token
  - 服务商凭证
  - 服务商后台免登
  - get_login_info
  - get_provider_token
  - 推广注册
  - register_code
  - corpid_to_opencorpid
  - userid_to_openuserid
  - ID 转译
  - 服务商管理
  - get_register_code
  - get_register_info
  - set_scope
  - get_corp_detail
  - get_api_domain_ip
  - ISV provider management
  - 服务商级接口
---

# WeCom ISV · Provider Management SKILL (wecom-isv-provider)

> 覆盖企业微信服务商级别管理接口：provider_access_token 凭证管理、服务商后台扫码免登、通讯录 ID 转译（userid ↔ open_userid）、corpid 转换（corpid → opencorpid）、企业推广注册、应用可见范围设置、企业详情获取、API 域名 IP 段获取，以及 2 种服务商回调事件。
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
| provider_access_token | 服务商 corpid + provider_secret | 服务商级管理接口（免登、推广注册、corpid 转换、企业详情） |
| suite_access_token | wecom-isv-core 管理 | set_scope（设置授权应用可见范围） |
| access_token (corp) | wecom-isv-core 管理 | userid_to_openuserid（通讯录 ID 转译）、get_api_domain_ip |

### 1.3 前置配置

1. **已完成 wecom-isv-core 的全部前置配置**（服务商账号、代开发模版、回调 URL、IP 白名单）
2. **已在服务商管理后台获取 provider_secret**（服务商管理后台 → 服务商信息 → 基本信息 → provider_secret）
3. **服务商自身的 corpid**（非授权企业的 corpid，服务商管理后台 → 服务商信息 → 基本信息）
4. **推广注册场景**需先在服务商管理后台创建「推广注册模版」

---

## 2. 核心概念

### 2.1 provider_access_token（服务商凭证）

```
企业微信凭证体系
├── access_token          ← 企业自建应用凭证（corpid + corpsecret）
├── suite_access_token    ← 代开发模版凭证（suite_id + suite_secret + suite_ticket）
└── provider_access_token ← 服务商管理凭证（corpid + provider_secret）★ 本 SKILL
```

**核心特征**：
- **第三种独立凭证**，与 access_token、suite_access_token 完全不同，不可混用
- 获取方式：`POST /service/get_provider_token`，Body 传 `corpid`（服务商自己的）+ `provider_secret`
- 有效期 **7200 秒**（2 小时），必须缓存
- 不依赖 suite_ticket，获取过程无前置凭证依赖
- 用途：服务商后台免登、推广注册、corpid 转换、企业详情获取、带参授权链接

### 2.2 服务商管理后台

| 项目 | 说明 |
|------|------|
| 地址 | https://open.work.weixin.qq.com |
| corpid | 服务商自己的企业 corpid（非授权企业） |
| provider_secret | 服务商管理后台 → 服务商信息 → 基本信息 |
| IP 白名单 | 服务商管理后台 → 服务商信息 → 基本信息 → IP 白名单 |
| 推广注册模版 | 服务商管理后台 → 推广注册 → 创建模版 |

### 2.3 服务商后台免登

服务商后台支持扫码登录，流程：
1. 在服务商管理后台配置「登录授权」的回调域名
2. 使用企业微信扫码登录服务商后台
3. 企业微信回调返回 `auth_code`
4. 服务商用 `auth_code` 调用 `get_login_info` 获取登录用户身份

**usertype（用户身份类型）**：

| usertype | 含义 | 权限范围 |
|----------|------|---------|
| 1 | 创建者 | 最高权限 |
| 2 | 内部系统管理员 | 企业内部管理 |
| 3 | 外部系统管理员 | 第三方管理 |
| 4 | 分级管理员 | 受限管理权限 |

### 2.4 ID 体系转换

```
代开发应用返回的 ID（服务商主体加密）
├── open_userid      ← 服务商加密的成员 ID
├── opencorpid       ← 服务商加密的企业 ID
└── external_userid  ← 服务商加密的外部联系人 ID

转换关系（本 SKILL 覆盖）：
├── userid → open_userid     （P3: userid_to_openuserid，需 corp access_token）
└── corpid → opencorpid      （P4: corpid_to_opencorpid，需 provider_access_token）
```

**注意**：自 2022 年 6 月 28 日起，代开发应用返回的所有 ID 均为服务商主体加密后的值。

### 2.5 企业推广注册

服务商可通过「推广注册」功能引导企业注册企业微信并自动关联授权：

```
服务商获取注册码 → 生成注册链接/二维码 → 企业扫码注册
    → 企业微信创建企业 → register_corp 回调通知 → 服务商关联企业
```

---

## 3. API 速查表

| 编号 | 名称 | 方法 | 路径 | 凭证 |
|------|------|------|------|------|
| P1 | 获取服务商凭证 | POST | `/service/get_provider_token` | 无（corpid + provider_secret） |
| P2 | 获取登录用户信息 | POST | `/service/get_login_info` | provider_access_token |
| P3 | 通讯录 ID 转译 | POST | `/batch/userid_to_openuserid` | access_token (corp) |
| P4 | corpid 转换 | POST | `/service/corpid_to_opencorpid` | provider_access_token |
| P5 | 获取注册码 | POST | `/service/get_register_code` | provider_access_token |
| P6 | 获取注册信息 | POST | `/service/get_register_info` | provider_access_token |
| P7 | 设置授权应用可见范围 | POST | `/agent/set_scope` | suite_access_token |
| P8 | 获取企业详情 | POST | `/service/get_corp_detail` | provider_access_token |
| P9 | 获取 API 域名 IP 段 | GET | `/get_api_domain_ip` | access_token |

---

## 4. API 详情

### 4.1 P1 — 获取服务商凭证

`POST /cgi-bin/service/get_provider_token`

> **无需任何前置凭证**，直接使用 corpid + provider_secret 获取。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| corpid | string | 是 | **服务商自己的** corpid（非授权企业的 corpid） |
| provider_secret | string | 是 | 服务商密钥（服务商管理后台获取） |

**请求示例:**

```json
{
  "corpid": "ww1234567890abcdef",
  "provider_secret": "provider_secret_value"
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| provider_access_token | string | 服务商凭证 |
| expires_in | int | 有效期（秒），固定 7200 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "provider_access_token": "enLSZ5GrmdfZ_OOOO_NAbc123...",
  "expires_in": 7200
}
```

**关键规则:**
1. **必须缓存**，有效期 7200 秒，禁止每次调用都重新获取
2. `corpid` 是**服务商自己的企业 corpid**，不是授权企业的 corpid
3. `provider_secret` 在服务商管理后台获取，不是企业管理后台
4. 无需 suite_ticket，独立于代开发凭证体系
5. IP 必须在服务商管理后台的白名单中

---

### 4.2 P2 — 获取登录用户信息

`POST /cgi-bin/service/get_login_info?access_token=PROVIDER_ACCESS_TOKEN`

> **注意**：URL 参数名是 `access_token`，但传入的是 **provider_access_token**。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| auth_code | string | 是 | 服务商后台扫码登录回调返回的临时授权码 |

**请求示例:**

```json
{
  "auth_code": "auth_code_from_scan_callback"
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| usertype | int | 用户类型：1=创建者, 2=内部管理员, 3=外部管理员, 4=分级管理员 |
| user_info | object | 登录用户信息 |
| user_info.userid | string | 成员 userid |
| user_info.open_userid | string | 全局唯一 userid |
| user_info.name | string | 成员名称 |
| user_info.avatar | string | 头像 URL |
| corp_info | object | 授权企业信息 |
| corp_info.corpid | string | 企业 corpid |
| agent | object[] | 应用列表 |
| agent[].agentid | int | 应用 ID |
| agent[].auth_type | int | 授权类型 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "usertype": 1,
  "user_info": {
    "userid": "zhangsan",
    "open_userid": "woAAABBBCCCDDD",
    "name": "张三",
    "avatar": "https://wework.qpic.cn/..."
  },
  "corp_info": {
    "corpid": "ww1234567890abcdef"
  },
  "agent": [
    {
      "agentid": 1000001,
      "auth_type": 0
    }
  ]
}
```

**关键规则:**
1. `auth_code` 来自服务商后台扫码登录的回调，**一次有效**
2. 根据 `usertype` 判断用户身份，控制后台页面的操作权限
3. URL 参数名虽然是 `access_token`，但必须传 **provider_access_token**
4. 此接口用于**服务商自己的管理后台**免登，不是企业管理后台

---

### 4.3 P3 — 通讯录 ID 转译

`POST /cgi-bin/batch/userid_to_openuserid?access_token=ACCESS_TOKEN`

> 使用**企业 corp access_token**（非 provider_access_token）。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| open_userid_list | string[] | 是 | 服务商加密的 open_userid 列表，最多 **1000 个** |

**请求示例:**

```json
{
  "open_userid_list": [
    "woAAABBBCCC111",
    "woAAABBBCCC222"
  ]
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| open_userid_list | object[] | 转换结果列表 |
| open_userid_list[].open_userid | string | 原始 open_userid |
| open_userid_list[].userid | string | 企业内部 userid |
| invalid_open_userid_list | string[] | 无效的 open_userid 列表 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "open_userid_list": [
    {
      "open_userid": "woAAABBBCCC111",
      "userid": "zhangsan"
    }
  ],
  "invalid_open_userid_list": ["woAAABBBCCC222"]
}
```

**关键规则:**
1. 需要**特殊权限申请**（服务商管理后台开通「通讯录 ID 转译」能力）
2. 使用**企业 corp access_token**，不是 provider_access_token
3. 每次最多 **1000 个** open_userid
4. 无效的 open_userid 会放入 `invalid_open_userid_list`，不影响其他结果

---

### 4.4 P4 — corpid 转换

`POST /cgi-bin/service/corpid_to_opencorpid?provider_access_token=PROVIDER_ACCESS_TOKEN`

> 将企业原始 corpid 转换为服务商加密的 opencorpid。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| corpid | string | 是 | 企业原始 corpid |

**请求示例:**

```json
{
  "corpid": "ww1234567890abcdef"
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| open_corpid | string | 服务商加密后的 opencorpid |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "open_corpid": "wpXXXXXXXXXXXX"
}
```

**关键规则:**
1. **单向转换**：原始 corpid → opencorpid，反向需使用不同接口
2. 使用 **provider_access_token**（URL 参数名也是 `provider_access_token`）
3. 用于将外部系统中的企业原始 corpid 与代开发应用中获取的加密 corpid 对应

---

### 4.5 P5 — 获取注册码

`POST /cgi-bin/service/get_register_code?provider_access_token=PROVIDER_ACCESS_TOKEN`

> 用于服务商推广企业注册企业微信。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| template_id | string | 是 | 推广注册模版 ID（服务商管理后台创建） |
| corp_name | string | 否 | 企业名称（预填） |
| admin_name | string | 否 | 管理员姓名（预填） |
| admin_mobile | string | 否 | 管理员手机号（预填） |
| state | string | 否 | 自定义参数，注册完成后回调原样回传，最长 128 字节 |

**请求示例:**

```json
{
  "template_id": "tpl_xxxxxxxxxxxxx",
  "corp_name": "示例科技",
  "admin_name": "张三",
  "admin_mobile": "13800138000",
  "state": "channel_001"
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| register_code | string | 注册码 |
| expires_in | int | 注册码有效期（秒） |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "register_code": "reg_code_xxxxxx",
  "expires_in": 86400
}
```

**关键规则:**
1. `template_id` 在服务商管理后台 → 推广注册 → 创建模版获取
2. `register_code` **有有效期**（通常 86400 秒 = 24 小时），过期需重新获取
3. 预填信息（corp_name / admin_name / admin_mobile）方便企业快速注册
4. `state` 可用于追踪推广渠道来源
5. 注册码需拼接为注册链接：`https://open.work.weixin.qq.com/3rdservice/register?register_code=REGISTER_CODE`

---

### 4.6 P6 — 获取注册信息

`POST /cgi-bin/service/get_register_info?provider_access_token=PROVIDER_ACCESS_TOKEN`

> 通过注册码获取已注册企业的信息。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| register_code | string | 是 | 注册码（来自 register_corp 回调或 P5 返回） |

**请求示例:**

```json
{
  "register_code": "reg_code_xxxxxx"
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| corpid | string | 注册企业的 corpid |
| access_token | string | 企业 access_token（可直接使用） |
| expires_in | int | access_token 有效期 |
| state | string | 注册码中的自定义参数（原样回传） |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "corpid": "ww1234567890abcdef",
  "access_token": "accesstoken_xxx",
  "expires_in": 7200,
  "state": "channel_001"
}
```

**关键规则:**
1. 一般在收到 `register_corp` 回调后调用
2. 返回的 `access_token` 可直接调用企业 API
3. `state` 用于匹配推广渠道来源

---

### 4.7 P7 — 设置授权应用可见范围

`POST /cgi-bin/agent/set_scope?suite_access_token=SUITE_ACCESS_TOKEN`

> **注意**：此接口使用 **suite_access_token**，不是 provider_access_token。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| agentid | int | 是 | 授权应用的 agentid |
| allow_user | string[] | 否 | 可见成员 userid 列表 |
| allow_party | int[] | 否 | 可见部门 ID 列表 |
| allow_tag | int[] | 否 | 可见标签 ID 列表 |

**请求示例:**

```json
{
  "agentid": 1000001,
  "allow_user": ["zhangsan", "lisi"],
  "allow_party": [1, 2],
  "allow_tag": [1]
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

**关键规则:**
1. 使用 **suite_access_token**（非 provider_access_token）
2. 设置的是**授权应用**的可见范围（需企业已授权）
3. `allow_user` / `allow_party` / `allow_tag` 为空数组时表示不限制
4. 设置后企业管理员可在管理后台看到变更

---

### 4.8 P8 — 获取企业详情

`POST /cgi-bin/service/get_corp_detail?provider_access_token=PROVIDER_ACCESS_TOKEN`

> 获取企业更详细的信息（行业、规模等），比授权回调中的信息更丰富。

**请求参数 (JSON Body):**

| Parameter | Type | Required | Description |
|------|------|------|------|
| auth_corpid | string | 是 | 授权企业的 corpid |

**请求示例:**

```json
{
  "auth_corpid": "ww1234567890abcdef"
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| corp_full_name | string | 企业全称 |
| corp_scale | string | 企业规模（如 "1-50"、"51-200"） |
| corp_industry | string | 所属行业 |
| corp_sub_industry | string | 子行业 |
| location | string | 企业所在地 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "corp_full_name": "示例科技有限公司",
  "corp_scale": "51-200",
  "corp_industry": "IT",
  "corp_sub_industry": "软件",
  "location": "广东省深圳市南山区"
}
```

**关键规则:**
1. 使用 **provider_access_token**
2. 用于服务商后台展示企业详细信息（行业分析、客户画像等场景）
3. `auth_corpid` 可以是服务商加密的 corpid

---

### 4.9 P9 — 获取 API 域名 IP 段

`GET /cgi-bin/get_api_domain_ip?access_token=ACCESS_TOKEN`

> 获取企业微信 API 服务器的 IP 段，用于配置企业防火墙白名单。

**请求参数:** 仅需 access_token（URL 参数）

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| ip_list | string[] | IP 段列表（CIDR 格式） |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "ip_list": [
    "182.254.11.176/29",
    "101.226.62.0/24",
    "140.207.54.0/24"
  ]
}
```

**关键规则:**
1. 使用企业 access_token 或 provider_access_token 均可调用
2. 返回的 IP 段为 CIDR 格式
3. IP 段可能随时变化，建议定期刷新（如每天一次）
4. 用于配置企业侧防火墙，确保企业微信回调能到达服务商服务器

---

## 5. 回调事件

### 5.1 回调事件一览

| InfoType | 名称 | 特有字段 | 推送目标 |
|----------|------|---------|---------|
| register_corp | 企业注册完成 | RegisterCode, AuthCode, ContactSync, State | 模版回调 URL |
| change_app_admin | 应用管理员变更 | AgentID, OldAdminUserID, NewAdminUserID | 模版回调 URL |

### 5.2 register_corp — 企业注册完成

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[register_corp]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <RegisterCode><![CDATA[reg_code_xxxxxx]]></RegisterCode>
  <AuthCode><![CDATA[temporary_auth_code]]></AuthCode>
  <ContactSync><![CDATA[sync]]></ContactSync>
  <State><![CDATA[channel_001]]></State>
</xml>
```

| 字段 | 说明 |
|------|------|
| RegisterCode | 注册码（与 P5 返回的对应） |
| AuthCode | 临时授权码（用于换取 permanent_code） |
| ContactSync | 通讯录同步状态（"sync" 表示已同步） |
| State | 自定义参数（P5 中传入，原样回传） |

**处理流程:**
1. 立即响应 `"success"`（5 秒内）
2. 用 `RegisterCode` 调用 P6（`get_register_info`）获取企业 corpid
3. 用 `AuthCode` 调用 `get_permanent_code`（wecom-isv-auth SKILL）换取永久授权码
4. 持久化存储 `permanent_code` + `corpid`
5. 建立服务商与该企业的关联关系

### 5.3 change_app_admin — 应用管理员变更

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[change_app_admin]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
  <AgentID>1000001</AgentID>
  <OldAdminUserID><![CDATA[old_admin]]></OldAdminUserID>
  <NewAdminUserID><![CDATA[new_admin]]></NewAdminUserID>
</xml>
```

| 字段 | 说明 |
|------|------|
| AuthCorpId | 企业 corpid |
| AgentID | 应用 agentid |
| OldAdminUserID | 原管理员 userid |
| NewAdminUserID | 新管理员 userid |

**处理流程:**
1. 立即响应 `"success"`
2. 更新本地存储的应用管理员信息
3. 可选：通知相关运维人员管理员已变更

---

## 6. 典型工作流

### 6.1 服务商初始化流程

```
Step 1: 获取 provider_access_token
    POST /service/get_provider_token
    Body: { corpid: 服务商corpid, provider_secret: xxx }
    → 缓存 provider_access_token（7200s）

Step 2: 配置 IP 白名单
    GET /get_api_domain_ip
    → 获取企业微信 API IP 段
    → 服务商管理后台配置 IP 白名单

Step 3: 创建推广注册模版（管理后台手动操作）
    服务商管理后台 → 推广注册 → 创建模版

Step 4: 配置回调 URL（管理后台手动操作）
    服务商管理后台 → 代开发模版 → 回调配置
    → 开始接收 suite_ticket
```

### 6.2 服务商后台免登流程

```
Step 1: 引导扫码
    生成服务商后台登录二维码
    → 企业微信扫码

Step 2: 回调获取 auth_code
    企业微信回调服务商配置的登录回调 URL
    → 获取 auth_code

Step 3: 获取登录用户信息
    POST /service/get_login_info?access_token=PROVIDER_TOKEN
    Body: { auth_code: xxx }
    → 获取 usertype、user_info、corp_info

Step 4: 判断身份、进入管理页
    根据 usertype 判断权限
    ├── usertype=1 → 创建者，最高权限
    ├── usertype=2 → 内部管理员
    ├── usertype=3 → 外部管理员
    └── usertype=4 → 分级管理员，受限权限
```

### 6.3 企业推广注册流程

```
Step 1: 获取注册码
    POST /service/get_register_code?provider_access_token=TOKEN
    Body: { template_id, corp_name?, admin_mobile?, state }
    → 获取 register_code

Step 2: 生成注册链接/二维码
    URL: https://open.work.weixin.qq.com/3rdservice/register?register_code=REGISTER_CODE
    → 展示给目标企业

Step 3: 企业扫码注册
    → 企业管理员扫码完成注册

Step 4: 收到 register_corp 回调
    → 获取 RegisterCode + AuthCode + State

Step 5: 关联授权
    POST /service/get_register_info (RegisterCode) → 获取 corpid
    POST /service/v2/get_permanent_code (AuthCode) → 获取永久授权码
    → 持久化存储，建立服务商-企业关联
```

### 6.4 ID 转换流程

```
场景 A: 已知企业 userid，需要服务商加密的 open_userid
    → 使用企业 corp access_token
    → POST /batch/userid_to_openuserid
    → userid → open_userid

场景 B: 已知企业原始 corpid，需要服务商加密的 opencorpid
    → 使用 provider_access_token
    → POST /service/corpid_to_opencorpid
    → corpid → opencorpid

注意：
- 场景 A 需要 corp access_token（企业级），需要特殊权限
- 场景 B 需要 provider_access_token（服务商级）
- corpid_to_opencorpid 是单向转换（原始 → 加密）
```

---

## 7. 代码模板

### 7.1 Python

```python
"""企业微信服务商管理模块 — provider_access_token 凭证管理 + 服务商级 API"""
import os
import time
import logging
import threading
import requests

logger = logging.getLogger(__name__)


class WeComProviderManager:
    """服务商管理模块，管理 provider_access_token 及服务商级 API"""

    BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin"

    def __init__(
        self,
        corpid: str = None,
        provider_secret: str = None,
    ):
        self.corpid = corpid or os.environ["WECOM_PROVIDER_CORPID"]
        self.provider_secret = provider_secret or os.environ["WECOM_PROVIDER_SECRET"]
        self._provider_token: str | None = None
        self._provider_token_expires_at: float = 0
        self._lock = threading.Lock()

    # ─── provider_access_token 管理 ───

    @property
    def provider_access_token(self) -> str:
        """获取 provider_access_token（带缓存，线程安全）"""
        if time.time() >= self._provider_token_expires_at:
            with self._lock:
                if time.time() >= self._provider_token_expires_at:
                    self._refresh_provider_token()
        return self._provider_token

    def _refresh_provider_token(self):
        """刷新 provider_access_token"""
        resp = requests.post(
            f"{self.BASE_URL}/service/get_provider_token",
            json={
                "corpid": self.corpid,
                "provider_secret": self.provider_secret,
            },
            timeout=10,
        ).json()
        if resp.get("errcode", 0) != 0:
            raise WeComProviderError(resp["errcode"], resp["errmsg"])
        self._provider_token = resp["provider_access_token"]
        # 提前 300 秒刷新，避免临界过期
        self._provider_token_expires_at = time.time() + resp["expires_in"] - 300
        logger.info("provider_access_token 已刷新")

    # ─── 通用请求方法 ───

    def _request_with_provider_token(
        self, method: str, path: str, **kwargs
    ) -> dict:
        """使用 provider_access_token 发起请求"""
        url = f"{self.BASE_URL}{path}"
        params = kwargs.pop("params", {})
        # 部分接口用 provider_access_token 参数名，部分用 access_token
        if "provider_access_token" not in params and "access_token" not in params:
            params["provider_access_token"] = self.provider_access_token
        resp = requests.request(
            method, url, params=params, timeout=10, **kwargs
        ).json()
        errcode = resp.get("errcode", 0)
        if errcode != 0:
            raise WeComProviderError(errcode, resp.get("errmsg", ""))
        return resp

    # ─── P2: 获取登录用户信息 ───

    def get_login_info(self, auth_code: str) -> dict:
        """服务商后台免登 — 获取扫码登录的用户信息

        Args:
            auth_code: 扫码登录回调返回的临时授权码

        Returns:
            包含 usertype, user_info, corp_info, agent 的字典
        """
        return self._request_with_provider_token(
            "POST",
            "/service/get_login_info",
            params={"access_token": self.provider_access_token},
            json={"auth_code": auth_code},
        )

    # ─── P4: corpid 转换 ───

    def corpid_to_opencorpid(self, corpid: str) -> str:
        """将企业原始 corpid 转换为服务商加密的 opencorpid

        Args:
            corpid: 企业原始 corpid

        Returns:
            服务商加密后的 opencorpid
        """
        resp = self._request_with_provider_token(
            "POST",
            "/service/corpid_to_opencorpid",
            json={"corpid": corpid},
        )
        return resp["open_corpid"]

    # ─── P5: 获取注册码 ───

    def get_register_code(
        self,
        template_id: str,
        *,
        corp_name: str = None,
        admin_name: str = None,
        admin_mobile: str = None,
        state: str = None,
    ) -> dict:
        """获取推广注册码

        Args:
            template_id: 推广注册模版 ID
            corp_name: 预填企业名称
            admin_name: 预填管理员姓名
            admin_mobile: 预填管理员手机号
            state: 自定义参数（回调原样回传），最长 128 字节

        Returns:
            包含 register_code, expires_in 的字典
        """
        body: dict = {"template_id": template_id}
        if corp_name is not None:
            body["corp_name"] = corp_name
        if admin_name is not None:
            body["admin_name"] = admin_name
        if admin_mobile is not None:
            body["admin_mobile"] = admin_mobile
        if state is not None:
            body["state"] = state
        return self._request_with_provider_token(
            "POST",
            "/service/get_register_code",
            json=body,
        )

    # ─── P6: 获取注册信息 ───

    def get_register_info(self, register_code: str) -> dict:
        """获取已注册企业的信息

        Args:
            register_code: 注册码（来自 register_corp 回调或 P5 返回）

        Returns:
            包含 corpid, access_token, expires_in, state 的字典
        """
        return self._request_with_provider_token(
            "POST",
            "/service/get_register_info",
            json={"register_code": register_code},
        )

    # ─── P8: 获取企业详情 ───

    def get_corp_detail(self, auth_corpid: str) -> dict:
        """获取企业详细信息（行业、规模等）

        Args:
            auth_corpid: 授权企业的 corpid

        Returns:
            包含 corp_full_name, corp_scale, corp_industry 等的字典
        """
        return self._request_with_provider_token(
            "POST",
            "/service/get_corp_detail",
            json={"auth_corpid": auth_corpid},
        )


class WeComProviderError(Exception):
    """服务商 API 错误"""

    def __init__(self, errcode: int, errmsg: str):
        self.errcode = errcode
        self.errmsg = errmsg
        super().__init__(f"WeCom Provider Error [{errcode}]: {errmsg}")
```

**P3 和 P9 使用 corp access_token，通过 ISVClient 调用：**

```python
"""通讯录 ID 转译 + API 域名 IP（使用 ISVClient 的 corp access_token）"""
from wecom_isv_client import WeComISVClient  # 继承自 wecom-isv-core


class WeComIDConverter:
    """ID 转换模块（需要 corp access_token）"""

    def __init__(self, isv_client: WeComISVClient):
        self.isv_client = isv_client

    def userid_to_openuserid(
        self, auth_corpid: str, open_userid_list: list[str]
    ) -> dict:
        """P3: 通讯录 ID 转译（open_userid → userid）

        Args:
            auth_corpid: 授权企业的 corpid
            open_userid_list: 服务商加密的 open_userid 列表，最多 1000 个

        Returns:
            包含 open_userid_list(转换结果) 和 invalid_open_userid_list 的字典
        """
        if len(open_userid_list) > 1000:
            raise ValueError("open_userid_list 最多 1000 个")
        return self.isv_client.post(
            auth_corpid,
            "/batch/userid_to_openuserid",
            json={"open_userid_list": open_userid_list},
        )

    def get_api_domain_ip(self, auth_corpid: str) -> list[str]:
        """P9: 获取企业微信 API 域名 IP 段

        Args:
            auth_corpid: 授权企业的 corpid（仅用于获取 access_token）

        Returns:
            IP 段列表（CIDR 格式）
        """
        resp = self.isv_client.get(auth_corpid, "/get_api_domain_ip")
        return resp.get("ip_list", [])
```

**P7 使用 suite_access_token，通过 ISVClient 调用：**

```python
"""设置授权应用可见范围（使用 suite_access_token）"""


class WeComScopeManager:
    """应用可见范围管理"""

    def __init__(self, isv_client: WeComISVClient):
        self.isv_client = isv_client

    def set_scope(
        self,
        agentid: int,
        *,
        allow_user: list[str] = None,
        allow_party: list[int] = None,
        allow_tag: list[int] = None,
    ) -> dict:
        """P7: 设置授权应用可见范围

        Args:
            agentid: 授权应用的 agentid
            allow_user: 可见成员 userid 列表
            allow_party: 可见部门 ID 列表
            allow_tag: 可见标签 ID 列表
        """
        body: dict = {"agentid": agentid}
        if allow_user is not None:
            body["allow_user"] = allow_user
        if allow_party is not None:
            body["allow_party"] = allow_party
        if allow_tag is not None:
            body["allow_tag"] = allow_tag
        suite_token = self.isv_client.suite_access_token
        resp = requests.post(
            f"{self.isv_client.BASE_URL}/agent/set_scope",
            params={"suite_access_token": suite_token},
            json=body,
            timeout=10,
        ).json()
        if resp.get("errcode", 0) != 0:
            raise WeComProviderError(resp["errcode"], resp.get("errmsg", ""))
        return resp
```

### 7.2 TypeScript

```typescript
/** 企业微信服务商管理模块 — provider_access_token 凭证管理 + 服务商级 API */
import axios, { AxiosInstance } from 'axios';

export class WeComProviderError extends Error {
  constructor(public errcode: number, public errmsg: string) {
    super(`WeCom Provider Error [${errcode}]: ${errmsg}`);
  }
}

/** 登录用户信息 */
interface LoginInfo {
  usertype: 1 | 2 | 3 | 4;
  user_info: {
    userid: string;
    open_userid: string;
    name: string;
    avatar: string;
  };
  corp_info: {
    corpid: string;
  };
  agent?: { agentid: number; auth_type: number }[];
}

/** 注册码信息 */
interface RegisterCodeResult {
  register_code: string;
  expires_in: number;
}

/** 注册信息 */
interface RegisterInfo {
  corpid: string;
  access_token: string;
  expires_in: number;
  state?: string;
}

/** 企业详情 */
interface CorpDetail {
  corp_full_name: string;
  corp_scale: string;
  corp_industry: string;
  corp_sub_industry: string;
  location?: string;
}

export class WeComProviderManager {
  private static readonly BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';
  private providerToken: string | null = null;
  private providerTokenExpiresAt = 0;
  private http: AxiosInstance;

  constructor(
    private corpid = process.env.WECOM_PROVIDER_CORPID!,
    private providerSecret = process.env.WECOM_PROVIDER_SECRET!,
  ) {
    this.http = axios.create({
      baseURL: WeComProviderManager.BASE_URL,
      timeout: 10_000,
    });
  }

  /** 获取 provider_access_token（带缓存） */
  async getProviderAccessToken(): Promise<string> {
    if (this.providerToken && Date.now() < this.providerTokenExpiresAt) {
      return this.providerToken;
    }
    const { data } = await this.http.post('/service/get_provider_token', {
      corpid: this.corpid,
      provider_secret: this.providerSecret,
    });
    if (data.errcode && data.errcode !== 0) {
      throw new WeComProviderError(data.errcode, data.errmsg);
    }
    this.providerToken = data.provider_access_token;
    this.providerTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return this.providerToken!;
  }

  /** P2: 获取登录用户信息（服务商后台免登） */
  async getLoginInfo(authCode: string): Promise<LoginInfo> {
    const token = await this.getProviderAccessToken();
    const { data } = await this.http.post(
      `/service/get_login_info?access_token=${token}`,
      { auth_code: authCode },
    );
    if (data.errcode && data.errcode !== 0) {
      throw new WeComProviderError(data.errcode, data.errmsg);
    }
    return data as LoginInfo;
  }

  /** P4: corpid 转换（原始 corpid → 服务商加密 opencorpid） */
  async corpidToOpencorpid(corpid: string): Promise<string> {
    const token = await this.getProviderAccessToken();
    const { data } = await this.http.post(
      `/service/corpid_to_opencorpid?provider_access_token=${token}`,
      { corpid },
    );
    if (data.errcode && data.errcode !== 0) {
      throw new WeComProviderError(data.errcode, data.errmsg);
    }
    return data.open_corpid;
  }

  /** P5: 获取推广注册码 */
  async getRegisterCode(params: {
    template_id: string;
    corp_name?: string;
    admin_name?: string;
    admin_mobile?: string;
    state?: string;
  }): Promise<RegisterCodeResult> {
    const token = await this.getProviderAccessToken();
    const { data } = await this.http.post(
      `/service/get_register_code?provider_access_token=${token}`,
      params,
    );
    if (data.errcode && data.errcode !== 0) {
      throw new WeComProviderError(data.errcode, data.errmsg);
    }
    return { register_code: data.register_code, expires_in: data.expires_in };
  }

  /** P6: 获取注册信息 */
  async getRegisterInfo(registerCode: string): Promise<RegisterInfo> {
    const token = await this.getProviderAccessToken();
    const { data } = await this.http.post(
      `/service/get_register_info?provider_access_token=${token}`,
      { register_code: registerCode },
    );
    if (data.errcode && data.errcode !== 0) {
      throw new WeComProviderError(data.errcode, data.errmsg);
    }
    return data as RegisterInfo;
  }

  /** P8: 获取企业详情 */
  async getCorpDetail(authCorpid: string): Promise<CorpDetail> {
    const token = await this.getProviderAccessToken();
    const { data } = await this.http.post(
      `/service/get_corp_detail?provider_access_token=${token}`,
      { auth_corpid: authCorpid },
    );
    if (data.errcode && data.errcode !== 0) {
      throw new WeComProviderError(data.errcode, data.errmsg);
    }
    return data as CorpDetail;
  }
}

/** P3 / P7 / P9 需要 corp access_token 或 suite_access_token，通过 ISVClient 调用 */
import { WeComISVClient } from './wecom-isv-client';

export class WeComIDConverter {
  constructor(private isvClient: WeComISVClient) {}

  /** P3: 通讯录 ID 转译（open_userid → userid） */
  async useridToOpenuserid(
    authCorpId: string,
    openUseridList: string[],
  ): Promise<{
    open_userid_list: { open_userid: string; userid: string }[];
    invalid_open_userid_list: string[];
  }> {
    if (openUseridList.length > 1000) throw new Error('open_userid_list 最多 1000 个');
    return this.isvClient.post(authCorpId, '/batch/userid_to_openuserid', {
      open_userid_list: openUseridList,
    });
  }

  /** P9: 获取 API 域名 IP 段 */
  async getApiDomainIp(authCorpId: string): Promise<string[]> {
    const resp = await this.isvClient.get<{ ip_list: string[] }>(
      authCorpId,
      '/get_api_domain_ip',
    );
    return resp.ip_list ?? [];
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
	"net/http"
	"os"
	"sync"
	"time"
)

const baseURL = "https://qyapi.weixin.qq.com/cgi-bin"

// ProviderManager 服务商管理模块，管理 provider_access_token 及服务商级 API
type ProviderManager struct {
	Corpid         string
	ProviderSecret string

	providerToken          string
	providerTokenExpiresAt time.Time
	mu                     sync.RWMutex
	httpClient             *http.Client
}

// NewProviderManager 创建服务商管理模块
func NewProviderManager(corpid, providerSecret string) *ProviderManager {
	if corpid == "" {
		corpid = os.Getenv("WECOM_PROVIDER_CORPID")
	}
	if providerSecret == "" {
		providerSecret = os.Getenv("WECOM_PROVIDER_SECRET")
	}
	return &ProviderManager{
		Corpid:         corpid,
		ProviderSecret: providerSecret,
		httpClient:     &http.Client{Timeout: 10 * time.Second},
	}
}

// WeComProviderError 服务商 API 错误
type WeComProviderError struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

func (e *WeComProviderError) Error() string {
	return fmt.Sprintf("WeCom Provider Error [%d]: %s", e.ErrCode, e.ErrMsg)
}

// GetProviderAccessToken 获取 provider_access_token（带缓存，线程安全）
func (m *ProviderManager) GetProviderAccessToken() (string, error) {
	m.mu.RLock()
	if m.providerToken != "" && time.Now().Before(m.providerTokenExpiresAt) {
		defer m.mu.RUnlock()
		return m.providerToken, nil
	}
	m.mu.RUnlock()
	return m.refreshProviderToken()
}

func (m *ProviderManager) refreshProviderToken() (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 双重检查
	if m.providerToken != "" && time.Now().Before(m.providerTokenExpiresAt) {
		return m.providerToken, nil
	}

	body, _ := json.Marshal(map[string]string{
		"corpid":          m.Corpid,
		"provider_secret": m.ProviderSecret,
	})
	resp, err := m.httpClient.Post(
		baseURL+"/service/get_provider_token",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return "", fmt.Errorf("请求 get_provider_token 失败: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode             int    `json:"errcode"`
		ErrMsg              string `json:"errmsg"`
		ProviderAccessToken string `json:"provider_access_token"`
		ExpiresIn           int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("解析 get_provider_token 响应失败: %w", err)
	}
	if result.ErrCode != 0 {
		return "", &WeComProviderError{result.ErrCode, result.ErrMsg}
	}
	m.providerToken = result.ProviderAccessToken
	m.providerTokenExpiresAt = time.Now().Add(time.Duration(result.ExpiresIn-300) * time.Second)
	return m.providerToken, nil
}

// providerPost 使用 provider_access_token 发起 POST 请求
func (m *ProviderManager) providerPost(path string, reqBody interface{}) (map[string]interface{}, error) {
	token, err := m.GetProviderAccessToken()
	if err != nil {
		return nil, err
	}
	body, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("%s%s?provider_access_token=%s", baseURL, path, token)
	resp, err := m.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("请求 %s 失败: %w", path, err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析 %s 响应失败: %w", path, err)
	}
	if errcode, ok := result["errcode"].(float64); ok && int(errcode) != 0 {
		errmsg, _ := result["errmsg"].(string)
		return nil, &WeComProviderError{int(errcode), errmsg}
	}
	return result, nil
}

// LoginInfo 登录用户信息
type LoginInfo struct {
	UserType int `json:"usertype"`
	UserInfo struct {
		UserID     string `json:"userid"`
		OpenUserID string `json:"open_userid"`
		Name       string `json:"name"`
		Avatar     string `json:"avatar"`
	} `json:"user_info"`
	CorpInfo struct {
		CorpID string `json:"corpid"`
	} `json:"corp_info"`
	Agent []struct {
		AgentID  int `json:"agentid"`
		AuthType int `json:"auth_type"`
	} `json:"agent"`
}

// GetLoginInfo P2: 获取登录用户信息（服务商后台免登）
func (m *ProviderManager) GetLoginInfo(authCode string) (*LoginInfo, error) {
	token, err := m.GetProviderAccessToken()
	if err != nil {
		return nil, err
	}
	body, _ := json.Marshal(map[string]string{"auth_code": authCode})
	// 注意：此接口 URL 参数名是 access_token，但传 provider_access_token
	url := fmt.Sprintf("%s/service/get_login_info?access_token=%s", baseURL, token)
	resp, err := m.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("请求 get_login_info 失败: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
		LoginInfo
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析 get_login_info 响应失败: %w", err)
	}
	if result.ErrCode != 0 {
		return nil, &WeComProviderError{result.ErrCode, result.ErrMsg}
	}
	return &result.LoginInfo, nil
}

// CorpidToOpencorpid P4: 将企业原始 corpid 转换为服务商加密的 opencorpid
func (m *ProviderManager) CorpidToOpencorpid(corpid string) (string, error) {
	result, err := m.providerPost("/service/corpid_to_opencorpid", map[string]string{
		"corpid": corpid,
	})
	if err != nil {
		return "", err
	}
	openCorpid, _ := result["open_corpid"].(string)
	return openCorpid, nil
}

// RegisterCodeRequest 注册码请求参数
type RegisterCodeRequest struct {
	TemplateID  string `json:"template_id"`
	CorpName    string `json:"corp_name,omitempty"`
	AdminName   string `json:"admin_name,omitempty"`
	AdminMobile string `json:"admin_mobile,omitempty"`
	State       string `json:"state,omitempty"`
}

// RegisterCodeResult 注册码返回结果
type RegisterCodeResult struct {
	RegisterCode string `json:"register_code"`
	ExpiresIn    int    `json:"expires_in"`
}

// GetRegisterCode P5: 获取推广注册码
func (m *ProviderManager) GetRegisterCode(req *RegisterCodeRequest) (*RegisterCodeResult, error) {
	result, err := m.providerPost("/service/get_register_code", req)
	if err != nil {
		return nil, err
	}
	code, _ := result["register_code"].(string)
	expiresIn, _ := result["expires_in"].(float64)
	return &RegisterCodeResult{
		RegisterCode: code,
		ExpiresIn:    int(expiresIn),
	}, nil
}

// RegisterInfo 注册信息
type RegisterInfo struct {
	CorpID      string `json:"corpid"`
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	State       string `json:"state"`
}

// GetRegisterInfo P6: 获取注册信息
func (m *ProviderManager) GetRegisterInfo(registerCode string) (*RegisterInfo, error) {
	result, err := m.providerPost("/service/get_register_info", map[string]string{
		"register_code": registerCode,
	})
	if err != nil {
		return nil, err
	}
	corpid, _ := result["corpid"].(string)
	token, _ := result["access_token"].(string)
	expiresIn, _ := result["expires_in"].(float64)
	state, _ := result["state"].(string)
	return &RegisterInfo{
		CorpID:      corpid,
		AccessToken: token,
		ExpiresIn:   int(expiresIn),
		State:       state,
	}, nil
}

// CorpDetail 企业详情
type CorpDetail struct {
	CorpFullName   string `json:"corp_full_name"`
	CorpScale      string `json:"corp_scale"`
	CorpIndustry   string `json:"corp_industry"`
	CorpSubIndustry string `json:"corp_sub_industry"`
	Location       string `json:"location"`
}

// GetCorpDetail P8: 获取企业详情
func (m *ProviderManager) GetCorpDetail(authCorpid string) (*CorpDetail, error) {
	result, err := m.providerPost("/service/get_corp_detail", map[string]string{
		"auth_corpid": authCorpid,
	})
	if err != nil {
		return nil, err
	}
	detail := &CorpDetail{}
	detail.CorpFullName, _ = result["corp_full_name"].(string)
	detail.CorpScale, _ = result["corp_scale"].(string)
	detail.CorpIndustry, _ = result["corp_industry"].(string)
	detail.CorpSubIndustry, _ = result["corp_sub_industry"].(string)
	detail.Location, _ = result["location"].(string)
	return detail, nil
}

// UseridToOpenuserid P3: 通讯录 ID 转译（需要 corp access_token，通过 ISVClient 调用）
func (c *ISVClient) UseridToOpenuserid(authCorpID string, openUseridList []string) (map[string]interface{}, error) {
	if len(openUseridList) > 1000 {
		return nil, fmt.Errorf("open_userid_list 最多 1000 个")
	}
	return c.Request(authCorpID, "POST", "/batch/userid_to_openuserid", map[string]interface{}{
		"open_userid_list": openUseridList,
	})
}

// GetAPIDomainIP P9: 获取 API 域名 IP 段（需要 access_token，通过 ISVClient 调用）
func (c *ISVClient) GetAPIDomainIP(authCorpID string) ([]string, error) {
	result, err := c.Request(authCorpID, "GET", "/get_api_domain_ip", nil)
	if err != nil {
		return nil, err
	}
	ipListRaw, _ := result["ip_list"].([]interface{})
	ipList := make([]string, 0, len(ipListRaw))
	for _, ip := range ipListRaw {
		if s, ok := ip.(string); ok {
			ipList = append(ipList, s)
		}
	}
	return ipList, nil
}
```

### 7.4 Java

```java
/** 企业微信服务商管理模块 — provider_access_token 凭证管理 + 服务商级 API */
package com.wecom.isv;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

/** 服务商 API 错误 */
public class WeComProviderException extends RuntimeException {
    private final int errcode;
    private final String errmsg;

    public WeComProviderException(int errcode, String errmsg) {
        super(String.format("WeCom Provider Error [%d]: %s", errcode, errmsg));
        this.errcode = errcode;
        this.errmsg = errmsg;
    }

    public int getErrcode() { return errcode; }
    public String getErrmsg() { return errmsg; }
}

/**
 * ProviderManager — 管理 provider_access_token 及服务商级 API
 * <p>使用 provider_access_token 凭证，适用于：免登、推广注册、corpid 转换、企业详情</p>
 */
public class ProviderManager {
    private static final String BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String corpid;
    private final String providerSecret;
    private final HttpClient httpClient;

    private volatile String providerToken;
    private volatile Instant providerTokenExpiresAt = Instant.EPOCH;

    public ProviderManager(String corpid, String providerSecret) {
        this.corpid = corpid != null ? corpid : System.getenv("WECOM_PROVIDER_CORPID");
        this.providerSecret = providerSecret != null
                ? providerSecret : System.getenv("WECOM_PROVIDER_SECRET");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // ─── provider_access_token 管理 ───

    /** 获取 provider_access_token（带缓存，线程安全） */
    public synchronized String getProviderAccessToken() throws Exception {
        if (providerToken != null && Instant.now().isBefore(providerTokenExpiresAt)) {
            return providerToken;
        }
        ObjectNode body = MAPPER.createObjectNode();
        body.put("corpid", corpid);
        body.put("provider_secret", providerSecret);

        JsonNode resp = doPost(BASE_URL + "/service/get_provider_token", body);
        if (resp.path("errcode").asInt(0) != 0) {
            throw new WeComProviderException(
                    resp.get("errcode").asInt(), resp.get("errmsg").asText());
        }
        providerToken = resp.get("provider_access_token").asText();
        int expiresIn = resp.get("expires_in").asInt();
        // 提前 300 秒刷新，避免临界过期
        providerTokenExpiresAt = Instant.now().plusSeconds(expiresIn - 300);
        return providerToken;
    }

    // ─── 通用请求方法 ───

    private JsonNode providerPost(String path, ObjectNode reqBody) throws Exception {
        String token = getProviderAccessToken();
        String url = BASE_URL + path + "?provider_access_token=" + token;
        JsonNode resp = doPost(url, reqBody);
        if (resp.path("errcode").asInt(0) != 0) {
            throw new WeComProviderException(
                    resp.get("errcode").asInt(), resp.path("errmsg").asText(""));
        }
        return resp;
    }

    private JsonNode doPost(String url, ObjectNode body) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .timeout(Duration.ofSeconds(10))
                .build();
        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        return MAPPER.readTree(resp.body());
    }

    // ─── P2: 获取登录用户信息 ───

    /** 服务商后台免登 — 获取扫码登录的用户信息 */
    public JsonNode getLoginInfo(String authCode) throws Exception {
        String token = getProviderAccessToken();
        // 注意：此接口 URL 参数名是 access_token，但传 provider_access_token
        String url = BASE_URL + "/service/get_login_info?access_token=" + token;
        ObjectNode body = MAPPER.createObjectNode();
        body.put("auth_code", authCode);
        JsonNode resp = doPost(url, body);
        if (resp.path("errcode").asInt(0) != 0) {
            throw new WeComProviderException(
                    resp.get("errcode").asInt(), resp.path("errmsg").asText(""));
        }
        return resp;
    }

    // ─── P4: corpid 转换 ───

    /** 将企业原始 corpid 转换为服务商加密的 opencorpid */
    public String corpidToOpencorpid(String corpid) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("corpid", corpid);
        JsonNode resp = providerPost("/service/corpid_to_opencorpid", body);
        return resp.get("open_corpid").asText();
    }

    // ─── P5: 获取注册码 ───

    /**
     * 获取推广注册码
     *
     * @param templateId  推广注册模版 ID
     * @param corpName    预填企业名称（可选）
     * @param adminName   预填管理员姓名（可选）
     * @param adminMobile 预填管理员手机号（可选）
     * @param state       自定义参数，最长 128 字节（可选）
     */
    public JsonNode getRegisterCode(
            String templateId, String corpName, String adminName,
            String adminMobile, String state) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("template_id", templateId);
        if (corpName != null) body.put("corp_name", corpName);
        if (adminName != null) body.put("admin_name", adminName);
        if (adminMobile != null) body.put("admin_mobile", adminMobile);
        if (state != null) body.put("state", state);
        return providerPost("/service/get_register_code", body);
    }

    // ─── P6: 获取注册信息 ───

    /** 获取已注册企业的信息 */
    public JsonNode getRegisterInfo(String registerCode) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("register_code", registerCode);
        return providerPost("/service/get_register_info", body);
    }

    // ─── P8: 获取企业详情 ───

    /** 获取企业详细信息（行业、规模等） */
    public JsonNode getCorpDetail(String authCorpid) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("auth_corpid", authCorpid);
        return providerPost("/service/get_corp_detail", body);
    }
}
```

**P3 和 P9 使用 corp access_token，通过 ISVClient 调用：**

```java
package com.wecom.isv;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;

/**
 * IDConverter — 通讯录 ID 转译 + API 域名 IP（需要 corp access_token）
 */
public class IDConverter {
    private final WeComISVClient isvClient;

    public IDConverter(WeComISVClient isvClient) {
        this.isvClient = isvClient;
    }

    /**
     * P3: 通讯录 ID 转译（open_userid → userid）
     *
     * @param authCorpId     授权企业的 corpid
     * @param openUseridList 服务商加密的 open_userid 列表，最多 1000 个
     */
    public JsonNode useridToOpenuserid(
            String authCorpId, List<String> openUseridList) throws Exception {
        if (openUseridList.size() > 1000) {
            throw new IllegalArgumentException("open_userid_list 最多 1000 个");
        }
        return isvClient.post(authCorpId, "/batch/userid_to_openuserid",
                Map.of("open_userid_list", openUseridList));
    }

    /**
     * P3 反向: openuserid → userid 转译
     *
     * @param authCorpId    授权企业的 corpid
     * @param useridList    userid 列表，最多 1000 个
     */
    public JsonNode openuseridToUserid(
            String authCorpId, List<String> useridList) throws Exception {
        if (useridList.size() > 1000) {
            throw new IllegalArgumentException("userid_list 最多 1000 个");
        }
        return isvClient.post(authCorpId, "/batch/openuserid_to_userid",
                Map.of("userid_list", useridList));
    }

    /** P9: 获取企业微信 API 域名 IP 段 */
    public List<String> getApiDomainIp(String authCorpId) throws Exception {
        JsonNode resp = isvClient.get(authCorpId, "/get_api_domain_ip");
        List<String> ipList = new java.util.ArrayList<>();
        for (JsonNode ip : resp.path("ip_list")) {
            ipList.add(ip.asText());
        }
        return ipList;
    }
}
```

**P7 使用 suite_access_token，通过 ISVClient 调用：**

```java
package com.wecom.isv;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * ScopeManager — 设置授权应用可见范围（使用 suite_access_token）
 */
public class ScopeManager {
    private static final String BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final WeComISVClient isvClient;
    private final HttpClient httpClient;

    public ScopeManager(WeComISVClient isvClient) {
        this.isvClient = isvClient;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * P7: 设置授权应用可见范围
     *
     * @param agentid    授权应用的 agentid
     * @param allowUser  可见成员 userid 列表（可选）
     * @param allowParty 可见部门 ID 列表（可选）
     * @param allowTag   可见标签 ID 列表（可选）
     */
    public JsonNode setScope(
            int agentid, List<String> allowUser,
            List<Integer> allowParty, List<Integer> allowTag) throws Exception {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("agentid", agentid);
        if (allowUser != null) {
            ArrayNode arr = body.putArray("allow_user");
            allowUser.forEach(arr::add);
        }
        if (allowParty != null) {
            ArrayNode arr = body.putArray("allow_party");
            allowParty.forEach(arr::add);
        }
        if (allowTag != null) {
            ArrayNode arr = body.putArray("allow_tag");
            allowTag.forEach(arr::add);
        }

        String suiteToken = isvClient.getSuiteAccessToken();
        String url = BASE_URL + "/agent/set_scope?suite_access_token=" + suiteToken;
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .timeout(Duration.ofSeconds(10))
                .build();
        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        JsonNode result = MAPPER.readTree(resp.body());
        if (result.path("errcode").asInt(0) != 0) {
            throw new WeComProviderException(
                    result.get("errcode").asInt(), result.path("errmsg").asText(""));
        }
        return result;
    }
}
```

### 7.5 PHP

```php
<?php
/**
 * 企业微信服务商管理模块 — provider_access_token 凭证管理 + 服务商级 API
 */

namespace WeComISV;

use GuzzleHttp\Client;
use RuntimeException;

/** 服务商 API 错误 */
class WeComProviderException extends RuntimeException
{
    public int $errcode;
    public string $errmsg;

    public function __construct(int $errcode, string $errmsg)
    {
        $this->errcode = $errcode;
        $this->errmsg  = $errmsg;
        parent::__construct("WeCom Provider Error [{$errcode}]: {$errmsg}");
    }
}

/**
 * ProviderManager — 管理 provider_access_token 及服务商级 API
 * 使用 provider_access_token 凭证，适用于：免登、推广注册、corpid 转换、企业详情
 */
class ProviderManager
{
    private const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';

    private string $corpid;
    private string $providerSecret;
    private Client $httpClient;

    private ?string $providerToken = null;
    private float $providerTokenExpiresAt = 0;

    public function __construct(?string $corpid = null, ?string $providerSecret = null)
    {
        $this->corpid         = $corpid ?? getenv('WECOM_PROVIDER_CORPID');
        $this->providerSecret = $providerSecret ?? getenv('WECOM_PROVIDER_SECRET');
        $this->httpClient     = new Client(['timeout' => 10]);
    }

    // ─── provider_access_token 管理 ───

    /** 获取 provider_access_token（带缓存） */
    public function get_provider_access_token(): string
    {
        if ($this->providerToken !== null && time() < $this->providerTokenExpiresAt) {
            return $this->providerToken;
        }

        $resp = $this->do_post(self::BASE_URL . '/service/get_provider_token', [
            'corpid'          => $this->corpid,
            'provider_secret' => $this->providerSecret,
        ]);

        if (($resp['errcode'] ?? 0) !== 0) {
            throw new WeComProviderException($resp['errcode'], $resp['errmsg']);
        }
        $this->providerToken          = $resp['provider_access_token'];
        // 提前 300 秒刷新，避免临界过期
        $this->providerTokenExpiresAt = time() + $resp['expires_in'] - 300;
        return $this->providerToken;
    }

    // ─── 通用请求方法 ───

    private function provider_post(string $path, array $body = []): array
    {
        $token = $this->get_provider_access_token();
        $url   = self::BASE_URL . $path . '?provider_access_token=' . $token;
        $resp  = $this->do_post($url, $body);
        if (($resp['errcode'] ?? 0) !== 0) {
            throw new WeComProviderException($resp['errcode'], $resp['errmsg'] ?? '');
        }
        return $resp;
    }

    private function do_post(string $url, array $body): array
    {
        $response = $this->httpClient->post($url, ['json' => $body]);
        return json_decode($response->getBody()->getContents(), true);
    }

    // ─── P2: 获取登录用户信息 ───

    /**
     * 服务商后台免登 — 获取扫码登录的用户信息
     *
     * @param string $auth_code 扫码登录回调返回的临时授权码
     * @return array 包含 usertype, user_info, corp_info, agent 的数组
     */
    public function get_login_info(string $auth_code): array
    {
        $token = $this->get_provider_access_token();
        // 注意：此接口 URL 参数名是 access_token，但传 provider_access_token
        $url  = self::BASE_URL . '/service/get_login_info?access_token=' . $token;
        $resp = $this->do_post($url, ['auth_code' => $auth_code]);
        if (($resp['errcode'] ?? 0) !== 0) {
            throw new WeComProviderException($resp['errcode'], $resp['errmsg'] ?? '');
        }
        return $resp;
    }

    // ─── P4: corpid 转换 ───

    /**
     * 将企业原始 corpid 转换为服务商加密的 opencorpid
     *
     * @param string $corpid 企业原始 corpid
     * @return string 服务商加密后的 opencorpid
     */
    public function corpid_to_opencorpid(string $corpid): string
    {
        $resp = $this->provider_post('/service/corpid_to_opencorpid', [
            'corpid' => $corpid,
        ]);
        return $resp['open_corpid'];
    }

    // ─── P5: 获取注册码 ───

    /**
     * 获取推广注册码
     *
     * @param string      $template_id  推广注册模版 ID
     * @param string|null $corp_name    预填企业名称
     * @param string|null $admin_name   预填管理员姓名
     * @param string|null $admin_mobile 预填管理员手机号
     * @param string|null $state        自定义参数，最长 128 字节
     * @return array 包含 register_code, expires_in
     */
    public function get_register_code(
        string  $template_id,
        ?string $corp_name = null,
        ?string $admin_name = null,
        ?string $admin_mobile = null,
        ?string $state = null,
    ): array {
        $body = ['template_id' => $template_id];
        if ($corp_name !== null)    $body['corp_name']    = $corp_name;
        if ($admin_name !== null)   $body['admin_name']   = $admin_name;
        if ($admin_mobile !== null) $body['admin_mobile'] = $admin_mobile;
        if ($state !== null)        $body['state']        = $state;
        return $this->provider_post('/service/get_register_code', $body);
    }

    // ─── P6: 获取注册信息 ───

    /**
     * 获取已注册企业的信息
     *
     * @param string $register_code 注册码
     * @return array 包含 corpid, access_token, expires_in, state
     */
    public function get_register_info(string $register_code): array
    {
        return $this->provider_post('/service/get_register_info', [
            'register_code' => $register_code,
        ]);
    }

    // ─── P8: 获取企业详情 ───

    /**
     * 获取企业详细信息（行业、规模等）
     *
     * @param string $auth_corpid 授权企业的 corpid
     * @return array 包含 corp_full_name, corp_scale, corp_industry 等
     */
    public function get_corp_detail(string $auth_corpid): array
    {
        return $this->provider_post('/service/get_corp_detail', [
            'auth_corpid' => $auth_corpid,
        ]);
    }
}
```

**P3 和 P9 使用 corp access_token，通过 ISVClient 调用：**

```php
<?php

namespace WeComISV;

use InvalidArgumentException;

/**
 * IDConverter — 通讯录 ID 转译 + API 域名 IP（需要 corp access_token）
 */
class IDConverter
{
    private WeComISVClient $isvClient;

    public function __construct(WeComISVClient $isvClient)
    {
        $this->isvClient = $isvClient;
    }

    /**
     * P3: 通讯录 ID 转译（open_userid → userid）
     *
     * @param string   $auth_corpid     授权企业的 corpid
     * @param string[] $open_userid_list 服务商加密的 open_userid 列表，最多 1000 个
     * @return array 包含 open_userid_list(转换结果) 和 invalid_open_userid_list
     */
    public function userid_to_openuserid(string $auth_corpid, array $open_userid_list): array
    {
        if (count($open_userid_list) > 1000) {
            throw new InvalidArgumentException('open_userid_list 最多 1000 个');
        }
        return $this->isvClient->post($auth_corpid, '/batch/userid_to_openuserid', [
            'open_userid_list' => $open_userid_list,
        ]);
    }

    /**
     * P3 反向: openuserid → userid 转译
     *
     * @param string   $auth_corpid 授权企业的 corpid
     * @param string[] $userid_list userid 列表，最多 1000 个
     * @return array 包含 userid_list(转换结果) 和 invalid_userid_list
     */
    public function openuserid_to_userid(string $auth_corpid, array $userid_list): array
    {
        if (count($userid_list) > 1000) {
            throw new InvalidArgumentException('userid_list 最多 1000 个');
        }
        return $this->isvClient->post($auth_corpid, '/batch/openuserid_to_userid', [
            'userid_list' => $userid_list,
        ]);
    }

    /**
     * P9: 获取企业微信 API 域名 IP 段
     *
     * @param string $auth_corpid 授权企业的 corpid
     * @return string[] IP 段列表（CIDR 格式）
     */
    public function get_api_domain_ip(string $auth_corpid): array
    {
        $resp = $this->isvClient->get($auth_corpid, '/get_api_domain_ip');
        return $resp['ip_list'] ?? [];
    }
}
```

**P7 使用 suite_access_token，通过 ISVClient 调用：**

```php
<?php

namespace WeComISV;

use GuzzleHttp\Client;

/**
 * ScopeManager — 设置授权应用可见范围（使用 suite_access_token）
 */
class ScopeManager
{
    private const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';

    private WeComISVClient $isvClient;
    private Client $httpClient;

    public function __construct(WeComISVClient $isvClient)
    {
        $this->isvClient  = $isvClient;
        $this->httpClient = new Client(['timeout' => 10]);
    }

    /**
     * P7: 设置授权应用可见范围
     *
     * @param int        $agentid     授权应用的 agentid
     * @param string[]|null $allow_user  可见成员 userid 列表
     * @param int[]|null    $allow_party 可见部门 ID 列表
     * @param int[]|null    $allow_tag   可见标签 ID 列表
     */
    public function set_scope(
        int    $agentid,
        ?array $allow_user = null,
        ?array $allow_party = null,
        ?array $allow_tag = null,
    ): array {
        $body = ['agentid' => $agentid];
        if ($allow_user !== null)  $body['allow_user']  = $allow_user;
        if ($allow_party !== null) $body['allow_party'] = $allow_party;
        if ($allow_tag !== null)   $body['allow_tag']   = $allow_tag;

        $suiteToken = $this->isvClient->get_suite_access_token();
        $url = self::BASE_URL . '/agent/set_scope?suite_access_token=' . $suiteToken;

        $response = $this->httpClient->post($url, ['json' => $body]);
        $resp = json_decode($response->getBody()->getContents(), true);
        if (($resp['errcode'] ?? 0) !== 0) {
            throw new WeComProviderException($resp['errcode'], $resp['errmsg'] ?? '');
        }
        return $resp;
    }
}
```

---

## 8. 测试模板

### 8.1 Python (pytest)

```python
import pytest
from unittest.mock import patch, MagicMock
from wecom_provider import WeComProviderManager, WeComProviderError


@pytest.fixture
def manager():
    m = WeComProviderManager("test_corpid", "test_provider_secret")
    m._provider_token = "mock_provider_token"
    m._provider_token_expires_at = float("inf")
    return m


class TestProviderToken:
    """P1: 获取服务商凭证"""

    @patch("requests.post")
    def test_获取provider_token成功(self, mock_post):
        m = WeComProviderManager("corpid", "secret")
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "provider_access_token": "new_token", "expires_in": 7200,
        })
        token = m.provider_access_token
        assert token == "new_token"
        # 验证请求参数
        call_args = mock_post.call_args
        body = call_args[1]["json"]
        assert body["corpid"] == "corpid"
        assert body["provider_secret"] == "secret"

    @patch("requests.post")
    def test_provider_token缓存生效(self, mock_post, manager):
        """缓存有效期内不应重新请求"""
        token = manager.provider_access_token
        assert token == "mock_provider_token"
        mock_post.assert_not_called()

    @patch("requests.post")
    def test_provider_token过期自动刷新(self, mock_post):
        m = WeComProviderManager("corpid", "secret")
        m._provider_token = "old_token"
        m._provider_token_expires_at = 0  # 已过期
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "provider_access_token": "new_token", "expires_in": 7200,
        })
        token = m.provider_access_token
        assert token == "new_token"

    @patch("requests.post")
    def test_provider_secret错误抛异常(self, mock_post):
        m = WeComProviderManager("corpid", "wrong_secret")
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 40083, "errmsg": "invalid provider_secret",
        })
        with pytest.raises(WeComProviderError) as exc_info:
            _ = m.provider_access_token
        assert exc_info.value.errcode == 40083


class TestGetLoginInfo:
    """P2: 获取登录用户信息"""

    @patch("requests.request")
    def test_获取登录信息成功(self, mock_req, manager):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "usertype": 1,
            "user_info": {"userid": "admin", "name": "管理员"},
            "corp_info": {"corpid": "ww123"},
        })
        result = manager.get_login_info("auth_code_xxx")
        assert result["usertype"] == 1
        assert result["user_info"]["userid"] == "admin"

    @patch("requests.request")
    def test_auth_code无效抛异常(self, mock_req, manager):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 40029, "errmsg": "invalid code",
        })
        with pytest.raises(WeComProviderError) as exc_info:
            manager.get_login_info("expired_code")
        assert exc_info.value.errcode == 40029


class TestCorpidConversion:
    """P4: corpid 转换"""

    @patch("requests.request")
    def test_corpid转opencorpid成功(self, mock_req, manager):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "open_corpid": "wpXXXXXXXXXXXX",
        })
        result = manager.corpid_to_opencorpid("ww1234567890")
        assert result == "wpXXXXXXXXXXXX"


class TestRegisterCode:
    """P5/P6: 推广注册"""

    @patch("requests.request")
    def test_获取注册码成功(self, mock_req, manager):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "register_code": "reg_xxx", "expires_in": 86400,
        })
        result = manager.get_register_code(
            "tpl_xxx", corp_name="测试公司", state="ch001"
        )
        assert result["register_code"] == "reg_xxx"
        assert result["expires_in"] == 86400

    @patch("requests.request")
    def test_获取注册信息成功(self, mock_req, manager):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "corpid": "ww123", "access_token": "at_xxx",
            "expires_in": 7200, "state": "ch001",
        })
        result = manager.get_register_info("reg_xxx")
        assert result["corpid"] == "ww123"
        assert result["state"] == "ch001"


class TestCorpDetail:
    """P8: 获取企业详情"""

    @patch("requests.request")
    def test_获取企业详情成功(self, mock_req, manager):
        mock_req.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "corp_full_name": "示例科技有限公司",
            "corp_scale": "51-200",
            "corp_industry": "IT",
            "corp_sub_industry": "软件",
        })
        result = manager.get_corp_detail("ww123")
        assert result["corp_full_name"] == "示例科技有限公司"
        assert result["corp_scale"] == "51-200"


class TestIDConversion:
    """P3: 通讯录 ID 转译"""

    def test_超过1000个open_userid抛异常(self):
        from wecom_provider import WeComIDConverter
        converter = WeComIDConverter(MagicMock())
        with pytest.raises(ValueError, match="最多 1000 个"):
            converter.userid_to_openuserid("corp1", ["uid"] * 1001)
```

---

## 9. Code Review 检查清单

| 编号 | 检查项 | 严重度 |
|------|--------|--------|
| R1 | provider_secret 从环境变量读取，未硬编码 | CRITICAL |
| R2 | provider_access_token 有缓存，非每次调用都重新获取 | CRITICAL |
| R3 | P1 中的 corpid 是**服务商自己的** corpid，非授权企业的 | CRITICAL |
| R4 | P2 的 URL 参数名是 `access_token`（非 `provider_access_token`），但传入的是 provider_access_token | HIGH |
| R5 | 三种凭证类型严格区分使用：provider_access_token / suite_access_token / corp access_token | CRITICAL |
| R6 | P3 使用 corp access_token，非 provider_access_token | HIGH |
| R7 | P7 使用 suite_access_token，非 provider_access_token | HIGH |
| R8 | P3 的 open_userid_list 限制最多 1000 个 | HIGH |
| R9 | P5 的 register_code 有有效期，使用前需检查 | MEDIUM |
| R10 | P4 corpid_to_opencorpid 是单向转换，代码注释是否明确 | MEDIUM |
| R11 | register_corp 回调是否在 5 秒内响应 "success" | HIGH |
| R12 | register_corp 回调中的 AuthCode 是否及时用于换取 permanent_code | HIGH |
| R13 | provider_access_token 缓存过期时间是否提前刷新（如提前 300 秒） | MEDIUM |
| R14 | IP 白名单是否已在服务商管理后台配置 | HIGH |
| R15 | get_login_info 的 auth_code 是否一次性使用，无重复调用 | MEDIUM |

---

## 10. 踩坑指南

### G1: provider_access_token 是第三种独立凭证

provider_access_token 与 access_token（企业自建应用凭证）和 suite_access_token（代开发模版凭证）**完全独立**。三者获取方式不同、用途不同、不可混用。

| 凭证 | 获取方式 | 用途 |
|------|---------|------|
| access_token | corpid + corpsecret | 企业自建应用业务 API |
| suite_access_token | suite_id + suite_secret + suite_ticket | 代开发授权管理 |
| provider_access_token | 服务商 corpid + provider_secret | 服务商管理接口 |

-> 调用任何 API 前，务必确认该接口需要哪种凭证。

### G2: provider_secret 在服务商管理后台获取

provider_secret 不在企业管理后台，而在**服务商管理后台**（https://open.work.weixin.qq.com）→ 服务商信息 → 基本信息。

-> 如果收到 40083（invalid provider_secret），检查是否误用了 corpsecret 或 suite_secret。

### G3: get_login_info 的 auth_code 来源

`get_login_info` 的 `auth_code` 来自**服务商后台扫码登录**的回调，不是企业 OAuth2 登录的 code，也不是授权回调的 AuthCode。

-> 不要将企业 OAuth2 的 code 或授权回调的 AuthCode 传给 get_login_info。

### G4: get_login_info 的 URL 参数名是 access_token

虽然传入的是 provider_access_token，但此接口的 URL 参数名是 `access_token`（非 `provider_access_token`），这是历史原因造成的命名不一致。

-> 注意不要因为参数名是 `access_token` 就误传企业的 access_token。

### G5: 通讯录 ID 转译需要特殊权限

P3（userid_to_openuserid）需要在服务商管理后台**单独申请**「通讯录 ID 转译」能力，否则调用会返回权限错误。

-> 未开通此能力时不要调用此接口，否则会得到 48002 错误。

### G6: corpid_to_opencorpid 是单向转换

P4 只能将企业原始 corpid 转为服务商加密的 opencorpid，**反向转换需要使用不同接口**。

-> 如需 opencorpid → corpid 的反向转换，需使用 `opencorpid_to_corpid` 接口（需额外权限）。

### G7: 推广注册的 register_code 有有效期

P5 返回的 register_code 通常有 86400 秒（24 小时）的有效期，过期后需重新获取。

-> 不要提前大批量生成注册码缓存，应在需要时即时获取。

### G8: provider_access_token 的 corpid 是服务商自己的

P1（get_provider_token）中的 corpid 是**服务商自己的企业 corpid**，不是授权企业的 corpid。这是最常见的混淆点。

-> 如果收到 40013（invalid corpid），检查是否误传了授权企业的 corpid。

### G9: register_corp 回调中同时有 RegisterCode 和 AuthCode

收到 `register_corp` 回调时，需要分别处理两个码：
- `RegisterCode` → 调用 P6 获取注册信息（企业 corpid）
- `AuthCode` → 调用 `get_permanent_code`（wecom-isv-auth）换取永久授权码

-> 两个码都要处理，不要只用一个。

### G10: set_scope 使用 suite_access_token

P7（set_scope）使用的是 **suite_access_token**，不是 provider_access_token。这是唯一一个不使用 provider_access_token 的服务商管理接口。

-> 不要将 provider_access_token 传给 set_scope，会返回凭证错误。

---

## 11. 服务商管理域错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40013 | 不合法的 corpid | 检查是否误传授权企业的 corpid（应传服务商自己的） |
| 40029 | 不合法的 oauth_code | auth_code 已使用或过期 |
| 40083 | 不合法的 provider_secret | 检查 provider_secret 是否正确（服务商管理后台获取） |
| 41004 | corpid 为空 | 请求缺少 corpid 参数 |
| 42001 | provider_access_token 已过期 | 重新获取 provider_access_token |
| 45009 | 调用频率超限 | 降频，确保 token 有缓存 |
| 48002 | API 接口无权限 | 检查是否已申请对应能力（如通讯录 ID 转译） |
| 60020 | IP 不在白名单 | 服务商管理后台添加 IP 白名单 |
| 84100 | 注册码不存在或已过期 | 重新获取注册码 |
| 84101 | 注册码已使用 | 每个注册码仅能使用一次 |

---

## 12. 参考

### 12.1 官方文档

| 文档 | 链接 |
|------|------|
| 获取服务商凭证 | https://developer.work.weixin.qq.com/document/path/91200 |
| 获取登录用户信息 | https://developer.work.weixin.qq.com/document/path/91125 |
| userid 与 open_userid 转换 | https://developer.work.weixin.qq.com/document/path/95327 |
| corpid 与 opencorpid 转换 | https://developer.work.weixin.qq.com/document/path/95439 |
| 获取注册码 | https://developer.work.weixin.qq.com/document/path/90927 |
| 获取注册信息 | https://developer.work.weixin.qq.com/document/path/91150 |
| 设置授权应用可见范围 | https://developer.work.weixin.qq.com/document/path/90583 |
| 获取 API 域名 IP 段 | https://developer.work.weixin.qq.com/document/path/92520 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |

### 12.2 能力索引（ISV 域）

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 代开发基础、三级凭证、凭证体系 | wecom-isv-core |
| 授权流程、预授权码、永久授权码 | wecom-isv-auth |
| suite_ticket、授权通知、回调事件 | wecom-isv-callback |
| 接口调用许可、帐号购买、订单 | wecom-isv-license |
| 服务商凭证、免登、推广注册、ID 转换 | **wecom-isv-provider**（本 SKILL） |
| JS-SDK、agentConfig、前端签名 | wecom-isv-jssdk |
| 通讯录、成员、部门 | wecom-contact（复用，换 token 即可） |
| 消息推送、群聊 | wecom-message（复用，换 token 即可） |
