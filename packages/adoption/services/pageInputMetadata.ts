export interface AdoptionConfirmationPageState {
  recordId: string
  invalid: boolean
}

export interface AdoptionRewardClaimPageState {
  sheetVisible: boolean
  recordId: string
  submittedPayload: import('@/utils/rewardOrderMetadata.ts').RewardOrderSubmittedPayload | null
  invalid: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Resolve the historical query aliases accepted by adoption result pages.
 * Query data is external input, so only scalar IDs are accepted.
 */
export function resolveAdoptionPageRecordId(options: unknown, aliases: readonly string[]): string {
  if (!isRecord(options)) return ''
  for (const alias of aliases) {
    const value = options[alias]
    if (typeof value === 'string' || typeof value === 'number') {
      const id = String(value).trim()
      if (id) return id
    }
  }
  return ''
}

export function createAdoptionConfirmationPageState(): AdoptionConfirmationPageState {
  return { recordId: '', invalid: false }
}

export function createAdoptionRewardClaimPageState(): AdoptionRewardClaimPageState {
  return { sheetVisible: true, recordId: '', submittedPayload: null, invalid: false }
}
