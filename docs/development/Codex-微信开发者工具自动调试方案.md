# PawHome：Codex × 微信开发者工具自动调试方案

> 适用项目：PawHome  
> 技术栈：Vue 3 + uni-app + Vite  
> 包管理器：npm（仓库存在 `package-lock.json`）  
> 微信开发产物：`unpackage/dist/dev/mp-weixin`  
> 推荐环境：macOS + Codex 本地模式 + 微信开发者工具 Nightly  
> 目标：形成 **修改代码 → 编译 → 打开微信开发者工具 → 导航页面 → 交互 → Console/Network → 截图/尺寸校验 → 再修改** 的闭环。

---

## 1. 最终推荐架构

PawHome 不建议使用“模拟鼠标坐标点击微信开发者工具 GUI”的方式。

推荐架构：

```text
Codex Desktop / CLI
│
├─ 读取仓库
│  ├─ AGENTS.md
│  ├─ docs/pages-design/首页.md
│  ├─ docs/pages-design/动态详情.md
│  └─ docs/pages-design/复用组件.md
│
├─ Shell
│  ├─ npm run dev:mp-weixin
│  ├─ scripts/wx-debug/*
│  └─ wechatide
│
├─ 微信开发者工具 Nightly
│  ├─ Project
│  ├─ Simulator
│  ├─ Console
│  ├─ Network
│  ├─ Automation
│  └─ Preview
│
└─ QA Artifacts
   ├─ .artifacts/wx-debug/logs/
   ├─ .artifacts/wx-debug/screenshots/
   └─ .artifacts/wx-debug/reports/
```

Codex 不是通过“看屏幕找按钮”控制 DevTools，而是通过 `wechatide / DevTools Skills / Automation Protocol` 直接操作小程序运行环境。

---

## 2. 为什么 PawHome 适合这样做

当前仓库已有：

```json
{
  "scripts": {
    "dev:mp-weixin": "node scripts/run-uni.cjs dev",
    "build:mp-weixin": "node scripts/run-uni.cjs build"
  }
}
```

`scripts/run-uni.cjs` 明确将开发产物写入：

```text
unpackage/dist/dev/mp-weixin
```

所以链路是：

```text
PawHome 源码
      ↓
npm run dev:mp-weixin
      ↓
unpackage/dist/dev/mp-weixin
      ↓
微信开发者工具
      ↓
wechatide / automation
```

**DevTools 应打开编译产物，而不是直接打开 PawHome Vue 源码根目录。**

**窗口复用约束：** Codex/coder 只允许复用用户已经打开的微信开发者工具项目窗口。
不得调用 `open_project_window`、自动拉起/重开项目窗口，或启动第二个开发者工具进程。
如果没有可用的已打开窗口，暂停运行时测试并请用户手动打开
`unpackage/dist/dev/mp-weixin`；不得自行新建窗口恢复。

---

## 3. 推荐两级方案

### Level A：推荐

```text
微信开发者工具 Nightly
+
内置 Skills / wechatide
+
Codex Shell
```

适合 Project、Simulator、Console、Network、Automation、Screenshot、Preview、编译诊断。

优点：官方/腾讯工具链方向，不依赖 GUI 坐标，不需要维护脆弱的 AppleScript。

### Level B：降级

如果暂时不愿安装 Nightly：

```text
Stable 微信开发者工具
+
miniprogram-automator
+
本地 MCP bridge（可选）
```

适合连接 DevTools、query selector、tap、input、导航、断言和截图。第三方 MCP 只作为 fallback，安装前需要审计和固定版本。

---

## 4. 第一阶段安装与预检

保留 Stable DevTools 也可以额外安装 Nightly。

验证：

```bash
which wechatide
wechatide
```

macOS 常见 Nightly Skill 位置：

```text
/Applications/wechatwebdevtools.app/Contents/Resources/app.asar.unpacked/miniprogram-dev-skill
```

实际以本机安装为准，可搜索：

```bash
find /Applications -path '*miniprogram-dev-skill/skill.yaml' 2>/dev/null
```

读取 `skill.yaml` 版本后检查登录：

