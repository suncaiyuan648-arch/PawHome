<template>
	<view class="page" :class="longMode ? 'page--long' : 'page--compact'">
		<PawPageNav :title="longMode ? '求助申请' : '领养申请'"
			background="linear-gradient(to bottom, #fffcdc 0%, #ffffff 100%)" fallback-url="/pages/index/index"
			:auto-back="false" :title-centered="true" @back="goBack" @layout="onNavLayout" />

		<scroll-view class="main-scroll" :style="mainScrollStyle" scroll-y :show-scrollbar="false" :bounces="false"
			:enable-flex="true">
			<view class="main-scroll-content">
				<view class="card">
					<textarea v-model="applyText" class="ta"
						:data-qa="rescueMode ? 'qa-rescue-apply-text' : 'qa-adoption-apply-text'" maxlength="500"
						:placeholder="longMode ? '真实的讲述这只流浪动物的情况...自己与这只流浪动物之间的故事...需要的救助基金用作什么用途...是否有问清楚合适的宠物医院价格...有证明材料证明吗...真实坦诚的语言更能打动投票人！' : '向院主说明你的情况，如年龄、身份、是否养过猫、是否已经和家里人商量好决定要领养了，这一点十分重要，避免头脑一热领养了几天后再次丢弃。'"
						placeholder-class="ta-ph"></textarea>
					<text class="counter">{{ applyText.length }}/500</text>
					<view class="media-row">
						<view v-for="(path, mi) in mediaPaths" :key="'m-' + mi" class="media-slot">
							<PawImage class="media-thumb" :src="path" display-mode="fixed" width="100%" height="100%"
								:radius="3" :preview="false" @click.stop="previewMedia(mi)" />
							<view class="media-remove" @click.stop="removeMedia(mi)"><text>×</text></view>
						</view>
						<PawUploadTile v-if="mediaPaths.length < maxMedia" class="media-add" size="" radius="3px"
							@select="onPickMedia">
							<image class="media-icon" src="/static/figma/publish/upload-media.svg" mode="aspectFit" />
							<text class="media-label">照片/视频</text>
						</PawUploadTile>
					</view>
				</view>

				<PawAdoptionPetsCard :title="longMode ? '申请救助的动物' : '申请领养的猫咪'" :pets="pets" :yard-name="yardName"
					:yard-avatar="yardAvatar" :min-height="longMode ? 201 : 296" :margin-bottom="longMode ? 10 : 12"
					:qa-prefix="rescueMode ? 'qa-rescue-apply-pet-' : 'qa-adoption-apply-pet-'" @add="addMoreCats"
					@pet-click="openPetDetail" @yard-click="openYardDetailPage" />
				<view v-if="longMode" class="help-form-card">
					<view v-for="row in helpFormRows" :key="row.label" class="help-form-row"
						:data-qa="'qa-rescue-apply-field-' + row.key" @tap="onHelpRowTap(row)">
						<text class="help-form-label">{{ row.label }}<text class="required">*</text></text>
						<view class="help-form-value" :class="{ amount: row.amount }">
							<input class="help-form-input" :class="{ 'help-form-input--amount': row.amount }"
								:value="row.value" :type="row.inputType || 'text'"
								:placeholder="row.placeholder || '请输入'"
								:placeholder-class="row.amount ? 'help-form-input-placeholder help-form-input-placeholder--amount' : 'help-form-input-placeholder'"
								:focus="activeHelpField === row.key" confirm-type="done" cursor-spacing="16"
								@tap.stop="focusHelpField(row)" @focus="activeHelpField = row.key"
								@blur="onHelpBlur(row)" @input="onHelpInput(row, $event)" />
							<view v-if="hasHelpValue(row)" class="help-form-icon-hit"
								:data-qa="'qa-rescue-apply-field-' + row.key + '-clear'"
								@tap.stop="clearHelpField(row)">
								<PawIcon name="navigation/form-clear" :size="16" aria-hidden="true" />
							</view>
							<view v-else class="help-form-icon-hit"
								:data-qa="'qa-rescue-apply-field-' + row.key + '-arrow'"
								@tap.stop="focusHelpField(row)">
								<PawIcon
									:name="row.amount ? 'navigation/form-amount-chevron' : 'navigation/form-chevron'"
									:size="16" aria-hidden="true" />
							</view>
						</view>
					</view>
				</view>
				<view v-if="longMode" class="help-notice"><uni-icons type="info" color="#999"
						:size="14"></uni-icons><text>感谢您的热心参与，请您如实填写真实身份、真实情况，这将为您赢得更多信任。同时提醒您，您需要对证实内容的真实性负责，如有不实，需承担相应法律责任。</text>
				</view>
			</view>
		</scroll-view>

		<PawFixedActionBar :stacked="longMode" :primary-full-width="true" :primary-action="submitAction"
			@primary="submit">
			<template #top>
				<view v-if="longMode" class="help-agreement help-agreement--fixed" data-qa="qa-rescue-apply-agreement"
					@tap="toggleAgreement">
					<PawCheckbox v-model="agreementChecked" size="small" inline />
					<text class="agreement-copy">已经阅读完 <text class="agreement-link">《隐私政策》、《用户协议》</text> 和 <text
							class="agreement-link">《发起救助承诺》</text></text>
				</view>
			</template>
		</PawFixedActionBar>

		<AdoptPickCatsSheet v-model="adoptPickSheetVisible" :yard-name="yardName" :yard-id="yardId"
			:owner-avatar="yardAvatar" :owner-paw-id="ownerPawId" :selected-pets="pets" :rescue-mode="rescueMode"
			return-to-apply @confirmed="syncPick" />
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { openYardDetail } from '@/utils/profileNav.js'
import {
	getAdoptionPick,
	addAdoption,
	setLastAdoptionId,
	clearAdoptionPick
} from '@/utils/adoptionStorage.js'
import { createRescue } from '@/utils/rescueStorage.js'
import AdoptPickCatsSheet from '@/components/AdoptPickCatsSheet.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawCheckbox from '@/components/base/PawCheckbox.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawUploadTile from '@/components/form/PawUploadTile.vue'

