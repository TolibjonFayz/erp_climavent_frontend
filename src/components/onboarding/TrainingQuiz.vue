<template>
  <!-- Yo'riqnomadan keyingi test: savollar va baholash serverda, bu yerda faqat ko'rsatish -->
  <el-dialog
    :model-value="modelValue"
    :title="$t('trQuizTitle')"
    width="min(720px, 96vw)"
    class="tr-quiz"
    append-to-body
    :close-on-click-modal="false"
    @close="close"
  >
    <!-- 1. Kirish: qoidalar -->
    <div v-if="stage === 'intro'" class="tr-intro">
      <p class="tr-lead">{{ $t('trIntroLead') }}</p>
      <ul class="tr-rules">
        <li>{{ $t('trRuleCount', { n: perAttempt }) }}</li>
        <li>{{ $t('trRulePass', { p: passPercent }) }}</li>
        <li>{{ $t('trRuleRetry') }}</li>
        <li>{{ $t('trRuleRecord') }}</li>
      </ul>
      <el-alert v-if="!tutorialDone" type="warning" show-icon :closable="false" :title="$t('trNeedTutorial')" />
    </div>

    <!-- 2. Savollar: bitta ekranda bitta savol -->
    <div v-else-if="stage === 'question' && current" class="tr-q">
      <div class="tr-q__progress">
        <span>{{ $t('trQuestionOf', { i: index + 1, n: questions.length }) }}</span>
        <span class="tr-q__answered">{{ $t('trAnswered', { n: answeredCount, total: questions.length }) }}</span>
      </div>
      <div class="tr-q__bar"><span :style="{ width: ((index + 1) / questions.length) * 100 + '%' }" /></div>
      <h3 class="tr-q__text">{{ current.text }}</h3>
      <div class="tr-opts" role="radiogroup">
        <button
          v-for="o in current.options"
          :key="o.key"
          type="button"
          role="radio"
          :aria-checked="answers[current.id] === o.key"
          class="tr-opt"
          :class="{ on: answers[current.id] === o.key }"
          @click="answers[current.id] = o.key"
        >
          <span class="tr-opt__dot" />{{ o.text }}
        </button>
      </div>
    </div>

    <!-- 3. Natija -->
    <div v-else-if="stage === 'result' && result" class="tr-result" :class="result.passed ? 'ok' : 'fail'">
      <div class="tr-result__icon">{{ result.passed ? '✓' : '!' }}</div>
      <h3>{{ result.passed ? $t('trPassedTitle') : $t('trFailedTitle') }}</h3>
      <p class="tr-result__score">
        {{ $t('trScore', { c: result.correct, n: result.total, p: result.score_pct }) }}
      </p>
      <p v-if="result.passed">{{ $t('trPassedText') }}</p>
      <template v-else>
        <p>{{ $t('trFailedText', { p: result.pass_percent }) }}</p>
        <div v-if="result.wrong_topics?.length" class="tr-topics">
          <b>{{ $t('trReread') }}</b>
          <ul>
            <li v-for="tp in result.wrong_topics" :key="tp">{{ topicTitle(tp) }}</li>
          </ul>
        </div>
      </template>
    </div>

    <div v-else class="tr-loading" v-loading="true" />

    <template #footer>
      <div class="tr-foot">
        <template v-if="stage === 'intro'">
          <el-button size="large" @click="close">{{ $t('trLater') }}</el-button>
          <el-button size="large" type="primary" :disabled="!tutorialDone" :loading="busy" @click="begin">
            {{ $t('trStart') }}
          </el-button>
        </template>
        <template v-else-if="stage === 'question'">
          <el-button size="large" :disabled="index === 0" @click="index--">{{ $t('onbBack') }}</el-button>
          <el-button v-if="index < questions.length - 1" size="large" type="primary" @click="index++">
            {{ $t('onbNext') }}
          </el-button>
          <el-button v-else size="large" type="primary" :loading="busy" @click="submit">{{ $t('trSubmit') }}</el-button>
        </template>
        <template v-else-if="stage === 'result'">
          <template v-if="result?.passed">
            <el-button size="large" type="primary" @click="close">{{ $t('onbDone') }}</el-button>
          </template>
          <template v-else>
            <el-button size="large" @click="reread">{{ $t('trRereadBtn') }}</el-button>
            <el-button size="large" type="primary" :loading="busy" @click="begin">{{ $t('trRetry') }}</el-button>
          </template>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import trainingApi from '@/api/training'
