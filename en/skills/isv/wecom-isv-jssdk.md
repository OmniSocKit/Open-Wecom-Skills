---
name: wecom-isv-jssdk
description: |
  企业微信服务商代开发 JS-SDK 差异 SKILL。覆盖代开发模式下 JS-SDK 可信域名配置差异、jsapi_ticket 获取方式差异、
  ww.register 签名差异、agentConfig 签名差异、OAuth2 网页授权差异、多企业签名管理架构。
  TRIGGER: 当用户提到代开发 JS-SDK、代开发签名、代开发 jsapi_ticket、代开发 ww.register、代开发 OAuth2、
  代开发前端接入、ISV JS-SDK、代开发 agentConfig 相关开发时触发。
  本 SKILL 聚焦代开发与自建应用 JS-SDK 的差异部分，通用 JS-SDK 知识继承自 wecom-jssdk。
version: 1.0.0
domain: isv-jssdk
depends_on:
  - wecom-isv-core
  - wecom-jssdk
doc_ids: [90506, 90547, 90514, 94313, 97165, 97112, 97164]
api_count: 4
triggers:
  - 代开发 JS-SDK
  - 代开发 jssdk
  - 代开发签名
  - 代开发 jsapi_ticket
  - 代开发 ww.register
  - 代开发 agentConfig
  - 代开发 OAuth2
  - 代开发网页授权
  - 代开发前端接入
  - ISV JS-SDK
  - ISV jssdk
  - ISV 签名
  - ISV OAuth2
  - ISV agentConfig
  - ISV 前端
  - 服务商 JS-SDK
  - 服务商签名
  - 服务商网页授权
prerequisite_skills:
  - wecom-isv-core
  - wecom-jssdk
---

# WeCom ISV · JS-SDK Differences SKILL (wecom-isv-jssdk)

> 覆盖企业微信服务商代开发模式下 JS-SDK 的**全部差异点**：可信域名配置位置、jsapi_ticket 获取凭证差异、
> ww.register 参数差异、OAuth2 网页授权接口差异、多企业签名管理架构。
> 依赖 `wecom-isv-core` 提供的 WeComISVClient 三级凭证体系，依赖 `wecom-jssdk` 提供的签名算法和客户端 API 知识。

> **定位**：本 SKILL 聚焦代开发模式与自建应用 JS-SDK 的**差异部分**。通用 JS-SDK 知识（签名算法、客户端 API 详情、深色模式适配）继承自 `wecom-jssdk`。

---

## 1. Prerequisites

### 1.1 依赖 SKILL

| SKILL | 用途 |
|-------|------|
| wecom-core | 通用请求规范、回调加解密、错误处理 |
| wecom-isv-core | ISVClient 基础客户端、三级凭证体系、corp access_token 管理 |
| wecom-jssdk | JS-SDK 签名算法、客户端 API 详情、前端接入通用流程 |

### 1.2 权限与凭证

| 凭证 | 获取方式 | 用途 |
|------|---------|------|
| suite_access_token | wecom-isv-core 管理 | 获取 corp access_token 的前置凭证 |
| corp access_token | `POST /service/get_corp_token`（suite_access_token + permanent_code） | 获取 jsapi_ticket 的调用凭证 |

> **关键区别**：自建应用直接用 corpid + corpsecret 获取 access_token；代开发应用必须通过三级凭证链路获取 corp access_token。

### 1.3 前置配置

1. **已完成 wecom-isv-core 的全部前置配置**（服务商账号、代开发模版、回调 URL、IP 白名单）
2. **已有企业授权**（至少一个企业完成扫码授权，已获取 permanent_code）
3. **JS-SDK 可信域名已配置**（在**服务商管理后台**配置，不是企业管理后台）

### 1.4 可信域名配置差异（重要）

| 维度 | 自建应用 | 代开发应用 |
|------|---------|-----------|
| 配置位置 | 企业管理后台 → 应用 → 网页授权及 JS-SDK | **服务商管理后台** → 代开发模版 → 开发者接口 → JS-SDK 可信域名 |
| 配置主体 | 企业管理员 | 服务商管理员 |
| 验证方式 | 下载验证文件放到域名根目录 | 同左 |
| 生效范围 | 单个应用 | 该模版下所有授权企业 |

> **踩坑提醒**：代开发应用的可信域名配置在**服务商后台**，企业管理员无法在企业后台修改。如果忘记配置，所有 JS-SDK 调用均会失败。

---

## 2. Core Concepts

### 2.1 代开发 vs 自建应用 JS-SDK 差异总览

```
代开发 JS-SDK 差异点
├── 1. 可信域名配置位置
│   └── 服务商后台配置（非企业后台）
├── 2. jsapi_ticket 获取凭证
│   └── 使用 corp access_token（通过 get_corp_token 获取的）
├── 3. ww.register 参数
│   ├── corpId = 授权企业的 corpid（可能是加密 corpid）
│   └── agentId = 授权后分配的 agentid（非模版 agentid）
├── 4. OAuth2 网页授权
│   ├── 使用自建应用的 OAuth2 接口（不是第三方应用接口）
│   ├── appid = 授权企业 corpid
│   └── agentid = 授权后分配的 agentid
└── 5. 多企业管理
    └── 每个企业独立的 jsapi_ticket 缓存
```

### 2.2 凭证链路差异

**自建应用**：
```
corpid + corpsecret
    → access_token
    → GET /get_jsapi_ticket          → 企业 jsapi_ticket
    → GET /ticket/get?type=agent_config → 应用 jsapi_ticket
```

**代开发应用**：
```
suite_id + suite_secret + suite_ticket
    → suite_access_token
    → suite_access_token + auth_corpid + permanent_code
        → corp access_token（等效于自建应用的 access_token）
        → GET /get_jsapi_ticket              → 企业 jsapi_ticket
        → GET /ticket/get?type=agent_config  → 应用 jsapi_ticket
```

> **本质**：获取 jsapi_ticket 的接口与自建应用完全一致，唯一区别是 access_token 的来源不同。

### 2.3 参数对照表

| 参数 | 自建应用 | 代开发应用 | 说明 |
|------|---------|-----------|------|
| corpId | 企业原始 corpid | 授权企业的 corpid | 代开发可能是加密 corpid |
| agentId | 自建应用的 agentid | 授权后分配的 agentid | **不是**模版的 agentid |
| access_token | `GET /gettoken` 获取 | `POST /service/get_corp_token` 获取 | 两者获取方式不同，但本质等效 |
| jsapi_ticket | 同左 | 同左 | 接口完全一致，仅 access_token 来源不同 |
| OAuth2 接口 | 自建应用 OAuth2 | **自建应用 OAuth2**（不是第三方） | 代开发使用自建应用的 OAuth2 接口 |

### 2.4 agentId 来源说明

代开发应用的 agentId 不是模版的 agentid，而是**企业授权后分配的 agentid**。获取方式：

1. **授权回调**：调用 `POST /service/v2/get_permanent_code` 时返回的 `auth_info.agent[0].agentid`
2. **授权信息查询**：调用 `POST /service/get_auth_info` 时返回的 `auth_info.agent[0].agentid`

```json
{
  "auth_info": {
    "agent": [{
      "agentid": 1000042,
      "name": "应用名称",
      "square_logo_url": "https://..."
    }]
  }
}
```

> 每个授权企业分配的 agentid 不同。多企业场景需要按 corpid 维度存储 agentid。

---

## 3. API Quick Reference

### 3.1 服务端 API（获取签名所需材料）

| # | 接口 | 方法 | Endpoint | 凭证 | 说明 |
|---|------|------|----------|------|------|
| S1 | 获取企业 jsapi_ticket | GET | `get_jsapi_ticket` | corp access_token | 与自建应用接口一致 |
| S2 | 获取应用 jsapi_ticket | GET | `ticket/get?type=agent_config` | corp access_token | 与自建应用接口一致 |
| S3 | OAuth2 获取用户信息 | GET | `auth/getuserinfo` | corp access_token | 使用自建应用接口 |
| S4 | OAuth2 获取用户敏感信息 | POST | `auth/getuserdetail` | corp access_token | user_ticket 换取手机号等 |

### 3.2 客户端 API

| 接口 | 说明 | 差异点 |
|------|------|--------|
| `ww.register` | 注册页面身份 | corpId / agentId 参数不同 |
| 其他客户端 API | 扫码/位置/通讯录/客户联系等 | 无差异，注册后正常使用 |

> 客户端 API 的使用方式与自建应用完全一致，差异仅在注册环节的参数和签名凭证来源。详见 `wecom-jssdk` SKILL。

---

## 4. API Details

### S1. 获取企业 jsapi_ticket

```
GET https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=CORP_ACCESS_TOKEN
```

**关键差异**：这里的 `access_token` 是通过 `POST /service/get_corp_token` 获取的企业级 corp access_token，**不是** suite_access_token。

**请求参数**：

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | corp access_token（通过 get_corp_token 获取） |

