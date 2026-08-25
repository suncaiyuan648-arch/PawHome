## 朋友圈图片预览
> **组件名：uv-image-arrange**

### 安装方式

本组件符合[easycom](https://uniapp.dcloud.io/collocation/pages?id=easycom)规范，`HBuilderX 2.5.5`起，只需将本组件导入项目，在页面`template`中即可直接使用，无需在页面中`import`和注册`components`。

##有项目需要开发的请联系 QQ:371524845
###开发不易，如果帮助到你的，请支持 有问题请留言，作者会积极更新

## API

### Props

|  属性名	|    类型	| 默认值	| 说明			|
|			|			|			|				|
| list| Array	| []	| 图片列表 ['http//****']	|
| previewImage	| Boolean	|  true	| 是否预览	|
| errorSrc	| String	|  './noimg.png'	| 图片加载失败时展示的图片	|
| maxWidth	| String	|  '500rpx'	| 单张最大宽度，支持所有单位，如px，vw，rpx，rem	|
| maxHeight	| String	|  '500rpx'	| 单张最大高度，支持所有单位，如px，vw，rpx，rem	|


### 回调
|  事件名	|    类型	|  回调参数	|    说明		|
|			|			|			|				|
| @previewImage	| function	|  index(当前所点击图片的下标)		|  图片点击事件	|


