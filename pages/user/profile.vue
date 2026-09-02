<template>
	<view class="profile-page">
		<!-- 头图独立在 scroll-view 外，避免小程序 enhanced 合成导致列表内容透叠到背景上 -->
		<view class="hero" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="hero-bg-stack">
				<image class="hero-photo" :src="heroBgSrc" mode="aspectFill" @error="onHeroImgError"></image>
				<view class="hero-inset-shadow"></view>
				<view class="hero-gradient"></view>
			</view>

			<view class="hero-inner">
				<view class="hero-nav">
					<view class="nav-back-plain" :style="navAlignStyle" @click.stop="goBack">
						<image class="nav-back-img" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
					</view>
				</view>

				<view class="profile-block">
					<view class="profile-top-row">
						<view class="avatar-col">
							<view v-if="displayAvatar" class="avatar-ring">
								<image class="avatar-img" :src="displayAvatar" mode="aspectFill"></image>
							</view>
							<view v-else class="avatar-placeholder">
								<text class="avatar-placeholder-text">逢猫</text>
							</view>
						</view>
						<view class="meta-col">
							<view class="name-more-row">
								<view class="name-line">
									<text class="nickname">{{ displayNickname }}</text>
									<LevelCapsule level="1" />
								</view>
								<view class="profile-more-wrap" :style="navTrailingInsetStyle">
									<view class="nav-more-trigger" @click.stop="openMoreActionSheet">
										<text class="nav-more-dots">···</text>
									</view>
								</view>
							</view>
							<text class="paw-line">逢猫号:{{ pawId }}</text>
							<text class="active-line">{{ lastActiveText }}</text>
						</view>
					</view>
					<view class="profile-under-avatar">
						<view v-if="verified || profileTags.length" class="profile-tags-row">
							<PawVerifiedBadge v-if="verified" />
							<view v-for="(t, i) in profileTags" :key="'pt-' + i" class="profile-oval-tag">
								<text class="profile-oval-tag-text">{{ t }}</text>
							</view>
						</view>
						<text class="bio-line">{{ bio }}</text>
					</view>
				</view>

				<view class="stats-follow">
					<view class="stats-cols">
						<view class="stat-item stat-item--tap" @click.stop="goFollowFansPage('follow')">
							<text class="stat-num">{{ stats.follow }}</text>
							<text class="stat-label">关注</text>
						</view>
						<view class="stat-item stat-item--tap" @click.stop="goFollowFansPage('fans')">
							<text class="stat-num">{{ stats.fans }}</text>
							<text class="stat-label">粉丝</text>
						</view>
						<view class="stat-item">
							<text class="stat-num">{{ stats.likes }}</text>
							<text class="stat-label">获赞</text>
						</view>
						<view class="stat-item stat-item--donate" @click.stop="openDonateSummary">
							<text class="stat-num">{{ stats.donate }}</text>
							<text class="stat-label">投粮</text>
						</view>
					</view>
					<view class="follow-pill" :class="{ 'follow-pill--followed': followed }" @click.stop="onFollowTap">
						<text class="follow-pill-text">{{ followed ? '已关注' : '关注' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- Tab 固定在头图下方，仅下方列表滚动 -->
		<view v-if="!profileTimelineMode" class="tab-strip">
			<scroll-view class="tab-scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
				<view class="tab-row">
					<view v-for="tab in profileTabs" :key="tab.key" class="tab-item"
						:class="{ 'tab-item--active': activeTab === tab.key }" @click="activeTab = tab.key">
						<view class="tab-item-inner">
							<text class="tab-label">{{ tab.label }}</text>
							<text v-if="tab.count != null" class="tab-count">{{ tab.count }}</text>
						</view>
						<view v-if="activeTab === tab.key" class="tab-underline"></view>
					</view>
				</view>
			</scroll-view>
		</view>

		<scroll-view v-if="!profileTimelineMode" class="body-scroll" scroll-y :show-scrollbar="false" :bounces="false">
			<view class="panel-wrap">
				<view v-if="activeTab === 'review'" class="review-panel">
					<view class="review-filters">
						<view class="review-filter review-filter--active"><text>全部</text></view>
						<view class="review-filter"><text>好评</text></view>
					</view>
					<view v-for="item in reviewList" :key="item.id" class="review-row">
						<image class="review-avatar" :src="item.avatar" mode="aspectFill"></image>
						<view class="review-main">
							<view class="review-name-line"><text class="review-name">{{ item.name }}</text>
								<LevelCapsule level="1" />
							</view>
							<text class="review-copy">{{ item.copy }}</text>
							<text class="review-meta">{{ item.time }}　{{ item.region }}　回复</text>
						</view>
						<view class="review-like">
							<PawLikeIcon :liked="true" /><text>{{ item.likes }}</text>
						</view>
					</view>
				</view>
				<view v-if="activeTab === 'dynamic' && feedList.length === 0" class="empty-state">
					<image class="empty-illu" src="/static/me/browsing-empty.png" mode="widthFix"></image>
					<text class="empty-text">暂无动态</text>
				</view>

				<view v-else-if="activeTab === 'dynamic'" class="masonry">
					<view v-for="(item, idx) in feedList" :key="'p-' + idx" class="feed-card"
						@click="onFeedCardTap(item)">
						<view class="feed-img-wrap">
							<image class="feed-img" :class="{ 'feed-img--tall': idx % 2 === 0 }" :src="item.cover"
								mode="aspectFill"></image>
							<view class="loc-pill">
								<uni-icons type="location" color="#f6f8fa" :size="10"></uni-icons>
								<text class="loc-text">{{ item.distance }}</text>
								<text class="loc-text">{{ item.district }}</text>
							</view>
						</view>
						<text class="feed-title">{{ item.title }}</text>
						<view class="feed-foot">
							<view class="feed-foot-left">
								<image class="feed-foot-av" :src="item.userAvatar" mode="aspectFill"></image>
								<text class="feed-foot-name">{{ item.userName }}</text>
							</view>
							<view class="feed-foot-like" @click.stop="toggleProfileFeedLike(idx)">
								<PawLikeIcon :liked="item.liked" />
								<text class="feed-like-num">{{ item.likes }}</text>
							</view>
						</view>
					</view>
				</view>

				<view v-else-if="activeTab === 'adopt'" class="adopt-list">
					<view v-for="(row, ai) in adoptList" :key="'ad-' + ai" class="adopt-card">
						<view class="adopt-head">
							<view class="adopt-head-left">
								<image class="adopt-av" :src="row.userAvatar" mode="aspectFill"></image>
								<text class="adopt-name">{{ row.userName }}</text>
								<YardTagPill class="yard-tag-pill--ml" />
							</view>
							<view class="adopt-status">
								<view class="adopt-status-dot"></view>
								<text class="adopt-status-txt">{{ row.status }}</text>
							</view>
						</view>
						<scroll-view class="adopt-gallery-scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
							<view class="adopt-gallery-row">
								<view v-for="(c, ci) in row.cats" :key="ci" class="adopt-cat-cell">
									<image class="adopt-cat-img" :src="c.img" mode="aspectFill"></image>
									<text class="adopt-cat-name">{{ c.name }}</text>
								</view>
							</view>
						</scroll-view>
					</view>
				</view>

				<view v-else-if="activeTab === 'donate'" class="donate-list">
					<view v-for="(row, di) in donateList" :key="'dn-' + di" class="donate-card">
						<image class="donate-av" :src="row.userAvatar" mode="aspectFill"></image>
						<view class="donate-mid">
							<view class="donate-title-row">
								<text class="donate-name">{{ row.userName }}</text>
								<YardTagPill />
							</view>
							<text class="donate-action">{{ row.actionText }}</text>
							<text class="donate-time">{{ row.timeStr }}</text>
						</view>
						<view class="donate-right">
							<view class="donate-badge-wrap">
								<view class="donate-badge" :class="'donate-badge--' + row.topBadge.kind">
									<text class="donate-badge-txt">{{ row.topBadge.text }}</text>
								</view>
								<view v-if="row.topBadge.notify != null" class="donate-notify">
									<text class="donate-notify-txt">{{ row.topBadge.notify }}</text>
								</view>
							</view>
							<text v-if="row.progressText" class="donate-progress">{{ row.progressText }}</text>
						</view>
					</view>
				</view>

				<view v-else-if="activeTab === 'yard' || activeTab === 'joined'" class="joined-list">
					<view v-for="(item, ji) in joinedLikeList" :key="(activeTab === 'yard' ? 'yd-' : 'jn-') + ji"
						class="joined-card">
						<view class="joined-header">
							<image class="joined-avatar" :src="item.userAvatar" mode="aspectFill"></image>
							<view class="joined-header-mid">
								<view class="joined-title-row">
									<text class="joined-nickname">{{ item.userName }}</text>
									<PawVerifiedBadge v-if="item.verified" />
								</view>
								<view v-if="item.variant === 'badges'" class="joined-badges">
									<view v-for="(b, bi) in item.badges" :key="bi" class="joined-badge">
										<text class="joined-badge-text">{{ b }}</text>
									</view>
								</view>
								<view v-else class="joined-org-row">
									<uni-icons type="auth-filled" color="#1976d2" :size="16"></uni-icons>
									<text class="joined-org-name">{{ item.orgName }}</text>
								</view>
							</view>
							<text class="joined-dist">{{ item.distance }} {{ item.district }}</text>
						</view>
						<text class="joined-desc">{{ item.desc }}</text>
						<scroll-view class="joined-gallery-scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
							<view class="joined-gallery-row">
								<view v-for="(g, gi) in item.gallery" :key="gi" class="joined-g-item">
									<image class="joined-g-img" :src="g.img" mode="aspectFill"></image>
									<text class="joined-g-cap">{{ g.caption }}</text>
								</view>
							</view>
						</scroll-view>
					</view>
				</view>

				<view v-else class="tab-placeholder">
					<text class="tab-placeholder-text">{{ placeholderText }}</text>
				</view>
			</view>
		</scroll-view>

		<scroll-view v-else class="profile-timeline-scroll" scroll-y :show-scrollbar="false" :bounces="false">
			<view class="profile-timeline-panel">
				<view class="timeline-heading"><text>评价</text>
					<view class="timeline-heading-line"></view>
				</view>
				<view v-for="item in profileTimeline" :key="item.day + item.month" class="profile-timeline-row">
					<view class="timeline-axis">
						<view class="timeline-dot"></view>
						<view class="timeline-line"></view>
					</view>
					<view class="timeline-content">
						<view class="timeline-date"><text class="timeline-day">{{ item.day }}</text><text
								v-if="item.month" class="timeline-month">{{ item.month }}</text><text
								class="timeline-year">2026年</text></view>
						<text class="timeline-action">{{ item.action }}</text>
						<view v-if="item.copy" class="timeline-copy-row">
							<image class="timeline-avatar" src="/static/figma/profile/timeline-1.png" mode="aspectFill">
							</image><text>{{ item.copy }}</text>
						</view>
						<view v-if="item.images" class="timeline-gallery">
							<image v-for="src in item.images" :key="src" :src="src" mode="aspectFill"></image>
						</view>
						<image v-if="item.wide" class="timeline-wide" :src="item.wide" mode="aspectFill"></image>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 点击头部「投粮」统计弹出 -->
		<view v-if="showDonateSummaryPopup" class="donate-sum-mask" @click.self="closeDonateSummary">
			<view class="donate-sum-dialog" @click.stop>
				<text class="donate-sum-title">投粮</text>
				<view class="donate-sum-body">
					<view class="donate-sum-row">
						<text class="donate-sum-label">{{ displayNickname }}累计投粮数量</text>
						<text class="donate-sum-value">{{ donateSummary.totalJin }}斤</text>
					</view>
					<view class="donate-sum-row">
						<text class="donate-sum-label">{{ displayNickname }}累计投粮次数</text>
						<text class="donate-sum-value">{{ donateSummary.totalTimes }}次</text>
					</view>
				</view>
				<view class="donate-sum-footer" @click.stop="closeDonateSummary">
					<text class="donate-sum-btn">我知道了</text>
				</view>
			</view>
		</view>

		<!-- 取消关注确认 -->
		<view v-if="showUnfollowConfirm" class="unfollow-mask" @click.self="closeUnfollowConfirm">
			<view class="unfollow-dialog" @click.stop>
				<view class="unfollow-close" @click.stop="closeUnfollowConfirm">
					<text class="unfollow-close-x">×</text>
				</view>
				<text class="unfollow-title">是否取消关注</text>
				<view class="unfollow-actions">
					<view class="unfollow-btn unfollow-btn--cancel" @click.stop="closeUnfollowConfirm">
						<text class="unfollow-btn-txt unfollow-btn-txt--cancel">取消</text>
					</view>
					<view class="unfollow-btn unfollow-btn--ok" @click.stop="confirmUnfollow">
						<text class="unfollow-btn-txt unfollow-btn-txt--ok">确定</text>
					</view>
				</view>
			</view>
		</view>

		<PawActionSheet v-model="showMoreActionSheet" :items="moreActionItems" @select="onMoreSheet" />
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import YardTagPill from '@/components/YardTagPill.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawVerifiedBadge from '@/components/identity/PawVerifiedBadge.vue'
import PawActionSheet from '@/components/overlay/PawActionSheet.vue'
import PawLikeIcon from '@/components/base/PawLikeIcon.vue'

const mockFeedForUser = (nickname, avatar) => [
	{
		cover: '/static/home-feed-1.png',
		title: '小猫吃的好开心',
		distance: '3.2km',
		district: '金水区',
		userAvatar: avatar || '/static/user.png',
		userName: nickname,
		likes: 37,
		liked: false
	},
	{
		cover: '/static/home-feed-2.png',
		title: '小猫吃的好开心呃呃呃呃呃呃',
		distance: '3.2km',
		district: '金水区',
		userAvatar: avatar || '/static/user.png',
		userName: nickname,
		likes: 32,
		liked: true
	},
	{
		cover: '/static/home-feed-1.png',
		title: '今天多喂了一点粮',
		distance: '5.0km',
		district: '中原区',
		userAvatar: avatar || '/static/user.png',
		userName: nickname,
		likes: 24,
		liked: false
	},
	{
		cover: '/static/home-feed-2.png',
		title: '猫咪排队吃饭中',
		distance: '2.1km',
		district: '管城区',
		userAvatar: avatar || '/static/user.png',
		userName: nickname,
		likes: 41,
		liked: true
	}
]

const mockAdoptRows = () => {
	const cat = { name: '小灰灰', img: '/static/avatarlog.png' }
	const row = {
		userName: '平安是福',
		userAvatar: '/static/user.png',
		status: '等待院主审核',
		cats: [cat, cat, cat, cat, cat]
	}
	return [row, { ...row, userName: '平安是福' }]
}

const joinedGalleryMock = () => [
	{ img: '/static/home-feed-1.png', caption: '开饭了开饭了开饭' },
	{ img: '/static/home-feed-2.png', caption: '开饭了开饭了开饭' },
	{ img: '/static/home-feed-1.png', caption: '开饭了开饭了开饭' },
	{ img: '/static/home-feed-2.png', caption: '开饭了开饭了开饭' }
]

const mockJoinedRows = () => [
	{
		userAvatar: '/static/avatar.png',
		userName: '我就是要喂猫',
		verified: true,
		distance: '3.2km',
		district: '金水区',
		variant: 'badges',
		badges: ['6只猫咪', '已成立2个月', '入驻4人'],
		desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
		gallery: joinedGalleryMock()
	},
	{
		userAvatar: '/static/avatar.png',
		userName: '我就是要喂猫',
		verified: true,
		distance: '3.2km',
		district: '金水区',
		variant: 'org',
		orgName: '合肥市希望流浪动物基地',
		desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
		gallery: joinedGalleryMock()
	}
]

const mockDonateRows = () => [
	{
		userName: '平安是福',
		userAvatar: '/static/avatarlog.png',
		actionText: '投粮4斤',
		timeStr: '2026-2-5 13:23:56',
		topBadge: { kind: 'feedback', text: '已反馈', notify: 3 },
		progressText: '已反馈3/5次'
	},
	{
		userName: '平安是福',
		userAvatar: '/static/avatarlog.png',
		actionText: '投粮4斤',
		timeStr: '2026-2-5 13:23:56',
		topBadge: { kind: 'feedback', text: '已反馈', notify: 4 },
		progressText: '已反馈2/5次'
	},
	{
		userName: '平安是福',
		userAvatar: '/static/avatarlog.png',
		actionText: '投粮4斤',
		timeStr: '2026-2-5 13:23:56',
		topBadge: { kind: 'complete', text: '全部完成', notify: null },
		progressText: '已反馈5/5次'
	}
]

export default {
	components: { YardTagPill, LevelCapsule, PawVerifiedBadge, PawActionSheet, PawLikeIcon },
	data() {
		return {
			donateList: mockDonateRows(),
			joinedList: mockJoinedRows(),
			yardList: mockJoinedRows(),
			adoptList: mockAdoptRows(),
			heroBgSrc: '/static/figma/feature/2ecb240e40e2e1063b6880669cd2ed5a63626710.jpg',
			statusBarHeight: 20,
			pawId: '',
			queryNickname: '',
			queryAvatar: '',
			lastActiveText: '1小时前来过',
			verified: true,
			profileTags: ['男生', '安徽'],
			bio: '建国路猫小院　开店的那些事',
			stats: {
				follow: 2,
				fans: 185,
				likes: 185,
				donate: 13
			},
			showMoreActionSheet: false,
			menuCapsuleRightPx: null,
			navMoreMarginTopPx: null,
			showDonateSummaryPopup: false,
			donateSummary: {
				totalJin: '879',
				totalTimes: '456'
			},
			followed: false,
			showUnfollowConfirm: false,
			moreActionItems: [
				{ key: 'report', label: '举报', tone: 'danger' },
				{ key: 'share', label: '分享' },
				{ key: 'block', label: '拉黑' },
				{ key: 'remark', label: '备注' }
			],
			profileTimelineMode: false,
			profileTimeline: [
				{ day: '23', month: '', action: '云养了一只宠物30天', copy: '流浪的时候经常去小卖店偷吃火腿肠被打骂', images: ['/static/figma/profile/timeline-1.png', '/static/figma/profile/timeline-2.png', '/static/figma/profile/timeline-3.png'] },
				{ day: '14', month: '5月', action: '申请领养了一只宠物', copy: '流浪的时候经常去小卖店偷吃火腿肠被打骂' },
				{ day: '27', month: '4月', action: '发起了一次求助', copy: '流浪的时候经常去小卖店偷吃火腿肠被打骂' },
				{ day: '21', month: '4月', action: '第一次来到逢猫', wide: '/static/figma/profile/timeline-wide.png' }
			],
			activeTab: 'review',
			profileTabs: [
				{ key: 'review', label: '评价' }
			],
			reviewList: [
				{ id: 1, name: '姜栋', avatar: '/static/figma/feature/04a93fa17267335f49e6e818f8caa78dd3afc80b.png', copy: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞', time: '昨天 20:45', region: '江西', likes: 32 }
			],
			feedList: []
		}
	},
	computed: {
		displayNickname() {
			return this.queryNickname || '尧尧'
		},
		displayAvatar() {
			const a = (this.queryAvatar || '').trim()
			return a || ''
		},
		placeholderText() {
			const map = {
				adopt: '领养内容开发中'
			}
			return map[this.activeTab] || ''
		},
		joinedLikeList() {
			return this.activeTab === 'yard' ? this.yardList : this.joinedList
		},
		navAlignStyle() {
			if (this.navMoreMarginTopPx == null) return {}
			return { marginTop: this.navMoreMarginTopPx + 'px' }
		},
		/** 仅右侧与微信胶囊对齐，用于资料行内的「···」 */
		navTrailingInsetStyle() {
			const s = {}
			if (this.menuCapsuleRightPx != null) {
				s.paddingRight = this.menuCapsuleRightPx + 'px'
			} else {
				s.paddingRight = '0'
			}
			return s
		}
	},
	onLoad(query) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef H5
		this.statusBarHeight = 44
		// #endif
		this.alignNavWithMenuButton(sys)
		this.pawId = decodeURIComponent(query.pawId || '') || '12345678'
		this.queryNickname = decodeURIComponent(query.nickname || '')
		this.queryAvatar = decodeURIComponent(query.avatar || '')
		if (query.state === 'dynamic-long') {
			this.profileTimelineMode = true
			this.heroBgSrc = '/static/figma/profile/hero.jpg'
			this.queryAvatar = '/static/figma/profile/avatar.png'
		}
		this.feedList = mockFeedForUser(this.displayNickname, this.displayAvatar || '/static/user.png')
		const dynTab = this.profileTabs.find((t) => t.key === 'dynamic')
		if (dynTab) dynTab.count = this.feedList.length
		const joinedTab = this.profileTabs.find((t) => t.key === 'joined')
		if (joinedTab) joinedTab.count = this.joinedList.length
		const yardTab = this.profileTabs.find((t) => t.key === 'yard')
		if (yardTab) yardTab.count = this.yardList.length
	},
	methods: {
		alignNavWithMenuButton(sys) {
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.width && mb.top != null) {
					const sb = this.statusBarHeight || sys.statusBarHeight || 20
					this.menuCapsuleRightPx = sys.windowWidth - mb.right
					const hitPx = Math.max(uni.upx2px(40), uni.upx2px(64))
					const innerPadTopPx = uni.upx2px(24)
					this.navMoreMarginTopPx =
						mb.top - sb - innerPadTopPx + (mb.height - hitPx) / 2
				}
			} catch (e) { }
			// #endif
		},
		onHeroImgError() {
			this.heroBgSrc = '/static/homebg1.png'
		},
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		openMoreActionSheet() {
			this.showMoreActionSheet = true
		},
		closeMoreActionSheet() {
			this.showMoreActionSheet = false
		},
		onMoreSheet(action) {
			this.closeMoreActionSheet()
			const actionKey = typeof action === 'string' ? action : action && action.key
			const map = {
				report: '举报',
				share: '分享',
				block: '拉黑',
				remark: '备注'
			}
			uni.showToast({ title: map[actionKey] || '', icon: 'none' })
		},
		goFollowFansPage(tab) {
			const t = tab === 'fans' ? 'fans' : 'follow'
			const q =
				'tab=' +
				t +
				'&nickname=' +
				encodeURIComponent(this.displayNickname) +
				'&pawId=' +
				encodeURIComponent(this.pawId || '')
			uni.navigateTo({ url: '/pages/user/followFans?' + q })
		},
		openDonateSummary() {
			this.showDonateSummaryPopup = true
		},
		closeDonateSummary() {
			this.showDonateSummaryPopup = false
		},
		onFollowTap() {
			if (this.followed) {
				this.showUnfollowConfirm = true
			} else {
				this.followed = true
				uni.showToast({ title: '已关注', icon: 'none' })
			}
		},
		closeUnfollowConfirm() {
			this.showUnfollowConfirm = false
		},
		confirmUnfollow() {
			this.followed = false
			this.showUnfollowConfirm = false
			uni.showToast({ title: '已取消关注', icon: 'none' })
		},
		onFeedCardTap() {
			uni.navigateTo({ url: '/pages/commodityDetails/index?id=1' })
		},
		toggleProfileFeedLike(idx) {
			const item = this.feedList[idx]
			if (!item) return
			if (item.liked) {
				item.liked = false
				item.likes = Math.max(0, item.likes - 1)
			} else {
				item.liked = true
				item.likes += 1
			}
		}
	}
}
</script>

