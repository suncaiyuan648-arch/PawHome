<template>
  <view class="NineGridLayout" :style="{ height: containerHeight + 'px' }">
    <!-- 勿用 template 包裹 v-for + 单节点：mp 编译易产生 Cannot read property '$$' of undefined -->
    <image
      v-for="(item, index) in NineGridList"
      :key="index"
      @click="onPreview(index)"
      :src="gridItemSrc(item)"
      :style="getImageStyle(index)"
      :lazy-load="true"
      mode="aspectFill"
      class="NineGridLayoutItem"
    />
  </view>
</template>

<script lang="ts" setup>
import {ref, reactive, withDefaults, watchEffect} from "vue";
import { safeImgSrc } from "@/utils/safeImgSrc.js";

interface Props {
  NineGridList: string[];
  GridSpace: number;
  OneChildHeight: number;
  BorderRadiusSize: number | string;
  IsPreview: boolean;
  FailurePlaceholder: string;
  LazyLoad: boolean;
  FadeShow: boolean;
  containerWidth: number
}

const props = withDefaults(defineProps<Props>(), {
  // 图片路径数组
  NineGridList: () => [],
  // 间距大小
  GridSpace: 5,
  // 一个子View时最小高度
  OneChildHeight: 150,
  // 圆角尺寸
  BorderRadiusSize: 10,
  // 是否开启预览
  IsPreview: true,
  // 图片加载失败占位图
  FailurePlaceholder: '/static/img/imgErr.png',
  // 开启延迟加载
  LazyLoad: true,
  // 图片显示动画效果（淡出显示）
  FadeShow: true,
  // 容器宽度
  containerWidth: 0,
})

