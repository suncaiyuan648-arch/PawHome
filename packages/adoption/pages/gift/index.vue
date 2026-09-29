<template>
  <view
    class="gift-page"
    data-qa="qa-adoption-gift-page"
  >
    <view class="gift-hero">
      <PawPageNav
        background="transparent"
        back-color="#fff"
        fallback-url="/pages/index/index"
      />
      <view class="gift-hero__copy">
        <text class="gift-hero__title">领养有礼</text>
        <text class="gift-hero__subtitle">领养30天后参与</text>
      </view>
      <image
        class="gift-hero__collage"
        :src="heroImage"
        mode="aspectFit"
      />
      <PawWinningTicker
        class="gift-notices"
        :items="winningNotices"
      />
    </view>

    <view class="gift-main">
      <AdoptionProgressTimeline
        variant="gift"
        :step="4"
        percent="100%"
      />
      <view
        class="gift-tabs"
        data-qa="qa-adoption-gift-tabs"
      >
        <view
          class="gift-tab"
          :class="{ 'gift-tab--active': activeTab === 'prizes' }"
          data-qa="qa-adoption-gift-tab-prizes"
          @tap="activeTab = 'prizes'"
        >
          <text>本期奖品</text>
        </view>
        <view
          class="gift-tab"
          :class="{ 'gift-tab--active': activeTab === 'records' }"
          data-qa="qa-adoption-gift-tab-records"
          @tap="activeTab = 'records'"
        >
          <text>领养记录</text>
        </view>
      </view>
      <scroll-view
        class="gift-content"
        scroll-y
        :show-scrollbar="false"
      >
        <view
          v-if="activeTab === 'prizes'"
          class="gift-prizes"
          data-qa="qa-adoption-gift-prizes"
        >
          <view
            v-for="prize in prizes"
            :key="prize.id"
            class="gift-prize"
          >
            <image
              class="gift-prize__image"
              :src="prizeImage"
              mode="aspectFill"
            />
            <view class="gift-prize__copy">
              <text class="gift-prize__name">{{ prize.name }}</text>
              <text class="gift-prize__participants">参与人数 {{ prize.participants }}人</text>
              <text class="gift-prize__value">奖品价值：￥{{ prize.value }}</text>
            </view>
            <PawStatusPill
              class="gift-prize__status"
              text="进行中"
              tone="gift"
            />
          </view>
        </view>
        <view
          v-else
          class="gift-records"
          data-qa="qa-adoption-gift-records"
        >
          <PawJuryItemCard
            v-for="item in records"
            :key="item.id"
            :item="item"
            :qa="`qa-adoption-gift-record-${item.id}`"
            @click="openRecord"
          />
          <view
            v-if="!records.length"
            class="gift-empty"
            >暂无领养记录</view
          >
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import PawWinningTicker from '@/packages/adoption/components/PawWinningTicker.vue'
import AdoptionProgressTimeline from '@/packages/adoption/components/AdoptionProgressTimeline.vue'
import PawJuryItemCard from '@/components/jury/PawJuryItemCard.vue'
import { getJuryItems } from '@/utils/juryStorage.ts'
import type { JuryItem } from '@/utils/juryMock.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'

const PRIZES = [
  { id: 'cat-food', name: '猫粮4斤', participants: 684, value: '13.5' },
  { id: 'sterilization', name: '200元绝育补助金', participants: 684, value: '13.5' },
]
const WINNING_NOTICE = {
  avatar: '/static/figma/home/feed-avatar.png',
  text: '抽到 喜茶黑卡 · 价值￥50',
}

export default defineComponent({
  name: 'AdoptionGiftPage',
  components: {
    PawPageNav,
    PawStatusPill,
    PawWinningTicker,
    AdoptionProgressTimeline,
    PawJuryItemCard,
  },
  data() {
    return {
      activeTab: 'prizes' as 'prizes' | 'records',
      heroImage: '/packages/adoption/static/adoption-gift/hero-collage.webp',
      prizeImage: '/packages/adoption/static/adoption-gift/prize.webp',
      winningNotices: Array(3).fill(WINNING_NOTICE),
      prizes: PRIZES,
      records: [] as JuryItem[],
    }
  },
  onLoad(options: { tab?: string } = {}) {
    this.activeTab = options.tab === 'records' ? 'records' : 'prizes'
  },
  onShow() {
    this.records = getJuryItems({ reviewType: 'adoption' })
  },
  methods: {
    openRecord(item: JuryItem) {
      if (!item.id) return
      uni.navigateTo({
        url: buildRoute('adoption.jury.detail', {
          reviewItemId: item.id,
          businessType: 'adoption',
        }),
      })
    },
  },
})
</script>

<style scoped>
.gift-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background: #f5f6f6;
  color: #333;
}
.gift-hero {
  position: relative;
  height: 283px;
  flex: 0 0 283px;
  overflow: hidden;
  background: linear-gradient(180deg, #f24719, #f54519);
}
.gift-hero__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 20px 0 0 21px;
  color: #fff;
}
.gift-hero__title {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
}
.gift-hero__subtitle {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}
.gift-hero__collage {
  position: absolute;
  top: 84px;
  right: 23px;
  width: 162px;
  height: 148px;
}
.gift-notices {
  position: absolute;
  right: 0;
  bottom: 10px;
  left: 0;
}
.gift-main {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  border-radius: 15px 15px 0 0;
  background: #fff;
  overflow: hidden;
}
.gift-tabs {
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  justify-content: center;
  gap: 66px;
  align-items: center;
}
.gift-tab {
  position: relative;
  display: flex;
  height: 42px;
  min-width: 70px;
  align-items: center;
  justify-content: center;
  color: #a0a0a0;
  font-size: 16px;
}
.gift-tab--active {
  color: #333;
  font-weight: 500;
}
.gift-tab--active::after {
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: 20px;
  height: 4px;
  transform: translateX(-50%);
  border-radius: 5px;
  background: #f9e112;
  content: '';
}
.gift-content {
  min-height: 0;
  flex: 1;
}
.gift-prizes {
  padding: 11px 17px 28px;
}
.gift-prize {
  display: flex;
  height: 104px;
  align-items: flex-start;
  gap: 12px;
}
.gift-prize__image {
  width: 78px;
  height: 78px;
  flex: 0 0 78px;
  border-radius: 7px;
}
.gift-prize__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.gift-prize__name {
  overflow: hidden;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gift-prize__participants {
  color: #9f9f9f;
  font-size: 12px;
  line-height: 19px;
}
.gift-prize__value {
  margin-top: 11px;
  color: #f94545;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
.gift-prize__status {
  flex: 0 0 70px;
  align-self: flex-end;
  margin-bottom: 25px;
}
.gift-records {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 12px 24px;
  background: #f5f6f6;
}
.gift-empty {
  padding: 40px 0;
  color: #999;
  font-size: 14px;
  text-align: center;
}
</style>
