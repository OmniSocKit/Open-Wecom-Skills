---
name: wecom-3rd-data
description: |
  企业微信第三方应用数据 API 专区。当 AI 遇到以下任务时自动激活：
  - 数据与智能专区接入
  - 获客公开组件
  - 第三方会话存档
  - AI 模型调用（话术推荐/情感分析/会话摘要）
  TRIGGER: 数据API | 数据专区 | 获客组件 | 会话存档(第三方) | AI模型
---

# WeCom Third-Party Data API（第三方数据 API 专区）

> 参考：https://developer.work.weixin.qq.com/document/path/101439

---

## 1. 前置条件

| 条件 | 说明 |
|------|------|
| 应用类型 | 第三方应用（已上架或测试中） |
| 已读 SKILL | `wecom-isv-core`、`wecom-3rd-quickstart` |
| 专区开通 | 需在服务商管理后台开通数据与智能专区 |
| 授权 | 企业需授权数据 API 相关权限 |

---

## 2. 核心概念

### 2.1 数据 API 概述

数据 API 是企业微信为第三方应用提供的高级数据分析能力，分为三大模块：

```
数据 API 专区
├── 获客公开组件 ─── 获客链接 + 客户信息 + 事件通知
├── 数据与智能专区
│   ├── 配置管理 ─── 公钥/回调/日志/文件上传
│   ├── 专区程序调用 ─── 同步/异步调用
│   ├── 会话存档 ─── 记录获取/搜索/关键词/导出
│   └── AI 模型 ─── 通用/话术/情感/摘要/标签/反垃圾
└── 回调事件 ─── 授权/会话/关键词/导出完成
```

### 2.2 权限与授权

| 权限 | 说明 |
|------|------|
| 获客助手 | 需企业授权「获客助手」权限 |
| 会话存档 | 需企业开通会话存档功能并授权 |
| AI 模型 | 需企业授权数据与智能专区 |

### 2.3 专区许可购买

数据 API 专区采用**按接口 × 时长**的计费模式：

| API | 购买 | 路径 |
|-----|------|------|
| 下单购买 | POST | `/service/contact/batchorder/place_order` |
| 取消订单 | POST | `/service/contact/batchorder/cancel_order` |
| 余额支付 | POST | `/service/contact/batchorder/pay` |
| 获取订单列表 | POST | `/service/contact/batchorder/list` |
| 获取订单详情 | POST | `/service/contact/batchorder/get` |
| 获取已购信息 | POST | `/service/contact/batchorder/get_purchased` |

---

## 3. API 速查表

### 获客公开组件

| API | 方法 | 路径 |
|-----|------|------|
| 获取组件授权信息 | POST | `/externalcontact/customer_acquisition/get_auth_info` |
| 获客链接管理 | POST | `/externalcontact/customer_acquisition_link/*` |
| 查询链接使用详情 | POST | `/externalcontact/customer_acquisition/statistic` |
| 获取客户信息 | POST | `/externalcontact/customer_acquisition/customer` |

### 数据与智能专区 — 配置管理

| API | 方法 | 路径 |
|-----|------|------|
| 设置公钥 | POST | `/msgaudit/set_public_key` |
| 获取授权存档成员列表 | POST | `/msgaudit/get_permit_user_list` |
| 设置专区回调 | POST | `/msgaudit/set_callback` |
| 设置日志级别 | POST | `/msgaudit/set_log_level` |
| 上传临时文件 | POST | `/msgaudit/upload_tmp_file` |

### 数据与智能专区 — 会话存档

| API | 方法 | 路径 |
|-----|------|------|
| 获取会话记录 | POST | `/msgaudit/get_chat_data` |
| 获取会话同意情况 | POST | `/msgaudit/check_single_agree` |
| 获取内部群信息 | POST | `/msgaudit/get_inner_group` |
| 会话名称搜索 | POST | `/msgaudit/search_session` |
| 会话消息搜索 | POST | `/msgaudit/search_message` |
| 关键词规则管理 | POST | `/msgaudit/keyword_rule/*` |
| 会话内容导出 | POST | `/msgaudit/export` |

### 数据与智能专区 — AI 模型

| API | 方法 | 路径 |
|-----|------|------|
| 通用模型 | POST | `/msgaudit/model/general` |
| 话术推荐 | POST | `/msgaudit/model/recommend` |
| 客户标签 | POST | `/msgaudit/model/tag` |
| 会话摘要 | POST | `/msgaudit/model/summary` |
| 情感分析 | POST | `/msgaudit/model/sentiment` |
| 会话反垃圾 | POST | `/msgaudit/model/antispam` |

---

## 4. API 详情

