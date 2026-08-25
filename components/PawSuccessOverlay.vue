<template>
  <view v-if="visible" class="overlay">
    <view class="mask" />
    <view class="sheet" :class="[`sheet--${mode}`, { compact }]">
      <text class="close" @click="$emit('close')">×</text>
      <template v-if="mode === 'feeding'">
        <view class="feeding-title">
          <view class="mini-icon"><uni-icons type="checkmarkempty" color="#222" :size="11" /></view>
          <text>{{ title }}</text>
        </view>
        <text class="feeding-body">{{ body }}</text>
        <view class="feeding-actions">
          <text @click="$emit('action')">查看投喂订单</text>
        </view>
      </template>
      <template v-else>
        <view class="icon"><uni-icons type="checkmarkempty" color="#222" :size="34" /></view>
        <text class="title">{{ title }}</text>
        <text class="body">{{ body }}</text>
        <view v-if="mode === 'created'" class="created-benefits">
          <view class="benefit"><text class="benefit-title">进行组织基地认证</text><text class="benefit-desc">通过认证后将获得</text></view>
          <view class="benefit"><text class="benefit-title">获得更多曝光</text><text class="benefit-desc">标识</text></view>
        </view>
        <slot />
        <view class="action" @click="$emit('action')"><text>{{ buttonText }}</text></view>
      </template>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PawSuccessOverlay',
  props: {
    visible: Boolean,
    compact: Boolean,
    mode: { type: String, default: 'default' },
    title: String,
    body: String,
    buttonText: String,
  },
  emits: ['close', 'action'],
}
</script>

<style scoped>
.overlay{position:fixed;inset:0;z-index:1000}.mask{position:absolute;inset:0;background:#5b5b5b}.sheet{position:absolute;left:0;right:0;bottom:0;height:510px;padding:42px 28px 30px;background:#fff;border-radius:12px 12px 0 0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center}.sheet.compact{height:374px}.close{position:absolute;right:17px;top:13px;font-size:18px;color:#222;z-index:2}.icon{width:60px;height:60px;border-radius:50%;background:#ffe600;display:flex;align-items:center;justify-content:center}.title{margin-top:14px;font-size:15px;font-weight:600;color:#222}.body{margin-top:46px;font-size:12px;line-height:18px;color:#666;text-align:center;white-space:pre-line}.action{position:absolute;left:50%;bottom:74px;transform:translateX(-50%);width:208px;height:42px;border-radius:21px;background:#ffe600;display:flex;align-items:center;justify-content:center}.action text{font-size:12px;font-weight:600;color:#222}
.sheet--created{padding-top:42px}.sheet--created .body{margin-top:32px}.created-benefits{position:absolute;left:0;right:0;bottom:104px;display:flex;justify-content:center;gap:18px}.benefit{display:flex;flex-direction:column;align-items:center}.benefit-title{font-size:14px;font-weight:600;color:#333}.benefit-desc{margin-top:12px;font-size:11px;color:#777}.sheet--created .action{bottom:38px}
.sheet--feeding{height:374px;padding:39px 28px 0}.feeding-title{display:flex;align-items:center;gap:5px}.mini-icon{width:18px;height:18px;border-radius:50%;background:#ffe600;display:flex;align-items:center;justify-content:center}.feeding-title>text{font-size:16px;font-weight:600;color:#222}.feeding-body{margin-top:47px;font-size:14px;line-height:18px;color:#666;text-align:center;white-space:pre-line}.feeding-actions{position:absolute;left:0;right:0;bottom:0;height:43px;border-top:1px solid #ffe600;display:flex;align-items:center;justify-content:center}.feeding-actions text{font-size:13px;font-weight:600;color:#222}
</style>
