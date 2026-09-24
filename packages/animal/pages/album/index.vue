<template>
  <view class="album-page">
    <PawPageNav
      :title="albumPetName + '的相册'"
      :title-centered="true"
      background="#f5f5f5"
      fallback-url="/pages/index/index"
    />
    <view
      v-if="invalid"
      class="album-empty"
      ><PawIcon
        name="navigation/clock-disabled"
        :size="22"
        color="#999"
        label="相册不可用"
      /><text>{{ emptyCopy }}</text
      ><text class="album-empty-hint">请从真实动物详情重新打开相册。</text></view
    >
    <scroll-view
      v-else
      class="album-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="album-controls">
        <view class="album-tabs"
          ><view
            v-for="filter in albumFilters"
            :key="filter.key"
            class="album-tab"
            :class="{ active: albumFilter === filter.key }"
            @tap="selectAlbumFilter(filter.key)"
            ><text>{{ filter.label }}</text></view
          ></view
        >
        <view class="album-meta"
          ><text>共{{ filteredAlbumItems.length }}个图片视频</text
          ><text @tap="toggleAlbumSort">{{
            albumSort === 'default' ? '默认排序' : '置顶优先'
          }}</text></view
        >
      </view>
      <view class="album-grid">
        <view
          v-for="item in filteredAlbumItems"
          :key="item.id"
          class="album-cell"
          @tap="previewAlbumImage(item)"
          @longpress.stop="openAlbumMenu(item, $event)"
        >
          <image
            :src="item.src"
            mode="aspectFill"
          />
          <view
            v-if="item.hidden || item.pinned"
            class="album-tag-overlay"
            ><PawAlbumTag
              :text="item.hidden ? '隐藏' : '置顶'"
              :tone="item.hidden ? 'hidden' : 'pinned'"
          /></view>
          <view
            v-if="item.kind === 'video'"
            class="album-video-mark"
            ><text>视频</text></view
          >
        </view>
      </view>
      <view
        v-if="albumMenuVisible"
        class="album-menu-mask"
        @tap="closeAlbumMenu"
      />
      <view
        v-if="albumMenuVisible"
        class="album-menu"
        :style="albumMenuStyle"
        @tap.stop
      >
        <view
          v-for="action in albumMenuActions"
          :key="action.key"
          class="album-menu-item"
          @tap.stop="handleAlbumMenuAction(action.key)"
          ><PawIcon
            class="album-menu-icon"
            :name="action.iconName"
            :size="14"
          /><text>{{ action.label }}</text></view
        >
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAlbumTag from '@/components/PawAlbumTag.vue'
import type { PawEventTouchPoint } from '@/utils/pawEventMetadata.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import {
  createAnimalAlbumFilters,
  createAnimalAlbumItems,
  createAnimalAlbumMenuActions,
  type AnimalAlbumFilterKey,
  type AnimalAlbumItem,
  type AnimalAlbumMenuActionKey,
  type AnimalAlbumPageState,
} from '../../services/albumMetadata.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeString(options: unknown, keys: string[], fallback = ''): string {
  if (!isRecord(options)) return fallback
  for (const key of keys) {
    const value = options[key]
    if ((typeof value === 'string' || typeof value === 'number') && value) return String(value)
  }
  return fallback
}

function firstTouch(
  value: TouchList | PawEventTouchPoint[] | undefined,
): PawEventTouchPoint | null {
  if (!value?.length) return null
  const touch = value[0]
  if (!touch) return null
  return {
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY,
  }
}

function coordinateValue(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function coordinate(
  primary: number | undefined,
  secondary: number | undefined,
  detail: number | undefined,
  fallback: number,
): number {
  for (const value of [primary, secondary, detail]) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return fallback
}

export default defineComponent({
  components: { PawPageNav, PawIcon, PawAlbumTag },
  data(): AnimalAlbumPageState {
    return {
      animalId: '',
      yardId: '',
      albumPetName: '动物',
      invalid: true,
      canManage: false,
      albumFilter: 'all',
      albumSort: 'default',
      albumMenuVisible: false,
      albumMenuPosition: { left: 15, top: 150 },
      selectedAlbumId: '',
      albumItems: createAnimalAlbumItems(),
    }
  },
  computed: {
    emptyCopy() {
      return this.animalId ? '该动物暂无可用相册' : '缺少动物 ID'
    },
    albumFilters() {
      return createAnimalAlbumFilters()
    },
    filteredAlbumItems(): AnimalAlbumItem[] {
      const filter = this.albumFilter
      const items = this.albumItems.filter((item) => {
        if (filter === 'favorite') return item.favorite
        if (filter === 'video') return item.kind === 'video'
        if (filter === 'all') return true
        return item.kind === filter || item.categories.includes(filter)
      })
      return this.albumSort === 'pinned'
        ? [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned))
        : items
    },
    albumMenuStyle() {
      return { left: `${this.albumMenuPosition.left}px`, top: `${this.albumMenuPosition.top}px` }
    },
    albumMenuActions() {
      if (!this.canManage) return []
      return createAnimalAlbumMenuActions()
    },
  },
  onLoad(options: unknown = {}) {
    this.animalId = routeString(options, ['animalId', 'petId']).trim()
    this.yardId = routeString(options, ['yardId']).trim()
    this.albumPetName = routeString(options, ['animalName', 'petName'], '动物')
    this.invalid = !this.animalId
    // Local QA fixtures identify managed animals; a query flag never grants write capability.
    this.canManage = ['pet-orange', 'pet-dog', 'roster-cat-1', 'roster-dog-1'].includes(
      this.animalId,
    )
    try {
      if (this.animalId)
        buildRoute(
          'animal.album',
          this.yardId
            ? { animalId: this.animalId, yardId: this.yardId }
            : { animalId: this.animalId },
        )
    } catch {
      this.invalid = true
    }
  },
  methods: {
    selectAlbumFilter(filter: AnimalAlbumFilterKey) {
      this.albumFilter = filter
      this.closeAlbumMenu()
    },
    toggleAlbumSort() {
      this.albumSort = this.albumSort === 'default' ? 'pinned' : 'default'
    },
    previewAlbumImage(item: AnimalAlbumItem) {
      if (this.albumMenuVisible || !item) return
      const urls = this.filteredAlbumItems.map((entry) => entry.src)
      if (urls.length) uni.previewImage({ current: item.src, urls })
    },
    openAlbumMenu(item: AnimalAlbumItem, event: PawEvent) {
      if (!this.canManage || !item) return
      this.selectedAlbumId = item.id
      const changedTouches = event.changedTouches
      const touches = event.touches
      const eventDetail: unknown = event.detail
      const touch = firstTouch(changedTouches) || firstTouch(touches)
      const detail = isRecord(eventDetail) ? eventDetail : {}
      const info =
        typeof uni !== 'undefined' && uni.getSystemInfoSync ? uni.getSystemInfoSync() : undefined
      const width = Number(info?.windowWidth) || 375
      const height = Number(info?.windowHeight) || 667
      const x = coordinate(touch?.clientX, touch?.pageX, coordinateValue(detail.x), width / 2)
      const y = coordinate(touch?.clientY, touch?.pageY, coordinateValue(detail.y), height / 2)
      this.albumMenuPosition = {
        left: Math.max(0, Math.min(x, width - 149)),
        top: Math.max(0, Math.min(y, height - 148)),
      }
      this.albumMenuVisible = true
    },
    closeAlbumMenu() {
      this.albumMenuVisible = false
      this.selectedAlbumId = ''
    },
    handleAlbumMenuAction(key: AnimalAlbumMenuActionKey) {
      const item = this.albumItems.find((entry) => entry.id === this.selectedAlbumId)
      if (!item || !this.canManage) return this.closeAlbumMenu()
      if (key === 'pin') item.pinned = !item.pinned
      if (key === 'favorite') item.favorite = !item.favorite
      if (key === 'hide') item.hidden = !item.hidden
      if (key === 'delete')
        this.albumItems = this.albumItems.filter((entry) => entry.id !== item.id)
      this.closeAlbumMenu()
      uni.showToast({ title: key === 'delete' ? '已删除' : '已更新', icon: 'none' })
    },
  },
})
</script>

<style scoped>
.album-page {
  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  flex-direction: column;
  background: #f5f5f5;
  color: #222;
}
.album-scroll {
  min-height: 0;
  flex: 1 1 auto;
}
.album-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 15px 0;
  box-sizing: border-box;
}
.album-tabs {
  display: flex;
  height: 28px;
  align-items: center;
  justify-content: space-between;
}
.album-tab {
  display: flex;
  width: 52px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: #fff;
  color: #666;
}
.album-tab text {
  font-size: 12px;
}
.album-tab.active {
  border: 0.5px solid #e75220;
  background: #fff0ec;
  color: #e75220;
}
.album-meta {
  display: flex;
  height: 29px;
  align-items: center;
  justify-content: space-between;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
}
.album-meta text:last-child {
  color: #333;
  font-size: 11px;
  font-weight: 500;
}
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  background: #f5f5f5;
}
.album-cell {
  position: relative;
  width: 100%;
  height: 125px;
  overflow: hidden;
}
.album-cell image {
  display: block;
  width: 100%;
  height: 100%;
}
.album-tag-overlay {
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 2;
}
.album-video-mark {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}
.album-video-mark text {
  font-size: 10px;
  line-height: 14px;
}
.album-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0);
}
.album-menu {
  position: fixed;
  z-index: 21;
  display: flex;
  width: 149px;
  height: 148px;
  flex-direction: column;
  padding: 8px 0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}
.album-menu-item {
  display: flex;
  height: 33px;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: #333;
  font-size: 12px;
}
.album-empty {
  display: flex;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #888;
  font-size: 14px;
  text-align: center;
}
.album-empty-hint {
  color: #aaa;
  font-size: 12px;
}
</style>
