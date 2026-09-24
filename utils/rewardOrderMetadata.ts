import type { AddressRecord } from '@/utils/addressMock.ts'
import type { RewardOrderRecord } from '@/utils/rewardOrderStorage.ts'

export interface RewardOrderSheetState {
  selectedAddress: AddressRecord | null
  selectedAddressId: string
  submitting: boolean
}

export interface RewardOrderSubmittedPayload {
  order: RewardOrderRecord
  record: Record<string, unknown>
  recordId: string
}

export function createRewardOrderSheetState(): RewardOrderSheetState {
  return {
    selectedAddress: null,
    selectedAddressId: '',
    submitting: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeRewardOrderAddress(value: unknown): AddressRecord | null {
  if (
    !isRecord(value) ||
    value.id === undefined ||
    value.id === null ||
    String(value.id).trim() === ''
  )
    return null
  return {
    ...value,
    id: String(value.id),
    name: typeof value.name === 'string' ? value.name : '',
    phone: typeof value.phone === 'string' ? value.phone : '',
    regionParts: Array.isArray(value.regionParts)
      ? value.regionParts.filter((part): part is string => typeof part === 'string').slice(0, 4)
      : [],
    detail: typeof value.detail === 'string' ? value.detail : '',
    isDefault: value.isDefault === true,
  }
}

export function isRewardOrderSubmittedPayload(
  value: unknown,
): value is RewardOrderSubmittedPayload {
  return (
    isRecord(value) &&
    isRecord(value.order) &&
    typeof value.order.id === 'string' &&
    isRecord(value.record) &&
    typeof value.record.id === 'string' &&
    typeof value.recordId === 'string' &&
    value.recordId.length > 0
  )
}
