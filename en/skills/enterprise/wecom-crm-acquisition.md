---
name: wecom-crm-acquisition
description: WeCom CRM Customer Acquisition Assistant SKILL — covers acquisition link CRUD (list/get/create/update/delete), customer list, usage statistics, quota management, and 9 callback events
version: 1.0.0
triggers:
  - wecom acquisition
  - wecom 获客助手
  - 获客链接
  - customer_acquisition
  - acquisition link
  - acquisition quota
  - customer_acquisition_quota
  - acquisition statistic
argument-hint: "<action> [options]"
---

# WeCom CRM Customer Acquisition Assistant SKILL

> Domain: 获客助手 (Customer Acquisition Assistant)
> API Count: 8 (A1–A8)
> Callbacks: 9 (CB1–CB9)
> Depends on: `wecom-core` (token, error handling, crypto)

---

## 1. Prerequisites

Before using this SKILL, ensure:

- [ ] **wecom-core SKILL** is loaded (provides token management, error handling)
- [ ] **Access token** obtained using one of:
  - 配置到「可调用应用」列表中的自建应用 secret → `access_token`
  - 第三方应用需授权「企业客户权限 → 获客助手」权限（需发布并由管理员确认）
- [ ] **NOT** using 「客户联系」系统应用 secret (not supported for acquisition APIs)
- [ ] Callback URL configured for acquisition events (指令回调 URL)

---

## 2. Core Concepts

### 2.1 Acquisition Link Model

```
Enterprise creates link → User clicks link in WeChat → User adds member as friend
    ↓
link_id (unique identifier)
    ├── link_name (display name)
    ├── url (https://work.weixin.qq.com/ca/xxxxx)
    ├── range (members/departments, max 500 users)
    ├── skip_verify (direct add without verification)
    └── priority_option (priority assignment, limited category support)
```

### 2.2 Key Entity Relationships

| Entity | ID | Lifecycle |
|--------|-----|-----------|
| Acquisition Link | `link_id` | Created → Updated → Deleted |
| Customer | `external_userid` | Added via link → tracked by `link_id` |
| Quota | `total` / `balance` | Purchased → Consumed → Expired |

### 2.3 Credential Restriction

| Credential Type | Supported |
|----------------|-----------|
| 自建应用 (可调用应用) secret | ✅ |
| 第三方应用 (授权获客助手) | ✅ |
| 「客户联系」系统应用 secret | ❌ **Not supported** |

### 2.4 external_userid Scoping

| App Type | external_userid Scope |
|----------|----------------------|
| 自建应用 | Same across all self-built apps in enterprise |
| 第三方/代开发应用 | Scoped to service provider; same across provider's apps but differs from enterprise's self-built apps |

Cross-app correlation requires UnionID conversion (path/97108).

### 2.5 Scheme Redirect (Optional)

For better mobile experience, convert link URL to WeChat Scheme:

```
weixin://biz/ww/profile/{urlencode(LINK_URL?customer_channel=STATE)}
```

---

## 3. API Quick Reference

| ID | API Name | Method | Path | Key Params |
|----|----------|--------|------|------------|
| A1 | 获取获客链接列表 | POST | `/cgi-bin/externalcontact/customer_acquisition/list_link` | limit, cursor |
| A2 | 获取获客链接详情 | POST | `/cgi-bin/externalcontact/customer_acquisition/get` | link_id |
| A3 | 创建获客链接 | POST | `/cgi-bin/externalcontact/customer_acquisition/create_link` | link_name, range, skip_verify |
| A4 | 编辑获客链接 | POST | `/cgi-bin/externalcontact/customer_acquisition/update_link` | link_id, link_name, range |
| A5 | 删除获客链接 | POST | `/cgi-bin/externalcontact/customer_acquisition/delete_link` | link_id |
| A6 | 获取获客客户列表 | POST | `/cgi-bin/externalcontact/customer_acquisition/customer` | link_id, cursor, limit |
| A7 | 获取获客使用统计 | POST | `/cgi-bin/externalcontact/customer_acquisition/statistic` | link_id, start_time, end_time |
| A8 | 查询额度余量 | **GET** | `/cgi-bin/externalcontact/customer_acquisition_quota` | (none) |

> Base URL: `https://qyapi.weixin.qq.com`
> **Note**: A8 path is `customer_acquisition_quota` (no `/customer_acquisition/` prefix), and it's the only **GET** request.

---

## 4. API Details

### A1: 获取获客链接列表 (customer_acquisition/list_link)

Returns all acquisition link IDs with pagination.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/list_link?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | int | No | Max number per page |
| cursor | string | No | Pagination cursor, empty for first page |

