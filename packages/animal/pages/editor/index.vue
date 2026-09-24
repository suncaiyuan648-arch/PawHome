<template>
  <view class="page">
    <view
      class="hero-backdrop"
      aria-hidden="true"
    ></view>
    <view class="hero">
      <PawPageNav
        background="#fcf276"
        :auto-back="false"
        @back="goBack"
      />
      <view
        class="avatar-card"
        @click="onPickAvatar"
      >
        <image
          v-if="avatarUrl"
          class="avatar-img"
          :src="avatarUrl"
          mode="aspectFill"
        ></image>
        <template v-else>
          <PawIcon
            class="cam-icon"
            name="actions/camera"
            :size="28"
          />
          <text class="avatar-tip">{{ avatarTip }}头像</text>
        </template>
      </view>
    </view>

    <scroll-view
      class="scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="scroll-pad">
        <view class="card fields-card">
          <view
            class="f-row f-row--tap"
            @click="openSheet('status')"
          >
            <view class="f-label">
              <text>{{ formLabel }}状态</text>
              <text class="req">*</text>
            </view>
            <text class="f-val">{{ form.status }}</text>
            <PawIcon
              class="f-arrow"
              name="navigation/form-chevron"
              :size="12"
            />
          </view>
          <view class="f-row">
            <view class="f-label">
              <text>{{ formLabel }}名字</text>
              <text class="req">*</text>
            </view>
            <input
              class="f-input"
              type="text"
              :value="form.name"
              placeholder="填写名字"
              placeholder-class="ph"
              @input="onNameInput"
            />
            <view
              v-if="form.name"
              class="f-clear"
              @click.stop="form.name = ''"
            >
              <PawIcon
                name="navigation/form-clear"
                :size="16"
                label="清除"
              />
            </view>
          </view>
          <view
            class="f-row f-row--tap"
            @click="openSheet('value')"
          >
            <view class="f-label">
              <text>{{ formLabel }}价值</text>
              <text class="req">*</text>
            </view>
            <text class="f-val">{{ petValue }}</text>
            <PawIcon
              class="f-arrow"
              name="navigation/form-chevron"
              :size="12"
            />
          </view>

          <template v-if="expandMore">
            <view
              class="f-row f-row--tap"
              @click="openSheet('personality')"
            >
              <view class="f-label"
                ><text>{{ formLabel }}性格</text></view
              >
              <text
                class="f-val"
                :class="{ 'f-ph': !form.personality }"
                >{{ form.personality || '亲人' }}</text
              >
              <PawIcon
                class="f-arrow"
                name="navigation/form-chevron"
                :size="12"
              />
            </view>
            <view
              class="f-row f-row--tap"
              @click="openBreedPicker"
            >
              <view class="f-label"
                ><text>{{ formLabel }}品种</text></view
              >
              <text class="f-val">{{ form.breed }}</text>
              <PawIcon
                class="f-arrow"
                name="navigation/form-chevron"
                :size="12"
              />
            </view>
            <view
              class="f-row f-row--tap"
              @click="openSheet('gender')"
            >
              <view class="f-label"
                ><text>{{ formLabel }}性别</text></view
              >
              <text class="f-val">{{ form.gender }}</text>
              <PawIcon
                class="f-arrow"
                name="navigation/form-chevron"
                :size="12"
              />
            </view>
            <picker
              mode="date"
              :value="birthValue"
              @change="onBirthChange"
            >
              <view class="f-row f-row--tap">
                <view class="f-label"
                  ><text>{{ formLabel }}生日</text></view
                >
                <text class="f-val">{{ birthDisplay }}</text>
                <PawIcon
                  class="f-arrow"
                  name="navigation/form-chevron"
                  :size="12"
                />
              </view>
            </picker>
            <view
              class="f-row f-row--tap"
              @click="openSheet('neuter')"
            >
              <view class="f-label"><text>绝育</text></view>
              <text class="f-val">{{ form.neuter }}</text>
              <PawIcon
                class="f-arrow"
                name="navigation/form-chevron"
                :size="12"
              />
            </view>
            <view
              class="f-row f-row--tap"
              @click="openSheet('vaccine')"
            >
              <view class="f-label"><text>疫苗</text></view>
              <text class="f-val">{{ form.vaccine }}</text>
              <PawIcon
                class="f-arrow"
                name="navigation/form-chevron"
                :size="12"
              />
            </view>
          </template>

          <view
            class="expand-bar"
            @click="expandMore = !expandMore"
          >
            <text class="expand-txt">{{ expandMore ? '收起更多' : '补充更多' }}</text>
            <view class="expand-arrow">
              <PawIcon
                name="navigation/expand-arrow"
                :size="12"
                :rotate="expandMore ? 180 : 0"
              />
            </view>
          </view>
        </view>

        <view class="card card-desc">
          <view class="ta-wrap">
            <textarea
              class="ta"
              :value="form.desc"
              maxlength="200"
              placeholder="可以单独描述这只猫咪的性格、状况等"
              placeholder-class="ph"
              @input="onDescInput"
            />
            <text class="ta-count">{{ descLen }}/200</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer">
      <PawButton
        class="save-btn"
        size="md"
        block
        flush
        nowrap
        @click="onSave"
      >
        <text class="save-label">保存</text>
      </PawButton>
    </view>

    <!-- 价值使用页面专属刻度，其余选项统一走选择 Sheet -->
    <PawSelectionSheet
      v-model="selectionSheetVisible"
      title=""
      :items="sheetOptions"
      :value="currentSheetValue"
      variant="form-selection"
      :show-close="true"
      :safe-area="false"
      height="385px"
      @select="onPickOption"
    />
    <PawBottomSheet
      v-model="valueSheetVisible"
      variant="value-selection"
      height="497px"
      :close-on-mask="true"
      :safe-area="true"
      @after-open="onValueSheetOpen"
    >
      <view class="value-sheet">
        <view
          class="value-close"
          @click.stop="closeSheet"
        >
          <PawIcon
            class="value-close-icon"
            name="navigation/value-close"
            :size="26"
            label="关闭"
          />
        </view>
        <text class="scale-title">宠物价值</text>
        <view class="scale-value"
          ><text class="scale-yen">￥</text><text class="scale-number">{{ petValue }}</text>
        </view>
        <view
          class="scale-ruler-area"
          @touchstart.stop="onScaleTouchStart"
          @touchmove.stop.prevent="onScaleTouchMove"
          @touchend.stop="onScaleTouchEnd"
          @touchcancel.stop="onScaleTouchEnd"
        >
          <view class="scale-ruler-viewport">
            <view
              class="scale-ruler-track"
              :class="{ 'is-dragging': rulerDragging }"
              :style="rulerTrackStyle"
            >
              <view
                class="scale-ruler-line"
                aria-hidden="true"
              ></view>
              <view
                v-for="tick in rulerTicks"
                :key="tick.value"
                class="scale-ruler-tick"
                :class="{ 'scale-ruler-tick--major': tick.major }"
                :style="{ left: `${tick.position}%` }"
              >
                <view
                  class="scale-ruler-tick-mark"
                  aria-hidden="true"
                ></view>
                <text
                  v-if="tick.major"
                  class="scale-ruler-tick-label"
                  >{{ tick.value }}</text
                >
              </view>
            </view>
            <view
              class="scale-ruler-pointer"
              :style="rulerPointerStyle"
              aria-hidden="true"
            >
              <view class="scale-ruler-pointer-head"></view>
              <view class="scale-ruler-pointer-stem"></view>
            </view>
            <view
              class="scale-ruler-fade scale-ruler-fade--left"
              aria-hidden="true"
            ></view>
            <view
              class="scale-ruler-fade scale-ruler-fade--right"
              aria-hidden="true"
            ></view>
          </view>
        </view>
        <text class="scale-hint">用于设置用户申请领养时所需的领养额度</text>
        <text class="scale-copy"
          >设置过低会给虐猫人群批量收猫可乘之机，设置过高会导致真正想要领养的人放弃，领养额度只是发起领养申请的门槛，您拥有申请的审核权，请综合宠物的品种、大小等因素合理设置，推荐设置15~30之间</text
        >
        <PawButton
          class="scale-save"
          size="md"
          block
          flush
          nowrap
          @click="closeSheet"
          ><text>保存价值</text>
        </PawButton>
      </view>
    </PawBottomSheet>
    <view
      v-if="blocked"
      class="editor-blocked"
      data-qa="qa-animal-editor-blocked"
    >
      <text class="editor-blocked__title">动物资料编辑暂不可用</text>
      <text class="editor-blocked__copy"
        >当前 animalId 没有可验证的本地记录或管理关系，表单不会冒充保存成功。</text
      >
      <text class="editor-blocked__code">{{ errorCode }}</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawSelectionSheet from './components/PawSelectionSheet.vue'
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { readPawEventNumber, readPawEventValue } from '@/utils/pawEventMetadata.ts'
import {
  canCreateLocalAnimal,
  createLocalAnimal,
  readLocalAnimal,
  updateLocalAnimal,
} from '../../services/localManagementStorage.ts'
import {
  createAnimalEditorMockMetadata,
  createAnimalEditorOptions,
  getAnimalEditorFormField,
  getAnimalEditorPopupKind,
  type AnimalEditorForm,
  type AnimalEditorSheetKind,
  type AnimalEditorSpecies,
} from '@/utils/animalEditorMetadata.ts'