import { apiError } from '@/utils/skladFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  module: { type: String, required: true },
  tutorialDone: { type: Boolean, default: false },
  passPercent: { type: Number, default: 80 },
  perAttempt: { type: Number, default: 10 },
  // Mavzu (yo'riqnoma qadami id'si) → odamga tushunarli nom
  topicTitle: { type: Function, default: (t) => t },
})
const emit = defineEmits(['update:modelValue', 'finished', 'reread'])
const { t, locale } = useI18n()

const stage = ref('intro') // intro | loading | question | result
const busy = ref(false)
const attemptId = ref(null)
const questions = ref([])
const index = ref(0)
const answers = reactive({})
const result = ref(null)

const current = computed(() => questions.value[index.value])
const answeredCount = computed(() => questions.value.filter((q) => answers[q.id]).length)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      stage.value = 'intro'
      result.value = null
    }
  },
)

async function begin() {
  busy.value = true
  try {
    const res = await trainingApi.startQuiz(props.module, locale.value === 'ru' ? 'ru' : 'uz')
    attemptId.value = res.attempt_id
    questions.value = res.questions
    Object.keys(answers).forEach((k) => delete answers[k])
    index.value = 0
    result.value = null
    stage.value = 'question'
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    busy.value = false
  }
}

async function submit() {
  const missing = questions.value.length - answeredCount.value
  if (missing > 0) {
    try {
      await ElMessageBox.confirm(t('trMissing', { n: missing }), t('trSubmit'), {
        type: 'warning',
        confirmButtonText: t('trSubmitAnyway'),
        cancelButtonText: t('trGoBack'),
      })
    } catch {
      index.value = questions.value.findIndex((q) => !answers[q.id])
      return
    }
  }
  busy.value = true
  try {
    result.value = await trainingApi.submitQuiz(props.module, { attempt_id: attemptId.value, answers: { ...answers } })
    stage.value = 'result'
    emit('finished', result.value)
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    busy.value = false
  }
}

function reread() {
  emit('update:modelValue', false)
  emit('reread')
}

function close() {
  // Test o'rtasida yopilsa — urinish topshirilmagan bo'lib qoladi (qayta boshlash mumkin)
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.tr-lead {
  margin: 0 0 12px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--ui-ink);
}
.tr-rules {
  margin: 0 0 16px;
  padding-left: 20px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--ui-ink-2);
}
.tr-q__progress {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--ui-muted);
}
.tr-q__answered {
  font-variant-numeric: tabular-nums;
}
.tr-q__bar {
  height: 6px;
  margin: 8px 0 18px;
  border-radius: 99px;
  background: var(--ui-surface-3);
  overflow: hidden;
  span {
    display: block;
    height: 100%;
    background: var(--ui-link);
    transition: width 0.25s ease;
  }
}
.tr-q__text {
  margin: 0 0 16px;
  font-size: 19px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--ui-ink);
}
.tr-opts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tr-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 12px 16px;
  border: 2px solid var(--ui-line);
  border-radius: 12px;
  background: var(--ui-surface);
  color: var(--ui-ink);
  font: inherit;
  font-size: 16px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  &:hover {
    border-color: var(--ui-link-line);
  }
  &.on {
    border-color: var(--ui-link);
    background: var(--ui-link-soft);
  }
  &:focus-visible {
    outline: 3px solid var(--ui-link-line);
    outline-offset: 2px;
  }
}
.tr-opt__dot {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--ui-line-strong);
  .on & {
    border-color: var(--ui-link);
    box-shadow: inset 0 0 0 4px var(--ui-surface);
    background: var(--ui-link);
  }
}
.tr-result {
  text-align: center;
  padding: 8px 8px 0;
  h3 {
    margin: 10px 0 6px;
    font-size: 21px;
    color: var(--ui-ink);
  }
  p {
    margin: 0 0 10px;
    font-size: 15px;
    line-height: 1.55;
    color: var(--ui-ink-2);
  }
}
.tr-result__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 50%;
  font-size: 32px;
  font-weight: 800;
  .ok & {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  .fail & {
    background: var(--ui-warn-soft);
    color: var(--ui-warn);
  }
}
.tr-result__score {
  font-size: 18px !important;
  font-weight: 700;
  color: var(--ui-ink) !important;
}
.tr-topics {
  margin: 12px auto 0;
  max-width: 460px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--ui-surface-2);
  text-align: left;
  font-size: 15px;
  ul {
    margin: 6px 0 0;
    padding-left: 20px;
    line-height: 1.7;
  }
}
.tr-loading {
  min-height: 200px;
}
.tr-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  .el-button + .el-button {
    margin-left: 0;
  }
}
</style>
