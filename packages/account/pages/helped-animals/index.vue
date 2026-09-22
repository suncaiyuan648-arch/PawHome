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

<script>
	import PawPageNav from '@/components/PawPageNav.vue'

	const mockPhotos = () => ["/static/figma/helped/animal-01.jpg", "/static/figma/helped/animal-02.jpg", "/static/figma/helped/animal-03.jpg", "/static/figma/helped/animal-04.jpg", "/static/figma/helped/animal-05.jpg", "/static/figma/helped/animal-06.jpg", "/static/figma/helped/animal-07.png", "/static/figma/helped/animal-08.jpg", "/static/figma/helped/animal-09.jpg", "/static/figma/helped/animal-10.jpg", "/static/figma/helped/animal-11.jpg"]

	export default {
		components: { PawPageNav },
		data() {
			return {
				photoList: mockPhotos()
			}
		},
		methods: {
			onThumbTap(i) {
				uni.previewImage({
					urls: this.photoList,
					current: this.photoList[i]
				})
			}
		}
	}
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
