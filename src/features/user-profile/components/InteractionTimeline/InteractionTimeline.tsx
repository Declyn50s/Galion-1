import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Phone,
  Building2,
  Inbox,
  Mail,
  FileText,
  AlertTriangle,
  RefreshCcw,
  Paperclip,
  Clock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ===================== Types ===================== */
export type InteractionTypeKey =
  | 'telephone'
  | 'guichet'
  | 'courrier'
  | 'mail'
  | 'attestation'
  | 'conformite'
  | 'relance'

export type InteractionItem = {
  id: string
  type: InteractionTypeKey
  message: string
  datetime: string // ISO: 2025-08-20T09:30:00
  agent: string // nom complet ou identifiant
  attachment?: { name: string; url?: string } | null
}

type Props = {
  items?: InteractionItem[]
  initialVisible?: number // par défaut 3
  title?: string
}

/* ===================== Config UI ===================== */
const TYPE_CONFIG: Record<
  InteractionTypeKey,
  { label: string; color: string; icon: React.ReactNode }
> = {
  telephone:   { label: 'Téléphone',   color: 'border-blue-500',   icon: <Phone className="h-4 w-4" /> },
  guichet:     { label: 'Guichet',     color: 'border-green-600',  icon: <Building2 className="h-4 w-4" /> },
  courrier:    { label: 'Courrier',    color: 'border-orange-400', icon: <Inbox className="h-4 w-4" /> },
  mail:        { label: 'Mail',        color: 'border-purple-500', icon: <Mail className="h-4 w-4" /> },
  attestation: { label: 'Attestation', color: 'border-cyan-600',   icon: <FileText className="h-4 w-4" /> },
  conformite:  { label: 'Conformité',  color: 'border-red-500',    icon: <AlertTriangle className="h-4 w-4" /> },
  relance:     { label: 'Relance',     color: 'border-gray-500',   icon: <RefreshCcw className="h-4 w-4" /> },
}

/* ===================== Utils ===================== */
const formatDDMMYYYY = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

const formatHHMM = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const initials3 = (s: string) =>
  s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, 3)

/* ===================== Mock (fallback) ===================== */
const MOCK: InteractionItem[] = [
  {
    id: 'i1',
    type: 'telephone',
    message: 'Échange téléphonique au sujet des pièces manquantes.',
    datetime: '2025-08-28T10:45:00',
    agent: 'Derval',
    attachment: null,
  },
  {
    id: 'i2',
    type: 'mail',
    message: 'Accusé de réception envoyé au demandeur.',
    datetime: '2025-08-26T16:12:00',
    agent: 'Sophie Martin',
    attachment: { name: 'accuse_reception.pdf' },
  },
  {
    id: 'i3',
    type: 'guichet',
    message: 'Passage au guichet – dépôt du dossier complet.',
    datetime: '2025-08-20T09:05:00',
    agent: 'ADM Lausanne',
    attachment: null,
  },
  {
    id: 'i4',
    type: 'attestation',
    message: 'Attestation délivrée et archivée.',
    datetime: '2025-08-18T14:22:00',
    agent: 'ADM Lausanne',
    attachment: { name: 'attestation_2025.pdf' },
  },
  {
    id: 'i5',
    type: 'relance',
    message: 'Relance automatique envoyée (J+7).',
    datetime: '2025-08-12T08:00:00',
    agent: 'BOT',
  },
]

/* ===================== Composant ===================== */
const InteractionTimeline: React.FC<Props> = ({ items, initialVisible = 3, title = 'Historique des interactions' }) => {
  const data = items && items.length ? items : MOCK

  const sorted = useMemo(
    () => [...data].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()),
    [data]
  )

  const [visible, setVisible] = useState(Math.min(initialVisible, sorted.length))
  const canShowMore = visible < sorted.length

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">🧭 {title}</CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[420px] pr-2">
          <div className="relative">
            {/* Ligne verticale de la timeline */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" aria-hidden />

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {sorted.slice(0, visible).map((it) => {
                  const cfg = TYPE_CONFIG[it.type]
                  return (
                    <motion.article
                      key={it.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="relative pl-8"
                      aria-label={`${cfg.label} du ${formatDDMMYYYY(it.datetime)} à ${formatHHMM(it.datetime)}`}
                    >
                      {/* Point sur la ligne */}
                      <span
                        className="absolute left-[9px] top-2 h-3 w-3 rounded-full bg-white ring-2 ring-slate-300"
                        aria-hidden
                      />

                      <div className={`rounded-lg border bg-white ${cfg.color} border-l-4`}>
                        <div className="flex items-start gap-3 p-3">
                          <div className="mt-0.5 shrink-0 text-slate-600">{cfg.icon}</div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="font-medium text-slate-700">{cfg.label}</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDDMMYYYY(it.datetime)} — {formatHHMM(it.datetime)}
                              </span>
                              {it.attachment ? (
                                <span className="inline-flex items-center gap-1">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {it.attachment.url ? (
                                    <a
                                      href={it.attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline hover:no-underline"
                                      title="Ouvrir la pièce jointe"
                                    >
                                      {it.attachment.name}
                                    </a>
                                  ) : (
                                    <span className="text-slate-600">{it.attachment.name}</span>
                                  )}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-slate-800 break-words">
                              {it.message}
                            </p>
                          </div>

                          {/* Initiales agent (3 lettres) */}
                          <div
                            className="ml-auto rounded-md bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 select-none"
                            aria-label={`Agent ${initials3(it.agent)}`}
                            title={it.agent}
                          >
                            {initials3(it.agent)}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>

        {/* Voir plus */}
        {canShowMore && (
          <div className="mt-3 flex justify-center">
            <Button variant="outline" onClick={() => setVisible((v) => Math.min(v + 3, sorted.length))}>
              Voir plus
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default InteractionTimeline
