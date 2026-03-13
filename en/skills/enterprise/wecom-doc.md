---
name: wecom-doc
description: |
  企业微信文档域 SKILL — 文档/表格/智能表格 CRUD、文档内容编辑/获取、表格内容管理、
  文档权限管理、收集表 CRUD、智能表格子表/视图/字段/记录操作、素材上传、回调事件
version: 1.0.0
domain: document
depends_on: wecom-core
doc_ids: [43883, 44293, 44378, 44380, 44543, 60079, 43939, 44589, 44590, 44592, 44593, 43941, 44606, 44607, 44608, 53864, 43942, 44610, 44611, 44612, 44613, 43019, 44621, 44622, 44623, 45066, 45068, 58863, 58864, 50761, 50763, 50764, 53106, 53107, 53108, 53109, 53110, 53111, 53112, 53113, 53114, 53115, 53116, 53117, 53118, 53119, 53120, 53121, 59536, 59537, 59538, 59539, 53863, 60593, 60594, 60595]
api_count: 40
callback_count: 6
triggers:
  - wecom doc
  - wecom document
  - 文档
  - 表格
  - 智能表格
  - 收集表
  - wedoc
  - docid
  - create_doc
  - doc_get_auth
  - smartsheet
  - 子表
  - 视图
  - 字段
  - 记录
  - spreadsheet
  - form
  - 文档权限
  - 编辑文档
prerequisite_skills:
  - wecom-core
---

# WeCom Doc SKILL (wecom-doc)

> 企业微信文档域 SKILL：覆盖文档/表格/智能表格全生命周期管理。包含文档 CRUD、内容编辑/获取、表格数据操作、权限管理、收集表 CRUD、智能表格子表/视图/字段/记录/编组操作、文档素材上传、外部数据接入、以及 6 种回调事件。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. Prerequisites

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 配置到「可调用应用」列表的应用 secret | 文档权限 |
| 第三方应用 | suite_access_token | 文档权限 |
| 代开发应用 | 需申请文档权限 | 文档权限 |

### 1.2 管理后台配置

1. **管理后台 → 应用管理 → 文档 → 可调用接口的应用** → 添加自建应用
2. **自建应用 → 「文档」权限** → 开启

> **核心限制**：自建/第三方应用**只能访问该应用创建的文档**。

### 1.3 高级功能账号

部分接口（如智能表格自动化）需要高级功能账号。通过 `wedoc/doc_pro_user` 系列接口管理。

---

## 2. Core Concepts

### 2.1 文档类型 (doc_type)

| 值 | 类型 | 说明 |
|----|------|------|
| 1 | 文档 | 富文本文档 |
| 3 | 表格 | 传统电子表格 |
| 4 | 收集表 | 问卷/表单 |
| 10 | 智能表格 | 数据库型表格（子表+视图+字段+记录） |

### 2.2 文档体系

```
企业微信文档体系
├── 文档 (doc_type=1)
│   └── 富文本内容编辑 / 获取
├── 表格 (doc_type=3)
│   └── 表格数据获取 / 行列信息 / 内容编辑
├── 收集表 (doc_type=4)
│   └── 创建 / 编辑 / 查询 / 统计 / 答案读取
└── 智能表格 (doc_type=10)
    ├── 子表 (sheet) — CRUD
    ├── 视图 (view) — CRUD
    ├── 字段 (field) — CRUD
    ├── 记录 (record) — CRUD
    └── 编组 (group) — CRUD
```

### 2.3 权限体系 (auth)

| auth 值 | 含义 |
|---------|------|
| 1 | 仅查看 |
| 2 | 可编辑 |
| 7 | 管理员（含创建者） |

### 2.4 查看规则

| 字段 | 说明 |
|------|------|
| enable_corp_internal | 是否允许企业内部访问 |
| corp_internal_auth | 企业内部默认权限（1=查看, 2=编辑） |
| enable_corp_external | 是否允许企业外部访问 |
| corp_external_auth | 外部默认权限 |
| ban_share_external | 是否禁止分享到企业外 |

### 2.5 安全设置

