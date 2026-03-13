---
title: Quick Start — Configure Skills in Your AI Tool
---

# Quick Start

Configure Open WeCom Skills into your AI model so it can precisely master WeCom (Enterprise WeChat) development knowledge.

## General Steps

1. **Clone the repository**

```bash
git clone https://github.com/OmniSocKit/Open-Wecom-Skills.git
```

2. **Choose the SKILL files you need**

```
skills/
├── enterprise/        # Enterprise internal development (30 SKILLs)
├── isv/               # ISV / Service Provider development (8 SKILLs)
└── third-party/       # Third-party apps (3 SKILLs)
```

3. **Register SKILLs into your AI tool** (see tool-specific configurations below)

---

## Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) supports auto-loading SKILL files through the `.claude/` directory.

### Option 1: Project-level SKILLs (Recommended)

Copy SKILL files into your project's `.claude/skills/` directory:

```bash
# Run in your WeCom project root
mkdir -p .claude/skills
cp -r /path/to/open-wecom-skills/skills/enterprise/*.md .claude/skills/
```

Claude Code will automatically retrieve matching SKILLs during conversations.

### Option 2: Global SKILLs

Place SKILLs in the global config directory:

```bash
mkdir -p ~/.claude/skills
cp -r /path/to/open-wecom-skills/skills/**/*.md ~/.claude/skills/
```

### Verify

Type in Claude Code:

```
Help me implement WeCom customer list functionality
```

If configured correctly, AI will auto-load the `wecom-crm-customer` SKILL with precise API paths and parameters.

---

## Codex (OpenAI)

[Codex CLI](https://github.com/openai/codex) supports context injection through `AGENTS.md` and `agents/` directories.

### Setup

1. Create or edit `AGENTS.md` in your project root:

```markdown
## WeCom Development Knowledge

This project uses WeCom APIs. Refer to SKILL files in `agents/skills/` for precise API knowledge.
```

2. Copy SKILL files:

```bash
mkdir -p agents/skills
cp -r /path/to/open-wecom-skills/skills/enterprise/*.md agents/skills/
```

3. Codex will automatically read relevant SKILLs when needed.

---

## Cursor

[Cursor](https://cursor.sh/) supports loading custom rules through the `.cursor/rules/` directory.

### Setup

1. Create rules directory:

```bash
mkdir -p .cursor/rules
```

2. Copy needed SKILL files:

```bash
cp skills/enterprise/wecom-core.md .cursor/rules/
cp skills/enterprise/wecom-crm-customer.md .cursor/rules/
# Copy other SKILLs as needed
```

3. Restart Cursor. SKILL knowledge will be auto-injected into conversation context.

::: tip Recommendation
Cursor's context window is limited. Copy only the SKILLs your project actually uses to avoid information overload.
:::

---

## GitHub Copilot

GitHub Copilot supports custom knowledge injection through `.github/copilot-instructions.md`.

### Setup

1. Create the directory:

```bash
mkdir -p .github
```

2. Create `.github/copilot-instructions.md`:

```markdown
# WeCom Development Standards

This project is built on WeCom APIs. Follow these rules:

- All API requests use `https://qyapi.weixin.qq.com/cgi-bin/` as the base URL
- access_token expires in 7200 seconds and must be cached
- See skills/ directory for detailed API specifications
```

3. Add key SKILL content excerpts to the file.

---

## Windsurf

[Windsurf](https://codeium.com/windsurf) supports context injection through the `.windsurfrules` file.

### Setup

1. Create `.windsurfrules` in your project root:

```markdown
# WeCom Development Knowledge

This project uses WeCom APIs. See SKILL files in skills/ for all API definitions and gotchas.

Core specs:
- Auth foundation: skills/enterprise/wecom-core.md
- Customer management: skills/enterprise/wecom-crm-customer.md
- Messaging: skills/enterprise/wecom-message.md
```

2. Copy SKILL files into your project:

```bash
cp -r /path/to/open-wecom-skills/skills/ ./skills/
```

---

## Generic AI Tools

For other AI models (JetBrains AI, Amazon Q Developer, etc.):

### Option 1: Direct Upload

Upload SKILL `.md` files as context files into your AI tool's conversation.

### Option 2: Prompt Injection

Add at the beginning of your conversation:

```
Please read the following WeCom development knowledge files and strictly reference them:
[Paste SKILL content]
```

### Option 3: RAG / Knowledge Base

Import all SKILL files into your AI tool's knowledge base (if supported) for automatic on-demand retrieval.

---

## Best Practices

::: tip Load On Demand
No need to import all 42 SKILLs at once. Selectively load based on your project's actual needs:

- **CRM only?** → `wecom-core` + `wecom-crm-*`
- **Approval workflows?** → `wecom-core` + `wecom-approval`
- **ISV development?** → `wecom-isv-*` + needed enterprise SKILLs
:::

::: warning Stay Updated
SKILL files evolve alongside WeCom API updates. Run `git pull` regularly to get the latest versions.
:::
