import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import '@/router/permission.ts' // 导入权限控制逻辑

const app = createApp(App)
app.use(ElementPlus)
const pinia = createPinia()
app.use(pinia)

app.use(router)
pinia.use(
  createPersistedState({
    // 设置全局不开启持久化，单独在需要持久化的 store 中开启
    auto: false,
  }),
)

app.mount('#app')
