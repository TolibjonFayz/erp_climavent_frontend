<template>
  <UiPage
    :title="$t('dogovorPageTitle')"
    :subtitle="isAdmin ? $t('dogovorPageSubtitle') : $t('dogovorPageSubtitleOwn')"
  >
    <template v-if="!cardId" #actions>
      <el-upload
        class="dg-upload"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        accept=".xlsx,.xls"
      >
        <el-button :icon="Upload" :loading="uploadLoading">
          {{ $t('dogovorButtonUploadFile') }}
        </el-button>
      </el-upload>
      <el-button :icon="Download" :loading="exportLoading" @click="exportExcel">{{ $t('dogovorExportExcel') }}</el-button>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('dogovorButtonAdd') }}
      </el-button>
    </template>

    <!-- Bitta shartnoma sahifasi (/dogovor/:id): avval faqat ko'rish, tahrirlash — tugma bilan -->
    <div v-if="cardId" class="dg-card">
      <div class="dg-card__bar">
        <el-button :icon="ArrowLeft" @click="backToList">{{ $t('dogovorBackToList') }}</el-button>
        <span class="dg-card__btns">
          <el-button :icon="Printer" :disabled="!card" @click="printDogovor(card)">{{ $t('dogovorPrint') }}</el-button>
          <el-button v-if="card && canModify(card)" type="primary" :icon="Edit" @click="openEditDialog(card)">{{ $t('edit') }}</el-button>
        </span>
      </div>
      <UiPanel v-loading="cardLoading">
        <el-alert v-if="cardError" type="error" show-icon :closable="false" :title="cardError" />
        <template v-if="card">
          <div class="dg-card__head">
            <div class="dg-sub">
              № {{ card.dogovor_number ?? '—' }} · {{ formatDate(card.dogovor_date) }}
              <el-tag :type="statusTag(card.dogovor_status)" size="small" effect="light">{{ statusLabel(card.dogovor_status) }}</el-tag>
            </div>
            <h2 class="dg-card__title">{{ card.client_name || '—' }}</h2>
            <div class="dg-money dg-card__sum">{{ fmtMoney(card.dogovor_sum) }}</div>
          </div>
          <el-alert v-if="!canModify(card)" type="info" show-icon :closable="false" :title="$t('dogovorLockedHint')" />
          <dl class="dg-card__grid">
            <div v-for="f in cardFields" :key="f.label">
              <dt>{{ $t(f.label) }}</dt>
              <dd>{{ f.value }}</dd>
            </div>
          </dl>
          <h4 class="dg-card__sec">{{ $t('dogovorSectionItems') }}</h4>
          <div v-if="!cardItems.length" class="dg-muted">{{ $t('dogovorNoItems') }}</div>
          <table v-else class="dg-card__items">
            <thead>
              <tr>
                <th>№</th>
                <th>{{ $t('dogovorItemName') }}</th>
                <th class="is-r">{{ $t('dogovorItemQty') }}</th>
                <th class="is-r">{{ $t('dogovorItemPrice') }}</th>
                <th class="is-r">{{ $t('dogovorItemTotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in cardItems" :key="i">
                <td class="dg-muted">{{ i + 1 }}.</td>
                <td>{{ it.name }}</td>
                <td class="is-r nowrap">{{ fmtNum(it.qty) }} {{ it.unit || '' }}</td>
                <td class="is-r nowrap">{{ fmtMoney(it.price) }}</td>
                <td class="is-r nowrap">{{ fmtMoney((Number(it.qty) || 0) * (Number(it.price) || 0)) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="is-r dg-muted">{{ $t('dogovorItemsSubtotal') }}</td>
                <td class="is-r nowrap"><b>{{ fmtNum(cardQty) }}</b></td>
                <td></td>
                <td class="is-r nowrap">{{ fmtMoney(cardSubtotal) }}</td>
              </tr>
              <tr>
                <td colspan="4" class="is-r dg-muted">{{ $t('dogovorVat') }}</td>
                <td class="is-r nowrap">{{ fmtMoney(cardSubtotal * 0.12) }}</td>
              </tr>
              <tr>
                <td colspan="4" class="is-r dg-muted">{{ $t('dogovorItemsTotal') }}</td>
                <td class="is-r nowrap"><b>{{ fmtMoney(cardSubtotal * 1.12) }}</b></td>
              </tr>
            </tfoot>
          </table>
          <template v-if="card.comment || (isAdmin && card.admin_comment)">
            <h4 class="dg-card__sec">{{ $t('dogovorSectionNotes') }}</h4>
            <p v-if="card.comment" class="dg-card__note">{{ card.comment }}</p>
            <p v-if="isAdmin && card.admin_comment" class="dg-admin-note">{{ card.admin_comment }}</p>
          </template>
        </template>
      </UiPanel>
    </div>

    <template v-else>
    <!-- Ko'rsatkichlar: bosilsa shu holat bo'yicha filtrlanadi -->
    <div class="dg-stats">
      <UiStat
        :label="$t('dogovorStatTotal')"
        :value="fmtNum(totalDogovors)"
        :sub="formatMoneyShort(totalSum)"
        :trend="monthCounts"
        clickable
        @click="filters.status = ''"
      />
      <UiStat
        v-for="st in statusStats"
        :key="st.value"
        :label="$t(st.labelKey)"
        :value="fmtNum(st.count)"
        :sub="formatMoneyShort(st.sum)"
        :tone="st.tone"
        clickable
        @click="filters.status = st.value"
      />
    </div>

    <el-alert
      v-if="uploadError"
      type="warning"
      show-icon
      :title="uploadError"
      @close="uploadError = ''"
    />
    <el-alert
      v-if="dogovorStore.error"
      type="error"
      show-icon
      :closable="false"
      :title="dogovorStore.error"
    />

    <!-- Filtrlar -->
    <UiToolbar v-if="stats.total">
      <UiField :label="$t('dogovorClientFilterLabel')" grow>
        <el-input
          v-model="filters.client"
          :prefix-icon="Search"
          clearable
          :placeholder="$t('dogovorClientFilterPh')"
        />
      </UiField>
      <UiField :label="$t('dogovorTableStatus')">
        <el-select
          v-model="filters.status"
          clearable
          :placeholder="$t('dogovorAllStatuses')"
          class="dg-select"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="$t(opt.labelKey)"
            :value="opt.value"
          />
        </el-select>
      </UiField>
      <UiField :label="$t('dogovorTableManager')">
        <el-input
          v-model="filters.manager"
          clearable
          :placeholder="$t('dogovorFilterPlaceholder')"
          class="dg-select"
        />
      </UiField>
      <UiField :label="$t('dogovorTableComment')">
        <el-input
          v-model="filters.comment"
          clearable
          :placeholder="$t('dogovorFilterPlaceholder')"
          class="dg-select"
        />
      </UiField>

      <template v-if="moreFilters">
        <UiField
          v-for="f in extraFilters"
          :key="f.key"
          :label="$t(f.labelKey)"
          :hint="f.hint ? $t(f.hint) : ''"
        >
          <el-input
            v-model="filters[f.key]"
            clearable
            :placeholder="f.placeholder || $t('dogovorFilterPlaceholder')"
            class="dg-select-sm"
          />
        </UiField>
      </template>

      <template #actions>
        <el-button link type="primary" @click="moreFilters = !moreFilters">
          {{ moreFilters ? $t('kpLessFilters') : $t('kpMoreFilters') }}
          <span v-if="!moreFilters && hiddenFilterCount" class="dg-badge">{{
            hiddenFilterCount
          }}</span>
        </el-button>
      </template>
    </UiToolbar>

    <!-- Jadval -->
    <UiPanel v-if="stats.total || showSkeleton" flush>
      <template #title>
        {{ $t('dogovorListTitle') }}
        <span class="dg-count">{{ fmtNum(total) }}</span>
      </template>
      <template #actions>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('dogovorResetFilters') }}
        </el-button>
      </template>

      <el-skeleton v-if="showSkeleton" :rows="6" animated class="dg-skeleton" />
      <el-table
        v-else
        v-loading="loading && !!stats.total"
        :data="pageRows"
        class="dg-table"
        :empty-text="$t('dogovorNoMatchDescription')"
        @row-click="openInTab"
      >
        <!-- Jadval ekranga sig'sin: bog'liq ma'lumotlar bitta ustunda, ikkinchisi ostida -->
        <el-table-column type="index" :index="rowIndex" label="#" width="50" />
        <el-table-column :label="$t('dogovorTableNumberDate')" min-width="95">
          <template #default="{ row }">
            <div class="dg-strong">{{ row.dogovor_number ?? '—' }}</div>
            <div class="dg-sub">{{ formatDate(row.dogovor_date) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableStatus')" min-width="135">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.dogovor_status)" size="small" effect="light">
              {{ statusLabel(row.dogovor_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableClientManager')" min-width="230">
          <template #default="{ row }">
            <div class="dg-strong">{{ row.client_name || '—' }}</div>
            <div class="dg-sub">
              {{ row.manager_name || '—' }}<template v-if="row.client_inn"> · {{ $t('dogovorTableInn') }} {{ row.client_inn }}</template>
            </div>
            <a v-if="row.client_phone" :href="telHref(row.client_phone)" class="dg-link dg-sub" @click.stop>
              {{ row.client_phone }}
            </a>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTablePaymentShort')" min-width="115">
          <template #default="{ row }">
            <div :class="{ 'dg-muted': !row.payment_date }">{{ formatDate(row.payment_date) }}</div>
            <div v-if="row.prepayment_percent != null" class="dg-sub">
              {{ $t('dogovorTablePrepayment') }}: {{ row.prepayment_percent }}%
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableSum')" min-width="135" align="right">
          <template #default="{ row }">
            <span class="dg-money">{{ fmtMoney(row.dogovor_sum) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dogovorTableComment')" min-width="155">
          <template #default="{ row }">
            <div class="dg-clamp" :class="{ 'dg-muted': !row.comment }" :title="row.comment || ''">
              {{ row.comment || '—' }}
            </div>
            <div
              v-if="isAdmin && row.admin_comment"
              class="dg-admin-note dg-clamp"
              :title="$t('dogovorTableAdminComment') + ': ' + row.admin_comment"
            >
              {{ row.admin_comment }}
            </div>
          </template>
        </el-table-column>
        <el-table-column width="110" align="right" fixed="right">
          <template #default="{ row }">
            <div class="dg-actions" @click.stop>
              <el-tooltip :content="$t('dogovorPrint')" placement="top">
                <el-button
                  link
                  :icon="Printer"
                  :aria-label="$t('dogovorPrint')"
                  @click="printDogovor(row)"
                />
              </el-tooltip>
              <template v-if="canModify(row)">
                <el-tooltip :content="$t('edit')" placement="top">
                  <el-button
                    link
                    type="primary"
                    :icon="Edit"
                    :aria-label="$t('edit')"
                    @click="openEditDialog(row)"
                  />
                </el-tooltip>
                <el-popconfirm
                  :title="$t('dogovorDeleteConfirm')"
                  width="240"
                  placement="top"
                  :confirm-button-text="t('deleteConfirm')"
                  :cancel-button-text="t('cancel')"
                  @confirm="handleDelete(row.id)"
                >
                  <template #reference>
                    <el-button link type="danger" :icon="Delete" :aria-label="$t('delete')" />
                  </template>
                </el-popconfirm>
              </template>
              <el-tooltip v-else :content="$t('dogovorLockedHint')" placement="left">
                <el-icon class="dg-lock"><Lock /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > pageSize" class="dg-pager">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </UiPanel>

    <!-- Hali shartnoma yo'q -->
    <UiPanel v-else>
      <el-empty>
        <template #description>
          <h3 class="dg-empty-title">{{ $t('dogovorEmptyTitle') }}</h3>
          <p class="dg-muted">{{ $t('dogovorEmptyDescription') }}</p>
        </template>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ $t('dogovorButtonAdd') }}
        </el-button>
      </el-empty>
    </UiPanel>

    </template>

    <!-- Qo'shish / tahrirlash -->
    <el-dialog
      v-model="dialogVisible"
      :title="viewOnly ? $t('dogovorView') : editing ? $t('edit') : $t('dogovorDialogTitle')"
      width="880px"
      append-to-body
      class="dogovor-dialog"
      destroy-on-close
    >
      <!-- PDF'dan avtomatik to'ldirish (faqat yangi shartnoma) -->
      <div v-if="!editing" class="pdf-fill">
        <el-upload
          drag
          :show-file-list="false"
          accept=".pdf,application/pdf"
          :before-upload="handlePdfFill"
          :disabled="pdfLoading"
        >
          <div v-loading="pdfLoading" class="pdf-fill-zone">
            <el-icon class="pdf-fill-icon"><Document /></el-icon>
            <div class="pdf-fill-title">{{ $t('dogovorPdfDrop') }}</div>
            <div class="pdf-fill-hint">{{ $t('dogovorPdfHint') }}</div>
          </div>
        </el-upload>
        <el-alert
          v-if="pdfResult"
          :type="pdfResult.warnings.length ? 'warning' : 'success'"
          :closable="false"
          show-icon
          class="pdf-fill-result"
        >
          <template #title>
            {{ $t('dogovorPdfFilled', { count: pdfResult.count, file: pdfResult.file }) }}
          </template>
          <ul v-if="pdfResult.warnings.length" class="pdf-fill-warnings">
            <li v-for="w in pdfResult.warnings" :key="w">{{ w }}</li>
          </ul>
        </el-alert>
      </div>

      <el-alert v-if="viewOnly" type="info" show-icon :closable="false" :title="$t('dogovorLockedHint')" class="dg-view-note" />
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" :disabled="viewOnly">
        <el-divider content-position="left">{{ $t('dogovorSectionMain') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="8">
            <el-form-item
              :label="$t('dogovorNumberLabel')"
              prop="dogovor_number"
              :class="pdfMark('dogovor_number')"
            >
              <el-input-number
                v-model="form.dogovor_number"
                :min="1"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :label="$t('dogovorDateLabel')"
              prop="dogovor_date"
              :class="pdfMark('dogovor_date')"
            >
              <el-date-picker
                v-model="form.dogovor_date"
                type="date"
                format="DD.MM.YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorStatusLabel')" prop="dogovor_status">
              <el-select v-model="form.dogovor_status" style="width: 100%">
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="$t(opt.labelKey)"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorClientLabel')"
              prop="client_name"
              :class="pdfMark('client_name')"
            >
              <el-input v-model="form.client_name" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              :label="$t('dogovorInnLabel')"
              prop="client_inn"
              :class="pdfMark('client_inn')"
            >
              <el-input v-model="form.client_inn" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              :label="$t('dogovorPhoneLabel')"
              prop="client_phone"
              :class="pdfMark('client_phone')"
            >
              <el-input v-model="form.client_phone" maxlength="40" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="$t('dogovorManagerLabel')" prop="manager_name">
              <ManagerSelect v-model="form.manager_name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :label="$t('dogovorSumLabel')"
              prop="dogovor_sum"
              :class="pdfMark('dogovor_sum')"
            >
              <UiMoneyInput
                v-model="form.dogovor_sum"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('dogovorPaymentDateLabel')" prop="payment_date">
              <el-date-picker
                v-model="form.payment_date"
                type="date"
                format="DD.MM.YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item :label="$t('dogovorInitialPaymentLabel')" prop="initial_payment">
              <UiMoneyInput
                v-model="form.initial_payment"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :label="$t('dogovorPrepaymentLabel')"
              prop="prepayment_percent"
              :class="pdfMark('prepayment_percent')"
            >
              <el-input-number
                v-model="form.prepayment_percent"
                :min="0"
                :max="100"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :label="$t('dogovorProductionDaysLabel')"
              prop="production_days"
              :class="pdfMark('production_days')"
            >
              <el-input-number
                v-model="form.production_days"
                :min="0"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('dogovorSectionRequisites') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorContactNameLabel')"
              prop="contact_name"
              :class="pdfMark('contact_name')"
            >
              <el-input v-model="form.contact_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorContactPositionLabel')"
              prop="contact_position"
              :class="pdfMark('contact_position')"
            >
              <el-input v-model="form.contact_position" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item
              :label="$t('dogovorAddressLabel')"
              prop="client_address"
              :class="pdfMark('client_address')"
            >
              <el-input v-model="form.client_address" type="textarea" :rows="2" maxlength="400" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorBankLabel')"
              prop="client_bank"
              :class="pdfMark('client_bank')"
            >
              <el-input v-model="form.client_bank" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorAccountLabel')"
              prop="client_account"
              :class="pdfMark('client_account')"
            >
              <el-input v-model="form.client_account" maxlength="40" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorMfoLabel')"
              prop="client_mfo"
              :class="pdfMark('client_mfo')"
            >
              <el-input v-model="form.client_mfo" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('dogovorVatCodeLabel')"
              prop="client_vat_code"
              :class="pdfMark('client_vat_code')"
            >
              <el-input v-model="form.client_vat_code" maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('dogovorSectionItems') }}</el-divider>
        <table class="items-editor" :class="{ 'pdf-filled-table': pdfFilled.has('items') }">
          <thead>
            <tr>
              <th style="width: 36px">№</th>
              <th>{{ $t('dogovorItemName') }}</th>
              <th style="width: 80px">{{ $t('dogovorItemUnit') }}</th>
              <th style="width: 90px">{{ $t('dogovorItemQty') }}</th>
              <th style="width: 140px">{{ $t('dogovorItemPrice') }}</th>
              <th style="width: 140px">{{ $t('dogovorItemTotal') }}</th>
              <th style="width: 44px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in form.items" :key="i">
              <td class="items-index">{{ i + 1 }}</td>
              <td>
                <el-input v-model="item.name" size="small" :placeholder="$t('dogovorItemName')" />
              </td>
              <td><el-input v-model="item.unit" size="small" placeholder="шт" /></td>
              <td>
                <el-input-number
                  v-model="item.qty"
                  :min="0"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                />
              </td>
              <td>
                <UiMoneyInput
                  v-model="item.price"
                  :min="0"
                  size="small"
                  style="width: 100%"
                />
              </td>
              <td class="items-total">{{ formatMoney((item.qty || 0) * (item.price || 0)) }}</td>
              <td>
                <el-button text size="small" type="danger" :icon="Delete" @click="removeItem(i)" />
              </td>
            </tr>
            <tr v-if="!form.items.length">
              <td colspan="7" class="items-empty">{{ $t('dogovorNoItems') }}</td>
            </tr>
          </tbody>
        </table>
        <div class="items-actions">
          <el-button size="small" :icon="Plus" @click="addItem">{{
            $t('dogovorAddItem')
          }}</el-button>
          <span class="items-summary" v-if="form.items.length">
            {{ $t('dogovorItemsSubtotal') }}: <b>{{ formatMoney(itemsSubtotal) }}</b> ·
            {{ $t('dogovorVat') }}: <b>{{ formatMoney(itemsVat) }}</b> ·
            {{ $t('dogovorItemsTotal') }}: <b>{{ formatMoney(itemsTotal) }}</b>
          </span>
          <el-button
            v-if="form.items.length"
            size="small"
            type="primary"
            plain
            @click="applyItemsTotal"
          >
            {{ $t('dogovorApplyItemsTotal') }}
          </el-button>
        </div>

        <el-divider content-position="left">{{ $t('dogovorSectionNotes') }}</el-divider>
        <el-row :gutter="18">
          <el-col :span="24">
            <el-form-item :label="$t('dogovorCommentLabel')" prop="comment">
              <el-input
                v-model="form.comment"
                type="textarea"
                :rows="2"
                maxlength="500"
                show-word-limit
              />
              <UiQuickPhrases
                v-model="form.comment"
                :maxlength="500"
                :phrases="['qpDgAdvancePaid', 'qpDgAwaitPayment', 'qpDgDeliveryAgreed', 'qpDgSigned', 'qpDgDiscount']"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="isAdmin" :span="24">
            <el-form-item
              :label="$t('dogovorAdminCommentLabel')"
              prop="admin_comment"
              class="admin-comment-field"
            >
              <el-input
                v-model="form.admin_comment"
                type="textarea"
                :rows="2"
                maxlength="400"
                show-word-limit
              />
              <span class="admin-field-hint">{{ $t('dogovorAdminCommentHint') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button v-if="!viewOnly" type="primary" :loading="dogovorStore.isLoading" @click="handleSubmit">
          {{ $t('save') }}
        </el-button>
      </template>
    </el-dialog>
  </UiPage>
</template>

<script setup>
import UiMoneyInput from '@/components/ui/UiMoneyInput.vue'
import { errorText } from '@/utils/errorText'
import { useQueryPrefill } from '@/composables/useQueryPrefill'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dogovorApi from '@/api/dogovor'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useOpenFromQuery } from '@/composables/useOpenFromQuery'
import UiQuickPhrases from '@/components/ui/UiQuickPhrases.vue'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Document,
  Download,
  Edit,
  Lock,
  Plus,
  Printer,
  Search,
  Upload,
  ArrowLeft,
} from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtNum, formatDate, telHref } from '@/utils/format'
import { useDogovorStore } from '@/stores/dogovor'
import { useUsersStore } from '@/stores/user'
import { printDogovorDocument } from '@/utils/dogovorPdf'
import { readDogovorPdf } from '@/utils/dogovorPdfImport'
import ManagerSelect from '@/components/ui/ManagerSelect.vue'

const { t } = useI18n()
const dogovorStore = useDogovorStore()
const usersStore = useUsersStore()

const currentUserId = Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

// Kiritgan xodim 2 kun ichida tahrirlashi/o'chirishi mumkin (backend ham shuni tekshiradi)
const EDIT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000
const canModify = (row) => {
  if (isAdmin.value) return true
  if (row.created_by == null || Number(row.created_by) !== currentUserId) return false
  const createdAt = new Date(row.createdAt).getTime()
  if (Number.isNaN(createdAt)) return false
  return Date.now() - createdAt <= EDIT_WINDOW_MS
}

const statusOptions = [
  { value: 'Open', labelKey: 'dogovorStatusOpen' },
  { value: 'Shipped', labelKey: 'dogovorStatusShipped' },
  { value: 'PartlyShipped', labelKey: 'dogovorStatusPartlyShipped' },
  { value: 'Closed', labelKey: 'dogovorStatusClosed' },
]

const statusLabel = (status) => {
  const found = statusOptions.find((o) => o.value === status)
  return found ? t(found.labelKey) : status || '—'
}
// Holat rangi: ochiq — ko'k, qisman — sariq, yuklangan — yashil, yopilgan — kulrang
const STATUS_TAG = { Open: 'primary', PartlyShipped: 'warning', Shipped: 'success', Closed: 'info' }
const statusTag = (status) => STATUS_TAG[status] || 'info'

// ─── Filtrlar ───
const filters = reactive({
  number: '',
  status: '',
  client: '',
  manager: '',
  date: '',
  paymentDate: '',
  sum: '',
  prepayment: '',
  inn: '',
  phone: '',
  comment: '',
  adminComment: '',
})

const currentPage = ref(1)
const pageSize = ref(20)
const moreFilters = ref(false)
// Umumiy qidiruvdan raqam bilan kelinganda (?n=...) filtrni ochib to'ldiramiz
useQueryPrefill('n', (v) => {
  filters.number = v
  moreFilters.value = true
})
// Raqamlar har yili qaytadan boshlanadi — sana bilan aniq shartnoma topiladi (?d=dd.mm.yyyy)
useQueryPrefill('d', (v) => {
  filters.date = v
  moreFilters.value = true
})

// "Ko'proq filtr" ortidagi maydonlar
const extraFilters = [
  { key: 'number', labelKey: 'dogovorTableNumber' },
  {
    key: 'date',
    labelKey: 'dogovorTableDate',
    placeholder: 'dd.mm.yyyy',
    hint: 'kpDateFilterHint',
  },
  {
    key: 'paymentDate',
    labelKey: 'dogovorTablePaymentDate',
    placeholder: 'dd.mm.yyyy',
    hint: 'kpDateFilterHint',
  },
  { key: 'sum', labelKey: 'dogovorTableSum' },
  { key: 'prepayment', labelKey: 'dogovorTablePrepayment' },
  { key: 'inn', labelKey: 'dogovorTableInn' },
  { key: 'phone', labelKey: 'dogovorTablePhone' },
]
if (isAdmin.value) extraFilters.push({ key: 'adminComment', labelKey: 'dogovorTableAdminComment' })

const filled = (v) => Boolean(String(v ?? '').trim())
const hiddenFilterCount = computed(
  () =>
    extraFilters.filter((f) => filled(filters[f.key])).length +
    (filled(filters.adminComment) && !isAdmin.value ? 1 : 0),
)
const hasFilters = computed(() => Object.values(filters).some(filled))
const rowIndex = (i) => (currentPage.value - 1) * pageSize.value + i + 1

// ─── Ro'yxat: filtr va bo'laklash serverda (8 mingdan ortiq shartnoma — hammasini yuklamaymiz) ───
const pageRows = ref([])
const total = ref(0)
const stats = ref({ total: 0, sum: 0, byStatus: {} })
const loading = ref(false)
const loaded = ref(false)

// Bo'sh maydonlar yuborilmaydi
const filterParams = () =>
  Object.fromEntries(
    Object.entries(filters)
      .map(([k, v]) => [k, String(v ?? '').trim()])
      .filter(([, v]) => v),
  )

let requestSeq = 0
async function load() {
  const seq = ++requestSeq
  loading.value = true
  try {
    const res = await dogovorApi.getPage({
      ...filterParams(),
      page: currentPage.value,
      limit: pageSize.value,
    })
    if (seq !== requestSeq) return // eskiroq so'rov kech qaytdi — yangisini bosib ketmasin
    pageRows.value = res.rows || []
    total.value = res.total || 0
    stats.value = res.stats || { total: 0, sum: 0, byStatus: {} }
    loaded.value = true
  } catch (error) {
    if (seq === requestSeq) ElMessage.error(errorText(error, t('dogovorMessageLoadError')))
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

// Matn yozilayotganda har harfda emas — biroz to'xtagach so'raymiz; holat tanlansa darhol
let filterTimer = 0
watch(
  () => ({ ...filters }),
  (now, before) => {
    clearTimeout(filterTimer)
    const onlyStatus = Object.keys(now).every((k) => k === 'status' || now[k] === before[k])
    const run = () => {
      if (currentPage.value !== 1) currentPage.value = 1 // sahifa watch'i o'zi yuklaydi
      else load()
    }
    if (onlyStatus) run()
    else filterTimer = setTimeout(run, 300)
  },
)
watch([currentPage, pageSize], () => load())

const resetFilters = () => {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
}

// ─── Statistika (server hisoblaydi — butun ro'yxat bo'yicha, filtrga bog'liq emas) ───
const totalDogovors = computed(() => stats.value.total)
const totalSum = computed(() => stats.value.sum)
// Shu oy boshidan bugungacha tuzilgan shartnomalar — o'tgan oyning shu davriga nisbatan
const monthCounts = computed(() =>
  stats.value.month
    ? { current: stats.value.month.current.count, previous: stats.value.month.previous.count }
    : null,
)
// Har holat: soni va summasi (ko'rsatkich kartalari uchun)
const STATUS_TONE = { Open: '', PartlyShipped: 'warn', Shipped: 'good', Closed: '' }
const statusStats = computed(() =>
  statusOptions.map((o) => ({
    ...o,
    tone: STATUS_TONE[o.value],
    count: stats.value.byStatus[o.value]?.count || 0,
    sum: stats.value.byStatus[o.value]?.sum || 0,
  })),
)
const showSkeleton = computed(() => loading.value && !loaded.value)

// ─── Formatlash ───
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(value)
}
// Jadval uchun: "13 090 872 so'm"
const fmtMoney = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return `${fmtNum(Math.round(Number(value)))} ${t('amoCurrency')}`
}

// 1 225 936 013 096 -> "1.23 trln"
const formatMoneyShort = (value) => {
  const n = Number(value) || 0
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' trln'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' mlrd'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' mln'
  return formatMoney(n)
}

// ─── Excel yuklash / eksport ───
const uploadLoading = ref(false)
const uploadError = ref('')

const handleBeforeUpload = async (file) => {
  uploadError.value = ''
  uploadLoading.value = true
  try {
    const result = await dogovorStore.importDogovors(file)
    await load()
    ElMessage.success(
      t('dogovorImportSummary', {
        created: result?.imported ?? 0,
        updated: result?.updated ?? 0,
        skipped: result?.skipped ?? 0,
      }),
    )
    if (result?.errors?.length) {
      uploadError.value = `${t('dogovorImportPartialErrors')}: ${result.errors.slice(0, 5).join('; ')}`
    }
  } catch (error) {
    uploadError.value = errorText(error, t('dogovorUploadError'))
  } finally {
    uploadLoading.value = false
  }
  return false // Element Plus o'zi yubormasin — biz o'zimiz yubordik
}

const exportLoading = ref(false)
const exportExcel = async () => {
  let list = []
  exportLoading.value = true
  try {
    list = await dogovorApi.exportList(filterParams())
  } catch (error) {
    ElMessage.error(errorText(error, t('dogovorMessageLoadError')))
    return
  } finally {
    exportLoading.value = false
  }
  if (!list.length) {
    ElMessage.warning(t('dogovorNoDataToExport'))
    return
  }
  const rows = list.map((row, index) => ({
    '№': index + 1,
    [t('dogovorTableNumber')]: row.dogovor_number ?? '—',
    [t('dogovorTableDate')]: formatDate(row.dogovor_date),
    [t('dogovorTableClient')]: row.client_name || '—',
    [t('dogovorTableSum')]: row.dogovor_sum ?? 0,
    [t('dogovorTableStatus')]: statusLabel(row.dogovor_status),
    [t('dogovorTableInn')]: row.client_inn || '—',
    [t('dogovorTablePaymentDate')]: formatDate(row.payment_date),
    [t('dogovorInitialPaymentLabel')]: row.initial_payment ?? 0,
    [t('dogovorTablePrepayment')]: row.prepayment_percent ?? 0,
    [t('dogovorTablePhone')]: row.client_phone || '—',
    [t('dogovorTableManager')]: row.manager_name || '—',
    [t('dogovorAddressLabel')]: row.client_address || '—',
    [t('dogovorContactPositionLabel')]: row.contact_position || '—',
    [t('dogovorContactNameLabel')]: row.contact_name || '—',
    [t('dogovorTableComment')]: row.comment || '—',
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Dogovor')
  const stamp = new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')
  XLSX.writeFile(wb, `Dogovorlar_${stamp}.xlsx`)
  ElMessage.success(t('dogovorExportDone'))
}

// ─── Shartnoma hujjatini chop etish / PDF ───
const printDogovor = async (row) => {
  try {
    await printDogovorDocument(row)
  } catch {
    ElMessage.error(t('dogovorPrintError'))
  }
}

// ─── Forma ───
const dialogVisible = ref(false)
const viewOnly = ref(false) // boshqa xodimning / muddati o'tgan shartnomasi — faqat ko'rish
const editing = ref(null)
const formRef = ref(null)

const initialForm = () => ({
  dogovor_number: null,
  dogovor_date: new Date().toISOString().slice(0, 10),
  client_name: '',
  dogovor_sum: null,
  dogovor_status: 'Open',
  client_inn: '',
  payment_date: '',
  initial_payment: null,
  prepayment_percent: null,
  client_phone: '',
  manager_name: '',
  client_address: '',
  contact_name: '',
  contact_position: '',
  client_bank: '',
  client_account: '',
  client_mfo: '',
  client_vat_code: '',
  items: [],
  production_days: null,
  comment: '',
  admin_comment: '',
})

const form = reactive(initialForm())

const formRules = {
  dogovor_date: [{ required: true, message: t('dogovorValidationDate'), trigger: 'change' }],
  client_name: [{ required: true, message: t('dogovorValidationClient'), trigger: 'blur' }],
  dogovor_sum: [{ required: true, message: t('dogovorValidationSum'), trigger: 'change' }],
}

const itemsSubtotal = computed(() =>
  form.items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0),
)
const itemsVat = computed(() => itemsSubtotal.value * 0.12)
const itemsTotal = computed(() => itemsSubtotal.value + itemsVat.value)

const addItem = () => form.items.push({ name: '', unit: 'шт', qty: 1, price: 0 })
const removeItem = (index) => form.items.splice(index, 1)
const applyItemsTotal = () => {
  form.dogovor_sum = Math.round(itemsTotal.value * 100) / 100
  ElMessage.success(t('dogovorItemsTotalApplied'))
}

// ─── PDF'dan to'ldirish ───
// PDF'dan kelgan maydonlar sariq belgilanadi — foydalanuvchi tekshirib saqlaydi
const pdfLoading = ref(false)
const pdfResult = ref(null)
const pdfFilled = ref(new Set())
const pdfMark = (key) => ({ 'pdf-filled': pdfFilled.value.has(key) })
const PDF_FIELDS = [
  'dogovor_number',
  'dogovor_date',
  'client_name',
  'client_inn',
  'client_phone',
  'client_address',
  'dogovor_sum',
  'prepayment_percent',
  'production_days',
  'contact_name',
  'contact_position',
  'client_bank',
  'client_account',
  'client_mfo',
  'client_vat_code',
  'items',
]

const resetPdfState = () => {
  pdfResult.value = null
  pdfFilled.value = new Set()
}

const handlePdfFill = async (file) => {
  pdfLoading.value = true
  try {
    const data = await readDogovorPdf(file)
    const keys = Object.keys(data).filter((key) => key in form)
    if (!keys.length) {
      ElMessage.warning(t('dogovorPdfNothingFound'))
      return false
    }
    // Oldingi PDF'dan qolgan qiymatlar aralashib ketmasin — PDF beradigan maydonlarni tozalaymiz
    const blank = initialForm()
    PDF_FIELDS.forEach((key) => {
      form[key] = blank[key]
    })
    keys.forEach((key) => {
      form[key] = key === 'items' ? data.items.map((i) => ({ ...i })) : data[key]
    })
    pdfFilled.value = new Set(keys)

    const warnings = []
    const missing = ['dogovor_number', 'client_name', 'dogovor_sum'].filter(
      (k) => !keys.includes(k),
    )
    if (missing.length) warnings.push(t('dogovorPdfMissingMain'))
    // Shu raqam va sanali shartnoma bazada bormi — serverdan tekshiramiz (ro'yxat to'liq yuklanmaydi)
    const same = form.dogovor_number
      ? await dogovorApi
          .getPage({ number: String(form.dogovor_number), date: formatDate(form.dogovor_date), limit: 50 })
          .catch(() => null)
      : null
    const duplicate = (same?.rows || []).some(
      (d) =>
        Number(d.dogovor_number) === Number(form.dogovor_number) &&
        String(d.dogovor_date).slice(0, 10) === form.dogovor_date,
    )
    if (duplicate) warnings.push(t('dogovorPdfDuplicate'))
    if (
      form.items.length &&
      form.dogovor_sum &&
      Math.abs(itemsTotal.value - form.dogovor_sum) > 1
    ) {
      warnings.push(t('dogovorPdfSumMismatch', { items: formatMoney(itemsTotal.value) }))
    }
    pdfResult.value = { count: keys.length, file: file.name, warnings }
    formRef.value?.clearValidate()
  } catch (error) {
    ElMessage.error(t(error?.message === 'NO_TEXT' ? 'dogovorPdfNoText' : 'dogovorPdfReadError'))
  } finally {
    pdfLoading.value = false
  }
  return false
}

const openCreateDialog = () => {
  viewOnly.value = false
  editing.value = null
  resetPdfState()
  Object.assign(form, initialForm())
  dialogVisible.value = true
}

const openEditDialog = (row, readOnly = false) => {
  viewOnly.value = readOnly
  editing.value = row
  resetPdfState()
  Object.assign(form, {
    ...initialForm(),
    ...row,
    // JSONB null bo'lishi mumkin — tahrirlagichga doim massiv kerak
    items: Array.isArray(row.items) ? row.items.map((i) => ({ ...i })) : [],
    payment_date: row.payment_date ? String(row.payment_date).slice(0, 10) : '',
    dogovor_date: row.dogovor_date ? String(row.dogovor_date).slice(0, 10) : '',
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const text = (value) => (value && String(value).trim() ? String(value).trim() : undefined)
  const payload = {
    dogovor_number: form.dogovor_number || undefined,
    dogovor_date: form.dogovor_date,
    client_name: form.client_name.trim(),
    dogovor_sum: Number(form.dogovor_sum) || 0,
    dogovor_status: form.dogovor_status,
    client_inn: text(form.client_inn),
    payment_date: text(form.payment_date),
    initial_payment: form.initial_payment ?? undefined,
    prepayment_percent: form.prepayment_percent ?? undefined,
    client_phone: text(form.client_phone),
    manager_name: text(form.manager_name),
    client_address: text(form.client_address),
    contact_name: text(form.contact_name),
    contact_position: text(form.contact_position),
    client_bank: text(form.client_bank),
    client_account: text(form.client_account),
    client_mfo: text(form.client_mfo),
    client_vat_code: text(form.client_vat_code),
    items: form.items
      .filter((i) => i.name && String(i.name).trim())
      .map((i) => ({
        name: String(i.name).trim(),
        unit: i.unit ? String(i.unit).trim() : undefined,
        qty: Number(i.qty) || 0,
        price: Number(i.price) || 0,
      })),
    production_days: form.production_days ?? undefined,
    comment: text(form.comment),
  }
  if (isAdmin.value) payload.admin_comment = text(form.admin_comment)

  try {
    if (editing.value) {
      await dogovorStore.updateDogovor(editing.value.id, payload)
      ElMessage.success(t('dogovorMessageUpdated'))
    } else {
      await dogovorStore.createDogovor(payload)
      ElMessage.success(t('dogovorMessageSaved'))
    }
    dialogVisible.value = false
    await load()
    if (cardId.value) await loadCard(cardId.value)
  } catch (error) {
    ElMessage.error(errorText(error, t('dogovorMessageSaveError')))
  }
}

const handleDelete = async (id) => {
  try {
    await dogovorStore.deleteDogovor(id)
    ElMessage.success(t('dogovorMessageDeleted'))
    await load()
  } catch (error) {
    ElMessage.error(errorText(error, t('dogovorMessageDeleteError')))
  }
}

onMounted(async () => {
  try {
    if (!usersStore.currentUser) await usersStore.getUserInfo(currentUserId)
  } catch {
    // foydalanuvchi ma'lumoti keyin ham keladi — ro'yxat yuklanishiga to'sqinlik qilmasin
  }
  await load()
})

// "+ Yangi" menyusidan kelganda (?new=1) qo'shish oynasi ochiladi
useOpenFromQuery(openCreateDialog)

// Ro'yxatdagi shartnoma bosilganda shu oynada alohida sahifa (/dogovor/:id) ochiladi:
// avval faqat ko'rish, tahrirlash oynasi — "Tahrirlash" tugmasi bilan
const route = useRoute()
const router = useRouter()
const cardId = computed(() => Number(route.params.id) || null)
const card = ref(null)
const cardLoading = ref(false)
const cardError = ref('')

function openInTab(row) {
  if (row?.id) router.push({ path: `/dogovor/${row.id}` })
}
// Orqaga: ro'yxatdan kelingan bo'lsa — tarixda orqaga (filtr va sahifa saqlanadi), aks holda ro'yxatga
function backToList() {
  if (String(window.history.state?.back || '').startsWith('/dogovor')) router.back()
  else router.push({ path: '/dogovor' })
}
async function loadCard(id) {
  cardLoading.value = true
  cardError.value = ''
  try {
    if (!usersStore.currentUser) await usersStore.getUserInfo(currentUserId).catch(() => {})
    const row = await dogovorApi.getOne(id)
    if (cardId.value === id) card.value = row
  } catch (error) {
    cardError.value = errorText(error, t('dogovorMessageLoadError'))
  } finally {
    cardLoading.value = false
  }
}
watch(
  cardId,
  (id) => {
    card.value = null
    if (id) loadCard(id)
  },
  { immediate: true },
)
// Eski havolalar (?open=<id>) — yangi manzilga
if (Number(route.query.open)) router.replace({ path: `/dogovor/${Number(route.query.open)}` })

const cardItems = computed(() => (Array.isArray(card.value?.items) ? card.value.items.filter((i) => i?.name) : []))
const cardQty = computed(() => cardItems.value.reduce((s, i) => s + (Number(i.qty) || 0), 0))
const cardSubtotal = computed(() => cardItems.value.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0))
const cardFields = computed(() => {
  const c = card.value || {}
  const list = [
    ['dogovorManagerLabel', c.manager_name],
    ['dogovorInnLabel', c.client_inn],
    ['dogovorPhoneLabel', c.client_phone],
    ['dogovorContactNameLabel', c.contact_name],
    ['dogovorContactPositionLabel', c.contact_position],
    ['dogovorAddressLabel', c.client_address],
    ['dogovorPaymentDateLabel', c.payment_date ? formatDate(c.payment_date) : null],
    ['dogovorInitialPaymentLabel', c.initial_payment != null ? fmtMoney(c.initial_payment) : null],
    ['dogovorPrepaymentLabel', c.prepayment_percent != null ? `${c.prepayment_percent}%` : null],
    ['dogovorProductionDaysLabel', c.production_days],
    ['dogovorBankLabel', c.client_bank],
    ['dogovorAccountLabel', c.client_account],
    ['dogovorMfoLabel', c.client_mfo],
    ['dogovorVatCodeLabel', c.client_vat_code],
  ]
  return list.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([label, value]) => ({ label, value: String(value) }))
})
</script>

<style lang="scss" scoped>
.dg-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.dg-select {
  width: 190px;
}
.dg-select-sm {
  width: 150px;
}
.dg-badge {
  margin-left: 4px;
  min-width: 18px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: var(--ui-on-accent);
  background: var(--ui-link);
  border-radius: 999px;
}
.dg-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.dg-skeleton {
  padding: 16px;
}
.dg-strong {
  font-weight: 600;
  color: var(--ui-ink);
}
.dg-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.dg-money {
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dg-link {
  color: var(--ui-link);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
  &:hover {
    text-decoration: underline;
  }
}
.dg-muted {
  color: var(--ui-faint);
}
.dg-admin-note {
  color: var(--ui-warn);
}
.dg-card__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.dg-card__btns {
  display: inline-flex;
  gap: 8px;
}
.dg-card__head {
  margin-bottom: 12px;
}
.dg-card__title {
  margin: 4px 0;
  font-size: 22px;
  color: var(--ui-ink);
}
.dg-card__sum {
  font-size: 18px;
  font-weight: 700;
}
.dg-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 20px;
  margin: 16px 0;
  dt {
    font-size: 12px;
    color: var(--ui-muted);
  }
  dd {
    margin: 2px 0 0;
    color: var(--ui-ink);
    word-break: break-word;
  }
}
.dg-card__sec {
  margin: 18px 0 8px;
  font-size: 15px;
  color: var(--ui-ink);
}
.dg-card__items {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    padding: 6px;
    border-bottom: 1px solid var(--ui-line-soft);
    text-align: left;
  }
  th {
    color: var(--ui-muted);
    font-weight: 600;
  }
  .is-r {
    text-align: right;
  }
  .nowrap {
    white-space: nowrap;
  }
}
.dg-card__note {
  white-space: pre-wrap;
  margin: 0 0 8px;
}
.dg-view-note {
  margin-bottom: 12px;
}
.dg-table :deep(.el-table__row) {
  cursor: pointer;
}
.dg-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dg-lock {
  color: var(--ui-faint);
}
.dg-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-line-soft);
}
.dg-empty-title {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--ui-ink);
}
.dg-table :deep(.el-table__cell) {
  padding: 10px 0;
}

@media (max-width: 1280px) {
  .dg-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .dg-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dg-select,
  .dg-select-sm {
    width: 100%;
  }
}

/* ─── Qo'shish / tahrirlash dialogi (mahsulotlar jadvali) ─── */
.items-editor {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;

  th {
    background: var(--ui-surface-2);
    font-size: 12px;
    font-weight: 600;
    color: var(--ui-muted);
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid var(--ui-line);
  }

  td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--ui-surface-3);
    font-size: 13px;
  }

  .items-index {
    text-align: center;
    color: var(--ui-faint);
  }

  .items-total {
    text-align: right;
    font-weight: 600;
    color: var(--ui-ink);
  }

  .items-empty {
    text-align: center;
    color: var(--ui-faint);
    padding: 14px;
  }
}

.items-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.items-summary {
  font-size: 13px;
  color: var(--ui-ink-2);
}

.admin-comment-field :deep(.el-textarea__inner) {
  border-color: #f59e0b;
  background: var(--ui-warn-soft);
}

.admin-field-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-warn);
}

:deep(.dogovor-dialog .el-dialog) {
  border-radius: 16px;
}

/* ─── PDF'dan to'ldirish ─── */
.pdf-fill {
  margin-bottom: 8px;

  :deep(.el-upload-dragger) {
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--ui-surface-2);
  }
}

.pdf-fill-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.pdf-fill-icon {
  font-size: 26px;
  color: var(--ui-link);
  margin-bottom: 2px;
}

.pdf-fill-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}

.pdf-fill-hint {
  font-size: 12px;
  color: var(--ui-muted);
}

.pdf-fill-result {
  margin-top: 10px;
}

.pdf-fill-warnings {
  margin: 4px 0 0;
  padding-left: 18px;
}

/* PDF'dan kelgan qiymat — tekshirish kerakligini ko'rsatadi.
   main.css inputlarga !important beradi, shuning uchun bu yerda ham kerak (fokusdan tashqari) */
.pdf-filled {
  :deep(.el-input__wrapper:not(.is-focus)),
  :deep(.el-textarea__inner:not(:focus)),
  :deep(.el-select__wrapper:not(.is-focused)) {
    background-color: var(--ui-warn-soft) !important;
    box-shadow: 0 0 0 1px var(--ui-warn-line) inset !important;
  }
}

.pdf-filled-table td {
  background: var(--ui-warn-soft);
}
.dg-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