**响应**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "ticket": "bxLdikRXVbTPdHSM05e5u5sUoXNKd8-41ZO3MhKoyN5OfkWITD...",
  "expires_in": 7200
}
```

**规则**：
1. **必须缓存**，按 corpid 维度独立缓存，有效期 7200 秒
2. 频率限制：400 次/小时/企业，100 次/小时/应用
3. 多企业场景需维护 `Map<corpid, ticket>` 结构

### S2. 获取应用 jsapi_ticket

```
GET https://qyapi.weixin.qq.com/cgi-bin/ticket/get?access_token=CORP_ACCESS_TOKEN&type=agent_config
```

**请求参数**：

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | corp access_token（通过 get_corp_token 获取） |
| type | 是 | string | 固定为 `agent_config` |

**响应**：与 S1 格式一致。

**规则**：
1. 同样按 corpid 维度独立缓存
2. 企业 jsapi_ticket 和应用 jsapi_ticket 是两个不同的值，分开缓存

### S3. OAuth2 获取用户信息（代开发模式）

```
GET https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=CORP_ACCESS_TOKEN&code=CODE
```

**关键差异**：代开发应用使用**自建应用的 OAuth2 接口**（`/auth/getuserinfo`），**不是**第三方应用的接口（`/service/getuserinfo3rd`）。

**请求参数**：

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | corp access_token |
| code | 是 | string | OAuth2 授权回调的 code，5 分钟内有效 |

**响应**（snsapi_base scope）：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "encrypted_userid",
  "user_ticket": "USER_TICKET"
}
```

**响应**（snsapi_privateinfo scope）：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "encrypted_userid",
  "user_ticket": "USER_TICKET",
  "expires_in": 7200
}
```

> 注意：返回的 userid 是服务商主体加密后的 userid（参见 wecom-isv-core 的 ID 安全升级说明）。

### S4. OAuth2 获取用户敏感信息

```
POST https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail?access_token=CORP_ACCESS_TOKEN
```

**请求参数** (JSON Body)：

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| user_ticket | 是 | string | 从 getuserinfo 接口获取的 user_ticket |

**响应**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "encrypted_userid",
  "mobile": "13800001111",
  "email": "test@example.com"
}
```

> 代开发应用获取手机号/邮箱等敏感信息需要用户通过 OAuth2 主动授权（scope=snsapi_privateinfo），无法通过通讯录接口直接获取。

---

## 5. OAuth2 网页授权（代开发模式）

### 5.1 构造授权链接

```
https://open.weixin.qq.com/connect/oauth2/authorize
  ?appid=AUTH_CORPID
  &redirect_uri=REDIRECT_URI
  &response_type=code
  &scope=snsapi_base
  &state=STATE
  &agentid=AUTH_AGENTID
  #wechat_redirect
```

**参数说明**：

| 参数 | 值 | 说明 |
|------|------|------|
| appid | 授权企业 corpid | **不是** suite_id，**不是**服务商 corpid |
| redirect_uri | URL 编码后的回调地址 | 域名需在可信域名内 |
| response_type | `code` | 固定值 |
| scope | `snsapi_base` 或 `snsapi_privateinfo` | base=静默授权, privateinfo=手动授权 |
| state | 自定义参数 | 原样回传，可用于防 CSRF |
| agentid | 授权后分配的 agentid | **不是**模版 agentid |

### 5.2 scope 对比

| scope | 授权方式 | 可获取信息 | 适用场景 |
|-------|---------|-----------|---------|
| snsapi_base | 静默授权 | userid（加密后） | 识别用户身份 |
| snsapi_privateinfo | 用户手动确认 | userid + 手机号 + 邮箱 | 获取敏感信息 |

### 5.3 代开发 OAuth2 vs 第三方应用 OAuth2

| 维度 | 代开发应用 | 第三方应用 |
|------|-----------|-----------|
| 授权链接 | `/connect/oauth2/authorize` | `/connect/oauth2/authorize`（相同 URL，不同参数） |
| appid 参数 | 授权企业 corpid | suite_id |
| 获取用户信息接口 | `GET /auth/getuserinfo` | `GET /service/getuserinfo3rd` |
| 凭证 | corp access_token | suite_access_token |

> **关键**：代开发应用虽然是服务商开发的，但 OAuth2 使用的是**自建应用的接口**，这是官方设计，不要用第三方应用的 OAuth2 接口。

---

## 6. Callbacks

代开发 JS-SDK 本身没有专属回调事件。相关回调由 `wecom-isv-core` 和 `wecom-isv-callback` SKILL 覆盖：

| 回调类型 | 所属 SKILL | 与 JS-SDK 的关系 |
|---------|-----------|-----------------|
| suite_ticket 推送 | wecom-isv-core | 凭证链路的起点 |
| create_auth 授权成功 | wecom-isv-auth | 获取 permanent_code 和 agentid |
| change_auth 授权变更 | wecom-isv-auth | agentid / 权限可能变化 |
| cancel_auth 取消授权 | wecom-isv-auth | 清理该企业的 ticket 缓存 |

### 授权事件中的 JS-SDK 相关处理

```
create_auth 事件处理：
    1. 用 auth_code 换取 permanent_code
    2. 从返回的 auth_info.agent[0].agentid 提取 agentid → 存储
    3. 从返回的 auth_corp_info.corpid 提取 corpid → 存储
    4. 这两个值是后续 JS-SDK 注册的必要参数

cancel_auth 事件处理：
    1. 清理该企业的 corp access_token 缓存
    2. 清理该企业的企业 jsapi_ticket 缓存
    3. 清理该企业的应用 jsapi_ticket 缓存
    4. 清理该企业的 agentid 记录
```

---

## 7. Workflows

### 7.1 代开发 JS-SDK 接入完整流程

```
前端:                                       后端:
                                           1. 获取 corp access_token
                                              (wecom-isv-core: get_corp_token)
                                           2. 获取企业 jsapi_ticket
                                              GET /get_jsapi_ticket
                                              → 按 corpid 缓存 2h
                                           3. 获取应用 jsapi_ticket
                                              GET /ticket/get?type=agent_config
                                              → 按 corpid 缓存 2h

4. npm install @wecom/jssdk              5. 接收签名请求
   或 CDN 引入                               识别当前企业 corpid
                                             取出对应 ticket
6. ww.register({                             SHA1 签名
     corpId: auth_corpid,                    返回 { timestamp, nonceStr, signature }
     agentId: auth_agentid,
     jsApiList: [...],
     getConfigSignature: async(url) => {
       return fetch('/api/isv/jssdk/config-sign?corpid=xxx&url=' + url)
     },
     getAgentConfigSignature: async(url) => {
       return fetch('/api/isv/jssdk/agent-sign?corpid=xxx&url=' + url)
     },
   })

7. ww.方法名({...})  →  调用 JS 接口（与自建应用完全一致）
```

### 7.2 代开发 OAuth2 网页授权流程

```
Step 1: 后端构造授权链接
    appid = 授权企业 corpid
    agentid = 授权后分配的 agentid
    redirect_uri = 编码后的回调 URL
    scope = snsapi_base 或 snsapi_privateinfo

Step 2: 用户在企业微信中点击链接
    → 静默授权（snsapi_base）：直接跳转
    → 手动授权（snsapi_privateinfo）：弹出授权确认页

Step 3: 企业微信回调
    → redirect_uri?code=CODE&state=STATE

Step 4: 后端用 code 换取用户信息
    GET /auth/getuserinfo?access_token=CORP_TOKEN&code=CODE
    → 获取 userid（加密后的）

Step 5: （如需敏感信息）用 user_ticket 换取详情
    POST /auth/getuserdetail?access_token=CORP_TOKEN
    Body: { "user_ticket": "TICKET" }
    → 获取手机号、邮箱等
```

### 7.3 多企业 JS-SDK 签名管理架构

```
ISVJSSDKManager（单例）
├── isv_client: WeComISVClient  ← 来自 wecom-isv-core
│
├── corp_tickets: Map<corpid, TicketPair>
│   ├── corp_a → { corp_ticket, agent_ticket, corp_ticket_expires, agent_ticket_expires }
│   ├── corp_b → { corp_ticket, agent_ticket, corp_ticket_expires, agent_ticket_expires }
│   └── corp_c → { ... }
│
├── corp_agents: Map<corpid, agentid>
│   ├── corp_a → 1000042
│   ├── corp_b → 1000058
│   └── corp_c → 1000071
│
├── get_config_signature(corpid, url)
│   ├── corp_token = isv_client.get_corp_token(corpid)
│   ├── ticket = get_corp_ticket(corpid)  // 从缓存或刷新
│   └── return make_signature(ticket, url)
│
├── get_agent_config_signature(corpid, url)
│   └── 同上，使用 agent_ticket
│
├── build_oauth2_url(corpid, redirect_uri, scope, state)
│   ├── agentid = corp_agents[corpid]
│   └── return 拼接后的 OAuth2 URL
│
└── get_user_info_by_code(corpid, code)
    ├── corp_token = isv_client.get_corp_token(corpid)
    └── GET /auth/getuserinfo?access_token=corp_token&code=code
```

### 7.4 前端获取 corpId 和 agentId 的推荐方式

```
方案一：URL 参数传递（推荐）
    后端生成页面 URL 时注入 corpid 和 agentid
    https://your-domain.com/app?corpid=xxx&agentid=xxx
    前端从 URL 解析出参数传给 ww.register

方案二：后端 API 获取
    前端通过 cookie/session 识别当前企业
    调用后端 API 获取 corpid 和 agentid
    再传给 ww.register

方案三：服务端渲染注入
    后端将 corpid 和 agentid 渲染到 HTML 模板中
    <script>window.__WECOM_CONFIG__ = { corpId: '...', agentId: ... }</script>
```

---

## 8. Code Templates

### 8.1 ISVJSSDKManager (Python)