### 4.1 获取会话记录

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/msgaudit/get_chat_data?access_token=TOKEN`
- **请求**:
```json
{
  "seq": 0,
  "limit": 1000,
  "proxy": "",
  "passwd": "",
  "timeout": 10
}
```
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "chatdata": [
    {
      "seq": 1,
      "msgid": "xxx",
      "publickey_ver": 1,
      "encrypt_random_key": "...",
      "encrypt_chat_msg": "..."
    }
  ]
}
```
- **注意**: 消息内容使用 RSA 加密，需用设置的公钥对应私钥解密

### 4.2 AI 模型 — 情感分析

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/msgaudit/model/sentiment?access_token=TOKEN`
- **请求**:
```json
{
  "chat_id": "xxx",
  "seq_range": { "begin_seq": 1, "end_seq": 100 }
}
```
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "result": {
    "sentiment": "positive",
    "score": 0.85,
    "detail": [...]
  }
}
```

### 4.3 获客公开组件 — 获取组件授权信息

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/customer_acquisition/get_auth_info?suite_access_token=TOKEN`
- **请求**: `{}`
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "auth_info": {
    "link_id_list": ["link_xxx"],
    "status": 1
  }
}
```

---

## 5. 回调事件

| 事件 | InfoType | 说明 |
|------|----------|------|
| 客户同意存档 | `msgaudit_approve` | 客户同意该成员进行会话内容存档 |
| 产生会话 | `msgaudit_notify` | 有新的会话消息需要获取 |
| 命中关键词 | `msgaudit_keyword_hit` | 会话中命中关键词规则 |
| 导出完成 | `msgaudit_export_finish` | 会话内容导出任务完成 |
| 获客助手事件 | `customer_acquisition` | 获客链接相关事件 |

---

## 6. 代码模板

### 6.1 Python 示例

```python
"""第三方数据 API 客户端"""
import requests


class DataAPIClient:
    def __init__(self, access_token: str):
        self.token = access_token
        self.base = 'https://qyapi.weixin.qq.com/cgi-bin'

    def _post(self, path: str, body: dict = None) -> dict:
        resp = requests.post(
            f'{self.base}{path}?access_token={self.token}',
            json=body or {}, timeout=30,
        ).json()
        assert resp['errcode'] == 0, f"API 失败: {resp}"
        return resp

    # ── 会话存档 ──

    def get_chat_data(self, seq: int = 0, limit: int = 1000) -> list:
        """获取会话记录"""
        resp = self._post('/msgaudit/get_chat_data', {'seq': seq, 'limit': limit})
        return resp.get('chatdata', [])

    def check_agree(self, info: list) -> list:
        """检查会话同意情况"""
        resp = self._post('/msgaudit/check_single_agree', {'info': info})
        return resp.get('agreeinfo', [])

    def search_message(self, keyword: str, **kwargs) -> dict:
        """搜索会话消息"""
        body = {'keyword': keyword, **kwargs}
        return self._post('/msgaudit/search_message', body)

    # ── AI 模型 ──

    def sentiment_analysis(self, chat_id: str, begin_seq: int, end_seq: int) -> dict:
        """情感分析"""
        return self._post('/msgaudit/model/sentiment', {
            'chat_id': chat_id,
            'seq_range': {'begin_seq': begin_seq, 'end_seq': end_seq},
        })

    def recommend_speech(self, chat_id: str, begin_seq: int, end_seq: int) -> dict:
        """话术推荐"""
        return self._post('/msgaudit/model/recommend', {
            'chat_id': chat_id,
            'seq_range': {'begin_seq': begin_seq, 'end_seq': end_seq},
        })

    def summarize(self, chat_id: str, begin_seq: int, end_seq: int) -> dict:
        """会话摘要"""
        return self._post('/msgaudit/model/summary', {
            'chat_id': chat_id,
            'seq_range': {'begin_seq': begin_seq, 'end_seq': end_seq},
        })

    # ── 获客组件 ──

    def get_acquisition_auth_info(self, suite_token: str) -> dict:
        """获取获客组件授权信息"""
        resp = requests.post(
            f'{self.base}/externalcontact/customer_acquisition/get_auth_info?suite_access_token={suite_token}',
            json={}, timeout=10,
        ).json()
        assert resp['errcode'] == 0, f"API 失败: {resp}"
        return resp.get('auth_info', {})
```

### 6.2 TypeScript 示例

```typescript
import axios from 'axios';

export class DataAPIClient {
  private base = 'https://qyapi.weixin.qq.com/cgi-bin';
  constructor(private accessToken: string) {}

  private async post(path: string, body: any = {}): Promise<any> {
    const { data } = await axios.post(`${this.base}${path}?access_token=${this.accessToken}`, body);
    if (data.errcode !== 0) throw new Error(`API failed: ${data.errcode} ${data.errmsg}`);
    return data;
  }

  async getChatData(seq = 0, limit = 1000) { return this.post('/msgaudit/get_chat_data', { seq, limit }); }
  async sentimentAnalysis(chatId: string, beginSeq: number, endSeq: number) {
    return this.post('/msgaudit/model/sentiment', { chat_id: chatId, seq_range: { begin_seq: beginSeq, end_seq: endSeq } });
  }
  async searchMessage(keyword: string, opts: any = {}) { return this.post('/msgaudit/search_message', { keyword, ...opts }); }
}
```

