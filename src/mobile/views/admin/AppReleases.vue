<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { formatDateTime } from '@/utils/format'
import { formatSize } from '@/utils/loyihaFormat'
import MSheet from '../../components/MSheet.vue'
import MEmpty from '../../components/MEmpty.vue'
import { releasesApi } from '../../api'
import { currentVersion } from '../../updater'
import { errorText } from '../../utils'

// Admin: yangi APK yuklash — xodimlar ilovasi keyingi ochilishda yangilashni taklif qiladi
const { t, locale } = useI18n()

const list = ref([])
const loading = ref(true)
const current = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await releasesApi.list()
    list.value = Array.isArray(res) ? res : []
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  current.value = await currentVersion()
  load()
})

const nextCode = computed(() => Math.max(current.value?.build || 0, ...list.value.map((r) => r.version_code)) + 1)

const open = ref(false)
const form = reactive({ file: null, version_name: '', version_code: '', notes: '' })
const progress = ref(0)
const uploading = ref(false)
const fileInput = ref(null)

function openUpload() {
  Object.assign(form, { file: null, version_name: '', version_code: String(nextCode.value), notes: '' })
  progress.value = 0
  open.value = true
}
function onFile(e) {
  form.file = e.target.files?.[0] || null
  e.target.value = ''
  // Fayl nomidan versiyani taxmin qilamiz: Climavent-ERP-1.0.1.apk
  const m = form.file?.name.match(/(\d+\.\d+(?:\.\d+)?)/)
  if (m && !form.version_name) form.version_name = m[1]
}

async function upload() {
  if (!form.file) return showFailToast(t('m.relChooseFile'))
  if (!/^\d+(\.\d+){0,3}$/.test(form.version_name.trim())) return showFailToast(t('m.relBadName'))
  if (!(Number(form.version_code) > 0)) return showFailToast(t('m.relBadCode'))
  const data = new FormData()
  data.append('file', form.file)
  data.append('version_name', form.version_name.trim())
  data.append('version_code', String(Number(form.version_code)))
  data.append('notes', form.notes.trim())
  data.append('platform', 'android')
  uploading.value = true
  progress.value = 1
  try {
    await releasesApi.upload(data, (p) => (progress.value = Math.max(1, p)))
    progress.value = 100
    showSuccessToast(t('m.relUploaded'))
    open.value = false
    await load()
  } catch (e) {
    showFailToast({ message: errorText(e, t, locale.value), wordBreak: 'break-word' })
  } finally {
    uploading.value = false
  }
}

async function remove(r) {
  try {
    await showConfirmDialog({
      message: t('m.relDeleteConfirm', { v: r.version_name }),
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  try {
    await releasesApi.remove(r.id)
    await load()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}
</script>

<template>
  <div class="ar">
    <div class="m-card ar-info">
      <p>{{ $t('m.relInfo') }}</p>
      <p v-if="current" class="m-muted ar-current">
        {{ $t('m.relThisDevice', { v: current.version, c: current.build }) }}
      </p>
      <van-button type="primary" block icon="upgrade" @click="openUpload">{{ $t('m.relUpload') }}</van-button>
    </div>

    <van-loading v-if="loading" class="ar-loading" />
    <template v-else>
      <div v-for="(r, i) in list" :key="r.id" class="m-card ar-item">
        <div class="ar-item__top">
          <b>v{{ r.version_name }}</b>
          <span class="m-tag" :class="i === 0 ? 'is-good' : ''">{{ i === 0 ? $t('m.relLatest') : `#${r.version_code}` }}</span>
          <button type="button" class="ar-del" @click="remove(r)"><van-icon name="delete-o" /></button>
        </div>
        <p v-if="r.notes" class="ar-notes">{{ r.notes }}</p>
        <small class="m-muted">{{ formatDateTime(r.createdAt) }} · {{ formatSize(r.file_size) }} · code {{ r.version_code }}</small>
      </div>
      <MEmpty v-if="!list.length" icon="upgrade" :title="$t('m.relEmpty')" />
    </template>

    <MSheet v-model="open" :title="$t('m.relUpload')">
      <van-cell-group inset class="ar-form">
        <van-field
          :model-value="form.file ? `${form.file.name} (${formatSize(form.file.size)})` : ''"
          :label="$t('m.relFile')"
          label-align="top"
          readonly
          is-link
          :placeholder="$t('m.relChooseFile')"
          @click="fileInput?.click()"
        />
        <van-field v-model="form.version_name" :label="$t('m.relVersionName')" label-align="top" placeholder="1.0.1" />
        <van-field v-model="form.version_code" :label="$t('m.relVersionCode')" label-align="top" type="digit" />
        <van-field v-model="form.notes" :label="$t('m.relNotes')" label-align="top" type="textarea" rows="3" autosize :placeholder="$t('m.relNotesPlaceholder')" />
      </van-cell-group>
      <van-progress v-if="uploading" :percentage="progress" class="ar-progress" />
      <input ref="fileInput" type="file" accept=".apk,application/vnd.android.package-archive" hidden @change="onFile" />
      <template #footer>
        <van-button @click="open = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="uploading" @click="upload">{{ $t('m.relUploadBtn') }}</van-button>
      </template>
    </MSheet>
  </div>
</template>

<style scoped>
.ar {
  padding-top: 12px;
}

.ar-info p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--m-ink-2);
}

.ar-current {
  margin: 8px 0 12px;
}

.ar-loading {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.ar-item__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ar-item__top b {
  font-size: 16px;
}

.ar-del {
  margin-left: auto;
  border: 0;
  background: none;
  color: var(--m-faint);
  font-size: 18px;
}

.ar-notes {
  margin: 8px 0 6px;
  font-size: 14px;
  white-space: pre-wrap;
  line-height: 1.45;
}

.ar-item small {
  font-size: 12px;
}

.ar-form :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}

.ar-progress {
  margin: 14px 18px 0;
}
</style>
