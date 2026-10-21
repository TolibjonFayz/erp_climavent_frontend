import { computed, reactive } from 'vue'

// Bo'lim yo'riqnomasi (tour): ekranning kerakli joyini yoritib, qisqa izoh beradi.
// Har bo'lim o'z qadamlarini beradi; qadamning `onEnter` i kerakli tab yoki kartani
// ochib qo'yadi (orqaga qaytilganda ham to'g'ri holat bo'lishi uchun har qadam o'z
// holatini o'zi o'rnatadi). Birinchi kirishda o'zi ochiladi, keyin — tugma orqali.

const STORAGE_PREFIX = 'erp-onboarding:v2'
const tours = new Map()

const storageKey = (tourId) => `${STORAGE_PREFIX}:${localStorage.getItem('userid') || 'anon'}:${tourId}`

function wasSeen(tourId) {
  try {
    return localStorage.getItem(storageKey(tourId)) === 'seen'
  } catch {
    return false
  }
}

function createTour(tourId) {
  const state = reactive({
    steps: [],
    active: false,
    index: 0,
    seen: wasSeen(tourId),
  })

  const markSeen = () => {
    state.seen = true
    try {
      localStorage.setItem(storageKey(tourId), 'seen')
    } catch {
      /* private rejim — keyingi safar yana o'zi ochiladi, xolos */
    }
  }

  const current = computed(() => (state.active ? state.steps[state.index] : null))
  const isFirst = computed(() => state.index === 0)
  const isLast = computed(() => state.index === state.steps.length - 1)

  let onClose = null

  function goTo(i) {
    state.index = Math.min(Math.max(0, i), state.steps.length - 1)
    state.steps[state.index].onEnter?.()
  }

  function start() {
    if (!state.steps.length) return
    state.active = true
    goTo(0)
  }

  function next() {
    if (isLast.value) return stop()
    goTo(state.index + 1)
  }

  function back() {
    if (!isFirst.value) goTo(state.index - 1)
  }

  function stop() {
    state.active = false
    markSeen()
    onClose?.()
  }

  // steps — qadamlar; close — yo'riqnoma yopilganda (masalan, ochilgan kartani yopish)
  function setSteps(steps, close) {
    state.steps = steps
    onClose = close || null
  }

  return { state, current, isFirst, isLast, start, next, back, stop, setSteps }
}

export function useOnboarding(tourId) {
  // Boshqa xodim shu tab'da kirsa, "ko'rgan" belgisi alohida bo'lsin
  const key = `${localStorage.getItem('userid') || 'anon'}:${tourId}`
  if (!tours.has(key)) tours.set(key, createTour(tourId))
  return tours.get(key)
}
