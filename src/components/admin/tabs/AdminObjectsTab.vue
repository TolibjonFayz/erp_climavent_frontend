<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admTabObjects') }}</h2>
    </div>
    <div class="adm-toolbar">
      <el-input
        v-model="search"
        :placeholder="$t('admObjectsSearchPh')"
        :prefix-icon="Search"
        clearable
        class="adm-search"
      />
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
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        @selection-change="(rows) => (selected = rows)"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="№" type="index" width="75" align="center" />
        <el-table-column prop="id" label="ID" width="75" />
        <el-table-column prop="whereto" :label="$t('admWhereTo')" min-width="120" />
        <el-table-column :label="$t('admAddedBy')" min-width="130">
          <template #default="{ row }">{{ row.come_and_go_father?.user?.firstname }}</template>
        </el-table-column>
        <el-table-column :label="$t('admWentAt')" min-width="150">
          <template #default="{ row }">{{ dateOrEmpty(t, row.when_gone) }}</template>
        </el-table-column>
        <el-table-column :label="$t('admCameAt')" min-width="150">
          <template #default="{ row }">{{ dateOrEmpty(t, row.when_came) }}</template>
        </el-table-column>
        <el-table-column prop="dogovor_or_kp" :label="$t('admDogovorKp')" min-width="130" />
        <el-table-column prop="locationname" :label="$t('admAddress')" min-width="130" />
        <el-table-column prop="company_name" :label="$t('admCompany')" min-width="140" />
        <el-table-column prop="createdAt" :label="$t('admCreatedAt')" min-width="140" sortable>
          <template #default="{ row }">{{ dateOrEmpty(t, row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('admActions')" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-tooltip :content="$t('admObjectPage')" placement="top">
                <button class="act-btn act-btn--view" @click="router.push(`/sites/${row.come_and_go_father_id}`)">
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
import checkInOutApi from '@/api/checkInOut'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { dateOrEmpty, deleteMany, useAdminAudit } from '../adminShared'

const { t } = useI18n()
const router = useRouter()
const store = useComeAndGoInsideStore()
const { addAuditLog } = useAdminAudit()

const search = ref('')
const userFilter = ref('')
function resetFilters() {
  search.value = ''
  userFilter.value = ''
}

const userNames = computed(() => [
  ...new Set(store.allComeAndGoInsides.map((o) => o.come_and_go_father?.user?.firstname).filter(Boolean)),
])
const filtered = computed(() => {
  const s = search.value.toLowerCase().trim()
  return store.allComeAndGoInsides.filter((o) => {
    const matchSearch =
      !s ||
      (o.company_name ?? '').toLowerCase().includes(s) ||
      (o.locationname ?? '').toLowerCase().includes(s)
    return matchSearch && (!userFilter.value || o.come_and_go_father?.user?.firstname === userFilter.value)
  })
})

// ─── O'chirish ───
// Ro'yxatdagi qator — tashrif; o'chiriladigani uning obyekti (barcha tashriflari bilan)
const selected = ref([])
const loading = ref(false)
async function remove(rows) {
  const fatherIds = [...new Set(rows.map((r) => r.come_and_go_father_id).filter(Boolean))]
  try {
    await ElMessageBox.confirm(t('admObjectsDeleteConfirm', { n: fatherIds.length }), t('admObjectsDeleteTitle'), {
      confirmButtonText: t('admDelete'),
      cancelButtonText: t('cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  loading.value = true
  const { ok, failed } = await deleteMany(
    fatherIds.map((id) => ({ id })),
    (r) => checkInOutApi.remove(r.id),
  )
  await store.getAllComeAndGoInside()
  loading.value = false
  addAuditLog({ action: 'delete', message: t('admLogObjectsDeleted', { n: ok }), type: 'danger' })
  if (failed.length) ElMessage.error(t('admPartlyDeleted', { ok, bad: failed.length, err: failed[0] }))
  else ElMessage.success(t('admObjectsDeleted', { n: ok }))
}
</script>
