---
name: wecom-miniapp
description: |
  企业微信小程序接入 SKILL — 登录鉴权(wx.qy.login/code2Session)、基础接口、通讯录/客户联系/会话客户端 API、
  NFC、分享、直播/会议/日程/文档/微盘组件等
version: 1.0.0
domain: miniapp
depends_on: wecom-core
doc_ids: [16055, 16056, 16057, 19751, 16058, 16059, 16060, 21951, 34455, 16064, 24596, 21264, 29841, 29849, 30225, 16569, 16571, 16572, 16573, 16574, 16062, 16063, 28653, 29902, 16077, 16078, 16079, 16080, 15092, 16126, 16755, 34299, 16065, 21262, 16853, 21273, 15517, 23863, 16061, 19445, 30868, 31847, 31328, 31438, 30232, 30679, 33960, 37522, 38713, 40008, 40009, 16044, 16045, 16046, 19704, 17235, 13409]
client_api_count: 55
server_api_count: 1
triggers:
  - 小程序
  - miniapp
  - mini program
  - wx.qy
  - wx.qy.login
  - code2Session
  - wx.qy.getContext
  - wx.qy.selectExternalContact
  - wx.qy.getCurExternalContact
  - wx.qy.openEnterpriseChat
  - wx.qy.selectEnterpriseContact
  - wx.qy.getEnterpriseUserInfo
  - 联系我插件
---

# WeCom MiniApp SKILL (wecom-miniapp)

> 企业微信小程序接入 SKILL：覆盖小程序登录鉴权（wx.qy.login + code2Session）、55+ 客户端 API（通讯录/客户联系/会话/NFC/分享/直播/会议/日程/文档/微盘等）、开发指南。
> 与 `wecom-jssdk` 为并列关系：JS-SDK 面向 H5 网页应用，小程序 API 面向微信小程序。

---

## 1. Prerequisites

### 1.1 小程序关联企业微信

1. **企业微信管理后台 → 应用管理 → 小程序 → 关联小程序**
2. 填写小程序 AppID 完成关联
3. 设置小程序的**可见范围**

### 1.2 开发环境

- **开发者工具**：微信开发者工具 + 企业微信插件
- **npm 包**：无需额外安装，`wx.qy` 全局可用
- **调试**：可在企业微信客户端中打开小程序调试面板

### 1.3 与 JS-SDK 的区别

| 维度 | JS-SDK (wecom-jssdk) | 小程序 (wecom-miniapp) |
|------|---------------------|----------------------|
| 运行环境 | 企业微信内嵌 H5 页面 | 微信小程序 (关联企业微信) |
| SDK 引入 | npm/CDN `@wecom/jssdk` | 全局 `wx.qy` |
| 鉴权方式 | jsapi_ticket + SHA1 签名 | wx.qy.login + code2Session |
| 全局对象 | `ww` (新版) / `wx` (旧版) | `wx.qy` |
| 适用场景 | 网页应用 | 小程序应用 |

---

## 2. Core Concepts

### 2.1 登录流程

```
小程序端                                    服务端
┌───────────┐                           ┌──────────────┐
│ wx.qy.login()                         │              │
│ → 获得 code  ──────── code ──────────→ │ code2Session │
│                                       │ → session_key │
│                                       │ → userid      │
│ ← session_key + userid ←───────────── │ → corpid      │
│                                       │              │
│ wx.qy.checkSession()                  │              │
│ → 检查登录态是否过期                     │              │
└───────────┘                           └──────────────┘
```

### 2.2 API 分类

| 前缀 | 权限要求 | 典型 API |
|------|---------|---------|
| `wx.qy.*` | 企业微信专有 | login, getContext, selectExternalContact |
| `wx.*` | 微信通用 | getSystemInfo, navigateTo |

---

## 3. API Quick Reference

### 3.1 登录

| # | API | 类型 | 说明 |
|---|-----|------|------|
| L1 | `wx.qy.login` | 客户端 | 获取登录 code |
| L2 | `code2Session` | 服务端 | code 换取 session |
| L3 | `wx.qy.checkSession` | 客户端 | 检查登录态 |

### 3.2 基础接口

| # | API | 说明 |
|---|-----|------|
| B1 | `wx.qy.getContext` | 获取上下文（entry 场景） |
| B2 | `wx.qy.canIUse` | 检查 API 可用性 |
| B3 | `wx.qy.getSystemInfo` | 获取系统信息 |

### 3.3 企业通讯录

| # | API | 说明 |
|---|-----|------|
| U1 | `wx.qy.getEnterpriseUserInfo` | 获取企业用户信息 |
| U2 | `wx.qy.selectEnterpriseContact` | 选择通讯录成员 |
| U3 | `wx.qy.openUserProfile` | 打开个人资料页 |
| U4 | `wx.qy.getAvatar` | 获取头像 |
| U5 | `wx.qy.getMobile` | 获取手机号 |
| U6 | `wx.qy.getEmail` | 获取邮箱 |
| U7 | `wx.qy.getQrCode` | 获取二维码 |

### 3.4 客户联系

| # | API | 说明 |
|---|-----|------|
| C1 | `wx.qy.selectExternalContact` | 选择外部联系人 |
| C2 | `wx.qy.getCurExternalContact` | 获取当前外部联系人 |
| C3 | `wx.qy.getCurExternalChat` | 获取当前客户群 |
| C4 | `wx.qy.shareToExternalContact` | 分享到外部联系人 |
| C5 | `wx.qy.shareToExternalChat` | 分享到客户群 |
| C6 | `wx.qy.navigateToAddCustomer` | 跳转添加客户 |
| C7 | `wx.qy.shareToExternalMoments` | 分享到客户朋友圈 |

### 3.5 会话

| # | API | 说明 |
|---|-----|------|
| S1 | `wx.qy.openEnterpriseChat` | 打开会话 |
| S2 | `wx.qy.updateEnterpriseChat` | 变更群成员 |
| S3 | `wx.qy.sendChatMessage` | 发送消息 |
| S4 | `wx.qy.createCorpGroupChat` | 创建企业互联群 |

### 3.6 NFC

| # | API | 说明 |
|---|-----|------|
| N1 | `wx.qy.getNFCReaderState` | 获取 NFC 状态 |
| N2 | `wx.qy.startNFCReader` | 开始 NFC 读取 |
| N3 | `wx.qy.stopNFCReader` | 停止 NFC 读取 |
| N4 | `onNFCReadMessage` | NFC 读取消息回调 |

---

## 4. API Details

### L1. wx.qy.login — 登录

```javascript
wx.qy.login({
    success(res) {
        const code = res.code  // 登录 code，发送到服务端换取 session
        wx.request({
            url: 'https://your-server.com/api/login',
            data: { code },
            success(resp) {
                // resp.data = { userid, session_key, corpid }
            },
        })
    },
})
```

### L2. code2Session — 服务端

```
GET https://qyapi.weixin.qq.com/cgi-bin/miniprogram/jscode2session?access_token=ACCESS_TOKEN&js_code=CODE&grant_type=authorization_code
```

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| userid | string | 成员 userid |
| session_key | string | 会话密钥 |
| corpid | string | 企业 ID |

### B1. wx.qy.getContext — 获取上下文

```javascript
wx.qy.getContext({
    success(res) {
        console.log(res.entry)        // 'normal' | 'contact_profile' | 'single_chat_tools' | ...
        console.log(res.shareTicket)  // 如果从分享进入
    },
})
```

### C2. wx.qy.getCurExternalContact — 获取当前外部联系人

```javascript
wx.qy.getCurExternalContact({
    success(res) {
        console.log(res.userId)  // 外部联系人 external_userid
    },
})
```

### U2. wx.qy.selectEnterpriseContact — 选择通讯录成员

```javascript
wx.qy.selectEnterpriseContact({
    fromDepartmentId: 0,
    mode: 'multi',
    type: ['user', 'department'],
    success(res) {
        console.log(res.result.userList)
        console.log(res.result.departmentList)
    },
})
```

---

## 5. Code Templates

### 5.1 小程序端 — 完整登录 + 上下文判断

```javascript
// app.js
App({
    async onLaunch() {
        // 1. 检查登录态
        try {
            await new Promise((resolve, reject) => {
                wx.qy.checkSession({ success: resolve, fail: reject })
            })
        } catch {
            // 登录态过期，重新登录
            await this.login()
        }

        // 2. 判断入口场景
        wx.qy.getContext({
            success(res) {
                console.log('Entry:', res.entry)
                if (res.entry === 'single_chat_tools') {
                    // 聊天工具栏入口
                    wx.qy.getCurExternalContact({
                        success(r) { console.log('External user:', r.userId) },
                    })
                }
            },
        })
    },

    login() {
        return new Promise((resolve, reject) => {
            wx.qy.login({
                success(res) {
                    wx.request({
                        url: 'https://your-server.com/api/login',
                        method: 'POST',
                        data: { code: res.code },
                        success(resp) {
                            wx.setStorageSync('session', resp.data)
                            resolve(resp.data)
                        },
                        fail: reject,
                    })
                },
                fail: reject,
            })
        })
    },
})
```

### 5.2 Python — 服务端 code2Session

```python
"""WeCom MiniApp Session Service"""
from wecom_core import WeComClient


class MiniAppService:
    def __init__(self, client: WeComClient):
        self.client = client

    def code2session(self, js_code: str) -> dict:
        """L2: code 换取 session"""
        return self.client.get(
            "/miniprogram/jscode2session",
            params={"js_code": js_code, "grant_type": "authorization_code"},
        )
```

---


### 5.3 Java 示例

```java
public class WecomMiniappService {
    private final WeComClient client;

    public WecomMiniappService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-miniapp 相关 API
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

### 5.4 PHP 示例

```php
<?php
class WecomMiniappService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-miniapp 相关 API
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

## 6. Gotcha Guide

### G1. wx.qy vs wx
`wx.qy` 是企业微信专有 API 命名空间。普通微信小程序 API 仍用 `wx`。两者不冲突。

### G2. 小程序必须关联企业微信
在企业微信管理后台关联小程序后，小程序内才能使用 `wx.qy.*` API。

### G3. getCurExternalContact 入口限制
与 JS-SDK 相同，`getCurExternalContact` 仅在聊天工具栏/联系人详情等特定入口有效。

### G4. code 只能使用一次
`wx.qy.login` 获取的 `code` 只能调用一次 `code2Session`，不能重复使用。

### G5. 不要在前端存储 session_key
`session_key` 是敏感信息，应该只存储在服务端。前端只应持有自定义登录态标识。

### G6. canIUse 判断兼容性
不同版本的企业微信客户端支持的 API 不同。在调用新 API 前，用 `wx.qy.canIUse('apiName')` 判断兼容性。

---

## 7. References

| doc_id 范围 | 说明 |
|------------|------|
| 16055-16057 | 登录鉴权 |
| 16058-34455 | 基础接口 |
| 16062-16574 | 通讯录 |
| 16061-31847 | 客户联系 |
| 16064-29849 | 会话 |
| 16077-16080 | NFC |
| 13409-19704 | 开发指南 |

**依赖 SKILL**：`wecom-core`（服务端 code2Session 需要 access_token）


