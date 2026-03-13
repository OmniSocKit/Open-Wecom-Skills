---
name: wecom-core
description: |
  企业微信开放能力基座 SKILL。提供认证体系、通用规范、错误处理、代码生成规范、测试规范、审核规范和能力索引。
  TRIGGER: 当用户提到企业微信、WeCom、wecom、qyapi.weixin.qq.com 相关开发时触发。
  本 SKILL 是所有 wecom-* SKILL 的前置依赖。
---

# WeCom Core Foundation (wecom-core)

你现在是企业微信开放能力专家。基于本 SKILL 的知识，帮助开发者快速、正确地调用企业微信 API。

---

## 1. 核心术语

| 术语 | 说明 | 获取方式 |
|------|------|----------|
| corpid | 企业唯一标识 | 管理后台 → 我的企业 → 企业信息 → 企业ID |
| secret | 应用凭证密钥，每个应用独立 | 管理后台 → 应用管理 → 应用 → 自建 → 点进应用查看 |
| access_token | 调用接口的凭证，由 corpid + secret 生成，有效期 7200 秒 | 调用 gettoken 接口 |
| agentid | 应用唯一标识 | 管理后台 → 应用管理 → 点进应用查看 |
| userid | 企业成员唯一标识（即"账号"） | 管理后台 → 通讯录 → 点进成员详情 |
| external_userid | 外部联系人 ID（微信用户或其他企业微信用户）。不同调用方获取的值不同 | API 返回 |
| EncodingAESKey | 回调消息加密密钥，43 位英文/数字字符串 | 管理后台配置回调时自动生成或自定义 |

---

## 2. 认证体系

### 2.1 获取 access_token

- **接口**: `GET https://qyapi.weixin.qq.com/cgi-bin/gettoken`
- **参数**:

| 参数 | 必填 | 说明 |
|------|------|------|
| corpid | 是 | 企业 ID |
| corpsecret | 是 | 应用的凭证密钥，应用需为启用状态 |

- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "access_token": "accesstoken000001",
  "expires_in": 7200
}
```

| 字段 | 说明 |
|------|------|
| access_token | 凭证，最长 512 字节 |
| expires_in | 有效时间（秒），正常为 7200 |

- **关键规则**:
  1. 每个应用有独立的 secret → 独立的 access_token，缓存时需按应用区分
  2. **必须缓存**，禁止每次调用业务接口都重新获取，否则会被频率拦截
  3. access_token 存储空间至少 512 字节
  4. 企业微信可能提前使 token 失效，开发者需实现失效时自动重新获取的逻辑
  5. **禁止将 access_token 返回给前端**，所有 API 请求必须由后端发起

### 2.2 回调配置（接收企业微信事件推送）

回调服务需要三个配置项：**URL**（开发者服务地址）、**Token**（签名密钥）、**EncodingAESKey**（消息加密密钥）。

#### 2.2.1 URL 验证（GET 请求）

企业微信在保存回调配置时，发送 GET 请求验证 URL 有效性：

```
GET https://{your_url}/?msg_signature=xxx&timestamp=xxx&nonce=xxx&echostr=ENCRYPT_STR
```

| 参数 | 类型 | 说明 |
|------|------|------|
| msg_signature | String | 签名（由 token + timestamp + nonce + echostr 计算） |
| timestamp | Integer | 时间戳 |
| nonce | String | 随机数 |
| echostr | String | 加密字符串，解密后得到明文 |

处理流程：
1. 解析参数（需 URL Decode）
2. 用 token + timestamp + nonce + echostr 计算签名，与 msg_signature 比对
3. 解密 echostr 得到明文
4. **1 秒内**返回明文（不加引号，不带 BOM 头，不带换行符）

**签名计算算法**:
```
// 1. 将 token, timestamp, nonce, echostr（或 encrypt_msg）四个值放入数组
arr = [token, timestamp, nonce, echostr]
// 2. 按字典序排序
arr.sort()
// 3. 拼接成字符串
str = arr.join("")
// 4. SHA1 哈希
signature = SHA1(str)
// 5. 与 msg_signature 比对
valid = (signature == msg_signature)
```

#### 2.2.2 接收业务数据（POST 请求）

```
POST https://{your_url}/?msg_signature=xxx&timestamp=xxx&nonce=xxx
```

POST body 格式（XML）：
```xml
<xml>
  <ToUserName><![CDATA[toUser]]></ToUserName>
  <AgentID><![CDATA[toAgentID]]></AgentID>
  <Encrypt><![CDATA[msg_encrypt]]></Encrypt>
</xml>
```

处理流程：
1. 校验 msg_signature
2. 解密 Encrypt 得到明文消息结构体
3. 处理业务逻辑
4. 如需被动回复，构造加密响应包
5. 返回响应（不同回调要求不同：空串 / "success" / 加密被动回复）

**关键规则**:
- 5 秒内必须响应，否则企业微信重试（最多 3 次）
- 建议收到回调后立即应答，业务异步处理
- 不要强依赖回调，需额外机制对齐业务数据

#### 2.2.3 被动响应包格式

```xml
<xml>
  <Encrypt><![CDATA[msg_encrypt]]></Encrypt>
  <MsgSignature><![CDATA[msg_signature]]></MsgSignature>
  <TimeStamp>timestamp</TimeStamp>
  <Nonce><![CDATA[nonce]]></Nonce>
