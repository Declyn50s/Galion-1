import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Building2,
  Inbox,
  Mail,
  FileText,
  Clock,
  Tag,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";
import InteractionDialog from "@/components/interaction";
import { useInteractionsStore } from "@/features/interactions/store";
import type { Interaction } from "@/types/interaction";

/* ───────── Types / UI ───────── */
type InteractionTypeKey =
  | "telephone"
  | "guichet"
  | "courrier"
  | "email"
  | "jaxform"
  | "commentaire";

/** On étend pour supporter le filtrage par cible */
type ExtInteraction = Interaction & {
  userId?: string;   // id usager (slug)
  tenantId?: string; // id ménage/dossier locataire
  scopeId?: string;  // id générique si tu l’utilises ailleurs
};

const TYPE_CONFIG: Record<
  InteractionTypeKey,
  { label: string; color: string; icon: React.ReactNode }
> = {
  telephone: {
    label: "Téléphone",
    color: "border-blue-500",
    icon: <Phone className="h-4 w-4" />,
  },
  guichet: {
    label: "Guichet",
    color: "border-green-600",
    icon: <Building2 className="h-4 w-4" />,
  },
  courrier: {
    label: "Courrier",
    color: "border-orange-400",
    icon: <Inbox className="h-4 w-4" />,
  },
  email: {
    label: "E-mail",
    color: "border-purple-500",
    icon: <Mail className="h-4 w-4" />,
  },
  jaxform: {
    label: "Jaxform",
    color: "border-indigo-500",
    icon: <FileText className="h-4 w-4" />,
  },
  commentaire: {
    label: "Commentaire",
    color: "border-slate-500",
    icon: <MessageSquare className="h-4 w-4" />,
  },
};

/* ───────── Utils ───────── */
const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-CH");
};
const formatTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};
const initials3 = (s?: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 3);

