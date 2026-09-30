<template>
  <!-- "Mijoz emas" raqamlarni boshqarish: shubhalilar va belgilanganlar -->
  <el-drawer
    v-model="open"
    :size="drawerSize"
    :title="$t('amoExclusionsTitle')"
    append-to-body
    destroy-on-close
    @open="loadAll"
  >
    <p class="exd-rules">{{ $t('amoExclusionsRules') }}</p>

    <el-tabs v-model="tab">
      <!-- Shubhali raqamlar -->
      <el-tab-pane name="suspicious" :label="`${$t('amoSuspiciousTab')} (${suspicious.length})`">
        <p class="exd-hint">{{ $t('amoSuspiciousHint', { days: 90, calls: 20 }) }}</p>
        <el-table
          v-loading="loading"
          :data="suspicious"
          size="small"
          stripe
          :empty-text="$t('amoSuspiciousEmpty')"
        >
          <el-table-column :label="$t('amoColPhone')" min-width="150">
            <template #default="{ row }">
              <a :href="telHref(row.phone)" class="exd-link">{{ row.phone }}</a>
            </template>
          </el-table-column>
          <el-table-column :label="$t('amoColContact')" min-width="170">
            <template #default="{ row }">{{
              (row.contact_names || []).join(', ') || '—'
            }}</template>
          </el-table-column>
          <el-table-column
            :label="$t('amoColCalls')"
            prop="calls"
            min-width="90"
            align="right"
            sortable
          />
          <el-table-column :label="$t('amoTalked')" prop="talked" min-width="100" align="right" />
          <el-table-column :label="$t('amoColLastCall')" min-width="130">
            <template #default="{ row }">{{ formatDateTime(row.last_at) }}</template>
          </el-table-column>
          <el-table-column :label="$t('amoManager')" min-width="130">
            <template #default="{ row }">{{ userName(row.responsible_user_id) }}</template>
          </el-table-column>
          <el-table-column min-width="110">
            <template #header>
              <AmoHint :label="$t('amoColHasLead')" :hint="$t('amoHintHasLead')" />
            </template>
            <template #default="{ row }">
              <el-tag v-if="row.has_lead" size="small" type="success" effect="plain">{{
                $t('amoYes')
              }}</el-tag>
              <el-tag v-else size="small" type="warning" effect="plain">{{ $t('amoNo') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column width="120" align="right" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                type="danger"
                plain
                @click="askExclude(row.phone, (row.contact_names || [])[0])"
              >
                {{ $t('amoNotClientBtn') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Belgilangan raqamlar -->
      <el-tab-pane name="excluded" :label="`${$t('amoExcludedTab')} (${excluded.length})`">
        <div class="exd-toolbar">
          <el-button size="small" type="primary" :icon="Plus" @click="askExclude('', '')">
            {{ $t('amoAddNumber') }}
          </el-button>
        </div>
        <el-table
          v-loading="loading"
          :data="excluded"
          size="small"
          stripe
          :empty-text="$t('amoExcludedEmpty')"
        >
          <el-table-column :label="$t('amoColPhone')" min-width="150" prop="phone" />
          <el-table-column :label="$t('amoColContact')" min-width="160">
            <template #default="{ row }">{{ row.contact_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('amoExcludeReason')" min-width="120">
            <template #default="{ row }">{{ $t(`amoExcludeReason_${row.reason}`) }}</template>
          </el-table-column>
          <el-table-column :label="$t('amoExcludeComment')" min-width="150">
            <template #default="{ row }">{{ row.note || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('amoColCalls')" prop="calls" min-width="90" align="right" />
          <el-table-column :label="$t('amoColMarkedBy')" min-width="150">
            <template #default="{ row }">
              {{ row.created_by_name || '—' }}
              <div class="exd-muted">{{ formatDateTime(row.created_at) }}</div>
            </template>
          </el-table-column>
          <el-table-column width="110" align="right" fixed="right">
            <template #default="{ row }">
              <el-popconfirm :title="$t('amoRestoreConfirm')" @confirm="restore(row)">
                <template #reference>
                  <el-button size="small" plain>{{ $t('amoRestoreBtn') }}</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <AmoExcludeDialog
      v-model="dialogOpen"
      :phone="dialogPhone"
      :contact-name="dialogContact"
      @saved="onChanged"
    />
  </el-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAmocrmStore } from '@/stores/amocrm'
import AmoHint from './AmoHint.vue'
import AmoExcludeDialog from './AmoExcludeDialog.vue'
import { formatDateTime, telHref } from './amoFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  users: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'changed'])

const { t } = useI18n()
const amoStore = useAmocrmStore()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const drawerSize = computed(() => (window.innerWidth < 768 ? '100%' : '980px'))
const tab = ref('suspicious')
const loading = ref(false)
const suspicious = ref([])
const excluded = ref([])

const userName = (id) =>
  id ? props.users.find((u) => u.id === Number(id))?.name || `#${id}` : t('amoUnknownManager')

async function loadAll() {
  loading.value = true
  try {
    const [s, e] = await Promise.all([amoStore.getSuspicious(), amoStore.listExcluded()])
    suspicious.value = s || []
    excluded.value = e || []
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    loading.value = false
  }
}

const dialogOpen = ref(false)
const dialogPhone = ref('')
const dialogContact = ref('')

function askExclude(phone, contact) {
  dialogPhone.value = phone || ''
  dialogContact.value = contact || ''
  dialogOpen.value = true
}

async function restore(row) {
  try {
    await amoStore.restorePhone(row.phone_key)
    ElMessage.success(t('amoRestoreDone'))
    onChanged()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  }
}

function onChanged() {
  loadAll()
  emit('changed')
}
</script>

<style scoped>
.exd-rules,
.exd-hint {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0 0 12px;
  white-space: pre-line;
}
.exd-hint {
  font-size: 12px;
  color: #6b7280;
}
.exd-toolbar {
  margin-bottom: 10px;
}
.exd-link {
  color: #2a78d6;
  text-decoration: none;
}
.exd-muted {
  font-size: 11px;
  color: #9ca3af;
}
</style>