interface AnimalEditorPageState {
  animalId: string
  yardId: string
  createMode: boolean
  blocked: boolean
  errorCode: string
  saving: boolean
  petKind: AnimalEditorSpecies
  yardName: string
  avatarUrl: string
  expandMore: boolean
  birthValue: string
  form: AnimalEditorForm
  mediaList: string[]
  sheetKind: AnimalEditorSheetKind
  petValue: number
  personalityValue: number
  rulerValue: number
  rulerWidth: number
  rulerHeight: number
  rulerViewportWidth: number
  rulerPointerWidth: number
  rulerDragging: boolean
  rulerDragStartX: number
  rulerDragStartValue: number
}

interface RulerTick {
  value: number
  major: boolean
  position: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = readText(value)
    if (text) return text
  }
  return ''
}

function readNumber(value: unknown, fallback: number): number {
  const number =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(number) ? number : fallback
}

export default defineComponent({
  name: 'AnimalEditorPage',
  components: { PawSelectionSheet, PawBottomSheet, PawButton, PawPageNav, PawIcon },
  data(): AnimalEditorPageState {
    const mock = createAnimalEditorMockMetadata()
    return {
      animalId: '',
      yardId: '',
      createMode: false,
      blocked: true,
      errorCode: 'INVALID_ID',
      saving: false,
      petKind: 'cat',
      yardName: '',
      avatarUrl: '',
      expandMore: false,
      birthValue: mock.birthValue,
      form: mock.form,
      mediaList: [],
      sheetKind: '',
      petValue: mock.petValue,
      personalityValue: mock.personalityValue,
      rulerValue: mock.petValue,
      rulerWidth: 309,
      rulerHeight: 66,
      rulerViewportWidth: 375,
      rulerPointerWidth: 22,
      rulerDragging: false,
      rulerDragStartX: 0,
      rulerDragStartValue: 15,
    }
  },
  computed: {
    formLabel() {
      return this.petKind === 'dog' ? '狗狗' : '猫猫'
    },
    avatarTip() {
      return this.petKind === 'dog' ? '小狗' : '小猫'
    },
    birthDisplay() {
      const p = (this.birthValue || '').split('-')
      if (p.length !== 3) return '请选择生日'
      return `${p[0]}年${Number(p[1])}月${Number(p[2])}日`
    },
    descLen() {
      return (this.form.desc || '').length
    },
    sheetOptions(): string[] {
      return createAnimalEditorOptions(this.sheetKind)
    },
    currentSheetValue(): string {
      const field = getAnimalEditorFormField(this.sheetKind)
      return field ? this.form[field] : ''
    },
    selectionSheetVisible: {
      get() {
        return !!this.sheetKind && this.sheetKind !== 'value'
      },
      set(value: boolean) {
        if (!value) this.closeSheet()
      },
    },
    valueSheetVisible: {
      get() {
        return this.sheetKind === 'value'
      },
      set(value: boolean) {
        if (!value) this.closeSheet()
      },
    },
    rulerTicks(): RulerTick[] {
      const ticks: RulerTick[] = []
      for (let value = 0; value <= 30; value += 1) {
        ticks.push({ value, major: value % 5 === 0, position: (value / 30) * 100 })
      }
      return ticks
    },
    rulerTrackStyle() {
      return {
        width: `${this.rulerWidth}px`,
        height: `${this.rulerHeight}px`,
        transform: `translate3d(${this.rulerTranslate}px, -50%, 0)`,
      }
    },
    rulerPointerStyle() {
      return {
        width: `${this.rulerPointerWidth}px`,
        height: `${this.rulerHeight}px`,
      }
    },
    rulerTranslate() {
      return this.rulerViewportWidth / 2 - (this.rulerValue / 30) * this.rulerWidth
    },
  },
  onLoad(query: unknown = {}) {
    const route = isRecord(query) ? query : {}
    this.animalId = readText(route.animalId).trim()
    this.yardId = readText(route.yardId).trim()
    if (this.animalId) {
      const result = readLocalAnimal(this.animalId, {
        yardId: this.yardId,
        actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
      })
      this.blocked = !result.success
      this.errorCode = result.success ? '' : (result.error && result.error.code) || 'READER_MISSING'
      if (result.success && result.data) {
        const record = result.data.record || {}
        this.petKind = record.species === 'dog' ? 'dog' : 'cat'
        this.form.name = readText(record.name)
        this.form.breed = readText(record.breed) || this.form.breed
        this.form.desc = firstText(record.desc, record.description)
        this.form.status =
          firstText(record.statusLabel, record.status, record.state) || this.form.status
        this.form.gender = readText(record.gender) || this.form.gender
        this.form.neuter = readText(record.neuter) || this.form.neuter
        this.form.vaccine = readText(record.vaccine) || this.form.vaccine
        this.form.personality = readText(record.personality) || this.form.personality
        this.petValue = readNumber(record.petValue ?? record.value, this.petValue)
        this.rulerValue = this.petValue
        this.birthValue = firstText(record.birthValue, record.birthday) || this.birthValue
        this.avatarUrl = readText(record.avatar)
      }
    } else if (this.yardId) {
      const result = canCreateLocalAnimal(this.yardId, {
        actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
      })
      this.blocked = !result.success
      this.createMode = result.success
      this.errorCode = result.success ? '' : (result.error && result.error.code) || 'FORBIDDEN'
      if (result.success && result.data && result.data.yard)
        this.yardName = readText(result.data.yard.name) || this.yardName
    } else {
      this.blocked = true
      this.errorCode = 'INVALID_ID'
    }
    const requestedDog = route.species === 'dog' || route.kind === 'dog' || route.type === 'dog'
    if (!this.animalId && requestedDog) {
      this.petKind = 'dog'
      if (!this.animalId || this.blocked) {
        this.form.breed = '金毛'
        this.form.personality = '非常亲人'
      }
    } else if (!this.animalId || this.blocked) {
      this.form.breed = '蓝金'
      this.form.personality = '亲人'
    }
    if (route.state === 'more') this.expandMore = true
    const routeYardName = readText(route.yardName)
    if (routeYardName) {
      try {
        this.yardName = decodeURIComponent(routeYardName) || this.yardName
      } catch {
        this.yardName = routeYardName
      }
    }
    const popupKind = getAnimalEditorPopupKind(route.popup)
    if (popupKind) {
      this.expandMore = true
      this.sheetKind = popupKind
      if (route.popup === 'status') this.form.status = '失踪'
      if (route.popup === 'vaccine') this.form.vaccine = '已接种'
      if (route.popup === 'personality') this.form.personality = '非常亲人'
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    onNameInput(e: PawEvent) {
      this.form.name = readPawEventValue(e).trimStart()
    },
    onDescInput(e: PawEvent) {
      this.form.desc = readPawEventValue(e)
    },
    onBirthChange(e: PawEvent) {
      this.birthValue = readPawEventValue(e) || this.birthValue
    },
    openBreedPicker() {
      const kind = this.petKind === 'dog' ? 'dog' : 'cat'
      uni.navigateTo({
        url: '/packages/animal/pages/breed-picker/index?species=' + kind,
        events: {
          breedPicked: (payload: unknown) => {
            const b = (isRecord(payload) ? readText(payload.breed) : '').trim()
            if (b) this.form.breed = b
          },
        },
        success: (result: UniNamespace.NavigateToSuccessOptions) => {
          result.eventChannel.emit('initBreed', { breed: this.form.breed })
        },
      })
    },
    openSheet(kind: AnimalEditorSheetKind) {
      this.sheetKind = kind
      if (kind === 'value') this.rulerValue = this.petValue
    },
    closeSheet() {
      if (this.sheetKind === 'value') {
        this.petValue = Math.round(this.rulerValue)
        this.rulerValue = this.petValue
      }
      this.sheetKind = ''
    },
    isOptionSelected(opt: string) {
      const k = this.sheetKind
      if (k === 'status') return opt === this.form.status
      if (k === 'gender') return opt === this.form.gender
      if (k === 'neuter') return opt === this.form.neuter
      if (k === 'vaccine') return opt === this.form.vaccine
      if (k === 'personality') return opt === this.form.personality
      return false
    },
    onPickOption(opt: string | number) {
      if (typeof opt === 'string') {
        const k = this.sheetKind
        if (k === 'status') this.form.status = opt
        else if (k === 'gender') this.form.gender = opt
        else if (k === 'neuter') this.form.neuter = opt
        else if (k === 'vaccine') this.form.vaccine = opt
        else if (k === 'personality') this.form.personality = opt
      }
      this.closeSheet()
    },
    onScaleChange(e: PawEvent) {
      const value = Math.min(30, Math.max(0, readPawEventNumber(e, 'value')))
      if (this.sheetKind === 'value') {
        this.rulerValue = value
        this.petValue = Math.round(value)
      } else this.personalityValue = value
    },
    onValueSheetOpen() {
      this.$nextTick(() => {
        uni
          .createSelectorQuery()
          .in(this)
          .select('.scale-ruler-viewport')
          .boundingClientRect()
          .exec((rects: UniNamespace.NodeInfo[]) => {
            const viewport = Array.isArray(rects) ? rects[0] : null
            if (!isRecord(viewport) || typeof viewport.width !== 'number' || !viewport.width) return
            this.rulerViewportWidth = viewport.width
            this.rulerWidth = Math.min(309, Math.max(240, viewport.width - 66))
          })
      })
    },
    touchX(e: PawEvent) {
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
      if (!touch) return null
      const x = touch.clientX !== undefined ? touch.clientX : touch.pageX
      return typeof x === 'number' ? x : null
    },
    onScaleTouchStart(e: PawEvent) {
      const x = this.touchX(e)
      if (x === null) return
      this.rulerDragging = true
      this.rulerDragStartX = x
      this.rulerDragStartValue = this.rulerValue
    },
    onScaleTouchMove(e: PawEvent) {
      if (!this.rulerDragging) return
      const x = this.touchX(e)
      if (x === null || !this.rulerWidth) return
      const delta = x - this.rulerDragStartX
      const next = this.rulerDragStartValue - (delta / this.rulerWidth) * 30
      this.rulerValue = Math.min(30, Math.max(0, next))
      this.petValue = Math.round(this.rulerValue)
    },
    onScaleTouchEnd() {
      if (!this.rulerDragging) return
      this.rulerDragging = false
      this.petValue = Math.round(this.rulerValue)
      this.rulerValue = this.petValue
    },
    onPickAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (result: UniNamespace.ChooseImageSuccessCallbackResult) => {
          const p = result.tempFilePaths[0]
          if (p) this.avatarUrl = p
        },
      })
    },
    pickMedia() {
      uni.chooseImage({
        count: 9 - this.mediaList.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (result: UniNamespace.ChooseImageSuccessCallbackResult) => {
          const arr = result.tempFilePaths || []
          this.mediaList = this.mediaList.concat(arr).slice(0, 9)
        },
      })
    },
    removeMedia(index: number) {
      this.mediaList.splice(index, 1)
    },
    onSave() {
      if (this.blocked) {
        uni.showToast({ title: '动物资料保存暂不可用', icon: 'none' })
        return
      }
      if (!this.form.name.trim()) return uni.showToast({ title: '请填写名字', icon: 'none' })
      if (!this.form.breed) return uni.showToast({ title: '请选择品种', icon: 'none' })
      if (!this.yardId) return uni.showToast({ title: '缺少小院标识，无法保存', icon: 'none' })
      if (this.saving) return
      this.saving = true
      const wasCreate = this.createMode
      const patch = {
        species: this.petKind,
        name: this.form.name.trim(),
        breed: this.form.breed,
        desc: this.form.desc || '',
        avatar: this.avatarUrl || '',
        status: this.form.status,
        petValue: Number(this.petValue) || 0,
        gender: this.form.gender,
        neuter: this.form.neuter,
        vaccine: this.form.vaccine,
        personality: this.form.personality || '',
        birthValue: this.birthValue,
      }
      const actorProvider = () => uni.getStorageSync<unknown>('PAWHOME_ACTOR_SESSION')
      const result = this.createMode
        ? createLocalAnimal(this.yardId, patch, { actorProvider })
        : updateLocalAnimal(this.animalId, patch, { yardId: this.yardId, actorProvider })
      this.saving = false
      if (!result.success) {
        this.errorCode = (result.error && result.error.code) || 'STORAGE_WRITE_FAILED'
        uni.showToast({ title: '动物资料未更新', icon: 'none' })
        return
      }
      if (this.createMode && result.data && result.data.record) {
        this.animalId = readText(result.data.record.animalId)
        this.createMode = false
      }
      this.blocked = false
      uni.showToast({ title: wasCreate ? '动物资料已创建' : '动物资料已更新', icon: 'none' })
      uni.navigateBack()
    },
  },
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #f6f8fa;
  box-sizing: border-box;
}

