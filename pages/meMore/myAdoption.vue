<template>
	<view class="adopt-page" data-qa="qa-my-adoption-page">
		<PawPageNav title="" fallback-url="/pages/me/index" :auto-back="false" @back="goBack" />

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false">
			<view class="list-pad">
				<view class="page-heading">
					<text class="page-heading__title">我的领养</text>
					<view v-if="listBadgeCount" class="page-heading__badge">
						<text>{{ listBadgeCount }}</text>
					</view>
				</view>
				<view v-if="pageState === 'empty'" class="empty-state">
					<image src="/static/figma/empty-adoption.png" mode="scaleToFill"></image>
					<text class="empty-title">还没有领养</text>
					<text class="empty-copy">快去领养一只小动物吧</text>
					<PawButton text="去领养" size="sm" qa="qa-my-adoption-empty-action" @click="goAdoptEntry" />
				</view>
				<view v-for="item in pageState === 'empty' ? [] : adoptionList" :key="item.id" class="adopt-card"
					:data-qa="`qa-my-adoption-card-${item.id}`" @click="onCardTap(item)">
					<view class="card-head">
						<PawAvatar class="head-avatar" :src="item.ownerAvatar" fallback="/static/user.png" :size="37"
							:clickable="true" @click="openOwnerProfile(item)" />
						<view class="head-main" @click.stop="openOwnerProfile(item)">
							<view class="head-name-row">
								<text class="head-name">{{ item.ownerName }}</text>
								<view class="head-tag"><text>{{ item.yardTag }}</text></view>
							</view>
						</view>
						<PawStatusPill class="status-pill" :text="item.statusText" :tone="statusTone(item.statusTone)"
							variant="outline">
							<text class="status-pill__text">{{ item.statusText }}</text>
							<view v-if="item.statusDot" class="status-dot"></view>
						</PawStatusPill>
					</view>
					<scroll-view class="card-pets-scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
						<view class="card-pets-row">
							<view v-for="(pet, pi) in item.pets" :key="pi" class="pet-cell">
								<PawImage class="pet-avatar" :src="pet.avatar" :size="40" :radius="20"
									:preview="false" />
								<text class="pet-name">{{ pet.name }}</text>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile } from '@/utils/profileNav.js'
import { getAdoptionRecords, toAdoptionCard } from '@/utils/adoptionStorage.js'
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'

export default {
	components: { PawPageNav, PawButton, PawAvatar, PawImage, PawStatusPill },
	data() {
		return {
			pageState: 'list',
			adoptionList: []
		}
	},
	computed: {
		listBadgeCount() {
			return this.pageState === 'empty' ? 0 : this.adoptionList.length
		}
	},
	onLoad(options) {
		this.pageState = options.state === 'empty' ? 'empty' : 'list'
		if (options.openDetail) {
			const id = decodeURIComponent(options.openDetail)
			this.$nextTick(() => {
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/meMore/adoptionFlow?id=' + encodeURIComponent(id)
					})
				}, 80)
			})
		}
	},
	onShow() {
		if (this.pageState !== 'empty') this.refreshAdoptionList()
	},
	methods: {
		refreshAdoptionList() {
			this.adoptionList = getAdoptionRecords()
				.map((record) => toAdoptionCard(record))
				.filter(Boolean)
		},
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/me/index' })
		},
		onCardTap(item) {
			const recordId = item && (item.recordId || item.id)
			if (!recordId) return
			uni.navigateTo({
				url: '/pages/meMore/adoptionFlow?id=' + encodeURIComponent(recordId)
			})
		},
		openOwnerProfile(item) {
			if (!item) return
			openUserProfile({
				pawId: item.ownerPawId || 'adopt-owner-' + (item.id || item.ownerName),
				nickname: item.ownerName,
				avatar: item.ownerAvatar || ''
			})
		},
		statusTone(tone) {
			return tone === 'red' ? 'danger' : tone === 'green' ? 'success' : 'neutral'
		},
		goAdoptEntry() {
			uni.navigateTo({ url: '/pages/adoption/petDetail' })
		}
	}
}
</script>

