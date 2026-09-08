<template>
  <PawBadge :text="`Lv${displayLevel}`" color="var(--paw-level-bg, #523400)"
    text-color="var(--paw-level-text, #f6e1b8)" />
</template>

<script>
import PawBadge from '@/components/base/PawBadge.vue'

export default {
  name: 'LevelBadge',
  components: { PawBadge },
  options: {
    // 等级徽章同样不增加一层布局盒，直接使用 PawBadge 的独立尺寸。
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    level: { type: [Number, String], default: 1 },
    // 保留旧 API，等级 Badge 现在统一使用 PawBadge 的独立胶囊布局。
    inline: { type: Boolean, default: false }
  },
  computed: {
    displayLevel() {
      const level = Number(this.level)
      return Number.isFinite(level) && level > 0 ? Math.floor(level) : 1
    }
  }
}
</script>
