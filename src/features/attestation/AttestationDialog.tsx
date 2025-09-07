// src/features/attestation/AttestationDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  RefreshCcw,
  Plus,
  Trash2,
  Eye,
  FileText,
  Copy,
} from "lucide-react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { renderAsync } from "docx-preview";
import dayjs from "dayjs";

type KV = { key: string; value: string };

export type AttestationDialogProps = {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  /** URL d’un modèle .docx/.dotx (ex: /templates/attestation.dotx) */
  templateUrl?: string;
  /** Données par défaut injectées (ex: { NOM: 'MARTIN', PRENOM: 'Sophie' }) */
  initialData?: Record<string, string>;
  /** Nom du fichier exporté */
  fileName?: string;
};

// 👉 par défaut on vise ton DOTX dans /public/templates
const DEFAULT_TEMPLATE_URL = "/templates/attestation.dotx";
const k = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "_");
const containerStyle = "rounded-md border bg-white p-3 h-[560px] overflow-auto shadow-sm";

/** Variables à retirer/ignorer (demandé) */
const FORBIDDEN_KEYS = new Set<string>([
  "NSS",
  "TELEPHONE",
  "EMAIL",
  "NATIONALITE",
  "PERMIS",
  "ETAT_CIVIL",
  "DATE_NAISS",
  "VIA",
  "VIA_DATE",
  "NB_MINEURS",
]);

/** Détection ZIP OOXML (docx/dotx) : commence par 'PK' */
function looksLikeZipOOXML(ab: ArrayBuffer): boolean {
  const view = new Uint8Array(ab.slice(0, 4));
  // 'P' 'K'
  return view[0] === 0x50 && view[1] === 0x4b;
}

