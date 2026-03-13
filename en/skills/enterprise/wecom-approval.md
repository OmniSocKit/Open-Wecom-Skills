---
name: wecom-approval
description: 企业微信 OA 审批域 SKILL — 模板管理、提交申请、审批单查询、状态回调
version: 1.0.0
triggers:
  - 审批
  - OA审批
  - approval
  - 审批模板
  - 审批申请
  - 审批单
  - applyevent
  - getapprovaldetail
  - getapprovalinfo
  - gettemplatedetail
  - sp_no
  - 审批流程
  - template_id
  - apply_data
  - 301025
prerequisite_skills:
  - wecom-core
domain: approval
api_count: 8
callback_count: 2
---

# WeCom OA · Approval SKILL

> 覆盖企业微信「OA 审批」全域：审批模板 CRUD、提交审批申请、批量获取审批单号、获取审批详情、复制/推广模板、自建应用审批引擎查询，以及 2 种审批状态变更回调事件。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 审批应用 secret 或已配置到「可调用应用」列表的自建应用 secret | 审批数据权限 |
| 第三方应用 | suite_access_token | 审批权限（应用详情内开启） |
| 代开发应用 | 需申请审批权限 | 管理员授权 |

> **2023-12-01 变更**：不再支持通过系统应用 secret 调用审批接口，存量企业暂不受影响。

### 1.2 管理后台配置

1. **管理后台 → 应用管理 → 审批 → API → 可调用应用** → 将自建应用添加到列表
2. **审批 → API → 审批数据权限** → 授权应用允许提交/查询审批单据
3. **审批 → API → 接收事件服务器** → 配置回调 URL / Token / EncodingAESKey，勾选需要回调的审批模板
4. **自建应用 → 设置 API 接收** → 开启 `open_approval_change` 事件（审批流程引擎场景）

### 1.3 两套审批体系

| 体系 | 说明 | 回调事件 | 适用场景 |
|-----|------|---------|---------|
| **审批应用** | 围绕企业微信自带「审批应用」的开放 | `sys_approval_change` | 标准 OA 审批 |
| **审批流程引擎** | 在自建/第三方应用中增加审批流程功能 | `open_approval_change` | 自建应用内嵌审批 |

> 两套体系互不影响，使用不同的接口和回调事件。

---

## 2. 核心概念

### 2.1 审批状态 (sp_status)

| 值 | 含义 | 值 | 含义 |
|----|------|----|------|
| 1 | 审批中 | 6 | 通过后撤销 |
| 2 | 已通过 | 7 | 已删除 |
| 3 | 已驳回 | 10 | 已支付 |
| 4 | 已撤销 | | |

### 2.2 审批方式 (approverattr)

| 值 | 含义 | 说明 |
|----|------|------|
| 1 | 或签 | 一人审批即可 |
| 2 | 会签 | 所有人须审批 |
| 3 | 依次审批 | 按顺序逐一审批 |

### 2.3 控件类型体系 (control)

| 控件 | control 值 | value 字段 | 说明 |
|------|-----------|-----------|------|
| 文本 | Text | `text` | 单行文本 |
| 多行文本 | Textarea | `text` | 多行文本 |
| 数字 | Number | `new_number` | 数字（字符串） |
| 金额 | Money | `new_money` | 金额（字符串） |
| 日期 | Date | `date` | type=day/hour |
| 时长 | DateRange | `date_range` | type=halfday/hour |
| 单选/多选 | Selector | `selector` | type=single/multi |
| 成员 | Contact | `members` | userid + name |
| 部门 | Contact | `departments` | openapi_id + name |
| 说明文字 | Tips | (空) | 不显示在详情中 |
| 附件 | File | `files` | file_id，全局最多 6 个 |
| 明细 | Table | `children` | 嵌套子控件 |
| 位置 | Location | `location` | 经纬度+地址 |
| 请假 | Vacation | `vacation` | 关联假期管理 |
| 外出/出差/加班 | Attendance | `attendance` | 假勤控件 |
| 关联审批单 | RelatedApproval | `related_approval` | sp_no |
| 公式 | Formula | `formula` | 自动计算 |
| 补卡 | PunchCorrection | `punch_correction` | 仅详情返回 |

> **约束**：一个模板中只能有一类假勤控件（Vacation 或 Attendance），不可混用。

### 2.4 filters 筛选条件 (批量获取审批单号)

| key | 说明 | 示例值 |
|-----|------|--------|
| template_id | 模板 ID | `ZLqk8pcs...` |
| creator | 申请人 userid | `WuJunJie` |
| department | 提单者所在部门 ID | `1` |
| sp_status | 审批状态 | `1` (审批中) |
| record_type | 审批单类型 | 1=请假, 2=补卡, 3=出差, 4=外出, 5=加班, 6=调班, 7=会议室预定, 8=退款, 9=红包报销 |

---

## 3. API 速查表

| # | 接口 | 方法 | 路径 | 频率 |
|---|------|------|------|------|
| A1 | 获取审批模板详情 | POST | `oa/gettemplatedetail` | 600/min |
| A2 | 提交审批申请 | POST | `oa/applyevent` | 600/min |
| A3 | 批量获取审批单号 | POST | `oa/getapprovalinfo` | 600/min |
| A4 | 获取审批申请详情 | POST | `oa/getapprovaldetail` | 600/min |
| A5 | 创建审批模板 | POST | `oa/approval/create_template` | 600/min |
| A6 | 更新审批模板 | POST | `oa/approval/update_template` | 600/min |
| A7 | 复制/推广审批模板 | POST | `oa/approval/copytemplate` | 600/min |
| A8 | 查询自建应用审批单状态 | POST | `corp/getopenapprovaldata` | 600/min |

---

## 4. API 详情

### A1 获取审批模板详情

```
POST oa/gettemplatedetail
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| template_id | 是 | string | 审批模板 ID |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "template_names": [{"text": "费用报销", "lang": "zh_CN"}],
  "template_content": {
    "controls": [
      {
        "property": {
          "control": "Text",
          "id": "Text-15111111111",
          "title": [{"text": "报销事由", "lang": "zh_CN"}],
          "placeholder": [{"text": "请输入", "lang": "zh_CN"}],
          "require": 1,
          "un_print": 0
        }
      }
    ]
  }
}
```

> **用途**：先调用此接口了解模板控件构成和控件 ID，再用 A2 提交审批申请。

---

### A2 提交审批申请

```
POST oa/applyevent
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| creator_userid | 是 | string | 申请人 userid（须在应用可见范围内） |
| template_id | 是 | string | 审批模板 ID |
| use_template_approver | 是 | int | 0=自定义审批流, 1=使用模板默认流程 |
| choose_department | 否 | int | 提单者选择的提单部门 ID |
| approver | 否 | array | 审批流程信息（use_template_approver=0 时必填） |
| notifyer | 否 | array | 抄送人 userid 列表 |
| notify_type | 否 | int | 抄送方式：1=提单时, 2=审批通过后, 3=提单和审批通过后 |
| apply_data | 是 | object | 审批申请数据 |
| summary_list | 是 | array | 摘要信息（3~5 行） |

**approver 结构** (use_template_approver=0 时)

```json
{
  "approver": [
    {
      "attr": 2,
      "userid": ["WuJunJie", "WangXiaoMing"]
    },
    {
      "attr": 1,
      "userid": ["LiuXiaoGang"]
    }
  ]
}
```

> `attr`: 1=或签, 2=会签

**apply_data 结构**

```json
{
  "apply_data": {
    "contents": [
      {
        "control": "Text",
        "id": "Text-15111111111",
        "value": {"text": "出差报销"}
      },
      {
        "control": "Number",
        "id": "Number-15111111112",
        "value": {"new_number": "700"}
      }
    ]
  }
}
```

**summary_list 结构**

```json
{
  "summary_list": [
    {
      "summary_info": [{"text": "摘要第1行", "lang": "zh_CN"}]
    },
    {
      "summary_info": [{"text": "摘要第2行", "lang": "zh_CN"}]
    }
  ]
}
```

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "sp_no": "201909270001"
}
```

> **约束**：必填控件必须有值，否则返回 301025。

---

### A3 批量获取审批单号

```
POST oa/getapprovalinfo
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| starttime | 是 | int | 查询起始时间戳 |
| endtime | 是 | int | 查询结束时间戳 |
| new_cursor | 否 | string | 分页游标（首次为空） |
| size | 是 | int | 每次请求数量，最大 100 |
| filters | 否 | array | 筛选条件（见 2.4） |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "sp_no_list": ["201909270001", "201909270002"],
  "new_next_cursor": "xxxxxxx"
}
```

> **约束**：starttime → endtime 跨度不超过 31 天。每次最多 100 条。旧字段 `cursor`/`next_cursor` 待废弃，请用 `new_cursor`/`new_next_cursor`。

---

### A4 获取审批申请详情

```
POST oa/getapprovaldetail
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| sp_no | 是 | string | 审批单号 |

**响应核心字段 (info)**

| Field | Type | Description |
|------|------|------|
| sp_no | string | 审批单号 |
| sp_name | string | 审批模板名称 |
| sp_status | int | 审批状态（见 2.1） |
| template_id | string | 模板 ID |
| apply_time | int | 申请时间戳 |
| applyer | object | 申请人信息 (userid, partyid) |
| sp_record | array | 审批流程记录（**数组**） |
| notifyer | array | 抄送人信息 |
| apply_data | object | 审批申请数据（与提交时结构一致） |
| comments | array | 审批评论 |

**sp_record 结构** (数组中每个审批节点)

```json
{
  "sp_status": 1,
  "approverattr": 1,
  "details": [
    {
      "approver": {"userid": "WuJunJie"},
      "speech": "同意",
      "sp_status": 2,
      "sptime": 1569859200,
      "media_id": []
    }
  ]
}
```

> **注意**：`sp_record` 是数组类型，某些第三方 SDK 曾错误地将其定义为对象。

---

### A5 创建审批模板

```
POST oa/approval/create_template
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| template_name | 是 | array | 模板名称 [{text, lang}] |
| template_content | 是 | object | 模板内容（控件定义） |

**template_content 中的 controls 结构**

```json
{
  "template_content": {
    "controls": [
      {
        "property": {
          "control": "Text",
          "id": "Text-01",
          "title": [{"text": "事由", "lang": "zh_CN"}],
          "placeholder": [{"text": "请填写", "lang": "zh_CN"}],
          "require": 1,
          "un_print": 0
        },
        "config": {}
      }
    ]
  }
}
```

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "template_id": "ZLqk8pcsAoXZ1eY56vpAgfX28MPdYU3ayMaSPHaaa"
}
```

> 创建后管理后台及审批应用内自动生成对应模板，并生效默认流程和规则。

---

### A6 更新审批模板

```
POST oa/approval/update_template
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| template_id | 是 | string | 要更新的模板 ID |
| template_name | 否 | array | 新模板名称 |
| template_content | 否 | object | 新模板内容 |

**响应**

```json
{"errcode": 0, "errmsg": "ok"}
```

> 更新后已配置的审批流程和规则不变，仅更新模板内容。

---

### A7 复制/推广审批模板

```
POST oa/approval/copytemplate
```

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| open_template_id | 是 | string | 第三方应用的模板 ID |

> 主要用于第三方服务商将审批模板复制到授权企业中。需使用 `provider_access_token`。

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "template_id": "企业内模板ID"
}
```

---

### A8 查询自建应用审批单状态

```
POST corp/getopenapprovaldata
```

> 此接口属于「审批流程引擎」体系，用于查询自建应用内发起的审批单当前状态。

**请求参数**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| thirdNo | 是 | string | 开发者自定义的审批单号 |

**响应**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "data": {
    "ThirdNo": "thirdNo_xxx",
    "OpenTemplateId": "template_xxx",
    "OpenSpName": "报销审批",
    "OpenSpstatus": 1,
    "ApplyTime": 1569859200,
    "ApplyUserid": "WuJunJie",
    "ApplyUsername": "吴俊杰",
    "ApprovalNodes": {
      "ApprovalNode": [
        {
          "NodeStatus": 1,
          "NodeAttr": 1,
          "NodeType": 1,
          "Items": {
            "Item": [
              {
                "ItemName": "审批人",
                "ItemUserid": "LiuXiaoGang",
                "ItemStatus": 1,
                "ItemSpeech": "",
                "ItemOpTime": 0
              }
            ]
          }
        }
      ]
    }
  }
}
```

---

## 5. 回调事件

### C1 sys_approval_change — 审批应用状态变化

**触发条件**：审批应用内审批单状态变化（催办、撤销、同意、驳回、转审、添加备注等）

**配置位置**：管理后台 → 应用管理 → 审批 → API → 接收事件服务器

**回调 XML**

```xml
<xml>
  <ToUserName><![CDATA[wwcorpid]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1569859200</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[sys_approval_change]]></Event>
  <AgentID>3010040</AgentID>
  <ApprovalInfo>
    <SpNo>201909270001</SpNo>
    <SpName><![CDATA[费用报销]]></SpName>
    <SpStatus>2</SpStatus>
    <TemplateId><![CDATA[ZLqk8pcsAoXZ1eY56vpAgfX28MPdYU3ayMaSPHaaa]]></TemplateId>
    <ApplyTime>1569859200</ApplyTime>
    <Applyer>
      <UserId><![CDATA[WuJunJie]]></UserId>
      <Party><![CDATA[1]]></Party>
    </Applyer>
    <SpRecord>
      <SpStatus>2</SpStatus>
      <ApproverAttr>1</ApproverAttr>
      <Details>
        <Approver>
          <UserId><![CDATA[LiuXiaoGang]]></UserId>
        </Approver>
        <Speech><![CDATA[同意]]></Speech>
        <SpStatus>2</SpStatus>
        <SpTime>1569859300</SpTime>
      </Details>
    </SpRecord>
    <Notifyer>
      <UserId><![CDATA[WangXiaoMing]]></UserId>
    </Notifyer>
    <StatuChangeEvent>2</StatuChangeEvent>
  </ApprovalInfo>
</xml>
```

**StatuChangeEvent 值**

| 值 | 含义 |
|----|------|
| 1 | 提交 |
| 2 | 审批通过 |
| 3 | 驳回 |
| 4 | 撤销 |
| 6 | 通过后撤销 |
| 7 | 已删除 |
| 8 | 通过后支付 |
| 10 | 已支付 |

---

### C2 open_approval_change — 自建应用审批状态变化

**触发条件**：自建应用通过审批流程引擎发起的审批单状态变化

**配置位置**：管理后台 → 自建应用 → 设置 API 接收 → 开启审批状态通知事件

**回调 XML**

```xml
<xml>
  <ToUserName><![CDATA[wwcorpid]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1569859200</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[open_approval_change]]></Event>
  <AgentID>1000002</AgentID>
  <ApprovalInfo>
    <ThirdNo><![CDATA[thirdNo_xxx]]></ThirdNo>
    <OpenSpName><![CDATA[采购审批]]></OpenSpName>
    <OpenTemplateId><![CDATA[template_xxx]]></OpenTemplateId>
    <OpenSpStatus>2</OpenSpStatus>
    <ApplyTime>1569859200</ApplyTime>
    <ApplyUserid><![CDATA[WuJunJie]]></ApplyUserid>
    <ApplyUserParty><![CDATA[1]]></ApplyUserParty>
    <ApplyUserImage><![CDATA[http://...]]></ApplyUserImage>
    <ApprovalNodes>
      <ApprovalNode>
        <NodeStatus>2</NodeStatus>
        <NodeAttr>1</NodeAttr>
        <NodeType>1</NodeType>
        <Items>
          <Item>
            <ItemName><![CDATA[审批人]]></ItemName>
            <ItemUserid><![CDATA[LiuXiaoGang]]></ItemUserid>
            <ItemStatus>2</ItemStatus>
            <ItemSpeech><![CDATA[同意]]></ItemSpeech>
            <ItemOpTime>1569859300</ItemOpTime>
          </Item>
        </Items>
      </ApprovalNode>
    </ApprovalNodes>
  </ApprovalInfo>
</xml>
```

> **重要差异**：`open_approval_change` 使用 `ThirdNo`（开发者自定义单号），而 `sys_approval_change` 使用 `SpNo`（审批系统单号）。

---

## 6. 典型工作流

### W1 标准审批流 (审批应用)

```
管理员创建模板 → A1 获取模板详情 → A2 提交审批申请 → 等待审批
    → C1 回调通知状态变化 → A4 获取审批详情（可选）
```

### W2 批量查询审批数据

```
A3 批量获取审批单号 (分页遍历) → 遍历 sp_no_list → A4 获取每条审批详情
```

### W3 第三方应用推广模板

```
A5 创建审批模板 → 获取 template_id → A7 复制模板到授权企业 → 企业内使用
```

### W4 自建应用审批流程引擎

```
JS-SDK 发起审批 (ww.thirdPartyOpenPage) → C2 回调通知状态变化
    → A8 查询自建应用审批单状态（可选）
```

---

## 7. 代码模板

### 7.1 Python

```python
"""WeCom Approval Client — 审批管理"""
from wecom_core import WeComClient

class ApprovalClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── A1 获取审批模板详情 ──
    def get_template_detail(self, template_id: str) -> dict:
        """获取审批模板详情，了解控件构成和 ID"""
        resp = self.client.post(
            "oa/gettemplatedetail",
            json={"template_id": template_id}
        )
        return resp

    # ── A2 提交审批申请 ──
    def submit_approval(
        self,
        creator_userid: str,
        template_id: str,
        apply_data: dict,
        summary_list: list,
        use_template_approver: int = 1,
        approver: list | None = None,
        notifyer: list[str] | None = None,
        notify_type: int | None = None,
        choose_department: int | None = None,
    ) -> str:
        """代员工提交审批申请，返回 sp_no"""
        body: dict = {
            "creator_userid": creator_userid,
            "template_id": template_id,
            "use_template_approver": use_template_approver,
            "apply_data": apply_data,
            "summary_list": summary_list,
        }
        if approver is not None:
            body["approver"] = approver
        if notifyer is not None:
            body["notifyer"] = notifyer
        if notify_type is not None:
            body["notify_type"] = notify_type
        if choose_department is not None:
            body["choose_department"] = choose_department
        resp = self.client.post("oa/applyevent", json=body)
        return resp["sp_no"]

    # ── A3 批量获取审批单号 ──
    def list_approval_nos(
        self,
        starttime: int,
        endtime: int,
        size: int = 100,
        filters: list[dict] | None = None,
    ) -> list[str]:
        """批量获取审批单号，自动分页遍历"""
        all_nos: list[str] = []
        cursor = ""
        while True:
            body: dict = {
                "starttime": str(starttime),
                "endtime": str(endtime),
                "new_cursor": cursor,
                "size": size,
            }
            if filters:
                body["filters"] = filters
            resp = self.client.post("oa/getapprovalinfo", json=body)
            nos = resp.get("sp_no_list", [])
            all_nos.extend(nos)
            cursor = resp.get("new_next_cursor", "")
            if not cursor or len(nos) < size:
                break
        return all_nos

    # ── A4 获取审批申请详情 ──
    def get_approval_detail(self, sp_no: str) -> dict:
        """获取单条审批单详情"""
        resp = self.client.post(
            "oa/getapprovaldetail",
            json={"sp_no": sp_no}
        )
        return resp.get("info", {})

    # ── A5 创建审批模板 ──
    def create_template(
        self,
        template_name: list[dict],
        template_content: dict,
    ) -> str:
        """创建审批模板，返回 template_id"""
        body = {
            "template_name": template_name,
            "template_content": template_content,
        }
        resp = self.client.post("oa/approval/create_template", json=body)
        return resp["template_id"]

    # ── A6 更新审批模板 ──
    def update_template(self, template_id: str, **kwargs) -> None:
        """更新审批模板，仅传需要更新的字段"""
        body: dict = {"template_id": template_id}
        body.update(kwargs)
        self.client.post("oa/approval/update_template", json=body)

    # ── A7 复制/推广审批模板 ──
    def copy_template(self, open_template_id: str) -> str:
        """复制第三方模板到企业，返回企业内 template_id"""
        resp = self.client.post(
            "oa/approval/copytemplate",
            json={"open_template_id": open_template_id}
        )
        return resp["template_id"]

    # ── A8 查询自建应用审批单状态 ──
    def get_open_approval_data(self, third_no: str) -> dict:
        """查询自建应用审批流程引擎的审批单状态"""
        resp = self.client.post(
            "corp/getopenapprovaldata",
            json={"thirdNo": third_no}
        )
        return resp.get("data", {})


# ── 辅助：构造 apply_data ──
def build_apply_data(controls: list[tuple[str, str, dict]]) -> dict:
    """
    构造 apply_data 结构。
    controls: [(control_type, control_id, value_dict), ...]
    示例: [("Text", "Text-001", {"text": "出差报销"})]
    """
    return {
        "contents": [
            {"control": ctrl, "id": cid, "value": val}
            for ctrl, cid, val in controls
        ]
    }


def build_summary(lines: list[str], lang: str = "zh_CN") -> list[dict]:
    """构造 summary_list"""
    return [
        {"summary_info": [{"text": line, "lang": lang}]}
        for line in lines
    ]
```

### 7.2 TypeScript

```typescript
/** WeCom Approval Client — 审批管理 */
import { WeComClient } from './wecom-core';

interface ApprovalControl {
  control: string;
  id: string;
  value: Record<string, unknown>;
}

interface ApplyData {
  contents: ApprovalControl[];
}

interface SummaryItem {
  summary_info: Array<{ text: string; lang: string }>;
}

interface SubmitApprovalRequest {
  creator_userid: string;
  template_id: string;
  use_template_approver: number;
  apply_data: ApplyData;
  summary_list: SummaryItem[];
  approver?: Array<{ attr: number; userid: string[] }>;
  notifyer?: string[];
  notify_type?: number;
  choose_department?: number;
}

interface ApprovalFilter {
  key: string;
  value: string;
}

interface SpRecord {
  sp_status: number;
  approverattr: number;
  details: Array<{
    approver: { userid: string };
    speech: string;
    sp_status: number;
    sptime: number;
    media_id: string[];
  }>;
}

interface ApprovalDetail {
  sp_no: string;
  sp_name: string;
  sp_status: number;
  template_id: string;
  apply_time: number;
  applyer: { userid: string; partyid: string };
  sp_record: SpRecord[];
  notifyer: Array<{ userid: string }>;
  apply_data: ApplyData;
  comments: Array<{
    commentUserInfo: { userid: string };
    commenttime: number;
    commentcontent: string;
  }>;
}

export class ApprovalClient {
  constructor(private client: WeComClient) {}

  /** A1 获取审批模板详情 */
  async getTemplateDetail(templateId: string): Promise<Record<string, unknown>> {
    return this.client.post('oa/gettemplatedetail', {
      template_id: templateId,
    });
  }

  /** A2 提交审批申请 */
  async submitApproval(req: SubmitApprovalRequest): Promise<string> {
    const resp = await this.client.post('oa/applyevent', req);
    return resp.sp_no;
  }

  /** A3 批量获取审批单号（自动分页） */
  async listApprovalNos(
    starttime: number,
    endtime: number,
    filters?: ApprovalFilter[],
    size = 100,
  ): Promise<string[]> {
    const allNos: string[] = [];
    let cursor = '';
    do {
      const body: Record<string, unknown> = {
        starttime: String(starttime),
        endtime: String(endtime),
        new_cursor: cursor,
        size,
      };
      if (filters) body.filters = filters;
      const resp = await this.client.post('oa/getapprovalinfo', body);
      const nos: string[] = resp.sp_no_list || [];
      allNos.push(...nos);
      cursor = resp.new_next_cursor || '';
    } while (cursor);
    return allNos;
  }

  /** A4 获取审批申请详情 */
  async getApprovalDetail(spNo: string): Promise<ApprovalDetail> {
    const resp = await this.client.post('oa/getapprovaldetail', {
      sp_no: spNo,
    });
    return resp.info;
  }

  /** A5 创建审批模板 */
  async createTemplate(
    templateName: Array<{ text: string; lang: string }>,
    templateContent: Record<string, unknown>,
  ): Promise<string> {
    const resp = await this.client.post('oa/approval/create_template', {
      template_name: templateName,
      template_content: templateContent,
    });
    return resp.template_id;
  }

  /** A6 更新审批模板 */
  async updateTemplate(
    templateId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    await this.client.post('oa/approval/update_template', {
      template_id: templateId,
      ...updates,
    });
  }

  /** A7 复制/推广审批模板 */
  async copyTemplate(openTemplateId: string): Promise<string> {
    const resp = await this.client.post('oa/approval/copytemplate', {
      open_template_id: openTemplateId,
    });
    return resp.template_id;
  }

  /** A8 查询自建应用审批单状态 */
  async getOpenApprovalData(thirdNo: string): Promise<Record<string, unknown>> {
    const resp = await this.client.post('corp/getopenapprovaldata', {
      thirdNo,
    });
    return resp.data;
  }
}

/** 构造 apply_data */
export function buildApplyData(
  controls: Array<[string, string, Record<string, unknown>]>,
): ApplyData {
  return {
    contents: controls.map(([control, id, value]) => ({ control, id, value })),
  };
}

/** 构造 summary_list */
export function buildSummary(
  lines: string[],
  lang = 'zh_CN',
): SummaryItem[] {
  return lines.map((text) => ({
    summary_info: [{ text, lang }],
  }));
}
```

### 7.3 Go

```go
package approval

import (
	"context"
	"fmt"
	"strconv"

	wecom "your-module/wecom-core"
)

// ApprovalClient 审批管理客户端
type ApprovalClient struct {
	client *wecom.WeComClient
}

func NewApprovalClient(c *wecom.WeComClient) *ApprovalClient {
	return &ApprovalClient{client: c}
}

// ── 通用响应 ──

type BaseResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// ── A1 获取审批模板详情 ──

type TemplateDetailResp struct {
	BaseResp
	TemplateNames   []LangText      `json:"template_names"`
	TemplateContent TemplateContent  `json:"template_content"`
}

type LangText struct {
	Text string `json:"text"`
	Lang string `json:"lang"`
}

type TemplateContent struct {
	Controls []ControlProperty `json:"controls"`
}

type ControlProperty struct {
	Property struct {
		Control     string     `json:"control"`
		ID          string     `json:"id"`
		Title       []LangText `json:"title"`
		Placeholder []LangText `json:"placeholder"`
		Require     int        `json:"require"`
		UnPrint     int        `json:"un_print"`
	} `json:"property"`
}

func (a *ApprovalClient) GetTemplateDetail(ctx context.Context, templateID string) (*TemplateDetailResp, error) {
	var resp TemplateDetailResp
	err := a.client.Post(ctx, "oa/gettemplatedetail",
		map[string]string{"template_id": templateID}, &resp)
	return &resp, err
}

// ── A2 提交审批申请 ──

type SubmitApprovalReq struct {
	CreatorUserid        string                   `json:"creator_userid"`
	TemplateID           string                   `json:"template_id"`
	UseTemplateApprover  int                      `json:"use_template_approver"`
	ApplyData            ApplyData                `json:"apply_data"`
	SummaryList          []SummaryItem             `json:"summary_list"`
	Approver             []ApproverNode            `json:"approver,omitempty"`
	Notifyer             []string                  `json:"notifyer,omitempty"`
	NotifyType           int                       `json:"notify_type,omitempty"`
	ChooseDepartment     int                       `json:"choose_department,omitempty"`
}

type ApplyData struct {
	Contents []ApplyControl `json:"contents"`
}

type ApplyControl struct {
	Control string                 `json:"control"`
	ID      string                 `json:"id"`
	Value   map[string]interface{} `json:"value"`
}

type SummaryItem struct {
	SummaryInfo []LangText `json:"summary_info"`
}

type ApproverNode struct {
	Attr   int      `json:"attr"`
	Userid []string `json:"userid"`
}

type SubmitApprovalResp struct {
	BaseResp
	SpNo string `json:"sp_no"`
}

func (a *ApprovalClient) SubmitApproval(ctx context.Context, req *SubmitApprovalReq) (string, error) {
	var resp SubmitApprovalResp
	err := a.client.Post(ctx, "oa/applyevent", req, &resp)
	if err != nil {
		return "", err
	}
	return resp.SpNo, nil
}

// ── A3 批量获取审批单号 ──

type ListApprovalReq struct {
	Starttime string           `json:"starttime"`
	Endtime   string           `json:"endtime"`
	NewCursor string           `json:"new_cursor"`
	Size      int              `json:"size"`
	Filters   []ApprovalFilter `json:"filters,omitempty"`
}

type ApprovalFilter struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type ListApprovalResp struct {
	BaseResp
	SpNoList      []string `json:"sp_no_list"`
	NewNextCursor string   `json:"new_next_cursor"`
}

func (a *ApprovalClient) ListApprovalNos(ctx context.Context, starttime, endtime int64, filters []ApprovalFilter) ([]string, error) {
	var allNos []string
	cursor := ""
	for {
		req := &ListApprovalReq{
			Starttime: strconv.FormatInt(starttime, 10),
			Endtime:   strconv.FormatInt(endtime, 10),
			NewCursor: cursor,
			Size:      100,
			Filters:   filters,
		}
		var resp ListApprovalResp
		if err := a.client.Post(ctx, "oa/getapprovalinfo", req, &resp); err != nil {
			return nil, fmt.Errorf("list approval nos: %w", err)
		}
		allNos = append(allNos, resp.SpNoList...)
		cursor = resp.NewNextCursor
		if cursor == "" || len(resp.SpNoList) < 100 {
			break
		}
	}
	return allNos, nil
}

// ── A4 获取审批申请详情 ──

type ApprovalDetailResp struct {
	BaseResp
	Info ApprovalInfo `json:"info"`
}

type ApprovalInfo struct {
	SpNo       string       `json:"sp_no"`
	SpName     string       `json:"sp_name"`
	SpStatus   int          `json:"sp_status"`
	TemplateID string       `json:"template_id"`
	ApplyTime  int64        `json:"apply_time"`
	Applyer    Applyer      `json:"applyer"`
	SpRecord   []SpRecord   `json:"sp_record"`
	Notifyer   []Notifyer   `json:"notifyer"`
	ApplyData  ApplyData    `json:"apply_data"`
	Comments   []Comment    `json:"comments"`
}

type Applyer struct {
	Userid  string `json:"userid"`
	Partyid string `json:"partyid"`
}

type SpRecord struct {
	SpStatus     int        `json:"sp_status"`
	ApproverAttr int        `json:"approverattr"`
	Details      []SpDetail `json:"details"`
}

type SpDetail struct {
	Approver struct {
		Userid string `json:"userid"`
	} `json:"approver"`
	Speech   string   `json:"speech"`
	SpStatus int      `json:"sp_status"`
	SpTime   int64    `json:"sptime"`
	MediaID  []string `json:"media_id"`
}

type Notifyer struct {
	Userid string `json:"userid"`
}

type Comment struct {
	CommentUserInfo struct {
		Userid string `json:"userid"`
	} `json:"commentUserInfo"`
	CommentTime    int64  `json:"commenttime"`
	CommentContent string `json:"commentcontent"`
}

func (a *ApprovalClient) GetApprovalDetail(ctx context.Context, spNo string) (*ApprovalInfo, error) {
	var resp ApprovalDetailResp
	err := a.client.Post(ctx, "oa/getapprovaldetail",
		map[string]string{"sp_no": spNo}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp.Info, nil
}

// ── A5 创建审批模板 ──

type CreateTemplateReq struct {
	TemplateName    []LangText      `json:"template_name"`
	TemplateContent TemplateContent  `json:"template_content"`
}

type CreateTemplateResp struct {
	BaseResp
	TemplateID string `json:"template_id"`
}

func (a *ApprovalClient) CreateTemplate(ctx context.Context, req *CreateTemplateReq) (string, error) {
	var resp CreateTemplateResp
	err := a.client.Post(ctx, "oa/approval/create_template", req, &resp)
	if err != nil {
		return "", err
	}
	return resp.TemplateID, nil
}

// ── A6 更新审批模板 ──

func (a *ApprovalClient) UpdateTemplate(ctx context.Context, templateID string, updates map[string]interface{}) error {
	updates["template_id"] = templateID
	var resp BaseResp
	return a.client.Post(ctx, "oa/approval/update_template", updates, &resp)
}

// ── A7 复制/推广审批模板 ──

func (a *ApprovalClient) CopyTemplate(ctx context.Context, openTemplateID string) (string, error) {
	var resp CreateTemplateResp
	err := a.client.Post(ctx, "oa/approval/copytemplate",
		map[string]string{"open_template_id": openTemplateID}, &resp)
	if err != nil {
		return "", err
	}
	return resp.TemplateID, nil
}

// ── A8 查询自建应用审批单状态 ──

type OpenApprovalDataResp struct {
	BaseResp
	Data map[string]interface{} `json:"data"`
}

func (a *ApprovalClient) GetOpenApprovalData(ctx context.Context, thirdNo string) (map[string]interface{}, error) {
	var resp OpenApprovalDataResp
	err := a.client.Post(ctx, "corp/getopenapprovaldata",
		map[string]string{"thirdNo": thirdNo}, &resp)
	if err != nil {
		return nil, err
	}
	return resp.Data, nil
}
```

---


### 7.4 Java 示例

```java
public class WecomApprovalService {
    private final WeComClient client;

    public WecomApprovalService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-approval 相关 API
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
class WecomApprovalService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-approval 相关 API
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

### T1 提交并查询审批

```python
def test_submit_and_query_approval():
    """提交审批申请 → 获取详情 → 验证状态"""
    client = ApprovalClient(wecom_client)

    # 1. 获取模板详情，了解控件 ID
    tpl = client.get_template_detail(TEMPLATE_ID)
    controls = tpl["template_content"]["controls"]
    assert len(controls) > 0

    # 2. 构造 apply_data
    apply_data = build_apply_data([
        ("Text", controls[0]["property"]["id"], {"text": "测试报销"}),
    ])
    summary = build_summary(["测试审批", "自动化测试"])

    # 3. 提交审批
    sp_no = client.submit_approval(
        creator_userid="TestUser",
        template_id=TEMPLATE_ID,
        apply_data=apply_data,
        summary_list=summary,
        use_template_approver=1,
    )
    assert sp_no  # 应返回审批单号

    # 4. 查询详情
    detail = client.get_approval_detail(sp_no)
    assert detail["sp_no"] == sp_no
    assert detail["sp_status"] == 1  # 审批中
    assert detail["template_id"] == TEMPLATE_ID
```

### T2 批量查询审批单号

```python
def test_list_approval_nos_with_filter():
    """按模板 ID 和状态筛选审批单"""
    client = ApprovalClient(wecom_client)

    import time
    endtime = int(time.time())
    starttime = endtime - 7 * 86400  # 最近 7 天

    nos = client.list_approval_nos(
        starttime=starttime,
        endtime=endtime,
        filters=[
            {"key": "template_id", "value": TEMPLATE_ID},
            {"key": "sp_status", "value": "2"},  # 已通过
        ],
    )
    assert isinstance(nos, list)
    # 验证每条详情的状态
    for sp_no in nos[:3]:
        detail = client.get_approval_detail(sp_no)
        assert detail["sp_status"] == 2
```

### T3 模板 CRUD

```python
def test_template_crud():
    """创建 → 更新 → 获取详情"""
    client = ApprovalClient(wecom_client)

    # 创建模板
    template_id = client.create_template(
        template_name=[{"text": "测试模板", "lang": "zh_CN"}],
        template_content={
            "controls": [
                {
                    "property": {
                        "control": "Text",
                        "id": "Text-001",
                        "title": [{"text": "事由", "lang": "zh_CN"}],
                        "placeholder": [{"text": "请填写", "lang": "zh_CN"}],
                        "require": 1,
                        "un_print": 0,
                    }
                }
            ]
        },
    )
    assert template_id

    # 更新模板
    client.update_template(
        template_id,
        template_name=[{"text": "测试模板-已更新", "lang": "zh_CN"}],
    )

    # 获取详情验证
    detail = client.get_template_detail(template_id)
    names = detail.get("template_names", [])
    assert any("已更新" in n["text"] for n in names)
```

---

## 9. Code Review 检查清单

- [ ] **CR1** 路径不含 `/cgi-bin/` 前缀（WeComClient base URL 已包含）
- [ ] **CR2** Python `post()` 使用 `json=body` keyword 参数
- [ ] **CR3** `apply_data.contents` 中每个控件的 `id` 来自模板详情而非硬编码
- [ ] **CR4** `starttime`/`endtime` 跨度不超过 31 天
- [ ] **CR5** 使用 `new_cursor`/`new_next_cursor` 而非旧字段 `cursor`/`next_cursor`
- [ ] **CR6** `summary_list` 包含 3~5 行摘要
- [ ] **CR7** `use_template_approver=0` 时必须提供 `approver` 数组
- [ ] **CR8** 必填控件（require=1）在 apply_data 中有值
- [ ] **CR9** `sp_record` 按数组类型处理，而非对象
- [ ] **CR10** A7 copytemplate 使用 `provider_access_token` 而非普通 `access_token`

---

## 10. 踩坑指南 (Gotcha Guide)

### G1 必填控件缺失 → 301025

**症状**：提交审批返回 `301025: get approval param error:has no require control value`

**原因**：模板中 `require=1` 的控件在 `apply_data` 中没有对应值。

**解法**：先调用 A1 获取模板详情，遍历所有 `require=1` 的控件，确保 `apply_data.contents` 中包含每个必填控件的 ID 和值。

---

### G2 控件 ID 不匹配 → 301025

**症状**：`301025: get approval param error:invalid control id`

**原因**：`apply_data` 中的控件 `id` 与模板中实际控件 ID 不一致（可能是硬编码或模板已更新）。

**解法**：每次提交前用 A1 动态获取控件 ID，不要缓存或硬编码。

---

### G3 审批人不在可见范围 → 301055

**症状**：`301055: no approval auth:creator not in app visible range`

**原因**：`creator_userid` 对应的成员不在应用的可见范围内。

**解法**：确保应用可见范围包含 `creator_userid` 对应的成员或部门。

---

### G4 时间跨度超限 → getapprovalinfo 报错

**症状**：A3 接口返回错误

**原因**：`starttime` 到 `endtime` 跨度超过 31 天。

**解法**：将查询拆分为 ≤31 天的多段，分段查询后合并结果。

---

### G5 旧字段 cursor 即将废弃

**症状**：使用 `cursor`/`next_cursor` 字段可能在未来失效

**原因**：官方已推出 `new_cursor`/`new_next_cursor` 替代。

**解法**：统一使用 `new_cursor`/`new_next_cursor` 字段。

---

### G6 sp_record 是数组不是对象

**症状**：反序列化 `sp_record` 字段时类型错误

**原因**：某些第三方 SDK（如 WxJava 3.7.0）错误地将 `sp_record` 定义为对象。

**解法**：确保将 `sp_record` 按 `[]SpRecord` / `SpRecord[]` / `list[dict]` 数组类型处理。

---

### G7 两套审批体系混用

**症状**：用审批应用接口查不到自建应用审批单，或反之。

**原因**：审批应用体系（A1-A4, `sys_approval_change`）和审批流程引擎体系（A8, `open_approval_change`）是完全独立的。

**解法**：明确当前使用的是哪套体系。审批应用用 `sp_no` 标识，审批流程引擎用 `thirdNo` 标识。

---

### G8 一个模板只能有一类假勤控件

**症状**：创建模板时包含 Vacation 和 Attendance 控件报错

**原因**：一个模板中只能有一类假勤控件（Vacation 或 Attendance），不可混用。

**解法**：请假用 Vacation，出差/外出/加班用 Attendance，分别放在不同模板中。

---

### G9 附件全局限制 6 个

**症状**：上传超过 6 个附件时报错

**原因**：一个审批申请单全局仅支持上传 6 个附件。

**解法**：控制附件数量 ≤6，或将多个文件压缩后上传。

---

### G10 系统应用 secret 已停用

**症状**：2023-12-01 后使用系统应用 secret 调用审批接口失败

**原因**：官方不再支持系统应用 secret 调用审批接口。

**解法**：使用审批应用专用 secret 或配置到「可调用应用」列表的自建应用 secret。

---

## 11. 参考链接

| 文档 | 链接 |
|------|------|
| 获取审批模板详情 | https://developer.work.weixin.qq.com/document/path/91982 |
| 提交审批申请 | https://developer.work.weixin.qq.com/document/path/96507 |
| 批量获取审批单号 | https://developer.work.weixin.qq.com/document/path/96509 |
| 获取审批申请详情 | https://developer.work.weixin.qq.com/document/path/91983 |
| 创建审批模板 | https://developer.work.weixin.qq.com/document/path/97437 |
| 更新审批模板 | https://developer.work.weixin.qq.com/document/path/97440 |
| 审批回调通知 | https://developer.work.weixin.qq.com/document/path/91815 |
| 审批流程引擎 | https://developer.work.weixin.qq.com/document/path/93798 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |


