---
name: wecom-data-intelligence
description: |
  企业微信数据与智能专区 SKILL — 会话分析(记录/搜索/消息搜索)、关键词规则管理、
  知识集管理、AI模型(话术推荐/客户标签/会话摘要/情感分析/反垃圾)、
  专区程序开发(SDK/基础接口/同步异步调用/事件通知/调试模式)
version: 1.0.0
domain: data-intelligence
depends_on: wecom-core
doc_ids: [53575, 53707, 53336, 53341, 53343, 53342, 53294, 53335, 53346, 53347, 53353, 53351, 53350, 53349, 53348, 53352, 53354, 53355, 53659, 53367, 53408, 55520, 53988, 53989, 54090, 51799, 52569, 53411, 54963, 52390, 55293, 53337, 53295, 53296, 53419, 53356, 53357, 53358, 53081, 53540, 53360, 54166, 54006, 50920, 54809, 54810, 54811, 55039, 55301, 55652]
api_count: 35
callback_count: 5
triggers:
  - 数据专区
  - 智能专区
  - data intelligence
  - 会话分析
  - 会话搜索
  - 关键词规则
  - 知识集
  - AI模型
  - 话术推荐
  - 客户标签模型
  - 情感分析
  - 会话摘要
  - 专区程序
  - 镜像文件
  - enclave
---

# WeCom Data Intelligence SKILL (wecom-data-intelligence)

> 企业微信数据与智能专区 SKILL：基于安全隔离的专区环境，提供会话内容分析、AI 模型推理、
> 关键词规则管理、知识集管理等能力。包含专区程序 SDK、基础接口、应用调用专区程序、
> 专区事件通知、调试模式等 35 个 API + 5 个回调事件。

---

## 1. Prerequisites

### 1.1 权限与环境

| 要求 | 说明 |
|------|------|
| **企业付费功能** | 需要开通「数据与智能专区」 |
| **镜像部署** | 专区程序需打包为 Docker 镜像部署到企微安全环境 |
| **公钥配置** | 需要设置 RSA 公钥用于数据加密 |
| **回调URL** | 需要配置专区回调接收地址 |

### 1.2 架构概述

```
┌──────────────────────────────────────────┐
│            企业微信安全专区                 │
│  ┌──────────────────────────────────┐    │
│  │        专区程序 (Docker)          │    │
│  │  ┌─────────┐  ┌──────────────┐  │    │
│  │  │ SDK调用  │  │  AI模型推理   │  │    │
│  │  └─────────┘  └──────────────┘  │    │
│  └──────────────────────────────────┘    │
│              ↕ 安全通道                    │
│  ┌──────────────────────────────────┐    │
│  │        会话数据存储               │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
           ↕ 加密接口
┌──────────────────────────────────────────┐
│         企业自建应用                       │
│  - 应用调用专区程序（同步/异步）            │
│  - 接收专区通知                           │
└──────────────────────────────────────────┘
```

---

## 2. API Quick Reference

### 2.1 专区程序 SDK（在专区内运行）

| # | 接口 | 说明 |
|---|------|------|
| D1 | 获取会话记录 | 获取指定成员的会话记录 |
| D2 | 获取会话同意情况 | 检查会话存档同意状态 |
| D3 | 获取内部群信息 | 获取群聊详细信息 |
| D4 | 会话名称搜索 | 按名称搜索会话 |
| D5 | 会话消息搜索 | 按消息内容搜索 |
| D6 | 关键词规则管理 | CRUD 关键词规则 |
| D7 | 获取命中关键词规则的会话记录 | 检索命中规则的记录 |
| D8 | 管理企业知识集 | CRUD 企业知识库 |
| D9 | 员工或客户名称搜索 | 按名称搜索人员 |

### 2.2 AI 模型

| # | 模型 | 说明 |
|---|------|------|
| M1 | 通用模型 | 通用 NLP 分析 |
| M2 | 话术推荐模型 | 基于会话上下文推荐回复话术 |
| M3 | 客户标签模型 | 自动为客户打标签 |
| M4 | 会话摘要模型 | 自动生成会话摘要 |
| M5 | 情感分析模型 | 分析会话情感倾向 |
| M6 | 反垃圾分析 | 检测垃圾消息 |
| M7 | 自有模型分析 | 调用企业自定义 AI 模型 |

### 2.3 会话内容管理

| # | 接口 | 说明 |
|---|------|------|
| C1 | 会话内容导出 | 导出会话数据 |
| C2 | 异步调用自有分析程序 | 异步提交分析任务 |
| C3 | 上报异步任务结果 | 回报任务完成状态 |
| C4 | 专区通知应用 | 专区主动通知企业应用 |

### 2.4 基础接口

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| B1 | 设置公钥 | POST | `msgaudit/set_public_key` | 配置 RSA 公钥 |
| B2 | 获取授权存档的成员列表 | POST | `msgaudit/get_permit_user_list` | 查询开启存档的成员 |
| B3 | 设置专区接收回调事件 | POST | `enclave/set_callback` | 配置回调 URL |
| B4 | 设置日志打印级别 | POST | `enclave/set_log_level` | 调试用 |
| B5 | 会话组件敏感信息隐藏设置 | POST | `enclave/set_sensitive_mask` | 隐藏敏感信息 |
| B6 | 上传临时文件到专区 | POST (multipart) | `enclave/upload_tmp_file` | 上传数据文件 |

