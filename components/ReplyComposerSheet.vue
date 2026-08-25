<template>
  <view v-if="visible" class="rcs-root">
    <view class="rcs-mask" @tap="close"></view>
    <view class="rcs-sheet" @tap.stop>
      <textarea
        class="rcs-ta"
        :value="text"
        placeholder="说点什么"
        placeholder-class="rcs-ph"
        :maxlength="maxlength"
        :show-confirm-bar="false"
        :adjust-position="true"
        auto-height
        @input="onInput"
      />
      <view class="rcs-bar">
        <view class="rcs-bar-left">
          <view class="rcs-ico-hit" @tap.stop="$emit('voice')">
            <image class="rcs-ico" src="/static/me/annual-china.svg" mode="aspectFit" />
          </view>
          <view class="rcs-ico-hit" @tap.stop="$emit('pick-image')">
            <image class="rcs-ico" src="/static/me/order-review.svg" mode="aspectFit" />
          </view>
        </view>
        <view class="rcs-send" :class="{ 'rcs-send--active': hasText }" @tap.stop="onSend">
          <text class="rcs-send-txt">发送</text>
        </view>
      </view>
      <view class="rcs-safe" />
    </view>
  </view>
</template>

<script>
/** 回复底部抽屉：图4 空输入浅黄发送钮；图5 有文案高亮黄钮。图标与 YardCommentComposer 一致 */
export default {
  name: "ReplyComposerSheet",
  props: {
    visible: { type: Boolean, default: false },
    maxlength: { type: Number, default: 500 },
  },
  emits: ["update:visible", "send", "voice", "pick-image"],
  data() {
    return {
      text: "",
    };
  },
  computed: {
    hasText() {
      return (this.text || "").trim().length > 0;
    },
  },
  watch: {
    visible(v) {
      if (v) this.text = "";
    },
  },
  methods: {
    onInput(e) {
      this.text = e.detail.value || "";
    },
    close() {
      this.text = "";
      this.$emit("update:visible", false);
    },
    onSend() {
      const v = (this.text || "").trim();
      if (!v) return;
      this.$emit("send", v);
      this.text = "";
      this.$emit("update:visible", false);
    },
  },
};
</script>

<style lang="less" scoped>
.rcs-root {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10030;
  pointer-events: auto;
}

.rcs-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
}

.rcs-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx 24rpx 0;
  box-sizing: border-box;
}

.rcs-ta {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  box-sizing: border-box;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 30rpx;
  line-height: 44rpx;
  color: #222;
}

.rcs-ph {
  color: #b8b8b8;
}

.rcs-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 4rpx 12rpx;
}

.rcs-bar-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 28rpx;
}

.rcs-ico-hit {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rcs-ico {
  width: 44rpx;
  height: 44rpx;
}

.rcs-send {
  padding: 14rpx 40rpx;
  border-radius: 999rpx;
  background: #fef8d3;
}

.rcs-send--active {
  background: #ffeb3b;
}

.rcs-send-txt {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.rcs-safe {
  height: calc(16rpx + env(safe-area-inset-bottom));
  min-height: 16rpx;
}
</style>
