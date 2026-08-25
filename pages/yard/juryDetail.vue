<template>
	<view class="page">
		<view class="hero">
			<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="nav-row">
					<view class="nav-side nav-left" @click.stop="goBack"><image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image></view>
					<text class="nav-title">逢猫评审团</text>
					<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
				</view>
			</view>
			<view class="hero-text">
				<text class="hero-title">{{ voted ? '感谢您的认真审查' : 'Ta的领养是真的吗？' }}</text>
				<text class="hero-sub">{{ voted ? '您的宝贵意见是逢猫审查虚假领养的重要参考' : '请您审查该申请人是否为虚假领养及虐猫群体的恶意领养' }}</text>
			</view>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
			<view v-if="voted" class="card vote-summary">
				<view class="bar-wrap">
					<view class="bar-left"><text>50%</text></view>
					<view class="bar-right"><text>50%</text></view>
				</view>
				<view class="summary-row">
					<view><text class="sum-name">挺真实</text><text class="sum-p">32人投票</text></view>
					<view class="sum-right"><text class="sum-name">有点假(已选)</text><text class="sum-p">32人投票</text></view>
				</view>
			</view>

			<view class="card">
				<view class="proof-gallery"><image src="/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png" mode="aspectFill"></image><image src="/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png" mode="aspectFill"></image></view>
				<view class="proof-row">
					<view class="proof-cell"><text class="proof-date">2026.01.03</text><text class="proof-label">来到逢猫</text></view>
					<view class="proof-cell"><text class="proof-date">2026.01.03</text><text class="proof-label">有家啦</text></view>
				</view>
				<text class="apply-body">我第一次去的时候小猫一直躲着我，去了几次都没有逮到，后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了</text>
			</view>

			<view class="card">
				<view class="applicant-row"><text class="applicant-name">逢猫</text><view class="applicant-tag"><text>申请人</text></view></view>
				<text class="apply-body">你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。</text>
				<view class="applicant-gallery"><image src="/static/figma/feature/04a93fa17267335f49e6e818f8caa78dd3afc80b.png" mode="aspectFill"></image><image src="/static/figma/jury-applicant-room.png" mode="aspectFill"></image></view>
			</view>

			<view class="card">
				<text class="card-title">申请领养的猫咪（{{ juryDemoPets.length }}）</text>
				<view class="pet-row">
					<view v-for="(p, i) in juryDemoPets" :key="i" class="pet-cell">
						<image class="pet-av" :src="petAvatarSrc(p)" mode="aspectFill" />
						<text class="pet-name">{{ p.name }}</text>
					</view>
				</view>
				<view class="yard-foot"><image class="yard-av" src="/static/avatar.png" mode="aspectFill"></image><text class="yard-n">我就是要喂猫</text><YardTagPill class="yard-tag-pill--ml" /></view>
			</view>
			<view class="bottom-space"></view>
			<view class="bar">
				<view class="share"><text>分享</text></view>
				<template v-if="!voted">
					<button class="btn yellow" @click="vote('real')">挺真实</button>
					<button class="btn blue" @click="vote('fake')">有点假</button>
				</template>
				<button v-else class="btn yellow full">下一个（1/5）</button>
			</view>
		</scroll-view>

		<PawNoticeModal
			v-model:visible="showVoteDayLimitModal"
			:message="pawVoteLimitMsg"
			@confirm="onVoteDayLimitConfirm"
		/>

		<view v-if="showVoteResult" class="mask" @click="showVoteResult=false">
			<view class="sheet" @click.stop>
				<image class="result-icon" :src="selectedVote==='real'?'/static/figma/jury-modal/icon-real.png':'/static/figma/jury-modal/icon-fake.png'" mode="scaleToFill" />
				<text class="sheet-title">投票成功</text>
				<image class="result-bar" src="/static/figma/jury-modal/vote-bar.png" mode="scaleToFill" />
				<view class="summary-row">
					<view>
						<text class="sum-name">挺真实{{ selectedVote==='real'?'(已选)':'' }}</text>
						<text class="sum-p">32人投票</text>
					</view>
					<view class="sum-right">
						<text class="sum-name">有点假{{ selectedVote==='fake'?'(已选)':'' }}</text>
						<text class="sum-p">32人投票</text>
					</view>
				</view>
				<view class="sheet-actions">
					<view class="sheet-btn ghost" @click="showVoteResult=false"><text>返回</text></view>
					<view class="sheet-btn yellow" @click="closeVoteSheet"><text>好的</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import PawNoticeModal from '@/components/PawNoticeModal.vue'
import YardTagPill from '@/components/YardTagPill.vue'
import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import { PAW_MSG_VOTE_DAY_LIMIT } from '@/utils/pawNoticeMessages.js'

const VOTE_KEY = 'PAWHOME_JURY_VOTES'
export default {
	components: { PawNoticeModal, YardTagPill },
	data() {
		return {
			juryDemoPets: [
				{ name: '奥利奥', avatar: '/static/home-feed-1.png' },
				{ name: '呗呗', avatar: '/static/home-feed-2.png' }
			],
			statusBarHeight: 20,
			menuRightWidth: 87,
			itemId: 'jury-1',
			selectedVote: '',
			voted: false,
			showVoteResult: false,
			/** 演示：首次点投票先弹「当日无投票次数」；接接口后删除 */
			mockVoteDayBlocked: true,
			showVoteDayLimitModal: false,
			pawVoteLimitMsg: PAW_MSG_VOTE_DAY_LIMIT
		}
	},
		onLoad(options) {
		const s = uni.getSystemInfoSync()
		this.statusBarHeight = s.statusBarHeight || 20
		// #ifdef H5
		this.statusBarHeight = 44
		// #endif
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(s.windowWidth - mb.left, 87)
		} catch (e) {}
		if (options.id) this.itemId = decodeURIComponent(options.id)
		this.readVote()
		if (options.state === 'voted') {
			this.selectedVote = 'fake'
			this.voted = true
		}
		if (options.popup === 'vote-real' || options.popup === 'vote-fake') {
			this.selectedVote = options.popup === 'vote-real' ? 'real' : 'fake'
			this.showVoteResult = true
		}
		if (options.popup === 'vote-limit') this.showVoteDayLimitModal = true
	},
	methods: {
		petAvatarSrc: adoptionPetAvatarSrc,
		goBack() { uni.navigateBack() },
		readVote() {
			let all = {}
			try { all = JSON.parse(uni.getStorageSync(VOTE_KEY) || '{}') } catch (e) {}
			const vote = all[this.itemId] || ''
			this.selectedVote = vote
			this.voted = !!vote
		},
		saveVote(v) {
			let all = {}
			try { all = JSON.parse(uni.getStorageSync(VOTE_KEY) || '{}') } catch (e) {}
			all[this.itemId] = v
			uni.setStorageSync(VOTE_KEY, JSON.stringify(all))
		},
		vote(v) {
			if (this.voted) return
			if (this.mockVoteDayBlocked) {
				this.showVoteDayLimitModal = true
				return
			}
			this.selectedVote = v
			this.saveVote(v)
			this.showVoteResult = true
		},
		onVoteDayLimitConfirm() {
			this.mockVoteDayBlocked = false
		},
		closeVoteSheet() {
			this.showVoteResult = false
			this.voted = true
		}
	}
}
</script>

