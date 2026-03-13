---
name: wecom-contact
description: |
  企业微信通讯录管理 SKILL。成员管理、部门管理、标签管理、异步导入导出、通讯录回调事件。
  TRIGGER: 当用户提到成员、部门、标签、通讯录、组织架构、userid、员工管理等相关开发时触发。
  依赖 wecom-core 基座 SKILL。
---

# 企业微信 - 通讯录管理 (wecom-contact)

你现在是企业微信通讯录管理专家。基于本 SKILL 的知识，帮助开发者正确地管理企业组织架构。

---

## 1. 前置条件

- **依赖**: wecom-core（认证体系、代码生成规范、测试规范、审核规范）
- **所需权限**: 通讯录同步 secret（管理后台 → 管理工具 → 通讯录同步 → 开启 API 接口同步）
- **适用场景**: 需要增删改查企业成员、部门、标签，或从其他系统同步通讯录到企业微信

### 权限说明

| 应用类型 | 读取权限 | 写入权限 | 备注 |
|---------|---------|---------|------|
| 通讯录同步助手 | 全部字段 | 全部操作 | 使用通讯录同步 secret |
| 自建应用 | 可见范围内（敏感字段受限） | 无 | 敏感字段需 oauth2 授权 |
| 第三方通讯录应用 | 可见范围内 | 有 | 需企业授权 |
| 代开发应用 | 管理员授权后 | 无 | 敏感字段需管理员+成员双重授权 |

### 敏感字段说明（2022年6月20日起）

自2022年6月20日起，新创建的自建应用与代开发应用调用读取成员接口时，**不再返回**以下字段：
- 头像(avatar)、性别(gender)、手机(mobile)、邮箱(email)、企业邮箱(biz_mail)、员工二维码(qr_code)、地址(address)

获取方式：通过 **oauth2 手工授权** 获取管理员与员工本人授权的字段。

---

## 2. 核心概念

- **userid**: 成员唯一标识，对应管理端账号。1~64 字节，由数字、字母和 `_-@.` 组成，首字符须为数字或字母，不区分大小写。
- **department id**: 部门唯一标识，32 位整型。根部门 id 固定为 **1**。部门最大 **15** 层，总数不超 **3 万**。
- **tagid**: 标签 id，整型。标签用于给成员打分组标记。
- **open_userid**: 全局唯一的成员标识，同一服务商下不同应用获取的值相同。仅第三方应用可获取。
- **status**: 成员激活状态 — 1=已激活, 2=已禁用, 4=未激活, 5=退出企业。

---

## 3. API 速查表

### 3.1 成员管理

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 创建成员 | POST | /user/create | userid(必填), name(必填) | 否 |
| 读取成员 | GET | /user/get | userid(必填) | 是 |
| 更新成员 | POST | /user/update | userid(必填) | 是 |
| 删除成员 | GET | /user/delete | userid(必填) | 是 |
| 批量删除成员 | POST | /user/batchdelete | useridlist(必填) | 是 |
| 获取部门成员 | GET | /user/simplelist | department_id(必填) | 是 |
| 获取部门成员详情 | GET | /user/list | department_id(必填) | 是 |
| userid→openid | POST | /user/convert_to_openid | userid(必填) | 是 |
| openid→userid | POST | /user/convert_to_userid | openid(必填) | 是 |
| 邀请成员 | POST | /batch/invite | user/party/tag | 否 |
| 获取加入企业二维码 | GET | /corp/get_join_qrcode | size_type | 是 |
| 手机号获取userid | POST | /user/getuserid | mobile(必填) | 是 |
| 邮箱获取userid | POST | /user/get_userid_by_email | email(必填) | 是 |
| 获取成员ID列表 | POST | /user/list_id | cursor, limit | 是 |

### 3.2 部门管理

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 创建部门 | POST | /department/create | name(必填), parentid(必填) | 否 |
| 更新部门 | POST | /department/update | id(必填) | 是 |
| 删除部门 | GET | /department/delete | id(必填) | 是 |
| 获取部门列表 | GET | /department/list | id(可选) | 是 |
| 获取子部门ID列表 | GET | /department/simplelist | id(可选) | 是 |
| 获取单个部门详情 | GET | /department/get | id(必填) | 是 |

### 3.3 标签管理

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 创建标签 | POST | /tag/create | tagname(必填) | 否 |
| 更新标签名 | POST | /tag/update | tagid(必填), tagname(必填) | 是 |
| 删除标签 | GET | /tag/delete | tagid(必填) | 是 |
| 获取标签成员 | GET | /tag/get | tagid(必填) | 是 |
| 增加标签成员 | POST | /tag/addtagusers | tagid(必填) + userlist/partylist | 否 |
| 删除标签成员 | POST | /tag/deltagusers | tagid(必填) + userlist/partylist | 是 |
| 获取标签列表 | GET | /tag/list | 无 | 是 |

### 3.4 异步导入

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 增量更新成员 | POST | /batch/syncuser | media_id(必填), callback | 否 |
| 全量覆盖成员 | POST | /batch/replaceuser | media_id(必填), callback | 否 |
| 全量覆盖部门 | POST | /batch/replaceparty | media_id(必填), callback | 否 |
| 获取异步任务结果 | GET | /batch/getresult | jobid(必填) | 是 |

### 3.5 异步导出

| 操作 | 方法 | 端点路径 | 关键参数 | 幂等 |
|------|------|----------|----------|------|
| 导出成员 | POST | /export/simple_user | encoding_aeskey, block_size | 否 |
| 导出成员详情 | POST | /export/user | encoding_aeskey, block_size | 否 |
| 导出部门 | POST | /export/department | encoding_aeskey, block_size | 否 |
| 导出标签成员 | POST | /export/taguser | tagid, encoding_aeskey | 否 |
| 获取导出结果 | GET | /export/get_result | jobid(必填) | 是 |

---

## 4. API 详细说明

### 4.1 创建成员

