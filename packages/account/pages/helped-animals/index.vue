<template>
	<view class="helped-page">
		<PawPageNav title="我帮助过的动物" background="#f5f7f9" fallback-url="/packages/account/pages/level/index" />
		<view class="grid-wrap">
			<view
				v-for="(src, i) in photoList"
				:key="i"
				class="grid-cell"
				@click="onThumbTap(i)"
			>
				<image class="grid-img" :src="src" mode="aspectFill"></image>
			</view>
		</view>
	</view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import {
	createHelpedAnimalPreviewOptions,
	createHelpedAnimalsPageMetadata,
	type HelpedAnimalsPageState
} from '@/packages/account/services/helpedAnimalsMetadata'

export default defineComponent({
	components: { PawPageNav },
	data(): HelpedAnimalsPageState {
		return createHelpedAnimalsPageMetadata()
	},
	methods: {
		onThumbTap(index: number) {
			const previewOptions = createHelpedAnimalPreviewOptions(this.photoList, index)
			if (!previewOptions) return
			uni.previewImage(previewOptions)
		}
	}
})
</script>

<style scoped>
	.helped-page {
		position:relative;
		min-height: 100vh;
		width: 100%;
		background: #f5f7f9;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.grid-wrap {
		width: 100%;
		padding: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: flex-start;
	}

	.grid-cell {
		width: 20%;
		padding: 0;
		box-sizing: border-box;
	}

	.grid-img {
		width: 100%;
		height: 75px;
		display: block;
		border-radius: 0;
		background: #f0f0f0;
	}
</style>
