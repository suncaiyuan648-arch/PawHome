# PKG-MEMORE-ADOPTION-ASSETS：领养流程私有静态资源归属审计

日期：2026-09-15  
执行人：治理 coder（Luna / xhigh）+ 总工程师续作  
范围：`pages/meMore/components/PawAdoptionFlowFigma.vue`、根 `static/figma/adoption-flow/`、`pages/meMore/static/`、生产资源归属与分包体积  
状态：已通过总工程师独立验收；未提交、未上传、未发布

## 结论

全仓精确引用审计确认下列 3 个图片只由 `PawAdoptionFlowFigma.vue` 生产使用，已从根 `static/` 下沉到 `pages/meMore/static/figma/adoption-flow/`：

| 资源 | 原路径 | 新路径 | 生产调用方 | 源码 SHA-256 | 源码字节 |
|---|---|---|---|---|---:|
| `e435a06f02d1fc46102464a34d8d58adf66e97bb.png` | `static/figma/adoption-flow/...` | `pages/meMore/static/figma/adoption-flow/...` | `pages/meMore/components/PawAdoptionFlowFigma.vue:180` | `b4b8aa8a30b7f8b6759af00625dfe1fd1f1279580d7d6ac2c66b471550c60823` | 223,189 |
| `06034d7f1be7897c6f56e74b047d3499044297a1.png` | `static/figma/adoption-flow/...` | `pages/meMore/static/figma/adoption-flow/...` | `pages/meMore/components/PawAdoptionFlowFigma.vue:181` | `49bacc1a1780d8ec06e1e17be5dc4ce8cd1cb7d0361e04ed0c74bff1cdcd485a` | 297,723 |
| `07acee523d24ba7ebaf21ec60dee542f1e3fdcd4.png` | `static/figma/adoption-flow/...` | `pages/meMore/static/figma/adoption-flow/...` | `pages/meMore/components/PawAdoptionFlowFigma.vue:184` | `ed2c95e01e025bdc2294b3c7954d3be513c1cefe80394c37faca23ac948a9f71` | 562,636 |

源码模板中的 `/static/figma/adoption-flow/...` URL 保持不变；现有资源管线将包内静态文件复制到 `pages/meMore/static/`，没有增加页面级别的别名或重复副本。

## 明确保留的共享资源

以下两个同目录资源未迁移，因为它们仍有主包或其他分包生产调用方：

- `45f5fc6ea328c9e88cff7a4504824254458e9e7b.png`：领养流程组件之外，`pages/feature/index.vue` 与其他主包产物仍引用同内容资源；继续保留 `static/figma/adoption-flow/`。
- `db5da0781d7667c3490af5cfa74dd2fc7cf1ac01.png`：`utils/juryMock.js`、`utils/rescueStorage.js` 等主包共享 mock/存储模块仍引用；继续保留根目录资源。

本批没有移动 `04a93fa17267335f49e6e818f8caa78dd3afc80b.png`、`b61b026ea991c01c6257c909021245fd64956837.png`、`e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png`，它们被救助审核、领养申请或共享存储/流程使用。

## 生产产物与包体

生产构建后的资源审计报告确认：

- 3 个 package-static 资源分别落在 `unpackage/dist/build/mp-weixin/pages/meMore/static/figma/adoption-flow/`，字节与源码一致，`missing=0`、`crossPackage=0`、`unknownDynamic=0`。
- 主包：`1,642,957 → 1,641,702 bytes`，净减少 `1,255 bytes`；当前仍高于推荐目标 `1,572,864 bytes`，差 `68,838 bytes`。
- 全量产物：`3,304,662 → 4,386,691 bytes`。增加主要来自分包静态源文件按原始字节复制；所有包仍低于 2 MiB，`pages/meMore` 为 `1,619,076 bytes / 1581.1 KiB`。
- `npm run check:package:final` 按预期失败（`1,641,702 > 1,572,864`），随后恢复 migration 报告；本批不宣称 final gate 通过。

当前包体证据表明资源归属已正确，但 package-static 原图的生产压缩仍是后续独立批次，不能在本批用未经设计验证的有损压缩替代治理。

## 总工程师独立验收

2026-09-15，根工作区总工程师复核并完成本批：

- 逐一用 `HEAD:static/figma/adoption-flow/` 与迁移后文件 SHA-256 比较，3 个文件内容保持一致；共享资源被恢复并保留在根目录。
- 独立执行 `git diff --check`、`npm run test:governance`（79/79）、`npm run check:routes`（65/65）、`npm run check:ui`、`npm run check:native-ui`、`npm run check:package`，全部通过；`npm run verify:ui` 通过。
- 独立执行 `npm run build:mp-weixin` 通过；输出资源审计、source/production boundary 均通过。
- 显式执行 `npm run check:package:final`，确认当前仍处迁移态，随后执行 `npm run check:package` 恢复 migration 报告。
- 复用用户手动打开的微信开发者工具项目窗口，进入 `/pages/meMore/adoptionFlow?frame=44&id=demo-pending`。页面显示“领养申请”、申请说明、两张申请图片、两只申请领养的猫咪及小院信息；清空本轮 Console 后调试器显示 `Errors: 0`、`Warnings: 0`。没有执行领养确认、抽奖、投喂或其他真实业务提交。

验收结论：3 个唯一领养流程资源的源码归属、引用边界、生产路径和运行时渲染均满足本批合同；共享资源未被误下沉。主包最终 1.5 MiB 门禁仍由后续包体批次负责。
