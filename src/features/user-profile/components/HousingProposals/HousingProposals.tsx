// src/features/user-profile/components/HousingProposals/HousingProposals.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { isAdresseInImmeubles } from '@/data/immeubles'
import { Download, Printer, FileSignature, Search, ChevronUp, ChevronDown, Filter, Eye, Home } from 'lucide-react'

/* ================= Types ================= */
type ProposalStatus = 'en_attente' | 'acceptee' | 'refusee' | 'expiree' | 'annulee'

export type HousingProposal = {
  id: string
  date: string // ISO
  adresse: string
  entree?: string
  appartement?: string
  nbPieces?: number
  etage?: string
  dossier?: string // nom locataire/dossier
  loyer?: number
  charges?: number
  baseLegale?: string
  remarque?: string
  gerance?: string
  telGerance?: string
  statut: ProposalStatus
}

type Density = 'comfort' | 'compact'

type Props = {
  items?: HousingProposal[]            // dataset optionnel (sinon DEMO interne)
  densityDefault?: Density             // 'comfort' (défaut) | 'compact'
  onOpenLogementsLibres?: () => void   // callback du bouton 🔍
  onCreateBail?: (row: HousingProposal) => void
  onPrintAutorisation?: (row: HousingProposal) => void
}

/* =============== Config UI / i18n =============== */
const STATUS_CONF: Record<ProposalStatus, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-blue-100 text-blue-700' },
  acceptee:   { label: 'Acceptée',   className: 'bg-green-100 text-green-700' },
  refusee:    { label: 'Refusée',    className: 'bg-red-100 text-red-700' },
  expiree:    { label: 'Expirée',    className: 'bg-gray-200 text-gray-700' },
  annulee:    { label: 'Annulée',    className: 'bg-orange-100 text-orange-700' },
}

const fmtDateCH = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-CH')
}
const fmtMoneyCH = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString('fr-CH', { minimumFractionDigits: 0 }) : ''

/* =============== DEMO dataset (petit) =============== */
const DEMO: HousingProposal[] = [
  {
    id: 'P-240001',
    date: '2025-08-25',
    adresse: 'Rue de la Paix 12, 1000 Lausanne',
    entree: 'B',
    appartement: '3B',
    nbPieces: 3.5,
    etage: '2',
    dossier: 'Martin Sophie',
    loyer: 1450,
    charges: 180,
    baseLegale: 'LLM',
    remarque: 'Proche écoles et transports.',
    gerance: 'Gérance Du Lac',
    telGerance: '+41 21 555 12 34',
    statut: 'en_attente',
  },
  {
    id: 'P-240002',
    date: '2025-08-21',
    adresse: 'Avenue du Simplon 8, 1006 Lausanne',
    entree: 'A',
    appartement: '12',
    nbPieces: 4.5,
    etage: '4',
    dossier: 'Dupont Pierre',
    loyer: 1980,
    charges: 220,
    baseLegale: 'LLM',
    remarque: 'Vue dégagée, balcon.',
    gerance: 'Régie Centrale',
    telGerance: '+41 21 444 22 11',
    statut: 'acceptee',
  },
  {
    id: 'P-240003',
    date: '2025-08-18',
    adresse: 'Chemin des Lilas 3, 1020 Renens',
    nbPieces: 2.5,
    etage: 'RC',
    dossier: 'Keller Emma',
    loyer: 980,
    charges: 140,
    baseLegale: 'Libre marché',
    remarque: 'Rez avec jardin. Dossier refusé par usager.',
    gerance: 'Gérance Du Lac',
    telGerance: '+41 21 555 12 34',
    statut: 'refusee',
  },
]

/* =============== Petit “self-test” console =============== */
const selfTest = () => {
  try {
    console.log('Self-tests Propositions')
    console.log('✅ date fr-CH 2025-08-25 ->', fmtDateCH('2025-08-25'))
    console.log('✅ money 1980 ->', fmtMoneyCH(1980))
    console.log('✅ immeuble Rue de la Paix 12 ->', isAdresseInImmeubles('Rue de la Paix 12, 1000 Lausanne'))
  } catch (e) {
    console.warn('Self-tests failed', e)
  }
}

