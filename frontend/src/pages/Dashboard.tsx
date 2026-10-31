import { Link, useLocation } from 'react-router-dom'
import { Sun, Calculator, BarChart3, Users, Wrench, ArrowUpRight, ShieldCheck, Home, QrCode, LifeBuoy } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const revenueData = [
  { month: 'Nov', revenue: 520000 },
  { month: 'Dec', revenue: 680000 },
  { month: 'Jan', revenue: 790000 },
  { month: 'Feb', revenue: 950000 },
  { month: 'Mar', revenue: 1250000 },
  { month: 'Apr', revenue: 1640000 },
]

export function Dashboard() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-panel md:min-h-screen p-6 flex flex-col justify-between shrink-0 border-r border-gray-200 dark:border-gray-800">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sun className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight">SolarVerse</span>
          </div>

          <nav className="space-y-1.5">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition ${
                location.pathname === '/dashboard'
                  ? 'bg-amber-500 text-gray-900 shadow-md'
                  : 'hover:bg-amber-500/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/quote-builder"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-amber-500/10 text-gray-700 dark:text-gray-300 font-semibold transition"
            >
              <Calculator className="w-5 h-5" />
              <span>Quote Builder</span>
            </Link>

            <Link
              to="/dashboard/scanner"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition ${
                location.pathname === '/dashboard/scanner'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                  : 'hover:bg-amber-500/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <QrCode className="w-5 h-5 text-amber-500" />
              <span>Scanner</span>
            </Link>

            <Link
              to="/dashboard/installation"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition ${
                location.pathname === '/dashboard/installation'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                  : 'hover:bg-amber-500/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Wrench className="w-5 h-5 text-amber-500" />
              <span>Installation</span>
            </Link>

            <Link
              to="/dashboard/warranty"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition ${
                location.pathname === '/dashboard/warranty'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                  : 'hover:bg-amber-500/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>Warranty</span>
            </Link>

            <Link
              to="/dashboard/tickets"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition ${
                location.pathname === '/dashboard/tickets'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                  : 'hover:bg-amber-500/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <LifeBuoy className="w-5 h-5 text-amber-500" />
              <span>Tickets</span>
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-200/50 dark:border-gray-800">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition">
            <Home className="w-5 h-5 text-amber-500" />
            <span>Back to Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 sm:px-10 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Executive Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Real-time telemetry and revenue analytics for SolarVerse operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/quote-builder"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-sm rounded-xl shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition"
            >
              + New Quote
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1 */}
            <div className="glass-panel p-6 rounded-3xl space-y-4 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-gray-900 shadow-lg">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +22.4%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue (Last 6 Mos)</p>
                <p className="text-3xl font-black mt-1">₹48,50,000</p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="glass-panel p-6 rounded-3xl space-y-4 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-900 shadow-lg">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  3 Today
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Installations</p>
                <p className="text-3xl font-black mt-1">14 Sites</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="glass-panel p-6 rounded-3xl space-y-4 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs">
                  2 Urgent
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tickets & Enquiries</p>
                <p className="text-3xl font-black mt-1">7 Active</p>
              </div>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" /> Revenue Growth (Last 6 Months)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly gross turnover in Indian Rupees (₹)</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Revenue (₹)</span>
              </div>
            </div>

            <div className="w-full h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false}
                    tickFormatter={(value) => `₹${value / 100000}L`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
