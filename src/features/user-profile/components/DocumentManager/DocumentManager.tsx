// src/features/user-profile/components/DocumentManager/DocumentManager.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Upload,
  Eye,
  Trash2,
  Search,
  FileText as FileTextWord,
  FileType2,
  FileImage,
  FileText as FileTextPdf,
  Mail as OutlookIcon,
} from 'lucide-react'

/* -------------------- Types -------------------- */
type DocType = 'pdf' | 'word' | 'outlook' | 'image' | 'other'

type DocumentItem = {
  id: string
  name: string
  type: DocType
  size: number // octets
  uploadedBy: string
  uploadedAt: string // ISO
  tags: string[]
  previewUrl?: string
}

type Props = {
  userId?: string
  defaultAuthor?: string
}

/* -------------------- Mock data -------------------- */
const mockDocuments: DocumentItem[] = [
  {
    id: '1',
    name: 'Contrat_Assurance.pdf',
    type: 'pdf',
    size: 1_200_000,
    uploadedBy: 'DBO',
    uploadedAt: '2025-08-20',
    tags: ['assurance', 'contrat'],
  },
  {
    id: '2',
    name: 'Lettre_Resiliation.docx',
    type: 'word',
    size: 980_000,
    uploadedBy: 'DBO',
    uploadedAt: '2025-08-15',
    tags: ['client'],
  },
  {
    id: '3',
    name: 'Convocation_Octobre.msg',
    type: 'outlook',
    size: 420_000,
    uploadedBy: 'Sophie',
    uploadedAt: '2025-08-10',
    tags: ['courrier', 'convocation'],
  },
]

/* -------------------- Utils -------------------- */
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const formatDateCH = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-CH')
}

const extToType = (filename: string): DocType => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'word'
  if (['msg', 'eml'].includes(ext)) return 'outlook'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'
  return 'other'
}

const TypeIcon: React.FC<{ type: DocType; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'pdf':
      return <FileTextPdf className={className} />
    case 'word':
      return <FileTextWord className={className} />
    case 'outlook':
      return <OutlookIcon className={className} />
    case 'image':
      return <FileImage className={className} />
    case 'other':
    default:
      return <FileType2 className={className} />
  }
}

