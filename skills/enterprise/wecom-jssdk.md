---
name: wecom-jssdk
description: |
  企业微信 JS-SDK 域 SKILL — 签名算法、注册鉴权、客户端 API（通讯录/客户联系/会话/扫码/位置/音频/图像/文件/分享/系统）、
  前端初始化全流程、getContext 场景判断
version: 1.0.0
domain: jssdk
depends_on: wecom-core
doc_ids: [90506, 90547, 90514, 94313, 94314, 94315, 94316, 94317, 94318, 94319, 94320, 94321, 94322, 94323, 94324, 94325, 94326, 94327, 94328, 94329]
api_count: 2
client_api_count: 35
triggers:
  - jssdk
  - js-sdk
  - JS-SDK
  - jsapi
  - jsapi_ticket
  - ww.register
  - ww.getContext
  - getConfigSignature
  - getAgentConfigSignature
  - config
  - agentConfig
  - 签名算法
  - 前端接入
  - scanQRCode
  - chooseImage
  - uploadVoice
  - getLocation
  - openUserProfile
  - selectExternalContact
  - getCurExternalContact
  - openExistedChatWithMsg
  - shareAppMessage
  - 聊天工具栏
  - 外部联系人选人
prerequisite_skills:
  - wecom-core
---

# WeCom JS-SDK SKILL (wecom-jssdk)

> 企业微信 JS-SDK 全域 SKILL：覆盖**服务端签名 API**（企业 jsapi_ticket + 应用 jsapi_ticket）与**客户端 SDK 全套接口**（注册鉴权、通讯录、客户联系、会话、扫码、位置、音频、图像、文件、分享、系统界面等 35+ 客户端 API）。
> 依赖 `wecom-core` 提供的 Token 管理和请求基础设施。

---

## 1. Prerequisites

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret 的 access_token | 应用可信域名已验证 |
| 第三方应用 | suite_access_token | 应用可信域名 + 授权 |

### 1.2 可信域名配置

**必须步骤**，否则 JS-SDK 所有调用均会失败：

1. 管理后台 → 应用管理 → 选择应用 → 「网页授权及 JS-SDK」
2. 设置**可信域名**（需 ICP 备案 + 验证域名归属）
3. 下载验证文件放到域名根目录

> JS-SDK 所有接口**只能在可信域名下调用**（含子域名）。

### 1.3 两种身份权限

| 权限 | 签名凭证 | 注册方式 | 适用 API |
|------|---------|---------|---------|
| **企业身份** | 企业 jsapi_ticket | `getConfigSignature` | 基础 API（扫码、位置等） |
| **应用身份** | 应用 jsapi_ticket | `getAgentConfigSignature` | 需应用权限的 API（客户联系、通讯录选人等） |

> 应用身份权限 ＞ 企业身份权限。使用需要应用权限的 API 时，必须同时提供两种签名。

---

## 2. Core Concepts

### 2.1 架构总览

```
前端 (H5/Web)                              后端 (Server)
┌─────────────────────┐                   ┌──────────────────────┐
│ 1. 加载 JS-SDK       │                   │                      │
│ 2. ww.register({    │  ←── 请求签名 ──→  │ 3. 生成签名            │
│      corpId,        │                   │    - 获取 jsapi_ticket │
│      getConfigSig,  │                   │    - SHA1 拼接         │
│      getAgentSig    │                   │    - 返回签名三元组      │
│    })               │                   │                      │
│ 4. ww.方法名()       │                   │                      │
└─────────────────────┘                   └──────────────────────┘
```

### 2.2 签名算法

**签名字符串拼接规则**（参数顺序固定，不要 URL encode）：

```
jsapi_ticket=TICKET&noncestr=NONCESTR&timestamp=TIMESTAMP&url=URL
```

然后对拼接后的字符串做 **SHA-1** 哈希，得到 signature。

**示例**：

```
输入：
  jsapi_ticket = sM4AOVdWfPE4DxkXGEs8VMP...
  noncestr = Wm3WZYTPz0wzccnW
  timestamp = 1414587457
  url = http://mp.weixin.qq.com?params=value

拼接：jsapi_ticket=sM4AO...&noncestr=Wm3WZY...&timestamp=1414587457&url=http://mp.weixin.qq.com?params=value

SHA-1 = 0f9de62fce790f9a083d5c99e95740ceb90c27ed
```

### 2.3 jsapi_ticket 两种类型

| 类型 | 获取接口 | 用于 | 频率限制 | 有效期 |
|------|---------|------|---------|--------|
| 企业 ticket | `GET /get_jsapi_ticket` | `getConfigSignature` | 400次/小时/企业，100次/小时/应用 | 7200s (2h) |
| 应用 ticket | `GET /ticket/get?type=agent_config` | `getAgentConfigSignature` | 同上 | 7200s (2h) |

