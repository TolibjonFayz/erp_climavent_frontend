// Didox'dan yuklab olingan PDF'larni o'qiydi: schyot-faktura («Счет-фактура № … от …»)
// va ishonchnoma («Доверенность …»). Natija — yuklash oynasidagi maydonlarni
// avtomatik to'ldirish va otgruzka kartasi bilan solishtirish uchun.
// pdf.js har bir matn bo'lagini koordinatasi bilan beradi (y — pastdan yuqoriga).

import { extractPdfPages, loadPdfjs, parseDogovorPages } from './dogovorPdfImport'

const SAME_LINE = 3 // pt
const NAME_GAP = 11 // pt — nom qatorlari orasidagi bo'shliq bundan katta bo'lsa — keyingi tovar
export const CLIMAVENT_INN = '310929808'

const clean = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()

// "6 043 000.00" / "1.000000" / "1 234,5" -> son
export const num = (s) => {
  const raw = String(s ?? '')
    .replace(/[\s ]/g, '')
    .replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null
  return Number(raw)
}
// 03.11.2026 -> 2026-11-03
const isoDate = (d, m, y) => `${y}-${m}-${d}`
const DATE_RE = /(\d{2})\.(\d{2})\.(\d{4})/
const AMOUNT_RE = /\d{1,3}(?:[  ]\d{3})*(?:[.,]\d+)?%?/g

const toLines = (items) => {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines = []
  for (const it of sorted) {
    const line = lines.find((l) => Math.abs(l.y - it.y) <= SAME_LINE)
    if (line) line.items.push(it)
    else lines.push({ y: it.y, items: [it] })
  }
  for (const l of lines) {
    l.items.sort((a, b) => a.x - b.x)
    l.text = clean(l.items.map((i) => i.str).join(' '))
  }
  return lines.sort((a, b) => b.y - a.y)
}

const docIdOf = (text) => /ID документа \(Didox\.uz\):\s*([0-9a-f]{16,64})/i.exec(text)?.[1]?.toLowerCase() || null

// ─── Schyot-faktura ───

// "Поставщик:" / "Покупатель:" ustunlari: nom (yorliq qatorida) va INN
const parseParty = (items, labelRe) => {
  const label = items.find((i) => labelRe.test(clean(i.str)))
  if (!label) return {}
  const right = (row, minX) =>
    clean(
      items
        .filter((i) => Math.abs(i.y - row.y) <= SAME_LINE && i.x > minX && i.x < label.x + 260)
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(' '),
    )
  const name = right(label, label.x + 20)
  // "Идентификационный номер" — shu ustunda, yorliqdan pastda; qiymat o'sha qatorda o'ngda
  const innLabel = items
    .filter((i) => /^Идентификационный номер/.test(clean(i.str)) && Math.abs(i.x - label.x) < 10 && i.y < label.y)
    .sort((a, b) => b.y - a.y)[0]
  const inn = innLabel ? (/\b(\d{9}|\d{14})\b/.exec(right(innLabel, label.x + 60))?.[1] ?? null) : null
  return { name, inn }
}

