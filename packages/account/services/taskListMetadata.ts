import type { taskCards } from './taskPageModel.ts'
import type { readAccountTasks } from './tasksRuntime.ts'
import type { AccountTaskActorRole, AccountTaskStatus } from './accountTaskContracts.ts'

export type AccountTaskTab = 'pending' | 'processed'
export type AccountTaskCard = ReturnType<typeof taskCards>[number]
export type AccountTaskReadResult = ReturnType<typeof readAccountTasks>
export type AccountTaskStatusTone = 'danger' | 'success' | 'brand' | 'warning'

export interface AccountTaskTabMetadata {
	key: AccountTaskTab
	label: string
}

export interface AccountTaskPageState {
	activeTab: AccountTaskTab
	tabs: AccountTaskTabMetadata[]
	model: AccountTaskReadResult | null
	cards: readonly AccountTaskCard[]
	pendingCount: number
	actorError: AccountTaskReadResult['diagnostics']['actorError']
	diagnosticText: string
	adapter: Readonly<{ read: () => AccountTaskReadResult }>
}

const TASK_TABS: readonly AccountTaskTabMetadata[] = Object.freeze([
	{ key: 'pending', label: '待处理' },
	{ key: 'processed', label: '已处理' },
])

const ROLE_LABELS: Readonly<Record<string, string>> = Object.freeze({
	applicant: '申请人',
	owner: '小院主理人',
	cloud_parent: '云家长',
	reviewer: '评审人',
	verifier: '证实人',
})

export function createAccountTaskPageState(reader: () => AccountTaskReadResult): AccountTaskPageState {
	return {
		activeTab: 'pending',
		tabs: TASK_TABS.map((tab) => ({ ...tab })),
		model: null,
		cards: Object.freeze([]),
		pendingCount: 0,
		actorError: null,
		diagnosticText: '',
		adapter: Object.freeze({ read: reader }),
	}
}

export function filterAccountTaskCards(cards: readonly AccountTaskCard[], tab: AccountTaskTab): AccountTaskCard[] {
	return cards.filter((task) => {
		const pending = task.status === 'pending' || task.status === 'in_progress'
		return tab === 'pending' ? pending : !pending
	})
}

export function getAccountTaskStatusTone(status: AccountTaskStatus): AccountTaskStatusTone {
	if (status === 'failed' || status === 'cancelled' || status === 'expired') return 'danger'
	if (status === 'completed' || status === 'processed') return 'success'
	if (status === 'in_progress') return 'brand'
	return 'warning'
}

export function getAccountTaskRoleLabel(role: AccountTaskActorRole): string {
	if (!Object.prototype.hasOwnProperty.call(ROLE_LABELS, role)) return '参与者'
	return ROLE_LABELS[role]
}