</xml>
```

#### 2.2.4 常见回调事件类型速查

| 事件类型 | 触发时机 | 所属域 |
|----------|----------|--------|
| change_contact | 成员/部门/标签变更 | 通讯录 |
| change_external_contact | 客户变更（添加/删除/编辑） | 客户联系 |
| change_external_chat | 客户群变更 | 客户联系 |
| open_approval_change | 审批状态变化 | 审批 |
| sys_approval_change | 自建审批状态变化 | 审批 |
| enter_agent | 进入应用 | 应用 |
| subscribe / unsubscribe | 关注/取消关注应用 | 应用 |
| click / view | 菜单点击/跳转 | 应用菜单 |
| batch_job_result | 异步任务完成 | 通讯录 |
| kf_msg_or_event | 微信客服消息/事件 | 客服 |
| living_status_change | 直播状态变化 | 直播 |

#### 2.2.5 回调服务代码模板

##### Python (Flask)
```python
"""企业微信回调服务 — Flask 实现"""
import os, hashlib, time, xml.etree.ElementTree as ET
from flask import Flask, request

# 需安装: pip install pycryptodome flask
from Crypto.Cipher import AES
import base64, struct

app = Flask(__name__)

# 从环境变量读取配置
TOKEN = os.environ["WECOM_CALLBACK_TOKEN"]
ENCODING_AES_KEY = os.environ["WECOM_ENCODING_AES_KEY"]
CORP_ID = os.environ["WECOM_CORP_ID"]

AES_KEY = base64.b64decode(ENCODING_AES_KEY + "=")


def verify_signature(token: str, timestamp: str, nonce: str, *encrypt_args: str) -> str:
    """计算并返回签名"""
    arr = sorted([token, timestamp, nonce] + list(encrypt_args))
    return hashlib.sha1("".join(arr).encode()).hexdigest()


def decrypt_msg(encrypt_text: str) -> str:
    """AES-256-CBC 解密消息"""
    cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_KEY[:16])
    decrypted = cipher.decrypt(base64.b64decode(encrypt_text))
    # 去除 PKCS#7 padding
    pad_len = decrypted[-1]
    decrypted = decrypted[:-pad_len]
    # 解析: random(16) + msg_len(4) + msg + receiveid
    msg_len = struct.unpack("!I", decrypted[16:20])[0]
    msg = decrypted[20:20 + msg_len].decode()
    return msg


@app.route("/callback", methods=["GET"])
def verify_url():
    """URL 验证（企业微信配置回调时触发）"""
    msg_signature = request.args["msg_signature"]
    timestamp = request.args["timestamp"]
    nonce = request.args["nonce"]
    echostr = request.args["echostr"]

    # 1. 校验签名
    signature = verify_signature(TOKEN, timestamp, nonce, echostr)
    if signature != msg_signature:
        return "signature mismatch", 403

    # 2. 解密 echostr，返回明文（不加引号、不带 BOM、不带换行）
    return decrypt_msg(echostr)


@app.route("/callback", methods=["POST"])
def receive_event():
    """接收业务事件推送"""
    msg_signature = request.args["msg_signature"]
    timestamp = request.args["timestamp"]
    nonce = request.args["nonce"]

    # 1. 解析 XML 获取加密消息
    xml_data = ET.fromstring(request.data)
    encrypt_msg = xml_data.find("Encrypt").text

    # 2. 校验签名
    signature = verify_signature(TOKEN, timestamp, nonce, encrypt_msg)
    if signature != msg_signature:
        return "signature mismatch", 403

    # 3. 解密得到明文消息
    msg_content = decrypt_msg(encrypt_msg)
    msg_xml = ET.fromstring(msg_content)

    # 4. 业务处理（建议异步，5 秒内必须响应）
    event_type = msg_xml.find("Event")
    if event_type is not None:
        print(f"收到事件: {event_type.text}")
    # TODO: 异步处理业务逻辑

    return "success"  # 大多数回调返回 "success" 即可
```

##### Node.js (TypeScript + Express)
```typescript
/** 企业微信回调服务 — Express 实现 */
import express from 'express';
import crypto from 'crypto';
import { parseStringPromise } from 'xml2js';

const TOKEN = process.env.WECOM_CALLBACK_TOKEN!;
const ENCODING_AES_KEY = process.env.WECOM_ENCODING_AES_KEY!;
const CORP_ID = process.env.WECOM_CORP_ID!;
const AES_KEY = Buffer.from(ENCODING_AES_KEY + '=', 'base64');

function verifySignature(token: string, timestamp: string, nonce: string, ...args: string[]): string {
  return crypto.createHash('sha1').update([token, timestamp, nonce, ...args].sort().join('')).digest('hex');
}

