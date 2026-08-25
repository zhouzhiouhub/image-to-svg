import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SvgToolView from '@/views/SvgToolView.vue'
import EditToolView from '@/views/EditToolView.vue'
import FormatToolView from '@/views/FormatToolView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PrivacyView from '@/views/PrivacyView.vue'
import { applyRouteSeo } from '@/seo'

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
      component: SvgToolView,
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
      component: EditToolView,
    },
    {
      path: '/export',
      name: 'export',
      component: FormatToolView,
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
      component: PrivacyView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  applyRouteSeo(to)
})

export default router
