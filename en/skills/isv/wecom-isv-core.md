---
name: wecom-isv-core
description: |
  企业微信服务商代开发基座 SKILL。提供代开发三级凭证体系、与自建应用接口差异、权限模型、回调配置差异、账号ID安全升级、代码生成规范。
  TRIGGER: 当用户提到代开发、服务商开发、ISV、suite_access_token、permanent_code、代开发模版 相关开发时触发。
  本 SKILL 是所有 wecom-isv-* SKILL 的前置依赖。
version: 1.0.0
domain: isv-base
depends_on: wecom-core
doc_ids: [97159, 97165, 97112, 97163, 97164, 90600, 90605, 98980, 96518]
triggers:
  - wecom isv
  - wecom 代开发
  - wecom 服务商
  - 代开发模版
  - suite_access_token
  - permanent_code
  - 服务商代开发
  - 代开发自建应用
  - ISV development
  - 应用代开发
---

# WeCom ISV Core Foundation (wecom-isv-core)

你现在是企业微信**服务商代开发**领域的专家。基于本 SKILL 的知识，帮助开发者快速、正确地完成代开发应用的开发与对接。

> **定位**：本 SKILL 聚焦代开发模式与自建应用的**差异部分**。通用规范（请求格式、错误处理、加解密、代码生成）继承自 `wecom-core`。

---

## 1. Prerequisites

使用本 SKILL 前，确保已掌握 `wecom-core` 中的：
- 通用请求规范（HTTPS / JSON / access_token query 参数）
- 回调配置与加解密（AES-256-CBC / 签名校验）
- 错误处理（errcode / errmsg / 自动重试）
- 代码生成强制规则（Token 缓存 / 类型安全 / 超时设置）

**额外要求**：
- 拥有**企业微信服务商账号**（注册地址：https://open.work.weixin.qq.com）
- 已在服务商管理后台创建**代开发应用模版**
- 已配置**代开发模版回调 URL**（用于接收 suite_ticket 和授权事件）
- 已配置服务商 **IP 白名单**（服务商管理后台 → 服务商信息 → 基本信息 → IP白名单）

---

## 2. Core Concepts

### 2.1 代开发 vs 自建应用 vs 第三方应用

```
企业微信应用开发模式
├── 企业内部开发（自建应用）
│   ├── 企业自己开发
│   ├── corpid + corpsecret → access_token
│   └── 应用仅限本企业使用
├── 服务商代开发（本 SKILL）
│   ├── 服务商替企业开发自建应用
│   ├── suite_id + suite_secret + suite_ticket → suite_access_token
│   ├── suite_access_token + auth_corpid + permanent_code → corp access_token
│   └── 一套代码服务多个企业（一对多）
└── 第三方应用
    ├── 服务商开发应用上架到应用市场
    ├── 凭证体系与代开发相同
    └── 应用分发方式不同（市场安装 vs 扫码授权）
```

**核心区别**：
| 维度 | 自建应用 | 代开发应用 | 第三方应用 |
|------|---------|-----------|-----------|
| 开发主体 | 企业自己 | 服务商 | 服务商 |
| 凭证获取 | corpid + secret | suite_access_token + permanent_code | 同代开发 |
| 应用归属 | 企业自建 | 企业自建（服务商代为开发） | 服务商所有 |
| 分发方式 | 无需分发 | 扫码授权 | 应用市场 |
| 数据归属 | 企业 | 企业 | 服务商托管 |
| 身份验证 | OAuth2 自建接口 | OAuth2 自建接口（不可用第三方接口） | 第三方 OAuth2 |

### 2.2 三级凭证体系

```
                    ┌─────────────────────┐
                    │   suite_ticket      │
                    │ (企业微信定时推送,    │
                    │  每10分钟, 有效30分钟) │
                    └────────┬────────────┘
                             │
              suite_id + suite_secret + suite_ticket
                             │
                             ▼
                    ┌─────────────────────┐
                    │ suite_access_token  │  ← 第一级：代开发模版凭证
                    │ (有效期 7200s)       │
                    └────────┬────────────┘
                             │
              auth_corpid + permanent_code (企业授权后获得)
                             │
                             ▼
                    ┌─────────────────────┐
                    │  corp access_token  │  ← 第二级：企业应用凭证
                    │ (有效期 7200s)       │     等效于自建应用的 access_token
                    └────────┬────────────┘
                             │
                   调用通讯录/消息/客户联系等业务 API
                             │
                             ▼
                    ┌─────────────────────┐
                    │   业务 API 响应      │  ← 第三级：实际业务调用
                    └─────────────────────┘
```

### 2.3 核心术语（代开发专属）

| 术语 | 说明 | 获取方式 |
|------|------|----------|
| suite_id | 代开发应用模版 ID（等同于第三方应用的 suite_id） | 服务商管理后台 → 应用代开发 → 模版详情 |
| suite_secret | 代开发应用模版密钥 | 同上 |
| suite_ticket | 企业微信定时推送的票据，每 10 分钟推送一次，有效期 30 分钟 | 代开发模版回调 URL 接收 |
| suite_access_token | 代开发模版凭证，用于获取企业授权信息 | `POST /service/get_suite_token` |
| permanent_code | 企业永久授权码，代开发场景下即为企业应用的 secret | 企业扫码授权后回调获取 |
| auth_corpid | 授权企业的 corpid | 授权回调中获取 |
| corp access_token | 企业级调用凭证，等效于自建应用的 access_token | `POST /service/get_corp_token` |
| pre_auth_code | 预授权码，用于生成授权链接 | `GET /service/get_pre_auth_code` |

### 2.4 账号 ID 安全升级（重要）

自 2022 年 6 月 28 日起，所有代开发应用返回的 ID 均为**服务商主体加密**后的值：

| ID 类型 | 说明 |
|---------|------|
| corpid | 返回服务商主体加密的 corpid（非企业原始 corpid） |
| userid | 返回服务商主体加密的 userid |
| external_userid | 返回服务商主体加密的 external_userid |

**影响**：
- 代开发应用获取的 userid/external_userid 与企业自建应用获取的**不同**
- 如需对接企业自建应用，需使用 **ID 转换接口**（`/service/batch/userid_to_openuserid` 等）
- 无法直接通过后台接口获取手机号等敏感信息，需通过 OAuth2 让成员主动授权

---

## 3. 与自建应用接口的差异

### 3.1 凭证获取差异

| 操作 | 自建应用 | 代开发应用 |
|------|---------|-----------|
| 获取 access_token | `GET /gettoken?corpid=&corpsecret=` | `POST /service/get_corp_token?suite_access_token=` |
| Token 前置依赖 | 无 | 需先获取 suite_access_token |
| Secret 来源 | 管理后台直接查看 | 授权回调获取 permanent_code |

### 3.2 接口权限差异

代开发应用权限分为**两类**：

| 权限类型 | 说明 | 获取方式 |
|---------|------|----------|
| 基础权限 | 企业扫码授权后自动获得，不可修改 | 授权即得 |
| 自定义权限 | 需服务商申请 + 企业管理员确认 | 服务商申请 → 企业确认 |

**基础权限包含**：
- 获取部门列表（有限范围）
- 获取成员基础信息（姓名、部门，不含手机号/邮箱）
- 发送应用消息
- 获取应用配置信息

