import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/svg',
      name: 'svg',
      component: () => import('@/views/SvgToolView.vue'),
    },
    {
      path: '/svg/preserve',
      redirect: '/svg',
    },
    {
      path: '/svg/vector',
      redirect: '/svg?mode=vector',
    },
    {
      path: '/svg/export',
      redirect: '/export',
    },
    {
      path: '/edit',
      name: 'edit',
      component: () => import('@/views/EditToolView.vue'),
    },
    {
      path: '/export',
      name: 'export',
      component: () => import('@/views/FormatToolView.vue'),
    },
    {
      path: '/format',
      redirect: '/export',
    },
    {
      path: '/compress',
      redirect: '/export',
    },
    {
      path: '/resize',
      redirect: '/edit',
    },
    {
      path: '/rotate',
      redirect: '/edit',
    },
    {
      path: '/crop',
      redirect: '/edit',
    },
    {
      path: '/batch',
      redirect: '/export',
    },
    {
      path: '/app',
      redirect: '/',
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior(_to, from) {
    if (!from.name) return false
    return { top: 0 }
  },
})

export default router
