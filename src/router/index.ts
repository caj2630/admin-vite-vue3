import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/components/Layout.vue'),
      children: [
        {
          path: 'chat',
          name: 'Chat',
          component: () => import('@/views/chat/index.vue'),
          meta: { title: 'AI 智能对话' },
        },
      ],
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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/templateError/notFound.vue'),
    },
  ],
})

export default router
