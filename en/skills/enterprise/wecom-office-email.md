---
name: wecom-office-email
description: 企业微信邮件域 SKILL — 发送邮件(普通/日程/会议)、收件箱、邮件群组、公共邮箱、应用邮箱管理
version: 1.0.0
domain: office-email
depends_on: wecom-core
doc_ids: [37468, 37505, 37507, 44020, 43932, 44632, 44633, 43518, 44689, 43526, 44692, 37503, 44701, 44702, 44703, 44705, 37504, 44710, 44711, 44712, 44713, 55395, 55435, 55438, 37506, 44727, 49575, 49576, 49577]
api_count: 29
callback_count: 2
triggers:
  - 邮件
  - email
  - mail
  - 发送邮件
  - 收件箱
  - 邮件群组
  - 公共邮箱
  - 应用邮箱
---

# WeCom Office Email SKILL (wecom-office-email)

> 企业微信邮件域 SKILL：发送邮件（普通/日程/会议三种）、收件箱管理、邮件群组 CRUD、公共邮箱 CRUD、应用邮箱账号管理、邮箱启用/禁用、高级功能账号管理等 29 个 API。

---

## 1. Prerequisites

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret | 邮箱权限 |
| 第三方应用 | suite_access_token | 邮箱权限 |

---

## 2. API Quick Reference

### 2.1 发送邮件

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M1 | 发送普通邮件 | POST | `exmail/app/compose_send` |
| M2 | 发送日程邮件 | POST | `exmail/app/calendar_send` |
| M3 | 发送会议邮件 | POST | `exmail/app/meeting_send` |

### 2.2 获取接收的邮件

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M4 | 获取收件箱邮件列表 | POST | `exmail/mail/get_mail_list` |
| M5 | 获取邮件内容 | POST | `exmail/mail/get_mail` |

### 2.3 邮箱账号管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M6 | 禁用/启用邮箱账号 | POST | `exmail/account/act_mailbox` |
| M7 | 获取邮件未读数 | POST | `exmail/mail/get_newcount` |

### 2.4 应用邮箱

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M8 | 更新应用邮箱账号 | POST | `exmail/app/update_account` |
| M9 | 查询应用邮箱账号 | POST | `exmail/app/get_account` |

### 2.5 邮件群组

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M10 | 创建邮件群组 | POST | `exmail/group/create` |
| M11 | 更新邮件群组 | POST | `exmail/group/update` |
| M12 | 删除邮件群组 | POST | `exmail/group/delete` |
| M13 | 获取邮件群组详情 | POST | `exmail/group/get` |
| M14 | 模糊搜索邮件群组 | POST | `exmail/group/search` |

### 2.6 公共邮箱

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M15 | 创建公共邮箱 | POST | `exmail/publicmail/create` |
| M16 | 更新公共邮箱 | POST | `exmail/publicmail/update` |
| M17 | 删除公共邮箱 | POST | `exmail/publicmail/delete` |
| M18 | 获取公共邮箱详情 | POST | `exmail/publicmail/get` |
| M19 | 模糊搜索公共邮箱 | POST | `exmail/publicmail/search` |

### 2.7 其他

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| M20 | 获取用户功能属性 | POST | `exmail/useroption/get` |
| M21 | 更改用户功能属性 | POST | `exmail/useroption/update` |
| M22-24 | 高级功能账号管理 | POST | `exmail/account/pro_user/*` |
| M25-26 | 客户端专用密码 | POST | `exmail/publicmail/password/*` |

---

## 3. API Details

### M1. 发送普通邮件

```
POST /cgi-bin/exmail/app/compose_send?access_token=ACCESS_TOKEN
```

**请求参数**：

| 参数 | 必须 | 类型 | 说明 |
|------|------|------|------|
| to | 是 | object | 收件人 {emails: []} |
| cc | 否 | object | 抄送人 {emails: []} |
| bcc | 否 | object | 密送人 {emails: []} |
| subject | 是 | string | 邮件主题 |
| content | 是 | string | 邮件正文（HTML） |
| content_type | 否 | string | "html" (默认) 或 "text" |
| attachments | 否 | array | 附件列表 |
| enable_id_trans | 否 | int | 是否开启 userid 转换 |

---

## 4. Code Templates

