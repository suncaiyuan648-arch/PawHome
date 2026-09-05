<template>
  <view class="aps-host" :data-qa="rescueMode ? 'qa-rescue-apply-pick-sheet' : 'qa-adoption-pick-sheet'">
    <PawDialog v-if="!rescueMode" v-model="quotaDialogVisible" title="领养额度不足" :message="quotaDialogMessage"
      confirm-text="我知道了" :close-on-mask="true" :z-index="10080" />
    <PawBottomSheet v-model="modelValueProxy" variant="adoption-pick" height="495px" :close-on-mask="true"
      :safe-area="false" :z-index="10060" @after-close="onAfterClose">
      <view class="aps-sheet-inner" @tap.stop>
        <view class="aps-head">
          <view class="aps-head-side"></view>
          <text class="aps-title">{{ rescueMode ? '选择需要救助的动物' : '唯有以领养终止流浪' }}</text>
          <view class="aps-close-hit" @tap="close">
            <PawIcon name="navigation/close" :size="16" label="关闭" />
          </view>
        </view>
        <text class="aps-sub">{{ rescueMode ? '选择您想要救助的小咪' : '选择您想要领走的小咪' }}</text>
        <scroll-view class="aps-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
          <view class="aps-grid">
            <view v-for="(c, i) in catOptions" :key="c.id" class="aps-cell"
              :class="{ 'aps-cell--disabled': c.disabled }" :data-selected="selectedIds.includes(i)">
              <view v-if="!c.disabled" class="aps-av-hit" @tap.stop="openPetDetail(i)">
                <view class="aps-ring" :class="{
                  'aps-ring--on': selectedIds.includes(i),
                  'aps-ring--off': !selectedIds.includes(i),
                }">
                  <PawImage class="aps-img" :src="c.avatar" display-mode="fixed" width="100%" height="100%" radius="50%"
                    :preview="false" @click="openPetDetail(i)" />
                </view>
              </view>
              <view v-else class="aps-av-hit" @tap.stop="onDisabledPetTap">
                <view class="aps-ring aps-ring--dim">
                  <PawImage class="aps-img" :src="c.avatar" display-mode="fixed" width="100%" height="100%" radius="50%"
                    :preview="false" @click="onDisabledPetTap" />
                </view>
              </view>
              <view class="aps-name-hit" @tap.stop="toggleSelect(i)">
                <text class="aps-name" :class="{ 'aps-name--dim': c.disabled }">{{ c.name }}</text>
              </view>
              <text v-if="!rescueMode" class="aps-price">￥{{ c.price }}</text>
            </view>
          </view>
        </scroll-view>
        <text v-if="!rescueMode" class="aps-balance">我的剩余领养额度：￥{{ availableAdoptionQuota }}</text>
        <view class="aps-footer">
          <button class="aps-btn" :data-qa="rescueMode ? 'qa-rescue-apply-pick-confirm' : 'qa-adoption-pick-confirm'"
            :disabled="selectedIds.length === 0" @tap="onConfirm">
            我选好了
          </button>
        </view>
      </view>
    </PawBottomSheet>
  </view>
</template>

<script>
import { getAdoptionPick, setAdoptionPick } from '@/utils/adoptionStorage.js'
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawImage from '@/components/base/PawImage.vue'

