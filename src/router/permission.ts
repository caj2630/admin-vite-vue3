import router from './index.ts'
import { usePermissionStore } from '@/stores/permission'
import { useUserInfoStore } from '@/stores/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/404', '/403'] // 不重定向白名单

// 获取 views 目录下所有 .vue 文件的映射
const modules = import.meta.glob('@/views/**/*.vue')

// 根据路径匹配 views 目录下的组件
const matchViewComponent = (path: string): (() => Promise<any>) | null => {
  const cleanPath = path.replace(/^\//, '')

  // 尝试匹配 /views/path/index.vue
  const indexPath = `/src/views/${cleanPath}/index.vue`
  if (modules[indexPath]) {
    return modules[indexPath]
  }

  // 尝试匹配 /views/path.vue
  const directPath = `/src/views/${cleanPath}.vue`
  if (modules[directPath]) {
    return modules[directPath]
  }

  return null
}

// 标记是否已尝试加载路由，防止重复请求和重定向循环
let routeLoadAttempted = false

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const userStore = useUserInfoStore()
  const permissionStore = usePermissionStore()
  if (userStore.token) {
    // 访问登录页或根路径时，跳转到第一个菜单
    if (to.path === '/login' || to.path === '/') {
      try {
        if (!permissionStore.menus || permissionStore.menus.length === 0) {
          await permissionStore.generateRoutes()
        }
        const firstMenu = permissionStore.menus?.[0]
        const targetPath = firstMenu?.path || '/home'
        // 确保目标路由已注册
        const existingRoute = router.getRoutes().find((r) => r.path === targetPath)
        if (!existingRoute) {
          const component = matchViewComponent(targetPath)
          if (component) {
            const routePath = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath
            router.addRoute('Layout', {
              path: routePath,
              name: `dynamic-${routePath.replace(/\//g, '-')}`,
              component,
              meta: {
                title: firstMenu?.title || routePath,
                dynamic: true,
              },
            })
          }
        }
        next({ path: targetPath, replace: true })
      } catch (error) {
        console.error('获取菜单失败:', error)
        next({ path: '/home', replace: true })
      }
      return
    } else {
      // 动态路由尚未加载时，尝试加载一次
      const hasRoutes = permissionStore.routes && permissionStore.routes.length > 0
      if (!hasRoutes && !routeLoadAttempted) {
        routeLoadAttempted = true
        try {
          await permissionStore.generateRoutes()
          // 动态路由添加后，重新导航到目标路径
          next({ path: to.path, query: to.query, params: to.params, replace: true })
          return
        } catch (error) {
          console.error('获取路由失败:', error)
          await userStore.resetToken()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
          return
        }
      }

      // 检查目标路由是否已注册
      const existingRoute = router.getRoutes().find((r) => r.path === to.path)

      if (!existingRoute || existingRoute.name === 'not-found') {
        // 路由未注册，尝试匹配 views 目录下的文件
        const component = matchViewComponent(to.path)
        if (component) {
          // 找到对应文件，动态添加路由
          const routePath = to.path.startsWith('/') ? to.path.slice(1) : to.path
          router.addRoute('Layout', {
            path: routePath,
            name: `dynamic-${routePath.replace(/\//g, '-')}`,
            component,
            meta: {
              title: routePath,
              dynamic: true,
            },
          })
          // 重新导航以触发新路由
          next({ path: to.path, query: to.query, params: to.params, replace: true })
          return
        } else {
          // 未找到对应文件，跳转到 404
          next('/404')
          NProgress.done()
          return
        }
      }

      next()
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach((to) => {
  // 设置页面标题
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - 系统名称`
  }
  NProgress.done()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  NProgress.done()
})
