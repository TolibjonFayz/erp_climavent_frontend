// Shartnoma PDF faylidan (Didox orqali imzolangan) forma maydonlarini o'qiydi.
// pdf.js har bir matn bo'lagini koordinatasi bilan beradi — jadval va ikki
// ustunli rekvizitlarni shu koordinatalar bo'yicha qayta yig'amiz.
// Uchta shablon bilan sinalgan: o'zbekcha («Маҳсулот етказиб бериш шартномаси»),
// ruscha («ДОГОВОР №…/…») va ENTER ENGINEERING «ДОГОВОР ПОСТАВКИ» (jadvalsiz).

const SAME_LINE = 3 // pt — shu farqdagi bo'laklar bitta qatorda
const NAME_ABOVE_ROW = 7 // pt — nom birinchi qatori raqamdan shuncha yuqorida bo'lishi mumkin

const clean = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()

// "1 870 000,00" -> 1870000
export const parseAmount = (s) => {
  const raw = String(s ?? '')
    .replace(/[\s ]/g, '')
    .replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(raw)) return null
  return Number(raw)
}
const isAmount = (s) => /^\d{1,3}(?:[\s ]\d{3})*(?:,\d{1,2})?$|^\d+(?:,\d{1,2})?$/.test(clean(s))

// Bo'laklarni qatorlarga yig'adi (yuqoridan pastga, chapdan o'ngga)
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

const sameRow = (a, b) => Math.abs(a.y - b.y) <= SAME_LINE

// ─── 1. Didox imzolash protokoli (1-sahifa) ───
// "Покупатель:" ustuni: nom, ИНН, manzil; "По договору": raqam va sana
const parseProtocol = (page, out) => {
  const items = page.items
  const buyerLabel = items.find((i) => /^Покупатель:?$/.test(clean(i.str)))
  if (buyerLabel) {
    const colX = buyerLabel.x
    const valueOf = (label) =>
      clean(
        items
          .filter((i) => sameRow(i, label) && i.x > label.x + 15 && i !== label)
          .sort((a, b) => a.x - b.x)
          .map((i) => i.str)
          .join(' '),
      )
    out.client_name = valueOf(buyerLabel)

    const below = (re) =>
      items
        .filter((i) => re.test(clean(i.str)) && Math.abs(i.x - colX) < 10 && i.y < buyerLabel.y)
        .sort((a, b) => b.y - a.y)[0]
    const innLabel = below(/^ИНН$/)
    if (innLabel) out.client_inn = valueOf(innLabel).replace(/\D/g, '')

    const addrLabel = below(/^Адрес$/)
    if (addrLabel) {
      const valueX = items.find((i) => sameRow(i, addrLabel) && i.x > addrLabel.x + 15)?.x
      if (valueX != null) {
        // Manzil bir necha qatorga o'tadi — qatorlar oralig'i ~9pt, uzilishgacha olamiz
        const parts = items
          .filter((i) => Math.abs(i.x - valueX) < 3 && i.y <= addrLabel.y + 1)
          .sort((a, b) => b.y - a.y)
        const lines = []
        let lastY = addrLabel.y + 1
        for (const p of parts) {
          if (lastY - p.y > 14) break
          lines.push(p.str)
          lastY = p.y
        }
        // "34-" + "uy" kabi chiziqcha bilan bo'lingan so'zlarni qayta qo'shamiz
        out.client_address = clean(lines.join(' ').replace(/-\s+/g, '-'))
      }
    }
  }

  const docRef = (re) => {
    const label = items.find((i) => re.test(clean(i.str)))
    if (!label) return null
    const value = clean(
      items
        .filter((i) => sameRow(i, label) && i.x > label.x + 50)
        .map((i) => i.str)
        .join(' '),
    )
    return value.match(/№\s*(\d+)(?:\s*\/\s*\d+)?\s*от\s*(\d{2})\.(\d{2})\.(\d{4})/)
  }
  const m = docRef(/^По договору$/) || docRef(/^Номер и дата документа$/)
  if (m) {
    out.dogovor_number = Number(m[1])
    out.dogovor_date = `${m[4]}-${m[3]}-${m[2]}`
  }

  // Ikkinchi imzolovchi (xaridor) FIO — direktor nomi topilmasa zaxira
  const signers = items.filter((i) => /^фио:/i.test(clean(i.str)))
  const buyerSigner = signers.find((i) => !/RASULOV/i.test(i.str))
  if (buyerSigner) out._signer = clean(buyerSigner.str.replace(/^фио:/i, ''))
}

