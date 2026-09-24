<template>
  <view class="editor-page">
    <PawPageNav
      title="编辑资料"
      background="#f5f5f5"
      fallback-url="/pages/me/index"
    />
    <view class="editor-content">
      <view
        v-if="blocked"
        class="editor-state"
      >
        <text class="editor-state__title">资料编辑暂不可用</text>
        <text class="editor-state__copy"
          >当前环境没有可验证的资料读取与保存服务，未开放本地表单写入。</text
        >
        <text class="editor-state__code">{{ errorCode }}</text>
      </view>
      <view
        v-else
        class="editor-form"
      >
        <view class="editor-card">
          <view class="field-row"
            ><text class="field-label">昵称</text
            ><input
              class="field-input"
              :value="form.nickname"
              maxlength="24"
              @input="onInput('nickname', $event)"
          /></view>
          <view class="field-row"
            ><text class="field-label">简介</text
            ><textarea
              class="field-textarea"
              :value="form.bio"
              maxlength="120"
              @input="onInput('bio', $event)"
            />
          </view>
          <view class="field-row"
            ><text class="field-label">标签</text
            ><input
              class="field-input"
              :value="tagsText"
              maxlength="60"
              @input="onTagsInput"
          /></view>
        </view>
        <button
          class="save-button"
          :disabled="saving"
          data-qa="qa-profile-editor-save"
          @tap="onSave"
        >
          {{ saving ? '保存中' : '保存资料' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import { readLocalProfile, updateLocalProfile } from '../../../services/localProfileStorage.ts'
import { readPawEventValue } from '@/utils/pawEventMetadata.ts'

type ProfileEditorField = 'nickname' | 'bio'

interface ProfileEditorForm {
  nickname: string
  bio: string
  tags: string[]
}
interface ProfileEditorPageState {
  userId: string
  blocked: boolean
  errorCode: string
  saving: boolean
  form: ProfileEditorForm
}

function queryRecord(options: unknown): Record<string, unknown> {
  return options !== null && typeof options === 'object' && !Array.isArray(options)
    ? (options as Record<string, unknown>)
    : {}
}

function eventText(event: PawEvent): string {
  return readPawEventValue(event)
}

export default defineComponent({
  name: 'AccountProfileEditorPage',
  components: { PawPageNav },
  data(): ProfileEditorPageState {
    return {
      userId: '',
      blocked: true,
      errorCode: 'READER_MISSING',
      saving: false,
      form: { nickname: '', bio: '', tags: [] },
    }
  },
  computed: {
    tagsText() {
      return Array.isArray(this.form.tags) ? this.form.tags.join('、') : ''
    },
  },
  onLoad(options: unknown = {}) {
    const route = queryRecord(options)
    this.userId = typeof route.userId === 'string' ? route.userId : ''
    const result = readLocalProfile(this.userId, {
      actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
    })
    this.blocked = !result.success
    this.errorCode = (result.error && result.error.code) || ''
    if (result.success && result.data) {
      const record = result.data.record || {}
      this.form = {
        nickname:
          typeof record.nickname === 'string'
            ? record.nickname
            : typeof record.name === 'string'
              ? record.name
              : '',
        bio: typeof record.bio === 'string' ? record.bio : '',
        tags: Array.isArray(record.tags)
          ? record.tags.filter((tag): tag is string => typeof tag === 'string')
          : [],
      }
    }
  },
  methods: {
    onInput(field: ProfileEditorField, event: PawEvent) {
      this.form[field] = eventText(event)
    },
    onTagsInput(event: PawEvent) {
      const text = eventText(event)
      this.form.tags = text
        .split(/[、,，\s]+/)
        .map((item: string) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    },
    onSave() {
      if (this.blocked || this.saving) return
      this.saving = true
      const result = updateLocalProfile(
        this.userId,
        {
          nickname: String(this.form.nickname || '').trim(),
          bio: this.form.bio || '',
          tags: this.form.tags,
        },
        { actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION') },
      )
      this.saving = false
      if (!result.success) {
        this.errorCode = (result.error && result.error.code) || 'STORAGE_WRITE_FAILED'
        uni.showToast({ title: '资料未更新', icon: 'none' })
        return
      }
      uni.showToast({ title: '资料已更新', icon: 'none' })
      uni.navigateBack()
    },
  },
})
</script>

<style scoped>
.editor-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #333;
}
.editor-content {
  padding: 16px;
}
.editor-state {
  display: flex;
  min-height: 300px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  text-align: center;
}
.editor-state__title {
  color: #555;
  font-size: 16px;
  line-height: 23px;
}
.editor-state__copy {
  max-width: 300px;
  margin-top: 8px;
  color: #999;
  font-size: 13px;
  line-height: 20px;
}
.editor-state__code {
  margin-top: 12px;
  color: #bbb;
  font-size: 11px;
  line-height: 16px;
}
.editor-form {
  padding: 16px;
}
.editor-card {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
}
.field-row {
  display: flex;
  min-height: 52px;
  box-sizing: border-box;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.field-row:last-child {
  border-bottom: 0;
}
.field-label {
  width: 52px;
  color: #555;
  font-size: 14px;
  line-height: 20px;
}
.field-input,
.field-textarea {
  flex: 1;
  box-sizing: border-box;
  color: #222;
  font-size: 14px;
  line-height: 20px;
}
.field-textarea {
  min-height: 64px;
  padding-top: 6px;
}
.save-button {
  height: 44px;
  margin-top: 20px;
  border: 0;
  border-radius: 22px;
  background: #ffe60f;
  color: #222;
  font-size: 15px;
  line-height: 44px;
}
.save-button::after {
  border: 0;
}
</style>
