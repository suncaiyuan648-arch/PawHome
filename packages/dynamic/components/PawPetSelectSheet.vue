<template>
  <PawBottomSheet
    :model-value="visibleProxy"
    variant="selection-order"
    :height="height"
    :close-on-mask="true"
    :safe-area="true"
    @update:model-value="onSheetValueChange"
    @after-close="$emit('after-close')"
  >
    <view class="pet-sheet">
      <view class="sheet-head">
        <text class="sheet-title">选择云养中的动物</text>
        <view
          class="sheet-close"
          @tap.stop="close"
        >
          <image
            class="sheet-close-icon"
            src="/static/figma/publish/order-close.svg"
            mode="aspectFit"
          >
          </image>
        </view>
      </view>

      <scroll-view
        class="sheet-scroll"
        scroll-y
        :show-scrollbar="false"
        :bounces="false"
        :enable-flex="true"
      >
        <view class="pet-list">
          <view
            v-for="animal in animals"
            :key="animal.id"
            class="pet-card"
            :data-pet-id="animal.id"
            data-qa="pet-option"
            @tap.stop="toggleAnimal(animal)"
          >
            <view
              class="pet-check"
              aria-hidden="true"
            >
              <image
                class="pet-check-icon"
                :src="isSelected(animal.id) ? selectedIcon : unselectedIcon"
                mode="aspectFit"
              ></image>
            </view>

            <view class="pet-avatar-region">
              <image
                class="pet-avatar"
                :src="animal.avatar"
                mode="aspectFill"
              ></image>
            </view>

            <view class="pet-content">
              <view class="pet-top">
                <view class="pet-identity">
                  <text class="pet-name">{{ animal.name }}</text>
                  <text class="pet-status">云养中</text>
                </view>
                <text
                  v-if="animal.timedOut"
                  class="pet-timeout"
                  >已超时</text
                >
                <text
                  v-else
                  class="pet-countdown"
                  >{{ animal.countdown }}</text
                >
              </view>
              <text class="pet-amount">投粮{{ animal.kg }}斤</text>
              <view class="pet-bottom">
                <text class="pet-time">{{ animal.time }}</text>
                <view class="pet-feedback"
                  ><text>{{ animal.feedbackTag }}</text></view
                >
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </PawBottomSheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import type { PublishEditorAnimal } from '../services/publishEditorMetadata.ts'

interface PawPetSelectSheetState {
  selectedIcon: string
  unselectedIcon: string
}

export default defineComponent({
  name: 'PawPetSelectSheet',
  components: { PawBottomSheet },
  props: {
    modelValue: { type: Boolean, default: false },
    animals: { type: Array as PropType<PublishEditorAnimal[]>, default: () => [] },
    selectedIds: { type: Array as PropType<string[]>, default: () => [] },
    height: { type: [String, Number], default: '70vh' },
  },
  emits: {
    'update:modelValue': (value: boolean) => typeof value === 'boolean',
    'update:selectedIds': (ids: string[]) =>
      Array.isArray(ids) && ids.every((id) => typeof id === 'string'),
    'after-close': () => true,
  },
  data(): PawPetSelectSheetState {
    return {
      selectedIcon: '/static/figma/publish/order-selected.svg',
      unselectedIcon: '/static/figma/publish/order-unselected.svg',
    }
  },
  computed: {
    visibleProxy: {
      get() {
        return this.modelValue
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value)
      },
    },
  },
  methods: {
    isSelected(id: string): boolean {
      return this.selectedIds.some((selectedId) => selectedId === id)
    },
    toggleAnimal(animal: PublishEditorAnimal) {
      const id = animal.id
      const current = this.selectedIds.slice()
      const next = this.isSelected(animal.id)
        ? current.filter((selectedId) => selectedId !== id)
        : current.concat(id)
      this.$emit('update:selectedIds', next)
    },
    close() {
      this.visibleProxy = false
    },
    onSheetValueChange(value: boolean) {
      this.visibleProxy = value
    },
  },
})
</script>

<style scoped>
:deep(.paw-bottom-sheet--selection-order) {
  background: #f1f1f1;
  border-radius: 13px 13px 0 0;
}

:deep(.paw-bottom-sheet__body) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.pet-sheet {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sheet-head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 66px;
  flex: 0 0 66px;
  padding-top: 4px;
  box-sizing: border-box;
}

.sheet-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  color: #111;
}

.sheet-close {
  position: absolute;
  top: 13px;
  right: 13px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-close-icon {
  width: 13px;
  height: 13px;
}

.sheet-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 15px;
  box-sizing: border-box;
}

.pet-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-bottom: 12px;
}

.pet-card {
  width: 100%;
  height: 98px;
  flex: 0 0 98px;
  padding: 0 10px 0 17px;
  border-top: 1px solid #e4e4e4;
  border-radius: 15px;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pet-check {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 7px;
}

.pet-check-icon {
  width: 18px;
  height: 18px;
}

.pet-avatar-region {
  width: 37px;
  height: 37px;
  flex: 0 0 37px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.pet-avatar {
  width: 37px;
  height: 37px;
  border-radius: 50%;
}

.pet-content {
  min-width: 0;
  flex: 1 1 auto;
  height: 76px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.pet-top,
.pet-bottom {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pet-identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
}

.pet-name {
  min-width: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: #222;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.pet-status {
  flex: 0 0 auto;
  padding: 1px 5px;
  border-radius: 999px;
  background: #d7ff72;
  font-size: 11px;
  line-height: 16px;
  color: #5b7d00;
  white-space: nowrap;
}

.pet-timeout,
.pet-countdown {
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 18px;
  color: #ff3d3d;
  white-space: nowrap;
}

.pet-amount {
  align-self: flex-start;
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  color: #333;
}

.pet-time {
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
  color: #999;
  white-space: nowrap;
}

.pet-feedback {
  flex: 0 0 auto;
  padding: 2px 5px;
  background: rgba(245, 245, 245, 0.85);
  box-sizing: border-box;
}

.pet-feedback text {
  font-size: 12px;
  line-height: 15px;
  color: #384d7b;
  white-space: nowrap;
}
</style>
