---
name: wecom-auth
description: WeCom identity verification SKILL - OAuth2 web login, QR code login, SSO, user identity
version: 1.0.0
domain: authentication
depends_on: wecom-core
doc_ids: [91019, 91022, 91023, 91024, 91025, 91039, 91127, 91154, 91437]
api_count: 4
frontend_constructs: 3
triggers:
  - wecom auth
  - wecom oauth
  - wecom login
  - wecom sso
  - wecom identity
  - wecom qr login
  - 企业微信登录
  - 企业微信授权
  - 网页授权
  - 扫码登录
  - 单点登录
  - getuserinfo
  - getuserdetail
---

# WeCom Auth SKILL (wecom-auth)

> 企业微信身份验证域 SKILL：OAuth2 网页授权、扫码登录、SSO 单点登录

## 1. Prerequisites

使用本 SKILL 前，确保已掌握 `wecom-core` 中的：
- Token 管理（`access_token` 获取与缓存）
- 错误处理（`errcode` / `errmsg` 标准响应）
- HTTPS 请求基础

**权限要求**：
- OAuth 网页授权需配置应用的**可信域名**（`redirect_uri` 的域名必须完全匹配）
- `snsapi_privateinfo` scope 需应用拥有**成员敏感信息授权**权限
- 扫码登录需应用具备**企业微信授权登录**能力
- SSO 需**服务商身份**（`provider_secret`）

---

## 2. Core Concepts

### 2.1 三种登录场景

```
企业微信身份验证
├── 网页授权登录 (OAuth2)
│   ├── 企业微信内打开网页 → 静默获取身份
│   └── scope 控制信息粒度
├── 扫码授权登录 (QR Code)
│   ├── PC 浏览器场景 → 扫码获取身份
│   └── 跳转方式 / 内嵌二维码方式
└── SSO 单点登录 (Provider)
    ├── 服务商/第三方场景
    └── 使用 provider_access_token
```

### 2.2 三种 scope

| scope | 授权方式 | 可获取信息 |
|-------|----------|-----------|
| `snsapi_base` | 静默 | UserId / OpenId（基础） |
| `snsapi_userinfo` | 静默 | 成员详细信息（不含手机邮箱） |
| `snsapi_privateinfo` | 手动确认 | 手机、邮箱、头像等敏感字段 |

### 2.3 凭证体系对比

| 场景 | 凭证类型 | 获取方式 | 获取用户信息接口 |
|------|----------|----------|-----------------|
| 自建应用 OAuth/扫码 | `access_token` | corpid + corpsecret | `/cgi-bin/auth/getuserinfo` |
| 第三方应用 OAuth | `suite_access_token` | suite_id + suite_secret | `/cgi-bin/service/getuserinfo3rd` |
| SSO 单点登录 | `provider_access_token` | corpid + provider_secret | `/cgi-bin/service/get_login_info` |

### 2.4 code 的特性

- 最大 **512 字节**
- **一次性**：只能消费一次
- **5 分钟**有效期
- 每次授权生成的 code 不同

---

## 3. API Quick Reference

### 3.1 后端 API

| # | 接口 | 方法 | Endpoint | 凭证 | doc_id |
|---|------|------|----------|------|--------|
| B1 | 获取访问用户身份 | GET | `/cgi-bin/auth/getuserinfo` | access_token | 91023 |
| B2 | 获取访问用户敏感信息 | POST | `/cgi-bin/auth/getuserdetail` | access_token | 91024 |
| B3 | 获取服务商凭证 | POST | `/cgi-bin/service/get_provider_token` | 无（用 corpid+provider_secret） | 91127 |
| B4 | 获取登录用户信息(SSO) | POST | `/cgi-bin/service/get_login_info` | provider_access_token | 91154 |

### 3.2 前端构造（无后端 API 调用）

| # | 场景 | 域名 | 路径 | doc_id |
|---|------|------|------|--------|
| F1 | OAuth 网页授权 | open.weixin.qq.com | `/connect/oauth2/authorize` | 91022 |
| F2 | 扫码登录(自建) | open.work.weixin.qq.com | `/wwopen/sso/qrConnect` | 91039 |
| F3 | 扫码登录(SSO) | open.work.weixin.qq.com | `/wwopen/sso/3rd_qrConnect` | 91127 |

---

## 4. API Details

### F1. 构造 OAuth 网页授权链接

**URL 格式**：

```
https://open.weixin.qq.com/connect/oauth2/authorize?appid=CORPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&agentid=AGENTID&state=STATE#wechat_redirect
```

**参数**：

| 参数 | 必须 | 说明 |
|------|------|------|
| appid | 是 | 企业的 CorpID |
| redirect_uri | 是 | 授权后重定向 URL，需 **urlencode** |
| response_type | 是 | 固定为 `code` |
| scope | 是 | `snsapi_base` / `snsapi_userinfo` / `snsapi_privateinfo` |
| agentid | 条件 | scope 为 `snsapi_userinfo` 或 `snsapi_privateinfo` 时**必填** |
| state | 否 | 自定义参数，a-zA-Z0-9，≤128 字节 |
| #wechat_redirect | 是 | 终端使用此参数判断是否需要带上身份信息 |

**回调结果**：用户同意后跳转至 `redirect_uri?code=CODE&state=STATE`

---

### F2. 构造扫码登录链接（自建应用）

**URL 格式**：

```
https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=CORPID&agentid=AGENTID&redirect_uri=REDIRECT_URI&state=STATE
```

**参数**：

| 参数 | 必须 | 说明 |
|------|------|------|
| appid | 是 | 企业的 CorpID |
| agentid | 是 | 网页应用 ID |
| redirect_uri | 是 | 重定向地址，需 urlencode |
| state | 否 | 防 CSRF 随机字符串 |
| lang | 否 | 语言：`zh`（中文）/ `en`（英文） |

