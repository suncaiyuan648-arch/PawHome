<template>
	<PawAdoptionProofForm v-if="mode==='proof'" />
	<view v-else class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack"><image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image></view>
				<text class="nav-title">领养申请</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>
		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
			<view class="status-row"><text class="status-title">{{ titleByMode }}</text></view>
			<view class="card"><text class="apply-body">{{ rec.applyText }}</text></view>
			<view class="card">
				<text class="card-title">{{ catSectionTitle }}</text>
				<view class="pet-row">
					<view v-for="(p, i) in displayPets" :key="i" class="pet-cell">
						<image class="pet-av" :src="petAvatarSrc(p)" mode="aspectFill" />
						<text class="pet-name">{{ p.name }}</text>
					</view>
				</view>
				<view class="yard-foot"><image class="yard-av" :src="rec.ownerAvatar" mode="aspectFill" @click.stop="openAuditOwner"></image><text class="yard-n" @click.stop="openAuditOwner">{{ rec.ownerName }}</text><YardTagPill class="yard-tag-pill--ml" @click.stop="openAuditYard" /></view>
			</view>
			<view class="card card--link">
				<text>领养信息</text>
				<view class="adopt-link-more">
					<text>查看</text>
					<image class="adopt-link-more__arrow" src="/static/youjiantou.png" mode="aspectFit" />
				</view>
			</view>
			<view class="card card--link">
				<text>申请内容</text>
				<view class="adopt-link-more">
					<text>查看</text>
					<image class="adopt-link-more__arrow" src="/static/youjiantou.png" mode="aspectFit" />
				</view>
			</view>
		</scroll-view>

		<view v-if="mode==='ownerPending'" class="bar one">
			<button class="btn yellow full" @click="goMode('ownerConfirm')">确认申请人已领养</button>
		</view>
		<view v-if="mode==='ownerReview'" class="bar">
			<button class="btn ghost" @click="showReject=true">拒绝</button>
			<button class="btn yellow" @click="showAgree=true">同意</button>
		</view>
		<view v-if="mode==='ownerConfirm'" class="bar">
			<button class="btn ghost" @click="goMode('confirmReject')">驳回</button>
			<button class="btn yellow" @click="goMode('confirmAgree')">确认已领养</button>
		</view>
		<view v-if="mode==='agreeDone' || mode==='confirmAgree' || mode==='confirmReject' || mode==='rejectDone'" class="bar one">
			<button class="btn yellow full" @click="nextFromResult">{{ resultBtnText }}</button>
		</view>

		<view v-if="showAgree" class="mask" @click="showAgree=false">
			<view class="sheet sheet--agree" @click.stop>
				<text class="sheet-title">确定同意领养吗</text>
				<text class="sheet-desc">{{ agreeDescription }}</text>
				<view class="sheet-actions"><view class="sheet-btn ghost" @click="showAgree=false"><text>返回</text></view><view class="sheet-btn yellow" @click="onAgree"><text>确认</text></view></view>
			</view>
		</view>
		<view v-if="showReject" class="mask" @click="showReject=false">
			<view class="sheet sheet--reject" @click.stop>
				<text class="sheet-title">驳回</text>
				<textarea v-model="rejectReason" maxlength="120" class="reason" placeholder="简短说明驳回的原因"></textarea>
				<view class="sheet-actions"><view class="sheet-btn ghost" @click="showReject=false"><text>返回</text></view><view class="sheet-btn" :class="rejectReason.trim()?'yellow':'disabled'" @click="onReject"><text>确认</text></view></view>
			</view>
		</view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import { getDemoAdoptions, updateAdoption } from '@/utils/adoptionStorage.js'
import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import YardTagPill from '@/components/YardTagPill.vue'
import PawAdoptionProofForm from '@/components/PawAdoptionProofForm.vue'
export default {
	components: { YardTagPill, PawAdoptionProofForm },
	data(){return{statusBarHeight:20,menuRightWidth:87,mode:'ownerReview',id:'demo-pending',rec:getDemoAdoptions()[0],showAgree:false,showReject:false,rejectReason:''}},
	computed:{
		agreeDescription(){
			return this.mode === 'ownerConfirm'
				? '同意后申请将发给院主，由院主再次审核，为防止虐猫群体恶意领养，请您点击申请人头像审查领养人的历史记录后再做决定。'
				: '同意后申请人可以查看小院位置（非收货地址）、您的联系方式以及您的领养留言。为防止虐猫群体恶意领养，请您点击申请人头像审查申请人的历史记录后再做决定。'
		},
		titleByMode(){
			return {
				ownerReview:'等待院主审核中……',ownerPending:'院主已同意，待申请人前往领养',ownerConfirm:'申请人已领养，待院主确认',
				agreeDone:'已同意领养申请',confirmAgree:'已确认领养',confirmReject:'已驳回',success:'领养成功',rejectDone:'已驳回'
			}[this.mode] || '领养申请'
		},
		resultBtnText(){ return this.mode==='agreeDone'?'好的':'查看详情' },
		displayPets(){
			const list = this.rec && Array.isArray(this.rec.pets) && this.rec.pets.length ? this.rec.pets : []
			if (list.length) return list
			return [
				{ name: '奥利奥', avatar: '/static/home-feed-1.png' },
				{ name: '呗呗', avatar: '/static/home-feed-1.png' }
			]
		},
		catSectionTitle(){
			const n = this.displayPets.length
			return this.mode === 'success' ? `领走的猫咪（${n}）` : `申请领养的猫咪（${n}）`
		}
	},
	onLoad(o){
		const sys=uni.getSystemInfoSync();this.statusBarHeight=sys.statusBarHeight||20;try{const mb=uni.getMenuButtonBoundingClientRect();if(mb&&mb.left)this.menuRightWidth=Math.max(sys.windowWidth-mb.left,87)}catch(e){}
		if(o.mode)this.mode=o.mode;if(o.id)this.id=decodeURIComponent(o.id)
		const hit=getDemoAdoptions().find(i=>i.id===this.id);if(hit)this.rec=hit
		if(o.popup==='agree')this.showAgree=true
		if(o.popup==='reject')this.showReject=true
	},
	methods:{
		petAvatarSrc: adoptionPetAvatarSrc,
		goBack(){goBackSmart({fallbackUrl:'/pages/me/index'})},
		openAuditOwner(){
			openUserProfile({
				pawId:this.rec.ownerPawId||'audit-owner-'+this.id,
				nickname:this.rec.ownerName,
				avatar:this.rec.ownerAvatar||''
			})
		},
		openAuditYard(){
			openYardDetail({ yardId:this.rec.yardId||'1', yardName:this.rec.ownerName })
		},
		goMode(m){uni.redirectTo({url:'/pages/yard/adoptionAudit?mode='+m+'&id='+encodeURIComponent(this.id)})},
		onAgree(){this.showAgree=false;updateAdoption(this.id,{status:'pickup'});this.goMode('agreeDone')},
		onReject(){if(!this.rejectReason.trim())return;this.showReject=false;updateAdoption(this.id,{status:'rejected',rejectNote:this.rejectReason.trim()});this.goMode('rejectDone')},
		nextFromResult(){
			if(this.mode==='agreeDone') return this.goMode('ownerPending')
			if(this.mode==='confirmAgree') return this.goMode('success')
			if(this.mode==='confirmReject') return uni.navigateTo({url:'/pages/yard/juryPanel'})
			if(this.mode==='rejectDone') return this.goBack()
		}
	}
}
</script>

