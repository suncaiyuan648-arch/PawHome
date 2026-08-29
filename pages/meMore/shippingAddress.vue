<template>
	<view class="address-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">{{ activeKind === 'shipping' ? '收货地址' : '服务地址' }}</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<text class="page-heading">{{ activeKind === 'shipping' ? '收货地址' : '服务地址' }}</text>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
			<view v-if="currentList.length" class="list-pad">
				<view v-for="(row, i) in currentList" :key="'a-' + i">
					<PawAddressCard v-if="!manageMode && !pickMode" :address="row" mode="display" @click="onAddrBodyTap(row)" />
					<view v-else class="addr-card">
					<view class="addr-main">
						<view v-if="pickMode" class="pick-radio" :class="{ selected: selectedId === row.id }" @click.stop="selectedId=row.id"><text v-if="selectedId === row.id">✓</text></view>
						<view v-else class="addr-pin">
							<uni-icons type="location-filled" color="#FF7A33" :size="22"></uni-icons>
						</view>
						<view class="addr-body" @click="onAddrBodyTap(row)">
							<view class="addr-top">
								<text class="addr-name">{{ row.name }}</text>
								<text class="addr-phone">{{ row.phone }}</text>
								<view v-if="row.isDefault" class="addr-default-tag"><text>默认</text></view>
							</view>
							<text class="addr-detail">{{ row.detail }}</text>
						</view>
						<view v-if="!manageMode && !pickMode" class="addr-edit" @click.stop="onEdit(row)">
							<uni-icons type="compose" color="#C8C8C8" :size="22"></uni-icons>
						</view>
					</view>

					<view v-if="manageMode" class="addr-manage-row">
						<view class="addr-manage-divider"></view>
						<view class="addr-manage-main">
							<view class="default-switch" @click.stop="onSetDefault(row.id)">
								<view class="default-dot" :class="{ 'default-dot--active': row.isDefault }">
									<uni-icons v-if="row.isDefault" type="checkmarkempty" color="#333333" :size="12"></uni-icons>
								</view>
								<text class="default-label">{{ activeKind === 'shipping' ? '默认收货地址' : '默认服务地址' }}</text>
							</view>
							<view class="addr-delete" @click.stop="onDelete(row.id)">
								<uni-icons type="trash" color="#C8C8C8" :size="18"></uni-icons>
								<text class="addr-delete-text">删除</text>
							</view>
						</view>
					</view>
					</view>
				</view>
			</view>
			<view v-else class="empty-state">
				<uni-icons type="email" color="#252525" :size="58" />
				<text class="empty-title">还没有地址</text>
				<text class="empty-sub">快去添加第一条地址吧</text>
			</view>
		</scroll-view>

		<view class="footer-bar">
			<view v-if="!pickMode" class="footer-btn footer-btn--ghost" @click="onManage">
				<text>{{ manageMode ? '完成' : '管理' }}</text>
			</view>
			<view class="footer-btn footer-btn--primary" @click="onAdd">
				<text class="footer-plus">+</text>
				<text>{{ activeKind === 'shipping' ? '添加收货地址' : '添加服务地址' }}</text>
			</view>
		</view>

		<PawDialog v-model="showDeleteDialog" variant="destructive" title="确定要删除该地址吗" confirm-text="删除" cancel-text="取消" :show-cancel="true" :close-on-mask="false" @cancel="closeDeleteDialog" @confirm="confirmDeleteAddress" />
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import PawAddressCard from '@/components/form/PawAddressCard.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'

const mockShipping = () => {
	const detail = '湖南省 长沙市 雨花区 中意一路167号 乐盈前城2栋2单元18楼天台'
	const base = { name: '项子涵', phone: '13366669999', detail }
	return [0, 1, 2, 3].map((i) => ({ id: String(i + 1), ...base, isDefault: i === 0 }))
}

const mockService = () => [
	{ id: 's-1', name: '李阿姨', phone: '13800001111', detail: '雨花区 中意一路167号 2栋天台喂养点', isDefault: true },
	{ id: 's-2', name: '何师傅', phone: '13900002222', detail: '天心区 芙蓉中路三段 领养服务站', isDefault: false },
	{ id: 's-3', name: '王站长', phone: '13700003333', detail: '岳麓区 银杉路 城市流浪动物救助点', isDefault: false }
]

