# PKG-TRIM：主包低风险减重交付

日期：2026-09-15  
执行范围：已有 `pages/meMore` 分包内的私有业务组件归属调整  
执行人：治理 coder（Luna / xhigh）；总工程师复核：通过

## 交付结论

本批只调整两个只被 `pages/meMore` 分包页面使用的组件物理归属，并把三个调用方改为分包内相对引用：

- `components/PawAdoptionEvidence.vue` → `pages/meMore/components/PawAdoptionEvidence.vue`
- `components/PawAdoptionProofForm.vue` → `pages/meMore/components/PawAdoptionProofForm.vue`
- `pages/meMore/adoptionConfirm.vue`、`rescueProofList.vue`、`rescueProofForm.vue` 改为引用 `./components/...`

组件模板、脚本、样式、props、事件和路由 URL 均未改变；未新增路由，也未改变业务数据读写。这样可以让仅由个人中心扩展页面使用的业务组合跟随既有 `pages/meMore` 分包加载，避免根 `components/` 目录的保守归属把组件代码和示例图带入主包。

## 体积证据

基线采用本轮 C1/C2 验收后的构建报告：

| 指标 | 调整前 | 调整后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,925,718 bytes / 1880.6 KiB | 1,864,534 bytes / 1820.8 KiB | -61,184 bytes / -59.8 KiB |
| 总包 | 3,255,102 bytes | 3,294,377 bytes | +39,275 bytes |
| `pages/meMore` | 438,734 bytes / 428.5 KiB | 500,291 bytes / 488.6 KiB | +61,557 bytes |

主包仍比 1.5 MiB 目标多 `291,670 bytes`；迁移期 `1,941,174 bytes` 门槛已通过，2 MiB 硬上限也通过。总包增加主要来自 `PawAdoptionEvidence` 使用的示例证实图在 `pages/meMore` 与既有 `pages/yard` 页面之间形成各自分包副本；当前总包仍远低于 8 MiB 内部目标。该取舍换取首包减重，后续应在不破坏分包私有资源边界的前提下评估可共享但不入主包的资源方案。

## 验证

- `npm run build:mp-weixin`：PASS；构建后自动执行包体、资源和边界门禁。
- `npm run test:governance`：79/79 PASS。
- `npm run check:routes`：65/65 PASS。
- `npm run check:ui`：PASS；包含图标、字体、UI 治理和 native UI 检查。
- `npm run check:native-ui`：PASS，214 个源码文件扫描，35 项历史冻结项未增加。
- `git diff --check`：PASS。
- `npm run check:package`：PASS（迁移阶段）。

本批没有变更页面视觉或导航行为，因此未进行新的 Figma 几何调参；构建产物已确认分包组件输出为 `unpackage/dist/build/mp-weixin/pages/meMore/components/`，证实示例图输出到 `pages/meMore/static/figma/certify/`，资源和生产边界检查均通过。未进行上传、发布或真实业务提交。

## 风险与回滚

风险集中在编译器对分包内组件的输出路径解析。已通过真实生产构建、资源门禁、生产/源码边界门禁和全量治理测试；调用方行为接口未变。若后续运行时发现某个旧页面无法加载，回滚只需恢复三个 `import` 为根组件路径并把两个文件移回 `components/`，不涉及数据迁移或路由变更。

## 下一批可执行候选

当前剩余主包缺口约 `291,670 bytes`，不建议通过继续压低全局图片质量直接填补。下一批优先按以下顺序做单项测量，每项独立构建和运行验收：

1. 审计 `components/PawAdoptionFlowFigma.vue`：当前只被 `pages/meMore/adoptionFlow.vue` 使用，可按本批模式下沉到 `pages/meMore/components/`；但它依赖领养存储和多张领养流程资源，需先确认旧领养兼容壳和救助入口不会重新引入它。预计收益高，风险中等。
2. 审计 `components/AdoptPickCatsSheet.vue`：当前由动态详情、小院详情和领养页共同使用，不能直接下沉；应先拆成轻量选择合同与领养域私有 UI，再决定是否复制/异步化，风险高，不作为本批实施项。
3. 修正生成的 `common/assets.js` 对分包页面静态资源的归属策略，避免仅因生成文件位于 `common/` 就把分包页面资源判为主包；必须配套生产产物反例、资源路径和运行时验证后再改，风险中高。
4. 重新测量 `uni-icons.wxss`、`app.wxss` 和 `common/vendor.js` 的共享基础成本；它们不是页面私有资源，需专项拆分或替代方案，禁止在业务页内重复造组件。

以上候选需每次只取 1–3 个相关问题，构建、资源/边界门禁和运行时验证后再进入下一批；本 handoff 不宣称 1.5 MiB 最终门禁已经通过。
