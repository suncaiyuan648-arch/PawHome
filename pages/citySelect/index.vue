<template>
	<view class="city-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view
				class="top-row"
				:style="{
					marginTop: navRowOffsetTop + 'px',
					height: navRowHeight + 'px',
					paddingRight: menuRightInset + 'px'
				}"
			>
				<view class="back-hit" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="search-box top-search">
					<uni-icons type="search" color="#CFCFCF" :size="14"></uni-icons>
					<input class="search-input" v-model="keyword" type="text" placeholder="输入城市名称" placeholder-class="search-placeholder" />
				</view>
				<view class="mini-btn" :style="{ width: menuWidth + 'px', height: navRowHeight + 'px', borderRadius: navRowHeight / 2 + 'px' }">
					<text class="dots">···</text>
					<view class="mini-split"></view>
					<view class="mini-circle"></view>
				</view>
			</view>

			<view class="current-row">
				<view class="current-left">
					<uni-icons type="paperplane-filled" color="#2f8bff" :size="10"></uni-icons>
					<text class="current-city">{{ currentCity }}</text>
				</view>
				<text class="relocate" @click="resetLocation">重新定位</text>
			</view>
		</view>

		<view class="panel">
			<scroll-view class="city-scroll" scroll-y :show-scrollbar="false">
				<view v-if="!hasKeyword" class="hot-card">
					<text class="section-title">热门城市</text>
					<view class="hot-grid">
						<view v-for="hot in hotCities" :key="hot" class="hot-chip" @click="selectCity(hot)">
							<text>{{ hot }}</text>
						</view>
					</view>
				</view>

				<view v-for="group in filteredGroups" :key="group.letter" class="group-wrap">
					<text class="group-letter">{{ group.letter }}</text>
					<view
					v-for="(name, cityIndex) in group.cities"
					:key="group.letter + name + cityIndex"
						class="city-item"
						@click="selectCity(name)"
					>
						<text>{{ name }}</text>
					</view>
				</view>
				<view v-if="hasKeyword && !filteredGroups.length" class="empty-row">
					<text>暂无匹配城市</text>
				</view>
				<view class="bottom-space"></view>
			</scroll-view>

			<view class="index-col">
				<text
					v-for="letter in sideLetters"
					:key="letter"
					class="index-item"
					:class="{ active: letter === selectedIndex }"
					@click="selectedIndex = letter"
				>
					{{ letter }}
				</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getWechatNavLayout } from '@/utils/navLayout.js'

const CITY_GROUPS = [
	{ letter: 'A', cities: ['阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝'] },
	{ letter: 'B', cities: ['北京', '保定', '包头', '北海', '蚌埠'] },
	{ letter: 'C', cities: ['重庆', '成都', '长沙', '长春', '常州'] },
	{ letter: 'D', cities: ['大连', '东莞', '大庆', '德州', '达州'] },
	{ letter: 'E', cities: ['鄂尔多斯', '恩施'] },
	{ letter: 'F', cities: ['福州', '佛山', '阜阳', '抚州'] },
	{ letter: 'G', cities: ['广州', '贵阳', '桂林', '赣州', '贵港'] },
	{ letter: 'H', cities: ['杭州', '合肥', '哈尔滨', '海口', '呼和浩特', '惠州'] },
	{ letter: 'J', cities: ['济南', '嘉兴', '金华', '九江', '吉林'] },
	{ letter: 'K', cities: ['昆明', '开封'] },
	{ letter: 'L', cities: ['兰州', '洛阳', '临沂', '柳州', '廊坊'] },
	{ letter: 'M', cities: ['绵阳', '茂名', '马鞍山'] },
	{ letter: 'N', cities: ['南京', '宁波', '南昌', '南宁', '南通'] },
	{ letter: 'P', cities: ['平顶山', '莆田', '濮阳', '攀枝花'] },
	{ letter: 'Q', cities: ['青岛', '泉州', '秦皇岛', '齐齐哈尔'] },
	{ letter: 'R', cities: ['日照', '日喀则'] },
	{ letter: 'S', cities: ['上海', '深圳', '沈阳', '苏州', '石家庄', '三亚', '绍兴'] },
	{ letter: 'T', cities: ['天津', '太原', '唐山', '台州', '泰州'] },
	{ letter: 'W', cities: ['武汉', '无锡', '温州', '潍坊', '乌鲁木齐'] },
	{ letter: 'X', cities: ['西安', '厦门', '徐州', '襄阳', '咸阳'] },
	{ letter: 'Y', cities: ['银川', '烟台', '扬州', '宜昌', '岳阳'] },
	{ letter: 'Z', cities: ['郑州', '珠海', '中山', '漳州', '淄博', '遵义'] }
]

