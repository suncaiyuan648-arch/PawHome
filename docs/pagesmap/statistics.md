# 逢猫页面映射统计

> 生成时间：2026-08-26
> 对照对象：Figma 文件「逢猫投喂流浪猫板块」与当前 `pages/` 前端源码

## 结论

按“Figma 画板是否已经有源码路由、共享组件或状态参数承载”统计：

| 指标 | 数量 |
| --- | ---: |
| Figma 顶层节点 | 195 |
| 可识别的页面级 Figma 画板 | 171 |
| 当前源码注册页面路由 | 64 |
| 当前源码 `.vue` 页面文件 | 64 |
| 已找到源码承载的 Figma 页面/状态 | 171 |
| 完全没有源码承载的遗漏页面 | **0** |

因此，目前还有 **0 个整页级遗漏页面**。这里不是按“一个 Figma 画板对应一个 `.vue` 文件”计算：大量 Figma 画板是同一个页面的空状态、弹窗、结果页或交互状态，源码通过路由参数、组件 `props` 和共享弹层复用实现。

## 统计口径

1. Figma 顶层节点中，只把宽度约为 375px 且高度不小于 495px 的 `FRAME` 视作页面级画板；图层组、文字、矩形和短的辅助画板不计入页面数。因此 195 个顶层节点中得到 171 个页面级画板。
2. “已实现”表示源码中存在对应的页面路由、组件或可复现该画板的状态参数，不代表已经完成逐像素视觉验收，也不代表接口已经接入真实后端。
3. 当前项目是前端小程序源码；部分列表、订单和流程数据仍是演示数据，部分操作以 `uni.showToast` 模拟完成。这些属于交互/数据完整度问题，不计为“遗漏页面”。

## Figma 页面与源码映射

### 1. 首页、搜索与筛选

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:23815` 投喂首页-动态；`62:24022` 投喂首页-动态-空状态；`62:24224` 投喂首页-动态筛选弹窗；`62:25667` 投喂首页-动态-上滑状态 | `pages/index/index.vue`：`pageState=dynamic`、`dynamic-empty`、`filter-sheet`、`dynamic-scrolled` | 已实现（同一路由多状态） |
| `62:25292` 投喂首页-小院 | `pages/index/index.vue`：`state=yard-tab` / `activeFeedTab=yard` | 已实现（同一路由状态） |
| `62:24131` 搜索-空状态；`62:28350` 搜索-动态；`62:28526` 搜索-小院；`62:28865` 搜索-用户；`62:28996` 搜索-待搜索；`62:29084` 搜索-待搜索-删除；`62:39006`、`62:39015` 搜索-待搜索-全部删除确认弹窗 | `pages/search/index.vue`：`state=empty/dynamic/yard/user/deleting`，以及删除历史和确认弹窗状态 | 已实现（同一路由多状态） |
| `62:28013` 城市选择 | `pages/citySelect/index.vue` | 已实现 |
| `62:28164` 猫咪品种；`62:28258` 狗狗品种 | `pages/yard/breedPicker.vue`：`kind=cat/dog` | 已实现（同一路由多类型） |

### 2. 小院、宠物与动态详情

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:24439`、`62:24587` 发布-创建小院；`62:24722` 发布-创建小院-已录音状态 | `pages/yard/createCatYard.vue`：默认表单、`state=recorded` | 已实现（同一路由多状态） |
| `62:24878` 发布-添加猫咪；`62:37295` 添加猫咪；`62:37659` 添加狗狗；`62:37815` 添加猫咪-更多；`62:38365` 添加狗狗-更多 | `pages/yard/addKitten.vue`：`kind=cat/dog`、`state=more` | 已实现（同一路由多类型/状态） |
| `62:25026` 小院-查看猫咪列表 | `pages/yard/yardCats.vue?state=status`：小院宠物状态列表 | 已实现 |
| `62:25204` 我帮助过的动物 | `pages/meMore/helpedAnimals.vue` | 已实现 |
| `62:25866` 流浪猫小院介绍 | `pages/yard/catGuide.vue` | 已实现 |
| `62:26000` 院子详情-动态；`62:26418` 院子详情-动态空状态；`62:26677` 院子详情-投喂记录；`62:26947` 院子详情-动态展开 | `pages/commodityDetails/index.vue` + `components/PawYardDetailFigma.vue`：`dynamic`、`dynamic-empty`、`feeding`、`dynamic-expanded` | 已实现（共享详情组件） |
| `62:27383` 动态详情；`62:27724` 动态详情-评论空状态 | `pages/dynamicDetail/index.vue`：默认状态、`state=comments-empty` | 已实现（同一路由多状态） |
| `62:29916`、`62:30091` 小院-查看宠物详情；`62:30259` 我的云养-查看宠物详情 | `pages/adoption/petDetail.vue`：`figmaVariant=35/36/37`，并复用 `AdoptEntryHintModal` | 已实现（同一路由多画板） |

