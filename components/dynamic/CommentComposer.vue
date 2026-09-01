<template>
  <view class="comment-composer" @tap.stop="onTap">
    <PawAvatar :src="avatar" :size="34" />
    <view class="comment-composer__field">
      <input v-if="!readonly" class="comment-composer__input" :value="value" :placeholder="placeholder"
        placeholder-class="comment-composer__placeholder" confirm-type="send" @input="onInput" @confirm="onSend" />
      <text v-else class="comment-composer__placeholder">{{ placeholder }}</text>
      <view class="comment-composer__tools">
        <view class="comment-composer__hit comment-composer__hit--voice" @tap.stop="$emit('voice')">
          <PawIcon name="actions/composer-voice" :size="17" />
        </view>
        <view class="comment-composer__hit comment-composer__hit--emoji" @tap.stop="$emit('pick-image')">
          <PawIcon name="actions/composer-emoji" :size="17" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'CommentComposer',
  components: { PawAvatar, PawIcon },
  props: {
    avatar: { type: String, default: '/static/user.png' },
    placeholder: { type: String, default: '有话要说，告诉她这条路并不孤单' },
    readonly: { type: Boolean, default: false },
    value: { type: String, default: '' }
  },
  emits: ['input', 'send', 'voice', 'pick-image', 'click'],
  data() { return { draft: this.value } },
  watch: { value(value) { this.draft = value } },
  methods: {
    onTap(event) { this.$emit('click', event) },
    onInput(event) { this.draft = event.detail.value || ''; this.$emit('input', this.draft) },
    onSend() { const text = this.draft.trim(); if (text) this.$emit('send', text) }
  }
}
</script>

<style scoped>
.comment-composer {
  display: flex;
  align-items: center;
  width: 345px;
  height: 34px;
  box-sizing: border-box;
}

.comment-composer__field {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 33px;
  margin-left: 10px;
  padding: 0 3px 0 15px;
  box-sizing: border-box;
  border-radius: 15px;
  background: var(--paw-color-input, #f4f4f5);
}

.comment-composer__input,
.comment-composer__placeholder {
  flex: 1;
  min-width: 0;
  color: #333;
  font-size: 13px;
  line-height: 33px;
}

.comment-composer__placeholder {
  overflow: hidden;
  color: #b2b2b2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-composer__tools {
  display: flex;
  align-items: center;
}

.comment-composer__hit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 33px;
}

.comment-composer__hit--voice {
  margin-right: 3px;
}

</style>
