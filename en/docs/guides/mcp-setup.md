---
title: MCP Setup Guide — One Command, AI Masters WeCom Dev
---

# MCP Setup Guide

Inject WeCom development knowledge into your AI via [MCP (Model Context Protocol)](https://modelcontextprotocol.io) — the most elegant integration method.

::: tip Why MCP?
Compared to manually copying SKILL files, MCP offers three key advantages:
- **Zero clone** — No repository download, no file copying
- **On-demand loading** — AI only reads the SKILL it needs, avoiding context overload
- **Auto-update** — Package updates deliver the latest knowledge automatically
:::

---

## Universal Configuration

All MCP-compatible AI tools share the same core JSON config:

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

> No API Key, no Docker, no server required.

Just install [Node.js 22+](https://nodejs.org) and you're good to go.

---

## Tool-Specific Setup

### Claude Desktop {#claude-desktop}

[Claude Desktop](https://claude.ai/download) is Anthropic's desktop client.

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

Save and restart Claude Desktop.

---

### Claude Code {#claude-code}

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's CLI coding assistant.

**One-line setup:**

```bash
claude mcp add omnisockit -- npx @omnisockit/mcp-server
```

**Verify:**

```bash
claude mcp list
# You should see omnisockit registered
```

---

### Cursor {#cursor}

[Cursor](https://cursor.com) is an AI-native code editor.

**Config file location:** `.cursor/mcp.json` in project root (project-level) or global settings.

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

---

### Windsurf {#windsurf}

[Windsurf](https://codeium.com/windsurf) is Codeium's AI IDE.

**Config file location:** `~/.codeium/windsurf/mcp_config.json`

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

---

### VS Code + GitHub Copilot {#vscode-copilot}

MCP support in VS Code via GitHub Copilot.

**Config file location:** `.vscode/mcp.json` in project root.

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

---

### Trae {#trae}

[Trae](https://trae.ai) is an AI IDE by ByteDance.

**Config file location:** `.trae/mcp.json` in project root.

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

---

### Antigravity {#antigravity}

[Antigravity](https://antigravity.dev) is Google DeepMind's desktop AI coding assistant.

**Via Settings:** Settings → MCP Servers → Add the following config:

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

---

### Cline {#cline}

[Cline](https://github.com/cline/cline) is a VS Code extension.

**Config file location:** Cline MCP settings (`cline_mcp_settings.json`)

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

---

### Roo Code {#roo-code}

[Roo Code](https://roocode.com) is a VS Code AI extension.

**Config file location:** Roo Code MCP settings (`mcp_settings.json`)

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

---

### Kilo Code {#kilo-code}

[Kilo Code](https://kilo.ai) is a VS Code AI extension.

**Config file location:** Kilo Code MCP settings (`mcp_settings.json`)

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

---

### Continue {#continue}

[Continue](https://continue.dev) supports VS Code and JetBrains IDEs.

**Config file location:** `~/.continue/config.yaml`

```yaml
models:
  - name: omnisockit
    provider: mcp
    mcpServers:
      - name: omnisockit
        command: npx
        args:
          - "@omnisockit/mcp-server"
```

---

### Cherry Studio {#cherry-studio}

[Cherry Studio](https://cherry-ai.com) is a desktop AI client.

**GUI Setup:**

1. Open Cherry Studio → Settings → MCP Servers
2. Click "Add"
3. Fill in:
   - **Name**: `omnisockit`
   - **Command**: `npx`
   - **Args**: `@omnisockit/mcp-server`
4. Save

---

### Zed {#zed}

[Zed](https://zed.dev) is a high-performance code editor.

**Config file location:** `~/.config/zed/settings.json`

Zed uses `context_servers` (not `mcpServers`):

```json
{
  "context_servers": {
    "omnisockit": {
      "command": {
        "path": "npx",
        "args": ["@omnisockit/mcp-server"]
      }
    }
  }
}
```

---

### OpenAI Codex CLI {#openai-codex}

[OpenAI Codex CLI](https://github.com/openai/codex) is OpenAI's command-line coding tool.

**Option 1: CLI argument**

```bash
codex --mcp-server "npx @omnisockit/mcp-server"
```

**Option 2: Config file**

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

---

## Verification

After setup, type in your AI chat:

> Help me implement WeCom OAuth login

If configured correctly, the AI will automatically read the `wecom-auth` SKILL, and its response will include:
- Precise OAuth URL format
- The 5-minute code expiration limit
- redirect_uri encoding requirements

---

## How It Works

```
┌──────────────────────────────────────────┐
│          Your AI Tool                    │
│  (Claude / Cursor / VS Code / ...)      │
│                                         │
│  You: "Help me implement WeCom OAuth"   │
│                                         │
│  AI determines it needs wecom-auth      │
│  ↓ Reads via MCP Protocol               │
└──────────────┬──────────────────────────┘
               │ stdio (JSON-RPC)
┌──────────────▼──────────────────────────┐
│       OmniSocKit MCP Server             │
│                                         │
│  41 SKILLs → 41 MCP Resources          │
│  AI reads on-demand, not all at once    │
│                                         │
│  Returns wecom-auth SKILL content       │
└─────────────────────────────────────────┘
               ↓
  AI generates precise code based on SKILL
```

**Key features:**
- 🔒 **Zero risk** — No external API calls, knowledge-only
- ⚡ **Zero config** — No API Key, no server needed
- 🎯 **On-demand** — AI reads only the SKILLs it needs

---

## Security

### Architecture Safety

OmniSocKit MCP Server uses a **knowledge-only** architecture, fundamentally different from most MCP Servers:

```
                  ╔═══════════════════════════════════╗
                  ║  Typical MCP Server (calls APIs)   ║
                  ║                                    ║
                  ║  AI → MCP → External API → Data    ║
                  ║  ⚠️ Needs creds · Network · Risk   ║
                  ╚═══════════════════════════════════╝

                  ╔═══════════════════════════════════╗
                  ║  OmniSocKit MCP Server (read-only) ║
                  ║                                    ║
                  ║  AI → MCP → Local SKILL → Text     ║
                  ║  ✅ No creds · No network · Safe    ║
                  ╚═══════════════════════════════════╝
```

### Five Security Guarantees

| Guarantee | Details |
|-----------|---------|
| 🚫 **No external API calls** | Never sends HTTP requests to WeCom, WeChat, or any third-party server. Zero outbound network traffic after process startup |
| 🔑 **No credentials required** | Does not ask for corpid, secret, access_token, or any sensitive information. No environment variables needed |
| 📊 **No data collection** | No telemetry, no analytics, no usage tracking. Reports nothing to any server |
| 🏠 **Runs locally only** | Communicates with AI tools via stdio (standard I/O). Listens on no TCP/UDP ports, starts no HTTP server |
| 📖 **Verifiable content** | All SKILL knowledge is based on the [Open WeCom Skills](https://github.com/OmniSocKit/Open-Wecom-Skills) open-source knowledge base. Sources are fully transparent |

### How to Verify?

If you'd like to verify the security claims yourself:

```bash
# 1. Download the npm package locally (no install)
npm pack @omnisockit/mcp-server

# 2. Extract and inspect the source
tar -xzf omnisockit-mcp-server-*.tgz
ls package/

# 3. Search for network calls (should find none)
grep -r "fetch\|axios\|http\|request\|net\." package/dist/
```

::: tip TL;DR
OmniSocKit MCP Server = a process that reads local files. It reads compiled SKILL documents and returns them to AI via stdio. **No network, no credentials, no side effects.**
:::

---

## FAQ

### npx command not found?

Make sure [Node.js 22+](https://nodejs.org) is installed. `npx` is included with Node.js.

### Slow first startup?

`npx` downloads the `@omnisockit/mcp-server` package on first run. Subsequent starts will be faster.

### My AI tool is not listed?

Any tool supporting the [MCP protocol](https://modelcontextprotocol.io) can be integrated. The config format is usually similar to the examples above.

---

::: info More Platforms
OmniSocKit MCP Server currently provides all 41 WeCom SKILLs for free. More social platform development knowledge is coming soon.
:::
