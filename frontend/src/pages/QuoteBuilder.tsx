import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sun, ArrowLeft, Calculator, CheckCircle2, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import type { SurveyStatus } from '../types'

export function QuoteBuilder() {
  const [capacity, setCapacity] = useState<number>(5) // kW
  const [batteryType, setBatteryType] = useState<string>('5kWh')
  const [includeEVCharger, setIncludeEVCharger] = useState<boolean>(true)
  const [roofType, setRoofType] = useState<string>('Rooftop Concrete')
  
  // Mock state for Survey Approval Gate
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>('DRAFT')

  // Cost calculations in INR (₹)
  const costPerKw = 65000
  const batteryCost = batteryType === '10kWh' ? 150000 : batteryType === '5kWh' ? 85000 : 0
  const evChargerCost = includeEVCharger ? 45000 : 0
  const baseSystemCost = capacity * costPerKw
  const subsidy = capacity <= 10 ? 78000 : 94000
  const totalCost = baseSystemCost + batteryCost + evChargerCost - subsidy

  const bomItems = [
    { name: `Tier-1 Monocrystalline Solar Panels (${capacity * 3} Panels)`, qty: capacity * 3, unitPrice: 12000, total: (capacity * 3) * 12000 },
    { name: `Hybrid Solar Inverter (${capacity}kW Smart Grid-Tie)`, qty: 1, unitPrice: baseSystemCost * 0.35, total: baseSystemCost * 0.35 },
    { name: `Mounting Structure & DC/AC Cabling (${roofType})`, qty: capacity, unitPrice: 8000, total: capacity * 8000 },
    { name: `Battery Storage System (${batteryType})`, qty: batteryType !== 'None' ? 1 : 0, unitPrice: batteryCost, total: batteryCost },
    { name: `EV Smart Charger (Level 2)`, qty: includeEVCharger ? 1 : 0, unitPrice: evChargerCost, total: evChargerCost },
    { name: `Government Subsidy (PM Surya Ghar / State Rebate)`, qty: 1, unitPrice: -subsidy, total: -subsidy },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Calculator className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">SolarVerse Quote Builder</span>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            to="/" 
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200/50 dark:border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">System Configuration</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customize your solar installation parameters</p>
              </div>
            </div>

            {/* Capacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">System Capacity</label>
                <span className="px-3 py-1 bg-brand/10 text-brand dark:text-brand font-bold rounded-lg text-sm">
                  {capacity} kW
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>3 kW (Small Home)</span>
                <span>10 kW (Large Villa)</span>
                <span>20 kW (Commercial)</span>
              </div>
            </div>

            {/* Battery Storage */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Battery Storage Backup</label>
              <div className="grid grid-cols-3 gap-3">
                {['None', '5kWh', '10kWh'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBatteryType(b)}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      batteryType === b
                        ? 'bg-brand border-brand text-white dark:text-gray-950 shadow-md'
                        : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-brand-fresh'
                    }`}
                  >
                    {b === 'None' ? 'No Battery' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Roof Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Roof Surface Type</label>
              <select
                value={roofType}
                onChange={(e) => setRoofType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-brand text-gray-900 dark:text-white"
              >
                <option value="Rooftop Concrete">Rooftop Concrete Flat</option>
                <option value="Metal Sheet">Industrial Metal Sheet</option>
                <option value="Tile Roof">Traditional Red Tile Roof</option>
              </select>
            </div>

            {/* EV Charger Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-3">
                <Sun className="w-5 h-5 text-brand" />
                <div>
                  <p className="text-sm font-bold">Include EV Smart Charger</p>
                  <p className="text-xs text-gray-500">Level 2 Fast EV Charging integration</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeEVCharger}
                onChange={(e) => setIncludeEVCharger(e.target.checked)}
                className="w-5 h-5 accent-brand rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Survey Approval Simulator Panel */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Site Survey Approval Gate</h3>
                <p className="text-xs text-gray-500">Simulate surveyor inspection status</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                surveyStatus === 'APPROVED' ? 'bg-success/10 text-success dark:text-success' :
                surveyStatus === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                'bg-warning/10 text-warning'
              }`}>
                {surveyStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as SurveyStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSurveyStatus(status)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    surveyStatus === status
                      ? 'bg-brand border-brand text-white dark:text-gray-950 shadow'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-fresh'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: BOM Table & Massive Cost Display */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" /> Bill of Materials (BOM)
              </h3>
              <span className="px-3 py-1 rounded-full bg-success/10 text-success dark:text-success font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Subsidy Applied
              </span>
            </div>

            {/* BOM Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500">
                    <th className="py-3 font-semibold">Component / Item</th>
                    <th className="py-3 font-semibold text-center">Qty</th>
                    <th className="py-3 font-semibold text-right">Unit Price</th>
                    <th className="py-3 font-semibold text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
                  {bomItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-brand/5 transition">
                      <td className="py-3.5 font-medium">{item.name}</td>
                      <td className="py-3.5 text-center">{item.qty}</td>
                      <td className="py-3.5 text-right text-gray-500">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className={`py-3.5 text-right font-bold ${item.total < 0 ? 'text-success dark:text-success' : ''}`}>
                        {item.total < 0 ? `-₹${Math.abs(item.total).toLocaleString('en-IN')}` : `₹${item.total.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Cost Display */}
            <div className="pt-6 border-t border-gray-200/50 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Estimated Net Investment</p>
                <p className="text-xs text-gray-400">Includes all taxes & government subsidies</p>
              </div>
              <div className="text-right">
                <span className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-strong">
                  ₹{totalCost.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Survey Approval Warning Banner */}
            {surveyStatus !== 'APPROVED' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>A final quotation cannot be generated until the site survey is approved.</span>
              </div>
            )}

            <button
              onClick={() => alert('Quote generated successfully! Final quotation sent to customer.')}
              disabled={surveyStatus !== 'APPROVED'}
              className="w-full py-4 bg-brand hover:bg-brand-strong disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white dark:text-gray-950 dark:disabled:text-gray-500 font-bold rounded-2xl shadow-xl hover:shadow-[0_0_25px_color-mix(in_srgb,var(--sv-brand)_50%,transparent)] disabled:shadow-none transition-all duration-300 text-base disabled:cursor-not-allowed"
            >
              Generate Quote
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default QuoteBuilder