```bash
wechatide \
  -c Codex \
  -t check_devtools_status \
  --skill-version <skill.yaml版本>
```

判断：

```text
返回 openid         → Ready
没有 openid         → scan_login
skill version warning → 同步 Nightly 内置 skill
command not found   → Nightly/PATH 未配置
```

扫码：

```bash
wechatide -c Codex -t scan_login
```

任何 Nightly tool 参数都先通过：

```bash
wechatide -c Codex -t <toolName> --help
```

读取当前版本，**不允许 Agent 猜 flag**。

---

## 5. PawHome 初始化

```bash
cd /ABS/PATH/PawHome
npm ci
```

当前仓库有 `package-lock.json`，所以自动化规则统一使用 npm，不优先改成 pnpm。

启动 watcher：

```bash
npm run dev:mp-weixin
```

自动化开始前确认：

```bash
test -f unpackage/dist/dev/mp-weixin/app.json
test -f unpackage/dist/dev/mp-weixin/project.config.json
```

如果编译产物中的 `project.config.json` 不存在，停止自动打开 DevTools，先确认真实小程序项目根目录。

---

## 6. Codex 打开微信开发者工具

Nightly 推荐：

```bash
wechatide \
  -c Codex \
  -t project_open_window \
  --project /ABS/PATH/PawHome/unpackage/dist/dev/mp-weixin
```

`--project` 必须是包含 `project.config.json` 的绝对路径。

打开目标页面的公开工具类别包括 `simulator_open_page` / `simulator_refresh`。基础模式：

```bash
wechatide \
  -c Codex \
  -t simulator_open_page \
  --project /ABS/.../unpackage/dist/dev/mp-weixin \
  --page pages/dynamicDetail/index
```

需要 query 时，必须先：

```bash
wechatide -c Codex -t simulator_open_page --help
```

再按当前 Nightly 版本传入 `yardId=1`、`state=comments-empty`，不要用旧文档猜参数名。

---

## 7. PawHome 首批自动验收页面

先固定三种状态：

```text
首页动态：
/pages/index/index

动态详情默认：
/pages/dynamicDetail/index?yardId=1

动态详情评论空态：
/pages/dynamicDetail/index?yardId=1&state=comments-empty
```

第一阶段不要扫描全部页面。

---

## 8. 每轮自动调试闭环

```text
READ
↓
EDIT
↓
BUILD / WAIT WATCHER
↓
OPEN / REFRESH
↓
CONSOLE
↓
NETWORK（需要时）
↓
INTERACTION
↓
GEOMETRY
↓
SCREENSHOT
↓
COMPARE
↓
PASS / NEXT ROUND
```

### READ Gate

修改 UI 前必须读取：

```text
AGENTS.md
docs/pages-design/复用组件.md
docs/pages-design/<当前页面>.md
当前页面源码
关联共享组件
```

禁止看到 Figma 后直接在页面末尾追加补丁 CSS。

### Build Gate

至少保证：

```bash
npm run build:mp-weixin
```

或者 watcher 无编译错误。

**Build PASS != UI PASS。**

### Console Gate

Nightly debugger 能力包括 `get_app_console_content`。每轮结构性修改后检查：

```text
error
warn
Unhandled
TypeError
ReferenceError
Promise rejection
组件加载失败
资源 404
```

本次新增 Error 直接 FAIL。

### Network Gate

涉及评论、投喂、领养、上传、搜索时使用 `get_app_network_content` 检查请求是否发生、URL、method、status、耗时、重复请求和失败请求。纯视觉任务可以 N/A。

### Cache Gate

代码变了但模拟器没变化时优先 `simulator_refresh` / `debug_clear_cache`，不要立刻继续乱调 CSS。

---

## 9. Automation Gate

自动化不能只有 screenshot，还要执行真实交互。

动态详情例子：

```text
进入页面
→ 验证媒体存在
→ 滚动到评论
→ 点击评论输入
→ 输入文本
→ 验证发送按钮 enabled
→ 关闭 Composer
→ 滚动到底
→ 验证 BottomBar 仍固定
```

---

## 10. 给关键 UI 增加稳定 Selector

