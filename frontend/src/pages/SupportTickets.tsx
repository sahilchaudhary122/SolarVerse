import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, LifeBuoy, Plus, CheckCircle2, Clock } from 'lucide-react'

export function SupportTickets() {
  const [tickets, setTickets] = useState([
    { id: 'T-101', subject: 'Inverter Fault Error 302', customer: 'Rahul Sharma', status: 'Open', priority: 'High', date: 'Today, 09:15 AM' },
    { id: 'T-102', subject: 'Scheduled Panel Cleaning', customer: 'Priya Patel', status: 'Closed', priority: 'Normal', date: 'Yesterday' },
    { id: 'T-103', subject: 'Battery Storage Capacity Drop', customer: 'Vikram Singh', status: 'Open', priority: 'Urgent', date: '2 days ago' },
    { id: 'T-104', subject: 'Smart Meter Wi-Fi Pairing Issue', customer: 'Ananya Gupta', status: 'Closed', priority: 'Low', date: '3 days ago' },
  ])

  const [showNewModal, setShowNewModal] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [newPriority, setNewPriority] = useState('Normal')

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim()) return
    const nextId = `T-${101 + tickets.length}`
    const ticket = {
      id: nextId,
      subject: newSubject,
      customer: newCustomer || 'Walk-in Client',
      status: 'Open',
      priority: newPriority,
      date: 'Just now',
    }
    setTickets([ticket, ...tickets])
    setNewSubject('')
    setNewCustomer('')
    setShowNewModal(false)
  }

  const toggleStatus = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'Open' ? 'Closed' : 'Open' } : t))
    )
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
            <LifeBuoy className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">Support & Maintenance Tickets</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-sm rounded-xl shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Modal for New Ticket */}
        {showNewModal && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in-up border-2 border-amber-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800">
              <h3 className="text-xl font-bold">Create New Support Ticket</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Issue / Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Inverter Fault Error"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Customer Name</label>
                  <input
                    type="text"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 text-sm font-bold shadow-md transition"
                >
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-500" /> Active Maintenance Queue ({tickets.length})
            </h3>
            <span className="text-xs text-gray-500">Click status badge to toggle Open / Closed</span>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-amber-500/50 transition gap-4 shadow-sm"
              >
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-mono font-black shrink-0">
                    {t.id}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-bold text-base">{t.subject}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.priority === 'Urgent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        t.priority === 'High' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Customer: <span className="font-semibold text-gray-700 dark:text-gray-300">{t.customer}</span> • {t.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <button
                    onClick={() => toggleStatus(t.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                      t.status === 'Open'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                        : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border border-green-500/30'
                    }`}
                  >
                    {t.status === 'Open' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Status: {t.status}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SupportTickets
