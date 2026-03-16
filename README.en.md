<div align="center">

# ⚡ Open WeCom Skills

**Make Your AI Model a WeCom Development Expert**

41 Skills · 550+ APIs · Comprehensive Coverage of Three Major Development Modes · One-Line MCP Setup

English | [简体中文](./README.md)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@omnisockit/mcp-server?label=MCP%20Server&color=14b8a6)](https://www.npmjs.com/package/@omnisockit/mcp-server)

</div>

---

## ✨ What is this?

Open WeCom Skills is a **structured knowledge system** for AI models, purpose-built for WeCom (Enterprise WeChat) development.

It's not a copy of official docs — it's **AI-optimized knowledge engineering**:

- 🎯 **Precise API Knowledge** — Every endpoint's params, responses, and limits are structurally documented, eliminating AI hallucination
- 🛡️ **Gotcha Guide** — Built-in trap detection distilled from real-world experience, so AI proactively avoids pitfalls
- ⚡ **Ready-to-use Templates** — Python / TypeScript / Go / Java / PHP code templates for direct project scaffolding

---

## 🚀 Quick Start

### Method 1: Via MCP Server (Recommended) ⚡

Add one config to your AI tool and let AI master all WeCom APIs:

```json
{
  "mcpServers": {
    "omnisockit": {
      "command": "npx",
      "args": ["@omnisockit/mcp-server"]
    }
  }
}
```

> Zero clone, zero config, AI reads SKILLs on demand — [See detailed setup for each tool](https://openwecom.com/en/docs/guides/mcp-setup)

Compatible with all mainstream AI tools: Claude Desktop / Claude Code / Cursor / Windsurf / VS Code + Copilot / Trae / Antigravity / Cline / Roo Code / Kilo Code / Continue / Cherry Studio / Zed / OpenAI Codex CLI, etc.

### Method 2: Manual AI Context Injection

Register the `skills/` directory with your AI tool:

**Claude Code / Codex**
```bash
# Copy SKILLs to your project's skills directory
cp -r skills/ your-project/.claude/skills/

# Or create a symlink
ln -s /path/to/open-wecom-skills/skills your-project/.claude/skills
```

**Cursor**
```bash
# Reference in .cursorrules
echo "Refer to skills/ directory for WeCom SKILL docs" >> .cursorrules
```

### Method 3: As Developer Reference

```bash
git clone https://github.com/OmniSocKit/Open-Wecom-Skills.git
ls skills/             # enterprise/ isv/ third-party/
cat skills/enterprise/wecom-core.md  # Start with the core auth SKILL
```

### Method 4: As Project Scaffold

1. Read `wecom-core.md` to set up authentication
2. Choose SKILL modules for your use case
3. Copy code templates into your project
4. Run through the Code Review checklist

---

## Skills Overview

| Domain | Dir | Count | Key SKILLs |
|--------|-----|-------|------------|
| **Enterprise Dev** | `enterprise/` | 30 | core, contact, message, app, media, auth, jssdk, crm-*, office-*, kf, etc. |
| **ISV (Service Provider)** | `isv/` | 8 | isv-core, isv-auth, isv-callback, isv-license, isv-billing, isv-jssdk, isv-provider, isv-appendix |
| **Third-Party App** | `third-party/` | 3 | 3rd-quickstart, 3rd-idconvert, 3rd-data |

> Third-party apps reuse ISV SKILLs for auth and internal dev SKILLs for business APIs.

> See the full [Skills list in Chinese README](README.md#-skills-清单) for detailed API counts and line numbers.

---

## 🔧 Compatibility

Open WeCom Skills works with the following AI tools (MCP recommended):

| AI Tool | MCP Support | Manual Injection |
|---------|:-----------:|------------------|
| **Claude Desktop** | ✅ [Setup](https://openwecom.com/en/docs/guides/mcp-setup#claude-desktop) | — |
| **Claude Code** | ✅ [Setup](https://openwecom.com/en/docs/guides/mcp-setup#claude-code) | `.claude/skills/` |
| **Cursor** | ✅ [Setup](https://openwecom.com/en/docs/guides/mcp-setup#cursor) | `.cursorrules` |
| **Windsurf** | ✅ [Setup](https://openwecom.com/en/docs/guides/mcp-setup#windsurf) | `.windsurfrules` |
| **VS Code + Copilot** | ✅ [Setup](https://openwecom.com/en/docs/guides/mcp-setup#vscode-copilot) | Context reference |
| **Other MCP tools** | ✅ [Generic Setup](https://openwecom.com/en/docs/guides/mcp-setup) | System Prompt |

---

## 🔒 Security

The MCP Server is designed with a **knowledge-only, zero side-effect** principle:

| Guarantee | Description |
|-----------|-------------|
| **No external API calls** | The MCP Server never sends requests to WeCom or any third-party servers |
| **No credentials required** | Does not ask for corpid, secret, access_token, or any sensitive information |
| **No data collection** | No telemetry, no analytics, no usage tracking — reports nothing |
| **Runs locally only** | Communicates with AI tools via stdio, listens on no network ports |
| **Verifiable content** | SKILL knowledge is based on the [Open WeCom Skills](https://github.com/OmniSocKit/Open-Wecom-Skills) open-source knowledge base |

> 💡 You can run `npm pack @omnisockit/mcp-server` to download and inspect the full source code, verifying the above guarantees.

---

## 🤝 Contributing

Contributions welcome! See [Contributing Guide](CONTRIBUTING.en.md) for details.

TL;DR: Fork → Add/Edit SKILL → Submit PR

---

> [!NOTE]
> 🚧 **This project is under active development.** SKILL content evolves alongside WeCom API updates, and some modules' code templates and gotcha guides are still being refined. If you encounter any issues or have suggestions for improvement, we warmly welcome you to open an [Issue](https://github.com/OmniSocKit/Open-Wecom-Skills/issues) or submit a [Pull Request](https://github.com/OmniSocKit/Open-Wecom-Skills/pulls). Your feedback is what drives this project forward.

---

## 📄 License

This project is licensed under [Apache License 2.0](LICENSE).

---

<div align="center">

**If you find this useful, please give it a ⭐ Star!**

[Website](https://openwecom.com) · [MCP Server](https://www.npmjs.com/package/@omnisockit/mcp-server) · [Issues](https://github.com/OmniSocKit/Open-Wecom-Skills/issues)

</div>
