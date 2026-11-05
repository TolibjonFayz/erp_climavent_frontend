<template>
  <!-- Shartnoma mahsulotlari: nom, birlik, soni, narxi (summa hisoblanadi) -->
  <div class="ot-items-ed">
    <table v-if="modelValue.length" class="ot-items-ed__table">
      <thead>
        <tr>
          <th class="is-num">№</th>
          <th>{{ $t('otItemName') }}</th>
          <th class="is-unit">{{ $t('otItemUnit') }}</th>
          <th class="is-qty">{{ $t('otItemQty') }}</th>
          <th class="is-price">{{ $t('otItemPrice') }}</th>
          <th class="is-sum">{{ $t('otItemSum') }}</th>
          <th class="is-del"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(it, i) in modelValue" :key="i">
          <td class="is-num">{{ i + 1 }}</td>
          <td><el-input v-model="it.name" type="textarea" :autosize="{ minRows: 1, maxRows: 3 }" maxlength="500" /></td>
          <td><el-input v-model="it.unit" maxlength="32" /></td>
          <td><el-input-number v-model="it.qty" :min="0" :controls="false" style="width: 100%" /></td>
          <td><el-input-number v-model="it.price" :min="0" :controls="false" style="width: 100%" /></td>
          <td class="is-sum">{{ fmtMoney((it.qty || 0) * (it.price || 0)) }}</td>
          <td class="is-del">
            <el-button text type="danger" :icon="Delete" :aria-label="$t('otDelete')" @click="remove(i)" />
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" class="is-total">{{ $t('otItemsTotal') }}</td>
          <td class="is-sum"><b>{{ fmtMoney(total) }}</b></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <el-button size="small" :icon="Plus" @click="add">{{ $t('otItemAdd') }}</el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { fmtMoney } from '@/utils/otgruzkaFormat'

const props = defineProps({ modelValue: { type: Array, required: true } })
const emit = defineEmits(['update:modelValue'])

const total = computed(() => props.modelValue.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0))
const add = () => emit('update:modelValue', [...props.modelValue, { name: '', unit: 'шт', qty: 1, price: 0 }])
const remove = (i) => emit('update:modelValue', props.modelValue.filter((_, j) => j !== i))
</script>

<style scoped>
.ot-items-ed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}
.ot-items-ed__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ot-items-ed__table th {
  text-align: left;
  font-weight: 600;
  color: var(--ui-muted);
  padding: 4px 4px 6px;
  border-bottom: 1px solid var(--ui-line);
}
.ot-items-ed__table td {
  padding: 4px;
  vertical-align: top;
  border-bottom: 1px solid var(--ui-line);
}
.is-num {
  width: 28px;
  color: var(--ui-muted);
  padding-top: 10px !important;
}
.is-unit {
  width: 64px;
}
.is-qty {
  width: 80px;
}
.is-price {
  width: 120px;
}
.is-sum {
  width: 120px;
  text-align: right !important;
  white-space: nowrap;
  padding-top: 10px !important;
}
.is-del {
  width: 36px;
}
.is-total {
  text-align: right;
  color: var(--ui-muted);
  padding-top: 8px !important;
}
</style>
