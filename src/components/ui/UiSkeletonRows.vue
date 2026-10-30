<template>
  <!-- Jadvalga keyingi qatorlar chizilayotganda ko'rinadigan "skelet" qatorlar -->
  <div class="ui-skel" aria-hidden="true">
    <el-skeleton v-for="i in rows" :key="i" animated>
      <template #template>
        <div class="ui-skel__row" :style="{ gridTemplateColumns: columns.map((c) => `${c}fr`).join(' ') }">
          <el-skeleton-item
            v-for="(c, j) in columns"
            :key="j"
            variant="text"
            class="ui-skel__cell"
            :class="{ 'is-num': j >= numericFrom }"
          />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 3 },
  // Ustunlar nisbiy kengligi (jadval ustunlariga o'xshash bo'lsin)
  columns: { type: Array, default: () => [2, 2, 1, 1, 1.4] },
  // Shu indeksdan boshlab ustunlar raqamli — o'ngga tekislanadi va qisqaroq
  numericFrom: { type: Number, default: 2 },
})
</script>

<style scoped>
.ui-skel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid var(--ui-line-soft);
}
.ui-skel__row {
  display: grid;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
}
.ui-skel__cell {
  height: 16px;
}
.ui-skel__cell.is-num {
  width: 60%;
  justify-self: end;
}
</style>
