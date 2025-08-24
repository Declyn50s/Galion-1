// src/pages/session/DerogationsPV.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Users,
  FileText,
  Settings,
  Calendar as CalendarIcon,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// -----------------------------
// Types modèles (alignés sur la liste)
// -----------------------------
export type CollaboratorCode = 'SJO' | 'FQO' | 'LSN' | 'TBO';
export type Decision = 'acceptée' | 'refusée' | 'en cours';

export interface Derogation {
  id: number;
  dateSeance: string; // ISO
  collab: CollaboratorCode; // Initiales du collaborateur
  nom: string;
  prenom: string;
  decision: Decision;
  motif: string;
}

// -----------------------------
// Mock (fallback si pas de storage)
// -----------------------------
const MOCK: Derogation[] = [
  { id: 101, dateSeance: '2025-07-18', collab: 'LSN', nom: 'Durand', prenom: 'Camille', decision: 'acceptée', motif: 'Dépassement marginal des revenus, famille monoparentale.' },
  { id: 102, dateSeance: '2025-07-18', collab: 'SJO', nom: 'Martin', prenom: 'Léa', decision: 'refusée', motif: 'Critères non remplis selon règlement 2025.' },
  { id: 103, dateSeance: '2025-06-12', collab: 'FQO', nom: 'Nguyen', prenom: 'Minh', decision: 'en cours', motif: 'Éléments complémentaires attendus (attestation employeur).' },
  { id: 104, dateSeance: '2025-06-12', collab: 'TBO', nom: 'Rossi', prenom: 'Marco', decision: 'acceptée', motif: 'Situation d’urgence attestée par service social.' },
  { id: 105, dateSeance: '2025-05-08', collab: 'LSN', nom: 'Keller', prenom: 'Sophie', decision: 'en cours', motif: 'Vérification des pièces justificatives en cours.' },
  { id: 106, dateSeance: '2025-05-08', collab: 'SJO', nom: 'Bernard', prenom: 'Paul', decision: 'refusée', motif: 'Absence de justificatifs suffisants.' },
  { id: 107, dateSeance: '2025-04-17', collab: 'FQO', nom: 'Ibrahim', prenom: 'Sara', decision: 'acceptée', motif: 'Adaptation liée à la taille du foyer.' },
  { id: 108, dateSeance: '2025-04-17', collab: 'TBO', nom: 'Liu', prenom: 'Hao', decision: 'en cours', motif: 'Analyse complémentaire (revenus) en coordination inter-service.' },
  { id: 109, dateSeance: '2025-03-14', collab: 'LSN', nom: 'Moret', prenom: 'Nicolas', decision: 'refusée', motif: 'Non éligible aux critères LLM en vigueur.' },
  { id: 110, dateSeance: '2025-02-06', collab: 'SJO', nom: 'Gonzalez', prenom: 'Ana', decision: 'acceptée', motif: 'Situation précaire temporaire confirmée.' },
];

// -----------------------------
// Utils & persistance locale (même clé que la liste)
// -----------------------------
const STORAGE_KEY = 'ocl.derogations.v1';

const sanitize = (s: string): string => s.replace(/<[^>]*>/g, '').trim();

function loadDerogations(): Derogation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...MOCK];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Derogation[]) : [...MOCK];
  } catch {
    return [...MOCK];
  }
}

function saveDerogations(items: Derogation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // noop
  }
}

