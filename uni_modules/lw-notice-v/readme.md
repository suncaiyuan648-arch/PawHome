# lw-notice-v

垂直方向的通告栏。

## 参数说明：

|属性名|类型|默认值|说明|
|-----|-----|-----|-----|
|list|Array|[]|列表数据|
|showNum   |Number |5       |最多显示的条数，当 list 的长度大于此数目时才滚动。|
|height    |Number |40      |滚动条目的高度。|
|gap       |Number |10      |条目之间的间隔。|
|showOrder |Boolean|true    |是否显示编号。|
|showAvatar|Boolean|true    |是否显示头像。|
|avatarProp|String |'avatar'|头像在 list 对象中的属性名。|
|itemStyle |Object |{}      |每条通告的样式。|
|styles    |Array  |[]      |通告中每个文本的样式。|
|speed     |Number |60      |滚动速度，1 ~ 100。|

## list 数组说明

通知文本内容取的是 list 数组对象中的 `contents` 属性中的文本。例如：

```html
<script>
    export default {
        data() {
            return {
                list: [
                    {
                        contents: ['某某某', '获得了', '1000元', '大奖']
                    }
                ]
            }
        }
    }
</script>

```

如果需要给 `contents` 数组中的文本加样式。可以使用 `styles` 属性。例如：

```html
<template>
    <view>
        <lw-notice-v :list="list" :styles="styles"></lw-notice-v>
    </view>
</template>
<script>
    export default {
        data() {
            return {
                list: [
                    {
                        contents: ['某某某', '获得了', '1000元', '大奖']
                    }
                ],
                styles: [
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                    
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                    {
                        color: '#9F00E1',
                        fontSize: '14px'
                    },
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                ]
            }
        }
    }
</script>
```

注意：`styles` 数组中的样式对象，需要跟 `contents` 中的文本顺序保持一致。如果要跳过某个文本，可以在 `styles` 数组中写 `null`。例如，只给“某某某”和“1000元”添加样式：

```html
<template>
    <view>
        <lw-notice-v :list="list" :styles="styles"></lw-notice-v>
    </view>
</template>
<script>
    export default {
        data() {
            return {
                list: [
                    {
                        contents: ['某某某', '获得了', '1000元', '大奖']
                    }
                ],
                styles: [
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                    
                    null,
                    {
                        color: '#9F00E1',
                        fontSize: '14px'
                    },
                    null,
                ]
            }
        }
    }
</script>
```

## 使用示例：

```html
<template>
    <view>
        <lw-notice-v :list="list" :styles="styles"></lw-notice-v>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                styles: [
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                    
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                    {
                        color: '#9F00E1',
                        fontSize: '14px'
                    },
                    {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                ],
                list: [
                    {
                        avatar: '/static/images/test-avatar0.jpg',
                        contents: ['XXX', '获得', '100元', '奖励'],
                    },
                    {
                        avatar: '/static/images/test-avatar0.jpg',
                        contents: ['XXX', '获得', '100元', '奖励'],
                        
                    },
                    {
                        avatar: '/static/images/test-avatar0.jpg',
                        contents: ['XXX', '获得', '100元', '奖励'],
                    },
                    {
                        name: 'XXX',
                        avatar: '/static/images/test-avatar0.jpg',
                        contents: ['XXX', '获得', '100元', '奖励'],
                    },
                    {
                        avatar: '/static/images/test-avatar0.jpg',
                        contents: ['XXX', '获得', '100元', '奖励'],
                    },
                    {
                        avatar: '/static/images/test-avatar0.jpg',
                        contents: ['XXX', '获得', '100元', '奖励'],
                    },
                ]
            };
        }
    }
</script>
```
