<template>
	<view class="uv-image-arrange">
		<view v-if="list.length == 1">
			<uj-image :errorSrc="errorSrc" :maxWidth="maxWidth" :maxHeight="maxHeight" @click="previewImages(0)" :src="list[0]"></uj-image>
		</view>
		<view v-else class="cadr" :style="listSrc.length==4?'width: 66.66%;':''">
			<view v-for="(item,index) in listSrc"
				:style="listSrc.length==4?'width:calc(50% - 2px)':'width: calc(33.3% - 2px)'" style="padding: 1px;">
				<view @click="previewImages(index)" :style="bgStyle(item.src,item.error)" class="image-container">
					<image @error="error(item)" style="display: none;" :src="item.src"></image>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'uv-image-arrange',
		props: {
			maxWidth: { //单张最大宽度
				type: String,
				default: '500rpx'
			},
			maxHeight: { //单张最大高度
				type: String,
				default: '500rpx'
			},
			list: {
				type: Array,
				default () {
					return []
				},
			},
			previewImage: { //是否预览
				type: Boolean,
				default: true
			},
			errorSrc: { //失败图片sss
				type: String,
				default: '/uni_modules/uv-image-arrange/static/noimg.png'
			},
		},
		data() {
			return {
				listSrc: [],
				mode: 'widthFix'
			};
		},
		created() {
			this.listSrc = this.list.map(el=>{
				return {
					src: el,
					error: false
				}
			})
		},
		watch:{
			list(){
				this.listSrc = this.list.map(el=>{
					return {
						src: el,
						error: false
					}
				})
			}
		},
		methods: {
			previewImages(index) {
				if (this.previewImage) {
					uni.previewImage({
						urls: this.list,
						showmenu: true,
						current: index
					});
				}
				this.$emit('previewImage', index)
			},
			bgStyle(url,error) {
				return {
					'background-image': error?'url(' + this.errorSrc + ')':'url(' + url + ')'
				};
			},
			load(e) {
				console.log(e)
				if (e.detail.height > e.detail.width) { // 设置高度为最大高
					this.mode = 'heightFix'
				} else { // 设置宽度为最大宽
					this.mode = 'widthFix'
				}
			},
			error(item) {
				item.error =  true
			},
		},
		mounted() {}
	}
</script>

<style scoped lang="less">
	.uv-image-arrange {
		.cadr {
			display: flex;
			width: 100%;
			justify-content: flex-start;
			flex-wrap: wrap;
		}
	}

	.image-container {
		background-size: cover;
		background-position: center;
		width: 100%;
		padding-top: 100%;
	}
</style>