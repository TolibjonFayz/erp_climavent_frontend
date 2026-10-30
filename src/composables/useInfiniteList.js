import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Uzun ro'yxatni bosqichma-bosqich chizish (infinite scroll): avval `step` ta qator,
// ro'yxat oxiridagi belgi (sentinel) ekran pastiga yaqinlashganda yana `step` ta qo'shiladi.
// Ma'lumot allaqachon xotirada — faqat DOM'ga chiziladigan qatorlar soni oshadi.
// Filtr/saralash o'zgarsa (manba yangi massiv bo'lsa) — yana boshidan.
export function useInfiniteList(source, { step = 30, threshold = 400 } = {}) {
  const limit = ref(step)
  const sentinel = ref(null)
  let observer = null
  let frame = 0

  const visible = computed(() => source.value.slice(0, limit.value))
  const hasMore = computed(() => limit.value < source.value.length)

  function loadMore() {
    if (hasMore.value) limit.value += step
  }

  function reset() {
    limit.value = step
  }

  // Sentinel ekran pastidan `threshold` px masofaga kelgan bo'lsa — yana qo'shamiz
  function check() {
    frame = 0
    const el = sentinel.value
    // Yashirin tabdagi ro'yxat (display:none) koordinatasi 0 — "ekranda" deb o'ylab hammasini
    // chizib yubormasin: offsetParent faqat ko'rinadigan elementda bor
    if (!el || !el.offsetParent || !hasMore.value) return
    if (el.getBoundingClientRect().top < window.innerHeight + threshold) loadMore()
  }
  // Scroll juda tez-tez keladi — 80 ms'da bir martadan ko'p tekshirmaymiz
  const onScroll = () => {
    if (!frame) frame = setTimeout(check, 80)
  }

  watch(source, reset)
  // Qo'shilgan qatorlar ekranni to'ldirmasa, sentinel ko'rinishda qoladi — yana tekshiramiz
  watch(limit, async () => {
    await nextTick()
    check()
  })

  // Asosiy yo'l — IntersectionObserver; scroll hodisasi — u ishlamaydigan holatlar uchun zaxira
  watch(sentinel, (el, old) => {
    if (old && observer) observer.unobserve(old)
    if (!el) return
    if ('IntersectionObserver' in window) {
      observer ??= new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) loadMore()
        },
        { rootMargin: `0px 0px ${threshold}px 0px` },
      )
      observer.observe(el)
    }
    nextTick(check)
  })

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    clearTimeout(frame)
  })

  return { visible, hasMore, loadMore, reset, sentinel, limit }
}
