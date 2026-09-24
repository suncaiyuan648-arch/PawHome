export type RescueApplicationHelpFieldKey = 'amount' | 'receiver' | 'name' | 'age' | 'identity' | 'location'

export interface RescueApplicationHelpFieldMetadata {
	key: RescueApplicationHelpFieldKey
	label: string
	value: string
	placeholder?: string
	inputType?: 'text' | 'digit' | 'number'
	amount?: boolean
}

export const RESCUE_APPLICATION_HELP_FIELD_MOCKS: readonly RescueApplicationHelpFieldMetadata[] = Object.freeze([
	{ key: 'amount', label: '求助金额', value: '', placeholder: '￥0.00', inputType: 'digit', amount: true },
	{ key: 'receiver', label: '收款微信账户', value: '13900000000', inputType: 'number' },
	{ key: 'name', label: '发起人姓名', value: '马冬梅' },
	{ key: 'age', label: '发起人年龄', value: '20', inputType: 'number' },
	{ key: 'identity', label: '发起人身份', value: '学生' },
	{ key: 'location', label: '发起人所在地', value: '安徽省合肥市蜀山区海恒社区' },
])

export function createRescueApplicationHelpFieldMocks(): RescueApplicationHelpFieldMetadata[] {
	return RESCUE_APPLICATION_HELP_FIELD_MOCKS.map(field => ({ ...field }))
}
