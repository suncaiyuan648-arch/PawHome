import { createLocationFallbackMetadata, type LocationPlace, type LocationPlacesResult } from './locationMetadata.ts'

export type { LocationPlace, LocationPlacesResult } from './locationMetadata.ts'

export interface PreciseLocation {
  latitude: number
  longitude: number
}

export interface LocationPlacesOptions {
  city?: string
  latitude?: number
  longitude?: number
  keyword?: string
}

interface LocationCandidate extends Record<string, unknown> {
  name?: unknown
  title?: unknown
  poiName?: unknown
  address?: unknown
  detail?: unknown
  formattedAddress?: unknown
  distanceMeters?: unknown
  distance?: unknown
  id?: unknown
  uid?: unknown
  latitude?: unknown
  longitude?: unknown
}

interface LocationRequestResponse {
  statusCode?: number
  data?: unknown
}

interface LocationRequestOptions {
  url: string
  data: Record<string, unknown>
  success?: (response: LocationRequestResponse) => void
  fail?: () => void
}

interface LocationApi {
  request?: (options: LocationRequestOptions) => void
  getLocation?: (options: {
    type: 'gcj02'
    isHighAccuracy: true
    success?: (result: { latitude: number; longitude: number }) => void
    fail?: () => void
  }) => void
}

function getApiBase(): string {
  let base: unknown
  try {
    base = import.meta.env && import.meta.env.VITE_LOCATION_API_BASE
  } catch {
    base = ''
  }
  if (!base && typeof getApp === 'function') {
    try {
      const app = getApp()
      base = app && app.globalData && app.globalData.locationApiBase
    } catch {
      base = ''
    }
  }
  return String(base || '').trim().replace(/\/$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function asCandidate(value: unknown): LocationCandidate {
  return isRecord(value) ? value : {}
}

function normalizeCoordinate(value: unknown, minimum: number, maximum: number): number | undefined {
  const coordinate = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum ? coordinate : undefined
}

export function normalizeLocationPlace(item: unknown, index: number): LocationPlace | null {
  const candidate = asCandidate(item)
  const name = String(candidate.name || candidate.title || candidate.poiName || '').trim()
  const address = String(candidate.address || candidate.detail || candidate.formattedAddress || '').trim()
  if (!name && !address) return null
  const distanceValue = Number(candidate.distanceMeters ?? candidate.distance)
  const distance = Number.isFinite(distanceValue)
    ? `${(distanceValue >= 1000 ? distanceValue / 1000 : distanceValue).toFixed(distanceValue >= 1000 ? 1 : 0)}${distanceValue >= 1000 ? 'km' : 'm'}`
    : String(candidate.distance || '')
  return {
    id: String(candidate.id || candidate.uid || `location-${index}`),
    name: name || address,
    address: address || name,
    distance,
    latitude: normalizeCoordinate(candidate.latitude, -90, 90),
    longitude: normalizeCoordinate(candidate.longitude, -180, 180)
  }
}

function getPlaceRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const candidate = asCandidate(payload)
  if (Array.isArray(candidate.list)) return candidate.list
  if (Array.isArray(candidate.pois)) return candidate.pois
  if (Array.isArray(candidate.results)) return candidate.results
  if (Array.isArray(candidate.data)) return candidate.data
  if (candidate.data && typeof candidate.data === 'object') return getPlaceRows(candidate.data)
  return []
}

function fallbackPlaces(city: string | undefined, keyword: string | undefined): LocationPlacesResult {
  return createLocationFallbackMetadata(city, keyword)
}

function isLocationApi(value: unknown): value is LocationApi {
  if (!isRecord(value)) return false
  const request = value.request
  const getLocation = value.getLocation
  return (request === undefined || typeof request === 'function')
    && (getLocation === undefined || typeof getLocation === 'function')
}

function requestPlaces({ city, latitude, longitude, keyword = '' }: LocationPlacesOptions = {}): Promise<LocationPlacesResult> {
  const base = getApiBase()
  if (!base || typeof uni === 'undefined') {
    return Promise.resolve(fallbackPlaces(city, keyword))
  }
  const locationApi: unknown = uni
  if (!isLocationApi(locationApi) || typeof locationApi.request !== 'function') {
    return Promise.resolve(fallbackPlaces(city, keyword))
  }
  const request = locationApi.request

  const isSearch = !!String(keyword || '').trim()
  const path = isSearch ? '/locations/search' : '/locations/nearby'
  const data: Record<string, unknown> = {
    keyword: String(keyword || '').trim(),
    city: city || '',
    latitude,
    longitude
  }
  if (!isSearch) data.radius = 2000
  return new Promise(resolve => {
    request({
      url: `${base}${path}`,
      data,
      success: response => {
        if (!response || (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) {
          resolve(fallbackPlaces(city, keyword))
          return
        }
        const payload = response && response.data ? response.data : {}
        const payloadRecord = asCandidate(payload)
        const rows = getPlaceRows(payload)
        resolve({
          city: String(payloadRecord.city || city || '长沙市'),
          list: rows
            .map(normalizeLocationPlace)
            .filter((place): place is LocationPlace => Boolean(place))
        })
      },
      fail: () => resolve(fallbackPlaces(city, keyword))
    })
  })
}

export function getPreciseLocation(): Promise<PreciseLocation | null> {
  if (typeof uni === 'undefined') return Promise.resolve(null)
  const locationApi: unknown = uni
  if (!isLocationApi(locationApi) || typeof locationApi.getLocation !== 'function') return Promise.resolve(null)
  const getLocation = locationApi.getLocation
  return new Promise(resolve => {
    getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: result => resolve({ latitude: result.latitude, longitude: result.longitude }),
      fail: () => resolve(null)
    })
  })
}

export function fetchLocationPlaces(options: LocationPlacesOptions = {}): Promise<LocationPlacesResult> {
  return requestPlaces(options)
}
