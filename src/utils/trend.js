// Oy dinamikasi: shu oyning 1-sanasidan bugungacha va o'tgan oyning xuddi shu davri (UiStat :trend uchun)
export function monthTrend(list, dateOf, now = new Date()) {
  const day = now.getDate()
  const curFrom = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const curTo = new Date(now.getFullYear(), now.getMonth(), day + 1).getTime()
  const prevLast = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const prevTo = new Date(now.getFullYear(), now.getMonth() - 1, Math.min(day, prevLast) + 1).getTime()
  let current = 0
  let previous = 0
  for (const item of list) {
    const raw = dateOf(item)
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (t >= curFrom && t < curTo) current++
    else if (t >= prevFrom && t < prevTo) previous++
  }
  return { current, previous }
}
