---
name: wecom-office-wedrive
description: 企业微信微盘域 SKILL — 空间 CRUD、文件/文件夹管理、文件权限、分块上传、回调事件
version: 1.0.0
domain: office-wedrive
depends_on: wecom-core
doc_ids: [39418, 26910, 44647, 44648, 44649, 44651, 44652, 44654, 44655, 26911, 44656, 44658, 44659, 44660, 44661, 44662, 44663, 40102, 26914, 44665, 44666, 44667, 44668, 44669, 39419, 44676, 44677, 44678, 44679, 44680, 44681, 50758, 50759, 50760]
api_count: 24
callback_count: 6
triggers:
  - 微盘
  - wedrive
  - 文件管理
  - 空间管理
  - 分块上传
  - 文件权限
---

# WeCom Office WeDrive SKILL (wecom-office-wedrive)

> 企业微信微盘域 SKILL：覆盖空间 CRUD、文件/文件夹管理、文件权限配置、文件分块上传、6 种回调事件等 24 个 API。

---

## 1. Prerequisites

| 应用类型 | 凭证要求 | 权限要求 |
|---------|---------|---------|
| 自建应用 | 应用 secret | 微盘权限 |
| 第三方应用 | suite_access_token | 微盘权限 |

---

## 2. Core Concepts

```
微盘体系
├── 空间 (Space)
│   ├── 空间成员管理 → 添加/移除/权限设置
│   ├── 空间安全设置 → 水印/外部分享/下载限制
│   └── 文件系统
│       ├── 文件夹 (Folder)
│       └── 文件 (File) → 上传/下载/移动/复制/删除
└── 文件权限
    ├── 成员权限 → 管理员/编辑/查看
    ├── 分享设置 → 企业内/外分享规则
    └── 安全设置 → 只读复制/水印
```

---

## 3. API Quick Reference

### 3.1 空间管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| W1 | 创建空间 | POST | `wedrive/space_create` |
| W2 | 重命名空间 | POST | `wedrive/space_rename` |
| W3 | 获取空间信息 | POST | `wedrive/space_info` |
| W4 | 解散空间 | POST | `wedrive/space_dismiss` |

### 3.2 空间成员

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| W5 | 添加空间成员 | POST | `wedrive/space_acl_add` |
| W6 | 删除空间成员 | POST | `wedrive/space_acl_del` |
| W7 | 修改空间权限 | POST | `wedrive/space_setting` |

### 3.3 文件/文件夹管理

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| W8 | 获取文件列表 | POST | `wedrive/file_list` |
| W9 | 上传文件 | POST (multipart) | `wedrive/file_upload` |
| W10 | 下载文件 | POST | `wedrive/file_download` |
| W11 | 新建文件夹/文档 | POST | `wedrive/file_create` |
| W12 | 重命名文件 | POST | `wedrive/file_rename` |
| W13 | 移动文件 | POST | `wedrive/file_move` |
| W14 | 复制文件 | POST | `wedrive/file_copy` |
| W15 | 删除文件 | POST | `wedrive/file_delete` |
| W16 | 获取文件信息 | POST | `wedrive/file_info` |
| W17 | 文件分块上传 | POST | `wedrive/file_upload_part` |

### 3.4 文件权限

| # | 接口 | 方法 | Endpoint |
|---|------|------|----------|
| W18 | 新增文件成员 | POST | `wedrive/file_acl_add` |
| W19 | 删除文件成员 | POST | `wedrive/file_acl_del` |
| W20 | 分享设置 | POST | `wedrive/file_share` |
| W21 | 获取分享链接 | POST | `wedrive/file_share_url` |
| W22 | 获取文件权限信息 | POST | `wedrive/file_acl_info` |
| W23 | 修改文件安全设置 | POST | `wedrive/file_secure_setting` |

---

## 4. Code Templates

