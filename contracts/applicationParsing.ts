import type { StoredTimestamp, AdoptionStatus, RescueStatus, RescueApplicationStatus } from './applications.ts'
export function timestamp(value: unknown): StoredTimestamp | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  if (typeof value === 'string' && value.trim()) return value
  return null
}
export function mediaPaths(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : []
}
export function adoptionStatus(value: unknown): AdoptionStatus | null {
  switch (value) {
    case 'cloud_pending': case 'cloud_rejected': case 'pending': case 'rejected': case 'pickup': case 'owner_confirm': case 'owner_confirm_pending': case 'jury_confirm': case 'jury_confirm_pending': case 'adoption_confirmed': case 'reward': case 'reward_done': case 'abandoned': return value
    default: return null
  }
}
export function rescueStatus(value: unknown): RescueStatus | null {
  return value === 'approved' || value === 'funding_pending' || value === 'funding_failed' || value === 'funding_paid' || value === 'pending' || value === 'unpaid' || value === 'paid' || value === 'rejected' ? value : null
}
export function rescueApplicationStatus(value: unknown): RescueApplicationStatus | null {
  return value === 'platform_pending' || value === 'platform_approved' || value === 'platform_rejected' ? value : null
}

export function rewardAddress(value: unknown): import('./address.ts').AddressRecord | undefined {
  if (value === null || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string' || !value.id) return undefined
  return {
    id: value.id,
    name: 'name' in value && typeof value.name === 'string' ? value.name : '',
    phone: 'phone' in value && typeof value.phone === 'string' ? value.phone : '',
    detail: 'detail' in value && typeof value.detail === 'string' ? value.detail : '',
    regionParts: 'regionParts' in value ? mediaPaths(value.regionParts) : [],
    isDefault: 'isDefault' in value && value.isDefault === true,
  }
}

/** Optional fields must stay absent: ownership/alias readers distinguish absent from supplied. */
export function definedFields<T extends object>(value: T): T {
  for (const key of Object.keys(value)) {
    if (Reflect.get(value, key) === undefined) Reflect.deleteProperty(value, key)
  }
  return value
}
