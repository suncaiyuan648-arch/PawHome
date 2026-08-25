export function getWechatNavLayout(options = {}) {
	const {
		defaultStatusBarHeight = 20,
		defaultCapsuleWidth = 87,
		defaultCapsuleHeight = 32,
		defaultRightInset = 8
	} = options

	const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
	let statusBarHeight = Number(sys.statusBarHeight || defaultStatusBarHeight)
	// #ifdef H5
	statusBarHeight = 44
	// #endif
	const windowWidth = Number(sys.windowWidth || 375)

	const layout = {
		statusBarHeight,
		navRowOffsetTop: 0,
		navRowHeight: defaultCapsuleHeight,
		menuWidth: defaultCapsuleWidth,
		menuRightInset: defaultRightInset
	}
	// #ifdef H5
	layout.navRowHeight = 58
	// #endif

	// #ifdef MP-WEIXIN
	try {
		const mb = uni.getMenuButtonBoundingClientRect && uni.getMenuButtonBoundingClientRect()
		if (mb && mb.left) {
			const top = Number(mb.top || statusBarHeight)
			const height = Number(mb.height || defaultCapsuleHeight)
			const width = Number(mb.width || defaultCapsuleWidth)
			const rightInset = Number(windowWidth - mb.right || defaultRightInset)
			layout.navRowOffsetTop = Math.max(0, top - statusBarHeight)
			layout.navRowHeight = Math.max(defaultCapsuleHeight, height)
			layout.menuWidth = Math.max(defaultCapsuleWidth, width)
			layout.menuRightInset = Math.max(defaultRightInset, rightInset)
		}
	} catch (e) {}
	// #endif

	return layout
}