- **接口**: POST https://qyapi.weixin.qq.com/cgi-bin/user/create?access_token=ACCESS_TOKEN
- **权限**: 仅通讯录同步助手或第三方通讯录应用
- **频率限制**: 通讯录写入 300次/分钟
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| access_token | string | 是 | 调用凭证 (query) |
| userid | string | 是 | 成员 UserID，1~64 字节，由数字、字母和 `_-@.` 组成，首字符须为数字或字母 |
| name | string | 是 | 成员名称，1~64 个 utf8 字符 |
| alias | string | 否 | 别名，1~64 个 utf8 字符 |
| mobile | string | 否 | 手机号，企业内唯一。mobile/email 二者不能同时为空 |
| department | int[] | 否 | 所属部门 id 列表，不超过 100 个 |
| order | int[] | 否 | 部门内排序值，个数须与 department 一致 |
| position | string | 否 | 职务，0~128 字符 |
| gender | string | 否 | 性别。1=男, 2=女 |
| email | string | 否 | 邮箱，6~64 字节，企业内唯一 |
| biz_mail | string | 否 | 企业邮箱，6~64 字节 |
| is_leader_in_dept | int[] | 否 | 是否部门负责人，个数须与 department 一致。1=是, 0=否 |
| direct_leader | string[] | 否 | 直属上级 UserID，最多 1 个 |
| enable | int | 否 | 1=启用, 0=禁用 |
| avatar_mediaid | string | 否 | 头像 mediaid（通过素材管理上传获得） |
| telephone | string | 否 | 座机，32 字节以内 |
| address | string | 否 | 地址，最大 128 字符 |
| main_department | int | 否 | 主部门 |
| nickname | string | 否 | 视频号名称（须从企业绑定到企业微信的视频号中选择） |
| to_invite | bool | 否 | 是否邀请使用企业微信，默认 true |
| extattr | object | 否 | 扩展属性（需先在管理端添加） |
| external_position | string | 否 | 对外职务，最多 12 个汉字 |
| external_profile | object | 否 | 对外属性 |

- **响应**:
```json
{
  "errcode": 0,
  "errmsg": "created",
  "created_department_list": {
    "department_info": [{"name": "xxxx", "id": 123}]
  }
}
```
- **注意事项**:
  - 每个部门下的部门+成员总数不能超过 3 万
  - 建议创建部门和创建成员串行化处理
  - department 填不存在的部门时会自动新建
  - mobile/email 至少填一个
- **幂等性**: 否（重复 userid 会报错 60104）

### 4.2 读取成员

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=ACCESS_TOKEN&userid=USERID
- **权限**: 应用须拥有指定成员的查看权限
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| access_token | string | 是 | 调用凭证 (query) |
| userid | string | 是 | 成员 UserID |

- **响应**:
```json
{
  "errcode": 0, "errmsg": "ok",
  "userid": "zhangsan", "name": "张三",
  "department": [1, 2], "order": [1, 2],
  "position": "后台工程师", "mobile": "13800000000",
  "gender": "1", "email": "zhangsan@qq.com",
  "biz_mail": "zhangsan@tencent.com",
  "is_leader_in_dept": [1, 0], "direct_leader": ["lisi"],
  "avatar": "http://wx.qlogo.cn/...",
  "telephone": "020-123456", "alias": "jackzhang",
  "status": 1, "qr_code": "https://open.work.weixin.qq.com/...",
  "main_department": 1, "open_userid": "xxxxxx",
  "extattr": {"attrs": [...]},
  "external_profile": {...}
}
```
- **注意事项**:
  - 2022年6月20日起新建应用不返回敏感字段（头像/性别/手机/邮箱/企业邮箱/二维码/地址）
  - 第三方应用返回 open_userid 代替 userid
  - 成员授权模式下 department 固定返回 [1]
- **幂等性**: 是

### 4.3 更新成员

- **接口**: POST https://qyapi.weixin.qq.com/cgi-bin/user/update?access_token=ACCESS_TOKEN
- **权限**: 仅通讯录同步助手或第三方通讯录应用
- **请求参数**: 同创建成员（除 userid 外全部可选）。额外参数:
  - `new_userid`: 新 userid（仅系统自动生成的 userid 允许修改一次）
  - `biz_mail_alias`: 企业邮箱别名，最多 5 个，更新时为覆盖式更新
- **注意事项**:
  - 系统生成的 userid 仅允许修改一次
  - 系统默认分配的企业邮箱仅允许修改一次
  - biz_mail_alias 与其他字段不具备原子性
  - 已激活成员的手机号需成员自行修改（参数被忽略但不报错）
- **幂等性**: 是

### 4.4 删除成员

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/user/delete?access_token=ACCESS_TOKEN&userid=USERID
- **权限**: 仅通讯录同步助手或第三方通讯录应用
- **注意**: 若绑定了腾讯企业邮，会同时删除邮箱账号
- **幂等性**: 是

### 4.5 批量删除成员

- **接口**: POST https://qyapi.weixin.qq.com/cgi-bin/user/batchdelete?access_token=ACCESS_TOKEN
- **请求参数**:
```json
{ "useridlist": ["zhangsan", "lisi"] }
```
- **注意**: useridlist 最多 200 个
- **幂等性**: 是

### 4.6 获取部门成员

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/user/simplelist?access_token=ACCESS_TOKEN&department_id=DEPARTMENT_ID
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| department_id | int | 是 | 部门 id |

- **响应**: 返回 `userlist` 数组，每项含 `userid`, `name`, `department`, `open_userid`
- **注意**: 仅返回该部门**直属成员**，不含子部门成员。如需获取子部门成员，须先调用 /department/simplelist 获取子部门 ID，再逐个调用本接口递归获取。
- **幂等性**: 是

### 4.7 获取部门成员详情

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/user/list?access_token=ACCESS_TOKEN&department_id=DEPARTMENT_ID
- **响应**: 同读取成员，但返回 `userlist` 数组（仅直属成员）
- **注意**:
  - 仅返回该部门直属成员，递归获取方式同 4.6
  - 2022年8月15日起通讯录同步新增IP不能再调用此接口，改用「获取成员ID列表」
- **幂等性**: 是

### 4.8 userid 与 openid 互换

- **userid→openid**: POST /user/convert_to_openid
```json
{ "userid": "zhangsan" }
```
响应: `{ "errcode": 0, "errmsg": "ok", "openid": "oDjGHs-1yCnGrRovBj2yHaj5JL6E" }`

- **openid→userid**: POST /user/convert_to_userid
```json
{ "openid": "oDjGHs-1yCnGrRovBj2yHaj5JL6E" }
```
响应: `{ "errcode": 0, "errmsg": "ok", "userid": "zhangsan" }`

- **注意**: 该 openid 用于在企业微信与微信之间建立成员映射关系

### 4.9 手机号/邮箱获取 userid

- **手机号→userid**: POST /user/getuserid
```json
{ "mobile": "13800000000" }
```

- **邮箱→userid**: POST /user/get_userid_by_email
```json
{ "email": "test@qq.com", "email_type": 1 }
```
  - email_type: 1=企业邮箱(默认), 2=个人邮箱

### 4.10 获取成员ID列表

- **接口**: POST https://qyapi.weixin.qq.com/cgi-bin/user/list_id?access_token=ACCESS_TOKEN
- **请求参数**:
```json
{ "cursor": "", "limit": 10000 }
```
- **响应**:
```json
{
  "errcode": 0, "errmsg": "ok",
  "next_cursor": "xxxx",
  "dept_user": [
    {"userid": "zhangsan", "department": 1},
    {"userid": "lisi", "department": 2}
  ]
}
```
- **注意**: limit 最大 10000，使用游标分页。适用于 2022年8月15日后通讯录同步新增IP的替代方案。

### 4.11 创建部门

- **接口**: POST https://qyapi.weixin.qq.com/cgi-bin/department/create?access_token=ACCESS_TOKEN
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 部门名称，1~64 UTF-8 字符，同层不重复，不含 `\:*?"<>｜` |
| name_en | string | 否 | 英文名（需开启多语言支持） |
| parentid | int | 是 | 父部门 id |
| order | int | 否 | 排序值，值大的排前面 |
| id | int | 否 | 部门 id，不填则自动生成，指定时须大于 1 |

- **响应**: `{ "errcode": 0, "errmsg": "created", "id": 2 }`
- **注意**:
  - 部门最大 **15** 层
  - 部门总数不超 **3 万**
  - 每个部门下的节点不超 **3 万**
  - 建议创建部门和成员串行处理
- **幂等性**: 否

### 4.12 更新部门

- **接口**: POST https://qyapi.weixin.qq.com/cgi-bin/department/update?access_token=ACCESS_TOKEN
- **请求参数**: id(必填) + name/name_en/parentid/order (可选)
- **注意**: 不能把部门移动到自身下级
- **幂等性**: 是

### 4.13 删除部门

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/department/delete?access_token=ACCESS_TOKEN&id=ID
- **注意**: 部门下有成员或子部门时不能删除，须先移除
- **幂等性**: 是

### 4.14 获取部门列表

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/department/list?access_token=ACCESS_TOKEN&id=ID
- **参数**: id 可选，不填返回全量组织架构
- **响应**: 返回 `department` 数组，每项含 id, name, name_en, department_leader, parentid, order
- **注意**: 性能较低，建议改用「获取子部门ID列表」+「获取单个部门详情」
- **幂等性**: 是

### 4.15 获取子部门ID列表

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/department/simplelist?access_token=ACCESS_TOKEN&id=ID
- **响应**:
```json
{
  "errcode": 0, "errmsg": "ok",
  "department_id": [
    {"id": 2, "parentid": 1, "order": 10},
    {"id": 3, "parentid": 2, "order": 40}
  ]
}
```
- **注意**: 推荐替代 /department/list，性能更优

### 4.16 获取单个部门详情

- **接口**: GET https://qyapi.weixin.qq.com/cgi-bin/department/get?access_token=ACCESS_TOKEN&id=ID
- **响应**:
```json
{
  "errcode": 0, "errmsg": "ok",
  "department": {
    "id": 2, "name": "广州研发中心", "name_en": "RDGZ",
    "department_leader": ["zhangsan"],
    "parentid": 1, "order": 10
  }
}
```

### 4.17 标签管理

#### 创建标签
- **接口**: POST /tag/create
- **请求**: `{ "tagname": "UI", "tagid": 12 }`（tagid 可选）
- **响应**: `{ "errcode": 0, "errmsg": "created", "tagid": 12 }`

#### 获取标签成员
- **接口**: GET /tag/get?tagid=TAGID
- **响应**:
```json
{
  "errcode": 0, "errmsg": "ok",
  "tagname": "乒乓球协会",
  "userlist": [{"userid": "zhangsan", "name": "张三"}],
  "partylist": [2]
}
```

#### 增加标签成员
- **接口**: POST /tag/addtagusers
- **请求**: `{ "tagid": 12, "userlist": ["user1","user2"], "partylist": [4] }`
- **响应**: 含 `invalidlist`(无效的成员) 和 `invalidparty`(无效的部门)

#### 删除标签成员
- **接口**: POST /tag/deltagusers
- **请求**: 同增加标签成员

#### 获取标签列表
- **接口**: GET /tag/list
- **响应**: `{ "errcode": 0, "errmsg": "ok", "taglist": [{"tagid": 1, "tagname": "a"}] }`

### 4.18 异步导入接口

异步导入用于大批量同步通讯录数据，通过上传 CSV 文件执行。

#### 增量更新成员
- **接口**: POST /batch/syncuser
- **请求**:
```json
{
  "media_id": "xxxxxx",
  "to_invite": true,
  "callback": {
    "url": "xxx", "token": "xxx", "encodingaeskey": "xxx"
  }
}
```
- media_id 通过上传 CSV 文件到素材管理获得
- CSV 格式: 姓名,账号,手机号,邮箱,所在部门,职务,...
- callback 可选，任务完成后推送通知

#### 全量覆盖成员
- **接口**: POST /batch/replaceuser
- **请求**: 同增量更新。差异: 会**清除**不在 CSV 中的成员

#### 全量覆盖部门
- **接口**: POST /batch/replaceparty
- **请求**: 同上。差异: 会**清除**不在 CSV 中的部门

