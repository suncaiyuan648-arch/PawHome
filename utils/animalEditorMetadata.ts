export type AnimalEditorSpecies = 'cat' | 'dog'
export type AnimalEditorSheetKind = '' | 'status' | 'value' | 'gender' | 'neuter' | 'vaccine' | 'personality'

export interface AnimalEditorForm {
  status: string
  name: string
  breed: string
  gender: string
  neuter: string
  vaccine: string
  personality: string
  desc: string
}

export interface AnimalEditorMockMetadata {
  form: AnimalEditorForm
  petValue: number
  personalityValue: number
  birthValue: string
}

type AnimalEditorChoiceKind = Exclude<AnimalEditorSheetKind, '' | 'value'>
type AnimalEditorFormField = Exclude<keyof AnimalEditorForm, 'name' | 'breed' | 'desc'>

const ANIMAL_EDITOR_DEFAULT_MOCK: Readonly<AnimalEditorMockMetadata> = Object.freeze({
  form: Object.freeze({
    status: '待领养',
    name: '小坏蛋',
    breed: '白猫',
    gender: '男生',
    neuter: '未绝育',
    vaccine: '接种中',
    personality: '',
    desc: ''
  }),
  petValue: 15,
  personalityValue: 50,
  birthValue: '2020-06-27'
})

const ANIMAL_EDITOR_OPTIONS: Record<AnimalEditorChoiceKind, readonly string[]> = {
  status: Object.freeze(['待领养', '已领养', '失踪', '死亡']),
  gender: Object.freeze(['男生', '女生']),
  neuter: Object.freeze(['未绝育', '已绝育']),
  vaccine: Object.freeze(['未接种', '接种中', '已接种']),
  personality: Object.freeze(['非常亲人', '亲人', '不亲人'])
}

const ANIMAL_EDITOR_FIELDS: Partial<Record<AnimalEditorSheetKind, AnimalEditorFormField>> = {
  status: 'status',
  gender: 'gender',
  neuter: 'neuter',
  vaccine: 'vaccine',
  personality: 'personality'
}

export function createAnimalEditorMockMetadata(): AnimalEditorMockMetadata {
  return {
    ...ANIMAL_EDITOR_DEFAULT_MOCK,
    form: { ...ANIMAL_EDITOR_DEFAULT_MOCK.form }
  }
}

export function createAnimalEditorOptions(kind: AnimalEditorSheetKind): string[] {
  if (kind === '' || kind === 'value') return []
  return [...ANIMAL_EDITOR_OPTIONS[kind]]
}

export function getAnimalEditorFormField(kind: AnimalEditorSheetKind): AnimalEditorFormField | null {
  return ANIMAL_EDITOR_FIELDS[kind] || null
}

export function getAnimalEditorPopupKind(value: unknown): AnimalEditorSheetKind | null {
  switch (value) {
    case 'status':
    case 'value':
    case 'gender':
    case 'vaccine':
    case 'personality':
      return value
    case 'sterilization':
      return 'neuter'
    default:
      return null
  }
}
