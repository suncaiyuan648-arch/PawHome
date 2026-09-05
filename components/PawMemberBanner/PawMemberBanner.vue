<template>
	<view class="paw-member-banner" :class="{ 'paw-member-banner--clickable': clickable }" @tap="handleClick">
		<image class="paw-member-banner__bg" src="/static/figma/profile/member-banner-brown-only.svg?v=1" mode="scaleToFill" />
		<view class="paw-member-banner__content">
			<text class="paw-member-banner__title">{{ title }}</text>
				<view class="paw-member-banner__progress">
					<text class="paw-member-banner__progress-text">{{ progressText }}</text>
					<view class="paw-member-banner__arrow">
						<PawIcon class="paw-member-banner__icon" name="navigation/member-progress-arrow" :size="11" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
	name: 'PawMemberBanner',
	components: { PawIcon },
	props: {
		title: { type: String, required: true },
		progressText: { type: String, required: true },
		clickable: { type: Boolean, default: true }
	},
	emits: ['click'],
	methods: {
		handleClick() {
			if (this.clickable) this.$emit('click')
		}
	}
}
</script>

<style scoped>
.paw-member-banner {
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	overflow: hidden;
	background: #fff;
	border: 0;
	outline: 0;
	box-shadow: none;
}

.paw-member-banner--clickable {
	cursor: pointer;
}

.paw-member-banner__bg {
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	display: block;
	width: 100%;
	height: 84.9315%;
	border: 0;
	outline: 0;
	background: transparent;
	box-shadow: none;
}

.paw-member-banner__content {
	position: relative;
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: flex-end;
	box-sizing: border-box;
	width: 100%;
	padding: 5px 19px 0 0;
	z-index: 1;
}

.paw-member-banner__title {
	display: block;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 14px;
	font-weight: 500;
	color: #fedfc5;
	line-height: 20px;
	text-align: left;
}

.paw-member-banner__progress {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 3px;
	margin-top: 3px;
	white-space: nowrap;
}

.paw-member-banner__progress-text {
	font-size: 10px;
	font-weight: 500;
	color: #ffeada;
	line-height: 14px;
	white-space: nowrap;
}

.paw-member-banner__arrow {
	display: flex;
	width: 11px;
	height: 11px;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	border-radius: 50%;
	background: transparent;
}

.paw-member-banner__icon {
	filter: none;
}
</style>