```python
"""企业微信代开发 JS-SDK 签名管理器 — 多企业维度 ticket 缓存与签名生成"""
import hashlib
import time
import uuid
import threading
import urllib.parse
from typing import Optional


class ISVJSSDKManager:
    """代开发 JS-SDK 管理器

    管理多企业的 jsapi_ticket 缓存、签名生成、OAuth2 链接构造。
    依赖 WeComISVClient 获取 corp access_token。
    """

    OAUTH2_BASE = "https://open.weixin.qq.com/connect/oauth2/authorize"

    def __init__(self, isv_client):
        """
        Args:
            isv_client: WeComISVClient 实例（来自 wecom-isv-core）
        """
        self.isv_client = isv_client
        # 按 corpid 缓存 ticket: {corpid: {ticket, expires_at}}
        self._corp_tickets: dict[str, dict] = {}
        self._agent_tickets: dict[str, dict] = {}
        # 按 corpid 缓存 agentid
        self._corp_agents: dict[str, int] = {}
        self._lock = threading.Lock()

    # ─── 企业/agentid 注册 ───

    def register_corp_agent(self, auth_corpid: str, agentid: int):
        """注册企业的 agentid（授权回调后调用）

        Args:
            auth_corpid: 授权企业的 corpid
            agentid: 授权后分配的 agentid（非模版 agentid）
        """
        self._corp_agents[auth_corpid] = agentid

    def get_agent_id(self, auth_corpid: str) -> int:
        """获取企业的 agentid"""
        agentid = self._corp_agents.get(auth_corpid)
        if agentid is None:
            raise RuntimeError(
                f"企业 {auth_corpid} 的 agentid 未注册，"
                "请先调用 register_corp_agent"
            )
        return agentid

    # ─── S1: 获取企业 jsapi_ticket ───

    def get_corp_ticket(self, auth_corpid: str) -> str:
        """获取指定企业的企业 jsapi_ticket（带缓存）"""
        cached = self._corp_tickets.get(auth_corpid)
        if cached and time.time() < cached["expires_at"]:
            return cached["ticket"]

        with self._lock:
            # Double-check
            cached = self._corp_tickets.get(auth_corpid)
            if cached and time.time() < cached["expires_at"]:
                return cached["ticket"]

            # 使用 corp access_token 获取 ticket
            resp = self.isv_client.get(auth_corpid, "/get_jsapi_ticket")
            ticket = resp["ticket"]
            expires_at = time.time() + resp.get("expires_in", 7200) - 300
            self._corp_tickets[auth_corpid] = {
                "ticket": ticket,
                "expires_at": expires_at,
            }
            return ticket

    # ─── S2: 获取应用 jsapi_ticket ───

    def get_agent_ticket(self, auth_corpid: str) -> str:
        """获取指定企业的应用 jsapi_ticket（带缓存）"""
        cached = self._agent_tickets.get(auth_corpid)
        if cached and time.time() < cached["expires_at"]:
            return cached["ticket"]

        with self._lock:
            cached = self._agent_tickets.get(auth_corpid)
            if cached and time.time() < cached["expires_at"]:
                return cached["ticket"]

            resp = self.isv_client.get(
                auth_corpid,
                "/ticket/get",
                params={"type": "agent_config"},
            )
            ticket = resp["ticket"]
            expires_at = time.time() + resp.get("expires_in", 7200) - 300
            self._agent_tickets[auth_corpid] = {
                "ticket": ticket,
                "expires_at": expires_at,
            }
            return ticket

    # ─── 签名生成 ───

    @staticmethod
    def make_signature(ticket: str, url: str) -> dict:
        """生成 JS-SDK 签名

        Args:
            ticket: jsapi_ticket（企业或应用）
            url: 当前页面 URL（不含 # 及后面部分）

        Returns:
            {"timestamp": "...", "nonceStr": "...", "signature": "..."}
        """
        noncestr = uuid.uuid4().hex
        timestamp = str(int(time.time()))

        # 拼接规则固定：jsapi_ticket → noncestr → timestamp → url
        # 不要改变参数顺序，不要 URL encode
        sign_str = (
            f"jsapi_ticket={ticket}"
            f"&noncestr={noncestr}"
            f"&timestamp={timestamp}"
            f"&url={url}"
        )
        signature = hashlib.sha1(sign_str.encode("utf-8")).hexdigest()

        return {
            "timestamp": timestamp,
            "nonceStr": noncestr,
            "signature": signature,
        }

    def get_config_signature(self, auth_corpid: str, url: str) -> dict:
        """获取企业签名（用于 getConfigSignature 回调）

        Args:
            auth_corpid: 授权企业 corpid
            url: 当前页面 URL（不含 # 及后面部分）
        """
        ticket = self.get_corp_ticket(auth_corpid)
        return self.make_signature(ticket, url)

    def get_agent_config_signature(self, auth_corpid: str, url: str) -> dict:
        """获取应用签名（用于 getAgentConfigSignature 回调）

        Args:
            auth_corpid: 授权企业 corpid
            url: 当前页面 URL（不含 # 及后面部分）
        """
        ticket = self.get_agent_ticket(auth_corpid)
        return self.make_signature(ticket, url)

    # ─── OAuth2 ───

    def build_oauth2_url(
        self,
        auth_corpid: str,
        redirect_uri: str,
        scope: str = "snsapi_base",
        state: str = "STATE",
    ) -> str:
        """构造代开发模式的 OAuth2 授权链接

        Args:
            auth_corpid: 授权企业 corpid（作为 appid）
            redirect_uri: 回调地址（会自动 URL 编码）
            scope: snsapi_base（静默） 或 snsapi_privateinfo（手动授权）
            state: 自定义参数，原样回传

        Returns:
            完整的 OAuth2 授权链接
        """
        agentid = self.get_agent_id(auth_corpid)
        encoded_uri = urllib.parse.quote(redirect_uri, safe="")
        return (
            f"{self.OAUTH2_BASE}"
            f"?appid={auth_corpid}"
            f"&redirect_uri={encoded_uri}"
            f"&response_type=code"
            f"&scope={scope}"
            f"&state={state}"
            f"&agentid={agentid}"
            f"#wechat_redirect"
        )

    def get_user_info_by_code(self, auth_corpid: str, code: str) -> dict:
        """用 OAuth2 code 换取用户信息

        Args:
            auth_corpid: 授权企业 corpid
            code: OAuth2 授权回调的 code（5 分钟内有效，一次有效）

        Returns:
            {"userid": "encrypted_userid", "user_ticket": "...", ...}
        """
        return self.isv_client.get(
            auth_corpid,
            "/auth/getuserinfo",
            params={"code": code},
        )

    def get_user_detail(self, auth_corpid: str, user_ticket: str) -> dict:
        """用 user_ticket 换取用户敏感信息（手机号、邮箱等）

        Args:
            auth_corpid: 授权企业 corpid
            user_ticket: 从 get_user_info_by_code 获取的 user_ticket

        Returns:
            {"userid": "...", "mobile": "...", "email": "...", ...}
        """
        return self.isv_client.post(
            auth_corpid,
            "/auth/getuserdetail",
            json={"user_ticket": user_ticket},
        )

    # ─── 清理 ───

    def remove_corp(self, auth_corpid: str):
        """清理企业的所有 JS-SDK 缓存（取消授权时调用）"""
        self._corp_tickets.pop(auth_corpid, None)
        self._agent_tickets.pop(auth_corpid, None)
        self._corp_agents.pop(auth_corpid, None)
```

### 8.2 ISVJSSDKManager (TypeScript)

```typescript
/** 企业微信代开发 JS-SDK 签名管理器 — 多企业维度 ticket 缓存与签名生成 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { WeComISVClient } from './wecom-isv-core';

interface SignatureResult {
  timestamp: string;
  nonceStr: string;
  signature: string;
}

interface TicketCache {
  ticket: string;
  expiresAt: number; // Unix timestamp (秒)
}

export class ISVJSSDKManager {
  private static readonly OAUTH2_BASE =
    'https://open.weixin.qq.com/connect/oauth2/authorize';

  /** 按 corpid 缓存企业 jsapi_ticket */
  private corpTickets = new Map<string, TicketCache>();
  /** 按 corpid 缓存应用 jsapi_ticket */
  private agentTickets = new Map<string, TicketCache>();
  /** 按 corpid 存储授权后的 agentid */
  private corpAgents = new Map<string, number>();

  constructor(private isvClient: WeComISVClient) {}

  // ── 企业/agentid 注册 ──

  /** 注册企业的 agentid（授权回调后调用） */
  registerCorpAgent(authCorpId: string, agentId: number): void {
    this.corpAgents.set(authCorpId, agentId);
  }

  /** 获取企业的 agentid */
  getAgentId(authCorpId: string): number {
    const agentId = this.corpAgents.get(authCorpId);
    if (agentId === undefined) {
      throw new Error(`企业 ${authCorpId} 的 agentid 未注册`);
    }
    return agentId;
  }

  // ── S1: 获取企业 jsapi_ticket ──

  /** 获取指定企业的企业 jsapi_ticket（带缓存） */
  async getCorpTicket(authCorpId: string): Promise<string> {
    const cached = this.corpTickets.get(authCorpId);
    const now = Date.now() / 1000;
    if (cached && now < cached.expiresAt) return cached.ticket;

    const resp = await this.isvClient.get<{ ticket: string; expires_in: number }>(
      authCorpId,
      '/get_jsapi_ticket',
    );
    const expiresAt = now + (resp.expires_in || 7200) - 300;
    this.corpTickets.set(authCorpId, { ticket: resp.ticket, expiresAt });
    return resp.ticket;
  }

  // ── S2: 获取应用 jsapi_ticket ──

  /** 获取指定企业的应用 jsapi_ticket（带缓存） */
  async getAgentTicket(authCorpId: string): Promise<string> {
    const cached = this.agentTickets.get(authCorpId);
    const now = Date.now() / 1000;
    if (cached && now < cached.expiresAt) return cached.ticket;

    const resp = await this.isvClient.request<{ ticket: string; expires_in: number }>(
      authCorpId,
      'GET',
      '/ticket/get',
      undefined,
      undefined,
    );
    // 注意：需要附加 type=agent_config 查询参数
    // 实际调用时通过 isvClient 的 params 支持
    const expiresAt = now + (resp.expires_in || 7200) - 300;
    this.agentTickets.set(authCorpId, { ticket: resp.ticket, expiresAt });
    return resp.ticket;
  }

  // ── 签名生成 ──

  /** 生成 JS-SDK 签名 */
  static makeSignature(ticket: string, url: string): SignatureResult {
    const nonceStr = uuidv4().replace(/-/g, '');
    const timestamp = String(Math.floor(Date.now() / 1000));

    // 拼接规则固定：jsapi_ticket → noncestr → timestamp → url
    const signStr = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');

    return { timestamp, nonceStr, signature };
  }

  /** 获取企业签名（用于 getConfigSignature 回调） */
  async getConfigSignature(authCorpId: string, url: string): Promise<SignatureResult> {
    const ticket = await this.getCorpTicket(authCorpId);
    return ISVJSSDKManager.makeSignature(ticket, url);
  }

  /** 获取应用签名（用于 getAgentConfigSignature 回调） */
  async getAgentConfigSignature(authCorpId: string, url: string): Promise<SignatureResult> {
    const ticket = await this.getAgentTicket(authCorpId);
    return ISVJSSDKManager.makeSignature(ticket, url);
  }

  // ── OAuth2 ──

  /** 构造代开发模式的 OAuth2 授权链接 */
  buildOAuth2Url(
    authCorpId: string,
    redirectUri: string,
    scope: 'snsapi_base' | 'snsapi_privateinfo' = 'snsapi_base',
    state = 'STATE',
  ): string {
    const agentId = this.getAgentId(authCorpId);
    const encodedUri = encodeURIComponent(redirectUri);
    return (
      `${ISVJSSDKManager.OAUTH2_BASE}` +
      `?appid=${authCorpId}` +
      `&redirect_uri=${encodedUri}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&agentid=${agentId}` +
      `#wechat_redirect`
    );
  }

  /** 用 OAuth2 code 换取用户信息 */
  async getUserInfoByCode(
    authCorpId: string,
    code: string,
  ): Promise<Record<string, unknown>> {
    return this.isvClient.get(authCorpId, `/auth/getuserinfo?code=${code}`);
  }

  /** 用 user_ticket 换取用户敏感信息 */
  async getUserDetail(
    authCorpId: string,
    userTicket: string,
  ): Promise<Record<string, unknown>> {
    return this.isvClient.post(authCorpId, '/auth/getuserdetail', {
      user_ticket: userTicket,
    });
  }

  // ── 清理 ──

  /** 清理企业的所有 JS-SDK 缓存（取消授权时调用） */
  removeCorp(authCorpId: string): void {
    this.corpTickets.delete(authCorpId);
    this.agentTickets.delete(authCorpId);
    this.corpAgents.delete(authCorpId);
  }
}
```

### 8.3 ISVJSSDKManager (Go)

```go
package wecom

import (
	"crypto/sha1"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ISVJSSDKManager 代开发 JS-SDK 签名管理器，多企业维度 ticket 缓存与签名生成
type ISVJSSDKManager struct {
	ISVClient    *ISVClient
	corpTickets  map[string]*ticketCache // corpid → 企业 jsapi_ticket
	agentTickets map[string]*ticketCache // corpid → 应用 jsapi_ticket
	corpAgents   map[string]int          // corpid → agentid
	mu           sync.RWMutex
}

type ticketCache struct {
	Ticket    string
	ExpiresAt time.Time
}

// JssdkSignature JS-SDK 签名结果
type JssdkSignature struct {
	Timestamp string `json:"timestamp"`
	NonceStr  string `json:"nonceStr"`
	Signature string `json:"signature"`
}

const oauth2Base = "https://open.weixin.qq.com/connect/oauth2/authorize"

// NewISVJSSDKManager 创建代开发 JS-SDK 管理器
func NewISVJSSDKManager(isvClient *ISVClient) *ISVJSSDKManager {
	return &ISVJSSDKManager{
		ISVClient:    isvClient,
		corpTickets:  make(map[string]*ticketCache),
		agentTickets: make(map[string]*ticketCache),
		corpAgents:   make(map[string]int),
	}
}

// ── 企业/agentid 注册 ──

// RegisterCorpAgent 注册企业的 agentid（授权回调后调用）
func (m *ISVJSSDKManager) RegisterCorpAgent(authCorpID string, agentID int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.corpAgents[authCorpID] = agentID
}

// GetAgentID 获取企业的 agentid
func (m *ISVJSSDKManager) GetAgentID(authCorpID string) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	agentID, ok := m.corpAgents[authCorpID]
	if !ok {
		return 0, fmt.Errorf("企业 %s 的 agentid 未注册", authCorpID)
	}
	return agentID, nil
}

// ── S1: 获取企业 jsapi_ticket ──

// GetCorpTicket 获取指定企业的企业 jsapi_ticket（带缓存）
func (m *ISVJSSDKManager) GetCorpTicket(authCorpID string) (string, error) {
	m.mu.RLock()
	cached, ok := m.corpTickets[authCorpID]
	if ok && time.Now().Before(cached.ExpiresAt) {
		m.mu.RUnlock()
		return cached.Ticket, nil
	}
	m.mu.RUnlock()

	m.mu.Lock()
	defer m.mu.Unlock()

	// Double-check
	cached, ok = m.corpTickets[authCorpID]
	if ok && time.Now().Before(cached.ExpiresAt) {
		return cached.Ticket, nil
	}

	resp, err := m.ISVClient.Request(authCorpID, "GET", "/get_jsapi_ticket", nil)
	if err != nil {
		return "", fmt.Errorf("获取企业 jsapi_ticket 失败: %w", err)
	}
	ticket := resp["ticket"].(string)
	expiresIn := int(resp["expires_in"].(float64))
	m.corpTickets[authCorpID] = &ticketCache{
		Ticket:    ticket,
		ExpiresAt: time.Now().Add(time.Duration(expiresIn-300) * time.Second),
	}
	return ticket, nil
}

// ── S2: 获取应用 jsapi_ticket ──

// GetAgentTicket 获取指定企业的应用 jsapi_ticket（带缓存）
func (m *ISVJSSDKManager) GetAgentTicket(authCorpID string) (string, error) {
	m.mu.RLock()
	cached, ok := m.agentTickets[authCorpID]
	if ok && time.Now().Before(cached.ExpiresAt) {
		m.mu.RUnlock()
		return cached.Ticket, nil
	}
	m.mu.RUnlock()

	m.mu.Lock()
	defer m.mu.Unlock()

	cached, ok = m.agentTickets[authCorpID]
	if ok && time.Now().Before(cached.ExpiresAt) {
		return cached.Ticket, nil
	}

	// 注意：路径不含 /cgi-bin/ 前缀
	resp, err := m.ISVClient.Request(authCorpID, "GET", "/ticket/get?type=agent_config", nil)
	if err != nil {
		return "", fmt.Errorf("获取应用 jsapi_ticket 失败: %w", err)
	}
	ticket := resp["ticket"].(string)
	expiresIn := int(resp["expires_in"].(float64))
	m.agentTickets[authCorpID] = &ticketCache{
		Ticket:    ticket,
		ExpiresAt: time.Now().Add(time.Duration(expiresIn-300) * time.Second),
	}
	return ticket, nil
}

// ── 签名生成 ──

// MakeJssdkSignature 生成 JS-SDK 签名
func MakeJssdkSignature(ticket, pageURL string) JssdkSignature {
	nonceStr := uuid.New().String()[:32]
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	// 拼接规则固定：jsapi_ticket → noncestr → timestamp → url
	signStr := fmt.Sprintf("jsapi_ticket=%s&noncestr=%s&timestamp=%s&url=%s",
		ticket, nonceStr, timestamp, pageURL)
	h := sha1.New()
	h.Write([]byte(signStr))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	return JssdkSignature{
		Timestamp: timestamp,
		NonceStr:  nonceStr,
		Signature: signature,
	}
}

// GetConfigSignature 获取企业签名（用于 getConfigSignature 回调）
func (m *ISVJSSDKManager) GetConfigSignature(authCorpID, pageURL string) (JssdkSignature, error) {
	ticket, err := m.GetCorpTicket(authCorpID)
	if err != nil {
		return JssdkSignature{}, err
	}
	return MakeJssdkSignature(ticket, pageURL), nil
}

// GetAgentConfigSignature 获取应用签名（用于 getAgentConfigSignature 回调）
func (m *ISVJSSDKManager) GetAgentConfigSignature(authCorpID, pageURL string) (JssdkSignature, error) {
	ticket, err := m.GetAgentTicket(authCorpID)
	if err != nil {
		return JssdkSignature{}, err
	}
	return MakeJssdkSignature(ticket, pageURL), nil
}

