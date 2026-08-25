/**
 * 按页面栈退回上一级（或多级）；失败时再试退回一层或打开 fallbackUrl。
 * 必须处理 navigateBack 的 fail，否则多层跳转后部分端上会静默失败（返回「失效」）。
 * fallbackLaunch: 'reLaunch' | 'redirectTo'，默认 reLaunch。
 */
export function goBackSmart(options = {}) {
	const delta = Math.max(1, Number(options.delta) || 1)
	const fallbackUrl = (options.fallbackUrl || '').trim()
	const fallbackLaunch = options.fallbackLaunch === 'redirectTo' ? 'redirectTo' : 'reLaunch'

	const runFallback = () => {
		if (!fallbackUrl) return
		if (fallbackLaunch === 'redirectTo') {
			uni.redirectTo({
				url: fallbackUrl,
				fail: () => uni.reLaunch({ url: fallbackUrl })
			})
		} else {
			uni.reLaunch({ url: fallbackUrl })
		}
	}

	const tryBack = (d) => {
		uni.navigateBack({
			delta: d,
			fail: () => {
				if (d > 1) {
					tryBack(1)
				} else {
					runFallback()
				}
			}
		})
	}

	tryBack(delta)
}
