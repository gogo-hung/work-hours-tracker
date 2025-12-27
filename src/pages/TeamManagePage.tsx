import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Users, 
  Calendar,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from 'lucide-react'
import { Card, CardContent, Modal } from '@/components/ui'
import { useAuthStore } from '@/stores'
import { formatDate, formatTime, formatDuration, calculateMinutesBetween } from '@/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface MemberRecord {
  id: string
  userId: string
  jobId: string
  clockIn: string
  clockInPhoto?: string
  clockOut?: string
  clockOutPhoto?: string
  date: string
}

interface MemberWithRecords {
  member: TeamMember
  records: MemberRecord[]
  todayMinutes: number
  weekMinutes: number
  monthMinutes: number
}

// 在生產環境使用相對路徑，開發環境使用 localhost
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

export default function TeamManagePage() {
  const navigate = useNavigate()
  const { user, team } = useAuthStore()
  
  const [members, setMembers] = useState<MemberWithRecords[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // 檢查是否為主管
  useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // 載入團隊成員和記錄
  useEffect(() => {
    const loadTeamData = async () => {
      if (!team?.id) {
        setLoading(false)
        return
      }

      try {
        // 獲取團隊成員
        const membersRes = await fetch(`${API_BASE}/teams/${team.id}/members`)
        const membersData = await membersRes.json()

        // 獲取每個成員的記錄
        const membersWithRecords: MemberWithRecords[] = await Promise.all(
          membersData.map(async (member: TeamMember) => {
            const recordsRes = await fetch(`${API_BASE}/records/user/${member.id}`)
            const records: MemberRecord[] = await recordsRes.json()

            // 計算時間範圍
            const now = new Date()
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const weekStart = new Date(todayStart)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // 週一
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

            // 計算各時段工時
            let todayMinutes = 0
            let weekMinutes = 0
            let monthMinutes = 0

            records.forEach(record => {
              if (!record.clockOut) return
              
              const clockIn = new Date(record.clockIn)
              const clockOut = new Date(record.clockOut)
              const minutes = calculateMinutesBetween(clockIn, clockOut)

              if (clockIn >= todayStart) {
                todayMinutes += minutes
              }
              if (clockIn >= weekStart) {
                weekMinutes += minutes
              }
              if (clockIn >= monthStart) {
                monthMinutes += minutes
              }
            })

            return {
              member,
              records: records.sort((a, b) => 
                new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
              ),
              todayMinutes,
              weekMinutes,
              monthMinutes
            }
          })
        )

        setMembers(membersWithRecords)
      } catch (error) {
        console.error('載入團隊資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeamData()
  }, [team])

  // 篩選當月記錄
  const getMonthRecords = (records: MemberRecord[]) => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    
    return records.filter(record => {
      const date = new Date(record.clockIn)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }

  const handlePrevMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  if (user?.role !== 'manager') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">團隊管理</h1>
            <p className="text-sm text-gray-500">{team?.name || '我的團隊'}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">載入中...</p>
          </div>
        ) : !team ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">您還沒有建立團隊</p>
              <button
                onClick={() => navigate('/settings')}
                className="text-primary-500 font-medium"
              >
                前往設定建立團隊
              </button>
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">團隊還沒有成員</p>
              <p className="text-sm text-gray-400 mt-2">
                邀請碼: <span className="font-mono font-medium">{team.inviteCode}</span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 月份選擇器 */}
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {selectedMonth.getFullYear()} 年 {selectedMonth.getMonth() + 1} 月
                    </span>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronDown className="w-5 h-5 -rotate-90" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* 團隊總覽 */}
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">團隊總覽</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                    <p className="text-xs text-gray-500">成員數</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-500">
                      {(members.reduce((sum, m) => sum + m.todayMinutes, 0) / 60).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">今日總工時</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {(members.reduce((sum, m) => sum + m.monthMinutes, 0) / 60).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">本月總工時</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 成員列表 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 px-1">成員詳情</h3>
              
              {members.map(({ member, records, todayMinutes, weekMinutes, monthMinutes }) => {
                const isExpanded = expandedMember === member.id
                const monthRecords = getMonthRecords(records)
                
                return (
                  <Card key={member.id}>
                    <CardContent className="py-3">
                      {/* 成員摘要 */}
                      <button
                        onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                        className="w-full"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDuration(todayMinutes)}
                              </p>
                              <p className="text-xs text-gray-500">今日</p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* 工時摘要 */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              {formatDuration(todayMinutes)}
                            </p>
                            <p className="text-xs text-gray-400">今日</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              {formatDuration(weekMinutes)}
                            </p>
                            <p className="text-xs text-gray-400">本週</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              {formatDuration(monthMinutes)}
                            </p>
                            <p className="text-xs text-gray-400">本月</p>
                          </div>
                        </div>
                      </button>
                      
                      {/* 展開的打卡記錄 */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-600 mb-3">
                            {selectedMonth.getMonth() + 1} 月打卡記錄
                          </h4>
                          
                          {monthRecords.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                              這個月沒有打卡記錄
                            </p>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {monthRecords.map(record => {
                                const clockIn = new Date(record.clockIn)
                                const clockOut = record.clockOut ? new Date(record.clockOut) : null
                                const minutes = clockOut 
                                  ? calculateMinutesBetween(clockIn, clockOut)
                                  : 0
                                
                                return (
                                  <div
                                    key={record.id}
                                    className="bg-gray-50 rounded-lg p-3"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatDate(clockIn)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatTime(clockIn)} - {clockOut ? formatTime(clockOut) : '工作中...'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-primary-600">
                                          {clockOut ? formatDuration(minutes) : '--'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* 打卡照片 */}
                                    <div className="flex gap-2 mt-2">
                                      {record.clockInPhoto && (
                                        <button
                                          onClick={() => setSelectedPhoto(record.clockInPhoto!)}
                                          className="relative group"
                                        >
                                          <img
                                            src={record.clockInPhoto}
                                            alt="上班打卡"
                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                            <ImageIcon className="w-5 h-5 text-white" />
                                          </div>
                                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded">
                                            上班
                                          </span>
                                        </button>
                                      )}
                                      {record.clockOutPhoto && (
                                        <button
                                          onClick={() => setSelectedPhoto(record.clockOutPhoto!)}
                                          className="relative group"
                                        >
                                          <img
                                            src={record.clockOutPhoto}
                                            alt="下班打卡"
                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                            <ImageIcon className="w-5 h-5 text-white" />
                                          </div>
                                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded">
                                            下班
                                          </span>
                                        </button>
                                      )}
                                      {!record.clockInPhoto && !record.clockOutPhoto && (
                                        <p className="text-xs text-gray-400">無照片</p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* 照片預覽 Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="打卡照片"
      >
        <div className="relative">
          <img
            src={selectedPhoto || ''}
            alt="打卡照片"
            className="w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </Modal>
    </div>
  )
}
