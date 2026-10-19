<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import { usePartnersStore } from '@/stores/partners'
import { partnerTypeLabel } from '@/utils/partners'
import { formatDate, telHref } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MSheet from '../../components/MSheet.vue'
import MEmpty from '../../components/MEmpty.vue'
import { avatarColor, errorText, initials } from '../../utils'
import { formatPlace } from './place'

const { t, locale } = useI18n()
const route = useRoute()
const partnersStore = usePartnersStore()

const loading = ref(true)
const failed = ref(false)
const p = computed(() => partnersStore.partnerbyid)

async function load() {
  failed.value = false
  try {
    await partnersStore.getOnePartner(route.params.id)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  // Boshqa mijozning eski ma'lumoti bir lahza ko'rinmasin
  if (String(partnersStore.partnerbyid?.id) !== String(route.params.id)) {
    partnersStore.partnerbyid = null
  }
  load()
})

// Mijozni faqat qo'shilganidan keyin 1 kun ichida tahrirlash mumkin (saytdagi qoida)
const DAY_MS = 24 * 60 * 60 * 1000
const age = computed(() => (p.value?.createdAt ? Date.now() - new Date(p.value.createdAt) : 0))
const canEdit = computed(() => !!p.value?.createdAt && age.value < DAY_MS)
const hoursLeft = computed(() => Math.max(1, Math.ceil((DAY_MS - age.value) / 3600000)))

const isLegal = computed(() => /yuridik|юридическ/i.test(p.value?.mijozturi || ''))

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast(t('m.copied'))
  } catch {
    showToast(text)
  }
}

// ─── Tahrirlash ───
const editOpen = ref(false)
const saving = ref(false)
const form = reactive({
  fullname: '',
  mijozturi: '',
  inn: '',
  phone_number: '',
  additional_phone_number: '',
  republic: '',
  viloyat: '',
  shahar_tuman: '',
})

function openEdit() {
  for (const k of Object.keys(form)) form[k] = p.value?.[k] || ''
  editOpen.value = true
}

