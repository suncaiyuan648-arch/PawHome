<template>
  <view class="roster-page" :class="'roster-page--' + variant">
    <view class="roster-nav">
      <view class="back" @click="$emit('back')"><image src="/static/nav-back-arrow.png" mode="aspectFit" /></view>
      <text class="title">{{ variant === 'mine' ? '我的云养' : '小院成员' }}</text>
      <view class="search"><uni-icons type="search" color="#c5c5c5" :size="14" /><text>搜索宠物名字/品种等</text><view>搜一搜</view></view>
    </view>
    <view class="tabs"><text class="active">全部(23)</text><text>猫咪(22)</text><text>狗狗(1)</text><view class="sort">智能排序⌄</view><uni-icons type="list" color="#333" :size="20" /></view>
    <view v-if="variant === 'status'" class="status-groups">
      <view v-for="group in statusGroups" :key="group.name" class="status-card">
        <view class="status-labels"><text v-for="label in group.labels" :key="label">{{ label }}</text></view>
        <view class="status-owner"><image :src="group.avatar" mode="aspectFill" /><text>{{ group.name }}</text><text class="tiny-tag">小院</text><text class="days">5天</text></view>
      </view>
    </view>
    <view v-else class="pet-list">
      <view v-for="(pet,index) in visiblePets" :key="index" class="pet-card" :class="{ 'pet-card--last-mine': variant==='mine' && index===2 }">
        <view class="pet-head"><image :src="pet.avatar" mode="aspectFill" /><view class="pet-copy"><view><text class="pet-name">小毛毛球</text><text class="green">已绝育</text><text class="orange">{{ variant==='mine' ? '云养中' : '待领养' }}</text></view><text class="desc">流浪的时候经常去小院边缘吃火腿肠，性格温顺惹人喜欢</text></view></view>
        <view class="pet-tags"><text>中华田园猫</text><text>男生</text><text>2岁</text><text>已驱虫</text></view>
        <view class="pet-meta"><text>猫粮累计 16.3斤</text><text v-if="variant==='mine'">连续云养 32天</text><text v-else class="manage">{{ index===0 ? '前往云养' : '编辑信息' }}</text></view>
        <view v-if="variant==='yard'" class="yard-foot"><image :src="index===0?'/static/figma/home/yard-avatar.png':'/static/figma/interaction-avatar-1.jpg'" mode="aspectFill" /><view><text>{{ index===0?'虚位以待':'姜栋' }}</text><text class="yard-tag">小毛毛球的第3任云家长</text></view><view class="yard-action">{{ index===0?'前往云养':'云养中' }}</view></view>
        <view v-if="variant==='mine' && index===2" class="mine-extra"><text>剩余云养天数：3/3天</text><text>待领养生效　物流运输中，等待小院签收…</text></view>
      </view>
    </view>
  </view>
</template>

<script>
export default{
  name:'PawPetRoster',props:{variant:{type:String,default:'yard'}},
  data(){return{pets:[
    {avatar:'/static/figma/pets/pet-orange.png'},{avatar:'/static/figma/pets/pet-black-white.png'},{avatar:'/static/figma/pets/pet-dog.png'}
  ],statusGroups:[
    {name:'我就是要喂猫',avatar:'/static/figma/home/yard-avatar.png',labels:['奥利奥','呗呗','呗呗','呗呗','呗呗']},
    {name:'暖阳小院',avatar:'/static/figma/interaction-avatar-1.jpg',labels:['奥利奥','呗呗','呗呗','呗呗']}
  ]}},computed:{visiblePets(){return this.variant==='mine'?this.pets:this.pets.slice(0,2)}}
}
</script>

<style scoped>
.roster-page{min-height:100vh;padding-top:44px;background:#f5f5f5;color:#222;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif}.roster-nav{height:51px;display:flex;align-items:center;padding-right:10px;background:#fff;box-sizing:border-box}.back{width:35px;height:44px;display:flex;align-items:center;justify-content:center;flex:none}.back image{width:10px;height:18px}.title{font-size:16px;white-space:nowrap}.search{height:31px;flex:1;margin-left:12px;padding-left:8px;border:2px solid #222;border-radius:17px;display:flex;align-items:center;overflow:hidden;box-sizing:border-box;color:#bbb;font-size:10px}.search>text{margin-left:4px;white-space:nowrap;overflow:hidden}.search>view{height:28px;min-width:51px;margin-left:auto;border-radius:14px;background:#222;color:#fff;display:flex;align-items:center;justify-content:center}.tabs{height:33px;padding:0 8px;display:flex;align-items:center;gap:4px;background:#fff;font-size:11px;box-sizing:border-box}.tabs>text{padding:6px 11px;border-radius:3px;background:#f5f5f5;white-space:nowrap}.tabs .active{background:#ffe000}.sort{margin-left:auto;white-space:nowrap}.pet-list,.status-groups{padding:8px 10px}.pet-card{min-height:157px;margin-bottom:8px;padding:13px 12px 10px;border-radius:9px;background:#fff;box-sizing:border-box}.pet-head{display:flex}.pet-head image{width:38px;height:38px;border-radius:50%;flex:none}.pet-copy{margin-left:8px;min-width:0;flex:1}.pet-copy>view{display:flex;align-items:center;gap:5px}.pet-name{font-size:14px}.green,.orange,.tiny-tag{padding:1px 5px;border-radius:4px;font-size:9px}.green{background:#ddf7a9;color:#588b14}.orange{background:#fff0c8;color:#d28e00}.desc{display:block;margin-top:6px;font-size:10px;line-height:15px;color:#555}.pet-tags{display:flex;gap:8px;margin:10px 0 8px;padding-left:46px}.pet-tags text{font-size:9px;color:#888}.pet-meta{padding-left:46px;display:flex;align-items:center;gap:12px;font-size:10px;color:#ee9652}.pet-meta .manage{margin-left:auto;padding:5px 12px;border-radius:12px;background:#dff77a;color:#435a00}.status-card{height:115px;margin-bottom:8px;padding:28px 12px 12px;border-radius:8px;background:#fff;box-sizing:border-box}.status-labels{display:flex;justify-content:space-between;color:#555;font-size:10px}.status-owner{display:flex;align-items:center;margin-top:24px;font-size:10px}.status-owner image{width:24px;height:24px;margin-right:7px;border-radius:50%}.tiny-tag{margin-left:5px;background:#fff5a2}.days{margin-left:auto;color:#aaa}
.roster-page--yard .pet-card{min-height:196px}.roster-page--yard .pet-card:nth-child(2){min-height:220px}.yard-foot{display:flex;align-items:center;margin-top:20px}.yard-foot image{width:32px;height:32px;border-radius:50%;margin-right:7px}.yard-foot>view:nth-child(2){display:flex;flex-direction:column;font-size:10px}.yard-tag{margin-top:3px;padding:1px 5px;border-radius:7px;background:#ffed34;font-size:9px}.yard-action{margin-left:auto;padding:8px 16px;border-radius:18px;background:#dff779;font-size:13px;font-weight: 500}.pet-card--last-mine{min-height:194px}.mine-extra{display:flex;flex-direction:column;margin:10px 0 0 46px;gap:5px;font-size:10px;color:#2d81ff}.mine-extra text:last-child{color:#ff7e24}
.roster-page--status .status-card{height:177px;padding-top:85px}
</style>