// Mahsulotlar jadvali: har qator chap chetdagi tartib raqamidan boshlanadi;
// raqamli ustunlar tartibi: miqdor, narx, yetkazish qiymati, QQS stavkasi, QQS summasi, QQS bilan jami.
const parseInvoiceTable = (pages) => {
  const rows = []
  let total = null
  for (const page of pages) {
    const items = page.items
    const qtyHead = items.find((i) => clean(i.str) === 'Количество')
    if (!qtyHead) continue
    const nameHead = items.find((i) => /^Наименование/.test(clean(i.str)) && Math.abs(i.y - qtyHead.y) < 12)
    // Ustun raqamlari qatori (1 2 3 …) sarlavha ostida — jadval undan pastda boshlanadi
    const colNums = items.filter((i) => /^\d{1,2}$/.test(clean(i.str)) && i.y < qtyHead.y && qtyHead.y - i.y < 30)
    const tableTop = colNums.length >= 5 ? Math.min(...colNums.map((i) => i.y)) - 2 : qtyHead.y - 12
    const totalItem = items.find((i) => /^Итого$/.test(clean(i.str)) && i.y < tableTop)
    const bottom = totalItem ? totalItem.y + 2 : -Infinity
    const inTable = items.filter((i) => i.y < tableTop && i.y > bottom)
    const lines = toLines(inTable)

    // Qator boshlari: chap chetdagi raqam + shu qatorda miqdor (x ≥ "Количество" ustuni)
    const anchors = []
    for (const l of lines) {
      const first = l.items[0]
      if (!(first.x < (nameHead?.x ?? 40) - 3 && /^\d{1,3}$/.test(clean(first.str)))) continue
      const numsText = l.items
        .filter((i) => i.x >= qtyHead.x - 15)
        .map((i) => i.str)
        .join(' ')
      const tokens = numsText.match(AMOUNT_RE) || []
      const values = tokens.filter((t) => !t.endsWith('%')).map(num)
      if (values.length < 3) continue
      const rate = tokens.find((t) => t.endsWith('%'))
      const unit = clean(
        l.items
          .filter((i) => i.x < qtyHead.x - 15 && i.x > (nameHead?.x ?? 0) + 60 && !/^\d{10,}/.test(i.str) && !/^\d+$/.test(clean(i.str)))
          .map((i) => i.str)
          .slice(-1)
          .join(''),
      )
      anchors.push({
        no: Number(clean(first.str)),
        y: l.y,
        qty: values[0],
        price: values[1],
        cost: values[2],
        vat_rate: rate ? num(rate.slice(0, -1)) : null,
        vat: values.length >= 5 ? values[values.length - 2] : null,
        total: values[values.length - 1],
        unit: unit || null,
        nameParts: [],
      })
    }

    // Nom ustuni: chapga tekislangan, x — eng ko'p uchraydigan qiymat
    if (nameHead) {
      const xs = {}
      for (const i of inTable) if (i.x > nameHead.x - 10 && i.x < nameHead.x + 30) xs[Math.round(i.x)] = (xs[Math.round(i.x)] || 0) + 1
      const nameX = Number(Object.entries(xs).sort((a, b) => b[1] - a[1])[0]?.[0])
      const nameItems = inTable.filter((i) => Math.abs(i.x - nameX) < 2).sort((a, b) => b.y - a.y)
      // Bo'shliq bo'yicha bloklarga ajratamiz
      const blocks = []
      for (const it of nameItems) {
        const last = blocks[blocks.length - 1]
        if (last && last.minY - it.y <= NAME_GAP) {
          last.parts.push(it.str)
          last.minY = it.y
        } else blocks.push({ maxY: it.y, minY: it.y, parts: [it.str] })
      }
      for (const b of blocks) {
        const own = anchors.find((a) => a.y <= b.maxY + 4 && a.y >= b.minY - 4)
        if (own) own.nameParts.push(...b.parts)
        else if (rows.length && !anchors.some((a) => a.y > b.maxY)) rows[rows.length - 1].nameParts.push(...b.parts)
      }
    }
    rows.push(...anchors)

    if (totalItem) {
      const tokens = (toLines(items.filter((i) => Math.abs(i.y - totalItem.y) <= SAME_LINE))[0]?.text || '').match(AMOUNT_RE) || []
      const values = tokens.filter((t) => !t.endsWith('%')).map(num)
      if (values.length) total = values[values.length - 1]
    }
  }
  return {
    items: rows.map(({ nameParts, y: _y, ...r }) => ({ ...r, name: clean(nameParts.join(' ').replace(/-\s+(?=[A-Za-z0-9])/g, '-')) })),
    total,
  }
}