async function saveEdit() {
  if (!canEdit.value) {
    showFailToast(t('vaqt_tugagan'))
    return
  }
  saving.value = true
  try {
    await partnersStore.updateOnePartner({ ...form }, route.params.id)
    showSuccessToast(t('hamkor_yangilandi'))
    editOpen.value = false
    await load()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

// ─── Qo'shimcha ma'lumot (har doim tahrirlanadi) ───
const noteOpen = ref(false)
const note = ref('')
function openNote() {
  note.value = p.value?.more_info || ''
  noteOpen.value = true
}
async function saveNote() {
  saving.value = true
  try {
    await partnersStore.updateOnePartner({ more_info: note.value }, route.params.id)
    showSuccessToast(t('yangilash_success'))
    noteOpen.value = false
    await load()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <MPage
    :title="p?.fullname || $t('m.customer')"
    :back="{ name: 'customers' }"
    :on-refresh="load"
  >
    <template #right>
      <button v-if="canEdit" type="button" class="m-head__btn" @click="openEdit">
        <van-icon name="edit" />
      </button>
    </template>

    <div v-if="loading && !p" class="m-card"><van-skeleton avatar :row="4" /></div>

    <MEmpty v-else-if="failed && !p" icon="warning-o" :title="$t('m.loadFailed')">
      <van-button round type="primary" @click="load">{{ $t('m.retry') }}</van-button>
    </MEmpty>

    <template v-else-if="p">
      <section class="cd-hero">
        <div class="m-avatar cd-hero__avatar" :style="{ background: avatarColor(p.fullname) }">
          {{ initials(p.fullname) }}
        </div>
        <h2 class="cd-hero__name">{{ p.fullname }}</h2>
        <div class="cd-hero__tags">
          <span class="m-tag" :class="isLegal ? 'is-good' : 'is-warn'">{{ p.mijozturi || '—' }}</span>
          <span class="m-tag">{{ partnerTypeLabel(p.partner_type) }}</span>
        </div>

        <div class="cd-actions">
          <a
            class="cd-action is-call"
            :class="{ 'is-disabled': !telHref(p.phone_number) }"
            :href="telHref(p.phone_number)"
          >
            <van-icon name="phone" />
            <span>{{ $t('m.call') }}</span>
          </a>
          <a
            v-if="telHref(p.additional_phone_number)"
            class="cd-action"
            :href="telHref(p.additional_phone_number)"
          >
            <van-icon name="phone-o" />
            <span>{{ $t('m.secondPhone') }}</span>
          </a>
          <button
            type="button"
            class="cd-action"
            :disabled="!p.phone_number"
            @click="copy(p.phone_number)"
          >
            <van-icon name="description-o" />
            <span>{{ $t('m.copy') }}</span>
          </button>
          <button type="button" class="cd-action" @click="openNote">
            <van-icon name="notes-o" />
            <span>{{ $t('m.note') }}</span>
          </button>
        </div>
      </section>

      <div v-if="canEdit" class="cd-notice is-info">
        <van-icon name="clock-o" />
        {{ $t('m.editWindow', { h: hoursLeft }) }}
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('m.contacts') }}</span></div>
      <van-cell-group inset>
        <van-cell
          :title="$t('telefon')"
          :value="p.phone_number || '—'"
          :url="telHref(p.phone_number)"
          :is-link="!!telHref(p.phone_number)"
          value-class="m-num cd-value"
        />
        <van-cell
          :title="$t('form_qoshimchaTelefon')"
          :value="p.additional_phone_number || '—'"
          :url="telHref(p.additional_phone_number)"
          :is-link="!!telHref(p.additional_phone_number)"
          value-class="m-num cd-value"
        />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('m.mainInfo') }}</span></div>
      <van-cell-group inset>
        <van-cell :title="$t('mijozTuri')" :value="p.mijozturi || '—'" value-class="cd-value" />
        <van-cell
          v-if="p.inn"
          :title="$t('inn')"
          :value="p.inn"
          value-class="m-num cd-value"
          clickable
          @click="copy(p.inn)"
        />
        <van-cell
          :title="$t('guruh')"
          :value="partnerTypeLabel(p.partner_type)"
          value-class="cd-value"
        />
        <van-cell
          :title="$t('custCreated')"
          :value="formatDate(p.createdAt)"
          value-class="m-num cd-value"
        />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('m.address') }}</span></div>
      <van-cell-group inset>
        <van-cell :title="$t('respublika')" :value="formatPlace(p.republic) || '—'" value-class="cd-value" />
        <van-cell :title="$t('viloyat')" :value="formatPlace(p.viloyat) || '—'" value-class="cd-value" />
        <van-cell
          :title="$t('shaharTuman')"
          :value="formatPlace(p.shahar_tuman) || '—'"
          value-class="cd-value"
        />
      </van-cell-group>

      <div class="m-section">
        <span class="m-section__title">{{ $t('m.moreInfo') }}</span>
        <button type="button" class="m-section__action" @click="openNote">
          {{ p.more_info ? $t('edit') : $t('m.add') }}
        </button>
      </div>
      <div class="m-card cd-note" @click="openNote">
        <p v-if="p.more_info">{{ p.more_info }}</p>
        <p v-else class="m-faint">{{ $t('m.noNote') }}</p>
      </div>
    </template>

    <!-- Tahrirlash -->
    <MSheet v-model="editOpen" :title="$t('edit')" full>
      <van-cell-group inset class="cd-form">
        <van-field v-model="form.fullname" :label="$t('ismFamiliya')" label-align="top" />
        <van-field v-model="form.mijozturi" :label="$t('mijozTuri')" label-align="top" />
        <van-field v-model="form.inn" :label="$t('inn')" label-align="top" inputmode="numeric" />
        <van-field
          v-model="form.phone_number"
          :label="$t('telefon')"
          label-align="top"
          type="tel"
        />
        <van-field
          v-model="form.additional_phone_number"
          :label="$t('form_qoshimchaTelefon')"
          label-align="top"
          type="tel"
        />
        <van-field v-model="form.republic" :label="$t('respublika')" label-align="top" />
        <van-field v-model="form.viloyat" :label="$t('viloyat')" label-align="top" />
        <van-field v-model="form.shahar_tuman" :label="$t('shaharTuman')" label-align="top" />
      </van-cell-group>
      <template #footer>
        <van-button @click="editOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="saveEdit">{{ $t('save') }}</van-button>
      </template>
    </MSheet>

    <!-- Izoh -->
    <MSheet v-model="noteOpen" :title="$t('m.moreInfo')">
      <van-cell-group inset>
        <van-field
          v-model="note"
          type="textarea"
          rows="6"
          autosize
          maxlength="2000"
          show-word-limit
          :placeholder="$t('m.notePlaceholder')"
        />
      </van-cell-group>
      <template #footer>
        <van-button @click="noteOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="saveNote">{{ $t('save') }}</van-button>
      </template>
    </MSheet>
  </MPage>
</template>

<style scoped>
.cd-hero {
  background: var(--m-surface);
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid var(--m-line);
}

.cd-hero__avatar {
  width: 64px;
  height: 64px;
  font-size: 24px;
}

.cd-hero__name {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.cd-hero__tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.cd-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  grid-auto-flow: column;
  gap: 8px;
  width: 100%;
  margin-top: 18px;
}

.cd-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 0;
  border-radius: 12px;
  background: var(--m-line-soft);
  color: var(--m-ink-2);
  font-size: 12px;
  font-weight: 500;
}

.cd-action .van-icon {
  font-size: 20px;
  color: var(--m-primary);
}

.cd-action.is-call {
  background: var(--m-good);
  color: var(--m-on-solid);
}

.cd-action.is-call .van-icon {
  color: var(--m-on-solid);
}

.cd-action.is-disabled,
.cd-action:disabled {
  opacity: 0.45;
  pointer-events: none;
}

.cd-action:active {
  filter: brightness(0.95);
}

.cd-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
}

.cd-notice.is-info {
  background: var(--m-primary-soft);
  color: var(--m-primary);
}

.cd-note {
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
}

:deep(.cd-value) {
  color: var(--m-ink);
  flex: 1.4;
}

.cd-form :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}
</style>
