<template>
  <!-- Karta ekran o'rtasida (dialog); sarlavha va yopish tugmasi kartaning o'zida -->
  <el-dialog
    :model-value="modelValue != null"
    width="min(860px, 96vw)"
    top="3vh"
    :show-close="false"
    append-to-body
    class="ot-drawer"
    @close="$emit('update:modelValue', null)"
  >
    <div v-loading="loading" class="ot-d">
      <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />
      <template v-if="o">
        <header class="ot-d__head">
          <div class="ot-d__title">
            <div class="ot-d__meta">
              № {{ o.dogovor_number || '—' }} · {{ $t(`otSeries_${o.series}`) }}
              <template v-if="o.sheet_row && o.source === 'sheet'"> · {{ $t('otSheetRow', { row: o.sheet_row }) }}</template>
            </div>
            <h3>{{ o.client_name || '—' }}</h3>
            <div class="ot-d__tags">
              <span class="ot-tag" :class="`is-${STAGE_TONE[o.stage]}`">{{ $t(`otStage_${o.stage}`) }}</span>
              <span class="ot-tag" :class="`is-${PAY_TONE[o.pay_status]}`">{{ $t(`otPay_${o.pay_status}`) }}</span>
            </div>
          </div>
          <el-button text :icon="Close" :aria-label="$t('onbClose')" @click="$emit('update:modelValue', null)" />
        </header>

        <el-alert v-if="o.sheet_removed" type="warning" show-icon :closable="false" :title="$t('otRemoved')" />
        <div v-if="o.alerts.length" class="ot-d__alerts">
          <div v-for="a in o.alerts" :key="a"><el-icon><WarningFilled /></el-icon> {{ $t(`otAlert_${a}`) }}</div>
        </div>
        <div v-if="o.final_status && o.final_reason" class="ot-d__final">
          <b>{{ $t('otFinalReason') }}:</b> {{ o.final_reason }}
        </div>

        <!-- Jarayon bosqichlari -->
        <div class="ot-steps">
          <div class="ot-step" :class="[`is-${didoxTone}`, { 'is-click': canEdit && o.official }]" v-bind="stepAttrs('didox', o.official)">
            <span class="ot-step__name">{{ $t('otStepDidox') }}<el-icon v-if="canEdit && o.official" class="ot-step__pen"><EditPen /></el-icon></span>
            <template v-if="o.official">
              <span class="ot-step__val">{{ $t('otDidoxContract') }}: {{ flag(o.didox_contract) }}</span>
              <span class="ot-step__val">{{ $t('otDidoxPoa') }}: {{ flag(o.didox_poa) }}</span>
            </template>
            <span v-else class="ot-step__val">{{ $t('otNa') }}</span>
          </div>
          <div class="ot-step" :class="`is-${PAY_TONE[o.pay_status]}`">
            <span class="ot-step__name">{{ $t('otStepPay') }}</span>
            <b>{{ fmtPct(o.contract_sum > 0 ? o.paid_sum / o.contract_sum : 0) }}</b>
            <span class="ot-step__val">{{ fmtShort(o.paid_sum) }} / {{ fmtShort(o.contract_sum) }}</span>
          </div>
          <div class="ot-step" :class="[o.ready_pct >= 1 ? 'is-good' : 'is-link', { 'is-click': canEdit }]" v-bind="stepAttrs('ready')">
            <span class="ot-step__name">{{ $t('otStepReady') }}<el-icon v-if="canEdit" class="ot-step__pen"><EditPen /></el-icon></span>
            <b>{{ fmtPct(o.ready_pct) }}</b>
            <span v-if="o.sgp_date" class="ot-step__val">{{ formatDate(o.sgp_date) }}</span>
          </div>
          <div class="ot-step" :class="[o.shipped_pct >= 1 ? 'is-good' : o.shipped_pct > 0 ? 'is-link' : 'is-muted', { 'is-click': canEdit }]" v-bind="stepAttrs('shipped')">
            <span class="ot-step__name">{{ $t('otStepShip') }}<el-icon v-if="canEdit" class="ot-step__pen"><EditPen /></el-icon></span>
            <b>{{ fmtPct(o.shipped_pct) }}</b>
          </div>
          <div class="ot-step" :class="[o.invoice_numbers || o.didox_files_count ? 'is-good' : 'is-muted', { 'is-click': canEdit }]" v-bind="stepAttrs('invoice')">
            <span class="ot-step__name">{{ $t('otStepInvoice') }}<el-icon v-if="canEdit" class="ot-step__pen"><EditPen /></el-icon></span>
            <span class="ot-step__val">{{ o.invoice_numbers || '—' }}</span>
            <span v-if="o.didox_files_count" class="ot-step__val">📎 {{ o.didox_files_count }} · {{ fmtShort(o.didox_files_sum) }}</span>
          </div>
        </div>

        <!-- Ombor tekshiruvi (yangi shartnoma kelganda) -->
        <div v-if="o.sklad_check === 'pending'" class="ot-d__sklad is-pending">
          <el-icon><Bell /></el-icon> {{ $t('otSkladPending') }}
        </div>
        <div v-else-if="o.sklad_check === 'done'" class="ot-d__sklad is-done">
          <el-icon><CircleCheck /></el-icon>
          {{ $t('otSkladDone', { date: formatDateTime(o.sklad_checked_at) }) }}
          <template v-if="o.sklad_check_note"> — {{ o.sklad_check_note }}</template>
        </div>

        <!-- Keyingi qadam — har doim tahrirlanadi -->
        <section class="ot-sec ot-next">
          <h4>{{ $t('otNextTitle') }}</h4>
          <el-input v-model="next.text" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" :placeholder="$t('otNextPh')" maxlength="2000" />
          <div class="ot-next__row">
            <el-date-picker v-model="next.date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :placeholder="$t('otNextDate')" />
            <el-button type="primary" :disabled="!nextDirty" :loading="saving === 'next'" @click="saveNext">{{ $t('otSave') }}</el-button>
          </div>
        </section>

        <!-- Asosiy ma'lumot -->
        <section class="ot-sec">
          <div class="ot-sec__head">
            <h4>{{ $t('otColClient') }}</h4>
            <el-button v-if="canEdit" size="small" :icon="Edit" @click="editOpen = true">{{ $t('otEdit') }}</el-button>
          </div>
          <dl class="ot-info">
            <dt>{{ $t('otManager') }}</dt><dd>{{ o.manager_name || '—' }}</dd>
            <dt>{{ $t('otInn') }}</dt><dd>{{ o.client_inn || '—' }}</dd>
            <dt>{{ $t('otContact') }}</dt><dd>{{ o.client_contact || '—' }}</dd>
            <dt>{{ $t('otPhone') }}</dt>
            <dd>
              <template v-if="phones.length">
                <a v-for="p in phones" :key="p" :href="telHref(p)" class="ot-phone">{{ p }}</a>
              </template>
              <template v-else>—</template>
            </dd>
            <dt>{{ $t('otDate') }}</dt><dd>{{ o.dogovor_date ? formatDate(o.dogovor_date) : '—' }}</dd>
            <dt>{{ $t('otSum') }}</dt><dd><b>{{ fmtMoney(o.contract_sum) }}</b></dd>
            <dt>{{ $t('otInvoice') }}</dt><dd>{{ o.invoice_numbers || '—' }}</dd>
            <dt>{{ $t('otErpDogovor') }}</dt>
            <dd>
              <router-link v-if="o.dogovor" :to="{ path: '/dogovor', query: { n: String(o.dogovor.dogovor_number), d: formatDate(o.dogovor.dogovor_date) } }">
                № {{ o.dogovor.dogovor_number }} · {{ formatDate(o.dogovor.dogovor_date) }}
              </router-link>
              <span v-else class="ot-muted">{{ $t('otErpDogovorNone') }}</span>
            </dd>
          </dl>
        </section>

        <!-- To'lovlar -->
        <section class="ot-sec">
          <div class="ot-sec__head">
            <h4>
              <UiHint :label="$t('otPayments')" :hint="canEdit ? (twoWay ? $t('otPaymentsHintTwoWay') : '') : $t('otPaymentsHint')" />
            </h4>
            <span class="ot-muted">{{ $t('otPayTotal') }}: <b>{{ fmtMoney(o.paid_sum) }}</b></span>
          </div>
          <div v-if="!o.payments.length" class="ot-muted">{{ $t('otNoPayments') }}</div>
          <div v-for="p in o.payments" :key="p.id" class="ot-pay">
            <span class="ot-pay__date">{{ formatDate(p.pay_date) }}</span>
            <span class="ot-pay__amount" :class="{ 'is-neg': p.amount < 0 }">{{ p.amount > 0 ? '+' : '' }}{{ fmtMoney(p.amount) }}</span>
            <span class="ot-pay__comment">{{ payComment(p) }}</span>
            <span class="ot-pay__btns">
              <el-button text size="small" :icon="EditPen" :aria-label="$t('otPayEdit')" @click="editPayment(p)" />
              <el-popconfirm v-if="canEdit && p.source === 'erp'" :title="$t('otConfirmDelete')" @confirm="removePayment(p)">
                <template #reference><el-button text size="small" type="danger" :icon="Delete" :aria-label="$t('otDelete')" /></template>
              </el-popconfirm>
            </span>
          </div>
          <div v-if="canEdit" class="ot-pay-add">
            <el-date-picker v-model="pay.date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :placeholder="$t('otPayDate')" class="ot-pay-add__date" />
            <UiMoneyInput v-model="pay.amount" :placeholder="$t('otPayAmount')" class="ot-pay-add__amount" />
            <el-input v-model="pay.comment" :placeholder="$t('otPayComment')" class="ot-pay-add__comment" />
            <el-button type="primary" :icon="Plus" :disabled="!pay.amount || !pay.date" :loading="saving === 'pay'" @click="addPayment">
              {{ $t('otPayAdd') }}
            </el-button>
          </div>
        </section>

        <!-- Didox: schyot-faktura fayllari (to'lovlardan keyin, mahsulotlardan oldin) -->
        <OtDidoxFiles :order="o" :is-admin="isAdmin" @changed="applyDetail" />

        <!-- Mahsulotlar: shartnomadagi nom/soni/narxi + omborda nechtasi tayyor -->
        <section class="ot-sec">
          <div class="ot-sec__head">
            <h4>
              <UiHint :label="$t('otItems')" :hint="$t('otItemsHint')" />
            </h4>
            <span class="ot-sec__btns">
              <span v-if="stock && o.items.length" class="ot-tag" :class="`is-${stockTone(stock.summary)}`">
                {{ $t('otStockSummary', { ready: stock.summary.ready_positions, total: stock.summary.positions }) }}
              </span>
              <el-button size="small" :icon="Edit" @click="openItems">{{ o.items.length ? $t('otEdit') : $t('otItemAdd') }}</el-button>
            </span>
          </div>
          <div v-if="o.items_from_dogovor" class="ot-muted">{{ $t('otItemsFromDogovor') }}</div>
          <div v-if="!o.items.length" class="ot-muted">{{ $t('otNoItems') }}</div>
          <table v-else v-loading="stockLoading" class="ot-lines ot-items">
            <thead>
              <tr>
                <th class="is-r ot-items__no">№</th>
                <th>{{ $t('otItemName') }}</th>
                <th class="is-r">{{ $t('otItemQty') }}</th>
                <th class="is-r">{{ $t('otItemPrice') }}</th>
                <th class="is-r">{{ $t('otItemSum') }}</th>
                <th>{{ $t('otItemStock') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in o.items" :key="i">
                <td class="is-r ot-muted ot-items__no">{{ i + 1 }}.</td>
                <td>{{ it.name }}</td>
                <td class="is-r nowrap">{{ fmtQty(it.qty) }} {{ it.unit || '' }}</td>
                <td class="is-r nowrap">{{ fmtMoney(it.price) }}</td>
                <td class="is-r nowrap">{{ fmtMoney((it.qty || 0) * (it.price || 0)) }}</td>
                <td>
                  <template v-if="stock?.rows[i]">
                    <el-tooltip placement="left" :disabled="stock.rows[i].status === 'unknown'">
                      <template #content>
                        <div v-if="stock.rows[i].item">
                          {{ $t('otStockItem') }}: {{ stock.rows[i].item.sap_name || stock.rows[i].item.name }}
                          <span v-if="stock.rows[i].approx">≈</span>
                        </div>
                        <div>{{ $t('otStockFree') }}: {{ fmtQty(stock.rows[i].balance ?? 0) }}</div>
                        <div>{{ $t('otStockReserved') }}: {{ fmtQty(stock.rows[i].reserved) }}</div>
                      </template>
                      <span class="ot-tag" :class="`is-${STOCK_TONE[stock.rows[i].status]}`">
                        <template v-if="stock.rows[i].status === 'unknown'">{{ $t('otStock_unknown') }}</template>
                        <template v-else>{{ fmtQty(stock.rows[i].ready) }} / {{ fmtQty(stock.rows[i].qty) }}</template>
                      </span>
                    </el-tooltip>
                  </template>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="is-r ot-muted">{{ $t('otItemsTotal') }}</td>
                <td class="is-r nowrap"><b>{{ fmtQty(itemsQty) }} {{ itemsUnit }}</b></td>
                <td></td>
                <td class="is-r nowrap"><b>{{ fmtMoney(itemsTotal) }}</b></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </section>

        <!-- Tovarlar (Лист1) -->
        <section v-if="o.lines.length" class="ot-sec">
          <h4>{{ $t('otLines') }}</h4>
          <table class="ot-lines">
            <thead>
              <tr>
                <th>{{ $t('otLineName') }}</th>
                <th>{{ $t('otLineQty') }}</th>
                <th>{{ $t('otLineIn') }}</th>
                <th>{{ $t('otLineOut') }}</th>
                <th>{{ $t('otLineRest') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in o.lines" :key="l.id">
                <td>{{ l.item_name }}<div v-if="l.client_label" class="ot-muted">{{ l.client_label }}</div></td>
                <td>{{ l.qty_contract ?? '—' }}</td>
                <td>{{ l.qty_in ?? '—' }}</td>
                <td>{{ l.qty_out ?? '—' }}</td>
                <td><b>{{ (l.qty_in ?? 0) - (l.qty_out ?? 0) }}</b></td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Tarix -->
        <section class="ot-sec">
          <h4><UiHint :label="$t('otHistory')" :hint="twoWay ? $t('otHistoryHintTwoWay') : ''" /></h4>
          <div class="ot-note-add">
            <el-segmented v-model="note.kind" :options="noteKinds" size="small" />
            <el-input v-model="note.text" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" :placeholder="$t('otNotePh')" maxlength="4000" />
            <el-button type="primary" :disabled="!note.text.trim()" :loading="saving === 'note'" @click="addNote">{{ $t('otNoteAdd') }}</el-button>
          </div>
          <!-- Xodimlar yozgan izohlar va tizim qayd etgan o'zgarishlar — alohida -->
          <el-segmented v-model="histTab" :options="histTabs" size="small" class="ot-hist-tabs" />
          <div v-if="!shownNotes.length" class="ot-muted">{{ $t(histTab === 'change' ? 'otNoChanges' : 'otNoComments') }}</div>
          <ul class="ot-tl" :class="`is-tab-${histTab}`">
            <li v-for="n in shownNotes" :key="n.id" :class="`is-${n.kind}`">
              <div class="ot-tl__meta">
                <span class="ot-tl__kind">{{ $t(`otNoteKind_${n.kind}`) }}</span>
                <span>{{ formatDateTime(n.createdAt) }}</span>
                <span>· {{ author(n) }}</span>
                <span v-if="n.source === 'sheet'" class="ot-tl__src">{{ n.data?.import ? $t('otNoteImport') : $t('otNoteFromSheet') }}</span>
                <el-popconfirm v-if="canDeleteNote(n)" :title="$t('otConfirmDelete')" @confirm="removeNote(n)">
                  <template #reference><el-button text size="small" type="danger" :icon="Delete" class="ot-tl__del" :aria-label="$t('otDelete')" /></template>
                </el-popconfirm>
              </div>
              <div v-if="n.kind === 'change'" class="ot-tl__text">
                <template v-if="n.data?.field === 'from_dogovor'">{{ $t('otFromDogovor') }}</template>
                <template v-else-if="n.data?.field === 'didox_file'">
                  {{ $t(`ot${{ poa: 'Poa', contract: 'Contract' }[n.data.file_kind] || 'Didox'}${n.data.action === 'remove' ? 'Removed' : 'Added'}`, { name: n.data.file_name }) }}
                  <template v-if="n.data.amount != null"> · {{ fmtMoney(n.data.amount) }}</template>
                </template>
                <template v-else-if="n.data?.field === 'sklad_check'">
                  {{ $t('otSkladChecked', { ready: n.data.ready ?? 0, total: n.data.total ?? 0 }) }}
                  <div v-if="n.text" class="ot-muted">{{ n.text }}</div>
                </template>
                <template v-else-if="n.data?.field === 'payment'">
                  {{ $t('otPaymentFixed', { date: formatDate(n.data.pay_date), amount: fmtMoney(n.data.amount) }) }}
                </template>
                <template v-else>
                  <b>{{ $t(`otField_${n.data?.field}`) }}:</b>
                  {{ changeValue(n.data?.field, n.data?.from) }} → {{ changeValue(n.data?.field, n.data?.to) }}
                </template>
              </div>
              <div v-else class="ot-tl__text">
                <span v-if="n.data?.field === 'note_extra'" class="ot-muted">{{ $t('otField_note_extra') }}: </span>{{ n.text }}
              </div>
            </li>
          </ul>
        </section>
      </template>
    </div>

    <!-- To'lovni to'g'rilash -->
    <el-dialog v-model="payEdit.open" :title="$t('otPayEdit')" width="420px" append-to-body>
      <el-form label-position="top">
        <el-form-item :label="$t('otPayDate')">
          <el-date-picker v-model="payEdit.date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" />
        </el-form-item>
        <el-form-item :label="$t('otPayAmount')">
          <UiMoneyInput v-model="payEdit.amount" :disabled="!canEdit" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('otPayComment')">
          <el-input v-model="payEdit.comment" maxlength="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payEdit.open = false">{{ $t('otCancel') }}</el-button>
        <el-button type="primary" :loading="saving === 'payEdit'" @click="savePayment">{{ $t('otSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- Mahsulotlarni tahrirlash (faqat ERP'da yuritiladi, jadvalga tegmaydi) -->
    <el-dialog v-model="itemsEdit.open" :title="$t('otItems')" width="min(820px, 96vw)" append-to-body>
      <OtItemsEditor v-model="itemsEdit.list" />
      <template #footer>
        <el-button @click="itemsEdit.open = false">{{ $t('otCancel') }}</el-button>
        <el-button type="primary" :loading="saving === 'items'" @click="saveItems">{{ $t('otSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- Bosqichni tez tahrirlash: tayyorlik, jo'natish, Didox, schyot-faktura -->
    <el-dialog v-model="qe.open" :title="qe.field ? $t(`otQuick_${qe.field}`) : ''" width="440px" append-to-body>
      <template v-if="qe.field === 'ready' || qe.field === 'shipped'">
        <div class="ot-qe__pct">
          <el-slider v-model="qe.pct" :step="5" class="ot-qe__slider" />
          <el-input-number v-model="qe.pct" :min="0" :max="100" :controls="false" class="ot-qe__num" />
          <span>%</span>
        </div>
        <div class="ot-qe__presets">
          <el-button v-for="v in [0, 25, 50, 75, 100]" :key="v" size="small" :type="qe.pct === v ? 'primary' : 'default'" @click="qe.pct = v">{{ v }}%</el-button>
        </div>
        <el-form v-if="qe.field === 'ready'" label-position="top" class="ot-qe__form">
          <el-form-item :label="$t('otSgp')">
            <el-date-picker v-model="qe.sgp_date" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" style="width: 100%" />
          </el-form-item>
        </el-form>
      </template>
      <el-form v-else-if="qe.field === 'didox'" label-position="top">
        <el-form-item :label="$t('otDidoxContract')"><el-segmented v-model="qe.didox_contract" :options="flagOptions" /></el-form-item>
        <el-form-item :label="$t('otDidoxPoa')"><el-segmented v-model="qe.didox_poa" :options="flagOptions" /></el-form-item>
      </el-form>
      <el-form v-else-if="qe.field === 'invoice'" label-position="top">
        <el-form-item :label="$t('otInvoice')"><el-input v-model="qe.invoice" maxlength="255" :placeholder="$t('otInvoicePh')" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qe.open = false">{{ $t('otCancel') }}</el-button>
        <el-button type="primary" :loading="saving === 'quick'" @click="saveQuick">{{ $t('otSave') }}</el-button>
      </template>
    </el-dialog>

    <OtgruzkaEditDialog v-if="o" v-model="editOpen" :order="o" @saved="applyDetail" />
  </el-dialog>
</template>

<script setup>
import UiMoneyInput from '@/components/ui/UiMoneyInput.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Bell, CircleCheck, Close, Delete, Edit, EditPen, Plus, WarningFilled } from '@element-plus/icons-vue'
import UiHint from '@/components/ui/UiHint.vue'
import api from '@/api/otgruzka'
import { useUsersStore } from '@/stores/user'
import { formatDate, formatDateTime, telHref } from '@/utils/format'
import { changeValue, fmtMoney, fmtPct, fmtShort, otError, PAY_TONE, STAGE_TONE, STOCK_TONE } from '@/utils/otgruzkaFormat'
import OtgruzkaEditDialog from './OtgruzkaEditDialog.vue'
import OtItemsEditor from './OtItemsEditor.vue'
import OtDidoxFiles from './OtDidoxFiles.vue'
import { fmtQty } from '@/utils/skladFormat'

const props = defineProps({
  modelValue: { type: Number, default: null },
  // ERP asosiy yoki ikki tomonlama sinxron — kartani to'liq tahrirlash mumkin
  editable: Boolean,
  twoWay: Boolean,
  isAdmin: Boolean,
})
const emit = defineEmits(['update:modelValue', 'changed'])
const { t } = useI18n()
const usersStore = useUsersStore()

const o = ref(null)
const loading = ref(false)
const error = ref('')
const saving = ref('')
const editOpen = ref(false)
const stock = ref(null)
const stockLoading = ref(false)
const itemsEdit = reactive({ open: false, list: [] })
const next = reactive({ text: '', date: null })
const pay = reactive({ date: new Date().toISOString().slice(0, 10), amount: undefined, comment: '' })
const note = reactive({ kind: 'note', text: '' })
const payEdit = reactive({ open: false, id: null, date: '', amount: 0, comment: '' })
// ERP asosiy / ikki tomonlama rejim — yoki karta jadvalda yo'q (ERP'da ochilgan): tahrirlash mumkin
const canEdit = computed(() => !!o.value && (props.editable || o.value.source !== 'sheet' || o.value.sheet_removed))

// ─── Bosqichni tez tahrirlash ───────────────────────────────────────
const qe = reactive({ open: false, field: '', pct: 0, sgp_date: null, didox_contract: 'na', didox_poa: 'na', invoice: '' })
const flagOptions = computed(() => [
  { label: t('otYes'), value: 'yes' },
  { label: t('otNo'), value: 'no' },
  { label: t('otNa'), value: 'na' },
])
const toFlag = (v) => (v === true ? 'yes' : v === false ? 'no' : 'na')
const fromFlag = (v) => (v === 'yes' ? true : v === 'no' ? false : null)
// Bosiladigan bosqich kartasi: klaviaturadan ham ochiladi
function stepAttrs(field, allowed = true) {
  if (!canEdit.value || !allowed) return {}
  return { role: 'button', tabindex: 0, onClick: () => openQuick(field), onKeydown: (e) => e.key === 'Enter' && openQuick(field) }
}
function openQuick(field) {
  const d = o.value
  Object.assign(qe, {
    open: true,
    field,
    pct: Math.round(((field === 'shipped' ? d.shipped_pct : d.ready_pct) || 0) * 100),
    sgp_date: d.sgp_date || null,
    didox_contract: toFlag(d.didox_contract),
    didox_poa: toFlag(d.didox_poa),
    invoice: d.invoice_numbers || '',
  })
}
async function saveQuick() {
  const pct = Math.min(100, Math.max(0, Number(qe.pct) || 0)) / 100
  const body =
    qe.field === 'ready'
      ? { ready_pct: pct, sgp_date: qe.sgp_date || null }
      : qe.field === 'shipped'
        ? { shipped_pct: pct }
        : qe.field === 'didox'
          ? { didox_contract: fromFlag(qe.didox_contract), didox_poa: fromFlag(qe.didox_poa) }
          : { invoice_numbers: qe.invoice.trim() || null }
  if (await run('quick', () => api.update(o.value.id, body))) qe.open = false
}

// Tarix: "Izohlar" (izoh, qo'ng'iroq — xodim yozgan) va "O'zgarishlar" (tizim qayd etgan) alohida
const histTab = ref('comment')
const commentNotes = computed(() => (o.value?.notes || []).filter((n) => n.kind !== 'change'))
const changeNotes = computed(() => (o.value?.notes || []).filter((n) => n.kind === 'change'))
const shownNotes = computed(() => (histTab.value === 'change' ? changeNotes.value : commentNotes.value))
const histTabs = computed(() => [
  { label: `${t('otHistComments')} (${commentNotes.value.length})`, value: 'comment' },
  { label: `${t('otHistChanges')} (${changeNotes.value.length})`, value: 'change' },
])

const noteKinds = computed(() => [
  { label: t('otNoteKind_note'), value: 'note' },
  { label: t('otNoteKind_call'), value: 'call' },
])

watch(
  () => props.modelValue,
  (id) => {
    o.value = null
    stock.value = null
    error.value = ''
    editOpen.value = false
    if (id) load(id)
  },
  { immediate: true },
)

async function load(id) {
  loading.value = true
  try {
    applyDetail(await api.one(id), false)
  } catch (e) {
    error.value = otError(e)
  } finally {
    loading.value = false
  }
}
function applyDetail(d, notify = true) {
  const itemsChanged = JSON.stringify(o.value?.items || null) !== JSON.stringify(d.items || null)
  o.value = d
  if (itemsChanged || !stock.value) loadStock(d)
  next.text = d.next_action || ''
  next.date = d.next_action_date || null
  if (notify) emit('changed', d)
}
async function run(key, fn) {
  saving.value = key
  try {
    applyDetail(await fn())
    return true
  } catch (e) {
    ElMessage.error(otError(e))
    return false
  } finally {
    saving.value = ''
  }
}

// Ombordagi qoldiq — karta ochilgandan keyin alohida (ombor hisob-kitobi sekinroq)
async function loadStock(d) {
  if (!d.items?.length) {
    stock.value = null
    return
  }
  stockLoading.value = true
  try {
    const r = await api.stock(d.id)
    if (o.value?.id === d.id) stock.value = r
  } catch {
    stock.value = null
  } finally {
    stockLoading.value = false
  }
}
// Jami soni: barcha qatorlar yig'indisi; birligi bitta bo'lsa — o'sha (masalan "шт")
const itemsQty = computed(() => (o.value?.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0))
const itemsUnit = computed(() => {
  const units = [...new Set((o.value?.items || []).map((it) => String(it.unit || '').trim()).filter(Boolean))]
  return units.length === 1 ? units[0] : ''
})
const itemsTotal = computed(() => (o.value?.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0))
const stockTone = (sum) => (sum.positions && sum.ready_positions === sum.positions ? 'good' : sum.pct > 0 ? 'warn' : 'muted')
function openItems() {
  itemsEdit.list = (o.value.items || []).map((i) => ({ name: i.name, unit: i.unit || '', qty: i.qty, price: i.price }))
  if (!itemsEdit.list.length) itemsEdit.list.push({ name: '', unit: 'шт', qty: 1, price: 0 })
  itemsEdit.open = true
}
async function saveItems() {
  const items = itemsEdit.list
    .filter((i) => String(i.name || '').trim())
    .map((i) => ({ name: i.name.trim(), unit: String(i.unit || '').trim() || null, qty: Number(i.qty) || 0, price: Number(i.price) || 0 }))
  if (await run('items', () => api.update(o.value.id, { items }))) itemsEdit.open = false
}

const nextDirty = computed(() => o.value && ((next.text || '') !== (o.value.next_action || '') || (next.date || null) !== (o.value.next_action_date || null)))
const saveNext = () => run('next', () => api.update(o.value.id, { next_action: next.text.trim() || null, next_action_date: next.date || null }))

async function addPayment() {
  const ok = await run('pay', () => api.addPayment(o.value.id, { amount: pay.amount, pay_date: pay.date, comment: pay.comment || undefined }))
  if (ok) {
    pay.amount = undefined
    pay.comment = ''
  }
}
const removePayment = (p) => run('pay', () => api.removePayment(p.id))
function editPayment(p) {
  Object.assign(payEdit, { open: true, id: p.id, date: p.pay_date, amount: p.amount, comment: p.comment?.startsWith('sys:') ? '' : p.comment || '' })
}
async function savePayment() {
  const orig = o.value.payments.find((p) => p.id === payEdit.id)
  const body = { pay_date: payEdit.date, comment: payEdit.comment.trim() || (orig?.comment?.startsWith('sys:') ? orig.comment : null) }
  if (canEdit.value && payEdit.amount !== orig?.amount) body.amount = payEdit.amount
  if (await run('payEdit', () => api.updatePayment(payEdit.id, body))) payEdit.open = false
}

async function addNote() {
  if (await run('note', () => api.addNote(o.value.id, { kind: note.kind, text: note.text.trim() }))) {
    note.text = ''
    histTab.value = 'comment'
  }
}
const removeNote = (n) => run('note', () => api.removeNote(n.id))
const canDeleteNote = (n) =>
  n.kind !== 'change' &&
  n.source === 'erp' &&
  (props.isAdmin || (n.created_by === usersStore.currentUser?.id && Date.now() - new Date(n.createdAt).getTime() < 2 * 86400000))

// Rasmiy shartnomada belgi qo'yilmagan bo'lsa — "belgilanmagan" ("kerak emas" emas)
const flag = (v) => (v === true ? t('otYes') : v === false ? t('otNo') : t('otDidoxF_pending'))
const didoxTone = computed(() => {
  if (!o.value?.official) return 'muted'
  const { didox_contract: c, didox_poa: p } = o.value
  if (c === true && p === true) return 'good'
  if (c === false || p === false) return 'bad'
  return 'warn'
})
const phones = computed(() => (o.value?.client_phone || '').split(/,\s*/).filter((p) => /\d{5,}/.test(p.replace(/\D/g, ''))))
const payComment = (p) => (p.comment?.startsWith('sys:') ? t(`otPaySys_${p.comment.slice(4)}`) : p.comment || '')
// Jadvaldan kelgan yozuvlar — sinxronni kim bosganidan qat'i nazar, muallifi jadval
const author = (n) => {
  const c = n.creator
  if (!c || n.source === 'sheet') return t('otSystem')
  return [c.firstname, c.lastname].filter(Boolean).join(' ') || c.username
}
</script>

<style scoped lang="scss">
.ot-items__no {
  width: 28px;
  white-space: nowrap;
}
.ot-d {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  min-height: 100%;
  box-sizing: border-box;
  font-size: 14px;
  color: var(--ui-ink-2);
}
.ot-d__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  h3 {
    margin: 2px 0 8px;
    font-size: 20px;
    color: var(--ui-ink);
    line-height: 1.3;
  }
}
.ot-d__meta {
  font-size: 13px;
  color: var(--ui-muted);
}
.ot-d__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ot-d__alerts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--ui-radius);
  background: var(--ui-warn-soft);
  color: var(--ui-warn-ink);
  border: 1px solid var(--ui-warn-line);
  .el-icon {
    vertical-align: -2px;
  }
}
.ot-d__final {
  padding: 10px 12px;
  border-radius: var(--ui-radius);
  background: var(--ui-bad-soft);
  color: var(--ui-bad);
}
.ot-steps {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(4, minmax(0, 1fr));
  gap: 6px;
}
@media (max-width: 560px) {
  .ot-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.ot-step {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: var(--ui-radius);
  border-top: 3px solid var(--ui-line);
  background: var(--ui-surface-2);
  min-width: 0;
  b {
    font-size: 17px;
    color: var(--ui-ink);
  }
  &.is-good {
    border-top-color: var(--ui-good);
  }
  &.is-warn {
    border-top-color: var(--ui-warn);
  }
  &.is-bad {
    border-top-color: var(--ui-bad);
  }
  &.is-link {
    border-top-color: var(--ui-link);
  }
}
.ot-step__name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ui-muted);
}
.ot-step__pen {
  font-size: 12px;
  opacity: 0.45;
}
.ot-step.is-click {
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  &:hover,
  &:focus-visible {
    background: var(--ui-link-soft);
    box-shadow: inset 0 0 0 1px var(--ui-link-line);
    outline: none;
    .ot-step__pen {
      opacity: 1;
      color: var(--ui-link);
    }
  }
}
.ot-d__sklad {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--ui-radius);
  font-size: 13px;
  &.is-pending {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
    border: 1px solid var(--ui-warn-line);
  }
  &.is-done {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
}
.ot-qe__pct {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ot-qe__slider {
  flex: 1 1 auto;
}
.ot-qe__num {
  width: 80px;
}
.ot-qe__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  .el-button + .el-button {
    margin-left: 0;
  }
}
.ot-qe__form {
  margin-top: 14px;
}
.ot-step__val {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.ot-sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--ui-line-soft);
  h4 {
    margin: 0;
    font-size: 15px;
    color: var(--ui-ink);
  }
}
.ot-sec__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.ot-next {
  padding: 12px;
  border: 1px solid var(--ui-link-line);
  border-radius: var(--ui-radius);
  background: var(--ui-link-soft);
}
.ot-next__row {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}
.ot-info {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
  dt {
    color: var(--ui-muted);
  }
  dd {
    margin: 0;
    color: var(--ui-ink);
    overflow-wrap: anywhere;
  }
}
.ot-phone {
  display: block;
}
.ot-muted {
  font-size: 13px;
  color: var(--ui-muted);
}
.ot-pay {
  display: grid;
  grid-template-columns: 90px 130px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--ui-line-soft);
}
.ot-pay__amount {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ui-good);
  text-align: right;
  &.is-neg {
    color: var(--ui-bad);
  }
}
.ot-pay__comment {
  font-size: 13px;
  color: var(--ui-muted);
}
.ot-pay__btns {
  display: inline-flex;
  .el-button + .el-button {
    margin-left: 0;
  }
}
.ot-pay-add {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ot-pay-add__date {
  width: 150px !important;
}
.ot-pay-add__amount {
  width: 150px;
}
.ot-pay-add__comment {
  flex: 1 1 140px;
}
.ot-lines {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    padding: 6px 4px;
    border-bottom: 1px solid var(--ui-line-soft);
    text-align: right;
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
  th {
    font-weight: 600;
    color: var(--ui-muted);
  }
}
.ot-items {
  td {
    vertical-align: top;
  }
  td:first-child {
    color: var(--ui-ink);
  }
  .nowrap {
    white-space: nowrap;
  }
  tfoot td {
    border-bottom: 0;
  }
}
.ot-sec__btns {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ot-note-add {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  .el-textarea {
    width: 100%;
  }
}
.ot-hist-tabs {
  align-self: flex-start;
}
.ot-tl {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  li {
    padding: 8px 10px 8px 12px;
    border-left: 3px solid var(--ui-line);
    background: var(--ui-surface-2);
    border-radius: 0 var(--ui-radius) var(--ui-radius) 0;
    // Xodim yozgan izoh — ko'k, qo'ng'iroq — yashil fon
    &.is-note {
      border-left-color: var(--ui-link);
      background: var(--ui-link-soft);
    }
    &.is-call {
      border-left-color: var(--ui-good);
      background: var(--ui-good-soft);
    }
    // Tizim qayd etgan o'zgarish — kulrang, ixchamroq
    &.is-change {
      padding-top: 6px;
      padding-bottom: 6px;
      font-size: 13px;
      .ot-tl__text {
        color: var(--ui-ink-2);
      }
    }
  }
}
.ot-tl__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  font-size: 12px;
  color: var(--ui-muted);
}
.ot-tl__kind {
  font-weight: 700;
  color: var(--ui-ink-2);
}
.ot-tl__src {
  padding: 0 6px;
  border-radius: 99px;
  background: var(--ui-link-soft);
  color: var(--ui-link);
}
.ot-tl__del {
  margin-left: auto;
}
.ot-tl__text {
  margin-top: 4px;
  white-space: pre-wrap;
  color: var(--ui-ink);
}
</style>

<style lang="scss">
// Otgruzka kartasi dialogi: standart sarlavha yo'q, ichi o'zi aylanadi
.ot-drawer.el-dialog {
  padding: 0;
  overflow: hidden;
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0;
    max-height: 94vh;
    overflow-y: auto;
  }
}
@media (max-width: 640px) {
  .ot-drawer.el-dialog {
    --el-dialog-margin-top: 0;
    width: 100% !important;
    margin: 0;
    border-radius: 0;
    .el-dialog__body {
      max-height: 100vh;
    }
  }
}
</style>
