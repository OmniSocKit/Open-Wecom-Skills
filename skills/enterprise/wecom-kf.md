---
name: wecom-kf
description: 企业微信微信客服域 SKILL — 客服账号管理、接待人员、消息收发、会话状态、知识库、统计、升级服务
version: 1.0.0
triggers:
  - 微信客服
  - 客服
  - kf
  - open_kfid
  - kf/account
  - kf/send_msg
  - kf/sync_msg
  - 客服消息
  - 接待人员
  - servicer
  - 客服账号
  - kf_msg_or_event
  - 知识库
  - knowledge
prerequisite_skills:
  - wecom-core
domain: kf
api_count: 21
callback_count: 1
---

# WeCom · 微信客服 SKILL

> 覆盖企业微信「微信客服」全域：客服账号 CRUD、接待人员管理、消息收发与同步、会话状态流转、客户信息获取、升级服务、知识库管理、数据统计，以及客服消息/事件回调。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | **「微信客服」secret** 的 access_token | 微信客服使用范围 |
| 第三方应用 | suite_access_token | 「微信客服权限」 |
| 代开发应用 | 需申请微信客服权限 | 管理员授权 |

> **关键**：必须使用「微信客服」专用 secret，不可使用其他应用 secret 或系统应用 secret（2023-12-01 后停用）。

### 1.2 管理后台配置

1. **管理后台 → 微信客服** → 创建客服账号
2. **配置回调 URL / Token / EncodingAESKey** → 接收客服消息和事件
3. **设置接待人员** → 将成员添加为客服接待人员

### 1.3 客服消息流转

```
微信用户 → 点击客服链接/扫码 → 进入客服会话
  → 机器人自动回复（知识库匹配）
  → 转人工（接待人员接入）
  → 结束会话
```

---

## 2. 核心概念

### 2.1 关键 ID

| ID | 说明 | 示例 |
|----|------|------|
| open_kfid | 客服账号 ID | `wkxxxxxx` |
| external_userid | 客服用户的 external_userid | 微信用户唯一标识 |
| servicer_userid | 接待人员的企业成员 userid | 企业内唯一 |
| msgid | 消息 ID | 唯一标识每条消息 |

### 2.2 会话状态 (service_state)

| 值 | 含义 | 说明 |
|----|------|------|
| 0 | 未处理 | 新进入会话，等待分配 |
| 1 | 由智能助手接待 | 机器人自动回复 |
| 2 | 待接入池等待 | 等待人工接入 |
| 3 | 由人工接待 | 人工客服已接入 |
| 4 | 已结束/未开始 | 会话结束 |

**状态流转规则**：
- 0 → 1/2/3/4
- 1 → 1/2/3/4
- 2 → 2/3/4
- 3 → 3/4
- 4 → —（终态）

### 2.3 消息类型 (msgtype)

| 类型 | 说明 | 发送 | 接收 |
|------|------|------|------|
| text | 文本 | ✅ | ✅ |
| image | 图片 | ✅ | ✅ |
| voice | 语音 | ✅ | ✅ |
| video | 视频 | ✅ | ✅ |
| file | 文件 | ✅ | ✅ |
| link | 图文链接 | ✅ | — |
| miniprogram | 小程序 | ✅ | ✅ |
| msgmenu | 菜单消息 | ✅ | — |
| location | 位置 | — | ✅ |
| business_card | 名片 | — | ✅ |
| event | 事件 | — | ✅ |

---

## 3. API 速查表

### 客服账号管理

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| A1 | 添加客服账号 | POST | `kf/account/add` |
| A2 | 删除客服账号 | POST | `kf/account/del` |
| A3 | 修改客服账号 | POST | `kf/account/update` |
| A4 | 获取客服账号列表 | GET | `kf/account/list` |
| A5 | 获取客服账号链接 | POST | `kf/add_contact_way` |

### 接待人员管理

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| S1 | 添加接待人员 | POST | `kf/servicer/add` |
| S2 | 删除接待人员 | POST | `kf/servicer/del` |
| S3 | 获取接待人员列表 | GET | `kf/servicer/list` |

### 消息管理

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| M1 | 发送消息 | POST | `kf/send_msg` |
| M2 | 读取消息 | POST | `kf/sync_msg` |

### 客户与会话

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| C1 | 获取客户基础信息 | POST | `kf/customer/batchget` |
| T1 | 获取会话状态 | POST | `kf/service_state/get` |
| T2 | 变更会话状态 | POST | `kf/service_state/trans` |