**自定义权限获取流程**：
```
服务商在模版详情页编辑权限
    → 保存后企业管理员收到权限变更推送
    → 企业管理员在后台确认
    → 权限立即生效
    → 若企业暂不授权，保持原权限
```

### 3.3 不可调用的接口

以下接口**代开发应用不可调用**：
- `POST /agent/set` — 设置应用（代开发应用由服务商在模版中配置）
- 第三方应用的 OAuth2 身份验证接口（代开发使用自建应用的 OAuth2 接口）

### 3.4 回调差异

| 回调类型 | 自建应用 | 代开发应用 |
|---------|---------|-----------|
| 回调 URL 配置 | 管理后台 → 应用 → 接收消息 | 服务商管理后台 → 代开发模版 → 回调配置 |
| suite_ticket 推送 | 无 | 每 10 分钟推送至模版回调 URL |
| 授权事件 | 无 | create_auth / change_auth / cancel_auth |
| 通讯录变更 | 推送到应用回调 URL | 推送到**代开发应用回调 URL** |
| 应用可见范围变更 | 无回调 | 推送 change_auth 到**模版回调 URL** |

**关键点**：代开发有**两个回调 URL**：
1. **模版回调 URL**：接收 suite_ticket、授权事件（create_auth / change_auth / cancel_auth）
2. **应用回调 URL**：接收业务事件（通讯录变更、消息、客户联系等）

### 3.5 IP 白名单差异

| 维度 | 自建应用 | 代开发应用 |
|------|---------|-----------|
| 配置位置 | 企业管理后台 → 应用 → 企业可信 IP | 服务商管理后台 → 服务商信息 → IP 白名单 |
| 生效范围 | 单个应用 | 服务商所有代开发应用 |

### 3.6 敏感信息获取差异

| 信息 | 自建应用 | 代开发应用 |
|------|---------|-----------|
| 手机号 | 接口直接获取（需权限） | OAuth2 用户主动授权 |
| 邮箱 | 接口直接获取（需权限） | OAuth2 用户主动授权 |
| 成员详情 | `snsapi_privateinfo` scope | 同左，但需额外用户授权 |

---

## 4. API Quick Reference

### 4.1 凭证相关 API

| API | 方法 | 路径 | 凭证 | 说明 |
|-----|------|------|------|------|
| 获取 suite_access_token | POST | `/service/get_suite_token` | 无 | suite_id + suite_secret + suite_ticket |
| 获取预授权码 | GET | `/service/get_pre_auth_code` | suite_access_token | 生成授权链接用 |
| 设置授权配置 | POST | `/service/set_session_info` | suite_access_token | 授权前设置权限范围 |
| 获取企业永久授权码 | POST | `/service/v2/get_permanent_code` | suite_access_token | 临时授权码换永久码 |
| 获取企业授权信息 | POST | `/service/get_auth_info` | suite_access_token | 查询企业授权详情 |
| 获取企业凭证 | POST | `/service/get_corp_token` | suite_access_token | 获取 corp access_token |
| 获取带参授权链接 | POST | `/service/get_customized_auth_url` | provider_access_token | 自定义授权页面 |
| 获取应用权限详情 | POST | `/service/get_app_permissions` | suite_access_token | 查询当前权限 |

### 4.2 ID 转换 API

| API | 方法 | 路径 | 凭证 | 说明 |
|-----|------|------|------|------|
| userid 转 open_userid | POST | `/batch/userid_to_openuserid` | access_token | 企业 userid → 服务商加密 userid |
| open_userid 转 userid | POST | `/batch/openuserid_to_userid` | access_token | 服务商加密 userid → 企业 userid |
| external_userid 转换 | POST | `/externalcontact/unionid_to_external_userid` | access_token | unionid → external_userid |

---

## 5. API Details

### 5.1 获取 suite_access_token

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token`
- **说明**: 代开发模版的第一级凭证，用于后续所有授权相关操作

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| suite_id | 是 | string | 代开发应用模版 ID |
| suite_secret | 是 | string | 代开发应用模版密钥 |
| suite_ticket | 是 | string | 企业微信后台推送的 ticket |

**响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "suite_access_token": "61W3mEpU66027wgNZ_MhGHNQDHnFATkDa9...",
  "expires_in": 7200
}
```

**关键规则**:
1. **必须缓存**，有效期 7200 秒，禁止频繁调用
2. suite_ticket 由企业微信每 10 分钟推送一次，有效期 30 分钟
3. 即使 suite_secret 泄露，没有 suite_ticket 也无法获取 suite_access_token（安全加固）
4. 如 suite_ticket 丢失，可在服务商管理后台手动触发推送

### 5.2 获取企业凭证 (corp access_token)

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token=SUITE_ACCESS_TOKEN`
- **说明**: 获取企业级 access_token，等效于自建应用的 access_token

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| auth_corpid | 是 | string | 授权企业的 corpid |
| permanent_code | 是 | string | 企业永久授权码（代开发场景即为企业应用 secret） |

**响应**:
```json
{
  "access_token": "xxxxxx",
  "expires_in": 7200
}
```

**关键规则**:
1. 此接口**调用失败时才返回 errcode**，没返回 errcode 视为成功（历史原因）
2. 获取的 access_token 与企业通过 `gettoken` 获取的**本质相同**
3. 必须缓存，按 `auth_corpid` 维度区分缓存
4. 多企业场景需维护 `Map<corpid, token>` 结构

### 5.3 获取企业永久授权码

- **接口**: `POST https://qyapi.weixin.qq.com/cgi-bin/service/v2/get_permanent_code?suite_access_token=SUITE_ACCESS_TOKEN`
- **说明**: 用临时授权码换取企业永久授权码和企业信息

**请求参数** (JSON Body):

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| auth_code | 是 | string | 授权成功回调中的临时授权码，一次有效 |

**响应** (关键字段):
```json
{
  "access_token": "xxxxxx",
  "expires_in": 7200,
  "permanent_code": "xxxx",
  "auth_corp_info": {
    "corpid": "xxxx",
    "corp_name": "name",
    "corp_type": "verified",
    "corp_round_logo_url": "https://...",
    "corp_square_logo_url": "https://...",
    "corp_user_max": 50,
    "corp_full_name": "full name",
    "corp_scale": "1-50",
    "corp_industry": "IT",
    "corp_sub_industry": "software"
  },
  "auth_info": {
    "agent": [{
      "agentid": 1,
      "name": "App Name",
      "square_logo_url": "https://...",
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
    "userid": "auth_userid",
    "open_userid": "open_userid",
    "name": "管理员名称",
    "avatar": "https://..."
  }
}
```

**关键规则**:
1. `auth_code` 一次有效，换取后立即失效
2. `permanent_code` 需持久化存储（数据库），与 auth_corpid 对应
3. 返回的 `access_token` 可直接使用，无需再调 get_corp_token
4. 此接口使用 v2 版本路径（`/service/v2/get_permanent_code`）

---

## 6. Callbacks

### 6.1 代开发回调概述

代开发有两条回调通道：

| 回调通道 | 配置位置 | 接收内容 |
|---------|---------|---------|
| 模版回调 URL | 服务商后台 → 代开发模版 → 回调配置 | suite_ticket / 授权事件 / 权限变更 |
| 应用回调 URL | 服务商后台 → 代开发模版 → 应用回调配置 | 业务事件（通讯录 / 消息 / 客户联系等） |

### 6.2 suite_ticket 推送

