import { useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from '../ui'

export type PageSize = 10 | 20 | 50 | 100

type PaginationProps = {
  currentPage: number
  pageSize: PageSize
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
  label?: string
}

/**
 * Controlled pagination for filtered collections. Compute search and filters over the full list,
 * pass that filtered count here, and slice the filtered list for the requested current page.
 * Reuse this control for enquiries, staff/customer lists, quotations, inventory, orders,
 * service tickets, and installation history once those pages expose paginated collections.
 */
export function Pagination({ currentPage, pageSize, totalCount, onPageChange, onPageSizeChange, label = 'Table pagination' }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), pageCount)

  useEffect(() => {
    if (currentPage !== safePage) onPageChange(safePage)
  }, [currentPage, onPageChange, safePage])

  const firstItem = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const lastItem = Math.min(safePage * pageSize, totalCount)
  const pageItems: Array<number | 'ellipsis-start' | 'ellipsis-end'> = pageCount <= 7
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : safePage <= 4
      ? [1, 2, 3, 4, 5, 'ellipsis-end', pageCount]
      : safePage >= pageCount - 3
        ? [1, 'ellipsis-start', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
        : [1, 'ellipsis-start', safePage - 1, safePage, safePage + 1, 'ellipsis-end', pageCount]

  return <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:gap-4">
      <p aria-live="polite">Showing <span className="font-semibold text-app-text">{firstItem}–{lastItem}</span> of <span className="font-semibold text-app-text">{totalCount}</span></p>
      <div className="w-40"><Select label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}>{([10, 20, 50, 100] as const).map((size) => <option key={size} value={size}>{size}</option>)}</Select></div>
    </div>
    <nav aria-label={label} className="flex flex-wrap items-center gap-1">
      <button type="button" aria-label="Previous page" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1 || totalCount === 0} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-border px-2.5 text-sm font-medium text-app-text hover:bg-surface-raised focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft aria-hidden="true" className="size-4" /><span className="hidden sm:inline">Previous</span></button>
      {pageItems.map((item) => typeof item === 'number'
        ? <button key={item} type="button" aria-label={`Page ${item}`} aria-current={item === safePage ? 'page' : undefined} onClick={() => onPageChange(item)} disabled={item === safePage || totalCount === 0} className={`grid size-10 place-items-center rounded-md border text-sm font-semibold focus-visible:outline-offset-2 disabled:cursor-default ${item === safePage ? 'border-brand bg-brand text-white dark:text-gray-950' : 'border-border text-app-text hover:bg-surface-raised disabled:opacity-45'}`}>{item}</button>
        : <span key={item} aria-hidden="true" className="grid size-8 place-items-center text-muted">…</span>)}
      <button type="button" aria-label="Next page" onClick={() => onPageChange(safePage + 1)} disabled={safePage >= pageCount || totalCount === 0} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-border px-2.5 text-sm font-medium text-app-text hover:bg-surface-raised focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"><span className="hidden sm:inline">Next</span><ChevronRight aria-hidden="true" className="size-4" /></button>
    </nav>
  </div>
}

export default Pagination
