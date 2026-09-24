/** 与「我的」页逢猫号一致；点击本人不进入他人主页 */
export const SELF_PAW_ID = '2876598765'

export interface UserProfileNavigationParams {
  pawId?: string | number | null
  nickname?: string | null
  avatar?: string | null
}

export interface YardDetailNavigationParams {
  yardId?: string | number | null
  yardName?: string | null
}

export function openUserProfile({
  pawId,
  nickname = '',
  avatar = '',
}: UserProfileNavigationParams): void {
  const id = String(pawId || '').trim()
  if (!id || id === SELF_PAW_ID) return
  // Keep this tiny navigation helper dependency-free: governance tests copy it
  // into an isolated fixture tree. The same restricted ID shape is enforced by
  // the account.profile route contract.
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) return
  const q = '/packages/account/pages/profile/index?userId=' + encodeURIComponent(id)
  const extras =
    '&nickname=' +
    encodeURIComponent(nickname || '') +
    '&avatar=' +
    encodeURIComponent(avatar || '')
  uni.navigateTo({ url: q + extras })
}

/** 小院详情（商品/小院详情页） */
export function openYardDetail({
  yardId = '1',
  yardName = '',
}: YardDetailNavigationParams = {}): void {
  const id = String(yardId || '').trim() || '1'
  let url = '/packages/yard/pages/detail/index?yardId=' + encodeURIComponent(id)
  const yn = String(yardName || '').trim()
  if (yn) url += '&yardName=' + encodeURIComponent(yn)
  uni.navigateTo({ url })
}
