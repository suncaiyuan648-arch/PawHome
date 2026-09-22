# PKG-SUBPACKAGE-OWNER-AUDIT：领养宠物详情组合归属审计

日期：2026-09-15  
执行人：治理 coder（Luna / xhigh）  
范围：根 `components/`、生成的 `common/assets.js`、生产资源/边界报告和既有分包调用关系  
状态：已通过总工程师独立验收；未提交、未上传、未发布

> 说明：本交接单的候选表记录的是本批交付前的审计快照。其后 `PKG-ADOPTION-PRIVATE-COMPONENTS` 已接续完成并验收 `DetailTabber`、`AdoptEntryHintModal`、`PawCarouselDots` 的下沉；涉及这三个组件的旧候选状态以后一批交接单和总工台账为准。

## 结论

本批只迁移一个证据闭合的页面私有组合：

- `components/PawPetDetailFigma.vue` → `pages/adoption/components/PawPetDetailFigma.vue`
- 唯一生产调用方 `pages/adoption/petDetail.vue` 改用 `./components/PawPetDetailFigma.vue`
- 组件内容未修改。迁移前 `git show HEAD:components/PawPetDetailFigma.vue` 与迁移后文件 SHA-256 均为 `362f13b8b0461b987cbaf89f48a159d9e59b015cf8aad425ac627765a939340a`
- 原组件不再存在于根 `components/`；编译产物位于 `unpackage/dist/build/mp-weixin/pages/adoption/components/PawPetDetailFigma.{js,json,wxml,wxss}`

这个组合只承载领养域宠物详情的 Figma 变体。它的 props/events 和页面生命周期保持原状，依赖的 `PawPageNav`、`PawIcon`、评论、底栏等仍是跨页面共享组件，未随本批复制或修改。

## 调用方证据

生产源码检索（排除 `unpackage/`、`.artifacts/`）确认：

- 业务模板只在 `pages/adoption/petDetail.vue` 渲染 `<PawPetDetailFigma>`。
- 业务 import 只有 `pages/adoption/petDetail.vue:123`，改为 `./components/PawPetDetailFigma.vue`。
- 组件自身的 `name`、props、emits、模板、脚本和样式没有变化。
- 没有动态组件名、`resolveComponent`、字符串路径或其他路由页面引用该组件。
- 历史组件审计也将它记录为 `I1/T1`、唯一调用者 `pages/adoption/petDetail.vue`。

生产边界报告重建后，组件引用已从：

```text
pages/adoption/petDetail.json → components/PawPetDetailFigma.js → main
```

变为：

```text
pages/adoption/petDetail.json → pages/adoption/components/PawPetDetailFigma.js → pages/adoption
```

组件内部对 `common/vendor.js`、`utils/navLayout.js`、`utils/yardMock.js`、`common/assets.js` 与共享组件的引用仍明确标为 `pages/adoption → main`，这是允许的分包到主包共享依赖；报告没有 `main → sub` 或 sibling private violation。

## 资源与 common/assets.js 审计

`common/assets.js` 是 uni-app 构建产物中的聚合静态映射，不是本批可安全删除的独立业务模块。它仍由主包消费者和多个共享组件共同使用，因此没有修改其内容。

本组件的资源分为三类：

1. `pet-detail/strip-orange.png`、`pet-detail/message-avatar.png` 只有该领养详情组合使用，迁移后由资源管线归属 `pages/adoption/static/figma/pet-detail/`。
2. `adoption-flow/pet-hero.png` 也被 `pages/adoption/petDetail.vue` 与 `utils/yardMock.js` 使用，后者属于主包工具；资源继续保留主包，避免主包到分包的私有资源引用。
3. `pet-detail` 图标映射仍出现在主包 `common/assets.js` 中，原因是它属于构建期聚合映射且存在主包聚合消费者；不能依据单个组件的字面量引用删除，也没有改动图片字节。

真实产物资源审计：

- `missing=0`
- `crossPackage=0`
- `unknownDynamic=0`
- `parseErrors=0`
- `check:assets` 通过

## 包体前后

对比基线为上一批 `PKG-ASSET-AUDIT` 生产报告：

| 指标 | 调整前 | 调整后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,711,626 bytes / 1671.5 KiB | 1,690,771 bytes / 1651.1 KiB | **-20,855 bytes / -20.4 KiB** |
| `pages/adoption` | 上一批 handoff 未保留该分包单独数值 | 98,472 bytes / 96.2 KiB | 迁入组件编译文件合计 20,855 bytes |
| 总包 | 3,303,570 bytes（基线报告） | 3,303,847 bytes / 3226.4 KiB | +277 bytes |

主包仍低于 2 MiB 硬上限和迁移期门槛，但距离推荐目标 1,572,864 bytes 仍有：

