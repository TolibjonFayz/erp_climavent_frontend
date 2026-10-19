<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast, showToast } from 'vant'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useVideosStore } from '@/stores/videos'
import MPage from '../../components/MPage.vue'
import MapPicker from '../../components/MapPicker.vue'
import MediaPicker from '../../components/MediaPicker.vue'
import MDateSheet from '../../components/MDateSheet.vue'
import { currentPosition, reverseGeocode } from '../../geo'
import { errorText, smartDate } from '../../utils'
import { tapFeedback } from '../../native'
import { DOC_OPTIONS, WHERE_OPTIONS, uploadToCloudinary } from './siteData'

const { t, locale } = useI18n()
const router = useRouter()
const comeandgoesStore = useComeAndGoesStore()
const insideStore = useComeAndGoInsideStore()
const videosStore = useVideosStore()

const MAX_EXTRA = 5
let keySeq = 0

const nowMinute = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  return d
}

const newObject = () =>
  reactive({
    key: ++keySeq,
    gone: nowMinute(),
    where: '',
    whereOther: '',
    doc: '',
    docOther: '',
    docNumber: '',
    docDate: null,
    company: '',
    lat: null,
    lng: null,
    locationName: '',
    moreInfo: '',
    locating: false,
  })

const objects = ref([newObject()])
const media = ref([])
const saving = ref(false)
const errors = ref({}) // `${key}.${field}` → true

// Ketish sanasi: kechadan ertagacha (saytdagi cheklov bilan bir xil)
const dayStart = (offset) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}
const minGone = dayStart(-1)
const maxGone = new Date(dayStart(2).getTime() - 60000)

// ─── Sana oynasi ───
const dateSheet = reactive({ open: false, obj: null, field: '', withTime: false, min: null, max: null })
function pickDate(obj, field) {
  const isGone = field === 'gone'
  Object.assign(dateSheet, {
    open: true,
    obj,
    field,
    withTime: isGone,
    min: isGone ? minGone : new Date(2015, 0, 1),
    max: isGone ? maxGone : dayStart(365),
  })
}
function onDate(d) {
  if (dateSheet.obj) {
    dateSheet.obj[dateSheet.field] = d
    clearError(dateSheet.obj, dateSheet.field)
  }
}

// ─── Joylashuv ───
const mapOpen = ref(false)
const mapTarget = ref(null)
function openMap(obj) {
  mapTarget.value = obj
  mapOpen.value = true
}
function onMapSelect({ lat, lng, address }) {
  const obj = mapTarget.value
  if (!obj) return
  obj.lat = lat
  obj.lng = lng
  obj.locationName = address || ''
  clearError(obj, 'location')
}
async function useMyLocation(obj) {
  obj.locating = true
  try {
    const pos = await currentPosition()
    obj.lat = pos.lat
    obj.lng = pos.lng
    obj.locationName = (await reverseGeocode(pos.lng, pos.lat)) || ''
    clearError(obj, 'location')
    tapFeedback()
  } catch (e) {
    showFailToast(e?.code === 'denied' ? t('m.geoDenied') : t('m.geoFailed'))
  } finally {
    obj.locating = false
  }
}