| 字段 | 说明 |
|------|------|
| enable_readonly_copy | 只读时是否允许复制 |
| enable_readonly_comment | 只读时是否允许评论 |
| watermark.margin_type | 水印密度：1=稀疏, 2=适中, 3=密集 |
| watermark.show_visitor_name | 显示访问者名称 |
| watermark.show_text | 显示自定义文字 |

---

## 3. API Quick Reference

### 3.1 文档管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| D1 | 新建文档 | POST | `wedoc/create_doc` |
| D2 | 获取文档基础信息 | POST | `wedoc/doc_info` |
| D3 | 重命名文档 | POST | `wedoc/rename_doc` |
| D4 | 删除文档 | POST | `wedoc/del_doc` |
| D5 | 分享文档 | POST | `wedoc/doc_share` |

### 3.2 文档内容

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| C1 | 编辑文档内容 | POST | `wedoc/document/edit` |
| C2 | 获取文档数据 | POST | `wedoc/document/get` |

### 3.3 表格内容

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| T1 | 获取表格数据 | POST | `wedoc/spreadsheet/get_sheet_properties` |
| T2 | 获取表格行列信息 | POST | `wedoc/spreadsheet/get_sheet_range_data` |
| T3 | 编辑表格内容 | POST | `wedoc/spreadsheet/batch_update` |

### 3.4 文档权限

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| P1 | 获取文档权限信息 | POST | `wedoc/doc_get_auth` |
| P2 | 修改文档查看规则 | POST | `wedoc/mod_doc_join_rule` |
| P3 | 修改文档通知范围及权限 | POST | `wedoc/mod_doc_member` |
| P4 | 修改文档安全设置 | POST | `wedoc/mod_doc_safty_setting` |
| P5 | 管理智能表格内容权限 | POST | `wedoc/smartsheet/mod_sheet_member` |

### 3.5 收集表

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| F1 | 创建收集表 | POST | `wedoc/create_form` |
| F2 | 编辑收集表 | POST | `wedoc/modify_form` |
| F3 | 获取收集表信息 | POST | `wedoc/get_form_info` |
| F4 | 收集表统计信息查询 | POST | `wedoc/get_form_statistic` |
| F5 | 读取收集表答案 | POST | `wedoc/get_form_answer` |

### 3.6 智能表格

| # | 接口 | 方法 | Endpoint | 对象 |
|---|------|------|----------|------|
| S1 | 添加子表 | POST | `wedoc/smartsheet/add_sheet` | 子表 |
| S2 | 更新子表 | POST | `wedoc/smartsheet/update_sheet` | 子表 |
| S3 | 删除子表 | POST | `wedoc/smartsheet/delete_sheet` | 子表 |
| S4 | 查询子表 | POST | `wedoc/smartsheet/get_sheet` | 子表 |
| S5 | 添加视图 | POST | `wedoc/smartsheet/add_view` | 视图 |
| S6 | 更新视图 | POST | `wedoc/smartsheet/update_view` | 视图 |
| S7 | 删除视图 | POST | `wedoc/smartsheet/delete_view` | 视图 |
| S8 | 查询视图 | POST | `wedoc/smartsheet/get_view` | 视图 |
| S9 | 添加字段 | POST | `wedoc/smartsheet/add_field` | 字段 |
| S10 | 更新字段 | POST | `wedoc/smartsheet/update_field` | 字段 |
| S11 | 删除字段 | POST | `wedoc/smartsheet/delete_field` | 字段 |
| S12 | 查询字段 | POST | `wedoc/smartsheet/get_field` | 字段 |
| S13 | 添加记录 | POST | `wedoc/smartsheet/add_record` | 记录 |
| S14 | 更新记录 | POST | `wedoc/smartsheet/update_record` | 记录 |
| S15 | 删除记录 | POST | `wedoc/smartsheet/delete_record` | 记录 |
| S16 | 查询记录 | POST | `wedoc/smartsheet/get_record` | 记录 |
| S17 | 添加编组 | POST | `wedoc/smartsheet/add_group` | 编组 |
| S18 | 更新编组 | POST | `wedoc/smartsheet/update_group` | 编组 |
| S19 | 删除编组 | POST | `wedoc/smartsheet/delete_group` | 编组 |
| S20 | 获取编组 | POST | `wedoc/smartsheet/get_group` | 编组 |