// ── OAuth2 ──

// BuildOAuth2URL 构造代开发模式的 OAuth2 授权链接
func (m *ISVJSSDKManager) BuildOAuth2URL(authCorpID, redirectURI, scope, state string) (string, error) {
	agentID, err := m.GetAgentID(authCorpID)
	if err != nil {
		return "", err
	}
	if scope == "" {
		scope = "snsapi_base"
	}
	if state == "" {
		state = "STATE"
	}
	encodedURI := url.QueryEscape(redirectURI)
	return fmt.Sprintf(
		"%s?appid=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s&agentid=%d#wechat_redirect",
		oauth2Base, authCorpID, encodedURI, scope, state, agentID,
	), nil
}

// GetUserInfoByCode 用 OAuth2 code 换取用户信息
func (m *ISVJSSDKManager) GetUserInfoByCode(authCorpID, code string) (map[string]interface{}, error) {
	path := fmt.Sprintf("/auth/getuserinfo?code=%s", code)
	return m.ISVClient.Request(authCorpID, "GET", path, nil)
}

// GetUserDetail 用 user_ticket 换取用户敏感信息
func (m *ISVJSSDKManager) GetUserDetail(authCorpID, userTicket string) (map[string]interface{}, error) {
	body := map[string]string{"user_ticket": userTicket}
	return m.ISVClient.Request(authCorpID, "POST", "/auth/getuserdetail", body)
}

// ── 清理 ──

// RemoveCorp 清理企业的所有 JS-SDK 缓存（取消授权时调用）
func (m *ISVJSSDKManager) RemoveCorp(authCorpID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.corpTickets, authCorpID)
	delete(m.agentTickets, authCorpID)
	delete(m.corpAgents, authCorpID)
}
```

### 8.4 ISVJSSDKManager (Java)

```java
package com.wecom.isv;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 企业微信代开发 JS-SDK 签名管理器 — 多企业维度 ticket 缓存与签名生成
 *
 * <p>管理多企业的 jsapi_ticket 缓存、签名生成、OAuth2 链接构造。
 * 依赖 ISVClient 获取 corp access_token。
 */
public class ISVJSSDKManager {

    private static final String OAUTH2_BASE =
        "https://open.weixin.qq.com/connect/oauth2/authorize";

    private final ISVClient isvClient;

    /** corpid → 企业 jsapi_ticket 缓存 */
    private final ConcurrentHashMap<String, TicketCache> corpTickets = new ConcurrentHashMap<>();
    /** corpid → 应用 jsapi_ticket 缓存 */
    private final ConcurrentHashMap<String, TicketCache> agentTickets = new ConcurrentHashMap<>();
    /** corpid → agentid */
    private final ConcurrentHashMap<String, Integer> corpAgents = new ConcurrentHashMap<>();

    public ISVJSSDKManager(ISVClient isvClient) {
        this.isvClient = isvClient;
    }

    // ── 内部缓存结构 ──

    private static class TicketCache {
        final String ticket;
        final long expiresAt; // epoch millis

        TicketCache(String ticket, long expiresAt) {
            this.ticket = ticket;
            this.expiresAt = expiresAt;
        }

        boolean isValid() {
            return System.currentTimeMillis() < expiresAt;
        }
    }

    // ── 签名结果 ──

    public static class JssdkSignature {
        public final String timestamp;
        public final String nonceStr;
        public final String signature;

        JssdkSignature(String timestamp, String nonceStr, String signature) {
            this.timestamp = timestamp;
            this.nonceStr = nonceStr;
            this.signature = signature;
        }
    }

    // ── 企业/agentid 注册 ──

    /**
     * 注册企业的 agentid（授权回调后调用）
     *
     * @param authCorpId 授权企业的 corpid
     * @param agentId    授权后分配的 agentid（非模版 agentid）
     */
    public void registerCorpAgent(String authCorpId, int agentId) {
        corpAgents.put(authCorpId, agentId);
    }

    /**
     * 获取企业的 agentid
     *
     * @throws IllegalStateException 企业未注册
     */
    public int getAgentId(String authCorpId) {
        Integer agentId = corpAgents.get(authCorpId);
        if (agentId == null) {
            throw new IllegalStateException(
                "企业 " + authCorpId + " 的 agentid 未注册，请先调用 registerCorpAgent");
        }
        return agentId;
    }

    // ── S1: 获取企业 jsapi_ticket ──

    /**
     * 获取指定企业的企业 jsapi_ticket（带缓存）
     *
     * <p>使用 corp access_token（非 suite_access_token）调用。
     * 路径不含 /cgi-bin/ 前缀。
     */
    public synchronized String getCorpTicket(String authCorpId) throws Exception {
        TicketCache cached = corpTickets.get(authCorpId);
        if (cached != null && cached.isValid()) {
            return cached.ticket;
        }

        // 使用 corp access_token 获取 ticket
        Map<String, Object> resp = isvClient.request(authCorpId, "GET", "/get_jsapi_ticket", null);
        String ticket = (String) resp.get("ticket");
        int expiresIn = ((Number) resp.get("expires_in")).intValue();
        long expiresAt = System.currentTimeMillis() + (expiresIn - 300) * 1000L;
        corpTickets.put(authCorpId, new TicketCache(ticket, expiresAt));
        return ticket;
    }

    // ── S2: 获取应用 jsapi_ticket ──

    /**
     * 获取指定企业的应用 jsapi_ticket（带缓存）
     *
     * <p>路径不含 /cgi-bin/ 前缀。
     */
    public synchronized String getAgentTicket(String authCorpId) throws Exception {
        TicketCache cached = agentTickets.get(authCorpId);
        if (cached != null && cached.isValid()) {
            return cached.ticket;
        }

        Map<String, Object> resp = isvClient.request(
            authCorpId, "GET", "/ticket/get?type=agent_config", null);
        String ticket = (String) resp.get("ticket");
        int expiresIn = ((Number) resp.get("expires_in")).intValue();
        long expiresAt = System.currentTimeMillis() + (expiresIn - 300) * 1000L;
        agentTickets.put(authCorpId, new TicketCache(ticket, expiresAt));
        return ticket;
    }

    // ── 签名生成 ──

    /**
     * 生成 JS-SDK 签名
     *
     * <p>拼接规则固定：jsapi_ticket → noncestr → timestamp → url
     * 不要改变参数顺序，不要 URL encode。
     *
     * @param ticket  jsapi_ticket（企业或应用）
     * @param pageUrl 当前页面 URL（不含 # 及后面部分）
     */
    public static JssdkSignature makeSignature(String ticket, String pageUrl) {
        String nonceStr = UUID.randomUUID().toString().replace("-", "");
        String timestamp = String.valueOf(System.currentTimeMillis() / 1000);

        String signStr = "jsapi_ticket=" + ticket
            + "&noncestr=" + nonceStr
            + "&timestamp=" + timestamp
            + "&url=" + pageUrl;

        String signature = sha1Hex(signStr);
        return new JssdkSignature(timestamp, nonceStr, signature);
    }

    /**
     * 获取企业签名（用于 getConfigSignature 回调）
     */
    public JssdkSignature getConfigSignature(String authCorpId, String pageUrl) throws Exception {
        String ticket = getCorpTicket(authCorpId);
        return makeSignature(ticket, pageUrl);
    }

    /**
     * 获取应用签名（用于 getAgentConfigSignature 回调）
     */
    public JssdkSignature getAgentConfigSignature(String authCorpId, String pageUrl)
            throws Exception {
        String ticket = getAgentTicket(authCorpId);
        return makeSignature(ticket, pageUrl);
    }

    // ── OAuth2 ──

    /**
     * 构造代开发模式的 OAuth2 授权链接
     *
     * @param authCorpId  授权企业 corpid（作为 appid）
     * @param redirectUri 回调地址（会自动 URL 编码）
     * @param scope       snsapi_base（静默）或 snsapi_privateinfo（手动授权）
     * @param state       自定义参数，原样回传
     */
    public String buildOAuth2Url(String authCorpId, String redirectUri,
                                  String scope, String state) {
        int agentId = getAgentId(authCorpId);
        if (scope == null || scope.isEmpty()) {
            scope = "snsapi_base";
        }
        if (state == null || state.isEmpty()) {
            state = "STATE";
        }
        String encodedUri = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        return OAUTH2_BASE
            + "?appid=" + authCorpId
            + "&redirect_uri=" + encodedUri
            + "&response_type=code"
            + "&scope=" + scope
            + "&state=" + state
            + "&agentid=" + agentId
            + "#wechat_redirect";
    }

    /**
     * 用 OAuth2 code 换取用户信息
     *
     * @param authCorpId 授权企业 corpid
     * @param code       OAuth2 授权回调的 code（5 分钟内有效，一次有效）
     * @return {"userid": "encrypted_userid", "user_ticket": "...", ...}
     */
    public Map<String, Object> getUserInfoByCode(String authCorpId, String code) throws Exception {
        String path = "/auth/getuserinfo?code=" + code;
        return isvClient.request(authCorpId, "GET", path, null);
    }

    /**
     * 用 user_ticket 换取用户敏感信息（手机号、邮箱等）
     */
    public Map<String, Object> getUserDetail(String authCorpId, String userTicket)
            throws Exception {
        Map<String, Object> body = Map.of("user_ticket", userTicket);
        return isvClient.request(authCorpId, "POST", "/auth/getuserdetail", body);
    }

    // ── 清理 ──

