'use strict'
// Human-reviewed entry recipes + manifest/Figma inventory. No app runtime changes.
const fs = require('node:fs')
const path = require('node:path')
const YAML = require('yaml')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root,p),'utf8')
const manifest = JSON.parse(read('pages.tson'))
const map = YAML.parse(read('docs/design/figma-map.yaml'))
const live = JSON.parse(read('docs/design/acceptance-20260921-figma-reference.tson'))
const routes = manifest.pages.map(p=>p.path).concat(manifest.subPackages.flatMap(p=>p.pages.map(x=>p.root+'/'+x.path)))
const currentKey = live.fileKey
const figma = (id,key=currentKey)=>`https://www.figma.com/design/${key}/?node-id=${id.replace(':','-')}`
const titleOf = id => live.frames.find(f=>f.id===id)?.name || id
const config = {}
function page(route,title,query,states,steps,refs='',issue='') { config[route]={title,query,states,steps,refs:refs.split(' ').filter(Boolean),issue} }
page('pages/index/index','首页 Tab','','dynamic / dynamic-empty / yard / dynamic-scrolled；筛选弹层、发布弹层','自定义编译用 state=dynamic-empty、yard、dynamic-scrolled；筛选态点击“最近更新”；点击底部 + 查看发布弹层。','83:3464 83:4000 83:5365 83:5740 83:4202 83:9120')
page('pages/selfRun/index','自营 Tab','','默认占位；切换 Tab','点击底部自营；仅验现有占位与导航，不规划商城。','','无精确 Figma 节点；本轮保留职责')
page('pages/message/index','消息 Tab','','默认聚合；分类入口','点击服务／互动／活动／订单类入口；确认统一进入持久通知列表并按 category 筛选。','83:22501','消息入口已统一到 message/list')
page('packages/message/pages/list/index','持久通知列表','category=order','category=order / interaction / system / activity；有数据／空／无身份／记录失效；messageId 定位','先 Q.message()；再打开页面，点击消息。interaction 用 category=interaction。Q.logout() 后重进验无身份；旧 messageDetail 带 messageId 应直接打开同一列表解析链。','83:22735 83:22814 83:22970','统一承载原分类展示与持久消息读取；Figma 节点仅作类别内容参考')
page('pages/me/index','我的 Tab','','default / drawer / profile-upload；登录前后','自定义编译 state=drawer 或 profile-upload；正常入口点击右上更多、头像。','83:20949 83:21396 83:22454')
page('packages/discovery/pages/city-picker/index','发现城市选择','current=长沙市','当前城市／搜索／选择','从首页城市入口进入；直接编译只能验展示，选择回传须从首页打开。','83:8133','C0 已迁移到 discovery canonical 页面；仍需运行与视觉验收')
page('packages/discovery/pages/search/index','搜索','state=dynamic','state=dynamic / yard / user / empty / idle_delete；popup=delete；无 state 为待搜索','分别编译这些 state；历史删除确认用 popup=delete；keyword 输入与返回另验。','83:8470 83:8809 83:4109 83:8940 83:9028 83:18604','新稿无已确认动态有结果对应；旧稿 62:28350 保留，不以空态替代。C0 canonical 迁移已完成')
page('packages/discovery/pages/ranking/index','投喂排行榜','','列表、榜首、滚动','首页→排行榜；默认可直达。','83:15354','C0 已迁移到 discovery canonical 页面；仍需运行与视觉验收')
page('packages/dynamic/pages/editor/index','发布动态／反馈编辑器','','默认／state=alternate / select-order；选择动物、媒体、订单；输入／删除媒体','state=select-order 打开订单弹层；普通动态可直接输入正文/图片，反馈需选择合法订单和动物后提交。提交后核对持久正文、媒体、动态和证据。','83:10789 83:15056 83:19056','本地正文/媒体/动态证据已持久化且 writer 幂等；继续做真实 fixture 的视觉与运行回归')
page('packages/dynamic/pages/result/index','发布结果展示','','默认动态结果／state=feeding','默认直达仅验结果外观；feeding 显示投喂成功覆盖层。发布结果必须携带实际 dynamicId，再核对返回详情深链。','83:15773','结果页已按 dynamic/feeding 语义拆分；必须用真实 dynamicId 验证返回深链')
page('packages/feeding/pages/result/index','反馈结果展示','orderId=vqa-order&dynamicId=vqa-dynamic&outcome=feedback-published','feedback-published／缺 dynamicId 空态／返回动态深链','从发布编辑器选择订单和猫咪后提交；必须核对正文、媒体、证据和 dynamicId 再进入结果页。','','动态/反馈结果职责已拆分；不把静态成功文案当作持久写入证明')
page('packages/dynamic/pages/detail/index','动态详情','dynamicId=vqa-dynamic','有评论／comments-empty／不存在／私密／未登录；回复输入、图片预览','Q.dynamic(false) 后进入；空评论 Q.dynamic(true) 并带 state=comments-empty；missing ID 测失效。','83:7494 83:7844 83:18416 83:18429','R07 私密坏数据匿名读取已 fail-closed；普通发布结果必须使用实际 dynamicId 回归')
page('packages/dynamic/pages/deep-link/index','动态深链中转','dynamicId=vqa-dynamic','检查身份→读取→跳详情；错误留空态','Q.dynamic() 后进入；Q.logout() 后重进看未登录。中转页不是独立设计画板。','','复用最终详情设计；登录目标恢复未完整接入')
page('packages/auth/pages/login/index','登录','','协议未选／同意／协议弹窗／本地成功','先 Q.logout()；不勾选点击微信登录验协议弹窗；同意后建立 local-user mock 会话。','83:22274 83:18290','真实微信身份交换排除；不会生成 profile/业务数据')
page('packages/auth/pages/phone-bind/index','绑定手机号','','空输入／输入／下一步','从登录→手机号登录；输入本地测试号码，不执行真实短信服务。','83:22336')
page('packages/auth/pages/sms-verify/index','短信验证','phone=13800000000','验证码空／已输入／倒计时／本地成功','优先从手机号页进入；URL 示例仅虚构号码。','83:22396')
page('packages/auth/pages/real-name/index','实名认证','','默认／popup=real-name / privacy；选择/识别','直接编译不同 popup 验提示；不使用真实身份证，不做真实认证提交。','83:15711 83:15574 83:18277')
page('packages/auth/pages/verification-result/index','认证结果','outcome=success','outcome=success / failure（兼容 status=fail）','参数只展示结果，不能据此改变可信身份。','83:19175','节点标题与业务上下文存在歧义，作为复用结果页参考；非认证成功权威证明')
page('packages/adoption/pages/mine/index','我的领养','','列表／state=empty；各申请阶段','Q.adoption(status) 后进入；state=empty 强制视觉空态。状态全集见状态机章节。','83:21696 83:22140','列表与新 actor 过滤仍需核对；旧 mock 列表不能替代申请创建闭环')
page('packages/adoption/pages/confirmation/index','确认领养材料','applicationId=vqa-application','照片空／单张／两张／感受输入／提交错误','先 Q.adoption("pickup")；可选择本地测试图片，验输入与删除。跨用户写缺陷修复前不将提交通过计为验收。','83:15168','本地确认材料 writer 已按 actor/applicationId 门禁；仍需使用有效 fixture 做视觉/运行验收')
page('packages/adoption/pages/progress/index','领养申请人进度','applicationId=vqa-application','13 个持久状态；view=progress / application / adoption-info','每个状态先 Q.adoption(status) 再打开同一路径；view 只切展示视角，不改变业务状态。','83:11204 83:11304 83:12471 83:12609 83:12803 83:13018 83:11645 83:11728','进度服务旧跨用户漏洞已修；奖励订单已按 applicationId 绑定；视觉与运行仍需逐态验收')
page('packages/adoption/pages/review/list/index','领养审核列表','','院主／云家长／评审；待处理／已处理／无身份','Q.adoption("pending","owner") 或 Q.adoption("cloud_pending","cloud")；评审 Q.adoption("jury_confirm_pending","reviewer")；点击列表实际生成详情参数。','','列表无独立精确节点；不能以详情画板代替列表批准')
page('packages/adoption/pages/review/detail/index','领养审核详情','applicationId=vqa-application&reviewItemId=adoption-review-vqa-application&mode=ownerReview','mode=ownerReview / cloudReview / ownerConfirm；popup=agree / reject；通过／拒绝／终态','优先从审核列表进入。院主 pending/owner；云家长 cloud_pending/cloud；院主确认 owner_confirm_pending/owner。弹窗可用 popup=agree/reject。','83:11417 83:11531 83:11973 83:11843 83:12125 83:12303 83:18303 83:18316 83:18329','map 旧示例 id=review-v2-* 不是当前持久夹具')
page('packages/adoption/pages/jury/detail/index','领养评审投票','reviewItemId=adoption-review-vqa-application&businessType=adoption','投票前／real / fake 结果弹窗／已投票／关闭／限额','先 Q.adoption("jury_confirm_pending","reviewer")；用此 reviewItemId；实际投一次后查看关闭态。仅视觉弹窗可带 popup=vote-real 或 vote-fake，不等同于投票写入。','83:13230 83:13874 83:18343 83:18372','业务角色完整隔离仍需核查；本次不替代正向/反向全量运行验收')
page('packages/adoption/pages/apply/index','领养申请','yardId=1','短表单／state=pick-cats；文本／媒体／最多6只／禁选','可直达短表单；选择宠物→填写说明。state=pick-cats 仅选择层。source=rescue 或 state=long 应提示错误域。','83:10860 83:16471','正常创建已绑定可信 applicant；仍需逐态验收创建→本人进度')
page('packages/adoption/pages/result/index','领养结果','applicationId=vqa-application&outcome=application-submitted','application-submitted / confirmation-submitted / review-approved / adoption-confirmed-by-owner / review-rejected / reward-claimed','先创建对应状态夹具再进入。outcome 仅结果文案；正常业务成功回调和 orderId 应另验。','83:16328 83:16271 83:16098 83:16155 83:16212 83:16041','结果页仍接受旧 variant/最近单兜底，不作为写入完成证明')
page('packages/adoption/pages/support/index','助力领养','','默认／popup=insufficient','消息→助力领养；popup=insufficient 验额度提示。','83:22882 83:18552')
page('packages/adoption/pages/quota/index','领养额度','','默认／不足额度提示','消息或我的额度入口；popup=insufficient。','83:23035')
page('packages/adoption/pages/quota/detail/index','额度明细','quotaId=quota-demo-1','有 ID 的演示明细／缺 ID 空态','可直达演示 ID；省略 quotaId 验错误，不把静态演示当真实账本。','83:23120')
page('packages/adoption/pages/reward/claim/index','奖励收货地址','applicationId=vqa-application','地址未选／选择／已选／提交错误／成功','先 Q.adoption("reward")；使用当前申请人的 applicationId 进入，选择本地测试地址并核对成功订单详情。不要执行真实领取。','83:16527','本地 reward writer 已按 actor/applicationId 绑定并由订单详情 reader 消费；真实支付/后端不在本轮，仍需运行态回归')
page('packages/account/pages/settings/index','设置','','默认／退出确认／退出后','我的更多→设置；退出登录应删除 actor 会话。','83:20857')
page('packages/account/pages/tasks/index','任务中心','','待处理／已处理／无身份／四域／冲突诊断','Q.adoption("pending"); Q.rescue(); Q.dynamic(); Q.order(); 然后进入。切换页内 Tab；逐个点击 review 任务，核对 reviewItemId/businessType 进入对应详情；Q.logout() 后重入验无身份。','','review 任务现带详情目标与业务类型，并按 actor/归属聚合；无精确待办设计节点，仍需运行态回归')
page('packages/account/pages/profile/editor/index','本人资料编辑','userId=vqa-owner','可编辑／无身份／非本人／保存／取消','Q.management() 后进入；修改昵称、简介和标签；保存后重进编辑页，并回个人主页核对公开摘要。Q.actor("stranger") 后进入验拒绝。','','本地资料 reader/writer 已接通编辑页与公开摘要；无独立精确编辑稿，仍需运行态回归')
page('packages/account/pages/profile/index','个人主页','userId=vqa-owner','评价／state=dynamic-long；更多／取消关注','默认主要是评价展示；state=dynamic-long 的真实模板分支与标注存在混淆，分别截图核对。昵称 query 只是展示提示。','83:9382 83:9532 83:16865 83:16882','当前 map 的 profile/profile_dynamic 命名与实际旧节点内容错位；不能按名称直接判定')
page('packages/account/pages/relations/index','关注与粉丝','userId=vqa-owner&tab=following','tab=following / followers；关注状态','分别编译两个 tab；从个人主页进入验证返回。','83:14738 83:14630')
page('packages/account/pages/history/index','浏览记录','state=dynamic','state=dynamic / yard / empty','直接编译 state；动态和小院卡片应去各自实体。','83:10317 83:10469','空态仅旧稿 62:30874，未确认新稿对应')
page('packages/account/pages/level/index','等级中心','','默认等级／variant=63 / 64／max=1','普通级与满级分别截图；max=1 为满级。','83:14546 83:14465','当前 map 的 level/level_max 对应颠倒：83:14465 文案 MAX，83:14546 文案 LV.7')
page('packages/account/pages/level/rules/index','等级规则','','规则长页／滚动','等级中心→规则；验证长表格滚动和返回。','83:14846')
page('packages/account/pages/annual-report/index','年度报告','','默认长图／滚动','等级中心→年度报告。','83:15983')
page('packages/account/pages/helped-animals/index','我帮助过的动物','','列表／滚动','等级中心→我帮助过的动物。','83:5277')
page('packages/account/pages/medals/index','我的勋章','','勋章列表','从我的勋章入口；当前主要为本地展示。','83:23607')
page('packages/account/pages/medals/map/index','勋章地图','','地图展示','从勋章页进入，或直接编译。','83:23668')
page('packages/account/pages/medals/achievement/index','获得新勋章','','获得结果','仅视觉直达；不表示真的发放勋章。','83:23706')
page('packages/account/pages/invite/index','邀请入驻','','邀请卡／分享','直接编译或首页邀请入口。','83:15629')
page('packages/animal/pages/editor/index','动物资料编辑','animalId=vqa-animal&yardId=vqa-yard','species=cat / dog；state=more；popup=status / value / gender / sterilization / vaccine / personality；保存／拒绝','先 Q.management()；依次带 species、state、popup；品种点击进入选择器。绝育弹层参数为 popup=sterilization。','83:16893 83:17257 83:17413 83:17963 83:18622 83:18645 83:18700 83:18715 83:18730 83:18749','本地编辑支持已有动物更新与管理名册新增；保存后由公开详情/名册 reader 重读。仍需运行态核对表单视觉与非院主拒绝')
page('packages/animal/pages/breed-picker/index','猫狗品种选择','species=cat','species=cat / dog；popup=supplement / supplement-input / supplement-success','从动物编辑品种栏进入才验回填；直达只验外观。','83:8284 83:8378 83:18806 83:18819 83:19045')
page('packages/animal/pages/mine/index','我的宠物','userId=vqa-applicant','owned 名册／缺 ID','直接编译带 userId；省略参数验空态。当前名册使用本地演示体系。','83:23543')
page('packages/animal/pages/sponsored/index','我的云养','userId=vqa-applicant','云养中／待生效／运输中；筛选','带 userId 进入；当前列表状态取名册组件内演示数据，切换分类/搜索看可见条目。','83:23327')
page('packages/animal/pages/detail/index','动物详情','animalId=roster-cat-1&yardId=1&state=35','state=35 / 36 / 37；popup=adopt-limit；图片／云养／领养入口','最可靠入口：首页→小院→动物卡片，沿用卡片真实演示 ID，再分别替换 state。手填未知 ID 的行为也需记录，不以 idx 回退证明正确动物。','83:9706 83:10114 83:9889 83:18786 83:18796','公开详情优先读取本地动物投影并保留 mock 视觉兜底；state/managed query 只控制展示，不授予权限。仍需运行态核对编辑后回显')
page('packages/animal/pages/album/index','动物相册','animalId=vqa-animal&yardId=vqa-yard','公开相册／管理资格／图片预览','Q.management() 后进入；再切 stranger 对照管理按钮。','83:15830','当前真实相册 reader 缺失时的演示内容与权限需单独记录')
page('packages/yard/pages/detail/index','小院详情','yardId=1&state=dynamic','state=dynamic / dynamic-empty / feeding / dynamic-expanded / reply-idle / reply-input；popup=help-adopt / feedback-stat / food-stat','直接编译不同 state/popup；缺 yardId 应空态。样例 1 是视觉用 mock，不是本地编辑 vqa-yard 的内容。','83:6085 83:6528 83:6787 83:7045 83:18416 83:18429 83:18528 83:18538 83:18566','公开详情优先合并本地小院投影并统一使用 yardId 深链；mock 仅作无记录视觉兜底。仍需运行态核对编辑后公开回显')
page('packages/yard/pages/onboarding/index','小院介绍','','说明长页／创建入口','从首页 + →创建小院前置介绍。','83:5951')
page('packages/yard/pages/create/index','创建小院','kind=cat','kind=cat / dog；state=recorded；popup=voice-permission / voice-limit / location；auth=required','初始实名提示需关闭或走本地认证；录音状态用 state=recorded；实际录音在本地模拟器按权限提示。','83:4429 83:4792 83:16451 83:16459 83:18768 83:18777 83:18277','新聚合稿 83:4577 属新增变化，不能和既有流程自动等同')
page('packages/yard/pages/editor/index','小院资料编辑','yardId=vqa-yard','授权／禁止／保存／取消','Q.management()；编辑名称/简介，保存后重进编辑页；回公开详情核对持久投影。','','本地小院 reader/writer 与公开详情已接通；仍需运行态核对保存刷新、非院主拒绝及视觉稿')
page('packages/yard/pages/animals/index','小院公开动物名册','yardId=1&view=roster','view/state=roster / status / long-list；搜索／筛选','从小院“查看全部动物”进入；直达仅验名册外观。','83:23194 83:4948','公开名册与管理态不能用同一份管理权限断言')
page('packages/yard/pages/manage/animals/index','小院管理动物名册','yardId=vqa-yard','管理名册／增加／动物项／缺 ID','Q.management() 后进入；院主可通过“增加”进入独立创建合同，保存后回到管理名册验证新增项。','83:5104','管理名册已按可信 actor/yard 关系读取并支持新增动物；仍需运行态核对院主与陌生人边界、回显及视觉')
page('packages/yard/pages/certification/index','小院认证','yardId=vqa-yard&state=97','state=97 表单 / 98 已通过 / 99 审核中','不同 state 仅本地视觉演示；上传/提交保持当前限制，不做真实资质提交。','83:17568 83:17712 83:17846 83:15926')
page('packages/address/pages/list/index','地址列表','kind=shipping','kind=shipping / service；intent=select；state=manage / delete / empty / pick','从设置进入管理；从奖励地址弹层进入选择才验 addressSelected 回填。先在本地新增虚构地址；空态用 state=empty（按页面实际分支）。','83:19712 83:19803 83:19894 83:19988 83:20054 83:20164')
page('packages/address/pages/editor/index','地址新建与编辑','kind=shipping','kind=shipping / service；state=typing；addressId 新建/编辑','新增不用 addressId，已有记录从列表编辑进入。typing 是输入展示态；地区选择回填须从表单进入。','83:19234 83:19329 83:19418 83:19522 83:22623')
page('packages/address/pages/region-picker/index','地区选择','','默认省份／state=city / street / back；mode=city','直接编译可验各层；完整回填从地址编辑或建院地区栏进入。','83:20274 83:20705 83:20562 83:20417')
page('packages/jury/pages/queue/index','评审任务队列','businessType=adoption','businessType=adoption / rescue；tab=finished；待投票／已结束','Q.adoption("jury_confirm_pending","reviewer") 后看领养任务；救助采用 Q.rescue("platform_approved","pending","funding_pending","reviewer")。','83:14169','与 account.tasks 是不同入口；公开演示 jury-item 与持久 reviewItemId 不混用')
page('packages/rescue/pages/progress/index','救助申请人进度','rescueId=vqa-rescue','平台 pending / approved / rejected × 独立评审轴 × 独立资金轴','Q.rescue() 后进入；合法已打款展示用 Q.rescue("platform_approved","approved","funding_paid")；失败用 funding_failed，未审核通过不能显示打款成功。','','申请人进度 reader 已按当前 actor/申请人归属 fail-closed；无独立精确进度稿，仍需运行态回归')
page('packages/rescue/pages/fund/index','公开救助基金池','','公开列表／余额／投票中／已结束／资金结果','Q.rescue() 后查看；只读公开基金，不把它当我的救助。','83:14289')
page('packages/rescue/pages/detail/index','公开救助详情','rescueId=vqa-rescue','详情／证据／证实入口／缺 ID／未知 ID','Q.rescue() 后进入；点击证实列表再新增证实。','83:13477')
page('packages/rescue/pages/review/list/index','我的救助审核','','待处理／已处理／无身份','Q.rescue("platform_approved","pending","funding_pending","reviewer") 后进入，点记录进入详情。','','无独立审核列表精确节点，不以基金池代替')
page('packages/rescue/pages/review/detail/index','救助审核详情','reviewItemId=vqa-rescue-review&rescueId=vqa-rescue&businessType=rescue','pending 可操作→approved/rejected 不可重复；缺身份/无归属','先用救助 reviewer 夹具；只对 vqa 记录本地通过/拒绝，再返回列表检查。','83:13230','待投票稿为职责参考；本地通过/否决与票选布局差异需逐页记录')
page('packages/rescue/pages/proof/list/index','救助证实列表','rescueId=vqa-rescue','无证实／有证实／已证实','Q.rescue()；空证实默认；有内容需从本地证实表单完成一条测试证实再返回。','83:15264')
page('packages/rescue/pages/proof/create/index','我也来证实','rescueId=vqa-rescue','空输入／已填写／协议／重复提交','Q.rescue() 后从详情证实进入；仅虚构姓名证件与本地数据，不做真实提交。','83:17049','证实者身份仍需接入统一 actor；本次不宣称完整权限验收')
page('packages/rescue/pages/mine/index','我发起的救助','','本人有记录／空／无身份','Q.rescue() 默认 applicant；Q.actor("stranger") 看空；Q.logout() 看拒绝。','','无独立精确节点')
page('packages/rescue/pages/apply/index','救助申请长表单','yardId=1','长表单／金额／协议／媒体／错误域','固定 rescue；source=adoption 或 state=pick-cats 应拒绝。仅验表单和本地写边界。','83:10978','本地救助申请已绑定当前可信 actor，并对跨身份/非法来源 fail-closed；仍需运行态核对正常申请→本人进度')
page('packages/rescue/pages/result/index','救助申请结果','rescueId=vqa-rescue&outcome=application-submitted','有效 ID／缺 ID','Q.rescue() 后进入；结果 UI 复用不等于申请真的由当前用户创建。','','无独立精确救助结果节点，不能将领养结果冒充已批准对应')
page('packages/feeding/pages/mine/index','我的投喂','','默认／state=30 空态；筛选','从我的投喂进入；本页仍用演示订单列表，不等于 vqa 持久订单可见性闭环。','83:23734 83:9197','隐藏偏好未证明被所有列表消费')
page('packages/feeding/pages/yard-orders/index','小院投喂订单','yardId=1','院主列表／筛选／订单详情','从管理名册投喂入口进入；query 的 yardOwnerId 不是权限凭证。','83:9255','列表仍为 mock reader，需与持久详情和 actor 对齐')
page('packages/feeding/pages/order/detail/index','投喂与赠礼订单详情','orderId=vqa-order','持久 shipping / delivered / completed；隐藏／恢复；旧 variant=90 / 91 / 92','Q.order(status) 后打开持久详情。旧视觉分支仅持久读取失败时触发；从 mock 列表点击取得有效 mock orderId 再加 variant，不能以 variant 强制覆盖持久记录。','83:16557 83:16705','投喂与领养赠礼订单已使用带 actor/type 的持久 reader，隐藏状态可恢复；仍需运行态核对详情深链和视觉状态')
page('pages/dev/paw-icon-lab','图标实验室（开发）','','图标集合／大小与光学校准','仅开发自定义编译；不列入生产页面视觉完成数。','','开发验收工具，无业务 Figma 页面')
page('pages/dev/yard-feed-icon-lab','投喂图标实验室（开发）','','投喂图标样例','仅开发自定义编译。','','开发验收工具，无业务 Figma 页面')
page('pages/dev/governance-fixture','治理夹具（开发）','','院主／云家长／评审／救助审核／三类编辑','旧夹具按钮会 seedAll 覆盖六个 PAWHOME_* 集合，清空按钮删除整 key。优先使用本文安全备份助手；若使用旧页先导出相关数据。','','非业务画板；不能把夹具成功视为普通入口可用')

