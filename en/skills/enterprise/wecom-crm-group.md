---
name: wecom-crm-group
description: 企业微信外部联系人·客户群管理 SKILL — 客户群列表/详情、opengid 转换、群变更回调
version: 1.0.0
triggers:
  - 客户群
  - groupchat
  - 群列表
  - 群详情
  - 群成员
  - change_external_chat
  - member_version
  - opengid
  - join_scene
  - 群管理
  - 81017
prerequisite_skills:
  - wecom-core
domain: crm-group
api_count: 3
callback_count: 1
---

# WeCom CRM · 客户群管理 SKILL

> 覆盖企业微信「外部联系人 · 客户群管理」子域：客户群列表/详情查询、opengid→chat_id 转换、客户群变更回调事件。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 「客户联系」secret 或已配置到「可调用应用」列表的自建应用 secret | 客户联系使用范围 |
| 第三方应用 | 企业授权的 access_token | 「企业客户权限 → 客户基础信息」 |

> **关键**：群主必须在应用的可见范围内，否则无法获取对应群的数据。

### 1.2 管理后台配置

1. **企业微信管理后台 → 客户联系 → 权限配置** → 将应用添加到「可调用应用」列表
2. **回调配置**：客户联系 → 客户 → API → 接收事件服务器 → 配置回调 URL / Token / EncodingAESKey
3. **License 要求**：群主需已开通互通账号（License），否则报错 301002

---

## 2. 核心概念

### 2.1 客户群定义

客户群 = 由具有**客户群使用权限**的企业成员创建的**外部群**（即群内含企业外部联系人的群）。内部群不属于客户群范畴。

### 2.2 群跟进状态 (status)

| status | 含义 | 说明 |
|--------|------|------|
| 0 | 跟进人正常 | 群主在职且正常 |
| 1 | 跟进人离职 | 群主已离职，待继承 |
| 2 | 离职继承中 | 正在转让群主 |
| 3 | 离职继承完成 | 群主已完成转让 |

### 2.3 群成员类型 (type)

| type | 含义 | 特有字段 |
|------|------|---------|
| 1 | 企业成员 | userid 为企业成员 ID |
| 2 | 外部联系人 | userid 为 external_userid，可能有 unionid |

### 2.4 入群方式 (join_scene)

| 值 | 含义 |
|----|------|
| 1 | 由成员直接邀请入群 |
| 2 | 由成员通过邀请链接邀请入群 |
| 3 | 通过扫描群二维码 / 小程序按钮入群 |

### 2.5 退群方式 (quit_scene) — 回调事件专用

| 值 | 含义 |
|----|------|
| 0 | 不涉及（非退群事件） |
| 1 | 成员自己主动退出 |
| 2 | 被群主或管理员移出 |

### 2.6 member_version 版本号机制

`member_version` 是 MD5 格式字符串，标识群成员列表快照版本。

**增量同步策略**：
1. 本地存储每个群的最新 `member_version`（来自 G2 获取群详情返回值）
2. 收到 `update` 回调时，对比 `LastMemVer` 与本地版本号
3. `LastMemVer` 一致 → 依据 `MemChangeList` 做增量更新，本地版本号更新为 `CurMemVer`
4. `LastMemVer` 不一致 → 存在漏收事件，调用 G2 全量拉取

---

## 3. API 速查表

| ID | 接口名 | 方法 | 路径 | 说明 |
|----|--------|------|------|------|
| G1 | groupchat/list | POST | `/cgi-bin/externalcontact/groupchat/list` | 获取客户群列表 |
| G2 | groupchat/get | POST | `/cgi-bin/externalcontact/groupchat/get` | 获取客户群详情 |
| G3 | opengid_to_chatid | POST | `/cgi-bin/externalcontact/opengid_to_chatid` | 小程序 opengid → chat_id |

**Base URL**: `https://qyapi.weixin.qq.com`
**所有接口均需附带 `?access_token=ACCESS_TOKEN` 查询参数。**

---

## 4. API 详细说明

### G1: 获取客户群列表

**POST** `/cgi-bin/externalcontact/groupchat/list?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status_filter` | int | 否 | 群跟进状态过滤。0=所有(默认) 1=离职待继承 2=继承中 3=继承完成 |
| `owner_filter` | object | 否 | 群主过滤 |
| `owner_filter.userid_list` | string[] | 否 | 群主 userid 列表，最多 **100** 个 |
| `cursor` | string | 否 | 分页游标，首次不填 |
| `limit` | int | 是 | 分页大小，范围 **[1, 1000]** |

#### 请求示例

