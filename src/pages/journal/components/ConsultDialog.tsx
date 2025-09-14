// src/pages/journal/components/ConsultDialog.tsx
import React from "react";
import type { Tache } from "@/features/journal/store";
import { Card, CardContent } from "@/components/ui/card";

type HistoryEntry =
  | {
      at: string; // ISO
      type: "status";
      before?: Tache["statut"];
      after: Tache["statut"];
      observation?: string;
      observationTags?: string[];
    }
  | {
      at: string; // ISO
      type: "suspend";
      missingDocs: string[];
      note?: string;
    }
  | {
      at: string; // ISO
      type: "refuse";
      reason: string;
      note?: string;
    }
  | {
      at: string; // ISO
      type: "validate";
      note?: string;
      changes?: Array<{ field: string; before: any; after: any }>;
    };

function fmtDateTime(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-CH");
  } catch {
    return iso || "";
  }
}

function FieldChangeRow({
  c,
}: {
  c: { field: string; before: any; after: any };
}) {
  const stringify = (v: any) =>
    v === undefined || v === null || v === "" ? "—" : String(v);
  return (
    <tr className="border-b last:border-0">
      <td className="py-1 pr-3 font-medium">{c.field}</td>
      <td className="py-1 pr-3 text-gray-600">{stringify(c.before)}</td>
      <td className="py-1">{stringify(c.after)}</td>
    </tr>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  task: (Tache & { history?: HistoryEntry[] }) | null;
};

const ConsultDialog: React.FC<Props> = ({ open, onOpenChange, task }) => {
  if (!open || !task) return null;

  const history = (task.history ?? []) as HistoryEntry[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-3xl">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold">
                Consulter le traitement – <span className="font-mono">{task.id}</span>
              </h2>
              <p className="text-xs text-gray-600">
                Statut actuel : <span className="font-medium">{task.statut}</span>
              </p>
            </div>
            <button
              className="text-sm px-3 py-1 rounded border hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </button>
          </div>

          <CardContent className="p-4 space-y-6">
            {/* Résumé observation */}
            {(task.observation || (task.observationTags ?? []).length > 0) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Dernières observations</h3>
                {task.observation && (
                  <p className="text-sm whitespace-pre-wrap">{task.observation}</p>
                )}
                {!!task.observationTags?.length && (
                  <div className="flex flex-wrap gap-1">
                    {task.observationTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Historique */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Historique</h3>
              {history.length === 0 ? (
                <p className="text-sm text-gray-600">Aucun évènement enregistré.</p>
              ) : (
                <ul className="space-y-3">
                  {history
                    .slice()
                    .reverse()
                    .map((h, idx) => {
                      if (h.type === "status") {
                        return (
                          <li key={idx} className="text-sm">
                            <div className="font-medium">
                              {fmtDateTime(h.at)} — Changement de statut :{" "}
                              <span className="font-mono">{h.before || "—"}</span>{" "}
                              → <span className="font-mono">{h.after}</span>
                            </div>
                            {h.observation && (
                              <div className="text-gray-700 mt-1 whitespace-pre-wrap">
                                {h.observation}
                              </div>
                            )}
                            {!!h.observationTags?.length && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {h.observationTags.map((t) => (
                                  <span
                                    key={t}
                                    className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      }
                      if (h.type === "suspend") {
                        return (
                          <li key={idx} className="text-sm">
                            <div className="font-medium">
                              {fmtDateTime(h.at)} — Mise en suspens
                            </div>
                            {!!h.missingDocs?.length && (
                              <ul className="list-disc ml-5 mt-1 text-gray-700">
                                {h.missingDocs.map((d, i) => (
                                  <li key={i}>{d}</li>
                                ))}
                              </ul>
                            )}
                            {h.note && (
                              <div className="text-gray-700 mt-1 whitespace-pre-wrap">
                                {h.note}
                              </div>
                            )}
                          </li>
                        );
                      }
                      if (h.type === "refuse") {
                        return (
                          <li key={idx} className="text-sm">
                            <div className="font-medium">
                              {fmtDateTime(h.at)} — Refus
                            </div>
                            <div className="text-gray-700">
                              Motif : <span className="font-medium">{h.reason}</span>
                            </div>
                            {h.note && (
                              <div className="text-gray-700 mt-1 whitespace-pre-wrap">
                                {h.note}
                              </div>
                            )}
                          </li>
                        );
                      }
                      // validate
                      return (
                        <li key={idx} className="text-sm">
                          <div className="font-medium">
                            {fmtDateTime(h.at)} — Validation
                          </div>
                          {h.note && (
                            <div className="text-gray-700 mt-1 whitespace-pre-wrap">
                              {h.note}
                            </div>
                          )}
                          {!!h.changes?.length && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">
                                Changements enregistrés
                              </div>
                              <div className="overflow-x-auto">
                                <table className="text-xs min-w-[480px]">
                                  <thead>
                                    <tr className="text-left border-b">
                                      <th className="py-1 pr-3">Champ</th>
                                      <th className="py-1 pr-3">Avant</th>
                                      <th className="py-1">Après</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {h.changes.map((c, i) => (
                                      <FieldChangeRow key={i} c={c} />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsultDialog;
