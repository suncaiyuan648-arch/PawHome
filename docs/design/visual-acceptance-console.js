/* 在微信开发者工具 AppService Console 粘贴本文件。仅安装助手，不自动写入业务数据。
 * 所有 seed 都是视觉夹具，不代表正常生产链路已通过。结束后执行 getApp().pawQA.restore()。
 * 会话内只做 QA：恢复会覆盖本次助手触及 key 的后续更改。不要在真机/真实数据环境使用。
 */
(function () {
  const app = getApp();
  if (app.pawQA) { console.log('pawQA 已安装；请先 restore() 再重新安装。'); return; }
  const backupKey = 'PAWHOME_VISUAL_QA_BACKUP_20260921';
  let backup = wx.getStorageSync(backupKey) || {};
  function save(key, value) {
    if (!Object.prototype.hasOwnProperty.call(backup, key)) {
      const exists = wx.getStorageInfoSync().keys.includes(key);
      backup[key] = { exists, value: exists ? wx.getStorageSync(key) : null };
      wx.setStorageSync(backupKey, backup);
    }
    wx.setStorageSync(key, value);
  }
  function rows(key) {
    let x = wx.getStorageSync(key);
    if (x === '' || x == null) return [];
    if (typeof x === 'string') x = JSON.parse(x);
    if (!Array.isArray(x)) throw new Error(key + ' 不是数组，停止生成夹具');
    return x;
  }
  function put(key, record, idField) {
    const all = rows(key), id = record[idField];
    save(key, all.filter(x => x && x[idField] !== id).concat([record]));
  }
  function actor(role = 'applicant') {
    const roles = { applicant: ['applicant'], owner: ['owner', 'yard_owner', 'animal_manager'], cloud: ['cloud_parent'], reviewer: ['reviewer'], stranger: ['applicant'] };
    if (!roles[role]) throw new Error('角色仅支持 applicant / owner / cloud / reviewer / stranger');
    const value = { id: 'vqa-' + role, roles: roles[role] };
    save('PAWHOME_ACTOR_SESSION', { sessionId: 'vqa-session-' + role, actor: value });
    return value;
  }
  function go(url) { wx.navigateTo({ url, fail: e => console.error('进入失败；Tab 请用 switchTab 或自定义编译：', e) }); return url; }
  const api = {
    actor,
    go,
    logout() { save('PAWHOME_ACTOR_SESSION', null); },
    adoption(status = 'pending', role = 'applicant') {
      const allowed = ['cloud_pending','cloud_rejected','pending','rejected','pickup','owner_confirm','owner_confirm_pending','jury_confirm','jury_confirm_pending','adoption_confirmed','reward','reward_done','abandoned'];
      if (!allowed.includes(status)) throw new Error('未知领养状态');
      actor(role);
      const cloud = status === 'cloud_pending' || status === 'cloud_rejected';
      const phase = cloud ? 'cloud_parent' : status.startsWith('jury_') ? 'jury' : status.startsWith('owner_confirm') ? 'owner_confirm' : 'owner';
      const reviewerRole = cloud ? 'cloud_parent' : phase === 'jury' ? 'reviewer' : 'owner';
      const reviewerId = cloud ? 'vqa-cloud' : phase === 'jury' ? 'vqa-reviewer' : 'vqa-owner';
      put('PAWHOME_ADOPTIONS', {
        id: 'vqa-application', applicationId: 'vqa-application', applicationType: 'adoption', businessType: 'adoption',
        applicantId: 'vqa-applicant', applicantName: '验收申请人', ownerId: 'vqa-owner', ownerPawId: 'vqa-owner',
        yardId: 'vqa-yard', yardName: '视觉验收小院', status, cloudParentRequired: cloud,
        cloudParentPawId: cloud ? 'vqa-cloud' : '', cloudParentIds: cloud ? ['vqa-cloud'] : [], cloudParentApprovals: [],
        pets: [{ id: 'vqa-animal', name: '验收猫咪', avatar: '/static/home-feed-1.png' }],
        applyText: '逐页验收申请说明：请核对正文换行、图片、身份标签、状态与底部操作。',
        mediaPaths: ['/static/home-feed-1.png'], proofPhotos: ['/static/home-feed-1.png','/static/home-feed-1.png'], confirmStory: '领养确认材料验收正文。',
        review: { applicationType: 'adoption', applicationId: 'vqa-application', reviewItemId: 'adoption-review-vqa-application', phase, reviewerRole, reviewerId, status: 'pending' },
        createdAt: Date.now()
      }, 'id');
      return '/packages/adoption/pages/progress/index?applicationId=vqa-application';
    },
    rescue(applicationStatus = 'platform_pending', reviewStatus = 'pending', fundingStatus = 'funding_pending', role = 'applicant') {
      if (!['platform_pending','platform_approved','platform_rejected'].includes(applicationStatus)) throw new Error('未知平台状态');
      if (!['pending','approved','rejected'].includes(reviewStatus)) throw new Error('未知审核状态');
      if (!['funding_pending','funding_failed','funding_paid'].includes(fundingStatus)) throw new Error('未知资金状态');
      actor(role);
      put('PAWHOME_RESCUES', {
        id: 'vqa-rescue', rescueId: 'vqa-rescue', applicationType: 'rescue', businessType: 'rescue',
        applicantId: 'vqa-applicant', applicant: { id:'vqa-applicant', name:'验收申请人', avatar:'/static/home-feed-1.png' },
        applicantName:'验收申请人', yardId:'vqa-yard', yardName:'视觉验收小院', amount:320,
        applicationStatus, status:reviewStatus, reviewStatus, fundingStatus,
        reviewItemId:'vqa-rescue-review', reviewerId:'vqa-reviewer', reviewerIds:['vqa-reviewer'], reviewerAuthorized:true,
        review:{reviewItemId:'vqa-rescue-review',status:reviewStatus,reviewerId:'vqa-reviewer'},
        summary:'本地视觉救助', description:'救助详情长正文验收，仅用于本地状态展示。', media:['/static/home-feed-1.png'], proofList:[], evidenceCount:0,createdAt:Date.now()
      },'id');
      return '/packages/rescue/pages/progress/index?rescueId=vqa-rescue';
    },
    management() {
      actor('owner');
      put('PAWHOME_PROFILE_RECORDS',{userId:'vqa-owner',status:'active',nickname:'视觉验收用户',bio:'资料简介',tags:['验收']},'userId');
      put('PAWHOME_YARD_RECORDS',{yardId:'vqa-yard',ownerId:'vqa-owner',yardOwnerId:'vqa-owner',status:'active',name:'视觉验收小院',location:'长沙',description:'小院说明',intro:'小院公告',tags:[]},'yardId');
      put('PAWHOME_ANIMAL_RECORDS',{animalId:'vqa-animal',yardId:'vqa-yard',yardOwnerId:'vqa-owner',managerId:'vqa-owner',status:'active',name:'验收猫咪',breed:'蓝金',desc:'动物说明',avatar:'/static/home-feed-1.png'},'animalId');
      return {profile:'/packages/account/pages/profile/editor/index?userId=vqa-owner',yard:'/packages/yard/pages/editor/index?yardId=vqa-yard',animal:'/packages/animal/pages/editor/index?animalId=vqa-animal&yardId=vqa-yard'};
    },
    dynamic(emptyComments = false, visibility = 'public') {
      actor('applicant');
      put('PAWHOME_DYNAMIC_RECORDS', {id:'vqa-dynamic',dynamicId:'vqa-dynamic',authorId:'vqa-applicant',status:'published',visibility,
        author:{id:'vqa-applicant',name:'验收作者',avatar:'/static/home-feed-1.png'},yardId:'vqa-yard',yardName:'视觉验收小院',content:'验收正文：这段内容来自持久记录。请核对作者、小院、图片、评论和返回刷新。',
        mediaItems:['/static/home-feed-1.png'],comments:emptyComments?[]:[{id:'vqa-comment',name:'验收评论者',text:'这是一条验收评论',avatar:'/static/home-feed-1.png',likes:2}],createdAt:new Date().toISOString()},'id');
      return '/packages/dynamic/pages/detail/index?dynamicId=vqa-dynamic' + (emptyComments?'&state=comments-empty':'');
    },
    order(status = 'shipping', role = 'applicant') {
      actor(role);
      put('PAWHOME_FEEDING_ORDERS',{id:'vqa-order',orderId:'vqa-order',userId:'vqa-applicant',yardOwnerId:'vqa-owner',yardId:'vqa-yard',animalId:'vqa-animal',status,createdAt:new Date().toISOString()},'id');
      return '/packages/feeding/pages/order/detail/index?orderId=vqa-order';
    },
    message() {
      this.dynamic(); this.order();
      for (const domain of ['dynamic','feeding']) put('PAWHOME_MESSAGES',{
        messageId:'vqa-message-'+domain,eventKey:'vqa-event-'+domain,recipientId:'vqa-applicant',category:domain==='dynamic'?'interaction':'order',
        title:'视觉验收消息',preview:'打开当前持久记录',createdAt:new Date().toISOString(),businessType:domain,businessId:domain==='dynamic'?'vqa-dynamic':'vqa-order'
      },'messageId');
      return '/packages/message/pages/list/index?category=order';
    },
    restore() {
      const saved=wx.getStorageSync(backupKey)||backup;
      Object.keys(saved).forEach(key=>{if(saved[key].exists)wx.setStorageSync(key,saved[key].value);else wx.removeStorageSync(key)});
      wx.removeStorageSync(backupKey);backup={}; console.log('已恢复助手触及的 storage；未清空其他 key。');
    },
    status(){return {actor:wx.getStorageSync('PAWHOME_ACTOR_SESSION'),backedUpKeys:Object.keys(backup)};}
  };
  app.pawQA=api;
  console.log('已安装 getApp().pawQA；尚未生成夹具。例：const url = getApp().pawQA.adoption("pending"); getApp().pawQA.go(url)');
})();