```json
{
  "status_filter": 0,
  "owner_filter": {
    "userid_list": ["abel"]
  },
  "cursor": "",
  "limit": 100
}
```

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `group_chat_list` | object[] | 客户群列表 |
| `group_chat_list[].chat_id` | string | 客户群 ID |
| `group_chat_list[].status` | int | 群跟进状态 0/1/2/3 |
| `next_cursor` | string | 分页游标，为空表示无更多数据 |

#### 关键约束

1. **owner_filter 必传场景**：若不指定 `owner_filter`，会拉取应用可见范围内所有群主的数据。当可见范围超过 1000 人时报错 `81017`，此时必须指定 `owner_filter` 缩小范围
2. **分页方式**：旧版 `offset + limit` 方案将废弃，统一使用 `cursor + limit`
3. **License 要求**：群主需已开通互通账号，否则报错 `301002`

---

### G2: 获取客户群详情

**POST** `/cgi-bin/externalcontact/groupchat/get?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chat_id` | string | 是 | 客户群 ID |
| `need_name` | int | 否 | 是否返回群成员名字。0=不返回(默认) **1=返回** |

#### 请求示例

```json
{
  "chat_id": "wrOgQhDgAAMYQiS5ol9G7gK9JVAAAA",
  "need_name": 1
}
```

#### 响应参数 — group_chat 对象

| 参数 | 类型 | 说明 |
|------|------|------|
| `chat_id` | string | 客户群 ID |
| `name` | string | 群名 |
| `owner` | string | 群主 userid |
| `create_time` | int | 创建时间戳 |
| `notice` | string | 群公告 |
| `member_list` | object[] | 群成员列表 |
| `admin_list` | object[] | 群管理员列表 `[{userid}]` |
| `member_version` | string | 群成员版本号（MD5） |

#### member_list[] 成员字段

| 参数 | 类型 | 说明 |
|------|------|------|
| `userid` | string | 企业成员 userid 或 external_userid |
| `type` | int | 1=企业成员 2=外部联系人 |
| `join_time` | int | 入群时间戳 |
| `join_scene` | int | 入群方式 1/2/3 |
| `invitor` | object | 邀请者 `{userid: string}`，仅邀请入群时存在 |
| `group_nickname` | string | 群内昵称（成员主动设置） |
| `name` | string | 成员名称（**仅 need_name=1 时返回**） |
| `unionid` | string | 微信 unionid（仅 type=2 且已绑定开放平台时返回） |
| `state` | string | 入群方式配置的 state（仅 join_scene=3 且已配置时返回） |

#### 响应示例

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "group_chat": {
    "chat_id": "wrOgQhDgAAMYQiS5ol9G7gK9JVAAAA",
    "name": "销售客服群",
    "owner": "ZhuShengBen",
    "create_time": 1572505490,
    "notice": "文明沟通，拒绝脏话",
    "member_list": [
      {
        "userid": "abel",
        "type": 1,
        "join_time": 1572505491,
        "join_scene": 1,
        "invitor": {"userid": "jack"},
        "group_nickname": "客服小张",
        "name": "张三丰"
      },
      {
        "userid": "wmOgQhDgAAuXFJGwbve4g4iXknfOAAAA",
        "type": 2,
        "unionid": "ozynqsulJFCZ2z1aYeS8h-nuasdAAA",
        "join_time": 1572505491,
        "join_scene": 3,
        "state": "klsdup3kj3s1",
        "group_nickname": "顾客老王",
        "name": "王语嫣"
      }
    ],
    "admin_list": [
      {"userid": "sam"},
      {"userid": "pony"}
    ],
    "member_version": "71217227bbd112ecfe3a49c482195cb4"
  }
}
```

#### 关键约束

1. **异步更新延迟**：群信息变动后立即收到回调，但部分信息异步处理，需等待后再调 API 获取最新数据
2. **group_nickname vs name**：两个独立字段。`group_nickname` 是群内昵称（成员设置），`name` 是成员本名（需 `need_name=1`）
3. **unionid 条件**：仅 type=2 且企业已绑定微信开放平台时返回

---

### G3: 客户群 opengid 转换

**POST** `/cgi-bin/externalcontact/opengid_to_chatid?access_token=ACCESS_TOKEN`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `opengid` | string | 是 | 小程序通过 `wx.getGroupEnterInfo` 获取的群 ID |

#### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `chat_id` | string | 客户群 ID |

#### 关键约束

1. **仅限客户群**：仅支持企业服务人员创建的客户群（外部群），内部群不支持
2. **仅限本企业**：仅可转换本企业下的客户群 chat_id
3. **使用场景**：小程序分享到群 → 被点击获取 opengid → 调用此接口转 chat_id → 调用 G2 获取群详情

---

## 5. 回调事件

### E1: 客户群变更事件 change_external_chat

**触发条件**：客户群创建、变更或解散

#### ChangeType 枚举

| ChangeType | 含义 | 附加字段 |
|------------|------|---------|
| `create` | 客户群创建 | 仅 ChatId |
| `update` | 客户群变更 | UpdateDetail, JoinScene, QuitScene, MemChangeCnt, MemChangeList, LastMemVer, CurMemVer |
| `dismiss` | 客户群解散 | 仅 ChatId |

#### UpdateDetail 枚举（update 事件专用）

| 值 | 含义 |
|----|------|
| `add_member` | 有新成员入群 |
| `del_member` | 有成员退群/被移出 |
| `change_owner` | 群主变更 |
| `change_name` | 群名修改 |
| `change_notice` | 群公告修改 |

#### 完整 XML 示例 — update (add_member)

```xml
<xml>
  <ToUserName><![CDATA[toUser]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1403610513</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[change_external_chat]]></Event>
  <ChatId><![CDATA[wrOgQhDgAAMYQiS5ol9G7gK9JVAAAA]]></ChatId>
  <ChangeType><![CDATA[update]]></ChangeType>
  <UpdateDetail><![CDATA[add_member]]></UpdateDetail>
  <JoinScene>1</JoinScene>
  <QuitScene>0</QuitScene>
  <MemChangeCnt>2</MemChangeCnt>
  <MemChangeList>
    <Item><![CDATA[wmOgQhDgAAuXFJGwbve4g4iXknfOAAAA]]></Item>
    <Item><![CDATA[wmOgQhDgAAuXFJGwbve4g4iXknfOBBBB]]></Item>
  </MemChangeList>
  <LastMemVer><![CDATA[9c3f97c2ada667dfb5f6d03308d963e1]]></LastMemVer>
  <CurMemVer><![CDATA[71217227bbd112ecfe3a49c482195cb4]]></CurMemVer>