```python
"""WeCom WeDrive Client — 微盘管理"""
from wecom_core import WeComClient


class WeDriveClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── 空间 ──

    def space_create(self, userid: str, space_name: str, auth_info: list[dict] | None = None) -> dict:
        """W1: 创建空间"""
        body: dict = {"userid": userid, "space_name": space_name}
        if auth_info:
            body["auth_info"] = auth_info
        return self.client.post("/wedrive/space_create", json=body)

    def space_info(self, spaceid: str) -> dict:
        """W3: 获取空间信息"""
        return self.client.post("/wedrive/space_info", json={"spaceid": spaceid})

    def space_dismiss(self, spaceid: str) -> None:
        """W4: 解散空间"""
        self.client.post("/wedrive/space_dismiss", json={"spaceid": spaceid})

    # ── 文件 ──

    def file_list(self, spaceid: str, fatherid: str, sort_type: int = 1,
                  start: int = 0, limit: int = 100) -> dict:
        """W8: 获取文件列表"""
        return self.client.post("/wedrive/file_list", json={
            "spaceid": spaceid, "fatherid": fatherid,
            "sort_type": sort_type, "start": start, "limit": limit,
        })

    def file_upload(self, spaceid: str, fatherid: str, filepath: str) -> dict:
        """W9: 上传文件"""
        import os
        from pathlib import Path
        filename = Path(filepath).name
        with open(filepath, "rb") as f:
            files = {"file": (filename, f)}
            return self.client.post(
                "/wedrive/file_upload",
                params={"spaceid": spaceid, "fatherid": fatherid},
                files=files,
            )

    def file_download(self, fileid: str) -> dict:
        """W10: 下载文件（返回下载链接）"""
        return self.client.post("/wedrive/file_download", json={"fileid": fileid})

    def file_create(self, spaceid: str, fatherid: str, file_type: int, file_name: str) -> dict:
        """W11: 新建文件夹/文档
        file_type: 1=文件夹, 3=文档, 4=表格
        """
        return self.client.post("/wedrive/file_create", json={
            "spaceid": spaceid, "fatherid": fatherid,
            "file_type": file_type, "file_name": file_name,
        })

    def file_delete(self, fileid_list: list[str]) -> None:
        """W15: 删除文件"""
        self.client.post("/wedrive/file_delete", json={"fileid": fileid_list})

    def file_info(self, fileid: str) -> dict:
        """W16: 获取文件信息"""
        return self.client.post("/wedrive/file_info", json={"fileid": fileid})

    # ── 权限 ──

    def file_acl_add(self, fileid: str, auth_info: list[dict]) -> None:
        """W18: 新增文件成员"""
        self.client.post("/wedrive/file_acl_add", json={
            "fileid": fileid, "auth_info": auth_info,
        })

    def file_share(self, fileid: str, auth_scope: int) -> None:
        """W20: 设置分享范围 (auth_scope: 1=仅成员, 2=企业内, 3=企业外)"""
        self.client.post("/wedrive/file_share", json={
            "fileid": fileid, "auth_scope": auth_scope,
        })
```

---


### 4.1 Java 示例

```java
public class WecomOfficeWedriveService {
    private final WeComClient client;

    public WecomOfficeWedriveService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-office-wedrive 相关 API
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
class WecomOfficeWedriveService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-office-wedrive 相关 API
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

## 5. Callbacks

| # | 事件 | 说明 |
|---|------|------|
| C1 | wedrive_space_change | 空间文件变更 |
| C2 | wedrive_space_dismiss | 解散空间 |
| C3 | wedrive_space_member_change | 修改空间成员 |
| C4 | wedrive_space_secure_change | 修改空间安全设置 |
| C5 | wedrive_file_change | 文件变更 |
| C6 | wedrive_capacity_warning | 微盘容量不足 |

---

## 6. Gotcha Guide

### G1. fileid vs spaceid
每个文件/文件夹都有唯一的 `fileid`，空间有唯一的 `spaceid`。操作文件时需要同时知道 `spaceid` 和 `fileid`。

### G2. 分块上传用于大文件
超过 20MB 的文件建议使用分块上传 (`file_upload_part`)，需要分步完成：初始化 → 分块上传 → 完成。

### G3. 文件下载返回的是链接
`file_download` 不直接返回文件内容，而是返回一个临时下载链接（有效期有限），需要用该链接再发 HTTP GET 下载。

---

## 7. References

| doc_id 范围 | 说明 |
|------------|------|
| 39418-26914 | 空间管理 + 文件管理 |
| 44647-44681 | 空间/文件/权限/回调 |
| 40102 | 文件分块上传 |
| 50758-50760 | 高级功能账号管理 |

**依赖 SKILL**：`wecom-core`


