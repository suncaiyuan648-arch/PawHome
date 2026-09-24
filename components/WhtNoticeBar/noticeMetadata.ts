export type WhtNoticeBarType = 'primary' | 'success' | 'warning' | 'error' | 'info'
export type WhtNoticePlatform = 'mp' | 'h5' | 'app' | ''

export interface WhtNoticeBarState {
	isShow: boolean
	isReady: boolean
	textWidth: number
	containerWidth: number
	animation: UniNamespace.Animation | null
	animationData: unknown
	platform: WhtNoticePlatform
	loopTimer: ReturnType<typeof setTimeout> | null
}

export interface WhtNoticeRect {
	width: number
}

export function isWhtNoticeBarType(value: unknown): value is WhtNoticeBarType {
	return value === 'primary' || value === 'success' || value === 'warning' || value === 'error' || value === 'info'
}

export function createWhtNoticeBarState(): WhtNoticeBarState {
	return {
		isShow: true,
		isReady: false,
		textWidth: 0,
		containerWidth: 0,
		animation: null,
		animationData: null,
		platform: '',
		loopTimer: null,
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeWhtNoticeRect(value: unknown): WhtNoticeRect | null {
	const rect = Array.isArray(value) ? value[0] : value
	if (!isRecord(rect) || typeof rect.width !== 'number' || !Number.isFinite(rect.width) || rect.width < 0) return null
	return { width: rect.width }
}
