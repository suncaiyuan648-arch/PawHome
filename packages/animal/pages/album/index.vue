<template>
  <view class="album-page">
    <PawPageNav :title="albumPetName + '的相册'" :title-centered="true" background="#f5f5f5" fallback-url="/pages/index/index" />
    <view v-if="invalid" class="album-empty"><PawIcon name="navigation/clock-disabled" :size="22" color="#999" label="相册不可用" /><text>{{ emptyCopy }}</text><text class="album-empty-hint">请从真实动物详情重新打开相册。</text></view>
    <scroll-view v-else class="album-scroll" scroll-y :show-scrollbar="false">
      <view class="album-controls">
        <view class="album-tabs"><view v-for="filter in albumFilters" :key="filter.key" class="album-tab" :class="{ active: albumFilter === filter.key }" @tap="selectAlbumFilter(filter.key)"><text>{{ filter.label }}</text></view></view>
        <view class="album-meta"><text>共{{ filteredAlbumItems.length }}个图片视频</text><text @tap="toggleAlbumSort">{{ albumSort === 'default' ? '默认排序' : '置顶优先' }}</text></view>
      </view>
      <view class="album-grid">
        <view v-for="item in filteredAlbumItems" :key="item.id" class="album-cell" @tap="previewAlbumImage(item)" @longpress.stop="openAlbumMenu(item, $event)">
          <image :src="item.src" mode="aspectFill" />
          <view v-if="item.hidden || item.pinned" class="album-tag-overlay"><PawAlbumTag :text="item.hidden ? '隐藏' : '置顶'" :tone="item.hidden ? 'hidden' : 'pinned'" /></view>
          <view v-if="item.kind === 'video'" class="album-video-mark"><text>视频</text></view>
        </view>
      </view>
      <view v-if="albumMenuVisible" class="album-menu-mask" @tap="closeAlbumMenu" />
      <view v-if="albumMenuVisible" class="album-menu" :style="albumMenuStyle" @tap.stop>
        <view v-for="action in albumMenuActions" :key="action.key" class="album-menu-item" @tap.stop="handleAlbumMenuAction(action.key)"><PawIcon class="album-menu-icon" :name="action.iconName" :size="14" /><text>{{ action.label }}</text></view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAlbumTag from '@/components/PawAlbumTag.vue'
import { buildRoute } from '@/navigation/routeContracts.js'

