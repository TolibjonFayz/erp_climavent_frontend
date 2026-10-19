import { ref } from 'vue'

// Tungi/kunduzgi rejim. Tanlov brauzerda (localStorage) saqlanadi; tanlanmagan bo'lsa
// tizim sozlamasi (prefers-color-scheme) kuzatiladi. html.dark klassi main.css va
// Element Plus'ning dark css-vars'ini yoqadi.

const STORAGE_KEY = 'erp-theme'
const media = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Maxfiy rejim yoki bloklangan saqlash — tanlov faqat shu sessiyada qoladi
  }
}

const stored = readStored()
const isDark = ref(stored ? stored === 'dark' : !!media?.matches)

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
  // index.html'dagi oldindan qo'yilgan fon endi kerak emas — rangni main.css boshqaradi
  document.documentElement.style.background = ''
}

applyTheme()

media?.addEventListener?.('change', (event) => {
  if (readStored()) return
  isDark.value = event.matches
  applyTheme()
})

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
    writeStored(isDark.value ? 'dark' : 'light')
    // Almashtirish paytida CSS transition'larni o'chiramiz: aks holda har bir element o'z
    // tezligida rang o'zgartirib, bir lahza "aralash" (yarim tungi) ko'rinish chiqadi.
    const root = document.documentElement
    root.classList.add('theme-switching')
    applyTheme()
    void root.offsetHeight
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
  }

  return { isDark, toggleTheme }
}
