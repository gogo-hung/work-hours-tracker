// API Stores - 連接後端伺服器的 Zustand Stores
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Job, TimeRecord, ClockStatus, Statistics, Schedule, UserRole, Team } from '@/types'
import { authAPI, userAPI, teamAPI, jobAPI, recordAPI, scheduleAPI } from '@/api'
import { calculateStatistics } from '@/utils'

// ==================== 認證 Store ====================
interface AuthState {
  user: User | null
  team: Team | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null
  
  register: (username: string, email: string, password: string, role: UserRole, avatar?: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateAvatar: (avatar: string) => Promise<void>
  createTeam: (name: string) => Promise<boolean>
  joinTeam: (inviteCode: string) => Promise<boolean>
  leaveTeam: () => Promise<void>
  loadTeam: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      team: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      
      register: async (username, email, password, role, avatar) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.register({
            email,
            password,
            name: username,
            role
          }) as User
          
          // 如果有頭像，更新用戶頭像
          if (avatar && response.id) {
            await userAPI.update(response.id, { avatar })
            response.avatar = avatar
          }
          
          // 轉換後端格式到前端格式
          const user: User = {
            id: response.id,
            username: response.name || username,
            email: response.email,
            password: '', // 不儲存密碼
            avatar: response.avatar,
            role: response.role,
            teamId: response.teamId,
            createdAt: new Date(response.createdAt),
            isPremium: false
          }
          
          set({ user, isLoggedIn: true, isLoading: false })
          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : '註冊失敗'
          set({ error: message, isLoading: false })
          return false
        }
      },
      
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.login({ email, password }) as User
          
          const user: User = {
            id: response.id,
            username: response.name || email,
            email: response.email,
            password: '',
            avatar: response.avatar,
            role: response.role,
            teamId: response.teamId,
            createdAt: new Date(response.createdAt),
            isPremium: false
          }
          
          set({ user, isLoggedIn: true, isLoading: false })
          
          // 載入群組資訊
          setTimeout(() => get().loadTeam(), 100)
          
          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : '登入失敗'
          set({ error: message, isLoading: false })
          return false
        }
      },
      
      logout: () => {
        set({ user: null, team: null, isLoggedIn: false, error: null })
      },
      
      updateAvatar: async (avatar) => {
        const user = get().user
        if (!user) return
        
        try {
          await userAPI.update(user.id, { avatar })
          set({ user: { ...user, avatar } })
        } catch {
          console.error('更新頭像失敗')
        }
      },
      
      createTeam: async (name) => {
        const user = get().user
        if (!user || user.role !== 'manager') return false
        
        set({ isLoading: true, error: null })
        
        try {
          const team = await teamAPI.create({ name, managerId: user.id }) as Team
          
          set({
            team,
            user: { ...user, teamId: team.id },
            isLoading: false
          })
          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : '建立群組失敗'
          set({ error: message, isLoading: false })
          return false
        }
      },
      
      joinTeam: async (inviteCode) => {
        const user = get().user
        if (!user) return false
        
        set({ isLoading: true, error: null })
        
        try {
          const result = await teamAPI.join({ inviteCode, userId: user.id }) as { team: Team; user: User }
          
          set({
            team: result.team,
            user: { ...user, teamId: result.team.id },
            isLoading: false
          })
          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : '加入群組失敗'
          set({ error: message, isLoading: false })
          return false
        }
      },
      
      leaveTeam: async () => {
        const user = get().user
        if (!user) return
        
        try {
          await userAPI.update(user.id, { teamId: null })
          set({
            team: null,
            user: { ...user, teamId: undefined }
          })
        } catch {
          console.error('離開群組失敗')
        }
      },
      
      loadTeam: async () => {
        const user = get().user
        if (!user || !user.teamId) {
          set({ team: null })
          return
        }
        
        try {
          const team = await teamAPI.get(user.teamId) as Team
          set({ team })
        } catch {
          console.error('載入群組失敗')
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage-api',
      partialize: (state) => ({ user: state.user, team: state.team, isLoggedIn: state.isLoggedIn })
    }
  )
)

// ==================== 員工管理 Store ====================
interface EmployeeState {
  employees: User[]
  isLoading: boolean
  error: string | null
  
  loadEmployees: (teamId?: string) => Promise<void>
  clearError: () => void
}

export const useEmployeeStore = create<EmployeeState>()((set) => ({
  employees: [],
  isLoading: false,
  error: null,
  
  loadEmployees: async (teamId) => {
    if (!teamId) {
      set({ employees: [], isLoading: false })
      return
    }
    
    set({ isLoading: true })
    try {
      const employees = await teamAPI.getEmployees(teamId) as User[]
      console.log('從後端載入的員工:', employees)
      set({ employees, isLoading: false })
    } catch (err) {
      console.error('載入員工失敗:', err)
      set({ error: '載入員工列表失敗', isLoading: false })
    }
  },
  
  clearError: () => set({ error: null })
}))

// ==================== 工作 Store ====================
interface JobState {
  jobs: Job[]
  currentJob: Job | null
  isLoading: boolean
  error: string | null
  
