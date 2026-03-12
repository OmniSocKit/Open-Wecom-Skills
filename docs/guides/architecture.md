# SKILL 架构设计

> 本文档描述 Open WeCom Skills 中每个 SKILL 的内部结构设计原则。
> 贡献新 SKILL 或修改现有 SKILL 时，请遵循此规范。

---

## 一、SKILL 文件结构

每个 SKILL 是一个独立的 Markdown 文件，位于 `skills/` 目录下。

### YAML Frontmatter

```yaml
---
name: wecom-{domain}
description: 企业微信 - {域名}。{一句话描述}。
trigger: 当用户需要 {场景关键词} 时触发
dependencies: wecom-core
---
```

### Markdown 正文结构

```
# 企业微信 - {域名} (wecom-{domain})

## 前置条件
## 核心概念
## API 速查表
## API 详细说明
## 常见场景工作流
## 代码模板
## 测试模板
## 代码审核
## 踩坑指南 (Gotcha Guide)
## 回调事件
## 参考
```

---

## 二、各章节编写要求

### 前置条件

- 依赖哪些 SKILL（通常依赖 `wecom-core`）
- 所需企业微信权限
- 适用场景

### API 速查表

使用统一的表格格式：

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 创建XX | POST | /xxx/create | name(必填) | 否 |
| 查询XX | GET  | /xxx/get | id(必填) | 是 |

### API 详细说明

每个接口独立一个小节，包含：
- **接口**: METHOD + 完整 URL
- **权限**: 所需权限
- **频率限制**: 具体限制
- **请求参数**: 表格（参数/类型/必填/说明）
- **响应**: JSON 示例
- **注意事项**: 该接口特有的坑
- **幂等性**: 明确标注

### 踩坑指南 (Gotcha Guide)

这是 SKILL 最核心的差异化价值。每条踩坑需包含：
1. **坑名**：简短标题
2. **描述**：会遇到什么问题
3. **原因**：为什么会出现
4. **解决方案**：如何避免或修复

---

## 三、命名规范

| 维度 | 规则 | 示例 |
|------|------|------|
| 文件名 | `wecom-{domain}.md` | `wecom-crm-customer.md` |
| CRM 子域 | `wecom-crm-{子域}.md` | `wecom-crm-tag.md` |
| 办公子域 | `wecom-office-{子域}.md` | `wecom-office-calendar.md` |

---

## 四、代码生成规范

遵循 `wecom-core` 中第 5 节的规范：
- 语言选择：用户指定 > 项目上下文 > 默认 Python
- 支持五种语言模板：Python / TypeScript / Go / Java / PHP
- 至少提供 Python 语言的模板，推荐同时提供 Java 和 PHP
- HTTP 客户端：按语言使用约定库（Python: httpx/requests, TS: axios, Go: net/http, Java: OkHttp/HttpClient, PHP: GuzzleHttp）
- Token 必须缓存，禁止每次请求获取
- errcode 必须检查，-1 自动重试
- 敏感信息从环境变量读取

---

## 五、测试规范

遵循 `wecom-core` 中第 6 节的规范：
- 每个 API 至少 1 个单元测试
- Mock HTTP，不依赖真实网络
- 覆盖：成功 + 错误 + token 刷新 + 重试

---

## 六、代码审核规范

遵循 `wecom-core` 中第 7 节的规范：
- CRITICAL：安全性（secret 未硬编码、签名未跳过）
- HIGH：正确性（endpoint/参数/方法）
- MEDIUM：健壮性（超时/重试/幂等）
- LOW：可维护性（日志/注释）
