---
name: wecom-crm-contactway
description: 企业微信外部联系人·「联系我」与「加入群聊」管理 SKILL — 渠道活码 CRUD、临时会话、群进群方式
version: 1.0.0
triggers:
  - 联系我
  - contact_way
  - 加入群聊
  - join_way
  - config_id
  - 渠道活码
  - 临时会话
  - is_temp
  - close_temp_chat
  - conclusions
  - 结束语
  - qr_code
  - state
  - 50万额度
prerequisite_skills:
  - wecom-core
domain: crm-contactway
api_count: 10
callback_count: 0
---

# WeCom CRM · 联系我与加入群聊管理 SKILL

> 覆盖企业微信「外部联系人 · 客户联系」子域：「联系我」CRUD（6 个 API）+ 「加入群聊」CRUD（4 个 API）。
> 包括渠道活码、临时会话、结束语、群二维码自动建群等完整功能。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 「客户联系」secret 或已配置到「可调用应用」列表的自建应用 secret | 客户联系使用范围 |
| 第三方应用 | 企业授权的 access_token | 「企业客户权限 → 客户联系 → 配置联系我方式」 |

> **关键约束**：
> - 配置的使用成员必须**在企业微信激活、已实名认证、配置了客户联系功能**
> - `user` / `party` 必须在应用可见范围或客户可建联的成员范围内
> - 2023-12-01 起新企业不再提供客户联系 Secret，推荐使用自建应用授权方式

### 1.2 额度说明

| 限制项 | 额度 |
|--------|------|
| API 配置的「联系我」+「加入群聊」总数 | **50 万**（共用） |
| 临时会话每日新增上限 | **10 万**（不占 50 万额度） |
| 每个联系方式最多使用成员数 | **100 人** |
| 每个「加入群聊」最多关联群数 | **5 个** |

---

## 2. 核心概念

### 2.1 联系方式类型 (type)

| type | 含义 | 说明 |
|------|------|------|
| 1 | 单人 | 仅配置一个使用成员，user 数组只能有 1 个元素 |
| 2 | 多人 | 可配置多个使用成员 + 部门 |

### 2.2 场景 (scene)

| scene | 含义 | 说明 |
|-------|------|------|
| 1 | 小程序中联系 | 使用小程序插件，不返回 qr_code |
| 2 | 通过二维码联系 | 返回 qr_code 链接 |

### 2.3 config_id

API 创建的「联系我」和「加入群聊」**不会在管理后台展示**。`config_id` 是后续查询、更新、删除的唯一凭证，**必须持久化存储**。丢失后无法找回。

### 2.4 临时会话 (is_temp)

- 仅支持医疗行业企业
- 仅支持单人模式 (type=1)
- 二维码**一次性使用**，添加好友后即刻失效
- 可配置会话有效期和结束语 (conclusions)
- 不占 50 万额度，但每日上限 10 万

### 2.5 conclusions 结束语

临时会话结束时自动发送。消息类型组合规则：
- `text` + (`image` | `link` | `miniprogram`) 可同时发送（两条消息）
- `image`、`link`、`miniprogram` **只取一个**，优先级：**image > link > miniprogram**
- 四者不能全部为空

### 2.6 state 参数（渠道追踪）

| 场景 | state 作用 | 回传方式 |
|------|-----------|---------|
| 联系我 | 区分不同添加渠道 | `add_external_contact` 回调事件的 State 字段 |
| 加入群聊 | 区分不同入群渠道 | 获取群详情 API 中成员的 state 字段（join_scene=3） |

### 2.7 自动建群命名规则

`room_base_name` + `room_base_id` 组合：
- 如 `room_base_name="销售群"`, `room_base_id=10`
- 自动建群依次命名：销售群10、销售群11、销售群12...

---

## 3. API 速查表

| ID | 接口名 | 方法 | 路径 | 说明 |
|----|--------|------|------|------|
| C1 | add_contact_way | POST | `/cgi-bin/externalcontact/add_contact_way` | 配置「联系我」方式 |
| C2 | get_contact_way | POST | `/cgi-bin/externalcontact/get_contact_way` | 获取「联系我」配置 |
| C3 | list_contact_way | POST | `/cgi-bin/externalcontact/list_contact_way` | 获取「联系我」列表 |
| C4 | update_contact_way | POST | `/cgi-bin/externalcontact/update_contact_way` | 更新「联系我」配置 |
| C5 | del_contact_way | POST | `/cgi-bin/externalcontact/del_contact_way` | 删除「联系我」配置 |
| C6 | close_temp_chat | POST | `/cgi-bin/externalcontact/close_temp_chat` | 结束临时会话 |
| J1 | add_join_way | POST | `/cgi-bin/externalcontact/groupchat/add_join_way` | 配置「加入群聊」方式 |
| J2 | get_join_way | POST | `/cgi-bin/externalcontact/groupchat/get_join_way` | 获取「加入群聊」配置 |
| J3 | update_join_way | POST | `/cgi-bin/externalcontact/groupchat/update_join_way` | 更新「加入群聊」配置 |
| J4 | del_join_way | POST | `/cgi-bin/externalcontact/groupchat/del_join_way` | 删除「加入群聊」配置 |

**Base URL**: `https://qyapi.weixin.qq.com`
**所有接口均需附带 `?access_token=ACCESS_TOKEN` 查询参数。**

---

## 4. API 详细说明

### C1: 配置客户联系「联系我」方式