// ─── 2. Mahsulotlar jadvali ───
// Sarlavha: "№" + "Маҳсулот номи"/"Наименование"; har qator chap ustundagi
// tartib raqamidan boshlanadi, raqamli ustunlar: miqdor, narx, summa, QQS, jami.
// Jadval keyingi sahifaga o'tishi mumkin — "Жами:"/"Итого:" gacha davom etamiz.
const TOTAL_RE = /^(Жами|Итого|Всего)\s*:?$/i

const parseItemsTable = (pages, out) => {
  let start = null
  for (let p = 0; p < pages.length && !start; p++) {
    const items = pages[p].items
    const nameHead = items.find((i) =>
      /^(Маҳсулот номи|Махсулот номи|Наименование)/i.test(clean(i.str)),
    )
    if (!nameHead) continue
    const numHead = items.find((i) => clean(i.str) === '№' && Math.abs(i.y - nameHead.y) < 10)
    if (!numHead) continue
    const unitHead = items.find(
      (i) => /^(Ўлчов|Ед\.?|Ед\.\s*изм)/i.test(clean(i.str)) && Math.abs(i.y - nameHead.y) < 12,
    )
    start = {
      page: p,
      y: Math.min(nameHead.y, numHead.y) - 10, // ikki qatorli sarlavha ("изм.", "бирл") pastidan
      nameX: nameHead.x,
      nameEndX: unitHead ? unitHead.x - 3 : nameHead.x + 160,
      numEndX: nameHead.x - 2,
    }
  }
  if (!start) return

  const rows = []
  let expected = 1
  let total = null

  for (let p = start.page; p < pages.length && total == null; p++) {
    const items = pages[p].items.filter((i) => (p === start.page ? i.y < start.y : true))
    const totalLabel = items.filter((i) => TOTAL_RE.test(clean(i.str))).sort((a, b) => b.y - a.y)[0]
    const bottomY = totalLabel ? totalLabel.y : -Infinity
    const region = items.filter((i) => i.y > bottomY + 1)

    // Ketma-ket tartib raqamlari — tasodifiy raqamlarni (sahifa raqami va h.k.) chiqarib tashlaydi
    const anchors = []
    for (const it of region.filter((i) => i.x < start.numEndX).sort((a, b) => b.y - a.y)) {
      if (clean(it.str) === String(expected)) {
        anchors.push(it)
        expected++
      }
    }
    // Davomi sahifasida jadval bo'lmasa — to'xtaymiz
    if (!anchors.length && p !== start.page) break

    anchors.forEach((a, idx) => {
      const nextY = idx + 1 < anchors.length ? anchors[idx + 1].y : bottomY
      const nums = region
        .filter((i) => sameRow(i, a) && i.x > start.nameEndX && isAmount(i.str))
        .sort((x, y) => x.x - y.x)
        .map((i) => parseAmount(i.str))
      const unit = region.find(
        (i) => sameRow(i, a) && i.x >= start.nameEndX - 5 && !isAmount(i.str) && clean(i.str),
      )
      const name = region
        .filter(
          (i) =>
            i.x >= start.nameX - 70 &&
            i.x < start.nameEndX &&
            i.x > a.x + 5 &&
            i.y <= a.y + NAME_ABOVE_ROW &&
            i.y > nextY + NAME_ABOVE_ROW,
        )
        .sort((x, y) => y.y - x.y || x.x - y.x)
        .map((i) => i.str)
        .join(' ')
      if (nums.length < 2) return
      rows.push({
        name: clean(name),
        unit: unit ? clean(unit.str) : 'шт',
        qty: nums[0],
        price: nums[1],
      })
    })

    if (totalLabel) {
      const totals = items
        .filter((i) => sameRow(i, totalLabel) && i.x > totalLabel.x && isAmount(i.str))
        .sort((a, b) => b.x - a.x)
      total = totals.length ? parseAmount(totals[0].str) : 0
    }
  }

  if (rows.length) out.items = rows
  if (total) out.dogovor_sum = total
}

// ─── 3. Xaridor rekvizitlari (oxirgi bo'lim, o'ng ustun) ───
const REQ_HEAD_RE = /(Томонлар имзоси|Подписи сторон|РЕКВИЗИТЫ|Реквизиты сторон)/i

