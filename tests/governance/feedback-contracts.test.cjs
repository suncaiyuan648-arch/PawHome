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
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-feedback-contract-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  const sourcePath = path.join(ROOT, 'navigation/feedbackContracts.ts')
  const targetPath = path.join(tempRoot, 'feedbackContracts.ts')
  await fs.copyFile(sourcePath, targetPath)
  api = await import(`${pathToFileURL(targetPath).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

const policy = Object.freeze({
  version: 'feedback-v1',
  evidenceKinds: ['dynamic', 'feeding_evidence'],
  requiredCount: 2,
  maximumCount: 3,
  startsAt: '2026-09-01T00:00:00Z',
  expiresAt: '2026-10-01T00:00:00Z',
  countRules: {
    pending: 'exclude',
    active: 'count',
    corrected: 'count',
    deleted: 'exclude',
    withdrawn: 'exclude',
    rejected: 'exclude',
  },
  lastFeedbackStates: ['active', 'corrected'],
})

function actorProvider(actorId = 'actor-001') {
  return () => ({ actor: { id: actorId, roles: [] } })
}

function order(overrides = {}) {
  return {
    orderId: 'order-001',
    animalId: 'animal-001',
    yardId: 'yard-001',
    ...overrides,
  }
}

function animal(overrides = {}) {
  return {
    animalId: 'animal-001',
    yardId: 'yard-001',
    ...overrides,
  }
}

function feedingEvidence(overrides = {}) {
  return {
    evidenceId: 'evidence-001',
    dynamicId: 'dynamic-001',
    kind: api.FEEDBACK_KINDS.FEEDING_EVIDENCE,
    actorId: 'actor-001',
    policyVersion: policy.version,
    attemptKey: 'attempt-001',
    requestId: 'request-001',
    state: 'active',
    createdAt: '2026-09-05T00:00:00Z',
    order: order(),
    animal: animal(),
    ...overrides,
  }
}

function dynamicEvidence(overrides = {}) {
  return {
    evidenceId: 'dynamic-evidence-001',
    dynamicId: 'dynamic-001',
    kind: api.FEEDBACK_KINDS.DYNAMIC,
    actorId: 'actor-001',
    policyVersion: policy.version,
    attemptKey: 'attempt-001',
    requestId: 'request-001',
    state: 'active',
    createdAt: '2026-09-05T00:00:00Z',
    ...overrides,
  }
}

function feedingTask(evidence, overrides = {}) {
  return {
    kind: api.FEEDBACK_KINDS.FEEDING_EVIDENCE,
    actorId: 'actor-001',
    policyVersion: policy.version,
    order: order(),
    animal: animal(),
    evidence,
    nextFeedbackAt: '2026-09-10T00:00:00Z',
    ...overrides,
  }
}

function throwsCode(callback, code) {
  assert.throws(callback, (error) => error && error.code === code)
}

test('contract is pure and separates ordinary dynamics from feeding evidence', async () => {
  const source = await fs.readFile(path.join(ROOT, 'navigation/feedbackContracts.ts'), 'utf8')
  assert.doesNotMatch(
    source,
    /(?:from\s+['"][^'"]*(?:vue|uni|pages|storage|mock)|require\s*\([^)]*(?:vue|uni|pages|storage|mock)|uni\.)/i,
  )
  const dynamic = api.normalizeFeedbackEvidence(dynamicEvidence(), policy)
  assert.equal(dynamic.kind, api.FEEDBACK_KINDS.DYNAMIC)
  assert.equal('orderId' in dynamic, false)
  const feeding = api.normalizeFeedbackEvidence(feedingEvidence(), policy)
  assert.equal(feeding.kind, api.FEEDBACK_KINDS.FEEDING_EVIDENCE)
  assert.equal(feeding.orderId, 'order-001')
})

test('missing or incomplete product policy fails closed', () => {
  throwsCode(() => api.normalizeFeedbackPolicy(null), 'POLICY_REQUIRED')
  throwsCode(
    () => api.normalizeFeedbackPolicy({ ...policy, countRules: undefined }),
    'COUNT_RULES_REQUIRED',
  )
  throwsCode(
    () => api.normalizeFeedbackPolicy({ ...policy, lastFeedbackStates: undefined }),
    'LAST_FEEDBACK_RULE_REQUIRED',
  )
  throwsCode(
    () => api.normalizeFeedbackPolicy({ ...policy, maximumCount: 1 }),
    'INVALID_POLICY_COUNT',
  )
  throwsCode(
    () =>
      api.summarizeFeedbackTask(feedingTask([]), {
        now: '2026-09-10T00:00:00Z',
        actorProvider: actorProvider(),
      }),
    'POLICY_REQUIRED',
  )
})

test('feeding evidence requires an exact order, animal, and yard association', () => {
  throwsCode(
    () =>
      api.normalizeFeedbackEvidence(
        feedingEvidence({ animal: animal({ yardId: 'yard-002' }) }),
        policy,
      ),
    'CROSS_YARD_ASSOCIATION',
  )
  throwsCode(
    () =>
      api.normalizeFeedbackEvidence(
        feedingEvidence({ order: order({ animalId: 'animal-002' }) }),
        policy,
      ),
    'ASSOCIATION_CONFLICT',
  )
  throwsCode(
    () =>
      api.normalizeFeedbackEvidence(
        feedingEvidence({ order: order({ orderId: 'https://bad/order' }) }),
        policy,
      ),
    'INVALID_ID',
  )
  throwsCode(
    () =>
      api.normalizeFeedbackEvidence(feedingEvidence({ query: { orderId: 'order-001' } }), policy),
    'UNKNOWN_FIELD',
  )
  throwsCode(
    () => api.normalizeFeedbackEvidence(dynamicEvidence({ order: null }), policy),
    'CROSS_DOMAIN_FIELD',
  )
  throwsCode(
    () => api.normalizeFeedbackEvidence(dynamicEvidence({ animal: '' }), policy),
    'CROSS_DOMAIN_FIELD',
  )
  throwsCode(
    () =>
      api.feedbackBusinessKey({
        kind: api.FEEDBACK_KINDS.DYNAMIC,
        dynamicId: 'dynamic-001',
        actorId: 'actor-001',
        policyVersion: policy.version,
        attemptKey: 'attempt-001',
        query: 'ignored',
      }),
    'UNKNOWN_FIELD',
  )
  throwsCode(
    () =>
      api.feedbackRequestKey({
        kind: api.FEEDBACK_KINDS.DYNAMIC,
        dynamicId: 'dynamic-001',
        actorId: 'actor-001',
        policyVersion: policy.version,
        attemptKey: 'attempt-001',
        requestId: 'request-001',
        query: 'ignored',
      }),
    'UNKNOWN_FIELD',
  )
  throwsCode(
    () =>
      api.feedbackBusinessKey({
        kind: api.FEEDBACK_KINDS.FEEDING_EVIDENCE,
        dynamicId: null,
        orderId: 'order-001',
        animalId: 'animal-001',
        yardId: 'yard-001',
        actorId: 'actor-001',
        policyVersion: policy.version,
        attemptKey: 'attempt-001',
      }),
    'CROSS_DOMAIN_FIELD',
  )
})

test('business key makes request retries idempotent while a new attempt is distinct', () => {
  const first = api.normalizeFeedbackEvidence(feedingEvidence(), policy)
  const retry = api.normalizeFeedbackEvidence(
    feedingEvidence({ evidenceId: 'evidence-retry', requestId: 'request-retry' }),
    policy,
  )
  const next = api.normalizeFeedbackEvidence(
    feedingEvidence({
      evidenceId: 'evidence-002',
      attemptKey: 'attempt-002',
      requestId: 'request-002',
    }),
    policy,
  )
  assert.equal(first.businessKey, retry.businessKey)
  assert.notEqual(first.businessKey, next.businessKey)
  assert.notEqual(first.requestKey, retry.requestKey)
  assert.equal(
    api.dedupeFeedbackEvidence(
      [
        feedingEvidence(),
        feedingEvidence({ evidenceId: 'evidence-retry', requestId: 'request-retry' }),
        feedingEvidence({
          evidenceId: 'evidence-002',
          attemptKey: 'attempt-002',
          requestId: 'request-002',
        }),
      ],
      { policy },
    ).length,
    2,
  )
  throwsCode(
    () =>
      api.dedupeFeedbackEvidence(
        [
          feedingEvidence(),
          feedingEvidence({ evidenceId: 'evidence-002', attemptKey: 'attempt-002' }),
        ],
        { policy },
      ),
    'REQUEST_KEY_REUSE',
  )
})

test('deleted and withdrawn evidence follow injected count rules; no delete API exists', () => {
  const active = feedingEvidence()
  const deletedLatest = feedingEvidence({
    evidenceId: 'evidence-deleted',
    requestId: 'request-deleted',
    attemptKey: 'attempt-002',
    state: 'deleted',
    createdAt: '2026-09-06T00:00:00Z',
  })
  const summary = api.summarizeFeedbackTask(feedingTask([active, deletedLatest]), {
    policy,
    now: '2026-09-10T00:00:00Z',
    actorProvider: actorProvider(),
  })
  assert.equal(summary.completedCount, 1)
  assert.equal(summary.status, 'pending')
  assert.equal(summary.lastFeedbackAt, '2026-09-05T00:00:00.000Z')
  const retainDeleted = {
    ...policy,
    countRules: { ...policy.countRules, deleted: 'count' },
    lastFeedbackStates: ['active', 'deleted'],
  }
  const retained = api.summarizeFeedbackTask(feedingTask([active, deletedLatest]), {
    policy: retainDeleted,
    now: '2026-09-10T00:00:00Z',
    actorProvider: actorProvider(),
  })
  assert.equal(retained.completedCount, 2)
  assert.equal(retained.status, 'completed')
  throwsCode(
    () => api.normalizeFeedbackEvidence({ ...active, mutationIntent: 'delete' }, policy),
    'MUTATION_INTENT_NOT_SUPPORTED',
  )
  throwsCode(
    () => api.normalizeFeedbackEvidence({ ...active, mutationIntent: 'correct' }, policy),
    'MUTATION_INTENT_NOT_SUPPORTED',
  )
})

test('read model distinguishes scheduled, completed, excess, and overdue', () => {
  const one = feedingEvidence()
  const two = feedingEvidence({
    evidenceId: 'evidence-002',
    requestId: 'request-002',
    attemptKey: 'attempt-002',
    createdAt: '2026-09-06T00:00:00Z',
  })
  const three = feedingEvidence({
    evidenceId: 'evidence-003',
    requestId: 'request-003',
    attemptKey: 'attempt-003',
    createdAt: '2026-09-07T00:00:00Z',
  })
  assert.equal(
    api.summarizeFeedbackTask(feedingTask([one]), {
      policy,
      now: '2026-09-10T00:00:00Z',
      actorProvider: actorProvider(),
    }).status,
    'pending',
  )
  assert.equal(
    api.summarizeFeedbackTask(feedingTask([one, two]), {
      policy,
      now: '2026-09-10T00:00:00Z',
      actorProvider: actorProvider(),
    }).status,
    'completed',
  )
  assert.equal(
    api.summarizeFeedbackTask(feedingTask([one, two, three]), {
      policy,
      now: '2026-09-10T00:00:00Z',
      actorProvider: actorProvider(),
    }).status,
    'excess',
  )
  const four = feedingEvidence({
    evidenceId: 'evidence-004',
    requestId: 'request-004',
    attemptKey: 'attempt-004',
    createdAt: '2026-09-08T00:00:00Z',
  })
  const overLimit = api.summarizeFeedbackTask(feedingTask([one, two, three, four]), {
    policy,
    now: '2026-09-10T00:00:00Z',
    actorProvider: actorProvider(),
  })
  assert.equal(overLimit.status, 'excess')
  assert.equal(overLimit.limitExceeded, true)
  assert.equal(
    api.summarizeFeedbackTask(feedingTask([one]), {
      policy,
      now: '2026-10-02T00:00:00Z',
      actorProvider: actorProvider(),
    }).status,
    'overdue',
  )
  assert.equal(
    api.summarizeFeedbackTask(feedingTask([one]), {
      policy,
      now: '2026-08-31T00:00:00Z',
      actorProvider: actorProvider(),
    }).status,
    'scheduled',
  )
})

test('dynamic evidence never grants order or animal write capability', () => {
  const summary = api.summarizeFeedbackTask(
    {
      kind: api.FEEDBACK_KINDS.DYNAMIC,
      dynamicId: 'dynamic-001',
      actorId: 'actor-001',
      policyVersion: policy.version,
      evidence: [dynamicEvidence()],
    },
    { policy, now: '2026-09-10T00:00:00Z', actorProvider: actorProvider() },
  )
  const ownAccess = api.getFeedbackTaskAccess(summary, { actorProvider: actorProvider() })
  const otherAccess = api.getFeedbackTaskAccess(summary, {
    actorProvider: actorProvider('actor-002'),
  })
  assert.equal(ownAccess.canRead, true)
  assert.equal(ownAccess.canWriteOrder, false)
  assert.equal(ownAccess.canWriteAnimal, false)
  assert.equal(ownAccess.canDeleteEvidence, false)
  assert.equal(ownAccess.canCorrectEvidence, false)
  assert.equal(otherAccess.canRead, false)
})

test('window bounds apply to evidence counting and lastFeedbackAt, including future evidence', () => {
  const beforeWindow = feedingEvidence({
    evidenceId: 'evidence-before',
    requestId: 'request-before',
    attemptKey: 'attempt-before',
    createdAt: '2026-08-31T23:59:59Z',
  })
  const startBoundary = feedingEvidence({
    evidenceId: 'evidence-start',
    requestId: 'request-start',
    attemptKey: 'attempt-start',
    createdAt: '2026-09-01T00:00:00Z',
  })
  const nowBoundary = feedingEvidence({
    evidenceId: 'evidence-now',
    requestId: 'request-now',
    attemptKey: 'attempt-now',
    createdAt: '2026-09-10T00:00:00Z',
  })
  const future = feedingEvidence({
    evidenceId: 'evidence-future',
    requestId: 'request-future',
    attemptKey: 'attempt-future',
    createdAt: '2026-09-10T00:00:01Z',
  })
  const endBoundary = feedingEvidence({
    evidenceId: 'evidence-end',
    requestId: 'request-end',
    attemptKey: 'attempt-end',
    createdAt: '2026-10-01T00:00:00Z',
  })
  const afterWindow = feedingEvidence({
    evidenceId: 'evidence-after',
    requestId: 'request-after',
    attemptKey: 'attempt-after',
    createdAt: '2026-10-01T00:00:01Z',
  })
  const summary = api.summarizeFeedbackTask(
    feedingTask([beforeWindow, startBoundary, nowBoundary, future, endBoundary, afterWindow]),
    { policy, now: '2026-09-10T00:00:00Z', actorProvider: actorProvider() },
  )
  assert.equal(summary.completedCount, 2)
  assert.equal(summary.evidenceCount, 2)
  assert.equal(summary.lastFeedbackAt, '2026-09-10T00:00:00.000Z')
  const endSummary = api.summarizeFeedbackTask(feedingTask([endBoundary, afterWindow]), {
    policy: { ...policy, requiredCount: 1, maximumCount: 1 },
    now: '2026-10-01T00:00:00Z',
    actorProvider: actorProvider(),
  })
  assert.equal(endSummary.completedCount, 1)
  assert.equal(endSummary.lastFeedbackAt, '2026-10-01T00:00:00.000Z')
})

test('withdrawn, corrected, and rejected states remain explicit and obey policy', () => {
  const corrected = feedingEvidence({
    evidenceId: 'evidence-corrected',
    requestId: 'request-corrected',
    attemptKey: 'attempt-corrected',
    state: 'corrected',
    createdAt: '2026-09-06T00:00:00Z',
  })
  const withdrawn = feedingEvidence({
    evidenceId: 'evidence-withdrawn',
    requestId: 'request-withdrawn',
    attemptKey: 'attempt-withdrawn',
    state: 'withdrawn',
    createdAt: '2026-09-07T00:00:00Z',
  })
  const rejected = feedingEvidence({
    evidenceId: 'evidence-rejected',
    requestId: 'request-rejected',
    attemptKey: 'attempt-rejected',
    state: 'rejected',
    createdAt: '2026-09-08T00:00:00Z',
  })
  const summary = api.summarizeFeedbackTask(feedingTask([corrected, withdrawn, rejected]), {
    policy,
    now: '2026-09-10T00:00:00Z',
    actorProvider: actorProvider(),
  })
  assert.equal(summary.completedCount, 1)
  assert.equal(summary.status, 'pending')
  assert.equal(summary.lastFeedbackAt, '2026-09-06T00:00:00.000Z')
})

test('private task summary and access require a fresh trusted actorProvider', () => {
  throwsCode(
    () => api.summarizeFeedbackTask(feedingTask([]), { policy, now: '2026-09-10T00:00:00Z' }),
    'ACTOR_PROVIDER_REQUIRED',
  )
  const summary = api.summarizeFeedbackTask(feedingTask([]), {
    policy,
    now: '2026-09-10T00:00:00Z',
    actorProvider: actorProvider(),
  })
  assert.equal(api.getFeedbackTaskAccess(summary, { id: 'actor-001' }).canRead, false)
  let currentActor = 'actor-001'
  let calls = 0
  const provider = () => {
    calls += 1
    return { actor: { id: currentActor } }
  }
  assert.equal(api.getFeedbackTaskAccess(summary, { actorProvider: provider }).canRead, true)
  currentActor = 'actor-002'
  assert.equal(api.getFeedbackTaskAccess(summary, { actorProvider: provider }).canRead, false)
  assert.equal(calls, 2)
  throwsCode(
    () =>
      api.summarizeFeedbackTask(feedingTask([]), {
        policy,
        now: '2026-09-10T00:00:00Z',
        actorProvider: actorProvider('actor-002'),
      }),
    'ACTOR_MISMATCH',
  )
})

test('timestamp overflow is rejected instead of escaping a RangeError', () => {
  throwsCode(
    () => api.normalizeFeedbackPolicy({ ...policy, startsAt: Number.MAX_SAFE_INTEGER }),
    'INVALID_TIMESTAMP',
  )
  throwsCode(
    () =>
      api.normalizeFeedbackEvidence(
        feedingEvidence({ createdAt: Number.MAX_SAFE_INTEGER }),
        policy,
      ),
    'INVALID_TIMESTAMP',
  )
})
