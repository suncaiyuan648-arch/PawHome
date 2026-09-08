<template>
	<view class="rules-page">
		<PawPageNav background="#f5f5f5" fallback-url="/pages/meMore/level" />

		<scroll-view class="rules-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
			<view class="rules-content">
				<view class="card intro-card" data-qa="qa-level-rules-intro">
					<text class="card-h1">升级说明</text>

					<text class="sec-title">基础说明</text>
					<view class="bullet">
						<text class="bullet-dot">·</text>
						<text class="bullet-txt">最高账号等级为8级，封顶后不再升级，但继续累计；</text>
					</view>

					<text class="sec-title">投喂量计算</text>
					<view class="bullet">
						<text class="bullet-dot">·</text>
						<text class="bullet-txt">投粮量和喂猫量将叠加计算；</text>
					</view>
					<view class="bullet">
						<text class="bullet-dot">·</text>
						<text class="bullet-txt">同一账号在IOS、安卓、小程序的投喂量都会纳入统计；</text>
					</view>
					<view class="bullet">
						<text class="bullet-dot">·</text>
						<text class="bullet-txt">每日投喂量计算无上限；</text>
					</view>

					<text class="sec-title">数据更新说明</text>
					<view class="bullet">
						<text class="bullet-dot">·</text>
						<text class="bullet-txt">当日数据次日14:00后更新；</text>
					</view>
				</view>

				<view class="card table-card" data-qa="qa-level-rules-table">
					<view class="table-title-row">
						<text class="card-h1">等级说明</text>
					</view>

					<view class="table-head">
						<text class="th th--lv">等级</text>
						<text class="th th--req">达成条件</text>
						<text class="th th--pri">特权</text>
					</view>

					<view v-for="row in levelTable" :key="row.lv" class="table-row">
						<text class="td td--lv">{{ row.lv }}</text>
						<view class="td td--req">
							<text class="td-dot">·</text>
							<text class="td-txt">{{ row.req }}</text>
						</view>
						<view class="td td--pri">
							<view v-for="privilege in row.pri" :key="privilege" class="privilege-line">
								<text class="td-dot">·</text>
								<text class="td-txt">{{ privilege }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'

const LEVEL_TABLE = [
	{ lv: 'LV.1', req: '投喂 1-10斤', pri: ['投票1票/天', '领养3次/天'] },
	{ lv: 'LV.2', req: '投喂 11–50斤', pri: ['投票5票/天', '领养5次/天'] },
	{ lv: 'LV.3', req: '投喂51–200斤', pri: ['投票10票/天', '领养10次/天', '语音5条/天'] },
	{ lv: 'LV.4', req: '投喂201–800斤', pri: ['投票50票/天', '领养15次/天', '语音10条/天'] },
	{ lv: 'LV.5', req: '投喂801–3000斤', pri: ['投票100票/天', '领养20次/天', '语音20条/天'] },
	{ lv: 'LV.6', req: '投喂3001–10000斤', pri: ['投票200票/天', '领养25次/天', '语音100条/天'] },
	{ lv: 'LV.7', req: '投喂 10001–30000斤', pri: ['投票500票/天', '领养30次/天', '语音200条/天'] },
	{ lv: 'LV.8', req: '投喂 30001+斤', pri: ['投票无限', '领养无限', '语音无限'] }
]

export default {
	components: { PawPageNav },
	data() {
		return {
			levelTable: LEVEL_TABLE
		}
	}
}
</script>

<style scoped>
.rules-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	min-height: 0;
	box-sizing: border-box;
	background: #f5f5f5;
}

.rules-scroll {
	flex: 1 1 auto;
	height: 0;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.rules-content {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	box-sizing: border-box;
	min-height: 100%;
	padding: 11px 15px calc(20px + env(safe-area-inset-bottom));
}

.card {
	flex: 0 0 auto;
	width: 100%;
	box-sizing: border-box;
	border-radius: 8px;
	background: #ffffff;
}

.intro-card {
	min-height: 248px;
	padding: 8px;
	margin-bottom: 20px;
}

.table-card {
	padding-bottom: 0;
	overflow: hidden;
}

.table-title-row {
	display: flex;
	align-items: flex-start;
	box-sizing: border-box;
	height: 48px;
	padding: 8px 8px 0;
}

.card-h1 {
	display: block;
	margin: 0;
	color: #333333;
	font-size: 18px;
	font-weight: 700;
	line-height: 22px;
}

.sec-title {
	display: block;
	margin: 1px 0 5px 10px;
	color: #333333;
	font-size: 14px;
	font-weight: 500;
	line-height: 17px;
}

.card-h1 + .sec-title {
	margin-top: 1px;
}

.bullet {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	box-sizing: border-box;
	min-height: 24px;
	padding-left: 16px;
}

.bullet-dot {
	flex: 0 0 auto;
	width: 13px;
	color: #666666;
	font-size: 12px;
	line-height: 18px;
}

.bullet-txt {
	flex: 1 1 auto;
	min-width: 0;
	color: #666666;
	font-size: 12px;
	font-weight: 400;
	line-height: 18px;
}

.table-head,
.table-row {
	display: flex;
	flex-direction: row;
	box-sizing: border-box;
	margin-right: 9px;
	margin-left: 9px;
	padding-left: 12px;
}

.table-head {
	align-items: center;
	height: 30px;
	padding-bottom: 8px;
	border-bottom: 1px solid #eeeeee;
}

.th {
	flex: 0 0 auto;
	color: #999999;
	font-size: 13px;
	font-weight: 400;
	line-height: 16px;
}

.th--lv {
	width: 75px;
}

.th--req {
	width: 140px;
	padding-left: 8px;
	box-sizing: border-box;
}

.th--pri {
	flex: 1 1 auto;
	min-width: 0;
	box-sizing: border-box;
	padding-left: 8px;
}

.table-row {
	align-items: flex-start;
	min-height: 106px;
	padding-top: 24px;
	padding-right: 0;
	padding-bottom: 0;
	border-bottom: 1px solid #eeeeee;
}

.table-row:last-child {
	border-bottom: none;
}

.td {
	color: #333333;
	font-size: 11px;
	line-height: 23px;
}

.td--lv {
	flex: 0 0 75px;
	box-sizing: border-box;
	padding-top: 0;
	color: #6b4a22;
	font-size: 14px;
	font-weight: 700;
	line-height: 20px;
}

.td--req {
	flex: 0 0 140px;
	min-width: 0;
}

.td--pri {
	flex: 1 1 auto;
	min-width: 0;
}

.privilege-line,
.td--req {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
}

.td-dot {
	flex: 0 0 auto;
	width: 8px;
	color: #999999;
	font-size: 11px;
	line-height: 23px;
}

.td-txt {
	flex: 1 1 auto;
	min-width: 0;
	color: #333333;
	font-size: 11px;
	font-weight: 400;
	line-height: 23px;
}
</style>
