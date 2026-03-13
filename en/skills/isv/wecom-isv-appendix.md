---
name: wecom-isv-appendix
description: |
  服务商代开发附录 SKILL。汇总错误码、频率限制、接口限制、ID加密规则、API兼容性矩阵等参考信息。
  TRIGGER: 当用户提到代开发附录、ISV appendix、代开发限制、代开发错误码、代开发频率限制时触发。
  本 SKILL 是所有 wecom-isv-* SKILL 的补充参考。
version: 1.0.0
domain: isv-appendix
depends_on: wecom-isv-core
triggers:
  - 代开发附录
  - ISV appendix
  - 代开发限制
  - 代开发错误码
  - 代开发频率限制
  - ISV error codes
  - ISV rate limits
  - 代开发兼容性
  - ID加密规则
  - IP白名单
  - 代开发迁移
---

# WeCom ISV Appendix (wecom-isv-appendix)

你现在是企业微信**服务商代开发**领域的参考手册专家。基于本 SKILL 的知识，帮助开发者快速排查问题、理解限制、规划迁移。

> **定位**：本 SKILL 是所有 `wecom-isv-*` SKILL 的**补充附录**，汇总分散在各 SKILL 中的错误码、频率限制、接口限制等参考信息。具体业务逻辑请查阅对应的领域 SKILL。

---

## 1. Overview

### 1.1 文档用途

本附录汇总服务商代开发模式下的各类参考信息，包括：

- **错误码速查**：从所有 ISV SKILL 中汇总的代开发专属错误码
- **频率限制**：Token 获取与业务 API 的调用频率上限
- **接口限制**：代开发模式下不可调用、需特殊权限、有行为差异的接口
- **API 兼容性矩阵**：三种开发模式的 API 支持对比
- **ID 加密规则**：ID 安全升级后的加密规则与转换接口
- **IP 白名单**：服务商 IP 白名单配置要点
- **版本迁移**：从自建应用迁移到代开发的注意事项
- **常见问题 FAQ**：高频踩坑问题汇总

### 1.2 关联 SKILL 索引

| SKILL | 职责 |
|-------|------|
| `wecom-isv-core` | 三级凭证体系、权限模型、代码生成规范 |
| `wecom-isv-auth` | 应用授权安装、授权变更、授权管理 |
| `wecom-isv-callback` | 指令回调、数据回调、事件推送处理 |
| `wecom-isv-license` | 接口调用许可购买、激活、续期、转移 |
| `wecom-isv-billing` | 收银台、定价策略、收款订单、到期拦截 |
| `wecom-isv-provider` | 服务商级别接口（登录授权、通讯录同步） |
| `wecom-isv-jssdk` | 代开发应用 JS-SDK 签名与调用 |
| `wecom-isv-appendix` | **本文档** — 错误码/限制/兼容性参考 |

---

## 2. 代开发专属错误码汇总

> 以下错误码从所有 `wecom-isv-*` SKILL 中汇总，按类别分组。排查时优先检查排查方向列的建议。

### 2.1 凭证相关错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 40082 | suite_id 不合法 | 检查 suite_id 配置是否与服务商后台一致 |
| 40083 | suite_secret 不合法 | 检查 suite_secret 是否正确，注意不要与 provider_secret 混淆 |
| 40084 | suite_ticket 不合法 | 使用最新推送的 suite_ticket；ticket 每 10 分钟推送一次 |
| 40085 | suite_token 不合法 | 重新获取 suite_access_token；检查是否使用了其他类型的 token |
| 40086 | 不合法的 auth_corpid | 检查企业是否已完成授权，corpid 是否正确 |
| 40089 | 不合法的 permanent_code | 检查永久授权码是否正确，企业是否已取消授权 |
| 41004 | suite_id 为空 | 检查请求参数中是否遗漏了 suite_id 字段 |
| 42009 | suite_access_token 已过期 | suite_access_token 有效期 2 小时，需重新获取并缓存 |

**凭证排查流程**：

```
错误码 4008x / 4100x / 42009
├── 1. 确认使用的 token 类型是否匹配接口要求
│   ├── suite_access_token → 服务商级接口
│   ├── corp_access_token  → 企业级业务接口
│   └── provider_access_token → 服务商身份验证接口
├── 2. 检查 token 是否过期（2小时有效期）
├── 3. 检查 suite_ticket 是否为最新推送
│   └── ticket 10 分钟推送一次，使用最新的
└── 4. 确认 suite_id / suite_secret 配置正确
```

### 2.2 授权相关错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 84014 | 无效的临时授权码 | auth_code 一次性使用，可能已被消费或过期（10 分钟有效） |
| 84015 | 企业已被取消授权 | 企业管理员在管理后台取消了应用授权 |
| 84019 | 缺少授权 | 检查应用模版的权限配置，确认已申请所需权限 |
| 84020 | 未通过审核 | 应用模版尚未通过企业微信审核 |
| 84021 | 临时授权码已过期 | auth_code 有效期 10 分钟，需重新发起授权 |
| 84066 | 不合法的corpid/openid | 检查传入的 corpid 或 openid 格式是否正确 |
| 84074 | 无权限操作该成员 | 操作的成员不在应用的可见范围内 |
| 84100 | 无应用权限 | 在服务商管理后台申请对应的应用 API 权限 |