export default {
	components: { PawAddressCard, PawDialog },
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			activeKind: 'shipping',
			manageMode: false,
			shippingList: mockShipping(),
			serviceList: mockService(),
			showDeleteDialog: false,
			pendingDeleteId: null,
			pickMode: false,
			selectedId: ''
		}
	},
	computed: {
		currentList() {
			return this.activeKind === 'shipping' ? this.shippingList : this.serviceList
		}
	},
	onLoad(options = {}) {
		this.pickMode = options.pick === '1' || options.pick === 1 || options.state === 'pick'
		this.activeKind = options.kind === 'service' ? 'service' : 'shipping'
		if (this.pickMode) {
			this.activeKind = 'shipping'
			this.shippingList = mockShipping().slice(0, 3)
			this.selectedId = '2'
		} else {
			this.shippingList = mockShipping().slice(0, 2)
			this.serviceList = mockShipping().slice(0, 2).map((row, i) => ({ ...row, id: 's-' + (i + 1) }))
		}
		if (options.state === 'empty') this.shippingList = []
		if (options.state === 'manage') this.manageMode = true
		if (options.state === 'delete') {
			this.manageMode = true
			this.pendingDeleteId = this.currentList[0] && this.currentList[0].id
			this.showDeleteDialog = true
		}
		this.layoutNav()
	},
	onShow() {
		this.layoutNav()
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
			goBackSmart({
				fallbackUrl: '/pages/meMore/settings',
				fallbackLaunch: 'redirectTo'
			})
		},
		onAddrBodyTap(row) {
			if (this.manageMode) return
			if (this.pickMode) {
				const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
				if (ch && ch.emit) {
					ch.emit('addressPicked', {
						id: row.id,
						name: row.name,
						phone: row.phone,
						detail: row.detail
					})
				}
				uni.navigateBack()
				return
			}
			this.onEdit(row)
		},
		onEdit(row) {
			if (this.manageMode) return
			uni.showToast({ title: '编辑：' + row.name, icon: 'none' })
		},
		onManage() {
			this.manageMode = !this.manageMode
		},
		onSetDefault(id) {
			const list = this.currentList.map((row) => ({ ...row, isDefault: row.id === id }))
			if (this.activeKind === 'shipping') this.shippingList = list
			else this.serviceList = list
		},
		onDelete(id) {
			if (this.currentList.length <= 1) {
				uni.showToast({ title: '至少保留一个地址', icon: 'none' })
				return
			}
			this.pendingDeleteId = id
			this.showDeleteDialog = true
		},
		closeDeleteDialog() {
			this.showDeleteDialog = false
			this.pendingDeleteId = null
		},
		confirmDeleteAddress() {
			const id = this.pendingDeleteId
			if (!id) return this.closeDeleteDialog()
			if (this.currentList.length <= 1) {
				this.closeDeleteDialog()
				return uni.showToast({ title: '至少保留一个地址', icon: 'none' })
			}
			const next = this.currentList.filter((row) => row.id !== id)
			if (!next.some((row) => row.isDefault) && next[0]) next[0].isDefault = true
			if (this.activeKind === 'shipping') this.shippingList = next
			else this.serviceList = next
			this.closeDeleteDialog()
		},
		onAdd() {
			const url = this.activeKind === 'shipping' ? '/pages/meMore/addShippingAddress' : '/pages/meMore/addServiceAddress'
			uni.navigateTo({ url })
		}
	}
}
</script>