**回调结果**：
- 用户允许授权 → `redirect_uri?code=CODE&state=STATE`
- 用户禁止授权 → `redirect_uri?state=STATE`（无 code）

**JS SDK 内嵌方式（旧版）**：

```html
<script src="https://wwcdn.weixin.qq.com/node/wework/wwopen/js/wwLogin-1.2.4.js"></script>
<script>
var wwLogin = new WwLogin({
  id: "wx_reg",             // DOM 容器 ID
  appid: "CORPID",          // 企业 CorpID
  agentid: "AGENTID",       // 应用 ID
  redirect_uri: "REDIRECT_URI",  // 重定向地址
  state: "STATE",           // 防 CSRF
  href: "",                 // 自定义样式 CSS 链接（HTTPS）
  lang: "zh"                // 语言
});
</script>
```

**JS SDK 内嵌方式（新版，推荐）**：

```javascript
const wwLogin = ww.createWWLoginPanel({
  el: '#ww_login',
  params: {
    login_type: 'CorpApp',       // 'CorpApp' 自建应用 / 'ServiceApp' 第三方
    appid: 'CORPID',
    agentid: 'AGENTID',
    redirect_uri: 'REDIRECT_URI',
    state: 'STATE',
    redirect_type: 'callback',
  },
  onLoginSuccess({ code }) {
    // code → 发送到后端换取 userid
    console.log('code:', code);
  },
  onLoginFail(err) {
    console.error('Login failed:', err);
  },
});
```

| login_type | 说明 |
|------------|------|
| `CorpApp` | 企业自建应用扫码登录 |
| `ServiceApp` | 第三方应用扫码登录 |

---

### F3. 构造 SSO 扫码登录链接（服务商）

**URL 格式**：

```
https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=CORPID&redirect_uri=REDIRECT_URI&state=STATE&usertype=member
```

**参数**：

| 参数 | 必须 | 说明 |
|------|------|------|
| appid | 是 | 企业的 CorpID |
| redirect_uri | 是 | 重定向地址，需 urlencode |
| state | 否 | 防 CSRF 状态参数 |
| usertype | 否 | `member`（成员）/ `admin`（管理员） |

**回调结果**：用户扫码后跳转至 `redirect_uri?auth_code=AUTH_CODE&state=STATE`

> 注意：SSO 场景回调参数是 `auth_code`，不是 `code`。

---

### B1. 获取访问用户身份

```
GET https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=ACCESS_TOKEN&code=CODE
```

> 旧版接口 `/cgi-bin/user/getuserinfo` 仍可用，推荐使用新版路径。

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证 |
| code | 是 | string | OAuth2 授权获取的 code，≤512 字节，一次性，5 分钟有效 |

**返回 - 企业成员**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "USERID"
}
```

**返回 - 非企业成员**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "openid": "OPENID",
  "external_userid": "EXTERNAL_USERID"
}
```

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| userid | string | 企业成员 UserID（成员时返回） |
| openid | string | 非企业成员标识，≤64 字节（非成员时返回） |
| external_userid | string | 外部联系人 ID（用户是企业客户且有跟进人在可见范围时返回） |
| user_ticket | string | 成员票据（scope 为 `snsapi_privateinfo` 时返回，用于调用 B2 获取敏感信息） |
| expires_in | int | user_ticket 有效期（秒） |
| DeviceId | string | 手机设备号（旧版接口返回，安装时随机生成，删除重装会变，升级不变） |

**权限**：`redirect_uri` 的域名须完全匹配 `access_token` 对应应用的可信域名，否则返回 50001。

**常见错误码**：

| 错误码 | 说明 |
|--------|------|
| 40029 | code 无效（已使用或已过期） |
| 50001 | redirect_uri 与应用可信域名不匹配 |
| 40014 | access_token 无效 |
| 42001 | access_token 已过期 |

---

### B2. 获取访问用户敏感信息

```
POST https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail?access_token=ACCESS_TOKEN
```

**请求体**：

```json
{
  "user_ticket": "USER_TICKET"
}
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证（URL 参数） |
| user_ticket | 是 | string | 成员票据（scope 为 `snsapi_privateinfo` 时由 B1 返回） |

**前置条件**：
1. 构造 OAuth 链接时 scope 必须为 `snsapi_privateinfo`
2. 成员手动确认授权
3. 调用 B1 接口返回的 `user_ticket` 传入

**返回示例**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "lisi",
  "gender": "1",
  "avatar": "http://shp.qpic.cn/bizmp/xxx/0",
  "qr_code": "https://open.work.weixin.qq.com/wwopen/userQRCode?vcode=xxx",
  "mobile": "13800000000",
  "email": "zhangsan@gzdev.com",
  "biz_mail": "zhangsan@qyycs2.wecom.work",
  "address": "广州市海珠区新港中路"
}
```

**敏感字段列表**（需管理员在应用详情中勾选，且成员授权后才返回）：

| 字段 | 类型 | 说明 |
|------|------|------|
| userid | string | 成员 UserID |
| gender | string | 性别：0=未定义, 1=男, 2=女 |
| avatar | string | 头像 URL |
| qr_code | string | 员工个人二维码 |
| mobile | string | 手机号 |
| email | string | 邮箱 |
| biz_mail | string | 企业邮箱 |
| address | string | 地址 |

**第三方应用使用不同接口**：
```
POST https://qyapi.weixin.qq.com/cgi-bin/service/auth/getuserdetail3rd?suite_access_token=SUITE_ACCESS_TOKEN
```

---

### B3. 获取服务商凭证 (provider_access_token)