export default {
	data() {
		return {
			statusBarHeight: 20,
			navRowOffsetTop: 0,
			navRowHeight: 44,
			menuWidth: 87,
			menuRightInset: 8,
			keyword: '',
			selectedCity: '',
			currentCity: '郑州市',
			selectedIndex: 'A',
			hotCities: ['北京', '上海', '广州', '深圳', '重庆', '成都', '武汉', '天津', '杭州', '郑州', '长沙', '合肥']
		}
	},
	computed: {
		filteredGroups() {
			const key = (this.keyword || '').trim()
			if (!key) return CITY_GROUPS
			return CITY_GROUPS
				.map((g) => ({
					letter: g.letter,
					cities: g.cities.filter((n) => n.includes(key))
				}))
				.filter((g) => g.cities.length)
		},
		hasKeyword() {
			return !!(this.keyword || '').trim()
		},
		sideLetters() {
			return ['热门', ...CITY_GROUPS.map((x) => x.letter)]
		}
	},
	onLoad(query) {
		this.layoutNav()
		const current = query && query.current ? decodeURIComponent(query.current) : ''
		this.selectedCity = current || '郑州市'
		this.currentCity = this.selectedCity
	},
	methods: {
		layoutNav() {
			const nav = getWechatNavLayout()
			this.statusBarHeight = nav.statusBarHeight
			this.navRowOffsetTop = nav.navRowOffsetTop
			this.navRowHeight = nav.navRowHeight
			this.menuWidth = nav.menuWidth
			this.menuRightInset = nav.menuRightInset
		},
		selectCity(city) {
			const normalized = city.endsWith('市') ? city : city + '市'
			this.selectedCity = normalized
			this.currentCity = normalized
			uni.setStorageSync('selectedCity', normalized)
			const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
			if (ch && typeof ch.emit === 'function') {
				ch.emit('citySelected', { city: normalized })
			}
			uni.navigateBack()
		},
		resetLocation() {
			this.selectCity(this.currentCity.replace(/市$/, ''))
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.city-page { height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; }
.nav-wrap { flex-shrink: 0; background: #f5f5f5; padding: 0 8px; box-sizing: border-box; }
.top-row { position: relative; display: flex; align-items: center; justify-content: space-between; padding-left: 6px; box-sizing: border-box; }
.back-hit { width: 34px; height: 100%; display: flex; align-items: center; justify-content: center; }
.nav-back-icon { width: 9px; height: 17px; }
.mini-btn { border: 0.5px solid #e9e9e9; display: flex; align-items: center; justify-content: space-around; box-sizing: border-box; background: #f5f5f5; }
.dots { font-size: 13px; line-height: 1; color: #333; margin-top: -2px; }
.mini-split { width: 0.5px; height: 20px; background: #e2e2e2; }
.mini-circle { width: 18px; height: 18px; border-radius: 50%; border: 1px solid #222; box-sizing: border-box; }
.search-box { width: 216px; height: 34px; border-radius: 25px; background: #fff; display: flex; align-items: center; padding: 0 13px; box-sizing: border-box; }
.top-search { position: absolute; left: 32px; top: 5px; }
.search-input { flex: 1; min-width: 0; margin-left: 8px; font-size: 14px; color: #333; line-height: 20px; }
.search-placeholder { color: #999; font-size: 14px; line-height: 20px; }
.current-row { height: 46px; margin: 0 14px 0 12px; display: flex; align-items: center; justify-content: space-between; }
.current-left { display: inline-flex; align-items: center; }
.current-city { margin-left: 6px; font-size: 15px; font-weight: 500; color: #333; line-height: 22px; }
.relocate { font-size: 11px; color: #0a77f5; line-height: 16px; }
.panel { margin: 0 8px; flex: 1; min-height: 0; border-radius: 10px 10px 0 0; background: #fff; display: flex; overflow: hidden; }
.city-scroll { flex: 1; height: 100%; min-height: 0; }
.hot-card { padding: 10px 12px 6px; }
.section-title { font-size: 12px; color: #999; line-height: 17px; }
.hot-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(4, 1fr); column-gap: 10px; row-gap: 9px; }
.hot-chip { height: 33px; border-radius: 16.5px; background: #f5f5f5; display: inline-flex; align-items: center; justify-content: center; }
.hot-chip text { font-size: 12px; font-weight: 400; color: #333; line-height: 17px; }
.group-wrap { padding: 0; }
.group-letter { display: block; height: 54px; line-height: 54px; padding-left: 12px; font-size: 14px; font-weight: 400; color: #999; background:#fff; }
.city-item { height: 48px; border-bottom: 0.3px solid #f0f0f0; display: flex; align-items: center; padding-left: 14px; box-sizing: border-box; }
.city-item text { font-size: 14px; color: #333; line-height: 20px; }
.index-col { width: 20px; padding-top: 38px; padding-right: 4px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; }
.index-item { width: 20px; height: 14px; line-height: 14px; text-align: center; font-size: 10px; font-weight: 400; color: #999; margin-bottom: 4px; }
.index-item.active { width: 17px; height: 17px; line-height: 17px; border-radius: 50%; background: #ffdd00; color: #333; font-weight: 500; margin-bottom: 2px; }
.empty-row { min-height: 180px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 14px; }
.bottom-space { height: 20px; }
</style>