function decryptMsg(encryptText: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, AES_KEY.subarray(0, 16));
  decipher.setAutoPadding(false);
  let decrypted = Buffer.concat([decipher.update(encryptText, 'base64'), decipher.final()]);
  const padLen = decrypted[decrypted.length - 1];
  decrypted = decrypted.subarray(0, decrypted.length - padLen);
  const msgLen = decrypted.readUInt32BE(16);
  return decrypted.subarray(20, 20 + msgLen).toString();
}

const app = express();
app.use(express.raw({ type: 'text/xml' }));

app.get('/callback', (req, res) => {
  const { msg_signature, timestamp, nonce, echostr } = req.query as Record<string, string>;
  const sig = verifySignature(TOKEN, timestamp, nonce, echostr);
  if (sig !== msg_signature) return res.status(403).send('signature mismatch');
  res.send(decryptMsg(echostr));
});

app.post('/callback', async (req, res) => {
  const { msg_signature, timestamp, nonce } = req.query as Record<string, string>;
  const xml = await parseStringPromise(req.body.toString());
  const encryptMsg = xml.xml.Encrypt[0];
  const sig = verifySignature(TOKEN, timestamp, nonce, encryptMsg);
  if (sig !== msg_signature) return res.status(403).send('signature mismatch');
  const msgContent = decryptMsg(encryptMsg);
  console.log('收到回调消息:', msgContent);
  // TODO: 异步处理业务逻辑
  res.send('success');
});

app.listen(3000, () => console.log('回调服务已启动: http://localhost:3000'));
```

### 2.3 获取 IP 段

| 用途 | 接口 |
|------|------|
| 企业微信 API 域名 IP 段 | `GET /cgi-bin/get_api_domain_ip?access_token=TOKEN` |
| 企业微信回调 IP 段 | `GET /cgi-bin/getcallbackip?access_token=TOKEN` |

响应：`{ "errcode": 0, "errmsg": "ok", "ip_list": ["1.2.3.4", "2.3.3.3"] }`

建议每天定时拉取 IP 段更新防火墙配置。

---

## 3. 通用请求规范

### 3.1 基础 URL
```
https://qyapi.weixin.qq.com/cgi-bin/
```

### 3.2 请求格式
- access_token 通过 **URL query 参数**传递：`?access_token=xxx`
- GET 请求：参数在 query string
- POST 请求：body 为 JSON，`Content-Type: application/json`
- 文件上传：`multipart/form-data`

### 3.3 统一响应格式
```json
{ "errcode": 0, "errmsg": "ok", ...业务字段 }
```
- `errcode = 0` 成功
- `errcode != 0` 失败，根据 errcode 判断原因（不要依赖 errmsg 文本匹配）
- JSON 参数不合法时，errmsg 会包含 `"Warning: wrong json format."`

---

## 4. 频率限制

### 4.1 基础频率
| 维度 | 限制 |
|------|------|
| 每企业调用单个接口 | 1 万次/分，15 万次/小时 |
| 每 IP 调用单个接口 | 2 万次/分，60 万次/小时 |
| 第三方应用每 IP | 4 万次/分，12 万次/小时 |

### 4.2 专项频率
| 操作 | 限制 |
|------|------|
| 发送应用消息 | 账号上限 * 200 人次/天；对同一成员 30 次/分，1000 次/小时 |
| 创建账号 | 账号上限 * 3/月 |
| 获取 jsapi_ticket | 400 次/小时（单应用 100 次） |
| 应用创建群聊 | 1000/天 |
| 应用变更群聊 | 1000/小时 |
| 应用推送群消息 | 2 万人次/分，30 万人次/小时 |
| 上传永久图片 | 3000 张/月，1000 张/天 |
| 获取打卡数据 | 600 次/分 |
| 获取审批数据 | 600 次/分 |

### 4.3 封禁规则
- 按分钟拦截 → 封禁 60 秒
- 按小时拦截 → 封禁 60 分钟
- 按天拦截 → 封禁 1 天（自然天）
- 按月拦截 → 封禁 30 天

---

## 5. 全局错误码速查

### 5.1 高频错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| -1 | 系统繁忙 | 稍后重试，重试不超过 3 次 |
| 0 | 成功 | - |
| 40001 | 不合法的 secret | 检查 corpsecret 是否正确 |
| 40003 | 无效的 UserID | 检查成员是否存在 |
| 40004 | 不合法的媒体文件类型 | 检查文件类型限制 |
| 40013 | 不合法的 CorpID | 管理后台 → 设置查看正确 CorpID |
| 40014 | 不合法的 access_token | token 过期或错误，重新获取 |
| 40029 | 不合法的 oauth_code | code 已使用或过期 |
| 40056 | 不合法的 agentid | 检查 agentid 是否正确 |
| 41001 | 缺少 access_token | 检查 URL 参数 |
| 42001 | access_token 已过期 | 刷新 token |
| 42009 | access_token 与 agentid 不匹配 | 确认 token 和 agentid 属于同一应用 |
| 45009 | 接口调用超过限制 | 降频或联系企业微信提升 |
| 48002 | API 接口无权限 | 检查应用可见范围和权限配置 |
| 60011 | 没有该应用的访问权限 | 检查 agentid 和 secret 是否匹配 |
| 60020 | 访问 IP 不在白名单 | 在管理后台添加 IP 白名单 |
| 301002 | 无权限操作指定成员 | 成员不在应用可见范围内 |

### 5.2 高频错误码深度排查

#### 40001 — 不合法的 secret
- **常见原因**: secret 复制错误（首尾空格）、使用了其他应用的 secret、应用未启用
- **排查步骤**:
  1. 管理后台 → 应用管理 → 自建应用 → 重新复制 secret
  2. 确认应用处于「启用」状态
  3. 确认 corpid 和 secret 属于同一企业

#### 42001 / 40014 — access_token 过期或无效
- **常见原因**: token 过期未刷新、多实例部署各自获取 token 互相覆盖、使用了其他应用的 token
- **排查步骤**:
  1. 检查 token 缓存和刷新逻辑是否正确
  2. 多实例部署时使用 Redis 等共享缓存，避免各实例独立获取
  3. 确认 token 与调用的 API 所属应用一致

#### 60020 — 访问 IP 不在白名单
- **常见原因**: 服务器出口 IP 与预期不同（NAT 网关、负载均衡、CDN 回源）、IPv6 地址
- **排查步骤**:
  1. 确认服务器出口 IP：`curl -s ifconfig.me` 或 `curl -s ip.sb`
  2. 管理后台 → 应用管理 → 自建应用 → 企业可信 IP → 添加出口 IP
  3. 云服务器注意：弹性 IP / NAT 网关的出口 IP 可能与 ECS 内网 IP 不同
  4. 可调用 `GET /cgi-bin/get_api_domain_ip` 验证 token 是否正常（此接口本身也受白名单限制）

#### 48002 — API 接口无权限
- **常见原因**: 应用未开通对应 API 权限、成员不在应用可见范围
- **排查步骤**:
  1. 管理后台 → 应用管理 → 应用 → API 权限，确认已勾选所需权限
  2. 检查应用可见范围是否包含目标成员/部门

#### 301002 — 无权限操作指定成员
- **常见原因**: 成员不在应用的可见范围内
- **排查步骤**:
  1. 管理后台 → 应用管理 → 应用 → 可见范围，添加目标成员或其所在部门
  2. 通讯录同步助手无需配置可见范围，默认为全公司

### 5.3 错误码查询工具
官方工具：https://developer.work.weixin.qq.com/devtool/query
返回的 errmsg 中通常包含 `more info at https://open.work.weixin.qq.com/devtool/query?e=错误码`

---

## 6. 能力索引

当开发者表达需求时，引导到对应 SKILL：

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 成员、部门、标签、通讯录 | wecom-contact |
| 发消息、群聊、机器人、webhook | wecom-message |
| 应用配置、菜单、工作台 | wecom-app |
| 登录、OAuth、身份、扫码 | wecom-auth |
| 客户、CRM、朋友圈、获客 | wecom-crm |
| 审批、请假、报销 | wecom-approval |
| 会议、预约、录制 | wecom-meeting |
| 客服、对话、工单 | wecom-kf |
| 文档、表格、收集表 | wecom-doc |
| 图片、文件、素材 | wecom-media |
| 打卡、日程、邮件、微盘、直播 | wecom-office |
| JS-SDK、H5、网页 | wecom-jssdk |
| 小程序 | wecom-miniapp |
| 支付、存档、安全 | wecom-advanced |
| 家校、政务、上下游 | wecom-vertical |

**如果对应的域 SKILL 尚未加载，用本 SKILL 的通用规范 + 官方文档链接协助开发者。**
官方文档根地址：`https://developer.work.weixin.qq.com/document/path/{path_id}`

---

## 7. 代码生成规范

### 7.1 语言适配规则
- 用户指定语言 → 仅生成该语言版本
- 用户未指定 → 根据项目上下文（package.json / requirements.txt / go.mod 等）自动判断
- 无法判断时 → 询问用户，或默认 Python

### 7.2 各语言技术栈约定

| 语言 | HTTP 客户端 | 推荐框架 | 测试框架 | Mock 库 |
|------|------------|----------|----------|---------|
| Python | requests / httpx | Flask / FastAPI | pytest | responses / unittest.mock |
| Node.js / TypeScript | axios | Express / NestJS | vitest / jest | nock / msw |
| Go | net/http / resty | gin / echo | testing | httptest |
| Java | OkHttp / HttpClient | Spring Boot | JUnit 5 | WireMock |
| PHP | Guzzle | Laravel | PHPUnit | Mockery |
| Rust | reqwest | Actix-web / Axum | #[cfg(test)] | mockito / wiremock |
| C# | HttpClient | ASP.NET Core | xUnit | Moq / WireMock.Net |
| Ruby | Faraday | Rails / Sinatra | RSpec | WebMock |

### 7.3 代码生成强制规则

生成的所有企业微信相关代码，**必须**遵守以下规则：

1. **Token 缓存**: 实现 access_token 缓存 + 过期前主动刷新，禁止每次请求都调用 gettoken
2. **错误处理**: 检查 errcode，对 errcode=-1（系统繁忙）自动重试（最多 3 次，间隔递增）
3. **类型安全**: 强类型语言必须定义请求/响应的类型或结构体
4. **超时设置**: HTTP 请求必须设置超时（建议 10 秒）
5. **敏感信息隔离**: corpid / corpsecret 从环境变量或配置文件读取，禁止硬编码
6. **日志**: 关键调用点记录日志（请求路径、errcode、耗时），但 access_token 不得明文记录
7. **幂等标注**: 代码注释中标注该操作是否幂等

### 7.4 Token 缓存策略

| 部署方式 | 推荐缓存方案 | 说明 |
|----------|-------------|------|
| 单实例 | 内存缓存 | 下方模板默认实现，最简单 |
| 多实例 | Redis / Memcached | 所有实例共享同一 token，避免互相覆盖 |
| Serverless | Redis / DynamoDB | 无状态函数无法内存缓存，必须用外部存储 |

**多实例部署关键**：所有实例必须读写同一个 token 缓存，禁止各自独立调用 gettoken。否则后获取的 token 会使先前的失效，导致频繁报 42001。

### 7.5 基础客户端模板

以下是各语言的基础客户端模板。所有域 SKILL 生成的代码应继承/使用此客户端。

#### Python
```python
"""企业微信 API 客户端（带 token 缓存 + 自动重试 + 线程安全）"""
import os, time, logging, threading
import requests

logger = logging.getLogger(__name__)

class WeComClient:
    BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin"

    def __init__(self, corp_id: str = None, corp_secret: str = None):
        self.corp_id = corp_id or os.environ["WECOM_CORP_ID"]
        self.corp_secret = corp_secret or os.environ["WECOM_CORP_SECRET"]
        self._token: str | None = None
        self._token_expires_at: float = 0
        self._lock = threading.Lock()  # 线程安全锁

    @property
    def access_token(self) -> str:
        if time.time() >= self._token_expires_at:
            with self._lock:  # 防止并发刷新
                if time.time() >= self._token_expires_at:  # double-check
                    self._refresh_token()
        return self._token

    def _refresh_token(self):
        resp = requests.get(
            f"{self.BASE_URL}/gettoken",
            params={"corpid": self.corp_id, "corpsecret": self.corp_secret},
            timeout=10,
        ).json()
        if resp["errcode"] != 0:
            raise WeComError(resp["errcode"], resp["errmsg"])
        self._token = resp["access_token"]
        self._token_expires_at = time.time() + resp["expires_in"] - 300  # 提前 5 分钟刷新

    def _request(self, method: str, path: str, retries: int = 3, **kwargs) -> dict:
        """发起 API 请求，自动附加 token + 重试"""
        url = f"{self.BASE_URL}{path}"
        params = kwargs.pop("params", {})
        params["access_token"] = self.access_token

        for attempt in range(retries):
            start = time.time()
            resp = requests.request(method, url, params=params, timeout=10, **kwargs).json()
            elapsed = round(time.time() - start, 2)
            logger.debug(f"WeCom API {method} {path} -> errcode={resp['errcode']} ({elapsed}s)")

            if resp["errcode"] == 0:
                return resp
            if resp["errcode"] in (42001, 40014):  # token 过期/无效
                self._refresh_token()
                params["access_token"] = self.access_token
                continue
            if resp["errcode"] == -1 and attempt < retries - 1:  # 系统繁忙
                time.sleep(1 * (attempt + 1))
                continue
            raise WeComError(resp["errcode"], resp["errmsg"])
        raise WeComError(-1, "重试次数已用尽")

    def get(self, path: str, **kwargs) -> dict:
        return self._request("GET", path, **kwargs)

    def post(self, path: str, **kwargs) -> dict:
        return self._request("POST", path, **kwargs)


class WeComError(Exception):
    def __init__(self, errcode: int, errmsg: str):
        self.errcode = errcode
        self.errmsg = errmsg
        super().__init__(f"WeCom API Error [{errcode}]: {errmsg}")
```