### 3.7 高级功能账号

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| A1 | 分配高级功能账号 | POST | `wedoc/doc_pro_user/set` |
| A2 | 取消高级功能账号 | POST | `wedoc/doc_pro_user/unset` |
| A3 | 获取高级功能账号列表 | POST | `wedoc/doc_pro_user/list` |

### 3.8 素材管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M1 | 上传文档图片 | POST (multipart) | `wedoc/upload_img` |

### 3.9 外部数据接入

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| E1 | 添加记录（外部数据） | POST | `wedoc/smartsheet/external/add_record` |
| E2 | 更新记录（外部数据） | POST | `wedoc/smartsheet/external/update_record` |

---

## 4. API Details — 核心接口

### D1. 新建文档

```
POST /cgi-bin/wedoc/create_doc?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| spaceid | 否 | string | 空间 ID（不填则创建到个人文档） |
| fatherid | 否 | string | 父目录 ID（不填则在空间根目录） |
| doc_type | 是 | int | 文档类型：1=文档, 3=表格, 10=智能表格 |
| doc_name | 是 | string | 文档名称 |
| admin_users | 否 | array[string] | 管理员 userid 列表 |

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| url | string | 文档在线访问 URL |
| docid | string | 文档 ID（后续操作的唯一标识） |

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "url": "https://doc.weixin.qq.com/xxxxx",
    "docid": "DOCID"
}
```

---

### D2. 获取文档基础信息

```
POST /cgi-bin/wedoc/doc_info?access_token=ACCESS_TOKEN
```

**请求参数**：`{"docid": "DOCID"}`

**返回参数**：包含 `doc_name`、`doc_type`、`create_time`、`modify_time`、`creator_userid` 等。

---

### P1. 获取文档权限信息

```
POST /cgi-bin/wedoc/doc_get_auth?access_token=ACCESS_TOKEN
```

**请求参数**：`{"docid": "DOCID"}`

**返回参数**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "access_rule": {
        "enable_corp_internal": true,
        "corp_internal_auth": 1,
        "enable_corp_external": true,
        "corp_external_auth": 1,
        "ban_share_external": false
    },
    "secure_setting": {
        "enable_readonly_copy": false,
        "watermark": {
            "margin_type": 2,
            "show_visitor_name": false,
            "show_text": false,
            "text": ""
        },
        "enable_readonly_comment": false
    },
    "doc_member_list": [
        {"type": 1, "userid": "USERID1", "auth": 7},
        {"type": 1, "tmp_external_userid": "TMP_EXTERNAL_USERID2", "auth": 1}
    ],
    "co_auth_list": [
        {"type": 2, "departmentid": 1, "auth": 1}
    ]
}
```

---

### S13. 添加记录（智能表格）

```
POST /cgi-bin/wedoc/smartsheet/add_record?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| docid | 是 | string | 文档 ID |
| sheet_id | 是 | string | 子表 ID |
| records | 是 | array | 记录数组 |
| records[].values | 是 | object | 字段值，key 为字段 ID |
| key_type | 否 | int | 0=字段ID(默认), 1=字段标题 |

**请求示例**：

```json
{
    "docid": "DOCID",
    "sheet_id": "SHEET_ID",
    "key_type": 0,
    "records": [
        {
            "values": {
                "fld_XXXXXX": [{"type": "text", "text": "示例文本"}],
                "fld_YYYYYY": [{"type": "number", "value": 42}]
            }
        }
    ]
}
```

**返回参数**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "records": [
        {"record_id": "rec_ZZZZZ"}
    ]
}
```

---

### F1. 创建收集表

```
POST /cgi-bin/wedoc/create_form?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| spaceid | 否 | string | 空间 ID |
| fatherid | 否 | string | 父目录 ID |
| form_info | 是 | object | 收集表信息 |
| form_info.form_title | 是 | string | 收集表标题 |
| form_info.form_desc | 否 | string | 收集表描述 |
| form_info.form_question | 是 | array | 问题列表 |
| admin_users | 否 | array | 管理员列表 |

---

## 5. Callbacks

### C1. doc_change_member — 修改文档成员事件