<style scoped>
.adopt-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	box-sizing: border-box;
}

.main-scroll {
	flex: 1 1 auto;
	min-height: 0;
	height: 0;
	box-sizing: border-box;
}

.list-pad {
	display: flex;
	flex-direction: column;
	padding: 0 15px 20px;
	box-sizing: border-box;
}

.page-heading {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	gap: 2px;
	min-height: 29px;
	margin-bottom: 0;
}

.page-heading__title {
	color: #333333;
	font-size: 17px;
	font-weight: 500;
	line-height: 24px;
}

.page-heading__badge {
	display: flex;
	width: 15px;
	height: 13px;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	padding: 1px 4px;
	border-radius: 7.5px;
	background: #ff2741;
}

.page-heading__badge text {
	color: #ffffff;
	font-size: 10px;
	font-weight: 500;
	line-height: 11px;
}

.adopt-card {
	display: flex;
	flex: 0 0 155px;
	min-width: 0;
	height: 155px;
	flex-direction: column;
	box-sizing: border-box;
	padding: 14px 13px 9px;
	margin-bottom: 6px;
	border: 0.3px solid #e4e4e4;
	background: #ffffff;
	border-radius: 15px;
}

.card-head {
	display: flex;
	flex: 0 0 auto;
	min-width: 0;
	align-items: flex-start;
	margin-bottom: 16px;
}

.head-avatar {
	flex: 0 0 37px;
}

.head-main {
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
	align-items: flex-start;
	margin-left: 5px;
}

.head-name-row {
	display: flex;
	align-items: center;
	min-width: 0;
	gap: 3px;
	flex-wrap: nowrap;
}

.head-name {
	max-width: 100%;
	overflow: hidden;
	color: #333333;
	font-size: 15px;
	font-weight: 500;
	line-height: 22px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.head-tag {
	display: flex;
	flex: 0 0 auto;
	height: 16px;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	padding: 0 5px;
	border-radius: 8px;
	background: #fff463;
}

.head-tag text {
	color: #333333;
	font-size: 10px;
	font-weight: 500;
	line-height: 16px;
}

.status-pill {
	position: relative;
	flex: 0 0 auto;
	min-width: 0;
	margin-top: 6px;
	margin-left: 5px;
}

.status-pill__text {
	color: inherit;
	font-size: 12px;
	font-weight: 400;
	line-height: 16px;
	white-space: nowrap;
}

.status-dot {
	position: absolute;
	top: -3px;
	right: -3px;
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #ff2741;
	border: 1px solid #ffffff;
	box-sizing: border-box;
}

.card-pets-scroll {
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.card-pets-row {
	display: flex;
	flex: 0 0 auto;
	min-width: 0;
	align-items: flex-start;
	gap: 5px;
	padding: 0;
	box-sizing: border-box;
}

.pet-cell {
	display: flex;
	width: 49px;
	flex: 0 0 49px;
	flex-direction: column;
	align-items: flex-start;
	box-sizing: border-box;
}

.pet-avatar {
	flex: 0 0 40px;
	margin-left: 5px;
}

.pet-name {
	display: block;
	width: 49px;
	margin-top: 2px;
	overflow: hidden;
	color: #6e6e6e;
	font-size: 11px;
	font-weight: 500;
	line-height: 16px;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
	box-sizing: border-box;
}

.empty-state {
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	align-items: center;
	padding-top: 189px;
	box-sizing: border-box;
}

.empty-state image {
	width: 155px;
	height: 120px;
	flex: 0 0 auto;
}

.empty-title {
	margin-top: 9px;
	color: #777777;
	font-size: 12px;
	line-height: 17px;
}

.empty-copy {
	margin-top: 4px;
	color: #bbbbbb;
	font-size: 10px;
	line-height: 14px;
}

.empty-state .paw-button {
	min-width: 96px;
	margin-top: 16px;
}
</style>
