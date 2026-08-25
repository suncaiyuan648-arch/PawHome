<template>
	<view class="result-wrap">
		<view class="tab-row">
			<view
				v-for="tab in tabs"
				:key="tab.key"
				class="tab-item"
				:class="{ active: modelValue === tab.key }"
				@click="$emit('update:modelValue', tab.key)"
			>
				<text>{{ tab.label }}</text>
				<view class="tab-line"></view>
			</view>
		</view>

		<template v-if="modelValue === 'dynamic'">
			<scroll-view class="pane-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view class="dynamic-list">
					<view class="dynamic-column" v-for="(column, columnIndex) in dynamicColumns" :key="'dc-' + columnIndex">
					<view class="dynamic-card" :class="{ 'single-line-card': entry.item.title.length < 12 }" v-for="entry in column" :key="'d-' + entry.index">
						<view class="cover-wrap">
							<image class="feed-cover" :src="entry.item.cover" mode="aspectFill"></image>
							<view v-if="!entry.item.embeddedLocation" class="loc-pill">
								<uni-icons type="location" color="#ffffff" :size="10"></uni-icons>
								<text class="loc-pill-text">{{ entry.item.distance }} {{ entry.item.district }}</text>
							</view>
						</view>
						<view class="feed-title">{{ entry.item.title }}</view>
						<view class="feed-foot">
							<view class="feed-user" @click.stop="openDynamicAuthor(entry.item)">
								<image class="feed-avatar" :src="entry.item.avatar" mode="aspectFill"></image>
								<text class="feed-name">{{ entry.item.name }}</text>
							</view>
							<view class="feed-like" @click.stop="toggleDynamicLike(entry.index)">
								<uni-icons :type="entry.item.liked ? 'hand-up-filled' : 'hand-up'" :size="14" :color="entry.item.liked ? '#ff2741' : '#999999'"></uni-icons>
								<text>{{ entry.item.likes }}</text>
							</view>
						</view>
					</view>
					</view>
				</view>
			</scroll-view>
		</template>

		<template v-else-if="modelValue === 'yard'">
			<scroll-view class="pane-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view class="yard-list">
					<view class="yard-card" v-for="(yard, i) in yardList" :key="'y-' + i">
						<view class="yard-top" @click.stop="openYardCard(yard)">
							<image class="yard-avatar" :src="yard.avatar" mode="aspectFill"></image>
							<view class="yard-mid">
								<view class="yard-name-row">
									<text class="yard-name">{{ yard.name }}</text>
									<text v-if="yard.verified" class="yard-verified">已实名</text>
								</view>
								<view v-if="yard.variant === 'badges'" class="yard-badges">
									<view class="yard-badge" v-for="(b, bi) in yard.badges" :key="'b-' + i + '-' + bi">
										<text>{{ b }}</text>
									</view>
								</view>
								<view v-else class="yard-org-row">
									<uni-icons type="auth-filled" color="#1976d2" :size="14"></uni-icons>
									<text class="yard-org-name">{{ yard.orgName }}</text>
								</view>
							</view>
							<text class="yard-distance">{{ yard.distance }}</text>
						</view>
						<text class="yard-desc">{{ yard.desc }}</text>
						<scroll-view class="yard-gallery" scroll-x :show-scrollbar="false">
							<view class="gallery-row">
								<view class="gallery-item" v-for="(g, n) in yard.gallery" :key="'g-' + i + '-' + n">
									<image :src="g.img" mode="aspectFill"></image>
									<text>{{ g.caption }}</text>
								</view>
							</view>
						</scroll-view>
					</view>
				</view>
			</scroll-view>
		</template>

		<template v-else>
			<scroll-view class="pane-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view class="user-list">
					<view class="user-row" v-for="(u, i) in userList" :key="'u-' + i">
						<image class="user-avatar" :src="u.avatar" mode="aspectFill" @click.stop="openUserRow(u)"></image>
						<view class="user-main" @click.stop="openUserRow(u)">
							<text class="user-name">{{ u.name }}</text>
							<text class="user-meta">粉丝 {{ u.fans }}</text>
							<text class="user-meta">逢猫号: {{ u.pawId }}</text>
						</view>
						<view class="follow-btn"><text>关注</text></view>
					</view>
				</view>
			</scroll-view>
		</template>
	</view>
