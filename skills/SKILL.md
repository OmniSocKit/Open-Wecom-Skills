---
name: open-wecom-skills
description: |
  企业微信（WeCom）全域开发知识体系 SKILL。覆盖三大开发模式（企业内部开发 / 服务商代开发 / 第三方应用）共 41 个子 SKILL、550+ API 接口。
  TRIGGER: 当用户提到企业微信、WeCom、wecom、qyapi.weixin.qq.com、企微开发、SCRM、客户联系、服务商代开发等相关话题时触发。
  本 SKILL 是所有 wecom-* 子 SKILL 的入口索引与使用指南。
---

# Open WeCom Skills — 企业微信开发知识体系

你现在是企业微信开放能力专家。本 SKILL 是整个知识体系的**入口与导航**，指导你如何高效查阅和使用 `skills/` 目录下的 41 个子 SKILL 文档。

---

## 1. 概述

Open WeCom Skills 是一套**为 AI 深度优化**的企业微信开发结构化知识库，源于六年企微生态实战经验：

- **精确 API 知识** — 每个接口的参数、响应、限制都有结构化定义，杜绝 AI 幻觉
- **踩坑指南** — 内置 Gotcha Guide，提炼真实项目中的边界条件与陷阱
- **即用代码模板** — Python / TypeScript / Go / Java / PHP 五语言模板

### 1.1 核心价值

| 无 SKILL | 有 SKILL |
|----------|----------|
| AI 凭记忆编造 API 参数 | AI 精确查阅接口定义 |
| 遗漏 WelcomeCode 20 秒时限 | 主动提醒关键限制 |
| 搞混 `follow_user` vs `follow_info` | 参数语义完全准确 |
| 不知道 linkedcorp 全 POST | 知道每个踩坑点 |

---

## 2. 触发条件

当用户的需求涉及以下关键词时，应激活本 SKILL 并按需加载对应子 SKILL：

| 关键词 | 说明 |
|--------|------|
| 企业微信、WeCom、企微 | 泛指企微相关开发 |
| `qyapi.weixin.qq.com` | 企微 API 域名 |
| `corpid`、`corpsecret`、`access_token` | 认证凭证相关 |
| 通讯录、成员、部门 | 通讯录管理 |
| 客户联系、SCRM、外部联系人 | CRM 域 |
| 群发、欢迎语、朋友圈 | 营销触达 |
| 审批、打卡、日程 | 办公域 |
| 微信客服、会话 | 客服域 |
| JS-SDK、小程序、H5 | 客户端域 |
| 服务商、代开发、ISV | 服务商模式 |
| 第三方应用、应用市场 | 第三方应用模式 |
| 会话存档、安全管理 | 高级域 |

---

## 3. 目录结构

```
skills/
├── SKILL.md                  ← 你正在阅读的入口文件
├── enterprise/               # 企业内部开发（30 个子 SKILL）
│   ├── wecom-core.md         #   认证基座（所有 SKILL 的前置依赖）
│   ├── wecom-contact.md      #   通讯录管理
│   ├── wecom-app.md          #   应用管理
│   ├── wecom-message.md      #   消息管理
│   ├── wecom-media.md        #   素材管理
│   ├── wecom-auth.md         #   身份验证
│   ├── wecom-jssdk.md        #   JS-SDK
│   ├── wecom-crm-*.md        #   CRM 域（8 个）
│   ├── wecom-approval.md     #   审批
│   ├── wecom-doc.md          #   文档
│   ├── wecom-meeting.md      #   会议
│   ├── wecom-office-*.md     #   办公域（4 个）
│   ├── wecom-kf.md           #   微信客服
│   ├── wecom-miniapp.md      #   小程序
│   ├── wecom-mobile-sdk.md   #   移动端 SDK
│   ├── wecom-advanced.md     #   高级功能
│   ├── wecom-security.md     #   安全管理
│   ├── wecom-data-intelligence.md  # 数据与智能
│   └── wecom-vertical.md     #   行业方案
├── isv/                      # 服务商代开发（8 个子 SKILL）
│   ├── wecom-isv-core.md     #   三级凭证体系
│   ├── wecom-isv-auth.md     #   授权流程
│   ├── wecom-isv-callback.md #   双通道回调
│   ├── wecom-isv-license.md  #   接口调用许可
│   ├── wecom-isv-billing.md  #   收银台
│   ├── wecom-isv-jssdk.md    #   JS-SDK 差异
│   ├── wecom-isv-provider.md #   服务商管理
│   └── wecom-isv-appendix.md #   错误码与兼容性
└── third-party/              # 第三方应用开发（3 个子 SKILL）
    ├── wecom-3rd-quickstart.md  # 快速入门
    ├── wecom-3rd-idconvert.md   # ID 转换
    └── wecom-3rd-data.md        # 数据 API
```

