<template>
	<view class="page"
		:class="pageState === 'publish-entry' ? 'publish-mode' : (pageState === 'roster' || pageState === 'status' || pageState === 'managed' ? 'roster-mode' : 'long-mode')">
		<!-- #ifndef MP-WEIXIN -->
		<image v-if="pageState === 'publish-entry'" class="yard-cats-top-reference"
			src="/static/figma/yard-cats-top.png" mode="scaleToFill" />
		<!-- #endif -->
		<view v-if="pageState === 'roster' || pageState === 'status' || pageState === 'managed'" class="roster-wrap">
			<PawPetRoster :variant="pageState === 'managed' || pageState === 'status' ? 'status' : 'yard'"
				:managed="pageState === 'managed'" :yard-name="yardName" :yard-avatar="yard.avatar"
				:owner-paw-id="ownerPawId" @back="goBack" @add-pet="onAdd" @pet-click="openPetDetail"
				@owner-click="openPetOwner" />
		</view>
		<template v-else>
			<view v-if="pageState === 'publish-entry'" class="publish-nav"
				:style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="publish-owner-row">
					<view class="nav-side nav-left" @click.stop="goBack">
						<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
					</view>
					<image class="publish-owner-avatar" :src="yard.avatar" mode="aspectFill">
					</image>
					<text class="publish-owner-name">{{ yardName }}</text><text class="publish-owner-tag">小院</text>
				</view>
				<view class="publish-title-row"><text>小院猫咪</text>
					<view class="publish-add" @click="onAdd">添加</view>
				</view>
			</view>
			<view v-else class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="nav-row">
					<view class="nav-side nav-left" @click.stop="goBack">
						<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
					</view>
					<view class="nav-title-wrap">
						<text class="nav-yard-name">小院成员</text>
						<PawSearchBar class="yard-search" v-model="searchKeyword" placeholder="搜索宠物名字/品种等"
							@search="onSearch" />
					</view>
				</view>
			</view>
			<view v-if="pageState !== 'publish-entry'" class="category-tabs"><text
					class="category-tab category-tab--active">全部({{ totalPetCount }})</text><text
					class="category-tab">猫咪({{ catCount }})</text><text class="category-tab">狗狗({{ dogCount }})</text>
				<view class="category-sort"><text>智能排序</text><uni-icons type="down" color="#333333" :size="12" /></view>
				<uni-icons type="list" color="#333333" :size="20" />
			</view>

			<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
				<view class="scroll-inner">
					<view v-for="block in displayBlocks" :key="block.key" class="cat-card">
						<view class="cat-badge"
							:class="['cat-badge--' + block.key, { 'cat-badge--publish': pageState === 'publish-entry' }]">
							<text>{{ block.label }}</text>
						</view>
						<view class="cat-avatars">
							<view v-for="(cat, i) in block.cats" :key="cat.id" class="cat-avatar-item"
								@click.stop="openCatDetail(cat, block, i)">
								<image class="cat-avatar-img" :src="cat.avatar" mode="aspectFill" />
								<text class="cat-avatar-name">{{ cat.name }}</text>
							</view>
						</view>
						<text class="cat-count">{{ block.cats.length }}只</text>
					</view>
				</view>
			</scroll-view>

			<view v-if="pageState === 'publish-entry'" class="footer">
				<view class="done-btn" @click="onComplete"><text>完成创建</text></view>
			</view>
		</template>

		<!-- 猫咪详情 + 底部操作 -->
		<view v-if="showCatDetail" class="detail-mask" @click="closeCatDetail"></view>
		<view v-if="showCatDetail && selectedCat" class="detail-pop" @click.stop>
			<view class="pop-arrow"></view>
			<view class="pop-inner">
				<view class="pop-head">
					<view class="pop-head-left">
						<text class="pop-name">{{ selectedCat.name }}</text>
						<view class="pop-status-tag"><text>{{ selectedBlock.label }}</text></view>
					</view>
					<text class="pop-page">{{ catGlobalIndex }}/{{ catGlobalTotal }}</text>
				</view>
				<view class="pop-tags">
					<view v-for="(t, ti) in selectedCat.tags" :key="'tg-' + ti" class="pop-tag"><text>{{ t }}</text>
					</view>
				</view>
				<text class="pop-desc">{{ selectedCat.desc }}</text>
				<view class="pop-foot">
					<image class="pop-foot-avatar" :src="selectedCat.avatar" mode="aspectFill" />
					<view class="pop-foot-mid">
						<text class="pop-foot-yard" @click.stop="openYardOwner">{{ yardName }}</text>
						<YardTagPill @click.stop="openYardDetailPage" />
					</view>
					<text class="pop-foot-stat">已在小院获得猫粮{{ selectedCat.foodJin }}斤</text>
				</view>
			</view>
		</view>
		<view v-if="showCatDetail" class="detail-actions" @click.stop>
			<view class="action-half" @click="onEditCat">
				<uni-icons type="compose" :size="22" color="#333"></uni-icons>
				<text class="action-txt">修改信息</text>
			</view>
			<view class="action-divider"></view>
			<view class="action-half" @click="onDeleteCat">
				<uni-icons type="trash" :size="22" color="#333"></uni-icons>
				<text class="action-txt">删除</text>
			</view>
		</view>

		<!-- 添加宠物类型：统一选择底部弹层 -->
		<PawSelectionSheet v-model="showAddPetSheet" title="请选择要添加的宠物类型" :items="addPetOptions" :value="addPetKind"
			layout="cards" variant="pet-type" :show-close="true" confirm-text="添加进小院" @update:value="onAddPetKindChange"
			@confirm="onAddPetConfirm" />

		<!-- 完成创建：前往认证（图3） -->
		<view v-if="showCreateSheet" class="create-mask" @click="closeCreateSheet"></view>
		<view v-if="showCreateSheet" class="create-sheet" @click.stop>
			<view class="create-drag"></view>
			<text class="create-title">小院创建完成</text>
			<text class="create-desc">为保障小院信息真实有效，需完成小院认证后再正式发布内容。</text>
			<view class="create-btn" @click="goYardCertify"><text>前往认证</text></view>
			<view class="create-later" @click="closeCreateSheet"><text>稍后再说</text></view>
		</view>

		<!-- 删除宠物确认 -->
		<view v-if="showDeleteConfirm" class="del-overlay" @click="closeDeleteConfirm">
			<view class="del-panel" @click.stop>
				<text class="del-title">删除宠物</text>
				<view class="del-hline"></view>
				<view class="del-btns">
					<view class="del-btn del-btn--cancel" @click="closeDeleteConfirm"><text>取消</text></view>
					<view class="del-vline"></view>
					<view class="del-btn del-btn--confirm" @click="confirmDeletePet"><text>确认</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import YardTagPill from '@/components/YardTagPill.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import PawSearchBar from '@/components/navigation/PawSearchBar.vue'
