import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 导入路由组件
import Home from './views/Home.vue'
import ThreeDView from './views/ThreeDView.vue'
import ConfigPanel from './views/ConfigPanel.vue'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/3d-view', component: ThreeDView },
    { path: '/config', component: ConfigPanel },
  ]
})

// 创建Pinia实例
const pinia = createPinia()

// 创建应用实例
const app = createApp(App)

// 使用插件
app.use(router)
app.use(pinia)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')
