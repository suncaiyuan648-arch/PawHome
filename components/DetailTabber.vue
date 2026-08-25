<template>
  <view class="detailTbber">
    <YardFeedPopup v-model:visible="feedPopupVisible" @pay="onFeedPay" />
    <ShareActionSheet v-model:visible="shareSheetVisible" @select="onShareSheetSelect" />
    <view class="operate">
      <view class="operate-item" @tap.stop="shareSheetVisible = true">
        <image src="/static/fenxiang.png"></image>
        <text>分享</text>
      </view>
      <view class="operate-item" @click.stop="onJoinTap">
        <image
          v-if="joined"
          class="join-done-img"
          src="/static/yard-joined-checked.png"
          mode="aspectFit"
        ></image>
        <image v-else class="join-icon-img" src="/static/ruzhu.png"></image>
        <text>{{ joined ? "已入驻" : "入驻" }}</text>
      </view>
      <view class="operate-item" @click.stop="onAdoptTap">
        <image src="/static/lingyang.png"></image>
        <text>领养</text>
      </view>
    </view>
    <view class="touwei" @tap.stop="feedPopupVisible = true">
      <!-- 不用外链 touwei.png（缺失时整灰块）；样式按钮始终可读 -->
      <view class="touwei-pill">
        <text class="touwei-pill-txt">立即投喂</text>
      </view>
    </view>
  </view>
</template>

<script>
import ShareActionSheet from "@/components/ShareActionSheet.vue";
import YardFeedPopup from "@/components/YardFeedPopup.vue";

export default {
  name: "DetailTabber",
  components: { ShareActionSheet, YardFeedPopup },
  props: {
    /** 院子详情：入驻成功后为 true，显示黄底勾 +「已入驻」 */
    joined: {
      type: Boolean,
      default: false,
    },
    /** 「复制链接」写入剪贴板的地址，可选 */
    shareUrl: {
      type: String,
      default: "",
    },
  },
  emits: ["adopt", "join", "leave", "share-action", "feed-pay"],
  data() {
    return {
      shareSheetVisible: false,
      feedPopupVisible: false,
    };
  },
  methods: {
    onShareSheetSelect(key) {
      this.$emit("share-action", key);
      const fallbackUrl =
        (this.shareUrl && String(this.shareUrl).trim()) ||
        "https://pawhome.example/yard/share";
      if (key === "link") {
        uni.setClipboardData({
          data: fallbackUrl,
          success: () => uni.showToast({ title: "链接已复制", icon: "none" }),
        });
        return;
      }
      if (key === "poster") {
        uni.showToast({ title: "海报生成中…", icon: "none" });
        return;
      }
      if (key === "wechat" || key === "moments") {
        uni.showToast({ title: "请使用右上角菜单分享", icon: "none" });
        return;
      }
      if (key === "report") {
        uni.showToast({ title: "举报入口（演示）", icon: "none" });
      }
    },
    onJoinTap() {
      if (this.joined) {
        this.$emit("leave");
      } else {
        this.$emit("join");
      }
    },
    onAdoptTap() {
      this.$emit("adopt");
    },
    onFeedPay(payload) {
      this.$emit("feed-pay", payload);
    },
  },
};
</script>

<style lang="less" scoped>
.detailTbber {
  height: 164rpx;
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 999;
  padding: 14rpx 16rpx 70rpx 44rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  .operate {
    display: flex;
    align-items: center;
    gap: 54rpx;
    flex: 0 0 auto;
    margin-top: 5px;
    margin-left: 6rpx;
    .operate-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      image,
      .join-icon-img,
      .join-done-img {
        width: 44rpx;
        height: 44rpx;
				margin-bottom: 6rpx;
        transform: translateX(-2rpx);
      }
      text {
        font-size: 22rpx;
        font-weight: 500;
        letter-spacing: 0px;
        line-height: 24rpx;
        color: rgba(153, 153, 153, 1);
        text-align: center;
        vertical-align: middle;
      }
    }
  }
  .touwei {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 280rpx;
    margin-left: 0;
    transform: translateX(15rpx);
  }

  .touwei-pill {
    width: 370rpx;
    max-width: 100%;
    height: 83rpx;
    padding: 0 20rpx;
    box-sizing: border-box;
    border-radius: 999rpx;
    background: linear-gradient(180deg, #ffe566 0%, #ffdd00 55%, #ffd400 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 14rpx rgba(255, 200, 0, 0.35);
  }

  .touwei-pill-txt {
    font-size: 30rpx;
    font-weight: 700;
    color: rgba(51, 51, 51, 1);
    letter-spacing: 1rpx;
  }
}
</style>
