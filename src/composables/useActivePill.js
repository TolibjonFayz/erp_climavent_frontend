// Menyudagi faol band foni ("pill"): har bandda alohida emas, bitta — faol band almashganda
// yangi joyiga suriladi (yon menyu, admin menyusi).
//
//   const nav = ref(null)
//   const { pillStyle, pillPlaced } = useActivePill(nav, '.is-active', () => activeTab.value)
//   <nav ref="nav"> <span class="pill" :class="{ 'is-placed': pillPlaced }" :style="pillStyle" /> ... </nav>
//
// Konteyner `position: relative` bo'lishi kerak. Birinchi joylashuv sakramasdan, keyingilari suriladi.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export function useActivePill(containerRef, activeSelector, source) {
  const pill = ref({ top: 0, left: 0, width: 0, height: 0, visible: false, placed: false })

  function place() {
    const item = containerRef.value?.querySelector(activeSelector)
    if (!item) {
      pill.value = { ...pill.value, visible: false }
      return
    }
    const first = !pill.value.visible
    pill.value = {
      top: item.offsetTop,
      left: item.offsetLeft,
      width: item.offsetWidth,
      height: item.offsetHeight,
      visible: true,
      placed: pill.value.placed && !first,
    }
    if (!pill.value.placed) requestAnimationFrame(() => requestAnimationFrame(() => (pill.value.placed = true)))
  }

  watch(source, () => nextTick(place))

  let observer = null
  onMounted(() => {
    nextTick(place)
    if (containerRef.value && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => place())
      observer.observe(containerRef.value)
    }
  })
  onBeforeUnmount(() => observer?.disconnect())

  const pillStyle = computed(() => ({
    transform: `translate(${pill.value.left}px, ${pill.value.top}px)`,
    width: `${pill.value.width}px`,
    height: `${pill.value.height}px`,
    opacity: pill.value.visible ? 1 : 0,
  }))
  const pillPlaced = computed(() => pill.value.placed)

  return { pillStyle, pillPlaced, place }
}
