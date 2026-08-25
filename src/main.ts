import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { initTheme } from './theme'
import App from './App.vue'
import router from './router'

initTheme()
createApp(App).use(router).mount('#app')
