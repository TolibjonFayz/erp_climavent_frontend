<template>
  <el-drawer
    :model-value="modelValue != null"
    size="min(560px, 100vw)"
    :with-header="false"
    @close="$emit('update:modelValue', null)"
  >
    <div v-loading="loading" class="ld-d">
      <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />
      <template v-if="lead">
        <header class="ld-d__head">
          <div>
            <div class="ld-d__meta">{{ SOURCE_ICON[lead.source] }} {{ $t(`ldSource_${lead.source}`) }}<template v-if="lead.chat_title"> · {{ lead.chat_title }}</template></div>
            <h3>{{ leadTitle(lead) }}</h3>
            <div v-if="lead.username" class="ld-d__meta">
              <a :href="`https://t.me/${lead.username}`" target="_blank" rel="noopener">@{{ lead.username }}</a>
            </div>
          </div>
          <el-button text :icon="Close" :aria-label="$t('ldClose')" @click="$emit('update:modelValue', null)" />
        </header>

        <div class="ld-d__form">
          <label>{{ $t('ldColStatus') }}
            <el-select v-model="form.status" @change="save({ status: form.status })">
              <el-option v-for="s in LEAD_STATUSES" :key="s" :value="s" :label="$t(`ldStatus_${s}`)" />
            </el-select>
          </label>
          <label>{{ $t('ldColManager') }}
            <el-select v-model="form.manager_id" clearable filterable :placeholder="$t('ldNoManager')" @change="save({ manager_id: form.manager_id ?? null })">
              <el-option v-for="u in managers" :key="u.id" :value="u.id" :label="userName(u)" />
            </el-select>
          </label>
          <label>{{ $t('ldName') }}
            <el-input v-model="form.name" @change="save({ name: form.name })" />
          </label>
          <label>{{ $t('ldColPhone') }}
            <el-input v-model="form.phone" @change="save({ phone: form.phone })" />
          </label>
          <label v-if="lead.source === 'email' || lead.email">{{ $t('ldEmail') }}
            <el-input v-model="form.email" @change="save({ email: form.email })" />
          </label>
          <label class="ld-d__wide">{{ $t('ldNote') }}
            <el-input v-model="form.note" type="textarea" :rows="3" maxlength="4000" :placeholder="$t('ldNotePh')" @change="save({ note: form.note })" />
          </label>
        </div>

        <h4 class="ld-d__h">{{ $t('ldMessages', { n: lead.messages?.length || 0 }) }}</h4>
        <div v-if="!lead.messages?.length" class="ld-d__empty">{{ $t('ldNoMessages') }}</div>
        <ul v-else class="ld-chat">
          <li v-for="m in lead.messages" :key="m.id" class="ld-chat__item">
            <div v-if="m.context" class="ld-chat__ctx">📣 {{ $t('ldPostComment') }}: «{{ m.context }}»</div>
            <div class="ld-chat__text">{{ m.text }}</div>
            <div class="ld-chat__meta">
              {{ formatDateTime(m.sent_at) }}
              <template v-if="m.chat_title && m.chat_title !== lead.chat_title"> · {{ m.chat_title }}</template>
              <a v-if="m.link" :href="m.link" target="_blank" rel="noopener">{{ $t('ldOpenInTg') }} ↗</a>
            </div>
          </li>
        </ul>

        <footer v-if="isAdmin" class="ld-d__foot">
          <el-popconfirm :title="$t('ldDeleteConfirm')" @confirm="remove">
            <template #reference>
              <el-button type="danger" text :icon="Delete">{{ $t('ldDelete') }}</el-button>
            </template>
          </el-popconfirm>
        </footer>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Close, Delete } from '@element-plus/icons-vue'
import api from '@/api/leads'
import { formatDateTime } from '@/utils/format'
import { LEAD_STATUSES, SOURCE_ICON, leadTitle, userName } from '@/utils/leadsFormat'

const props = defineProps({
  modelValue: { type: Number, default: null },
  managers: { type: Array, default: () => [] },
  isAdmin: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'changed'])
const { t } = useI18n()

const lead = ref(null)
const loading = ref(false)
const error = ref('')
const form = reactive({ status: 'new', manager_id: null, name: '', phone: '', email: '', note: '' })

const errText = (e) => e?.response?.data?.message || t('ldLoadError')

async function load(id) {
  lead.value = null
  error.value = ''
  if (id == null) return
  loading.value = true
  try {
    const data = await api.one(id)
    if (props.modelValue !== id) return // drawer boshqa lidga o'tib ketgan
    lead.value = data
    Object.assign(form, {
      status: data.status,
      manager_id: data.manager_id ?? null,
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      note: data.note || '',
    })
  } catch (e) {
    error.value = errText(e)
  } finally {
    loading.value = false
  }
}

async function save(patch) {
  try {
    const updated = await api.update(lead.value.id, patch)
    Object.assign(lead.value, updated)
    ElMessage.success(t('ldSaved'))
    emit('changed')
  } catch (e) {
    ElMessage.error(errText(e))
    load(props.modelValue) // formani serverdagi holatga qaytaramiz
  }
}

async function remove() {
  try {
    await api.remove(lead.value.id)
    emit('update:modelValue', null)
    emit('changed')
  } catch (e) {
    ElMessage.error(errText(e))
  }
}

watch(() => props.modelValue, load, { immediate: true })
</script>

<style scoped>
.ld-d {
  padding: 4px 4px 24px;
}
.ld-d__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
}
.ld-d__head h3 {
  margin: 2px 0;
  font-size: 20px;
}
.ld-d__meta {
  color: var(--ui-text-muted, #8a8f98);
  font-size: 13px;
}
.ld-d__form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ld-d__form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ui-text-muted, #8a8f98);
}
.ld-d__wide {
  grid-column: 1 / -1;
}
.ld-d__h {
  margin: 22px 0 8px;
}
.ld-d__empty {
  color: var(--ui-text-muted, #8a8f98);
}
.ld-chat {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ld-chat__item {
  background: var(--ui-surface-2, rgba(127, 127, 127, 0.1));
  border-radius: 10px;
  padding: 10px 12px;
}
.ld-chat__ctx {
  font-size: 12px;
  color: var(--ui-text-muted, #8a8f98);
  margin-bottom: 4px;
}
.ld-chat__text {
  white-space: pre-wrap;
  word-break: break-word;
}
.ld-chat__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-text-muted, #8a8f98);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ld-d__foot {
  margin-top: 24px;
  border-top: 1px solid var(--ui-border, rgba(127, 127, 127, 0.25));
  padding-top: 8px;
}
@media (max-width: 520px) {
  .ld-d__form {
    grid-template-columns: 1fr;
  }
}
</style>
