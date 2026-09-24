<script lang="ts">
import { defineComponent } from 'vue'

import { tryResolveLegacyRoute } from '@/navigation/legacyRoutes.ts'

interface LegacyRedirectTarget {
  legacyPath: string
  url: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeLaunchQuery(query: unknown) {
  if (!isRecord(query)) return undefined
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    normalized[key] = String(value)
  }
  return normalized
}

function resolveLegacyRedirect(options: unknown = {}): LegacyRedirectTarget | null {
  if (!isRecord(options)) return null
  const rawPath = typeof options.path === 'string' ? options.path : ''
  if (!rawPath) return null
  const legacyPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const result = tryResolveLegacyRoute({
    path: legacyPath,
    query: normalizeLaunchQuery(options.query),
  })
  if (!result.ok || !result.url || result.legacyPath !== legacyPath) return null
  return { legacyPath, url: result.url }
}

const redirectedPathsByApp = new WeakMap<object, string>()

function scheduleLegacyRedirect(app: object, target: LegacyRedirectTarget | null) {
  if (!target || redirectedPathsByApp.get(app) === target.legacyPath) return
  redirectedPathsByApp.set(app, target.legacyPath)
  // A cold-start route is already inside App.onLaunch. Redirect only after
  // the first native page stack exists; unsupported/ambiguous links stay
  // fail-closed instead of guessing a demo page.
  setTimeout(() => {
    try {
      uni.redirectTo({ url: target.url })
    } catch {
      /* native stack may not be ready */
    }
  }, 0)
}

export default defineComponent({
  onLaunch(options: unknown = {}) {
    console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
    console.log('App Launch')
    scheduleLegacyRedirect(this, resolveLegacyRedirect(options))
  },
  onShow(options: unknown = {}) {
    console.log('App Show')
    // onShow receives the same launch payload for a warm resume. Re-run the
    // resolver so an external old link is handled even when the app process
    // was already alive; the per-path guard keeps onLaunch/onShow idempotent.
    scheduleLegacyRedirect(this, resolveLegacyRedirect(options))
  },
  onHide() {
    console.log('App Hide')
  },
})
</script>

<style lang="scss">
/*每个页面公共css */
@import '@/uni_modules/uni-scss/index.scss';
@import '@/styles/paw-typography.scss';
@import '@/styles/paw-design-system.scss';
/* #ifndef APP-NVUE */
@import '@/static/customicons.css';
// 设置整个项目的背景色
page {
  background-color: #f5f5f5;
}

/* #ifdef H5 */
uni-tabbar {
  display: none !important;
}

/* H5 仍会为已隐藏的原生 tabBar 预留 50px，导致自定义页面整体溢出并出现
	 * 纵向滚动条。设计稿以完整 375px 内容宽度为基准，因此在 H5 预览中释放
	 * 这块占位；小程序端不受该规则影响。 */
uni-app.uni-app--showtabbar uni-page-wrapper {
  height: 100% !important;
}

uni-app.uni-app--showtabbar uni-page-wrapper::after {
  display: none !important;
}

html,
body {
  scrollbar-width: none;
}

body::-webkit-scrollbar {
  display: none;
  width: 0;
}
/* #endif */

/* #endif */
.example-info {
  font-size: 14px;
  color: #333;
  padding: 10px;
}
</style>
