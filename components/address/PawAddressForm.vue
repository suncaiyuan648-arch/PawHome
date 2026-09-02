<template>
  <view class="address-form-page" :class="['address-form-page--' + kind, { 'address-form-page--embedded': embedded }]">
    <!-- #ifndef MP-WEIXIN -->
    <image v-if="kind === 'service'" class="service-address-top-reference" src="/static/figma/service-address-top.png"
      mode="scaleToFill" />
    <image v-else class="service-address-top-reference" src="/static/figma/shipping-address-top.png"
      mode="scaleToFill" />
    <!-- #endif -->
    <PawPageNav v-if="!embedded" :title="`${initialAddress && initialAddress.id ? '修改' : '添加'}${kindLabel}地址`"
      :title-centered="true" background="#f5f5f5" fallback-url="/pages/meMore/shippingAddress" />

    <scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
      <view class="body">
        <view v-if="kind === 'shipping'" class="smart-card">
          <textarea v-model="smartText" class="smart-input" data-qa="address-smart-input" maxlength="180"
            placeholder="复制地址到此处，智能识别" placeholder-class="placeholder" />
          <view class="smart-action" data-qa="address-smart-recognize" @click="recognize"><text>粘贴并识别</text></view>
        </view>

        <view class="form-card">
          <view class="form-head">
            <text class="form-title">地址信息</text>
            <view v-if="kind === 'shipping'" class="import-actions">
              <view class="import-chip" :class="{ 'import-chip--selected': importSource === 'service' }"
                data-qa="address-import-service" @click="importService"><text>从服务地址导入</text></view>
              <view class="import-chip" :class="{ 'import-chip--selected': importSource === 'wechat' }"
                data-qa="address-import-wechat" @click="importWechat"><text>从微信地址导入</text></view>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">联系人<text class="required">*</text></text>
            <view class="field" :class="{ focused: focusKey === 'name' || typing }">
              <input v-model="form.name" class="input" data-qa="address-name" placeholder="你的名字"
                placeholder-class="placeholder" @focus="focusKey = 'name'" @blur="focusKey = ''" />
              <text v-if="form.name" class="clear" @click="form.name = ''">×</text>
            </view>
          </view>
          <view class="form-row">
            <text class="form-label">手机号<text class="required">*</text></text>
            <view class="field" :class="{ focused: focusKey === 'phone' }">
              <text v-if="typing" class="phone-demo">1336666999<br />9</text>
              <input v-else v-model="form.phone" class="input" data-qa="address-phone" type="number" placeholder="你的手机号"
                placeholder-class="placeholder" @focus="focusKey = 'phone'" @blur="focusKey = ''" />
              <text v-if="form.phone" class="clear" @click="form.phone = ''">×</text>
            </view>
          </view>
          <view class="form-row">
            <text class="form-label">所在地区<text class="required">*</text></text>
            <view class="field field--tap" data-qa="address-region" @click="openRegionPicker">
              <text class="field-text" :class="{ placeholder: !regionText }">{{ regionText || '省、市、区' }}</text>
              <image class="chevron" src="/static/me/link-chevron.png" mode="aspectFit" />
            </view>
          </view>
          <view class="form-row form-row--detail">
            <text class="form-label form-label--top">详细地址<text class="required">*</text></text>
            <view class="field field--detail"
              :class="{ focused: focusKey === 'detail' || (typing && kind === 'service') }">
              <textarea v-model="form.detail" class="detail-input" data-qa="address-detail" maxlength="120"
                placeholder="小区、楼栋单元、门牌号" placeholder-class="placeholder" @focus="focusKey = 'detail'"
                @blur="focusKey = ''" />
              <text v-if="form.detail" class="clear clear--detail" @click="form.detail = ''">×</text>
              <view v-if="kind === 'shipping'" class="locate" @click="openLocation"><uni-icons type="location"
                  color="#666" :size="18" /><text>定位</text></view>
            </view>
          </view>
        </view>

        <view class="ops-row">
          <view class="default-action" data-qa="address-default-toggle" @click="isDefault = !isDefault">
            <view class="radio" :class="{ selected: isDefault }"><text v-if="isDefault">✓</text></view>
            <text>默认{{ kindLabel }}地址</text>
          </view>
          <text class="side-action" @click="kind === 'shipping' ? clearAll() : removeAddress()">{{ kind === 'shipping' ?
            (typing ? '删除' : '清空') : '删除' }}</text>
        </view>
      </view>
    </scroll-view>
    <view class="footer">
      <view class="save" data-qa="address-save" @click="save"><text>保存</text></view>
    </view>
    <PawLocationPickerSheet :visible="showLocationPicker" :city="locationPickerCity"
      @update:visible="onLocationPickerVisibleChange" @select="onLocationPicked" @city-tap="openLocationCityPicker" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawLocationPickerSheet from '@/components/location/PawLocationPickerSheet.vue'
import { recognizeAddress } from '@/utils/addressService.js'
export default {
  name: 'PawAddressForm',
  components: { PawPageNav, PawLocationPickerSheet },
  props: {
    kind: { type: String, default: 'shipping' },
    typing: { type: Boolean, default: false },
    initialAddress: { type: Object, default: () => ({}) },
    embedded: { type: Boolean, default: false }
  },
  emits: ['save'],
  data() {
    return {
      focusKey: '', smartText: '', isDefault: false, importSource: '', regionParts: [],
      form: { name: '', phone: '', detail: '' }, showLocationPicker: false, locationPickerCity: '长沙市'
    }
  },
  computed: { kindLabel() { return this.kind === 'service' ? '服务' : '收货' }, regionText() { return this.regionParts.join(' ') } },
  created() {
    if (Object.keys(this.initialAddress || {}).length) this.applyAddress(this.initialAddress)
    else if (this.typing) this.fillDemo()
  },
  watch: { typing(v) { if (v) this.fillDemo() }, initialAddress: { deep: true, handler(v) { if (v && Object.keys(v).length) this.applyAddress(v) } } },
  methods: {
    applyAddress(address = {}) {
      this.form = { name: String(address.name || ''), phone: String(address.phone || ''), detail: String(address.detail || '') }
      this.regionParts = Array.isArray(address.regionParts) ? address.regionParts.filter(Boolean).slice(0, 4) : []
      this.isDefault = address.isDefault === true
      this.importSource = ''
    },
    fillDemo(source = '') {
      this.form = { name: '菠萝吹雪', phone: '13366669999', detail: this.kind === 'service' ? '鼎丰前程' : '找到一个大树根，绕着大树左转三圈右转三圈' }
      this.regionParts = ['湖南省', '长沙市', '雨花区']
      this.isDefault = true
      this.importSource = source
      this.smartText = '湖南省长沙市雨花区中意一路167号，菠萝吹雪，13366669999'
    },
    async readClipboard() { return new Promise(resolve => { if (typeof uni === 'undefined' || typeof uni.getClipboardData !== 'function') return resolve(''); uni.getClipboardData({ success: res => resolve((res && res.data) || ''), fail: () => resolve('') }) }) },
    async recognize() { let text = (this.smartText || '').trim(); if (!text) text = (await this.readClipboard()).trim(); if (!text) return uni.showToast({ title: '请先粘贴地址', icon: 'none' }); this.smartText = text; const result = await recognizeAddress(text); this.form.name = result.name || this.form.name; this.form.phone = result.phone || this.form.phone; this.regionParts = result.regionParts || this.regionParts; this.form.detail = result.detail || this.form.detail; if (!result.name && !result.phone && !result.regionParts.length && !result.detail) uni.showToast({ title: '未识别到地址信息', icon: 'none' }) },
    importService() { this.fillDemo('service') }, importWechat() { this.fillDemo('wechat') },
    openRegionPicker() { uni.navigateTo({ url: '/pages/meMore/regionSelector?mode=address', events: { regionSelected: ({ parts = [] } = {}) => { this.regionParts = parts.filter(Boolean) } }, success: res => res.eventChannel.emit('initRegion', { parts: this.regionParts }) }) },
    openLocation() { this.locationPickerCity = this.regionParts[1] || this.regionParts[0] || uni.getStorageSync('selectedCity') || '长沙市'; this.showLocationPicker = true },
    onLocationPickerVisibleChange(value) { this.showLocationPicker = value },
    onLocationPicked(item) { const detail = [item && item.name, item && item.address].filter(Boolean).join(' ').trim(); if (detail) this.form.detail = detail },
    openLocationCityPicker() { uni.navigateTo({ url: '/pages/citySelect/index?current=' + encodeURIComponent(this.locationPickerCity), events: { citySelected: ({ city = '' } = {}) => { if (city.trim()) this.locationPickerCity = city.trim() } } }) },
    clearAll() { this.form = { name: '', phone: '', detail: '' }; this.regionParts = []; this.smartText = ''; this.isDefault = false; this.importSource = '' },
    removeAddress() { uni.showToast({ title: '已删除', icon: 'none' }) },
    save() { if (!this.form.name || !this.form.phone || this.regionParts.length < 3 || !this.form.detail) return uni.showToast({ title: '请完善地址信息', icon: 'none' }); this.$emit('save', { name: this.form.name.trim(), phone: this.form.phone.trim(), regionParts: this.regionParts.filter(Boolean).slice(0, 4), detail: this.form.detail.trim(), isDefault: this.isDefault }) }
  }
}
</script>

