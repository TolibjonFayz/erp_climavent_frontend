import { defineStore } from 'pinia'
import skladApi from '@/api/sklad'
import { runRequest } from './helpers'

// Harakat turlari: qoldiqqa ta'siri (+/-) va rang/belgi uchun
export const MOVE_TYPES = {
  in: { sign: 1, tone: 'in' },
  out: { sign: -1, tone: 'out' },
  reserve: { sign: -1, tone: 'reserve' },
  release: { sign: 1, tone: 'release' },
  adjust: { sign: 1, tone: 'adjust' },
  snapshot: { sign: 0, tone: 'snapshot' },
}

// Mahsulot holati: tugagan / manfiy / kam qolgan / bor
export function stockStatus(row) {
  const qty = Number(row.closing) || 0
  if (qty < 0) return 'negative'
  if (qty === 0) return 'empty'
  if (row.min_qty != null && qty <= Number(row.min_qty)) return 'low'
  return 'ok'
}

export const useSkladStore = defineStore('sklad', {
  state: () => ({
    period: '',
    periods: [],
    mode: 'mirror',
    lastSyncedAt: null,
    items: [],
    movements: [],
    movementsPeriod: '',
    contracts: [],
    sources: [],
    isLoading: false,
    error: null,
  }),
  getters: {
    groups: (state) => {
      const map = new Map()
      for (const it of state.items) {
        const g = it.group_name || '—'
        map.set(g, (map.get(g) || 0) + 1)
      }
      return [...map.entries()].map(([name, count]) => ({ name, count }))
    },
  },
  actions: {
    async loadReport(period) {
      const res = await runRequest(this, () => skladApi.getReport(period || this.period), 'Report failed')
      this.period = res.period
      this.periods = res.periods || []
      this.mode = res.mode
      this.lastSyncedAt = res.last_synced_at
      this.items = res.items || []
      return res
    },

    async loadMovements(force = false) {
      if (!force && this.movementsPeriod === this.period && this.movements.length) return this.movements
      const res = await runRequest(this, () => skladApi.getMovements({ period: this.period }), 'Movements failed')
      this.movements = Array.isArray(res) ? res : []
      this.movementsPeriod = this.period
      return this.movements
    },

    async loadContracts() {
      const res = await runRequest(this, () => skladApi.getContracts(), 'Contracts failed')
      this.contracts = Array.isArray(res) ? res : []
      return this.contracts
    },

    async loadSources() {
      const res = await runRequest(this, () => skladApi.getSources(), 'Sources failed')
      this.sources = Array.isArray(res) ? res : []
      return this.sources
    },

    getItem(id) {
      return skladApi.getItem(id)
    },

    async createMovement(payload) {
      const res = await runRequest(this, () => skladApi.createMovement(payload), 'Create movement failed')
      await Promise.all([this.loadReport(), this.loadMovements(true)])
      return res
    },

    async removeMovement(id) {
      await runRequest(this, () => skladApi.removeMovement(id), 'Delete movement failed')
      await Promise.all([this.loadReport(), this.loadMovements(true)])
    },

    async createItem(payload) {
      const res = await runRequest(this, () => skladApi.createItem(payload), 'Create item failed')
      await this.loadReport()
      return res
    },

    async updateItem(id, payload) {
      const res = await runRequest(this, () => skladApi.updateItem(id, payload), 'Update item failed')
      await this.loadReport()
      return res
    },

    async setMode(mode) {
      const res = await runRequest(this, () => skladApi.updateSettings({ mode }), 'Settings failed')
      this.mode = res.mode
      return res
    },

    async addSource(payload) {
      await runRequest(this, () => skladApi.addSource(payload), 'Add source failed')
      return this.loadSources()
    },

    async removeSource(id) {
      await runRequest(this, () => skladApi.removeSource(id), 'Remove source failed')
      return this.loadSources()
    },

    async sync(sourceId) {
      const res = await runRequest(
        this,
        () => skladApi.sync(sourceId ? { source_id: sourceId } : {}),
        'Sync failed',
      )
      this.movementsPeriod = ''
      await Promise.all([this.loadReport(), this.loadSources(), this.loadContracts()])
      return res
    },
  },
})
