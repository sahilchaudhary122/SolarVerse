import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, LifeBuoy, Plus, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react'
import type { TicketStatus } from '../types'

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  status: TicketStatus;
  priority: string;
  date: string;
}

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'T-101', subject: 'Inverter Fault Error 302', customer: 'Rahul Sharma', status: 'IN_PROGRESS', priority: 'High', date: 'Today, 09:15 AM' },
    { id: 'T-102', subject: 'Scheduled Panel Cleaning', customer: 'Priya Patel', status: 'CLOSED', priority: 'Normal', date: 'Yesterday' },
    { id: 'T-103', subject: 'Battery Storage Capacity Drop', customer: 'Vikram Singh', status: 'CUSTOMER_CONFIRMATION', priority: 'Urgent', date: '2 days ago' },
    { id: 'T-104', subject: 'Smart Meter Wi-Fi Pairing Issue', customer: 'Ananya Gupta', status: 'OPEN', priority: 'Low', date: '3 days ago' },
    { id: 'T-105', subject: 'Grid Synchronization Check', customer: 'Rajesh Kumar', status: 'RESOLUTION_PENDING', priority: 'High', date: '4 days ago' },
  ])

  const [showNewModal, setShowNewModal] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [newPriority, setNewPriority] = useState('Normal')

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim()) return
    const nextId = `T-${101 + tickets.length}`
    const ticket: Ticket = {
      id: nextId,
      subject: newSubject,
      customer: newCustomer || 'Walk-in Client',
      status: 'OPEN',
      priority: newPriority,
      date: 'Just now',
    }
    setTickets([ticket, ...tickets])
    setNewSubject('')
    setNewCustomer('')
    setShowNewModal(false)
  }

  const handleCustomerSignOff = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'CLOSED' } : t))
    )
  }

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30', icon: AlertCircle, label: 'OPEN' }
      case 'IN_PROGRESS':
        return { color: 'bg-warning/10 text-warning border-warning/30', icon: Clock, label: 'IN PROGRESS' }
      case 'RESOLUTION_PENDING':
      case 'CUSTOMER_CONFIRMATION':
        return { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: FileText, label: status === 'RESOLUTION_PENDING' ? 'RESOLUTION PENDING' : 'CUSTOMER CONFIRMATION' }
      case 'CLOSED':
        return { color: 'bg-success/10 text-success dark:text-success border-success/30', icon: CheckCircle2, label: 'CLOSED' }
      default:
        return { color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30', icon: Clock, label: status }
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
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">Support & Maintenance Tickets</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-brand hover:bg-brand-strong text-white dark:text-gray-950 font-bold text-sm rounded-xl shadow-md hover:shadow-[0_0_15px_color-mix(in_srgb,var(--sv-brand)_40%,transparent)] transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Modal for New Ticket */}
        {showNewModal && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in-up border-2 border-brand/30 bg-white dark:bg-gray-900 shadow-xl">
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
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-brand"
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
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-brand"
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
                  className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-strong text-white dark:text-gray-950 text-sm font-bold shadow-md transition"
                >
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-brand" /> Active Maintenance Queue ({tickets.length})
            </h3>
            <span className="text-xs text-gray-500">Tickets remain active until customer confirmation/sign-off</span>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => {
              const badge = getStatusBadge(t.status)
              const BadgeIcon = badge.icon
              const isPendingConfirmation = t.status === 'RESOLUTION_PENDING' || t.status === 'CUSTOMER_CONFIRMATION'

              return (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-brand/50 transition gap-4 shadow-sm"
                >
                  <div className="flex items-start sm:items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-mono font-black shrink-0">
                      {t.id}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-base">{t.subject}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.priority === 'Urgent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          t.priority === 'High' ? 'bg-warning/10 text-warning' :
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

                  <div className="flex items-center space-x-3 self-end sm:self-center flex-wrap gap-2">
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${badge.color}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    {isPendingConfirmation && (
                      <button
                        onClick={() => handleCustomerSignOff(t.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white dark:text-gray-950 text-xs font-bold shadow transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Customer Sign-off</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SupportTickets