<style scoped>
.address-form-page {
  position: relative;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  color: #222
}

.service-address-top-reference {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100px;
  z-index: 20;
  pointer-events: none
}

.nav-wrap {
  flex: none
}

.nav-row {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px
}

.nav-side {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center
}

.nav-left {
  z-index: 1
}

.nav-back {
  width: 10px;
  height: 18px
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 17px;
  font-weight: 500
}

.main-scroll {
  flex: 1;
  height: 0
}

.body {
  padding: 8px 15px 104px
}

.smart-card,
.form-card {
  background: #fff;
  border-radius: 10px;
  box-sizing: border-box
}

.smart-card {
  height: 136px;
  padding: 14px 14px 12px;
  margin-bottom: 10px
}

.smart-input {
  width: 100%;
  height: 76px;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 18px
}

.smart-action {
  width: 78px;
  height: 28px;
  margin-left: auto;
  border-radius: 14px;
  background: #ffe600;
  display: flex;
  align-items: center;
  justify-content: center
}

.smart-action text {
  font-size: 11px
}

.form-card {
  padding: 12px 12px 16px
}

.form-head {
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: space-between
}

.form-title {
  font-size: 15px;
  font-weight: 500
}

.import-actions {
  display: flex;
  gap: 5px
}

.import-chip {
  height: 25px;
  padding: 0 13px;
  border: 1px solid #eee;
  border-radius: 13px;
  display: flex;
  align-items: center
}

.import-chip text {
  font-size: 10px;
  color: #777
}

.form-row {
  display: flex;
  align-items: center;
  margin-top: 8px
}

.form-row--detail {
  align-items: flex-start
}

.form-label {
  width: 79px;
  flex: none;
  font-size: 13px;
  line-height: 39px
}

.form-label--top {
  padding-top: 4px
}

.required {
  margin-left: 2px;
  color: #ff5b57
}

.field {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 39px;
  padding: 0 12px;
  border: 1px solid #ededed;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  box-sizing: border-box
}

.field.focused {
  border-color: #f4d600
}

.input {
  width: 100%;
  font-size: 13px;
  color: #333
}

.phone-demo {
  font-size: 13px;
  line-height: 14px;
  color: #333
}

.field--tap {
  justify-content: space-between
}

.field-text {
  max-width: 190px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis
}

.chevron {
  width: 11px;
  height: 11px;
  opacity: .5
}

.field--detail {
  height: 82px;
  align-items: flex-start;
  padding-top: 9px;
  padding-right: 40px
}

.detail-input {
  width: 100%;
  height: 60px;
  font-size: 13px;
  line-height: 18px
}

.placeholder {
  color: #c4c4c4;
  font-size: 13px
}

.clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #eee;
  color: #888;
  text-align: center;
  line-height: 17px;
  font-size: 12px
}

.clear--detail {
  right: 8px;
  top: 18px
}

.locate {
  position: absolute;
  right: 5px;
  bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #555
}

.locate text {
  font-size: 9px
}

.ops-row {
  height: 42px;
  padding: 0 7px;
  display: flex;
  align-items: center;
  justify-content: space-between
}

.default-action {
  display: flex;
  align-items: center;
  gap: 5px
}

.default-action>text,
.side-action {
  font-size: 12px;
  color: #777
}

.side-action {
  color: #ff7800
}

.radio {
  width: 14px;
  height: 14px;
  border: 1px solid #d2d2d2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box
}

.radio.selected {
  background: #ffe600;
  border-color: #ffe600
}

.radio text {
  font-size: 10px
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 15px calc(8px + env(safe-area-inset-bottom));
  background: #f5f5f5
}

.save {
  height: 44px;
  border-radius: 22px;
  background: #ffe600;
  display: flex;
  align-items: center;
  justify-content: center
}

.save text {
  font-size: 14px;
  font-weight: 500
}

.smart-card {
  height: 116px
}

.smart-input {
  height: 56px
}

.form-card {
  min-height: 347px
}

.footer {
  padding-bottom: calc(35px + env(safe-area-inset-bottom))
}

.body {
  padding-top: 11px
}

.smart-card {
  margin-bottom: 16px
}

.footer {
  bottom: 0;
  height: 115px;
  padding: 8px 15px 0;
  box-sizing: border-box
}

.address-form-page--service .footer {
  bottom: 0
}

.address-form-page--embedded {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  background: #f5f5f5;
}

.address-form-page--embedded .main-scroll {
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
}

.address-form-page--embedded .body {
  padding: 12px 15px 16px;
}

.address-form-page--embedded .footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 115px;
}

.import-chip--selected {
  border-color: #ffe600;
  background: #fff8cc;
}

.import-chip--selected text {
  color: #6d5a00;
}
</style>
