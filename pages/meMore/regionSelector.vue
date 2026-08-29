<template>
	<view class="region-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="crumb-row">
			<text
				v-for="(label, i) in crumbList"
				:key="'crumb-' + i"
				class="crumb-item"
				:class="{ 'crumb-item--active': i === level }"
				@click="onCrumbTap(i)"
			>{{ label }}</text>
		</view>

		<scroll-view class="list-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
			<view class="list-wrap">
				<view
					v-for="(item, i) in currentOptions"
					:key="'opt-' + i"
					class="list-item"
					@click="onItemTap(item)"
				>
					<text class="list-item-text">{{ item.name }}</text>
					<text v-if="item.name === selectedName" class="list-check">✓</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
const REGION_TREE = [
	{
		name: '安徽省',
		children: [
			{
				name: '滁州市',
				children: [
					{ name: '南谯区', children: [{ name: '腰铺镇' }, { name: '乌衣镇' }, { name: '沙河镇' }] },
					{ name: '琅琊区', children: [{ name: '琅琊街道' }, { name: '扬子街道' }] }
				]
			},
			{
				name: '合肥市',
				children: [
					{ name: '蜀山区', children: [{ name: '三里庵街道' }, { name: '南岗镇' }] },
					{ name: '包河区', children: [{ name: '芜湖路街道' }, { name: '骆岗街道' }] }
				]
			}
		]
	},
	{
		name: '北京市',
		children: [
			{
				name: '北京市',
				children: [
					{ name: '朝阳区', children: [{ name: '三里屯街道' }, { name: '望京街道' }] },
					{ name: '海淀区', children: [{ name: '中关村街道' }, { name: '学院路街道' }] }
				]
			}
		]
	},
	{
		name: '广东省',
		children: [
			{
				name: '广州市',
				children: [
					{ name: '天河区', children: [{ name: '珠吉街道' }, { name: '车陂街道' }] },
					{ name: '越秀区', children: [{ name: '北京街道' }, { name: '大东街道' }] }
				]
			}
		]
	},
	{
		name: '重庆市',
		children: [
			{
				name: '重庆市',
				children: [
					{ name: '渝北区', children: [{ name: '龙溪街道' }, { name: '两路街道' }] },
					{ name: '南岸区', children: [{ name: '南坪街道' }, { name: '铜元局街道' }] }
				]
			}
		]
	},
	{ name: '福建省', children: [] },
	{ name: '甘肃省', children: [] },
	{ name: '广西壮族自治区', children: [] },
	{ name: '贵州省', children: [] },
	{ name: '河北省', children: [] },
	{ name: '湖北省', children: [] },
	{ name: '黑龙江省', children: [] },
	{ name: '海南省', children: [] },
	{ name: '河南省', children: [] }
]

const ANHUI_CITIES = ['安庆市','蚌埠市','亳州市','滁州市','池州市','阜阳市','淮北市','合肥市','淮南市','黄山市','六安市','马鞍山市','宿州市'].map(name => ({ name, children: [] }))

