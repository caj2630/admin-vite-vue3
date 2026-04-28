<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <SearchForm
      :model="queryParams"
      :items="searchItems"
      @search="handleSearch"
      @reset="handleReset"
      @update:model="handleUpdateModel"
    />

    <!-- 数据表格 -->
    <ProTable
      v-model:page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :loading="loading"
      :data="userList"
      :total="total"
      @selection-change="handleSelectionChange"
      @change="fetchData"
    >
      <template #toolbar>
        <el-button v-if="hasPerm('system:user:add')" type="primary" @click="openAddDialog">
          新增用户
        </el-button>
        <el-button
          v-if="hasPerm('system:user:remove')"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button
          v-if="hasPerm('system:user:edit')"
          :disabled="selectedIds.length === 0"
          @click="handleBatchStatus(1)"
        >
          批量启用
        </el-button>
        <el-button
          v-if="hasPerm('system:user:edit')"
          :disabled="selectedIds.length === 0"
          @click="handleBatchStatus(0)"
        >
          批量禁用
        </el-button>
        <el-button v-if="hasPerm('system:user:export')" @click="handleExport"> 导出 </el-button>
      </template>

      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="userId" label="用户ID" width="80" align="center" />
      <el-table-column prop="username" label="登录账号" min-width="120" />
      <el-table-column prop="nickName" label="用户昵称" min-width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column prop="roleNames" label="所属角色" min-width="140">
        <template #default="{ row }">
          <el-tag
            v-for="name in row.roleNames"
            :key="name"
            size="small"
            style="margin-right: 4px; margin-bottom: 2px"
          >
            {{ name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="账号状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="175" />
      <el-table-column prop="loginTime" label="最后登录" width="175" />
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="hasPerm('system:user:edit')"
            link
            type="primary"
            size="small"
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasPerm('system:user:remove')"
            link
            type="danger"
            size="small"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
          <el-button
            v-if="hasPerm('system:user:assign')"
            link
            type="primary"
            size="small"
            @click="openAssignRoleDialog(row)"
          >
            分配角色
          </el-button>
          <el-button
            v-if="hasPerm('system:user:resetPwd')"
            link
            type="primary"
            size="small"
            @click="openResetPwdDialog(row)"
          >
            重置密码
          </el-button>
          <el-button
            v-if="hasPerm('system:user:edit')"
            link
            :type="row.status === 1 ? 'warning' : 'success'"
            size="small"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </ProTable>

    <!-- 新增 / 编辑用户弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="560px"
      :close-on-click-modal="false"
      @close="closeFormDialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-suffix="："
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="登录账号" prop="username">
              <el-input v-model="formData.username" placeholder="请输入登录账号" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="formData.nickName" placeholder="请输入用户昵称" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" maxlength="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item v-if="!isEdit" label="密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                show-password
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属角色" prop="roleIds">
              <el-select
                v-model="formData.roleIds"
                multiple
                placeholder="请选择角色"
                style="width: 100%"
              >
                <el-option
                  v-for="role in roleOptions"
                  :key="role.id"
                  :label="role.roleName"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSubmitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <el-dialog
      v-model="assignRoleVisible"
      title="分配角色"
      width="450px"
      :close-on-click-modal="false"
    >
      <div v-if="assignRoleUser" style="margin-bottom: 16px; color: #606266">
        为用户 <strong>{{ assignRoleUser.nickName }}</strong
        >（{{ assignRoleUser.username }}）分配角色
      </div>
      <el-checkbox-group v-model="assignRoleForm.roleIds">
        <el-checkbox
          v-for="role in roleOptions"
          :key="role.id"
          :label="role.id"
          style="margin-bottom: 12px; width: 33%"
        >
          {{ role.roleName }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="assignRoleVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignRoleSubmitting" @click="submitAssignRole">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="resetPwdVisible"
      title="重置密码"
      width="420px"
      :close-on-click-modal="false"
    >
      <div v-if="resetPwdUser" style="margin-bottom: 16px; color: #606266">
        为用户 <strong>{{ resetPwdUser.nickName }}</strong
        >（{{ resetPwdUser.username }}）重置密码
      </div>
      <el-form
        ref="resetPwdRef"
        :model="resetPwdForm"
        :rules="resetPwdRules"
        label-width="100px"
        label-suffix="："
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPwdForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            maxlength="50"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdSubmitting" @click="submitResetPwd">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID" width="120">{{
          detailData.userId
        }}</el-descriptions-item>
        <el-descriptions-item label="登录账号">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item label="用户昵称">{{ detailData.nickName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属角色">
          <el-tag
            v-for="name in detailData.roleNames"
            :key="name"
            size="small"
            style="margin-right: 4px"
          >
            {{ name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          detailData.createTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{
          detailData.loginTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{
          detailData.remark || '-'
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue'
  import { SearchForm, ProTable } from '@/components/table'
  import type { SearchFormItem } from '@/components/table/search-form.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance } from 'element-plus'
  import {
    getUserList,
    createUser,
    updateUser,
    deleteUsers,
    updateUserStatus,
    resetUserPassword,
    assignUserRoles,
    getRoleList,
  } from '@/service/user'
  import type { UserInfo, UserQueryParams, RoleInfo } from '@/service/user'
  import { usePermissionStore } from '@/stores/permission'

  // ==================== 权限 ====================
  const permissionStore = usePermissionStore()
  const hasPerm = (perm: string) => {
    if (permissionStore.permission.length === 0) return true // 未配置权限时全部展示
    return permissionStore.permission.includes(perm)
  }

  // ==================== 角色选项 ====================
  const roleOptions = ref<RoleInfo[]>([])

  // ==================== 搜索配置 ====================
  const searchItems = ref<SearchFormItem[]>([
    { type: 'input', label: '账号/昵称', prop: 'keywords', placeholder: '请输入账号或昵称' },
    { type: 'select', label: '角色', prop: 'roleId', placeholder: '请选择角色', options: [] },
    {
      type: 'select',
      label: '账号状态',
      prop: 'status',
      placeholder: '请选择状态',
      options: [
        { label: '正常', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
    {
      type: 'date',
      label: '创建时间',
      prop: 'timeRange',
      dateType: 'daterange',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      rangeSeparator: '至',
    },
  ])

  const fetchRoles = async () => {
    try {
      const res = await getRoleList()
      roleOptions.value = res.data
      // 更新搜索项的角色下拉选项
      const roleField = searchItems.value.find((item) => item.prop === 'roleId')
      if (roleField && roleField.type === 'select') {
        roleField.options = roleOptions.value.map((r) => ({ label: r.roleName, value: r.id }))
      }
    } catch {
      // 静默失败，下拉为空时不影响使用
    }
  }

  // ==================== 列表与搜索 ====================
  const loading = ref(false)
  const userList = ref<UserInfo[]>([])
  const total = ref(0)
  const selectedIds = ref<number[]>([])

  const queryParams = reactive<UserQueryParams & { timeRange: string[] }>({
    keywords: '',
    roleId: undefined,
    status: undefined,
    timeRange: [],
    beginTime: undefined,
    endTime: undefined,
    page: 1,
    pageSize: 20,
  })

  watch(
    () => queryParams.timeRange,
    (val) => {
      if (val && val.length === 2) {
        queryParams.beginTime = val[0]
        queryParams.endTime = val[1]
      } else {
        queryParams.beginTime = undefined
        queryParams.endTime = undefined
      }
    },
  )

  const fetchData = async () => {
    loading.value = true
    try {
      const res = await getUserList({ ...queryParams })
      userList.value = res.data.list
      total.value = res.data.total
    } catch {
      ElMessage.error('获取用户列表失败')
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    queryParams.page = 1
    fetchData()
  }

  const handleReset = () => {
    queryParams.keywords = ''
    queryParams.roleId = undefined
    queryParams.status = undefined
    queryParams.timeRange = []
    queryParams.beginTime = undefined
    queryParams.endTime = undefined
    queryParams.page = 1
    fetchData()
  }

  const handleSelectionChange = (rows: UserInfo[]) => {
    selectedIds.value = rows.map((r) => r.userId)
  }

  const handleUpdateModel = (prop: string, value: unknown) => {
    ;(queryParams as Record<string, unknown>)[prop] = value
  }

  // ==================== 新增 / 编辑 ====================
  const formVisible = ref(false)
  const isEdit = ref(false)
  const formSubmitting = ref(false)
  const editingUserId = ref<number | null>(null)
  const formRef = ref<FormInstance>()

  const formData = reactive({
    username: '',
    nickName: '',
    phone: '',
    email: '',
    password: '',
    roleIds: [] as number[],
    status: 1,
    remark: '',
  })

  const formRules = {
    username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
    nickName: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    roleIds: [{ required: true, message: '请选择所属角色', trigger: 'change' }],
    phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
    email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  }

  const openAddDialog = () => {
    isEdit.value = false
    editingUserId.value = null
    formData.username = ''
    formData.nickName = ''
    formData.phone = ''
    formData.email = ''
    formData.password = ''
    formData.roleIds = []
    formData.status = 1
    formData.remark = ''
    formVisible.value = true
  }

  const openEditDialog = (row: UserInfo) => {
    isEdit.value = true
    editingUserId.value = row.userId
    formData.username = row.username
    formData.nickName = row.nickName
    formData.phone = row.phone
    formData.email = row.email
    formData.password = ''
    formData.roleIds = [...row.roleIds]
    formData.status = row.status
    formData.remark = row.remark
    formVisible.value = true
  }

  const closeFormDialog = () => {
    formRef.value?.resetFields()
  }

  const submitForm = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    formSubmitting.value = true
    try {
      if (isEdit.value && editingUserId.value) {
        await updateUser(editingUserId.value, {
          username: formData.username,
          nickName: formData.nickName,
          phone: formData.phone,
          email: formData.email,
          roleIds: formData.roleIds,
          status: formData.status,
          remark: formData.remark,
        })
        ElMessage.success('更新成功')
      } else {
        await createUser({ ...formData })
        ElMessage.success('新增成功')
      }
      formVisible.value = false
      fetchData()
    } catch {
      // 错误已由拦截器处理
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== 删除 ====================
  const handleDelete = async (row: UserInfo) => {
    try {
      await ElMessageBox.confirm(`确认删除用户「${row.nickName}」吗？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
      await deleteUsers([row.userId])
      ElMessage.success('删除成功')
      fetchData()
    } catch {
      // 取消操作不处理
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请选择要删除的用户')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedIds.value.length} 个用户吗？`,
        '批量删除确认',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
      )
      await deleteUsers(selectedIds.value)
      ElMessage.success('批量删除成功')
      fetchData()
    } catch {
      // 取消操作不处理
    }
  }

  // ==================== 批量启用 / 禁用 ====================
  const handleBatchStatus = async (status: number) => {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请选择用户')
      return
    }
    const label = status === 1 ? '启用' : '禁用'
    try {
      await ElMessageBox.confirm(
        `确认${label}选中的 ${selectedIds.value.length} 个用户吗？`,
        `批量${label}确认`,
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
      )
      await updateUserStatus(selectedIds.value, status)
      ElMessage.success(`${label}成功`)
      fetchData()
    } catch {
      // 取消操作不处理
    }
  }

  // ==================== 切换单个状态 ====================
  const handleToggleStatus = async (row: UserInfo) => {
    const newStatus = row.status === 1 ? 0 : 1
    const label = newStatus === 1 ? '启用' : '禁用'
    try {
      await ElMessageBox.confirm(`确认${label}用户「${row.nickName}」吗？`, `${label}确认`, {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
      await updateUserStatus([row.userId], newStatus)
      ElMessage.success(`${label}成功`)
      fetchData()
    } catch {
      // 取消操作不处理
    }
  }

  // ==================== 分配角色 ====================
  const assignRoleVisible = ref(false)
  const assignRoleSubmitting = ref(false)
  const assignRoleUser = ref<UserInfo | null>(null)
  const assignRoleForm = reactive({ roleIds: [] as number[] })

  const openAssignRoleDialog = (row: UserInfo) => {
    assignRoleUser.value = row
    assignRoleForm.roleIds = [...row.roleIds]
    assignRoleVisible.value = true
  }

  const submitAssignRole = async () => {
    if (!assignRoleUser.value || assignRoleForm.roleIds.length === 0) {
      ElMessage.warning('请选择角色')
      return
    }
    const targetUser = assignRoleUser.value
    if (!targetUser) return
    assignRoleSubmitting.value = true
    try {
      const res = await assignUserRoles(targetUser.userId, assignRoleForm.roleIds)
      // 更新列表中的角色显示
      const idx = userList.value.findIndex((u) => u.userId === targetUser.userId)
      if (idx !== -1 && res.data) {
        const user = userList.value[idx]
        if (user) {
          user.roleIds = res.data?.roleIds ?? ''
          user.roleNames = res.data?.roleNames ?? ''
        }
      }
      ElMessage.success('角色分配成功')
      assignRoleVisible.value = false
    } catch {
      // 错误已由拦截器处理
    } finally {
      assignRoleSubmitting.value = false
    }
  }

  // ==================== 重置密码 ====================
  const resetPwdVisible = ref(false)
  const resetPwdSubmitting = ref(false)
  const resetPwdUser = ref<UserInfo | null>(null)
  const resetPwdRef = ref<FormInstance>()

  const resetPwdForm = reactive({
    newPassword: '',
    confirmPassword: '',
  })

  const validateConfirmPassword = (
    _rule: unknown,
    value: string,
    callback: (error?: Error | string) => void,
  ) => {
    if (value && value !== resetPwdForm.newPassword) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }

  const resetPwdRules = {
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请再次输入密码', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' },
    ],
  }

  const openResetPwdDialog = (row: UserInfo) => {
    resetPwdUser.value = row
    resetPwdForm.newPassword = ''
    resetPwdForm.confirmPassword = ''
    resetPwdVisible.value = true
  }

  const submitResetPwd = async () => {
    if (!resetPwdRef.value) return
    const valid = await resetPwdRef.value.validate().catch(() => false)
    if (!valid || !resetPwdUser.value) return

    resetPwdSubmitting.value = true
    try {
      await resetUserPassword(
        resetPwdUser.value.userId,
        resetPwdForm.newPassword,
        resetPwdForm.confirmPassword,
      )
      ElMessage.success('密码重置成功')
      resetPwdVisible.value = false
    } catch {
      // 错误已由拦截器处理
    } finally {
      resetPwdSubmitting.value = false
    }
  }

  // ==================== 导出 ====================
  const handleExport = () => {
    const headers = [
      '用户ID',
      '登录账号',
      '用户昵称',
      '手机号',
      '邮箱',
      '账号状态',
      '创建时间',
      '最后登录',
    ]
    const rows = userList.value.map((u) => [
      u.userId,
      u.username,
      u.nickName,
      u.phone,
      u.email,
      u.status === 1 ? '正常' : '禁用',
      u.createTime,
      u.loginTime,
    ])

    const csvContent =
      '﻿' +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `用户数据_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }

  // ==================== 详情 ====================
  const detailVisible = ref(false)
  const detailData = reactive<UserInfo>({
    userId: 0,
    username: '',
    nickName: '',
    phone: '',
    email: '',
    roleIds: [],
    roleNames: [],
    status: 1,
    remark: '',
    createTime: '',
    loginTime: '',
  })

  // ==================== 初始化 ====================
  onMounted(() => {
    fetchRoles()
    fetchData()
  })
</script>