```
POST https://qyapi.weixin.qq.com/cgi-bin/service/get_provider_token
```

**请求体**：

```json
{
  "corpid": "CORPID",
  "provider_secret": "PROVIDER_SECRET"
}
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| corpid | 是 | string | 企业 CorpID |
| provider_secret | 是 | string | 服务商 secret（管理后台 → 标准应用服务 → 通用开发参数） |

**返回示例**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "provider_access_token": "PROVIDER_ACCESS_TOKEN",
  "expires_in": 7200
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| provider_access_token | string | 服务商凭证 |
| expires_in | int | 有效期（秒），通常 7200 |

---

### B4. 获取登录用户信息 (SSO)

```
POST https://qyapi.weixin.qq.com/cgi-bin/service/get_login_info?access_token=PROVIDER_ACCESS_TOKEN
```

**请求体**：

```json
{
  "auth_code": "AUTH_CODE"
}
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 即 `provider_access_token`（URL 参数） |
| auth_code | 是 | string | 用户扫码授权后的临时授权码（请求体） |

**返回示例 - 成员登录**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "usertype": 1,
  "user_info": {
    "userid": "zhangsan",
    "open_userid": "xxx",
    "name": "张三",
    "avatar": "http://shp.qpic.cn/bizmp/xxx/0"
  },
  "corp_info": {
    "corpid": "wx1234567890"
  },
  "agent": [
    {"agentid": 1000001, "auth_type": 1}
  ]
}
```

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| usertype | int | 1=创建者, 2=内部管理员, 3=外部管理员, 4=普通成员, 5=未注册成员 |
| user_info.userid | string | 用户 UserID |
| user_info.open_userid | string | 全局唯一用户 ID（跨企业唯一） |
| user_info.name | string | 用户名称 |
| user_info.avatar | string | 头像 URL |
| corp_info.corpid | string | 企业 CorpID |
| agent | array | 应用信息（管理员登录时返回） |
| agent[].agentid | int | 应用 ID |
| agent[].auth_type | int | 授权类型 |

**常见错误码**：

| 错误码 | 说明 |
|--------|------|
| 40029 | auth_code 无效 |
| 40014 | provider_access_token 无效 |
| 42001 | provider_access_token 已过期 |
| 60020 | 不允许从当前 IP 访问 |

---

## 5. Workflows

### 5.1 OAuth 网页授权流程（自建应用）

```
前端                          企业微信                      后端
  │                              │                           │
  ├─── 构造 OAuth URL (F1) ──────►│                           │
  │                              │◄── 用户在企业微信内点击 ───│
  │                              │                           │
  │◄── redirect_uri?code=CODE ───│                           │
  │                              │                           │
  ├─── code 发送到后端 ──────────────────────────────────────►│
  │                              │     GET /auth/getuserinfo │
  │                              │◄─────── (B1) ─────────────│
  │                              │──── userid ───────────────►│
  │                              │                           │
  │                              │  (若需敏感信息,scope=snsapi_privateinfo)
  │                              │     POST /auth/getuserdetail │
  │                              │◄─────── (B2) ─────────────│
  │                              │── mobile/email ───────────►│
  │◄── 登录成功 ──────────────────────────────────────────────│
```

### 5.2 扫码登录流程（自建应用 PC 端）

```
1. 前端构造扫码链接 (F2) 或使用 JS SDK 内嵌二维码
2. 用户使用企业微信 App 扫码
3. 用户确认授权
4. 回调 redirect_uri?code=CODE&state=STATE
5. 后端用 code 调用 B1 获取 userid
6. 完成登录
```

### 5.3 SSO 单点登录流程（服务商）

```
1. 后端调用 B3 获取 provider_access_token
2. 前端构造 SSO 扫码链接 (F3)
3. 用户扫码授权
4. 回调 redirect_uri?auth_code=AUTH_CODE&state=STATE
5. 后端用 auth_code + provider_access_token 调用 B4
6. 获取 usertype + user_info + corp_info
7. 完成登录
```

### 5.4 完整的敏感信息获取流程

```
1. 构造 OAuth 链接，scope=snsapi_privateinfo
2. 用户手动确认授权敏感信息
3. 回调获取 code
4. 调用 B1 (getuserinfo) → 获取 userid + user_ticket
5. 调用 B2 (getuserdetail)，传入 user_ticket → 获取 mobile/email/avatar 等
```

---

## 6. Code Templates

### 6.1 Python

```python
"""WeCom Auth Client - OAuth2 / QR Login / SSO"""

from urllib.parse import urlencode, quote
from typing import Optional
import httpx  # or requests


BASE_URL = "https://qyapi.weixin.qq.com"