const parseInvoice = (pages, text) => {
  const first = pages[0].items
  const out = { kind: 'invoice', doc_id: docIdOf(text) }
  const head = /Счет-фактура\s*№\s*(\S+)\s+от\s+(\d{2})\.(\d{2})\.(\d{4})/i.exec(text)
  if (head) {
    out.number = head[1]
    out.date = isoDate(head[2], head[3], head[4])
  }
  const contract = /к договору\s*№\s*(\S+)\s+от\s+(\d{2})\.(\d{2})\.(\d{4})/i.exec(text)
  if (contract) {
    out.contract_number = contract[1]
    out.contract_date = isoDate(contract[2], contract[3], contract[4])
  }
  const seller = parseParty(first, /^Поставщик:?$/)
  const buyer = parseParty(first, /^Покупатель:?$/)
  out.seller_name = seller.name || null
  out.seller_inn = seller.inn || null
  out.buyer_name = buyer.name || null
  out.buyer_inn = buyer.inn || null
  const { items, total } = parseInvoiceTable(pages)
  out.items = items
  out.total = total ?? (items.length ? round2(items.reduce((s, i) => s + (i.total || 0), 0)) : null)
  const vat = /в т\.\s*ч\.\s*НДС:\s*([\d\s.,]+)/i.exec(text)
  out.vat_total = vat ? num(vat[1].replace(/[.\s]+$/, '')) : null
  return out
}

// ─── Ishonchnoma (доверенность) ───
const parsePoa = (pages, text) => {
  const items = pages[0].items
  const lines = toLines(items)
  const valueOf = (re) => {
    const l = lines.find((x) => re.test(x.text))
    return l ? clean(l.text.replace(re, '')) : null
  }
  const out = { kind: 'poa', doc_id: docIdOf(text) }
  out.number = /Доверенность\s*№?\s*([^\s]+)/.exec(lines.find((l) => /^Доверенность\s*№?\s*\S+$/.test(l.text))?.text || '')?.[1] || null
  const issued = DATE_RE.exec(valueOf(/^.*Дата выдачи:\s*/) || '')
  if (issued) out.date = isoDate(issued[1], issued[2], issued[3])
  const until = DATE_RE.exec(valueOf(/^.*Доверенность действительна до:\s*/) || '')
  if (until) out.valid_until = isoDate(until[1], until[2], until[3])
  out.company = valueOf(/^.*Наименование предприятия:\s*/)
  // Korxona INN — "Доверенность выдана" dan oldingi birinchi ИНН/ПИНФЛ
  const innLine = lines.find((l) => /^ИНН\/ПИНФЛ:/.test(l.text))
  out.company_inn = /\d{9,14}/.exec(innLine?.text || '')?.[0] || null
  const person = lines.find((l) => /^Доверенность выдана:/.test(l.text))?.text || ''
  const pm = /ФИО:\s*(.+?)\s+ИНН\/ПИНФЛ:\s*(\d+)/.exec(person)
  out.person = pm ? pm[1] : clean(person.replace(/^Доверенность выдана:\s*(ФИО:)?/, '')) || null
  out.person_inn = pm ? pm[2] : null
  out.supplier = valueOf(/^.*На получение от:\s*/)
  const contract = /№\s*(\S+)\s+от\s+(\d{2})\.(\d{2})\.(\d{4})/.exec(valueOf(/^.*по договору:\s*/) || '')
  if (contract) {
    out.contract_number = contract[1]
    out.contract_date = isoDate(contract[2], contract[3], contract[4])
  }
  // Tovarlar ro'yxati: "Наименование товаров" ustuni va "Количество"
  const nameHead = items.find((i) => /^Наименование товаров/.test(clean(i.str)))
  const qtyHead = items.find((i) => /^Количество/.test(clean(i.str)) && nameHead && Math.abs(i.y - nameHead.y) < 5)
  const unitHead = items.find((i) => /^Единица/.test(clean(i.str)) && nameHead && Math.abs(i.y - nameHead.y) < 5)
  out.items = []
  if (nameHead && qtyHead) {
    const bottom = items.find((i) => /^Подпись получившего/.test(clean(i.str)))?.y ?? -Infinity
    const table = items.filter((i) => i.y < nameHead.y - 12 && i.y > bottom)
    const anchors = toLines(table).filter((l) => /^\d{1,3}$/.test(clean(l.items[0].str)) && l.items[0].x < nameHead.x - 100)
    const leftEdge = nameHead.x - 20
    const rightEdge = unitHead ? unitHead.x - 5 : qtyHead.x - 40
    const nameItems = table.filter((i) => i.x >= leftEdge && i.x < rightEdge)
    anchors.forEach((a, k) => {
      const upper = k ? (anchors[k - 1].y + a.y) / 2 : Infinity
      const lower = anchors[k + 1] ? (anchors[k + 1].y + a.y) / 2 : -Infinity
      const name = clean(
        nameItems
          .filter((i) => i.y < upper && i.y > lower)
          .sort((p, q) => q.y - p.y || p.x - q.x)
          .map((i) => i.str)
          .join(' ')
          .replace(/-\s+(?=[A-Za-z0-9])/g, '-'),
      )
      const qtyText = a.items.filter((i) => i.x >= qtyHead.x - 15).map((i) => i.str).join(' ')
      const unit = clean(a.items.filter((i) => unitHead && i.x >= unitHead.x - 15 && i.x < qtyHead.x - 15).map((i) => i.str).join(' '))
      out.items.push({ no: Number(clean(a.items[0].str)), name, unit: unit || null, qty: num(/[\d\s.,]+/.exec(qtyText)?.[0]?.trim()) })
    })
  }
  return out
}

