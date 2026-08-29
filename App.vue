<script>
	export default {
		onLaunch: function() {
			console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	@import '@/styles/lv-cap.scss';
	@import '@/styles/yard-tag-pill.scss';
	@import '@/styles/paw-typography.scss';
	@import '@/styles/paw-design-system.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}

	/* #ifdef H5 */
	uni-tabbar {
		display: none !important;
	}

	/* H5 仍会为已隐藏的原生 tabBar 预留 50px，导致自定义页面整体溢出并出现
	 * 纵向滚动条。设计稿以完整 375px 内容宽度为基准，因此在 H5 预览中释放
	 * 这块占位；小程序端不受该规则影响。 */
	uni-app.uni-app--showtabbar uni-page-wrapper {
		height: 100% !important;
	}

	uni-app.uni-app--showtabbar uni-page-wrapper::after {
		display: none !important;
	}

	html,
	body {
		scrollbar-width: none;
	}

	body::-webkit-scrollbar {
		display: none;
		width: 0;
	}
	/* #endif */

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
