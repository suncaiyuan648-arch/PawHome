<template>
  <PawRegionPicker :initial-parts="initialParts" :max-level="maxLevel" :start-level="startLevel"
    fallback-url="/pages/meMore/addShippingAddress" @complete="onComplete" @cancel="goBack" />
</template>

<script>
import PawRegionPicker from '@/components/address/PawRegionPicker.vue'
import { goBackSmart } from '@/utils/navBack.js'

export default {
  name: 'RegionSelectorPage',
  components: { PawRegionPicker },
  data() {
    return {
      initialParts: [],
      maxLevel: 2,
      startLevel: -1,
      cityMode: false
    }
  },
  onLoad(query = {}) {
    this.cityMode = query.mode === 'city'
    this.maxLevel = this.cityMode ? 1 : 2

    if (query.state === 'back') {
      this.maxLevel = 3
      this.startLevel = 0
      this.initialParts = ['安徽省', '滁州市', '南谯区', '']
    } else if (query.state === 'street') {
      this.maxLevel = 3
      this.startLevel = 3
      this.initialParts = ['安徽省', '滁州市', '南谯区', '']
    } else if (query.state === 'city') {
      this.maxLevel = 1
      this.startLevel = 1
      this.initialParts = ['安徽省', '', '', '']
    }

    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (channel && typeof channel.on === 'function') {
      channel.on('initRegion', (payload = {}) => {
        if (!Array.isArray(payload.parts)) return
        this.startLevel = -1
        this.initialParts = payload.parts.slice(0, 4)
      })
    }
  },
  methods: {
    onComplete(payload = {}) {
      const parts = Array.isArray(payload.parts) ? payload.parts.filter(Boolean) : []
      const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (channel && typeof channel.emit === 'function') channel.emit('regionSelected', { parts })
      if (this.cityMode && parts.length) uni.setStorageSync('selectedCity', parts[parts.length - 1])
      goBackSmart({ fallbackUrl: '/pages/meMore/addShippingAddress', fallbackLaunch: 'redirectTo' })
    },
    goBack() {
      goBackSmart({ fallbackUrl: '/pages/meMore/addShippingAddress', fallbackLaunch: 'redirectTo' })
    }
  }
}
</script>