**Response**:

| Field | Type | Description |
|-------|------|-------------|
| errcode | int | 0 = success |
| errmsg | string | Error message |
| link_id_list | string[] | List of link IDs |
| next_cursor | string | Pagination cursor; empty = no more data |

> Only returns `link_id` list. Call A2 for full details.

---

### A2: 获取获客链接详情 (customer_acquisition/get)

Returns full configuration of a specific acquisition link.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/get?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| link_id | string | Yes | Acquisition link ID |

**Response**:

| Field | Type | Description |
|-------|------|-------------|
| link.link_name | string | Link name |
| link.url | string | Link URL (`https://work.weixin.qq.com/ca/xxxxx`) |
| link.create_time | int64 | Creation timestamp |
| link.skip_verify | bool | Whether friend verification is skipped |
| range.user_list | string[] | Associated member userid list |
| range.department_list | int[] | Associated department ID list |
| priority_option.priority_type | int | Priority assignment type (limited categories) |
| priority_option.priority_userid_list | string[] | Priority member userid list |

---

### A3: 创建获客链接 (customer_acquisition/create_link)

Creates a new acquisition link.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/create_link?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| link_name | string | Yes | Link name |
| range | object | Yes | Associated scope |
| range.user_list | string[] | Conditional | Member userid list (mutually required with department_list — at least one) |
| range.department_list | int[] | Conditional | Department ID list |
| skip_verify | bool | No | Skip friend verification (true = direct add) |
| priority_option | object | No | Priority assignment (limited business categories only) |
| priority_option.priority_type | int | No | Priority type |
| priority_option.priority_userid_list | string[] | No | Priority member list |

**Constraint**: `range` total users (including expanded departments) ≤ **500**.

**Response**:

| Field | Type | Description |
|-------|------|-------------|
| link.link_id | string | New link ID |
| link.link_name | string | Link name |
| link.url | string | Link URL |
| link.create_time | int64 | Creation timestamp |

---

### A4: 编辑获客链接 (customer_acquisition/update_link)

Updates an existing acquisition link's configuration.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/update_link?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| link_id | string | Yes | Link ID to update |
| link_name | string | No | New link name |
| range | object | No | New scope (**覆盖更新**, not incremental!) |
| range.user_list | string[] | Conditional | Member userid list |
| range.department_list | int[] | Conditional | Department ID list |
| skip_verify | bool | No | Skip friend verification |
| priority_option | object | No | Priority assignment (**覆盖更新**) |

> **CRITICAL**: `range` is a **full replacement** (覆盖更新). You must include ALL desired members/departments, not just the delta.

---

### A5: 删除获客链接 (customer_acquisition/delete_link)

Deletes an acquisition link permanently.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/delete_link?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| link_id | string | Yes | Link ID to delete |

> Deletion triggers `delete_link` callback (CB9). Irreversible operation.

---

### A6: 获取获客客户列表 (customer_acquisition/customer)

Returns customers added via a specific acquisition link.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/customer?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| link_id | string | Yes | Acquisition link ID |
| cursor | string | No | Pagination cursor |
| limit | int | No | Max records per page |

**Response** `customer_list[]`:

| Field | Type | Description |
|-------|------|-------------|
| external_userid | string | Customer's external contact ID |
| customer_userid | string | Member userid who added the customer |
| add_time | int64 | Time customer was added |

> To get customer details (name, avatar), call `externalcontact/get` with the `external_userid`.

---

### A7: 获取获客使用统计 (customer_acquisition/statistic)

Returns usage statistics for a specific link in a given time range.

**Request**: `POST /cgi-bin/externalcontact/customer_acquisition/statistic?access_token=ACCESS_TOKEN`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| link_id | string | Yes | Acquisition link ID |
| start_time | int64 | Yes | Start timestamp |
| end_time | int64 | Yes | End timestamp (inclusive) |

**Response**:

| Field | Type | Description |
|-------|------|-------------|
| click_link_customer_cnt | int | Unique customers who clicked the link |
| new_customer_cnt | int | New customers added via the link |

**Constraints**:
- Minimum granularity: **day** (timestamps auto-rounded to day boundaries)
- Max query range: **30 days**
- Data available for last **180 days** only

---

### A8: 查询额度余量 (customer_acquisition_quota)

Returns the enterprise's acquisition quota status.

**Request**: `GET /cgi-bin/externalcontact/customer_acquisition_quota?access_token=ACCESS_TOKEN`

> **Note**: This is a **GET** request with **no request body**. The path is `customer_acquisition_quota` (not under `/customer_acquisition/`).

**Response**:

