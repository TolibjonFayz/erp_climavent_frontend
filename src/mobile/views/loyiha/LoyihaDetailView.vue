<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import loyihaApi from '@/api/loyiha'
import { useLoyihaStore } from '@/stores/loyiha'
import { telHref } from '@/utils/format'
import {
  formatDate,
  formatDateTime,
  formatLoyihaId,
  formatNumber,
  formatSize,
  fullName,
} from '@/utils/loyihaFormat'
import MPage from '../../components/MPage.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import { showActionSheet } from '../../actionSheet'
import { openExternal } from '../../native'
import { errorText, money } from '../../utils'
import { LOYIHA_MAX_MB, difficultyLabelKey, difficultyTone, fileIcon } from './loyihaUi'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useLoyihaStore()

const id = Number(route.params.id)
const loyiha = ref(null)
const loading = ref(true)
const notFound = ref(false)

async function load() {
  try {
    const res = await loyihaApi.getOne(id)
    loyiha.value = res?.data || res
    notFound.value = false
  } catch (e) {
    if ([403, 404].includes(e?.response?.status)) notFound.value = true
    else showFailToast(errorText(e, t, locale.value))
  } finally {
    loading.value = false
  }
}
onMounted(() => Promise.all([load(), store.checkStorage()]))

const l = computed(() => loyiha.value || {})
const fileOf = (section) => (l.value.files || []).find((f) => f.section === section) || null
const archiveFile = computed(() => fileOf('archive'))
const workingFile = computed(() => fileOf('working'))

const rows = (pairs) => pairs.filter(([, v]) => v !== '' && v !== null && v !== undefined)
const mainRows = computed(() =>
  rows([
    [t('loyihaManagerLabel'), l.value.manager_name],
    [t('loyihaOtherLabel'), l.value.other_source],
    [t('loyihaSystemLabel'), l.value.system_info],
    [t('loyihaAreaLabel'), l.value.area != null ? `${formatNumber(l.value.area)} m²` : ''],
    [t('loyihaGivenDateLabel'), l.value.given_date ? formatDate(l.value.given_date) : ''],
    [t('loyihaFinishedDateLabel'), l.value.finished_date ? formatDate(l.value.finished_date) : ''],
    [t('loyihaCreatedBy'), fullName(l.value.creator || l.value.user) || ''],
  ]),
)
const docRows = (prefix, keys) =>
  rows([
    [t(keys[0]), l.value[`${prefix}_number`]],
    [t(keys[1]), l.value[`${prefix}_sum`] != null ? money(l.value[`${prefix}_sum`], t) : ''],
    [t(keys[2]), l.value[`${prefix}_date`] ? formatDate(l.value[`${prefix}_date`]) : ''],
  ])
const kpRows = computed(() => docRows('kp', ['loyihaKpNumberLabel', 'loyihaKpSumLabel', 'loyihaKpDateLabel']))
const dogovorRows = computed(() =>
  docRows('dogovor', ['loyihaDogovorNumberLabel', 'loyihaDogovorSumLabel', 'loyihaDogovorDateLabel']),
)

// ─── Loyiha amallari ───
function menu() {
  showActionSheet({
    title: `#${formatLoyihaId(l.value.order_number)}`,
    actions: [
      { name: t('edit'), key: 'edit' },
      { name: t('deleteConfirm'), key: 'delete', color: '#b91c1c' },
    ],
    cancelText: t('cancel'),
  })
    .then(async (a) => {
      if (a.key === 'edit') router.push({ name: 'loyiha-edit', params: { id } })
      if (a.key === 'delete') await removeLoyiha()
    })
    .catch(() => {})
}

async function removeLoyiha() {
  try {
    await showConfirmDialog({ message: t('loyihaDeleteConfirm'), confirmButtonText: t('deleteConfirm'), cancelButtonText: t('cancel') })
  } catch {
    return
  }
  try {
    await store.deleteLoyiha(id)
    showSuccessToast(t('loyihaMessageDeleted'))
    store.getAllLoyihas().catch(() => {})
    router.back()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}

// ─── Fayllar ───
const fileInput = ref(null)
const uploadSection = ref(null)
const upload = reactive({ section: null, name: '', percent: 0 })

function pickFile(section) {
  if (!store.storageReady) return showFailToast(t('loyihaStorageNotReady'))
  uploadSection.value = section
  fileInput.value?.click()
}

async function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  const section = uploadSection.value
  if (!file || !section) return
  if (file.size / 1024 / 1024 > LOYIHA_MAX_MB) return showFailToast(t('m.mediaTooBig', { mb: LOYIHA_MAX_MB }))
  Object.assign(upload, { section, name: file.name, percent: 1 })
  try {
    await store.uploadFile(id, section, file, (p) => (upload.percent = Math.max(1, p)))
    upload.percent = 100
    showSuccessToast(t('loyihaFileUploaded'))
    await load()
  } catch (err) {
    showFailToast({ message: errorText(err, t, locale.value), wordBreak: 'break-word' })
  } finally {
    upload.section = null
  }
}

