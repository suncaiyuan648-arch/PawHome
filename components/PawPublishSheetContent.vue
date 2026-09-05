<template>
  <view id="qa-publish-sheet" class="publish-sheet-body" data-qa="publish-sheet">
    <text class="publish-sheet-title">发布动态</text>

    <view class="publish-action publish-action--primary" @tap="$emit('post')">
      <view class="publish-action-title-row">
        <text class="publish-action-title">发动态</text>
        <image class="publish-action-arrow" src="/static/figma/publish/chevron-right-dark.svg" mode="aspectFit" />
      </view>
      <text class="publish-action-desc">院主院主，快来更新小院的动态吧</text>
    </view>

    <view class="publish-option-row">
      <view class="publish-option-column" @tap="$emit('create-yard')">
        <text class="publish-option-label">创建小院</text>
        <view class="publish-option publish-option--cat">
          <view class="publish-option-title-row">
            <text>流浪动物小院</text>
            <image class="publish-option-arrow" src="/static/figma/publish/chevron-right-dark.svg" mode="aspectFit" />
          </view>
          <text>为小毛娃攒粮</text>
        </view>
      </view>

      <view class="publish-option-column" data-qa="qa-publish-create-help" @tap="$emit('create-help')">
        <text class="publish-option-label">发起求助</text>
        <view class="publish-option publish-option--help">
          <view class="publish-option-title-row">
            <text>流浪动物救助</text>
            <image class="publish-option-arrow" src="/static/figma/publish/chevron-right-light.svg" mode="aspectFit" />
          </view>
          <text>为小毛娃救治绝育</text>
        </view>
      </view>
    </view>

    <view id="qa-publish-sheet-close" class="publish-sheet-close" data-qa="publish-sheet-close" @tap="$emit('close')">
      <PawIcon name="navigation/close" :size="12" label="关闭发布菜单" />
    </view>
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawPublishSheetContent',
  components: { PawIcon },
  emits: ['post', 'create-yard', 'create-help', 'close']
}
</script>

<style scoped>
.publish-sheet-body {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 124px 17px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.publish-sheet-title {
  display: block;
  flex: 0 0 30px;
  margin-left: 13px;
  color: #202221;
  font-size: 20px;
  font-weight: 700;
  line-height: 30px;
}

.publish-action {
  box-sizing: border-box;
  border-radius: 18px;
}

.publish-action--primary {
  height: 103px;
  flex: 0 0 103px;
  margin-top: 14px;
  padding: 30px 13px 0;
  background: #ffe60f;
}

.publish-action-title-row,
.publish-option-title-row {
  display: flex;
  align-items: center;
}

.publish-action-title-row {
  gap: 6px;
  height: 20px;
}

.publish-action-title {
  color: #202221;
  font-size: 23px;
  font-weight: 700;
  line-height: 20px;
}

.publish-action-arrow,
.publish-option-arrow {
  display: block;
  flex: 0 0 auto;
  width: 6px;
  height: 11px;
  transform: rotate(180deg) scaleY(-1);
}

.publish-action-desc {
  display: block;
  margin-top: 7px;
  color: #202221;
  font-size: 12px;
  line-height: 16px;
}

.publish-option-row {
  display: flex;
  gap: 11px;
  margin-top: 31px;
}

.publish-option-column {
  min-width: 0;
  flex: 1 1 0;
}

.publish-option-label {
  display: block;
  margin: 0 0 18px 13px;
  color: #202221;
  font-size: 20px;
  font-weight: 700;
  line-height: 25px;
}

.publish-option {
  height: 75px;
  padding: 17px 13px;
  box-sizing: border-box;
  border-radius: 18px;
}

.publish-option--cat {
  background: #defa93;
}

.publish-option--help {
  background: #ff3d3d;
}

.publish-option-title-row {
  gap: 6px;
  height: 20px;
}

.publish-option-title-row text {
  min-width: 0;
  color: #202221;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  white-space: nowrap;
}

.publish-option>text:last-child {
  display: block;
  margin-top: 2px;
  color: #333;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
}

.publish-option--help .publish-option-title-row text,
.publish-option--help>text:last-child {
  color: #fff;
}

.publish-sheet-close {
  width: 57px;
  height: 57px;
  margin: 40px auto 0;
  border-radius: 50%;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
