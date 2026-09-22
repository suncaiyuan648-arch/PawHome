<template>
  <view v-if="count > 1" class="paw-carousel-dots" aria-hidden="true">
    <view class="paw-carousel-dots__track">
      <view v-for="index in count" :key="index" class="paw-carousel-dots__dot"
        :class="{ 'paw-carousel-dots__dot--active': index - 1 === current }" />
    </view>
  </view>
</template>

<script>
export default {
  name: 'PawCarouselDots',
  props: {
    count: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
  },
}
</script>

<style scoped>
.paw-carousel-dots {
  position: absolute;
  right: 0;
  bottom: 18px;
  left: 0;
  display: flex;
  height: 6px;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.paw-carousel-dots__track {
  display: flex;
  width: max-content;
  height: 6px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.paw-carousel-dots__dot {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .58);
  transition: background-color 180ms ease, transform 180ms ease;
}

.paw-carousel-dots__dot--active {
  background: #fff;
  transform: scale(1.05);
}
</style>
