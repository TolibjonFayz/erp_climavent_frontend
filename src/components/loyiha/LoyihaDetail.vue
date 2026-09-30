<template>
  <UiPage>
    <template #title>
      <el-button class="ld-back" link :icon="ArrowLeft" @click="goBack">
        {{ $t('loyihaPageTitle') }}
      </el-button>
      <h1 class="ld-title">
        {{ $t('loyihaDetailTitle') }}
        <span v-if="loyiha" class="ld-id">{{ formatLoyihaId(loyiha.order_number) }}</span>
        <el-tag
          v-if="loyiha"
          :type="loyiha.status === 'done' ? 'success' : 'warning'"
          size="small"
          effect="light"
        >
          {{ $t(statusLabelKey(loyiha.status)) }}
        </el-tag>
      </h1>
    </template>
    <template v-if="loyiha" #subtitle>
      {{ $t('loyihaCreatedBy') }}: <b>{{ fullName(loyiha.creator) || '—' }}</b> ·
      {{ formatDateTime(loyiha.createdAt) }}
    </template>
    <template v-if="loyiha" #actions>
      <el-button :icon="EditPen" @click="openEditDialog">{{ $t('edit') }}</el-button>
      <el-popconfirm
        :title="$t('loyihaDeleteConfirm')"
        width="280"
        placement="bottom-end"
        :confirm-button-text="$t('deleteConfirm')"
        :cancel-button-text="$t('cancel')"
        @confirm="handleDelete"
      >
        <template #reference>
          <el-button type="danger" plain :icon="Delete">{{ $t('delete') }}</el-button>
        </template>
      </el-popconfirm>
    </template>

    <div v-loading="loading">
      <template v-if="loyiha">
        <div class="ld-grid">
          <UiPanel :title="$t('loyihaSectionMain')" :icon="Document">
            <UiInfoList :items="mainItems" />
          </UiPanel>

          <UiPanel :title="$t('loyihaDifficultyLabel')" :icon="TrendCharts">
            <div v-if="loyiha.difficulty" class="ld-diff">
              <div class="ld-diff__value" :class="`is-${difficultyTag(loyiha.difficulty)}`">
                {{ loyiha.difficulty }}<small>/10</small>
              </div>
              <div class="ld-diff__bar">
                <div
                  class="ld-diff__fill"
                  :class="`is-${difficultyTag(loyiha.difficulty)}`"
                  :style="{ width: `${loyiha.difficulty * 10}%` }"
                ></div>
              </div>
              <span class="ld-muted">{{ difficultyLabel(loyiha.difficulty) }}</span>
            </div>
            <p v-else class="ld-empty">{{ $t('loyihaNotRated') }}</p>
          </UiPanel>

          <UiPanel :title="$t('loyihaSectionClient')" :icon="Phone">
            <UiInfoList v-if="hasContact" :items="contactItems" />
            <p v-else class="ld-empty">{{ $t('loyihaNoContact') }}</p>
          </UiPanel>
        </div>

        <div class="ld-grid ld-grid--2">
          <UiPanel :title="$t('loyihaSectionKp')" :icon="Tickets">
            <UiInfoList v-if="hasKp" :items="kpItems" />
            <p v-else class="ld-empty">{{ $t('loyihaNoKp') }}</p>
          </UiPanel>
          <UiPanel :title="$t('loyihaSectionDogovor')" :icon="Files">
            <UiInfoList v-if="hasDogovor" :items="dogovorItems" />
            <p v-else class="ld-empty">{{ $t('loyihaNoDogovor') }}</p>
          </UiPanel>
        </div>

        <UiPanel :title="$t('loyihaCommentLabel')" :icon="ChatLineSquare" class="ld-gap">
          <p v-if="loyiha.comment" class="ld-comment">{{ loyiha.comment }}</p>
          <p v-else class="ld-empty">{{ $t('loyihaNoComment') }}</p>
        </UiPanel>

        <el-alert
          v-if="!loyihaStore.storageReady"
          class="ld-gap"
          type="warning"
          :closable="false"
          show-icon
          :title="$t('loyihaStorageNotReady')"
        />

        <!-- Fayllar: ishchi bo'lim faqat arxiv fayli yuklangach ochiladi -->
        <div class="ld-grid ld-grid--2 ld-gap">
          <LoyihaFileSection
            archive
            :file="archiveFile"
            :storage-ready="loyihaStore.storageReady"
            @upload="(e) => handleUpload(e, 'archive')"
            @download="downloadFile"
          />
          <LoyihaFileSection
            v-if="archiveFile"
            :file="workingFile"
            :storage-ready="loyihaStore.storageReady"
            @upload="(e) => handleUpload(e, 'working')"
            @download="downloadFile"
            @rename="handleRename"
            @remove="handleFileDelete"
          />
          <UiPanel v-else :title="$t('loyihaWorkingSection')" :icon="Folder">
            <div class="ld-locked">
              <el-icon :size="28"><Lock /></el-icon>
              <p>{{ $t('loyihaWorkingLockedHint') }}</p>
            </div>
          </UiPanel>
        </div>
      </template>

      <el-empty v-else-if="!loading" :description="$t('loyihaNotFound')">
        <el-button type="primary" @click="goBack">{{ $t('loyihaBack') }}</el-button>
      </el-empty>
    </div>

    <!-- Tahrirlash -->
    <LoyihaFormDialog v-model="dialogVisible" :model-value-data="loyiha" @saved="reload" />
  </UiPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ChatLineSquare,
  Delete,
  Document,
  EditPen,
  Files,
  Folder,
  Lock,
  Phone,
  Tickets,
  TrendCharts,
} from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiInfoList from '@/components/ui/UiInfoList.vue'
import { telHref } from '@/utils/format'
import { useLoyihaStore } from '@/stores/loyiha'
import loyihaApi from '@/api/loyiha'
import LoyihaFileSection from './LoyihaFileSection.vue'
import LoyihaFormDialog from './LoyihaFormDialog.vue'
import {
  formatNumber,
  formatDate,
  formatDateTime,
  formatMoney,
  formatLoyihaId,
  difficultyTag,
  statusLabelKey,
  fullName,
} from '@/utils/loyihaFormat'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loyihaStore = useLoyihaStore()

const loyiha = ref(null)
const loading = ref(true)
const dialogVisible = ref(false)

const loyihaId = computed(() => Number(route.params.id))

// Har bo'limda bitta fayl
const archiveFile = computed(
  () => (loyiha.value?.files || []).find((f) => f.section === 'archive') || null,
)
const workingFile = computed(
  () => (loyiha.value?.files || []).find((f) => f.section === 'working') || null,
)
const hasContact = computed(() => !!(loyiha.value?.contact_phone || loyiha.value?.contact_address))
const hasKp = computed(
  () => !!(loyiha.value?.kp_number || loyiha.value?.kp_sum || loyiha.value?.kp_date),
)
const hasDogovor = computed(
  () => !!(loyiha.value?.dogovor_number || loyiha.value?.dogovor_sum || loyiha.value?.dogovor_date),
)

const money = (v) => (v || v === 0 ? `${formatMoney(v)} ${t('amoCurrency')}` : '')

const mainItems = computed(() => {
  const l = loyiha.value || {}
  return [
    { key: 'manager', label: t('loyihaManagerLabel'), value: l.manager_name },
    { key: 'other', label: t('loyihaOtherLabel'), value: l.other_source },
    { key: 'system', label: t('loyihaSystemLabel'), value: l.system_info },
    {
      key: 'area',
      label: t('loyihaAreaLabel'),
      value: l.area != null ? `${formatNumber(l.area)} m²` : '',
    },
  ]
})
const contactItems = computed(() => {
  const l = loyiha.value || {}
  return [
    {
      key: 'phone',
      label: t('loyihaPhoneLabel'),
      value: l.contact_phone,
      href: telHref(l.contact_phone),
    },
    { key: 'address', label: t('loyihaAddressLabel'), value: l.contact_address },
  ]
})
const docItems = (prefix, labels) => {
  const l = loyiha.value || {}
  return [
    { key: 'number', label: t(labels[0]), value: l[`${prefix}_number`] },
    { key: 'sum', label: t(labels[1]), value: money(l[`${prefix}_sum`]) },
    {
      key: 'date',
      label: t(labels[2]),
      value: l[`${prefix}_date`] ? formatDate(l[`${prefix}_date`]) : '',
    },
  ]
}
const kpItems = computed(() =>
  docItems('kp', ['loyihaKpNumberLabel', 'loyihaKpSumLabel', 'loyihaKpDateLabel']),
)
const dogovorItems = computed(() =>
  docItems('dogovor', [
    'loyihaDogovorNumberLabel',
    'loyihaDogovorSumLabel',
    'loyihaDogovorDateLabel',
  ]),
)

