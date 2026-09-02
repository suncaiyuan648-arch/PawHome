<template>
  <view class="region-picker" data-qa="region-picker">
    <PawPageNav background="#f5f5f5" :title="title" :show-back="true" :auto-back="false" :fallback-url="fallbackUrl"
      @back="$emit('cancel')" />

    <view class="region-picker__crumbs" data-qa="region-picker-crumbs">
      <text v-for="(label, index) in crumbList" :key="`crumb-${index}`" class="region-picker__crumb"
        :class="{ 'region-picker__crumb--active': index === level, 'region-picker__crumb--placeholder': !parts[index] }"
        :data-index="index" @tap="onCrumbTap(index)">{{ label }}</text>
    </view>

    <scroll-view class="region-picker__scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
      <view class="region-picker__list">
        <view v-for="(item, index) in currentOptions" :key="item.name || index" class="region-picker__item"
          :class="{ 'region-picker__item--selected': item.name === selectedName }" :data-index="index"
          :data-qa="`region-picker-item-${index}`" @tap="onItemTap(item)">
          <text class="region-picker__item-name">{{ item.name }}</text>
          <text v-if="item.name === selectedName" class="region-picker__check">✓</text>
        </view>
        <view v-if="!currentOptions.length" class="region-picker__empty">
          <text>暂无可选地区</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import { findRegionOptions, REGION_TREE } from '@/utils/regionMock.js'

export default {
  name: 'PawRegionPicker',
  components: { PawPageNav },
  props: {
    title: { type: String, default: '' },
    fallbackUrl: { type: String, default: '/pages/meMore/shippingAddress' },
    initialParts: { type: Array, default: () => [] },
    maxLevel: { type: Number, default: 2 },
    startLevel: { type: Number, default: -1 },
    tree: { type: Array, default: () => REGION_TREE }
  },
  emits: ['complete', 'cancel', 'change'],
  data() {
    return {
      level: 0,
      parts: ['', '', '', ''],
      currentOptions: [],
      selectedName: ''
    }
  },
  computed: {
    safeMaxLevel() {
      return Math.max(0, Math.min(3, Number(this.maxLevel) || 0))
    },
    crumbList() {
      return this.parts.slice(0, this.safeMaxLevel + 1).map((part, index) => {
        if (part) return part
        return index <= this.level ? '请选择' : ''
      })
    }
  },
  watch: {
    initialParts: {
      deep: true,
      handler(value) { this.initialize(value) }
    },
    maxLevel() { this.initialize(this.initialParts) },
    startLevel() { this.initialize(this.initialParts) }
  },
  created() {
    this.initialize(this.initialParts)
  },
  methods: {
    initialize(value = []) {
      const parts = Array.isArray(value) ? value.slice(0, 4) : []
      while (parts.length < 4) parts.push('')
      this.parts = parts.map(part => String(part || ''))
      const firstEmpty = this.parts.slice(0, this.safeMaxLevel + 1).findIndex(part => !part)
      const requestedLevel = Number(this.startLevel)
      this.level = requestedLevel >= 0
        ? Math.min(this.safeMaxLevel, requestedLevel)
        : (firstEmpty >= 0 ? firstEmpty : this.safeMaxLevel)
      this.selectedName = this.parts[this.level] || ''
      this.rebuildOptions()
    },
    onCrumbTap(index) {
      if (index > this.level) return
      this.level = index
      this.selectedName = this.parts[index] || ''
      this.rebuildOptions()
      this.$emit('change', { parts: this.parts.slice(0, this.safeMaxLevel + 1), level: this.level })
    },
    onItemTap(item) {
      if (!item || !item.name) return
      this.selectedName = item.name
      this.parts[this.level] = item.name
      for (let current = this.level + 1; current <= 3; current += 1) this.parts[current] = ''
      if (this.level >= this.safeMaxLevel) {
        const payload = { parts: this.parts.slice(0, this.safeMaxLevel + 1) }
        this.$emit('complete', payload)
        return
      }
      this.level += 1
      this.selectedName = ''
      this.rebuildOptions()
      this.$emit('change', { parts: this.parts.slice(0, this.safeMaxLevel + 1), level: this.level })
    },
    rebuildOptions() {
      this.currentOptions = findRegionOptions(this.parts, this.level, this.tree)
    }
  }
}
</script>

<style scoped>
.region-picker {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #222;
}

.region-picker__crumbs {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 18px;
  min-height: 44px;
  padding: 0 15px;
  box-sizing: border-box;
  white-space: nowrap;
}

.region-picker__crumb {
  max-width: 92px;
  overflow: hidden;
  color: #8e8e8e;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.region-picker__crumb--active {
  color: #2a2a2a;
}

.region-picker__crumb--placeholder {
  color: #8e8e8e;
  font-weight: 400;
}

.region-picker__scroll {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.region-picker__list {
  margin: 0 8px 12px;
  overflow: hidden;
  border-radius: 4px;
  background: #fff;
}

.region-picker__item {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #f2f2f2;
  box-sizing: border-box;
}

.region-picker__item:last-child {
  border-bottom: 0;
}

.region-picker__item-name {
  color: #2f2f2f;
  font-size: 13px;
  line-height: 18px;
}

.region-picker__check {
  color: #222;
  font-size: 12px;
  line-height: 18px;
}

.region-picker__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #999;
  font-size: 13px;
}
</style>