> **必须缓存**：获取频率极低，过期后才刷新。

### 2.4 SDK 版本

| 版本 | 引入方式 | 全局对象 |
|------|---------|---------|
| wecom-jssdk (新版) | `npm install @wecom/jssdk` 或 CDN `wecom-jssdk-2.3.4.js` | `ww` |
| jweixin (旧版) | CDN `jWeixin-1.2.0.js` | `wx` |

> 强烈建议使用新版 `@wecom/jssdk`，有完整 TypeScript 类型支持。

---

## 3. API Quick Reference

### 3.1 服务端 API

| # | 接口 | 方法 | Endpoint | 频率 |
|---|------|------|----------|------|
| S1 | 获取企业 jsapi_ticket | GET | `get_jsapi_ticket` | 400/h |
| S2 | 获取应用 jsapi_ticket | GET | `ticket/get?type=agent_config` | 400/h |

### 3.2 客户端 API 分类

| 类别 | 代表 API | 权限要求 |
|------|---------|---------|
| **注册与鉴权** | `ww.register`, `ww.getSignature`, `ww.checkJsApi` | — |
| **上下文** | `ww.getContext` | 企业身份 |
| **通讯录** | `ww.selectEnterpriseContact`, `ww.openUserProfile` | 应用身份 |
| **客户联系** | `ww.selectExternalContact`, `ww.getCurExternalContact`, `ww.navigateToAddCustomer`, `ww.openExistedChatWithMsg` | 应用身份 |
| **会话** | `ww.openEnterpriseChat`, `ww.sendChatMessage`, `ww.shareToExternalContact`, `ww.shareToExternalMoments` | 应用身份 |
| **扫码** | `ww.scanQRCode` | 企业身份 |
| **位置** | `ww.getLocation`, `ww.openLocation` | 企业身份 |
| **音频** | `ww.startRecord`, `ww.stopRecord`, `ww.playVoice`, `ww.uploadVoice`, `ww.downloadVoice` | 企业身份 |
| **图像** | `ww.chooseImage`, `ww.previewImage`, `ww.uploadImage`, `ww.downloadImage` | 企业身份 |
| **文件** | `ww.previewFile` | 企业身份 |
| **分享** | `ww.shareAppMessage`, `ww.shareWechatMessage`, `ww.onMenuShareAppMessage` | 企业身份 |
| **系统** | `ww.hideOptionMenu`, `ww.showOptionMenu`, `ww.closeWindow` | 企业身份 |
| **审批** | `ww.thirdPartyOpenPage` | 应用身份 |
| **聊天工具栏** | `ww.getChatToolbarContext` (外部群/单聊工具栏入口) | 应用身份 |

---

## 4. API Details

### S1. 获取企业 jsapi_ticket

```
GET https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=ACCESS_TOKEN
```

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| ticket | string | 企业 jsapi_ticket |
| expires_in | int | 有效期（秒），通常 7200 |

**返回示例**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "ticket": "bxLdikRXVbTPdHSM05e5u5sUoXNKd8-41ZO3MhKoyN5OfkWITD...",
    "expires_in": 7200
}
```

**频率限制**：一小时内，一个企业最多 400 次，单个应用不超过 100 次。**必须缓存**。

---

### S2. 获取应用 jsapi_ticket

```
GET https://qyapi.weixin.qq.com/cgi-bin/ticket/get?access_token=ACCESS_TOKEN&type=agent_config
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证 |
| type | 是 | string | 固定为 `agent_config` |

**返回参数**：与 S1 相同。

---

## 5. 客户端 API 详情

### 5.1 注册与鉴权

#### ww.register — 注册页面身份

```javascript
// 仅企业身份（适用于基础 API）
ww.register({
    corpId: 'ww7ca4776b2a70000',
    jsApiList: ['scanQRCode', 'getLocation'],
    getConfigSignature,
})

// 企业身份 + 应用身份（适用于需应用权限的 API）
ww.register({
    corpId: 'ww7ca4776b2a70000',
    agentId: 1000247,
    jsApiList: ['selectExternalContact', 'getCurExternalContact'],
    getConfigSignature,
    getAgentConfigSignature,
})

// 签名回调函数（服务端调用）
async function getConfigSignature(url) {
    // 从后端获取企业签名
    const resp = await fetch(`/api/jssdk/config-signature?url=${encodeURIComponent(url)}`)
    return resp.json() // { timestamp, nonceStr, signature }
}

async function getAgentConfigSignature(url) {
    // 从后端获取应用签名（使用应用 jsapi_ticket）
    const resp = await fetch(`/api/jssdk/agent-signature?url=${encodeURIComponent(url)}`)
    return resp.json() // { timestamp, nonceStr, signature }
}
```

