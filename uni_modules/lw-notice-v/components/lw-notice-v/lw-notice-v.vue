<template>
    <view class="lw-notice" :style="{height: `${showNum * (height + gap)}px`}">
        <view class="scroll-item-wrap" :style="{height: `${list.length * (height + gap) * repeat}px`, top: scrollTop + 'px'}">
            <view class="ranking-item" :style="{...itemStyle, height: `${height}px`, marginBottom: `${gap}px`, borderRadius: `${height/2}px`}" v-for='(it, index) in computedList' :key="index">
				<text v-if="showOrder" class="order">{{ it.order }}</text>
                <image v-if="showAvatar" :src="it[avatarProp]" class='avatar-img' mode="aspectFill"></image>
                <text v-for="(content, contentIndex) in it.contents" class="notice-text" :style="styles[contentIndex] || {}">{{ content }}</text>
            </view>
        </view>
    </view>
</template>
<script>
    export default {
        name: 'ScrollRanking',
        props: {
            list: {
                type: Array,
                default: () => []
            },
			// 最多显示的条数，默认为 5。当 list 的长度大于此数目时才滚动
			showNum: {
				type: Number,
				default: 5
			},
			// 滚动条目的高度，默认为 40 px
			height: {
				type: Number,
				default: 40
			},
			// 条目之间的间隔
			gap: {
				type: Number,
				default: 10
			},
			// 是否显示编号，默认为 false
			showOrder: {
				type: Boolean,
				default: true
			},
			// 是否显示头像
			showAvatar: {
				type: Boolean,
				default: true
			},
			// 头像在列表对象中的属性名
			avatarProp: {
				type: String,
				default: 'avatar'
			},
			itemStyle: {
				type: Object,
				default: () => ({})
			},
			styles: {
                type: Array,
                default: () => []
            },
			// 滚动速度，1 ~ 100
			speed: {
				type: Number,
				default: 60,
				validator(value) {
					return value >= 1 && value <= 100
				}
			}
        },
        data() {
            return {
                scrollTop: 0,
                running: false,
                repeat: 2,  // list 的重复次数，默认为 2
            }
        },
        methods: {
			animationFun(cb) {
			  return setTimeout(() => cb(), 1000 / this.speed);
			},
            run() {
                this.scrollTop -= 1
				
                if (this.scrollTop <= -this.list.length * (this.height + this.gap)) {
					console.log(this.scrollTop, this.list.length * (this.height + this.gap))
                    this.scrollTop = 0
                }
				
				this.animationFun(this.run)
            },
        },
        computed: {
            computedList() {
                const list = this.list.map((ele, idx) => ({...ele, order: idx + 1}))
                const array = []
                if (list.length > this.showNum) {
                    for (let i = 0; i < this.repeat; i++) {
                        array.push(...list)
                    }
                } else {
                    array.push(...list)
                }
                return array
            },
        },
        mounted() {
            if (this.list.length > this.showNum) {
                this.run()
            }
        },
    }
</script>
<style lang="scss">
    .lw-notice {
		box-sizing: border-box;
        width: 100%;
        overflow: hidden;
        .scroll-item-wrap {
			box-sizing: border-box;
            position: relative;
            overflow: hidden;
        }
    }

    .ranking-item {
		box-sizing: border-box;
        display: flex;
        align-items: center;
		gap: 8px;
		padding: 4px 12px;
		background: rgba(25, 23, 27, 0.50);
		backdrop-filter: blur(2px);
      }
	  
      .order {
		  box-sizing: border-box;
		  color: #ffffff;
		  width: 45rpx;
		  text-align: center;
	  }

      .avatar-img {
		box-sizing: border-box;
        width: 22px;
        height: 22px;
		flex-shrink: 0;
		
        border-radius: 50%;
      }
	  
	  .notice-text {
		box-sizing: border-box;
	  }
</style>
