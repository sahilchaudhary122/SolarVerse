import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wrench, Clock, Upload, CheckCircle2, Eraser } from 'lucide-react'

export function InstallationForm() {
  const [startTime, setStartTime] = useState('09:00')
  const [finishTime, setFinishTime] = useState('14:30')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 4000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Wrench className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">Solar Installation Completion Form</span>
        </div>
        <Link 
          to="/" 
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-8">
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-200/50 dark:border-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Site Sign-Off & Commissioning</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Record installation timestamps, upload roof verification, and capture signature.</p>
            </div>
          </div>

          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-semibold flex items-center space-x-3 animate-fade-in-up">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>Installation report submitted successfully! Telemetry synced with SolarVerse cloud.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Finish Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={finishTime}
                    onChange={(e) => setFinishTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* File Upload Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" /> Upload Roof Photo
              </label>
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 hover:border-amber-500 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{fileName ? fileName : 'Choose roof inspection image'}</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-500 file:text-gray-900 hover:file:bg-amber-600 cursor-pointer text-xs text-gray-500"
                />
              </div>
            </div>

            {/* Canvas Element for Customer Signature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Signature</label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear Signature
                </button>
              </div>

              <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-40 cursor-crosshair touch-none"
                />
              </div>
              <p className="text-xs text-gray-400">Sign inside the box above using your mouse or touchscreen.</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-2xl shadow-xl hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-300 text-base flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Installation Completion</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default InstallationForm