> **重要**：`ww.register()` 后可以**立即调用**其他 JS API，SDK 内部自行处理时序。

#### ww.checkJsApi — 检查接口是否可用

```javascript
const result = await ww.checkJsApi({
    jsApiList: ['scanQRCode', 'getCurExternalContact'],
})
// result.checkResult = { scanQRCode: true, getCurExternalContact: true }
```

#### ww.getSignature — 开发环境快速签名

```javascript
// ⚠️ 仅用于开发环境！生产环境严禁暴露 JSAPI_TICKET
const JSAPI_TICKET = 'sM4AOVdW...'
ww.register({
    corpId: 'ww7ca4776b2a70000',
    jsApiList: ['scanQRCode'],
    getConfigSignature() {
        return ww.getSignature(JSAPI_TICKET)
    },
})
```

> 快速获取 ticket：`npx wwutil ticket CORPID SECRET`

### 5.2 上下文

#### ww.getContext — 获取当前页面上下文

```javascript
const context = await ww.getContext()
// context.entry = "normal" | "contact_profile" | "single_chat_tools" | "group_chat_tools" | ...
// context.shareTicket (如果从分享进入)
```

**entry 值**：

| entry | 场景 | 额外字段 |
|-------|------|---------|
| `normal` | 普通打开（工作台等） | — |
| `contact_profile` | 通讯录头像 | — |
| `single_chat_tools` | 单聊会话工具栏 | — |
| `group_chat_tools` | 群聊会话工具栏 | — |
| `chat_attachment` | 聊天附件栏入口 | — |

### 5.3 通讯录

#### ww.selectEnterpriseContact — 企业通讯录选人

```javascript
const result = await ww.selectEnterpriseContact({
    fromDepartmentId: 0,  // 0 表示从企业根部门开始
    mode: 'multi',        // 'single' | 'multi'
    type: ['user', 'department'], // 可选类型
    selectedUserIds: [],   // 已选 userid
    selectedDepartmentIds: [],
})
// result.userList = [{ id, name, avatar }]
// result.departmentList = [{ id, name }]
```

#### ww.openUserProfile — 打开成员/外部联系人资料页

```javascript
// 打开企业成员
await ww.openUserProfile({ type: 1, userid: 'zhangsan' })

// 打开外部联系人
await ww.openUserProfile({ type: 2, userid: 'external_userid_xxx' })
```

### 5.4 客户联系

#### ww.selectExternalContact — 选择外部联系人

```javascript
const result = await ww.selectExternalContact({
    filterType: 0, // 0=全部, 1=仅微信联系人, 2=仅企业联系人
})
// result.userIds = ['wmAABB...', 'wmCCDD...']
```

#### ww.getCurExternalContact — 获取当前外部联系人 userId

```javascript
// 适用场景：已在外部联系人详情页打开的 H5
const result = await ww.getCurExternalContact()
// result.userId = 'wmAABB...'
```

#### ww.navigateToAddCustomer — 跳转添加客户页

```javascript
await ww.navigateToAddCustomer()
```

#### ww.openExistedChatWithMsg — 打开已有会话并发消息

```javascript
await ww.openExistedChatWithMsg({
    chatId: 'wrAABBCCDD',
    msg: { msgtype: 'text', text: { content: '你好' } },
})
```

### 5.5 会话

#### ww.openEnterpriseChat — 打开会话

```javascript
await ww.openEnterpriseChat({
    userIds: 'zhangsan;lisi',  // 成员 userid，分号分隔
    groupName: '项目讨论组',     // 群名（仅多人时生效）
    chatId: '',                // 已有群的 chatId
    externalUserIds: '',       // 外部联系人，分号分隔
})
```

#### ww.sendChatMessage — 在会话中发消息

```javascript
await ww.sendChatMessage({
    msgtype: 'text',
    text: { content: '推荐一篇文章' },
    // 也支持: image/video/file/news/miniprogram
})
```

### 5.6 扫码

#### ww.scanQRCode — 扫一扫

```javascript
const result = await ww.scanQRCode({
    needResult: 1, // 0=由企微处理, 1=返回扫码结果
    scanType: ['qrCode', 'barCode'],
})
// result.resultStr = '扫码内容'
```

### 5.7 位置

#### ww.getLocation — 获取地理位置

```javascript
const result = await ww.getLocation({
    type: 'gcj02', // 'wgs84'(GPS) 或 'gcj02'(国测局)
})
// result = { latitude, longitude, speed, accuracy }
```

#### ww.openLocation — 使用微信内置地图查看位置

```javascript
await ww.openLocation({
    latitude: 39.908823,
    longitude: 116.397470,
    name: '天安门',
    address: '北京市东城区',
    scale: 15,
    infoUrl: 'https://example.com',
})
```