    /**
     * 清理企业的所有 JS-SDK 缓存（取消授权时调用）
     */
    public void removeCorp(String authCorpId) {
        corpTickets.remove(authCorpId);
        agentTickets.remove(authCorpId);
        corpAgents.remove(authCorpId);
    }

    // ── 工具方法 ──

    private static String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(40);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 not available", e);
        }
    }
}
```

### 8.5 ISVJSSDKManager (PHP)

```php
<?php

namespace WeComISV;

/**
 * 企业微信代开发 JS-SDK 签名管理器 — 多企业维度 ticket 缓存与签名生成
 *
 * 管理多企业的 jsapi_ticket 缓存、签名生成、OAuth2 链接构造。
 * 依赖 ISVClient 获取 corp access_token。
 */
class ISVJSSDKManager
{
    private const OAUTH2_BASE = 'https://open.weixin.qq.com/connect/oauth2/authorize';

    private ISVClient $isvClient;

    /** @var array<string, array{ticket: string, expires_at: float}> corpid → 企业 jsapi_ticket */
    private array $corpTickets = [];

    /** @var array<string, array{ticket: string, expires_at: float}> corpid → 应用 jsapi_ticket */
    private array $agentTickets = [];

    /** @var array<string, int> corpid → agentid */
    private array $corpAgents = [];

    public function __construct(ISVClient $isvClient)
    {
        $this->isvClient = $isvClient;
    }

    // ── 企业/agentid 注册 ──

    /**
     * 注册企业的 agentid（授权回调后调用）
     *
     * @param string $authCorpId 授权企业的 corpid
     * @param int    $agentId    授权后分配的 agentid（非模版 agentid）
     */
    public function registerCorpAgent(string $authCorpId, int $agentId): void
    {
        $this->corpAgents[$authCorpId] = $agentId;
    }

    /**
     * 获取企业的 agentid
     *
     * @throws \RuntimeException 企业未注册
     */
    public function getAgentId(string $authCorpId): int
    {
        if (!isset($this->corpAgents[$authCorpId])) {
            throw new \RuntimeException(
                "企业 {$authCorpId} 的 agentid 未注册，请先调用 registerCorpAgent"
            );
        }
        return $this->corpAgents[$authCorpId];
    }

    // ── S1: 获取企业 jsapi_ticket ──

    /**
     * 获取指定企业的企业 jsapi_ticket（带缓存）
     *
     * 使用 corp access_token（非 suite_access_token）调用。
     * 路径不含 /cgi-bin/ 前缀。
     */
    public function getCorpTicket(string $authCorpId): string
    {
        $cached = $this->corpTickets[$authCorpId] ?? null;
        if ($cached !== null && time() < $cached['expires_at']) {
            return $cached['ticket'];
        }

        // 使用 corp access_token 获取 ticket
        $resp = $this->isvClient->request($authCorpId, 'GET', '/get_jsapi_ticket');
        $ticket = $resp['ticket'];
        $expiresIn = $resp['expires_in'] ?? 7200;
        $this->corpTickets[$authCorpId] = [
            'ticket'     => $ticket,
            'expires_at' => time() + $expiresIn - 300,
        ];
        return $ticket;
    }

    // ── S2: 获取应用 jsapi_ticket ──

    /**
     * 获取指定企业的应用 jsapi_ticket（带缓存）
     *
     * 路径不含 /cgi-bin/ 前缀。
     */
    public function getAgentTicket(string $authCorpId): string
    {
        $cached = $this->agentTickets[$authCorpId] ?? null;
        if ($cached !== null && time() < $cached['expires_at']) {
            return $cached['ticket'];
        }

        $resp = $this->isvClient->request(
            $authCorpId, 'GET', '/ticket/get', ['type' => 'agent_config']
        );
        $ticket = $resp['ticket'];
        $expiresIn = $resp['expires_in'] ?? 7200;
        $this->agentTickets[$authCorpId] = [
            'ticket'     => $ticket,
            'expires_at' => time() + $expiresIn - 300,
        ];
        return $ticket;
    }

    // ── 签名生成 ──

    /**
     * 生成 JS-SDK 签名
     *
     * 拼接规则固定：jsapi_ticket → noncestr → timestamp → url
     * 不要改变参数顺序，不要 URL encode。
     *
     * @param string $ticket  jsapi_ticket（企业或应用）
     * @param string $pageUrl 当前页面 URL（不含 # 及后面部分）
     * @return array{timestamp: string, nonceStr: string, signature: string}
     */
    public static function makeSignature(string $ticket, string $pageUrl): array
    {
        $nonceStr  = str_replace('-', '', self::generateUuid());
        $timestamp = (string) time();

        $signStr = "jsapi_ticket={$ticket}"
            . "&noncestr={$nonceStr}"
            . "&timestamp={$timestamp}"
            . "&url={$pageUrl}";

        $signature = sha1($signStr);

        return [
            'timestamp' => $timestamp,
            'nonceStr'  => $nonceStr,
            'signature' => $signature,
        ];
    }

    /**
     * 获取企业签名（用于 getConfigSignature 回调）
     */
    public function getConfigSignature(string $authCorpId, string $pageUrl): array
    {
        $ticket = $this->getCorpTicket($authCorpId);
        return self::makeSignature($ticket, $pageUrl);
    }

    /**
     * 获取应用签名（用于 getAgentConfigSignature 回调）
     */
    public function getAgentConfigSignature(string $authCorpId, string $pageUrl): array
    {
        $ticket = $this->getAgentTicket($authCorpId);
        return self::makeSignature($ticket, $pageUrl);
    }

    // ── OAuth2 ──

    /**
     * 构造代开发模式的 OAuth2 授权链接
     *
     * @param string $authCorpId  授权企业 corpid（作为 appid）
     * @param string $redirectUri 回调地址（会自动 URL 编码）
     * @param string $scope       snsapi_base（静默）或 snsapi_privateinfo（手动授权）
     * @param string $state       自定义参数，原样回传
     */
    public function buildOAuth2Url(
        string $authCorpId,
        string $redirectUri,
        string $scope = 'snsapi_base',
        string $state = 'STATE'
    ): string {
        $agentId    = $this->getAgentId($authCorpId);
        $encodedUri = rawurlencode($redirectUri);

        return self::OAUTH2_BASE
            . "?appid={$authCorpId}"
            . "&redirect_uri={$encodedUri}"
            . '&response_type=code'
            . "&scope={$scope}"
            . "&state={$state}"
            . "&agentid={$agentId}"
            . '#wechat_redirect';
    }

    /**
     * 用 OAuth2 code 换取用户信息
     *
     * @param string $authCorpId 授权企业 corpid
     * @param string $code       OAuth2 授权回调的 code（5 分钟内有效，一次有效）
     * @return array{userid: string, user_ticket?: string, ...}
     */
    public function getUserInfoByCode(string $authCorpId, string $code): array
    {
        return $this->isvClient->request(
            $authCorpId, 'GET', '/auth/getuserinfo', ['code' => $code]
        );
    }

    /**
     * 用 user_ticket 换取用户敏感信息（手机号、邮箱等）
     */
    public function getUserDetail(string $authCorpId, string $userTicket): array
    {
        return $this->isvClient->request(
            $authCorpId, 'POST', '/auth/getuserdetail', ['user_ticket' => $userTicket]
        );
    }

    // ── 清理 ──

    /**
     * 清理企业的所有 JS-SDK 缓存（取消授权时调用）
     */
    public function removeCorp(string $authCorpId): void
    {
        unset(
            $this->corpTickets[$authCorpId],
            $this->agentTickets[$authCorpId],
            $this->corpAgents[$authCorpId]
        );
    }

    // ── 工具方法 ──

