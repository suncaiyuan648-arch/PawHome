<template>
  <view class="assets-page" :class="['assets-page--' + mode, { 'assets-page--roster': listState === 'mine' }]">
    <template v-if="mode === 'pets' && listState === 'mine'">
      <PawPetRoster variant="mine" @back="goBack" />
    </template>
    <template v-else-if="mode === 'pets'">
      <view class="pets-header">
        <view class="pets-title-row">
          <view class="back-hit" @click="goBack"><image src="/static/nav-back-arrow.png" mode="aspectFit" /></view>
          <text class="pets-title">小院成员</text>
          <view class="pet-search"><uni-icons type="search" color="#d2d2d2" :size="16" /><text>搜索宠物名字/品种等</text><view class="search-button">搜一搜</view></view>
        </view>
        <view class="search-tabs"><text class="tab-active">全部(23)</text><text>猫咪(22)</text><text>狗狗(1)</text><view class="sort"><text>智能排序</text><uni-icons type="down" color="#555" :size="13" /></view><uni-icons type="list" color="#555" :size="22" /></view>
      </view>
      <view class="pet-card"><view v-for="pet in pets" :key="pet.name + pet.avatar" class="pet-item"><image :src="pet.avatar" mode="aspectFill" /><text>{{ pet.name }}</text><text class="pet-breed">{{ pet.breed }}</text></view><view class="pet-item" @click="addPet"><view class="add-circle"><uni-icons type="plusempty" color="#e5b600" :size="25" /></view><text>去添加</text></view></view>
    </template>

    <template v-else-if="mode === 'medals'">
      <image class="medal-bg" src="/static/figma/medals/medal-page-bg.png" mode="scaleToFill" />
      <PawPageNav title="我的勋章" background="transparent" fallback-url="/pages/me/index" />
      <view class="medal-profile"><image class="profile-photo" src="/static/figma/me-avatar.png" mode="aspectFill" /><view class="profile-copy"><view class="profile-name-row"><text class="asset-name">浮生孤影</text><view class="lv-cap"><text class="lv-cap__txt">Lv1</text></view></view><text class="asset-muted">您的勋章数量超越80%用户</text></view><view class="medal-count"><text class="medal-number">0</text><text class="count-unit">枚勋章</text></view></view>
      <view class="main-medal" @click="openNewMedal"><image src="/static/figma/medals/guardian-medal.png" mode="scaleToFill" /></view><text class="recent">最近获得</text><text class="recent-copy">累计投喂10斤</text><text class="earned">已获得 9 枚勋章</text><view class="medal-divider"></view>
      <view class="medal-grid"><view v-for="i in 6" :key="i" @click="openNewMedal"><view class="grid-medal"><image src="/static/figma/medals/guardian-medal.png" mode="scaleToFill" /></view><text>诸邪退散</text></view></view>
    </template>

    <template v-else-if="mode === 'map'">
      <PawPageNav title="勋章地图" background="#e4e4e4" fallback-url="/pages/meMore/myAssets?mode=medals" />
      <view class="map-footer"><image class="profile-photo" src="/static/figma/me-avatar.png" mode="aspectFill" /><view class="profile-copy"><view class="profile-name-row"><text class="asset-name">浮生孤影</text><view class="lv-cap"><text class="lv-cap__txt">Lv1</text></view></view><text class="asset-muted">您的勋章数量超越80%用户</text></view><view class="medal-count"><text class="medal-number">0</text><text class="count-unit">枚勋章</text></view></view>
    </template>

    <template v-else>
      <view class="new-nav"><view class="back-hit" @click="goBack"><image src="/static/nav-back-arrow.png" mode="aspectFit" /></view><text>得诸邪避散勋章</text><view class="rules">规则</view></view>
      <view class="new-medal-card"><view class="new-medal-image"><image src="/static/figma/medals/guardian-medal.png" mode="scaleToFill" /></view><text class="new-medal-name">诸邪避散</text><text class="new-medal-state">已获得</text><text class="new-medal-sub">连续30天云养猫咪</text><view class="progress-row"><view class="progress-fill"></view><view class="progress-check"><uni-icons type="checkmarkempty" color="#1639bf" :size="15" /></view></view><text class="task-state">任务已完成</text><text class="encouragement">你是最棒的！！！</text><view class="claim-button" @click="claimMedal">领取勋章</view></view>
    </template>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
