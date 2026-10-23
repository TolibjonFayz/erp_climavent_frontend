// Jadval ustunlari kengligini sichqoncha bilan o'zgartirish va eslab qolish.
// el-table `border` bilan ishlatiladi (Element Plus ustun chegarasini faqat shunda sudratadi),
// chiziqlar ingichka bo'lishi uchun jadvalga `ui-resizable` klassi qo'shiladi (assets/main.css).
//
//   const cols = useColumnWidths('sklad-stock')
//   <el-table :key="cols.version.value" border class="ui-resizable" @header-dragend="cols.onDragEnd">
//     <el-table-column v-bind="cols.col('name', { minWidth: 170 })" column-key="name" ...>
//
// Kenglik shu brauzerda (localStorage) foydalanuvchi bo'yicha saqlanadi.
import { computed, ref } from 'vue'

const PREFIX = 'colw:'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key) || '{}') || {}
  } catch {
    return {}
  }
}

export function useColumnWidths(tableKey) {
  const key = `${tableKey}:${localStorage.getItem('userid') || ''}`
  const widths = ref(read(key))
  // Tiklanganda jadvalni qayta chizish uchun (el-table sudralgan kenglikni o'zida ushlab qoladi)
  const version = ref(0)

  const save = () => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(widths.value))
    } catch {
      // saqlab bo'lmasa — kenglik faqat shu sahifa ochiqligida qoladi
    }
  }

  // Ustun atributlari: foydalanuvchi o'zgartirgan bo'lsa — aniq kenglik, aks holda asl qiymat
  const col = (id, defaults = {}) => {
    const w = widths.value[id]
    if (!w) return defaults
    const { minWidth, width, ...rest } = defaults
    return { ...rest, width: w }
  }

  // el-table `header-dragend` (newWidth, oldWidth, column)
  const onDragEnd = (newWidth, _old, column) => {
    const id = column.columnKey || column.property
    if (!id) return
    widths.value = { ...widths.value, [id]: Math.max(48, Math.round(newWidth)) }
    save()
  }

  const changed = computed(() => Object.keys(widths.value).length > 0)

  const reset = () => {
    widths.value = {}
    version.value++
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      // e'tiborsiz
    }
  }

  return { col, onDragEnd, changed, reset, version }
}