**授权排查流程**：

```
错误码 8401x / 84100
├── 1. 确认企业授权状态
│   ├── 调用 get_auth_info 查看授权信息
│   └── 检查 cancel_auth 回调是否已收到
├── 2. 检查 auth_code 是否有效
│   ├── 是否在 10 分钟内使用
│   └── 是否已被消费（一次性）
├── 3. 检查应用权限配置
│   ├── 服务商后台 → 应用管理 → 权限配置
│   └── 确认所需 API 权限已勾选
└── 4. 检查应用可见范围
    └── 确认操作的成员/部门在授权范围内
```

### 2.3 通用错误码

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 45009 | 调用频率超限 | 降低调用频率；确保 token 有缓存避免频繁获取；参见第 3 节频率限制 |
| 48002 | API 接口无权限 | 检查应用模版的 API 权限配置；部分接口需单独申请 |
| 60011 | 不合法的 userid | 检查 userid 是否在授权范围内；注意加密 ID 场景 |
| 60020 | IP 不在白名单 | 在服务商后台添加服务器 IP 到白名单；参见第 8 节 |
| 60104 | 不合法的部门 ID | 检查部门是否在授权范围内 |
| 301002 | 接口调用许可不足 | 需购买/激活 License；参见 `wecom-isv-license` |
| 301048 | 企业未激活 | 企业需在管理后台完成激活 |

### 2.4 License 相关错误码

> License 错误码范围：700001 ~ 700099，详见 `wecom-isv-license` SKILL。

| 错误码 | 含义 | 排查方向 |
|--------|------|----------|
| 700001 | license 订单不存在 | 检查 order_id 是否正确 |
| 700002 | license 订单状态异常 | 订单可能已取消或已过期 |
| 700003 | license 激活失败 | 检查 active_code 是否有效 |
| 700004 | license 账号数不足 | 已激活的账号数已达上限，需购买更多 |
| 700005 | license 转移失败 | 检查源账号和目标账号状态 |
| 700010 | 非法的 license 类型 | 检查 license edition 参数 |
| 700011 | 订单正在处理中 | 异步订单未完成，等待回调通知 |
| 700020 | 企业未绑定支付 | 企业需先在管理后台绑定支付信息 |
| 700030 | license 已过期 | 需续费或重新购买 |

### 2.5 错误码速查索引

```
按错误码快速定位：
4xxxx → 参数/凭证错误 → 见 2.1 / 2.3
42xxx → Token 过期    → 见 2.1
45xxx → 频率超限      → 见第 3 节
48xxx → 权限不足      → 见 2.3
6xxxx → IP/ID 校验    → 见 2.3 / 第 7 节
84xxx → 授权相关      → 见 2.2
301xx → License 不足  → 见 2.3
700xx → License 操作  → 见 2.4
```

---

## 3. 频率限制

> 代开发应用的频率限制分为两层：**服务商级接口**和**企业级业务接口**。

### 3.1 Token 获取频率

| 接口 | 频率限制 | 说明 |
|------|----------|------|
| `POST /service/get_suite_token` | 200 次/5 分钟 | 全局限制，所有企业共享 |
| `POST /service/get_corp_token` | 每企业 300 次/5 分钟 | 按授权企业独立计算 |
| `POST /service/get_provider_token` | 200 次/5 分钟 | 全局限制 |
| `GET /service/get_pre_auth_code` | 200 次/5 分钟 | 全局限制 |

**关键提醒**：

```
⚠️ Token 缓存是代开发应用的生命线

1. suite_access_token 有效期 2 小时 → 必须缓存
2. corp_access_token 有效期 2 小时 → 按企业 corpid 分别缓存
3. provider_access_token 有效期 2 小时 → 全局缓存

错误做法：每次 API 调用前都获取新 token → 瞬间打满频率限制
正确做法：获取后缓存，过期前 5 分钟刷新，使用分布式锁避免并发刷新
```

### 3.2 业务 API 频率（使用 corp_access_token 调用）

> 代开发应用使用 corp_access_token 调用业务 API 时，频率限制与自建应用相同，按企业+应用维度独立计算。

| API 类别 | 频率限制 | 计算维度 |
|---------|----------|----------|
| 通讯录读取 | 40,000 次/小时 | 每企业 |
| 通讯录写入 | 40,000 次/小时 | 每企业 |
| 消息发送 | 帐号上限数 × 30 人次/秒 | 每应用 |
| 消息撤回 | 10,000 次/分钟 | 每企业 |
| 外部联系人 | 15,000 次/小时 | 每企业 |
| 客户群 | 15,000 次/小时 | 每企业 |
| 审批 | 6,000 次/分钟 | 每企业 |
| 打卡 | 6,000 次/分钟 | 每企业 |
| 日程 | 6,000 次/分钟 | 每企业 |
| 素材管理 | 15,000 次/小时 | 每企业 |

