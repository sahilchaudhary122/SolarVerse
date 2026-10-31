import { useState, type ReactNode } from 'react'
import { Boxes, ChevronRight, ClipboardList, Menu, Package, PackageCheck, Sun, Truck, Warehouse, X } from 'lucide-react'
import { Badge, Button, Card, IconButton, Modal, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThemeToggle } from '../components/ui'
import { Pagination, type PageSize } from '../components/ui/Pagination'
import { Input, Select } from '../components/ui'

type InventorySection = 'overview' | 'products' | 'warehouses' | 'movements' | 'reservations' | 'dispatch' | 'alerts'
type Product = { id: string; name: string; category: string; sku: string; available: number; reserved: number; location: string; reorderLevel: number }
type MovementType = 'Stock received' | 'Stock reserved' | 'Stock dispatched' | 'Stock returned' | 'Stock adjustment'
type StockMovement = { id: string; date: string; productId: string; product: string; quantity: number; type: MovementType; reference: string; location: string }
type Reservation = { id: string; order: string; productId: string; product: string; quantity: number; warehouse: string; status: 'Active' | 'Partially fulfilled' | 'Released'; reservedOn: string }
type Dispatch = { id: string; order: string; customer: string; warehouse: string; date: string; status: 'Preparing' | 'Dispatched' | 'Delivered'; equipment: string }
type InventoryColumn<T> = { key: string; label: string; render: (record: T) => ReactNode }
type TableFilter = { value: string; label: string }

const products: Product[] = [
  { id: 'DEMO-PROD-001', name: 'Sample Mono PV Module 450 W', category: 'Solar panels', sku: 'DEMO-PV-450-A', available: 48, reserved: 12, location: 'North Demo Warehouse', reorderLevel: 20 },
  { id: 'DEMO-PROD-002', name: 'Sample Mono PV Module 550 W', category: 'Solar panels', sku: 'DEMO-PV-550-B', available: 14, reserved: 8, location: 'North Demo Warehouse', reorderLevel: 18 },
  { id: 'DEMO-PROD-003', name: 'Sample Bifacial PV Module 600 W', category: 'Solar panels', sku: 'DEMO-PV-600-C', available: 32, reserved: 4, location: 'Central Demo Depot', reorderLevel: 16 },
  { id: 'DEMO-PROD-004', name: 'Sample String Inverter 3 kW', category: 'Inverters', sku: 'DEMO-INV-03-A', available: 9, reserved: 3, location: 'North Demo Warehouse', reorderLevel: 10 },
  { id: 'DEMO-PROD-005', name: 'Sample Hybrid Inverter 5 kW', category: 'Inverters', sku: 'DEMO-INV-05-B', available: 18, reserved: 6, location: 'Central Demo Depot', reorderLevel: 8 },
  { id: 'DEMO-PROD-006', name: 'Sample Three-Phase Inverter 10 kW', category: 'Inverters', sku: 'DEMO-INV-10-C', available: 5, reserved: 2, location: 'South Demo Storage', reorderLevel: 6 },
  { id: 'DEMO-PROD-007', name: 'Sample Lithium Battery 5 kWh', category: 'Batteries', sku: 'DEMO-BAT-05-A', available: 11, reserved: 4, location: 'Central Demo Depot', reorderLevel: 6 },
  { id: 'DEMO-PROD-008', name: 'Sample Lithium Battery 10 kWh', category: 'Batteries', sku: 'DEMO-BAT-10-B', available: 3, reserved: 3, location: 'South Demo Storage', reorderLevel: 5 },
  { id: 'DEMO-PROD-009', name: 'Sample Aluminum Rail Set', category: 'Mounting structures', sku: 'DEMO-MNT-RAIL-A', available: 25, reserved: 7, location: 'North Demo Warehouse', reorderLevel: 10 },
  { id: 'DEMO-PROD-010', name: 'Sample Roof Hook Kit', category: 'Mounting structures', sku: 'DEMO-MNT-HOOK-B', available: 8, reserved: 1, location: 'South Demo Storage', reorderLevel: 10 },
  { id: 'DEMO-PROD-011', name: 'Sample DC Solar Cable 6 mm²', category: 'Cables', sku: 'DEMO-CAB-DC-06', available: 130, reserved: 35, location: 'Central Demo Depot', reorderLevel: 50 },
  { id: 'DEMO-PROD-012', name: 'Sample AC Cable 10 mm²', category: 'Cables', sku: 'DEMO-CAB-AC-10', available: 42, reserved: 10, location: 'North Demo Warehouse', reorderLevel: 20 },
  { id: 'DEMO-PROD-013', name: 'Sample DC Isolator 32 A', category: 'Electrical accessories', sku: 'DEMO-ELE-ISO-32', available: 7, reserved: 2, location: 'South Demo Storage', reorderLevel: 8 },
  { id: 'DEMO-PROD-014', name: 'Sample Surge Protection Device', category: 'Electrical accessories', sku: 'DEMO-ELE-SPD-A', available: 22, reserved: 5, location: 'Central Demo Depot', reorderLevel: 8 },
  { id: 'DEMO-PROD-015', name: 'Sample MC4 Connector Pair', category: 'Electrical accessories', sku: 'DEMO-ELE-MC4-A', available: 0, reserved: 0, location: 'North Demo Warehouse', reorderLevel: 12 },
]

const movementTypes: MovementType[] = ['Stock received', 'Stock reserved', 'Stock dispatched', 'Stock returned', 'Stock adjustment']
const stockMovements: StockMovement[] = Array.from({ length: 16 }, (_, index) => {
  const product = products[index % products.length]
  const type = movementTypes[index % movementTypes.length]
  return { id: `DEMO-MOV-${String(index + 1).padStart(3, '0')}`, date: `${String(20 + index % 10).padStart(2, '0')} Oct 2026`, productId: product.id, product: product.name, quantity: index % 2 === 0 ? index + 2 : -(index + 1), type, reference: `DEMO-REF-${500 + index}`, location: product.location }
})

const reservations: Reservation[] = Array.from({ length: 14 }, (_, index) => {
  const product = products[(index * 2) % products.length]
  const statuses: Reservation['status'][] = ['Active', 'Partially fulfilled', 'Released']
  return { id: `DEMO-RES-${String(index + 1).padStart(3, '0')}`, order: `DEMO-SO-${String(701 + index).padStart(3, '0')}`, productId: product.id, product: product.name, quantity: (index % 5) + 1, warehouse: product.location, status: statuses[index % statuses.length], reservedOn: `${String(15 + index % 15).padStart(2, '0')} Oct 2026` }
})

const dispatches: Dispatch[] = Array.from({ length: 13 }, (_, index) => {
  const product = products[(index * 3) % products.length]
  const statuses: Dispatch['status'][] = ['Preparing', 'Dispatched', 'Delivered']
  return { id: `DEMO-DSP-${String(index + 1).padStart(3, '0')}`, order: `DEMO-SO-${String(801 + index).padStart(3, '0')}`, customer: `Sample Customer ${String.fromCharCode(65 + index)}`, warehouse: product.location, date: `${String(24 + index % 7).padStart(2, '0')} Oct 2026`, status: statuses[index % statuses.length], equipment: `DEMO-SER-${String(901 + index).padStart(3, '0')}, DEMO-SER-${String(951 + index).padStart(3, '0')}` }
})

const sectionLinks: Array<{ id: InventorySection; label: string; icon: typeof Boxes }> = [
  { id: 'overview', label: 'Inventory Overview', icon: Boxes },
  { id: 'products', label: 'Product Inventory', icon: Package },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { id: 'movements', label: 'Stock Movements', icon: ClipboardList },
  { id: 'reservations', label: 'Stock Reservations', icon: PackageCheck },
  { id: 'dispatch', label: 'Dispatch Management', icon: Truck },
  { id: 'alerts', label: 'Low-stock Alerts', icon: Sun },
]

const warehouses = ['North Demo Warehouse', 'Central Demo Depot', 'South Demo Storage'].map((name) => {
  const stock = products.filter((product) => product.location === name)
  return {
    name,
    location: name === 'North Demo Warehouse' ? 'Sample Industrial Zone · Demo City' : name === 'Central Demo Depot' ? 'Example Logistics Park · Demo City' : 'Illustrative South District · Demo Town',
    productCount: stock.length,
    available: stock.reduce((sum, product) => sum + product.available, 0),
    reserved: stock.reduce((sum, product) => sum + product.reserved, 0),
  }
})

function DemoNotice() {
  return <div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">All products, warehouses, movements, reservations, dispatches, customers, quantities and serials are illustrative. Search, filters and previews operate on local demo data only; no record is sent to an API or saved to PostgreSQL. Sample status labels are not a backend contract.</div>
}

function InventoryMetric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Boxes }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-app-text">{value.toLocaleString()}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">Illustrative demo figure</p></Card>
}

function stockStatus(product: Product) {
  if (product.available === 0) return 'Out of stock'
  if (product.available < product.reorderLevel) return 'Low stock'
  return 'Healthy'
}

function StockBadge({ status }: { status: string }) {
  const tone = status === 'Healthy' || status === 'Delivered' || status === 'Released' ? 'success' : status === 'Low stock' || status === 'Preparing' || status === 'Active' ? 'warning' : status === 'Out of stock' ? 'danger' : 'info'
  return <Badge tone={tone}>{status}</Badge>
}

function PaginatedInventoryTable<T extends { id: string }>({ records, columns, searchText, searchPlaceholder, filterLabel, filterOptions, filterValue, emptyMessage, ariaLabel }: {
  records: T[]
  columns: InventoryColumn<T>[]
  searchText: (record: T) => string
  searchPlaceholder: string
  filterLabel: string
  filterOptions: TableFilter[]
  filterValue: (record: T) => string
  emptyMessage: string
  ariaLabel: string
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const filteredRecords = records.filter((record) => searchText(record).toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || filterValue(record) === filter))
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize)

  return <Card className="overflow-hidden">
    <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(14rem,1fr)_auto]"><Input label={`Search ${ariaLabel.toLowerCase()}`} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={searchPlaceholder} /><Select label={filterLabel} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }}><option value="all">All</option>{filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div>
    {visibleRecords.length > 0 ? <Table><TableHead><tr>{columns.map((column) => <TableHeader key={column.key}>{column.label}</TableHeader>)}</tr></TableHead><TableBody>{visibleRecords.map((record) => <TableRow key={record.id}>{columns.map((column) => <TableCell key={column.key}>{column.render(record)}</TableCell>)}</TableRow>)}</TableBody></Table> : <div className="p-8 text-center text-sm text-muted">{emptyMessage}</div>}
    <Pagination currentPage={page} pageSize={pageSize} totalCount={filteredRecords.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} label={ariaLabel} />
  </Card>
}

export function InventoryDashboard() {
  const [section, setSection] = useState<InventorySection>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [detail, setDetail] = useState<{ title: string; description: string; fields: Array<[string, string]> } | null>(null)
  const availableStock = products.reduce((sum, product) => sum + product.available, 0)
  const reservedStock = products.reduce((sum, product) => sum + product.reserved, 0)
  const lowStock = products.filter((product) => product.available < product.reorderLevel)
  const pendingReceipts = 3
  const pendingDispatches = dispatches.filter((dispatch) => dispatch.status !== 'Delivered').length

  const productColumns: InventoryColumn<Product>[] = [
    { key: 'product', label: 'Product', render: (product) => <><span className="font-semibold">{product.id}</span><span className="mt-1 block">{product.name}</span></> },
    { key: 'category', label: 'Category', render: (product) => product.category },
    { key: 'sku', label: 'SKU', render: (product) => <span className="font-mono text-xs">{product.sku}</span> },
    { key: 'available', label: 'Available', render: (product) => product.available },
    { key: 'reserved', label: 'Reserved', render: (product) => product.reserved },
    { key: 'total', label: 'Total', render: (product) => product.available + product.reserved },
    { key: 'location', label: 'Warehouse / location', render: (product) => product.location },
    { key: 'status', label: 'Stock status', render: (product) => <StockBadge status={stockStatus(product)} /> },
    { key: 'action', label: 'Actions', render: (product) => <Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setDetail({ title: product.name, description: 'Illustrative product record and stock summary.', fields: [['Product ID', product.id], ['Category', product.category], ['SKU', product.sku], ['Available quantity', String(product.available)], ['Reserved quantity', String(product.reserved)], ['Total quantity', String(product.available + product.reserved)], ['Warehouse', product.location], ['Illustrative reorder level', String(product.reorderLevel)] ] })}>Details</Button> },
  ]

  const movementColumns: InventoryColumn<StockMovement>[] = [
    { key: 'date', label: 'Movement date', render: (movement) => movement.date },
    { key: 'product', label: 'Product', render: (movement) => <><span className="font-semibold">{movement.productId}</span><span className="mt-1 block">{movement.product}</span></> },
    { key: 'quantity', label: 'Quantity', render: (movement) => movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity },
    { key: 'type', label: 'Movement type', render: (movement) => movement.type },
    { key: 'reference', label: 'Reference', render: (movement) => movement.reference },
    { key: 'location', label: 'Location', render: (movement) => movement.location },
  ]

  const reservationColumns: InventoryColumn<Reservation>[] = [
    { key: 'reservation', label: 'Reservation ID', render: (reservation) => <span className="font-semibold">{reservation.id}</span> },
    { key: 'order', label: 'Sales order', render: (reservation) => reservation.order },
    { key: 'product', label: 'Product', render: (reservation) => <><span className="font-semibold">{reservation.productId}</span><span className="mt-1 block">{reservation.product}</span></> },
    { key: 'quantity', label: 'Reserved quantity', render: (reservation) => reservation.quantity },
    { key: 'warehouse', label: 'Warehouse', render: (reservation) => reservation.warehouse },
    { key: 'date', label: 'Reserved on', render: (reservation) => reservation.reservedOn },
    { key: 'status', label: 'Reservation status', render: (reservation) => <StockBadge status={reservation.status} /> },
  ]

  const dispatchColumns: InventoryColumn<Dispatch>[] = [
    { key: 'dispatch', label: 'Dispatch ID', render: (dispatch) => <span className="font-semibold">{dispatch.id}</span> },
    { key: 'order', label: 'Sales order', render: (dispatch) => dispatch.order },
    { key: 'customer', label: 'Customer', render: (dispatch) => dispatch.customer },
    { key: 'warehouse', label: 'Warehouse', render: (dispatch) => dispatch.warehouse },
    { key: 'date', label: 'Dispatch date', render: (dispatch) => dispatch.date },
    { key: 'status', label: 'Dispatch status', render: (dispatch) => <StockBadge status={dispatch.status} /> },
    { key: 'equipment', label: 'Equipment / serial summary', render: (dispatch) => <span className="font-mono text-xs">{dispatch.equipment}</span> },
    { key: 'action', label: 'Actions', render: (dispatch) => <Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setDetail({ title: `Dispatch ${dispatch.id}`, description: 'Illustrative dispatch details; no goods were dispatched.', fields: [['Sales order', dispatch.order], ['Customer', dispatch.customer], ['Warehouse', dispatch.warehouse], ['Dispatch date', dispatch.date], ['Sample status', dispatch.status], ['Equipment and serials', dispatch.equipment]] })}>Preview</Button> },
  ]

  const overview = () => <>
    <PageHeader eyebrow="Inventory workspace" title="Inventory Overview" description="Illustrative stock, reservations, receipts, and dispatch summary." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <InventoryMetric label="Total products" value={products.length} icon={Package} />
      <InventoryMetric label="Available stock" value={availableStock} icon={Boxes} />
      <InventoryMetric label="Reserved stock" value={reservedStock} icon={PackageCheck} />
      <InventoryMetric label="Low-stock products" value={lowStock.length} icon={Sun} />
      <InventoryMetric label="Pending stock receipts" value={pendingReceipts} icon={ClipboardList} />
      <InventoryMetric label="Pending dispatches" value={pendingDispatches} icon={Truck} />
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="font-semibold text-app-text">Low-stock alerts</h2><p className="mt-1 text-sm text-muted">Illustrative products below sample reorder levels</p><ul className="mt-4 space-y-3">{lowStock.slice(0, 5).map((product) => <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/5 p-3"><span><span className="block font-medium text-app-text">{product.name}</span><span className="mt-1 block text-xs text-muted">{product.available} available · sample threshold {product.reorderLevel}</span></span><StockBadge status={stockStatus(product)} /></li>)}</ul></Card><Card className="p-5"><h2 className="font-semibold text-app-text">Warehouse stock summary</h2><p className="mt-1 text-sm text-muted">Sample on-hand counts by demo location</p><ul className="mt-4 space-y-3">{warehouses.map((warehouse) => <li key={warehouse.name} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0"><span className="font-medium text-app-text">{warehouse.name}</span><span className="text-right text-sm text-muted">{warehouse.available} available · {warehouse.reserved} reserved</span></li>)}</ul><Button variant="tertiary" className="mt-2 px-0" onClick={() => setSection('warehouses')}>View warehouses <ChevronRight aria-hidden="true" className="size-4" /></Button></Card></div>
  </>

  const productPage = () => <><PageHeader eyebrow="Inventory workspace" title="Product Inventory" description="Search and filter the illustrative product stock list." /><PaginatedInventoryTable records={products} columns={productColumns} searchText={(product) => `${product.id} ${product.name} ${product.category} ${product.sku} ${product.location} ${stockStatus(product)}`} searchPlaceholder="ID, name, category, SKU or location" filterLabel="Filter by category" filterOptions={[...new Set(products.map((product) => product.category))].map((category) => ({ value: category, label: category }))} filterValue={(product) => product.category} emptyMessage="No sample products match this search or category." ariaLabel="Product inventory pages" /></>

  const warehousePage = () => <><PageHeader eyebrow="Inventory workspace" title="Warehouse Management" description="Illustrative storage locations and sample stock totals." /><div className="grid gap-4 xl:grid-cols-3">{warehouses.map((warehouse) => <Card key={warehouse.name} className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-app-text">{warehouse.name}</h2><p className="mt-1 flex gap-2 text-sm text-muted"><Warehouse aria-hidden="true" className="size-4 shrink-0" />{warehouse.location}</p></div><Badge tone="brand">Demo</Badge></div><dl className="mt-5 grid grid-cols-2 gap-4"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Product count</dt><dd className="mt-1 text-2xl font-bold text-app-text">{warehouse.productCount}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Available units</dt><dd className="mt-1 text-2xl font-bold text-app-text">{warehouse.available}</dd></div><div className="col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Reserved units</dt><dd className="mt-1 text-lg font-semibold text-app-text">{warehouse.reserved}</dd></div></dl></Card>)}</div></>

  const movementsPage = () => <><PageHeader eyebrow="Inventory workspace" title="Stock Movements" description="Sample receipts, reservations, dispatches, returns, and adjustments." /><PaginatedInventoryTable records={stockMovements} columns={movementColumns} searchText={(movement) => `${movement.id} ${movement.date} ${movement.productId} ${movement.product} ${movement.type} ${movement.reference} ${movement.location}`} searchPlaceholder="Product, movement, date, reference or location" filterLabel="Filter by movement type" filterOptions={movementTypes.map((type) => ({ value: type, label: type }))} filterValue={(movement) => movement.type} emptyMessage="No sample stock movements match these filters." ariaLabel="Stock movements pages" /></>

  const reservationsPage = () => <><PageHeader eyebrow="Inventory workspace" title="Stock Reservations" description="Sample products reserved against illustrative sales orders." /><PaginatedInventoryTable records={reservations} columns={reservationColumns} searchText={(reservation) => `${reservation.id} ${reservation.order} ${reservation.productId} ${reservation.product} ${reservation.warehouse} ${reservation.status}`} searchPlaceholder="Reservation, sales order, product or warehouse" filterLabel="Filter by reservation status" filterOptions={['Active', 'Partially fulfilled', 'Released'].map((status) => ({ value: status, label: status }))} filterValue={(reservation) => reservation.status} emptyMessage="No sample reservations match these filters." ariaLabel="Stock reservations pages" /></>

  const dispatchPage = () => <><PageHeader eyebrow="Inventory workspace" title="Dispatch Management" description="Illustrative dispatch records and demo serial summaries." /><PaginatedInventoryTable records={dispatches} columns={dispatchColumns} searchText={(dispatch) => `${dispatch.id} ${dispatch.order} ${dispatch.customer} ${dispatch.warehouse} ${dispatch.date} ${dispatch.status} ${dispatch.equipment}`} searchPlaceholder="Dispatch, order, customer, warehouse or serial" filterLabel="Filter by dispatch status" filterOptions={['Preparing', 'Dispatched', 'Delivered'].map((status) => ({ value: status, label: status }))} filterValue={(dispatch) => dispatch.status} emptyMessage="No sample dispatches match these filters." ariaLabel="Dispatch records pages" /></>

  const alertsPage = () => <><PageHeader eyebrow="Inventory workspace" title="Low-stock Alerts" description="Products below illustrative reorder thresholds. These values are not live purchasing recommendations." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lowStock.map((product) => <Card key={product.id} className="border-warning/40 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">{product.id}</p><h2 className="mt-1 font-semibold text-app-text">{product.name}</h2></div><StockBadge status={stockStatus(product)} /></div><p className="mt-3 text-sm text-muted">{product.category} · {product.location}</p><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-xs text-muted">Available sample quantity</p><p className="mt-1 text-xl font-bold text-app-text">{product.available}</p></div><div><p className="text-xs text-muted">Illustrative reorder level</p><p className="mt-1 text-xl font-bold text-app-text">{product.reorderLevel}</p></div></div></Card>)}</div></>

  const content = () => {
    switch (section) {
      case 'overview': return overview()
      case 'products': return productPage()
      case 'warehouses': return warehousePage()
      case 'movements': return movementsPage()
      case 'reservations': return reservationsPage()
      case 'dispatch': return dispatchPage()
      case 'alerts': return alertsPage()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileNavOpen && <button type="button" aria-label="Close inventory navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <aside id="inventory-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-5"><span className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun aria-hidden="true" className="size-4" /></span>SolarVerse <span className="text-xs font-medium text-muted">Inventory</span></span><IconButton label="Close inventory navigation" className="lg:hidden" onClick={() => setMobileNavOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="border-b border-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Inventory manager demo</p><p className="mt-1 text-sm font-medium text-app-text">Sample manager profile</p></div>
      <nav aria-label="Inventory preview navigation" className="flex-1 space-y-1 overflow-y-auto p-3">{sectionLinks.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setMobileNavOpen(false) }} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</button>)}</nav>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">Illustrative preview · local data only</div>
    </aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6"><div className="flex items-center gap-2"><IconButton label="Open inventory navigation" aria-expanded={mobileNavOpen} aria-controls="inventory-navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Inventory manager workspace</span></div><ThemeToggle /></header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">INVENTORY MANAGER DEMO PREVIEW — NOT AUTHENTICATED</div><DemoNotice />{content()}</main>
    </div>
    <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? 'Inventory details'} description={detail?.description}>{detail && <dl className="grid gap-4 text-sm sm:grid-cols-2">{detail.fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words text-app-text">{value}</dd></div>)}</dl>}</Modal>
  </div>
}

export default InventoryDashboard
