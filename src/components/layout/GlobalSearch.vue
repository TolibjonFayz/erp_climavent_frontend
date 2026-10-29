<template>
  <el-dialog
    :model-value="modelValue"
    width="620px"
    class="gs-dialog"
    :show-close="false"
    align-center
    @update:model-value="(v) => emit('update:modelValue', v)"
    @opened="onOpened"
  >
    <div class="gs-input">
      <el-icon class="gs-input__icon"><Search /></el-icon>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="$t('gsPlaceholder')"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="open(flat[active])"
      />
      <span v-if="loading" class="gs-input__loading">{{ $t('gsLoading') }}</span>
      <kbd class="gs-kbd">Esc</kbd>
    </div>

    <div class="gs-results">
      <p v-if="!query.trim()" class="gs-empty">{{ $t('gsHint') }}</p>
      <p v-else-if="!flat.length && !loading" class="gs-empty">{{ $t('gsNothing') }}</p>
      <template v-for="g in groups" :key="g.key">
        <div class="gs-group">{{ $t(g.label) }} · {{ g.total }}</div>
        <button
          v-for="r in g.items"
          :key="r.key"
          type="button"
          class="gs-item"
          :class="{ 'is-active': flat[active]?.key === r.key }"
          @mouseenter="active = flat.findIndex((x) => x.key === r.key)"
          @click="open(r)"
        >
          <span class="gs-item__title">{{ r.title }}</span>
          <span class="gs-item__sub">{{ r.sub }}</span>
        </button>
      </template>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useKPsStore } from '@/stores/kp'
import { useDogovorStore } from '@/stores/dogovor'
import { useLoyihaStore } from '@/stores/loyiha'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/user'
import { formatLoyihaId } from '@/utils/loyihaFormat'
import { formatDate } from '@/utils/format'

// Ctrl+K: mijoz, obyekt, KP, shartnoma, loyiha va vazifalar bo'yicha bitta joydan qidirish.
// Ma'lumot birinchi ochilganda yuklanadi; sahifa allaqachon yuklagan bo'lsa shu ishlatiladi.
const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const PER_GROUP = 5
const router = useRouter()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const sitesStore = useComeAndGoesStore()
const insideStore = useComeAndGoInsideStore()
const kpStore = useKPsStore()
const dogovorStore = useDogovorStore()
const loyihaStore = useLoyihaStore()
const tasksStore = useTasksStore()

const inputRef = ref(null)
const query = ref('')
const active = ref(0)
const loading = ref(false)
let loaded = false

const userId = () => Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)
// Sidebar bilan bir xil qoida: ruxsat aniq false bo'lmasa — bor
const can = (key) => usersStore.currentUser?.permissions?.[key] !== false

async function loadSources() {
  if (loaded) return
  loaded = true
  loading.value = true
  const jobs = []
  if (can('customers')) {
    jobs.push(
      isAdmin.value
        ? partnersStore.allPartners.length || partnersStore.getAllPartners()
        : partnersStore.allPartnersofUser.length || partnersStore.getAllPartnersOfUser(userId()),
    )
  }
  if (can('sites')) {
    jobs.push(
      isAdmin.value
        ? insideStore.allComeAndGoInsides.length || insideStore.getAllComeAndGoInside()
        : sitesStore.allComeAndGoesofUser.length || sitesStore.getComeAndGoesOfUser(userId()),
    )
  }
  if (can('kp')) jobs.push(kpStore.allKPs.length || kpStore.getAllKPs())
  if (can('dogovor')) jobs.push(dogovorStore.allDogovors.length || dogovorStore.getAllDogovors())
  if (can('loyiha')) jobs.push(loyihaStore.allLoyihas.length || loyihaStore.getAllLoyihas())
  // Bitta manba yiqilsa qolganlari ishlayversin
  await Promise.allSettled(jobs)
  loading.value = false
}

const norm = (v) => String(v ?? '').toLowerCase()
const digits = (v) => String(v ?? '').replace(/\D/g, '')

// So'rovning har bir so'zi kamida bitta maydonda bo'lsin; raqamlar telefon/INN uchun belgisiz solishtiriladi
function matches(fields, q) {
  const text = fields.map(norm).join(' ')
  const textDigits = fields.map(digits).join(' ')
  return q.words.every((w) => text.includes(w) || (/^\d{3,}$/.test(w) && textDigits.includes(w)))
}

