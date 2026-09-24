<template>
  <view
    class="paw-icon"
    :style="rootStyle"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : true"
  >
    <image
      v-if="iconSrc"
      class="paw-icon__image"
      :style="imageStyle"
      :src="iconSrc"
      mode="aspectFit"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { PawIconFlip, PawIconName, PawIconSize } from './PawIcon.types'
import { PAW_ICON_DEFAULT_COLOR } from './PawIcon.tokens.ts'
import { PAW_ICON_REGISTRY } from './generated/icon-registry.ts'
import {
  normalizePawIconRotate,
  resolveMonoIconUri,
  resolvePawIconSize,
  resolvePawIconTransform,
  warnColorOverride,
  warnUnknownIcon,
} from './PawIcon.utils.ts'

export default defineComponent({
  name: 'PawIcon',
  // The WeChat custom-component host otherwise participates in the parent
  // line box and can report a font-derived height (for example 19.29px for
  // a 16px icon) even though the actual PawIcon root is 16px × 16px.
  options: {
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    name: { type: String as () => PawIconName, required: true },
    size: { type: [String, Number] as unknown as () => PawIconSize, default: 'base' },
    color: { type: String, default: PAW_ICON_DEFAULT_COLOR },
    label: { type: String, default: '' },
    rotate: { type: Number, default: 0 },
    flip: {
      type: String as PropType<PawIconFlip>,
      default: 'none',
      validator: (value: unknown) =>
        typeof value === 'string' && ['none', 'horizontal', 'vertical', 'both'].includes(value),
    },
  },
  computed: {
    definition() {
      return PAW_ICON_REGISTRY[this.name as keyof typeof PAW_ICON_REGISTRY] || null
    },
    resolvedSize() {
      return resolvePawIconSize(this.size)
    },
    rotation() {
      return normalizePawIconRotate(this.rotate)
    },
    rootStyle() {
      return {
        width: `${this.resolvedSize}px`,
        height: `${this.resolvedSize}px`,
      }
    },
    imageStyle() {
      return {
        width: `${this.resolvedSize}px`,
        height: `${this.resolvedSize}px`,
        ...resolvePawIconTransform(this.rotation, this.flip),
      }
    },
    iconSrc() {
      if (!this.definition) {
        warnUnknownIcon(this.name)
        return ''
      }
      if (this.definition.kind === 'mono' && 'template' in this.definition) {
        return resolveMonoIconUri(this.definition.template, this.color)
      }
      if (this.color !== PAW_ICON_DEFAULT_COLOR) warnColorOverride(this.name)
      return 'src' in this.definition ? this.definition.src : ''
    },
  },
})
</script>

<style scoped>
.paw-icon {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  line-height: 0;
  vertical-align: middle;
}

.paw-icon__image {
  display: block;
  flex: 0 0 auto;
}
</style>
