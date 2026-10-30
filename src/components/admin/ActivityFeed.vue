<template>
  <div class="af">
    <!-- Filtrlar -->
    <div class="af-filters">
      <el-input
        v-model="search"
        :prefix-icon="Search"
        clearable
        placeholder="Qidiruv: nom, IP, maydon qiymati..."
        class="af-search"
      />
      <el-select v-if="!userId" v-model="filters.user_id" clearable filterable placeholder="Xodim" class="af-sel">
        <el-option v-for="u in users" :key="u.id" :label="`${u.firstname || ''} ${u.lastname || ''} (@${u.username})`" :value="u.id" />
      </el-select>
      <el-select v-model="filters.action" clearable placeholder="Amal turi" class="af-sel">
        <el-option v-for="g in ACTION_GROUPS" :key="g.value" :label="g.label" :value="g.value" />
      </el-select>
      <el-select v-model="filters.module" clearable filterable placeholder="Bo'lim" class="af-sel">
        <el-option v-for="(label, key) in MODULES" :key="key" :label="label" :value="key" />
      </el-select>
      <el-date-picker
        v-model="filters.range"
        type="daterange"
        value-format="YYYY-MM-DD"
        format="DD.MM.YYYY"
        start-placeholder="Dan"
        end-placeholder="Gacha"
        class="af-range"
      />
      <el-checkbox v-model="filters.onlyErrors" class="af-err">Faqat rad etilganlar</el-checkbox>
    </div>

    <div class="af-count">
      <span v-if="!loading">Jami: <b>{{ fmtNum(total) }}</b> ta yozuv</span>
      <el-button text size="small" :icon="RefreshLeft" @click="reload">Yangilash</el-button>
    </div>

    <div v-if="loading" class="af-skel"><el-skeleton :rows="6" animated /></div>

    <template v-else>
      <div v-for="g in groups" :key="g.day" class="af-day">
        <div class="af-day__title">{{ g.label }}</div>
        <div
          v-for="row in g.items"
          :key="row.id"
          class="af-item"
          :class="[`is-${actionMeta(row.action).color}`, { 'is-failed': !row.ok, 'is-open': open.has(row.id) }]"
        >
          <button type="button" class="af-item__head" @click="toggle(row.id)">
            <span class="af-dot"><el-icon><component :is="iconOf(row.action)" /></el-icon></span>
            <span class="af-main">
              <span class="af-title">
                <b v-if="!userId && row.user" class="af-who">{{ row.user.firstname }} {{ row.user.lastname }}</b>
                <b v-else-if="!userId" class="af-who">{{ row.payload?.username ? '@' + row.payload.username : "Noma'lum" }}</b>
                {{ describe(row) }}
              </span>
              <span class="af-meta">
                <span>{{ timeOf(row.createdAt) }}</span>
                <span class="af-chip">{{ moduleLabel(row.module) }}</span>
                <span class="af-dev">
                  <el-icon><component :is="row.platform === 'mobile' ? Iphone : Monitor" /></el-icon>
                  {{ deviceText(row) }}
                </span>
                <span v-if="row.ip">IP {{ row.ip }}</span>
                <span v-if="!row.ok" class="af-bad">Rad etildi{{ row.status ? ` (${row.status})` : '' }}</span>
              </span>
            </span>
            <el-icon class="af-caret"><ArrowDown /></el-icon>
          </button>

          <div v-if="open.has(row.id)" class="af-body">
            <div v-if="row.error" class="af-error">{{ row.error }}</div>

            <div v-for="(c, i) in row.changes || []" :key="i" class="af-change">
              <template v-if="c.more">
                <div class="af-change__head">… yana {{ c.more }} ta o'zgarish</div>
              </template>
              <template v-else>
                <div class="af-change__head">
                  <span class="af-op" :class="`op-${opColor(c.op)}`">{{ OPS[c.op] || c.op }}</span>
                  {{ tableLabel(c.table) || c.table }}
                  <span v-if="c.id != null" class="af-faint">#{{ c.id }}</span>
                  <b v-if="c.label">«{{ c.label }}»</b>
                  <span v-if="c.count" class="af-faint">· {{ fmtNum(c.count) }} ta qator</span>
                </div>
                <table v-if="c.op === 'update' && c.fields" class="af-diff">
                  <tr v-for="(v, f) in c.fields" :key="f">
                    <td class="af-diff__f">{{ fieldLabel(f) }}</td>
                    <td class="af-diff__old">{{ fmtValue(v?.[0]) }}</td>
                    <td class="af-diff__arrow">→</td>
                    <td class="af-diff__new">{{ fmtValue(v?.[1]) }}</td>
                  </tr>
                </table>
                <table v-else-if="c.fields" class="af-diff">
                  <tr v-for="(v, f) in c.fields" :key="f">
                    <td class="af-diff__f">{{ fieldLabel(f) }}</td>
                    <td class="af-diff__arrow">→</td>
                    <td class="af-diff__new" colspan="2">{{ fmtValue(v) }}</td>
                  </tr>
                </table>
                <dl v-if="c.data" class="af-data">
                  <template v-for="(v, f) in c.data" :key="f">
                    <template v-if="v !== null && v !== '' && !(typeof v === 'object' && !Object.keys(v).length)">
                      <dt>{{ fieldLabel(f) }}</dt>
                      <dd>{{ fmtValue(v) }}</dd>
                    </template>
                  </template>
                </dl>
                <div v-if="c.where && !c.data" class="af-faint af-where">Shart: {{ fmtValue(c.where) }}</div>
              </template>
            </div>

            <details v-if="row.payload && !(row.changes || []).length" class="af-payload" open>
              <summary>Yuborilgan ma'lumot</summary>
              <pre>{{ JSON.stringify(row.payload, null, 2) }}</pre>
            </details>
            <details v-else-if="row.payload" class="af-payload">
              <summary>Yuborilgan ma'lumot</summary>
              <pre>{{ JSON.stringify(row.payload, null, 2) }}</pre>
            </details>

            <div class="af-tech">
              <span v-if="row.method">{{ row.method }} {{ row.path }}</span>
              <span v-if="row.status">Javob: {{ row.status }}</span>
              <span v-if="row.duration_ms != null">{{ row.duration_ms }} ms</span>
              <span>{{ fullTime(row.createdAt) }}</span>
              <span v-if="row.user_agent" class="af-ua" :title="row.user_agent">{{ row.user_agent }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!rows.length" :image-size="70" description="Bu filtr bo'yicha yozuv yo'q" />

      <div v-if="rows.length < total" ref="sentinel" class="af-more">
        <el-button :loading="loadingMore" @click="loadMore">
          Yana yuklash ({{ fmtNum(total - rows.length) }} ta qoldi)
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowDown,
  Back,
  Delete,
  Download,
  Edit,
  Iphone,
  Key,
  Lock,
  Monitor,
  Operation,
  Plus,
  RefreshLeft,
  Search,
  StarFilled,
  SwitchButton,
  Unlock,
  Upload,
  View,
  WarningFilled,
} from '@element-plus/icons-vue'
import activityApi from '@/api/activity'
import { fmtNum, formatDate } from '@/utils/format'
import {
  MODULES,
  actionMeta,
  describe,
  deviceText,
  fieldLabel,
  fmtValue,
  moduleLabel,
  tableLabel,
} from '@/utils/activity'