const sources = computed(() => {
  const list = []
  if (can('customers')) {
    const rows = isAdmin.value ? partnersStore.allPartners : partnersStore.allPartnersofUser
    list.push({
      key: 'customers',
      label: 'gsCustomers',
      rows: rows || [],
      fields: (p) => [p.fullname, p.inn, p.phone_number, p.additional_phone_number, p.viloyat, p.shahar_tuman],
      item: (p) => ({
        title: p.fullname || '—',
        sub: [p.phone_number, p.inn && `INN ${p.inn}`, p.viloyat].filter(Boolean).join(' · '),
        to: `/customers/${p.id}`,
      }),
    })
  }
  if (can('sites')) {
    // Admin: barcha tashriflar (ichki yozuvlar), xodim: o'z obyektlari (birinchi tashrif ma'lumoti)
    const rows = isAdmin.value
      ? (insideStore.allComeAndGoInsides || []).filter((v) => v.come_and_go_father_id)
      : (sitesStore.allComeAndGoesofUser || []).map((s) => ({
          ...(s.comeAndGoInsides?.[0] || {}),
          come_and_go_father_id: s.id,
        }))
    list.push({
      key: 'sites',
      label: 'gsSites',
      rows,
      fields: (v) => [v.company_name, v.client_name, v.whereto, v.locationname, v.dogovorkp_number],
      item: (v) => ({
        title: v.company_name || v.whereto || '—',
        sub: [v.whereto, v.locationname, v.when_gone && formatDate(v.when_gone)].filter(Boolean).join(' · '),
        to: `/sites/${v.come_and_go_father_id}`,
      }),
    })
  }
  if (can('kp')) {
    list.push({
      key: 'kp',
      label: 'gsKp',
      rows: kpStore.allKPs || [],
      fields: (k) => [k.kp_number, k.client_name, k.manager_name],
      item: (k) => ({
        title: `KP №${k.kp_number || '—'} · ${k.client_name || ''}`,
        sub: [k.manager_name, k.kp_date && formatDate(k.kp_date)].filter(Boolean).join(' · '),
        to: { path: '/kp', query: { n: String(k.kp_number || '') } },
      }),
    })
  }
  if (can('dogovor')) {
    list.push({
      key: 'dogovor',
      label: 'gsDogovor',
      rows: dogovorStore.allDogovors || [],
      fields: (d) => [d.dogovor_number, d.client_name, d.client_inn, d.client_phone, d.manager_name],
      item: (d) => ({
        title: `№${d.dogovor_number || '—'} · ${d.client_name || ''}`,
        sub: [d.dogovor_date && formatDate(d.dogovor_date), d.client_inn && `INN ${d.client_inn}`, d.manager_name]
          .filter(Boolean)
          .join(' · '),
        // Raqam har yili takrorlanadi — sana bilan aniq shartnoma ochiladi
        to: {
          path: '/dogovor',
          query: { n: String(d.dogovor_number || ''), d: d.dogovor_date ? formatDate(d.dogovor_date) : undefined },
        },
      }),
    })
  }
  if (can('loyiha')) {
    list.push({
      key: 'loyiha',
      label: 'gsLoyiha',
      rows: loyihaStore.allLoyihas || [],
      fields: (l) => [
        formatLoyihaId(l.order_number),
        l.order_number,
        l.manager_name,
        l.contact_phone,
        l.contact_address,
        l.system_info,
        l.kp_number,
        l.dogovor_number,
      ],
      item: (l) => ({
        title: `${formatLoyihaId(l.order_number)} · ${l.system_info || l.contact_address || ''}`,
        sub: [l.manager_name, l.contact_phone].filter(Boolean).join(' · '),
        to: `/loyiha/${l.id}`,
      }),
    })
  }
  if (can('tasks')) {
    list.push({
      key: 'tasks',
      label: 'gsTasks',
      rows: isAdmin.value ? tasksStore.allTasks : tasksStore.myTasks,
      fields: (t) => [t.title, t.description],
      item: (t) => ({ title: t.title, sub: t.description || '', to: '/tasks' }),
    })
  }
  return list
})

const groups = computed(() => {
  const words = norm(query.value).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const q = { words }
  return sources.value
    .map((s) => {
      const found = (s.rows || []).filter((r) => matches(s.fields(r), q))
      return {
        key: s.key,
        label: s.label,
        total: found.length,
        items: found.slice(0, PER_GROUP).map((r, i) => ({ key: `${s.key}-${r.id ?? i}`, ...s.item(r) })),
      }
    })
    .filter((g) => g.total)
})

const flat = computed(() => groups.value.flatMap((g) => g.items))
watch(query, () => (active.value = 0))

function move(step) {
  if (!flat.value.length) return
  active.value = (active.value + step + flat.value.length) % flat.value.length
}

function open(r) {
  if (!r) return
  emit('update:modelValue', false)
  router.push(r.to)
}

// Ma'lumotni ochilish animatsiyasini kutmasdan yuklaymiz, fokus — oyna ko'ringach
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    loadSources()
    await nextTick()
    inputRef.value?.focus()
  },
)

async function onOpened() {
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}
</script>

<style scoped>
.gs-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--ui-line);
}
.gs-input__icon {
  font-size: 18px;
  color: var(--ui-muted);
}
.gs-input input {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-size: 16px;
  color: var(--ui-ink);
  background: transparent !important;
  border: none;
  outline: none;
}
.gs-input__loading {
  font-size: 12px;
  color: var(--ui-muted);
}
.gs-kbd {
  padding: 1px 6px;
  font-size: 11px;
  color: var(--ui-muted);
  border: 1px solid var(--ui-line);
  border-radius: 4px;
}
.gs-results {
  max-height: 60vh;
  margin-top: 8px;
  overflow-y: auto;
}
.gs-empty {
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ui-muted);
}
.gs-group {
  padding: 12px 8px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ui-muted);
}
.gs-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  font: inherit;
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.gs-item.is-active {
  background: var(--ui-surface-2);
  box-shadow: inset 3px 0 0 var(--ui-link, #2a78d6);
}
.gs-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}
.gs-item__sub {
  font-size: 12px;
  color: var(--ui-muted);
}
</style>
