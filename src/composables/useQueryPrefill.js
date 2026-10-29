import { watch } from 'vue'
import { useRoute } from 'vue-router'

// Umumiy qidiruvdan kelganda (masalan /kp?kp=1234) sahifa filtrini to'ldiradi
export function useQueryPrefill(key, apply) {
  const route = useRoute()
  watch(
    () => route.query[key],
    (value) => {
      if (typeof value === 'string' && value) apply(value)
    },
    { immediate: true },
  )
}
