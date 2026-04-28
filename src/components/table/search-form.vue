<template>
  <el-card shadow="never" class="search-card">
    <el-form :model="model" inline>
      <slot />
      <el-form-item>
        <slot name="actions">
          <el-button type="primary" @click="$emit('search')">搜索</el-button>
          <el-button @click="$emit('reset')">重置</el-button>
        </slot>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
  defineProps<{
    model: Record<string, any>
  }>()

  defineEmits<{
    search: []
    reset: []
  }>()
</script>

<style lang="scss" scoped>
  .search-card {
    margin-bottom: 16px;
  }
</style>
