import React, { useMemo, useRef, useState, useEffect } from "react";

/**
 * Maquette React — Page « Convocations » (LLM)
 * Nouveautés demandées :
 * - FIX lundi (dates locales, plus d’écart UTC)
 * - « Station de dépôt » en bas (parking global) : on peut y DROP un RDV, naviguer, puis le RE‑DRAG vers la date voulue
 * - Pop‑up de confirmation après DROP sur un jour pour choisir/adapter l’heure (saisie manuelle, pas de liste)
 * - Double‑clic sur un RDV ⇒ modale d’édition (date/heure)
 * - Drag & drop inter‑périodes (hover ←/→) conservé
 * - Pseudo‑connecteur Outlook Graph (mock)
 * - Durée RDV = 30 minutes
 */

// === Constantes métier ===
const INITIALS = ["TBO", "SJO", "LSN", "LLN", "FQO", "SFE"] as const;
const MOTIFS = [
  { key: "revenu", label: "Revenu trop élevé", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "sousocc", label: "Sous-occupation notoire", color: "bg-green-100 text-green-800 border-green-200" },
  { key: "info", label: "Devoir d’information", color: "bg-amber-100 text-amber-900 border-amber-200" },
] as const;
const STATUTS = ["Planifié", "Replanifié", "Terminé", "Annulé", "No-show"] as const;

const MINUTES_PER_RDV = 30; // 30 minutes net

// Jours utilitaires
const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Horaires par jour (0=Dim..6=Sam) — minutes depuis minuit
const OPEN_WINDOWS: Record<number, Array<{ start: number; end: number }>> = {
  0: [], // Dim — fermé
  1: [ { start: hm(8,0), end: hm(11,30) }, { start: hm(13,0), end: hm(16,30) } ],
  2: [ { start: hm(8,0), end: hm(11,30) }, { start: hm(13,0), end: hm(16,30) } ],
  3: [ { start: hm(8,0), end: hm(11,30) }, { start: hm(13,0), end: hm(16,30) } ],
  4: [ /* jeudi matin fermé */ { start: hm(13,0), end: hm(16,30) } ],
  5: [ { start: hm(8,0), end: hm(11,30) }, { start: hm(13,0), end: hm(16,30) } ],
  6: [], // Sam — fermé
};

function hm(h:number,m:number){return h*60+m}
function pad(n:number){return String(n).padStart(2,"0")} 
function fmtMinutes(total:number){ const h=Math.floor(total/60), m=total%60; return `${pad(h)}:${pad(m)}` }

// Parse souple de l’heure sans menu (HH:MM, H:MM, 930, 9h30, 9.30, 9)
function parseTimeString(raw:string): number | undefined {
  if(!raw) return undefined;
  let s = raw.trim().toLowerCase();
  // normalisations sans regex pour éviter toute ambiguïté
  s = s.split(" ").join("");
  s = s.split("h").join(":");
  s = s.split(".").join(":");
  // si uniquement des chiffres
  let onlyDigits = true;
  for(const c of s){ if(!(c>="0" && c<="9")) { onlyDigits = false; break; } }
  if(!s.includes(":")){
    if(!onlyDigits) return undefined;
    if(s.length===1 || s.length===2){
      const hh = parseInt(s,10); if(isNaN(hh)) return undefined; return hh*60;
    }
    if(s.length===3){
      const hh = parseInt(s.slice(0,1),10); const mm = parseInt(s.slice(1),10);
      if(isNaN(hh)||isNaN(mm)) return undefined; return hh*60+mm;
    }
    if(s.length===4){
      const hh = parseInt(s.slice(0,2),10); const mm = parseInt(s.slice(2),10);
      if(isNaN(hh)||isNaN(mm)) return undefined; return hh*60+mm;
    }
    return undefined;
  }
  const parts = s.split(":");
  if(parts.length!==2) return undefined;
  const hh = parseInt(parts[0],10);
  const mm = parseInt(parts[1],10);
  if(isNaN(hh)||isNaN(mm)) return undefined;
  if(hh<0||hh>23||mm<0||mm>59) return undefined;
  return hh*60+mm;
}

// === Types ===
interface RendezVous {
  id: string;
  dateISO: string; // YYYY-MM-DD (LOCAL)
  startMin: number; // minutes since 00:00 local
  endMin: number;   // minutes since 00:00 local
  dossier: string;
  locataire: string;
  motifKey: typeof MOTIFS[number]["key"];
  collab: typeof INITIALS[number];
  statut: typeof STATUTS[number];
  notes?: string;
  outlookEventId?: string;
  syncStatus?: "synced" | "pending" | "error";
}

// === Helpers de date (LOCAL, corrige le bug du lundi) ===
function toISODate(d: Date){ // version locale, pas UTC
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}
function startOfWeek(date: Date){
  const d = new Date(date);
  const day = (d.getDay()+6)%7; // Lundi=0
  d.setDate(d.getDate()-day);
  d.setHours(0,0,0,0);
  return d;
}
function addDays(date: Date, n: number){ const d = new Date(date); d.setDate(d.getDate()+n); return d }
function sameDayISO(a:string,b:string){return a===b}

