import { getTotalMessageUnreadCount } from '../utils/messageUnread'
import { readPawEventDatasetValue } from '../utils/pawEventMetadata'

interface CustomTabBarData {
	selected: number
	unreadCount: number
}

interface CustomTabBarContext {
	data: CustomTabBarData
	setData(data: Partial<CustomTabBarData>): void
}

declare const Component: (options: unknown) => void

Component({
	data: {
		selected: 0,
		unreadCount: getTotalMessageUnreadCount()
	},
	pageLifetimes: {
		show(this: CustomTabBarContext) {
			this.setData({ unreadCount: getTotalMessageUnreadCount() })
		}
	},
	methods: {
		onTabTap(this: CustomTabBarContext, e: PawEvent) {
			const rawIndex = readPawEventDatasetValue(e, 'index')
			const index = typeof rawIndex === 'number' ? rawIndex : Number(rawIndex)
			const urls = [
				'/pages/index/index',
				'/pages/selfRun/index',
				'/pages/message/index',
				'/pages/me/index'
			]
			const url = urls[index]
			if (!url || index === this.data.selected) return
			if (typeof wx !== 'undefined' && typeof wx.switchTab === 'function') wx.switchTab({ url })
		}
	}
})
