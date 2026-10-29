// Oylik davomatni chiroyli Excel faylga yuklab olish (exceljs, kerak bo'lganda yuklanadi).
// Ikki varaq: "Oylik jadval" (xodim × kun, rangli) va "Kelgan-ketgan" (kunma-kun ro'yxat, filtr bilan).
import attendanceApi from '@/api/attendance'
import checkInOutApi from '@/api/checkInOut'
import { useAttendanceStore } from '@/stores/attendance'
import {
  cameraHours,
  flattenTrips,
  groupTripsByDate,
  hiredFrom,
  suggestStatus,
  toDateStr,
} from './suggest'

const asArray = (res) => (Array.isArray(res) ? res : res?.data || [])
const WORKED = ['direct_object', 'office_then_object', 'office']
const WD_KEYS = ['wdSun', 'wdMon', 'wdTue', 'wdWed', 'wdThu', 'wdFri', 'wdSat']

// Jadvaldagi qisqa belgi (rangi bilan birga o'qiladi; izohi varaq tagida)
const CODES = {
  direct_object: 'Ob',
  office_then_object: 'Of→Ob',
  office: 'Of',
  absent: '✕',
  dayoff: '–',
}

const argb = (hex, alpha) => {
  // '#67c23a' + alpha (0..1) → oq fon bilan aralashtirilgan to'liq rang (exceljs argb)
  const h = hex.replace('#', '')
  const mix = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16)
    return Math.round(c * alpha + 255 * (1 - alpha))
      .toString(16)
      .padStart(2, '0')
  })
  return `FF${mix.join('').toUpperCase()}`
}

// Admin: barcha xodimlarning shu oydagi ma'lumotini yig'adi
export async function loadAllEmployees({ month, employees }) {
  const attendanceStore = useAttendanceStore()
  const [existing, camera, officeDays] = await Promise.all([
    attendanceApi.getAllMonth(month),
    attendanceApi.getCameraAllMonth(month).catch(() => []),
    attendanceApi.getCameraOfficeDays(month).catch(() => []),
    attendanceStore.getCameraSetup(),
  ])
  const cameraEmployees = attendanceStore.cameraEmployees
  const people = employees.filter((u) => !u.is_blocked)
  const linked = people.filter((u) => cameraEmployees.some((e) => e.user_id === u.id))
  const tripsByUser = {}
  await Promise.all(
    linked.map((u) =>
      checkInOutApi
        .getByUser(u.id)
        .then((res) => {
          tripsByUser[u.id] = groupTripsByDate(flattenTrips(asArray(res)))
        })
        .catch(() => {}),
    ),
  )
  return {
    people: people.map((u) => ({
      id: u.id,
      name: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
      hasCamera: (camera || []).some((r) => r.user_id === u.id),
      hiredFrom: hiredFrom(
        cameraEmployees.find((e) => e.user_id === u.id),
        cameraEmployees,
      ),
    })),
    confirmed: asArray(existing),
    camera: camera || [],
    officeOpen: new Set(officeDays || []),
    tripsByUser,
  }
}

