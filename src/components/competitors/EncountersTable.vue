<template>
  <el-table :data="rows" size="small" :empty-text="$t('cmpNoEncounters')">
    <el-table-column :label="$t('cmpDate')" width="110">
      <template #default="{ row }">{{ formatDate(row.encounter_date) }}</template>
    </el-table-column>
    <el-table-column v-if="showCompetitor" :label="$t('cmpCompetitor')" min-width="160">
      <template #default="{ row }">{{ row.competitor?.name || '—' }}</template>
    </el-table-column>
    <el-table-column v-if="showClient" :label="$t('cmpClient')" min-width="170">
      <template #default="{ row }">
        <router-link v-if="row.partner" :to="`/customers/${row.partner.id}`" class="et-link">
          {{ row.partner.fullname }}
        </router-link>
        <span v-else>{{ row.client_name || '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('cmpKpNumber')" width="100">
      <template #default="{ row }">{{ row.kp_number ? `№${row.kp_number}` : '—' }}</template>
    </el-table-column>
    <el-table-column :label="$t('cmpPrices')" min-width="200">
      <template #default="{ row }">
        <div v-if="row.their_price != null || row.our_price != null" class="et-prices">
          <span>{{ $t('cmpTheirShort') }}: {{ money(row.their_price) }}</span>
          <span>{{ $t('cmpOurShort') }}: {{ money(row.our_price) }}</span>
          <span v-if="gap(row) !== null" :class="gap(row) > 0 ? 'et-bad' : 'et-good'">
            {{ gap(row) > 0 ? '+' : '' }}{{ gap(row) }}%
          </span>
        </div>
        <span v-else>—</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('cmpOutcome')" width="130">
      <template #default="{ row }">
        <el-tag size="small" :type="outcomeOf(row.outcome).tag" effect="plain">
          {{ $t(outcomeOf(row.outcome).labelKey) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column :label="$t('cmpReason')" width="120">
      <template #default="{ row }">{{ row.reason ? $t(`cmpReason_${row.reason}`) : '—' }}</template>
    </el-table-column>
    <el-table-column prop="note" :label="$t('cmpNote')" min-width="180" show-overflow-tooltip />
    <el-table-column v-if="showAuthor" :label="$t('cmpAuthor')" min-width="140">
      <template #default="{ row }">
        {{ row.creator ? `${row.creator.firstname} ${row.creator.lastname || ''}` : '—' }}
      </template>
    </el-table-column>
    <el-table-column width="90" align="right">
      <template #default="{ row }">
        <template v-if="canModify(row)">
          <el-button link :icon="Edit" @click="emit('edit', row)" />
          <el-button link type="danger" :icon="Delete" @click="emit('delete', row)" />
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { Delete, Edit } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useUsersStore } from '@/stores/user'
import { fmtNum, formatDate } from '@/utils/format'
import { outcomeOf } from './competitorFormat'

defineProps({
  rows: { type: Array, default: () => [] },
  showCompetitor: { type: Boolean, default: true },
  showClient: { type: Boolean, default: true },
  showAuthor: { type: Boolean, default: false },
})
const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()
const usersStore = useUsersStore()

const money = (v) => (v != null ? `${fmtNum(Math.round(Number(v)))} ${t('amoCurrency')}` : '—')
// Bizning narx raqibnikidan necha % farq qiladi (musbat — biz qimmat)
const gap = (r) =>
  r.their_price != null && r.our_price != null && Number(r.our_price) > 0
    ? Math.round(((Number(r.our_price) - Number(r.their_price)) / Number(r.our_price)) * 100)
    : null
// Backend bilan bir xil qoida: kiritgan xodim yoki admin
const canModify = (r) =>
  !!usersStore.currentUser?.is_admin || Number(r.created_by) === Number(usersStore.currentUser?.id)
</script>

<style scoped>
.et-link {
  color: var(--ui-link);
  text-decoration: none;
}
.et-prices {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  line-height: 1.5;
}
.et-bad {
  color: var(--ui-bad);
  font-weight: 600;
}
.et-good {
  color: var(--ui-good);
  font-weight: 600;
}
</style>
