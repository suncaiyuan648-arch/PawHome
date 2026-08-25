<template>
  <view v-if="visible" class="sas-root">
    <view class="sas-mask" @tap="close"></view>
    <view class="sas-sheet" @tap.stop>
      <text class="sas-title">分享至</text>

      <view class="sas-row sas-row--main">
        <view
          v-for="item in mainActions"
          :key="item.key"
          class="sas-cell"
          @tap.stop="onPick(item.key)"
        >
          <view class="sas-bubble" :class="'sas-bubble--' + item.key">
            <uni-icons :type="item.icon" :size="item.iconSize" :color="item.iconColor" />
          </view>
          <text class="sas-label">{{ item.label }}</text>
        </view>
      </view>

      <view class="sas-line"></view>

      <view class="sas-row sas-row--sub">
        <view class="sas-cell" @tap.stop="onPick('report')">
          <view class="sas-bubble sas-bubble--report">
            <uni-icons type="info-filled" :size="22" color="#ffffff" />
          </view>
          <text class="sas-label">举报</text>
        </view>
      </view>

      <view class="sas-close-wrap">
        <view class="sas-close" @tap.stop="close">
          <text class="sas-close-x">×</text>
        </view>
      </view>

      <view class="sas-safe" />
    </view>
  </view>
</template>

<script>
import uniIcons from "@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue";

/**
 * 小院/动态详情底部「分享」面板（设计稿 rectangle 34626779）
 * 圆角顶 20px、主操作行 + 分割线 #E9E9E9 + 举报 + 底部关闭 57px
 */
export default {
  name: "ShareActionSheet",
  components: { uniIcons },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:visible", "select", "close"],
  data() {
    return {
      mainActions: [
        { key: "poster", label: "生成海报", icon: "images-filled", iconSize: 22, iconColor: "#ffffff" },
        { key: "link", label: "复制链接", icon: "link", iconSize: 22, iconColor: "#ffffff" },
        { key: "wechat", label: "微信", icon: "weixin", iconSize: 26, iconColor: "#07c160" },
        { key: "moments", label: "朋友圈", icon: "pyq", iconSize: 26, iconColor: "#576b95" },
      ],
    };
  },
  methods: {
    close() {
      this.$emit("update:visible", false);
      this.$emit("close");
    },
    onPick(key) {
      this.$emit("select", key);
      this.close();
    },
  },
};
</script>

<style lang="less" scoped>
.sas-root {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10040;
}

.sas-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
}

/* 375 × 371 设计，宽度占满屏 */
.sas-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 371px;
  padding-top: 23px;
  padding-left: 20px;
  padding-right: 20px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
}

.sas-title {
  display: block;
  font-size: 14px;
  font-weight: 400;
  line-height: 20.27px;
  color: rgba(153, 153, 153, 1);
  margin-bottom: 17px;
}

.sas-row {
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
}

.sas-row--main {
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 8px;
}

.sas-row--sub {
  justify-content: flex-start;
  align-items: flex-start;
  padding-top: 4px;
}

.sas-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  flex-shrink: 0;
}

.sas-row--main .sas-cell {
  flex: 1;
  width: 0;
  min-width: 0;
}

.sas-bubble {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.sas-bubble--poster {
  background: #ffeb3b;
}

.sas-bubble--link {
  background: #ff9800;
}

.sas-bubble--wechat {
  background: #ececec;
}

.sas-bubble--moments {
  background: #ececec;
}

.sas-bubble--report {
  background: #ff5252;
}

.sas-label {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 400;
  line-height: 17.38px;
  color: rgba(153, 153, 153, 1);
  text-align: center;
  white-space: nowrap;
}

.sas-row--main .sas-label {
  max-width: 72px;
  white-space: normal;
}

.sas-line {
  height: 1px;
  background: rgba(233, 233, 233, 1);
  margin: 16px -20px 12px;
}

.sas-close-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 36px;
  padding-bottom: 8px;
}

.sas-close {
  width: 57px;
  height: 57px;
  border-radius: 50%;
  background: rgba(245, 245, 245, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sas-close-x {
  font-size: 28px;
  font-weight: 300;
  color: #111;
  line-height: 1;
}

.sas-safe {
  height: calc(12px + env(safe-area-inset-bottom));
  min-height: 12px;
}
</style>
