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
		padding: 4rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(82, 52, 0, 1);
		box-sizing: border-box;
	}

	.level-capsule__txt {
		font-size: 20rpx;
		font-weight: 500;
		line-height: 28rpx;
		color: #ff6b35;
	}
</style>
