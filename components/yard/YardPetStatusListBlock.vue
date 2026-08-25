<template>
  <view class="psl">
    <YardPetStatusCard
      v-for="(sec, i) in sections"
      :key="sec.key || 'sec-' + i"
      :status="sec.status"
      :label="sec.label"
      :pets="sec.pets"
      :total="sec.total"
      :yard-name="yardName"
    />
  </view>
</template>

<script>
import YardPetStatusCard from "./YardPetStatusCard.vue";

/**
 * 小院详情「全部宠物状态」中间区：纵向多张 YardPetStatusCard。
 * sections: { key?, status, label, pets: [{id,avatar,name,breed}], total? }[]
 */
export default {
  name: "YardPetStatusListBlock",
  components: { YardPetStatusCard },
  props: {
    sections: {
      type: Array,
      default: () => [],
    },
    yardName: {
      type: String,
      default: "",
    },
  },
};
</script>

<style lang="less" scoped>
.psl {
  padding: 12px 0 24px;
  box-sizing: border-box;
}
</style>