<style scoped>
/* 设计稿 375 宽 → rpx 按 750 换算 */
.profile-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: rgba(245, 245, 245, 1);
	box-sizing: border-box;
	overflow: hidden;
	width: 100%;
}

.hero {
	position: relative;
	flex-shrink: 0;
	width: 100%;
	height: 632rpx;
	overflow: hidden;
	box-sizing: border-box;
	background: #1e4d30;
}

.hero-bg-stack {
	position: absolute;
	left: 50%;
	top: 0;
	width: 100vw;
	height: 632rpx;
	margin-left: -50vw;
	overflow: hidden;
	box-sizing: border-box;
}

.hero-photo {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 108%;
	height: 108%;
	transform: translate(-50%, -50%);
	z-index: 0;
}

.hero-inset-shadow {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	box-shadow: inset 0 0 80rpx rgba(0, 0, 0, 0.36);
	z-index: 2;
	pointer-events: none;
}

/* 与参考渐变融合；整体再压暗一档 */
.hero-gradient {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(180deg,
			rgba(95, 93, 88, 0.4) 0%,
			rgba(82, 80, 72, 0.48) 18%,
			rgba(68, 66, 58, 0.6) 40%,
			rgba(48, 46, 40, 0.82) 62%,
			rgba(32, 30, 26, 0.94) 85%,
			rgba(22, 20, 18, 0.97) 100%);
	z-index: 1;
	pointer-events: none;
}

