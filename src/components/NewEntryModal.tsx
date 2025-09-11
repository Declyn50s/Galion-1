// src/components/NewEntryModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X, Paperclip, Upload, Trash2 } from 'lucide-react';
import { parse, format, differenceInYears } from 'date-fns';

/* ------------------------------------------------------------
   Types Journal (alignés avec Journal.tsx)
------------------------------------------------------------ */
export type Utilisateur = {
  titre: 'M.' | 'Mme' | string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO
  adresse: string;
  npa: string;
  ville: string;
  nbPers: number;
  nbEnf: number;
};

export type Tache = {
  id: string;
  dossier: string; // N° de dossier
  nss: string;
  reception: string; // ISO
  motif: 'Inscription' | 'Renouvellement' | 'Mise à jour' | 'Contrôle' | 'Résiliation' | 'Préfecture' | 'Gérance';
  voie: 'Guichet' | 'Courrier' | 'Email' | 'Jaxform' | 'Collaborateur';
  par: string; // initials agent
  observation: string;
  statut: 'À traiter' | 'En traitement' | 'En suspens' | 'Validé' | 'Refusé';
  priorite: 'Haute' | 'Moyenne' | 'Basse';
  llm: boolean;
  utilisateurs: Utilisateur[];
};

/* ------------------------------------------------------------
   API (mockables)
------------------------------------------------------------ */
export type SearchUserByNSS = (nssDigits: string) => Promise<
  { status: 'found'; user: { nss: string; nom: string; prenom: string; dateNaissance: string; adresse: string; email?: string } } |
  { status: 'not_found' }
>;
export type SaveEntry = (payload: any) => Promise<{ id: string }>;

export type NewEntryModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  searchUserByNSS?: SearchUserByNSS;
  saveEntry?: SaveEntry;
  /** Appelé après sauvegarde pour publier la tâche dans le Journal */
  onSaved?: (tache: Tache) => void;
  /** Initiales de l'agent connecté (par défaut DBO) */
  agentInitials?: string;
};

/* ------------------------------------------------------------
   Utilitaires
------------------------------------------------------------ */
const DRAFT_KEY = 'journal:new-entry-draft';

const normalizeNSS = (value: string) => (value.match(/\d/g) || []).join('').slice(0, 13);
const isNSSComplete = (digits: string) => digits.length === 13;

