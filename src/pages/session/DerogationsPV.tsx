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
// Types partagés (alignés sur DerogationsList)
// -----------------------------
export type CollaboratorCode = 'SJO' | 'FQO' | 'LSN' | 'TBO';
export type Decision = 'acceptée' | 'refusée' | 'en cours';
export interface Derogation {
  id: number;
  dateSeance: string;
  collab: CollaboratorCode;
  nom: string;
  prenom: string;
  decision: Decision;
  motif: string;
}

// -----------------------------
// Persistance locale (même clé que la liste)
// -----------------------------
const STORAGE_KEY = 'ocl.derogations.v1';
function loadDerogations(): Derogation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Derogation[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveDerogations(items: Derogation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// -----------------------------
// Utils
// -----------------------------
const sanitize = (s: string): string => s.replace(/<[^>]*>/g, '').trim();
const fmtDate = (iso?: string): string => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('fr-CH') : '—';

// Parse l'id depuis l'URL (/session/derogations/:id/pv)
function useDerogationIdFromPath(): number | null {
  const m = typeof window !== 'undefined' ? window.location.pathname.match(/\/session\/derogations\/(\d+)\/pv/) : null;
  return m ? Number(m[1]) : null;
}

// -----------------------------
// Composant principal: PV Commission Dérogations
// -----------------------------
export default function DerogationsPV(): JSX.Element {
  const id = useDerogationIdFromPath();
  const [all, setAll] = useState<Derogation[]>(() => loadDerogations());
  const dossier = useMemo(() => all.find(d => d.id === id), [all, id]);

  // --- Champs de la maquette (préremplis si possible) ---
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
  const [typeDossier, setTypeDossier] = useState<string>('Location');

  const CRITERES = [
    { key: 'anciennete', label: "Années dans l'appartement" },
    { key: 'age', label: 'Âge' },
    { key: 'sante', label: 'Problèmes de santé' },
    { key: 'reseau', label: "Dépendance d'un réseau aidant" },
    { key: 'famille', label: 'Situation familiale particulière' },
    { key: 'residence', label: 'Années de résidence à Lausanne' },
    { key: 'autres', label: 'Autres' },
  ] as const;
  type CritereKey = typeof CRITERES[number]['key'];
  type CritereState = { prisEnCompte: boolean; commentaire: string };
  const [criteres, setCriteres] = useState<Record<CritereKey, CritereState>>(() => {
    const base = {} as Record<CritereKey, CritereState>;
    CRITERES.forEach((c) => (base[c.key] = { prisEnCompte: false, commentaire: '' }));
    return base;
  });

  const [decision, setDecision] = useState<'refusee' | 'acceptee' | 'condition' | ''>('');
  const [conditionsText, setConditionsText] = useState<string>('');
  const [remarque, setRemarque] = useState<string>('');

  // Pré-remplissage à partir du dossier
  useEffect(() => {
    if (!dossier) return;
    setNom(dossier.nom);
    setPrenom(dossier.prenom);
    setDateDemande(dossier.dateSeance);
    setMotifNonRespect(dossier.motif);
  }, [dossier]);

  // Résumé
  const resume = useMemo(() => ({
    identite: `${prenom || 'Prénom'} ${nom || 'NOM'}`.trim(),
    adresse: adresse || 'Adresse',
    logement: `${surface || '-'} m², étage ${etage || '-'}${ascenseur ? ', ascenseur' : ''}`,
    loyer: `${loyerNet || '-'} CHF + ${charges || '-'} CHF charges`,
    commission: dateCommission ? new Date(dateCommission).toLocaleDateString('fr-CH') : '—',
    decision,
  }), [prenom, nom, adresse, surface, etage, ascenseur, loyerNet, charges, dateCommission, decision]);

  // Actions (maquette)
  const handleUpload = () => alert('(Maquette) Pièce jointe ajoutée');
  const handleDownloadPV = () => alert('(Maquette) Génération du PV PDF…');
  const handleBack = () => window.open('/session/derogations', '_self');

  // Validation → met à jour la liste en localStorage
  function applyAndSave(): void {
    if (!dossier || !id) return;
    // Mapping des décisions PV → liste
    // NOTE: par défaut, "condition" est mappé sur "acceptée" côté liste (badge identique).
    const mapped: Decision = decision === 'refusee' ? 'refusée' : decision === 'acceptee' || decision === 'condition' ? 'acceptée' : 'en cours';

    const updated = all.map((d) => (d.id === id ? { ...d, decision: mapped } : d));
    saveDerogations(updated);
    setAll(updated);

    // Journal local (démo)
    // eslint-disable-next-line no-console
    console.info('[AUDIT]', {
      who: 'agent.demo@lausanne.ch',
      what: 'pv_decision',
      when: new Date().toISOString(),
      payload: { id, mapped, conditionsText: sanitize(conditionsText), remarque: sanitize(remarque) },
    });

    alert(`Décision appliquée au dossier #${id}: ${mapped}`);
    handleBack();
  }

  // Sécurité inputs libres
  const onChangeSafe = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setter(sanitize(e.target.value));

  // Fichiers (maquette)
  const [pieces, setPieces] = useState<string[]>(["Pièce d'identité.pdf", 'Certificat médical.jpg']);

  if (!id) {
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-xl">
          <CardHeader><CardTitle>PV Commission dérogations</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">Identifiant de dossier absent dans l'URL.</p>
            <Button onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-xl">
          <CardHeader><CardTitle>Dossier introuvable</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">Aucun dossier "{id}" dans la liste locale.</p>
            <Button onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste</Button>
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white">
              <FileText className="h-5 w-5" />
            </motion.div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-600">Ville de Lausanne · Logement à loyer modéré</div>
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
              <li className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5" />Nouveau dossier</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5" />Prochaine commission</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5" />Exporter PV</li>
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-4">
          {/* Bandeau info résumé */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">Identité</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{resume.identite}</div>
                <div>{resume.adresse}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">Logement</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-600">
                <div>{resume.logement}</div>
                <div>{resume.loyer}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">Commission</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {resume.commission}</div>
                <DecisionBadge value={resume.decision} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Grille principale */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Col 1: Dossier candidat */}
            <Card className="rounded-2xl xl:col-span-2">
              <CardHeader>
                <CardTitle>Dossier du candidat / locataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ligne 1 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Date de la demande</Label>
                    <Input type="date" value={dateDemande} onChange={(e) => setDateDemande(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Collaborateur OCL</Label>
                    <Input placeholder="Initiales (ex. LSN)" value={collabOCL} onChange={onChangeSafe(setCollabOCL)} />
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
                    <Input value={adresse} onChange={onChangeSafe(setAdresse)} placeholder="Rue, NPA, Ville" />
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

                {/* Justificatifs / motifs */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Motif du non-respect des conditions</Label>
                    <Textarea rows={5} value={motifNonRespect} onChange={onChangeSafe(setMotifNonRespect)} placeholder="Ex.: revenu légèrement supérieur au plafond, composition du ménage, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label>Motifs présentés par le demandeur</Label>
                    <Textarea rows={5} value={motifsDemandeur} onChange={onChangeSafe(setMotifsDemandeur)} placeholder="Arguments, contexte social/santé, recommandations, etc." />
                  </div>
                </div>

                {/* Pièces jointes (maquette) */}
                <div className="space-y-2">
                  <Label>Pièces / justificatifs</Label>
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b p-3">
                      <div className="text-sm text-slate-600">Téléversez des pièces (PDF/JPG)…</div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="rounded-xl" onClick={handleUpload}><Upload className="mr-2 h-4 w-4" />Ajouter</Button>
                        <Button variant="outline" className="rounded-xl" onClick={handleDownloadPV}><Download className="mr-2 h-4 w-4" />Exporter PV</Button>
                      </div>
                    </div>
                    <ul className="divide-y">
                      {pieces.map((p, idx) => (
                        <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span>{p}</span>
                          <div className="flex items-center gap-3">
                            <Checkbox id={`chk-${idx}`} />
                            <Label htmlFor={`chk-${idx}`} className="text-xs text-slate-500">Inclure dans PV</Label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Col 2: Commission + Décision */}
            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Commission de dérogation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date de la commission</Label>
                      <Input type="date" value={dateCommission} onChange={(e) => setDateCommission(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Select value={service} onValueChange={setService}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Service" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SYE">SYE</SelectItem>
                          <SelectItem value="Location">Location</SelectItem>
                          <SelectItem value="Révision">Révision</SelectItem>
                          <SelectItem value="C&A">C & A</SelectItem>
                          <SelectItem value="SZ">SZ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Membres présents (liste)</Label>
                      <Input placeholder="Nom Prénom; Nom Prénom; …" value={membresPresents} onChange={onChangeSafe(setMembresPresents)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Critères de base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                          <th className="p-3">Critère</th>
                          <th className="p-3">Commentaires</th>
                          <th className="w-24 p-3 text-center">Pris en compte</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CRITERES.map((c) => (
                          <tr key={c.key} className="border-t">
                            <td className="p-3 font-medium">{c.label}</td>
                            <td className="p-3">
                              <Input
                                placeholder="Notes / faits saillants"
                                value={criteres[c.key].commentaire}
                                onChange={(e) =>
                                  setCriteres((prev) => ({
                                    ...prev,
                                    [c.key]: { ...prev[c.key], commentaire: sanitize(e.target.value) },
                                  }))
                                }
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Switch
                                checked={criteres[c.key].prisEnCompte}
                                onCheckedChange={(v) =>
                                  setCriteres((prev) => ({
                                    ...prev,
                                    [c.key]: { ...prev[c.key], prisEnCompte: Boolean(v) },
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                      <Textarea rows={4} value={conditionsText} onChange={onChangeSafe(setConditionsText)} placeholder="Ex.: suivi social trimestriel, révision du bail, délai de régularisation, etc." />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Remarque / justificatif du choix opéré</Label>
                    <Textarea rows={4} value={remarque} onChange={onChangeSafe(setRemarque)} placeholder="Synthèse de l'analyse des critères et de la décision" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">Envoi de la réponse au candidat/locataire après validation.</div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="rounded-xl" onClick={handleDownloadPV}><Download className="mr-2 h-4 w-4" />Générer PV</Button>
                      <Button className="rounded-xl" onClick={applyAndSave}>Valider et notifier</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Aperçu synthétique */}
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
                  <p className="text-sm text-slate-600 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {resume.commission}</p>
                  <div className="mt-1"><DecisionBadge value={resume.decision} /></div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="p-3">Critère</th>
                      <th className="p-3">Pris en compte</th>
                      <th className="p-3">Commentaires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERES.map((c) => (
                      <tr key={c.key} className="border-t">
                        <td className="p-3">{c.label}</td>
                        <td className="p-3">{criteres[c.key].prisEnCompte ? 'Oui' : 'Non'}</td>
                        <td className="p-3">{criteres[c.key].commentaire || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Footer (maquette) */}
      <footer className="mx-auto mt-8 max-w-7xl px-4 pb-8 text-center text-xs text-slate-500">
        Maquette interactive – non connectée – pour itération UX/UI. Données fictives.
      </footer>
    </div>
  );
}

function SideItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
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
  if (!value) return <span className="rounded-full border px-2 py-1 text-xs text-slate-600">En cours</span>;
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
