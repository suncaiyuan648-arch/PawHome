<template><PawFlowResult v-bind="config" @back="goBack" @action="onAction"/></template>
<script>
import PawFlowResult from '@/components/PawFlowResult.vue'
const configs={
'80':{title:'领取成功',body:'感谢您收养这个流浪的流浪孩子，\n继续在平台分享这人诉什么美食的\n出手的，只能为它脚踩一点温暖，\n希望它能在未来的数万天十数年\n陪伴您的每一次开心与难过',buttonText:'查看订单'},
'81':{title:'已同意领养申请',body:'没被过家的味道\n没被过家\n有你陪伴\n让我们一起\n做最爱是什么样',buttonText:'好的'},
'82':{title:'已确认领养',body:'恭喜您成功帮助小咪找到新\n家，小咪及小院的小院前往\n新家啦！',buttonText:'查看详情'},
'83':{title:'已驳回',body:'驳回后等待信息申请人不再\n可见',buttonText:'查看详情',failed:true},
'84':{title:'太棒了',body:'等待院主和领养者核实确认领养的领\n养方信息将有机会被流浪猫的一份\n猫粮礼物！领取小咪找到新家！',buttonText:'查看领养进度'},
'85':{title:'申请成功',body:'您的领养申请以及这份善意，为防\n止不正当领养及恶意群体恶意领\n养，院主会查看您的历史领养和投\n喂记录以及喂养记录来决定是否同\n意。通过后平台将通知您，请注意\n系统消息及小院消息，如果申请要\n帮，请立即举报！',buttonText:'查看领养进度'}}
export default{components:{PawFlowResult},data(){return{variant:'80'}},computed:{config(){return configs[this.variant]||configs['80']}},onLoad(o={}){this.variant=String(o.variant||'80')},methods:{goBack(){uni.navigateBack()},onAction(){uni.navigateBack()}}}
</script>
