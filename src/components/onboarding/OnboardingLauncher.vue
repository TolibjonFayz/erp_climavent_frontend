<template>
  <!-- Sarlavhadagi "O'rganish" tugmasi: XP progressi + vazifalar ro'yxati -->
  <el-popover placement="bottom-end" :width="320" trigger="click">
    <template #reference>
      <el-button class="onb-launch" data-tour="onb-launch">
        <span class="onb-launch__ring" :style="ringStyle">
          <span>{{ tour.level.value.icon }}</span>
        </span>
        {{ $t('onbLearn') }}
        <span class="onb-launch__xp">{{ tour.xp.value }} XP</span>
      </el-button>
    </template>

    <div class="onb-missions">
      <div class="onb-missions__head">
        <strong>{{ $t('onbMissionsTitle') }}</strong>
        <span>{{ $t(tour.level.value.key) }}</span>
      </div>
      <div class="onb-missions__bar"><span :style="{ width: tour.progress.value + '%' }" /></div>
      <ul>
        <li v-for="m in tour.missions.value" :key="m.id" :class="{ done: tour.state.done.includes(m.id) }">
          <span class="onb-missions__check">{{ tour.state.done.includes(m.id) ? '✓' : '' }}</span>
          <span class="onb-missions__text">{{ m.task }}</span>
          <span class="onb-missions__xp">+{{ m.xp }}</span>
        </li>
      </ul>
      <div class="onb-missions__actions">
        <el-button size="small" type="primary" @click="tour.start()">
          {{ tour.state.finishedAt ? $t('onbReplay') : $t('onbContinue') }}
        </el-button>
        <el-button size="small" text @click="tour.reset()">{{ $t('onbRestart') }}</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tour: { type: Object, required: true },
})

const ringStyle = computed(() => ({
  background: `conic-gradient(var(--ui-link) ${props.tour.progress.value * 3.6}deg, var(--ui-surface-3) 0)`,
}))
</script>

<style scoped>
.onb-launch__ring {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-right: 6px;
  border-radius: 50%;
}
.onb-launch__ring span {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--ui-surface);
  font-size: 10px;
}
.onb-launch__xp {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  background: var(--ui-warn-soft);
  color: var(--ui-warn-ink);
}
.onb-missions__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--ui-ink);
}
.onb-missions__head span {
  font-size: 12px;
  color: var(--ui-muted);
}
.onb-missions__bar {
  height: 6px;
  margin: 8px 0;
  border-radius: 99px;
  background: var(--ui-surface-3);
  overflow: hidden;
}
.onb-missions__bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--ui-link), #1baf7a);
}
.onb-missions ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.onb-missions li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--ui-ink-2);
  border-bottom: 1px solid var(--ui-line-soft);
}
.onb-missions li.done .onb-missions__text {
  color: var(--ui-muted);
  text-decoration: line-through;
}
.onb-missions__check {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid var(--ui-line-strong);
  font-size: 11px;
  font-weight: 800;
  color: var(--ui-on-accent);
}
.onb-missions li.done .onb-missions__check {
  background: var(--ui-good);
  border-color: var(--ui-good);
}
.onb-missions__text {
  flex: 1;
}
.onb-missions__xp {
  font-size: 12px;
  font-weight: 700;
  color: var(--ui-warn);
}
.onb-missions__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
