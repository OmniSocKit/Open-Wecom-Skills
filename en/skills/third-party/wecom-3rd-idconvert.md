---
name: wecom-3rd-idconvert
description: |
  企业微信第三方应用 ID 转换与安全升级。当 AI 遇到以下任务时自动激活：
  - corpid / userid / external_userid 加密转换
  - open_userid 处理
  - 第三方应用 ID 迁移
  - unionid 与 external_userid 关联
  TRIGGER: ID 转换 | corpid 转换 | open_userid | ID 迁移 | 安全升级
---

# WeCom Third-Party ID Conversion（第三方 ID 转换与安全升级）

> 参考：https://developer.work.weixin.qq.com/document/path/95890

---

## 1. 前置条件

| 条件 | 说明 |
|------|------|
| 已读 SKILL | `wecom-isv-core`（凭证体系）、`wecom-3rd-quickstart`（总览） |
| 凭证 | `suite_access_token` 或 `provider_access_token` |

---

## 2. 核心概念

### 2.1 为什么需要 ID 转换？

企业微信 2022 年安全升级后，第三方应用获取到的 ID 都是**加密形式**：

| ID 类型 | 内部开发 | 第三方应用 |
|---------|---------|-----------|
| 企业 ID | 明文 `corpid` | 加密 `corpid`（第三方专属） |
| 成员 ID | 明文 `userid` | `open_userid`（应用间隔离） |
| 外部联系人 ID | `external_userid` | 加密 `external_userid` |

### 2.2 ID 隔离规则

- **open_userid**：同一成员在不同第三方应用中的 open_userid **不同**
- **加密 corpid**：每个第三方应用获取到的企业 corpid 也是加密后的，应用间不互通
- **external_userid**：第三方应用获取到的 external_userid 也是加密的

---

## 3. API 速查表

| API | 方法 | 路径 | Token |
|-----|------|------|-------|
| 明文 corpid → 加密 corpid | POST | `/service/corpid_to_opencorpid` | `provider_access_token` |
| userid 转换 | POST | `/batch/userid_to_openuserid` | `suite_access_token` |
| external_userid 转换 | POST | `/externalcontact/get_new_external_userid` | `suite_access_token` |
| unionid → external_userid | POST | `/externalcontact/unionid_to_external_userid` | `suite_access_token` |
| 客户标签 ID 转换 | POST | `/externalcontact/convert_tmp_external_userid` | `suite_access_token` |
| 微信客服 ID 转换 | POST | `/kf/convert_tmp_external_userid` | `suite_access_token` |

---

## 4. API 详情

### 4.1 明文 corpid → 加密 corpid

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/service/corpid_to_opencorpid?provider_access_token=TOKEN`
- **请求**:
```json
{ "corpid": "wwxxxxxx" }
```
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "open_corpid": "wpxxxxxx"
}
```

### 4.2 批量 userid → open_userid

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/batch/userid_to_openuserid?access_token=TOKEN`
- **Token**: 使用**企业 access_token**
- **请求**:
```json
{
  "userid_list": ["zhangsan", "lisi"],
  "source_agentid": 1000002
}
```
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "open_userid_list": [
    { "userid": "zhangsan", "open_userid": "woxxxxx" },
    { "userid": "lisi", "open_userid": "woyyyyy" }
  ],
  "invalid_userid_list": []
}
```
- **限制**: 每次最多 1000 个 userid

### 4.3 unionid → external_userid

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/unionid_to_external_userid?access_token=TOKEN`
- **Token**: 使用**企业 access_token**
- **请求**:
```json
{
  "unionid": "ozmysj...",
  "openid": "o6_bmjs...",
  "corpid": "wpxxxxxx",
  "source_agentid": 1000002
}
```
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "external_userid_info": [
    { "corpid": "wpxxxxxx", "external_userid": "wmxxxxxx" }
  ]
}
```

### 4.4 代开发应用 external_userid 转换

- **接口**: POST `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/get_new_external_userid?suite_access_token=TOKEN`
- **请求**:
```json
{
  "external_userid_list": ["wmxxxxxx", "wmyyyyyy"]
}
```
- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "items": [
    { "external_userid": "wmxxxxxx", "new_external_userid": "wmzzzzzz" }
  ]
}
```

---

## 5. 工作流

### 场景 1：新应用首次接入（ID 已加密）

```
1. 通讯录 API 直接返回 open_userid → 直接使用
2. 客户联系 API 直接返回加密 external_userid → 直接使用
3. 无需转换
```

### 场景 2：旧应用 ID 迁移

```
1. 调用 userid_to_openuserid 批量转换历史 userid
2. 调用 get_new_external_userid 转换历史 external_userid
3. 更新本地数据库
4. 设置 ID 迁移完成状态
```

---

## 6. 代码模板

### 6.1 Python 示例

```python
"""ID 转换工具"""
import requests


