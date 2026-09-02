
const { getTotalMessageUnreadCount } = require('../utils/messageUnread.js')

Component({
	data: {
		selected: 0,
		unreadCount: getTotalMessageUnreadCount()
	},
	pageLifetimes: {
		show() {
			this.setData({ unreadCount: getTotalMessageUnreadCount() })
		}
	},
	methods: {
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
