
// #ifndef VUE3
import Vue from 'vue'
import LegacyApp from './App'

Vue.config.productionTip = false

LegacyApp.mpType = 'app'

const app = new Vue({
    ...LegacyApp
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import App from './App.vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif
