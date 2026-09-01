<template>
	<view class="result-wrap">
			<PawTabs
				class="search-result-tabs"
				:model-value="modelValue"
				:items="tabs"
				variant="search"
				indicator-size="small"
				@update:model-value="$emit('update:modelValue', $event)"
				@change="$emit('change', $event)"
			/>

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
								<PawAvatar class="feed-avatar" :src="entry.item.avatar" fallback="/static/user.png" size="17px" />
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
							<PawAvatar class="yard-avatar" :src="yard.avatar" fallback="/static/user.png" :size="50" :clickable="true" @click.stop="openYardCard(yard)" />
							<view class="yard-mid">
								<view class="yard-name-row">
									<text class="yard-name">{{ yard.name }}</text>
									<PawVerifiedBadge v-if="yard.verified" />
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
						<PawAvatar class="user-avatar" :src="u.avatar" fallback="/static/user.png" :size="42" :clickable="true" @click.stop="openUserRow(u)" />
						<view class="user-main" @click.stop="openUserRow(u)">
							<text class="user-name">{{ u.name }}</text>
							<view class="user-meta-row">
								<text class="user-meta-label">粉丝</text>
								<text class="user-meta-value">{{ u.fans }}</text>
							</view>
							<view class="user-meta-row">
								<text class="user-meta-label">{{ u.pawLabel }}</text>
								<text v-if="u.pawId" class="user-meta-value">{{ u.pawId }}</text>
							</view>
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
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawVerifiedBadge from '@/components/identity/PawVerifiedBadge.vue'
import PawTabs from '@/components/navigation/PawTabs.vue'

export default {
	name: 'SearchResultTabs',
	components: { PawAvatar, PawVerifiedBadge, PawTabs },
	emits: ['update:modelValue', 'change'],
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
				pawLabel: idx === 0 ? '小红书号：' : '逢猫号：',
				pawId: idx === 0 ? '' : '23456789'
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
.search-result-tabs { width: 100%; padding: 10px 0 6px 15px; box-sizing: border-box; background: #fff; }
.pane-scroll { flex: 1; min-height: 0; width: 100%; box-sizing: border-box; background: #fafafa; }
.dynamic-list { width: 100%; max-width: 100%; padding: 5px 5px 10px; box-sizing: border-box; display: flex; gap: 5px; background: #fafafa; }
.dynamic-column { flex: 0 0 180px; width: 180px; min-width: 0; }
.dynamic-card { width: 100%; display: block; background: #fff; border-radius: 4px; margin: 0 0 4px; overflow: hidden; }
.cover-wrap { position: relative; }
.feed-cover { width: 100%; height: 240px; display: block; }
.loc-pill { position: absolute; right: 8rpx; bottom: 8rpx; height: 30rpx; border-radius: 15rpx; padding: 0 8rpx; background: rgba(0, 0, 0, .45); display: inline-flex; align-items: center; }
.loc-pill-text { margin-left: 3rpx; font-size: 20rpx; color: #fff; line-height: 1; }
.feed-title { margin: 8px 9px 2px; font-size: 13px; font-weight: 500; color: #333; line-height: 19px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.single-line-card .feed-title { -webkit-line-clamp: 1; }
.feed-foot { display: flex; align-items: center; justify-content: space-between; padding: 7px 9px 6px; }
.feed-user { display: inline-flex; align-items: center; min-width: 0; }
.feed-avatar { width: 17px; height: 17px; border-radius: 50%; }
.feed-name { margin-left: 4px; font-size: 11px; color: #616161; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-like { display: inline-flex; align-items: center; color: #686868; }
.feed-like text { font-size: 13px; margin-left: 4px; font-weight: 500; }
.yard-list { padding: 6px 13px 20px; background: #fafafa; }
.yard-card { background: #fff; border-radius: 7px; padding: 14px 12px; margin-bottom: 8px; box-shadow: none; }
.yard-top { position: relative; display: flex; align-items: flex-start; }
.yard-avatar { width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0; }
.yard-mid { flex: 1; min-width: 0; margin-left: -1px; padding-right: 0; }
.yard-name-row { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.yard-name { font-size: 14px; font-weight: 700; color: #333; line-height: 20px; }
.yard-distance { position: absolute; right: 0; top: 0; font-size: 12px; color: #999; line-height: 17px; max-width: 160px; text-align: right; }
.yard-badges { display: flex; flex-wrap: nowrap; gap: 7px; margin-top: 8px; }
.yard-badge { height: 16px; padding: 2px 5px; border-radius: 4px; background: #fefada; box-sizing: border-box; white-space: nowrap; }
.yard-badge text { font-size: 11px; color: #e65100; line-height: 12px; font-weight: 500; }
.yard-org-row { display: flex; align-items: center; margin-top: 8px; gap: 4px; }
.yard-org-name { font-size: 12px; color: #555; line-height: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yard-desc { display: block; margin-top: 14px; font-size: 12px; color: #a1a1a1; line-height: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yard-gallery { margin-top: 8px; white-space: nowrap; }
.gallery-row { display: inline-flex; }
.gallery-item { width: 97px; margin-right: 5px; }
.gallery-item image { width: 97px; height: 97px; border-radius: 7px; display: block; }
.gallery-item text { margin-top: 4px; display: block; font-size: 11px; line-height: 16px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-list { padding: 0; background: #fff; }
.user-row { width: 100%; height: 86px; min-height: 86px; display: flex; align-items: flex-start; padding: 14px 18px 0 15px; box-sizing: border-box; background: #fff; }
.user-avatar { width: 45px; height: 45px; margin-top: 7px; border-radius: 50%; }
.user-main { margin-left: 8px; flex: 1; min-width: 0; }
.user-name { display: block; font-size: 12px; color: #333; line-height: 17px; }
.user-meta-row { display: flex; align-items: center; gap: 4px; height: 17px; margin-top: 1px; font-size: 12px; line-height: 17px; color: #696969; }
.user-meta-label, .user-meta-value { font-size: 12px; line-height: 17px; color: #696969; }
.follow-btn { width: 49px; height: 23px; margin-top: 18px; border-radius: 12px; background: #fcf276; display: flex; align-items: center; justify-content: center; }
.follow-btn text { font-size: 12px; color: #333; font-weight: 500; }
</style>
