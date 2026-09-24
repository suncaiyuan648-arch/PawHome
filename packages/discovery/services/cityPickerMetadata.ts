export interface CityGroup {
	letter: string
	cities: string[]
}

export interface CityPickerPageState {
	keyword: string
	selectedCity: string
	currentCity: string
	selectedIndex: string
	hotCities: string[]
}

const CITY_GROUPS: readonly CityGroup[] = [
	{ letter: 'A', cities: ['阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝', '阿坝'] },
	{ letter: 'B', cities: ['北京', '保定', '包头', '北海', '蚌埠'] },
	{ letter: 'C', cities: ['重庆', '成都', '长沙', '长春', '常州'] },
	{ letter: 'D', cities: ['大连', '东莞', '大庆', '德州', '达州'] },
	{ letter: 'E', cities: ['鄂尔多斯', '恩施'] },
	{ letter: 'F', cities: ['福州', '佛山', '阜阳', '抚州'] },
	{ letter: 'G', cities: ['广州', '贵阳', '桂林', '赣州', '贵港'] },
	{ letter: 'H', cities: ['杭州', '合肥', '哈尔滨', '海口', '呼和浩特', '惠州'] },
	{ letter: 'J', cities: ['济南', '嘉兴', '金华', '九江', '吉林'] },
	{ letter: 'K', cities: ['昆明', '开封'] },
	{ letter: 'L', cities: ['兰州', '洛阳', '临沂', '柳州', '廊坊'] },
	{ letter: 'M', cities: ['绵阳', '茂名', '马鞍山'] },
	{ letter: 'N', cities: ['南京', '宁波', '南昌', '南宁', '南通'] },
	{ letter: 'P', cities: ['平顶山', '莆田', '濮阳', '攀枝花'] },
	{ letter: 'Q', cities: ['青岛', '泉州', '秦皇岛', '齐齐哈尔'] },
	{ letter: 'R', cities: ['日照', '日喀则'] },
	{ letter: 'S', cities: ['上海', '深圳', '沈阳', '苏州', '石家庄', '三亚', '绍兴'] },
	{ letter: 'T', cities: ['天津', '太原', '唐山', '台州', '泰州'] },
	{ letter: 'W', cities: ['武汉', '无锡', '温州', '潍坊', '乌鲁木齐'] },
	{ letter: 'X', cities: ['西安', '厦门', '徐州', '襄阳', '咸阳'] },
	{ letter: 'Y', cities: ['银川', '烟台', '扬州', '宜昌', '岳阳'] },
	{ letter: 'Z', cities: ['郑州', '珠海', '中山', '漳州', '淄博', '遵义'] }
]

const HOT_CITIES: readonly string[] = ['北京', '上海', '广州', '深圳', '重庆', '成都', '武汉', '天津', '杭州', '郑州', '长沙', '合肥']

function cloneCityGroups(groups: readonly CityGroup[]): CityGroup[] {
	return groups.map((group) => ({ letter: group.letter, cities: [...group.cities] }))
}

export function createCityPickerPageMetadata(): CityPickerPageState {
	return {
		keyword: '',
		selectedCity: '',
		currentCity: '郑州市',
		selectedIndex: 'A',
		hotCities: [...HOT_CITIES]
	}
}

export function createCityGroups(): CityGroup[] {
	return cloneCityGroups(CITY_GROUPS)
}

export function filterCityGroups(keyword: string): CityGroup[] {
	const normalizedKeyword = keyword.trim()
	if (!normalizedKeyword) return createCityGroups()

	return CITY_GROUPS
		.map((group) => ({
			letter: group.letter,
			cities: group.cities.filter((city) => city.includes(normalizedKeyword))
		}))
		.filter((group) => group.cities.length > 0)
}

export function createCityPickerIndexLabels(): string[] {
	return ['热门', ...CITY_GROUPS.map((group) => group.letter)]
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function decodeCurrentCity(value: unknown): string {
	const raw = typeof value === 'string'
		? value
		: typeof value === 'number' && Number.isFinite(value) && value !== 0
			? String(value)
			: ''
	if (!raw) return ''
	try {
		return decodeURIComponent(raw)
	} catch {
		return raw
	}
}

export function normalizeCityPickerRoute(value: unknown): string {
	const route = isRecord(value) ? value : {}
	return decodeCurrentCity(route.current) || '郑州市'
}
