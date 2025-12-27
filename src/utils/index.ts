import type { TimeRecord, WorkSummary, Statistics, DateRange } from '@/types'

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 格式化時間 (HH:mm)
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 格式化日期 (YYYY/MM/DD)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化日期時間
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

// 格式化工時 (X小時Y分鐘)
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours === 0) {
    return `${mins}分鐘`
  }
  if (mins === 0) {
    return `${hours}小時`
  }
  return `${hours}小時${mins}分鐘`
}

// 格式化金額
export function formatCurrency(amount: number | undefined | null): string {
  // 處理 undefined, null, NaN 的情況
  const safeAmount = (amount == null || isNaN(amount)) ? 0 : amount
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(safeAmount)
}

// 計算兩個時間之間的分鐘數
export function calculateMinutesBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
}

// 計算單筆紀錄的工時（分鐘）
export function calculateRecordMinutes(record: TimeRecord): number {
  if (!record.clockOut) return 0
  const totalMinutes = calculateMinutesBetween(
    new Date(record.clockIn),
    new Date(record.clockOut)
  )
  const breakMinutes = record.breakMinutes ?? 0
  return Math.max(0, totalMinutes - breakMinutes)
}

// 計算單筆紀錄的薪資
export function calculateRecordEarnings(
  record: TimeRecord,
  hourlyRate: number | undefined | null
): number {
  if (!hourlyRate || isNaN(hourlyRate)) return 0
  const minutes = calculateRecordMinutes(record)
  return (minutes / 60) * hourlyRate
}

// 計算工作摘要
export function calculateWorkSummary(
  records: TimeRecord[],
  hourlyRate: number,
  dailyHourLimit: number
): WorkSummary {
  const completedRecords = records.filter(r => r.clockOut)
  
  let totalMinutes = 0
  let overtimeMinutes = 0
  
  // 按日期分組計算
  const recordsByDate = new Map<string, TimeRecord[]>()
  
  completedRecords.forEach(record => {
    const dateKey = formatDate(new Date(record.clockIn))
    const existing = recordsByDate.get(dateKey) || []
    existing.push(record)
    recordsByDate.set(dateKey, existing)
  })
  
  recordsByDate.forEach(dayRecords => {
    const dayMinutes = dayRecords.reduce(
      (sum, r) => sum + calculateRecordMinutes(r),
      0
    )
    totalMinutes += dayMinutes
    
    const limitMinutes = dailyHourLimit * 60
    if (dayMinutes > limitMinutes) {
      overtimeMinutes += dayMinutes - limitMinutes
    }
  })
  
  return {
    totalMinutes,
    totalHours: totalMinutes / 60,
    totalEarnings: (totalMinutes / 60) * hourlyRate,
    records: completedRecords,
    overtimeMinutes
  }
}

// 取得今天的日期範圍
export function getTodayRange(): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { start: today, end: tomorrow }
}

// 取得本週的日期範圍（週一到週日）
export function getWeekRange(): DateRange {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)
  
  return { start: monday, end: sunday }
}

// 取得本月的日期範圍
export function getMonthRange(): DateRange {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  
  return { start: firstDay, end: lastDay }
}

// 計算統計資料
export function calculateStatistics(
  records: TimeRecord[],
  hourlyRate: number,
  dailyHourLimit: number
): Statistics {
  const todayRange = getTodayRange()
  const weekRange = getWeekRange()
  const monthRange = getMonthRange()
  
  const filterByRange = (range: DateRange) =>
    records.filter(r => {
      const clockIn = new Date(r.clockIn)
      return clockIn >= range.start && clockIn < range.end && r.clockOut
    })
  
  const todayRecords = filterByRange(todayRange)
  const weekRecords = filterByRange(weekRange)
  const monthRecords = filterByRange(monthRange)
  
  const calcSummary = (recs: TimeRecord[]) =>
    calculateWorkSummary(recs, hourlyRate, dailyHourLimit)
  
  const todaySummary = calcSummary(todayRecords)
  const weekSummary = calcSummary(weekRecords)
  const monthSummary = calcSummary(monthRecords)
  
  // 計算工作天數
  const workDays = new Set(
    monthRecords.map(r => formatDate(new Date(r.clockIn)))
  ).size
  
  return {
    dailyHours: todaySummary.totalHours,
    dailyEarnings: todaySummary.totalEarnings,
    weeklyHours: weekSummary.totalHours,
    weeklyEarnings: weekSummary.totalEarnings,
    monthlyHours: monthSummary.totalHours,
    monthlyEarnings: monthSummary.totalEarnings,
    averageHoursPerDay: workDays > 0 ? monthSummary.totalHours / workDays : 0,
    totalRecords: records.filter(r => r.clockOut).length
  }
}

// 簡單的密碼雜湊（注意：實際產品應使用更安全的方式）
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// 驗證密碼
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}

// 驗證 Email 格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 驗證密碼強度
export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

// 生成預設顏色
export function generateJobColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16'  // lime
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 防抖函數
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// 本地儲存工具
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  
  remove(key: string): void {
    localStorage.removeItem(key)
  }
}
