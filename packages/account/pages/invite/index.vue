<template>
  <view class="invite-page">
    <PawPageNav title="邀请入驻" background="#f5f5f5" :fallback-url="fallbackUrl" />
    <scroll-view class="invite-scroll" scroll-y :show-scrollbar="false">
      <view class="invite-hero">
        <image class="invite-map" src="/static/figma/feature/af518e8fde22fed7160fad5da60317148f44952a.png" mode="aspectFill" />
        <image v-for="(src, index) in inviteAvatars" :key="src" class="invite-avatar" :class="'invite-avatar--' + index" :src="src" mode="aspectFill" />
        <text class="joined-text">邻居6人已入驻</text>
      </view>
      <view class="invite-card">
        <view class="invite-title">
          <image src="/static/figma/feature/45f5fc6ea328c9e88cff7a4504824254458e9e7b.png" mode="aspectFill" />
          <view><text>朝阳小区猫猫队 邀请您入驻</text><text>目前已有3只流浪猫，还在等待领养</text></view>
        </view>
        <text>•　一起为流浪猫寻找领养好归宿</text>
        <text>•　一起投喂流浪猫，从坚持到热爱</text>
        <view class="invite-line"><view class="invite-line-icon"><uni-icons type="person-filled" color="#08bd5c" :size="17" /></view><text>感谢您加入“救助流浪猫”大家庭，共建和谐文明城市流浪猫环境</text></view>
        <view class="invite-button" data-qa="qa-account-invite-yard" @tap="openYard"><text>前往查看</text><uni-icons type="arrow-right" color="#fff" :size="16" /></view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import { buildRoute } from '@/navigation/routeContracts.js'

export default {
  components: { PawPageNav },
  data() {
    return {
      fallbackUrl: '/pages/index/index',
      inviteAvatars: [
        '/static/figma/feature/e1f65d79bfde8d6fc9cf263e86080d08f13770fc.jpg',
        '/static/figma/feature/66fd0f7323c88fa771f5da9f675372febcc335ba.jpg',
        '/static/figma/feature/a338f4ed23b0a9c0b631d2e34369f856b09a255a.jpg',
        '/static/figma/feature/7266b7871b03ce7a570811a13cbbd71e61491f75.jpg',
        '/static/figma/feature/bf6cfd188d6671b8e283e5e5563ece9da7dc2ef8.jpg',
        '/static/figma/feature/24a1e03cab61f32251063e6be98887860b879349.jpg',
        '/static/figma/feature/92204562aae4aec0c460d32bdc61d58f52e24268.jpg'
      ]
    }
  },
  methods: {
    openYard() {
      try { uni.navigateTo({ url: buildRoute('yard.detail', { yardId: '1' }) }) } catch (error) { uni.showToast({ title: '小院暂不可用', icon: 'none' }) }
    }
  }
}
</script>

<style scoped>
.invite-page { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; background: #f5f5f5; color: #222; }
.invite-scroll { min-height: 0; flex: 1 1 auto; }
.invite-hero { position: relative; height: 222px; overflow: hidden; }
.invite-map { position: absolute; inset: 0; width: 100%; height: 222px; }
.invite-avatar { position: absolute; width: 48px; height: 48px; border: 2px solid #fff; border-radius: 50%; box-sizing: border-box; }
.invite-avatar--0 { left: 48px; top: 61px; }
.invite-avatar--1 { left: 118px; top: 35px; }
.invite-avatar--2 { left: 219px; top: 45px; }
.invite-avatar--3 { left: 52px; top: 130px; }
.invite-avatar--4 { left: 151px; top: 87px; }
.invite-avatar--5 { left: 282px; top: 102px; }
.invite-avatar--6 { left: 287px; top: 157px; }
.joined-text { position: absolute; left: 141px; top: 176px; margin: 0; padding: 3px 7px; border-radius: 3px; background: #fff; color: #00c85a; font-size: 14px; }
.invite-card { position: relative; min-height: 354px; margin: -30px 5px 0; padding: 14px 20px 30px; border-radius: 20px; background: #fff; box-sizing: border-box; }
.invite-title { display: flex; align-items: center; color: #06b958; font-size: 15px; font-weight: 500; }
.invite-title image { width: 52px; height: 52px; margin-right: 12px; border-radius: 50%; }
.invite-title>view { display: flex; flex-direction: column; }
.invite-title>view>text:last-child { margin-top: 4px; color: #06b958; font-size: 12px; font-weight: 400; }
.invite-card>text { display: block; margin: 23px 0 0; color: #888; font-size: 15px; }
.invite-line { display: flex; width: 100%; align-items: flex-start; gap: 10px; margin-top: 15px; color: #888; font-size: 14px; line-height: 20px; box-sizing: border-box; }
.invite-line text { flex: 1; }
.invite-line-icon { display: flex; width: 20px; flex: none; justify-content: center; }
.invite-button { display: flex; width: 135px; height: 43px; align-items: center; justify-content: center; gap: 5px; margin: 74px auto 0; border-radius: 22px; background: #05c85b; color: #fff; font-size: 15px; font-weight: 500; }
</style>