**POST** `/cgi-bin/externalcontact/add_contact_way?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | int | 是 | 联系方式类型：1=单人 2=多人 |
| `scene` | int | 是 | 场景：1=小程序 2=二维码 |
| `style` | int | 否 | 小程序控件样式，仅 scene=1 有效 |
| `remark` | string | 否 | 备注，最多 **30 字符** |
| `skip_verify` | bool | 否 | 是否跳过验证，默认 true |
| `state` | string | 否 | 渠道参数，最多 **30 字符** |
| `user` | string[] | 条件必填 | 使用成员 userid 列表。type=1 时必填且仅 1 个 |
| `party` | int[] | 否 | 使用部门 ID 列表，仅 type=2 有效 |
| `is_temp` | bool | 否 | 是否临时会话，默认 false |
| `expires_in` | int | 否 | 临时会话二维码有效期（秒），最长 **14 天** |
| `chat_expires_in` | int | 否 | 临时会话有效期（秒），最长 **14 天** |
| `unionid` | string | 否 | 限制临时会话的客户 unionid |
| `is_exclusive` | bool | 否 | 同一外部企业客户是否只能添加一个成员（**仅自建应用**） |
| `conclusions` | object | 否 | 结束语，仅 is_temp=true 有效 |

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `config_id` | string | 联系方式配置 ID，**必须持久化存储** |
| `qr_code` | string | 二维码链接，**仅 scene=2 时返回** |

---

### C2: 获取企业已配置的「联系我」方式

**POST** `/cgi-bin/externalcontact/get_contact_way?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `config_id` | string | 是 | 联系方式配置 ID |

#### 响应

返回 `contact_way` 对象，包含创建时的所有字段 + `qr_code`（scene=2 时）。get 时 image 结构额外返回 `pic_url` 字段。

---

### C3: 获取企业已配置的「联系我」列表

**POST** `/cgi-bin/externalcontact/list_contact_way?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start_time` | int | 否 | 创建起始时间戳 |
| `end_time` | int | 否 | 创建结束时间戳 |
| `cursor` | string | 否 | 分页游标 |
| `limit` | int | 否 | 每页大小，默认 100，最多 **1000** |
| `userid` | string | 否 | 按成员 userid 过滤 |
| `skip_verify` | bool | 否 | 按是否跳过验证过滤 |

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `contact_way` | object[] | `[{config_id: string}]` 列表 |
| `next_cursor` | string | 分页游标，空表示无更多数据 |

#### 关键约束

1. **仅可获取 2021-07-10 以后创建的「联系我」**
2. **不包含临时会话**
3. 需逐个调用 C2 获取完整配置

---

### C4: 更新企业已配置的「联系我」方式

**POST** `/cgi-bin/externalcontact/update_contact_way?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `config_id` | string | 是 | 联系方式配置 ID |
| `remark` | string | 否 | 备注 |
| `skip_verify` | bool | 否 | 是否跳过验证 |
| `style` | int | 否 | 小程序控件样式 |
| `state` | string | 否 | 渠道参数 |
| `user` | string[] | 否 | 使用成员（**覆盖更新**） |
| `party` | int[] | 否 | 使用部门（**覆盖更新**） |
| `expires_in` | int | 否 | 临时会话二维码有效期 |
| `chat_expires_in` | int | 否 | 临时会话有效期 |
| `unionid` | string | 否 | 客户 unionid |
| `conclusions` | object | 否 | 结束语 |

> **覆盖更新**：所有参数均为覆盖式。若只改 remark 而不传 user，user 可能被清空。

---

### C5: 删除企业已配置的「联系我」方式

**POST** `/cgi-bin/externalcontact/del_contact_way?access_token=ACCESS_TOKEN`

请求：`{"config_id": "xxx"}`

---

### C6: 结束临时会话

**POST** `/cgi-bin/externalcontact/close_temp_chat?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userid` | string | 是 | 企业成员 userid |
| `external_userid` | string | 是 | 客户 external_userid |

> 仅能关闭通过临时会话建立的会话。断开前自动下发 conclusions 结束语。

---

### J1: 配置客户群进群方式

**POST** `/cgi-bin/externalcontact/groupchat/add_join_way?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `scene` | int | 是 | 1=群小程序插件 2=群二维码插件 |
| `remark` | string | 否 | 备注，最多 30 字符 |
| `auto_create_room` | int | 否 | 群满后自动建群：0=否(默认) 1=是 |
| `room_base_name` | string | 否 | 自动建群的群名前缀 |
| `room_base_id` | int | 否 | 自动建群的群名起始序号 |
| `chat_id_list` | string[] | 是 | 客户群 ID 列表，最多 **5 个** |
| `state` | string | 否 | 渠道参数，最多 30 UTF-8 字符 |
| `mark_source` | bool | 否 | 是否标记来源（需企业开通相关功能） |

#### 响应

| 参数 | 类型 | 说明 |
|------|------|------|
| `config_id` | string | 配置 ID，**必须持久化存储** |
| `qr_code` | string | 二维码链接，**仅 scene=2 时返回** |

---

### J2: 获取客户群进群方式配置

**POST** `/cgi-bin/externalcontact/groupchat/get_join_way?access_token=ACCESS_TOKEN`

请求：`{"config_id": "xxx"}`

返回 `join_way` 对象，包含创建时的所有字段 + `qr_code`（scene=2 时）。

---

### J3: 更新客户群进群方式配置

**POST** `/cgi-bin/externalcontact/groupchat/update_join_way?access_token=ACCESS_TOKEN`

额外必传 `config_id`，其余参数均为可选（未传字段保持不变）。`scene`、`chat_id_list` 等一旦传入即**覆盖更新**。

---

### J4: 删除客户群进群方式配置

**POST** `/cgi-bin/externalcontact/groupchat/del_join_way?access_token=ACCESS_TOKEN`

请求：`{"config_id": "xxx"}`

---

## 5. 回调事件

本 SKILL 无专属回调事件。但「联系我」相关的回调事件属于 `wecom-crm-customer` SKILL 管辖：