企业微信每 10 分钟推送一次，解密后 XML 格式：

```xml
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[suite_ticket]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <SuiteTicket><![CDATA[asdfxxxxxx]]></SuiteTicket>
</xml>
```

**处理要求**：
- 收到后**立即响应** `"success"`（5 秒内）
- 用最新的 suite_ticket 覆盖存储（不要丢弃）
- suite_ticket 有效期 30 分钟，可容错连续 2 次推送失败

### 6.3 授权通知事件

```xml
<!-- 授权成功 -->
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[create_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCode><![CDATA[temporary_auth_code]]></AuthCode>
</xml>

<!-- 变更授权 -->
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[change_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>

<!-- 取消授权 -->
<xml>
  <SuiteId><![CDATA[suite_id]]></SuiteId>
  <InfoType><![CDATA[cancel_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>
```

**处理流程**：
- `create_auth`：用 AuthCode 调用 `get_permanent_code` 获取永久授权码并持久化
- `change_auth`：调用 `get_auth_info` 更新企业授权信息（权限/可见范围可能变化）
- `cancel_auth`：清理该企业的授权数据、停止服务

---

## 7. Workflows

### 7.1 完整授权接入流程

```
Step 1: 配置回调
    服务商管理后台配置代开发模版回调 URL
    → 开始接收 suite_ticket

Step 2: 获取 suite_access_token
    suite_id + suite_secret + suite_ticket
    → POST /service/get_suite_token
    → 缓存 suite_access_token

Step 3: 生成授权链接
    GET /service/get_pre_auth_code
    → 拼接授权 URL
    → https://open.work.weixin.qq.com/3rdapp/install?suite_id=SUITE_ID&pre_auth_code=PRE_AUTH_CODE&redirect_uri=REDIRECT_URI&state=STATE

Step 4: 企业管理员扫码授权
    → 授权成功回调 create_auth (推送到模版回调 URL)
    → 同时重定向到 redirect_uri?auth_code=xxx&state=xxx

Step 5: 获取永久授权码
    POST /service/v2/get_permanent_code (auth_code)
    → 持久化 permanent_code + auth_corpid
    → 返回值中包含 access_token 可直接使用

Step 6: 调用业务 API
    POST /service/get_corp_token (auth_corpid + permanent_code)
    → 获取 corp access_token
    → 使用 corp access_token 调用通讯录/消息/客户联系等 API
```

### 7.2 Token 刷新流程

```
业务 API 返回 42001 (token 过期)
    │
    ├── corp access_token 过期
    │   → POST /service/get_corp_token 重新获取
    │
    └── suite_access_token 过期
        → 检查是否有最新 suite_ticket
        → POST /service/get_suite_token 重新获取
        → 再获取 corp access_token
```

### 7.3 多企业管理架构

```
服务商服务端
├── SuiteTokenManager
│   ├── suite_access_token (单例, 全局唯一)
│   └── suite_ticket (持续更新)
├── CorpTokenManager
│   ├── Map<auth_corpid, CorpToken>
│   │   ├── corp_a → { access_token, expires_at, permanent_code }
│   │   ├── corp_b → { access_token, expires_at, permanent_code }
│   │   └── corp_c → { access_token, expires_at, permanent_code }
│   └── 按 corpid 维度独立缓存和刷新
└── CallbackRouter
    ├── 模版回调 → suite_ticket / 授权事件
    └── 应用回调 → 业务事件 (按 corpid 路由)
```

---

## 8. Code Templates

### 8.1 ISV Client (Python)

```python
"""企业微信服务商代开发客户端 — 管理多企业 Token"""
import os, time, logging, threading
import requests

logger = logging.getLogger(__name__)


class WeComISVClient:
    """服务商代开发客户端，管理 suite_access_token 和多企业 corp access_token"""

    BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin"

    def __init__(
        self,
        suite_id: str = None,
        suite_secret: str = None,
    ):
        self.suite_id = suite_id or os.environ["WECOM_SUITE_ID"]
        self.suite_secret = suite_secret or os.environ["WECOM_SUITE_SECRET"]
        self._suite_ticket: str | None = None
        self._suite_token: str | None = None
        self._suite_token_expires_at: float = 0
        self._corp_tokens: dict[str, dict] = {}  # {corpid: {token, expires_at, permanent_code}}
        self._lock = threading.Lock()

    # ─── suite_ticket 管理 ───

    def update_suite_ticket(self, ticket: str):
        """回调收到 suite_ticket 时调用，覆盖存储"""
        self._suite_ticket = ticket
        logger.info("suite_ticket updated")

    # ─── suite_access_token 管理 ───

    @property
    def suite_access_token(self) -> str:
        if time.time() >= self._suite_token_expires_at:
            with self._lock:
                if time.time() >= self._suite_token_expires_at:
                    self._refresh_suite_token()
        return self._suite_token

    def _refresh_suite_token(self):
        if not self._suite_ticket:
            raise RuntimeError("suite_ticket 未设置，请确认回调服务已接收到 suite_ticket 推送")
        resp = requests.post(
            f"{self.BASE_URL}/service/get_suite_token",
            json={
                "suite_id": self.suite_id,
                "suite_secret": self.suite_secret,
                "suite_ticket": self._suite_ticket,
            },
            timeout=10,
        ).json()
        if resp.get("errcode", 0) != 0:
            raise WeComISVError(resp["errcode"], resp["errmsg"])
        self._suite_token = resp["suite_access_token"]
        self._suite_token_expires_at = time.time() + resp["expires_in"] - 300

    # ─── 企业授权管理 ───

    def register_corp(self, auth_corpid: str, permanent_code: str):
        """注册企业授权信息（授权回调后调用）"""
        self._corp_tokens[auth_corpid] = {
            "permanent_code": permanent_code,
            "token": None,
            "expires_at": 0,
        }

    def get_permanent_code(self, auth_code: str) -> dict:
        """用临时授权码换取永久授权码"""
        resp = requests.post(
            f"{self.BASE_URL}/service/v2/get_permanent_code",
            params={"suite_access_token": self.suite_access_token},
            json={"auth_code": auth_code},
            timeout=10,
        ).json()
        if resp.get("errcode", 0) != 0:
            raise WeComISVError(resp.get("errcode", -1), resp.get("errmsg", "unknown"))
        # 自动注册
        corpid = resp["auth_corp_info"]["corpid"]
        self.register_corp(corpid, resp["permanent_code"])
        return resp

    # ─── corp access_token 管理 ───

    def get_corp_token(self, auth_corpid: str) -> str:
        """获取指定企业的 access_token"""
        corp = self._corp_tokens.get(auth_corpid)
        if not corp:
            raise RuntimeError(f"企业 {auth_corpid} 未注册，请先调用 register_corp")
        if time.time() >= corp["expires_at"]:
            with self._lock:
                if time.time() >= corp["expires_at"]:
                    self._refresh_corp_token(auth_corpid)
        return self._corp_tokens[auth_corpid]["token"]

    def _refresh_corp_token(self, auth_corpid: str):
        corp = self._corp_tokens[auth_corpid]
        resp = requests.post(
            f"{self.BASE_URL}/service/get_corp_token",
            params={"suite_access_token": self.suite_access_token},
            json={
                "auth_corpid": auth_corpid,
                "permanent_code": corp["permanent_code"],
            },
            timeout=10,
        ).json()
        # 注意：此接口调用失败时才返回 errcode
        if resp.get("errcode", 0) != 0:
            raise WeComISVError(resp["errcode"], resp["errmsg"])
        corp["token"] = resp["access_token"]
        corp["expires_at"] = time.time() + resp["expires_in"] - 300

    # ─── 业务 API 调用 ───

    def request(self, auth_corpid: str, method: str, path: str, retries: int = 3, **kwargs) -> dict:
        """以指定企业身份调用业务 API"""
        url = f"{self.BASE_URL}{path}"
        for attempt in range(retries):
            token = self.get_corp_token(auth_corpid)
            params = kwargs.pop("params", {})
            params["access_token"] = token
            start = time.time()
            resp = requests.request(method, url, params=params, timeout=10, **kwargs).json()
            elapsed = round(time.time() - start, 2)
            logger.debug(f"ISV API {method} {path} corp={auth_corpid} -> errcode={resp.get('errcode', 0)} ({elapsed}s)")

            errcode = resp.get("errcode", 0)
            if errcode == 0:
                return resp
            if errcode in (42001, 40014):
                self._refresh_corp_token(auth_corpid)
                continue
            if errcode == -1 and attempt < retries - 1:
                time.sleep(1 * (attempt + 1))
                continue
            raise WeComISVError(errcode, resp.get("errmsg", ""))
        raise WeComISVError(-1, "重试次数已用尽")

    def get(self, auth_corpid: str, path: str, **kwargs) -> dict:
        return self.request(auth_corpid, "GET", path, **kwargs)

    def post(self, auth_corpid: str, path: str, **kwargs) -> dict:
        return self.request(auth_corpid, "POST", path, **kwargs)


class WeComISVError(Exception):
    def __init__(self, errcode: int, errmsg: str):
        self.errcode = errcode
        self.errmsg = errmsg
        super().__init__(f"WeCom ISV Error [{errcode}]: {errmsg}")
```

