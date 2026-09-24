export interface PawImageCropperImageInfo {
	width: number
	height: number
}

export interface PawImageCropperPinchState {
	type: 'pinch'
	distance: number
	scale: number
}

export interface PawImageCropperDragState {
	type: 'drag'
	x: number
	y: number
	offsetX: number
	offsetY: number
}

export type PawImageCropperTouchState = PawImageCropperPinchState | PawImageCropperDragState

export interface PawImageCropperState {
	imagePath: string
	imageInfo: PawImageCropperImageInfo | null
	baseWidth: number
	baseHeight: number
	offsetX: number
	offsetY: number
	scaleValue: number
	loading: boolean
	touchState: PawImageCropperTouchState | null
}

export interface PawImageCropperRect {
	x: number
	y: number
	width: number
	height: number
}

export function createPawImageCropperState(): PawImageCropperState {
	return {
		imagePath: '',
		imageInfo: null,
		baseWidth: 0,
		baseHeight: 0,
		offsetX: 0,
		offsetY: 0,
		scaleValue: 1,
		loading: false,
		touchState: null,
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function positiveDimension(value: unknown): number | null {
	if (typeof value !== 'number' && typeof value !== 'string') return null
	const dimension = Number(value)
	return Number.isFinite(dimension) && dimension > 0 ? dimension : null
}

export function normalizePawImageCropperInfo(value: unknown): PawImageCropperImageInfo | null {
	if (!isRecord(value)) return null
	const width = positiveDimension(value.width)
	const height = positiveDimension(value.height)
	return width !== null && height !== null ? { width, height } : null
}

export function normalizePawImageCropperPath(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null
}
