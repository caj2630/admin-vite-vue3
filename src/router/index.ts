import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/components/Layout.vue'),
      children: [],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
    },
    {
      path: '/403',
      name: 'no-permission',
      component: () => import('@/views/templateError/noPermission.vue'),
    },
    {
      path: '/404',
      name: 'not-found-page',
      component: () => import('@/views/templateError/notFound.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/templateError/notFound.vue'),
    },
  ],
})

export default router
