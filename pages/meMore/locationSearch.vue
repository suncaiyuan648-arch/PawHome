<template>
	<view class="loc-page">
		<view v-if="!compact" class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row" :style="{ marginTop: navRowOffsetTop + 'px', height: navRowHeight + 'px' }">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view class="nav-gap"></view>
		</view>

		<view class="panel">
			<view class="search-row">
				<view class="search-box">
					<uni-icons type="search" color="#BFBFBF" :size="16"></uni-icons>
					<input
						class="search-input"
						type="text"
						v-model="keyword"
						placeholder="搜索城市/小区/居住楼等"
						placeholder-class="search-placeholder"
					/>
				</view>
				<view class="city-chip" @click="onCityTap">
					<uni-icons type="paperplane-filled" color="#2F8BFF" :size="12"></uni-icons>
					<text>{{ currentCity }}</text>
				</view>
			</view>

			<scroll-view class="result-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view class="result-list">
					<view
						v-for="(item, i) in filteredList"
						:key="'poi-' + i"
						class="result-item"
						@click="onPick(item)"
					>
						<uni-icons class="item-pin" type="location-filled" color="#E9E9E9" :size="19"></uni-icons>
						<view class="item-main">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-addr">{{ item.address }}</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { getWechatNavLayout } from '@/utils/navLayout.js'

const mockPoi = (city) => [
	{ name: '鼎丰前城', address: '雨花区中意一路167号' },
	{ name: '幸福小区', address: '雨花区中意一路167号' },
	{ name: '四个朋友自助棋牌', address: '雨花区中意一路167号' },
	{ name: '朝阳小区', address: '雨花区中意一路167号' },
	{ name: '平安公寓', address: '雨花区中意一路167号' },
	{ name: '佳园星城', address: '雨花区中意一路167号' },
	{ name: '天天向上', address: '雨花区中意一路167号' }
].map((x) => ({ ...x, city }))

export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			navRowOffsetTop: 0,
			navRowHeight: 44,
			keyword: '',
			currentCity: '郑州市',
			list: mockPoi('郑州市')
			,compact: false
		}
	},
	computed: {
		filteredList() {
			const key = (this.keyword || '').trim()
			if (!key) return this.list
			return this.list.filter((x) => (x.name + x.address).includes(key))
		}
	},
	onLoad(options = {}) {
		this.compact = options.state === 'figma'
		this.layoutNav()
		const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
		if (ch && typeof ch.on === 'function') {
			ch.on('initLocation', (payload = {}) => {
				const city = (payload.city || '').trim()
				if (city) {
					this.currentCity = city
					this.list = mockPoi(city)
				}
			})
		}
	},
	methods: {
		layoutNav() {
			const nav = getWechatNavLayout()
			this.statusBarHeight = nav.statusBarHeight
			this.menuRightWidth = nav.menuWidth + nav.menuRightInset
			this.navRowOffsetTop = nav.navRowOffsetTop
			this.navRowHeight = nav.navRowHeight
		},
		onPick(item) {
			const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
			if (ch && typeof ch.emit === 'function') {
				ch.emit('locationPicked', { detail: `${item.name} ${item.address}` })
			}
			uni.navigateBack()
		},
		goBack() {
			uni.navigateBack()
		},
		onCityTap() {
			uni.navigateTo({
				url: '/pages/citySelect/index?current=' + encodeURIComponent(this.currentCity),
				events: {
					citySelected: (payload = {}) => {
						const city = (payload.city || '').trim()
						if (!city) return
						this.currentCity = city
						this.list = mockPoi(city)
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.loc-page { height: 100vh; min-height: 100vh; background: #f3f3f3; box-sizing: border-box; display: flex; flex-direction: column; }
.nav-wrap { flex-shrink: 0; background: #f3f3f3; }
.nav-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 8rpx;
	box-sizing: border-box;
}
.nav-side { min-width: 80rpx; display: flex; align-items: center; }
.nav-left { padding: 8rpx 24rpx 8rpx 16rpx; justify-content: center; }
.nav-back-icon { width: 20rpx; height: 36rpx; }
.nav-gap { height: 14rpx; }
.panel { margin: 0 16rpx 0; background: #fff; border-radius: 30rpx 30rpx 0 0; overflow: hidden; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.search-row { display: flex; align-items: center; padding: 16rpx 16rpx 8rpx; box-sizing: border-box; }
.search-box { flex: 1; min-width: 0; height: 68rpx; border-radius: 34rpx; background: #f6f6f6; display: flex; align-items: center; padding: 0 18rpx; box-sizing: border-box; }
.search-input { flex: 1; min-width: 0; margin-left: 10rpx; font-size: 24rpx; color: #333; }
.search-placeholder { color: #c4c4c4; font-size: 24rpx; }
.city-chip { margin-left: 16rpx; display: inline-flex; align-items: center; }
.city-chip text { margin-left: 6rpx; font-size: 26rpx; font-weight: 500; color: #232323; line-height: 36rpx; }
.result-scroll { flex: 1; min-height: 0; width: 100%; box-sizing: border-box; }
.result-list { padding: 8rpx 0 24rpx; }
.result-item { min-height: 126rpx; display: flex; align-items: center; padding: 0 22rpx; border-bottom: 1rpx solid #f2f2f2; box-sizing: border-box; }
.item-pin { flex-shrink: 0; margin-right: 18rpx; }
.item-main { flex: 1; min-width: 0; }
.item-name { display: block; font-size: 32rpx; font-weight: 700; color: #222; line-height: 44rpx; }
.item-addr { display: block; margin-top: 2rpx; font-size: 28rpx; color: #8f8f8f; line-height: 38rpx; }
.loc-page{background:#fff}.panel{margin:0;background:#fff;border-radius:0}.search-row{padding:31px 21px 5px}.search-box{width:225px;flex:none;height:34px;border-radius:17px;padding:0 10px}.search-input,.search-placeholder{font-size:12px}.city-chip{margin-left:auto}.city-chip text{font-size:12px;line-height:18px}.result-list{padding:2px 0 12px}.result-item{min-height:61px;padding:0 21px}.item-pin{margin-right:14px}.item-name{font-size:14px;line-height:20px}.item-addr{font-size:11px;line-height:16px}
</style>
