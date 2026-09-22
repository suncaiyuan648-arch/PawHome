<template>
	<PawBottomSheet v-model:visible="visibleProxy" variant="voice-recorder" :safe-area="false" :close-on-mask="true"
		:height="347" :z-index="10030" @after-close="$emit('after-close')">
		<view class="paw-voice-recorder" :class="{ 'paw-voice-recorder--recording': recording }">
			<view v-if="recording" class="record-duration">
				<image class="record-duration__icon" src="/static/figma/voice/record-audio.svg" mode="aspectFit" />
				<text class="record-duration__text">{{ duration }}″</text>
			</view>
			<text class="record-hint">{{ recording ? '松开结束' : '长按开始' }}</text>
			<view class="record-trigger" :class="{ 'record-trigger--recording': recording }"
				data-qa="voice-recorder-trigger" @longpress="$emit('record-start')" @touchend="$emit('record-end')"
				@touchcancel="$emit('record-end')">
				<image class="record-trigger__icon"
					:src="recording ? '/static/figma/voice/record-active.svg' : '/static/figma/voice/record-idle.svg'"
					:class="{ 'record-trigger__icon--idle': !recording }" mode="aspectFit" />
			</view>
		</view>
	</PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'

export default {
	name: 'PawVoiceRecorderSheet',
	components: { PawBottomSheet },
	props: {
		visible: { type: Boolean, default: false },
		recording: { type: Boolean, default: false },
		duration: { type: [Number, String], default: 0 }
	},
	emits: ['update:visible', 'record-start', 'record-end', 'after-close'],
	computed: {
		visibleProxy: {
			get() { return this.visible },
			set(value) { this.$emit('update:visible', value) }
		}
	}
}
</script>

<style scoped>
.paw-voice-recorder {
	display: flex;
	width: 100%;
	height: 347px;
	align-items: center;
	flex-direction: column;
	box-sizing: border-box;
	padding-top: 94px;
	border-radius: 20px 20px 0 0;
	background: #fff;
}

.paw-voice-recorder--recording {
	padding-top: 38px;
}

.record-duration {
	display: flex;
	flex: 0 0 43px;
	width: 93px;
	height: 43px;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border: .5px solid #e6e6e6;
	border-radius: 7px;
	background: #fafafa;
}

.record-duration__icon {
	display: block;
	width: 18px;
	height: 18px;
}

.record-duration__text {
	margin-left: 5px;
	color: #323232;
	font-size: 18px;
	font-weight: 500;
	line-height: 22px;
}

.record-hint {
	color: #979797;
	font-size: 15px;
	font-weight: 400;
	line-height: 18px;
	white-space: nowrap;
}

.paw-voice-recorder--recording .record-hint {
	margin-top: 13px;
}

.record-trigger {
	display: flex;
	flex: 0 0 100px;
	width: 100px;
	height: 100px;
	align-items: center;
	justify-content: center;
	margin-top: 35px;
	overflow: visible;
}

.record-trigger__icon {
	display: block;
	width: 100px;
	height: 100px;
}

.record-trigger__icon--idle {
	width: 150px;
	height: 150px;
}
</style>
