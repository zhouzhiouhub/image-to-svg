import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SvgToolView from '@/views/SvgToolView.vue'
import ComingSoonView from '@/views/ComingSoonView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '图片工具' },
    },
    {
      path: '/svg',
      name: 'svg',
      component: SvgToolView,
      meta: { title: '位图 ↔ SVG' },
    },
    {
      path: '/format',
      name: 'format',
      component: ComingSoonView,
      meta: {
        title: '图片格式转换',
        description: '在 PNG、JPEG、WebP 等常见格式之间互转，按目标场景选择体积与透明通道。',
        statusLabel: '即将推出',
      },
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
      name: 'app',
      component: ComingSoonView,
      meta: {
        title: '桌面应用',
        description: '后续会把这套工具打包成可下载应用，方便需要离线、批量使用的人安装。',
        statusLabel: '规划中',
      },
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
  const title = typeof to.meta.title === 'string' ? to.meta.title : '图片工具'
  document.title = to.name === 'home' ? title : `${title} · 图片工具`
})

export default router
