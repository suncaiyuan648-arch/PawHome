<template>
  <view class="af-page" :class="['af-frame-' + frameNumber, { 'af-yellow': yellowTop, 'af-progress-page': progressMode }]">
    <!-- #ifndef MP-WEIXIN -->
    <image class="af-statusbar-reference" :src="statusBarReference" mode="scaleToFill" />
    <!-- #endif -->
    <view class="af-top">
      <view class="af-statusbar">
        <text>9:41</text>
        <view class="af-system-icons" aria-label="系统状态">
          <uni-icons type="bars" color="#111" :size="13" />
          <uni-icons type="wifi" color="#111" :size="13" />
          <uni-icons type="circle-filled" color="#111" :size="10" />
        </view>
      </view>
      <view class="af-nav">
        <view class="af-nav-side af-back" role="button" aria-label="返回" @click="goBack">
          <image src="/static/nav-back-arrow.png" mode="aspectFit" />
        </view>
        <text class="af-nav-title">{{ navTitle }}</text>
        <view class="af-mini-menu" aria-label="小程序菜单">
          <uni-icons type="more-filled" color="#222" :size="18" />
          <view class="af-menu-rule" />
          <uni-icons type="circle-filled" color="#111" :size="14" />
        </view>
      </view>
    </view>

    <view class="af-content">
      <view class="af-heading">
        <image v-if="frameNumber === 50" class="af-heading-status-image" src="/static/figma/adoption-flow/status-check-outline.png" mode="scaleToFill" />
        <image v-else-if="statusCheckAsset" class="af-heading-status-image" src="/static/figma/adoption-status-check.png" mode="aspectFit" />
        <uni-icons v-else :type="statusIcon" :color="statusIconColor" :size="16" />
        <text>{{ statusText }}</text>
      </view>

      <view v-if="progressMode" class="af-progress-card">
        <view class="af-progress-track">
          <view class="af-progress-fill" :style="{ width: progressWidth }" />
          <view v-for="step in 4" :key="step" class="af-progress-dot" :class="{ active: step <= progressStep }" :style="{ left: progressDotLeft(step) }">
            <uni-icons v-if="step === 4 && frameNumber === 57" type="medal-filled" color="#ff9800" :size="22" />
            <uni-icons v-else-if="step <= progressStep" type="checkmarkempty" color="#333" :size="9" />
          </view>
          <text class="af-progress-percent">{{ progressPercent }}</text>
        </view>
        <view class="af-progress-labels">
          <text>领养成功</text><text>院主确认</text><text v-if="frameNumber === 56">评审中</text><text v-else></text><text>抽取奖励</text>
        </view>
      </view>

      <view v-if="showApplyCard" class="af-card af-apply-card" :class="{ 'with-user': showApplicant }">
        <view v-if="showApplicant" class="af-user-line">
          <image :src="assets.applicant" mode="aspectFill" />
          <text>逢猫</text>
          <view class="af-role-tag">申请人</view>
        </view>
        <text class="af-apply-copy">{{ applyCopy }}</text>
        <view class="af-apply-photos">
          <image :src="assets.applyOne" mode="aspectFill" />
          <image :src="assets.applyTwo" mode="aspectFill" />
        </view>
      </view>

      <view v-if="showProofCard" class="af-card af-proof-card">
        <view class="af-proof-photos">
          <view v-for="item in proofItems" :key="item.label">
            <image :src="assets.proof" mode="aspectFill" />
            <text class="af-proof-date">2026.01.03</text>
            <text class="af-proof-label">{{ item.label }}</text>
          </view>
        </view>
        <text class="af-proof-copy">{{ proofCopy }}</text>
      </view>

      <view v-if="showPets" class="af-card af-pets-card" :class="{ 'without-owner': !showOwner }">
        <text class="af-card-title">{{ petTitle }}</text>
        <view class="af-pet-row">
          <view v-for="pet in pets" :key="pet.name" class="af-pet">
            <image :src="pet.src" mode="aspectFill" />
            <text>{{ pet.name }}</text>
          </view>
        </view>
        <view v-if="showOwner" class="af-owner-line">
          <image :src="assets.owner" mode="aspectFill" />
          <text>我就是要喂猫</text>
          <view class="af-yard-tag">小院</view>
        </view>
      </view>

      <template v-if="showAdoptionInfo">
        <view class="af-card af-location-card">
          <view><uni-icons type="location" color="#777" :size="13" /><text>小院位置</text></view>
          <text>鼎丰前城小区</text>
          <text class="af-distance">7.2km</text>
        </view>
        <view class="af-card af-location-copy"><text>{{ locationCopy }}</text></view>
        <view class="af-card af-contact-card">
          <view class="af-contact-head">
            <image :src="assets.contact" mode="aspectFill" />
            <text>芝</text><view>院主</view><text class="af-contact-link">联系方式</text><uni-icons type="right" color="#aaa" :size="13" />
          </view>
          <text class="af-contact-copy">{{ contactCopy }}</text>
        </view>
      </template>

      <view v-if="showRejectReason" class="af-card af-link-row" @click="showToast('已查看拒绝说明')">
        <text>拒绝说明</text><view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
      </view>
      <view v-if="showInfoLink" class="af-card af-link-row" @click="openFrame(48)">
        <text>领养信息</text><view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
      </view>
      <view v-if="showApplyLink" class="af-card af-link-row" @click="openFrame(49)">
        <text>申请内容</text><view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
      </view>
    </view>

    <view v-if="footerMode" class="af-footer" :class="'af-footer-' + footerMode">
      <template v-if="footerMode === 'audit'">
        <button class="af-btn af-btn-ghost" @click="showToast('已拒绝')">拒绝</button>
        <button class="af-btn af-btn-yellow" @click="showToast('已同意')">同意</button>
      </template>
      <template v-else-if="footerMode === 'confirm'">
        <button class="af-btn af-btn-ghost" @click="showToast('已驳回')">驳回</button>
        <button class="af-btn af-btn-yellow af-btn-wide" @click="showToast('已确认领养')">确认已领养</button>
      </template>
      <template v-else-if="footerMode === 'pickup'">
        <button class="af-btn af-btn-ghost af-btn-wide" @click="showToast('已放弃领养')">放弃领养</button>
        <button class="af-btn af-btn-yellow af-btn-pickup" @click="showToast('已确认领养')">确认领养抽猫粮</button>
      </template>
      <button v-else class="af-btn af-btn-yellow af-btn-review" @click="showToast('进入评价')">评价</button>
    </view>
    <view class="af-home-indicator" />
  </view>
