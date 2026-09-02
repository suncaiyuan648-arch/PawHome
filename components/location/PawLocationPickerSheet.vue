<template>
  <PawBottomSheet v-model="visibleProxy" variant="location-picker" :height="sheetHeight" :safe-area="true"
    :close-on-mask="true" :z-index="10040">
    <view class="location-picker" data-qa="location-picker-sheet">
      <view class="location-picker__search-row">
        <view class="location-picker__search-box">
          <uni-icons type="search" color="#bfbfbf" :size="18" />
          <input class="location-picker__search-input" data-qa="location-picker-search" type="text" :value="keyword"
            placeholder="搜索城市/小区/居住楼等" placeholder-class="location-picker__placeholder" confirm-type="search"
            @input="onKeywordInput" @confirm="loadLocations" />
        </view>
        <view class="location-picker__city" data-qa="location-picker-city" @tap="onCityTap">
          <uni-icons type="paperplane-filled" color="#2f8bff" :size="15" />
          <text>{{ currentCity }}</text>
        </view>
      </view>

      <scroll-view class="location-picker__scroll" scroll-y :show-scrollbar="false" :bounces="false">
        <view v-if="loading" class="location-picker__state">
          <text>正在获取附近地点...</text>
        </view>
        <view v-else-if="!places.length" class="location-picker__state">
          <text>暂无匹配地点，请尝试搜索其他关键词</text>
        </view>
        <view v-else class="location-picker__list">
          <view v-for="(item, index) in places" :key="item.id || index" class="location-picker__item"
            :data-index="index" :data-qa="`location-picker-item-${index}`" @tap="selectPlace(item)">
            <uni-icons class="location-picker__pin" type="location-filled" color="#e9e9e9" :size="21" />
            <view class="location-picker__item-copy">
              <text class="location-picker__item-name">{{ item.name }}</text>
              <text class="location-picker__item-address">{{ item.address }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import { fetchLocationPlaces, getPreciseLocation } from '@/utils/locationService.js'

export default {
  name: 'PawLocationPickerSheet',
  components: { PawBottomSheet },
  props: {
    visible: { type: Boolean, default: false },
    city: { type: String, default: '长沙市' },
    sheetHeight: { type: String, default: '70vh' }
  },
  emits: ['update:visible', 'select', 'city-tap'],
  data() {
    return {
      keyword: '',
      currentCity: this.city || '长沙市',
      places: [],
      loading: false,
      location: null,
      requestId: 0,
      searchTimer: null
    }
  },
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    }
  },
  watch: {
    visible(value) {
      if (value) this.loadNearby()
      else this.clearSearchTimer()
    },
    city(value) {
      this.currentCity = value || '长沙市'
      if (this.visible) this.loadNearby()
    }
  },
  beforeUnmount() {
    this.clearSearchTimer()
  },
  methods: {
    clearSearchTimer() {
      if (!this.searchTimer) return
      clearTimeout(this.searchTimer)
      this.searchTimer = null
    },
    onKeywordInput(event) {
      this.keyword = event && event.detail ? event.detail.value || '' : ''
      this.clearSearchTimer()
      this.searchTimer = setTimeout(() => this.loadLocations(), 260)
    },
    async loadNearby() {
      this.keyword = ''
      this.location = await getPreciseLocation()
      await this.loadLocations()
    },
    async loadLocations() {
      this.clearSearchTimer()
      const requestId = ++this.requestId
      this.loading = true
      const location = this.location || await getPreciseLocation()
      const result = await fetchLocationPlaces({
        city: this.currentCity,
        latitude: location && location.latitude,
        longitude: location && location.longitude,
        keyword: this.keyword
      })
      if (requestId !== this.requestId) return
      this.location = location
      this.currentCity = result.city || this.currentCity
      this.places = result.list || []
      this.loading = false
    },
    selectPlace(item) {
      this.$emit('select', item)
      this.visibleProxy = false
    },
    onCityTap() {
      this.$emit('city-tap', this.currentCity)
    }
  }
}
</script>

<style scoped>
.location-picker {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: #fff;
}

.location-picker__search-row {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 16px;
  padding: 16px 16px 8px;
  box-sizing: border-box;
}

.location-picker__search-box {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  height: 34px;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 17px;
  background: #f6f6f6;
}

.location-picker__search-input {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 8px;
  color: #333;
  font-size: 14px;
  line-height: 20px;
}

.location-picker__placeholder {
  color: #bfbfbf;
  font-size: 14px;
}

.location-picker__city {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  color: #232323;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  white-space: nowrap;
}

.location-picker__scroll {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.location-picker__list {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 16px;
}

.location-picker__item {
  display: flex;
  flex: 0 0 auto;
  min-height: 61px;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #f2f2f2;
}

.location-picker__pin {
  flex: 0 0 auto;
  margin-right: 18px;
}

.location-picker__item-copy {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.location-picker__item-name,
.location-picker__item-address {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-picker__item-name {
  color: #222;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.location-picker__item-address {
  margin-top: 2px;
  color: #8f8f8f;
  font-size: 14px;
  line-height: 19px;
}

.location-picker__state {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  box-sizing: border-box;
  color: #999;
  font-size: 14px;
  text-align: center;
}
</style>
