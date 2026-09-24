/** Shared input contracts for adoption condition and review resolution. */
export type AdoptionCloudParentPolicy =
  | Readonly<{
      selection: 'any' | 'all'
      legalStates: readonly string[]
      pendingStates: readonly string[]
      approvedStates: readonly string[]
      rejectedStates: readonly string[]
      specificIds?: never
      specificSelection?: never
    }>
  | Readonly<{
      selection: 'specific'
      legalStates: readonly string[]
      pendingStates: readonly string[]
      approvedStates: readonly string[]
      rejectedStates: readonly string[]
      specificIds: readonly string[]
      specificSelection: 'any' | 'all'
    }>

export type AdoptionReviewResolver = (
  input: Readonly<{
    record: Readonly<Record<string, unknown>>
  }>,
) => unknown
