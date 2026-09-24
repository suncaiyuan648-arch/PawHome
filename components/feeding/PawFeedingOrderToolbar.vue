<template>
  <view class="feeding-order-toolbar">
    <view class="feeding-order-toolbar__search">
      <PawSearchBar
        v-model="inputValue"
        placeholder="搜索动物名字/品种等"
        @search="submitSearch"
      />
    </view>
    <PawPopoverMenu
      v-model="sortOpen"
      :items="sortOptions"
      :active-key="sortKey"
      @select="selectSort"
    >
      <template #trigger>
        <view
          class="feeding-order-toolbar__sort"
          @tap.stop="toggleSort"
        >
          <text>{{ activeSortLabel }}</text>
          <PawIcon
            name="navigation/sort-arrow"
            :size="8"
          />
        </view>
      </template>
    </PawPopoverMenu>
  </view>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawPopoverMenu from '@/components/navigation/PawPopoverMenu.vue'
import type { PawPopoverMenuSelection } from '@/components/navigation/PawPopoverMenu.vue'
import PawSearchBar from '@/components/navigation/PawSearchBar.vue'
import type { FeedingOrderSort } from '@/utils/feedingOrderContracts.ts'
import {
  createFeedingOrderToolbarState,
  isFeedingOrderSort,
  type FeedingOrderToolbarState,
} from '@/packages/feeding/services/orderListMetadata.ts'

export default defineComponent({
  name: 'PawFeedingOrderToolbar',
  components: { PawIcon, PawPopoverMenu, PawSearchBar },
  props: {
    keyword: { type: String, default: '' },
    sort: { type: String as PropType<FeedingOrderSort>, default: 'smart' },
  },
  emits: {
    'update:keyword': eventContract<[value: string]>(),
    'update:sort': eventContract<[sort: FeedingOrderSort]>(),
    search: eventContract<[value: string]>(),
    sort: eventContract<[sort: FeedingOrderSort]>(),
  },
  data(): FeedingOrderToolbarState {
    return createFeedingOrderToolbarState(this.keyword, this.sort)
  },
  computed: {
    activeSortLabel() {
      const option = this.sortOptions.find((item) => item.key === this.sortKey)
      return option ? option.label : '智能排序'
    },
  },
  watch: {
    keyword(value: string) {
      if (value !== this.inputValue) this.inputValue = value
    },
    sort(value: FeedingOrderSort) {
      if (value !== this.sortKey) this.sortKey = value
    },
  },
  methods: {
    toggleSort() {
      this.sortOpen = !this.sortOpen
    },
    submitSearch() {
      // The shared search bar can emit its button event in the same tick as
      // the native input update. The toolbar's local value is the latest
      // source of truth, so do not let an older child payload win the race.
      const next = this.inputValue
      this.inputValue = next
      this.$emit('update:keyword', next)
      this.$emit('search', next)
    },
    selectSort(key: PawPopoverMenuSelection) {
      if (!isFeedingOrderSort(key)) return
      this.sortKey = key
      this.$emit('update:sort', key)
      this.$emit('sort', key)
    },
  },
})
</script>

<style scoped>
.feeding-order-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.feeding-order-toolbar__search {
  flex: 1 1 auto;
  min-width: 0;
}

.feeding-order-toolbar__sort {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 0 5px;
  color: #333333;
  font-size: 14px;
  white-space: nowrap;
}
</style>