// ─── Obyekt qo'shish / o'chirish ───
async function addObject() {
  if (objects.value.length > MAX_EXTRA) {
    showToast(t('m.maxObjects', { n: MAX_EXTRA }))
    return
  }
  const prev = objects.value[objects.value.length - 1]
  const obj = newObject()
  obj.gone = new Date(prev.gone)
  objects.value.push(obj)
  await nextTick()
  document.getElementById(`obj-${obj.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
async function removeObject(i) {
  try {
    await showConfirmDialog({ message: t('m.removeObjectConfirm'), confirmButtonText: t('deleteConfirm'), cancelButtonText: t('cancel') })
    objects.value.splice(i, 1)
  } catch {
    /* bekor */
  }
}

// ─── Tekshiruv ───
const errKey = (obj, f) => `${obj.key}.${f}`
const hasError = (obj, f) => !!errors.value[errKey(obj, f)]
function clearError(obj, f) {
  if (errors.value[errKey(obj, f)]) {
    const next = { ...errors.value }
    delete next[errKey(obj, f)]
    errors.value = next
  }
}

function validate() {
  const e = {}
  for (const o of objects.value) {
    const add = (f) => (e[errKey(o, f)] = true)
    if (!o.gone) add('gone')
    if (!o.where) add('where')
    if (o.where === 'boshqa' && !o.whereOther.trim()) add('whereOther')
    if (!o.doc) add('doc')
    if (o.doc === 'boshqa' && !o.docOther.trim()) add('docOther')
    if ((o.doc === 'KP' || o.doc === 'Dogovor') && !String(o.docNumber).trim()) add('docNumber')
    if ((o.doc === 'KP' || o.doc === 'Dogovor') && !o.docDate) add('docDate')
    if (!o.company.trim()) add('company')
    if (!o.lat || !o.lng) add('location')
  }
  errors.value = e
  const first = Object.keys(e)[0]
  if (first) {
    showFailToast(t('m.fillRequired'))
    nextTick(() =>
      document.querySelector('.sf .is-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    )
    return false
  }
  return true
}

// Saytdagi createInsidePayload bilan bir xil
const insidePayload = (o, parentId) => ({
  when_gone: o.gone,
  whereto: o.where === 'boshqa' ? o.whereOther.trim() : o.where,
  dogovor_or_kp: o.doc === 'boshqa' ? o.docOther.trim() : o.doc,
  dogovorkp_date: o.doc === 'KP' || o.doc === 'Dogovor' ? o.docDate : null,
  dogovorkp_number: o.doc === 'KP' || o.doc === 'Dogovor' ? String(o.docNumber).trim() : null,
  company_name: o.company.trim(),
  lat: o.lat,
  lng: o.lng,
  locationname: o.locationName,
  more_info: o.moreInfo,
  user_id: Number(localStorage.getItem('userid')),
  come_and_go_father_id: parentId,
})

const stage = ref('') // 'saving' | 'uploading'
async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  stage.value = 'saving'
  const userId = Number(localStorage.getItem('userid'))
  let parentId = null
  try {
    const parent = await comeandgoesStore.createComeAndGoes({ user_id: userId })
    parentId = parent?.newCGO?.id
    if (!parentId) throw new Error('no id')
    for (const o of objects.value) {
      await insideStore.createComeAndGoInside(insidePayload(o, parentId))
    }
  } catch (e) {
    saving.value = false
    stage.value = ''
    showFailToast(errorText(e, t, locale.value))
    return
  }

  // Media: avval Cloudinary, keyin bazaga havola
  let failed = 0
  if (media.value.length) {
    stage.value = 'uploading'
    for (const item of media.value) {
      try {
        item.progress = 1
        const res = await uploadToCloudinary(item.file, (p) => (item.progress = Math.max(1, p)))
        await videosStore.createVideo({
          video_link: res.secure_url,
          video_name: item.file.name,
          user_id: userId,
          comeandgo_id: parentId,
        })
        item.progress = 100
      } catch {
        item.progress = 0
        item.error = true
        failed++
      }
    }
  }

  tapFeedback()
  if (failed) showFailToast(t('m.mediaPartlyFailed', { n: failed }))
  else showSuccessToast(t('m.siteSaved'))
  saving.value = false
  comeandgoesStore.getComeAndGoesOfUser(userId).catch(() => {})
  router.replace({ name: 'site-detail', params: { id: parentId } })
}

const docLabel = (o) =>
  o.doc === 'KP' ? t('m.kpNumber') : o.doc === 'Dogovor' ? t('m.contractNumber') : ''
const uploadedCount = computed(() => media.value.filter((m) => m.progress === 100).length)
</script>

<template>
  <MPage :title="$t('m.newSite')" :back="{ name: 'sites' }">
    <div class="sf">
      <section v-for="(o, i) in objects" :id="`obj-${o.key}`" :key="o.key" class="sf-obj">
        <div class="m-section">
          <span class="m-section__title">
            {{ objects.length > 1 ? $t('m.objectN', { n: i + 1 }) : $t('m.visit') }}
          </span>
          <button v-if="i > 0" type="button" class="m-section__action is-danger" @click="removeObject(i)">
            {{ $t('deleteConfirm') }}
          </button>
        </div>

        <div class="m-card sf-card">
          <!-- Ketish vaqti -->
          <label class="sf-label">{{ $t('m.departureTime') }}</label>
          <button
            type="button"
            class="sf-picker"
            :class="{ 'is-error': hasError(o, 'gone') }"
            @click="pickDate(o, 'gone')"
          >
            <van-icon name="clock-o" />
            <span>{{ o.gone ? smartDate(o.gone, t, locale) : $t('m.choose') }}</span>
            <van-icon name="arrow" class="sf-picker__arrow" />
          </button>

          <!-- Qayerga -->
          <label class="sf-label">{{ $t('m.whereTo') }}</label>
          <div class="sf-options" :class="{ 'is-error': hasError(o, 'where') }">
            <button
              v-for="w in [...WHERE_OPTIONS, { value: 'boshqa', labelKey: 'boshqa' }]"
              :key="w.value"
              type="button"
              class="sf-option"
              :class="{ 'is-active': o.where === w.value }"
              @click="(o.where = w.value), clearError(o, 'where')"
            >
              {{ $t(w.labelKey) }}
            </button>
          </div>
          <van-field
            v-if="o.where === 'boshqa'"
            v-model="o.whereOther"
            class="sf-input"
            :class="{ 'is-error': hasError(o, 'whereOther') }"
            :placeholder="$t('m.whereOtherPlaceholder')"
            @update:model-value="clearError(o, 'whereOther')"
          />

          <!-- Firma -->
          <label class="sf-label">{{ $t('kompaniyaNomi') }}</label>
          <van-field
            v-model="o.company"
            class="sf-input"
            :class="{ 'is-error': hasError(o, 'company') }"
            :placeholder="$t('m.companyPlaceholder')"
            @update:model-value="clearError(o, 'company')"
          />

          <!-- Hujjat -->
          <label class="sf-label">{{ $t('shartnomaKp') }}</label>
          <div class="sf-options" :class="{ 'is-error': hasError(o, 'doc') }">
            <button
              v-for="d in [...DOC_OPTIONS, { value: 'boshqa', labelKey: 'boshqa' }]"
              :key="d.value"
              type="button"
              class="sf-option"
              :class="{ 'is-active': o.doc === d.value }"
              @click="(o.doc = d.value), clearError(o, 'doc')"
            >
              {{ $t(d.labelKey) }}
            </button>
          </div>
          <div v-if="o.doc === 'KP' || o.doc === 'Dogovor'" class="sf-row">
            <van-field
              v-model="o.docNumber"
              class="sf-input"
              :class="{ 'is-error': hasError(o, 'docNumber') }"
              :placeholder="docLabel(o)"
              @update:model-value="clearError(o, 'docNumber')"
            />
            <button
              type="button"
              class="sf-picker is-compact"
              :class="{ 'is-error': hasError(o, 'docDate') }"
              @click="pickDate(o, 'docDate')"
            >
              <van-icon name="calendar-o" />
              <span>{{ o.docDate ? smartDate(o.docDate, t, locale, false) : $t('m.date') }}</span>
            </button>
          </div>
          <van-field
            v-if="o.doc === 'boshqa'"
            v-model="o.docOther"
            class="sf-input"
            :class="{ 'is-error': hasError(o, 'docOther') }"
            :placeholder="$t('m.docOtherPlaceholder')"
            @update:model-value="clearError(o, 'docOther')"
          />

          <!-- Joylashuv -->
          <label class="sf-label">{{ $t('joylashuv') }}</label>
          <div class="sf-loc" :class="{ 'is-error': hasError(o, 'location'), 'is-set': o.lat }">
            <template v-if="o.lat">
              <div class="sf-loc__text">
                <van-icon name="location" class="sf-loc__icon" />
                <div>
                  <p class="sf-loc__name">{{ o.locationName || $t('m.addressUnknown') }}</p>
                  <p class="sf-loc__coords m-num">{{ o.lat.toFixed(5) }}, {{ o.lng.toFixed(5) }}</p>
                </div>
              </div>
            </template>
            <p v-else class="sf-loc__empty">{{ $t('m.locationNotSet') }}</p>
            <div class="sf-loc__actions">
              <van-button
                size="small"
                icon="aim"
                :loading="o.locating"
                @click="useMyLocation(o)"
              >
                {{ $t('m.myLocation') }}
              </van-button>
              <van-button size="small" icon="map-marked" @click="openMap(o)">
                {{ $t('m.onMap') }}
              </van-button>
            </div>
          </div>

          <!-- Izoh -->
          <label class="sf-label">{{ $t('m.comment') }}</label>
          <van-field
            v-model="o.moreInfo"
            class="sf-input"
            type="textarea"
            rows="2"
            autosize
            :placeholder="$t('m.commentPlaceholder')"
          />
        </div>
      </section>

      <button v-if="objects.length <= MAX_EXTRA" type="button" class="sf-add" @click="addObject">
        <van-icon name="add-o" /> {{ $t('m.addObject') }}
      </button>

      <div class="m-section">
        <span class="m-section__title">{{ $t('m.photosVideos') }}</span>
        <span v-if="media.length" class="m-faint">{{ media.length }}</span>
      </div>
      <div class="m-card">
        <MediaPicker v-model="media" :disabled="saving" />
        <p class="sf-hint">{{ $t('m.mediaHint') }}</p>
      </div>
    </div>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" :loading-text="stage === 'uploading' ? $t('m.uploadingN', { done: uploadedCount, total: media.length }) : $t('m.saving')" @click="submit">
          {{ $t('save') }}
        </van-button>
      </div>
    </template>

    <MapPicker
      v-model="mapOpen"
      :initial="mapTarget?.lat ? { lat: mapTarget.lat, lng: mapTarget.lng } : null"
      @select="onMapSelect"
    />
    <MDateSheet
      v-model="dateSheet.open"
      :value="dateSheet.obj?.[dateSheet.field] || null"
      :with-time="dateSheet.withTime"
      :min-date="dateSheet.min || undefined"
      :max-date="dateSheet.max || undefined"
      :title="dateSheet.withTime ? $t('m.departureTime') : $t('m.docDate')"
      @confirm="onDate"
    />
  </MPage>
</template>

<style scoped>
.sf {
  padding-bottom: 12px;
}

.sf-card {
  padding: 4px 14px 16px;
}

.sf-label {
  display: block;
  margin: 14px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--m-ink-2);
}

.sf-picker {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--m-line);
  border-radius: 12px;
  background: var(--m-surface-2);
  font-size: 15px;
  text-align: left;
}

.sf-picker .van-icon {
  color: var(--m-muted);
}

.sf-picker__arrow {
  margin-left: auto;
}

.sf-picker.is-compact {
  flex: 0 0 auto;
  width: auto;
  min-width: 132px;
}

.sf-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 12px;
}

.sf-option {
  flex: 1 1 auto;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--m-line);
  border-radius: 12px;
  background: var(--m-surface);
  font-size: 14px;
  font-weight: 500;
  color: var(--m-ink-2);
}

.sf-option.is-active {
  border-color: var(--m-primary);
  background: var(--m-primary-soft);
  color: var(--m-primary);
  box-shadow: inset 0 0 0 1px var(--m-primary);
}

.sf-input {
  margin-top: 8px;
  padding: 11px 12px;
  border: 1px solid var(--m-line);
  border-radius: 12px;
  background: var(--m-surface-2);
}

.sf-label + .sf-input {
  margin-top: 0;
}

.sf-input::after {
  display: none;
}

.sf-input:focus-within {
  border-color: var(--m-primary);
  background: var(--m-surface);
}

.sf-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.sf-row .sf-input {
  flex: 1;
  margin-top: 0;
}

.sf-loc {
  border: 1px solid var(--m-line);
  border-radius: 12px;
  padding: 12px;
  background: var(--m-surface-2);
}

.sf-loc.is-set {
  background: var(--m-good-soft);
  border-color: var(--m-good-line);
}

.sf-loc__text {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.sf-loc__icon {
  font-size: 20px;
  color: var(--m-good);
  margin-top: 1px;
}

.sf-loc__name {
  font-size: 14px;
  line-height: 1.4;
  color: var(--m-ink);
}

.sf-loc__coords {
  font-size: 12px;
  color: var(--m-muted);
  margin-top: 2px;
}

.sf-loc__empty {
  font-size: 14px;
  color: var(--m-muted);
  margin-bottom: 10px;
}

.sf-loc__actions {
  display: flex;
  gap: 8px;
}

.sf-loc__actions .van-button {
  flex: 1;
  border-radius: 10px;
}

.is-error {
  border-color: var(--m-bad) !important;
  box-shadow: 0 0 0 1px var(--m-bad);
}

.sf-options.is-error {
  box-shadow: 0 0 0 2px var(--m-bad);
  border-color: transparent !important;
}

.sf-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 24px);
  margin: 4px 12px 0;
  min-height: 48px;
  border: 1.5px dashed var(--m-dash);
  border-radius: 14px;
  background: transparent;
  color: var(--m-primary);
  font-size: 15px;
  font-weight: 600;
}

.sf-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--m-faint);
}

.m-section__action.is-danger {
  color: var(--m-bad);
}
</style>
