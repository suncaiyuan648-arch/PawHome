<template>
  <view
    class="paw-adoption-reject-reason"
    :class="{ 'is-expanded': expanded }"
    data-qa="qa-adoption-reject-reason"
    @tap="toggle"
  >
    <view class="paw-adoption-reject-reason__summary">
      <text>拒绝说明</text>
      <view class="paw-adoption-reject-reason__action">
        <text>{{ expanded ? '收起' : '查看' }}</text>
        <PawIcon
          name="navigation/chevron-right"
          :size="12"
          :rotate="expanded ? 90 : 0"
        />
      </view>
    </view>
    <view
      v-if="expanded"
      class="paw-adoption-reject-reason__detail"
    >
      <PawImage
        class="paw-adoption-reject-reason__avatar"
        :src="actor.avatar"
        :size="34"
        :radius="17"
        :preview="false"
      />
      <view class="paw-adoption-reject-reason__content">
        <view class="paw-adoption-reject-reason__identity">
          <text class="paw-adoption-reject-reason__name">{{ actor.name }}</text>
          <LevelBadge :level="actor.level" />
          <view class="paw-adoption-reject-reason__role"
            ><text>{{ actor.role }}</text></view
          >
        </view>
        <text class="paw-adoption-reject-reason__note">{{
          note || '当前申请暂未通过，请关注其他小院。'
        }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawImage from '@/components/base/PawImage.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'

interface AdoptionRejector {
  name?: string
  avatar?: string
  level?: number | string
  role?: string
}

interface AdoptionRejectReasonState {
  expanded: boolean
}

export default defineComponent({
  name: 'PawAdoptionRejectReason',
  components: { PawImage, PawIcon, LevelBadge },
  props: {
    rejector: { type: Object as PropType<AdoptionRejector>, default: () => ({}) },
    note: { type: String, default: '' },
  },
  data(): AdoptionRejectReasonState {
    return { expanded: false }
  },
  computed: {
    actor() {
      return {
        name: this.rejector.name || '拒绝者',
        avatar: this.rejector.avatar || '/static/figma/home/feed-avatar.png',
        level: this.rejector.level || 1,
        role: this.rejector.role || '院主',
      }
    },
  },
  methods: {
    toggle() {
      this.expanded = !this.expanded
    },
  },
})
</script>

<style scoped>
.paw-adoption-reject-reason {
  display: flex;
  min-height: 50px;
  margin-bottom: 10px;
  padding: 0 17px;
  box-sizing: border-box;
  flex-direction: column;
  overflow: hidden;
  border-radius: 9px;
  background: #fff;
}

.paw-adoption-reject-reason__summary {
  display: flex;
  min-height: 50px;
  flex: 0 0 50px;
  align-items: center;
  justify-content: space-between;
  color: #333;
  font-size: 16px;
  line-height: 23px;
}

.paw-adoption-reject-reason__action {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #999;
}

.paw-adoption-reject-reason__detail {
  display: flex;
  min-width: 0;
  gap: 10px;
  padding: 0 0 15px;
  align-items: flex-start;
}

.paw-adoption-reject-reason__avatar {
  display: block;
  flex: 0 0 34px;
}

.paw-adoption-reject-reason__content {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 6px;
  flex-direction: column;
}

.paw-adoption-reject-reason__identity {
  display: flex;
  min-width: 0;
  min-height: 16px;
  align-items: center;
  gap: 6px;
}

.paw-adoption-reject-reason__name {
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-adoption-reject-reason__role {
  display: inline-flex;
  height: 16px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff0d9;
  color: #ef7b00;
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
}

.paw-adoption-reject-reason__note {
  display: block;
  color: #666;
  font-size: 14px;
  line-height: 21px;
  word-break: break-all;
}
</style>