| Field | Type | Description |
|-------|------|-------------|
| total | int | Total purchased quota (historical cumulative) |
| balance | int | Current remaining quota |
| quota_list | object[] | Per-batch quota details |
| quota_list[].expire_date | int64 | Batch expiry timestamp |
| quota_list[].balance | int | Batch remaining quota |

---

## 5. Callbacks

### CB1: open_profile — 客户打开 Profile 页

Customer clicks acquisition link and opens the member's profile page.

- `InfoType`: `customer_acquisition`
- `ChangeType`: `open_profile`
- Limited to certain business categories only

```xml
<xml>
  <SuiteId><![CDATA[ww4asffe99e54c0f4c]]></SuiteId>
  <AuthCorpId><![CDATA[wxf8b4f85f3a794e77]]></AuthCorpId>
  <InfoType><![CDATA[customer_acquisition]]></InfoType>
  <TimeStamp>1689171577</TimeStamp>
  <ChangeType><![CDATA[open_profile]]></ChangeType>
  <LinkId><![CDATA[cawcdea7783d7330c6]]></LinkId>
  <State><![CDATA[STATE]]></State>
</xml>
```

### CB2: friend_request — 客户发起好友请求

Customer sends friend request via acquisition link (State must be non-empty).

- `InfoType`: `customer_acquisition`
- `ChangeType`: `friend_request`

### CB3: customer_start_chat — 客户首次发送消息

Member receives first message from customer (State must be non-empty).

- `InfoType`: `customer_acquisition`
- `ChangeType`: `customer_start_chat`

### CB4: add_external_contact — 好友关系建立

Friend relationship established via acquisition link (State must be non-empty).

- `InfoType`: `change_external_contact` (different from CB1-CB3!)
- `ChangeType`: `add_external_contact`

### CB5: balance_increased — 使用量从零变非零

Quota transitions from 0 to non-zero (first purchase or recharge activation).

- `InfoType`: `customer_acquisition`
- `ChangeType`: `balance_increased`

### CB6: balance_low — 使用量不足预警

Remaining quota drops below **20**.

- `InfoType`: `customer_acquisition`
- `ChangeType`: `balance_low`

### CB7: balance_exhausted — 使用量耗尽

Quota fully consumed (balance reaches zero).

- `InfoType`: `customer_acquisition`
- `ChangeType`: `balance_exhausted`

### CB8: quota_expire_soon — 使用量即将过期

Quota batch approaching expiry. Pushed at **14, 7, 3, 2, 1 days** before expiry.

- `InfoType`: `customer_acquisition`
- `ChangeType`: `quota_expire_soon`
- Extra fields: `ExpireTime` (timestamp), `ExpireQuotaNum` (count)

### CB9: delete_link — 获客链接被删除

Acquisition link deleted (via API or admin console).

- `InfoType`: `customer_acquisition`
- `ChangeType`: `delete_link`

### Callback Common Notes

- WeCom retries up to **3 times** if no response within **5 seconds**
- Process callbacks asynchronously; return response immediately
- **Do NOT rely solely on callbacks** — use polling as backup
- `customer_channel` parameter must be appended to link URL to receive conversion callbacks (CB1-CB4)

---

## 6. Workflows

### Workflow A: Acquisition Link CRUD

```
Step 1: Create link
  POST /cgi-bin/externalcontact/customer_acquisition/create_link
  Body: {link_name: "...", range: {user_list: [...], department_list: [...]}, skip_verify: true}
  → Save link_id and url

Step 2: Share link URL to customers
  URL: https://work.weixin.qq.com/ca/xxxxx
  Optional: append ?customer_channel=SOURCE for callback tracking

Step 3: Update link scope (覆盖更新)
  POST /cgi-bin/externalcontact/customer_acquisition/update_link
  Body: {link_id: "...", range: {user_list: [FULL_LIST]}}
  ⚠️ Must include ALL members, not just additions

Step 4: Delete when no longer needed
  POST /cgi-bin/externalcontact/customer_acquisition/delete_link
  Body: {link_id: "..."}
```

### Workflow B: Customer Analytics Pipeline

```
Step 1: List all links
  POST /cgi-bin/externalcontact/customer_acquisition/list_link
  → Paginate to get all link_ids

Step 2: For each link, get customer list
  POST /cgi-bin/externalcontact/customer_acquisition/customer
  Body: {link_id: "...", limit: 100}
  → Paginate to get all customers

Step 3: Get link statistics
  POST /cgi-bin/externalcontact/customer_acquisition/statistic
  Body: {link_id: "...", start_time: ..., end_time: ...}
  → Get click and conversion counts (max 30-day range)

Step 4: Monitor quota
  GET /cgi-bin/externalcontact/customer_acquisition_quota
  → Check balance, handle expiring batches
```

