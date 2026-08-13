// KP "Izoh" maydoni uchun standart variantlar ro'yxati.
// Ikkita maxsus variant bor:
//  - CONTRACT_NUMBER_OPTION: tanlansa pastdan shartnoma raqamini kiritish maydoni chiqadi
//  - OTHER_COMMENT_OPTION: tanlansa pastdan erkin matn yozish maydoni chiqadi

export const CONTRACT_NUMBER_PREFIX = 'Шартнома рақами:'
export const CONTRACT_NUMBER_OPTION = 'Шартнома рақами: __________.'
export const OTHER_COMMENT_OPTION = 'Бошка'

export const KP_COMMENT_OPTIONS = [
  'Нарх мижоз бюджетига мос келмади.',
  'Мижоз қарор қабул қилиш жараёнида.',
  'Мижоздан якуний жавоб кутилмоқда.',
  'Омборхонада тайёр махсулот йуклиги сабабли.',
  'Ишлаб чиқариш муддати мос келмади.',
  'Лойиҳа тендер босқичида.',
  'Қурилиш ҳали бошланмаган.',
  'КП янгиланди ва қайта юборилди.',
  'Смета учун КП тайёрланди.',
  'Лойиҳа институти учун КП тайёрланди.',
  'Проект подбор учун КП тайёрланди.',
  'Мижоздан техник маълумотлар кутилмоқда.',
  'Лойиҳа ҳужжатлари кутилмоқда.',
  CONTRACT_NUMBER_OPTION,
  'Харид бекор қилинди.(эхтёж йук )',
  'Объект бўйича ишлар вақтинча тўхтатилди.',
  'Объект бўйича маблағ ажратилмаган.',
  'Кейинроқ қайта алоқага чиқилади.',
  'Переговор скидка масаласи',
  'Мижоз хакида маълумот йук',
  'Нархимиз киммат',
  OTHER_COMMENT_OPTION,
]

// Mavjud comment matnidan forma holatini tiklaydi (tahrirlashda ishlatiladi).
// Qaytadigan kalitlar kpForm'dagi maydon nomlari bilan AYNAN bir xil bo'lishi shart
// (commentSelect/contractNumber/customComment) — Object.assign(kpForm, {...deriveCommentForm(...)})
// to'g'ridan-to'g'ri spread qilinadi.
// Eski/import qilingan erkin matnlar avtomatik "Бошка" ostiga tushadi — ma'lumot yo'qolmaydi.
export function deriveCommentForm(comment) {
  const text = (comment || '').trim()
  if (!text) return { commentSelect: '', contractNumber: '', customComment: '' }
  if (text.startsWith(CONTRACT_NUMBER_PREFIX)) {
    const num = text.slice(CONTRACT_NUMBER_PREFIX.length).replace(/[.\s]/g, '')
    return { commentSelect: CONTRACT_NUMBER_OPTION, contractNumber: num, customComment: '' }
  }
  if (KP_COMMENT_OPTIONS.includes(text)) {
    return { commentSelect: text, contractNumber: '', customComment: '' }
  }
  return { commentSelect: OTHER_COMMENT_OPTION, contractNumber: '', customComment: text }
}

// Forma holati asosida yakuniy saqlanadigan comment matnini hisoblaydi.
// Argument kalitlari ham kpForm bilan bir xil (commentSelect/contractNumber/customComment).
export function resolveCommentValue({ commentSelect, contractNumber, customComment }) {
  if (!commentSelect) return ''
  if (commentSelect === CONTRACT_NUMBER_OPTION) {
    const num = (contractNumber || '').trim()
    return num ? `${CONTRACT_NUMBER_PREFIX} ${num}.` : CONTRACT_NUMBER_OPTION
  }
  if (commentSelect === OTHER_COMMENT_OPTION) {
    return (customComment || '').trim()
  }
  return commentSelect
}

// Faqat "Izoh" ustuni FILTRI uchun — saqlanadigan qiymat emas, shuning uchun
// KP_COMMENT_OPTIONS'ga emas, faqat filtr ro'yxatiga qo'shiladi ("Бошка"дан keyin, eng pastda).
export const EMPTY_COMMENT_OPTION = 'Yozilmaganlar'
export const KP_COMMENT_FILTER_OPTIONS = [...KP_COMMENT_OPTIONS, EMPTY_COMMENT_OPTION]

// Izoh ustuni filtri: tanlangan select qiymatiga yozuvning comment'i mos keladimi tekshiradi.
// "Yozilmaganlar" tanlansa — comment umuman yozilmagan (bo'sh) yozuvlarni topadi.
export function commentMatchesFilter(comment, filterValue) {
  if (!filterValue) return true
  if (filterValue === EMPTY_COMMENT_OPTION) return !String(comment ?? '').trim()
  return deriveCommentForm(comment).commentSelect === filterValue
}
