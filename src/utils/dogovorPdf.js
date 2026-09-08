// Shartnoma hujjatini (namunadagi PDF ko'rinishida) HTML sifatida yig'adi va
// brauzerning chop etish oynasi orqali PDF qilib saqlashga beradi.
// Shu yo'l kirill matnini muammosiz chiqaradi va qo'shimcha kutubxona talab
// qilmaydi (jsPDF uchun kirill shriftini base64 qilib joylash kerak bo'lardi).
import {
  SELLER,
  VAT_PERCENT,
  RU_MONTHS,
  CONTRACT_SECTIONS,
  sumInWords,
} from '@/constants/dogovorTemplate'

const money = (value) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

// XSS emas, lekin mijoz nomida < > bo'lsa hujjat buzilmasin
const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const dash = (value) => (value === null || value === undefined || value === '' ? '—' : value)

// "в лице ..." konstruksiyasi qaratqich kelishigini talab qiladi:
// «Генеральный директор» -> «генерального директора»
const POSITION_GENITIVE = {
  директор: 'директора',
  'генеральный директор': 'генерального директора',
  'и.о. директора': 'и.о. директора',
  'заместитель директора': 'заместителя директора',
  'исполнительный директор': 'исполнительного директора',
  'коммерческий директор': 'коммерческого директора',
  'главный бухгалтер': 'главного бухгалтера',
  'директор по доверенности': 'директора по доверенности',
}

function positionGenitive(position) {
  const raw = String(position || 'Директор').trim()
  const key = raw.toLowerCase()
  if (POSITION_GENITIVE[key]) return POSITION_GENITIVE[key]
  // Ro'yxatda bo'lmagan lavozimlar (masalan ism yozib qo'yilgan) o'zgarishsiz qoladi
  const prefix = Object.keys(POSITION_GENITIVE).find((k) => key.startsWith(k))
  return prefix ? POSITION_GENITIVE[prefix] + raw.slice(prefix.length) : raw
}

