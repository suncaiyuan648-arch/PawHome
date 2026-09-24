<template>
  <view
    class="adoption-review-card"
    :data-qa="qa"
    @tap="onTap"
  >
    <view class="adoption-review-card__head">
      <PawAvatar
        class="adoption-review-card__applicant-avatar"
        :src="review.applicant.avatar"
        :size="37"
        fallback="/static/user.png"
      />
      <view class="adoption-review-card__applicant">
        <view class="adoption-review-card__applicant-name-row">
          <text class="adoption-review-card__applicant-name">{{ review.applicant.name }}</text>
          <LevelBadge :level="review.applicant.level" />
        </view>
        <text class="adoption-review-card__applicant-label">申请人</text>
      </view>
      <PawStatusPill
        class="adoption-review-card__status"
        :text="review.statusText"
        :tone="review.statusTone"
        variant="outline"
      />
    </view>

    <view class="adoption-review-card__pets-title">申请领养的猫咪（{{ review.pets.length }}）</view>
    <view class="adoption-review-card__pets">
      <view
        v-for="(pet, index) in review.pets"
        :key="pet.id || index"
        class="adoption-review-card__pet"
      >
        <PawImage
          :src="pet.avatar"
          :size="48"
          :radius="24"
          :preview="false"
        />
        <text class="adoption-review-card__pet-name">{{ pet.name }}</text>
      </view>
    </view>

    <view
      v-if="review.cloudApproval.required > 1"
      class="adoption-review-card__approval-note"
    >
      <text>需 {{ review.cloudApproval.required }} 位云家长同意后进入下一步</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import type { AdoptionReviewQueueCardMetadata } from '@/utils/adoptionReviewMetadata.ts'

export default defineComponent({
  name: 'PawAdoptionReviewCard',
  components: { PawAvatar, PawImage, PawStatusPill, LevelBadge },
  props: {
    review: { type: Object as PropType<AdoptionReviewQueueCardMetadata>, required: true },
    qa: { type: String, default: '' },
  },
  emits: {
    tap: (review: AdoptionReviewQueueCardMetadata) => Boolean(review),
  },
  methods: {
    onTap() {
      this.$emit('tap', this.review)
    },
  },
})
</script>

<style scoped>
.adoption-review-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 14px 13px 13px;
  box-sizing: border-box;
  border: 0.3px solid #e4e4e4;
  border-radius: 15px;
  background: #fff;
}

.adoption-review-card__head {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 9px;
}

.adoption-review-card__applicant-avatar {
  flex: 0 0 37px;
}

.adoption-review-card__applicant {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 3px;
}

.adoption-review-card__applicant-name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.adoption-review-card__applicant-name {
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adoption-review-card__applicant-label {
  color: #999;
  font-size: 12px;
  line-height: 17px;
}

.adoption-review-card__status {
  flex: 0 0 auto;
}

.adoption-review-card__pets-title {
  margin-top: 17px;
  color: #333;
  font-size: 16px;
  line-height: 23px;
}

.adoption-review-card__pets {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20px 15px;
  margin-top: 16px;
}

.adoption-review-card__pet {
  display: flex;
  width: 49px;
  flex: 0 0 49px;
  flex-direction: column;
  align-items: center;
}

.adoption-review-card__pet-name {
  display: block;
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

.adoption-review-card__approval-note {
  display: flex;
  margin-top: 16px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  color: #999;
  font-size: 12px;
  line-height: 17px;
}
</style>
