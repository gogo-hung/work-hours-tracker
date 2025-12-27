// 用戶角色
export type UserRole = 'manager' | 'employee'

// 群組（公司/攤位）
export interface Team {
  id: string
  name: string // 群組名稱
  description?: string // 描述
  inviteCode: string // 邀請碼
  managerId: string // 主管 ID
  createdAt: Date
  updatedAt: Date
}

// 使用者資料
export interface User {
  id: string
  username: string
  email: string
  password: string // 加密儲存
  avatar?: string // 頭像 (base64)
  role: UserRole // 角色：主管或員工
  teamId?: string // 所屬群組 ID
  createdAt: Date
  isPremium: boolean
  premiumExpiry?: Date
}

// 排班資料
export interface Schedule {
  id: string
  userId: string
  jobId: string
  date: string // YYYY-MM-DD 格式
  startTime: string // HH:mm 格式
  endTime: string // HH:mm 格式
  note?: string
  createdAt: Date
  updatedAt: Date
}

// 工作資料
export interface Job {
  id: string
  userId: string
  name: string
  hourlyRate: number // 時薪
  dailyHourLimit: number // 每日工時上限
  color: string // 識別顏色
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 打卡紀錄
export interface TimeRecord {
  id: string
  userId: string
  jobId: string
  clockIn: Date
  clockOut?: Date
  clockInPhoto?: string // 上班打卡照片 (base64)
  clockOutPhoto?: string // 下班打卡照片 (base64)
  breakMinutes: number // 休息時間（分鐘）
  note?: string
  isManualEdit: boolean
  createdAt: Date
  updatedAt: Date
}

// 計算後的工時資料
export interface WorkSummary {
  totalMinutes: number
  totalHours: number
  totalEarnings: number
  records: TimeRecord[]
  overtimeMinutes: number
}

// 日期範圍
export interface DateRange {
  start: Date
  end: Date
}

// 打卡狀態
export type ClockStatus = 'idle' | 'working' | 'break'

// 應用程式狀態
export interface AppState {
  isLoggedIn: boolean
  currentUser: User | null
  currentJob: Job | null
  clockStatus: ClockStatus
  activeRecord: TimeRecord | null
}

// 提醒設定
export interface ReminderSettings {
  overtimeAlert: boolean
  overtimeThreshold: number // 分鐘
  dailyReminder: boolean
  dailyReminderTime: string // HH:mm 格式
}

// 統計資料
export interface Statistics {
  dailyHours: number
  dailyEarnings: number
  weeklyHours: number
  weeklyEarnings: number
  monthlyHours: number
  monthlyEarnings: number
  averageHoursPerDay: number
  totalRecords: number
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 匯出格式
export type ExportFormat = 'excel' | 'pdf'

// 匯出選項
export interface ExportOptions {
  format: ExportFormat
  dateRange: DateRange
  jobIds?: string[]
  includeBreaks: boolean
  includeSummary: boolean
}
