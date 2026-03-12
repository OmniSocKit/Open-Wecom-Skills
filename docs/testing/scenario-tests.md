# WeCom SKILL Scenario Test Plan

> 每个 SKILL 3 个场景：A=常见任务, B=错误排查, C=边界/陷阱

## wecom-core (3 scenarios)

### CORE-A: Token 缓存实现
**Prompt**: "帮我用 Python 实现企业微信 access_token 的获取和缓存，要求线程安全"
**Expected**: 提到 GET /gettoken, expires_in=7200, 需要缓存不能每次请求, 线程安全(Lock)
**Pass if**: 包含 corpid+corpsecret 参数, 提到 7200 秒有效期, 有缓存机制

### CORE-B: errcode 处理
**Prompt**: "我调用企业微信 API 一直返回 errcode 42001，怎么办？"
**Expected**: 42001=token过期, 需要重新获取token, 建议实现自动重试机制
**Pass if**: 正确识别 42001, 给出刷新 token 的方案

### CORE-C: 回调加解密
**Prompt**: "企业微信回调 URL 验证一直失败，GET 请求返回的 echostr 不对"
**Expected**: 提到 WXBizMsgCrypt, 需要用 EncodingAESKey 解密 echostr, GET 验证 vs POST 消息接收
**Pass if**: 提到 msg_signature/timestamp/nonce 三参数校验, AES 解密

## wecom-contact (3 scenarios)

### CONTACT-A: 批量同步员工
**Prompt**: "我需要从 HR 系统批量同步 5000 个员工到企业微信，用 Python 怎么实现？"
**Expected**: 提到 POST /user/create, 需要先创建部门, mobile/email 至少一个, 考虑频率限制
**Pass if**: 提到部门需先创建, 不使用 fetch_child 参数, 提到频率限制或分批处理

### CONTACT-B: /user/list 被限制
**Prompt**: "调用 /user/list 接口返回无权限，但我确认 token 是对的"
**Expected**: 2022.8.15 后新增 IP 不能调用 /user/list, 改用 POST /user/list_id
**Pass if**: 提到 2022.8.15 IP 限制, 提到替代接口 /user/list_id, 提到游标分页

### CONTACT-C: 更新成员全量覆盖陷阱
**Prompt**: "我只想更新某个成员的手机号，但更新后他的其他信息都没了"
**Expected**: POST /user/update 是全量覆盖, 未传的字段会被清空, 需要先 GET 再修改再 POST
**Pass if**: 提到全量覆盖风险, 建议先读后改(read-modify-write), 或提到 biz_mail 等字段会被清空

## wecom-message (3 scenarios)

### MSG-A: 发送模版卡片消息
**Prompt**: "帮我用 TypeScript 发送一个按钮交互型的模版卡片消息"
**Expected**: POST /message/send, msgtype=template_card, card_type=button_interaction, 包含 button_list
**Pass if**: 正确的 JSON 结构, 包含 source/main_title/button_list, 提到 response_code 回调

### MSG-B: 消息被静默丢弃
**Prompt**: "我的应用消息发送成功了（errcode=0）但用户收不到，怎么回事？"
**Expected**: 频率限制是静默丢弃不报错, 每人 ≤30条/分 1000条/小时, 检查是否超频
**Pass if**: 提到频率限制静默丢弃(不返回错误), 列出具体频率上限

### MSG-C: 被动回复 vs 主动发送
**Prompt**: "用户在应用里发消息给我，我应该用什么接口回复？被动回复和主动发送有什么区别？"
**Expected**: 被动回复在回调 response body 直接返回 XML, 主动发送用 POST /message/send, 被动回复无频率限制但必须 5 秒内
**Pass if**: 区分两种方式, 提到 5 秒超时, 提到被动回复的 XML 格式需要加密

## wecom-app (3 scenarios)

### APP-A: 创建自定义菜单
**Prompt**: "帮我创建一个企业微信应用的自定义菜单，包含扫码和跳转网页功能"
**Expected**: POST /menu/create, 最多 3 个一级 5 个二级, type=scancode_push 和 type=view
**Pass if**: 正确的 JSON 结构, 包含 button 数组, 提到 agentid 在 query string

### APP-B: 菜单不生效
**Prompt**: "我创建了菜单但用户看不到更新后的菜单"
**Expected**: 24 小时客户端缓存, 测试时可取消关注重新关注
**Pass if**: 提到 24 小时缓存延迟, 提到取消关注的测试方法

### APP-C: 工作台模版设置
**Prompt**: "我想为不同用户展示不同的工作台数据，比如每个人看到自己的待审批数量"
**Expected**: 先 set_workbench_template 设模版, 再 set_workbench_data 按用户设数据, replace_user_data 的含义
**Pass if**: 区分企业级模版 vs 用户级数据, 提到 replace_user_data 的覆盖语义

## wecom-auth (3 scenarios)

### AUTH-A: 实现 OAuth 网页登录
**Prompt**: "帮我用 Node.js 实现企业微信 OAuth 网页授权登录，获取用户手机号"
**Expected**: scope=snsapi_privateinfo, 先 getuserinfo 获取 user_ticket, 再 getuserdetail 获取 mobile
**Pass if**: 两步流程(code→user_ticket→mobile), redirect_uri 需 urlencode, 提到可信域名匹配

### AUTH-B: code 换身份报 40029
**Prompt**: "调用 getuserinfo 接口传入 code 返回 40029 错误"
**Expected**: code 一次性 5 分钟有效, 可能已使用或过期, 重试不行需要重新授权获取新 code
**Pass if**: 提到 code 一次性消费, 5 分钟有效期, 不可重复使用

### AUTH-C: SSO vs OAuth 混淆
**Prompt**: "我是第三方服务商，想让企业的员工扫码登录我的网站，应该用哪个接口？"
**Expected**: SSO 场景用 provider_access_token + /service/get_login_info, 不是普通 OAuth, 回调参数是 auth_code 不是 code
**Pass if**: 推荐 SSO 路径而非自建应用 OAuth, 区分 auth_code vs code, 提到 provider_access_token