const DEFAULT_IMG = '/static/home-feed-1.png'
const DEFAULT_CATS = [
  { id: 'pet-orange', name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png', price: 20, disabled: false },
  { id: 'pet-dog', name: '呗呗', avatar: '/static/figma/adoption-flow/apply-dog.png', price: 20, disabled: false },
  { id: 'pet-black-white', name: '小黑白', avatar: '/static/figma/pets/pet-black-white.png', price: 15, disabled: true },
  { id: 'pet-available-later-1', name: '小橘', avatar: '/static/figma/pets/pet-orange.png', price: 15, disabled: true },
  { id: 'pet-available-later-2', name: '小花', avatar: '/static/figma/pets/pet-dog.png', price: 15, disabled: true },
  { id: 'pet-available-later-3', name: '小白', avatar: DEFAULT_IMG, price: 15, disabled: true },
  { id: 'pet-available-later-4', name: '小虎', avatar: DEFAULT_IMG, price: 15, disabled: true },
]

export default {
  name: 'AdoptPickCatsSheet',
  components: { PawBottomSheet, PawDialog, PawIcon, PawImage },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    yardName: {
      type: String,
      default: '我就是要喂猫',
    },
    yardId: {
      type: String,
      default: '1',
    },
    ownerAvatar: {
      type: String,
      default: '/static/avatar.png',
    },
    ownerPawId: {
      type: String,
      default: 'yard_card_owner',
    },
    /** 可由真实小院数据传入；不传时使用独立的 Figma 内容素材演示数据。 */
    cats: {
      type: Array,
      default: null,
    },
    /** 重新打开选猫面板时用于回填的宠物列表。 */
    selectedPets: {
      type: Array,
      default: () => [],
    },
    maxSelection: {
      type: Number,
      default: 6,
    },
    /** 当前用户可用于本次领养申请的额度。 */
    availableQuota: {
      type: [Number, String],
      default: 234,
    },
    rescueMode: {
      type: Boolean,
      default: false,
    },
    /** 从领养申请页「+」进入：确认后仅写入缓存并交给上层关闭 */
    returnToApply: {
      type: Boolean,
      default: false,
    },
    figmaMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'close', 'confirmed'],
  computed: {
    modelValueProxy: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
    catOptions() {
      const source = Array.isArray(this.cats) && this.cats.length ? this.cats : DEFAULT_CATS
      return source.map((cat, index) => ({
        ...cat,
        id: String(cat.id || cat.petId || cat.key || 'pet-' + index),
        name: cat.name || '猫咪',
        avatar: cat.avatar || DEFAULT_IMG,
        price: this.normalizeAdoptionValue(cat.adoptionValue === undefined || cat.adoptionValue === null
          ? cat.price
          : cat.adoptionValue),
        disabled: Boolean(cat.disabled),
      }))
    },
    availableAdoptionQuota() {
      return this.normalizeAdoptionValue(this.availableQuota)
    },
    selectedValue() {
      return this.selectedIds.reduce((total, index) => total + this.normalizeAdoptionValue(this.catOptions[index] && this.catOptions[index].price), 0)
    },
    quotaDialogMessage() {
      return `已选动物价值合计￥${this.selectedValue}，超出当前可领养额度￥${this.availableAdoptionQuota}，请提升可领养额度后再试。`
    },
  },
  data() {
    return {
      selectedIds: [0, 1],
      quotaDialogVisible: false,
    }
  },
  watch: {
    modelValue(v) {
      if (v) this.resetLocalState()
    },
  },
  methods: {
    normalizeAdoptionValue(value) {
      const number = Number(value)
      return Number.isFinite(number) && number > 0 ? number : 0
    },
    showQuotaInsufficient() {
      this.quotaDialogVisible = true
    },
    resetLocalState() {
      const savedPick = getAdoptionPick()
      const sameYard = !savedPick.yardId || String(savedPick.yardId) === String(this.yardId)
      const source = this.selectedPets.length
        ? this.selectedPets
        : sameYard && Array.isArray(savedPick.pets)
          ? savedPick.pets
          : []
      const picked = []
      source.forEach((pet) => {
        const index = typeof pet === 'number'
          ? pet
          : this.catOptions.findIndex((cat) => {
            const petId = pet && (pet.id || pet.petId || pet.key)
            if (petId && String(petId) === cat.id) return true
            return pet && pet.name === cat.name && (!pet.avatar || pet.avatar === cat.avatar)
          })
        if (index >= 0 && !this.catOptions[index].disabled && !picked.includes(index)) picked.push(index)
      })
      this.selectedIds = picked.length
        ? picked.slice(0, this.maxSelection)
        : this.catOptions
          .map((cat, index) => (cat.disabled ? -1 : index))
          .filter((index) => index >= 0)
          .slice(0, 2)
    },
    close() {
      this.$emit('update:modelValue', false)
    },
    onAfterClose() {
      this.$emit('close')
    },
    openPetDetail(i) {
      const c = this.catOptions[i]
      if (!c || c.disabled) return
      const params = [
        `idx=${i}`,
        `petId=${encodeURIComponent(c.id)}`,
        `yardName=${encodeURIComponent(this.yardName || '')}`,
        `yardId=${encodeURIComponent(this.yardId || '')}`
      ].join('&')
      uni.navigateTo({ url: `/pages/adoption/petDetail?${params}` })
    },
    onDisabledPetTap() {
      uni.showToast({ title: '该猫咪暂不可选', icon: 'none' })
    },
    toggleSelect(i) {
      const c = this.catOptions[i]
      if (!c) return
      if (c.disabled) {
        this.onDisabledPetTap()
        return
      }
      let next = [...this.selectedIds]
      const pos = next.indexOf(i)
      if (pos >= 0) next.splice(pos, 1)
      else {
        if (next.length >= this.maxSelection) {
          uni.showToast({ title: '最多选择 6 只', icon: 'none' })
          return
        }
        const nextValue = next.reduce((total, index) => total + this.normalizeAdoptionValue(this.catOptions[index] && this.catOptions[index].price), 0)
          + this.normalizeAdoptionValue(c.price)
        if (!this.rescueMode && nextValue > this.availableAdoptionQuota) {
          this.showQuotaInsufficient()
          return
        }
        next.push(i)
      }
      this.selectedIds = next
    },
    onConfirm() {
      if (this.selectedIds.length === 0) return
      if (!this.rescueMode && this.selectedValue > this.availableAdoptionQuota) {
        this.showQuotaInsufficient()
        return
      }
      const picked = [...this.selectedIds]
        .sort((a, b) => a - b)
        .map((i) => ({
          ...this.catOptions[i],
          disabled: false,
        }))
      const payload = {
        pets: picked,
        selectedPetIds: picked.map((pet) => pet.id),
        selectedIndices: [...this.selectedIds].sort((a, b) => a - b),
        yardName: this.yardName,
        ownerName: this.yardName,
        ownerAvatar: this.ownerAvatar,
        yardId: this.yardId,
        ownerPawId: this.ownerPawId,
      }
      setAdoptionPick(payload)
      this.$emit('confirmed', payload)
      this.$emit('update:modelValue', false)
      if (this.returnToApply) return
      uni.navigateTo({ url: '/pages/adoption/adoptApply' })
    },
  },
}
</script>

