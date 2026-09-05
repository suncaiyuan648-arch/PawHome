<template>
	<view class="paw-badge" :class="rootClasses">
		<slot />
		<view v-if="indicatorVisible" class="paw-badge__indicator" :class="indicatorClasses" :style="indicatorStyle">
			<text v-if="!dot">{{ displayCount }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PawBadge',
	props: {
		count: { type: [Number, String], default: null },
		// 保留旧 text API，便于基础 Badge 独立使用；新场景优先使用 count。
		text: { type: [Number, String], default: '' },
		tone: { type: String, default: 'danger' },
		size: { type: String, default: 'middle' },
		dot: { type: Boolean, default: false },
		showZero: { type: Boolean, default: false },
		overflowCount: { type: Number, default: 99 },
		color: { type: String, default: '' },
		offset: { type: Array, default: () => [0, 0] }
	},
	computed: {
		rawCount() {
			return this.count !== null && this.count !== undefined ? this.count : this.text
		},
		hasContent() {
			return !!(this.$slots && this.$slots.default)
		},
		isZero() {
			return this.rawCount !== '' && Number(this.rawCount) === 0
		},
		indicatorVisible() {
			if (this.dot) return true
			if (this.rawCount === null || this.rawCount === undefined || this.rawCount === '') return false
			return !this.isZero || this.showZero
		},
		displayCount() {
			const count = Number(this.rawCount)
			const overflow = Number(this.overflowCount)
			if (Number.isFinite(count) && Number.isFinite(overflow) && count > overflow) {
				return `${overflow}+`
			}
			return String(this.rawCount)
		},
		rootClasses() {
			return [
				`paw-badge--${this.size}`,
				`paw-badge--tone-${this.tone}`,
				{ 'paw-badge--standalone': !this.hasContent }
			]
		},
		indicatorClasses() {
			return { 'paw-badge__indicator--dot': this.dot }
		},
		indicatorStyle() {
			const offset = Array.isArray(this.offset) ? this.offset : [0, 0]
			const offsetX = Number(offset[0]) || 0
			const offsetY = Number(offset[1]) || 0
			const style = {}
			if (offsetX || offsetY) style.transform = `translate(${offsetX}px, ${offsetY}px)`
			if (this.color) style.backgroundColor = this.color
			return style
		}
	}
}
</script>

<style scoped>
.paw-badge {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	line-height: 0;
}

.paw-badge--standalone {
	line-height: 1;
}

.paw-badge__indicator {
	position: absolute;
	left: calc(100% - 8px);
	bottom: calc(100% - 10px);
	z-index: 1;
	min-width: 18px;
	height: 15px;
	padding: 0 3px;
	box-sizing: border-box;
	border-radius: 999px;
	background: #ff2741;
	display: flex;
	align-items: center;
	justify-content: center;
	white-space: nowrap;
}

.paw-badge__indicator text {
	font-size: 10px;
	font-weight: 500;
	line-height: 1;
	color: #ffffff;
}

.paw-badge__indicator--dot {
	min-width: 6px;
	width: 6px;
	height: 6px;
	padding: 0;
	border-radius: 50%;
}

.paw-badge--small .paw-badge__indicator {
	min-width: 16px;
	height: 14px;
	padding: 0 2px;
}

.paw-badge--small .paw-badge__indicator text {
	font-size: 9px;
}

.paw-badge--large .paw-badge__indicator {
	min-width: 20px;
	height: 18px;
	padding: 0 4px;
}

.paw-badge--large .paw-badge__indicator text {
	font-size: 11px;
}

.paw-badge--standalone .paw-badge__indicator {
	position: relative;
	top: auto !important;
	right: auto !important;
	left: auto !important;
	bottom: auto !important;
}

.paw-badge--tone-neutral .paw-badge__indicator {
	background: #eeeeee;
	color: #666666;
}

.paw-badge--tone-neutral .paw-badge__indicator text {
	color: #666666;
}

.paw-badge--tone-brand .paw-badge__indicator {
	background: var(--paw-yard-tag-bg, #fff463);
	color: var(--paw-yard-tag-text, #333333);
}

.paw-badge--tone-brand .paw-badge__indicator text {
	color: var(--paw-yard-tag-text, #333333);
}

.paw-badge--tone-danger .paw-badge__indicator {
	background: #ff2741;
	color: #ffffff;
}
</style>
