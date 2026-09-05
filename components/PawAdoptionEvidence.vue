<template>
  <view class="evidence-page" :class="listMode ? 'evidence-page--list' : 'evidence-page--confirm'"
    :data-qa="isRescue && listMode ? 'qa-rescue-evidence-list' : 'qa-adoption-evidence'">
    <PawPageNav :title="listMode ? '逢猫' : (isRescue ? '我也来证实' : '确认领养')" :fallback-url="fallbackUrl" :auto-back="false"
      @back="goBack" />
    <scroll-view class="evidence-scroll" scroll-y :show-scrollbar="false">
      <template v-if="listMode">
        <view class="truth-row"><text>已有 <text class="truth-number">{{ evidenceCount }}</text> 人证实为真</text>
          <PawButton v-if="!isRescue || rescueRecord" text="我也来证实" size="xs" qa="qa-rescue-evidence-proof"
            @click="openProof" />
        </view>
        <view class="proof-card">
          <text class="proof-title">全部证实（{{ proofList.length }}人）</text>
          <view v-for="proof in proofList" :key="proof.id" class="proof-row">
            <image class="proof-avatar" :src="proof.avatar" mode="aspectFill" @tap.stop="openProofUser(proof)" />
            <view class="proof-copy">
              <view class="proof-author"><text @tap.stop="openProofUser(proof)">{{ proof.name }}</text>
                <LevelCapsule :level="proof.level" />
              </view><text class="proof-text">{{ proof.text }}</text><text class="proof-meta">{{ proof.meta }}</text>
            </view>
            <text class="proof-like">👍 {{ proof.likes }}</text>
          </view>
        </view>
      </template>
      <template v-else>
        <view class="confirm-toolbar"><text @tap="goBack">取消</text>
          <PawButton text="提交" size="sm" qa="qa-adoption-evidence-submit" :disabled="!canSubmit" @click="submit" />
        </view>
        <view class="compare-card">
          <view v-for="(slot, index) in photoSlots" :key="slot.key" class="photo-field"
            :data-qa="'qa-adoption-evidence-photo-' + slot.key" @tap="choosePhoto(index)">
            <view class="upload-box">
              <image v-if="slot.src" class="upload-image" :src="slot.src" mode="aspectFill" />
              <template v-else><uni-icons type="image" color="#999" :size="22" /><text>正脸照片/视频</text></template>
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
            <image :src="example" mode="aspectFill" />
            <view>示例</view>
          </view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getAdoptionById, transitionAdoption } from '@/utils/adoptionStorage.js'
import { getRescueById } from '@/utils/rescueStorage.js'
import { openUserProfile } from '@/utils/profileNav.js'

const EXAMPLE_IMAGE = '/static/figma/certify/ca69b21b61516589aa506613e5d3c587881cb57d.png'

