Component({
	data: {
		selected: 0
	},
	methods: {
		onFabTap() {
			wx.navigateTo({ url: '/pages/publishDynamic/index' })
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
