<div align="center">

# ⚡ Open WeCom Skills

**让你的 AI 大模型成为企业微信开发专家**

41 Skills · 550+ APIs · 三大开发模式全覆盖

[English](./README.en.md) | 简体中文

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/Docs-GitHub_Pages-14b8a6?logo=github)](https://iuraixmi.github.io/Open-Wecom-Skills/)

</div>

---

## ✨ 这是什么

Open WeCom Skills 是一套面向 AI 大模型的**企业微信开发结构化知识体系**。

它不是官方文档的搬运，而是一套**为 AI 深度优化**的知识工程：

- 🎯 **精确 API 知识** — 每个接口的参数、响应、限制都有结构化文档，杜绝 AI 幻觉
- 🛡️ **踩坑指南** — 内置 Gotcha Guide，提炼真实陷阱，让 AI 主动避坑
- ⚡ **即用代码模板** — Python / TypeScript / Go / Java / PHP 五语言模板，可直接生成项目代码

### 有 SKILL vs 没有 SKILL

| 没有 SKILL | 有 SKILL |
|-----------|---------|
| ❌ AI 凭记忆编造 API | ✅ AI 精确查阅接口定义 |
| ❌ 遗漏 WelcomeCode 20 秒时限 | ✅ 主动提醒关键限制 |
| ❌ 搞混 follow_user vs follow_info | ✅ 参数语义完全准确 |
| ❌ 不知道 linkedcorp 全 POST | ✅ 知道每个踩坑点 |

---

## 🚀 快速开始

### 方式一：作为 AI 大模型的上下文知识（推荐）

将 `skills/` 目录注册到你的 AI 工具：

**Claude Code / Codex**
```bash
# 将 SKILL 复制到项目的 skills 目录
cp -r skills/ your-project/.claude/skills/

# 或创建符号链接
ln -s /path/to/open-wecom-skills/skills your-project/.claude/skills
```

**Cursor**
```bash
# 在 .cursorrules 中引用
echo "参考 skills/ 目录中的企业微信 SKILL 文档" >> .cursorrules
```

**其他 AI 助手**

将 `skills/` 目录添加到 AI 工具的知识库或上下文中即可。

### 方式二：作为开发者参考文档

```bash
# 克隆仓库
git clone https://github.com/iuraixmi/Open-Wecom-Skills.git

# 查看 SKILL 分类
ls skills/             # enterprise/ isv/ third-party/
ls skills/enterprise/  # 企业内部开发 30 个
ls skills/isv/         # 服务商代开发 8 个
ls skills/third-party/ # 第三方应用 3 个

# 阅读核心 SKILL（建议第一个读）
cat skills/enterprise/wecom-core.md
```

### 方式三：作为项目脚手架

每个 SKILL 都提供代码模板，可直接复制到项目中：

1. 阅读 `wecom-core.md` 搭建鉴权基座
2. 根据业务选择需要的 SKILL 模块
3. 复制代码模板到项目中
4. 对照 Code Review 清单做检查

---

## Skills 清单

### 📁 企业内部开发 (`skills/enterprise/`) — 30 SKILL

#### 基础域 (7)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-core` | 认证基座 · access_token · 回调验签 · 频率限制 | 5 | 901 |
| `wecom-contact` | 通讯录管理 · 成员/部门/标签 CRUD · 异步导入 | 35 | 1262 |
| `wecom-app` | 应用管理 · 菜单 · 工作台 · 自建机器人 | 20 | 1452 |
| `wecom-message` | 消息管理 · 模板卡片 · 群聊 · 撤回 | 25 | 1958 |
| `wecom-media` | 素材管理 · 图片/语音/文件上传 | 6 | 1163 |
| `wecom-auth` | 身份验证 · OAuth2 · 扫码登录 · 二次验证 | 12 | 1407 |
| `wecom-jssdk` | JS-SDK · 网页应用 · 签名 · 分享 | 30 | 1106 |

#### CRM 域 (8)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-crm-customer` | 客户管理 · 列表/详情/备注 · unionid | 8 | 1223 |
| `wecom-crm-tag` | 客户标签 · 企业标签 · 规则组 | 12 | 1365 |
| `wecom-crm-masssend` | 群发消息 · 欢迎语 · 群发记录 | 10 | 1338 |
| `wecom-crm-contactway` | 联系我 · 渠道活码 · 入群方式 | 14 | 1374 |
| `wecom-crm-moment` | 客户朋友圈 · 发表/互动/统计 | 12 | 1267 |
| `wecom-crm-group` | 客户群管理 · opengid · 加群 | 8 | 1148 |
| `wecom-crm-transfer` | 客户继承 · 在职/离职继承 | 8 | 1263 |
| `wecom-crm-acquisition` | 获客助手 · 获客链接 · 额度统计 | 10 | 1161 |

#### 办公域 (8)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-approval` | 审批 · 模板/实例 CRUD · 流程推进 | 15 | 1483 |
| `wecom-doc` | 文档 · 权限 · 收集表 | 15 | 945 |
| `wecom-meeting` | 会议 · 预约/PSTN/网络研讨会 | 12 | 1190 |
| `wecom-office-checkin` | 打卡 · 考勤规则/记录/汇总 | 6 | 266 |
| `wecom-office-calendar` | 日程 · 日历/参与者/回调 | 10 | 256 |
| `wecom-office-email` | 邮件 · 收件箱/群组/公共邮箱 | 12 | 222 |
| `wecom-office-wedrive` | 微盘 · 文件管理/权限/分块上传 | 18 | 223 |
| `wecom-office-live` | 直播 · 预约/统计/回放 | 8 | 188 |

#### 客服域 (1)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-kf` | 微信客服 · 会话/消息/知识库 | 22 | 1270 |

#### 客户端域 (2)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-miniapp` | 小程序 · 登录认证 · jwecom | 15 | 329 |
| `wecom-mobile-sdk` | 移动端 SDK · iOS/Android/Harmony | 7 | 233 |

#### 高级域 (3)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-advanced` | 会话存档/企业支付/电子发票/汇报 | 40 | 240 |
| `wecom-security` | 安全管理 · 文件防泄漏/设备/人事 | 18 | 267 |
| `wecom-data-intelligence` | 数据与智能 · AI 模型/知识集/专区 | 35 | 267 |

#### 行业域 (1)

| SKILL | 说明 | API | 行数 |
|-------|------|-----|------|
| `wecom-vertical` | 家校/政民/上下游/企业互联/收款 | 90 | 245 |

### 📁 服务商代开发 (`skills/isv/`) — 8 SKILL

| SKILL | 说明 | 行数 |
|-------|------|------|
| `wecom-isv-core` | 三级凭证体系 · 自建差异 · 多企业架构 | 1640 |
| `wecom-isv-auth` | 授权流程 · 预授权码 · 永久授权码 | 2696 |
| `wecom-isv-callback` | 双通道回调体系 · 指令/数据回调 | 2875 |
| `wecom-isv-license` | 接口调用许可 · 购买/续期/激活 | 3551 |
| `wecom-isv-billing` | 收银台 · 定价/收款/订单 | 2472 |
| `wecom-isv-jssdk` | JS-SDK 签名差异 · 代开发模式 | 2183 |
| `wecom-isv-provider` | 服务商管理 · 登录/注册 | 2483 |
| `wecom-isv-appendix` | 错误码 · 频率限制 · 兼容性 | 956 |

### 📁 第三方应用开发 (`skills/third-party/`) — 3 SKILL

| SKILL | 说明 |
|-------|------|
| `wecom-3rd-quickstart` | 快速入门 · 注册→授权→上架→推广全流程 |
| `wecom-3rd-idconvert` | ID 转换 · corpid/userid/external_userid 加密互转 |
| `wecom-3rd-data` | 数据 API · 获客组件/会话存档/AI 模型 |

> 💡 第三方应用的凭证体系复用 ISV SKILL，业务 API 复用企业内部开发 SKILL。

---

## 🔧 兼容性

Open WeCom Skills 可配合以下 AI 工具使用：

| AI 工具 | 支持方式 |
|---------|---------|
| **Claude Code** | 注册到 `.claude/skills/` 目录 |
| **Cursor** | 添加到 `.cursorrules` 或知识库 |
| **Codex CLI** | 注册到 skills 目录 |
| **GitHub Copilot** | 作为上下文参考 |
| **Gemini Code Assist** | 注册到 skills 目录 |
| **Cline** | 注册到知识库 |
| **其他 LLM** | 直接注入 SKILL 文本作为 System Prompt |

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

简单来说：Fork → 新增/修改 SKILL → 提交 PR

---

> [!NOTE]
> 🚧 **本项目仍在持续优化中。** SKILL 内容会随企业微信 API 更新而迭代，部分模块的代码模板和踩坑指南还在完善中。如果你在使用过程中发现任何问题或有改进建议，非常欢迎提交 [Issue](https://github.com/iuraixmi/Open-Wecom-Skills/issues) 或 [Pull Request](https://github.com/iuraixmi/Open-Wecom-Skills/pulls)，你的反馈是这个项目变得更好的关键驱动力。

---

## 📄 License

本项目基于 [Apache License 2.0](LICENSE) 开源。

---

<div align="center">

**如果觉得有用，请给一个 ⭐ Star！**

[官网](https://github.com/iuraixmi/Open-Wecom-Skills) · [Issues](https://github.com/iuraixmi/Open-Wecom-Skills/issues) · [Discussions](https://github.com/iuraixmi/Open-Wecom-Skills/discussions)

</div>