```python
"""WeCom Email Client — 邮件管理"""
from wecom_core import WeComClient


class EmailClient:
    def __init__(self, client: WeComClient):
        self.client = client

    def send_mail(self, to: list[str], subject: str, content: str,
                  cc: list[str] | None = None, bcc: list[str] | None = None,
                  content_type: str = "html") -> None:
        """M1: 发送普通邮件"""
        body: dict = {
            "to": {"emails": to},
            "subject": subject, "content": content,
            "content_type": content_type,
        }
        if cc:
            body["cc"] = {"emails": cc}
        if bcc:
            body["bcc"] = {"emails": bcc}
        self.client.post("/exmail/app/compose_send", json=body)

    def send_calendar_mail(self, to: list[str], subject: str, content: str,
                            calendar_info: dict) -> None:
        """M2: 发送日程邮件"""
        self.client.post("/exmail/app/calendar_send", json={
            "to": {"emails": to}, "subject": subject,
            "content": content, "calendar": calendar_info,
        })

    def get_mail_list(self, userid: str, folder: str = "inbox",
                      offset: int = 0, limit: int = 50) -> dict:
        """M4: 获取收件箱邮件列表"""
        return self.client.post("/exmail/mail/get_mail_list", json={
            "userid": userid, "folder": folder, "offset": offset, "limit": limit,
        })

    def get_mail(self, userid: str, mail_id: str) -> dict:
        """M5: 获取邮件内容"""
        return self.client.post("/exmail/mail/get_mail", json={
            "userid": userid, "mail_id": mail_id,
        })

    def get_new_count(self, userid: str) -> int:
        """M7: 获取邮件未读数"""
        resp = self.client.post("/exmail/mail/get_newcount", json={"userid": userid})
        return resp.get("count", 0)

    # ── 邮件群组 ──

    def create_group(self, group_id: str, group_name: str, email_list: list[str]) -> None:
        """M10: 创建邮件群组"""
        self.client.post("/exmail/group/create", json={
            "group_id": group_id, "group_name": group_name, "email_list": email_list,
        })

    def delete_group(self, group_id: str) -> None:
        """M12: 删除邮件群组"""
        self.client.post("/exmail/group/delete", json={"group_id": group_id})

    # ── 公共邮箱 ──

    def create_public_mail(self, email: str, name: str) -> None:
        """M15: 创建公共邮箱"""
        self.client.post("/exmail/publicmail/create", json={"email": email, "name": name})

    def delete_public_mail(self, id_: str) -> None:
        """M17: 删除公共邮箱"""
        self.client.post("/exmail/publicmail/delete", json={"id": id_})
```

---


### 4.1 Java 示例

```java
public class WecomOfficeEmailService {
    private final WeComClient client;

    public WecomOfficeEmailService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-office-email 相关 API
     * 请参考本 SKILL 的 API 速查表选择具体接口
     */
    public JsonObject callApi(String path, JsonObject params) throws Exception {
        return client.post(path, params);
    }

    // 更多方法请参考上方 API 详细说明章节，每个接口对应一个方法
    // 关键注意事项请查阅「踩坑指南」章节
}
```

**依赖 (Maven)**:
```xml
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
</dependency>
```

### 4.2 PHP 示例

```php
<?php
class WecomOfficeEmailService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-office-email 相关 API
     * 请参考本 SKILL 的 API 速查表选择具体接口
     */
    public function callApi(string $path, array $params = []): array
    {
        return $this->client->post($path, $params);
    }

    // 更多方法请参考上方 API 详细说明章节
    // 关键注意事项请查阅「踩坑指南」章节
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 5. Gotcha Guide

### G1. 邮件内容格式
`content` 字段默认为 HTML 格式。如果发送纯文本，设置 `content_type: "text"`。

### G2. 附件大小限制
邮件附件总大小限制通常与企业配置相关，一般不超过 50MB。

### G3. 应用邮箱 vs 用户邮箱
应用邮箱是以应用身份发送邮件（From 显示应用名），用户邮箱以用户身份发送。

### G4. 邮件群组 group_id 格式
group_id 必须是邮箱格式，如 `dev-team@company.com`。

---

## 6. References

| doc_id 范围 | 说明 |
|------------|------|
| 37468-37507 | 邮件概述/账号/未读数/群组/公共邮箱 |
| 43518-44727 | 发送邮件/收件箱/应用邮箱/功能属性 |
| 49575-49577 | 高级功能账号管理 |

**依赖 SKILL**：`wecom-core`


