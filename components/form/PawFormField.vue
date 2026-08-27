<template>
  <view class="paw-form-field" :class="{ 'paw-form-field--bare': bare, 'paw-form-field--focused': focused, 'paw-form-field--error': error, 'paw-form-field--disabled': disabled }">
    <text v-if="label" class="paw-form-field__label">{{ label }}</text>
    <input v-if="type !== 'textarea'" class="paw-form-field__input" :value="modelValue" :maxlength="maxlength" :placeholder="placeholder" :disabled="disabled" placeholder-class="paw-form-field__placeholder" @focus="focused = true" @blur="focused = false" @input="$emit('update:modelValue', $event.detail.value || '')" />
    <textarea v-else class="paw-form-field__textarea" :value="modelValue" :maxlength="maxlength" :placeholder="placeholder" :disabled="disabled" placeholder-class="paw-form-field__placeholder" @focus="focused = true" @blur="focused = false" @input="$emit('update:modelValue', $event.detail.value || '')" />
    <text v-if="error" class="paw-form-field__error">{{ error }}</text>
  </view>
</template>

<script>
export default { name: 'PawFormField', props: { modelValue: { type: String, default: '' }, label: { type: String, default: '' }, placeholder: { type: String, default: '' }, type: { type: String, default: 'text' }, maxlength: { type: [Number, String], default: -1 }, error: { type: String, default: '' }, disabled: { type: Boolean, default: false }, bare: { type: Boolean, default: false } }, emits: ['update:modelValue'], data() { return { focused: false } } }
</script>

<style scoped>
.paw-form-field { position: relative; padding: 10px 12px 8px; border: 1px solid #ececec; border-radius: 8px; background: #fff; transition: border-color 160ms ease; }
.paw-form-field--focused { border-color: #f4d600; }
.paw-form-field--error { border-color: var(--paw-color-danger, #ff3d3d); }
.paw-form-field--disabled { opacity: .5; }
.paw-form-field--bare { padding: 0; border: 0; border-radius: 0; background: transparent; }
.paw-form-field__label { display: block; margin-bottom: 5px; color: #333; font-size: 12px; }
.paw-form-field__input, .paw-form-field__textarea { display: block; width: 100%; min-height: 22px; color: #333; font-size: 14px; line-height: 20px; }
.paw-form-field__textarea { min-height: 80px; }
.paw-form-field__placeholder { color: #bdbdbd; font-size: 14px; }
.paw-form-field__error { display: block; margin-top: 4px; color: var(--paw-color-danger, #ff3d3d); font-size: 11px; line-height: 15px; }
</style>
