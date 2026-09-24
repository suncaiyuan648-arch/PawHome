const REAL_NAME_VERIFIED_KEY = 'PAWHOME_REAL_NAME_VERIFIED'

// Temporary integration seam: until Alipay face verification is connected,
// an unset account is treated as verified so creating a yard is not blocked.
export function isRealNameVerified(): boolean {
  const value = uni.getStorageSync(REAL_NAME_VERIFIED_KEY)
  if (value === '' || value === null || value === undefined) return true
  return value === true || value === '1' || value === 1
}

export function setRealNameVerified(value: boolean): void {
  uni.setStorageSync(REAL_NAME_VERIFIED_KEY, value ? '1' : '0')
}

export function clearRealNameVerified(): void {
  uni.removeStorageSync(REAL_NAME_VERIFIED_KEY)
}
