<template><view class="paw-badge" :class="`paw-badge--${tone}`"><slot>{{ text }}</slot></view></template>

<script>
export default { name: 'PawBadge', props: { text: { type: String, default: '' }, tone: { type: String, default: 'neutral' } } }
</script>

<style scoped>
.paw-badge { display: inline-flex; align-items: center; justify-content: center; min-height: 16px; padding: 0 5px; border-radius: 5px; font-size: 10px; line-height: 16px; white-space: nowrap; }
.paw-badge--neutral { background: #eee; color: #666; }
.paw-badge--brand { background: var(--paw-yard-tag-bg, #fff463); color: var(--paw-yard-tag-text, #333); }
</style>
