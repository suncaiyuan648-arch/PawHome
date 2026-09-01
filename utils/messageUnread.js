const MESSAGE_UNREAD_COUNTS = Object.freeze({
	interaction: 3,
	order: 3,
	service: 3,
	system: 3,
	activity: 3,
	pet: 3
})

export function getMessageUnreadCount(type) {
	const count = Number(MESSAGE_UNREAD_COUNTS[type])
	return Number.isFinite(count) && count > 0 ? count : 0
}

export function getTotalMessageUnreadCount() {
	return Object.keys(MESSAGE_UNREAD_COUNTS).reduce((total, type) => total + getMessageUnreadCount(type), 0)
}
