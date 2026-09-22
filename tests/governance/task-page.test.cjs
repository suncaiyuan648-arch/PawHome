'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-task-page-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/account/services'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'packages/account/services/taskPageModel.js'),
    path.join(tempRoot, 'packages/account/services/taskPageModel.js')
  )
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/taskPageModel.js')).href}?test=${Date.now()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function task(overrides = {}) {
  return {
    taskId: 'task:adoption',
    businessType: 'adoption',
    businessId: 'adoption-1',
    actorId: 'actor-1',
    actorRole: 'applicant',
    actionType: 'apply',
    status: 'pending',
    ...overrides,
  }
}

test('task page cards preserve canonical identity and expose frozen display metadata', () => {
  const card = api.taskCardModel(task({ reviewItemId: 'review-1' }))
  assert.deepEqual({
    taskId: card.taskId,
    businessId: card.businessId,
    businessLabel: card.businessLabel,
    actionLabel: card.actionLabel,
    statusLabel: card.statusLabel,
    reviewItemId: card.reviewItemId,
  }, {
    taskId: 'task:adoption',
    businessId: 'adoption-1',
    businessLabel: '领养',
    actionLabel: '申请处理',
    statusLabel: '待处理',
    reviewItemId: 'review-1',
  })
  assert.equal(Object.isFrozen(card), true)
  assert.equal(Object.isFrozen(api.taskCards([task(), task({ status: 'processed' })])), true)
})

test('task page only returns registered detail targets with contract-owned IDs', () => {
  assert.deepEqual(api.taskDetailTarget(task()), {
    routeName: 'adoption.progress',
    businessIdParam: 'applicationId',
    params: { applicationId: 'adoption-1' },
  })
  assert.deepEqual(api.taskDetailTarget(task({ businessType: 'rescue', businessId: 'rescue-1', actionType: 'fund' })), {
    routeName: 'rescue.progress',
    businessIdParam: 'rescueId',
    params: { rescueId: 'rescue-1' },
  })
  for (const item of [
    task({ actionType: 'review', reviewItemId: 'review-1' }),
    task({ businessId: '' }),
  ]) assert.equal(api.taskDetailTarget(item), null)
  assert.deepEqual(api.taskDetailTarget(task({
    actorRole: 'owner',
    actionType: 'review',
    reviewItemId: 'review-owner-1',
  })), {
    routeName: 'adoption.review.detail',
    businessIdParam: 'applicationId',
    params: { applicationId: 'adoption-1', reviewItemId: 'review-owner-1' },
  })
  assert.deepEqual(api.taskDetailTarget(task({
    actorRole: 'cloud_parent',
    actionType: 'review',
    reviewItemId: 'review-cloud-1',
  })), {
    routeName: 'adoption.review.detail',
    businessIdParam: 'applicationId',
    params: { applicationId: 'adoption-1', reviewItemId: 'review-cloud-1' },
  })
  assert.deepEqual(api.taskDetailTarget(task({
    actorRole: 'reviewer',
    actionType: 'review',
    reviewItemId: 'review-jury-1',
  })), {
    routeName: 'adoption.jury.detail',
    businessIdParam: null,
    params: { reviewItemId: 'review-jury-1', businessType: 'adoption' },
  })
  assert.deepEqual(api.taskDetailTarget(task({
    businessType: 'rescue',
    businessId: 'rescue-1',
    actorRole: 'reviewer',
    actionType: 'review',
    reviewItemId: 'review-rescue-1',
  })), {
    routeName: 'rescue.review.detail',
    businessIdParam: null,
    params: { reviewItemId: 'review-rescue-1', businessType: 'rescue' },
  })
  assert.deepEqual(api.taskDetailTarget(task({ businessType: 'feeding', businessId: 'order-1', actionType: 'feedback', actorRole: 'donor' })), {
    routeName: 'feeding.order.detail', businessIdParam: 'orderId', params: { orderId: 'order-1' },
  })
  assert.deepEqual(api.taskDetailTarget(task({ businessType: 'dynamic', businessId: 'dynamic-1', actionType: 'publish', actorRole: 'author' })), {
    routeName: 'dynamic.detail', businessIdParam: 'dynamicId', params: { dynamicId: 'dynamic-1' },
  })
})

test('task page source remains read-only and does not infer actor or fabricate detail paths', async () => {
  const source = await fs.readFile(path.join(ROOT, 'packages/account/pages/tasks/index.vue'), 'utf8')
  assert.match(source, /createTaskAdapter/)
  assert.match(source, /createActorProvider/)
  assert.match(source, /createDomainTaskReaders/)
  assert.match(source, /taskDetailTarget/)
  assert.doesNotMatch(source, /setStorageSync|removeStorageSync/)
  assert.doesNotMatch(source, /statusBarHeight|getMenuButtonBoundingClientRect/)
  assert.doesNotMatch(source, /\/packages\/(?:feeding|dynamic)\/pages/)
})

test('account tasks has a stable existing entry from the account drawer', async () => {
  const source = await fs.readFile(path.join(ROOT, 'pages/me/index.vue'), 'utf8')
  assert.match(source, /'我的任务'/)
  assert.match(source, /buildRoute\('account\.tasks', \{\}\)/)
})