const ALBUM_ITEMS = [
  { id: 'album-01', src: '/static/figma/feature/album-original-01.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: true, favorite: true },
  { id: 'album-02', src: '/static/figma/feature/album-original-02.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: true, favorite: false },
  { id: 'album-03', src: '/static/figma/feature/album-original-03.png', kind: 'image', categories: ['image', 'feeding'], pinned: true, favorite: true },
  { id: 'album-04', src: '/static/figma/feature/album-original-04.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: true, favorite: false },
  { id: 'album-05', src: '/static/figma/feature/album-original-05.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: false },
  { id: 'album-06', src: '/static/figma/feature/album-original-06.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: true },
  { id: 'album-07', src: '/static/figma/feature/album-original-07.png', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: false },
  { id: 'album-08', src: '/static/figma/feature/album-original-08.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false, hidden: true },
  { id: 'album-09', src: '/static/figma/feature/album-original-09.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: true },
  { id: 'album-10', src: '/static/figma/feature/album-original-10.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false },
  { id: 'album-11', src: '/static/figma/feature/album-original-11.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: false },
  { id: 'album-12', src: '/static/figma/feature/album-original-12.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false },
  { id: 'album-13', src: '/static/figma/feature/album-original-13.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: true },
  { id: 'album-14', src: '/static/figma/feature/album-original-14.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false }
]

export default {
  components: { PawPageNav, PawIcon, PawAlbumTag },
  data() {
    return {
      animalId: '', yardId: '', albumPetName: '动物', invalid: true, canManage: false,
      albumFilter: 'all', albumSort: 'default', albumMenuVisible: false, albumMenuPosition: { left: 15, top: 150 }, selectedAlbumId: '', albumItems: ALBUM_ITEMS.map((item) => ({ ...item }))
    }
  },
  computed: {
    emptyCopy() { return this.animalId ? '该动物暂无可用相册' : '缺少动物 ID' },
    albumFilters() { return [{ key: 'all', label: '全部' }, { key: 'favorite', label: '收藏' }, { key: 'image', label: '图片' }, { key: 'video', label: '视频' }, { key: 'feeding', label: '投喂' }, { key: 'daily', label: '日常' }] },
    filteredAlbumItems() {
      const items = this.albumItems.filter((item) => this.albumFilter === 'favorite' ? item.favorite : this.albumFilter === 'video' ? item.kind === 'video' : this.albumFilter === 'all' ? true : item.kind === this.albumFilter || item.categories.includes(this.albumFilter))
      return this.albumSort === 'pinned' ? [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned)) : items
    },
    albumMenuStyle() { return { left: `${this.albumMenuPosition.left}px`, top: `${this.albumMenuPosition.top}px` } },
    albumMenuActions() {
      if (!this.canManage) return []
      return [{ key: 'pin', label: '置顶/取消置顶', iconName: 'actions/pin' }, { key: 'favorite', label: '收藏/取消收藏', iconName: 'actions/heart' }, { key: 'hide', label: '隐藏/取消隐藏', iconName: 'actions/eye-off' }, { key: 'delete', label: '删除', iconName: 'actions/delete' }]
    }
  },
  onLoad(options = {}) {
    this.animalId = String(options.animalId || options.petId || '').trim()
    this.yardId = String(options.yardId || '').trim()
    this.albumPetName = String(options.animalName || options.petName || '动物')
    this.invalid = !this.animalId
    // Local QA fixtures identify managed animals; a query flag never grants write capability.
    this.canManage = ['pet-orange', 'pet-dog', 'roster-cat-1', 'roster-dog-1'].includes(this.animalId)
    try { if (this.animalId) buildRoute('animal.album', this.yardId ? { animalId: this.animalId, yardId: this.yardId } : { animalId: this.animalId }) } catch (error) { this.invalid = true }
  },
  methods: {
    selectAlbumFilter(filter) { this.albumFilter = filter; this.closeAlbumMenu() },
    toggleAlbumSort() { this.albumSort = this.albumSort === 'default' ? 'pinned' : 'default' },
    previewAlbumImage(item) { if (this.albumMenuVisible || !item) return; const urls = this.filteredAlbumItems.map((entry) => entry.src); if (urls.length) uni.previewImage({ current: item.src, urls }) },
    openAlbumMenu(item, event) {
      if (!this.canManage || !item) return
      this.selectedAlbumId = item.id
      const touch = event && (event.changedTouches && event.changedTouches[0] || event.touches && event.touches[0]); const detail = event && event.detail || {}; const info = typeof uni !== 'undefined' && uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}; const width = Number(info.windowWidth) || 375; const height = Number(info.windowHeight) || 667; const x = Number(touch && (touch.clientX || touch.pageX) || detail.x || width / 2); const y = Number(touch && (touch.clientY || touch.pageY) || detail.y || height / 2)
      this.albumMenuPosition = { left: Math.max(0, Math.min(x, width - 149)), top: Math.max(0, Math.min(y, height - 148)) }; this.albumMenuVisible = true
    },
    closeAlbumMenu() { this.albumMenuVisible = false; this.selectedAlbumId = '' },
    handleAlbumMenuAction(key) {
      const item = this.albumItems.find((entry) => entry.id === this.selectedAlbumId); if (!item || !this.canManage) return this.closeAlbumMenu()
      if (key === 'pin') item.pinned = !item.pinned; if (key === 'favorite') item.favorite = !item.favorite; if (key === 'hide') item.hidden = !item.hidden; if (key === 'delete') this.albumItems = this.albumItems.filter((entry) => entry.id !== item.id)
      this.closeAlbumMenu(); uni.showToast({ title: key === 'delete' ? '已删除' : '已更新', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.album-page { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; background: #f5f5f5; color: #222; }
.album-scroll { min-height: 0; flex: 1 1 auto; }
.album-controls { display: flex; flex-direction: column; gap: 8px; padding: 10px 15px 0; box-sizing: border-box; }
.album-tabs { display: flex; height: 28px; align-items: center; justify-content: space-between; }
.album-tab { display: flex; width: 52px; height: 28px; align-items: center; justify-content: center; border-radius: 5px; background: #fff; color: #666; }
.album-tab text { font-size: 12px; }
.album-tab.active { border: .5px solid #e75220; background: #fff0ec; color: #e75220; }
.album-meta { display: flex; height: 29px; align-items: center; justify-content: space-between; background: #f5f5f5; color: #666; font-size: 12px; }
.album-meta text:last-child { color: #333; font-size: 11px; font-weight: 500; }
.album-grid { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; background: #f5f5f5; }
.album-cell { position: relative; width: 100%; height: 125px; overflow: hidden; }
.album-cell image { display: block; width: 100%; height: 100%; }
.album-tag-overlay { position: absolute; left: 6px; top: 6px; z-index: 2; }
.album-video-mark { position: absolute; right: 6px; bottom: 6px; padding: 2px 4px; border-radius: 3px; background: rgba(0,0,0,.55); color: #fff; }
.album-video-mark text { font-size: 10px; line-height: 14px; }
.album-menu-mask { position: fixed; inset: 0; z-index: 20; background: rgba(0,0,0,0); }
.album-menu { position: fixed; z-index: 21; display: flex; width: 149px; height: 148px; flex-direction: column; padding: 8px 0; border-radius: 10px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.03); box-sizing: border-box; }
.album-menu-item { display: flex; height: 33px; align-items: center; gap: 12px; padding: 0 16px; color: #333; font-size: 12px; }
.album-empty { display: flex; min-height: 360px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; color: #888; font-size: 14px; text-align: center; }
.album-empty-hint { color: #aaa; font-size: 12px; }
</style>