const props = defineProps({
  // Berilsa — faqat shu xodimning amallari
  userId: { type: Number, default: null },
  // Umumiy jurnalda xodim bo'yicha filtr uchun
  users: { type: Array, default: () => [] },
})

const PAGE = 50
const ICONS = { SwitchButton, Back, WarningFilled, Lock, Plus, Edit, Delete, Upload, Download, Key, View, StarFilled, Unlock, Operation }
const iconOf = (a) => ICONS[actionMeta(a).icon] || Operation

const ACTION_GROUPS = [
  { value: 'login,logout,login_failed,login_blocked', label: 'Kirish va chiqish' },
  { value: 'login_failed,login_blocked', label: 'Muvaffaqiyatsiz kirishlar' },
  { value: 'create', label: "Qo'shish" },
  { value: 'update,password,role,block,unblock', label: "O'zgartirish" },
  { value: 'delete', label: "O'chirish" },
  { value: 'import,export', label: 'Import / eksport' },
  { value: 'view', label: "Ko'rish (admin)" },
]
const OPS = {
  create: "qo'shildi",
  update: "o'zgardi",
  delete: "o'chirildi",
  upsert: 'saqlandi',
  bulk_create: "ko'p qator qo'shildi",
  bulk_update: "ko'p qator o'zgardi",
  bulk_delete: "ko'p qator o'chirildi",
}
const opColor = (op) => (/create/.test(op) ? 'good' : /delete/.test(op) ? 'bad' : 'warn')

const filters = reactive({ user_id: null, action: '', module: '', range: null, onlyErrors: false })
const search = ref('')
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const open = ref(new Set())

function params(offset) {
  const p = { limit: PAGE, offset }
  const uid = props.userId || filters.user_id
  if (uid) p.user_id = uid
  if (filters.action) p.action = filters.action
  if (filters.module) p.module = filters.module
  if (filters.onlyErrors) p.ok = 'false'
  if (filters.range?.[0]) p.from = filters.range[0]
  if (filters.range?.[1]) p.to = filters.range[1]
  if (search.value.trim()) p.search = search.value.trim()
  return p
}

let seq = 0
async function reload() {
  const my = ++seq
  loading.value = true
  try {
    const res = await activityApi.list(params(0))
    if (my !== seq) return
    rows.value = res?.data || []
    total.value = res?.total || 0
    open.value = new Set()
  } finally {
    if (my === seq) loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || rows.value.length >= total.value) return
  loadingMore.value = true
  const my = seq
  try {
    const res = await activityApi.list(params(rows.value.length))
    if (my !== seq) return
    const seen = new Set(rows.value.map((r) => r.id))
    rows.value = rows.value.concat((res?.data || []).filter((r) => !seen.has(r.id)))
    total.value = res?.total ?? total.value
  } finally {
    loadingMore.value = false
  }
}

