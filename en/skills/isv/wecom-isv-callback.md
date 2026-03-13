---
name: wecom-isv-callback
description: |
  企业微信服务商代开发回调体系 SKILL。覆盖模版回调与应用回调两条通道的完整事件处理：suite_ticket 推送、授权事件、通讯录变更、应用业务事件，以及回调 URL 验证、加解密、事件路由分发。
  TRIGGER: 当用户提到代开发回调、suite_ticket、授权通知、create_auth、change_auth、cancel_auth、reset_permanent_code、代开发事件推送、回调路由 相关开发时触发。
  本 SKILL 依赖 wecom-isv-core（三级凭证体系）和 wecom-core（加解密基础）。
version: 1.0.0
domain: isv-callback
depends_on:
  - wecom-isv-core
  - wecom-core
doc_ids: [97166, 97167, 97168, 97169, 97170, 90968]
triggers:
  - 代开发回调
  - 代开发事件
  - suite_ticket
  - suite callback
  - create_auth
  - change_auth
  - cancel_auth
  - reset_permanent_code
  - 模版回调
  - 应用回调
  - ISV callback
  - 代开发 URL 验证
  - 回调路由
  - InfoType
---

# WeCom ISV Callback System (wecom-isv-callback)

你现在是企业微信**服务商代开发回调体系**领域的专家。基于本 SKILL 的知识，帮助开发者快速、正确地实现代开发应用的回调接收、事件路由与业务处理。

> **定位**：本 SKILL 聚焦代开发模式下**两条回调通道**的完整处理。凭证管理继承自 `wecom-isv-core`，加解密算法继承自 `wecom-core`。

---

## 1. Prerequisites

使用本 SKILL 前，确保已掌握：

**来自 `wecom-core`**：
- 回调配置与加解密（AES-256-CBC / 签名校验 / PKCS#7 padding）
- 错误处理（errcode / errmsg / 自动重试）
- 代码生成强制规则（敏感信息隔离 / 超时设置 / 日志规范）

**来自 `wecom-isv-core`**：
- 三级凭证体系（suite_ticket → suite_access_token → corp access_token）
- 代开发 vs 自建应用的回调差异
- 两条回调通道概述（模版回调 URL / 应用回调 URL）
- 账号 ID 安全升级（服务商主体加密）

**额外要求**：
- 拥有**企业微信服务商账号**，已创建代开发应用模版
- 已配置**模版回调 URL**（服务商管理后台 → 应用代开发 → 模版详情 → 回调配置）
- 已配置**应用回调 URL**（服务商管理后台 → 应用代开发 → 模版详情 → 数据回调配置）
- 两个回调 URL 各自拥有独立的 Token 和 EncodingAESKey

---

## 2. Core Concepts

### 2.1 两条回调通道架构

```
企业微信服务端
│
├── 模版回调通道 (Suite Callback)
│   ├── 配置位置：服务商管理后台 → 代开发模版 → 回调配置
│   ├── 加密密钥：模版级别的 Token + EncodingAESKey
│   ├── 事件类型标识：<InfoType> 字段
│   ├── 接收方标识：<SuiteId>
│   └── 接收内容：
│       ├── suite_ticket（每 10 分钟推送）
│       ├── create_auth（企业授权成功）
│       ├── change_auth（变更授权）
│       ├── cancel_auth（取消授权）
│       ├── reset_permanent_code（重置永久授权码）
│       └── change_contact（通讯录变更，仅当配置在模版级别时）
│
└── 应用回调通道 (App Callback)
    ├── 配置位置：服务商管理后台 → 代开发模版 → 数据回调配置
    ├── 加密密钥：应用级别的 Token + EncodingAESKey
    ├── 事件类型标识：<MsgType> + <Event> 字段
    ├── 接收方标识：<ToUserName>（auth_corpid）
    └── 接收内容：
        ├── 消息类（text / image / voice / video / location / link）
        ├── 事件类（subscribe / unsubscribe / enter_agent / click / view）
        ├── 通讯录变更（如果配置在应用级别）
        ├── 客户联系（change_external_contact / change_external_chat）
        └── 审批等业务事件
```

### 2.2 两条通道的关键区别

| 维度 | 模版回调 URL | 应用回调 URL |
|------|-------------|-------------|
| 配置位置 | 代开发模版 → 回调配置 | 代开发模版 → 数据回调配置 |
| 加密密钥 | 模版级 Token + EncodingAESKey | 应用级 Token + EncodingAESKey |
| 接收方 | `<SuiteId>` | `<ToUserName>`（auth_corpid） |
| 事件标识 | `<InfoType>` | `<MsgType>` + `<Event>` |
| 时间字段 | `<TimeStamp>` | `<CreateTime>` |
| 发送方 | 无 `<FromUserName>` | `<FromUserName>`（sys 或 userid） |
| 主要用途 | 平台级事件（凭证/授权） | 业务级事件（消息/客户/审批） |

### 2.3 回调消息加解密流程

```
                         收到请求
                            │
                ┌───────────┴───────────┐
                │ GET（URL 验证）        │ POST（事件推送）
                │                       │
    ┌───────────┴──────────┐  ┌────────┴─────────┐
    │ 1. 取 query 参数      │  │ 1. 取 query 参数  │
    │    msg_signature     │  │    msg_signature │
    │    timestamp         │  │    timestamp     │
    │    nonce             │  │    nonce         │
    │    echostr           │  │                  │
    │                      │  │ 2. 解析 XML Body  │
    │ 2. 签名验证           │  │    取 <Encrypt>   │
    │    sha1(sort([token, │  │                  │
    │     timestamp,nonce, │  │ 3. 签名验证       │
    │     echostr]))       │  │    sha1(sort(    │
    │    == msg_signature  │  │     [token,      │
    │                      │  │      timestamp,  │
    │ 3. AES 解密 echostr  │  │      nonce,      │
    │    得到明文           │  │      Encrypt]))  │
    │                      │  │    == msg_sig    │
    │ 4. 返回明文           │  │                  │
    │    （非 "success"）   │  │ 4. AES 解密      │
    └──────────────────────┘  │    得到明文 XML   │
                              │                  │
                              │ 5. 处理业务逻辑   │
                              │                  │
                              │ 6. 返回 "success" │
                              └──────────────────┘
```

### 2.4 AES-256-CBC 加解密规范

继承自 `wecom-core`，参数如下：

| 参数 | 说明 |
|------|------|
| Key | `Base64Decode(EncodingAESKey + "=")` = 32 字节 |
| IV | Key 的前 16 字节 |
| 明文结构 | `random(16字节) + msg_len(4字节, 网络字节序) + msg + receiveid` |
| Padding | PKCS#7 |
| receiveid | 模版回调为 `suite_id`；应用回调为 `auth_corpid` |

> **关键**：两条通道使用不同的 EncodingAESKey，解密时 receiveid 也不同。

---

## 3. API Quick Reference

### 3.1 回调验证与接收

| 操作 | 方法 | 路径 | 说明 |
|------|------|------|------|
| URL 验证 | GET | `{callback_url}` | 配置保存时触发，返回解密后的明文 |
| 事件接收 | POST | `{callback_url}` | 接收事件推送，返回 "success" 或空串 |

### 3.2 模版回调事件 (InfoType)

| InfoType | 名称 | 关键字段 | 处理优先级 |
|----------|------|---------|-----------|
| suite_ticket | 票据推送 | SuiteTicket | P0（核心） |
| create_auth | 授权成功 | AuthCode, State | P0 |
| change_auth | 变更授权 | AuthCorpId | P0 |
| cancel_auth | 取消授权 | AuthCorpId | P0 |
| reset_permanent_code | 重置永久授权码 | AuthCorpId | P1 |
| change_contact | 通讯录变更 | AuthCorpId, ChangeType | P1 |

### 3.3 应用回调事件 (MsgType / Event)

| MsgType | Event | 名称 | 说明 |
|---------|-------|------|------|
| text | — | 文本消息 | 用户发送的文本 |
| image | — | 图片消息 | 含 PicUrl / MediaId |
| voice | — | 语音消息 | 含 MediaId / Format |
| video | — | 视频消息 | 含 MediaId / ThumbMediaId |
| location | — | 位置消息 | 含 Location_X/Y / Scale / Label |
| link | — | 链接消息 | 含 Title / Description / Url |
| event | subscribe | 关注应用 | — |
| event | unsubscribe | 取消关注 | — |
| event | enter_agent | 进入应用 | — |
| event | click | 菜单点击 | 含 EventKey |
| event | view | 菜单跳转 | 含 EventKey（URL） |
| event | location_report | 位置上报 | 含 Latitude / Longitude |
| event | change_external_contact | 客户变更 | ChangeType 细分 |
| event | change_external_chat | 客户群变更 | — |
| event | change_contact | 通讯录变更 | ChangeType 细分 |

---

## 4. API Details

### 4.1 回调 URL 验证（GET 请求）

- **触发时机**：在服务商管理后台保存回调配置时，企业微信向配置的 URL 发送 GET 请求验证有效性
- **必须在 1 秒内响应**

```
GET https://{callback_url}?msg_signature=xxx&timestamp=xxx&nonce=xxx&echostr=xxx
```

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| msg_signature | string | 签名，由 token + timestamp + nonce + echostr 计算 |
| timestamp | string | 时间戳 |
| nonce | string | 随机数 |
| echostr | string | 加密字符串，需解密后返回明文 |

**处理流程：**

1. 计算签名：`sha1(sort([token, timestamp, nonce, echostr]))` → 与 `msg_signature` 比对
2. AES-256-CBC 解密 `echostr` 得到明文
3. **返回解密后的明文**（不是 "success"，不加引号，不带 BOM 头，不带换行符）

### 4.2 接收事件推送（POST 请求）

```
POST https://{callback_url}?msg_signature=xxx&timestamp=xxx&nonce=xxx
```

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| msg_signature | string | 签名 |
| timestamp | string | 时间戳 |
| nonce | string | 随机数 |

**Request Body（XML）：**

```xml
<xml>
  <ToUserName><![CDATA[toUser]]></ToUserName>
  <Encrypt><![CDATA[msg_encrypt]]></Encrypt>
  <AgentID><![CDATA[agentid]]></AgentID>
</xml>
```

**处理流程：**

1. 解析 XML，取 `<Encrypt>` 字段
2. 计算签名：`sha1(sort([token, timestamp, nonce, Encrypt]))` → 与 `msg_signature` 比对
3. AES-256-CBC 解密 `Encrypt` 得到明文 XML
4. 根据通道类型分发事件处理
5. **返回 "success" 或空字符串**（5 秒内）

### 4.3 模版回调事件详情

#### 4.3.1 suite_ticket 推送

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe9xxx]]></SuiteId>
  <InfoType><![CDATA[suite_ticket]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <SuiteTicket><![CDATA[asdfxxxxx]]></SuiteTicket>
</xml>
```

| 字段 | 说明 |
|------|------|
| SuiteId | 代开发应用模版 ID |
| InfoType | 固定为 `suite_ticket` |
| TimeStamp | 时间戳 |
| SuiteTicket | 票据值，有效期 30 分钟 |

**处理要求：**
- 每 10 分钟推送一次
- **必须在 5 秒内响应 "success"**，否则视为接收失败
- 连续 2 次接收失败 → suite_access_token 将无法刷新 → 所有业务瘫痪
- 用最新 ticket 覆盖存储（Redis / DB），不要丢弃
- 如 ticket 丢失，可在服务商管理后台手动触发推送

#### 4.3.2 授权成功通知 (create_auth)

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe9xxx]]></SuiteId>
  <InfoType><![CDATA[create_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCode><![CDATA[AUTHCODE]]></AuthCode>
  <State><![CDATA[state]]></State>
</xml>
```

| 字段 | 说明 |
|------|------|
| AuthCode | 临时授权码，一次有效，用于换取永久授权码 |
| State | 授权链接中的自定义 state 参数 |

**处理要求：**
1. 立即响应 "success"
2. **异步**用 AuthCode 调用 `POST /service/v2/get_permanent_code` 换取永久授权码
3. 持久化 `permanent_code` + `auth_corpid` 到数据库
4. AuthCode 一次有效，换取后立即失效

#### 4.3.3 变更授权通知 (change_auth)

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe9xxx]]></SuiteId>
  <InfoType><![CDATA[change_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>
```

| 字段 | 说明 |
|------|------|
| AuthCorpId | 授权企业的 corpid |

**触发场景：**
- 企业管理员修改了应用可见范围
- 企业管理员确认/拒绝了权限变更
- 企业管理员修改了应用配置

**处理要求：**
1. 立即响应 "success"
2. 异步调用 `POST /service/get_auth_info` 获取最新授权信息
3. 更新本地缓存的企业授权数据

#### 4.3.4 取消授权通知 (cancel_auth)

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe9xxx]]></SuiteId>
  <InfoType><![CDATA[cancel_auth]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>
```

**处理要求：**
1. 立即响应 "success"
2. 清理该企业的所有授权数据（permanent_code / corp access_token / 业务缓存）
3. 停止向该企业推送消息、停止定时任务
4. 记录取消授权日志，便于排查

#### 4.3.5 重置永久授权码 (reset_permanent_code)

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe9xxx]]></SuiteId>
  <InfoType><![CDATA[reset_permanent_code]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
</xml>
```

**处理要求：**
1. 立即响应 "success"
2. 调用 `POST /service/get_auth_info` 获取新的永久授权码
3. **更新数据库中的 permanent_code**（旧码立即失效）
4. 清除该企业的 corp access_token 缓存（需用新 permanent_code 重新获取）

#### 4.3.6 通讯录变更 (change_contact)

当通讯录变更配置在**模版级别**时，通过模版回调 URL 接收：

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe9xxx]]></SuiteId>
  <InfoType><![CDATA[change_contact]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <AuthCorpId><![CDATA[corpid]]></AuthCorpId>
  <ChangeType><![CDATA[create_user]]></ChangeType>
  <UserID><![CDATA[zhangsan]]></UserID>
  <!-- 其他字段根据 ChangeType 不同而不同 -->
</xml>
```

**ChangeType 子类型：**

| ChangeType | 名称 | 特有字段 |
|------------|------|---------|
| create_user | 新增成员 | UserID, Name, Department 等 |
| update_user | 更新成员 | UserID, NewUserID(如有改名) 等 |
| delete_user | 删除成员 | UserID |
| create_party | 新建部门 | Id, Name, ParentId, Order |
| update_party | 更新部门 | Id, Name, ParentId |
| delete_party | 删除部门 | Id |
| update_tag | 标签变更 | TagId, AddUserItems, DelUserItems |

> **注意**：代开发场景中 UserID 为**服务商主体加密**后的值，与企业自建应用获取的不同。

### 4.4 应用回调事件详情

#### 4.4.1 消息类事件

```xml
<xml>
  <ToUserName><![CDATA[auth_corpid]]></ToUserName>
  <FromUserName><![CDATA[userid]]></FromUserName>
  <CreateTime>1348831860</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[消息内容]]></Content>
  <MsgId>1234567890123456</MsgId>
  <AgentID>1</AgentID>
</xml>
```

**各消息类型特有字段：**

| MsgType | 特有字段 | 说明 |
|---------|---------|------|
| text | Content | 文本内容 |
| image | PicUrl, MediaId | 图片链接、媒体 ID |
| voice | MediaId, Format | 语音媒体 ID、格式（amr/speex） |
| video | MediaId, ThumbMediaId | 视频/缩略图媒体 ID |
| location | Location_X, Location_Y, Scale, Label | 纬度、经度、缩放、位置 |
| link | Title, Description, Url, PicUrl | 标题、描述、链接、封面 |

#### 4.4.2 事件类

```xml
<xml>
  <ToUserName><![CDATA[auth_corpid]]></ToUserName>
  <FromUserName><![CDATA[userid]]></FromUserName>
  <CreateTime>1348831860</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[subscribe]]></Event>
  <AgentID>1</AgentID>
</xml>
```

**各事件类型说明：**

| Event | 说明 | 特有字段 |
|-------|------|---------|
| subscribe | 成员关注应用 | — |
| unsubscribe | 成员取消关注 | — |
| enter_agent | 成员进入应用主页 | — |
| click | 自定义菜单点击 | EventKey（菜单 Key 值） |
| view | 菜单跳转链接 | EventKey（目标 URL） |
| location_report | 成员上报位置 | Latitude, Longitude, Precision |

#### 4.4.3 客户联系变更

```xml
<xml>
  <ToUserName><![CDATA[auth_corpid]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1403610513</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[change_external_contact]]></Event>
  <ChangeType><![CDATA[add_external_contact]]></ChangeType>
  <UserID><![CDATA[zhangsan]]></UserID>
  <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mACH71w]]></ExternalUserID>
  <State><![CDATA[teststate]]></State>
  <WelcomeCode><![CDATA[WELCOMECODE]]></WelcomeCode>
</xml>
```

**ChangeType 子类型：**

| ChangeType | 名称 | 特有字段 |
|------------|------|---------|
| add_external_contact | 添加客户 | State, WelcomeCode |
| add_half_external_contact | 免验证添加 | State, WelcomeCode |
| edit_external_contact | 编辑客户 | — |
| del_external_contact | 成员删客户 | Source |
| del_follow_user | 客户删成员 | — |
| transfer_fail | 接替失败 | FailReason |

---

## 5. Callbacks

> 本节为回调事件的集中索引。详细 XML 结构见第 4 节。

### 5.1 模版回调事件索引

| 编号 | InfoType | 推送频率 | 响应要求 | 后续处理 |
|------|----------|---------|---------|---------|
| SC1 | suite_ticket | 每 10 分钟 | 5 秒内返回 "success" | 更新 ticket 存储 |
| SC2 | create_auth | 企业授权时 | 5 秒内返回 "success" | 异步换取 permanent_code |
| SC3 | change_auth | 授权变更时 | 5 秒内返回 "success" | 异步更新授权信息 |
| SC4 | cancel_auth | 取消授权时 | 5 秒内返回 "success" | 清理企业数据 |
| SC5 | reset_permanent_code | 重置授权码时 | 5 秒内返回 "success" | 异步更新 permanent_code |
| SC6 | change_contact | 通讯录变更时 | 5 秒内返回 "success" | 异步同步通讯录 |

### 5.2 应用回调事件索引

| 编号 | MsgType / Event | 响应要求 | 后续处理 |
|------|----------------|---------|---------|
| AC1 | text / image / voice / video / location / link | 5 秒内返回 "success" 或被动回复 | 业务处理 |
| AC2 | event / subscribe | 返回 "success" | 可发欢迎消息 |
| AC3 | event / unsubscribe | 返回 "success" | 记录日志 |
| AC4 | event / enter_agent | 返回 "success" | 统计分析 |
| AC5 | event / click | 返回 "success" | 按 EventKey 路由 |
| AC6 | event / view | 返回 "success" | 记录跳转 |
| AC7 | event / change_external_contact | 返回 "success" | CRM 同步 |
| AC8 | event / change_external_chat | 返回 "success" | 群聊同步 |
| AC9 | event / change_contact | 返回 "success" | 通讯录同步 |

---

## 6. Workflows

### 6.1 回调服务启动流程

```
Step 1: 配置两个回调 URL
    服务商管理后台 → 代开发模版 → 回调配置     → 模版回调 URL + Token_A + AESKey_A
    服务商管理后台 → 代开发模版 → 数据回调配置 → 应用回调 URL + Token_B + AESKey_B
    ⚠️ 两组 Token 和 EncodingAESKey 必须独立，不可混用

Step 2: 部署回调服务，处理 URL 验证
    各 URL 收到 GET 请求 → 验签 → 解密 echostr → 返回明文
    验证通过后可在管理后台保存配置

Step 3: 开始接收 suite_ticket
    每 10 分钟收到推送 → 覆盖存储 → 立即响应 "success"

Step 4: 获取 suite_access_token
    suite_id + suite_secret + suite_ticket
    → POST /service/get_suite_token
    → 缓存 suite_access_token（7200 秒有效）

Step 5: 服务就绪，等待企业授权
```

### 6.2 企业授权完整事件流

```
企业管理员扫码授权
    │
    ├── 推送 create_auth 到模版回调 URL
    │   ├── 立即响应 "success"
    │   ├── 异步用 AuthCode 换取 permanent_code
    │   └── 持久化到数据库
    │
    ├── 重定向到 redirect_uri?auth_code=xxx&state=xxx
    │   └── 服务端也可从重定向中获取 auth_code
    │
    └── 后续业务事件推送到应用回调 URL
        ├── 用 auth_corpid + permanent_code 获取 corp access_token
        └── 处理通讯录/消息/客户联系等事件
```

### 6.3 suite_ticket 生命周期管理

```
                    企业微信每 10 分钟推送
                         │
                ┌────────┴────────┐
                │ 模版回调 URL     │
                │ 解密获取 ticket  │
                └────────┬────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
     存储到 Redis/DB            立即响应 "success"
     (覆盖旧 ticket)
            │
            ▼
     suite_access_token 刷新时使用
     (有效期 30 分钟，可容错 2 次推送失败)
            │
     ┌──────┴──────┐
     │ 正常        │ ticket 丢失
     │ 继续服务    │ → suite_access_token 无法刷新
     │             │ → 所有业务 API 瘫痪
     │             │ → 服务商后台手动触发推送
     └─────────────┘
```

### 6.4 事件路由分发流程

```
收到 POST 请求
    │
    ├── 判断回调通道
    │   ├── 模版回调 URL → 使用模版级 Token + AESKey 解密
    │   └── 应用回调 URL → 使用应用级 Token + AESKey 解密
    │
    ├── 解密得到明文 XML
    │
    ├── 判断事件类型
    │   ├── 有 <InfoType> → 模版回调事件
    │   │   ├── suite_ticket    → TicketHandler
    │   │   ├── create_auth     → AuthHandler
    │   │   ├── change_auth     → AuthHandler
    │   │   ├── cancel_auth     → AuthHandler
    │   │   ├── reset_permanent_code → AuthHandler
    │   │   └── change_contact  → ContactHandler
    │   │
    │   └── 有 <MsgType> → 应用回调事件
    │       ├── MsgType != event → MessageHandler
    │       └── MsgType == event
    │           ├── change_external_contact → CRMHandler
    │           ├── change_external_chat    → CRMHandler
    │           ├── change_contact          → ContactHandler
    │           ├── subscribe/unsubscribe   → AppEventHandler
    │           ├── enter_agent             → AppEventHandler
    │           ├── click/view              → MenuHandler
    │           └── location_report         → LocationHandler
    │
    └── 立即响应 "success"（业务异步处理）
```

### 6.5 取消授权清理流程

```
收到 cancel_auth 事件
    │
    ├── 立即响应 "success"
    │
    └── 异步执行清理（按顺序）
        │
        ├── 1. 停止该企业的定时任务
        │
        ├── 2. 清除 corp access_token 缓存
        │
        ├── 3. 标记 permanent_code 为已失效
        │      （建议软删除，保留记录便于审计）
        │
        ├── 4. 清除业务数据缓存
        │      （客户列表/通讯录/审批状态等）
        │
        ├── 5. 记录取消授权日志
        │      （auth_corpid / 时间 / 原因）
        │
        └── 6. 触发告警通知
               （通知运营团队跟进）
```

---

## 7. Code Templates

### 7.1 回调路由器 (Python)

```python
"""企业微信代开发回调路由器 — 双通道事件分发"""
import os, hashlib, logging, time
import xml.etree.ElementTree as ET
from typing import Callable, Optional
from flask import Flask, request, Response

# 需安装: pip install pycryptodome flask
from Crypto.Cipher import AES
import base64, struct

logger = logging.getLogger(__name__)


# ─── 加解密工具（继承自 wecom-core） ───

class WXBizMsgCrypt:
    """企业微信消息加解密工具"""

    def __init__(self, token: str, encoding_aes_key: str, receiver_id: str):
        self.token = token
        self.receiver_id = receiver_id
        self.aes_key = base64.b64decode(encoding_aes_key + "=")

    def verify_signature(self, timestamp: str, nonce: str, *encrypt_args: str) -> str:
        """计算签名"""
        arr = sorted([self.token, timestamp, nonce] + list(encrypt_args))
        return hashlib.sha1("".join(arr).encode()).hexdigest()

    def decrypt(self, encrypt_text: str) -> str:
        """AES-256-CBC 解密"""
        cipher = AES.new(self.aes_key, AES.MODE_CBC, self.aes_key[:16])
        decrypted = cipher.decrypt(base64.b64decode(encrypt_text))
        # PKCS#7 去 padding
        pad_len = decrypted[-1]
        decrypted = decrypted[:-pad_len]
        # random(16) + msg_len(4) + msg + receiveid
        msg_len = struct.unpack("!I", decrypted[16:20])[0]
        msg = decrypted[20:20 + msg_len].decode("utf-8")
        return msg

    def verify_and_decrypt(
        self, msg_signature: str, timestamp: str, nonce: str, encrypt_text: str
    ) -> str:
        """验签 + 解密"""
        sig = self.verify_signature(timestamp, nonce, encrypt_text)
        if sig != msg_signature:
            raise ValueError("签名验证失败")
        return self.decrypt(encrypt_text)


# ─── 回调处理器基类 ───

class CallbackHandler:
    """回调事件处理器基类"""

    def handle(self, xml_data: ET.Element, auth_corpid: Optional[str] = None) -> str:
        """处理事件，返回响应内容（通常为 "success"）"""
        return "success"


# ─── 模版回调处理器 ───

class SuiteCallbackHandler(CallbackHandler):
    """模版回调事件处理器"""

    def __init__(self):
        self._handlers: dict[str, Callable[[ET.Element], None]] = {}

    def on(self, info_type: str, handler: Callable[[ET.Element], None]):
        """注册 InfoType 事件处理函数"""
        self._handlers[info_type] = handler
        return self

    def handle(self, xml_data: ET.Element, auth_corpid: Optional[str] = None) -> str:
        info_type = xml_data.findtext("InfoType", "")
        logger.info(f"模版回调事件: InfoType={info_type}")
        handler = self._handlers.get(info_type)
        if handler:
            try:
                handler(xml_data)
            except Exception as e:
                logger.error(f"处理 {info_type} 事件失败: {e}", exc_info=True)
        else:
            logger.warning(f"未注册的 InfoType: {info_type}")
        return "success"


# ─── 应用回调处理器 ───

class AppCallbackHandler(CallbackHandler):
    """应用回调事件处理器"""

    def __init__(self):
        self._msg_handlers: dict[str, Callable[[ET.Element], Optional[str]]] = {}
        self._event_handlers: dict[str, Callable[[ET.Element], Optional[str]]] = {}

    def on_message(self, msg_type: str, handler: Callable[[ET.Element], Optional[str]]):
        """注册消息类型处理函数"""
        self._msg_handlers[msg_type] = handler
        return self

    def on_event(self, event_type: str, handler: Callable[[ET.Element], Optional[str]]):
        """注册事件类型处理函数

        对于有 ChangeType 的事件（如 change_external_contact），
        可用 "change_external_contact.add_external_contact" 格式注册子事件
        """
        self._event_handlers[event_type] = handler
        return self

    def handle(self, xml_data: ET.Element, auth_corpid: Optional[str] = None) -> str:
        msg_type = xml_data.findtext("MsgType", "")

        if msg_type != "event":
            # 消息类
            handler = self._msg_handlers.get(msg_type)
            if handler:
                try:
                    result = handler(xml_data)
                    return result or "success"
                except Exception as e:
                    logger.error(f"处理消息 {msg_type} 失败: {e}", exc_info=True)
            return "success"

        # 事件类
        event = xml_data.findtext("Event", "")
        change_type = xml_data.findtext("ChangeType", "")
        logger.info(
            f"应用回调事件: Event={event}, ChangeType={change_type}, "
            f"CorpId={auth_corpid}"
        )

        # 先尝试匹配 "event.change_type" 格式
        handler = None
        if change_type:
            handler = self._event_handlers.get(f"{event}.{change_type}")
        # 再尝试匹配 event 级别
        if not handler:
            handler = self._event_handlers.get(event)
        if handler:
            try:
                result = handler(xml_data)
                return result or "success"
            except Exception as e:
                logger.error(f"处理事件 {event}.{change_type} 失败: {e}", exc_info=True)
        else:
            logger.warning(f"未注册的事件: {event}.{change_type}")
        return "success"


# ─── 回调路由器 ───

class CallbackRouter:
    """代开发双通道回调路由器

    管理模版回调和应用回调两条通道的加解密与事件分发。

    Usage:
        router = CallbackRouter(
            suite_id="ww4asffe9xxx",
            suite_token="token_for_suite_callback",
            suite_aes_key="aes_key_for_suite_callback",
            app_token="token_for_app_callback",
            app_aes_key="aes_key_for_app_callback",
        )
        router.suite_handler.on("suite_ticket", handle_ticket)
        router.suite_handler.on("create_auth", handle_create_auth)
        router.app_handler.on_event("change_external_contact.add_external_contact", handle_add)
    """

    def __init__(
        self,
        suite_id: str = None,
        suite_token: str = None,
        suite_aes_key: str = None,
        app_token: str = None,
        app_aes_key: str = None,
    ):
        self.suite_id = suite_id or os.environ["WECOM_SUITE_ID"]
        # 模版回调加解密器（receiveid = suite_id）
        self._suite_crypt = WXBizMsgCrypt(
            token=suite_token or os.environ["WECOM_SUITE_CALLBACK_TOKEN"],
            encoding_aes_key=suite_aes_key or os.environ["WECOM_SUITE_ENCODING_AES_KEY"],
            receiver_id=self.suite_id,
        )
        # 应用回调加解密器（receiveid = auth_corpid，动态值）
        self._app_crypt = WXBizMsgCrypt(
            token=app_token or os.environ["WECOM_APP_CALLBACK_TOKEN"],
            encoding_aes_key=app_aes_key or os.environ["WECOM_APP_ENCODING_AES_KEY"],
            receiver_id="",  # receiveid 在解密时动态填充
        )
        # 处理器
        self.suite_handler = SuiteCallbackHandler()
        self.app_handler = AppCallbackHandler()

    def handle_suite_get(self, msg_signature: str, timestamp: str, nonce: str, echostr: str) -> str:
        """处理模版回调 URL 验证（GET 请求）"""
        return self._suite_crypt.verify_and_decrypt(msg_signature, timestamp, nonce, echostr)

    def handle_suite_post(self, msg_signature: str, timestamp: str, nonce: str, body: bytes) -> str:
        """处理模版回调事件推送（POST 请求）"""
        xml_body = ET.fromstring(body)
        encrypt_text = xml_body.findtext("Encrypt", "")
        plaintext = self._suite_crypt.verify_and_decrypt(msg_signature, timestamp, nonce, encrypt_text)
        xml_data = ET.fromstring(plaintext)
        return self.suite_handler.handle(xml_data)

    def handle_app_get(self, msg_signature: str, timestamp: str, nonce: str, echostr: str) -> str:
        """处理应用回调 URL 验证（GET 请求）"""
        return self._app_crypt.verify_and_decrypt(msg_signature, timestamp, nonce, echostr)

    def handle_app_post(self, msg_signature: str, timestamp: str, nonce: str, body: bytes) -> str:
        """处理应用回调事件推送（POST 请求）"""
        xml_body = ET.fromstring(body)
        encrypt_text = xml_body.findtext("Encrypt", "")
        plaintext = self._app_crypt.verify_and_decrypt(msg_signature, timestamp, nonce, encrypt_text)
        xml_data = ET.fromstring(plaintext)
        auth_corpid = xml_data.findtext("ToUserName", "")
        return self.app_handler.handle(xml_data, auth_corpid=auth_corpid)


# ─── Flask 应用示例 ───

def create_callback_app(router: CallbackRouter) -> Flask:
    """创建 Flask 回调服务应用"""
    app = Flask(__name__)

    # 模版回调 URL
    @app.route("/suite/callback", methods=["GET"])
    def suite_verify():
        try:
            plaintext = router.handle_suite_get(
                request.args["msg_signature"],
                request.args["timestamp"],
                request.args["nonce"],
                request.args["echostr"],
            )
            return Response(plaintext, content_type="text/plain")
        except Exception as e:
            logger.error(f"模版回调 URL 验证失败: {e}")
            return "fail", 403

    @app.route("/suite/callback", methods=["POST"])
    def suite_event():
        try:
            result = router.handle_suite_post(
                request.args["msg_signature"],
                request.args["timestamp"],
                request.args["nonce"],
                request.data,
            )
            return result
        except Exception as e:
            logger.error(f"模版回调事件处理失败: {e}", exc_info=True)
            return "success"  # 即使处理失败也返回 "success"，避免重试风暴

    # 应用回调 URL
    @app.route("/app/callback", methods=["GET"])
    def app_verify():
        try:
            plaintext = router.handle_app_get(
                request.args["msg_signature"],
                request.args["timestamp"],
                request.args["nonce"],
                request.args["echostr"],
            )
            return Response(plaintext, content_type="text/plain")
        except Exception as e:
            logger.error(f"应用回调 URL 验证失败: {e}")
            return "fail", 403

    @app.route("/app/callback", methods=["POST"])
    def app_event():
        try:
            result = router.handle_app_post(
                request.args["msg_signature"],
                request.args["timestamp"],
                request.args["nonce"],
                request.data,
            )
            return result
        except Exception as e:
            logger.error(f"应用回调事件处理失败: {e}", exc_info=True)
            return "success"

    return app


# ─── 使用示例 ───

def main():
    """完整使用示例"""
    from wecom_isv_client import WeComISVClient  # 继承自 wecom-isv-core

    isv_client = WeComISVClient()
    router = CallbackRouter()

    # 注册模版回调事件
    def on_suite_ticket(xml_data: ET.Element):
        """处理 suite_ticket 推送 — 最高优先级"""
        ticket = xml_data.findtext("SuiteTicket", "")
        if ticket:
            isv_client.update_suite_ticket(ticket)
            # 建议同时持久化到 Redis/DB
            logger.info("suite_ticket 已更新")

    def on_create_auth(xml_data: ET.Element):
        """处理企业授权成功 — 异步换取永久授权码"""
        auth_code = xml_data.findtext("AuthCode", "")
        state = xml_data.findtext("State", "")
        logger.info(f"收到企业授权: auth_code={auth_code[:8]}..., state={state}")
        # 实际项目中应放入消息队列异步执行
        try:
            result = isv_client.get_permanent_code(auth_code)
            corpid = result["auth_corp_info"]["corpid"]
            logger.info(f"企业 {corpid} 授权成功，permanent_code 已存储")
        except Exception as e:
            logger.error(f"换取永久授权码失败: {e}")

    def on_change_auth(xml_data: ET.Element):
        """处理变更授权"""
        auth_corpid = xml_data.findtext("AuthCorpId", "")
        logger.info(f"企业 {auth_corpid} 变更授权")
        # TODO: 异步调用 get_auth_info 更新授权信息

    def on_cancel_auth(xml_data: ET.Element):
        """处理取消授权"""
        auth_corpid = xml_data.findtext("AuthCorpId", "")
        logger.info(f"企业 {auth_corpid} 取消授权")
        # TODO: 清理企业数据

    def on_reset_permanent_code(xml_data: ET.Element):
        """处理重置永久授权码"""
        auth_corpid = xml_data.findtext("AuthCorpId", "")
        logger.info(f"企业 {auth_corpid} 重置永久授权码")
        # TODO: 调用 get_auth_info 获取新的 permanent_code 并更新数据库

    router.suite_handler.on("suite_ticket", on_suite_ticket)
    router.suite_handler.on("create_auth", on_create_auth)
    router.suite_handler.on("change_auth", on_change_auth)
    router.suite_handler.on("cancel_auth", on_cancel_auth)
    router.suite_handler.on("reset_permanent_code", on_reset_permanent_code)

    # 注册应用回调事件
    def on_text_message(xml_data: ET.Element) -> str:
        """处理文本消息"""
        content = xml_data.findtext("Content", "")
        from_user = xml_data.findtext("FromUserName", "")
        logger.info(f"收到文本消息: from={from_user}, content={content}")
        return "success"

    def on_add_external_contact(xml_data: ET.Element) -> str:
        """处理添加客户事件"""
        userid = xml_data.findtext("UserID", "")
        external_userid = xml_data.findtext("ExternalUserID", "")
        welcome_code = xml_data.findtext("WelcomeCode", "")
        logger.info(f"添加客户: {userid} → {external_userid}")
        if welcome_code:
            # ⚠️ WelcomeCode 有效期仅 20 秒，必须立即使用
            pass  # TODO: 发送欢迎语
        return "success"

    router.app_handler.on_message("text", on_text_message)
    router.app_handler.on_event(
        "change_external_contact.add_external_contact",
        on_add_external_contact,
    )

    # 启动 Flask 服务
    app = create_callback_app(router)
    app.run(host="0.0.0.0", port=5000)


if __name__ == "__main__":
    main()
```

### 7.2 回调路由器 (TypeScript)

```typescript
/** 企业微信代开发回调路由器 — 双通道事件分发 */
import express, { Request, Response } from 'express';
import crypto from 'crypto';

// ─── 加解密工具 ───

class WXBizMsgCrypt {
  private aesKey: Buffer;

  constructor(
    private token: string,
    encodingAesKey: string,
    private receiverId: string,
  ) {
    this.aesKey = Buffer.from(encodingAesKey + '=', 'base64');
  }

  /** 计算签名 */
  verifySignature(timestamp: string, nonce: string, ...args: string[]): string {
    return crypto
      .createHash('sha1')
      .update([this.token, timestamp, nonce, ...args].sort().join(''))
      .digest('hex');
  }

  /** AES-256-CBC 解密 */
  decrypt(encryptText: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.aesKey, this.aesKey.subarray(0, 16));
    decipher.setAutoPadding(false);
    let decrypted = Buffer.concat([decipher.update(encryptText, 'base64'), decipher.final()]);
    const padLen = decrypted[decrypted.length - 1];
    decrypted = decrypted.subarray(0, decrypted.length - padLen);
    const msgLen = decrypted.readUInt32BE(16);
    return decrypted.subarray(20, 20 + msgLen).toString('utf-8');
  }

  /** 验签 + 解密 */
  verifyAndDecrypt(msgSignature: string, timestamp: string, nonce: string, encryptText: string): string {
    const sig = this.verifySignature(timestamp, nonce, encryptText);
    if (sig !== msgSignature) throw new Error('签名验证失败');
    return this.decrypt(encryptText);
  }
}

// ─── 简易 XML 解析器 ───

function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/gs;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

// ─── 事件处理器类型 ───

type SuiteEventHandler = (data: Record<string, string>) => void | Promise<void>;
type AppEventHandler = (data: Record<string, string>) => string | void | Promise<string | void>;

// ─── 模版回调处理器 ───

class SuiteCallbackHandler {
  private handlers = new Map<string, SuiteEventHandler>();

  /** 注册 InfoType 事件处理函数 */
  on(infoType: string, handler: SuiteEventHandler): this {
    this.handlers.set(infoType, handler);
    return this;
  }

  async handle(data: Record<string, string>): Promise<string> {
    const infoType = data.InfoType ?? '';
    const handler = this.handlers.get(infoType);
    if (handler) {
      try {
        await handler(data);
      } catch (err) {
        console.error(`处理 ${infoType} 事件失败:`, err);
      }
    } else {
      console.warn(`未注册的 InfoType: ${infoType}`);
    }
    return 'success';
  }
}

// ─── 应用回调处理器 ───

class AppCallbackHandler {
  private msgHandlers = new Map<string, AppEventHandler>();
  private eventHandlers = new Map<string, AppEventHandler>();

  /** 注册消息类型处理函数 */
  onMessage(msgType: string, handler: AppEventHandler): this {
    this.msgHandlers.set(msgType, handler);
    return this;
  }

  /** 注册事件类型处理函数（支持 "event.changeType" 格式） */
  onEvent(eventType: string, handler: AppEventHandler): this {
    this.eventHandlers.set(eventType, handler);
    return this;
  }

  async handle(data: Record<string, string>): Promise<string> {
    const msgType = data.MsgType ?? '';

    if (msgType !== 'event') {
      const handler = this.msgHandlers.get(msgType);
      if (handler) {
        try {
          const result = await handler(data);
          return result ?? 'success';
        } catch (err) {
          console.error(`处理消息 ${msgType} 失败:`, err);
        }
      }
      return 'success';
    }

    const event = data.Event ?? '';
    const changeType = data.ChangeType ?? '';

    // 先尝试 "event.changeType" 格式
    let handler = changeType ? this.eventHandlers.get(`${event}.${changeType}`) : undefined;
    if (!handler) handler = this.eventHandlers.get(event);

    if (handler) {
      try {
        const result = await handler(data);
        return result ?? 'success';
      } catch (err) {
        console.error(`处理事件 ${event}.${changeType} 失败:`, err);
      }
    }
    return 'success';
  }
}

// ─── 回调路由器 ───

export class CallbackRouter {
  private suiteCrypt: WXBizMsgCrypt;
  private appCrypt: WXBizMsgCrypt;
  public suiteHandler = new SuiteCallbackHandler();
  public appHandler = new AppCallbackHandler();

  constructor(opts: {
    suiteId?: string;
    suiteToken?: string;
    suiteAesKey?: string;
    appToken?: string;
    appAesKey?: string;
  } = {}) {
    const suiteId = opts.suiteId ?? process.env.WECOM_SUITE_ID!;
    this.suiteCrypt = new WXBizMsgCrypt(
      opts.suiteToken ?? process.env.WECOM_SUITE_CALLBACK_TOKEN!,
      opts.suiteAesKey ?? process.env.WECOM_SUITE_ENCODING_AES_KEY!,
      suiteId,
    );
    this.appCrypt = new WXBizMsgCrypt(
      opts.appToken ?? process.env.WECOM_APP_CALLBACK_TOKEN!,
      opts.appAesKey ?? process.env.WECOM_APP_ENCODING_AES_KEY!,
      '', // receiverId 在解密时动态确定
    );
  }

  /** 处理模版回调 URL 验证（GET） */
  handleSuiteGet(msgSig: string, ts: string, nonce: string, echostr: string): string {
    return this.suiteCrypt.verifyAndDecrypt(msgSig, ts, nonce, echostr);
  }

  /** 处理模版回调事件推送（POST） */
  async handleSuitePost(msgSig: string, ts: string, nonce: string, body: string): Promise<string> {
    const bodyData = parseXml(body);
    const plaintext = this.suiteCrypt.verifyAndDecrypt(msgSig, ts, nonce, bodyData.Encrypt);
    const data = parseXml(plaintext);
    return this.suiteHandler.handle(data);
  }

  /** 处理应用回调 URL 验证（GET） */
  handleAppGet(msgSig: string, ts: string, nonce: string, echostr: string): string {
    return this.appCrypt.verifyAndDecrypt(msgSig, ts, nonce, echostr);
  }

  /** 处理应用回调事件推送（POST） */
  async handleAppPost(msgSig: string, ts: string, nonce: string, body: string): Promise<string> {
    const bodyData = parseXml(body);
    const plaintext = this.appCrypt.verifyAndDecrypt(msgSig, ts, nonce, bodyData.Encrypt);
    const data = parseXml(plaintext);
    return this.appHandler.handle(data);
  }
}

// ─── Express 应用示例 ───

export function createCallbackApp(router: CallbackRouter): express.Express {
  const app = express();
  app.use(express.raw({ type: '*/*' }));

  // 模版回调 URL
  app.get('/suite/callback', (req: Request, res: Response) => {
    try {
      const { msg_signature, timestamp, nonce, echostr } = req.query as Record<string, string>;
      const plaintext = router.handleSuiteGet(msg_signature, timestamp, nonce, echostr);
      res.type('text/plain').send(plaintext);
    } catch (err) {
      console.error('模版回调 URL 验证失败:', err);
      res.status(403).send('fail');
    }
  });

  app.post('/suite/callback', async (req: Request, res: Response) => {
    try {
      const { msg_signature, timestamp, nonce } = req.query as Record<string, string>;
      const result = await router.handleSuitePost(msg_signature, timestamp, nonce, req.body.toString());
      res.send(result);
    } catch (err) {
      console.error('模版回调事件处理失败:', err);
      res.send('success');
    }
  });

  // 应用回调 URL
  app.get('/app/callback', (req: Request, res: Response) => {
    try {
      const { msg_signature, timestamp, nonce, echostr } = req.query as Record<string, string>;
      const plaintext = router.handleAppGet(msg_signature, timestamp, nonce, echostr);
      res.type('text/plain').send(plaintext);
    } catch (err) {
      console.error('应用回调 URL 验证失败:', err);
      res.status(403).send('fail');
    }
  });

  app.post('/app/callback', async (req: Request, res: Response) => {
    try {
      const { msg_signature, timestamp, nonce } = req.query as Record<string, string>;
      const result = await router.handleAppPost(msg_signature, timestamp, nonce, req.body.toString());
      res.send(result);
    } catch (err) {
      console.error('应用回调事件处理失败:', err);
      res.send('success');
    }
  });

  return app;
}
```

### 7.3 回调路由器 (Go)

```go
package wecom

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha1"
	"encoding/base64"
	"encoding/binary"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"
)

// ─── 加解密工具 ───

// WXBizMsgCrypt 企业微信消息加解密工具
type WXBizMsgCrypt struct {
	token      string
	aesKey     []byte
	receiverID string
}

// NewWXBizMsgCrypt 创建加解密实例
func NewWXBizMsgCrypt(token, encodingAESKey, receiverID string) *WXBizMsgCrypt {
	aesKey, _ := base64.StdEncoding.DecodeString(encodingAESKey + "=")
	return &WXBizMsgCrypt{
		token:      token,
		aesKey:     aesKey,
		receiverID: receiverID,
	}
}

// VerifySignature 计算签名
func (c *WXBizMsgCrypt) VerifySignature(timestamp, nonce string, args ...string) string {
	arr := append([]string{c.token, timestamp, nonce}, args...)
	sort.Strings(arr)
	h := sha1.New()
	h.Write([]byte(strings.Join(arr, "")))
	return fmt.Sprintf("%x", h.Sum(nil))
}

// Decrypt AES-256-CBC 解密
func (c *WXBizMsgCrypt) Decrypt(encryptText string) (string, error) {
	cipherData, err := base64.StdEncoding.DecodeString(encryptText)
	if err != nil {
		return "", fmt.Errorf("base64 解码失败: %w", err)
	}
	block, err := aes.NewCipher(c.aesKey)
	if err != nil {
		return "", fmt.Errorf("创建 AES cipher 失败: %w", err)
	}
	mode := cipher.NewCBCDecrypter(block, c.aesKey[:16])
	mode.CryptBlocks(cipherData, cipherData)
	// PKCS#7 去 padding
	padLen := int(cipherData[len(cipherData)-1])
	if padLen > aes.BlockSize || padLen == 0 {
		return "", fmt.Errorf("无效的 PKCS#7 padding")
	}
	cipherData = cipherData[:len(cipherData)-padLen]
	// random(16) + msg_len(4) + msg + receiveid
	msgLen := binary.BigEndian.Uint32(cipherData[16:20])
	msg := string(cipherData[20 : 20+msgLen])
	return msg, nil
}

// VerifyAndDecrypt 验签 + 解密
func (c *WXBizMsgCrypt) VerifyAndDecrypt(msgSignature, timestamp, nonce, encryptText string) (string, error) {
	sig := c.VerifySignature(timestamp, nonce, encryptText)
	if sig != msgSignature {
		return "", fmt.Errorf("签名验证失败: expected=%s, got=%s", msgSignature, sig)
	}
	return c.Decrypt(encryptText)
}

// ─── XML 结构体 ───

// CallbackXMLBody 回调 POST Body
type CallbackXMLBody struct {
	XMLName    xml.Name `xml:"xml"`
	ToUserName string   `xml:"ToUserName"`
	Encrypt    string   `xml:"Encrypt"`
	AgentID    string   `xml:"AgentID"`
}

// SuiteCallbackData 模版回调事件数据
type SuiteCallbackData struct {
	XMLName   xml.Name `xml:"xml"`
	SuiteID   string   `xml:"SuiteId"`
	InfoType  string   `xml:"InfoType"`
	TimeStamp int64    `xml:"TimeStamp"`

	// suite_ticket
	SuiteTicket string `xml:"SuiteTicket,omitempty"`
	// create_auth
	AuthCode string `xml:"AuthCode,omitempty"`
	State    string `xml:"State,omitempty"`
	// change_auth / cancel_auth / reset_permanent_code
	AuthCorpID string `xml:"AuthCorpId,omitempty"`
	// change_contact
	ChangeType string `xml:"ChangeType,omitempty"`
	UserID     string `xml:"UserID,omitempty"`
}

// AppCallbackData 应用回调事件数据
type AppCallbackData struct {
	XMLName    xml.Name `xml:"xml"`
	ToUserName string   `xml:"ToUserName"`
	FromUser   string   `xml:"FromUserName"`
	CreateTime int64    `xml:"CreateTime"`
	MsgType    string   `xml:"MsgType"`
	Content    string   `xml:"Content,omitempty"`
	MsgID      int64    `xml:"MsgId,omitempty"`
	AgentID    int      `xml:"AgentID,omitempty"`

	// 事件类
	Event      string `xml:"Event,omitempty"`
	EventKey   string `xml:"EventKey,omitempty"`
	ChangeType string `xml:"ChangeType,omitempty"`

	// 客户联系
	UserID         string `xml:"UserID,omitempty"`
	ExternalUserID string `xml:"ExternalUserID,omitempty"`
	WelcomeCode    string `xml:"WelcomeCode,omitempty"`
	Source         string `xml:"Source,omitempty"`
	FailReason     string `xml:"FailReason,omitempty"`
}

// ─── 事件处理函数类型 ───

// SuiteEventHandler 模版回调事件处理函数
type SuiteEventHandler func(data *SuiteCallbackData)

// AppEventHandler 应用回调事件处理函数，返回响应内容
type AppEventHandler func(data *AppCallbackData) string

// ─── 模版回调处理器 ───

// SuiteCallbackHandler 模版回调事件处理器
type SuiteCallbackHandler struct {
	handlers map[string]SuiteEventHandler
}

// NewSuiteCallbackHandler 创建模版回调处理器
func NewSuiteCallbackHandler() *SuiteCallbackHandler {
	return &SuiteCallbackHandler{handlers: make(map[string]SuiteEventHandler)}
}

// On 注册 InfoType 事件处理函数
func (h *SuiteCallbackHandler) On(infoType string, handler SuiteEventHandler) {
	h.handlers[infoType] = handler
}

// Handle 处理模版回调事件
func (h *SuiteCallbackHandler) Handle(data *SuiteCallbackData) string {
	handler, ok := h.handlers[data.InfoType]
	if ok {
		handler(data)
	} else {
		log.Printf("未注册的 InfoType: %s", data.InfoType)
	}
	return "success"
}

// ─── 应用回调处理器 ───

// AppCallbackHandler 应用回调事件处理器
type AppCallbackHandler struct {
	msgHandlers   map[string]AppEventHandler
	eventHandlers map[string]AppEventHandler
}

// NewAppCallbackHandler 创建应用回调处理器
func NewAppCallbackHandler() *AppCallbackHandler {
	return &AppCallbackHandler{
		msgHandlers:   make(map[string]AppEventHandler),
		eventHandlers: make(map[string]AppEventHandler),
	}
}

// OnMessage 注册消息处理函数
func (h *AppCallbackHandler) OnMessage(msgType string, handler AppEventHandler) {
	h.msgHandlers[msgType] = handler
}

// OnEvent 注册事件处理函数（支持 "event.changeType" 格式）
func (h *AppCallbackHandler) OnEvent(eventType string, handler AppEventHandler) {
	h.eventHandlers[eventType] = handler
}

// Handle 处理应用回调事件
func (h *AppCallbackHandler) Handle(data *AppCallbackData) string {
	if data.MsgType != "event" {
		if handler, ok := h.msgHandlers[data.MsgType]; ok {
			return handler(data)
		}
		return "success"
	}
	// 先尝试 "event.changeType" 格式
	if data.ChangeType != "" {
		key := data.Event + "." + data.ChangeType
		if handler, ok := h.eventHandlers[key]; ok {
			return handler(data)
		}
	}
	// 再尝试 event 级别
	if handler, ok := h.eventHandlers[data.Event]; ok {
		return handler(data)
	}
	log.Printf("未注册的事件: %s.%s", data.Event, data.ChangeType)
	return "success"
}

// ─── 回调路由器 ───

// CallbackRouter 代开发双通道回调路由器
type CallbackRouter struct {
	suiteCrypt   *WXBizMsgCrypt
	appCrypt     *WXBizMsgCrypt
	SuiteHandler *SuiteCallbackHandler
	AppHandler   *AppCallbackHandler
}

// NewCallbackRouter 创建回调路由器
func NewCallbackRouter(suiteID, suiteToken, suiteAESKey, appToken, appAESKey string) *CallbackRouter {
	return &CallbackRouter{
		suiteCrypt:   NewWXBizMsgCrypt(suiteToken, suiteAESKey, suiteID),
		appCrypt:     NewWXBizMsgCrypt(appToken, appAESKey, ""),
		SuiteHandler: NewSuiteCallbackHandler(),
		AppHandler:   NewAppCallbackHandler(),
	}
}

// HandleSuiteGET 处理模版回调 URL 验证
func (r *CallbackRouter) HandleSuiteGET(msgSig, ts, nonce, echostr string) (string, error) {
	return r.suiteCrypt.VerifyAndDecrypt(msgSig, ts, nonce, echostr)
}

// HandleSuitePOST 处理模版回调事件推送
func (r *CallbackRouter) HandleSuitePOST(msgSig, ts, nonce string, body []byte) (string, error) {
	var xmlBody CallbackXMLBody
	if err := xml.Unmarshal(body, &xmlBody); err != nil {
		return "", fmt.Errorf("XML 解析失败: %w", err)
	}
	plaintext, err := r.suiteCrypt.VerifyAndDecrypt(msgSig, ts, nonce, xmlBody.Encrypt)
	if err != nil {
		return "", err
	}
	var data SuiteCallbackData
	if err := xml.Unmarshal([]byte(plaintext), &data); err != nil {
		return "", fmt.Errorf("事件 XML 解析失败: %w", err)
	}
	return r.SuiteHandler.Handle(&data), nil
}

// HandleAppGET 处理应用回调 URL 验证
func (r *CallbackRouter) HandleAppGET(msgSig, ts, nonce, echostr string) (string, error) {
	return r.appCrypt.VerifyAndDecrypt(msgSig, ts, nonce, echostr)
}

// HandleAppPOST 处理应用回调事件推送
func (r *CallbackRouter) HandleAppPOST(msgSig, ts, nonce string, body []byte) (string, error) {
	var xmlBody CallbackXMLBody
	if err := xml.Unmarshal(body, &xmlBody); err != nil {
		return "", fmt.Errorf("XML 解析失败: %w", err)
	}
	plaintext, err := r.appCrypt.VerifyAndDecrypt(msgSig, ts, nonce, xmlBody.Encrypt)
	if err != nil {
		return "", err
	}
	var data AppCallbackData
	if err := xml.Unmarshal([]byte(plaintext), &data); err != nil {
		return "", fmt.Errorf("事件 XML 解析失败: %w", err)
	}
	return r.AppHandler.Handle(&data), nil
}

// RegisterHTTPHandlers 注册 HTTP 路由
func (r *CallbackRouter) RegisterHTTPHandlers(mux *http.ServeMux) {
	// 模版回调 URL
	mux.HandleFunc("/suite/callback", func(w http.ResponseWriter, req *http.Request) {
		q := req.URL.Query()
		msgSig := q.Get("msg_signature")
		ts := q.Get("timestamp")
		nonce := q.Get("nonce")

		if req.Method == http.MethodGet {
			echostr := q.Get("echostr")
			plaintext, err := r.HandleSuiteGET(msgSig, ts, nonce, echostr)
			if err != nil {
				log.Printf("模版回调 URL 验证失败: %v", err)
				http.Error(w, "fail", http.StatusForbidden)
				return
			}
			w.Header().Set("Content-Type", "text/plain")
			fmt.Fprint(w, plaintext)
			return
		}

		body, _ := io.ReadAll(req.Body)
		result, err := r.HandleSuitePOST(msgSig, ts, nonce, body)
		if err != nil {
			log.Printf("模版回调事件处理失败: %v", err)
			fmt.Fprint(w, "success")
			return
		}
		fmt.Fprint(w, result)
	})

	// 应用回调 URL
	mux.HandleFunc("/app/callback", func(w http.ResponseWriter, req *http.Request) {
		q := req.URL.Query()
		msgSig := q.Get("msg_signature")
		ts := q.Get("timestamp")
		nonce := q.Get("nonce")

		if req.Method == http.MethodGet {
			echostr := q.Get("echostr")
			plaintext, err := r.HandleAppGET(msgSig, ts, nonce, echostr)
			if err != nil {
				log.Printf("应用回调 URL 验证失败: %v", err)
				http.Error(w, "fail", http.StatusForbidden)
				return
			}
			w.Header().Set("Content-Type", "text/plain")
			fmt.Fprint(w, plaintext)
			return
		}

		body, _ := io.ReadAll(req.Body)
		result, err := r.HandleAppPOST(msgSig, ts, nonce, body)
		if err != nil {
			log.Printf("应用回调事件处理失败: %v", err)
			fmt.Fprint(w, "success")
			return
		}
		fmt.Fprint(w, result)
	})
}
```

### 7.4 回调路由器 (Java)

```java
package com.wecom.isv.callback;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.w3c.dom.*;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;

// ─── 加解密工具 ───

/**
 * 企业微信消息加解密工具
 * AES-256-CBC + PKCS#7 padding + SHA1 签名校验
 */
class WXBizMsgCrypt {

    private final String token;
    private final byte[] aesKey;
    private final String receiverId;

    public WXBizMsgCrypt(String token, String encodingAesKey, String receiverId) {
        this.token = token;
        this.receiverId = receiverId;
        this.aesKey = Base64.getDecoder().decode(encodingAesKey + "=");
    }

    /** 计算签名 */
    public String verifySignature(String timestamp, String nonce, String... args) {
        List<String> arr = new ArrayList<>();
        arr.add(token);
        arr.add(timestamp);
        arr.add(nonce);
        arr.addAll(Arrays.asList(args));
        Collections.sort(arr);
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            sha1.update(String.join("", arr).getBytes(StandardCharsets.UTF_8));
            byte[] digest = sha1.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-1 签名计算失败", e);
        }
    }

    /** AES-256-CBC 解密 */
    public String decrypt(String encryptText) {
        try {
            byte[] cipherData = Base64.getDecoder().decode(encryptText);
            Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
            SecretKeySpec keySpec = new SecretKeySpec(aesKey, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(aesKey, 0, 16);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decrypted = cipher.doFinal(cipherData);
            // PKCS#7 去 padding
            int padLen = decrypted[decrypted.length - 1] & 0xFF;
            if (padLen < 1 || padLen > 32) {
                throw new RuntimeException("无效的 PKCS#7 padding");
            }
            // random(16) + msg_len(4) + msg + receiveid
            int msgLen = ByteBuffer.wrap(decrypted, 16, 4).getInt();
            return new String(decrypted, 20, msgLen, StandardCharsets.UTF_8);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("AES 解密失败", e);
        }
    }

    /** 验签 + 解密 */
    public String verifyAndDecrypt(String msgSignature, String timestamp, String nonce, String encryptText) {
        String sig = verifySignature(timestamp, nonce, encryptText);
        if (!sig.equals(msgSignature)) {
            throw new RuntimeException("签名验证失败: expected=" + msgSignature + ", got=" + sig);
        }
        return decrypt(encryptText);
    }
}

// ─── XML 解析工具 ───

class XmlUtil {
    /** 解析 XML 字符串为 Map */
    static Map<String, String> parse(String xml) {
        try {
            Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
            doc.getDocumentElement().normalize();
            Map<String, String> result = new LinkedHashMap<>();
            NodeList nodes = doc.getDocumentElement().getChildNodes();
            for (int i = 0; i < nodes.getLength(); i++) {
                Node node = nodes.item(i);
                if (node.getNodeType() == Node.ELEMENT_NODE) {
                    result.put(node.getNodeName(), node.getTextContent());
                }
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("XML 解析失败", e);
        }
    }

    /** 解析 XML 字节数组为 Map */
    static Map<String, String> parse(byte[] xmlBytes) {
        return parse(new String(xmlBytes, StandardCharsets.UTF_8));
    }
}

// ─── 模版回调处理器 ───

/**
 * 模版回调事件处理器
 * 处理 suite_ticket、create_auth、change_auth、cancel_auth 等 InfoType 事件
 */
class SuiteCallbackHandler {

    private static final Logger logger = Logger.getLogger(SuiteCallbackHandler.class.getName());
    private final Map<String, Consumer<Map<String, String>>> handlers = new ConcurrentHashMap<>();

    /** 注册 InfoType 事件处理函数 */
    public SuiteCallbackHandler on(String infoType, Consumer<Map<String, String>> handler) {
        handlers.put(infoType, handler);
        return this;
    }

    /** 处理模版回调事件，始终返回 "success" */
    public String handle(Map<String, String> data) {
        String infoType = data.getOrDefault("InfoType", "");
        logger.info("模版回调事件: InfoType=" + infoType);
        Consumer<Map<String, String>> handler = handlers.get(infoType);
        if (handler != null) {
            try {
                handler.accept(data);
            } catch (Exception e) {
                logger.log(Level.SEVERE, "处理 " + infoType + " 事件失败", e);
            }
        } else {
            logger.warning("未注册的 InfoType: " + infoType);
        }
        return "success";
    }
}

// ─── 应用回调处理器 ───

/**
 * 应用回调事件处理器
 * 处理消息（text/image 等）和事件（change_external_contact 等）
 * 支持 "event.changeType" 格式注册子事件
 */
class AppCallbackHandler {

    private static final Logger logger = Logger.getLogger(AppCallbackHandler.class.getName());
    private final Map<String, Function<Map<String, String>, String>> msgHandlers = new ConcurrentHashMap<>();
    private final Map<String, Function<Map<String, String>, String>> eventHandlers = new ConcurrentHashMap<>();

    /** 注册消息类型处理函数 */
    public AppCallbackHandler onMessage(String msgType, Function<Map<String, String>, String> handler) {
        msgHandlers.put(msgType, handler);
        return this;
    }

    /** 注册事件类型处理函数（支持 "event.changeType" 格式） */
    public AppCallbackHandler onEvent(String eventType, Function<Map<String, String>, String> handler) {
        eventHandlers.put(eventType, handler);
        return this;
    }

    /** 处理应用回调事件 */
    public String handle(Map<String, String> data) {
        String msgType = data.getOrDefault("MsgType", "");

        if (!"event".equals(msgType)) {
            Function<Map<String, String>, String> handler = msgHandlers.get(msgType);
            if (handler != null) {
                try {
                    String result = handler.apply(data);
                    return result != null ? result : "success";
                } catch (Exception e) {
                    logger.log(Level.SEVERE, "处理消息 " + msgType + " 失败", e);
                }
            }
            return "success";
        }

        String event = data.getOrDefault("Event", "");
        String changeType = data.getOrDefault("ChangeType", "");
        logger.info("应用回调事件: Event=" + event + ", ChangeType=" + changeType);

        // 先尝试 "event.changeType" 格式
        Function<Map<String, String>, String> handler = null;
        if (!changeType.isEmpty()) {
            handler = eventHandlers.get(event + "." + changeType);
        }
        // 再尝试 event 级别
        if (handler == null) {
            handler = eventHandlers.get(event);
        }
        if (handler != null) {
            try {
                String result = handler.apply(data);
                return result != null ? result : "success";
            } catch (Exception e) {
                logger.log(Level.SEVERE, "处理事件 " + event + "." + changeType + " 失败", e);
            }
        } else {
            logger.warning("未注册的事件: " + event + "." + changeType);
        }
        return "success";
    }
}

// ─── 回调路由器 ───

/**
 * 代开发双通道回调路由器
 *
 * <p>管理模版回调和应用回调两条通道的加解密与事件分发。</p>
 *
 * <pre>
 * CallbackRouter router = new CallbackRouter(
 *     "ww4asffe9xxx",
 *     "token_for_suite_callback", "aes_key_for_suite_callback",
 *     "token_for_app_callback", "aes_key_for_app_callback"
 * );
 * router.getSuiteHandler().on("suite_ticket", data -> handleTicket(data));
 * router.getSuiteHandler().on("create_auth", data -> handleCreateAuth(data));
 * router.getAppHandler().onEvent("change_external_contact.add_external_contact", data -> handleAdd(data));
 * </pre>
 */
public class CallbackRouter {

    private static final Logger logger = Logger.getLogger(CallbackRouter.class.getName());

    private final WXBizMsgCrypt suiteCrypt;
    private final WXBizMsgCrypt appCrypt;
    private final SuiteCallbackHandler suiteHandler = new SuiteCallbackHandler();
    private final AppCallbackHandler appHandler = new AppCallbackHandler();

    public CallbackRouter(
            String suiteId,
            String suiteToken, String suiteAesKey,
            String appToken, String appAesKey) {
        this.suiteCrypt = new WXBizMsgCrypt(suiteToken, suiteAesKey, suiteId);
        this.appCrypt = new WXBizMsgCrypt(appToken, appAesKey, "");
    }

    /** 从环境变量创建 */
    public static CallbackRouter fromEnv() {
        return new CallbackRouter(
            System.getenv("WECOM_SUITE_ID"),
            System.getenv("WECOM_SUITE_CALLBACK_TOKEN"),
            System.getenv("WECOM_SUITE_ENCODING_AES_KEY"),
            System.getenv("WECOM_APP_CALLBACK_TOKEN"),
            System.getenv("WECOM_APP_ENCODING_AES_KEY")
        );
    }

    public SuiteCallbackHandler getSuiteHandler() { return suiteHandler; }
    public AppCallbackHandler getAppHandler() { return appHandler; }

    /** 处理模版回调 URL 验证（GET 请求） */
    public String handleSuiteGet(String msgSig, String ts, String nonce, String echostr) {
        return suiteCrypt.verifyAndDecrypt(msgSig, ts, nonce, echostr);
    }

    /** 处理模版回调事件推送（POST 请求） */
    public String handleSuitePost(String msgSig, String ts, String nonce, byte[] body) {
        Map<String, String> xmlBody = XmlUtil.parse(body);
        String encryptText = xmlBody.getOrDefault("Encrypt", "");
        String plaintext = suiteCrypt.verifyAndDecrypt(msgSig, ts, nonce, encryptText);
        Map<String, String> data = XmlUtil.parse(plaintext);
        return suiteHandler.handle(data);
    }

    /** 处理应用回调 URL 验证（GET 请求） */
    public String handleAppGet(String msgSig, String ts, String nonce, String echostr) {
        return appCrypt.verifyAndDecrypt(msgSig, ts, nonce, echostr);
    }

    /** 处理应用回调事件推送（POST 请求） */
    public String handleAppPost(String msgSig, String ts, String nonce, byte[] body) {
        Map<String, String> xmlBody = XmlUtil.parse(body);
        String encryptText = xmlBody.getOrDefault("Encrypt", "");
        String plaintext = appCrypt.verifyAndDecrypt(msgSig, ts, nonce, encryptText);
        Map<String, String> data = XmlUtil.parse(plaintext);
        return appHandler.handle(data);
    }

    // ─── Servlet 接入示例 ───

    /**
     * 处理模版回调 Servlet 请求
     *
     * <p>在 Spring Boot 中使用：</p>
     * <pre>
     * &#64;RestController
     * public class SuiteCallbackController {
     *     private final CallbackRouter router;
     *
     *     &#64;GetMapping("/suite/callback")
     *     public ResponseEntity&lt;String&gt; verify(
     *             &#64;RequestParam("msg_signature") String msgSig,
     *             &#64;RequestParam String timestamp,
     *             &#64;RequestParam String nonce,
     *             &#64;RequestParam String echostr) {
     *         String plain = router.handleSuiteGet(msgSig, timestamp, nonce, echostr);
     *         return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(plain);
     *     }
     *
     *     &#64;PostMapping("/suite/callback")
     *     public String event(
     *             &#64;RequestParam("msg_signature") String msgSig,
     *             &#64;RequestParam String timestamp,
     *             &#64;RequestParam String nonce,
     *             &#64;RequestBody byte[] body) {
     *         return router.handleSuitePost(msgSig, timestamp, nonce, body);
     *     }
     * }
     * </pre>
     */
    public void handleSuiteServlet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String msgSig = req.getParameter("msg_signature");
        String ts = req.getParameter("timestamp");
        String nonce = req.getParameter("nonce");

        if ("GET".equalsIgnoreCase(req.getMethod())) {
            String echostr = req.getParameter("echostr");
            try {
                String plaintext = handleSuiteGet(msgSig, ts, nonce, echostr);
                resp.setContentType("text/plain");
                resp.getWriter().write(plaintext);
            } catch (Exception e) {
                logger.log(Level.SEVERE, "模版回调 URL 验证失败", e);
                resp.sendError(403, "fail");
            }
            return;
        }

        // POST
        byte[] body = req.getInputStream().readAllBytes();
        try {
            String result = handleSuitePost(msgSig, ts, nonce, body);
            resp.getWriter().write(result);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "模版回调事件处理失败", e);
            resp.getWriter().write("success"); // 即使处理失败也返回 "success"，避免重试风暴
        }
    }

    /** 处理应用回调 Servlet 请求 */
    public void handleAppServlet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String msgSig = req.getParameter("msg_signature");
        String ts = req.getParameter("timestamp");
        String nonce = req.getParameter("nonce");

        if ("GET".equalsIgnoreCase(req.getMethod())) {
            String echostr = req.getParameter("echostr");
            try {
                String plaintext = handleAppGet(msgSig, ts, nonce, echostr);
                resp.setContentType("text/plain");
                resp.getWriter().write(plaintext);
            } catch (Exception e) {
                logger.log(Level.SEVERE, "应用回调 URL 验证失败", e);
                resp.sendError(403, "fail");
            }
            return;
        }

        // POST
        byte[] body = req.getInputStream().readAllBytes();
        try {
            String result = handleAppPost(msgSig, ts, nonce, body);
            resp.getWriter().write(result);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "应用回调事件处理失败", e);
            resp.getWriter().write("success");
        }
    }
}
```

### 7.5 回调路由器 (PHP)

```php
<?php
/**
 * 企业微信代开发回调路由器 — 双通道事件分发
 *
 * 需要 PHP >= 7.4, ext-openssl, ext-simplexml
 */

namespace WeComISV\Callback;

// ─── 加解密工具 ───

/**
 * 企业微信消息加解密工具
 * AES-256-CBC + PKCS#7 padding + SHA1 签名校验
 */
class WXBizMsgCrypt
{
    private string $token;
    private string $aesKey;
    private string $receiverId;

    public function __construct(string $token, string $encodingAesKey, string $receiverId)
    {
        $this->token = $token;
        $this->receiverId = $receiverId;
        $this->aesKey = base64_decode($encodingAesKey . '=');
    }

    /** 计算签名 */
    public function verifySignature(string $timestamp, string $nonce, string ...$args): string
    {
        $arr = array_merge([$this->token, $timestamp, $nonce], $args);
        sort($arr, SORT_STRING);
        return sha1(implode('', $arr));
    }

    /** AES-256-CBC 解密 */
    public function decrypt(string $encryptText): string
    {
        $cipherData = base64_decode($encryptText);
        $iv = substr($this->aesKey, 0, 16);
        $decrypted = openssl_decrypt($cipherData, 'aes-256-cbc', $this->aesKey, OPENSSL_RAW_DATA | OPENSSL_NO_PADDING, $iv);
        if ($decrypted === false) {
            throw new \RuntimeException('AES 解密失败: ' . openssl_error_string());
        }
        // PKCS#7 去 padding
        $padLen = ord($decrypted[strlen($decrypted) - 1]);
        $decrypted = substr($decrypted, 0, -$padLen);
        // random(16) + msg_len(4) + msg + receiveid
        $msgLen = unpack('N', substr($decrypted, 16, 4))[1];
        return substr($decrypted, 20, $msgLen);
    }

    /** 验签 + 解密 */
    public function verifyAndDecrypt(string $msgSignature, string $timestamp, string $nonce, string $encryptText): string
    {
        $sig = $this->verifySignature($timestamp, $nonce, $encryptText);
        if ($sig !== $msgSignature) {
            throw new \RuntimeException("签名验证失败: expected={$msgSignature}, got={$sig}");
        }
        return $this->decrypt($encryptText);
    }
}

// ─── XML 解析工具 ───

class XmlUtil
{
    /** 解析 XML 字符串为关联数组 */
    public static function parse(string $xml): array
    {
        // 防止 XXE 攻击
        $prev = libxml_disable_entity_loader(true);
        $obj = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        libxml_disable_entity_loader($prev);
        if ($obj === false) {
            throw new \RuntimeException('XML 解析失败');
        }
        $result = [];
        foreach ($obj->children() as $key => $value) {
            $result[$key] = (string) $value;
        }
        return $result;
    }
}

// ─── 模版回调处理器 ───

/**
 * 模版回调事件处理器
 * 处理 suite_ticket、create_auth、change_auth、cancel_auth 等 InfoType 事件
 */
class SuiteCallbackHandler
{
    /** @var array<string, callable(array): void> */
    private array $handlers = [];

    /** 注册 InfoType 事件处理函数 */
    public function on(string $infoType, callable $handler): self
    {
        $this->handlers[$infoType] = $handler;
        return $this;
    }

    /** 处理模版回调事件，始终返回 "success" */
    public function handle(array $data): string
    {
        $infoType = $data['InfoType'] ?? '';
        error_log("[SuiteCallback] InfoType={$infoType}");
        if (isset($this->handlers[$infoType])) {
            try {
                ($this->handlers[$infoType])($data);
            } catch (\Throwable $e) {
                error_log("[SuiteCallback] 处理 {$infoType} 事件失败: " . $e->getMessage());
            }
        } else {
            error_log("[SuiteCallback] 未注册的 InfoType: {$infoType}");
        }
        return 'success';
    }
}

// ─── 应用回调处理器 ───

/**
 * 应用回调事件处理器
 * 处理消息（text/image 等）和事件（change_external_contact 等）
 * 支持 "event.changeType" 格式注册子事件
 */
class AppCallbackHandler
{
    /** @var array<string, callable(array): ?string> */
    private array $msgHandlers = [];
    /** @var array<string, callable(array): ?string> */
    private array $eventHandlers = [];

    /** 注册消息类型处理函数 */
    public function onMessage(string $msgType, callable $handler): self
    {
        $this->msgHandlers[$msgType] = $handler;
        return $this;
    }

    /** 注册事件类型处理函数（支持 "event.changeType" 格式） */
    public function onEvent(string $eventType, callable $handler): self
    {
        $this->eventHandlers[$eventType] = $handler;
        return $this;
    }

    /** 处理应用回调事件 */
    public function handle(array $data): string
    {
        $msgType = $data['MsgType'] ?? '';

        if ($msgType !== 'event') {
            if (isset($this->msgHandlers[$msgType])) {
                try {
                    $result = ($this->msgHandlers[$msgType])($data);
                    return $result ?? 'success';
                } catch (\Throwable $e) {
                    error_log("[AppCallback] 处理消息 {$msgType} 失败: " . $e->getMessage());
                }
            }
            return 'success';
        }

        $event = $data['Event'] ?? '';
        $changeType = $data['ChangeType'] ?? '';
        error_log("[AppCallback] Event={$event}, ChangeType={$changeType}");

        // 先尝试 "event.changeType" 格式
        $handler = null;
        if ($changeType !== '') {
            $handler = $this->eventHandlers["{$event}.{$changeType}"] ?? null;
        }
        // 再尝试 event 级别
        if ($handler === null) {
            $handler = $this->eventHandlers[$event] ?? null;
        }
        if ($handler !== null) {
            try {
                $result = $handler($data);
                return $result ?? 'success';
            } catch (\Throwable $e) {
                error_log("[AppCallback] 处理事件 {$event}.{$changeType} 失败: " . $e->getMessage());
            }
        } else {
            error_log("[AppCallback] 未注册的事件: {$event}.{$changeType}");
        }
        return 'success';
    }
}

// ─── 回调路由器 ───

/**
 * 代开发双通道回调路由器
 *
 * 管理模版回调和应用回调两条通道的加解密与事件分发。
 *
 * 使用示例:
 *   $router = new CallbackRouter(
 *       suiteId: 'ww4asffe9xxx',
 *       suiteToken: 'token_for_suite_callback',
 *       suiteAesKey: 'aes_key_for_suite_callback',
 *       appToken: 'token_for_app_callback',
 *       appAesKey: 'aes_key_for_app_callback',
 *   );
 *   $router->getSuiteHandler()->on('suite_ticket', function($data) { ... });
 *   $router->getAppHandler()->onEvent('change_external_contact.add_external_contact', function($data) { ... });
 */
class CallbackRouter
{
    private WXBizMsgCrypt $suiteCrypt;
    private WXBizMsgCrypt $appCrypt;
    private SuiteCallbackHandler $suiteHandler;
    private AppCallbackHandler $appHandler;

    public function __construct(
        string $suiteId = '',
        string $suiteToken = '',
        string $suiteAesKey = '',
        string $appToken = '',
        string $appAesKey = ''
    ) {
        $suiteId = $suiteId ?: getenv('WECOM_SUITE_ID');
        $this->suiteCrypt = new WXBizMsgCrypt(
            $suiteToken ?: getenv('WECOM_SUITE_CALLBACK_TOKEN'),
            $suiteAesKey ?: getenv('WECOM_SUITE_ENCODING_AES_KEY'),
            $suiteId,
        );
        $this->appCrypt = new WXBizMsgCrypt(
            $appToken ?: getenv('WECOM_APP_CALLBACK_TOKEN'),
            $appAesKey ?: getenv('WECOM_APP_ENCODING_AES_KEY'),
            '', // receiverId 在解密时动态确定
        );
        $this->suiteHandler = new SuiteCallbackHandler();
        $this->appHandler = new AppCallbackHandler();
    }

    public function getSuiteHandler(): SuiteCallbackHandler { return $this->suiteHandler; }
    public function getAppHandler(): AppCallbackHandler { return $this->appHandler; }

    /** 处理模版回调 URL 验证（GET 请求） */
    public function handleSuiteGet(string $msgSig, string $ts, string $nonce, string $echostr): string
    {
        return $this->suiteCrypt->verifyAndDecrypt($msgSig, $ts, $nonce, $echostr);
    }

    /** 处理模版回调事件推送（POST 请求） */
    public function handleSuitePost(string $msgSig, string $ts, string $nonce, string $body): string
    {
        $xmlBody = XmlUtil::parse($body);
        $encryptText = $xmlBody['Encrypt'] ?? '';
        $plaintext = $this->suiteCrypt->verifyAndDecrypt($msgSig, $ts, $nonce, $encryptText);
        $data = XmlUtil::parse($plaintext);
        return $this->suiteHandler->handle($data);
    }

    /** 处理应用回调 URL 验证（GET 请求） */
    public function handleAppGet(string $msgSig, string $ts, string $nonce, string $echostr): string
    {
        return $this->appCrypt->verifyAndDecrypt($msgSig, $ts, $nonce, $echostr);
    }

    /** 处理应用回调事件推送（POST 请求） */
    public function handleAppPost(string $msgSig, string $ts, string $nonce, string $body): string
    {
        $xmlBody = XmlUtil::parse($body);
        $encryptText = $xmlBody['Encrypt'] ?? '';
        $plaintext = $this->appCrypt->verifyAndDecrypt($msgSig, $ts, $nonce, $encryptText);
        $data = XmlUtil::parse($plaintext);
        return $this->appHandler->handle($data);
    }

    // ─── HTTP 接入示例 ───

    /**
     * 处理模版回调 HTTP 请求（纯 PHP，无框架依赖）
     *
     * 路由到此方法: /suite/callback
     */
    public function handleSuiteRequest(): void
    {
        $msgSig = $_GET['msg_signature'] ?? '';
        $ts = $_GET['timestamp'] ?? '';
        $nonce = $_GET['nonce'] ?? '';

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $echostr = $_GET['echostr'] ?? '';
            try {
                $plaintext = $this->handleSuiteGet($msgSig, $ts, $nonce, $echostr);
                header('Content-Type: text/plain');
                echo $plaintext;
            } catch (\Throwable $e) {
                error_log('[SuiteCallback] URL 验证失败: ' . $e->getMessage());
                http_response_code(403);
                echo 'fail';
            }
            return;
        }

        // POST
        $body = file_get_contents('php://input');
        try {
            $result = $this->handleSuitePost($msgSig, $ts, $nonce, $body);
            echo $result;
        } catch (\Throwable $e) {
            error_log('[SuiteCallback] 事件处理失败: ' . $e->getMessage());
            echo 'success'; // 即使处理失败也返回 "success"，避免重试风暴
        }
    }

    /**
     * 处理应用回调 HTTP 请求（纯 PHP，无框架依赖）
     *
     * 路由到此方法: /app/callback
     */
    public function handleAppRequest(): void
    {
        $msgSig = $_GET['msg_signature'] ?? '';
        $ts = $_GET['timestamp'] ?? '';
        $nonce = $_GET['nonce'] ?? '';

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $echostr = $_GET['echostr'] ?? '';
            try {
                $plaintext = $this->handleAppGet($msgSig, $ts, $nonce, $echostr);
                header('Content-Type: text/plain');
                echo $plaintext;
            } catch (\Throwable $e) {
                error_log('[AppCallback] URL 验证失败: ' . $e->getMessage());
                http_response_code(403);
                echo 'fail';
            }
            return;
        }

        // POST
        $body = file_get_contents('php://input');
        try {
            $result = $this->handleAppPost($msgSig, $ts, $nonce, $body);
            echo $result;
        } catch (\Throwable $e) {
            error_log('[AppCallback] 事件处理失败: ' . $e->getMessage());
            echo 'success';
        }
    }
}

// ─── 使用示例 ───

/**
 * 完整使用示例（纯 PHP 入口文件）
 *
 * 文件: suite_callback.php — 部署路径: /suite/callback
 * 文件: app_callback.php   — 部署路径: /app/callback
 */
function example_usage(): void
{
    $router = new CallbackRouter();

    // 注册模版回调事件
    $router->getSuiteHandler()->on('suite_ticket', function (array $data): void {
        $ticket = $data['SuiteTicket'] ?? '';
        if ($ticket) {
            // 持久化到 Redis/DB
            error_log("[SuiteTicket] 已更新: {$ticket}");
        }
    });

    $router->getSuiteHandler()->on('create_auth', function (array $data): void {
        $authCode = $data['AuthCode'] ?? '';
        $state = $data['State'] ?? '';
        error_log("[CreateAuth] auth_code={$authCode}, state={$state}");
        // 实际项目中应放入消息队列异步换取永久授权码
    });

    $router->getSuiteHandler()->on('change_auth', function (array $data): void {
        $authCorpId = $data['AuthCorpId'] ?? '';
        error_log("[ChangeAuth] 企业 {$authCorpId} 变更授权");
    });

    $router->getSuiteHandler()->on('cancel_auth', function (array $data): void {
        $authCorpId = $data['AuthCorpId'] ?? '';
        error_log("[CancelAuth] 企业 {$authCorpId} 取消授权");
    });

    // 注册应用回调事件
    $router->getAppHandler()->onMessage('text', function (array $data): string {
        $content = $data['Content'] ?? '';
        $fromUser = $data['FromUserName'] ?? '';
        error_log("[TextMsg] from={$fromUser}, content={$content}");
        return 'success';
    });

    $router->getAppHandler()->onEvent(
        'change_external_contact.add_external_contact',
        function (array $data): string {
            $userId = $data['UserID'] ?? '';
            $externalUserId = $data['ExternalUserID'] ?? '';
            $welcomeCode = $data['WelcomeCode'] ?? '';
            error_log("[AddExternalContact] {$userId} → {$externalUserId}");
            if ($welcomeCode) {
                // ⚠️ WelcomeCode 有效期仅 20 秒，必须立即使用
                // TODO: 发送欢迎语
            }
            return 'success';
        }
    );

    // 根据请求路径分发（简易路由）
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($uri === '/suite/callback') {
        $router->handleSuiteRequest();
    } elseif ($uri === '/app/callback') {
        $router->handleAppRequest();
    } else {
        http_response_code(404);
        echo 'Not Found';
    }
}
```

---

## 8. Test Templates

### 8.1 Python (pytest)

```python
import pytest
import hashlib
import base64
import struct
import xml.etree.ElementTree as ET
from unittest.mock import patch, MagicMock
from Crypto.Cipher import AES

# 测试常量
TEST_TOKEN = "test_token_123"
TEST_AES_KEY = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG"  # 43 字符
TEST_SUITE_ID = "ww4asffe9xxx"
TEST_CORP_ID = "wwcorp001"

AES_KEY_BYTES = base64.b64decode(TEST_AES_KEY + "=")


def _encrypt_msg(msg: str, receiver_id: str) -> str:
    """辅助函数：加密消息"""
    import os
    random_bytes = os.urandom(16)
    msg_bytes = msg.encode("utf-8")
    receiver_bytes = receiver_id.encode("utf-8")
    content = random_bytes + struct.pack("!I", len(msg_bytes)) + msg_bytes + receiver_bytes
    # PKCS#7 padding
    pad_len = 32 - (len(content) % 32)
    content += bytes([pad_len] * pad_len)
    cipher = AES.new(AES_KEY_BYTES, AES.MODE_CBC, AES_KEY_BYTES[:16])
    encrypted = cipher.encrypt(content)
    return base64.b64encode(encrypted).decode()


def _make_signature(token: str, timestamp: str, nonce: str, *args: str) -> str:
    """辅助函数：计算签名"""
    arr = sorted([token, timestamp, nonce] + list(args))
    return hashlib.sha1("".join(arr).encode()).hexdigest()


# ─── WXBizMsgCrypt 单元测试 ───

class TestWXBizMsgCrypt:
    def setup_method(self):
        from callback_router import WXBizMsgCrypt
        self.crypt = WXBizMsgCrypt(TEST_TOKEN, TEST_AES_KEY, TEST_SUITE_ID)

    def test_签名计算正确(self):
        sig = self.crypt.verify_signature("1403610513", "nonce123", "encrypt_text")
        expected = _make_signature(TEST_TOKEN, "1403610513", "nonce123", "encrypt_text")
        assert sig == expected

    def test_加解密往返一致(self):
        original_msg = "<xml><SuiteId>ww4asffe9xxx</SuiteId></xml>"
        encrypted = _encrypt_msg(original_msg, TEST_SUITE_ID)
        decrypted = self.crypt.decrypt(encrypted)
        assert decrypted == original_msg

    def test_签名不匹配时抛异常(self):
        encrypted = _encrypt_msg("test", TEST_SUITE_ID)
        with pytest.raises(ValueError, match="签名验证失败"):
            self.crypt.verify_and_decrypt("wrong_signature", "123", "nonce", encrypted)

    def test_验签解密成功(self):
        msg = "<xml><InfoType>suite_ticket</InfoType></xml>"
        encrypted = _encrypt_msg(msg, TEST_SUITE_ID)
        sig = _make_signature(TEST_TOKEN, "123456", "nonce", encrypted)
        result = self.crypt.verify_and_decrypt(sig, "123456", "nonce", encrypted)
        assert "suite_ticket" in result


# ─── SuiteCallbackHandler 测试 ───

class TestSuiteCallbackHandler:
    def setup_method(self):
        from callback_router import SuiteCallbackHandler
        self.handler = SuiteCallbackHandler()

    def test_suite_ticket事件分发(self):
        received = {}

        def on_ticket(xml_data):
            received["ticket"] = xml_data.findtext("SuiteTicket")

        self.handler.on("suite_ticket", on_ticket)
        xml_str = """<xml>
            <SuiteId>ww4asffe9xxx</SuiteId>
            <InfoType>suite_ticket</InfoType>
            <TimeStamp>1403610513</TimeStamp>
            <SuiteTicket>new_ticket_value</SuiteTicket>
        </xml>"""
        result = self.handler.handle(ET.fromstring(xml_str))
        assert result == "success"
        assert received["ticket"] == "new_ticket_value"

    def test_create_auth事件分发(self):
        received = {}

        def on_create_auth(xml_data):
            received["auth_code"] = xml_data.findtext("AuthCode")
            received["state"] = xml_data.findtext("State")

        self.handler.on("create_auth", on_create_auth)
        xml_str = """<xml>
            <SuiteId>ww4asffe9xxx</SuiteId>
            <InfoType>create_auth</InfoType>
            <TimeStamp>1403610513</TimeStamp>
            <AuthCode>temp_auth_code_123</AuthCode>
            <State>custom_state</State>
        </xml>"""
        self.handler.handle(ET.fromstring(xml_str))
        assert received["auth_code"] == "temp_auth_code_123"
        assert received["state"] == "custom_state"

    def test_cancel_auth事件分发(self):
        received = {}

        def on_cancel(xml_data):
            received["corpid"] = xml_data.findtext("AuthCorpId")

        self.handler.on("cancel_auth", on_cancel)
        xml_str = """<xml>
            <SuiteId>ww4asffe9xxx</SuiteId>
            <InfoType>cancel_auth</InfoType>
            <TimeStamp>1403610513</TimeStamp>
            <AuthCorpId>wwcorp001</AuthCorpId>
        </xml>"""
        self.handler.handle(ET.fromstring(xml_str))
        assert received["corpid"] == "wwcorp001"

    def test_未注册事件不报错(self):
        xml_str = """<xml><InfoType>unknown_type</InfoType></xml>"""
        result = self.handler.handle(ET.fromstring(xml_str))
        assert result == "success"

    def test_处理函数异常不影响响应(self):
        def on_ticket(xml_data):
            raise RuntimeError("模拟异常")

        self.handler.on("suite_ticket", on_ticket)
        xml_str = """<xml><InfoType>suite_ticket</InfoType></xml>"""
        result = self.handler.handle(ET.fromstring(xml_str))
        assert result == "success"


# ─── AppCallbackHandler 测试 ───

class TestAppCallbackHandler:
    def setup_method(self):
        from callback_router import AppCallbackHandler
        self.handler = AppCallbackHandler()

    def test_文本消息分发(self):
        received = {}

        def on_text(xml_data):
            received["content"] = xml_data.findtext("Content")

        self.handler.on_message("text", on_text)
        xml_str = """<xml>
            <MsgType>text</MsgType>
            <Content>你好</Content>
        </xml>"""
        result = self.handler.handle(ET.fromstring(xml_str))
        assert result == "success"
        assert received["content"] == "你好"

    def test_客户添加事件分发_子事件格式(self):
        received = {}

        def on_add(xml_data):
            received["userid"] = xml_data.findtext("UserID")
            received["external_userid"] = xml_data.findtext("ExternalUserID")

        self.handler.on_event(
            "change_external_contact.add_external_contact", on_add
        )
        xml_str = """<xml>
            <MsgType>event</MsgType>
            <Event>change_external_contact</Event>
            <ChangeType>add_external_contact</ChangeType>
            <UserID>zhangsan</UserID>
            <ExternalUserID>woXXX</ExternalUserID>
        </xml>"""
        self.handler.handle(ET.fromstring(xml_str))
        assert received["userid"] == "zhangsan"

    def test_事件级别回退分发(self):
        """未注册子事件时回退到事件级别"""
        received = {}

        def on_subscribe(xml_data):
            received["event"] = "subscribe"

        self.handler.on_event("subscribe", on_subscribe)
        xml_str = """<xml>
            <MsgType>event</MsgType>
            <Event>subscribe</Event>
        </xml>"""
        self.handler.handle(ET.fromstring(xml_str))
        assert received["event"] == "subscribe"

    def test_菜单点击事件(self):
        received = {}

        def on_click(xml_data):
            received["key"] = xml_data.findtext("EventKey")

        self.handler.on_event("click", on_click)
        xml_str = """<xml>
            <MsgType>event</MsgType>
            <Event>click</Event>
            <EventKey>menu_key_1</EventKey>
        </xml>"""
        self.handler.handle(ET.fromstring(xml_str))
        assert received["key"] == "menu_key_1"


# ─── CallbackRouter 集成测试 ───

class TestCallbackRouter:
    def setup_method(self):
        from callback_router import CallbackRouter
        self.router = CallbackRouter(
            suite_id=TEST_SUITE_ID,
            suite_token=TEST_TOKEN,
            suite_aes_key=TEST_AES_KEY,
            app_token=TEST_TOKEN,
            app_aes_key=TEST_AES_KEY,
        )

    def test_模版回调URL验证(self):
        echostr_plain = "echo_string_123"
        echostr_encrypted = _encrypt_msg(echostr_plain, TEST_SUITE_ID)
        sig = _make_signature(TEST_TOKEN, "123456", "nonce", echostr_encrypted)
        result = self.router.handle_suite_get(sig, "123456", "nonce", echostr_encrypted)
        assert result == echostr_plain

    def test_模版回调事件推送(self):
        received = {}

        def on_ticket(xml_data):
            received["ticket"] = xml_data.findtext("SuiteTicket")

        self.router.suite_handler.on("suite_ticket", on_ticket)

        inner_xml = """<xml>
            <SuiteId>ww4asffe9xxx</SuiteId>
            <InfoType>suite_ticket</InfoType>
            <TimeStamp>1403610513</TimeStamp>
            <SuiteTicket>ticket_abc</SuiteTicket>
        </xml>"""
        encrypted = _encrypt_msg(inner_xml, TEST_SUITE_ID)
        sig = _make_signature(TEST_TOKEN, "123456", "nonce", encrypted)
        body = f"""<xml>
            <ToUserName>ww4asffe9xxx</ToUserName>
            <Encrypt>{encrypted}</Encrypt>
        </xml>""".encode()

        result = self.router.handle_suite_post(sig, "123456", "nonce", body)
        assert result == "success"
        assert received["ticket"] == "ticket_abc"

    def test_URL验证签名错误返回异常(self):
        echostr_encrypted = _encrypt_msg("test", TEST_SUITE_ID)
        with pytest.raises(ValueError, match="签名验证失败"):
            self.router.handle_suite_get("wrong_sig", "123456", "nonce", echostr_encrypted)
```

---

## 9. Code Review Checklist

### 9.1 回调安全审核

| 编号 | 检查项 | 级别 |
|------|--------|------|
| R1 | 模版回调和应用回调使用**不同的** Token 和 EncodingAESKey | CRITICAL |
| R2 | 每条回调通道都有独立的签名验证逻辑 | CRITICAL |
| R3 | Token / EncodingAESKey 从环境变量或密钥管理服务读取，未硬编码 | CRITICAL |
| R4 | AES 解密后验证 receiveid（模版回调为 suite_id，应用回调为 auth_corpid） | HIGH |
| R5 | 回调处理逻辑中无 SQL 注入 / XSS / 命令注入风险 | CRITICAL |

### 9.2 回调可靠性审核

| 编号 | 检查项 | 级别 |
|------|--------|------|
| R6 | suite_ticket 处理在 **5 秒内**响应 "success" | CRITICAL |
| R7 | suite_ticket 有持久化存储机制（Redis / DB），非仅内存 | CRITICAL |
| R8 | suite_ticket 更新采用**覆盖**策略（最新值替换旧值） | HIGH |
| R9 | 所有回调处理采用**立即应答 + 异步处理**模式 | HIGH |
| R10 | 回调处理函数异常时仍返回 "success"，避免重试风暴 | HIGH |
| R11 | URL 验证（GET）返回**解密后的明文**，非 "success" | CRITICAL |
| R12 | 事件推送（POST）返回 "success" 或空字符串 | HIGH |

### 9.3 业务逻辑审核

| 编号 | 检查项 | 级别 |
|------|--------|------|
| R13 | create_auth 处理中用 AuthCode 换取 permanent_code 并持久化 | CRITICAL |
| R14 | cancel_auth 处理中清理企业的所有授权数据和缓存 | HIGH |
| R15 | reset_permanent_code 处理中更新数据库的 permanent_code | HIGH |
| R16 | 事件路由正确区分 InfoType（模版回调）和 MsgType/Event（应用回调） | HIGH |
| R17 | 通讯录变更事件中 userid 为加密值的意识（代开发特有） | MEDIUM |
| R18 | change_auth 处理中异步更新企业授权信息 | MEDIUM |

---

## 10. Gotcha Guide

### G1: 两个回调 URL 的 Token/EncodingAESKey 不可混用

模版回调 URL 和应用回调 URL 各自拥有独立的 Token 和 EncodingAESKey。用错密钥会导致签名验证失败或解密乱码。

→ 在代码中明确区分两组密钥，建议用不同的环境变量命名（如 `WECOM_SUITE_CALLBACK_TOKEN` vs `WECOM_APP_CALLBACK_TOKEN`）。

### G2: suite_ticket 回调必须 5 秒内响应 "success"

超时或返回非 "success" 内容，企业微信视为接收失败。**连续 2 次失败后 suite_access_token 将无法刷新**，导致所有业务 API 瘫痪。

→ 收到 suite_ticket 后**立即更新存储并响应**，禁止在回调处理中做任何耗时操作。

### G3: URL 验证（GET）返回解密后的明文，不是 "success"

这是最常见的混淆点。GET 请求是 URL 配置验证，必须返回 echostr 解密后的明文。POST 请求是事件推送，返回 "success"。

→ GET → 返回明文；POST → 返回 "success"。记住：GET 是**回声**，POST 是**确认**。

### G4: 模版回调的 ToUserName 是 suite_id，应用回调的 ToUserName 是 auth_corpid

解密后的明文 XML 中，模版回调事件的接收方标识是 `<SuiteId>`，应用回调事件是 `<ToUserName>`（值为 auth_corpid）。

→ 事件路由时通过是否存在 `<InfoType>` 字段来判断通道类型，而非依赖 ToUserName。

### G5: InfoType 用于模版回调，MsgType/Event 用于应用回调

模版回调事件通过 `<InfoType>` 字段区分事件类型（如 suite_ticket / create_auth）。应用回调事件通过 `<MsgType>` + `<Event>` + `<ChangeType>` 三级字段区分。

→ 不要在模版回调中找 MsgType，也不要在应用回调中找 InfoType。

### G6: 代开发通讯录变更事件中的 userid 是加密后的

自 2022 年 6 月 28 日起，代开发应用收到的通讯录变更事件中，所有 userid 均为**服务商主体加密**后的值。

→ 不要直接将回调中的 userid 与企业自建应用的数据匹配，需通过 ID 转换接口转换。

### G7: 回调配置时需先通过 URL 验证

在服务商管理后台保存回调配置时，企业微信会向 URL 发送 GET 请求验证。验证不通过则无法保存配置。

→ 部署回调服务后，先确保 GET 验证接口正常工作，再去后台保存配置。

### G8: 即使处理失败也要返回 "success"

如果回调处理逻辑出异常，仍应返回 "success"。否则企业微信会重试推送（最多 3 次），导致重复处理。

→ 在回调入口做 try-catch，异常时记录日志但仍返回 "success"。业务重试应由自己的消息队列控制。

### G9: create_auth 的 AuthCode 一次有效

收到 create_auth 事件中的 AuthCode（临时授权码）只能使用一次。如果换取 permanent_code 失败且未做持久化，则**无法再次获取**。

→ 收到 AuthCode 后立即持久化（哪怕只存到队列），确保换取失败后可以重试。但注意企业微信不会重发 create_auth，所以 AuthCode 本身不可恢复。

### G10: reset_permanent_code 后旧码立即失效

收到 reset_permanent_code 事件后，旧的 permanent_code **立即失效**。必须尽快获取新的 permanent_code 并更新数据库。

→ 将此事件的处理优先级提高到仅次于 suite_ticket，异步但尽快执行。

---

## 11. 回调相关错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40001 | 不合法的 secret 参数 | 检查 suite_secret 是否正确 |
| 40082 | suite_id 不合法 | 检查回调中的 SuiteId 是否匹配 |
| 40083 | suite_secret 不合法 | — |
| 40084 | suite_ticket 不合法 | 使用最新推送的 suite_ticket，检查是否被覆盖 |
| 40085 | suite_token 不合法 | 重新获取 suite_access_token |
| 42009 | suite_access_token 已过期 | 刷新 token |
| 84014 | 无效的临时授权码 | auth_code 已使用过或已过期 |
| 84015 | 企业已被取消授权 | 企业管理员已取消授权 |
| 60020 | IP 不在白名单 | 服务商管理后台添加 IP 白名单 |
| -1 | 系统繁忙 | 稍后重试，最多 3 次 |

---

## 12. References

### 12.1 官方文档

| 文档 | 链接 |
|------|------|
| 代开发回调概述 | https://developer.work.weixin.qq.com/document/path/97166 |
| 模版回调事件 | https://developer.work.weixin.qq.com/document/path/97167 |
| 应用回调事件 | https://developer.work.weixin.qq.com/document/path/97168 |
| 回调配置说明 | https://developer.work.weixin.qq.com/document/path/97169 |
| 接收消息与事件 | https://developer.work.weixin.qq.com/document/path/97170 |
| 加解密库下载 | https://developer.work.weixin.qq.com/document/path/90968 |
| 代开发流程 | https://developer.work.weixin.qq.com/document/path/97112 |
| 与自建应用接口差异 | https://developer.work.weixin.qq.com/document/path/97165 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |

### 12.2 能力索引（ISV 域）

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 代开发基础、凭证体系、多企业管理 | wecom-isv-core |
| suite_ticket、授权通知、回调事件 | wecom-isv-callback（本 SKILL） |
| 授权流程、预授权码、授权链接 | wecom-isv-auth |
| 接口调用许可、帐号购买、订单 | wecom-isv-license |
| 收银台、支付、定价、收款 | wecom-isv-billing |
| JS-SDK、agentConfig、前端签名 | wecom-isv-jssdk |
| 通讯录、成员、部门 | wecom-contact（复用，换 token 即可） |
| 消息推送、群聊 | wecom-message（复用，换 token 即可） |
| 客户联系、CRM | wecom-crm-*（复用，换 token 即可） |
