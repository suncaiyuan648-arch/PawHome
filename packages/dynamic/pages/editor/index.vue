<template>
  <view
    class="page"
    :class="{ 'page--alternate': alternateMode }"
  >
    <PawPageNav
      title="发布动态"
      background="#ffffff"
      :auto-back="false"
      @back="goBack"
    />
    <view class="tool-row">
      <text
        class="btn-cancel"
        @click="goBack"
        >取消</text
      >
      <view
        class="btn-post"
        @click="onPublish"
        ><text>发表</text></view
      >
    </view>

    <scroll-view
      class="main"
      scroll-y
      :show-scrollbar="false"
      :bounces="false"
      :enable-flex="true"
    >
      <view class="pad">
        <view class="card">
          <view class="ta-wrap">
            <textarea
              class="ta"
              :value="content"
              maxlength="500"
              placeholder="分享喂猫过程"
              placeholder-class="ph"
              @input="onContentInput"
            />
            <text class="ta-count">{{ contentLen }}/500</text>
          </view>
          <view class="media-row">
            <view
              v-for="(src, index) in mediaList"
              :key="`${src}-${index}`"
              class="media-item"
              :data-qa="`publish-feed-media-item-${index}`"
            >
              <image
                class="media-preview"
                :src="src"
                mode="aspectFill"
              ></image>
              <view
                class="media-remove"
                :data-qa="`publish-feed-media-remove-${index}`"
                @tap.stop="removeMedia(index)"
              >
                <PawIcon
                  name="navigation/close"
                  :size="12"
                  label="删除图片"
                />
              </view>
            </view>
            <PawUploadTile
              class="media-add"
              size="106px"
              radius="3px"
              @select="pickMedia"
            >
              <image
                class="media-icon"
                src="/static/figma/publish/upload-media.svg"
                mode="aspectFit"
              >
              </image>
              <text class="media-txt">照片/视频</text>
            </PawUploadTile>
          </view>
        </view>

        <view
          v-if="isFeedbackScene"
          class="card card-feed"
        >
          <view class="feed-head">
            <text class="feed-lb">反馈</text>
            <view
              class="feed-link"
              @click="openOrderSheet"
            >
              <text>{{ orderSelectionLabel }}</text>
              <text class="feed-arr">›</text>
            </view>
          </view>

          <view
            v-if="selectedOrder"
            class="order-box"
          >
            <image
              v-if="alternateMode"
              class="order-avatar"
              src="/static/figma/feeding/yard-feed-avatar.png"
              mode="aspectFill"
            ></image>
            <view class="order-top">
              <view
                class="order-name-row"
                @click.stop="openOrderUser(selectedOrder)"
              >
                <text class="order-name">{{ selectedOrder.userName }}</text>
                <LevelBadge :level="selectedOrder.level" />
              </view>
              <text
                v-if="selectedOrder.timedOut"
                class="order-timeout"
                >已超时</text
              >
              <text
                v-else
                class="order-countdown"
                >{{ selectedOrder.countdown }}</text
              >
            </view>
            <text class="order-kg">投粮{{ selectedOrder.kg }}斤</text>
            <view class="order-bottom">
              <text class="order-time">{{ selectedOrder.time }}</text>
              <view class="order-tag"
                ><text>{{ feedbackTagText }}</text></view
              >
            </view>
          </view>

          <view class="cat-block">
            <text class="cat-title">本次投喂的小院猫咪 ({{ pickedCats.length }})</text>
            <view class="cat-row">
              <view
                v-for="cat in pickedCats"
                :key="cat.id || cat.name"
                class="cat-pet"
              >
                <image
                  :src="cat.avatar"
                  mode="aspectFill"
                ></image
                ><text>{{ cat.name }}</text>
              </view>
              <view
                class="cat-add"
                @click="onAddCats"
              >
                <view class="cat-plus"
                  ><uni-icons
                    type="plusempty"
                    color="#111"
                    :size="22"
                  ></uni-icons>
                </view>
                <text class="cat-add-txt">去添加</text>
              </view>
            </view>
          </view>
        </view>

        <view
          v-if="isFeedbackScene"
          class="foot-tip"
        >
          <text>
            爱心人士投喂您的小院后，需在物流签收7天内选择投喂的小院猫咪进行反馈，照片需包含爱心人士手写姓名的纸条，您的爱心与反馈是爱心人士的动力，感谢您的付出。
          </text>
        </view>
      </view>
    </scroll-view>

    <PawOrderSelectSheet
      :model-value="showOrderSheet"
      :orders="mockOrders"
      :selected-ids="tempOrderIds"
      @update:model-value="setOrderSheetVisible"
      @update:selected-ids="tempOrderIds = $event"
      @order-user-click="openOrderUser"
      @after-close="applyOrderSelection"
    />

    <PawPetSelectSheet
      :model-value="showPetSheet"
      :animals="animalOptions"
      :selected-ids="tempPetIds"
      @update:model-value="setPetSheetVisible"
      @update:selected-ids="tempPetIds = $event"
      @after-close="applyPetSelection"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { readPawEventValue } from '@/utils/pawEventMetadata.ts'