---

## 4. 子 SKILL 索引速查

### 4.1 企业内部开发 (`enterprise/`) — 30 SKILL

自建应用使用 `corpid + corpsecret` 获取 `access_token`，直接调用 API。

#### 基础域（7）

| 子 SKILL | 说明 | API 数 |
|----------|------|--------|
| `wecom-core` | **必读基座** · access_token · 回调验签 · 频率限制 · 错误码 | 5 |
| `wecom-contact` | 成员 / 部门 / 标签 CRUD · 异步批量导入 | 35 |
| `wecom-app` | 应用管理 · 自定义菜单 · 工作台 · 自建机器人 | 20 |
| `wecom-message` | 消息发送 · 模板卡片 · 群聊 · 撤回 | 25 |
| `wecom-media` | 素材上传下载 · 图片 / 语音 / 文件 | 6 |
| `wecom-auth` | OAuth2 · 扫码登录 · SSO · 二次验证 | 12 |
| `wecom-jssdk` | 网页 JS-SDK · 签名 · 分享 · 定位 | 30 |

#### CRM 域（8）

| 子 SKILL | 说明 | API 数 |
|----------|------|--------|
| `wecom-crm-customer` | 客户列表 · 详情 · 备注 · unionid 转换 | 8 |
| `wecom-crm-tag` | 企业标签 · 规则组标签 · 编辑客户标签 | 12 |
| `wecom-crm-masssend` | 群发消息 · 欢迎语 · 群发记录 | 10 |
| `wecom-crm-contactway` | 联系我 · 渠道活码 · 入群方式 | 14 |
| `wecom-crm-moment` | 客户朋友圈 · 发表 / 互动 / 统计 | 12 |
| `wecom-crm-group` | 客户群管理 · opengid 转换 · 加群方式 | 8 |
| `wecom-crm-transfer` | 在职 / 离职继承 · 接替状态查询 | 8 |
| `wecom-crm-acquisition` | 获客助手 · 获客链接 · 额度统计 | 10 |

#### 办公域（8）

| 子 SKILL | 说明 | API 数 |
|----------|------|--------|
| `wecom-approval` | 审批模板 · 实例 CRUD · 流程推进 | 15 |
| `wecom-doc` | 文档 · 权限 · 收集表 | 15 |
| `wecom-meeting` | 会议 · 预约 / PSTN / 网络研讨会 | 12 |
| `wecom-office-checkin` | 打卡规则 · 记录 · 月度汇总 | 6 |
| `wecom-office-calendar` | 日历 · 日程 · 参与者管理 | 10 |
| `wecom-office-email` | 邮件 · 收件箱 · 群组邮箱 | 12 |
| `wecom-office-wedrive` | 微盘 · 文件管理 · 分块上传 | 18 |
| `wecom-office-live` | 直播 · 预约 / 统计 / 回放 | 8 |

#### 客服域（1）· 客户端域（3）· 高级域（3）· 行业域（1）

