import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SvgToolView from '@/views/SvgToolView.vue'
import FormatToolView from '@/views/FormatToolView.vue'
import ComingSoonView from '@/views/ComingSoonView.vue'

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
      path: '/svg/preserve',
      name: 'svg-preserve',
      component: SvgToolView,
      meta: { title: '原样转 SVG', tool: 'preserve' },
    },
    {
      path: '/svg/vector',
      name: 'svg-vector',
      component: SvgToolView,
      meta: { title: '矢量描摹', tool: 'vector' },
    },
    {
      path: '/svg/export',
      redirect: '/format',
    },
    {
      path: '/svg',
      redirect: '/',
    },
    {
      path: '/format',
      name: 'format',
      component: FormatToolView,
      meta: { title: '图片格式转换' },
    },
    {
      path: '/resize',
      name: 'resize',
      component: ComingSoonView,
      meta: {
        title: '图片尺寸调整',
        description: '按像素、比例缩放或裁剪后导出，方便适配头像、封面和不同平台规格。',
        statusLabel: '即将推出',
      },
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