// Génère créneaux valides pour une date (pour l’affichage des horaires, pas de menu)
function generateStartTimes(date: Date){
  const dow = date.getDay();
  const windows = OPEN_WINDOWS[dow] || [];
  const options: number[] = [];
  for(const w of windows){
    for(let t=w.start; t+MINUTES_PER_RDV<=w.end; t+=5){ // résolution 5 min
      options.push(t);
    }
  }
  return options; // minutes depuis minuit
}

function overlaps(a:RendezVous,b:RendezVous){
  return a.dateISO===b.dateISO && a.startMin < b.endMin && a.endMin > b.startMin;
}

function motifMeta(key: RendezVous["motifKey"]) {return MOTIFS.find(m=>m.key===key)!}

// Couleur de puce statut
function statutClass(statut: RendezVous["statut"]) {
  switch(statut){
    case "Planifié": return "bg-slate-100 text-slate-700 border-slate-200";
    case "Replanifié": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Terminé": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Annulé": return "bg-rose-100 text-rose-800 border-rose-200";
    case "No-show": return "bg-yellow-100 text-yellow-900 border-yellow-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

// === Pseudo‑connecteur Outlook Graph (Mock) ===
const GraphMock = {
  createEvent(r: RendezVous){
    const id = `evt_${Math.random().toString(36).slice(2)}`;
    console.info("GraphMock.createEvent", { id, subject: subjectFromRDV(r) });
    return { eventId: id, status: "synced" as const };
  },
  updateEvent(eventId: string, r: RendezVous){
    console.info("GraphMock.updateEvent", { eventId, subject: subjectFromRDV(r) });
    return { status: "synced" as const };
  },
  deleteEvent(eventId?: string){
    console.info("GraphMock.deleteEvent", { eventId });
    return { status: "synced" as const };
  }
}
function subjectFromRDV(r: RendezVous){
  const motif = motifMeta(r.motifKey).label;
  return `Convocation LLM — ${r.dossier} — ${motif} — ${r.collab}`;
}

// === Données de démo ===
function demoData(baseMonday: Date): RendezVous[]{
  const monISO = toISODate(baseMonday);
  const tueISO = toISODate(addDays(baseMonday,1));
  const wedISO = toISODate(addDays(baseMonday,2));
  const thuISO = toISODate(addDays(baseMonday,3));
  const friISO = toISODate(addDays(baseMonday,4));
  return [
    { id: "a1", dateISO: monISO, startMin: hm(9,0), endMin: hm(9,30), dossier: "DOS-10234", locataire: "Mme Rossi", motifKey: "revenu", collab: "SFE", statut: "Planifié", outlookEventId: "evt_demo_a1", syncStatus: "synced" },
    { id: "a2", dateISO: monISO, startMin: hm(13,0), endMin: hm(13,30), dossier: "DOS-10277", locataire: "M. Diallo", motifKey: "sousocc", collab: "TBO", statut: "Planifié", outlookEventId: "evt_demo_a2", syncStatus: "synced" },
    { id: "a3", dateISO: tueISO, startMin: hm(10,30), endMin: hm(11,0), dossier: "DOS-10298", locataire: "Mme Nguyen", motifKey: "info", collab: "LSN", statut: "Replanifié", outlookEventId: "evt_demo_a3", syncStatus: "synced" },
    { id: "a4", dateISO: wedISO, startMin: hm(14,0), endMin: hm(14,30), dossier: "DOS-10311", locataire: "M. Bernard", motifKey: "sousocc", collab: "LLN", statut: "Planifié", outlookEventId: "evt_demo_a4", syncStatus: "synced" },
    { id: "a5", dateISO: thuISO, startMin: hm(13,30), endMin: hm(14,0), dossier: "DOS-10344", locataire: "Mme Silva", motifKey: "revenu", collab: "FQO", statut: "Planifié", outlookEventId: "evt_demo_a5", syncStatus: "synced" },
    { id: "a6", dateISO: friISO, startMin: hm(8,0), endMin: hm(8,30), dossier: "DOS-10366", locataire: "M. Martin", motifKey: "info", collab: "SJO", statut: "Planifié", outlookEventId: "evt_demo_a6", syncStatus: "synced" },
  ]
}

// === Composant principal ===
function Convocation(){
  const today = new Date();
  const [view, setView] = useState<"jour"|"semaine"|"mois">("semaine");
  const [cursor, setCursor] = useState<Date>(startOfWeek(today)); // lundi courant
  const [rdvs, setRdvs] = useState<RendezVous[]>(()=>demoData(startOfWeek(today)));

  // Filtres
  const [filterMotifs, setFilterMotifs] = useState<string[]>([]);
  const [filterInitials, setFilterInitials] = useState<string[]>([]);
  const [filterStatuts, setFilterStatuts] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Drag global & parking
  const [draggingId, setDraggingId] = useState<string|undefined>(undefined);
  const [parkedId, setParkedId] = useState<string|undefined>(undefined);
  const navTimer = useRef<number|undefined>(undefined);

  // Modales création / édition / confirmation drop
  const [openModal, setOpenModal] = useState(false);
  const [draft, setDraft] = useState<Partial<RendezVous>>({
    dateISO: toISODate(cursor),
    startMin: undefined,
    endMin: undefined,
    collab: INITIALS[0],
    motifKey: MOTIFS[0].key,
    statut: "Planifié",
  });
  const [createTime, setCreateTime] = useState<string>("");
  const [error, setError] = useState<string|undefined>(undefined);

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string|undefined>(undefined);
  const [editDraft, setEditDraft] = useState<Partial<RendezVous>>({});
  const [editTime, setEditTime] = useState<string>("");
  const [editError, setEditError] = useState<string|undefined>(undefined);

  const [confirm, setConfirm] = useState<{id:string; dateISO:string; desiredStart:number} | undefined>(undefined);

  const [toast, setToast] = useState<string|undefined>(undefined);

  const weekDays = useMemo(()=>Array.from({length:5},(_,i)=>addDays(cursor,i)),[cursor]);

  const filtered = useMemo(()=>{
    return rdvs.filter(r=>{
      if(search){
        const hay = `${r.dossier} ${r.locataire}`.toLowerCase();
        if(!hay.includes(search.toLowerCase())) return false;
      }
      if(filterMotifs.length && !filterMotifs.includes(r.motifKey)) return false;
      if(filterInitials.length && !filterInitials.includes(r.collab)) return false;
      if(filterStatuts.length && !filterStatuts.includes(r.statut)) return false;
      if(view!=="mois"){
        const start = toISODate(weekDays[0]);
        const end = toISODate(weekDays[weekDays.length-1]);
        if(r.dateISO < start || r.dateISO > end) return false;
      }
      return true;
    }).sort((a,b)=> (a.dateISO===b.dateISO) ? a.startMin-b.startMin : (a.dateISO<b.dateISO?-1:1));
  },[rdvs, search, filterMotifs, filterInitials, filterStatuts, view, weekDays]);

  function resetDraft(date?:Date, startMin?:number){
    const d = date? toISODate(date): toISODate(weekDays[0]);
    setDraft({
      dateISO: d,
      startMin,
      endMin: startMin!==undefined? startMin+MINUTES_PER_RDV: undefined,
      collab: INITIALS[0],
      motifKey: MOTIFS[0].key,
      statut: "Planifié",
      dossier: "",
      locataire: "",
      notes: "",
    });
    setCreateTime(startMin!==undefined? fmtMinutes(startMin): "");
    setError(undefined);
  }

  function validate(dateISO:string, startMin:number, excludeId?:string): string|undefined {
    const date = new Date(dateISO+"T00:00:00");
    const windows = OPEN_WINDOWS[date.getDay()]||[];
    const end = startMin + MINUTES_PER_RDV;
    const inWindow = windows.some(w=> startMin>=w.start && end<=w.end);
    if(!inWindow) return (date.getDay()===4 && startMin < hm(13,0)) ? 
      "Fermeture jeudi matin : choisissez l’après‑midi." :
      "Créneau en dehors des heures d’ouverture.";
    // Conflits (une seule salle)
    const conflict = rdvs.some(r=> r.id!==excludeId && r.dateISO===dateISO && startMin < r.endMin && end > r.startMin);
    if(conflict) return "Créneau indisponible : la salle est déjà réservée.";
    return undefined;
  }

  function createRDV(){
    if(!draft.dateISO) return setError("Sélectionnez une date.");
    const parsed = parseTimeString(createTime);
    if(parsed===undefined) return setError("Entrez l’heure au format HH:MM (ex. 09:00, 13:30).");
    const nextDraft = { ...draft, startMin: parsed } as Partial<RendezVous>;

    if(!nextDraft.dossier) return setError("Indiquez le numéro de dossier.");
    if(!nextDraft.locataire) return setError("Indiquez le nom du locataire.");
    if(!nextDraft.collab) return setError("Sélectionnez des initiales.");
    if(!nextDraft.motifKey) return setError("Sélectionnez un motif.");

    const err = validate(nextDraft.dateISO!, parsed);
    if(err){ setError(err); return; }

    const newR: RendezVous = {
      id: Math.random().toString(36).slice(2),
      dateISO: nextDraft.dateISO!, startMin: parsed, endMin: parsed+MINUTES_PER_RDV,
      dossier: nextDraft.dossier!, locataire: nextDraft.locataire!,
      motifKey: nextDraft.motifKey as any, collab: nextDraft.collab as any, statut: nextDraft.statut as any,
      notes: nextDraft.notes||"",
      syncStatus: "pending",
    };
    const res = GraphMock.createEvent(newR);
    newR.outlookEventId = res.eventId; newR.syncStatus = res.status;
    setRdvs(prev=>[...prev, newR]);
    setOpenModal(false);
    quickToast("Créé + synchronisé sur Outlook (mock)");
  }

  function cancelRDV(id:string){
    setRdvs(prev=> prev.map(r=> {
      if(r.id!==id) return r; 
      GraphMock.deleteEvent(r.outlookEventId);
      return {...r, statut: "Annulé", syncStatus: "synced"}
    }))
    quickToast("Annulation synchronisée (mock)");
  }
  function finishRDV(id:string){
    setRdvs(prev=> prev.map(r=> {
      if(r.id!==id) return r; 
      GraphMock.updateEvent(r.outlookEventId||"", {...r, statut: "Terminé"} as any);
      return {...r, statut: "Terminé", syncStatus: "synced"}
    }))
    quickToast("Statut Terminé synchronisé (mock)");
  }
  function markNoShow(id:string){
    setRdvs(prev=> prev.map(r=> {
      if(r.id!==id) return r; 
      GraphMock.updateEvent(r.outlookEventId||"", {...r, statut: "No-show"} as any);
      return {...r, statut: "No-show", syncStatus: "synced"}
    }))
    quickToast("No‑show synchronisé (mock)");
  }

  function applyReschedule(id:string, dateISO:string, startMin:number){
    const r = rdvs.find(x=>x.id===id); if(!r) return false;
    const err = validate(dateISO, startMin, id);
    if(err){ quickToast(err); return false; }
    const updated: RendezVous = { ...r, dateISO, startMin, endMin: startMin+MINUTES_PER_RDV, statut: "Replanifié" };
    GraphMock.updateEvent(r.outlookEventId||"", updated);
    setRdvs(prev=> prev.map(x=> x.id===id? { ...updated, syncStatus: "synced" } : x));
    if(parkedId===id) setParkedId(undefined);
    quickToast(`Replanifié au ${dateISO} ${fmtMinutes(startMin)} (synchro mock OK)`);
    return true;
  }

  function openEditModal(r: RendezVous){
    setEditId(r.id);
    setEditDraft({ dateISO: r.dateISO, startMin: r.startMin });
    setEditTime(fmtMinutes(r.startMin));
    setEditError(undefined);
    setOpenEdit(true);
  }

  function saveEdit(){
    if(!editId || !editDraft.dateISO){ setEditError("Complétez les champs."); return; }
    const parsed = parseTimeString(editTime);
    if(parsed===undefined){ setEditError("Entrez l’heure au format HH:MM (ex. 09:00, 13:30)."); return; }
    const err = validate(editDraft.dateISO, parsed, editId);
    if(err){ setEditError(err); return; }
    setRdvs(prev=> prev.map(r=> {
      if(r.id!==editId) return r;
      const updated: RendezVous = { ...r, dateISO: editDraft.dateISO!, startMin: parsed, endMin: parsed+MINUTES_PER_RDV, statut: "Replanifié" };
      GraphMock.updateEvent(r.outlookEventId||"", updated);
      return { ...updated, syncStatus: "synced" };
    }))
    setOpenEdit(false);
    quickToast("Heure/date modifiées (synchro mock)");
  }

  function quickToast(msg:string){ setToast(msg); setTimeout(()=>setToast(undefined), 1800); }

  // Navigation temporelle
  function prev(){ setCursor(addDays(cursor, view==="jour"? -1 : -7)); }
  function next(){ setCursor(addDays(cursor, view==="jour"? 1 : 7)); }

  function onNavHover(dir:"prev"|"next"){ // navigation auto pendant un drag
    if(!draggingId) return; // actif seulement si on tient un RDV
    if(navTimer.current) window.clearTimeout(navTimer.current);
    navTimer.current = window.setTimeout(()=>{ dir==="prev"? prev() : next() }, 500); // 500 ms de survol
  }
  function stopNavHover(){ if(navTimer.current) { window.clearTimeout(navTimer.current); navTimer.current = undefined; } }

  // Navigation clavier ← → (ignore les champs de saisie et les modales ouvertes)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent){
      if (openModal || openEdit || confirm) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = (t.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t as any).isContentEditable) return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCursor(c => addDays(c, view === 'jour' ? -1 : -7));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCursor(c => addDays(c, view === 'jour' ? 1 : 7));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, openModal, openEdit, confirm]);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Convocations — LLM</h1>
          <span className="ml-2 text-xs px-2 py-1 rounded bg-slate-100 border">RDV = 30 min • Jeudi matin fermé</span>
          <div className="ml-auto flex items-center gap-2">
            <ViewSwitch view={view} setView={setView} />
            <button 
              onClick={prev}
              onDragOver={(e)=>{ e.preventDefault(); onNavHover("prev"); }}
              onDragLeave={stopNavHover}
              className={`px-3 py-1.5 rounded border text-sm ${draggingId?"bg-amber-50":"hover:bg-slate-100"}`}>←</button>
            <button 
              onClick={next}
              onDragOver={(e)=>{ e.preventDefault(); onNavHover("next"); }}
              onDragLeave={stopNavHover}
              className={`px-3 py-1.5 rounded border text-sm ${draggingId?"bg-amber-50":"hover:bg-slate-100"}`}>→</button>
            <button onClick={()=>{ resetDraft(); setOpenModal(true); }} className="ml-2 px-3 py-1.5 rounded bg-slate-900 text-white text-sm hover:bg-slate-800">Nouveau RDV</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Recherche dossier/locataire" className="px-3 py-2 text-sm border rounded w-64" />
          <FilterMulti label="Motifs" options={MOTIFS.map(m=>({value:m.key,label:m.label}))} values={filterMotifs} onChange={setFilterMotifs} />
          <FilterMulti label="Initiales" options={INITIALS.map(i=>({value:i,label:i}))} values={filterInitials} onChange={setFilterInitials} />
          <FilterMulti label="Statuts" options={STATUTS.map(s=>({value:s,label:s}))} values={filterStatuts} onChange={setFilterStatuts} />
          <div className="ml-auto text-xs text-slate-600 flex items-center gap-2">
            {draggingId? <span className="px-2 py-1 rounded bg-amber-100 border border-amber-200">Glissez vers ←/→ (0,5 s) pour naviguer • ou déposez en bas (parking).</span> : <span className="px-2 py-1 rounded bg-slate-100 border">Heure = saisie manuelle (HH:MM). Double‑clic = modifier. Clavier ←/→ : naviguer.</span>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 pb-28">{/* place pour la station de dépôt */}
        {view==="semaine" && (
          <WeekView 
            days={weekDays} 
            rdvs={filtered} 
            onCancel={cancelRDV} 
            onFinish={finishRDV} 
            onNoShow={markNoShow}
            onDropToDay={(id, iso)=> setConfirm({ id, dateISO: iso, desiredStart: rdvs.find(x=>x.id===id)?.startMin ?? hm(9,0) })}
            setDraggingId={setDraggingId}
            onOpenEdit={openEditModal}
          />
        )}
        {view==="jour" && (
          <DayView 
            day={weekDays[0]} 
            rdvs={filtered.filter(r=>sameDayISO(r.dateISO,toISODate(weekDays[0])))} 
            onCancel={cancelRDV} 
            onFinish={finishRDV} 
            onNoShow={markNoShow}
            onDropToDay={(id, iso)=> setConfirm({ id, dateISO: iso, desiredStart: rdvs.find(x=>x.id===id)?.startMin ?? hm(9,0) })}
            setDraggingId={setDraggingId}
            onOpenEdit={openEditModal}
          />
        )}
        {view==="mois" && (
          <MonthView reference={cursor} rdvs={rdvs} />
        )}

        <Legend />
      </main>

      {/* Station de dépôt (parking global) */}
      <DropTray 
        parkedId={parkedId}
        rdv={parkedId? rdvs.find(r=>r.id===parkedId): undefined}
        onDropPark={(id)=>{ setParkedId(id); setDraggingId(undefined); }}
        onClear={()=> setParkedId(undefined)}
      />

      {openModal && (
        <Modal onClose={()=>setOpenModal(false)} title="Nouveau rendez‑vous">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input type="date" value={draft.dateISO||""} onChange={e=> { setDraft(d=>({...d, dateISO:e.target.value })); }} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm mb-1">Heure de début (HH:MM)</label>
                <input value={createTime} onChange={e=> setCreateTime(e.target.value)} placeholder="ex. 09:00" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm mb-1">Dossier</label>
                <input value={draft.dossier||""} onChange={e=> setDraft(d=>({...d, dossier:e.target.value}))} placeholder="p.ex. DOS-10401" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm mb-1">Locataire</label>
                <input value={draft.locataire||""} onChange={e=> setDraft(d=>({...d, locataire:e.target.value}))} placeholder="Nom du locataire" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm mb-1">Motif</label>
                <select value={draft.motifKey||MOTIFS[0].key} onChange={e=> setDraft(d=>({...d, motifKey:e.target.value as any}))} className="w-full border rounded px-3 py-2 text-sm">
                  {MOTIFS.map(m=> <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Initiales</label>
                <select value={draft.collab||INITIALS[0]} onChange={e=> setDraft(d=>({...d, collab:e.target.value as any}))} className="w-full border rounded px-3 py-2 text-sm">
                  {INITIALS.map(i=> <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Statut</label>
                <select value={draft.statut||"Planifié"} onChange={e=> setDraft(d=>({...d, statut:e.target.value as any}))} className="w-full border rounded px-3 py-2 text-sm">
                  {STATUTS.map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-1">Notes (interne)</label>
                <textarea value={draft.notes||""} onChange={e=> setDraft(d=>({...d, notes:e.target.value}))} className="w-full border rounded px-3 py-2 text-sm" rows={3} />
              </div>
            </div>
            {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={()=>setOpenModal(false)} className="px-3 py-2 rounded border text-sm">Annuler</button>
              <button onClick={createRDV} className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Créer</button>
            </div>
          </div>
        </Modal>
      )}

      {openEdit && (
        <Modal onClose={()=>setOpenEdit(false)} title="Modifier date / heure">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input type="date" value={editDraft.dateISO||""} onChange={e=> setEditDraft(d=>({...d, dateISO:e.target.value}))} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm mb-1">Heure de début (HH:MM)</label>
                <input value={editTime} onChange={e=> setEditTime(e.target.value)} placeholder="ex. 13:30" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            {editError && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">{editError}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={()=>setOpenEdit(false)} className="px-3 py-2 rounded border text-sm">Annuler</button>
              <button onClick={saveEdit} className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Enregistrer</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pop‑up de confirmation après drop */}
      {confirm && (
        <ConfirmModal 
          id={confirm.id}
          dateISO={confirm.dateISO}
          desiredStart={confirm.desiredStart}
          onCancel={()=> setConfirm(undefined)}
          onConfirm={(start)=>{ const ok = applyReschedule(confirm.id, confirm.dateISO, start); if(ok) setConfirm(undefined); return ok; }}
        />
      )}

      <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-slate-500">
        Maquette front — synchro Outlook simulée (GraphMock). Utilisez la **station de dépôt** en bas pour parquer un RDV, naviguez, puis redéposez-le sur la date voulue. Après le drop, un pop‑up vous laisse **confirmer/adapter l’heure (saisie HH:MM)**.
      </footer>

      {/* Toast minimaliste */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded bg-slate-900 text-white text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  )
}

// === Vues ===
function WeekView({days, rdvs, onCancel, onFinish, onNoShow, onDropToDay, setDraggingId, onOpenEdit}:{days:Date[]; rdvs:RendezVous[]; onCancel:(id:string)=>void; onFinish:(id:string)=>void; onNoShow:(id:string)=>void; onDropToDay:(id:string, iso:string)=>void; setDraggingId:(id:string|undefined)=>void; onOpenEdit:(r:RendezVous)=>void;}){
  return (
    <div>
      <div className="grid grid-cols-5 gap-3">
        {days.map((d)=>{
          const iso = toISODate(d);
          const list = rdvs.filter(r=>r.dateISO===iso);
          const day = d.getDay();
          const windows = OPEN_WINDOWS[day]||[];
          return (
            <div 
              key={iso} 
              className="bg-white border rounded-xl overflow-hidden shadow-sm"
              onDragOver={(e)=>{ e.preventDefault(); }}
              onDrop={(e)=>{
                e.preventDefault();
                const id = e.dataTransfer.getData('text/rdv-id');
                if(id) onDropToDay(id, iso);
              }}
            >
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{dayNames[d.getDay()]} {d.getDate()}.{d.getMonth()+1}.</div>
                  <div className="text-xs text-slate-500">{windows.length? windows.map(w=> `${fmtMinutes(w.start)}–${fmtMinutes(w.end)}`).join("  •  ") : "Fermé"}</div>
                </div>
                {day===4 && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border">Jeudi matin fermé</span>}
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {list.length===0 && <div className="text-xs text-slate-500">Déposez un RDV ici pour le replanifier</div>}
                {list.map(r=> (
                  <RDVCard key={r.id} r={r} onCancel={onCancel} onFinish={onFinish} onNoShow={onNoShow}
                    setDraggingId={setDraggingId} onOpenEdit={onOpenEdit} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({day, rdvs, onCancel, onFinish, onNoShow, onDropToDay, setDraggingId, onOpenEdit}:{day:Date; rdvs:RendezVous[]; onCancel:(id:string)=>void; onFinish:(id:string)=>void; onNoShow:(id:string)=>void; onDropToDay:(id:string, iso:string)=>void; setDraggingId:(id:string|undefined)=>void; onOpenEdit:(r:RendezVous)=>void;}){
  const windows = OPEN_WINDOWS[day.getDay()]||[];
  const iso = toISODate(day);
  return (
    <div 
      className="bg-white border rounded-xl shadow-sm"
      onDragOver={(e)=>{ e.preventDefault(); }}
      onDrop={(e)=>{ e.preventDefault(); const id = e.dataTransfer.getData('text/rdv-id'); if(id) onDropToDay(id, iso); }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{dayNames[day.getDay()]} {day.getDate()}.{day.getMonth()+1}.</div>
          <div className="text-xs text-slate-500">{windows.length? windows.map(w=> `${fmtMinutes(w.start)}–${fmtMinutes(w.end)}`).join("  •  ") : "Fermé"}</div>
        </div>
        {day.getDay()===4 && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border">Jeudi matin fermé</span>}
      </div>
      <div className="p-4 space-y-2 min-h-[240px]">
        {rdvs.length===0 && <div className="text-sm text-slate-500">Déposez un RDV ici pour le replanifier</div>}
        {rdvs.map(r=> (
          <RDVCard key={r.id} r={r} onCancel={onCancel} onFinish={onFinish} onNoShow={onNoShow}
            setDraggingId={setDraggingId} onOpenEdit={onOpenEdit} />
        ))}
      </div>
    </div>
  )
}

function MonthView({reference, rdvs}:{reference:Date; rdvs:RendezVous[]}){
  const any = new Date(reference);
  const monthStart = new Date(any.getFullYear(), any.getMonth(), 1);
  const start = startOfWeek(monthStart);
  const days: Date[] = Array.from({length:42},(_,i)=> addDays(start,i));
  const byDate = rdvs.reduce<Record<string,number>>((acc,r)=>{acc[r.dateISO]=(acc[r.dateISO]||0)+1; return acc},{});

  return (
    <div className="bg-white border rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b"><div className="text-sm font-medium">Vue mois (aperçu — compte par jour)</div></div>
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(h=> <div key={h} className="bg-slate-50 text-xs px-2 py-1 font-medium">{h}</div>)}
        {days.map((d,i)=>{
          const iso = toISODate(d);
          const isCurr = d.getMonth()===any.getMonth();
          const count = byDate[iso]||0;
          const isWeekend = [0,6].includes(d.getDay());
          return (
            <div key={iso+"-"+i} className={`h-24 bg-white p-2 ${!isCurr?"opacity-30":""} ${isWeekend?"bg-slate-50":""}`}>
              <div className="text-[11px] text-slate-500">{d.getDate()}</div>
              {count>0 && <div className="mt-1 inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-slate-100 border">{count} RDV</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// === Composants auxiliaires ===
function Legend(){
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white border rounded-xl p-3">
        <div className="text-sm font-medium mb-2">Légende — Motifs</div>
        <div className="flex flex-wrap gap-2">
          {MOTIFS.map(m=> (
            <span key={m.key} className={`text-xs px-2 py-1 border rounded ${m.color}`}>{m.label}</span>
          ))}
        </div>
      </div>
      <div className="bg-white border rounded-xl p-3">
        <div className="text-sm font-medium mb-2">Initiales (collaborateurs)</div>
        <div className="flex flex-wrap gap-2">
          {INITIALS.map(i=> <span key={i} className="text-xs px-2 py-1 border rounded bg-slate-100">{i}</span>)}
        </div>
      </div>
      <div className="bg-white border rounded-xl p-3">
        <div className="text-sm font-medium mb-2">Statuts</div>
        <div className="flex flex-wrap gap-2">
          {STATUTS.map(s=> <span key={s} className={`text-xs px-2 py-1 border rounded ${statutClass(s)}`}>{s}</span>)}
        </div>
      </div>
    </div>
  )
}

function SyncBadge({status}:{status:RendezVous["syncStatus"]}){
  if(status==="synced") return <span className="text-[10px] px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Synchro Outlook : OK</span>;
  if(status==="pending") return <span className="text-[10px] px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">Synchro : en attente</span>;
  if(status==="error") return <span className="text-[10px] px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">Synchro : erreur</span>;
  return null;
}

function RDVCard({r, onCancel, onFinish, onNoShow, setDraggingId, onOpenEdit}:{r:RendezVous; onCancel:(id:string)=>void; onFinish:(id:string)=>void; onNoShow:(id:string)=>void; setDraggingId:(id:string|undefined)=>void; onOpenEdit:(r:RendezVous)=>void;}){
  const motif = motifMeta(r.motifKey);
  return (
    <div 
      className={`border rounded-lg p-2 text-sm flex flex-col gap-1 ${motif.color}`}
      draggable
      onDragStart={(e)=>{ e.dataTransfer.setData('text/rdv-id', r.id); e.dataTransfer.effectAllowed = 'move'; setDraggingId(r.id); }}
      onDragEnd={()=> setDraggingId(undefined)}
      onDoubleClick={()=> onOpenEdit(r)}
      title="Double‑clic : modifier date/heure • Glisser : replanifier"
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{fmtMinutes(r.startMin)}–{fmtMinutes(r.endMin)}</div>
        <div className="flex items-center gap-2">
          <SyncBadge status={r.syncStatus}/>
          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${statutClass(r.statut)}`}>{r.statut}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/70 border text-[10px] font-semibold">{r.collab}</span>
        <div className="truncate"><span className="font-medium">{r.dossier}</span> • {r.locataire}</div>
      </div>
      <div className="text-xs text-slate-600">{motif.label}</div>
      <div className="flex gap-2 mt-1">
        <button onClick={()=>onFinish(r.id)} className="px-2 py-1 text-xs rounded bg-white/80 border hover:bg-white">Terminer</button>
        <button onClick={()=>onNoShow(r.id)} className="px-2 py-1 text-xs rounded bg-white/80 border hover:bg-white">No‑show</button>
        <button onClick={()=>onCancel(r.id)} className="ml-auto px-2 py-1 text-xs rounded border border-rose-300 text-rose-700 hover:bg-rose-50">Annuler</button>
      </div>
    </div>
  )
}

function ViewSwitch({view, setView}:{view:"jour"|"semaine"|"mois"; setView:(v:any)=>void}){
  return (
    <div className="flex border rounded-lg overflow-hidden text-sm">
      {([
        {key:"jour",label:"Jour"},
        {key:"semaine",label:"Semaine"},
        {key:"mois",label:"Mois"},
      ] as const).map(v=> (
        <button key={v.key} onClick={()=>setView(v.key)} className={`px-3 py-1.5 border-r last:border-r-0 ${view===v.key?"bg-slate-900 text-white":"bg-white hover:bg-slate-100"}`}>{v.label}</button>
      ))}
    </div>
  )
}

function FilterMulti({label, options, values, onChange}:{label:string; options:{value:string,label:string}[]; values:string[]; onChange:(v:string[])=>void;}){
  function toggle(val:string){ onChange(values.includes(val)? values.filter(v=>v!==val): [...values,val]) }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {options.map(o=> (
          <button key={o.value} onClick={()=>toggle(o.value)} className={`px-2 py-1 text-xs rounded border ${values.includes(o.value)?"bg-slate-900 text-white":"bg-white hover:bg-slate-100"}`}>{o.label}</button>
        ))}
      </div>
    </div>
  )
}

function Modal({children, onClose, title}:{children:React.ReactNode; onClose:()=>void; title:string}){
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[720px] max-w-[95vw] bg-white rounded-2xl shadow-xl border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded border">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function DropTray({parkedId, rdv, onDropPark, onClear}:{parkedId?:string; rdv?:RendezVous; onDropPark:(id:string)=>void; onClear:()=>void;}){
  return (
    <div 
      className="fixed left-0 right-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur px-4 py-2"
      onDragOver={(e)=> e.preventDefault()}
      onDrop={(e)=>{ e.preventDefault(); const id = e.dataTransfer.getData('text/rdv-id'); if(id) onDropPark(id); }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="text-xs text-slate-600">Station de dépôt :</div>
        {!rdv && <div className="text-xs text-slate-500">Déposez ici pour parquer un RDV, naviguez, puis re‑déposez sur un jour.</div>}
        {rdv && (
          <div className="flex items-center gap-2">
            <div 
              className="px-3 py-1.5 text-xs border rounded bg-slate-50"
              draggable
              onDragStart={(e)=>{ if(parkedId){ e.dataTransfer.setData('text/rdv-id', parkedId); e.dataTransfer.effectAllowed='move'; } }}
              title="Glissez cette étiquette vers un jour pour placer le RDV"
            >
              {rdv.dossier} • {rdv.locataire} — {fmtMinutes(rdv.startMin)} ({rdv.dateISO})
            </div>
            <button onClick={onClear} className="px-2 py-1 text-xs rounded border hover:bg-slate-100">Vider</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmModal({id, dateISO, desiredStart, onCancel, onConfirm}:{id:string; dateISO:string; desiredStart:number; onCancel:()=>void; onConfirm:(startMin:number)=>boolean;}){
  const [timeStr, setTimeStr] = useState<string>(fmtMinutes(desiredStart));
  const [err, setErr] = useState<string|undefined>(undefined);
  const hours = useMemo(()=>{
    const d = new Date(dateISO+"T00:00:00");
    const w = OPEN_WINDOWS[d.getDay()]||[];
    return w.length? w.map(x=> `${fmtMinutes(x.start)}–${fmtMinutes(x.end)}`).join("  •  ") : "Fermé";
  },[dateISO]);

  function submit(){
    const parsed = parseTimeString(timeStr);
    if(parsed===undefined){ setErr("Format invalide. Utilisez HH:MM (ex. 09:00)."); return; }
    const ok = onConfirm(parsed);
    if(!ok){ setErr("Créneau non disponible ou hors horaires. Ajustez l’heure."); }
  }

  return (
    <Modal onClose={onCancel} title={`Confirmer le créneau — ${dateISO}`}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Heure de début (HH:MM)</label>
          <input value={timeStr} onChange={e=>{ setErr(undefined); setTimeStr(e.target.value); }} placeholder="ex. 09:00" className="w-full border rounded px-3 py-2 text-sm" />
          <div className="text-xs text-slate-500 mt-1">Horaires du jour : {hours}</div>
        </div>
        {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded border text-sm">Annuler</button>
          <button onClick={submit} className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Confirmer</button>
        </div>
      </div>
    </Modal>
  )
}

// === Self-tests (console) — on conserve et on ajoute des cas ===
function __runDevTests(){
  try {
    console.group("Self-tests Convocations");
    const eq = (a:any,b:any,label?:string)=>{ const ok = a===b; console[ok?"log":"error"](ok?"✅":"❌", label||"", a, "===", b); return ok };
    // parseTimeString
    eq(parseTimeString("9"), 540, '"9" → 540');
    eq(parseTimeString("09:00"), 540, '"09:00" → 540');
    eq(parseTimeString("930"), 570, '"930" → 570');
    eq(parseTimeString("9h30"), 570, '"9h30" → 570');
    eq(parseTimeString("9.30"), 570, '"9.30" → 570');
    eq(parseTimeString("  9 h 0 "), 540, 'espaces + h');
    eq(parseTimeString("24:00"), undefined, '24:00 invalide');
    eq(parseTimeString("12:60"), undefined, '12:60 invalide');
    // startOfWeek: toujours lundi local
    eq(startOfWeek(new Date('2025-08-22')).getDay(), 1, 'startOfWeek -> lundi');
    // fenêtres jeudi: seulement après-midi
    const thu = new Date();
    thu.setDate(thu.getDate() + ((4 - thu.getDay() + 7) % 7)); // prochain jeudi
    console.log("Horaires jeudi:", OPEN_WINDOWS[4]);
    console.groupEnd();
  } catch(e){ console.warn("Self-tests error", e); }
}
if (typeof window !== 'undefined') { setTimeout(__runDevTests, 0); }

export default Convocation;
export { Convocation };
