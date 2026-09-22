# `01-页面路由与布局审计.md` 独立复核

复核日期：2026-09-08

## confirmed

- 已读取 `AGENTS.md`、`pages.json` 及全部 63 个 `pages/**/*.vue`。`pages.json` 的 5 个主包页面与 13 个分包（分包合计 58 页）共注册 63 页；按 `root + path` 映射到源码后为 63/63，源码文件反向匹配也是 63/63。各分包路径没有发现错误。
- `tabBar.list` 的 4 个页面均为主包注册页；未发现 `entryPagePath`。
- 静态路由调用基路径未发现指向 `pages.json` 之外的确定目标。原报告的 149 处调用统计（pages 124、components 19、utils 6；类型合计 navigateTo 102、redirectTo 16、navigateBack 21、reLaunch 8、switchTab 2）与扫描结果一致。`eventChannel` 传递不应当误判为 query 遗漏。
- 多模式证据成立：`feature/index` 读取 `mode=rescue-detail|invite|album`；`meMore/adoptionFlow` 在领养/救助组件间分派；`adoption/extras` 读取 `support|quota|quota-detail`；`meMore/myAssets` 读取 pets/medals/map/new。其余 `yardCats`、`feedingDetail`、`adoptionAudit`、`result` 属同域状态/流程复用。
- 页面自身 style 块中的 `position:absolute/fixed` 为 134 处、27 页，原表列出的 P 行号与源码一致；style 块中的锚点声明为 886 处，`transform` 为 37 处。共享组件 CSS 未被错误合并进页面计数，这一统计口径本身成立。

## corrected

- 原报告把 `levelRules`、`annualReport`、`helpedAnimals` 描述为“没有静态页面入口”，不准确。`pages/meMore/level.vue:123-129` 的 `routes` 映射和 `uni.navigateTo({ url })` 静态覆盖了三者；其中 `helpedAnimals` 另有 `pages/adoption/extras.vue:72` 调用。真正没有源码直接进入调用者的 7 页仍是：`adoption/pickCats`、`meMore/feedingDetail90/91/92`、`publishDynamic/postFeedOrder`、两个 `dev` 验收页。
- 原报告的 native 菜单按钮直接调用证据漏列了 `pages/yard/yardCertify.vue:155-156`，并把 `pages/citySelect/index.vue` 列入直接调用者。实际直接调用 `getMenuButtonBoundingClientRect()` 的页面为 12 页；`citySelect/index.vue:140-143` 使用的是共享 `getNavLayout`，不是页面直接调用该 API。
- 若按本次要求把页面模板内 bound inline style 也纳入锚点统计，A 应从 886 修正为 890：`pages/adoption/petDetail.vue:22` 的 `top`、`right`，`pages/dynamicDetail/index.vue:14` 的 `top`，以及 `pages/yard/addKitten.vue:128` 的 `left`。inline 中没有发现 `position:absolute/fixed` 或 `transform`，所以 P=134、T=37 不变。上述条件编译 style 块已计入；不能因 `#ifndef MP-WEIXIN` 的 H5 状态栏样式而推断 MP-WEIXIN 同样渲染。
- 原报告的“高 18 / 中 5 / 低 40”不能直接作为“结构性绝对布局”结论：它把 native-nav 风险与绝对定位混成一个等级，并把允许的固定底栏、弹层遮罩、FAB、徽标/局部覆盖混入结构判断。尤其 `auth/bindPhone`、`auth/smsVerify`、`publishDynamic/postSuccess` 没有页面级 P；`meMore/helpedAnimals` 的 P 仅为非 MP 的 H5 状态栏覆盖；`message/index` 的 P 是图标局部覆盖。`index`、`feature/index`、`leaderboard/index`、`user/profile`、`yard/addKitten` 的核心构图依赖绝对坐标则有直接证据。PawPageNav、底栏、弹层和安全区应另列为允许覆盖或 native-nav 风险，不能计作结构性布局。

## missing

- 原报告没有把 `level.vue` 的变量 URL 路由表作为调用者证据，也没有把上述 4 个 inline anchor 的行号纳入 A 统计。
- 原报告的 native-chrome 证据未明确按条件编译分层；`index`、`annualReport`、`browsingHistory`、`helpedAnimals`、`postFeed`、`search`、`yardCertify` 的 H5 状态栏图片位于非 `MP-WEIXIN` 分支，不能直接作为小程序端重画证据；`user/followFans` 的胶囊结构则不在该 H5 排除分支内，应单独核查。
- `extras.vue:72` 传给 `/pages/meMore/helpedAnimals?id=...`，但 `helpedAnimals.vue` 的 `onLoad` 不读取任何 query；这是已确认的 caller→sink 参数不匹配，不能只写成“可能未决”。

## unresolved

- `shippingAddress.vue` 将外部 query 的 `returnUrl` 交给 `goBackSmart`；当前源码调用者给出的值可落到已注册页面，但运行时任意深链没有白名单校验，静态审计不能证明其安全。
- `q`、`path + query`、`routes[row.key]`、`flowUrl(frame)`、`fallbackUrl` 等动态 URL 需要运行时输入/分支覆盖才能完全证明；当前可见定义均能追到已注册基路径，但这不是对任意运行时值的证明。
- 结构性等级没有可复现的客观阈值，且本次未启动微信开发者工具；因此不确认原报告的高/中/低总数，也不据静态页面 CSS 推断实际渲染几何。共享组件组合后的定位、外部分享/历史页面栈，以及 MP/H5 条件编译后的最终行为仍需另行运行时验证。
