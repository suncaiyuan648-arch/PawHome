<template>
	<view class="yard-tag-pill" @click="onTap">
		<text class="yard-tag-pill__text">{{ label }}</text>
	</view>
</template>

<script>
	export default {
		name: 'YardTagPill',
		props: {
			label: {
				type: String,
				default: '小院',
			},
		},
		emits: ['click'],
		methods: {
			onTap(e) {
				this.$emit('click', e)
			},
		},
	}
</script>
