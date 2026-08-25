const KEY = 'PAWHOME_ADOPTIONS'
const PICK_KEY = 'PAWHOME_ADOPTION_PICK'
const LAST_ID = 'PAWHOME_LAST_ADOPTION_ID'

export function getAdoptions() {
	try {
		const raw = uni.getStorageSync(KEY)
		return raw ? JSON.parse(raw) : []
	} catch (e) {
		return []
	}
}

export function saveAdoptions(list) {
	uni.setStorageSync(KEY, JSON.stringify(list))
}

export function addAdoption(rec) {
	const list = getAdoptions()
	list.unshift(rec)
	saveAdoptions(list)
	return rec
}

export function updateAdoption(id, patch) {
	const list = getAdoptions()
	const i = list.findIndex((x) => x.id === id)
	if (i < 0) return false
	list[i] = { ...list[i], ...patch }
	saveAdoptions(list)
	return true
}

export function getAdoptionById(id) {
	return getAdoptions().find((x) => x.id === id) || null
}

export function setAdoptionPick(payload) {
	uni.setStorageSync(PICK_KEY, JSON.stringify(payload || {}))
}

export function getAdoptionPick() {
	try {
		const raw = uni.getStorageSync(PICK_KEY)
		return raw ? JSON.parse(raw) : {}
	} catch (e) {
		return {}
	}
}

export function setLastAdoptionId(id) {
	if (id) uni.setStorageSync(LAST_ID, id)
	else uni.removeStorageSync(LAST_ID)
}

export function getLastAdoptionId() {
	return uni.getStorageSync(LAST_ID) || ''
}

/** 内置演示数据（与列表展示一致） */
export function getDemoAdoptions() {
	const petImg = '/static/home-feed-1.png'
	const pets = (names) =>
		names.map((name) => ({ name, avatar: petImg }))
	return [
		{
			id: 'demo-pending',
			status: 'pending',
			ownerName: '我就是要喂猫',
			yardName: '我就是要喂猫',
			yardTag: '小院',
			ownerAvatar: '/static/home-feed-2.png',
			applyText:
				'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
			pets: pets(['奥利奥', '呗呗']),
			applicantName: '逢猫'
		},
		{
			id: 'demo-rejected',
			status: 'rejected',
			ownerName: '我就是要喂猫',
			yardName: '我就是要喂猫',
			yardTag: '小院',
			ownerAvatar: '/static/home-feed-2.png',
			applyText:
				'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
			pets: pets(['奥利奥', '呗呗']),
			applicantName: '逢猫',
			rejectNote: '当前名额已满，建议您关注其他小院。'
		},
		{
			id: 'demo-pickup',
			status: 'pickup',
			ownerName: '我就是要喂猫',
			yardName: '我就是要喂猫',
			yardTag: '小院',
			ownerAvatar: '/static/home-feed-2.png',
			applyText:
				'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
			pets: pets(['奥利奥', '呗呗']),
			applicantName: '逢猫',
			location: '鼎丰前城小区',
			distance: '7.2km',
			ownerNick: '芝',
			ownerMessage:
				'你好，我是「我就是要喂猫」小院的院主，看到了你的领养申请。希望你能照顾好小猫在新家。小猫喜欢待在车库和地下室，领养后可以联系我，我给你指路。最好带笼子和网，小猫怕陌生人靠近会跑开。'
		},
		{
			id: 'demo-owner-confirm',
			status: 'owner_confirm',
			ownerName: '我就是要喂猫',
			yardName: '我就是要喂猫',
			yardTag: '小院',
			ownerAvatar: '/static/home-feed-2.png',
			applyText:
				'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
			pets: pets(['奥利奥', '呗呗']),
			applicantName: '逢猫',
			confirmStory:
				'我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了。'
		},
		{
			id: 'demo-jury-confirm',
			status: 'jury_confirm',
			ownerName: '我就是要喂猫',
			yardName: '我就是要喂猫',
			yardTag: '小院',
			ownerAvatar: '/static/home-feed-2.png',
			applyText:
				'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
			pets: pets(['奥利奥', '呗呗']),
			applicantName: '逢猫',
			confirmStory:
				'我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了。'
		},
		{
			id: 'demo-reward',
			status: 'reward',
			ownerName: '我就是要喂猫',
			yardName: '我就是要喂猫',
			yardTag: '小院',
			ownerAvatar: '/static/home-feed-2.png',
			applyText:
				'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
			pets: pets(['奥利奥', '呗呗']),
			applicantName: '逢猫',
			confirmStory:
				'我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了。'
		}
	]
}
