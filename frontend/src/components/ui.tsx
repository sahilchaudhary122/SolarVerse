import { useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TableHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, ChevronDown, Info, LoaderCircle, Moon, Sun, TriangleAlert, X } from 'lucide-react'
import { useTheme } from '../app/providers/themeContext'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean; icon?: ReactNode }
const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong dark:text-gray-950',
  secondary: 'border border-border bg-surface text-app-text hover:bg-surface-raised',
  tertiary: 'text-app-text hover:bg-surface-raised',
  danger: 'bg-danger text-white hover:opacity-90',
}

export function Button({ variant = 'primary', loading = false, icon, disabled, children, className = '', ...props }: ButtonProps) {
  return <button {...props} disabled={disabled || loading} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${buttonStyles[variant]} ${className}`}>
    {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : icon}
    {children}
  </button>
}

export function IconButton({ label, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button {...props} aria-label={label} title={label} className={`inline-flex size-10 items-center justify-center rounded-md text-app-text hover:bg-surface-raised disabled:opacity-50 ${className}`}>{children}</button>
}

type FieldProps = { label: string; hint?: string; error?: string; className?: string }
function FieldShell({ label, hint, error, className = '', id, children }: FieldProps & { id: string; children: ReactNode }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return <div className={`grid gap-1.5 ${className}`}>
    <label htmlFor={id} className="text-sm font-medium text-app-text">{label}</label>
    {children}
    {hint && !error && <p id={hintId} className="text-xs text-muted">{hint}</p>}
    {error && <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="size-3.5" />{error}</p>}
  </div>
}
const fieldClasses = 'min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-app-text placeholder:text-muted focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-raised'
function fieldA11y(id: string, hint?: string, error?: string) { return { 'aria-describedby': [hint && !error ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined, 'aria-invalid': Boolean(error) } }

export function Input({ label, hint, error, className, id: suppliedId, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId(); const id = suppliedId ?? generatedId
  return <FieldShell id={id} label={label} hint={hint} error={error} className={className}><input id={id} className={fieldClasses} {...fieldA11y(id, hint, error)} {...props} /></FieldShell>
}
export function Textarea({ label, hint, error, className, id: suppliedId, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId(); const id = suppliedId ?? generatedId
  return <FieldShell id={id} label={label} hint={hint} error={error} className={className}><textarea id={id} className={`${fieldClasses} min-h-24 resize-y`} {...fieldA11y(id, hint, error)} {...props} /></FieldShell>
}
export function Select({ label, hint, error, className, id: suppliedId, children, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId(); const id = suppliedId ?? generatedId
  return <FieldShell id={id} label={label} hint={hint} error={error} className={className}><select id={id} className={`${fieldClasses} appearance-none`} {...fieldA11y(id, hint, error)} {...props}>{children}</select></FieldShell>
}

export function Checkbox({ label, hint, error, className, id: suppliedId, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId(); const id = suppliedId ?? generatedId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return <div className={`grid gap-1.5 ${className ?? ''}`}><label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-app-text"><input {...props} id={id} type="checkbox" className="size-4 rounded border-border accent-brand" aria-describedby={describedBy} aria-invalid={Boolean(error)} />{label}</label>{hint && <p id={hintId} className="text-xs text-muted">{hint}</p>}{error && <p id={errorId} role="alert" className="text-xs text-danger">{error}</p>}</div>
}
export function Radio({ label, name, value, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; value: string }) {
  const id = useId()
  return <label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-app-text"><input {...props} id={id} type="radio" name={name} value={value} className="size-4 accent-brand" />{label}</label>
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}>{children}</section>
}
const badgeColors = { neutral: 'bg-surface-raised text-muted', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-danger/10 text-danger', info: 'bg-info/10 text-info', brand: 'bg-brand/10 text-brand' }
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof badgeColors }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColors[tone]}`}>{children}</span>
}
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
  return <span aria-label={name} className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent ${size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm'}`}>{initials}</span>
}
export function Divider({ className = '' }: { className?: string }) { return <hr className={`border-0 border-t border-border ${className}`} /> }

export function Modal({ open, onClose, title, children, description }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () => dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')
    focusable()?.[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const elements = focusable()
        if (!elements?.length) { event.preventDefault(); dialogRef.current?.focus(); return }
        if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus() }
        else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus() }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); previousFocus?.focus() }
  }, [open, onClose])
  if (!open) return null
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby={titleId} className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-2xl sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-lg font-bold text-app-text">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div><IconButton label="Close dialog" onClick={onClose}><X className="size-5" /></IconButton></div>
      {children}
    </div>
  </div>
}
export function ConfirmationDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', destructive = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; destructive?: boolean }) {
  return <Modal open={open} onClose={onClose} title={title} description={description}><div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></div></Modal>
}

export function Dropdown({ label, children }: { label: string; children: ReactNode }) {
  return <details className="relative"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-sm font-medium text-app-text hover:bg-surface-raised">{label}<ChevronDown aria-hidden="true" className="size-4" /></summary><div className="absolute right-0 z-50 mt-1 min-w-48 rounded-md border border-border bg-surface p-1 shadow-xl">{children}</div></details>
}

export function Table({ children, className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) { return <div className="w-full overflow-x-auto"><table {...props} className={`w-full border-collapse text-left text-sm ${className}`}>{children}</table></div> }
export function TableHead({ children }: { children: ReactNode }) { return <thead className="bg-surface-raised text-xs uppercase tracking-wide text-muted">{children}</thead> }
export function TableBody({ children }: { children: ReactNode }) { return <tbody className="divide-y divide-border">{children}</tbody> }
export function TableRow({ children }: { children: ReactNode }) { return <tr className="hover:bg-surface-raised/70">{children}</tr> }
export function TableHeader({ children, className = '' }: { children: ReactNode; className?: string }) { return <th scope="col" className={`px-4 py-3 font-semibold ${className}`}>{children}</th> }
export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) { return <td className={`px-4 py-3 text-app-text ${className}`}>{children}</td> }

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight text-app-text sm:text-3xl">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</header>
}
export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted"><ol className="flex flex-wrap items-center gap-2">{items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <a className="hover:text-brand" href={item.href}>{item.label}</a> : <span aria-current="page" className="font-medium text-app-text">{item.label}</span>}</li>)}</ol></nav>
}
export function LoadingState({ label = 'Loading' }: { label?: string }) { return <div role="status" className="flex min-h-36 items-center justify-center gap-3 text-sm text-muted"><LoaderCircle aria-hidden="true" className="size-5 animate-spin text-brand" />{label}</div> }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-surface px-6 py-8 text-center"><div><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-info/10 text-info"><Info className="size-5" /></div><h2 className="font-semibold text-app-text">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>{action && <div className="mt-4">{action}</div>}</div></div> }
export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description: string; onRetry?: () => void }) { return <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-5"><div className="flex gap-3"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" /><div><h2 className="font-semibold text-app-text">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p>{onRetry && <Button variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button>}</div></div></div> }

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  return <IconButton label={label} onClick={toggleTheme}>{theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}</IconButton>
}