.hero-inner {
	position: relative;
	z-index: 4;
	padding: 24rpx 30rpx 12rpx;
	box-sizing: border-box;
}

.body-scroll {
	flex: 1;
	width: 100%;
	height: 0;
	min-height: 0;
	box-sizing: border-box;
}

.hero-nav {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
	min-height: 72rpx;
	position: relative;
	z-index: 6;
	transform: translateY(-12rpx);
}

.nav-back-plain {
	padding: 4rpx 24rpx 8rpx 8rpx;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.nav-back-img {
	width: 40rpx;
	height: 40rpx;
	display: block;
	filter: brightness(0) invert(1);
}

.name-more-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	min-width: 0;
}

.profile-more-wrap {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	margin-left: auto;
}

.nav-more-trigger {
	display: flex;
	padding: 4rpx 0 4rpx 12rpx;
	min-width: 44rpx;
	align-items: center;
	justify-content: center;
}

.nav-more-dots {
	color: #ffffff;
	font-size: 40rpx;
	font-weight: 400;
	line-height: 1;
	letter-spacing: 2rpx;
	text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.35);
}

.profile-block {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	margin-top: 0;
}

.profile-top-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	transform: translateY(2rpx);
}

.profile-top-row .name-line {
	flex: 1;
	min-width: 0;
}

