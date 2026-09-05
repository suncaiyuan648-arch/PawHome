<template>
	<view class="address-page">
		<PawPageNav background="#f5f5f5" :fallback-url="returnUrl" @back="onPageBack" />
		<view class="page-heading">{{ activeKind === 'shipping' ? '收货地址' : '服务地址' }}</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
			<view v-if="currentList.length" class="list-pad">
				<view v-for="(row, i) in currentList" :key="row.id || 'a-' + i" :data-qa="`address-item-${row.id}`">
					<PawAddressCard :address="row" :mode="manageMode ? 'manage' : (pickMode ? 'select' : 'display')"
						:default-label="activeKind === 'shipping' ? '默认收货地址' : '默认服务地址'" @click="onAddrBodyTap(row)"
						@edit="onEdit(row)" @select="onSelectAddress" @set-default="onSetDefault" @delete="onDelete" />
				</view>
			</view>
			<PawEmptyState v-else class="address-empty-state" image="/static/figma/address-empty.svg" title="还没有地址"
				description="快去添加第一条地址吧" />
		</scroll-view>

		<view class="footer-bar">
			<view class="footer-btn footer-btn--ghost" data-qa="address-manage" @click="onManage">
				<text>{{ manageMode ? '完成' : '管理' }}</text>
			</view>
			<view class="footer-btn footer-btn--primary" data-qa="address-add" @click="onAdd">
				<text class="footer-plus">+</text>
				<text>{{ activeKind === 'shipping' ? '添加收货地址' : '添加服务地址' }}</text>
			</view>
		</view>

		<PawDialog v-model="showDeleteDialog" variant="destructive" title="确定要删除该地址吗" confirm-text="删除" cancel-text="取消"
			:show-cancel="true" :close-on-mask="false" @cancel="closeDeleteDialog" @confirm="confirmDeleteAddress" />
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import PawPageNav from '@/components/PawPageNav.vue'
import PawAddressCard from '@/components/form/PawAddressCard.vue'
import PawEmptyState from '@/components/feedback/PawEmptyState.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import { deleteAddress, getAddressList, setDefaultAddress } from '@/utils/addressMock.js'

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
	components: { PawPageNav, PawAddressCard, PawEmptyState, PawDialog },
	data() {
		return {
			activeKind: 'shipping',
			manageMode: false,
			shippingList: [],
			serviceList: [],
			showDeleteDialog: false,
			pendingDeleteId: null,
			pickMode: false,
			stateOverride: '',
			selectedAddressId: '',
			returnUrl: '/pages/meMore/settings'
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
		this.selectedAddressId = String(options.selectedId || '')
		this.returnUrl = this.decodeReturnUrl(options.returnUrl) || '/pages/meMore/settings'
		this.stateOverride = options.state || ''
		this.loadAddresses()
		if (this.stateOverride === 'empty') this.shippingList = []
		if (options.state === 'manage') this.manageMode = true
		if (options.state === 'delete') {
			this.manageMode = true
			this.pendingDeleteId = this.currentList[0] && this.currentList[0].id
			this.showDeleteDialog = true
		}
	},
	onShow() {
		if (this.stateOverride !== 'empty') this.loadAddresses()
	},
	methods: {
		decodeReturnUrl(value) {
			if (!value) return ''
			try { return decodeURIComponent(String(value)) || '' } catch (error) { return String(value) }
		},
		loadAddresses() {
			this.shippingList = getAddressList('shipping')
			this.serviceList = getAddressList('service')
		},
		onPageBack() {
			if (!this.pickMode || !this.selectedAddressId) return
			const selected = this.currentList.find(item => String(item.id) === this.selectedAddressId)
			if (selected) this.emitAddressPicked(selected)
		},
		emitAddressPicked(row) {
			const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
			if (channel && channel.emit) {
				channel.emit('addressPicked', {
					id: row.id,
					name: row.name,
					phone: row.phone,
					regionParts: row.regionParts || [],
					detail: row.detail,
					isDefault: row.isDefault === true
				})
			}
		},
		onAddrBodyTap(row) {
			if (this.manageMode) return
			if (this.pickMode) {
				this.emitAddressPicked(row)
				goBackSmart({
					fallbackUrl: this.returnUrl,
					fallbackLaunch: 'redirectTo'
				})
				return
			}
			this.onEdit(row)
		},
		onSelectAddress(row) {
			if (row) this.onAddrBodyTap(row)
		},
		onEdit(row) {
			if (this.manageMode) return
			this.openAddressPage(row)
		},
		onManage() {
			this.manageMode = !this.manageMode
		},
		onSetDefault(id) {
			const list = setDefaultAddress(id, this.activeKind)
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
			const next = deleteAddress(id, this.activeKind)
			if (this.activeKind === 'shipping') this.shippingList = next
			else this.serviceList = next
			this.closeDeleteDialog()
		},
		openAddressPage(row = null) {
			const path = this.activeKind === 'service'
				? '/pages/meMore/addServiceAddress'
				: '/pages/meMore/addShippingAddress'
			const query = row && row.id ? `?id=${encodeURIComponent(row.id)}` : ''
			uni.navigateTo({
				url: path + query,
				events: {
					addressSaved: (payload = {}) => this.onAddressPageSaved(payload)
				}
			})
		},
		onAddressPageSaved() {
			this.loadAddresses()
		},
		onAdd() {
			this.openAddressPage()
		}
	}
}
</script>

<style scoped>
.address-page {
	height: 100vh;
	min-height: 100vh;
	width: 100%;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	box-sizing: border-box;
}

.main-scroll {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.list-pad {
	padding: 10px 15px 24px;
	padding-bottom: calc(24px + 120px + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.footer-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	column-gap: 8px;
	padding: 8px 15px;
	padding-bottom: calc(8px + env(safe-area-inset-bottom));
	background: #fff;
	box-sizing: border-box;
	z-index: 100;
}

.footer-btn {
	height: 44px;
	border-radius: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.footer-btn text {
	font-size: 13px;
	font-weight: 500;
	line-height: 21px;
}

.footer-btn--ghost {
	width: 72px;
	flex-shrink: 0;
	background: #ececec;
}

.footer-btn--ghost text {
	color: #333333;
	font-weight: 500;
}

.footer-btn--primary {
	flex: 1;
	min-width: 0;
	background: #ffe60f;
}

.footer-btn--primary text {
	color: #111111;
}

.footer-plus {
	margin-right: 4px;
	font-size: 17px;
	font-weight: 500;
	line-height: 1;
}

.page-heading {
	height: 44px;
	padding: 0 15px;
	display: flex;
	align-items: center;
	font-size: 17px;
	font-weight: 500;
	color: #222;
	box-sizing: border-box;
}

.address-empty-state {
	height: 520px;
	display: flex;
	flex: 0 0 520px;
	min-height: 0;
	padding: 0 20px 10px;
	box-sizing: border-box;
}

.address-empty-state :deep(.paw-empty-state) {
	width: 100%;
	height: 100%;
	min-height: 0;
	padding: 0;
	box-sizing: border-box;
}

.address-empty-state :deep(.paw-empty-state__image) {
	width: 141px;
	height: 86px;
	flex: 0 0 86px;
}

.address-empty-state :deep(.paw-empty-state__title) {
	margin-top: 24.68px;
	color: #666;
	font-size: 14px;
	line-height: 20px;
}

.address-empty-state :deep(.paw-empty-state__description) {
	margin-top: 6px;
	color: #999;
	font-size: 12px;
	line-height: 17px;
}
</style>
