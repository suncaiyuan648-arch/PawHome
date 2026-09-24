const STORAGE_KEY = 'pawhome.addressBook.v1'

export type AddressKind = 'shipping' | 'service'

import type { AddressRecord } from '../contracts/address.ts'
export type { AddressRecord } from '../contracts/address.ts'

export type AddressPickedPayload = Pick<
  AddressRecord,
  'id' | 'name' | 'phone' | 'regionParts' | 'detail' | 'isDefault'
>

export function toAddressPickedPayload(address: AddressRecord): AddressPickedPayload {
  return {
    id: address.id,
    name: address.name,
    phone: address.phone,
    regionParts: [...address.regionParts],
    detail: address.detail,
    isDefault: address.isDefault,
  }
}

export interface AddressBook {
  shipping: AddressRecord[]
  service: AddressRecord[]
}

const DEFAULT_SHIPPING: AddressRecord[] = [
  {
    id: 'shipping-1',
    name: '项子涵',
    phone: '13366669999',
    regionParts: ['湖南省', '长沙市', '雨花区'],
    detail: '中意一路167号鼎丰前城2栋2单元18楼天台',
    isDefault: true,
  },
  {
    id: 'shipping-2',
    name: '项子涵',
    phone: '13366669999',
    regionParts: ['湖南省', '长沙市', '雨花区'],
    detail: '中意一路167号鼎丰前城2栋2单元18楼天台',
    isDefault: false,
  },
]

const DEFAULT_SERVICE: AddressRecord[] = [
  {
    id: 'service-1',
    name: '李阿姨',
    phone: '13800001111',
    regionParts: ['湖南省', '长沙市', '雨花区'],
    detail: '中意一路167号2栋天台喂养点',
    isDefault: true,
  },
  {
    id: 'service-2',
    name: '何师傅',
    phone: '13900002222',
    regionParts: ['湖南省', '长沙市', '天心区'],
    detail: '芙蓉中路三段领养服务站',
    isDefault: false,
  },
  {
    id: 'service-3',
    name: '王站长',
    phone: '13700003333',
    regionParts: ['湖南省', '长沙市', '岳麓区'],
    detail: '银杉路城市流浪动物救助点',
    isDefault: false,
  },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function storageRead(): unknown {
  try {
    return typeof uni !== 'undefined' && uni.getStorageSync ? uni.getStorageSync(STORAGE_KEY) : null
  } catch {
    return null
  }
}

function storageWrite(value: AddressBook): void {
  try {
    if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(STORAGE_KEY, value)
  } catch {
    // Local mock storage is best-effort in non-WeChat test environments.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeAddressList(list: unknown): AddressRecord[] {
  const source = Array.isArray(list) ? list : []
  let defaultFound = false
  const normalized = source.map((item) => {
    const value = isRecord(item) ? item : {}
    const isDefault = value.isDefault === true && !defaultFound
    if (isDefault) defaultFound = true
    return {
      ...value,
      id: typeof value.id === 'string' ? value.id : String(value.id || ''),
      name: typeof value.name === 'string' ? value.name : String(value.name || ''),
      phone: typeof value.phone === 'string' ? value.phone : String(value.phone || ''),
      regionParts: Array.isArray(value.regionParts)
        ? value.regionParts
            .filter((part): part is string => typeof part === 'string' && Boolean(part))
            .slice(0, 4)
        : [],
      detail: typeof value.detail === 'string' ? value.detail : String(value.detail || ''),
      isDefault,
    }
  })
  // Keep the user's address order stable. Default state is independent from
  // list ordering and must not move an address after switching.
  return normalized
}

function normalizeBook(book: unknown): AddressBook {
  const source = isRecord(book) ? book : {}
  return {
    shipping: normalizeAddressList(
      Array.isArray(source.shipping) ? source.shipping : clone(DEFAULT_SHIPPING),
    ),
    service: normalizeAddressList(
      Array.isArray(source.service) ? source.service : clone(DEFAULT_SERVICE),
    ),
  }
}

function readBook(): AddressBook {
  return normalizeBook(storageRead())
}

function writeBook(book: AddressBook): AddressBook {
  const normalized = normalizeBook(book)
  storageWrite(normalized)
  return normalized
}

export function getAddressList(kind: AddressKind = 'shipping'): AddressRecord[] {
  const book = readBook()
  return clone(book[kind === 'service' ? 'service' : 'shipping'])
}

export function getAddressById(id: string, kind: AddressKind = 'shipping'): AddressRecord | null {
  const value = String(id || '')
  return getAddressList(kind).find((item) => String(item.id) === value) || null
}

export function saveAddress(
  address: Partial<AddressRecord> = {},
  kind: AddressKind = 'shipping',
): AddressRecord {
  const key = kind === 'service' ? 'service' : 'shipping'
  const book = readBook()
  const list = Array.isArray(book[key]) ? book[key].slice() : []
  const current = address || {}
  const normalized: AddressRecord = {
    ...current,
    id: typeof current.id === 'string' && current.id ? current.id : `${key}-${Date.now()}`,
    name: String(current.name || '').trim(),
    phone: String(current.phone || '').trim(),
    regionParts: Array.isArray(current.regionParts)
      ? current.regionParts
          .filter((part): part is string => typeof part === 'string' && Boolean(part))
          .slice(0, 4)
      : [],
    detail: String(current.detail || '').trim(),
    isDefault: current.isDefault === true || list.length === 0,
  }
  const index = list.findIndex((item) => String(item.id) === String(normalized.id))
  if (index >= 0) list.splice(index, 1, normalized)
  else list.push(normalized)
  if (normalized.isDefault)
    list.forEach((item) => {
      item.isDefault = String(item.id) === String(normalized.id)
    })
  else if (!list.some((item) => item.isDefault) && list[0]) list[0].isDefault = true
  const written = writeBook({ ...book, [key]: list })
  return clone(written[key].find((item) => String(item.id) === String(normalized.id)) || normalized)
}

export function deleteAddress(id: string, kind: AddressKind = 'shipping'): AddressRecord[] {
  const key = kind === 'service' ? 'service' : 'shipping'
  const book = readBook()
  let list = (book[key] || []).filter((item) => String(item.id) !== String(id))
  if (!list.some((item) => item.isDefault) && list[0])
    list = list.map((item, index) => ({ ...item, isDefault: index === 0 }))
  const written = writeBook({ ...book, [key]: list })
  return clone(written[key])
}

export function setDefaultAddress(id: string, kind: AddressKind = 'shipping'): AddressRecord[] {
  const key = kind === 'service' ? 'service' : 'shipping'
  const book = readBook()
  const list = (book[key] || []).map((item) => ({
    ...item,
    isDefault: String(item.id) === String(id),
  }))
  const written = writeBook({ ...book, [key]: list })
  return clone(written[key])
}

export function clearAddressBook(): void {
  storageWrite({ shipping: [], service: [] })
}
