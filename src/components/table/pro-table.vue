<template>
  <el-card shadow="never" class="table-card">
    <div v-if="$slots.toolbar" class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar" />
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="data"
      :border="border"
      :stripe="stripe"
      :row-key="rowKey"
      style="width: 100%"
      @selection-change="(rows: any[]) => $emit('selection-change', rows)"
    >
      <slot />
      <template #empty>
        <slot name="empty">
          <el-empty :description="loading ? '加载中...' : '暂无数据'" />
        </slot>
      </template>
    </el-table>

    <div class="pagination-wrapper">
      <TablePagination
        :total="total"
        :page="page"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        @update:page="handlePageUpdate"
        @update:page-size="handleSizeUpdate"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
  import TablePagination from './table-pagination.vue'

  withDefaults(
    defineProps<{
      loading: boolean
      data: any[]
      total: number
      page?: number
      pageSize?: number
      pageSizes?: number[]
      rowKey?: string
      border?: boolean
      stripe?: boolean
    }>(),
    {
      page: 1,
      pageSize: 20,
      pageSizes: () => [10, 20, 50, 100],
      rowKey: 'id',
      border: true,
      stripe: true,
    },
  )

  const emit = defineEmits<{
    'update:page': [value: number]
    'update:pageSize': [value: number]
    'selection-change': [value: any[]]
    change: []
  }>()

  const handlePageUpdate = (val: number) => {
    emit('update:page', val)
    emit('change')
  }

  const handleSizeUpdate = (val: number) => {
    emit('update:pageSize', val)
    emit('change')
  }
</script>

<style lang="scss" scoped>
  .table-card {
    :deep(.el-card__body) {
      padding-bottom: 0;
    }
  }

  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 20px 0;
  }
</style>
