/**
 * Production binding for message/task deep links.
 *
 * `deeplinkContracts.ts` remains the policy boundary. This module only
 * connects that boundary to the persisted records that already exist in the
 * repository. It never enables demo fallback, never writes, and never lets a
 * route/query value stand in for a trusted actor or a current record.
 *
 * Dynamic and normal feeding records are read from their persisted keys when
 * those keys are present. A missing key still resolves to `READER_MISSING`
 * rather than a fixture or the first visible card. Callers may provide a
 * reviewed production reader at construction time; the reader receives stable
 * IDs and the resolved actor only.
 */

import {
  resolveDeepLink,
  type DeepLinkActor,
  type DeepLinkAuthorizer,
  type DeepLinkEnvelope,
  type DeepLinkInput,
  type DeepLinkResolution,
} from './deeplinkContracts.ts'
import { getAdoptionById } from '../utils/adoptionStorage.ts'
import { getRescueById } from '../utils/rescueStorage.ts'
import { findRewardOrderById } from '../utils/rewardOrderStorage.ts'

export type ProductionDeepLinkBusinessType = 'adoption' | 'rescue' | 'feeding' | 'dynamic'

export interface ProductionDeepLinkReaderContext {
  businessType: ProductionDeepLinkBusinessType
  businessId?: string
  reviewItemId?: string
  actor?: DeepLinkActor | null
}

export type ProductionDeepLinkReader = (context: ProductionDeepLinkReaderContext) => unknown

export interface ProductionDeepLinkConfig {
  actorProvider?: () => unknown
  authorize?: DeepLinkAuthorizer
  readers?: Partial<Record<ProductionDeepLinkBusinessType, ProductionDeepLinkReader | null>>
}

export interface ProductionDeepLinkResolver {
  resolve: (input: DeepLinkInput | DeepLinkEnvelope) => DeepLinkResolution
  resolveMessage: (input: DeepLinkInput | DeepLinkEnvelope) => DeepLinkResolution
  resolveTask: (input: DeepLinkInput | DeepLinkEnvelope) => DeepLinkResolution
  readers: Readonly<Record<ProductionDeepLinkBusinessType, ProductionDeepLinkReader | null>>
}

type PersistedRows = {
  present: boolean
  rows: unknown[]
}

type ReaderMap = Record<ProductionDeepLinkBusinessType, ProductionDeepLinkReader | null>

export const BUSINESS_TYPES: readonly ProductionDeepLinkBusinessType[] = Object.freeze([
  'adoption',
  'rescue',
  'feeding',
  'dynamic',
])

const CONFIG_KEYS = new Set(['actorProvider', 'authorize', 'readers'])

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isObjectRecord(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isBusinessType(value: string): value is ProductionDeepLinkBusinessType {
  return BUSINESS_TYPES.some((candidate) => candidate === value)
}

function isReader(value: unknown): value is ProductionDeepLinkReader {
  return typeof value === 'function'
}

function assertConfig(config: unknown): asserts config is ProductionDeepLinkConfig {
  if (!isPlainRecord(config))
    throw new TypeError('production deep-link options must be a plain object')
  for (const key of Object.keys(config)) {
    if (!CONFIG_KEYS.has(key)) throw new TypeError(`Unknown production deep-link option: ${key}`)
  }
}

function missingReader(): never {
  const error = Object.assign(
    new Error('A persisted reader is not registered for this deep-link domain'),
    {
      code: 'READER_MISSING',
    },
  )
  throw error
}

function withIdentity(record: unknown, field: string, id: string | undefined): unknown {
  if (!isObjectRecord(record)) return record
  // Legacy storage uses `id`; the deep-link contract requires a domain
  // identity alias so a reader cannot accidentally return a neighbouring
  // record. This is a defensive projection, not a second storage record.
  return Object.freeze({ ...record, [field]: record[field] || record.id || id })
}

function persistedRows(key: string): PersistedRows {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
    return { present: false, rows: [] }
  }
  let raw: unknown
  try {
    raw = uni.getStorageSync(key)
  } catch {
    return { present: true, rows: [] }
  }
  if (raw === undefined || raw === null || raw === '') return { present: false, rows: [] }
  try {
    const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(value) ? { present: true, rows: value } : { present: true, rows: [] }
  } catch {
    return { present: true, rows: [] }
  }
}

