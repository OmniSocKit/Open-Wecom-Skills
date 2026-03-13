# 企业微信 API 模块索引

> 本索引列出企业微信开放平台全部模块与对应 SKILL 的映射关系。
> 开发者可根据需求快速定位对应的 SKILL 文件。

---

## 模块 → SKILL 映射表

| 官方模块 | 对应 SKILL | 域 |
|---------|-----------|-----|
| 获取 access_token | `wecom-core` | 基础 |
| 回调配置 | `wecom-core` | 基础 |
| IP 白名单 | `wecom-core` | 基础 |
| 成员管理 | `wecom-contact` | 基础 |
| 部门管理 | `wecom-contact` | 基础 |
| 标签管理 | `wecom-contact` | 基础 |
| 异步批量接口 | `wecom-contact` | 基础 |
| 互联企业 | `wecom-contact` | 基础 |
| 通讯录回调 | `wecom-contact` | 基础 |
| 应用管理 | `wecom-app` | 基础 |
| 自定义菜单 | `wecom-app` | 基础 |
| 工作台自定义 | `wecom-app` | 基础 |
| 发送消息 | `wecom-message` | 基础 |
| 群聊管理 | `wecom-message` | 基础 |
| 模板卡片 | `wecom-message` | 基础 |
| 消息回调 | `wecom-message` | 基础 |
| 素材管理 | `wecom-media` | 基础 |
| 网页授权 | `wecom-auth` | 基础 |
| 扫码授权 | `wecom-auth` | 基础 |
| 二次验证 | `wecom-auth` | 基础 |
| 客户联系-客户管理 | `wecom-crm-customer` | CRM |
| 客户联系-标签管理 | `wecom-crm-tag` | CRM |
| 客户联系-联系我 | `wecom-crm-contactway` | CRM |
| 客户联系-客户群 | `wecom-crm-group` | CRM |
| 客户联系-群发 | `wecom-crm-masssend` | CRM |
| 客户联系-朋友圈 | `wecom-crm-moment` | CRM |
| 客户联系-继承 | `wecom-crm-transfer` | CRM |
| 获客助手 | `wecom-crm-acquisition` | CRM |
| OA-审批 | `wecom-approval` | 办公 |
| OA-打卡 | `wecom-office-checkin` | 办公 |
| OA-日程 | `wecom-office-calendar` | 办公 |
| 邮件 | `wecom-office-email` | 办公 |
| 微盘 | `wecom-office-wedrive` | 办公 |
| 直播 | `wecom-office-live` | 办公 |
| 文档 | `wecom-doc` | 办公 |
| 会议 | `wecom-meeting` | 办公 |
| 微信客服 | `wecom-kf` | 客服 |
| JS-SDK | `wecom-jssdk` | 客户端 |
| 小程序 | `wecom-miniapp` | 客户端 |
| 移动端 SDK | `wecom-mobile-sdk` | 客户端 |
| 会话存档 | `wecom-advanced` | 高级 |
| 企业支付 | `wecom-advanced` | 高级 |
| 电子发票 | `wecom-advanced` | 高级 |
| 安全管理 | `wecom-security` | 高级 |
| 数据与智能 | `wecom-data-intelligence` | 高级 |
| 家校沟通 | `wecom-vertical` | 行业 |
| 政民沟通 | `wecom-vertical` | 行业 |
| 企业互联 | `wecom-vertical` | 行业 |
| 上下游 | `wecom-vertical` | 行业 |

---

## 需求 → SKILL 快速查找

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|
| 成员、部门、标签、通讯录 | `wecom-contact` |
| 发消息、群聊、机器人、webhook | `wecom-message` |
| 应用配置、菜单、工作台 | `wecom-app` |
| 登录、OAuth、身份、扫码 | `wecom-auth` |
| 客户、CRM、外部联系人 | `wecom-crm-customer` |
| 标签、分组、打标 | `wecom-crm-tag` |
| 群发、欢迎语 | `wecom-crm-masssend` |
| 联系我、活码 | `wecom-crm-contactway` |
| 朋友圈 | `wecom-crm-moment` |
| 客户群 | `wecom-crm-group` |
| 客户继承、离职分配 | `wecom-crm-transfer` |
| 获客链接 | `wecom-crm-acquisition` |
| 审批、请假、报销 | `wecom-approval` |
| 会议 | `wecom-meeting` |
| 客服、对话、工单 | `wecom-kf` |
| 文档、表格、收集表 | `wecom-doc` |
| 图片、文件、素材 | `wecom-media` |
| 打卡、日程、邮件、微盘、直播 | `wecom-office-*` |
| JS-SDK、H5、网页 | `wecom-jssdk` |
| 小程序 | `wecom-miniapp` |
| 支付、存档 | `wecom-advanced` |
| 安全、设备 | `wecom-security` |
| AI、数据专区 | `wecom-data-intelligence` |
| 家校、政务、上下游 | `wecom-vertical` |

