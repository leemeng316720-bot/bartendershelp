import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-border bg-card text-muted-foreground',
        onClick && 'active:scale-95',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] text-secondary-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SectionTitle({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-end justify-between">
      <h3 className="font-display text-sm font-semibold tracking-wide text-muted-foreground">
        {children}
      </h3>
      {extra}
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground/70">{hint}</span>}
    </label>
  )
}

export function EmptyState({ icon, text, sub }: { icon: ReactNode; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-muted-foreground/50">{icon}</div>
      <p className="font-display text-sm text-muted-foreground">{text}</p>
      {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring'
