// Raqam o'zgarganda eski qiymatdan yangisiga "sanab" boradi (KPI kartalari).
// Qiymat tayyor matn bo'lishi mumkin ("1 207", "545 087 511 552 so'm", "4,2%") — birinchi raqam
// shu formatni (bo'shliqli guruhlash, kasr belgisi va xonalari, old/orqa matn) saqlagan holda o'zgaradi.
import { onBeforeUnmount, ref, watch } from 'vue'

const NUM = /-?\d[\d\s  ]*(?:[.,]\d+)?/

function parse(text) {
  const m = String(text ?? '').match(NUM)
  if (!m) return null
  const raw = m[0]
  const dec = raw.match(/[.,](\d+)$/)
  const intPart = dec ? raw.slice(0, -dec[0].length) : raw
  const sep = (intPart.match(/[\s  ]/) || [''])[0]
  return {
    value: Number(intPart.replace(/[\s  ]/g, '') + (dec ? '.' + dec[1] : '')),
    decimals: dec ? dec[1].length : 0,
    decSep: dec ? dec[0][0] : '',
    sep,
    before: String(text).slice(0, m.index),
    after: String(text).slice(m.index + raw.length),
  }
}

function render(n, fmt) {
  const fixed = Math.abs(n).toFixed(fmt.decimals)
  const [i, d] = fixed.split('.')
  const grouped = fmt.sep ? i.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.sep) : i
  return fmt.before + (n < 0 ? '-' : '') + grouped + (d ? fmt.decSep + d : '') + fmt.after
}

export function useCountUp(source, { duration = 700 } = {}) {
  const shown = ref(source())
  let frame = 0
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)')

  watch(source, (next, prev) => {
    cancelAnimationFrame(frame)
    const to = parse(next)
    const from = parse(prev)
    // Raqam bo'lmasa, juda katta sakrash bo'lmasa ham — formati boshqa bo'lsa darhol ko'rsatamiz
    if (!to || reduce?.matches || to.before !== (from?.before ?? to.before) || to.after !== (from?.after ?? to.after)) {
      shown.value = next
      return
    }
    const start = from ? from.value : 0
    if (start === to.value) {
      shown.value = next
      return
    }
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      shown.value = p < 1 ? render(start + (to.value - start) * eased, to) : next
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  })

  onBeforeUnmount(() => cancelAnimationFrame(frame))
  return shown
}
