---
name: wecom-crm-customer
description: 企业微信外部联系人·客户管理域 SKILL — 客户 CRUD、备注、服务人员、unionid 转换
version: 1.0.0
triggers:
  - 外部联系人
  - 客户管理
  - external_userid
  - externalcontact
  - 客户详情
  - 客户列表
  - 备注客户
  - unionid
  - follow_user
  - add_way
  - 84061
prerequisite_skills:
  - wecom-core
domain: crm-customer
api_count: 6
callback_count: 6
---

# WeCom CRM · Customer Management SKILL

> 覆盖企业微信「外部联系人 · 客户管理」子域：客户列表/详情/批量查询、备注修改、服务人员列表、unionid 转换，以及 6 种客户变更回调事件。
> 依赖 `wecom-core` SKILL 提供的 WeComClient 基础客户端。

---

## 1. 前置条件

### 1.1 权限与凭证

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 「客户联系」secret 或已配置到「可调用应用」列表的自建应用 secret | 客户联系使用范围 |
| 第三方应用 | suite_access_token | 「企业客户权限 → 客户基础信息」 |
| 代开发应用 | 需申请客户联系权限 | 管理员授权（头像/手机等敏感字段） |

> **2023-12-01 变更**：不再支持通过系统应用 secret 调用客户联系接口，必须使用「客户联系」专用 secret 或已配置的自建应用 secret。

### 1.2 管理后台配置

1. **企业微信管理后台 → 客户联系 → 权限配置** → 将应用添加到「可调用应用」列表
2. **设置客户联系使用范围**：指定哪些成员可以使用客户联系功能
3. **回调配置**：在应用管理中配置回调 URL / Token / EncodingAESKey

### 1.3 数据可见范围

- 自建/第三方应用只能获取 **可见范围内** 已配置客户联系功能的成员的客户
- `externalcontact/get` 的 `follow_user` 仅包含应用可见范围内的成员
- 「营销获客」应用只能获取该应用带来的客户

---

## 2. 核心概念

### 2.1 ID 体系

| ID | 格式/前缀 | 含义 | 作用域 |
|----|----------|------|--------|
| userid | 自定义(1~64字节) | 企业成员 ID | 企业内唯一 |
| external_userid | `wo` 或 `wm` 开头 | 外部联系人 ID | 企业内唯一（自建应用） / 服务商唯一（第三方） |
| unionid | 微信开放平台 | 微信用户跨应用唯一 ID | 需绑定微信开放平台 |
| pending_id | `p` 开头 | 临时外部联系人 ID | 90 天有效，仅用于关联映射 |
| open_userid | — | 全局唯一用户 ID | 跨企业唯一（第三方） |

### 2.2 客户类型

| type 值 | 含义 | 特有字段 |
|---------|------|---------|
| 1 | 微信用户 | unionid（需绑定开放平台） |
| 2 | 企业微信用户 | position, corp_full_name, external_profile |

### 2.3 添加来源 (add_way)

| 值 | 含义 | 值 | 含义 |
|----|------|----|------|
| 0 | 未知来源 | 9 | 搜索企业号 |
| 1 | 扫描二维码 | 10 | 视频号添加 |
| 2 | 搜索手机号 | 11 | 日程参与人 |
| 3 | 名片分享 | 12 | 会议参与人 |
| 4 | 群聊 | 13 | 通过药方 |
| 5 | 手机通讯录 | 14 | 智慧硬件客服 |
| 6 | 微信联系人 | 15 | 上门服务客服 |
| 7 | 微信好友申请 | 16 | 获客链接 |
| 8 | 第三方应用自动添加 | 201 | 内部成员共享 |
| — | — | 202 | 管理员/负责人分配 |

> **已知问题**：搜索微信好友后点"去企业微信添加"，`add_way` 可能返回 `0` 而非 `7`。

### 2.4 标签体系

| 前缀 | type 值 | 含义 |
|------|---------|------|
| `et` | 1 | 企业标签（管理员/API 设置） |
| `st` | 2 | 个人标签（成员自行创建） |
| — | 3 | 规则组标签（自动打标签规则） |

### 2.5 external_userid 主体差异

| 应用类型 | external_userid 主体 | 跨应用一致性 |
|---------|---------------------|-------------|
| 自建应用 | 企业主体 | 同企业不同自建应用相同 |
| 第三方/代开发 | 服务商主体 | 同服务商下不同应用相同，与企业主体下的不同 |

---

## 3. API 速查表

| 编号 | 名称 | 方法 | 路径 | doc_id |
|------|------|------|------|--------|
| C1 | 获取客户列表 | GET | /externalcontact/list | 92113 |
| C2 | 获取客户详情 | GET | /externalcontact/get | 92114 |
| C3 | 批量获取客户详情 | POST | /externalcontact/batch/get_by_user | 92994 |
| C4 | 修改客户备注 | POST | /externalcontact/remark | 92694 |
| C5 | 获取服务人员列表 | GET | /externalcontact/get_follow_user_list | 92576 |
| C6 | unionid 转 external_userid | POST | /externalcontact/unionid_to_external_userid | 93274 |

---

## 4. API 详情

### 4.1 C1 — 获取客户列表

`GET /cgi-bin/externalcontact/list?access_token=ACCESS_TOKEN&userid=USERID`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| access_token | string | 是 | 调用接口凭证（URL 参数） |
| userid | string | 是 | 企业成员的 userid |

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| external_userid | string[] | 外部联系人 userid 列表 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "external_userid": [
    "woAJ2GCAAAXtWyujaWJHDDGi0mACAAA",
    "wmqfasd1e1927831291723123109rAAA"
  ]
}
```

**注意:**
- 仅返回 external_userid 列表，详情需再调 C2
- userid 有客户联系范围但无客户时返回 **84061 而非空数组**
- 仅返回应用可见范围内的客户

---

### 4.2 C2 — 获取客户详情

`GET /cgi-bin/externalcontact/get?access_token=ACCESS_TOKEN&external_userid=EXTERNAL_USERID&cursor=CURSOR`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| access_token | string | 是 | URL 参数 |
| external_userid | string | 是 | 外部联系人 userid |
| cursor | string | 否 | 分页游标（跟进人超 500 时使用） |

**返回字段:**

| Field | Type | Description |
|------|------|------|
| external_contact | object | 外部联系人信息 |
| external_contact.external_userid | string | 外部联系人 ID |
| external_contact.name | string | 名称（微信昵称 / 企微别名） |
| external_contact.position | string | 职位（企微用户，可能隐藏） |
| external_contact.avatar | string | 头像 URL（代开发需授权，第三方不可获取） |
| external_contact.corp_name | string | 所在企业简称 |
| external_contact.corp_full_name | string | 企业主体名称（仅企微用户） |
| external_contact.type | int | 1=微信用户, 2=企微用户 |
| external_contact.gender | int | 0=未知, 1=男, 2=女 |
| external_contact.unionid | string | 微信 unionid（type=1 且已绑定开放平台） |
| external_contact.external_profile | object | 自定义展示信息（仅企微用户） |
| follow_user | object[] | 跟进人列表 |
| follow_user[].userid | string | 成员 userid |
| follow_user[].remark | string | 备注名 |
| follow_user[].description | string | Description |
| follow_user[].createtime | int | 添加时间(Unix 秒) |
| follow_user[].tags | object[] | 标签列表(含 group_name/tag_name/tag_id/type) |
| follow_user[].remark_corp_name | string | 备注企业名 |
| follow_user[].remark_mobiles | string[] | 备注手机号（代开发需授权，第三方不可获取） |
| follow_user[].add_way | int | 添加来源（见 2.3） |
| follow_user[].oper_userid | string | 发起添加的 userid |
| follow_user[].state | string | 「联系我」渠道来源 state |
| follow_user[].wechat_channels | object | 视频号信息(nickname/source) |
| next_cursor | string | 分页游标（跟进人 >500 时） |

**注意:**
- 跟进人超过 500 必须使用 cursor 分页
- `follow_user` 仅包含应用可见范围内的成员
- 获取 unionid 需绑定微信开放平台，且主体一致

---

### 4.3 C3 — 批量获取客户详情

`POST /cgi-bin/externalcontact/batch/get_by_user?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| userid_list | string[] | 是 | 成员 userid 列表，最多 **100 个** |
| cursor | string | 否 | 分页游标 |
| limit | int | 否 | 每页最大记录数，最大 **100**，默认 50 |

**请求示例:**

```json
{
  "userid_list": ["zhangsan", "lisi"],
  "cursor": "",
  "limit": 100
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| external_contact_list | object[] | 客户详情列表 |
| external_contact_list[].external_contact | object | 外部联系人信息（同 C2） |
| external_contact_list[].follow_info | object | 跟进人信息（**注意字段名不同**） |
| follow_info.userid | string | 成员 userid |
| follow_info.remark | string | 备注名 |
| follow_info.description | string | Description |
| follow_info.createtime | int | 添加时间 |
| follow_info.tag_id | string[] | 标签 ID 列表（**仅 ID，无 group_name/tag_name**） |
| follow_info.remark_corp_name | string | 备注企业名 |
| follow_info.remark_mobiles | string[] | 备注手机号 |
| follow_info.add_way | int | 添加来源 |
| follow_info.oper_userid | string | 发起添加的 userid |
| follow_info.state | string | 渠道来源 |
| follow_info.wechat_channels | object | 视频号信息(nickname/source) |
| next_cursor | string | 分页游标 |

> **关键差异**: C2 返回 `follow_user`（数组，含完整 tags），C3 返回 `follow_info`（对象，仅含 tag_id）。详见踩坑指南。

---

### 4.4 C4 — 修改客户备注

`POST /cgi-bin/externalcontact/remark?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| userid | string | 是 | 企业成员 userid |
| external_userid | string | 是 | 外部联系人 userid |
| remark | string | 否 | 备注名，最多 **20 个字符** |
| description | string | 否 | 描述，最多 **150 个字符** |
| remark_company | string | 否 | 备注企业名，最多 **20 个字符**（仅微信用户有效） |
| remark_mobiles | string[] | 否 | 备注手机号（覆盖式更新） |
| remark_pic_mediaid | string | 否 | 备注图片 mediaid |

> 以上可选字段不可全部为空，至少填写一个。

**请求示例:**

```json
{
  "userid": "zhangsan",
  "external_userid": "woAJ2GCAAAXtWyujaWJHDDGi0mACHAAA",
  "remark": "李部长",
  "description": "采购对接人",
  "remark_company": "腾讯科技",
  "remark_mobiles": ["13800000001"]
}
```

**返回:** 标准 errcode/errmsg

**注意:**
- `remark_company` 仅对微信用户(type=1)有效
- `remark_mobiles` 是**覆盖式更新**，会替换全部备注手机号
- 清除所有备注手机号：传 `[""]`（含一个空字符串的数组）
- 修改备注手机号**不会触发** edit_external_contact 回调

---

### 4.5 C5 — 获取服务人员列表

`GET /cgi-bin/externalcontact/get_follow_user_list?access_token=ACCESS_TOKEN`

**请求参数:** 仅需 access_token（URL 参数）

**返回字段:**

| Field | Type | Description |
|------|------|------|
| errcode | int | 返回码 |
| errmsg | string | 返回信息 |
| follow_user | string[] | 配置了客户联系功能的成员 userid 列表 |

**返回示例:**

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "follow_user": ["zhangsan", "lisi"]
}
```

**注意:**
- 仅返回可见范围内的成员
- 不支持直接获取全企业客户列表，必须通过服务人员 → 客户列表 → 客户详情 三步获取
- 典型调用流程：C5 → C1 → C2/C3

---

### 4.6 C6 — unionid 转 external_userid

`POST /cgi-bin/externalcontact/unionid_to_external_userid?access_token=ACCESS_TOKEN`

> 升级版 URL（推荐）: `POST /cgi-bin/idconvert/unionid_to_external_userid?access_token=ACCESS_TOKEN`

**请求参数:**

| Parameter | Type | Required | Description |
|------|------|------|------|
| unionid | string | 是 | 微信客户 unionid |
| openid | string | 是 | 微信客户 openid |
| subject_type | int | 否 | 主体类型：0=企业(默认), 1=服务商。仅升级版 URL 支持 |

**请求示例:**

```json
{
  "unionid": "oAAAAAAA",
  "openid": "oBBBB",
  "subject_type": 0
}
```

**返回字段:**

| Field | Type | Description |
|------|------|------|
| external_userid | string | 外部联系人 ID（已是客户时返回） |
| pending_id | string | 临时 ID（以下两种情况返回，升级版 URL）：① 微信用户尚未成为企业客户；② 客户的跟进人或所在群主不在应用可见范围 |

**频率限制:**

| subject_type | 限制维度 | 小时 | 天 | 月 |
|--------------|---------|------|-----|------|
| 0（企业主体） | 按企业累计（所有服务商共用额度） | 10 万 | 48 万 | 750 万 |
| 1（服务商主体） | 按服务商累计 | 10 万 | 48 万 | 750 万 |

**注意:**
- **仅认证企业可调用此接口**
- unionid 与 openid 必须来自**同一个小程序**
- 主体需与企业/服务商主体一致
- pending_id 有效期 **90 天**，不可当 external_userid 调用其他接口
- **严禁批量 ID 转换**，违规将封禁接口
- 建议建立 unionid → external_userid 映射库，避免重复查询
- 旧版 URL 不支持 subject_type 和 pending_id，推荐用升级版

---

## 5. 回调事件

所有回调 Event 为 `change_external_contact`，通过 `ChangeType` 区分 6 种子事件。

> **通用规则**: 5 秒未响应则断连并重试，共 3 次。建议立即应答，异步处理业务。官方文档声称通过 API 的操作不产生回调（仅客户端操作触发），但备注接口文档(92694)又指出 API 修改备注也可能触发 `edit_external_contact` 回调——**两处官方文档存在矛盾，建议实际测试验证**。

### 5.1 回调事件一览

| ChangeType | 名称 | 特有字段 | 操作方 |
|------------|------|---------|--------|
| add_half_external_contact | 免验证添加 | State, WelcomeCode | 外部联系人 |
| add_external_contact | 添加客户 | State, WelcomeCode | 企业成员 |
| edit_external_contact | 编辑客户 | — | 企业成员 |
| del_external_contact | 成员删客户 | Source | 企业成员 |
| del_follow_user | 客户删成员 | — | 外部联系人 |
| transfer_fail | 接替失败 | FailReason | 系统 |

### 5.2 add_half_external_contact — 免验证添加

```xml
<xml>
    <ToUserName><![CDATA[CorpID]]></ToUserName>
    <FromUserName><![CDATA[sys]]></FromUserName>
    <CreateTime>1403610513</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[change_external_contact]]></Event>
    <ChangeType><![CDATA[add_half_external_contact]]></ChangeType>
    <UserID><![CDATA[zhangsan]]></UserID>
    <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mACH71w]]></ExternalUserID>
    <State><![CDATA[teststate]]></State>
    <WelcomeCode><![CDATA[WELCOMECODE]]></WelcomeCode>
</xml>
```

| 字段 | 说明 |
|------|------|
| UserID | 企业成员 UserID |
| ExternalUserID | 外部联系人 ID |
| State | 「联系我」配置的渠道来源 state |
| WelcomeCode | 发送欢迎语凭证，**有效期 20 秒** |

**触发条件**: 外部联系人通过免验证添加成员（成员尚未确认，单向好友）。
**注意**: 需同时开启应用中的免验证 + 「联系我」中的免验证。

### 5.3 add_external_contact — 添加客户

XML 结构同 5.2，ChangeType 为 `add_external_contact`。

**触发条件**: 成员确认添加好友后（双向好友关系建立）。
**注意**:
- 如已通过 add_half_external_contact 发过欢迎语，此事件**不返回** WelcomeCode
- 成员添加企微联系人时自动递名片，**不回调** WelcomeCode

### 5.4 edit_external_contact — 编辑客户

```xml
<xml>
    <ToUserName><![CDATA[CorpID]]></ToUserName>
    <FromUserName><![CDATA[sys]]></FromUserName>
    <CreateTime>1403610513</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[change_external_contact]]></Event>
    <ChangeType><![CDATA[edit_external_contact]]></ChangeType>
    <UserID><![CDATA[zhangsan]]></UserID>
    <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mACH71w]]></ExternalUserID>
</xml>
```

**触发条件**: 成员编辑备注信息（不含手机号）或企业标签。
**注意**: 仅修改备注手机号**不触发**此回调。回调不含具体修改字段，需调 C2 获取最新数据。

### 5.5 del_external_contact — 成员删客户

```xml
<xml>
    ...
    <ChangeType><![CDATA[del_external_contact]]></ChangeType>
    <UserID><![CDATA[zhangsan]]></UserID>
    <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mACH71w]]></ExternalUserID>
    <Source><![CDATA[]]></Source>
</xml>
```

| Source 值 | 含义 |
|-----------|------|
| *(空)* | 成员主动删除客户 |
| DELETE_BY_TRANSFER | 客户分配（继承）导致原跟进人被移除 |

### 5.6 del_follow_user — 客户删成员

XML 同 5.5 但 ChangeType 为 `del_follow_user`，无 Source 字段。

**区分**: `del_external_contact` = 成员删客户; `del_follow_user` = 客户删成员。

### 5.7 transfer_fail — 接替失败

```xml
<xml>
    ...
    <ChangeType><![CDATA[transfer_fail]]></ChangeType>
    <FailReason><![CDATA[customer_refused]]></FailReason>
    <UserID><![CDATA[zhangsan]]></UserID>
    <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mACH71w]]></ExternalUserID>
</xml>
```

| FailReason | 含义 |
|------------|------|
| customer_refused | 客户在 24 小时内拒绝接替 |
| customer_limit_exceed | 接替成员客户数达上限 |

**注意**: 仅在职继承场景触发。也可通过「查询客户接替状态」接口主动查询。

### 5.8 第三方应用回调差异

| 差异点 | 自建应用 | 第三方应用 |
|--------|---------|-----------|
| 接收方 | `<ToUserName>` (CorpID) | `<SuiteId>` + `<AuthCorpId>` |
| 发送方 | `<FromUserName>` (sys) | 无 |
| 时间 | `<CreateTime>` | `<TimeStamp>` |
| 事件标识 | `<Event>change_external_contact</Event>` | `<InfoType>change_external_contact</InfoType>` |

---

## 6. 典型工作流

### 6.1 全量客户同步

```
步骤 1: GET /externalcontact/get_follow_user_list (C5)
        → 获取所有服务人员 userid 列表

步骤 2: 对每个 userid:
        POST /externalcontact/batch/get_by_user (C3)
        → userid_list 最多 100 个，cursor 分页
        → 获取所有客户 external_userid + follow_info

步骤 3 (可选): 需要完整标签信息时
        GET /externalcontact/get (C2)
        → 获取 follow_user.tags (含 group_name/tag_name)
```

> **选型建议**: 批量场景优先 C3(batch)，需要完整标签详情时补充 C2(单个)。

### 6.2 新客户欢迎流程

```
步骤 1: 收到 add_external_contact / add_half_external_contact 回调
        → 获取 WelcomeCode（20 秒有效）

步骤 2: GET /externalcontact/get (C2)
        → 获取客户详情（type、add_way、state 等）
        → 根据 state 判断渠道来源

步骤 3: POST /externalcontact/send_welcome_msg
        → 使用 WelcomeCode 发送欢迎语
        → ⚠️ 必须在 20 秒内完成
```

### 6.3 客户变更监听

```
收到 change_external_contact 回调
├── add_half_external_contact → 免验证半添加，发欢迎语
├── add_external_contact → 添加成功，发欢迎语 / 记录 CRM
├── edit_external_contact → 调 C2 获取最新数据，同步 CRM
├── del_external_contact → 记录流失
│   └── Source=DELETE_BY_TRANSFER → 正常继承，非真正流失
├── del_follow_user → 客户主动删成员，记录流失
└── transfer_fail → 告警，人工介入
```

### 6.4 小程序用户关联客户

```
步骤 1: 小程序端获取 unionid + openid
        → wx.login() → code 换 session → 获取 unionid/openid

步骤 2: POST /idconvert/unionid_to_external_userid (C6)
        → 传入 unionid + openid + subject_type
        → 返回 external_userid 或 pending_id

步骤 3: 如返回 external_userid:
        → 关联客户，可调 C2 获取详情
        如返回 pending_id:
        → 存储映射，等客户真正添加企业成员后再关联
```

---

## 7. 代码模板

### 7.1 Python

```python
"""企业微信客户管理模块"""
from wecom_client import WeComClient  # 继承自 wecom-core

class WeComCRMCustomer:
    """客户管理 API 封装"""

    def __init__(self, client: WeComClient):
        self.client = client

    # ---- C5: 服务人员列表 ----
    def get_follow_user_list(self) -> list[str]:
        """获取配置了客户联系功能的成员列表"""
        resp = self.client.get("/externalcontact/get_follow_user_list")
        return resp.get("follow_user", [])

    # ---- C1: 客户列表 ----
    def list_external_contacts(self, userid: str) -> list[str]:
        """获取指定成员的客户 external_userid 列表"""
        resp = self.client.get("/externalcontact/list", params={"userid": userid})
        return resp.get("external_userid", [])

    # ---- C2: 客户详情 ----
    def get_external_contact(self, external_userid: str) -> dict:
        """获取客户详情（含所有跟进人，自动分页）"""
        result = {"external_contact": None, "follow_user": []}
        cursor = ""
        while True:
            params = {"external_userid": external_userid}
            if cursor:
                params["cursor"] = cursor
            resp = self.client.get("/externalcontact/get", params=params)
            if result["external_contact"] is None:
                result["external_contact"] = resp["external_contact"]
            result["follow_user"].extend(resp.get("follow_user", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return result

    # ---- C3: 批量获取 ----
    def batch_get_by_user(
        self, userid_list: list[str], limit: int = 100
    ) -> list[dict]:
        """批量获取多个成员的客户详情（自动分页）

        Args:
            userid_list: 成员 userid 列表，最多 100 个
            limit: 每页最大记录数，最大 100

        Returns:
            external_contact_list 数组
        """
        if len(userid_list) > 100:
            raise ValueError("userid_list 最多 100 个")

        all_contacts = []
        cursor = ""
        while True:
            body = {"userid_list": userid_list, "limit": min(limit, 100)}
            if cursor:
                body["cursor"] = cursor
            resp = self.client.post("/externalcontact/batch/get_by_user", json=body)
            all_contacts.extend(resp.get("external_contact_list", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return all_contacts

    # ---- C4: 修改备注 ----
    def remark(
        self,
        userid: str,
        external_userid: str,
        *,
        remark: str = None,
        description: str = None,
        remark_company: str = None,
        remark_mobiles: list[str] = None,
        remark_pic_mediaid: str = None,
    ) -> dict:
        """修改客户备注信息

        注意: remark_mobiles 是覆盖式更新，会替换全部备注手机号
        清除所有手机号: remark_mobiles=[""]
        """
        body = {"userid": userid, "external_userid": external_userid}
        if remark is not None:
            body["remark"] = remark
        if description is not None:
            body["description"] = description
        if remark_company is not None:
            body["remark_company"] = remark_company
        if remark_mobiles is not None:
            body["remark_mobiles"] = remark_mobiles
        if remark_pic_mediaid is not None:
            body["remark_pic_mediaid"] = remark_pic_mediaid
        return self.client.post("/externalcontact/remark", json=body)

    # ---- C6: unionid 转换 ----
    def unionid_to_external_userid(
        self, unionid: str, openid: str, subject_type: int = 0
    ) -> dict:
        """unionid 转换为 external_userid

        Returns:
            {"external_userid": "..."} 或 {"pending_id": "..."}
        """
        return self.client.post(
            "/idconvert/unionid_to_external_userid",
            json={"unionid": unionid, "openid": openid, "subject_type": subject_type},
        )

    # ---- 全量同步 ----
    def sync_all_customers(self) -> list[dict]:
        """全量同步所有客户（C5 → C3 分批）"""
        follow_users = self.get_follow_user_list()
        all_contacts = []
        # 每批最多 100 个 userid
        for i in range(0, len(follow_users), 100):
            batch = follow_users[i : i + 100]
            contacts = self.batch_get_by_user(batch)
            all_contacts.extend(contacts)
        return all_contacts
```

### 7.2 TypeScript

```typescript
/** 企业微信客户管理模块 */
import { WeComClient } from './wecom-client'; // 继承自 wecom-core

interface ExternalContact {
  external_userid: string;
  name: string;
  type: 1 | 2;
  gender: 0 | 1 | 2;
  avatar?: string;
  corp_name?: string;
  corp_full_name?: string;
  unionid?: string;
  position?: string;
  external_profile?: { external_attr: ExternalAttr[] };
}

interface ExternalAttr {
  type: 0 | 1 | 2;
  name: string;
  text?: { value: string };
  web?: { url: string; title: string };
  miniprogram?: { appid: string; pagepath: string; title: string };
}

interface FollowUser {
  userid: string;
  remark: string;
  description: string;
  createtime: number;
  tags: { group_name: string; tag_name: string; tag_id: string; type: number }[];
  remark_corp_name?: string;
  remark_mobiles?: string[];
  add_way: number;
  oper_userid?: string;
  state?: string;
  wechat_channels?: { nickname: string; source: number };
}

/** C3 批量返回的跟进信息 — 注意字段名和标签结构与 FollowUser 不同 */
interface FollowInfo {
  userid: string;
  remark: string;
  description: string;
  createtime: number;
  tag_id: string[];  // 仅 ID，无 group_name/tag_name
  remark_corp_name?: string;
  remark_mobiles?: string[];
  add_way: number;
  oper_userid?: string;
  state?: string;
  wechat_channels?: { nickname: string; source: number };
}

export class WeComCRMCustomer {
  constructor(private client: WeComClient) {}

  /** C5: 获取服务人员列表 */
  async getFollowUserList(): Promise<string[]> {
    const resp = await this.client.get('/externalcontact/get_follow_user_list');
    return resp.follow_user ?? [];
  }

  /** C1: 获取客户列表 */
  async listExternalContacts(userid: string): Promise<string[]> {
    const resp = await this.client.get('/externalcontact/list', { params: { userid } });
    return resp.external_userid ?? [];
  }

  /** C2: 获取客户详情（自动分页） */
  async getExternalContact(externalUserid: string): Promise<{
    external_contact: ExternalContact;
    follow_user: FollowUser[];
  }> {
    const result: { external_contact: ExternalContact | null; follow_user: FollowUser[] } = {
      external_contact: null,
      follow_user: [],
    };
    let cursor = '';
    do {
      const params: Record<string, string> = { external_userid: externalUserid };
      if (cursor) params.cursor = cursor;
      const resp = await this.client.get('/externalcontact/get', { params });
      result.external_contact ??= resp.external_contact;
      result.follow_user.push(...(resp.follow_user ?? []));
      cursor = resp.next_cursor ?? '';
    } while (cursor);
    return result as { external_contact: ExternalContact; follow_user: FollowUser[] };
  }

  /** C3: 批量获取客户详情（自动分页） */
  async batchGetByUser(
    useridList: string[],
    limit = 100
  ): Promise<{ external_contact: ExternalContact; follow_info: FollowInfo }[]> {
    if (useridList.length > 100) throw new Error('userid_list 最多 100 个');
    const allContacts: { external_contact: ExternalContact; follow_info: FollowInfo }[] = [];
    let cursor = '';
    do {
      const body: Record<string, unknown> = {
        userid_list: useridList,
        limit: Math.min(limit, 100),
      };
      if (cursor) body.cursor = cursor;
      const resp = await this.client.post('/externalcontact/batch/get_by_user', body);
      allContacts.push(...(resp.external_contact_list ?? []));
      cursor = resp.next_cursor ?? '';
    } while (cursor);
    return allContacts;
  }

  /** C4: 修改客户备注 */
  async remark(params: {
    userid: string;
    external_userid: string;
    remark?: string;
    description?: string;
    remark_company?: string;
    remark_mobiles?: string[];
    remark_pic_mediaid?: string;
  }): Promise<void> {
    await this.client.post('/externalcontact/remark', params);
  }

  /** C6: unionid 转 external_userid（升级版） */
  async unionidToExternalUserid(
    unionid: string,
    openid: string,
    subjectType = 0
  ): Promise<{ external_userid?: string; pending_id?: string }> {
    return this.client.post('/idconvert/unionid_to_external_userid', {
      unionid,
      openid,
      subject_type: subjectType,
    });
  }

  /** 全量同步所有客户 */
  async syncAllCustomers(): Promise<{ external_contact: ExternalContact; follow_info: FollowInfo }[]> {
    const followUsers = await this.getFollowUserList();
    const allContacts: { external_contact: ExternalContact; follow_info: FollowInfo }[] = [];
    for (let i = 0; i < followUsers.length; i += 100) {
      const batch = followUsers.slice(i, i + 100);
      const contacts = await this.batchGetByUser(batch);
      allContacts.push(...contacts);
    }
    return allContacts;
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"fmt"
)

// CRMCustomer 客户管理模块
type CRMCustomer struct {
	client *Client // 继承自 wecom-core
}

func NewCRMCustomer(client *Client) *CRMCustomer {
	return &CRMCustomer{client: client}
}

// ExternalContact 外部联系人信息
type ExternalContact struct {
	ExternalUserID  string `json:"external_userid"`
	Name            string `json:"name"`
	Type            int    `json:"type"`  // 1=微信用户, 2=企微用户
	Gender          int    `json:"gender"`
	Avatar          string `json:"avatar,omitempty"`
	CorpName        string `json:"corp_name,omitempty"`
	CorpFullName    string `json:"corp_full_name,omitempty"`
	UnionID         string `json:"unionid,omitempty"`
	Position        string `json:"position,omitempty"`
}

// FollowUser C2 返回的跟进人信息（含完整 tags）
type FollowUser struct {
	UserID         string      `json:"userid"`
	Remark         string      `json:"remark"`
	Description    string      `json:"description"`
	CreateTime     int64       `json:"createtime"`
	Tags           []Tag       `json:"tags"`
	RemarkCorpName string      `json:"remark_corp_name,omitempty"`
	RemarkMobiles  []string    `json:"remark_mobiles,omitempty"`
	AddWay         int         `json:"add_way"`
	OperUserID     string      `json:"oper_userid,omitempty"`
	State          string      `json:"state,omitempty"`
}

// Tag 标签信息
type Tag struct {
	GroupName string `json:"group_name"`
	TagName   string `json:"tag_name"`
	TagID     string `json:"tag_id"`
	Type      int    `json:"type"` // 1=企业, 2=个人, 3=规则组
}

// FollowInfo C3 批量返回的跟进信息（仅 tag_id）
type FollowInfo struct {
	UserID         string   `json:"userid"`
	Remark         string   `json:"remark"`
	Description    string   `json:"description"`
	CreateTime     int64    `json:"createtime"`
	TagID          []string `json:"tag_id"` // 仅 ID，无 group_name/tag_name
	RemarkCorpName string   `json:"remark_corp_name,omitempty"`
	RemarkMobiles  []string `json:"remark_mobiles,omitempty"`
	AddWay         int      `json:"add_way"`
	OperUserID     string   `json:"oper_userid,omitempty"`
	State          string   `json:"state,omitempty"`
	WechatChannels *struct {
		Nickname string `json:"nickname"`
		Source   int    `json:"source"`
	} `json:"wechat_channels,omitempty"`
}

// GetFollowUserList C5: 获取服务人员列表
func (c *CRMCustomer) GetFollowUserList() ([]string, error) {
	var resp struct {
		BaseResp
		FollowUser []string `json:"follow_user"`
	}
	if err := c.client.Get("/externalcontact/get_follow_user_list", nil, &resp); err != nil {
		return nil, err
	}
	return resp.FollowUser, nil
}

// ListExternalContacts C1: 获取客户列表
func (c *CRMCustomer) ListExternalContacts(userid string) ([]string, error) {
	var resp struct {
		BaseResp
		ExternalUserID []string `json:"external_userid"`
	}
	params := map[string]string{"userid": userid}
	if err := c.client.Get("/externalcontact/list", params, &resp); err != nil {
		return nil, err
	}
	return resp.ExternalUserID, nil
}

// GetExternalContact C2: 获取客户详情（自动分页）
func (c *CRMCustomer) GetExternalContact(externalUserID string) (*ExternalContact, []FollowUser, error) {
	var contact *ExternalContact
	var allFollowUsers []FollowUser
	cursor := ""

	for {
		params := map[string]string{"external_userid": externalUserID}
		if cursor != "" {
			params["cursor"] = cursor
		}
		var resp struct {
			BaseResp
			ExternalContact ExternalContact `json:"external_contact"`
			FollowUser      []FollowUser    `json:"follow_user"`
			NextCursor      string          `json:"next_cursor"`
		}
		if err := c.client.Get("/externalcontact/get", params, &resp); err != nil {
			return nil, nil, err
		}
		if contact == nil {
			contact = &resp.ExternalContact
		}
		allFollowUsers = append(allFollowUsers, resp.FollowUser...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return contact, allFollowUsers, nil
}

// BatchGetByUser C3: 批量获取客户详情（自动分页）
func (c *CRMCustomer) BatchGetByUser(useridList []string, limit int) ([]struct {
	ExternalContact ExternalContact `json:"external_contact"`
	FollowInfo      FollowInfo      `json:"follow_info"`
}, error) {
	if len(useridList) > 100 {
		return nil, fmt.Errorf("userid_list 最多 100 个")
	}
	if limit > 100 {
		limit = 100
	}

	type item struct {
		ExternalContact ExternalContact `json:"external_contact"`
		FollowInfo      FollowInfo      `json:"follow_info"`
	}
	var allContacts []item
	cursor := ""

	for {
		body := map[string]interface{}{
			"userid_list": useridList,
			"limit":       limit,
		}
		if cursor != "" {
			body["cursor"] = cursor
		}
		var resp struct {
			BaseResp
			ExternalContactList []item `json:"external_contact_list"`
			NextCursor          string `json:"next_cursor"`
		}
		if err := c.client.Post("/externalcontact/batch/get_by_user", body, &resp); err != nil {
			return nil, err
		}
		allContacts = append(allContacts, resp.ExternalContactList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return allContacts, nil
}

// Remark C4: 修改客户备注
func (c *CRMCustomer) Remark(params map[string]interface{}) error {
	var resp BaseResp
	return c.client.Post("/externalcontact/remark", params, &resp)
}
```

---


### 7.4 Java 示例

```java
public class WeComCrmCustomerService {
    private final WeComClient client;

    public WeComCrmCustomerService(WeComClient client) {
        this.client = client;
    }

    /** 获取客户列表 */
    public JsonArray getByUser(String userId) throws Exception {
        JsonObject body = new JsonObject();
        JsonArray arr = new JsonArray();
        arr.add(userId);
        body.add("userid_list", arr);
        JsonObject resp = client.post("/externalcontact/batch/get_by_user", body);
        return resp.getAsJsonArray("external_contact_list");
    }

    /** 获取客户详情 */
    public JsonObject getDetail(String externalUserId) throws Exception {
        // ⚠️ 注意区分 external_userid 与 tmp_external_userid（从群聊场景获取的临时 ID）
        JsonObject body = new JsonObject();
        body.addProperty("external_userid", externalUserId);
        return client.post("/externalcontact/get", body);
    }

    /** 修改客户备注 — ⚠️ remark_mobiles 为覆盖式更新，不传则清空 */
    public void remark(String userId, String externalUserId, String remark) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("userid", userId);
        body.addProperty("external_userid", externalUserId);
        body.addProperty("remark", remark);
        client.post("/externalcontact/remark", body);
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
class WeComCrmCustomerService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 获取客户列表 */
    public function getByUser(string $userId): array
    {
        $data = $this->client->post('/cgi-bin/externalcontact/batch/get_by_user', [
            'userid_list' => [$userId],
        ]);
        return $data['external_contact_list'] ?? [];
    }

    /** 获取客户详情 */
    public function getDetail(string $externalUserId): array
    {
        // ⚠️ 注意区分 external_userid 与 tmp_external_userid
        return $this->client->get('/cgi-bin/externalcontact/get', [
            'external_userid' => $externalUserId,
        ]);
    }

    /** 修改客户备注 — ⚠️ remark_mobiles 为覆盖式更新 */
    public function remark(string $userId, string $externalUserId, string $remark): array
    {
        return $this->client->post('/cgi-bin/externalcontact/remark', [
            'userid'          => $userId,
            'external_userid' => $externalUserId,
            'remark'          => $remark,
        ]);
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 8. 测试模板

### 8.1 单元测试要点

```python
# --- C1: 获取客户列表 ---
def test_list_external_contacts_success():
    """正常获取客户列表"""
    # mock GET /externalcontact/list → {"errcode":0, "external_userid":["wo1","wo2"]}
    result = crm.list_external_contacts("zhangsan")
    assert len(result) == 2
    assert result[0].startswith("wo")

def test_list_external_contacts_no_customer():
    """成员无客户时返回 84061"""
    # mock → {"errcode":84061, "errmsg":"not external contact"}
    with pytest.raises(WeComError) as exc:
        crm.list_external_contacts("newbie")
    assert exc.value.errcode == 84061

# --- C2: 获取客户详情 ---
def test_get_external_contact_with_pagination():
    """跟进人超 500 需分页"""
    # mock 第一次返回 500 个 follow_user + next_cursor
    # mock 第二次返回剩余 follow_user + next_cursor=""
    result = crm.get_external_contact("woXXX")
    assert len(result["follow_user"]) > 500

# --- C3 vs C2: 返回结构差异 ---
def test_batch_returns_follow_info_not_follow_user():
    """C3 返回 follow_info(含tag_id)，非 follow_user(含tags)"""
    contacts = crm.batch_get_by_user(["zhangsan"])
    item = contacts[0]
    assert "follow_info" in item or hasattr(item, "follow_info")
    # follow_info 只有 tag_id 数组，没有 tags 对象数组
    assert "tag_id" in item["follow_info"]

# --- C4: 备注修改 ---
def test_remark_mobiles_overwrite():
    """remark_mobiles 是覆盖式更新"""
    crm.remark(userid="zhangsan", external_userid="woXXX", remark_mobiles=["13800000001"])
    # 验证请求 body 中 remark_mobiles 为新值

def test_remark_clear_mobiles():
    """传 [""] 清除所有备注手机号"""
    crm.remark(userid="zhangsan", external_userid="woXXX", remark_mobiles=[""])

# --- C6: unionid 转换 ---
def test_unionid_returns_pending_id():
    """未成为客户时返回 pending_id"""
    # mock → {"errcode":0, "pending_id":"pAAAA"}
    result = crm.unionid_to_external_userid("oUnionid", "oOpenid")
    assert "pending_id" in result
    assert "external_userid" not in result
```

---

## 9. Code Review 检查清单

| 编号 | 检查项 | 严重度 |
|------|--------|--------|
| R1 | 是否使用「客户联系」secret 而非系统应用 secret | CRITICAL |
| R2 | C1 中 userid 无客户时是否处理 84061（非空数组） | HIGH |
| R3 | C2 跟进人超 500 时是否使用 cursor 分页 | HIGH |
| R4 | C3 返回的是 `follow_info`（非 `follow_user`），标签仅 `tag_id`（非 `tags`） | CRITICAL |
| R5 | C3 的 userid_list 是否限制最多 100 个 | HIGH |
| R6 | C4 的 remark_mobiles 是否理解为覆盖式更新（非追加） | HIGH |
| R7 | C4 清除手机号是否使用 `[""]` 而非 `[]` | MEDIUM |
| R8 | C6 是否使用升级版 URL `/idconvert/` | MEDIUM |
| R9 | C6 的 pending_id 是否仅用于映射关联（不可当 external_userid 用） | HIGH |
| R10 | WelcomeCode 是否在 **20 秒**内使用 | CRITICAL |
| R11 | 回调处理是否立即应答、异步处理业务逻辑 | HIGH |
| R12 | 是否区分 del_external_contact(成员删客户) vs del_follow_user(客户删成员) | HIGH |
| R13 | edit_external_contact 回调后是否调 C2 获取最新数据（回调不含变更字段） | MEDIUM |
| R14 | 是否意识到 API 操作的回调行为与官方文档描述可能不一致（建议实测验证） | HIGH |
| R15 | add_way=0 是否考虑为未知来源（已知问题，部分路径返回 0） | MEDIUM |

---

## 10. 踩坑指南

### G1: follow_user vs follow_info 字段结构不同

C2(`externalcontact/get`) 返回 `follow_user` 数组，每个元素含完整 `tags` 对象数组（group_name/tag_name/tag_id/type）。C3(`batch/get_by_user`) 返回 `follow_info` 对象，标签信息仅含 `tag_id` 字符串数组。混用会导致解析错误。

→ 需要标签名称时必须用 C2 或额外调「获取企业标签库」接口。

### G2: 84061 是最常见错误

触发 84061（not external contact）的场景远比预期多：
1. 成员删除了客户（单向关系断裂）
2. 免验证添加后成员未确认（半添加状态）
3. 扫码入群的人与成员没有好友关系
4. userid 有客户联系范围但无任何客户

→ 遇到 84061 不要简单重试，需排查具体场景。

### G3: WelcomeCode 仅 20 秒有效

`add_external_contact` / `add_half_external_contact` 回调中的 WelcomeCode 有效期只有 **20 秒**。如果回调处理逻辑过重（如查询 CRM、生成动态内容），极易超时。

→ 收到回调**立即**使用 WelcomeCode 发送欢迎语，动态内容可后续通过消息接口补发。

### G4: remark_mobiles 覆盖式更新

`C4(remark)` 的 `remark_mobiles` 参数是**全量覆盖**，不是追加。每次修改必须传完整的手机号列表。清除所有手机号需传 `[""]`（含一个空字符串的数组），而非空数组 `[]`。

→ 修改前先读取当前值（通过 C2 的 follow_user.remark_mobiles），合并后再写入。

### G5: 仅修改备注手机号不触发回调

通过 C4 修改 `remark_mobiles` 时，**不会**触发 `edit_external_contact` 回调。其他备注字段的修改会触发。

→ 如果依赖回调做 CRM 同步，手机号变更需额外处理（如定时全量同步）。

### G6: API 操作的回调行为不确定

官方回调文档(92277)声称通过 API 进行的操作不产生回调，但备注接口文档(92694)指出「通过 API 修改备注也可能触发 edit_external_contact 回调（实际行为可能与文档不完全一致）」。两处官方文档**存在矛盾**。

→ 不要假设 API 操作一定不触发回调，也不要假设一定触发。建议实际测试验证，并同时监听回调 + 记录 API 操作日志以确保数据一致性。

### G7: 全量同步不能直接获取所有客户

企业微信不提供「获取全部客户」的接口。必须通过三步走：C5(服务人员) → C1/C3(每个人的客户) → C2(详情)。大企业可能有数百个服务人员、数十万客户。

→ 批量场景用 C3(100 个 userid 一批)，控制并发避免 45033。建议增量同步（通过回调），定时全量校准。

### G8: pending_id 不是 external_userid

C6 返回的 `pending_id` 不能当 `external_userid` 调用其他 API（如 C2、C4）。它仅用于建立 unionid 与 external_userid 的映射关系，有效期 90 天。

→ 存储 pending_id → unionid 映射，待客户真正添加企业成员后，通过回调获取真实 external_userid 再更新映射。

### G9: add_way=0 的坑

`add_way=0` 表示「未知来源」，但实际上部分有明确来源的添加路径也会返回 0。已知案例：搜索微信好友后点「去企业微信添加」。

→ 不要假设 add_way=0 就是异常数据，业务统计时将其归入「其他」类别。

### G10: 并发限制 45033

对客户管理类 API 同时发起大量请求会触发 45033（并发超限）。不同于频率限制（按分钟/小时计数），并发限制是瞬时的。

→ 使用信号量/队列控制并发数，建议不超过 10 个并发请求。

---

## 11. 客户管理域错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40003 | 不合法的 UserID/openid | userid 格式错误或不在通讯录；openid 与小程序不匹配 |
| 40058 | 请求参数不合法 | JSON 格式错误或字段超长（remark≤20, description≤150） |
| 41001 | 缺少 access_token | URL 未携带 token |
| 42001 | access_token 过期 | token 已失效，需刷新 |
| 45033 | 接口并发调用超限 | 降低并发，使用队列排队 |
| 60111 | userid not found | userid 不存在或密文化后不兼容 |
| 84061 | not external contact | 见踩坑 G2 详细说明 |
| 610015 | 开放平台账号未认证 | 小程序绑定的开放平台未认证 |

---

## 12. 获取已服务的外部联系人

| 操作 | 方法 | 端点路径 | 说明 |
|------|------|----------|------|
| 获取已服务的外部联系人 | POST | /externalcontact/list_member_non_data_contact | 获取指定成员添加的、非数据来源的外部联系人列表 |

```python
def list_member_non_data_contact(self, userid: str, cursor: str = "", limit: int = 100) -> dict:
    """获取已服务的外部联系人"""
    return self.client.post("/externalcontact/list_member_non_data_contact", json={
        "userid": userid, "cursor": cursor, "limit": limit,
    })
```

---

## 13. 参考

- 客户管理概述: https://developer.work.weixin.qq.com/document/path/92264
- 获取客户列表: https://developer.work.weixin.qq.com/document/path/92113
- 获取客户详情: https://developer.work.weixin.qq.com/document/path/92114
- 批量获取客户详情: https://developer.work.weixin.qq.com/document/path/92994
- 修改客户备注: https://developer.work.weixin.qq.com/document/path/92694
- 获取服务人员列表: https://developer.work.weixin.qq.com/document/path/92576
- unionid 转换: https://developer.work.weixin.qq.com/document/path/93274
- 外部联系人回调: https://developer.work.weixin.qq.com/document/path/92277
- 全局错误码: https://developer.work.weixin.qq.com/document/path/96213
- 频率限制: https://developer.work.weixin.qq.com/document/path/90454


