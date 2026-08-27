<template>
	<view class="level-capsule">
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
		display: flex;
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
		line-height: 7px;
		color: var(--paw-level-text, #f6e1b8);
	}
</style>
