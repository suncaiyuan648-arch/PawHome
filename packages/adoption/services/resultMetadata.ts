export type AdoptionResultVariant = '80' | '81' | '82' | '83' | '84' | '85'

export type AdoptionResultOutcome =
	| 'reward-claimed'
	| 'review-approved'
	| 'adoption-confirmed-by-owner'
	| 'review-rejected'
	| 'confirmation-submitted'
	| 'application-submitted'

export interface AdoptionResultConfig {
	readonly title: string
	readonly body: string
	readonly buttonText: string
	readonly descriptionMaxWidth?: number
	readonly failed?: boolean
	readonly failureIconName?: string
	readonly failureTone?: string
}

export interface AdoptionResultPageState {
	variant: string
	outcome: string
	recordId: string
	orderId: string
	nextMode: string
	reviewerRole: string
	reviewerId: string
}

const RESULT_CONFIGS = Object.freeze({
	'80': Object.freeze({
		title: '领取成功',
		body: '感谢您收养这个流浪的苦命孩子，逢猫作为半个娘家人没什么能拿的出手的，只能为它陪嫁一点猫粮，希望它能在未来的数年乃至十数年陪伴您的每一次开心与难过',
		buttonText: '查看订单',
	}),
	'81': Object.freeze({
		title: '已同意领养申请',
		body: '没尝过家的味道\n总在流浪\n谢谢你\n让我知道\n被偏爱是什么样',
		buttonText: '好的',
	}),
	'82': Object.freeze({
		title: '已确认领养',
		body: '恭喜您成功帮助小咪找到新\n家，小咪将从您的小院前往\n新家啦！',
		buttonText: '查看详情',
		descriptionMaxWidth: 254,
	}),
	'83': Object.freeze({
		title: '已驳回',
		body: '驳回后领养信息中申请人不再\n可见',
		buttonText: '查看详情',
		failed: true,
		failureIconName: 'status/adoption-rejected',
		failureTone: 'brand',
		descriptionMaxWidth: 254,
	}),
	'84': Object.freeze({
		title: '太棒了',
		body: '等待院主和领养审核团确认您的领养为真后将有机会抽取逢猫的一份猫粮礼物！祝贺小咪找到新家！',
		buttonText: '查看领养进度',
		descriptionMaxWidth: 254,
	}),
	'85': Object.freeze({
		title: '申请成功',
		body: '您的领养申请以及这份善意，为防止不正当领养及恶意领养，院主会查看您的历史领养和投喂记录来决定是否同意。通过后平台将通知您，请注意系统消息及小院消息。',
		buttonText: '查看领养进度',
	}),
} satisfies Readonly<Record<AdoptionResultVariant, AdoptionResultConfig>>)

const OUTCOME_VARIANTS = Object.freeze({
	'reward-claimed': '80',
	'review-approved': '81',
	'adoption-confirmed-by-owner': '82',
	'review-rejected': '83',
	'confirmation-submitted': '84',
	'application-submitted': '85',
} satisfies Readonly<Record<AdoptionResultOutcome, AdoptionResultVariant>>)

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isAdoptionResultVariant(value: string): value is AdoptionResultVariant {
	return Object.prototype.hasOwnProperty.call(RESULT_CONFIGS, value)
}

function isAdoptionResultOutcome(value: string): value is AdoptionResultOutcome {
	return Object.prototype.hasOwnProperty.call(OUTCOME_VARIANTS, value)
}

function scalarText(value: unknown): string {
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return ''
	return String(value)
}

function routeText(value: unknown): string {
	const text = scalarText(value)
	if (!text) return ''
	try {
		return decodeURIComponent(text)
	} catch {
		return text
	}
}

export function getAdoptionResultConfig(variant: string): AdoptionResultConfig {
	return isAdoptionResultVariant(variant) ? RESULT_CONFIGS[variant] : RESULT_CONFIGS['80']
}

export function createAdoptionResultPageState(): AdoptionResultPageState {
	return {
		variant: '85',
		outcome: 'application-submitted',
		recordId: '',
		orderId: '',
		nextMode: '',
		reviewerRole: '',
		reviewerId: '',
	}
}

export function normalizeAdoptionResultRouteOptions(input: unknown): AdoptionResultPageState {
	const state = createAdoptionResultPageState()
	if (!isRecord(input)) return state

	const incomingOutcome = routeText(input.outcome)
	state.outcome = incomingOutcome || 'application-submitted'
	const outcomeVariant = isAdoptionResultOutcome(state.outcome) ? OUTCOME_VARIANTS[state.outcome] : undefined
	const incomingVariant = input.variant ? scalarText(input.variant) : ''
	state.variant = outcomeVariant || incomingVariant || '85'

	state.recordId = routeText(input.applicationId || input.id || input.recordId)
	state.orderId = routeText(input.orderId)
	state.nextMode = routeText(input.nextMode)
	state.reviewerRole = routeText(input.reviewerRole)
	state.reviewerId = routeText(input.reviewerId)
	return state
}
