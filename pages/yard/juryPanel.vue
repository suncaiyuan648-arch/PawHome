<template>
	<view class="page">
		<PawPageNav title="逢猫评审团" :auto-back="false" @back="goBack" />
		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
			<view class="head-row"><text class="n">86</text><text class="n n2">9896</text></view>
			<view class="sub-row"><text class="s on">待投票</text><text class="s">投票结束</text></view>
			<view class="card" v-for="(it,i) in list" :key="i" @click="openDetail(it)">
				<view class="card-head"><image src="/static/figma/jury-db5da0781d7667c3490af5cfa74dd2fc7cf1ac01.png" mode="aspectFill"></image><view class="card-owner"><view class="title">{{ it.name }}<LevelCapsule level="1" /></view><text class="date">2026.02.22</text></view><text class="tag" :class="{done:it.done}">{{ it.done?'投票结束':'投票中' }}</text></view>
				<view class="bar"><view class="left">92% (挺真实)</view><view class="right">8%</view></view>
				<text class="txt">今天不做课间操了，开一个紧急例会，就在昨天，发生了一件骇人听闻的学生袭击老师事件</text>
				<view class="evidence-row"><image src="/static/figma/jury-d0a23847642d582320e26f7499c0a5c51acf5a86.jpg" mode="aspectFill"></image><image src="/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png" mode="aspectFill"></image></view>
				<view v-if="it.done" class="gift">获得5斤猫粮</view>
			</view>
		</scroll-view>
	</view>
</template>
<script>
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawPageNav from '@/components/PawPageNav.vue'

export default{components:{LevelCapsule,PawPageNav},data(){return{statusBarHeight:20,menuRightWidth:87,list:[{id:'jury-1',name:'我就是要喂猫',done:false},{id:'jury-2',name:'我就是要喂猫',done:true}]}},onLoad(){const s=uni.getSystemInfoSync();this.statusBarHeight=s.statusBarHeight||20;
// #ifdef H5
this.statusBarHeight=44
// #endif
try{const mb=uni.getMenuButtonBoundingClientRect();if(mb&&mb.left)this.menuRightWidth=Math.max(s.windowWidth-mb.left,87)}catch(e){}},methods:{goBack(){uni.navigateBack()},openDetail(it){uni.navigateTo({url:'/pages/yard/juryDetail?id='+encodeURIComponent(it.id)})}}}
</script>
<style lang="less" scoped>
.page{height:100vh;background:#f5f5f5}.nav-wrap{background:#f5f5f5}.nav-row{height:88rpx;display:flex;align-items:center;padding:0 8rpx}
.nav-side{width:88rpx;height:88rpx;display:flex;align-items:center;justify-content:center}.nav-back-icon{width:48rpx;height:48rpx}.nav-title{flex:1;text-align:center;font-size:34rpx;font-weight:600}
.main-scroll{height:calc(100vh - 78rpx);padding:20rpx 24rpx;box-sizing:border-box;transform:translateY(-5px)}.head-row,.sub-row{display:flex;gap:120rpx;padding-left:140rpx}.n{font-size:58rpx;font-weight:700}.n2{color:#999}.s{font-size:26rpx;color:#999}.on{color:#111;background:#ffdd00;border-radius:12rpx;padding:0 8rpx}
.card{background:#fff;border-radius:20rpx;padding:20rpx 30rpx 46rpx;margin-top:20rpx}.card-head{display:flex;align-items:center}.card-head image{width:82rpx;height:82rpx;border-radius:50%}.card-owner{margin-left:12rpx}.title{font-size:27rpx;font-weight:600}.lv{margin-left:8rpx;font-size:19rpx;color:#7a5200}.date{display:block;margin-top:3rpx;color:#999;font-size:20rpx}.tag{margin-left:auto;font-size:24rpx;color:#17aa60}.done{color:#f05b68}
.bar{margin-top:16rpx;margin-left:24rpx;height:34rpx;border-radius:18rpx;background:linear-gradient(90deg,#ffdd00 0 92%,#1d93ea 92% 100%);display:flex;justify-content:space-between;align-items:center;padding:0 10rpx;font-size:19rpx}
.txt{display:block;margin-top:30rpx;font-size:27rpx;line-height:1.35}.evidence-row{display:flex;gap:8rpx;margin-top:42rpx}.evidence-row image{width:224rpx;height:224rpx;border-radius:10rpx}.gift{margin-top:18rpx;margin-left:auto;background:#5c4200;color:#ffdf73;border-radius:8rpx;padding:6rpx 10rpx;width:max-content;font-size:20rpx}
</style>
