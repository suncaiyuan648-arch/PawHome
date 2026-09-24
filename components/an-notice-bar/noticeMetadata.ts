export interface AnNoticeBarState {
  number: number
  list: string[]
  copyText: string
  show: boolean
  showSerialLocal: boolean
}

export function createAnNoticeBarState(): AnNoticeBarState {
  return {
    number: 0,
    list: [],
    copyText: '',
    show: false,
    showSerialLocal: false,
  }
}

export function splitAnNoticeText(text: string): string[] {
  return text.split('|')
}