// -----------------------------
// Composant principal PV
// -----------------------------
export default function DerogationsPV(): JSX.Element {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ? Number.parseInt(idParam, 10) : null;

  const location = useLocation();
  const navigate = useNavigate();

  // Données disponibles (storage)
  const [all, setAll] = useState<Derogation[]>(() => loadDerogations());

  // Dossier provenant du state de navigation (chemin “heureux”)
  const fromState = location.state as Derogation | undefined;

  // Dossier courant : state prioritaire, sinon recherche en storage
  const dossier = useMemo(() => {
    if (fromState && typeof fromState.id === 'number') return fromState;
    if (id == null) return undefined;
    return all.find(d => d.id === id);
  }, [fromState, all, id]);

  // ---- Champs de la maquette ----
  const [dateDemande, setDateDemande] = useState<string>('');
  const [collabOCL, setCollabOCL] = useState<string>('');
  const [nom, setNom] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [adresse, setAdresse] = useState<string>('');
  const [loyerNet, setLoyerNet] = useState<string>('');
  const [charges, setCharges] = useState<string>('');
  const [etage, setEtage] = useState<string>('');
  const [surface, setSurface] = useState<string>('');
  const [ascenseur, setAscenseur] = useState<boolean>(false);

  const [motifNonRespect, setMotifNonRespect] = useState<string>('');
  const [motifsDemandeur, setMotifsDemandeur] = useState<string>('');

  const [dateCommission, setDateCommission] = useState<string>('');
  const [membresPresents, setMembresPresents] = useState<string>('');
  const [service, setService] = useState<string>('SYE');

  // Décision PV locale (différente du type Décision référentiel)
  type PVDecision = 'refusee' | 'acceptee' | 'condition' | '';
  const [decision, setDecision] = useState<PVDecision>('');
  const [conditionsText, setConditionsText] = useState<string>('');
  const [remarque, setRemarque] = useState<string>('');

  // Pré-remplissage depuis le dossier
  useEffect(() => {
    if (!dossier) return;
    setNom(dossier.nom);
    setPrenom(dossier.prenom);
    setDateDemande(dossier.dateSeance);
    setMotifNonRespect(dossier.motif);
    setCollabOCL(dossier.collab);
  }, [dossier]);

  // Résumé synthétique
  const resume = useMemo(
    () => ({
      identite: `${prenom || 'Prénom'} ${nom || 'NOM'}`.trim(),
      adresse: adresse || 'Adresse',
      logement: `${surface || '-'} m², étage ${etage || '-'}${ascenseur ? ', ascenseur' : ''}`,
      loyer: `${loyerNet || '-'} CHF + ${charges || '-'} CHF charges`,
      commission: dateCommission ? new Date(dateCommission).toLocaleDateString('fr-CH') : '—',
      decision,
    }),
    [prenom, nom, adresse, surface, etage, ascenseur, loyerNet, charges, dateCommission, decision],
  );

  // Actions
  const handleBack = () => navigate('/session/derogations');
  const handleUpload = () => alert('(Maquette) Pièce jointe ajoutée');
  const handleDownloadPV = () => alert('(Maquette) Génération du PV PDF…');

  // Validation → met à jour la liste en localStorage et revient à la liste
  function applyAndSave(): void {
    if (!dossier || id == null) return;

    // Mapping PV → référentiel liste
    const mapped: Decision =
      decision === 'refusee'
        ? 'refusée'
        : decision === 'acceptee' || decision === 'condition'
          ? 'acceptée'
          : 'en cours';

    const updated = all.map(d => (d.id === id ? { ...d, decision: mapped } : d));
    saveDerogations(updated);
    setAll(updated);

    // Audit local (démo)
    // eslint-disable-next-line no-console
    console.info('[AUDIT]', {
      who: 'agent.demo@lausanne.ch',
      what: 'pv_decision',
      when: new Date().toISOString(),
      payload: {
        id,
        mapped,
        conditionsText: sanitize(conditionsText),
        remarque: sanitize(remarque),
      },
    });

    alert(`Décision appliquée au dossier #${id} : ${mapped}`);
    handleBack();
  }

  // Sécurité inputs libres
  const onChangeSafe =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setter(sanitize(e.target.value));

  // Pièces jointes (maquette)
  const [pieces] = useState<string[]>(["Pièce d'identité.pdf", 'Certificat médical.jpg']);

  // Garde-fous
  if (id == null) {
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>PV Commission dérogations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">Identifiant de dossier absent dans l’URL.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Dossier introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Aucun dossier « {id} » dans la source locale.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white"
            >
              <FileText className="h-5 w-5" />
            </motion.div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-600">
                Ville de Lausanne · Logement à loyer modéré
              </div>
              <h1 className="text-lg font-bold">PV Commission dérogations — Dossier #{dossier.id}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
            </Button>
            <div className="hidden items-center gap-2 rounded-xl border bg-white px-3 py-1.5 md:flex">
              <Search className="h-4 w-4" />
              <input className="w-56 outline-none" placeholder="Rechercher (maquette)…" />
            </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="h-full rounded-2xl border bg-white p-3">
          <nav className="space-y-1">
            <SideItem icon={<Home className="h-4 w-4" />} label="Dossier" active />
            <SideItem icon={<Users className="h-4 w-4" />} label="Commission" />
            <SideItem icon={<FileText className="h-4 w-4" />} label="Statistiques" />
            <SideItem icon={<Settings className="h-4 w-4" />} label="Paramètres" />
          </nav>

          <div className="mt-6 rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold">Raccourcis</p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" />
                Nouveau dossier
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" />
                Prochaine commission
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" />
                Exporter PV
              </li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-4">
          {/* Bandeau résumé */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Identité</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{resume.identite}</div>
                <div>{resume.adresse}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Logement</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <div>{resume.logement}</div>
                <div>{resume.loyer}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Commission</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> {resume.commission}
                </div>
                <DecisionBadge value={resume.decision} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Grille principale */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Col 1 : dossier candidat */}
            <Card className="rounded-2xl xl:col-span-2">
              <CardHeader>
                <CardTitle>Dossier du candidat / locataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ligne 1 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Date de la demande</Label>
                    <Input
                      type="date"
                      value={dateDemande}
                      onChange={e => setDateDemande(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Collaborateur OCL</Label>
                    <Input
                      placeholder="Initiales (ex. LSN)"
                      value={collabOCL}
                      onChange={onChangeSafe(setCollabOCL)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ascenseur</Label>
                    <div className="flex h-10 items-center gap-3 rounded-xl border px-3">
                      <Switch checked={ascenseur} onCheckedChange={setAscenseur} />
                      <span className="text-sm">{ascenseur ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                </div>

                {/* Identité */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={nom} onChange={onChangeSafe(setNom)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input value={prenom} onChange={onChangeSafe(setPrenom)} />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label>Adresse</Label>
                    <Input
                      value={adresse}
                      onChange={onChangeSafe(setAdresse)}
                      placeholder="Rue, NPA, Ville"
                    />
                  </div>
                </div>

                {/* Logement */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Loyer net (CHF)</Label>
                    <Input type="number" value={loyerNet} onChange={onChangeSafe(setLoyerNet)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Charges (CHF)</Label>
                    <Input type="number" value={charges} onChange={onChangeSafe(setCharges)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Étage</Label>
                    <Input value={etage} onChange={onChangeSafe(setEtage)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Surface (m²)</Label>
                    <Input type="number" value={surface} onChange={onChangeSafe(setSurface)} />
                  </div>
                </div>

                {/* Motifs */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Motif du non-respect des conditions</Label>
                    <Textarea
                      rows={5}
                      value={motifNonRespect}
                      onChange={onChangeSafe(setMotifNonRespect)}
                      placeholder="Ex.: revenu légèrement supérieur au plafond, composition du ménage, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Motifs présentés par le demandeur</Label>
                    <Textarea
                      rows={5}
                      value={motifsDemandeur}
                      onChange={onChangeSafe(setMotifsDemandeur)}
                      placeholder="Arguments, contexte social/santé, recommandations, etc."
                    />
                  </div>
                </div>

                {/* Pièces jointes (maquette) */}
                <div className="space-y-2">
                  <Label>Pièces / justificatifs</Label>
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b p-3">
                      <div className="text-sm text-slate-600">Téléversez des pièces (PDF/JPG)…</div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="rounded-xl" onClick={handleUpload}>
                          <Upload className="mr-2 h-4 w-4" />
                          Ajouter
                        </Button>
                        <Button variant="outline" className="rounded-xl" onClick={handleDownloadPV}>
                          <Download className="mr-2 h-4 w-4" />
                          Exporter PV
                        </Button>
                      </div>
                    </div>
                    <ul className="divide-y">
                      {pieces.map((p, idx) => (
                        <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span>{p}</span>
                          <div className="flex items-center gap-3">
                            <Checkbox id={`chk-${idx}`} />
                            <Label htmlFor={`chk-${idx}`} className="text-xs text-slate-500">
                              Inclure dans PV
                            </Label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Col 2 : Commission + Décision */}
            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Commission de dérogation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date de la commission</Label>
                      <Input
                        type="date"
                        value={dateCommission}
                        onChange={e => setDateCommission(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Membres présents (liste)</Label>
                      <Input
                        placeholder="Nom Prénom; Nom Prénom; …"
                        value={membresPresents}
                        onChange={onChangeSafe(setMembresPresents)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Décision de la commission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Button
                      variant={decision === 'refusee' ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setDecision('refusee')}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Refusée
                    </Button>
                    <Button
                      variant={decision === 'acceptee' ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setDecision('acceptee')}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Acceptée
                    </Button>
                    <Button
                      variant={decision === 'condition' ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setDecision('condition')}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Sous condition
                    </Button>
                  </div>

                  {decision === 'condition' && (
                    <div className="space-y-2">
                      <Label>Conditions</Label>
                      <Textarea
                        rows={4}
                        value={conditionsText}
                        onChange={onChangeSafe(setConditionsText)}
                        placeholder="Ex.: suivi social trimestriel, révision du bail, délai de régularisation, etc."
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Remarque / justificatif du choix opéré</Label>
                    <Textarea
                      rows={4}
                      value={remarque}
                      onChange={onChangeSafe(setRemarque)}
                      placeholder="Synthèse de l'analyse des critères et de la décision"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Envoi de la réponse au candidat/locataire après validation.
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="rounded-xl" onClick={handleDownloadPV}>
                        <Download className="mr-2 h-4 w-4" /> Générer PV
                      </Button>
                      <Button className="rounded-xl" onClick={applyAndSave}>
                        Valider et notifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Aperçu synthèse */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Aperçu du PV (synthèse)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Candidat</h4>
                  <p className="text-sm text-slate-600">{resume.identite}</p>
                  <p className="text-sm text-slate-600">{resume.adresse}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Logement</h4>
                  <p className="text-sm text-slate-600">{resume.logement}</p>
                  <p className="text-sm text-slate-600">{resume.loyer}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Commission</h4>
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarIcon className="h-4 w-4" /> {resume.commission}
                  </p>
                  <div className="mt-1">
                    <DecisionBadge value={resume.decision} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <footer className="mx-auto mt-8 max-w-7xl px-4 pb-8 text-center text-xs text-slate-500">
        Maquette interactive – non connectée – Données fictives.
      </footer>
    </div>
  );
}

// Petits composants locaux
function SideItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${
        active ? 'bg-slate-900 text-white' : 'text-slate-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function DecisionBadge({ value }: { value: string }) {
  if (!value)
    return (
      <span className="rounded-full border px-2 py-1 text-xs text-slate-600">
        En cours
      </span>
    );
  if (value === 'acceptee')
    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
        Acceptée
      </span>
    );
  if (value === 'refusee')
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
        Refusée
      </span>
    );
  return (
    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
      Sous condition
    </span>
  );
}
