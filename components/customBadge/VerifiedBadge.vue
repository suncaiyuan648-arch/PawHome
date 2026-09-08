<template>
  <PawBadge text="已实名" color="#fffaf0" text-color="#a9731d" size="middle" />
</template>

<script>
import PawBadge from '@/components/base/PawBadge.vue'

export default {
  name: 'VerifiedBadge',
  components: { PawBadge },
  options: {
    // 胶囊本身不增加额外布局盒，和等级胶囊保持一致。
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  }
}
</script>
