// Raqiblar bo'limi uchun umumiy ro'yxatlar (backend ENCOUNTER_OUTCOMES/REASONS bilan bir xil)
export const OUTCOMES = [
  { value: 'won', labelKey: 'cmpOutcome_won', tag: 'success' },
  { value: 'lost', labelKey: 'cmpOutcome_lost', tag: 'danger' },
  { value: 'pending', labelKey: 'cmpOutcome_pending', tag: 'warning' },
]

export const REASONS = ['price', 'deadline', 'quality', 'relationship', 'other']

export const outcomeOf = (value) => OUTCOMES.find((o) => o.value === value) || OUTCOMES[2]

// Yakunlangan bitimlar ichida yutish ulushi (jarayondagilar hisobga olinmaydi)
export function winRate({ won = 0, lost = 0 } = {}) {
  return won + lost ? Math.round((won / (won + lost)) * 100) : null
}
