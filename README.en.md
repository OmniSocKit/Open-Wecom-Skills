<div align="center">

# ⚡ Open WeCom Skills

**Make Your AI Model a WeCom Development Expert**

41 Skills · 550+ APIs · Comprehensive Coverage of Three Major Development Modes

English | [简体中文](./README.md)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

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

### Method 1: As AI Model Context (Recommended)

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

### Method 2: As Developer Reference

```bash
git clone https://github.com/OmniSocKit/Open-Wecom-Skills.git
ls skills/             # enterprise/ isv/ third-party/
cat skills/enterprise/wecom-core.md  # Start with the core auth SKILL
```

### Method 3: As Project Scaffold

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

| AI Tool | Integration |
|---------|------------|
| **Claude Code** | Register in `.claude/skills/` |
| **Cursor** | Add to `.cursorrules` or knowledge base |
| **Codex CLI** | Register in skills directory |
| **GitHub Copilot** | Use as context reference |
| **Gemini Code Assist** | Register in skills directory |
| **Cline** | Add to knowledge base |
| **Other LLMs** | Inject SKILL text as System Prompt |

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

[Website](https://github.com/OmniSocKit/Open-Wecom-Skills) · [Issues](https://github.com/OmniSocKit/Open-Wecom-Skills/issues) · [Discussions](https://github.com/OmniSocKit/Open-Wecom-Skills/discussions)

</div>
