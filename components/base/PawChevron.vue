<template>
  <PawIcon class="paw-chevron" name="navigation/chevron-right" :size="size" :rotate="rotation" aria-hidden="true" />
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
  computed: {
    // The canonical chevron asset is left-facing. Apply the direction on
    // PawIcon itself so the transform reaches the SVG image inside the
    // virtual host on WeChat as well as H5.
    rotation() {
      return {
        right: 180,
        left: 0,
        up: 90,
        down: -90
      }[this.direction] ?? 180
    }
  }
}
</script>

<style scoped>
.paw-chevron {
  display: block;
  flex: 0 0 auto;
}
</style>