不要依赖：

```text
:nth-child(17)
view > view > view
```

建议仅给关键验收点增加稳定 id：

```html
<view id="qa-dynamic-media">
<view id="qa-comment-composer">
<view id="qa-yard-summary">
<view id="qa-detail-bottom-bar">
<button id="qa-primary-action">
```

命名：

```text
qa-<page>-<element>
```

这类 QA id 对生产行为无影响，却会显著提高自动化稳定性。

---

## 11. 几何验收优先于肉眼

Figma 明确存在 x/y/width/height 时，优先程序读取 runtime bounding rect。

动态详情示例：

```text
Media：304 × 500，x=35
Comment avatar：34
Comment input：301 × 33
Bottom CTA：188 × 42
```

375px 基准：

```text
±1px → PASS
>1px  → FAIL
```

对于 fixed footer：

```text
记录 footer rect
↓
滚动 800px
↓
再次记录 footer rect
```

viewport y 不变才 PASS。

---

## 12. Screenshot / Pixel Diff

推荐双层：

```text
L1 Geometry Diff
+
L2 Screenshot Diff
```

不要只做像素 diff，因为状态栏、微信胶囊、Home Indicator、字体抗锯齿、动态图片和随机数据会产生噪声。

建议将稳定设计基线放进：

```text
docs/visual-baseline/
├── index/
│   ├── dynamic.png
│   └── yard.png
└── dynamic-detail/
    ├── default.png
    └── comments-empty.png
```

这些是 QA baseline，不是生产资源。

每个 baseline 记录：

```yaml
figma_file: 03pt0RiVfBFCvn4PsIyezk
node: 62:27383
viewport: 375
page: dynamic-detail
state: default
```

设计变化时先更新页面设计文档，再更新 baseline。禁止 Codex 根据当前错误实现反向覆盖设计 baseline。

推荐页面级 pixel diff 只作辅助：

```text
组件级：< 0.5%
页面级：< 1.5%~2%
```

并 mask 系统 UI 和动态数据区域。

---

## 13. QA Artifact 目录

运行时截图、日志和报告统一写：

```text
.artifacts/wx-debug/
├── logs/
├── screenshots/
└── reports/
```

加入 `.gitignore`：

```gitignore
.artifacts/
```

除非用户明确要求更新 baseline，否则不要提交这些运行产物。

---

## 14. 自动修复循环上限

最多 6 轮。

每轮只解决 1~3 个相关问题：

```text
找最大差异
→ 修改
→ build
→ runtime
→ geometry
→ screenshot
→ compare
```

同一个差异连续两轮没有改善时停止盲调，转入 root cause：

```text
CSS 继承
shared component
px/rpx
safe area
native component
条件编译
编译缓存
```

---

## 15. 动态详情推荐修复顺序

依据 `动态详情.md`：

```text
Round 1 / P0
- BottomBar fixed
- Media aspectFill
- Comment Composer
- Empty state 保留 Composer

Round 2
- 普通评论
- VoiceComment
- ReplyItem

Round 3
- Feed Ranking
- YardSummary

Round 4
- font
- color
- icon
- 1px geometry
- motion
```

不要一次修改整个页面然后最后才打开 DevTools。

---

## 16. 动画验收

参考 `复用组件.md`：

```text
Button press       80/120ms
Like               140~160ms
Popover            180ms
Dialog             180ms
Sheet in           260ms
Sheet out          200ms
Layout             280ms
Rank ticker        350ms
```

自动截图必须等动画稳定，例如 Sheet 打开后至少等约 320ms 再截稳定帧。

---

## 17. QA 六项状态

Codex 每次结束必须输出：

```text
BUILD: PASS/FAIL
RUNTIME: PASS/FAIL
CONSOLE: PASS/FAIL
NETWORK: PASS/FAIL/N/A
INTERACTION: PASS/FAIL
GEOMETRY: PASS/FAIL/PARTIAL
VISUAL: PASS/FAIL/PARTIAL
```

不能只写“已完成”。

---

## 18. Simulator 与真机分层

```text
每轮：Simulator
每个 P0 完成：Simulator full flow
页面 ready：手机 Preview
合并前：至少一次真实设备
```

Nightly 可使用 `auto_preview` / `create_preview_qrcode` 做真机预览。

---

## 19. 上传/生产安全边界

调试 Agent 默认禁止：

```text
miniprogram_upload
正式发布
生产 destructive writes
真实支付
真实投粮订单
真实领养申请
```

除非用户明确要求。

允许：

```text
本地代码修改
本地编译
Simulator
截图
Console
Network read
测试数据
```

---

## 20. AGENTS.md 应该做什么

AGENTS.md 只做“导航 + 强规则”，详细规范放 docs。

推荐：

```text
AGENTS.md
→ 指向 首页.md / 动态详情.md / 复用组件.md
→ 指明 npm、编译目录、DevTools 验收规则
```

配套 `codex/AGENTS.wechat-debug.example.md` 已提供。

---

## 21. Codex 权限建议

第一阶段建议 workspace write + shell 按需批准。

不建议一开始直接设置：

```text
danger-full-access
approval=never
```

先把 watcher、wechatide 和 automation 行为跑稳定，再逐步放宽。

---

## 22. 保持长驻进程

不要每轮重复启动：

```text
npm dev
DevTools
```

推荐：

```text
uni watcher 长驻
DevTools 长驻
Codex 只 refresh/navigate/debug
```

配套脚本会把 watcher PID 和日志放在 `.artifacts/wx-debug/`。

---

## 23. Stable DevTools Fallback

Stable 模式首先开启微信开发者工具：

```text
设置 → 安全 → CLI/HTTP 调用
设置 → 安全 → 服务端口
```

可安装官方小程序自动化 SDK：

```bash
npm i -D miniprogram-automator
```

基础示例：

```js
const automator = require('miniprogram-automator')

const miniProgram = await automator.launch({
  projectPath: '/ABS/.../unpackage/dist/dev/mp-weixin'
})

const page = await miniProgram.reLaunch(
  '/pages/dynamicDetail/index?yardId=1'
)

await page.waitFor(500)

const hero = await page.$('#qa-dynamic-media')
console.log(await hero.boundingClientRect())

await miniProgram.close()
```

如果希望 Codex 直接拥有 connect/query/tap/input/assert/screenshot/console/network 一组结构化工具，再配置本地 MCP bridge。

第三方 MCP 必须：

```text
审查源码
固定版本
限制权限
不携带生产凭证
```

配套 `codex/config.wechat-mcp.example.toml` 只提供配置结构，不强制启用。

---

## 24. 为什么主路线不强制 MCP

Nightly `wechatide` 本身已经覆盖 Project / Simulator / Console / Network / Automation / Preview，而 Codex 能直接执行 Shell。

所以：

```text
Codex → shell → wechatide
```

已经可以形成闭环。

MCP 的优势是 tool schema 更结构化，但不是必选项。

---

## 25. 首次落地顺序

### Step 1

```text
安装 Nightly
跑 preflight
确认 wechatide 登录
```

### Step 2

```text
npm ci
start-dev.sh
确认编译产物
```

### Step 3

```text
打开 DevTools
打开动态详情
读取 Console
拿到 screenshot
```

此时先不改代码。

### Step 4

给关键节点增加 `qa-*` id，验证 automation 查询。

### Step 5

先让 Codex 输出一份“当前实现 FAIL 报告”，确认它能真实看到 runtime 差异。

### Step 6

开始动态详情 P0 自动修复闭环。

---

## 26. 第一阶段成功标准

只要 Codex 能独立完成：

```text
1. 修改 Vue
2. 编译
3. Refresh
4. 打开 route
5. 读取 Console
6. 点击/滚动/输入
7. 读取 element rect
8. Screenshot
9. 输出 PASS/FAIL
```

系统就已经有很高价值。

第二阶段再加入：

```text
Figma baseline
pixel diff
component gallery
自动 QA report
```

最终目标不是“Codex 会写代码”，而是：

> **Codex 修改后能够自己提供运行时证据，证明页面没有偏离 Figma 与共享组件规范。**
