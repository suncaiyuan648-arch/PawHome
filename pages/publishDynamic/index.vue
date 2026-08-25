<template>
	<view class="publish-page">
		<view class="bg-collage">
			<image class="collage-exact" src="/static/figma/publish-collage.png" mode="scaleToFill"></image>
			<image v-for="(src, index) in collageImages" :key="index" class="bg-tile" :src="src" mode="aspectFill"></image>
		</view>

		<view class="mask-layer"></view>

		<view class="sheet">
			<text class="sheet-title">发布动态</text>
			<view class="action-big" @click="onPost">
				<view class="title-row">
					<text class="action-big-title">发动态</text>
					<image class="title-arrow" src="/static/youjiantou.png" mode="aspectFit"></image>
				</view>
				<text class="action-big-desc">院主院主，快来更新小院的动态吧</text>
			</view>

			<view class="yard-row">
				<view class="yard-column"><text class="yard-section-title">创建小院</text><view class="yard-card yard-card--cat" @click="onCreateCatYard">
					<view class="title-row">
						<text class="yard-title">流浪动物小院</text>
						<image class="title-arrow title-arrow--yard" src="/static/youjiantou.png" mode="aspectFit"></image>
					</view>
					<text class="yard-desc">为小毛娃撰粮</text>
				</view></view>
				<view class="yard-column"><text class="yard-section-title">发起求助</text><view class="yard-card yard-card--help" @click="onCreateHelp">
					<view class="title-row">
						<text class="yard-title yard-title--light">流浪动物救助</text>
						<image class="title-arrow title-arrow--yard" src="/static/youjiantou.png" mode="aspectFit"></image>
					</view>
					<text class="yard-desc yard-desc--light">为小毛娃救治绝育</text>
				</view></view>
			</view>

			<view class="close-wrap" @click="goBack">
				<text class="close-txt">×</text>
			</view>
		</view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'

export default {
	data() {
		return { collageImages: [
			'/static/figma/dynamic-cats.jpg', '/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg', '/static/figma/interaction-avatar-1.jpg',
			'/static/figma/activity-changsha.jpg', '/static/figma/dynamic-cats.jpg', '/static/figma/activity-hefei.jpg', '/static/figma/interaction-thumb-1.jpg',
			'/static/figma/activity-hefei.jpg', '/static/figma/interaction-avatar-1.jpg', '/static/figma/dynamic-cats.jpg', '/static/figma/activity-changsha.jpg'
		] }
	},
	methods: {
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		onPost() {
			uni.navigateTo({ url: '/pages/publishDynamic/postFeed' })
		},
		onCreateCatYard() {
			uni.navigateTo({ url: '/pages/yard/catGuide' })
		},
		onCreateHelp() {
			uni.navigateTo({ url: '/pages/feature/index?mode=rescue-detail' })
		}
	}
}
</script>

<style scoped>
.publish-page { position: relative; min-height: 100vh; background: #000; overflow: hidden; }
.bg-collage { position: absolute; left: 0; right: 0; top: 0; height: 262px; opacity: 1; }.collage-exact{position:absolute;inset:0;width:100%;height:100%}
.bg-tile { display:none; }
.mask-layer { position: absolute; inset: 0; background: rgba(0,0,0,.32); }
.sheet {
	position: absolute; left: 0; right: 0; top:262px; bottom: 0;
	background: #fff; border-radius: 15px 15px 0 0;
	padding: 124px 17px calc(22px + env(safe-area-inset-bottom));
	box-sizing: border-box;
}
.sheet-title { display: block; margin-left:13px;font-size:24px; font-weight: 700; color: #1f1f1f; line-height: 30px; }
.sheet-title--sub { margin-top: 30rpx; }
.action-big { height:104px;margin-top: 13px; border-radius: 14px; background: #ffe60f; padding: 29px 13px; box-sizing: border-box; }
.title-row { display: inline-flex; align-items: center; }
.action-big-title { display: block; font-size: 24px; font-weight: 700; color: #222; line-height: 29px; }
.title-arrow { width: 22rpx; height: 22rpx; margin-left: 8rpx; }
.title-arrow--yard { width: 18rpx; height: 18rpx; margin-left: 6rpx; }
.action-big-desc { display: block; margin-top: 1px; font-size: 13px; color: #3c3c3c; line-height: 18px; }
.yard-row { margin-top: 31px; display: flex; column-gap: 12px; }
.yard-column { min-width: 0; flex: 1; }
.yard-section-title { display: block; margin: 0 0 16px 13px; color: #222; font-size: 20px; font-weight: 700; }
.yard-card { flex: 1; min-width: 0;height:75px; border-radius: 12px; padding: 17px 13px; box-sizing: border-box; }
.yard-card--cat { background: #d4f08a; }
.yard-card--help { background: #ff4148; }
.yard-title { display: block; font-size: 16px; font-weight: 700; color: #2c2c2c; line-height: 21px; }
.yard-title--light,.yard-desc--light { color: #fff; }
.yard-desc { display: block; margin-top: 1px; font-size: 13px; color: #606060; line-height: 18px; }
.close-wrap {
	width: 56px; height: 56px; border-radius: 50%;
	background: #f7f7f7; margin: 40px auto 0;
	display: flex; align-items: center; justify-content: center;
}
.close-txt { font-size: 52rpx; color: #2f2f2f; line-height: 1; font-weight: 500; }
</style>
