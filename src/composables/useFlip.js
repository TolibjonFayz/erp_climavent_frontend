// Doskadagi kartochkalar joyi o'zgarganda silliq surilishi (FLIP: First, Last, Invert, Play).
//
//   const board = ref(null)
//   useFlip(board)
//   <div ref="board"> ... <article :data-flip-id="item.id"> ... </div>
//
// Komponent qayta chizilishidan oldin har bir [data-flip-id] joyini eslab qoladi, keyin yangi joyiga
// "eski joydan" suriladi. Boshqa ustunga o'tgan kartochka ustun scroll'i bilan kesilmasligi uchun
// uning nusxasi ekran ustida uchib boradi, asli shu vaqt yashirin turadi.
import { onBeforeUpdate, onUpdated } from 'vue'

const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

function fly(el, from, to, duration) {
  const ghost = el.cloneNode(true)
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    zIndex: '3000',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  })
  ghost.removeAttribute('data-flip-id')
  document.body.appendChild(ghost)
  el.style.visibility = 'hidden'
  const dx = to.left - from.left
  const dy = to.top - from.top
  const anim = ghost.animate(
    [
      { transform: 'translate(0, 0)', width: `${from.width}px`, boxShadow: '0 4px 12px rgba(15,23,42,.08)' },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 12}px) scale(1.03)`, boxShadow: '0 18px 40px rgba(15,23,42,.18)', offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px)`, width: `${to.width}px`, boxShadow: '0 4px 12px rgba(15,23,42,.08)' },
    ],
    { duration, easing: EASING },
  )
  const done = () => {
    ghost.remove()
    el.style.visibility = ''
  }
  anim.onfinish = done
  anim.oncancel = done
}

export function useFlip(rootRef, { duration = 420 } = {}) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)')
  let before = new Map()

  onBeforeUpdate(() => {
    before = new Map()
    const root = rootRef.value
    if (!root || reduce?.matches) return
    for (const el of root.querySelectorAll('[data-flip-id]')) {
      before.set(el.dataset.flipId, el.getBoundingClientRect())
    }
  })

  onUpdated(() => {
    const root = rootRef.value
    if (!root || !before.size) return
    for (const el of root.querySelectorAll('[data-flip-id]')) {
      const from = before.get(el.dataset.flipId)
      if (!from) continue
      const to = el.getBoundingClientRect()
      const dx = from.left - to.left
      const dy = from.top - to.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
      if (Math.abs(dx) > 8) {
        fly(el, from, to, duration + 80)
      } else {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration,
          easing: EASING,
        })
      }
    }
    before = new Map()
  })
}
