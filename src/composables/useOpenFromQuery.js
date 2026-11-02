// "+ Yangi" menyusidan kelganda (/kp?new=1) sahifa o'zining qo'shish oynasini ochadi.
// Parametr darhol olib tashlanadi — sahifa yangilansa yoki orqaga qaytilsa oyna qayta ochilmaydi.
import { nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useOpenFromQuery(open) {
  const route = useRoute()
  const router = useRouter()
  watch(
    () => route.query.new,
    (value) => {
      if (value !== '1') return
      const rest = { ...route.query }
      delete rest.new
      router.replace({ query: rest })
      nextTick(open)
    },
    { immediate: true },
  )
}