if(routes.some(r=>!config[r])) throw new Error('缺少页面说明: '+routes.filter(r=>!config[r]).join(','))
if(Object.keys(config).some(r=>!routes.includes(r))) throw new Error('文档包含已失效路由')
const formal=[]
for(const [pk,p] of Object.entries(map.pages))for(const [sk,s]of Object.entries(p.states||{}))formal.push({key:pk+'.'+sk,name:s.name||sk,route:(s.route||p.route||'').replace(/^\//,''),node:s.node_id,file:s.file_key||map.figma.file_key,query:s.query||{},runtime:s.runtime||null})
const records=routes.map((route,i)=>{
 const c=config[route];const states=formal.filter(s=>s.route===route);const refs=c.refs.map(id=>({id,title:titleOf(id),url:figma(id),kind:states.some(s=>s.node===id&&s.file===currentKey)?'正式 map':'本次精确节点元数据参考'}));
 for(const s of states)if(!refs.some(r=>r.id===s.node))refs.push({id:s.node,title:s.name,url:figma(s.node,s.file),kind:s.file===currentKey?'正式 map':'正式 map 保留旧稿'});
 return {number:i+1,id:'P'+String(i+1).padStart(2,'0'),route,...c,refs,formal:states,source:route+'.vue',dev:route.startsWith('pages/dev/'),method:manifest.tabBar.list.some(t=>t.pagePath===route)?'Tab：无参数用 wx.switchTab；带状态用自定义编译启动参数':'普通页：wx.navigateTo；栈满用 wx.redirectTo，返回验收从正常入口进入',url:'/'+route+(c.query?'?'+c.query:'')};
})
const output='docs/design/全量页面与状态验收手册-20260921'
const intro=`# 全量页面与状态验收手册

更新：2026-09-21。**${records.length} 个注册页面（${records.filter(r=>!r.dev).length} 个业务页面 + ${records.filter(r=>r.dev).length} 个开发页）全部列入；${formal.length} 条正式 Figma 状态映射另附逐条索引。** 本手册是视觉验收导航，不是治理通过证明。

当前剩余运行、后端边界和视觉阻断见 [全量治理审查](../architecture-audit/13-20260921全量治理审查.md)。不要等这些阻断全修才看所有页面：可先验静态外观，但带限定的保存、权限和闭环需按本文记录。

## 使用方法

1. 终端在项目目录运行 npm run dev:mp-weixin；仅复用已经打开且指向 unpackage/dist/dev/mp-weixin 的开发者工具窗口。无窗口时由你手动打开，不新开第二个实例。
2. 开发者工具顶部“编译”下拉→添加编译模式。启动页面填写下面路径（**去掉开头 /，不带 .vue**）；启动参数单独填写 ? 后的 query（**不带 ?**）。页面名和参数分别复制。
3. 普通页也可在 AppService Console 执行 wx.navigateTo({url:'完整路径?参数'})。四个 Tab 用 wx.switchTab({url:'/pages/me/index'})；Tab 状态参数用自定义编译，不通过 switchTab 传 query。
4. 需要业务状态时，将 [visual-acceptance-console.ts](visual-acceptance-console.ts) 全文粘贴到 AppService Console，只安装助手。随后执行 var Q=getApp().pawQA。下表 Q.* 只生成 vqa-* 本地夹具，并返回建议 URL；再执行 Q.go(url) 或按表进入页面。
5. 助手首次写每个 key 前备份，生成夹具不替换整个集合；每个领域复用自己的 vqa ID。结束执行 Q.restore()。验收期间勿混做正式业务编辑；恢复会还原助手触及 key。**不要直接点击旧治理夹具页“清空”**，它会删除整个业务 key。
6. 状态来自持久记录时不能靠 status/role/managed query 授权。Q.actor('stranger') 和 Q.logout() 用于反例；切身份后重新进入页面，以当前实现 onLoad/onShow 为准。
7. 每页记录：设备宽度（建议375逻辑 px）、角色、URL、fixture状态、截图、差异、通过/失败/阻塞。先比较业务内容，再比尺寸；系统状态栏/微信胶囊/Home Indicator 由系统提供，不要求业务代码复刻。

**节点标签**：“正式 map”来自 figma-map.yaml；“本次精确节点元数据参考”是本次读取新旧 Figma 节点、核对职责和文案后补充的定位参考，不自动覆盖正式设计批准。旧稿明确保留 file_key，不把旧 node_id 拼进新文件。无节点的页面仍列出，明确待设计，不能伪造映射。

**助手覆盖边界**：已做 Node 模拟 storage/读模型检查；未把每条助手路径都在模拟器点一遍。夹具支持不替代真实后端；本地 actor、发布、登录恢复和保存刷新已由合同/独立测试覆盖，仍需在已打开 DevTools 做全路径回归。媒体用既有本地测试图片，像素验收应另换设计一致素材。

## 状态机与切换办法

### 领养（持久业务状态）

无云家长：pending → pickup → owner_confirm_pending → jury_confirm_pending → adoption_confirmed → reward → reward_done。

有云家长：cloud_pending → pending，再进入上述链路。cloud_pending/pending 等审批阶段可 rejected；处理中可 abandoned；reward_done/rejected/abandoned/cloud_rejected 为终态。owner_confirm、jury_confirm 是旧兼容状态，分别有相应后继；完整允许边见 utils/adoptionStorage.ts 的 ADOPTION_TRANSITIONS。多云家长缺批准策略应拒绝推进，不能自行选择全票或任一票。

每态：Q.adoption('状态','角色')；角色 applicant / owner / cloud / reviewer / stranger。然后打开进度页 applicationId=vqa-application。审核通过/拒绝应用正确角色走列表→详情；状态夹具只供展示，不证明上一个动作合法。视图 view=application/adoption-info 不改变状态。确认材料与奖励 writer 已按 actor/applicationId 绑定；真实后端/支付不在本轮，仍需运行与视觉回归。

### 救助（三条独立状态轴）

- 平台申请：platform_pending → platform_approved 或 platform_rejected。
- 评审：pending → approved 或 rejected，一次性动作后关闭。
- 资金：funding_pending / funding_failed / funding_paid，只读结果；不得由审核通过推导已打款。

例：Q.rescue('platform_approved','approved','funding_paid','applicant')。审核页：Q.rescue('platform_approved','pending','funding_pending','reviewer')。故意组合冲突状态时应显示冲突/未知而非成功；这是反例验收。

### 订单、反馈、动态、管理与消息

- Q.order('shipping'/'delivered'/'completed') → 持久订单只读详情；隐藏→重进仍隐藏→恢复。普通投喂和领养赠礼是不同类型，赠礼不得出现支付/退款/再买。旧 variant 90/91/92 是视觉样例，不是状态机。
- 反馈应为选择合法订单/动物→正文/图片→持久发布→证据 append→重读计数→结果→同一动态；本地/mock writer 已保存正文、媒体、动态和证据并保持幂等。真实后端、超时策略和 moderation 仍不在本轮范围，不提供伪造 query 当完成。
- Q.dynamic(false) / Q.dynamic(true) → 有评论/空评论；visibility=private 可测私密态；缺 ID / 不存在 / 换人另测。删除/更正 writer 仍关闭，不提供假成功入口。
- Q.management() → profile/yard/animal 三类本地 reader/writer；保存→重进编辑页、公开页与名册均重读持久字段。无记录/非本人/非院主应拒绝；新增动物走独立 create 合同。
- Q.message() → order/interaction 通知→当前持久记录；任务 pending/processed 由各域状态聚合，review 任务携带 reviewItemId/businessType 进入 canonical 详情。云端 producer 不在本地范围。
- 登录：未登录→协议→本地 local-user；退出删除会话。真实微信身份交换不在本轮。自动恢复受限深链仍需补测和修复。

## 页面总览

| 编号 | 页面 | 路径 | 设计引用 | 提示 |
|---|---|---|---|---|
${records.map(r=>`| [${r.id}](#${r.id.toLowerCase()}) | ${r.title} | \`${r.route}\` | ${r.refs.length} | ${r.issue?'有阻断/限定':'可进入逐页验收'} |`).join('\n')}

## 逐页操作卡
`
const escPipe = x=>String(x).replaceAll('|','\\|').replaceAll('\n',' ')
let md=intro
for(const r of records){md+=`\n<a id="${r.id.toLowerCase()}"></a>\n\n### ${r.id} ${r.title}\n\n- 启动页面：\`${r.route}\`\n- 启动参数：\`${r.query||'（留空）'}\`\n- 完整 URL：\`${r.url}\`\n- 进入方式：${r.method}\n- 状态/弹层：${r.states}\n- 操作步骤：${r.steps}\n- Figma：${r.refs.length?r.refs.map(x=>`[${x.title} · ${x.id}](${x.url})（${x.kind}）`).join('；'):'**未登记精确节点，待设计补充；不猜对应页面。**'}\n- 验收边界：${r.issue||'本文未执行该页完整视觉验收；按正常入口补返回/刷新/空态。'}\n- 源码：[${r.source}](../../${r.source})\n- 记录：□ 未验　□ 通过　□ 差异　□ 业务阻塞；截图：______；备注：______\n`}
md+=`\n## 正式 map 的 ${formal.length} 条状态索引（保留原始参数，勿盲目照抄）\n\n下表是原 map 快照，用于核查覆盖；实际进入步骤优先使用上面的操作卡。demo-*、review-v2-*、jury-item-* 是历史示例，可能被当前持久 reader 拒绝；以 Q.* 生成的 vqa 记录替换。\n\n| 状态键 | 当前页面 | Figma | map 原始 query |\n|---|---|---|---|\n`
for(const s of formal)md+=`| ${s.key} | ${records.find(r=>r.route===s.route)?.id||'未注册'} | [${s.node}](${figma(s.node,s.file)})${s.file===currentKey?'':' 旧稿'} | ${escPipe(JSON.stringify(s.query))} |\n`
md+=`\n## 本次核对发现的设计索引问题\n\n- 正式 map 的 68 状态仅覆盖 ${new Set(formal.map(s=>s.route)).size} 个不同页面，不能代表 ${records.filter(r=>!r.dev).length} 个业务页面全覆盖。\n- account.profile 的旧节点 62:29619 实际是动态；account.profile_dynamic 的 62:29769 实际包含评价。新稿分别参考 83:9382 动态与 83:9532 评价，需按实际模板验，不跟随误名。\n- account.level 的 62:34597 对应新稿 83:14465（MAX）；level_max 的 62:34678 对应 83:14546（LV.7）。原状态名/query 与节点含义颠倒。\n- 搜索动态有结果、浏览历史空态、旧普通投粮90，尚无等价新节点确认。旧 AppHeader 来源仅历史参考，原生 chrome 不重画。\n- 原新旧映射声明仅有两项例外已不足覆盖后加 retained-legacy 状态；本手册保留全部真实来源，补充元数据见 acceptance-20260921-figma-reference.tson。\n\n生成方式：node scripts/build-visual-acceptance-guide.cjs。修改页面/状态后需重新审查人工操作说明，不能只自动更新路径。\n`
fs.writeFileSync(path.join(root,output+'.md'),md)
fs.writeFileSync(path.join(root,output+'.tson'),JSON.stringify({date:'2026-09-21',registered:records.length,production:records.filter(r=>!r.dev).length,formalCount:formal.length,pages:records},null,2)+'\n')
const h=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const cards=records.map(r=>`<article id="${r.id}" data-search="${h([r.title,r.route,r.states,r.issue,...r.refs.map(x=>x.id)].join(' '))}" data-domain="${r.route.split('/')[1]}" data-issue="${r.issue?'1':'0'}"><div class="cardhead"><span class="num">${r.id}</span><h2>${h(r.title)}</h2><select class="verdict" aria-label="${h(r.title)}验收状态"><option>未验</option><option>通过</option><option>有差异</option><option>业务阻塞</option></select></div><label>启动页面</label><pre>${h(r.route)}</pre><label>启动参数</label><pre>${h(r.query||'（留空）')}</pre><p class="muted">${h(r.method)}</p><h3>状态与进入方法</h3><p>${h(r.states)}</p><p>${h(r.steps)}</p><h3>Figma 对照</h3><div class="links">${r.refs.length?r.refs.map(x=>`<a target="_blank" rel="noreferrer" href="${h(x.url)}">${h(x.title)} <b>${h(x.id)}</b><small>${h(x.kind)}</small></a>`).join(''):'<p>未登记精确节点，待设计补充。</p>'}</div>${r.issue?`<p class="issue">${h(r.issue)}</p>`:''}<details><summary>正式映射原始状态（${r.formal.length}）</summary><pre>${h(r.formal.map(s=>s.key+' '+JSON.stringify(s.query)).join('\n')||'无')}</pre></details><textarea placeholder="截图路径、差异、备注（建议导出记录保存）" aria-label="${h(r.title)}备注"></textarea></article>`).join('')
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>逢猫 · 全量页面验收手册</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f5f1;color:#202921;font:15px/1.7 system-ui,-apple-system,sans-serif}header,main{max-width:1100px;margin:auto;padding:32px}header{padding-bottom:12px}h1{font-size:32px;line-height:1.3}h2{margin:0;font-size:21px}h3{font-size:15px;margin-bottom:4px}.eyebrow{color:#5f775e;letter-spacing:2px}.summary{display:flex;gap:12px;flex-wrap:wrap}.summary span{background:#e5ebdf;padding:10px 18px;border-radius:8px}.toolbar{position:sticky;top:0;z-index:2;background:#f4f5f1ed;backdrop-filter:blur(12px);padding:12px 0;display:flex;gap:10px;flex-wrap:wrap}input,select,button,textarea{font:inherit;border:1px solid #c6d0c2;border-radius:7px;padding:9px;background:white}input{flex:1;min-width:210px}button{cursor:pointer}article{background:white;border:1px solid #e0e5da;border-radius:14px;padding:26px;margin:20px 0;scroll-margin-top:85px}.cardhead{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.cardhead select{margin-left:auto}.num{color:#44693b;font-weight:700}label{display:block;color:#6b7568;font-size:12px;margin-top:13px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f5ed;padding:10px;border-radius:7px;margin:4px 0;font-size:13px}.muted,small{color:#6e756c;font-size:12px}.links{display:flex;flex-wrap:wrap;gap:8px}.links a{border:1px solid #d4dfcc;background:#f9fbf5;border-radius:8px;padding:8px 12px;color:#2a5435;text-decoration:none}small{display:block}.issue{background:#fff4e0;border-left:3px solid #b9822c;padding:10px 14px}textarea{width:100%;height:80px;margin-top:12px}details{margin-top:12px}.guide{background:#e8eee1;padding:16px 24px;border-radius:12px}.guide a{color:#215237}#counter{font-size:13px}a{color:#2a5435}@media print{.toolbar,button{display:none}article{break-inside:avoid}body{background:white}header,main{padding:12px}textarea{border:none}}</style><header><div class="eyebrow">PAWHOME / ACCEPTANCE · 2026.09.21</div><h1>全量页面与状态验收手册</h1><p>逐页找入口，逐态对设计。业务阻断与视觉差异分别记录。</p><div class="summary"><span>${records.length} 注册页面</span><span>${records.filter(r=>!r.dev).length} 业务页面</span><span>${formal.length} 正式映射状态</span><span>视觉均待人工验收</span></div></header><main><section class="guide"><h2>先看这里</h2><p>使用已打开且指向 <b>unpackage/dist/dev/mp-weixin</b> 的开发者工具。添加自定义编译模式：页面路径不带 / 和 .vue，参数不带 ?。普通页面可用 wx.navigateTo；Tab 带状态用自定义编译。</p><p>需要状态数据：将 <a href="visual-acceptance-console.ts">Console 助手</a>全文粘贴到 AppService Console，再执行 <b>var Q=getApp().pawQA</b>。Q.* 只生成本地夹具，返回 URL；Q.go(URL) 打开普通页。结束执行 <b>Q.restore()</b>。</p><p>业务状态机、完整操作说明、68条原始映射、来源例外见 <a href="${path.basename(output)}.md">Markdown 完整手册</a>；审查结论见 <a href="../architecture-audit/13-20260921全量治理审查.md">全量治理审查</a>。旧夹具“清空”删除整个 key，不要误用。</p><p>此文件无远程脚本。验收记录尝试保存在当前浏览器，建议每次点击“导出记录”；浏览器禁用本地存储时仅内存保留。</p></section><div class="toolbar"><input id="search" aria-label="搜索" placeholder="搜索页面、路径、状态、节点或问题"><select id="domain"><option value="">全部领域</option>${[...new Set(records.map(r=>r.route.split('/')[1]))].map(d=>`<option>${h(d)}</option>`).join('')}</select><label><input type="checkbox" id="issues">仅看有限定/阻断</label><button id="export">导出记录</button><button onclick="window.print()">打印</button></div><div id="counter"></div>${cards}</main><script>const cards=[...document.querySelectorAll('article')];function filter(){const q=document.querySelector('#search').value.toLowerCase(),d=document.querySelector('#domain').value,only=document.querySelector('#issues').checked;let n=0;cards.forEach(c=>{c.hidden=!(c.dataset.search.toLowerCase().includes(q)&&(!d||c.dataset.domain===d)&&(!only||c.dataset.issue==='1'));if(!c.hidden)n++});document.querySelector('#counter').textContent='显示 '+n+' / '+cards.length+' 页'}document.querySelectorAll('.toolbar input,.toolbar select').forEach(x=>x.addEventListener('input',filter));function snapshot(){return Object.fromEntries(cards.map(c=>[c.id,{status:c.querySelector('select').value,note:c.querySelector('textarea').value}]))}let saved={};try{saved=JSON.parse(localStorage.getItem('paw-acceptance-20260921')||'{}')}catch(e){}cards.forEach(c=>{if(saved[c.id]){c.querySelector('select').value=saved[c.id].status;c.querySelector('textarea').value=saved[c.id].note}c.addEventListener('input',()=>{try{localStorage.setItem('paw-acceptance-20260921',JSON.stringify(snapshot()))}catch(e){}})});document.querySelector('#export').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify({date:new Date().toISOString(),pages:snapshot()},null,2)],{type:'application/json'}));a.href=u;a.download='逢猫-视觉验收记录.tson';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};filter();</script></html>`
fs.writeFileSync(path.join(root,output+'.html'),html)
console.log(JSON.stringify({pages:records.length,business:records.filter(r=>!r.dev).length,formalStates:formal.length,formalRoutes:new Set(formal.map(s=>s.route)).size,outputs:[output+'.md',output+'.html',output+'.tson']}))