class IDConverter:
    def __init__(self, suite_access_token: str):
        self.suite_token = suite_access_token

    def corpid_to_opencorpid(self, corpid: str, provider_token: str) -> str:
        """明文 corpid → 加密 corpid"""
        resp = requests.post(
            f'https://qyapi.weixin.qq.com/cgi-bin/service/corpid_to_opencorpid?provider_access_token={provider_token}',
            json={'corpid': corpid}, timeout=10,
        ).json()
        assert resp['errcode'] == 0, f"转换失败: {resp}"
        return resp['open_corpid']

    def batch_userid_to_openuserid(self, corp_token: str, userid_list: list) -> dict:
        """批量 userid → open_userid（最多 1000 个）"""
        result = {}
        for i in range(0, len(userid_list), 1000):
            batch = userid_list[i:i+1000]
            resp = requests.post(
                f'https://qyapi.weixin.qq.com/cgi-bin/batch/userid_to_openuserid?access_token={corp_token}',
                json={'userid_list': batch}, timeout=10,
            ).json()
            assert resp['errcode'] == 0, f"转换失败: {resp}"
            for item in resp.get('open_userid_list', []):
                result[item['userid']] = item['open_userid']
        return result

    def unionid_to_external_userid(self, corp_token: str, unionid: str, openid: str) -> list:
        """unionid → external_userid"""
        resp = requests.post(
            f'https://qyapi.weixin.qq.com/cgi-bin/externalcontact/unionid_to_external_userid?access_token={corp_token}',
            json={'unionid': unionid, 'openid': openid}, timeout=10,
        ).json()
        assert resp['errcode'] == 0, f"转换失败: {resp}"
        return resp.get('external_userid_info', [])
```

### 6.2 TypeScript 示例

```typescript
import axios from 'axios';

export class IDConverter {
  constructor(private suiteAccessToken: string) {}

  async corpidToOpenCorpid(corpid: string, providerToken: string): Promise<string> {
    const { data } = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/service/corpid_to_opencorpid?provider_access_token=${providerToken}`,
      { corpid },
    );
    if (data.errcode !== 0) throw new Error(`转换失败: ${data.errcode}`);
    return data.open_corpid;
  }

  async batchUseridToOpenUserid(corpToken: string, useridList: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (let i = 0; i < useridList.length; i += 1000) {
      const batch = useridList.slice(i, i + 1000);
      const { data } = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/batch/userid_to_openuserid?access_token=${corpToken}`,
        { userid_list: batch },
      );
      if (data.errcode !== 0) throw new Error(`转换失败: ${data.errcode}`);
      for (const item of data.open_userid_list || []) {
        result[item.userid] = item.open_userid;
      }
    }
    return result;
  }
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

type IDConverter struct{ SuiteAccessToken string }