### 升级服务

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| U1 | 获取升级服务配置 | GET | `kf/customer/get_upgrade_service_config` |
| U2 | 为客户升级服务 | POST | `kf/customer/upgrade_service` |
| U3 | 取消升级服务 | POST | `kf/customer/cancel_upgrade_service` |

### 数据统计

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| D1 | 获取企业汇总数据 | POST | `kf/get_corp_statistic` |
| D2 | 获取接待人员明细数据 | POST | `kf/get_servicer_statistic` |

### 知识库管理

| # | 接口 | 方法 | 路径 |
|---|------|------|------|
| K1 | 添加分组 | POST | `kf/knowledge/add_group` |
| K2 | 获取分组列表 | POST | `kf/knowledge/list_group` |
| K3 | 添加问答 | POST | `kf/knowledge/add_intent` |
| K4 | 获取问答列表 | POST | `kf/knowledge/list_intent` |

---

## 4. API 详情

### A1 添加客服账号

```
POST kf/account/add
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| name | 是 | string | 客服名称，≤16 字符 |
| media_id | 是 | string | 客服头像的临时素材 ID |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "open_kfid": "wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw"
}
```

---

### A4 获取客服账号列表

```
GET kf/account/list?access_token=ACCESS_TOKEN&offset=0&limit=100
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| offset | 否 | int | 分页偏移，默认 0 |
| limit | 否 | int | 每页数量，默认 100，最大 100 |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "account_list": [
    {
      "open_kfid": "wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw",
      "name": "售后客服",
      "avatar": "https://..."
    }
  ]
}
```

---

### A5 获取客服账号链接

```
POST kf/add_contact_way
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| open_kfid | 是 | string | 客服账号 ID |
| scene | 否 | string | 场景值，≤32 字节，正则 `[0-9a-zA-Z_-]*` |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "url": "https://work.weixin.qq.com/kf/kfcbf8f8d07ac7215f?enc_scene=ENCGFSDF567DF"
}
```

> **scene_param 拼接**：若 scene 非空，可在返回 URL 后拼接 `&scene_param=SCENE_PARAM`（须 urlencode，原始长度 ≤128 字节），用户进入会话时回调中会原样返回。

> **注意**：返回的客服链接不能修改或复制参数到其他链接使用，否则回调参数校验不通过。

---

### S1 添加接待人员

```
POST kf/servicer/add
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| open_kfid | 是 | string | 客服账号 ID |
| userid_list | 否 | string[] | 接待人员 userid 列表，1~100 个 |
| department_id_list | 否 | int[] | 接待人员部门 ID 列表 |

> 每个客服账号最多 500 个接待人员。第三方应用需填 open_userid。

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "result_list": [
    {"userid": "zhangsan", "errcode": 0, "errmsg": "ok"},
    {"userid": "lisi", "errcode": 95017, "errmsg": "already bindled"}
  ]
}
```

---

### S3 获取接待人员列表

```
GET kf/servicer/list?access_token=ACCESS_TOKEN&open_kfid=XXX
```

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "servicer_list": [
    {"userid": "zhangsan", "status": 0},
    {"userid": "lisi", "status": 1},
    {"department_id": 2}
  ]
}
```

> `status`: 0=接待中, 1=停止接待

---

### M1 发送消息

```
POST kf/send_msg
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| touser | 是 | string | 接收者的 external_userid |
| open_kfid | 是 | string | 客服账号 ID |
| msgid | 否 | string | 指定消息 ID（幂等） |
| msgtype | 是 | string | 消息类型 |
| [msgtype] | 是 | object | 消息体（与 msgtype 同名字段） |

**文本消息示例**

```json
{
  "touser": "wmxxxxxxxx",
  "open_kfid": "wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw",
  "msgtype": "text",
  "text": {
    "content": "您好，有什么可以帮您？"
  }
}
```

**菜单消息示例**

```json
{
  "touser": "wmxxxxxxxx",
  "open_kfid": "wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw",
  "msgtype": "msgmenu",
  "msgmenu": {
    "head_content": "请选择：",
    "list": [
      {"type": "click", "click": {"id": "101", "content": "查询订单"}},
      {"type": "click", "click": {"id": "102", "content": "申请退款"}},
      {"type": "view", "view": {"url": "https://...", "content": "访问官网"}}
    ],
    "tail_content": "感谢您的咨询"
  }
}
```

**响应**

```json
{"errcode": 0, "errmsg": "ok", "msgid": "MSG_ID"}
```

---

