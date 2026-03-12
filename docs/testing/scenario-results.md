# WeCom SKILL 场景测试结果

> 测试时间: 2026-03-09 ~ 2026-03-10
> 测试方法: Agent 模拟开发者提问，验证 SKILL 是否包含足够信息引导 Claude 正确回答
> 每个 SKILL 3 个场景：A=常见任务, B=错误排查, C=边界/陷阱

## 总览

| SKILL | A (常见任务) | B (错误排查) | C (边界/陷阱) | 通过率 |
|-------|-------------|-------------|--------------|--------|
| wecom-core | FAIL → FIXED | PASS | PASS | 3/3 |
| wecom-contact | PASS | PASS | FAIL → FIXED | 3/3 |
| wecom-message | FAIL → FIXED | PASS | PASS | 3/3 |
| wecom-app | PASS | PASS | PASS | 3/3 |
| wecom-auth | PASS | PASS | PASS | 3/3 |
| wecom-crm-customer | PASS | PASS | PASS | 3/3 |
| wecom-crm-tag | PASS | PASS | PASS | 3/3 |
| **合计** | | | | **21/21** |

P0 初次通过: 12/15 (80%) → 修复后: 15/15 (100%)
P1 CRM: 6/6 (100%)

---

## 详细结果

### wecom-core

#### CORE-A: Token 缓存实现 — FAIL → FIXED
**Prompt**: "帮我用 Python 实现企业微信 access_token 的获取和缓存，要求线程安全"
**结果**: Python 模板缺少 `threading.Lock`，无线程安全保证
**修复**: 添加 `threading.Lock` + double-check locking 模式到 Python WeComClient 模板

#### CORE-B: errcode 处理 — PASS
**Prompt**: "我调用企业微信 API 一直返回 errcode 42001，怎么办？"
**验证**: 正确识别 42001=token 过期，有自动重试逻辑，错误码速查表完整

#### CORE-C: 回调加解密 — PASS
**Prompt**: "企业微信回调 URL 验证一直失败，GET 请求返回的 echostr 不对"
**验证**: 包含完整的 msg_signature/timestamp/nonce 校验流程，AES 解密步骤，GET vs POST 区分

---

### wecom-contact

#### CONTACT-A: 批量同步员工 — PASS
**Prompt**: "我需要从 HR 系统批量同步 5000 个员工到企业微信，用 Python 怎么实现？"
**验证**: 提到部门需先创建，mobile/email 至少一个，有频率限制说明，无幻觉参数

#### CONTACT-B: /user/list 被限制 — PASS
**Prompt**: "调用 /user/list 接口返回无权限，但我确认 token 是对的"
**验证**: 提到 2022.8.15 IP 限制，推荐替代接口 /user/list_id，包含游标分页说明

#### CONTACT-C: 更新成员全量覆盖陷阱 — FAIL → FIXED
**Prompt**: "我只想更新某个成员的手机号，但更新后他的其他信息都没了"
**结果**: 踩坑指南缺少 /user/update 全量覆盖语义说明，无 read-modify-write 建议
**修复**: 新增踩坑 #11 — 明确说明全量覆盖语义 + read-modify-write 安全模式

---

### wecom-message

#### MSG-A: 发送模版卡片消息 — FAIL → FIXED
**Prompt**: "帮我用 TypeScript 发送一个按钮交互型的模版卡片消息"
**结果**: button_interaction 子类型仅在差异表中列名，缺少 button_list/button_selection 的详细字段结构
**修复**: 新增 button_interaction 完整 JSON 示例 + 字段级参数表（button_list[].text/style/key, button_selection 等）

#### MSG-B: 消息被静默丢弃 — PASS
**Prompt**: "我的应用消息发送成功了（errcode=0）但用户收不到，怎么回事？"
**验证**: 明确提到频率限制静默丢弃不报错，列出 ≤30条/分 1000条/小时 上限

#### MSG-C: 被动回复 vs 主动发送 — PASS
**Prompt**: "用户在应用里发消息给我，我应该用什么接口回复？"
**验证**: 区分被动回复(XML response body)和主动发送(POST /message/send)，提到 5 秒超时和加密要求

---

### wecom-app