import { goBackSmart } from '@/utils/navBack.ts'
import { openUserProfile } from '@/utils/profileNav.ts'
import { animalIdsOfOrder } from '../../services/orderAssociation.ts'
import { getFeedingOrders } from '../../services/orderPicker.ts'
import {
  buildPublishEditorAnimals,
  createPublishEditorMocks,
  normalizePublishEditorOrder,
  normalizePublishEditorPet,
  publishEditorPetBelongsToYard,
  type PublishEditorAnimal,
  type PublishEditorOrder,
  type PublishEditorPet,
  type PublishEditorPickedCat,
} from '../../services/publishEditorMetadata.ts'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawUploadTile from '@/components/form/PawUploadTile.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawOrderSelectSheet from '../../components/PawOrderSelectSheet.vue'
import PawPetSelectSheet from '../../components/PawPetSelectSheet.vue'
import {
  publishLocalDynamic,
  publishLocalFeedback,
  readLocalFeedbackSummary,
} from '../../services/feedbackPublisher.ts'

type FeedbackReadData = Extract<
  ReturnType<typeof readLocalFeedbackSummary>,
  { success: true }
>['data']

interface FeedbackSummaryView {
  completedCount: number
  maximumCount: number
}

interface DynamicEditorState {
  content: string
  mediaList: string[]
  selectedOrder: PublishEditorOrder | null
  showOrderSheet: boolean
  selectedOrderIds: string[]
  tempOrderIds: string[]
  showPetSheet: boolean
  selectedPetIds: string[]
  tempPetIds: string[]
  mockOrders: PublishEditorOrder[]
  animalOptions: PublishEditorAnimal[]
  yardPets: PublishEditorPet[]
  pickedCats: PublishEditorPickedCat[]
  alternateMode: boolean
  feedbackSummary: FeedbackSummaryView | null
  feedbackAttemptKey: string
  feedbackErrorCode: string
  scene: 'post' | 'feeding-feedback'
  publishAttemptKey: string
}

