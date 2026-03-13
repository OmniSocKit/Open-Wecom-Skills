---
name: wecom-message
description: |
  企业微信消息管理 SKILL。应用消息发送、接收消息回调、被动回复、群聊管理、撤回消息、模板卡片更新、群机器人 Webhook。
  TRIGGER: 当用户提到发消息、推送通知、群聊、回调、被动回复、模板卡片、webhook、机器人、撤回消息等相关开发时触发。
  依赖 wecom-core 基座 SKILL。
---

# 企业微信 - 消息管理 (wecom-message)

你现在是企业微信消息管理专家。基于本 SKILL 的知识，帮助开发者正确地发送、接收和管理企业微信消息。

---

## 1. 前置条件

- **依赖**: wecom-core（认证体系、代码生成规范、测试规范、审核规范）
- **所需权限**: 应用的 secret（管理后台 → 应用管理 → 对应应用 → Secret）
- **适用场景**: 通过企业自建应用向成员推送消息、接收成员消息、管理群聊、使用群机器人

### 权限说明

| 应用类型 | 发送消息 | 接收消息 | 群聊管理 | 备注 |
|---------|---------|---------|---------|------|
| 企业自建应用 | 可见范围内 | 需配置回调URL | 需可见范围为根部门 | 使用应用 secret |
| 第三方应用 | 授权范围内 | 需配置回调URL | 不支持 | 使用 suite_access_token |
| 企业关联小程序 | 可见范围内 | 不支持 | 不支持 | 2021年2月4日起支持发送 |

### 频率限制（关键）

| 维度 | 限制 | 说明 |
|------|------|------|
| 每应用每天 | 账号上限数 × 200 人次 | 发1次给1000人 = 1000人次 |
| 每应用对同一成员 | ≤ 30次/分钟, ≤ 1000次/小时 | 超过部分丢弃不下发 |
| 群聊消息 | ≤ 2万人次/分钟 | 群100人发1次 = 100人次 |
| 群聊成员维度 | ≤ 200条/分钟, ≤ 1万条/天 | 跨群累计，超过丢弃，接口不报错 |
| 未认证/小型企业 | ≤ 15万人次/小时 | 群聊消息额外限制 |
| 中型企业 | ≤ 35万人次/小时 | 群聊消息额外限制 |
| 大型企业 | ≤ 70万人次/小时 | 群聊消息额外限制 |
| 群创建 | ≤ 1000个/天/企业 | — |

---

## 2. 核心概念

- **agentid**: 应用 id，整型。管理后台 → 应用管理 → 对应应用页面查看。发送消息的必填参数。
- **msgtype**: 消息类型标识。发送支持 text/image/voice/video/file/textcard/news/mpnews/markdown/miniprogram_notice/template_card。
- **touser/toparty/totag**: 消息接收方。分别为 userid（`|` 分隔，最多1000）、部门 id（`|` 分隔，最多100）、标签 id（`|` 分隔，最多100）。三者至少填一个，`@all` 表示全部。当 touser 为 `@all` 时，toparty 和 totag 会被忽略。
- **chatid**: 群聊唯一标志。0-9 及 a-zA-Z 组成，最长32字符。由 /appchat/create 返回或自定义。
- **media_id**: 媒体文件 id，通过上传临时素材接口获取，有效期3天。图片/语音/视频/文件消息必需。
- **msgid**: 消息 id，发送成功后返回，用于撤回消息。
- **response_code**: 模板卡片消息专属。仅按钮交互型、投票选择型、多项选择型，以及填写了 action_menu 的文本通知型和图文展示型返回。用户点击后回调返回，可用于更新卡片，72小时有效且只能使用一次。
- **safe**: 消息安全级别。0=可对外分享（默认），1=不能分享且内容显示水印，2=仅限在企业内分享（仅 mpnews 类型支持 safe=2，其他类型不支持）。
- **enable_duplicate_check**: 重复消息检查。设为1时，相同内容在 duplicate_check_interval（默认1800秒）内不重复发送。

### 消息架构三条通路

```
1. 主动发送：应用后台 → POST /message/send → 成员客户端
2. 接收消息：成员客户端 → 企业微信服务器 → POST 回调URL → 应用后台
3. 群聊推送：应用后台 → POST /appchat/send → 群聊（暂不支持接收群聊消息）
```

---

## 3. API 速查表

### 3.1 发送应用消息

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 发送应用消息 | POST | /message/send | touser/toparty/totag, msgtype, agentid | 否 |
| 撤回应用消息 | POST | /message/recall | msgid(必填) | 是 |
| 更新模板卡片消息 | POST | /message/update_template_card | userids/partyids/tagids, agentid, response_code | 否 |

### 3.2 接收消息与被动回复

| 操作 | 方法 | 触发方式 | 数据格式 | 说明 |
|------|------|----------|----------|------|
| 验证回调URL | GET | 管理端保存配置 | query params | 返回解密后的 echostr 明文 |
| 接收普通消息 | POST | 成员在应用中发消息 | XML(加密) | text/image/voice/video/location/link |
| 接收事件消息 | POST | 事件触发 | XML(加密) | subscribe/enter_agent/LOCATION/click/template_card_event 等 |
| 被动回复消息 | — | 回调响应中携带 | XML(加密) | text/image/voice/video/news/update_template_card |

### 3.3 群聊管理

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 创建群聊 | POST | /appchat/create | userlist(必填, 2~2000人) | 否 |
| 修改群聊 | POST | /appchat/update | chatid(必填) | 是 |
| 获取群聊 | GET | /appchat/get | chatid(必填) | 是 |
| 推送消息到群聊 | POST | /appchat/send | chatid(必填), msgtype(必填) | 否 |

### 3.4 群机器人 (Webhook)

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 发送群机器人消息 | POST | Webhook URL | msgtype(必填) | 否 |
| 上传群机器人文件 | POST | Webhook upload URL | media(file) | 否 |

---

## 4. API 详细说明

### 4.1 发送应用消息

`POST /cgi-bin/message/send?access_token=ACCESS_TOKEN`

**通用参数（所有消息类型共用）:**

| 参数 | 必须 | 说明 |
|------|------|------|
| touser | 否 | 成员ID列表，`\|`分隔，最多1000个。`@all`=全部成员 |
| toparty | 否 | 部门ID列表，`\|`分隔，最多100个 |
| totag | 否 | 标签ID列表，`\|`分隔，最多100个 |
| msgtype | 是 | 消息类型 |
| agentid | 是 | 应用id |
| safe | 否 | 0=可对外分享(默认), 1=不能分享且显示水印, 2=仅限企业内分享(仅mpnews) |
| enable_id_trans | 否 | 0=关闭(默认), 1=开启id转译 |
| enable_duplicate_check | 否 | 0=关闭(默认), 1=开启重复检查 |
| duplicate_check_interval | 否 | 重复检查间隔秒数，默认1800秒，最大不超过4小时 |

> **touser、toparty、totag 三者至少填一个。**

**返回字段:**

| 参数 | 说明 |
|------|------|
| errcode | 返回码。81013=全部接收人无权限或不存在 |
| invaliduser | 不合法的userid（小写） |
| invalidparty | 不合法的partyid |
| invalidtag | 不合法的标签id |
| unlicenseduser | 没有基础接口许可的userid |
| msgid | 消息id，用于撤回 |
| response_code | 仅按钮交互型、投票选择型、多项选择型，以及填写了 action_menu 的文本通知型和图文展示型模板卡片消息返回，72小时内有效且仅能使用一次 |

#### 4.1.1 文本消息 (text)

```json
{
   "touser": "UserID1|UserID2",
   "toparty": "PartyID1",
   "totag": "TagID1",
   "msgtype": "text",
   "agentid": 1,
   "text": {
       "content": "消息内容，支持换行符\\n，支持<a href=\"URL\">链接</a>"
   },
   "safe": 0,
   "enable_id_trans": 0,
   "enable_duplicate_check": 0,
   "duplicate_check_interval": 1800
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| content | 是 | 最长2048字节。支持`\n`换行、`<a>`链接标签 |

#### 4.1.2 图片消息 (image)

```json
{
   "touser": "UserID1",
   "msgtype": "image",
   "agentid": 1,
   "image": { "media_id": "MEDIA_ID" },
   "safe": 0
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| media_id | 是 | 通过上传临时素材接口获取 |

#### 4.1.3 语音消息 (voice)

```json
{
   "touser": "UserID1",
   "msgtype": "voice",
   "agentid": 1,
   "voice": { "media_id": "MEDIA_ID" }
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| media_id | 是 | 语音文件id，2MB以内，60s以内，AMR格式 |

#### 4.1.4 视频消息 (video)

```json
{
   "touser": "UserID1",
   "msgtype": "video",
   "agentid": 1,
   "video": {
       "media_id": "MEDIA_ID",
       "title": "Title",
       "description": "Description"
   },
   "safe": 0
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| media_id | 是 | 视频媒体文件id |
| title | 否 | 标题，≤128字节 |
| description | 否 | 描述，≤512字节 |

#### 4.1.5 文件消息 (file)

```json
{
   "touser": "UserID1",
   "msgtype": "file",
   "agentid": 1,
   "file": { "media_id": "MEDIA_ID" },
   "safe": 0
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| media_id | 是 | 文件id。保密消息仅支持 txt/pdf/doc/docx/ppt/pptx/xls/xlsx/xml/jpg/jpeg/png/bmp/gif |

#### 4.1.6 文本卡片消息 (textcard)

```json
{
   "touser": "UserID1",
   "msgtype": "textcard",
   "agentid": 1,
   "textcard": {
       "title": "领奖通知",
       "description": "<div class=\"gray\">2016年9月26日</div><div class=\"highlight\">请于10月10日前领取</div>",
       "url": "https://work.weixin.qq.com/",
       "btntxt": "更多"
   }
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| title | 是 | 标题，≤128字节 |
| description | 是 | 描述，≤512字节。支持`<br>`换行、`<div class="gray/highlight/normal">`三种颜色 |
| url | 是 | 点击后跳转的链接 |
| btntxt | 否 | 按钮文字，默认"详情"，≤4字 |

#### 4.1.7 图文消息 (news)

```json
{
   "touser": "UserID1",
   "msgtype": "news",
   "agentid": 1,
   "news": {
       "articles": [
           {
               "title": "标题",
               "description": "描述",
               "url": "https://example.com",
               "picurl": "https://example.com/pic.png"
           }
       ]
   }
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| articles | 是 | 1~8条图文 |
| title | 是 | 标题，≤128字节 |
| description | 否 | 描述，≤512字节 |
| url | 否 | 点击跳转链接，≤2048字节。url 和 appid/pagepath 必须填写其中一个 |
| picurl | 否 | 图片链接(JPG/PNG)。大图1068×455，小图150×150 |
| appid | 否 | 关联小程序的appid，必须与当前应用关联。appid 和 pagepath 必须同时填写，填写后忽略 url 字段 |
| pagepath | 否 | 小程序页面路径，≤128字节。appid 和 pagepath 必须同时填写 |

#### 4.1.8 图文消息 mpnews

与 news 的区别：图文内容存储在企业微信，每次发送视为不同图文，阅读/点赞独立统计。

```json
{
   "touser": "UserID1",
   "msgtype": "mpnews",
   "agentid": 1,
   "mpnews": {
       "articles": [
           {
               "title": "Title",
               "thumb_media_id": "MEDIA_ID",
               "author": "Author",
               "content_source_url": "https://example.com",
               "content": "<p>HTML内容</p>",
               "digest": "摘要"
           }
       ]
   },
   "safe": 0
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| title | 是 | 标题，≤128字节 |
| thumb_media_id | 是 | 缩略图media_id |
| author | 否 | 作者，≤64字节 |
| content_source_url | 否 | "阅读原文"跳转链接 |
| content | 是 | HTML内容，≤666KB |
| digest | 否 | 摘要，≤512字节 |

#### 4.1.9 markdown 消息

```json
{
   "touser": "UserID1",
   "msgtype": "markdown",
   "agentid": 1,
   "markdown": {
       "content": "# 标题\n> 引用\n**加粗** <font color=\"info\">绿色</font> <font color=\"warning\">橙色</font> <font color=\"comment\">灰色</font>"
   }
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| content | 是 | ≤2048字节，UTF-8。支持markdown子集 |

**支持的markdown语法**: 标题(1-6级)、加粗、链接、行内代码、引用、字体颜色(`<font color="info/comment/warning">`)。
**不支持**: 图片、表格、有序/无序列表（微信插件更不支持markdown）。

#### 4.1.10 小程序通知消息 (miniprogram_notice)

```json
{
   "touser": "UserID1",
   "msgtype": "miniprogram_notice",
   "agentid": 1,
   "miniprogram_notice": {
       "appid": "wx123456",
       "page": "pages/index",
       "title": "会议通知",
       "description": "4月27日 16:16",
       "emphasis_first_item": true,
       "content_item": [
           {"key": "会议室", "value": "402"},
           {"key": "参与人", "value": "张三"}
       ]
   }
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| appid | 是 | 关联小程序的appid |
| page | 否 | 小程序页面路径 |
| title | 是 | 通知标题 |
| description | 否 | 通知描述，≤4096字节 |
| emphasis_first_item | 否 | 是否放大首个content_item |
| content_item | 否 | key-value形式的通知内容 |

#### 4.1.11 模板卡片消息 (template_card)

模板卡片有5种子类型: text_notice / news_notice / button_interaction / vote_interaction / multiple_interaction。

**通用结构：**

```json
{
   "touser": "UserID1",
   "msgtype": "template_card",
   "agentid": 1,
   "template_card": {
       "card_type": "text_notice",
       "source": {
           "icon_url": "https://example.com/icon.png",
           "desc": "企业微信",
           "desc_color": 0
       },
       "action_menu": {
           "desc": "卡片副交互辅助文本说明",
           "action_list": [
               {"text": "接受推送", "key": "A"},
               {"text": "不再推送", "key": "B"}
           ]
       },
       "main_title": {
           "title": "标题",
           "desc": "副标题"
       },
       "task_id": "task_id_001",
       ...
   }
}
```

**5种子类型关键差异:**

| 子类型 | card_type | 特有字段 | 用途 |
|--------|-----------|----------|------|
| 文本通知型 | text_notice | emphasis_content, sub_title_text | 信息展示 |
| 图文展示型 | news_notice | card_image/image_text_area, vertical_content_list | 图文展示 |
| 按钮交互型 | button_interaction | button_list, button_selection | 按钮操作 |
| 投票选择型 | vote_interaction | checkbox | 投票 |
| 多项选择型 | multiple_interaction | select_list | 多选下拉 |

**button_interaction 详细字段结构：**

```json
{
    "card_type": "button_interaction",
    "source": { "icon_url": "...", "desc": "..." },
    "main_title": { "title": "标题", "desc": "描述" },
    "task_id": "task_001",
    "button_list": [
        {
            "text": "按钮1",
            "style": 1,
            "key": "btn_accept"
        },
        {
            "text": "按钮2",
            "style": 2,
            "key": "btn_reject"
        }
    ],
    "button_selection": {
        "question_key": "btn_question",
        "title": "请选择",
        "option_list": [
            { "id": "opt1", "text": "选项1" },
            { "id": "opt2", "text": "选项2" }
        ],
        "selected_id": "opt1"
    }
}
```

| 字段 | 类型 | 必须 | 说明 |
|------|------|------|------|
| button_list | array | 是 | 按钮数组，最多 **6 个** |
| button_list[].text | string | 是 | 按钮文案 |
| button_list[].style | int | 否 | 按钮样式：1=主要(蓝色)，2=次要(灰色)，默认1 |
| button_list[].key | string | 是 | 按钮 key，回调时返回，同一卡片内须唯一 |
| button_selection | object | 否 | 下拉菜单式按钮（与 button_list 二选一或配合使用） |
| button_selection.question_key | string | 是 | 下拉菜单 key |
| button_selection.title | string | 否 | 下拉标题 |
| button_selection.option_list | array | 是 | 选项列表 |
| button_selection.option_list[].id | string | 是 | 选项 ID |
| button_selection.option_list[].text | string | 是 | 选项文案 |
| button_selection.selected_id | string | 否 | 默认选中项 ID |

> 用户点击按钮后，企业微信回调事件中返回 `EventType=template_card_event`，`CardType=button_interaction`，`ResponseCode` 用于更新卡片，`SelectedItems.SelectedItem.OptionIds.OptionId` 包含用户选择。

> 模板卡片消息返回的 response_code 可用于后续调用更新模板卡片接口，72小时有效且仅能使用一次。

### 4.2 撤回应用消息

`POST /cgi-bin/message/recall?access_token=ACCESS_TOKEN`

```json
{ "msgid": "msgid_from_send_response" }
```

| 参数 | 必须 | 说明 |
|------|------|------|
| msgid | 是 | 发送消息时返回的msgid |

> 仅支持撤回24小时内发送的消息。撤回后，消息在成员端显示为"该消息已撤回"。

### 4.3 更新模板卡片消息

`POST /cgi-bin/message/update_template_card?access_token=ACCESS_TOKEN`

```json
{
    "userids": ["userid1", "userid2"],
    "partyids": [1, 2],
    "tagids": [1, 2],
    "atall": 0,
    "agentid": 1,
    "response_code": "response_code_from_callback",
    "button": {
        "replace_name": "已完成"
    }
}
```

**两种更新方式：**

1. **仅更新按钮文案** — 传 `button.replace_name`，按钮变为不可点击灰色状态
2. **替换整张卡片** — 传 `template_card` 对象（结构与发送时一致）

| 参数 | 必须 | 说明 |
|------|------|------|
| userids | 否 | 更新目标用户列表 |
| partyids | 否 | 更新目标部门列表 |
| tagids | 否 | 更新目标标签列表 |
| atall | 否 | 0=指定用户(默认), 1=全部 |
| agentid | 是 | 应用id |
| response_code | 是 | 回调事件返回的response_code |
| button | 否 | 仅更新按钮时使用 |
| template_card | 否 | 替换整张卡片时使用 |

### 4.4 群聊管理

#### 4.4.1 创建群聊会话

`POST /cgi-bin/appchat/create?access_token=ACCESS_TOKEN`

```json
{
    "name": "群聊名称",
    "owner": "userid1",
    "userlist": ["userid1", "userid2", "userid3"],
    "chatid": "CHATID"
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| name | 否 | 群聊名，≤50个UTF-8字符 |
| owner | 否 | 群主userid。不指定则随机选一人 |
| userlist | 是 | 成员userid列表。2~2000人 |
| chatid | 否 | 自定义群ID，0-9及a-zA-Z，≤32字符。不填则系统生成 |

**返回**: `{ "errcode": 0, "errmsg": "ok", "chatid": "CHATID" }`

**限制**: 群成员不超过管理端配置上限（最大2000人含应用），每企业 ≤ 1000群/天。

> 刚创建的群如果没有下发消息，在旧版本终端上可能不显示。

#### 4.4.2 修改群聊会话

`POST /cgi-bin/appchat/update?access_token=ACCESS_TOKEN`

```json
{
    "chatid": "CHATID",
    "name": "新群名",
    "owner": "userid2",
    "add_user_list": ["userid4"],
    "del_user_list": ["userid3"]
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| chatid | 是 | 群聊id |
| name | 否 | 新的群聊名，≤50个UTF-8字符 |
| owner | 否 | 新群主userid |
| add_user_list | 否 | 添加成员列表 |
| del_user_list | 否 | 踢出成员列表 |

#### 4.4.3 获取群聊会话

`GET /cgi-bin/appchat/get?access_token=ACCESS_TOKEN&chatid=CHATID`

| 参数 | 必须 | 说明 |
|------|------|------|
| chatid | 是 | 群聊id |

**返回**: `{ "errcode": 0, "chat_info": { "chatid": "...", "name": "...", "owner": "...", "userlist": [...] } }`

#### 4.4.4 推送消息到群聊

`POST /cgi-bin/appchat/send?access_token=ACCESS_TOKEN`

支持: text / image / voice / video / file / textcard / news / mpnews / markdown

```json
{
    "chatid": "CHATID",
    "msgtype": "text",
    "text": {
        "content": "消息内容",
        "mentioned_list": ["wangqing", "@all"]
    },
    "safe": 0
}
```

| 参数 | 必须 | 说明 |
|------|------|------|
| chatid | 是 | 群聊id。必须是该应用创建的群 |
| msgtype | 是 | 消息类型 |
| mentioned_list | 否 | 仅text类型。userid列表，提醒群中指定成员。`@all`提醒所有人 |
| safe | 否 | 0=可对外分享(默认), 1=不能分享且显示水印 |

> 群聊 text 的 content 支持 `\n` 换行和 `<@userid>` 语法@群成员（企业微信 5.0.6+）。

### 4.5 群机器人 Webhook

群机器人通过 Webhook URL 发送消息，无需 access_token。在群聊设置中添加机器人即可获得 Webhook 地址。

`POST https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=KEY`

**支持消息类型**: text / markdown / image / news / file / template_card

```json
{
    "msgtype": "text",
    "text": {
        "content": "广州今日天气：29度",
        "mentioned_list": ["wangqing", "@all"],
        "mentioned_mobile_list": ["13800001111", "@all"]
    }
}
```

**Webhook 限制**: 每个机器人发送频率 ≤ 20条/分钟。

**上传文件**: `POST https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=KEY&type=file`
- multipart/form-data 上传，返回 media_id（3天有效）

---

## 5. 回调事件

### 5.1 回调配置

在管理端 → 应用 → 接收消息 → 设置API接收，配置三个参数:
- **URL**: 接收推送的服务器地址（支持 http/https，建议 https）
- **Token**: 用于生成签名，企业自定义
- **EncodingAESKey**: 用于消息体加密/解密

### 5.2 URL 验证流程

管理端保存配置时，企业微信发送 GET 验证请求:

```
GET https://your-url/?msg_signature=xxx&timestamp=xxx&nonce=xxx&echostr=ENCRYPT_STR
```

后台处理步骤:
1. URL decode 所有参数
2. 用 msg_signature 校验请求合法性
3. 解密 echostr → 得到 msg 明文
4. 在1秒内响应该明文（不加引号、不带BOM头、不带换行符）

### 5.3 接收消息协议

```
POST https://your-url/?msg_signature=xxx&timestamp=xxx&nonce=xxx
Body(XML):
<xml>
   <ToUserName><![CDATA[CorpID]]></ToUserName>
   <AgentID><![CDATA[AgentID]]></AgentID>
   <Encrypt><![CDATA[msg_encrypt]]></Encrypt>
</xml>
```

处理步骤:
1. 校验 msg_signature
2. 解密 Encrypt → 明文消息结构体
3. 若需被动回复，构造加密响应包
4. HTTP 200 响应（空串 = 不回复）

**重试机制**: 5秒内无响应则断开并重试，共重试3次。
**排重建议**: 有 MsgId 的消息用 MsgId 排重；事件用 FromUserName + CreateTime 排重。

### 5.4 接收的普通消息格式

解密 Encrypt 后的 XML 明文：

#### 文本消息
```xml
<xml>
   <ToUserName><![CDATA[CorpID]]></ToUserName>
   <FromUserName><![CDATA[userid]]></FromUserName>
   <CreateTime>1348831860</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[消息内容]]></Content>
   <MsgId>1234567890123456</MsgId>
   <AgentID>1</AgentID>
</xml>
```

#### 图片消息
```xml
<xml>
   ...
   <MsgType><![CDATA[image]]></MsgType>
   <PicUrl><![CDATA[图片链接]]></PicUrl>
   <MediaId><![CDATA[media_id]]></MediaId>
   ...
</xml>
```
> PicUrl 为图片链接；MediaId 可调用获取媒体文件接口拉取，仅3天有效。

#### 语音消息
```xml
<MsgType><![CDATA[voice]]></MsgType>
<MediaId><![CDATA[media_id]]></MediaId>
<Format><![CDATA[amr]]></Format>
```

#### 视频消息
```xml
<MsgType><![CDATA[video]]></MsgType>
<MediaId><![CDATA[media_id]]></MediaId>
<ThumbMediaId><![CDATA[thumb_media_id]]></ThumbMediaId>
```

#### 位置消息
```xml
<MsgType><![CDATA[location]]></MsgType>
<Location_X>23.134</Location_X>
<Location_Y>113.358</Location_Y>
<Scale>20</Scale>
<Label><![CDATA[位置信息]]></Label>
<AppType><![CDATA[wxwork]]></AppType>
```

#### 链接消息
```xml
<MsgType><![CDATA[link]]></MsgType>
<Title><![CDATA[标题]]></Title>
<Description><![CDATA[描述]]></Description>
<Url><![CDATA[链接URL]]></Url>
<PicUrl><![CDATA[封面图URL]]></PicUrl>
```

### 5.5 接收的事件消息

#### 关注/取消关注事件
```xml
<MsgType><![CDATA[event]]></MsgType>
<Event><![CDATA[subscribe]]></Event>  <!-- 或 unsubscribe -->
```
触发时机：成员加入/退出应用可见范围，或加入/退出/被禁用企业。

#### 进入应用事件
```xml
<Event><![CDATA[enter_agent]]></Event>
```

#### 上报地理位置
```xml
<Event><![CDATA[LOCATION]]></Event>
<Latitude>23.104</Latitude>
<Longitude>113.320</Longitude>
<Precision>65.000</Precision>
```

#### 菜单事件
| Event | 说明 |
|-------|------|
| click | 点击菜单拉取消息 |
| view | 点击菜单跳转链接 |
| view_miniprogram | 点击菜单跳转小程序 |
| scancode_push | 扫码推事件 |
| scancode_waitmsg | 扫码推事件（弹提示框） |
| pic_sysphoto | 系统拍照发图 |
| pic_photo_or_album | 拍照或相册发图 |
| pic_weixin | 微信相册发图 |
| location_select | 地理位置选择器 |

#### 模板卡片事件
```xml
<Event><![CDATA[template_card_event]]></Event>
<EventKey><![CDATA[按钮key]]></EventKey>
<TaskId><![CDATA[task_id]]></TaskId>
<CardType><![CDATA[text_notice]]></CardType>
<ResponseCode><![CDATA[response_code]]></ResponseCode>
```
> ResponseCode 用于调用更新卡片接口，72小时有效且仅能使用一次。

#### 模板卡片右上角菜单事件
```xml
<Event><![CDATA[template_card_menu_event]]></Event>
```

#### 异步任务完成事件
```xml
<Event><![CDATA[batch_job_result]]></Event>
<BatchJob>
    <JobId><![CDATA[jobid]]></JobId>
    <JobType><![CDATA[sync_user]]></JobType>
    <ErrCode>0</ErrCode>
    <ErrMsg><![CDATA[ok]]></ErrMsg>
</BatchJob>
```
JobType: sync_user / replace_user / invite_user / replace_party

#### 审批状态通知事件
```xml
<Event><![CDATA[open_approval_change]]></Event>
```
触发时机：应用调用审批流程引擎发起申请后，审批状态变化或有审批人操作时。含 ApprovalInfo 嵌套结构（ThirdNo, OpenSpStatus, ApprovalNodes 等）。

#### 共享应用事件
| Event | 说明 |
|-------|------|
| share_agent_change | 企业互联：上级企业共享/移除自建应用给下级企业 |
| share_chain_change | 上下游：上游企业共享/移除自建应用给下游企业 |

#### 应用生命周期事件
| Event | 说明 |
|-------|------|
| inactive_alert | 长期未使用停用预警（含 EffectTime） |
| close_inactive_agent | 长期未使用被临时停用 |
| reopen_inactive_agent | 被重新启用 |
| low_active_alert | 低活跃预警（含 EffectTime） |
| low_active | 变为低活跃应用 |
| active_restored | 活跃恢复 |

### 5.6 被动回复消息

在回调响应中直接返回加密后的 XML 消息。

#### 被动回复文本
```xml
<xml>
   <ToUserName><![CDATA[userid]]></ToUserName>
   <FromUserName><![CDATA[CorpID]]></FromUserName>
   <CreateTime>1348831860</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[回复内容，≤2048字节]]></Content>
</xml>
```

#### 被动回复图片
```xml
<MsgType><![CDATA[image]]></MsgType>
<Image><MediaId><![CDATA[media_id]]></MediaId></Image>
```

#### 被动回复语音
```xml
<MsgType><![CDATA[voice]]></MsgType>
<Voice><MediaId><![CDATA[media_id]]></MediaId></Voice>
```

#### 被动回复视频
```xml
<MsgType><![CDATA[video]]></MsgType>
<Video>
    <MediaId><![CDATA[media_id]]></MediaId>
    <Title><![CDATA[title]]></Title>
    <Description><![CDATA[description]]></Description>
</Video>
```

#### 被动回复图文
```xml
<MsgType><![CDATA[news]]></MsgType>
<ArticleCount>1</ArticleCount>
<Articles>
    <item>
        <Title><![CDATA[title]]></Title>
        <Description><![CDATA[desc]]></Description>
        <PicUrl><![CDATA[picurl]]></PicUrl>
        <Url><![CDATA[url]]></Url>
    </item>
</Articles>
```
> 图文图片最佳尺寸: 大图640×320, 小图80×80。

#### 被动更新模板卡片按钮
```xml
<MsgType><![CDATA[update_button]]></MsgType>
<Button><ReplaceName><![CDATA[已完成]]></ReplaceName></Button>
```

#### 被动更新整张模板卡片
```xml
<MsgType><![CDATA[update_template_card]]></MsgType>
<TemplateCard>
    <CardType><![CDATA[text_notice]]></CardType>
    <!-- 完整卡片结构，与发送时一致 -->
</TemplateCard>
```

**支持被动回复的事件类型**: subscribe, enter_agent, LOCATION, click, view, view_miniprogram, scancode_waitmsg, template_card_menu_event。

---

## 6. 常用工作流

### 6.1 发送通知给指定成员

```
1. 获取 access_token（wecom-core）
2. 构造消息体（选择合适的 msgtype）
3. POST /message/send
4. 检查返回中的 invaliduser/invalidparty/invalidtag
5. 保存 msgid（如需后续撤回）
```

### 6.2 搭建消息回调服务

```
1. 开发回调服务器，实现 GET（URL验证）和 POST（接收消息）
2. 集成加解密库（官方提供 Python/Java/PHP/C#/Go/Node.js 版本）
3. 管理后台配置 URL/Token/EncodingAESKey
4. 保存配置触发 URL 验证
5. 验证通过后即可接收消息
```

### 6.3 模板卡片交互完整流程

```
1. POST /message/send 发送 template_card（设置 task_id 和 button key）
2. 保存返回的 response_code（仅 button_interaction / vote_interaction / multiple_interaction）
3. 用户点击按钮 → 回调推送 template_card_event（含 ResponseCode）
4. 方式A: 在回调响应中被动回复 update_button 或 update_template_card
5. 方式B: 用回调中的 ResponseCode 调用 POST /message/update_template_card
```

### 6.4 群聊机器人推送

```
1. POST /appchat/create 创建群聊（获取 chatid）
2. POST /appchat/send 推送消息到群
3. 如需修改群成员: POST /appchat/update
4. 如需查询群信息: GET /appchat/get
```

---

## 7. 代码模板

### 7.1 Python

```python
"""
企业微信消息管理客户端
依赖: wecom-core 中的 WeComClient 基类
"""
import hashlib
import time
import xml.etree.ElementTree as ET
from typing import Optional


class WeComMessage:
    """消息管理 — 基于 WeComClient 实例"""

    def __init__(self, client):
        """
        :param client: WeComClient 实例（来自 wecom-core）
        """
        self.client = client

    # ── 发送应用消息 ──

    def send_text(
        self,
        agentid: int,
        content: str,
        touser: str = "",
        toparty: str = "",
        totag: str = "",
        safe: int = 0,
    ) -> dict:
        """发送文本消息"""
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "text",
            "agentid": agentid,
            "text": {"content": content},
            "safe": safe,
        }
        return self.client.post("/message/send", json=payload)

    def send_markdown(self, agentid: int, content: str, touser: str = "", toparty: str = "", totag: str = "") -> dict:
        """发送markdown消息"""
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "markdown",
            "agentid": agentid,
            "markdown": {"content": content},
        }
        return self.client.post("/message/send", json=payload)

    def send_textcard(
        self,
        agentid: int,
        title: str,
        description: str,
        url: str,
        touser: str = "",
        toparty: str = "",
        totag: str = "",
        btntxt: str = "详情",
    ) -> dict:
        """发送文本卡片消息"""
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "textcard",
            "agentid": agentid,
            "textcard": {"title": title, "description": description, "url": url, "btntxt": btntxt},
        }
        return self.client.post("/message/send", json=payload)

    def send_image(self, agentid: int, media_id: str, touser: str = "", toparty: str = "", totag: str = "") -> dict:
        """发送图片消息"""
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "image",
            "agentid": agentid,
            "image": {"media_id": media_id},
        }
        return self.client.post("/message/send", json=payload)

    def send_file(self, agentid: int, media_id: str, touser: str = "", toparty: str = "", totag: str = "") -> dict:
        """发送文件消息"""
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "file",
            "agentid": agentid,
            "file": {"media_id": media_id},
        }
        return self.client.post("/message/send", json=payload)

    def send_news(
        self,
        agentid: int,
        articles: list[dict],
        touser: str = "",
        toparty: str = "",
        totag: str = "",
    ) -> dict:
        """
        发送图文消息
        :param articles: [{"title": "...", "description": "...", "url": "...", "picurl": "..."}]
        """
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "news",
            "agentid": agentid,
            "news": {"articles": articles},
        }
        return self.client.post("/message/send", json=payload)

    def send_template_card(
        self,
        agentid: int,
        template_card: dict,
        touser: str = "",
        toparty: str = "",
        totag: str = "",
    ) -> dict:
        """
        发送模板卡片消息
        :param template_card: 卡片内容，须包含 card_type 和 task_id
        """
        payload = {
            "touser": touser,
            "toparty": toparty,
            "totag": totag,
            "msgtype": "template_card",
            "agentid": agentid,
            "template_card": template_card,
        }
        return self.client.post("/message/send", json=payload)

    # ── 撤回 & 更新 ──

    def recall(self, msgid: str) -> dict:
        """撤回应用消息（24小时内有效）"""
        return self.client.post("/message/recall", json={"msgid": msgid})

    def update_template_card(
        self,
        agentid: int,
        response_code: str,
        replace_name: Optional[str] = None,
        template_card: Optional[dict] = None,
        userids: Optional[list] = None,
        partyids: Optional[list] = None,
        tagids: Optional[list] = None,
        atall: int = 0,
    ) -> dict:
        """
        更新模板卡片消息
        :param replace_name: 仅更新按钮文案时使用
        :param template_card: 替换整张卡片时使用（与 replace_name 二选一）
        """
        payload: dict = {
            "userids": userids or [],
            "partyids": partyids or [],
            "tagids": tagids or [],
            "atall": atall,
            "agentid": agentid,
            "response_code": response_code,
        }
        if replace_name:
            payload["button"] = {"replace_name": replace_name}
        elif template_card:
            payload["template_card"] = template_card
        return self.client.post("/message/update_template_card", json=payload)

    # ── 群聊管理 ──

    def create_appchat(
        self,
        userlist: list[str],
        name: str = "",
        owner: str = "",
        chatid: str = "",
    ) -> dict:
        """创建群聊会话，返回 chatid"""
        payload: dict = {"userlist": userlist}
        if name:
            payload["name"] = name
        if owner:
            payload["owner"] = owner
        if chatid:
            payload["chatid"] = chatid
        return self.client.post("/appchat/create", json=payload)

    def update_appchat(
        self,
        chatid: str,
        name: str = "",
        owner: str = "",
        add_user_list: Optional[list] = None,
        del_user_list: Optional[list] = None,
    ) -> dict:
        """修改群聊会话"""
        payload: dict = {"chatid": chatid}
        if name:
            payload["name"] = name
        if owner:
            payload["owner"] = owner
        if add_user_list:
            payload["add_user_list"] = add_user_list
        if del_user_list:
            payload["del_user_list"] = del_user_list
        return self.client.post("/appchat/update", json=payload)

    def get_appchat(self, chatid: str) -> dict:
        """获取群聊会话"""
        return self.client.get("/appchat/get", params={"chatid": chatid})

    def send_appchat(self, chatid: str, msgtype: str, content: dict, safe: int = 0) -> dict:
        """
        推送消息到群聊
        :param content: 消息体，如 {"content": "hello"} 或 {"media_id": "xxx"}
        """
        payload = {
            "chatid": chatid,
            "msgtype": msgtype,
            msgtype: content,
            "safe": safe,
        }
        return self.client.post("/appchat/send", json=payload)


class WeComCallbackHandler:
    """企业微信回调消息处理器"""

    def __init__(self, token: str, encoding_aes_key: str, corp_id: str):
        self.token = token
        self.encoding_aes_key = encoding_aes_key
        self.corp_id = corp_id
        # 实际项目中使用官方加解密库: WXBizMsgCrypt
        # from wecom_crypto import WXBizMsgCrypt
        # self.crypto = WXBizMsgCrypt(token, encoding_aes_key, corp_id)

    def verify_url(self, msg_signature: str, timestamp: str, nonce: str, echostr: str) -> str:
        """
        验证回调URL（GET请求处理）
        返回解密后的明文echostr
        """
        # ret, reply_echostr = self.crypto.VerifyURL(msg_signature, timestamp, nonce, echostr)
        # if ret != 0:
        #     raise ValueError(f"VerifyURL failed: {ret}")
        # return reply_echostr
        raise NotImplementedError("请集成官方加解密库 WXBizMsgCrypt")

    def decrypt_message(self, msg_signature: str, timestamp: str, nonce: str, post_data: str) -> str:
        """
        解密回调消息（POST请求处理）
        返回解密后的XML明文
        """
        # ret, xml_text = self.crypto.DecryptMsg(post_data, msg_signature, timestamp, nonce)
        # if ret != 0:
        #     raise ValueError(f"DecryptMsg failed: {ret}")
        # return xml_text
        raise NotImplementedError("请集成官方加解密库 WXBizMsgCrypt")

    def encrypt_reply(self, reply_xml: str, nonce: str, timestamp: Optional[str] = None) -> str:
        """
        加密被动回复消息
        返回加密后的XML响应体
        """
        timestamp = timestamp or str(int(time.time()))
        # ret, encrypted = self.crypto.EncryptMsg(reply_xml, nonce, timestamp)
        # if ret != 0:
        #     raise ValueError(f"EncryptMsg failed: {ret}")
        # return encrypted
        raise NotImplementedError("请集成官方加解密库 WXBizMsgCrypt")

    @staticmethod
    def parse_message(xml_text: str) -> dict:
        """
        解析XML消息为dict。
        注意：仅处理两层嵌套。深层嵌套结构（如 template_card_event
        的 SelectedItems、batch_job_result 的 BatchJob）需自行递归处理。
        """
        def _parse_element(element) -> dict | str:
            children = list(element)
            if not children:
                return element.text or ""
            result = {}
            for child in children:
                parsed = _parse_element(child)
                # 处理同名子元素（如多个 SelectedItem）
                if child.tag in result:
                    existing = result[child.tag]
                    if not isinstance(existing, list):
                        result[child.tag] = [existing]
                    result[child.tag].append(parsed)
                else:
                    result[child.tag] = parsed
            return result

        root = ET.fromstring(xml_text)
        return {child.tag: _parse_element(child) for child in root}

    @staticmethod
    def build_text_reply(to_user: str, from_user: str, content: str) -> str:
        """构造被动回复文本消息XML"""
        return f"""<xml>
<ToUserName><![CDATA[{to_user}]]></ToUserName>
<FromUserName><![CDATA[{from_user}]]></FromUserName>
<CreateTime>{int(time.time())}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{content}]]></Content>
</xml>"""
```

### 7.2 TypeScript

```typescript
/**
 * 企业微信消息管理客户端
 * 依赖: wecom-core 中的 WeComClient 基类
 */

interface SendResult {
  errcode: number;
  errmsg: string;
  invaliduser?: string;
  invalidparty?: string;
  invalidtag?: string;
  unlicenseduser?: string;
  msgid?: string;
  response_code?: string;
}

interface ChatInfo {
  chatid: string;
  name: string;
  owner: string;
  userlist: string[];
}

/** url and appid/pagepath -- at least one pair must be provided */
interface Article {
  title: string;
  description?: string;
  url?: string;
  picurl?: string;
  appid?: string;
  pagepath?: string;
}

export class WeComMessage {
  constructor(private client: WeComClient) {}

  // ── 发送应用消息 ──

  async sendText(
    agentid: number,
    content: string,
    opts: { touser?: string; toparty?: string; totag?: string; safe?: number } = {},
  ): Promise<SendResult> {
    return this.client.post('/message/send', {
      touser: opts.touser ?? '',
      toparty: opts.toparty ?? '',
      totag: opts.totag ?? '',
      msgtype: 'text',
      agentid,
      text: { content },
      safe: opts.safe ?? 0,
    });
  }

  async sendMarkdown(
    agentid: number,
    content: string,
    opts: { touser?: string; toparty?: string; totag?: string } = {},
  ): Promise<SendResult> {
    return this.client.post('/message/send', {
      touser: opts.touser ?? '',
      toparty: opts.toparty ?? '',
      totag: opts.totag ?? '',
      msgtype: 'markdown',
      agentid,
      markdown: { content },
    });
  }

  async sendTextcard(
    agentid: number,
    title: string,
    description: string,
    url: string,
    opts: { touser?: string; toparty?: string; totag?: string; btntxt?: string } = {},
  ): Promise<SendResult> {
    return this.client.post('/message/send', {
      touser: opts.touser ?? '',
      toparty: opts.toparty ?? '',
      totag: opts.totag ?? '',
      msgtype: 'textcard',
      agentid,
      textcard: { title, description, url, btntxt: opts.btntxt ?? '详情' },
    });
  }

  async sendMedia(
    agentid: number,
    msgtype: 'image' | 'voice' | 'video' | 'file',
    mediaId: string,
    opts: { touser?: string; toparty?: string; totag?: string; title?: string; description?: string } = {},
  ): Promise<SendResult> {
    const mediaBody: Record<string, string> = { media_id: mediaId };
    if (msgtype === 'video') {
      if (opts.title) mediaBody.title = opts.title;
      if (opts.description) mediaBody.description = opts.description;
    }
    return this.client.post('/message/send', {
      touser: opts.touser ?? '',
      toparty: opts.toparty ?? '',
      totag: opts.totag ?? '',
      msgtype,
      agentid,
      [msgtype]: mediaBody,
    });
  }

  async sendNews(
    agentid: number,
    articles: Article[],
    opts: { touser?: string; toparty?: string; totag?: string } = {},
  ): Promise<SendResult> {
    return this.client.post('/message/send', {
      touser: opts.touser ?? '',
      toparty: opts.toparty ?? '',
      totag: opts.totag ?? '',
      msgtype: 'news',
      agentid,
      news: { articles },
    });
  }

  async sendTemplateCard(
    agentid: number,
    templateCard: Record<string, unknown>,
    opts: { touser?: string; toparty?: string; totag?: string } = {},
  ): Promise<SendResult> {
    return this.client.post('/message/send', {
      touser: opts.touser ?? '',
      toparty: opts.toparty ?? '',
      totag: opts.totag ?? '',
      msgtype: 'template_card',
      agentid,
      template_card: templateCard,
    });
  }

  // ── 撤回 & 更新 ──

  async recall(msgid: string): Promise<{ errcode: number; errmsg: string }> {
    return this.client.post('/message/recall', { msgid });
  }

  async updateTemplateCard(
    agentid: number,
    responseCode: string,
    opts: {
      replaceName?: string;
      templateCard?: Record<string, unknown>;
      userids?: string[];
      partyids?: number[];
      tagids?: number[];
      atall?: number;
    } = {},
  ): Promise<{ errcode: number; errmsg: string }> {
    const payload: Record<string, unknown> = {
      userids: opts.userids ?? [],
      partyids: opts.partyids ?? [],
      tagids: opts.tagids ?? [],
      atall: opts.atall ?? 0,
      agentid,
      response_code: responseCode,
    };
    if (opts.replaceName) {
      payload.button = { replace_name: opts.replaceName };
    } else if (opts.templateCard) {
      payload.template_card = opts.templateCard;
    }
    return this.client.post('/message/update_template_card', payload);
  }

  // ── 群聊管理 ──

  async createAppchat(
    userlist: string[],
    opts: { name?: string; owner?: string; chatid?: string } = {},
  ): Promise<{ errcode: number; errmsg: string; chatid: string }> {
    const payload: Record<string, unknown> = { userlist };
    if (opts.name) payload.name = opts.name;
    if (opts.owner) payload.owner = opts.owner;
    if (opts.chatid) payload.chatid = opts.chatid;
    return this.client.post('/appchat/create', payload);
  }

  async updateAppchat(
    chatid: string,
    opts: { name?: string; owner?: string; addUserList?: string[]; delUserList?: string[] } = {},
  ): Promise<{ errcode: number; errmsg: string }> {
    const payload: Record<string, unknown> = { chatid };
    if (opts.name) payload.name = opts.name;
    if (opts.owner) payload.owner = opts.owner;
    if (opts.addUserList) payload.add_user_list = opts.addUserList;
    if (opts.delUserList) payload.del_user_list = opts.delUserList;
    return this.client.post('/appchat/update', payload);
  }

  async getAppchat(chatid: string): Promise<{ errcode: number; errmsg: string; chat_info: ChatInfo }> {
    return this.client.get('/appchat/get', { chatid });
  }

  async sendAppchat(
    chatid: string,
    msgtype: string,
    content: Record<string, unknown>,
    safe = 0,
  ): Promise<{ errcode: number; errmsg: string }> {
    return this.client.post('/appchat/send', {
      chatid,
      msgtype,
      [msgtype]: content,
      safe,
    });
  }
}
```

### 7.3 Go

```go
package wecom

import (
	"encoding/json"
	"fmt"
	"net/url"
)

// MessageClient 消息管理客户端
type MessageClient struct {
	*Client // 嵌入 wecom-core Client
}

// NewMessageClient 创建消息管理客户端
func NewMessageClient(corpID, secret string) *MessageClient {
	return &MessageClient{Client: NewClient(corpID, secret)}
}

// SendResult 发送消息返回结果
type SendResult struct {
	ErrCode        int    `json:"errcode"`
	ErrMsg         string `json:"errmsg"`
	InvalidUser    string `json:"invaliduser,omitempty"`
	InvalidParty   string `json:"invalidparty,omitempty"`
	InvalidTag     string `json:"invalidtag,omitempty"`
	UnlicensedUser string `json:"unlicenseduser,omitempty"`
	MsgID          string `json:"msgid,omitempty"`
	ResponseCode   string `json:"response_code,omitempty"`
}

// SendText 发送文本消息
func (c *MessageClient) SendText(agentID int, content, toUser, toParty, toTag string) (*SendResult, error) {
	payload := map[string]interface{}{
		"touser":  toUser,
		"toparty": toParty,
		"totag":   toTag,
		"msgtype": "text",
		"agentid": agentID,
		"text":    map[string]string{"content": content},
	}
	var result SendResult
	err := c.Post("/message/send", payload, &result)
	return &result, err
}

// SendMarkdown 发送markdown消息
func (c *MessageClient) SendMarkdown(agentID int, content, toUser, toParty, toTag string) (*SendResult, error) {
	payload := map[string]interface{}{
		"touser":   toUser,
		"toparty":  toParty,
		"totag":    toTag,
		"msgtype":  "markdown",
		"agentid":  agentID,
		"markdown": map[string]string{"content": content},
	}
	var result SendResult
	err := c.Post("/message/send", payload, &result)
	return &result, err
}

// SendTemplateCard 发送模板卡片消息
func (c *MessageClient) SendTemplateCard(agentID int, card map[string]interface{}, toUser, toParty, toTag string) (*SendResult, error) {
	payload := map[string]interface{}{
		"touser":        toUser,
		"toparty":       toParty,
		"totag":         toTag,
		"msgtype":       "template_card",
		"agentid":       agentID,
		"template_card": card,
	}
	var result SendResult
	err := c.Post("/message/send", payload, &result)
	return &result, err
}

// Recall 撤回消息
func (c *MessageClient) Recall(msgID string) error {
	var result BaseResult
	return c.Post("/message/recall", map[string]string{"msgid": msgID}, &result)
}

// ChatInfo 群聊信息
type ChatInfo struct {
	ChatID   string   `json:"chatid"`
	Name     string   `json:"name"`
	Owner    string   `json:"owner"`
	UserList []string `json:"userlist"`
}

// CreateAppchat 创建群聊
func (c *MessageClient) CreateAppchat(userList []string, name, owner, chatID string) (string, error) {
	payload := map[string]interface{}{"userlist": userList}
	if name != "" {
		payload["name"] = name
	}
	if owner != "" {
		payload["owner"] = owner
	}
	if chatID != "" {
		payload["chatid"] = chatID
	}
	var result struct {
		BaseResult
		ChatID string `json:"chatid"`
	}
	if err := c.Post("/appchat/create", payload, &result); err != nil {
		return "", err
	}
	return result.ChatID, nil
}

// GetAppchat 获取群聊信息
func (c *MessageClient) GetAppchat(chatID string) (*ChatInfo, error) {
	params := url.Values{"chatid": {chatID}}
	var result struct {
		BaseResult
		ChatInfo ChatInfo `json:"chat_info"`
	}
	if err := c.Get("/appchat/get", params, &result); err != nil {
		return nil, err
	}
	return &result.ChatInfo, nil
}

// SendAppchat 推送消息到群聊
func (c *MessageClient) SendAppchat(chatID, msgType string, content map[string]interface{}) error {
	payload := map[string]interface{}{
		"chatid":  chatID,
		"msgtype": msgType,
		msgType:   content,
	}
	var result BaseResult
	return c.Post("/appchat/send", payload, &result)
}
```

---


### 7.4 Java 示例

```java
public class WeComMessageService {
    private final WeComClient client;

    public WeComMessageService(WeComClient client) {
        this.client = client;
    }

    /** 发送文本消息 */
    public JsonObject sendText(String agentId, String toUser, String content) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("touser", toUser);
        body.addProperty("msgtype", "text");
        body.addProperty("agentid", agentId);
        JsonObject text = new JsonObject();
        text.addProperty("content", content);
        body.add("text", text);
        return client.post("/message/send", body);
    }

    /** 发送模板卡片消息 */
    public JsonObject sendTemplateCard(String agentId, String toUser,
            String cardType, JsonObject card) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("touser", toUser);
        body.addProperty("msgtype", "template_card");
        body.addProperty("agentid", agentId);
        body.add("template_card", card);
        return client.post("/message/send", body);
    }

    /** 撤回消息 — ⚠️ 24小时内有效 */
    public void recallMessage(String msgId) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("msgid", msgId);
        client.post("/message/recall", body);
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
class WeComMessageService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 发送文本消息 */
    public function sendText(string $agentId, string $toUser, string $content): array
    {
        return $this->client->post('/cgi-bin/message/send', [
            'touser'  => $toUser,
            'msgtype' => 'text',
            'agentid' => $agentId,
            'text'    => ['content' => $content],
        ]);
    }

    /** 发送模板卡片 */
    public function sendTemplateCard(string $agentId, string $toUser, array $card): array
    {
        return $this->client->post('/cgi-bin/message/send', [
            'touser'        => $toUser,
            'msgtype'       => 'template_card',
            'agentid'       => $agentId,
            'template_card' => $card,
        ]);
    }

    /** 撤回消息 — ⚠️ 24小时内有效 */
    public function recallMessage(string $msgId): array
    {
        return $this->client->post('/cgi-bin/message/recall', ['msgid' => $msgId]);
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 8. 测试模板

### 8.1 Python 测试

```python
"""
wecom-message 测试用例
运行: pytest test_message.py -v
"""
import json
import pytest
from unittest.mock import MagicMock, patch


class TestSendMessage:
    """发送消息测试"""

    def setup_method(self):
        self.client = MagicMock()
        self.client.post.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "msgid": "msg_001",
        }
        self.msg = WeComMessage(self.client)

    def test_send_text(self):
        result = self.msg.send_text(agentid=1, content="hello", touser="user1")
        self.client.post.assert_called_once()
        args = self.client.post.call_args
        body = args[1]["json"] if "json" in args[1] else args[0][1]
        assert body["msgtype"] == "text"
        assert body["text"]["content"] == "hello"
        assert body["agentid"] == 1
        assert result["errcode"] == 0

    def test_send_text_requires_at_least_one_target(self):
        """touser/toparty/totag 三者至少填一个"""
        result = self.msg.send_text(agentid=1, content="hello")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["touser"] == "" or body["toparty"] == "" or body["totag"] == ""

    def test_send_markdown(self):
        result = self.msg.send_markdown(agentid=1, content="# Title", touser="user1")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["msgtype"] == "markdown"
        assert body["markdown"]["content"] == "# Title"

    def test_send_textcard(self):
        result = self.msg.send_textcard(agentid=1, title="T", description="D", url="https://x.com", touser="u1")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["msgtype"] == "textcard"
        assert body["textcard"]["url"] == "https://x.com"

    def test_send_template_card_returns_response_code(self):
        self.client.post.return_value = {"errcode": 0, "errmsg": "ok", "msgid": "m1", "response_code": "rc1"}
        result = self.msg.send_template_card(
            agentid=1,
            template_card={"card_type": "button_interaction", "task_id": "t1"},
            touser="u1",
        )
        assert result["response_code"] == "rc1"


class TestRecallAndUpdate:
    """撤回和更新测试"""

    def setup_method(self):
        self.client = MagicMock()
        self.client.post.return_value = {"errcode": 0, "errmsg": "ok"}
        self.msg = WeComMessage(self.client)

    def test_recall(self):
        self.msg.recall("msgid_001")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["msgid"] == "msgid_001"

    def test_update_template_card_button(self):
        self.msg.update_template_card(agentid=1, response_code="rc1", replace_name="已完成")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["button"]["replace_name"] == "已完成"
        assert "template_card" not in body

    def test_update_template_card_full(self):
        card = {"card_type": "text_notice"}
        self.msg.update_template_card(agentid=1, response_code="rc1", template_card=card)
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["template_card"]["card_type"] == "text_notice"
        assert "button" not in body


class TestAppchat:
    """群聊管理测试"""

    def setup_method(self):
        self.client = MagicMock()
        self.msg = WeComMessage(self.client)

    def test_create_appchat_min_members(self):
        self.client.post.return_value = {"errcode": 0, "errmsg": "ok", "chatid": "chat_001"}
        result = self.msg.create_appchat(userlist=["u1", "u2"])
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert len(body["userlist"]) >= 2
        assert result["chatid"] == "chat_001"

    def test_create_appchat_with_custom_chatid(self):
        self.client.post.return_value = {"errcode": 0, "errmsg": "ok", "chatid": "mygroup"}
        self.msg.create_appchat(userlist=["u1", "u2"], chatid="mygroup")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["chatid"] == "mygroup"

    def test_send_appchat_text_with_mention(self):
        self.client.post.return_value = {"errcode": 0, "errmsg": "ok"}
        self.msg.send_appchat("chat_001", "text", {"content": "hi", "mentioned_list": ["@all"]})
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["chatid"] == "chat_001"
        assert body["text"]["mentioned_list"] == ["@all"]


class TestCallbackHandler:
    """回调消息处理测试"""

    def test_parse_text_message(self):
        xml = """<xml>
            <ToUserName><![CDATA[corp123]]></ToUserName>
            <FromUserName><![CDATA[user1]]></FromUserName>
            <CreateTime>1348831860</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[hello]]></Content>
            <MsgId>123456</MsgId>
            <AgentID>1</AgentID>
        </xml>"""
        msg = WeComCallbackHandler.parse_message(xml)
        assert msg["MsgType"] == "text"
        assert msg["Content"] == "hello"
        assert msg["FromUserName"] == "user1"

    def test_parse_event_message(self):
        xml = """<xml>
            <ToUserName><![CDATA[corp123]]></ToUserName>
            <FromUserName><![CDATA[user1]]></FromUserName>
            <CreateTime>1348831860</CreateTime>
            <MsgType><![CDATA[event]]></MsgType>
            <Event><![CDATA[subscribe]]></Event>
            <AgentID>1</AgentID>
        </xml>"""
        msg = WeComCallbackHandler.parse_message(xml)
        assert msg["MsgType"] == "event"
        assert msg["Event"] == "subscribe"

    def test_build_text_reply(self):
        reply = WeComCallbackHandler.build_text_reply("user1", "corp123", "收到")
        assert "<MsgType><![CDATA[text]]></MsgType>" in reply
        assert "<Content><![CDATA[收到]]></Content>" in reply

    def test_parse_template_card_event(self):
        xml = """<xml>
            <ToUserName><![CDATA[corp123]]></ToUserName>
            <FromUserName><![CDATA[user1]]></FromUserName>
            <CreateTime>123456789</CreateTime>
            <MsgType><![CDATA[event]]></MsgType>
            <Event><![CDATA[template_card_event]]></Event>
            <EventKey><![CDATA[key1]]></EventKey>
            <TaskId><![CDATA[task1]]></TaskId>
            <CardType><![CDATA[button_interaction]]></CardType>
            <ResponseCode><![CDATA[rc001]]></ResponseCode>
            <AgentID>1</AgentID>
        </xml>"""
        msg = WeComCallbackHandler.parse_message(xml)
        assert msg["Event"] == "template_card_event"
        assert msg["ResponseCode"] == "rc001"

    def test_parse_template_card_with_selected_items(self):
        """测试深层嵌套的 SelectedItems 结构"""
        xml = """<xml>
            <ToUserName><![CDATA[corp123]]></ToUserName>
            <FromUserName><![CDATA[user1]]></FromUserName>
            <CreateTime>123456789</CreateTime>
            <MsgType><![CDATA[event]]></MsgType>
            <Event><![CDATA[template_card_event]]></Event>
            <SelectedItems>
                <SelectedItem>
                    <QuestionKey><![CDATA[q1]]></QuestionKey>
                    <OptionIds><OptionId><![CDATA[opt1]]></OptionId></OptionIds>
                </SelectedItem>
            </SelectedItems>
            <AgentID>1</AgentID>
        </xml>"""
        msg = WeComCallbackHandler.parse_message(xml)
        assert "SelectedItems" in msg
        selected = msg["SelectedItems"]
        assert "SelectedItem" in selected


class TestEdgeCases:
    """边缘情况测试"""

    def setup_method(self):
        self.client = MagicMock()
        self.msg = WeComMessage(self.client)

    def test_send_to_all(self):
        self.client.post.return_value = {"errcode": 0, "errmsg": "ok", "msgid": "m1"}
        self.msg.send_text(agentid=1, content="公告", touser="@all")
        body = self.client.post.call_args[1].get("json", self.client.post.call_args[0][1])
        assert body["touser"] == "@all"

    def test_partial_failure_response(self):
        self.client.post.return_value = {
            "errcode": 0,
            "errmsg": "ok",
            "invaliduser": "baduser1|baduser2",
            "msgid": "m1",
        }
        result = self.msg.send_text(agentid=1, content="hi", touser="user1|baduser1|baduser2")
        assert result["invaliduser"] == "baduser1|baduser2"
        assert result["errcode"] == 0  # 部分失败仍返回0

    def test_all_invalid_returns_error(self):
        self.client.post.return_value = {"errcode": 81013, "errmsg": "all invalid"}
        result = self.msg.send_text(agentid=1, content="hi", touser="nobody")
        assert result["errcode"] == 81013
```

---

## 9. Code Review 清单

生成或审查消息相关代码时，逐项检查:

| # | 检查项 | 严重性 |
|---|--------|--------|
| 1 | touser/toparty/totag 是否至少填了一个？全空会导致发送失败 | CRITICAL |
| 2 | agentid 是否传入正确的整型值？ | CRITICAL |
| 3 | 群聊的 chatid 是否由该应用创建？非本应用创建的群无法推送 | CRITICAL |
| 4 | text content 是否超过2048字节？markdown content 是否超过2048字节？ | HIGH |
| 5 | 图文消息 articles 是否在1~8条范围内？ | HIGH |
| 6 | 群聊创建 userlist 是否至少2人？ | HIGH |
| 7 | media_id 是否在3天有效期内？过期需重新上传 | HIGH |
| 8 | 是否正确处理了返回中的 invaliduser/invalidparty/invalidtag？ | MEDIUM |
| 9 | 是否保存了 msgid 以便后续撤回？ | MEDIUM |
| 10 | response_code 是否在72小时内使用且仅使用一次？ | HIGH |
| 11 | 回调服务是否能在5秒内响应？超时会重试 | HIGH |
| 12 | 回调消息是否做了排重（MsgId 或 FromUserName+CreateTime）？ | HIGH |
| 13 | 被动回复的 XML 是否经过加密？明文直接返回会失败 | CRITICAL |
| 14 | URL 验证响应是否为纯明文（无引号、无BOM、无换行）？ | CRITICAL |
| 15 | 频率限制是否在允许范围内（30/分钟/成员，1000/小时/成员）？ | HIGH |
| 16 | 发消息是否避开整点和半点（0分/30分）以减少资源挤占？ | LOW |
| 17 | 撤回消息是否在24小时内？ | MEDIUM |
| 18 | 群聊 chatid 自定义值是否仅含 0-9 和 a-zA-Z？ | MEDIUM |

---

## 10. 踩坑指南 (Gotcha Guide)

### G1: 群聊消息超限但接口不报错（CRITICAL）

**症状**: 调用 /appchat/send 返回 `errcode: 0`，但成员收不到消息。
**原因**: 每个成员在群中收到的同一应用消息不可超过200条/分、1万条/天，超过直接丢弃且**接口不报错**。跨群累计计算。
**解法**: 应用层自行做频率控制，记录每个成员收到的消息数。

### G2: touser `@all` 时 toparty/totag 被忽略

**症状**: 同时设置 `touser: "@all"` 和 `toparty: "1"`，期望只发送给指定部门，但实际发送给了全员。
**原因**: 官方文档明确：当 touser 为 `@all` 时，toparty 和 totag 参数会被忽略。
**解法**: 使用 `@all` 时无需同时填 toparty 和 totag。如需定向发送，不要使用 `@all`。

### G3: 发送消息返回成功但 invaliduser 不为空

**症状**: errcode=0 但部分用户没收到消息。
**原因**: 不在应用可见范围内的 userid 会被放入 invaliduser，发送仍执行但跳过这些用户。unlicenseduser 表示在可见范围内但无基础接口许可。
**解法**: 始终检查返回中的 invaliduser/invalidparty/invalidtag/unlicenseduser。

### G4: markdown 消息在微信插件端不显示

**症状**: 发送 markdown 消息，企业微信客户端正常但微信端看不到。
**原因**: 微信插件（原企业号）不支持 markdown 消息展示。
**解法**: 需要微信端展示的场景使用 text 或 textcard 类型。

### G5: 回调 URL 验证失败

**症状**: 管理端保存回调配置提示验证失败。
**常见原因**:
1. 响应不是纯明文（带了引号或换行符）
2. 未做 URL decode
3. 响应时间超过1秒
4. EncodingAESKey 配置错误

### G6: 回调消息重复接收

**症状**: 同一条消息被后台处理了多次。
**原因**: 5秒内未响应 HTTP 200，企业微信会重试最多3次。
**解法**: 先返回200空响应，再异步处理。同时做排重（MsgId 或 FromUserName+CreateTime）。

### G7: 模板卡片 response_code 只能用一次

**症状**: 第二次调用 update_template_card 失败。
**原因**: response_code 72小时有效且仅能使用一次。
**解法**: 用户每次点击都会产生新的 response_code，使用最新的即可。

### G8: 群聊必须由应用创建才能推送

**症状**: 调用 /appchat/send 报错。
**原因**: chatid 对应的群不是该应用通过 /appchat/create 创建的。
**解法**: 只能向自己创建的群发消息。群聊管理仅限可见范围为根部门的自建应用。

### G9: 群聊创建后旧版终端不显示

**症状**: 创建群聊成功但成员看不到。
**原因**: 刚创建的群如果没有下发消息，在旧版本企业微信终端上不会出现。
**解法**: 创建群聊后立即发送一条欢迎消息。

### G10: 应用设置"在微工作台中始终进入主页"后消息被截断

**症状**: 微信端收到的消息被截断为20字节，非文本消息变成提示文字。
**原因**: 管理端设置了"在微工作台中始终进入主页"，微信端仅能接收文本且限20字节。
**解法**: 如果需要微信端完整展示消息，不要开启此选项。

### G11: 避开整点和半点发送消息

**症状**: 消息投递延迟，部分消息接收滞后。
**原因**: 大部分企业应用在每小时的0分或30分触发推送，容易造成资源挤占。
**解法**: 尽量避开 :00 和 :30 这两个时间点调用发送接口。

### G12: 群聊 markdown 也支持 @群成员

**症状**: 开发者以为只有 text 类型的群聊消息才能 @人。
**实际**: markdown 类型的群聊消息同样支持 `<@userid>` 扩展语法来 @群成员（企业微信 5.0.6 及以上版本）。

---

## 11. 参考链接

| 文档 | 说明 |
|------|------|
| [发送应用消息](https://developer.work.weixin.qq.com/document/path/90236) | 所有消息类型详细参数 |
| [接收消息概述](https://developer.work.weixin.qq.com/document/path/90238) | 回调配置和验证 |
| [消息格式](https://developer.work.weixin.qq.com/document/path/90239) | 接收的普通消息XML |
| [事件格式](https://developer.work.weixin.qq.com/document/path/90240) | 接收的事件消息XML |
| [被动回复消息](https://developer.work.weixin.qq.com/document/path/90241) | 被动回复XML格式 |
| [创建群聊会话](https://developer.work.weixin.qq.com/document/path/90245) | 群聊管理 |
| [应用推送消息到群聊](https://developer.work.weixin.qq.com/document/path/90248) | 群聊消息推送 |
| [撤回应用消息](https://developer.work.weixin.qq.com/document/path/94867) | 撤回消息 |
| [更新模版卡片消息](https://developer.work.weixin.qq.com/document/path/94888) | 模板卡片更新 |
| [群机器人配置说明](https://developer.work.weixin.qq.com/document/path/91770) | Webhook 群机器人 |
| [加解密方案说明](https://developer.work.weixin.qq.com/document/path/90307) | 回调消息加解密 |
| [加解密库下载](https://developer.work.weixin.qq.com/document/path/90307) | 官方提供 Python/Java/PHP/C#/Go/Node.js |


