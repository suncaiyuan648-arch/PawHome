<template>
	<view class="page" :class="longMode ? 'page--long' : 'page--compact'">
		<!-- #ifndef MP-WEIXIN -->
		<image v-if="!longMode" class="h5-status-bar" src="/static/figma/adoption-apply-top.png" mode="scaleToFill"></image>
		<image v-else class="h5-status-bar" src="/static/figma/adoption-help-top.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">{{ longMode ? '求助申请' : '领养申请' }}</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<scroll-view
			class="main-scroll"
			scroll-y
			:show-scrollbar="false"
			:bounces="false"
			:enable-flex="true"
		>
			<view class="card">
				<textarea
					v-model="applyText"
					class="ta"
					maxlength="500"
					:placeholder="longMode ? '真实的讲述这只流浪动物的情况...自己与这只流浪动物之间的故事...需要的救助基金用作什么用途...是否有问清楚合适的宠物医院价格...有证明材料证明吗...真实坦诚的语言更能打动投票人！' : '向院主说明你的情况，如年龄、身份、是否养过猫、是否已经和家里人商量好决定要领养了，这一点十分重要，避免头脑一热领养了几天后再次丢弃。'"
					placeholder-class="ta-ph"
				></textarea>
				<text class="counter">{{ applyText.length }}/500</text>
				<view class="media-row">
					<view
						v-for="(path, mi) in mediaPaths"
						:key="'m-' + mi"
						class="media-slot"
					>
						<image class="media-thumb" :src="path" mode="aspectFill" @click.stop="previewMedia(mi)" />
						<view class="media-remove" @click.stop="removeMedia(mi)"><text>×</text></view>
					</view>
					<view
						v-if="mediaPaths.length < maxMedia"
						class="media-add"
						@click="onPickMedia"
					>
						<text class="media-icon">＋</text>
						<text class="media-label">照片/视频</text>
					</view>
				</view>
			</view>

			<view class="card card--second">
				<text class="section-title">{{ longMode ? '申请救助的动物' : '申请领养的猫咪' }}（{{ pets.length }}）</text>
				<view class="pet-row">
					<view v-for="(p, i) in pets" :key="'p-' + i" class="pet-cell">
						<image
							class="pet-av"
							:src="petAvatarSrc(p)"
							mode="aspectFill"
						/>
						<text class="pet-name">{{ p.name }}</text>
					</view>
					<view class="pet-cell pet-cell--add" @click="addMoreCats">
						<view class="add-circle-outer">
							<view class="add-circle">
								<text class="add-plus">+</text>
							</view>
						</view>
						<text class="pet-name pet-name--invisible">占位</text>
					</view>
				</view>
				<view class="yard-row" @click.stop="openYardDetailPage">
					<image class="yard-av" :src="yardAvatar" mode="aspectFill" />
					<view class="yard-name-line">
						<text class="yard-name">{{ yardName }}</text>
						<YardTagPill class="yard-tag-pill--ml" />
					</view>
				</view>
			</view>
			<view v-if="longMode" class="help-form-card">
				<view v-for="row in helpFormRows" :key="row.label" class="help-form-row"><text>{{ row.label }}<text class="required">*</text></text><text :class="{ amount: row.amount }">{{ row.value }}　›</text></view>
			</view>
			<view v-if="longMode" class="help-notice"><uni-icons type="info" color="#999" :size="14"></uni-icons><text>感谢您的热心参与，请您如实填写真实身份、真实情况，这将为您赢得更多信任。同时提醒您，您需要对证实内容的真实性负责，如有不实，需承担相应法律责任。</text></view>
			<view v-if="longMode" class="help-agreement"><uni-icons type="checkbox-filled" color="#ffdc00" :size="14"></uni-icons><text>已经阅读《隐私政策》、《用户协议》和《发起救助承诺》</text></view>
			<view class="bottom-spacer"></view>
		</scroll-view>

		<view class="footer">
			<button class="btn-send" @click="submit">{{ longMode ? '提交' : '发送申请' }}</button>
		</view>

		<AdoptPickCatsSheet
			v-model="adoptPickSheetVisible"
			:yard-name="yardName"
			:yard-id="yardId"
			:owner-avatar="yardAvatar"
			:owner-paw-id="ownerPawId"
			return-to-apply
			@confirmed="syncPick"
		/>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'
	import { openYardDetail } from '@/utils/profileNav.js'
	import {
		getAdoptionPick,
		addAdoption,
		setLastAdoptionId
	} from '@/utils/adoptionStorage.js'
	import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
	import AdoptPickCatsSheet from '@/components/AdoptPickCatsSheet.vue'
	import YardTagPill from '@/components/YardTagPill.vue'

	export default {
		components: { AdoptPickCatsSheet, YardTagPill },
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				applyText: '',
				pets: [
					{ name: '奥利奥', avatar: '/static/avatarlog.png' },
					{ name: '呗呗', avatar: '/static/figma/dynamic-cats.jpg' },
					{ name: '呗呗', avatar: '/static/figma/dynamic-cats.jpg' },
					{ name: '呗呗', avatar: '/static/figma/dynamic-cats.jpg' },
					{ name: '呗呗', avatar: '/static/figma/dynamic-cats.jpg' }
				],
				yardName: '我就是要喂猫',
				yardId: '1',
				yardAvatar: '/static/avatar.png',
				ownerPawId: 'yard_card_owner',
				mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
				maxMedia: 6,
				longMode: false,
				helpFormRows: [
					{ label:'求助金额', value:'￥0.00', amount:true },
					{ label:'收款微信账户', value:'13900000000' },
					{ label:'发起人姓名', value:'马冬梅' },
					{ label:'发起人年龄', value:'20' },
					{ label:'发起人身份', value:'学生' },
					{ label:'发起人所在地', value:'安徽省合肥市蜀山区海恒社区' }
				],
				adoptPickSheetVisible: false
			}
		},
		onLoad(query = {}) {
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
			this.longMode = query.state === 'long'
			this.syncPick()
			this.applyDesignState()
		},
		onShow() {
			this.syncPick()
			this.applyDesignState()
		},
		methods: {
			applyDesignState() {
				this.mediaPaths = ['/static/figma/adoption-flow/04a93fa17267335f49e6e818f8caa78dd3afc80b.png', '/static/figma/adoption-flow/b61b026ea991c01c6257c909021245fd64956837.png']
				this.yardAvatar = '/static/figma/home/yard-avatar.png'
				this.pets = [
					{ name:'奥利奥', avatar:'/static/figma/adoption-flow/pet-orange.png' },
					{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' },
					{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' },
					{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' },
					{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' }
				]
				if (this.longMode) {
					this.pets = [
						{ name:'奥利奥', avatar:'/static/figma/adoption-flow/pet-orange.png' },
						{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' }
					]
					this.yardAvatar = '/static/figma/adoption-flow/pet-owner.png'
				}
			},
			syncPick() {
				const pick = getAdoptionPick()
				if (pick.pets && pick.pets.length) {
					this.pets = pick.pets
					this.yardName = pick.yardName || pick.ownerName || this.yardName
					this.yardAvatar = pick.ownerAvatar || this.yardAvatar
					if (pick.yardId) this.yardId = pick.yardId
					if (pick.ownerPawId) this.ownerPawId = pick.ownerPawId
				}
			},
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/index/index' })
			},
			petAvatarSrc: adoptionPetAvatarSrc,
			openYardDetailPage() {
				openYardDetail({ yardId: this.yardId || '1', yardName: this.yardName })
			},
			previewMedia(index) {
				const urls = this.mediaPaths.filter((u) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(u || ''))
				if (!urls.length) {
					uni.showToast({ title: '视频请在相册中查看', icon: 'none' })
					return
				}
				const cur = this.mediaPaths[index]
				const current = /\.(png|jpe?g|gif|webp|bmp)$/i.test(cur || '') ? cur : urls[0]
				uni.previewImage({
					current,
					urls
				})
			},
			removeMedia(index) {
				this.mediaPaths.splice(index, 1)
			},
			onPickMedia() {
				const remain = this.maxMedia - this.mediaPaths.length
				if (remain <= 0) {
					uni.showToast({ title: '最多上传' + this.maxMedia + '个文件', icon: 'none' })
					return
				}
				const onOk = (paths) => {
					this.mediaPaths = this.mediaPaths.concat(paths).slice(0, this.maxMedia)
					if (paths.length) uni.showToast({ title: '已添加', icon: 'none' })
				}
				// #ifdef MP-WEIXIN
				uni.chooseMedia({
					count: Math.min(remain, 9),
					mediaType: ['image', 'video'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const paths = (res.tempFiles || []).map((f) => f.tempFilePath)
						onOk(paths)
					},
					fail: () => {}
				})
				// #endif
				// #ifndef MP-WEIXIN
				uni.chooseImage({
					count: Math.min(remain, 9),
					sourceType: ['album', 'camera'],
					success: (res) => onOk(res.tempFilePaths || [])
				})
				// #endif
			},
			addMoreCats() {
				this.adoptPickSheetVisible = true
			},
			submit() {
				const t = (this.applyText || '').trim()
				if (!t) {
					uni.showToast({ title: '请填写申请说明', icon: 'none' })
					return
				}
				if (!this.pets.length) {
					uni.showToast({ title: '请先选择猫咪', icon: 'none' })
					return
				}
				const id = 'ad-' + Date.now()
				const rec = {
					id,
					status: 'pending',
					applyText: t,
					mediaPaths: [...this.mediaPaths],
					pets: this.pets.map((p) => ({ name: p.name, avatar: p.avatar || '/static/home-feed-1.png' })),
					yardName: this.yardName,
					ownerName: this.yardName,
					yardTag: '小院',
					ownerAvatar: this.yardAvatar,
					applicantName: '逢猫',
					createdAt: Date.now()
				}
				addAdoption(rec)
				setLastAdoptionId(id)
				uni.redirectTo({
					url: '/pages/adoption/adoptApplySuccess?id=' + encodeURIComponent(id)
				})
			}
		}
	}
</script>

<style lang="less" scoped>
	.page {
		position:relative;
		height: 100vh;
		min-height: 100vh;
		width: 100%;
		background: #f5f5f5;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}
	.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:105px;z-index:100;pointer-events:none}
	.nav-wrap {
		flex-shrink: 0;
		background: #f5f5f5;
	}
	.nav-row {
		position: relative;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8rpx;
	}
	.nav-side {
		position: relative;
		z-index: 2;
		width: 88rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.nav-back-icon {
		width: 48rpx;
		height: 48rpx;
	}
	.nav-title {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 34rpx;
		font-weight: 600;
		color: #111;
		pointer-events: none;
		z-index: 1;
	}
	.main-scroll {
		flex: 1;
		min-height: 0;
		width: 100%;
		padding: 41px 15px 12px;
		box-sizing: border-box;
	}
	.card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
	}
	.card:not(.card--second) { height: 285px; padding: 20rpx; overflow: hidden; box-sizing: border-box; }
	.card--second {
		padding-bottom: 32rpx;
		box-sizing: border-box;
	}
	.page--compact .card--second { height: 296px; }
	.page--long .card--second { height: 201px; }
	.ta {
		width: 100%;
		min-height: 220rpx;
		height: 220rpx;
		font-size: 28rpx;
		color: #222;
		line-height: 1.5;
		box-sizing: border-box;
	}
	.card:not(.card--second) .ta { width: calc(100% - 14rpx); margin-left: 14rpx; }
	.ta-ph {
		color: #bbb;
	}
	.media-add {
		width: 212rpx;
		height: 212rpx;
		background: #ececec;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-sizing: border-box;
	}
	.media-icon {
		font-size: 40rpx;
		color: #999;
		line-height: 1;
	}
	.media-label {
		font-size: 22rpx;
		color: #999;
		margin-top: 8rpx;
	}
	.counter {
		display: block;
		text-align: right;
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}
	.media-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 4rpx;
		margin-top: 38rpx;
	}
	.media-slot {
		position: relative;
		width: 212rpx;
		height: 212rpx;
		border-radius: 12rpx;
		overflow: hidden;
		background: #f0f0f0;
	}
	.media-thumb {
		width: 100%;
		height: 100%;
		display: block;
	}
	.media-remove {
		display:none !important;
		position: absolute;
		top: 4rpx;
		right: 4rpx;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.45);
		display: none;
		align-items: center;
		justify-content: center;
	}
	.media-remove text {
		color: #fff;
		font-size: 28rpx;
		line-height: 1;
	}
	.section-title {
		font-size: 30rpx;
		font-weight: 400;
		color: #111;
	}
	.pet-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 28rpx 30rpx;
		margin-top: 32rpx;
	}
	.pet-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 96rpx;
	}
	.pet-cell--add {
		justify-content: flex-start;
	}
	.add-circle-outer {
		width: 96rpx;
		height: 96rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.pet-av {
		width: 96rpx;
		height: 96rpx;
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
	.pet-name--invisible {
		opacity: 0;
		font-size: 24rpx;
		margin-top: 12rpx;
		height: 34rpx;
	}
	.add-circle {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: #e8e8e8;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.add-plus {
		font-size: 40rpx;
		font-weight: 600;
		color: #ffdd00;
		line-height: 1;
		transform: translateY(-2rpx);
	}
	.yard-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 60rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid #f0f0f0;
	}
	.yard-av {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: #eee;
		flex-shrink: 0;
	}
	.yard-name-line {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: nowrap;
		margin-left: 16rpx;
		flex: 1;
		min-width: 0;
	}
	.yard-name {
		font-size: 28rpx;
		color: #111;
		flex-shrink: 0;
		max-width: 420rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bottom-spacer {
		height: 160rpx;
	}
	.help-form-card { margin-bottom:18rpx; padding:0 24rpx; background:#fff; border-radius:12rpx; }
	.help-form-row { min-height:110rpx; display:flex; align-items:center; justify-content:space-between; border-bottom:1rpx solid #eee; font-size:27rpx; color:#222; }
	.help-form-row:last-child { border-bottom:none; }
	.help-form-row > text:last-child { max-width:60%; text-align:right; font-weight:600; }
	.required,.amount { color:#f33; }
	.help-notice { display:flex; align-items:flex-start; gap:10rpx; padding:4rpx 4rpx 18rpx; color:#999; font-size:20rpx; line-height:24rpx; }
	.help-notice text { flex:1; }
	.help-agreement { display:flex; align-items:center; gap:6rpx; padding:12rpx 18rpx 16rpx; background:#fff; color:#777; font-size:20rpx; line-height:30rpx; }
	.footer {
		flex-shrink: 0;
		padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
		background: #f5f5f5;
		box-sizing: border-box;
		transform:translateY(-36px);
		margin-bottom:-98px;
	}
	.page--compact .footer { transform:translateY(-132px); }
	.page--long .footer { margin-bottom:-36px; }
	.btn-send {
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 48rpx;
		background: #ffdd00;
		color: #111;
		font-size: 32rpx;
		font-weight: 600;
		border: none;
	}
</style>
