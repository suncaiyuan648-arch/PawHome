<template>
	<view class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">领养申请</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>
		<scroll-view v-if="record" class="main-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
			<view class="status-row">
				<text class="status-title">{{ statusText }}</text>
			</view>
			<view class="card" v-if="record.applyText">
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
					<image class="yard-av" :src="record.ownerAvatar" mode="aspectFill" @click.stop="openOwnerFromRecord"></image>
					<text class="yard-n" @click.stop="openOwnerFromRecord">{{ record.ownerName }}</text>
					<YardTagPill class="yard-tag-pill--ml" @click.stop="openYardFromRecord" />
				</view>
			</view>
			<view class="card card--link" @click="openAdoptInfo">
				<text>领养信息</text>
				<view class="adopt-link-more">
					<text>查看</text>
					<image class="adopt-link-more__arrow" src="/static/youjiantou.png" mode="aspectFit" />
				</view>
			</view>
			<view class="card card--link" @click="openApplyContent">
				<text>申请内容</text>
				<view class="adopt-link-more">
					<text>查看</text>
					<image class="adopt-link-more__arrow" src="/static/youjiantou.png" mode="aspectFit" />
				</view>
			</view>
		</scroll-view>
		<view class="bar" v-if="record && record.status==='pickup'">
			<button class="btn ghost" @click="giveUp">放弃领养</button>
			<button class="btn yellow" @click="goConfirmReceive">确认领养抽猫粮</button>
		</view>
		<view v-if="showContact" class="contact-mask"><view class="contact-dialog"><text class="contact-title">院主联系方式</text><view class="contact-number">19078676542</view><view class="contact-actions"><text>返回</text><text>复制</text></view></view></view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import { getAdoptionById, getDemoAdoptions, updateAdoption } from '@/utils/adoptionStorage.js'
import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import YardTagPill from '@/components/YardTagPill.vue'

export default {
	components: { YardTagPill },
	data() {
		return { statusBarHeight: 20, menuRightWidth: 87, recordId: '', record: null, showContact:false }
	},
	computed: {
		statusText() {
			const m = {
				pending: '等待院主审核中……',
				rejected: '已拒绝领养申请',
				pickup: '院主已同意，待申请人前往领养',
				owner_confirm: '申请人已领养，待院主确认',
				jury_confirm: '院主已确认，待评审团确认',
				reward: '恭喜您！获得领养礼物！',
				reward_done: '奖励已领取'
			}
			return m[this.record?.status] || '领养申请'
		}
	},
	onLoad(options) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		if (options.id) {
			this.recordId = decodeURIComponent(options.id)
			let r = getAdoptionById(this.recordId)
			if (!r) r = getDemoAdoptions().find((d) => d.id === this.recordId) || null
			this.record = r
		}
		this.showContact = options.popup === 'contact'
	},
	methods: {
		petAvatarSrc: adoptionPetAvatarSrc,
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/me/index' })
		},
		openOwnerFromRecord() {
			const r = this.record
			if (!r) return
			openUserProfile({
				pawId: r.ownerPawId || 'adopt-detail-owner-' + this.recordId,
				nickname: r.ownerName,
				avatar: r.ownerAvatar || ''
			})
		},
		openYardFromRecord() {
			const r = this.record
			if (!r) return
			openYardDetail({ yardId: r.yardId || '1', yardName: r.ownerName })
		},
		openApplyContent() { uni.navigateTo({ url: '/pages/meMore/adoptionApplyContent?id=' + encodeURIComponent(this.recordId) }) },
		openAdoptInfo() { uni.navigateTo({ url: '/pages/yard/adoptionAudit?mode=ownerPending&id=' + encodeURIComponent(this.recordId) }) },
		goConfirmReceive() { uni.navigateTo({ url: '/pages/yard/adoptionAudit?mode=ownerConfirm&id=' + encodeURIComponent(this.recordId) }) },
		giveUp() {
			updateAdoption(this.recordId, { status: 'abandoned' })
			uni.showToast({ title: '已放弃领养', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 500)
		}
	}
}
</script>

<style lang="less" scoped>
.page{height:100vh;display:flex;flex-direction:column;background:#f5f5f5}
.nav-wrap{flex-shrink:0;background:#f5f5f5}.nav-row{height:88rpx;display:flex;align-items:center;padding:0 8rpx}
.nav-side{width:88rpx;height:88rpx;display:flex;align-items:center;justify-content:center}.nav-back-icon{width:48rpx;height:48rpx}
.nav-title{flex:1;text-align:center;font-size:34rpx;font-weight:600}.main-scroll{flex:1;height:0;padding:24rpx;box-sizing:border-box}
.status-row{padding:8rpx 8rpx 18rpx}.status-title{font-size:42rpx;font-weight:700}
.card{background:#fff;border-radius:20rpx;padding:28rpx;margin-bottom:20rpx}.apply-body{font-size:28rpx;line-height:1.6}
.card-title{font-size:30rpx;font-weight:600;margin-bottom:16rpx}
.contact-mask{position:fixed;inset:0;z-index:900;background:#5b5b5b;display:flex;align-items:center;justify-content:center}.contact-mask:after{content:'';position:fixed;left:335px;top:443px;width:40px;height:54px;background:#ffe000}.contact-dialog{width:295px;height:256px;border-radius:18px;background:#fff;overflow:hidden;transform:translateY(-38px)}.contact-title{display:block;margin-top:18px;text-align:center;font-size:20px;font-weight:600}.contact-number{height:73px;margin:40px 30px 44px;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600}.contact-actions{display:flex;height:53px;border-top:1px solid #eee}.contact-actions text{flex:1;display:flex;align-items:center;justify-content:center;color:#888;font-size:15px}.contact-actions text+text{color:#222;border-left:1px solid #eee;background:#5b5b5b}
.pet-row{display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:28rpx 32rpx}
.pet-cell{display:flex;flex-direction:column;align-items:center;width:120rpx}
.pet-av{width:112rpx;height:112rpx;border-radius:50%;background:#eee;display:block}
.pet-name{margin-top:12rpx;font-size:24rpx;color:#111;text-align:center;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yard-foot{display:flex;align-items:center;margin-top:24rpx;padding-top:20rpx;border-top:1rpx solid #f0f0f0}.yard-av{width:56rpx;height:56rpx;border-radius:50%;background:#eee}
.yard-n{flex:1;margin-left:12rpx;font-size:26rpx}
.card--link{display:flex;justify-content:space-between;align-items:center;font-size:30rpx}
.adopt-link-more{display:flex;flex-direction:row;align-items:center;column-gap:8rpx}
.adopt-link-more__arrow{width:22rpx;height:22rpx;flex-shrink:0}
.bar{display:flex;gap:20rpx;background:#fff;padding:16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));border-top:1rpx solid #eee}
.btn{height:88rpx;line-height:88rpx;border-radius:44rpx;font-size:28rpx}.ghost{flex:1;background:#fff;border:2rpx solid #ddd;color:#333}.yellow{flex:1.2;background:#ffdd00;color:#111;border:none}
</style>
