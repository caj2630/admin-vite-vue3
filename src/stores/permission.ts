import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import nameSpace from './name-space'
import { ElMessage } from 'element-plus'
import { get } from '@/service'
import router from '@/router/index.ts';

interface MenuItem {
  id?: number | string
  path: string
  name: string
  title?: string
  component: string
  icon?: string
  children?: MenuItem[]
}

interface RouteItem {
  path: string
  name: string
  component: () => Promise<any>
}
const modules = import.meta.glob('@/views/**/*.vue')
console.log(modules, 'modules')
const getComponentByPath = (menuPath) => {
  // 移除开头的 /
  const cleanPath = menuPath?.replace?.(/^\//, '')
  // 构建完整路径
  const componentPath = `/src/views/${cleanPath}/index.vue`
  
  // 从映射中获取组件
  if (modules[componentPath]) {
    return modules[componentPath]
  } else {
    console.warn(`组件路径不存在: ${componentPath}`)
    return modules['/src/views/templateError/notFound.vue'] || (() => import('@/views/templateError/notFound.vue'))
  }
}
export const usePermissionStore = defineStore(
  nameSpace.PERMISSION,
  () => {
    const permission = ref<any[]>([])
    const menus = ref<MenuItem[]>([])
    const isLoading = ref(false)
    const routes = ref<RouteItem[]>([])

    // 添加动态路由到router
    const addRoutesToRouter = (menuList: MenuItem[]) => {
      menuList.forEach((menu: MenuItem) => {
        menu.component = getComponentByPath(menu.path)
        // 验证菜单项的必要字段
        if (!menu.path || !menu.name || !menu.component) {
          console.warn('菜单项缺少必要字段，跳过添加路由:', menu)
          return
        }
        // 检查路由是否已存在
        const existingRoute = router.getRoutes().find(r => r.path === menu.path)
        if (!existingRoute) {
          try {
            router.addRoute('Layout', {
              path: menu.path,
              name: menu.name,
              component: getComponentByPath(menu.path),
              meta: {
                title: menu.title || menu.name,
                requiresPermission: true,
                dynamic: true
              }
            })
          } catch (error) {
            console.error(`添加路由失败: ${menu.path}`, error)
          }
        }

        // 递归处理子菜单
        if (menu.children && menu.children.length > 0) {
          addRoutesToRouter(menu.children)
        }
      })
    }
    const fetchMenus = async () => {
      isLoading.value = true
      try {
        const result = await get<{ data: MenuItem[] }>('/api/menus')
        if (result.data && Array.isArray(result.data)) {
          
          // 过滤无效的菜单项，确保每个菜单项都有必要字段
          // const data = result.data?.map(menu => {
          //   return {
          //     path: menu.path,
          //     name: menu.name,
          //     component: modules[`/src/views${menu.path}/index.vue`] || (() => import('@/views/templateError/notFound.vue'))
          //   }
          // })
          const validMenus = result.data //.filter(menu => menu && menu.path && menu.name && menu.component)
          if (validMenus.length === 0) {
            console.warn('API返回的菜单数据中没有有效项:', result.data)
            ElMessage.warning('菜单数据格式不正确')
          }
          menus.value = validMenus
          routes.value = validMenus.map((menu: MenuItem) => ({
            path: menu.path,
            name: menu.name,
            component: getComponentByPath(menu.path),
          }))
          console.log(routes.value, 'routes.value')

          // 将路由添加到router
          addRoutesToRouter(validMenus)
        } else {
          console.error('API返回数据格式不正确:', result)
          ElMessage.error('菜单数据格式不正确')
        }
      } catch (error) {
        console.error('Failed to fetch menus:', error)
        ElMessage.error('获取菜单失败')
      } finally {
        isLoading.value = false
      }
    }
    const generateRoutes = async () => {
      await fetchMenus()
    }
    return { permission, routes, generateRoutes, isLoading, menus, fetchMenus, addRoutesToRouter}
  },
  {
    // persist: true // 开启持久化
  },
)