<style lang="less" scoped>
.page{height:100vh;display:flex;flex-direction:column;background:#f5f5f5}.nav-wrap{flex-shrink:0;background:#f5f5f5}.nav-row{height:88rpx;display:flex;align-items:center;padding:0 8rpx}
.nav-side{width:88rpx;height:88rpx;display:flex;align-items:center;justify-content:center}.nav-back-icon{width:48rpx;height:48rpx}.nav-title{flex:1;text-align:center;font-size:34rpx;font-weight:600}
.main-scroll{flex:1;height:0;padding:24rpx;box-sizing:border-box}.status-row{padding:6rpx 8rpx 18rpx}.status-title{font-size:42rpx;font-weight:700}
.card{background:#fff;border-radius:20rpx;padding:28rpx;margin-bottom:20rpx}.apply-body{font-size:28rpx;line-height:1.6}.card-title{font-size:30rpx;font-weight:600;margin-bottom:16rpx}
.pet-row{display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:28rpx 32rpx}.pet-cell{display:flex;flex-direction:column;align-items:center;width:120rpx}.pet-av{width:112rpx;height:112rpx;border-radius:50%;background:#eee;display:block}.pet-name{margin-top:12rpx;font-size:24rpx;color:#111;text-align:center;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yard-foot{display:flex;align-items:center;margin-top:22rpx;padding-top:20rpx;border-top:1rpx solid #f0f0f0}
.yard-av{width:56rpx;height:56rpx;border-radius:50%;background:#eee}.yard-n{flex:1;margin-left:12rpx;font-size:26rpx}
.card--link{display:flex;justify-content:space-between;align-items:center;font-size:30rpx}
.adopt-link-more{display:flex;flex-direction:row;align-items:center;column-gap:8rpx}
.adopt-link-more__arrow{width:22rpx;height:22rpx;flex-shrink:0}
.bar{display:flex;gap:20rpx;background:#fff;padding:16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));border-top:1rpx solid #eee}.one .full{flex:1}
.btn{height:88rpx;line-height:88rpx;border-radius:44rpx;font-size:28rpx}.ghost{flex:1;background:#fff;border:2rpx solid #ddd;color:#333}.yellow{flex:1;background:#ffdd00;border:none;color:#111}.disabled{flex:1;background:#e5e5e5;color:#999;border:none}
.mask{position:fixed;inset:0;background:#5b5b5b;display:flex;align-items:flex-start;justify-content:center;z-index:99}.sheet{position:relative;width:316px;height:278px;margin-top:241px;background:#fff;border-radius:20px;overflow:visible}.sheet-title{position:absolute;left:0;right:0;top:20px;display:block;text-align:center;font-size:16px;line-height:22px;font-weight:600}.sheet-desc{position:absolute;left:27px;right:27px;top:82px;display:block;font-size:13px;line-height:15px;color:#7d7d7d}.reason{position:absolute;left:15px;top:66px;box-sizing:border-box;width:287px;height:130px;margin:0;background:#f5f5f5;border-radius:10px;padding:12px;font-size:13px}.sheet-actions{position:absolute;left:0;right:0;bottom:0;height:51px;display:flex;border-top:1px solid #eee}.sheet-btn{flex:1;height:51px;display:flex;align-items:center;justify-content:center}.sheet-btn text{font-size:14px}.sheet-btn.ghost{border:0}.sheet-btn.ghost text{color:#9c9c9c}.sheet-btn.yellow,.sheet-btn.disabled{background:#5b5b5b}.sheet--agree .sheet-actions:after,.sheet--reject .sheet-actions:after{content:'';position:absolute;left:316px;top:-1px;width:30px;height:52px;background:#ffe600}.sheet--reject .sheet-actions:after{background:#e5e5e5}
</style>
