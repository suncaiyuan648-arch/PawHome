import { isPlainRecord, assertString, fail } from './routeContracts.ts'

export type WeixinLoadOptions = Record<string, string>

/**
 * MP-WEIXIN onLoad receives percent-encoded values in the installed uni runtime.
 * Call once at that platform's page boundary, then pass the decoded object to
 * route/legacy validation. Do not call on H5 or on an already decoded object.
 * This adapter does not validate business parameters or grant capabilities.
 */
export function decodeWeixinLoadOptions(options: unknown = {}): WeixinLoadOptions {
  if (!isPlainRecord(options)) fail('INVALID_LOAD_OPTIONS', 'onLoad options must be a plain object')
  const source = options as Record<string, unknown>
  const decoded = Object.create(null) as WeixinLoadOptions
  for (const rawKey of Object.keys(source)) {
    const rawValue = source[rawKey]
    assertString(rawKey, 'onLoad key', { maxLength: 128 })
    assertString(rawValue, 'onLoad value', { allowEmpty: true, maxLength: 4096 })
    const encodedValue = rawValue as string
    let key = ''
    let value = ''
    try {
      key = decodeURIComponent(rawKey)
      // Native query values are not form-urlencoded: preserve literal '+'.
      value = decodeURIComponent(encodedValue)
    } catch {
      fail('MALFORMED_ENCODING', 'onLoad options contain malformed percent encoding')
    }
    assertString(key, 'decoded onLoad key', { maxLength: 128 })
    assertString(value, 'decoded onLoad value', { allowEmpty: true, maxLength: 4096 })
    if (['__proto__', 'prototype', 'constructor'].includes(key)) {
      fail('PROTOTYPE_KEY', 'onLoad options contain a prototype key')
    }
    if (Object.prototype.hasOwnProperty.call(decoded, key)) {
      fail('DUPLICATE_PARAMETER', 'onLoad keys collide after decoding', { key })
    }
    decoded[key] = value
  }
  return decoded
}