// ─── Shartnoma ───
// Rekvizitlar mavjud o'quvchidan (shartnoma qo'shish oynasidagi PDF to'ldirish) olinadi
const parseContract = (pages, text) => {
  let d = {}
  try {
    d = parseDogovorPages(pages)
  } catch {
    d = {}
  }
  // Didox protokolidagi holat: imzolangan / tasdiqlangan
  const signed = /ПОДТВЕРЖД|ПОДПИСАН(?!ИЯ)|Imzolangan|Тасдиқланган/i.test(text)
  return {
    kind: 'contract',
    doc_id: docIdOf(text),
    number: d.dogovor_number != null ? String(d.dogovor_number) : null,
    date: d.dogovor_date || null,
    client_name: d.client_name || null,
    client_inn: d.client_inn || null,
    sum: d.dogovor_sum ?? null,
    signed,
    has_protocol: /ПРОТОКОЛ ПОДПИСАНИЯ/i.test(text),
  }
}

const round2 = (n) => Math.round(n * 100) / 100

// pages: [{ items: [{ str, x, y }] }] — pdf.js'dan mustaqil (sinash uchun)
export const parseDidoxPages = (rawPages) => {
  // Didox PDF'larida "й" ba'zan ikki belgi (и + ˘) bo'lib keladi — NFC'ga keltiramiz
  const pages = rawPages.map((p) => ({ items: p.items.map((i) => ({ ...i, str: String(i.str).normalize('NFC') })) }))
  const text = clean(pages.flatMap((p) => toLines(p.items).map((l) => l.text)).join('\n'))
  if (/Счет-фактура\s*№/i.test(text)) return parseInvoice(pages, text)
  if (/Доверенность действительна до/i.test(text) || /^Доверенность\s/m.test(text)) return parsePoa(pages, text)
  // Shartnoma (Didox orqali yuborilgan): imzolash protokoli yoki "ДОГОВОР" / "шартнома" sarlavhasi
  if (/ПРОТОКОЛ ПОДПИСАНИЯ|ДОГОВОР|шартнома/i.test(text)) return parseContract(pages, text)
  return { kind: 'unknown', doc_id: docIdOf(text) }
}

export const readDidoxPdf = async (file) => {
  const pdfjs = await loadPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const pages = await extractPdfPages(pdfjs, data)
  if (!pages.some((p) => p.items.length)) throw new Error('NO_TEXT')
  return parseDidoxPages(pages)
}

// ─── Kartaga solishtirish ───
// Natija: [{ level: 'ok' | 'warn' | 'bad', key: i18n kaliti, params }]