function toggle(id) {
  const s = new Set(open.value)
  s.has(id) ? s.delete(id) : s.add(id)
  open.value = s
}

const pad = (n) => String(n).padStart(2, '0')
const timeOf = (v) => {
  const d = new Date(v)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fullTime = (v) => {
  const d = new Date(v)
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const groups = computed(() => {
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))
  const out = []
  for (const r of rows.value) {
    const day = formatDate(r.createdAt)
    let g = out[out.length - 1]
    if (!g || g.day !== day) {
      g = { day, label: day === today ? `Bugun · ${day}` : day === yesterday ? `Kecha · ${day}` : day, items: [] }
      out.push(g)
    }
    g.items.push(r)
  }
  return out
})

watch(filters, reload, { deep: true })
let searchTimer
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
})
watch(() => props.userId, reload)

// Pastga yetganda keyingi sahifa o'zi yuklanadi (tugma — zaxira)
const sentinel = ref(null)
let observer
onMounted(() => {
  reload()
  observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) loadMore()
  })
})
watch(sentinel, (el, old) => {
  if (old) observer?.unobserve(old)
  if (el) observer?.observe(el)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(searchTimer)
})

defineExpose({ reload })
</script>

<style scoped>
.af-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.af-search {
  flex: 1 1 220px;
  min-width: 200px;
}
.af-sel {
  width: 170px;
}
.af-range {
  max-width: 260px;
}
.af-err {
  margin-left: 4px;
}
.af-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 6px;
  font-size: 13px;
  color: var(--ui-muted);
}
.af-skel {
  padding: 8px 0;
}
.af-day__title {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ui-muted);
  background: var(--ui-surface);
}
.af-item {
  border: 1px solid var(--ui-line-soft);
  border-radius: var(--ui-radius);
  margin-bottom: 6px;
  background: var(--ui-surface);
  overflow: hidden;
}
.af-item.is-failed {
  border-color: var(--ui-bad-line);
}
.af-item__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--ui-ink);
}
.af-item__head:hover {
  background: var(--ui-row-hover);
}
.af-dot {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 15px;
  background: var(--ui-surface-2);
  color: var(--ui-muted);
}
.is-good .af-dot { background: var(--ui-good-soft); color: var(--ui-good); }
.is-bad .af-dot { background: var(--ui-bad-soft); color: var(--ui-bad); }
.is-warn .af-dot { background: var(--ui-warn-soft); color: var(--ui-warn-ink); }
.is-link .af-dot { background: var(--ui-link-soft); color: var(--ui-link); }
.is-violet .af-dot { background: var(--ui-violet-soft); color: var(--ui-violet-ink); }
.af-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.af-title {
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}
.af-who {
  margin-right: 4px;
}
.af-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12px;
  color: var(--ui-muted);
}
.af-chip {
  padding: 0 6px;
  border-radius: 6px;
  background: var(--ui-surface-2);
}
.af-dev {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.af-bad {
  color: var(--ui-bad);
  font-weight: 600;
}
.af-caret {
  flex: none;
  margin-top: 6px;
  color: var(--ui-faint);
  transition: transform 0.15s;
}
.is-open .af-caret {
  transform: rotate(180deg);
}
.af-body {
  padding: 4px 12px 12px 50px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}
.af-error {
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--ui-bad-soft);
  color: var(--ui-bad);
}
.af-change__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.af-op {
  padding: 0 7px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.op-good { background: var(--ui-good-soft); color: var(--ui-good); }
.op-bad { background: var(--ui-bad-soft); color: var(--ui-bad); }
.op-warn { background: var(--ui-warn-soft); color: var(--ui-warn-ink); }
.af-faint {
  color: var(--ui-faint);
}
.af-diff {
  border-collapse: collapse;
  width: 100%;
}
.af-diff td {
  padding: 4px 6px;
  border-top: 1px solid var(--ui-line-soft);
  vertical-align: top;
  word-break: break-word;
}
.af-diff__f {
  width: 130px;
  color: var(--ui-muted);
}
.af-diff__old {
  color: var(--ui-bad);
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
}
.af-diff__arrow {
  width: 18px;
  color: var(--ui-faint);
}
.af-diff__new {
  color: var(--ui-good);
  font-weight: 500;
}
.af-data {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 2px 10px;
  margin: 0;
}
.af-data dt {
  color: var(--ui-muted);
}
.af-data dd {
  margin: 0;
  word-break: break-word;
}
.af-where {
  font-size: 12px;
  word-break: break-all;
}
.af-payload summary {
  cursor: pointer;
  color: var(--ui-link);
  font-size: 12px;
}
.af-payload pre {
  margin: 6px 0 0;
  padding: 8px 10px;
  max-height: 260px;
  overflow: auto;
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
.af-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: var(--ui-faint);
}
.af-ua {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.af-more {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}
@media (max-width: 640px) {
  .af-sel,
  .af-range {
    width: 100%;
    max-width: none;
  }
  .af-body {
    padding-left: 12px;
  }
}
</style>
