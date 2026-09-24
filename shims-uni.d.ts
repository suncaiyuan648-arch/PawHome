/// <reference types='@dcloudio/types' />
import 'vue'

declare module '@vue/runtime-core' {
  type Hooks = App.AppInstance & Page.PageInstance
  interface ComponentCustomOptions extends Hooks {}
}

declare global {
  namespace Page {
    interface PageInstanceBaseProps {
      $page?: { route?: string }
      getTabBar?: () => PawPageTabBarInstance | undefined
    }
  }
}

interface PawPageTabBarInstance {
  setData(data: { selected?: number; unreadCount?: number }): void
}