.editor-blocked {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f6f8fa;
  text-align: center;
}
.editor-blocked__title {
  color: #555;
  font-size: 16px;
  line-height: 23px;
}
.editor-blocked__copy {
  max-width: 300px;
  margin-top: 8px;
  color: #999;
  font-size: 13px;
  line-height: 20px;
}
.editor-blocked__code {
  margin-top: 12px;
  color: #bbb;
  font-size: 11px;
  line-height: 16px;
}

.hero-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 279px;
  background: #fcf276;
  z-index: 0;
}

.hero {
  position: relative;
  z-index: 1;
  background: transparent;
  padding-bottom: 14px;
  flex-shrink: 0;
}

.avatar-card {
  width: 94px;
  height: 94px;
  margin: 8px auto 0;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.avatar-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #b6b6b8;
  line-height: 17px;
}

.scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
  position: relative;
  z-index: 1;
}

.scroll-pad {
  padding: 3px 12px 12px;
  padding-bottom: calc(12px + 59px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.fields-card {
  padding: 8px 12px 11px;
  box-sizing: border-box;
}

.f-row {
  display: flex;
  align-items: center;
  min-height: 58px;
  height: auto;
  padding: 18px 0;
  box-sizing: border-box;
  border-bottom: 0.5px solid #f6f8fa;
}

.fields-card .f-row {
  width: 100%;
}

.f-row--tap:active {
  opacity: 0.85;
}

.f-label {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 8px;
}

.f-label text:first-child {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  line-height: 21px;
}

.req {
  color: #ff4d4f;
  font-size: 14px;
  margin-left: 2px;
  line-height: 21px;
}

.f-val {
  flex: 1;
  text-align: right;
  font-size: 15px;
  color: #555;
  line-height: 21px;
  margin-right: 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.f-ph {
  color: #c8c8c8;
}

.f-input {
  flex: 1;
  text-align: right;
  font-size: 15px;
  color: #333;
  line-height: 21px;
  margin-right: 4px;
  min-width: 0;
}

.ph {
  color: #c8c8c8;
  font-size: 14px;
}

.f-clear {
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.f-arrow {
  display: block;
}

.expand-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 35px;
  height: auto;
  column-gap: 0;
  padding: 9px 0 8px;
  box-sizing: border-box;
}

.expand-txt {
  font-size: 13px;
  color: #999;
  line-height: 1;
}

.expand-arrow {
  display: flex;
  align-items: center;
  margin-left: 3px;
}

.card-desc {
  display: flex;
  flex-direction: column;
  padding: 10px 9px 12px;
  min-height: 202px;
  box-sizing: border-box;
}

.ta-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
  padding-bottom: 20px;
  min-height: 0;
}

.ta {
  flex: 1;
  width: 100%;
  min-height: 140px;
  height: auto;
  font-size: 14px;
  color: #333;
  line-height: 22px;
  box-sizing: border-box;
}

.ta-count {
  position: absolute;
  right: 0;
  bottom: 0;
  font-size: 12px;
  color: #b0b0b0;
  line-height: 17px;
}

.media-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.media-cell {
  position: relative;
  flex: 0 0 80px;
  width: auto;
  height: auto;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f2f2f2;
}

.media-img {
  width: 100%;
  height: 100%;
}

.media-del {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-del text {
  color: #fff;
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
}

.media-add {
  flex: 0 0 80px;
  width: auto;
  height: auto;
  aspect-ratio: 1;
  border-radius: 8px;
  background: #f5f5f5;
  border: 0.5px dashed #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.media-add-txt {
  margin-top: 4px;
  font-size: 11px;
  color: #aaa;
  line-height: 15px;
  text-align: center;
  padding: 0 4px;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background: #fff;
  box-sizing: border-box;
}

.save-btn {
  width: 100%;
  height: 43px;
  min-height: 43px;
  border-radius: 42px;
  background: #ffdc06;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.save-label) {
  font-size: 17px;
  font-weight: 700;
  color: #282827;
  line-height: 1;
}

.value-sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 497px;
  padding-top: 57px;
  box-sizing: border-box;
}

.value-close {
  position: absolute;
  top: 21px;
  right: 18px;
  width: 26px;
  height: 26px;
  z-index: 2;
}

.value-close-icon {
  display: block;
}

.scale-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  line-height: 18px;
  color: #222;
}

.scale-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  height: 39px;
  margin-top: 5px;
  color: #222;
  font-weight: 700;
}

