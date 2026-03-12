# SKILL 实战示例 — AI 回答对比演示

> 本文档展示：当开发者向 AI 大模型提出企业微信开发需求时，**加载 SKILL** 与 **未加载 SKILL** 的回答质量差异。

---

## 📝 开发者提问

> 我想在企业微信中实现客户列表，方便管理员查看所有的客户基础信息以及会话存档。同时需要实现客户的在职继承和离职继承。而且在客户完成继承之后，新的接替员工能看到原员工跟这个客户的会话存档，也就是说会话信息需要同步过去。

**需求拆解**:
1. 客户列表 — 查看所有客户基础信息
2. 会话存档 — 查看聊天记录
3. 在职继承 — 在职员工之间转移客户
4. 离职继承 — 离职员工的客户交接
5. 会话同步 — 继承后新员工能看到原会话

---

## 🤖 AI 完整回答（加载 SKILL 后）

### 一、整体架构

你的需求涉及 **4 个企业微信能力域**，我来逐一拆解方案。

```
┌──────────────────────────────────────────────┐
│                  管理后台 (Web)                │
│  客户列表 │ 会话存档查看 │ 继承操作 │ 继承状态  │
└────────┬──────────┬──────────┬───────────────┘
         │          │          │
┌────────▼──────────▼──────────▼───────────────┐
│              后端服务 (你的服务器)               │
│                                               │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐   │
│  │ 客户模块 │ │ 继承模块 │ │ 会话存档模块  │   │
│  └────┬────┘ └────┬────┘ └──────┬───────┘   │
│       │           │             │            │
│  ┌────▼───────────▼─────────────▼──────────┐ │
│  │         WeComClient (Token 缓存)         │ │
│  └────────────────┬────────────────────────┘ │
└───────────────────┼──────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  企业微信 API 服务器   │
         │  qyapi.weixin.qq.com │
         └─────────────────────┘
```

**涉及的 SKILL**:

| SKILL | 用途 |
|-------|------|
| `wecom-core` | Token 缓存、回调验签、错误处理 |
| `wecom-crm-customer` | 客户列表、客户详情 |
| `wecom-crm-transfer` | 在职/离职继承 |
| `wecom-advanced` | 会话存档 |
| `wecom-contact` | 员工在职/离职状态 |

---

### 二、模块 1 — 客户列表

#### API 调用链路

```
GET  /externalcontact/get_follow_user_list   → 获取所有服务人员
POST /externalcontact/batch/get_by_user      → 批量获取客户（每批≤100人，cursor 分页）
GET  /externalcontact/get                    → 需要完整标签时补充调用
```

#### 代码实现（Python）

```python
from wecom_client import WeComClient

class CustomerService:
    def __init__(self):
        # ⚠️ 必须使用「客户联系」secret，不能用系统应用 secret
        self.client = WeComClient(
            corp_id=os.environ["WECOM_CORP_ID"],
            corp_secret=os.environ["WECOM_EXTERNAL_SECRET"],  # 客户联系专用
        )

    def sync_all_customers(self) -> list[dict]:
        """全量同步所有客户 — C5 → C3 分批"""
        # 步骤 1: 获取所有服务人员
        resp = self.client.get("/externalcontact/get_follow_user_list")
        follow_users = resp.get("follow_user", [])

        # 步骤 2: 每 100 人一批，批量获取客户
        all_contacts = []
        for i in range(0, len(follow_users), 100):
            batch = follow_users[i:i+100]
            cursor = ""
            while True:
                resp = self.client.post("/externalcontact/batch/get_by_user", json={
                    "userid_list": batch,
                    "cursor": cursor,
                    "limit": 100,
                })
                all_contacts.extend(resp.get("external_contact_list", []))
                cursor = resp.get("next_cursor", "")
                if not cursor:
                    break
        return all_contacts
```

