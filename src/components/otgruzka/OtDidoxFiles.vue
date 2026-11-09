<template>
  <!-- Didox: schyot-faktura fayllari (Cloudflare R2) va har bir fayldagi summa -->
  <section class="ot-sec ot-dx">
    <div class="ot-sec__head">
      <h4><UiHint :label="$t('otDidoxTitle')" :hint="$t('otDidoxHint')" /></h4>
      <span class="ot-sec__btns">
        <span v-if="order.didox_files?.length" class="ot-muted">
          {{ $t('otDidoxTotal') }}: <b :class="totalClass">{{ fmtMoney(order.didox_files_sum) }}</b>
          <template v-if="order.contract_sum > 0"> / {{ fmtMoney(order.contract_sum) }}</template>
        </span>
        <el-button size="small" type="primary" plain :icon="Upload" :disabled="order.storage_ready === false" @click="pick">
          {{ $t('otDidoxAdd') }}
        </el-button>
      </span>
    </div>
    <input ref="input" type="file" multiple :accept="ACCEPT" hidden @change="onPicked" />

    <el-alert v-if="order.storage_ready === false" type="warning" show-icon :closable="false" :title="$t('otDidoxStorageOff')" />

    <div
      v-if="!order.didox_files?.length"
      class="ot-dx__drop"
      :class="{ 'is-over': over }"
      role="button"
      tabindex="0"
      @click="pick"
      @keydown.enter="pick"
      @dragover.prevent="over = true"
      @dragleave="over = false"
      @drop.prevent="onDrop"
    >
      <el-icon><UploadFilled /></el-icon>
      <span>{{ $t('otDidoxEmpty') }}</span>
    </div>

    <ul v-else class="ot-dx__list" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="onDrop">
      <li v-for="f in order.didox_files" :key="f.id" class="ot-dx__file">
        <span class="ot-dx__icon" :class="`is-${kind(f)}`">{{ kind(f).toUpperCase() }}</span>
        <div class="ot-dx__body">
          <button type="button" class="ot-dx__name" :title="f.file_name" @click="open(f, 'inline')">{{ f.file_name }}</button>
          <div class="ot-muted">
            <template v-if="f.invoice_number">№ {{ f.invoice_number }}</template>
            <template v-if="f.invoice_date"> · {{ formatDate(f.invoice_date) }}</template>
            <template v-if="f.invoice_number || f.invoice_date"> · </template>
            {{ fmtSize(f.size_bytes) }} · {{ uploader(f) }}
          </div>
          <div v-if="f.comment" class="ot-dx__comment">{{ f.comment }}</div>
        </div>
        <span class="ot-dx__amount" :class="{ 'is-empty': f.amount == null }">
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

    <!-- Yuklash: tanlangan har bir fayl uchun summa, raqam, sana -->
    <el-dialog v-model="up.open" :title="$t('otDidoxUploadTitle')" width="min(720px, 96vw)" append-to-body :close-on-click-modal="!up.busy">
      <p class="ot-muted ot-dx__tip">{{ $t('otDidoxUploadTip') }}</p>
      <div v-for="(r, i) in up.rows" :key="i" class="ot-dx__row" :class="`is-${r.state}`">
        <div class="ot-dx__row-head">
          <span class="ot-dx__row-name" :title="r.file.name">{{ r.file.name }}</span>
          <span class="ot-muted">{{ fmtSize(r.file.size) }}</span>
          <el-tag v-if="r.state === 'done'" type="success" size="small">{{ $t('otDidoxUploaded') }}</el-tag>
          <el-tag v-else-if="r.state === 'error'" type="danger" size="small">{{ r.error }}</el-tag>
          <el-progress v-else-if="r.state === 'loading'" :percentage="r.progress" :stroke-width="6" class="ot-dx__progress" />
          <el-button v-if="!up.busy && r.state !== 'done'" text size="small" :icon="Close" :aria-label="$t('otDelete')" @click="up.rows.splice(i, 1)" />
        </div>
        <div class="ot-dx__row-fields">
          <UiMoneyInput v-model="r.amount" :min="0" :placeholder="$t('otDidoxAmount')" :disabled="r.state === 'done'" class="ot-dx__f-amount" />
          <el-input v-model="r.invoice_number" :placeholder="$t('otDidoxNumber')" maxlength="64" :disabled="r.state === 'done'" class="ot-dx__f-num" />
          <el-date-picker v-model="r.invoice_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :placeholder="$t('otDidoxDate')" :disabled="r.state === 'done'" class="ot-dx__f-date" />
        </div>
      </div>
      <template #footer>
        <el-button :disabled="up.busy" @click="up.open = false">{{ $t('otCancel') }}</el-button>
        <el-button :disabled="up.busy" :icon="Plus" @click="pick">{{ $t('otDidoxMore') }}</el-button>
        <el-button type="primary" :loading="up.busy" :disabled="!pending.length" @click="uploadAll">
          {{ $t('otDidoxUpload', { n: pending.length }) }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Fayl ma'lumotini tahrirlash -->
    <el-dialog v-model="ed.open" :title="$t('otDidoxEditTitle')" width="420px" append-to-body>
      <el-form label-position="top">
        <el-form-item :label="$t('otDidoxAmount')">
          <UiMoneyInput v-model="ed.amount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('otDidoxNumber')"><el-input v-model="ed.invoice_number" maxlength="64" /></el-form-item>
        <el-form-item :label="$t('otDidoxDate')">
          <el-date-picker v-model="ed.invoice_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
        </el-form-item>
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
const over = ref(false)
const up = reactive({ open: false, busy: false, rows: [] })
const ed = reactive({ open: false, busy: false, id: null, amount: undefined, invoice_number: '', invoice_date: null, comment: '' })
const pending = computed(() => up.rows.filter((r) => r.state !== 'done'))

const totalClass = computed(() => {
  const o = props.order
  if (!(o.contract_sum > 0)) return ''
  return Math.abs((o.didox_files_sum || 0) - o.contract_sum) <= 1 ? 'is-good' : 'is-warn'
})

function kind(f) {
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

function pick() {
  input.value.value = ''
  input.value.click()
}
function onPicked(e) {
  addFiles([...(e.target.files || [])])
}
function onDrop(e) {
  over.value = false
  addFiles([...(e.dataTransfer?.files || [])])
}
// Fayl nomidan schyot-faktura raqamini taxmin qilish (masalan "СФ-1234.pdf" → 1234)
const guessNumber = (name) => /(\d{2,})/.exec(name.replace(/\.[^.]+$/, ''))?.[1] || ''
function addFiles(files) {
  if (!files.length) return
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      ElMessage.warning(t('otDidoxTooBig', { name: file.name }))
      continue
    }
    up.rows.push({ file, amount: undefined, invoice_number: guessNumber(file.name), invoice_date: null, state: 'new', progress: 0, error: '' })
  }
  if (up.rows.length) up.open = true
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
        { amount: r.amount, invoice_number: r.invoice_number?.trim(), invoice_date: r.invoice_date },
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
  if (!up.rows.some((r) => r.state === 'error')) {
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
    amount: f.amount ?? undefined,
    invoice_number: f.invoice_number || '',
    invoice_date: f.invoice_date || null,
    comment: f.comment || '',
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
    })
    emit('changed', d)
    ed.open = false
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    ed.busy = false
  }
}
async function remove(f) {
  try {
    emit('changed', await api.removeDidox(f.id))
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
</style>