#### Node.js (TypeScript)
```typescript
/** 企业微信 API 客户端（带 token 缓存 + 自动重试） */
import axios, { AxiosInstance } from 'axios';

interface WeComResponse {
  errcode: number;
  errmsg: string;
  [key: string]: unknown;
}

interface TokenInfo {
  access_token: string;
  expires_in: number;
}

export class WeComError extends Error {
  constructor(public errcode: number, public errmsg: string) {
    super(`WeCom API Error [${errcode}]: ${errmsg}`);
  }
}

export class WeComClient {
  private static readonly BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private http: AxiosInstance;

  constructor(
    private corpId = process.env.WECOM_CORP_ID!,
    private corpSecret = process.env.WECOM_CORP_SECRET!,
  ) {
    this.http = axios.create({ baseURL: WeComClient.BASE_URL, timeout: 10_000 });
  }

  private async refreshToken(): Promise<void> {
    const { data } = await this.http.get<WeComResponse & TokenInfo>('/gettoken', {
      params: { corpid: this.corpId, corpsecret: this.corpSecret },
    });
    if (data.errcode !== 0) throw new WeComError(data.errcode, data.errmsg);
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
  }

  private async getToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiresAt) await this.refreshToken();
    return this.token!;
  }

  async request<T = WeComResponse>(method: 'GET' | 'POST', path: string, body?: object, retries = 3): Promise<T> {
    for (let attempt = 0; attempt < retries; attempt++) {
      const token = await this.getToken();
      const config = { method, url: path, params: { access_token: token }, ...(body ? { data: body } : {}) };
      const { data } = await this.http.request<T & WeComResponse>(config);

      if (data.errcode === 0) return data;
      if ([42001, 40014].includes(data.errcode)) { await this.refreshToken(); continue; }
      if (data.errcode === -1 && attempt < retries - 1) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      throw new WeComError(data.errcode, data.errmsg);
    }
    throw new WeComError(-1, '重试次数已用尽');
  }

  async get<T = WeComResponse>(path: string): Promise<T> { return this.request('GET', path); }
  async post<T = WeComResponse>(path: string, body: object): Promise<T> { return this.request('POST', path, body); }
}
```

#### Go
```go
// 企业微信 API 客户端（带 token 缓存 + 自动重试）
package wecom

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"
	"bytes"
	"io"
)

const baseURL = "https://qyapi.weixin.qq.com/cgi-bin"

type WeComError struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

func (e *WeComError) Error() string {
	return fmt.Sprintf("WeCom API Error [%d]: %s", e.ErrCode, e.ErrMsg)
}

type Client struct {
	CorpID     string
	CorpSecret string
	token      string
	expiresAt  time.Time
	mu         sync.RWMutex
	httpClient *http.Client
}

func NewClient(corpID, corpSecret string) *Client {
	if corpID == "" { corpID = os.Getenv("WECOM_CORP_ID") }
	if corpSecret == "" { corpSecret = os.Getenv("WECOM_CORP_SECRET") }
	return &Client{
		CorpID: corpID, CorpSecret: corpSecret,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) GetToken() (string, error) {
	c.mu.RLock()
	if c.token != "" && time.Now().Before(c.expiresAt) {
		defer c.mu.RUnlock()
		return c.token, nil
	}
	c.mu.RUnlock()
	return c.refreshToken()
}

func (c *Client) refreshToken() (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	url := fmt.Sprintf("%s/gettoken?corpid=%s&corpsecret=%s", baseURL, c.CorpID, c.CorpSecret)
	resp, err := c.httpClient.Get(url)
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
	c.token = result.AccessToken
	c.expiresAt = time.Now().Add(time.Duration(result.ExpiresIn-300) * time.Second)
	return c.token, nil
}

func (c *Client) Request(method, path string, body interface{}) (map[string]interface{}, error) {
	for attempt := 0; attempt < 3; attempt++ {
		token, err := c.GetToken()
		if err != nil { return nil, err }
		url := fmt.Sprintf("%s%s?access_token=%s", baseURL, path, token)
		var reqBody io.Reader
		if body != nil {
			b, _ := json.Marshal(body)
			reqBody = bytes.NewReader(b)
		}
		req, _ := http.NewRequest(method, url, reqBody)
		if body != nil { req.Header.Set("Content-Type", "application/json") }
		resp, err := c.httpClient.Do(req)
		if err != nil { return nil, err }
		defer resp.Body.Close()
		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		errcode := int(result["errcode"].(float64))
		if errcode == 0 { return result, nil }
		if errcode == 42001 || errcode == 40014 { c.refreshToken(); continue }
		if errcode == -1 && attempt < 2 { time.Sleep(time.Duration(attempt+1) * time.Second); continue }
		return nil, &WeComError{errcode, result["errmsg"].(string)}
	}
	return nil, &WeComError{-1, "重试次数已用尽"}
}
```

### 7.6 Java 基础客户端模板

