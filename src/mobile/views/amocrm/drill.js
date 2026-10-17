import { ref } from 'vue'

// Statistika sahifasidan ro'yxat sahifasiga uzatiladigan so'rov:
// { type: 'calls'|'leads', title, subtitle, params, groupByPhone, onlyNotCalledBack }
export const drillRequest = ref(null)
// Ro'yxatda kerak bo'ladigan statistika (menejerlar, voronka bosqichlari, amo_url)
export const drillStats = ref(null)
