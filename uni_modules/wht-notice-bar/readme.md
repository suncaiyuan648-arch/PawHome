# 通知栏 Notice Bar

一个功能强大的通知栏组件，支持滚动效果、多种主题、自定义样式等特性。

## 平台兼容性
- Vue2 ✅
- Vue3 ✅
- H5 ✅
- 小程序 ✅
- APP ✅

## 依赖说明
本组件依赖以下组件：
- uni-icons：用于显示左侧图标和关闭按钮
> 请在插件市场搜索并安装 [uni-icons](https://ext.dcloud.net.cn/plugin?id=28) 组件，或直接导入项目下的 uni-icons 组件。


## 基础用法


在页面中引入组件：

```vue
vue
<template>
    <wht-notice-bar text="这是一条通知消息"></wht-notice-bar>
</template>
<script>
import WhtNoticeBar from '@/components/wht-notice-bar/wht-notice-bar.vue'
export default {
    components: {
        WhtNoticeBar
    }
}
</script>
```

## 属性

| 属性名      | 类型    | 默认值   | 说明                     |
| ----------- | ------- | -------- | ------------------------ |
| text        | String  | ''       | 通知文本内容             |
| type        | String  | 'warning'| 主题类型                 |
| bgColor     | String  | ''       | 背景颜色                 |
| color       | String  | ''       | 文字颜色                 |
| showIcon    | Boolean | true     | 是否显示左侧图标         |
| showClose   | Boolean | false    | 是否显示右侧关闭按钮     |
| speed       | Number  | 100      | 滚动速度，单位px/s       |
| single      | Boolean | true     | 是否单行显示             |
| rows        | Number  | 2        | 多行显示时的行数         |
| radius      | Number  | 12       | 圆角大小，单位rpx        |
| scrollable  | Boolean | true     | 是否开启滚动             |

## 事件

| 事件名 | 说明             |
| ------ | ---------------- |
| click  | 点击通知内容触发 |
| close  | 点击关闭按钮触发 |

## 示例


```vue
<wht-notice-bar
    text="这是一条通知消息"
    type="success"
    :showClose="true"
    @click="handleClick"
    @close="handleClose">
</wht-notice-bar>
```


## 贡献

欢迎提交问题和贡献代码。