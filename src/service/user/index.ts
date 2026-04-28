import { get, post, put, del } from '@/service'

/** 用户查询参数 */
export interface UserQueryParams {
  keywords?: string
  roleId?: number | string
  status?: number | string
  beginTime?: string
  endTime?: string
  page?: number
  pageSize?: number
}

/** 用户信息 */
export interface UserInfo {
  userId: number
  username: string
  nickName: string
  phone: string
  email: string
  roleIds: number[]
  roleNames: string[]
  status: number
  remark: string
  createTime: string
  loginTime: string
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 角色信息 */
export interface RoleInfo {
  id: number
  roleName: string
  roleCode: string
  status: number
}

/** 获取用户分页列表 */
export const getUserList = (params: UserQueryParams) =>
  get<{ data: PageResult<UserInfo> }>('/api/system/users', params)

/** 获取用户详情 */
export const getUserDetail = (id: number) => get<{ data: UserInfo }>(`/api/system/users/${id}`)

/** 新增用户 */
export const createUser = (data: Partial<UserInfo> & { password?: string }) =>
  post<{ data: UserInfo }>('/api/system/users', data)

/** 更新用户 */
export const updateUser = (id: number, data: Partial<UserInfo>) =>
  put<{ data: UserInfo }>(`/api/system/users/${id}`, data)

/** 批量删除用户 */
export const deleteUsers = (ids: number[]) =>
  del<{ message: string }>('/api/system/users', { data: { ids } })

/** 批量启用/禁用 */
export const updateUserStatus = (ids: number[], status: number) =>
  put<{ message: string }>('/api/system/users/status', { ids, status })

/** 重置密码 */
export const resetUserPassword = (id: number, newPassword: string, confirmPassword: string) =>
  put<{ message: string }>(`/api/system/users/${id}/password`, { newPassword, confirmPassword })

/** 分配角色 */
export const assignUserRoles = (id: number, roleIds: number[]) =>
  put<{ data: UserInfo }>(`/api/system/users/${id}/roles`, { roleIds })

/** 获取角色列表 */
export const getRoleList = () => get<{ data: RoleInfo[] }>('/api/system/roles')