<style lang="less" scoped>
.aps-sheet-inner {
  display: flex;
  width: 100%;
  height: 495px;
  min-height: 0;
  flex-direction: column;
  box-sizing: border-box;
}

.aps-head {
  display: flex;
  flex: 0 0 90px;
  align-items: flex-start;
  width: 100%;
  height: 90px;
  padding: 7px 12px 0;
  box-sizing: border-box;
}

.aps-head-side,
.aps-close-hit {
  width: 32px;
  flex: 0 0 32px;
}

.aps-close-hit {
  display: flex;
  height: 32px;
  align-items: center;
  justify-content: center;
}

.aps-title {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  color: #111;
  font-size: 17px;
  font-weight: 700;
  line-height: 23px;
  text-align: center;
  white-space: nowrap;
}

.aps-sub {
  display: block;
  flex: 0 0 auto;
  padding: 0 20px 20px;
  color: #555;
  font-size: 14px;
  line-height: 20px;
}

.aps-scroll {
  display: block;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.aps-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding: 0 15px 8px;
  box-sizing: border-box;
}

.aps-cell {
  display: flex;
  width: 16.666%;
  margin-bottom: 26px;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.aps-av-hit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.aps-ring {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: 3px solid transparent;
  border-radius: 50%;
  background: #fff;
  box-sizing: border-box;
}

.aps-ring--on {
  border-color: #ffdd00;
}

.aps-ring--dim {
  border-color: #f0f0f0;
  opacity: 0.45;
}

.aps-img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #eee;
}

.aps-name-hit {
  display: flex;
  max-width: 100%;
  min-height: 16px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding: 0 2px;
  box-sizing: border-box;
}

.aps-name,
.aps-price {
  display: block;
  color: #111;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
}

.aps-name--dim,
.aps-price {
  color: #999;
}

.aps-balance {
  display: block;
  flex: 0 0 auto;
  margin: 0 0 12px;
  color: #999;
  font-size: 12px;
  line-height: 17px;
  text-align: center;
}

.aps-footer {
  display: flex;
  flex: 0 0 auto;
  padding: 0 15px 43px;
  box-sizing: border-box;
}

.aps-btn {
  display: flex;
  width: 100%;
  height: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 22px;
  background: #ffdd00;
  color: #111;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  box-sizing: border-box;
  white-space: nowrap;
}

.aps-btn::after {
  border: 0;
}

.aps-btn[disabled] {
  opacity: 0.45;
}
</style>
