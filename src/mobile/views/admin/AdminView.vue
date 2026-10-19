<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useAuditLog } from '@/composables/useAuditLog'
import { fmtNum, formatDateTime, telHref } from '@/utils/format'
import { partnerTypeLabel } from '@/utils/partners'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import { PARTNER_GROUPS } from '../customers/groups'
import { BOSS_USER_ID, currentUserId } from '../../session'
import { avatarColor, errorText, includesText, initials, smartDate } from '../../utils'
import { whereTone } from '../sites/siteData'
import { exportExcel } from '../../exporter'
import AppReleases from './AppReleases.vue'

const { t, locale } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const insideStore = useComeAndGoInsideStore()
const { auditLogs, stats: auditStats, fetchLogs, fetchStats, fetchByTarget, addAuditLog } = useAuditLog()

const tab = ref('overview')
const TABS = computed(() => [
  { key: 'overview', label: t('m.admOverview') },
  { key: 'users', label: t('m.admUsers') },
  { key: 'partners', label: t('m.admPartners') },
  { key: 'objects', label: t('m.admObjects') },
  { key: 'audit', label: t('m.admAudit') },
  { key: 'releases', label: t('m.admReleases') },
])

const loading = ref(true)
async function load() {
  await Promise.allSettled([
    usersStore.getAllUsers(),
    partnersStore.getAllPartners(),
    insideStore.getAllComeAndGoInside(),
    fetchLogs({ limit: 100 }),
    fetchStats(),
  ])
  loading.value = false
}
onMounted(load)

