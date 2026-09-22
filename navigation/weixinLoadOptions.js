import { isPlainRecord, assertString, fail } from './routeContracts.js'

/**
 * MP-WEIXIN onLoad receives percent-encoded values in the installed uni runtime.
 * Call once at that platform's page boundary, then pass the decoded object to
 * route/legacy validation. Do not call on H5 or on an already decoded object.
 * This adapter does not validate business parameters or grant capabilities.
 */
export function decodeWeixinLoadOptions(options = {}) {
  if (!isPlainRecord(options)) fail('INVALID_LOAD_OPTIONS', 'onLoad options must be a plain object')
  const decoded = Object.create(null)
  for (const rawKey of Object.keys(options)) {
    const rawValue = options[rawKey]
    assertString(rawKey, 'onLoad key', { maxLength: 128 })
    assertString(rawValue, 'onLoad value', { allowEmpty: true, maxLength: 4096 })
    let key, value
    try {
      key = decodeURIComponent(rawKey)
      // Native query values are not form-urlencoded: preserve literal '+'.
      value = decodeURIComponent(rawValue)
    } catch (error) {
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
