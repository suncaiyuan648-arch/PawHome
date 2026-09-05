<template>
	<view class="jury-page" data-qa="qa-jury-panel">
		<PawPageNav title="逢猫评审团" background="#f7f7f7" :title-centered="true" :auto-back="false" @back="goBack" />

		<view class="jury-stats-shell" data-qa="qa-jury-stats-sticky">
			<view class="jury-stats" data-qa="qa-jury-tabs">
				<view class="jury-stat" :class="{ 'jury-stat--active': activeTab === 'pending' }"
					data-qa="qa-jury-stat-pending" @tap.stop="selectTab('pending')">
					<text class="jury-stat__count">{{ pendingCount }}</text>
					<view class="jury-stat__label" :class="{ 'jury-stat__label--active': activeTab === 'pending' }">
						<text>待投票</text>
					</view>
				</view>
				<view class="jury-stat" :class="{ 'jury-stat--active': activeTab === 'finished' }"
					data-qa="qa-jury-stat-finished" @tap.stop="selectTab('finished')">
					<text class="jury-stat__count">{{ finishedCount }}</text>
					<view class="jury-stat__label" :class="{ 'jury-stat__label--active': activeTab === 'finished' }">
						<text>投票结束</text>
					</view>
				</view>
			</view>
		</view>

		<scroll-view class="jury-scroll" scroll-y :show-scrollbar="false" data-qa="qa-jury-scroll">

			<view v-if="visibleItems.length" class="jury-list" data-qa="qa-jury-list">
				<PawJuryItemCard v-for="item in visibleItems" :key="item.id" :item="item"
					:qa="`qa-jury-card-${item.id}`" @click="openDetail" @identity-click="openIdentity" />
			</view>

			<view v-else class="jury-empty" data-qa="qa-jury-empty">
				<text>{{ activeTab === 'pending' ? '暂无待投票内容' : '暂无已结束投票' }}</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawJuryItemCard from '@/components/PawJuryItemCard.vue'
import { JURY_ITEM_STATUS } from '@/utils/juryMock.js'
import { getJuryItems } from '@/utils/juryStorage.js'
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile } from '@/utils/profileNav.js'

export default {
	name: 'JuryPanelPage',
	components: { PawPageNav, PawJuryItemCard },
	data() {
		return {
			activeTab: 'pending',
			reviewType: '',
			juryItems: []
		}
	},
	computed: {
		itemsWithState() {
			return this.juryItems.map((item) => ({
				...item,
				isFinished: item.status !== JURY_ITEM_STATUS.pending
			}))
		},
		visibleItems() {
			return this.itemsWithState.filter((item) => this.activeTab === 'finished' ? item.isFinished : !item.isFinished)
		},
		pendingCount() {
			return this.itemsWithState.filter((item) => !item.isFinished).length
		},
		finishedCount() {
			return this.itemsWithState.filter((item) => item.isFinished).length
		}
	},
	onLoad(options = {}) {
		this.reviewType = this.normalizeReviewType(options.reviewType || options.type || options.juryType)
		if (this.reviewType === 'rescue') {
			uni.redirectTo({ url: '/pages/yard/rescueReview' })
			return
		}
		if (options.tab === 'finished' || options.state === 'finished') this.activeTab = 'finished'
		this.loadJuryState()
	},
	onShow() {
		this.loadJuryState()
	},
	methods: {
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		selectTab(tab) {
			this.activeTab = tab
		},
		loadJuryState() {
			this.juryItems = getJuryItems({ reviewType: this.reviewType })
		},
		openDetail(item) {
			if (!item || !item.id) return
			const id = encodeURIComponent(item.id)
			const type = this.reviewType ? `&reviewType=${encodeURIComponent(this.reviewType)}` : ''
			uni.navigateTo({ url: `/pages/yard/juryDetail?itemId=${id}&id=${id}${type}` })
		},
		normalizeReviewType(value) {
			const type = value === undefined || value === null ? '' : String(value).trim().toLowerCase()
			return type === 'rescue' || type === 'adoption' ? type : ''
		},
		openIdentity(identity) {
			if (!identity) return
			openUserProfile({
				pawId: identity.pawId || identity.userId || identity.id,
				nickname: identity.nickname || identity.name,
				avatar: identity.avatar
			})
		}
	}
}
</script>

<style lang="less" scoped>
.jury-page {
	display: flex;
	width: 100%;
	height: 100vh;
	min-height: 0;
	flex-direction: column;
	background: #f7f7f7;
}

.jury-scroll {
	height: 0;
	min-height: 0;
	flex: 1 1 auto;
	box-sizing: border-box;
	padding: 0 12px 24px;
}

.jury-stats-shell {
	display: flex;
	flex: 0 0 50px;
	align-items: flex-start;
	justify-content: center;
	padding: 28px 12px 4px;
	box-sizing: border-box;
	background: #f7f7f7;
}

.jury-stats {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	gap: 24px;
}

.jury-stat {
	display: flex;
	width: 80px;
	min-height: 46px;
	flex: 0 0 80px;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	box-sizing: border-box;
	border-radius: 8px;
}

.jury-stat__count {
	color: #333;
	font-size: 20px;
	font-weight: 500;
	line-height: 28px;
}

.jury-stat:not(.jury-stat--active) .jury-stat__count,
.jury-stat:not(.jury-stat--active) .jury-stat__label {
	color: #999;
}

.jury-stat__label {
	display: flex;
	width: max-content;
	min-width: 40px;
	height: 16px;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	color: #333;
	font-size: 11px;
	line-height: 16px;
	white-space: nowrap;
}

.jury-stat__label--active {
	border-radius: 8px;
	background: #ffe60f;
	color: #000;
}

.jury-list {
	display: flex;
	margin-top: 11px;
	flex-direction: column;
	gap: 12px;
}

.jury-empty {
	display: flex;
	min-height: 160px;
	margin-top: 12px;
	align-items: center;
	justify-content: center;
	border-radius: 10px;
	background: #fff;
	color: #999;
	font-size: 14px;
}
</style>
