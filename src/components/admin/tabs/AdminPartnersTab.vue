<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admPartnersTitle') }}</h2>
    </div>
    <div class="adm-toolbar">
      <el-input
        v-model="search"
        :placeholder="$t('admPartnersSearchPh')"
        :prefix-icon="Search"
        clearable
        class="adm-search"
      />
      <el-select v-model="typeFilter" :placeholder="$t('admByType')" clearable class="adm-select">
        <el-option v-for="type in PARTNER_TYPES" :key="type.value" :label="$t(type.key)" :value="type.value" />
      </el-select>
      <el-select v-model="userFilter" :placeholder="$t('admAddedBy')" clearable class="adm-select">
        <el-option v-for="name in userNames" :key="name" :label="name" :value="name" />
      </el-select>
      <button class="adm-reset-btn" @click="resetFilters">
        <el-icon><RefreshLeft /></el-icon> {{ $t('admReset') }}
      </button>
      <el-button v-if="selected.length" type="danger" :icon="Delete" class="adm-add-btn" @click="remove(selected)">
        {{ $t('admDeleteSelected', { n: selected.length }) }}
      </el-button>
    </div>
    <div v-loading="loading" class="tbl-wrap">
      <el-table
        :data="filtered"
        row-key="id"
        stripe
        border
        style="width: 100%"
        :empty-text="$t('admNothingFound')"
        @selection-change="(rows) => (selected = rows)"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="№" type="index" width="75" align="center" />
        <el-table-column prop="id" label="ID" width="75" />
        <el-table-column :label="$t('admType')" min-width="150">
          <template #default="{ row }">
            <el-tag type="info">{{ partnerTypeLabel(t, row.partner_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admAddedBy')" min-width="150">
          <template #default="{ row }"><el-tag>{{ row.user?.firstname }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="fullname" :label="$t('admName')" min-width="150" />
        <el-table-column prop="phone_number" :label="$t('admPhone')" min-width="150" />
        <el-table-column prop="additional_phone_number" :label="$t('admExtraPhone')" min-width="150" />
        <el-table-column :label="$t('admAddress')" min-width="250">
          <template #default="{ row }">
            <el-tag>{{ row.republic }} {{ row.viloyat }} {{ row.shahar_tuman }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mijozturi" :label="$t('admLegalType')" min-width="130" />
        <el-table-column prop="inn" label="INN" min-width="110" />
        <el-table-column :label="$t('admActions')" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-tooltip :content="$t('admCustomerCard')" placement="top">
                <button class="act-btn act-btn--view" @click="router.push(`/customers/${row.id}`)">
                  <el-icon><View /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip :content="$t('admDelete')" placement="top">
                <button class="act-btn act-btn--block" @click="remove([row])">
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, RefreshLeft, Search, View } from '@element-plus/icons-vue'
import partnersApi from '@/api/partners'
import { usePartnersStore } from '@/stores/partners'
import { PARTNER_TYPES, deleteMany, partnerTypeLabel, useAdminAudit } from '../adminShared'

const { t } = useI18n()
const router = useRouter()
const partnersStore = usePartnersStore()
const { addAuditLog } = useAdminAudit()

const search = ref('')
const typeFilter = ref('')
const userFilter = ref('')
function resetFilters() {
  search.value = ''
  typeFilter.value = ''
  userFilter.value = ''
}

const userNames = computed(() => [
  ...new Set(partnersStore.allPartners.map((p) => p.user?.firstname).filter(Boolean)),
])
const filtered = computed(() => {
  const s = search.value.toLowerCase().trim()
  return partnersStore.allPartners.filter((p) => {
    const matchSearch =
      !s ||
      ['fullname', 'phone_number', 'additional_phone_number', 'inn'].some((k) =>
        (p[k] ?? '').toLowerCase().includes(s),
      )
    return (
      matchSearch &&
      (!typeFilter.value || (p.partner_type ?? '').trim() === typeFilter.value) &&
      (!userFilter.value || p.user?.firstname === userFilter.value)
    )
  })
})

// ─── O'chirish ───
const selected = ref([])
const loading = ref(false)
async function remove(rows) {
  const names = rows.slice(0, 3).map((r) => r.fullname).join(', ')
  try {
    await ElMessageBox.confirm(
      t('admPartnersDeleteConfirm', { n: rows.length, names: names + (rows.length > 3 ? '…' : '') }),
      t('admPartnersDeleteTitle'),
      { confirmButtonText: t('admDelete'), cancelButtonText: t('cancel'), type: 'warning' },
    )
  } catch {
    return
  }
  loading.value = true
  const { ok, failed } = await deleteMany(rows, (r) => partnersApi.remove(r.id))
  if (failed.length) {
    // Qaysilari o'chganini aniq bilish uchun ro'yxatni qayta yuklaymiz
    await partnersStore.getAllPartners()
  } else {
    const gone = new Set(rows.map((r) => r.id))
    partnersStore.allPartners = partnersStore.allPartners.filter((p) => !gone.has(p.id))
  }
  loading.value = false
  addAuditLog({ action: 'delete', message: t('admLogPartnersDeleted', { n: ok, names }), type: 'danger' })
  if (failed.length) ElMessage.error(t('admPartlyDeleted', { ok, bad: failed.length, err: failed[0] }))
  else ElMessage.success(t('admPartnersDeleted', { n: ok }))
}
</script>