const users = computed(() => usersStore.allUsers || [])
const partners = computed(() => partnersStore.allPartners || [])
const objects = computed(() =>
  [...(insideStore.allComeAndGoInsides || [])].sort(
    (a, b) => new Date(b.when_gone || b.createdAt) - new Date(a.when_gone || a.createdAt),
  ),
)
const nameOf = (u) => (u ? `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.username : '—')

// ─── Umumiy ───
const overviewStats = computed(() => [
  {
    key: 'users',
    label: t('m.admUsers'),
    value: fmtNum(users.value.length),
    sub: t('bsAdminsSub', { n: users.value.filter((u) => u.is_admin).length }),
    onClick: () => (tab.value = 'users'),
  },
  { key: 'partners', label: t('m.admPartners'), value: fmtNum(partners.value.length), onClick: () => (tab.value = 'partners') },
  { key: 'objects', label: t('m.admObjects'), value: fmtNum(objects.value.length), onClick: () => (tab.value = 'objects') },
  {
    key: 'audit',
    label: t('m.admAudit'),
    value: fmtNum(auditStats.value?.total ?? auditLogs.value.length),
    sub: t('m.admTodayN', { n: auditStats.value?.today ?? 0 }),
    onClick: () => (tab.value = 'audit'),
  },
])

// Eng faol xodimlar: qo'shgan mijoz + obyektlar soni (saytdagi topActiveUsers)
const activeUsers = computed(() => {
  const map = {}
  for (const u of users.value) map[u.username] = { ...u, partners: 0, objects: 0 }
  for (const p of partners.value) {
    const un = p.user?.username
    if (un) (map[un] ||= { ...p.user, partners: 0, objects: 0 }).partners++
  }
  for (const o of insideStore.allComeAndGoInsides || []) {
    const un = o.come_and_go_father?.user?.username
    if (un) (map[un] ||= { ...o.come_and_go_father.user, partners: 0, objects: 0 }).objects++
  }
  return Object.values(map)
    .map((u) => ({ ...u, total: u.partners + u.objects }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
})

// ─── Xodimlar ───
const userSearch = ref('')
const userFilter = ref('') // admin | user | blocked
const filteredUsers = computed(() =>
  users.value.filter((u) => {
    if (userFilter.value === 'admin' && !u.is_admin) return false
    if (userFilter.value === 'user' && u.is_admin) return false
    if (userFilter.value === 'blocked' && !u.is_blocked) return false
    const q = userSearch.value.trim()
    return !q || ['firstname', 'lastname', 'username', 'phone_number'].some((k) => includesText(u[k], q))
  }),
)

const selected = ref(null)
const userOpen = computed({
  get: () => !!selected.value,
  set: (v) => !v && (selected.value = null),
})
const userLogs = ref([])
const logsLoading = ref(false)

async function openUser(u) {
  selected.value = u
  userLogs.value = []
  logsLoading.value = true
  try {
    userLogs.value = await fetchByTarget(u.username)
  } finally {
    logsLoading.value = false
  }
}

const isSelf = computed(() => Number(selected.value?.id) === currentUserId())
const busy = ref(false)

async function toggleAdmin(u) {
  const next = !u.is_admin
  try {
    await showConfirmDialog({
      message: `${nameOf(u)} (@${u.username}) — ${next ? t('m.makeAdmin') : t('m.removeAdmin')}?`,
      confirmButtonText: t('yeah'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  busy.value = true
  try {
    await usersStore.updateUser(u.id, { is_admin: next })
    u.is_admin = next
    addAuditLog({
      action: 'role',
      message: `"${nameOf(u)}" (@${u.username}) — ${next ? 'Admin qilindi' : 'Admin roli olib tashlandi'}`,
      type: next ? 'success' : 'warning',
      target_id: u.id,
    })
    showSuccessToast(t('m.saved'))
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    busy.value = false
  }
}

async function toggleBlock(u) {
  const next = !u.is_blocked
  try {
    await showConfirmDialog({
      message: `${nameOf(u)} (@${u.username}) — ${next ? t('m.block') : t('m.unblock')}?`,
      confirmButtonText: t('yeah'),
      cancelButtonText: t('cancel'),
      confirmButtonColor: next ? '#b91c1c' : undefined,
    })
  } catch {
    return
  }
  busy.value = true
  try {
    await usersStore.updateUser(u.id, { is_blocked: next })
    u.is_blocked = next
    addAuditLog({
      action: next ? 'block' : 'unblock',
      message: `"${nameOf(u)}" (@${u.username}) — ${next ? 'Bloklandi' : 'Blok ochildi'}`,
      type: next ? 'danger' : 'success',
      target_id: u.id,
    })
    showSuccessToast(t('m.saved'))
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    busy.value = false
  }
}

// Ruxsatlar (saytdagi AdminPanel permissionPages / hasPermission bilan bir xil)
const PERMISSION_PAGES = [
  { key: 'customers', labelKey: 'm.tabCustomers' },
  { key: 'sites', labelKey: 'm.tabSites' },
  { key: 'competitors', labelKey: 'm.competitors' },
  { key: 'kp', labelKey: 'kp' },
  { key: 'dogovor', labelKey: 'dogovortext' },
  { key: 'loyiha', labelKey: 'loyihatext' },
  { key: 'attendance', labelKey: 'm.tabAttendance' },
  { key: 'tasks', labelKey: 'm.tabTasks' },
  { key: 'boss', labelKey: 'm.bossPanel' },
]
const hasPermission = (u, key) => {
  if (key === 'boss') return u.permissions?.boss !== undefined ? !!u.permissions.boss : Number(u.id) === BOSS_USER_ID
  return u.permissions?.[key] !== false
}
const savingPerm = reactive({})
async function setPermission(u, key, val) {
  const perms = { ...(u.permissions || {}), [key]: val }
  savingPerm[key] = true
  try {
    await usersStore.updateUser(u.id, { permissions: perms })
    u.permissions = perms
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    savingPerm[key] = false
  }
}

// ─── Hamkorlar (barcha xodimlarniki) ───
const partnerSearch = ref('')
const partnerType = ref('')
const partnerUser = ref('')
const partnerUsers = computed(() => [...new Set(partners.value.map((p) => p.user?.firstname).filter(Boolean))])
const filteredPartners = computed(() => {
  const q = partnerSearch.value.trim()
  return partners.value
    .filter(
      (p) =>
        (!partnerType.value || p.partner_type === partnerType.value) &&
        (!partnerUser.value || p.user?.firstname === partnerUser.value) &&
        (!q || ['fullname', 'phone_number', 'additional_phone_number', 'inn'].some((k) => includesText(p[k], q))),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// ─── Obyektlar (barcha xodimlarniki) ───
const objectSearch = ref('')
const objectUser = ref('')
const objectUsers = computed(() => [
  ...new Set(objects.value.map((o) => o.come_and_go_father?.user?.firstname).filter(Boolean)),
])
const filteredObjects = computed(() => {
  const q = objectSearch.value.trim()
  return objects.value.filter(
    (o) =>
      (!objectUser.value || o.come_and_go_father?.user?.firstname === objectUser.value) &&
      (!q || [o.company_name, o.locationname, o.whereto].some((v) => includesText(v, q))),
  )
})
const objectParentId = (o) => o.come_and_go_father_id || o.come_and_go_father?.id

// ─── Audit ───
const auditSearch = ref('')
const auditAction = ref('')
const ACTIONS = ['role', 'block', 'unblock', 'view', 'export', 'login']
const actionLabel = (a) => t(`m.audit_${a}`) === `m.audit_${a}` ? a : t(`m.audit_${a}`)
const logActor = (l) =>
  (typeof l.actor === 'string' && l.actor) || (l.admin ? nameOf(l.admin) : '') || '—'
const filteredLogs = computed(() =>
  auditLogs.value.filter((l) => {
    const q = auditSearch.value.trim()
    return (
      (!auditAction.value || l.action === auditAction.value) &&
      (!q || includesText(l.message, q) || includesText(`${logActor(l)} ${l.admin?.username || ''}`, q))
    )
  }),
)
const toneOf = (type) => ({ success: 'is-good', danger: 'is-bad', warning: 'is-warn' })[type] || 'is-blue'

// ─── Excel (saytdagi AdminPanel eksportlari bilan bir xil ustunlar) ───
const exporting = ref(false)
const canExport = computed(() => ['users', 'partners', 'objects', 'audit'].includes(tab.value))
async function exportTab() {
  const sheets = {
    users: () => ({
      name: 'Xodimlar',
      rows: filteredUsers.value.map((u, i) => ({
        '№': i + 1,
        ID: u.id,
        Ism: u.firstname || '—',
        Familiya: u.lastname || '—',
        Login: u.username,
        Telefon: u.phone_number || '—',
        Email: u.email || '—',
        Rol: u.is_admin ? 'Admin' : 'Foydalanuvchi',
        Holat: u.is_blocked ? 'Bloklangan' : 'Faol',
      })),
    }),
    partners: () => ({
      name: 'Hamkorlar',
      rows: filteredPartners.value.map((p, i) => ({
        '№': i + 1,
        ID: p.id,
        Turi: partnerTypeLabel(p.partner_type),
        "Kim qo'shgan (Ism)": p.user?.firstname ?? '—',
        "Kim qo'shgan (Username)": p.user?.username ?? '—',
        "To'liq nomi": p.fullname ?? '—',
        Telefon: p.phone_number ?? '—',
        "Qo'shimcha telefon": p.additional_phone_number ?? '—',
        Respublika: p.republic ?? '—',
        Viloyat: p.viloyat ?? '—',
        'Shahar/Tuman': p.shahar_tuman ?? '—',
        'Yuridik/Jismoniy': p.mijozturi ?? '—',
        INN: p.inn ?? '—',
      })),
    }),
    objects: () => ({
      name: 'Obyektlar',
      rows: filteredObjects.value.map((o, i) => ({
        '№': i + 1,
        ID: o.id,
        Qayerga: o.whereto ?? '—',
        "Kim qo'shgan": o.come_and_go_father?.user?.username ?? '—',
        'Ketilgan vaqt': formatDateTime(o.when_gone),
        'Qaytilgan vaqt': formatDateTime(o.when_came),
        'Dogovor / KP': o.dogovor_or_kp ?? '—',
        Manzil: o.locationname ?? '—',
        'Firma nomi': o.company_name ?? '—',
        'Kiritilgan vaqt': formatDateTime(o.createdAt),
      })),
    }),
    audit: () => ({
      name: 'Audit',
      rows: filteredLogs.value.map((l, i) => ({
        '№': i + 1,
        Vaqt: formatDateTime(l.createdAt || l.created_at),
        Amal: actionLabel(l.action),
        Xabar: l.message,
        Bajardi: logActor(l),
      })),
    }),
  }[tab.value]
  if (!sheets) return
  const sheet = sheets()
  if (!sheet.rows.length) return showFailToast(t('m.nothingToExport'))
  exporting.value = true
  try {
    await exportExcel(sheet.name, [sheet])
    addAuditLog({
      action: 'export',
      message: `${sheet.name} ma'lumotlari export qilindi (${sheet.rows.length} ta yozuv, mobil ilova)`,
      type: 'info',
    })
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    exporting.value = false
  }
}