### 5.8 音频

```javascript
// 开始录音
await ww.startRecord()

// 停止录音，返回 localId
const { localId } = await ww.stopRecord()

// 上传语音到服务器，返回 serverId (即 media_id)
const { serverId } = await ww.uploadVoice({
    localId,
    isShowProgressTips: 1, // 是否显示进度提示
})

// 下载语音
const { localId: newLocalId } = await ww.downloadVoice({
    serverId,
    isShowProgressTips: 1,
})

// 播放语音
await ww.playVoice({ localId: newLocalId })
await ww.pauseVoice({ localId: newLocalId })
await ww.stopVoice({ localId: newLocalId })
```

### 5.9 图像

```javascript
// 选择图片
const { localIds } = await ww.chooseImage({
    count: 9,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
})

// 预览图片
await ww.previewImage({
    current: 'https://example.com/1.jpg',
    urls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
})

// 上传图片（返回 serverId 即 media_id）
const { serverId } = await ww.uploadImage({
    localId: localIds[0],
    isShowProgressTips: 1,
})

// 下载图片
const { localId } = await ww.downloadImage({
    serverId,
    isShowProgressTips: 1,
})
```

### 5.10 文件

```javascript
// 预览文件
await ww.previewFile({
    url: 'https://example.com/doc.pdf',
    name: '文档.pdf',
    size: 102400, // 字节
})
```

### 5.11 分享

```javascript
// 自定义转发（分享给微信好友/会话）
ww.onMenuShareAppMessage({
    title: '分享标题',
    desc: '分享描述',
    link: 'https://example.com',
    imgUrl: 'https://example.com/icon.png',
    success() { },
})

// 分享到朋友圈
ww.onMenuShareTimeline({
    title: '分享标题',
    link: 'https://example.com',
    imgUrl: 'https://example.com/icon.png',
    success() { },
})

// 分享到企业微信好友
await ww.shareAppMessage({
    title: '分享标题',
    desc: '分享描述',
    link: 'https://example.com',
    imgUrl: 'https://example.com/icon.png',
})

// 分享到微信联系人
await ww.shareWechatMessage({
    title: '分享标题',
    desc: '分享描述',
    link: 'https://example.com',
    imgUrl: 'https://example.com/icon.png',
})
```

### 5.12 系统

```javascript
await ww.hideOptionMenu()        // 隐藏右上角菜单
await ww.showOptionMenu()        // 显示右上角菜单
await ww.closeWindow()           // 关闭当前窗口
await ww.hideMenuItems({ menuList: ['menuItem:share:timeline'] })
await ww.showMenuItems({ menuList: ['menuItem:share:timeline'] })
await ww.hideAllNonBaseMenuItems()
await ww.showAllNonBaseMenuItems()
```

### 5.13 审批流程引擎

```javascript
// 在自建应用内发起审批
await ww.thirdPartyOpenPage({
    oaType: 'approval',
    templateId: 'template_xxx',
    thirdNo: 'custom_no_001',
})
```

---

## 6. Workflows

### 6.1 JS-SDK 标准接入流程

```
前端:                                     后端:
1. npm install @wecom/jssdk              2. 获取 access_token
   或 CDN 引入                               (wecom-core)
                                          3. 获取 jsapi_ticket (S1/S2)
                                             缓存 2h
4. ww.register({                          5. 接收签名请求
     corpId, agentId,                        SHA1签名
     jsApiList,                              返回 { timestamp, nonceStr, signature }
     getConfigSignature: async(url) => {
       return fetch('/api/sign?url=' + url)
     },
     getAgentConfigSignature: ...
   })

6. ww.方法名({...})  →  调用 JS 接口
```

### 6.2 签名服务端实现流程

```
1. access_token = wecom-core.get_token()
2. jsapi_ticket = GET /get_jsapi_ticket → 缓存 (2 小时)
3. agent_ticket = GET /ticket/get?type=agent_config → 缓存 (2 小时)
4. 前端请求签名时:
   a. noncestr = random_string()
   b. timestamp = int(time())
   c. sign_str = f"jsapi_ticket={ticket}&noncestr={noncestr}&timestamp={timestamp}&url={url}"
   d. signature = SHA1(sign_str)
   e. 返回 { timestamp, nonceStr, signature }
```

### 6.3 聊天工具栏场景

```
1. 管理后台 → 应用管理 → 应用 → 「配置到聊天工具栏」
2. 用户在聊天窗口点击工具栏入口 → 打开 H5 页面
3. H5 调用 ww.getContext() → entry = "single_chat_tools" 或 "group_chat_tools"
4. 调用 ww.getCurExternalContact() → 获取当前外部联系人
5. 基于联系人信息展示业务内容
```

---

## 7. Code Templates

### 7.1 Python — 服务端签名服务

```python
"""WeCom JS-SDK Signature Service — 签名服务"""
import hashlib
import time
import uuid
import threading
from wecom_core import WeComClient


class JsSdkService:
    """JS-SDK 签名服务（服务端）"""

    def __init__(self, client: WeComClient):
        self.client = client
        self._corp_ticket: str = ""
        self._corp_ticket_expires_at: float = 0
        self._agent_ticket: str = ""
        self._agent_ticket_expires_at: float = 0
        self._lock = threading.Lock()

    # ── S1 获取企业 jsapi_ticket ──

    def get_corp_ticket(self) -> str:
        """获取企业 jsapi_ticket（带缓存）"""
        now = time.time()
        if self._corp_ticket and now < self._corp_ticket_expires_at - 300:
            return self._corp_ticket

        with self._lock:
            # Double-check
            if self._corp_ticket and time.time() < self._corp_ticket_expires_at - 300:
                return self._corp_ticket

            resp = self.client.get("/get_jsapi_ticket")
            self._corp_ticket = resp["ticket"]
            self._corp_ticket_expires_at = time.time() + resp.get("expires_in", 7200)
            return self._corp_ticket

    # ── S2 获取应用 jsapi_ticket ──

    def get_agent_ticket(self) -> str:
        """获取应用 jsapi_ticket（带缓存）"""
        now = time.time()
        if self._agent_ticket and now < self._agent_ticket_expires_at - 300:
            return self._agent_ticket

        with self._lock:
            if self._agent_ticket and time.time() < self._agent_ticket_expires_at - 300:
                return self._agent_ticket

            resp = self.client.get("/ticket/get", params={"type": "agent_config"})
            self._agent_ticket = resp["ticket"]
            self._agent_ticket_expires_at = time.time() + resp.get("expires_in", 7200)
            return self._agent_ticket

    # ── 签名生成 ──

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

        # 拼接规则固定，不要改变参数顺序，不要 URL encode
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

    def get_config_signature(self, url: str) -> dict:
        """获取企业签名（用于 getConfigSignature）"""
        ticket = self.get_corp_ticket()
        return self.make_signature(ticket, url)

    def get_agent_config_signature(self, url: str) -> dict:
        """获取应用签名（用于 getAgentConfigSignature）"""
        ticket = self.get_agent_ticket()
        return self.make_signature(ticket, url)
```

### 7.2 TypeScript — 服务端签名服务

```typescript
/** WeCom JS-SDK Signature Service */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { WeComClient } from './wecom-core';

interface SignatureResult {
  timestamp: string;
  nonceStr: string;
  signature: string;
}

export class JsSdkService {
  private corpTicket = '';
  private corpTicketExpiresAt = 0;
  private agentTicket = '';
  private agentTicketExpiresAt = 0;

  constructor(private client: WeComClient) {}

  /** S1: 获取企业 jsapi_ticket（带缓存） */
  async getCorpTicket(): Promise<string> {
    const now = Date.now() / 1000;
    if (this.corpTicket && now < this.corpTicketExpiresAt - 300) {
      return this.corpTicket;
    }
    const resp = await this.client.request('GET', '/get_jsapi_ticket');
    this.corpTicket = resp.ticket as string;
    this.corpTicketExpiresAt = now + (resp.expires_in as number || 7200);
    return this.corpTicket;
  }

  /** S2: 获取应用 jsapi_ticket（带缓存） */
  async getAgentTicket(): Promise<string> {
    const now = Date.now() / 1000;
    if (this.agentTicket && now < this.agentTicketExpiresAt - 300) {
      return this.agentTicket;
    }
    const resp = await this.client.request('GET', '/ticket/get', undefined, { type: 'agent_config' });
    this.agentTicket = resp.ticket as string;
    this.agentTicketExpiresAt = now + (resp.expires_in as number || 7200);
    return this.agentTicket;
  }

  /** 生成 JS-SDK 签名 */
  static makeSignature(ticket: string, url: string): SignatureResult {
    const nonceStr = uuidv4().replace(/-/g, '');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signStr = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');
    return { timestamp, nonceStr, signature };
  }

  /** 获取企业签名 */
  async getConfigSignature(url: string): Promise<SignatureResult> {
    const ticket = await this.getCorpTicket();
    return JsSdkService.makeSignature(ticket, url);
  }

  /** 获取应用签名 */
  async getAgentConfigSignature(url: string): Promise<SignatureResult> {
    const ticket = await this.getAgentTicket();
    return JsSdkService.makeSignature(ticket, url);
  }
}
```

### 7.3 Go — 服务端签名服务

```go
package wecom

import (
	"crypto/sha1"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// JsSdkService JS-SDK 签名服务
type JsSdkService struct {
	Client             *Client
	corpTicket         string
	corpTicketExpires  time.Time
	agentTicket        string
	agentTicketExpires time.Time
	mu                 sync.Mutex
}

// SignatureResult 签名结果
type SignatureResult struct {
	Timestamp string `json:"timestamp"`
	NonceStr  string `json:"nonceStr"`
	Signature string `json:"signature"`
}

// NewJsSdkService 创建 JS-SDK 签名服务
func NewJsSdkService(client *Client) *JsSdkService {
	return &JsSdkService{Client: client}
}

// GetCorpTicket S1: 获取企业 jsapi_ticket
func (s *JsSdkService) GetCorpTicket() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.corpTicket != "" && time.Now().Before(s.corpTicketExpires.Add(-5*time.Minute)) {
		return s.corpTicket, nil
	}

	result, err := s.Client.Request("GET", "/get_jsapi_ticket", nil)
	if err != nil {
		return "", err
	}
	s.corpTicket = result["ticket"].(string)
	expiresIn := int(result["expires_in"].(float64))
	s.corpTicketExpires = time.Now().Add(time.Duration(expiresIn) * time.Second)
	return s.corpTicket, nil
}

// GetAgentTicket S2: 获取应用 jsapi_ticket
func (s *JsSdkService) GetAgentTicket() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.agentTicket != "" && time.Now().Before(s.agentTicketExpires.Add(-5*time.Minute)) {
		return s.agentTicket, nil
	}

	result, err := s.Client.RequestWithParams("GET", "/ticket/get", nil, map[string]string{"type": "agent_config"})
	if err != nil {
		return "", err
	}
	s.agentTicket = result["ticket"].(string)
	expiresIn := int(result["expires_in"].(float64))
	s.agentTicketExpires = time.Now().Add(time.Duration(expiresIn) * time.Second)
	return s.agentTicket, nil
}

// MakeSignature 生成 JS-SDK 签名
func MakeSignature(ticket, url string) SignatureResult {
	nonceStr := uuid.New().String()[:32]
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	signStr := fmt.Sprintf("jsapi_ticket=%s&noncestr=%s&timestamp=%s&url=%s",
		ticket, nonceStr, timestamp, url)
	h := sha1.New()
	h.Write([]byte(signStr))
	signature := fmt.Sprintf("%x", h.Sum(nil))
	return SignatureResult{timestamp, nonceStr, signature}
}

// GetConfigSignature 获取企业签名
func (s *JsSdkService) GetConfigSignature(url string) (SignatureResult, error) {
	ticket, err := s.GetCorpTicket()
	if err != nil {
		return SignatureResult{}, err
	}
	return MakeSignature(ticket, url), nil
}

// GetAgentConfigSignature 获取应用签名
func (s *JsSdkService) GetAgentConfigSignature(url string) (SignatureResult, error) {
	ticket, err := s.GetAgentTicket()
	if err != nil {
		return SignatureResult{}, err
	}
	return MakeSignature(ticket, url), nil
}
```

### 7.4 前端 — 完整接入模板

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeCom JS-SDK Demo</title>
    <script src="https://wwcdn.weixin.qq.com/node/open/js/wecom-jssdk-2.3.4.js"></script>
</head>
<body>
<script>
// ── 1. 注册 ──
ww.register({
    corpId: 'YOUR_CORP_ID',
    agentId: YOUR_AGENT_ID,
    jsApiList: [
        'scanQRCode',
        'getLocation',
        'selectExternalContact',
        'getCurExternalContact',
        'getContext',
    ],
    async getConfigSignature(url) {
        const resp = await fetch(`/api/jssdk/config-signature?url=${encodeURIComponent(url)}`)
        return resp.json()
    },
    async getAgentConfigSignature(url) {
        const resp = await fetch(`/api/jssdk/agent-signature?url=${encodeURIComponent(url)}`)
        return resp.json()
    },
})

// ── 2. 获取上下文 ──
async function init() {
    const ctx = await ww.getContext()
    console.log('entry:', ctx.entry)

    if (ctx.entry === 'single_chat_tools') {
        // 聊天工具栏场景
        const { userId } = await ww.getCurExternalContact()
        console.log('当前外部联系人:', userId)
    }
}

// ── 3. 扫一扫 ──
async function doScan() {
    const { resultStr } = await ww.scanQRCode({ needResult: 1 })
    alert('扫码结果: ' + resultStr)
}

// ── 4. 获取位置 ──
async function doLocation() {
    const { latitude, longitude } = await ww.getLocation({ type: 'gcj02' })
    alert(`位置: ${latitude}, ${longitude}`)
}

init()
</script>
</body>
</html>
```

---


### 7.5 Java 示例

```java
public class WecomJssdkService {
    private final WeComClient client;

    public WecomJssdkService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-jssdk 相关 API
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

### 7.6 PHP 示例

```php
<?php
class WecomJssdkService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-jssdk 相关 API
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

## 8. Test Templates

### 8.1 Python (pytest)

```python
"""Tests for JsSdkService"""
import pytest
import hashlib
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    from wecom_core import WeComClient
    with patch.object(WeComClient, '_refresh_token'):
        c = WeComClient("test_corp", "test_secret")
        c._token = "mock_token"
        c._token_expires_at = float('inf')
        return c


@pytest.fixture
def service(client):
    from wecom_jssdk import JsSdkService
    return JsSdkService(client)


class TestGetTicket:
    """S1/S2: jsapi_ticket 获取与缓存"""

    def test_获取企业ticket(self, service):
        with patch.object(service.client, "get", return_value={
            "errcode": 0, "ticket": "CORP_TICKET_001", "expires_in": 7200,
        }):
            ticket = service.get_corp_ticket()
            assert ticket == "CORP_TICKET_001"

    def test_ticket缓存生效(self, service):
        with patch.object(service.client, "get", return_value={
            "errcode": 0, "ticket": "CORP_TICKET_001", "expires_in": 7200,
        }) as mock_get:
            service.get_corp_ticket()
            service.get_corp_ticket()  # 第二次应命中缓存
            assert mock_get.call_count == 1


class TestSignature:
    """签名算法"""

    def test_签名算法正确性(self):
        from wecom_jssdk import JsSdkService
        # 使用官方示例验证
        result = JsSdkService.make_signature.__func__(
            None,  # static method
            ticket="sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg",
            url="http://mp.weixin.qq.com?params=value",
        )
        # 不验证具体值（因为含随机数），验证格式
        assert len(result["signature"]) == 40  # SHA-1 hex
        assert result["timestamp"].isdigit()
        assert len(result["nonceStr"]) == 32

