<template>
  <!-- Schyot-fakturalarda shartnomadagidan ko'p yozilgan tovar: qaysi fakturada va mijozning
       qaysi shartnomalarida shu tovar nechta yozilgani -->
  <div class="ot-over" :class="{ 'is-compact': compact }">
    <div class="ot-over__head">
      <el-icon class="ot-over__icon"><WarningFilled /></el-icon>
      <div>
        <div v-if="showName" class="ot-over__name">{{ item.name }}</div>
        <div class="ot-over__facts">
          {{ $t('otOverByContract') }}: <b>{{ qty(item.qty) }}</b>
          · {{ $t('otOverByInvoices') }}: <b class="is-bad">{{ qty(item.invoiced) }}</b>
          · <b class="is-bad">{{ $t('otOverExtra', { n: qty(item.over) }) }}</b>
        </div>
      </div>
    </div>

    <div class="ot-over__sec">
      <div class="ot-over__lbl">{{ $t('otOverInvoices') }}</div>
      <ul class="ot-over__list">
        <li v-for="(f, k) in item.invoices" :key="`f${k}`">
          <span>{{ invoiceRef(f) }}</span>
          — <b>{{ qty(f.qty) }}</b>
          <div v-if="otherNames(f.names).length" class="ot-over__alt">«{{ otherNames(f.names).join('», «') }}»</div>
        </li>
      </ul>
    </div>

    <div class="ot-over__sec">
      <div class="ot-over__lbl">{{ $t('otOverContracts') }}</div>
      <ul class="ot-over__list">
        <li v-for="(c, k) in item.contracts" :key="`c${k}`" :class="{ 'is-current': c.current }">
          <router-link v-if="linkOf(c)" :to="linkOf(c)" class="ot-over__link" @click.stop>{{ contractRef(c) }}</router-link>
          <span v-else>{{ contractRef(c) }}</span>
          <span v-if="c.current" class="ot-over__this">{{ $t('otOverThis') }}</span>
          — <b>{{ qty(c.qty, c.unit) }}</b>
          <div v-if="otherNames(c.names).length" class="ot-over__alt">«{{ otherNames(c.names).join('», «') }}»</div>
        </li>
      </ul>
      <div v-if="item.contracts.length <= 1" class="ot-over__hint">{{ $t('otOverNoOther') }}</div>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'
import { fmtQty } from '@/utils/skladFormat'
import { contractRef, invoiceRef } from '@/utils/otgruzkaFormat'

const props = defineProps({
  // { name, unit, qty, invoiced, over, invoices: [...], contracts: [...] } — backend `over_items` elementi
  item: { type: Object, required: true },
  // Tovar nomi sarlavhada (kartada jadval tagida — kerak; jadval qatori yonida — kerak emas)
  showName: { type: Boolean, default: true },
  compact: Boolean,
})

const qty = (n, unit) => `${fmtQty(n)} ${unit || props.item.unit || ''}`.trim()
// Faktura/shartnomadagi nom kartadagidan farq qilsa — ko'rsatiladi (qaysi qator mos kelgani aniq bo'lsin)
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
const otherNames = (names) => (names || []).filter((n) => norm(n) !== norm(props.item.name))
// Kartasi bor shartnoma — otgruzka kartasiga, kartasiz ERP shartnomasi — "Dogovorlar" bo'limiga
const linkOf = (c) => {
  if (c.current) return null
  if (c.order_id) return `/otgruzka/${c.order_id}`
  if (c.dogovor_number) return { path: '/dogovor', query: { n: String(c.dogovor_number), ...(c.dogovor_date ? { d: formatDate(c.dogovor_date) } : {}) } }
  return null
}
</script>

<style scoped lang="scss">
.ot-over {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--ui-bad-line);
  border-radius: 10px;
  background: var(--ui-bad-soft);
  font-size: 13px;
  line-height: 1.45;
  color: var(--ui-ink);
  text-align: left;
  white-space: normal;
  &.is-compact {
    padding: 0;
    border: 0;
    background: none;
    max-width: 440px;
  }
}
.ot-over__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.ot-over__icon {
  flex: none;
  margin-top: 2px;
  color: var(--ui-bad);
}
.ot-over__name {
  font-weight: 700;
  word-break: break-word;
}
.ot-over__facts .is-bad {
  color: var(--ui-bad);
}
.ot-over__sec {
  padding-left: 22px;
}
.ot-over__lbl {
  font-size: 12px;
  font-weight: 700;
  color: var(--ui-ink-2);
}
.ot-over__list {
  margin: 2px 0 0;
  padding-left: 18px;
  li.is-current {
    font-weight: 600;
  }
}
.ot-over__link {
  color: var(--ui-link);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
.ot-over__this {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 99px;
  background: var(--ui-link-soft);
  color: var(--ui-link);
  font-size: 11px;
  font-weight: 600;
}
.ot-over__alt,
.ot-over__hint {
  font-size: 12px;
  color: var(--ui-muted);
  word-break: break-word;
}
</style>
