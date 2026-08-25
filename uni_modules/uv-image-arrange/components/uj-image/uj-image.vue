<template>
	<view class="uv-image">
		<image :style="mode == 'freedom'?(modes=='widthFix'?'width:'+maxWidth:'height:'+maxHeight):''" :mode="modes"
			@load="load" @error="error" :draggable="draggable" :showMenuByLongpress="showMenuByLongpress" :webp="webp"
			:fadeShow="fadeShow" :lazyLoad="lazyLoad" :src="errors?errorSrc:src">
		</image>
		<view class="button" v-if="isLoad">
			<slot></slot>
			<view v-if="saveImage && !errors" @tap="saveImages(src)" class="button-item">
				<image class="img" src="/uni_modules/uv-image-arrange/static/download.png"></image>
			</view>
			<view v-if="previewImage && !errors" @tap="previewImages(src)" class="button-item">
				<image class="img" src="/uni_modules/uv-image-arrange/static/preview.png"></image>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'uv-image',
		props: {
			src: { //图片资源地址	
				type: String,
				default: ''
			},
			saveImage: { //下载图片
				type: Boolean,
				default: false
			},
			previewImage: { //预览图片
				type: Boolean,
				default: false
			},
			lazyLoad: { //图片懒加载。只针对page与scroll-view下的image有效	微信小程序、百度小程序、抖音小程序、飞书小程序
				type: Boolean,
				default: false
			},
			fadeShow: { //图片显示动画效果	仅App-nvue 2.3.4+ Android有效
				type: Boolean,
				default: true
			},
			webp: { //在系统不支持webp的情况下是否单独启用webp。默认false，只支持网络资源。webp支持详见下面说明	微信小程序2.9.0
				type: Boolean,
				default: false
			},
			showMenuByLongpress: { //开启长按图片显示识别小程序码菜单	微信小程序2.7.0
				type: Boolean,
				default: false
			},
			draggable: { //是否能拖动图片	H5 3.1.1+、App（iOS15+）
				type: Boolean,
				default: true
			},
			maxWidth: { //单张最大宽度
				type: String,
				default: '300rpx'
			},
			maxHeight: { //单张最大高度
				type: String,
				default: '300rpx'
			},
			mode: { //单张最大高度
				type: String,
				default: 'freedom'
			},
			errorSrc: { //失败后展示的图片
				type: String,
				default: '/uni_modules/uj-image/static/noimg.png'
			}
		},
		data() {
			return {
				isLoad: false,
				errors: false,
				modes: 'widthFix'
			};
		},
		mounted() {
			if (this.mode == 'freedom') {
				this.modes = 'widthFix'
			} else {
				this.modes = this.mode
			}
		},
		methods: {
			previewImages(url) {
				uni.previewImage({
					urls: [url],
					showmenu: true,
					current: 0
				});
			},
			downloadFile(url, filename) {
				fetch(url)
					.then(response => response.blob())
					.then(blob => {
						const link = document.createElement('a');
						link.href = window.URL.createObjectURL(blob);
						link.download = filename;
						link.click();
						// 释放之前创建的对象URL
						window.URL.revokeObjectURL(link.href);
					});
			},
			saveImages(imgSrc, content = "是否允许获取保存相册权限", failTip = '暂无图片', successTip = "已保存到本地相册") {
				// #ifdef H5
				this.downloadFile(imgSrc)
				// #endif
				// #ifndef H5
				uni.getImageInfo({
					src: imgSrc,
					success: function(sres) {
						console.log('图片信息', sres.path);
						uni.saveImageToPhotosAlbum({
							filePath: sres.path,
							// 保存成功，直接给出提示
							success: (res) => {
								uni.showModal({
									title: '提示',
									content: successTip,
									showCancel: false,
									confirmText: "好的"
								})
							},
							// 保存失败，判断是否授权，未授权则调用授权，否则弹出失败信息
							fail(err) {
								console.error(err);
								if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny" || err
									.errMsg ===
									"saveImageToPhotosAlbum:fail authorize no response" || err
									.errMsg ===
									"saveImageToPhotosAlbum:fail auth denied"
								) { // 没有授权，重新授权，兼容iso和Android
									uni.showModal({
										title: '授权提示',
										content: content,
										success: (res) => {
											if (res.confirm) { // 点击确定，则调用相册授权
												uni.openSetting({
													success(settingdata) {
														if (settingdata
															.authSetting[
																"scope.writePhotosAlbum"
															]) {
															console.log(
																"获取权限成功，再次点击图片保存到相册"
															)
															uni.showToast({
																title: '授权成功，请重试哦~'
															});
														} else {
															console.log("获取权限失败")
															uni.showToast({
																title: '请确定已打开保存权限',
																icon: "none"
															});
														}
													}
												})
											}
										}
									})
								} else if (err.errMsg ===
									"saveImageToPhotosAlbum:fail file not found" ||
									err.errMsg ===
									"saveImageToPhotosAlbum:fail file not exists" || err.errMsg ===
									"saveImageToPhotosAlbum:fail get file data fail"
								) { // 无图片，则提示
									uni.showToast({
										title: failTip,
										icon: "none"
									});
								}
							}
						})
					}
				})
				// #endif
			},
			error(e) {
				if (this.errorSrc) {
					this.errors =  true
				}
				this.isLoad = true
				this.$emit('error', e)
			},
			load(e) {
				if (this.mode == 'freedom') {
					if (e.detail.height > e.detail.width) { // 设置高度为最大高
						this.modes = 'heightFix'
					} else { // 设置宽度为最大宽
						this.modes = 'widthFix'
					}
				}
				this.isLoad = true
				this.$emit('load', e)
			},
		}
	}
</script>

<style scoped>
	.uv-image {
		display: inline-block;
		position: relative;
		padding: 0;
		margin: 0;
	}

	.button {
		position: absolute;
		top: 5px;
		left: 5px;
		right: 5px;
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.button-item {
		cursor: pointer;
		background-color: rgba(0, 0, 0, .3);
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: 5px
	}

	.button-item:hover {
		background-color: rgba(0, 0, 0, .5);
	}

	.img {
		width: 18px;
		height: 18px;
	}
</style>