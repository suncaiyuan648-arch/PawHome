<template>
  <PawButton
    :tone="buttonTone"
    :size="size"
    :shape="shape"
    :block="true"
    :disabled="disabled"
    :loading="loading"
    :form-type="formType"
    :text="text"
    @click="$emit('click', $event)"
  ><slot>{{ text }}</slot></PawButton>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'

export default {
  name: 'PawPrimaryButton',
  components: { PawButton },
  props: {
    text: { type: String, default: '' },
    variant: { type: String, default: 'brand' },
    size: { type: String, default: 'lg' },
    shape: { type: String, default: 'pill' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    formType: { type: String, default: '' }
  },
  emits: ['click'],
  computed: {
    buttonTone() { return this.variant === 'default' ? 'brand' : this.variant }
  }
}
</script>
