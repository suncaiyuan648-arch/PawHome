'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('address form mocks share typed service/shipping metadata and clone mutable regions', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'utils/addressFormMetadata.ts')).href}?test=${Date.now()}`)
	const shipping = metadata.createAddressFormDemoMetadata('shipping')
	const service = metadata.createAddressFormDemoMetadata('service')
	assert.equal(shipping.name, '菠萝吹雪')
	assert.equal(shipping.detail, '找到一个大树根，绕着大树左转三圈右转三圈')
	assert.equal(service.detail, '鼎丰前程')
	assert.deepEqual(shipping.regionParts, ['湖南省', '长沙市', '雨花区'])
	shipping.regionParts.push('被隔离的修改')
	assert.deepEqual(metadata.createAddressFormDemoMetadata('shipping').regionParts, ['湖南省', '长沙市', '雨花区'])

	assert.deepEqual(metadata.normalizeAddressFormDraft({
		name: '联系人',
		phone: 123456,
		detail: '门牌',
		regionParts: ['湖南省', null, '长沙市', 4, '雨花区', '忽略第四级以外'],
		isDefault: true,
	}), {
		name: '联系人',
		phone: '123456',
		detail: '门牌',
		regionParts: ['湖南省', '长沙市', '雨花区', '忽略第四级以外'],
		isDefault: true,
	})
	assert.deepEqual(metadata.normalizeAddressFormDraft(null), {
		name: '', phone: '', detail: '', regionParts: [], isDefault: false,
	})
	assert.deepEqual(metadata.normalizeWechatAddressDraft({
		userName: '微信联系人',
		telNumber: '13300001111',
		provinceName: '湖南省',
		cityName: '长沙市',
		countyName: '雨花区',
		detailInfo: '中意一路',
	}), {
		name: '微信联系人',
		phone: '13300001111',
		detail: '中意一路',
		regionParts: ['湖南省', '长沙市', '雨花区'],
		isDefault: false,
	})
})

test('address form uses shared address models and has no explicit any annotations', async () => {
	const source = await fs.readFile(path.join(ROOT, 'packages/address/components/address/PawAddressForm.vue'), 'utf8')
	assert.doesNotMatch(source, /\bany\b/)
	assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
	assert.match(source, /data\(\):\s*PawAddressFormState/)
	assert.match(source, /PropType<Partial<AddressRecord>>/)
	assert.match(source, /createAddressFormDemoMetadata/)
	assert.match(source, /normalizeWechatAddressDraft/)
})

test('address selection metadata is a cloned shared payload and the list page uses typed records', async () => {
	const addressMock = await import(`${pathToFileURL(path.join(ROOT, 'utils/addressMock.ts')).href}?test=${Date.now()}`)
	const source = await fs.readFile(path.join(ROOT, 'packages/address/pages/list/index.vue'), 'utf8')
	const selected = addressMock.toAddressPickedPayload({
		id: 'shipping-2',
		name: '联系人',
		phone: '13300001111',
		regionParts: ['湖南省', '长沙市'],
		detail: '中意一路',
		isDefault: false,
		internalMetadata: 'not exposed',
	})
	assert.deepEqual(selected, {
		id: 'shipping-2',
		name: '联系人',
		phone: '13300001111',
		regionParts: ['湖南省', '长沙市'],
		detail: '中意一路',
		isDefault: false,
	})
	selected.regionParts.push('隔离修改')
	assert.deepEqual(addressMock.toAddressPickedPayload({
		id: 'shipping-2', name: '联系人', phone: '13300001111', regionParts: ['湖南省', '长沙市'], detail: '中意一路', isDefault: false,
	}).regionParts, ['湖南省', '长沙市'])
	assert.doesNotMatch(source, /\bany\b/)
	assert.match(source, /data\(\):\s*AddressListPageState/)
	assert.match(source, /AddressRecord\[\]/)
	assert.match(source, /toAddressPickedPayload\(row\)/)
	assert.doesNotMatch(source, /mockShipping|mockService/)
})

test('address editor, form save event, and address card use shared typed contracts', async () => {
	const editor = await fs.readFile(path.join(ROOT, 'packages/address/pages/editor/index.vue'), 'utf8')
	const form = await fs.readFile(path.join(ROOT, 'packages/address/components/address/PawAddressForm.vue'), 'utf8')
	const card = await fs.readFile(path.join(ROOT, 'packages/address/components/form/PawAddressCard.vue'), 'utf8')
	for (const source of [editor, form, card]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
	}
	assert.match(editor, /data\(\):\s*AddressEditorPageState/)
	assert.match(editor, /onSave\(address:\s*AddressFormDraft\)/)
	assert.match(editor, /getAddressById\(addressId,\s*this\.kind\)/)
	assert.doesNotMatch(editor, /as\s+any/)
	assert.match(form, /save:\s*\(draft:\s*AddressFormDraft\)/)
	assert.match(card, /PropType<AddressRecord>/)
	assert.match(card, /type AddressCardMode\s*=\s*'display'\s*\|\s*'manage'\s*\|\s*'select'/)
})

test('region picker demo states and event payloads use cloned, normalized shared metadata', async () => {
	const regions = await import(`${pathToFileURL(path.join(ROOT, 'utils/regionMock.ts')).href}?test=${Date.now()}`)
	const back = regions.createRegionPickerDemoMetadata('back')
	assert.deepEqual(back, {
		maxLevel: 3,
		startLevel: 0,
		initialParts: ['安徽省', '滁州市', '南谯区', ''],
	})
	assert.equal(regions.createRegionPickerDemoMetadata('unknown'), null)
	assert.deepEqual(regions.normalizeRegionParts(['湖南省', null, '长沙市', 4, 'ignored']), ['湖南省', '', '长沙市', ''])
	assert.equal(regions.normalizeRegionSelectionPayload({ parts: 'invalid' }), null)
	const selection = regions.normalizeRegionSelectionPayload({ parts: ['湖南省', '长沙市'] })
	assert.deepEqual(selection, { parts: ['湖南省', '长沙市'] })
	if (back) back.initialParts.push('fixture mutation')
	assert.deepEqual(regions.createRegionPickerDemoMetadata('back')?.initialParts, ['安徽省', '滁州市', '南谯区', ''])

	const page = await fs.readFile(path.join(ROOT, 'packages/address/pages/region-picker/index.vue'), 'utf8')
	const component = await fs.readFile(path.join(ROOT, 'packages/address/components/address/PawRegionPicker.vue'), 'utf8')
	for (const source of [page, component]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
	}
	assert.match(page, /data\(\):\s*RegionSelectorPageState/)
	assert.match(page, /createRegionPickerDemoMetadata\(route\.state\)/)
	assert.match(component, /data\(\):\s*PawRegionPickerState/)
	assert.match(component, /PropType<RegionNode\[\]>/)
	assert.match(component, /RegionSelectionPayload/)
})
