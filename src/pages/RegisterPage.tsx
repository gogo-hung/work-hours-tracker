import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Mail, UserPlus, Camera as CameraIcon, Users, Briefcase } from 'lucide-react'
import { Button, Input, Card, CardContent, Camera } from '@/components/ui'
import { useAuthStore } from '@/stores'
import { isValidEmail, isValidPassword } from '@/utils'
import type { UserRole } from '@/types'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole>('employee')
  const [showCamera, setShowCamera] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const validate = () => {
    const errors: Record<string, string> = {}
    
    if (!username.trim()) {
      errors.username = '請輸入用戶名'
    } else if (username.trim().length < 3) {
      errors.username = '用戶名至少需要 3 個字元'
    }
    
    if (!email.trim()) {
      errors.email = '請輸入 Email'
    } else if (!isValidEmail(email)) {
      errors.email = '請輸入有效的 Email'
    }
    
    if (!password) {
      errors.password = '請輸入密碼'
    } else if (!isValidPassword(password)) {
      errors.password = '密碼至少需要 6 個字元'
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = '兩次輸入的密碼不一致'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validate()) return
    
    const success = await register(username.trim(), email.trim(), password, role, avatar || undefined)
    if (success) {
      navigate('/setup')
    }
  }
  
  const handleAvatarCapture = (photo: string) => {
    setAvatar(photo)
    setShowCamera(false)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">建立帳號</h1>
          <p className="text-gray-600 mt-2">開始管理你的工時與薪資</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 頭像設定 */}
              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="relative group"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="頭像"
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <CameraIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <CameraIcon className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mb-4">
                點擊設定頭像（選填）
              </p>
              
              {/* 角色選擇 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇身份
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      role === 'employee'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Briefcase className={`w-6 h-6 mx-auto mb-2 ${
                      role === 'employee' ? 'text-primary-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      role === 'employee' ? 'text-primary-700' : 'text-gray-600'
                    }`}>員工</p>
                    <p className="text-xs text-gray-500 mt-1">記錄工時打卡</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      role === 'manager'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`w-6 h-6 mx-auto mb-2 ${
                      role === 'manager' ? 'text-primary-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      role === 'manager' ? 'text-primary-700' : 'text-gray-600'
                    }`}>主管</p>
                    <p className="text-xs text-gray-500 mt-1">管理員工排班</p>
                  </button>
                </div>
              </div>
              
              <Input
                label="用戶名"
                placeholder="請輸入用戶名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                error={formErrors.username}
                icon={<User className="w-5 h-5" />}
              />
              
              <Input
                label="Email"
                type="email"
                placeholder="請輸入 Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={formErrors.email}
                icon={<Mail className="w-5 h-5" />}
              />
              
              <Input
                label="密碼"
                type="password"
                placeholder="請輸入密碼（至少 6 位）"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={formErrors.password}
                icon={<Lock className="w-5 h-5" />}
              />
              
              <Input
                label="確認密碼"
                type="password"
                placeholder="請再次輸入密碼"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={formErrors.confirmPassword}
                icon={<Lock className="w-5 h-5" />}
              />
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                註冊
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                已經有帳號？{' '}
                <Link
                  to="/login"
                  className="text-primary-500 font-medium hover:text-primary-600"
                >
                  立即登入
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 相機拍照 */}
      {showCamera && (
        <Camera
          onCapture={handleAvatarCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