#### APP-A: 创建自定义菜单 — PASS
**Prompt**: "帮我创建一个企业微信应用的自定义菜单，包含扫码和跳转网页功能"
**验证**: M1 API 完整，agentid 在 query string（Gotcha G1），最多 3 个一级 5 个二级，包含 scancode_push/view 类型

#### APP-B: 菜单不生效 — PASS
**Prompt**: "我创建了菜单但用户看不到更新后的菜单"
**验证**: 24 小时客户端缓存（Gotcha G2），取消关注重新关注的测试方法，Code Review R12 也检查此项

#### APP-C: 工作台模版设置 — PASS
**Prompt**: "我想为不同用户展示不同的工作台数据"
**验证**: Workflow 6.2 两步流程（W1 企业级模版 → W3 用户级数据），replace_user_data 覆盖语义（Gotcha G6）

---

### wecom-auth

#### AUTH-A: 实现 OAuth 网页登录 — PASS
**Prompt**: "帮我用 Node.js 实现企业微信 OAuth 网页授权登录，获取用户手机号"
**验证**: 两步流程 code→user_ticket→mobile（Section 5.4），redirect_uri urlencode（F1 + R1），可信域名匹配（Gotcha G1）

#### AUTH-B: code 换身份报 40029 — PASS
**Prompt**: "调用 getuserinfo 接口传入 code 返回 40029 错误"
**验证**: code 一次性消费 + 5 分钟有效期（Section 2.4），40029 错误码映射（B1），幂等处理建议（Gotcha G2）

#### AUTH-C: SSO vs OAuth 混淆 — PASS
**Prompt**: "我是第三方服务商，想让企业的员工扫码登录我的网站"
**验证**: 推荐 SSO 路径（Gotcha G6 明确阻止 F2），auth_code vs code 区分（Gotcha G3），provider_access_token 凭证体系（Gotcha G5）

---

### wecom-crm-customer

#### CRM-CUST-A: 客户全量同步 — PASS
**Prompt**: "帮我实现客户全量同步，需要获取所有成员的所有客户详情"
**验证**: 三步流程（C5 服务人员列表 → C1 客户列表 → C3 批量获取），代码模板含 sync_all_customers 方法

#### CRM-CUST-B: 84061 错误排查 — PASS
**Prompt**: "调用 externalcontact/get 返回 84061 错误码"
**验证**: 4 种触发场景（成员删除客户/免验证未加好友/扫码入群非好友/userid 无客户），错误码速查表覆盖

#### CRM-CUST-C: follow_user vs follow_info 差异 — PASS
**Prompt**: "批量获取客户详情时标签信息不完整"
**验证**: C2 返回 follow_user(含完整 tags) vs C3 返回 follow_info(仅 tag_id)，Section 2 核心概念 + Gotcha 覆盖

---

### wecom-crm-tag

#### CRM-TAG-A: 标签体系初始化 + 批量打标签 — PASS
**Prompt**: "创建客户标签体系并根据 add_way 自动打标签"
**验证**: 工作流 6.1/6.2 完整步骤，Python batch_mark_tags 方法，凭证要求多处强调

#### CRM-TAG-B: 标签操作权限错误 — PASS
**Prompt**: "edit_corp_tag 返回 301002 / mark_tag 返回成功但标签没生效"
**验证**: 301002 原因(非本应用创建)，mark_tag 静默失败 3 个排查方向，第三方仅只读

#### CRM-TAG-C: 回调事件处理 + 策略标签 — PASS
**Prompt**: "监听标签变更回调并维护本地缓存，同时使用策略标签"
**验证**: change_external_tag vs change_external_contact/edit 区分(三处交叉引用)，shuffle 全量同步，级联删除无子回调，7 维对比表

---

## 修复摘要

| # | SKILL | 问题 | 严重度 | 修复内容 |
|---|-------|------|--------|----------|
| 1 | wecom-core | Python 模板缺少线程安全 | HIGH | 添加 `threading.Lock` + double-check locking |
| 2 | wecom-contact | 缺少 /user/update 全量覆盖警告 | CRITICAL | 新增踩坑 #11: 全量覆盖语义 + read-modify-write |
| 3 | wecom-message | button_interaction 字段结构缺失 | HIGH | 新增完整 JSON 示例 + 字段参数表 |

## 结论

5 个 P0 SKILL 全部通过场景测试，覆盖常见任务、错误排查、边界陷阱三个维度。修复后质量达标，可作为公开发布的基线版本。
