<template>
  <view class="paw-user-identity" :class="[`paw-user-identity--${size}`, { 'paw-user-identity--block': block }]" @tap.stop="onClick">
    <PawAvatar v-if="avatar" :src="avatar" :size="avatarSize" :clickable="true" @click="onAvatarClick" />
    <view class="paw-user-identity__content">
      <view class="paw-user-identity__name-row" @tap.stop="onNameClick">
        <text class="paw-user-identity__name">{{ name }}</text>
        <LevelCapsule v-if="level !== null && level !== undefined" :level="level" />
        <PawOwnerBadge v-if="owner" />
        <PawVerifiedBadge v-if="verified" />
      </view>
      <slot />
    </view>
  </view>
</template>

<script>
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawOwnerBadge from '@/components/identity/PawOwnerBadge.vue'
import PawVerifiedBadge from '@/components/identity/PawVerifiedBadge.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'

export default {
  name: 'PawUserIdentity',
  components: { PawAvatar, PawOwnerBadge, PawVerifiedBadge, LevelCapsule },
  props: {
    avatar: { type: String, default: '' },
    name: { type: String, default: '' },
    level: { type: [Number, String], default: null },
    owner: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    size: { type: String, default: 'comment' },
    block: { type: Boolean, default: false }
  },
  emits: ['click', 'avatar-click', 'name-click'],
  computed: { avatarSize() { return this.size === 'compact' ? 22 : this.size === 'large' ? 50 : 34 } },
  methods: { onClick(event) { this.$emit('click', event) }, onAvatarClick(event) { this.$emit('avatar-click', event); this.$emit('click', event) }, onNameClick(event) { this.$emit('name-click', event); this.$emit('click', event) } }
}
</script>

<style scoped>
.paw-user-identity { display: inline-flex; align-items: center; column-gap: 8px; min-width: 0; }
.paw-user-identity--block { display: flex; width: 100%; box-sizing: border-box; }
.paw-user-identity--block .paw-user-identity__content { flex: 1 1 0%; width: 0; min-width: 0; }
.paw-user-identity__content { min-width: 0; }
.paw-user-identity__name-row { display: flex; align-items: center; column-gap: 3px; min-width: 0; }
.paw-user-identity__name { overflow: hidden; color: #333; font-size: 13px; font-weight: 500; line-height: 16px; text-overflow: ellipsis; white-space: nowrap; }
.paw-user-identity--large .paw-user-identity__name { font-size: 14px; font-weight: 700; }
.paw-user-identity--compact { column-gap: 5px; }
.paw-user-identity__name-row :deep(.paw-owner-badge),
.paw-user-identity__name-row :deep(.paw-verified-badge),
.paw-user-identity__name-row :deep(.level-capsule) { flex-shrink: 0; }
</style>
