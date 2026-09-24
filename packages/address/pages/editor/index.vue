<template>
  <view class="address-edit-page">
    <PawAddressForm ref="addressForm" :kind="kind" :typing="typing" :initial-address="initialAddress"
      @save="onSave" />

    <PawFixedActionBar :primary-action="primaryAction" :primary-full-width="true" @primary="submit" />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawAddressForm from '../../components/address/PawAddressForm.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { getAddressById, saveAddress } from '@/utils/addressMock.ts'
import type { AddressKind, AddressRecord } from '@/utils/addressMock.ts'
import type { AddressFormDraft } from '@/utils/addressFormMetadata.ts'

interface AddressEditorPageState {
  kind: AddressKind
  typing: boolean
  initialAddress: Partial<AddressRecord>
}

interface AddressPrimaryAction {
  key: string
  qa: string
  label: string
  size: 'md'
}

interface AddressFormInstance {
  save: () => void
}

type AddressSavedEventChannel = Pick<UniNamespace.EventChannel, 'emit'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isAddressFormInstance(value: unknown): value is AddressFormInstance {
  return isRecord(value) && typeof value.save === 'function'
}

function getAddressEventChannel(page: unknown): AddressSavedEventChannel | null {
  if (!isRecord(page)) return null
  const getChannel = page.getOpenerEventChannel
  if (typeof getChannel !== 'function') return null
  const channel: unknown = getChannel.call(page)
  if (!isRecord(channel) || typeof channel.emit !== 'function') return null
  const emit = channel.emit
  return { emit: (eventName, payload) => { emit.call(channel, eventName, payload) } }
}

export default defineComponent({
  name: 'AddressEditorPage',
  components: { PawAddressForm, PawFixedActionBar },
  data(): AddressEditorPageState {
    return {
      kind: 'shipping',
      typing: false,
      initialAddress: {}
    }
  },
  onLoad(options: unknown = {}) {
    const route = isRecord(options) ? options : {}
    this.kind = route.kind === 'service' ? 'service' : 'shipping'
    this.typing = route.state === 'typing'
    this.initialAddress = {}
		const addressId = typeof route.id === 'string'
			? route.id
			: typeof route.addressId === 'string' ? route.addressId : ''
    if (addressId) this.initialAddress = getAddressById(addressId, this.kind) || {}
  },
  computed: {
    primaryAction(): AddressPrimaryAction {
      return { key: 'save', qa: 'address-save', label: '保存', size: 'md' }
    }
  },
  methods: {
    submit() {
      const addressForm: unknown = this.$refs.addressForm
      if (isAddressFormInstance(addressForm)) addressForm.save()
    },
    onSave(address: AddressFormDraft) {
      const saved = saveAddress({ ...address, id: this.initialAddress.id || undefined }, this.kind)
      const channel = getAddressEventChannel(this)
      if (channel && channel.emit) channel.emit('addressSaved', saved)
      uni.showToast({ title: '已保存', icon: 'none' })
      setTimeout(() => goBackSmart({
        fallbackUrl: `/packages/address/pages/list/index?kind=${encodeURIComponent(this.kind)}`,
        fallbackLaunch: 'redirectTo'
      }), 120)
    }
  }
})
</script>

<style scoped>
.address-edit-page {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}
</style>
