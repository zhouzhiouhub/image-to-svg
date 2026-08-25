import { createApp } from 'vue'
import './styles.css'
import { initTheme } from './theme'
import App from './App.vue'
import router from './router'

initTheme()
createApp(App).use(router).mount('#app')
