<template>
  <view class="paw-search-bar">
    <view
      class="paw-search-bar__input-area"
      @tap="handleTap"
    >
      <PawIcon
        class="paw-search-bar__icon"
        name="navigation/search"
        :size="15.1278"
      />
      <text
        v-if="readonly"
        class="paw-search-bar__readonly-text"
        :class="{ 'paw-search-bar__readonly-text--placeholder': !modelValue }"
        >{{ modelValue || placeholder }}</text
      >
      <input
        v-else
        class="paw-search-bar__input"
        :value="modelValue"
        :placeholder="placeholder"
        placeholder-class="paw-search-bar__placeholder"
        confirm-type="search"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
      />
    </view>
    <view class="paw-search-bar__button-wrap">
      <PawButton
        class="paw-search-bar__button"
        tone="dark"
        size="search"
        text="搜一搜"
        block
        @click="handleSearch"
      />
    </view>
  </view>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent } from 'vue'

import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { readPawEventDetail } from '@/utils/pawEventMetadata.ts'
export default defineComponent({
  name: 'PawSearchBar',
  components: { PawButton, PawIcon },
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '搜索' },
    readonly: { type: Boolean, default: false },
  },
  emits: {
    'update:modelValue': eventContract<[value: string]>(),
    input: eventContract<[value: string]>(),
    focus: eventContract<[event: PawEvent]>(),
    blur: eventContract<[event: PawEvent]>(),
    confirm: eventContract<[value: string]>(),
    search: eventContract<[value: string, event?: PawEvent]>(),
    tap: eventContract<[event: PawEvent]>(),
  },
  methods: {
    getValue(event: PawEvent) {
      const value = readPawEventDetail(event)?.value
      return typeof value === 'string' ? value : this.modelValue
    },
    handleInput(event: PawEvent) {
      const value = this.getValue(event)
      this.$emit('update:modelValue', value)
      this.$emit('input', value)
    },
    handleFocus(event: PawEvent) {
      this.$emit('focus', event)
    },
    handleBlur(event: PawEvent) {
      this.$emit('blur', event)
    },
    handleConfirm(event: PawEvent) {
      const value = this.getValue(event)
      this.$emit('confirm', value)
      this.$emit('search', value)
    },
    handleSearch(event: PawEvent) {
      this.$emit('search', this.modelValue, event)
    },
    handleTap(event: PawEvent) {
      if (this.readonly) this.$emit('tap', event)
    },
  },
})
</script>

<style scoped>
.paw-search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 34px;
  padding: 0 2px 0 10px;
  box-sizing: border-box;
  border: 1.5px solid #1f1e18;
  border-radius: 17px;
  overflow: hidden;
  background: #fff;
}

.paw-search-bar__input-area {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.paw-search-bar__icon {
  flex: none;
}

.paw-search-bar__readonly-text {
  flex: 1;
  min-width: 0;
  margin-left: 6px;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 30px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-search-bar__readonly-text--placeholder {
  color: #d9d9d9;
}

.paw-search-bar__input {
  flex: 1;
  min-width: 0;
  height: 30px;
  margin-left: 6px;
  padding: 0;
  box-sizing: border-box;
  color: #333;
  font-size: 14px;
  line-height: 30px;
}

.paw-search-bar__placeholder {
  color: #d9d9d9;
  font-size: 14px;
}

.paw-search-bar__button-wrap {
  flex: 0 0 55px;
  width: 55px;
  height: 28px;
  min-width: 55px;
  overflow: hidden;
}

:deep(.paw-search-bar__button) {
  flex: none;
  width: 100%;
  height: 28px !important;
  min-height: 0 !important;
  padding: 0;
  border: 0;
  border-radius: 14px;
  font-size: 12px;
  line-height: 28px;
  white-space: nowrap;
}

:deep(.paw-search-bar__button .paw-button) {
  width: 100%;
  height: 28px !important;
  min-height: 0 !important;
  padding: 0;
  border-radius: 14px;
  font-size: 12px;
  line-height: 28px;
}
</style>