#### 获取异步任务结果
- **接口**: GET /batch/getresult?jobid=JOBID
- **响应**:
```json
{
  "errcode": 0, "errmsg": "ok",
  "status": 3,
  "type": "sync_user",
  "total": 2, "percentage": 100,
  "result": [
    {"userid": "lisi", "errcode": 0, "errmsg": "ok"},
    {"userid": "wangwu", "errcode": 40003, "errmsg": "invalid userid"}
  ]
}
```
- status: 1=等待中, 2=处理中, 3=已完成

### 4.19 异步导出接口

异步导出用于导出大量通讯录数据，结果加密存储。

#### 导出成员/成员详情/部门/标签成员
- **接口**: POST /export/simple_user | /export/user | /export/department | /export/taguser
- **请求**:
```json
{
  "encoding_aeskey": "IJUiXNpvGbODwKEBSEsAeOAPAhkqHqNCF1g0RELurHo",
  "block_size": 1000000
}
```
  - encoding_aeskey: 用于加密导出数据的 base64 密钥（43字符）
  - block_size: 每块数据行数上限

#### 获取导出结果
- **接口**: GET /export/get_result?jobid=JOBID
- **响应**: 含 `data_list`，每项有 `url`（加密数据下载链接，有效期 3 天）

---

## 5. 常见场景工作流

### 场景 1: 从外部 HR 系统同步通讯录

```
步骤 1: 获取通讯录同步 secret → 管理后台 → 管理工具 → 通讯录同步
步骤 2: 获取 access_token → GET /gettoken
步骤 3: 创建部门树 → POST /department/create（从根到叶，串行创建）
步骤 4: 批量创建成员 → POST /user/create（逐个创建，或用异步导入）
步骤 5: 设置标签 → POST /tag/create + POST /tag/addtagusers
```

### 场景 2: 查询某部门下所有成员

```
步骤 1: 获取 access_token → GET /gettoken
步骤 2: 获取部门列表 → GET /department/simplelist（找到目标部门 id）
步骤 3: 获取成员详情 → GET /user/list?department_id=X（仅直属成员，子部门需递归调用）
或(2022.8.15后新增IP):
步骤 3: 获取成员ID列表 → POST /user/list_id
步骤 4: 逐个读取 → GET /user/get?userid=X
```

### 场景 3: 大批量导入成员（>1000人）

```
步骤 1: 准备 CSV 文件（UTF-8编码，格式见官方模板）
步骤 2: 上传 CSV → POST /media/upload?type=file（获得 media_id）
步骤 3: 发起异步导入 → POST /batch/syncuser（增量）或 /batch/replaceuser（全量）
步骤 4: 轮询结果 → GET /batch/getresult?jobid=X（或通过回调接收通知）
```

### 场景 4: 监听通讯录变更

```
步骤 1: 在管理后台配置回调 URL（参考 wecom-core 回调配置）
步骤 2: 实现回调接收服务
步骤 3: 解析 Event=change_contact 的 XML 消息
步骤 4: 根据 ChangeType 分发处理（create_user/update_user/delete_user/create_party/...）
```

---

## 6. 代码模板

（遵循 wecom-core 代码生成规范第 5 节）

### 6.1 Python 示例

```python
"""
企业微信 - 通讯录管理模块
使用前:
  1. pip install requests
  2. 设置环境变量: WECOM_CORP_ID, WECOM_CONTACT_SECRET
"""
import os
from wecom_client import WeComClient  # 继承 wecom-core 基类


class WeComContact(WeComClient):
    """通讯录管理"""

    # ---- 成员管理 ----

    def create_user(self, userid: str, name: str, mobile: str = None,
                    email: str = None, department: list = None, **kwargs) -> dict:
        """创建成员"""
        data = {"userid": userid, "name": name}
        if mobile:
            data["mobile"] = mobile
        if email:
            data["email"] = email
        if department:
            data["department"] = department
        data.update(kwargs)
        return self._request("POST", "/user/create", json=data)

    def get_user(self, userid: str) -> dict:
        """读取成员"""
        return self._request("GET", f"/user/get?userid={userid}")

    def update_user(self, userid: str, **kwargs) -> dict:
        """更新成员"""
        data = {"userid": userid, **kwargs}
        return self._request("POST", "/user/update", json=data)

    def delete_user(self, userid: str) -> dict:
        """删除成员"""
        return self._request("GET", f"/user/delete?userid={userid}")

    def batch_delete_users(self, useridlist: list) -> dict:
        """批量删除成员（最多200个）"""
        return self._request("POST", "/user/batchdelete", json={"useridlist": useridlist})

    def list_department_users(self, department_id: int) -> dict:
        """获取部门成员（简要信息，仅直属成员）"""
        return self._request("GET", f"/user/simplelist?department_id={department_id}")

    def list_department_users_detail(self, department_id: int) -> dict:
        """获取部门成员详情（仅直属成员）"""
        return self._request("GET", f"/user/list?department_id={department_id}")

    def list_all_department_users(self, department_id: int) -> list:
        """递归获取部门及所有子部门的成员"""
        result = []
        resp = self.list_department_users(department_id)
        result.extend(resp.get("userlist", []))
        # 递归子部门
        sub_resp = self._request("GET", f"/department/simplelist?id={department_id}")
        for sub in sub_resp.get("department_id", []):
            result.extend(self.list_all_department_users(sub["id"]))
        return result

    def userid_to_openid(self, userid: str) -> str:
        """userid 转 openid"""
        resp = self._request("POST", "/user/convert_to_openid", json={"userid": userid})
        return resp["openid"]

    def mobile_to_userid(self, mobile: str) -> str:
        """手机号获取 userid"""
        resp = self._request("POST", "/user/getuserid", json={"mobile": mobile})
        return resp["userid"]

    def list_user_ids(self, limit: int = 10000) -> list:
        """获取全量成员ID列表（游标分页）"""
        result = []
        cursor = ""
        while True:
            resp = self._request("POST", "/user/list_id", json={"cursor": cursor, "limit": limit})
            result.extend(resp.get("dept_user", []))
            cursor = resp.get("next_cursor", "")
            if not cursor:
                break
        return result

    # ---- 部门管理 ----

    def create_department(self, name: str, parentid: int, **kwargs) -> dict:
        """创建部门"""
        data = {"name": name, "parentid": parentid, **kwargs}
        return self._request("POST", "/department/create", json=data)

    def update_department(self, dept_id: int, **kwargs) -> dict:
        """更新部门"""
        data = {"id": dept_id, **kwargs}
        return self._request("POST", "/department/update", json=data)

    def delete_department(self, dept_id: int) -> dict:
        """删除部门（须先清空成员和子部门）"""
        return self._request("GET", f"/department/delete?id={dept_id}")

    def list_departments(self, dept_id: int = None) -> list:
        """获取部门列表"""
        path = "/department/list"
        if dept_id:
            path += f"?id={dept_id}"
        resp = self._request("GET", path)
        return resp.get("department", [])

    def get_department(self, dept_id: int) -> dict:
        """获取单个部门详情"""
        resp = self._request("GET", f"/department/get?id={dept_id}")
        return resp.get("department", {})

    # ---- 标签管理 ----

    def create_tag(self, tagname: str, tagid: int = None) -> dict:
        """创建标签"""
        data = {"tagname": tagname}
        if tagid:
            data["tagid"] = tagid
        return self._request("POST", "/tag/create", json=data)

    def get_tag_users(self, tagid: int) -> dict:
        """获取标签成员"""
        return self._request("GET", f"/tag/get?tagid={tagid}")

    def add_tag_users(self, tagid: int, userlist: list = None, partylist: list = None) -> dict:
        """增加标签成员"""
        data = {"tagid": tagid}
        if userlist:
            data["userlist"] = userlist
        if partylist:
            data["partylist"] = partylist
        return self._request("POST", "/tag/addtagusers", json=data)

    def list_tags(self) -> list:
        """获取标签列表"""
        resp = self._request("GET", "/tag/list")
        return resp.get("taglist", [])


# 使用示例
if __name__ == "__main__":
    client = WeComContact(
        corp_id=os.environ["WECOM_CORP_ID"],
        corp_secret=os.environ["WECOM_CONTACT_SECRET"]
    )

    # 创建部门
    dept = client.create_department("研发部", parentid=1)
    print(f"部门创建成功, id={dept['id']}")

    # 创建成员
    client.create_user(
        userid="zhangsan",
        name="张三",
        mobile="13800000000",
        department=[dept["id"]]
    )
    print("成员创建成功")

    # 查询部门成员
    users = client.list_department_users(dept["id"])
    print(f"部门成员: {users}")
```

### 6.2 TypeScript 示例

```typescript
/**
 * 企业微信 - 通讯录管理模块
 * 使用前:
 *   1. npm install axios
 *   2. 设置环境变量: WECOM_CORP_ID, WECOM_CONTACT_SECRET
 */
import { WeComClient } from './wecom-client'; // 继承 wecom-core 基类

interface UserInfo {
  userid: string;
  name: string;
  mobile?: string;
  email?: string;
  department?: number[];
  order?: number[];
  position?: string;
  gender?: string;
  is_leader_in_dept?: number[];
  direct_leader?: string[];
  enable?: number;
  alias?: string;
  main_department?: number;
  [key: string]: any;
}

interface DepartmentInfo {
  id: number;
  name: string;
  name_en?: string;
  parentid: number;
  order?: number;
  department_leader?: string[];
}

export class WeComContact extends WeComClient {
  // ---- 成员管理 ----

  async createUser(user: UserInfo): Promise<any> {
    return this.request('POST', '/user/create', user);
  }

  async getUser(userid: string): Promise<UserInfo> {
    return this.request('GET', `/user/get?userid=${userid}`);
  }

  async updateUser(userid: string, updates: Partial<UserInfo>): Promise<any> {
    return this.request('POST', '/user/update', { userid, ...updates });
  }

  async deleteUser(userid: string): Promise<any> {
    return this.request('GET', `/user/delete?userid=${userid}`);
  }

  async batchDeleteUsers(useridlist: string[]): Promise<any> {
    return this.request('POST', '/user/batchdelete', { useridlist });
  }

  async listDepartmentUsers(departmentId: number): Promise<any> {
    return this.request('GET', `/user/simplelist?department_id=${departmentId}`);
  }

  async mobileToUserid(mobile: string): Promise<string> {
    const resp = await this.request('POST', '/user/getuserid', { mobile });
    return resp.userid;
  }

  async listUserIds(limit = 10000): Promise<Array<{userid: string; department: number}>> {
    const result: Array<{userid: string; department: number}> = [];
    let cursor = '';
    do {
      const resp = await this.request('POST', '/user/list_id', { cursor, limit });
      result.push(...(resp.dept_user || []));
      cursor = resp.next_cursor || '';
    } while (cursor);
    return result;
  }

  // ---- 部门管理 ----

  async createDepartment(name: string, parentid: number, opts?: Partial<DepartmentInfo>): Promise<any> {
    return this.request('POST', '/department/create', { name, parentid, ...opts });
  }

  async deleteDepartment(id: number): Promise<any> {
    return this.request('GET', `/department/delete?id=${id}`);
  }

  async listDepartments(id?: number): Promise<DepartmentInfo[]> {
    const path = id ? `/department/list?id=${id}` : '/department/list';
    const resp = await this.request('GET', path);
    return resp.department || [];
  }

  async getDepartment(id: number): Promise<DepartmentInfo> {
    const resp = await this.request('GET', `/department/get?id=${id}`);
    return resp.department;
  }

  // ---- 标签管理 ----

  async createTag(tagname: string, tagid?: number): Promise<any> {
    const data: any = { tagname };
    if (tagid) data.tagid = tagid;
    return this.request('POST', '/tag/create', data);
  }

  async getTagUsers(tagid: number): Promise<any> {
    return this.request('GET', `/tag/get?tagid=${tagid}`);
  }

  async addTagUsers(tagid: number, userlist?: string[], partylist?: number[]): Promise<any> {
    return this.request('POST', '/tag/addtagusers', { tagid, userlist, partylist });
  }

  async listTags(): Promise<Array<{tagid: number; tagname: string}>> {
    const resp = await this.request('GET', '/tag/list');
    return resp.taglist || [];
  }
}
```

### 6.3 Go 示例

```go
package wecom

// ContactClient 通讯录管理客户端
type ContactClient struct {
	*Client // 嵌入 wecom-core 基础客户端
}

type User struct {
	UserID         string   `json:"userid"`
	Name           string   `json:"name"`
	Mobile         string   `json:"mobile,omitempty"`
	Email          string   `json:"email,omitempty"`
	Department     []int    `json:"department,omitempty"`
	Order          []int    `json:"order,omitempty"`
	Position       string   `json:"position,omitempty"`
	Gender         string   `json:"gender,omitempty"`
	IsLeaderInDept []int    `json:"is_leader_in_dept,omitempty"`
	DirectLeader   []string `json:"direct_leader,omitempty"`
	Enable         int      `json:"enable,omitempty"`
	MainDepartment int      `json:"main_department,omitempty"`
	Status         int      `json:"status,omitempty"`
}

type Department struct {
	ID               int      `json:"id"`
	Name             string   `json:"name"`
	NameEn           string   `json:"name_en,omitempty"`
	ParentID         int      `json:"parentid"`
	Order            int      `json:"order,omitempty"`
	DepartmentLeader []string `json:"department_leader,omitempty"`
}

func (c *ContactClient) CreateUser(user *User) error {
	_, err := c.Post("/user/create", user)
	return err
}

func (c *ContactClient) GetUser(userid string) (*User, error) {
	resp, err := c.Get("/user/get?userid=" + userid)
	if err != nil {
		return nil, err
	}
	var user User
	// 解析 resp 到 user ...
	return &user, nil
}

func (c *ContactClient) CreateDepartment(name string, parentID int) (int, error) {
	resp, err := c.Post("/department/create", map[string]any{
		"name": name, "parentid": parentID,
	})
	if err != nil {
		return 0, err
	}
	id, ok := resp["id"].(float64)
	if !ok {
		return 0, fmt.Errorf("unexpected response: missing id field")
	}
	return int(id), nil
}
```

---


### 6.4 Java 示例

```java
public class WeComContactService {
    private final WeComClient client;

    public WeComContactService(WeComClient client) {
        this.client = client;
    }

    /** 获取成员详情 */
    public JsonObject getUser(String userId) throws Exception {
        String url = "/user/get?access_token=" + client.getAccessToken() + "&userid=" + userId;
        // GET 请求省略，类似 post 的模式
        return client.post("/user/get", new JsonObject()); // 示意
    }

    /** 获取部门列表 */
    public JsonArray listDepartment(int id) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("id", id);
        JsonObject resp = client.post("/department/list", body);
        return resp.getAsJsonArray("department");
    }

    /** 批量获取部门成员详情（自动分页） */
    public List<JsonObject> listMembersByDept(int deptId, boolean fetchChild) throws Exception {
        // ⚠️ 应用须有该部门的通讯录权限，否则返回空
        JsonObject body = new JsonObject();
        body.addProperty("department_id", deptId);
        body.addProperty("fetch_child", fetchChild ? 1 : 0);
        JsonObject resp = client.post("/user/list", body);
        return gson.fromJson(resp.getAsJsonArray("userlist"), new TypeToken<List<JsonObject>>(){}.getType());
    }
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

### 6.5 PHP 示例

```php
<?php
class WeComContactService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /** 获取成员详情 */
    public function getUser(string $userId): array
    {
        return $this->client->get('/cgi-bin/user/get', ['userid' => $userId]);
    }

    /** 获取部门列表 */
    public function listDepartment(int $id = 0): array
    {
        return $this->client->get('/cgi-bin/department/list', ['id' => $id]);
    }

    /** 获取部门成员详情（自动分页） */
    public function listMembersByDept(int $deptId, bool $fetchChild = false): array
    {
        // ⚠️ 应用须有该部门的通讯录权限，否则返回空
        return $this->client->get('/cgi-bin/user/list', [
            'department_id' => $deptId,
            'fetch_child'   => $fetchChild ? 1 : 0,
        ]);
    }
}
```

**依赖 (Composer)**:
```bash
composer require guzzlehttp/guzzle
```

## 7. 测试模板

（遵循 wecom-core 测试规范第 6 节）

```python
"""
企业微信 - 通讯录管理 单元测试
"""
import pytest
from unittest.mock import patch, MagicMock
from wecom_contact import WeComContact


@pytest.fixture
def client():
    with patch.object(WeComContact, '_refresh_token'):
        c = WeComContact("test_corp_id", "test_secret")
        c._token = "mock_token"
        c._token_expires_at = float('inf')
        return c


class TestUserManagement:

    @patch("requests.request")
    def test_创建成员_成功(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "created"}
        )
        result = client.create_user("zhangsan", "张三", mobile="13800000000", department=[1])
        assert result["errcode"] == 0
        call_args = mock_req.call_args
        body = call_args[1]["json"]
        assert body["userid"] == "zhangsan"
        assert body["name"] == "张三"
        assert body["department"] == [1]

    @patch("requests.request")
    def test_创建成员_userid已存在(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 60104, "errmsg": "userid existed"}
        )
        with pytest.raises(Exception, match="60104"):
            client.create_user("zhangsan", "张三", mobile="13800000000")

    @patch("requests.request")
    def test_读取成员_成功(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "ok", "userid": "zhangsan", "name": "张三", "department": [1]}
        )
        result = client.get_user("zhangsan")
        assert result["userid"] == "zhangsan"
        assert result["name"] == "张三"

    @patch("requests.request")
    def test_读取成员_不存在(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 40003, "errmsg": "invalid userid"}
        )
        with pytest.raises(Exception, match="40003"):
            client.get_user("nonexistent")

    @patch("requests.request")
    def test_批量删除成员(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "deleted"}
        )
        result = client.batch_delete_users(["user1", "user2"])
        assert result["errcode"] == 0
        body = mock_req.call_args[1]["json"]
        assert len(body["useridlist"]) == 2

    @patch("requests.request")
    def test_手机号获取userid(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "ok", "userid": "zhangsan"}
        )
        uid = client.mobile_to_userid("13800000000")
        assert uid == "zhangsan"

    @patch("requests.request")
    def test_获取成员ID列表_分页(self, mock_req, client):
        mock_req.side_effect = [
            MagicMock(json=lambda: {
                "errcode": 0, "errmsg": "ok",
                "next_cursor": "page2",
                "dept_user": [{"userid": "a", "department": 1}]
            }),
            MagicMock(json=lambda: {
                "errcode": 0, "errmsg": "ok",
                "next_cursor": "",
                "dept_user": [{"userid": "b", "department": 2}]
            })
        ]
        result = client.list_user_ids()
        assert len(result) == 2
        assert mock_req.call_count == 2


class TestDepartmentManagement:

    @patch("requests.request")
    def test_创建部门_成功(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "created", "id": 2}
        )
        result = client.create_department("研发部", parentid=1)
        assert result["id"] == 2

    @patch("requests.request")
    def test_删除非空部门_报错(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 60005, "errmsg": "department not empty"}
        )
        with pytest.raises(Exception, match="60005"):
            client.delete_department(2)

    @patch("requests.request")
    def test_获取部门列表(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "ok", "department": [
                {"id": 1, "name": "根部门", "parentid": 0},
                {"id": 2, "name": "研发部", "parentid": 1}
            ]}
        )
        depts = client.list_departments()
        assert len(depts) == 2


class TestEdgeCases:

    @patch("requests.request")
    def test_token过期自动刷新(self, mock_req, client):
        client._token_expires_at = 0  # 模拟过期
        with patch.object(client, '_refresh_token') as mock_refresh:
            mock_req.return_value = MagicMock(
                json=lambda: {"errcode": 0, "errmsg": "ok", "userid": "test"}
            )
            client.get_user("test")
            mock_refresh.assert_called_once()

    @patch("requests.request")
    def test_系统繁忙自动重试(self, mock_req, client):
        mock_req.side_effect = [
            MagicMock(json=lambda: {"errcode": -1, "errmsg": "system busy"}),
            MagicMock(json=lambda: {"errcode": 0, "errmsg": "ok", "userid": "test"})
        ]
        result = client.get_user("test")
        assert result["errcode"] == 0
        assert mock_req.call_count == 2

    @patch("requests.request")
    def test_网络超时(self, mock_req, client):
        import requests as req_lib
        mock_req.side_effect = req_lib.exceptions.Timeout("Connection timed out")
        with pytest.raises(req_lib.exceptions.Timeout):
            client.get_user("test")


class TestTagManagement:

    @patch("requests.request")
    def test_创建标签_成功(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "created", "tagid": 12}
        )
        result = client.create_tag("UI设计组")
        assert result["tagid"] == 12

    @patch("requests.request")
    def test_增加标签成员_部分失败(self, mock_req, client):
        mock_req.return_value = MagicMock(
            json=lambda: {"errcode": 0, "errmsg": "ok", "invalidlist": "user3"}
        )
        result = client.add_tag_users(12, userlist=["user1", "user3"])
        assert result["invalidlist"] == "user3"
```

---

## 8. 代码审核

（遵循 wecom-core 审核规范第 7 节）

生成代码后自动执行审核检查清单，输出审核报告。通讯录域额外检查：

| 维度 | 检查项 | 严重级别 |
|------|--------|----------|
| 正确性 | 创建成员时 mobile/email 至少填一个 | HIGH |
| 正确性 | 部门操作 parentid=1 为根部门 | HIGH |
| 正确性 | userid 格式校验（1~64字节，首字符字母/数字） | MEDIUM |
| 健壮性 | 批量删除 useridlist 不超过 200 | MEDIUM |
| 健壮性 | 获取成员ID列表使用游标分页 | MEDIUM |
| 安全性 | 不在日志中输出成员手机号/邮箱 | CRITICAL |

---

## 9. 回调事件

| 事件类型 (ChangeType) | Event | 触发时机 | 关键字段 |
|----------------------|-------|----------|----------|
| create_user | change_contact | 新增成员 | UserID, Name, Department, Mobile |
| update_user | change_contact | 更新成员 | UserID, NewUserID, Department |
| delete_user | change_contact | 删除成员 | UserID |
| create_party | change_contact | 新增部门 | Id, Name, ParentId |
| update_party | change_contact | 更新部门 | Id, Name, ParentId |
| delete_party | change_contact | 删除部门 | Id |
| update_tag | change_contact | 标签变更 | TagId, AddUserItems, DelUserItems, AddPartyItems, DelPartyItems |

**重要 — 2022年8月15日后通讯录助手新配置的回调 URL 限制**:
- create_user: 仅回调 UserID/Department 两个字段
- update_user: **仅在部门相关变更或 UserID 变更时触发**，仅回调 UserID/Department/NewUserID
- create_party/update_party: 仅回调 Id/ParentId
- 其他事件不受影响

---

## 10. 踩坑指南

1. **敏感字段不返回**: 2022.6.20 起新建应用读取成员不返回手机/邮箱/头像等。需通过 oauth2 授权获取。
   → 提前在管理后台申请 oauth2 授权，或使用通讯录同步 secret

2. **通讯录同步新增IP限制**: 2022.8.15 起新增IP不能调用 /user/list **和 /department/list**。
   → 成员: 改用 POST /user/list_id（游标分页获取全量 userid）
   → 部门: 改用 GET /department/simplelist + /department/get

3. **部门/成员创建顺序**: 并发创建部门和成员可能导致数据不一致。
   → 先串行创建部门树（从根到叶），再创建成员

4. **已激活成员手机号**: 调用更新接口修改已激活成员的手机号会被静默忽略（不报错）。
   → 只能由成员本人在企业微信中修改

5. **全量覆盖风险**: /batch/replaceuser 和 /batch/replaceparty 会**删除不在 CSV 中的数据**。
   → 生产环境优先用增量 /batch/syncuser，确认无误再考虑全量覆盖

6. **userid 大小写**: 系统进行唯一性检查时忽略大小写，"ZhangSan" 和 "zhangsan" 视为同一用户。
   → 建议统一使用小写

7. **系统生成的 userid/企业邮箱只能改一次**: 系统自动生成的 userid 和企业邮箱仅允许修改一次。
   → 创建成员时尽量明确指定 userid 和 biz_mail

8. **部门层级限制**: 最大 15 层，每个部门下最多 3 万个节点（含子部门+成员）。
   → 大企业需提前规划组织架构层级

9. **删除部门前须清空**: 部门下有成员或子部门时无法删除。
   → 先递归移除成员和子部门，从叶到根逆序删除

10. **biz_mail_alias 不具备原子性**: 更新企业邮箱别名和其他字段可能部分成功部分失败。
    → 邮箱别名更新建议单独调用

11. **更新成员未传字段被清空**: POST /user/update 中**未传的可选字段会被置空**（如 position、telephone 等非保护字段），而非保持原值。这是全量覆盖语义，不是增量更新。
    → 安全做法：先 GET /user/get 获取当前完整数据，修改目标字段后将完整数据回写（read-modify-write 模式）
    → 特别注意 `department`、`order`、`is_leader_in_dept` 等数组字段也会被覆盖

---

## 11. 通讯录域特有错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40003 | 不合法的 UserID | 检查 userid 格式（1~64字节，首字符字母/数字） |
| 40066 | 不合法的部门列表 | department 数组格式错误或部门不存在 |
| 60003 | 部门名称含有非法字符 | 检查是否包含 `\:*?"<>｜` |
| 60004 | 同层部门名称重复 | 同一 parentid 下名称须唯一 |
| 60005 | 部门下有成员/子部门 | 删除部门前先清空 |
| 60006 | 部门数量超限 | 总数不超过 3 万 |
| 60104 | userid 已存在 | 该 userid 已被使用 |
| 60103 | 手机号已存在 | 企业内手机号须唯一 |
| 60107 | 邮箱已存在 | 企业内邮箱须唯一 |