> **⚠️ 踩坑提醒**:
> - `batch/get_by_user` 返回的跟进人字段是 **`follow_info`**（仅含 `tag_id`），**不是** `follow_user`（含完整 `tags`）。如果你需要标签名称，必须额外调 `GET /externalcontact/get` 或「获取企业标签库」接口。
> - userid 有客户联系范围但**无客户时返回 84061 而非空数组**，需要 catch 这个错误码。

---

### 三、模块 2 — 客户继承（在职 + 离职）

#### 在职继承 vs 离职继承 关键差异

| 维度 | 在职继承 | 离职继承 |
|------|---------|---------|
| 接口 | `POST /externalcontact/transfer_customer` | `POST /externalcontact/resigned/transfer_customer` |
| 客户确认 | **需要** 客户 24h 内确认，可拒绝 | **无需** 确认，24h 后自动完成 |
| 自定义消息 | 支持 `transfer_success_msg` | ❌ 不支持此参数 |
| 90 天限制 | 每位客户最多转接 **2** 次 | 不适用 |
| handover_userid | 必须在职 | **必须已离职**，否则返回 40097 |

#### 代码实现

```python
class TransferService:
    def __init__(self, client: WeComClient):
        self.client = client

    # ── 在职继承 ──
    def transfer_onjob(
        self,
        handover_userid: str,
        takeover_userid: str,
        external_userids: list[str],
        msg: str = None,
    ) -> dict:
        """在职成员客户转接 — 客户需 24h 内确认"""
        if len(external_userids) > 100:
            raise ValueError("每次最多 100 个客户")

        body = {
            "handover_userid": handover_userid,
            "takeover_userid": takeover_userid,
            "external_userid": external_userids,
        }
        if msg:
            body["transfer_success_msg"] = msg

        resp = self.client.post("/externalcontact/transfer_customer", json=body)

        # ⚠️ errcode=0 不代表全部成功，需逐个检查
        results = resp.get("customer", [])
        for r in results:
            if r["errcode"] == 40128:
                print(f"客户 {r['external_userid']} 90天内已转接2次，跳过")
            elif r["errcode"] != 0:
                print(f"客户 {r['external_userid']} 转接失败: {r['errcode']}")
        return results

    # ── 离职继承 ──
    def transfer_resigned(
        self,
        handover_userid: str,
        takeover_userid: str,
        external_userids: list[str],
    ) -> dict:
        """离职成员客户转接 — 无需客户确认，24h 自动完成"""
        if len(external_userids) > 100:
            raise ValueError("每次最多 100 个客户")

        # ⚠️ 离职继承没有 transfer_success_msg 参数
        resp = self.client.post(
            "/externalcontact/resigned/transfer_customer",
            json={
                "handover_userid": handover_userid,  # 必须已离职
                "takeover_userid": takeover_userid,
                "external_userid": external_userids,
            },
        )
        return resp.get("customer", [])

    # ── 查询接替状态 ──
    def poll_status(self, handover: str, takeover: str, resigned=False) -> list:
        """轮询接替状态（自动分页）"""
        path = ("/externalcontact/resigned/transfer_result"
                if resigned else "/externalcontact/transfer_result")
        results = []
        cursor = ""
        while True:
            resp = self.client.post(path, json={
                "handover_userid": handover,
                "takeover_userid": takeover,
                "cursor": cursor,
            })
            results.extend(resp.get("customer", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return results
        # status: 1=完毕 2=等待 3=拒绝 4=上限 5=无记录(仅在职)
```

> **⚠️ 踩坑提醒**:
> 1. 调用离职继承后**立即查询可能返回空数组**（后端异步处理），建议首次查询延迟 5-10 秒
> 2. `transfer_fail` 回调中的 `<UserID>` 字段是**接替成员**的 userid，不是原跟进人
> 3. 接替成员必须满足：已激活企业微信 + 已实名认证 + 已配置客户联系功能

---

### 四、模块 3 — 会话存档

> **⚠️ 重要：企业微信的会话存档是付费功能**，需要在管理后台开通。

#### 关键架构说明