const parseRequisites = (pages, out) => {
  let region = []
  for (let p = pages.length - 1; p >= 0; p--) {
    const head = pages[p].items.find((i) => REQ_HEAD_RE.test(clean(i.str)))
    if (!head) continue
    region = pages[p].items.filter((i) => i.y < head.y + 20 && i !== head)
    for (let q = p + 1; q < pages.length; q++) region = region.concat(pages[q].items)
    break
  }
  if (!region.length) return

  // Xaridor ustuni — eng o'ngdagi "ИНН" yorlig'idan boshlanadi
  const innLabels = region.filter((i) => /^ИНН/.test(clean(i.str)) && i.x > 200)
  if (!innLabels.length) return
  const splitX = Math.min(...innLabels.map((i) => i.x)) - 6
  const lines = toLines(region.filter((i) => i.x >= splitX))
  const text = clean(lines.map((l) => l.text).join(' '))

  const pick = (re) => text.match(re)?.[1]
  const account = pick(/(?:[ҲХH]\/Р|Н\/С|Р\/С|р\/с|Счет)\s*:?\s*((?:\d\s?){20})/i)
  if (account) out.client_account = account.replace(/\D/g, '')
  const mfo = pick(/МФО\s*:?\s*[-–]?\s*(\d{5})\b/)
  if (mfo) out.client_mfo = mfo
  const vat = pick(/код\s*НДС\s*:?\s*(\d{12})\b/i)
  if (vat) out.client_vat_code = vat
  const bank = pick(/Банк\s*:?\s*(?!МФО)(.+?)\s*(?=МФО|ИНН|код\s*НДС|ОКЭД|Тел|Директор|$)/i)
  if (bank && /[A-Za-zА-Яа-яЎўҚқҒғҲҳ]{3}/.test(bank))
    out.client_bank = clean(bank).replace(/[,\s]+$/, '')
  // Bir nechta raqam bo'lishi mumkin: "94 681 86 86, +998 93 949 53 31"
  const phone = pick(
    /Тел[а-я]*\s*\.?\s*:?\s*(\+?[\d\s()-]{7,20}\d(?:\s*,\s*\+?[\d\s()-]{7,20}\d)*)/i,
  )
  if (phone) out.client_phone = clean(phone)
  // Manzil — Didox protokoli bo'lmasa shu yerdan
  if (!out.client_address) {
    const addr = pick(
      /(?:Адрес|Манзил)\s*:?\s*(.+?)\s*(?=[ҲХH]\/Р|Н\/С|Р\/С|р\/с|Счет|Банк|ИНН|Тел|МФО|$)/i,
    )
    if (addr && /[A-Za-zА-Яа-яЎўҚқҒғҲҳ]{3}/.test(addr))
      out.client_address = clean(addr).replace(/[,\s]+$/, '')
  }
  // Ustun boshidagi nom: “ BEST CLIMATE MCHJ ” МЧЖ — preambulada nom bo'lmasa zaxira
  const nameLine = lines.find((l) => /[“"«].+[”"»]/.test(l.text))
  if (nameLine)
    out._signClient = clean(nameLine.text.replace(/^[“"«]\s*|\s*[”"»]\s*(МЧЖ|ООО)?$/g, ''))
  if (!out.client_inn) {
    const inn = pick(/ИНН\s*:?\s*((?:\d\s?){9})/)
    if (inn) out.client_inn = inn.replace(/\D/g, '')
  }
  const signLine = lines.find((l) => /директор/i.test(l.text) && /_{3,}/.test(l.text))
  const signName = signLine?.text.split(/_{3,}/).pop()
  // "{U_fio}" — shablonda to'ldirilmay qolgan joy, ism emas
  if (signName && clean(signName) && !/[{}]/.test(signName)) out._signName = clean(signName)
}

// Oy nomlari (rus va o'zbek kirill) — boshlanishi bo'yicha: "Июнь", "июня", "Июн"
const MONTH_STEMS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'ма',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

