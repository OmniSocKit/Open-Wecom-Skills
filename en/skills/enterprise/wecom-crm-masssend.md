---
name: wecom-crm-masssend
description: WeCom CRM Mass Messaging & Welcome Message SKILL — covers group send (add_msg_template, remind, cancel, query task/result), welcome message (send_welcome_msg), and group welcome template CRUD (add/edit/get/del)
version: 1.0.0
triggers:
  - wecom mass send
  - wecom group send
  - 企业群发
  - 群发消息
  - welcome message
  - 欢迎语
  - welcome_code
  - send_welcome_msg
  - add_msg_template
  - groupmsg
  - group_welcome_template
  - 入群欢迎语
argument-hint: "<action> [options]"
---

# WeCom CRM Mass Messaging & Welcome Message SKILL

> Domain: 企业群发 + 新客户欢迎语 + 入群欢迎语素材管理
> API Count: 11 (S1–S11)
> Callbacks: 1 (CB1)
> Depends on: `wecom-core` (token, error handling, crypto)

---

## 1. Prerequisites

Before using this SKILL, ensure:

- [ ] **wecom-core SKILL** is loaded (provides token management, error handling)
- [ ] **Access token** obtained using one of:
  - 「客户联系」secret → `access_token`
  - 配置到「可调用应用」列表中的自建应用 secret → `access_token`
  - 第三方应用需授权「企业客户权限 → 客户联系 → 群发消息给客户和客户群」
- [ ] **Callback URL configured** for welcome message scenarios (管理后台 → 客户联系 → API → 接收事件服务器)
- [ ] **media_id** for attachments obtained via `/cgi-bin/media/upload` (临时素材, 3天有效)
- [ ] Enterprise WeChat client ≥ **v2.7.5**

---

## 2. Core Concepts

### 2.1 Two Messaging Paradigms

| Paradigm | Mechanism | Timing | Key Parameter |
|----------|-----------|--------|---------------|
| **企业群发** | Create task → member confirms in client → sends | Async (member-driven) | `msgid` |
| **新客户欢迎语** | Callback event → API sends immediately | Sync (20s TTL) | `welcome_code` |

### 2.2 Group Send Lifecycle

```
create (S1) → msgid
    ├─ remind (S2, max 3×/24h)
    ├─ cancel (S3, stop unsent only)
    ├─ query task list (S4, by time range)
    ├─ query member tasks (S5, by msgid)
    └─ query send results (S6, by msgid + userid)
```

### 2.3 Welcome Message Flow

```
[Member adds customer] → WeCom callback (CB1)
    → extract WelcomeCode (20s TTL, single-use)
    → POST send_welcome_msg (S7)
```

### 2.4 Group Welcome Template Lifecycle

```
add (S8) → template_id
    ├─ edit (S9, by template_id)
    ├─ get (S10, GET request)
    └─ del (S11, by template_id)
```

### 2.5 chat_type Modes

| Value | Target | external_userid | chat_id |
|-------|--------|-----------------|---------|
| `single` (default) | Individual customers | Required (or sender) | N/A |
| `group` | Customer groups | N/A | Returned in results |

### 2.6 Attachment Priority Rule

When multiple attachment types coexist in a single request:

```
image > link > miniprogram > file > video
```

Only the **highest priority** type takes effect. `text` is independent and sends as a separate message alongside attachments.

### 2.7 Monthly Send Limit

Each customer can receive at most **N messages per month**, where N = number of days in that month (e.g., March = 31). Status `3` in results means the limit was hit.

---

## 3. API Quick Reference

| ID | API Name | Method | Path | Key Params |
|----|----------|--------|------|------------|
| S1 | 创建企业群发 | POST | `/cgi-bin/externalcontact/add_msg_template` | chat_type, external_userid[], sender, text, attachments[] |
| S2 | 提醒成员群发 | POST | `/cgi-bin/externalcontact/remind_groupmsg_send` | msgid |
| S3 | 停止企业群发 | POST | `/cgi-bin/externalcontact/cancel_groupmsg_send` | msgid |
| S4 | 获取群发记录列表 | POST | `/cgi-bin/externalcontact/get_groupmsg_list_v2` | chat_type, start_time, end_time, cursor, limit |
| S5 | 获取群发成员发送任务列表 | POST | `/cgi-bin/externalcontact/get_groupmsg_task` | msgid, cursor, limit |
| S6 | 获取企业群发成员执行结果 | POST | `/cgi-bin/externalcontact/get_groupmsg_send_result` | msgid, userid, cursor, limit |
| S7 | 发送新客户欢迎语 | POST | `/cgi-bin/externalcontact/send_welcome_msg` | welcome_code, text, attachments[] |
| S8 | 添加入群欢迎语素材 | POST | `/cgi-bin/externalcontact/group_welcome_template/add` | text, image/link/miniprogram/file/video |
| S9 | 编辑入群欢迎语素材 | POST | `/cgi-bin/externalcontact/group_welcome_template/edit` | template_id, text, image/link/... |
| S10 | 获取入群欢迎语素材 | **GET** | `/cgi-bin/externalcontact/group_welcome_template/get` | template_id (query param) |
| S11 | 删除入群欢迎语素材 | POST | `/cgi-bin/externalcontact/group_welcome_template/del` | template_id |

> Base URL: `https://qyapi.weixin.qq.com`

---

## 4. API Details

### S1: 创建企业群发 (add_msg_template)

Creates a mass messaging task. Members must confirm in their WeCom client before messages are sent.

