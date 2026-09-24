<template>
  <PawRegionPicker
    :initial-parts="initialParts"
    :max-level="maxLevel"
    :start-level="startLevel"
    fallback-url="/packages/address/pages/editor/index?kind=shipping"
    @complete="onComplete"
    @cancel="goBack"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawRegionPicker from '../../components/address/PawRegionPicker.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import {
  createRegionPickerDemoMetadata,
  normalizeRegionSelectionPayload,
  type RegionSelectionPayload,
} from '@/utils/regionMock.ts'

interface RegionSelectorPageState {
  initialParts: string[]
  maxLevel: number
  startLevel: number
  cityMode: boolean
}

type RegionEventChannel = Pick<UniNamespace.EventChannel, 'on' | 'emit'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getRegionEventChannel(page: unknown): RegionEventChannel | null {
  if (!isRecord(page)) return null
  const getChannel = page.getOpenerEventChannel
  if (typeof getChannel !== 'function') return null
  const channel: unknown = getChannel.call(page)
  if (!isRecord(channel)) return null
  const on = channel.on
  const emit = channel.emit
  if (typeof on !== 'function' || typeof emit !== 'function') return null
  return {
    on: on.bind(channel),
    emit: emit.bind(channel),
  }
}

export default defineComponent({
  name: 'RegionSelectorPage',
  components: { PawRegionPicker },
  data(): RegionSelectorPageState {
    return {
      initialParts: [],
      maxLevel: 2,
      startLevel: -1,
      cityMode: false,
    }
  },
  onLoad(query: unknown = {}) {
    const route = isRecord(query) ? query : {}
    this.cityMode = route.mode === 'city'
    this.maxLevel = this.cityMode ? 1 : 2
    this.startLevel = -1
    this.initialParts = []

    const demo = createRegionPickerDemoMetadata(route.state)
    if (demo) {
      this.maxLevel = demo.maxLevel
      this.startLevel = demo.startLevel
      this.initialParts = demo.initialParts
    }

    const channel = getRegionEventChannel(this)
    if (channel) {
      channel.on('initRegion', (payload: unknown) => {
        const initial = normalizeRegionSelectionPayload(payload)
        if (!initial) return
        this.startLevel = -1
        this.initialParts = initial.parts
      })
    }
  },
  methods: {
    onComplete(payload: RegionSelectionPayload) {
      const channel = getRegionEventChannel(this)
      if (channel) channel.emit('regionSelected', payload)
      const parts = payload.parts.filter(Boolean)
      if (this.cityMode && parts.length) uni.setStorageSync('selectedCity', parts[parts.length - 1])
      goBackSmart({
        fallbackUrl: '/packages/address/pages/editor/index?kind=shipping',
        fallbackLaunch: 'redirectTo',
      })
    },
    goBack() {
      goBackSmart({
        fallbackUrl: '/packages/address/pages/editor/index?kind=shipping',
        fallbackLaunch: 'redirectTo',
      })
    },
  },
})
</script>
