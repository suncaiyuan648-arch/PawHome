<template>
  <view class="feature-page" :class="`feature-page--${mode}`">
    <PawPageNav v-if="mode !== 'invite'" :title="title" :title-centered="true"
      :background="mode === 'rescue-detail' ? '#fff477' : '#f5f5f5'" fallback-url="/pages/index/index" />
    <view v-if="mode === 'rescue-detail'" class="rescue-detail-hero" data-qa="qa-rescue-detail-hero">
      <view class="rescue-intro">
        <text class="rescue-question">Ta的救助申请是真的吗？</text>
        <text>请您审查该申请人是否为虚假申请及不实申请</text>
      </view>
    </view>
    <scroll-view class="feature-scroll" scroll-y :show-scrollbar="false">
      <template v-if="mode === 'rescue-detail'">
        <view class="rescue-detail-cards">
          <PawCard class="detail-section detail-section--case paw-surface" padding="13px 17px 17px" border="none"
            data-qa="qa-rescue-detail-case">
            <view class="rescue-head">
              <view class="rescue-identity">
                <PawAvatar class="rescue-avatar" :src="currentRescue.ownerAvatar" :size="34" :clickable="true"
                  @click.stop="openRescueOwner(currentRescue)" />
                <text class="rescue-owner-name" @tap.stop="openRescueOwner(currentRescue)">{{ currentRescue.ownerName
                }}</text>
                <LevelBadge :level="currentRescue.ownerLevel" inline />
                <PersonalHelpBadge :label="currentRescue.helpType || '个人求助'" />
              </view>
              <text class="muted rescue-meta">1天前来过　长沙市</text>
            </view><text class="rescue-amount">¥{{ currentRescue.amount }} <text>求助金额</text></text><text
              class="detail-views">{{ currentRescue.views }}人浏览</text><text class="rescue-copy">{{ currentRescue.detail
              }}</text>
            <view class="detail-gallery">
              <view v-for="(src, index) in rescueDetailImageUrls.slice(0, 16)" :key="src + index"
                class="detail-gallery-cell">
                <PawImage class="detail-gallery-image" :src="src" display-mode="fixed" width="100%" height="100%"
                  :preview-urls="rescueDetailImageUrls" :preview-index="index" />
              </view>
            </view>
          </PawCard>
          <PawCard class="detail-section paw-surface applicant-info-card" title="求助人信息" gap="10px" padding="15px 17px"
            border="none">
            <view v-for="row in applicantInfoRows" :key="row.label" class="applicant-row">
              <PawTag :text="row.label" />
              <view class="applicant-value">
                <text class="applicant-value-text">{{ row.value }}</text>
                <VerifiedBadge v-if="row.verified" />
              </view>
            </view>
          </PawCard>
          <PawAdoptionPetsCard class="detail-section paw-surface rescue-animals-card" title="申请救助的动物"
            :pets="currentRescue.animals" :yard-name="currentRescue.yardName" :yard-id="currentRescue.yardId"
            :yard-avatar="currentRescue.yardAvatar" :show-add="false" :show-owner="true" :min-height="0"
            :margin-bottom="0" card-padding="15px 17px 17px" qa-prefix="qa-rescue-detail-animal-"
            @pet-click="openRescueAnimal" @yard-click="openRescueYard" />
          <PawCard class="detail-section detail-section--evidence paw-surface" padding="15px 17px 17px" border="none"
            data-qa="qa-rescue-detail-evidence">
            <template #title>
              <view class="evidence-heading">
                <view class="evidence-title"><text>证实列表</text><text class="evidence-count">({{
                  currentRescue.evidenceCount }})</text></view>
                <view class="evidence-link" data-qa="qa-rescue-detail-evidence-list" @tap="openEvidenceList">
                  <text>查看全部</text>
                  <PawIcon name="navigation/chevron-right" :size="12" color="#999" />
                </view>
              </view>
            </template>
            <view class="evidence-people-row">
              <view v-for="proof in evidencePreviewPeople" :key="proof.id" class="evidence-person"
                @tap.stop="openEvidenceUser(proof)">
                <PawAvatar class="evidence-person-avatar" :src="proof.avatar" :size="48" :clickable="true"
                  @click.stop="openEvidenceUser(proof)" />
                <text class="evidence-person-name">{{ proof.name }}</text>
                <text class="evidence-person-relation">{{ proof.relationship || '证实人' }}</text>
              </view>
            </view>
            <view v-if="featuredEvidence" class="evidence-quote">
              <text class="evidence-quote-text">{{ featuredEvidence.name }}： “{{ featuredEvidence.text }}”</text>
            </view>
            <template #footer>
              <view class="evidence-action-row">
                <view class="evidence-proof-count">
                  <text>已有</text>
                  <text class="evidence-proof-count-number">{{ currentRescue.evidenceCount }}</text>
                  <text>人证实为真</text>
                </view>
                <PawButton class="evidence-proof-button" :text="hasCurrentUserProof ? '已证实' : '为ta证实'"
                  :tone="hasCurrentUserProof ? 'secondary' : 'accent'" size="xs" qa="qa-rescue-detail-proof"
                  :disabled="hasCurrentUserProof" @click="openProof" />
              </view>
            </template>
          </PawCard>
          <PawCard class="detail-section paw-surface detail-section--promise" title="求助人承诺" gap="10px"
            padding="15px 17px" border="none">
            <text class="detail-note">我承诺以上求助信息真实有效，所获救助资金将用于本次流浪动物救助，并及时公开救助进展。</text>
          </PawCard>
          <PawCard class="detail-section paw-surface detail-section--promise" title="平台声明" gap="10px"
            padding="15px 17px" border="none">
            <text class="detail-note">平台仅提供信息发布、审核和资金流转服务，具体救助结果由求助人和参与证实的用户共同负责。</text>
          </PawCard>
          <PawCard class="detail-section paw-surface rescue-comments-section" title="留言 (15)" gap="10px"
            padding="15px 17px 20px" border="none" data-qa="qa-rescue-detail-comments">
            <CommentThread class="rescue-comment-thread" :comments="rescueComments" :comment-preview-count="2"
              @user-click="openRescueCommentUser" @reply="openRescueReplySheet" @like="toggleRescueCommentLike"
              @voice-play="onRescueVoicePlay">
              <template #before>
                <CommentComposer avatar="/static/figma/dynamic-detail/current-user.png" readonly fluid
                  @click="openRescueReplySheet" @voice="onRescueComposerVoice"
                  @pick-image="onRescueComposerPickImage" />
              </template>
            </CommentThread>
          </PawCard>
        </view>
        <view class="rescue-detail-scroll-spacer" />
      </template>
      <template v-else-if="mode === 'invite'">
        <!-- #ifndef MP-WEIXIN -->
        <image class="invite-hero-exact" src="/static/figma/invite-hero-exact.png" mode="scaleToFill" />
        <!-- #endif -->
        <view class="invite-hero">
          <image class="invite-map" src="/static/figma/feature/af518e8fde22fed7160fad5da60317148f44952a.png"
            mode="aspectFill" />
          <image v-for="(src, index) in inviteAvatars" :key="src" class="invite-avatar"
            :class="'invite-avatar--' + index" :src="src" mode="aspectFill" /><text class="joined-text">邻居6人已入驻</text>
        </view>
        <view class="invite-card">
          <view class="invite-title">
            <image src="/static/figma/feature/45f5fc6ea328c9e88cff7a4504824254458e9e7b.png" mode="aspectFill" />
            <view><text>朝阳小区猫猫队 邀请您入驻</text><text>目前已有3只流浪猫，还在等待领养</text></view>
          </view><text>•　一起为流浪猫寻找领养好归宿</text><text>•　一起投喂流浪猫，从坚持到热爱</text>
          <view class="invite-line">
            <view class="invite-line-icon"><uni-icons type="person-filled" color="#08bd5c" :size="17" /></view>
            <text>感谢您加入“救助流浪猫”大家庭，共建和谐文明城市流浪猫环境</text>
          </view>
          <view class="invite-button" @click="openYard"><text>前往查看</text><uni-icons type="arrow-right" color="#fff"
              :size="16" /></view>
        </view>
      </template>
      <template v-else>
        <view class="album-controls">
          <view class="album-tabs">
            <view v-for="filter in albumFilters" :key="filter.key" class="album-tab"
              :class="{ active: albumFilter === filter.key }" @tap="selectAlbumFilter(filter.key)">
              <text>{{ filter.label }}</text>
            </view>
          </view>
          <view class="album-meta">
            <text>共{{ filteredAlbumItems.length }}个图片视频</text>
            <text @tap="toggleAlbumSort">{{ albumSort === 'default' ? '默认排序' : '置顶优先' }}</text>
          </view>
        </view>
        <view class="album-grid">
          <view v-for="item in filteredAlbumItems" :key="item.id" class="album-cell" @tap="previewAlbumImage(item)"
            @longpress.stop="openAlbumMenu(item, $event)">
            <image :src="item.src" mode="aspectFill" />
            <view v-if="item.hidden || item.pinned" class="album-tag-overlay">
              <PawAlbumTag :text="item.hidden ? '隐藏' : '置顶'" :tone="item.hidden ? 'hidden' : 'pinned'" />
            </view>
            <view v-if="item.kind === 'video'" class="album-video-mark"><text>视频</text></view>
          </view>
        </view>
        <view v-if="albumMenuVisible" class="album-menu-mask" @tap="closeAlbumMenu" />
        <view v-if="albumMenuVisible" class="album-menu" :style="albumMenuStyle" @tap.stop>
          <view v-for="action in albumMenuActions" :key="action.key" class="album-menu-item"
            @tap.stop="handleAlbumMenuAction(action.key)">
            <PawIcon class="album-menu-icon" :name="action.iconName" :size="14" />
            <text>{{ action.label }}</text>
          </view>
        </view>
      </template>
    </scroll-view>
    <PawJuryActionBar v-if="mode === 'rescue-detail'" :voted="rescueVoted" @share="openRescueShare" @vote="onRescueVote"
      @next="onRescueVoteNext" />
    <ReplyComposerSheet v-if="mode === 'rescue-detail'" v-model:visible="rescueReplySheetVisible"
      :reply-to-name="rescueReplyTargetName" @send="onRescueReplySend" @voice="onRescueComposerVoice"
      @pick-image="onRescueComposerPickImage" />
    <ShareActionSheet v-if="mode === 'rescue-detail'" v-model:visible="rescueShareSheetVisible" />
    <PawJuryVoteDialog v-if="mode === 'rescue-detail'" v-model="rescueVoteResultVisible"
      :selected-vote="selectedRescueVote || 'real'" @close="closeRescueVoteResult" @back="closeRescueVoteResult"
      @next="onRescueVoteNext" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawCard from '@/components/base/PawCard.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawTag from '@/components/base/PawTag.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import PawJuryActionBar from '@/components/PawJuryActionBar.vue'