function optionText(options: Record<string, unknown>, key: string): string {
  const value = options[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function firstFeedbackSummary(data: FeedbackReadData): FeedbackSummaryView | null {
  const summary = Array.isArray(data) ? data[0] : data
  return summary
    ? { completedCount: summary.completedCount, maximumCount: summary.maximumCount }
    : null
}

export default defineComponent({
  components: {
    PawPageNav,
    LevelBadge,
    PawIcon,
    PawUploadTile,
    PawOrderSelectSheet,
    PawPetSelectSheet,
  },
  data(): DynamicEditorState {
    const mocks = createPublishEditorMocks()
    return {
      content: '',
      mediaList: [
        '/static/figma/adoption-flow/pet-owner.png',
        '/static/figma/adoption-flow/apply-room.png',
      ],
      selectedOrder: null,
      showOrderSheet: false,
      selectedOrderIds: [],
      tempOrderIds: [],
      showPetSheet: false,
      selectedPetIds: [],
      tempPetIds: [],
      mockOrders: mocks.orders,
      animalOptions: mocks.animals,
      yardPets: mocks.pets,
      pickedCats: [],
      alternateMode: false,
      feedbackSummary: null,
      feedbackAttemptKey: '',
      feedbackErrorCode: '',
      scene: 'post',
      publishAttemptKey: '',
    }
  },
  computed: {
    contentLen(): number {
      return this.content.length
    },
    orderSelectionLabel(): string {
      return this.selectedOrderIds.length
        ? `已选择${this.selectedOrderIds.length}个订单`
        : '选择投粮订单'
    },
    feedbackTagText(): string {
      if (this.feedbackSummary)
        return `已反馈${this.feedbackSummary.completedCount}/${this.feedbackSummary.maximumCount}次`
      return this.selectedOrder && this.selectedOrder.feedbackTag
        ? this.selectedOrder.feedbackTag
        : '待反馈'
    },
    isFeedbackScene(): boolean {
      return this.scene === 'feeding-feedback'
    },
  },
  onLoad(options: Record<string, unknown> = {}) {
    this.scene =
      options.scene === 'feeding-feedback' ||
      options.type === 'yard-owner' ||
      options.state === 'feeding'
        ? 'feeding-feedback'
        : 'post'
    if (this.isFeedbackScene) this.hydratePersistentAnimals(optionText(options, 'yardId'))
    if (options.state === 'alternate') {
      this.scene = 'feeding-feedback'
      this.alternateMode = true
      this.mediaList = [
        '/static/figma/adoption-flow/pet-owner.png',
        '/static/figma/adoption-flow/apply-room.png',
      ]
      this.selectedOrderIds = [this.mockOrders[0].id]
      this.tempOrderIds = [...this.selectedOrderIds]
      this.applyOrderSelection()
    }
    const orderId = optionText(options, 'orderId') || optionText(options, 'id')
    if (orderId)
      this.selectOrderById(
        orderId,
        optionText(options, 'yardId'),
        optionText(options, 'yardOwnerId'),
      )
    // The former postFeedOrder page was only a route-shaped wrapper around
    // this sheet. Keep its Figma/legacy state reachable through the canonical
    // editor while avoiding a second production page.
    if (options.state === 'select-order')
      this.$nextTick(() => {
        this.showOrderSheet = true
      })
  },
  methods: {
    hydratePersistentAnimals(yardId = '') {
      try {
        const stored: unknown = uni.getStorageSync('PAWHOME_ANIMAL_RECORDS')
        const parsed: unknown = typeof stored === 'string' ? JSON.parse(stored) : stored
        if (!Array.isArray(parsed)) return
        const rows: unknown[] = parsed
        const firstYardRow = rows.find(
          (row): row is Record<string, unknown> => isRecord(row) && Boolean(row.yardId),
        )
        const targetYardId =
          optionText({ yardId }, 'yardId') || optionText(firstYardRow || {}, 'yardId')
        const persisted = rows
          .filter((row) => publishEditorPetBelongsToYard(row, targetYardId))
          .map(normalizePublishEditorPet)
          .filter((pet): pet is PublishEditorPet => pet !== null)
        if (persisted.length === 0) return
        this.yardPets = persisted
        this.animalOptions = buildPublishEditorAnimals(this.yardPets, this.mockOrders)
      } catch {
        // A malformed optional list must not turn the editor into a fixture.
      }
    },
    selectOrderById(orderId: string, yardId = '', yardOwnerId = '') {
      const id = String(orderId || '')
      if (!id) return
      const local = this.mockOrders.find((order) => order.id === id)
      if (local && !this.isFeedbackScene) {
        this.selectedOrderIds = [id]
        this.tempOrderIds = [id]
        this.applyOrderSelection()
        this.refreshFeedbackSummary()
        return
      }
      getFeedingOrders({
        variant: 'yard',
        yardOwnerId: optionText({ yardOwnerId }, 'yardOwnerId'),
        yardId: optionText({ yardId }, 'yardId') || '1',
      }).then((result) => {
        const item = result.success
          ? result.data.items.find((order) => String(order.id) === id)
          : null
        const normalized = normalizePublishEditorOrder(item)
        if (!normalized) {
          if (!local) return
          this.selectedOrderIds = [id]
          this.tempOrderIds = [id]
          this.applyOrderSelection()
          return
        }
        this.mockOrders = this.mockOrders.filter((order) => order.id !== id).concat(normalized)
        this.selectedOrderIds = [id]
        this.tempOrderIds = [id]
        this.applyOrderSelection()
        this.refreshFeedbackSummary()
      })
    },
    goBack() {
      goBackSmart({ fallbackUrl: '/pages/index/index' })
    },
    openOrderUser(order: PublishEditorOrder) {
      openUserProfile({
        pawId: order.pawId || `order-${order.id}`,
        nickname: order.userName,
        avatar: '',
      })
    },
    onContentInput(e: PawEvent) {
      this.content = readPawEventValue(e)
    },
    pickMedia() {
      uni.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const arr = Array.isArray(res.tempFilePaths)
            ? res.tempFilePaths.filter((path): path is string => typeof path === 'string')
            : []
          this.mediaList = (this.mediaList || []).concat(arr).slice(0, 9)
        },
      })
    },
    removeMedia(index: number) {
      if (!Array.isArray(this.mediaList) || index < 0 || index >= this.mediaList.length) return
      // mediaList is also the page's album-selection source of truth. Removing
      // here clears the preview and the corresponding selected media together.
      this.mediaList = this.mediaList.filter((_, itemIndex) => itemIndex !== index)
    },
    openOrderSheet() {
      this.tempOrderIds = this.selectedOrderIds.length ? [...this.selectedOrderIds] : []
      this.showOrderSheet = true
    },
    setOrderSheetVisible(value: boolean) {
      if (!value) this.applyOrderSelection()
      this.showOrderSheet = value
    },
    applyOrderSelection() {
      const ids = [...new Set(this.tempOrderIds.map((id) => String(id)))]
      this.selectedOrderIds = ids
      const petIds = [
        ...new Set(
          this.mockOrders
            .filter((order) => ids.includes(order.id))
            .flatMap((order) => this.orderPetIds(order)),
        ),
      ]
      this.selectedPetIds = petIds
      this.tempPetIds = [...petIds]
      this.syncPickedCats(petIds)
      this.updateSelectedOrderSummary(ids)
      this.feedbackAttemptKey = ''
      this.refreshFeedbackSummary()
    },
    openPetSheet() {
      this.tempPetIds = [...this.selectedPetIds]
      this.showPetSheet = true
    },
    setPetSheetVisible(value: boolean) {
      if (!value) this.applyPetSelection()
      this.showPetSheet = value
    },
    applyPetSelection() {
      const petIds = [...new Set(this.tempPetIds.map((id) => String(id)))]
      const orderIds = this.mockOrders
        .filter((order) => this.orderPetIds(order).some((petId) => petIds.includes(petId)))
        .map((order) => order.id)
      this.selectedPetIds = petIds
      this.selectedOrderIds = orderIds
      this.tempOrderIds = [...orderIds]
      this.syncPickedCats(petIds)
      this.updateSelectedOrderSummary(orderIds)
      this.feedbackAttemptKey = ''
      this.refreshFeedbackSummary()
    },
    orderPetIds(order: PublishEditorOrder): string[] {
      return animalIdsOfOrder(order).values
    },
    syncPickedCats(petIds: readonly string[]) {
      const ids = petIds.map((id) => String(id))
      this.pickedCats = this.yardPets
        .filter((pet) => ids.includes(pet.id))
        .map((pet) => ({ id: pet.id, name: pet.name, avatar: pet.avatar }))
    },
    updateSelectedOrderSummary(orderIds: readonly string[]) {
      const first = this.mockOrders.find((order) => order.id === orderIds[0])
      this.selectedOrder = first ? { ...first } : null
      if (this.selectedOrder && this.selectedOrder.id === 'yard-order-1') {
        this.selectedOrder.timedOut = true
        this.selectedOrder.countdown = ''
      }
    },
    refreshFeedbackSummary() {
      if (!this.isFeedbackScene) return
      const order = this.selectedOrder
      const animal = this.pickedCats[0]
      if (!order || !animal) {
        this.feedbackSummary = null
        return
      }
      const result = readLocalFeedbackSummary({
        order: { orderId: order.id, yardId: order.yardId },
        animal: { animalId: animal.id, yardId: order.yardId },
        actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
        requirePersistedAssociation: true,
      })
      this.feedbackSummary = result.success ? firstFeedbackSummary(result.data) : null
      this.feedbackErrorCode = result.success ? '' : result.error.code
    },
    onAddCats() {
      this.openPetSheet()
    },
    onPublish() {
      if (!this.isFeedbackScene) {
        if (!this.publishAttemptKey) this.publishAttemptKey = `attempt-${Date.now()}`
        const result = publishLocalDynamic({
          content: this.content,
          mediaList: this.mediaList,
          actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
          attemptKey: this.publishAttemptKey,
          storage: uni,
        })
        if (!result.success) {
          uni.showToast({ title: '动态未保存，请登录后重试', icon: 'none' })
          return
        }
        uni.navigateTo({
          url: `/packages/dynamic/pages/result/index?outcome=published&dynamicId=${encodeURIComponent(result.data.dynamicId)}`,
        })
        return
      }
      const order = this.selectedOrder
      const animal = this.pickedCats[0]
      if (!order || !animal) {
        uni.showToast({ title: '请选择投粮订单和猫咪', icon: 'none' })
        return
      }
      if (!this.feedbackAttemptKey) this.feedbackAttemptKey = `attempt-${Date.now()}`
      const result = publishLocalFeedback({
        orders: this.selectedOrderIds.map((orderId) => ({ orderId })),
        animals: this.selectedPetIds.map((animalId) => ({ animalId })),
        content: this.content,
        mediaList: this.mediaList,
        actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
        attemptKey: this.feedbackAttemptKey,
        storage: uni,
      })
      if (!result.success) {
        this.feedbackErrorCode = result.error.code || 'FEEDBACK_WRITE_FAILED'
        uni.showToast({ title: '反馈未保存，请先登录后重试', icon: 'none' })
        return
      }
      const summary = result.data.summaries[0]
      this.feedbackSummary = {
        completedCount: result.data.completedCount ?? summary?.completedCount ?? 0,
        maximumCount: result.data.maximumCount ?? summary?.maximumCount ?? 0,
      }
      uni.navigateTo({
        url: `/packages/feeding/pages/result/index?outcome=feedback-published&dynamicId=${encodeURIComponent(result.data.dynamicId)}&orderId=${encodeURIComponent(order.id)}`,
      })
    },
  },
})
</script>