class WeComAuth:
    """企业微信身份验证客户端"""

    def __init__(self, corpid: str, corpsecret: str):
        self.corpid = corpid
        self.corpsecret = corpsecret
        self._client = httpx.Client(base_url=BASE_URL, timeout=10)
        self._token: Optional[str] = None

    def _get_token(self) -> str:
        if self._token:
            return self._token
        resp = self._client.get(
            "/cgi-bin/gettoken",
            params={"corpid": self.corpid, "corpsecret": self.corpsecret},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"Token error: {data}")
        self._token = data["access_token"]
        return self._token

    # ── F1: 构造 OAuth 网页授权链接 ──

    def build_oauth_url(
        self,
        redirect_uri: str,
        scope: str = "snsapi_base",
        agentid: Optional[int] = None,
        state: str = "",
    ) -> str:
        """构造 OAuth2 网页授权链接"""
        params = {
            "appid": self.corpid,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": scope,
        }
        if agentid is not None:
            params["agentid"] = str(agentid)
        if state:
            params["state"] = state
        qs = urlencode(params)
        return f"https://open.weixin.qq.com/connect/oauth2/authorize?{qs}#wechat_redirect"

    # ── F2: 构造扫码登录链接 ──

    def build_qr_login_url(
        self,
        agentid: int,
        redirect_uri: str,
        state: str = "",
        lang: str = "zh",
    ) -> str:
        """构造扫码登录链接（自建应用）"""
        params = {
            "appid": self.corpid,
            "agentid": str(agentid),
            "redirect_uri": redirect_uri,
        }
        if state:
            params["state"] = state
        if lang:
            params["lang"] = lang
        qs = urlencode(params)
        return f"https://open.work.weixin.qq.com/wwopen/sso/qrConnect?{qs}"

    # ── B1: 获取访问用户身份 ──

    def get_user_info(self, code: str) -> dict:
        """用 code 换取用户身份（userid 或 openid）"""
        token = self._get_token()
        resp = self._client.get(
            "/cgi-bin/auth/getuserinfo",
            params={"access_token": token, "code": code},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"getuserinfo error: {data}")
        return data

    # ── B2: 获取访问用户敏感信息 ──

    def get_user_detail(self, user_ticket: str) -> dict:
        """用 user_ticket 获取敏感信息（手机/邮箱等）"""
        token = self._get_token()
        resp = self._client.post(
            "/cgi-bin/auth/getuserdetail",
            params={"access_token": token},
            json={"user_ticket": user_ticket},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"getuserdetail error: {data}")
        return data


class WeComSSOAuth:
    """企业微信 SSO 单点登录客户端（服务商场景）"""

    def __init__(self, corpid: str, provider_secret: str):
        self.corpid = corpid
        self.provider_secret = provider_secret
        self._client = httpx.Client(base_url=BASE_URL, timeout=10)
        self._provider_token: Optional[str] = None

    # ── B3: 获取服务商凭证 ──

    def _get_provider_token(self) -> str:
        if self._provider_token:
            return self._provider_token
        resp = self._client.post(
            "/cgi-bin/service/get_provider_token",
            json={"corpid": self.corpid, "provider_secret": self.provider_secret},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"Provider token error: {data}")
        self._provider_token = data["provider_access_token"]
        return self._provider_token

    # ── F3: 构造 SSO 扫码链接 ──

    def build_sso_qr_url(
        self,
        redirect_uri: str,
        state: str = "",
        usertype: str = "member",
    ) -> str:
        """构造 SSO 扫码登录链接（服务商）"""
        params = {
            "appid": self.corpid,
            "redirect_uri": redirect_uri,
        }
        if state:
            params["state"] = state
        if usertype:
            params["usertype"] = usertype
        qs = urlencode(params)
        return f"https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?{qs}"

    # ── B4: 获取登录用户信息 ──

    def get_login_info(self, auth_code: str) -> dict:
        """SSO: 用 auth_code 获取登录用户信息"""
        token = self._get_provider_token()
        resp = self._client.post(
            "/cgi-bin/service/get_login_info",
            params={"access_token": token},
            json={"auth_code": auth_code},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"get_login_info error: {data}")
        return data
```

### 6.2 TypeScript

```typescript
/**
 * WeCom Auth Client - OAuth2 / QR Login / SSO
 */

const BASE_URL = "https://qyapi.weixin.qq.com";

// ── Types ──

interface UserIdentity {
  errcode: number;
  errmsg: string;
  userid?: string;          // 企业成员
  openid?: string;          // 非企业成员
  external_userid?: string; // 外部联系人
  user_ticket?: string;     // scope=snsapi_privateinfo 时返回
  expires_in?: number;      // user_ticket 有效期
}

interface UserDetail {
  errcode: number;
  errmsg: string;
  userid: string;
  gender?: string;
  avatar?: string;
  qr_code?: string;
  mobile?: string;
  email?: string;
  biz_mail?: string;
  address?: string;
}

interface SSOLoginInfo {
  errcode: number;
  errmsg: string;
  usertype: number;  // 1=创建者, 2=内部管理员, 3=外部管理员, 4=普通成员, 5=未注册
  user_info: {
    userid: string;
    open_userid: string;
    name: string;
    avatar: string;
  };
  corp_info: {
    corpid: string;
  };
  agent?: Array<{
    agentid: number;
    auth_type: number;
  }>;
}

type OAuthScope = "snsapi_base" | "snsapi_userinfo" | "snsapi_privateinfo";

// ── Self-built App Auth Client ──

class WeComAuth {
  private corpid: string;
  private corpsecret: string;
  private token?: string;

  constructor(corpid: string, corpsecret: string) {
    this.corpid = corpid;
    this.corpsecret = corpsecret;
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;
    const url = `${BASE_URL}/cgi-bin/gettoken?corpid=${this.corpid}&corpsecret=${this.corpsecret}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`Token error: ${JSON.stringify(data)}`);
    this.token = data.access_token;
    return this.token;
  }

  /** F1: 构造 OAuth 网页授权链接 */
  buildOAuthUrl(redirectUri: string, scope: OAuthScope = "snsapi_base", agentid?: number, state?: string): string {
    const params = new URLSearchParams({
      appid: this.corpid,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
    });
    if (agentid !== undefined) params.set("agentid", String(agentid));
    if (state) params.set("state", state);
    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params}#wechat_redirect`;
  }

