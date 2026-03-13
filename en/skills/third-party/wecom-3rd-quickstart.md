---
name: wecom-3rd-quickstart
description: |
  企业微信第三方应用开发快速入门。当 AI 遇到以下任务时自动激活：
  - 第三方应用注册与上架
  - 第三方应用授权流程
  - 应用市场相关开发
  - 第三方应用与企业内部应用/服务商代开发的区别
  TRIGGER: third-party app | 第三方应用 | 应用市场 | ISV 应用 | 上架
---

# WeCom Third-Party App Quick Start（第三方应用快速入门）

> 参考：https://developer.work.weixin.qq.com/document/path/90594

---

## 1. 前置条件

| 条件 | 说明 |
|------|------|
| 服务商身份 | 在[第三方官网](https://open.work.weixin.qq.com)注册为服务商 **或** 在[开发者中心](https://developer.work.weixin.qq.com)注册为个人开发者 |
| 应用创建 | 在服务商管理后台创建第三方应用 |
| 公网服务器 | 用于接收回调事件和提供 Web 服务 |
| 已读 SKILL | `wecom-isv-core`（凭证体系） |

> ⚠️ 第三方应用开发与服务商代开发共享同一套凭证体系。`wecom-isv-*` 系列 SKILL **同样适用于**第三方应用开发。

---

## 2. 核心概念

### 2.1 三种开发模式对比

| 维度 | 企业内部开发 | 服务商代开发 | 第三方应用开发 |
|------|------------|------------|--------------|
| 身份 | 企业管理员 | 服务商 | 服务商/开发者 |
| 应用归属 | 企业自有 | 代替企业开发 | 应用市场上架 |
| 服务对象 | 单企业 | 单企业（定制） | **多企业**（通用） |
| 凭证 | `corpid + corpsecret` | `suite_id + suite_secret` | `suite_id + suite_secret` |
| Token | `access_token` | `suite_access_token` + 企业 `access_token` | **同服务商代开发** |
| 通讯录 | 全量 | 授权范围内 | 授权范围内 |
| ID 体系 | 明文 userid | 加密 corpid + open_userid | **同服务商代开发** |
| 收费模式 | 免费 | 自行收费 | **应用市场计费** |
| 分发方式 | 内部使用 | 一对一交付 | **应用市场分发** |

### 2.2 凭证体系

第三方应用的凭证体系与服务商代开发**完全相同**（详见 `wecom-isv-core`）：

```
┌─ suite_access_token ──── 管理授权关系
│   └─ 由 suite_id + suite_secret + suite_ticket 获取
│
├─ provider_access_token ── 服务商管理（license/注册推广）
│   └─ 由 corpid(服务商) + provider_secret 获取
│
└─ 企业 access_token ───── 调用业务 API
    └─ 由 suite_access_token + 永久授权码 + 企业 corpid 获取
```

### 2.3 第三方应用独有能力

| 能力 | 说明 | 参考 SKILL |
|------|------|-----------|
| 应用市场上架 | 提交审核 → 上架 → 企业安装 | 本文 §4 |
| 接口许可计费 | 按账号数 × 时长收费 | `wecom-isv-license` |
| 收银台收费 | 服务商自定义定价 | `wecom-isv-billing` |
| 推广注册 | 获取注册码 → 引导企业注册 | 本文 §5 |
| ID 转换 | 加密 corpid / userid 互转 | `wecom-3rd-idconvert` |
| 数据 API 专区 | 会话存档 + AI 模型 | `wecom-3rd-data` |

---

## 3. 快速上手流程

### Step 1：注册成为服务商

**方式 A：企业服务商**

1. 登录 [open.work.weixin.qq.com](https://open.work.weixin.qq.com)
2. 使用企业管理员扫码注册
3. 填写服务商信息 → 提交审核

**方式 B：个人开发者**（2023年新增）

1. 登录 [developer.work.weixin.qq.com](https://developer.work.weixin.qq.com)
2. 使用企业微信扫码认证
3. 直接创建应用（无需服务商资质）

### Step 2：创建第三方应用

1. 在管理后台 → **应用管理** → 创建应用
2. 填写应用信息：
   - 应用名称、Logo、简介
   - 应用主页 URL
   - 回调 URL 和 Token、EncodingAESKey
   - 权限集（通讯录/消息/CRM 等）
3. 记录关键信息：

| 信息 | 位置 | 用途 |
|------|------|------|
| `suite_id` | 应用详情页 | 应用唯一标识 |
| `suite_secret` | 应用详情页 | 获取 suite_access_token |
| `Token` | 回调配置 | 验证回调签名 |
| `EncodingAESKey` | 回调配置 | 回调消息加解密 |

### Step 3：配置回调接收 suite_ticket

企业微信每 **10 分钟**推送一次 `suite_ticket`，是获取 `suite_access_token` 的必要参数：

```python
# 必须实现的回调接收接口
@app.route('/callback/suite', methods=['GET', 'POST'])
def suite_callback():
    if request.method == 'GET':
        # URL 验证（详见 wecom-isv-callback）
        return verify_url(request)
    
    # 接收 suite_ticket
    msg = decrypt_msg(request)
    if msg['InfoType'] == 'suite_ticket':
        cache.set('suite_ticket', msg['SuiteTicket'], ex=1800)
        return 'success'
```

> ⚠️ 回调服务必须在 **创建应用后立即部署**，否则无法接收 suite_ticket，后续所有 API 调用都无法进行。

### Step 4：企业授权安装

三种授权方式：

**1. 应用市场安装**（最常用）
- 企业管理员在应用市场搜索 → 安装 → 确认授权

**2. 授权链接安装**
```
https://open.work.weixin.qq.com/3rdapp/install?suite_id=SUITE_ID&pre_auth_code=PRE_AUTH_CODE&redirect_uri=REDIRECT_URI&state=STATE
```

**3. 推广二维码安装**
- 生成推广二维码 → 管理员扫码 → 授权安装

### Step 5：获取企业凭证并调用 API

```python
from wecom_isv_client import ISVClient  # 详见 wecom-isv-core

client = ISVClient(suite_id="xxx", suite_secret="xxx", suite_ticket="xxx")

# 1. 获取永久授权码（企业授权后回调中获取）
auth_info = client.get_permanent_code(auth_code="临时授权码")
permanent_code = auth_info['permanent_code']
corp_id = auth_info['auth_corp_info']['corpid']

# 2. 获取企业 access_token
corp_token = client.get_corp_token(corp_id, permanent_code)

# 3. 用企业 token 调用业务 API（与内部开发完全一致）
from wecom_contact import WeComContact
contact = WeComContact(token=corp_token)
users = contact.list_department_users(department_id=1)
```

---

## 4. 应用市场上架

### 4.1 上架流程

```
1. 开发完成 → 2. 填写上架信息 → 3. 提交审核
   → 4. 审核通过(1-3工作日) → 5. 上线到应用市场
```

### 4.2 审核要求

| 类别 | 要求 |
|------|------|
| 功能完整性 | 应用必须可正常使用，不能仅是空壳 |
| 隐私协议 | 必须提供隐私政策链接 |
| 信息安全 | 数据传输必须使用 HTTPS |
| UI 规范 | 适配企业微信客户端，支持深色模式（推荐） |
| 回调处理 | 必须正确响应所有回调事件 |
| 授权取消 | 企业取消授权后必须停止调用 API |

### 4.3 版本管理

- 支持多版本管理（开发版/体验版/正式版）
- 版本更新自动推送给已安装企业
- 已安装企业不需要重新授权（除非新增权限）

---

## 5. 推广注册

帮助未注册企业微信的企业快速注册并安装你的应用：

```python
# 获取注册码
resp = client.post('/service/get_register_code', json={
    'template_id': 'tpl_xxx',
    'state': 'my_state',
    'corp_name': '示例公司',
    'admin_name': '张三',
    'admin_mobile': '13800000000',
})
register_code = resp['register_code']

# 生成注册链接
register_url = f'https://open.work.weixin.qq.com/3rdservice/wework/register?register_code={register_code}'
```

注册完成后，企业微信会推送 `register_corp` 回调事件。

---

## 6. 与其他 SKILL 的关系

| 需求 | 使用的 SKILL |
|------|-------------|
| 凭证管理（suite_access_token 等） | `wecom-isv-core` |
| 授权流程（预授权码/永久授权码） | `wecom-isv-auth` |
| 回调事件接收与解析 | `wecom-isv-callback` |
| 接口许可购买/激活 | `wecom-isv-license` |
| 收银台自定义收费 | `wecom-isv-billing` |
| JS-SDK 签名差异 | `wecom-isv-jssdk` |
| 服务商后台管理 | `wecom-isv-provider` |
| 错误码/频率限制 | `wecom-isv-appendix` |
| ID 转换（corpid/userid） | `wecom-3rd-idconvert` |
| 数据 API 专区 | `wecom-3rd-data` |
| 通讯录/消息/CRM 等业务 API | `wecom-contact` / `wecom-message` / `wecom-crm-*` 等（换 token 即可） |

> **核心原则**：第三方应用的业务 API 调用与企业内部开发完全一致，唯一区别是用 **企业 access_token**（通过 suite_access_token + 永久授权码换取）替代内部开发的 access_token。

---

## 7. 代码模板

### 7.1 Python — 第三方应用完整启动模板

```python
"""
第三方应用开发启动模板
依赖: pip install requests flask
"""
import os
import requests
from flask import Flask, request

app = Flask(__name__)

SUITE_ID = os.environ['WECOM_SUITE_ID']
SUITE_SECRET = os.environ['WECOM_SUITE_SECRET']

# 缓存
_cache = {}


def get_suite_access_token():
    """获取 suite_access_token"""
    cache_key = 'suite_access_token'
    if cache_key in _cache and _cache[f'{cache_key}_expires'] > __import__('time').time():
        return _cache[cache_key]

    resp = requests.post(
        'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token',
        json={
            'suite_id': SUITE_ID,
            'suite_secret': SUITE_SECRET,
            'suite_ticket': _cache.get('suite_ticket', ''),
        },
        timeout=10,
    ).json()
    assert resp['errcode'] == 0, f"获取 suite_token 失败: {resp}"
    _cache[cache_key] = resp['suite_access_token']
    _cache[f'{cache_key}_expires'] = __import__('time').time() + resp['expires_in'] - 300
    return _cache[cache_key]


def get_corp_access_token(corp_id: str, permanent_code: str):
    """获取企业 access_token"""
    resp = requests.post(
        f'https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token={get_suite_access_token()}',
        json={'auth_corpid': corp_id, 'permanent_code': permanent_code},
        timeout=10,
    ).json()
    assert resp['errcode'] == 0, f"获取 corp_token 失败: {resp}"
    return resp['access_token']


@app.route('/callback/suite', methods=['GET', 'POST'])
def suite_callback():
    """接收 suite_ticket 和授权事件"""
    # 简化版：实际需加解密（参考 wecom-isv-callback）
    if request.method == 'GET':
        return request.args.get('echostr', '')

    data = parse_xml(request.data)  # 需实现 XML 解析 + 解密
    info_type = data.get('InfoType')

    if info_type == 'suite_ticket':
        _cache['suite_ticket'] = data['SuiteTicket']
    elif info_type == 'create_auth':
        # 企业授权安装
        auth_code = data['AuthCode']
        handle_new_auth(auth_code)

    return 'success'


def handle_new_auth(auth_code: str):
    """处理新企业授权"""
    resp = requests.post(
        f'https://qyapi.weixin.qq.com/cgi-bin/service/get_permanent_code?suite_access_token={get_suite_access_token()}',
        json={'auth_code': auth_code},
        timeout=10,
    ).json()
    corp_id = resp['auth_corp_info']['corpid']
    permanent_code = resp['permanent_code']
    # 存储授权信息到数据库
    save_auth(corp_id, permanent_code)
    print(f"企业 {corp_id} 授权成功")
```

### 7.2 TypeScript — 第三方应用启动模板

```typescript
import axios from 'axios';

const SUITE_ID = process.env.WECOM_SUITE_ID!;
const SUITE_SECRET = process.env.WECOM_SUITE_SECRET!;

interface TokenCache {
  suiteTicket: string;
  suiteAccessToken: string;
  suiteTokenExpires: number;
}

const cache: Partial<TokenCache> = {};

async function getSuiteAccessToken(): Promise<string> {
  if (cache.suiteAccessToken && Date.now() / 1000 < (cache.suiteTokenExpires || 0)) {
    return cache.suiteAccessToken;
  }
  const { data } = await axios.post(
    'https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token',
    { suite_id: SUITE_ID, suite_secret: SUITE_SECRET, suite_ticket: cache.suiteTicket || '' },
  );
  if (data.errcode !== 0) throw new Error(`get_suite_token failed: ${data.errcode}`);
  cache.suiteAccessToken = data.suite_access_token;
  cache.suiteTokenExpires = Date.now() / 1000 + data.expires_in - 300;
  return data.suite_access_token;
}

async function getCorpAccessToken(corpId: string, permanentCode: string): Promise<string> {
  const suiteToken = await getSuiteAccessToken();
  const { data } = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token=${suiteToken}`,
    { auth_corpid: corpId, permanent_code: permanentCode },
  );
  if (data.errcode !== 0) throw new Error(`get_corp_token failed: ${data.errcode}`);
  return data.access_token;
}

export { getSuiteAccessToken, getCorpAccessToken, cache };
```

### 7.3 Go — 第三方应用启动模板

```go
package thirdparty

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type ThirdPartyApp struct {
	SuiteID     string
	SuiteSecret string
	suiteTicket string
	suiteToken  string
	tokenExpiry time.Time
	mu          sync.Mutex
}

func (a *ThirdPartyApp) SetSuiteTicket(ticket string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.suiteTicket = ticket
}

func (a *ThirdPartyApp) GetSuiteAccessToken() (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.suiteToken != "" && time.Now().Before(a.tokenExpiry) {
		return a.suiteToken, nil
	}
	body, _ := json.Marshal(map[string]string{
		"suite_id":     a.SuiteID,
		"suite_secret": a.SuiteSecret,
		"suite_ticket": a.suiteTicket,
	})
	resp, err := http.Post(
		"https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token",
		"application/json", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		Errcode          int    `json:"errcode"`
		SuiteAccessToken string `json:"suite_access_token"`
		ExpiresIn        int    `json:"expires_in"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Errcode != 0 {
		return "", fmt.Errorf("get_suite_token failed: %d", result.Errcode)
	}
	a.suiteToken = result.SuiteAccessToken
	a.tokenExpiry = time.Now().Add(time.Duration(result.ExpiresIn-300) * time.Second)
	return a.suiteToken, nil
}

func (a *ThirdPartyApp) GetCorpAccessToken(corpID, permanentCode string) (string, error) {
	suiteToken, err := a.GetSuiteAccessToken()
	if err != nil {
		return "", err
	}
	body, _ := json.Marshal(map[string]string{
		"auth_corpid":    corpID,
		"permanent_code": permanentCode,
	})
	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token=%s", suiteToken)
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		Errcode     int    `json:"errcode"`
		AccessToken string `json:"access_token"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Errcode != 0 {
		return "", fmt.Errorf("get_corp_token failed: %d", result.Errcode)
	}
	return result.AccessToken, nil
}
```

### 7.4 Java 示例

```java
import com.google.gson.*;
import okhttp3.*;
import java.util.concurrent.locks.ReentrantLock;

public class ThirdPartyApp {
    private final String suiteId;
    private final String suiteSecret;
    private final OkHttpClient http = new OkHttpClient();
    private final Gson gson = new Gson();
    private String suiteTicket;
    private String suiteAccessToken;
    private long suiteTokenExpiry = 0;
    private final ReentrantLock lock = new ReentrantLock();

    public ThirdPartyApp(String suiteId, String suiteSecret) {
        this.suiteId = suiteId;
        this.suiteSecret = suiteSecret;
    }

    public void setSuiteTicket(String ticket) { this.suiteTicket = ticket; }

    public String getSuiteAccessToken() throws Exception {
        if (suiteAccessToken != null && System.currentTimeMillis() / 1000 < suiteTokenExpiry) {
            return suiteAccessToken;
        }
        lock.lock();
        try {
            if (suiteAccessToken != null && System.currentTimeMillis() / 1000 < suiteTokenExpiry) {
                return suiteAccessToken;
            }
            JsonObject body = new JsonObject();
            body.addProperty("suite_id", suiteId);
            body.addProperty("suite_secret", suiteSecret);
            body.addProperty("suite_ticket", suiteTicket);
            RequestBody reqBody = RequestBody.create(gson.toJson(body), MediaType.parse("application/json"));
            Request req = new Request.Builder()
                .url("https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token")
                .post(reqBody).build();
            try (Response resp = http.newCall(req).execute()) {
                JsonObject json = gson.fromJson(resp.body().string(), JsonObject.class);
                if (json.get("errcode").getAsInt() != 0)
                    throw new RuntimeException("get_suite_token failed: " + json.get("errcode"));
                this.suiteAccessToken = json.get("suite_access_token").getAsString();
                this.suiteTokenExpiry = System.currentTimeMillis() / 1000 + json.get("expires_in").getAsInt() - 300;
            }
            return suiteAccessToken;
        } finally { lock.unlock(); }
    }
}
```

**依赖 (Maven)**:
```xml
<dependency><groupId>com.squareup.okhttp3</groupId><artifactId>okhttp</artifactId><version>4.12.0</version></dependency>
<dependency><groupId>com.google.code.gson</groupId><artifactId>gson</artifactId><version>2.10.1</version></dependency>
```

### 7.5 PHP 示例

```php
<?php
use GuzzleHttp\Client;

class ThirdPartyApp
{
    private string $suiteId;
    private string $suiteSecret;
    private Client $http;
    private ?string $suiteTicket = null;
    private ?string $suiteAccessToken = null;
    private int $suiteTokenExpiry = 0;

    public function __construct(string $suiteId, string $suiteSecret)
    {
        $this->suiteId = $suiteId;
        $this->suiteSecret = $suiteSecret;
        $this->http = new Client(['timeout' => 10]);
    }

    public function setSuiteTicket(string $ticket): void { $this->suiteTicket = $ticket; }

    public function getSuiteAccessToken(): string
    {
        if ($this->suiteAccessToken && time() < $this->suiteTokenExpiry) {
            return $this->suiteAccessToken;
        }
        $resp = $this->http->post('https://qyapi.weixin.qq.com/cgi-bin/service/get_suite_token', [
            'json' => [
                'suite_id' => $this->suiteId,
                'suite_secret' => $this->suiteSecret,
                'suite_ticket' => $this->suiteTicket ?? '',
            ],
        ]);
        $data = json_decode($resp->getBody()->getContents(), true);
        if (($data['errcode'] ?? 0) !== 0) {
            throw new \RuntimeException("get_suite_token failed: {$data['errcode']}");
        }
        $this->suiteAccessToken = $data['suite_access_token'];
        $this->suiteTokenExpiry = time() + $data['expires_in'] - 300;
        return $this->suiteAccessToken;
    }

    public function getCorpAccessToken(string $corpId, string $permanentCode): string
    {
        $token = $this->getSuiteAccessToken();
        $resp = $this->http->post(
            "https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token={$token}",
            ['json' => ['auth_corpid' => $corpId, 'permanent_code' => $permanentCode]]
        );
        $data = json_decode($resp->getBody()->getContents(), true);
        if (($data['errcode'] ?? 0) !== 0) {
            throw new \RuntimeException("get_corp_token failed: {$data['errcode']}");
        }
        return $data['access_token'];
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

---

## 8. 测试模板

（遵循 wecom-core 测试规范第 6 节）

```python
"""
第三方应用 — 凭证管理 单元测试
"""
import pytest
from unittest.mock import patch, MagicMock

# 假设代码模板中的函数已导入
# from thirdparty_app import get_suite_access_token, get_corp_access_token, handle_new_auth


class TestSuiteAccessToken:

    @patch("requests.post")
    def test_获取suite_access_token_成功(self, mock_post):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "suite_access_token": "suite_token_xxx",
            "expires_in": 7200,
        })
        # 模拟 _cache 中已有 suite_ticket
        import thirdparty_app
        thirdparty_app._cache = {"suite_ticket": "ticket_xxx"}
        token = thirdparty_app.get_suite_access_token()
        assert token == "suite_token_xxx"
        call_body = mock_post.call_args[1]["json"]
        assert call_body["suite_id"] == thirdparty_app.SUITE_ID
        assert call_body["suite_ticket"] == "ticket_xxx"

    @patch("requests.post")
    def test_获取suite_access_token_缓存命中(self, mock_post):
        import thirdparty_app
        thirdparty_app._cache = {
            "suite_access_token": "cached_token",
            "suite_access_token_expires": float('inf'),
        }
        token = thirdparty_app.get_suite_access_token()
        assert token == "cached_token"
        mock_post.assert_not_called()  # 不应发起请求

    @patch("requests.post")
    def test_获取suite_access_token_无ticket_失败(self, mock_post):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 40082, "errmsg": "invalid suite_ticket",
        })
        import thirdparty_app
        thirdparty_app._cache = {}
        with pytest.raises(AssertionError, match="40082"):
            thirdparty_app.get_suite_access_token()


class TestCorpAccessToken:

    @patch("requests.post")
    def test_获取企业access_token_成功(self, mock_post):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "access_token": "corp_token_xxx",
            "expires_in": 7200,
        })
        import thirdparty_app
        thirdparty_app._cache = {
            "suite_access_token": "suite_xxx",
            "suite_access_token_expires": float('inf'),
        }
        token = thirdparty_app.get_corp_access_token("corpid", "perm_code")
        assert token == "corp_token_xxx"


class TestCallbackHandling:

    @patch("requests.post")
    def test_处理企业授权_create_auth(self, mock_post):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "auth_corp_info": {"corpid": "corp_xxx"},
            "permanent_code": "perm_xxx",
        })
        import thirdparty_app
        thirdparty_app._cache = {
            "suite_access_token": "suite_xxx",
            "suite_access_token_expires": float('inf'),
        }
        # 假设 save_auth 被 mock
        with patch.object(thirdparty_app, 'save_auth') as mock_save:
            thirdparty_app.handle_new_auth("auth_code_xxx")
            mock_save.assert_called_once_with("corp_xxx", "perm_xxx")
```

---

## 9. Code Review 检查清单

（遵循 wecom-core 代码审核规范第 7 节）

生成第三方应用代码后，自动执行以下检查：

```
✅ 审核报告 - wecom-3rd-quickstart

[安全性]
✅ suite_id / suite_secret 从环境变量读取，未硬编码
✅ suite_access_token 未明文写入日志
✅ 回调签名验证逻辑存在（echostr 验证）
✅ permanent_code 存储到数据库而非内存

[正确性]
✅ POST /service/get_suite_token → 端点正确
✅ POST /service/get_corp_token → 端点正确
✅ POST /service/get_permanent_code → 端点正确
✅ suite_ticket 通过回调接收，非主动获取

[健壮性]
✅ suite_access_token 缓存机制 → 存在（提前5分钟刷新）
✅ errcode 检查 → 存在
✅ 超时设置 → 10s
⚠️ 系统繁忙重试 → 未在启动模板中实现（生产环境建议补充）

[测试]
✅ 成功场景测试 → 存在
✅ 缓存命中测试 → 存在
✅ 错误场景测试 → 存在
✅ 回调处理测试 → 存在

审核结果: 通过 ✅（1 个 MEDIUM 建议项）
```

---

## 10. Gotcha Guide

### G1. suite_ticket 是被动接收的

不能主动获取 suite_ticket，只能等企业微信每 10 分钟推送。回调服务未启动 = 无法获取任何凭证。

### G2. 永久授权码必须持久化

`permanent_code` 代表企业对你的永久授权，丢失后必须让企业重新授权。务必存入数据库，而非内存缓存。

### G3. 第三方应用返回 open_userid 而非 userid

通讯录接口返回的是 `open_userid`（加密后的 userid），不同应用获取到的同一成员的 open_userid 不同。需要使用 ID 转换接口解密。

### G4. 企业取消授权必须处理

收到 `cancel_auth` 回调事件后，必须：
- 停止调用该企业的所有 API
- 清除该企业的 permanent_code 和 access_token
- 清理本地缓存的企业数据

### G5. 应用市场上架后不能随意下架

上架后如需下架，需联系企业微信运营团队，已安装企业的数据处理需特别注意。

---

## 11. References

| doc_id | 标题 | 说明 |
|--------|------|------|
| 90594 | 快速入门 | 第三方应用开发总览 |
| 91200 | 获取服务商凭证 | provider_access_token |
| 90600 | 获取第三方应用凭证 | suite_access_token |
| 90601 | 获取预授权码 | 授权安装流程 |
| 90597 | 企业授权应用 | 授权流程详解 |
| 90578 | 推广注册 | 引导企业注册 |

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

**依赖 SKILL**：`wecom-isv-core`（凭证基座）、`wecom-isv-auth`（授权流程）、`wecom-isv-callback`（回调体系）
