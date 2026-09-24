export type YardReviewFeedTab = 'dynamic' | 'throw'
export type YardReviewReplyTarget = 'main' | number

export interface YardReviewMainMetadata {
	pawId: string
	name: string
	avatar: string
	sourceText: string
	meta: string
	copy: string
	voiceDuration: string
	voiceBars: number[]
	likes: number
	mediaUrls: string[]
}

interface YardReviewReplyBaseMetadata {
	id: number
	name: string
	tag?: string
	avatar: string
	meta: string
	likes: number
	liked: boolean
	pawId?: string
}

export interface YardReviewTextReplyMetadata extends YardReviewReplyBaseMetadata {
	kind: 'text'
	text: string
}

export interface YardReviewVoiceReplyMetadata extends YardReviewReplyBaseMetadata {
	kind: 'voice'
	duration: string
	voiceBars: number[]
}

export type YardReviewReplyMetadata = YardReviewTextReplyMetadata | YardReviewVoiceReplyMetadata

export interface YardThrowRecordMetadata {
	id: string
	name: string
	level: number
	avatar: string
	weightText: string
	feedbackText: string
	pawId?: string
}

export interface YardReviewFeedMockMetadata {
	main: YardReviewMainMetadata
	replies: YardReviewReplyMetadata[]
	throwRecords: YardThrowRecordMetadata[]
}

export interface YardReviewReplySendMetadata {
	text: string
	target: YardReviewReplyTarget | null
}

const YARD_REVIEW_FEED_MOCK: YardReviewFeedMockMetadata = {
	main: {
		pawId: 'review-feed-main',
		name: '姜栋',
		avatar: '/static/avatarlog.png',
		sourceText: '来自花开富贵投喂的4斤猫粮',
		meta: '昨天 20:45 江西',
		copy: '小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后面熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持，我一定会好好照顾这些可爱的小生命，让它们健康成长。'.repeat(3),
		voiceDuration: '12″',
		voiceBars: [6, 10, 5, 12, 7, 11, 8],
		likes: 12,
		mediaUrls: [
			'https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215',
			'https://img1.baidu.com/it/u=859607673,960376049&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
			'https://img2.baidu.com/it/u=70470028,1003557371&fm=253&fmt=auto&app=120&f=JPEG?w=1280&h=800',
			'https://img1.baidu.com/it/u=620762706,3267928372&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
			'https://img1.baidu.com/it/u=2278717026,2923133725&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=665',
			'https://img0.baidu.com/it/u=1170221409,3321766761&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
			'https://img2.baidu.com/it/u=669729424,1761575290&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
			'https://img2.baidu.com/it/u=2294066987,2848080806&fm=253&fmt=auto&app=120&f=JPEG?w=688&h=1215',
			'https://img0.baidu.com/it/u=3207802179,3637851356&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
		],
	},
	replies: [
		{
			id: 1,
			name: '姜栋',
			tag: '楼主',
			kind: 'text',
			text: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞',
			avatar: '/static/avatarlog.png',
			meta: '昨天 20:45 江西',
			likes: 32,
			liked: false,
		},
		{
			id: 2,
			name: '小院春风',
			kind: 'text',
			text: '猫猫真可爱，下次我也带点猫粮过去～',
			avatar: '/static/user.png',
			meta: '昨天 21:12 湖北',
			likes: 8,
			liked: false,
		},
		{
			id: 3,
			name: '爱心人士',
			kind: 'voice',
			duration: '8″',
			avatar: '/static/user.png',
			meta: '昨天 22:01 广东',
			likes: 5,
			liked: false,
			voiceBars: [5, 9, 6, 11, 7, 8, 6],
		},
		{
			id: 4,
			name: '夜猫子',
			kind: 'text',
			text: '加油！支持小院～',
			avatar: '/static/avatarlog.png',
			meta: '今天 08:30 河南',
			likes: 3,
			liked: false,
		},
		{
			id: 5,
			name: '粮满多',
			kind: 'text',
			text: '已投喂，注意查收～',
			avatar: '/static/user.png',
			meta: '今天 09:05 江苏',
			likes: 2,
			liked: false,
		},
		{
			id: 6,
			name: '橘座办事处',
			kind: 'text',
			text: '下次组团去看猫！',
			avatar: '/static/avatarlog.png',
			meta: '今天 10:18 四川',
			likes: 1,
			liked: false,
		},
	],
	throwRecords: [
		{ id: 't1', name: '平安是福', level: 1, avatar: '/static/user.png', weightText: '投粮200克', feedbackText: '已反馈2/5次' },
		{ id: 't2', name: '平安是福', level: 1, avatar: '/static/user.png', weightText: '投粮200克', feedbackText: '已反馈2/5次' },
		{ id: 't3', name: '平安是福', level: 1, avatar: '/static/user.png', weightText: '投粮200克', feedbackText: '已反馈2/5次' },
		{ id: 't4', name: '平安是福', level: 1, avatar: '/static/user.png', weightText: '投粮200克', feedbackText: '已反馈2/5次' },
	],
}

/** Return isolated mutable fixture copies for each review-feed instance. */
export function createYardReviewFeedMocks(): YardReviewFeedMockMetadata {
	return {
		main: {
			...YARD_REVIEW_FEED_MOCK.main,
			voiceBars: [...YARD_REVIEW_FEED_MOCK.main.voiceBars],
			mediaUrls: [...YARD_REVIEW_FEED_MOCK.main.mediaUrls],
		},
		replies: YARD_REVIEW_FEED_MOCK.replies.map((reply) =>
			reply.kind === 'voice'
				? { ...reply, voiceBars: [...reply.voiceBars] }
				: { ...reply },
		),
		throwRecords: YARD_REVIEW_FEED_MOCK.throwRecords.map((record) => ({ ...record })),
	}
}
