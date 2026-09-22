<template>
  <view class="evidence-page" :class="listMode ? 'evidence-page--list' : 'evidence-page--confirm'"
    :data-qa="isRescue && listMode ? 'qa-rescue-evidence-list' : 'qa-adoption-evidence'">
    <PawPageNav :title="listMode ? '逢猫' : (isRescue ? '我也来证实' : '确认领养')" :title-centered="true"
      :background="navBackground" :fallback-url="fallbackUrl" :auto-back="false" @back="goBack" />
    <scroll-view class="evidence-scroll" scroll-y :show-scrollbar="false">
      <template v-if="listMode">
        <view class="truth-row">
          <view class="truth-count">
            <text>已有</text>
            <text class="truth-number">{{ evidenceCount }}</text>
            <text>人证实为真</text>
          </view>
          <PawButton v-if="isRescue && rescueRecord" :text="hasCurrentUserProof ? '已证实' : '我也来证实'"
            :tone="hasCurrentUserProof ? 'secondary' : 'accent'" size="xs" qa="qa-rescue-evidence-proof"
            :disabled="hasCurrentUserProof" @click="openProof" />
        </view>
        <view class="proof-card">
          <view class="proof-title"><text>全部证实</text><text>({{ proofList.length }}人)</text></view>
          <CommentThread class="proof-comment-thread" :comments="proofList" :readonly="true"
            :comment-preview-count="proofList.length" @user-click="openProofUser" @like="toggleProofLike" />
        </view>
      </template>
      <template v-else>
        <view class="confirm-toolbar"><text @tap="goBack">取消</text>
          <PawButton text="提交" size="xs" shape="rounded" qa="qa-adoption-evidence-submit" :disabled="!canSubmit"
            @click="submit" />
        </view>
        <view class="compare-card">
          <view v-for="(slot, index) in photoSlots" :key="slot.key" class="photo-field"
            :data-qa="'qa-adoption-evidence-photo-' + slot.key" @tap="choosePhoto(index)">
            <view class="upload-box">
              <PawImage v-if="slot.src" class="upload-image" :src="slot.src" display-mode="fixed" :width="106"
                :height="106" :radius="3" :preview="true" />
              <view v-else class="upload-placeholder">
                <uni-icons type="image" color="#999" :size="22" />
                <text>正脸照片/视频</text>
              </view>
              <view v-if="slot.src" class="upload-edit" @tap.stop="removePhoto(index)">
                <PawIcon name="navigation/close" :size="12" color="#fff" />
              </view>
            </view>
            <text>{{ slot.label }}</text>
          </view>
        </view>
        <view class="story-field"><textarea v-model="story" maxlength="500" placeholder="分享您的领养过程以及您领养后的感受" /><text>{{
          story.length }}/500</text></view>
        <text class="explain">院主和审核团会根据您上传的图片及领养申请来投票您是否为真实领养</text>
        <view class="examples">
          <view v-for="example in examples" :key="example" class="example">
            <PawImage class="example-image" :src="example" display-mode="fixed" :width="83" :height="83" :radius="3"
              :preview="true">
              <view class="example-overlay">示例</view>
            </PawImage>
          </view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import CommentThread from '@/components/dynamic/CommentThread.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getRescueById, hasRescueProofByUser } from '@/utils/rescueStorage.js'
import { openUserProfile, SELF_PAW_ID } from '@/utils/profileNav.js'
import { getApplication, submitAdoptionEvidence } from '@/utils/applicationMockApi.js'
import { buildRoute } from '@/navigation/routeContracts.js'

const EXAMPLE_IMAGE = '/static/figma/certify/ca69b21b61516589aa506613e5d3c587881cb57d.png'

export default {
  name: 'PawAdoptionEvidence',
  components: { PawPageNav, PawButton, PawImage, PawIcon, CommentThread },
  props: {
    mode: { type: String, default: 'confirm' },
    recordId: { type: String, default: '' },
    source: { type: String, default: '' },
    sourceType: { type: String, default: 'adoption' },
    rescueId: { type: String, default: '' }
  },
  emits: ['submitted'],
  data() {
    return {
      story: '', selectedPhotos: ['', ''],
      proofList: [],
      examples: [EXAMPLE_IMAGE, EXAMPLE_IMAGE]
    }
  },
  computed: {
    listMode() { return this.mode === 'list' },
    navBackground() {
      return 'linear-gradient(to bottom, #fffcdc 0%, #ffffff 100%)'
    },
    contextType() {
      const source = this.source || this.sourceType
      return source === 'rescue' ? 'rescue' : 'adoption'
    },
    isRescue() { return this.contextType === 'rescue' },
    resolvedRescueId() { return this.rescueId || this.recordId },
    rescueRecord() { return this.isRescue && this.resolvedRescueId ? getRescueById(this.resolvedRescueId) : null },
    hasCurrentUserProof() { return this.isRescue && hasRescueProofByUser(this.rescueRecord, SELF_PAW_ID) },
    evidenceCount() {
      if (!this.isRescue) return 0
      const count = this.rescueRecord && Number(this.rescueRecord.evidenceCount)
      return Number.isFinite(count) ? count : this.proofList.length
    },
    fallbackUrl() {
      if (this.isRescue && this.resolvedRescueId) return `/packages/rescue/pages/detail/index?rescueId=${encodeURIComponent(this.resolvedRescueId)}`
      return '/pages/me/index'
    },
    photoSlots() { return [{ key: 'before', label: '小咪流浪时的样子', src: this.selectedPhotos[0] }, { key: 'after', label: '小咪在新家的样子', src: this.selectedPhotos[1] }] },
    canSubmit() { return this.selectedPhotos.every(Boolean) && this.story.trim().length > 0 }
  },
  watch: {
    recordId: { immediate: true, handler() { this.loadRecord() } },
    rescueId() { this.loadRecord() },
    source() { this.loadRecord() },
    sourceType() { this.loadRecord() }
  },
  methods: {
    actorProvider() {
      try { return typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null } catch (error) { return null }
    },
    loadRecord() {
      this.proofList = []
      const adoptionResult = !this.isRescue && this.recordId
        ? getApplication('adoption', this.recordId, { actorProvider: () => this.actorProvider(), requireActor: true })
        : null
      const record = this.isRescue
        ? this.rescueRecord
        : (adoptionResult && adoptionResult.success ? adoptionResult.data : null)
      if (!record) return
      if (this.isRescue) {
        const sourceList = Array.isArray(record.proofList)
          ? record.proofList
          : (Array.isArray(record.evidenceList) ? record.evidenceList : [])
        this.proofList = sourceList.map((item, index) => this.normalizeProof(item, index))
        return
      }
      if (!this.listMode) {
        this.story = record.confirmStory || ''
        this.selectedPhotos = Array.isArray(record.proofPhotos) ? record.proofPhotos.slice(0, 2) : ['', '']
      }
    },
    normalizeProof(item = {}, index = 0) {
      const meta = item.meta || [item.createdAtText || item.time || item.createdAt, item.city || item.location].filter(Boolean).join('　') || '刚刚'
      return {
        id: item.id || item.proofId || `proof-${index + 1}`,
        name: item.name || item.nickname || item.userName || '证实人',
        level: item.level || 1,
        avatar: item.avatar || item.userAvatar || item.avatarUrl || EXAMPLE_IMAGE,
        text: item.text || item.content || item.note || item.story || item.confirmStory || '已提交证实信息。',
        meta,
        likes: Number(item.likes ?? item.likeCount ?? 0),
        liked: item.liked === undefined ? true : Boolean(item.liked)
      }
    },
    openProofUser(proof) {
      if (!proof) return
      const author = proof.author || proof
      openUserProfile({ pawId: author.pawId || proof.pawId || proof.userId || proof.id, nickname: author.name, avatar: author.avatar })
    },
    toggleProofLike(comment) {
      if (!comment) return
      const index = this.proofList.findIndex(item => item.id === comment.id)
      if (index < 0) return
      const next = [...this.proofList]
      const current = next[index]
      const liked = !current.liked
      next.splice(index, 1, {
        ...current,
        liked,
        likes: Math.max(0, Number(current.likes || 0) + (liked ? 1 : -1))
      })
      this.proofList = next
    },
    goBack() { goBackSmart({ fallbackUrl: this.fallbackUrl }) },
    openProof() {
      if (this.hasCurrentUserProof) return
      if (!this.isRescue || !this.resolvedRescueId || !this.rescueRecord) {
        uni.showToast({ title: '救助记录不存在', icon: 'none' })
        return
      }
      try {
        uni.navigateTo({ url: buildRoute('rescue.proof.create', { rescueId: this.resolvedRescueId }) })
      } catch (error) {
        uni.showToast({ title: '救助证实表单暂不可用', icon: 'none' })
      }
    },
    choosePhoto(index) {
      const done = (paths) => { const next = [...this.selectedPhotos]; next[index] = paths[0] || ''; this.selectedPhotos = next }
      // #ifdef MP-WEIXIN
      uni.chooseMedia({ count: 1, mediaType: ['image', 'video'], sourceType: ['album', 'camera'], success: res => done((res.tempFiles || []).map(file => file.tempFilePath)) })
      // #endif
      // #ifndef MP-WEIXIN
      uni.chooseImage({ count: 1, sourceType: ['album', 'camera'], success: res => done(res.tempFilePaths || []) })
      // #endif
    },
    removePhoto(index) {
      const next = [...this.selectedPhotos]
      next[index] = ''
      this.selectedPhotos = next
    },
    submit() {
      if (!this.canSubmit) { uni.showToast({ title: '请补充照片和领养感受', icon: 'none' }); return }
      if (this.recordId) {
        const result = submitAdoptionEvidence(this.recordId, {
          photos: [...this.selectedPhotos],
          story: this.story.trim()
        }, { actorProvider: () => this.actorProvider() })
        if (!result.success) { uni.showToast({ title: result.error.message || '当前状态不能提交证实', icon: 'none' }); return }
      }
      uni.showToast({ title: '已提交', icon: 'none' })
      this.$emit('submitted', { photos: [...this.selectedPhotos], story: this.story.trim() })
    }
  }
}
</script>

<style scoped>
.evidence-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  color: #333
}

.evidence-page--list {
  background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
}

.evidence-page--confirm {
  background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
}

.evidence-scroll {
  flex: 1;
  min-height: 0
}

.evidence-page--list .evidence-scroll {
  box-sizing: border-box;
  padding: 0 15px;
}

.truth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 10px;
  padding: 6px 8px;
  box-sizing: border-box;
  border-radius: 6px
}

.truth-count {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: baseline;
  gap: 4px;
  color: #333;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap
}

.truth-number {
  color: #ee8002;
  font-size: 22px;
  line-height: 26px
}

.truth-row .paw-button {
  flex: 0 0 auto;
  padding: 0 13px;
  white-space: nowrap
}

.truth-row :deep(.paw-button) {
  background: #ffaa00;
  color: #fff;
  font-size: 12px;
  font-weight: 400
}

.truth-row :deep(.paw-button--disabled) {
  background: #eee;
  color: #aaa;
}

.proof-card {
  margin: 0 0 24px;
  padding: 22px 15px;
  border-radius: 20px;
  background: #fff
}

.proof-title {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 17px;
  color: #333;
  font-size: 15px;
  line-height: 21px
}

.confirm-toolbar {
  display: flex;
  height: 42px;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-sizing: border-box;
  background: transparent
}

.confirm-toolbar>text {
  color: #333;
  font-size: 16px;
  line-height: 23px
}

.confirm-toolbar .paw-button {
  flex: none;
  width: 57px;
  height: 30px;
  min-height: 30px;
  padding: 0;
  border-radius: 4px;
  font-size: 14px
}

.compare-card {
  display: flex;
  height: 174px;
  justify-content: space-between;
  margin: 0 15px;
  padding: 22px 47px 20px;
  box-sizing: border-box;
  border-radius: 9px 9px 0 0;
  background: #fff
}

.photo-field {
  display: flex;
  width: 106px;
  min-width: 106px;
  flex: 0 0 106px;
  flex-direction: column;
  align-items: center;
  gap: 8px
}

.photo-field>text {
  flex: 0 0 20px;
  height: 20px;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap
}

.upload-box {
  position: relative;
  width: 106px;
  height: 106px;
  flex: 0 0 106px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  border-radius: 3px
}

.upload-image,
.upload-placeholder {
  display: flex;
  width: 106px;
  height: 106px;
  flex: 0 0 106px;
  box-sizing: border-box;
}

.upload-image {
  display: block;
}

.upload-placeholder {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-placeholder>text {
  margin-top: 5px;
  font-size: 12px
}

.upload-edit {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, .5)
}

.story-field {
  position: relative;
  height: 161px;
  margin: 0 15px;
  background: #fff;
  border-top: .3px solid #e4e4e4;
  border-radius: 0 0 9px 9px
}

.story-field textarea {
  width: 100%;
  height: 100%;
  padding: 11px 19px;
  box-sizing: border-box;
  color: #929296;
  font-size: 14px;
  line-height: normal
}

.story-field>text {
  position: absolute;
  right: 12px;
  bottom: 11px;
  color: #aaa;
  font-size: 12px
}

.explain {
  display: block;
  margin: 12px 25px 0;
  color: #929296;
  font-size: 14px;
  line-height: normal
}

.examples {
  display: flex;
  gap: 6px;
  margin: 38px 17px
}

.example {
  position: relative;
  width: 83px;
  height: 83px
}

.example-image {
  position: relative;
  width: 100%;
  height: 100%
}

.example-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .45);
  border-radius: 3px;
  color: #fff;
  font-size: 13px
}
</style>