</xml>
```

#### 回调处理要求

1. **5 秒超时**：收到后立即返回 `success`，异步处理业务逻辑
2. **最多 3 次重试**：超时未响应会重发
3. **回调仅为通知**：详细数据通过 G2 接口获取

---

## 6. 工作流

### 6.1 客户群全量同步

```
步骤 1: 调用 G1 (groupchat/list)
  ↓ limit=1000, cursor 分页遍历所有群
  ↓ 可选 status_filter=0 获取所有状态
步骤 2: 对每个 chat_id 调用 G2 (groupchat/get, need_name=1)
  ↓ 获取群详情 + 成员列表
步骤 3: 本地存储 member_version 用于后续增量同步
```

### 6.2 客户群增量同步（基于回调 + 版本号）

```
步骤 1: 监听 E1 回调事件 change_external_chat
步骤 2: 按 ChangeType 处理：
  ├─ create → 调用 G2 获取新群详情
  ├─ dismiss → 本地标记群已解散
  └─ update → 进入步骤 3
步骤 3: 对比 LastMemVer 与本地 member_version
  ├─ 匹配 → 依据 MemChangeList 做增量更新
  │         UpdateDetail=add_member → 添加成员
  │         UpdateDetail=del_member → 删除成员
  │         UpdateDetail=change_owner → 更新群主
  │         UpdateDetail=change_name → 更新群名
  │         UpdateDetail=change_notice → 更新公告
  │         本地版本号更新为 CurMemVer
  └─ 不匹配 → 调用 G2 全量拉取（版本号丢失兜底）
