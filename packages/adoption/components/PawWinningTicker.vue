<template>
  <view
    class="winning-ticker"
    aria-label="中奖播报"
    data-qa="qa-adoption-gift-winning-ticker"
  >
    <view
      v-for="row in 2"
      :key="row"
      class="winning-ticker__lane"
    >
      <view
        class="winning-ticker__track"
        :class="`winning-ticker__track--${row}`"
      >
        <view
          v-for="copy in 2"
          :key="copy"
          class="winning-ticker__group"
          :aria-hidden="copy === 2"
        >
          <view
            v-for="(item, index) in items"
            :key="`${copy}-${index}`"
            class="winning-ticker__notice"
          >
            <image
              class="winning-ticker__avatar"
              :src="item.avatar"
              mode="aspectFill"
            />
            <text class="winning-ticker__text">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export interface WinningNotice {
  avatar: string
  text: string
}

export default defineComponent({
  name: 'PawWinningTicker',
  props: {
    items: { type: Array as PropType<WinningNotice[]>, required: true },
  },
})
</script>

<style scoped>
.winning-ticker {
  display: flex;
  height: 76px;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}
.winning-ticker__lane {
  height: 32px;
  overflow: hidden;
}
.winning-ticker__track {
  display: flex;
  width: max-content;
  animation: winning-ticker-scroll 18s linear infinite;
  will-change: transform;
}
.winning-ticker__track--1 {
  margin-left: -23px;
}
.winning-ticker__track--2 {
  margin-left: -95px;
  animation-duration: 21s;
  animation-delay: -7s;
}
.winning-ticker__group {
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
  padding-right: 12px;
}
.winning-ticker__notice {
  display: flex;
  width: 208px;
  height: 32px;
  flex: 0 0 208px;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.1);
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
}
.winning-ticker__avatar {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 50%;
}
.winning-ticker__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@keyframes winning-ticker-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
