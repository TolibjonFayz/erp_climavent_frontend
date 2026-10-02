<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('attConfirmAllTitle', { month: monthLabel })"
    width="760px"
    @update:model-value="emit('update:modelValue', $event)"
    @open="load"
  >
    <div v-loading="loading" class="ca">
      <p class="ca__hint">{{ $t('attConfirmAllHint') }}</p>

      <el-table :data="rows" size="small" max-height="460">
        <el-table-column width="44">
          <template #default="{ row }">
            <el-checkbox v-model="row.selected" :disabled="!row.records.length" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('colEmployee')" min-width="180">
          <template #default="{ row }">
            <span class="ca__name">{{ row.name }}</span>
            <span v-if="!row.camDays" class="ca__nocam">{{ $t('attConfirmAllNoCam') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('attConfirmAllColDays')" min-width="360">
          <template #default="{ row }">
            <span v-if="!row.records.length" class="ca__empty">{{ $t('attConfirmAllEmpty') }}</span>
            <span v-for="c in row.counts" :key="c.key" class="ca__chip">
              <span class="ca__dot" :style="{ background: c.color }"></span>{{ $t(c.labelKey) }}
              <b>{{ c.n }}</b>
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('total')" width="70" align="right">
          <template #default="{ row }">{{ row.records.length }}</template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('cancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!selectedRecords.length" @click="save">
        {{ $t('attConfirmAllBtn', { n: selectedRecords.length }) }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
// Tanlangan oy uchun kameraga bog'langan barcha xodimlarning tasdiqlanmagan kunlarini
// avtomatik taklif bo'yicha bir yo'la saqlaydi. Tasdiqlangan kunlarga tegilmaydi.
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import attendanceApi from '@/api/attendance'
import checkInOutApi from '@/api/checkInOut'
import { useAttendanceStore } from '@/stores/attendance'
import {
  confirmRecord,
  flattenTrips,
  groupTripsByDate,
  hiredFrom,
  suggestStatus,
  toDateStr,
} from './suggest'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  month: { type: String, required: true }, // YYYY-MM
  monthLabel: { type: String, default: '' },
  employees: { type: Array, default: () => [] }, // ERP xodimlari
  statusList: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'done'])

const { t } = useI18n()
const attendanceStore = useAttendanceStore()
const currentUserId = Number(localStorage.getItem('userid'))

const loading = ref(false)
const saving = ref(false)
const rows = ref([])

const selectedRecords = computed(() =>
  rows.value.filter((r) => r.selected).flatMap((r) => r.records),
)

const asArray = (res) => (Array.isArray(res) ? res : res?.data || [])

const load = async () => {
  loading.value = true
  rows.value = []
  try {
    const [existing, camera, officeDays] = await Promise.all([
      attendanceApi.getAllMonth(props.month),
      attendanceApi.getCameraAllMonth(props.month),
      attendanceApi.getCameraOfficeDays(props.month),
      attendanceStore.getCameraSetup(),
    ])
    const confirmed = new Set(asArray(existing).map((r) => `${r.user_id}|${r.date}`))
    const officeOpen = new Set(officeDays || [])
    const cameraEmployees = attendanceStore.cameraEmployees
    const today = toDateStr(new Date())

    // Faqat terminaldagi yuziga bog'langan, bloklanmagan ERP xodimlari
    const linked = props.employees.filter(
      (u) => !u.is_blocked && cameraEmployees.some((e) => e.user_id === u.id),
    )
    const tripsByUser = await Promise.all(
      linked.map((u) =>
        checkInOutApi
          .getByUser(u.id)
          .then((res) => groupTripsByDate(flattenTrips(asArray(res))))
          .catch(() => ({})),
      ),
    )

    const [y, m] = props.month.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()

    rows.value = linked.map((u, i) => {
      const cam = {}
      for (const r of camera || []) if (r.user_id === u.id) cam[r.date] = r
      const camDays = Object.keys(cam).length
      const from = hiredFrom(
        cameraEmployees.find((e) => e.user_id === u.id),
        cameraEmployees,
      )
      const records = []
      for (let d = 1; d <= daysInMonth; d++) {
        const date = `${props.month}-${String(d).padStart(2, '0')}`
        if (date >= today || confirmed.has(`${u.id}|${date}`)) continue
        const status = suggestStatus(date, {
          today,
          trips: tripsByUser[i][date],
          cam: cam[date],
          hasCamera: camDays > 0,
          officeOpen,
          hiredFrom: from,
        })
        if (status) {
          records.push(
            confirmRecord({ userId: u.id, date, status, cam: cam[date], createdBy: currentUserId }),
          )
        }
      }
      const counts = props.statusList
        .map((s) => ({ ...s, n: records.filter((r) => r.status === s.key).length }))
        .filter((c) => c.n)
      // Shu oy kamerada umuman yo'q xodim (ishdan ketgan bo'lishi mumkin) oldindan tanlanmaydi
      return {
        id: u.id,
        name: `${u.firstname} ${u.lastname}`,
        camDays,
        records,
        counts,
        selected: camDays > 0 && records.length > 0,
      }
    })
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const { created, skipped } = await attendanceStore.bulkCreate(selectedRecords.value)
    ElMessage.success(t('attConfirmAllDone', { created, skipped }))
    emit('update:modelValue', false)
    emit('done')
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.ca__hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--ui-muted);
}
.ca__name {
  font-weight: 600;
  color: var(--ui-ink);
}
.ca__nocam {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  border-radius: 999px;
}
.ca__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 2px 8px 2px 0;
  font-size: 12px;
  color: var(--ui-ink-2);

  b {
    font-variant-numeric: tabular-nums;
  }
}
.ca__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.ca__empty {
  font-size: 12px;
  color: var(--ui-faint);
}
</style>
