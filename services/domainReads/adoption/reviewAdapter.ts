/**
 * Read-only adapter for the adoption review queue and review detail.
 *
 * `adoptionReviewContract.ts` owns the adoption review capability boundary.
 * This module only binds that contract to the existing PAWHOME_ADOPTIONS
 * reader.  Persisted records are the only source here; demo records, route
 * query fields, displayed roles, and caller supplied records/resolvers are
 * never allowed to become reviewer authority.
 */
import {
  getAdoptionReviewList as readReviewListContract,
  getAdoptionReviewDetail as readReviewDetailContract,
} from '../../../navigation/adoptionReviewContract.ts'
import { getAdoptionRecords } from '../../../utils/adoptionStorage.ts'

type JsonRecord = Record<string, unknown>
export type AdoptionReviewRole = 'owner' | 'cloud_parent' | 'reviewer'
export type AdoptionReviewFilter = 'all' | 'pending' | 'processed' | 'approved' | 'rejected'
export interface AdoptionReviewListOptions {
  readonly actorProvider?: () => unknown
  readonly reviewerRole?: AdoptionReviewRole
  readonly filter?: AdoptionReviewFilter
}
export interface AdoptionReviewDetailOptions extends AdoptionReviewListOptions {
  readonly applicationId?: string
  readonly reviewItemId?: string
  readonly perspective?: 'reviewer'
}
type ReviewRole = AdoptionReviewRole
type StoredReviewContext = { applicationId?: string; reviewItemId?: string }
type ReviewListModel = ReturnType<typeof readReviewListContract>
type ReviewDetailModel = ReturnType<typeof readReviewDetailContract>

