import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera as CameraIcon, RotateCcw, Check, X } from 'lucide-react'
import { Button } from './Button'

interface CameraProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export function Camera({ onCapture, onCancel }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const startCamera = useCallback(async () => {
    try {
      // 先停止現有的 stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)
    } catch (err) {
      console.error('Camera error:', err)
      setError('無法存取相機，請確認已授予相機權限')
    }
  }, [facingMode, stream])

  useEffect(() => {
    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 切換相機時重新啟動
  useEffect(() => {
    if (stream) {
      startCamera()
    }
  }, [facingMode])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // 設定 canvas 大小與影像相同
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 如果是前鏡頭，水平翻轉
    if (facingMode === 'user') {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }

    // 繪製影像
    context.drawImage(video, 0, 0)

    // 轉換為 base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
  }

  const handleRetake = () => {
    setCapturedImage(null)
  }

  const handleConfirm = () => {
    if (capturedImage) {
      // 停止相機
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      onCapture(capturedImage)
    }
  }

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    onCancel()
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-white text-center mb-6">
          <CameraIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{error}</p>
        </div>
        <Button onClick={handleCancel} variant="secondary">
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 相機預覽 */}
      <div className="flex-1 relative overflow-hidden">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {/* 取消按鈕 */}
        <button
          onClick={handleCancel}
          className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 切換相機按鈕 */}
        {!capturedImage && (
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}

        {/* 時間戳記 */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
          {new Date().toLocaleString('zh-TW')}
        </div>
      </div>

      {/* 控制區 */}
      <div className="bg-black p-6 safe-area-bottom">
        {!capturedImage ? (
          <div className="flex justify-center">
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center gap-8">
            <Button
              onClick={handleRetake}
              variant="secondary"
              size="lg"
              className="flex-1 max-w-32"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重拍
            </Button>
            <Button
              onClick={handleConfirm}
              size="lg"
              className="flex-1 max-w-32"
            >
              <Check className="w-5 h-5 mr-2" />
              確認
            </Button>
          </div>
        )}
      </div>

      {/* 隱藏的 canvas 用於擷取影像 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