export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			mode: 'full',
			maxLevel: 3,
			level: 0,
			parts: ['', '', '', ''],
			currentOptions: REGION_TREE,
			selectedName: ''
		}
	},
	computed: {
		crumbList() {
			const arr = this.mode === 'city' ? this.parts.slice(0, 2) : this.parts
			return arr.map((p, i) => {
				if (p) return p
				return i <= this.level ? '请选择' : ''
			})
		}
	},
	onLoad(query) {
		this.layoutNav()
		this.mode = query && query.mode === 'city' ? 'city' : 'full'
		this.maxLevel = this.mode === 'city' ? 1 : 3
		const state = query && query.state
		if (state === 'back') {
			this.parts = ['安徽省','滁州市','南谯区','']
			this.level = 0
			this.currentOptions = REGION_TREE
			this.selectedName = '安徽省'
		} else if (state === 'street') {
			this.parts = ['安徽省','滁州市','南谯区','']
			this.level = 3
			this.currentOptions = ANHUI_CITIES
		} else if (state === 'city') {
			this.parts = ['安徽省','','','']
			this.level = 1
			this.currentOptions = ANHUI_CITIES
		}
		const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
		if (ch && typeof ch.on === 'function') {
			ch.on('initRegion', (payload = {}) => {
				const p = Array.isArray(payload.parts) ? payload.parts.slice(0, 4) : []
				while (p.length < 4) p.push('')
				this.parts = p
				this.rebuildOptionsByParts()
			})
		}
	},
	methods: {
		layoutNav() {
			const sys = uni.getSystemInfoSync()
			this.statusBarHeight = sys.statusBarHeight || 20
			// #ifdef H5
			this.statusBarHeight = 44
			// #endif
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
			} catch (e) {}
			// #endif
		},
		goBack() {
			uni.navigateBack()
		},
		onCrumbTap(i) {
			if (i > this.level) return
			this.level = i
			for (let k = i; k < this.maxLevel + 1; k++) this.parts[k] = ''
			this.rebuildOptionsByParts()
		},
		onItemTap(item) {
			this.selectedName = item.name
			this.parts[this.level] = item.name
			if (this.level >= this.maxLevel) {
				const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
				if (ch && typeof ch.emit === 'function') {
					ch.emit('regionSelected', { parts: this.parts.slice(0, this.maxLevel + 1) })
				}
				if (this.mode === 'city') {
					const city = this.parts[1] || this.parts[0] || ''
					if (city) uni.setStorageSync('selectedCity', city)
				}
				uni.navigateBack()
				return
			}
			this.level += 1
			this.rebuildOptionsByParts()
		},
		rebuildOptionsByParts() {
			let cur = REGION_TREE
			for (let i = 0; i < this.level; i++) {
				const picked = this.parts[i]
				const hit = (cur || []).find((x) => x.name === picked)
				cur = (hit && hit.children) || []
			}
			this.currentOptions = Array.isArray(cur) ? cur : []
			if (!this.currentOptions.length) {
				// 对无内置数据的地区，补兜底项，保证可选四级完成流程
				const cityModeText = this.level === 0 ? '请选择省份' : '请选择城市'
				const fullModeText = this.level === 1 ? '请选择城市' : this.level === 2 ? '请选择区县' : '请选择街道'
				this.currentOptions = [{ name: this.mode === 'city' ? cityModeText : fullModeText }]
			}
		}
	}
}
</script>

<style scoped>
.region-page { height: 100vh; min-height: 100vh; background: #f6f6f6; display: flex; flex-direction: column; box-sizing: border-box; }
.nav-wrap { background: #f6f6f6; flex-shrink: 0; }
.nav-row { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 8rpx; box-sizing: border-box; }
.nav-side { min-width: 80rpx; display: flex; align-items: center; }
.nav-left { padding: 8rpx 24rpx 8rpx 16rpx; justify-content: center; }
.nav-back-icon { width: 20rpx; height: 36rpx; }
.crumb-row { min-height: 46px; display: flex; align-items: center; column-gap: 20rpx; padding: 0 20rpx; box-sizing: border-box; }
.crumb-item { font-size: 16px; color: #8e8e8e; line-height: 22px; max-width: 120rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.crumb-item--active { color: #2a2a2a; font-weight: 500; }
.list-scroll { flex: 1; min-height: 0; width: 100%; box-sizing: border-box; }
.list-wrap { margin: 16px 8px 12px; background: #fff; border-radius: 4px; overflow: hidden; }
.list-item { min-height: 48px; display: flex; align-items: center; justify-content:space-between; border-bottom: 1px solid #f2f2f2; padding: 0 14px; box-sizing: border-box; }
.list-item:last-child { border-bottom: 0; }
.list-item-text { font-size: 13px; color: #2f2f2f; line-height: 18px; }.list-check{font-size:12px;color:#222}.crumb-row{min-height:44px;padding:0 15px;column-gap:18px}.crumb-item{font-size:11px;line-height:16px;max-width:72px}.crumb-item--active{font-weight:400}
</style>
