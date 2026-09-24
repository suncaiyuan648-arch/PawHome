export type YardFeedPackageKey = 'a' | 'b' | 'c'
export type YardFeedAgreement = 'feed' | 'fraud' | 'required'
export type YardFeedPaymentProvider = UniNamespace.RequestPaymentOptions['provider']

export interface YardFeedPackageOption {
	readonly key: YardFeedPackageKey
	readonly jin: number
	readonly weightLabel: string
	readonly price: number
	readonly priceLabel: string
	readonly feedback: string
	readonly payPriceLabel: string
	readonly payJinLabel: string
	readonly iconName: string
	readonly iconSize: number
}

export interface YardFeedPaymentPayload {
	readonly petId: string
	readonly key: YardFeedPackageKey
	readonly jin: number
	readonly price: number
	readonly feedbackTimes: 1
}

export interface YardFeedPaymentParams {
	readonly provider?: string
	readonly timeStamp?: string | number
	readonly nonceStr?: string
	readonly package?: string
	readonly signType?: string
	readonly paySign?: string
	readonly [key: string]: unknown
}

export interface ValidYardFeedPaymentParams extends YardFeedPaymentParams {
	readonly provider?: YardFeedPaymentProvider
	readonly timeStamp: string
	readonly nonceStr: string
	readonly package: string
	readonly signType: string
	readonly paySign: string
}

export interface YardFeedPopupState {
	successVisible: boolean
	paymentPending: boolean
	selectedKey: YardFeedPackageKey
	agreed: boolean
	feedRights: string[]
	packages: YardFeedPackageOption[]
}

export const YARD_FEED_PACKAGE_OPTIONS: readonly YardFeedPackageOption[] = Object.freeze([
	Object.freeze({ key: 'a', jin: 0.4, weightLabel: '0.4斤', price: 6.9, priceLabel: '6.9元', feedback: '云养3天', payPriceLabel: '6.9', payJinLabel: '0.4斤', iconName: 'brand/feed-kibble', iconSize: 20 }),
	Object.freeze({ key: 'b', jin: 4, weightLabel: '4斤', price: 29.9, priceLabel: '29.9元', feedback: '云养30天', payPriceLabel: '29.9', payJinLabel: '4斤', iconName: 'brand/feed-bowl', iconSize: 32 }),
	Object.freeze({ key: 'c', jin: 40, weightLabel: '40斤', price: 299.9, priceLabel: '299.9元', feedback: '云养300天', payPriceLabel: '119.9', payJinLabel: '15斤', iconName: 'brand/feed-bag', iconSize: 43 }),
])

export const YARD_FEED_RIGHTS: readonly string[] = Object.freeze([
	'您购买的15斤猫粮将寄往小院；',
	'院主将会在接下来300天用这15斤猫粮喂“豆豆”；',
	'每周至少反馈1次“豆豆”的投喂视频图片，尽量做到一天一反馈，由于恶劣天气、院主临时有事等各种因素无法保证每天反馈；',
	'院主及时更新“豆豆”的情况；',
	'您获得豆豆的优先领养权；',
	'云领养期间，申请领养需要您的同意才会发送给院主审核；',
])

const REQUIRED_PAYMENT_FIELDS = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'] as const
const PAYMENT_PROVIDERS: readonly YardFeedPaymentProvider[] = ['alipay', 'wxpay', 'baidu', 'appleiap']
const FALLBACK_PAYMENT_PROVIDER: YardFeedPaymentProvider = 'wxpay'

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPaymentProvider(value: unknown): value is YardFeedPaymentProvider {
	return typeof value === 'string' && PAYMENT_PROVIDERS.some(provider => provider === value)
}

function paymentText(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim()) return value
	if (typeof value === 'number' && Number.isFinite(value) && value > 0) return String(value)
	return undefined
}

export function createYardFeedPopupState(): YardFeedPopupState {
	return {
		successVisible: false,
		paymentPending: false,
		selectedKey: 'c',
		agreed: true,
		feedRights: [...YARD_FEED_RIGHTS],
		packages: YARD_FEED_PACKAGE_OPTIONS.map(option => ({ ...option })),
	}
}

export function readYardFeedPaymentParams(value: unknown): ValidYardFeedPaymentParams | null {
	if (!isRecord(value)) return null
	const fields = REQUIRED_PAYMENT_FIELDS.map(field => paymentText(value[field]))
	if (fields.some(field => field === undefined)) return null
	const [timeStamp, nonceStr, packageName, signType, paySign] = fields
	if (!timeStamp || !nonceStr || !packageName || !signType || !paySign) return null
	const { provider: rawProvider, ...extraParams } = value
	const provider = isPaymentProvider(rawProvider) ? rawProvider : undefined
	return {
		...extraParams,
		...(provider ? { provider } : {}),
		timeStamp,
		nonceStr,
		package: packageName,
		signType,
		paySign,
	}
}

/** The uni-app requestPayment API requires a provider; the WeChat-native path does not. */
export function toYardFeedUniPaymentParams(value: ValidYardFeedPaymentParams): UniNamespace.RequestPaymentOptions {
	return { ...value, provider: value.provider || FALLBACK_PAYMENT_PROVIDER }
}

export function isYardFeedAgreement(value: unknown): value is YardFeedAgreement {
	return value === 'feed' || value === 'fraud' || value === 'required'
}

export function isYardFeedPaymentPayload(value: unknown): value is YardFeedPaymentPayload {
	return isRecord(value)
		&& typeof value.petId === 'string'
		&& (value.key === 'a' || value.key === 'b' || value.key === 'c')
		&& typeof value.jin === 'number'
		&& Number.isFinite(value.jin)
		&& typeof value.price === 'number'
		&& Number.isFinite(value.price)
		&& value.feedbackTimes === 1
}
