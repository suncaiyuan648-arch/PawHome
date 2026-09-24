# C0 adoptionFlow Route Migration Handoff

日期：2026-09-19  
范围：`pages/meMore/adoptionFlow.vue` 跨域进度壳清理

## 结论

旧 `/pages/meMore/adoptionFlow` 已从 `pages.tson` 删除，源文件已移除。领养和救助进度分别由职责明确的 canonical 页面承载：

```text
/packages/adoption/pages/progress/index?applicationId=<applicationId>
/packages/rescue/pages/progress/index?rescueId=<rescueId>
```

旧 `type/source/sourceType`、`id/recordId/rescueId` 分派逻辑不再由生产页面执行。`navigation/legacyRoutes.ts` 保留旧链接的只读兼容解析，解析后返回上述 canonical route；冲突、缺少 ID 和跨域参数仍 fail-closed。

## 已完成改动

- 删除 `pages/meMore/adoptionFlow.vue` 及其 `pages/meMore` 页面注册。
- `pages/adoption/result.vue` 的领养结果 80 态改用 `adoption.progress` 合同，不再生成旧 frame URL。
- `PawAdoptionFlowFigma` 的历史 frame 入口（仍作为本地遗留组件材料保留）改为生成 `adoption.progress`；frame 48/49 映射为 `view=adoption-info/application`，其余状态由 canonical 单据状态派生。
- Figma map 的 `flow_progress_reward` 指向 `packages/adoption/pages/progress/index.vue`，查询改为显式 `applicationId`。
- 路由矩阵 R23、总工台账与设计 QA 入口已标记旧壳清理和 canonical 分域结果。

## 边界

旧 `PawAdoptionFlowFigma` 组件及其专用素材暂保留为历史设计/资源审计材料；它不再由注册页面或生产 caller 引用。后续资源清理需要先同步更新现有 WebP 像素验收测试和资产归属记录，避免在本批误删设计基线。

`pages/yard/*` 的创建、认证、管理动物、编辑动物和品种选择尚未在本批删除：当前对应的 canonical package 页面尚未全部存在，直接改注册会导致有效入口丢失。它们按 R52–R57 继续拆分，`pages/dev/*` 保持不变。

## 验收命令

```text
npm run check:figma-map
npm run check:routes
node --test tests/governance/route-contracts.test.cjs tests/governance/c0-route-cleanup.test.cjs
git diff --check
```

未接入真实后端，也未执行领养、救助、支付或其它真实业务写入。