/* 标签、签名在头像正下方（独立一行，不与右侧资料绑在一起） */
.profile-under-avatar {
	width: 100%;
	margin-top: 24rpx;
	box-sizing: border-box;
}

.profile-under-avatar .profile-tags-row {
	margin-top: 0;
}

.avatar-col {
	flex-shrink: 0;
	margin-right: 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 150rpx;
}

.profile-tags-row {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	gap: 12rpx;
	margin-top: 14rpx;
}

.avatar-ring,
.avatar-placeholder {
	width: 150rpx;
	height: 148rpx;
	border-radius: 50%;
	border: 4rpx solid #ffffff;
	overflow: hidden;
	box-sizing: border-box;
	background: #ffe60f;
}

.avatar-img {
	width: 100%;
	height: 100%;
}

.avatar-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-placeholder-text {
	font-size: 36rpx;
	font-weight: 700;
	color: #111111;
}

.meta-col {
	flex: 1;
	min-width: 0;
	padding-top: 0;
}

.profile-oval-tag {
	padding: 2rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.22);
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.profile-oval-tag-text {
	font-size: 18rpx;
	line-height: 26rpx;
	color: rgba(255, 255, 255, 0.95);
	text-align: center;
}

.name-line {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
}

.nickname {
	font-size: 34rpx;
	font-weight: 700;
	line-height: 49rpx;
	color: rgba(255, 255, 255, 1);
}