<style scoped>
.page {
  position: relative;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  box-sizing: border-box;
}

.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 24rpx 0;
  box-sizing: border-box;
}

.btn-cancel {
  font-size: 30rpx;
  color: #333;
  line-height: 44rpx;
}

.btn-post {
  width: 57px;
  height: 30px;
  padding: 0;
  border-radius: 4px;
  background: #ffe60f;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-post text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 20px;
}

.main {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.pad {
  padding: 26px 12px 20px;
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}

.ta-wrap {
  position: relative;
  padding-bottom: 40rpx;
  min-height: 200rpx;
}

.ta {
  width: 100%;
  min-height: 200rpx;
  font-size: 30rpx;
  color: #222;
  line-height: 44rpx;
  box-sizing: border-box;
}

.ph {
  color: #c8c8c8;
  font-size: 30rpx;
}

.ta-count {
  position: absolute;
  right: 0;
  bottom: 0;
  font-size: 24rpx;
  color: #b0b0b0;
  line-height: 34rpx;
}

.media-add {
  width: 106px;
  height: 106px;
  border-radius: 3px;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.media-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 8px;
}

.media-item {
  position: relative;
  width: 106px;
  height: 106px;
  flex: 0 0 106px;
}

.media-preview {
  display: block;
  width: 106px;
  height: 106px;
  border-radius: 3px;
}

.media-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.page--alternate .btn-post {
  border-radius: 8rpx;
  padding: 10rpx 28rpx;
}

.page--alternate .pad {
  padding-top: 52rpx;
}

.page--alternate .card:first-child {
  padding-bottom: 44rpx;
}

.page--alternate .ta-wrap {
  height: 164rpx;
  min-height: 0;
}

.page--alternate .ta {
  height: 120rpx;
  min-height: 0;
}

.media-txt {
  margin-top: 8px;
  font-size: 13px;
  color: #8d8d92;
  line-height: 19px;
}

.media-icon {
  width: 21px;
  height: 21px;
  flex: none;
}

.card-feed {
  padding-bottom: 20rpx;
}

.feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.feed-lb {
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
  line-height: 42rpx;
}

.feed-link {
  display: flex;
  align-items: center;
  column-gap: 4rpx;
}

.feed-link text:first-child {
  font-size: 28rpx;
  color: #999;
  line-height: 40rpx;
}

.feed-arr {
  font-size: 32rpx;
  color: #c8c8c8;
  line-height: 1;
}

.order-box {
  position: relative;
  background: #fafafa;
  border-radius: 16rpx;
  padding: 20rpx 20rpx 16rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.order-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.order-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}

.order-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
  line-height: 42rpx;
}

