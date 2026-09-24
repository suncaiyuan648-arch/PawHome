<template>
  <view
    class="rescue-detail"
    data-qa="qa-rescue-detail"
  >
    <PawPageNav
      title="救助详情"
      :title-centered="true"
      :background="navBackground"
      :fallback-url="fallbackUrl"
    />
    <scroll-view
      class="rescue-detail__scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <template v-if="record">
        <view class="rescue-detail__card rescue-detail__summary">
          <view class="rescue-detail__author">
            <PawAvatar
              :src="record.ownerAvatar"
              :size="42"
            />
            <view class="rescue-detail__author-copy">
              <view class="rescue-detail__author-name"
                ><text>{{ record.ownerName }}</text
                ><LevelBadge
                  :level="record.ownerLevel || 1"
                  inline
              /></view>
              <text class="muted"
                >{{ record.createdLabel }} · {{ record.helpType || '个人求助' }}</text
              >
            </view>
            <PawStatusPill
              :text="record.statusText"
              :tone="record.statusTone || 'neutral'"
            />
          </view>
          <view class="rescue-detail__amount"
            ><text>¥{{ record.amount }}</text
            ><text>求助金额</text></view
          >
          <text class="rescue-detail__views">{{ record.views }}人浏览</text>
          <text class="rescue-detail__description">{{ record.detail || record.description }}</text>
          <view
            v-if="media.length"
            class="rescue-detail__gallery"
          >
            <PawImage
              v-for="(src, index) in media"
              :key="src + index"
              :src="src"
              display-mode="fixed"
              width="78"
              height="78"
              radius="3"
              :preview="true"
              :preview-urls="media"
              :preview-index="Number(index)"
            />
          </view>
        </view>

        <view
          v-if="record.animals && record.animals.length"
          class="rescue-detail__card rescue-detail__animals"
        >
          <view class="section-heading"
            ><text>申请救助的动物</text
            ><text class="muted">({{ record.animals.length }})</text></view
          >
          <view class="animal-list">
            <view
              v-for="animal in record.animals"
              :key="animal.id"
              class="animal-row"
            >
              <PawAvatar
                :src="animal.avatar"
                :size="46"
              />
              <text>{{ animal.name || '猫咪' }}</text>
            </view>
          </view>
        </view>

        <view class="rescue-detail__card rescue-detail__application">
          <view class="section-heading"><text>救助申请信息</text></view>
          <view
            v-for="row in applicantRows"
            :key="row.label"
            class="info-row"
            ><text>{{ row.label }}</text
            ><text>{{ row.value }}</text></view
          >
          <view class="info-row"
            ><text>救助单号</text><text>{{ record.rescueId || record.id }}</text></view
          >
          <view class="info-row"
            ><text>收款人</text
            ><text>{{ (record.receiver && record.receiver.name) || '待核验' }}</text></view
          >
        </view>

        <view
          class="rescue-detail__card rescue-detail__proof"
          data-qa="qa-rescue-detail-proof"
        >
          <view class="section-heading"
            ><text>证实救助</text><text class="muted">{{ proofCount }} 人已证实</text></view
          >
          <text class="rescue-detail__proof-copy"
            >公开证实内容用于了解救助情况，普通申请者没有审核或打款操作。</text
          >
          <view class="rescue-detail__actions">
            <PawButton
              text="查看全部证实"
              tone="ghost"
              size="sm"
              shape="rounded"
              qa="qa-rescue-detail-proof-list"
              @click="openProofList"
            />
            <PawButton
              v-if="!alreadyProved"
              text="我也来证实"
              tone="accent"
              size="sm"
              shape="rounded"
              qa="qa-rescue-detail-proof-create"
              @click="openProofCreate"
            />
            <PawButton
              v-else
              text="已证实"
              tone="secondary"
              size="sm"
              shape="rounded"
              disabled
              qa="qa-rescue-detail-proof-created"
            />
          </view>
          <PawButton
            v-if="canOpenReview"
            text="进入评审"
            tone="dark"
            size="sm"
            shape="rounded"
            qa="qa-rescue-detail-review"
            @click="openReview"
          />
        </view>
      </template>
      <view
        v-else
        class="rescue-detail__empty"
        data-qa="qa-rescue-detail-empty"
      >
        <PawIcon
          name="navigation/clock-disabled"
          :size="22"
          color="#999"
          label="救助详情不可用"
        />
        <text>{{ emptyCopy }}</text>
        <text class="rescue-detail__empty-hint">请从救助基金列表重新打开真实救助记录。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import { SELF_PAW_ID } from '@/utils/profileNav.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { hasRescueProofByUser, type RescueRecord } from '@/utils/rescueStorage.ts'
import {
  type RescueDetailNavigationTarget,
  type RescueLoadState,
} from '../services/componentMetadata.ts'
import { proofCount } from '../services/proof.ts'

export default defineComponent({
  name: 'RescueDetailView',
  components: { PawPageNav, PawIcon, PawButton, PawImage, PawAvatar, LevelBadge, PawStatusPill },
  props: {
    record: { type: Object as PropType<RescueRecord | null>, default: null },
    loadState: { type: String as PropType<RescueLoadState>, default: 'idle' },
  },
  computed: {
    navBackground() {
      return 'linear-gradient(to bottom, #fffcdc 0%, #ffffff 100%)'
    },
    fallbackUrl() {
      try {
        return buildRoute('rescue.fund', {})
      } catch {
        return '/pages/me/index'
      }
    },
    emptyCopy() {
      if (this.loadState === 'missing-id') return '缺少救助单 ID'
      if (this.loadState === 'invalid-params') return '救助单 ID 无效'
      if (this.loadState === 'not-found') return '找不到这条救助记录'
      return '救助详情暂不可用'
    },
    media() {
      return this.record?.mediaPaths.slice(0, 6) ?? []
    },
    applicantRows() {
      return this.record?.applicantRows ?? []
    },
    proofCount() {
      return proofCount(this.record)
    },
    alreadyProved() {
      return Boolean(this.record && hasRescueProofByUser(this.record, SELF_PAW_ID))
    },
    // Only a trusted reviewer capability from a future backend may expose this
    // entry. Ownership/applicant status never grants review access.
    canOpenReview() {
      return Boolean(
        this.record && this.record.reviewItemId && this.record.reviewerAuthorized === true,
      )
    },
  },
  methods: {
    navigate(target: RescueDetailNavigationTarget) {
      try {
        uni.navigateTo({ url: buildRoute(target.routeName, target.params) })
      } catch {
        uni.showToast({ title: '页面暂不可用', icon: 'none' })
      }
    },
    openProofList() {
      const record = this.record
      if (record) this.navigate({ routeName: 'rescue.proof.list', params: { rescueId: record.id } })
    },
    openProofCreate() {
      const record = this.record
      if (record)
        this.navigate({ routeName: 'rescue.proof.create', params: { rescueId: record.id } })
    },
    openReview() {
      const reviewItemId = this.record?.reviewItemId
      if (this.canOpenReview && typeof reviewItemId === 'string') {
        this.navigate({
          routeName: 'rescue.review.detail',
          params: { reviewItemId, businessType: 'rescue' },
        })
      }
    },
  },
})
</script>

<style scoped>
.rescue-detail {
  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  flex-direction: column;
  background: #f5f5f5;
  color: #333;
}
.rescue-detail__scroll {
  min-height: 0;
  flex: 1 1 auto;
  box-sizing: border-box;
  padding-bottom: 24px;
}
.rescue-detail__card {
  width: calc(100% - 30px);
  margin: 10px 15px 0;
  padding: 15px;
  box-sizing: border-box;
  border-radius: 10px;
  background: #fff;
}
.rescue-detail__author {
  display: flex;
  align-items: center;
}
.rescue-detail__author-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}
.rescue-detail__author-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}
.rescue-detail__author-name > text:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rescue-detail__author > .paw-status {
  flex: none;
}
.muted {
  color: #999;
  font-size: 12px;
  line-height: 17px;
}
.rescue-detail__amount {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 14px;
  color: #ff3d48;
  font-size: 22px;
  line-height: 28px;
}
.rescue-detail__amount > text:last-child {
  color: #ee8002;
  font-size: 11px;
}
.rescue-detail__views {
  display: block;
  margin-top: 3px;
  color: #999;
  font-size: 12px;
  line-height: 17px;
}
.rescue-detail__description {
  display: block;
  margin-top: 13px;
  color: #333;
  font-size: 14px;
  line-height: 21px;
  word-break: break-all;
}
.rescue-detail__gallery {
  display: flex;
  gap: 4px;
  margin-top: 16px;
}
.rescue-detail__gallery :deep(.paw-image) {
  flex: 0 0 78px;
}
.section-heading {
  display: flex;
  align-items: baseline;
  gap: 5px;
  color: #333;
  font-size: 15px;
  line-height: 21px;
}
.animal-list {
  display: flex;
  gap: 18px;
  margin-top: 14px;
}
.animal-row {
  display: flex;
  width: 58px;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #555;
  font-size: 12px;
  line-height: 17px;
}
.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-top: 13px;
  color: #888;
  font-size: 13px;
  line-height: 19px;
}
.info-row > text:last-child {
  max-width: 72%;
  color: #333;
  text-align: right;
  word-break: break-all;
}
.rescue-detail__proof-copy {
  display: block;
  margin-top: 12px;
  color: #888;
  font-size: 13px;
  line-height: 19px;
}
.rescue-detail__actions {
  display: flex;
  gap: 9px;
  margin-top: 16px;
}
.rescue-detail__actions .paw-button {
  flex: 1 1 0;
}
.rescue-detail__proof > .paw-button {
  margin-top: 10px;
}
.rescue-detail__empty {
  display: flex;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #888;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}
.rescue-detail__empty-hint {
  color: #aaa;
  font-size: 12px;
}
</style>
