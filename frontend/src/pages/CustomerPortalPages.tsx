import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui'
import { apiErrorMessage } from '../lib/apiClient'
import { getCustomerDocuments, getMyEquipment, getMyEquipmentItem, getMyInstallation, getMyInstallations, getMyOrder, getMyOrders, getMyQuotation, getMyQuotations, getMyWarranties, getMyWarranty, type PortalEquipment, type PortalInstallation, type PortalOrder, type PortalQuotation, type PortalWarranty } from '../lib/api'

function LoadList({ loading, error, retry, empty, children }: { loading: boolean; error: unknown; retry: () => void; empty: boolean; children: React.ReactNode }) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState description={apiErrorMessage(error)} onRetry={retry} />
  return empty ? <EmptyState title="Nothing to show yet" description="Records will appear here when they are associated with your account." /> : <>{children}</>
}

export function CustomerQuotationsPage() {
  const [selectedId, setSelectedId] = useState('')
  const query = useQuery({ queryKey: ['customer-portal', 'quotations'], queryFn: getMyQuotations })
  const detail = useQuery({ queryKey: ['customer-portal', 'quotation', selectedId], queryFn: () => getMyQuotation(selectedId), enabled: Boolean(selectedId) })
  return <><PageHeader eyebrow="Customer portal" title="My quotations" description="Review quotation versions and the pricing snapshots submitted by the SolarVerse team." />
    <LoadList loading={query.isLoading} error={query.error} retry={() => void query.refetch()} empty={!query.data?.length}>
      <Card><Table><TableHead><tr><TableHeader>Version</TableHeader><TableHeader>Status</TableHeader><TableHeader>Valid until</TableHeader><TableHeader>Total snapshot</TableHeader><TableHeader>Details</TableHeader></tr></TableHead><TableBody>{query.data?.map((q) => <TableRow key={q.id}><TableCell>v{q.version}</TableCell><TableCell><Badge>{q.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{q.valid_until || '—'}</TableCell><TableCell>{q.currency_code} {q.total_amount}</TableCell><TableCell><Button variant="tertiary" onClick={() => setSelectedId(q.id)}>View lines</Button></TableCell></TableRow>)}</TableBody></Table></Card>
    </LoadList>
    {selectedId && <Card className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Quotation details</h2><Button variant="tertiary" onClick={() => setSelectedId('')}>Close</Button></div>{detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState description={apiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} /> : <QuotationDetails quote={detail.data!} />}</Card>}
  </>
}

function QuotationDetails({ quote }: { quote: PortalQuotation }) {
  return <><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div>Status: <Badge>{quote.status}</Badge></div><div>Version: {quote.version}</div><div>Subtotal snapshot: {quote.currency_code} {quote.subtotal_amount}</div><div>Discount snapshot: {quote.currency_code} {quote.discount_amount}</div><div>Tax snapshot: {quote.currency_code} {quote.tax_amount}</div><div className="font-semibold">Total snapshot: {quote.currency_code} {quote.total_amount}</div></div><p className="mt-3 text-xs text-muted">Amounts are supplied snapshots and are not reconciled against line calculations. Commercial calculation rules are pending approval. Acceptance is not available in the current workflow.</p><div className="mt-4 overflow-x-auto"><Table><TableHead><tr><TableHeader>Description</TableHeader><TableHeader>Quantity</TableHeader><TableHeader>Unit price</TableHeader><TableHeader>Discount</TableHeader><TableHeader>Tax</TableHeader><TableHeader>Line total</TableHeader></tr></TableHead><TableBody>{quote.lines?.map((line) => <TableRow key={line.id}><TableCell>{line.description_snapshot}</TableCell><TableCell>{line.quantity}</TableCell><TableCell>{quote.currency_code} {line.unit_price}</TableCell><TableCell>{quote.currency_code} {line.discount_amount}</TableCell><TableCell>{quote.currency_code} {line.tax_amount}</TableCell><TableCell>{quote.currency_code} {line.line_total}</TableCell></TableRow>)}</TableBody></Table></div></>
}

export function CustomerOrdersPage() {
  const [selectedId, setSelectedId] = useState('')
  const query = useQuery({ queryKey: ['customer-portal', 'orders'], queryFn: getMyOrders })
  const detail = useQuery({ queryKey: ['customer-portal', 'order', selectedId], queryFn: () => getMyOrder(selectedId), enabled: Boolean(selectedId) })
  return <><PageHeader eyebrow="Customer portal" title="My orders" description="Follow confirmed order status, line snapshots, totals and the site associated with the originating enquiry." />
    <LoadList loading={query.isLoading} error={query.error} retry={() => void query.refetch()} empty={!query.data?.length}><Card><Table><TableHead><tr><TableHeader>Order</TableHeader><TableHeader>Status</TableHeader><TableHeader>Created</TableHeader><TableHeader>Total snapshot</TableHeader><TableHeader>Details</TableHeader></tr></TableHead><TableBody>{query.data?.map((o) => <TableRow key={o.id}><TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell><TableCell><Badge>{o.status}</Badge></TableCell><TableCell>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</TableCell><TableCell>{o.currency_code} {o.total_amount}</TableCell><TableCell><Button variant="tertiary" onClick={() => setSelectedId(o.id)}>View order</Button></TableCell></TableRow>)}</TableBody></Table></Card></LoadList>
    {selectedId && <Card className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Order details</h2><Button variant="tertiary" onClick={() => setSelectedId('')}>Close</Button></div>{detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState description={apiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} /> : <OrderDetails order={detail.data!} />}</Card>}
  </>
}

function OrderDetails({ order }: { order: PortalOrder }) {
  return <><div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div>Status: {order.status}</div><div>Created: {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</div><div>Confirmed: {order.confirmed_at ? new Date(order.confirmed_at).toLocaleString() : '—'}</div><div>Site: {order.site ? `${order.site.label || order.site.address_line}${order.site.city ? ` · ${order.site.city}` : ''}` : '—'}</div><div>Subtotal: {order.currency_code} {order.subtotal_amount}</div><div>Discount: {order.currency_code} {order.discount_amount}</div><div>Tax: {order.currency_code} {order.tax_amount}</div><div className="font-semibold">Total snapshot: {order.currency_code} {order.total_amount}</div></div><div className="mt-4 overflow-x-auto"><Table><TableHead><tr><TableHeader>Item</TableHeader><TableHeader>Quantity</TableHeader><TableHeader>Unit price</TableHeader><TableHeader>Line total</TableHeader></tr></TableHead><TableBody>{order.lines?.map((line) => <TableRow key={line.id}><TableCell>{line.description_snapshot}</TableCell><TableCell>{line.quantity}</TableCell><TableCell>{order.currency_code} {line.unit_price}</TableCell><TableCell>{order.currency_code} {line.line_total}</TableCell></TableRow>)}</TableBody></Table></div></>
}

export function CustomerInstallationsPage() {
  const [selectedId, setSelectedId] = useState('')
  const query = useQuery({ queryKey: ['customer-portal', 'installations'], queryFn: getMyInstallations })
  const detail = useQuery({ queryKey: ['customer-portal', 'installation', selectedId], queryFn: () => getMyInstallation(selectedId), enabled: Boolean(selectedId) })
  return <><PageHeader eyebrow="Customer portal" title="My installations" description="Review scheduling, progress, assigned technician names and checklist completion totals." />
    <LoadList loading={query.isLoading} error={query.error} retry={() => void query.refetch()} empty={!query.data?.length}><Card><Table><TableHead><tr><TableHeader>Installation</TableHeader><TableHeader>Status</TableHeader><TableHeader>Scheduled</TableHeader><TableHeader>Checklist</TableHeader><TableHeader>Details</TableHeader></tr></TableHead><TableBody>{query.data?.map((x) => <TableRow key={x.id}><TableCell className="font-mono text-xs">{x.id.slice(0, 8)}</TableCell><TableCell><Badge>{x.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{x.scheduled_at ? new Date(x.scheduled_at).toLocaleString() : 'Not scheduled'}</TableCell><TableCell>{x.checklist_summary.completed}/{x.checklist_summary.total}</TableCell><TableCell><Button variant="tertiary" onClick={() => setSelectedId(x.id)}>View</Button></TableCell></TableRow>)}</TableBody></Table></Card></LoadList>
    {selectedId && <Card className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Installation details</h2><Button variant="tertiary" onClick={() => setSelectedId('')}>Close</Button></div>{detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState description={apiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} /> : <InstallationDetails installation={detail.data!} />}</Card>}
  </>
}

function InstallationDetails({ installation }: { installation: PortalInstallation }) {
  return <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div>Status: {installation.status}</div><div>Scheduled: {installation.scheduled_at ? new Date(installation.scheduled_at).toLocaleString() : 'Not scheduled'}</div><div>Started: {installation.started_at ? new Date(installation.started_at).toLocaleString() : '—'}</div><div>Completed: {installation.completed_at ? new Date(installation.completed_at).toLocaleString() : '—'}</div><div>Customer sign-off: {installation.customer_signed_off_at ? new Date(installation.customer_signed_off_at).toLocaleString() : '—'}</div><div>Checklist: {installation.checklist_summary.completed} of {installation.checklist_summary.total} complete</div><div>Technicians: {installation.technicians.map((x) => x.name).join(', ') || 'Not assigned'}</div></div>
}

export function CustomerEquipmentPage() {
  const [selectedId, setSelectedId] = useState('')
  const query = useQuery({ queryKey: ['customer-portal', 'equipment'], queryFn: getMyEquipment })
  const detail = useQuery({ queryKey: ['customer-portal', 'equipment-item', selectedId], queryFn: () => getMyEquipmentItem(selectedId), enabled: Boolean(selectedId) })
  return <><PageHeader eyebrow="Customer portal" title="My equipment" description="Equipment is listed when its serial record is linked to a dispatch for one of your orders." />
    <LoadList loading={query.isLoading} error={query.error} retry={() => void query.refetch()} empty={!query.data?.length}><Card><Table><TableHead><tr><TableHeader>Product</TableHeader><TableHeader>Serial number</TableHeader><TableHeader>Dispatch status</TableHeader><TableHeader>Details</TableHeader></tr></TableHead><TableBody>{query.data?.map((x) => <TableRow key={x.id}><TableCell>{x.product_name || x.product_id}</TableCell><TableCell>{x.serial_number || 'Not recorded'}</TableCell><TableCell>{x.dispatch_status.replaceAll('_', ' ')}</TableCell><TableCell><Button variant="tertiary" onClick={() => setSelectedId(x.id)}>View</Button></TableCell></TableRow>)}</TableBody></Table></Card></LoadList>
    {selectedId && <Card className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Equipment details</h2><Button variant="tertiary" onClick={() => setSelectedId('')}>Close</Button></div>{detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState description={apiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} /> : <EquipmentDetails equipment={detail.data!} />}</Card>}
  </>
}

function EquipmentDetails({ equipment }: { equipment: PortalEquipment }) {
  return <dl className="mt-4 grid gap-2 text-sm"><div>Product: {equipment.product_name || equipment.product_id}</div><div>Serial: {equipment.serial_number || 'Not recorded'}</div><div>Dispatch status: {equipment.dispatch_status}</div></dl>
}

export function CustomerWarrantiesPage() {
  const [selectedId, setSelectedId] = useState('')
  const query = useQuery({ queryKey: ['customer-portal', 'warranties'], queryFn: getMyWarranties })
  const detail = useQuery({ queryKey: ['customer-portal', 'warranty', selectedId], queryFn: () => getMyWarranty(selectedId), enabled: Boolean(selectedId) })
  return <><PageHeader eyebrow="Customer portal" title="My warranties" description="Coverage is linked through your dispatched equipment and order records." />
    <LoadList loading={query.isLoading} error={query.error} retry={() => void query.refetch()} empty={!query.data?.length}><Card><Table><TableHead><tr><TableHeader>Serial</TableHeader><TableHeader>Coverage</TableHeader><TableHeader>Validity</TableHeader><TableHeader>Details</TableHeader></tr></TableHead><TableBody>{query.data?.map((w) => <TableRow key={w.id}><TableCell>{w.serial_number || '—'}</TableCell><TableCell>{w.starts_on} to {w.ends_on}</TableCell><TableCell><Badge tone={w.valid_now ? 'success' : 'neutral'}>{w.valid_now ? 'Valid' : 'Not currently valid'}</Badge></TableCell><TableCell><Button variant="tertiary" onClick={() => setSelectedId(w.id)}>View</Button></TableCell></TableRow>)}</TableBody></Table></Card></LoadList>
    {selectedId && <Card className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Warranty details</h2><Button variant="tertiary" onClick={() => setSelectedId('')}>Close</Button></div>{detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState description={apiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} /> : <WarrantyDetails warranty={detail.data!} />}</Card>}
  </>
}

function WarrantyDetails({ warranty }: { warranty: PortalWarranty }) {
  return <dl className="mt-4 grid gap-2 text-sm"><div>Serial: {warranty.serial_number || '—'}</div><div>Starts: {warranty.starts_on}</div><div>Ends: {warranty.ends_on}</div><div>Validity: {warranty.valid_now ? 'Valid today' : 'Not currently valid'}</div><div>Equipment dispatch: {warranty.equipment_status}</div><div>Terms: {warranty.terms || 'No terms recorded'}</div></dl>
}

export function CustomerDocumentsPage() {
  const query = useQuery({ queryKey: ['customer-portal', 'documents'], queryFn: getCustomerDocuments, retry: false })
  return <><PageHeader eyebrow="Customer portal" title="My documents" description="File records currently store internal metadata only; customer sharing and secure download are not configured." />{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState description={apiErrorMessage(query.error)} /> : <EmptyState title="No shared documents" description="Documents will appear here after a customer-safe sharing policy and storage access are implemented." />}</>
}