  /** F2: 构造扫码登录链接 */
  buildQRLoginUrl(agentid: number, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      appid: this.corpid,
      agentid: String(agentid),
      redirect_uri: redirectUri,
    });
    if (state) params.set("state", state);
    return `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?${params}`;
  }

  /** B1: 获取访问用户身份 */
  async getUserInfo(code: string): Promise<UserIdentity> {
    const token = await this.getToken();
    const url = `${BASE_URL}/cgi-bin/auth/getuserinfo?access_token=${token}&code=${code}`;
    const resp = await fetch(url);
    const data: UserIdentity = await resp.json();
    if (data.errcode !== 0) throw new Error(`getuserinfo error: ${JSON.stringify(data)}`);
    return data;
  }

  /** B2: 获取访问用户敏感信息 */
  async getUserDetail(userTicket: string): Promise<UserDetail> {
    const token = await this.getToken();
    const url = `${BASE_URL}/cgi-bin/auth/getuserdetail?access_token=${token}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ticket: userTicket }),
    });
    const data: UserDetail = await resp.json();
    if (data.errcode !== 0) throw new Error(`getuserdetail error: ${JSON.stringify(data)}`);
    return data;
  }
}

// ── SSO Auth Client (Provider) ──

class WeComSSOAuth {
  private corpid: string;
  private providerSecret: string;
  private providerToken?: string;

  constructor(corpid: string, providerSecret: string) {
    this.corpid = corpid;
    this.providerSecret = providerSecret;
  }

  /** B3: 获取服务商凭证 */
  private async getProviderToken(): Promise<string> {
    if (this.providerToken) return this.providerToken;
    const url = `${BASE_URL}/cgi-bin/service/get_provider_token`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corpid: this.corpid, provider_secret: this.providerSecret }),
    });
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`Provider token error: ${JSON.stringify(data)}`);
    this.providerToken = data.provider_access_token;
    return this.providerToken;
  }

  /** F3: 构造 SSO 扫码链接 */
  buildSSOQRUrl(redirectUri: string, state?: string, usertype = "member"): string {
    const params = new URLSearchParams({
      appid: this.corpid,
      redirect_uri: redirectUri,
    });
    if (state) params.set("state", state);
    if (usertype) params.set("usertype", usertype);
    return `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?${params}`;
  }

  /** B4: 获取登录用户信息 (SSO) */
  async getLoginInfo(authCode: string): Promise<SSOLoginInfo> {
    const token = await this.getProviderToken();
    const url = `${BASE_URL}/cgi-bin/service/get_login_info?access_token=${token}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: authCode }),
    });
    const data: SSOLoginInfo = await resp.json();
    if (data.errcode !== 0) throw new Error(`get_login_info error: ${JSON.stringify(data)}`);
    return data;
  }
}
```

### 6.3 Go

```go
package wecom

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const authBaseURL = "https://qyapi.weixin.qq.com"

// AuthClient 自建应用身份验证客户端
type AuthClient struct {
	CorpID     string
	CorpSecret string
	token      string
	client     *http.Client
}

// NewAuthClient 创建身份验证客户端
func NewAuthClient(corpID, corpSecret string) *AuthClient {
	return &AuthClient{
		CorpID:     corpID,
		CorpSecret: corpSecret,
		client:     &http.Client{},
	}
}

func (c *AuthClient) getToken() (string, error) {
	if c.token != "" {
		return c.token, nil
	}
	u := fmt.Sprintf("%s/cgi-bin/gettoken?corpid=%s&corpsecret=%s", authBaseURL, c.CorpID, c.CorpSecret)
	resp, err := c.client.Get(u)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		ErrCode     int    `json:"errcode"`
		ErrMsg      string `json:"errmsg"`
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.ErrCode != 0 {
		return "", fmt.Errorf("token error: %s", result.ErrMsg)
	}
	c.token = result.AccessToken
	return c.token, nil
}

// UserIdentity B1 返回结构
type UserIdentity struct {
	ErrCode        int    `json:"errcode"`
	ErrMsg         string `json:"errmsg"`
	UserID         string `json:"userid,omitempty"`
	OpenID         string `json:"openid,omitempty"`
	ExternalUserID string `json:"external_userid,omitempty"`
	UserTicket     string `json:"user_ticket,omitempty"`
	ExpiresIn      int    `json:"expires_in,omitempty"`
}

// UserDetail B2 返回结构
type UserDetail struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
	UserID  string `json:"userid"`
	Gender  string `json:"gender,omitempty"`
	Avatar  string `json:"avatar,omitempty"`
	QRCode  string `json:"qr_code,omitempty"`
	Mobile  string `json:"mobile,omitempty"`
	Email   string `json:"email,omitempty"`
	BizMail string `json:"biz_mail,omitempty"`
	Address string `json:"address,omitempty"`
}

// BuildOAuthURL F1: 构造 OAuth 网页授权链接
func (c *AuthClient) BuildOAuthURL(redirectURI, scope string, agentID int, state string) string {
	params := url.Values{
		"appid":         {c.CorpID},
		"redirect_uri":  {redirectURI},
		"response_type": {"code"},
		"scope":         {scope},
	}
	if agentID > 0 {
		params.Set("agentid", fmt.Sprintf("%d", agentID))
	}
	if state != "" {
		params.Set("state", state)
	}
	return fmt.Sprintf("https://open.weixin.qq.com/connect/oauth2/authorize?%s#wechat_redirect", params.Encode())
}

// BuildQRLoginURL F2: 构造扫码登录链接
func (c *AuthClient) BuildQRLoginURL(agentID int, redirectURI, state string) string {
	params := url.Values{
		"appid":        {c.CorpID},
		"agentid":      {fmt.Sprintf("%d", agentID)},
		"redirect_uri": {redirectURI},
	}
	if state != "" {
		params.Set("state", state)
	}
	return fmt.Sprintf("https://open.work.weixin.qq.com/wwopen/sso/qrConnect?%s", params.Encode())
}