.name-line .lv-cap {
	margin-left: 12rpx;
	flex-shrink: 0;
}

.paw-line {
	display: block;
	margin-top: 8rpx;
	font-size: 20rpx;
	font-weight: 400;
	line-height: 29rpx;
	color: rgba(198, 198, 198, 1);
}

.active-line {
	display: block;
	margin-top: 6rpx;
	font-size: 20rpx;
	line-height: 29rpx;
	color: rgba(198, 198, 198, 1);
}

.bio-line {
	display: block;
	margin-top: 14rpx;
	padding-left: 0;
	box-sizing: border-box;
	font-size: 24rpx;
	font-weight: 400;
	line-height: 35rpx;
	color: rgba(255, 255, 255, 1);
}

.stats-follow {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-top: 36rpx;
	padding-right: 0;
}

.stats-cols {
	flex: 1;
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	gap: 48rpx;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 44rpx;
}

.stat-num {
	font-size: 26rpx;
	font-weight: 500;
	line-height: 38rpx;
	color: rgba(255, 255, 255, 1);
	text-align: center;
}

.stat-label {
	margin-top: 8rpx;
	font-size: 22rpx;
	font-weight: 400;
	line-height: 32rpx;
	color: rgba(198, 198, 198, 1);
	text-align: center;
}