interface NineGridLayoutImageStyleInterface {
  width: number;
  height: number;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

const containerHeight = ref<number>(0); // 容器高度
const listStyle = reactive<NineGridLayoutImageStyleInterface[]>([]); // 样式表
const childCount = ref<number>(0) // 图片总数

watchEffect(() => {
  listStyle.length = 0
  childCount.value = props.NineGridList.length;
  containerHeight.value = calHeight(props.containerWidth);
  setChildSize()
});

function gridItemSrc(item: unknown): string {
  const raw = typeof item === "string" ? item : "";
  const fb = safeImgSrc(typeof props.FailurePlaceholder === "string" ? props.FailurePlaceholder : "");
  return safeImgSrc(raw, fb);
}

function getImageStyle(index: number) {
  const itemStyle: NineGridLayoutImageStyleInterface = listStyle[index];
  if (!itemStyle) return {}; // handle undefined case
  return {
    width: itemStyle.width + 'px',
    height: itemStyle.height + 'px',
    left: itemStyle.left + 'px',
    top: itemStyle.top + 'px',
    right: itemStyle.right + 'px',
    bottom: itemStyle.bottom + 'px',
    borderRadius: props.BorderRadiusSize + 'rpx'
  };
}

/**
 * 图片加载失败
 */
function onImageError(index: number) {
  props.NineGridList.splice(index, 1, props.FailurePlaceholder as any)
}

/**
 * 预览图片
 */
function onPreview(index: number) {
  if (!props.IsPreview) return;
  if (props.NineGridList[index] === props.FailurePlaceholder) return;
  uni.previewImage({
    urls: props.NineGridList,
    current: index
  })
}

/**
 * 设置子View的大小
 */
function setChildSize() {
  switch (childCount.value) {
    case 1:
    case 4:
    case 7:
      measure147Children();
      break;
    case 2:
    case 5:
    case 8:
      measure258Children();
      break;
    case 3:
    case 6:
    case 9:
      measure369Children();
      break;
  }
}

function measure147Children() {
  let oneWidth = props.containerWidth;
  let oneHeight = props.OneChildHeight;
  let threeSize = (props.containerWidth - props.GridSpace * 2) / 3;

  listStyle.push({
    width: oneWidth,
    height: oneHeight
  })

  for (let i = 1; i < childCount.value; i++) listStyle.push({
    width: threeSize,
    height: threeSize
  })

  layoutOneAndFourAndSevenChildren();
}

function measure258Children() {
  let twoSize = (props.containerWidth - props.GridSpace) / 2;
  let threeSize = (props.containerWidth - props.GridSpace * 2) / 3;

  for (let i = 0; i < 2; i++) listStyle.push({
    width: twoSize,
    height: twoSize
  })

  for (let i = 2; i < childCount.value; i++) listStyle.push({
    width: threeSize,
    height: threeSize
  })

  layoutTwoAndFiveAndEightChildren()
}

function measure369Children() {
  let threeSize = (props.containerWidth - props.GridSpace * 2) / 3;

  for (let i = 0; i < childCount.value; i++) listStyle.push({
    width: threeSize,
    height: threeSize
  })

  layoutThreeMultipleChildren()
}

/**
 * 布局1/4/7个子View
 */
function layoutOneAndFourAndSevenChildren() {
  let singleSize = (props.containerWidth - props.GridSpace * 2) / 3;//单个的尺寸
  for (let i = 1; i < childCount.value; i++) {
    // 行
    let rowCount = Math.trunc((i - 1) / 3);
    // 列
    let columnCount = (i - 1) % 3;
    let left = columnCount * (singleSize + props.GridSpace);
    let top = props.OneChildHeight + props.GridSpace + rowCount * (singleSize + props.GridSpace);
    let right = left + singleSize;
    let bottom = top + singleSize;

    listStyle[i].left = left || 0
    listStyle[i].top = top || 0
    listStyle[i].right = right || 0
    listStyle[i].bottom = bottom || 0
  }
}

/**
 * 布局2/5/8个子View
 */
function layoutTwoAndFiveAndEightChildren() {
  let top2singleSize = (props.containerWidth - props.GridSpace) / 2;//前两个单个的尺寸

  for (let i = 0; i < 2; i++) {
    let left = i * (top2singleSize + props.GridSpace);
    let top = 0;
    let right = left + top2singleSize;
    let bottom = top + top2singleSize;
    listStyle[i].left = left || 0
    listStyle[i].top = top || 0
    listStyle[i].right = right || 0
    listStyle[i].bottom = bottom || 0
  }

  let singleSize = (props.containerWidth - props.GridSpace * 2) / 3;//单个的尺寸

  for (let i = 2; i < childCount.value; i++) {
    // 行
    let rowCount = Math.trunc((i - 2) / 3);
    // 列
    let columnCount = (i - 2) % 3;
    let left = columnCount * (singleSize + props.GridSpace);
    let top = top2singleSize + props.GridSpace + rowCount * (singleSize + props.GridSpace);
    let right = left + singleSize;
    let bottom = top + singleSize;
    listStyle[i].left = left || 0
    listStyle[i].top = top || 0
    listStyle[i].right = right || 0
    listStyle[i].bottom = bottom || 0
  }
}

/**
 * 布局3、6、9（3的倍数） 个子View
 */
function layoutThreeMultipleChildren() {
  let singleSize = (props.containerWidth - props.GridSpace * 2) / 3;//单个的尺寸
  for (let i = 0; i < childCount.value; i++) {
    // 行
    let rowCount = Math.trunc(i / 3);
    // 列
    let columnCount = i % 3;
    let left = columnCount * (singleSize + props.GridSpace);
    let top = rowCount * (singleSize + props.GridSpace);
    let right = left + singleSize;
    let bottom = top + singleSize;
    listStyle[i].left = left || 0
    listStyle[i].top = top || 0
    listStyle[i].right = right || 0
    listStyle[i].bottom = bottom || 0
  }
}

/**
 * 根据宽度计算高度
 *
 * @param width 高度
 * @return number
 */
function calHeight(width: number) {
  let height = 0;
  // 根据子View的个数&间距 来确定高度
  switch (childCount.value) {
    case 0:
      height = 0;
      break;
    case 1:
      height = props.OneChildHeight;
      break;
    case 2:
      height = (width - props.GridSpace) / 2;
      break;
    case 3:
      height = (width - 2 * props.GridSpace) / 3;
      break;
    case 4:
      height = props.OneChildHeight + props.GridSpace + (width - 2 * props.GridSpace) / 3;
      break;
    case 5:
      height = (width - props.GridSpace) / 2 + props.GridSpace + (width - 2 * props.GridSpace) / 3;
      break;
    case 6:
      height = (width - 2 * props.GridSpace) / 3 * 2 + props.GridSpace;
      break;
    case 7:
      height = props.OneChildHeight + (width - 2 * props.GridSpace) / 3 * 2 + props.GridSpace * 2;
      break;
    case 8:
      height = (width - props.GridSpace) / 2 + (width - 2 * props.GridSpace) / 3 * 2 + props.GridSpace * 2;
      break;
    case 9:
      height = width;
      break;
  }
  return height;
}
</script>

<style lang="scss">
.NineGridLayout {
  width: 100%;
  position: relative;
}

.NineGridLayoutItem {
  position: absolute;
  // TODO 图片最大宽度不超过容器宽度
  max-width: 100%;
  // TODO 优化图片展示的时候闪烁
  will-change: transform
}
</style>
