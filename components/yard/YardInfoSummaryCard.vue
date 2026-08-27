<template>
  <YardSummaryCard :yard="yardModel" variant="list" @click="$emit('click', $event)" @pet-click="$emit('pet-click', $event)" />
</template>

<script>
import YardSummaryCard from '@/components/yard/YardSummaryCard.vue'

export default {
  name: 'YardInfoSummaryCard',
  components: { YardSummaryCard },
  props: {
    avatar: { type: String, default: '/static/avatar.png' },
    name: { type: String, default: '' },
    verified: { type: Boolean, default: true },
    locationLine: { type: String, default: '' },
    tags: { type: Array, default: () => [] },
    desc: { type: String, default: '' },
    thumbUrls: { type: Array, default: () => [] }
  },
  emits: ['click', 'pet-click'],
  computed: {
    yardModel() { return { avatar: this.avatar, name: this.name, verified: this.verified, location: this.locationLine, tags: this.tags, description: this.desc, gallery: this.thumbUrls } }
  }
}
</script>