// GetUserInfo B1: 获取访问用户身份
func (c *AuthClient) GetUserInfo(code string) (*UserIdentity, error) {
	token, err := c.getToken()
	if err != nil {
		return nil, err
	}
	u := fmt.Sprintf("%s/cgi-bin/auth/getuserinfo?access_token=%s&code=%s", authBaseURL, token, code)
	resp, err := c.client.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result UserIdentity
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, fmt.Errorf("getuserinfo error %d: %s", result.ErrCode, result.ErrMsg)
	}
	return &result, nil
}

// GetUserDetail B2: 获取访问用户敏感信息
func (c *AuthClient) GetUserDetail(userTicket string) (*UserDetail, error) {
	token, err := c.getToken()
	if err != nil {
		return nil, err
	}
	body := map[string]string{"user_ticket": userTicket}
	b, _ := json.Marshal(body)
	u := fmt.Sprintf("%s/cgi-bin/auth/getuserdetail?access_token=%s", authBaseURL, token)
	resp, err := c.client.Post(u, "application/json", bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result UserDetail
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, fmt.Errorf("getuserdetail error %d: %s", result.ErrCode, result.ErrMsg)
	}
	return &result, nil
}

// SSOClient SSO 单点登录客户端（服务商场景）
type SSOClient struct {
	CorpID         string
	ProviderSecret string
	providerToken  string
	client         *http.Client
}

// NewSSOClient 创建 SSO 客户端
func NewSSOClient(corpID, providerSecret string) *SSOClient {
	return &SSOClient{
		CorpID:         corpID,
		ProviderSecret: providerSecret,
		client:         &http.Client{},
	}
}

// SSOLoginInfo B4 返回结构
type SSOLoginInfo struct {
	ErrCode  int    `json:"errcode"`
	ErrMsg   string `json:"errmsg"`
	UserType int    `json:"usertype"`
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
	} `json:"agent,omitempty"`
}

func (c *SSOClient) getProviderToken() (string, error) {
	if c.providerToken != "" {
		return c.providerToken, nil
	}
	body := map[string]string{"corpid": c.CorpID, "provider_secret": c.ProviderSecret}
	b, _ := json.Marshal(body)
	u := fmt.Sprintf("%s/cgi-bin/service/get_provider_token", authBaseURL)
	resp, err := c.client.Post(u, "application/json", bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		ErrCode             int    `json:"errcode"`
		ErrMsg              string `json:"errmsg"`
		ProviderAccessToken string `json:"provider_access_token"`
		ExpiresIn           int    `json:"expires_in"`
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return "", err
	}
	if result.ErrCode != 0 {
		return "", fmt.Errorf("provider token error: %s", result.ErrMsg)
	}
	c.providerToken = result.ProviderAccessToken
	return c.providerToken, nil
}

// GetLoginInfo B4: 获取登录用户信息 (SSO)
func (c *SSOClient) GetLoginInfo(authCode string) (*SSOLoginInfo, error) {
	token, err := c.getProviderToken()
	if err != nil {
		return nil, err
	}
	body := map[string]string{"auth_code": authCode}
	b, _ := json.Marshal(body)
	u := fmt.Sprintf("%s/cgi-bin/service/get_login_info?access_token=%s", authBaseURL, token)
	resp, err := c.client.Post(u, "application/json", bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result SSOLoginInfo
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, fmt.Errorf("get_login_info error %d: %s", result.ErrCode, result.ErrMsg)
	}
	return &result, nil
}
```

---


### 6.4 Java 示例

```java
import java.net.URLEncoder;

public class WeComAuthService {
    private final WeComClient client;

    public WeComAuthService(WeComClient client) {
        this.client = client;
    }

    /** 构造 OAuth2 授权 URL */
    public String buildAuthUrl(String redirectUri, String state) throws Exception {
        String encoded = URLEncoder.encode(redirectUri, "UTF-8");
        return "https://open.weixin.qq.com/connect/oauth2/authorize?"
            + "appid=" + client.getCorpId()
            + "&redirect_uri=" + encoded
            + "&response_type=code&scope=snsapi_privateinfo"
            + "&state=" + state + "#wechat_redirect";
    }

    /** 根据 code 获取用户信息 */
    public JsonObject getUserInfo(String code) throws Exception {
        // ⚠️ code 只能使用一次，5分钟内有效
        JsonObject body = new JsonObject();
        body.addProperty("code", code);
        return client.post("/auth/getuserinfo", body);
    }

    /** 获取用户敏感信息（需二次验证） */
    public JsonObject getUserDetail(String userTicket) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("user_ticket", userTicket);
        return client.post("/auth/getuserdetail", body);
    }
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

### 6.5 PHP 示例

```php
<?php
class WeComAuthService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 构造 OAuth2 授权 URL */
    public function buildAuthUrl(string $redirectUri, string $state = 'STATE'): string
    {
        $encoded = urlencode($redirectUri);
        return "https://open.weixin.qq.com/connect/oauth2/authorize?"
            . "appid={$this->client->getCorpId()}"
            . "&redirect_uri={$encoded}"
            . "&response_type=code&scope=snsapi_privateinfo"
            . "&state={$state}#wechat_redirect";
    }

    /** 根据 code 获取用户信息 — ⚠️ code 只能用一次，5分钟有效 */
    public function getUserInfo(string $code): array
    {
        return $this->client->get('/cgi-bin/auth/getuserinfo', ['code' => $code]);
    }

    /** 获取用户敏感信息（需 user_ticket） */
    public function getUserDetail(string $userTicket): array
    {
        return $this->client->post('/cgi-bin/auth/getuserdetail', [
            'user_ticket' => $userTicket,
        ]);
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 7. Test Templates

### 7.1 Python (pytest)

```python
"""Tests for WeComAuth and WeComSSOAuth clients"""
import pytest
from unittest.mock import patch, MagicMock
# from your_module import WeComAuth, WeComSSOAuth


