<template>
  <PawNoticeModal
    :visible="visible"
    :message="message"
    :confirm-text="confirmText"
    @update:visible="$emit('update:visible', $event)"
    @confirm="$emit('confirm')"
  />
</template>

<script>
import PawNoticeModal from "@/components/PawNoticeModal.vue";

export default {
  name: "AdoptEntryHintModal",
  components: { PawNoticeModal },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "抱歉，您今日领养次数已用完",
    },
    confirmText: {
      type: String,
      default: "我知道了",
    },
  },
  emits: ["update:visible", "confirm"],
};
</script>
