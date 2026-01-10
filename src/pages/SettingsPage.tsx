import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Crown,
  FileSpreadsheet,
  BellOff,
  Camera as CameraIcon,
  User,
  Image,
  Users,
  Copy,
  Check,
  LogOut as LeaveIcon
} from 'lucide-react'
import { Button, Card, CardContent, Modal, Input, Camera } from '@/components/ui'
import { useAuthStore, useJobStore } from '@/stores'
import { formatCurrency, generateJobColor } from '@/utils'
import type { Job } from '@/types'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, team, logout, updateAvatar, createTeam, joinTeam, leaveTeam, isLoading: authLoading } = useAuthStore()
  const { jobs, addJob, updateJob, deleteJob, isLoading } = useJobStore()
  
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [showAvatarCamera, setShowAvatarCamera] = useState(false)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  
  // 群組相關
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [teamError, setTeamError] = useState('')
  
  const [jobName, setJobName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [dailyHourLimit, setDailyHourLimit] = useState('8')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const activeJobs = jobs.filter(j => j.isActive)
  const canAddJob = user?.isPremium || activeJobs.length < 1
  const isManager = user?.role === 'manager'
  
  const resetForm = () => {
    setJobName('')
    setHourlyRate('')
    setDailyHourLimit('8')
    setFormErrors({})
    setEditingJob(null)
  }
  
  const resetTeamForm = () => {
    setTeamName('')
    setTeamDescription('')
    setInviteCode('')
    setTeamError('')
  }
  
  // 複製邀請碼
  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  // 建立群組
  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setTeamError('請輸入群組名稱')
      return
    }
    
    const success = await createTeam(teamName.trim())
    if (success) {
      setShowTeamModal(false)
      resetTeamForm()
    }
  }
  
  // 加入群組
  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      setTeamError('請輸入邀請碼')
      return
    }
    
    const success = await joinTeam(inviteCode.trim())
    if (success) {
      setShowJoinModal(false)
      resetTeamForm()
    } else {
      setTeamError('邀請碼無效或找不到群組')
    }
  }
  
  // 離開群組
  const handleLeaveTeam = async () => {
    await leaveTeam()
  }
  
  const openAddModal = () => {
    if (!canAddJob) {
      // 顯示升級提示
      return
    }
    resetForm()
    setShowJobModal(true)
  }
  
  const openEditModal = (job: Job) => {
    setEditingJob(job)
    setJobName(job.name)
    setHourlyRate(job.hourlyRate.toString())
    setDailyHourLimit(job.dailyHourLimit.toString())
    setShowJobModal(true)
  }
  
  const validate = () => {
    const errors: Record<string, string> = {}
    
    if (!jobName.trim()) {
      errors.jobName = '請輸入工作名稱'
    }
    
    const rate = parseFloat(hourlyRate)
    if (!hourlyRate || isNaN(rate) || rate <= 0) {
      errors.hourlyRate = '請輸入有效的時薪'
    }
    
    const limit = parseFloat(dailyHourLimit)
    if (!dailyHourLimit || isNaN(limit) || limit <= 0 || limit > 24) {
      errors.dailyHourLimit = '請輸入有效的工時上限（1-24 小時）'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSaveJob = async () => {
    if (!validate() || !user) return
    
    if (editingJob) {
      await updateJob(editingJob.id, {
        name: jobName.trim(),
        hourlyRate: parseFloat(hourlyRate),
        dailyHourLimit: parseFloat(dailyHourLimit)
      })
    } else {
      await addJob({
        userId: user.id,
        name: jobName.trim(),
        hourlyRate: parseFloat(hourlyRate),
        dailyHourLimit: parseFloat(dailyHourLimit),
        color: generateJobColor(),
        isActive: true
      })
    }
    
    setShowJobModal(false)
    resetForm()
  }
  
  const handleDeleteJob = async () => {
    if (!deletingJobId) return
    await deleteJob(deletingJobId)
    setShowDeleteConfirm(false)
    setDeletingJobId(null)
  }
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">設定</h1>
        </div>
      </header>
      
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 群組管理 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                <Users className="w-5 h-5 inline-block mr-2 text-primary-500" />
                {isManager ? '我的群組' : '所屬群組'}
              </h2>
            </div>
            
            {team ? (
              <div className="space-y-3">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="font-semibold text-primary-900 text-lg">{team.name}</p>
                  {team.description && (
                    <p className="text-sm text-primary-700 mt-1">{team.description}</p>
                  )}
                </div>
                
                {isManager && (
                  <>
                    {/* 團隊管理入口 */}
                    <Button
                      className="w-full"
                      onClick={() => navigate('/team')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      查看員工工時與打卡記錄
                    </Button>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">邀請碼（分享給員工加入）</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xl font-mono font-bold text-primary-600 tracking-widest">
                          {team.inviteCode}
                        </code>
                        <button
                          onClick={copyInviteCode}
                          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {!isManager && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLeaveTeam}
                  >
                    <LeaveIcon className="w-4 h-4 mr-2" />
                    離開群組
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  {isManager ? '您尚未建立群組' : '您尚未加入任何群組'}
                </p>
                {isManager ? (
                  <Button onClick={() => setShowTeamModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    建立群組
                  </Button>
                ) : (
                  <Button onClick={() => setShowJoinModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    加入群組
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 工作管理 - 僅限 Premium 會員 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                <Briefcase className="w-5 h-5 inline-block mr-2 text-primary-500" />
                我的工作
              </h2>
              {user?.isPremium && (
                <Button size="sm" onClick={openAddModal} disabled={!canAddJob}>
                  <Plus className="w-4 h-4 mr-1" />
                  新增
                </Button>
              )}
            </div>
            
            {!user?.isPremium ? (
              <div className="text-center py-6">
                <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-2">Premium 專屬功能</p>
                <p className="text-sm text-gray-500 mb-4">
                  升級 Premium 會員即可新增和管理多份工作
                </p>
                <Button variant="outline" className="border-amber-400 text-amber-600 hover:bg-amber-50">
                  <Crown className="w-4 h-4 mr-2" />
                  升級 Premium
                </Button>
              </div>
            ) : (
              <>
                {!canAddJob && (
                  <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-sm rounded-lg flex items-start gap-2">
                    <Crown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>已達工作數量上限</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  {activeJobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-10 rounded-full"
                          style={{ backgroundColor: job.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{job.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(job.hourlyRate)}/小時 · 上限 {job.dailyHourLimit} 小時
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingJobId(job.id)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {activeJobs.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      尚未新增任何工作
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Premium 功能 */}
        <Card>
          <CardContent className="py-4">
            <h2 className="font-semibold text-gray-900 mb-4">Premium 功能</h2>
            
            <div className="space-y-3">
              <button
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => {/* TODO: 實作匯出功能 */}}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">匯出資料</p>
                    <p className="text-sm text-gray-500">Excel / PDF 格式</p>
                  </div>
                </div>
                {!user?.isPremium && (
                  <Crown className="w-5 h-5 text-amber-500" />
                )}
              </button>
              
              <button
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => {/* TODO: 實作移除廣告 */}}
              >
                <div className="flex items-center gap-3">
                  <BellOff className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">移除廣告</p>
                    <p className="text-sm text-gray-500">享受無廣告體驗</p>
                  </div>
                </div>
                {!user?.isPremium && (
                  <Crown className="w-5 h-5 text-amber-500" />
                )}
              </button>
            </div>
            
            {!user?.isPremium && (
              <Button className="w-full mt-4" variant="outline">
                <Crown className="w-4 h-4 mr-2 text-amber-500" />
                升級 Premium
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* 帳號 */}
        <Card>
          <CardContent className="py-4">
            <h2 className="font-semibold text-gray-900 mb-4">帳號</h2>
            
            {/* 頭像 */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowAvatarOptions(true)}
                className="relative group"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="頭像"
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                  <CameraIcon className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mb-4">點擊更換頭像</p>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">用戶名</p>
                <p className="font-medium text-gray-900">{user?.username}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">身份</p>
                <p className="font-medium text-gray-900">
                  {user?.role === 'manager' ? '👔 主管' : '👷 員工'}
                </p>
              </div>
            </div>
            
            <Button
              variant="danger"
              className="w-full mt-4"
              onClick={handleLogout}
            >
              登出
            </Button>
          </CardContent>
        </Card>
        
        {/* 版本資訊 */}
        <p className="text-center text-sm text-gray-400 py-4">
          工時計算器 v1.0.0
        </p>
      </main>
      
      {/* 新增/編輯工作 Modal */}
      <Modal
        isOpen={showJobModal}
        onClose={() => {
          setShowJobModal(false)
          resetForm()
        }}
        title={editingJob ? '編輯工作' : '新增工作'}
      >
        <div className="space-y-4">
          <Input
            label="工作名稱"
            placeholder="例如：7-11 大安店"
            value={jobName}
            onChange={e => setJobName(e.target.value)}
            error={formErrors.jobName}
            icon={<Briefcase className="w-5 h-5" />}
          />
          
          <Input
            label="時薪 (NT$)"
            type="number"
            placeholder="例如：183"
            value={hourlyRate}
            onChange={e => setHourlyRate(e.target.value)}
            error={formErrors.hourlyRate}
            icon={<DollarSign className="w-5 h-5" />}
            min="0"
            step="1"
          />
          
          <Input
            label="每日工時上限 (小時)"
            type="number"
            placeholder="例如：8"
            value={dailyHourLimit}
            onChange={e => setDailyHourLimit(e.target.value)}
            error={formErrors.dailyHourLimit}
            icon={<Clock className="w-5 h-5" />}
            min="1"
            max="24"
            step="0.5"
          />
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowJobModal(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveJob}
              isLoading={isLoading}
            >
              儲存
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 刪除確認 Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="確認刪除"
      >
        <div className="text-center py-4">
          <p className="text-gray-700 mb-2">確定要刪除這份工作嗎？</p>
          <p className="text-sm text-gray-500 mb-6">
            相關的打卡紀錄將會保留
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteJob}
            >
              刪除
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 頭像選項 Modal */}
      <Modal
        isOpen={showAvatarOptions}
        onClose={() => setShowAvatarOptions(false)}
        title="更換頭像"
      >
        <div className="space-y-3">
          <button
            className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowAvatarOptions(false)
              setShowAvatarCamera(true)
            }}
          >
            <CameraIcon className="w-6 h-6 text-primary-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">拍攝照片</p>
              <p className="text-sm text-gray-500">使用相機拍攝新頭像</p>
            </div>
          </button>
          
          <label className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <Image className="w-6 h-6 text-primary-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">從相簿選擇</p>
              <p className="text-sm text-gray-500">選擇喜歡的照片作為頭像</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const result = event.target?.result as string
                    if (result) {
                      updateAvatar(result)
                      setShowAvatarOptions(false)
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
          </label>
          
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={() => setShowAvatarOptions(false)}
          >
            取消
          </Button>
        </div>
      </Modal>
      
      {/* 頭像相機 */}
      {showAvatarCamera && (
        <Camera
          onCapture={(photo) => {
            updateAvatar(photo)
            setShowAvatarCamera(false)
          }}
          onCancel={() => setShowAvatarCamera(false)}
        />
      )}
      
      {/* 建立群組 Modal（主管用） */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => {
          setShowTeamModal(false)
          resetTeamForm()
        }}
        title="建立群組"
      >
        <div className="space-y-4">
          <Input
            label="群組名稱"
            placeholder="例如：7-11 大安店"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            icon={<Users className="w-5 h-5" />}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述（選填）
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
              placeholder="簡單描述這個群組..."
              rows={3}
              value={teamDescription}
              onChange={e => setTeamDescription(e.target.value)}
            />
          </div>
          
          {teamError && (
            <p className="text-sm text-red-500">{teamError}</p>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowTeamModal(false)
                resetTeamForm()
              }}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateTeam}
              isLoading={authLoading}
            >
              建立
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 加入群組 Modal（員工用） */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false)
          resetTeamForm()
        }}
        title="加入群組"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            請輸入主管提供的 6 位數邀請碼
          </p>
          
          <Input
            label="邀請碼"
            placeholder="例如：ABC123"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
          />
          
          {teamError && (
            <p className="text-sm text-red-500">{teamError}</p>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowJoinModal(false)
                resetTeamForm()
              }}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleJoinTeam}
              isLoading={authLoading}
              disabled={inviteCode.length !== 6}
            >
              加入
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
