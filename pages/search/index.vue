<template>
	<view class="search-page" :class="'search-page--' + pageState">
		<!-- #ifndef MP-WEIXIN -->
		<image v-if="pageState && pageState !== 'empty'" class="h5-status-bar h5-search-top"
			src="/static/figma/search-top-full.png" mode="scaleToFill"></image>
		<image v-else class="h5-status-bar" src="/static/figma/status-bar-search.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<PawPageNav class="search-page-nav" background="#fff" fallback-url="/pages/index/index" :auto-back="false"
			@back="goBack" />

		<view class="search-row">
			<PawSearchBar v-model="keyword" placeholder="蓝金渐层" @search="onSearch" />
		</view>

		<view class="search-body">
			<template v-if="historyList.length && !hasSearched">
				<view class="history-head">
					<text class="history-title">历史搜索</text>
					<view v-if="!editMode" class="head-action" @click="enterEdit">
						<PawIcon class="search-history-delete-icon" name="navigation/delete-history" :size="19"
							label="删除搜索历史" />
					</view>
					<view v-else class="head-edit-actions">
						<text class="all-clear" @click="showDeleteAllDialog = true">全部删除</text>
						<text class="split">|</text>
						<text class="done" @click="finishEdit">完成</text>
					</view>
				</view>
				<view class="history-tags">
					<view class="tag-item" v-for="(item, i) in historyList" :key="item + i" @click="onHistoryTap(item)">
						<text>{{ item }}</text>
						<text v-if="editMode" class="tag-x" @click.stop="removeHistoryItem(i)">×</text>
					</view>
				</view>
			</template>

			<template v-else-if="hasSearchResult">
				<view class="search-result-shell">
					<SearchResultTabs v-model="activeTab" />
				</view>
			</template>

			<template v-else>
				<PawTabs class="tab-row tab-row--empty" v-model="activeTab" :items="tabs" variant="compact"
					indicator-size="small" />
				<view class="empty-wrap">
					<image class="empty-art" src="/static/figma/home/empty-search.png" mode="aspectFit"></image>
					<text class="empty-text">没有相关内容</text>
					<text class="empty-subtext">换个关键词试试呢</text>
				</view>
			</template>
		</view>

		<PawOverlay v-model="showDeleteAllDialog" placement="center" :close-on-mask="false">
			<view class="search-delete-dialog" @tap.stop>
				<view class="search-delete-dialog__title">删除全部搜索历史</view>
				<view class="search-delete-dialog__actions">
					<view class="search-delete-dialog__action search-delete-dialog__action--cancel"
						@tap.stop="cancelDeleteAll">
						取消</view>
					<view class="search-delete-dialog__action search-delete-dialog__action--confirm"
						@tap.stop="confirmDeleteAll">删除</view>
				</view>
			</view>
		</PawOverlay>
	</view>
</template>

<script>
import SearchResultTabs from '@/components/SearchResultTabs.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawSearchBar from '@/components/navigation/PawSearchBar.vue'
import PawTabs from '@/components/navigation/PawTabs.vue'
import PawOverlay from '@/components/overlay/PawOverlay.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { goBackSmart } from '@/utils/navBack.js'

const HISTORY_KEY = 'PAWHOME_SEARCH_HISTORY'
const DEMO_HISTORY = ['狸花猫', '545876656', '幸福小区', '年糕', '朝阳小区喂猫小院', '喂猫日记', '阿平的喂猫日记']

export default {
	components: {
		SearchResultTabs,
		PawPageNav,
		PawSearchBar,
		PawTabs,
		PawOverlay,
		PawIcon
	},
	data() {
		return {
			pageState: '',
			keyword: '',
			latestSearchKeyword: '',
			historyList: [],
			editMode: false,
			hasSearched: false,
			showDeleteAllDialog: false,
			activeTab: 'dynamic',
			tabs: [
				{ key: 'dynamic', label: '动态' },
				{ key: 'yard', label: '小院' },
				{ key: 'user', label: '用户' }
			]
		}
	},
	computed: {
		hasSearchResult() {
			const k = (this.latestSearchKeyword || '').trim()
			// 有关键词即展示结果区（当前为演示数据）；对接接口后仍以「有返回」为准即可
			return this.hasSearched && !!k
		}
	},
	onLoad(options = {}) {
		this.pageState = options.state || ''
		if (this.pageState === 'empty') {
			this.keyword = '蓝金渐层'
			this.latestSearchKeyword = ''
			this.historyList = []
			this.hasSearched = true
		}
		if (['dynamic', 'yard', 'user'].includes(this.pageState)) {
			this.keyword = '蓝金渐层'
			this.latestSearchKeyword = '蓝金渐层'
			this.hasSearched = true
			this.activeTab = this.pageState
		}
		if (this.pageState === 'deleting' || this.pageState === 'idle_delete') this.editMode = true
		if (options.popup === 'delete') {
			this.editMode = true
			this.showDeleteAllDialog = true
		}
	},
	onShow() {
		if (this.pageState !== 'empty') this.readHistory()
	},
	methods: {
		readHistory() {
			const list = uni.getStorageSync(HISTORY_KEY)
			if (Array.isArray(list)) {
				this.historyList = list.filter(Boolean)
				return
			}
			this.historyList = [...DEMO_HISTORY]
			uni.setStorageSync(HISTORY_KEY, this.historyList)
		},
		saveHistory() {
			uni.setStorageSync(HISTORY_KEY, this.historyList)
		},
		goBack() {
			uni.switchTab({
				url: '/pages/index/index',
				fail: () => goBackSmart({ fallbackUrl: '/pages/index/index' })
			})
		},
		onSearch() {
			const key = (this.keyword || '').trim()
			this.latestSearchKeyword = key
			if (!key) {
				this.hasSearched = false
				this.editMode = false
				return
			}
			this.hasSearched = true
			this.editMode = false
			const merged = [key, ...this.historyList.filter((x) => x !== key)].slice(0, 20)
			this.historyList = merged
			this.saveHistory()
		},
		enterEdit() {
			this.editMode = true
		},
		finishEdit() {
			this.editMode = false
		},
		removeHistoryItem(i) {
			this.historyList.splice(i, 1)
			this.saveHistory()
		},
		onHistoryTap(item) {
			if (this.editMode) return
			this.keyword = item
			this.onSearch()
		},
		confirmDeleteAll() {
			this.historyList = []
			this.editMode = false
			this.showDeleteAllDialog = false
			this.saveHistory()
		},
		cancelDeleteAll() {
			this.showDeleteAllDialog = false
		}
	}
}
</script>