### Workflow C: Quota Monitoring with Callbacks

```
Step 1: Register callback URL for acquisition events
  Configure in admin console → 指令回调 URL

Step 2: Handle quota callbacks
  CB6 (balance_low): Alert when balance < 20
  CB7 (balance_exhausted): Stop creating new links
  CB8 (quota_expire_soon): Plan renewal/purchase

Step 3: Periodic quota check (backup)
  GET /cgi-bin/externalcontact/customer_acquisition_quota
  → Cross-verify with callback data
```

---

## 7. Code Templates

### Python

```python
"""WeCom CRM Customer Acquisition Assistant"""
import httpx


class WeComAcquisition:
    """Customer acquisition link management client."""

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

    def _get(self, path: str) -> dict:
        resp = self._client.get(self._url(path))
        data = resp.json()
        if data.get("errcode", 0) != 0:
            raise Exception(f"WeCom API error: {data}")
        return data

    # ── A1: List acquisition links ──
    def list_links(self) -> list[str]:
        """Get all acquisition link IDs with auto-pagination."""
        all_ids = []
        cursor = ""
        while True:
            body = {"cursor": cursor}
            data = self._post("customer_acquisition/list_link", body)
            all_ids.extend(data.get("link_id_list", []))
            cursor = data.get("next_cursor", "")
            if not cursor:
                break
        return all_ids

    # ── A2: Get link details ──
    def get_link(self, link_id: str) -> dict:
        """Get full configuration of an acquisition link."""
        return self._post("customer_acquisition/get", {"link_id": link_id})

    # ── A3: Create link ──
    def create_link(
        self,
        link_name: str,
        user_list: list[str] = None,
        department_list: list[int] = None,
        skip_verify: bool = False,
    ) -> dict:
        """Create acquisition link. Returns {link_id, url, ...}.

        Range total users (including dept expansion) must be ≤ 500.
        """
        if not user_list and not department_list:
            raise ValueError("user_list and department_list cannot both be empty")

        body: dict = {
            "link_name": link_name,
            "range": {},
            "skip_verify": skip_verify,
        }
        if user_list:
            body["range"]["user_list"] = user_list
        if department_list:
            body["range"]["department_list"] = department_list

        return self._post("customer_acquisition/create_link", body)

    # ── A4: Update link (覆盖更新!) ──
    def update_link(
        self,
        link_id: str,
        link_name: str = None,
        user_list: list[str] = None,
        department_list: list[int] = None,
        skip_verify: bool = None,
    ) -> dict:
        """Update acquisition link. range is FULL REPLACEMENT (覆盖更新).

        ⚠️ You must pass the COMPLETE desired user/department list,
        not just additions/removals.
        """
        body: dict = {"link_id": link_id}
        if link_name is not None:
            body["link_name"] = link_name
        if user_list is not None or department_list is not None:
            body["range"] = {}
            if user_list is not None:
                body["range"]["user_list"] = user_list
            if department_list is not None:
                body["range"]["department_list"] = department_list
        if skip_verify is not None:
            body["skip_verify"] = skip_verify
        return self._post("customer_acquisition/update_link", body)

    # ── A5: Delete link ──
    def delete_link(self, link_id: str) -> dict:
        """Delete acquisition link. Irreversible."""
        return self._post("customer_acquisition/delete_link", {"link_id": link_id})

    # ── A6: Get customers from link ──
    def get_customers(self, link_id: str) -> list[dict]:
        """Get all customers added via a specific link, with auto-pagination."""
        all_customers = []
        cursor = ""
        while True:
            body = {"link_id": link_id, "cursor": cursor, "limit": 100}
            data = self._post("customer_acquisition/customer", body)
            all_customers.extend(data.get("customer_list", []))
            cursor = data.get("next_cursor", "")
            if not cursor:
                break
        return all_customers

    # ── A7: Get usage statistics ──
    def get_statistic(
        self, link_id: str, start_time: int, end_time: int
    ) -> dict:
        """Get link usage statistics.

        Constraints: max 30-day range, last 180 days only.
        """
        return self._post(
            "customer_acquisition/statistic",
            {"link_id": link_id, "start_time": start_time, "end_time": end_time},
        )

    # ── A8: Query quota (GET request, different path!) ──
    def get_quota(self) -> dict:
        """Get acquisition quota status. Uses GET, different path!"""
        return self._get("customer_acquisition_quota")


# ── Callback handler ──
def handle_acquisition_callback(xml_data: dict):
    """Process acquisition-related callback events.

    Event routing by ChangeType:
      open_profile → customer opened profile page
      friend_request → customer sent friend request
      customer_start_chat → customer sent first message
      add_external_contact → friend relationship established
      balance_increased → quota activated
      balance_low → quota < 20 warning
      balance_exhausted → quota depleted
      quota_expire_soon → quota expiring (14/7/3/2/1 days)
      delete_link → link deleted
    """
    info_type = xml_data.get("InfoType", "")
    change_type = xml_data.get("ChangeType", "")
    link_id = xml_data.get("LinkId", "")
    state = xml_data.get("State", "")

    if change_type == "balance_low":
        print("WARNING: Acquisition quota below 20!")
    elif change_type == "balance_exhausted":
        print("CRITICAL: Acquisition quota depleted!")
    elif change_type == "quota_expire_soon":
        expire_time = xml_data.get("ExpireTime")
        expire_num = xml_data.get("ExpireQuotaNum")
        print(f"Quota expiring: {expire_num} units at {expire_time}")
    elif change_type == "add_external_contact":
        # Note: InfoType is 'change_external_contact', not 'customer_acquisition'
        print(f"New customer added via link {link_id}, state={state}")
    elif change_type == "delete_link":
        print(f"Link {link_id} was deleted")
```