| 子 SKILL | 说明 | API 数 |
|----------|------|--------|
| `wecom-kf` | 微信客服 · 会话 / 消息 / 知识库 | 22 |
| `wecom-miniapp` | 小程序 · 登录认证 · jwecom | 15 |
| `wecom-mobile-sdk` | iOS / Android / Harmony SDK | 7 |
| `wecom-advanced` | 会话存档 · 企业支付 · 电子发票 | 40 |
| `wecom-security` | 文件防泄漏 · 设备 · 人事管理 | 18 |
| `wecom-data-intelligence` | AI 模型 · 知识集 · 专区 | 35 |
| `wecom-vertical` | 家校 / 政民 / 上下游 / 互联 / 收款 | 90 |

### 4.2 服务商代开发 (`isv/`) — 8 SKILL

使用 `suite_access_token` / `provider_access_token` 三级凭证体系。

| 子 SKILL | 说明 |
|----------|------|
| `wecom-isv-core` | **必读基座** · 三级凭证 · 自建差异 · 多企业架构 |
| `wecom-isv-auth` | 授权流程 · 预授权码 · 永久授权码 |
| `wecom-isv-callback` | 双通道回调 · 指令回调 + 数据回调 |
| `wecom-isv-license` | 接口调用许可 · 购买 / 续期 / 激活 |
| `wecom-isv-billing` | 收银台 · 定价 · 收款订单 |
| `wecom-isv-jssdk` | JS-SDK 签名差异 · 代开发模式 |
| `wecom-isv-provider` | 服务商管理 · 登录 · ID 转换 |
| `wecom-isv-appendix` | 错误码 · 频率限制 · 兼容性矩阵 |

### 4.3 第三方应用开发 (`third-party/`) — 3 SKILL

应用市场分发，凭证体系复用 ISV SKILL，业务 API 复用企业内部开发 SKILL。

| 子 SKILL | 说明 |
|----------|------|
| `wecom-3rd-quickstart` | 注册 → 授权 → 上架 → 推广全流程 |
| `wecom-3rd-idconvert` | corpid / userid / external_userid 加密互转 |
| `wecom-3rd-data` | 获客组件 · 会话存档 · AI 模型接入 |

---

## 5. 使用工作流

收到企业微信开发需求时，遵循以下四步流程：

### Step 1 — 识别所需的子 SKILL

根据用户需求关键词，对照第 2 节触发条件表和第 4 节索引速查，确定需要加载的子 SKILL 文件。

**规则**：`wecom-core`（或 ISV 场景下的 `wecom-isv-core`）是所有场景的**前置依赖**，必须优先阅读。

### Step 2 — 加载子 SKILL 文档

读取对应的 `.md` 文件，获取精确的 API 定义、参数约束和踩坑指南：

```
# 示例：用户需要实现客户标签管理
1. 先读 skills/enterprise/wecom-core.md      （认证基座）
2. 再读 skills/enterprise/wecom-crm-tag.md   （标签 API）
```

### Step 3 — 基于 SKILL 生成代码

严格依据子 SKILL 中的 API 定义生成代码，**禁止凭记忆编造 API 参数**。

### Step 4 — 交叉验证

对照子 SKILL 中的 Gotcha Guide（踩坑指南），检查生成的代码是否遗漏关键约束。

---

## 6. 需求路由表

当用户描述业务需求时，快速定位应加载的子 SKILL：

