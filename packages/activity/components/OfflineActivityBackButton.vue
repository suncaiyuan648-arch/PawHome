<template>
  <view
    class="offline-activity-back-button"
    :data-qa="qa || null"
    aria-label="返回"
    role="button"
    @tap.stop="$emit('back')"
  >
    <image
      class="offline-activity-back-button__icon"
      :src="OFFLINE_ACTIVITY_ASSETS.back"
      mode="aspectFit"
      aria-hidden="true"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { eventContract } from '@/utils/componentEvents.ts'
import { OFFLINE_ACTIVITY_ASSETS } from '../services/offlineActivityAssets.ts'

export default defineComponent({
  name: 'OfflineActivityBackButton',
  props: {
    qa: { type: String, default: '' },
  },
  emits: {
    back: eventContract<[]>(),
  },
  setup() {
    return { OFFLINE_ACTIVITY_ASSETS }
  },
})
</script>

<style scoped>
.offline-activity-back-button,
.offline-activity-back-button__icon {
  display: block;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
}
</style>
