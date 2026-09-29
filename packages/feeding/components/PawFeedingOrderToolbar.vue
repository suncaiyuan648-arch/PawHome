<template>
  <view
    class="feeding-order-toolbar"
    :class="{ 'feeding-order-toolbar--yard': variant === 'yard' }"
  >
    <view class="feeding-order-toolbar__search">
      <PawSearchBar
        v-model="inputValue"
        placeholder="搜索动物名字/品种等"
        @search="submitSearch"
      />
    </view>
    <view class="feeding-order-toolbar__filters">
      <PawPopoverMenu
        v-model="sortOpen"
        :items="displaySortOptions"
        :active-key="sortKey"
        :placement="variant === 'yard' ? 'start' : 'end'"
        @select="selectSort"
      >
        <template #trigger>
          <view
            class="feeding-order-toolbar__sort"
            data-qa="qa-yard-orders-smart-filter"
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
      <view
        v-if="variant === 'yard'"
        class="feeding-order-toolbar__calendar"
        data-qa="qa-yard-orders-calendar"
        @tap.stop="openCalendar"
      >
        <image
          class="feeding-order-toolbar__calendar-icon"
          :src="calendarIconSrc"
          mode="aspectFit"
        />
        <text
          v-if="date"
          class="feeding-order-toolbar__date"
          >{{ date }}</text
        >
      </view>
    </view>
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
} from '../services/orderListMetadata.ts'

export default defineComponent({
  name: 'PawFeedingOrderToolbar',
  components: { PawIcon, PawPopoverMenu, PawSearchBar },
  props: {
    variant: { type: String as PropType<'mine' | 'yard'>, default: 'mine' },
    keyword: { type: String, default: '' },
    sort: { type: String as PropType<FeedingOrderSort>, default: 'smart' },
    date: { type: String, default: '' },
  },
  emits: {
    'update:keyword': eventContract<[value: string]>(),
    'update:sort': eventContract<[sort: FeedingOrderSort]>(),
    search: eventContract<[value: string]>(),
    sort: eventContract<[sort: FeedingOrderSort]>(),
    calendar: eventContract<[]>(),
  },
  data(): FeedingOrderToolbarState {
    return createFeedingOrderToolbarState(this.keyword, this.sort)
  },
  computed: {
    calendarIconSrc() {
      return '/packages/feeding/static/calendar.svg'
    },
    displaySortOptions() {
      if (this.variant !== 'yard') return this.sortOptions
      return this.sortOptions.map((option) =>
        option.key === 'smart' ? { ...option, label: '智能筛选' } : option,
      )
    },
    activeSortLabel() {
      const option = this.displaySortOptions.find((item) => item.key === this.sortKey)
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
    openCalendar() {
      this.$emit('calendar')
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

.feeding-order-toolbar__filters {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

.feeding-order-toolbar--yard {
  flex-direction: column;
  align-items: stretch;
}

.feeding-order-toolbar--yard .feeding-order-toolbar__search {
  flex: none;
  width: 100%;
}

.feeding-order-toolbar--yard .feeding-order-toolbar__filters {
  justify-content: space-between;
  width: 100%;
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

.feeding-order-toolbar--yard .feeding-order-toolbar__sort {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 5px;
  background: #fff;
  color: #999;
  font-size: 12px;
}

.feeding-order-toolbar__calendar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 30px;
  min-height: 30px;
}

.feeding-order-toolbar__calendar-icon {
  display: block;
  flex: none;
  width: 21px;
  height: 21px;
}

.feeding-order-toolbar__date {
  margin-left: 4px;
  color: #666;
  font-size: 11px;
}
</style>
