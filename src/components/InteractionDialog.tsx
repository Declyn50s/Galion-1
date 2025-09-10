import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  X,
  Plus,
  Check,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  FileCheck,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InteractionFormData,
  PREDEFINED_SUBJECTS,
  INTERACTION_TYPES,
  mockAPI,
} from "@/types/interaction";

const iconMap = { Building, Phone, Mail, FileCheck, MessageSquare };

type InitialValues = Partial<
  InteractionFormData & {
    type?: keyof typeof INTERACTION_TYPES;
    meta?: {
      files?: Array<{
        name: string;
        url?: string;
        size?: number;
        type?: string;
      }>;
      observationTags?: string[];
    };
  }
>;

interface InteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: keyof typeof INTERACTION_TYPES;
  onSave?: (
    data: InteractionFormData & { type: keyof typeof INTERACTION_TYPES }
  ) => void;
  initialValues?: InitialValues; // ✅ pour l’édition
  submitLabel?: string; // “Sauvegarder et fermer” par défaut
  title?: string; // “Nouvelle interaction” par défaut
}

const InteractionDialog: React.FC<InteractionDialogProps> = ({
  isOpen,
  onClose,
  initialType,
  onSave,
  initialValues,
  submitLabel = "Sauvegarder et fermer",
  title = "Nouvelle interaction",
}) => {
  const [selectedType, setSelectedType] =
    useState<keyof typeof INTERACTION_TYPES>(initialType);

  const [formData, setFormData] = useState<InteractionFormData>({
    subject: "",
    customSubject: "",
    comment: "",
    tags: [],
    observations: "",
    isAlert: false,
    commentOptions: [], // ✅ options cochées
    observationTags: [], // ✅ tags d’observation cochés
  });

  // ====== Ajouts rétro-compatibles ======
  // Onglets de suivi (UI seulement, pas d'impact externe)
  type SelectedTab = "tache" | "journal" | "information" | null;
  const [selectedTab, setSelectedTab] = useState<SelectedTab>(null);

  // Pièces jointes locales (meta.files envoyé au mockAPI uniquement)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Champs spécifiques par sujet
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentMoved, setAppointmentMoved] = useState(false);
  const [convocationSelected, setConvocationSelected] = useState(false);
  const [convocationReason, setConvocationReason] = useState("");
  const [convocationDate, setConvocationDate] = useState("");
  const [signatureConvention, setSignatureConvention] = useState(false);
  const [terminationDate, setTerminationDate] = useState("");
  const [selectedProlongations, setSelectedProlongations] = useState<string[]>(
    []
  );
  const [prolongationDates, setProlongationDates] = useState<
    Record<string, string>
  >({});

  // états auxiliaires
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Couleur / icône du header
  const typeConfig = INTERACTION_TYPES[selectedType];
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    cyan: "bg-cyan-100 text-cyan-700",
    gray: "bg-gray-100 text-gray-700",
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  const headerColor =
    colorClasses[typeConfig?.color as string] ?? "bg-slate-100 text-slate-700";

  // Hydrate les valeurs initiales quand on ouvre en mode édition
  useEffect(() => {
    if (!isOpen) return;
    if (initialValues) {
      setSelectedType((initialValues.type as any) || initialType);
      setFormData((prev) => ({
        ...prev,
        subject: initialValues.subject ?? "",
        customSubject: initialValues.customSubject ?? "",
        comment: initialValues.comment ?? "",
        tags: initialValues.tags ?? [],
        observations: initialValues.observations ?? "",
        isAlert: !!initialValues.isAlert,
        commentOptions: initialValues.commentOptions ?? [],
        observationTags:
          initialValues.observationTags ??
          initialValues.meta?.observationTags ??
          [],
      }));
      // pas de pré-hydratation de fichiers dans formData (on reste typé) :
      // on affiche seulement les existants via initialValues.meta.files
    } else {
      // reset pour une nouvelle création
      setSelectedType(initialType);
      setFormData({
        subject: "",
        customSubject: "",
        comment: "",
        tags: [],
        observations: "",
        isAlert: false,
        commentOptions: [],
        observationTags: [],
      });
      setUploadedFiles([]);
      setSelectedTab(null);
      setAppointmentDate("");
      setAppointmentMoved(false);
      setConvocationSelected(false);
      setConvocationReason("");
      setConvocationDate("");
      setSignatureConvention(false);
      setTerminationDate("");
      setSelectedProlongations([]);
      setProlongationDates({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValues, initialType]);

  // Autosave (mock) — inclut champs spécifiques + tags d’observation + fichiers (meta)
  useEffect(() => {
    if (!formData.subject) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      mockAPI
        .update("temp-id", {
          ...formData,
          // on n’élargit pas InteractionFormData officiellement : on passe via meta
          meta: {
            appointmentDate,
            appointmentMoved,
            convocationSelected,
            convocationReason,
            convocationDate,
            signatureConvention,
            terminationDate,
            selectedProlongations,
            prolongationDates,
            files: uploadedFiles.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          },
        } as any)
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }, 1200);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData,
    appointmentDate,
    appointmentMoved,
    convocationSelected,
    convocationReason,
    convocationDate,
    signatureConvention,
    terminationDate,
    selectedProlongations,
    prolongationDates,
    uploadedFiles,
  ]);

  // Raccourcis clavier (non bloquants)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        resetAndClose();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "s" || e.key === "Enter")
      ) {
        e.preventDefault();
        handleSaveAndClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData, selectedType]);

  const handleSubjectSelect = (subject: string) => {
    setFormData((p) => ({ ...p, subject }));
  };

  const handleAddTag = () => {
    const t = newTag.trim();
    if (!t || formData.tags.includes(t)) return;
    setFormData((p) => ({ ...p, tags: [...p.tags, t] }));
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((p) => ({
      ...p,
      tags: p.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const toggleCommentOption = (opt: string) => {
    setFormData((p) => {
      const has = p.commentOptions?.includes(opt);
      const next = has
        ? p.commentOptions!.filter((x) => x !== opt)
        : [...(p.commentOptions ?? []), opt];
      // Si on retire “dossier/complément”, on vide les nouveaux uploads (logique UX)
      if (!next.includes("dossier") && !next.includes("complément")) {
        setUploadedFiles([]);
      }
      return { ...p, commentOptions: next };
    });
  };

  const toggleObservationTag = (tag: string) => {
    setFormData((p) => {
      const has = p.observationTags?.includes(tag);
      const next = has
        ? p.observationTags!.filter((x) => x !== tag)
        : [...(p.observationTags ?? []), tag];
      return { ...p, observationTags: next };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
  };
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files) setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAndClose = () => {
    onClose();
  };

  const isValid = formData.subject.trim().length > 0;

  // mappe type -> channel (si jamais utile côté API via meta)
  const channelFromType = (t: keyof typeof INTERACTION_TYPES) => {
    switch (t) {
      case "telephone":
        return "phone";
      case "mail":
        return "email";
      case "courrier":
        return "postal";
      case "guichet":
        return "in-person";
      default:
        return String(t);
    }
  };

  const handleSaveAndClose = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      // On n’altère pas la signature onSave : on continue d’envoyer formData + type
      // mais on enrichit l’appel API (optionnel) avec meta
      await mockAPI.create({
        ...formData,
        type: selectedType,
        meta: {
          channel: channelFromType(selectedType),
          appointmentDate,
          appointmentMoved,
          convocationSelected,
          convocationReason,
          convocationDate,
          signatureConvention,
          terminationDate,
          selectedProlongations,
          prolongationDates,
          files: uploadedFiles.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        },
      } as any);

      onSave?.({ ...formData, type: selectedType });
      resetAndClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Liste des sujets : on cache “rendez-vous” si canal = courrier (alignement 2ᵉ comp)
  const filteredSubjects = PREDEFINED_SUBJECTS.filter((subject) => {
    if (selectedType === "courrier" && subject === "rendez-vous") return false;
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                headerColor
              )}
            >
              {React.createElement(
                iconMap[
                  (typeConfig?.icon as keyof typeof iconMap) || "MessageSquare"
                ],
                { className: "w-4 h-4" }
              )}
            </div>
            <span>{title}</span>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Sauvegarde…
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Canal */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Canal de communication
            </Label>
            <Select
              value={selectedType}
              onValueChange={(v) =>
                setSelectedType(v as keyof typeof INTERACTION_TYPES)
              }
            >
              <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTERACTION_TYPES).map(([key, cfg]) => {
                  const Icon =
                    iconMap[
                      (cfg.icon as keyof typeof iconMap) || "MessageSquare"
                    ];
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sujet */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Sujet <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredSubjects.map((subject) => (
                <Button
                  key={subject}
                  variant={formData.subject === subject ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSubjectSelect(subject)}
                  className="justify-start"
                >
                  {subject}
                </Button>
              ))}
            </div>
          </div>

          {/* Champs spécifiques par sujet */}
          {formData.subject === "rendez-vous" && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rendez-vous</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate" className="text-sm">
                      Date du rendez-vous
                    </Label>
                    <Input
                      id="appointmentDate"
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="appointmentMoved"
                      checked={appointmentMoved}
                      onCheckedChange={(checked) =>
                        setAppointmentMoved(!!checked)
                      }
                    />
                    <Label htmlFor="appointmentMoved" className="text-sm">
                      Rendez-vous déplacé
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {formData.subject === "contrôle" && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Contrôle</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="convocationSelected"
                      checked={convocationSelected}
                      onCheckedChange={(checked) =>
                        setConvocationSelected(!!checked)
                      }
                    />
                    <Label htmlFor="convocationSelected" className="text-sm">
                      Convocation
                    </Label>
                  </div>

                  {convocationSelected && (
                    <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Motif de la convocation
                        </Label>
                        <Select
                          value={convocationReason}
                          onValueChange={setConvocationReason}
                        >
                          <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                            <SelectValue placeholder="Sélectionner un motif..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenu-trop-eleve">
                              Revenu trop élevé
                            </SelectItem>
                            <SelectItem value="sous-occupation">
                              Sous-occupation notoire
                            </SelectItem>
                            <SelectItem value="devoir-information">
                              Devoir d'information
                            </SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="convocationDate" className="text-sm">
                          Date de convocation
                        </Label>
                        <Input
                          id="convocationDate"
                          type="datetime-local"
                          value={convocationDate}
                          onChange={(e) => setConvocationDate(e.target.value)}
                          className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {formData.subject === "résiliation" && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Résiliation</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="signatureConvention"
                      checked={signatureConvention}
                      onCheckedChange={(checked) =>
                        setSignatureConvention(!!checked)
                      }
                    />
                    <Label htmlFor="signatureConvention" className="text-sm">
                      Signature de convention
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terminationDate" className="text-sm">
                      Date de résiliation
                    </Label>
                    <Input
                      id="terminationDate"
                      type="date"
                      value={terminationDate}
                      onChange={(e) => setTerminationDate(e.target.value)}
                      className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Commentaire */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Commentaire</Label>
            <Textarea
              placeholder="Commentaire sur l'interaction…"
              value={formData.comment}
              onChange={(e) =>
                setFormData((p) => ({ ...p, comment: e.target.value }))
              }
              rows={3}
              className="resize-none"
            />

            {/* Options (cases à cocher “bouton”) — dynamique selon sujet */}
            <div className="flex flex-wrap gap-2">
              {(formData.subject === "autres"
                ? ["complément", "dénonciation"]
                : [
                    "dossier",
                    "docs listés",
                    "complément",
                    "conditions",
                    "recours",
                    "réclamation",
                  ]
              ).map((opt) => {
                const active = formData.commentOptions?.includes(opt);
                return (
                  <Button
                    key={opt}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCommentOption(opt)}
                    className="capitalize"
                  >
                    {opt}
                  </Button>
                );
              })}
            </div>

            {/* Pièces jointes (affichées seulement si “dossier” ou “complément”) */}
            {(formData.commentOptions?.includes("dossier") ||
              formData.commentOptions?.includes("complément")) && (
              <div
                className={cn(
                  "space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors",
                  isDragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                )}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Label className="text-sm font-medium">Pièces jointes</Label>

                {/* Pièces existantes (mode édition) */}
                {(initialValues?.meta?.files?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">
                      Pièces existantes :
                    </Label>
                    {(initialValues!.meta!.files as any[]).map((f, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="underline">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center py-4">
                  <div className="text-slate-600 mb-2">
                    Glissez-déposez vos fichiers ici ou
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Sélectionner des fichiers
                    </label>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">
                      Fichiers sélectionnés :
                    </Label>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-slate-700">
                            {file.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Observations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Observations</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isAlert}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({ ...p, isAlert: !!checked }))
                  }
                />
                <Label className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Alerte
                </Label>
              </div>
            </div>

            <Textarea
              placeholder="Détails de l'interaction…"
              value={formData.observations}
              onChange={(e) =>
                setFormData((p) => ({ ...p, observations: e.target.value }))
              }
              rows={4}
              className="resize-none"
            />

            <div className="flex gap-2">
              {["Refus", "Incomplet", "Dérogation"].map((tag) => {
                const active = formData.observationTags?.includes(tag);
                return (
                  <Button
                    key={tag}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleObservationTag(tag)}
                    className={
                      tag === "Refus"
                        ? "text-red-700 border-red-200 hover:bg-red-50"
                        : ""
                    }
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Suivi (onglets) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Suivi</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedTab === "tache" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedTab(selectedTab === "tache" ? null : "tache")
                }
                className="flex-1"
              >
                Tâche
              </Button>
              <Button
                variant={selectedTab === "journal" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedTab(selectedTab === "journal" ? null : "journal")
                }
                className="flex-1"
              >
                Journal
              </Button>
              <Button
                variant={selectedTab === "information" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedTab(
                    selectedTab === "information" ? null : "information"
                  )
                }
                className="flex-1"
              >
                Information
              </Button>
            </div>
          </div>

          <Separator />

          {/* Tags collaborateurs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Tags (collaborateurs à notifier)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un collaborateur…"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className="flex-1"
              />
              <Button
                onClick={handleAddTag}
                disabled={
                  !newTag.trim() || formData.tags.includes(newTag.trim())
                }
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-2">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-slate-500">
              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs ml-1">
                Ctrl+Enter
              </kbd>{" "}
              {submitLabel} •{" "}
              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs ml-1">
                Esc
              </kbd>{" "}
              Fermer
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetAndClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveAndClose}
                disabled={!isValid || isSaving}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InteractionDialog;