**触发条件**：文档成员变更（添加/移除/修改权限）

```xml
<xml>
    <ToUserName><![CDATA[corpid]]></ToUserName>
    <FromUserName><![CDATA[sys]]></FromUserName>
    <CreateTime>1569859200</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[doc_change]]></Event>
    <ChangeType><![CDATA[doc_change_member]]></ChangeType>
    <DocId><![CDATA[DOCID]]></DocId>
</xml>
```

### C2. doc_delete — 删除文档事件

**触发条件**：文档被删除

```xml
<xml>
    <ToUserName><![CDATA[corpid]]></ToUserName>
    <FromUserName><![CDATA[sys]]></FromUserName>
    <CreateTime>1569859200</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[doc_change]]></Event>
    <ChangeType><![CDATA[delete_doc]]></ChangeType>
    <DocId><![CDATA[DOCID]]></DocId>
</xml>
```

### C3. form_submit — 收集表完成事件

**触发条件**：用户提交收集表答案

### C4. form_delete — 删除收集表事件

### C5. form_modify_setting — 修改收集表设置事件

### C6. smartsheet_record_change — 智能表格记录变更事件

**触发条件**：智能表格记录增/删/改

### C7. smartsheet_field_change — 智能表格字段变更事件

**触发条件**：智能表格字段增/删/改

---

## 6. Workflows

### 6.1 创建文档 → 设置权限 → 分享

```
1. D1 新建文档 → 获得 docid + url
2. P3 修改文档通知范围及权限 → 添加成员/部门/标签
3. P2 修改文档查看规则 → 设置企业内/外访问权限
4. P4 修改文档安全设置 → 设置水印/复制限制
5. D5 分享文档 → 获取分享链接
```

### 6.2 智能表格数据操作

```
1. D1 新建智能表格 (doc_type=10) → docid
2. S1 添加子表 → sheet_id
3. S9 添加字段（定义列结构）
4. S13 添加记录（写入数据）
5. S5 添加视图（创建筛选/排序视图）
6. S16 查询记录（读取数据，支持过滤/排序/分页）
```

### 6.3 收集表工作流

```
1. F1 创建收集表 → docid
2. F2 编辑收集表（修改问题、设置）
3. 用户提交答案 → C3 回调通知
4. F4 查询统计信息（提交量/完成率）
5. F5 读取答案（分页遍历）
```

---

## 7. Code Templates

### 7.1 Python