### 3. 投喂、个人主页与浏览记录

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:29176` 发布 | `components/PawPublishSheetContent.vue`（由 `CustomTabber` / `custom-tab-bar` 以底部弹窗承载） | 已实现；无独立发布入口路由 |
| `62:29253`、`62:29358` 我的投粮 | `pages/meMore/myFeedings.vue`：列表与 `state=30` 空状态 | 已实现（同一路由多状态） |
| `62:29416` 投粮订单；`62:29504` 院主-投粮订单 | `pages/meMore/yardFeedOrders.vue`：普通模式与 `state=owner` | 已实现（同一路由多角色） |
| `62:29619`、`62:29769` 个人主页-动态 | `pages/user/profile.vue`：默认与 `state=dynamic-long` | 已实现（同一路由多状态） |
| `62:30402` 浏览记录-动态；`62:30554` 浏览记录-小院；`62:30874` 浏览记录-缺省页 | `pages/meMore/browsingHistory.vue`：动态、小院、空状态 | 已实现（同一路由多状态） |
| `62:30949` 发布动态；`62:35188` 发布动态 | `pages/publishDynamic/postFeed.vue`：默认与 `state=alternate` | 已实现（同一路由多状态） |

### 4. 领养流程与结果页

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:31044` 领养申请；`62:31158` 领养申请（长表单） | `pages/adoption/adoptApply.vue`：普通领养与长表单模式 | 已实现（同一路由多模式） |
| `62:31384`、`62:31484` 领养申请-等待审核；`62:31597` 院主-等待院主审核；`62:31711` 院主-等待云家长审核；`62:31825` 领养-领养信息-查看；`62:31908` 领养-申请内容-查看；`62:32023` 院主-待申请人领养；`62:32153` 领养审核-待院主确认领养；`62:32305` 领养审核-驳回成功；`62:32483` 领养审核-领养成功；`62:32651` 领养申请-已同意；`62:32789` 领养进度-待院主确认；`62:32983` 领养进度-待评审团确认；`62:33198` 领养进度-获得奖励 | `pages/meMore/adoptionFlow.vue` + `components/PawAdoptionFlowFigma.vue`：`frame=44–57`；详情拆分页由 `pages/meMore/adoptionDetail.vue`、`adoptionApplyContent.vue` 承载 | 已实现（共享领养流程组件） |
| `62:33410` 待投票；`62:34304` 评审团 | `pages/yard/juryPanel.vue`：待投票/已结束列表与评审团入口 | 已实现 |
| `62:33657` 救助详情；`62:34421` 救助基金池 | `pages/feature/index.vue`：`mode=rescue-detail/rescue-fund` | 已实现（同一路由多模式） |
| `62:34054` 已投票 | `pages/yard/juryDetail.vue`：`state=voted` | 已实现 |
| `62:32789`、`62:32983`、`62:33198` 领养进度状态 | `pages/meMore/adoptionFlow.vue`：`frame=55/56/57`，并由 `PawAdoptionFlowFigma` 渲染进度条 | 已实现（共享流程状态） |
| `62:35297` 确认领养；`62:35393` 证实列表详情 | `pages/meMore/adoptionConfirm.vue`、`pages/meMore/adoptionProofList.vue`、`components/PawAdoptionEvidence.vue` | 已实现（共享证实组件） |
| `62:36210` 领养进度-领取结果页；`62:36267` 领养审核-同意结果页；`62:36324` 领养审核-院主确认结果页；`62:36381` 领养审核-确认驳回结果页；`62:36440` 确认领养结果页；`62:36497` 领养申请结果页 | `pages/adoption/result.vue`：`variant=80/81/82/83/84/85` | 已实现（结果配置复用） |
| `62:36752` 领养-进度-填写收货地址；`62:36782`、`62:36940` 院主-投粮详情；`62:37087` 云家长-投粮详情 | `pages/adoption/submitOrder.vue`；`pages/meMore/feedingDetail.vue` + `components/PawFeedingDetailFigma.vue`：`variant=90/91/92` | 已实现（共享详情/订单组件） |
| `62:36699` 领养-选择宠物 | `pages/adoption/pickCats.vue` + `components/AdoptPickCatsSheet.vue` | 已实现 |

