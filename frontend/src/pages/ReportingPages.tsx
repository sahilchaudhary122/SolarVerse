import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '../components/ui'
import { apiErrorMessage } from '../lib/apiClient'
import { getReportsSummary, type ReportSummary } from '../lib/api'

type StatusCount = { status: string; count: number }
type ReportSection = { created_count?: number; by_status?: StatusCount[]; balances?: Array<{ location: string; product: string; quantity_on_hand: string }> }

export function ReportingPage() {
  const [applied, setApplied] = useState<{ date_from?: string; date_to?: string }>({})
  const query = useQuery({ queryKey: ['reports-summary', applied], queryFn: () => getReportsSummary(applied) })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setApplied({ date_from: String(data.get('date_from')) || undefined, date_to: String(data.get('date_to')) || undefined })
  }
  const sections = (query.data as ReportSummary | undefined)?.reports as Record<string, ReportSection> | undefined
  return <><PageHeader eyebrow="Reports" title="Operational reports" description="Database-backed counts by status. The API limits report sections by the signed-in role and supports date filters where records have creation timestamps." />
    <p className="mb-4 text-xs text-muted">Inventory shows current quantity balances regardless of date filter. Payment summaries count ledger records and are not revenue, settlement, or reconciliation figures.</p>
    <Card className="mb-5 p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input label="From date" name="date_from" type="date" /><Input label="To date" name="date_to" type="date" /><div className="flex items-end"><Button type="submit">Apply dates</Button></div></form>{query.data?.period.date_from || query.data?.period.date_to ? <p className="mt-3 text-xs text-muted">Applied period: {query.data.period.date_from || 'any'} through {query.data.period.date_to || 'today'}</p> : null}</Card>
    {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState description={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : sections && Object.keys(sections).length ? <div className="grid gap-4 md:grid-cols-2">{Object.entries(sections).map(([name, section]) => <Card key={name} className="p-5"><h2 className="mb-4 font-semibold capitalize">{name.replaceAll('_', ' ')}</h2>{section.created_count !== undefined && <p className="mb-3 text-2xl font-bold">{section.created_count}<span className="ml-2 text-sm font-normal text-muted">created in selected period</span></p>}{section.by_status && (section.by_status.length ? <ul className="space-y-2">{section.by_status.map((item) => <li key={item.status} className="flex items-center justify-between border-b border-border py-2 text-sm"><span>{item.status.replaceAll('_', ' ')}</span><Badge>{item.count}</Badge></li>)}</ul> : <EmptyState title="No matching records" description="No records fall within this selected period." />)}{section.balances && (section.balances.length ? <Table><TableHead><tr><TableHeader>Location</TableHeader><TableHeader>Product</TableHeader><TableHeader>On hand</TableHeader></tr></TableHead><TableBody>{section.balances.map((row, index) => <TableRow key={`${row.location}-${row.product}-${index}`}><TableCell>{row.location}</TableCell><TableCell>{row.product}</TableCell><TableCell>{row.quantity_on_hand}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No inventory balances" description="No balance rows are currently recorded." />)}</Card>)}</div> : <EmptyState title="No reports available" description="Your role does not have access to a report section, or there are no records to report." />}
  </>
}
