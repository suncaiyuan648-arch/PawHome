<template>
  <view class="adoption-progress-view" :class="{ 'is-info': view === 'adoption-info', 'is-application': view === 'application' }">
    <view v-if="view === 'application'" class="adoption-progress-view__heading">
      <text>申请内容</text>
    </view>
    <view v-else-if="view === 'adoption-info'" class="adoption-progress-view__heading">
      <text>领养信息</text>
    </view>
    <view v-else class="adoption-progress-view__heading" data-qa="qa-adoption-progress-status">
      <PawIcon :name="statusIcon" :size="18" :color="statusIconColor" />
      <text>{{ presentation.label }}</text>
    </view>

    <AdoptionProgressTimeline v-if="view === 'progress' && presentation.progress"
      :step="presentation.progress.step" :percent="presentation.progress.percent" />

    <view v-if="view !== 'adoption-info'" class="adoption-progress-view__card adoption-progress-view__application"
      data-qa="qa-adoption-progress-application">
      <view class="adoption-progress-view__card-title">
        <text>{{ view === 'application' ? '申请说明' : '申请内容' }}</text>
        <text v-if="record.applicantName" class="adoption-progress-view__applicant">{{ record.applicantName }}</text>
      </view>
      <text class="adoption-progress-view__copy">{{ applicationText }}</text>
      <view v-if="applicationPhotos.length" class="adoption-progress-view__photos">
        <PawImage v-for="(photo, index) in applicationPhotos" :key="`${photo}-${index}`" :src="photo"
          display-mode="fixed" :width="106" :height="106" :radius="4" :preview="false" />
      </view>
      <text v-if="!applicationText && !applicationPhotos.length" class="adoption-progress-view__muted">暂无申请内容</text>
    </view>

    <view v-if="view !== 'application'" class="adoption-progress-view__card adoption-progress-view__pets"
      data-qa="qa-adoption-progress-pets">
      <view class="adoption-progress-view__card-title">
        <text>{{ isCompleted ? '领走的猫咪' : '申请领养的猫咪' }}</text>
        <text class="adoption-progress-view__count">({{ pets.length }})</text>
      </view>
      <view v-if="pets.length" class="adoption-progress-view__pet-grid">
        <view v-for="(pet, index) in pets" :key="pet.id || index" class="adoption-progress-view__pet">
          <PawImage :src="pet.avatar" :size="48" :radius="24" :preview="false" />
          <text>{{ pet.name || '猫咪' }}</text>
        </view>
      </view>
      <text v-else class="adoption-progress-view__muted">暂无关联猫咪</text>
      <view v-if="yardName" class="adoption-progress-view__yard">
        <PawImage :src="record.ownerAvatar" :size="34" :radius="17" :preview="false" />
        <text>{{ yardName }}</text>
        <text class="adoption-progress-view__yard-tag">{{ record.yardTag || '小院' }}</text>
      </view>
    </view>

    <view v-if="view === 'adoption-info'" class="adoption-progress-view__info" data-qa="qa-adoption-progress-info">
      <view class="adoption-progress-view__card-title"><text>小院位置</text></view>
      <text class="adoption-progress-view__info-title">{{ locationName || '暂无小院位置' }}</text>
      <text class="adoption-progress-view__info-copy">{{ locationAddress || '暂无地址信息' }}</text>
      <view class="adoption-progress-view__owner">
        <PawImage :src="record.ownerAvatar" :size="34" :radius="17" :preview="false" />
        <text>{{ contactName || yardName || '院主' }}</text>
        <PawOwnerBadge />
      </view>
      <text class="adoption-progress-view__info-copy">{{ ownerMessage || '暂无联系方式说明' }}</text>
      <text v-if="distance" class="adoption-progress-view__distance">距离 {{ distance }}</text>
    </view>

    <view v-if="view === 'progress' && proofPhotos.length" class="adoption-progress-view__card adoption-progress-view__proof"
      data-qa="qa-adoption-progress-proof">
      <view class="adoption-progress-view__card-title"><text>领养确认</text></view>
      <view class="adoption-progress-view__photos">
        <PawImage v-for="(photo, index) in proofPhotos" :key="`${photo}-${index}`" :src="photo"
          display-mode="fixed" :width="106" :height="106" :radius="4" :preview="false" />
      </view>
      <text v-if="record.confirmStory" class="adoption-progress-view__copy">{{ record.confirmStory }}</text>
    </view>

    <view v-if="presentation.isRejected" class="adoption-progress-view__notice adoption-progress-view__notice--error"
      data-qa="qa-adoption-progress-rejected">
      <text>{{ record.rejectNote || '当前申请暂未通过，请关注其他小院。' }}</text>
    </view>
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawOwnerBadge from '@/components/identity/PawOwnerBadge.vue'
import AdoptionProgressTimeline from './AdoptionProgressTimeline.vue'

export default {
  name: 'AdoptionProgressView',
  components: { PawIcon, PawImage, PawOwnerBadge, AdoptionProgressTimeline },
  props: {
    record: { type: Object, required: true },
    view: { type: String, default: 'progress' },
    presentation: { type: Object, required: true }
  },
  computed: {
    statusIcon() {
      if (this.presentation.isRejected) return 'status/rejected'
      if (this.presentation.status === 'pending' || this.presentation.status === 'cloud_pending') return 'navigation/clock'
      return 'status/check'
    },
    statusIconColor() { return this.presentation.isRejected ? '#ff0038' : '#fd6302' },
    pets() { return Array.isArray(this.record.pets) ? this.record.pets : [] },
    applicationPhotos() {
      return Array.isArray(this.record.mediaPaths) ? this.record.mediaPaths.filter(Boolean).slice(0, 2) : []
    },
    proofPhotos() {
      return Array.isArray(this.record.proofPhotos) ? this.record.proofPhotos.filter(Boolean).slice(0, 2) : []
    },
    applicationText() { return String(this.record.applyText || '').trim() },
    yardName() { return this.record.yardName || this.record.ownerName || '' },
    locationName() { return typeof this.record.location === 'string' ? this.record.location : '' },
    locationAddress() { return this.record.locationAddress || this.record.address || '' },
    distance() { return this.record.distance || '' },
    contactName() { return this.record.ownerNick || this.record.ownerName || '' },
    ownerMessage() { return this.record.ownerMessage || '' },
    isCompleted() { return ['adoption_confirmed', 'reward', 'reward_done'].includes(this.presentation.status) }
  }
}
</script>

<style scoped>
.adoption-progress-view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  padding: 0 15px 24px;
  box-sizing: border-box;
}

.adoption-progress-view__heading {
  display: flex;
  min-height: 71px;
  align-items: center;
  gap: 7px;
  padding: 23px 3px 16px;
  box-sizing: border-box;
  color: #111;
  font-size: 20px;
  font-weight: 700;
  line-height: 29px;
}

.adoption-progress-view__card,
.adoption-progress-view__info,
.adoption-progress-view__notice {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 15px;
  box-sizing: border-box;
  border-radius: 6px;
  background: #fff;
}

.adoption-progress-view__card-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
}

.adoption-progress-view__applicant,
.adoption-progress-view__count {
  color: #999;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.adoption-progress-view__applicant {
  margin-left: auto;
}

.adoption-progress-view__copy {
  display: block;
  margin-top: 10px;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
}

.adoption-progress-view__photos {
  display: flex;
  gap: 4px;
  margin-top: 14px;
}

.adoption-progress-view__photos .paw-image {
  flex: 0 0 106px;
}

.adoption-progress-view__muted {
  display: block;
  margin-top: 10px;
  color: #aaa;
  font-size: 14px;
  line-height: 20px;
}

.adoption-progress-view__pet-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 15px;
  margin-top: 20px;
}

.adoption-progress-view__pet {
  display: flex;
  width: 49px;
  flex: 0 0 49px;
  align-items: center;
  flex-direction: column;
}

.adoption-progress-view__pet text {
  width: 100%;
  margin-top: 4px;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adoption-progress-view__yard,
.adoption-progress-view__owner {
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #f4f4f4;
  color: #333;
  font-size: 14px;
  line-height: 20px;
}

.adoption-progress-view__tag {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff0d9;
  color: #ef7b00;
  font-size: 10px;
  line-height: 16px;
}

.adoption-progress-view__yard-tag {
  color: #777;
  font-size: 12px;
  line-height: 18px;
}

.adoption-progress-view__info {
  gap: 8px;
}

.adoption-progress-view__info-title {
  display: block;
  color: #333;
  font-size: 16px;
  line-height: 23px;
}

.adoption-progress-view__info-copy {
  display: block;
  color: #777;
  font-size: 14px;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
}

.adoption-progress-view__distance {
  color: #999;
  font-size: 12px;
  line-height: 18px;
}

.adoption-progress-view__notice {
  color: #c92929;
  background: #fff2f2;
  font-size: 14px;
  line-height: 20px;
}
</style>