// Ro'yxatlar bo'laklab chiziladi
const PAGE = 40
const shown = ref(PAGE)
const listLoading = ref(false)
watch([tab, userSearch, userFilter, partnerSearch, partnerType, partnerUser, objectSearch, objectUser, auditSearch, auditAction], () => (shown.value = PAGE))
const currentList = computed(
  () =>
    ({ users: filteredUsers.value, partners: filteredPartners.value, objects: filteredObjects.value, audit: filteredLogs.value })[tab.value] || [],
)
const finished = computed(() => shown.value >= currentList.value.length)
function onLoadMore() {
  shown.value += PAGE
  listLoading.value = false
}
</script>

<template>
  <MPage :title="$t('m.webAdmin')" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button v-if="canExport" type="button" class="m-head__btn" :disabled="exporting" @click="exportTab">
        <van-loading v-if="exporting" size="18" />
        <van-icon v-else name="share-o" />
      </button>
    </template>
    <template #header>
      <div class="m-chips">
        <button
          v-for="tb in TABS"
          :key="tb.key"
          type="button"
          class="m-chip"
          :class="{ 'is-active': tab === tb.key }"
          @click="tab = tb.key"
        >
          {{ tb.label }}
        </button>
      </div>
    </template>

    <div v-if="loading">
      <van-skeleton :row="4" class="m-card" style="margin-top: 12px" />
      <van-skeleton :row="6" class="m-card" />
    </div>

    <!-- Umumiy -->
    <template v-else-if="tab === 'overview'">
      <MStats :items="overviewStats" grid />
      <div class="m-section"><span class="m-section__title">{{ $t('m.admActiveUsers') }}</span></div>
      <div class="m-card ad-rank">
        <button v-for="(u, i) in activeUsers" :key="u.username" type="button" class="ad-rank__row" @click="users.find((x) => x.username === u.username) && openUser(users.find((x) => x.username === u.username))">
          <span class="ad-rank__n">{{ i + 1 }}</span>
          <span class="m-avatar is-sm" :style="{ background: avatarColor(nameOf(u)) }">{{ initials(nameOf(u)) }}</span>
          <span class="ad-rank__name">{{ nameOf(u) }}</span>
          <span class="ad-rank__meta m-num"><van-icon name="friends-o" /> {{ u.partners }} <van-icon name="location-o" /> {{ u.objects }}</span>
        </button>
      </div>
      <div class="m-section">
        <span class="m-section__title">{{ $t('m.admRecentAudit') }}</span>
        <button type="button" class="m-section__action" @click="tab = 'audit'">{{ $t('m.all') }} ›</button>
      </div>
      <div class="m-card ad-logs">
        <div v-for="l in auditLogs.slice(0, 6)" :key="l.id" class="ad-log">
          <span class="m-tag" :class="toneOf(l.type)">{{ actionLabel(l.action) }}</span>
          <p>{{ l.message }}</p>
          <small>{{ logActor(l) }} · {{ formatDateTime(l.createdAt || l.created_at) }}</small>
        </div>
        <p v-if="!auditLogs.length" class="m-muted">{{ $t('m.nothingFound') }}</p>
      </div>
    </template>

    <!-- Xodimlar -->
    <template v-else-if="tab === 'users'">
      <van-search v-model="userSearch" shape="round" :placeholder="$t('m.search')" class="ad-search" />
      <div class="m-chips">
        <button v-for="f in ['', 'admin', 'user', 'blocked']" :key="f" type="button" class="m-chip" :class="{ 'is-active': userFilter === f }" @click="userFilter = f">
          {{ f ? $t(`m.admFilter_${f}`) : $t('m.all') }}
        </button>
      </div>
      <van-list v-model:loading="listLoading" :finished="finished" :immediate-check="false" @load="onLoadMore">
        <article v-for="u in filteredUsers.slice(0, shown)" :key="u.id" class="m-card is-tappable ad-user" @click="openUser(u)">
          <img v-if="u.profile_image" :src="u.profile_image" class="ad-user__img" alt="" />
          <span v-else class="m-avatar" :style="{ background: avatarColor(nameOf(u)) }">{{ initials(nameOf(u)) }}</span>
          <div class="ad-user__main">
            <b>{{ nameOf(u) }}</b>
            <small>@{{ u.username }}<template v-if="u.phone_number"> · {{ u.phone_number }}</template></small>
            <div class="ad-user__tags">
              <span v-if="u.is_admin" class="m-tag is-blue">{{ $t('m.admin') }}</span>
              <span v-if="u.is_blocked" class="m-tag is-bad">{{ $t('m.blocked') }}</span>
            </div>
          </div>
          <van-icon name="arrow" class="m-faint" />
        </article>
      </van-list>
      <MEmpty v-if="!filteredUsers.length" icon="manager-o" :title="$t('m.nothingFound')" />
    </template>

    <!-- Hamkorlar -->
    <template v-else-if="tab === 'partners'">
      <van-search v-model="partnerSearch" shape="round" :placeholder="$t('m.searchCustomers')" class="ad-search" />
      <div class="m-chips">
        <button type="button" class="m-chip" :class="{ 'is-active': !partnerType }" @click="partnerType = ''">{{ $t('m.all') }} <span class="m-chip__count">{{ partners.length }}</span></button>
        <button v-for="g in PARTNER_GROUPS" :key="g.value" type="button" class="m-chip" :class="{ 'is-active': partnerType === g.value }" @click="partnerType = partnerType === g.value ? '' : g.value">{{ $t(g.labelKey) }}</button>
      </div>
      <div v-if="partnerUsers.length > 1" class="m-chips">
        <button v-for="n in partnerUsers" :key="n" type="button" class="m-chip" :class="{ 'is-active': partnerUser === n }" @click="partnerUser = partnerUser === n ? '' : n">
          <van-icon name="manager-o" /> {{ n }}
        </button>
      </div>
      <p class="ad-count">{{ $t('m.foundCount', { n: filteredPartners.length }) }}</p>
      <van-list v-model:loading="listLoading" :finished="finished" :immediate-check="false" @load="onLoadMore">
        <article v-for="p in filteredPartners.slice(0, shown)" :key="p.id" class="m-card is-tappable ad-partner" @click="router.push({ name: 'customer-detail', params: { id: p.id } })">
          <div class="ad-partner__top">
            <b>{{ p.fullname || '—' }}</b>
            <a v-if="telHref(p.phone_number)" :href="telHref(p.phone_number)" class="ad-call" @click.stop><van-icon name="phone" /></a>
          </div>
          <div class="ad-user__tags">
            <span class="m-tag">{{ partnerTypeLabel(p.partner_type) }}</span>
            <span class="m-tag" :class="/yuridik|юрид/i.test(p.mijozturi || '') ? 'is-good' : 'is-warn'">{{ p.mijozturi || '—' }}</span>
          </div>
          <small class="ad-sub">{{ p.phone_number || '—' }} · {{ p.user?.firstname || '—' }} · {{ smartDate(p.createdAt, t, locale, false) }}</small>
        </article>
      </van-list>
    </template>

    <!-- Obyektlar -->
    <template v-else-if="tab === 'objects'">
      <van-search v-model="objectSearch" shape="round" :placeholder="$t('m.searchSites')" class="ad-search" />
      <div v-if="objectUsers.length > 1" class="m-chips">
        <button type="button" class="m-chip" :class="{ 'is-active': !objectUser }" @click="objectUser = ''">{{ $t('m.all') }}</button>
        <button v-for="n in objectUsers" :key="n" type="button" class="m-chip" :class="{ 'is-active': objectUser === n }" @click="objectUser = objectUser === n ? '' : n">
          <van-icon name="manager-o" /> {{ n }}
        </button>
      </div>
      <p class="ad-count">{{ $t('m.foundCount', { n: filteredObjects.length }) }}</p>
      <van-list v-model:loading="listLoading" :finished="finished" :immediate-check="false" @load="onLoadMore">
        <article
          v-for="o in filteredObjects.slice(0, shown)"
          :key="o.id"
          class="m-card is-tappable"
          @click="objectParentId(o) && router.push({ name: 'site-detail', params: { id: objectParentId(o) } })"
        >
          <div class="ad-partner__top">
            <span class="m-tag" :class="whereTone(o.whereto)">{{ o.whereto || '—' }}</span>
            <small class="ad-sub">{{ smartDate(o.when_gone || o.createdAt, t, locale) }}</small>
          </div>
          <b class="ad-obj">{{ o.company_name || '—' }}</b>
          <small class="ad-sub">
            {{ nameOf(o.come_and_go_father?.user) }}<template v-if="o.dogovor_or_kp"> · {{ o.dogovor_or_kp }}</template>
          </small>
          <small v-if="o.locationname" class="ad-sub"><van-icon name="location-o" /> {{ o.locationname }}</small>
        </article>
      </van-list>
    </template>

    <!-- Audit -->
    <template v-else-if="tab === 'audit'">
      <van-search v-model="auditSearch" shape="round" :placeholder="$t('m.search')" class="ad-search" />
      <div class="m-chips">
        <button type="button" class="m-chip" :class="{ 'is-active': !auditAction }" @click="auditAction = ''">{{ $t('m.all') }}</button>
        <button v-for="a in ACTIONS" :key="a" type="button" class="m-chip" :class="{ 'is-active': auditAction === a }" @click="auditAction = auditAction === a ? '' : a">{{ actionLabel(a) }}</button>
      </div>
      <van-list v-model:loading="listLoading" :finished="finished" :immediate-check="false" @load="onLoadMore">
        <div v-for="l in filteredLogs.slice(0, shown)" :key="l.id" class="m-card ad-log">
          <span class="m-tag" :class="toneOf(l.type)">{{ actionLabel(l.action) }}</span>
          <p>{{ l.message }}</p>
          <small>{{ logActor(l) }} · {{ formatDateTime(l.createdAt || l.created_at) }}</small>
        </div>
      </van-list>
      <MEmpty v-if="!filteredLogs.length" icon="records-o" :title="$t('m.nothingFound')" />
    </template>

    <!-- Ilova versiyalari (APK) -->
    <AppReleases v-else-if="tab === 'releases'" />

    <!-- Xodim oynasi -->
    <MSheet v-model="userOpen" :title="selected ? nameOf(selected) : ''" max-height="90%">
      <template v-if="selected">
        <div class="ad-profile">
          <img v-if="selected.profile_image" :src="selected.profile_image" class="ad-user__img is-lg" alt="" />
          <span v-else class="m-avatar ad-user__img is-lg" :style="{ background: avatarColor(nameOf(selected)) }">{{ initials(nameOf(selected)) }}</span>
          <div>
            <p class="ad-profile__user">@{{ selected.username }}</p>
            <div class="ad-user__tags">
              <span v-if="selected.is_admin" class="m-tag is-blue">{{ $t('m.admin') }}</span>
              <span v-if="selected.is_blocked" class="m-tag is-bad">{{ $t('m.blocked') }}</span>
            </div>
          </div>
        </div>
        <van-cell-group inset>
          <van-cell :title="$t('telefonRaqam')" :value="selected.phone_number || '—'" :url="telHref(selected.phone_number)" :is-link="!!telHref(selected.phone_number)" />
          <van-cell :title="$t('email')" :value="selected.email || '—'" />
          <van-cell :title="$t('m.createdAt')" :value="formatDateTime(selected.createdAt)" />
        </van-cell-group>

        <div class="ad-actions">
          <van-button size="small" :disabled="isSelf || busy || selected.id === BOSS_USER_ID" icon="star-o" @click="toggleAdmin(selected)">
            {{ selected.is_admin ? $t('m.removeAdmin') : $t('m.makeAdmin') }}
          </van-button>
          <van-button size="small" :disabled="isSelf || busy" :type="selected.is_blocked ? 'success' : 'danger'" plain icon="lock" @click="toggleBlock(selected)">
            {{ selected.is_blocked ? $t('m.unblock') : $t('m.block') }}
          </van-button>
        </div>

        <div class="m-section"><span class="m-section__title">{{ $t('m.admPermissions') }}</span></div>
        <van-cell-group inset>
          <van-cell v-for="p in PERMISSION_PAGES" :key="p.key" :title="$t(p.labelKey)" center>
            <template #right-icon>
              <van-switch
                :model-value="hasPermission(selected, p.key)"
                :loading="!!savingPerm[p.key]"
                size="22px"
                @update:model-value="(v) => setPermission(selected, p.key, v)"
              />
            </template>
          </van-cell>
        </van-cell-group>

        <div class="m-section"><span class="m-section__title">{{ $t('m.admAudit') }}</span></div>
        <div class="m-card ad-logs">
          <van-loading v-if="logsLoading" size="20" />
          <template v-else>
            <div v-for="l in userLogs.slice(0, 20)" :key="l.id" class="ad-log">
              <span class="m-tag" :class="toneOf(l.type)">{{ actionLabel(l.action) }}</span>
              <p>{{ l.message }}</p>
              <small>{{ formatDateTime(l.createdAt || l.created_at) }}</small>
            </div>
            <p v-if="!userLogs.length" class="m-muted">{{ $t('m.nothingFound') }}</p>
          </template>
        </div>
      </template>
    </MSheet>
  </MPage>