const opening = ref(null)
async function openFile(file, mode) {
  opening.value = `${file.id}-${mode}`
  try {
    const url = await store.getFileLink(file.id, mode)
    if (url) openExternal(url)
  } catch {
    showFailToast(t('loyihaFileLinkError'))
  } finally {
    opening.value = null
  }
}

const renameOpen = ref(false)
const renameValue = ref('')
function startRename() {
  renameValue.value = workingFile.value?.file_name || ''
  renameOpen.value = true
}
async function saveRename() {
  const name = renameValue.value.trim()
  if (!name || name === workingFile.value.file_name) {
    renameOpen.value = false
    return
  }
  try {
    await store.updateFile(workingFile.value.id, { file_name: name })
    showSuccessToast(t('loyihaFileUpdated'))
    renameOpen.value = false
    await load()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}

async function removeWorking() {
  try {
    await showConfirmDialog({ message: t('loyihaFileDeleteConfirm'), confirmButtonText: t('deleteConfirm'), cancelButtonText: t('cancel') })
  } catch {
    return
  }
  try {
    await store.deleteFile(workingFile.value.id)
    showSuccessToast(t('loyihaFileDeleted'))
    await load()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}

const fileMeta = (f) =>
  [formatSize(f.size_bytes), formatDateTime(f.createdAt || f.created), fullName(f.uploader)]
    .filter((x) => x && x !== '—')
    .join(' · ')
</script>

<template>
  <MPage
    :title="loyiha ? `#${formatLoyihaId(l.order_number)}` : $t('loyihaDetailTitle')"
    :subtitle="l.system_info || ''"
    :back="{ name: 'loyiha' }"
    :on-refresh="load"
  >
    <template v-if="loyiha" #right>
      <button type="button" class="m-head__btn" @click="menu"><van-icon name="ellipsis" /></button>
    </template>

    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="6" /></div>
    <MEmpty v-else-if="notFound || !loyiha" icon="warning-o" :title="$t('loyihaNotFound')" />

    <template v-else>
      <section class="ld-hero">
        <div class="ld-hero__tags">
          <span class="m-tag" :class="l.status === 'done' ? 'is-good' : 'is-warn'">
            {{ l.status === 'done' ? $t('loyihaStatusDone') : $t('loyihaStatusInProgress') }}
          </span>
          <span v-if="l.difficulty" class="m-tag" :class="difficultyTone(l.difficulty)">
            {{ $t('m.levelN', { n: l.difficulty }) }} · {{ $t(difficultyLabelKey(l.difficulty)) }}
          </span>
        </div>
        <h2>{{ l.system_info || $t('loyihaDetailTitle') }}</h2>
        <p v-if="l.area != null" class="ld-area m-num">{{ formatNumber(l.area) }} m²</p>
      </section>

      <!-- Fayllar -->
      <div class="m-section"><span class="m-section__title">{{ $t('loyihaTableFiles') }}</span></div>
      <div v-if="!store.storageReady" class="ld-warn"><van-icon name="warning-o" /> {{ $t('loyihaStorageNotReady') }}</div>

      <div class="m-card ld-file">
        <p class="ld-file__title"><van-icon name="lock" /> {{ $t('loyihaArchiveSection') }}</p>
        <template v-if="archiveFile">
          <div class="ld-file__row">
            <span class="ld-file__icon">{{ fileIcon(archiveFile.file_name) }}</span>
            <div class="ld-file__info">
              <b>{{ archiveFile.file_name }}</b>
              <small>{{ fileMeta(archiveFile) }}</small>
            </div>
          </div>
          <div class="ld-file__actions">
            <van-button size="small" icon="eye-o" :loading="opening === `${archiveFile.id}-inline`" @click="openFile(archiveFile, 'inline')">{{ $t('m.view') }}</van-button>
            <van-button size="small" icon="down" :loading="opening === `${archiveFile.id}-download`" @click="openFile(archiveFile, 'download')">{{ $t('loyihaDownload') }}</van-button>
          </div>
          <p class="ld-file__hint">{{ $t('loyihaArchiveLocked') }}</p>
        </template>
        <template v-else>
          <p class="ld-file__hint">{{ $t('loyihaArchiveHint') }}</p>
          <van-button v-if="upload.section !== 'archive'" size="small" type="primary" plain icon="plus" block @click="pickFile('archive')">
            {{ $t('loyihaAddFile') }}
          </van-button>
        </template>
        <van-progress v-if="upload.section === 'archive'" :percentage="upload.percent" :pivot-text="`${upload.percent}%`" class="ld-progress" />
      </div>

      <div class="m-card ld-file" :class="{ 'is-locked': !archiveFile }">
        <p class="ld-file__title"><van-icon name="description-o" /> {{ $t('loyihaWorkingSection') }}</p>
        <p v-if="!archiveFile" class="ld-file__hint">{{ $t('loyihaWorkingLockedHint') }}</p>
        <template v-else-if="workingFile">
          <div class="ld-file__row">
            <span class="ld-file__icon">{{ fileIcon(workingFile.file_name) }}</span>
            <div class="ld-file__info">
              <b>{{ workingFile.file_name }}</b>
              <small>{{ fileMeta(workingFile) }}</small>
            </div>
          </div>
          <div class="ld-file__actions is-wrap">
            <van-button size="small" icon="eye-o" :loading="opening === `${workingFile.id}-inline`" @click="openFile(workingFile, 'inline')">{{ $t('m.view') }}</van-button>
            <van-button size="small" icon="down" :loading="opening === `${workingFile.id}-download`" @click="openFile(workingFile, 'download')">{{ $t('loyihaDownload') }}</van-button>
            <van-button size="small" icon="edit" @click="startRename">{{ $t('loyihaRename') }}</van-button>
            <van-button size="small" icon="replay" @click="pickFile('working')">{{ $t('loyihaReplace') }}</van-button>
            <van-button size="small" icon="delete-o" type="danger" plain @click="removeWorking">{{ $t('deleteConfirm') }}</van-button>
          </div>
        </template>
        <template v-else>
          <p class="ld-file__hint">{{ $t('loyihaWorkingHint') }}</p>
          <van-button v-if="upload.section !== 'working'" size="small" type="primary" plain icon="plus" block @click="pickFile('working')">
            {{ $t('loyihaAddFile') }}
          </van-button>
        </template>
        <van-progress v-if="upload.section === 'working'" :percentage="upload.percent" :pivot-text="`${upload.percent}%`" class="ld-progress" />
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionMain') }}</span></div>
      <van-cell-group inset>
        <van-cell v-for="[label, value] in mainRows" :key="label" :title="label" :value="String(value)" value-class="ld-value" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionClient') }}</span></div>
      <van-cell-group inset>
        <van-cell
          :title="$t('loyihaPhoneLabel')"
          :value="l.contact_phone || '—'"
          :url="telHref(l.contact_phone)"
          :is-link="!!telHref(l.contact_phone)"
          value-class="ld-value m-num"
        />
        <van-cell :title="$t('loyihaAddressLabel')" :value="l.contact_address || '—'" value-class="ld-value" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionKp') }}</span></div>
      <van-cell-group v-if="kpRows.length" inset>
        <van-cell v-for="[label, value] in kpRows" :key="label" :title="label" :value="String(value)" value-class="ld-value m-num" />
      </van-cell-group>
      <p v-else class="ld-none">{{ $t('loyihaNoKp') }}</p>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionDogovor') }}</span></div>
      <van-cell-group v-if="dogovorRows.length" inset>
        <van-cell v-for="[label, value] in dogovorRows" :key="label" :title="label" :value="String(value)" value-class="ld-value m-num" />
      </van-cell-group>
      <p v-else class="ld-none">{{ $t('loyihaNoDogovor') }}</p>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaCommentLabel') }}</span></div>
      <p v-if="l.comment" class="m-card ld-text">{{ l.comment }}</p>
      <p v-else class="ld-none">{{ $t('loyihaNoComment') }}</p>
    </template>

    <input ref="fileInput" type="file" hidden @change="onFile" />

    <MSheet v-model="renameOpen" :title="$t('loyihaRename')">
      <van-cell-group inset>
        <van-field v-model="renameValue" :label="$t('loyihaFileName')" label-align="top" />
      </van-cell-group>
      <template #footer>
        <van-button @click="renameOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" @click="saveRename">{{ $t('save') }}</van-button>
      </template>
    </MSheet>
  </MPage>
</template>

<style scoped>
.ld-hero {
  padding: 18px 16px;
  background: var(--m-surface);
  border-bottom: 1px solid var(--m-line);
}

.ld-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ld-hero h2 {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.ld-area {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 600;
  color: var(--m-primary);
}

.ld-warn {
  display: flex;
  gap: 8px;
  margin: 0 12px 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--m-warn-soft);
  color: var(--m-warn);
  font-size: 13px;
}

.ld-file.is-locked {
  opacity: 0.7;
}

.ld-file__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.ld-file__row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.ld-file__icon {
  font-size: 28px;
  line-height: 1;
}

.ld-file__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ld-file__info b {
  font-size: 14px;
  overflow-wrap: anywhere;
}

.ld-file__info small {
  font-size: 12px;
  color: var(--m-muted);
}

.ld-file__actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.ld-file__actions.is-wrap {
  flex-wrap: wrap;
}

.ld-file__actions .van-button {
  border-radius: 9px;
}

.ld-file__hint {
  margin: 8px 0;
  font-size: 12px;
  color: var(--m-muted);
  line-height: 1.4;
}

.ld-progress {
  margin-top: 12px;
}

:deep(.ld-value) {
  flex: 1.4;
  color: var(--m-ink);
}

.ld-none {
  padding: 0 16px;
  font-size: 13px;
  color: var(--m-muted);
}

.ld-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