.stat-item--tap {
	padding: 8rpx 12rpx 12rpx;
	margin: -8rpx -12rpx -12rpx;
	border-radius: 12rpx;
}

.stat-item--donate {
	padding: 8rpx 12rpx 12rpx;
	margin: -8rpx -12rpx -12rpx;
	border-radius: 12rpx;
}

.follow-pill {
	flex-shrink: 0;
	width: 140rpx;
	height: 58rpx;
	padding: 0;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: #ffe60f;
	margin-left: 16rpx;
}

.follow-pill--followed {
	background: #e0e0e0;
}

.follow-pill-text {
	font-size: 26rpx;
	font-weight: 500;
	line-height: 36rpx;
	color: #111111;
}

.follow-pill--followed .follow-pill-text {
	font-weight: 500;
	color: #666666;
}

.tab-strip {
	position: relative;
	z-index: 5;
	flex-shrink: 0;
	width: 100%;
	margin-top: -40rpx;
	padding-top: 0;
	background: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	box-sizing: border-box;
	box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.tab-scroll {
	width: 100%;
	white-space: nowrap;
	padding: 4rpx 24rpx 16rpx;
	box-sizing: border-box;
}

.tab-row {
	display: flex;
	width: 100%;
	flex-direction: row;
	align-items: stretch;
	justify-content: center;
	gap: 40rpx;
}

.tab-item {
	position: relative;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	min-height: 72rpx;
	padding: 0 4rpx 14rpx;
	box-sizing: border-box;
}

.tab-item-inner {
	display: flex;
	flex-direction: row;
	align-items: baseline;
	justify-content: center;
}

.tab-label {
	font-size: 30rpx;
	font-weight: 500;
	line-height: 40rpx;
	color: rgba(151, 151, 151, 1);
}

.tab-count {
	font-size: 30rpx;
	font-weight: 400;
	line-height: 40rpx;
	color: rgba(151, 151, 151, 1);
	margin-left: 6rpx;
}

.tab-item--active .tab-label,
.tab-item--active .tab-count {
	color: rgba(0, 0, 0, 1);
	font-weight: 500;
}

.tab-underline {
	position: absolute;
	left: 50%;
	bottom: 2rpx;
	transform: translateX(-50%);
	width: 72rpx;
	height: 8rpx;
	border-radius: 4rpx;
	background: #ffe60f;
}

.panel-wrap {
	min-height: 400rpx;
	padding-bottom: 48rpx;
	background: rgba(245, 245, 245, 1);
	box-sizing: border-box;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 48rpx 120rpx;
}

.empty-illu {
	width: 280rpx;
	opacity: 0.9;
	transform: scale(0.7);
	transform-origin: center top;
}

.empty-text {
	margin-top: 8rpx;
	font-size: 28rpx;
	color: #999999;
}

.masonry {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
	padding: 8rpx 20rpx 40rpx;
	box-sizing: border-box;
}

.feed-card {
	width: calc(50% - 10rpx);
	margin-bottom: 20rpx;
	background: rgba(245, 245, 245, 1);
	border-radius: 8rpx;
	overflow: hidden;
	box-sizing: border-box;
}

.feed-img-wrap {
	position: relative;
	width: 100%;
	border-radius: 8rpx;
	overflow: hidden;
}

.feed-img {
	width: 100%;
	height: 480rpx;
	display: block;
	vertical-align: top;
	border-radius: 8rpx;
}

.feed-img--tall {
	height: 520rpx;
}

.loc-pill {
	position: absolute;
	right: 8rpx;
	bottom: 8rpx;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	max-width: 90%;
	padding: 4rpx 10rpx;
	background: rgba(0, 0, 0, 0.45);
	border-radius: 999rpx;
	box-sizing: border-box;
	gap: 6rpx;
}

.loc-text {
	font-size: 20rpx;
	font-weight: 500;
	line-height: 22rpx;
	color: rgba(246, 248, 250, 1);
}

.feed-title {
	padding: 16rpx 16rpx 8rpx;
	font-size: 26rpx;
	font-weight: 500;
	line-height: 38rpx;
	color: rgba(51, 51, 51, 1);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.feed-foot {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 0 16rpx 16rpx;
}

.feed-foot-left {
	display: flex;
	flex-direction: row;
	align-items: center;
	min-width: 0;
	flex: 1;
}

.feed-foot-av {
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.feed-foot-name {
	margin-left: 8rpx;
	font-size: 22rpx;
	font-weight: 400;
	line-height: 32rpx;
	color: rgba(97, 97, 97, 1);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.feed-foot-like {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-shrink: 0;
	margin-left: 8rpx;
}

.feed-like-num {
	margin-left: 6rpx;
	font-size: 26rpx;
	font-weight: 500;
	line-height: 38rpx;
	color: rgba(104, 104, 104, 1);
}

.adopt-list {
	padding: 16rpx 20rpx 40rpx;
	box-sizing: border-box;
}

.adopt-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx 20rpx 20rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}

.adopt-head {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.adopt-head-left {
	display: flex;
	flex-direction: row;
	align-items: center;
	min-width: 0;
	flex: 1;
}

.adopt-av {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.adopt-name {
	margin-left: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	color: #111111;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 280rpx;
}

.adopt-status {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 8rpx 14rpx;
	border: 1px solid #ff2741;
	border-radius: 8rpx;
	flex-shrink: 0;
	margin-left: 12rpx;
}

.adopt-status-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background: #ff2741;
	margin-right: 8rpx;
}

.adopt-status-txt {
	font-size: 22rpx;
	font-weight: 500;
	color: #ff2741;
	white-space: nowrap;
}

.adopt-gallery-scroll {
	width: 100%;
	white-space: nowrap;
}

.adopt-gallery-row {
	display: inline-flex;
	flex-direction: row;
	gap: 20rpx;
	padding: 4rpx 0;
}

.adopt-cat-cell {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	width: 112rpx;
	flex-shrink: 0;
}

.adopt-cat-img {
	width: 112rpx;
	height: 112rpx;
	border-radius: 50%;
	background: #f5f5f5;
}

.adopt-cat-name {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #333333;
	text-align: center;
}

.donate-list {
	padding: 16rpx 20rpx 40rpx;
	box-sizing: border-box;
}

.donate-card {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx 20rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}

.donate-av {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	flex-shrink: 0;
	background: #f5f5f5;
}

.donate-mid {
	flex: 1;
	min-width: 0;
	margin-left: 20rpx;
	margin-right: 16rpx;
}

.donate-title-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
}

.donate-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #111111;
}

.donate-action {
	display: block;
	margin-top: 10rpx;
	font-size: 28rpx;
	font-weight: 500;
	color: #333333;
	line-height: 40rpx;
}

.donate-time {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	font-weight: 400;
	color: #999999;
	line-height: 32rpx;
}

.donate-right {
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: flex-start;
	gap: 12rpx;
}

.donate-badge-wrap {
	position: relative;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-end;
}

.donate-badge {
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	border: 1px solid #43a047;
	background: #ffffff;
	box-sizing: border-box;
}

.donate-badge--complete {
	border-color: #43a047;
}

.donate-badge--feedback {
	border-color: #43a047;
}

.donate-badge-txt {
	font-size: 22rpx;
	font-weight: 500;
	color: #2e7d32;
}

.donate-notify {
	position: absolute;
	right: -14rpx;
	top: -14rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	border-radius: 16rpx;
	background: #ff2741;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.donate-notify-txt {
	font-size: 20rpx;
	font-weight: 500;
	color: #ffffff;
	line-height: 1;
}

.donate-progress {
	font-size: 22rpx;
	font-weight: 400;
	color: #1976d2;
	line-height: 32rpx;
	text-align: right;
}

.joined-list {
	padding: 16rpx 20rpx 40rpx;
	box-sizing: border-box;
}

.joined-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	box-sizing: border-box;
}

.joined-header {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
}

.joined-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	flex-shrink: 0;
	background: #f0f0f0;
}