function persistedById(
  keys: readonly string[],
  businessId: string | undefined,
  aliases: readonly string[],
  identityField: string,
): unknown {
  for (const key of keys) {
    const source = persistedRows(key)
    if (!source.present) continue
    const record = source.rows.find(
      (item: unknown) =>
        isObjectRecord(item) && aliases.some((field) => item[field] === businessId),
    )
    if (record !== undefined) return withIdentity(record, identityField, businessId)
  }
  return missingReader()
}

const DEFAULT_READERS: Readonly<ReaderMap> = Object.freeze({
  adoption: ({ businessId }) =>
    businessId
      ? withIdentity(
          getAdoptionById(businessId, { includeDemo: false }),
          'applicationId',
          businessId,
        )
      : missingReader(),
  rescue: ({ businessId }) =>
    businessId ? getRescueById(businessId, { includeDemo: false }) : missingReader(),
  feeding: ({ businessId }) => {
    if (!businessId) return missingReader()
    const reward = findRewardOrderById(businessId)
    if (reward) return withIdentity(reward, 'orderId', businessId)
    return persistedById(['PAWHOME_FEEDING_ORDERS'], businessId, ['orderId', 'id'], 'orderId')
  },
  dynamic: ({ businessId }) =>
    persistedById(['PAWHOME_DYNAMIC_RECORDS'], businessId, ['dynamicId', 'id'], 'dynamicId'),
})

function normalizeReaders(value: unknown): Readonly<ReaderMap> {
  if (value === undefined) return DEFAULT_READERS
  if (!isPlainRecord(value))
    throw new TypeError('production deep-link readers must be a plain object')
  for (const key of Object.keys(value)) {
    if (!isBusinessType(key)) throw new TypeError(`Unknown deep-link reader domain: ${key}`)
    const reader = value[key]
    if (reader !== null && typeof reader !== 'function') {
      throw new TypeError(`${key} deep-link reader must be a function or null`)
    }
  }
  const readers: ReaderMap = { ...DEFAULT_READERS }
  for (const businessType of BUSINESS_TYPES) {
    if (own(value, businessType)) {
      const reader = value[businessType]
      if (reader === null) readers[businessType] = null
      else if (isReader(reader)) readers[businessType] = reader
      else missingReader()
    }
  }
  return Object.freeze(readers)
}

function own(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function readerFor(
  readers: Readonly<ReaderMap>,
  context: ProductionDeepLinkReaderContext,
): unknown {
  const reader = readers[context.businessType]
  if (typeof reader !== 'function') return missingReader()
  return reader(
    Object.freeze({
      businessType: context.businessType,
      ...(context.businessId === undefined ? {} : { businessId: context.businessId }),
      ...(context.reviewItemId === undefined ? {} : { reviewItemId: context.reviewItemId }),
      actor: context.actor,
    }),
  )
}

/** Create one stable resolver for the current production storage boundary. */
export function createProductionDeepLinkResolver(
  config: ProductionDeepLinkConfig = {},
): ProductionDeepLinkResolver {
  assertConfig(config)
  const readers = normalizeReaders(config.readers)
  const resolverOptions = Object.freeze({
    ...(config.actorProvider === undefined ? {} : { actorProvider: config.actorProvider }),
    resolver: (context: ProductionDeepLinkReaderContext) => readerFor(readers, context),
    ...(config.authorize === undefined ? {} : { authorize: config.authorize }),
  })
  const resolve = (input: DeepLinkInput | DeepLinkEnvelope): DeepLinkResolution =>
    resolveDeepLink(input, resolverOptions)
  return Object.freeze({
    resolve,
    resolveMessage: resolve,
    resolveTask: resolve,
    readers,
  })
}

/** One-shot production entry point for message/task callers. */
export function resolveProductionDeepLink(
  input: DeepLinkInput | DeepLinkEnvelope,
  config: ProductionDeepLinkConfig = {},
): DeepLinkResolution {
  return createProductionDeepLinkResolver(config).resolve(input)
}

export const resolveProductionMessageDeepLink = resolveProductionDeepLink
export const resolveProductionTaskDeepLink = resolveProductionDeepLink

export { DEFAULT_READERS }
export type { DeepLinkResolution }