    def test_签名格式(self):
        from wecom_jssdk import JsSdkService
        result = JsSdkService.make_signature(
            ticket="test_ticket",
            url="https://example.com/path?a=1&b=2",
        )
        assert "timestamp" in result
        assert "nonceStr" in result
        assert "signature" in result
```

---

## 9. Code Review Checklist

### 9.1 签名安全

| # | 检查项 | 严重度 |
|---|--------|--------|
| R1 | 签名是否在**服务端**完成（前端不暴露 jsapi_ticket） | CRITICAL |
| R2 | jsapi_ticket 是否有**缓存机制**（频率极低 400/h） | CRITICAL |
| R3 | 签名字符串拼接顺序是否正确（jsapi_ticket→noncestr→timestamp→url） | HIGH |
| R4 | URL 是否不含 `#` 及后面部分 | HIGH |
| R5 | 签名字符串是否**未做 URL encode** | HIGH |

### 9.2 前端接入

| # | 检查项 | 严重度 |
|---|--------|--------|
| R6 | 是否使用新版 `@wecom/jssdk`（而非旧版 `jweixin`） | MEDIUM |
| R7 | 需应用权限的 API 是否同时提供了 `getAgentConfigSignature` | HIGH |
| R8 | `jsApiList` 是否包含了所有需要使用的接口 | HIGH |
| R9 | 可信域名是否已配置且通过验证 | CRITICAL |

### 9.3 通用

| # | 检查项 | 严重度 |
|---|--------|--------|
| R10 | 是否正确处理了 `ww.register` 异步时序 | HIGH |
| R11 | 企业 ticket 与应用 ticket 是否分开缓存 | HIGH |
| R12 | 生产环境是否移除了 `ww.getSignature` 快速签名 | CRITICAL |

---

## 10. Gotcha Guide

### G1. 两种 ticket 不要混淆

- **企业 ticket** (`/get_jsapi_ticket`) → 用于 `getConfigSignature`
- **应用 ticket** (`/ticket/get?type=agent_config`) → 用于 `getAgentConfigSignature`

两者接口不同、缓存分开、用途不同，混用会导致 `invalid signature`。

### G2. URL 必须去掉 # 及后面部分

签名用的 URL 是浏览器 `location.href` **去掉 `#` 及后面部分**。SPA 路由（Vue Router hash 模式）需特别注意。

### G3. 签名参数顺序固定

拼接顺序必须是 `jsapi_ticket→noncestr→timestamp→url`，不要按字母排序或自定义顺序。

### G4. jsapi_ticket 必须缓存

频率限制 400次/小时/企业、100次/小时/应用。如果每个页面都实时获取，很快会被限流返回错误。ticket 有效期 2 小时，过期前 5 分钟刷新即可。

### G5. ww.register 后可以立即调用 API

不需要等待注册回调。JS-SDK 内部自行处理时序，`ww.register()` 之后直接 `ww.scanQRCode()` 是安全的。

### G6. 旧版 jweixin vs 新版 @wecom/jssdk

旧版用 `wx.config()` + `wx.agentConfig()`，新版统一为 `ww.register()`。如果旧代码迁移，参考文档的迁移指南表格逐个替换接口名。

### G7. 客户联系 API 需要应用身份

`selectExternalContact`、`getCurExternalContact`、`openExistedChatWithMsg` 等客户联系 API 需要**应用身份权限**（同时提供企业签名和应用签名）。仅有企业签名会返回 `no permission`。

### G8. getCurExternalContact 仅限特定入口

`getCurExternalContact()` 仅在以下入口有效：
- 联系人详情页打开的 H5
- 聊天工具栏（single_chat_tools）

在工作台等普通入口调用会返回错误。先用 `ww.getContext()` 判断 `entry` 值再调用。

### G9. uploadVoice/uploadImage 返回的 serverId 即 media_id

JSSDK 上传音频/图片接口返回的 `serverId` 就是标准的 `media_id`，可以直接传给服务端 API 使用。有效期同样是 3 天。

### G10. 开发环境 getSignature 不可用于生产

`ww.getSignature(JSAPI_TICKET)` 是开发便利工具，会在前端暴露 ticket。生产环境必须替换为服务端签名。

---

## 10.5 深色模式适配指南

> 来源：https://developer.work.weixin.qq.com/document/path/94555
> 企业微信 iOS / Android 客户端 3.1.8 版本起支持深色模式。

### 识别深色模式

**方案一：CSS 媒体查询**（iOS 推荐）

```css
/* 浅色模式（默认） */
:root {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  --border-color: #e5e5e5;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1c1c1e;
    --text-primary: #f5f5f7;
    --border-color: #38383a;
  }
}
```

**方案二：User-Agent 判断**（Android 推荐，Android 端暂不支持媒体查询）

```javascript
// Android 端通过 UA 识别深色模式
const isDarkMode = /ColorScheme\/Dark/i.test(navigator.userAgent);

if (isDarkMode) {
  document.body.setAttribute('data-color-mode', 'dark');
}
```

**方案三：统一方案**（推荐）

```javascript
function isDarkMode() {
  // 优先使用媒体查询
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  // Android fallback
  return /ColorScheme\/Dark/i.test(navigator.userAgent);
}

document.body.setAttribute('data-color-mode', isDarkMode() ? 'dark' : 'light');

// 监听模式切换
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  document.body.setAttribute('data-color-mode', e.matches ? 'dark' : 'light');
});
```

### 设计规范

企业微信提供了深色模式配色板，核心原则：

| 元素 | 浅色模式 | 深色模式 | 说明 |
|------|---------|---------|------|
| 页面背景 | `#F7F7F7` | `#000000` | 纯黑在 OLED 上省电 |
| 卡片背景 | `#FFFFFF` | `#1C1C1E` | 抬起感 |
| 主要文字 | `#333333` | `#F5F5F7` | 高对比度 |
| 次要文字 | `#999999` | `#8E8E93` | 中等灰 |
| 分割线 | `#E5E5E5` | `#38383A` | 低调分割 |
| 品牌绿 | `#07C160` | `#07C160` | 保持不变 |

> ⚠️ **不要简单反色**。深色模式不是浅色的反相，需要调低对比度、降低彩度，减少视觉压力。
> 
> 设计资源：[企业微信应用深色模式配色板 (Sketch)](https://dldir1.qq.com/foxmail/wwopen_docFile/static/%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E5%BA%94%E7%94%A8%E6%B7%B1%E8%89%B2%E6%A8%A1%E5%BC%8F%E9%85%8D%E8%89%B2%E6%9D%BF.sketch)

---

## 11. References

| doc_id | 标题 | 说明 |
|--------|------|------|
| 90506 (14924) | JS-SDK 签名算法 | 签名拼接规则、企业/应用 ticket 获取 |
| 90547 (14931) | 开始使用 (自建应用) | 安装、注册、鉴权、接口约定、旧版迁移 |
| 90514 (14931) | 开始使用 (第三方应用) | 同上，第三方视角 |
| 94313 | ww.register | 新版注册 API 详细参数 |
| 94314-94329 | 各客户端 API | 通讯录/客户联系/会话/扫码/位置/音频/图像/文件/分享/系统 |

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

**依赖 SKILL**：`wecom-core`（Token 管理、错误处理）、`wecom-media`（uploadVoice/uploadImage 返回的 media_id 后续处理）


