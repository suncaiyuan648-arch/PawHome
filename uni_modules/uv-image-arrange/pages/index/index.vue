<template>
	<view  style="display: flex;justify-content: flex-start;flex-wrap: wrap;">
		<view style="width: 300px;">
			<view style="color: #999;margin-top: 30px;text-align: center;">单张展示</view>
			<uv-image-arrange :list="list" style="padding:0 10px;"  maxWidth="280px" maxHeight="280px"></uv-image-arrange>
		</view>
		
		<view style="width: 300px;">
		<view style="color: #999;margin-top: 30px;text-align: center;">多张展示 - 4</view>
		<uv-image-arrange :list="list4" style="padding:0 10px;"></uv-image-arrange>
		</view>
		
		<view style="width: 300px;">
		<view style="color: #999;margin-top: 30px;text-align: center;">多张展示 - 9</view>
		<uv-image-arrange :list="list9" style="padding: 0 10px;"></uv-image-arrange>
		</view>
		
		<view style="width: 300px;">
		<view style="color: #999;margin-top: 30px;text-align: center;">多张展示 - 3</view>
		<uv-image-arrange :list="list3" style="padding:0 10px;"></uv-image-arrange>
		</view>
		
		<view style="width: 300px;">
		<view style="color: #999;margin-top: 30px;text-align: center;">多张展示 - 6</view>
		<uv-image-arrange :list="list5" style="padding: 0 10px;"></uv-image-arrange>
		</view>
		
		<view style="width: 300px;">
		<view style="color: #999;margin-top: 30px;text-align: center;">多张展示 - 5</view>
		<uv-image-arrange :list="list6" style="padding: 0 10px;"></uv-image-arrange>
		</view>
		
		
		<view style="width: 300px;">
		  <view style="color: #999;margin-top: 30px;text-align: center;">定义外框大小，内部自动排列</view>
		  <uv-image-arrange :list="list9" style="padding: 0 50px;"></uv-image-arrange>
		 <uv-image-arrange :list="list9" style="padding: 0 100px;margin-top: 15px;"></uv-image-arrange>
		</view>
		
		<view style="width: 300px;">
		 <view style="color: #999;margin-top: 30px;text-align: center;">单张自定义最大高度和最大宽度自动展示</view>
		 <uv-image-arrange :list="list" style="margin: 0 50px;"  maxWidth="200px" maxHeight="200px"></uv-image-arrange>
		  <uv-image-arrange :list="['https://img1.baidu.com/it/u=86988454,3511518570&fm=253&fmt=auto&app=138&f=JPEG?w=833&h=500']" 
	    	style="margin: 15px 50px 0 50px;"  maxWidth="200px" maxHeight="200px"></uv-image-arrange>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: ['https://img1.baidu.com/it/u=2693733305,4035903587&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200'],
				
				list3: ['https://img2.baidu.com/it/u=780026562,1870112252&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=889',
				'https://img2.baidu.com/it/u=3946513537,3753906297&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200',
				'https://img2.baidu.com/it/u=3933934708,2924683722&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=667'],
				
				list4: ['https://img1.baidu.com/it/u=3332294074,983489979&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=1026',
				'https://img0.baidu.com/it/u=540669065,2162680038&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750',
				'https://img2.baidu.com/it/u=1870900417,1689048584&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=1200',
				'https://img1.baidu.com/it/u=1822063758,1484089516&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=750'],
				
				
				list5: ['https://img2.baidu.com/it/u=780026562,1870112252&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=889',
				'https://img2.baidu.com/it/u=3946513537,3753906297&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200',
				'https://img2.baidu.com/it/u=3933934708,2924683722&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=667',
				'https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215',
				'https://img0.baidu.com/it/u=3207802179,3637851356&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500'],
				
				list6: ['https://img2.baidu.com/it/u=780026562,1870112252&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=889',
				'https://img2.baidu.com/it/u=3946513537,3753906297&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200',
				'https://img2.baidu.com/it/u=3933934708,2924683722&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=667',
				'https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215',
				'https://img0.baidu.com/it/u=3207802179,3637851356&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
				'https://img0.baidu.com/it/u=3207802179,3637851356&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500'],
				
				list9: ['https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215',
				'https://img1.baidu.com/it/u=859607673,960376049&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
				'https://img2.baidu.com/it/u=70470028,1003557371&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
				'https://img1.baidu.com/it/u=620762706,3267928372&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
				'https://img1.baidu.com/it/u=2278717026,2923133725&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=665',
				'https://img0.baidu.com/it/u=1170221409,3321766761&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
				'https://img2.baidu.com/it/u=669729424,1761575290&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
				'https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215',
				'https://img0.baidu.com/it/u=3207802179,3637851356&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500']
			};
		},
		methods: {},
		mounted() {},
		created() {}
	}
</script>

<style scoped lang="less">
</style>