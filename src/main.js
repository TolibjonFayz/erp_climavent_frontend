import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import ru from 'element-plus/dist/locale/ru.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import i18n from './i18n'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, {
  locale: {
    locale: ru,
  },
})

app.mount('#app')
