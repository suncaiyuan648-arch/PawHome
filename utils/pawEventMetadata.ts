function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export interface PawEventTouchPoint {
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  x?: number
  y?: number
}

export function readPawEventDetail(event: unknown): PawEventDetail | undefined {
  if (!isRecord(event) || !isRecord(event.detail)) return undefined
  return event.detail
}

export function readPawEventValue(event: unknown): string {
  const value = readPawEventDetail(event)?.value
  return typeof value === 'string' ? value : ''
}

export function readPawEventNumber(event: unknown, key: string): number {
  const value = readPawEventDetail(event)?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }
  return 0
}

export function readPawEventDatasetValue(event: unknown, key: string): unknown {
  if (!isRecord(event) || !isRecord(event.currentTarget)) return undefined
  const dataset = event.currentTarget.dataset
  return isRecord(dataset) ? dataset[key] : undefined
}
