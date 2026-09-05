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
    body: '恭喜您，领养申请已通过。请前往小院完成后续领养流程。',
    buttonText: '好的'
  },
  '82': {
    title: '已确认领养',
    body: '恭喜您成功帮助小咪找到新家，小咪及小院的小伙伴前往新家啦！',
    buttonText: '查看详情'
  },
  '83': {
    title: '已驳回',
    body: '驳回后，领养申请信息将不再对申请人可见。',
    buttonText: '查看详情',
    failed: true
  },
  '84': {
    title: '太棒了',
    body: '等待院主和领养者核实确认领养的信息，您将有机会获得流浪猫的一份猫粮礼物！',
    buttonText: '查看领养进度'
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
      recordId: ''
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
  },
  methods: {
    goBack() {
      goBackSmart({ fallbackUrl: '/pages/meMore/myAdoption', fallbackLaunch: 'redirectTo' })
    },
    recordQuery(separator = '?') {
      return this.recordId ? `${separator}id=${encodeURIComponent(this.recordId)}` : ''
    },
    onAction() {
      const routes = {
        // Figma 80：领取结果 → 奖励订单详情（Figma 92）。
        '80': `/pages/meMore/feedingDetail92${this.recordQuery()}`,
        // Figma 81：同意申请 → 待申请人前往领养。
        '81': `/pages/meMore/adoptionFlow?frame=50${this.recordQuery('&')}`,
        // Figma 82/83：审核结果 → 同一条领养记录的状态页。
        '82': `/pages/meMore/adoptionFlow?frame=53${this.recordQuery('&')}`,
        '83': `/pages/meMore/adoptionFlow?frame=52${this.recordQuery('&')}`,
        // Figma 84/85：结果 → 对应的领养进度状态。
        '84': `/pages/meMore/adoptionFlow?frame=55${this.recordQuery('&')}`,
        '85': `/pages/meMore/adoptionFlow?frame=44${this.recordQuery('&')}`
      }
      const url = routes[this.variant]
      if (!url) return this.goBack()
      uni.navigateTo({
        url,
        fail: () => this.goBack()
      })
    }
  }
}
</script>