### 8.2 ISV Client (TypeScript)

```typescript
/** 企业微信服务商代开发客户端 — 管理多企业 Token */
import axios, { AxiosInstance } from 'axios';

interface CorpTokenInfo {
  permanentCode: string;
  token: string | null;
  expiresAt: number;
}

export class WeComISVError extends Error {
  constructor(public errcode: number, public errmsg: string) {
    super(`WeCom ISV Error [${errcode}]: ${errmsg}`);
  }
}

export class WeComISVClient {
  private static readonly BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';
  private suiteTicket: string | null = null;
  private suiteToken: string | null = null;
  private suiteTokenExpiresAt = 0;
  private corpTokens = new Map<string, CorpTokenInfo>();
  private http: AxiosInstance;

  constructor(
    private suiteId = process.env.WECOM_SUITE_ID!,
    private suiteSecret = process.env.WECOM_SUITE_SECRET!,
  ) {
    this.http = axios.create({ baseURL: WeComISVClient.BASE_URL, timeout: 10_000 });
  }

  /** 回调收到 suite_ticket 时调用 */
  updateSuiteTicket(ticket: string): void {
    this.suiteTicket = ticket;
  }

  /** 获取 suite_access_token */
  async getSuiteAccessToken(): Promise<string> {
    if (this.suiteToken && Date.now() < this.suiteTokenExpiresAt) return this.suiteToken;
    if (!this.suiteTicket) throw new Error('suite_ticket 未设置');
    const { data } = await this.http.post('/service/get_suite_token', {
      suite_id: this.suiteId,
      suite_secret: this.suiteSecret,
      suite_ticket: this.suiteTicket,
    });
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    this.suiteToken = data.suite_access_token;
    this.suiteTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return this.suiteToken!;
  }

  /** 注册企业授权信息 */
  registerCorp(authCorpId: string, permanentCode: string): void {
    this.corpTokens.set(authCorpId, { permanentCode, token: null, expiresAt: 0 });
  }

  /** 用临时授权码换取永久授权码 */
  async getPermanentCode(authCode: string): Promise<Record<string, unknown>> {
    const suiteToken = await this.getSuiteAccessToken();
    const { data } = await this.http.post(
      `/service/v2/get_permanent_code?suite_access_token=${suiteToken}`,
      { auth_code: authCode },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    const corpId = (data.auth_corp_info as { corpid: string }).corpid;
    this.registerCorp(corpId, data.permanent_code as string);
    return data;
  }

  /** 获取指定企业的 access_token */
  async getCorpToken(authCorpId: string): Promise<string> {
    const corp = this.corpTokens.get(authCorpId);
    if (!corp) throw new Error(`企业 ${authCorpId} 未注册`);
    if (corp.token && Date.now() < corp.expiresAt) return corp.token;

    const suiteToken = await this.getSuiteAccessToken();
    const { data } = await this.http.post(
      `/service/get_corp_token?suite_access_token=${suiteToken}`,
      { auth_corpid: authCorpId, permanent_code: corp.permanentCode },
    );
    if (data.errcode && data.errcode !== 0) throw new WeComISVError(data.errcode, data.errmsg);
    corp.token = data.access_token;
    corp.expiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return corp.token!;
  }

  /** 以指定企业身份调用业务 API */
  async request<T = Record<string, unknown>>(
    authCorpId: string,
    method: 'GET' | 'POST',
    path: string,
    body?: object,
    retries = 3,
  ): Promise<T> {
    for (let attempt = 0; attempt < retries; attempt++) {
      const token = await this.getCorpToken(authCorpId);
      const config = {
        method, url: path,
        params: { access_token: token },
        ...(body ? { data: body } : {}),
      };
      const { data } = await this.http.request<T & { errcode?: number; errmsg?: string }>(config);
      const errcode = data.errcode ?? 0;
      if (errcode === 0) return data;
      if ([42001, 40014].includes(errcode)) {
        const corp = this.corpTokens.get(authCorpId)!;
        corp.expiresAt = 0;
        continue;
      }
      if (errcode === -1 && attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new WeComISVError(errcode, data.errmsg ?? '');
    }
    throw new WeComISVError(-1, '重试次数已用尽');
  }

  async get<T = Record<string, unknown>>(corpId: string, path: string): Promise<T> {
    return this.request<T>(corpId, 'GET', path);
  }

  async post<T = Record<string, unknown>>(corpId: string, path: string, body: object): Promise<T> {
    return this.request<T>(corpId, 'POST', path, body);
  }
}
```

### 8.3 ISV Client (Go)