```python
"""WeCom Document Client — 文档管理"""
from wecom_core import WeComClient


class DocClient:
    """企业微信文档管理客户端"""

    def __init__(self, client: WeComClient):
        self.client = client

    # ── 文档管理 ──

    def create_doc(
        self,
        doc_type: int,
        doc_name: str,
        spaceid: str | None = None,
        fatherid: str | None = None,
        admin_users: list[str] | None = None,
    ) -> dict:
        """D1: 新建文档/表格/智能表格，返回 {url, docid}"""
        body: dict = {"doc_type": doc_type, "doc_name": doc_name}
        if spaceid:
            body["spaceid"] = spaceid
        if fatherid:
            body["fatherid"] = fatherid
        if admin_users:
            body["admin_users"] = admin_users
        return self.client.post("/wedoc/create_doc", json=body)

    def get_doc_info(self, docid: str) -> dict:
        """D2: 获取文档基础信息"""
        return self.client.post("/wedoc/doc_info", json={"docid": docid})

    def rename_doc(self, docid: str, new_name: str) -> None:
        """D3: 重命名文档"""
        self.client.post("/wedoc/rename_doc", json={"docid": docid, "new_name": new_name})

    def delete_doc(self, docid: str) -> None:
        """D4: 删除文档"""
        self.client.post("/wedoc/del_doc", json={"docid": docid})

    def share_doc(self, docid: str) -> str:
        """D5: 分享文档，返回分享 URL"""
        resp = self.client.post("/wedoc/doc_share", json={"docid": docid})
        return resp.get("share_url", "")

    # ── 文档内容 ──

    def edit_doc_content(self, docid: str, requests: list[dict]) -> None:
        """C1: 编辑文档内容（批量操作）"""
        self.client.post("/wedoc/document/edit", json={"docid": docid, "requests": requests})

    def get_doc_content(self, docid: str) -> dict:
        """C2: 获取文档数据"""
        return self.client.post("/wedoc/document/get", json={"docid": docid})

    # ── 表格内容 ──

    def get_sheet_properties(self, docid: str) -> dict:
        """T1: 获取表格属性"""
        return self.client.post("/wedoc/spreadsheet/get_sheet_properties", json={"docid": docid})

    def get_sheet_range_data(self, docid: str, sheet_id: str, range_: str) -> dict:
        """T2: 获取表格指定范围数据"""
        return self.client.post(
            "/wedoc/spreadsheet/get_sheet_range_data",
            json={"docid": docid, "sheet_id": sheet_id, "range": range_},
        )

    def batch_update_sheet(self, docid: str, requests: list[dict]) -> None:
        """T3: 批量编辑表格内容"""
        self.client.post("/wedoc/spreadsheet/batch_update", json={"docid": docid, "requests": requests})

    # ── 文档权限 ──

    def get_doc_auth(self, docid: str) -> dict:
        """P1: 获取文档权限信息"""
        return self.client.post("/wedoc/doc_get_auth", json={"docid": docid})

    def mod_doc_join_rule(self, docid: str, access_rule: dict) -> None:
        """P2: 修改文档查看规则"""
        self.client.post("/wedoc/mod_doc_join_rule", json={"docid": docid, **access_rule})

    def mod_doc_member(self, docid: str, add_member_list: list[dict] | None = None,
                       del_member_list: list[dict] | None = None) -> None:
        """P3: 修改文档通知范围及权限"""
        body: dict = {"docid": docid}
        if add_member_list:
            body["add_member_list"] = add_member_list
        if del_member_list:
            body["del_member_list"] = del_member_list
        self.client.post("/wedoc/mod_doc_member", json=body)

    def mod_doc_safety_setting(self, docid: str, secure_setting: dict) -> None:
        """P4: 修改文档安全设置"""
        self.client.post("/wedoc/mod_doc_safty_setting", json={"docid": docid, **secure_setting})

    # ── 收集表 ──

    def create_form(self, form_info: dict, **kwargs) -> dict:
        """F1: 创建收集表"""
        body = {"form_info": form_info, **kwargs}
        return self.client.post("/wedoc/create_form", json=body)

    def modify_form(self, docid: str, form_info: dict) -> None:
        """F2: 编辑收集表"""
        self.client.post("/wedoc/modify_form", json={"docid": docid, "form_info": form_info})

    def get_form_info(self, docid: str) -> dict:
        """F3: 获取收集表信息"""
        return self.client.post("/wedoc/get_form_info", json={"docid": docid})

    def get_form_statistic(self, docid: str) -> dict:
        """F4: 收集表统计信息"""
        return self.client.post("/wedoc/get_form_statistic", json={"docid": docid})

    def get_form_answer(self, docid: str, offset: int = 0, limit: int = 100) -> dict:
        """F5: 读取收集表答案（分页）"""
        return self.client.post(
            "/wedoc/get_form_answer",
            json={"docid": docid, "offset": offset, "limit": limit},
        )

    # ── 智能表格 ──

    def smartsheet_add_sheet(self, docid: str, properties: dict) -> dict:
        """S1: 添加子表"""
        return self.client.post(
            "/wedoc/smartsheet/add_sheet",
            json={"docid": docid, "properties": properties},
        )

    def smartsheet_delete_sheet(self, docid: str, sheet_id: str) -> None:
        """S3: 删除子表"""
        self.client.post("/wedoc/smartsheet/delete_sheet", json={"docid": docid, "sheet_id": sheet_id})

    def smartsheet_get_sheet(self, docid: str) -> dict:
        """S4: 查询子表列表"""
        return self.client.post("/wedoc/smartsheet/get_sheet", json={"docid": docid})

    def smartsheet_add_field(self, docid: str, sheet_id: str, fields: list[dict]) -> dict:
        """S9: 添加字段"""
        return self.client.post(
            "/wedoc/smartsheet/add_field",
            json={"docid": docid, "sheet_id": sheet_id, "fields": fields},
        )

    def smartsheet_add_record(self, docid: str, sheet_id: str,
                               records: list[dict], key_type: int = 0) -> dict:
        """S13: 添加记录"""
        return self.client.post(
            "/wedoc/smartsheet/add_record",
            json={"docid": docid, "sheet_id": sheet_id, "records": records, "key_type": key_type},
        )

    def smartsheet_update_record(self, docid: str, sheet_id: str,
                                  records: list[dict], key_type: int = 0) -> dict:
        """S14: 更新记录"""
        return self.client.post(
            "/wedoc/smartsheet/update_record",
            json={"docid": docid, "sheet_id": sheet_id, "records": records, "key_type": key_type},
        )

    def smartsheet_delete_record(self, docid: str, sheet_id: str,
                                  record_ids: list[str]) -> None:
        """S15: 删除记录"""
        self.client.post(
            "/wedoc/smartsheet/delete_record",
            json={"docid": docid, "sheet_id": sheet_id, "record_ids": record_ids},
        )

    def smartsheet_get_record(self, docid: str, sheet_id: str,
                               offset: int = 0, limit: int = 100,
                               key_type: int = 0, **kwargs) -> dict:
        """S16: 查询记录（支持过滤/排序/分页）"""
        body: dict = {
            "docid": docid,
            "sheet_id": sheet_id,
            "offset": offset,
            "limit": limit,
            "key_type": key_type,
        }
        body.update(kwargs)
        return self.client.post("/wedoc/smartsheet/get_record", json=body)
```