import PawSelectionSheet from '@/components/overlay/PawSelectionSheet.vue'
import { getPawHomeYardMock } from '@/utils/yardMock.js'
export default {
	components: { YardTagPill, PawPetRoster, PawSearchBar, PawSelectionSheet },
	data() {
		const yard = getPawHomeYardMock()
		return {
			pageState: 'long-list',
			statusBarHeight: 20,
			menuRightWidth: 87,
			yardName: yard.name,
			yardId: yard.id,
			ownerPawId: yard.owner.pawId,
			yard,
			searchKeyword: '',
			blocks: yard.statusDefinitions.map((status) => ({
				key: status.key,
				label: status.label,
				cats: yard.pets.filter((pet) => pet.state === status.key).map((pet) => ({ ...pet }))
			})),
			showCatDetail: false,
			selectedCat: null,
			selectedBlock: null,
			catGlobalIndex: 1,
			catGlobalTotal: 1,
			showAddPetSheet: false,
			addPetKind: 'cat',
			showDeleteConfirm: false,
			showCreateSheet: false
		}
	},
	computed: {
		addPetOptions() {
			return [
				{ key: 'cat', label: '猫猫' },
				{ key: 'dog', label: '狗狗' }
			]
		},
		totalPetCount() {
			return this.blocks.reduce((total, block) => total + block.cats.length, 0)
		},
		catCount() {
			return this.blocks.reduce((total, block) => total + block.cats.filter((pet) => pet.species === 'cat').length, 0)
		},
		dogCount() {
			return this.blocks.reduce((total, block) => total + block.cats.filter((pet) => pet.species === 'dog').length, 0)
		},
		displayBlocks() {
			if (this.pageState === 'publish-entry') {
				return this.blocks.filter((block) => block.key !== 'cloud').map((block) => block.key === 'pending' ? { ...block, label: '待领养' } : block)
			}
			return this.blocks.map((block) => block.key === 'pending' ? { ...block, label: '待云养' } : block)
		}
	},
	onLoad(query = {}) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef H5
		this.statusBarHeight = 40
		// #endif
		this.pageState = ['publish-entry', 'roster', 'status', 'managed'].includes(query.state) ? query.state : 'long-list'
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) { }
		// #endif
		if (query && query.name) {
			const n = decodeURIComponent(query.name)
			if (n) this.yardName = n
		}
	},
	methods: {
		onSearch(value) {
			this.searchKeyword = String(value || '').trim()
		},
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		openPetDetail(pet) {
			const petId = pet && pet.id ? String(pet.id) : ''
			if (!petId) return
			const managed = this.pageState === 'managed'
			uni.navigateTo({
				url:
					'/pages/adoption/petDetail?state=' + (managed ? '36' : '35') + '&managed=' + (managed ? '1' : '0') + '&petId=' +
					encodeURIComponent(petId) +
					'&yardId=' +
					encodeURIComponent(this.yardId || '1')
			})
		},
		openPetOwner(owner) {
			if (!owner || !owner.pawId) return
			openUserProfile({
				pawId: owner.pawId,
				nickname: owner.name,
				avatar: owner.avatar
			})
		},
		openYardOwner() {
			openUserProfile({
				pawId: this.ownerPawId || 'yard-owner-demo',
				nickname: this.yardName,
				avatar: this.yard.owner.avatar
			})
		},
		openYardDetailPage() {
			openYardDetail({ yardId: this.yardId || '1', yardName: this.yardName })
		},
		onAdd() {
			this.addPetKind = 'cat'
			this.showAddPetSheet = true
		},
		onAddPetKindChange(value) {
			this.addPetKind = value === 'dog' ? 'dog' : 'cat'
		},
		closeAddPetSheet() {
			this.showAddPetSheet = false
		},
		onAddPetConfirm() {
			const kind = this.addPetKind === 'dog' ? 'dog' : 'cat'
			const q =
				'/pages/yard/addKitten?kind=' +
				kind +
				'&yardName=' +
				encodeURIComponent(this.yardName || '')
			this.closeAddPetSheet()
			uni.navigateTo({ url: q })
		},
		onComplete() {
			this.closeCatDetail()
			this.showCreateSheet = true
		},
		closeCreateSheet() {
			this.showCreateSheet = false
		},
		goYardCertify() {
			this.closeCreateSheet()
			uni.navigateTo({
				url: '/pages/yard/yardCertify?yardName=' + encodeURIComponent(this.yardName || '')
			})
		},
		openCatDetail(cat, block, index) {
			this.selectedCat = cat
			this.selectedBlock = block
			const flat = []
			for (const b of this.blocks) {
				for (const c of b.cats) flat.push(c.id)
			}
			this.catGlobalIndex = flat.indexOf(cat.id) + 1
			this.catGlobalTotal = flat.length || 1
			this.showCatDetail = true
		},
		closeCatDetail() {
			this.showCatDetail = false
			this.selectedCat = null
			this.selectedBlock = null
		},
		onEditCat() {
			uni.showToast({ title: '修改信息', icon: 'none' })
		},
		onDeleteCat() {
			this.showDeleteConfirm = true
		},
		closeDeleteConfirm() {
			this.showDeleteConfirm = false
		},
		confirmDeletePet() {
			const cat = this.selectedCat
			const blockKey = this.selectedBlock && this.selectedBlock.key
			if (!cat || !blockKey) {
				this.closeDeleteConfirm()
				return
			}
			this.blocks = this.blocks.map((b) => {
				if (b.key !== blockKey) return b
				return { ...b, cats: b.cats.filter((c) => c.id !== cat.id) }
			})
			this.closeDeleteConfirm()
			this.closeCatDetail()
			uni.showToast({ title: '已删除', icon: 'none' })
		}
	}
}
</script>

