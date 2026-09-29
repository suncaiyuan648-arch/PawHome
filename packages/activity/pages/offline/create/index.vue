<template>
  <view class="offline-activity-create-page">
    <view
      class="offline-activity-create-page__header-bg"
      :style="{ transform: `translateY(-${Math.min(scrollTop, 253)}px)` }"
    />
    <PawPageNav
      background="transparent"
      :auto-back="false"
      @back="goBack"
    />

    <scroll-view
      class="offline-activity-create-page__scroll"
      scroll-y
      :enable-flex="true"
      :show-scrollbar="false"
      data-qa="qa-offline-activity-create-form"
      @scroll="onScroll"
    >
      <view class="offline-activity-create-page__content">
        <text class="offline-activity-create-page__heading">Hello，欢迎发起线下活动</text>

        <view class="offline-activity-create-page__card offline-activity-create-page__cover-card">
          <view class="offline-activity-create-page__upload-wrap">
            <PawUploadTile
              :src="coverPath"
              :size="94"
              :radius="12"
              data-qa="qa-offline-activity-create-cover"
              @select="chooseCover"
            >
              <image
                class="offline-activity-create-page__camera"
                src="/static/figma/create-yard/camera.svg"
                mode="aspectFit"
              />
              <text class="offline-activity-create-page__upload-label">上传照片</text>
            </PawUploadTile>
          </view>
        </view>

        <view class="offline-activity-create-page__card offline-activity-create-page__fields">
          <view class="offline-activity-create-page__row">
            <text class="offline-activity-create-page__label">活动标题</text>
            <PawFormField
              v-model="title"
              class="offline-activity-create-page__control"
              bare
              :maxlength="15"
              placeholder="城市地点+主题，15字以内"
              data-qa="qa-offline-activity-create-title"
            />
          </view>

          <view
            class="offline-activity-create-page__row"
            data-qa="qa-offline-activity-create-time"
            @tap="timeEditorVisible = !timeEditorVisible"
          >
            <text class="offline-activity-create-page__label">活动时间</text>
            <text
              class="offline-activity-create-page__value"
              :class="{ 'offline-activity-create-page__value--placeholder': !timeSummary }"
              >{{ timeSummary || '请选择活动开始时间及结束时间' }}</text
            >
            <image
              class="offline-activity-create-page__chevron"
              src="/static/figma/create-yard/arrow-right.svg"
              mode="aspectFit"
            />
          </view>
          <view
            v-if="timeEditorVisible"
            class="offline-activity-create-page__time-editor"
            @tap.stop
          >
            <view class="offline-activity-create-page__time-line">
              <text>开始</text>
              <picker
                mode="date"
                :value="startDate || today"
                :start="today"
                @change="startDate = readPickerValue($event)"
              >
                <text>{{ startDate || '选择日期' }}</text>
              </picker>
              <picker
                mode="time"
                :value="startTime || '09:00'"
                @change="startTime = readPickerValue($event)"
              >
                <text>{{ startTime || '选择时间' }}</text>
              </picker>
            </view>
            <view class="offline-activity-create-page__time-line">
              <text>结束</text>
              <picker
                mode="date"
                :value="endDate || startDate || today"
                :start="startDate || today"
                @change="endDate = readPickerValue($event)"
              >
                <text>{{ endDate || '选择日期' }}</text>
              </picker>
              <picker
                mode="time"
                :value="endTime || '18:00'"
                @change="endTime = readPickerValue($event)"
              >
                <text>{{ endTime || '选择时间' }}</text>
              </picker>
            </view>
          </view>

          <view
            class="offline-activity-create-page__row offline-activity-create-page__row--location"
          >
            <text class="offline-activity-create-page__label">活动地点</text>
            <text
              class="offline-activity-create-page__value offline-activity-create-page__location"
              :class="{ 'offline-activity-create-page__value--placeholder': !location }"
              data-qa="qa-offline-activity-create-location"
              @tap="locationPickerVisible = true"
              >{{ location || '请选择活动地点' }}</text
            >
            <image
              v-if="location"
              class="offline-activity-create-page__clear"
              src="/static/figma/create-yard/clear.svg"
              mode="aspectFit"
              aria-label="清除地点"
              @tap.stop="location = ''"
            />
            <image
              class="offline-activity-create-page__pin"
              src="/static/figma/create-yard/location-pin.svg"
              mode="aspectFit"
              aria-label="选择地点"
              @tap="locationPickerVisible = true"
            />
          </view>

          <view
            class="offline-activity-create-page__row"
            data-qa="qa-offline-activity-create-requirement"
            @tap="requirementEditorVisible = !requirementEditorVisible"
          >
            <text class="offline-activity-create-page__label">活动要求</text>
            <text
              class="offline-activity-create-page__value"
              :class="{ 'offline-activity-create-page__value--placeholder': !requirement }"
              >{{ requirement || '请选择报名参与活动的要求' }}</text
            >
            <image
              class="offline-activity-create-page__chevron"
              src="/static/figma/create-yard/arrow-right.svg"
              mode="aspectFit"
            />
          </view>
          <PawFormField
            v-if="requirementEditorVisible"
            v-model="requirement"
            class="offline-activity-create-page__requirement-editor"
            bare
            :maxlength="100"
            placeholder="填写报名要求，例如人数或注意事项"
            data-qa="qa-offline-activity-create-requirement-input"
          />

          <view class="offline-activity-create-page__row">
            <text class="offline-activity-create-page__label">联系方式</text>
            <PawFormField
              v-model="contact"
              class="offline-activity-create-page__control"
              bare
              :maxlength="40"
              placeholder="填写微信号或手机号"
              data-qa="qa-offline-activity-create-contact"
            />
          </view>
        </view>

        <view class="offline-activity-create-page__card offline-activity-create-page__detail-card">
          <text class="offline-activity-create-page__section-title">活动详情</text>
          <PawFormField
            v-model="description"
            class="offline-activity-create-page__description"
            bare
            type="textarea"
            :maxlength="500"
            placeholder="描述活动详情，如具体活动内容等，请不要发布众筹类活动"
            data-qa="qa-offline-activity-create-description"
          />
          <text class="offline-activity-create-page__counter">{{ description.length }}/500</text>
        </view>

        <view class="offline-activity-create-page__card offline-activity-create-page__tags-card">
          <view class="offline-activity-create-page__tags-heading">
            <text class="offline-activity-create-page__section-title">活动标签</text>
            <text>至少选择3个标签</text>
          </view>
          <view class="offline-activity-create-page__tags">
            <view
              v-for="tag in availableTags"
              :key="tag"
              class="offline-activity-create-page__tag"
              :class="{ 'offline-activity-create-page__tag--selected': selectedTags.includes(tag) }"
              :data-qa="`qa-offline-activity-create-tag-${tag}`"
              @tap="toggleTag(tag)"
              >{{ tag }}</view
            >
          </view>
        </view>
      </view>
    </scroll-view>

    <PawFixedActionBar
      :primary-action="submitAction"
      primary-full-width
      @primary="submit"
    />

    <PawLocationPickerSheet
      v-model:visible="locationPickerVisible"
      @select="onLocationPicked"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar, { type PawFixedAction } from '@/components/layout/PawFixedActionBar.vue'
