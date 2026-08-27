<template>
  <view class="css-scroll-container">
    <view
      class="scroll-content"
      :style="{
        transform: `translateY(${translateY}px)`,
        transition: enableTransition ? 'transform var(--paw-motion-ticker, 350ms) var(--paw-ease-standard, ease)' : 'none'
      }"
    >
      <view
        v-for="(item, index) in renderList"
        :key="'ss-' + index + '-' + (item.text || '') + '-' + (item.rankTitle || '')"
        class="scroll-item"
        hover-class="scroll-item--tap"
        @tap.stop="onUserTap(item)"
      >
        <view class="info">
          <view class="info-avatarlog">
            <image class="avatar" :src="resolveAvatar(item)" mode="aspectFill"></image>
          </view>
          <view class="info-name">
            <text>{{ item.text }}</text>
            <LevelCapsule :level="item.level != null ? item.level : 1" />
          </view>
        </view>
        <view class="ranking">
          <text>{{ item.rankTitle != null ? item.rankTitle : rankTitle }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { safeImgSrc } from "@/utils/safeImgSrc.js";
import LevelCapsule from "@/components/LevelCapsule.vue";

export default {
  name: "SeamlessScroll",
  components: { LevelCapsule },
  props: {
    /** 项可为 { text, level?, avatar?, rankTitle?, pawId? }；数据由页面传入。 */
    items: {
      type: Array,
      default: () => [],
    },
    avatarFallback: {
      type: String,
      default: "/static/avatarlog.png",
    },
    rankTitle: {
      type: String,
      default: "小院投喂第一名",
    },
  },
  data() {
    return {
      currentIndex: 0,
      rowHeight: 40,
      translateY: 0,
      enableTransition: true,
      intervalTimer: null,
    };
  },
  computed: {
    scrollList() {
      return this.items.map((x, i) => typeof x === "string" ? { text: x, id: i } : { id: i, ...x });
    },
    renderList() {
      if (!this.scrollList.length) return [];
      return [...this.scrollList, this.scrollList[0]];
    },
  },
  watch: {
    scrollList: {
      deep: true,
      handler() {
        this.currentIndex = 0;
        this.translateY = 0;
        this.enableTransition = false;
        this.$nextTick(() => {
          this.startAutoScroll();
        });
      },
    },
  },
  mounted() {
    this.startAutoScroll();
  },
  beforeDestroy() {
    this.stopAutoScroll();
  },
  methods: {
    resolveAvatar(item) {
      return safeImgSrc(item && item.avatar, safeImgSrc(this.avatarFallback));
    },
    onUserTap(item) {
      if (!item) return;
      this.$emit("user-click", item);
    },
    startAutoScroll() {
      this.stopAutoScroll();
      if (this.scrollList.length <= 1) return;
      this.intervalTimer = setInterval(() => {
        if (this.scrollList.length <= 1) return;
        this.currentIndex += 1;
        this.enableTransition = true;
        this.translateY = -this.currentIndex * this.rowHeight;
        if (this.currentIndex >= this.scrollList.length) {
          setTimeout(() => {
            this.enableTransition = false;
            this.currentIndex = 0;
            this.translateY = 0;
          }, 380);
        }
      }, 2000);
    },
    stopAutoScroll() {
      if (this.intervalTimer) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.css-scroll-container {
  height: 40px;
  overflow: hidden;
  position: relative;
  padding: 0 10px;
}
.info {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .info-avatarlog {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    margin-right: 5px;
    .avatar {
      width: 30px;
      height: 30px;
    }
  }
  .info-name {
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0px;
    line-height: 20px;
    display: flex;
    align-items: center;
  }
}
.ranking {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0px;
  line-height: 20px;
  color: rgba(251, 200, 0, 1);
  vertical-align: top;
}
.scroll-content { will-change: transform; }

.scroll-item {
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.scroll-item--tap {
  opacity: 0.92;
}
</style>
