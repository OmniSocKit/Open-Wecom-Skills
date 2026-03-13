---
name: wecom-crm-tag
description: 企业微信外部联系人·客户标签管理域 SKILL — 企业标签/策略标签 CRUD、客户打标签、标签变更回调
version: 1.0.0
triggers:
  - 客户标签
  - 企业标签
  - 标签管理
  - corp_tag
  - strategy_tag
  - mark_tag
  - tag_group
  - 规则组标签
  - 打标签
  - 标签同步
  - 40068
  - 301002
  - 301021
prerequisite_skills:
  - wecom-core
domain: crm-tag
api_count: 9
callback_count: 1
---

# WeCom CRM · Customer Tag Management SKILL

> 覆盖企业微信「外部联系人 · 客户标签管理」子域：企业标签 CRUD（4 API）、客户打标签（1 API）、策略标签 CRUD（4 API），以及标签变更回调事件。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 「客户联系」secret 获取的 access_token | 需配置到「客户联系 → 可调用应用」列表 |
| 第三方应用 | 企业授权的 access_token | 「企业客户权限 → 客户基础信息」（**仅只读**） |
| 代开发应用 | 企业授权的 access_token | 需申请客户联系权限 |

> **2023-12-01 变更**：不再支持通过系统应用 secret 调用客户标签接口。
> **关键限制**：添加/删除/编辑企业客户标签，仅支持「客户联系」secret 获取的 access_token。第三方应用对标签仅有**只读**权限（可查询，不可增删改，不可打标签）。

### 1.2 应用权限边界

- 应用仅能编辑和删除**本应用创建**的标签（错误码 301002）
- 规则组标签操作时，userid 必须在该规则组的管理范围内
- mark_tag 打标签要求 external_userid 是 userid 的客户（好友关系）

### 1.3 标签数量限制

| 限制项 | 上限 |
|-------|------|
| 企业标签 + 规则组标签合计 | **10,000 个** |
| 每个成员对同一客户的标签数 | **3,000 个** |

---

## 2. 核心概念

### 2.1 三类标签体系

| 类型 | tag_id 前缀 | type 值 | 来源 | 作用域 |
|------|-----------|---------|------|--------|
| 企业标签 | `et` | 1 | 管理员/API 创建 | 全企业 |
| 个人标签 | `st` | 2 | 成员自行创建 | 仅该成员可见 |
| 规则组标签 | `et` | 3 | 规则组内 API 创建 | 规则组管理范围 |

> **API 仅能操作企业标签和规则组标签**，个人标签不可通过 API 管理。

### 2.2 标签组结构

```
标签库 (Tag Library)
├── 标签组 A (tag_group)
│   ├── 标签 1 (tag)      ← group_id = "etGROUP_A", id = "etTAG_1"
│   ├── 标签 2 (tag)
│   └── 标签 3 (tag)
├── 标签组 B (tag_group)
│   └── 标签 4 (tag)
└── ...
```

- 标签必须从属于标签组，不支持创建空标签组
- 标签组内标签不可同名
- 删除标签组会连带删除组内所有标签
- 标签组内所有标签被逐个删除后，标签组自动删除

### 2.3 企业标签 vs 策略标签

| 维度 | 企业标签 | 策略标签 |
|------|---------|---------|
| 作用域 | 全企业 | 特定规则组内 |
| API 前缀 | `*_corp_tag` | `*_strategy_tag` |
| 需要 strategy_id | 否 | 是 |
| get 响应含 deleted 字段 | 是 | 否 |
| get 响应含 strategy_id | 否 | 是 |
| 共享配额 | 合计 10,000 | 合计 10,000 |
| 只能在一级规则组添加 | N/A | 是 |

### 2.4 排序机制

- `order` 值越大排序越靠前，默认为 0
- 管理端手动调整排序会批量修改 order 值，触发 `shuffle` 回调
- 收到 `shuffle` 事件后应**全量重新同步** order 值

---

## 3. API 速查表

| 编号 | 名称 | 方法 | 路径 | doc_id |
|------|------|------|------|--------|
| T1 | 获取企业标签库 | POST | /externalcontact/get_corp_tag_list | 96320 |
| T2 | 添加企业客户标签 | POST | /externalcontact/add_corp_tag | 96320 |
| T3 | 编辑企业客户标签 | POST | /externalcontact/edit_corp_tag | 96320 |
| T4 | 删除企业客户标签 | POST | /externalcontact/del_corp_tag | 96320 |
| T5 | 编辑客户企业标签（打标签） | POST | /externalcontact/mark_tag | 92118 |
| T6 | 获取规则组标签 | POST | /externalcontact/get_strategy_tag_list | 94882 |
| T7 | 添加规则组标签 | POST | /externalcontact/add_strategy_tag | 94882 |
| T8 | 编辑规则组标签 | POST | /externalcontact/edit_strategy_tag | 94882 |
| T9 | 删除规则组标签 | POST | /externalcontact/del_strategy_tag | 94882 |

> **Base URL:** `https://qyapi.weixin.qq.com/cgi-bin`
> **所有接口均为 POST，均需附带 `?access_token=ACCESS_TOKEN`。**

---

## 4. API 详情

### 4.1 T1 — 获取企业标签库

`POST /cgi-bin/externalcontact/get_corp_tag_list?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| tag_id | string[] | 否 | 要查询的标签 ID 列表 |
| group_id | string[] | 否 | 要查询的标签组 ID 列表 |

**过滤规则:**
- 两者均为空 → 返回**所有**标签
- 同时传递 → **忽略 tag_id**，仅以 group_id 过滤

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| tag_group | object[] | 标签组列表 |

**tag_group 结构:**

| Field | Type | Description |
|------|------|------|
| group_id | string | 标签组 ID |
| group_name | string | 标签组名称 |
| create_time | uint32 | 创建时间（Unix 时间戳） |
| order | uint32 | 排序值，越大越靠前 |
| deleted | bool | 是否已删除 |
| tag | object[] | 标签列表 |

**tag_group.tag 结构:**

| Field | Type | Description |
|------|------|------|
| id | string | 标签 ID |
| name | string | 标签名称 |
| create_time | uint32 | 创建时间 |
| order | uint32 | 排序值 |
| deleted | bool | 是否已删除 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "tag_group": [
    {
      "group_id": "TAG_GROUPID1",
      "group_name": "客户等级",
      "create_time": 1557838797,
      "order": 1,
      "deleted": false,
      "tag": [
        { "id": "TAG_ID1", "name": "VIP", "create_time": 1557838797, "order": 2, "deleted": false },
        { "id": "TAG_ID2", "name": "普通", "create_time": 1557838797, "order": 1, "deleted": false }
      ]
    }
  ]
}
```