<style scoped>
.page {
	position: relative;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f6f8fa;
	box-sizing: border-box;
}

.nav-wrap {
	flex-shrink: 0;
	background: #f5f5f5;
}

.nav-row {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 8rpx;
	box-sizing: border-box;
}

.nav-side {
	min-width: 80rpx;
	display: flex;
	align-items: center;
}

.nav-left {
	padding: 8rpx 24rpx 8rpx 16rpx;
	justify-content: center;
}

.nav-back-icon {
	width: 20rpx;
	height: 36rpx;
}

.yard-cats-top-reference {
	position: absolute;
	left: 0;
	top: 0;
	width: 375px;
	height: 100px;
	z-index: 30;
	pointer-events: none
}

.roster-mode .nav-wrap,
.roster-mode .category-tabs,
.roster-mode .main-scroll {
	display: none !important;
}

.roster-wrap {
	width: 100%;
	min-height: 100vh;
}

.publish-nav {
	flex-shrink: 0;
	background: #f6f8fa;
}

.publish-owner-row {
	height: 52px;
	display: flex;
	align-items: center;
	padding: 0 12px 0 4px;
	box-sizing: border-box;
}

.publish-owner-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	margin-left: -4px;
}

.publish-owner-name {
	margin-left: 9px;
	font-size: 14px;
	color: #222;
}

.publish-owner-tag {
	margin-left: 6px;
	padding: 2px 6px;
	border-radius: 8px;
	background: #ffed53;
	font-size: 10px;
	color: #333;
}

.publish-title-row {
	height: 54px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 15px;
	box-sizing: border-box;
}

.publish-title-row>text,
.publish-title-row>.publish-add {
	position: relative;
	top: -4px
}

.publish-title-row>text {
	font-size: 22px;
	line-height: 28px;
	font-weight: 700;
	color: #222;
}

.publish-add {
	width: 50px;
	height: 30px;
	border-radius: 5px;
	background: #ffe000;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	color: #222;
}

.nav-title-wrap {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	column-gap: 18rpx;
	padding: 0 8rpx;
}

.nav-yard-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #111;
	line-height: 48rpx;
	max-width: 150rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.yard-search {
	flex: 1;
	min-width: 0
}

.category-tabs {
	display: flex;
	align-items: center;
	height: 64rpx;
	padding: 0 18rpx;
	background: #fff;
	font-size: 22rpx
}

.category-tab {
	padding: 12rpx 24rpx;
	border-radius: 8rpx;
	background: #f5f5f5
}

.category-sort {
	margin-left: auto;
	margin-right: 10rpx;
	display: flex;
	align-items: center;
	gap: 2rpx
}

.main-scroll {
	flex: 1;
	height: 0;
	width: 100%;
	box-sizing: border-box;
}

.scroll-inner {
	padding-top: 28rpx;
	padding-bottom: calc(24rpx + 160rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.head-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8rpx 24rpx 20rpx;
}

.page-title {
	font-size: 44rpx;
	font-weight: 700;
	color: #111;
	line-height: 56rpx;
}

.add-btn {
	padding: 10rpx 28rpx;
	border-radius: 999rpx;
	background: #ffe60f;
}

.add-btn text {
	font-size: 28rpx;
	font-weight: 500;
	color: #111;
	line-height: 40rpx;
}

.cat-card {
	position: relative;
	margin: 0 24rpx 28rpx;
	padding: 48rpx 20rpx 24rpx;
	background: #fff;
	border-radius: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	box-sizing: border-box;
}

.cat-badge {
	position: absolute;
	left: 50%;
	top: 0;
	transform: translate(-50%, -50%);
	padding: 8rpx 36rpx;
	border-radius: 999rpx;
}

.cat-badge text {
	font-size: 26rpx;
	font-weight: 500;
	line-height: 36rpx;
}

.cat-badge--pending {
	background: #dffb75;
}

.cat-badge--pending text {
	color: #111;
}

.cat-badge--adopted {
	background: #28b5e8;
}

.cat-badge--adopted text {
	color: #111;
}

.cat-badge--cloud {
	background: #ffe60f;
}

.cat-badge--cloud text {
	color: #111;
}

.cat-badge--adopted.cat-badge--publish {
	background: #c9f47b;
}

.cat-badge--missing {
	background: #8a8a8a;
}

.cat-badge--missing text {
	color: #fff;
}

.cat-badge--dead {
	background: #d8d8d8;
}

.cat-badge--dead text {
	color: #fff;
}

.cat-avatars {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	column-gap: 24rpx;
	row-gap: 20rpx;
	padding-bottom: 8rpx;
}

.cat-avatar-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100rpx;
}

.cat-avatar-img {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background: #eee;
}

.cat-avatar-name {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #333;
	line-height: 32rpx;
	text-align: center;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cat-count {
	display: block;
	text-align: right;
	font-size: 26rpx;
	color: #a8a8a8;
	line-height: 36rpx;
	margin-top: 8rpx;
}

.footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	height: 93px;
	padding: 9px 12px 40px;
	background: #fff;
	box-sizing: border-box;
}

.done-btn {
	width: 210px;
	margin: 0 auto;
	height: 44px;
	border-radius: 48rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}

.publish-mode .cat-card {
	min-height: 154px;
}

.publish-mode .cat-card:first-child {
	min-height: 172px;
}

.publish-mode .scroll-inner {
	padding-top: 6px;
}

.publish-mode .cat-card {
	margin-bottom: 32px;
	padding-top: 33px;
}

.publish-mode .cat-card:nth-child(2) {
	margin-bottom: 34px;
}

.publish-mode .cat-avatars {
	padding-left: 11px;
	padding-right: 15px;
	justify-content: flex-start;
	column-gap: 21.25px;
	box-sizing: border-box
}

.publish-mode .cat-avatar-item {
	width: 44px
}

.publish-mode .cat-badge {
	padding-top: 2px;
	padding-bottom: 2px;
}

.publish-mode .cat-count {
	position: absolute;
	right: 12px;
	bottom: 14px;
	margin-top: 0;
}

.long-mode .cat-card {
	min-height: 184px;
}

.long-mode .cat-card:first-child {
	min-height: 200px;
}

.done-btn text {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}

.detail-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 200;
	background: rgba(0, 0, 0, 0.45);
}

.detail-pop {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: calc(128rpx + env(safe-area-inset-bottom));
	z-index: 210;
}

.pop-arrow {
	width: 0;
	height: 0;
	margin-left: auto;
	margin-right: auto;
	margin-bottom: -2rpx;
	border-left: 18rpx solid transparent;
	border-right: 18rpx solid transparent;
	border-bottom: 18rpx solid #fff;
}

.pop-inner {
	background: #fff;
	border-radius: 24rpx;
	padding: 28rpx 24rpx 24rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
	box-sizing: border-box;
}

.pop-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.pop-head-left {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
	flex: 1;
	min-width: 0;
}

.pop-name {
	font-size: 40rpx;
	font-weight: 700;
	color: #111;
	line-height: 52rpx;
}