### 3.3 频率限制最佳实践

```
高并发场景频率控制策略：

1. Token 层面
   ├── 使用 Redis/Memcached 集中缓存 token
   ├── 设置 token 过期时间为有效期 - 5分钟（提前刷新）
   ├── 使用分布式锁防止并发刷新
   └── 刷新失败时使用旧 token 重试

2. 业务 API 层面
   ├── 使用令牌桶/漏桶算法限流
   ├── 批量接口优先（如 batch/userid_to_openuserid）
   ├── 消息发送使用群发接口而非逐条发送
   └── 通讯录同步使用增量回调而非全量拉取

3. 错误处理
   ├── 收到 45009 后指数退避重试（1s → 2s → 4s → 8s）
   ├── 记录频率超限日志，用于后续优化
   └── 设置告警阈值（如达到限制的 80% 时告警）
```

---

## 4. 代开发接口限制清单

### 4.1 不可调用的接口

> 以下接口在代开发模式下**完全不可用**，调用会返回错误。

| 接口 | 路径 | 不可用原因 |
|------|------|-----------|
| 设置应用 | `POST /agent/set` | 代开发应用的配置在模版中完成，不支持 API 修改 |
| 创建应用 | `POST /agent/create` | 代开发应用通过授权安装，不支持 API 创建 |
| 第三方 OAuth2 | `POST /service/get_login_info` | 代开发使用自建应用的 OAuth2 流程 |
| 设置工作台模版 | `POST /agent/set_workbench_template` | 通过代开发模版配置 |
| 设置应用菜单 | `POST /menu/create` | 通过代开发模版配置 |

### 4.2 需要特殊权限的接口

> 以下接口需要在服务商管理后台**额外申请权限**后才能调用。

| 接口 | 权限要求 | 申请方式 |
|------|----------|----------|
| 获取成员手机号 | 需 OAuth2 用户主动授权 scope: snsapi_privateinfo | 应用模版配置 |
| 获取成员邮箱 | 需 OAuth2 用户主动授权 scope: snsapi_privateinfo | 应用模版配置 |
| 外部联系人相关 | 需申请「客户联系」权限 | 服务商后台 → 权限申请 |
| 客户群相关 | 需申请「客户联系」权限 | 服务商后台 → 权限申请 |
| 审批相关 | 需申请「审批」权限 | 服务商后台 → 权限申请 |
| 打卡相关 | 需申请「打卡」权限 | 服务商后台 → 权限申请 |
| 会议相关 | 需申请「会议」权限 | 服务商后台 → 权限申请 |
| 客服相关 | 需申请「微信客服」权限 | 服务商后台 → 权限申请 |
| 日程相关 | 需申请「日程」权限 | 服务商后台 → 权限申请 |
| 直播相关 | 需申请「直播」权限 | 服务商后台 → 权限申请 |

### 4.3 行为差异接口

> 以下接口在代开发模式下**可以调用**，但返回结果或行为与自建应用不同。

| 接口 | 路径 | 差异说明 |
|------|------|----------|
| 获取成员详情 | `GET /user/get` | 返回加密的 userid（2022.6.28 后新授权） |
| 获取部门成员 | `GET /user/simplelist` | 仅返回授权范围内的成员 |
| 获取部门成员详情 | `GET /user/list` | 仅返回授权范围内的成员，userid 加密 |
| 获取部门列表 | `GET /department/list` | 仅返回授权范围内的部门 |
| 获取外部联系人 | `GET /externalcontact/get` | 返回加密的 external_userid |
| 获取客户群详情 | `POST /externalcontact/groupchat/get` | 群成员 userid 加密 |
| 获取客户群列表 | `POST /externalcontact/groupchat/list` | 仅返回有权限的群 |
| JS-SDK 签名 | — | 使用 suite_jsapi_ticket 而非 jsapi_ticket |
| OAuth2 授权 | — | 使用 suite_id 作为 appid 参数 |
| 消息推送 | `POST /message/send` | touser 使用加密后的 userid |

### 4.4 授权范围影响

```
代开发应用的数据可见性由授权范围决定：

授权范围配置（企业管理员在授权时选择）
├── 全部成员 → 可访问所有部门和成员
├── 指定部门 → 仅可访问选定部门及其子部门的成员
└── 指定成员 → 仅可访问选定的个别成员

影响的接口：
├── 通讯录接口 → 仅返回授权范围内的数据
├── 消息发送 → 仅可向授权范围内的成员发送
├── 审批接口 → 仅可查看授权范围内成员的审批
└── 外部联系人 → 仅可获取授权范围内成员的客户
```

