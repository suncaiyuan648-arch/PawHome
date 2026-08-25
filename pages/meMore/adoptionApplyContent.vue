<template>
	<view class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">申请内容</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<scroll-view v-if="record" class="main-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
			<view class="card">
				<view class="applicant-row">
					<text class="applicant-name">{{ record.applicantName || '申请人' }}</text>
					<view class="applicant-tag"><text>申请人</text></view>
				</view>
				<text class="apply-body">{{ record.applyText }}</text>
			</view>
			<view class="card">
				<text class="card-title">申请领养的猫咪（{{ record.pets.length }}）</text>
				<view class="pet-row">
					<view v-for="(p, i) in record.pets" :key="i" class="pet-cell">
						<image class="pet-av" :src="petAvatarSrc(p)" mode="aspectFill" />
						<text class="pet-name">{{ p.name }}</text>
					</view>
				</view>
				<view class="yard-foot">
					<image class="yard-av" :src="record.ownerAvatar" mode="aspectFill"></image>
					<text class="yard-n">{{ record.ownerName }}</text>
					<YardTagPill class="yard-tag-pill--ml" />
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getAdoptionById, getDemoAdoptions } from '@/utils/adoptionStorage.js'
	import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
	import YardTagPill from '@/components/YardTagPill.vue'

	export default {
		components: { YardTagPill },
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				recordId: '',
				record: null
			}
		},
		onLoad(options) {
			const sys = uni.getSystemInfoSync()
			this.statusBarHeight = sys.statusBarHeight || 20
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
				}
			} catch (e) {}
			// #endif
			if (options.id) {
				this.recordId = decodeURIComponent(options.id)
				let r = getAdoptionById(this.recordId)
				if (!r) r = getDemoAdoptions().find((d) => d.id === this.recordId) || null
				this.record = r
				if (!r) {
					uni.showToast({ title: '记录不存在', icon: 'none' })
					setTimeout(() => uni.navigateBack(), 1200)
				}
			}
		},
		methods: {
			petAvatarSrc: adoptionPetAvatarSrc,
			goBack() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="less" scoped>
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f5f5f5;
		box-sizing: border-box;
	}
	.nav-wrap {
		flex-shrink: 0;
		background: #f5f5f5;
	}
	.nav-row {
		height: 88rpx;
		display: flex;
		align-items: center;
		padding: 0 8rpx;
	}
	.nav-side {
		width: 88rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.nav-back-icon {
		width: 48rpx;
		height: 48rpx;
	}
	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: 600;
		color: #111;
	}
	.main-scroll {
		flex: 1;
		height: 0;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
	}
	.applicant-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 20rpx;
	}
	.applicant-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #111;
	}
	.applicant-tag {
		margin-left: 16rpx;
		padding: 4rpx 14rpx;
		background: #ffe8d6;
		border-radius: 8rpx;
	}
	.applicant-tag text {
		font-size: 22rpx;
		color: #c45c00;
	}
	.apply-body {
		font-size: 28rpx;
		color: #333;
		line-height: 1.65;
	}
	.card-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #111;
		margin-bottom: 16rpx;
	}
	.pet-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 28rpx 32rpx;
	}
	.pet-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 120rpx;
	}
	.pet-av {
		width: 112rpx;
		height: 112rpx;
		border-radius: 50%;
		background: #eee;
		display: block;
	}
	.pet-name {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #111;
		text-align: center;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.yard-foot {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 24rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;
	}
	.yard-av {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: #eee;
	}
	.yard-n {
		flex: 1;
		margin-left: 12rpx;
		font-size: 26rpx;
		color: #111;
	}
</style>
