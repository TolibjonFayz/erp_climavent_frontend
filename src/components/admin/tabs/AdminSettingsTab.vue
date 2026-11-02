<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admSettingsTitle') }}</h2>
    </div>
    <div class="settings-grid">
      <div class="settings-card">
        <div class="sc-icon"><el-icon :size="22"><Download /></el-icon></div>
        <h3 class="sc-title">{{ $t('admExportData') }}</h3>
        <p class="sc-desc">{{ $t('admExportDataDesc') }}</p>
        <div class="sc-btns">
          <button class="sc-btn" :disabled="!!busy" @click="exportPartners">
            <el-icon v-if="busy !== 'partners'"><User /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            {{ $t('admTabPartners') }}
          </button>
          <button class="sc-btn" :disabled="!!busy" @click="exportObjects">
            <el-icon v-if="busy !== 'objects'"><OfficeBuilding /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            {{ $t('admTabObjects') }}
          </button>
        </div>
      </div>
      <div class="settings-card">
        <div class="sc-icon sc-icon--purple"><el-icon :size="22"><Document /></el-icon></div>
        <h3 class="sc-title">{{ $t('admExportAudit') }}</h3>
        <p class="sc-desc">{{ $t('admExportAuditDesc') }}</p>
        <div class="sc-btns">
          <button class="sc-btn" @click="exportAudit">
            <el-icon><Document /></el-icon> {{ $t('admLegacyActions') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Document, Download, Loading, OfficeBuilding, User } from '@element-plus/icons-vue'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import {
  auditLabel,
  dateOrEmpty,
  exportSheet,
  logActor,
  logTime,
  partnerTypeLabel,
  useAdminAudit,
} from '../adminShared'

const { t } = useI18n()
const partnersStore = usePartnersStore()
const objectsStore = useComeAndGoInsideStore()
const { auditLogs, addAuditLog } = useAdminAudit()
const busy = ref('')

// Eksport: qatorlarni yig'adi, faylga yozadi, jurnalga qayd qiladi
function run(kind, title, sheet, file, buildRows, log = true) {
  busy.value = kind
  try {
    const rows = buildRows()
    if (!exportSheet(rows, sheet, file)) return ElMessage.warning(t('admNoDataToExport'))
    if (log) addAuditLog({ action: 'export', message: t('admLogExported', { x: title, n: rows.length }), type: 'info' })
    ElMessage.success(t('admExported', { x: title }))
  } catch (e) {
    ElMessage.error(t('admExportError', { e: e.message }))
  } finally {
    busy.value = ''
  }
}

const exportPartners = () =>
  run('partners', t('admTabPartners'), 'Hamkorlar', 'Hamkorlar', () =>
    partnersStore.allPartners.map((p, i) => ({
      '№': i + 1,
      ID: p.id,
      [t('admType')]: partnerTypeLabel(t, p.partner_type),
      [t('admAddedByName')]: p.user?.firstname ?? '—',
      [t('admAddedByLogin')]: p.user?.username ?? '—',
      [t('admFullName')]: p.fullname ?? '—',
      [t('admPhone')]: p.phone_number ?? '—',
      [t('admExtraPhone')]: p.additional_phone_number ?? '—',
      [t('admRepublic')]: p.republic ?? '—',
      [t('admRegion')]: p.viloyat ?? '—',
      [t('admDistrict')]: p.shahar_tuman ?? '—',
      [t('admLegalType')]: p.mijozturi ?? '—',
      INN: p.inn ?? '—',
    })),
  )

const exportObjects = () =>
  run('objects', t('admTabObjects'), 'Obyektlar', 'Obyektlar', () =>
    objectsStore.allComeAndGoInsides.map((o, i) => ({
      '№': i + 1,
      ID: o.id,
      [t('admWhereTo')]: o.whereto ?? '—',
      [t('admAddedBy')]: o.come_and_go_father?.user?.username ?? '—',
      [t('admWentAt')]: dateOrEmpty(t, o.when_gone),
      [t('admCameAt')]: dateOrEmpty(t, o.when_came),
      [t('admDogovorKp')]: o.dogovor_or_kp ?? '—',
      [t('admAddress')]: o.locationname ?? '—',
      [t('admCompany')]: o.company_name ?? '—',
      [t('admCreatedAt')]: dateOrEmpty(t, o.createdAt),
    })),
  )

const exportAudit = () =>
  run(
    'audit',
    t('admLegacyActions'),
    'AuditLog',
    'AuditLog',
    () =>
      (auditLogs.value || []).map((l, i) => ({
        '№': i + 1,
        [t('admTime')]: logTime(l),
        [t('admAction')]: auditLabel(t, l.action),
        [t('admMessage')]: l.message,
        [t('admDoneBy')]: logActor(l),
      })),
    false,
  )
</script>
