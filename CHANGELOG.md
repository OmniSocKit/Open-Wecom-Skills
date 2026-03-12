# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.0.1] - 2026-03-12

### Added

#### 企业内部开发（`skills/enterprise/`）— 30 SKILL

- **基础域 (7)**：`wecom-core` / `wecom-contact` / `wecom-app` / `wecom-message` / `wecom-media` / `wecom-auth` / `wecom-jssdk`
- **CRM 域 (8)**：`wecom-crm-customer` / `wecom-crm-tag` / `wecom-crm-masssend` / `wecom-crm-contactway` / `wecom-crm-moment` / `wecom-crm-group` / `wecom-crm-transfer` / `wecom-crm-acquisition`
- **办公域 (8)**：`wecom-approval` / `wecom-doc` / `wecom-meeting` / `wecom-office-checkin` / `wecom-office-calendar` / `wecom-office-email` / `wecom-office-wedrive` / `wecom-office-live`
- **客服域 (1)**：`wecom-kf`
- **客户端域 (2)**：`wecom-miniapp` / `wecom-mobile-sdk`
- **高级域 (3)**：`wecom-advanced` / `wecom-security` / `wecom-data-intelligence`
- **行业域 (1)**：`wecom-vertical`

#### 服务商代开发（`skills/isv/`）— 8 SKILL

- `wecom-isv-core` — 三级凭证体系、自建应用差异、多企业架构
- `wecom-isv-auth` — 授权流程（预授权码/永久授权码）
- `wecom-isv-callback` — 双通道回调体系（指令回调 + 数据回调）
- `wecom-isv-license` — 接口调用许可（购买/续期/激活）
- `wecom-isv-billing` — 收银台（定价/收款/订单）
- `wecom-isv-jssdk` — JS-SDK 签名差异（代开发模式）
- `wecom-isv-provider` — 服务商管理（登录/注册/ID 转换）
- `wecom-isv-appendix` — 错误码、频率限制、兼容性矩阵

#### 第三方应用开发（`skills/third-party/`）— 3 SKILL

- `wecom-3rd-quickstart` — 快速入门（注册→授权→上架→推广全流程）
- `wecom-3rd-idconvert` — ID 转换（corpid/userid/external_userid 加密互转）
- `wecom-3rd-data` — 数据 API 专区（获客组件/会话存档/AI 模型）

#### 文档与工程

- 统一 SKILL 结构：API 速查 + 详情 + 工作流 + 代码模板 + 踩坑指南 + Code Review
- 五语言代码模板：Python / TypeScript / Go / Java / PHP
- `docs/guides/architecture.md` — SKILL 架构设计规范
- `docs/guides/quickstart.md` — 企业微信自建应用快速入门教程
- `docs/references/api-index.md` — 企微官方模块与 SKILL 映射索引
- `docs/references/error-codes.md` — 全局错误码完整版（300+）
- `docs/references/industry-codes.md` — 企业规模与行业信息
- `docs/testing/` — P0/P1 场景测试用例与结果
- 双语 README（中文 / English）
- Apache 2.0 License
- 贡献指南（中/英）+ 行为准则 + Issue 模板 ×3 + PR 模板