### TypeScript

```typescript
/**
 * WeCom CRM Customer Acquisition Assistant
 */

interface AcquisitionLink {
  link_id: string;
  link_name: string;
  url: string;
  create_time: number;
  skip_verify?: boolean;
}

interface LinkRange {
  user_list?: string[];
  department_list?: number[];
}

interface CustomerItem {
  external_userid: string;
  customer_userid: string;
  add_time: number;
}

interface QuotaBatch {
  expire_date: number;
  balance: number;
}

interface QuotaInfo {
  total: number;
  balance: number;
  quota_list: QuotaBatch[];
}

interface LinkStatistic {
  click_link_customer_cnt: number;
  new_customer_cnt: number;
}

class WeComAcquisition {
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

  private async get<T>(path: string): Promise<T> {
    const resp = await fetch(await this.url(path));
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(`WeCom error: ${JSON.stringify(data)}`);
    return data as T;
  }

  // A1: List all link IDs with auto-pagination
  async listLinks(): Promise<string[]> {
    const all: string[] = [];
    let cursor = '';
    do {
      const data = await this.post<{
        link_id_list: string[];
        next_cursor: string;
      }>('customer_acquisition/list_link', { cursor });
      all.push(...(data.link_id_list ?? []));
      cursor = data.next_cursor ?? '';
    } while (cursor);
    return all;
  }

  // A2: Get link details
  async getLink(linkId: string): Promise<{ link: AcquisitionLink; range: LinkRange }> {
    return this.post('customer_acquisition/get', { link_id: linkId });
  }

  // A3: Create link
  async createLink(opts: {
    linkName: string;
    range: LinkRange;
    skipVerify?: boolean;
  }): Promise<{ link: AcquisitionLink }> {
    return this.post('customer_acquisition/create_link', {
      link_name: opts.linkName,
      range: opts.range,
      skip_verify: opts.skipVerify ?? false,
    });
  }

  // A4: Update link (覆盖更新!)
  async updateLink(opts: {
    linkId: string;
    linkName?: string;
    range?: LinkRange;
    skipVerify?: boolean;
  }): Promise<void> {
    const body: Record<string, unknown> = { link_id: opts.linkId };
    if (opts.linkName !== undefined) body.link_name = opts.linkName;
    if (opts.range !== undefined) body.range = opts.range;
    if (opts.skipVerify !== undefined) body.skip_verify = opts.skipVerify;
    await this.post('customer_acquisition/update_link', body);
  }

  // A5: Delete link (irreversible)
  async deleteLink(linkId: string): Promise<void> {
    await this.post('customer_acquisition/delete_link', { link_id: linkId });
  }

  // A6: Get customers with auto-pagination
  async getCustomers(linkId: string): Promise<CustomerItem[]> {
    const all: CustomerItem[] = [];
    let cursor = '';
    do {
      const data = await this.post<{
        customer_list: CustomerItem[];
        next_cursor: string;
      }>('customer_acquisition/customer', { link_id: linkId, cursor, limit: 100 });
      all.push(...(data.customer_list ?? []));
      cursor = data.next_cursor ?? '';
    } while (cursor);
    return all;
  }

  // A7: Get usage statistics (max 30-day range, last 180 days)
  async getStatistic(linkId: string, startTime: number, endTime: number): Promise<LinkStatistic> {
    return this.post('customer_acquisition/statistic', {
      link_id: linkId,
      start_time: startTime,
      end_time: endTime,
    });
  }

  // A8: Get quota (GET request, different path!)
  async getQuota(): Promise<QuotaInfo> {
    return this.get('customer_acquisition_quota');
  }
}
```

### Go

```go
package wecom

import (
	"context"
)

// AcquisitionClient manages customer acquisition links and quota.
type AcquisitionClient struct {
	client *Client // wecom-core base client
}

// ── Request/Response types ──

type CreateLinkReq struct {
	LinkName       string          `json:"link_name"`
	Range          *LinkRange      `json:"range"`
	SkipVerify     bool            `json:"skip_verify,omitempty"`
	PriorityOption *PriorityOption `json:"priority_option,omitempty"`
}

type LinkRange struct {
	UserList       []string `json:"user_list,omitempty"`
	DepartmentList []int    `json:"department_list,omitempty"`
}

type PriorityOption struct {
	PriorityType       int      `json:"priority_type,omitempty"`
	PriorityUserIDList []string `json:"priority_userid_list,omitempty"`
}

type CreateLinkResp struct {
	ErrCode int             `json:"errcode"`
	ErrMsg  string          `json:"errmsg"`
	Link    AcquisitionLink `json:"link"`
}

type AcquisitionLink struct {
	LinkID     string `json:"link_id"`
	LinkName   string `json:"link_name"`
	URL        string `json:"url"`
	CreateTime int64  `json:"create_time"`
	SkipVerify bool   `json:"skip_verify"`
}

type ListLinkResp struct {
	ErrCode    int      `json:"errcode"`
	ErrMsg     string   `json:"errmsg"`
	LinkIDList []string `json:"link_id_list"`
	NextCursor string   `json:"next_cursor"`
}

type CustomerListResp struct {
	ErrCode      int            `json:"errcode"`
	ErrMsg       string         `json:"errmsg"`
	CustomerList []CustomerItem `json:"customer_list"`
	NextCursor   string         `json:"next_cursor"`
}

type CustomerItem struct {
	ExternalUserID string `json:"external_userid"`
	CustomerUserID string `json:"customer_userid"`
	AddTime        int64  `json:"add_time"`
}

type StatisticResp struct {
	ErrCode              int    `json:"errcode"`
	ErrMsg               string `json:"errmsg"`
	ClickLinkCustomerCnt int    `json:"click_link_customer_cnt"`
	NewCustomerCnt       int    `json:"new_customer_cnt"`
}

type QuotaResp struct {
	ErrCode   int          `json:"errcode"`
	ErrMsg    string       `json:"errmsg"`
	Total     int          `json:"total"`
	Balance   int          `json:"balance"`
	QuotaList []QuotaBatch `json:"quota_list"`
}

type QuotaBatch struct {
	ExpireDate int64 `json:"expire_date"`
	Balance    int   `json:"balance"`
}

// BaseResp for simple ok/error responses (provided by wecom-core; defined here for completeness)
type BaseResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// ── A1: List all link IDs ──
func (a *AcquisitionClient) ListLinks(ctx context.Context) ([]string, error) {
	var all []string
	cursor := ""
	for {
		req := map[string]interface{}{"cursor": cursor}
		var resp ListLinkResp
		if err := a.client.Post(ctx, "externalcontact/customer_acquisition/list_link", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.LinkIDList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// ── A2: Get link details ──
func (a *AcquisitionClient) GetLink(ctx context.Context, linkID string) (*GetLinkResp, error) {
	var resp GetLinkResp
	err := a.client.Post(ctx, "externalcontact/customer_acquisition/get",
		map[string]string{"link_id": linkID}, &resp)
	return &resp, err
}

type GetLinkResp struct {
	ErrCode        int              `json:"errcode"`
	ErrMsg         string           `json:"errmsg"`
	Link           AcquisitionLink  `json:"link"`
	Range          LinkRange        `json:"range"`
	PriorityOption *PriorityOption  `json:"priority_option,omitempty"`
}

// ── A3: Create link ──
func (a *AcquisitionClient) CreateLink(ctx context.Context, req *CreateLinkReq) (*CreateLinkResp, error) {
	var resp CreateLinkResp
	err := a.client.Post(ctx, "externalcontact/customer_acquisition/create_link", req, &resp)
	return &resp, err
}

// ── A4: Update link (覆盖更新!) ──
func (a *AcquisitionClient) UpdateLink(ctx context.Context, linkID string, updates map[string]interface{}) error {
	updates["link_id"] = linkID
	var resp BaseResp
	return a.client.Post(ctx, "externalcontact/customer_acquisition/update_link", updates, &resp)
}

// ── A5: Delete link ──
func (a *AcquisitionClient) DeleteLink(ctx context.Context, linkID string) error {
	var resp BaseResp
	return a.client.Post(ctx, "externalcontact/customer_acquisition/delete_link",
		map[string]string{"link_id": linkID}, &resp)
}

// ── A6: Get customers with auto-pagination ──
func (a *AcquisitionClient) GetCustomers(ctx context.Context, linkID string) ([]CustomerItem, error) {
	var all []CustomerItem
	cursor := ""
	for {
		req := map[string]interface{}{
			"link_id": linkID,
			"cursor":  cursor,
			"limit":   100,
		}
		var resp CustomerListResp
		if err := a.client.Post(ctx, "externalcontact/customer_acquisition/customer", req, &resp); err != nil {
			return nil, err
		}
		all = append(all, resp.CustomerList...)
		if resp.NextCursor == "" {
			break
		}
		cursor = resp.NextCursor
	}
	return all, nil
}

// ── A7: Get usage statistics ──
func (a *AcquisitionClient) GetStatistic(ctx context.Context, linkID string, startTime, endTime int64) (*StatisticResp, error) {
	req := map[string]interface{}{
		"link_id":    linkID,
		"start_time": startTime,
		"end_time":   endTime,
	}
	var resp StatisticResp
	err := a.client.Post(ctx, "externalcontact/customer_acquisition/statistic", req, &resp)
	return &resp, err
}

// ── A8: Get quota (GET, different path!) ──
func (a *AcquisitionClient) GetQuota(ctx context.Context) (*QuotaResp, error) {
	var resp QuotaResp
	err := a.client.Get(ctx, "externalcontact/customer_acquisition_quota", &resp)
	return &resp, err
}
```

