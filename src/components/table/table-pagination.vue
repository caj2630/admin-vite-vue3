<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="currentPageSize"
    :page-sizes="pageSizes"
    :total="total"
    layout="total, sizes, prev, pager, next, jumper"
    background
  />
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      total: number
      page?: number
      pageSize?: number
      pageSizes?: number[]
    }>(),
    {
      page: 1,
      pageSize: 20,
      pageSizes: () => [10, 20, 50, 100],
    },
  )

  const emit = defineEmits<{
    'update:page': [value: number]
    'update:pageSize': [value: number]
    change: []
  }>()

  const currentPage = computed({
    get: () => props.page,
    set: (val: number) => {
      emit('update:page', val)
      emit('change')
    },
  })

  const currentPageSize = computed({
    get: () => props.pageSize,
    set: (val: number) => {
      emit('update:pageSize', val)
      emit('change')
    },
  })
</script>
