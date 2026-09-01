<template>
  <PawIcon class="paw-chevron" :class="`paw-chevron--${direction}`" name="navigation/chevron-right" :size="size"
    aria-hidden="true" />
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawChevron',
  components: { PawIcon },
  props: {
    direction: { type: String, default: 'right' },
    size: { type: [Number, String], default: 8 }
  },
  computed: {}
}
</script>

<style scoped>
.paw-chevron {
  display: block;
  flex: 0 0 auto;
}

.paw-chevron--right {
  transform: rotate(180deg);
}

.paw-chevron--left {
  transform: rotate(0deg);
}

.paw-chevron--up {
  transform: rotate(90deg);
}

.paw-chevron--down {
  transform: rotate(-90deg);
}
</style>