// ─── 4. Matndagi shartlar (summa, oldindan to'lov, muddat, direktor) ───
const parseBody = (pages, out, hasProtocol) => {
  const text = clean(
    pages
      .slice(hasProtocol ? 1 : 0)
      .map((pg) =>
        toLines(pg.items)
          .map((l) => l.text)
          .join(' '),
      )
      .join(' '),
  )

  if (!out.dogovor_number) {
    const m = text.match(/(?:шартномаси|ДОГОВОР(?:\s+ПОСТАВКИ)?)\s*№\s*(\d+)/i)
    if (m) out.dogovor_number = Number(m[1])
  }

  // Protokolsiz PDF: sana sarlavhada "17 Июнь 2026 г." ko'rinishida
  if (!out.dogovor_date) {
    const m = text.match(
      new RegExp(String.raw`(\d{1,2})\s+(${MONTH_STEMS.join('|')})[а-яё]*\s+(\d{4})`, 'i'),
    )
    if (m) {
      const month = MONTH_STEMS.findIndex((st) => m[2].toLowerCase().startsWith(st)) + 1
      out.dogovor_date = `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`
    }
  }

  if (!out.dogovor_sum) {
    const m =
      text.match(/сумма\s+договора\s*составляет\s*:?\s*(\d{1,3}(?:\s\d{3})*(?:,\d{2})?)/i) ||
      text.match(/умумий\s+суммаси.{0,80}?(\d{1,3}(?:\s\d{3})+(?:,\d{2})?)/i)
    if (m) out.dogovor_sum = parseAmount(m[1])
  }

  const pct =
    text.match(/суммасининг\s+(\d{1,3}(?:[.,]\d+)?)\s*%/i) ||
    text.match(/перечисления\s+(\d{1,3}(?:[.,]\d+)?)\s*%/i) ||
    text.match(/предоплат\S*\s+в\s+размере\s+(\d{1,3}(?:[.,]\d+)?)\s*%/i)
  if (pct) out.prepayment_percent = Number(pct[1].replace(',', '.'))

  const days =
    text.match(/(\d{1,3})\s+банк\s+куни\s+ичида\s+ишлаб\s+чиқаради/i) ||
    text.match(/произведена\s+в\s+течение\s+(\d{1,3})/i) ||
    text.match(/изготов\S*\s+в\s+течение\s+(\d{1,3})/i)
  if (days) out.production_days = Number(days[1])

  // Preambula: "___MIJOZ____ ... ___Direktor____" — ikkinchi to'ldirilgan joy direktor
  const blanks = [...text.matchAll(/_{2,}([^_]{0,60}?)_{2,}/g)].map((m) => clean(m[1]))
  if (!out.client_name && blanks[0] && /[A-Za-zА-Яа-яЁё]{2}/.test(blanks[0])) {
    out.client_name = blanks[0]
  }
  const director = blanks[1]
  if (director && /[A-Za-zА-Яа-яЁё]/.test(director)) out.contact_name = director
  if (/юритувчи|директора\s+_|директори/i.test(text)) out.contact_position = 'Директор'

  // ENTER shablonida: «Покупатель», в лице <lavozim>, <FIO>, действующего ...
  if (!out.contact_name) {
    const m = text.match(
      /Покупатель\s*»?\s*,?\s*в\s+лице\s+(.+?)\s*,\s*([^,]{5,60}?)\s*,\s*действующ/i,
    )
    if (m) {
      out.contact_position = clean(m[1])
      out.contact_name = clean(m[2])
    }
  }
}

// pages: [{ items: [{ str, x, y }] }] — pdf.js'dan mustaqil, shuning uchun sinash oson
export const parseDogovorPages = (pages) => {
  const out = {}
  // Didox orqali yuborilganda 1-sahifa — imzolash protokoli; 1C'dan to'g'ridan chiqarilganda yo'q
  const hasProtocol = !!pages[0]?.items.some((i) => /ПРОТОКОЛ ПОДПИСАНИЯ/i.test(i.str))
  if (hasProtocol) parseProtocol(pages[0], out)
  parseItemsTable(pages, out)
  parseRequisites(pages, out)
  parseBody(pages, out, hasProtocol)

  if (!out.client_name) out.client_name = out._signClient
  if (!out.contact_name) out.contact_name = out._signName || out._signer
  if (out.contact_name && !out.contact_position) out.contact_position = 'Директор'
  delete out._signName
  delete out._signClient
  delete out._signer

  for (const key of Object.keys(out)) {
    if (out[key] === '' || out[key] == null || Number.isNaN(out[key])) delete out[key]
  }
  return out
}

export const extractPdfPages = async (pdfjs, data) => {
  const doc = await pdfjs.getDocument({ data }).promise
  try {
    const pages = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      pages.push({
        items: content.items
          .filter((i) => i.str && i.str.trim())
          .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] })),
      })
    }
    return pages
  } finally {
    doc.destroy()
  }
}

// pdf.js og'ir (~1MB) — faqat PDF yuklanganda dinamik yuklanadi
let pdfjsPromise = null
const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.min.mjs'),
      // ?worker — Vite worker'ni .js qilib chiqaradi (.mjs ni ba'zi serverlar noto'g'ri MIME bilan beradi)
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker'),
    ]).then(([pdfjs, PdfWorker]) => {
      pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker.default()
      return pdfjs
    })
  }
  return pdfjsPromise
}

export const readDogovorPdf = async (file) => {
  const pdfjs = await loadPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const pages = await extractPdfPages(pdfjs, data)
  if (!pages.some((p) => p.items.length)) throw new Error('NO_TEXT')
  return parseDogovorPages(pages)
}
