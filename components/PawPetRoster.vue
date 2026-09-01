<template>
  <view class="roster-page" :class="['roster-page--' + variant, { 'roster-page--managed': managed }]">
    <PawPageNav background="#ffffff" :auto-back="false" :content-inset-left="managed ? 44 : 33" @back="$emit('back')">
      <template #content>
        <view v-if="managed" class="managed-nav-content">
          <image class="managed-nav-avatar" :src="yardAvatar" mode="aspectFill" />
          <text class="managed-nav-name">{{ yardName }}</text>
          <text class="managed-nav-tag">小院</text>
        </view>
        <text v-else class="title">{{ variant === 'mine' ? '我的云养' : '小院成员' }}</text>
      </template>
    </PawPageNav>

    <view v-if="!managed" class="roster-filter">
      <view class="roster-search">
        <PawSearchBar v-model="inputKeyword" placeholder="搜索宠物名字/品种等" @search="onSearch" />
      </view>

      <view class="tabs">
        <text :class="{ active: speciesFilter === 'all' }" @tap="selectSpecies('all')">全部({{ pets.length }})</text>
        <text :class="{ active: speciesFilter === 'cat' }" @tap="selectSpecies('cat')">猫咪({{ catCount }})</text>
        <text :class="{ active: speciesFilter === 'dog' }" @tap="selectSpecies('dog')">狗狗({{ dogCount }})</text>
        <view class="sort">智能排序
          <PawIcon class="sort-arrow" name="navigation/sort-arrow" :size="8" />
        </view>
        <view class="layout-toggle" data-qa="yard-pet-layout-toggle" @tap="toggleLayout">
          <PawIcon class="layout-toggle__icon" name="navigation/list" :size="19" />
        </view>
      </view>
    </view>

    <view v-else class="managed-roster-head">
      <text class="managed-roster-title">小院猫咪</text>
      <view class="managed-add" @tap="$emit('add-pet')"><text>添加</text></view>
    </view>

    <scroll-view class="roster-scroll" scroll-y :show-scrollbar="false">
      <view v-if="layoutMode === 'status'" class="status-groups">
        <view v-if="!visibleStatusGroups.length" class="roster-empty">没有找到相关宠物</view>
        <view v-for="group in visibleStatusGroups" :key="group.key" class="status-group"
          :class="'status-group--' + group.key">
          <text class="status-label" :class="'status-label--' + group.key">{{ group.label }}</text>
          <view class="status-card">
            <view class="status-pets">
              <view v-for="pet in group.pets" :key="pet.id" class="status-pet" @tap.stop="$emit('pet-click', pet)">
                <image :src="statusPetAvatar(pet)" mode="aspectFill" />
                <text>{{ statusPetName(pet) }}</text>
              </view>
            </view>
            <view class="status-card__footer">
              <text class="status-count">{{ group.pets.length }}只</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="variant === 'yard'" class="yard-card-list">
        <view v-if="!visiblePets.length" class="roster-empty">没有找到相关宠物</view>
        <view v-for="(pet, index) in visiblePets" :key="pet.id" class="yard-pet-card"
          :class="'yard-pet-card--' + pet.state">
          <view class="yard-pet-card__main">
            <view class="yard-pet-card__photo-area" @tap.stop="$emit('pet-click', pet)">
              <image class="yard-pet-card__photo" :src="pet.avatar" mode="aspectFill" />
            </view>
            <view class="yard-pet-card__content">
              <view class="yard-pet-card__heading-row">
                <view class="yard-pet-card__name-row">
                  <text class="yard-pet-card__name" @tap.stop="$emit('pet-click', pet)">{{ pet.name }}</text>
                  <text class="yard-pet-card__status">{{ cardStatusLabel(pet) }}</text>
                </view>
                <text v-if="pet.state === 'cloud'" class="yard-pet-card__streak">已连续云养25天</text>
              </view>
              <text class="yard-pet-card__desc" @tap.stop="$emit('pet-click', pet)">{{ pet.desc }}</text>
              <view class="yard-pet-card__tags">
                <text v-for="tag in pet.cardTags" :key="tag" :class="yardTagClass(tag)">{{ tag }}</text>
              </view>
              <text class="yard-pet-card__quote">“云家长寄语：寄语寄语寄语寄语寄语寄语...”</text>
              <text v-if="pet.state === 'cloud'" class="yard-pet-card__remaining">剩余云养天数：<text
                  class="yard-pet-card__remaining-value">16</text>/30天</text>
              <text v-else-if="pet.stateTime" class="yard-pet-card__remaining yard-pet-card__state-time">{{
                pet.stateTimeLabel }}：{{ pet.stateTime }}</text>
            </view>
          </view>
          <view class="yard-pet-card__footer">
            <view class="yard-owner">
              <image :src="cardOwner(pet, index).avatar" mode="aspectFill"
                @tap.stop="onOwnerClick(cardOwner(pet, index))" />
              <view class="yard-owner__copy">
                <view class="yard-owner__name-line">
                  <text class="yard-owner__name" @tap.stop="onOwnerClick(cardOwner(pet, index))">{{
                    cardOwner(pet, index).name }}</text>
                  <view v-if="cardOwner(pet, index).level" class="yard-owner__level-wrap">
                    <LevelCapsule :level="cardOwner(pet, index).level" :inline="true" />
                  </view>
                </view>
                <text v-if="cardOwnerTag(pet)" class="yard-owner__tag">{{ cardOwnerTag(pet) }}</text>
              </view>
            </view>
            <view class="yard-pet-card__action" :class="{ disabled: pet.state !== 'pending' }">
              <text>{{ cardActionLabel(pet) }}</text>
              <PawIcon v-if="pet.state === 'pending' || pet.state === 'cloud'" class="yard-pet-card__action-icon"
                :class="{ 'yard-pet-card__action-icon--arrow': pet.state === 'pending' }"
                :name="pet.state === 'pending' ? 'navigation/action-arrow' : 'navigation/clock-disabled'" :size="14" />
            </view>
          </view>
        </view>
      </view>
      <view v-else class="pet-list">
        <view v-if="!visiblePets.length" class="roster-empty">没有找到相关宠物</view>
        <view v-for="(pet, index) in visiblePets" :key="pet.id" class="pet-card">
          <view class="pet-head">
            <image :src="pet.avatar" mode="aspectFill" />
            <view class="pet-copy">
              <view class="pet-title-row">
                <text class="pet-name">{{ pet.name }}</text>
                <text class="green">{{ pet.status }}</text>
                <text class="orange">{{ variant === 'mine' ? '云养中' : '待云养' }}</text>
              </view>
              <text class="desc">{{ pet.desc }}</text>
            </view>
          </view>
          <view class="pet-tags">
            <text v-for="tag in pet.tags" :key="tag">{{ tag }}</text>
          </view>
          <text class="pet-quote">“云家长寄语：寄语寄语寄语寄语寄语寄语...”</text>
          <view class="pet-meta">
            <view v-if="variant === 'yard'" class="yard-owner">
              <image
                :src="index === 0 ? '/static/figma/home/yard-avatar.png' : '/static/figma/interaction-avatar-1.jpg'"
                mode="aspectFill" />
              <text>{{ index === 0 ? '虚位以待' : '姜栋' }}</text>
              <text class="yard-tag">小毛毛球的第3任云家长</text>
            </view>
            <text v-else>剩余云养天数：16/30天</text>
            <view class="pet-action" :class="{ disabled: variant === 'mine' && index === 1 }">{{ index === 0 ? '前往云养' :
              '云养中' }}</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawSearchBar from '@/components/navigation/PawSearchBar.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { getPawHomeYardMock } from '@/utils/yardMock.js'