</template>

<script>
const ASSET_ROOT = '/static/figma/adoption-flow/'
export default {
  name: 'PawAdoptionFlowFigma',
  props: { frame: { type: [Number, String], default: 44 } },
  data() {
    return {
      assets: {
        applyOne: ASSET_ROOT + '04a93fa17267335f49e6e818f8caa78dd3afc80b.png',
        applyTwo: ASSET_ROOT + 'b61b026ea991c01c6257c909021245fd64956837.png',
        petOne: ASSET_ROOT + 'e435a06f02d1fc46102464a34d8d58adf66e97bb.png',
        petTwo: ASSET_ROOT + '06034d7f1be7897c6f56e74b047d3499044297a1.png',
        owner: ASSET_ROOT + '45f5fc6ea328c9e88cff7a4504824254458e9e7b.png',
        applicant: ASSET_ROOT + 'db5da0781d7667c3490af5cfa74dd2fc7cf1ac01.png',
        contact: ASSET_ROOT + '07acee523d24ba7ebaf21ec60dee542f1e3fdcd4.png',
        proof: ASSET_ROOT + 'e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'
      },
      pets: []
    }
  },
  created() {
    this.pets = [{ name: '奥利奥', src: this.assets.petOne }, { name: '呗呗', src: this.assets.petTwo }]
  },
  computed: {
    frameNumber() { return Number(this.frame) || 44 },
    statusBarReference() { return `/static/figma/adoption-flow/top-${this.frameNumber}.png?v=3` },
    navTitle() { return this.frameNumber === 48 ? '领养信息' : this.frameNumber === 49 ? '申请内容' : this.frameNumber === 55 ? '领养进度' : '领养申请' },
    statusText() {
      return ({ 44:'等待院主审核中......',45:'已拒绝领养申请',46:'等待院主审核中......',47:'等待云家长审核中......',50:'院主已同意，待申请人前往领养',51:'申请人已领养，待院主确认',52:'已驳回',53:'领养成功',54:'院主已同意，待申请人前往领养',55:'申请人已领养，待院主确认',56:'院主已确认，待评审团确认',57:'恭喜您！获得领养礼物！' })[this.frameNumber] || ''
    },
    statusIcon() { return [45,52].includes(this.frameNumber) ? 'clear' : [53,54,55,56,57].includes(this.frameNumber) ? 'checkbox-filled' : 'info' },
    statusCheckAsset() { return [54,55,56,57].includes(this.frameNumber) },
    statusIconColor() { return [54,55,56,57].includes(this.frameNumber) ? '#ffe000' : '#161616' },
    yellowTop() { return [46,47,50,51,52,53].includes(this.frameNumber) },
    progressMode() { return this.frameNumber >= 55 && this.frameNumber <= 57 },
    progressStep() { return this.frameNumber === 55 ? 1 : this.frameNumber === 56 ? 2 : 4 },
    progressWidth() { return this.frameNumber === 55 ? '13%' : this.frameNumber === 56 ? '40%' : '100%' },
    progressPercent() { return this.frameNumber === 57 ? '100%' : '0%' },
    showApplicant() { return [46,47,49].includes(this.frameNumber) },
    showApplyCard() { return [44,45,46,47,49].includes(this.frameNumber) },
    showProofCard() { return [51,52,53,55,56,57].includes(this.frameNumber) },
    showPets() { return [44,45,46,47,49,50,52,53,54,55,56,57].includes(this.frameNumber) },
    showOwner() { return this.showPets && this.frameNumber !== 53 },
    showAdoptionInfo() { return [48,50,54].includes(this.frameNumber) },
    showRejectReason() { return this.frameNumber === 45 },
    showInfoLink() { return [51,52,53,55,56,57].includes(this.frameNumber) },
    showApplyLink() { return [50,51,52,53,54,55,56,57].includes(this.frameNumber) },
    petTitle() { return this.frameNumber === 53 ? '领走的猫咪（2）' : '申请领养的猫咪（2）' },
    footerMode() { if ([46,47].includes(this.frameNumber)) return 'audit'; if (this.frameNumber === 51) return 'confirm'; if (this.frameNumber === 54) return 'pickup'; if ([52,53].includes(this.frameNumber)) return 'review'; return '' },
    proofItems() { return [{label:'来到逢猫'}, {label:'有家啦'}] },
    applyCopy() { return '你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。' },
    proofCopy() { return '我第一次去的时候小猫一直躲着我，去了几次都没有逮到，后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了' },
    locationCopy() { return '有村民看到小精灵经常出没于此，请携带精灵包前往抓捕，注意小精灵性格顽皮，会躲藏靠近的陌生人，这是一场耐心与智慧的较量，抓捕过程中请不要直接接触，避免受伤，若抓捕成功，请在条件允许的情况下为小精灵进行一次基础体检和绝育，逢猫代小咪们感谢您的收养。' },
    contactCopy() { return '你好，我是我就要喂猫小院的院主，看到了你的领养申请，希望你能在新家照顾好小猫，小猫喜欢在车棚和地下室，如果领养的话可以联系我，我带你指路，如果有笼子和网兜最好带上，小猫害怕陌生人靠近会跑远的。' }
  },
  methods: {
    progressDotLeft(step) { return ({1:'4%',2:'29%',3:'61%',4:'93%'})[step] },
    goBack() { uni.navigateBack({ fail: () => uni.switchTab({ url:'/pages/me/index' }) }) },
    openFrame(frame) { uni.navigateTo({ url: '/pages/meMore/adoptionFlow?frame=' + frame }) },
    showToast(title) { uni.showToast({ title, icon:'none' }) }
  }
}
</script>