export default {
  components: { PawPageNav, PawPetRoster },
  data() { return { mode: 'pets', listState: '', pets: [
    { name: '奥利奥', breed: '加菲猫', avatar: '/static/figma/pets/pet-orange.png' }, { name: '煤球', breed: '奶牛猫', avatar: '/static/figma/pets/pet-black-white.png' }, { name: '呗呗', breed: '金毛', avatar: '/static/figma/pets/pet-dog.png' }, { name: '呗呗', breed: '金毛', avatar: '/static/figma/pets/pet-dog.png' }
  ] } },
  onLoad(options) { const m=String(options.mode||'pets'); this.mode=['pets','medals','map','new'].includes(m)?m:'pets'; this.listState=options.state==='mine'?'mine':'' },
  methods: { goBack() { uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/me/index' }) }) }, addPet() { uni.navigateTo({ url: '/pages/yard/addKitten' }) }, openNewMedal() { uni.navigateTo({ url: '/pages/meMore/myAssets?mode=new' }) }, claimMedal() { uni.showToast({ title: '勋章已领取', icon: 'success' }) } }
}
</script>

<style scoped>
.assets-page{position:relative;min-height:100vh;overflow:hidden;background:#f5f5f5;color:#222;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif}.assets-page--pets{padding-top:44px}.back-hit{width:34px;height:44px;display:flex;align-items:center;justify-content:center;flex:none}.back-hit image{width:22px;height:22px}.pets-header{background:#fff}.pets-title-row{height:52px;display:flex;align-items:center;padding-right:13px;box-sizing:border-box}.pets-title{font-size:18px;white-space:nowrap}.pet-search{height:34px;flex:1;margin-left:22px;display:flex;align-items:center;padding-left:10px;border:2px solid #222;border-radius:18px;box-sizing:border-box;color:#c7c7c7;font-size:12px;overflow:hidden}.pet-search>text{margin-left:5px;white-space:nowrap}.search-button{height:30px;min-width:55px;margin-left:auto;display:flex;align-items:center;justify-content:center;border-radius:16px;background:#202020;color:#fff;font-size:12px}.search-tabs{height:29px;display:flex;align-items:center;padding:0 8px;gap:4px;font-size:12px;box-sizing:border-box}.search-tabs>text{height:28px;padding:0 13px;display:flex;align-items:center;border-radius:3px;background:#f6f6f6;white-space:nowrap}.search-tabs .tab-active{background:#ffe000}.sort{margin-left:auto;display:flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap}.pet-card{height:157px;margin:8px 16px 0;display:flex;align-items:flex-start;padding:33px 3px 0;background:#fff;border-radius:15px;box-sizing:border-box}.pet-item{width:20%;display:flex;flex-direction:column;align-items:center;font-size:13px;white-space:nowrap}.pet-item image,.add-circle{width:48px;height:48px;margin-bottom:4px;border-radius:50%}.add-circle{display:flex;align-items:center;justify-content:center;background:#f7f7f7}.pet-breed{margin-top:3px;color:#999;font-size:11px}
.assets-page--medals{background:#fff;min-height:812px}.medal-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0}.medal-profile{position:relative;z-index:1;height:97px;display:flex;align-items:center;padding:9px 15px 16px;box-sizing:border-box}.profile-photo{width:72px;height:72px;border:1.5px solid #fff;border-radius:50%;box-sizing:border-box}.profile-copy{margin-left:11px;min-width:0}.profile-name-row{display:flex;align-items:center;gap:5px}.asset-name{font-size:17px;font-weight:600;white-space:nowrap}.asset-muted{display:block;margin-top:4px;color:#aaa;font-size:12px;white-space:nowrap}.medal-count{margin-left:auto;display:flex;flex-direction:column;align-items:center;min-width:62px}.medal-number{font-size:38px;font-weight:600;line-height:40px}.count-unit{font-size:14px;color:#555;white-space:nowrap}.main-medal{position:relative;z-index:1;display:block;width:164px;height:164px;margin:8px auto 17px;border-radius:50%}.recent,.recent-copy,.earned{position:relative;z-index:1;display:block;text-align:center}.recent{color:#aaa;font-size:12px}.recent-copy{margin-top:3px;color:#666;font-size:16px}.earned{margin-top:31px;color:#666;font-size:16px}.medal-divider{position:relative;z-index:1;height:1px;margin:15px 15px 0;background:#eee}.medal-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);row-gap:26px;padding:30px 23px 0}.medal-grid view{display:flex;flex-direction:column;align-items:center;font-size:13px}.medal-grid image{width:82px;height:82px;margin-bottom:7px;border-radius:50%}
.assets-page--map{min-height:812px;background:#e4e4e4}.map-footer{position:absolute;left:0;right:0;bottom:0;height:153px;padding:17px 15px 43px;display:flex;align-items:center;background:#fff;border-radius:10px 10px 0 0;box-sizing:border-box}.map-footer .profile-photo{width:72px;height:72px}.map-footer .profile-copy{margin-left:10px}.map-footer .medal-count{margin-left:auto}
.assets-page--new{min-height:812px;padding-top:44px;background:#eaf5ff}.new-nav{height:54px;display:flex;align-items:center;padding-right:9px;box-sizing:border-box}.new-nav>text{font-size:18px;font-weight:600}.rules{margin-left:auto;padding:5px 11px;border-radius:14px;background:#c9d9ea;color:#6f8194;font-size:12px}.new-medal-card{position:absolute;left:24px;right:24px;top:121px;bottom:0;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:24px 24px 0 0}.new-medal-image{width:164px;height:164px;margin-top:70px;border-radius:50%}.new-medal-name{margin-top:26px;font-size:20px;font-weight:700}.new-medal-state{margin-top:3px;color:#666;font-size:16px}.new-medal-sub{margin-top:5px;color:#aaa;font-size:13px}.progress-row{position:relative;width:274px;height:20px;margin-top:48px}.progress-fill{position:absolute;left:0;right:0;top:9px;height:5px;border-radius:4px;background:#1639bf}.progress-check{position:absolute;right:-4px;top:0;width:19px;height:19px;border:2px solid #1639bf;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;color:#1639bf;font-size:14px;font-weight:700;box-sizing:border-box}.task-state{margin-top:2px;color:#aaa;font-size:13px}.encouragement{margin-top:52px;color:#b7b7b7;font-size:14px}.claim-button{width:201px;height:49px;margin-top:16px;border-radius:25px;display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg,#f6e0aa,#e9ca76);color:transparent;font-size:15px}
.main-medal,.grid-medal,.new-medal-image{position:relative;overflow:hidden;border-radius:50%}.main-medal image,.new-medal-image image{position:absolute;left:-27px;top:-27px;width:218px;height:218px}.grid-medal{width:82px;height:82px;margin-bottom:7px}.medal-grid .grid-medal image{position:absolute;left:-14px;top:-14px;width:110px;height:110px;margin:0;border-radius:0}
.assets-page--medals .medal-profile{padding-top:5px;padding-bottom:20px}.assets-page--medals .main-medal{margin-bottom:24px}.assets-page--medals .medal-divider{margin-top:9px}.assets-page--medals .medal-grid{grid-template-columns:repeat(3,110px);column-gap:5px;row-gap:10px;padding:17px 17px 0}.assets-page--medals .grid-medal{width:110px;height:110px;margin-bottom:-8px}.assets-page--medals .grid-medal image{left:0;top:0;width:110px;height:110px}
.assets-page--map .map-footer{padding-top:14px;padding-bottom:46px}.assets-page--new .progress-fill{top:4px}.assets-page--new .progress-check{top:-5px}.assets-page--new .encouragement{margin-top:49px}.assets-page--new .claim-button{margin-top:13px}
.assets-page--roster{padding-top:0;overflow:auto}
</style>
