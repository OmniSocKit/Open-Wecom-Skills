---
title: MCP 接入指南 — 一行命令，让 AI 精通企微开发
---

# MCP 接入指南

通过 [MCP (Model Context Protocol)](https://modelcontextprotocol.io) 将企微开发知识注入 AI，是最优雅的使用方式。

::: tip 为什么推荐 MCP？
相比手动复制 SKILL 文件，MCP 有三个核心优势：
- **零克隆** — 不需要下载仓库，不需要复制文件
- **按需加载** — AI 只读取当前需要的 SKILL，不会信息过载
- **自动更新** — 包更新后 AI 自动获取最新知识
:::

---

## 通用配置

所有支持 MCP 协议的 AI 工具，核心配置都是同一段 JSON：

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

> 不需要 API Key、不需要 Docker、不需要额外服务器。

安装 [Node.js 22+](https://nodejs.org) 即可使用。

---

## 各工具配置方式

### Claude Desktop {#claude-desktop}

[Claude Desktop](https://claude.ai/download) 是 Anthropic 的桌面客户端。

**配置文件位置：**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**写入以下内容：**

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

保存后重启 Claude Desktop。

---

### Claude Code {#claude-code}

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 是 Anthropic 的 CLI 编码助手。

**一行命令注册：**

```bash
claude mcp add omnisockit -- npx @omnisockit/mcp-server
```

**验证：**

```bash
claude mcp list
# 应看到 omnisockit 已注册
```

---

### Cursor {#cursor}

[Cursor](https://cursor.com) 是 AI 原生的代码编辑器。

**配置文件位置：** 项目根目录 `.cursor/mcp.json`（项目级） 或全局设置。

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

[Windsurf](https://codeium.com/windsurf) 是 Codeium 的 AI IDE。

**配置文件位置：** `~/.codeium/windsurf/mcp_config.json`

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

在 VS Code 中使用 GitHub Copilot 的 MCP 支持。

**配置文件位置：** 项目根目录 `.vscode/mcp.json`

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

[Trae](https://trae.ai) 是字节跳动推出的 AI IDE。

**配置文件位置：** 项目根目录 `.trae/mcp.json`

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

[Antigravity](https://antigravity.dev) 是 Google DeepMind 的桌面 AI 编码助手。

**通过设置界面：** Settings → MCP Servers → 添加以下配置：

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

[Cline](https://github.com/cline/cline) 是一个 VS Code 插件。

**配置文件位置：** VS Code 的 Cline MCP 设置（`cline_mcp_settings.json`）

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

[Roo Code](https://roocode.com) 是一个 VS Code AI 插件。

**配置文件位置：** Roo Code 的 MCP 设置（`mcp_settings.json`）

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

[Kilo Code](https://kilo.ai) 是一个 VS Code AI 插件。

**配置文件位置：** Kilo Code 的 MCP 设置（`mcp_settings.json`）

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

[Continue](https://continue.dev) 支持 VS Code 和 JetBrains IDE。

**配置文件位置：** `~/.continue/config.yaml`

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

[Cherry Studio](https://cherry-ai.com) 是一款桌面 AI 客户端。

**通过 GUI 配置：**

1. 打开 Cherry Studio → 设置 → MCP Servers
2. 点击「添加」
3. 填写：
   - **名称**: `omnisockit`
   - **命令**: `npx`
   - **参数**: `@omnisockit/mcp-server`
4. 保存

---

### Zed {#zed}

[Zed](https://zed.dev) 是一款高性能代码编辑器。

**配置文件位置：** `~/.config/zed/settings.json`

Zed 使用 `context_servers`（而非 `mcpServers`）：

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

[OpenAI Codex CLI](https://github.com/openai/codex) 是 OpenAI 的命令行编码工具。

**方式一：命令行参数**

```bash
codex --mcp-server "npx @omnisockit/mcp-server"
```

**方式二：配置文件**

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

## 验证

配置完成后，在 AI 对话中输入：

> 帮我实现企微 OAuth 扫码登录

如果配置成功，AI 会自动读取 `wecom-auth` SKILL，回答中会包含：
- 精确的 OAuth URL 格式
- code 有效期 5 分钟的限制
- redirect_uri 编码要求

---

## 工作原理

```
┌──────────────────────────────────────────┐
│           你的 AI 工具                     │
│  (Claude / Cursor / VS Code / ...)       │
│                                          │
│  用户: "帮我实现企微 OAuth 登录"            │
│                                          │
│  AI 判断需要 wecom-auth 的知识             │
│  ↓ 通过 MCP 协议读取                      │
└──────────────┬───────────────────────────┘
               │ stdio (JSON-RPC)
┌──────────────▼───────────────────────────┐
│        OmniSocKit MCP Server             │
│                                          │
│  41 个 SKILL → 41 个 MCP Resource         │
│  AI 按需读取，不是全量加载                   │
│                                          │
│  返回 wecom-auth SKILL 的完整内容           │
└──────────────────────────────────────────┘
               ↓
  AI 基于 SKILL 知识生成精确代码
```

**核心特点：**
- 🔒 **零风险** — 不调用任何外部 API，只提供知识
- ⚡ **零配置** — 不需要 API Key、不需要服务器
- 🎯 **按需加载** — AI 只读取需要的 SKILL，不浪费上下文窗口

---

## 安全性

### 架构安全

OmniSocKit MCP Server 采用**纯知识交付**架构，与大多数 MCP Server 有本质区别：

```
                  ╔═══════════════════════════════════╗
                  ║   典型 MCP Server (调用外部 API)    ║
                  ║                                   ║
                  ║   AI → MCP → 外部 API → 返回数据   ║
                  ║   ⚠️ 需要凭证 · 有网络通信 · 有风险  ║
                  ╚═══════════════════════════════════╝

                  ╔═══════════════════════════════════╗
                  ║   OmniSocKit MCP Server (只读知识)  ║
                  ║                                   ║
                  ║   AI → MCP → 本地 SKILL → 返回文本  ║
                  ║   ✅ 无凭证 · 无网络 · 零风险        ║
                  ╚═══════════════════════════════════╝
```

### 五项安全保证

| 保证 | 具体说明 |
|------|---------|
| 🚫 **不调用外部 API** | 不会向企业微信、微信、或任何第三方服务器发送 HTTP 请求。进程启动后不产生任何出站网络流量 |
| 🔑 **不需要凭证** | 不要求你提供 corpid、secret、access_token 或任何敏感信息。整个运行过程无需环境变量 |
| 📊 **不收集数据** | 不包含遥测（telemetry）、埋点（analytics）、使用统计。不向任何服务器上报数据 |
| 🏠 **纯本地运行** | 通过 stdio（标准输入/输出）与 AI 工具通信，不监听任何 TCP/UDP 端口，不启动 HTTP 服务 |
| 📖 **内容可验证** | 所有 SKILL 知识内容基于 [Open WeCom Skills](https://github.com/OmniSocKit/Open-Wecom-Skills) 开源知识库编写，知识来源公开透明 |

### 如何验证？

如果你希望亲自验证安全性，可以：

```bash
# 1. 下载 npm 包到本地（不安装，只下载）
npm pack @omnisockit/mcp-server

# 2. 解压查看全部源码
tar -xzf omnisockit-mcp-server-*.tgz
ls package/

# 3. 搜索是否有网络请求（应该找不到）
grep -r "fetch\|axios\|http\|request\|net\." package/dist/
```

::: tip 简单总结
OmniSocKit MCP Server = 一个只读本地文件的进程。它读取编译好的 SKILL 文档，通过 stdio 返回给 AI。**没有网络、没有凭证、没有副作用。**
:::

---

## 常见问题

### npx 找不到命令？

确保已安装 [Node.js 22+](https://nodejs.org)，`npx` 会随 Node.js 自动安装。

### 首次启动较慢？

`npx` 首次运行会下载 `@omnisockit/mcp-server` 包，后续启动会更快。

### 我的 AI 工具不在列表中？

只要支持 [MCP 协议](https://modelcontextprotocol.io) 的工具都可以接入。配置格式通常与上述示例类似。

---

::: info 更多平台
OmniSocKit MCP Server 目前免费提供企微全部 41 个 SKILL，更多社交平台的开发知识正在筹备中。
:::