| 事件 | ChangeType | 关联字段 |
|------|-----------|---------|
| 添加外部联系人 | `add_external_contact` | `State` 字段即为联系我的 state 参数 |
| 删除外部联系人 | `del_external_contact` | - |

「加入群聊」相关的回调事件属于 `wecom-crm-group` SKILL 管辖（`change_external_chat` 的 `add_member` 事件）。

---

## 6. 工作流

### 6.1 渠道活码管理（联系我 CRUD）

```
步骤 1: 创建渠道活码
  调用 C1 (add_contact_way)
  ├─ type=2, scene=2 (多人二维码)
  ├─ state="channel_xxx" (渠道标识)
  └─ 保存返回的 config_id + qr_code

步骤 2: 查看活码配置
  调用 C2 (get_contact_way) by config_id

步骤 3: 更新活码（如换人）
  调用 C4 (update_contact_way)
  ⚠️ 覆盖更新：必须传完整 user 列表

步骤 4: 删除活码
  调用 C5 (del_contact_way) by config_id
```

### 6.2 批量管理联系我列表

```
步骤 1: 拉取 config_id 列表
  调用 C3 (list_contact_way)
  ├─ 可选 start_time / end_time 过滤
  └─ cursor 分页遍历

步骤 2: 逐个获取完整配置
  对每个 config_id 调用 C2 (get_contact_way)

步骤 3: 批量清理无用活码
  对不需要的 config_id 调用 C5 (del_contact_way)
```

### 6.3 客户群进群码管理

```
步骤 1: 创建群进群码
  调用 J1 (add_join_way)
  ├─ scene=2, chat_id_list=[群1, 群2]
  ├─ auto_create_room=1 (群满自动建群)
  ├─ room_base_name="销售群", room_base_id=1
  └─ state="campaign_xxx"

步骤 2: 查看进群配置
  调用 J2 (get_join_way) by config_id

步骤 3: 更新群列表
  调用 J3 (update_join_way)
  ⚠️ 必须传 scene + chat_id_list

步骤 4: 删除进群码
  调用 J4 (del_join_way) by config_id
```

### 6.4 临时会话工作流（医疗行业）