---


### 7.1 Java 示例

```java
public class WecomCrmAcquisitionService {
    private final WeComClient client;

    public WecomCrmAcquisitionService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-crm-acquisition 相关 API
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
class WecomCrmAcquisitionService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-crm-acquisition 相关 API
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

### Test: Acquisition Link CRUD

```python
def test_acquisition_link_crud(acq_client):
    """Test complete link lifecycle: create → get → update → delete."""
    # Create
    result = acq_client.create_link(
        link_name="Test Link",
        user_list=["zhangsan", "lisi"],
        skip_verify=True,
    )
    link_id = result["link"]["link_id"]
    assert link_id, "Should return link_id"
    assert result["link"]["url"].startswith("https://work.weixin.qq.com/ca/")

    # Get details
    detail = acq_client.get_link(link_id)
    assert detail["link"]["link_name"] == "Test Link"
    assert detail["range"]["user_list"] == ["zhangsan", "lisi"]

    # Update (覆盖更新 — must include full list!)
    acq_client.update_link(
        link_id=link_id,
        link_name="Updated Link",
        user_list=["zhangsan", "lisi", "wangwu"],  # Full list, not just "wangwu"
    )

    # Verify update
    detail2 = acq_client.get_link(link_id)
    assert detail2["link"]["link_name"] == "Updated Link"

    # Delete
    acq_client.delete_link(link_id)
```

### Test: Customer Pagination

```python
def test_customer_pagination(acq_client, link_id_with_customers):
    """Test auto-pagination for customer list."""
    customers = acq_client.get_customers(link_id_with_customers)
    assert isinstance(customers, list)
    for c in customers:
        assert "external_userid" in c
        assert "customer_userid" in c
        assert "add_time" in c
```

### Test: Statistics Time Range

```python
def test_statistic_time_range_limit(acq_client, link_id):
    """Statistics query must be ≤ 30 days."""
    import time
    now = int(time.time())
    thirty_one_days = 31 * 86400

    try:
        acq_client.get_statistic(link_id, now - thirty_one_days, now)
        # May return error for > 30 day range
    except Exception as e:
        assert "40058" in str(e) or "parameter" in str(e).lower()
```

### Test: Quota GET Method

```python
def test_quota_uses_get(acq_client):
    """A8 quota endpoint uses GET, not POST."""
    quota = acq_client.get_quota()
    assert "total" in quota
    assert "balance" in quota
    assert quota["balance"] <= quota["total"]
    if quota.get("quota_list"):
        for batch in quota["quota_list"]:
            assert "expire_date" in batch
            assert "balance" in batch
