import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Uzun ro'yxatni bosqichma-bosqich chizish (infinite scroll): avval `step` ta qator,
// ro'yxat oxiridagi belgi (sentinel) ekran pastiga yaqinlashganda yana `step` ta qo'shiladi.
// Ma'lumot allaqachon xotirada — faqat DOM'ga chiziladigan qatorlar soni oshadi.
// Filtr/saralash o'zgarsa (manba yangi massiv bo'lsa) — yana boshidan.
//
// Silliqlik uchun: qo'shish paytida `loadingMore` yoqiladi (sahifa skelet ko'rsatadi), qatorlar
// keyingi kadrda chiziladi — scroll to'xtab qolmaydi; yuklash davomida qayta yuklash boshlanmaydi.
export function useInfiniteList(source, { step = 30, threshold = 500, delay = 120 } = {}) {
  const limit = ref(step)
  const sentinel = ref(null)
  const loadingMore = ref(false)
  let observer = null
  let scrollTimer = 0
  let renderTimer = 0

  const visible = computed(() => source.value.slice(0, limit.value))
  const hasMore = computed(() => limit.value < source.value.length)

  function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    // Avval skelet chizilsin, keyin og'ir qism — yangi qatorlar
    renderTimer = setTimeout(async () => {
      limit.value += step
      await nextTick()
      loadingMore.value = false
      // Qo'shilganlar ekranni to'ldirmagan bo'lsa — yana
      await nextTick()
      check()
    }, delay)
  }

  function reset() {
    clearTimeout(renderTimer)
    loadingMore.value = false
    limit.value = step
  }

  // Sentinel ekran pastidan `threshold` px masofaga kelgan bo'lsa — yana qo'shamiz
  function check() {
    scrollTimer = 0
    const el = sentinel.value
    // Yashirin tabdagi ro'yxat (display:none) koordinatasi 0 — "ekranda" deb o'ylab hammasini
    // chizib yubormasin: offsetParent faqat ko'rinadigan elementda bor
    if (!el || !el.offsetParent || !hasMore.value) return
    if (el.getBoundingClientRect().top < window.innerHeight + threshold) loadMore()
  }
  // Scroll juda tez-tez keladi — 80 ms'da bir martadan ko'p tekshirmaymiz
  const onScroll = () => {
    if (!scrollTimer) scrollTimer = setTimeout(check, 80)
  }

  watch(source, reset)

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
    clearTimeout(scrollTimer)
    clearTimeout(renderTimer)
  })

  return { visible, hasMore, loadMore, loadingMore, reset, sentinel, limit }
}
