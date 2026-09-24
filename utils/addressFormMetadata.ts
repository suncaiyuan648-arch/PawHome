import type { AddressKind } from './addressMock.ts'

export interface AddressFormFields {
  name: string
  phone: string
  detail: string
}

export interface AddressFormDraft extends AddressFormFields {
  regionParts: string[]
  isDefault: boolean
}

export interface AddressFormDemoMetadata extends AddressFormDraft {
  smartText: string
}

const ADDRESS_FORM_DEMO_MOCKS: Record<AddressKind, Readonly<AddressFormDemoMetadata>> = {
  shipping: Object.freeze({
    name: '菠萝吹雪',
    phone: '13366669999',
    detail: '找到一个大树根，绕着大树左转三圈右转三圈',
    regionParts: ['湖南省', '长沙市', '雨花区'],
    isDefault: true,
    smartText: '湖南省长沙市雨花区中意一路167号，菠萝吹雪，13366669999',
  }),
  service: Object.freeze({
    name: '菠萝吹雪',
    phone: '13366669999',
    detail: '鼎丰前程',
    regionParts: ['湖南省', '长沙市', '雨花区'],
    isDefault: true,
    smartText: '湖南省长沙市雨花区中意一路167号，菠萝吹雪，13366669999',
  }),
}

export function createAddressFormDemoMetadata(kind: AddressKind): AddressFormDemoMetadata {
  const mock = ADDRESS_FORM_DEMO_MOCKS[kind]
  return { ...mock, regionParts: [...mock.regionParts] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readText(value: unknown): string {
  if (typeof value === 'string') return value
  return value === undefined || value === null ? '' : String(value)
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((part): part is string => typeof part === 'string' && Boolean(part))
    : []
}

export function normalizeAddressFormDraft(value: unknown): AddressFormDraft {
  const source = isRecord(value) ? value : {}
  return {
    name: readText(source.name),
    phone: readText(source.phone),
    detail: readText(source.detail),
    regionParts: readStringList(source.regionParts).slice(0, 4),
    isDefault: source.isDefault === true,
  }
}

export function normalizeWechatAddressDraft(value: unknown): AddressFormDraft {
  const source = isRecord(value) ? value : {}
  const regionParts = [source.provinceName, source.cityName, source.countyName].filter(
    (part): part is string => typeof part === 'string' && Boolean(part),
  )

  return {
    name: readText(source.userName),
    phone: readText(source.telNumber),
    detail: readText(source.detailInfo),
    regionParts,
    isDefault: false,
  }
}