<style scoped>
.search-page {
	height: 100vh;
	min-height: 100vh;
	background: #fff;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.h5-status-bar {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 40px;
	z-index: 1200;
	pointer-events: none;
}

.h5-search-top {
	height: 135px;
}

.search-body {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.search-result-shell {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.search-row {
	padding: 4px 15px 0;
}

.search-page-nav {
	flex-shrink: 0;
}

.history-head {
	margin-top: 10px;
	padding: 0 15px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.history-title {
	font-size: 15px;
	line-height: 20px;
	color: #333;
	font-weight: 400;
}

.head-action {
	width: 19px;
	height: 19px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.search-history-delete-icon {
	display: block;
}

.head-edit-actions {
	display: inline-flex;
	align-items: center;
	font-size: 13px;
	line-height: 20px;
	color: #8b8b8b;
}

.all-clear,
.done {
	color: #9d9d9d;
}

.split {
	margin: 0 9px;
	color: #c4c4c4;
}

.history-tags {
	padding: 15px 15px 0;
	display: flex;
	flex-wrap: wrap;
	gap: 10px 11px;
}

.tag-item {
	max-width: 320px;
	height: 30px;
	min-height: 30px;
	border-radius: 15px;
	border: 1px solid #e5e6e6;
	padding: 0 11px;
	display: inline-flex;
	align-items: center;
	box-sizing: border-box;
	background: #fff;
}

.tag-item text {
	font-size: 14px;
	line-height: 20px;
	color: #333;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.tag-x {
	margin-left: 8px;
	font-size: 14px !important;
	color: #b4b4b4 !important;
}

.tab-row {
	margin-top: 24rpx;
	padding: 0 24rpx;
	display: flex;
	align-items: center;
}

.tab-row--empty {
	margin-top: 22rpx;
}

.tab-item {
	margin-right: 48rpx;
	position: relative;
	padding-bottom: 12rpx;
}

.tab-item text {
	font-size: 30rpx;
	color: #9a9a9a;
	font-weight: 500;
}

.tab-item.active text {
	color: #222;
}

.tab-line {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 6rpx;
	border-radius: 4rpx;
	background: transparent;
}

.tab-item.active .tab-line {
	background: #f6dc2b;
}

.empty-wrap {
	flex: 1;
	min-height: 0;
	padding-top: 121px;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-sizing: border-box;
	color: #b6b6b6;
}

.empty-art {
	width: 170px;
	height: 110px;
}

.empty-text {
	margin-top: 15px;
	font-size: 14px;
	line-height: 20px;
	color: #777;
}

.empty-subtext {
	margin-top: 5px;
	font-size: 13px;
	line-height: 18px;
	color: #aaa;
}

.search-delete-dialog {
	width: 251px;
	height: 109px;
	overflow: hidden;
	box-sizing: border-box;
	border-radius: 10px;
	background: #fff;
}

.search-delete-dialog__title {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 65px;
	box-sizing: border-box;
	border-bottom: 1px solid #ececec;
	color: #333;
	font-size: 15px;
	font-weight: 700;
	line-height: 22px;
}

.search-delete-dialog__actions {
	display: flex;
	height: 44px;
}

.search-delete-dialog__action {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	color: #333;
	font-size: 15px;
	font-weight: 500;
	line-height: 22px;
}

.search-delete-dialog__action--cancel {
	color: #999;
	font-weight: 400;
}

.search-delete-dialog__action--confirm {
	border-left: 1px solid #ececec;
	color: #333;
}
</style>