**Request**: `POST /cgi-bin/externalcontact/add_msg_template?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_type | string | No | `single` (default) = customers; `group` = customer groups |
| external_userid | string[] | Conditional | Customer IDs, max **10,000**. Required when chat_type=single (or sender required) |
| sender | string | Conditional | Sender userid. Required when chat_type=group; for single, mutual exclusion with external_userid (at least one required) |
| text | object | Conditional | Text message (text + attachments cannot both be empty) |
| text.content | string | No | Text content, max **4,000 bytes** |
| attachments | object[] | Conditional | Attachment list, max **9** items |
| attachments[].msgtype | string | Yes | `image` / `link` / `miniprogram` / `video` / `file` |
| attachments[].image.media_id | string | Conditional | Image media_id (or pic_url) |
| attachments[].image.pic_url | string | Conditional | Image URL (or media_id) |
| attachments[].link.title | string | Yes | Link title |
| attachments[].link.picurl | string | No | Link cover image URL |
| attachments[].link.desc | string | No | Link description |
| attachments[].link.url | string | Yes | Link URL |
| attachments[].miniprogram.title | string | Yes | Mini program title |
| attachments[].miniprogram.pic_media_id | string | Yes | Cover image media_id (recommended 520×416) |
| attachments[].miniprogram.appid | string | Yes | Mini program appid (must be associated with enterprise) |
| attachments[].miniprogram.page | string | Yes | Mini program page path |
| attachments[].video.media_id | string | Yes | Video media_id |
| attachments[].file.media_id | string | Yes | File media_id |

**Response**:

| Field | Type | Description |
|-------|------|-------------|
| errcode | int | 0 = success |
| errmsg | string | Error message |
| fail_list | string[] | Invalid/unsendable external_userid list |
| msgid | string | Mass message ID for subsequent queries |

**Rate Limits**:
- Each customer: max **N messages/month** (N = days in month)
- Same member to same customer: max **1 message/day**
- Single batch: max **20,000 customers**

---

### S2: 提醒成员群发 (remind_groupmsg_send)

Re-triggers notification to members who haven't completed the mass send task.

**Request**: `POST /cgi-bin/externalcontact/remind_groupmsg_send?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| msgid | string | Yes | Mass message ID |

**Constraint**: Max **3 reminders per 24 hours** per msgid.

---

### S3: 停止企业群发 (cancel_groupmsg_send)

Stops unsent mass messaging task. **Cannot recall already-sent messages.**

**Request**: `POST /cgi-bin/externalcontact/cancel_groupmsg_send?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| msgid | string | Yes | Mass message ID |

**Idempotent**: Calling on already-stopped task returns success.

---

### S4: 获取群发记录列表 (get_groupmsg_list_v2)

Retrieves historical mass messaging records with filtering and pagination.

**Request**: `POST /cgi-bin/externalcontact/get_groupmsg_list_v2?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_type | string | **Yes** | `single` or `group` |
| start_time | int | **Yes** | Start time (Unix timestamp) |
| end_time | int | **Yes** | End time (Unix timestamp) |
| creator | string | No | Filter by creator userid |
| filter_type | int | No | 0=enterprise, 1=personal, 2=all (default) |
| cursor | string | No | Pagination cursor |
| limit | int | No | Max records, default/max **500** |

**Response** includes `group_msg_list[]` with `msgid`, `creator`, `create_time`, `create_type`, `text`, `attachments`.

