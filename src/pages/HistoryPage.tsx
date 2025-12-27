import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Image,
  X
} from 'lucide-react'
import { Button, Card, CardContent, Modal, Input } from '@/components/ui'
import { useJobStore, useTimeRecordStore } from '@/stores'
import {
  formatTime,
  formatDate,
  formatDuration,
  formatCurrency,
  calculateRecordMinutes,
  calculateRecordEarnings
} from '@/utils'
import type { TimeRecord } from '@/types'

export function HistoryPage() {
  const navigate = useNavigate()
  const { currentJob, jobs } = useJobStore()
  const { records, updateRecord, deleteRecord } = useTimeRecordStore()
  
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null)
  const [editClockIn, setEditClockIn] = useState('')
  const [editClockOut, setEditClockOut] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)
  
  // 篩選當月紀錄
  const monthRecords = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    
    return records
      .filter(r => {
        const recordDate = new Date(r.clockIn)
        return (
          recordDate.getFullYear() === year &&
          recordDate.getMonth() === month &&
          r.clockOut
        )
      })
      .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
  }, [records, selectedMonth])
  
  // 按日期分組
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, TimeRecord[]>()
    
    monthRecords.forEach(record => {
      const dateKey = formatDate(new Date(record.clockIn))
      const existing = groups.get(dateKey) || []
      existing.push(record)
      groups.set(dateKey, existing)
    })
    
    return Array.from(groups.entries())
  }, [monthRecords])
  
  // 計算月份總計
  const monthSummary = useMemo(() => {
    if (!currentJob) return { hours: 0, earnings: 0 }
    
    let totalMinutes = 0
    monthRecords.forEach(record => {
      totalMinutes += calculateRecordMinutes(record)
    })
    
    return {
      hours: totalMinutes / 60,
      earnings: (totalMinutes / 60) * currentJob.hourlyRate
    }
  }, [monthRecords, currentJob])
  
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
  
  const handleEditRecord = (record: TimeRecord) => {
    setEditingRecord(record)
    const clockIn = new Date(record.clockIn)
    const clockOut = record.clockOut ? new Date(record.clockOut) : null
    
    setEditClockIn(clockIn.toISOString().slice(0, 16))
    setEditClockOut(clockOut ? clockOut.toISOString().slice(0, 16) : '')
  }
  
  const handleSaveEdit = async () => {
    if (!editingRecord) return
    
    await updateRecord(editingRecord.id, {
      clockIn: new Date(editClockIn),
      clockOut: editClockOut ? new Date(editClockOut) : undefined
    })
    
    setEditingRecord(null)
  }
  
  const handleDeleteRecord = async () => {
    if (!deletingRecordId) return
    
    await deleteRecord(deletingRecordId)
    setShowDeleteConfirm(false)
    setDeletingRecordId(null)
  }
  
  const getJobById = (jobId: string) => jobs.find(j => j.id === jobId)
  
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
          <h1 className="text-lg font-semibold text-gray-900">工時紀錄</h1>
        </div>
      </header>
      
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 月份選擇器 */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900">
                  {selectedMonth.getFullYear()} 年 {selectedMonth.getMonth() + 1} 月
                </p>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* 月份摘要 */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">總工時</p>
                <p className="text-xl font-semibold text-gray-900">
                  {monthSummary.hours.toFixed(1)} 小時
                </p>
              </div>
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">總薪資</p>
                <p className="text-xl font-semibold text-green-500">
                  {formatCurrency(monthSummary.earnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 紀錄列表 */}
        {groupedRecords.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">這個月還沒有打卡紀錄</p>
            </CardContent>
          </Card>
        ) : (
          groupedRecords.map(([dateKey, dayRecords]) => {
            const dayTotal = dayRecords.reduce(
              (sum, r) => sum + calculateRecordMinutes(r),
              0
            )
            
            return (
              <Card key={dateKey}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-gray-900">{dateKey}</p>
                    <p className="text-sm text-gray-500">
                      {formatDuration(dayTotal)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {dayRecords.map(record => {
                      const job = getJobById(record.jobId)
                      const minutes = calculateRecordMinutes(record)
                      const earnings = job
                        ? calculateRecordEarnings(record, job.hourlyRate)
                        : 0
                      const hasPhotos = record.clockInPhoto || record.clockOutPhoto
                      
                      return (
                        <div
                          key={record.id}
                          className="p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {job && (
                                <div
                                  className="w-2 h-8 rounded-full"
                                  style={{ backgroundColor: job.color }}
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatTime(new Date(record.clockIn))} -{' '}
                                  {record.clockOut
                                    ? formatTime(new Date(record.clockOut))
                                    : '--:--'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDuration(minutes)} · {formatCurrency(earnings)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditRecord(record)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingRecordId(record.id)
                                  setShowDeleteConfirm(true)
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* 打卡照片 */}
                          {hasPhotos && (
                            <div className="flex gap-2 mt-2 ml-5">
                              {record.clockInPhoto && (
                                <button
                                  onClick={() => setViewingPhoto(record.clockInPhoto!)}
                                  className="relative group"
                                >
                                  <img
                                    src={record.clockInPhoto}
                                    alt="上班打卡"
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Image className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="absolute -bottom-1 left-0 right-0 text-[10px] text-center text-gray-500">上班</span>
                                </button>
                              )}
                              {record.clockOutPhoto && (
                                <button
                                  onClick={() => setViewingPhoto(record.clockOutPhoto!)}
                                  className="relative group"
                                >
                                  <img
                                    src={record.clockOutPhoto}
                                    alt="下班打卡"
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Image className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="absolute -bottom-1 left-0 right-0 text-[10px] text-center text-gray-500">下班</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </main>
      
      {/* 編輯 Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title="編輯打卡紀錄"
      >
        <div className="space-y-4">
          <Input
            label="上班時間"
            type="datetime-local"
            value={editClockIn}
            onChange={e => setEditClockIn(e.target.value)}
          />
          <Input
            label="下班時間"
            type="datetime-local"
            value={editClockOut}
            onChange={e => setEditClockOut(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setEditingRecord(null)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit}>
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
          <p className="text-gray-700 mb-6">確定要刪除這筆打卡紀錄嗎？</p>
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
              onClick={handleDeleteRecord}
            >
              刪除
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 照片檢視 Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white"
            onClick={() => setViewingPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingPhoto}
            alt="打卡照片"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