.joined-header-mid {
	flex: 1;
	min-width: 0;
	margin-left: 20rpx;
	padding-right: 12rpx;
}

.joined-title-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
}

.joined-nickname {
	font-size: 30rpx;
	font-weight: 500;
	color: #111111;
	line-height: 42rpx;
}

.joined-verified {
	font-size: 22rpx;
	font-weight: 500;
	color: #ff6b00;
	line-height: 30rpx;
}

.joined-dist {
	flex-shrink: 0;
	font-size: 22rpx;
	color: #999999;
	line-height: 32rpx;
	text-align: right;
	max-width: 160rpx;
}

.joined-badges {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.joined-badge {
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
	background: #fff8e6;
}

.joined-badge-text {
	font-size: 22rpx;
	font-weight: 500;
	color: #e65100;
	line-height: 30rpx;
}

.joined-org-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 16rpx;
	gap: 8rpx;
	min-width: 0;
}

.joined-org-name {
	flex: 1;
	min-width: 0;
	font-size: 26rpx;
	color: #555555;
	line-height: 36rpx;
}

.joined-desc {
	margin-top: 20rpx;
	font-size: 26rpx;
	color: #999999;
	line-height: 40rpx;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
}

.joined-gallery-scroll {
	width: 100%;
	margin-top: 20rpx;
	white-space: nowrap;
}

.joined-gallery-row {
	display: flex;
	flex-direction: row;
	padding-bottom: 4rpx;
}

.joined-g-item {
	flex-shrink: 0;
	width: 200rpx;
	margin-right: 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.joined-g-item:last-child {
	margin-right: 0;
}

.joined-g-img {
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
	background: #f0f0f0;
	display: block;
}

.joined-g-cap {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #666666;
	line-height: 30rpx;
	text-align: center;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tab-placeholder {
	padding: 120rpx 48rpx;
	display: flex;
	justify-content: center;
}

.tab-placeholder-text {
	font-size: 28rpx;
	color: #999999;
}

.donate-sum-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 500;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	box-sizing: border-box;
}

.donate-sum-dialog {
	width: 100%;
	max-width: 620rpx;
	background: #ffffff;
	border-radius: 20rpx;
	overflow: hidden;
	box-sizing: border-box;
}

.donate-sum-title {
	display: block;
	padding: 40rpx 40rpx 32rpx;
	font-size: 36rpx;
	font-weight: 700;
	color: #333333;
	text-align: center;
	line-height: 50rpx;
}

.donate-sum-body {
	padding: 8rpx 40rpx 40rpx;
	box-sizing: border-box;
}

.donate-sum-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 0;
	box-sizing: border-box;
}

.donate-sum-label {
	flex: 1;
	margin-right: 24rpx;
	font-size: 28rpx;
	font-weight: 400;
	color: #888888;
	line-height: 40rpx;
}

.donate-sum-value {
	font-size: 28rpx;
	font-weight: 500;
	color: #111111;
	line-height: 40rpx;
	flex-shrink: 0;
}

.donate-sum-footer {
	border-top: 1rpx solid #eeeeee;
	padding: 28rpx 0;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.donate-sum-btn {
	font-size: 30rpx;
	font-weight: 400;
	color: #888888;
	line-height: 42rpx;
}

.unfollow-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 550;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	box-sizing: border-box;
}