| 需求关键词 | 推荐子 SKILL |
|-----------|-------------|
| 成员、部门、标签、通讯录 | `wecom-contact` |
| 发消息、群聊、机器人、webhook | `wecom-message` |
| 应用配置、菜单、工作台 | `wecom-app` |
| 登录、OAuth、身份、扫码 | `wecom-auth` |
| 客户、外部联系人、unionid | `wecom-crm-customer` |
| 客户标签、规则组 | `wecom-crm-tag` |
| 群发、欢迎语 | `wecom-crm-masssend` |
| 联系我、渠道活码 | `wecom-crm-contactway` |
| 朋友圈 | `wecom-crm-moment` |
| 客户群 | `wecom-crm-group` |
| 离职继承、在职继承 | `wecom-crm-transfer` |
| 获客助手 | `wecom-crm-acquisition` |
| 审批、请假、报销 | `wecom-approval` |
| 会议、预约、录制 | `wecom-meeting` |
| 客服、对话、工单 | `wecom-kf` |
| 文档、表格、收集表 | `wecom-doc` |
| 图片、文件、素材 | `wecom-media` |
| 打卡、日程、邮件、微盘、直播 | `wecom-office-*` |
| JS-SDK、H5、网页 | `wecom-jssdk` |
| 小程序 | `wecom-miniapp` |
| 支付、存档、安全 | `wecom-advanced` |
| 家校、政务、上下游 | `wecom-vertical` |
| 服务商、代开发、ISV | `wecom-isv-*` |
| 第三方应用、应用市场 | `wecom-3rd-*` |

---

## 7. 代码生成强制规则

生成企业微信相关代码时，**必须**遵守以下规则（详见 `wecom-core.md` 第 7 节）：

1. **Token 缓存** — 实现 `access_token` 缓存 + 过期前主动刷新，禁止每次请求都调用 `gettoken`
2. **错误重试** — `errcode=-1`（系统繁忙）自动重试，最多 3 次，间隔递增
3. **Token 失效处理** — `errcode=42001/40014` 时自动刷新 token 并重试一次
4. **类型安全** — 强类型语言必须定义请求 / 响应的类型或结构体
5. **超时设置** — HTTP 请求必须设置超时（建议 10 秒）
6. **敏感信息隔离** — `corpid` / `corpsecret` 从环境变量读取，禁止硬编码
7. **日志规范** — 记录请求路径、errcode、耗时，但 `access_token` 不得明文记录
8. **幂等标注** — 代码注释中标注该操作是否幂等

---

## 8. 高频踩坑速查

以下是跨 SKILL 的高频陷阱，各子 SKILL 中有更详细的 Gotcha Guide：

| 陷阱 | 说明 | 涉及 SKILL |
|------|------|-----------|
| Token 互相覆盖 | 多实例部署各自获取 token，后获取的使先前的失效 | `wecom-core` |
| WelcomeCode 20 秒过期 | 必须在 20 秒内使用，超时即失效 | `wecom-crm-masssend` |
| `follow_user` vs `follow_info` | 字段语义不同，混用会导致数据错误 | `wecom-crm-customer` |
| linkedcorp 全 POST | 企业互联的所有 API 都是 POST，即使是查询 | `wecom-contact` |
| 回调 5 秒超时 | 回调必须 5 秒内响应，建议异步处理业务逻辑 | `wecom-core` |
| IP 白名单 | 服务器出口 IP 可能与预期不同（NAT / LB） | `wecom-core` |
| `external_userid` 不同调用方不同 | 不同应用获取的值不同，不可混用 | `wecom-crm-customer` |
| 审批模板 ID 与实例 ID 混淆 | `template_id` 和 `sp_no` 是不同概念 | `wecom-approval` |

---

## 9. 安全说明

本知识库是**纯知识交付，零副作用**：

- **不调用外部 API** — 不会向企业微信或任何第三方服务器发送请求
- **不需要凭证** — 不要求提供 `corpid`、`secret`、`access_token` 等敏感信息
- **不收集数据** — 不包含遥测、埋点、使用统计
- **内容可验证** — 所有 SKILL 内容基于开源知识库，可交叉校验

---

## 10. 相关资源

- 官方文档：`https://developer.work.weixin.qq.com/document/`
- 错误码查询：`https://developer.work.weixin.qq.com/devtool/query`
- MCP Server：`npx @omnisockit/mcp-server`
- GitHub：`https://github.com/OmniSocKit/Open-Wecom-Skills`
