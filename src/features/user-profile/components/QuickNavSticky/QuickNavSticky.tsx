// src/features/user-profile/components/QuickNavSticky/QuickNavSticky.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  List,
  ChevronRight,
  User,        // 👇 pour QuickNavIcons
  Calendar,
  Users,
  Wallet,
  Clock,
  FolderOpen,
  Home,
} from 'lucide-react'

export type QuickNavItem = {
  id: string
  label: string
  icon?: React.ReactNode
  children?: QuickNavItem[]
}

type Props = {
  items: QuickNavItem[]
  offsetTop?: number
  className?: string
  /** "comfort" | "compact" | "tight" (défaut: tight) */
  size?: 'comfort' | 'compact' | 'tight'
}

/* ---- Styles par taille ---- */
const SIZES = {
  comfort: {
    width: 'max-w-[280px]',
    cardPad: 'p-2',
    areaPad: 'p-2',
    itemPad: 'px-2 py-1.5',
    label: 'text-sm',
    icon: 'h-4 w-4',
    groupGap: 'space-y-1.5',
    baseIndent: 8,
    stepIndent: 12,
  },
  compact: {
    width: 'max-w-[220px]',
    cardPad: 'p-1.5',
    areaPad: 'p-1.5',
    itemPad: 'px-2 py-1',
    label: 'text-[13px]',
    icon: 'h-3.5 w-3.5',
    groupGap: 'space-y-1',
    baseIndent: 7,
    stepIndent: 10,
  },
  tight: {
    width: 'max-w-[200px]',
    cardPad: 'p-1',
    areaPad: 'p-1',
    itemPad: 'px-1.5 py-1',
    label: 'text-[12px]',
    icon: 'h-3.5 w-3.5',
    groupGap: 'space-y-[6px]',
    baseIndent: 6,
    stepIndent: 9,
  },
} as const

const scrollToId = (id: string, offsetTop: number) => {
  const el = document.getElementById(id)
  if (!el) return
  const rect = el.getBoundingClientRect()
  const absoluteTop = window.pageYOffset + rect.top
  window.scrollTo({ top: absoluteTop - offsetTop, behavior: 'smooth' })
}

const useActiveId = (ids: string[], offsetTop: number) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { root: null, rootMargin: `-${offsetTop + 16}px 0px -60% 0px`, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [ids, offsetTop])
  return activeId
}

const QuickNavSticky: React.FC<Props> = ({ items, offsetTop = 80, className, size = 'tight' }) => {
  const S = SIZES[size]

  const flatIds = useMemo(() => {
    const acc: string[] = []
    const walk = (n: QuickNavItem) => {
      acc.push(n.id)
      n.children?.forEach(walk)
    }
    items.forEach(walk)
    return acc
  }, [items])

  const activeId = useActiveId(flatIds, offsetTop)

  return (
    <Card
      className={cn(
        'sticky top-4 h-[calc(100vh-2rem)] w-full border bg-white/90 backdrop-blur-sm shadow-sm rounded-md hidden lg:block',
        S.width,
        S.cardPad,
        className
      )}
      role="navigation"
      aria-label="Sommaire du profil"
    >
      <ScrollArea className={cn('h-full', S.areaPad)}>
        <nav className="space-y-1">
          {items.map((item) => (
            <QuickNavItemRow
              key={item.id}
              item={item}
              activeId={activeId}
              offsetTop={offsetTop}
              level={0}
              S={S}
            />
          ))}
        </nav>
      </ScrollArea>
    </Card>
  )
}

const QuickNavItemRow: React.FC<{
  item: QuickNavItem
  activeId: string | null
  offsetTop: number
  level: number
  S: typeof SIZES[keyof typeof SIZES]
}> = ({ item, activeId, offsetTop, level, S }) => {
  const isActive = activeId === item.id
  const indent = S.baseIndent + level * S.stepIndent

  return (
    <div className={S.groupGap}>
      <button
        type="button"
        onClick={() => scrollToId(item.id, offsetTop)}
        className={cn(
          'w-full inline-flex items-center justify-between rounded-md text-left transition outline-none',
          'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500',
          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700',
          S.itemPad
        )}
        style={{ paddingLeft: indent }}
        aria-current={isActive ? 'true' : 'false'}
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-slate-500">
          </span>
          <span className={cn(S.label, 'truncate')}>{item.label}</span>
        </span>
        <ChevronRight className={cn('transition', S.icon, isActive ? 'opacity-100' : 'opacity-0')} />
      </button>

      {item.children?.length ? (
        <div className="pl-0.5">
          {item.children.map((child) => (
            <QuickNavItemRow
              key={child.id}
              item={child}
              activeId={activeId}
              offsetTop={offsetTop}
              level={level + 1}
              S={S}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default QuickNavSticky

/* === Export des icônes prêtes à l’emploi pour la nav === */
export const QuickNavIcons = {
  info: <User className="h-4 w-4" />,
  dates: <Calendar className="h-4 w-4" />,
  menage: <Users className="h-4 w-4" />,
  revenus: <Wallet className="h-4 w-4" />,
  timeline: <Clock className="h-4 w-4" />,
  docs: <FolderOpen className="h-4 w-4" />,
  props: <Home className="h-4 w-4" />,
}
