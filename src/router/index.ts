import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SvgToolView from '@/views/SvgToolView.vue'
import EditToolView from '@/views/EditToolView.vue'
import FormatToolView from '@/views/FormatToolView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Kinolin Tool' },
    },
    {
      path: '/svg',
      name: 'svg',
      component: SvgToolView,
      meta: { title: '图片转 SVG' },
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
      meta: { title: '调整画面' },
    },
    {
      path: '/export',
      name: 'export',
      component: FormatToolView,
      meta: { title: '转格式 / 压缩' },
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
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Kinolin Tool'
  document.title = to.name === 'home' ? title : `${title} · Kinolin Tool`
})

export default router
