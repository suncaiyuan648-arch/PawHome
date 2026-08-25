<template>
  <view class="proof-page">
    <view class="proof-top">
      <view class="proof-status"><text>9:18</text><view><uni-icons type="bars" color="#111" :size="14"/><uni-icons type="circle-filled" color="#111" :size="10"/></view></view>
      <view class="proof-nav"><image src="/static/nav-back-arrow.png" mode="aspectFit" @click="goBack"/><view class="proof-menu"><uni-icons type="more-filled" color="#333" :size="18"/><view/><uni-icons type="circle-filled" color="#111" :size="14"/></view></view>
    </view>
    <view class="proof-body">
      <text class="section-title">基本信息</text>
      <view class="form-card two-rows">
        <label><text>您的姓名<em>*</em></text><input v-model="name" placeholder="请填写您的真实姓名"/></label>
        <label><text>与申请人关系<em>*</em></text><input v-model="relation" placeholder="请填写您的真实姓名"/></label>
      </view>
      <view class="form-card text-card"><textarea v-model="note" maxlength="200" placeholder="申请人是您的...您了解的情况是..."/><text>{{ note.length }}/200</text></view>
      <text class="section-title real-title">实名认证</text>
      <text class="real-hint">身份证信息仅用于实名认证，严格保密不会展示给其他人</text>
      <view class="form-card id-card"><label><text>身份证号<em>*</em></text><input v-model="idNo" placeholder="请填写您的身份证号"/></label></view>
      <view class="notice"><uni-icons type="info" color="#999" :size="13"/><text>感谢您的热心参与，如果您深入了解过此申请人和动物的事件，请您如实填写真实身份、真实情况，这将为受助人赢得更多信任。同时提醒您，您需要对证实内容的真实性负责，如有不实，需承担相应法律责任。</text></view>
    </view>
    <view class="proof-footer">
      <view class="agreement"><uni-icons type="checkbox-filled" color="#ffe000" :size="14"/><text>已经阅读《<b>隐私政策</b>》、《<b>用户协议</b>》和《<b>证明人承诺</b>》</text></view>
      <view class="submit" @click="submit">提交</view>
    </view>
  </view>
</template>

<script>
export default { name:'PawAdoptionProofForm', data(){return{name:'',relation:'',note:'',idNo:''}}, methods:{goBack(){uni.navigateBack()},submit(){uni.showToast({title:'已提交',icon:'none'})}} }
</script>

<style scoped>
.proof-page{min-height:100vh;background:#f3f3f3;color:#333;display:flex;flex-direction:column}.proof-top{height:103px;background:linear-gradient(#fffdea,#fff)}.proof-status{height:39px;padding:12px 17px 0 28px;box-sizing:border-box;display:flex;justify-content:space-between;font-size:15px;font-weight:600;color:#111}.proof-status>view{display:flex;gap:6px}.proof-nav{height:64px;position:relative;display:flex;align-items:center}.proof-nav>image{margin-left:14px;width:10px;height:18px}.proof-menu{position:absolute;right:8px;width:78px;height:30px;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;gap:7px}.proof-menu>view{width:1px;height:18px;background:#eee}.proof-body{padding:8px 12px 110px;flex:1}.section-title{display:block;margin:0 2px 14px;font-size:15px;font-weight:600}.form-card{background:#fff;border-radius:10px}.two-rows label,.id-card label{height:64px;padding:0 12px;display:flex;align-items:center;box-sizing:border-box}.two-rows label:first-child{border-bottom:1px solid #f1f1f1}.form-card label>text{width:150px;font-size:13px}.form-card em{font-style:normal;color:#ff3449}.form-card input{flex:1;text-align:right;font-size:13px;color:#333}.text-card{height:163px;margin-top:10px;position:relative}.text-card textarea{width:100%;height:100%;padding:12px;box-sizing:border-box;font-size:15px}.text-card>text{position:absolute;right:10px;bottom:10px;font-size:12px;color:#aaa}.real-title{margin-top:18px;margin-bottom:4px}.real-hint{display:block;margin:0 2px 12px;font-size:12px;color:#ff7b2f}.id-card{height:67px}.notice{display:flex;gap:6px;margin-top:10px;color:#999}.notice>text{font-size:11px;line-height:13px}.proof-footer{position:fixed;left:0;right:0;bottom:0;height:110px;padding:8px 12px 11px;background:#fff;box-sizing:border-box}.agreement{display:flex;align-items:center;margin:0 9px 8px}.agreement>text{font-size:11px;color:#666}.agreement b{font-weight:400;color:#3978db}.submit{height:43px;border-radius:22px;background:#ffe000;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600}
</style>
