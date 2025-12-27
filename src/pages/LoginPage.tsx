import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { useAuthStore } from '@/stores'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const validate = () => {
    const errors: Record<string, string> = {}
    if (!email.trim()) errors.email = '請輸入 Email'
    if (!password) errors.password = '請輸入密碼'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validate()) return
    
    const success = await login(email.trim(), password)
    if (success) {
      navigate('/dashboard')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">工時計算器</h1>
          <p className="text-gray-600 mt-2">守護你的每一分薪水</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="請輸入密碼"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={formErrors.password}
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
                登入
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                還沒有帳號？{' '}
                <Link
                  to="/register"
                  className="text-primary-500 font-medium hover:text-primary-600"
                >
                  立即註冊
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