<style scoped>
.address-page { height: 100vh; min-height: 100vh; width: 100%; display: flex; flex-direction: column; background: #f8f8f8; box-sizing: border-box; }
.nav-wrap { flex-shrink: 0; background: #f8f8f8; }
.nav-row { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 8rpx; box-sizing: border-box; }
.nav-side { min-width: 80rpx; display: flex; align-items: center; }
.nav-left { padding: 8rpx 24rpx 8rpx 16rpx; justify-content: center; }
.nav-back-icon { width: 20rpx; height: 36rpx; }
.sub-tabs { display: flex; align-items: center; justify-content: center; column-gap: 48rpx; padding: 8rpx 0 20rpx; box-sizing: border-box; }
.sub-tab { font-size: 32rpx; font-weight: 400; color: #b0b0b0; line-height: 44rpx; }
.sub-tab--active { color: #111111; font-weight: 700; }
.pick-hint { text-align: center; padding: 4rpx 0 16rpx; }
.pick-hint text { font-size: 28rpx; color: #888; line-height: 40rpx; }
.main-scroll { flex: 1; min-height: 0; width: 100%; box-sizing: border-box; }
.list-pad { padding: 0 24rpx 24rpx; padding-bottom: calc(24rpx + 120px + env(safe-area-inset-bottom)); box-sizing: border-box; }
.addr-card { display: flex; flex-direction: column; background: #ffffff; border-radius: 24rpx; padding: 28rpx 24rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04); box-sizing: border-box; }
.addr-main { display: flex; align-items: flex-start; }
.addr-pin { width: 64rpx; height: 64rpx; border-radius: 50%; background: #fff3e8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 20rpx; }
.addr-body { flex: 1; min-width: 0; padding-right: 12rpx; }
.addr-top { display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 12rpx; }
.addr-name { font-size: 30rpx; font-weight: 700; color: #111111; line-height: 42rpx; margin-right: 16rpx; }
.addr-phone { font-size: 28rpx; color: #666666; line-height: 40rpx; margin-right: 12rpx; }
.addr-default-tag { padding: 2rpx 12rpx; border-radius: 8rpx; border: 1rpx solid #d4a574; box-sizing: border-box; }
.addr-default-tag text { font-size: 22rpx; color: #b8860b; line-height: 30rpx; }
.addr-detail { font-size: 26rpx; color: #666666; line-height: 38rpx; }
.addr-edit { flex-shrink: 0; padding: 8rpx 0 8rpx 8rpx; display: flex; align-items: center; justify-content: center; }
.addr-manage-row { margin-top: 18rpx; }
.addr-manage-divider { height: 1rpx; background: #efefef; }
.addr-manage-main { height: 64rpx; display: flex; align-items: center; justify-content: space-between; }
.default-switch { display: inline-flex; align-items: center; }
.default-dot { width: 30rpx; height: 30rpx; border-radius: 50%; border: 2rpx solid #d8d8d8; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.default-dot--active { background: #ffe60f; border-color: #ffe60f; }
.default-label { margin-left: 10rpx; font-size: 30rpx; color: #9a9a9a; line-height: 42rpx; }
.addr-delete { display: inline-flex; align-items: center; }
.addr-delete-text { margin-left: 6rpx; font-size: 30rpx; color: #c8c8c8; line-height: 42rpx; }
.footer-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; align-items: center; column-gap: 20rpx; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #f8f8f8; box-sizing: border-box; z-index: 100; }
.footer-btn { height: 88rpx; border-radius: 44rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.footer-btn text { font-size: 30rpx; font-weight: 500; line-height: 42rpx; }
.footer-btn--ghost { width: 200rpx; flex-shrink: 0; background: #ececec; }
.footer-btn--ghost text { color: #333333; font-weight: 500; }
.footer-btn--primary { flex: 1; min-width: 0; background: #ffe60f; }
.footer-btn--primary text { color: #111111; }
.footer-plus { margin-right: 8rpx; font-size: 36rpx; font-weight: 500; line-height: 1; }
.delete-mask { position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 1000; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; padding: 48rpx; box-sizing: border-box; }
.delete-panel { width: 100%; max-width: 600rpx; background: #fff; border-radius: 28rpx; padding: 56rpx 40rpx 40rpx; box-shadow: 0 16rpx 48rpx rgba(0,0,0,.12); box-sizing: border-box; }
.delete-panel-msg { display: block; text-align: center; font-size: 32rpx; font-weight: 500; color: #222; line-height: 48rpx; }
.delete-panel-btns { margin-top: 48rpx; display: flex; align-items: center; column-gap: 24rpx; }
.delete-btn { flex: 1; min-width: 0; height: 88rpx; border-radius: 44rpx; display: flex; align-items: center; justify-content: center; }
.delete-btn text { font-size: 30rpx; font-weight: 500; color: #111; line-height: 42rpx; }
.delete-btn--cancel { background: #f2f2f2; }
.delete-btn--cancel text { color: #333; font-weight: 500; }
.delete-btn--danger { background: #ffe60f; }
.nav-title{display:none!important}.page-heading{height:44px;padding:0 15px;display:flex;align-items:center;font-size:17px;font-weight: 500;color:#222;box-sizing:border-box}
.footer-bar{bottom:56px;padding-bottom:8px}
.delete-panel{height:141px;transform:translateY(-38px);display:flex;flex-direction:column;justify-content:center}
.nav-row{position:relative}.nav-title{position:absolute;left:50%;transform:translateX(-50%);font-size:17px;font-weight: 500;color:#111}.list-pad{padding:10px 15px 100px}.addr-card{height:auto;min-height:78px;border-radius:10px;padding:12px;margin-bottom:8px;box-shadow:none}.addr-main{align-items:center}.addr-pin{width:20px;height:20px;margin-right:8px;background:transparent}.addr-body{padding-right:4px}.addr-top{margin-bottom:3px}.addr-name{font-size:12px;line-height:17px;margin-right:6px}.addr-phone{font-size:12px;line-height:17px;margin-right:4px}.addr-default-tag{padding:0 4px;border:0}.addr-default-tag text{font-size:8px;line-height:12px;color:#d49420}.addr-detail{font-size:10px;line-height:14px;color:#8e8e8e}.addr-edit{padding:3px}.addr-manage-row{margin-top:6px}.addr-manage-main{height:25px}.default-label,.addr-delete-text{font-size:10px;line-height:14px}.default-dot{width:12px;height:12px}.footer-bar{column-gap:8px;padding:8px 15px calc(8px + env(safe-area-inset-bottom))}.footer-btn{height:44px}.footer-btn text{font-size:13px}.footer-btn--ghost{width:43px}.footer-plus{font-size:17px}.pick-radio{width:16px;height:16px;flex:none;margin-right:8px;border:1px solid #d6d6d6;border-radius:50%;display:flex;align-items:center;justify-content:center}.pick-radio.selected{background:#ffe600;border-color:#ffe600}.pick-radio text{font-size:10px}.empty-state{height:520px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#222}.empty-title{margin-top:10px;font-size:13px}.empty-sub{margin-top:8px;font-size:10px;color:#a0a0a0}.delete-mask{padding:0;background:#d3d3d3}.delete-panel{width:313px;max-width:none;border-radius:12px;padding:22px 16px 14px;box-shadow:none}.delete-panel-msg{font-size:15px;line-height:22px}.delete-panel-btns{margin-top:25px;column-gap:18px}.delete-btn{height:32px;border-radius:16px}.delete-btn text{font-size:13px}
</style>
