export interface LocationPlace {
  id: string
  name: string
  address: string
  distance: string
  latitude?: number
  longitude?: number
}

export interface LocationPlacesResult {
  city: string
  list: LocationPlace[]
}

const FALLBACK_LOCATION_PLACES: readonly LocationPlace[] = Object.freeze([
  { id: 'nearby-dingfeng', name: '鼎丰前城', address: '雨花区中意一路167号', distance: '0.4km' },
  { id: 'nearby-xingfu', name: '幸福小区', address: '雨花区中意一路167号', distance: '0.7km' },
  { id: 'nearby-qipai', name: '四个朋友自助棋牌', address: '雨花区中意一路167号', distance: '0.9km' },
  { id: 'nearby-chaoyang', name: '朝阳小区', address: '雨花区中意一路167号', distance: '1.1km' },
  { id: 'nearby-pingan', name: '平安公寓', address: '雨花区中意一路167号', distance: '1.3km' },
  { id: 'nearby-jiayuan', name: '佳园星城', address: '雨花区中意一路167号', distance: '1.6km' },
  { id: 'nearby-tiantianshang', name: '天天向上', address: '雨花区中意一路167号', distance: '1.9km' }
])

export function createLocationFallbackMetadata(city?: string, keyword?: string): LocationPlacesResult {
  const searchText = String(keyword || '').trim()
  const places = searchText
    ? FALLBACK_LOCATION_PLACES.filter(place => `${place.name}${place.address}`.includes(searchText))
    : FALLBACK_LOCATION_PLACES

  return {
    city: city || '长沙市',
    list: places.map(place => ({ ...place }))
  }
}