.scale-yen {
  font-size: 24px;
  line-height: 29px;
}

.scale-number {
  font-size: 32px;
  line-height: 39px;
}

.scale-ruler-area {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 82px;
  height: auto;
  margin-top: 14px;
  background: #f2f2f2;
}

.scale-ruler-viewport {
  position: relative;
  width: 100%;
  height: 66px;
  overflow: hidden;
  touch-action: none;
}

.scale-ruler-track {
  position: absolute;
  left: 0;
  top: 50%;
  will-change: transform;
}

.scale-ruler-track.is-dragging {
  transition: none;
}

.scale-ruler-line {
  position: absolute;
  top: 31px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e5e5e5;
}

.scale-ruler-tick {
  position: absolute;
  top: 0;
  width: 1px;
  height: 66px;
  transform: translateX(-50%);
}

.scale-ruler-tick-mark {
  position: absolute;
  top: 27px;
  left: 0;
  width: 1px;
  height: 9px;
  background: #e0e0e0;
}

.scale-ruler-tick--major .scale-ruler-tick-mark {
  top: 20px;
  height: 22px;
  width: 2px;
  background: #dcdcdc;
}

.scale-ruler-tick-label {
  position: absolute;
  top: 47px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  line-height: 17px;
  color: #999;
  white-space: nowrap;
}