.order-timeout {
  font-size: 24rpx;
  color: #ff4d4f;
  line-height: 34rpx;
  flex-shrink: 0;
}

.order-countdown {
  font-size: 22rpx;
  color: #ff4d4f;
  line-height: 32rpx;
  text-align: right;
  max-width: 280rpx;
}

.order-kg {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #555;
  line-height: 40rpx;
}

.order-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.order-time {
  font-size: 24rpx;
  color: #b0b0b0;
  line-height: 34rpx;
}

.order-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #e8f2ff;
  border: 1rpx solid #b3d4ff;
}

.order-tag text {
  font-size: 22rpx;
  color: #2b7de9;
  line-height: 30rpx;
}

.cat-block {
  margin-top: 8rpx;
}

.cat-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  line-height: 40rpx;
}

.cat-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 20rpx;
  row-gap: 12rpx;
  margin-top: 16rpx;
}

.cat-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100rpx;
}

.cat-plus {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #ffe60f;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-avatar {
  position: absolute;
  left: 18rpx;
  top: 22rpx;
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
}

.page--alternate .order-box {
  padding-left: 90rpx;
}

.cat-pet {
  width: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22rpx;
  color: #444;
}

.cat-pet image {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.cat-pet text {
  margin-top: 6rpx;
}

.cat-add-txt {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #888;
  line-height: 30rpx;
}

.cat-name {
  font-size: 28rpx;
  color: #333;
  line-height: 40rpx;
}

.foot-tip {
  padding: 8rpx 4rpx 32rpx;
}

.foot-tip text {
  font-size: 24rpx;
  color: #a0a0a0;
  line-height: 38rpx;
}

.page:not(.page--alternate) .ta-wrap {
  height: 108px;
  min-height: 0;
  padding-bottom: 0;
}

.page:not(.page--alternate) .ta {
  height: 90px;
  min-height: 0;
}
</style>