---

## 12. 互联企业 (LinkedCorp)

> 互联企业是企业微信提供的跨企业通讯录能力，允许互联的企业之间互相访问成员和部门信息。

### 12.1 API 速查表

| 操作 | 方法 | 端点路径 | 说明 |
|------|------|----------|------|
| 获取应用可见范围 | POST | /linkedcorp/agent/get_perm_list | 获取互联企业中本应用可见的成员和部门 |
| 获取互联企业成员详细信息 | POST | /linkedcorp/user/get | 获取互联企业下的成员详情 |
| 获取互联企业部门成员 | POST | /linkedcorp/user/simplelist | 获取互联企业部门下的成员列表（简要） |
| 获取互联企业部门成员详情 | POST | /linkedcorp/user/list | 获取互联企业部门下的成员列表（详细） |
| 获取互联企业部门列表 | POST | /linkedcorp/department/list | 获取互联企业的部门列表 |

### 12.2 核心概念

- **corpid/userid 组合标识**：互联企业中，成员用 `CorpId/UserId` 格式标识，部门用 `linked_id/department_id` 格式标识
- **权限范围**：只能访问互联企业中**授权给本应用**的成员和部门
- **应用可见范围**：需要先调用 `get_perm_list` 获取可见的 corpid/userid/department 列表

### 12.3 代码模板

```python
class LinkedCorpClient:
    """互联企业通讯录"""

    def __init__(self, client: WeComClient):
        self.client = client

    def get_perm_list(self) -> dict:
        """获取应用可见范围（互联企业）"""
        return self.client.post("/linkedcorp/agent/get_perm_list", json={})

    def get_user(self, userid: str) -> dict:
        """获取互联企业成员详情
        userid 格式: CorpId/UserId
        """
        return self.client.post("/linkedcorp/user/get", json={"userid": userid})

    def user_simplelist(self, department_id: str) -> dict:
        """获取互联企业部门成员（简要）
        department_id 格式: linked_id/department_id
        """
        return self.client.post("/linkedcorp/user/simplelist", json={
            "department_id": department_id,
        })

    def user_list(self, department_id: str) -> dict:
        """获取互联企业部门成员详情"""
        return self.client.post("/linkedcorp/user/list", json={
            "department_id": department_id,
        })

    def department_list(self, department_id: str) -> dict:
        """获取互联企业部门列表"""
        return self.client.post("/linkedcorp/department/list", json={
            "department_id": department_id,
        })
```

### 12.4 踩坑提示

- `linkedcorp` 接口全部为 **POST** 方法，与普通通讯录的 GET 不同
- userid/department_id 格式为 `CorpId/UserId`，包含 `/` 分隔符
- 只有设置了互联关系的企业才能使用这些接口

---

## 13. 成员扩展属性

> 成员扩展属性（extattr）允许在成员信息中添加自定义字段。

### API

| 操作 | 方法 | 端点路径 | 说明 |
|------|------|----------|------|
| 成员扩展属性 | — | （通过 /user/create 和 /user/update 的 extattr 字段操作） | 需先在管理后台添加自定义属性 |

扩展属性支持三种类型：
- `text`: 文本类型
- `web`: 网页类型（含 url 和 title）
- `miniprogram`: 小程序类型（含 appid、pagepath、title）

```python
# 创建成员时设置扩展属性
client.create_user(
    userid="zhangsan", name="张三", mobile="13800000000",
    extattr={
        "attrs": [
            {"type": 0, "name": "工号", "text": {"value": "EMP001"}},
            {"type": 1, "name": "个人主页", "web": {"url": "https://example.com", "title": "主页"}},
        ]
    }
)
```

---

## 14. 参考

- 通讯录管理概述: https://developer.work.weixin.qq.com/document/path/90193
- 成员管理: https://developer.work.weixin.qq.com/document/path/90195
- 部门管理: https://developer.work.weixin.qq.com/document/path/90205
- 标签管理: https://developer.work.weixin.qq.com/document/path/90210
- 通讯录回调: https://developer.work.weixin.qq.com/document/path/90970
- 异步导入: https://developer.work.weixin.qq.com/document/path/90980
- 互联企业: https://developer.work.weixin.qq.com/document/path/93360


