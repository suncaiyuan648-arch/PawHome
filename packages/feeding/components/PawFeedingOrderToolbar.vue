<template>
  <view class="feeding-order-toolbar">
    <view class="feeding-order-toolbar__search">
      <PawSearchBar v-model="inputValue" placeholder="搜索动物名字/品种等" @search="submitSearch" />
    </view>
    <PawPopoverMenu v-model="sortOpen" :items="sortOptions" :active-key="sortKey" @select="selectSort">
      <template #trigger>
        <view class="feeding-order-toolbar__sort" @tap.stop="toggleSort">
          <text>{{ activeSortLabel }}</text>
          <PawIcon name="navigation/sort-arrow" :size="8" />
        </view>
      </template>
    </PawPopoverMenu>
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawPopoverMenu from '@/components/navigation/PawPopoverMenu.vue'
import PawSearchBar from '@/components/navigation/PawSearchBar.vue'
const FEEDING_ORDER_SORT_OPTIONS = Object.freeze([
  { key: 'smart', label: '智能排序' },
  { key: 'newest', label: '最新投粮' },
  { key: 'status', label: '按状态' }
])

export default {
  name: 'PawFeedingOrderToolbar',
  components: { PawIcon, PawPopoverMenu, PawSearchBar },
  props: {
    keyword: { type: String, default: '' },
    sort: { type: String, default: 'smart' }
  },
  emits: ['update:keyword', 'update:sort', 'search', 'sort'],
  data() {
    return {
      inputValue: this.keyword,
      sortKey: this.sort,
      sortOpen: false,
      sortOptions: FEEDING_ORDER_SORT_OPTIONS
    }
  },
  computed: {
    activeSortLabel() {
      const option = this.sortOptions.find(item => item.key === this.sortKey)
      return option ? option.label : '智能排序'
    }
  },
  watch: {
    keyword(value) { if (value !== this.inputValue) this.inputValue = value },
    sort(value) { if (value !== this.sortKey) this.sortKey = value }
  },
  methods: {
    toggleSort() {
      this.sortOpen = !this.sortOpen
    },
    submitSearch(value) {
      // The shared search bar can emit its button event in the same tick as
      // the native input update. The toolbar's local value is the latest
      // source of truth, so do not let an older child payload win the race.
      const next = this.inputValue
      this.inputValue = next
      this.$emit('update:keyword', next)
      this.$emit('search', next)
    },
    selectSort(key) {
      this.sortKey = key
      this.$emit('update:sort', key)
      this.$emit('sort', key)
    }
  }
}
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