会话存档**不是**普通的 HTTP API，需要了解以下架构：

```
企业微信聊天记录（加密）
        │
        ▼
企微提供的 C/C++ SDK（部署在你的服务器上）
        │  拉取 + RSA 解密
        ▼
你的服务器本地数据库（明文存储）
        │
        ▼
你的 Web 管理后台（查看/检索）
```

#### 相关 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `msgaudit/get_permit_user_list` | POST | 获取开启存档的成员列表 |
| `msgaudit/check_single_agree` | POST | 检查会话同意情况（外部联系人需同意） |
| `msgaudit/groupchat/get` | POST | 获取内部群信息 |

```python
class ArchiveService:
    def __init__(self, client: WeComClient):
        self.client = client

    def get_permitted_users(self) -> list:
        """获取开启了会话存档的成员列表"""
        resp = self.client.post("/msgaudit/get_permit_user_list", json={"type": 1})
        return resp.get("ids", [])

    def check_agree(self, userid: str, exteranl_userid: str) -> bool:
        """检查外部联系人是否同意存档"""
        resp = self.client.post("/msgaudit/check_single_agree", json={
            "info": [{
                "userid": userid,
                "exteranl_open_id": exteranl_userid,
            }]
        })
        agree_list = resp.get("agreeinfo", [])
        return agree_list[0]["agree_status"] == "Agree" if agree_list else False
```

---

### 五、继承后会话同步方案

这是需求中最关键也最复杂的部分。核心理解：

> **会话数据存储在你的服务器上**（通过 C SDK 拉取后解密存储），而非存储在企业微信上。因此"继承后会话同步"本质上是你的业务系统的**数据权限调整**。

#### 推荐方案

```
继承完成
    │
    ▼
监听 transfer_result status=1（接替完毕）
    │
    ▼
在你的数据库中执行权限变更:
    UPDATE chat_archive_permissions
    SET    viewer_userid = '新接替人'
    WHERE  customer_external_userid = '客户ID'
    AND    viewer_userid = '原跟进人';
    │
    ▼
新接替员工在管理后台即可查看该客户的历史会话
```

#### 具体实现流程

```python
class TransferWithArchiveSync:
    """继承 + 会话存档同步的完整工作流"""

    def __init__(self, client, db):
        self.transfer = TransferService(client)
        self.archive = ArchiveService(client)
        self.db = db

    def execute_transfer(
        self,
        handover: str,
        takeover: str,
        customers: list[str],
        resigned: bool = False,
    ):
        # 1. 执行继承
        if resigned:
            results = self.transfer.transfer_resigned(handover, takeover, customers)
        else:
            results = self.transfer.transfer_onjob(handover, takeover, customers)

        # 2. 记录待同步的客户
        for r in results:
            if r["errcode"] == 0:
                self.db.save_pending_sync({
                    "handover": handover,
                    "takeover": takeover,
                    "external_userid": r["external_userid"],
                    "resigned": resigned,
                    "status": "pending",
                })

    def check_and_sync(self, handover: str, takeover: str, resigned=False):
        """定时任务：检查接替状态 → 同步会话权限"""
        results = self.transfer.poll_status(handover, takeover, resigned)

        for r in results:
            if r["status"] == 1:  # 接替完毕
                # 3. 同步会话存档权限
                self.db.execute("""
                    INSERT INTO archive_access (userid, external_userid, granted_at)
                    VALUES (%s, %s, NOW())
                """, (takeover, r["external_userid"]))

                # 可选：保留原员工的查看权限用于审计
                # self.db.execute("UPDATE archive_access SET revoked=false ...")

                self.db.update_sync_status(r["external_userid"], "completed")

            elif r["status"] == 3:  # 客户拒绝（仅在职继承）
                self.db.update_sync_status(r["external_userid"], "rejected")
                # 告警通知管理员
```

#### 回调方案（推荐替代轮询）

