import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  Edit2,
  Users,
  User as UserIcon,
  RefreshCw
} from 'lucide-react'
import { Button, Card, CardContent, Modal, Input } from '@/components/ui'
import { useAuthStore, useJobStore, useScheduleStore, useEmployeeStore } from '@/stores'
import type { Schedule, User } from '@/types'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export function SchedulePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, currentJob, loadJobs } = useJobStore()
  const { schedules, loadMonthSchedules, addSchedule, updateSchedule, deleteSchedule, isLoading } = useScheduleStore()
  const { employees, loadEmployees } = useEmployeeStore()
  
  const isManager = user?.role === 'manager'
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  
  // 主管選擇的員工
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null)
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false)
  
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [note, setNote] = useState('')
  
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  // 當前查看的用戶 ID（主管可選擇員工，員工只能看自己）
  const viewingUserId = isManager && selectedEmployee ? selectedEmployee.id : user?.id
  
  // 重新載入員工列表
  const refreshEmployees = () => {
    if (user && isManager && user.teamId) {
      loadEmployees(user.teamId)
    }
  }
  
  // 載入資料 - 每次進入頁面都重新載入
  useEffect(() => {
    if (user) {
      loadJobs(user.id)
      if (isManager && user.teamId) {
        // 主管載入群組內的員工
        loadEmployees(user.teamId)
      }
    }
  }, [user?.id, user?.teamId, isManager])
  
  // 載入排班資料
  useEffect(() => {
    if (viewingUserId) {
      loadMonthSchedules(viewingUserId, currentYear, currentMonth + 1)
    }
  }, [viewingUserId, currentYear, currentMonth])
  
  // 取得當月的日曆資料
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startingDay = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    const days: Array<{ date: Date | null; day: number | null; isToday: boolean; dateStr: string }> = []
    
    // 填充前面的空白
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: null, day: null, isToday: false, dateStr: '' })
    }
    
    // 填充日期
    const today = new Date()
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const isToday = today.getFullYear() === currentYear &&
                      today.getMonth() === currentMonth &&
                      today.getDate() === i
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({ date, day: i, isToday, dateStr })
    }
    
    return days
  }, [currentYear, currentMonth])
  
  // 取得某日的排班
  const getSchedulesForDate = (dateStr: string) => {
    return schedules.filter(s => s.date === dateStr)
  }
  
  // 上個月
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }
  
  // 下個月
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  // 回到今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  // 點擊日期
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setShowAddModal(true)
    resetForm()
  }
  
  // 重置表單
  const resetForm = () => {
    setStartTime('09:00')
    setEndTime('18:00')
    setNote('')
    setEditingSchedule(null)
  }
  
  // 編輯排班
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setStartTime(schedule.startTime)
    setEndTime(schedule.endTime)
    setNote(schedule.note || '')
    setSelectedDate(schedule.date)
    setShowAddModal(true)
  }
  
  // 儲存排班
  const handleSaveSchedule = async () => {
    if (!viewingUserId || !currentJob || !selectedDate) return
    
    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, {
        startTime,
        endTime,
        note: note.trim() || undefined
      })
    } else {
      await addSchedule({
        userId: viewingUserId,
        jobId: currentJob.id,
        date: selectedDate,
        startTime,
        endTime,
        note: note.trim() || undefined
      })
    }
    
    setShowAddModal(false)
    resetForm()
  }
  
  // 刪除排班
  const handleDeleteSchedule = async (id: string) => {
    await deleteSchedule(id)
  }
  
  // 計算預計工時
  const calculateHours = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const diff = endMinutes - startMinutes
    if (diff <= 0) return 0
    return (diff / 60).toFixed(1)
  }
  
  // 選中日期的排班列表
  const selectedDateSchedules = selectedDate ? getSchedulesForDate(selectedDate) : []
  
  // 取得工作名稱
  const getJobName = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    return job?.name || '未知工作'
  }
  
  // 取得工作顏色
  const getJobColor = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    return job?.color || '#6366f1'
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isManager ? '員工排班管理' : '排班日曆'}
            </h1>
          </div>
          <Button size="sm" variant="secondary" onClick={goToToday}>
            今天
          </Button>
        </div>
      </header>
      
      <main className="p-4 max-w-lg mx-auto">
        {/* 主管沒有群組時顯示提示 */}
        {isManager && !user?.teamId && (
          <Card className="mb-4">
            <CardContent className="py-6 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">請先建立群組</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">建立群組後才能管理員工排班</p>
              <Button onClick={() => navigate('/settings')}>
                前往設定
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* 主管：員工選擇器 */}
        {isManager && user?.teamId && (
          <Card className="mb-4">
            <CardContent className="py-3">
              <button
                onClick={() => {
                  refreshEmployees() // 打開時自動刷新
                  setShowEmployeeSelector(true)
                }}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {selectedEmployee?.avatar ? (
                    <img
                      src={selectedEmployee.avatar}
                      alt={selectedEmployee.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary-500" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {selectedEmployee ? selectedEmployee.username : '選擇員工'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedEmployee ? selectedEmployee.email : '點擊選擇要排班的員工'}
                    </p>
                  </div>
                </div>
                <Users className="w-5 h-5 text-gray-400" />
              </button>
            </CardContent>
          </Card>
        )}
        
        {/* 月份切換 */}
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentYear} 年 {MONTHS[currentMonth]}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* 日曆 */}
        <Card className="mb-4">
          <CardContent className="p-2">
            {/* 星期標題 */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* 日期格子 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, index) => {
                const daySchedules = item.dateStr ? getSchedulesForDate(item.dateStr) : []
                const hasSchedule = daySchedules.length > 0
                
                return (
                  <button
                    key={index}
                    disabled={!item.day || (isManager && !selectedEmployee)}
                    onClick={() => item.dateStr && handleDateClick(item.dateStr)}
                    className={`
                      aspect-square p-1 rounded-lg text-sm relative transition-colors
                      ${!item.day ? 'invisible' : ''}
                      ${item.day && (!isManager || selectedEmployee) ? 'hover:bg-gray-100' : ''}
                      ${item.isToday ? 'bg-primary-100 text-primary-600 font-semibold' : 'text-gray-700'}
                      ${isManager && !selectedEmployee && item.day ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="block">{item.day}</span>
                    {hasSchedule && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {daySchedules.slice(0, 3).map((s, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getJobColor(s.jobId) }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* 提示主管選擇員工 */}
        {isManager && user?.teamId && !selectedEmployee && (
          <Card className="mb-4">
            <CardContent className="py-6 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">請先選擇一位員工</p>
              <p className="text-sm text-gray-400 mt-1">才能查看或安排班表</p>
            </CardContent>
          </Card>
        )}
        
        {/* 本月排班統計 */}
        {((!isManager) || (isManager && user?.teamId && selectedEmployee)) && (
          <Card>
            <CardContent className="py-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {isManager && selectedEmployee ? `${selectedEmployee.username} 的本月排班` : '本月排班'}
              </h3>
              
              {schedules.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  本月尚無排班
                </p>
              ) : (
                <div className="space-y-2">
                  {schedules
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(schedule => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-10 rounded-full"
                            style={{ backgroundColor: getJobColor(schedule.jobId) }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {schedule.date.split('-').slice(1).join('/')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {schedule.startTime} - {schedule.endTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              {schedules.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">本月總排班</span>
                    <span className="font-medium text-gray-900">{schedules.length} 天</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">預計工時</span>
                    <span className="font-medium text-gray-900">
                      {schedules.reduce((acc, s) => acc + Number(calculateHours(s.startTime, s.endTime)), 0).toFixed(1)} 小時
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* 員工選擇 Modal */}
      <Modal
        isOpen={showEmployeeSelector}
        onClose={() => setShowEmployeeSelector(false)}
        title="選擇員工"
      >
        <div className="space-y-2">
          {/* 刷新按鈕 */}
          <div className="flex justify-end mb-2">
            <button
              onClick={refreshEmployees}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新列表
            </button>
          </div>
          
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">尚無員工加入群組</p>
              <p className="text-sm text-gray-400 mt-1">請將邀請碼分享給員工</p>
              <button
                onClick={refreshEmployees}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新載入
              </button>
            </div>
          ) : (
            employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => {
                  setSelectedEmployee(emp)
                  setShowEmployeeSelector(false)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedEmployee?.id === emp.id
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                {emp.avatar ? (
                  <img
                    src={emp.avatar}
                    alt={emp.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">{emp.username}</p>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                </div>
                {selectedEmployee?.id === emp.id && (
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </Modal>
      
      {/* 新增/編輯排班 Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title={editingSchedule ? '編輯排班' : `新增排班 - ${selectedDate?.split('-').slice(1).join('/')}`}
      >
        <div className="space-y-4">
          {/* 顯示正在為哪位員工排班 */}
          {isManager && selectedEmployee && (
            <div className="p-3 bg-primary-50 rounded-lg flex items-center gap-3">
              {selectedEmployee.avatar ? (
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary-500" />
                </div>
              )}
              <div>
                <p className="text-sm text-primary-600">為此員工安排班表</p>
                <p className="font-medium text-primary-700">{selectedEmployee.username}</p>
              </div>
            </div>
          )}
          
          {/* 已有的排班 */}
          {!editingSchedule && selectedDateSchedules.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">當日已有排班：</p>
              {selectedDateSchedules.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-600">
                    {getJobName(s.jobId)}: {s.startTime} - {s.endTime}
                  </span>
                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="上班時間"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              icon={<Clock className="w-5 h-5" />}
            />
            <Input
              label="下班時間"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              icon={<Clock className="w-5 h-5" />}
            />
          </div>
          
          {startTime && endTime && (
            <p className="text-sm text-gray-500 text-center">
              預計工時：{calculateHours(startTime, endTime)} 小時
            </p>
          )}
          
          <Input
            label="備註（選填）"
            placeholder="例如：加班、調班..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveSchedule}
              isLoading={isLoading}
              disabled={!currentJob}
            >
              <Plus className="w-4 h-4 mr-1" />
              {editingSchedule ? '更新' : '新增'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
