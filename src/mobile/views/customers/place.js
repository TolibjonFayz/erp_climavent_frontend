// "chilonzor_tumani" → "Chilonzor tumani" (saytdagi CustomerDetail bilan bir xil qoida)
const SPECIAL_NAMES = {
  ozbekiston: "O'zbekiston",
  qazoqstan: 'Qozoqstan',
  turkmonistaon: 'Turkmaniston',
  tajikiston: 'Tajikiston',
  kirgiziston: 'Qirgiziston',
  rossiya: 'Rossiya',
}
const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()

export function formatPlace(name) {
  if (!name) return ''
  return name
    .split('_')
    .map((word) => {
      const lower = word.toLowerCase()
      if (SPECIAL_NAMES[lower]) return SPECIAL_NAMES[lower]
      for (const [re, suffix] of [
        [/shahri$|shahr$/, 'shahri'],
        [/tumani$|tuman$/, 'tumani'],
        [/rayoni$|rayon$/, 'rayoni'],
      ]) {
        if (re.test(lower)) return `${capitalize(lower.replace(re, ''))} ${suffix}`
      }
      return capitalize(word)
    })
    .join(' ')
}
