import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react"
import clsx from "clsx"
import { Loader2 } from "lucide-react"

/* ----------------------------- Button ----------------------------- */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-tight transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
)
Button.displayName = "Button"

/* ----------------------------- Input ----------------------------- */

interface FieldProps {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring",
          error && "border-destructive",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  ),
)
Input.displayName = "Input"

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={clsx(
          "min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring",
          error && "border-destructive",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  ),
)
Textarea.displayName = "Textarea"

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  ({ label, error, className, id, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={clsx(
          "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring",
          error && "border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  ),
)
Select.displayName = "Select"

/* ----------------------------- Badge ----------------------------- */

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline" | "accent"

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-border text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
}

export function Badge({ variant = "default", className, children }: { variant?: BadgeVariant; className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium", badgeVariants[variant], className)}>
      {children}
    </span>
  )
}

/* ----------------------------- Card ----------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("rounded-2xl border border-border bg-card", className)}>{children}</div>
}

/* ------------------------- Mono eyebrow pill ------------------------- */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      {children}
    </span>
  )
}

/* ----------------------------- Loader ----------------------------- */

export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/* ----------------------------- Skeleton ----------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-muted", className)} />
}

/* ----------------------------- EmptyState ----------------------------- */

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {action}
    </div>
  )
}
