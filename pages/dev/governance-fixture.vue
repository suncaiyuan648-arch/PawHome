<template>
  <view class="fixture-page">
    <PawPageNav title="治理夹具" :title-centered="true" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view class="fixture-content">
      <view class="fixture-intro">
        <text class="fixture-title">本地治理夹具</text>
        <text class="fixture-copy">只写入当前模拟器的本地 storage，供审核、编辑和权限回归使用，不连接后端。</text>
      </view>

      <view class="fixture-card">
        <text class="fixture-card__title">领养审核角色</text>
        <text class="fixture-card__copy">同一组记录分别以院主、云家长、评审团身份读取；审核动作只允许当前角色处理。</text>
        <view class="fixture-actions">
          <button class="fixture-button" data-qa="qa-fixture-adoption-owner" @tap="openAdoption('owner')">院主审核</button>
          <button class="fixture-button" data-qa="qa-fixture-adoption-cloud" @tap="openAdoption('cloud_parent')">云家长审核</button>
          <button class="fixture-button" data-qa="qa-fixture-adoption-jury" @tap="openAdoption('reviewer')">评审团审核</button>
        </view>
      </view>

      <view class="fixture-card">
        <text class="fixture-card__title">救助审核</text>
        <text class="fixture-card__copy">生成一条明确绑定 reviewer 的待审核救助单，可验证详情、一次性通过和已处理态。</text>
        <button class="fixture-button fixture-button--wide" data-qa="qa-fixture-rescue-review" @tap="openRescueReview">打开救助审核</button>
      </view>

      <view class="fixture-card">
        <text class="fixture-card__title">资料与小院管理</text>
        <text class="fixture-card__copy">生成同一可信院主的 profile、yard、animal 记录，验证保存后重读、取消和刷新。</text>
        <view class="fixture-actions">
          <button class="fixture-button" data-qa="qa-fixture-profile-editor" @tap="openEditor('profile')">编辑资料</button>
          <button class="fixture-button" data-qa="qa-fixture-yard-editor" @tap="openEditor('yard')">编辑小院</button>
          <button class="fixture-button" data-qa="qa-fixture-animal-editor" @tap="openEditor('animal')">编辑动物</button>
        </view>
      </view>

      <view class="fixture-card fixture-card--status">
        <text class="fixture-card__title">当前夹具状态</text>
        <text class="fixture-status" data-qa="qa-fixture-status">{{ statusText }}</text>
        <button class="fixture-button fixture-button--danger" data-qa="qa-fixture-clear" @tap="clearFixture">清空本地治理夹具</button>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'

const ACTOR_KEY = 'PAWHOME_ACTOR_SESSION'
const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'
const RESCUE_KEY = 'PAWHOME_RESCUES'
const PROFILE_KEY = 'PAWHOME_PROFILE_RECORDS'
const YARD_KEY = 'PAWHOME_YARD_RECORDS'
const ANIMAL_KEY = 'PAWHOME_ANIMAL_RECORDS'

type FixtureActorRole = 'owner' | 'cloud_parent' | 'reviewer'
type FixtureAdoptionPhase = 'owner' | 'cloud_parent' | 'jury'
type FixtureEditorKind = 'profile' | 'yard' | 'animal'

interface FixtureActor { id: string; roles: string[] }
interface GovernanceFixturePageState { statusText: string }

const ACTORS: Record<FixtureActorRole, FixtureActor> = Object.freeze({
  owner: Object.freeze({ id: 'qa-owner', roles: ['owner', 'yard_owner', 'animal_manager'] }),
  cloud_parent: Object.freeze({ id: 'qa-cloud', roles: ['cloud_parent'] }),
  reviewer: Object.freeze({ id: 'qa-reviewer', roles: ['reviewer'] }),
})

function adoptionRecord(
  applicationId: string,
  reviewItemId: string,
  phase: FixtureAdoptionPhase,
  reviewerRole: FixtureActorRole,
  reviewerId: string,
  status: string
) {
  return {
    id: `qa-${applicationId}`,
    applicationType: 'adoption',
    businessType: 'adoption',
    applicationId,
    applicantId: 'qa-applicant',
    applicantName: '本地验收申请人',
    applicantAvatar: '/static/figma/home/feed-avatar.png',
    ownerId: 'qa-owner',
    yardId: 'qa-yard',
    yardName: '本地验收小院',
    status,
    cloudParentRequired: phase === 'cloud_parent',
    cloudParentIds: phase === 'cloud_parent' ? ['qa-cloud'] : [],
    ...(phase === 'cloud_parent' ? { cloudParentPawId: 'qa-cloud', cloudParentApprovals: [] } : {}),
    pets: [{ id: `qa-pet-${phase}`, name: '验收猫咪', avatar: '/static/figma/pets/pet-orange.png' }],
    applyText: '你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。',
    review: {
      applicationType: 'adoption',
      applicationId,
      reviewItemId,
      phase,
      reviewerRole,
      reviewerId,
      status: 'pending',
    },
  }
}

function rescueRecord() {
  return {
    id: 'qa-rescue',
    rescueId: 'qa-rescue',
    applicationType: 'rescue',
    businessType: 'rescue',
    status: 'pending',
    reviewItemId: 'qa-rescue-review',
    reviewerId: 'qa-reviewer',
    reviewerAuthorized: true,
    applicationStatus: 'platform_approved',
    applicant: { id: 'qa-applicant', name: '本地救助申请人', avatar: '/static/figma/home/feed-avatar.png' },
    applicantName: '本地救助申请人',
    yardId: 'qa-yard',
    yardName: '本地验收小院',
    amount: 320,
    summary: '本地救助审核夹具',
    description: '用于验证救助审核详情和一次性审核动作的本地说明。',
    createdLabel: '刚刚',
    media: ['/static/figma/pets/pet-orange.png'],
    review: { reviewItemId: 'qa-rescue-review', status: 'pending', reviewerId: 'qa-reviewer' },
  }
}

