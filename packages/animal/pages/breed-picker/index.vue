<template>
	<view class="page">
		<PawPageNav background="#f5f5f5" :auto-back="false" @back="goBack">
			<template #content>
				<view class="search-bar">
					<PawIcon name="navigation/search" :size="18" label="搜索" />
					<input class="search-input" type="text" :value="searchKey" :placeholder="searchPlaceholder"
						placeholder-class="search-ph" @input="onSearchInput" />
				</view>
			</template>
		</PawPageNav>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
			<view class="list-card">
				<view v-if="filteredBreeds.length === 0 && searchKey.trim()" class="list-empty">
					<text>暂无匹配品种</text>
				</view>
				<template v-for="(b, i) in filteredBreeds" :key="'b-' + i + '-' + b">
					<view class="list-item" @click="selectBreed(b)">
						<text class="list-txt">{{ b }}</text>
						<text v-if="b === selected" class="list-check">✓</text>
					</view>
					<view class="list-divider" aria-hidden="true"></view>
				</template>
				<view class="sup-row" @click="openSupplement">
					<text class="sup-txt">看来还没有人输入过这个品种，帮我们补充吧！</text>
					<PawIcon name="navigation/form-chevron" :size="12" label="补充品种" />
				</view>
			</view>
		</scroll-view>

		<PawDialog v-model="showSup" variant="breed-supplement" :title="supDialogTitle" :show-cancel="true"
			cancel-text="取消" confirm-text="提交" :confirm-enabled="!!supInputTrim" :close-on-mask="true"
			:auto-close="false" @confirm="submitSupplement" @cancel="closeSupplement">
			<input class="breed-supplement-input" type="text" :value="supInput" placeholder="请输入"
				placeholder-class="breed-supplement-placeholder" @input="onSupInput" />
		</PawDialog>

		<PawDialog v-model="showSupResult" variant="breed-supplement-result" title="提交成功"
			message="我们已收到您补充的品种，会尽快补充，最快1小时内补充上去；您可以先选择其他品种，稍后重新选择，补充后将不会另行通知您" confirm-text="好的"
			:close-on-mask="false" @confirm="onSupResultOk" />
	</view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'

const BASE_CAT = ['白猫', '橘猫', '狸花猫', '三花猫', '简州猫', '奶牛猫', '英短', '美短']
const BASE_DOG = ['中华田园犬', '比熊', '哈士奇', '阿拉斯加', '萨摩耶', '泰迪', '柴犬', '柯基']

export default {
	components: { PawPageNav, PawIcon, PawDialog },
	data() {
		return {
			kind: 'cat',
			searchKey: '',
			customList: [],
			selected: '',
			showSup: false,
			supInput: '',
			showSupResult: false,
			pendingSupBreed: ''
		}
	},
	computed: {
		supInputTrim() {
			return (this.supInput || '').trim()
		},
		searchPlaceholder() {
			return this.kind === 'dog' ? '输入狗狗品种' : '输入猫咪品种'
		},
		supDialogTitle() {
			return this.kind === 'dog' ? '补充狗狗品种' : '补充猫咪品种'
		},
		allBreeds() {
			const base = this.kind === 'dog' ? [...BASE_DOG] : [...BASE_CAT]
			const merged = [...base, ...this.customList]
			return [...new Set(merged)]
		},
		filteredBreeds() {
			const q = (this.searchKey || '').trim()
			if (!q) return this.allBreeds
			return this.allBreeds.filter((b) => b.includes(q))
		}
	},
	onLoad(query) {
		this.kind = query && (query.species === 'dog' || query.kind === 'dog') ? 'dog' : 'cat'
		const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
		if (ch && typeof ch.on === 'function') {
			ch.on('initBreed', (payload = {}) => {
				const b = (payload.breed || '').trim()
				if (!b) return
				this.selected = b
				const base = this.kind === 'dog' ? BASE_DOG : BASE_CAT
				if (base.indexOf(b) === -1 && this.customList.indexOf(b) === -1) {
					this.customList = [b, ...this.customList]
				}
			})
		}
		if (query && query.popup === 'supplement') {
			this.supInput = '非洲猫'
			this.showSup = true
		}
		if (query && query.popup === 'supplement-input') {
			this.supInput = ''
			this.showSup = true
		}
		if (query && query.popup === 'supplement-success') this.showSupResult = true
	},
	methods: {
		emitPick(breed) {
			const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
			if (ch && typeof ch.emit === 'function') {
				ch.emit('breedPicked', { breed })
			}
			uni.navigateBack()
		},
		goBack() {
			uni.navigateBack()
		},
		onSearchInput(e) {
			this.searchKey = e.detail.value || ''
		},
		onSupInput(e) {
			this.supInput = e.detail.value || ''
		},
		selectBreed(b) {
			this.selected = b
			this.emitPick(b)
		},
		openSupplement() {
			this.supInput = ''
			this.showSup = true
		},
		closeSupplement() {
			this.showSup = false
			this.supInput = ''
		},
		submitSupplement() {
			const v = this.supInputTrim
			if (!v) return
			this.pendingSupBreed = v
			this.closeSupplement()
			this.showSupResult = true
		},
		onSupResultOk() {
			const v = (this.pendingSupBreed || '').trim()
			this.showSupResult = false
			this.pendingSupBreed = ''
			if (!v) return
			if (this.customList.indexOf(v) === -1) this.customList.push(v)
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	box-sizing: border-box;
}

.search-bar {
	flex: 1;
	min-width: 0;
	height: 32px;
	border-radius: 16px;
	background: #fff;
	display: flex;
	align-items: center;
	padding: 0 10px;
	column-gap: 6px;
	box-sizing: border-box;
}

.search-input {
	flex: 1;
	min-width: 0;
	font-size: 14px;
	color: #333;
	line-height: 20px;
	height: 32px;
}

.search-ph {
	color: #b0b0b0;
	font-size: 14px;
}

.main-scroll {
	flex: 1;
	height: 0;
	width: 100%;
	box-sizing: border-box;
}

.list-card {
	margin: 0 12px 12px;
	background: #fff;
	border-radius: 10px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 14px 14px 18px;
	box-sizing: border-box;
}

.list-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 22px;
	box-sizing: border-box;
}

.list-divider {
	width: 100%;
	height: 0.5px;
	flex: 0 0 0.5px;
	background: #f5f5f5;
}

.list-empty {
	padding: 20px 14px;
	text-align: center;
}

.list-empty text {
	font-size: 14px;
	color: #b0b0b0;
	line-height: 20px;
}

.list-txt {
	font-size: 16px;
	color: #222;
	line-height: 22px;
}

.list-check {
	font-size: 16px;
	color: #111;
	font-weight: 700;
	line-height: 22px;
}

.sup-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 19px;
	box-sizing: border-box;
}

.sup-txt {
	flex: 1;
	margin-right: 8px;
	font-size: 13px;
	color: #a8a8a8;
	line-height: 19px;
}

.breed-supplement-input {
	display: block;
	width: calc(100% - 40px);
	height: 72px;
	margin: 20px 20px;
	padding: 0 12px;
	box-sizing: border-box;
	border-radius: 8px;
	background: #f2f2f2;
	color: #222;
	font-size: 16px;
	font-weight: 700;
	line-height: 72px;
	text-align: center;
}

.breed-supplement-placeholder {
	color: #b8b8b8;
	font-size: 16px;
	font-weight: 400;
	line-height: 72px;
	text-align: center;
}
</style>