---

### 4.2 T2 — 添加企业客户标签

`POST /cgi-bin/externalcontact/add_corp_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| group_id | string | 否 | 向已有标签组添加标签时填写 |
| group_name | string | 否 | 创建新标签组时填写；若同名组已存在则加入该组 |
| order | uint32 | 否 | 标签组排序值，默认 0 |
| tag | object[] | 是 | 标签列表（不可为空） |
| tag[].name | string | 是 | 标签名称 |
| tag[].order | uint32 | 否 | 标签排序值，默认 0 |
| agentid | int | 否 | 仅旧第三方多应用套件需要 |

**逻辑规则:**
- 填写 `group_id` → `group_name` 和标签组 `order` 被忽略
- 不支持创建空标签组（`tag` 数组不可为空）
- 标签组内同名标签仅创建一个

**请求示例:**

```json
{
  "group_name": "客户来源",
  "order": 1,
  "tag": [
    { "name": "线上获客", "order": 1 },
    { "name": "线下活动", "order": 2 }
  ]
}
```

**返回:** 新创建的 tag_group 对象（结构同 T1，不含 `deleted` 字段）。

---

### 4.3 T3 — 编辑企业客户标签

`POST /cgi-bin/externalcontact/edit_corp_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| id | string | 是 | 标签或标签组的 ID |
| name | string | 否 | 新名称，最长 **30 个字符** |
| order | uint32 | 否 | 新排序值 |
| agentid | int | 否 | 仅旧第三方多应用套件需要 |

**约束:**
- 修改后不可与已有标签/标签组重名（返回 301021）
- 只能编辑**本应用创建**的标签（返回 301002）

**返回:** `{ "errcode": 0, "errmsg": "ok" }`

---

### 4.4 T4 — 删除企业客户标签

`POST /cgi-bin/externalcontact/del_corp_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| tag_id | string[] | 否 | 要删除的标签 ID 列表 |
| group_id | string[] | 否 | 要删除的标签组 ID 列表 |
| agentid | int | 否 | 仅旧第三方多应用套件需要 |

**约束:**
- `tag_id` 和 `group_id` **不可同时为空**
- 删除标签组 → 组内所有标签同时删除
- 逐个删除标签后标签组变空 → 标签组自动删除

**返回:** `{ "errcode": 0, "errmsg": "ok" }`

---

### 4.5 T5 — 编辑客户企业标签（打标签 / 取消标签）

`POST /cgi-bin/externalcontact/mark_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| userid | string | 是 | 企业成员 userid |
| external_userid | string | 是 | 外部联系人 userid（必须是 userid 的客户） |
| add_tag | string[] | 否 | 要添加的标签 ID 列表 |
| remove_tag | string[] | 否 | 要移除的标签 ID 列表 |

**约束:**
- `add_tag` 和 `remove_tag` **不可同时为空**
- external_userid 必须与 userid 存在好友关系（否则 84061）
- 同一标签组下已支持多个标签（早期版本曾限制每组仅一个）
- 规则组标签打标时，userid 必须在规则组管理范围内

**请求示例:**

```json
{
  "userid": "zhangsan",
  "external_userid": "woAJ2GCAAAXtWyujaWJHDDGi0mACHAAA",
  "add_tag": ["etTAG_ID1", "etTAG_ID2"],
  "remove_tag": ["etTAG_ID3"]
}
```

**返回:** `{ "errcode": 0, "errmsg": "ok" }`

> **注意:** mark_tag 操作会触发 `change_external_contact` 的 `edit_external_contact` 回调（修改企业标签视为编辑客户信息），**而非** `change_external_tag` 回调。`change_external_tag` 仅在标签库本身变更时触发。

---

### 4.6 T6 — 获取规则组标签

`POST /cgi-bin/externalcontact/get_strategy_tag_list?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| strategy_id | int | 是 | 规则组 ID |
| tag_id | string[] | 否 | 标签 ID 列表 |
| group_id | string[] | 否 | 标签组 ID 列表 |

**过滤规则:** 同 T1 — 均空返回所有，同时传则忽略 tag_id。

**返回:** 结构同 T1，差异：
- tag_group 多了 `strategy_id` 字段
- tag_group 和 tag 均**无 `deleted` 字段**

---

### 4.7 T7 — 添加规则组标签

`POST /cgi-bin/externalcontact/add_strategy_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| strategy_id | int | 是 | 规则组 ID |
| group_id | string | 否 | 向已有标签组添加标签时填写 |
| group_name | string | 否 | 创建新标签组时填写 |
| order | uint32 | 否 | 标签组排序值 |
| tag | object[] | 是 | 标签列表 |
| tag[].name | string | 是 | 标签名称 |
| tag[].order | uint32 | 否 | 标签排序值 |

**逻辑规则:**
- 填写 `group_id` → `group_name` 和标签组 `order` 被忽略
- 若 `group_name` 与规则组下已有标签组同名 → 标签加入该已有组
- 不支持创建空标签组（`tag` 数组不可为空）
- 标签组内同名标签仅创建一个
- **仅可在一级规则组下添加标签**

**返回:** 新创建的 tag_group 对象。

---

### 4.8 T8 — 编辑规则组标签

