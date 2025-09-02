// src/components/TenantPill.tsx
import React from "react"
import { Link } from "react-router-dom"

type Props = {
  active?: boolean
  to?: string
  className?: string
  children?: React.ReactNode
}

const base =
  "inline-flex items-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1.5 text-sm font-medium"

const activeCls =
  "bg-green-500 text-white border-green-500 hover:bg-green-600 focus:ring-green-600"
const inactiveCls =
  "text-slate-400 bg-slate-50 border-slate-200"

const TenantPill: React.FC<Props> = ({
  active = false,
  to,
  className = "",
  children = "Locataire",
}) => {
  const cls = `${base} ${active ? activeCls : inactiveCls} ${className}`

  return to ? (
    <Link to={to} className={cls}>
      <span>{children}</span>
    </Link>
  ) : (
    <div className={cls}>
      <span>{children}</span>
    </div>
  )
}

export default TenantPill