.scale-ruler-pointer {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  overflow: hidden;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.scale-ruler-pointer-head {
  position: absolute;
  top: 0;
  left: 1px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 11px solid #ff4e2e;
}

.scale-ruler-pointer-stem {
  position: absolute;
  top: 10px;
  left: 8px;
  width: 6px;
  height: 56px;
  background: #ff4e2e;
}

.scale-ruler-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 42px;
  pointer-events: none;
}

.scale-ruler-fade--left {
  left: 0;
  background: linear-gradient(
    to right,
    #f2f2f2 0%,
    rgba(242, 242, 242, 0.86) 38%,
    rgba(242, 242, 242, 0) 100%
  );
}

.scale-ruler-fade--right {
  right: 0;
  background: linear-gradient(
    to left,
    #f2f2f2 0%,
    rgba(242, 242, 242, 0.86) 38%,
    rgba(242, 242, 242, 0) 100%
  );
}

.scale-hint {
  display: block;
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  line-height: 17px;
  color: #ee8002;
}

.scale-copy {
  display: block;
  width: calc(100% - 32px);
  max-width: 313px;
  margin-top: 9px;
  text-align: center;
  font-size: 12px;
  line-height: 14px;
  color: #999;
}

.scale-save {
  position: absolute;
  left: 11px;
  right: 13px;
  bottom: 36px;
  width: auto;
  height: 46px;
  min-height: 46px;
  border-radius: 42px;
  background: #ffe60f;
}

:deep(.scale-save text) {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  color: #282827;
}
</style>