`POST /cgi-bin/externalcontact/edit_strategy_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| id | string | 是 | 标签或标签组 ID |
| name | string | 否 | 新名称 |
| order | uint32 | 否 | 新排序值 |

**与 T3 的差异:**
- **不支持 `agentid` 参数**
- **不可重新指定标签所属规则组**

**约束:** 修改后不可与同规则组内已有标签/标签组重名（返回 301021）。

**返回:** `{ "errcode": 0, "errmsg": "ok" }`

---

### 4.9 T9 — 删除规则组标签

`POST /cgi-bin/externalcontact/del_strategy_tag?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| tag_id | string[] | 否 | 标签 ID 列表 |
| group_id | string[] | 否 | 标签组 ID 列表 |

**约束:**
- `tag_id` 和 `group_id` **不可同时为空**
- 删除标签组 → 组内所有标签同时删除
- 逐个删除标签后标签组变空 → 标签组自动删除

**与 T4 的差异:** 不支持 `agentid` 参数。

**返回:** `{ "errcode": 0, "errmsg": "ok" }`

---

## 5. 回调事件

### 5.1 标签库变更回调 — change_external_tag

当企业标签/标签组发生 CRUD 或排序变更时触发。

**自建应用 XML:**

```xml
<xml>
  <ToUserName><![CDATA[toUser]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1403610513</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[change_external_tag]]></Event>
  <Id><![CDATA[TAG_ID_OR_GROUP_ID]]></Id>
  <TagType><![CDATA[tag]]></TagType>
  <ChangeType><![CDATA[create]]></ChangeType>
</xml>
```

**第三方应用 XML:**

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe99e54c0f4c]]></SuiteId>
  <AuthCorpId><![CDATA[wxf8b4f85f3a794e77]]></AuthCorpId>
  <InfoType><![CDATA[change_external_tag]]></InfoType>
  <TimeStamp>1403610513</TimeStamp>
  <Id><![CDATA[TAG_ID_OR_GROUP_ID]]></Id>
  <TagType><![CDATA[tag]]></TagType>
  <ChangeType><![CDATA[create]]></ChangeType>
</xml>
```

**回调字段:**

| Field | Type | Description |
|------|------|------|
| Event / InfoType | string | `change_external_tag` |
| Id | string | 标签或标签组 ID |
| TagType | string | `tag`（标签）或 `tag_group`（标签组） |
| ChangeType | string | 变更类型，见下表 |

**ChangeType 取值:**

| 值 | 触发场景 | 处理建议 |
|----|---------|---------|
| `create` | 创建标签/标签组 | 调用 get_corp_tag_list 获取详情 |
| `update` | 修改标签/标签组名称 | 调用 get_corp_tag_list 获取最新信息 |
| `delete` | 删除标签/标签组 | 本地删除对应缓存 |
| `shuffle` | 标签排序变更 | **全量同步** order 值 |

**关键注意:**
- 删除标签组时，组内子标签**不会单独触发 delete 回调**，仅回调标签组级别的 delete 事件
- 给客户打标签（mark_tag）触发的是 `change_external_contact` 的 `edit_external_contact` 回调，**不是** `change_external_tag`
- 收到 `shuffle` 事件意味着多个标签的 order 值可能同时变化，需全量拉取

### 5.2 两种回调的区分

| 回调事件 | Event/InfoType | 触发场景 |
|---------|---------------|---------|
| change_external_tag | 标签库变更 | 标签/标签组的创建、修改、删除、排序 |
| change_external_contact (edit) | 客户信息变更 | 给客户打标签/取消标签、修改备注等 |

---

## 6. 典型工作流

### 6.1 标签体系初始化

```
步骤 1: 设计标签分组结构
  ├── 客户等级: VIP / 重要 / 普通
  ├── 客户来源: 线上获客 / 线下活动 / 转介绍
  └── 跟进阶段: 初次接触 / 需求确认 / 报价中 / 已成交

步骤 2: 批量创建标签组
  → 每组调用 T2 (add_corp_tag)，一次创建整组标签

步骤 3: 本地缓存标签 ID 映射
  → 调用 T1 (get_corp_tag_list) 获取全量标签
  → 建立 tag_name → tag_id 的映射表
```

### 6.2 客户自动打标签

```
触发: 收到 change_external_contact / add_external_contact 回调
  ↓
步骤 1: 调用 externalcontact/get 获取客户详情
  ↓
步骤 2: 根据业务规则确定标签
  - add_way=1 (扫码) → 标记「线上获客」
  - add_way=10 (视频号) → 标记「视频号引流」
  - corp_name 匹配行业关键词 → 标记行业标签
  ↓
步骤 3: 调用 T5 (mark_tag) 打标签
  ↓
步骤 4: 记录打标结果到本地数据库
```

### 6.3 标签全量同步

```
定时任务 / 收到 shuffle 回调
  ↓
步骤 1: 调用 T1 (get_corp_tag_list) 传空 body {} 获取所有标签
  ↓
步骤 2: 与本地缓存对比
  - 新增标签 → 插入本地
  - 已删除标签 (deleted=true) → 标记删除
  - order 变化 → 更新排序
  ↓
