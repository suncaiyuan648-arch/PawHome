<template>
	<view class="guide-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
			<view class="page-body">
				<view class="intro-card">
					<text class="intro-text">逢猫小院旨在让流浪猫获得生存的猫粮，并帮助它们找到铁饭碗（领养），唯有以领养终止流浪</text>
					<view class="intro-btn" @click="onGoCreate">
						<text>前往创建</text>
						<image class="intro-btn-arrow" src="/static/youjiantou.png" mode="aspectFit"></image>
					</view>
				</view>

				<text class="sec-title">院主需要做的</text>
				<view class="rule-card rule-card--duties">
					<view class="rule-row">
						<text class="dot dot--green">•</text>
						<text class="rule-txt">完善小院信息：您需要真实的完善小院信息，实事求是，不弄虚作假；</text>
					</view>
					<view class="rule-row">
						<text class="dot dot--green">•</text>
						<text class="rule-txt">建立动物档案：真实详细的为每一个小毛娃填写档案，便于用户选择云养及领养；</text>
					</view>
					<view class="rule-row">
						<text class="dot dot--green">•</text>
						<text class="rule-txt">云养拍摄反馈：当用户选择云养您小院的小毛娃时，您需要在收到粮食包裹后，用纸条等写上投粮人的名字，及时拍摄投喂的图片或视频上传；</text>
					</view>
					<view class="rule-row">
						<text class="dot dot--green">•</text>
						<text class="rule-txt">反馈频率：最低一周反馈一次，建议每日坚持反馈，过低的反馈频率会让投粮人失去继续云养的动力，平台系统也将会降低小院的曝光权重；</text>
					</view>
					<view class="rule-row">
						<text class="dot dot--green">•</text>
						<text class="rule-txt">审核领养申请，并协助对方成功领养，给毛孩子们新找一个好归宿</text>
					</view>
				</view>

				<text class="sec-title">院主不能做的</text>
				<view class="rule-card rule-card--forbidden">
					<view class="rule-row">
						<text class="dot dot--red">•</text>
						<text class="rule-txt">禁止发布虚假流浪猫信息骗取猫粮、引导贩卖猫咪</text>
					</view>
					<view class="rule-row">
						<text class="dot dot--red">•</text>
						<text class="rule-txt">禁止以任何理由或形式索要钱财</text>
					</view>
					<view class="rule-row">
						<text class="dot dot--red">•</text>
						<text class="rule-txt">禁止在领养申请以外的任何地方填写联系方式，引导诱导私下交易转账</text>
					</view>
					<text class="warn-text">以上违规一经发现将永久封禁并追责</text>
				</view>
			</view>
		</scroll-view>

		<view v-if="showAuthDialog" class="auth-mask" @click="closeAuthDialog">
			<view class="auth-dialog" @click.stop>
				<text class="auth-title">实名认证</text>
				<text class="auth-desc">创建小院需要先实名认证，每人仅能创建一个小院，发布虚假违规信息将永久取消您的小院资格，平台将严格保护您的隐私。</text>
				<view class="auth-actions">
					<view class="auth-btn auth-btn--cancel" @click="closeAuthDialog">
						<text>返回</text>
					</view>
					<view class="auth-btn auth-btn--confirm" @click="startAuth">
						<text>开始实名</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			showAuthDialog: false
		}
	},
	onLoad() {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef H5
		this.statusBarHeight = 48
		// #endif
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onGoCreate() {
			this.showAuthDialog = true
		},
		closeAuthDialog() {
			this.showAuthDialog = false
		},
		startAuth() {
			this.showAuthDialog = false
			uni.navigateTo({ url: '/pages/auth/realName' })
		}
	}
}
</script>

<style scoped>
.guide-page { height: 100vh; min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; box-sizing: border-box; }
.nav-wrap { flex-shrink: 0; background: #f5f5f5; }
.nav-row { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 8rpx; box-sizing: border-box; }
.nav-side { min-width: 80rpx; display: flex; align-items: center; }
.nav-left { padding: 8rpx 24rpx 8rpx 16rpx; justify-content: center; }
.nav-back-icon { width: 20rpx; height: 36rpx; }
.main-scroll { flex: 1; min-height: 0; width: 100%; box-sizing: border-box; }
.page-body { padding: 16rpx 20rpx 32rpx; box-sizing: border-box; }
.intro-card { min-height: 142px; background: #fff; border-radius: 10px; padding: 16px 15px 12px; box-sizing: border-box; }
.intro-text { font-size: 14px; color: #202020; line-height: 18px; }
.intro-btn { margin-top: 16rpx; margin-left: auto; width: 196rpx; height: 64rpx; border-radius: 32rpx; background: #d4f08a; display: flex; align-items: center; justify-content: center; }
.intro-btn text { font-size: 32rpx; font-weight: 500; color: #1f1f1f; }
.intro-btn-arrow { width: 18rpx; height: 18rpx; margin-left: 8rpx; }
.sec-title { display: block; margin: 18px 10px 12px; font-size: 18px; font-weight: 700; color: #1f1f1f; line-height: 24px; }
.rule-card { background: #fff; border-radius: 10px; padding: 15px; box-sizing: border-box; }
.rule-card--duties { min-height: 407px; }
.rule-card--forbidden { min-height: 219px; }
.rule-row { display: flex; align-items: flex-start; margin-bottom: 14px; }
.dot { margin-right: 10rpx; font-size: 28rpx; line-height: 40rpx; }
.dot--green { color: #49c579; }
.dot--red { color: #ef6b6b; }
.rule-txt { flex: 1; min-width: 0; font-size: 14px; color: #303030; line-height: 20px; }
.warn-text { display: block; margin-top: 8px; text-align: center; color: #e45454; font-size: 14px; font-weight: 500; line-height: 20px; }

.auth-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.58);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	box-sizing: border-box;
	z-index: 999;
}

.auth-dialog {
	width: 100%;
	max-width: 670rpx;
	background: #fff;
	border-radius: 28rpx;
	overflow: hidden;
}

.auth-title {
	display: block;
	text-align: center;
	margin-top: 48rpx;
	font-size: 52rpx;
	font-weight: 700;
	color: #222;
	line-height: 64rpx;
}

.auth-desc {
	display: block;
	margin: 42rpx 52rpx 48rpx;
	font-size: 34rpx;
	line-height: 48rpx;
	color: #666;
}

.auth-actions {
	display: flex;
	height: 96rpx;
}

.auth-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.auth-btn text {
	font-size: 40rpx;
	font-weight: 500;
}

.auth-btn--cancel {
	background: #fff;
}

.auth-btn--cancel text {
	color: #9a9a9a;
}

.auth-btn--confirm {
	background: #ffe60f;
}

.auth-btn--confirm text {
	color: #111;
	font-weight: 700;
}
</style>