    private static function generateUuid(): string
    {
        return sprintf(
            '%04x%04x%04x%04x%04x%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
```

### 8.6 前端 — 代开发模式完整接入模板

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代开发 JS-SDK 接入示例</title>
    <script src="https://wwcdn.weixin.qq.com/node/open/js/wecom-jssdk-2.3.4.js"></script>
</head>
<body>
<script>
/**
 * 代开发模式 JS-SDK 接入示例
 *
 * 关键差异：
 * 1. corpId 使用授权企业的 corpid（非服务商 corpid）
 * 2. agentId 使用授权后分配的 agentid（非模版 agentid）
 * 3. 签名接口需要传 corpid 让后端识别使用哪个企业的 ticket
 */

// ── 从 URL 参数或后端注入获取企业配置 ──
const params = new URLSearchParams(window.location.search);
const AUTH_CORP_ID = params.get('corpid') || window.__WECOM_CONFIG__?.corpId;
const AUTH_AGENT_ID = Number(params.get('agentid') || window.__WECOM_CONFIG__?.agentId);

if (!AUTH_CORP_ID || !AUTH_AGENT_ID) {
    console.error('缺少 corpid 或 agentid 参数');
}

// ── 注册 JS-SDK ──
ww.register({
    corpId: AUTH_CORP_ID,       // 授权企业的 corpid
    agentId: AUTH_AGENT_ID,     // 授权后分配的 agentid（非模版 agentid）
    jsApiList: [
        'scanQRCode',
        'getLocation',
        'selectExternalContact',
        'getCurExternalContact',
        'getContext',
        'openUserProfile',
    ],

    // 企业签名回调 — 使用企业 jsapi_ticket
    async getConfigSignature(url) {
        const resp = await fetch(
            `/api/isv/jssdk/config-signature`
            + `?corpid=${encodeURIComponent(AUTH_CORP_ID)}`
            + `&url=${encodeURIComponent(url)}`
        );
        if (!resp.ok) throw new Error('获取企业签名失败');
        return resp.json(); // { timestamp, nonceStr, signature }
    },

    // 应用签名回调 — 使用应用 jsapi_ticket
    async getAgentConfigSignature(url) {
        const resp = await fetch(
            `/api/isv/jssdk/agent-signature`
            + `?corpid=${encodeURIComponent(AUTH_CORP_ID)}`
            + `&url=${encodeURIComponent(url)}`
        );
        if (!resp.ok) throw new Error('获取应用签名失败');
        return resp.json(); // { timestamp, nonceStr, signature }
    },
});

// ── 获取上下文并执行业务逻辑 ──
async function init() {
    try {
        const ctx = await ww.getContext();
        console.log('当前入口:', ctx.entry);

        if (ctx.entry === 'single_chat_tools') {
            // 聊天工具栏场景：获取当前外部联系人
            const { userId } = await ww.getCurExternalContact();
            console.log('当前外部联系人:', userId);
            // 注意：此处 userId 是服务商加密后的 external_userid
        }
    } catch (err) {
        console.error('JS-SDK 初始化失败:', err);
    }
}

init();
</script>
</body>
</html>
```

### 8.7 后端签名 API 示例 (Python Flask)

```python
"""代开发 JS-SDK 签名 API — Flask 路由示例"""
from flask import Flask, request, jsonify

app = Flask(__name__)

# 假设 isv_jssdk_mgr 是全局单例 ISVJSSDKManager
# isv_jssdk_mgr = ISVJSSDKManager(isv_client)


@app.route("/api/isv/jssdk/config-signature")
def config_signature():
    """企业签名接口 — 前端 getConfigSignature 回调调用"""
    corpid = request.args.get("corpid")
    url = request.args.get("url")
    if not corpid or not url:
        return jsonify({"error": "缺少 corpid 或 url 参数"}), 400

    # 去掉 URL 中 # 及后面部分
    url = url.split("#")[0]

    try:
        sig = isv_jssdk_mgr.get_config_signature(corpid, url)
        return jsonify(sig)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/isv/jssdk/agent-signature")
def agent_signature():
    """应用签名接口 — 前端 getAgentConfigSignature 回调调用"""
    corpid = request.args.get("corpid")
    url = request.args.get("url")
    if not corpid or not url:
        return jsonify({"error": "缺少 corpid 或 url 参数"}), 400

    url = url.split("#")[0]

    try:
        sig = isv_jssdk_mgr.get_agent_config_signature(corpid, url)
        return jsonify(sig)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/isv/oauth2/authorize")
def oauth2_authorize():
    """构造 OAuth2 授权链接"""
    corpid = request.args.get("corpid")
    redirect_uri = request.args.get("redirect_uri")
    scope = request.args.get("scope", "snsapi_base")

    if not corpid or not redirect_uri:
        return jsonify({"error": "缺少 corpid 或 redirect_uri"}), 400

    try:
        url = isv_jssdk_mgr.build_oauth2_url(corpid, redirect_uri, scope)
        return jsonify({"url": url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/isv/oauth2/callback")
def oauth2_callback():
    """OAuth2 回调处理"""
    code = request.args.get("code")
    state = request.args.get("state")
    # 从 state 中解析出 corpid（建议在构造链接时将 corpid 编码到 state 中）
    corpid = state  # 简化示例

    if not code or not corpid:
        return jsonify({"error": "缺少参数"}), 400

    try:
        user_info = isv_jssdk_mgr.get_user_info_by_code(corpid, code)
        userid = user_info.get("userid")
        user_ticket = user_info.get("user_ticket")

        result = {"userid": userid}

        # 如果有 user_ticket，可进一步获取敏感信息
        if user_ticket:
            detail = isv_jssdk_mgr.get_user_detail(corpid, user_ticket)
            result["mobile"] = detail.get("mobile")
            result["email"] = detail.get("email")

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

---

## 9. Test Templates

### 9.1 Python (pytest)

```python
"""Tests for ISVJSSDKManager"""
import pytest
import hashlib
from unittest.mock import patch, MagicMock, PropertyMock

from wecom_isv_jssdk import ISVJSSDKManager


@pytest.fixture
def isv_client():
    """模拟 WeComISVClient"""
    client = MagicMock()
    # 模拟 get/post 方法
    client.get = MagicMock()
    client.post = MagicMock()
    return client


@pytest.fixture
def manager(isv_client):
    mgr = ISVJSSDKManager(isv_client)
    mgr.register_corp_agent("corp_001", 1000042)
    return mgr


class TestCorpTicket:
    """S1: 获取企业 jsapi_ticket"""

    def test_获取企业ticket成功(self, manager, isv_client):
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "CORP_TICKET_001", "expires_in": 7200,
        }
        ticket = manager.get_corp_ticket("corp_001")
        assert ticket == "CORP_TICKET_001"
        isv_client.get.assert_called_once_with("corp_001", "/get_jsapi_ticket")

    def test_ticket缓存生效(self, manager, isv_client):
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "CORP_TICKET_001", "expires_in": 7200,
        }
        manager.get_corp_ticket("corp_001")
        manager.get_corp_ticket("corp_001")  # 第二次应命中缓存
        assert isv_client.get.call_count == 1

    def test_不同企业ticket独立(self, manager, isv_client):
        isv_client.get.side_effect = [
            {"errcode": 0, "ticket": "TICKET_CORP_A", "expires_in": 7200},
            {"errcode": 0, "ticket": "TICKET_CORP_B", "expires_in": 7200},
        ]
        ticket_a = manager.get_corp_ticket("corp_a")
        ticket_b = manager.get_corp_ticket("corp_b")
        assert ticket_a == "TICKET_CORP_A"
        assert ticket_b == "TICKET_CORP_B"
        assert isv_client.get.call_count == 2


class TestAgentTicket:
    """S2: 获取应用 jsapi_ticket"""

    def test_获取应用ticket成功(self, manager, isv_client):
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "AGENT_TICKET_001", "expires_in": 7200,
        }
        ticket = manager.get_agent_ticket("corp_001")
        assert ticket == "AGENT_TICKET_001"
        isv_client.get.assert_called_once_with(
            "corp_001", "/ticket/get", params={"type": "agent_config"},
        )


class TestSignature:
    """签名算法"""

    def test_签名格式正确(self):
        result = ISVJSSDKManager.make_signature(
            "test_ticket", "https://example.com/page?a=1",
        )
        assert "timestamp" in result
        assert "nonceStr" in result
        assert "signature" in result
        assert len(result["signature"]) == 40  # SHA-1 hex 长度
        assert result["timestamp"].isdigit()
        assert len(result["nonceStr"]) == 32

    def test_签名可验证(self):
        """验证签名算法与手动计算一致"""
        ticket = "test_ticket_123"
        url = "https://example.com/page"

        result = ISVJSSDKManager.make_signature(ticket, url)

        # 手动计算验证
        sign_str = (
            f"jsapi_ticket={ticket}"
            f"&noncestr={result['nonceStr']}"
            f"&timestamp={result['timestamp']}"
            f"&url={url}"
        )
        expected = hashlib.sha1(sign_str.encode("utf-8")).hexdigest()
        assert result["signature"] == expected

    def test_获取企业签名(self, manager, isv_client):
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "CORP_TICKET", "expires_in": 7200,
        }
        sig = manager.get_config_signature("corp_001", "https://example.com")
        assert "signature" in sig
        assert len(sig["signature"]) == 40

    def test_获取应用签名(self, manager, isv_client):
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "AGENT_TICKET", "expires_in": 7200,
        }
        sig = manager.get_agent_config_signature("corp_001", "https://example.com")
        assert "signature" in sig


class TestOAuth2:
    """OAuth2 网页授权"""

    def test_构造授权链接_默认scope(self, manager):
        url = manager.build_oauth2_url(
            "corp_001", "https://example.com/callback",
        )
        assert "appid=corp_001" in url
        assert "agentid=1000042" in url
        assert "scope=snsapi_base" in url
        assert "redirect_uri=" in url
        assert url.endswith("#wechat_redirect")

    def test_构造授权链接_privateinfo_scope(self, manager):
        url = manager.build_oauth2_url(
            "corp_001",
            "https://example.com/callback",
            scope="snsapi_privateinfo",
        )
        assert "scope=snsapi_privateinfo" in url

    def test_未注册agentid_抛异常(self, manager):
        with pytest.raises(RuntimeError, match="agentid 未注册"):
            manager.build_oauth2_url("unknown_corp", "https://example.com/callback")

    def test_code换取用户信息(self, manager, isv_client):
        isv_client.get.return_value = {
            "errcode": 0, "userid": "enc_userid_001", "user_ticket": "ticket_xxx",
        }
        result = manager.get_user_info_by_code("corp_001", "auth_code_123")
        assert result["userid"] == "enc_userid_001"

    def test_user_ticket换取敏感信息(self, manager, isv_client):
        isv_client.post.return_value = {
            "errcode": 0, "userid": "enc_userid_001",
            "mobile": "13800001111", "email": "test@example.com",
        }
        result = manager.get_user_detail("corp_001", "user_ticket_xxx")
        assert result["mobile"] == "13800001111"


