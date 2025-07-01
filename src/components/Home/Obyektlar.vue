<template>
  <div class="obyekt">
    <div class="obyekt-top">
      <h1>Yaqinda borilgan obyektlar</h1>
      <el-button type="primary" class="el-button" :icon="Plus">Qo'shish</el-button>
    </div>
    <el-divider />
    <el-empty description="Bo'm bo'sh" />
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.obyekt {
  width: 100%;
  padding: 20px;

  &-top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      font-size: 24px;
      color: #333;
    }
  }
}
</style>
