import type { AddressRecord } from './addressMock.ts'

/** Preview-only shipping address shown by the recorded-state design route. */
export const YARD_CREATE_RECORDED_ADDRESS_MOCK: Readonly<AddressRecord> = Object.freeze({
  id: 'figma-recorded',
  detail: '中意一路鼎丰前城2栋2单元18楼...',
  name: '项子涵',
  phone: '19878675365',
  regionParts: [],
  isDefault: false,
})

export function createYardCreateRecordedAddressMock(): AddressRecord {
  return {
    ...YARD_CREATE_RECORDED_ADDRESS_MOCK,
    regionParts: [...YARD_CREATE_RECORDED_ADDRESS_MOCK.regionParts],
  }
}

export interface YardRecorderStopMetadata {
  durationMs: number | null
  tempFilePath: string
}

export interface YardRecorderStopEvent {
  duration?: number
  tempFilePath?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeYardRecorderStopMetadata(value: unknown): YardRecorderStopMetadata {
  const source = isRecord(value) ? value : {}
  const durationMs = Number(source.duration)
  return {
    durationMs: Number.isFinite(durationMs) ? durationMs : null,
    tempFilePath: typeof source.tempFilePath === 'string' ? source.tempFilePath : '',
  }
}
