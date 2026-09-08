<template>
  <PawBadge :text="label" color="#EE8002" text-color="#FFFFFF" />
</template>

<script>
import PawBadge from '@/components/base/PawBadge.vue'

export default {
  name: 'PersonalHelpBadge',
  components: { PawBadge },
  options: {
    // 胶囊本身不增加额外布局盒，保持和等级胶囊一致。
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    label: { type: String, default: '个人求助' }
  }
}
</script>