---

## 5. API 兼容性矩阵

> 列出各业务 API 在三种开发模式（自建应用 / 代开发应用 / 第三方应用）下的支持情况。

### 5.1 总览矩阵

| API 域 | 自建应用 | 代开发应用 | 第三方应用 | 备注 |
|--------|---------|-----------|-----------|------|
| 通讯录管理 | ✅ | ✅ (加密ID) | ✅ (加密ID) | 代开发受授权范围限制 |
| 应用消息 | ✅ | ✅ | ✅ | 消息对象使用加密 userid |
| 群聊消息 | ✅ | ✅ | ✅ | — |
| 客户联系 | ✅ | ✅ (需权限) | ✅ (需权限) | 需申请「客户联系」权限 |
| 客户群 | ✅ | ✅ (需权限) | ✅ (需权限) | 需申请「客户联系」权限 |
| 客户朋友圈 | ✅ | ✅ (需权限) | ✅ (需权限) | 异步接口 |
| 审批 | ✅ | ✅ (需权限) | ✅ (需权限) | 需申请「审批」权限 |
| 汇报 | ✅ | ✅ (需权限) | ❌ | 第三方应用不支持 |
| 会议 | ✅ | ✅ | ✅ | — |
| 日程 | ✅ | ✅ (需权限) | ✅ (需权限) | 需申请「日程」权限 |
| 直播 | ✅ | ✅ (需权限) | ✅ (需权限) | — |
| 微信客服 | ✅ | ✅ (需权限) | ✅ | 代开发需申请权限 |
| 素材管理 | ✅ | ✅ | ✅ | — |
| 打卡 | ✅ | ✅ (需权限) | ✅ (需权限) | — |
| 电子发票 | ✅ | ❌ | ❌ | 仅自建应用支持 |
| 应用管理 | ✅ | ❌ | ❌ | /agent/set 不可用 |
| JS-SDK | ✅ | ✅ (不同签名) | ✅ (不同签名) | 使用 suite_jsapi_ticket |
| OAuth2 | ✅ | ✅ (不同流程) | ✅ (不同流程) | appid 使用 suite_id |
| 网页授权登录 | ✅ | ✅ | ✅ | — |

### 5.2 凭证使用对比

| 操作 | 自建应用 | 代开发应用 | 第三方应用 |
|------|---------|-----------|-----------|
| 获取 Token | corpid + corpsecret | suite_id + suite_secret + suite_ticket → 再获取 corp_token | 同代开发 |
| 调用业务 API | access_token | corp_access_token | corp_access_token |
| 服务商级操作 | — | suite_access_token | suite_access_token |
| 身份验证登录 | — | provider_access_token | provider_access_token |
| JS-SDK 签名 | jsapi_ticket | suite_jsapi_ticket | suite_jsapi_ticket |
| OAuth2 appid | corpid | suite_id | suite_id |

### 5.3 关键差异总结

```
自建应用 → 代开发应用的核心差异：

1. 凭证体系：单层 → 三层（suite / corp / provider）
2. ID 安全：明文 → 加密（userid / external_userid / corpid）
3. 数据范围：全量 → 授权范围内
4. 应用配置：API 可控 → 模版预设
5. 回调机制：单企业 → 多企业复用同一回调 URL
6. 安装方式：管理员创建 → 授权安装
7. 上架审核：无需 → 需通过企业微信审核
```

---

## 6. ID 加密规则

> **重要**：2022 年 6 月 28 日后新授权的代开发/第三方应用，所有返回的 corpid / userid / external_userid 均为服务商主体加密后的值。

### 6.1 加密规则详情

| 字段 | 原始格式示例 | 加密后格式示例 | 说明 |
|------|-------------|---------------|------|
| corpid | `ww1234567890abcdef` | `wpXXXXXXXXXXXXXXXX` | 前缀变为 `wp` |
| userid | `zhangsan` | `woXXXXXXXXXXXXXXXX` | 加密后为定长字符串 |
| external_userid | `wmXXXXXX` | `wmXXXXXXXXXXXXXXXX` | 格式相似，值不同 |
| open_userid | — | `woXXXXXXXXXXXXXXXX` | 跨企业唯一 |

**关键特性**：

- 加密后的 ID 格式与原始 ID 相似，**无法从格式上区分**是否加密
- 同一用户在不同服务商下的加密 ID **不同**
- 加密 ID 在服务商维度下**全局唯一**，跨企业一致
- API 调用时使用加密 ID 即可，企业微信会自动解密

### 6.2 ID 转换接口

> 当需要在不同 ID 体系间转换时，使用以下接口。

