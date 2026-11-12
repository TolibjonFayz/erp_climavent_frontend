<template>
  <!-- Didox: schyot-faktura (summasi bilan) va ishonchnoma fayllari (Cloudflare R2) -->
  <section class="ot-sec ot-dx">
    <div class="ot-sec__head">
      <h4><UiHint :label="$t('otDidoxTitle')" :hint="$t('otDidoxHint')" /></h4>
    </div>
    <input ref="input" type="file" multiple :accept="ACCEPT" hidden @change="onPicked" />

    <el-alert v-if="order.storage_ready === false" type="warning" show-icon :closable="false" :title="$t('otDidoxStorageOff')" />

    <div v-for="b in blocks" :key="b.kind" class="ot-dx__block">
      <div class="ot-dx__block-head">
        <span class="ot-dx__block-title">
          {{ $t(b.title) }}
          <span v-if="b.files.length" class="ot-dx__badge">{{ b.files.length }}</span>
        </span>
        <span class="ot-sec__btns">
          <span v-if="b.kind === 'invoice' && b.files.length" class="ot-muted">
            {{ $t('otDidoxTotal') }}: <b :class="totalClass">{{ fmtMoney(order.didox_files_sum) }}</b>
            <template v-if="order.contract_sum > 0"> / {{ fmtMoney(order.contract_sum) }}</template>
          </span>
          <el-button size="small" type="primary" plain :icon="Upload" :disabled="order.storage_ready === false" @click="pick(b.kind)">
            {{ $t('otDidoxAdd') }}
          </el-button>
        </span>
      </div>

      <div
        v-if="!b.files.length"
        class="ot-dx__drop"
        :class="{ 'is-over': over === b.kind }"
        role="button"
        tabindex="0"
        @click="pick(b.kind)"
        @keydown.enter="pick(b.kind)"
        @dragover.prevent="over = b.kind"
        @dragleave="over = ''"
        @drop.prevent="onDrop($event, b.kind)"
      >
        <el-icon><UploadFilled /></el-icon>
        <span>{{ $t(b.empty) }}</span>
      </div>

      <ul
        v-else
        class="ot-dx__list"
        :class="{ 'is-over': over === b.kind }"
        @dragover.prevent="over = b.kind"
        @dragleave="over = ''"
        @drop.prevent="onDrop($event, b.kind)"
      >
        <li v-for="f in b.files" :key="f.id" class="ot-dx__file" :class="{ 'is-poa': f.kind === 'poa' }">
          <span class="ot-dx__icon" :class="`is-${extOf(f)}`">{{ extOf(f).toUpperCase() }}</span>
          <div class="ot-dx__body">
            <button type="button" class="ot-dx__name" :title="f.file_name" @click="open(f, 'inline')">{{ f.file_name }}</button>
            <div class="ot-muted">
              <template v-if="f.invoice_number">№ {{ f.invoice_number }}</template>
              <template v-if="f.invoice_date"> · {{ formatDate(f.invoice_date) }}</template>
              <template v-if="f.kind === 'poa' && f.poa_company"> · {{ f.poa_company }}</template>
              <template v-if="f.invoice_number || f.invoice_date || (f.kind === 'poa' && f.poa_company)"> · </template>
              {{ fmtSize(f.size_bytes) }} · {{ uploader(f) }}
            </div>
            <div v-if="f.comment" class="ot-dx__comment">{{ f.comment }}</div>
          </div>
          <span v-if="f.kind === 'poa' && f.poa_valid_until" class="ot-tag" :class="`is-${poaTone(f)}`">
            {{ poaStateText(f) }}
          </span>
          <span v-else-if="(f.kind || 'invoice') === 'invoice'" class="ot-dx__amount" :class="{ 'is-empty': f.amount == null }">
            {{ f.amount == null ? $t('otDidoxNoAmount') : fmtMoney(f.amount) }}
          </span>
          <span class="ot-dx__btns">
            <el-button text size="small" :icon="Download" :aria-label="$t('otDidoxDownload')" @click="open(f, 'download')" />
            <el-button text size="small" :icon="EditPen" :aria-label="$t('otEdit')" @click="startEdit(f)" />
            <el-popconfirm v-if="canDelete(f)" :title="$t('otConfirmDelete')" @confirm="remove(f)">
              <template #reference><el-button text size="small" type="danger" :icon="Delete" :aria-label="$t('otDelete')" /></template>
            </el-popconfirm>
          </span>
        </li>
      </ul>
    </div>

    <!-- Yuklash: schyot-faktura uchun summa, raqam, sana; ishonchnoma uchun raqam va sana -->
    <el-dialog v-model="up.open" :title="$t(KIND_TEXT[up.kind].upTitle)" width="min(720px, 96vw)" append-to-body :close-on-click-modal="!up.busy">
      <p class="ot-muted ot-dx__tip">{{ $t(KIND_TEXT[up.kind].upTip) }} {{ $t('otDidoxReadTip') }}</p>
      <div v-for="(r, i) in up.rows" :key="r.uid" class="ot-dx__row" :class="`is-${r.state}`">
        <div class="ot-dx__row-head">
          <span class="ot-dx__row-name" :title="r.file.name">{{ r.file.name }}</span>
          <span class="ot-muted">{{ fmtSize(r.file.size) }}</span>
          <el-tag v-if="r.reading" size="small" type="info">{{ $t('otDidoxReading') }}</el-tag>
          <el-tag v-if="r.kind !== up.kind" size="small" type="warning">{{ $t(KIND_TEXT[r.kind].moved) }}</el-tag>
          <el-tag v-if="r.state === 'done'" type="success" size="small">{{ $t('otDidoxUploaded') }}</el-tag>
          <el-tag v-else-if="r.state === 'error'" type="danger" size="small">{{ r.error }}</el-tag>
          <el-progress v-else-if="r.state === 'loading'" :percentage="r.progress" :stroke-width="6" class="ot-dx__progress" />
          <el-button v-if="!up.busy && r.state !== 'done'" text size="small" :icon="Close" :aria-label="$t('otDelete')" @click="up.rows.splice(i, 1)" />
        </div>
        <el-alert v-if="r.dup" type="error" show-icon :closable="false" :title="r.dup" class="ot-dx__dup" />

        <div class="ot-dx__row-fields">
          <UiMoneyInput v-if="r.kind === 'invoice'" v-model="r.amount" :min="0" :placeholder="$t('otDidoxAmount')" :disabled="r.state === 'done'" class="ot-dx__f-amount" @change="recheck(r)" />
          <el-input v-model="r.invoice_number" :placeholder="$t(KIND_TEXT[r.kind].number)" maxlength="64" :disabled="r.state === 'done'" class="ot-dx__f-num" @change="recheck(r)" />
          <el-date-picker v-model="r.invoice_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :placeholder="$t(KIND_TEXT[r.kind].date)" :disabled="r.state === 'done'" class="ot-dx__f-date" @change="recheck(r)" />
          <template v-if="r.kind === 'poa'">
            <el-date-picker v-model="r.poa_valid_until" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :placeholder="$t('otPoaValidUntil')" :disabled="r.state === 'done'" class="ot-dx__f-date" @change="recheck(r)" />
            <el-input v-model="r.poa_company" :placeholder="$t('otPoaCompany')" maxlength="255" :disabled="r.state === 'done'" class="ot-dx__f-company" />
            <el-input v-model="r.poa_inn" :placeholder="$t('otInn')" maxlength="32" :disabled="r.state === 'done'" class="ot-dx__f-num" @change="recheck(r)" />
          </template>
        </div>

        <!-- O'qilgan hujjat: asosiy ma'lumot, tovarlar va tekshiruv natijasi -->
        <div v-if="r.parsed && r.parsed.kind !== 'unknown'" class="ot-dx__read">
          <div class="ot-dx__read-head">
            <template v-if="r.parsed.kind === 'contract'">
              {{ $t('otContractDoc', { n: r.parsed.number || '—', date: formatDate(r.parsed.date) }) }}
              · {{ r.parsed.client_name || '—' }}<template v-if="r.parsed.client_inn"> ({{ $t('otInn') }} {{ r.parsed.client_inn }})</template>
            </template>
            <template v-else-if="r.parsed.kind === 'poa'">
              {{ $t('otPoaDoc', { n: r.parsed.number || '—', date: formatDate(r.parsed.date) }) }}
              · {{ r.parsed.company || '—' }}<template v-if="r.parsed.company_inn"> ({{ $t('otInn') }} {{ r.parsed.company_inn }})</template>
              <div v-if="r.parsed.person" class="ot-muted">{{ $t('otPoaPerson') }}: {{ r.parsed.person }}</div>
            </template>
            <template v-else>
              {{ $t('otInvoiceDoc', { n: r.parsed.number || '—', date: formatDate(r.parsed.date) }) }}
              · {{ r.parsed.buyer_name || '—' }}<template v-if="r.parsed.buyer_inn"> ({{ $t('otInn') }} {{ r.parsed.buyer_inn }})</template>
            </template>
            <div v-if="r.parsed.contract_number" class="ot-muted">
              {{ $t('otDidoxContractRef', { n: r.parsed.contract_number, date: formatDate(r.parsed.contract_date) }) }}
            </div>
          </div>
          <table v-if="r.parsed.items?.length" class="ot-dx__items">
            <thead>
              <tr>
                <th>{{ $t('otItemName') }}</th>
                <th class="is-r">{{ $t('otItemQty') }}</th>
                <th v-if="r.parsed.kind === 'invoice'" class="is-r">{{ $t('otDidoxLineTotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in r.parsed.items" :key="it.no">
                <td :title="it.name">{{ it.no }}. {{ it.name }}</td>
                <td class="is-r nowrap">{{ fmtQty(it.qty) }} {{ it.unit || '' }}</td>
                <td v-if="r.parsed.kind === 'invoice'" class="is-r nowrap">{{ fmtMoney(it.total) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="r.parsed.kind === 'invoice' && r.parsed.total != null">
              <tr>
                <td colspan="2" class="is-r ot-muted">{{ $t('otDidoxGrandTotal') }}</td>
                <td class="is-r nowrap"><b>{{ fmtMoney(r.parsed.total) }}</b></td>
              </tr>
            </tfoot>
          </table>
          <ul v-if="r.checks.length" class="ot-dx__checks">
            <li v-for="(c, k) in r.checks" :key="k" :class="`is-${c.level}`">
              <span class="ot-dx__chk-icon">{{ c.level === 'ok' ? '✓' : c.level === 'warn' ? '!' : '✕' }}</span>
              {{ $t(c.key, fmtParams(c.params)) }}
            </li>
          </ul>
        </div>
        <div v-else-if="r.note" class="ot-muted">{{ r.note }}</div>
      </div>
      <template #footer>
        <el-button :disabled="up.busy" @click="up.open = false">{{ $t('otCancel') }}</el-button>
        <el-button :disabled="up.busy" :icon="Plus" @click="pick(up.kind)">{{ $t('otDidoxMore') }}</el-button>
        <el-button type="primary" :loading="up.busy" :disabled="!pending.length || reading" @click="uploadAll">
          {{ $t('otDidoxUpload', { n: pending.length }) }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Fayl ma'lumotini tahrirlash -->
    <el-dialog v-model="ed.open" :title="$t('otDidoxEditTitle')" width="420px" append-to-body>
      <el-form label-position="top">
        <el-form-item v-if="ed.kind === 'invoice'" :label="$t('otDidoxAmount')">
          <UiMoneyInput v-model="ed.amount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t(KIND_TEXT[ed.kind].number)"><el-input v-model="ed.invoice_number" maxlength="64" /></el-form-item>
        <el-form-item :label="$t(KIND_TEXT[ed.kind].date)">
          <el-date-picker v-model="ed.invoice_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
        </el-form-item>
        <template v-if="ed.kind === 'poa'">
          <el-form-item :label="$t('otPoaValidUntil')">
            <el-date-picker v-model="ed.poa_valid_until" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="$t('otPoaCompany')"><el-input v-model="ed.poa_company" maxlength="255" /></el-form-item>
          <el-form-item :label="$t('otInn')"><el-input v-model="ed.poa_inn" maxlength="32" /></el-form-item>
        </template>
        <el-form-item :label="$t('otPayComment')"><el-input v-model="ed.comment" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ed.open = false">{{ $t('otCancel') }}</el-button>
        <el-button type="primary" :loading="ed.busy" @click="saveEdit">{{ $t('otSave') }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import UiMoneyInput from '@/components/ui/UiMoneyInput.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Close, Delete, Download, EditPen, Plus, Upload, UploadFilled } from '@element-plus/icons-vue'
import UiHint from '@/components/ui/UiHint.vue'
import api from '@/api/otgruzka'
import { useUsersStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
import { fmtMoney, fmtSize, otError } from '@/utils/otgruzkaFormat'
import { fmtQty } from '@/utils/skladFormat'
import { checkContract, checkInvoice, checkPoa, readDidoxPdf } from '@/utils/didoxPdfImport'

const props = defineProps({
  order: { type: Object, required: true },
  isAdmin: Boolean,
})
const emit = defineEmits(['changed'])
const { t } = useI18n()
const usersStore = useUsersStore()

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.heic,.xml,.json,.zip,.xls,.xlsx,.doc,.docx,.csv,.txt'
const MAX_SIZE = 25 * 1024 * 1024

const input = ref(null)
const over = ref('') // qaysi blok ustiga fayl sudralmoqda
const up = reactive({ open: false, busy: false, kind: 'invoice', rows: [] })
const ed = reactive({ open: false, busy: false, id: null, kind: 'invoice', amount: undefined, invoice_number: '', invoice_date: null, comment: '', poa_valid_until: null, poa_company: '', poa_inn: '' })

// Hujjat turlari bo'yicha matnlar
const KIND_TEXT = {
  invoice: { upTitle: 'otDidoxUploadTitle', upTip: 'otDidoxUploadTip', number: 'otDidoxNumber', date: 'otDidoxDate', dup: 'otDidoxDup', moved: 'otDidoxAsInvoice' },
  poa: { upTitle: 'otPoaUploadTitle', upTip: 'otPoaUploadTip', number: 'otPoaNumber', date: 'otPoaIssued', dup: 'otPoaDup', moved: 'otDidoxAsPoa' },
  contract: { upTitle: 'otContractUploadTitle', upTip: 'otContractUploadTip', number: 'otContractNumber', date: 'otDidoxDate', dup: 'otContractDup', moved: 'otDidoxAsContract' },
}

// Uch blok: Didox orqali yuborilgan shartnoma, schyot-fakturalar (summasi bilan) va ishonchnomalar
const blocks = computed(() => {
  const files = props.order.didox_files || []
  return [
    { kind: 'contract', title: 'otDidoxContracts', empty: 'otContractEmpty', files: files.filter((f) => f.kind === 'contract') },
    { kind: 'invoice', title: 'otDidoxInvoices', empty: 'otDidoxEmpty', files: files.filter((f) => (f.kind || 'invoice') === 'invoice') },
    { kind: 'poa', title: 'otDidoxPoas', empty: 'otPoaEmpty', files: files.filter((f) => f.kind === 'poa') },
  ]
})
// Dublikat (state = blocked) va yuklangan fayllar yuborilmaydi
const pending = computed(() => up.rows.filter((r) => r.state !== 'done' && r.state !== 'blocked'))
const reading = computed(() => up.rows.some((r) => r.reading))
let uid = 0

// ─── Ishonchnoma muddati ───
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const daysLeft = (iso) => Math.round((new Date(`${iso}T00:00:00Z`) - new Date(`${todayIso()}T00:00:00Z`)) / 86400000)
function poaTone(f) {
  const left = daysLeft(f.poa_valid_until)
  return left < 0 ? 'bad' : left <= 3 ? 'warn' : 'good'
}
function poaStateText(f) {
  const left = daysLeft(f.poa_valid_until)
  return left < 0 ? t('otPoaExpired', { date: formatDate(f.poa_valid_until) }) : t('otPoaUntilDays', { date: formatDate(f.poa_valid_until), n: left })
}

// Tekshiruv matnlari uchun: summalar "1 234 567", sanalar "21.10.2026"
const fmtParams = (p = {}) => {
  const out = {}
  for (const [k, v] of Object.entries(p)) {
    if (['lines', 'total', 'after', 'contract', 'price', 'cardPrice'].includes(k)) out[k] = fmtMoney(v)
    else if (k === 'date') out[k] = formatDate(v)
    else if (k === 'qty' || k === 'cardQty') out[k] = fmtQty(v)
    else out[k] = v ?? '—'
  }
  return out
}

const totalClass = computed(() => {
  const o = props.order
  if (!(o.contract_sum > 0)) return ''
  return Math.abs((o.didox_files_sum || 0) - o.contract_sum) <= 1 ? 'is-good' : 'is-warn'
})

function extOf(f) {
  const n = String(f.file_name || '').toLowerCase()
  const ext = n.includes('.') ? n.split('.').pop() : ''
  if (ext === 'pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'webp', 'heic'].includes(ext)) return 'img'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls'
  if (['xml', 'json'].includes(ext)) return ext
  return ext.slice(0, 4) || 'file'
}
const uploader = (f) => {
  const u = f.uploader
  return u ? [u.firstname, u.lastname].filter(Boolean).join(' ') || u.username : t('otSystem')
}
const canDelete = (f) => props.isAdmin || f.uploaded_by === usersStore.currentUser?.id

let pickKind = 'invoice'
function pick(kind) {
  pickKind = kind
  input.value.value = ''
  input.value.click()
}
function onPicked(e) {
  addFiles([...(e.target.files || [])], pickKind)
}
function onDrop(e, kind) {
  over.value = ''
  addFiles([...(e.dataTransfer?.files || [])], kind)
}
// Fayl nomidan schyot-faktura raqamini taxmin qilish (masalan "СФ-1234.pdf" → 1234)
const guessNumber = (name) => /(\d{2,})/.exec(name.replace(/\.[^.]+$/, ''))?.[1] || ''
function addFiles(files, kind) {
  if (!files.length) return
  // Oyna boshqa tur uchun ochiq bo'lsa (masalan schyot-faktura yuklanmoqda) — aralashtirilmaydi
  if (up.open && up.kind !== kind) {
    if (up.busy) return
    up.rows = up.rows.filter((r) => r.state === 'done')
  }
  if (!up.open) up.rows = []
  up.kind = kind
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      ElMessage.warning(t('otDidoxTooBig', { name: file.name }))
      continue
    }
    const row = reactive({
      uid: ++uid,
      file,
      kind,
      amount: undefined,
      invoice_number: kind === 'invoice' ? guessNumber(file.name) : '',
      invoice_date: null,
      doc_id: null,
      poa_valid_until: null,
      poa_company: '',
      poa_inn: '',
      parsed: null,
      checks: [],
      reading: false,
      note: '',
      dup: '',
      state: 'new',
      progress: 0,
      error: '',
    })
    up.rows.push(row)
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') readRow(row)
    else recheck(row)
  }
  if (up.rows.length) up.open = true
}

// PDF (Didox) o'qiladi: maydonlar to'ldiriladi; hujjat turi boshqa bo'lsa — o'sha tur sifatida yuklanadi
async function readRow(row) {
  row.reading = true
  try {
    const p = await readDidoxPdf(row.file)
    row.parsed = p
    if (p.kind === 'unknown') {
      row.note = t('otDidoxReadUnknown')
    } else {
      row.kind = p.kind
      row.doc_id = p.doc_id || null
      row.invoice_number = p.number || row.invoice_number
      row.invoice_date = p.date || row.invoice_date
      if (p.kind === 'poa') {
        row.amount = undefined
        row.poa_valid_until = p.valid_until || null
        row.poa_company = p.company || ''
        row.poa_inn = p.company_inn || ''
      } else if (p.kind === 'contract') row.amount = undefined
      else if (p.total != null) row.amount = p.total
    }
  } catch {
    row.note = t('otDidoxReadFail')
  } finally {
    row.reading = false
  }
  await recheck(row)
}

function runChecks(row) {
  const p = row.parsed
  if (!p || p.kind === 'unknown') return
  if (row.kind === 'contract') {
    row.checks = checkContract({ ...p, number: row.invoice_number }, props.order)
  } else if (row.kind === 'poa') {
    row.checks = checkPoa({ ...p, number: row.invoice_number, valid_until: row.poa_valid_until }, props.order)
  } else {
    // Shu oynadagi boshqa (hali yuklanmagan) fakturalar ham summaga qo'shiladi
    const others = up.rows
      .filter((r) => r !== row && r.kind === 'invoice' && r.state !== 'done' && r.state !== 'blocked')
      .reduce((s, r) => s + (Number(r.amount) || 0), 0)
    row.checks = checkInvoice({ ...p, number: row.invoice_number }, props.order, { otherSum: (props.order.didox_files_sum || 0) + others })
  }
}

// Schyot-faktura raqamini kartaga / Google jadvalga yozib bo'lmasa (jadval asosiy rejimda) — ogohlantiramiz
function warnInvoiceSync(d) {
  if (d?.invoice_sync_skipped) ElMessage.warning(t('otInvoiceSyncSkipped'))
}

const normNo = (s) => String(s || '').replace(/\s/g, '').toLowerCase()

// Dublikat: avval kartadagi fayllar va shu oynadagi boshqa fayllar, keyin butun baza (server)
async function findDup(row) {
  const num = normNo(row.invoice_number)
  const rowInn = String(row.poa_inn || '').replace(/\D/g, '')
  const sameNo = (kind, n, date, inn) =>
    !!num &&
    (kind || 'invoice') === row.kind &&
    normNo(n) === num &&
    (row.kind === 'poa' ? !rowInn || !inn || String(inn) === rowInn : !row.invoice_date || !date || date === row.invoice_date)
  const local = (props.order.didox_files || []).find(
    (f) => (row.doc_id && f.doc_id === row.doc_id) || sameNo(f.kind, f.invoice_number, f.invoice_date, f.poa_inn),
  )
  if (local) return { number: local.invoice_number || row.invoice_number, where: t('otDidoxDupHere'), file: local.file_name }
  const idx = up.rows.indexOf(row)
  const twin = up.rows.find(
    (r, k) => k < idx && r.state !== 'blocked' && ((row.doc_id && r.doc_id === row.doc_id) || sameNo(r.kind, r.invoice_number, r.invoice_date, r.poa_inn)),
  )
  if (twin) return { number: row.invoice_number || twin.invoice_number, where: t('otDidoxDupBatch'), file: twin.file.name }
  if (!num && !row.doc_id) return null
  try {
    const { duplicate: d } = await api.checkDidox(props.order.id, {
      kind: row.kind,
      invoice_number: row.invoice_number?.trim() || undefined,
      invoice_date: row.kind === 'invoice' ? row.invoice_date || undefined : undefined,
      doc_id: row.doc_id || undefined,
      poa_inn: row.kind === 'poa' ? rowInn || undefined : undefined,
    })
    if (d) {
      const where = d.order_id === props.order.id ? t('otDidoxDupHere') : t('otDidoxDupOther', { dogovor: d.dogovor_number ?? '—', client: d.client_name ?? '—' })
      return { number: d.invoice_number || row.invoice_number, where, file: d.file_name }
    }
  } catch {
    // Server tekshiruvi ishlamasa ham yuklashda server baribir rad etadi (409)
  }
  return null
}

async function recheck(row) {
  if (row.state === 'done') return
  runChecks(row)
  const d = await findDup(row)
  row.dup = d ? t(KIND_TEXT[row.kind].dup, { number: d.number || '—', where: d.where, file: d.file }) : ''
  if (d) row.state = 'blocked'
  else if (row.state === 'blocked') row.state = 'new'
}

async function uploadAll() {
  up.busy = true
  let last = null
  for (const r of pending.value) {
    r.state = 'loading'
    r.progress = 0
    try {
      last = await api.addDidox(
        props.order.id,
        r.file,
        {
          kind: r.kind,
          amount: r.kind === 'invoice' ? r.amount : undefined,
          invoice_number: r.invoice_number?.trim(),
          invoice_date: r.invoice_date,
          doc_id: r.doc_id,
          // Faktura tovarlari — kartada "necha foizi fakturalangan" hisobi uchun
          ...(r.kind === 'invoice' && r.parsed?.kind === 'invoice' && r.parsed.items?.length
            ? { items: JSON.stringify(r.parsed.items.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, total: i.total }))) }
            : {}),
          ...(r.kind === 'poa' ? { poa_valid_until: r.poa_valid_until, poa_company: r.poa_company?.trim(), poa_inn: r.poa_inn?.trim() } : {}),
        },
        (ev) => {
          if (ev.total) r.progress = Math.round((ev.loaded / ev.total) * 100)
        },
      )
      r.state = 'done'
    } catch (e) {
      r.state = 'error'
      r.error = otError(e)
    }
  }
  up.busy = false
  if (last) emit('changed', last)
  // Ishonchnoma yuklandi, lekin "Ishonchnoma: bor" belgisini o'zi yoqib bo'lmadi (jadval asosiy rejimda)
  if (last?.poa_flag_skipped) ElMessage.warning(t('otPoaFlagSkipped'))
  if (last?.contract_flag_skipped) ElMessage.warning(t('otContractFlagSkipped'))
  warnInvoiceSync(last)
  if (!up.rows.some((r) => r.state === 'error' || r.state === 'blocked')) {
    up.open = false
    up.rows = []
    ElMessage.success(t('otSaved'))
  } else {
    up.rows = up.rows.filter((r) => r.state !== 'done')
  }
}

async function open(f, mode) {
  // Havola so'ralguncha yangi oyna ochib qo'yamiz — aks holda brauzer popup'ni bloklaydi
  const win = mode === 'inline' ? window.open('', '_blank') : null
  try {
    const { url } = await api.didoxLink(f.id, mode)
    if (win) win.location.href = url
    else window.location.href = url
  } catch (e) {
    win?.close()
    ElMessage.error(otError(e))
  }
}

function startEdit(f) {
  Object.assign(ed, {
    open: true,
    busy: false,
    id: f.id,
    kind: f.kind || 'invoice',
    amount: f.amount ?? undefined,
    invoice_number: f.invoice_number || '',
    invoice_date: f.invoice_date || null,
    comment: f.comment || '',
    poa_valid_until: f.poa_valid_until || null,
    poa_company: f.poa_company || '',
    poa_inn: f.poa_inn || '',
  })
}
async function saveEdit() {
  ed.busy = true
  try {
    const d = await api.updateDidox(ed.id, {
      amount: ed.amount ?? null,
      invoice_number: ed.invoice_number.trim() || null,
      invoice_date: ed.invoice_date || null,
      comment: ed.comment.trim() || null,
      ...(ed.kind === 'poa'
        ? { poa_valid_until: ed.poa_valid_until || null, poa_company: ed.poa_company.trim() || null, poa_inn: ed.poa_inn.trim() || null }
        : {}),
    })
    emit('changed', d)
    warnInvoiceSync(d)
    ed.open = false
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    ed.busy = false
  }
}
async function remove(f) {
  try {
    const d = await api.removeDidox(f.id)
    emit('changed', d)
    warnInvoiceSync(d)
  } catch (e) {
    ElMessage.error(otError(e))
  }
}
</script>

<style scoped lang="scss">
.ot-sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--ui-line-soft);
  h4 {
    margin: 0;
    font-size: 15px;
    color: var(--ui-ink);
  }
}
.ot-sec__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ot-sec__btns {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ot-muted {
  font-size: 13px;
  color: var(--ui-muted);
}
.is-good {
  color: var(--ui-good);
}
.is-warn {
  color: var(--ui-warn);
}
.ot-dx__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  & + & {
    padding-top: 12px;
    border-top: 1px dashed var(--ui-line-soft);
  }
}
.ot-dx__block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ot-dx__block-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ui-ink-2);
}
.ot-dx__badge {
  min-width: 18px;
  padding: 0 6px;
  border-radius: 99px;
  background: var(--ui-surface-2);
  color: var(--ui-muted);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.ot-dx__list.is-over {
  outline: 1px dashed var(--ui-link);
  outline-offset: 4px;
  border-radius: var(--ui-radius);
}
.ot-dx__file.is-poa {
  grid-template-columns: 38px minmax(0, 1fr) auto;
}
.ot-dx__drop {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 1px dashed var(--ui-line);
  border-radius: var(--ui-radius);
  color: var(--ui-muted);
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  &:hover,
  &.is-over,
  &:focus-visible {
    border-color: var(--ui-link);
    color: var(--ui-link);
    background: var(--ui-link-soft);
  }
  .el-icon {
    font-size: 18px;
  }
}
.ot-dx__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.ot-dx__file {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--ui-line-soft);
}
.ot-dx__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 800;
  background: var(--ui-surface-2);
  color: var(--ui-muted);
  &.is-pdf {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
  &.is-img {
    background: var(--ui-link-soft);
    color: var(--ui-link);
  }
  &.is-xls {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
}
.ot-dx__body {
  min-width: 0;
}
.ot-dx__name {
  display: block;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--ui-ink);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    color: var(--ui-link);
    text-decoration: underline;
  }
}
.ot-dx__comment {
  font-size: 12px;
  color: var(--ui-ink-2);
}
.ot-dx__amount {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-good);
  white-space: nowrap;
  &.is-empty {
    font-weight: 400;
    font-size: 12px;
    color: var(--ui-muted);
  }
}
.ot-dx__btns {
  display: inline-flex;
  .el-button + .el-button {
    margin-left: 0;
  }
}
@media (max-width: 520px) {
  .ot-dx__file {
    grid-template-columns: 38px minmax(0, 1fr) auto;
  }
  .ot-dx__btns {
    grid-column: 2 / -1;
  }
}
.ot-dx__tip {
  margin: 0 0 10px;
}
.ot-dx__row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--ui-line-soft);
  border-radius: var(--ui-radius);
  &.is-done {
    border-color: var(--ui-good);
  }
  &.is-error {
    border-color: var(--ui-bad);
  }
}
.ot-dx__row-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ot-dx__row-name {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 600;
  color: var(--ui-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ot-dx__progress {
  width: 120px;
}
.ot-dx__row-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ot-dx__f-amount {
  flex: 1 1 160px;
}
.ot-dx__f-num {
  flex: 1 1 140px;
}
.ot-dx__f-date {
  flex: 1 1 150px;
}
.ot-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--ui-surface-2);
  color: var(--ui-muted);
  &.is-good {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.is-warn {
    background: var(--ui-warn-soft);
    color: var(--ui-warn);
  }
  &.is-bad {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
}
.ot-dx__row.is-blocked {
  border-color: var(--ui-bad);
}
.ot-dx__dup {
  padding: 6px 10px;
}
.ot-dx__f-company {
  flex: 2 1 220px;
}
.ot-dx__read {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: var(--ui-radius);
  background: var(--ui-surface-2);
  font-size: 13px;
  color: var(--ui-ink);
}
.ot-dx__read-head {
  font-weight: 600;
  .ot-muted {
    font-weight: 400;
    font-size: 12px;
  }
}
.ot-dx__items {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th,
  td {
    padding: 3px 4px;
    border-bottom: 1px dashed var(--ui-line-soft);
    text-align: left;
    vertical-align: top;
  }
  th {
    color: var(--ui-muted);
    font-weight: 600;
  }
  td:first-child {
    max-width: 0;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .is-r {
    text-align: right;
  }
  .nowrap {
    white-space: nowrap;
  }
}
.ot-dx__checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  li {
    display: flex;
    gap: 6px;
    align-items: baseline;
  }
  .is-ok {
    color: var(--ui-good);
  }
  .is-warn {
    color: var(--ui-warn);
  }
  .is-bad {
    color: var(--ui-bad);
    font-weight: 600;
  }
}
.ot-dx__chk-icon {
  flex: 0 0 12px;
  font-weight: 800;
  text-align: center;
}
</style>