步骤 3: 更新本地缓存
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom CRM Tag Manager — 客户标签管理"""
from wecom_client import WeComClient  # 来自 wecom-core SKILL


class WeComTagManager:
    """企业微信客户标签管理器"""

    def __init__(self, client: WeComClient):
        self.client = client

    # ── T1: 获取企业标签库 ──
    def get_corp_tags(
        self,
        tag_ids: list[str] | None = None,
        group_ids: list[str] | None = None,
    ) -> list[dict]:
        """获取企业标签库，返回 tag_group 列表。

        Args:
            tag_ids: 按标签 ID 过滤（与 group_ids 同时传则被忽略）
            group_ids: 按标签组 ID 过滤
        """
        body: dict = {}
        if tag_ids:
            body["tag_id"] = tag_ids
        if group_ids:
            body["group_id"] = group_ids
        resp = self.client.post("/externalcontact/get_corp_tag_list", json=body)
        return resp.get("tag_group", [])

    # ── T2: 添加企业标签 ──
    def add_corp_tags(
        self,
        tags: list[dict],
        group_id: str | None = None,
        group_name: str | None = None,
        order: int = 0,
    ) -> dict:
        """添加企业标签。返回新建的 tag_group。

        Args:
            tags: [{"name": "标签名", "order": 0}]
            group_id: 向已有组添加时传
            group_name: 创建新组时传（group_id 优先）
        """
        body: dict = {"tag": tags}
        if group_id:
            body["group_id"] = group_id
        elif group_name:
            body["group_name"] = group_name
            body["order"] = order
        return self.client.post("/externalcontact/add_corp_tag", json=body)

    # ── T3: 编辑企业标签 ──
    def edit_corp_tag(
        self,
        tag_or_group_id: str,
        name: str | None = None,
        order: int | None = None,
    ) -> None:
        """编辑标签或标签组的名称/排序。"""
        body: dict = {"id": tag_or_group_id}
        if name is not None:
            body["name"] = name
        if order is not None:
            body["order"] = order
        self.client.post("/externalcontact/edit_corp_tag", json=body)

    # ── T4: 删除企业标签 ──
    def del_corp_tags(
        self,
        tag_ids: list[str] | None = None,
        group_ids: list[str] | None = None,
    ) -> None:
        """删除标签或标签组。至少传一个参数。"""
        body: dict = {}
        if tag_ids:
            body["tag_id"] = tag_ids
        if group_ids:
            body["group_id"] = group_ids
        if not body:
            raise ValueError("tag_ids 和 group_ids 不可同时为空")
        self.client.post("/externalcontact/del_corp_tag", json=body)

    # ── T5: 给客户打标签 ──
    def mark_tag(
        self,
        userid: str,
        external_userid: str,
        add_tag: list[str] | None = None,
        remove_tag: list[str] | None = None,
    ) -> None:
        """为客户添加/移除标签。

        Args:
            userid: 企业成员 userid
            external_userid: 客户 external_userid（必须是 userid 的客户）
            add_tag: 要添加的标签 ID 列表
            remove_tag: 要移除的标签 ID 列表
        """
        if not add_tag and not remove_tag:
            raise ValueError("add_tag 和 remove_tag 不可同时为空")
        body: dict = {
            "userid": userid,
            "external_userid": external_userid,
        }
        if add_tag:
            body["add_tag"] = add_tag
        if remove_tag:
            body["remove_tag"] = remove_tag
        self.client.post("/externalcontact/mark_tag", json=body)

    # ── T6: 获取规则组标签 ──
    def get_strategy_tags(
        self,
        strategy_id: int,
        tag_ids: list[str] | None = None,
        group_ids: list[str] | None = None,
    ) -> list[dict]:
        """获取规则组内的标签，返回 tag_group 列表（含 strategy_id，无 deleted）。"""
        body: dict = {"strategy_id": strategy_id}
        if tag_ids:
            body["tag_id"] = tag_ids
        if group_ids:
            body["group_id"] = group_ids
        resp = self.client.post("/externalcontact/get_strategy_tag_list", json=body)
        return resp.get("tag_group", [])

    # ── T7: 添加规则组标签 ──
    def add_strategy_tags(
        self,
        strategy_id: int,
        tags: list[dict],
        group_id: str | None = None,
        group_name: str | None = None,
        order: int = 0,
    ) -> dict:
        """向规则组添加标签。仅可在一级规则组下添加。返回 tag_group。"""
        body: dict = {"strategy_id": strategy_id, "tag": tags}
        if group_id:
            body["group_id"] = group_id
        elif group_name:
            body["group_name"] = group_name
            body["order"] = order
        return self.client.post("/externalcontact/add_strategy_tag", json=body)

    # ── T8: 编辑规则组标签 ──
    def edit_strategy_tag(
        self,
        tag_or_group_id: str,
        name: str | None = None,
        order: int | None = None,
    ) -> None:
        """编辑规则组标签/标签组的名称或排序。不可重新指定所属规则组。"""
        body: dict = {"id": tag_or_group_id}
        if name is not None:
            body["name"] = name
        if order is not None:
            body["order"] = order
        self.client.post("/externalcontact/edit_strategy_tag", json=body)

    # ── T9: 删除规则组标签 ──
    def del_strategy_tags(
        self,
        tag_ids: list[str] | None = None,
        group_ids: list[str] | None = None,
    ) -> None:
        """删除规则组标签或标签组。至少传一个参数。"""
        body: dict = {}
        if tag_ids:
            body["tag_id"] = tag_ids
        if group_ids:
            body["group_id"] = group_ids
        if not body:
            raise ValueError("tag_ids 和 group_ids 不可同时为空")
        self.client.post("/externalcontact/del_strategy_tag", json=body)

    # ── 全量同步标签 ──
    def sync_all_tags(self) -> dict[str, dict]:
        """全量同步企业标签，返回 {tag_id: {name, group_id, group_name, order}} 映射。"""
        groups = self.get_corp_tags()
        tag_map: dict[str, dict] = {}
        for group in groups:
            if group.get("deleted"):
                continue
            for tag in group.get("tag", []):
                if tag.get("deleted"):
                    continue
                tag_map[tag["id"]] = {
                    "name": tag["name"],
                    "order": tag.get("order", 0),
                    "group_id": group["group_id"],
                    "group_name": group["group_name"],
                }
        return tag_map

    # ── 批量打标签（带重试） ──
    def batch_mark_tags(
        self,
        userid: str,
        external_userids: list[str],
        add_tag: list[str],
    ) -> dict[str, str]:
        """批量为多个客户打相同标签。返回 {external_userid: "ok"|error_msg}。"""
        results: dict[str, str] = {}
        for ext_uid in external_userids:
            try:
                self.mark_tag(userid, ext_uid, add_tag=add_tag)
                results[ext_uid] = "ok"
            except Exception as e:
                results[ext_uid] = str(e)
        return results
```

### 7.2 TypeScript

```typescript
/** WeCom CRM Tag Manager — 客户标签管理 */
import { WeComClient } from './wecom-client'; // 来自 wecom-core SKILL

// ── 类型定义 ──

interface Tag {
  id: string;
  name: string;
  create_time: number;
  order: number;
  deleted?: boolean;
}

interface TagGroup {
  group_id: string;
  group_name: string;
  create_time: number;
  order: number;
  deleted?: boolean;
  strategy_id?: number;  // 仅策略标签有此字段
  tag: Tag[];
}

interface AddTagRequest {
  group_id?: string;
  group_name?: string;
  order?: number;
  tag: { name: string; order?: number }[];
  agentid?: number;
}

interface MarkTagRequest {
  userid: string;
  external_userid: string;
  add_tag?: string[];
  remove_tag?: string[];
}

interface AddStrategyTagRequest extends AddTagRequest {
  strategy_id: number;
}

// ── 标签管理器 ──

class WeComTagManager {
  constructor(private client: WeComClient) {}

  /** T1: 获取企业标签库 */
  async getCorpTags(
    tagIds?: string[],
    groupIds?: string[],
  ): Promise<TagGroup[]> {
    const body: Record<string, unknown> = {};
    if (tagIds?.length) body.tag_id = tagIds;
    if (groupIds?.length) body.group_id = groupIds;
    const resp = await this.client.post('/externalcontact/get_corp_tag_list', body);
    return resp.tag_group ?? [];
  }

  /** T2: 添加企业标签 */
  async addCorpTags(req: AddTagRequest): Promise<TagGroup> {
    const resp = await this.client.post('/externalcontact/add_corp_tag', req);
    return resp.tag_group!;
  }

  /** T3: 编辑企业标签 */
  async editCorpTag(
    id: string,
    name?: string,
    order?: number,
  ): Promise<void> {
    const body: Record<string, unknown> = { id };
    if (name !== undefined) body.name = name;
    if (order !== undefined) body.order = order;
    await this.client.post('/externalcontact/edit_corp_tag', body);
  }

  /** T4: 删除企业标签 */
  async delCorpTags(
    tagIds?: string[],
    groupIds?: string[],
  ): Promise<void> {
    if (!tagIds?.length && !groupIds?.length) {
      throw new Error('tagIds 和 groupIds 不可同时为空');
    }
    const body: Record<string, unknown> = {};
    if (tagIds?.length) body.tag_id = tagIds;
    if (groupIds?.length) body.group_id = groupIds;
    await this.client.post('/externalcontact/del_corp_tag', body);
  }

  /** T5: 给客户打标签/取消标签 */
  async markTag(req: MarkTagRequest): Promise<void> {
    if (!req.add_tag?.length && !req.remove_tag?.length) {
      throw new Error('add_tag 和 remove_tag 不可同时为空');
    }
    await this.client.post('/externalcontact/mark_tag', req);
  }

  /** T6: 获取规则组标签 */
  async getStrategyTags(
    strategyId: number,
    tagIds?: string[],
    groupIds?: string[],
  ): Promise<TagGroup[]> {
    const body: Record<string, unknown> = { strategy_id: strategyId };
    if (tagIds?.length) body.tag_id = tagIds;
    if (groupIds?.length) body.group_id = groupIds;
    const resp = await this.client.post('/externalcontact/get_strategy_tag_list', body);
    return resp.tag_group ?? [];
  }

  /** T7: 添加规则组标签（仅一级规则组） */
  async addStrategyTags(req: AddStrategyTagRequest): Promise<TagGroup> {
    const resp = await this.client.post('/externalcontact/add_strategy_tag', req);
    return resp.tag_group!;
  }

  /** T8: 编辑规则组标签（不可重新指定所属规则组） */
  async editStrategyTag(
    id: string,
    name?: string,
    order?: number,
  ): Promise<void> {
    const body: Record<string, unknown> = { id };
    if (name !== undefined) body.name = name;
    if (order !== undefined) body.order = order;
    await this.client.post('/externalcontact/edit_strategy_tag', body);
  }

  /** T9: 删除规则组标签 */
  async delStrategyTags(
    tagIds?: string[],
    groupIds?: string[],
  ): Promise<void> {
    if (!tagIds?.length && !groupIds?.length) {
      throw new Error('tagIds 和 groupIds 不可同时为空');
    }
    const body: Record<string, unknown> = {};
    if (tagIds?.length) body.tag_id = tagIds;
    if (groupIds?.length) body.group_id = groupIds;
    await this.client.post('/externalcontact/del_strategy_tag', body);
  }

  /** 全量同步标签 → Map<tag_id, TagInfo> */
  async syncAllTags(): Promise<Map<string, { name: string; groupId: string; groupName: string; order: number }>> {
    const groups = await this.getCorpTags();
    const tagMap = new Map<string, { name: string; groupId: string; groupName: string; order: number }>();
    for (const group of groups) {
      if (group.deleted) continue;
      for (const tag of group.tag) {
        if (tag.deleted) continue;
        tagMap.set(tag.id, {
          name: tag.name,
          groupId: group.group_id,
          groupName: group.group_name,
          order: tag.order,
        });
      }
    }
    return tagMap;
  }
}

export { WeComTagManager, TagGroup, Tag, MarkTagRequest };
```

### 7.3 Go

```go
package wecom

import (
	"fmt"
)

// ── 类型定义 ──

type Tag struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	CreateTime uint32 `json:"create_time"`
	Order      uint32 `json:"order"`
	Deleted    *bool  `json:"deleted,omitempty"` // 仅企业标签 get 返回
}

type TagGroup struct {
	GroupID    string `json:"group_id"`
	GroupName  string `json:"group_name"`
	CreateTime uint32 `json:"create_time"`
	Order      uint32 `json:"order"`
	Deleted    *bool  `json:"deleted,omitempty"`    // 仅企业标签 get 返回
	StrategyID *int   `json:"strategy_id,omitempty"` // 仅策略标签返回
	Tags       []Tag  `json:"tag"`
}

type GetCorpTagListReq struct {
	TagID   []string `json:"tag_id,omitempty"`
	GroupID []string `json:"group_id,omitempty"`
}

type AddCorpTagReq struct {
	GroupID   string          `json:"group_id,omitempty"`
	GroupName string          `json:"group_name,omitempty"`
	Order     uint32          `json:"order,omitempty"`
	Tag       []AddTagItem    `json:"tag"`
	AgentID   int             `json:"agentid,omitempty"`
}

type AddTagItem struct {
	Name  string `json:"name"`
	Order uint32 `json:"order,omitempty"`
}

type EditCorpTagReq struct {
	ID      string `json:"id"`
	Name    string `json:"name,omitempty"`
	Order   *uint32 `json:"order,omitempty"`
	AgentID int    `json:"agentid,omitempty"`
}

type DelCorpTagReq struct {
	TagID   []string `json:"tag_id,omitempty"`
	GroupID []string `json:"group_id,omitempty"`
	AgentID int      `json:"agentid,omitempty"`
}

type MarkTagReq struct {
	UserID         string   `json:"userid"`
	ExternalUserID string   `json:"external_userid"`
	AddTag         []string `json:"add_tag,omitempty"`
	RemoveTag      []string `json:"remove_tag,omitempty"`
}

type GetStrategyTagListReq struct {
	StrategyID int      `json:"strategy_id"`
	TagID      []string `json:"tag_id,omitempty"`
	GroupID    []string `json:"group_id,omitempty"`
}

type AddStrategyTagReq struct {
	StrategyID int          `json:"strategy_id"`
	GroupID    string       `json:"group_id,omitempty"`
	GroupName  string       `json:"group_name,omitempty"`
	Order      uint32      `json:"order,omitempty"`
	Tag        []AddTagItem `json:"tag"`
}

type EditStrategyTagReq struct {
	ID    string  `json:"id"`
	Name  string  `json:"name,omitempty"`
	Order *uint32 `json:"order,omitempty"`
}

type DelStrategyTagReq struct {
	TagID   []string `json:"tag_id,omitempty"`
	GroupID []string `json:"group_id,omitempty"`
}

// ── 标签管理器 ──

type TagManager struct {
	client *WeComClient
}

func NewTagManager(client *WeComClient) *TagManager {
	return &TagManager{client: client}
}

// GetCorpTags T1: 获取企业标签库
func (m *TagManager) GetCorpTags(req *GetCorpTagListReq) ([]TagGroup, error) {
	var result struct {
		TagGroup []TagGroup `json:"tag_group"`
	}
	if err := m.client.Post("/externalcontact/get_corp_tag_list", req, &result); err != nil {
		return nil, err
	}
	return result.TagGroup, nil
}

// AddCorpTags T2: 添加企业标签
func (m *TagManager) AddCorpTags(req *AddCorpTagReq) (*TagGroup, error) {
	if len(req.Tag) == 0 {
		return nil, fmt.Errorf("tag 列表不可为空")
	}
	var result struct {
		TagGroup TagGroup `json:"tag_group"`
	}
	if err := m.client.Post("/externalcontact/add_corp_tag", req, &result); err != nil {
		return nil, err
	}
	return &result.TagGroup, nil
}

// EditCorpTag T3: 编辑企业标签
func (m *TagManager) EditCorpTag(req *EditCorpTagReq) error {
	return m.client.Post("/externalcontact/edit_corp_tag", req, nil)
}

// DelCorpTags T4: 删除企业标签
func (m *TagManager) DelCorpTags(req *DelCorpTagReq) error {
	if len(req.TagID) == 0 && len(req.GroupID) == 0 {
		return fmt.Errorf("tag_id 和 group_id 不可同时为空")
	}
	return m.client.Post("/externalcontact/del_corp_tag", req, nil)
}

// MarkTag T5: 给客户打标签/取消标签
func (m *TagManager) MarkTag(req *MarkTagReq) error {
	if len(req.AddTag) == 0 && len(req.RemoveTag) == 0 {
		return fmt.Errorf("add_tag 和 remove_tag 不可同时为空")
	}
	return m.client.Post("/externalcontact/mark_tag", req, nil)
}

// GetStrategyTags T6: 获取规则组标签
func (m *TagManager) GetStrategyTags(req *GetStrategyTagListReq) ([]TagGroup, error) {
	var result struct {
		TagGroup []TagGroup `json:"tag_group"`
	}
	if err := m.client.Post("/externalcontact/get_strategy_tag_list", req, &result); err != nil {
		return nil, err
	}
	return result.TagGroup, nil
}

// AddStrategyTags T7: 添加规则组标签（仅一级规则组）
func (m *TagManager) AddStrategyTags(req *AddStrategyTagReq) (*TagGroup, error) {
	if len(req.Tag) == 0 {
		return nil, fmt.Errorf("tag 列表不可为空")
	}
	var result struct {
		TagGroup TagGroup `json:"tag_group"`
	}
	if err := m.client.Post("/externalcontact/add_strategy_tag", req, &result); err != nil {
		return nil, err
	}
	return &result.TagGroup, nil
}

// EditStrategyTag T8: 编辑规则组标签（不可重新指定所属规则组）
func (m *TagManager) EditStrategyTag(req *EditStrategyTagReq) error {
	return m.client.Post("/externalcontact/edit_strategy_tag", req, nil)
}

// DelStrategyTags T9: 删除规则组标签
func (m *TagManager) DelStrategyTags(req *DelStrategyTagReq) error {
	if len(req.TagID) == 0 && len(req.GroupID) == 0 {
		return fmt.Errorf("tag_id 和 group_id 不可同时为空")
	}
	return m.client.Post("/externalcontact/del_strategy_tag", req, nil)
}

// SyncAllTags 全量同步企业标签
func (m *TagManager) SyncAllTags() (map[string]TagInfo, error) {
	groups, err := m.GetCorpTags(&GetCorpTagListReq{})
	if err != nil {
		return nil, err
	}
	tagMap := make(map[string]TagInfo)
	for _, group := range groups {
		if group.Deleted != nil && *group.Deleted {
			continue
		}
		for _, tag := range group.Tags {
			if tag.Deleted != nil && *tag.Deleted {
				continue
			}
			tagMap[tag.ID] = TagInfo{
				Name:      tag.Name,
				Order:     tag.Order,
				GroupID:   group.GroupID,
				GroupName: group.GroupName,
			}
		}
	}
	return tagMap, nil
}

type TagInfo struct {
	Name      string
	Order     uint32
	GroupID   string
	GroupName string
}
```

---


### 7.4 Java 示例

```java
public class WecomCrmTagService {
    private final WeComClient client;

    public WecomCrmTagService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-tag 相关 API
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
class WecomCrmTagService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-tag 相关 API
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

### 8.1 标签 CRUD 测试

```python
def test_tag_crud():
    """测试标签完整生命周期: 创建 → 查询 → 编辑 → 打标签 → 删除"""
    mgr = WeComTagManager(client)

    # 创建标签组 + 标签
    result = mgr.add_corp_tags(
        tags=[{"name": "测试标签A", "order": 1}, {"name": "测试标签B", "order": 2}],
        group_name="测试标签组",
    )
    group_id = result["tag_group"]["group_id"]
    tag_ids = [t["id"] for t in result["tag_group"]["tag"]]
    assert len(tag_ids) == 2

    # 查询
    groups = mgr.get_corp_tags(group_ids=[group_id])
    assert len(groups) == 1
    assert groups[0]["group_name"] == "测试标签组"

    # 编辑
    mgr.edit_corp_tag(tag_ids[0], name="测试标签A-改名")
    groups = mgr.get_corp_tags(group_ids=[group_id])
    names = [t["name"] for t in groups[0]["tag"]]
    assert "测试标签A-改名" in names

    # 给客户打标签（需真实的 userid + external_userid）
    # mgr.mark_tag("zhangsan", "woXXXXX", add_tag=[tag_ids[0]])

    # 删除整个标签组
    mgr.del_corp_tags(group_ids=[group_id])
    groups = mgr.get_corp_tags(group_ids=[group_id])
    assert len(groups) == 0 or all(g.get("deleted") for g in groups)
```

### 8.2 标签名冲突测试

```python
def test_duplicate_tag_name():
    """测试同名标签的处理"""
    mgr = WeComTagManager(client)

    # 创建标签组
    result = mgr.add_corp_tags(
        tags=[{"name": "标签X"}],
        group_name="冲突测试组",
    )
    group_id = result["tag_group"]["group_id"]

    # 向同组添加同名标签 → 应只创建一个
    result2 = mgr.add_corp_tags(
        tags=[{"name": "标签X"}, {"name": "标签Y"}],
        group_id=group_id,
    )
    tag_names = [t["name"] for t in result2["tag_group"]["tag"]]
    # 标签X 已存在，不会重复创建；标签Y 会创建

    # 编辑标签名与已有标签重名 → 应报 301021
    try:
        new_tag_id = [t["id"] for t in result2["tag_group"]["tag"] if t["name"] == "标签Y"][0]
        mgr.edit_corp_tag(new_tag_id, name="标签X")  # 与已有标签同名
        assert False, "应报 301021 错误"
    except Exception as e:
        assert "301021" in str(e)

    # 清理
    mgr.del_corp_tags(group_ids=[group_id])
```

### 8.3 策略标签测试

```python
def test_strategy_tag_crud():
    """测试规则组标签的 CRUD（需替换实际 strategy_id）"""
    mgr = WeComTagManager(client)
    strategy_id = 1  # 替换为实际规则组 ID

    # T6: 获取规则组标签
    tag_groups = mgr.get_strategy_tags(strategy_id)

    # 验证响应结构：含 strategy_id，无 deleted
    for group in tag_groups:
        assert "deleted" not in group, "策略标签响应不应有 deleted 字段"

    # T7: 添加规则组标签
    result = mgr.add_strategy_tags(
        strategy_id=strategy_id,
        tags=[{"name": "策略标签A", "order": 1}],
        group_name="策略测试组",
    )
    group_id = result["tag_group"]["group_id"]
    tag_id = result["tag_group"]["tag"][0]["id"]

    # T8: 编辑规则组标签
    mgr.edit_strategy_tag(tag_id, name="策略标签A-改名")

    # T9: 删除规则组标签
    mgr.del_strategy_tags(group_ids=[group_id])
    updated = mgr.get_strategy_tags(strategy_id, group_ids=[group_id])
    assert len(updated) == 0
```

---

## 9. Code Review 检查项

### 凭证与权限

- [ ] **CR-1**: 标签管理 API 使用「客户联系」secret 获取的 access_token（非通讯录/自建应用 secret）
- [ ] **CR-2**: 编辑/删除标签时确认是本应用创建的标签（避免 301002）
- [ ] **CR-3**: 第三方应用仅调用 get_corp_tag_list 只读接口，不调用增删改接口

### 参数校验

- [ ] **CR-4**: add_corp_tag 的 tag 数组不可为空
- [ ] **CR-5**: del_corp_tag 的 tag_id 和 group_id 不可同时为空
- [ ] **CR-6**: mark_tag 的 add_tag 和 remove_tag 不可同时为空
- [ ] **CR-7**: edit_corp_tag 的 name 不超过 30 个字符
- [ ] **CR-8**: mark_tag 前验证 external_userid 是 userid 的客户（避免 84061）

### 标签体系

- [ ] **CR-9**: get_corp_tag_list 同时传 tag_id 和 group_id 时，tag_id 会被忽略，确认这是预期行为
- [ ] **CR-10**: 标签总数（企业标签 + 规则组标签）控制在 10,000 以内
- [ ] **CR-11**: 每个成员对同一客户标签数控制在 3,000 以内

### 回调处理

- [ ] **CR-12**: 收到 `change_external_tag` delete 事件时，注意子标签不单独回调
- [ ] **CR-13**: 收到 `shuffle` 事件后全量同步 order 值，不只更新单个标签
- [ ] **CR-14**: 区分 `change_external_tag`（标签库变更）和 `change_external_contact/edit`（客户打标签）

### 策略标签

- [ ] **CR-15**: 策略标签操作必须传 strategy_id
- [ ] **CR-16**: 仅在一级规则组下添加策略标签
- [ ] **CR-17**: edit_strategy_tag 不可重新指定标签所属规则组
- [ ] **CR-18**: 策略标签 get 响应无 deleted 字段，代码不应依赖该字段

---

## 10. 踩坑指南 (Gotchas)

### 1. 凭证类型错误
**症状**: 调用 add_corp_tag 返回权限错误
**原因**: 使用了自建应用 secret 而非「客户联系」secret
**解决**: 标签管理所有写操作必须用「客户联系」secret 获取的 access_token

### 2. 标签非本应用创建 (301002)
**症状**: 编辑/删除标签返回 `301002 无权限操作指定的标签`
**原因**: 应用只能操作自己创建的标签，管理员在后台或其他应用创建的标签无法通过当前应用操作
**解决**: 确认标签由当前应用创建；如需操作其他来源标签，需使用创建该标签的应用凭证

### 3. 标签名重复 (301021)
**症状**: 创建或编辑标签返回 `301021 标签名称已存在`
**原因**: 同一标签组内不允许同名标签；标签组之间也不允许同名标签组
**解决**: 创建前先查询现有标签名；add_corp_tag 传入同名标签只会创建一个（不报错）

### 4. mark_tag 静默失败
**症状**: mark_tag 返回 `{"errcode": 0, "errmsg": "ok"}` 但客户标签未变化
**原因**: 可能是并发竞争、标签已被删除、或 external_userid 与 userid 的关系异常
**解决**:
  - 确认 external_userid 是 userid 的客户（调用 externalcontact/get 验证）
  - 确认标签 ID 有效（调用 get_corp_tag_list 验证）
  - 并发场景加锁或排队处理

### 5. 删除标签组的连锁删除
**症状**: 删除标签组后，组内标签全部消失
**原因**: 这是预期行为 — 删除标签组会级联删除所有子标签
**影响**: 但子标签的删除**不会单独触发回调**，仅触发标签组级别的 delete 回调
**解决**: 监听 delete 事件时，若 TagType=tag_group，需同时清理本地缓存中该组所有标签

### 6. get_corp_tag_list 过滤参数冲突
**症状**: 同时传 tag_id 和 group_id 后，结果只按 group_id 过滤
**原因**: 官方设计 — 同时传递时 tag_id 被忽略
**解决**: 明确查询意图，二选一使用

### 7. shuffle 回调需全量同步
**症状**: 收到 shuffle 回调后只更新了回调中 Id 对应的标签 order，其他标签排序仍旧
**原因**: 管理端拖拽排序会批量修改多个标签的 order 值，但 shuffle 回调只推送一次
**解决**: 收到 shuffle 事件后必须调用 get_corp_tag_list 全量同步 order 值

### 8. 策略标签 vs 企业标签 API 混用
**症状**: 用 edit_corp_tag 编辑策略标签，或用 edit_strategy_tag 编辑企业标签
**原因**: 两类标签的 tag_id 前缀相同（均为 `et`），容易混淆
**解决**: 维护本地映射时记录标签来源（is_strategy=true/false），调用前根据来源选择正确 API

### 9. 第三方应用标签权限受限
**症状**: 第三方应用调用 add_corp_tag / mark_tag 返回权限错误
**原因**: 第三方应用对标签仅有**只读**权限，不可增删改，不可打标签
**解决**: 需要写操作的场景应使用自建应用或代开发应用

### 10. 编辑标签不触发 change_external_tag 的 edit 回调
**症状**: 给客户打标签后等待 change_external_tag 回调，但收不到
**原因**: mark_tag 触发的是 `change_external_contact` 的 `edit_external_contact` 回调，不是 `change_external_tag`
**解决**: 区分两种回调：
  - `change_external_tag` = 标签库本身的 CRUD 和排序
  - `change_external_contact/edit` = 给客户打标签/修改备注

---

## 11. 错误码速查

| 错误码 | 含义 | 常见场景 | 处理建议 |
|--------|------|---------|---------|
| 0 | 成功 | — | — |
| 40068 | 不合法的标签 ID | tag_id 不存在或格式错误 | 检查 tag_id 是否有效 |
| 40071 | 不合法的标签名称 | 名称为空或超过 30 字符 | 检查 name 参数 |
| 41056 | external_userid 类型不正确 | 格式错误 | 检查 external_userid 格式（wo/wm 开头） |
| 50002 | 成员不在权限范围 | userid 不在应用可见范围 | 检查客户联系使用范围配置 |
| 84061 | 不存在外部联系人关系 | mark_tag 时客户非该成员的客户 | 确认好友关系存在 |
| 84074 | 没有外部联系人权限 | 应用未配置客户联系权限 | 检查应用权限配置 |
| 301002 | 无权限操作指定标签 | 标签非本应用创建 | 使用创建该标签的应用凭证 |
| 301021 | 标签名称已存在 | 标签/标签组名称重复 | 更换名称或查询已有标签 |

---

## 12. 参考文档

| 文档 | doc_id | URL |
|------|--------|-----|
| 管理企业标签 | 96320 | https://developer.work.weixin.qq.com/document/path/96320 |
| 编辑客户企业标签 | 92118 | https://developer.work.weixin.qq.com/document/path/92118 |
| 管理规则组标签 | 94882 | https://developer.work.weixin.qq.com/document/path/94882 |
| 标签变更通知 | 96304 | https://developer.work.weixin.qq.com/document/path/96304 |
| 全局错误码 | 96213 | https://developer.work.weixin.qq.com/document/path/96213 |


