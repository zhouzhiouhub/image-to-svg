import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SvgToolView from '@/views/SvgToolView.vue'
import FormatToolView from '@/views/FormatToolView.vue'
import ResizeToolView from '@/views/ResizeToolView.vue'
import CompressToolView from '@/views/CompressToolView.vue'
import TransformToolView from '@/views/TransformToolView.vue'
import CropToolView from '@/views/CropToolView.vue'
import BatchToolView from '@/views/BatchToolView.vue'

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
      component: ResizeToolView,
      meta: { title: '图片尺寸调整' },
    },
    {
      path: '/compress',
      name: 'compress',
      component: CompressToolView,
      meta: { title: '图片压缩' },
    },
    {
      path: '/rotate',
      name: 'rotate',
      component: TransformToolView,
      meta: { title: '旋转与翻转' },
    },
    {
      path: '/crop',
      name: 'crop',
      component: CropToolView,
      meta: { title: '图片裁剪' },
    },
    {
      path: '/batch',
      name: 'batch',
      component: BatchToolView,
      meta: { title: '批量处理' },
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
