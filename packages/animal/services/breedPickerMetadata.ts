export type BreedPickerKind = 'cat' | 'dog'

export type BreedPickerPopup = '' | 'supplement' | 'supplement-input' | 'supplement-success'

export interface BreedPickerPageState {
	kind: BreedPickerKind
	searchKey: string
	customList: string[]
	selected: string
	showSup: boolean
	supInput: string
	showSupResult: boolean
	pendingSupBreed: string
}

export interface BreedPickerRoute {
	kind: BreedPickerKind
	popup: BreedPickerPopup
}

const BREED_PICKER_MOCKS: Readonly<Record<BreedPickerKind, readonly string[]>> = Object.freeze({
	cat: Object.freeze(['白猫', '橘猫', '狸花猫', '三花猫', '简州猫', '奶牛猫', '英短', '美短']),
	dog: Object.freeze(['中华田园犬', '比熊', '哈士奇', '阿拉斯加', '萨摩耶', '泰迪', '柴犬', '柯基']),
})

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function createBreedPickerPageState(): BreedPickerPageState {
	return {
		kind: 'cat',
		searchKey: '',
		customList: [],
		selected: '',
		showSup: false,
		supInput: '',
		showSupResult: false,
		pendingSupBreed: '',
	}
}

export function normalizeBreedPickerRoute(value: unknown): BreedPickerRoute {
	const route = isRecord(value) ? value : {}
	const kind: BreedPickerKind = route.species === 'dog' || route.kind === 'dog' ? 'dog' : 'cat'
	const popup: BreedPickerPopup = route.popup === 'supplement'
		|| route.popup === 'supplement-input'
		|| route.popup === 'supplement-success'
		? route.popup
		: ''
	return { kind, popup }
}

export function createBreedPickerBaseList(kind: BreedPickerKind): string[] {
	return [...BREED_PICKER_MOCKS[kind]]
}

export function createBreedPickerList(kind: BreedPickerKind, customList: readonly string[]): string[] {
	return [...new Set([...BREED_PICKER_MOCKS[kind], ...customList.filter((breed) => typeof breed === 'string')])]
}

export function normalizeBreedPickerInitPayload(value: unknown): string {
	if (!isRecord(value) || typeof value.breed !== 'string') return ''
	return value.breed.trim()
}

export function readBreedPickerInputValue(value: unknown): string {
	if (!isRecord(value) || !isRecord(value.detail) || typeof value.detail.value !== 'string') return ''
	return value.detail.value
}