<style scoped>
@font-face{font-family:"Source Han Sans CN";src:url("/static/fonts/SourceHanSansCN-Regular.otf") format("opentype");font-style:normal;font-weight:400;font-display:block}
@font-face{font-family:"Source Han Sans CN";src:url("/static/fonts/SourceHanSansCN-Medium.otf") format("opentype");font-style:normal;font-weight:500;font-display:block}
@font-face{font-family:"Source Han Sans CN";src:url("/static/fonts/SourceHanSansCN-Bold.otf") format("opentype");font-style:normal;font-weight:600 900;font-display:block}
.af-heading text{font-weight:700}
.af-page{position:relative;min-height:100vh;overflow:hidden;background:linear-gradient(180deg,#fffde6 0,#fff 100px,#f5f5f5 180px,#f5f5f5 100%);color:#333;font-family:"Source Han Sans CN","Noto Sans CJK SC","PingFang SC",-apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif;box-sizing:border-box}.af-page.af-yellow{background:linear-gradient(180deg,#fcf276 0,#fcf276 307px,#f5f5f5 307px,#f5f5f5 100%)}.af-frame-46.af-yellow,.af-frame-47.af-yellow{background:linear-gradient(180deg,#fcf276 0,#fcf276 279px,#f5f5f5 279px,#f5f5f5 100%)}.af-page.af-progress-page{background:linear-gradient(180deg,#fffde6 0,#fff 100px,#f5f5f5 180px,#f5f5f5 100%)}
.af-statusbar-reference{position:absolute;left:0;top:0;width:100%;height:108px;z-index:100;pointer-events:none}
.af-top{height:90px;background:transparent}.af-statusbar{height:36px;padding:8px 18px 0 21px;box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;color:#111;font-size:12px;font-weight:600}.af-system-icons{display:flex;align-items:center;gap:4px;height:16px}.af-nav{position:relative;height:54px;display:flex;align-items:center;justify-content:center}.af-nav-title{font-size:17px;line-height:25px;font-weight:500}.af-nav-side{position:absolute;left:6px;top:11px;width:87px;height:32px;display:flex;align-items:center}.af-back image{margin-left:11px;width:9px;height:17px}.af-mini-menu{position:absolute;right:6px;top:11px;width:87px;height:32px;border:1px solid rgba(0,0,0,.08);border-radius:17px;background:rgba(255,255,255,.88);display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box}.af-menu-rule{width:1px;height:20px;background:#e8e8e8}
.af-content{position:relative;padding:0 15px 70px}.af-heading{height:71px;display:flex;align-items:flex-start;padding:26px 3px 0;box-sizing:border-box;gap:7px}.af-heading text{font-size:20px;line-height:29px;font-weight:600;color:#111}.af-heading .uni-icons{margin-top:5px}.af-heading-status-image{width:19px;height:19px;margin-top:5px;flex:0 0 19px}.af-card{background:#fff;border-radius:6px;box-sizing:border-box;margin-bottom:10px}.af-apply-card{height:285px;padding:9px 10px}.af-apply-card.with-user{height:329px;padding-top:11px}.af-user-line{height:34px;display:flex;align-items:center;margin:0 8px 9px}.af-user-line image{width:34px;height:34px;border-radius:50%}.af-user-line>text{font-size:14px;margin-left:6px}.af-role-tag{height:15px;line-height:15px;padding:0 5px;margin-left:6px;border-radius:3px;background:#ff9d4d;color:#fff;font-size:10px}.af-apply-copy{display:block;margin:0 7px;font-size:15px;line-height:15.5px;height:110px;overflow:hidden}.af-apply-photos{display:flex;gap:2px;margin-top:39px}.with-user .af-apply-photos{margin-top:39px;margin-left:8px}.af-apply-photos image{width:106px;height:106px;border-radius:4px}
.af-pets-card{height:231px;padding:15px 18px 0}.af-pets-card.without-owner{height:160px}.af-card-title{display:block;font-size:16px;line-height:23px}.af-pet-row{height:145px;display:flex;align-items:flex-start;gap:15px;padding-top:20px;box-sizing:border-box}.af-pet{width:49px;text-align:center}.af-pet image{display:block;width:48px;height:48px;border-radius:50%}.af-pet text{display:block;margin-top:4px;font-size:14px;line-height:20px;white-space:nowrap}.af-owner-line{display:flex;align-items:center;height:36px}.af-owner-line image{width:34px;height:34px;border-radius:50%}.af-owner-line>text{font-size:14px;margin-left:6px}.af-yard-tag{height:16px;line-height:16px;padding:0 5px;margin-left:6px;border-radius:3px;background:#fff463;font-size:10px}
.af-location-card{position:relative;height:50px;display:flex;align-items:center;padding:0 14px;font-size:14px}.af-location-card>view{display:flex;align-items:center;gap:3px}.af-location-card>text{margin-left:9px}.af-location-card .af-distance{position:absolute;right:16px;color:#777}.af-location-copy{height:151px;padding:8px 10px}.af-location-copy text{display:block;font-size:15px;line-height:15px;height:132px;overflow:hidden;color:#8b8b8b}.af-contact-card{height:201px;padding:8px 10px}.af-contact-head{height:36px;display:flex;align-items:center;position:relative}.af-contact-head image{width:34px;height:34px;border-radius:50%}.af-contact-head>text{font-size:14px;margin-left:6px}.af-contact-head>view{height:15px;line-height:15px;padding:0 5px;margin-left:5px;border-radius:3px;background:#ff6683;color:#fff;font-size:10px}.af-contact-head .af-contact-link{position:absolute;right:17px;font-size:13px;color:#888}.af-contact-head .uni-icons{position:absolute;right:0}.af-contact-copy{display:block;margin-top:11px;font-size:16px;font-weight:500;line-height:16px;height:115px;overflow:hidden}
.af-proof-card{height:250px;padding:19px 18px 10px}.af-proof-photos{display:flex;gap:45px;justify-content:center}.af-proof-photos>view{width:106px;text-align:center}.af-proof-photos image{display:block;width:106px;height:106px;border-radius:3px}.af-proof-date,.af-proof-label{display:block;font-size:12px;line-height:16px}.af-proof-label{color:#999}.af-proof-copy{display:block;margin-top:8px;font-size:14px;line-height:20.27px;height:61px;overflow:hidden}
.af-link-row{height:50px;padding:0 17px;display:flex;align-items:center;justify-content:space-between;font-size:16px}.af-link-row>view{display:flex;align-items:center;gap:3px;color:#999}.af-link-row>view text{font-size:16px}
.af-progress-card{height:72px;margin-bottom:10px;padding:25px 17px 0;background:#fff;border-radius:6px;box-sizing:border-box}.af-progress-track{height:12px;position:relative;background:#dedede;border-radius:8px}.af-progress-fill{position:absolute;left:0;top:0;height:12px;background:#ffea00;border-radius:8px}.af-progress-dot{position:absolute;top:-2px;width:16px;height:16px;border-radius:50%;background:#dedede;transform:translateX(-50%);display:flex;align-items:center;justify-content:center}.af-progress-dot.active{background:#ffea00}.af-progress-percent{position:absolute;right:0;top:-5px;font-size:10px;color:#999}.af-progress-labels{position:relative;height:16px;margin-top:3px;font-size:11px;color:#777}.af-progress-labels text{position:absolute;white-space:nowrap}.af-progress-labels text:nth-child(1){left:3px}.af-progress-labels text:nth-child(2){left:77px}.af-progress-labels text:nth-child(3){left:175px;color:#ff6b00}.af-progress-labels text:nth-child(4){right:6px}
.af-footer{position:absolute;left:0;right:0;bottom:0;height:86px;padding:4px 14px 28px;background:rgba(255,255,255,.95);box-sizing:border-box;display:flex;justify-content:flex-end;align-items:flex-start;gap:15px;z-index:5}.af-btn{margin:0;width:109px;height:40px;line-height:38px;padding:0;border-radius:3px;font-size:13px;font-weight:400}.af-btn::after{border:0}.af-btn-ghost{background:#fff;border:1px solid #eee;color:#555}.af-btn-yellow{background:#ffe600;border:1px solid #ffe600;color:#111}.af-btn-wide{width:109px}.af-btn-pickup{width:109px}.af-footer-pickup{gap:15px}.af-footer-review{height:72px;padding:0 14px 28px}.af-btn-review{width:89px;height:37px;line-height:35px;border-radius:19px;font-size:15px}.af-home-indicator{position:absolute;left:50%;bottom:9px;width:134px;height:5px;border-radius:3px;background:#111;transform:translateX(-50%);z-index:8}
.af-frame-44,.af-frame-45,.af-frame-46,.af-frame-47,.af-frame-48,.af-frame-49,.af-frame-53{height:812px;min-height:812px}.af-frame-50{height:942px;min-height:942px}.af-frame-51{height:853px;min-height:853px}.af-frame-52{height:907px;min-height:907px}.af-frame-54{height:1024px;min-height:1024px}.af-frame-55,.af-frame-56,.af-frame-57{height:872px;min-height:872px}
.af-frame-48,.af-frame-49{background:#f5f5f5}
.af-frame-48 .af-statusbar-reference,.af-frame-50 .af-statusbar-reference,.af-frame-54 .af-statusbar-reference{height:130px}
.af-frame-50 .af-statusbar-reference,.af-frame-54 .af-statusbar-reference{height:199px}
.af-location-card>*,.af-location-copy>text{transform:translateY(-2px)}
.af-contact-head,.af-contact-copy{transform:translateY(2px)}
.af-frame-44 .af-content,.af-frame-45 .af-content{padding-bottom:15px}.af-frame-46 .af-heading,.af-frame-47 .af-heading{height:71px}.af-frame-48 .af-heading,.af-frame-49 .af-heading{display:none}.af-frame-48 .af-content,.af-frame-49 .af-content{padding-top:12px}.af-frame-49 .af-apply-card{margin-bottom:10px}.af-frame-50 .af-heading,.af-frame-51 .af-heading,.af-frame-52 .af-heading,.af-frame-53 .af-heading,.af-frame-54 .af-heading,.af-frame-55 .af-heading,.af-frame-56 .af-heading,.af-frame-57 .af-heading{height:81px}.af-frame-50 .af-content,.af-frame-54 .af-content{padding-bottom:14px}.af-frame-50 .af-location-card,.af-frame-54 .af-location-card{margin-top:10px}.af-frame-51 .af-proof-card,.af-frame-52 .af-proof-card,.af-frame-53 .af-proof-card{margin-top:0}.af-frame-52 .af-pets-card,.af-frame-53 .af-pets-card{margin-top:10px}.af-frame-55 .af-content,.af-frame-56 .af-content,.af-frame-57 .af-content{padding-bottom:0}.af-frame-55 .af-proof-card,.af-frame-56 .af-proof-card,.af-frame-57 .af-proof-card{margin-top:0}
.af-frame-55 .af-progress-fill{width:6%!important}.af-frame-56 .af-progress-fill{width:29%!important}.af-frame-57 .af-progress-fill{width:84%!important}
.af-frame-55 .af-progress-dot:nth-of-type(2),.af-frame-56 .af-progress-dot:nth-of-type(2),.af-frame-57 .af-progress-dot:nth-of-type(2){left:3%!important}.af-frame-55 .af-progress-dot:nth-of-type(3),.af-frame-56 .af-progress-dot:nth-of-type(3),.af-frame-57 .af-progress-dot:nth-of-type(3){left:26%!important}.af-frame-55 .af-progress-dot:nth-of-type(4),.af-frame-56 .af-progress-dot:nth-of-type(4),.af-frame-57 .af-progress-dot:nth-of-type(4){left:58%!important}.af-frame-55 .af-progress-dot:nth-of-type(5),.af-frame-56 .af-progress-dot:nth-of-type(5),.af-frame-57 .af-progress-dot:nth-of-type(5){left:84%!important}
.af-progress-page .af-link-row:last-child{margin-bottom:0}
.af-page .af-heading text{font-weight:700}
.af-page .af-contact-head,.af-page .af-contact-copy{transform:none}
.af-page .af-contact-copy{font-weight:400}
.af-frame-48 .af-contact-head,.af-frame-48 .af-contact-copy{transform:translateY(2px)}
.af-frame-48 .af-contact-copy{font-weight:500}
</style>
