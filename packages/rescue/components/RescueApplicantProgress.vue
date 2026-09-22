<template>
  <view class="applicant-rescue-page" :class="{ 'is-approved': isApproved, 'is-rejected': isRejected }"
    data-qa="qa-rescue-applicant-progress">
    <PawPageNav title="救助详情" :title-centered="true"
      background="linear-gradient(to bottom, #fffcdc 0%, #ffffff 100%)" fallback-url="/pages/me/index" />
    <scroll-view class="applicant-rescue-scroll" scroll-y :show-scrollbar="false">
      <view class="applicant-rescue-content">
        <template v-if="record">
          <view v-if="statusMeta" class="applicant-rescue-heading" data-qa="qa-rescue-applicant-status">
            <PawIcon :name="statusIcon" :size="18" :label="statusTitle" />
            <text>{{ statusTitle }}</text>
          </view>
          <view v-else class="applicant-rescue-heading applicant-rescue-heading--unknown"
            data-qa="qa-rescue-applicant-status-unknown">
            <PawIcon name="navigation/clock-disabled" :size="18" label="申请状态暂不可识别" />
            <text>申请状态暂不可识别</text>
          </view>
          <view class="applicant-rescue-status-copy">{{ statusCopy }}</view>

          <view class="applicant-rescue-card rescue-summary-card">
            <view class="rescue-author-line">
              <image class="rescue-avatar" :src="record.ownerAvatar" mode="aspectFill" />
              <view class="rescue-author-copy">
                <view class="rescue-author-name-line">
                  <text class="rescue-author-name">{{ record.ownerName }}</text>
                  <LevelBadge :level="record.ownerLevel || 1" inline />
                </view>
                <text class="rescue-meta">{{ record.createdLabel }} · {{ record.helpType || '个人求助' }}</text>
              </view>
              <PawStatusPill :text="record.helpType || '个人求助'" tone="neutral" />
            </view>
            <view class="rescue-amount"><text>¥{{ record.amount }}</text><text class="rescue-amount-label">求助金额</text>
            </view>
            <text class="rescue-views">{{ record.views }}人浏览</text>
            <text class="rescue-description">{{ record.detail || record.description }}</text>
            <view v-if="record.mediaPaths && record.mediaPaths.length" class="rescue-gallery">
              <image v-for="(src, index) in record.mediaPaths.slice(0, 6)" :key="src + index" :src="src"
                mode="aspectFill" />
            </view>
          </view>

          <PawAdoptionPetsCard v-if="record.animals && record.animals.length" title="申请救助的动物"
            :pets="record.animals" :show-owner="false" :show-add="false" :pet-clickable="false"
            :yard-clickable="false" :min-height="160" :margin-bottom="10" qa-prefix="qa-rescue-applicant-pet-" />

          <view class="applicant-rescue-card rescue-info-card">
            <view class="info-row"><text>救助单号</text><text>{{ record.rescueId || record.id }}</text></view>
            <view class="info-row"><text>收款人</text><text>{{ (record.receiver && record.receiver.name) || '待核验' }}</text>
            </view>
            <view class="info-row"><text>审核结果</text><text>{{ statusLabel }}</text></view>
          </view>
        </template>
        <view v-else-if="loadState === 'loading'" class="rescue-empty" data-qa="qa-rescue-applicant-progress-loading">
          <text>正在读取救助申请</text>
        </view>
        <view v-else class="rescue-empty" data-qa="qa-rescue-applicant-progress-empty">
          <text>{{ emptyCopy }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import { RESCUE_APPLICATION_STATUS_META } from '@/utils/rescueStorage.js'

export default {
  name: 'RescueApplicantProgress',
  components: { PawPageNav, PawIcon, PawStatusPill, LevelBadge, PawAdoptionPetsCard },
  props: {
    record: { type: Object, default: null },
    loadState: { type: String, default: 'idle' }
  },
  computed: {
    statusMeta() {
      return this.record && RESCUE_APPLICATION_STATUS_META[this.record.applicationStatus]
        ? RESCUE_APPLICATION_STATUS_META[this.record.applicationStatus]
        : null
    },
    isApproved() { return Boolean(this.record && this.record.applicationStatus === 'platform_approved') },
    isRejected() { return Boolean(this.record && this.record.applicationStatus === 'platform_rejected') },
    statusIcon() {
      if (this.isApproved) return 'status/check'
      if (this.isRejected) return 'status/rejected'
      return 'navigation/clock'
    },
    statusTitle() {
      if (this.isApproved) return '平台审核成功'
      if (this.isRejected) return '平台审核未通过'
      return this.statusMeta ? this.statusMeta.text : '申请状态暂不可识别'
    },
    statusLabel() { return this.statusMeta ? this.statusMeta.text : '状态暂不可识别' },
    statusCopy() {
      if (this.isApproved) return '救助款项会在 3 个工作日内打到指定账户'
      if (this.isRejected) return '平台审核未通过，请核对申请材料后再试。'
      if (this.statusMeta) return '平台正在审核您的救助申请，请耐心等待……'
      return '当前救助申请状态无法识别，请稍后重试。'
    },
    emptyCopy() {
      if (this.loadState === 'missing-id') return '缺少救助申请 ID'
      if (this.loadState === 'invalid-params') return '救助申请参数无效'
      return '救助申请不存在'
    }
  }
}
</script>

<style scoped>
.applicant-rescue-page {
  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  flex-direction: column;
  box-sizing: border-box;
  background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
  color: #333;
}

.applicant-rescue-scroll { min-height: 0; flex: 1 1 auto; }

.applicant-rescue-content {
  display: flex;
  padding: 0 15px 24px;
  flex-direction: column;
  box-sizing: border-box;
}

.applicant-rescue-heading {
  display: flex;
  min-height: 71px;
  align-items: center;
  gap: 7px;
  padding: 26px 3px 16px;
  box-sizing: border-box;
}

.applicant-rescue-heading text {
  color: #111;
  font-size: 20px;
  font-weight: 700;
  line-height: 29px;
}

.applicant-rescue-heading--unknown text { color: #777; }

.applicant-rescue-status-copy {
  padding: 0 3px 16px;
  color: #333;
  font-size: 14px;
  line-height: 21px;
}

.applicant-rescue-card {
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
}

.rescue-author-line { display: flex; min-width: 0; align-items: center; gap: 8px; }

.rescue-avatar {
  width: 41px;
  height: 41px;
  flex: 0 0 41px;
  border-radius: 50%;
}

.rescue-author-copy { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 4px; }

.rescue-author-name-line { display: flex; min-width: 0; align-items: center; gap: 5px; }

.rescue-author-name {
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rescue-meta,
.rescue-views { color: #999; font-size: 12px; line-height: 17px; }

.rescue-amount { display: flex; align-items: baseline; gap: 7px; margin-top: 14px; color: #f03b43; }

.rescue-amount>text:first-child { font-size: 27px; line-height: 34px; }

.rescue-amount-label { color: #ef7a00; font-size: 14px; }

.rescue-description { display: block; margin-top: 14px; color: #333; font-size: 16px; line-height: 24px; word-break: break-all; }

.rescue-gallery { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 17px; }

.rescue-gallery image { width: calc((100% - 12px) / 4); height: 78px; flex: 0 0 calc((100% - 12px) / 4); border-radius: 3px; }

.rescue-info-card { display: flex; flex-direction: column; gap: 14px; }

.info-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #666; font-size: 14px; line-height: 20px; }

.info-row>text:last-child { color: #333; text-align: right; }

.rescue-empty { display: flex; min-height: 160px; align-items: center; justify-content: center; color: #999; }
</style>