.unfollow-dialog {
	position: relative;
	width: 100%;
	max-width: 600rpx;
	background: #ffffff;
	border-radius: 24rpx;
	padding: 56rpx 40rpx 40rpx;
	box-sizing: border-box;
}

.unfollow-close {
	position: absolute;
	right: 20rpx;
	top: 16rpx;
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.unfollow-close-x {
	font-size: 44rpx;
	font-weight: 300;
	line-height: 1;
	color: #333333;
}

.unfollow-title {
	display: block;
	text-align: center;
	font-size: 32rpx;
	font-weight: 500;
	color: #111111;
	line-height: 48rpx;
	padding: 8rpx 48rpx 48rpx;
	box-sizing: border-box;
}

.unfollow-actions {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.unfollow-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.unfollow-btn--cancel {
	background: #ffffff;
	border: 1rpx solid #e0e0e0;
}

.unfollow-btn--ok {
	background: #ffe60f;
	border: 1rpx solid #ffe60f;
}

.unfollow-btn-txt {
	font-size: 30rpx;
	line-height: 42rpx;
}

.unfollow-btn-txt--cancel {
	font-weight: 400;
	color: #888888;
}

.unfollow-btn-txt--ok {
	font-weight: 500;
	color: #111111;
}

.review-panel {
	min-height: 780rpx;
	padding: 18rpx 32rpx 40rpx;
	box-sizing: border-box;
	background: #fff;
}

.review-filters {
	display: flex;
	gap: 18rpx;
	margin-bottom: 28rpx;
	position: relative;
	top: -10rpx;
}

.review-filter {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 92rpx;
	height: 48rpx;
	padding: 0 18rpx;
	border-radius: 10rpx;
	background: #f5f5f5;
	color: #666;
	font-size: 24rpx;
}

.review-filter--active {
	background: #ffdf00;
	color: #111;
}

.review-row {
	display: flex;
	align-items: flex-start;
}

.review-avatar {
	flex: 0 0 auto;
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
}

.review-main {
	min-width: 0;
	flex: 1;
	margin-left: 16rpx;
}

.review-name-line {
	display: flex;
	align-items: center;
}

.review-name {
	color: #444;
	font-size: 24rpx;
}

.review-copy {
	display: block;
	margin-top: 6rpx;
	color: #333;
	font-size: 22rpx;
	line-height: 28rpx;
}

.review-meta {
	display: block;
	margin-top: 14rpx;
	color: #999;
	font-size: 20rpx;
}

.review-like {
	display: flex;
	gap: 8rpx;
	align-items: center;
	padding-top: 64rpx;
	color: #666;
	font-size: 22rpx;
}

.profile-timeline-scroll {
	flex: 1;
	width: 100%;
	height: 0;
	min-height: 0;
	margin-top: -40rpx;
	position: relative;
	z-index: 5;
	border-radius: 24rpx 24rpx 0 0;
	background: #fff;
}

.profile-timeline-panel {
	min-height: 100%;
	padding: 22rpx 30rpx 44rpx;
	box-sizing: border-box;
	background: #fff;
}

.timeline-heading {
	position: relative;
	height: 58rpx;
	text-align: center;
	color: #999;
	font-size: 28rpx;
	line-height: 48rpx;
}

.timeline-heading-line {
	position: absolute;
	left: 0;
	bottom: 0;
	width: 56rpx;
	height: 6rpx;
	background: #ffe20a;
	border-radius: 4rpx;
}

.profile-timeline-row {
	position: relative;
	display: flex;
	min-height: 250rpx;
}

.timeline-axis {
	position: relative;
	flex: 0 0 28rpx;
}

.timeline-dot {
	position: absolute;
	left: 0;
	top: 21rpx;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	border: 2rpx solid #fff;
	background: #ffe20a;
	box-shadow: 0 0 0 1rpx #ddd;
	z-index: 2;
	box-sizing: border-box;
}

.timeline-line {
	position: absolute;
	left: 6rpx;
	top: 31rpx;
	bottom: -18rpx;
	width: 1rpx;
	background: #e8e8e8;
}

.profile-timeline-row:last-child .timeline-line {
	bottom: 0;
}

.timeline-content {
	flex: 1;
	min-width: 0;
	padding: 8rpx 0 25rpx;
}

.timeline-date {
	display: flex;
	align-items: baseline;
	height: 62rpx;
}

.timeline-day {
	color: #333;
	font-size: 48rpx;
	line-height: 56rpx;
	font-weight: 500;
}

.timeline-month {
	margin-left: 10rpx;
	color: #333;
	font-size: 20rpx;
	font-weight: 500;
}

.timeline-year {
	margin-left: auto;
	color: #666;
	font-size: 20rpx;
}

.timeline-action {
	display: block;
	margin-top: 15rpx;
	color: #999;
	font-size: 24rpx;
	line-height: 34rpx;
}

.timeline-copy-row {
	display: flex;
	align-items: flex-start;
	margin-top: 18rpx;
	color: #666;
	font-size: 28rpx;
	line-height: 40rpx;
	white-space: nowrap;
	overflow: hidden;
}

.timeline-avatar {
	flex: 0 0 auto;
	width: 66rpx;
	height: 66rpx;
	margin-right: 18rpx;
	border-radius: 12rpx;
}

.timeline-gallery {
	display: flex;
	gap: 8rpx;
	margin-top: 20rpx;
}

.timeline-gallery image {
	width: calc((100% - 16rpx)/3);
	height: 150rpx;
	border-radius: 4rpx;
}

.timeline-wide {
	display: block;
	width: 100%;
	height: 276rpx;
	margin-top: 24rpx;
	border-radius: 10rpx;
}
</style>
