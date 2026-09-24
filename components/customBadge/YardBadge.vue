<template>
  <PawBadge
    :text="label"
    color="var(--paw-yard-tag-bg, #fff463)"
    text-color="var(--paw-yard-tag-text, #333333)"
    @tap.stop="onTap"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawBadge from '@/components/base/PawBadge.vue'
import { openYardDetail } from '@/utils/profileNav.ts'

export default defineComponent({
  name: 'YardBadge',
  components: { PawBadge },
  options: {
    // 这个领域包装组件不参与布局，避免 wx-yard-badge 生成额外的行盒高度。
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    label: { type: String, default: '小院' },
    yardId: { type: [Number, String], default: '' },
    yardName: { type: String, default: '' },
  },
  methods: {
    onTap() {
      const yardId = String(
        this.yardId === null || this.yardId === undefined ? '' : this.yardId,
      ).trim()
      if (!yardId) return
      openYardDetail({ yardId, yardName: this.yardName || this.label })
    },
  },
})
</script>