### M2 读取消息（同步消息）

```
POST kf/sync_msg
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| cursor | 否 | string | 上次拉取的游标（首次为空） |
| token | 否 | string | 回调中携带的 token |
| limit | 否 | int | 每次拉取条数，≤1000，默认 1000 |
| voice_format | 否 | int | 语音格式：0=amr(默认), 1=silk |
| open_kfid | 否 | string | 指定客服账号过滤 |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "next_cursor": "xxx",
  "has_more": 1,
  "msg_list": [
    {
      "msgid": "from_msgid_xxx",
      "open_kfid": "wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw",
      "external_userid": "wmxxxxxxxx",
      "send_time": 1615478585,
      "origin": 3,
      "servicer_userid": "zhangsan",
      "msgtype": "text",
      "text": {"content": "你好"}
    }
  ]
}
```

**origin 消息来源**

| 值 | 含义 |
|----|------|
| 3 | 微信客户发送 |
| 4 | 系统推送 |
| 5 | 接待人员发送 |

> **重要**：收到回调后用 `sync_msg` 拉取完整消息内容。`has_more=1` 表示还有更多消息需要继续拉取。

---

### C1 获取客户基础信息

```
POST kf/customer/batchget
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| external_userid_list | 是 | string[] | 客户 external_userid 列表，最多 100 个 |
| need_enter_session_context | 否 | int | 1=返回进入会话的上下文信息 |

**响应核心字段**

```json
{
  "customer_list": [
    {
      "external_userid": "wmxxxxxxxx",
      "nickname": "张三",
      "avatar": "https://...",
      "gender": 1,
      "unionid": "oynqfT...",
      "enter_session_context": {
        "scene": "scene_value",
        "scene_param": "param_value",
        "wechat_channels": {"nickname": "视频号昵称"}
      }
    }
  ]
}
```

> `gender`: 0=未知, 1=男, 2=女

---

### T1 获取会话状态

```
POST kf/service_state/get
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| open_kfid | 是 | string | 客服账号 ID |
| external_userid | 是 | string | 客户 external_userid |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "service_state": 3,
  "servicer_userid": "zhangsan"
}
```

---

### T2 变更会话状态

```
POST kf/service_state/trans
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| open_kfid | 是 | string | 客服账号 ID |
| external_userid | 是 | string | 客户 external_userid |
| service_state | 是 | int | 目标状态（见 2.2 流转规则） |
| servicer_userid | 否 | string | 接待人员 userid（转人工时必传） |

> **约束**：状态只能向后流转，不能回退。转到 `service_state=3` 时必须指定 `servicer_userid`。

---

### D1 获取企业汇总数据

```
POST kf/get_corp_statistic
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| open_kfid | 否 | string | 客服账号 ID（不填返回全企业汇总） |
| start_time | 是 | int | 起始时间戳 |
| end_time | 是 | int | 结束时间戳 |

> **约束**：最大跨度 31 天，最多获取 180 天内数据，当天数据需次日 6 点后获取。

---

### K3 添加问答

```
POST kf/knowledge/add_intent
```

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| group_id | 是 | string | 分组 ID |
| question | 是 | object | 主问题 `{text: {content: "..."}}` |
| similar_questions | 否 | object | 相似问题 `{items: [{text: {content: "..."}}]}` |
| answers | 是 | array | 回答列表 |

**请求示例**

```json
{
  "group_id": "GROUP_ID",
  "question": {
    "text": {"content": "怎么退款"}
  },
  "similar_questions": {
    "items": [
      {"text": {"content": "我要退款"}},
      {"text": {"content": "退款怎么操作"}}
    ]
  },
  "answers": [
    {
      "text": {"content": "请前往订单页面点击退款按钮"},
      "attachments": [
        {"msgtype": "image", "image": {"media_id": "MEDIA_ID"}}
      ]
    }
  ]
}
```

**响应**

```json
{"errcode": 0, "errmsg": "ok", "intent_id": "INTENT_ID"}
```

---

## 5. 回调事件

### C1 kf_msg_or_event — 客服消息/事件通知

**触发条件**：客服账号有新消息或事件时推送

**回调 XML**

```xml
<xml>
  <ToUserName><![CDATA[wwcorpid]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1615478585</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[kf_msg_or_event]]></Event>
  <Token><![CDATA[ENCxxx]]></Token>
  <OpenKfId><![CDATA[wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw]]></OpenKfId>
