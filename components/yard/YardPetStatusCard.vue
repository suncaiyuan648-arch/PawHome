<template>
  <view class="psc" :class="'psc--' + status">
    <view class="psc__pill">
      <text class="psc__pill-txt">{{ label }}</text>
    </view>
    <scroll-view
      class="psc__scroll"
      scroll-x
      :show-scrollbar="false"
      :enable-flex="true"
    >
      <view class="psc__row">
        <!-- 小程序横向 scroll-view 内点击易被吃掉；用 navigator 走原生跳转 -->
        <navigator
          v-for="p in pets"
          :key="p.id"
          class="psc__pet-nav"
          :url="petDetailUrl(p)"
          hover-class="none"
        >
          <view class="psc__pet">
            <image class="psc__avatar" :src="safeImgSrc(p.avatar)" mode="aspectFill" />
            <text class="psc__name">{{ p.name }}</text>
            <text v-if="p.breed" class="psc__breed">{{ p.breed }}</text>
          </view>
        </navigator>
      </view>
    </scroll-view>
    <text class="psc__count">{{ countDisplay }}只</text>
  </view>
</template>

<script>
import { safeImgSrc } from "@/utils/safeImgSrc.js";

/** 小院宠物按状态分组卡片：顶部分类胶囊 + 横向宠物列 + 右下角「n只」 */
export default {
  name: "YardPetStatusCard",
  props: {
    /** pending | adopted | missing | dead — 控制胶囊色与「死亡」弱化 */
    status: {
      type: String,
      default: "pending",
    },
    label: {
      type: String,
      default: "",
    },
    pets: {
      type: Array,
      default: () => [],
    },
    /** 右下角「n只」；不传则取 pets.length */
    total: {
      type: Number,
      default: undefined,
    },
    yardName: {
      type: String,
      default: "",
    },
  },
  computed: {
    countDisplay() {
      if (typeof this.total === "number" && !Number.isNaN(this.total)) {
        return this.total;
      }
      return this.pets.length;
    },
  },
  methods: {
    safeImgSrc,
    petDetailUrl(p) {
      const id = encodeURIComponent((p && p.id) || "");
      const y = encodeURIComponent(this.yardName || "");
      return `/pages/adoption/petDetail?petId=${id}&yardName=${y}`;
    },
  },
};
</script>

<style lang="less" scoped>
/* 设计稿 rectangle 275：白底圆角 16、宽约屏宽-24；宠物 48、名称 14/#333、品种 11/#FFA253 */
.psc {
  position: relative;
  margin: 0 12px 16px;
  padding: 22px 12px 16px;
  min-height: 140px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 16px;
}

.psc__pill {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 12px;
  border-radius: 11px;
  box-sizing: border-box;
}

.psc__pill-txt {
  font-size: 15px;
  font-weight: 500;
  line-height: 22.5px;
  color: rgba(51, 51, 51, 1);
}

.psc--pending .psc__pill {
  background: rgba(255, 236, 100, 1);
}

.psc--adopted .psc__pill {
  background: rgba(220, 245, 224, 1);
}

.psc--missing .psc__pill {
  background: rgba(224, 224, 224, 1);
}

.psc--dead .psc__pill {
  background: rgba(245, 245, 245, 1);
}

.psc--dead .psc__pill-txt {
  color: rgba(190, 190, 190, 1);
}

.psc__scroll {
  width: 100%;
  margin-top: 4px;
}

.psc__row {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  padding: 0 9px 8px 9px;
  box-sizing: border-box;
}

.psc__pet-nav {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 49px;
}

.psc__pet {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.psc__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eeeeee;
  flex-shrink: 0;
}

.psc__name {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20.27px;
  color: rgba(51, 51, 51, 1);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.psc__breed {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  color: rgba(255, 162, 83, 1);
  text-align: center;
}

.psc__count {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20.27px;
  color: rgba(153, 153, 153, 1);
}

.psc--dead .psc__avatar,
.psc--dead .psc__name,
.psc--dead .psc__breed {
  opacity: 0.5;
}
</style>