```
步骤 1: 创建临时会话联系方式
  调用 C1 (add_contact_way)
  ├─ type=1, scene=2 (单人二维码)
  ├─ is_temp=true
  ├─ expires_in=86400 (二维码 24h 有效)
  ├─ chat_expires_in=86400 (会话 24h 有效)
  └─ conclusions={text: {content: "会话结束"}}

步骤 2: 用户扫码 → 自动添加好友 → 开始会话
  二维码一次性使用，添加后即失效

步骤 3: 手动结束会话（可选）
  调用 C6 (close_temp_chat)
  └─ 自动下发 conclusions 结束语
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom CRM 联系我与加入群聊管理器 — 依赖 wecom-core 的 WeComClient"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class ContactWayManager:
    """联系我与加入群聊管理器"""

    def __init__(self, client):
        """
        Args:
            client: WeComClient 实例（来自 wecom-core）
        """
        self.client = client

    # ── C1: 配置「联系我」方式 ──

    def add_contact_way(
        self,
        type_: int,
        scene: int,
        user: list[str],
        *,
        party: Optional[list[int]] = None,
        remark: str = "",
        skip_verify: bool = True,
        state: str = "",
        style: int = 0,
        is_temp: bool = False,
        expires_in: int = 0,
        chat_expires_in: int = 0,
        unionid: str = "",
        is_exclusive: bool = False,
        conclusions: Optional[dict] = None,
    ) -> dict:
        """
        创建「联系我」方式。

        Args:
            type_: 1=单人 2=多人
            scene: 1=小程序 2=二维码
            user: 使用成员 userid 列表

        Returns:
            dict: {"config_id": "xxx", "qr_code": "xxx"(scene=2时)}
        """
        body: dict = {
            "type": type_,
            "scene": scene,
            "user": user,
            "skip_verify": skip_verify,
        }
        if party:
            body["party"] = party
        if remark:
            body["remark"] = remark[:30]
        if state:
            body["state"] = state[:30]
        if style:
            body["style"] = style
        if is_temp:
            body["is_temp"] = True
            if expires_in > 0:
                body["expires_in"] = min(expires_in, 14 * 86400)
            if chat_expires_in > 0:
                body["chat_expires_in"] = min(chat_expires_in, 14 * 86400)
            if unionid:
                body["unionid"] = unionid
            if conclusions:
                body["conclusions"] = conclusions
        if is_exclusive:
            body["is_exclusive"] = True

        resp = self.client.post(
            "/externalcontact/add_contact_way", json=body
        )
        return {
            "config_id": resp["config_id"],
            "qr_code": resp.get("qr_code", ""),
        }

    # ── C2: 获取「联系我」配置 ──

    def get_contact_way(self, config_id: str) -> dict:
        """获取联系我配置详情。"""
        resp = self.client.post(
            "/externalcontact/get_contact_way",
            json={"config_id": config_id},
        )
        return resp["contact_way"]

    # ── C3: 获取「联系我」列表 ──

    def list_contact_ways(
        self,
        start_time: int = 0,
        end_time: int = 0,
        limit: int = 100,
        userid: str = "",
        skip_verify: bool | None = None,
    ) -> list[str]:
        """
        获取联系我 config_id 列表（自动分页）。

        Note: 仅可获取 2021-07-10 以后创建的，不含临时会话。

        Returns:
            list[str]: config_id 列表
        """
        config_ids = []
        cursor = ""
        while True:
            body: dict = {"cursor": cursor, "limit": min(limit, 1000)}
            if start_time > 0:
                body["start_time"] = start_time
            if end_time > 0:
                body["end_time"] = end_time
            if userid:
                body["userid"] = userid
            if skip_verify is not None:
                body["skip_verify"] = skip_verify
            resp = self.client.post(
                "/externalcontact/list_contact_way", json=body
            )
            for item in resp.get("contact_way", []):
                config_ids.append(item["config_id"])
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return config_ids

    # ── C4: 更新「联系我」配置 ──

    def update_contact_way(self, config_id: str, **kwargs) -> None:
        """
        更新联系我配置。

        Warning: 覆盖更新！若只改 remark 不传 user，user 可能被清空。
            建议先 get_contact_way 获取当前配置再合并更新。
        """
        body = {"config_id": config_id, **kwargs}
        self.client.post(
            "/externalcontact/update_contact_way", json=body
        )

    # ── C5: 删除「联系我」配置 ──

    def del_contact_way(self, config_id: str) -> None:
        """删除联系我配置。"""
        self.client.post(
            "/externalcontact/del_contact_way",
            json={"config_id": config_id},
        )

    # ── C6: 结束临时会话 ──

    def close_temp_chat(self, userid: str, external_userid: str) -> None:
        """
        结束临时会话。断开前自动下发 conclusions 结束语。

        仅能关闭通过临时会话建立的联系关系。
        """
        self.client.post(
            "/externalcontact/close_temp_chat",
            json={"userid": userid, "external_userid": external_userid},
        )

    # ── J1: 配置「加入群聊」方式 ──

    def add_join_way(
        self,
        scene: int,
        chat_id_list: list[str],
        *,
        remark: str = "",
        auto_create_room: int = 0,
        room_base_name: str = "",
        room_base_id: int = 0,
        state: str = "",
        mark_source: bool = False,
    ) -> dict:
        """
        创建「加入群聊」方式。

        Args:
            scene: 1=群小程序插件 2=群二维码插件
            chat_id_list: 客户群 ID 列表，最多 5 个

        Returns:
            dict: {"config_id": "xxx", "qr_code": "..."} (qr_code 仅 scene=2)
        """
        body: dict = {
            "scene": scene,
            "chat_id_list": chat_id_list[:5],
        }
        if remark:
            body["remark"] = remark[:30]
        if auto_create_room:
            body["auto_create_room"] = 1
            if room_base_name:
                body["room_base_name"] = room_base_name
            if room_base_id > 0:
                body["room_base_id"] = room_base_id
        if state:
            body["state"] = state[:30]
        if mark_source:
            body["mark_source"] = True

        resp = self.client.post(
            "/externalcontact/groupchat/add_join_way", json=body
        )
        return {
            "config_id": resp["config_id"],
            "qr_code": resp.get("qr_code", ""),
        }

    # ── J2: 获取「加入群聊」配置 ──

    def get_join_way(self, config_id: str) -> dict:
        """获取加入群聊配置详情。"""
        resp = self.client.post(
            "/externalcontact/groupchat/get_join_way",
            json={"config_id": config_id},
        )
        return resp["join_way"]

    # ── J3: 更新「加入群聊」配置 ──

    def update_join_way(self, config_id: str, **kwargs) -> None:
        """
        更新加入群聊配置。

        Warning: 覆盖更新！传入的字段会完整覆盖原值，未传字段保持不变。
        """
        body = {"config_id": config_id, **kwargs}
        if "chat_id_list" in body:
            body["chat_id_list"] = body["chat_id_list"][:5]
        self.client.post(
            "/externalcontact/groupchat/update_join_way", json=body
        )

    # ── J4: 删除「加入群聊」配置 ──

    def del_join_way(self, config_id: str) -> None:
        """删除加入群聊配置。"""
        self.client.post(
            "/externalcontact/groupchat/del_join_way",
            json={"config_id": config_id},
        )
```

### 7.2 TypeScript