</template>

<style scoped>
.ad-search {
  padding: 10px 12px 4px;
}

.ad-count {
  padding: 2px 16px 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.ad-rank {
  padding: 4px 0;
}

.ad-rank__row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: none;
  text-align: left;
  border-bottom: 1px solid var(--m-line-soft);
}

.ad-rank__row:last-child {
  border-bottom: 0;
}

.ad-rank__n {
  width: 18px;
  font-size: 13px;
  font-weight: 700;
  color: var(--m-faint);
}

.ad-rank__name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-rank__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--m-muted);
}

.ad-logs {
  display: grid;
  gap: 12px;
}

.ad-log p {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--m-ink);
}

.ad-log small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--m-muted);
}

.ad-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ad-user__img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.ad-user__img.is-lg {
  width: 56px;
  height: 56px;
  font-size: 20px;
}

.ad-user__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ad-user__main small {
  font-size: 12px;
  color: var(--m-muted);
}

.ad-user__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.ad-partner__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.ad-call {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--m-good-soft);
  color: var(--m-good);
  display: grid;
  place-items: center;
}

.ad-sub {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--m-muted);
}

.ad-obj {
  display: block;
  margin-top: 8px;
  font-size: 15px;
}

.ad-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px 14px;
}

.ad-profile__user {
  font-size: 14px;
  color: var(--m-muted);
}

.ad-actions {
  display: flex;
  gap: 8px;
  padding: 14px 16px 0;
}

.ad-actions .van-button {
  flex: 1;
  border-radius: 10px;
}
</style>