```python
# 在你的回调服务中监听 transfer_fail 事件
@app.post("/callback")
def handle_callback(msg_xml):
    if msg_xml["ChangeType"] == "transfer_fail":
        fail_reason = msg_xml["FailReason"]
        # ⚠️ UserID 是接替成员，不是原跟进人
        takeover = msg_xml["UserID"]
        customer = msg_xml["ExternalUserID"]

        if fail_reason == "customer_refused":
            # 客户拒绝接替
            notify_admin(f"客户 {customer} 拒绝了 {takeover} 的接替")
        elif fail_reason == "customer_limit_exceed":
            # 接替成员客户数达上限
            notify_admin(f"{takeover} 客户数已满，需更换接替人")
```

---

### 六、数据库表设计建议

```sql
-- 会话存档原始数据
CREATE TABLE chat_archives (
    id              BIGINT PRIMARY KEY,
    msg_id          VARCHAR(64) UNIQUE,
    from_userid     VARCHAR(64),      -- 发送方
    to_list         JSON,             -- 接收方列表
    msg_type        VARCHAR(32),      -- text/image/file/...
    content         TEXT,             -- 解密后的消息内容
    msg_time        BIGINT,           -- 消息时间戳
    external_userid VARCHAR(64),      -- 关联的外部联系人
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 会话存档查看权限（核心：继承后修改此表）
CREATE TABLE archive_access (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    userid          VARCHAR(64),      -- 有权查看的员工
    external_userid VARCHAR(64),      -- 客户
    granted_at      TIMESTAMP,
    revoked_at      TIMESTAMP NULL,   -- 权限回收时间（审计用）
    grant_reason    ENUM('original', 'transfer', 'admin'),
    INDEX idx_userid (userid),
    INDEX idx_external (external_userid)
);

-- 继承记录
CREATE TABLE transfer_records (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    handover_userid VARCHAR(64),
    takeover_userid VARCHAR(64),
    external_userid VARCHAR(64),
    transfer_type   ENUM('onjob', 'resigned'),
    status          TINYINT,          -- 1=完毕 2=等待 3=拒绝 4=上限
    archive_synced  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    completed_at    TIMESTAMP NULL
);
```

---

### 七、注意事项清单

| # | 检查项 | 严重度 |
|---|--------|--------|
| 1 | 使用「客户联系」专用 secret，不是系统应用 secret | CRITICAL |
| 2 | 会话存档需要 **C/C++ SDK**，不是 HTTP API | CRITICAL |
| 3 | 会话存档是**付费功能**，需管理后台开通 | CRITICAL |
| 4 | 在职继承需客户 24h 内确认，**不是即时生效** | HIGH |
| 5 | `errcode=0` 不代表所有客户都成功，需**逐个检查** `customer[].errcode` | HIGH |
| 6 | 离职继承的 `handover_userid` **必须已离职**，否则返回 40097 | HIGH |
| 7 | 离职继承**没有** `transfer_success_msg` 参数 | HIGH |
| 8 | `batch/get_by_user` 返回 `follow_info` 不是 `follow_user` | CRITICAL |
| 9 | 回调 `transfer_fail` 中 `<UserID>` 是**接替成员**，非原跟进人 | HIGH |
| 10 | 外部联系人需**同意**存档才能拉取聊天记录 | HIGH |

---

## ⚡ 核心差异：有 SKILL vs 没有 SKILL

> 以下对比表展示了同一问题下，AI 有无 SKILL 知识加持的回答质量差距。

### 差异总览

