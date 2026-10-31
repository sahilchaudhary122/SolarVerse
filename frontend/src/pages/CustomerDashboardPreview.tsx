import { CustomerDashboard } from './CustomerDashboard'

export function CustomerDashboardPreview() {
  return <>
    <div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">CUSTOMER DEMO PREVIEW — NOT AUTHENTICATED</div>
    <CustomerDashboard />
  </>
}

export default CustomerDashboardPreview
