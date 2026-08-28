<template>
  <view class="paw-avatar-stack" :style="stackStyle" @tap.stop="$emit('click')">
    <PawAvatar
      v-for="(item, index) in visibleItems"
      :key="item.id || item.pawId || index"
      class="paw-avatar-stack__item"
      :src="typeof item === 'string' ? item : item.avatar"
      :size="size"
      :fallback="fallback"
      :style="{ marginLeft: index === 0 ? '0' : `-${overlap}px`, zIndex: visibleItems.length - index }"
    />
    <text v-if="hiddenCount > 0" class="paw-avatar-stack__more">+{{ hiddenCount }}</text>
  </view>
</template>

<script>
import PawAvatar from '@/components/identity/PawAvatar.vue'

export default {
  name: 'PawAvatarStack',
  components: { PawAvatar },
  props: {
    items: { type: Array, default: () => [] },
    size: { type: [Number, String], default: 22 },
    overlap: { type: [Number, String], default: 8 },
    max: { type: Number, default: 5 },
    fallback: { type: String, default: '/static/avatarlog.png' }
  },
  emits: ['click'],
  computed: {
    visibleItems() { return this.items.slice(0, this.max) },
    hiddenCount() { return Math.max(0, this.items.length - this.max) },
    stackStyle() { return { minHeight: typeof this.size === 'number' ? `${this.size}px` : this.size } }
  }
}
</script>

<style scoped>
.paw-avatar-stack { display: inline-flex; align-items: center; height: 22px; min-width: 0; padding: 0; box-sizing: border-box; cursor: pointer; }
.paw-avatar-stack__item { border: 1px solid #fff; box-sizing: border-box; }
.paw-avatar-stack__more { margin-left: 4px; color: #666; font-size: 11px; }
</style>