const REVIEWER_ROLES: readonly ReviewRole[] = Object.freeze(['owner', 'cloud_parent', 'reviewer'])
const REAL_ADOPTION_READ_OPTIONS = Object.freeze({ includeDemo: false })
const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionsOf<T extends AdoptionReviewListOptions | AdoptionReviewDetailOptions>(value: T): T {
  return value
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function errorCode(error: unknown, fallback: string): string {
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return fallback
  const code = Reflect.get(error, 'code')
  return typeof code === 'string' && code ? code : fallback
}

function frozenEmptyList(code: string): ReviewListModel {
  const emptyItems: readonly never[] = Object.freeze([])
  const emptySkipped: readonly JsonRecord[] = Object.freeze([])
  return Object.freeze({
    actor: null,
    items: emptyItems,
    pending: emptyItems,
    processed: emptyItems,
    canWrite: false,
    readOnly: true,
    diagnostics: Object.freeze({
      scanned: 0,
      accepted: 0,
      skipped: emptySkipped,
      actorError: Object.freeze({ code }),
    }),
  })
}

function frozenEmptyDetail(code: string): ReviewDetailModel {
  return Object.freeze({
    actor: null,
    item: null,
    canRead: false,
    canWrite: false,
    readOnly: true,
    reason: code,
    diagnostics: Object.freeze({ actorError: Object.freeze({ code }) }),
  })
}

function reviewerRoleOf(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return ''
  return typeof value === 'string' ? value.trim() : value
}

function assertReviewerRole(role: unknown): string {
  if (
    role &&
    (typeof role !== 'string' || !REVIEWER_ROLES.some((candidate) => candidate === role))
  ) {
    throw Object.assign(new Error('reviewer perspective is unsupported'), {
      code: 'INVALID_REVIEWER_ROLE',
    })
  }
  return typeof role === 'string' ? role : ''
}

/** Resolve the current reviewer session afresh for every page read/action. */
export function createReviewSessionProvider(): () => unknown {
  return (): unknown => {
    if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
    try {
      return uni.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null
    } catch {
      return null
    }
  }
}

function readStoredRecords(): JsonRecord[] {
  // adoptionStorage deliberately owns normalization and the PAWHOME_ADOPTIONS
  // key.  Its includeDemo:false mode is mandatory for reviewer production data.
  return getAdoptionRecords(REAL_ADOPTION_READ_OPTIONS).map((record) => {
    // The legacy storage normalizer materializes empty compatibility aliases
    // (`ownerPawId`/`cloudParentPawId`) on every record.  An empty alias is
    // absence, not an actor relation; remove only those generated empties so
    // the canonical contract can validate the real relation fields.  Any
    // non-empty alias remains visible and conflicting aliases still fail closed.
    if (!isRecord(record)) return record
    const copy: JsonRecord = { ...record }
    for (const field of ['ownerPawId', 'cloudParentPawId']) {
      if (copy[field] === '') delete copy[field]
    }
    return copy
  })
}

function filterByReviewerRole(records: readonly JsonRecord[], reviewerRole: string): JsonRecord[] {
  if (!reviewerRole) return [...records]
  return records.filter(
    (record) => record && isRecord(record.review) && record.review.reviewerRole === reviewerRole,
  )
}

function idAliasMatches(record: JsonRecord | null, field: string, expected: unknown): boolean {
  const review = record && isRecord(record.review) ? record.review : null
  const values = []
  for (const source of [record, review]) {
    if (!source || !own(source, field)) continue
    values.push(source[field])
  }
  return values.some((value) => value === expected)
}

function findStoredReview(context: StoredReviewContext, reviewerRole: string): JsonRecord | null {
  const records = filterByReviewerRole(readStoredRecords(), reviewerRole)
  const applicationId = context.applicationId
  const reviewItemId = context.reviewItemId
  const matches = records.filter((record) => {
    // A detail lookup is anchored to the nested review item and, when
    // supplied, the exact application alias.  Application-only legacy links
    // are accepted only when they resolve to one and only one review item;
    // there is no first/last/demo fallback and no lookup by applicant or
    // displayed role.
    if (
      reviewItemId &&
      !idAliasMatches(isRecord(record.review) ? record.review : null, 'reviewItemId', reviewItemId)
    )
      return false
    return !applicationId || idAliasMatches(record, 'applicationId', applicationId)
  })
  return matches.length === 1 ? matches[0] : null
}

function reviewList(options: AdoptionReviewListOptions): ReviewListModel {
  const source = optionsOf(options)
  try {
    const reviewerRole = assertReviewerRole(reviewerRoleOf(source.reviewerRole))
    return readReviewListContract({
      actorProvider: source.actorProvider,
      filter: source.filter,
      resolver: () => filterByReviewerRole(readStoredRecords(), reviewerRole),
    })
  } catch (error) {
    return frozenEmptyList(errorCode(error, 'ADOPTION_REVIEW_READ_FAILED'))
  }
}

function reviewDetail(options: AdoptionReviewDetailOptions): ReviewDetailModel {
  const source = optionsOf(options)
  try {
    const reviewerRole = assertReviewerRole(reviewerRoleOf(source.reviewerRole))
    let reviewItemId = source.reviewItemId
    if (!reviewItemId && source.applicationId) {
      const candidate = findStoredReview({ applicationId: source.applicationId }, reviewerRole)
      const nestedReview = candidate && isRecord(candidate.review) ? candidate.review : null
      const nestedReviewItemId = nestedReview && nestedReview.reviewItemId
      const recordReviewItemId = candidate && candidate.reviewItemId
      reviewItemId =
        typeof nestedReviewItemId === 'string'
          ? nestedReviewItemId
          : typeof recordReviewItemId === 'string'
            ? recordReviewItemId
            : ''
    }
    return readReviewDetailContract({
      actorProvider: source.actorProvider,
      applicationId: source.applicationId,
      reviewItemId,
      // This adapter is exclusively the reviewer surface.  A caller cannot
      // switch it into the applicant private-detail branch via query data.
      perspective: 'reviewer',
      resolver: (context: { applicationId?: string; reviewItemId?: string }) =>
        findStoredReview(context, reviewerRole),
    })
  } catch (error) {
    return frozenEmptyDetail(errorCode(error, 'ADOPTION_REVIEW_READ_FAILED'))
  }
}

export function readAdoptionReviewList(options: AdoptionReviewListOptions = {}): ReviewListModel {
  return reviewList(options)
}

export function readAdoptionReviewDetail(
  options: AdoptionReviewDetailOptions = {},
): ReviewDetailModel {
  return reviewDetail(options)
}

export const getAdoptionReviewList = readAdoptionReviewList
export const getAdoptionReviewDetail = readAdoptionReviewDetail