// Accepte "JJMMAAAA", "JJ/MM/AAAA", "JJ-MM-AAAA", "JJ.MM.AAAA", etc. -> formatte "dd.MM.yyyy"
const normalizeDateFlexible = (raw: string) => {
  const digits = (raw.match(/\d/g) || []).join('').slice(0, 8);
  if (digits.length !== 8) return raw.trim();
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${dd}.${mm}.${yyyy}`;
};
const parseDateFlexible = (raw: string) => {
  const norm = normalizeDateFlexible(raw);
  return parse(norm, 'dd.MM.yyyy', new Date());
};
const isValidDateFlexible = (raw: string) => {
  const norm = normalizeDateFlexible(raw);
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(norm)) return false;
  const d = parse(norm, 'dd.MM.yyyy', new Date());
  return !isNaN(d.getTime());
};
const toISO = (raw: string) => format(parseDateFlexible(raw), 'yyyy-MM-dd');
const todayStr = () => format(new Date(), 'dd.MM.yyyy');

const deriveNpaVille = (adresse: string) => {
  const m = adresse.match(/,(\s*)?(\d{4})\s+(.+)$/);
  if (!m) return { npa: '', ville: '' };
  return { npa: m[2] || '', ville: m[3] || '' };
};

const VOIE_OPTIONS = [
  { value: 'Guichet', label: 'Guichet', emoji: '🏢' },
  { value: 'Courrier', label: 'Courrier', emoji: '✉️' },
  { value: 'Email', label: 'Email', emoji: '📧' },
  { value: 'Jaxform', label: 'Jaxform', emoji: '🧾' },
  { value: 'Collaborateur', label: 'Collaborateur', emoji: '👤' },
] as const;

const MOTIF_OPTIONS = [
  { value: 'Inscription', emoji: '🆕' },
  { value: 'Renouvellement', emoji: '♻️' },
  { value: 'Mise à jour', emoji: '🧩' },
  { value: 'Contrôle', emoji: '🔎' },
  { value: 'Résiliation', emoji: '❌' },
  { value: 'Préfecture', emoji: '🏛️' },
  { value: 'Gérance', emoji: '🧑‍💼' },
] as const;

/* ------------------------------------------------------------
   Mocks (démo)
------------------------------------------------------------ */
export const mockSearchUserByNSS: SearchUserByNSS = async (nss) => {
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

export const mockSaveEntry: SaveEntry = async () => {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return { id: `T-${year}-${num}` };
};

/* ------------------------------------------------------------
   composant
------------------------------------------------------------ */
export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  open,
  onOpenChange,
  searchUserByNSS = mockSearchUserByNSS,
  saveEntry = mockSaveEntry,
  onSaved,
  agentInitials = 'DBO',
}) => {
  const { toast } = useToast?.() || { toast: (args: any) => alert(args?.description || args?.title) } as any;

  // --- États principaux ---
  type Mode = 'idle' | 'searching' | 'found' | 'manual' | 'not_found';
  const [mode, setMode] = useState<Mode>('idle');

  // Usager principal
  const nssRef = useRef<HTMLInputElement | null>(null);
  const [nss, setNss] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [naissance, setNaissance] = useState(''); // libre (points pas obligatoires)
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [adressePostale, setAdressePostale] = useState('');
  const [etranger, setEtranger] = useState(false);
  const [pays, setPays] = useState('');

  // Ménage (sans champ NSS par ligne pour éviter les doublons d'entrée NSS)
  type Person = { nom: string; prenom: string; naissance: string };
  const [menage, setMenage] = useState<Person[]>([]);
  // Ajout rapide via NSS (unique endroit pour entrer un NSS ménage)
  const [addNss, setAddNss] = useState('');

  // Métadonnées
  const [dateReception, setDateReception] = useState(todayStr());
  const [motif, setMotif] = useState<Tache['motif']>('Inscription');
  const [voie, setVoie] = useState<Tache['voie']>('Guichet');
  // Priorité binaire: une seule coche "Haute"
  const [prioriteHaute, setPrioriteHaute] = useState(false);

  const [observation, setObservation] = useState('');

  // Pièces jointes
  type Att = { name: string; size: number; type: string; file: File };
  const [attachments, setAttachments] = useState<Att[]>([]);

  // Draft autosave
  const saveDraft = useCallback(() => {
    const draft = {
      mode, nss, nom, prenom, naissance, email, adresse, adressePostale, etranger, pays,
      menage, dateReception, motif, voie, prioriteHaute, observation,
      attachmentsMeta: attachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [mode, nss, nom, prenom, naissance, email, adresse, adressePostale, etranger, pays, menage, dateReception, motif, voie, prioriteHaute, observation, attachments]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(saveDraft, 1200);
    return () => clearTimeout(t);
  }, [open, saveDraft, mode, nss, nom, prenom, naissance, email, adresse, adressePostale, etranger, pays, menage, dateReception, motif, voie, prioriteHaute, observation, attachments]);

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
        setNaissance(d.naissance || '');
        setEmail(d.email || '');
        setAdresse(d.adresse || '');
        setAdressePostale(d.adressePostale || '');
        setEtranger(!!d.etranger);
        setPays(d.pays || '');
        setMenage(Array.isArray(d.menage) ? d.menage : []);
        setDateReception(d.dateReception || todayStr());
        setMotif(d.motif || 'Inscription');
        setVoie(d.voie || 'Guichet');
        setPrioriteHaute(!!d.prioriteHaute);
        setObservation(d.observation || '');
      } catch {}
    }
    setTimeout(() => nssRef.current?.focus(), 50);
  }, [open]);

  // Raccourci clavier
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]); // eslint-disable-line

  // Recherche NSS (debounce 450ms) — usager principal
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
      } catch {
        setMode('not_found');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [nss, open]); // eslint-disable-line

  // Helpers UI
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
    if (rejected.length) (toast as any)({ title: 'Types non supportés', description: rejected.join(', ') });
    if (accepted.length) setAttachments(prev => [...prev, ...accepted]);
  };
  const removeAtt = (name: string) => setAttachments(prev => prev.filter(a => a.name !== name));

  const resetToSearch = () => {
    setMode('idle');
    setNom(''); setPrenom(''); setNaissance(''); setEmail(''); setAdresse(''); setAdressePostale(''); setEtranger(false); setPays('');
    setMenage([]);
    setTimeout(() => nssRef.current?.focus(), 30);
  };
  const startManual = () => {
    setMode('manual');
    setTimeout(() => nssRef.current?.focus(), 30);
  };

  // Validation
  const isUserValid = () => {
    if (mode === 'idle') return false;
    const ok = nom.trim() && prenom.trim() && isValidDateFlexible(naissance) && adresse.trim();
    if (!ok) return false;
    if (etranger && !pays.trim()) return false;
    return true;
  };
  const isHouseholdValid = () => menage.every(p => p.nom.trim() && p.prenom.trim() && isValidDateFlexible(p.naissance));
  const isMetaValid = () => {
    if (!isValidDateFlexible(dateReception)) return false;
    if (!motif) return false;
    if (!VOIE_OPTIONS.some(v => v.value === voie)) return false;
    return true;
  };
  const isFilesValid = () => attachments.every(a => acceptExt.some(ext => a.name.toLowerCase().endsWith(ext)));
  const isFormValid = () => {
    const nssOk = isNSSComplete(normalizeNSS(nss)) || mode === 'manual' || mode === 'found';
    return nssOk && isUserValid() && isHouseholdValid() && isMetaValid() && isFilesValid();
  };

  // Calculateur: titulaire/cotitulaire + majeurs/mineurs
  type PersonComputed = { nom: string; prenom: string; naissance: string; age: number; role?: 'Titulaire' | 'Cotitulaire' | 'Autre' };
  const peopleAll: PersonComputed[] = useMemo(() => {
    const base: PersonComputed[] = [];
    if (nom && prenom && isValidDateFlexible(naissance)) {
      base.push({ nom, prenom, naissance: normalizeDateFlexible(naissance), age: differenceInYears(new Date(), parseDateFlexible(naissance)) });
    }
    menage.forEach(m => {
      if (m.nom && m.prenom && isValidDateFlexible(m.naissance)) {
        base.push({ nom: m.nom, prenom: m.prenom, naissance: normalizeDateFlexible(m.naissance), age: differenceInYears(new Date(), parseDateFlexible(m.naissance)) });
      }
    });
    base.sort((a, b) => b.age - a.age);
    base.forEach((p, idx) => { p.role = idx === 0 ? 'Titulaire' : idx === 1 ? 'Cotitulaire' : 'Autre'; });
    return base;
  }, [nom, prenom, naissance, menage]);

  const enfantsMajeurs = peopleAll.filter(p => (p.role === 'Autre') && p.age >= 18);
  const enfantsMineurs = peopleAll.filter(p => (p.role === 'Autre') && p.age < 18);

  // Ajout d'un membre via NSS (sans doublon)
  const addMemberByNSS = async () => {
    const digits = normalizeNSS(addNss);
    if (!isNSSComplete(digits)) {
      (toast as any)({ title: 'NSS incomplet', description: '13 chiffres requis.' });
      return;
    }
    try {
      const res = await searchUserByNSS(digits);
      if (res.status !== 'found') {
        (toast as any)({ title: 'Introuvable', description: 'Aucun usager avec ce NSS.' });
        return;
      }
      // doublons par identité
      const existsIdentity =
        (nom.toUpperCase() === res.user.nom.toUpperCase() &&
         prenom.toUpperCase() === res.user.prenom.toUpperCase() &&
         normalizeDateFlexible(naissance) === normalizeDateFlexible(res.user.dateNaissance)) ||
        menage.some(m =>
          m.nom.toUpperCase() === res.user.nom.toUpperCase() &&
          m.prenom.toUpperCase() === res.user.prenom.toUpperCase() &&
          normalizeDateFlexible(m.naissance) === normalizeDateFlexible(res.user.dateNaissance)
        );
      if (existsIdentity) {
        (toast as any)({ title: 'Doublon', description: 'Cette personne est déjà présente.' });
        return;
      }
      setMenage(prev => [...prev, {
        nom: res.user.nom,
        prenom: res.user.prenom,
        naissance: normalizeDateFlexible(res.user.dateNaissance),
      }]);
      setAddNss('');
      (toast as any)({ title: 'Ajouté', description: `${res.user.nom} ${res.user.prenom} ajouté au ménage.` });
    } catch (e: any) {
      (toast as any)({ title: 'Erreur', description: e?.message || 'Impossible d’ajouter par NSS.' });
    }
  };

  const countKids = (births: string[]) => {
    const today = new Date();
    return births.reduce((acc, b) => {
      if (!isValidDateFlexible(b)) return acc;
      const years = differenceInYears(today, parseDateFlexible(b));
      return acc + (years < 18 ? 1 : 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      (toast as any)({ title: 'Formulaire incomplet', description: 'Vérifie les champs requis.' });
      return;
    }
    try {
      const payload = {
        usager: { nss: normalizeNSS(nss), nom, prenom, naissance: normalizeDateFlexible(naissance), email, adresse, adressePostale, etranger, pays },
        menage,
        meta: { dateReception: normalizeDateFlexible(dateReception), motif, voie, priorite: prioriteHaute ? 'Haute' : 'Normal', observation },
        files: attachments.map(a => ({ name: a.name, size: a.size, type: a.type })),
      };
      const res = await saveEntry(payload);

      // Construction TACHE pour Journal
      const { npa, ville } = deriveNpaVille(adresse || '');
      const persTotal = menage.length + 1;
      const enfants = countKids([naissance, ...menage.map(m => m.naissance)]);

      const genDossier = () => 'DOS-' + Math.floor(10000 + Math.random() * 90000);

      // Priorité mappée: Normal -> Moyenne, Haute -> Haute
      const mappedPriorite: Tache['priorite'] = prioriteHaute ? 'Haute' : 'Moyenne';

      const tit = peopleAll.find(p => p.role === 'Titulaire');
      const co = peopleAll.find(p => p.role === 'Cotitulaire');
      const obsCalc =
        `Titulaire: ${tit ? `${tit.nom.toUpperCase()} ${tit.prenom} (${tit.age} ans)` : '—'}; ` +
        `Cotitulaire: ${co ? `${co.nom.toUpperCase()} ${co.prenom} (${co.age} ans)` : '—'}; ` +
        `Majeurs: ${enfantsMajeurs.length}${enfantsMajeurs.length ? ' (' + enfantsMajeurs.map(p => `${p.nom.toUpperCase()} ${p.prenom}`).join(', ') + ')' : ''}; ` +
        `Mineurs: ${enfantsMineurs.length}${enfantsMineurs.length ? ' (' + enfantsMineurs.map(p => `${p.nom.toUpperCase()} ${p.prenom}`).join(', ') + ')' : ''}` +
        (adressePostale ? `; Adr. postale: ${adressePostale}` : '');

      const tache: Tache = {
        id: res.id,
        dossier: genDossier(),
        nss: normalizeNSS(nss),
        reception: toISO(dateReception),
        motif,
        voie,
        par: agentInitials || 'DBO',
        observation: observation.trim(),
        statut: 'À traiter',
        priorite: mappedPriorite,
        llm: false,
        utilisateurs: [
          {
            titre: '',
            nom,
            prenom,
            dateNaissance: toISO(naissance),
            adresse,
            npa,
            ville,
            nbPers: persTotal,
            nbEnf: enfants,
          },
          ...menage.map((p) => ({
            titre: '',
            nom: p.nom,
            prenom: p.prenom,
            dateNaissance: toISO(p.naissance),
            adresse,
            npa,
            ville,
            nbPers: persTotal,
            nbEnf: enfants,
          })),
        ],
      };

      onSaved?.(tache);
      localStorage.removeItem(DRAFT_KEY);
      (toast as any)({ title: 'Entrée enregistrée', description: `ID ${res.id}` });
      onOpenChange(false);
    } catch (e: any) {
      (toast as any)({ title: 'Erreur', description: e?.message || 'Erreur inconnue' });
    }
  };

  const { npa, ville } = deriveNpaVille(adresse || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl md:max-w-3xl max-h-[85vh] overflow-y-auto p-4"
        onOpenAutoFocus={(e) => { e.preventDefault(); nssRef.current?.focus(); }}
      >
        <DialogHeader className="sticky top-0 bg-white dark:bg-neutral-950 z-10 pb-3">
          <DialogTitle>Nouvelle entrée</DialogTitle>
          <DialogDescription>Créer une tâche de journal</DialogDescription>
        </DialogHeader>

        {/* Bloc — Usager */}
        <section aria-labelledby="bloc-usager" className="space-y-3">
          <h3 id="bloc-usager" className="text-sm font-medium">Usager (principal)</h3>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 md:col-span-8">
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
                  <Button variant="ghost" size="icon" onClick={resetToSearch} title="Rechercher" className="text-lg leading-none">🔎</Button>
                  <Button variant="ghost" size="icon" onClick={startManual} title="Création manuelle" className="text-lg leading-none">📝</Button>
                </div>
              </div>
              {mode === 'found' && (
                <div className="mt-1 text-xs">
                  <span className="inline-block rounded bg-green-100 text-green-800 px-2 py-0.5 mr-2">Usager existant</span>
                  <span className="text-slate-600">
                    NSS vérifié: {normalizeNSS(nss).replace(/(\d{3})(\d{4})(\d{4})(\d{2})/, '$1.$2.****.$4')}
                  </span>
                </div>
              )}
              {mode === 'not_found' && (
                <div className="mt-1 text-xs text-amber-700">Aucun usager trouvé. Passez en saisie manuelle si nécessaire.</div>
              )}
            </div>
          </div>

          {(mode === 'found' || mode === 'manual' || mode === 'not_found') && (
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Nom*</label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Prénom*</label>
                <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Date de naissance* (JJMMAAAA ou JJ.MM.AAAA)</label>
                <Input
                  placeholder="ex: 21011990"
                  value={naissance}
                  onChange={(e) => setNaissance(e.target.value)}
                  onBlur={() => isValidDateFlexible(naissance) && setNaissance(normalizeDateFlexible(naissance))}
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs text-slate-600">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="col-span-12">
                <label className="text-xs text-slate-600">Adresse de domicile*</label>
                <Input
                  placeholder="ex: Avenue de Morges 58, 1004 Lausanne"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
                <div className="mt-1 text-xs text-slate-500">
                  NPA: <span className="font-medium">{npa || '—'}</span> • Ville: <span className="font-medium">{ville || '—'}</span>
                </div>
              </div>

              <div className="col-span-12">
                <label className="text-xs text-slate-600">Adresse postale (optionnelle)</label>
                <Input placeholder="Si différente du domicile" value={adressePostale} onChange={(e) => setAdressePostale(e.target.value)} />
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

        {/* Bloc — Ménage */}
        <section aria-labelledby="bloc-menage" className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 id="bloc-menage" className="text-sm font-medium">Personnes du ménage</h3>
            <div className="flex items-center gap-2">
              <Input
                value={addNss}
                onChange={(e) => setAddNss(e.target.value)}
                placeholder="Ajouter par NSS (13 chiffres)"
                className="h-9 w-[220px]"
              />
              <Button variant="secondary" onClick={addMemberByNSS}>➕ Ajouter via NSS</Button>
              <Button variant="secondary" onClick={() => setMenage(prev => [...prev, { nom: '', prenom: '', naissance: '' }])}>➕ Saisir manuellement</Button>
            </div>
          </div>

          {menage.map((p, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded p-3">
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-slate-600">Nom*</label>
                <Input value={p.nom} onChange={(e) => setMenage(prev => prev.map((x,i) => i===idx? { ...x, nom: e.target.value }: x))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-slate-600">Prénom*</label>
                <Input value={p.prenom} onChange={(e) => setMenage(prev => prev.map((x,i) => i===idx? { ...x, prenom: e.target.value }: x))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-slate-600">Naissance* (JJMMAAAA ou JJ.MM.AAAA)</label>
                <Input
                  placeholder="ex: 01052010"
                  value={p.naissance}
                  onChange={(e) => setMenage(prev => prev.map((x,i) => i===idx? { ...x, naissance: e.target.value }: x))}
                  onBlur={() => setMenage(prev => prev.map((x,i) => i===idx && isValidDateFlexible(x.naissance) ? { ...x, naissance: normalizeDateFlexible(x.naissance) } : x))}
                />
              </div>
              <div className="col-span-12 md:col-span-12 flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => setMenage(prev => prev.filter((_,i) => i!==idx))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </section>

        {/* Bloc — Métadonnées */}
        <section aria-labelledby="bloc-meta" className="space-y-2">
          <h3 id="bloc-meta" className="text-sm font-medium">Métadonnées</h3>
          <div className="grid grid-cols-12 gap-2">
            {/* Réception */}
            <div className="col-span-12 md:col-span-4">
              <label className="text-xs text-slate-600">Date de réception</label>
              <div className="flex gap-2">
                <Input
                  placeholder="JJMMAAAA ou JJ.MM.AAAA"
                  value={dateReception}
                  onChange={(e) => setDateReception(e.target.value)}
                  onBlur={() => isValidDateFlexible(dateReception) && setDateReception(normalizeDateFlexible(dateReception))}
                />
                <Button type="button" variant="outline" onClick={() => setDateReception(todayStr())}>Aujourd’hui</Button>
              </div>
            </div>

            {/* Motif — Sélection simple */}
            <div className="col-span-12 md:col-span-5">
              <label className="text-xs text-slate-600">Motif</label>
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm"
                value={motif}
                onChange={(e) => setMotif(e.target.value as Tache['motif'])}
              >
                {MOTIF_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.emoji} {m.value}</option>
                ))}
              </select>
            </div>

            {/* Voie — Sélection simple */}
            <div className="col-span-12 md:col-span-3">
              <label className="text-xs text-slate-600">Voie</label>
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm"
                value={voie}
                onChange={(e) => setVoie(e.target.value as Tache['voie'])}
              >
                {VOIE_OPTIONS.map(v => (
                  <option key={v.value} value={v.value}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>

            {/* Priorité binaire (une coche) */}
            <div className="col-span-12 md:col-span-3 flex items-center gap-2">
              <input id="prio" type="checkbox" checked={prioriteHaute} onChange={(e) => setPrioriteHaute(e.target.checked)} />
              <label htmlFor="prio" className="text-sm">Haute priorité</label>
            </div>

            {/* Observation + tags */}
            <div className="col-span-12">
              <label className="text-xs text-slate-600">Observation</label>
              <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ajouter une observation..." />
              <div className="mt-1 flex gap-2 text-xs">
                {['Refus', 'Incomplet', 'Dérogation'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setObservation(prev => (prev ? `${prev} ${t}` : t))}
                    className="rounded bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bloc — Calculateur (résumé) */}
        <section className="space-y-1">
          <h3 className="text-sm font-medium">Résumé automatique</h3>
          <div className="rounded border p-3 text-sm space-y-1">
            <div>
              <span className="font-medium">Titulaire:</span>{' '}
              {peopleAll.find(p => p.role === 'Titulaire')
                ? `${peopleAll.find(p => p.role === 'Titulaire')!.nom.toUpperCase()} ${peopleAll.find(p => p.role === 'Titulaire')!.prenom} (${peopleAll.find(p => p.role === 'Titulaire')!.age} ans)`
                : '—'}
            </div>
            <div>
              <span className="font-medium">Cotitulaire:</span>{' '}
              {peopleAll.find(p => p.role === 'Cotitulaire')
                ? `${peopleAll.find(p => p.role === 'Cotitulaire')!.nom.toUpperCase()} ${peopleAll.find(p => p.role === 'Cotitulaire')!.prenom} (${peopleAll.find(p => p.role === 'Cotitulaire')!.age} ans)`
                : '—'}
            </div>
            <div>
              <span className="font-medium">Enfants majeurs:</span>{' '}
              {enfantsMajeurs.length ? enfantsMajeurs.map(p => `${p.nom.toUpperCase()} ${p.prenom} (${p.age})`).join(', ') : '0'}
            </div>
            <div>
              <span className="font-medium">Enfants mineurs:</span>{' '}
              {enfantsMineurs.length ? enfantsMineurs.map(p => `${p.nom.toUpperCase()} ${p.prenom} (${p.age})`).join(', ') : '0'}
            </div>
          </div>
        </section>

        {/* Bloc — Pièces jointes */}
        <section aria-labelledby="bloc-files" className="space-y-2">
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

        {/* Actions (collées en bas) */}
        <div className="sticky bottom-0 bg-white dark:bg-neutral-950 pt-3 mt-2 flex items-center justify-end gap-2 border-t">
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