const AttestationDialog: React.FC<AttestationDialogProps> = ({
  isOpen,
  onOpenChange,
  templateUrl = DEFAULT_TEMPLATE_URL,
  initialData,
  fileName = "Attestation.docx",
}) => {
  const [pairs, setPairs] = React.useState<KV[]>([]);
  const [notes, setNotes] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [blobPreview, setBlobPreview] = React.useState<Blob | null>(null);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [templateName, setTemplateName] = React.useState<string | null>(null);

  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const templateABRef = React.useRef<ArrayBuffer | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // init des données
  React.useEffect(() => {
    const now = dayjs().format("DD.MM.YYYY");
    const base: Record<string, string> = { DATE_JOUR: now, ...(initialData || {}) };

    const kv: KV[] = Object.entries(base)
      .map(([key, value]) => ({ key: k(key), value: String(value ?? "") }))
      .filter(({ key }) => !FORBIDDEN_KEYS.has(key));

    const initialNotes = String((initialData as any)?.NOTES ?? "");
    setNotes(initialNotes);
    setPairs(kv);
  }, [initialData, isOpen]);

  // charge le template depuis l’URL une fois ouvert
  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setTemplateError(null);
      try {
        const res = await fetch(templateUrl, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Template introuvable (${res.status}). Vérifie le chemin: ${templateUrl}`);
        }
        const ab = await res.arrayBuffer();
        if (!looksLikeZipOOXML(ab)) {
          throw new Error(
            "Le fichier récupéré ne ressemble pas à un modèle Word (ZIP OOXML). Vérifie que /public/templates/attestation.dotx existe et est servi tel quel."
          );
        }
        templateABRef.current = ab;
        setTemplateName(templateUrl.split("/").pop() || "attestation.dotx");
      } catch (e: any) {
        console.error(e);
        setTemplateError(e?.message ?? "Erreur lors du chargement du modèle.");
        templateABRef.current = null;
        setTemplateName(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, templateUrl]);

  // (re)génère l’aperçu quand pairs/notes changent
  React.useEffect(() => {
    if (!isOpen || !templateABRef.current) return;
    void buildPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs, notes, isOpen]);

  const kvToObject = React.useCallback(() => {
    const obj: Record<string, string> = {};
    for (const { key, value } of pairs) {
      const kk = k(key);
      if (kk && !FORBIDDEN_KEYS.has(kk)) obj[kk] = value ?? "";
    }
    if (notes.trim()) obj["NOTES"] = notes.trim();
    return obj;
  }, [pairs, notes]);

  const buildPreview = async () => {
    if (!templateABRef.current) return;
    setLoading(true);
    try {
      const zip = new PizZip(templateABRef.current);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => "",
      });
      doc.setData(kvToObject());
      doc.render();
      const blob = doc.getZip().generate({
        type: "blob",
        // .dotx est OOXML, même mimetype pour le rendu/téléchargement
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      setBlobPreview(blob);

      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        await renderAsync(blob, previewRef.current);
      }
    } catch (e) {
      console.error("Erreur rendu docx:", e);
      if (previewRef.current) {
        previewRef.current.innerHTML = `<div class="text-sm text-red-600">
          Erreur lors du rendu du modèle. Vérifie que ton fichier .dotx/.docx n'est pas corrompu et que les balises {{...}} sont valides.
        </div>`;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!templateABRef.current) return;
    try {
      const zip = new PizZip(templateABRef.current);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => "",
      });
      doc.setData(kvToObject());
      doc.render();
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const outName =
        fileName.endsWith(".docx") || fileName.endsWith(".dotx")
          ? fileName
          : "Attestation.docx";
      saveAs(blob, outName);
    } catch (e) {
      console.error(e);
    }
  };

  // ---- Upload local du modèle (fallback robuste) ----
  const onPickFile = () => fileInputRef.current?.click();
  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setLoading(true);
      setTemplateError(null);
      const ab = await f.arrayBuffer();
      if (!looksLikeZipOOXML(ab)) {
        throw new Error("Le fichier choisi n’est pas un .docx/.dotx valide (signature ZIP manquante).");
      }
      templateABRef.current = ab;
      setTemplateName(f.name);
      await buildPreview();
    } catch (err: any) {
      console.error(err);
      setTemplateError(err?.message ?? "Fichier modèle invalide.");
      templateABRef.current = null;
      setTemplateName(null);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw]">
        <DialogHeader>
          <DialogTitle>Attestation — édition & prévisualisation</DialogTitle>
          <DialogDescription>
            Prévisualiser et générer l’attestation Word à partir d’un modèle .docx/.dotx.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne édition paramètres */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                Modèle:&nbsp;
                <Badge variant="outline">
                  {templateName ?? (templateUrl.split("/").pop() || "attestation.dotx")}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => buildPreview()}
                  disabled={!templateABRef.current}
                  title={!templateABRef.current ? "Aucun modèle chargé" : undefined}
                >
                  <RefreshCcw className="h-4 w-4" /> Rafraîchir
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={onPickFile}>
                  Importer modèle
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.dotx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onFileChosen}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(kvToObject(), null, 2));
                    } catch {}
                  }}
                >
                  <Copy className="h-4 w-4" /> Copier JSON
                </Button>
              </div>
            </div>

            <div className={containerStyle}>
              <div className="text-sm font-medium mb-2">
                Variables (<span className="font-mono">{"{{...}}"}</span> dans le modèle)
              </div>

              <div className="space-y-3">
                {pairs
                  .filter(({ key }) => !FORBIDDEN_KEYS.has(k(key)))
                  .map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Label className="sr-only">Clé</Label>
                        <Input
                          placeholder="ex. NOM"
                          value={row.key}
                          onChange={(e) =>
                            setPairs((p) =>
                              p.map((r, idx) =>
                                idx === i ? { ...r, key: k(e.target.value) } : r
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-6">
                        <Label className="sr-only">Valeur</Label>
                        <Input
                          placeholder="Valeur…"
                          value={row.value}
                          onChange={(e) =>
                            setPairs((p) =>
                              p.map((r, idx) =>
                                idx === i ? { ...r, value: e.target.value } : r
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setPairs((p) => p.filter((_, idx) => idx !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setPairs((p) => [...p, { key: "", value: "" }])}
                >
                  <Plus className="h-4 w-4" /> Ajouter une variable
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label>Notes libres (optionnel) — utilisable via {"{{ NOTES }}"}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des précisions qui apparaîtront sur l'attestation..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleDownload} className="gap-2" disabled={!templateABRef.current}>
                <Download className="h-4 w-4" />
                Télécharger .docx
              </Button>
            </div>
          </div>

          {/* Colonne aperçu */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Eye className="h-4 w-4" />
              Aperçu (rendu DOCX)
              {loading && <span className="ml-2 text-xs text-slate-400">(chargement…)</span>}
            </div>
            <div className={containerStyle}>
              {templateError ? (
                <div className="text-sm text-red-600">
                  {templateError}
                  <div className="mt-1 text-slate-600">
                    • Vérifie que le fichier existe bien dans <code>/public/templates/attestation.dotx</code>.<br />
                    • Ou clique <span className="font-medium">Importer modèle</span> pour charger ton fichier .dotx/.docx localement.
                  </div>
                </div>
              ) : (
                <>
                  <div ref={previewRef} className="docx-preview" />
                  {!blobPreview && !loading && (
                    <div className="text-sm text-slate-500">
                      Charge un modèle (URL par défaut:{" "}
                      <code>/templates/attestation.dotx</code>) ou importe un fichier local, puis renseigne les variables.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(pairs ?? [])
                .filter(({ key }) => !FORBIDDEN_KEYS.has(k(key)))
                .slice(0, 6)
                .map((p, i) => (
                  <Badge key={i} variant="outline">
                    {p.key}
                  </Badge>
                ))}
              {pairs.filter(({ key }) => !FORBIDDEN_KEYS.has(k(key))).length > 6 && (
                <Badge variant="secondary">
                  +{pairs.filter(({ key }) => !FORBIDDEN_KEYS.has(k(key))).length - 6}
                </Badge>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => buildPreview()}
                className="gap-2"
                disabled={!templateABRef.current}
              >
                <FileText className="h-4 w-4" />
                Recréer l’aperçu
              </Button>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttestationDialog;
