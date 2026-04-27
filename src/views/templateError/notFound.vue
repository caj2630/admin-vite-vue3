<template>
  <div class="error-page">
    <el-result icon="warning" title="404" sub-title="抱歉，页面不存在或已被移除。">
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const goHome = () => router.push({ name: 'home' })
</script>

<style scoped>
  .error-page {
    min-height: calc(100vh - 120px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
