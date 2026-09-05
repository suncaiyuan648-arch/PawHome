<template>
  <view class="paw-adoption-pets-card" :style="cardStyle">
    <text class="paw-adoption-pets-card__title">{{ title }}（{{ petList.length }}）</text>
    <view class="paw-adoption-pets-card__pet-row">
      <view v-for="(pet, index) in petList" :key="pet.id || pet.petId || 'pet-' + index"
        class="paw-adoption-pets-card__pet-cell" :data-qa="qaPrefix ? qaPrefix + (pet.id || pet.petId || index) : null">
        <PawImage class="paw-adoption-pets-card__pet-avatar" :src="petAvatarSrc(pet)" :size="48" :radius="24"
          :preview="false" :clickable="petClickable" @click.stop="onPetTap(pet, index)" />
        <text class="paw-adoption-pets-card__pet-name" @tap.stop="onPetTap(pet, index)">{{ pet.name }}</text>
      </view>
      <view v-if="showAdd" class="paw-adoption-pets-card__pet-cell paw-adoption-pets-card__pet-cell--add"
        :data-qa="qaPrefix ? qaPrefix + 'add' : 'qa-adoption-apply-add-pet'" @tap="onAddTap">
        <view class="paw-adoption-pets-card__add-circle-outer">
          <view class="paw-adoption-pets-card__add-circle"><text class="paw-adoption-pets-card__add-plus">+</text>
          </view>
        </view>
        <text class="paw-adoption-pets-card__pet-name paw-adoption-pets-card__pet-name--invisible">占位</text>
      </view>
    </view>
    <view v-if="showOwner" class="paw-adoption-pets-card__yard-row" @tap.stop="onYardTap">
      <PawImage class="paw-adoption-pets-card__yard-avatar" :src="yardAvatar" :size="34" :radius="17" :preview="false"
        :clickable="yardClickable" @click.stop="onYardTap" />
      <view class="paw-adoption-pets-card__yard-name-line">
        <text class="paw-adoption-pets-card__yard-name" @tap.stop="onYardTap">{{ yardName }}</text>
        <YardTagPill :label="yardTag" />
      </view>
    </view>
  </view>
</template>

<script>
import { adoptionPetAvatarSrc as petAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import PawImage from '@/components/base/PawImage.vue'
import YardTagPill from '@/components/YardTagPill.vue'

export default {
  name: 'PawAdoptionPetsCard',
  components: { PawImage, YardTagPill },
  options: {
    // The card's root is the layout box. This keeps its min-height and
    // content-driven height in the parent flex column on WeChat.
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    title: { type: String, default: '申请领养的猫咪' },
    pets: { type: Array, default: () => [] },
    yardName: { type: String, default: '我就是要喂猫' },
    yardAvatar: { type: String, default: '' },
    yardTag: { type: String, default: '小院' },
    showAdd: { type: Boolean, default: true },
    showOwner: { type: Boolean, default: true },
    petClickable: { type: Boolean, default: true },
    yardClickable: { type: Boolean, default: true },
    minHeight: { type: [Number, String], default: 296 },
    marginBottom: { type: [Number, String], default: 12 },
    qaPrefix: { type: String, default: '' }
  },
  emits: ['add', 'pet-click', 'yard-click'],
  computed: {
    petList() {
      return Array.isArray(this.pets) ? this.pets : []
    },
    cardStyle() {
      const style = {}
      const minHeight = Number(this.minHeight)
      const marginBottom = Number(this.marginBottom)
      if (minHeight > 0) style.minHeight = `${minHeight}px`
      if (marginBottom >= 0) style.marginBottom = `${marginBottom}px`
      return style
    }
  },
  methods: {
    petAvatarSrc,
    onAddTap() {
      this.$emit('add')
    },
    onPetTap(pet, index) {
      if (this.petClickable) this.$emit('pet-click', pet, index)
    },
    onYardTap(event) {
      if (this.yardClickable) this.$emit('yard-click', event)
    }
  }
}
</script>

<style scoped>
.paw-adoption-pets-card {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 0 0 auto;
  flex-direction: column;
  box-sizing: border-box;
  padding: 15px 20px 12px 18px;
  border-radius: 10px;
  background: #fff;
}

.paw-adoption-pets-card__title {
  display: block;
  flex: 0 0 auto;
  color: #333;
  font-size: 16px;
  line-height: 23px;
}

.paw-adoption-pets-card__pet-row {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-content: flex-start;
  align-items: flex-start;
  gap: 20px 15px;
  margin-top: 20px;
}

.paw-adoption-pets-card__pet-cell {
  display: flex;
  width: 49px;
  flex: 0 0 49px;
  flex-direction: column;
  align-items: center;
}

.paw-adoption-pets-card__pet-cell--add {
  justify-content: flex-start;
}

.paw-adoption-pets-card__pet-avatar {
  display: block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eee;
}

.paw-adoption-pets-card__pet-name {
  display: block;
  width: 100%;
  margin-top: 4px;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-adoption-pets-card__pet-name--invisible {
  height: 20px;
  opacity: 0;
}

.paw-adoption-pets-card__add-circle-outer,
.paw-adoption-pets-card__add-circle {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
}

.paw-adoption-pets-card__add-circle {
  border-radius: 50%;
  background: #f5f5f5;
}

.paw-adoption-pets-card__add-plus {
  color: #ffdd00;
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  transform: translateY(-1px);
}

.paw-adoption-pets-card__yard-row {
  display: flex;
  min-width: 0;
  min-height: 34px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  margin-top: 30px;
  padding-top: 12px;
}

.paw-adoption-pets-card__yard-avatar {
  display: block;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
  background: #eee;
}

.paw-adoption-pets-card__yard-name-line {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
}

.paw-adoption-pets-card__yard-name {
  min-width: 0;
  flex: 0 1 auto;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