export function buildDogovorHtml(row) {
  const date = row.dogovor_date ? new Date(row.dogovor_date) : new Date()
  const day = date.getDate()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()
  // Namunadagi format: «ДОГОВОР №30399/7» — hujjat raqami / oy
  const contractNo = `${dash(row.dogovor_number)}/${monthIndex + 1}`

  const items = Array.isArray(row.items) ? row.items : []
  const rowsHtml = items.length
    ? items
        .map((item, i) => {
          const sum = (Number(item.qty) || 0) * (Number(item.price) || 0)
          const vat = (sum * VAT_PERCENT) / 100
          return `<tr>
            <td class="c">${i + 1}</td>
            <td>${esc(item.name)}</td>
            <td class="c">${esc(item.unit || 'шт')}</td>
            <td class="c">${Number(item.qty) || 0}</td>
            <td class="r">${money(item.price)}</td>
            <td class="r">${money(sum)}</td>
            <td class="r">${money(vat)}</td>
            <td class="r">${money(sum + vat)}</td>
          </tr>`
        })
        .join('')
    : `<tr><td class="c empty" colspan="8">Спецификация не заполнена</td></tr>`

  const subtotal = items.reduce(
    (acc, i) => acc + (Number(i.qty) || 0) * (Number(i.price) || 0),
    0,
  )
  const vatTotal = (subtotal * VAT_PERCENT) / 100
  // Bandlar kiritilmagan bo'lsa jadval jami sifatida shartnoma summasi ishlatiladi
  const grandTotal = items.length ? subtotal + vatTotal : Number(row.dogovor_sum) || 0

  const prepayment = row.prepayment_percent != null ? row.prepayment_percent : 100
  const productionDays = row.production_days != null ? row.production_days : 1

  const sectionsHtml = CONTRACT_SECTIONS.map(
    (section) => `
      <h3>${esc(section.title)}</h3>
      ${section.items.map((line) => `<p>${esc(line)}</p>`).join('')}
    `,
  ).join('')

  const buyerName = esc(row.client_name || '____________')
  const buyerDirector = esc(row.contact_name || '____________')
  const buyerPosition = esc(row.contact_position || 'Директор')

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>Договор №${esc(contractNo)} — ${buyerName}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 10.5pt;
    line-height: 1.35;
    color: #000;
    margin: 0;
  }
  .doc { max-width: 186mm; margin: 0 auto; }
  .meta { display: flex; justify-content: space-between; font-size: 10.5pt; }
  h1 { text-align: center; font-size: 14pt; margin: 6px 0 12px; }
  h2 { font-size: 11pt; margin: 14px 0 6px; }
  h3 { font-size: 11pt; margin: 12px 0 4px; page-break-after: avoid; }
  p { margin: 3px 0; text-align: justify; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
  th { background: #f0f0f0; text-align: center; font-weight: bold; }
  td.c { text-align: center; }
  td.r { text-align: right; white-space: nowrap; }
  td.empty { color: #666; font-style: italic; }
  tfoot td { font-weight: bold; }
  .sign { display: flex; gap: 14mm; margin-top: 10px; page-break-inside: avoid; }
  .sign > div { flex: 1; font-size: 10pt; }
  .sign b { display: block; margin-bottom: 4px; }
  .sign .line { margin-top: 14px; }
</style>
</head>
<body>
<div class="doc">
  <h1>ДОГОВОР №${esc(contractNo)}</h1>
  <div class="meta">
    <span>${esc(SELLER.city)}</span>
    <span>${day} ${RU_MONTHS[monthIndex]} ${year} г.</span>
  </div>

  <p>
    Мы, нижеподписавшиеся, ${esc(SELLER.name)}, в дальнейшем именуемое «Продавец», в лице
    директора ${esc(SELLER.director)}, действующего на основании Устава, с одной стороны, и
    <b>${buyerName}</b>, в дальнейшем именуемое «Покупатель», в лице
    ${esc(positionGenitive(row.contact_position))}
    <b>${buyerDirector}</b>, действующего на основании Устава, с другой стороны, совместно
    "Стороны", заключили настоящий Договор на поставку продукции (далее по тексту — "Договор")
    о нижеследующем:
  </p>

  <h3>1. Предмет договора</h3>
  <table>
    <thead>
      <tr>
        <th style="width:5%">№</th>
        <th>Наименование</th>
        <th style="width:8%">Ед. изм.</th>
        <th style="width:8%">Кол-во</th>
        <th style="width:13%">Цена за шт</th>
        <th style="width:13%">Сумма</th>
        <th style="width:12%">НДС ${VAT_PERCENT}%</th>
        <th style="width:15%">Сумма с учетом НДС</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
    ${
      items.length
        ? `<tfoot>
            <tr>
              <td colspan="5" class="r">Итого:</td>
              <td class="r">${money(subtotal)}</td>
              <td class="r">${money(vatTotal)}</td>
              <td class="r">${money(subtotal + vatTotal)}</td>
            </tr>
          </tfoot>`
        : ''
    }
  </table>

  <h3>2. Порядок оплаты, сумма и сроки</h3>
  <p>
    2.1. Общая сумма договора составляет <b>${money(grandTotal)}</b> сум
    (${esc(sumInWords(grandTotal))}), включая НДС ${VAT_PERCENT}%.
  </p>
  <p>
    2.2. В размере ${prepayment}% суммы договора Покупатель перечисляет на банковский счет
    Продавца, после чего Продавец начинает производство продукции, и она будет произведена
    в течение ${productionDays} банковских дней.
  </p>
  <p>
    2.3. Продавец направляет Покупателю уведомление (устное, письменное, электронное)
    о готовности товара.
  </p>

  ${sectionsHtml}

  <h3>11. Подписи сторон</h3>
  <div class="sign">
    <div>
      <b>Заказчик: ${buyerName}</b>
      Адрес: ${esc(dash(row.client_address))}<br />
      Н/С: ${esc(dash(row.client_account))}<br />
      Банк: ${esc(dash(row.client_bank))}<br />
      Регистрационный код плательщика НДС: ${esc(dash(row.client_vat_code))}<br />
      МФО: ${esc(dash(row.client_mfo))}<br />
      ИНН: ${esc(dash(row.client_inn))}<br />
      Телефон: ${esc(dash(row.client_phone))}
      <div class="line">${buyerPosition} __________________ ${buyerDirector}</div>
    </div>
    <div>
      <b>Продавец: ${esc(SELLER.name)}</b>
      Адрес: ${esc(SELLER.address)}<br />
      Р/С: ${esc(SELLER.account)}<br />
      Название банка: ${esc(SELLER.bank)}<br />
      МФО: ${esc(SELLER.mfo)}<br />
      ИНН: ${esc(SELLER.inn)}, ОКЭД: ${esc(SELLER.oked)}<br />
      Телефоны: ${esc(SELLER.phone)}
      <div class="line">${esc(SELLER.directorTitle)} __________________ ${esc(SELLER.director)}</div>
    </div>
  </div>
</div>
</body>
</html>`
}

// Hujjatni chop etish oynasiga beradi (u yerdan "PDF sifatida saqlash" tanlanadi).
// Yashirin iframe ishlatiladi — popup-bloker xalaqit bermaydi va foydalanuvchi
// sahifadan chiqib ketmaydi. Promise chop etish oynasi ochilgach yakunlanadi.
export function printDogovorDocument(row) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    document.body.appendChild(frame)

    const cleanup = () => {
      // Chop etish oynasi yopilgandan keyin olib tashlaymiz
      setTimeout(() => frame.remove(), 1000)
    }

    frame.onload = () => {
      try {
        const win = frame.contentWindow
        win.focus()
        win.print()
        cleanup()
        resolve()
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    const doc = frame.contentDocument || frame.contentWindow?.document
    if (!doc) {
      frame.remove()
      reject(new Error('Hujjat oynasini yaratib bo‘lmadi'))
      return
    }
    doc.open()
    doc.write(buildDogovorHtml(row))
    doc.close()
  })
}
