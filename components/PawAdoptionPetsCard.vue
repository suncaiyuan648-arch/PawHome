<template>
  <PawCard
    class="paw-adoption-pets-card"
    :style="layoutStyle"
    :padding="cardPadding"
    border="none"
  >
    <template #title>
      <view class="paw-adoption-pets-card__title">
        <text>{{ title }}</text>
        <text class="paw-adoption-pets-card__count">({{ petList.length }})</text>
      </view>
    </template>
    <view class="paw-adoption-pets-card__pet-row">
      <view
        v-for="(pet, index) in petList"
        :key="pet.id || pet.petId || 'pet-' + index"
        class="paw-adoption-pets-card__pet-cell"
        :data-qa="qaPrefix ? qaPrefix + (pet.id || pet.petId || index) : null"
        @tap.stop="onPetTap(pet, index)"
      >
        <PawImage
          class="paw-adoption-pets-card__pet-avatar"
          :src="petAvatarSrc(pet)"
          :size="48"
          :radius="24"
          :preview="false"
          :clickable="petClickable"
          @click.stop="onPetTap(pet, index)"
        />
        <text
          class="paw-adoption-pets-card__pet-name"
          @tap.stop="onPetTap(pet, index)"
          >{{ pet.name }}</text
        >
      </view>
      <view
        v-if="showAdd"
        class="paw-adoption-pets-card__pet-cell paw-adoption-pets-card__pet-cell--add"
        :data-qa="qaPrefix ? qaPrefix + 'add' : 'qa-adoption-apply-add-pet'"
        @tap="onAddTap"
      >
        <view class="paw-adoption-pets-card__add-circle-outer">
          <view class="paw-adoption-pets-card__add-circle"
            ><text class="paw-adoption-pets-card__add-plus">+</text>
          </view>
        </view>
        <text class="paw-adoption-pets-card__pet-name paw-adoption-pets-card__pet-name--invisible"
          >占位</text
        >
      </view>
    </view>
    <template #footer>
      <view
        v-if="showOwner"
        class="paw-adoption-pets-card__yard-row"
        @tap.stop="onYardTap"
      >
        <PawImage
          class="paw-adoption-pets-card__yard-avatar"
          :src="yardAvatar"
          :size="34"
          :radius="17"
          :preview="false"
          :clickable="yardClickable"
          @click.stop="onYardTap"
        />
        <view class="paw-adoption-pets-card__yard-name-line">
          <text
            class="paw-adoption-pets-card__yard-name"
            @tap.stop="onYardTap"
            >{{ yardName }}</text
          >
          <YardBadge
            :label="yardTag"
            :yard-id="yardClickable ? yardId : ''"
            :yard-name="yardName"
          />
        </view>
      </view>
    </template>
  </PawCard>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'
import type { PawImageEvent } from '@/components/base/pawImageMetadata.ts'

import { defineComponent, type PropType } from 'vue'

import type { AdoptionPetMetadata } from '@/utils/adoptionMockData.ts'
import { adoptionPetAvatarSrc as petAvatarSrc } from '@/utils/adoptionPetDisplay.ts'
import PawCard from '@/components/base/PawCard.vue'
import YardBadge from '@/components/customBadge/YardBadge.vue'
import PawImage from '@/components/base/PawImage.vue'

export default defineComponent({
  name: 'PawAdoptionPetsCard',
  components: { PawCard, YardBadge, PawImage },
  options: {
    // The card's root is the layout box. This keeps its min-height and
    // content-driven height in the parent flex column on WeChat.
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    title: { type: String, default: '申请领养的猫咪' },
    pets: { type: Array as PropType<AdoptionPetMetadata[]>, default: () => [] },
    yardName: { type: String, default: '我就是要喂猫' },
    yardId: { type: [Number, String], default: '' },
    yardAvatar: { type: String, default: '' },
    yardTag: { type: String, default: '小院' },
    showAdd: { type: Boolean, default: true },
    showOwner: { type: Boolean, default: true },
    petClickable: { type: Boolean, default: true },
    yardClickable: { type: Boolean, default: true },
    cardPadding: { type: String, default: '15px 20px 12px 18px' },
    minHeight: { type: [Number, String], default: 296 },
    marginBottom: { type: [Number, String], default: 12 },
    qaPrefix: { type: String, default: '' },
  },
  emits: {
    add: eventContract<[]>(),
    'pet-click': eventContract<[pet: AdoptionPetMetadata, index: number]>(),
    'yard-click': eventContract<[event: PawImageEvent]>(),
  },
  computed: {
    petList() {
      return Array.isArray(this.pets) ? this.pets : []
    },
    layoutStyle() {
      const style: Record<string, string> = {}
      const minHeight = Number(this.minHeight)
      const marginBottom = Number(this.marginBottom)
      if (minHeight > 0) style.minHeight = `${minHeight}px`
      if (marginBottom >= 0) style.marginBottom = `${marginBottom}px`
      return style
    },
  },
  methods: {
    petAvatarSrc,
    onAddTap() {
      this.$emit('add')
    },
    onPetTap(pet: AdoptionPetMetadata, index: number) {
      if (this.petClickable) this.$emit('pet-click', pet, index)
    },
    onYardTap(event: PawImageEvent) {
      if (this.yardClickable) this.$emit('yard-click', event)
    },
  },
})
</script>

<style scoped>
.paw-adoption-pets-card {
  flex: 0 0 auto;
}

.paw-adoption-pets-card__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
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