  loadJobs: (userId: string) => Promise<void>
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateJob: (id: string, data: Partial<Job>) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  setCurrentJob: (job: Job | null) => void
  clearError: () => void
}

export const useJobStore = create<JobState>()((set) => ({
  jobs: [],
  currentJob: null,
  isLoading: false,
  error: null,
  
  loadJobs: async (userId) => {
    set({ isLoading: true })
    try {
      const jobs = await jobAPI.getByUser(userId) as Job[]
      const activeJobs = jobs.filter(j => j.isActive !== false)
      set({
        jobs,
        currentJob: activeJobs.length > 0 ? activeJobs[0] : null,
        isLoading: false
      })
    } catch {
      set({ error: '載入工作資料失敗', isLoading: false })
    }
  },
  
  addJob: async (jobData) => {
    set({ isLoading: true })
    try {
      const newJob = await jobAPI.create({
        userId: jobData.userId,
        name: jobData.name,
        hourlyRate: jobData.hourlyRate,
        maxHoursPerDay: jobData.maxHoursPerDay
      }) as Job
      
      set(state => ({
        jobs: [...state.jobs, newJob],
        currentJob: state.currentJob || newJob,
        isLoading: false
      }))
    } catch {
      set({ error: '新增工作失敗', isLoading: false })
    }
  },
  
  updateJob: async (id, data) => {
    set({ isLoading: true })
    try {
      await jobAPI.update(id, data)
      set(state => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, ...data } : j),
        currentJob: state.currentJob?.id === id ? { ...state.currentJob, ...data } : state.currentJob,
        isLoading: false
      }))
    } catch {
      set({ error: '更新工作失敗', isLoading: false })
    }
  },
  
  deleteJob: async (id) => {
    set({ isLoading: true })
    try {
      await jobAPI.delete(id)
      set(state => ({
        jobs: state.jobs.filter(j => j.id !== id),
        currentJob: state.currentJob?.id === id ? null : state.currentJob,
        isLoading: false
      }))
    } catch {
      set({ error: '刪除工作失敗', isLoading: false })
    }
  },
  
  setCurrentJob: (job) => set({ currentJob: job }),
  
  clearError: () => set({ error: null })
}))

// ==================== 打卡記錄 Store ====================
interface TimeRecordState {
  records: TimeRecord[]
  activeRecord: TimeRecord | null
  clockStatus: ClockStatus
  statistics: Statistics | null
  isLoading: boolean
  error: string | null
  
  loadRecords: (userId: string) => Promise<void>
  clockIn: (userId: string, jobId: string, photo?: string) => Promise<void>
  clockOut: (photo?: string, note?: string) => Promise<void>
  updateRecord: (id: string, data: Partial<TimeRecord>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  calculateStats: (hourlyRate: number, dailyHourLimit: number) => void
  clearError: () => void
}

export const useTimeRecordStore = create<TimeRecordState>()((set, get) => ({
  records: [],
  activeRecord: null,
  clockStatus: 'idle',
  statistics: null,
  isLoading: false,
  error: null,
  
  loadRecords: async (userId) => {
    set({ isLoading: true })
    try {
      const records = await recordAPI.getByUser(userId) as TimeRecord[]
      
      // 轉換日期格式
      const formattedRecords = records.map(r => ({
        ...r,
        clockIn: new Date(r.clockIn),
        clockOut: r.clockOut ? new Date(r.clockOut) : undefined,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt || r.createdAt)
      }))
      
      const activeRecord = formattedRecords.find(r => !r.clockOut)
      set({
        records: formattedRecords,
        activeRecord: activeRecord || null,
        clockStatus: activeRecord ? 'working' : 'idle',
        isLoading: false
      })
    } catch {
      set({ error: '載入打卡紀錄失敗', isLoading: false })
    }
  },
  
  clockIn: async (userId, jobId, photo) => {
    set({ isLoading: true })
    try {
      const now = new Date()
      const record = await recordAPI.clockIn({
        userId,
        jobId,
        clockIn: now.toISOString(),
        clockInPhoto: photo
      }) as TimeRecord
      
      const newRecord = {
        ...record,
        clockIn: new Date(record.clockIn),
        createdAt: new Date(record.createdAt)
      }
      
      set(state => ({
        records: [...state.records, newRecord],
        activeRecord: newRecord,
        clockStatus: 'working',
        isLoading: false
      }))
    } catch {
      set({ error: '上班打卡失敗', isLoading: false })
    }
  },
  
  clockOut: async (photo, note) => {
    const { activeRecord } = get()
    if (!activeRecord) {
      set({ error: '沒有進行中的打卡紀錄' })
      return
    }
    
    set({ isLoading: true })
    try {
      const now = new Date()
      await recordAPI.clockOut(activeRecord.id, {
        clockOut: now.toISOString(),
        clockOutPhoto: photo
      })
      
      set(state => ({
        records: state.records.map(r =>
          r.id === activeRecord.id
            ? { ...r, clockOut: now, clockOutPhoto: photo, note }
            : r
        ),
        activeRecord: null,
        clockStatus: 'idle',
        isLoading: false
      }))
    } catch {
      set({ error: '下班打卡失敗', isLoading: false })
    }
  },
  
  updateRecord: async (id, data) => {
    set({ isLoading: true })
    try {
      // TODO: 實作後端 API
      set(state => ({
        records: state.records.map(r =>
          r.id === id ? { ...r, ...data, isManualEdit: true } : r
        ),
        isLoading: false
      }))
    } catch {
      set({ error: '更新紀錄失敗', isLoading: false })
    }
  },
  
  deleteRecord: async (id) => {
    set({ isLoading: true })
    try {
      // TODO: 實作後端 API
      set(state => ({
        records: state.records.filter(r => r.id !== id),
        activeRecord: state.activeRecord?.id === id ? null : state.activeRecord,
        clockStatus: state.activeRecord?.id === id ? 'idle' : state.clockStatus,
        isLoading: false
      }))
    } catch {
      set({ error: '刪除紀錄失敗', isLoading: false })
    }
  },
  
  calculateStats: (hourlyRate, dailyHourLimit) => {
    const { records } = get()
    const stats = calculateStatistics(records, hourlyRate, dailyHourLimit)
    set({ statistics: stats })
  },
  
  clearError: () => set({ error: null })
}))