/* =============== Composant =============== */
const HousingProposals: React.FC<Props> = ({
  items,
  densityDefault = 'comfort',
  onOpenLogementsLibres,
  onCreateBail,
  onPrintAutorisation,
}) => {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')
  const [density, setDensity] = useState<Density>(densityDefault)
  const [sortBy, setSortBy] = useState<keyof HousingProposal>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<HousingProposal | null>(null)

  useEffect(() => {
    selfTest()
  }, [])

  const data = items?.length ? items : DEMO

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = data.filter((r) => {
      const text = [
        r.id,
        r.adresse,
        r.appartement,
        r.entree,
        r.dossier,
        r.gerance,
        r.baseLegale,
        r.remarque,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const okQuery = q === '' ? true : text.includes(q)
      const okStatus = statusFilter === 'all' ? true : r.statut === statusFilter
      return okQuery && okStatus
    })
    const sorted = [...base].sort((a, b) => {
      const va = a[sortBy]
      const vb = b[sortBy]
      let cmp = 0
      if (sortBy === 'date') {
        cmp = new Date(va as string).getTime() - new Date(vb as string).getTime()
      } else if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb
      } else {
        cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'fr')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [data, query, statusFilter, sortBy, sortDir])

  const allSelected = filtered.length > 0 && filtered.every((r) => selected[r.id])
  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev }
      filtered.forEach((r) => (next[r.id] = checked))
      return next
    })

  const rowPadding = density === 'compact' ? 'py-1.5 text-[13px]' : 'py-2.5'
  const cellPad = density === 'compact' ? 'px-2' : 'px-3'

  const openDrawer = (row: HousingProposal) => {
    setCurrent(row)
    setOpen(true)
  }

  const triggerLogementsLibres = () => {
    if (onOpenLogementsLibres) return onOpenLogementsLibres()
    toast({ title: 'Démo', description: 'Ouverture de la recherche des logements libres…' })
  }

  const printAutorisation = (row: HousingProposal) => {
    if (onPrintAutorisation) return onPrintAutorisation(row)
    toast({ title: 'Impression', description: `Autorisation pour ${row.dossier} — démo.` })
  }

  const createBail = (row: HousingProposal) => {
    if (onCreateBail) return onCreateBail(row)
    toast({ title: 'Créer bail', description: `Création de bail pour ${row.dossier} — démo.` })
  }

  const exportCSV = () => {
    const header = [
      'ID','Date','Adresse','Entrée','Appartement','Nb pièces','Étage',
      'Dossier','Loyer','Charges','Base légale','Remarque','Gérance','Téléphone','Statut','ImmeubleValide'
    ]
    const rows = filtered.map((r) => [
      r.id,
      fmtDateCH(r.date),
      r.adresse,
      r.entree ?? '',
      r.appartement ?? '',
      r.nbPieces ?? '',
      r.etage ?? '',
      r.dossier ?? '',
      r.loyer ?? '',
      r.charges ?? '',
      r.baseLegale ?? '',
      (r.remarque ?? '').replace(/\n/g, ' '),
      r.gerance ?? '',
      r.telGerance ?? '',
      STATUS_CONF[r.statut].label,
      isAdresseInImmeubles(r.adresse) ? 'oui' : 'non',
    ])
    const csv = [header, ...rows].map((a) =>
      a.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `propositions_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Export CSV', description: `${filtered.length} lignes exportées.` })
  }

  const SortHeader: React.FC<{ col: keyof HousingProposal; label: string }> = ({ col, label }) => {
    const active = sortBy === col
    const dir = active ? sortDir : undefined
    return (
      <button
        className={`flex items-center gap-1 ${cellPad} ${rowPadding} font-medium text-slate-700 hover:underline`}
        onClick={() => {
          if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
          else {
            setSortBy(col)
            setSortDir('asc')
          }
        }}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        aria-label={`Trier par ${label}`}
      >
        <span>{label}</span>
        {active ? (dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
      </button>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">🏠 Propositions de logement</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} aria-label="Exporter CSV">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={triggerLogementsLibres} aria-label="Rechercher logements libres">
              <Home className="h-4 w-4 mr-1" /> Logements libres
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              aria-label="Recherche plein texte"
              placeholder="Recherche (adresse, dossier, gérance, remarque)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger aria-label="Filtrer par statut">
              <Filter className="h-4 w-4 mr-1 text-slate-500" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="acceptee">Acceptée</SelectItem>
              <SelectItem value="refusee">Refusée</SelectItem>
              <SelectItem value="expiree">Expirée</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
            </SelectContent>
          </Select>

          <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
            <SelectTrigger aria-label="Densité d’affichage">
              <SelectValue placeholder="Densité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfort">Confort</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <ScrollArea className="max-h-[480px]">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 z-10">
                <TableRow>
                  <TableHead className={`${cellPad} ${rowPadding}`}>
                    <input
                      aria-label="Tout sélectionner"
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.currentTarget.checked)}
                    />
                  </TableHead>
                  <TableHead><SortHeader col="date" label="Date" /></TableHead>
                  <TableHead><SortHeader col="adresse" label="Adresse" /></TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>Entrée</TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>App.</TableHead>
                  <TableHead><SortHeader col="nbPieces" label="Pièces" /></TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>Étage</TableHead>
                  <TableHead><SortHeader col="dossier" label="Locataire/Dossier" /></TableHead>
                  <TableHead className="text-right"><SortHeader col="loyer" label="Loyer" /></TableHead>
                  <TableHead className="text-right"><SortHeader col="charges" label="Charges" /></TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>Base légale</TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>Remarque</TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>Gérance</TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>Téléphone</TableHead>
                  <TableHead><SortHeader col="statut" label="Statut" /></TableHead>
                  <TableHead className={`${cellPad} ${rowPadding}`}>ID</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((r) => {
                  const okImmeuble = isAdresseInImmeubles(r.adresse)
                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50">
                      <TableCell className={`${cellPad} ${rowPadding}`}>
                        <input
                          aria-label={`Sélectionner ${r.id}`}
                          type="checkbox"
                          checked={!!selected[r.id]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [r.id]: e.currentTarget.checked }))
                          }
                        />
                      </TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{fmtDateCH(r.date)}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>
                        <span
                          title={r.adresse}
                          className={`inline-flex items-center gap-1 ${okImmeuble ? '' : 'text-amber-700'}`}
                        >
                          {r.adresse}
                          {!okImmeuble && (
                            <Badge variant="secondary" className="text-[10px]">Non référencé</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.entree ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.appartement ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.nbPieces ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.etage ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.dossier ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding} text-right`}>{fmtMoneyCH(r.loyer)}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding} text-right`}>{fmtMoneyCH(r.charges)}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.baseLegale ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>
                        <span className="truncate inline-block max-w-[24ch]" title={r.remarque}>{r.remarque ?? '—'}</span>
                      </TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.gerance ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>{r.telGerance ?? '—'}</TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>
                        <Badge className={STATUS_CONF[r.statut].className}>{STATUS_CONF[r.statut].label}</Badge>
                      </TableCell>
                      <TableCell className={`${cellPad} ${rowPadding}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openDrawer(r)}
                          aria-label={`Ouvrir ${r.id}`}
                        >
                          <Eye className="h-4 w-4" /> {r.id}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-10 text-slate-500">
                      Aucun résultat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Drawer détail */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Détail — {current?.id}</DrawerTitle>
            <DrawerDescription>{current?.adresse}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => current && printAutorisation(current)}>
                <Printer className="h-4 w-4 mr-1" /> Imprimer autorisation
              </Button>
              <Button variant="outline" size="sm" onClick={() => current && createBail(current)}>
                <FileSignature className="h-4 w-4 mr-1" /> Créer bail
              </Button>
            </div>

            <Tabs defaultValue="infos" className="mt-4">
              <TabsList>
                <TabsTrigger value="infos">Infos</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="pieces">Pièces</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="infos" className="pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Info label="Date" value={fmtDateCH(current?.date)} />
                  <Info label="Adresse" value={current?.adresse} />
                  <Info label="Entrée" value={current?.entree} />
                  <Info label="Appartement" value={current?.appartement} />
                  <Info label="Pièces" value={current?.nbPieces} />
                  <Info label="Étage" value={current?.etage} />
                  <Info label="Dossier" value={current?.dossier} />
                  <Info label="Loyer" value={fmtMoneyCH(current?.loyer)} alignRight />
                  <Info label="Charges" value={fmtMoneyCH(current?.charges)} alignRight />
                  <Info label="Base légale" value={current?.baseLegale} />
                  <Info label="Gérance" value={current?.gerance} />
                  <Info label="Téléphone" value={current?.telGerance} />
                  <Info label="Statut" value={current ? STATUS_CONF[current.statut].label : ''} />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="pt-3">
                <p className="text-sm text-slate-600">Timeline à brancher (événements du logement).</p>
              </TabsContent>

              <TabsContent value="pieces" className="pt-3">
                <p className="text-sm text-slate-600">Pièces liées (GED) — à brancher.</p>
              </TabsContent>

              <TabsContent value="notes" className="pt-3">
                <p className="text-sm text-slate-600">Notes internes — à brancher.</p>
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </Card>
  )
}

const Info: React.FC<{ label: string; value?: React.ReactNode; alignRight?: boolean }> = ({ label, value, alignRight }) => (
  <div className="flex justify-between gap-3">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium ${alignRight ? 'text-right min-w-[6ch]' : ''}`}>{value ?? '—'}</span>
  </div>
)

export default HousingProposals
