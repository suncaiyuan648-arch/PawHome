<template>
  <PawIcon :name="liked ? 'actions/like-filled' : 'actions/like'" :size="iconSize" :label="label" />
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { PAW_ICON_LIKE_SIZE } from '@/components/PawIcon/PawIcon.tokens.js'

export default {
  name: 'PawLikeIcon',
  components: { PawIcon },
  props: {
    liked: { type: Boolean, default: false },
    label: { type: String, default: '' }
  },
  computed: {
    iconSize() {
      return PAW_ICON_LIKE_SIZE
    }
  }
}
</script>