```text
1,690,771 - 1,572,864 = 117,907 bytes
```

本批不宣称最终 1.5 MiB 门禁通过。

## 其余候选审计结论

以下候选确认有单一分包调用方，但本批没有强行迁移，留给后续独立批次：

| 候选 | 当前唯一分包 | 本批不迁移原因 |
|---|---|---|
| `components/DetailTabber.vue` | `pages/adoption` | 与 `PawYardDetailFigma`/`PawPetDetailFigma` 共享 `YardFeedPopup`、分享和底栏；可迁但应和领养宠物详情的旧状态兼容一起验证 |
| `components/AdoptEntryHintModal.vue` | `pages/adoption` | 薄封装但依赖共享 `PawNoticeModal`；节省体积小，建议随领养详情私有组合批次处理 |
| `components/base/PawCarouselDots.vue` | `pages/adoption` | 仅由已迁移组合使用；需要总工决定是否和组合一起归属，单独移动会改变共享组件目录语义，当前先保持根目录 |
| `components/PawPrimaryButton.vue` | `pages/auth` | 认证入口需单独核对登录/实名状态和 Figma 设计桥接 |
| `components/PawRescueReviewPage.vue`、`components/PawJuryItemCard.vue` | `pages/yard` | 页面职责正在从小院域拆出救助/评审域，当前物理分包与目标业务域不一致，先不把组件永久归到 `pages/yard` |
| `components/PawYardDetailFigma.vue` | `pages/commodityDetails` | 文件含已冻结 native UI 历史违规；移动路径会改变 baseline key，且不能通过扩充 native baseline 解决，应随小院路由重命名/违规清理批次处理 |
| `components/PawPetSelectSheet.vue`、`PawOrderSelectSheet.vue`、`PawSuccessOverlay.vue` | `pages/publishDynamic` | 发布动态仍与主包入口、投喂订单选择存在跨域聚合语义，需先完成 dynamic/editor 责任拆分 |
| meMore / feature / yard 的表单、地址、投票和弹层组件 | 单一既有分包或少量域页 | 多数依赖共享 storage、评审或地址链路；需结合对应业务域迁移，不能只按根目录调用次数搬运 |

`common/assets.js`、`utils/yardMock.js`、共享 identity/navigation/overlay 组件均保留，原因是存在主包或多个分包消费者，未做删除、复制或默认值调整。

## 验证结果

本批执行并通过：

- `npm run build:mp-weixin`：PASS；真实生产产物生成并自动执行包体、资源、边界检查
- `npm run test:governance`：79/79 PASS
- `npm run check:routes`：65/65 PASS
- `npm run check:ui`：PASS
- `npm run check:native-ui`：PASS（214 source files，35 项历史冻结违规未增加）
- `npm run check:package`：PASS（size/assets/production-source boundaries 全部 PASS）
- `git diff --check`：PASS

运行时复验使用用户已手动打开的 `/Users/a1-6/Documents/ChatGPT/逢猫/unpackage/dist/dev/mp-weixin` DevTools 窗口：通过 Console 执行 `wx.redirectTo({url:'/pages/adoption/petDetail?variant=35'})`，`pages/adoption/petDetail` 正常渲染宠物详情、状态信息、分享/入驻/领养/投喂操作区；清空 Console 后 `Errors: 0`。当前保留 11 条开发工具/历史组件 WXSS 警告（自动热重载、`wx.getSystemInfoSync` 弃用，以及 `CommentItem`、`CommentThread`、本组件和共享 `PawBadge`/`PawOverlay` 的原有标签选择器告警），未发现本次移动引入的运行时错误。未做几何、视觉、Figma 像素验收。

## 总工程师复验结论

- 独立复查迁移前后 SHA-256、唯一调用方、生产源码检索和 `pages/adoption` 输出边界，确认没有根包到分包或 sibling private 反向依赖。
- 独立重跑 `git diff --check`、79/79 治理测试、65/65 路由检查、UI/native guard、`check:package`、生产构建和 `verify:ui`，全部通过。
- 显式执行 `npm run check:package:final`，结果按预期失败：主包 `1,690,771 > 1,572,864 bytes`；随后恢复 migration 报告，当前仍差 `117,907 bytes`，本批不宣称 1.5 MiB final 门禁通过。
- 运行冒烟只验证路由加载与页面可见性，不替代后续交互、几何和 Figma 像素验收。

## 交付边界

没有修改：

- 路由 URL、`pages.json`、状态机、storage key 或数据合同
- props、events、模板、脚本、样式和图片字节
- native legacy baseline、Figma map、共享组件默认值
- 上传、发布或真实领养/投喂提交

本 handoff 不更新总工程师台账；请总工程师独立复核后再登记验收。