const normName = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'`‘’“”]/g, '')
    .replace(/\b(mchj|мчж|ооо|llc|qk|xk|ok|mas'uliyati cheklangan jamiyati)\b/g, '')
    .replace(/[^a-zа-я0-9ўқғҳ]+/g, ' ')
    .trim()
const compact = (s) => String(s || '').toLowerCase().replace(/[^a-zа-я0-9]/g, '')
// Model kodlari: raqam qatnashgan so'zlar (JVI-080HS, RH35C, JHYXE-VC01 …)
const codesOf = (s) =>
  (String(s || '').match(/[A-Za-zА-Яа-я0-9]+(?:[-/][A-Za-zА-Яа-я0-9]+)*/g) || [])
    .filter((w) => /\d/.test(w) && /[A-Za-zА-Яа-я]/.test(w) && w.replace(/[^A-Za-zА-Яа-я0-9]/g, '').length >= 4)
    .map(compact)
const words = (s) => new Set(normName(s).split(' ').filter((w) => w.length > 2))

export const nameScore = (a, b) => {
  const ca = codesOf(a)
  const cbText = compact(b)
  if (ca.length && ca.some((c) => cbText.includes(c))) return 1
  const cb = codesOf(b)
  const caText = compact(a)
  if (cb.length && cb.some((c) => caText.includes(c))) return 1
  const wa = words(a)
  const wb = words(b)
  if (!wa.size || !wb.size) return 0
  let common = 0
  for (const w of wa) if (wb.has(w)) common++
  return common / Math.min(wa.size, wb.size)
}

const sameContract = (a, b) => {
  if (!a || !b) return null
  const x = String(a).replace(/\s/g, '').toLowerCase()
  const y = String(b).replace(/\s/g, '').toLowerCase()
  return x === y || x.split('/')[0] === y.split('/')[0]
}
const sameCompany = (a, b) => {
  const x = normName(a)
  const y = normName(b)
  if (!x || !y) return null
  return x === y || x.includes(y) || y.includes(x)
}
const close = (a, b, tol = 1) => Math.abs((Number(a) || 0) - (Number(b) || 0)) <= tol

/** Schyot-fakturani kartadagi shartnoma, mijoz va mahsulotlar bilan solishtiradi */
export function checkInvoice(inv, order, { otherSum = 0 } = {}) {
  const out = []
  const push = (level, key, params = {}) => out.push({ level, key, params })
  if (!inv.number) push('bad', 'otChkNoNumber')
  if (!inv.date) push('warn', 'otChkNoDate')
  if (inv.seller_inn && inv.seller_inn !== CLIMAVENT_INN) push('warn', 'otChkSeller', { name: inv.seller_name || inv.seller_inn })

  // Mijoz: INN bo'lsa INN bo'yicha, bo'lmasa nom bo'yicha
  if (order.client_inn && inv.buyer_inn) {
    if (String(order.client_inn).replace(/\D/g, '') === inv.buyer_inn) push('ok', 'otChkBuyerOk', { name: inv.buyer_name || inv.buyer_inn })
    else push('bad', 'otChkBuyerInn', { inv: inv.buyer_inn, card: order.client_inn, name: inv.buyer_name || '' })
  } else if (inv.buyer_name && order.client_name) {
    const same = sameCompany(inv.buyer_name, order.client_name)
    push(same ? 'ok' : 'warn', same ? 'otChkBuyerOk' : 'otChkBuyerName', { name: inv.buyer_name, card: order.client_name })
  }

  const contract = sameContract(inv.contract_number, order.dogovor_number)
  if (contract === true) push('ok', 'otChkContractOk', { n: inv.contract_number })
  else if (contract === false) push('warn', 'otChkContract', { inv: inv.contract_number, card: order.dogovor_number })

  // Ichki hisob: qatorlar yig'indisi = "Итого"
  const items = inv.items || []
  if (!items.length) push('warn', 'otChkNoItems')
  const linesSum = round2(items.reduce((s, i) => s + (i.total || 0), 0))
  if (items.length && inv.total != null && !close(linesSum, inv.total)) push('bad', 'otChkLinesSum', { lines: linesSum, total: inv.total })
  for (const it of items) {
    if (it.qty != null && it.price != null && it.cost != null && !close(it.qty * it.price, it.cost, 1)) {
      push('warn', 'otChkLineMath', { no: it.no, name: it.name })
    }
    if (it.cost != null && it.vat != null && it.total != null && !close(it.cost + it.vat, it.total, 1)) {
      push('warn', 'otChkLineVat', { no: it.no, name: it.name })
    }
  }

  // Shartnoma summasi: avval yuklanganlar + shu faktura
  if (inv.total != null && order.contract_sum > 0) {
    const after = round2(otherSum + inv.total)
    if (after > order.contract_sum + 1) push('bad', 'otChkOverContract', { after, contract: order.contract_sum })
    else push('ok', 'otChkSumOk', { after, contract: order.contract_sum })
  }

  // Mahsulotlar: nom, soni, QQS bilan narx
  const cardItems = (order.items || []).filter((i) => i?.name)
  if (!cardItems.length) {
    if (items.length) push('warn', 'otChkCardNoItems')
  } else {
    const used = new Set()
    for (const it of items) {
      let best = -1
      let bestScore = 0
      cardItems.forEach((c, k) => {
        const s = nameScore(it.name, c.name)
        if (s > bestScore || (s === bestScore && best !== -1 && used.has(best) && !used.has(k))) {
          bestScore = s
          best = k
        }
      })
      if (best < 0 || bestScore < 0.5) {
        push('bad', 'otChkItemMissing', { no: it.no, name: it.name })
        continue
      }
      used.add(best)
      const c = cardItems[best]
      const problems = []
      if (it.qty != null && c.qty != null && it.qty > Number(c.qty) + 1e-6) problems.push('qty')
      const unitWithVat = it.qty ? it.total / it.qty : null
      const price = Number(c.price) || 0
      // Kartadagi narx QQS bilan yoki QQSsiz bo'lishi mumkin
      if (unitWithVat != null && price > 0 && !close(unitWithVat, price, 1) && !close(it.price, price, 1)) problems.push('price')
      if (!problems.length) push('ok', 'otChkItemOk', { no: it.no, name: c.name, qty: it.qty })
      else
        push(problems.includes('qty') ? 'bad' : 'warn', problems.includes('qty') ? 'otChkItemQty' : 'otChkItemPrice', {
          no: it.no,
          name: c.name,
          qty: it.qty,
          cardQty: c.qty,
          price: round2(unitWithVat ?? 0),
          cardPrice: price,
        })
    }
  }
  return out
}

/** Ishonchnomani tekshiradi: muddati, beruvchi korxona, shartnoma, mahsulotlar */
export function checkPoa(poa, order, today = new Date()) {
  const out = []
  const push = (level, key, params = {}) => out.push({ level, key, params })
  if (!poa.number) push('bad', 'otChkNoNumber')
  const day = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  if (!poa.valid_until) push('bad', 'otChkPoaNoUntil')
  else {
    const left = Math.round((new Date(`${poa.valid_until}T00:00:00Z`) - day) / 86400000)
    if (left < 0) push('bad', 'otChkPoaExpired', { date: poa.valid_until })
    else if (left <= 3) push('warn', 'otChkPoaSoon', { date: poa.valid_until, n: left })
    else push('ok', 'otChkPoaValid', { date: poa.valid_until, n: left })
  }
  if (poa.supplier && !/CLIMAVENT/i.test(poa.supplier)) push('warn', 'otChkPoaSupplier', { name: poa.supplier })

  if (order.client_inn && poa.company_inn) {
    if (String(order.client_inn).replace(/\D/g, '') === poa.company_inn) push('ok', 'otChkPoaCompanyOk', { name: poa.company })
    else push('bad', 'otChkPoaCompanyInn', { inv: poa.company_inn, card: order.client_inn, name: poa.company || '' })
  } else if (poa.company && order.client_name) {
    const same = sameCompany(poa.company, order.client_name)
    push(same ? 'ok' : 'warn', same ? 'otChkPoaCompanyOk' : 'otChkPoaCompany', { name: poa.company, card: order.client_name })
  }
  const contract = sameContract(poa.contract_number, order.dogovor_number)
  if (contract === true) push('ok', 'otChkContractOk', { n: poa.contract_number })
  else if (contract === false) push('warn', 'otChkContract', { inv: poa.contract_number, card: order.dogovor_number })

  const cardItems = (order.items || []).filter((i) => i?.name)
  if (cardItems.length) {
    for (const it of poa.items || []) {
      const best = cardItems.map((c) => ({ c, s: nameScore(it.name, c.name) })).sort((a, b) => b.s - a.s)[0]
      if (!best || best.s < 0.5) push('warn', 'otChkItemMissing', { no: it.no, name: it.name })
      else if (it.qty != null && best.c.qty != null && it.qty > Number(best.c.qty) + 1e-6)
        push('warn', 'otChkItemQty', { no: it.no, name: best.c.name, qty: it.qty, cardQty: best.c.qty })
      else push('ok', 'otChkItemOk', { no: it.no, name: best.c.name, qty: it.qty })
    }
  }
  return out
}

/** Shartnoma fayli: raqami, mijoz (INN), Didox'da imzolanganligi */
export function checkContract(doc, order) {
  const out = []
  const push = (level, key, params = {}) => out.push({ level, key, params })
  if (!doc.number) push('warn', 'otChkNoNumber')
  const contract = sameContract(doc.number, order.dogovor_number)
  if (contract === true) push('ok', 'otChkContractOk', { n: doc.number })
  else if (contract === false) push('bad', 'otChkContract', { inv: doc.number, card: order.dogovor_number })
  if (order.client_inn && doc.client_inn) {
    if (String(order.client_inn).replace(/\D/g, '') === String(doc.client_inn).replace(/\D/g, '')) push('ok', 'otChkBuyerOk', { name: doc.client_name || doc.client_inn })
    else push('bad', 'otChkBuyerInn', { inv: doc.client_inn, card: order.client_inn, name: doc.client_name || '' })
  } else if (doc.client_name && order.client_name) {
    const same = sameCompany(doc.client_name, order.client_name)
    push(same ? 'ok' : 'warn', same ? 'otChkBuyerOk' : 'otChkBuyerName', { name: doc.client_name, card: order.client_name })
  }
  if (doc.has_protocol) push(doc.signed ? 'ok' : 'warn', doc.signed ? 'otChkContractSigned' : 'otChkContractNotSigned')
  else push('warn', 'otChkContractNoDidox')
  return out
}

/**
 * Schyot-fakturalar bo'yicha tayyorlik: yuklangan fakturalardagi tovarlar soni kartadagi
 * mahsulotlarga (nom / model kodi bo'yicha) taqsimlanadi.
 * rows[i] — o.items[i] uchun { invoiced, left }; pct — jami fakturalangan / jami soni.
 */
export function invoicedProgress(order) {
  const card = order?.items || []
  const files = (order?.didox_files || []).filter((f) => (f.kind || 'invoice') === 'invoice')
  const withItems = files.filter((f) => Array.isArray(f.items) && f.items.length)
  const invoiced = card.map(() => 0)
  const unmatched = []
  for (const f of withItems) {
    for (const it of f.items) {
      const qty = Number(it.qty) || 0
      let best = -1
      let bestScore = 0
      card.forEach((c, k) => {
        if (!c?.name) return
        const s = nameScore(it.name, c.name)
        if (s < 0.5) return
        const free = (Number(c.qty) || 0) - invoiced[k] > 0
        const bestFree = best >= 0 && (Number(card[best].qty) || 0) - invoiced[best] > 0
        // Eng o'xshashi; teng bo'lsa — hali to'lmagan qator
        if (s > bestScore || (s === bestScore && free && !bestFree)) {
          best = k
          bestScore = s
        }
      })
      if (best < 0) unmatched.push({ name: it.name, qty, invoice: f.invoice_number })
      else invoiced[best] += qty
    }
  }
  const totalQty = card.reduce((s, c) => s + (Number(c?.qty) || 0), 0)
  const done = card.reduce((s, c, k) => s + Math.min(invoiced[k], Number(c?.qty) || 0), 0)
  return {
    hasData: withItems.length > 0,
    missing: files.length - withItems.length,
    rows: card.map((c, k) => ({ invoiced: invoiced[k], left: Math.max(0, (Number(c?.qty) || 0) - invoiced[k]) })),
    totalQty,
    done,
    left: Math.max(0, totalQty - done),
    pct: totalQty > 0 ? done / totalQty : null,
    unmatched,
  }
}
