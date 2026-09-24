import { REGION_TREE, findRegionPath } from '@/utils/regionMock.ts'

export interface AddressRecognitionResult {
  name: string
  phone: string
  regionParts: string[]
  detail: string
}

interface AddressCandidate extends Record<string, unknown> {
  data?: unknown
  regionParts?: unknown
  province?: unknown
  city?: unknown
  district?: unknown
  name?: unknown
  contact?: unknown
  phone?: unknown
  mobile?: unknown
  detail?: unknown
  address?: unknown
}

interface AddressRequestResponse {
  data?: unknown
}

interface AddressRequestOptions {
  url: string
  method: 'POST'
  data: { text: string }
  success?: (response: AddressRequestResponse) => void
  fail?: () => void
}

interface AddressRequestApi {
  request?: (options: AddressRequestOptions) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function asCandidate(value: unknown): AddressCandidate {
  return isRecord(value) ? value : {}
}

function textValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function getApiBase(): string {
  try {
    const app = typeof getApp === 'function' ? getApp() : null
    return (
      (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_ADDRESS_PARSE_API_BASE) ||
      (app && app.globalData && app.globalData.addressParseApiBase) ||
      ''
    )
  } catch {
    return ''
  }
}

function parseRegion(text: string): string[] {
  const names = []
  let options = REGION_TREE
  for (let level = 0; level < 3; level += 1) {
    const item = options.find((option) => option.name && text.includes(option.name))
    if (!item) break
    names.push(item.name)
    options = Array.isArray(item.children) ? item.children : []
  }
  return findRegionPath(names)
}

function parseLocal(text: string): AddressRecognitionResult {
  const normalized = String(text || '').replace(/[，,、]/g, ' ')
  const phoneMatch = normalized.match(/(?:\+?86[-\s]?)?1[3-9]\d{9}/)
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').slice(-11) : ''
  const regionParts = parseRegion(normalized)
  const nameMatch = normalized.match(/(?:联系人|姓名|收件人)\s*[:：]?\s*([\u4e00-\u9fa5]{2,8})/)
  const name = nameMatch ? nameMatch[1] : ''
  const regionEnd = regionParts.length
    ? normalized.indexOf(regionParts[regionParts.length - 1]) +
      regionParts[regionParts.length - 1].length
    : 0
  let detail = normalized.slice(Math.max(0, regionEnd)).trim()
  detail = detail
    .replace(/^(省|市|区|县)\s*/, '')
    .replace(phone, '')
    .trim()
  if (nameMatch) detail = detail.replace(nameMatch[0], '').trim()
  let inferredName = ''
  const tailName = detail.match(/(?:^|\s)([\u4e00-\u9fa5]{2,8})$/)
  if (!name && tailName && /(?:号|栋|室|路|街|村)/.test(detail.slice(0, tailName.index))) {
    inferredName = tailName[1]
    detail = detail.slice(0, tailName.index).trim()
  }
  detail = detail.replace(/^[:：\s]+|[:：\s]+$/g, '').trim()
  return { name: name || inferredName, phone, regionParts, detail }
}

async function requestBackend(text: string, base: string): Promise<AddressCandidate | null> {
  if (!base || typeof uni === 'undefined') return null
  const requestApi = uni as unknown as AddressRequestApi
  if (typeof requestApi.request !== 'function') return null
  const request = requestApi.request
  return new Promise((resolve) => {
    request({
      url: `${String(base).replace(/\/$/, '')}/address/parse`,
      method: 'POST',
      data: { text },
      success: (response) => {
        const responseData = response && response.data
        const responseRecord = asCandidate(responseData)
        const data = isRecord(responseRecord.data) ? responseRecord.data : responseRecord
        resolve(isRecord(data) ? data : null)
      },
      fail: () => resolve(null),
    })
  })
}

function normalizeResult(
  result: AddressCandidate | null,
  fallback: AddressRecognitionResult,
): AddressRecognitionResult {
  const value = asCandidate(result)
  const backendParts = Array.isArray(value.regionParts)
    ? value.regionParts.map(textValue).filter(Boolean)
    : [value.province, value.city, value.district].map(textValue).filter(Boolean)
  const regionParts = backendParts.length ? backendParts : fallback.regionParts || []
  return {
    name: textValue(value.name || value.contact || fallback.name || ''),
    phone: textValue(value.phone || value.mobile || fallback.phone || ''),
    regionParts: regionParts.slice(0, 4),
    detail: textValue(value.detail || value.address || fallback.detail || ''),
  }
}

/**
 * Parse pasted text through the configured backend first, then use a local
 * parser for the prototype. The component contract stays stable for a future
 * address-recognition plugin.
 */
export async function recognizeAddress(text: string): Promise<AddressRecognitionResult> {
  const source = text.trim()
  const fallback = parseLocal(source)
  const backend = await requestBackend(source, getApiBase())
  return normalizeResult(backend, fallback)
}

export function parseAddressLocally(text: string): AddressRecognitionResult {
  return parseLocal(text.trim())
}