</xml>
```

**处理流程**：收到回调后 → 调用 `kf/sync_msg`（传入 token 和 cursor）拉取完整消息内容。

**事件类型**（通过 sync_msg 获取的 event 消息）

| event_type | 说明 |
|-----------|------|
| enter_session | 用户进入会话 |
| msg_send_fail | 消息发送失败 |
| servicer_status_change | 接待人员状态变化 |
| session_status_change | 会话状态变化 |

**enter_session 事件字段**

```json
{
  "msgtype": "event",
  "event": {
    "event_type": "enter_session",
    "open_kfid": "wkAJ2GCAAAZSfhHCt7IFSvLKtMPxyJTw",
    "external_userid": "wmxxxxxxxx",
    "scene": "scene_value",
    "scene_param": "param_value",
    "welcome_code": "WELCOME_CODE",
    "wechat_channels": {"nickname": "视频号昵称"}
  }
}
```

> `welcome_code`：可用于发送欢迎语（调用 M1 时作为 `code` 参数），仅 20 秒内有效。

---

## 6. 典型工作流

### W1 标准客服接入流

```
A1 创建客服账号 → A5 获取客服链接 → S1 添加接待人员
  → 用户点击链接进入会话
  → C1 回调通知 → M2 拉取消息 → M1 回复
  → T2 转人工接待 → M1 持续回复
  → T2 结束会话
```

### W2 机器人 + 人工混合接待

```
用户进入 → 状态 0(未处理)
  → T2 转状态 1(智能助手) → 知识库自动匹配回复
  → 无法解答 → T2 转状态 2(待接入池)
  → 人工接入 → T2 转状态 3(人工接待)
  → 解答完毕 → T2 转状态 4(结束)
