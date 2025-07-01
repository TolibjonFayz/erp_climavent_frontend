<template>
  <div class="obyekt">
    <div class="obyekt-top">
      <h1>Yaqinda borilgan obyektlar</h1>
      <el-button type="primary" class="el-button" :icon="Plus" @click="addObyektDialog = true"
        >Qo'shish</el-button
      >
    </div>
    <el-divider />
    <el-dialog title="Obyekt qo'shish" v-model="addObyektDialog" :modal="false">
      <el-form :model="form" label-width="auto" style="max-width: 600px">
        <el-form-item label="Activity name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Activity zone">
          <el-select v-model="form.region" placeholder="please select your zone">
            <el-option label="Zone one" value="shanghai" />
            <el-option label="Zone two" value="beijing" />
          </el-select>
        </el-form-item>
        <el-form-item label="Activity time">
          <el-col :span="11">
            <el-date-picker
              v-model="form.date1"
              type="date"
              placeholder="Pick a date"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="2" class="text-center">
            <span class="text-gray-500">-</span>
          </el-col>
          <el-col :span="11">
            <el-time-picker v-model="form.date2" placeholder="Pick a time" style="width: 100%" />
          </el-col>
        </el-form-item>
        <el-form-item label="Instant delivery">
          <el-switch v-model="form.delivery" />
        </el-form-item>
        <el-form-item label="Activity type">
          <el-checkbox-group v-model="form.type">
            <el-checkbox value="Online activities" name="type"> Online activities </el-checkbox>
            <el-checkbox value="Promotion activities" name="type">
              Promotion activities
            </el-checkbox>
            <el-checkbox value="Offline activities" name="type"> Offline activities </el-checkbox>
            <el-checkbox value="Simple brand exposure" name="type">
              Simple brand exposure
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="Resources">
          <el-radio-group v-model="form.resource">
            <el-radio value="Sponsor">Sponsor</el-radio>
            <el-radio value="Venue">Venue</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Activity form">
          <el-input v-model="form.desc" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">Create</el-button>
          <el-button>Cancel</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addObyektDialog = false">Cancel</el-button>
          <el-button type="primary" @click="addObyektDialog = false"> Confirm </el-button>
        </div>
      </template>
    </el-dialog>
    <!-- <el-empty description="Bo'm bo'sh" /> -->
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import { ref } from 'vue'

const addObyektDialog = ref(false)
const when_gone = ref('')
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
