<template>
  <UiPage>
    <template #title>
      <el-button class="cd-back" link :icon="ArrowLeft" @click="goback()">
        {{ $t('mijozlarVaHamkorlar') }}
      </el-button>
      <h1 class="cd-title">{{ partnerData?.fullname || $t('mijozmaininfo') }}</h1>
    </template>
    <template v-if="partnerData" #subtitle>
      <span class="cd-meta">
        <el-tag size="small" effect="plain">{{
          partnerTypeLabel(partnerData.partner_type)
        }}</el-tag>
        <span v-if="partnerData.mijozturi">{{ partnerData.mijozturi }}</span>
        <span v-if="partnerData.createdAt">
          · {{ $t('custCreated') }}: {{ formatDate(partnerData.createdAt) }}
        </span>
      </span>
    </template>
    <template v-if="partnerData" #actions>
      <el-button type="primary" :icon="Edit" @click="openEditDialog">
        {{ $t('edit') }}
      </el-button>
    </template>

    <div v-loading="loading">
      <template v-if="partnerData">
        <div class="cd-grid">
          <UiPanel :title="$t('custFormMain')" :icon="User">
            <UiInfoList :items="mainItems" />
          </UiPanel>
          <UiPanel :title="$t('aloqamalumoti')" :icon="Phone">
            <UiInfoList :items="contactItems" />
          </UiPanel>
          <UiPanel :title="$t('manzilmalumoti')" :icon="Location">
            <UiInfoList :items="addressItems" />
          </UiPanel>
        </div>

        <UiPanel :title="$t('qoshimchaIzoh')" :icon="Document" class="cd-note">
          <template #actions>
            <el-button link type="primary" :icon="Edit" @click="openMoreInfoDialog">
              {{ $t('edit') }}
            </el-button>
          </template>
          <p v-if="partnerData.more_info" class="cd-note__text">{{ partnerData.more_info }}</p>
          <p v-else class="cd-note__empty">{{ $t('custNoNote') }}</p>
        </UiPanel>
      </template>

      <el-empty v-else-if="!loading" :description="$t('Kiritilmagan')" />
    </div>

    <!-- Tahrirlash -->
    <el-dialog
      v-model="editDialogVisible"
      :title="$t('edit')"
      width="640px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-alert
        v-if="!canEdit"
        type="warning"
        :title="$t('vaqt_chegarasi_xabari', { days: getCreatedDaysAgo() })"
        :closable="false"
        show-icon
      />

      <el-form v-else ref="editFormRef" :model="editForm" label-position="top" class="cd-form">
        <el-form-item :label="$t('form_toliqFIO')" prop="fullname">
          <el-input v-model="editForm.fullname" :placeholder="$t('form_toliqFIO_placeholder')" />
        </el-form-item>
        <div class="cd-form__grid">
          <el-form-item :label="$t('form_mijozTuri')" prop="mijozturi">
            <el-input
              v-model="editForm.mijozturi"
              :placeholder="$t('form_mijozTuri_placeholder')"
            />
          </el-form-item>
          <el-form-item :label="$t('form_inn')" prop="inn">
            <el-input v-model="editForm.inn" :placeholder="$t('form_inn_placeholder')" />
          </el-form-item>
          <el-form-item :label="$t('form_telefonRaqami')" prop="phone_number">
            <el-input
              v-model="editForm.phone_number"
              :placeholder="$t('form_telefonRaqami_placeholder')"
            />
          </el-form-item>
          <el-form-item :label="$t('form_qoshimchaTelefon')" prop="additional_phone_number">
            <el-input
              v-model="editForm.additional_phone_number"
              :placeholder="$t('form_qoshimchaTelefon_placeholder')"
            />
          </el-form-item>
        </div>
        <div class="cd-form__grid cd-form__grid--3">
          <el-form-item :label="$t('form_respublika')" prop="republic">
            <el-input
              v-model="editForm.republic"
              :placeholder="$t('form_respublika_placeholder')"
            />
          </el-form-item>
          <el-form-item :label="$t('form_viloyat')" prop="viloyat">
            <el-input v-model="editForm.viloyat" :placeholder="$t('form_viloyat_placeholder')" />
          </el-form-item>
          <el-form-item :label="$t('form_shaharTuman')" prop="shahar_tuman">
            <el-input
              v-model="editForm.shahar_tuman"
              :placeholder="$t('form_shaharTuman_placeholder')"
            />
          </el-form-item>
        </div>
        <el-form-item :label="$t('form_qoshimchamalumot')" prop="more_info">
          <el-input
            v-model="editForm.more_info"
            type="textarea"
            :placeholder="$t('form_qoshimchamalumot_placeholder')"
            :rows="4"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">{{ $t('bekor_qilish') }}</el-button>
        <el-button v-if="canEdit" type="primary" :loading="editLoading" @click="handleSaveEdit">
          {{ $t('saqlash') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Qo'shimcha izoh -->
    <el-dialog
      v-model="moreInfoDialogVisible"
      :title="$t('form_qoshimchamalumot')"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-input
        v-model="moreInfoForm.more_info"
        type="textarea"
        :placeholder="$t('form_qoshimchamalumot_placeholder')"
        :rows="8"
        show-word-limit
        maxlength="1000"
      />
      <template #footer>
        <el-button @click="moreInfoDialogVisible = false">{{ $t('bekor_qilish') }}</el-button>
        <el-button type="primary" :loading="moreInfoLoading" @click="handleSaveMoreInfo">
          {{ $t('saqlash') }}
        </el-button>
      </template>
    </el-dialog>
  </UiPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, Edit, Location, Phone, User } from '@element-plus/icons-vue'
import { usePartnersStore } from '@/stores/partners'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import router from '@/router'
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiInfoList from '@/components/ui/UiInfoList.vue'
import { partnerTypeLabel } from '@/utils/partners'

const partnersStore = usePartnersStore()
const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const editDialogVisible = ref(false)
const editLoading = ref(false)
const moreInfoDialogVisible = ref(false)
const moreInfoLoading = ref(false)

const editForm = ref({
  fullname: '',
  mijozturi: '',
  inn: '',
  phone_number: '',
  additional_phone_number: '',
  republic: '',
  viloyat: '',
  shahar_tuman: '',
  more_info: '',
})
const moreInfoForm = ref({ more_info: '' })

const partnerData = computed(() => partnersStore.partnerbyid)

// Mijozni faqat qo'shilganidan keyin 1 kun ichida tahrirlash mumkin
const DAY_MS = 24 * 60 * 60 * 1000
const canEdit = computed(() => {
  if (!partnerData.value?.createdAt) return false
  return Date.now() - new Date(partnerData.value.createdAt).getTime() < DAY_MS
})
const getCreatedDaysAgo = () => {
  if (!partnerData.value?.createdAt) return 0
  return Math.floor((Date.now() - new Date(partnerData.value.createdAt).getTime()) / DAY_MS)
}

// ─── Ko'rsatish ───────────────────────────────────────────
const SPECIAL_NAMES = {
  ozbekiston: "O'zbekiston",
  qazoqstan: 'Qozoqstan',
  turkmonistaon: 'Turkmaniston',
  tajikiston: 'Tajikiston',
  kirgiziston: 'Qirgiziston',
  rossiya: 'Rossiya',
}
const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()

// "chilonzor_tumani" → "Chilonzor tumani"
function formatLocationName(name) {
  if (!name) return ''
  return name
    .split('_')
    .map((word) => {
      const lower = word.toLowerCase()
      if (SPECIAL_NAMES[lower]) return SPECIAL_NAMES[lower]
      for (const [re, suffix] of [
        [/shahri$|shahr$/, 'shahri'],
        [/tumani$|tuman$/, 'tumani'],
        [/rayoni$|rayon$/, 'rayoni'],
      ]) {
        if (re.test(lower)) return `${capitalize(lower.replace(re, ''))} ${suffix}`
      }
      return capitalize(word)
    })
    .join(' ')
}

const pad = (n) => String(n).padStart(2, '0')
function formatDate(value) {
  const d = new Date(value)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}
const telHref = (phone) => {
  const d = String(phone || '').replace(/[^0-9]/g, '')
  return d ? `tel:+${d.length === 9 ? `998${d}` : d}` : undefined
}

const mainItems = computed(() => {
  const p = partnerData.value
  return [
    { key: 'fullname', label: t('toliqFIO'), value: p.fullname },
    { key: 'type', label: t('mijozTuri'), value: p.mijozturi },
    { key: 'inn', label: t('inn'), value: p.inn },
    { key: 'group', label: t('guruh'), value: partnerTypeLabel(p.partner_type) },
    { key: 'created', label: t('custCreated'), value: p.createdAt ? formatDate(p.createdAt) : '' },
  ]
})
const contactItems = computed(() => {
  const p = partnerData.value
  return [
    { key: 'phone', label: t('telefon'), value: p.phone_number, href: telHref(p.phone_number) },
    {
      key: 'phone2',
      label: t('form_qoshimchaTelefon'),
      value: p.additional_phone_number,
      href: telHref(p.additional_phone_number),
    },
  ]
})
const addressItems = computed(() => {
  const p = partnerData.value
  return [
    { key: 'republic', label: t('respublika'), value: formatLocationName(p.republic) },
    { key: 'viloyat', label: t('viloyat'), value: formatLocationName(p.viloyat) },
    { key: 'district', label: t('shaharTuman'), value: formatLocationName(p.shahar_tuman) },
  ]
})

// ─── Amallar ──────────────────────────────────────────────
const goback = () => router.push('/')

function openEditDialog() {
  if (canEdit.value && partnerData.value) {
    const p = partnerData.value
    editForm.value = {
      fullname: p.fullname || '',
      mijozturi: p.mijozturi || '',
      inn: p.inn || '',
      phone_number: p.phone_number || '',
      additional_phone_number: p.additional_phone_number || '',
      republic: p.republic || '',
      viloyat: p.viloyat || '',
      shahar_tuman: p.shahar_tuman || '',
      more_info: p.more_info || '',
    }
  }
  editDialogVisible.value = true
}

async function handleSaveEdit() {
  if (!canEdit.value) {
    ElMessage.error(t('vaqt_tugagan'))
    return
  }
  editLoading.value = true
  try {
    await partnersStore.updateOnePartner(editForm.value, route.params.id)
    ElMessage.success(t('hamkor_yangilandi'))
    editDialogVisible.value = false
    await partnersStore.getOnePartner(route.params.id)
  } catch {
    ElMessage.error(t('yangilash_error'))
  } finally {
    editLoading.value = false
  }
}

function openMoreInfoDialog() {
  moreInfoForm.value = { more_info: partnerData.value?.more_info || '' }
  moreInfoDialogVisible.value = true
}

async function handleSaveMoreInfo() {
  moreInfoLoading.value = true
  try {
    await partnersStore.updateOnePartner(
      { more_info: moreInfoForm.value.more_info },
      route.params.id,
    )
    ElMessage.success(t('yangilash_success'))
    moreInfoDialogVisible.value = false
    await partnersStore.getOnePartner(route.params.id)
  } catch {
    ElMessage.error(t('yangilash_error'))
  } finally {
    moreInfoLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await partnersStore.getOnePartner(route.params.id)
  } catch {
    ElMessage.error(t('yangilash_error'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cd-back {
  align-self: flex-start;
  margin-bottom: 2px;
  color: var(--ui-muted);
}
.cd-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--ui-ink);
}
.cd-meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.cd-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.cd-note {
  margin-top: 16px;
}
.cd-note__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ui-ink-2);
  white-space: pre-line;
}
.cd-note__empty {
  margin: 0;
  font-size: 13px;
  color: var(--ui-faint);
}
.cd-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.cd-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
.cd-form__grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1100px) {
  .cd-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 700px) {
  .cd-grid,
  .cd-form__grid,
  .cd-form__grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
