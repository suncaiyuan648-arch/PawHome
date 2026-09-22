# PKG-ADOPTION-PRIVATE-COMPONENTS

- 执行批次：PKG-ADOPTION-PRIVATE-COMPONENTS
- 执行角色：治理 coder（Luna / xhigh）
- 范围：只审计并下沉根 `components/` 中由 `pages/adoption` 唯一生产使用的私有组件；不改路由、页面状态、Figma map、共享组件默认值、native baseline 或资源质量。
- 状态：已通过总工程师独立复核
- 版本状态：未提交、未上传、未发布

## 1. 迁移内容

本批下沉 3 个组件到 `pages/adoption/components/`：

| 原路径 | 新路径 | 唯一生产调用方 | 迁移理由 |
|---|---|---|---|
| `components/DetailTabber.vue` | `pages/adoption/components/DetailTabber.vue` | `pages/adoption/petDetail.vue` | 仅旧版宠物详情（`!figmaVariant`）使用；组件内部只依赖仍属于主包的共享 `ShareActionSheet`、`YardFeedPopup`、`PawFixedActionBar`，没有领养分包或其他分包私有依赖 |
| `components/AdoptEntryHintModal.vue` | `pages/adoption/components/AdoptEntryHintModal.vue` | `pages/adoption/petDetail.vue` | 仅领养宠物详情使用；仅包装主包共享 `PawNoticeModal` |
| `components/base/PawCarouselDots.vue` | `pages/adoption/components/PawCarouselDots.vue` | `pages/adoption/components/PawPetDetailFigma.vue`（其唯一上游为 `pages/adoption/petDetail.vue`） | 仅已下沉的领养宠物详情组合使用；改为同目录私有依赖，消除根 `components/base` 中的孤立归属 |

必要调用方 import 只改为 `./components/...` 相对路径；`PawPetDetailFigma.vue` 对轮播点组件改为 `./PawCarouselDots.vue`。组件源码内容未改动，props、events、template、script、style、API 与路由行为保持不变。

## 2. 调用方与边界证据

生产源码检索结果：

- `DetailTabber.vue` 仅由 `pages/adoption/petDetail.vue` 注册并渲染。
- `AdoptEntryHintModal.vue` 仅由 `pages/adoption/petDetail.vue` 注册并渲染。
- `PawCarouselDots.vue` 仅由 `pages/adoption/components/PawPetDetailFigma.vue` 注册并渲染；该组合仅由 `pages/adoption/petDetail.vue` 引入。
- 未发现字符串动态 import、JSON `usingComponents`、其他页面模板或兄弟分包调用。
- 迁移组件的依赖全部向主包共享组件单向引用；没有 `main → pages/adoption`，也没有 `pages/adoption → pages/meMore/pages/search` 等兄弟私有依赖。
- 构建后的 `unpackage/dist/build/mp-weixin/pages/adoption/components/` 生成了 3 组对应的 JS/JSON/WXML/WXSS 文件；`check:package` 的 production/source boundary 均通过。

源码 SHA-256（迁移前与迁移后相同）：

| 组件 | SHA-256 | 字节数 |
|---|---|---:|
| `DetailTabber.vue` | `16fa6baedb270e85890bd2ef2cf3b149f8ac37b5904f9c2bc06b888258ced91d` | 2,343 |
| `AdoptEntryHintModal.vue` | `53c3a2d9f284ed750baefd3cced797cd8103136d429a349b7e90eb156e7b09ea` | 709 |
| `PawCarouselDots.vue` | `c7c361a1a298294be0372737a74a08b6d184a1e936d0b7d239733f65319519ca` | 1,150 |

## 3. 资源审计

本批没有移动图片或其他静态资源：

- `DetailTabber` 使用的 `/static/fenxiang.png`、`/static/yard-joined-checked.png`、`/static/ruzhu.png`、`/static/lingyang.png` 仍由 `components/PawYardDetailFigma.vue` 和已下沉的 `PawPetDetailFigma` 使用，必须继续保留在根静态资源中。
- `AdoptEntryHintModal` 和 `PawCarouselDots` 无静态资源依赖。
- `common/assets.js` 为构建产物，未作为源码入口改动；资源门禁重新计算后未发现 unknown/missing asset。