---

## 服务商代开发 (ISV) 模块 → SKILL 映射表

> 路径：`skills/isv/`

| 官方模块 | 对应 SKILL |
|---------|-----------|
| 凭证管理（suite_access_token） | `wecom-isv-core` |
| 授权流程（预授权码/永久授权码） | `wecom-isv-auth` |
| 回调事件（双通道） | `wecom-isv-callback` |
| 接口许可（购买/激活） | `wecom-isv-license` |
| 收银台与收费 | `wecom-isv-billing` |
| JS-SDK 签名差异 | `wecom-isv-jssdk` |
| 服务商管理 | `wecom-isv-provider` |
| 附录（错误码/限制） | `wecom-isv-appendix` |

---

## 第三方应用开发模块 → SKILL 映射表

> 路径：`skills/third-party/`

| 官方模块 | 对应 SKILL |
|---------|-----------|
| 快速入门（注册/授权/上架） | `wecom-3rd-quickstart` |
| ID 转换（corpid/userid 加密互转） | `wecom-3rd-idconvert` |
| 数据 API 专区（获客/存档/AI） | `wecom-3rd-data` |

> 💡 第三方应用的基础凭证体系复用 ISV SKILL，业务 API 复用企业内部开发 SKILL。

---

## 需求 → SKILL 快速查找

| 需求关键词 | 推荐 SKILL |
|-----------|-----------|\n| 成员、部门、标签、通讯录 | `wecom-contact` |
| 发消息、群聊、机器人、webhook | `wecom-message` |
| 应用配置、菜单、工作台 | `wecom-app` |
| 登录、OAuth、身份、扫码 | `wecom-auth` |
| 客户、CRM、外部联系人 | `wecom-crm-customer` |
| 标签、分组、打标 | `wecom-crm-tag` |
| 群发、欢迎语 | `wecom-crm-masssend` |
| 联系我、活码 | `wecom-crm-contactway` |
| 朋友圈 | `wecom-crm-moment` |
| 客户群 | `wecom-crm-group` |
| 客户继承、离职分配 | `wecom-crm-transfer` |
| 获客链接 | `wecom-crm-acquisition` |
| 审批、请假、报销 | `wecom-approval` |
| 会议 | `wecom-meeting` |
| 客服、对话、工单 | `wecom-kf` |
| 文档、表格、收集表 | `wecom-doc` |
| 图片、文件、素材 | `wecom-media` |
| 打卡、日程、邮件、微盘、直播 | `wecom-office-*` |
| JS-SDK、H5、网页 | `wecom-jssdk` |
| 小程序 | `wecom-miniapp` |
| 支付、存档 | `wecom-advanced` |
| 安全、设备 | `wecom-security` |
| AI、数据专区 | `wecom-data-intelligence` |
| 家校、政务、上下游 | `wecom-vertical` |
| **第三方应用、应用市场** | **`wecom-3rd-quickstart`** |
| **服务商代开发、ISV** | **`wecom-isv-core`** |
| **ID 转换、open_userid** | **`wecom-3rd-idconvert`** |
| **数据 API、会话存档(第三方)** | **`wecom-3rd-data`** |

---

## 附录文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 快速入门 | `docs/guides/quickstart.md` | 5 步完成自建应用创建到首次 API 调用 |
| 全局错误码 | `docs/references/error-codes.md` | 300+ 条 errcode 完整速查表 |
| 企业规模与行业信息 | `docs/references/industry-codes.md` | 行业代码和企业规模枚举 |
| SKILL 架构规范 | `docs/guides/architecture.md` | SKILL 文件结构和编写规范 |
| 深色模式适配 | `skills/enterprise/wecom-jssdk.md` → §10.5 | CSS 媒体查询 + UA 判断 |
| **SKILL 目录索引** | **`skills/README.md`** | **内部/ISV/第三方三分类导航** |

