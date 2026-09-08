<template>
  <PawFlowResult v-bind="config" @back="goBack" @action="onAction" />
</template>

<script>
import PawFlowResult from '@/components/PawFlowResult.vue'
import { getLastAdoptionId } from '@/utils/adoptionStorage.js'
import { goBackSmart } from '@/utils/navBack.js'

const configs = {
  '80': {
    title: '领取成功',
    body: '感谢您收养这个流浪的苦命孩子，逢猫作为半个娘家人没什么能拿的出手的，只能为它陪嫁一点猫粮，希望它能在未来的数年乃至十数年陪伴您的每一次开心与难过',
    buttonText: '查看订单'
  },
  '81': {
    title: '已同意领养申请',
    body: '没尝过家的味道\n总在流浪\n谢谢你\n让我知道\n被偏爱是什么样',
    buttonText: '好的'
  },
  '82': {
    title: '已确认领养',
    body: '恭喜您成功帮助小咪找到新\n家，小咪将从您的小院前往\n新家啦！',
    buttonText: '查看详情',
    descriptionMaxWidth: 254
  },
  '83': {
    title: '已驳回',
    body: '驳回后领养信息中申请人不再\n可见',
    buttonText: '查看详情',
    failed: true,
    failureIconName: 'status/adoption-rejected',
    failureTone: 'brand',
    descriptionMaxWidth: 254
  },
  '84': {
    title: '太棒了',
    body: '等待院主和领养审核团确认您的领养为真后将有机会抽取逢猫的一份猫粮礼物！祝贺小咪找到新家！',
    buttonText: '查看领养进度',
    descriptionMaxWidth: 254
  },
  '85': {
    title: '申请成功',
    body: '您的领养申请以及这份善意，为防止不正当领养及恶意领养，院主会查看您的历史领养和投喂记录来决定是否同意。通过后平台将通知您，请注意系统消息及小院消息。',
    buttonText: '查看领养进度'
  }
}

function decodeQueryValue(value) {
  if (value === undefined || value === null || value === '') return ''
  try {
    return decodeURIComponent(String(value))
  } catch (error) {
    return String(value)
  }
}

export default {
  components: { PawFlowResult },
  data() {
    return {
      variant: '80',
      recordId: '',
      orderId: '',
      nextMode: '',
      reviewerRole: '',
      reviewerId: ''
    }
  },
  computed: {
    config() {
      return configs[this.variant] || configs['80']
    }
  },
  onLoad(options = {}) {
    this.variant = String(options.variant || '80')
    this.recordId = decodeQueryValue(options.id || options.recordId) || getLastAdoptionId()
    this.orderId = decodeQueryValue(options.orderId)
    this.nextMode = decodeQueryValue(options.nextMode)
    this.reviewerRole = decodeQueryValue(options.reviewerRole)
    this.reviewerId = decodeQueryValue(options.reviewerId)
  },
  methods: {
    goBack() {
      goBackSmart({ fallbackUrl: '/pages/meMore/myAdoption', fallbackLaunch: 'redirectTo' })
    },
    recordQuery(separator = '?') {
      return this.recordId ? `${separator}id=${encodeURIComponent(this.recordId)}` : ''
    },
    orderDetailQuery() {
      const params = []
      if (this.recordId) params.push(`id=${encodeURIComponent(this.recordId)}`)
      if (this.orderId) params.push(`orderId=${encodeURIComponent(this.orderId)}`)
      return params.length ? `?${params.join('&')}` : ''
    },
    onAction() {
      if (['81', '82', '83'].includes(this.variant) && this.nextMode) {
        const params = [
          `mode=${encodeURIComponent(this.nextMode)}`,
          `id=${encodeURIComponent(this.recordId)}`,
          this.reviewerRole && `reviewerRole=${encodeURIComponent(this.reviewerRole)}`,
          this.reviewerId && `reviewerId=${encodeURIComponent(this.reviewerId)}`
        ].filter(Boolean).join('&')
        uni.redirectTo({
          url: `/pages/yard/adoptionAudit?${params}`,
          fail: () => this.goBack()
        })
        return
      }
      const routes = {
        // Figma 80：订单详情暂未接入，先回到领养单完成页。
        '80': `/pages/meMore/adoptionFlow?frame=57${this.recordQuery('&')}&notice=order-detail-pending`,
        // Figma 81：同意申请 → 待申请人前往领养。
        '81': `/pages/yard/adoptionAudit?mode=ownerPending${this.recordQuery('&')}`,
        // Figma 82/83：管理审批结果 → 管理审批单页面。
        '82': `/pages/yard/adoptionAudit?mode=ownerConfirmed${this.recordQuery('&')}`,
        '83': `/pages/yard/adoptionAudit?mode=ownerConfirmRejected${this.recordQuery('&')}`,
        // Figma 84：确认领养结果 → 等待院主确认领养；Figma 85：申请成功 → 等待院主审核。
        '84': `/pages/meMore/adoptionFlow?frame=55${this.recordQuery('&')}`,
        '85': `/pages/meMore/adoptionFlow?frame=44${this.recordQuery('&')}`
      }
      const url = routes[this.variant]
      if (!url) return this.goBack()
      const navigate = this.variant === '84' ? uni.redirectTo : uni.navigateTo
      navigate({ url, fail: () => this.goBack() })
    }
  }
}
</script>
