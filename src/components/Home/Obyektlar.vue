<template>
  <div class="obyekt">
    <div class="obyekt-top">
      <h1>Yaqinda borilgan obyektlar</h1>
      <el-button type="primary" class="el-button" :icon="Plus" @click="goToCreateObyekt()">
        Qo'shish
      </el-button>
    </div>
    <el-divider />

    <div v-loading="loading">
      <el-table
        v-if="comeandgoesStore.allComeAndGoesofUser.length > 0"
        :data="comeandgoesStore.allComeAndGoesofUser"
        style="width: 100%"
      >
        <el-table-column
          type="index"
          :index="(index) => comeandgoesStore.allComeAndGoesofUser.length - index"
        />
        <el-table-column prop="when_gone" label="Ketilgan vaqt" width="220" />
        <el-table-column prop="when_came" label="Qaytilgam vaqt" width="220" />
        <el-table-column prop="whereto" label="Qayerga" width="220" />
        <el-table-column prop="dogovor_or_kp" label="Dogovor yoki KP" width="180" />
        <el-table-column prop="locationname" label="Joylashuv" />
        <el-table-column align="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.$index, scope.row)">
              Ko'proq
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="Hech qayerga bormapsizu hali aka" />
    </div>
  </div>
</template>

<script setup>
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { Plus } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import router from '@/router'

const comeandgoesStore = useComeAndGoesStore()
const loading = ref(false)

const goToCreateObyekt = () => {
  router.push({ name: 'create-obyekt' })
}

const handleEdit = (index, row) => {
  router.push({ name: 'single-obyekt', params: { id: row.id } })
}

onMounted(async () => {
  loading.value = true
  const userId = localStorage.getItem('userid')
  await comeandgoesStore.getComeAndGoesOfUser(Number(userId))
  loading.value = false
})
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
