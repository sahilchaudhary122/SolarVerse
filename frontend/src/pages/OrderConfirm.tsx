import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, CheckCircle2, FileText, Sun, IndianRupee } from 'lucide-react'

export function OrderConfirm() {
  const quoteAmount = 122000
  const [advanceAmount, setAdvanceAmount] = useState('36600')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfirmed(true)
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
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Orders & Payments</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Finalize quotation advance payment and trigger dispatch</p>
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
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 sm:p-10">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-8 shadow-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-200/50 dark:border-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Payment & Order Confirmation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review quote total and record advance payment to initiate installation.</p>
            </div>
          </div>

          {isConfirmed ? (
            <div className="p-6 rounded-3xl bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 space-y-4 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black">Order Confirmed. Dispatch team notified.</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Invoice #INV-2026-894 generated successfully. The inventory & warehouse dispatch team has been alerted for hardware allocation.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <Link
                  to="/dashboard"
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-sm shadow-md transition"
                >
                  Return to Dashboard
                </Link>
                <button
                  onClick={() => setIsConfirmed(false)}
                  className="px-6 py-3 rounded-2xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold text-sm transition"
                >
                  Process Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-6">
              {/* Summary Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Sun className="w-4 h-4" /> Active Solar Quotation #QT-2026-448
                  </span>
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs">
                    Survey Approved
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-amber-500/20">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quote Amount</span>
                  <span className="text-3xl font-black text-gray-900 dark:text-white flex items-center">
                    ₹{quoteAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <IndianRupee className="w-4 h-4 text-amber-500" /> Advance Amount Received (₹)
                </label>
                <input
                  type="number"
                  name="advance_amount"
                  required
                  placeholder="e.g. 36600"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                <p className="text-xs text-gray-500">Recommended 30% advance for standard residential solar procurement.</p>
              </div>

              {/* Confirm Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-gray-900 font-black text-base shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                <span>Confirm Order & Generate Invoice</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default OrderConfirm