## 4. 分包体积对比

基线采用上一批 `PKG-SUBPACKAGE-OWNER-AUDIT` 的生产迁移报告；本批在同一工具链构建后复核：

| 包 | 迁移前 | 迁移后 | 变化 |
|---|---:|---:|---:|
| 主包 | 1,690,771 bytes / 1651.1 KiB | 1,685,757 bytes / 1646.2 KiB | **-5,014 bytes / -4.9 KiB** |
| `pages/adoption` | 98,472 bytes / 96.2 KiB | 103,583 bytes / 101.2 KiB | +5,111 bytes / +5.0 KiB |
| 全量构建产物 | 3,303,847 bytes | 3,303,944 bytes | +97 bytes |

当前主包仍低于迁移期上限 1,941,174 bytes 与 2 MiB 硬上限，但高于最终推荐值 1,572,864 bytes：

```text
1,685,757 - 1,572,864 = 112,893 bytes
```

本批不宣称 final 1.5 MiB 门禁通过。

## 5. 明确暂缓项

以下候选本批保留在根目录，避免把共享或跨域职责错误下沉：

| 候选 | 暂缓理由 |
|---|---|
| `components/ShareActionSheet.vue` | 同时由动态、功能、投票、小院详情、领养详情使用 |
| `components/YardFeedPopup.vue` | 同时由动态、我的资产、小院猫咪、领养详情使用 |
| `components/layout/PawFixedActionBar.vue` | 被多个主包页面、`pages/meMore`、`pages/yard`、领养详情使用 |
| `components/PawNoticeModal.vue` | 被小院创建、投票与领养入口使用 |
| `components/PawYardDetailFigma.vue` | 商品详情和小院域仍共享，不能下沉到领养域 |
| 根静态资源 `/static/fenxiang.png` 等 | 小院详情与领养详情共享引用，不能随本批组件移动 |

## 6. 本批验收记录（coder 自检）

以下命令均在迁移后执行并通过；最终验收由总工程师独立复核：

- `git diff --check` PASS
- `npm run test:governance` PASS（79/79）
- `npm run check:routes` PASS（65/65）
- `npm run check:ui` PASS
- `npm run check:native-ui` PASS（214 source files，35 条历史冻结项）
- `npm run check:package` PASS（size/assets/boundaries）
- `npm run build:mp-weixin` PASS；生产构建完成并重新通过 migration package gates

本批运行时复验使用用户已手动打开的 `/Users/a1-6/Documents/ChatGPT/逢猫/unpackage/dist/dev/mp-weixin` DevTools 窗口：通过 Console 执行 `wx.redirectTo({url:'/pages/adoption/petDetail?state=0'})`，领养宠物详情正常渲染，清空 Console 后 `Errors: 0`、`Warnings: 0`。该冒烟验证路由加载和旧版详情组合可见性；没有点击领养/投喂等会产生业务提交的操作，未做几何、视觉、Figma 像素验收。

## 7. 总工程师独立验收

- 三个源文件分别与 `HEAD` 原路径 SHA-256 完全一致；仅页面和已下沉组合的相对 import 改变，未改变 props、events、template、script、style 或路由行为。
- 复查生产源码引用、生成的 `pages/adoption/components/*.{js,json,wxml,wxss}`、资源归属和边界报告，确认没有根包到分包或 sibling-private 反向依赖。
- 独立重跑 `git diff --check`、79/79 治理测试、65/65 路由检查、`check:ui`、`check:native-ui`、`check:package`、生产构建和 `verify:ui`，全部通过。
- 显式执行 `npm run check:package:final`，按预期失败：主包 `1,685,757 > 1,572,864 bytes`；随后恢复 migration 报告，当前距离推荐目标仍差 `112,893 bytes`。本批不宣称 final 1.5 MiB 门禁通过。