.pop-status-tag {
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	background: #ffe60f;
	flex-shrink: 0;
}

.pop-status-tag text {
	font-size: 22rpx;
	font-weight: 500;
	color: #111;
	line-height: 30rpx;
}

.pop-page {
	flex-shrink: 0;
	font-size: 24rpx;
	color: #b0b0b0;
	line-height: 32rpx;
}

.pop-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.pop-tag {
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: #e8f5d0;
}

.pop-tag text {
	font-size: 24rpx;
	color: #2d5a1e;
	line-height: 34rpx;
}

.pop-desc {
	display: block;
	font-size: 28rpx;
	color: #444;
	line-height: 44rpx;
	margin-bottom: 20rpx;
}

.pop-foot {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding-top: 8rpx;
	border-top: 1rpx solid #f0f0f0;
}

.pop-foot-avatar {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	flex-shrink: 0;
	background: #eee;
}

.pop-foot-mid {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8rpx;
}

.pop-foot-yard {
	font-size: 28rpx;
	font-weight: 500;
	color: #111;
	line-height: 40rpx;
}

.pop-foot-stat {
	flex-shrink: 0;
	max-width: 46%;
	font-size: 22rpx;
	color: #a8a8a8;
	line-height: 30rpx;
	text-align: right;
}

.detail-actions {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 220;
	display: flex;
	align-items: stretch;
	min-height: 112rpx;
	padding-bottom: env(safe-area-inset-bottom);
	background: linear-gradient(180deg, #ffffff 0%, #f6fbe8 100%);
	border-radius: 24rpx 24rpx 0 0;
	box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);
	box-sizing: border-box;
}

.action-half {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	column-gap: 12rpx;
	padding: 24rpx 0;
}

.action-divider {
	width: 1rpx;
	background: #e8e8e8;
	margin: 24rpx 0;
	flex-shrink: 0;
}

.action-txt {
	font-size: 30rpx;
	color: #222;
	line-height: 42rpx;
}

.create-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 250;
	background: rgba(0, 0, 0, 0.45);
}

.create-sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 260;
	background: #fff;
	border-radius: 28rpx 28rpx 0 0;
	padding: 16rpx 32rpx 32rpx;
	padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.create-drag {
	width: 64rpx;
	height: 8rpx;
	border-radius: 4rpx;
	background: #e8e8e8;
	margin: 0 auto 20rpx;
}

.create-title {
	display: block;
	text-align: center;
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
	margin-bottom: 16rpx;
}

.create-desc {
	display: block;
	text-align: center;
	font-size: 28rpx;
	color: #888;
	line-height: 42rpx;
	margin-bottom: 32rpx;
	padding: 0 8rpx;
}

.create-btn {
	height: 96rpx;
	border-radius: 48rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;
}

.create-btn text {
	font-size: 32rpx;
	font-weight: 700;
	color: #111;
	line-height: 44rpx;
}

.create-later {
	padding: 16rpx 0;
	text-align: center;
}

.create-later text {
	font-size: 28rpx;
	color: #999;
	line-height: 40rpx;
}

.del-overlay {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 270;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	box-sizing: border-box;
}

.del-panel {
	width: 100%;
	max-width: 560rpx;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}

.del-title {
	display: block;
	text-align: center;
	padding: 48rpx 40rpx 40rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #222;
	line-height: 48rpx;
}

.del-hline {
	height: 1rpx;
	background: #e5e5e5;
}

.del-btns {
	display: flex;
	align-items: stretch;
	min-height: 100rpx;
}

.del-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.del-btn text {
	font-size: 32rpx;
	line-height: 44rpx;
}

.del-btn--cancel text {
	color: #8e8e93;
	font-weight: 400;
}

.del-btn--confirm text {
	color: #ff3b30;
	font-weight: 500;
}

.del-vline {
	width: 1rpx;
	background: #e5e5e5;
	flex-shrink: 0;
}
</style>
