<template>
  <view class="paw-user-identity" :class="[`paw-user-identity--${size}`, { 'paw-user-identity--block': block }]"
    @tap.stop="onClick">
    <PawAvatar v-if="avatar" :src="avatar" :size="resolvedAvatarSize" :clickable="true" @click="onAvatarClick" />
    <view class="paw-user-identity__content">
      <view class="paw-user-identity__name-row">
        <text class="paw-user-identity__name" @tap.stop="onNameClick">{{ name }}</text>
        <view v-if="level !== null && level !== undefined" class="paw-user-identity__badge-hit"
          @tap.stop="onMembershipClick">
          <LevelCapsule :level="level" />
        </view>
        <view v-if="owner" class="paw-user-identity__badge-hit" @tap.stop="onBadgeClick">
          <PawOwnerBadge />
        </view>
        <view v-if="verified" class="paw-user-identity__badge-hit" @tap.stop="onBadgeClick">
          <PawVerifiedBadge />
        </view>
        <text v-if="tag" class="paw-user-identity__tag">{{ tag }}</text>
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
    tag: { type: String, default: '' },
    size: { type: String, default: 'comment' },
    avatarSize: { type: [Number, String], default: null },
    block: { type: Boolean, default: false }
  },
  emits: ['click', 'avatar-click', 'name-click', 'membership-click', 'badge-click'],
  computed: {
    resolvedAvatarSize() {
      return this.avatarSize !== null && this.avatarSize !== undefined
        ? this.avatarSize
        : (this.size === 'compact' ? 22 : this.size === 'large' ? 50 : 34)
    }
  },
  methods: {
    onClick(event) { this.$emit('click', event) },
    onAvatarClick(event) { this.$emit('avatar-click', event); this.$emit('click', event) },
    onNameClick(event) { this.$emit('name-click', event); this.$emit('click', event) },
    onMembershipClick(event) { this.$emit('membership-click', event) },
    onBadgeClick(event) { this.$emit('badge-click', event) }
  }
}
</script>

<style scoped>
.paw-user-identity {
  display: inline-flex;
  align-items: center;
  column-gap: 8px;
  min-width: 0;
}

.paw-user-identity--block {
  display: flex;
  width: 100%;
  align-items: flex-start;
  box-sizing: border-box;
}

.paw-user-identity--block .paw-user-identity__content {
  flex: 1 1 0%;
  width: 0;
  min-width: 0;
}

.paw-user-identity__content {
  min-width: 0;
}

.paw-user-identity__name-row {
  display: flex;
  align-items: center;
  column-gap: 3px;
  min-width: 0;
}

.paw-user-identity__name {
  overflow: hidden;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-user-identity__badge-hit {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.paw-user-identity--large .paw-user-identity__name {
  font-size: 14px;
  font-weight: 700;
}

.paw-user-identity--compact {
  column-gap: 5px;
}

.paw-user-identity__name-row :deep(.paw-owner-badge),
.paw-user-identity__name-row :deep(.paw-verified-badge),
.paw-user-identity__name-row :deep(.level-capsule) {
  flex-shrink: 0;
}

.paw-user-identity__tag {
  display: inline-flex;
  max-width: 100%;
  height: 16px;
  align-items: center;
  flex-shrink: 1;
  padding: 0 5px;
  overflow: hidden;
  border-radius: 8px;
  background: #fff463;
  color: #333;
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
