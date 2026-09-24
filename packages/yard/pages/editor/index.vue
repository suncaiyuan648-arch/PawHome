<template>
  <view class="editor-page">
    <PawPageNav title="编辑小院" background="#f5f5f5" fallback-url="/packages/yard/pages/animals/index" />
    <view class="editor-content">
      <view v-if="blocked" class="editor-state">
        <text class="editor-state__title">小院编辑暂不可用</text>
        <text class="editor-state__copy">必须先读取当前 yardId 的可信院主关系与已批准 writer，未满足条件时不会产生写入。</text>
        <text class="editor-state__code">{{ errorCode }}</text>
      </view>
      <view v-else class="editor-form">
        <view class="editor-card">
          <view class="field-row"><text class="field-label">小院名</text><input class="field-input" :value="form.name" maxlength="30" @input="onInput('name', $event)" /></view>
          <view class="field-row"><text class="field-label">位置</text><input class="field-input" :value="form.location" maxlength="80" @input="onInput('location', $event)" /></view>
          <view class="field-row field-row--area"><text class="field-label">简介</text><textarea class="field-textarea" :value="form.description" maxlength="200" @input="onInput('description', $event)" /></view>
          <view class="field-row field-row--area"><text class="field-label">公告</text><textarea class="field-textarea" :value="form.intro" maxlength="200" @input="onInput('intro', $event)" /></view>
        </view>
        <button class="save-button" :disabled="saving" data-qa="qa-yard-editor-save" @tap="onSave">{{ saving ? '保存中' : '保存小院' }}</button>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import { readLocalYard, updateLocalYard } from '../../services/localManagementStorage.ts'

interface YardEditorForm {
  name: string
  location: string
  description: string
  intro: string
}

type YardEditorField = keyof YardEditorForm

interface YardEditorPageState {
  yardId: string
  blocked: boolean
  errorCode: string
  saving: boolean
  form: YardEditorForm
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function eventValue(event: PawEvent): string {
  const detail: unknown = event.detail
  return isRecord(detail) ? readText(detail.value) : ''
}

export default defineComponent({
  name: 'YardEditorPage',
  components: { PawPageNav },
  data(): YardEditorPageState {
    return {
      yardId: '',
      blocked: true,
      errorCode: 'READER_MISSING',
      saving: false,
      form: { name: '', location: '', description: '', intro: '' }
    }
  },
  onLoad(options: unknown = {}) {
    const route = isRecord(options) ? options : {}
    this.yardId = readText(route.yardId)
    const result = readLocalYard(this.yardId, { actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION') })
    this.blocked = !result.success
    this.errorCode = result.success ? '' : (result.error && result.error.code || 'READER_MISSING')
    if (result.success && result.data) {
      const record = result.data.record || {}
      this.form = {
        name: readText(record.name),
        location: readText(record.location),
        description: readText(record.description),
        intro: readText(record.intro)
      }
    }
  },
  methods: {
    onInput(field: YardEditorField, event: PawEvent) {
      this.form[field] = eventValue(event)
    },
    onSave() {
      if (this.blocked || this.saving) return
      const name = this.form.name.trim()
      if (!name) {
        uni.showToast({ title: '请填写小院名', icon: 'none' })
        return
      }
      this.saving = true
      const result = updateLocalYard(this.yardId, {
        name,
        location: this.form.location,
        description: this.form.description,
        intro: this.form.intro
      }, { actorProvider: () => uni.getStorageSync<unknown>('PAWHOME_ACTOR_SESSION') })
      this.saving = false
      if (!result.success) {
        this.errorCode = result.error && result.error.code || 'STORAGE_WRITE_FAILED'
        uni.showToast({ title: '小院未更新', icon: 'none' })
        return
      }
      uni.showToast({ title: '小院已更新', icon: 'none' })
      uni.navigateBack()
    }
  }
})
</script>

<style scoped>
.editor-page { min-height: 100vh; box-sizing: border-box; background: #f5f5f5; color: #333; }
.editor-content { padding: 16px; }
.editor-state { display: flex; min-height: 300px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; padding: 28px; text-align: center; }
.editor-state__title { color: #555; font-size: 16px; line-height: 23px; }
.editor-state__copy { max-width: 300px; margin-top: 8px; color: #999; font-size: 13px; line-height: 20px; }
.editor-state__code { margin-top: 12px; color: #bbb; font-size: 11px; line-height: 16px; }
.editor-form { padding: 16px; }
.editor-card { overflow: hidden; border-radius: 12px; background: #fff; }
.field-row { display: flex; min-height: 52px; box-sizing: border-box; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
.field-row--area { align-items: flex-start; }
.field-row:last-child { border-bottom: 0; }
.field-label { width: 52px; flex-shrink: 0; color: #555; font-size: 14px; line-height: 20px; }
.field-input, .field-textarea { flex: 1; box-sizing: border-box; color: #222; font-size: 14px; line-height: 20px; }
.field-textarea { min-height: 64px; padding-top: 4px; }
.save-button { height: 44px; margin-top: 20px; border: 0; border-radius: 22px; background: #ffe60f; color: #222; font-size: 15px; line-height: 44px; }
.save-button::after { border: 0; }
</style>