```typescript
/**
 * WeCom CRM 联系我与加入群聊管理器
 * 依赖 wecom-core 的 WeComClient
 */

// ── 类型定义 ──

interface Conclusions {
  text?: { content: string };
  image?: { media_id: string; pic_url?: string };
  link?: { title: string; picurl: string; desc: string; url: string };
  miniprogram?: {
    title: string;
    pic_media_id: string;
    appid: string;
    page: string;
  };
}

interface AddContactWayRequest {
  type: 1 | 2;
  scene: 1 | 2;
  style?: number;
  remark?: string;
  skip_verify?: boolean;
  state?: string;
  user: string[];
  party?: number[];
  is_temp?: boolean;
  expires_in?: number;
  chat_expires_in?: number;
  unionid?: string;
  is_exclusive?: boolean;
  conclusions?: Conclusions;
}

interface ContactWayConfig {
  config_id: string;
  type: 1 | 2;
  scene: 1 | 2;
  style: number;
  remark: string;
  skip_verify: boolean;
  state: string;
  qr_code: string;
  user: string[];
  party: number[];
  is_temp: boolean;
  expires_in: number;
  chat_expires_in: number;
  unionid: string;
  is_exclusive: boolean;
  conclusions?: Conclusions;
}

interface AddJoinWayRequest {
  scene: 1 | 2;
  remark?: string;
  auto_create_room?: 0 | 1;
  room_base_name?: string;
  room_base_id?: number;
  chat_id_list: string[];
  state?: string;
  mark_source?: boolean;
}

interface JoinWayConfig {
  config_id: string;
  scene: 1 | 2;
  remark: string;
  auto_create_room: 0 | 1;
  room_base_name: string;
  room_base_id: number;
  chat_id_list: string[];
  qr_code: string;
  state: string;
}

// ── 管理器 ──

class ContactWayManager {
  constructor(private client: WeComClient) {}

  // C1: 配置「联系我」
  async addContactWay(
    req: AddContactWayRequest,
  ): Promise<{ config_id: string; qr_code: string }> {
    const resp = await this.client.post<{
      config_id: string;
      qr_code?: string;
    }>("/externalcontact/add_contact_way", req);
    return { config_id: resp.config_id, qr_code: resp.qr_code ?? "" };
  }

  // C2: 获取「联系我」配置
  async getContactWay(configId: string): Promise<ContactWayConfig> {
    const resp = await this.client.post<{
      contact_way: ContactWayConfig;
    }>("/externalcontact/get_contact_way", {
      config_id: configId,
    });
    return resp.contact_way;
  }

  // C3: 获取「联系我」列表（自动分页）
  async listContactWays(opts?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
    userid?: string;
    skipVerify?: boolean;
  }): Promise<string[]> {
    const configIds: string[] = [];
    let cursor = "";
    do {
      const body: Record<string, unknown> = {
        cursor,
        limit: Math.min(opts?.limit ?? 100, 1000),
      };
      if (opts?.startTime) body.start_time = opts.startTime;
      if (opts?.endTime) body.end_time = opts.endTime;
      const resp = await this.client.post<{
        contact_way: Array<{ config_id: string }>;
        next_cursor: string;
      }>("/externalcontact/list_contact_way", body);
      configIds.push(...(resp.contact_way ?? []).map((c) => c.config_id));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return configIds;
  }

  // C4: 更新「联系我」（覆盖更新）
  async updateContactWay(
    configId: string,
    updates: Partial<Omit<AddContactWayRequest, "type" | "scene">>,
  ): Promise<void> {
    await this.client.post(
      "/externalcontact/update_contact_way",
      { config_id: configId, ...updates },
    );
  }

  // C5: 删除「联系我」
  async delContactWay(configId: string): Promise<void> {
    await this.client.post(
      "/externalcontact/del_contact_way",
      { config_id: configId },
    );
  }

  // C6: 结束临时会话
  async closeTempChat(
    userid: string,
    externalUserid: string,
  ): Promise<void> {
    await this.client.post(
      "/externalcontact/close_temp_chat",
      { userid, external_userid: externalUserid },
    );
  }

  // J1: 配置「加入群聊」
  async addJoinWay(
    req: AddJoinWayRequest,
  ): Promise<{ config_id: string; qr_code?: string }> {
    const resp = await this.client.post<{ config_id: string; qr_code?: string }>(
      "/externalcontact/groupchat/add_join_way",
      req,
    );
    return { config_id: resp.config_id, qr_code: resp.qr_code };
  }

  // J2: 获取「加入群聊」配置
  async getJoinWay(configId: string): Promise<JoinWayConfig> {
    const resp = await this.client.post<{
      join_way: JoinWayConfig;
    }>("/externalcontact/groupchat/get_join_way", {
      config_id: configId,
    });
    return resp.join_way;
  }

  // J3: 更新「加入群聊」（覆盖更新，传入字段覆盖原值，未传保持不变）
  async updateJoinWay(
    configId: string,
    updates: Partial<AddJoinWayRequest>,
  ): Promise<void> {
    await this.client.post(
      "/externalcontact/groupchat/update_join_way",
      { config_id: configId, ...updates },
    );
  }

  // J4: 删除「加入群聊」
  async delJoinWay(configId: string): Promise<void> {
    await this.client.post(
      "/externalcontact/groupchat/del_join_way",
      { config_id: configId },
    );
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"context"
	"fmt"
)

// ── 请求/响应结构体 ──

type Conclusions struct {
	Text        *ConclusionText        `json:"text,omitempty"`
	Image       *ConclusionImage       `json:"image,omitempty"`
	Link        *ConclusionLink        `json:"link,omitempty"`
	Miniprogram *ConclusionMiniprogram `json:"miniprogram,omitempty"`
}

type ConclusionText struct {
	Content string `json:"content"`
}

type ConclusionImage struct {
	MediaID string `json:"media_id,omitempty"`
	PicURL  string `json:"pic_url,omitempty"`
}

type ConclusionLink struct {
	Title  string `json:"title"`
	Picurl string `json:"picurl"`
	Desc   string `json:"desc"`
	URL    string `json:"url"`
}

type ConclusionMiniprogram struct {
	Title      string `json:"title"`
	PicMediaID string `json:"pic_media_id"`
	Appid      string `json:"appid"`
	Page       string `json:"page"`
}

type AddContactWayReq struct {
	Type          int          `json:"type"`
	Scene         int          `json:"scene"`
	Style         int          `json:"style,omitempty"`
	Remark        string       `json:"remark,omitempty"`
	SkipVerify    bool         `json:"skip_verify,omitempty"`
	State         string       `json:"state,omitempty"`
	User          []string     `json:"user"`
	Party         []int        `json:"party,omitempty"`
	IsTemp        bool         `json:"is_temp,omitempty"`
	ExpiresIn     int          `json:"expires_in,omitempty"`
	ChatExpiresIn int          `json:"chat_expires_in,omitempty"`
	Unionid       string       `json:"unionid,omitempty"`
	IsExclusive   bool         `json:"is_exclusive,omitempty"`
	Conclusions   *Conclusions `json:"conclusions,omitempty"`
}

type AddContactWayResp struct {
	ErrCode  int    `json:"errcode"`
	ErrMsg   string `json:"errmsg"`
	ConfigID string `json:"config_id"`
	QRCode   string `json:"qr_code"`
}

type ContactWayConfig struct {
	ConfigID      string       `json:"config_id"`
	Type          int          `json:"type"`
	Scene         int          `json:"scene"`
	Style         int          `json:"style"`
	Remark        string       `json:"remark"`
	SkipVerify    bool         `json:"skip_verify"`
	State         string       `json:"state"`
	QRCode        string       `json:"qr_code"`
	User          []string     `json:"user"`
	Party         []int        `json:"party"`
	IsTemp        bool         `json:"is_temp"`
	ExpiresIn     int          `json:"expires_in"`
	ChatExpiresIn int          `json:"chat_expires_in"`
	Unionid       string       `json:"unionid"`
	IsExclusive   bool         `json:"is_exclusive"`
	Conclusions   *Conclusions `json:"conclusions,omitempty"`
}

type GetContactWayResp struct {
	ErrCode    int              `json:"errcode"`
	ErrMsg     string           `json:"errmsg"`
	ContactWay ContactWayConfig `json:"contact_way"`
}

type ListContactWayReq struct {
	StartTime  int    `json:"start_time,omitempty"`
	EndTime    int    `json:"end_time,omitempty"`
	Cursor     string `json:"cursor,omitempty"`
	Limit      int    `json:"limit,omitempty"`
	Userid     string `json:"userid,omitempty"`
	SkipVerify *bool  `json:"skip_verify,omitempty"`
}

type ListContactWayResp struct {
	ErrCode    int                     `json:"errcode"`
	ErrMsg     string                  `json:"errmsg"`
	ContactWay []ListContactWayItem    `json:"contact_way"`
	NextCursor string                  `json:"next_cursor"`
}

type ListContactWayItem struct {
	ConfigID string `json:"config_id"`
}

type AddJoinWayReq struct {
	Scene          int      `json:"scene"`
	Remark         string   `json:"remark,omitempty"`
	AutoCreateRoom int      `json:"auto_create_room,omitempty"`
	RoomBaseName   string   `json:"room_base_name,omitempty"`
	RoomBaseID     int      `json:"room_base_id,omitempty"`
	ChatIDList     []string `json:"chat_id_list"`
	State          string   `json:"state,omitempty"`
	MarkSource     bool     `json:"mark_source,omitempty"`
}

type AddJoinWayResp struct {
	ErrCode  int    `json:"errcode"`
	ErrMsg   string `json:"errmsg"`
	ConfigID string `json:"config_id"`
	QRCode   string `json:"qr_code"` // 仅 scene=2 时有值
}

type JoinWayConfig struct {
	ConfigID       string   `json:"config_id"`
	Scene          int      `json:"scene"`
	Remark         string   `json:"remark"`
	AutoCreateRoom int      `json:"auto_create_room"`
	RoomBaseName   string   `json:"room_base_name"`
	RoomBaseID     int      `json:"room_base_id"`
	ChatIDList     []string `json:"chat_id_list"`
	QRCode         string   `json:"qr_code"`
	State          string   `json:"state"`
}

type GetJoinWayResp struct {
	ErrCode int           `json:"errcode"`
	ErrMsg  string        `json:"errmsg"`
	JoinWay JoinWayConfig `json:"join_way"`
}

// ── 管理器 ──

type ContactWayManager struct {
	client *WeComClient
}

func NewContactWayManager(client *WeComClient) *ContactWayManager {
	return &ContactWayManager{client: client}
}

// C1: 配置「联系我」方式
func (m *ContactWayManager) AddContactWay(ctx context.Context, req *AddContactWayReq) (configID, qrCode string, err error) {
	var resp AddContactWayResp
	if err = m.client.Post(ctx, "/externalcontact/add_contact_way", req, &resp); err != nil {
		return "", "", err
	}
	return resp.ConfigID, resp.QRCode, nil
}

// C2: 获取「联系我」配置
func (m *ContactWayManager) GetContactWay(ctx context.Context, configID string) (*ContactWayConfig, error) {
	var resp GetContactWayResp
	if err := m.client.Post(ctx, "/externalcontact/get_contact_way", map[string]string{"config_id": configID}, &resp); err != nil {
		return nil, err
	}
	return &resp.ContactWay, nil
}

// C3: 获取「联系我」列表（自动分页）
func (m *ContactWayManager) ListContactWays(ctx context.Context, startTime, endTime, limit int) ([]string, error) {
	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	var configIDs []string
	cursor := ""
	for {
		req := &ListContactWayReq{
			StartTime: startTime,
			EndTime:   endTime,
			Cursor:    cursor,
			Limit:     limit,
		}
		var resp ListContactWayResp
		if err := m.client.Post(ctx, "/externalcontact/list_contact_way", req, &resp); err != nil {
			return nil, err
		}
		for _, item := range resp.ContactWay {
			configIDs = append(configIDs, item.ConfigID)
		}
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return configIDs, nil
}

// C4: 更新「联系我」配置（覆盖更新）
func (m *ContactWayManager) UpdateContactWay(ctx context.Context, body map[string]interface{}) error {
	if _, ok := body["config_id"]; !ok {
		return fmt.Errorf("config_id is required")
	}
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	return m.client.Post(ctx, "/externalcontact/update_contact_way", body, &resp)
}

// C5: 删除「联系我」配置
func (m *ContactWayManager) DelContactWay(ctx context.Context, configID string) error {
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	return m.client.Post(ctx, "/externalcontact/del_contact_way", map[string]string{"config_id": configID}, &resp)
}

// C6: 结束临时会话
func (m *ContactWayManager) CloseTempChat(ctx context.Context, userid, externalUserid string) error {
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	return m.client.Post(ctx, "/externalcontact/close_temp_chat", map[string]string{
		"userid":          userid,
		"external_userid": externalUserid,
	}, &resp)
}

// J1: 配置「加入群聊」方式
func (m *ContactWayManager) AddJoinWay(ctx context.Context, req *AddJoinWayReq) (*AddJoinWayResp, error) {
	var resp AddJoinWayResp
	if err := m.client.Post(ctx, "/externalcontact/groupchat/add_join_way", req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil // resp.ConfigID + resp.QRCode (scene=2)
}

// J2: 获取「加入群聊」配置
func (m *ContactWayManager) GetJoinWay(ctx context.Context, configID string) (*JoinWayConfig, error) {
	var resp GetJoinWayResp
	if err := m.client.Post(ctx, "/externalcontact/groupchat/get_join_way", map[string]string{"config_id": configID}, &resp); err != nil {
		return nil, err
	}
	return &resp.JoinWay, nil
}

// J3: 更新「加入群聊」配置（覆盖更新，传入字段覆盖原值，未传保持不变）
func (m *ContactWayManager) UpdateJoinWay(ctx context.Context, configID string, updates map[string]interface{}) error {
	updates["config_id"] = configID
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	return m.client.Post(ctx, "/externalcontact/groupchat/update_join_way", updates, &resp)
}

// J4: 删除「加入群聊」配置
func (m *ContactWayManager) DelJoinWay(ctx context.Context, configID string) error {
	var resp struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	return m.client.Post(ctx, "/externalcontact/groupchat/del_join_way", map[string]string{"config_id": configID}, &resp)
}
```

