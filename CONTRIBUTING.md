# 贡献指南

[English](./CONTRIBUTING.en.md) | 简体中文

感谢你对 Open WeCom Skills 的关注！以下是参与贡献的指引。

---

## 🎯 可以贡献什么

| 类型 | 示例 |
|------|------|
| **修正现有 SKILL** | 修复 API 参数错误、补充遗漏的接口、更新过时的链接 |
| **改进踩坑指南** | 补充新发现的陷阱或删除已过时的注意事项 |
| **完善代码模板** | 优化模板代码、增加新语言的模板 |
| **新增 SKILL** | 覆盖新的企微模块或行业场景 |
| **改进文档** | 修正错别字、改善描述、补充示例 |

---

## 📝 SKILL 编写规范

新增或修改 SKILL 时，请遵循 [SKILL 架构设计](docs/guides/architecture.md) 中的规范。

### 核心要求

1. **文件名**：`wecom-{domain}.md`，按类型放入对应子目录：
   - 企业内部开发 → `skills/enterprise/`
   - 服务商代开发 → `skills/isv/`
   - 第三方应用 → `skills/third-party/`
2. **Frontmatter**：必须包含 `name`、`description`、`trigger`、`dependencies`
3. **章节完整**：API 速查表 + 详细说明 + 工作流 + 代码模板 + 踩坑指南
4. **踩坑指南**：至少包含 3 个从实战中总结的注意事项
5. **代码模板**：至少提供 Python 语言的模板

---

## 🔄 提交流程

### 1. Fork 仓库

点击 GitHub 右上角的 Fork 按钮。

### 2. 创建分支

```bash
git checkout -b feat/your-feature-name
```

分支命名规范：
- `feat/xxx` — 新增 SKILL 或功能
- `fix/xxx` — 修复错误
- `docs/xxx` — 改进文档

### 3. 提交更改

```bash
git add .
git commit -m "feat: add wecom-xxx SKILL"
```

Commit 信息规范：
- `feat:` 新增
- `fix:` 修复
- `docs:` 文档
- `refactor:` 重构

### 4. 推送并提交 PR

```bash
git push origin feat/your-feature-name
```

在 GitHub 上创建 Pull Request，描述你的更改内容和原因。

---

## ✅ PR 审核标准

| 维度 | 要求 |
|------|------|
| **正确性** | API 参数、端点、方法与官方文档一致 |
| **完整性** | 必备章节齐全 |
| **踩坑价值** | Gotcha Guide 有实际参考意义 |
| **格式规范** | 遵循统一模板，Markdown 格式正确 |

---

## 💬 有问题？

- 提交 [Issue](https://github.com/iuraixmi/Open-Wecom-Skills/issues) 报告问题或建议
- 在 [Discussions](https://github.com/iuraixmi/Open-Wecom-Skills/discussions) 中参与讨论

感谢你的贡献！🙏