/* -------------------- Composant principal (LISTE UNIQUEMENT) -------------------- */
const DocumentManager: React.FC<Props> = ({ userId, defaultAuthor = 'Agent' }) => {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | DocType>('all')
  const [docs, setDocs] = useState<DocumentItem[]>(mockDocuments)
  const [isDragging, setIsDragging] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Nettoyer les objectURL créés pour les previews
  useEffect(() => {
    return () => {
      docs.forEach((d) => {
        if (d.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(d.previewUrl)
      })
    }
  }, [docs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter((d) => {
      const matchesTab = tab === 'all' ? true : d.type === tab
      const text = `${d.name} ${d.uploadedBy} ${d.tags.join(' ')}`.toLowerCase()
      const matchesQuery = q === '' ? true : text.includes(q)
      return matchesTab && matchesQuery
    })
  }, [docs, tab, query])

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const additions: DocumentItem[] = []
    Array.from(files).forEach((file) => {
      const type = extToType(file.name)
      const item: DocumentItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type,
        size: file.size,
        uploadedBy: defaultAuthor,
        uploadedAt: new Date().toISOString(),
        tags: [],
        previewUrl:
          type === 'pdf' || type === 'image' ? URL.createObjectURL(file) : undefined,
      }
      additions.push(item)
    })
    setDocs((prev) => [...additions, ...prev])
    toast({ title: 'Upload terminé', description: `${additions.length} document(s) ajouté(s).` })
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = () => setIsDragging(false)

  const deleteDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast({ title: 'Document supprimé', description: 'L’élément a été retiré.' })
  }

  const ItemRow: React.FC<{ d: DocumentItem }> = ({ d }) => (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-slate-50 cursor-pointer"
      onClick={() => setPreviewDoc(d)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setPreviewDoc(d)}
      role="button"
      aria-label={`Ouvrir ${d.name}`}
    >
      <td className="p-2 w-8"><TypeIcon type={d.type} className="h-5 w-5 text-slate-600" /></td>
      <td className="p-2 font-medium">{d.name}</td>
      <td className="p-2 hidden md:table-cell">{d.uploadedBy}</td>
      <td className="p-2 hidden md:table-cell">{formatDateCH(d.uploadedAt)}</td>
      <td className="p-2 hidden md:table-cell">{formatSize(d.size)}</td>
      <td className="p-2">
        <div className="flex flex-wrap gap-1">
          {d.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
        </div>
      </td>
      <td className="p-2 text-right">
        <div className="inline-flex gap-1">
          <Button variant="outline" size="icon" aria-label="Prévisualiser" onClick={(e) => { e.stopPropagation(); setPreviewDoc(d) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Supprimer" onClick={(e) => { e.stopPropagation(); deleteDoc(d.id) }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </motion.tr>
  )

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">📁 Documents {userId ? `— ${userId}` : ''}</CardTitle>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              aria-hidden
            />
            <Button onClick={handleUploadClick} className="gap-2">
              <Upload className="h-4 w-4" /> Importer
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-col md:flex-row gap-2">
          <div className="relative md:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (nom, auteur, tag)…"
              className="pl-8"
              aria-label="Rechercher un document"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Zone Drag & Drop */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`mb-4 rounded-lg border-2 border-dashed p-6 text-sm text-center transition
            ${isDragging ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-50/40'}`}
          aria-label="Déposer des fichiers ici pour téléverser"
        >
          Glisser-déposer des fichiers ici, ou <span className="font-medium">cliquez “Importer”</span>.
        </div>

        {/* Filtres par type */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="word">Word</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="other">Autres</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-500 bg-slate-100">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="p-2 text-left">Nom</th>
                    <th className="p-2 text-left hidden md:table-cell">Auteur</th>
                    <th className="p-2 text-left hidden md:table-cell">Date</th>
                    <th className="p-2 text-left hidden md:table-cell">Taille</th>
                    <th className="p-2 text-left">Tags</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((d) => <ItemRow key={d.id} d={d} />)}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Preview */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation</DialogTitle>
            <DialogDescription>{previewDoc?.name}</DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md overflow-hidden">
                {previewDoc.type === 'pdf' && previewDoc.previewUrl ? (
                  <object
                    data={previewDoc.previewUrl}
                    type="application/pdf"
                    className="w-full h-[420px]"
                    aria-label="Aperçu PDF"
                  />
                ) : previewDoc.type === 'image' && previewDoc.previewUrl ? (
                  <img
                    src={previewDoc.previewUrl}
                    alt={previewDoc.name}
                    className="w-full h-[420px] object-contain"
                  />
                ) : (
                  <div className="h-[420px] flex items-center justify-center bg-slate-50">
                    <div className="text-center text-slate-500">
                      <TypeIcon type={previewDoc.type} className="h-10 w-10 mx-auto mb-2" />
                      Aperçu non disponible pour ce type.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm space-y-2">
                  <div><span className="text-slate-500">Nom :</span> <span className="font-medium">{previewDoc.name}</span></div>
                  <div><span className="text-slate-500">Type :</span> <span className="font-medium">{previewDoc.type.toUpperCase()}</span></div>
                  <div><span className="text-slate-500">Taille :</span> <span className="font-medium">{formatSize(previewDoc.size)}</span></div>
                  <div><span className="text-slate-500">Auteur :</span> <span className="font-medium">{previewDoc.uploadedBy}</span></div>
                  <div><span className="text-slate-500">Date :</span> <span className="font-medium">{formatDateCH(previewDoc.uploadedAt)}</span></div>
                  <div className="pt-2">
                    <span className="text-slate-500">Tags :</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {previewDoc.tags.length
                        ? previewDoc.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)
                        : <span className="text-slate-400">—</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setPreviewDoc(null)} variant="outline">Fermer</Button>
                  <Button onClick={() => window.alert('TODO: ouvrir/télécharger')}>Ouvrir</Button>
                  <Button variant="destructive" onClick={() => { deleteDoc(previewDoc.id); setPreviewDoc(null) }}>
                    <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default DocumentManager