```

### 6.3 小程序场景：opengid → 群详情

```
步骤 1: 小程序调用 wx.getGroupEnterInfo 获取 opengid
步骤 2: 后端调用 G3 (opengid_to_chatid) 将 opengid 转为 chat_id
步骤 3: 调用 G2 (groupchat/get) 获取群详情和成员
步骤 4: 根据成员信息提供个性化服务
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom CRM 客户群管理器 — 依赖 wecom-core 的 WeComClient"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class GroupChatManager:
    """客户群管理器"""

    def __init__(self, client):
        """
        Args:
            client: WeComClient 实例（来自 wecom-core）
        """
        self.client = client

    # ── G1: 获取客户群列表 ──

    def list_group_chats(
        self,
        status_filter: int = 0,
        owner_userids: Optional[list[str]] = None,
        limit: int = 100,
    ) -> list[dict]:
        """
        获取客户群列表（自动分页）。

        Args:
            status_filter: 0=所有 1=离职待继承 2=继承中 3=继承完成
            owner_userids: 群主 userid 列表（最多 100 个）
            limit: 每页大小 [1, 1000]

        Returns:
            list[dict]: [{"chat_id": "wr...", "status": 0}, ...]
        """
        results = []
        cursor = ""
        while True:
            body: dict = {
                "status_filter": status_filter,
                "cursor": cursor,
                "limit": min(limit, 1000),
            }
            if owner_userids:
                body["owner_filter"] = {"userid_list": owner_userids[:100]}

            resp = self.client.post(
                "/externalcontact/groupchat/list", json=body
            )
            results.extend(resp.get("group_chat_list", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results

    # ── G2: 获取客户群详情 ──

    def get_group_chat(
        self,
        chat_id: str,
        need_name: bool = True,
    ) -> dict:
        """
        获取客户群详情。

        Args:
            chat_id: 客户群 ID
            need_name: 是否返回成员名字

        Returns:
            dict: group_chat 对象
        """
        body = {
            "chat_id": chat_id,
            "need_name": 1 if need_name else 0,
        }
        resp = self.client.post(
            "/externalcontact/groupchat/get", json=body
        )
        return resp["group_chat"]

    # ── G3: opengid → chat_id ──

    def opengid_to_chatid(self, opengid: str) -> str:
        """
        将小程序 opengid 转换为客户群 chat_id。

        Args:
            opengid: 小程序通过 wx.getGroupEnterInfo 获取的群 ID

        Returns:
            str: 客户群 chat_id
        """
        resp = self.client.post(
            "/externalcontact/opengid_to_chatid",
            json={"opengid": opengid},
        )
        return resp["chat_id"]

    # ── 高级工作流 ──

    def sync_all_group_chats(
        self,
        owner_userids: Optional[list[str]] = None,
        need_name: bool = True,
    ) -> list[dict]:
        """
        全量同步客户群列表及详情。

        Returns:
            list[dict]: 包含完整详情的群列表
        """
        chat_list = self.list_group_chats(owner_userids=owner_userids)
        detailed = []
        for chat in chat_list:
            try:
                detail = self.get_group_chat(chat["chat_id"], need_name)
                detailed.append(detail)
            except Exception as e:
                logger.warning("获取群 %s 详情失败: %s", chat["chat_id"], e)
        return detailed

    def handle_group_callback(
        self,
        change_type: str,
        chat_id: str,
        update_detail: Optional[str] = None,
        last_mem_ver: Optional[str] = None,
        cur_mem_ver: Optional[str] = None,
        mem_change_list: Optional[list[str]] = None,
        local_version: Optional[str] = None,
    ) -> dict:
        """
        处理客户群变更回调事件。

        Args:
            change_type: create / update / dismiss
            chat_id: 客户群 ID
            update_detail: add_member / del_member / change_owner / change_name / change_notice
            last_mem_ver: 变更前版本号
            cur_mem_ver: 变更后版本号
            mem_change_list: 变更的成员 ID 列表
            local_version: 本地存储的版本号

        Returns:
            dict: {"action": "full_sync"|"incremental"|"delete"|"create", "data": ...}
        """
        if change_type == "create":
            detail = self.get_group_chat(chat_id)
            return {"action": "create", "data": detail}

        if change_type == "dismiss":
            return {"action": "delete", "chat_id": chat_id}

        # update
        if local_version and last_mem_ver == local_version:
            # 版本号匹配，可增量更新
            return {
                "action": "incremental",
                "chat_id": chat_id,
                "update_detail": update_detail,
                "mem_change_list": mem_change_list or [],
                "new_version": cur_mem_ver,
            }
        else:
            # 版本号不匹配或无本地版本，全量拉取
            logger.info(
                "版本号不匹配 (local=%s, last=%s)，全量拉取群 %s",
                local_version, last_mem_ver, chat_id,
            )
            detail = self.get_group_chat(chat_id)
            return {"action": "full_sync", "data": detail}
```

### 7.2 TypeScript

```typescript
/**
 * WeCom CRM 客户群管理器
 * 依赖 wecom-core 的 WeComClient
 */

// ── 类型定义 ──

interface GroupChatListRequest {
  status_filter?: number;
  owner_filter?: { userid_list: string[] };
  cursor?: string;
  limit: number;
}

interface GroupChatListItem {
  chat_id: string;
  status: 0 | 1 | 2 | 3;
}

interface GroupChatMember {
  userid: string;
  type: 1 | 2;
  join_time: number;
  join_scene: 1 | 2 | 3;
  invitor?: { userid: string };
  group_nickname: string;
  name?: string;
  unionid?: string;
  state?: string;
}

interface GroupChatAdmin {
  userid: string;
}

interface GroupChatDetail {
  chat_id: string;
  name: string;
  owner: string;
  create_time: number;
  notice: string;
  member_list: GroupChatMember[];
  admin_list: GroupChatAdmin[];
  member_version: string;
}

type UpdateDetail =
  | "add_member"
  | "del_member"
  | "change_owner"
  | "change_name"
  | "change_notice";

interface CallbackResult {
  action: "create" | "full_sync" | "incremental" | "delete";
  chat_id?: string;
  data?: GroupChatDetail;
  update_detail?: UpdateDetail;
  mem_change_list?: string[];
  new_version?: string;
}

// ── 管理器 ──

class GroupChatManager {
  constructor(private client: WeComClient) {}

  // G1: 获取客户群列表（自动分页）
  async listGroupChats(
    statusFilter = 0,
    ownerUserids?: string[],
    limit = 100,
  ): Promise<GroupChatListItem[]> {
    const results: GroupChatListItem[] = [];
    let cursor = "";
    do {
      const body: GroupChatListRequest = {
        status_filter: statusFilter,
        cursor,
        limit: Math.min(limit, 1000),
      };
      if (ownerUserids?.length) {
        body.owner_filter = { userid_list: ownerUserids.slice(0, 100) };
      }
      const resp = await this.client.post<{
        group_chat_list: GroupChatListItem[];
        next_cursor: string;
      }>("/externalcontact/groupchat/list", body);
      results.push(...(resp.group_chat_list ?? []));
      cursor = resp.next_cursor ?? "";
    } while (cursor);
    return results;
  }

  // G2: 获取客户群详情
  async getGroupChat(
    chatId: string,
    needName = true,
  ): Promise<GroupChatDetail> {
    const resp = await this.client.post<{
      group_chat: GroupChatDetail;
    }>("/externalcontact/groupchat/get", {
      chat_id: chatId,
      need_name: needName ? 1 : 0,
    });
    return resp.group_chat;
  }

  // G3: opengid → chat_id
  async opengidToChatid(opengid: string): Promise<string> {
    const resp = await this.client.post<{
      chat_id: string;
    }>("/externalcontact/opengid_to_chatid", { opengid });
    return resp.chat_id;
  }

  // 全量同步
  async syncAllGroupChats(
    ownerUserids?: string[],
    needName = true,
  ): Promise<GroupChatDetail[]> {
    const chatList = await this.listGroupChats(0, ownerUserids);
    const details: GroupChatDetail[] = [];
    for (const chat of chatList) {
      try {
        const detail = await this.getGroupChat(chat.chat_id, needName);
        details.push(detail);
      } catch (e) {
        console.warn(`获取群 ${chat.chat_id} 详情失败:`, e);
      }
    }
    return details;
  }

  // 处理群变更回调
  handleGroupCallback(
    changeType: "create" | "update" | "dismiss",
    chatId: string,
    opts?: {
      updateDetail?: UpdateDetail;
      lastMemVer?: string;
      curMemVer?: string;
      memChangeList?: string[];
      localVersion?: string;
    },
  ): Promise<CallbackResult> {
    if (changeType === "create") {
      return this.getGroupChat(chatId).then((data) => ({
        action: "create" as const,
        data,
      }));
    }
    if (changeType === "dismiss") {
      return Promise.resolve({ action: "delete" as const, chat_id: chatId });
    }
    // update
    if (opts?.localVersion && opts.lastMemVer === opts.localVersion) {
      return Promise.resolve({
        action: "incremental" as const,
        chat_id: chatId,
        update_detail: opts.updateDetail,
        mem_change_list: opts.memChangeList ?? [],
        new_version: opts.curMemVer,
      });
    }
    return this.getGroupChat(chatId).then((data) => ({
      action: "full_sync" as const,
      data,
    }));
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"context"
	"fmt"
	"log"
)

// ── 请求/响应结构体 ──

type GroupChatListReq struct {
	StatusFilter int                    `json:"status_filter,omitempty"`
	OwnerFilter  *GroupChatOwnerFilter  `json:"owner_filter,omitempty"`
	Cursor       string                 `json:"cursor,omitempty"`
	Limit        int                    `json:"limit"`
}

type GroupChatOwnerFilter struct {
	UseridList []string `json:"userid_list"`
}

type GroupChatListResp struct {
	ErrCode       int                  `json:"errcode"`
	ErrMsg        string               `json:"errmsg"`
	GroupChatList []GroupChatListItem   `json:"group_chat_list"`
	NextCursor    string               `json:"next_cursor"`
}

type GroupChatListItem struct {
	ChatID string `json:"chat_id"`
	Status int    `json:"status"`
}

type GroupChatGetReq struct {
	ChatID   string `json:"chat_id"`
	NeedName int    `json:"need_name,omitempty"`
}

type GroupChatGetResp struct {
	ErrCode   int              `json:"errcode"`
	ErrMsg    string           `json:"errmsg"`
	GroupChat *GroupChatDetail `json:"group_chat"`
}

type GroupChatDetail struct {
	ChatID        string             `json:"chat_id"`
	Name          string             `json:"name"`
	Owner         string             `json:"owner"`
	CreateTime    int64              `json:"create_time"`
	Notice        string             `json:"notice"`
	MemberList    []GroupChatMember  `json:"member_list"`
	AdminList     []GroupChatAdmin   `json:"admin_list"`
	MemberVersion string             `json:"member_version"`
}

type GroupChatMember struct {
	Userid        string          `json:"userid"`
	Type          int             `json:"type"`
	JoinTime      int64           `json:"join_time"`
	JoinScene     int             `json:"join_scene"`
	Invitor       *MemberInvitor  `json:"invitor,omitempty"`
	GroupNickname string          `json:"group_nickname"`
	Name          string          `json:"name,omitempty"`
	Unionid       string          `json:"unionid,omitempty"`
	State         string          `json:"state,omitempty"`
}

type MemberInvitor struct {
	Userid string `json:"userid"`
}

type GroupChatAdmin struct {
	Userid string `json:"userid"`
}

type OpengidToChatidReq struct {
	Opengid string `json:"opengid"`
}

type OpengidToChatidResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
	ChatID  string `json:"chat_id"`
}

// ── 管理器 ──

type GroupChatManager struct {
	client *WeComClient
}

func NewGroupChatManager(client *WeComClient) *GroupChatManager {
	return &GroupChatManager{client: client}
}

// G1: 获取客户群列表（自动分页）
func (m *GroupChatManager) ListGroupChats(ctx context.Context, statusFilter int, ownerUserids []string, limit int) ([]GroupChatListItem, error) {
	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	var all []GroupChatListItem
	cursor := ""
	for {
		req := &GroupChatListReq{
			StatusFilter: statusFilter,
			Cursor:       cursor,
			Limit:        limit,
		}
		if len(ownerUserids) > 0 {
			ids := ownerUserids
			if len(ids) > 100 {
				ids = ids[:100]
			}
			req.OwnerFilter = &GroupChatOwnerFilter{UseridList: ids}
		}
		var resp GroupChatListResp
		if err := m.client.Post(ctx, "/externalcontact/groupchat/list", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.GroupChatList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// G2: 获取客户群详情
func (m *GroupChatManager) GetGroupChat(ctx context.Context, chatID string, needName bool) (*GroupChatDetail, error) {
	needNameInt := 0
	if needName {
		needNameInt = 1
	}
	var resp GroupChatGetResp
	req := &GroupChatGetReq{ChatID: chatID, NeedName: needNameInt}
	if err := m.client.Post(ctx, "/externalcontact/groupchat/get", req, &resp); err != nil {
		return nil, err
	}
	if resp.GroupChat == nil {
		return nil, fmt.Errorf("group_chat is nil for chat_id=%s", chatID)
	}
	return resp.GroupChat, nil
}

// G3: opengid → chat_id
func (m *GroupChatManager) OpengidToChatid(ctx context.Context, opengid string) (string, error) {
	var resp OpengidToChatidResp
	req := &OpengidToChatidReq{Opengid: opengid}
	if err := m.client.Post(ctx, "/externalcontact/opengid_to_chatid", req, &resp); err != nil {
		return "", err
	}
	return resp.ChatID, nil
}

// 全量同步
func (m *GroupChatManager) SyncAllGroupChats(ctx context.Context, ownerUserids []string, needName bool) ([]*GroupChatDetail, error) {
	chatList, err := m.ListGroupChats(ctx, 0, ownerUserids, 1000)
	if err != nil {
		return nil, err
	}
	var details []*GroupChatDetail
	for _, chat := range chatList {
		detail, err := m.GetGroupChat(ctx, chat.ChatID, needName)
		if err != nil {
			log.Printf("获取群 %s 详情失败: %v", chat.ChatID, err)
			continue
		}
		details = append(details, detail)
	}
	return details, nil
}
```

---


### 7.4 Java 示例

```java
public class WecomCrmGroupService {
    private final WeComClient client;

    public WecomCrmGroupService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-group 相关 API
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
class WecomCrmGroupService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-group 相关 API
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
"""wecom-crm-group 测试模板"""
import pytest
from unittest.mock import MagicMock


@pytest.fixture
def manager():
    client = MagicMock()
    return GroupChatManager(client)


class TestListGroupChats:
    """G1: 获取客户群列表"""

    def test_pagination(self, manager):
        manager.client.post.side_effect = [
            {"group_chat_list": [{"chat_id": "wr001", "status": 0}], "next_cursor": "c1"},
            {"group_chat_list": [{"chat_id": "wr002", "status": 0}], "next_cursor": ""},
        ]
        results = manager.list_group_chats()
        assert len(results) == 2
        assert manager.client.post.call_count == 2

    def test_owner_filter(self, manager):
        manager.client.post.return_value = {"group_chat_list": [], "next_cursor": ""}
        manager.list_group_chats(owner_userids=["abel"])
        call_body = manager.client.post.call_args[0][1]
        assert call_body["owner_filter"]["userid_list"] == ["abel"]

    def test_status_filter(self, manager):
        manager.client.post.return_value = {"group_chat_list": [], "next_cursor": ""}
        manager.list_group_chats(status_filter=1)
        call_body = manager.client.post.call_args[0][1]
        assert call_body["status_filter"] == 1

    def test_limit_capped_at_1000(self, manager):
        manager.client.post.return_value = {"group_chat_list": [], "next_cursor": ""}
        manager.list_group_chats(limit=2000)
        call_body = manager.client.post.call_args[0][1]
        assert call_body["limit"] == 1000


class TestGetGroupChat:
    """G2: 获取客户群详情"""

    def test_basic_detail(self, manager):
        manager.client.post.return_value = {
            "group_chat": {
                "chat_id": "wr001",
                "name": "测试群",
                "owner": "zhangsan",
                "create_time": 1572505490,
                "notice": "",
                "member_list": [
                    {"userid": "abel", "type": 1, "join_time": 100, "join_scene": 1, "group_nickname": ""}
                ],
                "admin_list": [{"userid": "zhangsan"}],
                "member_version": "abc123",
            }
        }
        detail = manager.get_group_chat("wr001")
        assert detail["chat_id"] == "wr001"
        assert detail["member_version"] == "abc123"
        assert len(detail["member_list"]) == 1

    def test_need_name_flag(self, manager):
        manager.client.post.return_value = {"group_chat": {"chat_id": "wr001", "member_list": [], "admin_list": [], "member_version": ""}}
        manager.get_group_chat("wr001", need_name=False)
        call_body = manager.client.post.call_args[0][1]
        assert call_body["need_name"] == 0

    def test_need_name_true(self, manager):
        manager.client.post.return_value = {"group_chat": {"chat_id": "wr001", "member_list": [], "admin_list": [], "member_version": ""}}
        manager.get_group_chat("wr001", need_name=True)
        call_body = manager.client.post.call_args[0][1]
        assert call_body["need_name"] == 1


class TestOpengidToChatid:
    """G3: opengid 转换"""

    def test_convert(self, manager):
        manager.client.post.return_value = {"chat_id": "wr001"}
        result = manager.opengid_to_chatid("oAAA")
        assert result == "wr001"
        call_body = manager.client.post.call_args[0][1]
        assert call_body["opengid"] == "oAAA"


class TestGroupCallback:
    """E1: 群变更回调处理"""

    def test_create_callback(self, manager):
        manager.client.post.return_value = {"group_chat": {"chat_id": "wr001", "member_list": [], "admin_list": [], "member_version": "v1"}}
        result = manager.handle_group_callback("create", "wr001")
        assert result["action"] == "create"
        assert result["data"]["chat_id"] == "wr001"

    def test_dismiss_callback(self, manager):
        result = manager.handle_group_callback("dismiss", "wr001")
        assert result["action"] == "delete"
        assert result["chat_id"] == "wr001"

    def test_update_incremental(self, manager):
        result = manager.handle_group_callback(
            "update", "wr001",
            update_detail="add_member",
            last_mem_ver="v1",
            cur_mem_ver="v2",
            mem_change_list=["woAAA"],
            local_version="v1",  # 匹配
        )
        assert result["action"] == "incremental"
        assert result["new_version"] == "v2"

    def test_update_full_sync_on_version_mismatch(self, manager):
        manager.client.post.return_value = {"group_chat": {"chat_id": "wr001", "member_list": [], "admin_list": [], "member_version": "v3"}}
        result = manager.handle_group_callback(
            "update", "wr001",
            update_detail="add_member",
            last_mem_ver="v2",
            local_version="v1",  # 不匹配
        )
        assert result["action"] == "full_sync"
```

---

## 9. Code Review 检查清单

| # | 检查项 | 严重度 | 说明 |
|---|--------|--------|------|
| R1 | 是否使用正确的 access_token | CRITICAL | 必须用客户联系 secret |
| R2 | groupchat/list 是否传 limit 参数 | HIGH | limit 是必填字段 |
| R3 | 是否使用 cursor 分页（非 offset） | HIGH | offset 方案将废弃 |
| R4 | 可见范围超 1000 人是否指定 owner_filter | HIGH | 否则报 81017 |
| R5 | need_name 是否按需传 1 | MEDIUM | 默认不返回成员名字 |
| R6 | member_version 是否用于增量同步 | MEDIUM | 版本号不匹配时应全量拉取 |
| R7 | 回调是否 5 秒内返回 success | HIGH | 超时会重试最多 3 次 |
| R8 | 是否区分 group_nickname 和 name | MEDIUM | 两个独立字段 |
| R9 | unionid 是否仅在 type=2 时读取 | MEDIUM | 企业成员无 unionid |
| R10 | state 是否仅在 join_scene=3 时存在 | MEDIUM | 其他入群方式无此字段 |
| R11 | opengid 转换是否仅限客户群 | MEDIUM | 内部群不支持 |
| R12 | 回调 UpdateDetail 5 种类型是否全覆盖 | MEDIUM | add_member/del_member/change_owner/change_name/change_notice |
| R13 | 群主 License 状态是否预检查 | LOW | 无 License 报 301002 |

---

## 10. 踩坑指南 (Gotcha Guide)

### G1: 可见范围超 1000 人不传 owner_filter 报 81017

**现象**：调用 groupchat/list 返回 81017 错误
**原因**：应用可见范围内超过 1000 人时，不指定 `owner_filter` 会报错
**方案**：始终指定 `owner_filter.userid_list`，按批次查询不同群主的群

### G2: need_name 默认不返回成员名字

**现象**：获取群详情后 member_list 中没有 name 字段
**原因**：`need_name` 默认为 0，不返回成员名字
**方案**：传 `need_name: 1` 明确请求返回

### G3: group_nickname 和 name 是两个独立字段

**现象**：读取 name 字段发现不是群内显示的昵称
**原因**：`group_nickname` 是成员在群内主动设置的昵称，`name` 是成员本名
**方案**：显示优先级：`group_nickname` > `name` > `userid`

### G4: member_version 不匹配必须全量拉取

**现象**：收到 update 回调后按 MemChangeList 增量更新，数据不一致
**原因**：回调中 `LastMemVer` 与本地存储的 `member_version` 不一致，说明漏收了事件
**方案**：版本号不匹配时放弃增量更新，调用 G2 全量拉取

### G5: 回调信息异步延迟

**现象**：收到回调后立即调 G2 获取详情，数据未更新
**原因**：部分群信息是异步处理的，存在短暂延迟
**方案**：收到回调后延迟 1-2 秒再调用 G2，或使用重试机制

### G6: state 字段仅在特定条件下返回

**现象**：部分群成员没有 state 字段
**原因**：`state` 仅在 `join_scene=3`（扫码/小程序按钮入群）且配置了「加入群聊」方式的 state 参数时返回
**方案**：不要假设所有成员都有 state，做空值兜底

### G7: opengid 仅支持客户群

**现象**：调用 opengid_to_chatid 失败
**原因**：仅支持企业服务人员创建的客户群（外部群），内部群不支持；且仅限本企业
**方案**：在调用前确认群类型

### G8: 群解散不会为每个成员单独触发退群回调

**现象**：群被解散后仅收到一次 dismiss 回调
**原因**：群解散是单次事件，不会为每个成员单独发退群回调
**方案**：收到 dismiss 后本地整体删除群数据

### G9: 群主 License 要求

**现象**：调用 groupchat/list 返回 301002 或 "no license"
**原因**：群主未开通互通账号（License）
**方案**：确保群主已开通 License，或在错误处理中跳过无 License 的群

---

## 11. 错误码速查

| 错误码 | 含义 | 排查方向 |
|--------|------|---------|
| 0 | 成功 | - |
| 40001 | access_token 无效或过期 | 重新获取（2 小时有效期） |
| 40003 | 无效的 userid | 检查 userid 是否存在 |
| 41063 | chat_id 不存在 | 检查 chat_id 是否有效 |
| 60020 | 缺少权限 | 检查应用权限配置 |
| 81017 | owner_filter 未指定且可见范围超 1000 人 | 必须指定 owner_filter |
| 301002 | 无 License | 群主未开通互通账号 |

---

## 12. 参考资料

| 资源 | 链接 |
|------|------|
| 获取客户群列表 (doc 92120) | https://developer.work.weixin.qq.com/document/path/92120 |
| 获取客户群详情 (doc 92122) | https://developer.work.weixin.qq.com/document/path/92122 |
| 获取客户群详情-第三方 (doc 92707) | https://developer.work.weixin.qq.com/document/path/92707 |
| opengid 转换 (doc 94822) | https://developer.work.weixin.qq.com/document/path/94822 |
| 客户群变更回调-自建 (doc 92130) | https://developer.work.weixin.qq.com/document/path/92130 |
| 客户群变更回调-第三方 (doc 92277) | https://developer.work.weixin.qq.com/document/path/92277 |
| 频率限制 (doc 96212) | https://developer.work.weixin.qq.com/document/path/96212 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |


