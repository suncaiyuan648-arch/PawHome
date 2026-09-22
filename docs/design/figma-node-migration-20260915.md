# 2026-09-15 新旧 Figma 节点映射

当前文件：`ikwcujfbxtNcjk9tjGjKx8`；历史文件：`03pt0RiVfBFCvn4PsIyezk`。

## 范围与方法

读取两个文件完整的 `0:1` 元数据树及旧 AppHeader 独立组件。按完整子树或文案、层级逐项核对；仅在已确认的父组件内比较位置，不使用编号偏移、同名或截图相似度替换。

**71 个唯一旧节点中，69 个建立新对应，2 个保留旧来源。** 覆盖正式页面、原 unresolved 小院四态、共享组件及页内弹层。图标导出素材保留原始 provenance，本轮不重新导出。详见 [机器合同](figma-node-migration-20260915.json)。

正式矩阵现在有 45 状态：44 项新稿对应、1 项旧稿搜索结果。小院四态已通过源码白名单绑定。此结论不代表运行、样式或像素验收。

## 重点纠正

- 旧 pet_detail_yard 实际含管理菜单，对应 `83:10114`；旧 pet_detail_managed 实际为云养入口，对应 `83:9889`。保留 key，纠正名称与 QA query；参数不代表权限。
- 普通首页 `83:3464` 与服务聚合版 `83:3739` 同名，后者单列新增参考。
- `83:4109` 是搜索无结果，不能替代旧搜索动态有结果 `62:28350`。
- 新共享组件多恢复原 Group/Frame 名，代码侧仍复用语义组件。旧 AppHeader 组件集没有复制，保留旧源。
- 元数据包括隐藏层。动态发布结果 `83:15773` 的“下单成功”为 hidden=true，不能作为发布文案。
- 原生状态栏、微信胶囊、系统底栏只作参考，继续使用 PawPageNav/navLayout。

## 对应表

| 旧节点 | 新节点 | 新稿名称/状态 | 依据 |
|---|---|---|---|
| [62:23815](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-23815) | [83:3464](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-3464) | 投喂首页-动态 | 同为普通动态 Feed；保留独立搜索/动态小院筛选、通知与卡片区域。83:3739 新增上门服务/救助池等首页聚合入口，另列新增参考。 |
| [62:24022](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-24022) | [83:4000](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-4000) | 投喂首页-动态-空状态 | 空态文案还没有动态/这个城市好像还没有人发布、筛选与 Tab 顺序一致；导航实例展开。 |
| [62:24224](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-24224) | [83:4202](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-4202) | 投喂首页-动态筛选弹窗 | 同一筛选弹层最近更新/离我最近/只看猫咪/只看狗狗；背景 Feed 更新。 |
| [62:25292](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-25292) | [83:5365](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-5365) | 投喂首页-小院 | 小院卡片与离我最近筛选；我加入的改关注，余量/人数文案更新。 |
| [62:25667](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-25667) | [83:5740](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-5740) | 投喂首页-动态-上滑状态 | 上滑 neirong 内容与固定筛选结构，导航实例展开、卡片补云养数。 |
| [62:27383](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-27383) | [83:7494](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-7494) | 动态详情 | 动态正文/评论/关联小院/投喂底栏同职责；新增动物来源，导航实例展开。 |
| [62:27724](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-27724) | [83:7844](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-7844) | 动态详情-评论空状态 | 共2026条评论/还没有评论/抢首评空态结构，文本序列一致。 |
| [62:28350](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-28350) | 保留旧源 | retained-legacy | 新画布无搜索动态有结果状态；83:4109是无结果空态，不等价。 |
| [62:28526](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-28526) | [83:8470](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-8470) | 搜索-小院 | 动态/小院/用户搜索结果分栏，目标内容是小院卡片；余量与关注人数变化。 |
| [62:28865](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-28865) | [83:8809](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-8809) | 搜索-用户 | 搜索用户结果列表+关注按钮；文本和列表层级对应。 |
| [62:28996](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-28996) | [83:8940](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-8940) | 搜索-待搜索 | 待搜索的历史搜索词、搜索框结构对应。 |
| [62:29084](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-29084) | [83:9028](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-9028) | 搜索-待搜索-删除 | 待搜索删除状态、历史词清理控件对应。 |
| [62:30949](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-30949) | [83:10789](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-10789) | 发布动态 | 普通发布/反馈选择订单与媒体区；旧选择猫咪区移除。区别83:15056的已关联订单与动物反馈态。 |
| [62:35896](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-35896) | [83:19056](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-19056) | 发布动态-选择订单 | 选择订单标题与已反馈计数保留，新增动物/云养期限/任务状态。 |
| [62:35942](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-35942) | [83:15773](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-15773) | 动态发布结果页 | 结果职责保留，导航隐藏的下单成功不作为业务文案。 |
| [62:29916](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-29916) | [83:9706](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-9706) | 小院-查看宠物详情 | 公开宠物详情有分享/领养/云养业务底栏，无管理宠物/管理相册/删除宠物菜单。 |
| [62:30091](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-30091) | [83:10114](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-10114) | 我的云养-查看宠物详情 | 旧管理宠物/管理相册/删除宠物菜单和寄语板保留；新外层名改我的云养，新增订单区。不能按外层名当普通云家长权限。 |
| [62:30259](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-30259) | [83:9889](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-9889) | 我的云养-查看宠物详情 | 旧云养剩余天数/投粮详情入口演进为当前与待生效订单区；无三项管理菜单。 |
| [62:31044](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-31044) | [83:10860](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-10860) | 领养申请 | 申请领养猫咪/向院主说明/小院信息；新增人脸核验及领养协议。区别求助金额长表单83:10978。 |
| [62:31384](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-31384) | [83:11204](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-11204) | 领养申请-等待审核 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:31597](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-31597) | [83:11417](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-11417) | 院主-等待院主审核 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:32153](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-32153) | [83:11973](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-11973) | 领养审核-待院主确认领养 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:33198](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-33198) | [83:13018](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-13018) | 领养进度-获得奖励 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:36699](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-36699) | [83:16471](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-16471) | 领养-选择宠物 | 选择宠物列表及操作区对应；文本一致，子节点数量变化。 |
| [62:35297](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-35297) | [83:15168](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-15168) | 确认领养 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:36210](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-36210) | [83:16041](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-16041) | 领养进度-领取结果页 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:36497](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-36497) | [83:16328](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-16328) | 领养申请结果页 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:36752](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-36752) | [83:16527](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-16527) | 领养进度-填写收货地址 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:41525](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-41525) | [83:21696](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-21696) | 我的领养 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:41969](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-41969) | [83:22140](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22140) | 我的领养-空状态 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:42711](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42711) | [83:22882](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22882) | 助力领养 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:42864](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42864) | [83:23035](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-23035) | 领养额度 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:42949](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42949) | [83:23120](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-23120) | 领养额度明细 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:34304](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-34304) | [83:14169](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-14169) | 评审团 | 评审任务卡片+投票结果，标题由逢猫评审团改领养评审。不是救助综合任务中心。 |
| [62:33410](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-33410) | [83:13230](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-13230) | 待投票 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:34054](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-34054) | [83:13874](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-13874) | 已投票 | 感谢认真审查/已选投票/下一个状态保留，新增留言。 |
| [62:34421](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-34421) | [83:14289](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-14289) | 救助基金池 | 基金余额/入池/支出与救助卡片；标题救助池，待投票改投票中。 |
| [62:33657](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-33657) | [83:13477](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-13477) | 救助详情 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:35393](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-35393) | [83:15264](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-15264) | 证实列表详情 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:37451](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-37451) | [83:17049](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-17049) | 我也来证实 | 证实姓名/关系/身份证/证实说明/承诺；文本集合一致，布局节点调整。 |
| [62:31158](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-31158) | [83:10978](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-10978) | 领养申请 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:26000](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-26000) | [83:6085](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-6085) | 院子详情-动态 | 小院摘要/动态/评论结构，新增动物与投喂来源；底栏与统计文案调整。 |
| [62:26418](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-26418) | [83:6528](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-6528) | 院子详情-动态-动态空状态 | 院主佛系，还没发过动态及催一下空态；文本序列一致，实例结构变化。 |
| [62:26677](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-26677) | [83:6787](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-6787) | 院子详情-投喂记录 | 小院订单反馈记录区域；投粮记录改云养记录，订单卡含云养期限与编号。 |
| [62:26947](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-26947) | [83:7045](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-7045) | 院子详情-动态展开 | 长简介收起+展开回复状态保持，新增来源与云养文案。 |
| [1548:3731](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=1548-3731) | 保留旧源 | retained-legacy | 旧文件AppHeader组件集仍可读取；新文件只有Page 1且无该组件集，不将页面导航外观代替组件定义。 |
| [62:42069](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42069) | [83:22240](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22240) | Group 1321318288 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42047](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42047) | [83:22218](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22218) | Frame 1321318267 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42056](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42056) | [83:22227](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22227) | Group 1321318296 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42062](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42062) | [83:22233](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22233) | Frame 1321318274 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42065](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42065) | [83:22236](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22236) | Frame 1321317912 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42071](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42071) | [83:22242](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22242) | Group 1321318303 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42074](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42074) | [83:22245](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22245) | Group 1321318301 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42089](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42089) | [83:22260](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22260) | 详情 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42091](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42091) | [83:22262](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22262) | Frame 1321318310 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42094](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42094) | [83:22265](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22265) | Group 1321318304 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42097](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42097) | [83:22268](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22268) | Frame 1321318103 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42099](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42099) | [83:22270](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22270) | Frame 1321318340 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:41095](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-41095) | [83:21026](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-21026) | Group 1321318288 | 我的个人摘要等级组件：同一摘要组、x149/y24.5、28×13；83:21173为另一摘要态不含此symbol。 |
| [62:42028](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42028) | [83:22199](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22199) | Group 1321318266 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42080](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42080) | [83:22251](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22251) | Group 1321318300 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:42084](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-42084) | [83:22255](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-22255) | Group 1321318298 | 组件集合内唯一相同类型/相对坐标/尺寸，16项次序一致；旧语义名在新文件恢复为原始图层名。 |
| [62:24485](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-24485) | [83:4475](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-4475) | Frame 1171276786 | 建院介绍卡片：同父级表单首项、355×279组件，旧语义名恢复原Frame名。 |
| [62:29176](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-29176) | [83:9120](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-9120) | 发布 | 发布入口菜单层级和动作对应；导航实例展开。 |
| [62:33274](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-33274) | [83:13094](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-13094) | Group 1321318128 | 在匹配的结构范围内核对层级、文本和节点属性，唯一对应；不包含样式/图片像素验收。 |
| [62:38705](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-38705) | [83:18303](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-18303) | 院主-确定同意领养弹窗 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:38731](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-38731) | [83:18329](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-18329) | 院主-驳回领养弹窗 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:38803](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-38803) | [83:18401](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-18401) | 院主-联系方式 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:38954](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-38954) | [83:18552](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-18552) | 领养额度不足 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:38745](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-38745) | [83:18343](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-18343) | 投票-挺真实弹窗 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |
| [62:38774](https://www.figma.com/design/03pt0RiVfBFCvn4PsIyezk?node-id=62-38774) | [83:18372](https://www.figma.com/design/ikwcujfbxtNcjk9tjGjKx8?node-id=83-18372) | 投票-有点假弹窗 | 完整元数据子树一致（除ID、画布位置）；不含样式/像素验收。 |

## 例外退出条件

- 搜索结果：C8 补精确画板，或明确新稿组件组合并经产品确认后更新 design_doc；补前保留旧稿并阻断该状态视觉终验，不删除业务功能。
- AppHeader：C0 登记 approved-legacy-component，继续使用既有组件；后续单独同步定义，不以页面导航容器冒充。
- 新设计差异及新增业务按 [11 治理增补计划](../architecture-audit/11-采纳建议治理增补计划.md) 执行。