> **Note**: `chat_type` is **required** in this API (unlike S1 where it's optional).

---

### S5: 获取群发成员发送任务列表 (get_groupmsg_task)

Queries member-level send status for a mass message task.

**Request**: `POST /cgi-bin/externalcontact/get_groupmsg_task?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| msgid | string | Yes | Mass message ID |
| cursor | string | No | Pagination cursor |
| limit | int | No | Max records, default 500, max **1000** |

**Response** `task_list[]`:

| Field | Type | Description |
|-------|------|-------------|
| userid | string | Member userid |
| status | int | 0=unsent, 1=sent, 2=not friend, 3=monthly limit hit |
| send_time | int | Send timestamp (0 if unsent) |

> **Limitation**: Does NOT support messages created before **2020-11-17**. Use S6 instead for older messages.

---

### S6: 获取企业群发成员执行结果 (get_groupmsg_send_result)

Queries per-customer/per-group send result for a specific member.

**Request**: `POST /cgi-bin/externalcontact/get_groupmsg_send_result?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| msgid | string | Yes | Mass message ID |
| userid | string | Yes | Member userid |
| cursor | string | No | Pagination cursor |
| limit | int | No | Max records, default 500, max **1000** |

**Response** `send_list[]`:

| Field | Type | Description |
|-------|------|-------------|
| external_userid | string | Customer ID (when chat_type=single) |
| chat_id | string | Group chat ID (when chat_type=group) |
| userid | string | Sender member userid |
| status | int | 0=unsent, 1=sent, 2=not friend, 3=monthly limit |
| send_time | int | Send timestamp (0 if unsent) |

> **Mutual exclusion**: `external_userid` and `chat_id` never appear together; depends on `chat_type`.

---

### S7: 发送新客户欢迎语 (send_welcome_msg)

Sends personalized welcome message to a newly added customer using a time-limited `welcome_code`.

**Request**: `POST /cgi-bin/externalcontact/send_welcome_msg?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| welcome_code | string | Yes | From `add_external_contact` callback, **20s TTL**, single-use |
| text | object | Conditional | Text message (text + attachments cannot both be empty) |
| text.content | string | No | Text content, max 4,000 bytes. Supports `%NICKNAME%` placeholder |
| attachments | object[] | Conditional | Attachment list, max 9. Same structure as S1 |

**Critical Constraints**:
- `welcome_code` expires in **20 seconds** — process callback immediately
- Single-use: only first caller succeeds; subsequent calls return `41051`
- Not issued when: admin has configured welcome message, or member already chatting with customer

---

### S8: 添加入群欢迎语素材 (group_welcome_template/add)

Adds a welcome message template for customer group join events.

**Request**: `POST /cgi-bin/externalcontact/group_welcome_template/add?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | object | Conditional | Text content (supports `%NICKNAME%`) |
| image | object | Conditional | Image message (mutual exclusion with other non-text types) |
| image.media_id | string | Conditional | Image media_id (or pic_url) |
| image.pic_url | string | Conditional | Image URL (or media_id) |
| link | object | Conditional | Link message |
| link.title | string | Yes | Title |
| link.picurl | string | No | Cover image URL |
| link.desc | string | No | Description |
| link.url | string | Yes | Link URL |
| miniprogram | object | Conditional | Mini program message |
| miniprogram.title | string | Yes | Title |
| miniprogram.pic_media_id | string | Yes | Cover image media_id |
| miniprogram.appid | string | Yes | Mini program appid |
| miniprogram.page | string | Yes | Page path |
| file | object | Conditional | File message |
| file.media_id | string | Yes | File media_id |
| video | object | Conditional | Video message |
| video.media_id | string | Yes | Video media_id |
| agentid | int | No | App ID (legacy third-party suites) |
| notify | int | No | Whether to notify members (add only) |

**Response**: Returns `template_id`.

**Content Rules**:
- All fields cannot be empty simultaneously
- Non-text types are mutually exclusive; priority: `image > link > miniprogram > file > video`
- `text` can coexist with one non-text type (sent as two messages)
- Enterprise limit: max **100 templates**

---

### S9: 编辑入群欢迎语素材 (group_welcome_template/edit)

**Request**: `POST /cgi-bin/externalcontact/group_welcome_template/edit?access_token=ACCESS_TOKEN`

Same parameters as S8, plus required `template_id`. `notify` field not applicable.

> Can only edit templates created by the calling application.

---

### S10: 获取入群欢迎语素材 (group_welcome_template/get)

**Request**: `GET /cgi-bin/externalcontact/group_welcome_template/get?access_token=ACCESS_TOKEN&template_id=TEMPLATE_ID`

> **Note**: This is a **GET** request with `template_id` as query parameter.

**Response** returns template content: text, image, link, miniprogram, file, video fields.

---

### S11: 删除入群欢迎语素材 (group_welcome_template/del)

**Request**: `POST /cgi-bin/externalcontact/group_welcome_template/del?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| template_id | string | Yes | Template ID |
| agentid | int | No | App ID (legacy third-party suites) |

> Can only delete templates created by the calling application.

---

## 5. Callbacks

### CB1: add_external_contact (新增外部联系人 — 触发欢迎语)

When a member adds an external contact, WeCom pushes `change_external_contact` + `add_external_contact` event containing `WelcomeCode`.

**Event XML**:

```xml
<xml>
  <ToUserName><![CDATA[CorpID]]></ToUserName>
  <FromUserName><![CDATA[sys]]></FromUserName>
  <CreateTime>1403610513</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[change_external_contact]]></Event>
  <ChangeType><![CDATA[add_external_contact]]></ChangeType>
  <UserID><![CDATA[zhangsan]]></UserID>
  <ExternalUserID><![CDATA[woAJ2GCAAAXtWyujaWJHDDGi0mAAAA]]></ExternalUserID>
  <State><![CDATA[渠道来源标识]]></State>
  <WelcomeCode><![CDATA[WELCOMECODE]]></WelcomeCode>
</xml>
```

**Key Fields**:

| Field | Description |
|-------|-------------|
| UserID | Member who added the contact |
| ExternalUserID | External contact ID |
| State | Custom state from 「联系我」configuration |
| WelcomeCode | 20-second TTL, single-use token for S7 |

**WelcomeCode NOT issued when**:
- Admin has configured usable welcome message for the member
- Member and customer already started chatting
- Adding enterprise WeChat business partner (auto name-card)
- `welcome_code` from 「外部联系人免验证添加」already consumed

---

## 6. Workflows

### Workflow A: Enterprise Mass Send to Customers

```
Step 1: Create mass send task
  POST /cgi-bin/externalcontact/add_msg_template
  Body: {chat_type: "single", external_userid: [...], sender: "...", text: {...}, attachments: [...]}
  → Save msgid

Step 2: (Optional) Remind members who haven't sent
  POST /cgi-bin/externalcontact/remind_groupmsg_send
  Body: {msgid: "..."}
  → Max 3 times per 24 hours

Step 3: (Optional) Stop unsent tasks
  POST /cgi-bin/externalcontact/cancel_groupmsg_send
  Body: {msgid: "..."}

Step 4: Query member task status
  POST /cgi-bin/externalcontact/get_groupmsg_task
  Body: {msgid: "...", limit: 1000}
  → Paginate with cursor until next_cursor is empty

Step 5: Query per-customer results
  POST /cgi-bin/externalcontact/get_groupmsg_send_result
  Body: {msgid: "...", userid: "zhangsan", limit: 1000}
  → Paginate for each member
```

### Workflow B: New Customer Welcome Message

```
Step 1: Receive callback event
  Event: change_external_contact / add_external_contact
  → Extract WelcomeCode (20s TTL!)

Step 2: Send welcome message immediately
  POST /cgi-bin/externalcontact/send_welcome_msg
  Body: {welcome_code: "...", text: {content: "Hi %NICKNAME%!"}, attachments: [...]}
  → Must call within 20 seconds

Step 3: Handle race condition
  If errcode=41051 → another app already sent welcome message (normal)
