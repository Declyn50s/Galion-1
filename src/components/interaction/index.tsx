import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  InteractionFormData,
  INTERACTION_TYPES,
  mockAPI,
} from "@/types/interaction";

import ChannelSelect from "./ChannelSelect";
import SubjectButtons from "./SubjectButtons";
import RendezVousFields from "./RendezVousFields";
import ControleFields from "./ControleFields";
import ResiliationFields from "./ResiliationFields";
import CommentAndFiles from "./CommentAndFiles";
import Observations from "./Observations";
import FollowTabs, { FollowTab } from "./FollowTabs";
import TagsInput from "./TagsInput";
import FooterActions from "./FooterActions";

import { iconMap, headerColorFor } from "./utils";
import { publishToJournal, JournalTache, JournalUtilisateur } from "./journal";
import { useAutosave } from "./useAutosave";

type InitialValues = Partial<
  InteractionFormData & {
    type?: keyof typeof INTERACTION_TYPES;
    meta?: {
      files?: Array<{ name: string; url?: string; size?: number; type?: string }>;
      observationTags?: string[];
    };
  }
>;

interface InteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: keyof typeof INTERACTION_TYPES;
  onSave?: (data: InteractionFormData & { type: keyof typeof INTERACTION_TYPES }) => void;
  initialValues?: InitialValues;
  submitLabel?: string;
  title?: string;
  /* Journal */
  relatedUsers?: JournalUtilisateur[];
  dossierId?: string;
  nss?: string;
  agentName?: string;
  onPublishedToJournal?: (t: JournalTache) => void;
  isLLM?: boolean;
}