export default {
  name: 'PawPetRoster',
  components: { PawPageNav, PawSearchBar, LevelCapsule, PawIcon },
  props: {
    variant: { type: String, default: 'yard' },
    ownerPawId: { type: String, default: '' },
    managed: { type: Boolean, default: false },
    yardName: { type: String, default: '小院成员' },
    yardAvatar: { type: String, default: '/static/figma/yard-cover-exact.png' }
  },
  emits: ['back', 'add-pet', 'pet-click', 'owner-click'],
  data() {
    const yardMock = getPawHomeYardMock()
    const statusCatAvatar = '/static/figma/pets/pet-orange.png'
    const statusDogAvatar = '/static/figma/pets/pet-dog.png'
    const pets = yardMock.pets
    const statusDefinitions = yardMock.statusDefinitions
    return {
      layoutMode: this.managed || this.variant === 'status' ? 'status' : 'list',
      inputKeyword: '',
      keyword: '',
      speciesFilter: 'all',
      yardOwnerAvatar: yardMock.owner.avatar,
      yardOwnerPlaceholder: '/static/figma/yard-cats/owner-placeholder.svg',
      statusCatAvatar,
      statusDogAvatar,
      pets,
      statusGroups: statusDefinitions.map((group) => ({
        ...group,
        pets: pets.filter((item) => item.state === group.key)
      }))
    }
  },
  computed: {
    normalizedKeyword() {
      return this.keyword.trim().toLowerCase()
    },
    matchesKeyword() {
      const keyword = this.normalizedKeyword
      return (pet) => {
        if (!keyword) return true
        return [pet.name, pet.breed, pet.speciesLabel, pet.desc]
          .some((value) => String(value || '').toLowerCase().includes(keyword))
      }
    },
    catCount() {
      return this.pets.filter((pet) => pet.species === 'cat').length
    },
    dogCount() {
      return this.pets.filter((pet) => pet.species === 'dog').length
    },
    visiblePets() {
      const stateOrder = { pending: 0, cloud: 1, adopted: 2, missing: 3, dead: 4 }
      return this.pets.filter((pet) => {
        const matchesSpecies = this.speciesFilter === 'all' || pet.species === this.speciesFilter
        return matchesSpecies && this.matchesKeyword(pet)
      }).sort((a, b) => (stateOrder[a.state] ?? 99) - (stateOrder[b.state] ?? 99))
    },
    visibleStatusGroups() {
      return this.statusGroups
        .map((group) => ({
          ...group,
          pets: group.pets.filter((pet) => {
            const matchesSpecies = this.speciesFilter === 'all' || pet.species === this.speciesFilter
            return matchesSpecies && this.matchesKeyword(pet)
          })
        }))
        .filter((group) => group.pets.length)
    }
  },
  methods: {
    statusPetAvatar(pet) {
      return pet.species === 'dog' ? this.statusDogAvatar : this.statusCatAvatar
    },
    statusPetName(pet) {
      const name = String((pet && pet.name) || '')
      const characters = Array.from(name)
      return characters.length > 3 ? `${characters.slice(0, 2).join('')}…` : name
    },
    onSearch(value) {
      this.keyword = String(value || '').trim()
    },
    toggleLayout() {
      this.layoutMode = this.layoutMode === 'list' ? 'status' : 'list'
    },
    selectSpecies(filter) {
      this.speciesFilter = filter
    },
    cardStatusLabel(pet) {
      const labels = { pending: '待云养', cloud: '已云养', adopted: '已领养', missing: '失踪', dead: '死亡' }
      return labels[pet.state] || '待云养'
    },
    cardActionLabel(pet) {
      const labels = { pending: '前往云养', cloud: '云养中', adopted: '已领养', missing: '已失踪', dead: '已死亡' }
      return labels[pet.state] || '云养中'
    },
    cardOwner(pet, index) {
      if (pet.state === 'pending') {
        return { name: '虚位以待', avatar: this.yardOwnerPlaceholder }
      }
      return { pawId: this.ownerPawId, name: '姜栋', avatar: this.yardOwnerAvatar, level: 1 }
    },
    onOwnerClick(owner) {
      if (!owner || !owner.pawId) return
      this.$emit('owner-click', owner)
    },
    cardOwnerTag(pet) {
      return pet.state === 'cloud' || pet.state === 'adopted' ? '小毛毛球的第3任云家长' : ''
    },
    yardTagClass(tag) {
      if (tag === '极度饥饿') return 'yard-tag--hungry'
      if (tag === '非常亲人') return 'yard-tag--friendly'
      return 'yard-tag--neutral'
    }
  }
}
</script>

