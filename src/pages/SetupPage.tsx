import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, DollarSign, Clock, ArrowRight } from 'lucide-react'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { useAuthStore, useJobStore } from '@/stores'
import { generateJobColor } from '@/utils'

export function SetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addJob, isLoading } = useJobStore()
  
  const [jobName, setJobName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [dailyHourLimit, setDailyHourLimit] = useState('8')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate() || !user) return
    
    await addJob({
      userId: user.id,
      name: jobName.trim(),
      hourlyRate: parseFloat(hourlyRate),
      dailyHourLimit: parseFloat(dailyHourLimit),
      color: generateJobColor(),
      isActive: true
    })
    
    navigate('/dashboard')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">設定你的工作</h1>
          <p className="text-gray-600 mt-2">填寫基本資料，開始記錄工時</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  開始使用
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </form>
            
            <p className="mt-4 text-sm text-gray-500 text-center">
              之後可以在設定中修改或新增更多工作
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