### 7.2 TypeScript

```typescript
/** WeCom Document Client — 文档管理 */
import { WeComClient } from './wecom-core';

export class DocClient {
  constructor(private client: WeComClient) {}

  // ── 文档管理 ──

  async createDoc(params: {
    doc_type: 1 | 3 | 10;
    doc_name: string;
    spaceid?: string;
    fatherid?: string;
    admin_users?: string[];
  }): Promise<{ url: string; docid: string }> {
    return this.client.request('POST', '/wedoc/create_doc', params);
  }

  async getDocInfo(docid: string): Promise<Record<string, unknown>> {
    return this.client.request('POST', '/wedoc/doc_info', { docid });
  }

  async renameDoc(docid: string, newName: string): Promise<void> {
    await this.client.request('POST', '/wedoc/rename_doc', { docid, new_name: newName });
  }

  async deleteDoc(docid: string): Promise<void> {
    await this.client.request('POST', '/wedoc/del_doc', { docid });
  }

  async shareDoc(docid: string): Promise<string> {
    const resp = await this.client.request('POST', '/wedoc/doc_share', { docid });
    return (resp as any).share_url ?? '';
  }

  // ── 文档权限 ──

  async getDocAuth(docid: string): Promise<Record<string, unknown>> {
    return this.client.request('POST', '/wedoc/doc_get_auth', { docid });
  }

  async modDocMember(docid: string, addList?: object[], delList?: object[]): Promise<void> {
    const body: Record<string, unknown> = { docid };
    if (addList) body.add_member_list = addList;
    if (delList) body.del_member_list = delList;
    await this.client.request('POST', '/wedoc/mod_doc_member', body);
  }

  // ── 智能表格 ──

  async smartsheetAddRecord(docid: string, sheetId: string, records: object[], keyType = 0) {
    return this.client.request('POST', '/wedoc/smartsheet/add_record', {
      docid, sheet_id: sheetId, records, key_type: keyType,
    });
  }

  async smartsheetGetRecord(docid: string, sheetId: string, params?: {
    offset?: number; limit?: number; key_type?: number; filter?: object; sort?: object[];
  }) {
    return this.client.request('POST', '/wedoc/smartsheet/get_record', {
      docid, sheet_id: sheetId, ...params,
    });
  }

  async smartsheetUpdateRecord(docid: string, sheetId: string, records: object[], keyType = 0) {
    return this.client.request('POST', '/wedoc/smartsheet/update_record', {
      docid, sheet_id: sheetId, records, key_type: keyType,
    });
  }

  async smartsheetDeleteRecord(docid: string, sheetId: string, recordIds: string[]) {
    await this.client.request('POST', '/wedoc/smartsheet/delete_record', {
      docid, sheet_id: sheetId, record_ids: recordIds,
    });
  }

  // ── 收集表 ──

  async createForm(formInfo: object, opts?: { spaceid?: string; fatherid?: string }) {
    return this.client.request('POST', '/wedoc/create_form', { form_info: formInfo, ...opts });
  }

  async getFormAnswer(docid: string, offset = 0, limit = 100) {
    return this.client.request('POST', '/wedoc/get_form_answer', { docid, offset, limit });
  }
}
```