class TestCleanup:
    """清理"""

    def test_清理企业缓存(self, manager, isv_client):
        # 先填充缓存
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "TICKET", "expires_in": 7200,
        }
        manager.get_corp_ticket("corp_001")
        manager.get_agent_ticket("corp_001")

        # 清理
        manager.remove_corp("corp_001")

        # 再次获取应触发新的 API 调用
        isv_client.get.reset_mock()
        isv_client.get.return_value = {
            "errcode": 0, "ticket": "NEW_TICKET", "expires_in": 7200,
        }
        ticket = manager.get_corp_ticket("corp_001")
        assert ticket == "NEW_TICKET"
        assert isv_client.get.call_count == 1
```

---

## 10. Code Review Checklist

### 10.1 代开发 JS-SDK 专项审核

| # | 检查项 | 严重度 |
|---|--------|--------|
| R1 | jsapi_ticket 是否使用 **corp access_token** 获取（通过 get_corp_token），而非 suite_access_token | CRITICAL |
| R2 | ww.register 的 corpId 是否使用**授权企业的 corpid**，而非服务商 corpid 或模版 ID | CRITICAL |
| R3 | ww.register 的 agentId 是否使用**授权后分配的 agentid**，而非模版 agentid | CRITICAL |
| R4 | OAuth2 是否使用自建应用接口 (`/auth/getuserinfo`)，而非第三方接口 (`/service/getuserinfo3rd`) | CRITICAL |
| R5 | 签名是否在**服务端**完成（前端不暴露 jsapi_ticket） | CRITICAL |
| R6 | 签名字符串拼接顺序是否正确（jsapi_ticket → noncestr → timestamp → url） | HIGH |
| R7 | 签名用的 URL 是否不含 `#` 及后面部分 | HIGH |

### 10.2 多企业管理审核

| # | 检查项 | 严重度 |
|---|--------|--------|
| R8 | 企业 jsapi_ticket 是否按 **corpid 维度独立缓存** | CRITICAL |
| R9 | 应用 jsapi_ticket 是否按 **corpid 维度独立缓存** | CRITICAL |
| R10 | 企业 jsapi_ticket 和应用 jsapi_ticket 是否**分开缓存**（两个不同的值） | HIGH |
| R11 | agentid 是否按 corpid 维度存储（不同企业 agentid 不同） | HIGH |
| R12 | 取消授权时是否清理了该企业的 ticket 缓存和 agentid | MEDIUM |

### 10.3 安全审核

| # | 检查项 | 严重度 |
|---|--------|--------|
| R13 | jsapi_ticket 未在前端暴露或通过 API 明文返回 | CRITICAL |
| R14 | OAuth2 的 redirect_uri 已做白名单校验 | HIGH |
| R15 | OAuth2 的 state 参数用于防 CSRF | MEDIUM |
| R16 | 签名接口做了调用频率限制 | MEDIUM |
| R17 | userid 处理时意识到是加密后的 ID（非原始 userid） | MEDIUM |

### 10.4 代码模板合规审核

| # | 检查项 | 严重度 |
|---|--------|--------|
| R18 | API 路径不含 `/cgi-bin/` 前缀（客户端 base URL 已包含） | CRITICAL |
| R19 | Python `post()` 使用 `json=body` 关键字参数 | HIGH |
| R20 | Go 使用 4 参数签名 `c.client.Post(ctx, path, req, &resp)` | HIGH |

---

## 11. Gotcha Guide

### G1. jsapi_ticket 必须用 corp access_token 获取

代开发应用的 jsapi_ticket 必须使用通过 `POST /service/get_corp_token` 获取的 corp access_token 来调用，**不是** suite_access_token。

```
错误: GET /get_jsapi_ticket?access_token=SUITE_ACCESS_TOKEN  ← 会报错
正确: GET /get_jsapi_ticket?access_token=CORP_ACCESS_TOKEN   ← corp access_token
```

### G2. agentId 用授权后分配的，不是模版的

模版有一个 agentid，但这不是用于前端 JS-SDK 注册的 agentid。正确的 agentid 来自企业授权后 `get_permanent_code` 返回的 `auth_info.agent[0].agentid`。每个企业的 agentid 不同。

```javascript
// 错误
ww.register({ agentId: TEMPLATE_AGENT_ID, ... })

// 正确
ww.register({ agentId: AUTH_AGENT_ID, ... })  // 授权后分配的
```

### G3. corpId 使用授权企业的 corpid

代开发应用的 corpid 是授权企业的 corpid（可能是加密后的），不是服务商自己的 corpid，也不是 suite_id。

```javascript
// 错误
ww.register({ corpId: 'PROVIDER_CORP_ID', ... })   // 服务商 corpid
ww.register({ corpId: 'SUITE_ID', ... })            // suite_id

// 正确
ww.register({ corpId: 'AUTH_CORP_ID', ... })        // 授权企业的 corpid
```

### G4. OAuth2 使用自建应用接口

代开发应用虽然是服务商开发的，但 OAuth2 网页授权使用的是**自建应用的接口**：

```
错误: GET /service/getuserinfo3rd?suite_access_token=...  ← 第三方应用接口
正确: GET /auth/getuserinfo?access_token=CORP_TOKEN&code=CODE  ← 自建应用接口
```

OAuth2 授权链接中：
- `appid` = 授权企业 corpid（不是 suite_id）
- `agentid` = 授权后分配的 agentid

### G5. 签名用的 URL 必须精确匹配

签名用的 URL 必须与浏览器地址栏的 URL 完全一致（含 query string，不含 `#` 及后面部分）。

```python
# 错误：包含 hash
url = "https://example.com/page#/route"

# 正确：去掉 # 及后面部分
url = "https://example.com/page"

# 正确：保留 query string
url = "https://example.com/page?corpid=xxx&token=yyy"
```

SPA（Vue Router hash 模式）特别容易在此处出问题。

### G6. 多企业 ticket 必须独立缓存

每个授权企业有独立的 jsapi_ticket，不同企业的 ticket 不能混用。同时企业 jsapi_ticket 和应用 jsapi_ticket 是两个不同的值，也不能混用。

```
缓存结构：
  corp_tickets: { "corp_a": "ticket_1", "corp_b": "ticket_2" }
  agent_tickets: { "corp_a": "ticket_3", "corp_b": "ticket_4" }

错误：全局只缓存一个 ticket（多企业会串）
错误：企业 ticket 和应用 ticket 共用一个缓存
```

### G7. 可信域名在服务商后台配置

代开发应用的 JS-SDK 可信域名在**服务商管理后台**配置，不是在企业管理后台。企业管理员无法修改此配置。

```
配置路径：服务商管理后台 → 代开发模版 → 开发者接口 → JS-SDK 可信域名
```

### G8. 代开发应用不支持旧版 wx.config

代开发应用推荐使用新版 `ww.register`（`@wecom/jssdk`），不支持旧版 `wx.config` / `wx.agentConfig`（`jWeixin`）。

```javascript
// 错误（旧版）
wx.config({ ... })
wx.agentConfig({ ... })

// 正确（新版）
ww.register({
    corpId: '...',
    agentId: ...,
    getConfigSignature,
    getAgentConfigSignature,
})
```

### G9. 返回的 userid 是加密后的

代开发应用通过 OAuth2 获取的 userid 是服务商主体加密后的 userid，与企业自建应用获取的 userid 不同。如需对接企业内部系统，需使用 ID 转换接口。

### G10. ticket 频率限制

jsapi_ticket 获取接口频率限制为 400 次/小时/企业、100 次/小时/应用。多企业场景下如果不缓存，很容易触发限流。务必实现按 corpid 维度的缓存，过期前 5 分钟刷新。

---

## 12. References

### 12.1 官方文档

| 文档 | 链接 |
|------|------|
| JS-SDK 签名算法 | https://developer.work.weixin.qq.com/document/path/90506 |
| JS-SDK 开始使用（自建应用） | https://developer.work.weixin.qq.com/document/path/90547 |
| JS-SDK 开始使用（第三方应用） | https://developer.work.weixin.qq.com/document/path/90514 |
| ww.register API 详情 | https://developer.work.weixin.qq.com/document/path/94313 |
| 代开发与自建应用接口差异 | https://developer.work.weixin.qq.com/document/path/97165 |
| 代开发流程 | https://developer.work.weixin.qq.com/document/path/97112 |
| 代开发 access_token 获取 | https://developer.work.weixin.qq.com/document/path/97164 |
| OAuth2 网页授权 | https://developer.work.weixin.qq.com/document/path/91022 |
| 获取访问用户身份 | https://developer.work.weixin.qq.com/document/path/91023 |
| 获取用户敏感信息 | https://developer.work.weixin.qq.com/document/path/95833 |

### 12.2 能力索引

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 代开发凭证体系、suite_access_token | wecom-isv-core |
| 代开发授权流程、预授权码 | wecom-isv-auth |
| 代开发回调、suite_ticket | wecom-isv-callback |
| JS-SDK 客户端 API 详情（扫码/位置/通讯录/客户联系等） | wecom-jssdk |
| JS-SDK 签名算法（通用） | wecom-jssdk |
| 深色模式适配 | wecom-jssdk |
| 接口调用许可、帐号购买 | wecom-isv-license |

### 12.3 依赖 SKILL

```
wecom-isv-jssdk
├── wecom-isv-core   ← ISVClient、三级凭证体系、corp access_token 管理
├── wecom-jssdk      ← 签名算法、客户端 API 详情、通用接入流程
└── wecom-core       ← 通用请求规范、错误处理（间接依赖）
```
