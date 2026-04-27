<template>
  <div @click="goToPersonal" class="cy-user">{{ user.email }}</div>
</template>

<script setup lang="ts">
  import { toRefs } from 'vue'
  import { useUserInfoStore } from '@/stores/user'
  import { useRouter } from 'vue-router'
  const props = defineProps()
  const {} = toRefs(props)
  const store = useUserInfoStore()
  const router = useRouter()
  const { user }: any = toRefs(store)
  const goToPersonal = () => {
    // 在这里执行跳转到个人中心的逻辑
    // 例如，使用 Vue Router 进行导航
    router.push({ name: 'personal' })
  }
</script>

<style lang="scss" scoped>
  @include b('user') {
    cursor: pointer;
  }
</style>
