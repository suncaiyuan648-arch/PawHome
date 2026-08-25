<template><PawAddressForm kind="service" :typing="typing" /></template>
<script>
import PawAddressForm from '@/components/address/PawAddressForm.vue'
export default{components:{PawAddressForm},data(){return{typing:false}},onLoad(options={}){this.typing=options.state==='typing'}}
</script>
