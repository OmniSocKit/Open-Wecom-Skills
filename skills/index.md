---
title: Skills 总览
---

# Skills

让你的 AI 大模型成为企业微信开发专家，覆盖 **三大开发模式** 共 **41 个 SKILL**。

每个 SKILL 包含：结构化 API 速查 · 参数详情 · 踩坑指南 · 五语言代码模板

---

## 基础域

| Skill | 适用场景 |
|-------|---------|
| [wecom-core](/skills/enterprise/wecom-core) | access_token 鉴权 · 回调验签 · 频率限制 · 错误码映射 |
| [wecom-contact](/skills/enterprise/wecom-contact) | 成员 / 部门 / 标签 CRUD · 异步批量导入导出 · 互联企业 |
| [wecom-app](/skills/enterprise/wecom-app) | 应用 CRUD · 自定义菜单 · 工作台 · 自建机器人 |
| [wecom-message](/skills/enterprise/wecom-message) | 消息发送 · 模板卡片 · 群聊 · 撤回 · 接收回调 |
| [wecom-media](/skills/enterprise/wecom-media) | 临时素材上传下载 · 图片 · 语音 · 异步上传 |
| [wecom-auth](/skills/enterprise/wecom-auth) | OAuth2 网页授权 · 扫码登录 · 二次验证 |

## CRM 域

| Skill | 适用场景 |
|-------|---------|
| [wecom-crm-customer](/skills/enterprise/wecom-crm-customer) | 客户列表 · 详情 · 备注 · unionid 转换 |
| [wecom-crm-tag](/skills/enterprise/wecom-crm-tag) | 企业标签 · 规则组标签 · 编辑客户标签 |
| [wecom-crm-masssend](/skills/enterprise/wecom-crm-masssend) | 创建群发 · 欢迎语 · 群发记录 · 提醒/停止 |
| [wecom-crm-contactway](/skills/enterprise/wecom-crm-contactway) | 联系我配置 · 渠道活码 · 入群方式 · 临时会话 |
| [wecom-crm-moment](/skills/enterprise/wecom-crm-moment) | 创建朋友圈任务 · 发表记录 · 互动数据 |
| [wecom-crm-group](/skills/enterprise/wecom-crm-group) | 群列表 · 群详情 · opengid 转换 · 加群方式 |
| [wecom-crm-transfer](/skills/enterprise/wecom-crm-transfer) | 在职继承 · 离职继承 · 接替状态查询 |
| [wecom-crm-acquisition](/skills/enterprise/wecom-crm-acquisition) | 获客链接 · 客户信息 · 额度统计 |

## 办公域

| Skill | 适用场景 |
|-------|---------|
| [wecom-approval](/skills/enterprise/wecom-approval) | 审批模板 · 实例 CRUD · 流程推进 · 回调 |
| [wecom-doc](/skills/enterprise/wecom-doc) | 文档 CRUD · 权限管理 · 收集表 |
| [wecom-meeting](/skills/enterprise/wecom-meeting) | 预约会议 · 布局 · PSTN · 网络研讨会 |
| [wecom-office-checkin](/skills/enterprise/wecom-office-checkin) | 打卡规则 · 打卡记录 · 月度汇总 |
| [wecom-office-calendar](/skills/enterprise/wecom-office-calendar) | 日历 CRUD · 日程管理 · 参与者 |
| [wecom-office-email](/skills/enterprise/wecom-office-email) | 发送邮件 · 收件箱 · 群组邮箱 |
| [wecom-office-wedrive](/skills/enterprise/wecom-office-wedrive) | 空间 CRUD · 文件管理 · 权限 · 分块上传 |
| [wecom-office-live](/skills/enterprise/wecom-office-live) | 预约直播 · 详情 · 观看统计 · 回放 |

## 客服域

| Skill | 适用场景 |
|-------|---------|
| [wecom-kf](/skills/enterprise/wecom-kf) | 客服账号 · 接待人员 · 会话 · 消息收发 · 知识库 |

## 客户端域

| Skill | 适用场景 |
|-------|---------|
| [wecom-jssdk](/skills/enterprise/wecom-jssdk) | 网页应用接入 · 签名 · 分享 · 定位 · 扫码 |
| [wecom-miniapp](/skills/enterprise/wecom-miniapp) | 登录认证 · 客户端 API · jwecom 对象 |
| [wecom-mobile-sdk](/skills/enterprise/wecom-mobile-sdk) | iOS · Android · Harmony 登录 / 分享 / 客服 |

## 高级域

| Skill | 适用场景 |
|-------|---------|
| [wecom-advanced](/skills/enterprise/wecom-advanced) | 会话存档 · 企业支付 · 电子发票 · 汇报 |
| [wecom-security](/skills/enterprise/wecom-security) | 文件防泄漏 · 设备管理 · 人事助手 |
| [wecom-data-intelligence](/skills/enterprise/wecom-data-intelligence) | 会话分析 · AI 模型 · 知识集 · 专区程序 |

## 行业域

| Skill | 适用场景 |
|-------|---------|
| [wecom-vertical](/skills/enterprise/wecom-vertical) | 家校沟通 · 政民沟通 · 企业互联 · 上下游 · 收款 |

---

## ISV 服务商代开发

使用 `suite_access_token` / `provider_access_token` 体系。

| Skill | 适用场景 |
|-------|---------|
| [wecom-isv-core](/skills/isv/wecom-isv-core) | 三级凭证体系 · 自建差异 · 多企业架构 |
| [wecom-isv-auth](/skills/isv/wecom-isv-auth) | 预授权码 · 永久授权码 · 授权信息管理 |
| [wecom-isv-callback](/skills/isv/wecom-isv-callback) | 双通道架构 · 指令回调 + 数据回调 |
| [wecom-isv-license](/skills/isv/wecom-isv-license) | 订单管理 · 帐号激活 / 续期 / 转移 |
| [wecom-isv-billing](/skills/isv/wecom-isv-billing) | 定价策略 · 商户号 · 收款订单 |
| [wecom-isv-jssdk](/skills/isv/wecom-isv-jssdk) | 代开发签名 · 多企业 ticket · OAuth 差异 |
| [wecom-isv-provider](/skills/isv/wecom-isv-provider) | 登录授权 · ID 转换 · 企业推广注册 |
| [wecom-isv-appendix](/skills/isv/wecom-isv-appendix) | 错误码汇总 · 频率限制 · 兼容性矩阵 |

---

## 第三方应用开发

应用市场分发，凭证体系复用 ISV SKILL。

| Skill | 适用场景 |
|-------|---------|
| [wecom-3rd-quickstart](/skills/third-party/wecom-3rd-quickstart) | 注册 → 授权 → 上架 → 推广全流程 |
| [wecom-3rd-idconvert](/skills/third-party/wecom-3rd-idconvert) | corpid / userid / external_userid 加密互转 |
| [wecom-3rd-data](/skills/third-party/wecom-3rd-data) | 获客组件 · 会话存档 · AI 模型接入 |

---

## 相关资源

- [SKILL 架构规范](/docs/guides/architecture) — 了解 SKILL 的内部结构
- [贡献指南](https://github.com/iuraixmi/Open-Wecom-Skills/blob/main/CONTRIBUTING.md) — Fork → 新增 / 修改 SKILL → 提交 PR