```

### Workflow C: Group Welcome Template Management

```
Step 1: Create template
  POST /cgi-bin/externalcontact/group_welcome_template/add
  Body: {text: {content: "Welcome %NICKNAME%!"}, link: {...}}
  → Save template_id

Step 2: Configure in admin console
  管理后台 → 客户群 → 引用 template_id

Step 3: Update template content
  POST /cgi-bin/externalcontact/group_welcome_template/edit
  Body: {template_id: "...", text: {content: "Updated!"}}

Step 4: Query template
  GET /cgi-bin/externalcontact/group_welcome_template/get?template_id=...

Step 5: Delete when no longer needed
  POST /cgi-bin/externalcontact/group_welcome_template/del
  Body: {template_id: "..."}
```

---

## 7. Code Templates

### Python

```python
"""WeCom CRM Mass Messaging & Welcome Message"""
import time
import httpx

class WeComMassSend:
    """Enterprise mass send + welcome message client."""

    BASE = "https://qyapi.weixin.qq.com/cgi-bin/externalcontact"

    def __init__(self, access_token_func):
        """
        Args:
            access_token_func: Callable returning valid access_token string
        """
        self._token = access_token_func
        self._client = httpx.Client(timeout=30)

    def _url(self, path: str) -> str:
        return f"{self.BASE}/{path}?access_token={self._token()}"

    def _post(self, path: str, body: dict) -> dict:
        resp = self._client.post(self._url(path), json=body)
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise Exception(f"WeCom API error: {data}")
        return data

    def _get(self, path: str, params: dict = None) -> dict:
        url = self._url(path)
        resp = self._client.get(url, params=params)
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise Exception(f"WeCom API error: {data}")
        return data

    # ── S1: Create mass send task ──
    def create_mass_send(
        self,
        text_content: str = None,
        attachments: list = None,
        external_userid: list = None,
        sender: str = None,
        chat_type: str = "single",
    ) -> dict:
        """Create enterprise mass messaging task.

        Returns: {msgid, fail_list}
        """
        body = {"chat_type": chat_type}
        if text_content:
            body["text"] = {"content": text_content}
        if attachments:
            body["attachments"] = attachments
        if external_userid:
            body["external_userid"] = external_userid
        if sender:
            body["sender"] = sender

        if not body.get("text") and not body.get("attachments"):
            raise ValueError("text and attachments cannot both be empty")

        return self._post("add_msg_template", body)

    # ── S2: Remind members ──
    def remind_send(self, msgid: str) -> dict:
        """Remind members who haven't sent. Max 3 times per 24h."""
        return self._post("remind_groupmsg_send", {"msgid": msgid})

    # ── S3: Cancel mass send ──
    def cancel_send(self, msgid: str) -> dict:
        """Stop unsent mass send task. Cannot recall sent messages."""
        return self._post("cancel_groupmsg_send", {"msgid": msgid})

    # ── S4: List mass send records ──
    def list_records(
        self,
        chat_type: str,
        start_time: int,
        end_time: int,
        creator: str = None,
        filter_type: int = 2,
        limit: int = 500,
    ) -> list:
        """Get all mass send records with auto-pagination."""
        all_records = []
        cursor = ""
        while True:
            body = {
                "chat_type": chat_type,
                "start_time": start_time,
                "end_time": end_time,
                "filter_type": filter_type,
                "limit": limit,
                "cursor": cursor,
            }
            if creator:
                body["creator"] = creator
            data = self._post("get_groupmsg_list_v2", body)
            all_records.extend(data.get("group_msg_list", []))
            cursor = data.get("next_cursor", "")
            if not cursor:
                break
        return all_records

    # ── S5: Get member task status ──
    def get_task_list(self, msgid: str) -> list:
        """Get member-level send status with auto-pagination."""
        all_tasks = []
        cursor = ""
        while True:
            body = {"msgid": msgid, "limit": 1000, "cursor": cursor}
            data = self._post("get_groupmsg_task", body)
            all_tasks.extend(data.get("task_list", []))
            cursor = data.get("next_cursor", "")
            if not cursor:
                break
        return all_tasks

    # ── S6: Get send results per member ──
    def get_send_results(self, msgid: str, userid: str) -> list:
        """Get per-customer send results for a member."""
        all_results = []
        cursor = ""
        while True:
            body = {
                "msgid": msgid,
                "userid": userid,
                "limit": 1000,
                "cursor": cursor,
            }
            data = self._post("get_groupmsg_send_result", body)
            all_results.extend(data.get("send_list", []))
            cursor = data.get("next_cursor", "")
            if not cursor:
                break
        return all_results

    # ── S7: Send welcome message ──
    def send_welcome(
        self,
        welcome_code: str,
        text_content: str = None,
        attachments: list = None,
    ) -> dict:
        """Send welcome message using callback-provided welcome_code.

        CRITICAL: welcome_code has 20-second TTL!
        """
        body = {"welcome_code": welcome_code}
        if text_content:
            body["text"] = {"content": text_content}
        if attachments:
            body["attachments"] = attachments

        if not body.get("text") and not body.get("attachments"):
            raise ValueError("text and attachments cannot both be empty")

        return self._post("send_welcome_msg", body)

    # ── S8: Add group welcome template ──
    def add_welcome_template(self, content: dict) -> str:
        """Create group welcome template. Returns template_id.

        Args:
            content: dict with text/image/link/miniprogram/file/video keys
        """
        data = self._post("group_welcome_template/add", content)
        return data["template_id"]

    # ── S9: Edit group welcome template ──
    def edit_welcome_template(self, template_id: str, content: dict) -> dict:
        """Edit existing group welcome template."""
        body = {"template_id": template_id, **content}
        return self._post("group_welcome_template/edit", body)

    # ── S10: Get group welcome template ──
    def get_welcome_template(self, template_id: str) -> dict:
        """Get group welcome template by ID. Uses GET method."""
        return self._get(
            "group_welcome_template/get",
            params={"template_id": template_id},
        )

    # ── S11: Delete group welcome template ──
    def del_welcome_template(self, template_id: str) -> dict:
        """Delete group welcome template."""
        return self._post(
            "group_welcome_template/del",
            {"template_id": template_id},
        )