import PawFormField from '@/components/form/PawFormField.vue'
import PawUploadTile from '@/components/form/PawUploadTile.vue'
import PawLocationPickerSheet from '@/components/location/PawLocationPickerSheet.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { readPawEventNumber, readPawEventValue } from '@/utils/pawEventMetadata.ts'
import type { LocationPlace } from '@/utils/locationMetadata.ts'

const TAGS = [
  '新手友好',
  '接受学生',
  '无偿领养',
  '组队救助',
  '志愿招募',
  '小院探访',
  '猫咪领养',
  '狗狗领养',
  '线下聚会',
  '一起喂猫',
  '宠物社交',
  '宠物义诊',
  '露天活动',
  '发放礼品',
  '一起喂狗',
  '仅限本地',
  '绝育活动',
  '物资捐赠',
  '拯救猫车',
  '合力救猫',
  '义工招募',
  '线下团建',
  '驱虫义诊',
  '免费体检',
  '撸猫撸狗',
]

interface CreateActivityState {
  scrollTop: number
  coverPath: string
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  requirement: string
  contact: string
  description: string
  selectedTags: string[]
  timeEditorVisible: boolean
  requirementEditorVisible: boolean
  locationPickerVisible: boolean
  submitAction: PawFixedAction
}

export default defineComponent({
  name: 'OfflineActivityCreatePage',
  components: {
    PawPageNav,
    PawFixedActionBar,
    PawFormField,
    PawUploadTile,
    PawLocationPickerSheet,
  },
  data(): CreateActivityState {
    return {
      scrollTop: 0,
      coverPath: '',
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      requirement: '',
      contact: '',
      description: '',
      selectedTags: ['新手友好'],
      timeEditorVisible: false,
      requirementEditorVisible: false,
      locationPickerVisible: false,
      submitAction: { key: 'submit', label: '提交', qa: 'qa-offline-activity-create-submit' },
    }
  },
  computed: {
    today(): string {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    timeSummary(): string {
      if (!this.startDate || !this.startTime || !this.endDate || !this.endTime) return ''
      return `${this.startDate} ${this.startTime} - ${this.endDate} ${this.endTime}`
    },
    availableTags(): string[] {
      return TAGS
    },
  },
  methods: {
    onScroll(event: unknown) {
      this.scrollTop = Math.max(0, readPawEventNumber(event, 'scrollTop'))
    },
    goBack() {
      goBackSmart({ fallbackUrl: '/packages/activity/pages/offline/list/index' })
    },
    readPickerValue(event: unknown): string {
      return readPawEventValue(event)
    },
    chooseCover() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (result) => {
          const path = Array.isArray(result.tempFilePaths) ? result.tempFilePaths[0] : ''
          if (path) this.coverPath = path
        },
      })
    },
    onLocationPicked(place: LocationPlace) {
      this.location = [place.name, place.address].filter(Boolean).join(' ').trim()
      this.locationPickerVisible = false
    },
    toggleTag(tag: string) {
      const index = this.selectedTags.indexOf(tag)
      if (index >= 0) this.selectedTags.splice(index, 1)
      else this.selectedTags.push(tag)
    },
    submit() {
      const required: Array<[boolean, string]> = [
        [!!this.coverPath, '请上传活动照片'],
        [!!this.title.trim(), '请填写活动标题'],
        [!!this.timeSummary, '请选择活动开始和结束时间'],
        [!!this.location, '请选择活动地点'],
        [!!this.contact.trim(), '请填写联系方式'],
        [!!this.description.trim(), '请填写活动详情'],
        [this.selectedTags.length >= 3, '请至少选择3个标签'],
      ]
      const missing = required.find(([valid]) => !valid)
      if (missing) {
        uni.showToast({ title: missing[1], icon: 'none' })
        return
      }
      if (`${this.endDate} ${this.endTime}` <= `${this.startDate} ${this.startTime}`) {
        uni.showToast({ title: '结束时间须晚于开始时间', icon: 'none' })
        return
      }
      uni.showModal({
        title: '表单已填写完成',
        content: '活动发布服务尚未接入，当前不会创建活动。',
        showCancel: false,
      })
    },
  },
})
</script>