---


### 7.4 Java 示例

```java
public class WecomCrmContactwayService {
    private final WeComClient client;

    public WecomCrmContactwayService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-contactway 相关 API
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

### 7.5 PHP 示例

```php
<?php
class WecomCrmContactwayService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-contactway 相关 API
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

## 8. 测试模板

```python
"""wecom-crm-contactway 测试模板"""
import pytest
from unittest.mock import MagicMock


@pytest.fixture
def manager():
    client = MagicMock()
    return ContactWayManager(client)


class TestAddContactWay:
    """C1: 配置联系我"""

    def test_basic_create(self, manager):
        manager.client.post.return_value = {
            "config_id": "cfg001", "qr_code": "http://qr.example.com"
        }
        result = manager.add_contact_way(type_=1, scene=2, user=["zhangsan"])
        assert result["config_id"] == "cfg001"
        assert result["qr_code"] == "http://qr.example.com"
        body = manager.client.post.call_args[0][1]
        assert body["type"] == 1
        assert body["scene"] == 2
        assert body["user"] == ["zhangsan"]

    def test_temp_session(self, manager):
        manager.client.post.return_value = {"config_id": "cfg002", "qr_code": ""}
        manager.add_contact_way(
            type_=1, scene=2, user=["doctor"],
            is_temp=True, expires_in=86400, chat_expires_in=86400,
            conclusions={"text": {"content": "会话结束"}},
        )
        body = manager.client.post.call_args[0][1]
        assert body["is_temp"] is True
        assert body["expires_in"] == 86400
        assert body["conclusions"]["text"]["content"] == "会话结束"

    def test_expires_capped_at_14_days(self, manager):
        manager.client.post.return_value = {"config_id": "cfg003", "qr_code": ""}
        manager.add_contact_way(
            type_=1, scene=2, user=["u1"],
            is_temp=True, expires_in=999999,
        )
        body = manager.client.post.call_args[0][1]
        assert body["expires_in"] == 14 * 86400

    def test_remark_truncated(self, manager):
        manager.client.post.return_value = {"config_id": "cfg004", "qr_code": ""}
        manager.add_contact_way(
            type_=2, scene=2, user=["u1"],
            remark="a" * 50,
        )
        body = manager.client.post.call_args[0][1]
        assert len(body["remark"]) == 30


class TestGetContactWay:
    """C2: 获取联系我配置"""

    def test_basic_get(self, manager):
        manager.client.post.return_value = {
            "contact_way": {"config_id": "cfg001", "type": 1, "scene": 2}
        }
        result = manager.get_contact_way("cfg001")
        assert result["config_id"] == "cfg001"


class TestListContactWays:
    """C3: 获取联系我列表"""

    def test_pagination(self, manager):
        manager.client.post.side_effect = [
            {"contact_way": [{"config_id": "c1"}], "next_cursor": "cur1"},
            {"contact_way": [{"config_id": "c2"}], "next_cursor": ""},
        ]
        result = manager.list_contact_ways()
        assert result == ["c1", "c2"]
        assert manager.client.post.call_count == 2


class TestAddJoinWay:
    """J1: 配置加入群聊"""

    def test_basic_create(self, manager):
        manager.client.post.return_value = {"config_id": "jcfg001"}
        result = manager.add_join_way(scene=2, chat_id_list=["wr001", "wr002"])
        assert result["config_id"] == "jcfg001"
        body = manager.client.post.call_args[0][1]
        assert body["scene"] == 2
        assert len(body["chat_id_list"]) == 2

    def test_auto_create_room(self, manager):
        manager.client.post.return_value = {"config_id": "jcfg002"}
        manager.add_join_way(
            scene=2, chat_id_list=["wr001"],
            auto_create_room=1, room_base_name="销售群", room_base_id=10,
        )
        body = manager.client.post.call_args[0][1]
        assert body["auto_create_room"] == 1
        assert body["room_base_name"] == "销售群"

    def test_chat_id_list_capped_at_5(self, manager):
        manager.client.post.return_value = {"config_id": "jcfg003"}
        manager.add_join_way(
            scene=2, chat_id_list=["g1", "g2", "g3", "g4", "g5", "g6", "g7"],
        )
        body = manager.client.post.call_args[0][1]
        assert len(body["chat_id_list"]) == 5


class TestCloseTempChat:
    """C6: 结束临时会话"""

    def test_close(self, manager):
        manager.client.post.return_value = {}
        manager.close_temp_chat("doctor", "woXXX")
        body = manager.client.post.call_args[0][1]
        assert body["userid"] == "doctor"
        assert body["external_userid"] == "woXXX"
```

