使用方式

```javascript
// TODO imagesList为图片数组

const imageArrayWidth = ref(uni.upx2px(690))

<NineGridLayout :NineGridList="imagesList" :containerWidth="imageArrayWidth" BorderRadiusSize="12"/> 
```
参数

| 参数名                | 作用           |
|--------------------|--------------|
| NineGridList       | 图片路径数组       |
| GridSpace          | 间距大小         |
| OneChildHeight     | 一个子View时最小高度 |
| BorderRadiusSize   | 圆角尺寸         |
| IsPreview          | 是否开启预览       |
| FailurePlaceholder | 图片加载失败占位图    |
| containerWidth     | 容器宽度（px）     |
| LazyLoad           | 是否开启图片懒加载    |