export default {
  name: 'PawAdoptionEvidence',
  components: { PawPageNav, PawButton, PawIcon, LevelCapsule },
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
      proofList: [
        { id: 'proof-1', name: '姜栋', level: 1, avatar: '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png', text: '给我点赞给我点赞给我点赞给我点赞', meta: '昨天 20:45　江西', likes: 32 },
        { id: 'proof-2', name: '芝', level: 2, avatar: '/static/figma/pet-detail/message-avatar.png', text: '已经了解申请人与小院的情况，确认信息真实。', meta: '前天 18:20　江西', likes: 18 }
      ],
      examples: [EXAMPLE_IMAGE, EXAMPLE_IMAGE]
    }
  },
  computed: {
    listMode() { return this.mode === 'list' },
    contextType() {
      const source = this.source || this.sourceType
      return source === 'rescue' ? 'rescue' : 'adoption'
    },
    isRescue() { return this.contextType === 'rescue' },
    resolvedRescueId() { return this.rescueId || this.recordId },
    rescueRecord() { return this.isRescue && this.resolvedRescueId ? getRescueById(this.resolvedRescueId) : null },
    evidenceCount() {
      if (!this.isRescue) return 22
      const count = this.rescueRecord && Number(this.rescueRecord.evidenceCount)
      return Number.isFinite(count) ? count : this.proofList.length
    },
    fallbackUrl() {
      if (this.isRescue && this.resolvedRescueId) return `/pages/feature/index?mode=rescue-detail&id=${encodeURIComponent(this.resolvedRescueId)}`
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
    loadRecord() {
      const initialProofList = [
        { id: 'proof-1', name: '姜栋', level: 1, avatar: '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png', text: '给我点赞给我点赞给我点赞给我点赞', meta: '昨天 20:45　江西', likes: 32 },
        { id: 'proof-2', name: '芝', level: 2, avatar: '/static/figma/pet-detail/message-avatar.png', text: '已经了解申请人与小院的情况，确认信息真实。', meta: '前天 18:20　江西', likes: 18 }
      ]
      this.proofList = initialProofList
      const record = this.isRescue
        ? this.rescueRecord
        : (this.recordId ? getAdoptionById(this.recordId) : null)
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
      if (Array.isArray(record.proofSubmissions) && record.proofSubmissions.length) {
        const saved = record.proofSubmissions.map((item, index) => this.normalizeProof(item, index))
        this.proofList = [...saved, ...this.proofList]
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
        likes: Number(item.likes ?? item.likeCount ?? 0)
      }
    },
    openProofUser(proof) {
      if (!proof) return
      openUserProfile({ pawId: proof.pawId || proof.userId || proof.id, nickname: proof.name, avatar: proof.avatar })
    },
    goBack() { goBackSmart({ fallbackUrl: this.fallbackUrl }) },
    openProof() {
      const id = this.isRescue ? this.resolvedRescueId : (this.recordId || 'demo-pending')
      if (this.isRescue && !this.rescueRecord) {
        uni.showToast({ title: '救助记录不存在', icon: 'none' })
        return
      }
      const query = `mode=proof&id=${encodeURIComponent(id)}&source=${this.contextType}&sourceType=${this.contextType}`
      const rescueQuery = this.isRescue ? `&rescueId=${encodeURIComponent(this.resolvedRescueId)}` : ''
      uni.navigateTo({ url: `/pages/yard/adoptionAudit?${query}${rescueQuery}` })
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
        const updated = transitionAdoption(this.recordId, 'owner_confirm', {
          proofPhotos: [...this.selectedPhotos],
          confirmStory: this.story.trim(),
          proofSubmittedAt: Date.now()
        })
        if (!updated) { uni.showToast({ title: '当前状态不能提交证实', icon: 'none' }); return }
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

.evidence-scroll {
  flex: 1;
  min-height: 0
}

.truth-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 27px 14px
}

.truth-row>text {
  font-size: 14px
}

.truth-number {
  font-size: 22px;
  color: #ff9d00
}

.truth-row .paw-button {
  flex: none;
  padding: 0 13px
}

.proof-card {
  margin: 0 15px 24px;
  padding: 22px 15px;
  border-radius: 20px;
  background: #fff
}

.proof-title {
  display: block;
  margin-bottom: 17px;
  text-align: center;
  font-size: 15px
}

.proof-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 23px
}

.proof-row:last-child {
  margin-bottom: 0
}

.proof-avatar {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 50%
}

.proof-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column
}

.proof-author {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 18px
}

.proof-author>text {
  font-size: 11px
}

.proof-text {
  font-size: 11px;
  line-height: 16px
}

.proof-meta {
  margin-top: 5px;
  color: #999;
  font-size: 11px
}

.proof-like {
  margin-left: auto;
  align-self: flex-end;
  color: #666;
  font-size: 11px;
  white-space: nowrap
}

.confirm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  background: #fff
}

.confirm-toolbar>text {
  font-size: 16px
}

.confirm-toolbar .paw-button {
  flex: none;
  width: 57px;
  padding: 0
}

.compare-card {
  display: flex;
  justify-content: space-between;
  margin: 0 15px;
  padding: 22px 38px 0;
  box-sizing: border-box;
  border-radius: 9px 9px 0 0;
  background: #fff
}

.photo-field {
  display: flex;
  flex: 0 1 106px;
  flex-direction: column;
  align-items: center;
  gap: 9px
}

.photo-field>text {
  color: #999;
  font-size: 12px;
  white-space: nowrap
}

.upload-box {
  position: relative;
  width: 106px;
  height: 106px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999
}

.upload-box>text {
  margin-top: 5px;
  font-size: 12px
}

.upload-image {
  width: 100%;
  height: 100%
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
  height: 160px;
  margin: 0 15px;
  background: #fff;
  border-top: 1px solid #eee
}

.story-field textarea {
  width: 100%;
  height: 100%;
  padding: 11px 18px;
  box-sizing: border-box;
  font-size: 15px
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
  font-size: 11px;
  line-height: 15px
}

.examples {
  display: flex;
  gap: 5px;
  margin: 38px 17px
}

.example {
  position: relative;
  width: 83px;
  height: 83px
}

.example image {
  width: 100%;
  height: 100%;
  border-radius: 3px
}

.example>view {
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