---

## 9. Code Review 检查清单

| # | 检查项 | 严重度 | 说明 |
|---|--------|--------|------|
| R1 | 是否使用正确的 access_token | CRITICAL | 必须用客户联系 secret |
| R2 | config_id 是否持久化存储 | HIGH | API 创建的不在管理后台展示，丢失无法找回 |
| R3 | type=1 时 user 是否只有 1 个 | HIGH | 单人模式只能配一个成员 |
| R4 | update 是否传了完整的覆盖字段 | HIGH | 覆盖更新！不传的字段可能被清空 |
| R5 | is_temp 是否仅限医疗行业 | HIGH | 非医疗行业创建会报错 |
| R6 | expires_in 是否不超过 14 天 | MEDIUM | 最长 14 天 = 1209600 秒 |
| R7 | conclusions 消息组合是否符合规则 | MEDIUM | image/link/miniprogram 只取一个 |
| R8 | chat_id_list 是否不超过 5 个 | MEDIUM | 加入群聊最多关联 5 个群 |
| R9 | state 是否不超过 30 字符 | MEDIUM | 超过会被截断或报错 |
| R10 | scene=1 时是否不依赖 qr_code 返回 | MEDIUM | 小程序场景不返回二维码链接 |
| R11 | list_contact_way 是否知悉时间限制 | MEDIUM | 仅 2021-07-10 以后的数据 |
| R12 | 50 万额度是否监控 | LOW | 联系我+加入群聊共用 |
| R13 | close_temp_chat 是否仅用于临时会话 | MEDIUM | 普通联系方式不能用此接口 |