import PawJuryVoteDialog from '@/components/PawJuryVoteDialog.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PersonalHelpBadge from '@/components/customBadge/PersonalHelpBadge.vue'
import VerifiedBadge from '@/components/customBadge/VerifiedBadge.vue'
import PawAlbumTag from '@/components/PawAlbumTag.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import CommentComposer from '@/components/dynamic/CommentComposer.vue'
import CommentThread from '@/components/dynamic/CommentThread.vue'
import ReplyComposerSheet from '@/components/ReplyComposerSheet.vue'
import ShareActionSheet from '@/components/ShareActionSheet.vue'
import { getPawHomeYardPetById } from '@/utils/yardMock.js'
import { getRescueRecords, getRescueById, hasRescueProofByUser } from '@/utils/rescueStorage.js'
import { openUserProfile, openYardDetail, SELF_PAW_ID } from '@/utils/profileNav.js'

function decodeValue(value) {
  if (value === undefined || value === null) return ''
  try { return decodeURIComponent(String(value)) } catch (e) { return String(value) }
}

const RESCUE_DETAIL_COMMENTS = [
  {
    id: 'rescue-comment-1',
    author: { name: '姜栋', avatar: '/static/figma/dynamic-detail/comment-avatar-1.svg', level: 1 },
    copy: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞',
    meta: '昨天 20:45  江西',
    likes: 32,
    liked: true
  },
  {
    id: 'rescue-comment-2',
    author: { name: '姜栋', avatar: '/static/figma/dynamic-detail/comment-avatar-1.svg', level: 1 },
    copy: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞',
    meta: '昨天 20:45  江西',
    likes: 32,
    liked: true
  }
]

export default {
  components: {
    PawPageNav,
    PawButton,
    PawCard,
    PawAvatar,
    PawImage,
    PawTag,
    PawAdoptionPetsCard,
    PawJuryActionBar,
    PawJuryVoteDialog,
    LevelBadge,
    PersonalHelpBadge,
    VerifiedBadge,
    PawAlbumTag,
    PawIcon,
    CommentComposer,
    CommentThread,
    ReplyComposerSheet,
    ShareActionSheet
  },
  data() {
    return {
      mode: 'rescue-detail',
      rescueId: '',
      rescueItems: getRescueRecords(),
      rescueComments: RESCUE_DETAIL_COMMENTS,
      rescueReplySheetVisible: false,
      rescueReplySheetTarget: null,
      rescueShareSheetVisible: false,
      rescueVoted: false,
      selectedRescueVote: '',
      rescueVoteResultVisible: false,
      inviteAvatars: ['/static/figma/feature/e1f65d79bfde8d6fc9cf263e86080d08f13770fc.jpg', '/static/figma/feature/66fd0f7323c88fa771f5da9f675372febcc335ba.jpg', '/static/figma/feature/a338f4ed23b0a9c0b631d2e34369f856b09a255a.jpg', '/static/figma/feature/7266b7871b03ce7a570811a13cbbd71e61491f75.jpg', '/static/figma/feature/bf6cfd188d6671b8e283e5e5563ece9da7dc2ef8.jpg', '/static/figma/feature/24a1e03cab61f32251063e6be98887860b879349.jpg', '/static/figma/feature/92204562aae4aec0c460d32bdc61d58f52e24268.jpg'],
      albumFilter: 'all',
      albumSort: 'default',
      albumMenuVisible: false,
      albumMenuPosition: { left: 15, top: 150 },
      albumLongPressHandled: false,
      albumAccessDenied: false,
      selectedAlbumId: '',
      albumPetName: '豆豆',
      albumItems: [
        { id: 'album-01', src: '/static/figma/feature/album-original-01.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: true, favorite: true },
        { id: 'album-02', src: '/static/figma/feature/album-original-02.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: true, favorite: false },
        { id: 'album-03', src: '/static/figma/feature/album-original-03.png', kind: 'image', categories: ['image', 'feeding'], pinned: true, favorite: true },
        { id: 'album-04', src: '/static/figma/feature/album-original-04.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: true, favorite: false },
        { id: 'album-05', src: '/static/figma/feature/album-original-05.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: false },
        { id: 'album-06', src: '/static/figma/feature/album-original-06.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: true },
        { id: 'album-07', src: '/static/figma/feature/album-original-07.png', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: false },
        { id: 'album-08', src: '/static/figma/feature/album-original-08.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false, hidden: true },
        { id: 'album-09', src: '/static/figma/feature/album-original-09.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: true },
        { id: 'album-10', src: '/static/figma/feature/album-original-10.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false },
        { id: 'album-11', src: '/static/figma/feature/album-original-11.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: false },
        { id: 'album-12', src: '/static/figma/feature/album-original-12.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false },
        { id: 'album-13', src: '/static/figma/feature/album-original-13.jpeg', kind: 'image', categories: ['image', 'feeding'], pinned: false, favorite: true },
        { id: 'album-14', src: '/static/figma/feature/album-original-14.jpeg', kind: 'image', categories: ['image', 'daily'], pinned: false, favorite: false },
      ],
    }
  },
  computed: {
    title() {
      return { 'rescue-detail': '救助详情', invite: '邀请入驻', album: `${this.albumPetName}的相册` }[this.mode]
    },
    currentRescue() {
      return getRescueById(this.rescueId) || this.rescueItems[0] || {
        id: '', ownerName: '', ownerAvatar: '', ownerPawId: '', ownerLevel: 1, amount: 0,
        views: 0, detail: '', mediaPaths: [], animals: [], applicantRows: [], evidenceCount: 0, evidenceList: []
      }
    },
    rescueDetailImageUrls() {
      return Array.isArray(this.currentRescue.mediaPaths)
        ? this.currentRescue.mediaPaths.filter(Boolean)
        : []
    },
    rescueYard() {
      return {
        id: this.currentRescue.yardId || '1',
        name: this.currentRescue.yardName || '我就是要喂猫',
      }
    },
    evidencePreviewPeople() {
      const list = Array.isArray(this.currentRescue.evidenceList) ? this.currentRescue.evidenceList : []
      return list.slice(0, 2)
    },
    featuredEvidence() {
      return this.evidencePreviewPeople[0] || null
    },
    hasCurrentUserProof() {
      return hasRescueProofByUser(this.currentRescue, SELF_PAW_ID)
    },
    applicantInfoRows() {
      const rows = Array.isArray(this.currentRescue.applicantRows) ? this.currentRescue.applicantRows : []
      return rows.map((row) => {
        const source = row && typeof row === 'object' ? row : { value: row }
        const label = String(source.label || '')
        const rawValue = String(source.value || '')
        const verified = source.verified !== false && label === '求助人姓名'
        return {
          label,
          value: verified ? rawValue.replace(/(?:\s|　)*已实名$/, '') : rawValue,
          verified
        }
      })
    },
    rescueReplyTargetName() {
      const target = this.rescueReplySheetTarget
      const author = target && target.author
      return author && typeof author.name === 'string' ? author.name : ''
    },
    albumFilters() {
      return [
        { key: 'all', label: '全部' },
        { key: 'favorite', label: '收藏' },
        { key: 'image', label: '图片' },
        { key: 'video', label: '视频' },
        { key: 'feeding', label: '投喂' },
        { key: 'daily', label: '日常' },
      ]
    },
    filteredAlbumItems() {
      const items = this.albumItems.filter((item) => {
        if (this.albumFilter === 'favorite') return item.favorite
        if (this.albumFilter === 'video') return item.kind === 'video'
        if (this.albumFilter === 'all') return true
        return item.kind === this.albumFilter || item.categories.includes(this.albumFilter)
      })
      return this.albumSort === 'pinned'
        ? [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned))
        : items
    },
    albumMenuActions() {
      const item = this.albumItems.find((entry) => entry.id === this.selectedAlbumId) || {}
      return [
        { key: 'pin', label: item.pinned ? '取消置顶' : '置顶', iconName: 'actions/album-pin' },
        { key: 'favorite', label: item.favorite ? '取消收藏' : '收藏', iconName: 'actions/album-favorite' },
        { key: 'hide', label: item.hidden ? '取消隐藏' : '隐藏', iconName: 'actions/album-hide' },
        { key: 'delete', label: '删除', iconName: 'actions/album-delete' },
      ]
    },
    albumMenuStyle() {
      return {
        left: `${this.albumMenuPosition.left}px`,
        top: `${this.albumMenuPosition.top}px`,
      }
    },
  },
  onLoad(options) {
    const m = String(options.mode || 'rescue-detail')
    this.mode = ['rescue-detail', 'invite', 'album'].includes(m) ? m : 'rescue-detail'
    if (this.mode === 'rescue-detail') {
      this.rescueItems = getRescueRecords()
      this.rescueId = decodeValue(options.rescueId || options.id)
      if (this.mode === 'rescue-detail' && !getRescueById(this.rescueId)) this.rescueId = this.rescueItems[0]?.id || ''
    }
    if (this.mode === 'album' && String(options.managed || '') !== '1') {
      this.albumAccessDenied = true
      uni.showToast({ title: '无权访问该相册', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
      }, 0)
      return
    }
    if (this.mode === 'album' && options.petId) {
      const pet = getPawHomeYardPetById(decodeURIComponent(String(options.petId)))
      if (pet && pet.name) this.albumPetName = pet.name
    }
  },
  onShow() {
    if (this.mode === 'rescue-detail') this.rescueItems = getRescueRecords()
  },
  methods: {
    openRescueShare() {
      this.rescueShareSheetVisible = true
    },
    onRescueVote(vote) {
      if (this.rescueVoted || !vote) return
      this.selectedRescueVote = vote
      this.rescueVoted = true
      this.rescueVoteResultVisible = true
    },
    closeRescueVoteResult() {
      this.rescueVoteResultVisible = false
    },
    onRescueVoteNext() {
      this.rescueVoteResultVisible = false
      uni.navigateBack({ fail: () => uni.navigateTo({ url: '/pages/yard/rescueReview' }) })
    },
    openRescueReplySheet(comment) {
      this.rescueReplySheetTarget = comment && comment.author ? comment : null
      this.rescueReplySheetVisible = true
    },
    onRescueReplySend() {
      uni.showToast({ title: '已发送', icon: 'none' })
    },
    onRescueComposerVoice() {
      uni.showToast({ title: '语音输入敬请期待', icon: 'none' })
    },
    onRescueComposerPickImage() {
      uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
    },
    openRescueCommentUser(comment) {
      const author = comment && (comment.author || comment)
      if (!author) return
      openUserProfile({ pawId: author.pawId || comment.id, nickname: author.name, avatar: author.avatar })
    },
    toggleRescueCommentLike(comment) {
      if (!comment) return
      comment.liked = !comment.liked
      comment.likes = Math.max(0, (comment.likes || 0) + (comment.liked ? 1 : -1))
    },
    onRescueVoicePlay() { },
    openRescueOwner(record) {
      if (!record) return
      openUserProfile({ pawId: record.ownerPawId || (record.applicant && record.applicant.id), nickname: record.ownerName, avatar: record.ownerAvatar })
    },
    openEvidenceUser(proof) {
      if (!proof) return
      openUserProfile({ pawId: proof.pawId || proof.userId || proof.id, nickname: proof.name, avatar: proof.avatar })
    },
    openRescueDetail(id) {
      const rescueId = decodeValue(id) || this.rescueItems[0]?.id || ''
      uni.navigateTo({ url: `/pages/feature/index?mode=rescue-detail&rescueId=${encodeURIComponent(rescueId)}` })
    },
    openRescueAnimal(animal, index) {
      if (!animal) return
      const petId = animal.yardPetId || animal.petId || (Number(index) === 1 ? 'roster-dog-1' : 'roster-cat-1')
      const query = [
        'state=35',
        'managed=0',
        `petId=${encodeURIComponent(petId)}`,
        `yardId=${encodeURIComponent(this.rescueYard.id)}`,
        `yardName=${encodeURIComponent(this.rescueYard.name)}`,
      ].join('&')
      uni.navigateTo({ url: `/pages/adoption/petDetail?${query}` })
    },
    openRescueYard() {
      openYardDetail(this.rescueYard)
    },
    openEvidenceList() {
      const rescueId = this.currentRescue.id
      uni.navigateTo({ url: `/pages/meMore/rescueProofList?source=rescue&rescueId=${encodeURIComponent(rescueId)}&id=${encodeURIComponent(rescueId)}` })
    },
    openProof() {
      if (this.hasCurrentUserProof) return
      const rescueId = this.currentRescue.id
      uni.navigateTo({ url: `/pages/meMore/rescueProofForm?source=rescue&rescueId=${encodeURIComponent(rescueId)}&id=${encodeURIComponent(rescueId)}` })
    },
    openYard() { uni.navigateTo({ url: '/pages/commodityDetails/index?id=1' }) },
    selectAlbumFilter(filter) {
      this.albumFilter = filter
      this.closeAlbumMenu()
    },
    toggleAlbumSort() {
      this.albumSort = this.albumSort === 'default' ? 'pinned' : 'default'
    },
    previewAlbumImage(item) {
      if (this.albumMenuVisible || this.albumLongPressHandled) return
      const urls = this.filteredAlbumItems.map((entry) => entry.src)
      if (!item || !urls.length) return
      uni.previewImage({ current: item.src, urls })
    },
    openAlbumMenu(item, event) {
      this.selectedAlbumId = item && item.id ? item.id : ''
      if (!this.selectedAlbumId) return

      this.albumLongPressHandled = true
      const touch = event?.changedTouches?.[0] || event?.touches?.[0]
      const detail = event?.detail || {}
      const pointX = Number(touch?.clientX ?? touch?.pageX ?? detail.x)
      const pointY = Number(touch?.clientY ?? touch?.pageY ?? detail.y)
      const systemInfo = typeof uni !== 'undefined' && uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
      const viewportWidth = Number(systemInfo.windowWidth) || 375
      const viewportHeight = Number(systemInfo.windowHeight) || 667
      const menuWidth = 149
      const menuHeight = 148
      const x = Math.min(Math.max(Number.isFinite(pointX) ? pointX : viewportWidth / 2, 0), viewportWidth)
      const y = Math.min(Math.max(Number.isFinite(pointY) ? pointY : viewportHeight / 2, 0), viewportHeight)
      this.albumMenuPosition = {
        // 默认触点是菜单左上角；右侧/底部空间不足时，分别切到右上/左下/右下角。
        left: x + menuWidth <= viewportWidth
          ? x
          : x - menuWidth,
        top: y + menuHeight <= viewportHeight
          ? y
          : y - menuHeight,
      }
      this.albumMenuVisible = true
      try {
        if (typeof uni !== 'undefined' && typeof uni.vibrateShort === 'function') {
          const vibration = uni.vibrateShort({ type: 'light' })
          if (vibration && typeof vibration.catch === 'function') vibration.catch(() => { })
        }
      } catch (error) {
        // Vibration is optional on unsupported runtimes.
      }
      setTimeout(() => { this.albumLongPressHandled = false }, 500)
    },
    closeAlbumMenu() {
      this.albumMenuVisible = false
      this.selectedAlbumId = ''
    },
    handleAlbumMenuAction(key) {
      const index = this.albumItems.findIndex((item) => item.id === this.selectedAlbumId)
      if (index < 0) return this.closeAlbumMenu()
      const item = this.albumItems[index]
      if (key === 'pin') {
        item.pinned = !item.pinned
        this.albumItems = [
          ...this.albumItems.filter((entry) => entry.pinned),
          ...this.albumItems.filter((entry) => !entry.pinned),
        ]
      }
      if (key === 'favorite') item.favorite = !item.favorite
      if (key === 'hide') item.hidden = !item.hidden
      if (key === 'delete') this.albumItems.splice(index, 1)
      const message = key === 'pin' ? (item.pinned ? '已置顶' : '已取消置顶')
        : key === 'favorite' ? (item.favorite ? '已收藏' : '已取消收藏')
          : key === 'hide' ? '已隐藏' : '已删除'
      this.closeAlbumMenu()
      uni.showToast({ title: message, icon: 'none' })
    },
  },
}
</script>

<style scoped>
.feature-page {
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  color: #222
}

.feature-page--rescue-detail {
  background: #f5f5f5
}

.feature-page--rescue-detail .rescue-detail-hero {
  display: flex;
  height: 84px;
  min-height: 84px;
  flex-direction: column;
  background: #fcf276;
}

.feature-scroll {
  flex: 1;
  min-height: 0;
  height: auto;
}

.rescue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rescue-head image {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.rescue-head .rescue-avatar {
  border-radius: 50%;
}

.rescue-identity {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 4px;
}

.rescue-owner-name {
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 15px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rescue-meta {
  flex: 0 0 auto;
  white-space: nowrap;
}

.muted {
  color: #999;
  font-size: 12px;
  line-height: 17px;
}

.rescue-amount {
  display: block;
  margin-top: 12px;
  color: #ff3d48;
  font-size: 21px;
  line-height: 1.1;
}

.rescue-amount text {
  color: #ee8002;
  font-size: 11px;
}

.rescue-copy {
  display: block;
  margin-top: 7px;
  font-size: 14.5px;
  line-height: 20px;
  word-break: break-all;
}

.rescue-gallery {
  display: flex;
  margin-top: 18px;
}

.rescue-gallery image {
  width: 25%;
  height: auto;
  aspect-ratio: 1;
}

.rescue-intro {
  padding: 30px 44px;
}

.rescue-question {
  display: block;
  font-size: 34px;
  font-weight: 700;
}

.rescue-intro>text:last-child {
  font-size: 22px;
}

.detail-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 28px;
}

.detail-gallery-cell {
  width: calc((100% - 12px) / 4);
  min-width: 0;
  aspect-ratio: 1;
}

.detail-gallery-image {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.invite-avatars {
  display: flex;
  justify-content: space-around;
  padding: 34px 50px 0;
}

.invite-avatars image {
  width: 72px;
  height: auto;
  aspect-ratio: 1;
  border-radius: 50%;
}

.joined-text {
  display: block;
  width: max-content;
  margin: 16px auto;
  padding: 8px 18px;
  border-radius: 12px;
  background: #fff;
  color: #08bb58;
}

.invite-card {
  margin: 20px 10px;
  padding: 28px 36px;
}

.invite-title {
  display: flex;
  align-items: center;
  color: #06b958;
  font-size: 27px;
  font-weight: 500;
}

.invite-title image {
  width: 72px;
  height: auto;
  aspect-ratio: 1;
  margin-right: 18px;
  border-radius: 50%;
}

.invite-card>text {
  display: block;
  margin: 28px 0;
  color: #888;
  font-size: 25px;
}

.invite-button {
  width: 100%;
  max-width: 270px;
  margin: 50px auto 0;
}

.feature-page--invite .feature-scroll {
  height: 100vh
}

.invite-hero {
  position: relative;
  height: 222px;
  overflow: hidden
}

.invite-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 222px
}

.invite-avatar {
  position: absolute;
  width: 48px;
  height: 48px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-sizing: border-box
}

.invite-avatar--0 {
  left: 48px;
  top: 61px
}

.invite-avatar--1 {
  left: 118px;
  top: 35px
}

.invite-avatar--2 {
  left: 219px;
  top: 45px
}

.invite-avatar--3 {
  left: 52px;
  top: 130px
}

.invite-avatar--4 {
  left: 151px;
  top: 87px
}

.invite-avatar--5 {
  left: 282px;
  top: 102px
}

.invite-avatar--6 {
  left: 287px;
  top: 157px
}

.invite-hero .joined-text {
  position: absolute;
  left: 141px;
  top: 176px;
  margin: 0;
  padding: 3px 7px;
  border-radius: 3px;
  background: #fff;
  color: #00c85a;
  font-size: 14px
}

.feature-page--invite .invite-card {
  position: relative;
  margin: -25px 5px 0;
  padding: 14px 20px 30px;
  min-height: 350px;
  border-radius: 20px;
  background: #fff;
  box-sizing: border-box
}

.feature-page--invite .invite-title {
  font-size: 15px
}

.feature-page--invite .invite-title image {
  width: 52px;
  height: 52px;
  margin-right: 12px
}

.feature-page--invite .invite-title>view {
  display: flex;
  flex-direction: column
}

.feature-page--invite .invite-title>view>text:last-child {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 400
}

.feature-page--invite .invite-card>text {
  margin: 23px 0 0;
  color: #888;
  font-size: 15px
}

.invite-line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
  color: #888;
  font-size: 14px;
  line-height: 20px
}

.invite-line text {
  flex: 1
}

.feature-page--invite .invite-button {
  width: 135px;
  height: 43px;
  margin: 69px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 22px;
  background: #05c85b;
  color: #fff;
  font-size: 15px;
  font-weight: 500
}

.invite-hero-exact {
  position: absolute;
  left: 0;
  top: 0;
  width: 375px;
  height: 191px;
  z-index: 5;
  pointer-events: none
}

.feature-page--invite .invite-card {
  z-index: 6
}

.feature-page--album {
  background: #f5f5f5;
}

.feature-page--album .feature-scroll {
  height: calc(100vh - 96px);
  margin-top: -6px;
  background: #f5f5f5;
}

.feature-page--album .album-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 15px 0;
  box-sizing: border-box;
}

.feature-page--album .album-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  height: 28px;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.feature-page--album .album-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 52px;
  height: 28px;
  border-radius: 5px;
  background: #fff;
  color: #666;
  box-sizing: border-box;
}

.feature-page--album .album-tab text {
  font-size: 12px;
  line-height: normal;
}

.feature-page--album .album-tab.active {
  border: .5px solid #e75220;
  background: #fff0ec;
  color: #e75220;
}

.feature-page--album .album-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 29px;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  line-height: normal;
}

.feature-page--album .album-meta text:last-child {
  color: #333;
  font-size: 11px;
  font-weight: 500;
}

.feature-page--album .album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  background: #f5f5f5;
}

.feature-page--album .album-cell {
  position: relative;
  width: 100%;
  height: 125px;
  overflow: hidden;
}

.feature-page--album .album-cell image {
  display: block;
  width: 100%;
  height: 100%;
}

.feature-page--album .album-tag-overlay {
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 2;
}

.feature-page--album .album-video-mark {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(0, 0, 0, .55);
  color: #fff;
}

.feature-page--album .album-video-mark text {
  font-size: 10px;
  line-height: 14px;
}

.feature-page--album .album-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0);
}

.feature-page--album .album-menu {
  position: fixed;
  z-index: 21;
  display: flex;
  flex-direction: column;
  width: 149px;
  height: 148px;
  padding: 8px 0;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .03);
}

.feature-page--album .album-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 33px;
  padding: 0 16px;
  box-sizing: border-box;
  color: #333;
  font-size: 12px;
  line-height: 11px;
}

.feature-page--album .album-menu-icon {
  display: block;
}

.feature-page--invite .invite-card {
  height: 354px;
  min-height: 0;
  margin-top: -30px
}

.invite-line {
  width: 100%;
  margin-top: 15px;
  box-sizing: border-box
}

.invite-line-icon {
  width: 20px;
  display: flex;
  justify-content: center;
  flex: none
}

.feature-page--invite .invite-button {
  margin-top: 74px
}

.feature-page--rescue-detail .rescue-detail-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 15px;
  box-sizing: border-box;
}

.feature-page--rescue-detail .feature-scroll {
  background: linear-gradient(180deg, #fcf276 0, #fcf276 97px, #f5f5f5 97px, #f5f5f5 100%);
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.feature-page--rescue-detail .rescue-intro {
  padding: 18px 26px 17px;
  box-sizing: border-box;
}

.feature-page--rescue-detail .rescue-question {
  margin-bottom: 8px;
  font-size: 17px;
  line-height: 24px;
}

.feature-page--rescue-detail .rescue-intro>text:last-child {
  color: #666;
  font-size: 11px;
  line-height: 17px;
}

.feature-page--rescue-detail .detail-section--case .rescue-head image {
  width: 34px;
  height: 34px;
  margin-right: 0;
  flex: none;
}

.feature-page--rescue-detail .detail-section--case .rescue-head .rescue-avatar {
  margin-right: 0;
  flex: none;
}

.feature-page--rescue-detail .detail-views {
  display: block;
  margin-top: 13px;
  color: #999;
  font-size: 11px;
}

.feature-page--rescue-detail .detail-section--case .detail-gallery {
  gap: 1px;
  margin-top: 16px
}

.feature-page--rescue-detail .detail-section--case .detail-gallery-cell {
  width: calc((100% - 3px) / 4);
}

.feature-page--rescue-detail .rescue-detail-scroll-spacer {
  height: 100px;
  background: #f5f5f5;
}

.feature-page--rescue-detail .applicant-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #555;
  font-size: 12px;
  line-height: 18px;
}

.feature-page--rescue-detail .applicant-info-card .applicant-row {
  color: #333333;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.feature-page--rescue-detail .applicant-row :deep(.paw-tag) {
  background: #f4f4f4;
  color: #666666;
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
}

.feature-page--rescue-detail .applicant-row :deep(.paw-tag text) {
  color: #666666;
  font-size: 11px;
  font-weight: 400;
}

.feature-page--rescue-detail .applicant-value {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-page--rescue-detail .applicant-value-text {
  min-width: 0;
  color: #333333;
  font-size: 14px;
  font-weight: 400;
  overflow-wrap: anywhere;
}

.feature-page--rescue-detail .applicant-value :deep(.paw-badge) {
  flex: 0 0 auto;
}

.feature-page--rescue-detail .applicant-value text {
  color: #333333;
  font-size: 14px;
  font-weight: 400;
}

.feature-page--rescue-detail .evidence-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feature-page--rescue-detail .evidence-title {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.feature-page--rescue-detail .evidence-link {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0;
  color: #888;
  font-size: 14px;
}

.feature-page--rescue-detail .evidence-people-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20px;
  margin-top: 20px;
}

.feature-page--rescue-detail .evidence-person {
  display: flex;
  min-width: 48px;
  flex: 0 0 48px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.feature-page--rescue-detail .evidence-person-avatar {
  flex: 0 0 48px;
}

.feature-page--rescue-detail .evidence-person-name {
  max-width: 72px;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-page--rescue-detail .evidence-person-relation {
  max-width: 72px;
  overflow: hidden;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-page--rescue-detail .evidence-quote {
  margin-top: 18px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f5f5f5;
}

.feature-page--rescue-detail .evidence-quote-text {
  display: -webkit-box;
  overflow: hidden;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.feature-page--rescue-detail .evidence-action-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #fffaf0;
}

.feature-page--rescue-detail .evidence-proof-count {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: baseline;
  gap: 4px;
  color: #333;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.feature-page--rescue-detail .evidence-proof-count-number {
  color: #ee8002;
  font-size: 22px;
  line-height: 26px;
}

.feature-page--rescue-detail .evidence-proof-button {
  flex: 0 0 auto;
  white-space: nowrap;
}

.feature-page--rescue-detail .evidence-proof-button :deep(.paw-button) {
  background: #ffaa00;
  color: #fff;
  font-size: 12px;
  font-weight: 400;
}

.feature-page--rescue-detail .evidence-proof-button :deep(.paw-button--disabled) {
  background: #eee;
  color: #aaa;
}

.feature-page--rescue-detail .detail-note {
  display: block;
  margin-top: 0;
  color: #999999;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.feature-page--rescue-detail .rescue-status {
  flex: none;
  min-height: 21px;
  padding-right: 7px;
  padding-left: 7px;
}
</style>