| 转换方向 | 接口路径 | Token 类型 | 批量上限 |
|---------|----------|-----------|---------|
| userid → open_userid | `POST /batch/userid_to_openuserid` | corp_access_token | 1000/次 |
| open_userid → userid | `POST /batch/openuserid_to_userid` | corp_access_token | 1000/次 |
| corpid → opencorpid | `POST /service/corpid_to_opencorpid` | provider_access_token | 单个 |
| unionid → external_userid | `POST /externalcontact/unionid_to_external_userid` | corp_access_token | 单个 |
| external_userid → pending_id | `POST /externalcontact/get_new_external_userid` | corp_access_token | 1000/次 |

### 6.3 ID 加密处理最佳实践

```python
# Python 示例：ID 转换工具类

class WeCOMIDConverter:
    """代开发应用 ID 转换工具。

    使用场景：
    1. 多企业数据汇总时，需要统一 ID 体系
    2. 从自建应用迁移数据到代开发应用时
    3. 跨企业查找同一用户时
    """

    def __init__(self, client):
        self.client = client

    async def batch_userid_to_open(
        self, userid_list: list[str]
    ) -> dict[str, str]:
        """批量将 userid 转换为 open_userid。

        Args:
            userid_list: userid 列表，单次最多 1000 个

        Returns:
            {userid: open_userid} 映射字典
        """
        result = {}
        # 分批处理，每批最多 1000 个
        for i in range(0, len(userid_list), 1000):
            batch = userid_list[i:i + 1000]
            resp = await self.client.post(
                "/batch/userid_to_openuserid",
                json={"userid_list": batch},
            )
            for item in resp.get("open_userid_list", []):
                result[item["userid"]] = item["open_userid"]
        return result

    async def corpid_to_open(self, corpid: str) -> str:
        """将 corpid 转换为 opencorpid。

        注意：此接口需使用 provider_access_token。
        """
        resp = await self.client.post(
            "/service/corpid_to_opencorpid",
            json={"corpid": corpid},
        )
        return resp["open_corpid"]
```

```java
// Java 示例：ID 转换工具类
package com.wecom.isv;

import java.util.*;
import java.util.stream.Collectors;

public class WeComIDConverter {
    /**
     * 代开发应用 ID 转换工具。
     *
     * 使用场景：
     * 1. 多企业数据汇总时，需要统一 ID 体系
     * 2. 从自建应用迁移数据到代开发应用时
     * 3. 跨企业查找同一用户时
     */

    private final WeComClient client;

    public WeComIDConverter(WeComClient client) {
        this.client = client;
    }

    /**
     * 批量将 userid 转换为 open_userid。
     *
     * @param useridList userid 列表，自动分批，每批最多 1000 个
     * @return {userid: open_userid} 映射
     */
    public Map<String, String> batchUseridToOpen(List<String> useridList) throws WeComException {
        Map<String, String> result = new HashMap<>();
        // 分批处理，每批最多 1000 个
        for (int i = 0; i < useridList.size(); i += 1000) {
            List<String> batch = useridList.subList(i, Math.min(i + 1000, useridList.size()));

            Map<String, Object> body = new HashMap<>();
            body.put("userid_list", batch);

            JsonObject resp = client.post("/batch/userid_to_openuserid", body);

            for (JsonElement item : resp.getAsJsonArray("open_userid_list")) {
                JsonObject obj = item.getAsJsonObject();
                result.put(
                    obj.get("userid").getAsString(),
                    obj.get("open_userid").getAsString()
                );
            }
        }
        return result;
    }

    /**
     * 将 corpid 转换为 opencorpid。
     * 注意：此接口需使用 provider_access_token。
     *
     * @param corpid 企业 corpid
     * @return opencorpid
     */
    public String corpidToOpen(String corpid) throws WeComException {
        Map<String, Object> body = new HashMap<>();
        body.put("corpid", corpid);

        JsonObject resp = client.post("/service/corpid_to_opencorpid", body);
        return resp.get("open_corpid").getAsString();
    }
}
```

```php
<?php
// PHP 示例：ID 转换工具类
namespace WeComISV;

/**
 * 代开发应用 ID 转换工具。
 *
 * 使用场景：
 * 1. 多企业数据汇总时，需要统一 ID 体系
 * 2. 从自建应用迁移数据到代开发应用时
 * 3. 跨企业查找同一用户时
 */
class WeComIDConverter
{
    private WeComClient $client;

    public function __construct(WeComClient $client)
    {
        $this->client = $client;
    }

    /**
     * 批量将 userid 转换为 open_userid。
     *
     * @param  string[] $useridList userid 列表，自动分批，每批最多 1000 个
     * @return array<string, string> [userid => open_userid] 映射
     * @throws WeComException
     */
    public function batchUseridToOpen(array $useridList): array
    {
        $result = [];
        // 分批处理，每批最多 1000 个
        foreach (array_chunk($useridList, 1000) as $batch) {
            $resp = $this->client->post('/batch/userid_to_openuserid', [
                'userid_list' => $batch,
            ]);

            foreach ($resp['open_userid_list'] ?? [] as $item) {
                $result[$item['userid']] = $item['open_userid'];
            }
        }
        return $result;
    }

    /**
     * 将 corpid 转换为 opencorpid。
     * 注意：此接口需使用 provider_access_token。
     *
     * @param  string $corpid 企业 corpid
     * @return string opencorpid
     * @throws WeComException
     */
    public function corpidToOpen(string $corpid): string
    {
        $resp = $this->client->post('/service/corpid_to_opencorpid', [
            'corpid' => $corpid,
        ]);
        return $resp['open_corpid'];
    }
}
```