### 5. 等级、关注、发布结果与认证

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:34597`、`62:34678` 等级；`62:34978` 等级（长页） | `pages/meMore/level.vue`：`variant=64/63/max`；`pages/meMore/levelRules.vue`：等级说明长页 | 已实现（页面与规则页拆分） |
| `62:34762` 粉丝列表；`62:34870` 关注列表 | `pages/user/followFans.vue`：关注/粉丝 tab | 已实现（同一路由多 tab） |
| `62:35483` 投喂排行榜 | `pages/leaderboard/index.vue` | 已实现 |
| `62:35703` 人脸识别；`62:35840` 入驻-实名认证 | `pages/auth/realName.vue`：实名表单与人脸核验入口 | 已实现（实名流程页） |
| `62:35758` 邀请入驻 | `pages/feature/index.vue`：`mode=invite` | 已实现 |
| `62:35896` 发布动态-选择订单 | `pages/publishDynamic/postFeedOrder.vue` | 已实现 |
| `62:35942` 动态发布结果页；`62:36620` 投粮成功结果页 | `pages/publishDynamic/postSuccess.vue`：默认发布成功与 `state=feeding` 投粮成功 | 已实现（同一路由多结果状态） |
| `62:35999` 宠物相册 | `pages/feature/index.vue`：`mode=album` | 已实现 |
| `62:36095` 小院认证-结果页；`62:36554` 小院创建结果页 | `pages/yard/yardCertifyDone.vue`：普通提交结果与 `state=created` 创建成功结果 | 已实现（同一路由多结果状态） |
| `62:36152` 年度报告 | `pages/meMore/annualReport.vue` | 已实现 |
| `62:37970`、`62:38114`、`62:38248` 小院认证 | `pages/yard/yardCertify.vue`：`figmaState=97/98/99`，表单、已通过、审核中 | 已实现（同一路由多状态） |
| `62:37451` 我也来证实 | `pages/yard/adoptionAudit.vue?mode=proof` + `components/PawAdoptionProofForm.vue` | 已实现 |

### 6. 宠物、语音、投票与领养弹层

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:38679` 实名认证弹窗；`62:38692` 隐私政策弹窗 | `pages/auth/realName.vue`：`popup=real-name/privacy` | 已实现（共享弹层） |
| `62:38705`、`62:38718` 院主-确定同意领养弹窗；`62:38731` 院主-驳回领养弹窗；`62:39245` 领养审核-确认驳回结果页 | `pages/yard/adoptionAudit.vue`：`popup=agree/reject`、`mode=confirmAgree/confirmReject/rejectDone` | 已实现（审核状态与弹层复用） |
| `62:38745` 投票-挺真实弹窗；`62:38774` 投票-有点假弹窗；`62:39188`、`62:39198` 领养-无次数弹窗 | `pages/yard/juryDetail.vue`：`popup=vote-real/vote-fake`；`pages/adoption/petDetail.vue` + `AdoptEntryHintModal`：领养额度限制 | 已实现（共享弹层） |
| `62:38803` 院主-联系方式 | `pages/meMore/adoptionDetail.vue` 联系方式弹层；`PawAdoptionFlowFigma` 联系信息卡片 | 已实现（详情/流程复用） |
| `62:38818` 回复-待输入；`62:38831` 回复-输入 | `pages/commodityDetails/index.vue`：`state=reply-idle/reply-input` + `components/ReplyComposerSheet.vue` | 已实现（共享评论组件） |
| `62:38844` 投喂弹窗；`62:38930` 帮助领养弹窗；`62:38940` 平均反馈时长弹窗；`62:38968`、`62:38987` 已获粮弹窗 | `pages/commodityDetails/index.vue`：`state=feed-popup`、`popup=help-adopt/feedback-stat/food-stat`；`components/PawFoodStatModal.vue` | 已实现（共享业务弹层） |
| `62:38954` 领养额度不足 | `pages/adoption/extras.vue`：`popup=insufficient` | 已实现 |
| `62:39170` 语音-无权限弹窗；`62:39179` 语音-无次数弹窗 | `pages/yard/createCatYard.vue`：`popup=voice-permission/voice-limit` | 已实现 |
| `62:39188`、`62:39198` 领养-无次数弹窗 | `pages/adoption/petDetail.vue` + `components/AdoptEntryHintModal.vue` | 已实现（共享弹层） |
| `62:39024` 选择状态弹窗；`62:39047` 选择价值；`62:39102` 选择性别弹窗；`62:39117` 选择绝育弹窗；`62:39132` 选择疫苗弹窗；`62:39151` 宠物性格 | `pages/yard/addKitten.vue`：`popup=status/value/gender/sterilization/vaccine/personality` | 已实现（同一路由多弹层） |
| `62:39208` 补充猫咪品种；`62:39221` 补充猫咪品种-待输入；`62:39234` 品种补充提交成功 | `pages/yard/breedPicker.vue`：补充品种、输入、提交成功状态 | 已实现（同一路由多状态） |