<style lang="less" scoped>
.page{height:100vh;background:#f5f5f5;display:flex;flex-direction:column}
.hero{position:relative;z-index:1;height:279px;flex:none;background:#1d6df0}.nav-wrap{background:transparent}.nav-row{height:88rpx;display:flex;align-items:center;padding:0 8rpx}
.nav-side{width:88rpx;height:88rpx;display:flex;align-items:center;justify-content:center}.nav-back-icon{width:48rpx;height:48rpx;filter:brightness(0) invert(1)}
.nav-title{flex:1;text-align:center;font-size:34rpx;font-weight:600;color:#fff}.hero-text{padding:48rpx 24rpx 24rpx}
.hero-title{display:block;font-size:48rpx;font-weight:700;color:#fff}.hero-sub{display:block;margin-top:10rpx;font-size:24rpx;color:#cfe0ff}
.main-scroll{position:relative;z-index:2;flex:1;height:0;margin-top:-86px;padding:0 30rpx;box-sizing:border-box}
.card{background:#fff;border-radius:18rpx;padding:20rpx;margin-bottom:20rpx}.main-scroll .card:first-child{padding-bottom:18px}.main-scroll .card:nth-child(2){padding:10px 19px 22px}
.vote-summary{margin-top:-30rpx}.bar-wrap{height:54rpx;border-radius:27rpx;overflow:hidden;background:#eee;display:flex}
.bar-left{flex:1;background:#ffdd00;display:flex;align-items:center;padding-left:16rpx}.bar-right{flex:1;background:#1d93ea;display:flex;align-items:center;justify-content:flex-end;padding-right:16rpx;color:#fff}
.summary-row{display:flex;justify-content:space-between;margin-top:16rpx}.sum-name{display:block;font-size:24rpx;color:#333}.sum-p{display:block;margin-top:6rpx;font-size:22rpx;color:#999}.sum-right{text-align:right}
.proof-row{display:flex}.proof-cell{flex:1;text-align:center;margin:6rpx 0 14rpx}.proof-date{display:block;font-size:24rpx;color:#333}.proof-label{display:block;font-size:22rpx;color:#999;margin-top:4rpx}
.apply-body{font-size:27rpx;line-height:1.35;color:#333}.proof-gallery{display:flex;justify-content:space-around;gap:90rpx;margin:18rpx 68rpx 0}.proof-gallery image{width:212rpx;height:212rpx;border-radius:8rpx;flex:none}.applicant-row{display:flex;align-items:center;margin-bottom:10rpx}
.main-scroll .card:nth-child(2) .applicant-tag{margin-left:12px}.applicant-gallery{display:flex;gap:4rpx;margin-top:134rpx;margin-left:-9px}.applicant-gallery image{width:212rpx;height:212rpx;border-radius:8rpx}
.applicant-name{font-size:30rpx;font-weight:700}.applicant-tag{margin-left:12rpx;background:#f19a2d;border-radius:10rpx;padding:3rpx 10rpx}.applicant-tag text{font-size:22rpx;color:#fff}
.card-title{font-size:30rpx;font-weight:600;margin-bottom:16rpx}
.pet-row{display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:28rpx 32rpx}
.pet-cell{display:flex;flex-direction:column;align-items:center;width:120rpx}
.pet-av{width:112rpx;height:112rpx;border-radius:50%;background:#eee;display:block}
.pet-name{margin-top:12rpx;font-size:24rpx;color:#111;text-align:center;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yard-foot{display:flex;align-items:center;margin-top:20rpx;padding-top:16rpx;border-top:1rpx solid #f0f0f0}
.yard-av{width:56rpx;height:56rpx;border-radius:50%;background:#eee}.yard-n{margin-left:12rpx;font-size:30rpx;flex:1}
.bottom-space{height:120rpx}
.bar{display:flex;gap:16rpx;align-items:center;background:#fff;border-top:1rpx solid #eee;padding:12rpx 16rpx calc(12rpx + env(safe-area-inset-bottom))}
.share{width:72rpx;text-align:center;color:#666;font-size:22rpx}.btn{height:78rpx;line-height:78rpx;border-radius:39rpx;font-size:32rpx;border:none}
.yellow{flex:1;background:#ffdd00;color:#111}.blue{flex:1;background:#1d93ea;color:#fff}.full{flex:1}
.mask{position:fixed;inset:0;background:#5b5b5b;display:flex;align-items:flex-start;justify-content:center;z-index:99}
.sheet{position:relative;box-sizing:border-box;width:316px;height:319px;margin-top:241px;background:#fff;border-radius:20px;overflow:visible;padding:0}
.result-icon{position:absolute;left:128px;top:29px;width:60px;height:60px;border-radius:50%}
.sheet-title{position:absolute;left:0;right:0;top:100px;display:block;text-align:center;font-size:18px;line-height:25px;font-weight:600}
.result-bar{position:absolute;left:23px;top:159px;width:272px;height:31px}
.sheet .summary-row{position:absolute;left:23px;right:23px;top:194px;margin:0}
.sheet-actions{position:absolute;left:0;right:0;bottom:0;height:54px;display:flex;border-top:1px solid #eee}
.sheet-actions:after{content:'';position:absolute;left:316px;top:-1px;width:30px;height:55px;background:#ffe600}
.sheet-btn{flex:1;height:54px;display:flex;align-items:center;justify-content:center}.sheet-btn text{font-size:14px}.sheet-btn.ghost{border:0}.sheet-btn.ghost text{color:#9c9c9c}.sheet-btn.yellow{background:#5b5b5b}
</style>
