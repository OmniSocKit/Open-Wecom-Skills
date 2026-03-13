# Skills 目录索引

> 本目录按**开发模式**组织企业微信 API SKILL 文件，共 **41 个 SKILL**。
>
> 📖 **在线文档**：建议通过 [文档站](https://github.com/OmniSocKit/Open-Wecom-Skills) 浏览，体验更佳（搜索 + 侧边栏导航）。

---

## 📁 目录结构

```
skills/
├── enterprise/        # 企业内部开发（30 SKILL）
├── isv/               # 服务商代开发（8 SKILL）
└── third-party/       # 第三方应用开发（3 SKILL）
```

---

## 企业内部开发 (`enterprise/`) — 30 SKILL

自建应用直接使用 `corpid + corpsecret` 获取 `access_token`。

### 基础域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-core](enterprise/wecom-core.md) | 认证、回调验签、频率限制、错误码映射 |
| [wecom-contact](enterprise/wecom-contact.md) | 成员/部门/标签 CRUD、异步批量 |
| [wecom-app](enterprise/wecom-app.md) | 应用管理、自定义菜单、工作台 |
| [wecom-message](enterprise/wecom-message.md) | 应用消息、群聊、模板卡片 |
| [wecom-media](enterprise/wecom-media.md) | 素材上传下载、图片、语音 |
| [wecom-auth](enterprise/wecom-auth.md) | OAuth2、扫码登录、SSO |

### CRM 域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-crm-customer](enterprise/wecom-crm-customer.md) | 客户列表 · 详情 · 备注 |
| [wecom-crm-tag](enterprise/wecom-crm-tag.md) | 企业标签 · 规则组标签 |
| [wecom-crm-masssend](enterprise/wecom-crm-masssend.md) | 群发 · 欢迎语 |
| [wecom-crm-contactway](enterprise/wecom-crm-contactway.md) | 联系我 · 渠道活码 |
| [wecom-crm-moment](enterprise/wecom-crm-moment.md) | 客户朋友圈 |
| [wecom-crm-group](enterprise/wecom-crm-group.md) | 客户群 · opengid 转换 |
| [wecom-crm-transfer](enterprise/wecom-crm-transfer.md) | 在职/离职继承 |
| [wecom-crm-acquisition](enterprise/wecom-crm-acquisition.md) | 获客助手 |

### 办公域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-approval](enterprise/wecom-approval.md) | 审批模板 · 实例 · 流程推进 |
| [wecom-doc](enterprise/wecom-doc.md) | 文档 · 收集表 |
| [wecom-meeting](enterprise/wecom-meeting.md) | 会议 · PSTN · 网络研讨会 |
| [wecom-office-checkin](enterprise/wecom-office-checkin.md) | 打卡规则 · 记录 |
| [wecom-office-calendar](enterprise/wecom-office-calendar.md) | 日历 · 日程管理 |
| [wecom-office-email](enterprise/wecom-office-email.md) | 邮件 · 群组邮箱 |
| [wecom-office-wedrive](enterprise/wecom-office-wedrive.md) | 微盘 · 文件管理 |
| [wecom-office-live](enterprise/wecom-office-live.md) | 直播 · 观看统计 |

### 客服域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-kf](enterprise/wecom-kf.md) | 客服账号 · 会话 · 消息 · 知识库 |

### 客户端域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-jssdk](enterprise/wecom-jssdk.md) | 网页 JS-SDK · 签名 · 分享 |
| [wecom-miniapp](enterprise/wecom-miniapp.md) | 小程序登录 · 客户端 API |
| [wecom-mobile-sdk](enterprise/wecom-mobile-sdk.md) | iOS · Android · Harmony |

### 高级域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-advanced](enterprise/wecom-advanced.md) | 会话存档 · 企业支付 · 电子发票 |
| [wecom-security](enterprise/wecom-security.md) | 文件防泄漏 · 设备管理 |
| [wecom-data-intelligence](enterprise/wecom-data-intelligence.md) | 会话分析 · AI 模型 · 知识集 |

### 行业域

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-vertical](enterprise/wecom-vertical.md) | 家校 · 政务 · 企业互联 · 上下游 |

---

## 服务商代开发 (`isv/`) — 8 SKILL

使用 `suite_access_token` / `provider_access_token` 体系。

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-isv-core](isv/wecom-isv-core.md) | 三级凭证 · 自建差异 · 多企业架构 |
| [wecom-isv-auth](isv/wecom-isv-auth.md) | 授权流程（预授权码/永久授权码） |
| [wecom-isv-callback](isv/wecom-isv-callback.md) | 双通道回调体系 |
| [wecom-isv-license](isv/wecom-isv-license.md) | 接口调用许可（购买/续期/激活） |
| [wecom-isv-billing](isv/wecom-isv-billing.md) | 收银台 · 定价 · 收款 |
| [wecom-isv-jssdk](isv/wecom-isv-jssdk.md) | JS-SDK 签名差异 |
| [wecom-isv-provider](isv/wecom-isv-provider.md) | 服务商管理 · 登录 · ID 转换 |
| [wecom-isv-appendix](isv/wecom-isv-appendix.md) | 错误码 · 频率限制 · 兼容性 |

> 💡 ISV SKILL 的凭证体系**同样适用于第三方应用开发**。

---

## 第三方应用开发 (`third-party/`) — 3 SKILL

应用市场分发，面向多企业。基础凭证体系复用 `isv/` 系列 SKILL。

| SKILL | 覆盖范围 |
|-------|---------|
| [wecom-3rd-quickstart](third-party/wecom-3rd-quickstart.md) | 快速入门（注册→授权→上架→推广） |
| [wecom-3rd-idconvert](third-party/wecom-3rd-idconvert.md) | ID 转换（corpid/userid/external_userid 加密互转） |
| [wecom-3rd-data](third-party/wecom-3rd-data.md) | 数据 API 专区（获客组件/会话存档/AI 模型） |
