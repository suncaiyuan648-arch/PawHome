/** 与「我的」页逢猫号一致；点击本人不进入他人主页 */
export const SELF_PAW_ID = '2876598765'

export function openUserProfile({ pawId, nickname = '', avatar = '' }) {
	const id = String(pawId || '').trim()
	if (!id || id === SELF_PAW_ID) return
	const q =
		'pawId=' +
		encodeURIComponent(id) +
		'&nickname=' +
		encodeURIComponent(nickname || '') +
		'&avatar=' +
		encodeURIComponent(avatar || '')
	uni.navigateTo({ url: '/pages/user/profile?' + q })
}

/** 小院详情（商品/小院详情页） */
export function openYardDetail({ yardId = '1', yardName = '' } = {}) {
	const id = String(yardId || '').trim() || '1'
	let url = '/pages/commodityDetails/index?id=' + encodeURIComponent(id)
	const yn = String(yardName || '').trim()
	if (yn) url += '&yardName=' + encodeURIComponent(yn)
	uni.navigateTo({ url })
}
