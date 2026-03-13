# Contributing Guide

English | [简体中文](./CONTRIBUTING.md)

Thank you for your interest in Open WeCom Skills! Here's how to get involved.

---

## 🎯 What You Can Contribute

| Type | Examples |
|------|---------|
| **Fix existing SKILLs** | Correct API parameters, add missing endpoints, update outdated links |
| **Improve Gotcha Guides** | Add newly discovered pitfalls or remove outdated warnings |
| **Enhance code templates** | Optimize template code, add templates for new languages |
| **Add new SKILLs** | Cover new WeCom modules or industry scenarios |
| **Improve docs** | Fix typos, improve descriptions, add examples |

---

## 📝 SKILL Writing Standards

When adding or modifying a SKILL, follow the [Architecture Guide](docs/guides/architecture.md).

### Core Requirements

1. **Filename**: `wecom-{domain}.md`, placed in the appropriate subdirectory:
   - Enterprise internal dev → `skills/enterprise/`
   - ISV (Service Provider) → `skills/isv/`
   - Third-party apps → `skills/third-party/`
2. **Frontmatter**: Must include `name`, `description`, `trigger`, `dependencies`
3. **Complete sections**: API quick-reference + details + workflows + code templates + gotcha guide
4. **Gotcha Guide**: At least 3 real-world pitfalls
5. **Code templates**: At minimum, provide Python templates

---

## 🔄 Submission Process

### 1. Fork the repository

### 2. Create a branch

```bash
git checkout -b feat/your-feature-name
```

### 3. Commit your changes

```bash
git commit -m "feat: add wecom-xxx SKILL"
```

### 4. Push and create a PR

```bash
git push origin feat/your-feature-name
```

---

## ✅ Review Criteria

| Dimension | Requirement |
|-----------|------------|
| **Correctness** | API params, endpoints, methods match official docs |
| **Completeness** | All required sections present |
| **Gotcha value** | Guide provides real practical insights |
| **Format** | Follows unified template, correct Markdown |

---

## 💬 Questions?

- Open an [Issue](https://github.com/OmniSocKit/Open-Wecom-Skills/issues) for bugs or suggestions

Thank you for contributing! 🙏