<style scoped>
.roster-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
  color: #222;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif
}

.title {
  color: #333;
  font-size: 18px;
  font-weight: 500;
  line-height: 26px;
  white-space: nowrap
}

.managed-nav-content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.managed-nav-avatar {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
}

.managed-nav-name {
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 15px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.managed-nav-tag {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: #fff463;
  color: #333;
  font-size: 10px;
  line-height: 18px;
}

.managed-roster-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 15px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.managed-roster-title {
  color: #222;
  font-size: 22px;
  font-weight: 700;
  line-height: 28px;
}

.managed-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 30px;
  border-radius: 5px;
  background: #ffe000;
  color: #222;
  font-size: 14px;
  line-height: 20px;
}

.roster-filter {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 8px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.roster-search {
  width: 100%;
}

.tabs {
  flex: none;
  width: 100%;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  box-sizing: border-box
}

.tabs>text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 28px;
  padding: 0;
  border-radius: 5px;
  background: #fff;
  color: #666;
  box-sizing: border-box;
  white-space: nowrap
}

.tabs .active {
  background: #f7df11;
  color: #333
}

.sort {
  margin-left: auto;
  display: flex;
  align-items: center;
  color: #333;
  font-size: 12px;
  white-space: nowrap
}

.sort-arrow {
	margin-left: 6px;
	flex: none;
  transform: rotate(-90deg);
}