### 6.4 ID 加密时间线

```
ID 安全升级时间线：

2022-06-20  官方公告发布，预告 ID 加密变更
2022-06-28  新授权应用开始返回加密 ID
            ├── 新安装的代开发应用 → 自动使用加密 ID
            └── 已安装的应用 → 暂不影响，需主动升级
2023-xx-xx  存量应用强制升级截止日期（以官方通知为准）

注意事项：
├── 开发环境和生产环境使用相同的加密规则
├── 数据库中存储的旧 ID 需要做迁移映射
├── 回调事件中的 ID 也是加密后的
└── webhook 机器人不受 ID 加密影响
```

---

## 7. IP 白名单

### 7.1 配置说明

| 配置项 | 说明 |
|--------|------|
| 配置位置 | 服务商管理后台 → 服务商信息 → 基本信息 → IP白名单 |
| 影响范围 | 所有代开发应用模版共享同一 IP 白名单 |
| 支持格式 | 单个 IP（如 `1.2.3.4`）或 CIDR 网段（如 `1.2.3.0/24`） |
| 未配置行为 | 不限制（**强烈不推荐**，存在安全风险） |
| 生效时间 | 配置后立即生效 |
| 数量限制 | 最多 200 个 IP/网段 |

### 7.2 常见场景配置

```
场景一：固定服务器部署
├── 直接添加服务器公网 IP
└── 示例：1.2.3.4

场景二：云函数/Serverless 部署
├── 使用 NAT 网关固定出口 IP
├── 将 NAT 网关 IP 添加到白名单
└── 示例：使用 AWS NAT Gateway / 阿里云 NAT 网关

场景三：Kubernetes 集群
├── 使用 LoadBalancer 或 Ingress 的出口 IP
├── 或配置 SNAT 规则统一出口
└── 添加所有可能的出口 IP

场景四：开发环境调试
├── 添加开发者本地公网 IP（动态 IP 需频繁更新）
├── 推荐使用固定 IP 的代理服务器
└── 或使用内网穿透工具（如 ngrok）配合固定 IP
```

### 7.3 排查 IP 白名单问题

```
收到错误码 60020（IP 不在白名单）排查步骤：

1. 确认实际出口 IP
   $ curl -s https://httpbin.org/ip
   → 获取服务器的真实出口 IP

2. 检查是否经过代理
   ├── 反向代理（Nginx/HAProxy）→ 检查代理服务器的出口 IP
   ├── CDN → CDN 回源 IP 不固定，不推荐通过 CDN 调用
   └── VPN → 检查 VPN 出口 IP

3. 检查是否为 IPv6
   └── 企业微信白名单仅支持 IPv4

4. 确认白名单配置
   └── 服务商管理后台 → 服务商信息 → 基本信息 → IP白名单
```

---

## 8. 版本兼容与迁移

### 8.1 自建应用迁移到代开发

> 当企业从自建应用迁移到代开发应用时，需要注意以下事项。

```
迁移步骤：

阶段一：准备
├── 1. 注册服务商账号并完成认证
├── 2. 创建代开发应用模版（功能对齐自建应用）
├── 3. 配置回调 URL 和 IP 白名单
├── 4. 申请所需 API 权限
└── 5. 提交应用审核

阶段二：代码改造
├── 1. 凭证体系改造
│   ├── 单 token → 三级 token 体系
│   ├── 实现 suite_ticket 接收与缓存
│   └── 实现 corp_access_token 按企业缓存
├── 2. ID 体系改造
│   ├── 所有 userid 字段适配加密 ID
│   ├── 数据库 ID 字段扩容（加密 ID 更长）
│   └── 实现 ID 转换逻辑（如需关联旧数据）
├── 3. 回调改造
│   ├── 单企业回调 → 多企业复用同一 URL
│   ├── 增加 SuiteID 维度的消息路由
│   └── 实现授权生命周期事件处理
├── 4. 移除不兼容接口
│   ├── 删除 /agent/set 调用
│   └── 替换 OAuth2 流程（appid → suite_id）
└── 5. 适配授权范围限制
    └── 通讯录/消息等接口添加范围检查

阶段三：数据迁移
├── 1. 导出自建应用的业务数据
├── 2. ID 映射表（旧 userid → 加密 userid）
├── 3. 验证数据完整性
└── 4. 灰度切换（部分企业先迁移验证）

阶段四：上线切换
├── 1. 企业管理员安装代开发应用
├── 2. 禁用旧自建应用
├── 3. 监控新应用运行状态
└── 4. 完全下线旧应用
```

