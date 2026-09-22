# G-ADOPTION-review-adapter：领养审核只读 adapter 子批

日期：2026-09-16  
执行人：治理 coder（Luna / xhigh）  
范围：`packages/adoption/services/reviewAdapter.js`、领养审核治理测试  
状态：待总工程师验收；未暂存、未提交、未上传、未发布

## 交付结论

本批新增领养审核只读 adapter，将现有 `navigation/adoptionReviewContract.js` 绑定到 `utils/adoptionStorage.js` 的 `PAWHOME_ADOPTIONS` 读取边界：

- `readAdoptionReviewList` / `getAdoptionReviewList`：从真实持久化记录读取审核队列，支持明确的 `reviewerRole`（`owner`、`cloud_parent`、`reviewer`）和审核状态筛选。
- `readAdoptionReviewDetail` / `getAdoptionReviewDetail`：按 `reviewItemId` 精确定位，传入 `applicationId` 时同时要求应用 ID 精确匹配；没有首条、末条、申请人或演示数据兜底。
- 所有读取都固定调用 `getAdoptionRecords({ includeDemo: false })`，不读取第二个 storage key，不消费旧 `adoptionReviewMockApi` 的配置卡片。
- 每次调用均重新交给 canonical contract 解析可信 actor；`role`、`query`、`managed`、`state`、`includeDemo`、`records`、`resolver` 和 `perspective` 等调用方字段不能改变身份、审核关系、状态或数据来源。审核详情强制 reviewer 分支，不能经由 `perspective: 'applicant'` 取得申请人详情。
- storage 规范化产生的空 `ownerPawId` / `cloudParentPawId` 兼容别名只被识别为空缺；任何真实的非空别名冲突、跨域 ID、状态冲突、关系冲突、阶段不一致仍由 canonical contract 拒绝。
- 返回的列表、详情、条目、诊断和错误快照均为只读模型，`readOnly: true`、`canWrite: false`，无审核、更新、删除、提交或支付 API。

## 文件与边界

| 文件 | 作用 |
| --- | --- |
| `packages/adoption/services/reviewAdapter.js` | 真实 `PAWHOME_ADOPTIONS` 读取绑定、reviewer role 选择、精确 ID 查找、只读错误模型 |
| `tests/governance/adoption-review-adapter.test.cjs` | 8 个 focused 测试，覆盖正向读取和授权/数据边界反例 |

没有新增页面、组件、路由、分包入口或 storage key；没有改动 `adoptionReviewContract.js`、`adoptionStorage.js` 的状态机和写入函数。adapter 不接受外部 records/resolver，避免测试 seam 变成生产提权入口。

## 反例测试覆盖

`node --test tests/governance/adoption-review-adapter.test.cjs`：**8/8 PASS**。

覆盖内容：

1. persisted-only 列表和明确 reviewer role；调用方伪造 records/resolver/query/role/managed/state/includeDemo 不生效。
2. 详情按 `applicationId` + `reviewItemId` 精确关联，错误任一 ID 返回 `NOT_FOUND`。
3. applicant actor、其他院主和跨用户记录无法进入审核队列或读取审核详情。
4. 演示记录默认排除，`includeDemo: true` 及 query 注入不能打开演示数据。
5. application/review status、owner 关系、跨域和跨域 review ID 冲突逐条 fail-closed。
6. `uni.getStorageSync` 异常只返回空只读模型，不写回 storage。
7. 异步 actor provider、异步/外部 resolver 注入不能成为数据或身份来源。
8. 成功列表、详情、条目、pending/diagnostics 快照深冻结。

独立语法检查：

```text
node --check packages/adoption/services/reviewAdapter.js
```

结果：PASS。`git diff --check`：PASS。

## 总工程师验收边界

本批只完成 adapter 子批，尚未把页面接入该 adapter，也没有把旧 `pages/yard/adoptionAudit.vue` 的卡片 mock 迁移到新 contract。后续应单独治理：

- 审核列表页按 `reviewerRole` 接入只读 queue；
- 审核详情页按 `reviewItemId` 与 `applicationId` 接入 detail；
- 审核操作写入、重复提交、云家长多选策略和真实后端 resolver 另立写边界；
- 在用户已打开的微信开发者工具中做路由、Console、交互、几何和 Figma 视觉验收。

本 handoff 不宣称页面接入、UI 验收或真实审核动作已经完成。