| 维度 | 没有 SKILL ❌ | 有 SKILL ✅ |
|------|-------------|-----------|
| **API 路径** | 可能编造不存在的 endpoint | 精确到 `/externalcontact/resigned/transfer_customer` |
| **follow_user vs follow_info** | 完全不知道这个字段差异 | 主动标注为 **CRITICAL** 级陷阱 |
| **在职/离职继承差异** | 混为一谈，可能给出错误代码 | 给出 6 个维度的精确对比表 |
| **transfer_success_msg** | 可能在离职接口也传此参数 | 主动提醒离职继承不支持 |
| **84061 错误** | "接口调用失败，请检查参数" | 列出 4 种触发场景 + 解决方案 |
| **会话存档** | 可能编造 HTTP API | 明确告知需要 **C/C++ SDK** 部署 |
| **回调 UserID 语义** | 猜测是原跟进人 | 精确指出是**接替成员** |
| **会话同步设计** | 可能给不出方案或瞎编 API | 给出完整的数据库设计 + 权限迁移方案 |
| **90 天限制** | 不知道有这个限制 | 主动提醒在职客户 2 次/90天，代码预检 |
| **errcode=0** | 以为全部成功 | 提醒需**逐个检查** `customer[].errcode` |
| **接替前置条件** | 不知道 | 实名 + 激活 + 客户联系功能 三重校验 |
| **查询时序** | 调完立刻查 | 提醒离职继承立即查询**可能返回空**（延迟 5~10 秒） |

### 逐场景深度对比

#### 场景 1: "帮我获取所有客户列表"

| | 没有 SKILL | 有 SKILL |
|-|-----------|---------|
| **调用链路** | 可能编造一个 `GET /customer/list` | 正确给出 C5→C3 三步走：服务人员→批量查客户→（可选）详情补全 |
| **分页处理** | 可能遗漏 | cursor 分页 + userid_list≤100 |
| **字段差异** | 不知道 | 主动提醒 `follow_info` 仅含 `tag_id`，需要标签名称要额外调接口 |
| **无客户场景** | 认为返回空数组 | 提醒 84061 错误码（不是空数组！） |

#### 场景 2: "实现客户继承"

| | 没有 SKILL | 有 SKILL |
|-|-----------|---------|
| **接口区分** | 可能只给一个接口 | 精确区分 6 个接口（T1~T6：在职客户/离职客户/在职群/离职群/状态查询×2） |
| **参数差异** | 两个接口传一样的参数 | 离职没有 `transfer_success_msg`，会主动提醒 |
| **确认机制** | 不知道需要客户确认 | 在职需 24h 确认+可拒绝，离职 24h 自动完成 |
| **错误处理** | 只看整体 errcode | **逐客户检查** errcode，处理 40128/40099/40100 |
| **回调字段** | UserID=原跟进人（错） | UserID=接替成员（对） |

#### 场景 3: "继承后查看原员工的聊天记录"

| | 没有 SKILL | 有 SKILL |
|-|-----------|---------|
| **会话存档原理** | 编造 `GET /chat/history` 之类的 API | 明确告知需要 C/C++ SDK + RSA 解密，数据存在企业服务器上 |
| **同步方案** | 无方案或编造 API | 给出完整架构：数据库权限表设计 + 继承状态监听 + 权限迁移逻辑 |
| **付费说明** | 不提 | 主动标注为付费功能 |
| **同意机制** | 不知道 | 提醒外部联系人需**同意存档** |

---

## 📐 SKILL 调用清单

本回答实际参考的 SKILL 文件：

| SKILL 文件 | 引用内容 |
|-----------|---------|
| `skills/enterprise/wecom-core.md` | Token 缓存、错误码、代码规范 |
| `skills/enterprise/wecom-crm-customer.md` | C1~C6 API、follow_user vs follow_info 差异、84061 处理 |
| `skills/enterprise/wecom-crm-transfer.md` | T1~T6 API、在职/离职差异表、status 枚举、transfer_fail 回调 |
| `skills/enterprise/wecom-advanced.md` | 会话存档 A1~A4 API、C SDK 说明 |
| `skills/enterprise/wecom-contact.md` | 员工状态查询（离职判断） |

---

> **结论**: SKILL 的核心价值不是"让 AI 知道更多"，而是**让 AI 不犯错** — 把 `follow_user` vs `follow_info`、`transfer_success_msg` 仅在职支持、会话存档需要 C SDK 这类**看文档也容易遗漏的细节**，变成 AI 会**主动提醒**的知识。
