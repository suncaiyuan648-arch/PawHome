Component({
	data: {
		selected: 0,
		showPublishPanel: false
	},
	methods: {
		onFabTap() {
			this.setData({ showPublishPanel: !this.data.showPublishPanel })
		},
		onPublishMaskTap() {
			this.setData({ showPublishPanel: false })
		},
		onPublishClose() {
			this.setData({ showPublishPanel: false })
		},
		onPublishPost() {
			this.setData({ showPublishPanel: false })
			wx.navigateTo({ url: '/pages/publishDynamic/postFeed' })
		},
		onPublishCatYard() {
			this.setData({ showPublishPanel: false })
			wx.navigateTo({ url: '/pages/yard/catGuide' })
		},
		onPublishHelp() {
			this.setData({ showPublishPanel: false })
			wx.navigateTo({ url: '/pages/feature/index?mode=rescue-detail' })
		},
		noop() {
			return undefined
		},
		onTabTap(e) {
			const index = parseInt(e.currentTarget.dataset.index, 10)
			const urls = [
				'/pages/index/index',
				'/pages/selfRun/index',
				'/pages/message/index',
				'/pages/me/index'
			]
			const url = urls[index]
			if (!url || index === this.data.selected) return
			wx.switchTab({ url })
		}
	}
})
