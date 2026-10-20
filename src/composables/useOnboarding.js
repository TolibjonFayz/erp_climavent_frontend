import { computed, reactive } from 'vue'

// Gamifikatsiyalangan yo'riqnoma (tour) holati.
// Har bo'lim o'z tour'ini e'lon qiladi: qadamlar ro'yxati (ma'lumot qadami yoki
// "vazifa" qadami — foydalanuvchi haqiqiy amalni bajarishi kerak). Komponentlar
// `signal(name)` chaqiradi; vazifa qaysi tartibda bajarilsa ham hisoblanadi.
// Progress foydalanuvchi bo'yicha localStorage'da saqlanadi.

const STORAGE_PREFIX = 'erp-onboarding:v1'

// XP darajalari (umumiy — barcha bo'limlar uchun bir xil)
export const LEVELS = [
  { min: 0, key: 'onbLevelNew', icon: '🌱' },
  { min: 50, key: 'onbLevelApprentice', icon: '🧭' },
  { min: 150, key: 'onbLevelPro', icon: '🏅' },
]

const tours = new Map()

const storageKey = (tourId) => `${STORAGE_PREFIX}:${localStorage.getItem('userid') || 'anon'}:${tourId}`

function load(tourId) {
  try {
    const raw = localStorage.getItem(storageKey(tourId))
    const parsed = raw ? JSON.parse(raw) : null
    return {
      done: Array.isArray(parsed?.done) ? parsed.done : [],
      finishedAt: parsed?.finishedAt || null,
      dismissedAt: parsed?.dismissedAt || null,
    }
  } catch {
    return { done: [], finishedAt: null, dismissedAt: null }
  }
}

function createTour(tourId) {
  const saved = load(tourId)
  const state = reactive({
    id: tourId,
    steps: [],
    active: false,
    index: 0,
    done: saved.done,
    finishedAt: saved.finishedAt,
    dismissedAt: saved.dismissedAt,
    celebrate: false,
    lastGain: null, // { xp, at } — "+20 XP" animatsiyasi uchun
  })

  const persist = () => {
    try {
      localStorage.setItem(
        storageKey(tourId),
        JSON.stringify({ done: state.done, finishedAt: state.finishedAt, dismissedAt: state.dismissedAt }),
      )
    } catch {
      /* private rejim — progress saqlanmaydi, yo'riqnoma baribir ishlaydi */
    }
  }

  const totalXp = computed(() => state.steps.reduce((s, st) => s + (st.xp || 0), 0))
  const xp = computed(() =>
    state.steps.filter((st) => state.done.includes(st.id)).reduce((s, st) => s + (st.xp || 0), 0),
  )
  const level = computed(() => [...LEVELS].reverse().find((l) => xp.value >= l.min) || LEVELS[0])
  const current = computed(() => (state.active ? state.steps[state.index] : null))
  const missions = computed(() => state.steps.filter((st) => st.waitFor))
  const progress = computed(() => (totalXp.value ? Math.round((xp.value / totalXp.value) * 100) : 0))

  function markDone(step) {
    if (!step || state.done.includes(step.id)) return
    state.done.push(step.id)
    if (step.xp) state.lastGain = { xp: step.xp, at: Date.now() }
    persist()
  }

  function goTo(i) {
    // Allaqachon bajarilgan vazifa qadamlarini o'tkazib yuboramiz
    let next = i
    while (next < state.steps.length && state.steps[next].waitFor && state.done.includes(state.steps[next].id)) {
      next++
    }
    if (next >= state.steps.length) return finish()
    state.index = next
    state.steps[next].onEnter?.()
  }

  function start(fromBeginning = false) {
    if (!state.steps.length) return
    state.active = true
    state.celebrate = false
    goTo(fromBeginning ? 0 : Math.max(0, state.steps.findIndex((st) => !state.done.includes(st.id))))
  }

  function next() {
    const step = current.value
    if (step && !step.waitFor) markDone(step)
    goTo(state.index + 1)
  }

  function skip() {
    goTo(state.index + 1)
  }

  function stop() {
    state.active = false
    if (!state.finishedAt) {
      state.dismissedAt = new Date().toISOString()
      persist()
    }
  }

  function finish() {
    state.active = false
    state.finishedAt = state.finishedAt || new Date().toISOString()
    state.celebrate = true
    persist()
  }

  function reset() {
    state.done = []
    state.finishedAt = null
    state.dismissedAt = null
    persist()
    start(true)
  }

  // Komponentlardan keladigan hodisa: "sk:search", "sk:open-item" ...
  function signal(name) {
    const step = state.steps.find((st) => st.waitFor === name)
    if (!step || state.done.includes(step.id)) return
    markDone(step)
    if (state.active && current.value?.id === step.id) goTo(state.index + 1)
  }

  function setSteps(steps) {
    state.steps = steps
  }

  // Birinchi kirish: hech qachon yopmagan/tugatmagan bo'lsa avtomatik boshlanadi
  const isFirstVisit = computed(() => !state.finishedAt && !state.dismissedAt && !state.done.length)

  return {
    state,
    xp,
    totalXp,
    level,
    current,
    missions,
    progress,
    isFirstVisit,
    start,
    next,
    skip,
    stop,
    reset,
    signal,
    setSteps,
  }
}

export function useOnboarding(tourId) {
  // Boshqa xodim shu tab'da kirsa, uning progressi alohida bo'lsin
  const key = `${localStorage.getItem('userid') || 'anon'}:${tourId}`
  if (!tours.has(key)) tours.set(key, createTour(tourId))
  return tours.get(key)
}
