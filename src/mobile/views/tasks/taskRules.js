// Vazifalar qoidalari — saytdagi TaskBoard bilan bir xil

export const STAGES = ['todo', 'in_progress', 'done']
export const nextStatus = (status) => STAGES[STAGES.indexOf(status) + 1] || null

export const statusLabelKey = (status) =>
  ({ todo: 'statusTodo', in_progress: 'statusInProgress', done: 'statusDone' })[status] ||
  'statusTodo'

export const priorityLabelKey = (p) =>
  ({ high: 'priorityHigh', medium: 'priorityMedium', low: 'priorityLow' })[p] || 'priorityMedium'

export const priorityTone = (p) => ({ high: 'is-bad', medium: 'is-warn', low: '' })[p] || ''

export function isOverdue(task) {
  if (!task.deadline || task.status === 'done') return false
  const end = new Date(task.deadline)
  end.setHours(23, 59, 59, 999)
  return end < new Date()
}

export function isDueToday(task) {
  if (!task.deadline || task.status === 'done') return false
  const d = new Date(task.deadline)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

/** Tasdiq kutayotganlar tepada, keyin muhimlik, keyin muddat */
export function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (!!a.pending_status !== !!b.pending_status) return a.pending_status ? -1 : 1
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (p) return p
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

export const personName = (u) => (u ? `${u.firstname || ''} ${u.lastname || ''}`.trim() : '')
