'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('dynamic detail state factories return independent, explicitly typed state', async () => {
	const metadata = await import(pathToFileURL(path.join(ROOT, 'packages/dynamic/services/detailMetadata.ts')).href + '?state=' + Date.now())
	const layout = { totalHeight: 64, statusBarHeight: 20, navBarHeight: 44 }
	const first = metadata.createDynamicDetailPageState(layout)
	const second = metadata.createDynamicDetailPageState(layout)

	assert.equal(first.recordStatus, 'loading')
	assert.equal(first.commentTotal, '共 0 条评论')
	assert.equal(first.navLayout, layout)
	assert.notEqual(first.mediaItems, second.mediaItems)
	assert.notEqual(first.comments, second.comments)
	assert.notEqual(first.yard, second.yard)
	assert.notEqual(first.yard.pets, second.yard.pets)
	first.comments.push({ id: 'local', author: { name: '', avatar: '' }, copy: '', meta: '', likes: 0, liked: false, children: [] })
	assert.equal(second.comments.length, 0)
})

test('dynamic detail route and persisted display data are narrowed into page contracts', async () => {
	const metadata = await import(pathToFileURL(path.join(ROOT, 'packages/dynamic/services/detailMetadata.ts')).href + '?normalize=' + Date.now())
	assert.deepEqual(metadata.normalizeDynamicDetailRoute({
		yardId: 'yard-1',
		dynamicId: 'dynamic-1',
		state: 'comments-empty',
		extra: 'ignored',
	}), { yardId: 'yard-1', dynamicId: 'dynamic-1', commentsEmpty: true })
	assert.deepEqual(metadata.normalizeDynamicDetailRoute(null), { yardId: '', dynamicId: '', commentsEmpty: false })

	const model = metadata.normalizeDynamicDetailRecord({
		yardId: 'yard-1',
		yard: {
			id: 'yard-1',
			name: '小院',
			avatar: '/yard.png',
			owner: { pawId: 'owner-1' },
			verified: true,
			tags: ['救助中', 12],
			gallery: [{ url: '/gallery.png', title: '猫咪' }, null],
			pets: [
				{ id: 'pet-1', name: '小花', avatar: '/pet.png', state: 'pending', adoptionValue: '20' },
				{ id: 'pet-bad', name: 1, avatar: '/bad.png', state: 'cloud' },
			],
		},
		author: { pawId: 'author-1', name: '作者', avatar: '/author.png' },
		currentUser: { avatar: '/current.png' },
		mediaItems: ['/media.png', null],
		announcementItems: ['announcement', null],
		feeders: [{ id: 1, avatar: '/feeder.png' }, '/feeder-2.png', null],
		rankItems: [{ id: 'rank-1', pawId: 'user-1', text: '投喂者', avatar: '/rank.png', level: 2, rankTitle: '第一名' }, null],
		comments: [
			{
				id: 'comment-1',
				author: { pawId: 'commenter-1', name: '评论者', avatar: '/commenter.png', level: 2 },
				copy: '评论内容',
				meta: '刚刚',
				likes: '3',
				liked: true,
				kind: 'voice',
				duration: 5,
				voiceBars: [2, '3', null],
				children: [{ id: 'reply-1', author: { name: '回复者', avatar: '/reply.png' }, copy: '回复', likes: 1 }],
			},
			null,
		],
		copy: '动态正文',
		meta: '今天',
		feedingSource: '投喂记录',
		feedSummary: '共投喂 1 斤',
		likes: 4,
		liked: false,
		commentsTotal: 2,
	})

	assert.ok(model)
	assert.equal(model.yard.owner.pawId, 'owner-1')
	assert.deepEqual(model.yard.tags, ['救助中'])
	assert.deepEqual(model.yard.gallery, [{ src: '/gallery.png', title: '猫咪' }])
	assert.equal(model.yard.pets[0].adoptionValue, '20')
	assert.equal(model.yard.pets[1].name, '猫咪')
	assert.equal(model.yard.pets.length, 2)
	assert.deepEqual(model.feeders, [{ id: 1, avatar: '/feeder.png' }, '/feeder-2.png'])
	assert.equal(model.rankItems[0].pawId, 'user-1')
	assert.equal(model.comments[0].author.name, '评论者')
	assert.equal(model.comments[0].likes, 3)
	assert.deepEqual(model.comments[0].voiceBars, [2, 3])
	assert.equal(model.comments[0].children[0].author.name, '回复者')
	assert.equal(metadata.normalizeDynamicDetailRecord(null), null)
})

test('dynamic detail page has no explicit any and declares its reply event contract', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/dynamic/pages/detail/index.vue'), 'utf8')
	const metadata = await fs.readFile(path.join(ROOT, 'packages/dynamic/services/detailMetadata.ts'), 'utf8')

	for (const source of [page, metadata]) assert.doesNotMatch(source, /\bany\b/)
	assert.match(page, /data\(\):\s*DynamicDetailPageState/)
	assert.match(page, /'reply-send':\s*\(text: string\)/)
})
