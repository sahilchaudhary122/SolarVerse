import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Phone, Sun, ArrowUpRight, Search, MapPin } from 'lucide-react'
import type { EnquiryStatus } from '../types'
import apiClient, { apiErrorMessage } from '../lib/apiClient'

interface Enquiry {
  id: string
  customer_name: string
  phone: string
  capacity_kw: number | null
  status: EnquiryStatus
  location: string
  created_at: string | null
  city?: string | null
  state?: string | null
}

export function EnquiriesList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const enquiriesQuery = useQuery({
    queryKey: ['enquiries'],
    queryFn: async () => (await apiClient.get<Enquiry[]>('/enquiries')).data,
  })

  const enquiries = enquiriesQuery.data ?? []
  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch = 
      enq.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.phone.includes(searchTerm) ||
      `${enq.city ?? ''} ${enq.state ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || enq.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20">New</span>
      case 'contacted':
        return <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold text-xs border border-yellow-500/20">Contacted</span>
      case 'survey_pending':
        return <span className="px-3 py-1 rounded-full bg-warning/10 text-warning font-bold text-xs border border-warning/20">Survey Pending</span>
      case 'converted':
        return <span className="px-3 py-1 rounded-full bg-success/10 text-success dark:text-success font-bold text-xs border border-success/20">Converted</span>
      case 'quoted':
        return <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs border border-purple-500/20">Quoted</span>
      default:
        return <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 font-bold text-xs border border-gray-500/20">{status}</span>
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Sales Enquiries List</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage incoming customer leads & survey dispatches</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/quote-builder"
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white dark:text-gray-950 font-bold text-sm rounded-xl shadow-md transition"
          >
            + New Quote
          </Link>
          <Link 
            to="/" 
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 space-y-6">
        {/* Controls Bar */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, phone, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-focus transition"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-focus transition capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="new">New (Blue)</option>
              <option value="contacted">Contacted (Yellow)</option>
              <option value="survey_pending">Survey Pending (Orange)</option>
              <option value="converted">Converted (Green)</option>
              <option value="quoted">Quoted</option>
            </select>
          </div>
        </div>

        {enquiriesQuery.isLoading && <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">Loading enquiries…</p>}
        {enquiriesQuery.isError && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">{apiErrorMessage(enquiriesQuery.error)}</p>}

        {/* Data Table */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Capacity (kW)</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No enquiries found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-brand/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black shrink-0">
                          {enq.customer_name.charAt(0)}
                        </div>
                        <div>
                          <p>{enq.customer_name}</p>
                          <p className="text-xs text-gray-400 font-normal">{enq.id} • {enq.created_at}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-brand" /> {enq.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-brand dark:text-brand">
                        <span className="flex items-center gap-1">
                          <Sun className="w-4 h-4" /> {enq.capacity_kw === null ? 'Not specified' : `${enq.capacity_kw} kW`}
                        </span>
                      </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {[enq.city, enq.state].filter(Boolean).join(', ') || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(enq.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/dashboard/survey')}
                          className="px-4 py-2 rounded-xl bg-brand/10 hover:bg-brand text-brand hover:text-white dark:hover:text-gray-950 font-bold text-xs transition flex items-center gap-1.5 ml-auto shadow-sm"
                        >
                          <span>View / Survey</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EnquiriesList
