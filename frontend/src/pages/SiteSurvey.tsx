import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Upload, CheckCircle2, Compass, Maximize2, Ruler } from 'lucide-react'

export function SiteSurvey() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    roof_area: '',
    roof_direction: 'South',
    roof_tilt: '',
    shadow_free: false,
    cable_distance: '',
    roof_photo: null as File | null,
  })
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, roof_photo: file }))
      setFileName(file.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      navigate('/dashboard/orders')
    }, 2500)
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
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">On-Site Technical Survey</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Record accurate roof parameters for solar PV layout design</p>
          </div>
        </div>
        <Link 
          to="/" 
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-8 shadow-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-200/50 dark:border-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Roof & Site Assessment</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fill in all structural specifications required for engineering approval.</p>
            </div>
          </div>

          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 font-bold flex items-center space-x-3 animate-fade-in">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>Survey submitted successfully! Redirecting to order and payment confirmation...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Roof Area */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Maximize2 className="w-4 h-4 text-amber-500" /> Roof Area (sq ft)
                </label>
                <input
                  type="number"
                  name="roof_area"
                  required
                  placeholder="e.g. 650"
                  value={formData.roof_area}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>

              {/* Roof Direction */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Compass className="w-4 h-4 text-amber-500" /> Roof Direction
                </label>
                <select
                  name="roof_direction"
                  value={formData.roof_direction}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                >
                  <option value="North">North</option>
                  <option value="South">South (Optimal)</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Roof Tilt */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Sun className="w-4 h-4 text-amber-500" /> Roof Tilt (Degrees)
                </label>
                <input
                  type="number"
                  name="roof_tilt"
                  required
                  placeholder="e.g. 15"
                  value={formData.roof_tilt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>

              {/* Cable Distance */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Ruler className="w-4 h-4 text-amber-500" /> Cable Distance (Meters)
                </label>
                <input
                  type="number"
                  name="cable_distance"
                  required
                  placeholder="e.g. 25"
                  value={formData.cable_distance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            {/* Shadow-free Checkbox */}
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <input
                type="checkbox"
                id="shadow_free"
                name="shadow_free"
                checked={formData.shadow_free}
                onChange={handleInputChange}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="shadow_free" className="text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer select-none">
                Shadow-free Roof Area (Verified no surrounding obstructions / trees / high-rises)
              </label>
            </div>

            {/* Roof Photo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Upload className="w-4 h-4 text-amber-500" /> Roof Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-8 text-center hover:border-amber-500 transition cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {fileName ? fileName : 'Click to upload or drag & drop roof site photo'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 15MB</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-gray-900 font-black text-base shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Submit Survey for Approval</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default SiteSurvey