const InteractionDialog: React.FC<InteractionDialogProps> = ({
  isOpen,
  onClose,
  initialType,
  onSave,
  initialValues,
  submitLabel = "Sauvegarder et fermer",
  title = "Nouvelle interaction",
  relatedUsers = [],
  dossierId = "DOS-AUTO",
  nss = "",
  agentName = "Agent",
  onPublishedToJournal,
  isLLM,
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
    commentOptions: [],
    observationTags: [],
  });

  const [selectedTab, setSelectedTab] = useState<FollowTab>(null);
  const [journalPublished, setJournalPublished] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // champs spécifiques
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

  // tags collaborateurs
  const [newTag, setNewTag] = useState("");

  // hydrate/reset
  useEffect(() => {
    if (!isOpen) return;
    if (initialValues) {
      setSelectedType((initialValues.type as any) || initialType);
      setFormData({
        subject: initialValues.subject ?? "",
        customSubject: initialValues.customSubject ?? "",
        comment: initialValues.comment ?? "",
        tags: initialValues.tags ?? [],
        observations: initialValues.observations ?? "",
        isAlert: !!initialValues.isAlert,
        commentOptions: initialValues.commentOptions ?? [],
        observationTags:
          initialValues.observationTags ?? initialValues.meta?.observationTags ?? [],
      });
      setJournalPublished(false);
    } else {
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
      setJournalPublished(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValues, initialType]);

  // autosave (mock)
  const autosaveMeta = useMemo(
    () => ({
      appointmentDate,
      appointmentMoved,
      convocationSelected,
      convocationReason,
      convocationDate,
      signatureConvention,
      terminationDate,
      selectedProlongations,
      prolongationDates,
      files: uploadedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    }),
    [
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
    ]
  );

  const { isSaving } = useAutosave({ formData, meta: autosaveMeta, enabled: isOpen });

  // raccourcis
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "s" || e.key === "Enter")) {
        e.preventDefault();
        handleSaveAndClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData, selectedType]);

  // handlers simples
  const setSubject = (s: string) => {
    setJournalPublished(false);
    setFormData((p) => ({ ...p, subject: s }));
  };
  const toggleCommentOption = (opt: string) => {
    setJournalPublished(false);
    setFormData((p) => {
      const has = p.commentOptions?.includes(opt);
      const next = has ? p.commentOptions!.filter((x) => x !== opt) : [...(p.commentOptions ?? []), opt];
      if (!next.includes("dossier") && !next.includes("complément")) setUploadedFiles([]);
      return { ...p, commentOptions: next };
    });
  };
  const toggleObservationTag = (tag: string) => {
    setJournalPublished(false);
    setFormData((p) => {
      const has = p.observationTags?.includes(tag);
      const next = has ? p.observationTags!.filter((x) => x !== tag) : [...(p.observationTags ?? []), tag];
      return { ...p, observationTags: next };
    });
  };
  const addTag = () => {
    const t = newTag.trim();
    if (!t || formData.tags.includes(t)) return;
    setFormData((p) => ({ ...p, tags: [...p.tags, t] }));
    setNewTag("");
  };
  const removeTag = (t: string) =>
    setFormData((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setJournalPublished(false);
    setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
  };
  const onRemoveFile = (index: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const isValid = formData.subject.trim().length > 0;

  const handleSaveAndClose = async () => {
    if (!isValid) return;
    try {
      await mockAPI.create({
        ...formData,
        type: selectedType,
        meta: { ...autosaveMeta, channel: selectedType },
      } as any);

      const published = await publishToJournal({
        formData,
        selectedType,
        relatedUsers,
        dossierId,
        nss,
        agentName,
        isLLM,
      });
      setJournalPublished(true);

      toast.success("Publié dans le journal", {
        description: `Entrée ${published.id} enregistrée.`,
        duration: 2000,
      });

      onSave?.({ ...formData, type: selectedType });
      onClose();
    } catch (err: any) {
      toast.error("Échec de la publication", {
        description: err?.message ?? "Une erreur est survenue.",
      });
      throw err;
    }
  };

  const Icon = iconMap[
    (INTERACTION_TYPES[selectedType]?.icon as keyof typeof iconMap) || "MessageSquare"
  ];
  const headerColor = headerColorFor(selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${headerColor}`}>
              <Icon className="w-4 h-4" />
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
          <ChannelSelect
            value={selectedType}
            onChange={(v) => {
              setJournalPublished(false);
              setSelectedType(v);
            }}
          />

          {/* Sujet */}
          <SubjectButtons
            channel={selectedType}
            value={formData.subject}
            onSelect={setSubject}
          />

          {/* Champs spécifiques */}
          {formData.subject === "rendez-vous" && (
            <RendezVousFields
              date={appointmentDate}
              moved={appointmentMoved}
              onDate={setAppointmentDate}
              onMoved={(v) => setAppointmentMoved(v)}
            />
          )}

          {formData.subject === "contrôle" && (
            <ControleFields
              enabled={convocationSelected}
              reason={convocationReason}
              date={convocationDate}
              onEnabled={(v) => setConvocationSelected(v)}
              onReason={setConvocationReason}
              onDate={setConvocationDate}
            />
          )}

          {formData.subject === "résiliation" && (
            <ResiliationFields
              signature={signatureConvention}
              date={terminationDate}
              onSignature={(v) => setSignatureConvention(v)}
              onDate={setTerminationDate}
            />
          )}

          {/* Commentaire + Fichiers */}
          <CommentAndFiles
            comment={formData.comment}
            options={formData.commentOptions ?? []}
            onComment={(v) => {
              setJournalPublished(false);
              setFormData((p) => ({ ...p, comment: v }));
            }}
            onToggleOption={toggleCommentOption}
            uploadedFiles={uploadedFiles}
            onFilesSelected={onFilesSelected}
            onRemoveFile={onRemoveFile}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            existingFiles={initialValues?.meta?.files as any[]}
            subject={formData.subject}
          />

          {/* Observations */}
          <Observations
            text={formData.observations}
            isAlert={formData.isAlert}
            tags={formData.observationTags ?? []}
            onText={(v) => setFormData((p) => ({ ...p, observations: v }))}
            onAlert={(v) => setFormData((p) => ({ ...p, isAlert: v }))}
            onToggleTag={toggleObservationTag}
          />

          {/* Suivi */}
          <FollowTabs selected={selectedTab} onSelect={setSelectedTab} published={journalPublished} />

          {/* Tags collaborateurs */}
          <TagsInput
            tags={formData.tags}
            newTag={newTag}
            setNewTag={setNewTag}
            addTag={addTag}
            removeTag={removeTag}
          />

          {/* Actions */}
          <FooterActions
            canSubmit={isValid}
            onCancel={onClose}
            onSubmit={handleSaveAndClose}
            submitLabel={submitLabel}
            isSaving={isSaving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InteractionDialog;
