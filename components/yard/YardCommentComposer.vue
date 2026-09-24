<template>
  <view class="yard-comment-composer">
    <text
      v-if="commentTotalText"
      class="yard-comment-composer__count"
      >{{ commentTotalText }}</text
    >
    <CommentComposer
      :avatar="avatarSrc"
      :placeholder="placeholder"
      @input="$emit('input', $event)"
      @send="$emit('send', $event)"
      @voice="$emit('voice')"
      @pick-image="$emit('pick-image')"
    />
  </view>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'
import { defineComponent } from 'vue'

import CommentComposer from '@/components/dynamic/CommentComposer.vue'

export default defineComponent({
  name: 'YardCommentComposer',
  components: { CommentComposer },
  props: {
    commentTotalText: { type: String, default: '' },
    avatarSrc: { type: String, default: '/static/user.png' },
    placeholder: { type: String, default: '有话要说，告诉她这条路并不孤单' },
  },
  emits: {
    input: eventContract<[text: string]>(),
    send: eventContract<[text: string]>(),
    voice: eventContract<[]>(),
    'pick-image': eventContract<[]>(),
  },
})
</script>

<style scoped>
.yard-comment-composer__count {
  display: block;
  padding: 8px 13px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
</style>
