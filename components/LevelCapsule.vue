<template>
	<text v-if="inline" class="level-capsule__inline">Lv{{ displayLevel }}</text>
	<view v-else class="level-capsule">
		<text class="level-capsule__txt">Lv{{ displayLevel }}</text>
	</view>
</template>

<script>
/** 与商品详情页房主昵称旁等级胶囊一致（commodityDetails `.level`） */
export default {
	name: "LevelCapsule",
	props: {
		level: {
			type: [Number, String],
			default: 1,
		},
		inline: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		displayLevel() {
			const n = Number(this.level);
			return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
		},
	},
};
</script>

<style scoped>
.level-capsule {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 13px;
	padding: 0;
	border-radius: 999rpx;
	background: var(--paw-level-bg, #523400);
	box-sizing: border-box;
	flex-shrink: 0;
}

.level-capsule__txt {
	font-size: 11px;
	font-weight: 500;
	line-height: 13px;
	color: var(--paw-level-text, #f6e1b8);
}

.level-capsule__inline {
	display: inline-block;
	min-width: 28px;
	height: 13px;
	padding: 0 4px;
	border-radius: 999rpx;
	background: var(--paw-level-bg, #523400);
	box-sizing: border-box;
	color: var(--paw-level-text, #f6e1b8);
	font-size: 11px;
	font-weight: 500;
	line-height: 13px;
	text-align: center;
	vertical-align: middle;
	white-space: nowrap;
}
</style>

<style>
/* #ifdef MP-WEIXIN */
:host {
	display: inline-flex;
	flex-shrink: 0;
	align-items: center;
	box-sizing: border-box;
	height: 13px;
	line-height: 0;
	vertical-align: middle;
}

/* #endif */
</style>
