<template>
  <div class="menu-container">
    <ElSkeleton v-if="isLoading" :rows="5" animated />
    <el-menu
      v-else
      :default-active="activeMenu"
      class="el-menu-vertical-demo"
      @select="handleMenuSelect"
      :collapse="isCollapse"
    >
      <MenuItemComponent v-for="menu in menus" :key="menu.id" :menu="menu" :get-icon="getIcon" />
    </el-menu>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElSkeleton } from 'element-plus'
  import { HomeFilled, Setting, User, Document, ChatLineSquare } from '@element-plus/icons-vue'
  import { isTokenValid } from '@/service'
  import MenuItemComponent from './MenuItemComponent.vue'
  import { useMenuStore } from '@/stores/menu'
  import { usePermissionStore } from '@/stores/permission'
  import { storeToRefs } from 'pinia'

  const emits = defineEmits<{
    getCurrentComponent: [{ path: string; name: string; component: any }]
  }>()
  const router = useRouter()
  const route = useRoute()

  const activeMenu = ref(route.path)
  const isCollapse = ref(false)
  const permissionStore = usePermissionStore()
  const { isLoading, menus } = storeToRefs(permissionStore)

  const iconMap: Record<string, any> = {
    setting: Setting,
    document: Document,
    user: User,
    home: HomeFilled,
    chat: ChatLineSquare,
  }
  const menuStore = useMenuStore()

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || HomeFilled
  }

  // 动态路由映射缓存
  const componentCache = new Map<string, any>()

  // 动态加载组件
  const loadComponent = async (path: string) => {
    // 如果已缓存，直接返回
    if (componentCache.has(path)) {
      return componentCache.get(path)
    }

    try {
      // 根据路径动态导入组件
      // 假设页面文件放在 src/views 目录下
      const modules = import.meta.glob('/src/views/**/*.vue')

      // 构建完整的文件路径
      const fullPath = `/src/views${path}.vue`

      if (modules[fullPath]) {
        const component: any = await modules[fullPath]()
        componentCache.set(path, component.default)
        return component.default
      }

      // 尝试带 index 的路径
      const indexPath = `/src/views/${path}/index.vue`
      if (modules[indexPath]) {
        const component: any = await modules[indexPath]()
        componentCache.set(path, component.default)
        return component.default
      }

      return null
    } catch (error) {
      console.error('组件加载失败:', error)
      return null
    }
  }

  // 检查路由是否已注册
  const isRouteRegistered = (path: string): boolean => {
    return router.getRoutes().some((route) => route.path === path || route.name === path)
  }

  // 动态添加路由
  const addDynamicRoute = (path: string, component: any) => {
    // 转换路径格式：/user/list -> UserList 作为路由名称
    const routeName = path.replace(/^\//, '').replace(/\//g, '-')
    emits('getCurrentComponent', { path, name: routeName, component }) // 通过事件通知父组件添加路由

    // 查找Layout路由，将动态路由添加为Layout的子路由
    const layoutRoute = router.getRoutes().find((route) => route.name === 'Layout')
    if (layoutRoute) {
      router.addRoute('Layout', {
        path,
        name: routeName,
        component,
        meta: {
          requiresPermission: true, // 默认需要权限，可根据业务调整
          dynamic: true, // 标记为动态路由
        },
      })
    } else {
      // 如果Layout路由不存在，添加到根路由
      router.addRoute({
        path,
        name: routeName,
        component,
        meta: {
          requiresPermission: true, // 默认需要权限，可根据业务调整
          dynamic: true, // 标记为动态路由
        },
      })
    }
  }

  const handleMenuSelect = async (key: string) => {
    // 处理空值
    if (!key) {
      router.push({ name: 'not-found' })
      return
    }

    // 检查登录状态
    if (!isTokenValid()) {
      router.push({ name: 'login' })
      return
    }

    try {
      // 检查路由是否已存在
      if (!isRouteRegistered(key)) {
        // 动态加载组件
        const component = await loadComponent(key)

        // 组件不存在 -> 404
        if (!component) {
          router.push({ name: 'not-found' })
          return
        }
        menuStore.setComponents(component)
        // 动态添加路由
        addDynamicRoute(key, component)
      }

      // 解析路由
      const resolved = router.resolve(key)

      // 检查路由是否存在
      if (!resolved || resolved.name === 'not-found') {
        router.push({ name: 'not-found' })
        return
      }

      // 权限检查
      const hasPermission = resolved.matched.every((record) => {
        const meta = record.meta as any
        // 动态路由默认需要权限验证
        if (meta?.dynamic) {
          // 这里可以根据实际业务逻辑进行权限校验
          return checkRoutePermission(key)
        }
        return meta?.requiresPermission === false || meta?.requiresPermission === undefined
      })

      if (!hasPermission) {
        router.push({ name: 'no-permission' })
        return
      }

      // 更新激活菜单并跳转
      activeMenu.value = key
      await router.push(key)
    } catch (error) {
      console.error('路由处理失败:', error)
      router.push({ name: 'not-found' })
    }
  }

  // 权限校验函数（根据实际业务实现）
  const checkRoutePermission = (path: string): boolean => {
    // 从接口获取的用户权限列表
    const userPermissions = getUserPermissions()

    // 这里根据实际业务逻辑判断
    // 例如：检查用户是否有访问该路径的权限
    return true || userPermissions.includes(path) // TODO 根据实际权限逻辑调整 暂时还没有写权限的接口
  }

  // 获取用户权限（示例）
  const getUserPermissions = (): string[] => {
    // 从 store 或 localStorage 获取用户权限
    const permissions = localStorage.getItem('user_permissions')
    return permissions ? JSON.parse(permissions) : []
  }
  onMounted(() => {})
</script>

<style scoped>
  .menu-container {
    width: 100%;
  }
</style>
