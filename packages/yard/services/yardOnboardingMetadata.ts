export interface YardOnboardingDutyRule {
  lead: string
  text: string
}

export interface YardOnboardingForbiddenRulePart {
  text: string
  danger?: boolean
}

export type YardOnboardingForbiddenRule = YardOnboardingForbiddenRulePart[]

export interface YardOnboardingMetadata {
  dutiesRules: YardOnboardingDutyRule[]
  forbiddenRules: YardOnboardingForbiddenRule[]
}

const DUTY_RULES: readonly Readonly<YardOnboardingDutyRule>[] = Object.freeze([
  Object.freeze({
    lead: '完善小院信息：',
    text: '您需要真实的完善小院信息，实事求是，不弄虚作假；',
  }),
  Object.freeze({
    lead: '建立动物档案：',
    text: '真实详细的为每一个小毛娃填写档案，便于用户选择云养及领养；',
  }),
  Object.freeze({
    lead: '云养拍摄反馈：',
    text: '当用户选择云养您小院的小毛娃时，您需要在收到粮食包裹后，用纸条等写上投粮人的名字，及时拍摄投喂的图片或视频上传；',
  }),
  Object.freeze({
    lead: '反馈频率：',
    text: '最低一周反馈一次，建议每日坚持反馈，过低的反馈频率会让投粮人失去继续云养的动力，平台系统也将会降低小院的曝光权重；',
  }),
  Object.freeze({
    lead: '领养审核：',
    text: '审核领养申请，并协助领养人成功领养，给毛孩子们新找一个好归宿',
  }),
])

const FORBIDDEN_RULES: readonly (readonly Readonly<YardOnboardingForbiddenRulePart>[])[] =
  Object.freeze([
    Object.freeze([
      Object.freeze({ text: '禁止发布虚假流浪动物信息' }),
      Object.freeze({ text: '骗取猫粮、牟取不正当利益', danger: true }),
    ]),
    Object.freeze([
      Object.freeze({ text: '禁止以任何理由或形式' }),
      Object.freeze({ text: '索要钱财', danger: true }),
    ]),
    Object.freeze([
      Object.freeze({ text: '禁止在领养申请以外的任何地方填写联系方式，引导诱导' }),
      Object.freeze({ text: '私下交易转账', danger: true }),
    ]),
  ])

export function createYardOnboardingMetadata(): YardOnboardingMetadata {
  return {
    dutiesRules: DUTY_RULES.map((rule) => ({ ...rule })),
    forbiddenRules: FORBIDDEN_RULES.map((rule) => rule.map((part) => ({ ...part }))),
  }
}
