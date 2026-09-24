<template>
  <YardSummaryCard :yard="yardModel" variant="list" @click="$emit('click', $event)" @pet-click="$emit('pet-click', $event)" />
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'
import { defineComponent, type PropType } from 'vue'

import YardSummaryCard from '@/components/yard/YardSummaryCard.vue'
import type { YardSummaryGallerySource, YardSummaryRecord } from '@/components/yard/YardSummaryCard.vue'

export default defineComponent({
  name: 'YardInfoSummaryCard',
  components: { YardSummaryCard },
  props: {
    avatar: { type: String, default: '/static/avatar.png' },
    name: { type: String, default: '' },
    verified: { type: Boolean, default: true },
    locationLine: { type: String, default: '' },
    tags: { type: Array as PropType<string[]>, default: () => [] },
    desc: { type: String, default: '' },
    thumbUrls: { type: Array as PropType<YardSummaryGallerySource[]>, default: () => [] }
  },
  emits: {
    'click': eventContract<[yard: YardSummaryRecord]>(),
    'pet-click': eventContract<[photo: { src: string; title?: string }]>(),
  },
  computed: {
    yardModel(): YardSummaryRecord { return { avatar: this.avatar, name: this.name, verified: this.verified, location: this.locationLine, tags: this.tags, description: this.desc, gallery: this.thumbUrls } }
  }
})
</script>
