import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  Square,
  Calendar,
  AlertTriangle,
  ChevronRight,
  History,
  LogOut,
  Briefcase,
  Camera as CameraIcon,
  User,
  DollarSign
} from 'lucide-react'
import { Button, Card, CardContent, Modal, Camera, Input } from '@/components/ui'
import { useAuthStore, useJobStore, useTimeRecordStore } from '@/stores'
import {
  formatTime,
  formatDate,
  formatDuration,
  formatCurrency,
  calculateMinutesBetween
} from '@/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { jobs, currentJob, loadJobs, setCurrentJob, addJob } = useJobStore()
  const {
    records,
    activeRecord,
    clockStatus,
    statistics,
    loadRecords,
    clockIn,
    clockOut,
    calculateStats
  } = useTimeRecordStore()
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showOvertimeAlert, setShowOvertimeAlert] = useState(false)
  const [workingMinutes, setWorkingMinutes] = useState(0)
  const [showJobSelector, setShowJobSelector] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraAction, setCameraAction] = useState<'clockIn' | 'clockOut'>('clockIn')
  
  // 載入資料
  useEffect(() => {
    if (user) {
      loadJobs(user.id)
      loadRecords(user.id)
    }
  }, [user])
  
  // 計算統計 - 當 records 或 currentJob 變化時重新計算
  useEffect(() => {
    if (currentJob) {
      console.log('Recalculating stats, records count:', records.length, 'completed:', records.filter(r => r.clockOut).length)
      calculateStats(currentJob.hourlyRate, currentJob.dailyHourLimit)
    }
  }, [records, currentJob, calculateStats])
  
  // 更新時鐘
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      
      // 計算工作中的時間
      if (activeRecord && clockStatus === 'working') {
        const minutes = calculateMinutesBetween(
          new Date(activeRecord.clockIn),
          new Date()
        )
        setWorkingMinutes(minutes)
        
        // 檢查是否超時
        if (currentJob && minutes >= currentJob.dailyHourLimit * 60) {
          setShowOvertimeAlert(true)
        }
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [activeRecord, clockStatus, currentJob])
  
  // 計算當前薪資
  const currentEarnings = useMemo(() => {
    if (!currentJob || clockStatus !== 'working') return 0
    return (workingMinutes / 60) * currentJob.hourlyRate
  }, [workingMinutes, currentJob, clockStatus])
  
  const handleClockInClick = () => {
    setCameraAction('clockIn')
    setShowCamera(true)
  }
  
  const handleClockOutClick = () => {
    setCameraAction('clockOut')
    setShowCamera(true)
  }
  
  const handleCameraCapture = async (photo: string) => {
    setShowCamera(false)
    
    if (cameraAction === 'clockIn') {
      if (!user || !currentJob) return
      await clockIn(user.id, currentJob.id, photo)
    } else {
      await clockOut(photo)
      setWorkingMinutes(0)
      // 下班後重新載入記錄以更新統計
      if (user) {
        await loadRecords(user.id)
      }
    }
  }
  
  const handleCameraCancel = () => {
    setShowCamera(false)
  }
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  // 快速設定工作的 state
  const [quickJobName, setQuickJobName] = useState('我的工作')
  const [quickHourlyRate, setQuickHourlyRate] = useState('183')
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  
  const handleQuickCreateJob = async () => {
    if (!user || !quickHourlyRate) return
    setIsCreatingJob(true)
    try {
      await addJob({
        userId: user.id,
        name: quickJobName || '我的工作',
        hourlyRate: parseFloat(quickHourlyRate),
        dailyHourLimit: 8,
        color: '#6366f1',
        isActive: true
      })
    } finally {
      setIsCreatingJob(false)
    }
  }
  
  if (!currentJob) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                快速設定工作
              </h2>
              <p className="text-gray-600">
                輸入你的時薪即可開始打卡
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                label="工作名稱"
                placeholder="例：便利商店"
                value={quickJobName}
                onChange={e => setQuickJobName(e.target.value)}
                icon={<Briefcase className="w-5 h-5" />}
              />
              
              <Input
                label="時薪 (NT$)"
                type="number"
                placeholder="183"
                value={quickHourlyRate}
                onChange={e => setQuickHourlyRate(e.target.value)}
                icon={<DollarSign className="w-5 h-5" />}
              />
              
              <Button 
                onClick={handleQuickCreateJob} 
                className="w-full"
                isLoading={isCreatingJob}
                disabled={!quickHourlyRate}
              >
                開始使用
              </Button>
            </div>
            
            <p className="text-xs text-gray-400 text-center mt-4">
              2025 年基本工資為 NT$183/小時
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 使用者頭像 */}
            <button
              onClick={() => navigate('/settings')}
              className="relative"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="頭像"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-500" />
                </div>
              )}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {user?.username || '工時計算器'}
              </h1>
              <button
                onClick={() => setShowJobSelector(true)}
                className="text-sm text-primary-500 flex items-center"
              >
                {currentJob.name}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/schedule')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="排班日曆"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/history')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="歷史紀錄"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 當前時間 */}
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-gray-500">{formatDate(currentTime)}</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">
              {formatTime(currentTime)}
            </p>
          </CardContent>
        </Card>
        
        {/* 打卡按鈕 */}
        <Card>
          <CardContent className="py-8">
            {clockStatus === 'idle' ? (
              <div className="text-center">
                <Button
                  onClick={handleClockInClick}
                  size="lg"
                  className="w-32 h-32 rounded-full text-xl"
                >
                  <div className="flex flex-col items-center">
                    <Play className="w-8 h-8 mb-2" />
                    上班打卡
                  </div>
                </Button>
                <p className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-1">
                  <CameraIcon className="w-4 h-4" />
                  點擊拍照打卡
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">已工作</p>
                  <p className="text-3xl font-bold text-primary-500">
                    {formatDuration(workingMinutes)}
                  </p>
                  <p className="text-lg text-green-500 font-semibold mt-1">
                    {formatCurrency(currentEarnings)}
                  </p>
                </div>
                <Button
                  onClick={handleClockOutClick}
                  variant="danger"
                  size="lg"
                  className="w-32 h-32 rounded-full text-xl"
                >
                  <div className="flex flex-col items-center">
                    <Square className="w-8 h-8 mb-2" />
                    下班打卡
                  </div>
                </Button>
                {activeRecord && (
                  <p className="mt-4 text-sm text-gray-500">
                    上班時間：{formatTime(new Date(activeRecord.clockIn))}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 今日工時統計 - 顯示當前工作中的時間，下班後歸零 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">今日</h3>
              <button
                onClick={() => navigate('/history')}
                className="text-sm text-primary-500 flex items-center gap-1"
              >
                歷史紀錄
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">工時</p>
                <p className="text-xl font-semibold text-gray-900">
                  {clockStatus === 'working' 
                    ? formatDuration(workingMinutes)
                    : '0 分鐘'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">薪資</p>
                <p className="text-xl font-semibold text-green-500">
                  {clockStatus === 'working'
                    ? formatCurrency(currentEarnings)
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 週 / 月累計統計（來自歷史紀錄） */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">本週累計</h3>
              <p className="text-lg font-semibold text-gray-900">
                {(statistics?.weeklyHours ?? 0).toFixed(1)} 小時
              </p>
              <p className="text-sm text-green-500 font-medium">
                {formatCurrency(statistics?.weeklyEarnings ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">本月累計</h3>
              <p className="text-lg font-semibold text-gray-900">
                {(statistics?.monthlyHours ?? 0).toFixed(1)} 小時
              </p>
              <p className="text-sm text-green-500 font-medium">
                {formatCurrency(statistics?.monthlyEarnings ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* 廣告區域 (免費版) */}
        {!user?.isPremium && (
          <Card className="bg-gray-100">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-gray-500">廣告區域</p>
              <p className="text-xs text-gray-400 mt-1">
                升級 Premium 移除廣告
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* 超時提醒 Modal */}
      <Modal
        isOpen={showOvertimeAlert}
        onClose={() => setShowOvertimeAlert(false)}
        title="工時超時提醒"
      >
        <div className="text-center py-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">
            您今日的工時已超過設定的上限
            <span className="font-semibold">
              （{currentJob.dailyHourLimit} 小時）
            </span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            請注意休息，避免過度勞累
          </p>
          <Button onClick={() => setShowOvertimeAlert(false)}>
            我知道了
          </Button>
        </div>
      </Modal>
      
      {/* 工作選擇器 Modal */}
      <Modal
        isOpen={showJobSelector}
        onClose={() => setShowJobSelector(false)}
        title="選擇工作"
      >
        <div className="space-y-2">
          {jobs.filter(j => j.isActive).map(job => (
            <button
              key={job.id}
              onClick={() => {
                setCurrentJob(job)
                setShowJobSelector(false)
              }}
              className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                currentJob.id === job.id
                  ? 'bg-primary-50 border-2 border-primary-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: job.color }}
                />
                <div>
                  <p className="font-medium text-gray-900">{job.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(job.hourlyRate)}/小時
                  </p>
                </div>
              </div>
              {currentJob.id === job.id && (
                <div className="text-primary-500">✓</div>
              )}
            </button>
          ))}
          
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              setShowJobSelector(false)
              navigate('/settings')
            }}
          >
            管理工作
          </Button>
        </div>
      </Modal>
      
      {/* 相機拍照 */}
      {showCamera && (
        <Camera
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
        />
      )}
    </div>
  )
}
