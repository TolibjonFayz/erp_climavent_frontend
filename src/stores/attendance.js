import { defineStore } from 'pinia'
import attendanceApi from '@/api/attendance'
import { runRequest } from './helpers'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    userRecords: [], // selected employee's monthly records
    allRecords: [], // every employee (admin overview)
    cameraRecords: [], // selected employee's daily first-in / last-out from the face terminals
    cameraOfficeDays: [], // dates (YYYY-MM-DD) when anyone was recorded in the office
    cameraEmployees: [], // terminal employees and their ERP links (admin)
    cameraDevices: [], // terminals + last agent sync (admin)
    isLoading: false,
    error: null,
  }),
  actions: {
    getCameraUserMonth(userId, month) {
      return this.loadCameraMonth(attendanceApi.getCameraUserMonth(userId, month), month)
    },

    // ERP akkauntiga bog'lanmagan terminal xodimi (admin)
    getCameraEmployeeMonth(employeeNo, month) {
      return this.loadCameraMonth(attendanceApi.getCameraEmployeeMonth(employeeNo, month), month)
    },

    // Kamera ma'lumoti ixtiyoriy: xato bo'lsa davomat sahifasi odatdagidek ishlayveradi
    async loadCameraMonth(recordsRequest, month) {
      try {
        const [records, officeDays] = await Promise.all([
          recordsRequest,
          attendanceApi.getCameraOfficeDays(month),
        ])
        this.cameraRecords = records || []
        this.cameraOfficeDays = officeDays || []
      } catch {
        this.cameraRecords = []
        this.cameraOfficeDays = []
      }
      return this.cameraRecords
    },

    async getCameraSetup() {
      try {
        const [employees, devices] = await Promise.all([
          attendanceApi.getCameraEmployees(),
          attendanceApi.getCameraDevices(),
        ])
        this.cameraEmployees = employees || []
        this.cameraDevices = devices || []
      } catch {
        this.cameraEmployees = []
        this.cameraDevices = []
      }
    },

    async linkCameraEmployee(employeeNo, userId) {
      const updated = await attendanceApi.linkCameraEmployee(employeeNo, userId)
      const row = this.cameraEmployees.find((e) => e.employee_no === employeeNo)
      if (row) row.user_id = updated.user_id
      return updated
    },

    async getUserMonth(userId, month) {
      try {
        const res = await runRequest(
          this,
          () => attendanceApi.getUserMonth(userId, month),
          'Get user attendance failed',
        )
        this.userRecords = Array.isArray(res) ? res : res.data || []
        return this.userRecords
      } catch (error) {
        this.userRecords = []
        throw error
      }
    },

    async getAllMonth(month) {
      try {
        const res = await runRequest(
          this,
          () => attendanceApi.getAllMonth(month),
          'Get all attendance failed',
        )
        this.allRecords = Array.isArray(res) ? res : res.data || []
        return this.allRecords
      } catch (error) {
        this.allRecords = []
        throw error
      }
    },

    async upsert(payload) {
      const res = await runRequest(
        this,
        () => attendanceApi.upsert(payload),
        'Save attendance failed',
      )
      return res.data || res
    },

    async deleteRecord(id) {
      return runRequest(this, () => attendanceApi.remove(id), 'Delete attendance failed')
    },
  },
})
