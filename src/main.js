import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './composables/useTheme'
import element from './plugins/element'
import i18n, { currentLanguage, loadLanguage } from './i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
// Element Plus — faqat ishlatiladigan komponentlar va ikonkalar (plugins/element.js)
app.use(element)

// Joriy til matnlari yuklangach chiziladi (aks holda birinchi kadrda kalit nomlari ko'rinadi)
loadLanguage(currentLanguage()).finally(() => app.mount('#app'))