.layout-toggle {
  width: 19px;
  height: 19px;
  margin-left: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none
}

.roster-scroll {
  flex: 1;
  min-height: 0;
  height: 0;
  box-sizing: border-box
}

.pet-list {
  padding: 8px 10px 24px;
  box-sizing: border-box
}

.status-groups {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 21px;
  width: 100%;
  padding: 8px 12px 24px;
  box-sizing: border-box;
  background: #f6f8fa
}

.yard-card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 7px 8px 24px;
  box-sizing: border-box;
}

.roster-empty {
  padding: 32px 0;
  color: #999;
  font-size: 13px;
  text-align: center
}

.pet-card {
  min-height: 196px;
  margin-bottom: 8px;
  padding: 13px 12px 10px;
  border-radius: 9px;
  background: #fff;
  box-sizing: border-box
}

.pet-head {
  display: flex;
  align-items: flex-start
}

.pet-head>image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  flex: none
}

.pet-copy {
  margin-left: 8px;
  min-width: 0;
  flex: 1
}

.pet-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 19px;
  white-space: nowrap
}

.pet-name {
  font-size: 14px;
  color: #222
}

.green,
.orange,
.yard-tag {
  padding: 1px 5px;
  border-radius: 5px;
  font-size: 9px;
  line-height: 14px
}

.green {
  background: #ddf7a9;
  color: #588b14
}

.orange {
  background: #fff0c8;
  color: #d28e00
}

.desc {
  display: block;
  margin-top: 6px;
  color: #555;
  font-size: 10px;
  line-height: 15px
}

.pet-tags {
  display: flex;
  gap: 8px;
  margin: 10px 0 7px;
  padding-left: 58px;
  white-space: nowrap
}

.pet-tags text {
  font-size: 9px;
  color: #888
}

.pet-quote {
  display: block;
  padding-left: 58px;
  color: #999;
  font-size: 10px;
  line-height: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis
}

.pet-meta {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding-left: 0;
  min-height: 32px;
  font-size: 10px;
  color: #999
}

.yard-owner {
  display: flex;
  align-items: center;
  min-width: 0
}

.yard-owner image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: none
}

.yard-owner>text:nth-child(2) {
  margin-left: 7px;
  color: #666;
  white-space: nowrap
}

.yard-tag {
  margin-left: 6px;
  background: #ffed34;
  color: #5a5100;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis
}

.pet-action {
  margin-left: auto;
  padding: 8px 15px;
  border-radius: 18px;
  background: #dff779;
  color: #435a00;
  font-size: 13px;
  white-space: nowrap
}

.pet-action.disabled {
  background: #eee;
  color: #bbb
}

/* Figma: 小院-查看猫咪列表 / 单只动物详情卡片模式 */
.yard-pet-card {
  flex: none;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 12px 18px 10px 12px;
  border-radius: 9px;
  background: #fff;
  box-sizing: border-box;
}

.yard-pet-card__main {
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}

.yard-pet-card__photo-area {
  flex: none;
}

.yard-pet-card__photo {
  display: block;
  width: 95px;
  height: 95px;
  border-radius: 4px;
}

.yard-pet-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 10px;
}

.yard-pet-card__heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: 22px;
}

.yard-pet-card__name-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 22px;
  white-space: nowrap;
}

.yard-pet-card__name {
  color: #333;
  font-size: 15px;
  line-height: 22px;
}