### 8.2 permanent_code 版本说明

| 版本 | 说明 | 获取方式 |
|------|------|----------|
| v1 | 早期版本，部分接口不支持 | 2022 年前的授权 |
| v2 | 当前版本，支持所有新接口 | 2022 年后的授权 |

**升级说明**：

- 存量企业的 permanent_code 不会自动升级
- 企业重新授权后会获得 v2 版本的 permanent_code
- v1 和 v2 的 permanent_code 格式相同，行为不同
- 建议引导存量企业重新授权以获取 v2 permanent_code

### 8.3 ID 安全升级影响

```
ID 安全升级对代开发应用的影响：

受影响的数据字段：
├── userid → 加密 userid
├── external_userid → 加密 external_userid
├── corpid → opencorpid（部分接口）
├── 部门 ID → 不加密（数字类型，不变）
└── 标签 ID → 不加密（数字类型，不变）

受影响的接口返回值：
├── 通讯录接口（GET /user/get, /user/list 等）
├── 外部联系人接口（GET /externalcontact/get 等）
├── 消息接口中的发送者/接收者 ID
├── 回调事件中的 UserID / ExternalUserID
└── OAuth2 返回的 UserId

不受影响的场景：
├── 接口入参中使用加密 ID（系统自动解密）
├── 部门 ID 和标签 ID（数字类型）
├── 应用 agentid（数字类型）
└── 素材 media_id
```

---

## 9. FAQ

### Q1: 代开发应用和第三方应用的区别？

```
代开发应用 vs 第三方应用：

共同点：
├── 都通过服务商身份开发
├── 都使用三级凭证体系（suite / corp / provider）
├── 都需要处理 suite_ticket 推送
└── 都存在 ID 加密

核心区别：
├── 安装方式
│   ├── 代开发：一对一定制，服务商为特定企业开发
│   └── 第三方：一对多通用，上架到应用市场供多企业安装
├── 应用归属
│   ├── 代开发：安装后属于企业的自建应用
│   └── 第三方：始终属于第三方应用
├── 模版管理
│   ├── 代开发：使用代开发模版，一个模版对应一个应用
│   └── 第三方：无需模版，直接创建应用
├── 上架要求
│   ├── 代开发：需通过审核，但不上架市场
│   └── 第三方：需通过审核并上架市场
└── 数据隔离
    ├── 代开发：企业数据完全隔离
    └── 第三方：服务商可聚合多企业数据
```

### Q2: 如何从自建应用迁移到代开发？

参见第 8.1 节「自建应用迁移到代开发」的详细步骤。

核心注意事项：
1. **凭证改造**是最大工作量，需从单 token 改为三级 token
2. **ID 改造**影响数据库设计，提前规划字段长度
3. **灰度迁移**降低风险，不要一次性全量切换
4. 迁移期间新旧应用可**并行运行**，确认无误后下线旧应用

### Q3: suite_ticket 丢失怎么办？

```
suite_ticket 恢复流程：

1. 等待下一次自动推送（每 10 分钟一次）
   └── 企业微信会持续推送 suite_ticket 到回调 URL

2. 如果回调 URL 不通：
   ├── 检查回调 URL 是否可达
   ├── 检查回调配置（Token / EncodingAESKey）
   ├── 确认回调 URL 返回正确的解密响应
   └── 修复后等待下一次推送

3. 紧急恢复：
   └── 不存在手动触发 suite_ticket 推送的接口
       ├── 必须等待自动推送
       └── 确保回调服务可用，持久化存储 ticket

4. 预防措施：
   ├── suite_ticket 持久化到数据库/Redis（不仅内存）
   ├── 设置回调服务高可用（多副本 + 健康检查）
   ├── 监控 suite_ticket 接收情况
   └── 超过 15 分钟未收到 ticket 时告警
```

### Q4: 如何在开发环境调试代开发应用？

```
开发环境调试方案：

方案一：内网穿透（推荐）
├── 使用 ngrok / frp / natapp 等工具
├── 将回调 URL 指向内网穿透的公网地址
├── 在服务商后台配置穿透后的回调 URL
└── 注意：穿透服务的 IP 需加入白名单

方案二：独立测试模版
├── 创建专用的测试代开发模版
├── 回调 URL 指向测试服务器
├── 使用测试企业授权安装
└── 生产和测试模版独立，互不影响

方案三：日志 + 回放
├── 生产环境记录所有回调请求
├── 本地回放请求进行调试
└── 适合排查已发生的问题

调试注意事项：
├── 测试企业建议使用免费的试用企业
├── 开发环境的 suite_id / suite_secret 要与后台一致
├── 开发者 IP 要加入 IP 白名单
└── 避免开发环境和生产环境使用同一个 suite_ticket 缓存
```

