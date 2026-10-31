import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Search, CheckCircle2, AlertCircle } from 'lucide-react'

export function WarrantyLookup() {
  const [query, setQuery] = useState('INV-9982')
  const [searched, setSearched] = useState(true)

  const mockDatabase: Record<string, { serial: string; status: string; customer: string; expires: string; capacity: string; model: string }> = {
    'INV-9982': {
      serial: 'INV-9982',
      status: 'Active',
      customer: 'Rahul Sharma',
      expires: 'Jan 2027',
      capacity: '5kW Hybrid Inverter',
      model: 'SolarVerse Pro-Grid 5000',
    },
    'PAN-4410': {
      serial: 'PAN-4410',
      status: 'Active',
      customer: 'Priya Patel',
      expires: 'Mar 2029',
      capacity: '400W Monocrystalline',
      model: 'SolarVerse Tier-1 Mono',
    },
    'BAT-2049': {
      serial: 'BAT-2049',
      status: 'Active',
      customer: 'Vikram Singh',
      expires: 'Dec 2028',
      capacity: '10kWh Lithium Storage',
      model: 'SolarVault PowerStore',
    },
  }

  const [result, setResult] = useState(mockDatabase['INV-9982'])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
    const cleaned = query.trim().toUpperCase()
    if (mockDatabase[cleaned]) {
      setResult(mockDatabase[cleaned])
    } else {
      setResult({
        serial: cleaned || 'UNKNOWN',
        status: 'Not Found',
        customer: 'N/A',
        expires: 'N/A',
        capacity: 'N/A',
        model: 'N/A',
      })
    }
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">Warranty & Serial Lookup</span>
        </div>
        <Link 
          to="/" 
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Search Card */}
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-200/50 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hardware Warranty Validation</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Search by serial number to check status and coverage.</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Serial Number (e.g. INV-9982)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition text-sm flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 pt-1">
            <span className="font-semibold">Try sample serials:</span>
            {Object.keys(mockDatabase).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s)
                  setResult(mockDatabase[s])
                  setSearched(true)
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-semibold hover:bg-amber-500/20 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Result Card */}
        {searched && result && (
          <div className="glass-panel p-8 rounded-3xl space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" /> Warranty Telemetry Result
              </h3>
              {result.status === 'Active' ? (
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <AlertCircle className="w-4 h-4" /> Not Found
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Serial Number</p>
                <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{result.serial}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Warranty Status</p>
                <p className="text-xl font-black">{result.status}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Customer</p>
                <p className="text-lg font-bold">{result.customer}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Warranty Expiry</p>
                <p className="text-lg font-bold">{result.expires}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hardware Spec</p>
                <p className="text-base font-semibold text-gray-600 dark:text-gray-300">{result.capacity}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model Name</p>
                <p className="text-base font-semibold text-gray-600 dark:text-gray-300">{result.model}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default WarrantyLookup
