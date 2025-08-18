import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, X, Paperclip, Upload, Trash2, Check, ChevronDown } from 'lucide-react';
import { parse, format } from 'date-fns';

// ------------------------------------------------------------
// Types d'API (à brancher en prod)
// ------------------------------------------------------------
export type SearchUserByNSS = (nssDigits: string) => Promise<
  { status: 'found'; user: { nss: string; nom: string; prenom: string; dateNaissance: string; adresse: string; email?: string } } |
  { status: 'not_found' }
>;
export type SearchMotifs = (query: string) => Promise<string[]>;
export type SaveEntry = (payload: any) => Promise<{ id: string }>;

export type NewEntryModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  searchUserByNSS?: SearchUserByNSS;
  searchMotifs?: SearchMotifs;
  saveEntry?: SaveEntry;
};

// ------------------------------------------------------------
// Utilitaires
// ------------------------------------------------------------
const DRAFT_KEY = 'journal:new-entry-draft';

const normalizeNSS = (value: string) => (value.match(/\d/g) || []).join('').slice(0, 13);
const isNSSComplete = (digits: string) => digits.length === 13;

const parseDate = (str: string) => parse(str, 'dd.MM.yyyy', new Date());
const isValidDate = (str: string) => {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(str)) return false;
  const d = parseDate(str);
  return !isNaN(d.getTime());
};

const todayStr = () => format(new Date(), 'dd.MM.yyyy');

const deriveNpaVille = (adresse: string) => {
  const m = adresse.match(/,(\s*)?(\d{4})\s+(.+)$/);
  if (!m) return { npa: '', ville: '' };
  return { npa: m[2] || '', ville: m[3] || '' };
};

const motifSynonyms: Record<string, string> = {
  'maj': 'Mise à jour',
  'mise a jour': 'Mise à jour',
  'mise à jour': 'Mise à jour',
  'update': 'Mise à jour',
  'inscription': 'Inscription',
  'renouvellement': 'Renouvellement',
  'controle': 'Contrôle',
  'contrôle': 'Contrôle',
  'resiliation': 'Résiliation',
  'résiliation': 'Résiliation',
};
const normalizeMotif = (raw: string) => {
  const k = raw.trim().toLowerCase();
  return motifSynonyms[k] || (raw ? raw.replace(/\s+/g, ' ').replace(/^\w/, c => c.toUpperCase()) : '');
};

const VOIES = ['Guichet', 'Courrier', 'Email', 'Jaxform', 'Collaborateur'] as const;
const PRIORITES = ['Basse', 'Moyenne', 'Haute'] as const;

const localMotifKeywords = ['Inscription', 'Renouvellement', 'Mise à jour', 'Contrôle', 'Résiliation', 'Préfecture', 'Gérance'];

// ------------------------------------------------------------
// Mocks API (démo)
// ------------------------------------------------------------
export const mockSearchUserByNSS: SearchUserByNSS = async (nss) => {
  // Cas démo must-have
  if (nss === normalizeNSS('756.6233.8349.64')) {
    return {
      status: 'found',
      user: {
        nss: '756.6233.8349.64',
        nom: 'BOTUNA',
        prenom: 'Eonga Derval',
        dateNaissance: '21.12.1995',
        adresse: 'Avenue de Morges 58, 1004 Lausanne',
        email: 'derval.botuna@gmail.com',
      },
    };
  }
  return { status: 'not_found' };
};

export const mockSearchMotifs: SearchMotifs = async (q) => {
  if (!q) return localMotifKeywords;
  const lq = q.toLowerCase();
  return localMotifKeywords.filter((m) => m.toLowerCase().includes(lq));
};

export const mockSaveEntry: SaveEntry = async (payload) => {
  // Simule un ID serveur
  return { id: 'ENT-' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0') };
};

// ------------------------------------------------------------
// Composant Combobox (Voie)
// ------------------------------------------------------------
const Combobox: React.FC<{ value?: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }>
  = ({ value, onChange, options, placeholder }) => {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {value || placeholder || 'Choisir'}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandList>
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    onSelect={() => { onChange(opt); setOpen(false); }}
                  >
                    {opt}
                    {value === opt && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

// ------------------------------------------------------------
// Modal Nouvelle Entrée
// ------------------------------------------------------------
export const NewEntryModal: React.FC<NewEntryModalProps> = ({ open, onOpenChange, searchUserByNSS = mockSearchUserByNSS, searchMotifs = mockSearchMotifs, saveEntry = mockSaveEntry }) => {
  const { toast } = useToast?.() || { toast: (args: any) => alert(args?.description || args?.title) } as any;

  // --- États principaux ---
  type Mode = 'idle' | 'searching' | 'found' | 'manual' | 'not_found';
  const [mode, setMode] = useState<Mode>('idle');

  // Usager principal
  const nssRef = useRef<HTMLInputElement | null>(null);
  const [nss, setNss] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [naissance, setNaissance] = useState(''); // JJ.MM.AAAA
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [etranger, setEtranger] = useState(false);
  const [pays, setPays] = useState('');

  // Personnes du ménage
  type Person = { nom: string; prenom: string; naissance: string; nss?: string; badge?: 'Usager existant' | 'Nouvel usager' };
  const [menage, setMenage] = useState<Person[]>([]);

  // Métadonnées
  const [dateReception, setDateReception] = useState(todayStr());
  const [motif, setMotif] = useState('');
  const [motifInput, setMotifInput] = useState('');
  const [voie, setVoie] = useState<string>('Guichet');
  const [assigne, setAssigne] = useState('');
  const [priorite, setPriorite] = useState<string>('Basse');
  const [observation, setObservation] = useState('');

  // Suggestions motif
  const [motifOpen, setMotifOpen] = useState(false);
  const [motifSuggestions, setMotifSuggestions] = useState<string[]>(localMotifKeywords);

  // Pièces jointes
  type Att = { name: string; size: number; type: string; file: File };
  const [attachments, setAttachments] = useState<Att[]>([]);

  // Autosave
  const saveDraft = useCallback(() => {
    const draft = {
      mode, nss, nom, prenom, naissance, email, adresse, etranger, pays,
      menage, dateReception, motif, motifInput, voie, assigne, priorite, observation,
      attachmentsMeta: attachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [mode, nss, nom, prenom, naissance, email, adresse, etranger, pays, menage, dateReception, motif, motifInput, voie, assigne, priorite, observation, attachments]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(saveDraft, 3000);
    return () => clearTimeout(t);
  }, [open, saveDraft, mode, nss, nom, prenom, naissance, email, adresse, etranger, pays, menage, dateReception, motif, motifInput, voie, assigne, priorite, observation, attachments]);

  useEffect(() => {
    if (!open) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setMode(d.mode || 'idle');
        setNss(d.nss || '');
        setNom(d.nom || '');
        setPrenom(d.prenom || '');
        setNaissance(d.naissance || todayStr());
        setEmail(d.email || '');
        setAdresse(d.adresse || '');
        setEtranger(!!d.etranger);
        setPays(d.pays || '');
        setMenage(Array.isArray(d.menage) ? d.menage : []);
        setDateReception(d.dateReception || todayStr());
        setMotif(d.motif || '');
        setMotifInput(d.motifInput || '');
        setVoie(d.voie || 'Guichet');
        setAssigne(d.assigne || '');
        setPriorite(d.priorite || 'Basse');
        setObservation(d.observation || '');
      } catch {}
    }
    // autofocus NSS
    setTimeout(() => nssRef.current?.focus(), 50);
  }, [open]);

  // Ctrl/Cmd + Enter -> Valider
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [open]);
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Recherche NSS (debounce 450ms)
  useEffect(() => {
    const digits = normalizeNSS(nss);
    if (!open) return;
    if (!isNSSComplete(digits)) { if (mode !== 'manual') setMode('idle'); return; }
    setMode('searching');
    const t = setTimeout(async () => {
      try {
        const res = await searchUserByNSS(digits);
        if (res.status === 'found') {
          setMode('found');
          setNom(res.user.nom || '');
          setPrenom(res.user.prenom || '');
          setNaissance(res.user.dateNaissance || '');
          setAdresse(res.user.adresse || '');
          setEmail(res.user.email || '');
        } else {
          setMode('not_found');
        }
      } catch (e) {
        setMode('not_found');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [nss, open]);

  // Suggestions motif (local + backend)
  useEffect(() => {
    let alive = true;
    const fetchIt = async () => {
      const local = localMotifKeywords.filter(k => k.toLowerCase().includes(motifInput.toLowerCase()));
      let remote: string[] = [];
      try { if (motifInput && searchMotifs) remote = await searchMotifs(motifInput); } catch {}
      if (alive) setMotifSuggestions(Array.from(new Set([...local, ...remote])));
    };
    fetchIt();
    return () => { alive = false; };
  }, [motifInput, searchMotifs]);

  // Insertion de tags dans observation
  const insertTag = (tag: string) => {
    setObservation(prev => (prev ? `${prev} ${tag}` : tag));
  };

  // Fichiers / Drag & Drop
  const acceptExt = ['.pdf', '.msg', '.eml'];
  const onFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const accepted: Att[] = [];
    const rejected: string[] = [];
    list.forEach(file => {
      const name = file.name.toLowerCase();
      const ok = acceptExt.some(ext => name.endsWith(ext));
      if (!ok) { rejected.push(file.name); return; }
      accepted.push({ name: file.name, size: file.size, type: file.type, file });
    });
    if (rejected.length) {
      toast({ title: 'Types non supportés', description: rejected.join(', ') });
    }
    if (accepted.length) setAttachments(prev => [...prev, ...accepted]);
  };

  const removeAtt = (name: string) => setAttachments(prev => prev.filter(a => a.name !== name));

  // Loupe = reset recherche
  const resetToSearch = () => {
    setMode('idle');
    setNom(''); setPrenom(''); setNaissance(''); setEmail(''); setAdresse(''); setEtranger(false); setPays('');
    setTimeout(() => nssRef.current?.focus(), 30);
  };

  const startManual = () => {
    setMode('manual');
    setTimeout(() => nssRef.current?.focus(), 30);
  };

  // Validation
  const isUserValid = () => {
    if (mode === 'idle') return false;
    const baseOk = nom.trim() && prenom.trim() && isValidDate(naissance) && adresse.trim();
    if (!baseOk) return false;
    if (etranger && !pays.trim()) return false;
    return true;
  };

  const isHouseholdValid = () => menage.every(p => p.nom.trim() && p.prenom.trim() && isValidDate(p.naissance));

  const isMetaValid = () => {
    if (!isValidDate(dateReception)) return false;
    const m = normalizeMotif(motif || motifInput);
    if (!m) return false;
    if (!VOIES.includes(voie as any)) return false;
    if (!PRIORITES.includes(priorite as any)) return false;
    return true;
  };

  const isFilesValid = () => attachments.every(a => acceptExt.some(ext => a.name.toLowerCase().endsWith(ext)));

  const isFormValid = () => {
    const nssOk = isNSSComplete(normalizeNSS(nss)) || mode === 'manual' || mode === 'found';
    return nssOk && isUserValid() && isHouseholdValid() && isMetaValid() && isFilesValid();
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    try {
      const payload = {
        usager: { nss: normalizeNSS(nss), nom, prenom, naissance, email, adresse, etranger, pays },
        menage,
        meta: { dateReception, motif: normalizeMotif(motif || motifInput), voie, assigne, priorite, observation },
        files: attachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
      };
      const res = await saveEntry(payload);
      toast({ title: 'Entrée enregistrée', description: `ID ${res.id}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Erreur inconnue' });
    }
  };

  // UI helpers
  const { npa, ville } = deriveNpaVille(adresse || '');

  // Rendu
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" onOpenAutoFocus={(e) => { e.preventDefault(); nssRef.current?.focus(); }}>
        <DialogHeader>
          <DialogTitle>Nouvelle entrée</DialogTitle>
          <DialogDescription>Créer une tâche de journal</DialogDescription>
        </DialogHeader>

        {/* Bloc 1 — Usager */}
        <section aria-labelledby="bloc-usager" className="space-y-3">
          <h3 id="bloc-usager" className="text-sm font-medium">Usager (principal)</h3>
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 md:col-span-6">
              <label className="text-xs text-slate-600">NSS</label>
              <div className="relative">
                <Input
                  ref={nssRef}
                  value={nss}
                  onChange={(e) => setNss(e.target.value)}
                  placeholder="13 chiffres (séparateurs tolérés)"
                  aria-label="NSS"
                />
                <div className="absolute right-1 top-1.5 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={resetToSearch} title="Rechercher">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={startManual} title="Création manuelle">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {mode === 'found' && (
                <div className="mt-1 text-xs">
                  <span className="inline-block rounded bg-green-100 text-green-800 px-2 py-0.5 mr-2">Usager existant</span>
                  <span className="text-slate-600">NSS vérifié: {normalizeNSS(nss).replace(/(\d{3})(\d{4})(\d{4})(\d{2})/, '$1.$2.****.$4')}</span>
                </div>
              )}
              {mode === 'not_found' && (
                <div className="mt-1 text-xs text-amber-700">Aucun usager trouvé. Vous pouvez basculer en saisie manuelle.</div>
              )}
            </div>
          </div>

          {(mode === 'found' || mode === 'manual' || mode === 'not_found') && (
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Nom*</label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Prénom*</label>
                <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Date de naissance*</label>
                <Input placeholder="JJ.MM.AAAA" value={naissance} onChange={(e) => setNaissance(e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="col-span-12">
                <label className="text-xs text-slate-600">Adresse*</label>
                <Input placeholder="ex: Avenue de Morges 58, 1004 Lausanne" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
                <div className="mt-1 text-xs text-slate-500">NPA: <span className="font-medium">{npa || '—'}</span> • Ville: <span className="font-medium">{ville || '—'}</span></div>
              </div>
              <div className="col-span-12 md:col-span-3 flex items-center gap-2">
                <input id="etranger" type="checkbox" checked={etranger} onChange={(e) => setEtranger(e.target.checked)} />
                <label htmlFor="etranger" className="text-sm">Adresse à l’étranger</label>
              </div>
              {etranger && (
                <div className="col-span-12 md:col-span-3">
                  <label className="text-xs text-slate-600">Pays*</label>
                  <Input value={pays} onChange={(e) => setPays(e.target.value)} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Bloc 2 — Personnes du ménage */}
        <section aria-labelledby="bloc-menage" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 id="bloc-menage" className="text-sm font-medium">Personnes du ménage</h3>
            <Button variant="secondary" onClick={() => setMenage(prev => [...prev, { nom: '', prenom: '', naissance: '', nss: '' }])}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
          </div>

          {menage.map((p, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-end border rounded p-3">
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Nom*</label>
                <Input value={p.nom} onChange={(e) => setMenage(prev => prev.map((x,i) => i===idx? { ...x, nom: e.target.value }: x))} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Prénom*</label>
                <Input value={p.prenom} onChange={(e) => setMenage(prev => prev.map((x,i) => i===idx? { ...x, prenom: e.target.value }: x))} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Naissance*</label>
                <Input placeholder="JJ.MM.AAAA" value={p.naissance} onChange={(e) => setMenage(prev => prev.map((x,i) => i===idx? { ...x, naissance: e.target.value }: x))} />
              </div>
              <div className="col-span-12 md:col-span-2">
                <label className="text-xs text-slate-600">NSS (optionnel)</label>
                <Input value={p.nss || ''} onChange={(e) => {
                  const val = e.target.value;
                  setMenage(prev => prev.map((x,i) => i===idx? { ...x, nss: val }: x));
                }} />
              </div>
              <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => setMenage(prev => prev.filter((_,i) => i!==idx))}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {p.nss && normalizeNSS(p.nss).length === 13 && (
                <div className="col-span-12 text-xs">
                  {/* Vérification NSS ménage (mock) */}
                  {normalizeNSS(p.nss) === normalizeNSS('756.6233.8349.64') ? (
                    <span className="inline-block rounded bg-green-100 text-green-800 px-2 py-0.5">Usager existant</span>
                  ) : (
                    <span className="inline-block rounded bg-slate-200 text-slate-800 px-2 py-0.5">Nouvel usager</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Bloc 3 — Métadonnées */}
        <section aria-labelledby="bloc-meta" className="space-y-3">
          <h3 id="bloc-meta" className="text-sm font-medium">Métadonnées</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-3">
              <label className="text-xs text-slate-600">Date de réception</label>
              <div className="flex gap-2">
                <Input placeholder="JJ.MM.AAAA" value={dateReception} onChange={(e) => setDateReception(e.target.value)} />
                <Button type="button" variant="outline" onClick={() => setDateReception(todayStr())}>Aujourd’hui</Button>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 relative">
              <label className="text-xs text-slate-600">Motif</label>
              <Input
                value={motifInput}
                onChange={(e) => { setMotifInput(e.target.value.slice(0,60)); setMotif(normalizeMotif(e.target.value)); setMotifOpen(true); }}
                onFocus={() => setMotifOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && motifSuggestions[0]) {
                    e.preventDefault();
                    const s = motifSuggestions[0];
                    setMotifInput(s); setMotif(s); setMotifOpen(false);
                  }
                  if (e.key === 'Enter') { e.preventDefault(); setMotifOpen(false); }
                  if (e.key === 'Escape') { setMotifOpen(false); }
                }}
                placeholder="Saisir un motif (60 max)"
              />
              <div className="mt-1 text-xs text-slate-500">{motifInput.length}/60 • 5 récents mémorisés</div>
              {motifOpen && (
                <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
                  {motifSuggestions.length === 0 && <div className="p-2 text-sm text-slate-500">Aucune suggestion</div>}
                  {motifSuggestions.map((m) => (
                    <div key={m} className="px-2 py-1 text-sm hover:bg-slate-100 cursor-pointer" onMouseDown={() => { setMotifInput(m); setMotif(m); setMotifOpen(false); }}>{m}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="text-xs text-slate-600">Voie</label>
              <Combobox value={voie} onChange={setVoie} options={VOIES} />
            </div>

            <div className="col-span-6 md:col-span-1">
              <label className="text-xs text-slate-600">Assigné</label>
              <Input value={assigne} onChange={(e) => setAssigne(e.target.value.toUpperCase().slice(0,3))} placeholder="ABC" />
            </div>

            <div className="col-span-6 md:col-span-1">
              <label className="text-xs text-slate-600">Priorité</label>
              <select className="w-full rounded border p-2" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                {PRIORITES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="col-span-12">
              <label className="text-xs text-slate-600">Observation</label>
              <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ajouter une observation..." />
              <div className="mt-1 flex gap-2 text-xs">
                {['Refus', 'Incomplet', 'Dérogation'].map(t => (
                  <button key={t} type="button" onClick={() => insertTag(t)} className="rounded bg-slate-100 px-2 py-0.5 hover:bg-slate-200">{t}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bloc 4 — Pièces jointes */}
        <section aria-labelledby="bloc-files" className="space-y-3">
          <h3 id="bloc-files" className="text-sm font-medium">Pièces jointes</h3>
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            className="flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed p-6 text-slate-600"
          >
            <Upload className="h-5 w-5" />
            <div>Glissez-déposez des fichiers ici</div>
            <div className="text-xs">PDF, .msg, .eml</div>
            <label className="mt-2 inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-1.5 text-white cursor-pointer">
              <Paperclip className="h-4 w-4" />
              Sélectionner des fichiers
              <input type="file" className="hidden" multiple onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
          </div>

          {attachments.length > 0 && (
            <ul className="divide-y rounded border">
              {attachments.map(a => (
                <li key={a.name} className="flex items-center justify-between p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="font-medium">{a.name}</span>
                    <span className="text-slate-500">{(a.size/1024).toFixed(1)} KB</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAtt(a.name)}><X className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler (Esc)</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            Valider (Ctrl/⌘+Entrée)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewEntryModal;