```

---

## 9. Code Review Checklist

| ID | Check Item | Severity |
|----|-----------|----------|
| R1 | `range` update uses full replacement (覆盖更新), not incremental | CRITICAL |
| R2 | `range` total users ≤ 500 (including department expansion) | CRITICAL |
| R3 | A8 uses **GET** method, not POST; path is `customer_acquisition_quota` | HIGH |
| R4 | `user_list` and `department_list` not both empty in range | HIGH |
| R5 | Statistics query range ≤ 30 days, data available ≤ 180 days | HIGH |
| R6 | `customer_channel` appended to link URL for conversion callbacks | HIGH |
| R7 | CB4 `InfoType` is `change_external_contact` (not `customer_acquisition`) | MEDIUM |
| R8 | `external_userid` scoping differs between self-built and third-party apps | MEDIUM |
| R9 | `skip_verify=true` doesn't immediately establish friend relationship | MEDIUM |
| R10 | Quota `expire_date` per-batch tracked for proactive renewal | MEDIUM |
| R11 | `priority_option` only works for specific business categories | LOW |
| R12 | Callback 5s timeout with 3 retries — respond immediately | LOW |
| R13 | Don't rely solely on callbacks; implement polling backup | LOW |

---

## 10. Gotcha Guide

### G1: Range 覆盖更新 (Full Replacement)

The `range` field in `update_link` (A4) is a **full replacement**, not incremental. If you want to add one member to a link that already has 10, you must pass all 11 members. Passing only the new member will remove the existing 10.

```python
# WRONG — removes existing members!
acq_client.update_link(link_id=lid, user_list=["new_member"])

# CORRECT — include all desired members
existing = acq_client.get_link(lid)
all_users = existing["range"]["user_list"] + ["new_member"]
acq_client.update_link(link_id=lid, user_list=all_users)
```

### G2: A8 路径与方法特殊

The quota endpoint (A8) differs from all other acquisition APIs:
- Path: `customer_acquisition_quota` (not under `/customer_acquisition/`)
- Method: **GET** (not POST)
- No request body

### G3: customer_channel 参数必须

To receive acquisition conversion callbacks (CB1-CB4), you must append `customer_channel=<value>` to the link URL when sharing:

```
https://work.weixin.qq.com/ca/xxxxx?customer_channel=wechat_ad_campaign
```

Without this parameter, WeCom cannot correlate the conversion data and callbacks will NOT fire.

### G4: CB4 InfoType 不同于其他回调

Most acquisition callbacks use `InfoType=customer_acquisition`, but CB4 (`add_external_contact`) uses `InfoType=change_external_contact`. Your callback router must handle both InfoType values.

### G5: 500 人范围上限

Each acquisition link's `range` can cover at most **500 users** (after department expansion). Exceeding this returns error `40058`. For large teams, create multiple links or use targeted department lists.

### G6: skip_verify 与 84061 错误

When `skip_verify=true`, the customer can add the member directly, but the full friend relationship isn't established until the member accepts. During this interim period, calling APIs that require an established relationship may return error `84061`.

### G7: external_userid 跨应用差异

- Self-built apps: same `external_userid` across all apps in the enterprise
- Third-party apps: scoped to the service provider; use UnionID conversion (path/97108) for cross-app correlation

### G8: 统计接口两个版本

Both `path/97396` (enterprise) and `path/99483` (service provider) use the same API endpoint but return different data scopes. Ensure you're using the correct access_token for your use case.

---

## 11. Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 0 | Success | - |
| 40058 | Invalid parameter | Check JSON format, range ≤ 500 users, time range ≤ 30 days, GET vs POST method |
| 48002 | No permission | Verify 获客助手 permission is granted, app is published and authorized |
| 84061 | No external contact relationship | Check if friend relationship is fully established (skip_verify timing issue) |

---

## 12. References

| Resource | URL |
|----------|-----|
| 获客助手概述 | https://developer.work.weixin.qq.com/document/path/99482 |
| 获客链接管理 | https://developer.work.weixin.qq.com/document/path/97297 |
| 获取链接详情 | https://developer.work.weixin.qq.com/document/path/97394 |
| 获取获客客户信息 | https://developer.work.weixin.qq.com/document/path/97298 |
| 获客使用统计 (企业版) | https://developer.work.weixin.qq.com/document/path/97396 |
| 获客额度查询 | https://developer.work.weixin.qq.com/document/path/97400 |
| 获客使用详情 (服务商版) | https://developer.work.weixin.qq.com/document/path/99483 |
| 获客事件通知 (第三方) | https://developer.work.weixin.qq.com/document/path/99485 |
| 获客事件通知 (早期版) | https://developer.work.weixin.qq.com/document/path/97402 |
| UnionID 与 external_userid | https://developer.work.weixin.qq.com/document/path/97108 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/96213 |
| 访问频率限制 | https://developer.work.weixin.qq.com/document/path/90312 |