```

### W3 多场景追踪

```
A5 获取链接(scene="web") → 嵌入官网
A5 获取链接(scene="wechat") → 嵌入公众号
  → 用户进入 → C1 获取客户信息(need_enter_session_context=1) → 识别来源场景
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom KF Client — 微信客服管理"""
from wecom_core import WeComClient


class KfClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── A1 添加客服账号 ──
    def add_account(self, name: str, media_id: str) -> str:
        """添加客服账号，返回 open_kfid"""
        resp = self.client.post(
            "kf/account/add",
            json={"name": name, "media_id": media_id},
        )
        return resp["open_kfid"]

    # ── A4 获取客服账号列表 ──
    def list_accounts(self) -> list[dict]:
        """获取所有客服账号"""
        all_accounts: list[dict] = []
        offset = 0
        while True:
            resp = self.client.get(
                "kf/account/list",
                params={"offset": offset, "limit": 100},
            )
            accounts = resp.get("account_list", [])
            all_accounts.extend(accounts)
            if len(accounts) < 100:
                break
            offset += 100
        return all_accounts

    # ── A5 获取客服账号链接 ──
    def get_contact_way(
        self, open_kfid: str, scene: str = ""
    ) -> str:
        """获取客服账号链接"""
        body: dict = {"open_kfid": open_kfid}
        if scene:
            body["scene"] = scene
        resp = self.client.post("kf/add_contact_way", json=body)
        return resp["url"]

    # ── S1 添加接待人员 ──
    def add_servicers(
        self, open_kfid: str, userid_list: list[str]
    ) -> list[dict]:
        """添加接待人员，返回结果列表"""
        resp = self.client.post(
            "kf/servicer/add",
            json={"open_kfid": open_kfid, "userid_list": userid_list},
        )
        return resp.get("result_list", [])

    # ── S3 获取接待人员列表 ──
    def list_servicers(self, open_kfid: str) -> list[dict]:
        """获取接待人员列表"""
        resp = self.client.get(
            "kf/servicer/list", params={"open_kfid": open_kfid}
        )
        return resp.get("servicer_list", [])

    # ── M1 发送消息 ──
    def send_text(
        self, open_kfid: str, touser: str, content: str
    ) -> str:
        """发送文本消息，返回 msgid"""
        resp = self.client.post(
            "kf/send_msg",
            json={
                "touser": touser,
                "open_kfid": open_kfid,
                "msgtype": "text",
                "text": {"content": content},
            },
        )
        return resp.get("msgid", "")

    def send_msg(
        self,
        open_kfid: str,
        touser: str,
        msgtype: str,
        content: dict,
    ) -> str:
        """发送任意类型消息"""
        body: dict = {
            "touser": touser,
            "open_kfid": open_kfid,
            "msgtype": msgtype,
            msgtype: content,
        }
        resp = self.client.post("kf/send_msg", json=body)
        return resp.get("msgid", "")

    # ── M2 读取消息 ──
    def sync_msg(
        self,
        cursor: str = "",
        token: str = "",
        limit: int = 1000,
        open_kfid: str = "",
    ) -> dict:
        """读取消息，返回 {next_cursor, has_more, msg_list}"""
        body: dict = {"limit": limit}
        if cursor:
            body["cursor"] = cursor
        if token:
            body["token"] = token
        if open_kfid:
            body["open_kfid"] = open_kfid
        return self.client.post("kf/sync_msg", json=body)

    # ── C1 获取客户基础信息 ──
    def batch_get_customers(
        self,
        external_userid_list: list[str],
        need_enter_session_context: bool = False,
    ) -> list[dict]:
        """批量获取客户基础信息"""
        body: dict = {"external_userid_list": external_userid_list}
        if need_enter_session_context:
            body["need_enter_session_context"] = 1
        resp = self.client.post("kf/customer/batchget", json=body)
        return resp.get("customer_list", [])

    # ── T1 获取会话状态 ──
    def get_service_state(
        self, open_kfid: str, external_userid: str
    ) -> dict:
        """获取会话状态"""
        return self.client.post(
            "kf/service_state/get",
            json={
                "open_kfid": open_kfid,
                "external_userid": external_userid,
            },
        )

    # ── T2 变更会话状态 ──
    def trans_service_state(
        self,
        open_kfid: str,
        external_userid: str,
        service_state: int,
        servicer_userid: str = "",
    ) -> None:
        """变更会话状态"""
        body: dict = {
            "open_kfid": open_kfid,
            "external_userid": external_userid,
            "service_state": service_state,
        }
        if servicer_userid:
            body["servicer_userid"] = servicer_userid
        self.client.post("kf/service_state/trans", json=body)

    # ── K3 添加问答 ──
    def add_knowledge_intent(
        self,
        group_id: str,
        question: str,
        answers: list[str],
        similar_questions: list[str] | None = None,
    ) -> str:
        """添加知识库问答，返回 intent_id"""
        body: dict = {
            "group_id": group_id,
            "question": {"text": {"content": question}},
            "answers": [
                {"text": {"content": a}} for a in answers
            ],
        }
        if similar_questions:
            body["similar_questions"] = {
                "items": [
                    {"text": {"content": q}}
                    for q in similar_questions
                ]
            }
        resp = self.client.post(
            "kf/knowledge/add_intent", json=body
        )
        return resp.get("intent_id", "")
```

### 7.2 TypeScript

```typescript
/** WeCom KF Client — 微信客服管理 */
import { WeComClient } from './wecom-core';

interface KfAccount {
  open_kfid: string;
  name: string;
  avatar: string;
}

interface Servicer {
  userid?: string;
  department_id?: number;
  status?: number;
}

interface KfMessage {
  msgid: string;
  open_kfid: string;
  external_userid: string;
  send_time: number;
  origin: number;
  servicer_userid?: string;
  msgtype: string;
  [key: string]: unknown;
}

export class KfClient {
  constructor(private client: WeComClient) {}

  /** A1 添加客服账号 */
  async addAccount(name: string, mediaId: string): Promise<string> {
    const resp = await this.client.post('kf/account/add', {
      name,
      media_id: mediaId,
    });
    return resp.open_kfid;
  }

  /** A4 获取客服账号列表 */
  async listAccounts(): Promise<KfAccount[]> {
    const allAccounts: KfAccount[] = [];
    let offset = 0;
    do {
      const resp = await this.client.get('kf/account/list', {
        params: { offset, limit: 100 },
      });
      const list: KfAccount[] = resp.account_list || [];
      allAccounts.push(...list);
      if (list.length < 100) break;
      offset += 100;
    } while (true);
    return allAccounts;
  }

  /** A5 获取客服账号链接 */
  async getContactWay(openKfid: string, scene?: string): Promise<string> {
    const body: Record<string, string> = { open_kfid: openKfid };
    if (scene) body.scene = scene;
    const resp = await this.client.post('kf/add_contact_way', body);
    return resp.url;
  }

  /** S1 添加接待人员 */
  async addServicers(
    openKfid: string,
    useridList: string[],
  ): Promise<Array<{ userid: string; errcode: number }>> {
    const resp = await this.client.post('kf/servicer/add', {
      open_kfid: openKfid,
      userid_list: useridList,
    });
    return resp.result_list || [];
  }

  /** S3 获取接待人员列表 */
  async listServicers(openKfid: string): Promise<Servicer[]> {
    const resp = await this.client.get('kf/servicer/list', {
      params: { open_kfid: openKfid },
    });
    return resp.servicer_list || [];
  }

  /** M1 发送文本消息 */
  async sendText(
    openKfid: string,
    touser: string,
    content: string,
  ): Promise<string> {
    const resp = await this.client.post('kf/send_msg', {
      touser,
      open_kfid: openKfid,
      msgtype: 'text',
      text: { content },
    });
    return resp.msgid;
  }

  /** M2 读取消息 */
  async syncMsg(
    cursor = '',
    token = '',
    limit = 1000,
  ): Promise<{ next_cursor: string; has_more: number; msg_list: KfMessage[] }> {
    const body: Record<string, unknown> = { limit };
    if (cursor) body.cursor = cursor;
    if (token) body.token = token;
    return this.client.post('kf/sync_msg', body);
  }

  /** T2 变更会话状态 */
  async transServiceState(
    openKfid: string,
    externalUserid: string,
    serviceState: number,
    servicerUserid?: string,
  ): Promise<void> {
    const body: Record<string, unknown> = {
      open_kfid: openKfid,
      external_userid: externalUserid,
      service_state: serviceState,
    };
    if (servicerUserid) body.servicer_userid = servicerUserid;
    await this.client.post('kf/service_state/trans', body);
  }
}
```

### 7.3 Go

```go
package kf

import (
	"context"

	wecom "your-module/wecom-core"
)

type KfClient struct {
	client *wecom.WeComClient
}

func NewKfClient(c *wecom.WeComClient) *KfClient {
	return &KfClient{client: c}
}

type BaseResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// ── A1 添加客服账号 ──

type AddAccountResp struct {
	BaseResp
	OpenKfID string `json:"open_kfid"`
}

func (k *KfClient) AddAccount(ctx context.Context, name, mediaID string) (string, error) {
	var resp AddAccountResp
	err := k.client.Post(ctx, "kf/account/add",
		map[string]string{"name": name, "media_id": mediaID}, &resp)
	return resp.OpenKfID, err
}

// ── A5 获取客服账号链接 ──

type ContactWayResp struct {
	BaseResp
	URL string `json:"url"`
}

func (k *KfClient) GetContactWay(ctx context.Context, openKfID, scene string) (string, error) {
	body := map[string]string{"open_kfid": openKfID}
	if scene != "" {
		body["scene"] = scene
	}
	var resp ContactWayResp
	err := k.client.Post(ctx, "kf/add_contact_way", body, &resp)
	return resp.URL, err
}

// ── M1 发送文本消息 ──

type SendMsgResp struct {
	BaseResp
	MsgID string `json:"msgid"`
}

func (k *KfClient) SendText(ctx context.Context, openKfID, touser, content string) (string, error) {
	req := map[string]interface{}{
		"touser":     touser,
		"open_kfid":  openKfID,
		"msgtype":    "text",
		"text":       map[string]string{"content": content},
	}
	var resp SendMsgResp
	err := k.client.Post(ctx, "kf/send_msg", req, &resp)
	return resp.MsgID, err
}

// ── M2 读取消息 ──

type SyncMsgReq struct {
	Cursor   string `json:"cursor,omitempty"`
	Token    string `json:"token,omitempty"`
	Limit    int    `json:"limit,omitempty"`
	OpenKfID string `json:"open_kfid,omitempty"`
}

type SyncMsgResp struct {
	BaseResp
	NextCursor string                   `json:"next_cursor"`
	HasMore    int                      `json:"has_more"`
	MsgList    []map[string]interface{} `json:"msg_list"`
}

func (k *KfClient) SyncMsg(ctx context.Context, cursor, token string, limit int) (*SyncMsgResp, error) {
	req := &SyncMsgReq{Cursor: cursor, Token: token, Limit: limit}
	var resp SyncMsgResp
	err := k.client.Post(ctx, "kf/sync_msg", req, &resp)
	return &resp, err
}

// ── T2 变更会话状态 ──

type TransStateReq struct {
	OpenKfID        string `json:"open_kfid"`
	ExternalUserid  string `json:"external_userid"`
	ServiceState    int    `json:"service_state"`
	ServicerUserid  string `json:"servicer_userid,omitempty"`
}

func (k *KfClient) TransServiceState(ctx context.Context, req *TransStateReq) error {
	var resp BaseResp
	return k.client.Post(ctx, "kf/service_state/trans", req, &resp)
}

// ── C1 获取客户基础信息 ──

type CustomerInfo struct {
	ExternalUserid string `json:"external_userid"`
	Nickname       string `json:"nickname"`
	Avatar         string `json:"avatar"`
	Gender         int    `json:"gender"`
	Unionid        string `json:"unionid"`
}

type BatchGetCustomerResp struct {
	BaseResp
	CustomerList []CustomerInfo `json:"customer_list"`
}

func (k *KfClient) BatchGetCustomers(ctx context.Context, externalUserids []string) ([]CustomerInfo, error) {
	var resp BatchGetCustomerResp
	err := k.client.Post(ctx, "kf/customer/batchget",
		map[string]interface{}{"external_userid_list": externalUserids}, &resp)
	return resp.CustomerList, err
}
```

---


### 7.4 Java 示例

```java
public class WeComKfService {
    private final WeComClient client;

    public WeComKfService(WeComClient client) {
        this.client = client;
    }

    /** 发送客服消息 */
    public JsonObject sendMsg(String openKfId, String toUser, String msgType, JsonObject content) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("touser", toUser);
        body.addProperty("open_kfid", openKfId);
        body.addProperty("msgtype", msgType);
        body.add(msgType, content);
        return client.post("/kf/send_msg", body);
    }

    /** 同步客服消息 — ⚠️ 需要轮询 */
    public JsonObject syncMsg(String cursor, String openKfId, int limit) throws Exception {
        JsonObject body = new JsonObject();
        if (cursor != null) body.addProperty("cursor", cursor);
        if (openKfId != null) body.addProperty("open_kfid", openKfId);
        body.addProperty("limit", Math.min(limit, 1000));
        return client.post("/kf/sync_msg", body);
    }

    /** 获取客服账号列表 */
    public JsonArray listAccounts() throws Exception {
        return client.post("/kf/account/list", new JsonObject())
            .getAsJsonArray("account_list");
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

### 7.5 PHP 示例

```php
<?php
class WeComKfService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 发送客服消息 */
    public function sendMsg(string $openKfId, string $toUser, string $msgType, array $content): array
    {
        return $this->client->post('/cgi-bin/kf/send_msg', [
            'touser'    => $toUser,
            'open_kfid' => $openKfId,
            'msgtype'   => $msgType,
            $msgType    => $content,
        ]);
    }

    /** 同步客服消息 — ⚠️ 需要轮询 */
    public function syncMsg(?string $cursor = null, ?string $openKfId = null, int $limit = 1000): array
    {
        $body = ['limit' => min($limit, 1000)];
        if ($cursor) $body['cursor'] = $cursor;
        if ($openKfId) $body['open_kfid'] = $openKfId;
        return $this->client->post('/cgi-bin/kf/sync_msg', $body);
    }

    /** 获取客服账号列表 */
    public function listAccounts(): array
    {
        $data = $this->client->post('/cgi-bin/kf/account/list', []);
        return $data['account_list'] ?? [];
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 8. 测试模板

### T1 客服账号与接待人员管理

```python
def test_account_and_servicer():
    """创建客服账号 → 添加接待人员 → 获取列表"""
    client = KfClient(wecom_client)

    # 获取账号列表
    accounts = client.list_accounts()
    assert isinstance(accounts, list)
    if not accounts:
        return  # 需要先在管理后台创建

    open_kfid = accounts[0]["open_kfid"]

    # 获取接待人员列表
    servicers = client.list_servicers(open_kfid)
    assert isinstance(servicers, list)
```

### T2 消息收发流程

```python
def test_sync_and_send_msg():
    """同步消息 → 回复消息"""
    client = KfClient(wecom_client)

    # 同步消息
    result = client.sync_msg(limit=10)
    assert "next_cursor" in result
    assert "msg_list" in result

    # 如果有消息，尝试回复
    for msg in result["msg_list"]:
        if msg.get("origin") == 3:  # 客户发送的
            msgid = client.send_text(
                open_kfid=msg["open_kfid"],
                touser=msg["external_userid"],
                content="已收到您的消息，正在处理中。",
            )
            assert msgid
            break
```

### T3 会话状态流转

```python
def test_service_state_flow():
    """获取状态 → 转人工 → 结束"""
    client = KfClient(wecom_client)

    state = client.get_service_state(OPEN_KFID, EXTERNAL_USERID)
    assert state["service_state"] in [0, 1, 2, 3, 4]

    # 转人工
    if state["service_state"] in [0, 1, 2]:
        client.trans_service_state(
            open_kfid=OPEN_KFID,
            external_userid=EXTERNAL_USERID,
            service_state=3,
            servicer_userid="zhangsan",
        )
```

---

## 9. Code Review 检查清单

- [ ] **CR1** 路径不含 `/cgi-bin/` 前缀
- [ ] **CR2** Python `post()` 使用 `json=body` keyword 参数
- [ ] **CR3** 使用「微信客服」专用 secret 而非普通应用 secret
- [ ] **CR4** A4/S3 是 **GET** 请求，其余为 POST
- [ ] **CR5** `service_state` 只能向后流转，不能回退
- [ ] **CR6** 转人工 (state=3) 时必须传 `servicer_userid`
- [ ] **CR7** `sync_msg` 的 `has_more=1` 时须继续拉取
- [ ] **CR8** `welcome_code` 20 秒有效期，超时即失效
- [ ] **CR9** 客服账号链接 URL 参数不可修改或复制到其他链接
- [ ] **CR10** 统计数据当天不可用，需次日 6 点后获取

---

## 10. 踩坑指南 (Gotcha Guide)

### G1 回调只是通知，内容需要主动拉取

**症状**：收到 `kf_msg_or_event` 回调但无消息内容

**原因**：回调 XML 仅含 token 和 open_kfid，不含消息内容。

**解法**：收到回调后调用 `kf/sync_msg` 拉取完整消息内容，`has_more=1` 时须循环拉取。

---

### G2 会话状态只能前进不能后退

**症状**：变更会话状态时返回错误

**原因**：状态只能 0→1/2/3/4, 1→2/3/4, 2→3/4, 3→4，不能回退。

**解法**：检查当前状态后选择合法的目标状态。

---

### G3 welcome_code 有效期仅 20 秒

**症状**：使用 welcome_code 发送欢迎语失败

**原因**：`enter_session` 事件中的 `welcome_code` 仅 20 秒有效。

**解法**：收到 enter_session 事件后立即使用 welcome_code 发送欢迎语，不要延迟处理。

---

### G4 接待人员上限 500

**症状**：添加接待人员返回错误

**原因**：每个客服账号最多 500 个接待人员。

**解法**：检查当前接待人员数量，或使用部门方式添加。

---

### G5 客服链接参数不可篡改

**症状**：进入会话时回调参数校验不通过

**原因**：A5 返回的 URL 中的加密参数不能修改或复制到其他链接。

**解法**：每个场景调用一次 A5 获取独立链接，不要手动拼接或复制参数。

---

### G6 GET 与 POST 混用

**症状**：调用 A4/S3 返回错误

**原因**：`kf/account/list` 和 `kf/servicer/list` 是 **GET** 请求，参数通过 query string 传递，而非 POST body。

**解法**：注意区分 GET 和 POST 接口，GET 接口参数放在 URL query 中。

---

### G7 统计数据延迟

**症状**：查询当天数据返回空

**原因**：当天数据需次日 6 点后才能获取。

**解法**：查询 T-1 及更早的数据，或在次日早上 6 点后查询前一天数据。

---

### G8 第三方应用使用 open_userid

**症状**：第三方应用添加接待人员时 userid 无效

**原因**：第三方应用需使用密文 userid（即 open_userid），而非明文。

**解法**：第三方应用中统一使用 open_userid。

---

## 11. 参考链接

| 文档 | 链接 |
|------|------|
| 微信客服概述 | https://developer.work.weixin.qq.com/document/path/94638 |
| 客服账号管理 | https://developer.work.weixin.qq.com/document/path/94662 |
| 获取客服账号链接 | https://developer.work.weixin.qq.com/document/path/94665 |
| 接待人员管理 | https://developer.work.weixin.qq.com/document/path/94696 |
| 发送消息 | https://developer.work.weixin.qq.com/document/path/94677 |
| 读取消息 | https://developer.work.weixin.qq.com/document/path/94670 |
| 获取客户基础信息 | https://developer.work.weixin.qq.com/document/path/95159 |
| 会话状态管理 | https://developer.work.weixin.qq.com/document/path/94669 |
| 知识库问答管理 | https://developer.work.weixin.qq.com/document/path/95972 |
| 知识库分组管理 | https://developer.work.weixin.qq.com/document/path/95971 |
| 企业汇总统计 | https://developer.work.weixin.qq.com/document/path/96432 |
| 接待人员统计 | https://developer.work.weixin.qq.com/document/path/95490 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |


