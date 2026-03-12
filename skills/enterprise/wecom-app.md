---
name: wecom-app
description: WeCom application management SKILL - app CRUD, custom menus, workbench custom display
version: 1.0.0
domain: app-management
depends_on: wecom-core
doc_ids: [90227, 90228, 90229, 90230, 90231, 90232, 92535, 92536]
api_count: 11
triggers:
  - wecom app
  - wecom agent
  - wecom menu
  - wecom workbench
  - 企业微信应用
  - 企业微信菜单
  - 工作台
  - agentid
---

# WeCom App Management SKILL (wecom-app)

> 企业微信应用管理域 SKILL：应用基础管理、自定义菜单、工作台自定义展示

## 1. Prerequisites

使用本 SKILL 前，确保已掌握 `wecom-core` 中的：
- Token 管理（`access_token` 获取与缓存）
- 错误处理（`errcode` / `errmsg` 标准响应）
- 请求签名与 HTTPS 要求

**权限要求**：
- 应用管理接口需使用**对应应用的 `access_token`**（非通讯录 token）
- 自定义菜单接口**仅企业自建应用可调用**，第三方不可调用
- 工作台接口需在**企业微信管理端启用工作台自定义展示**

---

## 2. Core Concepts

### 2.1 应用体系

```
企业微信应用体系
├── 自建应用 (agentid ≥ 1000000)
│   ├── 应用基础信息 (名称/头像/描述/可见范围)
│   ├── 自定义菜单 (底部菜单栏)
│   └── 工作台展示 (首页卡片)
├── 基础应用 (系统内置)
└── 第三方应用 (ISV 开发)
```

### 2.2 三个子域

| 子域 | 职责 | API 数量 |
|------|------|----------|
| **应用基础管理** | 获取/设置应用信息、列出应用 | 3 |
| **自定义菜单** | 创建/获取/删除应用底部菜单 | 3 |
| **工作台自定义展示** | 设置/获取工作台模版与用户数据 | 5 |

### 2.3 自定义菜单按钮类型

| 类型 | 说明 | 触发事件 |
|------|------|----------|
| `click` | 点击推事件 | `EventKey` 推送到回调 |
| `view` | 跳转 URL | 无事件（直接跳转） |
| `scancode_push` | 扫码推事件 | 扫码结果推送 |
| `scancode_waitmsg` | 扫码带提示 | 扫码结果推送 |
| `pic_sysphoto` | 系统拍照发图 | 图片推送 |
| `pic_photo_or_album` | 拍照或相册发图 | 图片推送 |
| `pic_weixin` | 微信相册发图 | 图片推送 |
| `location_select` | 发送位置 | 位置信息推送 |
| `view_miniprogram` | 跳转小程序 | 无事件（直接跳转） |

### 2.4 工作台模版类型

| 类型 | 说明 | 限制 |
|------|------|------|
| `keydata` | 关键数据型 | 最多 4 项 |
| `image` | 图片型 | 最佳比例 3.35:1 |
| `list` | 列表型 | 最多 3 项 |
| `webview` | 网页型 | 支持 single_row/double_row 高度 |
| `normal` | 取消自定义 | 恢复默认展示 |

---

## 3. API Quick Reference

### 3.1 应用基础管理

| # | 接口 | 方法 | Endpoint | doc_id |
|---|------|------|----------|--------|
| A1 | 获取应用 | GET | `/cgi-bin/agent/get` | 90227 |
| A2 | 设置应用 | POST | `/cgi-bin/agent/set` | 90228 |
| A3 | 获取应用列表 | GET | `/cgi-bin/agent/list` | 90227 |

### 3.2 自定义菜单

| # | 接口 | 方法 | Endpoint | doc_id |
|---|------|------|----------|--------|
| M1 | 创建菜单 | POST | `/cgi-bin/menu/create` | 90229 |
| M2 | 获取菜单 | GET | `/cgi-bin/menu/get` | 90230 |
| M3 | 删除菜单 | GET | `/cgi-bin/menu/delete` | 90231 |

### 3.3 工作台自定义展示

| # | 接口 | 方法 | Endpoint | doc_id |
|---|------|------|----------|--------|
| W1 | 设置工作台模版 | POST | `/cgi-bin/agent/set_workbench_template` | 90232 |
| W2 | 获取工作台模版 | POST | `/cgi-bin/agent/get_workbench_template` | 92536 |
| W3 | 设置用户工作台数据 | POST | `/cgi-bin/agent/set_workbench_data` | 90232 |
| W4 | 批量设置用户工作台数据 | POST | `/cgi-bin/agent/batch_set_workbench_data` | 90232 |
| W5 | 获取用户工作台数据 | POST | `/cgi-bin/agent/get_workbench_data` | 90232 |

---

## 4. API Details

### A1. 获取应用

```
GET https://qyapi.weixin.qq.com/cgi-bin/agent/get?access_token=ACCESS_TOKEN&agentid=AGENTID
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证 |
| agentid | 是 | int | 应用 ID |

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| agentid | int | 企业应用 id |
| name | string | 应用名称 |
| square_logo_url | string | 应用方形头像 URL |
| description | string | 应用详情 |
| allow_userinfos | object | 可见范围（人员），含 `user[].userid` |
| allow_partys | object | 可见范围（部门），含 `partyid[]` |
| allow_tags | object | 可见范围（标签），含 `tagid[]` |
| close | int | 是否被停用，0=未停用 |
| redirect_domain | string | 应用可信域名 |
| report_location_flag | int | 是否打开地理位置上报 |
| isreportenter | int | 是否上报用户进入应用事件 |
| home_url | string | 应用主页 URL |
| customized_publish_status | int | 代开发自建应用发布状态：0=待开发, 1=开发中, 2=已上线, 3=存在未上线版本 |

**返回示例**：

```json
{
    "errcode": 0,
    "errmsg": "ok",
    "agentid": 1000005,
    "name": "HR助手",
    "square_logo_url": "https://p.qlogo.cn/bizmail/xxx/0",
    "description": "HR应用描述",
    "allow_userinfos": {
        "user": [{"userid": "zhangshan"}, {"userid": "lisi"}]
    },
    "allow_partys": {"partyid": [1]},
    "allow_tags": {"tagid": [1, 2, 3]},
    "close": 0,
    "redirect_domain": "open.work.weixin.qq.com",
    "report_location_flag": 0,
    "isreportenter": 0,
    "home_url": "https://www.example.com"
}
```

**权限**：企业仅可获取当前凭证对应的应用；第三方仅可获取被授权的应用。

---

### A2. 设置应用

```
POST https://qyapi.weixin.qq.com/cgi-bin/agent/set?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| agentid | 是 | int | 企业应用的 id |
| name | 否 | string | 应用名称，≤32 个 UTF-8 字符 |
| description | 否 | string | 应用详情，4~120 个 UTF-8 字符 |
| redirect_domain | 否 | string | 可信域名（需通过所有权校验，否则 JSSDK 功能受限，返回 85005） |
| logo_media_id | 否 | string | 头像 mediaid（通过素材管理接口上传获得） |
| report_location_flag | 否 | int | 地理位置上报：0=不上报, 1=进入会话上报 |
| isreportenter | 否 | int | 用户进入应用事件上报：0=不接收, 1=接收 |
| home_url | 否 | string | 应用主页 URL |

**权限**：仅企业自建应用可调用。

**错误码**：

| 错误码 | 说明 |
|--------|------|
| 85005 | redirect_domain 未通过所有权校验 |

---

### A3. 获取应用列表

```
GET https://qyapi.weixin.qq.com/cgi-bin/agent/list?access_token=ACCESS_TOKEN
```

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| agentlist | array | 应用列表 |
| agentlist[].agentid | int | 应用 id |
| agentlist[].name | string | 应用名称 |
| agentlist[].square_logo_url | string | 应用头像 |

**权限**：企业仅可获取当前凭证对应的应用；返回的应用列表**仅包含有 API 权限的自建应用**。

---

### M1. 创建菜单

```
POST https://qyapi.weixin.qq.com/cgi-bin/menu/create?access_token=ACCESS_TOKEN&agentid=AGENTID
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| button | 是 | array | 一级菜单数组，**最多 3 个** |
| button[].type | 是 | string | 按钮类型（见 2.3 节） |
| button[].name | 是 | string | 菜单名称，主菜单≤16 字节(4 汉字)，子菜单≤40 字节(8 汉字) |
| button[].key | click 等必须 | string | 菜单 KEY 值，≤128 字节 |
| button[].url | view 必须 | string | 网页链接，≤1024 字节 |
| button[].media_id | 否 | string | 素材类型按钮的 media_id |
| button[].appid | view_miniprogram 必须 | string | 小程序 appid |
| button[].pagepath | view_miniprogram 必须 | string | 小程序页面路径 |
| button[].sub_button | 否 | array | 二级菜单数组，**最多 5 个** |

**菜单规则**：
- 最多 3 个一级菜单，每个一级菜单最多 5 个二级菜单
- 有二级菜单的一级菜单，其 `type` 字段被忽略
- 一级菜单名称超过 16 字节、二级菜单名称超过 40 字节时，会以 `...` 截断
- 创建后由于客户端缓存，需 **24 小时**后才会展示（测试时可取消关注后重新关注）

**请求示例**：

```json
{
    "button": [
        {
            "type": "click",
            "name": "今日歌曲",
            "key": "V1001_TODAY_MUSIC"
        },
        {
            "name": "菜单",
            "sub_button": [
                {"type": "view", "name": "搜索", "url": "https://www.soso.com/"},
                {"type": "click", "name": "赞一下", "key": "V1001_GOOD"},
                {"type": "scancode_push", "name": "扫码", "key": "rselfmenu_0_1"},
                {"type": "pic_sysphoto", "name": "拍照", "key": "rselfmenu_1_0"},
                {"type": "location_select", "name": "位置", "key": "rselfmenu_2_0"}
            ]
        },
        {
            "type": "view",
            "name": "官网",
            "url": "https://www.example.com/"
        }
    ]
}
```

**权限**：仅企业可调用，第三方不可调用。

---

### M2. 获取菜单

```
GET https://qyapi.weixin.qq.com/cgi-bin/menu/get?access_token=ACCESS_TOKEN&agentid=AGENTID
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证 |
| agentid | 是 | int | 企业应用的 id |

**返回**：与创建菜单的请求体结构一致，包含 `button` 数组。

**权限**：仅企业可调用，第三方不可调用。

---

### M3. 删除菜单

```
GET https://qyapi.weixin.qq.com/cgi-bin/menu/delete?access_token=ACCESS_TOKEN&agentid=AGENTID
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| access_token | 是 | string | 调用接口凭证 |
| agentid | 是 | int | 企业应用的 id |

**注意**：删除后由于客户端缓存，菜单不会立即消失。

**权限**：仅企业可调用，第三方不可调用。

---

### W1. 设置工作台模版

```
POST https://qyapi.weixin.qq.com/cgi-bin/agent/set_workbench_template?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| agentid | 是 | int | 应用 id |
| type | 是 | string | 模版类型：keydata/image/list/webview/normal |
| keydata | 条件 | object | 关键数据型（type=keydata 时） |
| image | 条件 | object | 图片型（type=image 时） |
| list | 条件 | object | 列表型（type=list 时） |
| webview | 条件 | object | 网页型（type=webview 时） |
| replace_user_data | 否 | bool | 是否覆盖用户工作台数据（true 时企业级数据覆盖个人数据） |

#### keydata 结构

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| items | 是 | array | 数据项数组，**≤4 个** |
| items[].key | 否 | string | 数据名称 |
| items[].data | 是 | string | 具体数据值 |
| items[].jump_url | 否 | string | 点击跳转链接（网页类型应用） |
| items[].pagepath | 否 | string | 小程序页面路径（小程序类型应用） |

#### image 结构

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| url | 是 | string | 图片链接 |
| jump_url | 否 | string | 点击跳转地址（网页类型） |
| pagepath | 否 | string | 小程序页面路径（小程序类型） |

