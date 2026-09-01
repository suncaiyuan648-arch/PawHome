<template>
  <view class="paw-icon-lab" data-qa="paw-icon-lab">
    <PawPageNav title="PawIcon Lab" background="#F5F5F5" />

    <view class="lab-content">
      <view class="lab-heading">
        <text class="lab-heading__title">PawIcon Test Lab</text>
      <text class="lab-heading__hint">注册表自动枚举 · 所有 glyph 使用 24 × 24 设计坐标</text>
      </view>

      <view class="lab-mode-tabs" data-qa="paw-icon-lab-mode-tabs">
        <view v-for="item in modes" :key="item.value" class="lab-mode-tab"
          :class="{ 'lab-mode-tab--active': mode === item.value }" :data-qa="`paw-icon-lab-mode-${item.value}`"
          role="button" @tap="selectMode(item.value)">
          <text>{{ item.label }}</text>
        </view>
      </view>

      <view v-if="mode !== 'transform'" class="lab-toolbar" data-qa="paw-icon-lab-toolbar">
        <view class="lab-toolbar__row">
          <text class="lab-toolbar__label">Size</text>
          <view class="lab-toolbar__options">
            <view v-for="item in sizes" :key="item" class="lab-chip"
              :class="{ 'lab-chip--active': currentSize === item }" :data-qa="`paw-icon-lab-size-${item}`"
              role="button" @tap="selectSize(item)">
              <text>{{ item }}</text>
            </view>
            <view class="lab-size-custom">
              <input class="lab-size-input" data-qa="paw-icon-lab-size-custom-input" type="digit"
                :value="customSizeInput" placeholder="36" maxlength="6" @input="onCustomSizeInput" />
              <view class="lab-chip lab-size-apply" :class="{ 'lab-chip--active': currentSize === customSize }"
                data-qa="paw-icon-lab-size-custom" role="button" @tap="applyCustomSize">
                <text>自定义</text>
              </view>
            </view>
          </view>
        </view>
        <view class="lab-toolbar__row">
          <text class="lab-toolbar__label">Color</text>
          <view class="lab-toolbar__options">
            <view v-for="item in colorModes" :key="item.value" class="lab-chip"
              :class="{ 'lab-chip--active': colorMode === item.value }" :data-qa="`paw-icon-lab-color-${item.value}`" role="button"
              @tap="selectColorMode(item.value)">
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>
        <view class="lab-toolbar__row">
          <text class="lab-toolbar__label">Bounds</text>
          <view class="lab-chip" :class="{ 'lab-chip--active': showBounds }" role="button"
            data-qa="paw-icon-lab-bounds" @tap="showBounds = !showBounds">
            <text>{{ showBounds ? 'ON' : 'OFF' }}</text>
          </view>
        </view>
        <view class="lab-category-row">
          <text class="lab-toolbar__label">Category</text>
          <scroll-view class="lab-category-scroll" scroll-x>
            <view class="lab-category-options">
              <view v-for="item in categories" :key="item.value" class="lab-chip"
                :class="{ 'lab-chip--active': category === item.value }" role="button"
                @tap="selectCategory(item.value)">
                <text>{{ item.label }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
        <view class="lab-search">
          <PawIcon class="lab-search__icon" name="navigation/search" :size="14" />
          <input class="lab-search__input" :value="search" placeholder="搜索图标名" confirm-type="search"
            @input="onSearch" />
          <text v-if="search" class="lab-search__clear" role="button" @tap="search = ''">清除</text>
        </view>
      </view>

      <view v-if="mode !== 'transform'" class="lab-summary">
        <text>{{ filteredCount }} 个图标</text>
        <text>当前 {{ renderSize }}px · {{ colorModeLabel }}</text>
      </view>

      <view v-if="mode !== 'transform'" class="lab-sections" data-qa="paw-icon-lab-grid">
        <view v-for="group in groupedIcons" :key="group.value" class="lab-section">
          <view class="lab-section__title">
            <text>{{ group.label }}</text>
            <text class="lab-section__count">{{ group.names.length }}</text>
          </view>
          <view class="lab-grid">
            <view v-for="name in group.names" :key="name" class="lab-card" :data-qa="`paw-icon-card-${name}`">
            <view class="lab-stage" :style="iconStageStyle">
                <view v-if="showBounds" class="lab-guide lab-guide--layout" :style="guideStyle(renderSize)" />
                <view v-if="showBounds" class="lab-guide lab-guide--optical" :style="guideStyle(opticalGuideSize)" />
                <PawIcon :name="name" :size="renderSize" :color="iconColor(name)" />
              </view>
              <text class="lab-card__name">{{ name }}</text>
              <text class="lab-card__meta">{{ dimensionsLabel(name) }}</text>
              <text class="lab-card__kind">{{ registry[name].kind === 'mono' ? 'mono' : 'color' }}</text>
            </view>
          </view>
        </view>
        <view v-if="!filteredCount" class="lab-empty">没有匹配的图标</view>
      </view>

      <view v-else class="lab-transform" data-qa="paw-icon-lab-transform">
        <view class="lab-transform__picker">
          <text class="lab-toolbar__label">Icon</text>
          <picker mode="selector" :range="transformCandidates" :value="transformIndex" @change="onTransformPick">
            <view class="lab-picker-value" role="button">
              <text>{{ transformName }}</text>
              <text class="lab-picker-value__arrow">⌄</text>
            </view>
          </picker>
        </view>
        <text class="lab-transform__hint">旋转以组件中心为原点；flip 在旋转前执行</text>
        <view class="lab-transform__controls">
          <text class="lab-toolbar__label">Size</text>
          <view v-for="item in sizes" :key="`transform-size-${item}`" class="lab-chip"
            :class="{ 'lab-chip--active': currentSize === item }" :data-qa="`paw-icon-lab-size-${item}`"
            role="button" @tap="selectSize(item)">
            <text>{{ item }}</text>
          </view>
          <view class="lab-size-custom">
            <input class="lab-size-input" data-qa="paw-icon-lab-transform-size-custom-input" type="digit"
              :value="customSizeInput" placeholder="36" maxlength="6" @input="onCustomSizeInput" />
            <view class="lab-chip lab-size-apply" :class="{ 'lab-chip--active': currentSize === customSize }"
              data-qa="paw-icon-lab-transform-size-custom" role="button" @tap="applyCustomSize">
              <text>自定义</text>
            </view>
          </view>
          <text class="lab-toolbar__label">Color</text>
          <view v-for="item in colorModes" :key="`transform-${item.value}`" class="lab-chip"
            :class="{ 'lab-chip--active': colorMode === item.value }" :data-qa="`paw-icon-lab-transform-${item.value}`"
            role="button" @tap="selectColorMode(item.value)">
            <text>{{ item.label }}</text>
          </view>
          <view class="lab-chip" :class="{ 'lab-chip--active': showBounds }"
            data-qa="paw-icon-lab-transform-bounds" role="button" @tap="showBounds = !showBounds">
            <text>Bounds {{ showBounds ? 'ON' : 'OFF' }}</text>
          </view>
        </view>
        <view class="lab-transform__grid">
          <view v-for="item in transformCases" :key="item.label" class="lab-transform-card"
            :data-qa="`paw-icon-transform-${item.rotate}-${item.flip}`">
            <view class="lab-transform-card__stage" :style="iconStageStyle">
              <view v-if="showBounds" class="lab-guide lab-guide--layout" :style="guideStyle(renderSize)" />
              <PawIcon :name="transformName" :size="renderSize" :rotate="item.rotate" :flip="item.flip"
                :color="transformColor" />
            </view>
            <text class="lab-transform-card__label">{{ item.label }}</text>
            <text class="lab-card__meta">rotate {{ item.rotate }}° · flip {{ item.flip }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { PAW_ICON_DEFAULT_COLOR } from '@/components/PawIcon/PawIcon.tokens.js'
import { PAW_ICON_NAMES } from '@/components/PawIcon/generated/icon-names.js'
import { PAW_ICON_REGISTRY } from '@/components/PawIcon/generated/icon-registry.js'
import { resolvePawIconDimensions } from '@/components/PawIcon/PawIcon.utils.js'

const CATEGORY_LABELS = {
  navigation: 'Navigation',
  actions: 'Actions',
  status: 'Status',
  common: 'Common',
  badges: 'Badges',
  brand: 'Brand'
}

export default {
  name: 'PawIconLab',
  components: { PawPageNav, PawIcon },
  data() {
    return {
      registry: PAW_ICON_REGISTRY,
      names: PAW_ICON_NAMES,
      mode: 'optical',
      currentSize: 24,
      colorMode: 'optical',
      category: 'all',
      search: '',
      showBounds: true,
      customSizeInput: '36',
      customSize: 36,
      transformName: PAW_ICON_NAMES.includes('navigation/chevron-right') ? 'navigation/chevron-right' : PAW_ICON_NAMES[0],
      modes: [
        { value: 'optical', label: 'Optical' },
        { value: 'regression', label: 'Size Regression' },
        { value: 'transform', label: 'Transform' }
      ],
      sizes: [10, 12, 16, 17, 17.5, 18.5, 20, 23, 24, 25.5, 28, 32, 37.5],
      colorModes: [
        { value: 'optical', label: 'Optical #666' },
        { value: 'actual', label: 'Actual' }
      ],
      categories: [
        { value: 'all', label: 'All' },
        ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
      ],
      transformCases: [
        { label: 'Normal', rotate: 0, flip: 'none' },
        { label: 'Rotate 90', rotate: 90, flip: 'none' },
        { label: 'Rotate 180', rotate: 180, flip: 'none' },
        { label: 'Rotate 270', rotate: 270, flip: 'none' },
        { label: 'Flip H', rotate: 0, flip: 'horizontal' },
        { label: 'Flip V', rotate: 0, flip: 'vertical' },
        { label: 'Flip Both', rotate: 0, flip: 'both' }
      ]
    }
  },
  computed: {
    renderSize() {
      return this.currentSize
    },
    colorModeLabel() {
      return this.colorMode === 'actual' ? 'Actual color' : 'Optical color'
    },
    opticalGuideSize() {
      return Math.max(1, Math.round(this.renderSize * 0.83 * 10) / 10)
    },
    iconStageStyle() {
      const minimum = this.mode === 'transform' ? 86 : 62
      return { height: `${Math.max(minimum, this.renderSize + 8)}px` }
    },
    filteredNames() {
      const query = this.search.trim().toLowerCase()
      return this.names.filter(name => {
        const categoryMatch = this.category === 'all' || name.startsWith(`${this.category}/`)
        const searchMatch = !query || name.toLowerCase().includes(query)
        return categoryMatch && searchMatch
      })
    },
    groupedIcons() {
      const groups = this.categories.filter(item => item.value !== 'all').map(item => ({ ...item, names: [] }))
      const byCategory = Object.fromEntries(groups.map(group => [group.value, group]))
      this.filteredNames.forEach(name => {
        const category = name.split('/')[0]
        if (byCategory[category]) byCategory[category].names.push(name)
      })
      return groups.filter(group => group.names.length)
    },
    filteredCount() {
      return this.filteredNames.length
    },
    transformCandidates() {
      const preferred = this.names.filter(name => /(?:arrow|chevron|edit|share|refresh|pet)/i.test(name))
      return preferred.length ? preferred : this.names
    },
    transformIndex() {
      const index = this.transformCandidates.indexOf(this.transformName)
      return index < 0 ? 0 : index
    },
    transformColor() {
      return this.colorMode === 'actual' ? PAW_ICON_DEFAULT_COLOR : '#666666'
    }
  },
  methods: {
    selectMode(mode) {
      this.mode = mode
    },
    selectSize(size) {
      this.currentSize = size
    },
    onCustomSizeInput(event) {
      this.customSizeInput = event.detail.value
    },
    applyCustomSize() {
      const size = Number(String(this.customSizeInput).trim())
      if (!Number.isFinite(size) || size <= 0 || size > 512) return
      this.customSize = size
      this.currentSize = size
    },
    selectColorMode(mode) {
      this.colorMode = mode
    },
    selectCategory(category) {
      this.category = category
    },
    onSearch(event) {
      this.search = event.detail.value
    },
    onTransformPick(event) {
      this.transformName = this.transformCandidates[Number(event.detail.value)] || this.transformCandidates[0]
    },
    iconColor(name) {
      return this.registry[name].kind === 'mono'
        ? this.colorMode === 'actual' ? PAW_ICON_DEFAULT_COLOR : '#666666'
        : undefined
    },
    dimensionsLabel(name) {
      const dimensions = resolvePawIconDimensions(this.renderSize, this.registry[name])
      return `${dimensions.width} × ${dimensions.height}px`
    },
    guideStyle(size) {
      return { width: `${size}px`, height: `${size}px` }
    }
  }
}
</script>

<style>
.paw-icon-lab {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #1f2329;
}

.lab-content {
  padding: 18px 12px 32px;
  box-sizing: border-box;
}

.lab-heading {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
}

.lab-heading__title {
  font-size: 21px;
  font-weight: 700;
  line-height: 28px;
}

.lab-heading__hint,
.lab-transform__hint {
  color: #7a7f87;
  font-size: 12px;
  line-height: 18px;
}

.lab-mode-tabs,
.lab-toolbar,
.lab-transform__picker {
  padding: 10px;
  border-radius: 12px;
  background: #ffffff;
  box-sizing: border-box;
}

.lab-mode-tabs {
  display: flex;
  margin-bottom: 10px;
}

.lab-mode-tab {
  flex: 1;
  padding: 8px 3px;
  border-radius: 8px;
  color: #7a7f87;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.lab-mode-tab--active,
.lab-chip--active {
  background: #1f2329;
  color: #ffffff;
}

.lab-toolbar {
  margin-bottom: 10px;
}

.lab-toolbar__row,
.lab-category-row {
  display: flex;
  align-items: center;
  min-height: 32px;
  margin-bottom: 7px;
}

.lab-toolbar__row:last-child {
  margin-bottom: 0;
}

.lab-toolbar__label {
  flex: 0 0 53px;
  color: #626873;
  font-size: 12px;
  line-height: 18px;
}

.lab-toolbar__options,
.lab-category-options {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lab-category-options .lab-chip {
  flex: 0 0 auto;
  margin-right: 12px;
}

.lab-chip {
  min-width: 34px;
  padding: 6px 9px;
  border-radius: 7px;
  box-sizing: border-box;
  color: #626873;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
}

.lab-size-custom {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
}

.lab-size-input {
  width: 48px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #dfe2e6;
  border-radius: 7px;
  box-sizing: border-box;
  background: #f5f6f7;
  color: #343a40;
  font-size: 11px;
  line-height: 28px;
  text-align: center;
}

.lab-size-apply {
  min-width: 50px;
}

.lab-category-scroll {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.lab-search {
  display: flex;
  align-items: center;
  height: 34px;
  margin-top: 7px;
  padding: 0 9px;
  border-radius: 8px;
  background: #f5f6f7;
  box-sizing: border-box;
}

.lab-search__icon {
  flex: 0 0 auto;
  margin-right: 5px;
}

.lab-search__input {
  flex: 1;
  min-width: 0;
  color: #1f2329;
  font-size: 12px;
  line-height: 18px;
}

.lab-search__clear {
  color: #7a7f87;
  font-size: 11px;
}

.lab-summary {
  display: flex;
  justify-content: space-between;
  padding: 3px 2px 9px;
  color: #7a7f87;
  font-size: 11px;
  line-height: 17px;
}

.lab-section {
  margin-bottom: 14px;
}

.lab-section__title {
  display: flex;
  align-items: center;
  margin: 3px 2px 7px;
  color: #343a40;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.lab-section__count {
  margin-left: 5px;
  color: #9aa0a8;
  font-size: 11px;
  font-weight: 400;
}

.lab-grid {
  display: flex;
  flex-wrap: wrap;
  margin-right: -7px;
}

.lab-card {
  width: calc(25% - 7px);
  min-height: 112px;
  margin: 0 7px 7px 0;
  padding: 7px 5px 6px;
  border: 1px solid #e9ebee;
  border-radius: 10px;
  background: #ffffff;
  box-sizing: border-box;
  text-align: center;
}

.lab-stage,
.lab-transform-card__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 62px;
}

.lab-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.lab-guide--layout {
  border: 1px solid rgba(69, 123, 255, 0.55);
}

.lab-guide--optical {
  border: 1px dashed rgba(255, 126, 67, 0.7);
}

.lab-card__name,
.lab-card__meta,
.lab-card__kind {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lab-card__name {
  color: #343a40;
  font-size: 10px;
  line-height: 15px;
}

.lab-card__meta,
.lab-card__kind {
  color: #9aa0a8;
  font-size: 9px;
  line-height: 13px;
}

.lab-card__kind {
  color: #b0b5bc;
}

.lab-empty {
  padding: 35px 0;
  color: #9aa0a8;
  font-size: 13px;
  text-align: center;
}

.lab-transform__picker {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.lab-picker-value {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 7px 9px;
  border-radius: 7px;
  background: #f5f6f7;
  color: #343a40;
  font-size: 12px;
  line-height: 18px;
}

.lab-picker-value__arrow {
  margin-left: 8px;
  color: #7a7f87;
}

.lab-transform__hint {
  display: block;
  margin: 0 2px 9px;
}

.lab-transform__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #ffffff;
}

.lab-transform__controls .lab-toolbar__label {
  flex: 0 0 auto;
}

.lab-transform__grid {
  display: flex;
  flex-wrap: wrap;
  margin-right: -8px;
}

.lab-transform-card {
  width: calc(50% - 8px);
  margin: 0 8px 8px 0;
  padding: 10px;
  border: 1px solid #e9ebee;
  border-radius: 11px;
  background: #ffffff;
  box-sizing: border-box;
  text-align: center;
}

.lab-transform-card__stage {
  height: 86px;
}

.lab-transform-card__label {
  display: block;
  color: #343a40;
  font-size: 12px;
  line-height: 18px;
}
</style>