export default {
	components: {
		AdoptPickCatsSheet,
		PawAdoptionPetsCard,
		PawPageNav,
		PawFixedActionBar,
		PawCheckbox,
		PawImage,
		PawIcon,
		PawUploadTile
	},
	data() {
		return {
			applyText: '',
			pets: [
				{ id: 'pet-orange', name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png' },
				{ id: 'pet-dog', name: '呗呗', avatar: '/static/figma/adoption-flow/apply-dog.png' }
			],
			yardName: '我就是要喂猫',
			yardId: '1',
			yardAvatar: '/static/avatar.png',
			ownerPawId: 'yard_card_owner',
			mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
			maxMedia: 6,
			longMode: false,
			rescueMode: false,
			designApplied: false,
			helpFormRows: [
				{ key: 'amount', label: '求助金额', value: '', placeholder: '￥0.00', inputType: 'digit', amount: true },
				{ key: 'receiver', label: '收款微信账户', value: '13900000000', inputType: 'number' },
				{ key: 'name', label: '发起人姓名', value: '马冬梅' },
				{ key: 'age', label: '发起人年龄', value: '20', inputType: 'number' },
				{ key: 'identity', label: '发起人身份', value: '学生' },
				{ key: 'location', label: '发起人所在地', value: '安徽省合肥市蜀山区海恒社区' }
			],
			adoptPickSheetVisible: false,
			agreementChecked: false,
			activeHelpField: '',
			navHeight: 64
		}
	},
	onLoad(query = {}) {
		this.longMode = query.state === 'long'
		this.rescueMode = this.longMode && String(query.source || '') === 'rescue'
		this.applyDesignState()
		this.syncPick()
	},
	onShow() {
		this.applyDesignState()
		this.syncPick()
	},
	computed: {
		mainScrollStyle() {
			return { height: `calc(100vh - ${this.navHeight}px)` }
		},
		submitAction() {
			return {
				key: 'submit',
				label: this.longMode ? '提交' : '发送申请',
				qa: this.rescueMode ? 'qa-rescue-apply-submit' : 'qa-adoption-apply-submit',
				disabled: !this.canSubmit
			}
		},
		canSubmit() {
			return Boolean((this.applyText || '').trim() && this.pets.length && (!this.rescueMode || this.agreementChecked))
		}
	},
	methods: {
		onNavLayout(layout = {}) {
			if (layout.totalHeight) this.navHeight = Number(layout.totalHeight)
		},
		applyDesignState() {
			if (this.designApplied) return
			this.designApplied = true
			this.mediaPaths = ['/static/figma/adoption-flow/04a93fa17267335f49e6e818f8caa78dd3afc80b.png', '/static/figma/adoption-flow/b61b026ea991c01c6257c909021245fd64956837.png']
			this.yardAvatar = '/static/figma/home/yard-avatar.png'
			this.pets = [
				{ id: 'pet-orange', name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png' },
				{ id: 'pet-dog', name: '呗呗', avatar: '/static/figma/adoption-flow/apply-dog.png' }
			]
			if (this.longMode) {
				this.pets = [
					{ id: 'pet-orange', name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png' },
					{ id: 'pet-dog', name: '呗呗', avatar: '/static/figma/adoption-flow/apply-dog.png' }
				]
				this.yardAvatar = '/static/figma/adoption-flow/pet-owner.png'
			}
		},
		syncPick() {
			const pick = getAdoptionPick()
			if (pick.pets && pick.pets.length) {
				this.pets = pick.pets.map((pet) => ({ ...pet }))
				this.yardName = pick.yardName || pick.ownerName || this.yardName
				this.yardAvatar = pick.ownerAvatar || this.yardAvatar
				if (pick.yardId) this.yardId = pick.yardId
				if (pick.ownerPawId) this.ownerPawId = pick.ownerPawId
			}
		},
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		openYardDetailPage() {
			openYardDetail({ yardId: this.yardId || '1', yardName: this.yardName })
		},
		openPetDetail(pet, index) {
			if (!pet) return
			const petId = pet.id || pet.petId || ''
			const params = [
				`idx=${index}`,
				petId && `petId=${encodeURIComponent(petId)}`,
				`yardName=${encodeURIComponent(this.yardName || '')}`,
				`yardId=${encodeURIComponent(this.yardId || '')}`
			].filter(Boolean).join('&')
			uni.navigateTo({ url: `/pages/adoption/petDetail?${params}` })
		},
		previewMedia(index) {
			const urls = this.mediaPaths.filter((u) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(u || ''))
			if (!urls.length) {
				uni.showToast({ title: '视频请在相册中查看', icon: 'none' })
				return
			}
			const cur = this.mediaPaths[index]
			const current = /\.(png|jpe?g|gif|webp|bmp)$/i.test(cur || '') ? cur : urls[0]
			uni.previewImage({
				current,
				urls
			})
		},
		removeMedia(index) {
			this.mediaPaths.splice(index, 1)
		},
		onPickMedia() {
			const remain = this.maxMedia - this.mediaPaths.length
			if (remain <= 0) {
				uni.showToast({ title: '最多上传' + this.maxMedia + '个文件', icon: 'none' })
				return
			}
			const onOk = (paths) => {
				this.mediaPaths = this.mediaPaths.concat(paths).slice(0, this.maxMedia)
				if (paths.length) uni.showToast({ title: '已添加', icon: 'none' })
			}
			// #ifdef MP-WEIXIN
			uni.chooseMedia({
				count: Math.min(remain, 9),
				mediaType: ['image', 'video'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const paths = (res.tempFiles || []).map((f) => f.tempFilePath)
					onOk(paths)
				},
				fail: () => { }
			})
			// #endif
			// #ifndef MP-WEIXIN
			uni.chooseImage({
				count: Math.min(remain, 9),
				sourceType: ['album', 'camera'],
				success: (res) => onOk(res.tempFilePaths || [])
			})
			// #endif
		},
		addMoreCats() {
			this.adoptPickSheetVisible = true
		},
		toggleAgreement() {
			this.agreementChecked = !this.agreementChecked
		},
		onHelpRowTap(row) {
			this.focusHelpField(row)
		},
		focusHelpField(row) {
			const key = row && row.key
			if (!key) return
			if (this.activeHelpField === key) return
			this.activeHelpField = ''
			this.$nextTick(() => {
				this.activeHelpField = key
			})
		},
		onHelpBlur(row) {
			if (row && this.activeHelpField === row.key) this.activeHelpField = ''
		},
		onHelpInput(row, event) {
			if (!row) return
			row.value = event && event.detail ? event.detail.value || '' : ''
		},
		hasHelpValue(row) {
			return Boolean(row && String(row.value || '').trim())
		},
		clearHelpField(row) {
			if (!row) return
			row.value = ''
			if (this.activeHelpField === row.key) this.activeHelpField = ''
		},
		submit() {
			const t = (this.applyText || '').trim()
			if (!t) {
				uni.showToast({ title: '请填写申请说明', icon: 'none' })
				return
			}
			if (!this.pets.length) {
				uni.showToast({ title: '请先选择猫咪', icon: 'none' })
				return
			}
			if (this.rescueMode && !this.agreementChecked) {
				uni.showToast({ title: '请先阅读并同意相关协议', icon: 'none' })
				return
			}
			if (this.rescueMode) {
				const amountRow = this.helpFormRows.find((row) => row.amount)
				const amount = Number(String(amountRow && amountRow.value || '').replace(/[^\d.]/g, '')) || 0
				if (!amount) {
					uni.showToast({ title: '请选择求助金额', icon: 'none' })
					return
				}
				const rescue = createRescue({
					status: 'pending',
					statusText: '待投票',
					applicant: {
						id: this.ownerPawId,
						name: '马冬梅',
						avatar: this.yardAvatar,
					},
					amount,
					receiver: {
						name: '马冬梅',
						account: (this.helpFormRows.find((row) => row.label === '收款微信账户') || {}).value || '',
					},
					media: [...this.mediaPaths],
					animals: this.pets.map((p, index) => ({
						...p,
						id: p.id || p.petId || 'rescue-pet-' + index,
					})),
					evidenceCount: 0,
					proofList: [],
					description: t,
					applyText: t,
					createdAt: Date.now(),
				})
				if (!rescue || !rescue.id) {
					uni.showToast({ title: '救助申请保存失败，请重试', icon: 'none' })
					return
				}
				clearAdoptionPick()
				uni.redirectTo({
					url: '/pages/yard/rescueReview?rescueId=' + encodeURIComponent(rescue.id),
				})
				return
			}
			const draftId = 'ad-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
			const rec = {
				id: draftId,
				recordId: draftId,
				status: 'pending',
				applyText: t,
				mediaPaths: [...this.mediaPaths],
				pets: this.pets.map((p, index) => ({
					...p,
					id: p.id || p.petId || 'pet-' + index,
					avatar: p.avatar || '/static/home-feed-1.png',
					disabled: false
				})),
				yardName: this.yardName,
				yardId: this.yardId,
				ownerName: this.yardName,
				yardTag: '小院',
				ownerAvatar: this.yardAvatar,
				ownerPawId: this.ownerPawId,
				applicantName: '逢猫',
				createdAt: Date.now()
			}
			const saved = addAdoption(rec)
			if (!saved || !saved.id) {
				uni.showToast({ title: '申请保存失败，请重试', icon: 'none' })
				return
			}
			setLastAdoptionId(saved.id)
			clearAdoptionPick()
			uni.redirectTo({
				url: '/pages/adoption/adoptApplySuccess?recordId=' + encodeURIComponent(saved.id)
			})
		}
	}
}
</script>

<style lang="less" scoped>
.page {
	position: relative;
	height: 100vh;
	min-height: 100vh;
	width: 100%;
	background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}

.main-scroll {
	flex: 0 0 auto;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.main-scroll-content {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	min-height: 100%;
	padding: 16px 15px 88px;
	box-sizing: border-box;
}

.page--long .main-scroll-content {
	padding-bottom: 132px;
}

.card {
	width: 100%;
	flex: 0 0 auto;
	background: #fff;
	border-radius: 10px;
	padding: 14px;
	margin-bottom: 10px;
}

.card:not(.card--second) {
	height: 285px;
	padding: 10px;
	overflow: hidden;
	box-sizing: border-box;
}

.ta {
	width: 100%;
	min-height: 110px;
	height: 110px;
	font-size: 15px;
	color: #222;
	line-height: 1.5;
	box-sizing: border-box;
}

.card:not(.card--second) .ta {
	width: calc(100% - 7px);
	margin-left: 7px;
}

.ta-ph {
	color: #bbb;
}

.media-add {
	flex: 1 1 0;
	width: 0;
	min-width: 0;
	aspect-ratio: 1 / 1;
	background: #f5f5f5;
	border-radius: 3px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-sizing: border-box;
}

.media-icon {
	display: block;
	width: 21px;
	height: 21px;
}

.media-label {
	font-size: 11px;
	color: #8d8d92;
	margin-top: 4px;
	line-height: 19px;
}

.counter {
	display: block;
	text-align: right;
	font-size: 12px;
	color: #999;
	margin-top: 4px;
}

.media-row {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 2px;
	margin-top: 19px;
}

.media-slot {
	position: relative;
	flex: 1 1 0;
	width: 0;
	min-width: 0;
	aspect-ratio: 1 / 1;
	border-radius: 3px;
	overflow: hidden;
	background: #f0f0f0;
}

.media-thumb {
	width: 100%;
	height: 100%;
	display: block;
}

.media-remove {
	display: none !important;
	position: absolute;
	top: 4px;
	right: 4px;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.45);
	display: none;
	align-items: center;
	justify-content: center;
}

.media-remove text {
	color: #fff;
	font-size: 14px;
	line-height: 1;
}

.help-form-card {
	margin-bottom: 9px;
	padding: 8px 12px;
	background: #fff;
	border-radius: 8px;
}

.help-form-row {
	min-height: 58px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	border-bottom: 1px solid #f6f8fa;
	font-size: 14px;
	color: #282827;
	box-sizing: border-box;
}

.help-form-row:last-child {
	border-bottom: none;
}

.help-form-label {
	flex: 0 0 auto;
	font-weight: 500;
	white-space: nowrap;
}

.help-form-value {
	display: flex;
	min-width: 0;
	flex: 1 1 auto;
	min-height: 22px;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	font-weight: 500;
	text-align: right;
}

.help-form-input {
	display: block;
	width: 0;
	min-width: 0;
	flex: 1 1 auto;
	height: 22px;
	min-height: 22px;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	color: inherit;
	font-family: inherit;
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	text-align: right;
	white-space: nowrap;
}

.help-form-input-placeholder {
	color: #999;
}

.help-form-input-placeholder--amount {
	color: #f33;
}

.help-form-icon-hit {
	display: flex;
	width: 16px;
	min-width: 16px;
	height: 22px;
	flex: 0 0 16px;
	align-items: center;
	justify-content: center;
}

.help-form-icon-hit :deep(.paw-icon) {
	flex: 0 0 auto;
}

.help-form-value.amount {
	color: #e53935;
	font-weight: 500;
}

.required,
.amount {
	color: #f33;
}

.help-notice {
	display: flex;
	align-items: flex-start;
	gap: 4px;
	padding: 2px 0 9px;
	color: #999;
	font-size: 12px;
	font-weight: 300;
	line-height: 16px;
}

.help-notice text {
	flex: 1;
	font-weight: 300;
}

.help-agreement {
	display: flex;
	align-items: center;
	gap: 1px;
	background: #fff;
	color: #666;
	font-size: 12px;
	line-height: 17px;
}

.help-agreement--fixed {
	width: 100%;
	box-sizing: border-box;
}

.agreement-copy {
	min-width: 0;
	flex: 1 1 auto;
}

.agreement-link {
	color: #517ddb;
}
</style>

<style>
.help-form-input-placeholder.help-form-input-placeholder--amount {
	color: #f33;
}
</style>