### 2.5 应用调用专区程序

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| I1 | 应用同步调用专区程序 | POST | `enclave/invoke_sync` | 同步调用(阻塞等待结果) |
| I2 | 应用异步调用专区程序 | POST | `enclave/invoke_async` | 异步调用(回调返回结果) |

### 2.6 专区调试模式

| # | 接口 | 方法 | Endpoint | 说明 |
|---|------|------|----------|------|
| G1 | 开启调试模式 | POST | `enclave/debug/open` | 开启 |
| G2 | 关闭调试模式 | POST | `enclave/debug/close` | 关闭 |
| G3 | 获取调试模式状态 | POST | `enclave/debug/get_status` | 查询状态 |

---

## 3. Callbacks

| # | 事件 | 说明 |
|---|------|------|
| E1 | `msgaudit_approve` | 客户同意存档事件 |
| E2 | `msgaudit_notify` | 产生会话回调通知 |
| E3 | `keyword_rule_hit` | 命中关键词规则通知 |
| E4 | `knowledge_manage` | 知识集管理回调 |
| E5 | `content_export_done` | 会话内容导出完成 |

---

## 4. Code Templates

```python
"""WeCom Data Intelligence Client"""
from wecom_core import WeComClient


class DataIntelligenceClient:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── 基础接口 ──

    def set_public_key(self, public_key: str) -> None:
        """B1: 设置 RSA 公钥"""
        self.client.post("/msgaudit/set_public_key", json={"public_key": public_key})

    def get_permit_user_list(self, type_: int = 1) -> dict:
        """B2: 获取授权存档成员列表"""
        return self.client.post("/msgaudit/get_permit_user_list", json={"type": type_})

    def set_callback(self, callback_url: str, token: str, encoding_aes_key: str) -> None:
        """B3: 设置专区回调"""
        self.client.post("/enclave/set_callback", json={
            "callback_url": callback_url, "token": token,
            "encoding_aes_key": encoding_aes_key,
        })

    def upload_tmp_file(self, filepath: str) -> dict:
        """B6: 上传临时文件到专区"""
        from pathlib import Path
        filename = Path(filepath).name
        with open(filepath, "rb") as f:
            return self.client.post("/enclave/upload_tmp_file", files={"file": (filename, f)})

    # ── 应用调用专区程序 ──

    def invoke_sync(self, program_id: str, params: dict, timeout: int = 30) -> dict:
        """I1: 同步调用专区程序"""
        return self.client.post("/enclave/invoke_sync", json={
            "program_id": program_id, "params": params, "timeout": timeout,
        })

    def invoke_async(self, program_id: str, params: dict) -> str:
        """I2: 异步调用专区程序，返回 task_id"""
        resp = self.client.post("/enclave/invoke_async", json={
            "program_id": program_id, "params": params,
        })
        return resp.get("task_id", "")

    # ── 调试模式 ──

    def debug_open(self) -> None:
        """G1: 开启调试模式"""
        self.client.post("/enclave/debug/open", json={})

    def debug_close(self) -> None:
        """G2: 关闭调试模式"""
        self.client.post("/enclave/debug/close", json={})

    def debug_get_status(self) -> dict:
        """G3: 获取调试模式状态"""
        return self.client.post("/enclave/debug/get_status", json={})
```

---


### 4.1 Java 示例

```java
public class WecomDataIntelligenceService {
    private final WeComClient client;

    public WecomDataIntelligenceService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-data-intelligence 相关 API
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
class WecomDataIntelligenceService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-data-intelligence 相关 API
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

### G1. 专区程序必须 Docker 部署
专区程序不是普通 HTTP 服务，需要打包为 Docker 镜像并上传到企微安全环境。参见「镜像文件配置指引」。

### G2. 数据不出专区
专区内的会话数据不能直接返回给企业应用。只能通过 AI 模型分析后返回结构化结果。

### G3. 同步 vs 异步调用
- 同步调用有超时限制（默认 30 秒），适合轻量分析
- 异步调用无超时限制，适合批量/耗时任务，结果通过回调返回

### G4. 公钥必须提前配置
调用任何涉及会话数据的接口前，必须先通过 `set_public_key` 配置 RSA 公钥。

### G5. 调试模式仅限开发阶段
调试模式会放宽部分安全限制便于开发，生产环境必须关闭。

### G6. SDK 与 API 的区别
- **专区程序 SDK**（D1-D9, M1-M7）：在专区 Docker 容器内运行，直接访问会话数据
- **基础接口**（B1-B6, I1-I2, G1-G3）：从企业应用外部调用，与专区交互

---

## 6. References

| doc_id | 标题 |
|--------|------|
| 53575 | 接入指引 |
| 53988 | 概述 |
| 53989 | 基本概念介绍 |
| 54090 | 镜像文件配置指引 |
| 53336 | 专区程序 SDK 概述 |
| 53341 | 获取会话记录 |
| 53346 | 关键词规则管理 |
| 53353 | 管理企业知识集 |
| 53707 | 通用模型 |
| 53351 | 话术推荐模型 |
| 53350 | 客户标签模型 |
| 53349 | 会话摘要模型 |
| 53348 | 情感分析模型 |
| 51799 | 设置公钥 |
| 53295 | 应用同步调用专区程序 |
| 53296 | 应用异步调用专区程序 |
| 54809 | 调试说明 |
| 50920 | 会话展示组件 |

**依赖 SKILL**：`wecom-core`