> 图片最佳比例 **3.35:1**

#### list 结构

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| items | 是 | array | 列表项数组，**≤3 个** |
| items[].title | 是 | string | 列表显示文字，≤128 字节 |
| items[].jump_url | 否 | string | 点击跳转链接（网页类型） |
| items[].pagepath | 否 | string | 小程序页面路径（小程序类型） |

#### webview 结构

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| url | 是 | string | 渲染展示的网址 |
| jump_url | 否 | string | 点击跳转链接 |
| pagepath | 否 | string | 小程序页面路径 |
| height | 否 | string | 高度：`single_row` 或 `double_row` |
| hide_title | 否 | bool | 是否隐藏标题 |
| enable_webview_click | 否 | bool | 是否启用链接跳转能力 |

**跳转规则**：
- 应用主页为网页 → 仅可配置 `jump_url`
- 应用主页为小程序 → 仅可配置 `pagepath`
- 两者互斥，不可同时配置

**取消自定义**：将 `type` 设为 `"normal"` 即可恢复默认展示。

---

### W2. 获取工作台模版

```
POST https://qyapi.weixin.qq.com/cgi-bin/agent/get_workbench_template?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| agentid | 是 | int | 应用 id |

**返回参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 模板类型（未设置时返回空） |
| keydata/image/list/webview | object | 对应模板数据 |
| replace_user_data | bool | 是否覆盖用户个人数据 |

---

### W3. 设置用户工作台数据

```
POST https://qyapi.weixin.qq.com/cgi-bin/agent/set_workbench_data?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| agentid | 是 | int | 应用 id |
| userid | 是 | string | 用户 userid |
| type | 是 | string | 模版类型 |
| keydata/image/list/webview | 是 | object | 对应模板类型的数据（结构同 W1） |

**说明**：为单个用户设置个性化工作台数据。若企业设置了 `replace_user_data=true`，则个人数据会被企业级数据覆盖。

---

### W4. 批量设置用户工作台数据

```
POST https://qyapi.weixin.qq.com/cgi-bin/agent/batch_set_workbench_data?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| agentid | 是 | int | 应用 id |
| userid_list | 是 | array | 用户 userid 列表 |
| type | 是 | string | 模版类型 |
| keydata/image/list/webview | 是 | object | 对应模板类型的数据 |

**频率限制**：**100,000 人次/分钟**

---

### W5. 获取用户工作台数据

```
POST https://qyapi.weixin.qq.com/cgi-bin/agent/get_workbench_data?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| agentid | 是 | int | 应用 id |
| userid | 是 | string | 用户 userid |

**返回**：与 W2 结构一致，返回该用户的工作台数据。若用户无个人数据，返回企业级默认数据。

---

## 5. Callbacks (菜单事件回调)

当用户点击自定义菜单的非跳转类按钮时，企业微信会将事件推送到应用的回调 URL。事件格式为 XML（参考 `wecom-message` SKILL 的回调协议）。

### 5.1 click 事件

用户点击 `click` 类型按钮后推送：

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[click]]></Event>
    <EventKey><![CDATA[V1001_TODAY_MUSIC]]></EventKey>
    <AgentID>1</AgentID>
</xml>
```

| 参数 | 说明 |
|------|------|
| Event | click |
| EventKey | 与创建菜单时的 `key` 值对应 |

### 5.2 view 事件

用户点击 `view` 类型按钮后推送（跳转后）：

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[view]]></Event>
    <EventKey><![CDATA[https://www.example.com/]]></EventKey>
    <AgentID>1</AgentID>
</xml>
```

### 5.3 scancode_push / scancode_waitmsg 事件

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[scancode_push]]></Event>
    <EventKey><![CDATA[rselfmenu_0_1]]></EventKey>
    <ScanCodeInfo>
        <ScanType><![CDATA[qrcode]]></ScanType>
        <ScanResult><![CDATA[https://example.com]]></ScanResult>
    </ScanCodeInfo>
    <AgentID>1</AgentID>
</xml>
```

### 5.4 pic_sysphoto / pic_photo_or_album / pic_weixin 事件

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[pic_sysphoto]]></Event>
    <EventKey><![CDATA[rselfmenu_1_0]]></EventKey>
    <SendPicsInfo>
        <Count>1</Count>
        <PicList>
            <item>
                <PicMd5Sum><![CDATA[md5_value]]></PicMd5Sum>
            </item>
        </PicList>
    </SendPicsInfo>
    <AgentID>1</AgentID>
</xml>
```

### 5.5 location_select 事件

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[location_select]]></Event>
    <EventKey><![CDATA[rselfmenu_2_0]]></EventKey>
    <SendLocationInfo>
        <Location_X><![CDATA[23.134]]></Location_X>
        <Location_Y><![CDATA[113.358]]></Location_Y>
        <Scale><![CDATA[15]]></Scale>
        <Label><![CDATA[广东省广州市]]></Label>
        <Poiname><![CDATA[某地标]]></Poiname>
    </SendLocationInfo>
    <AgentID>1</AgentID>
</xml>
```

### 5.6 enter_agent 事件

当应用设置 `isreportenter=1` 后，用户进入应用时推送：

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[enter_agent]]></Event>
    <EventKey><![CDATA[]]></EventKey>
    <AgentID>1</AgentID>
</xml>
```

### 5.7 LOCATION 上报事件

当应用设置 `report_location_flag=1` 后，用户进入应用会话时上报位置：

```xml
<xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[UserID]]></FromUserName>
    <CreateTime>1348831860</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[LOCATION]]></Event>
    <Latitude>23.134</Latitude>
    <Longitude>113.358</Longitude>
    <Precision>100.0</Precision>
    <AgentID>1</AgentID>
</xml>
```

---

## 6. Workflows

### 6.1 应用初始化配置流程

```
1. 获取应用信息 (A1)
   └── 确认 agentid、可见范围、当前配置

2. 设置应用基础信息 (A2)
   ├── 配置 name / description
   ├── 上传头像 logo_media_id（需先调用素材管理上传）
   ├── 配置 redirect_domain（需先通过域名校验）
   ├── 配置 home_url
   └── 开启 isreportenter / report_location_flag（按需）

3. 创建自定义菜单 (M1)
   └── 配置底部菜单按钮（最多 3 个一级、每级最多 5 个二级）

4. 设置工作台展示 (W1)
   ├── 选择模版类型 (keydata/image/list/webview)
   └── 配置企业级默认数据
```

### 6.2 工作台个性化数据流程

```
1. 设置企业级工作台模版 (W1)
   └── type + 模板数据 + replace_user_data=false

2. 为特定用户设置个性化数据 (W3)
   └── 按 userid 设置不同的工作台数据

3. 批量设置用户数据 (W4)
   └── 批量更新用户工作台（≤100,000 人次/分钟）

4. 查询用户当前数据 (W5)
   └── 确认用户看到的实际数据
```

### 6.3 菜单事件处理流程

```
用户点击菜单
├── click → 回调 URL 收到 click 事件 → 根据 EventKey 执行业务逻辑
├── view → 直接跳转 URL（可能收到 view 事件推送）
├── scancode_* → 回调收到扫码结果 → 处理 ScanResult
├── pic_* → 回调收到图片信息 → 根据 PicMd5Sum 获取图片
├── location_select → 回调收到位置信息 → 处理经纬度
└── view_miniprogram → 直接跳转小程序（无事件推送）
```

---

## 7. Code Templates

### 7.1 Python

```python
"""WeCom App Management Client"""

from dataclasses import dataclass, field
from typing import Optional
import httpx  # or requests


BASE_URL = "https://qyapi.weixin.qq.com"


@dataclass
class MenuButton:
    """菜单按钮"""
    type: str
    name: str
    key: str = ""
    url: str = ""
    media_id: str = ""
    appid: str = ""
    pagepath: str = ""
    sub_button: list["MenuButton"] = field(default_factory=list)

    def to_dict(self) -> dict:
        d: dict = {"name": self.name}
        if self.sub_button:
            d["sub_button"] = [b.to_dict() for b in self.sub_button]
            return d  # 有子菜单时忽略 type
        d["type"] = self.type
        if self.type == "view":
            d["url"] = self.url
        elif self.type == "view_miniprogram":
            d["appid"] = self.appid
            d["pagepath"] = self.pagepath
        else:
            d["key"] = self.key
        return d


@dataclass
class WorkbenchTemplate:
    """工作台模版"""
    type: str  # keydata / image / list / webview / normal
    data: Optional[dict] = None
    replace_user_data: bool = False

    def to_dict(self, agentid: int) -> dict:
        d: dict = {"agentid": agentid, "type": self.type}
        if self.type != "normal" and self.data:
            d[self.type] = self.data
        if self.replace_user_data:
            d["replace_user_data"] = True
        return d


class WeComApp:
    """企业微信应用管理客户端"""

    def __init__(self, corpid: str, corpsecret: str):
        self.corpid = corpid
        self.corpsecret = corpsecret
        self._client = httpx.Client(base_url=BASE_URL, timeout=10)
        self._token: Optional[str] = None

    def _get_token(self) -> str:
        """获取 access_token（生产环境应加缓存）"""
        if self._token:
            return self._token
        resp = self._client.get(
            "/cgi-bin/gettoken",
            params={"corpid": self.corpid, "corpsecret": self.corpsecret},
        )
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"Token error: {data}")
        self._token = data["access_token"]
        return self._token

    def _request(self, method: str, path: str, **kwargs) -> dict:
        """通用请求"""
        params = kwargs.pop("params", {})
        params["access_token"] = self._get_token()
        resp = self._client.request(method, path, params=params, **kwargs)
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise RuntimeError(f"API error: {data}")
        return data

    # ── 应用基础管理 ──

    def get_agent(self, agentid: int) -> dict:
        """A1: 获取应用"""
        return self._request("GET", "/cgi-bin/agent/get", params={"agentid": agentid})

    def set_agent(self, agentid: int, **kwargs) -> dict:
        """A2: 设置应用
        kwargs: name, description, redirect_domain, logo_media_id,
                report_location_flag, isreportenter, home_url
        """
        body = {"agentid": agentid, **kwargs}
        return self._request("POST", "/cgi-bin/agent/set", json=body)

    def list_agents(self) -> list[dict]:
        """A3: 获取应用列表"""
        data = self._request("GET", "/cgi-bin/agent/list")
        return data.get("agentlist", [])

    # ── 自定义菜单 ──

    def create_menu(self, agentid: int, buttons: list[MenuButton]) -> dict:
        """M1: 创建菜单"""
        body = {"button": [b.to_dict() for b in buttons]}
        return self._request(
            "POST", "/cgi-bin/menu/create", params={"agentid": agentid}, json=body
        )

    def get_menu(self, agentid: int) -> dict:
        """M2: 获取菜单"""
        return self._request("GET", "/cgi-bin/menu/get", params={"agentid": agentid})

    def delete_menu(self, agentid: int) -> dict:
        """M3: 删除菜单"""
        return self._request("GET", "/cgi-bin/menu/delete", params={"agentid": agentid})

    # ── 工作台自定义展示 ──

    def set_workbench_template(self, agentid: int, template: WorkbenchTemplate) -> dict:
        """W1: 设置工作台模版"""
        return self._request(
            "POST", "/cgi-bin/agent/set_workbench_template", json=template.to_dict(agentid)
        )

    def get_workbench_template(self, agentid: int) -> dict:
        """W2: 获取工作台模版"""
        return self._request(
            "POST", "/cgi-bin/agent/get_workbench_template", json={"agentid": agentid}
        )

    def set_workbench_data(
        self, agentid: int, userid: str, type_: str, data: dict
    ) -> dict:
        """W3: 设置用户工作台数据"""
        body: dict = {"agentid": agentid, "userid": userid, "type": type_, type_: data}
        return self._request("POST", "/cgi-bin/agent/set_workbench_data", json=body)

    def batch_set_workbench_data(
        self, agentid: int, userid_list: list[str], type_: str, data: dict
    ) -> dict:
        """W4: 批量设置用户工作台数据（≤100,000 人次/分钟）"""
        body: dict = {
            "agentid": agentid,
            "userid_list": userid_list,
            "type": type_,
            type_: data,
        }
        return self._request(
            "POST", "/cgi-bin/agent/batch_set_workbench_data", json=body
        )

    def get_workbench_data(self, agentid: int, userid: str) -> dict:
        """W5: 获取用户工作台数据"""
        return self._request(
            "POST", "/cgi-bin/agent/get_workbench_data",
            json={"agentid": agentid, "userid": userid},
        )
```

### 7.2 TypeScript

```typescript
/**
 * WeCom App Management Client
 */

const BASE_URL = "https://qyapi.weixin.qq.com";

// ── Types ──

interface MenuButton {
  type: string;
  name: string;
  key?: string;
  url?: string;
  media_id?: string;
  appid?: string;
  pagepath?: string;
  sub_button?: MenuButton[];
}

interface WorkbenchKeydata {
  items: Array<{
    key?: string;
    data: string;
    jump_url?: string;
    pagepath?: string;
  }>;
}

interface WorkbenchImage {
  url: string;
  jump_url?: string;
  pagepath?: string;
}

interface WorkbenchList {
  items: Array<{
    title: string;
    jump_url?: string;
    pagepath?: string;
  }>;
}

interface WorkbenchWebview {
  url: string;
  jump_url?: string;
  pagepath?: string;
  height?: "single_row" | "double_row";
  hide_title?: boolean;
  enable_webview_click?: boolean;
}

type WorkbenchType = "keydata" | "image" | "list" | "webview" | "normal";

interface AgentInfo {
  agentid: number;
  name: string;
  square_logo_url: string;
  description: string;
  allow_userinfos: { user: Array<{ userid: string }> };
  allow_partys: { partyid: number[] };
  allow_tags: { tagid: number[] };
  close: number;
  redirect_domain: string;
  report_location_flag: number;
  isreportenter: number;
  home_url: string;
}

interface SetAgentParams {
  agentid: number;
  name?: string;
  description?: string;
  redirect_domain?: string;
  logo_media_id?: string;
  report_location_flag?: number;
  isreportenter?: number;
  home_url?: string;
}

// ── Client ──

class WeComApp {
  private corpid: string;
  private corpsecret: string;
  private token?: string;

  constructor(corpid: string, corpsecret: string) {
    this.corpid = corpid;
    this.corpsecret = corpsecret;
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;
    const url = `${BASE_URL}/cgi-bin/gettoken?corpid=${this.corpid}&corpsecret=${this.corpsecret}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`Token error: ${JSON.stringify(data)}`);
    this.token = data.access_token;
    return this.token;
  }

  private async request(method: string, path: string, body?: object, extraParams?: Record<string, string>): Promise<any> {
    const token = await this.getToken();
    const params = new URLSearchParams({ access_token: token, ...extraParams });
    const url = `${BASE_URL}${path}?${params}`;
    const opts: RequestInit = { method };
    if (body) {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
    const resp = await fetch(url, opts);
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`API error: ${JSON.stringify(data)}`);
    return data;
  }

  // ── App Management ──

  async getAgent(agentid: number): Promise<AgentInfo> {
    return this.request("GET", "/cgi-bin/agent/get", undefined, { agentid: String(agentid) });
  }

  async setAgent(params: SetAgentParams): Promise<void> {
    await this.request("POST", "/cgi-bin/agent/set", params);
  }

  async listAgents(): Promise<Array<{ agentid: number; name: string; square_logo_url: string }>> {
    const data = await this.request("GET", "/cgi-bin/agent/list");
    return data.agentlist || [];
  }

  // ── Menu ──

  async createMenu(agentid: number, buttons: MenuButton[]): Promise<void> {
    await this.request("POST", "/cgi-bin/menu/create", { button: buttons }, { agentid: String(agentid) });
  }

  async getMenu(agentid: number): Promise<{ button: MenuButton[] }> {
    return this.request("GET", "/cgi-bin/menu/get", undefined, { agentid: String(agentid) });
  }

  async deleteMenu(agentid: number): Promise<void> {
    await this.request("GET", "/cgi-bin/menu/delete", undefined, { agentid: String(agentid) });
  }

  // ── Workbench ──

  async setWorkbenchTemplate(
    agentid: number,
    type: WorkbenchType,
    data?: WorkbenchKeydata | WorkbenchImage | WorkbenchList | WorkbenchWebview,
    replaceUserData = false
  ): Promise<void> {
    const body: Record<string, any> = { agentid, type };
    if (type !== "normal" && data) body[type] = data;
    if (replaceUserData) body.replace_user_data = true;
    await this.request("POST", "/cgi-bin/agent/set_workbench_template", body);
  }

  async getWorkbenchTemplate(agentid: number): Promise<any> {
    return this.request("POST", "/cgi-bin/agent/get_workbench_template", { agentid });
  }

  async setWorkbenchData(agentid: number, userid: string, type: WorkbenchType, data: any): Promise<void> {
    const body: Record<string, any> = { agentid, userid, type, [type]: data };
    await this.request("POST", "/cgi-bin/agent/set_workbench_data", body);
  }

  async batchSetWorkbenchData(agentid: number, useridList: string[], type: WorkbenchType, data: any): Promise<void> {
    const body: Record<string, any> = { agentid, userid_list: useridList, type, [type]: data };
    await this.request("POST", "/cgi-bin/agent/batch_set_workbench_data", body);
  }

  async getWorkbenchData(agentid: number, userid: string): Promise<any> {
    return this.request("POST", "/cgi-bin/agent/get_workbench_data", { agentid, userid });
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const baseURL = "https://qyapi.weixin.qq.com"

// AppClient 应用管理客户端
type AppClient struct {
	CorpID     string
	CorpSecret string
	token      string
	client     *http.Client
}

// NewAppClient 创建应用管理客户端
func NewAppClient(corpID, corpSecret string) *AppClient {
	return &AppClient{
		CorpID:     corpID,
		CorpSecret: corpSecret,
		client:     &http.Client{},
	}
}

func (c *AppClient) getToken() (string, error) {
	if c.token != "" {
		return c.token, nil
	}
	u := fmt.Sprintf("%s/cgi-bin/gettoken?corpid=%s&corpsecret=%s", baseURL, c.CorpID, c.CorpSecret)
	resp, err := c.client.Get(u)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		ErrCode     int    `json:"errcode"`
		ErrMsg      string `json:"errmsg"`
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.ErrCode != 0 {
		return "", fmt.Errorf("token error: %s", result.ErrMsg)
	}
	c.token = result.AccessToken
	return c.token, nil
}

func (c *AppClient) doRequest(method, path string, body interface{}, extraParams map[string]string) (map[string]interface{}, error) {
	token, err := c.getToken()
	if err != nil {
		return nil, err
	}
	params := url.Values{"access_token": {token}}
	for k, v := range extraParams {
		params.Set(k, v)
	}
	u := fmt.Sprintf("%s%s?%s", baseURL, path, params.Encode())

	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, u, reqBody)
	if err != nil {
		return nil, err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if code, ok := result["errcode"].(float64); ok && code != 0 {
		return nil, fmt.Errorf("API error %v: %v", code, result["errmsg"])
	}
	return result, nil
}

// GetAgent A1: 获取应用
func (c *AppClient) GetAgent(agentID int) (map[string]interface{}, error) {
	return c.doRequest("GET", "/cgi-bin/agent/get", nil, map[string]string{"agentid": fmt.Sprintf("%d", agentID)})
}

// SetAgent A2: 设置应用
func (c *AppClient) SetAgent(params map[string]interface{}) (map[string]interface{}, error) {
	return c.doRequest("POST", "/cgi-bin/agent/set", params, nil)
}

// ListAgents A3: 获取应用列表
func (c *AppClient) ListAgents() (map[string]interface{}, error) {
	return c.doRequest("GET", "/cgi-bin/agent/list", nil, nil)
}

// CreateMenu M1: 创建菜单
func (c *AppClient) CreateMenu(agentID int, buttons []map[string]interface{}) (map[string]interface{}, error) {
	body := map[string]interface{}{"button": buttons}
	return c.doRequest("POST", "/cgi-bin/menu/create", body, map[string]string{"agentid": fmt.Sprintf("%d", agentID)})
}

// GetMenu M2: 获取菜单
func (c *AppClient) GetMenu(agentID int) (map[string]interface{}, error) {
	return c.doRequest("GET", "/cgi-bin/menu/get", nil, map[string]string{"agentid": fmt.Sprintf("%d", agentID)})
}

// DeleteMenu M3: 删除菜单
func (c *AppClient) DeleteMenu(agentID int) (map[string]interface{}, error) {
	return c.doRequest("GET", "/cgi-bin/menu/delete", nil, map[string]string{"agentid": fmt.Sprintf("%d", agentID)})
}

// SetWorkbenchTemplate W1: 设置工作台模版
func (c *AppClient) SetWorkbenchTemplate(body map[string]interface{}) (map[string]interface{}, error) {
	return c.doRequest("POST", "/cgi-bin/agent/set_workbench_template", body, nil)
}

// GetWorkbenchTemplate W2: 获取工作台模版
func (c *AppClient) GetWorkbenchTemplate(agentID int) (map[string]interface{}, error) {
	return c.doRequest("POST", "/cgi-bin/agent/get_workbench_template", map[string]interface{}{"agentid": agentID}, nil)
}

// SetWorkbenchData W3: 设置用户工作台数据
func (c *AppClient) SetWorkbenchData(body map[string]interface{}) (map[string]interface{}, error) {
	return c.doRequest("POST", "/cgi-bin/agent/set_workbench_data", body, nil)
}

// BatchSetWorkbenchData W4: 批量设置用户工作台数据
func (c *AppClient) BatchSetWorkbenchData(body map[string]interface{}) (map[string]interface{}, error) {
	return c.doRequest("POST", "/cgi-bin/agent/batch_set_workbench_data", body, nil)
}

// GetWorkbenchData W5: 获取用户工作台数据
func (c *AppClient) GetWorkbenchData(agentID int, userID string) (map[string]interface{}, error) {
	return c.doRequest("POST", "/cgi-bin/agent/get_workbench_data", map[string]interface{}{"agentid": agentID, "userid": userID}, nil)
}
```

---


### 7.4 Java 示例

```java
public class WeComAppService {
    private final WeComClient client;

    public WeComAppService(WeComClient client) {
        this.client = client;
    }

    /** 获取应用详情 */
    public JsonObject getApp(String agentId) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("agentid", agentId);
        return client.post("/agent/get", body);
    }

    /** 设置应用菜单 */
    public void setMenu(String agentId, JsonArray buttons) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("agentid", agentId);
        body.add("button", buttons);
        client.post("/menu/create", body);
    }

    /** 设置工作台模板 */
    public void setWorkbenchTemplate(String agentId, String type, JsonObject data) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("agentid", agentId);
        body.addProperty("type", type);
        body.add(type, data);
        client.post("/agent/set_workbench_template", body);
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
class WeComAppService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 获取应用详情 */
    public function getApp(string $agentId): array
    {
        return $this->client->get('/cgi-bin/agent/get', ['agentid' => $agentId]);
    }

    /** 设置应用菜单 */
    public function setMenu(string $agentId, array $buttons): array
    {
        return $this->client->post('/cgi-bin/menu/create', [
            'agentid' => $agentId,
            'button'  => $buttons,
        ]);
    }

    /** 设置工作台模板 */
    public function setWorkbenchTemplate(string $agentId, string $type, array $data): array
    {
        return $this->client->post('/cgi-bin/agent/set_workbench_template', array_merge(
            ['agentid' => $agentId, 'type' => $type],
            [$type => $data]
        ));
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 8. Test Templates

### 8.1 Python (pytest)

```python
"""Tests for WeComApp client"""
import pytest
from unittest.mock import patch, MagicMock
# from your_module import WeComApp, MenuButton, WorkbenchTemplate


@pytest.fixture
def client():
    app = WeComApp("corp_id", "corp_secret")
    app._token = "test_token"  # skip token fetch
    return app


@pytest.fixture
def mock_response():
    def _make(data: dict):
        mock = MagicMock()
        mock.json.return_value = data
        return mock
    return _make


class TestAgentManagement:
    """应用基础管理测试"""

    def test_get_agent(self, client, mock_response):
        with patch.object(client._client, "request", return_value=mock_response({
            "errcode": 0, "errmsg": "ok",
            "agentid": 1000005, "name": "HR助手",
            "close": 0, "isreportenter": 0,
        })):
            result = client.get_agent(1000005)
            assert result["agentid"] == 1000005
            assert result["name"] == "HR助手"

    def test_set_agent(self, client, mock_response):
        with patch.object(client._client, "request", return_value=mock_response({
            "errcode": 0, "errmsg": "ok",
        })):
            result = client.set_agent(1000005, name="新名称", description="新描述")
            assert result["errcode"] == 0

    def test_set_agent_invalid_domain(self, client, mock_response):
        """域名未通过校验应返回 85005"""
        with patch.object(client._client, "request", return_value=mock_response({
            "errcode": 85005, "errmsg": "redirect_domain not verified",
        })):
            with pytest.raises(RuntimeError, match="85005"):
                client.set_agent(1000005, redirect_domain="bad.domain.com")

    def test_list_agents(self, client, mock_response):
        with patch.object(client._client, "request", return_value=mock_response({
            "errcode": 0, "errmsg": "ok",
            "agentlist": [
                {"agentid": 1000005, "name": "HR助手", "square_logo_url": "..."},
            ],
        })):
            agents = client.list_agents()
            assert len(agents) == 1
            assert agents[0]["agentid"] == 1000005


class TestMenuManagement:
    """自定义菜单测试"""

    def test_create_menu_with_sub_buttons(self, client, mock_response):
        buttons = [
            MenuButton(type="click", name="今日", key="TODAY"),
            MenuButton(
                type="",  # 有子菜单时忽略
                name="更多",
                sub_button=[
                    MenuButton(type="view", name="搜索", url="https://www.soso.com/"),
                    MenuButton(type="click", name="赞", key="GOOD"),
                ],
            ),
        ]
        with patch.object(client._client, "request", return_value=mock_response({
            "errcode": 0, "errmsg": "ok",
        })):
            result = client.create_menu(1000005, buttons)
            assert result["errcode"] == 0

    def test_menu_button_to_dict_with_sub(self):
        """有子菜单时不应包含 type 字段"""
        btn = MenuButton(
            type="click", name="父菜单",
            sub_button=[MenuButton(type="view", name="子菜单", url="https://example.com")],
        )
        d = btn.to_dict()
        assert "type" not in d
        assert "sub_button" in d
        assert d["sub_button"][0]["type"] == "view"

    def test_menu_button_name_length_limit(self):
        """菜单名称长度校验（应在业务层验证）"""
        # 一级菜单 ≤ 16 字节 (4 汉字)
        name_ok = "今日歌曲"  # 12 bytes UTF-8
        name_too_long = "今日歌曲推荐列表"  # 24 bytes
        assert len(name_ok.encode("utf-8")) <= 16
        assert len(name_too_long.encode("utf-8")) > 16


class TestWorkbench:
    """工作台自定义展示测试"""

    def test_set_keydata_template(self, client, mock_response):
        template = WorkbenchTemplate(
            type="keydata",
            data={"items": [
                {"key": "待审批", "data": "2", "jump_url": "https://example.com/approval"},
                {"key": "已通过", "data": "100"},
            ]},
        )
        with patch.object(client._client, "request", return_value=mock_response({
            "errcode": 0, "errmsg": "ok",
        })):
            result = client.set_workbench_template(1000005, template)
            assert result["errcode"] == 0

    def test_set_normal_cancels_custom(self, client, mock_response):
        """type=normal 应取消自定义展示"""
        template = WorkbenchTemplate(type="normal")
        d = template.to_dict(1000005)
        assert d["type"] == "normal"
        assert "keydata" not in d
        assert "image" not in d

    def test_keydata_max_4_items(self):
        """keydata 最多 4 项（应在业务层验证）"""
        items = [{"key": f"k{i}", "data": str(i)} for i in range(5)]
        assert len(items) > 4  # 超出限制

    def test_image_aspect_ratio_note(self):
        """图片最佳比例 3.35:1（文档标注）"""
        # 此为提示性测试，确保开发者知晓
        recommended_ratio = 3.35
        width, height = 670, 200
        actual_ratio = width / height
        assert abs(actual_ratio - recommended_ratio) < 0.1

    def test_batch_set_rate_limit_awareness(self):
        """批量设置限制 100,000 人次/分钟"""
        max_per_minute = 100_000
        user_count = 50_000
        assert user_count <= max_per_minute

    def test_replace_user_data_flag(self, client, mock_response):
        """replace_user_data=true 时企业级数据覆盖个人数据"""
        template = WorkbenchTemplate(
            type="image",
            data={"url": "https://example.com/img.png"},
            replace_user_data=True,
        )
        d = template.to_dict(1000005)
        assert d["replace_user_data"] is True
```

---

## 9. Code Review Checklist

在 review 涉及 wecom-app 的代码时，逐项检查：

### 9.1 应用管理

| # | 检查项 | 严重度 |
|---|--------|--------|
| R1 | `access_token` 是否使用对应应用的 token（非通讯录 token） | CRITICAL |
| R2 | `agentid` 是否正确传递（GET 请求在 query，POST 请求在 body） | HIGH |
| R3 | `set_agent` 的 `description` 是否在 4~120 字符范围内 | MEDIUM |
| R4 | `redirect_domain` 是否已通过域名校验（否则 JSSDK 受限，85005） | HIGH |
| R5 | `logo_media_id` 是否通过素材管理接口获取（临时素材 3 天过期） | MEDIUM |

### 9.2 自定义菜单

| # | 检查项 | 严重度 |
|---|--------|--------|
| R6 | 一级菜单是否 ≤ 3 个 | HIGH |
| R7 | 二级菜单是否 ≤ 5 个 | HIGH |
| R8 | 一级菜单名称是否 ≤ 16 字节，二级 ≤ 40 字节 | MEDIUM |
| R9 | `click` 类型是否设置了 `key`，`view` 类型是否设置了 `url` | HIGH |
| R10 | `view_miniprogram` 是否同时设置了 `appid` 和 `pagepath` | HIGH |
| R11 | 是否处理了菜单事件回调（click/scancode/pic/location） | HIGH |
| R12 | 是否意识到菜单创建后 **24 小时**客户端缓存延迟 | LOW |

### 9.3 工作台

| # | 检查项 | 严重度 |
|---|--------|--------|
| R13 | `keydata` items 是否 ≤ 4 个 | HIGH |
| R14 | `list` items 是否 ≤ 3 个 | HIGH |
| R15 | `image` 图片是否接近 3.35:1 比例 | LOW |
| R16 | `jump_url` 和 `pagepath` 是否互斥（网页用 jump_url，小程序用 pagepath） | HIGH |
| R17 | `replace_user_data` 的影响是否被理解（true 会覆盖个人数据） | MEDIUM |
| R18 | `batch_set_workbench_data` 是否考虑 100,000 人次/分钟的频率限制 | MEDIUM |
| R19 | 取消自定义时是否使用 `type="normal"` 而非删除模版 | MEDIUM |

### 9.4 通用

| # | 检查项 | 严重度 |
|---|--------|--------|
| R20 | 是否正确处理 `errcode != 0` 的错误响应 | CRITICAL |
| R21 | 是否有 `access_token` 过期重试机制（42001） | HIGH |
| R22 | 第三方应用是否误调用了仅企业可用的菜单接口 | HIGH |

---

## 10. Gotcha Guide

### G1. agentid 传递位置不一致

菜单接口的 `agentid` 在 **query string** 中传递，而工作台接口的 `agentid` 在 **request body** 中传递。混淆会导致 `41002`（缺少 corpid）或 `301002`（无权限）。

```
菜单: POST /cgi-bin/menu/create?access_token=TOKEN&agentid=1000005
工作台: POST /cgi-bin/agent/set_workbench_template  body: {"agentid": 1000005, ...}
```

### G2. 菜单 24 小时缓存延迟

创建/修改/删除菜单后，由于企业微信客户端本地缓存，最长需要 **24 小时**后用户端才会展示最新菜单。开发测试时可通过「取消关注 → 重新关注」绕过缓存。不要因为菜单未立即生效就重复调用创建接口。

### G3. 有子菜单的按钮会忽略 type

当一级菜单包含 `sub_button` 时，该一级菜单的 `type`、`key`、`url` 等字段会被**忽略**。代码中如果设置了这些字段不会报错，但会造成开发者困惑。建议在序列化时主动过滤。

### G4. 菜单名称按字节计算

菜单名称限制是按**字节**计算，不是按字符。官方文档明确标注：
- 一级菜单 ≤ 16 字节 → 最多 **4 个汉字**
- 二级菜单 ≤ 40 字节 → 最多 **8 个汉字**

超出部分以 `...` 截断显示，不会报错。

### G5. jump_url 与 pagepath 互斥

工作台模版中的 `jump_url`（网页跳转）和 `pagepath`（小程序跳转）是**互斥**的：
- 应用主页为网页 → 只能用 `jump_url`
- 应用主页为小程序 → 只能用 `pagepath`

同时传两个不会报错，但行为不可预期。

### G6. replace_user_data 的覆盖语义

`replace_user_data=true` 意味着**企业级数据覆盖个人数据**：即使已为某用户通过 W3/W4 设置了个性化数据，该用户也会看到企业级的统一数据。不设置或设为 false 时，有个人数据的用户会看个人数据，没有的看企业级数据。

### G7. type=normal 取消自定义

取消工作台自定义展示不是"删除模版"，而是将 `type` 设为 `"normal"`。此时不需要传模版数据体（keydata/image/list/webview）。

### G8. 批量设置工作台频率限制

`batch_set_workbench_data` 接口限制 **100,000 人次/分钟**。"人次" = `userid_list` 的长度。若企业有 20 万员工，单次最多传 100,000 个 userid，且每分钟只能调用一次。建议分批处理并加退避。

### G9. 自定义菜单仅企业可调用

菜单的创建/获取/删除三个接口**仅企业自建应用可调用**，第三方 ISV 应用不可调用。如果你的应用是第三方应用，无法使用这三个接口，需在企业微信管理后台手动配置菜单。

### G10. 应用列表仅返回有权限的自建应用

`list_agents`（A3）返回的列表**仅包含当前 access_token 有 API 权限的自建应用**，不包含基础应用和第三方应用。如果用通讯录 token 调用，返回的列表为空。

---

## 11. References

| doc_id | 标题 | 说明 |
|--------|------|------|
| 90227 | 获取应用 | 应用详情查询 + 应用列表 |
| 90228 | 设置应用 | 修改应用基础信息 |
| 90229 | 创建菜单 | 自定义菜单创建 |
| 90230 | 获取菜单 | 查询当前菜单配置 |
| 90231 | 删除菜单 | 删除自定义菜单 |
| 90232 | 设置工作台自定义展示 | 工作台模版 + 用户数据 |
| 92535 | 工作台模板类型 | 4 种模版类型数据结构 |
| 92536 | 获取工作台展示模版 | 查询当前工作台配置 |

**官方文档入口**：`https://developer.work.weixin.qq.com/document/path/{doc_id}`

**依赖 SKILL**：`wecom-core`（Token 管理、错误处理、请求基础设施）


