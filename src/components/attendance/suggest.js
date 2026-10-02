// Davomat holatini avtomatik taklif qilish: obyekt tashriflari + kamera (Hikvision terminallari).
// Bitta xodim kalendari ham, "Oyni hamma uchun tasdiqlash" ham shu qoidalardan foydalanadi.

const pad = (n) => String(n).padStart(2, '0')
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Kelgan → ketgan oralig'i soatda (0.5 ga yaxlitlangan)
export const cameraHours = (cam) => {
  if (!cam?.check_in || !cam?.check_out) return null
  const diff = toMinutes(cam.check_out) - toMinutes(cam.check_in)
  return diff > 0 ? Math.round((diff / 60) * 2) / 2 : null
}

export const isPersonal = (trip) => (trip.whereto || '').trim().toLowerCase() === 'shaxsiy'
export const isOffStatus = (status) => status === 'absent' || status === 'dayoff'

// come-and-goes/user/:id javobidagi konteynerlardan obyekt tashriflari ro'yxati
export const flattenTrips = (containers) => {
  const trips = []
  for (const c of Array.isArray(containers) ? containers : []) {
    for (const ins of c.comeAndGoInsides || c.comeandgoinsides || []) trips.push(ins)
  }
  return trips
}

export const groupTripsByDate = (trips) => {
  const map = {}
  for (const trip of trips) {
    if (!trip.when_gone) continue
    ;(map[toDateStr(new Date(trip.when_gone))] ||= []).push(trip)
  }
  return map
}

// Kamera o'rnatilgandan keyin ishga kelgan xodim: birinchi qaydidan oldingi kunlar uchun taklif yo'q
export const hiredFrom = (row, cameraEmployees) => {
  const cameraStart = cameraEmployees
    .map((e) => e.first_seen)
    .filter(Boolean)
    .sort()[0]
  return row?.first_seen && row.first_seen > cameraStart ? row.first_seen : null
}

/**
 * Bir kun uchun taklif qilinadigan holat (yoki null — taklif yo'q).
 * ctx.trips      — shu kungi obyekt tashriflari
 * ctx.cam        — shu kungi kamera qaydi { check_in, check_out } yoki null
 * ctx.hasCamera  — xodim kameraga bog'langan va shu oyda qaydi bor
 * ctx.officeOpen — ofis ochiq bo'lgan kunlar (Set); bo'sh bo'lsa bayram aniqlanmaydi
 * ctx.hiredFrom  — shu sanadan oldin xodim hali ishlamagan
 */
export function suggestStatus(dateStr, ctx) {
  const { today, trips = [], cam, hasCamera, officeOpen, hiredFrom: from } = ctx
  if (dateStr > today) return null // kelajak
  if (from && dateStr < from) return null // hali ishlamagan
  const d = new Date(dateStr + 'T00:00:00')
  const weekend = d.getDay() === 0 || d.getDay() === 6
  if (trips.length) {
    const firstTrip = new Date(Math.min(...trips.map((tr) => new Date(tr.when_gone).getTime())))
    const tripMinutes = firstTrip.getHours() * 60 + firstTrip.getMinutes()
    // Kamera ofisga kirganini ko'rsatsa — ofisdan keyin obyektga
    if (cam?.check_in && toMinutes(cam.check_in) < tripMinutes && !trips.every(isPersonal)) {
      return 'office_then_object'
    }
    if (firstTrip.getHours() < 10) {
      return trips.every(isPersonal) ? 'absent' : 'direct_object'
    }
    return 'office_then_object'
  }
  if (weekend) return cam ? 'office' : 'dayoff'
  // Ofis yopiq bo'lgan o'tgan ish kuni (bayram): kelgan bo'lsa ishlagan, aks holda dam olish
  if (officeOpen?.size && dateStr < today && !officeOpen.has(dateStr))
    return cam ? 'office' : 'dayoff'
  if (hasCamera && !cam && dateStr < today) return 'absent'
  return 'office'
}

// Tasdiqlanadigan kun yozuvi: holat + kamera vaqtlari + soat (kamera bo'lmasa 8)
export const confirmRecord = ({ userId, date, status, cam, createdBy }) => ({
  user_id: userId,
  date,
  status,
  work_hours: isOffStatus(status) ? 0 : (cameraHours(cam) ?? 8),
  check_in: cam?.check_in || null,
  check_out: cam?.check_out || null,
  note: null,
  created_by: createdBy,
})
