import router from './index.ts'
import { usePermissionStore } from '@/stores/permission'
import { useUserInfoStore } from '@/stores/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/404', '/403'] // 不重定向白名单

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const userStore = useUserInfoStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      // 获取第一个菜单路径并跳转
      try {
        // 确保获取菜单数据
        if (!permissionStore.menus || permissionStore.menus.length === 0) {
          await permissionStore.generateRoutes()
        }

        // 获取第一个菜单的路径
        const firstMenu = permissionStore.menus?.[0]
        const firstRoute = permissionStore.routes?.[0]
        const targetPath = firstMenu?.path || firstRoute?.path || '/home'

        next({ path: targetPath })
      } catch (error) {
        console.error('获取菜单失败:', error)
        next({ path: '/home' })
      }
      NProgress.done()
    } else {
      // 判断是否已获取过路由
      const hasRoutes = permissionStore.routes && permissionStore.routes.length > 0
      if (!hasRoutes) {
        try {
          // 获取动态路由
          await permissionStore.generateRoutes()

          // 获取第一个菜单路径（如果是首次访问）
          const firstMenu = permissionStore.menus?.[0]
          const firstRoute = permissionStore.routes?.[0]
          const targetPath = firstMenu?.path || firstRoute?.path || to.path

          // 跳转到第一个菜单或当前路径
          next({ path: targetPath, replace: true })
        } catch (error) {
          console.error('获取路由失败:', error)
          // 清除token并跳转到登录页
          await userStore.resetToken()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      } else {
        next()
      }
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