```java
import okhttp3.*;
import com.google.gson.*;
import java.util.concurrent.locks.ReentrantLock;

public class WeComClient {
    private final String corpId;
    private final String corpSecret;
    private final OkHttpClient http = new OkHttpClient();
    private final Gson gson = new Gson();
    private String accessToken;
    private long tokenExpiry = 0;
    private final ReentrantLock tokenLock = new ReentrantLock();

    private static final String BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";

    public WeComClient(String corpId, String corpSecret) {
        this.corpId = corpId;
        this.corpSecret = corpSecret;
    }

    /** 获取 access_token（带锁缓存） */
    public String getAccessToken() throws Exception {
        if (System.currentTimeMillis() / 1000 < tokenExpiry && accessToken != null) {
            return accessToken;
        }
        tokenLock.lock();
        try {
            if (System.currentTimeMillis() / 1000 < tokenExpiry && accessToken != null) {
                return accessToken;
            }
            String url = BASE_URL + "/gettoken?corpid=" + corpId + "&corpsecret=" + corpSecret;
            Request req = new Request.Builder().url(url).get().build();
            try (Response resp = http.newCall(req).execute()) {
                JsonObject json = gson.fromJson(resp.body().string(), JsonObject.class);
                int errcode = json.get("errcode").getAsInt();
                if (errcode != 0) throw new RuntimeException("gettoken failed: " + errcode);
                this.accessToken = json.get("access_token").getAsString();
                this.tokenExpiry = System.currentTimeMillis() / 1000 + json.get("expires_in").getAsInt() - 300;
            }
            return accessToken;
        } finally {
            tokenLock.unlock();
        }
    }

    /** 通用 POST 请求（自动带 token + 重试） */
    public JsonObject post(String path, JsonObject body) throws Exception {
        for (int retry = 0; retry < 3; retry++) {
            String url = BASE_URL + path + "?access_token=" + getAccessToken();
            RequestBody reqBody = RequestBody.create(gson.toJson(body), MediaType.parse("application/json"));
            Request req = new Request.Builder().url(url).post(reqBody).build();
            try (Response resp = http.newCall(req).execute()) {
                JsonObject json = gson.fromJson(resp.body().string(), JsonObject.class);
                int errcode = json.get("errcode").getAsInt();
                if (errcode == -1) { Thread.sleep(1000); continue; }
                if (errcode == 42001) { this.tokenExpiry = 0; continue; }
                if (errcode != 0) throw new RuntimeException("API error: " + errcode + " " + json.get("errmsg"));
                return json;
            }
        }
        throw new RuntimeException("Max retries exceeded");
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

### 7.7 PHP 基础客户端模板

```php
<?php
/**
 * WeComClient — 企业微信核心客户端（PHP 版）
 * 依赖: composer require guzzlehttp/guzzle
 */

use GuzzleHttp\Client;

class WeComClient
{
    private string $corpId;
    private string $corpSecret;
    private Client $http;
    private ?string $accessToken = null;
    private int $tokenExpiry = 0;

    private const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin';

    public function __construct(string $corpId, string $corpSecret)
    {
        $this->corpId = $corpId;
        $this->corpSecret = $corpSecret;
        $this->http = new Client(['base_uri' => self::BASE_URL, 'timeout' => 10]);
    }

    public function getCorpId(): string { return $this->corpId; }

    /** 获取 access_token（带缓存） */
    public function getAccessToken(): string
    {
        if ($this->accessToken && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }
        $resp = $this->http->get('/cgi-bin/gettoken', [
            'query' => ['corpid' => $this->corpId, 'corpsecret' => $this->corpSecret],
        ]);
        $data = json_decode($resp->getBody()->getContents(), true);
        if (($data['errcode'] ?? 0) !== 0) {
            throw new \RuntimeException("gettoken failed: {$data['errcode']} {$data['errmsg']}");
        }
        $this->accessToken = $data['access_token'];
        $this->tokenExpiry = time() + $data['expires_in'] - 300;
        return $this->accessToken;
    }

    /** 通用 POST 请求（自动带 token + 重试） */
    public function post(string $path, array $body = []): array
    {
        for ($retry = 0; $retry < 3; $retry++) {
            $resp = $this->http->post($path, [
                'query' => ['access_token' => $this->getAccessToken()],
                'json'  => $body,
            ]);
            $data = json_decode($resp->getBody()->getContents(), true);
            $errcode = $data['errcode'] ?? 0;

            if ($errcode === -1) { usleep(500000); continue; }
            if ($errcode === 42001) { $this->tokenExpiry = 0; continue; }
            if ($errcode !== 0) {
                throw new \RuntimeException("API error: {$errcode} {$data['errmsg']}");
            }
            return $data;
        }
        throw new \RuntimeException('Max retries exceeded');
    }

