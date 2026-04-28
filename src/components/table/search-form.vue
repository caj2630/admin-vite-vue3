<template>
  <el-card shadow="never" class="search-card">
    <el-form :model="model" inline>
      <template v-for="item in items" :key="item.prop">
        <el-form-item :label="item.label">
          <!-- 输入框 -->
          <el-input
            v-if="item.type === 'input'"
            :model-value="model[item.prop]"
            @update:model-value="$emit('update:model', item.prop, $event)"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :clearable="item.clearable ?? true"
          />
          <!-- 下拉选择 -->
          <el-select
            v-else-if="item.type === 'select'"
            :model-value="model[item.prop]"
            @update:model-value="$emit('update:model', item.prop, $event)"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :clearable="item.clearable ?? true"
            style="width: 160px"
          >
            <el-option
              v-for="opt in item.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="item.type === 'date'"
            :model-value="model[item.prop]"
            @update:model-value="$emit('update:model', item.prop, $event)"
            :type="item.dateType ?? 'date'"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :start-placeholder="item.startPlaceholder"
            :end-placeholder="item.endPlaceholder"
            :range-separator="item.rangeSeparator"
            value-format="YYYY-MM-DD"
            :style="{ width: item.dateType === 'daterange' ? '240px' : '160px' }"
          />
          <!-- 数字输入 -->
          <el-input-number
            v-else-if="item.type === 'inputNumber'"
            :model-value="model[item.prop]"
            @update:model-value="$emit('update:model', item.prop, $event)"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :min="item.min ?? 0"
            :max="item.max ?? Infinity"
            :controls="item.controls ?? false"
          />
        </el-form-item>
      </template>
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
  export interface FormItemBase {
    type: string
    label: string
    prop: string
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
  }

  export interface InputFormItem extends FormItemBase {
    type: 'input'
  }

  export interface SelectFormItem extends FormItemBase {
    type: 'select'
    options: { label: string; value: unknown }[]
  }

  export interface DateFormItem extends FormItemBase {
    type: 'date'
    dateType?: 'date' | 'daterange' | 'datetime' | 'month' | 'year'
    startPlaceholder?: string
    endPlaceholder?: string
    rangeSeparator?: string
  }

  export interface InputNumberFormItem extends FormItemBase {
    type: 'inputNumber'
    min?: number
    max?: number
    controls?: boolean
  }

  export type SearchFormItem = InputFormItem | SelectFormItem | DateFormItem | InputNumberFormItem

  defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: Record<string, any>
    items: SearchFormItem[]
  }>()

  defineEmits<{
    search: []
    reset: []
    'update:model': [prop: string, value: unknown]
  }>()
</script>

<style lang="scss" scoped>
  .search-card {
    margin-bottom: 16px;
  }
</style>
