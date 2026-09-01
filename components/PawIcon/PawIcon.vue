<template>
  <view class="paw-icon" :style="rootStyle" :aria-label="label || undefined" :aria-hidden="label ? undefined : true">
    <image v-if="iconSrc" class="paw-icon__image" :style="imageStyle" :src="iconSrc" mode="aspectFit" />
  </view>
</template>

<script>
import { PAW_ICON_DEFAULT_COLOR } from './PawIcon.tokens.js'
import { PAW_ICON_REGISTRY } from './generated/icon-registry.js'
import {
  normalizePawIconRotate,
  resolveMonoIconUri,
  resolvePawIconDimensions,
  resolvePawIconTransform,
  warnColorOverride,
  warnUnknownIcon
} from './PawIcon.utils.js'

export default {
  name: 'PawIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [String, Number], default: 'md' },
    color: { type: String, default: PAW_ICON_DEFAULT_COLOR },
    label: { type: String, default: '' },
    rotate: { type: Number, default: 0 },
    flip: {
      type: String,
      default: 'none',
      validator: value => ['none', 'horizontal', 'vertical', 'both'].includes(value)
    }
  },
  computed: {
    definition() {
      return PAW_ICON_REGISTRY[this.name] || null
    },
    baseDimensions() {
      return resolvePawIconDimensions(this.size, this.definition)
    },
    rotation() {
      return normalizePawIconRotate(this.rotate)
    },
    resolvedDimensions() {
      const angle = this.rotation * Math.PI / 180
      const cos = Math.abs(Math.cos(angle))
      const sin = Math.abs(Math.sin(angle))
      return {
        width: Math.round((this.baseDimensions.width * cos + this.baseDimensions.height * sin) * 1000) / 1000,
        height: Math.round((this.baseDimensions.width * sin + this.baseDimensions.height * cos) * 1000) / 1000
      }
    },
    rootStyle() {
      return {
        width: `${this.resolvedDimensions.width}px`,
        height: `${this.resolvedDimensions.height}px`
      }
    },
    imageStyle() {
      const dimensions = this.baseDimensions
      const box = this.resolvedDimensions
      return {
        position: 'absolute',
        left: `${(box.width - dimensions.width) / 2}px`,
        top: `${(box.height - dimensions.height) / 2}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        ...resolvePawIconTransform(this.rotation, this.flip)
      }
    },
    iconSrc() {
      if (!this.definition) {
        warnUnknownIcon(this.name)
        return ''
      }
      if (this.definition.kind === 'mono') return resolveMonoIconUri(this.definition.template, this.color)
      if (this.color !== PAW_ICON_DEFAULT_COLOR) warnColorOverride(this.name)
      return this.definition.src
    }
  }
}
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
}
</style>
