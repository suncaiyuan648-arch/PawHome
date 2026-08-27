<template>
  <view class="paw-user-identity" :class="`paw-user-identity--${size}`" @tap.stop="onClick">
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
    size: { type: String, default: 'comment' }
  },
  emits: ['click', 'avatar-click', 'name-click'],
  computed: { avatarSize() { return this.size === 'compact' ? 22 : this.size === 'large' ? 50 : 34 } },
  methods: { onClick(event) { this.$emit('click', event) }, onAvatarClick(event) { this.$emit('avatar-click', event); this.$emit('click', event) }, onNameClick(event) { this.$emit('name-click', event); this.$emit('click', event) } }
}
</script>

<style scoped>
.paw-user-identity { display: inline-flex; align-items: center; min-width: 0; }
.paw-user-identity__content { min-width: 0; margin-left: 8px; }
.paw-user-identity__name-row { display: flex; align-items: center; gap: 5px; min-width: 0; }
.paw-user-identity__name { overflow: hidden; color: #333; font-size: 13px; font-weight: 500; line-height: 16px; text-overflow: ellipsis; white-space: nowrap; }
.paw-user-identity--large .paw-user-identity__name { font-size: 14px; font-weight: 700; }
.paw-user-identity--compact .paw-user-identity__content { margin-left: 5px; }
</style>