# ── Callback handler for welcome message ──
def handle_welcome_callback(xml_data: dict, masssend_client: WeComMassSend):
    """Process add_external_contact callback to send welcome message.

    Must complete within 20 seconds of callback receipt!
    """
    welcome_code = xml_data.get("WelcomeCode")
    if not welcome_code:
        return  # No welcome code — admin-configured or already chatting

    external_userid = xml_data.get("ExternalUserID", "")
    state = xml_data.get("State", "")

    # Customize welcome content based on state/channel
    text = f"Hi %NICKNAME%, welcome! (from channel: {state})"
    attachments = []  # Add attachments as needed

    try:
        masssend_client.send_welcome(welcome_code, text, attachments)
    except Exception as e:
        if "41051" in str(e):
            pass  # Another app already sent — normal race condition
        else:
            raise
```

### TypeScript

```typescript
/**
 * WeCom CRM Mass Messaging & Welcome Message
 */

interface MassSendResult {
  errcode: number;
  errmsg: string;
  fail_list?: string[];
  msgid?: string;
}

interface TaskItem {
  userid: string;
  status: number;   // 0=unsent, 1=sent, 2=not friend, 3=monthly limit
  send_time: number;
}

interface SendResultItem {
  external_userid?: string;
  chat_id?: string;
  userid: string;
  status: number;
  send_time: number;
}

interface GroupMsgRecord {
  msgid: string;
  creator: string;
  create_time: number;
  create_type: number;
  text?: { content: string };
  attachments?: Attachment[];
}

interface Attachment {
  msgtype: 'image' | 'link' | 'miniprogram' | 'video' | 'file';
  image?: { media_id?: string; pic_url?: string };
  link?: { title: string; picurl?: string; desc?: string; url: string };
  miniprogram?: { title: string; pic_media_id: string; appid: string; page: string };
  video?: { media_id: string };
  file?: { media_id: string };
}

class WeComMassSend {
  private base = 'https://qyapi.weixin.qq.com/cgi-bin/externalcontact';

  constructor(private getToken: () => Promise<string>) {}

  private async url(path: string): Promise<string> {
    const token = await this.getToken();
    return `${this.base}/${path}?access_token=${token}`;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const resp = await fetch(await this.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`WeCom error: ${JSON.stringify(data)}`);
    return data as T;
  }

  private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    let url = await this.url(path);
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += `&${qs}`;
    }
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`WeCom error: ${JSON.stringify(data)}`);
    return data as T;
  }

  // S1: Create mass send
  async createMassSend(opts: {
    chatType?: 'single' | 'group';
    externalUserid?: string[];
    sender?: string;
    textContent?: string;
    attachments?: Attachment[];
  }): Promise<MassSendResult> {
    const body: Record<string, unknown> = { chat_type: opts.chatType ?? 'single' };
    if (opts.textContent) body.text = { content: opts.textContent };
    if (opts.attachments) body.attachments = opts.attachments;
    if (opts.externalUserid) body.external_userid = opts.externalUserid;
    if (opts.sender) body.sender = opts.sender;
    return this.post<MassSendResult>('add_msg_template', body);
  }

  // S2: Remind members
  async remindSend(msgid: string): Promise<void> {
    await this.post('remind_groupmsg_send', { msgid });
  }

  // S3: Cancel mass send
  async cancelSend(msgid: string): Promise<void> {
    await this.post('cancel_groupmsg_send', { msgid });
  }

  // S4: List records with auto-pagination
  async listRecords(opts: {
    chatType: 'single' | 'group';
    startTime: number;
    endTime: number;
    creator?: string;
    filterType?: number;
  }): Promise<GroupMsgRecord[]> {
    const all: GroupMsgRecord[] = [];
    let cursor = '';
    do {
      const body: Record<string, unknown> = {
        chat_type: opts.chatType,
        start_time: opts.startTime,
        end_time: opts.endTime,
        filter_type: opts.filterType ?? 2,
        limit: 500,
        cursor,
      };
      if (opts.creator) body.creator = opts.creator;
      const data = await this.post<{
        group_msg_list: GroupMsgRecord[];
        next_cursor: string;
      }>('get_groupmsg_list_v2', body);
      all.push(...(data.group_msg_list ?? []));
      cursor = data.next_cursor ?? '';
    } while (cursor);
    return all;
  }

  // S5: Get task list
  async getTaskList(msgid: string): Promise<TaskItem[]> {
    const all: TaskItem[] = [];
    let cursor = '';
    do {
      const data = await this.post<{
        task_list: TaskItem[];
        next_cursor: string;
      }>('get_groupmsg_task', { msgid, limit: 1000, cursor });
      all.push(...(data.task_list ?? []));
      cursor = data.next_cursor ?? '';
    } while (cursor);
    return all;
  }

  // S6: Get send results
  async getSendResults(msgid: string, userid: string): Promise<SendResultItem[]> {
    const all: SendResultItem[] = [];
    let cursor = '';
    do {
      const data = await this.post<{
        send_list: SendResultItem[];
        next_cursor: string;
      }>('get_groupmsg_send_result', { msgid, userid, limit: 1000, cursor });
      all.push(...(data.send_list ?? []));
      cursor = data.next_cursor ?? '';
    } while (cursor);
    return all;
  }

  // S7: Send welcome message
  async sendWelcome(opts: {
    welcomeCode: string;
    textContent?: string;
    attachments?: Attachment[];
  }): Promise<void> {
    const body: Record<string, unknown> = { welcome_code: opts.welcomeCode };
    if (opts.textContent) body.text = { content: opts.textContent };
    if (opts.attachments) body.attachments = opts.attachments;
    await this.post('send_welcome_msg', body);
  }

  // S8: Add group welcome template
  async addWelcomeTemplate(content: Record<string, unknown>): Promise<string> {
    const data = await this.post<{ template_id: string }>(
      'group_welcome_template/add', content
    );
    return data.template_id;
  }

  // S9: Edit group welcome template
  async editWelcomeTemplate(templateId: string, content: Record<string, unknown>): Promise<void> {
    await this.post('group_welcome_template/edit', { template_id: templateId, ...content });
  }

  // S10: Get group welcome template (GET)
  async getWelcomeTemplate(templateId: string): Promise<Record<string, unknown>> {
    return this.get('group_welcome_template/get', { template_id: templateId });
  }

  // S11: Delete group welcome template
  async delWelcomeTemplate(templateId: string): Promise<void> {
    await this.post('group_welcome_template/del', { template_id: templateId });
  }
}
```

### Go

```go
package wecom