---

## 10. 踩坑指南 (Gotcha Guide)

### G1: config_id 丢失无法找回

**现象**：无法编辑或删除已创建的联系我/加入群聊
**原因**：API 创建的不在管理后台展示，config_id 是唯一凭证
**方案**：创建后立即持久化到数据库。list_contact_way 可作为兜底（但仅限 2021-07-10 后且不含临时会话）

### G2: update 覆盖更新导致字段被清空

**现象**：只更新了 remark，结果 user 列表变空了
**原因**：update_contact_way / update_join_way 均为覆盖式更新
**方案**：更新前先 get 获取当前配置，合并后再传完整参数

### G3: list_contact_way 不含旧数据和临时会话

**现象**：调用 list_contact_way 拿不到所有联系我
**原因**：仅可获取 2021-07-10 以后创建的，不含临时会话
**方案**：对于早期数据或临时会话，只能用数据库中存储的 config_id 逐个 get

### G4: 临时会话二维码一次性使用

**现象**：客户扫码后其他人扫同一个码失效
**原因**：临时会话二维码在添加好友后即刻失效
**方案**：每次需要时重新创建。已失效的临时会话联系方式无法编辑

### G5: conclusions 优先级规则

**现象**：同时传了 image 和 link，只发了 image
**原因**：image、link、miniprogram 三者只取一个，优先级 image > link > miniprogram
**方案**：明确只传一种媒体类型。text 可与任一媒体类型同时发送

### G6: scene=1 不返回 qr_code

**现象**：创建联系我后拿不到二维码链接
**原因**：scene=1 是小程序场景，通过小程序插件展示，不生成 URL
**方案**：需要二维码时使用 scene=2

### G7: 50 万额度共用

**现象**：创建联系我报 "exceed contact way count"
**原因**：联系我 + 加入群聊共用 50 万 API 配置额度
**方案**：定期清理不用的配置。注意删除后额度可能因缓存不立即释放

### G8: state 在不同场景的回传方式不同

**现象**：联系我回调中能看到 state，但加入群聊回调中看不到
**原因**：联系我的 state 通过 add_external_contact 回调返回；加入群聊的 state 在获取群详情时通过成员字段返回
**方案**：分别处理两种 state 回传路径

### G9: 成员资质要求

**现象**：创建联系我报 40098 或 84083
**原因**：成员未实名认证、未配置客户联系功能或未在可见范围
**方案**：创建前确认成员满足：已激活、已实名、已配置客户联系、在应用可见范围

---

## 11. 错误码速查

| 错误码 | 含义 | 排查方向 |
|--------|------|---------|
| 0 | 成功 | - |
| 40001 | access_token 无效 | 重新获取 |
| 40098 | 成员尚未实名认证 | 确认成员已实名 |
| 41051 | 客户和服务人员已开始聊天 | 已开始聊天不能发欢迎语 |
| 45033 | 接口并发调用超限 | 降低并发 |
| 60111 | userid 不存在 | 检查通讯录 |
| 84061 | 不存在外部联系人关系 | 确认双方有好友关系 |
| 84074 | 没有外部联系人权限 | 确认应用权限 |
| 84083 | 非服务人员 | 确认成员配置了客户联系 |
| - | exceed contact way count | 50 万额度用尽 |

---

## 12. 参考资料

| 资源 | 链接 |
|------|------|
| 联系我管理-企业内部 (doc 92228) | https://developer.work.weixin.qq.com/document/path/92228 |
| 联系我管理-第三方 (doc 92572/95724) | https://developer.work.weixin.qq.com/document/path/92572 |
| 联系我管理-新版 (doc 96348) | https://developer.work.weixin.qq.com/document/path/96348 |
| 加入群聊管理 (doc 92229) | https://developer.work.weixin.qq.com/document/path/92229 |
| 外部联系人回调事件 (doc 92130) | https://developer.work.weixin.qq.com/document/path/92130 |
| 频率限制 (doc 96212) | https://developer.work.weixin.qq.com/document/path/96212 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |


