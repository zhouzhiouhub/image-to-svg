import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SvgToolView from '@/views/SvgToolView.vue'
import EditToolView from '@/views/EditToolView.vue'
import FormatToolView from '@/views/FormatToolView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { applyRouteSeo, seoPages } from '@/seo'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: seoPages.home.title, description: seoPages.home.description },
    },
    {
      path: '/svg',
      name: 'svg',
      component: SvgToolView,
      meta: { title: seoPages.svg.title, description: seoPages.svg.description },
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
      meta: { title: seoPages.edit.title, description: seoPages.edit.description },
    },
    {
      path: '/export',
      name: 'export',
      component: FormatToolView,
      meta: { title: seoPages.export.title, description: seoPages.export.description },
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
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
      meta: { title: seoPages.notFound.title, description: seoPages.notFound.description },
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
