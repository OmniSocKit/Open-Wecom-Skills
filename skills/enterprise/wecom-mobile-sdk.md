---
name: wecom-mobile-sdk
description: |
  企业微信移动端 SDK SKILL — iOS/Android/Harmony 原生应用接入企业微信登录、
  企业微信分享、App 跳转微信客服
version: 1.0.0
domain: mobile-sdk
depends_on: wecom-core
doc_ids: [10887, 10721, 10722, 59011, 10947, 10948, 59012, 31329]
api_count: 7
triggers:
  - 移动端SDK
  - mobile SDK
  - iOS SDK
  - Android SDK
  - Harmony SDK
  - 企业微信登录 App
  - 企业微信分享 App
  - App跳转客服
---

# WeCom Mobile SDK SKILL (wecom-mobile-sdk)

> 企业微信移动端 SDK SKILL：覆盖 iOS / Android / Harmony 原生应用接入企业微信登录、分享、App 跳转微信客服。
> 与 JS-SDK（网页应用）和小程序 API（微信小程序）并列，面向**原生移动应用**场景。

---

## 1. Prerequisites

### 1.1 SDK 获取

| 平台 | SDK 下载 | 最低版本 |
|------|---------|---------|
| iOS | 企微开发者中心下载 | iOS 11+ |
| Android | 企微开发者中心下载 | Android 5.0+ |
| Harmony | 企微开发者中心下载 | HarmonyOS 3.0+ |

### 1.2 管理后台配置

1. **管理后台 → 应用管理 → 自建应用 → 企业微信授权登录**
2. 填写 Bundle ID (iOS) / Package Name (Android) / Bundle Name (Harmony)
3. 填写 Schema（用于回调跳转）

---

## 2. 功能矩阵

| 功能 | iOS | Android | Harmony | 说明 |
|------|-----|---------|---------|------|
| 企业微信登录 | ✅ | ✅ | ✅ | OAuth 登录获取 code |
| 企业微信分享 | ✅ | ✅ | ✅ | 分享消息/图片/链接到企微 |
| App 跳转微信客服 | ✅ | ✅ | — | 跳转到微信客服会话 |

---

## 3. 企业微信登录

### 3.1 流程

```
原生 App                           企业微信 App              服务端
┌─────────┐                      ┌──────────┐           ┌──────────┐
│ 调用 SDK │ ──────────────────→ │ 用户授权  │           │          │
│ 发起登录 │                      │ 确认登录  │           │          │
│         │ ← code ─────────── │ 返回 code │           │          │
│         │                      └──────────┘           │          │
│ 发送code │ ──────────── code ────────────────────────→ │ /getuserinfo │
│ → 服务端 │                                             │ 返回 userid │
│ ← userid │ ← ──────── userid ─────────────────────── │          │
└─────────┘                                             └──────────┘
```

### 3.2 iOS 实现

```swift
// 1. AppDelegate 注册
import WWOpenSDK

func application(_ app: UIApplication, didFinishLaunchingWithOptions ...) -> Bool {
    WWKApi.registerApp("YOUR_SCHEMA", corpId: "YOUR_CORP_ID", agentId: "YOUR_AGENT_ID")
    return true
}

// 2. 处理回调
func application(_ app: UIApplication, open url: URL, ...) -> Bool {
    return WWKApi.handleOpen(url, delegate: self)
}

// 3. 发起登录
let req = WWKSendAuthReq()
req.state = "random_state_string"
req.scope = "snsapi_privateinfo"
WWKApi.send(req)

// 4. 接收回调
extension AppDelegate: WWKApiDelegate {
    func onResp(_ resp: WWKBaseResp) {
        if let authResp = resp as? WWKSendAuthResp {
            let code = authResp.code  // 发送到服务端换取 userid
        }
    }
}
```

### 3.3 Android 实现

```kotlin
// 1. Application 注册
import com.tencent.wework.api.WWAPIFactory

val api = WWAPIFactory.createWWAPI(context)
api.registerApp("YOUR_SCHEMA")

// 2. 发起登录
val req = WWAuthMessage.Req()
req.sch = "YOUR_SCHEMA"
req.appId = "YOUR_CORP_ID"
req.agentId = "YOUR_AGENT_ID"
req.state = "random_state"
api.sendMessage(req)

// 3. 在 WXEntryActivity 接收回调
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    api.handleIntent(intent, this)
}

override fun onMessage(message: WWBaseMessage.Resp) {
    if (message is WWAuthMessage.Resp) {
        val code = message.authCode  // 发送到服务端
    }
}
```

### 3.4 服务端验证

```python
"""服务端验证登录 code"""
from wecom_core import WeComClient

def verify_mobile_login(client: WeComClient, code: str) -> dict:
    """使用移动端 SDK 获取的 code 换取 userid"""
    return client.get("/user/getuserinfo", params={"code": code})
    # 返回 {"userid": "xxx", "user_ticket": "xxx"}
```

---

## 4. 企业微信分享

### 4.1 iOS 分享

```swift
// 分享链接到企业微信
let message = WWKSendMessageReq()
let linkObj = WWKMediaLink()
linkObj.title = "分享标题"
linkObj.description = "分享描述"
linkObj.webpageUrl = "https://example.com"
linkObj.thumbData = UIImage(named: "thumb")?.jpegData(compressionQuality: 0.5)
message.message.mediaObject = linkObj
WWKApi.send(message)
```

### 4.2 Android 分享

```kotlin
val msg = WWSendMessageToWW.Req()
val link = WWMediaLink()
link.title = "分享标题"
link.description = "分享描述"
link.thumbData = thumbBitmap
link.webpageUrl = "https://example.com"
msg.message.mediaObject = link
api.sendMessage(msg)
```

---

## 5. App 跳转微信客服

```swift
// iOS: 打开微信客服
let req = WWKOpenCustomerServiceChatReq()
req.corpId = "CORP_ID"
req.url = "https://work.weixin.qq.com/kfid/kfxxxxxx"
WWKApi.send(req)
```

```kotlin
// Android: 打开微信客服
val req = WWOpenCustomerServiceChat.Req()
req.corpId = "CORP_ID"
req.url = "https://work.weixin.qq.com/kfid/kfxxxxxx"
api.sendMessage(req)
```

---

## 6. Gotcha Guide

### G1. 必须安装企业微信 App
移动端 SDK 依赖设备上安装的企业微信 App。如果未安装，SDK 调用会失败。需在 App 中做降级处理。

### G2. Schema 注册
iOS 的 URL Schema 和 Android 的 Schema 都需要在管理后台注册，否则回调无法跳回 App。

### G3. Harmony 支持有限
Harmony SDK 是较新加入的，目前仅支持登录和分享，不支持 App 跳转客服。

### G4. code 只能使用一次
与小程序/网页登录一样，移动端 SDK 获取的 `code` 只能调用一次 `getuserinfo`。

### G5. 分享不支持小程序卡片
移动端 SDK 的分享只支持文本、图片、链接，不支持小程序卡片。需要小程序卡片分享请使用 JS-SDK。

---

## 7. 代码模板

### 7.1 Java 示例

```java
public class WecomMobileSdkService {
    private final WeComClient client;

    public WecomMobileSdkService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-mobile-sdk 相关 API
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

### 7.2 PHP 示例

```php
<?php
class WecomMobileSdkService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-mobile-sdk 相关 API
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

---

## 8. References

| doc_id | 标题 |
|--------|------|
| 10887 | 移动端SDK概述 |
| 10721 | iOS 企业微信登录 |
| 10722 | Android 企业微信登录 |
| 59011 | Harmony 企业微信登录 |
| 10947 | iOS 企业微信分享 |
| 10948 | Android 企业微信分享 |
| 59012 | Harmony 企业微信分享 |
| 31329 | App 跳转微信客服 |

**依赖 SKILL**：`wecom-core`（服务端 code 验证需要 access_token）
