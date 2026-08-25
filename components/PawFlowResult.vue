<template><view class="result-page"><view class="nav" :style="{paddingTop:statusBarHeight+'px'}"><view class="nav-row"><view class="back" @click="$emit('back')"><image src="/static/nav-back-arrow.png" mode="aspectFit"/></view><view class="cap"/></view></view><view class="content"><view class="icon"><uni-icons :type="failed?'closeempty':'checkmarkempty'" color="#222" :size="34"/></view><text class="title">{{title}}</text><text class="body">{{body}}</text></view><view class="footer"><view class="button" @click="$emit('action')"><text>{{buttonText}}</text></view></view></view></template>
<script>
export default{name:'PawFlowResult',props:{title:String,body:String,buttonText:String,failed:Boolean},emits:['back','action'],data(){return{statusBarHeight:20}},created(){const s=uni.getSystemInfoSync();this.statusBarHeight=s.statusBarHeight||20
// #ifdef H5
this.statusBarHeight=44
// #endif
}}
</script>
<style scoped>
.result-page{height:100vh;background:#fff;display:flex;flex-direction:column}.nav{flex:none}.nav-row{height:44px;display:flex;align-items:center;justify-content:space-between}.back{width:44px;height:44px;display:flex;align-items:center;justify-content:center}.back image{width:10px;height:18px}.cap{width:87px}.content{flex:1;display:flex;flex-direction:column;align-items:center;padding:38px 34px 0;box-sizing:border-box}.icon{width:60px;height:60px;border-radius:50%;background:#ffe600;display:flex;align-items:center;justify-content:center}.icon text{font-size:34px;line-height:1;color:#222}.title{margin-top:14px;font-size:16px;font-weight:600;color:#111;line-height:22px}.body{width:100%;margin-top:63px;font-size:14px;line-height:20px;color:#666;text-align:center;white-space:pre-line}.footer{padding-bottom:calc(171px + env(safe-area-inset-bottom));display:flex;justify-content:center}.button{width:208px;height:42px;border-radius:21px;background:#ffe600;display:flex;align-items:center;justify-content:center}.button text{font-size:14px;font-weight:600;color:#222}
</style>
