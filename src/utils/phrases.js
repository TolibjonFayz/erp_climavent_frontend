// Tez iboralar (izoh maydonlari): iborani matn oxiriga qo'shadi. Oldingi gap tugamagan bo'lsa
// nuqta qo'yiladi; ibora matnda allaqachon bo'lsa yoki sig'masa — o'zgarishsiz qaytadi.
export function appendPhrase(text, phrase, maxlength = 0) {
  const current = String(text || '').trimEnd()
  if (current.includes(phrase)) return text
  const next = !current ? phrase : /[.!?:;\n]$/.test(current) ? `${current} ${phrase}` : `${current}. ${phrase}`
  if (maxlength && next.length > maxlength) return text
  return next
}