@pytest.fixture
def auth_client():
    client = WeComAuth("corp_id", "corp_secret")
    client._token = "test_token"
    return client


@pytest.fixture
def sso_client():
    client = WeComSSOAuth("corp_id", "provider_secret")
    client._provider_token = "test_provider_token"
    return client


class TestOAuthURL:
    """F1: OAuth 链接构造"""

    def test_build_oauth_url_snsapi_base(self, auth_client):
        url = auth_client.build_oauth_url(
            redirect_uri="https://example.com/callback",
            scope="snsapi_base",
        )
        assert "open.weixin.qq.com/connect/oauth2/authorize" in url
        assert "appid=corp_id" in url
        assert "scope=snsapi_base" in url
        assert url.endswith("#wechat_redirect")

    def test_build_oauth_url_with_agentid(self, auth_client):
        url = auth_client.build_oauth_url(
            redirect_uri="https://example.com/callback",
            scope="snsapi_userinfo",
            agentid=1000005,
        )
        assert "agentid=1000005" in url
        assert "scope=snsapi_userinfo" in url

    def test_build_oauth_url_redirect_uri_encoded(self, auth_client):
        url = auth_client.build_oauth_url(
            redirect_uri="https://example.com/callback?a=1&b=2",
        )
        # redirect_uri should be URL-encoded
        assert "redirect_uri=https%3A%2F%2Fexample.com" in url

    def test_build_oauth_url_state_max_128_bytes(self):
        """state 参数 ≤ 128 字节"""
        state = "a" * 128
        assert len(state.encode()) <= 128
        state_too_long = "a" * 129
        assert len(state_too_long.encode()) > 128


class TestQRLoginURL:
    """F2: 扫码登录链接构造"""

    def test_build_qr_login_url(self, auth_client):
        url = auth_client.build_qr_login_url(
            agentid=1000005,
            redirect_uri="https://example.com/qr-callback",
        )
        assert "open.work.weixin.qq.com/wwopen/sso/qrConnect" in url
        assert "agentid=1000005" in url

    def test_qr_login_url_requires_agentid(self, auth_client):
        """扫码登录必须提供 agentid"""
        url = auth_client.build_qr_login_url(
            agentid=1000005,
            redirect_uri="https://example.com/callback",
        )
        assert "agentid=" in url


class TestGetUserInfo:
    """B1: 获取访问用户身份"""

    def test_get_user_info_member(self, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "errcode": 0, "errmsg": "ok", "userid": "zhangsan"
        }
        with patch.object(auth_client._client, "get", return_value=mock_resp):
            result = auth_client.get_user_info("valid_code")
            assert result["userid"] == "zhangsan"
            assert "openid" not in result

    def test_get_user_info_non_member(self, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "errcode": 0, "errmsg": "ok",
            "openid": "oAAA", "external_userid": "eAAA",
        }
        with patch.object(auth_client._client, "get", return_value=mock_resp):
            result = auth_client.get_user_info("valid_code")
            assert "userid" not in result
            assert result["openid"] == "oAAA"

    def test_get_user_info_invalid_code(self, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"errcode": 40029, "errmsg": "invalid code"}
        with patch.object(auth_client._client, "get", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="40029"):
                auth_client.get_user_info("expired_code")

    def test_get_user_info_domain_mismatch(self, auth_client):
        """可信域名不匹配应返回 50001"""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"errcode": 50001, "errmsg": "redirect_uri not match"}
        with patch.object(auth_client._client, "get", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="50001"):
                auth_client.get_user_info("code_with_wrong_domain")


class TestGetUserDetail:
    """B2: 获取访问用户敏感信息"""

    def test_get_user_detail(self, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "errcode": 0, "errmsg": "ok",
            "userid": "lisi", "mobile": "13800000000",
            "email": "lisi@example.com", "gender": "1",
        }
        with patch.object(auth_client._client, "post", return_value=mock_resp):
            result = auth_client.get_user_detail("valid_ticket")
            assert result["mobile"] == "13800000000"
            assert result["gender"] == "1"