### Q5: 多个代开发模版如何管理？

```
多模版管理策略：

架构设计：
├── 每个模版对应一个 suite_id
├── 所有模版共享同一回调 URL（推荐）
│   └── 通过 SuiteId 字段路由到不同处理逻辑
├── 所有模版共享同一 IP 白名单
└── 每个模版独立的 suite_secret 和 Token/AES Key

配置管理：
├── 使用配置文件/环境变量管理多套凭证
├── 建议使用 suite_id 作为 key 的字典结构
└── 示例：
    SUITES = {
        "suite_id_1": {
            "secret": "...",
            "token": "...",
            "aes_key": "...",
        },
        "suite_id_2": { ... },
    }

回调路由：
├── 解密回调消息后获取 SuiteId
├── 根据 SuiteId 查找对应配置
├── 使用对应配置处理业务逻辑
└── suite_ticket 按 suite_id 分别缓存

企业授权管理：
├── 一个企业可以授权安装多个代开发应用
├── 每个授权独立的 permanent_code
├── corp_access_token 按 (suite_id, corpid) 二元组缓存
└── 数据隔离：不同模版的数据不共享
```

### Q6: 代开发应用如何处理企业取消授权？

```
企业取消授权处理：

1. 接收回调通知
   └── InfoType: cancel_auth
       ├── SuiteId: 模版 suite_id
       ├── AuthCorpId: 取消授权的企业 corpid
       └── Timestamp: 取消时间

2. 清理缓存数据
   ├── 删除该企业的 corp_access_token 缓存
   ├── 删除该企业的 permanent_code 缓存
   └── 标记该企业状态为「已取消授权」

3. 处理业务数据
   ├── 停止向该企业发送消息
   ├── 停止该企业的定时任务
   ├── 保留业务数据（可能会重新授权）
   └── 根据合规要求决定数据保留策略

4. 注意事项
   ├── 取消授权后 permanent_code 立即失效
   ├── corp_access_token 也立即失效
   ├── 企业重新授权后会获得新的 permanent_code
   └── 旧的加密 ID 与新授权后的加密 ID 保持一致
```

---

## 10. References

### 10.1 官方文档

| 文档 | 链接 |
|------|------|
| 服务商代开发概述 | https://developer.work.weixin.qq.com/document/path/97159 |
| 代开发应用凭证 | https://developer.work.weixin.qq.com/document/path/97165 |
| 代开发授权流程 | https://developer.work.weixin.qq.com/document/path/97112 |
| 回调配置 | https://developer.work.weixin.qq.com/document/path/97163 |
| ID 安全升级 | https://developer.work.weixin.qq.com/document/path/98980 |
| License 管理 | https://developer.work.weixin.qq.com/document/path/96518 |
| 全局错误码 | https://developer.work.weixin.qq.com/document/path/90313 |
| 接口频率限制 | https://developer.work.weixin.qq.com/document/path/90312 |
| JS-SDK 说明 | https://developer.work.weixin.qq.com/document/path/90547 |
| OAuth2 说明 | https://developer.work.weixin.qq.com/document/path/91022 |

### 10.2 关联 SKILL 文档

| SKILL | 文件路径 |
|-------|----------|
| wecom-isv-core | `skills/wecom-isv-core.md` |
| wecom-isv-auth | `skills/wecom-isv-auth.md` |
| wecom-isv-callback | `skills/wecom-isv-callback.md` |
| wecom-isv-license | `skills/wecom-isv-license.md` |
| wecom-isv-billing | `skills/wecom-isv-billing.md` |
| wecom-isv-provider | `skills/wecom-isv-provider.md` |
| wecom-isv-jssdk | `skills/wecom-isv-jssdk.md` |
| wecom-isv-appendix | `skills/wecom-isv-appendix.md` |

### 10.3 服务商管理后台

| 资源 | 地址 |
|------|------|
| 服务商管理后台 | https://open.work.weixin.qq.com |
| 企业管理后台 | https://work.weixin.qq.com/wework_admin |
| 开发者社区 | https://developer.work.weixin.qq.com/community |

### 10.4 开发工具与 SDK

| 工具/SDK | 说明 | 地址 |
|---------|------|------|
| 企业微信回调调试工具 | 官方提供的回调解密验证工具 | 管理后台 → 开发者工具 |
| 加解密库 | 官方提供的各语言加解密示例 | https://developer.work.weixin.qq.com/document/path/90307 |
| 接口调试工具 | 在线 API 调用调试 | 管理后台 → 开发者工具 → 接口调试 |
| WeCom SDK (Python) | 社区维护的 Python SDK | GitHub 搜索 `wechatwork-sdk` |
| WeCom SDK (Go) | 社区维护的 Go SDK | GitHub 搜索 `go-workwx` |

---

> **本附录持续更新**。如在使用其他 `wecom-isv-*` SKILL 过程中遇到未收录的错误码或限制，请反馈补充。