```go
package wecom

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"
)

// ISVClient 服务商代开发客户端，管理 suite_access_token 和多企业 corp access_token
type ISVClient struct {
	SuiteID     string
	SuiteSecret string

	suiteTicket          string
	suiteToken           string
	suiteTokenExpiresAt  time.Time
	corpTokens           map[string]*corpTokenInfo
	mu                   sync.RWMutex
	httpClient           *http.Client
}

type corpTokenInfo struct {
	PermanentCode string
	Token         string
	ExpiresAt     time.Time
}

func NewISVClient(suiteID, suiteSecret string) *ISVClient {
	if suiteID == "" { suiteID = os.Getenv("WECOM_SUITE_ID") }
	if suiteSecret == "" { suiteSecret = os.Getenv("WECOM_SUITE_SECRET") }
	return &ISVClient{
		SuiteID:     suiteID,
		SuiteSecret: suiteSecret,
		corpTokens:  make(map[string]*corpTokenInfo),
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

// UpdateSuiteTicket 回调收到 suite_ticket 时调用
func (c *ISVClient) UpdateSuiteTicket(ticket string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.suiteTicket = ticket
}

// GetSuiteAccessToken 获取 suite_access_token（带缓存）
func (c *ISVClient) GetSuiteAccessToken() (string, error) {
	c.mu.RLock()
	if c.suiteToken != "" && time.Now().Before(c.suiteTokenExpiresAt) {
		defer c.mu.RUnlock()
		return c.suiteToken, nil
	}
	c.mu.RUnlock()
	return c.refreshSuiteToken()
}

func (c *ISVClient) refreshSuiteToken() (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.suiteTicket == "" {
		return "", fmt.Errorf("suite_ticket 未设置")
	}
	body, _ := json.Marshal(map[string]string{
		"suite_id":     c.SuiteID,
		"suite_secret": c.SuiteSecret,
		"suite_ticket": c.suiteTicket,
	})
	resp, err := c.httpClient.Post(baseURL+"/service/get_suite_token", "application/json", bytes.NewReader(body))
	if err != nil { return "", err }
	defer resp.Body.Close()
	var result struct {
		ErrCode          int    `json:"errcode"`
		ErrMsg           string `json:"errmsg"`
		SuiteAccessToken string `json:"suite_access_token"`
		ExpiresIn        int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil { return "", err }
	if result.ErrCode != 0 { return "", &WeComError{result.ErrCode, result.ErrMsg} }
	c.suiteToken = result.SuiteAccessToken
	c.suiteTokenExpiresAt = time.Now().Add(time.Duration(result.ExpiresIn-300) * time.Second)
	return c.suiteToken, nil
}

// RegisterCorp 注册企业授权信息
func (c *ISVClient) RegisterCorp(authCorpID, permanentCode string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.corpTokens[authCorpID] = &corpTokenInfo{PermanentCode: permanentCode}
}

// GetCorpToken 获取指定企业的 access_token
func (c *ISVClient) GetCorpToken(authCorpID string) (string, error) {
	c.mu.RLock()
	corp, ok := c.corpTokens[authCorpID]
	if !ok {
		c.mu.RUnlock()
		return "", fmt.Errorf("企业 %s 未注册", authCorpID)
	}
	if corp.Token != "" && time.Now().Before(corp.ExpiresAt) {
		c.mu.RUnlock()
		return corp.Token, nil
	}
	c.mu.RUnlock()
	return c.refreshCorpToken(authCorpID)
}

func (c *ISVClient) refreshCorpToken(authCorpID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	corp := c.corpTokens[authCorpID]
	suiteToken, err := c.GetSuiteAccessToken()
	if err != nil { return "", err }
	body, _ := json.Marshal(map[string]string{
		"auth_corpid":    authCorpID,
		"permanent_code": corp.PermanentCode,
	})
	url := fmt.Sprintf("%s/service/get_corp_token?suite_access_token=%s", baseURL, suiteToken)
	resp, err := c.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil { return "", err }
	defer resp.Body.Close()
	var result struct {
		ErrCode     int    `json:"errcode"`
		ErrMsg      string `json:"errmsg"`
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil { return "", err }
	if result.ErrCode != 0 { return "", &WeComError{result.ErrCode, result.ErrMsg} }
	corp.Token = result.AccessToken
	corp.ExpiresAt = time.Now().Add(time.Duration(result.ExpiresIn-300) * time.Second)
	return corp.Token, nil
}

// Request 以指定企业身份调用业务 API
func (c *ISVClient) Request(authCorpID, method, path string, reqBody interface{}) (map[string]interface{}, error) {
	for attempt := 0; attempt < 3; attempt++ {
		token, err := c.GetCorpToken(authCorpID)
		if err != nil { return nil, err }
		url := fmt.Sprintf("%s%s?access_token=%s", baseURL, path, token)
		var bodyReader io.Reader
		if reqBody != nil {
			b, _ := json.Marshal(reqBody)
			bodyReader = bytes.NewReader(b)
		}
		req, _ := http.NewRequest(method, url, bodyReader)
		if reqBody != nil { req.Header.Set("Content-Type", "application/json") }
		resp, err := c.httpClient.Do(req)
		if err != nil { return nil, err }
		defer resp.Body.Close()
		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		errcode := int(result["errcode"].(float64))
		if errcode == 0 { return result, nil }
		if errcode == 42001 || errcode == 40014 { c.refreshCorpToken(authCorpID); continue }
		if errcode == -1 && attempt < 2 { time.Sleep(time.Duration(attempt+1) * time.Second); continue }
		return nil, &WeComError{errcode, result["errmsg"].(string)}
	}
	return nil, &WeComError{-1, "重试次数已用尽"}
}
```

### 8.4 ISV Client (Java)