class TestSSO:
    """SSO 单点登录"""

    def test_build_sso_qr_url(self, sso_client):
        url = sso_client.build_sso_qr_url(
            redirect_uri="https://example.com/sso-callback",
            usertype="admin",
        )
        assert "wwopen/sso/3rd_qrConnect" in url
        assert "usertype=admin" in url

    def test_get_login_info_member(self, sso_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "errcode": 0, "errmsg": "ok",
            "usertype": 4,
            "user_info": {
                "userid": "zhangsan", "open_userid": "xxx",
                "name": "张三", "avatar": "http://example.com/avatar.png",
            },
            "corp_info": {"corpid": "wx123"},
        }
        with patch.object(sso_client._client, "post", return_value=mock_resp):
            result = sso_client.get_login_info("valid_auth_code")
            assert result["usertype"] == 4
            assert result["user_info"]["userid"] == "zhangsan"

    def test_get_login_info_invalid_auth_code(self, sso_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"errcode": 40029, "errmsg": "invalid auth_code"}
        with patch.object(sso_client._client, "post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="40029"):
                sso_client.get_login_info("expired_auth_code")
```

---

## 8. Code Review Checklist

| # | 检查项 | 严重度 |
|---|--------|--------|
| R1 | OAuth 链接的 `redirect_uri` 是否经过 urlencode | CRITICAL |
| R2 | `redirect_uri` 的域名是否与应用可信域名**完全匹配** | CRITICAL |
| R3 | code 是否仅消费一次（不可重复使用） | CRITICAL |
| R4 | code 是否在 5 分钟内使用 | HIGH |
| R5 | `scope=snsapi_userinfo/snsapi_privateinfo` 时是否传了 `agentid` | HIGH |
| R6 | 是否正确区分 `access_token` 与 `provider_access_token` | CRITICAL |
| R7 | SSO 场景是否使用 `auth_code`（非 `code`） | HIGH |
| R8 | `user_ticket` 是否仅在 `scope=snsapi_privateinfo` 时获取 | HIGH |
| R9 | 自建应用是否误用了第三方接口（`getuserinfo3rd` / `getuserdetail3rd`） | HIGH |
| R10 | 是否实现了 CSRF 防护（state 参数校验） | HIGH |
| R11 | `access_token` 是否缓存且有过期重试（42001） | HIGH |
| R12 | `provider_access_token` 是否缓存（有效期 7200 秒） | MEDIUM |
| R13 | 前端 JS SDK 引用是否使用 HTTPS | MEDIUM |
| R14 | 是否处理了非企业成员（返回 openid 而非 userid）的场景 | MEDIUM |
| R15 | SSO 返回的 `usertype` 是否正确映射（1~5） | MEDIUM |
| R16 | 旧版接口 `/user/getuserinfo` 是否已迁移到新版 `/auth/getuserinfo` | LOW |

---

## 9. Gotcha Guide

### G1. redirect_uri 必须完全匹配可信域名

OAuth 和扫码登录的 `redirect_uri` 的域名必须与应用配置的可信域名**完全匹配**（包括子域名），否则返回 50001 或页面提示 "redirect_uri 参数错误"。常见错误：
- 配置了 `example.com`，但用了 `www.example.com`
- 配置了 `app.example.com`，但用了 `app.example.com:8080`（端口不同）

### G2. code 一次性 + 5 分钟有效

code 只能消费一次，5 分钟内有效。如果前端将 code 发到后端后因网络问题重试，第二次调用会返回 `40029`。建议后端做幂等处理：收到 code 后立即换取 userid 并缓存结果。

### G3. SSO 的 auth_code 与 OAuth 的 code 是不同参数

- OAuth/扫码登录回调参数名是 `code`，用 B1 接口（`getuserinfo`）换取身份
- SSO 回调参数名是 `auth_code`，用 B4 接口（`get_login_info`）换取身份

混淆会导致 `40029` 错误。

### G4. scope=snsapi_privateinfo 需要两步

获取手机号、邮箱等敏感信息不是一步完成的：
1. 先用 B1（`getuserinfo`）获取 `user_ticket`
2. 再用 B2（`getuserdetail`）传入 `user_ticket` 获取敏感字段

直接在 B1 的返回中是拿不到手机号的。且 `user_ticket` 有时效性。

### G5. 三种凭证不可混用

| 场景 | 正确凭证 | 常见错误 |
|------|----------|----------|
| 自建应用 OAuth | `access_token` (corpid + corpsecret) | 用了通讯录 token |
| 第三方应用 OAuth | `suite_access_token` | 用了自建应用 token |
| SSO 单点登录 | `provider_access_token` (corpid + provider_secret) | 用了普通 access_token |

用错凭证会返回 `40014`（无效 token）或 `301002`（无权限）。

### G6. 扫码登录仅限企业自建应用

文档明确指出：扫码授权登录（F2 路径 `/wwopen/sso/qrConnect`）**仅企业内自建应用可用**，第三方服务商不支持。第三方需使用 SSO 路径（F3 路径 `/wwopen/sso/3rd_qrConnect`）。

### G7. 非企业成员返回 openid 而非 userid

当访问用户不是企业成员时，B1 接口不会返回 `userid`，而是返回 `openid`（和可能的 `external_userid`）。代码中必须处理这两种情况，不能直接取 `userid` 而不判空。

### G8. 旧版接口路径仍可用但不推荐

- 旧版：`/cgi-bin/user/getuserinfo` → 新版：`/cgi-bin/auth/getuserinfo`
- 功能相同，但新版路径是推荐的标准路径

如果代码中还在用旧版路径，不会报错但建议迁移。

### G9. state 参数防 CSRF

`state` 参数是防止 CSRF 攻击的重要手段。建议：
- 生成随机字符串存入 session
- 回调时校验 state 与 session 中的值是否一致
- 仅支持 a-zA-Z0-9，≤128 字节

不设置 state 不会报错，但会有安全风险。

### G10. 新版 JS SDK (ww.createWWLoginPanel)

新版 JS SDK 使用 `ww.createWWLoginPanel` 替代旧版 `new WwLogin`。新版支持 `login_type` 参数区分自建应用（`CorpApp`）和第三方应用（`ServiceApp`），且支持 `onLoginSuccess` / `onLoginFail` 回调，无需依赖页面跳转。

---

## 10. References

| doc_id | 标题 | 说明 |
|--------|------|------|
| 91019 | 网页授权登录概述 | OAuth2 授权流程说明 |
| 91022 | 构造网页授权链接 | OAuth URL 构造参数 |
| 91023 | 获取访问用户身份 | code → userid/openid |
| 91024 | 获取访问用户敏感信息 | user_ticket → 手机/邮箱 |
| 91025 | 扫码授权登录概述 | PC 端扫码登录说明 |
| 91039 | 构造扫码登录链接 | 跳转方式 + JS SDK 内嵌方式 |
| 91127 | SSO 单点登录概述 | 服务商 SSO 流程 |
| 91154 | 获取登录用户信息 | auth_code → 用户信息(SSO) |
| 91437 | 获取用户登录身份 | B1 的新版文档编号 |

**新版文档参考**（doc_id > 96000）：
- 96442: 获取访问用户身份（新版）
- 96443: 获取访问用户敏感信息（新版）
- 98176: 获取用户登录身份（新版）
- 98268: 新版扫码登录 JS SDK

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

**依赖 SKILL**：`wecom-core`（Token 管理、错误处理、请求基础设施）


