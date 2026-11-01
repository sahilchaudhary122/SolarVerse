import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui'
import { apiErrorMessage } from '../lib/apiClient'
import { addPackageComponent, approveQuotation, createPackage, createProduct, createQuotation, createOrder, getEnquiries, getOrders, getPackage, getPackages, getProducts, getQuotations, getSurveys, type Quotation, type SolarPackage } from '../lib/api'

export function CatalogManagementPage() {
  const client = useQueryClient()
  const products = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const packages = useQuery({ queryKey: ['packages'], queryFn: getPackages })
  const [selectedPackage, setSelectedPackage] = useState('')
  const selectedPackageQuery = useQuery({ queryKey: ['package', selectedPackage], queryFn: () => getPackage(selectedPackage), enabled: Boolean(selectedPackage) })
  const createProductMutation = useMutation({ mutationFn: createProduct, onSuccess: () => { void client.invalidateQueries({ queryKey: ['products'] }) } })
  const createPackageMutation = useMutation({ mutationFn: createPackage, onSuccess: () => { void client.invalidateQueries({ queryKey: ['packages'] }) } })
  const addComponent = useMutation({ mutationFn: ({ id, product_id, quantity }: { id: string; product_id: string; quantity: number }) => addPackageComponent(id, { product_id, quantity }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['package', selectedPackage] }) } })
  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    createProductMutation.mutate({ name: String(form.get('name')).trim(), category: String(form.get('category')).trim(), tracks_serial_number: form.get('tracks_serial_number') === 'on', active: true }); event.currentTarget.reset()
  }
  function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    createPackageMutation.mutate({ name: String(form.get('name')).trim(), capacity_kw: String(form.get('capacity_kw')), system_type: String(form.get('system_type')) as 'on-grid' | 'off-grid' }); event.currentTarget.reset()
  }
  function submitComponent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    addComponent.mutate({ id: selectedPackage, product_id: String(form.get('product_id')), quantity: Number(form.get('quantity')) }); event.currentTarget.reset()
  }
  return <>
    <PageHeader eyebrow="Sales catalog" title="Products and packages" description="The canonical catalog stores product category and serial tracking, with capacity on the solar package. It does not store product price or stock count." />
    {(createProductMutation.isError || createPackageMutation.isError || addComponent.isError) && <div className="mb-4"><ErrorState description={apiErrorMessage(createProductMutation.error || createPackageMutation.error || addComponent.error)} /></div>}
    <div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="mb-4 font-semibold">Add product</h2><form onSubmit={submitProduct} className="grid gap-3 sm:grid-cols-2"><Input label="Product name" name="name" required maxLength={160} /><Input label="Category" name="category" required maxLength={80} /><label className="flex min-h-10 items-center gap-2 text-sm sm:col-span-2"><input name="tracks_serial_number" type="checkbox" className="size-4 accent-brand" />Tracks serial numbers</label><Button type="submit" loading={createProductMutation.isPending}>Create product</Button></form></Card>
      <Card className="p-5"><h2 className="mb-4 font-semibold">Add solar package</h2><form onSubmit={submitPackage} className="grid gap-3 sm:grid-cols-2"><Input label="Package name" name="name" required maxLength={120} /><Input label="Capacity (kW)" name="capacity_kw" type="number" min="0.001" step="0.001" required /><Select label="System type" name="system_type"><option value="on-grid">On-grid</option><option value="off-grid">Off-grid</option></Select><div className="flex items-end"><Button type="submit" loading={createPackageMutation.isPending}>Create package</Button></div></form></Card></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="mb-3 font-semibold">Products</h2>{products.isLoading ? <LoadingState /> : products.isError ? <ErrorState description={apiErrorMessage(products.error)} onRetry={() => void products.refetch()} /> : products.data?.length ? <Table><TableHead><tr><TableHeader>Name</TableHeader><TableHeader>Category</TableHeader><TableHeader>Serial tracked</TableHeader><TableHeader>Active</TableHeader></tr></TableHead><TableBody>{products.data.map((item) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.tracks_serial_number ? 'Yes' : 'No'}</TableCell><TableCell>{item.active ? 'Yes' : 'No'}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No products" description="Create the first catalog product." />}</Card>
      <Card className="p-5"><h2 className="mb-3 font-semibold">Solar packages</h2>{packages.isLoading ? <LoadingState /> : packages.isError ? <ErrorState description={apiErrorMessage(packages.error)} onRetry={() => void packages.refetch()} /> : packages.data?.length ? <><Table><TableHead><tr><TableHeader>Name</TableHeader><TableHeader>Capacity</TableHeader><TableHeader>Type</TableHeader><TableHeader>Components</TableHeader></tr></TableHead><TableBody>{packages.data.map((item: SolarPackage) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.capacity_kw} kW</TableCell><TableCell>{item.system_type}</TableCell><TableCell><Button variant="secondary" onClick={() => setSelectedPackage(item.id)}>View / add</Button></TableCell></TableRow>)}</TableBody></Table>{selectedPackage && <div className="mt-4 rounded-md border border-border p-4"><h3 className="font-semibold">Package components</h3>{selectedPackageQuery.data?.components?.length ? <ul className="my-3 list-inside list-disc text-sm">{selectedPackageQuery.data.components.map((component) => <li key={component.product.id}>{component.product.name} · {component.quantity}</li>)}</ul> : <p className="my-3 text-sm text-muted">No components recorded.</p>}<form onSubmit={submitComponent} className="grid gap-3 sm:grid-cols-3"><Select label="Product" name="product_id" required defaultValue=""><option value="" disabled>Select product</option>{products.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input label="Quantity" name="quantity" type="number" min="0.001" step="0.001" required /><div className="flex items-end"><Button type="submit" loading={addComponent.isPending} disabled={!products.data?.length}>Add component</Button></div></form></div>}</> : <EmptyState title="No packages" description="Create a package to define system capacity and type." />}</Card></div>
  </>
}

export function QuotationManagementPage() {
  const client = useQueryClient()
  const quotations = useQuery({ queryKey: ['quotations'], queryFn: getQuotations })
  const enquiries = useQuery({ queryKey: ['enquiries', 'quote-picker'], queryFn: () => getEnquiries() })
  const surveys = useQuery({ queryKey: ['surveys', 'quote-picker'], queryFn: () => getSurveys() })
  const packages = useQuery({ queryKey: ['packages'], queryFn: getPackages })
  const products = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const [message, setMessage] = useState('')
  const create = useMutation({ mutationFn: createQuotation, onSuccess: () => { setMessage('Quotation snapshot created. Review its supplied totals before approval.'); void client.invalidateQueries({ queryKey: ['quotations'] }) } })
  const approve = useMutation({ mutationFn: approveQuotation, onSuccess: () => { void client.invalidateQueries({ queryKey: ['quotations'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); const form = new FormData(event.currentTarget)
    const decimal = (key: string) => String(form.get(key))
    const productId = String(form.get('product_id'))
    create.mutate({ enquiry_id: String(form.get('enquiry_id')), survey_id: String(form.get('survey_id')), package_id: String(form.get('package_id')) || null,
      valid_until: String(form.get('valid_until')) || null, currency_code: String(form.get('currency_code')).toUpperCase(), subtotal_amount: decimal('subtotal_amount'), discount_amount: decimal('discount_amount'), tax_amount: decimal('tax_amount'), total_amount: decimal('total_amount'),
      lines: [{ product_id: productId || null, description_snapshot: String(form.get('description_snapshot')).trim(), quantity: decimal('quantity'), unit_price: decimal('unit_price'), discount_amount: decimal('line_discount'), tax_amount: decimal('line_tax'), line_total: decimal('line_total') }] })
  }
  return <>
    <PageHeader eyebrow="Sales" title="Quotations" description="Create Decimal snapshots only from a current approved survey. Supply all line and aggregate amounts; no tax, discount, or pricing formula is applied by the API." />
    {message && <p role="status" className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm">{message}</p>}
    {(create.isError || approve.isError) && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error || approve.error)} /></div>}
    <Card className="mb-5 p-5"><h2 className="mb-4 font-semibold">Create quotation snapshot</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Select label="Enquiry" name="enquiry_id" required defaultValue=""><option value="" disabled>Select enquiry</option>{enquiries.data?.map((item) => <option key={item.id} value={item.id}>{item.customer_name} · {item.id.slice(0, 8)}</option>)}</Select>
      <Select label="Approved survey" name="survey_id" required defaultValue=""><option value="" disabled>Select survey</option>{surveys.data?.filter((item) => item.status === 'approved' && item.is_current).map((item) => <option key={item.id} value={item.id}>{item.id.slice(0, 8)} · enquiry {item.enquiry_id.slice(0, 8)}</option>)}</Select>
      <Select label="Package (optional)" name="package_id" defaultValue=""><option value="">No package</option>{packages.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      <Input label="Valid until" name="valid_until" type="date" /><Input label="Currency" name="currency_code" defaultValue="INR" required minLength={3} maxLength={3} />
      <Select label="Product (optional)" name="product_id" defaultValue=""><option value="">Custom line</option>{products.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      <Input label="Line description" name="description_snapshot" required /><Input label="Quantity" name="quantity" type="number" min="0.001" step="0.001" defaultValue="1" required />
      <Input label="Unit price" name="unit_price" type="number" min="0" step="0.01" required /><Input label="Line discount" name="line_discount" type="number" min="0" step="0.01" defaultValue="0" required /><Input label="Line tax" name="line_tax" type="number" min="0" step="0.01" defaultValue="0" required /><Input label="Line total (supplied)" name="line_total" type="number" min="0" step="0.01" required />
      <Input label="Subtotal (supplied)" name="subtotal_amount" type="number" min="0" step="0.01" required /><Input label="Discount total (supplied)" name="discount_amount" type="number" min="0" step="0.01" defaultValue="0" required /><Input label="Tax total (supplied)" name="tax_amount" type="number" min="0" step="0.01" defaultValue="0" required /><Input label="Total (supplied)" name="total_amount" type="number" min="0" step="0.01" required />
      <div className="flex items-end"><Button type="submit" loading={create.isPending}>Save draft quotation</Button></div>
    </form><p className="mt-3 text-xs text-muted">Check arithmetic and commercial terms before submission. The current API does not reconcile line totals with aggregate totals.</p></Card>
    {quotations.isLoading ? <LoadingState /> : quotations.isError ? <ErrorState description={apiErrorMessage(quotations.error)} onRetry={() => void quotations.refetch()} /> : quotations.data?.length ? <Card><Table><TableHead><tr><TableHeader>Quotation</TableHeader><TableHeader>Enquiry</TableHeader><TableHeader>Version</TableHeader><TableHeader>Status</TableHeader><TableHeader>Total</TableHeader><TableHeader>Action</TableHeader></tr></TableHead><TableBody>{quotations.data.map((row: Quotation) => <TableRow key={row.id}><TableCell className="font-mono text-xs">{row.id.slice(0, 8)}</TableCell><TableCell className="font-mono text-xs">{row.enquiry_id.slice(0, 8)}</TableCell><TableCell>{row.version}</TableCell><TableCell><Badge>{row.status}</Badge></TableCell><TableCell>{row.currency_code} {row.total_amount}</TableCell><TableCell>{row.status !== 'approved' && <Button variant="secondary" onClick={() => approve.mutate(row.id)} loading={approve.isPending}>Approve</Button>}</TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyState title="No quotations" description="Create a quote after a survey is approved and current." />}
  </>
}

export function OrderManagementPage() {
  const client = useQueryClient()
  const orders = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const quotations = useQuery({ queryKey: ['quotations', 'order-picker'], queryFn: getQuotations })
  const create = useMutation({ mutationFn: createOrder, onSuccess: () => { void client.invalidateQueries({ queryKey: ['orders'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); create.mutate(String(form.get('quotation_id'))) }
  return <>
    <PageHeader eyebrow="Sales" title="Sales orders" description="Create an order from an approved quotation. The backend copies the approved quotation snapshots and does not collect a payment here." />
    {create.isError && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error)} /></div>}
    <Card className="mb-5 p-5"><h2 className="mb-3 font-semibold">Convert approved quotation</h2><form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end"><Select label="Approved quotation" name="quotation_id" required defaultValue="" className="sm:min-w-96"><option value="" disabled>Select approved quotation</option>{quotations.data?.filter((item) => item.status === 'approved').map((item) => <option key={item.id} value={item.id}>{item.id.slice(0, 8)} · {item.currency_code} {item.total_amount}</option>)}</Select><Button type="submit" loading={create.isPending}>Create sales order</Button></form></Card>
    {orders.isLoading ? <LoadingState /> : orders.isError ? <ErrorState description={apiErrorMessage(orders.error)} onRetry={() => void orders.refetch()} /> : orders.data?.length ? <Card><Table><TableHead><tr><TableHeader>Order</TableHeader><TableHeader>Quotation</TableHeader><TableHeader>Status</TableHeader><TableHeader>Total</TableHeader><TableHeader>Created</TableHeader></tr></TableHead><TableBody>{orders.data.map((row) => <TableRow key={row.id}><TableCell className="font-mono text-xs">{row.id}</TableCell><TableCell className="font-mono text-xs">{row.quotation_id.slice(0, 8)}</TableCell><TableCell>{row.status}</TableCell><TableCell>{row.currency_code} {row.total_amount}</TableCell><TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyState title="No orders" description="An order appears after conversion from an approved quotation." />}
  </>
}
