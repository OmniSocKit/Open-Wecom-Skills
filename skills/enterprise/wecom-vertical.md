---
name: wecom-vertical
description: |
  企业微信行业垂直应用 SKILL — 家校沟通/家校应用、政民沟通（居民上报/巡查上报/网格管理）、
  企业互联、上下游管理、小程序对外收款
version: 1.0.0
domain: vertical
depends_on: wecom-core
doc_ids: [16678, 16881, 17911, 17912, 39090, 18903, 19031, 17929, 17427, 16504, 18820, 19804, 32243, 18815, 18821, 18825, 18904, 18834, 18911, 19143, 19151, 19181, 19145, 19153, 19149, 18819, 18835, 19139, 19870, 18816, 18837, 18839, 18840, 19199, 23095, 22028, 22038, 22041, 22062, 21632, 21636, 21657, 21653, 25244, 39112, 39116, 30127, 30132, 25813, 25638, 25637, 25635, 25634, 25908, 25636, 25814, 25653, 25652, 25650, 25649, 25651, 25914, 30068, 30078, 30079, 30080, 30081, 30633, 30082, 30083, 30084, 30455, 24909, 24919, 25574, 25951, 38131, 38133, 38134, 38135, 38136, 39114, 38768, 38773, 35438, 38752, 38769, 38785, 43913, 43918, 42599, 35987, 43378, 43090, 43091, 43092, 45655, 43147, 43336, 43149, 43151, 14744]
api_count: 90
triggers:
  - 家校
  - 家校沟通
  - 学生
  - 家长
  - 政民沟通
  - 居民上报
  - 巡查上报
  - 网格
  - 企业互联
  - 上下游
  - 对外收款
  - 小程序下单
  - 收款
  - 公费电话
---

# WeCom Vertical SKILL (wecom-vertical)

> 企业微信行业垂直应用 SKILL：覆盖家校沟通、家校应用（健康上报/上课直播/班级收款）、
> 政民沟通（居民上报/巡查上报/网格管理/事件类别）、企业互联、上下游管理、
> 小程序对外收款、公费电话等多个垂直领域，共 90+ 个 API。

---

## 1. 家校沟通

### 1.1 概述

家校沟通是面向教育行业的解决方案，包含学生/家长管理、部门管理、通知发送等。

### 1.2 核心 API

| 子域 | API 数量 | 说明 |
|------|---------|------|
| 网页授权 | 4 | 获取家校访问用户身份 |
| 通讯录回调 | 2 | 成员/部门变更事件 |
| 基础接口 | 6 | 学校通知/二维码/外部联系人转换 |
| 学生管理 | 9 | CRUD（单个/批量） |
| 家长管理 | 9 | CRUD（单个/批量） |
| 部门管理 | 6 | CRUD + 年级对照 |

### 1.3 关键接口

```python
# 学生管理
client.post("/school/user/create", json={"student_userid": "stu001", ...})
client.post("/school/user/delete", json={"userid": "stu001"})
client.post("/school/user/get", json={"userid": "stu001"})
client.post("/school/department/list", json={"id": 1})

# 发送学校通知
client.post("/externalcontact/message/send", json={
    "chat_type": "single",
    "external_userid": ["parent_001"],
    "msgtype": "text",
    "text": {"content": "家长您好，..."},
})
```

---

## 2. 家校应用

### 2.1 健康上报

| # | 接口 | Endpoint |
|---|------|----------|
| H1 | 获取使用统计 | `health/get_health_report_stat` |
| H2 | 获取任务ID列表 | `health/get_report_jobids` |
| H3 | 获取任务详情 | `health/get_report_job_info` |
| H4 | 获取用户填写答案 | `health/get_report_answer` |

### 2.2 复学码

| # | 接口 | Endpoint |
|---|------|----------|
| FC1 | 获取老师健康信息 | `health/get_teacher_report` |
| FC2 | 获取学生健康信息 | `health/get_student_report` |
| FC3 | 获取师生健康码 | `health/get_health_code` |

### 2.3 上课直播

| # | 接口 | Endpoint |
|---|------|----------|
| L1 | 获取老师直播ID列表 | `school/living/get_living_id` |
| L2 | 获取直播详情 | `school/living/get_living_info` |
| L3 | 获取观看直播统计 | `school/living/get_watch_stat` |
| L4 | 获取未观看统计 | `school/living/get_unwatch_stat` |

### 2.3 班级收款

| # | 接口 | Endpoint |
|---|------|----------|
| B1 | 获取学生付款结果 | `school/get_payment_result` |
| B2 | 获取订单详情 | `school/get_trade` |

---

## 3. 政民沟通

### 3.1 居民上报

| # | 接口 | Endpoint |
|---|------|----------|
| G1 | 获取网格及负责人 | `report/grid/get_grid_info` |
| G2 | 获取单位统计 | `report/resident/get_grid_info` |
| G3 | 获取个人统计 | `report/resident/get_user_info` |
| G4 | 获取事件分类统计 | `report/resident/get_category_statistic` |
| G5 | 获取事件列表 | `report/resident/get_order_list` |
| G6 | 获取事件详情 | `report/resident/get_order_info` |

### 3.2 巡查上报

| # | 接口 | Endpoint |
|---|------|----------|
| P1-P6 | 与居民上报对称 | `report/patrol/*` |

### 3.3 网格管理

| # | 接口 | Endpoint |
|---|------|----------|
| N1 | 添加网格 | `report/grid/add` |
| N2 | 编辑网格 | `report/grid/update` |
| N3 | 删除网格 | `report/grid/delete` |
| N4 | 获取网格列表 | `report/grid/list` |

### 3.4 事件类别管理

| # | 接口 | Endpoint |
|---|------|----------|
| E1 | 添加事件类别 | `report/category/add` |
| E2 | 修改事件类别 | `report/category/update` |
| E3 | 删除事件类别 | `report/category/delete` |
| E4 | 获取事件类别列表 | `report/category/list` |

---

## 4. 企业互联

| # | 接口 | Endpoint |
|---|------|----------|
| C1 | 获取应用共享信息 | `corpgroup/corp/list_app_share_info` |
| C2 | 获取下级企业 access_token | `corpgroup/corp/gettoken` |
| C3 | 获取下级企业小程序 session | `miniprogram/transfer_session` |

---

## 5. 上下游管理

### 5.1 上下游规则

| # | 接口 | Endpoint |
|---|------|----------|
| U1 | 获取对接规则列表 | `corpgroup/rule/list_ids` |
| U2 | 获取规则详情 | `corpgroup/rule/get_rule_info` |
| U3 | 新增规则 | `corpgroup/rule/add_rule` |
| U4 | 更新规则 | `corpgroup/rule/modify_rule` |
| U5 | 删除规则 | `corpgroup/rule/delete_rule` |

### 5.2 上下游通讯录

| # | 接口 | Endpoint |
|---|------|----------|
| U6 | 获取上下游信息 | `corpgroup/corp/get_chain_info` |
| U7 | 批量导入联系人 | `corpgroup/import_chain_contact` |
| U8 | 移除企业 | `corpgroup/corp/remove_corp` |
| U9 | 获取异步任务结果 | `corpgroup/getresult` |

### 5.3 回调

- `chain_change`：上下游变更
- `batch_job_result`：异步任务完成

---

## 6. 小程序对外收款

| # | 接口 | Endpoint |
|---|------|----------|
| MP1 | 小程序下单 | `miniapppay/create_order` |
| MP2 | 查询订单 | `miniapppay/get_order` |
| MP3 | 关闭订单 | `miniapppay/close_order` |
| MP4 | 获取支付签名 | `miniapppay/get_pay_sign` |
| MP5 | 申请退款 | `miniapppay/refund` |
| MP6 | 查询退款 | `miniapppay/get_refund` |
| MP7 | 交易账单申请 | `miniapppay/get_bill` |

### 回调

- `miniapppay_notify`：支付通知
- `miniapppay_refund_notify`：退款通知

---

## 7. 公费电话

| # | 接口 | Endpoint |
|---|------|----------|
| T1 | 获取拨打记录 | `dial/get_dial_record` |

---

## 8. Gotcha Guide

### G1. 家校沟通的通讯录与企业通讯录独立
家校通讯录（学生/家长/部门）使用独立的 API（`/school/*`），不与企业通讯录互通。

### G2. 政民沟通需要政务版企业微信
居民上报和巡查上报功能需要政务版企业微信，普通企业版不可用。

### G3. 企业互联的 access_token 范围
获取下级企业的 access_token 只能访问下级企业授权给上级的部分数据。

### G4. 上下游批量导入是异步的
`import_chain_contact` 是异步接口，需要通过回调或轮询 `getresult` 获取结果。

### G5. 小程序对外收款需要微信支付
需要企业已开通微信支付商户号，且在企业微信管理后台完成对外收款配置。

---

## 9. 代码模板

### 9.1 Java 示例

```java
public class WecomVerticalService {
    private final WeComClient client;

    public WecomVerticalService(WeComClient client) {
        this.client = client;
    }

    /**
     * 使用示例：调用 wecom-vertical 相关 API
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

### 9.2 PHP 示例

```php
<?php
class WecomVerticalService
{
    private WeComClient $client;

    public function __construct(WeComClient $client) { $this->client = $client; }

    /**
     * 使用示例：调用 wecom-vertical 相关 API
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

---

## 10. References

| doc_id 范围 | 说明 |
|------------|------|
| 16678-23095 | 家校沟通 |
| 22028-39116 | 家校应用 |
| 25813-30455 | 政民沟通 |
| 24909-25951 | 企业互联 |
| 38131-43918 | 上下游管理 |
| 43090-43151 | 小程序对外收款 |
| 14744 | 公费电话 |

**依赖 SKILL**：`wecom-core`