import (
	"context"
)

// MassSendClient manages enterprise mass messaging and welcome messages.
type MassSendClient struct {
	client *Client // wecom-core base client
}

// ── Request/Response types ──

type CreateMassSendReq struct {
	ChatType       string       `json:"chat_type,omitempty"`
	ExternalUserID []string     `json:"external_userid,omitempty"`
	Sender         string       `json:"sender,omitempty"`
	Text           *TextContent `json:"text,omitempty"`
	Attachments    []Attachment `json:"attachments,omitempty"`
}

type TextContent struct {
	Content string `json:"content"`
}

type Attachment struct {
	MsgType     string            `json:"msgtype"`
	Image       *ImageAttachment  `json:"image,omitempty"`
	Link        *LinkAttachment   `json:"link,omitempty"`
	MiniProgram *MiniProgramAttachment `json:"miniprogram,omitempty"`
	Video       *VideoAttachment  `json:"video,omitempty"`
	File        *FileAttachment   `json:"file,omitempty"`
}

type ImageAttachment struct {
	MediaID string `json:"media_id,omitempty"`
	PicURL  string `json:"pic_url,omitempty"`
}

type LinkAttachment struct {
	Title  string `json:"title"`
	PicURL string `json:"picurl,omitempty"`
	Desc   string `json:"desc,omitempty"`
	URL    string `json:"url"`
}

type MiniProgramAttachment struct {
	Title      string `json:"title"`
	PicMediaID string `json:"pic_media_id"`
	AppID      string `json:"appid"`
	Page       string `json:"page"`
}

type VideoAttachment struct {
	MediaID string `json:"media_id"`
}

type FileAttachment struct {
	MediaID string `json:"media_id"`
}

type CreateMassSendResp struct {
	ErrCode  int      `json:"errcode"`
	ErrMsg   string   `json:"errmsg"`
	FailList []string `json:"fail_list"`
	MsgID    string   `json:"msgid"`
}

type MsgIDReq struct {
	MsgID string `json:"msgid"`
}

type TaskListResp struct {
	ErrCode    int        `json:"errcode"`
	ErrMsg     string     `json:"errmsg"`
	NextCursor string     `json:"next_cursor"`
	TaskList   []TaskItem `json:"task_list"`
}

type TaskItem struct {
	UserID   string `json:"userid"`
	Status   int    `json:"status"`
	SendTime int64  `json:"send_time"`
}

type SendResultResp struct {
	ErrCode    int              `json:"errcode"`
	ErrMsg     string           `json:"errmsg"`
	NextCursor string           `json:"next_cursor"`
	SendList   []SendResultItem `json:"send_list"`
}

type SendResultItem struct {
	ExternalUserID string `json:"external_userid,omitempty"`
	ChatID         string `json:"chat_id,omitempty"`
	UserID         string `json:"userid"`
	Status         int    `json:"status"`
	SendTime       int64  `json:"send_time"`
}

type WelcomeReq struct {
	WelcomeCode string       `json:"welcome_code"`
	Text        *TextContent `json:"text,omitempty"`
	Attachments []Attachment `json:"attachments,omitempty"`
}

type TemplateResp struct {
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
	TemplateID string `json:"template_id"`
}

// ── S1: Create mass send task ──
func (m *MassSendClient) CreateMassSend(ctx context.Context, req *CreateMassSendReq) (*CreateMassSendResp, error) {
	var resp CreateMassSendResp
	err := m.client.Post(ctx, "externalcontact/add_msg_template", req, &resp)
	return &resp, err
}

// ── S2: Remind members (max 3x/24h) ──
func (m *MassSendClient) RemindSend(ctx context.Context, msgID string) error {
	var resp BaseResp
	return m.client.Post(ctx, "externalcontact/remind_groupmsg_send", &MsgIDReq{MsgID: msgID}, &resp)
}

// ── S3: Cancel mass send ──
func (m *MassSendClient) CancelSend(ctx context.Context, msgID string) error {
	var resp BaseResp
	return m.client.Post(ctx, "externalcontact/cancel_groupmsg_send", &MsgIDReq{MsgID: msgID}, &resp)
}

