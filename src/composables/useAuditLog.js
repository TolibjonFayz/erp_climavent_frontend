import { ref } from 'vue'
import axios from 'axios'

const BASE = `${import.meta.env.VITE_APP_BASE_URL}audit-logs`

export function useAuditLog() {
  const auditLogs = ref([])
  const stats = ref({ total: 0, today: 0, role: 0, block: 0, export: 0 })
  const loading = ref(false)
  const total = ref(0)

  // ─── Loglarni backenddan olish ────────────────────────────
  // Backend: GET /audit-logs/filter
  async function fetchLogs(params = {}) {
    try {
      loading.value = true
      const { data } = await axios.get(`${BASE}/filter`, { params })
      auditLogs.value = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      total.value = data?.total ?? auditLogs.value.length
    } catch (e) {
      console.error('Audit log yuklashda xatolik:', e)
      auditLogs.value = []
    } finally {
      loading.value = false
    }
  }

  // ─── Statistikani olish ───────────────────────────────────
  // Backend: GET /audit-logs/stats
  async function fetchStats() {
    try {
      const { data } = await axios.get(`${BASE}/stats`)
      stats.value = {
        total: data?.total ?? 0,
        today: data?.today ?? 0,
        role: data?.role ?? 0,
        block: data?.block ?? 0,
        export: data?.export ?? 0,
      }
    } catch (e) {
      console.error('Audit stats xatolik:', e)
      stats.value = { total: 0, today: 0, role: 0, block: 0, export: 0 }
    }
  }

  // ─── Bitta userga tegishli loglarni olish ────────────────
  // Backend: GET /audit-logs/target/:username
  async function fetchByTarget(username) {
    try {
      const { data } = await axios.get(`${BASE}/target/${username}`)
      return Array.isArray(data) ? data : (data?.data ?? [])
    } catch (e) {
      console.error('Target logs xatolik:', e)
      return []
    }
  }

  // ─── Log yozish ───────────────────────────────────────────
  // Backend: POST /audit-logs/create
  async function addAuditLog({ action, message, meta = null, type = 'info', target_id = null }) {
    try {
      const admin_id = Number(localStorage.getItem('userid'))
      const { data } = await axios.post(`${BASE}/create`, {
        admin_id,
        action,
        message,
        meta,
        type,
        target_id,
      })
      if (data) {
        auditLogs.value.unshift(data)
      }
      if (stats.value) stats.value.total++
    } catch (e) {
      console.error('Log yozishda xatolik:', e)
    }
  }

  // ─── Barcha loglarni tozalash ─────────────────────────────
  // Backend: DELETE /audit-logs/delete
  async function clearAllLogs() {
    try {
      await axios.delete(`${BASE}/delete`)
    } catch (e) {
      console.error('Loglarni tozalashda xatolik:', e)
    } finally {
      auditLogs.value = []
      stats.value = { total: 0, today: 0, role: 0, block: 0, export: 0 }
    }
  }

  return {
    auditLogs,
    stats,
    loading,
    total,
    fetchLogs,
    fetchStats,
    fetchByTarget,
    addAuditLog,
    clearAllLogs,
  }
}
