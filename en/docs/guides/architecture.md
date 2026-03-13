# SKILL Architecture Design

> This document describes the internal structure design principles for each SKILL in Open WeCom Skills.
> When contributing new SKILLs or modifying existing ones, please follow this specification.

---

## 1. SKILL File Structure

Each SKILL is a standalone Markdown file located in the `skills/` directory.

### YAML Frontmatter

```yaml
---
name: wecom-{domain}
description: WeCom - {Domain}. {One-line description}.
trigger: Triggered when user needs {scenario keywords}
dependencies: wecom-core
---
```

### Markdown Body Structure

```
# WeCom - {Domain} (wecom-{domain})

## Prerequisites
## Core Concepts
## API Quick Reference
## API Detailed Documentation
## Common Workflow Scenarios
## Code Templates
## Test Templates
## Code Review
## Gotcha Guide
## Callback Events
## References
```

---

## 2. Section Writing Requirements

### Prerequisites

- Which SKILLs it depends on (usually `wecom-core`)
- Required WeCom permissions
- Applicable scenarios

### API Quick Reference

Use a unified table format:

| Operation | Method | Endpoint Path | Key Parameters | Idempotent |
|-----------|--------|---------------|----------------|------------|
| Create XX | POST | /xxx/create | name (required) | No |
| Query XX | GET  | /xxx/get | id (required) | Yes |

### API Detailed Documentation

Each endpoint gets its own subsection containing:
- **Endpoint**: METHOD + full URL
- **Permission**: Required permission
- **Rate Limit**: Specific limits
- **Request Parameters**: Table (param/type/required/description)
- **Response**: JSON example
- **Notes**: Gotchas specific to this endpoint
- **Idempotency**: Clearly labeled

### Gotcha Guide

This is the core differentiating value of each SKILL. Each gotcha must include:
1. **Name**: Short title
2. **Description**: What problem occurs
3. **Cause**: Why it happens
4. **Solution**: How to avoid or fix it

---

## 3. Naming Conventions

| Dimension | Rule | Example |
|-----------|------|---------|
| Filename | `wecom-{domain}.md` | `wecom-crm-customer.md` |
| CRM subdomain | `wecom-crm-{subdomain}.md` | `wecom-crm-tag.md` |
| Office subdomain | `wecom-office-{subdomain}.md` | `wecom-office-calendar.md` |

---

## 4. Code Generation Standards

Follow Section 5 of `wecom-core`:
- Language selection: User-specified > project context > default Python
- Support 5 language templates: Python / TypeScript / Go / Java / PHP
- At minimum provide Python template; recommend also providing Java and PHP
- HTTP client: Use conventional libraries per language (Python: httpx/requests, TS: axios, Go: net/http, Java: OkHttp/HttpClient, PHP: GuzzleHttp)
- Token MUST be cached; fetching on every request is forbidden
- errcode MUST be checked; -1 triggers auto-retry
- Sensitive info read from environment variables

---

## 5. Testing Standards

Follow Section 6 of `wecom-core`:
- At least 1 unit test per API
- Mock HTTP, no real network dependency
- Cover: success + error + token refresh + retry

---

## 6. Code Review Standards

Follow Section 7 of `wecom-core`:
- CRITICAL: Security (secrets not hardcoded, signatures not skipped)
- HIGH: Correctness (endpoint/params/method)
- MEDIUM: Robustness (timeout/retry/idempotency)
- LOW: Maintainability (logging/comments)