/* ───────── Composant ───────── */
const InteractionTimeline: React.FC<{ title?: string }> = ({
  title = "💬 Historique des interactions",
}) => {
  // On récupère userId OU tenantId depuis le routeur ~ les deux pages marchent
  const { userId, tenantId } = useParams<{
    userId?: string;
    tenantId?: string;
  }>();
  const targetId = userId || tenantId || ""; // id attendu dans les interactions

  // Store
  const interactions = useInteractionsStore((s) => s.interactions) as ExtInteraction[];
  const updateInteraction = useInteractionsStore(
    (s) => s.updateInteraction
  ) as (id: string, patch: Partial<Interaction>) => void;
  const removeInteraction = useInteractionsStore(
    (s) => s.removeInteraction
  ) as (id: string) => void;

  // 🔎 Filtre PAR CIBLE (userId / tenantId / scopeId)
  const items = React.useMemo(() => {
    const list = Array.isArray(interactions) ? interactions : [];
    const filtered = targetId
      ? list.filter(
          (it) =>
            it.userId === targetId ||
            it.tenantId === targetId ||
            it.scopeId === targetId
        )
      : list;

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted;
  }, [interactions, targetId]);

  // Pagination progressive
  const [visible, setVisible] = React.useState(Math.min(5, items.length));
  React.useEffect(() => {
    setVisible((v) => Math.min(Math.max(v, 5), items.length));
  }, [items.length]);

  // Édition
  const [editing, setEditing] = React.useState<ExtInteraction | null>(null);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="max-h-[460px] overflow-auto pr-2">
          <div className="relative">
            <div
              className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"
              aria-hidden
            />

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.slice(0, visible).map((it) => {
                  const cfg =
                    TYPE_CONFIG[(it.type as InteractionTypeKey) ?? "commentaire"];
                  const alertish =
                    it.isAlert || (it.observationTags || []).includes("Refus");

                  return (
                    <motion.article
                      key={it.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="relative pl-8"
                    >
                      {/* Point timeline */}
                      <span
                        className="absolute left-[9px] top-2 h-3 w-3 rounded-full bg-white ring-2 ring-slate-300"
                        aria-hidden
                      />

                      <div
                        className={`rounded-lg border bg-white ${cfg.color} border-l-4 ${
                          alertish ? "ring-1 ring-red-200" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 p-3">
                          <div className="mt-0.5 shrink-0 text-slate-600">
                            {cfg.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="font-medium text-slate-700">
                                {cfg.label}
                              </span>
                              {it.subject ? (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-700">
                                    {it.subject}
                                  </span>
                                </>
                              ) : null}
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(it.createdAt)} —{" "}
                                {formatTime(it.createdAt)}
                              </span>
                              {alertish ? (
                                <Badge variant="destructive" className="ml-1">
                                  Alerte
                                </Badge>
                              ) : null}
                            </div>

                            {/* Commentaire */}
                            {it.comment && (
                              <p className="mt-2 text-sm text-slate-900 whitespace-pre-wrap break-words">
                                {it.comment}
                              </p>
                            )}

                            {/* Observations */}
                            {it.observations && (
                              <>
                                <Separator className="my-2" />
                                <div className="text-xs text-slate-600">
                                  <span className="font-medium text-slate-700">
                                    Observation
                                  </span>
                                  <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap break-words">
                                    {it.observations}
                                  </p>
                                </div>
                              </>
                            )}

                            {/* Tags / options / obs tags */}
                            {it.tags?.length ||
                            it.commentOptions?.length ||
                            it.observationTags?.length ? (
                              <>
                                <Separator className="my-2" />
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Collaborateurs */}
                                  {it.tags?.length ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                        <Tag className="h-3.5 w-3.5" />
                                        Collaborateurs
                                      </span>
                                      {it.tags.map((t) => (
                                        <Badge
                                          key={`c-${t}`}
                                          variant="secondary"
                                        >
                                          {t}
                                        </Badge>
                                      ))}
                                    </>
                                  ) : null}

                                  {/* Options de commentaire */}
                                  {it.commentOptions?.length ? (
                                    <>
                                      <span className="ml-3 inline-flex items-center gap-1 text-xs text-slate-600">
                                        <Tag className="h-3.5 w-3.5" />
                                        Options
                                      </span>
                                      {it.commentOptions.map((t) => (
                                        <Badge
                                          key={`o-${t}`}
                                          variant="outline"
                                          className="border-dashed"
                                        >
                                          {t}
                                        </Badge>
                                      ))}
                                    </>
                                  ) : null}

                                  {/* Tags d’observation */}
                                  {it.observationTags?.length ? (
                                    <>
                                      <span className="ml-3 inline-flex items-center gap-1 text-xs text-slate-600">
                                        <Tag className="h-3.5 w-3.5" />
                                        Observations
                                      </span>
                                      {it.observationTags.map((t) => (
                                        <Badge
                                          key={`ot-${t}`}
                                          variant={
                                            t === "Refus"
                                              ? "destructive"
                                              : "secondary"
                                          }
                                        >
                                          {t}
                                        </Badge>
                                      ))}
                                    </>
                                  ) : null}
                                </div>
                              </>
                            ) : null}
                          </div>

                          {/* Actions */}
                          <div className="ml-auto flex flex-col items-end gap-2">
                            <div
                              className="rounded-md bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 select-none"
                              title="Agent"
                            >
                              {initials3("DBO")}
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditing(it)}
                                title="Modifier"
                              >
                                ✏️
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    title="Supprimer"
                                  >
                                    ✖️
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Supprimer l’interaction ?
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <p className="text-sm text-slate-600">
                                    Cette action est irréversible.
                                  </p>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Annuler
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => removeInteraction(it.id)}
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Voir plus */}
        {visible < items.length && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisible((v) => Math.min(v + 5, items.length))}
            >
              Voir plus
            </Button>
          </div>
        )}
      </CardContent>

      {/* Modale édition */}
      {editing && (
        <InteractionDialog
          isOpen={true}
          onClose={() => setEditing(null)}
          initialType={(editing.type as any) || "commentaire"}
          initialValues={{
            type: (editing.type as any) || "commentaire",
            subject: editing.subject,
            customSubject: editing.customSubject,
            comment: editing.comment,
            tags: editing.tags,
            observations: editing.observations,
            isAlert: editing.isAlert,
            commentOptions: editing.commentOptions ?? [],
            observationTags: editing.observationTags ?? [],
          }}
          submitLabel="Enregistrer"
          title="Modifier l’interaction"
          onSave={(payload) => {
            updateInteraction(editing.id, {
              type: payload.type,
              subject: payload.subject,
              customSubject: payload.customSubject,
              comment: payload.comment,
              tags: payload.tags,
              observations: payload.observations,
              isAlert: payload.isAlert,
              commentOptions: payload.commentOptions ?? [],
              observationTags: payload.observationTags ?? [],
              updatedAt: new Date().toISOString(),
            });
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
};

export default InteractionTimeline;
