<template>
  <view v-if="modelValue" class="aps-wrap">
    <view class="aps-mask" @tap="onMaskClose" @touchmove.stop.prevent="noop"></view>
    <view class="aps-sheet" @tap.stop>
      <view class="aps-sheet-inner">
        <view class="aps-head">
          <view class="aps-head-side"></view>
          <text class="aps-title">唯有以领养终止流浪</text>
          <view class="aps-close-hit" @tap="onMaskClose">
            <text class="aps-close-x">×</text>
          </view>
        </view>
        <text class="aps-sub">选择您想要领走的小咪</text>
        <scroll-view class="aps-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
          <view class="aps-grid">
            <view
              v-for="(c, i) in cats"
              :key="i"
              class="aps-cell"
              :class="{ 'aps-cell--disabled': c.disabled }"
            >
              <view
                v-if="!c.disabled"
                class="aps-av-hit"
                @tap.stop="openPetDetail(i)"
              >
                <view
                  class="aps-ring"
                  :class="{
                    'aps-ring--on': selectedIds.includes(i),
                    'aps-ring--off': !selectedIds.includes(i),
                  }"
                >
                  <image v-if="!figmaMode" class="aps-img" :src="c.avatar" mode="aspectFill" />
                </view>
              </view>
              <view v-else class="aps-av-hit" @tap.stop="onDisabledPetTap">
                <view class="aps-ring aps-ring--dim">
                  <image v-if="!figmaMode" class="aps-img" :src="c.avatar" mode="aspectFill" />
                </view>
              </view>
              <view class="aps-name-hit" @tap.stop="toggleSelect(i)">
                <text class="aps-name" :class="{ 'aps-name--dim': c.disabled }">{{ c.name }}</text>
              </view>
              <text class="aps-price">￥{{ c.price }}</text>
            </view>
          </view>
        </scroll-view>
        <text class="aps-balance">我的剩余领养额度：￥234</text>
        <view class="aps-footer">
          <button
            class="aps-btn"
            :disabled="selectedIds.length === 0"
            @tap="onConfirm"
          >
            我选好了
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { setAdoptionPick } from '@/utils/adoptionStorage.js'

const DEFAULT_IMG = '/static/home-feed-1.png'

export default {
  name: 'AdoptPickCatsSheet',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    yardName: {
      type: String,
      default: '我就是要喂猫',
    },
    yardId: {
      type: String,
      default: '1',
    },
    ownerAvatar: {
      type: String,
      default: '/static/avatar.png',
    },
    ownerPawId: {
      type: String,
      default: 'yard_card_owner',
    },
    /** 从领养申请页「+」进入：确认后仅写入缓存并交给上层关闭 */
    returnToApply: {
      type: Boolean,
      default: false,
    },
    figmaMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'close', 'confirmed'],
  data() {
    return {
      cats: [
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 20, disabled: false },
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 20, disabled: false },
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 15, disabled: true },
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 15, disabled: true },
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 15, disabled: true },
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 15, disabled: true },
        { name: '小灰灰', avatar: DEFAULT_IMG, price: 15, disabled: true },
      ],
      selectedIds: [0, 1],
    }
  },
  watch: {
    modelValue(v) {
      if (v) this.resetLocalState()
    },
  },
  methods: {
    noop() {},
    resetLocalState() {
      this.selectedIds = [0, 1]
      // 接入接口后可在此按 yardId 拉取猫咪列表替换 cats
    },
    close() {
      this.$emit('update:modelValue', false)
      this.$emit('close')
    },
    onMaskClose() {
      this.close()
    },
    openPetDetail(i) {
      const c = this.cats[i]
      if (!c || c.disabled) return
      const y = encodeURIComponent(this.yardName || '')
      uni.navigateTo({
        url: `/pages/adoption/petDetail?idx=${i}&yardName=${y}&yardId=${encodeURIComponent(this.yardId || '')}`,
      })
    },
    onDisabledPetTap() {
      uni.showToast({ title: '该猫咪暂不可选', icon: 'none' })
    },
    toggleSelect(i) {
      const c = this.cats[i]
      if (!c || c.disabled) return
      let next = [...this.selectedIds]
      const pos = next.indexOf(i)
      if (pos >= 0) next.splice(pos, 1)
      else {
        if (next.length >= 6) {
          uni.showToast({ title: '最多选择 6 只', icon: 'none' })
          return
        }
        next.push(i)
      }
      this.selectedIds = next
    },
    onConfirm() {
      if (this.selectedIds.length === 0) return
      const picked = [...this.selectedIds]
        .sort((a, b) => a - b)
        .map((i) => ({
          name: this.cats[i].name,
          avatar: this.cats[i].avatar,
        }))
      setAdoptionPick({
        pets: picked,
        yardName: this.yardName,
        ownerName: this.yardName,
        ownerAvatar: this.ownerAvatar,
        yardId: this.yardId,
        ownerPawId: this.ownerPawId,
      })
      this.$emit('confirmed')
      this.$emit('update:modelValue', false)
      if (this.returnToApply) return
      uni.navigateTo({ url: '/pages/adoption/adoptApply' })
    },
  },
}
</script>

<style lang="less" scoped>
.aps-wrap {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10060;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.aps-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
}

.aps-sheet {
  position: relative;
  max-height: 82vh;
  flex-shrink: 0;
}

.aps-sheet-inner {
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  max-height: 82vh;
}

.aps-head {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx 8rpx;
  flex-shrink: 0;
}

.aps-head-side {
  width: 64rpx;
  flex-shrink: 0;
}

.aps-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #111;
  line-height: 1.35;
}

.aps-close-hit {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aps-close-x {
  font-size: 48rpx;
  line-height: 1;
  color: #111;
  font-weight: 300;
}

.aps-sub {
  display: block;
  padding: 8rpx 40rpx 28rpx;
  font-size: 28rpx;
  color: #555;
  flex-shrink: 0;
}

.aps-scroll {
  flex: 1;
  min-height: 200rpx;
  max-height: 52vh;
  width: 100%;
}

.aps-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 32rpx 16rpx;
  box-sizing: border-box;
}

.aps-cell {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28rpx;
  box-sizing: border-box;
}

.aps-av-hit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.aps-ring {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  padding: 6rpx;
  box-sizing: border-box;
}

.aps-ring--on {
  border: 6rpx solid #ffdd00;
}

.aps-ring--off {
  border: 6rpx solid transparent;
}

.aps-ring--dim {
  border: 6rpx solid #f0f0f0;
  opacity: 0.45;
}

.aps-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #eee;
  display: block;
}

.aps-name-hit {
  margin-top: 12rpx;
  min-height: 36rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  padding: 0 4rpx;
}

.aps-name {
  font-size: 24rpx;
  color: #111;
  text-align: center;
}

.aps-name--dim {
  color: #999;
}

.aps-footer {
  flex-shrink: 0;
  padding: 16rpx 40rpx 0;
}

.aps-btn {
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  background: #ffdd00;
  color: #111;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.aps-btn[disabled] {
  opacity: 0.45;
}
.aps-sheet{max-height:none}.aps-sheet-inner{height:495px;max-height:none;padding-bottom:0}.aps-head{height:90px;box-sizing:border-box;align-items:flex-start;padding-top:7px}.aps-scroll{max-height:none}.aps-sub{padding:0 20px 20px}.aps-grid{padding:0 15px 8px}.aps-cell{width:16.666%;margin-bottom:26px}.aps-ring{width:44px;height:44px;padding:2px;background:#fff}.aps-ring--on,.aps-ring--off,.aps-ring--dim{border-width:3px}.aps-name-hit{margin-top:4px;min-height:16px}.aps-name,.aps-price{font-size:11px;line-height:16px}.aps-price{color:#999}.aps-balance{display:block;margin:0 0 12px;text-align:center;font-size:12px;color:#999}.aps-footer{padding:0 15px 43px}.aps-btn{height:44px;line-height:44px;border-radius:22px;font-size:14px}
</style>