<style scoped>
.offline-activity-create-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f6;
}

.offline-activity-create-page__header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 253px;
  background: #fff275;
}

.offline-activity-create-page__scroll {
  position: relative;
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
}

.offline-activity-create-page__content {
  position: relative;
  padding: 3px 12px 112px;
}

.offline-activity-create-page__heading {
  display: block;
  color: #282827;
  font-size: 23px;
  font-weight: 700;
  line-height: 33px;
  margin-bottom: 17px;
}

.offline-activity-create-page__card {
  width: 100%;
  border-radius: 11px;
  background: #fff;
  box-sizing: border-box;
}

.offline-activity-create-page__cover-card {
  height: 125px;
  padding: 12px;
  margin-bottom: 10px;
}

.offline-activity-create-page__upload-wrap {
  width: 94px;
  height: 94px;
}

.offline-activity-create-page__upload-label {
  display: block;
  color: #aaa;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.offline-activity-create-page__camera {
  display: block;
  width: 28px;
  height: 28px;
  margin-bottom: 2px;
}

.offline-activity-create-page__fields {
  padding: 5px 12px;
  margin-bottom: 10px;
}

.offline-activity-create-page__row {
  display: flex;
  align-items: center;
  min-height: 58px;
  gap: 12px;
}

.offline-activity-create-page__row--location {
  min-height: 67px;
}

.offline-activity-create-page__label {
  flex: 0 0 68px;
  color: #282827;
  font-size: 14px;
  line-height: 20px;
}

.offline-activity-create-page__control {
  flex: 1 1 auto;
  min-width: 0;
}

.offline-activity-create-page__control :deep(.paw-form-field__input) {
  font-size: 13px;
}

.offline-activity-create-page__value {
  display: -webkit-box;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #282827;
  font-size: 13px;
  line-height: 19px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.offline-activity-create-page__value--placeholder {
  color: #aaa;
}

.offline-activity-create-page__location {
  margin-right: auto;
}

.offline-activity-create-page__chevron {
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
}

.offline-activity-create-page__clear {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
}

.offline-activity-create-page__pin {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
}

.offline-activity-create-page__time-editor {
  padding: 0 0 8px 80px;
}

.offline-activity-create-page__time-line {
  display: flex;
  align-items: center;
  min-height: 42px;
  color: #666;
  font-size: 13px;
  gap: 10px;
}

.offline-activity-create-page__time-line picker {
  padding: 7px 8px;
  border-radius: 6px;
  background: #f5f6f6;
}

.offline-activity-create-page__requirement-editor {
  padding: 0 0 14px 80px;
}

.offline-activity-create-page__detail-card {
  display: flex;
  flex-direction: column;
  min-height: 207px;
  padding: 15px 12px 10px;
  margin-bottom: 10px;
}

.offline-activity-create-page__section-title {
  color: #282827;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.offline-activity-create-page__description {
  flex: 1 1 auto;
  margin-top: 8px;
}

.offline-activity-create-page__description :deep(.paw-form-field__textarea) {
  min-height: 130px;
  font-size: 13px;
}

.offline-activity-create-page__counter {
  align-self: flex-end;
  color: #aaa;
  font-size: 12px;
  line-height: 16px;
}

.offline-activity-create-page__tags-card {
  padding: 15px 12px 20px;
}

.offline-activity-create-page__tags-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.offline-activity-create-page__tags-heading > text:last-child {
  color: #aaa;
  font-size: 12px;
}

.offline-activity-create-page__tags {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px 5px;
}

.offline-activity-create-page__tag {
  overflow: hidden;
  padding: 4px 1px;
  border-radius: 2px;
  background: #f5f6f6;
  color: #8c8c8c;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  text-overflow: clip;
  white-space: nowrap;
}

.offline-activity-create-page__tag--selected {
  background: #fff9d2;
  color: #cda400;
}
</style>