// ── S5: Get task list with auto-pagination ──
func (m *MassSendClient) GetTaskList(ctx context.Context, msgID string) ([]TaskItem, error) {
	var all []TaskItem
	cursor := ""
	for {
		req := map[string]interface{}{
			"msgid":  msgID,
			"limit":  1000,
			"cursor": cursor,
		}
		var resp TaskListResp
		if err := m.client.Post(ctx, "externalcontact/get_groupmsg_task", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.TaskList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// ── S6: Get send results with auto-pagination ──
func (m *MassSendClient) GetSendResults(ctx context.Context, msgID, userID string) ([]SendResultItem, error) {
	var all []SendResultItem
	cursor := ""
	for {
		req := map[string]interface{}{
			"msgid":  msgID,
			"userid": userID,
			"limit":  1000,
			"cursor": cursor,
		}
		var resp SendResultResp
		if err := m.client.Post(ctx, "externalcontact/get_groupmsg_send_result", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.SendList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// ── S7: Send welcome message (20s TTL!) ──
func (m *MassSendClient) SendWelcome(ctx context.Context, req *WelcomeReq) error {
	var resp BaseResp
	return m.client.Post(ctx, "externalcontact/send_welcome_msg", req, &resp)
}

// ── S8: Add group welcome template ──
func (m *MassSendClient) AddWelcomeTemplate(ctx context.Context, content map[string]interface{}) (string, error) {
	var resp TemplateResp
	err := m.client.Post(ctx, "externalcontact/group_welcome_template/add", content, &resp)
	return resp.TemplateID, err
}

// ── S4: List mass send records with auto-pagination ──
func (m *MassSendClient) ListRecords(ctx context.Context, chatType string, startTime, endTime int64, creator string, filterType int) ([]map[string]interface{}, error) {
	var all []map[string]interface{}
	cursor := ""
	for {
		req := map[string]interface{}{
			"chat_type":   chatType,
			"start_time":  startTime,
			"end_time":    endTime,
			"filter_type": filterType,
			"limit":       500,
			"cursor":      cursor,
		}
		if creator != "" {
			req["creator"] = creator
		}
		var resp struct {
			GroupMsgList []map[string]interface{} `json:"group_msg_list"`
			NextCursor   string                   `json:"next_cursor"`
		}
		if err := m.client.Post(ctx, "externalcontact/get_groupmsg_list_v2", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.GroupMsgList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// ── S9: Edit group welcome template ──
func (m *MassSendClient) EditWelcomeTemplate(ctx context.Context, templateID string, content map[string]interface{}) error {
	content["template_id"] = templateID
	var resp BaseResp
	return m.client.Post(ctx, "externalcontact/group_welcome_template/edit", content, &resp)
}

// ── S10: Get group welcome template (GET request!) ──
func (m *MassSendClient) GetWelcomeTemplate(ctx context.Context, templateID string) (map[string]interface{}, error) {
	var resp map[string]interface{}
	err := m.client.Get(ctx, "externalcontact/group_welcome_template/get",
		map[string]string{"template_id": templateID}, &resp)
	return resp, err
}

// ── S11: Delete group welcome template ──
func (m *MassSendClient) DelWelcomeTemplate(ctx context.Context, templateID string) error {
	var resp BaseResp
	return m.client.Post(ctx, "externalcontact/group_welcome_template/del",
		map[string]string{"template_id": templateID}, &resp)
}
```

---


### 7.1 Java 示例

```java
public class WecomCrmMasssendService {
    private final WeComClient client;

    public WecomCrmMasssendService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-masssend 相关 API
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

### 7.2 PHP 示例

```php
<?php
class WecomCrmMasssendService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-masssend 相关 API
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

## 8. Test Templates

### Test: Mass Send Lifecycle

```python
def test_mass_send_lifecycle(masssend_client):
    """Test complete mass send flow: create → query → cancel."""
    # Create
    result = masssend_client.create_mass_send(
        text_content="Test message",
        external_userid=["woXXXX1", "woXXXX2"],
        sender="zhangsan",
    )
    assert result["msgid"], "Should return msgid"
    msgid = result["msgid"]

    # Query task list
    tasks = masssend_client.get_task_list(msgid)
    assert len(tasks) > 0, "Should have at least one task"
    assert all(t["status"] in (0, 1, 2, 3) for t in tasks)

    # Cancel
    masssend_client.cancel_send(msgid)
    # Idempotent: cancel again should succeed
    masssend_client.cancel_send(msgid)
```

### Test: Welcome Message with Expired Code

```python
def test_welcome_code_expired(masssend_client):
    """welcome_code expires after 20 seconds."""
    import time
    # Simulate expired code
    try:
        masssend_client.send_welcome(
            welcome_code="EXPIRED_CODE",
            text_content="Welcome!",
        )
        assert False, "Should have raised"
    except Exception as e:
        assert "41051" in str(e) or "40001" in str(e)
```

### Test: Group Welcome Template CRUD

```python
def test_welcome_template_crud(masssend_client):
    """Test group welcome template lifecycle."""
    # Create
    tid = masssend_client.add_welcome_template({
        "text": {"content": "Welcome %NICKNAME%!"},
        "link": {
            "title": "Product Guide",
            "url": "https://example.com",
        },
    })
    assert tid, "Should return template_id"

    # Read
    tpl = masssend_client.get_welcome_template(tid)
    assert tpl.get("text", {}).get("content") == "Welcome %NICKNAME%!"

    # Update
    masssend_client.edit_welcome_template(tid, {
        "text": {"content": "Updated welcome!"},
    })

    # Delete
    masssend_client.del_welcome_template(tid)
```

### Test: Attachment Validation

```python
def test_attachment_empty_body_rejected(masssend_client):
    """Both text and attachments cannot be empty."""
    import pytest
    with pytest.raises(ValueError, match="cannot both be empty"):
        masssend_client.create_mass_send()
```

---

## 9. Code Review Checklist

| ID | Check Item | Severity |
|----|-----------|----------|
| R1 | `text` and `attachments` not both empty in S1/S7 | CRITICAL |
| R2 | `welcome_code` consumed within 20 seconds of callback | CRITICAL |
| R3 | `msgid` persisted after S1 for subsequent queries | HIGH |
| R4 | `fail_list` from S1 checked and logged | HIGH |
| R5 | S4 `chat_type` parameter is provided (required, unlike S1) | HIGH |
| R6 | `media_id` refreshed before 3-day expiry | HIGH |
| R7 | S5 not used for messages before 2020-11-17; use S6 instead | MEDIUM |
| R8 | S2 remind limited to 3 per 24 hours per msgid | MEDIUM |
| R9 | Monthly per-customer limit checked (days in month) | MEDIUM |
| R10 | S6 `external_userid`/`chat_id` mutual exclusion handled | MEDIUM |
| R11 | `%NICKNAME%` placeholder case-sensitive (not %nickname%) | LOW |
| R12 | Race condition on welcome_code handled (41051 = normal) | MEDIUM |
| R13 | S10 uses GET method (not POST) | MEDIUM |
| R14 | Group welcome templates capped at 100; handle 41055 error | LOW |
| R15 | Attachment priority rule understood (image > link > miniprogram > file > video) | LOW |

---

## 10. Gotcha Guide

### G1: 返回成功 ≠ 发送成功

`add_msg_template` (S1) returns `{errcode: 0, msgid: "..."}` only means the **task was created**, not that messages were delivered. Members must manually confirm sending in their WeCom client. You MUST poll S5/S6 to check actual delivery status.

### G2: welcome_code 20秒生命周期

The `welcome_code` from callback CB1 expires in **20 seconds**. Best practice: use message queue, process callback handler asynchronously but within the TTL. The code is single-use — if multiple apps compete, only the first caller succeeds (error `41051` for others).

### G3: chat_type Required vs Optional

- S1 `add_msg_template`: `chat_type` is **optional** (defaults to `single`)
- S4 `get_groupmsg_list_v2`: `chat_type` is **required**

Missing `chat_type` in S4 will cause an error.

### G4: 月发送上限 = 当月天数

Each customer can receive at most N group messages per month, where N = number of days in that month (e.g., January = 31, February = 28/29). When exceeded, `status=3` in send results. This is a per-customer cap across ALL members' sends.

### G5: 停止 ≠ 撤回

`cancel_groupmsg_send` (S3) only stops members who haven't yet confirmed sending. Already-sent messages **cannot be recalled**. The operation is idempotent.

### G6: external_userid 与 chat_id 互斥

In S6 `get_groupmsg_send_result`, the response contains either `external_userid` (for `chat_type=single`) or `chat_id` (for `chat_type=group`), never both. Your code must handle both shapes.

### G7: 2020-11-17 历史分界线

`get_groupmsg_task` (S5) does NOT support mass messages created before 2020-11-17. For older messages, use `get_groupmsg_send_result` (S6) directly with known member userids.

### G8: S10 是 GET 请求

`group_welcome_template/get` (S10) is the only **GET** request in this domain. `template_id` is passed as a **query parameter**, not in the request body.

### G9: 附件优先级而非报错

When multiple non-text attachment types coexist in a single request, WeCom silently picks the highest priority one (`image > link > miniprogram > file > video`) rather than returning an error. This can cause confusion if you intended to send a video but also included an image.

### G10: %NICKNAME% 大小写敏感

The placeholder `%NICKNAME%` must be **exactly uppercase**. `%nickname%` or `%Nickname%` will NOT be replaced and will appear as literal text in the message.

### G11: 入群欢迎语素材 100 个上限

Each enterprise can have at most 100 group welcome templates. Exceeding this returns error `41055`. Implement cleanup for unused templates.

---

## 11. Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 0 | Success | - |
| 40001 | Invalid access_token | Re-obtain token (2h TTL) |
| 40003 | Invalid userid | Verify userid exists and spelling |
| 41051 | Customer and member already chatting | Welcome msg only for first-add; race condition = normal |
| 41053 | Customer hasn't agreed to chat archive | Customer must accept service terms first |
| 41055 | Group welcome template limit reached (100) | Delete unused templates before creating new |
| 45009 | API rate limit exceeded | Reduce frequency; use self-service unblock tool |
| 45033 | Concurrent call limit exceeded | Check for bugs causing sustained high concurrency |
| 60020 | Insufficient permissions | Verify 客户联系 permission configuration |

---

## 12. References

| Resource | URL |
|----------|-----|
| 创建企业群发 | https://developer.work.weixin.qq.com/document/path/92135 |
| 提醒成员群发 | https://developer.work.weixin.qq.com/document/path/97610 |
| 停止企业群发 | https://developer.work.weixin.qq.com/document/path/97614 |
| 获取群发记录列表 | https://developer.work.weixin.qq.com/document/path/93338 |
| 获取群发成员发送任务列表 | https://developer.work.weixin.qq.com/document/path/93339 |
| 获取企业群发成员执行结果 | https://developer.work.weixin.qq.com/document/path/93340 |
| 发送新客户欢迎语 | https://developer.work.weixin.qq.com/document/path/92137 |
| 入群欢迎语素材管理 | https://developer.work.weixin.qq.com/document/path/92366 |
| 外部联系人回调事件 | https://developer.work.weixin.qq.com/document/path/92277 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |
| 访问频率限制 | https://developer.work.weixin.qq.com/document/path/96212 |