.yard-pet-card__status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 19px;
  width: 46px;
  padding: 0;
  border-radius: 8px;
  background: #e0ff89;
  color: #333;
  font-size: 11px;
  line-height: 19px;
  box-sizing: border-box;
}

.yard-pet-card--cloud .yard-pet-card__status {
  background: #e0ff89;
}

.yard-pet-card__desc {
  display: block;
  width: 100%;
  max-height: 40px;
  margin-top: 7px;
  overflow: hidden;
  color: #666;
  font-size: 14px;
  line-height: 20px;
}

.yard-pet-card__tags {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 22px;
  margin-top: 9px;
  white-space: nowrap;
}

.yard-pet-card__tags text {
  height: 22px;
  padding: 0 7px;
  border-radius: 3px;
  color: #666;
  font-size: 11px;
  line-height: 22px;
  box-sizing: border-box;
}

.yard-pet-card__tags .yard-tag--hungry {
  background: #fff3e8;
  color: #ff6f20;
}

.yard-pet-card__tags .yard-tag--friendly {
  background: #ffecdf;
  color: #834221;
}

.yard-pet-card__tags .yard-tag--neutral {
  background: #f4f4f4;
  color: #666;
}

.yard-pet-card__quote {
  display: block;
  width: 100%;
  margin-top: 8px;
  overflow: hidden;
  color: #999;
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yard-pet-card__streak {
  flex: none;
  height: 14px;
  padding: 0 5px;
  border-radius: 3px;
  background: #cc9a66;
  color: #fff;
  font-size: 10px;
  line-height: 14px;
  white-space: nowrap;
}

.yard-pet-card__remaining {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.yard-pet-card__remaining-value {
  color: #333;
}

.yard-pet-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 34px;
  margin-top: 12px;
}

.yard-pet-card .yard-owner {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  min-height: 34px;
}

.yard-pet-card .yard-owner>image {
  width: 33px;
  height: 33px;
  border-radius: 50%;
  flex: none;
}

.yard-owner__copy {
  flex: 1;
  min-width: 0;
  margin-left: 7px;
}

.yard-owner__name-line {
  display: flex;
  align-items: center;
  height: 16px;
  white-space: nowrap;
}

.yard-owner__name {
  overflow: hidden;
  color: #666;
  font-size: 13px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yard-owner__level-wrap {
  display: flex;
  align-items: center;
  width: 28px;
  height: 13px;
  margin-left: 4px;
  flex: none;
}

.yard-owner__tag {
  display: block;
  width: 116px;
  height: 16px;
  margin-top: 3px;
  overflow: hidden;
  border-radius: 3px;
  background: #fff463;
  color: #333;
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yard-pet-card__action {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 107px;
  height: 34px;
  border-radius: 20px;
  background: #defa93;
  color: #282827;
  font-size: 15px;
  font-weight: 700;
  line-height: 34px;
  white-space: nowrap;
}

.yard-pet-card__action-icon {
	margin-left: 3px;
	flex: none;
}

.yard-pet-card__action-icon--arrow {
  transform: scaleX(-1);
}

.yard-pet-card__action.disabled {
  width: 91px;
  background: #efefef;
  color: #bebebe;
}

.status-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  flex: none
}

.status-label {
  z-index: 1;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  height: 22px;
  padding: 0 5px;
  margin: 0;
  border-radius: 15px;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  white-space: nowrap;
  box-sizing: border-box;
  background: #e0ff89
}

.status-label--cloud {
  background: #fff463
}

.status-label--adopted {
  background: #2db7f7
}

.status-label--missing,
.status-label--dead {
  min-width: 0;
  padding: 0 12px
}

.status-label--missing {
  background: #d9d9d9;
  color: #333
}

.status-label--dead {
  background: #efefef;
  color: #bebebe
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-height: 183px;
  padding: 33px 14px 14px 21px;
  margin-top: -11px;
  border-radius: 16px;
  background: #fff;
  box-sizing: border-box
}

.status-group--pending .status-card {
  min-height: 172px
}

.status-pets {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  overflow: hidden
}

.status-pet {
  width: 49px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none
}

.status-pet image {
  display: block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex: none
}

.status-pet text {
  display: block;
  width: 49px;
  margin-top: 4px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip
}

.status-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  min-height: 20px;
  margin-top: auto
}

.status-count {
  position: static;
  display: block;
  color: #999;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px
}
</style>