### 6.3 Go 示例

```go
package thirdparty

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type DataAPIClient struct{ AccessToken string }

func (c *DataAPIClient) post(path string, body any) (map[string]any, error) {
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin%s?access_token=%s", path, c.AccessToken)
	resp, err := http.Post(url, "application/json", bytes.NewReader(b))
	if err != nil { return nil, err }
	defer resp.Body.Close()
	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)
	if code, _ := result["errcode"].(float64); code != 0 { return nil, fmt.Errorf("API failed: %v", code) }
	return result, nil
}

func (c *DataAPIClient) GetChatData(seq, limit int) (map[string]any, error) {
	return c.post("/msgaudit/get_chat_data", map[string]int{"seq": seq, "limit": limit})
}

func (c *DataAPIClient) SentimentAnalysis(chatID string, beginSeq, endSeq int) (map[string]any, error) {
	return c.post("/msgaudit/model/sentiment", map[string]any{
		"chat_id": chatID, "seq_range": map[string]int{"begin_seq": beginSeq, "end_seq": endSeq},
	})
}
```

### 6.4 Java 示例

```java
public class DataAPIClient {
    private final String accessToken;
    private final OkHttpClient http = new OkHttpClient();
    private final Gson gson = new Gson();

    public DataAPIClient(String accessToken) { this.accessToken = accessToken; }

    private JsonObject post(String path, JsonObject body) throws Exception {
        String url = "https://qyapi.weixin.qq.com/cgi-bin" + path + "?access_token=" + accessToken;
        RequestBody reqBody = RequestBody.create(gson.toJson(body), MediaType.parse("application/json"));
        Request req = new Request.Builder().url(url).post(reqBody).build();
        try (Response resp = http.newCall(req).execute()) {
            JsonObject json = gson.fromJson(resp.body().string(), JsonObject.class);
            if (json.get("errcode").getAsInt() != 0)
                throw new RuntimeException("API failed: " + json.get("errcode"));
            return json;
        }
    }

    public JsonObject getChatData(int seq, int limit) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("seq", seq);
        body.addProperty("limit", limit);
        return post("/msgaudit/get_chat_data", body);
    }
}
```

### 6.5 PHP 示例

```php
<?php
use GuzzleHttp\Client;

class DataAPIClient
{
    private string $accessToken;
    private Client $http;

    public function __construct(string $accessToken)
    {
        $this->accessToken = $accessToken;
        $this->http = new Client(['timeout' => 30]);
    }

    private function post(string $path, array $body = []): array
    {
        $resp = $this->http->post(
            "https://qyapi.weixin.qq.com/cgi-bin{$path}?access_token={$this->accessToken}",
            ['json' => $body]
        );
        $data = json_decode($resp->getBody()->getContents(), true);
        if (($data['errcode'] ?? 0) !== 0) throw new \RuntimeException("API failed: {$data['errcode']}");
        return $data;
    }

    public function getChatData(int $seq = 0, int $limit = 1000): array
    {
        return $this->post('/msgaudit/get_chat_data', ['seq' => $seq, 'limit' => $limit]);
    }

    public function sentimentAnalysis(string $chatId, int $beginSeq, int $endSeq): array
    {
        return $this->post('/msgaudit/model/sentiment', [
            'chat_id' => $chatId,
            'seq_range' => ['begin_seq' => $beginSeq, 'end_seq' => $endSeq],
        ]);
    }
}
```

---

## 7. 常见场景工作流

### 场景 1：接入会话存档

```
步骤 1: 生成 RSA 密钥对 → 调用 /msgaudit/set_public_key 设置公钥
步骤 2: 配置回调 → 调用 /msgaudit/set_callback 设置通知地址
步骤 3: 检查同意情况 → 调用 /msgaudit/check_single_agree
步骤 4: 拉取消息 → 轮询调用 /msgaudit/get_chat_data（按 seq 递增）
步骤 5: 用私钥解密 encrypt_random_key → 解密 encrypt_chat_msg
```

### 场景 2：AI 模型分析会话

```
步骤 1: 确认会话存档已开通且有消息
步骤 2: 情感分析 → /msgaudit/model/sentiment（看客户满意度）
步骤 3: 话术推荐 → /msgaudit/model/recommend（给客服建议回复）
步骤 4: 会话摘要 → /msgaudit/model/summary（提炼对话要点）
```

### 场景 3：获客公开组件

```
步骤 1: 获取组件授权 → /customer_acquisition/get_auth_info
步骤 2: 创建获客链接 → /customer_acquisition_link/create
步骤 3: 查看使用统计 → /customer_acquisition/statistic
步骤 4: 获取客户信息 → /customer_acquisition/customer
```

---

## 8. 测试模板

（遵循 wecom-core 测试规范第 6 节）

```python
"""
数据 API — 单元测试
"""
import pytest
from unittest.mock import patch, MagicMock
from data_api_client import DataAPIClient


@pytest.fixture
def client():
    return DataAPIClient(access_token="mock_token")


class TestChatData:

    @patch("requests.post")
    def test_获取会话记录_成功(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "chatdata": [
                {"seq": 1, "msgid": "msg_xxx", "publickey_ver": 1,
                 "encrypt_random_key": "...", "encrypt_chat_msg": "..."},
            ],
        })
        result = client.get_chat_data(seq=0, limit=100)
        assert len(result) == 1
        assert result[0]["seq"] == 1

    @patch("requests.post")
    def test_获取会话记录_无数据(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok", "chatdata": [],
        })
        result = client.get_chat_data(seq=999)
        assert result == []

    @patch("requests.post")
    def test_获取会话记录_token过期(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 42001, "errmsg": "access_token expired",
        })
        with pytest.raises(AssertionError, match="42001"):
            client.get_chat_data()


class TestAIModel:

    @patch("requests.post")
    def test_情感分析_成功(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "result": {"sentiment": "positive", "score": 0.85},
        })
        result = client.sentiment_analysis("chat_xxx", 1, 100)
        assert result["result"]["sentiment"] == "positive"

    @patch("requests.post")
    def test_话术推荐_成功(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "result": {"suggestions": ["建议回复1"]},
        })
        result = client.recommend_speech("chat_xxx", 1, 50)
        assert "suggestions" in result["result"]

    @patch("requests.post")
    def test_会话摘要_成功(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "result": {"summary": "客户咨询了产品价格"},
        })
        result = client.summarize("chat_xxx", 1, 50)
        assert "summary" in result["result"]


class TestSearchMessage:

    @patch("requests.post")
    def test_搜索消息_成功(self, mock_post, client):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "messages": [{"msgid": "msg_xxx", "content": "包含关键词"}],
        })
        result = client.search_message("关键词")
        assert "messages" in result
```

---

## 9. Code Review 检查清单

（遵循 wecom-core 代码审核规范第 7 节）

```
✅ 审核报告 - wecom-3rd-data

[安全性]
✅ access_token 通过参数传入，未硬编码
✅ token 未明文写入日志
✅ RSA 私钥存储提示（不在代码中硬编码）

[正确性]
✅ POST /msgaudit/get_chat_data → 端点正确
✅ POST /msgaudit/model/sentiment → 端点正确
✅ POST /msgaudit/model/recommend → 端点正确
✅ POST /msgaudit/model/summary → 端点正确
✅ POST /externalcontact/customer_acquisition/get_auth_info → 使用 suite_access_token

[健壮性]
✅ errcode 检查 → 存在
✅ 超时设置 → 30s（数据接口需较长超时）
⚠️ 系统繁忙重试 → 未实现（建议生产环境补充）
⚠️ RSA 解密异常处理 → 需用户自行补充

[测试]
✅ 成功场景测试 → 会话记录 / AI 模型 / 搜索
✅ 空数据场景测试 → 存在
✅ Token 过期测试 → 存在

审核结果: 通过 ✅（2 个 MEDIUM 建议项）
```

---

## 10. Gotcha Guide

### G1. 会话存档消息是 RSA 加密的
获取到的 `encrypt_chat_msg` 需要用你设置的公钥对应的**私钥**解密。不要混淆 RSA 密钥对和 EncodingAESKey。

### G2. AI 模型调用有额度限制
每个 AI 模型接口的调用次数有限制，超出后需购买额外额度。建议在调用前判断必要性。

### G3. 专区程序需要镜像部署
数据与智能专区的自有模型分析需要部署 Docker 镜像到企业微信指定的安全环境。

### G4. 获客组件需要独立授权
获客公开组件的权限独立于普通客户联系权限，企业需要单独授权。

---

## 11. References

| doc_id | 标题 |
|--------|------|
| 101439 | 数据 API 概述 |
| 101458 | 接入指引 |
| 101349-101390 | 数据与智能专区 API |
| 101359-101363 | 获客公开组件 API |
| 100296-100308 | 专区许可购买 |

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

**依赖 SKILL**：`wecom-isv-core`（凭证基座）、`wecom-3rd-quickstart`（总览）

