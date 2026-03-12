---
title: 快速使用 — 在 AI 工具中配置 Skills
---

# 快速使用

将 Open WeCom Skills 配置到你的 AI 大模型中，让 AI 精确掌握企业微信开发知识。

## 通用步骤

1. **克隆仓库**

```bash
git clone https://github.com/iuraixmi/Open-Wecom-Skills.git
```

2. **选择所需 SKILL 文件**

```
skills/
├── enterprise/        # 企业内部开发（30 SKILL）
├── isv/               # 服务商代开发（8 SKILL）
└── third-party/       # 第三方应用（3 SKILL）
```

3. **将 SKILL 注册到 AI 工具**（见下方各工具配置方式）

---

## Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 支持通过 `.claude/` 目录自动加载 SKILL 文件。

### 方式一：项目级 SKILL（推荐）

将 SKILL 文件复制到你的项目 `.claude/skills/` 目录：

```bash
# 在你的企业微信项目根目录执行
mkdir -p .claude/skills
cp -r /path/to/open-wecom-skills/skills/enterprise/*.md .claude/skills/
```

Claude Code 在对话中会自动检索匹配的 SKILL。

### 方式二：全局 SKILL

将 SKILL 放到全局配置目录：

```bash
mkdir -p ~/.claude/skills
cp -r /path/to/open-wecom-skills/skills/**/*.md ~/.claude/skills/
```

### 验证

在 Claude Code 中输入：

```
帮我实现企业微信客户列表功能
```

如果配置成功，AI 会自动加载 `wecom-crm-customer` SKILL，回答中会包含精确的 API 路径和参数。

---

## Codex (OpenAI)

[Codex CLI](https://github.com/openai/codex) 支持通过 `AGENTS.md` 和 `agents/` 目录注入上下文。

### 配置步骤

1. 在项目根目录创建或编辑 `AGENTS.md`：

```markdown
## 企业微信开发知识

本项目使用企业微信 API，请参考 `agents/skills/` 目录中的 SKILL 文件获取精确的 API 知识。
```

2. 复制 SKILL 文件：

```bash
mkdir -p agents/skills
cp -r /path/to/open-wecom-skills/skills/enterprise/*.md agents/skills/
```

3. Codex 会在需要时自动读取相关 SKILL。

---

## Cursor

[Cursor](https://cursor.sh/) 支持通过 `.cursor/rules/` 目录加载自定义规则。

### 配置步骤

1. 在项目根目录创建规则目录：

```bash
mkdir -p .cursor/rules
```

2. 复制需要的 SKILL 文件：

```bash
cp skills/enterprise/wecom-core.md .cursor/rules/
cp skills/enterprise/wecom-crm-customer.md .cursor/rules/
# 按需复制其他 SKILL
```

3. 重启 Cursor，SKILL 知识将自动注入对话上下文。

::: tip 建议
Cursor 的上下文窗口有限，建议只复制当前项目实际使用的 SKILL，避免信息过载。
:::

---

## GitHub Copilot

GitHub Copilot 可通过 `.github/copilot-instructions.md` 注入自定义知识。

### 配置步骤

1. 在项目根目录创建：

```bash
mkdir -p .github
```

2. 创建 `.github/copilot-instructions.md`：

```markdown
# 企业微信开发规范

本项目基于企业微信 API 开发，请严格遵循以下知识文件中的 API 定义和注意事项：

- 所有 API 请求使用 `https://qyapi.weixin.qq.com/cgi-bin/` 作为基础路径
- access_token 有效期 7200 秒，需要缓存
- 详细 API 规范见 skills/ 目录中的 SKILL 文件
```

3. 将关键 SKILL 内容摘要写入该文件。

---

## Windsurf

[Windsurf](https://codeium.com/windsurf) 支持通过 `.windsurfrules` 文件注入上下文。

### 配置步骤

1. 在项目根目录创建 `.windsurfrules`：

```markdown
# 企业微信开发知识

本项目使用企业微信 API。所有 API 接口定义和注意事项请参考 skills/ 目录中的 SKILL 文件。

核心规范：
- 认证基座：skills/enterprise/wecom-core.md
- 客户管理：skills/enterprise/wecom-crm-customer.md
- 消息发送：skills/enterprise/wecom-message.md
```

2. 将 SKILL 文件放到项目内：

```bash
cp -r /path/to/open-wecom-skills/skills/ ./skills/
```

---

## 通用 AI 工具

对于其他 AI 大模型（如 JetBrains AI、Amazon Q Developer 等），通用接入方式：

### 方式一：直接上传

将 SKILL `.md` 文件作为上下文文件上传到 AI 工具的对话中。

### 方式二：Prompt 注入

在对话开头添加：

```
请阅读以下企业微信开发知识文件，并在后续开发中严格参考：
[粘贴 SKILL 内容]
```

### 方式三：RAG / 知识库

将所有 SKILL 文件导入 AI 工具的知识库（如支持），实现按需自动检索。

---

## 最佳实践

::: tip 按需加载
不需要一次性导入全部 41 个 SKILL。根据你的项目实际使用的功能域，选择性加载：

- **只做客户管理？** → `wecom-core` + `wecom-crm-*`
- **只做审批流程？** → `wecom-core` + `wecom-approval`
- **ISV 代开发？** → `wecom-isv-*` + 需要的企业 SKILL
:::

::: warning 保持更新
SKILL 文件会随企业微信 API 更新而迭代。建议定期 `git pull` 获取最新版本。
:::