```java
package com.wecom.isv;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/** 企业微信服务商代开发客户端 — 管理多企业 Token */
public class WeComISVClient {

    private static final String BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";
    private static final int TOKEN_ADVANCE_SECONDS = 300;
    private static final int MAX_RETRIES = 3;

    private final String suiteId;
    private final String suiteSecret;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient;

    private volatile String suiteTicket;
    private volatile String suiteToken;
    private volatile Instant suiteTokenExpiresAt = Instant.EPOCH;
    private final ConcurrentHashMap<String, CorpTokenInfo> corpTokens = new ConcurrentHashMap<>();

    private final ReentrantLock suiteTokenLock = new ReentrantLock();
    private final ConcurrentHashMap<String, ReentrantLock> corpTokenLocks = new ConcurrentHashMap<>();

    private static class CorpTokenInfo {
        final String permanentCode;
        volatile String token;
        volatile Instant expiresAt = Instant.EPOCH;

        CorpTokenInfo(String permanentCode) {
            this.permanentCode = permanentCode;
        }
    }

    public WeComISVClient(String suiteId, String suiteSecret) {
        this.suiteId = suiteId != null ? suiteId : System.getenv("WECOM_SUITE_ID");
        this.suiteSecret = suiteSecret != null ? suiteSecret : System.getenv("WECOM_SUITE_SECRET");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public WeComISVClient() {
        this(null, null);
    }

    // ─── suite_ticket 管理 ───

    /** 回调收到 suite_ticket 时调用，覆盖存储 */
    public void updateSuiteTicket(String ticket) {
        this.suiteTicket = ticket;
    }

    // ─── suite_access_token 管理 ───

    /** 获取 suite_access_token（带缓存） */
    public String getSuiteAccessToken() throws WeComISVException {
        if (suiteToken != null && Instant.now().isBefore(suiteTokenExpiresAt)) {
            return suiteToken;
        }
        suiteTokenLock.lock();
        try {
            if (suiteToken != null && Instant.now().isBefore(suiteTokenExpiresAt)) {
                return suiteToken;
            }
            return refreshSuiteToken();
        } finally {
            suiteTokenLock.unlock();
        }
    }

    private String refreshSuiteToken() throws WeComISVException {
        if (suiteTicket == null || suiteTicket.isEmpty()) {
            throw new IllegalStateException("suite_ticket 未设置，请确认回调服务已接收到 suite_ticket 推送");
        }
        JsonNode resp = postJson(BASE_URL + "/service/get_suite_token", mapper.createObjectNode()
                .put("suite_id", suiteId)
                .put("suite_secret", suiteSecret)
                .put("suite_ticket", suiteTicket));
        checkError(resp);
        suiteToken = resp.get("suite_access_token").asText();
        suiteTokenExpiresAt = Instant.now().plusSeconds(resp.get("expires_in").asInt() - TOKEN_ADVANCE_SECONDS);
        return suiteToken;
    }

    // ─── 企业授权管理 ───

    /** 注册企业授权信息（授权回调后调用） */
    public void registerCorp(String authCorpId, String permanentCode) {
        corpTokens.put(authCorpId, new CorpTokenInfo(permanentCode));
        corpTokenLocks.putIfAbsent(authCorpId, new ReentrantLock());
    }

    /** 用临时授权码换取永久授权码 */
    public JsonNode getPermanentCode(String authCode) throws WeComISVException {
        String token = getSuiteAccessToken();
        JsonNode resp = postJson(
                BASE_URL + "/service/v2/get_permanent_code?suite_access_token=" + token,
                mapper.createObjectNode().put("auth_code", authCode));
        checkError(resp);
        String corpId = resp.get("auth_corp_info").get("corpid").asText();
        registerCorp(corpId, resp.get("permanent_code").asText());
        return resp;
    }

    // ─── corp access_token 管理 ───

    /** 获取指定企业的 access_token */
    public String getCorpToken(String authCorpId) throws WeComISVException {
        CorpTokenInfo corp = corpTokens.get(authCorpId);
        if (corp == null) {
            throw new IllegalStateException("企业 " + authCorpId + " 未注册，请先调用 registerCorp");
        }
        if (corp.token != null && Instant.now().isBefore(corp.expiresAt)) {
            return corp.token;
        }
        ReentrantLock lock = corpTokenLocks.computeIfAbsent(authCorpId, k -> new ReentrantLock());
        lock.lock();
        try {
            if (corp.token != null && Instant.now().isBefore(corp.expiresAt)) {
                return corp.token;
            }
            return refreshCorpToken(authCorpId);
        } finally {
            lock.unlock();
        }
    }

    private String refreshCorpToken(String authCorpId) throws WeComISVException {
        CorpTokenInfo corp = corpTokens.get(authCorpId);
        String token = getSuiteAccessToken();
        JsonNode resp = postJson(
                BASE_URL + "/service/get_corp_token?suite_access_token=" + token,
                mapper.createObjectNode()
                        .put("auth_corpid", authCorpId)
                        .put("permanent_code", corp.permanentCode));
        // 注意：此接口调用失败时才返回 errcode
        checkError(resp);
        corp.token = resp.get("access_token").asText();
        corp.expiresAt = Instant.now().plusSeconds(resp.get("expires_in").asInt() - TOKEN_ADVANCE_SECONDS);
        return corp.token;
    }

    // ─── 业务 API 调用 ───

    /** 以指定企业身份调用业务 API */
    public JsonNode request(String authCorpId, String method, String path, Object body) throws WeComISVException {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            String token = getCorpToken(authCorpId);
            String sep = path.contains("?") ? "&" : "?";
            String url = BASE_URL + path + sep + "access_token=" + token;
            JsonNode resp;
            if ("POST".equalsIgnoreCase(method) && body != null) {
                resp = postJson(url, body);
            } else {
                resp = getJson(url);
            }
            int errcode = resp.has("errcode") ? resp.get("errcode").asInt() : 0;
            if (errcode == 0) return resp;
            if (errcode == 42001 || errcode == 40014) {
                CorpTokenInfo corp = corpTokens.get(authCorpId);
                if (corp != null) corp.expiresAt = Instant.EPOCH;
                continue;
            }
            if (errcode == -1 && attempt < MAX_RETRIES - 1) {
                try { Thread.sleep(1000L * (attempt + 1)); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                continue;
            }
            throw new WeComISVException(errcode, resp.has("errmsg") ? resp.get("errmsg").asText() : "");
        }
        throw new WeComISVException(-1, "重试次数已用尽");
    }

    public JsonNode get(String authCorpId, String path) throws WeComISVException {
        return request(authCorpId, "GET", path, null);
    }

    public JsonNode post(String authCorpId, String path, Object body) throws WeComISVException {
        return request(authCorpId, "POST", path, body);
    }

    // ─── HTTP 工具方法 ───

    private JsonNode postJson(String url, Object body) throws WeComISVException {
        try {
            String json = (body instanceof JsonNode) ? body.toString() : mapper.writeValueAsString(body);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return mapper.readTree(resp.body());
        } catch (WeComISVException e) {
            throw e;
        } catch (Exception e) {
            throw new WeComISVException(-1, "HTTP 请求失败: " + e.getMessage());
        }
    }

    private JsonNode getJson(String url) throws WeComISVException {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            return mapper.readTree(resp.body());
        } catch (Exception e) {
            throw new WeComISVException(-1, "HTTP 请求失败: " + e.getMessage());
        }
    }

    private void checkError(JsonNode resp) throws WeComISVException {
        if (resp.has("errcode") && resp.get("errcode").asInt() != 0) {
            throw new WeComISVException(
                    resp.get("errcode").asInt(),
                    resp.has("errmsg") ? resp.get("errmsg").asText() : "unknown");
        }
    }
}
```

```java
package com.wecom.isv;

/** 企业微信服务商代开发异常 */
public class WeComISVException extends Exception {
    private final int errcode;
    private final String errmsg;

    public WeComISVException(int errcode, String errmsg) {
        super("WeCom ISV Error [" + errcode + "]: " + errmsg);
        this.errcode = errcode;
        this.errmsg = errmsg;
    }

    public int getErrcode() { return errcode; }
    public String getErrmsg() { return errmsg; }
}
```

### 8.5 ISV Client (PHP)

```php
<?php

declare(strict_types=1);

namespace WeComISV;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

/**
 * 企业微信服务商代开发异常
 */
class WeComISVException extends \RuntimeException
{
    public function __construct(
        public readonly int $errcode,
        public readonly string $errmsg,
    ) {
        parent::__construct("WeCom ISV Error [{$errcode}]: {$errmsg}");
    }
}

/**
 * 企业 Token 缓存信息
 */
class CorpTokenInfo
{
    public function __construct(
        public readonly string $permanentCode,
        public ?string $token = null,
        public float $expiresAt = 0,
    ) {}
}

/**
 * 企业微信服务商代开发客户端 — 管理多企业 Token
 */
class WeComISVClient
{
    private const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';
    private const TOKEN_ADVANCE_SECONDS = 300;
    private const MAX_RETRIES = 3;
    private const TIMEOUT = 10;

    private string $suiteId;
    private string $suiteSecret;
    private ?string $suiteTicket = null;
    private ?string $suiteToken = null;
    private float $suiteTokenExpiresAt = 0;

    /** @var array<string, CorpTokenInfo> */
    private array $corpTokens = [];

    private Client $httpClient;

    public function __construct(?string $suiteId = null, ?string $suiteSecret = null)
    {
        $this->suiteId = $suiteId ?? getenv('WECOM_SUITE_ID') ?: '';
        $this->suiteSecret = $suiteSecret ?? getenv('WECOM_SUITE_SECRET') ?: '';
        $this->httpClient = new Client([
            'base_uri' => self::BASE_URL,
            'timeout'  => self::TIMEOUT,
            'headers'  => ['Content-Type' => 'application/json'],
        ]);
    }

    // ─── suite_ticket 管理 ───

    /** 回调收到 suite_ticket 时调用，覆盖存储 */
    public function updateSuiteTicket(string $ticket): void
    {
        $this->suiteTicket = $ticket;
    }

    // ─── suite_access_token 管理 ───

    /** 获取 suite_access_token（带缓存） */
    public function getSuiteAccessToken(): string
    {
        if ($this->suiteToken !== null && microtime(true) < $this->suiteTokenExpiresAt) {
            return $this->suiteToken;
        }
        return $this->refreshSuiteToken();
    }

    private function refreshSuiteToken(): string
    {
        if ($this->suiteTicket === null || $this->suiteTicket === '') {
            throw new \RuntimeException('suite_ticket 未设置，请确认回调服务已接收到 suite_ticket 推送');
        }

        $resp = $this->postJson('/service/get_suite_token', [
            'suite_id'     => $this->suiteId,
            'suite_secret' => $this->suiteSecret,
            'suite_ticket' => $this->suiteTicket,
        ]);
        $this->checkError($resp);

        $this->suiteToken = $resp['suite_access_token'];
        $this->suiteTokenExpiresAt = microtime(true) + $resp['expires_in'] - self::TOKEN_ADVANCE_SECONDS;
        return $this->suiteToken;
    }

    // ─── 企业授权管理 ───

    /** 注册企业授权信息（授权回调后调用） */
    public function registerCorp(string $authCorpId, string $permanentCode): void
    {
        $this->corpTokens[$authCorpId] = new CorpTokenInfo($permanentCode);
    }

    /** 用临时授权码换取永久授权码 */
    public function getPermanentCode(string $authCode): array
    {
        $suiteToken = $this->getSuiteAccessToken();
        $resp = $this->postJson(
            "/service/v2/get_permanent_code?suite_access_token={$suiteToken}",
            ['auth_code' => $authCode]
        );
        $this->checkError($resp);

        $corpId = $resp['auth_corp_info']['corpid'];
        $this->registerCorp($corpId, $resp['permanent_code']);
        return $resp;
    }

    // ─── corp access_token 管理 ───

    /** 获取指定企业的 access_token */
    public function getCorpToken(string $authCorpId): string
    {
        if (!isset($this->corpTokens[$authCorpId])) {
            throw new \RuntimeException("企业 {$authCorpId} 未注册，请先调用 registerCorp");
        }

        $corp = $this->corpTokens[$authCorpId];
        if ($corp->token !== null && microtime(true) < $corp->expiresAt) {
            return $corp->token;
        }
        return $this->refreshCorpToken($authCorpId);
    }

    private function refreshCorpToken(string $authCorpId): string
    {
        $corp = $this->corpTokens[$authCorpId];
        $suiteToken = $this->getSuiteAccessToken();
        $resp = $this->postJson(
            "/service/get_corp_token?suite_access_token={$suiteToken}",
            [
                'auth_corpid'    => $authCorpId,
                'permanent_code' => $corp->permanentCode,
            ]
        );
        // 注意：此接口调用失败时才返回 errcode
        $this->checkError($resp);

        $corp->token = $resp['access_token'];
        $corp->expiresAt = microtime(true) + $resp['expires_in'] - self::TOKEN_ADVANCE_SECONDS;
        return $corp->token;
    }

    // ─── 业务 API 调用 ───

    /**
     * 以指定企业身份调用业务 API
     *
     * @param string      $authCorpId 授权企业 corpid
     * @param string      $method     HTTP 方法 (GET/POST)
     * @param string      $path       API 路径（不含 /cgi-bin/ 前缀）
     * @param array|null  $body       POST 请求体
     * @return array 响应 JSON
     * @throws WeComISVException
     */
    public function request(string $authCorpId, string $method, string $path, ?array $body = null): array
    {
        for ($attempt = 0; $attempt < self::MAX_RETRIES; $attempt++) {
            $token = $this->getCorpToken($authCorpId);
            $sep = str_contains($path, '?') ? '&' : '?';
            $url = $path . $sep . 'access_token=' . $token;

            $resp = strtoupper($method) === 'POST' && $body !== null
                ? $this->postJson($url, $body)
                : $this->getJson($url);

            $errcode = $resp['errcode'] ?? 0;
            if ($errcode === 0) {
                return $resp;
            }
            if ($errcode === 42001 || $errcode === 40014) {
                if (isset($this->corpTokens[$authCorpId])) {
                    $this->corpTokens[$authCorpId]->expiresAt = 0;
                }
                continue;
            }
            if ($errcode === -1 && $attempt < self::MAX_RETRIES - 1) {
                usleep(($attempt + 1) * 1_000_000);
                continue;
            }
            throw new WeComISVException($errcode, $resp['errmsg'] ?? '');
        }
        throw new WeComISVException(-1, '重试次数已用尽');
    }

    public function get(string $authCorpId, string $path): array
    {
        return $this->request($authCorpId, 'GET', $path);
    }

    public function post(string $authCorpId, string $path, array $body): array
    {
        return $this->request($authCorpId, 'POST', $path, $body);
    }

    // ─── HTTP 工具方法 ───

    private function postJson(string $path, array $body): array
    {
        try {
            $response = $this->httpClient->post($path, [
                'json' => $body,
            ]);
            return json_decode($response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        } catch (GuzzleException $e) {
            throw new WeComISVException(-1, 'HTTP 请求失败: ' . $e->getMessage());
        }
    }

    private function getJson(string $path): array
    {
        try {
            $response = $this->httpClient->get($path);
            return json_decode($response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        } catch (GuzzleException $e) {
            throw new WeComISVException(-1, 'HTTP 请求失败: ' . $e->getMessage());
        }
    }

    private function checkError(array $resp): void
    {
        if (isset($resp['errcode']) && $resp['errcode'] !== 0) {
            throw new WeComISVException(
                $resp['errcode'],
                $resp['errmsg'] ?? 'unknown'
            );
        }
    }
}
```

---

## 9. Test Templates

### 9.1 Python (pytest)

```python
import pytest
from unittest.mock import patch, MagicMock
from wecom_isv_client import WeComISVClient, WeComISVError


@pytest.fixture
def client():
    c = WeComISVClient("test_suite_id", "test_suite_secret")
    c._suite_ticket = "test_ticket"
    c._suite_token = "mock_suite_token"
    c._suite_token_expires_at = float("inf")
    c.register_corp("corp_001", "perm_code_001")
    c._corp_tokens["corp_001"]["token"] = "mock_corp_token"
    c._corp_tokens["corp_001"]["expires_at"] = float("inf")
    return c


class TestSuiteToken:
    @patch("requests.post")
    def test_获取suite_access_token成功(self, mock_post):
        c = WeComISVClient("sid", "ssecret")
        c._suite_ticket = "ticket_xxx"
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "suite_access_token": "new_suite_token", "expires_in": 7200,
        })
        token = c.suite_access_token
        assert token == "new_suite_token"
        mock_post.assert_called_once()

    def test_无suite_ticket时抛异常(self):
        c = WeComISVClient("sid", "ssecret")
        with pytest.raises(RuntimeError, match="suite_ticket 未设置"):
            _ = c.suite_access_token


class TestCorpToken:
    @patch("requests.post")
    def test_获取企业token成功(self, mock_post, client):
        client._corp_tokens["corp_001"]["expires_at"] = 0
        mock_post.return_value = MagicMock(json=lambda: {
            "access_token": "new_corp_token", "expires_in": 7200,
        })
        token = client.get_corp_token("corp_001")
        assert token == "new_corp_token"

    def test_未注册企业抛异常(self, client):
        with pytest.raises(RuntimeError, match="未注册"):
            client.get_corp_token("unknown_corp")


class TestBusinessAPI:
    @patch("requests.request")
    def test_业务API调用成功(self, mock_req, client):
        mock_req.return_value = MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok", "data": "value"})
        result = client.get("corp_001", "/user/get")
        assert result["data"] == "value"

    @patch("requests.request")
    def test_token过期自动刷新(self, mock_req, client):
        client._corp_tokens["corp_001"]["expires_at"] = 0
        with patch.object(client, "_refresh_corp_token"):
            mock_req.return_value = MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok"})
            client.get("corp_001", "/user/get")

    @patch("requests.request")
    def test_系统繁忙自动重试(self, mock_req, client):
        mock_req.side_effect = [
            MagicMock(json=lambda: {"errcode": -1, "errmsg": "system busy"}),
            MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok", "data": "ok"}),
        ]
        result = client.get("corp_001", "/user/get")
        assert result["data"] == "ok"
        assert mock_req.call_count == 2

    @patch("requests.request")
    def test_业务错误抛异常(self, mock_req, client):
        mock_req.return_value = MagicMock(json=lambda: {"errcode": 48002, "errmsg": "no permission"})
        with pytest.raises(WeComISVError) as exc_info:
            client.get("corp_001", "/user/get")
        assert exc_info.value.errcode == 48002
```

---

## 10. Code Review Checklist

### 10.1 代开发专项审核

| 维度 | 检查项 | 级别 |
|------|--------|------|
| 安全 | suite_id / suite_secret 从环境变量读取，未硬编码 | CRITICAL |
| 安全 | permanent_code 持久化存储（数据库），非内存 | CRITICAL |
| 安全 | suite_ticket 回调签名验证存在 | CRITICAL |
| 安全 | suite_access_token / corp access_token 未明文记录日志 | CRITICAL |
| 正确 | 使用 `/service/*` 路径获取 token，非 `/gettoken` | HIGH |
| 正确 | get_corp_token 通过 suite_access_token 调用，非直接用 corpid+secret | HIGH |
| 正确 | get_permanent_code 使用 v2 版本路径 | HIGH |
| 正确 | 多企业 token 按 corpid 维度独立缓存 | HIGH |
| 健壮 | suite_ticket 有持久化/更新机制 | HIGH |
| 健壮 | suite_access_token 和 corp access_token 均有缓存 | HIGH |
| 健壮 | corp access_token 过期时能自动通过 suite_access_token 刷新 | MEDIUM |
| 健壮 | 处理 get_corp_token "无 errcode 视为成功" 的特殊逻辑 | MEDIUM |
| 兼容 | 处理加密后的 corpid / userid / external_userid | MEDIUM |
| 兼容 | 敏感信息通过 OAuth2 用户授权获取，非直接接口调用 | MEDIUM |

---

## 11. Gotcha Guide

### 11.1 高频踩坑

| # | 坑点 | 正确做法 |
|---|------|---------|
| 1 | 用 `/gettoken?corpid=&corpsecret=` 获取代开发应用的 token | 必须用 `/service/get_corp_token`，secret 是 permanent_code |
| 2 | suite_ticket 丢失导致无法获取 suite_access_token | 服务商管理后台手动触发推送；回调服务做持久化（Redis/DB） |
| 3 | 多企业 token 混用（corpA 的 token 调 corpB 的 API） | 按 corpid 维度独立管理 token，调用时严格匹配 |
| 4 | get_corp_token 返回无 errcode 当作失败处理 | 此接口**无 errcode 视为成功**（历史原因） |
| 5 | 代开发应用调用 `POST /agent/set` 设置应用 | 代开发不可调用此接口，应用配置在模版中完成 |
| 6 | 代开发应用使用第三方应用的 OAuth2 身份验证接口 | 代开发使用自建应用的 OAuth2 接口 |
| 7 | 直接通过接口获取成员手机号/邮箱 | 新授权代开发应用需通过 OAuth2 让成员主动授权 |
| 8 | 认为 corpid/userid 与企业自建应用获取的相同 | 代开发返回服务商主体加密的 ID，需用转换接口 |
| 9 | 一个回调 URL 处理所有事件 | 代开发有两个回调 URL：模版回调（suite_ticket/授权）和应用回调（业务事件） |
| 10 | permanent_code 只存内存 | 必须持久化到数据库，服务重启后无法重新获取 |

### 11.2 代开发专属错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40082 | suite_id 不合法 | 检查 suite_id 是否正确 |
| 40083 | suite_secret 不合法 | 检查 suite_secret |
| 40084 | suite_ticket 不合法 | 使用最新推送的 suite_ticket |
| 40085 | suite_token 不合法 | 重新获取 suite_access_token |
| 40086 | 不合法的 auth_corpid | 检查企业是否已授权 |
| 40089 | 不合法的 permanent_code | 检查永久授权码是否正确 |
| 41004 | suite_id 为空 | 请求缺少 suite_id 参数 |
| 42009 | suite_access_token 已过期 | 重新获取 |
| 45009 | 调用频率超限 | 降频，确保 token 有缓存 |
| 60020 | IP 不在白名单 | 服务商管理后台添加 IP 白名单 |
| 84014 | 无效的临时授权码 | auth_code 已使用或过期 |
| 84015 | 企业已被取消授权 | 企业管理员取消了授权 |

---

## 12. References

### 12.1 官方文档

| 文档 | 链接 |
|------|------|
| 服务商代开发概述 | https://developer.work.weixin.qq.com/document/path/97111 |
| 代开发流程 | https://developer.work.weixin.qq.com/document/path/97112 |
| 开发前必读 | https://developer.work.weixin.qq.com/document/path/97159 |
| 与自建应用接口的差异 | https://developer.work.weixin.qq.com/document/path/97165 |
| 代开发应用权限说明 | https://developer.work.weixin.qq.com/document/path/98980 |
| 代开发应用安全性升级 | https://developer.work.weixin.qq.com/document/path/96518 |
| 代开发授权应用 secret 获取 | https://developer.work.weixin.qq.com/document/path/97163 |
| 代开发授权应用 access_token 获取 | https://developer.work.weixin.qq.com/document/path/97164 |
| 获取企业凭证 | https://developer.work.weixin.qq.com/document/path/90605 |
| 获取第三方应用凭证 | https://developer.work.weixin.qq.com/document/path/90600 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |

### 12.2 能力索引（ISV 域）

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 授权流程、预授权码、授权链接 | wecom-isv-auth |
| suite_ticket、授权通知、回调事件 | wecom-isv-callback |
| 接口调用许可、帐号购买、激活 | wecom-isv-license |
| 收银台、支付、定价、收款 | wecom-isv-billing |
| JS-SDK、agentConfig、前端签名 | wecom-isv-jssdk |
| 服务商凭证、登录授权、ID 转换 | wecom-isv-provider |
| 错误码、频率限制、兼容性矩阵 | wecom-isv-appendix |
| 通讯录、成员、部门 | wecom-contact（复用，换 token 即可） |
| 消息推送、群聊 | wecom-message（复用，换 token 即可） |
| 客户联系、CRM | wecom-crm-*（复用，换 token 即可） |