</template>

<script>
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'

export default {
	name: 'SearchResultTabs',
	props: {
		modelValue: {
			type: String,
			default: 'dynamic'
		}
	},
	data() {
		const cat1 = '/static/figma/home/feed-cat.jpg'
		const cat2 = '/static/figma/home/feed-food.png'
		const av = '/static/figma/home/feed-avatar.png'
		return {
			tabs: [
				{ key: 'dynamic', label: '动态' },
				{ key: 'yard', label: '小院' },
				{ key: 'user', label: '用户' }
			],
			dynamicList: [
				{ cover: '/static/figma/search/dynamic-left-1.png', embeddedLocation: true, title: '小猫吃的好开心', avatar: av, name: '朝阳小区猫猫队', pawId: 'search-feed-1', likes: 37, liked: false, distance: '3.2km', district: '金水区' },
				{ cover: '/static/figma/search/dynamic-right-1.png', embeddedLocation: true, title: '小猫吃的好开心呢呢呢呢呢呢呢啊啊啊啊啊啊啊啊啊啊', avatar: av, name: '朝阳小区猫猫队', pawId: 'search-feed-2', likes: 32, liked: true, distance: '3.2km', district: '金水区' },
				{ cover: '/static/figma/search/dynamic-left-2.png', embeddedLocation: true, title: '小猫吃的好开心', avatar: av, name: '朝阳小区猫猫队', pawId: 'search-feed-3', likes: 37, liked: false, distance: '3.2km', district: '金水区' },
				{ cover: '/static/figma/search/dynamic-right-2.png', embeddedLocation: true, title: '小猫吃的好开心', avatar: av, name: '朝阳小区猫猫队', pawId: 'search-feed-4', likes: 37, liked: false, distance: '3.2km', district: '金水区' }
			],
			yardList: [
				{
					yardId: '1',
					avatar: '/static/figma/search/yard-avatar-exact.png',
					name: '我就是要喂猫',
					verified: true,
					variant: 'badges',
					badges: ['剩6只/共32只', '已成立2个月', '入驻4人'],
					distance: '3.2km 金水区',
					desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。',
					gallery: [
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' }
					]
				},
				{
					yardId: '2',
					avatar: '/static/figma/search/yard-avatar-exact.png',
					name: '我就是要喂猫',
					verified: true,
					variant: 'org',
					orgName: '合肥市希望流浪动物基地',
					distance: '3.2km 金水区',
					desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。',
					gallery: [
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
						{ img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' }
					]
				}
			],
			userList: Array.from({ length: 5 }).map((_, idx) => ({
				avatar: '/static/figma/search-user-avatar.png',
				name: 'Q',
				fans: 315,
				pawId: '23456789'
			}))
		}
	},
	computed: {
		dynamicColumns() {
			return [0, 1].map(columnIndex => this.dynamicList
				.map((item, index) => ({ item, index }))
				.filter(entry => entry.index % 2 === columnIndex))
		}
	},
	methods: {
		toggleDynamicLike(i) {
			const item = this.dynamicList[i]
			if (!item) return
			if (item.liked) {
				item.liked = false
				item.likes = Math.max(0, item.likes - 1)
			} else {
				item.liked = true
				item.likes += 1
			}
		},
		openDynamicAuthor(item) {
			openUserProfile({
				pawId: item.pawId || 'search-author',
				nickname: item.name,
				avatar: item.avatar
			})
		},
		openYardCard(yard) {
			openYardDetail({ yardId: yard.yardId || '1', yardName: yard.name })
		},
		openUserRow(u) {
			openUserProfile({
				pawId: u.pawId,
				nickname: u.name,
				avatar: u.avatar
			})
		}
	}
}
</script>

<style scoped>
.result-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.tab-row { padding: 8rpx 22rpx 0; display: flex; align-items: center; background: #fff; }
.tab-item { margin-right: 48rpx; position: relative; padding-bottom: 12rpx; }
.tab-item text { font-size: 30rpx; color: #a3a3a3; font-weight: 500; }
.tab-item.active text { color: #232323; }
.tab-line { position: absolute; left: 0; right: 0; bottom: 0; height: 6rpx; border-radius: 4rpx; background: transparent; }
.tab-item.active .tab-line { background: #f6dc2b; }
.pane-scroll {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}
.dynamic-list { width: 100%; max-width: 100%; padding: 9px 5px 10px; box-sizing: border-box; display:flex; gap:4px; }
.dynamic-column{width:180px;min-width:0}.dynamic-column:last-child{width:181px}
.dynamic-card { width: 100%; display: block; background: #fff; border-radius: 4px; margin: 0 0 4px; overflow: hidden; }
.cover-wrap { position: relative; }
.feed-cover { width: 100%; height: 240px; display: block; }
.loc-pill { position: absolute; right: 8rpx; bottom: 8rpx; height: 30rpx; border-radius: 15rpx; padding: 0 8rpx; background: rgba(0, 0, 0, .45); display: inline-flex; align-items: center; }
.loc-pill-text { margin-left: 3rpx; font-size: 20rpx; color: #fff; line-height: 1; }
.feed-title { margin: 8px 10px 2px; font-size: 14px; font-weight: 500; color: #333; line-height: 19px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.single-line-card .feed-title{margin-top:8px}.feed-foot { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px 9px; }
.dynamic-card:not(.single-line-card) .feed-title{height:38px}
.dynamic-card:not(.single-line-card) .feed-foot{padding-bottom:10px}
.feed-user { display: inline-flex; align-items: center; min-width: 0; }
.feed-avatar { width: 30rpx; height: 30rpx; border-radius: 50%; }
.feed-name { margin-left: 6rpx; font-size: 22rpx; color: #616161; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-like { display: inline-flex; align-items: center; color: #686868; }
.feed-like text { font-size: 24rpx; margin-left: 4rpx; font-weight: 500; }
.yard-list { padding: 8px 13px 20px; background:#fafafa; }
.yard-card { background: #fff; border-radius: 8px; padding: 14px 13px; margin-bottom: 8px; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04); }
.yard-top { position: relative; display: flex; align-items: flex-start; }
.yard-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
.yard-mid { flex: 1; min-width: 0; margin-left: 20rpx; padding-right: 0; }
.yard-name-row { display: flex; align-items: center; gap: 12rpx; flex-wrap: wrap; }
.yard-name { font-size: 30rpx; font-weight: 600; color: #111; line-height: 42rpx; }
.yard-verified { font-size: 22rpx; color: #ff6b00; line-height: 30rpx; }
.yard-distance { position:absolute;right:0;top:0;font-size: 22rpx; color: #999; line-height: 32rpx; max-width: 160rpx; text-align: right; }
.yard-badges { display: flex; flex-wrap: nowrap; gap: 5px; margin-top: 8px; }
.yard-badge { padding: 3px 5px; border-radius: 4px; background: #fff8e6; white-space:nowrap; }
.yard-badge text { font-size: 22rpx; color: #e65100; line-height: 30rpx; font-weight: 500; }
.yard-org-row { display: flex; align-items: center; margin-top: 16rpx; gap: 8rpx; }
.yard-org-name { font-size: 26rpx; color: #555; line-height: 36rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yard-desc { display: block; margin-top: 14rpx; font-size: 26rpx; color: #666; line-height: 38rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yard-gallery { margin-top: 8px; white-space: nowrap; }
.yard-card:first-child .yard-top,.yard-card:first-child .yard-desc{position:relative;top:4px}
.yard-card:nth-child(2) .yard-desc{position:relative;top:3px}
.yard-card:nth-child(2) .yard-gallery{margin-top:12px}
.gallery-row { display: inline-flex; }
.gallery-item { width: 96px; margin-right: 6px; }
.gallery-item image { width: 96px; height: 96px; border-radius: 7px; display: block; }
.gallery-item text { margin-top: 4px; display: block; font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-list { padding: 5px 18px 8px 16px; }
.user-row { min-height: 86px; display: flex; align-items: center; }
.user-avatar { width: 42px; height: 42px; border-radius: 50%; }
.user-main { margin-left: 9px; flex: 1; min-width: 0; }
.user-name { display: block; font-size: 12px; color: #333; line-height: 17px; }
.user-meta { display: block; margin-top: 1px; font-size: 12px; line-height:17px; color: #767676; }
.follow-btn { width: 49px; height: 24px; border-radius: 14px; background: #fff071; display: flex; align-items: center; justify-content: center; }
.follow-btn text { font-size: 13px; color: #333; font-weight: 500; }
</style>
