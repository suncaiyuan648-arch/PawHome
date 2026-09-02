const FALLBACK_PLACES = [
  { id: 'nearby-dingfeng', name: '鼎丰前城', address: '雨花区中意一路167号', distance: '0.4km' },
  { id: 'nearby-xingfu', name: '幸福小区', address: '雨花区中意一路167号', distance: '0.7km' },
  { id: 'nearby-qipai', name: '四个朋友自助棋牌', address: '雨花区中意一路167号', distance: '0.9km' },
  { id: 'nearby-chaoyang', name: '朝阳小区', address: '雨花区中意一路167号', distance: '1.1km' },
  { id: 'nearby-pingan', name: '平安公寓', address: '雨花区中意一路167号', distance: '1.3km' },
  { id: 'nearby-jiayuan', name: '佳园星城', address: '雨花区中意一路167号', distance: '1.6km' },
  { id: 'nearby-tiantianshang', name: '天天向上', address: '雨花区中意一路167号', distance: '1.9km' }
]

function getApiBase() {
  let base = ''
  try {
    base = import.meta.env && import.meta.env.VITE_LOCATION_API_BASE
  } catch (e) {}
  if (!base && typeof getApp === 'function') {
    try {
      const app = getApp()
      base = app && app.globalData && app.globalData.locationApiBase
    } catch (e) {}
  }
  return String(base || '').trim().replace(/\/$/, '')
}

function normalizePlace(item, index) {
  if (!item) return null
  const name = String(item.name || item.title || item.poiName || '').trim()
  const address = String(item.address || item.detail || item.formattedAddress || '').trim()
  if (!name && !address) return null
  const distanceValue = Number(item.distanceMeters ?? item.distance)
  const distance = Number.isFinite(distanceValue)
    ? `${(distanceValue >= 1000 ? distanceValue / 1000 : distanceValue).toFixed(distanceValue >= 1000 ? 1 : 0)}${distanceValue >= 1000 ? 'km' : 'm'}`
    : String(item.distance || '')
  return {
    id: String(item.id || item.uid || `location-${index}`),
    name: name || address,
    address: address || name,
    distance,
    latitude: item.latitude,
    longitude: item.longitude
  }
}

function getPlaceRows(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.list)) return payload.list
  if (Array.isArray(payload.pois)) return payload.pois
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && typeof payload.data === 'object') return getPlaceRows(payload.data)
  return []
}

function fallbackPlaces(city, keyword) {
  const key = String(keyword || '').trim()
  const rows = key
    ? FALLBACK_PLACES.filter(item => `${item.name}${item.address}`.includes(key))
    : FALLBACK_PLACES
  return { city: city || '长沙市', list: rows.map(item => ({ ...item })) }
}

function requestPlaces({ city, latitude, longitude, keyword = '' }) {
  const base = getApiBase()
  if (!base || typeof uni === 'undefined' || typeof uni.request !== 'function') {
    return Promise.resolve(fallbackPlaces(city, keyword))
  }

  const isSearch = !!String(keyword || '').trim()
  const path = isSearch ? '/locations/search' : '/locations/nearby'
  const data = {
    keyword: String(keyword || '').trim(),
    city: city || '',
    latitude,
    longitude
  }
  if (!isSearch) data.radius = 2000
  return new Promise(resolve => {
    uni.request({
      url: `${base}${path}`,
      data,
      success: response => {
        if (!response || (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) {
          resolve(fallbackPlaces(city, keyword))
          return
        }
        const payload = response && response.data ? response.data : {}
        const rows = getPlaceRows(payload)
        resolve({
          city: (payload && payload.city) || city || '长沙市',
          list: rows.map(normalizePlace).filter(Boolean)
        })
      },
      fail: () => resolve(fallbackPlaces(city, keyword))
    })
  })
}

export function getPreciseLocation() {
  if (typeof uni === 'undefined' || typeof uni.getLocation !== 'function') return Promise.resolve(null)
  return new Promise(resolve => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: result => resolve({ latitude: result.latitude, longitude: result.longitude }),
      fail: () => resolve(null)
    })
  })
}

export function fetchLocationPlaces(options = {}) {
  return requestPlaces(options)
}