// ==================== 排班 Store ====================
interface ScheduleState {
  schedules: Schedule[]
  isLoading: boolean
  error: string | null
  
  loadSchedules: (userId: string) => Promise<void>
  loadMonthSchedules: (userId: string, year: number, month: number) => Promise<void>
  loadTeamSchedules: (teamId: string) => Promise<void>
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  clearError: () => void
}

export const useScheduleStore = create<ScheduleState>()((set) => ({
  schedules: [],
  isLoading: false,
  error: null,
  
  loadSchedules: async (userId) => {
    set({ isLoading: true })
    try {
      const schedules = await scheduleAPI.getByUser(userId) as Schedule[]
      
      const formattedSchedules = schedules.map(s => ({
        ...s,
        date: new Date(s.date),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt || s.createdAt)
      }))
      
      set({ schedules: formattedSchedules, isLoading: false })
    } catch {
      set({ error: '載入排班資料失敗', isLoading: false })
    }
  },
  
  // 載入特定月份的排班（會過濾出該月份的資料）
  loadMonthSchedules: async (userId, year, month) => {
    set({ isLoading: true })
    try {
      const schedules = await scheduleAPI.getByUser(userId) as Schedule[]
      
      const formattedSchedules = schedules
        .map(s => ({
          ...s,
          date: new Date(s.date),
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt || s.createdAt)
        }))
        .filter(s => {
          const scheduleDate = s.date
          return scheduleDate.getFullYear() === year && scheduleDate.getMonth() + 1 === month
        })
      
      set({ schedules: formattedSchedules, isLoading: false })
    } catch {
      set({ error: '載入排班資料失敗', isLoading: false })
    }
  },
  
  loadTeamSchedules: async (teamId) => {
    set({ isLoading: true })
    try {
      const schedules = await scheduleAPI.getByTeam(teamId) as Schedule[]
      
      const formattedSchedules = schedules.map(s => ({
        ...s,
        date: new Date(s.date),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt || s.createdAt)
      }))
      
      set({ schedules: formattedSchedules, isLoading: false })
    } catch {
      set({ error: '載入團隊排班資料失敗', isLoading: false })
    }
  },
  
  addSchedule: async (scheduleData) => {
    set({ isLoading: true })
    try {
      const dateStr = scheduleData.date instanceof Date 
        ? scheduleData.date.toISOString().split('T')[0]
        : scheduleData.date
      
      const newSchedule = await scheduleAPI.create({
        userId: scheduleData.userId,
        date: dateStr,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        note: scheduleData.note,
        createdBy: scheduleData.createdBy
      }) as Schedule
      
      const formattedSchedule = {
        ...newSchedule,
        date: new Date(newSchedule.date),
        createdAt: new Date(newSchedule.createdAt)
      }
      
      set(state => ({
        schedules: [...state.schedules, formattedSchedule],
        isLoading: false
      }))
    } catch {
      set({ error: '新增排班失敗', isLoading: false })
    }
  },
  
  updateSchedule: async (id, data) => {
    set({ isLoading: true })
    try {
      await scheduleAPI.update(id, data)
      set(state => ({
        schedules: state.schedules.map(s =>
          s.id === id ? { ...s, ...data } : s
        ),
        isLoading: false
      }))
    } catch {
      set({ error: '更新排班失敗', isLoading: false })
    }
  },
  
  deleteSchedule: async (id) => {
    set({ isLoading: true })
    try {
      await scheduleAPI.delete(id)
      set(state => ({
        schedules: state.schedules.filter(s => s.id !== id),
        isLoading: false
      }))
    } catch {
      set({ error: '刪除排班失敗', isLoading: false })
    }
  },
  
  clearError: () => set({ error: null })
}))