// Bitta oyni kun-kun hisoblaydi: { person, days: [{date, status, confirmed, hours, in, out, trips, note}] }
function buildRows({ month, data, today }) {
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const confirmedMap = {}
  for (const r of data.confirmed) confirmedMap[`${r.user_id}|${r.date}`] = r
  const camMap = {}
  for (const r of data.camera) camMap[`${r.user_id}|${r.date}`] = r

  return data.people.map((p) => {
    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${month}-${String(d).padStart(2, '0')}`
      const rec = confirmedMap[`${p.id}|${date}`]
      const cam = camMap[`${p.id}|${date}`]
      const trips = data.tripsByUser[p.id]?.[date] || []
      const status = rec
        ? rec.status
        : suggestStatus(date, {
            today,
            trips,
            cam,
            hasCamera: p.hasCamera,
            officeOpen: data.officeOpen,
            hiredFrom: p.hiredFrom,
          })
      let hours = null
      if (status && date <= today) {
        if (rec) hours = rec.work_hours ?? 0
        else if (WORKED.includes(status)) hours = cameraHours(cam) ?? 8
        else hours = 0
      }
      days.push({
        date,
        status: date > today ? null : status,
        confirmed: !!rec,
        hours,
        in: cam?.check_in || rec?.check_in || '',
        out: cam ? cam.check_out || '' : rec?.check_out || '',
        trips: trips.length,
        note: rec?.note || '',
      })
    }
    const worked = days.filter((x) => WORKED.includes(x.status)).length
    const absent = days.filter((x) => x.status === 'absent').length
    const hours = Math.round(days.reduce((s, x) => s + (x.hours || 0), 0) * 10) / 10
    return { person: p, days, worked, absent, hours }
  })
}

export async function exportAttendanceXlsx({ month, monthLabel, data, statusList, t, who }) {
  const ExcelJS = (await import('exceljs')).default
  const today = toDateStr(new Date())
  const rows = buildRows({ month, data, today }).filter((r) => r.days.some((d) => d.status))
  rows.sort((a, b) => a.person.name.localeCompare(b.person.name))

  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const colorOf = Object.fromEntries(statusList.map((s) => [s.key, s.color]))
  const wdOf = (date) => t(WD_KEYS[new Date(date + 'T00:00:00').getDay()])
  const isWeekend = (date) => [0, 6].includes(new Date(date + 'T00:00:00').getDay())

  const font = { name: 'Calibri', size: 11, color: { argb: 'FF303133' } }
  const thin = { style: 'thin', color: { argb: 'FFDCDFE6' } }
  const border = { top: thin, left: thin, bottom: thin, right: thin }
  const center = { vertical: 'middle', horizontal: 'center' }
  const NAVY = 'FF1F3A5F'
  const headFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  const headFont = { ...font, bold: true, color: { argb: 'FFFFFFFF' } }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Climavent ERP'
  wb.created = new Date()

  // ───────── 1-varaq: oylik jadval ─────────
  const ws = wb.addWorksheet(t('attXlsSheetMatrix'), {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  const lastCol = 2 + daysInMonth + 3
  ws.getColumn(1).width = 5
  ws.getColumn(2).width = 28
  for (let d = 1; d <= daysInMonth; d++) ws.getColumn(2 + d).width = 5.6
  ;[daysInMonth + 3, daysInMonth + 4, daysInMonth + 5].forEach((c) => (ws.getColumn(c).width = 12))

  ws.mergeCells(1, 1, 1, lastCol)
  const title = ws.getCell(1, 1)
  title.value = `${t('attXlsTitle')} — ${monthLabel}`
  title.font = { ...font, size: 18, bold: true, color: { argb: NAVY } }
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 32

  ws.mergeCells(2, 1, 2, lastCol)
  const sub = ws.getCell(2, 1)
  sub.value = `${t('attXlsGenerated')}: ${new Date().toLocaleString('ru-RU')}${who ? ` · ${who}` : ''}`
  sub.font = { ...font, size: 10, color: { argb: 'FF909399' } }
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  // Sarlavha: 3-qator — kun raqami, 4-qator — hafta kuni
  const headLabels = [
    ['№', ''],
    [t('colEmployee'), ''],
  ]
  headLabels.forEach(([top], i) => {
    ws.mergeCells(3, i + 1, 4, i + 1)
    ws.getCell(3, i + 1).value = top
  })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`
    ws.getCell(3, 2 + d).value = d
    ws.getCell(4, 2 + d).value = wdOf(date)
  }
  const sumHeads = [t('attXlsWorked'), t('attXlsAbsent'), t('attXlsHours')]
  sumHeads.forEach((label, i) => {
    const c = daysInMonth + 3 + i
    ws.mergeCells(3, c, 4, c)
    ws.getCell(3, c).value = label
  })
  for (let r = 3; r <= 4; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c)
      cell.font = r === 4 ? { ...headFont, size: 9 } : headFont
      cell.fill = headFill
      cell.alignment = { ...center, wrapText: true }
      cell.border = border
      const date =
        c > 2 && c <= 2 + daysInMonth ? `${month}-${String(c - 2).padStart(2, '0')}` : null
      if (date && isWeekend(date)) cell.fill = { ...headFill, fgColor: { argb: 'FF4A6A94' } }
    }
  }
  ws.getRow(3).height = 22
  ws.getRow(4).height = 16

  // Xodimlar
  rows.forEach((row, i) => {
    const r = 5 + i
    const zebra = i % 2 ? 'FFF7F9FC' : 'FFFFFFFF'
    ws.getRow(r).height = 22
    const idx = ws.getCell(r, 1)
    idx.value = i + 1
    idx.alignment = center
    const nm = ws.getCell(r, 2)
    nm.value = row.person.name
    nm.font = { ...font, bold: true }
    nm.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    for (const c of [1, 2]) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } }
      ws.getCell(r, c).border = border
      if (c === 1) ws.getCell(r, c).font = { ...font, color: { argb: 'FF909399' } }
    }
    row.days.forEach((day, di) => {
      const cell = ws.getCell(r, 3 + di)
      cell.border = border
      cell.alignment = center
      if (!day.status) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } }
        return
      }
      const base = colorOf[day.status] || '#c0c4cc'
      cell.value = CODES[day.status]
      // Tasdiqlangan kun to'q, taklif (tasdiqlanmagan) — och rangda
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: argb(base, day.confirmed ? 0.55 : 0.2) },
      }
      cell.font = {
        ...font,
        size: day.status === 'office_then_object' ? 8 : 10,
        bold: day.confirmed,
        italic: !day.confirmed,
        color: { argb: day.confirmed ? 'FF1F2D3D' : 'FF606266' },
      }
      const tip = [
        day.in && `${day.in} → ${day.out || '…'}`,
        day.hours != null && `${day.hours} ${t('hours')}`,
      ]
        .filter(Boolean)
        .join(' · ')
      if (tip) cell.note = { texts: [{ text: tip }], margins: { insetmode: 'auto' } }
    })
    const sums = [row.worked, row.absent, row.hours]
    sums.forEach((v, k) => {
      const cell = ws.getCell(r, daysInMonth + 3 + k)
      cell.value = v
      cell.alignment = center
      cell.border = border
      cell.font = { ...font, bold: true, color: { argb: k === 1 && v ? 'FFC0392B' : 'FF1F2D3D' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF3FA' } }
      if (k === 2) cell.numFmt = '0.0'
    })
  })

  // Pastki qator: kunlik jami ishlaganlar soni
  const totalRow = 5 + rows.length
  ws.mergeCells(totalRow, 1, totalRow, 2)
  ws.getCell(totalRow, 1).value = t('attXlsPresent')
  for (let c = 1; c <= lastCol; c++) {
    const cell = ws.getCell(totalRow, c)
    cell.fill = headFill
    cell.font = headFont
    cell.alignment = c === 1 ? { vertical: 'middle', horizontal: 'left', indent: 1 } : center
    cell.border = border
  }
  for (let d = 0; d < daysInMonth; d++) {
    const n = rows.filter((r) => WORKED.includes(r.days[d].status)).length
    ws.getCell(totalRow, 3 + d).value = n || ''
  }
  ;[0, 1, 2].forEach((k) => {
    const col = daysInMonth + 3 + k
    const sum = rows.reduce((s, r) => s + [r.worked, r.absent, r.hours][k], 0)
    ws.getCell(totalRow, col).value = Math.round(sum * 10) / 10
  })
  ws.getRow(totalRow).height = 24

  // Belgilar izohi
  const legendRow = totalRow + 2
  ws.getCell(legendRow, 1).value = t('attXlsLegend')
  ws.getCell(legendRow, 1).font = { ...font, bold: true }
  statusList.forEach((s, i) => {
    const r = legendRow + 1 + i
    const code = ws.getCell(r, 2)
    ws.getCell(r, 1).value = ''
    code.value = `${CODES[s.key]}   ${t(s.labelKey)}`
    code.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(s.color, 0.55) } }
    code.font = { ...font, size: 10 }
    code.border = border
    code.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  })
  const noteRow = legendRow + 1 + statusList.length
  ws.getCell(noteRow, 2).value = `${t('attXlsConfirmed')} — ${t('attXlsBold')}`
  ws.getCell(noteRow + 1, 2).value = `${t('attXlsSuggested')} — ${t('attXlsItalic')}`
  ;[noteRow, noteRow + 1].forEach((r) => {
    ws.getCell(r, 2).font = { ...font, size: 10, color: { argb: 'FF606266' } }
    ws.getCell(r, 2).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  })
  ws.getCell(noteRow, 2).font = { ...font, size: 10, bold: true }
  ws.getCell(noteRow + 1, 2).font = { ...font, size: 10, italic: true, color: { argb: 'FF606266' } }

  // ───────── 2-varaq: kunma-kun (kelgan / ketgan) ─────────
  const wd = wb.addWorksheet(t('attXlsSheetDetail'), {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  const cols = [
    [t('colEmployee'), 28],
    [t('attXlsDate'), 13],
    [t('attXlsWeekday'), 11],
    [t('attXlsStatus'), 26],
    [t('attXlsIn'), 10],
    [t('attXlsOut'), 10],
    [t('attXlsHours'), 11],
    [t('attXlsTrips'), 14],
    [t('attXlsConfirmedCol'), 14],
    [t('attendanceNote'), 34],
  ]
  wd.columns = cols.map(([header, width]) => ({ header, width }))
  const hr = wd.getRow(1)
  hr.height = 26
  hr.eachCell((cell) => {
    cell.font = headFont
    cell.fill = headFill
    cell.alignment = { ...center, wrapText: true }
    cell.border = border
  })
  const statusLabel = Object.fromEntries(statusList.map((s) => [s.key, t(s.labelKey)]))
  let n = 0
  for (const row of rows) {
    for (const day of row.days) {
      if (!day.status) continue
      const r = wd.addRow([
        row.person.name,
        new Date(Date.UTC(...day.date.split('-').map((v, i) => (i === 1 ? v - 1 : +v)))),
        wdOf(day.date),
        statusLabel[day.status],
        day.in || '',
        day.out || '',
        day.hours,
        day.trips || '',
        day.confirmed ? '✓' : '',
        day.note,
      ])
      const zebra = n++ % 2 ? 'FFF7F9FC' : 'FFFFFFFF'
      r.height = 20
      r.eachCell({ includeEmpty: true }, (cell, c) => {
        cell.font = font
        cell.border = border
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 1 || c === 10 ? 'left' : 'center',
          indent: c === 1 || c === 10 ? 1 : 0,
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } }
      })
      r.getCell(2).numFmt = 'dd.mm.yyyy'
      r.getCell(7).numFmt = '0.0'
      const base = colorOf[day.status] || '#c0c4cc'
      r.getCell(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: argb(base, day.confirmed ? 0.55 : 0.2) },
      }
      if (isWeekend(day.date)) r.getCell(3).font = { ...font, color: { argb: 'FFC0392B' } }
    }
  }
  wd.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Davomat_${month}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return rows.length
}