function managementRecords() {
  return {
    profile: [{ userId: 'qa-owner', status: 'active', name: '本地验收用户', nickname: '治理夹具用户', bio: '保存后重读的资料', tags: ['本地', '验收'] }],
    yard: [{ yardId: 'qa-yard', ownerId: 'qa-owner', yardOwnerId: 'qa-owner', status: 'active', name: '本地验收小院', location: '长沙', description: '保存后重读的小院简介', intro: '本地验收公告', tags: ['治理'] }],
    animal: [{ animalId: 'qa-animal', yardId: 'qa-yard', yardOwnerId: 'qa-owner', managerId: 'qa-owner', status: 'active', name: '验收猫咪', breed: '蓝金', desc: '保存后重读的动物资料', avatar: '/static/figma/pets/pet-orange.png' }],
  }
}

export default defineComponent({
  name: 'GovernanceFixturePage',
  components: { PawPageNav },
  data(): GovernanceFixturePageState { return { statusText: '尚未生成夹具' } },
  onShow() { this.refreshStatus() },
  methods: {
    setActor(actor: FixtureActor) { uni.setStorageSync(ACTOR_KEY, { sessionId: `qa-session-${actor.id}`, actor }) },
    seedAdoption() {
      uni.setStorageSync(ADOPTION_KEY, [
        adoptionRecord('qa-application-owner', 'qa-review-owner', 'owner', 'owner', 'qa-owner', 'pending'),
        adoptionRecord('qa-application-cloud', 'qa-review-cloud', 'cloud_parent', 'cloud_parent', 'qa-cloud', 'cloud_pending'),
        adoptionRecord('qa-application-jury', 'adoption-review-qa-qa-application-jury', 'jury', 'reviewer', 'qa-reviewer', 'jury_confirm_pending'),
      ])
    },
    seedRescue() { uni.setStorageSync(RESCUE_KEY, [rescueRecord()]) },
    seedManagement() {
      const records = managementRecords()
      uni.setStorageSync(PROFILE_KEY, records.profile)
      uni.setStorageSync(YARD_KEY, records.yard)
      uni.setStorageSync(ANIMAL_KEY, records.animal)
    },
    seedAll() {
      this.seedAdoption()
      this.seedRescue()
      this.seedManagement()
    },
    openAdoption(role: FixtureActorRole) {
      this.seedAll()
      this.setActor(ACTORS[role])
      this.statusText = `领养审核：${role}`
      uni.navigateTo({ url: '/packages/adoption/pages/review/list/index' })
    },
    openRescueReview() {
      this.seedAll()
      this.setActor(ACTORS.reviewer)
      this.statusText = '救助审核：reviewer'
      uni.navigateTo({ url: '/packages/rescue/pages/review/list/index' })
    },
    openEditor(kind: FixtureEditorKind) {
      this.seedAll()
      this.setActor(ACTORS.owner)
      const routes: Record<string, string> = {
        profile: '/packages/account/pages/profile/editor/index?userId=qa-owner',
        yard: '/packages/yard/pages/editor/index?yardId=qa-yard',
        animal: '/packages/animal/pages/editor/index?animalId=qa-animal&yardId=qa-yard',
      }
      this.statusText = `编辑${kind}`
      uni.navigateTo({ url: routes[kind] })
    },
    clearFixture() {
      ;[ACTOR_KEY, ADOPTION_KEY, RESCUE_KEY, PROFILE_KEY, YARD_KEY, ANIMAL_KEY].forEach((key: string) => uni.removeStorageSync(key))
      this.statusText = '已清空治理夹具'
    },
    refreshStatus() {
      const actor = uni.getStorageSync(ACTOR_KEY)
      const adoption = uni.getStorageSync(ADOPTION_KEY)
      const rescue = uni.getStorageSync(RESCUE_KEY)
      const profile = uni.getStorageSync(PROFILE_KEY)
      this.statusText = actor && actor.actor
        ? `当前身份：${actor.actor.id}；领养 ${Array.isArray(adoption) ? adoption.length : 0} 条；救助 ${Array.isArray(rescue) ? rescue.length : 0} 条；资料 ${Array.isArray(profile) ? profile.length : 0} 条`
        : '尚未生成夹具'
    },
  },
})
</script>

<style scoped>
.fixture-page { min-height: 100vh; box-sizing: border-box; background: #f5f5f5; color: #222; }
.fixture-content { padding: 16px; }
.fixture-intro { padding: 4px 2px 14px; }
.fixture-title { display: block; font-size: 22px; font-weight: 500; line-height: 30px; }
.fixture-copy, .fixture-card__copy, .fixture-status { display: block; margin-top: 6px; color: #888; font-size: 13px; line-height: 20px; }
.fixture-card { margin-bottom: 12px; padding: 16px; border-radius: 12px; background: #fff; }
.fixture-card--status { background: #fffbea; }
.fixture-card__title { display: block; font-size: 16px; font-weight: 500; line-height: 22px; }
.fixture-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.fixture-button { min-width: 112px; height: 40px; margin: 0; padding: 0 14px; border: 0; border-radius: 20px; background: #222; color: #fff; font-size: 13px; line-height: 40px; }
.fixture-button::after { border: 0; }
.fixture-button--wide { width: 100%; margin-top: 14px; }
.fixture-button--danger { margin-top: 14px; background: #fff; color: #c74444; border: 1px solid #e6b3b3; }
</style>