    /** 通用 GET 请求 */
    public function get(string $path, array $query = []): array
    {
        $query['access_token'] = $this->getAccessToken();
        $resp = $this->http->get($path, ['query' => $query]);
        $data = json_decode($resp->getBody()->getContents(), true);
        if (($data['errcode'] ?? 0) !== 0) {
            throw new \RuntimeException("API error: {$data['errcode']} {$data['errmsg']}");
        }
        return $data;
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

---

## 8. 测试规范

### 8.1 测试分层

| 层级 | 目标 | 方法 |
|------|------|------|
| 单元测试 | 验证 API 封装逻辑 | Mock HTTP 响应，验证参数构建、解析、错误处理 |
| 集成测试 | 验证完整工作流 | 企业微信测试环境真实调用 |
| 契约测试 | 验证请求/响应结构 | 校验 JSON Schema |

### 8.2 每个 API 封装必须覆盖的测试场景

1. **成功调用** — 返回 errcode=0，验证响应解析
2. **Token 过期自动刷新** — 模拟 errcode=42001，验证自动重新获取 token
3. **系统繁忙自动重试** — 模拟 errcode=-1，验证重试逻辑
4. **业务错误** — 模拟非零 errcode，验证异常抛出
5. **网络超时** — 模拟超时，验证超时处理

### 8.3 测试模板（Python + pytest）

```python
import pytest
from unittest.mock import patch, MagicMock
from wecom_client import WeComClient, WeComError

@pytest.fixture
def client():
    with patch.object(WeComClient, '_refresh_token'):
        c = WeComClient("test_corp", "test_secret")
        c._token = "mock_token"
        c._token_expires_at = float('inf')
        return c

class TestWeComClient:
    @patch("requests.request")
    def test_成功调用(self, mock_req, client):
        mock_req.return_value = MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok", "data": "value"})
        result = client.get("/some/api")
        assert result["data"] == "value"

    @patch("requests.request")
    def test_token过期自动刷新(self, mock_req, client):
        client._token_expires_at = 0
        with patch.object(client, '_refresh_token') as mock_refresh:
            mock_req.return_value = MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok"})
            client.get("/some/api")
            mock_refresh.assert_called()

    @patch("requests.request")
    def test_系统繁忙自动重试(self, mock_req, client):
        mock_req.side_effect = [
            MagicMock(json=lambda: {"errcode": -1, "errmsg": "system busy"}),
            MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok", "data": "ok"}),
        ]
        result = client.get("/some/api")
        assert result["data"] == "ok"
        assert mock_req.call_count == 2

    @patch("requests.request")
    def test_业务错误抛异常(self, mock_req, client):
        mock_req.return_value = MagicMock(json=lambda: {"errcode": 40003, "errmsg": "invalid userid"})
        with pytest.raises(WeComError) as exc_info:
            client.get("/some/api")
        assert exc_info.value.errcode == 40003
```

---

## 9. 代码审核规范

生成企业微信代码后，自动执行以下审核检查：

### 9.1 审核清单

| 维度 | 检查项 | 级别 |
|------|--------|------|
| 安全 | corpid/secret 未硬编码，从环境变量或配置文件读取 | CRITICAL |
| 安全 | access_token 未明文写入日志 | CRITICAL |
| 安全 | 回调签名验证逻辑存在（如涉及回调） | CRITICAL |
| 安全 | 无 SQL 注入 / XSS / 命令注入风险 | CRITICAL |
| 正确 | API endpoint 与官方文档一致 | HIGH |
| 正确 | HTTP 方法（GET/POST）与文档一致 | HIGH |
| 正确 | 必填参数全部包含 | HIGH |
| 正确 | 请求参数名/类型与文档一致 | HIGH |
| 健壮 | access_token 有缓存机制 | HIGH |
| 健壮 | errcode 检查存在 | HIGH |
| 健壮 | 请求超时设置存在 | MEDIUM |
| 健壮 | 系统繁忙 (-1) 重试逻辑存在 | MEDIUM |
| 健壮 | 文件上传有大小限制检查（如涉及） | MEDIUM |
| 质量 | 类型定义完整（强类型语言） | MEDIUM |
| 质量 | 关键操作有日志 | LOW |
| 质量 | 幂等性已标注 | LOW |

### 9.2 审核流程

```
生成代码 → 自检清单 → 发现问题 → 自动修复 → 重新检查
                                   ↓ 通过
                       生成测试代码 → 检查覆盖率 → 不足则补充
                                   ↓ 通过
                           输出审核报告 + 代码 + 测试
```

### 9.3 审核报告格式

```
--- 审核报告: wecom-{domain} ---

[安全性]
  PASS  敏感信息从环境变量读取
  PASS  access_token 未明文记录日志

[正确性]
  PASS  POST /cgi-bin/xxx/create - 端点正确
  PASS  必填参数: name, userid - 已包含

[健壮性]
  PASS  Token 缓存机制存在
  PASS  errcode 检查存在
  PASS  超时设置 10s
  PASS  系统繁忙重试存在

[测试覆盖]
  PASS  成功场景
  PASS  错误场景
  PASS  Token 刷新
  PASS  重试逻辑

审核结果: 全部通过
```

CRITICAL / HIGH 不通过不交付，MEDIUM 自动修复或标注，LOW 建议性提示。

---

## 10. 加解密参考

消息加解密使用 AES-256-CBC 算法：
- Key: Base64Decode(EncodingAESKey + "=")，共 32 字节
- IV: Key 的前 16 字节
- 加密前填充: random(16 字节) + msg_len(4 字节网络字节序) + msg + receiveid
- PKCS#7 padding

官方提供各语言加解密库下载：
https://developer.work.weixin.qq.com/document/path/90968

---

## 11. 官方工具

| 工具 | 地址 |
|------|------|
| 接口调试工具 | https://developer.work.weixin.qq.com/resource/devtool |
| 错误码查询 | https://developer.work.weixin.qq.com/devtool/query |
| JS-API 签名工具 | https://developer.work.weixin.qq.com/devtool/signature |
| 加解密库下载 | https://developer.work.weixin.qq.com/document/path/90968 |
