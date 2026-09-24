/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />

/**
 * Shared event shape used by the Options API components during the JS→TS
 * migration. uni-app events expose `detail` in addition to the DOM event
 * fields, so keeping that shape in one place avoids repeating ad-hoc casts in
 * every component handler.
 */
interface PawEventTouchPoint {
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  x?: number
  y?: number
}

interface PawEventDetail {
  value?: unknown
  [key: string]: unknown
}

interface PawEvent extends Event {
  detail?: unknown
  touches?: TouchList | PawEventTouchPoint[]
  changedTouches?: TouchList | PawEventTouchPoint[]
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  deltaY?: number
}

/** WeChat-only APIs are unavailable in the H5 type declarations. */
interface PawWechatApi {
  chooseAddress?: (options: UniNamespace.ChooseAddressOptions) => void
  requestPayment?: (options: Omit<UniNamespace.RequestPaymentOptions, 'provider'>) => void
  switchTab?: (options: UniNamespace.SwitchTabOptions) => void
}

declare const wx: PawWechatApi

declare module '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue' {
  import type { DefineComponent } from 'vue'

  const UniIcons: DefineComponent<{
    type?: string
    color?: string
    size?: number | string
  }>

  export default UniIcons
}

interface Window {
  Vue?: {
    version?: string
  }
}
