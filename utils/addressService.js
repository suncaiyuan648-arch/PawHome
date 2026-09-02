import { REGION_TREE, findRegionPath } from '@/utils/regionMock.js'

function getApiBase() {
  try {
    const app = typeof getApp === 'function' ? getApp() : null
    return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADDRESS_PARSE_API_BASE) ||
      (app && app.globalData && app.globalData.addressParseApiBase) || ''
  } catch (error) {
    return ''
  }
}

function parseRegion(text) {
  const names = []
  let options = REGION_TREE
  for (let level = 0; level < 3; level += 1) {
    const item = options.find(option => option.name && text.includes(option.name))
    if (!item) break
    names.push(item.name)
    options = Array.isArray(item.children) ? item.children : []
  }
  return findRegionPath(names)
}

function parseLocal(text) {
  const normalized = String(text || '').replace(/[，,、]/g, ' ')
  const phoneMatch = normalized.match(/(?:\+?86[-\s]?)?1[3-9]\d{9}/)
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').slice(-11) : ''
  const regionParts = parseRegion(normalized)
  const nameMatch = normalized.match(/(?:联系人|姓名|收件人)\s*[:：]?\s*([\u4e00-\u9fa5]{2,8})/)
  const name = nameMatch ? nameMatch[1] : ''
  const regionEnd = regionParts.length ? normalized.indexOf(regionParts[regionParts.length - 1]) + regionParts[regionParts.length - 1].length : 0
  let detail = normalized.slice(Math.max(0, regionEnd)).trim()
  detail = detail.replace(/^(省|市|区|县)\s*/, '').replace(phone, '').trim()
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

async function requestBackend(text, base) {
  if (!base || typeof uni === 'undefined' || typeof uni.request !== 'function') return null
  return new Promise(resolve => {
    uni.request({
      url: `${String(base).replace(/\/$/, '')}/address/parse`,
      method: 'POST',
      data: { text },
      success: response => {
        const data = response && response.data && (response.data.data || response.data)
        resolve(data && typeof data === 'object' ? data : null)
      },
      fail: () => resolve(null)
    })
  })
}

function normalizeResult(result, fallback) {
  const value = result && typeof result === 'object' ? result : {}
  const backendParts = Array.isArray(value.regionParts)
    ? value.regionParts.filter(Boolean)
    : [value.province, value.city, value.district].filter(Boolean)
  const regionParts = backendParts.length ? backendParts : (fallback.regionParts || [])
  return {
    name: String(value.name || value.contact || fallback.name || '').trim(),
    phone: String(value.phone || value.mobile || fallback.phone || '').trim(),
    regionParts: regionParts.slice(0, 4),
    detail: String(value.detail || value.address || fallback.detail || '').trim()
  }
}

/**
 * Parse pasted text through the configured backend first, then use a local
 * parser for the prototype. The component contract stays stable for a future
 * address-recognition plugin.
 */
export async function recognizeAddress(text) {
  const source = String(text || '').trim()
  const fallback = parseLocal(source)
  const backend = await requestBackend(source, getApiBase())
  return normalizeResult(backend, fallback)
}

export function parseAddressLocally(text) {
  return parseLocal(text)
}