### 7. 地址、设置与“我的”页面

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:39304` 添加收货地址；`62:39488` 添加收货地址-输入时；`62:42452` 修改地址 | `pages/meMore/addShippingAddress.vue`：默认、`state=typing`；共享 `components/address/PawAddressForm.vue` | 已实现（共享地址表单） |
| `62:39399` 添加服务地址；`62:39592` 添加服务地址-输入时 | `pages/meMore/addServiceAddress.vue`：默认、输入状态；共享 `PawAddressForm` | 已实现（共享地址表单） |
| `62:39782` 收货地址；`62:39873` 服务地址；`62:39964` 选择地址；`62:40058` 选择地址-空状态；`62:40124` 收货地址-管理；`62:40234` 服务地址-管理 | `pages/meMore/shippingAddress.vue`：`kind=shipping/service`、`pick=1`、`state=empty/manage` | 已实现（同一路由多角色/状态） |
| `62:40344` 省份选择；`62:40487` 选错时返回上级；`62:40632` 街道选择；`62:40775` 城市选择 | `pages/meMore/regionSelector.vue`：省份、城市、街道和返回上级状态 | 已实现（同一路由多状态） |
| `62:40916` `Frame 1321318238`（删除地址确认弹窗） | `pages/meMore/shippingAddress.vue`：`state=delete` 删除确认状态 | 已实现；该匿名画板经 Figma 元数据确认是地址删除弹窗 |
| `62:40927` 设置 | `pages/meMore/settings.vue` | 已实现 |
| `62:41019` 我的 | `pages/me/index.vue` | 已实现 |
| `62:41242` 我的-更多 | `pages/me/index.vue`：`state=drawer`，抽屉菜单 | 已实现（同一路由状态） |

### 8. 登录、消息、额度与资产

| Figma 画板 | 源码映射 | 结果 |
| --- | --- | --- |
| `62:41525` 我的领养；`62:41969` 我的领养-空状态 | `pages/meMore/myAdoption.vue`：列表与 `state=empty` | 已实现（同一路由多状态） |
| `62:42103` 登录；`62:42165` 绑定手机号；`62:42225` 绑定手机号-验证；`62:42283` 登录后头像昵称 | `pages/auth/login.vue`、`bindPhone.vue`、`smsVerify.vue`；昵称头像承载于 `pages/me/index.vue?state=profile-upload` | 已实现（登录流程拆分） |
| `62:42330` 消息 | `pages/message/index.vue` | 已实现 |
| `62:42564` 服务订单消息；`62:42643` 互动消息；`62:42799` 活动消息 | `pages/messageDetail/index.vue`：`type=service/interaction/activity` | 已实现（同一路由多类型） |
| `62:42711` 助力领养；`62:42864` 领养额度；`62:42949` 领养额度明细 | `pages/adoption/extras.vue`：`mode=support/quota/quota-detail` | 已实现（同一路由多模式） |
| `62:43023`、`62:43284` 小院-查看猫咪列表；`62:43156` 我的-查看猫咪列表；`62:43393` 我的宠物 | `pages/yard/yardCats.vue`：`state=roster/status`；`pages/meMore/myAssets.vue`：`mode=pets`、`state=mine`；共享 `PawPetRoster` | 已实现（共享宠物列表组件） |
| `62:43457` 我的勋章；`62:43518` 勋章地图；`62:43556` 获得新勋章 | `pages/meMore/myAssets.vue`：`mode=medals/map/new` | 已实现（同一路由多模式） |

## 遗漏页面统计

### 完全遗漏

**0 个。** 171 个页面级 Figma 画板均已在源码中找到对应的页面、组件或状态入口。

### 需要继续做的工作（不计入遗漏页面）

- 逐个画板进行微信开发者工具真机/模拟器截图比对，确认尺寸、字体、状态栏和滚动高度。
- 将演示数据替换为真实接口、登录态和持久化数据。
- 对目前用 `uni.showToast` 代替的业务动作补齐真实提交、错误处理和回滚。
- 为路由状态参数补充统一的类型/枚举约束，避免手写 query 值产生漂移。