### 7.3 Go

```go
package wecom

// DocClient 文档管理客户端
type DocClient struct {
	Client *Client
}

func NewDocClient(client *Client) *DocClient {
	return &DocClient{Client: client}
}

// CreateDoc D1: 新建文档
func (c *DocClient) CreateDoc(docType int, docName string, opts map[string]interface{}) (map[string]interface{}, error) {
	body := map[string]interface{}{
		"doc_type": docType,
		"doc_name": docName,
	}
	for k, v := range opts {
		body[k] = v
	}
	return c.Client.Request("POST", "/wedoc/create_doc", body)
}

// GetDocAuth P1: 获取文档权限
func (c *DocClient) GetDocAuth(docid string) (map[string]interface{}, error) {
	return c.Client.Request("POST", "/wedoc/doc_get_auth", map[string]interface{}{"docid": docid})
}

// SmartsheetAddRecord S13: 添加智能表格记录
func (c *DocClient) SmartsheetAddRecord(docid, sheetID string, records []map[string]interface{}, keyType int) (map[string]interface{}, error) {
	return c.Client.Request("POST", "/wedoc/smartsheet/add_record", map[string]interface{}{
		"docid":    docid,
		"sheet_id": sheetID,
		"records":  records,
		"key_type": keyType,
	})
}

// SmartsheetGetRecord S16: 查询智能表格记录
func (c *DocClient) SmartsheetGetRecord(docid, sheetID string, offset, limit, keyType int) (map[string]interface{}, error) {
	return c.Client.Request("POST", "/wedoc/smartsheet/get_record", map[string]interface{}{
		"docid":    docid,
		"sheet_id": sheetID,
		"offset":   offset,
		"limit":    limit,
		"key_type": keyType,
	})
}
```

---


### 7.4 Java 示例

```java
public class WecomDocService {
    private final WeComClient client;

    public WecomDocService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-doc 相关 API
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
class WecomDocService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-doc 相关 API
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

## 8. Test Templates

```python
"""Tests for DocClient"""
import pytest
from unittest.mock import patch


@pytest.fixture
def client():
    from wecom_core import WeComClient
    with patch.object(WeComClient, '_refresh_token'):
        c = WeComClient("test_corp", "test_secret")
        c._token = "mock_token"
        c._token_expires_at = float('inf')
        return c

@pytest.fixture
def doc_client(client):
    from wecom_doc import DocClient
    return DocClient(client)


class TestCreateDoc:
    def test_创建智能表格(self, doc_client):
        with patch.object(doc_client.client, "post", return_value={
            "errcode": 0, "url": "https://doc.weixin.qq.com/xxx", "docid": "DOC001",
        }):
            result = doc_client.create_doc(doc_type=10, doc_name="测试智能表格")
            assert result["docid"] == "DOC001"
            assert "url" in result


class TestSmartsheet:
    def test_添加记录(self, doc_client):
        with patch.object(doc_client.client, "post", return_value={
            "errcode": 0, "records": [{"record_id": "rec_001"}],
        }):
            result = doc_client.smartsheet_add_record(
                docid="DOC001", sheet_id="SHEET001",
                records=[{"values": {"fld_001": [{"type": "text", "text": "hello"}]}}],
            )
            assert result["records"][0]["record_id"] == "rec_001"

    def test_查询记录(self, doc_client):
        with patch.object(doc_client.client, "post", return_value={
            "errcode": 0, "records": [{"record_id": "rec_001", "values": {}}],
            "has_more": False, "total": 1,
        }):
            result = doc_client.smartsheet_get_record(docid="DOC001", sheet_id="SHEET001")
            assert result["total"] == 1


class TestDocAuth:
    def test_获取权限(self, doc_client):
        with patch.object(doc_client.client, "post", return_value={
            "errcode": 0, "access_rule": {"enable_corp_internal": True},
        }):
            result = doc_client.get_doc_auth("DOC001")
            assert result["access_rule"]["enable_corp_internal"] is True
```

---

## 9. Code Review Checklist

| # | 检查项 | 严重度 |
|---|--------|--------|
| R1 | 所有接口路径是否以 `/wedoc/` 开头（非 `/cgi-bin/wedoc/`，基类已含前缀） | HIGH |
| R2 | 智能表格操作是否区分了 `docid` 与 `sheet_id` | HIGH |
| R3 | 记录值是否使用正确的 typed value 格式（`[{type, text/value}]`） | CRITICAL |
| R4 | `key_type` 参数是否正确（0=字段ID, 1=字段标题） | HIGH |
| R5 | 收集表和文档是否使用不同的创建接口（`create_form` vs `create_doc`） | HIGH |
| R6 | 是否意识到**只能访问该应用创建的文档** | CRITICAL |
| R7 | 权限修改接口拼写是否正确（`mod_doc_safty_setting` 含 typo，官方如此） | MEDIUM |
| R8 | 分页查询是否正确使用 `offset` + `limit` | MEDIUM |

---

## 10. Gotcha Guide

### G1. 只能访问应用自己创建的文档

自建/第三方应用通过 API **只能操作该应用创建的文档**。用户手动创建的文档无法通过 API 访问。这是最大的限制。

### G2. 智能表格字段值格式特殊

智能表格记录的字段值不是简单的字符串/数字，而是**类型化数组**：

```json
{"fld_xxx": [{"type": "text", "text": "hello"}]}
{"fld_xxx": [{"type": "number", "value": 42}]}
{"fld_xxx": [{"type": "url", "text": "Google", "link": "https://google.com"}]}
```

不同字段类型需要不同的 value 结构，写错会导致静默忽略或错误。

### G3. mod_doc_safty_setting 拼写

官方接口路径是 `mod_doc_safty_setting`（`safty` 而非 `safety`），这是官方的拼写，不要"修正"它。

### G4. 文档类型 4（收集表）用专用接口

收集表虽然也是文档的一种（doc_type=4），但不能用 `create_doc` 创建，需要用专用的 `create_form` 接口。

### G5. 智能表格 key_type 影响字段引用方式

- `key_type=0`（默认）：使用字段 ID（`fld_XXXXXX`）引用字段
- `key_type=1`：使用字段标题引用字段

生产环境建议使用 `key_type=0`（字段 ID），因为标题可能被用户修改。

### G6. 外部数据接入有独立接口

通过 `wedoc/smartsheet/external/add_record` 接入的外部数据与普通记录的处理方式不同，有独立的权限控制和数据标识。

### G7. 查询记录支持过滤和排序

`get_record` 支持 `filter` 和 `sort` 参数进行服务端过滤和排序，避免拉取全量数据后本地过滤。

### G8. 文档图片上传用专用接口

文档内嵌图片需要用 `wedoc/upload_img`（multipart 上传），返回的图片链接仅限在文档内使用，与 `wecom-media` 的素材管理互不相通。

---

## 11. References

| doc_id | 标题 | 说明 |
|--------|------|------|
| 43883 | 概述 | 文档域总览 + 可调用应用配置 |
| 43939 (97460) | 新建文档 | 文档/表格/智能表格创建 |
| 43941 (97461) | 获取文档权限 | 查看规则+安全设置+成员权限 |
| 44293 | 编辑文档内容 | 富文本编辑操作 |
| 44378 | 获取文档数据 | 文档内容获取 |
| 44380 | 获取表格数据 | 表格属性获取 |
| 53106-53121 | 智能表格 CRUD | 子表/视图/字段/记录 |
| 59536-59539 | 智能表格编组 | 编组 CRUD |
| 43942 | 创建收集表 | 收集表专用创建接口 |
| 60593-60595 | 外部数据接入 | 外部数据→智能表格 |

**依赖 SKILL**：`wecom-core`（Token 管理、错误处理）


