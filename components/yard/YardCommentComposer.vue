<template>
  <view class="ycc">
    <PawNoticeModal
      v-model:visible="noticeVisible"
      :message="noticeMessage"
      @confirm="onNoticeConfirm"
    />
    <text v-if="commentTotalText" class="ycc__count">{{ commentTotalText }}</text>
    <view class="ycc__row">
      <image class="ycc__avatar" :src="safeAvatarSrc" mode="aspectFill"></image>
      <view class="ycc__pill">
        <input
          class="ycc__input"
          type="text"
          :value="text"
          :placeholder="placeholder"
          placeholder-class="ycc__ph"
          confirm-type="send"
          @input="onInput"
          @confirm="onSend"
        />
        <view class="ycc__icons">
          <view class="ycc__icon-hit" @click.stop="onMic">
            <image class="ycc__ico" src="/static/me/annual-china.svg" mode="aspectFit"></image>
          </view>
          <view class="ycc__icon-hit" @click.stop="onPickImage">
            <image class="ycc__ico" src="/static/me/order-review.svg" mode="aspectFit"></image>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawNoticeModal from "@/components/PawNoticeModal.vue";
import { PAW_MSG_VOICE_LEVEL, PAW_MSG_VOICE_DAY_LIMIT } from "@/utils/pawNoticeMessages.js";
import { safeImgSrc } from "@/utils/safeImgSrc.js";

export default {
  name: "YardCommentComposer",
  components: { PawNoticeModal },
  props: {
    commentTotalText: {
      type: String,
      default: "",
    },
    avatarSrc: {
      type: String,
      default: "/static/user.png",
    },
    placeholder: {
      type: String,
      default: "有话要说，告诉她这条路并不孤单",
    },
  },
  emits: ["send", "voice", "pick-image"],
  computed: {
    safeAvatarSrc() {
      return safeImgSrc(this.avatarSrc, "/static/user.png");
    },
  },
  data() {
    return {
      text: "",
      /** 演示：0=弹等级无语音，1=弹今日次数用完，之后走原逻辑；接接口后删除 */
      micDemoStage: 0,
      noticeVisible: false,
      noticeMessage: "",
    };
  },
  methods: {
    onInput(e) {
      this.text = e.detail.value || "";
    },
    onSend() {
      const v = (this.text || "").trim();
      if (!v) return;
      this.$emit("send", v);
      this.text = "";
    },
    onMic() {
      if (this.micDemoStage === 0) {
        this.noticeMessage = PAW_MSG_VOICE_LEVEL;
        this.noticeVisible = true;
        return;
      }
      if (this.micDemoStage === 1) {
        this.noticeMessage = PAW_MSG_VOICE_DAY_LIMIT;
        this.noticeVisible = true;
        return;
      }
      this.$emit("voice");
      uni.showToast({ title: "按住说话即将上线", icon: "none" });
    },
    onNoticeConfirm() {
      if (this.micDemoStage === 0) this.micDemoStage = 1;
      else if (this.micDemoStage === 1) this.micDemoStage = 2;
    },
    onPickImage() {
      this.$emit("pick-image");
      uni.chooseImage({
        count: 9,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const n = (res.tempFilePaths || []).length;
          if (n) uni.showToast({ title: `已选择 ${n} 张图片`, icon: "none" });
        },
      });
    },
  },
};
</script>

<style lang="less" scoped>
.ycc {
  padding: 8px 13px 14px;
  box-sizing: border-box;
}

.ycc__count {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: rgba(51, 51, 51, 1);
  margin-bottom: 12px;
}

.ycc__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.ycc__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #f2f2f2;
}

.ycc__pill {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
  height: 40px;
  border-radius: 999px;
  background: #f5f5f5;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 14px;
  padding-right: 8px;
  box-sizing: border-box;
}

.ycc__input {
  flex: 1;
  min-width: 0;
  height: 40px;
  font-size: 14px;
  color: #333;
}

.ycc__ph {
  color: #a8a8a8;
  font-size: 14px;
}

.ycc__icons {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}

.ycc__icon-hit {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ycc__ico {
  width: 44rpx;
  height: 44rpx;
}
</style>