func (c *IDConverter) CorpidToOpenCorpid(corpid, providerToken string) (string, error) {
	body, _ := json.Marshal(map[string]string{"corpid": corpid})
	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/service/corpid_to_opencorpid?provider_access_token=%s", providerToken)
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil { return "", err }
	defer resp.Body.Close()
	var result struct {
		Errcode    int    `json:"errcode"`
		OpenCorpid string `json:"open_corpid"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Errcode != 0 { return "", fmt.Errorf("转换失败: %d", result.Errcode) }
	return result.OpenCorpid, nil
}
```

### 6.4 Java 示例

```java
public class IDConverter {
    private final OkHttpClient http = new OkHttpClient();
    private final Gson gson = new Gson();

    public String corpidToOpenCorpid(String corpid, String providerToken) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("corpid", corpid);
        String url = "https://qyapi.weixin.qq.com/cgi-bin/service/corpid_to_opencorpid?provider_access_token=" + providerToken;
        RequestBody reqBody = RequestBody.create(gson.toJson(body), MediaType.parse("application/json"));
        Request req = new Request.Builder().url(url).post(reqBody).build();
        try (Response resp = http.newCall(req).execute()) {
            JsonObject json = gson.fromJson(resp.body().string(), JsonObject.class);
            if (json.get("errcode").getAsInt() != 0)
                throw new RuntimeException("转换失败: " + json.get("errcode"));
            return json.get("open_corpid").getAsString();
        }
    }
}
```

### 6.5 PHP 示例

```php
<?php
use GuzzleHttp\Client;

class IDConverter
{
    private Client $http;

    public function __construct() { $this->http = new Client(['timeout' => 10]); }

    public function corpidToOpenCorpid(string $corpid, string $providerToken): string
    {
        $resp = $this->http->post(
            "https://qyapi.weixin.qq.com/cgi-bin/service/corpid_to_opencorpid?provider_access_token={$providerToken}",
            ['json' => ['corpid' => $corpid]]
        );
        $data = json_decode($resp->getBody()->getContents(), true);
        if (($data['errcode'] ?? 0) !== 0)
            throw new \RuntimeException("转换失败: {$data['errcode']}");
        return $data['open_corpid'];
    }
}
```

---

## 7. 测试模板

（遵循 wecom-core 测试规范第 6 节）

```python
"""
ID 转换 — 单元测试
"""
import pytest
from unittest.mock import patch, MagicMock
from id_converter import IDConverter


@pytest.fixture
def converter():
    return IDConverter(suite_access_token="mock_suite_token")


class TestCorpidConvert:

    @patch("requests.post")
    def test_明文corpid转加密corpid_成功(self, mock_post, converter):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok", "open_corpid": "wpxxxxxx"
        })
        result = converter.corpid_to_opencorpid("wwxxxxxx", "provider_token")
        assert result == "wpxxxxxx"
        assert "corpid_to_opencorpid" in mock_post.call_args[0][0]

    @patch("requests.post")
    def test_明文corpid转换_corpid不存在(self, mock_post, converter):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 40003, "errmsg": "invalid corpid"
        })
        with pytest.raises(AssertionError, match="40003"):
            converter.corpid_to_opencorpid("invalid", "provider_token")


class TestUseridConvert:

    @patch("requests.post")
    def test_批量userid转open_userid_成功(self, mock_post, converter):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "open_userid_list": [
                {"userid": "zhangsan", "open_userid": "woxxxxx"},
                {"userid": "lisi", "open_userid": "woyyyyy"},
            ],
            "invalid_userid_list": [],
        })
        result = converter.batch_userid_to_openuserid("corp_token", ["zhangsan", "lisi"])
        assert result["zhangsan"] == "woxxxxx"
        assert result["lisi"] == "woyyyyy"

    @patch("requests.post")
    def test_批量userid_超过1000自动分批(self, mock_post, converter):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "open_userid_list": [], "invalid_userid_list": [],
        })
        users = [f"user_{i}" for i in range(1500)]
        converter.batch_userid_to_openuserid("corp_token", users)
        assert mock_post.call_count == 2  # 分两批

    @patch("requests.post")
    def test_userid转换_token_过期(self, mock_post, converter):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 42001, "errmsg": "access_token expired"
        })
        with pytest.raises(AssertionError, match="42001"):
            converter.batch_userid_to_openuserid("expired_token", ["zhangsan"])


class TestUnionidConvert:

    @patch("requests.post")
    def test_unionid转external_userid_成功(self, mock_post, converter):
        mock_post.return_value = MagicMock(json=lambda: {
            "errcode": 0, "errmsg": "ok",
            "external_userid_info": [
                {"corpid": "wpxxxxxx", "external_userid": "wmxxxxxx"}
            ],
        })
        result = converter.unionid_to_external_userid("corp_token", "ozmysj...", "o6_bmjs...")
        assert len(result) == 1
        assert result[0]["external_userid"] == "wmxxxxxx"
```

---

## 8. Code Review 检查清单

（遵循 wecom-core 代码审核规范第 7 节）

```
✅ 审核报告 - wecom-3rd-idconvert

[安全性]
✅ token 通过参数传入，未硬编码
✅ token 未明文写入日志

[正确性]
✅ POST /service/corpid_to_opencorpid → 端点正确，使用 provider_access_token
✅ POST /batch/userid_to_openuserid → 端点正确，使用企业 access_token
✅ POST /externalcontact/unionid_to_external_userid → 端点正确
✅ 批量 userid 转换自动按 1000 分批

[健壮性]
✅ errcode 检查 → 存在
✅ 超时设置 → 10s
✅ 分批处理避免单次超限

[测试]
✅ 成功场景测试 → corpid / userid / unionid 三类
✅ 错误场景测试 → 无效 corpid / token 过期
✅ 分批逻辑测试 → 超过 1000 自动分批

审核结果: 全部通过 ✅
```

---

## 9. Gotcha Guide

### G1. open_userid 是应用隔离的
同一成员在不同应用下的 open_userid **不同**。跨应用共享用户数据时必须使用 userid 转换。

### G2. corpid_to_opencorpid 用 provider_access_token
这是唯一使用 `provider_access_token` 的 ID 转换 API。其余均使用企业 access_token 或 suite_access_token。

### G3. 批量转换有速率限制
`userid_to_openuserid` 每次最多 1000 个。大量转换需分批，并注意频率限制。

### G4. ID 迁移完成后要设置标志
调用 `/cgi-bin/service/finish_openid_migration` 告知企业微信迁移完成，否则可能影响后续 API 行为。

---

## 10. References

| doc_id | 标题 |
|--------|------|
| 95890 | 概述 — 安全性升级 |
| 97061 | corpid 的转换 |
| 97062 | userid 的转换 |
| 97063 | external_userid 的转换 |
| 95900 | unionid 与 external_userid 关联 |
| 99375 | ID 迁移完成状态设置 |

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

