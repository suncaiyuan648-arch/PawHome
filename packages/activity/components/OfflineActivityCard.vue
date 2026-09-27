<template>
  <view
    class="offline-activity-card"
    :class="{ 'offline-activity-card--inset': inset }"
    :aria-label="activity.title"
    role="button"
    @tap="$emit('open', activity.activityId)"
  >
    <image
      class="offline-activity-card__cover"
      :src="activity.cover"
      mode="aspectFill"
      :aria-label="activity.title"
    />
    <view class="offline-activity-card__body">
      <view class="offline-activity-card__title-row">
        <view
          class="offline-activity-card__status"
          :class="{ 'offline-activity-card__status--ended': activity.state === 'ended' }"
        >
          <text>{{ activity.stateLabel }}</text>
        </view>
        <text class="offline-activity-card__title">{{ activity.title }}</text>
      </view>
      <text class="offline-activity-card__time">{{ activity.startText }}</text>
      <text class="offline-activity-card__location">{{ activity.locationText }}</text>
      <view class="offline-activity-card__organizer">
        <image
          class="offline-activity-card__organizer-avatar"
          :src="activity.organizerAvatar"
          mode="aspectFill"
        />
        <text class="offline-activity-card__organizer-name">{{ activity.organizerText }}</text>
      </view>
      <view class="offline-activity-card__footer">
        <view class="offline-activity-card__participants">
          <view class="offline-activity-card__avatar-stack">
            <image
              v-for="(avatar, index) in activity.participantAvatars"
              :key="avatar"
              class="offline-activity-card__participant-avatar"
              :class="{ 'offline-activity-card__participant-avatar--overlap': index > 0 }"
              :src="avatar"
              mode="aspectFill"
            />
          </view>
          <text>{{ activity.participantCount }} 人已报名</text>
        </view>
        <button
          class="offline-activity-card__action"
          hover-class="offline-activity-card__action--pressed"
          :aria-label="activity.state === 'ended' ? '查看活动详情' : '报名'
          "
          @tap.stop="$emit('open', activity.activityId)"
        >
          {{ activity.state === 'ended' ? '查看' : '报名' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import { eventContract } from '@/utils/componentEvents.ts'
import type { OfflineActivitySummary } from '../services/offlineActivityFixtures.ts'

export default defineComponent({
  name: 'OfflineActivityCard',
  props: {
    activity: { type: Object as PropType<OfflineActivitySummary>, required: true },
    inset: { type: Boolean, default: false },
  },
  emits: {
    open: eventContract<[activityId: string]>(),
  },
})
</script>

<style scoped>
.offline-activity-card {
  display: flex;
  width: 100%;
  height: 149px;
  min-width: 0;
  overflow: hidden;
  border-radius: 11px;
  background: #fff;
  box-sizing: border-box;
}

.offline-activity-card--inset {
  width: auto;
  margin: 0 15px;
}

.offline-activity-card__cover {
  display: block;
  flex: 0 0 112px;
  width: 112px;
  height: 149px;
  border-radius: 11px;
}

.offline-activity-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding: 10px 11px 12px;
  box-sizing: border-box;
}

.offline-activity-card__title-row {
  display: flex;
  flex: 0 0 18px;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.offline-activity-card__status {
  display: flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 16px;
  overflow: hidden;
  border-radius: 2px;
  background: #ff477e;
  color: #fff;
  font-size: 10px;
  line-height: 16px;
}

.offline-activity-card__status--ended {
  background: #aaa;
}

.offline-activity-card__title {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-activity-card__time,
.offline-activity-card__location {
  display: block;
  flex: 0 0 14px;
  height: 14px;
  overflow: hidden;
  color: #888;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-activity-card__time {
  margin-top: 5px;
}

.offline-activity-card__location {
  margin-top: 6px;
}

.offline-activity-card__organizer {
  display: flex;
  flex: 0 0 20px;
  align-items: center;
  min-width: 0;
  margin-top: 9px;
  gap: 5px;
}

.offline-activity-card__organizer-avatar {
  display: block;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.offline-activity-card__organizer-name {
  display: block;
  overflow: hidden;
  color: #888;
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-activity-card__footer {
  display: flex;
  flex: 0 0 26px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  margin-top: auto;
  gap: 4px;
}

.offline-activity-card__participants {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
  color: #888;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
}

.offline-activity-card__avatar-stack {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  margin-right: 6px;
}

.offline-activity-card__participant-avatar {
  display: block;
  flex: 0 0 19px;
  width: 19px;
  height: 19px;
  border: 1px solid #fff;
  border-radius: 50%;
  box-sizing: border-box;
}

.offline-activity-card__participant-avatar--overlap {
  margin-left: -7px;
}

.offline-activity-card__action {
  display: flex;
  flex: 0 0 65px;
  align-items: center;
  justify-content: center;
  width: 65px;
  height: 26px;
  min-height: 26px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 13px;
  background: #ffe60f;
  color: #333;
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
}

.offline-activity-card__action::after {
  border: 0;
}

.offline-activity-card__action--pressed {
  opacity: 0.7;
}
</style>
