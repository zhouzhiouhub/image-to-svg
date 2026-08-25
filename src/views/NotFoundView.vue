<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="not-found">
    <p class="code">404</p>
    <h1>页面不存在</h1>
    <p>没有这个地址。图片工具都在下面这几个页面，处理仍在浏览器本地完成。</p>
    <nav class="links" aria-label="功能导航">
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/svg">图片转 SVG</RouterLink>
      <RouterLink to="/edit">调整画面</RouterLink>
      <RouterLink to="/export">转格式 / 压缩</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.not-found {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px;
}

.code {
  margin: 0 0 8px;
  color: #c0c4cc;
  font-size: 13px;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 20px;
}

.links a {
  color: #409eff;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

@media (max-width: 767px) {
  .not-found {
    padding: 32px 16px;
  }
}
</style>