const difficultyLabel = (value) => {
  const n = Number(value) || 0
  if (n >= 8) return t('loyihaDifficultyHigh')
  if (n >= 4) return t('loyihaDifficultyMid')
  return t('loyihaDifficultyLow')
}

const reload = async () => {
  try {
    const res = await loyihaApi.getOne(loyihaId.value)
    loyiha.value = res?.data || res
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      loyiha.value = null
    } else {
      ElMessage.error(t('loyihaMessageLoadError'))
    }
  }
}

const goBack = () => router.push('/loyiha')

const openEditDialog = () => {
  dialogVisible.value = true
}

const handleDelete = async () => {
  try {
    await loyihaStore.deleteLoyiha(loyihaId.value)
    ElMessage.success(t('loyihaMessageDeleted'))
    router.push('/loyiha')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaMessageDeleteError'))
  }
}

// ─── Fayllar ───
const handleUpload = async ({ file, onProgress, onDone, onError }, section) => {
  try {
    await loyihaStore.uploadFile(loyihaId.value, section, file, onProgress)
    onDone()
    ElMessage.success(t('loyihaFileUploaded'))
    await reload()
  } catch (error) {
    onError()
    ElMessage.error(error?.response?.data?.message || t('loyihaFileUploadError'))
  }
}

const downloadFile = async (file) => {
  try {
    const url = await loyihaStore.getFileLink(file.id, 'download')
    if (url) window.open(url, '_blank')
  } catch {
    ElMessage.error(t('loyihaFileLinkError'))
  }
}

const handleRename = async ({ file, name }) => {
  try {
    await loyihaStore.updateFile(file.id, { file_name: name })
    ElMessage.success(t('loyihaFileUpdated'))
    await reload()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileUpdateError'))
  }
}

const handleFileDelete = async (file) => {
  try {
    await loyihaStore.deleteFile(file.id)
    ElMessage.success(t('loyihaFileDeleted'))
    await reload()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileDeleteError'))
  }
}

onMounted(async () => {
  await Promise.all([reload(), loyihaStore.checkStorage()])
  loading.value = false
})
</script>

<style scoped>
.ld-back {
  align-self: flex-start;
  margin-bottom: 2px;
  color: var(--ui-muted);
}
.ld-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--ui-ink);
}
.ld-id {
  font-variant-numeric: tabular-nums;
  color: var(--ui-link);
}
.ld-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.ld-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}
.ld-gap {
  margin-top: 16px;
}
.ld-empty {
  margin: 0;
  font-size: 13px;
  color: var(--ui-faint);
}
.ld-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.ld-comment {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ui-ink-2);
  white-space: pre-line;
}

/* Qiyinlik shkalasi */
.ld-diff {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ld-diff__value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.ld-diff__value small {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-muted);
}
.ld-diff__bar {
  height: 8px;
  background: var(--ui-line-soft);
  border-radius: 4px;
  overflow: hidden;
}
.ld-diff__fill {
  height: 100%;
  border-radius: 0 4px 4px 0;
}
.is-success {
  color: var(--ui-good);
}
.is-warning {
  color: var(--ui-warn);
}
.is-danger {
  color: var(--ui-bad);
}
.ld-diff__fill.is-success {
  background: var(--ui-good);
}
.ld-diff__fill.is-warning {
  background: #f59e0b;
}
.ld-diff__fill.is-danger {
  background: var(--ui-bad);
}

/* Ishchi bo'lim yopiq */
.ld-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 8px;
  text-align: center;
  color: var(--ui-faint);
}
.ld-locked p {
  margin: 0;
  max-width: 320px;
  font-size: 13px;
  color: var(--ui-muted);
}

@media (max-width: 1100px) {
  .ld-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 700px) {
  .ld-grid,
  .ld-grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>
