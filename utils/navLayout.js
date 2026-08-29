/**
 * WeChat navigation geometry.
 *
 * This module reads native geometry only. It never renders a fake status bar,
 * capsule, Home Indicator, or system gesture bar.
 */
export function getWechatNavLayout(options = {}) {
  const {
    defaultStatusBarHeight = 20,
    defaultCapsuleWidth = 87,
    defaultCapsuleHeight = 32,
    defaultRightInset = 8,
    defaultNavBarHeight = 44,
    h5StatusBarHeight = 44,
    h5NavBarHeight = 54
  } = options

  const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
  const windowWidth = Number(sys.windowWidth || 375)
  let statusBarHeight = Number(sys.statusBarHeight || defaultStatusBarHeight)

  const layout = {
    windowWidth,
    statusBarHeight,
    navBarHeight: defaultNavBarHeight,
    totalHeight: statusBarHeight + defaultNavBarHeight,
    menuTop: statusBarHeight + Math.max(0, (defaultNavBarHeight - defaultCapsuleHeight) / 2),
    menuBottom: statusBarHeight + Math.max(0, (defaultNavBarHeight - defaultCapsuleHeight) / 2) + defaultCapsuleHeight,
    menuLeft: windowWidth - defaultRightInset - defaultCapsuleWidth,
    menuRight: windowWidth - defaultRightInset,
    menuWidth: defaultCapsuleWidth,
    menuHeight: defaultCapsuleHeight,
    menuRightInset: defaultRightInset,
    rightReservedWidth: defaultCapsuleWidth + defaultRightInset,
    navCenterY: statusBarHeight + defaultNavBarHeight / 2
  }

  // #ifdef H5
  statusBarHeight = h5StatusBarHeight
  layout.statusBarHeight = statusBarHeight
  layout.navBarHeight = h5NavBarHeight
  layout.totalHeight = statusBarHeight + h5NavBarHeight
  layout.menuTop = statusBarHeight + (h5NavBarHeight - defaultCapsuleHeight) / 2
  layout.menuBottom = layout.menuTop + defaultCapsuleHeight
  layout.menuRight = windowWidth - defaultRightInset
  layout.menuLeft = layout.menuRight - defaultCapsuleWidth
  layout.rightReservedWidth = defaultCapsuleWidth + defaultRightInset
  layout.navCenterY = statusBarHeight + h5NavBarHeight / 2
  // #endif

  // #ifdef MP-WEIXIN
  try {
    const mb = uni.getMenuButtonBoundingClientRect && uni.getMenuButtonBoundingClientRect()
    if (mb && Number.isFinite(Number(mb.left)) && Number.isFinite(Number(mb.right))) {
      const top = Number(mb.top || statusBarHeight)
      const height = Number(mb.height || defaultCapsuleHeight)
      const width = Number(mb.width || defaultCapsuleWidth)
      const left = Number(mb.left)
      const right = Number(mb.right)
      const topGap = Math.max(0, top - statusBarHeight)
      const rightInset = Math.max(0, windowWidth - right)
      const navBarHeight = Math.max(defaultNavBarHeight, topGap * 2 + height)

      layout.navBarHeight = navBarHeight
      layout.totalHeight = statusBarHeight + navBarHeight
      layout.menuTop = top
      layout.menuBottom = top + height
      layout.menuLeft = left
      layout.menuRight = right
      layout.menuWidth = width
      layout.menuHeight = height
      layout.menuRightInset = rightInset
      layout.rightReservedWidth = Math.max(0, windowWidth - left)
      layout.navCenterY = top + height / 2
    }
  } catch (e) {
    // Keep safe defaults. UI must never fall back to rendering fake native chrome.
  }
  // #endif

  // Backward-compatible aliases for legacy pages migrating to PawPageNav.
  layout.navRowOffsetTop = 0
  layout.navRowHeight = layout.navBarHeight

  return layout
}
