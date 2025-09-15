//src/components/interaction/CommentAndFiles.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommentAndFiles({
  comment,
  options,
  onComment,
  onToggleOption,
  uploadedFiles,
  onFilesSelected,
  onRemoveFile,
  isDragOver,
  setIsDragOver,
  existingFiles = [],
  subject,
}: {
  comment: string;
  options: string[];
  onComment: (v: string) => void;
  onToggleOption: (opt: string) => void;
  uploadedFiles: File[];
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  existingFiles?: Array<{ name: string }>;
  subject: string;
}) {
  const available =
    subject === "autres"
      ? ["complément", "dénonciation"]
      : ["dossier", "docs listés", "complément", "conditions", "recours", "réclamation"];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Commentaire</label>
      <Textarea
        placeholder="Commentaire sur l'interaction…"
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        rows={3}
        className="resize-none"
      />

      <div className="flex flex-wrap gap-2">
        {available.map((opt) => {
          const active = options?.includes(opt);
          return (
            <Button
              key={opt}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleOption(opt)}
              className="capitalize"
            >
              {opt}
            </Button>
          );
        })}
      </div>

      {(options?.includes("dossier") || options?.includes("complément")) && (
        <DropZone
          isDragOver={isDragOver}
          setIsDragOver={setIsDragOver}
          uploadedFiles={uploadedFiles}
          onFilesSelected={onFilesSelected}
          onRemoveFile={onRemoveFile}
          existingFiles={existingFiles}
        />
      )}
    </div>
  );
}

function DropZone({
  isDragOver,
  setIsDragOver,
  uploadedFiles,
  onFilesSelected,
  onRemoveFile,
  existingFiles,
}: {
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  uploadedFiles: File[];
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  existingFiles?: Array<{ name: string }>;
}) {
  return (
    <div
      className={cn(
        "space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors",
        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"
      )}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        onFilesSelected(e.dataTransfer.files);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
    >
      <Label className="text-sm font-medium">Pièces jointes</Label>

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Pièces existantes :</Label>
          {existingFiles.map((f, idx) => (
            <div key={`existing-${idx}`} className="flex items-center gap-2 text-sm text-slate-700">
              <Paperclip className="h-4 w-4" />
              <span className="underline">{f.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-center py-4">
        <div className="text-slate-600 mb-2">Glissez-déposez vos fichiers ici ou</div>
        <div className="space-y-2">
          <input
            type="file"
            multiple
            onChange={(e) => onFilesSelected(e.target.files)}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
        >
          Sélectionner des fichiers
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Fichiers sélectionnés :</Label>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-slate-700">{file.name}</span>
                <span className="text-xs text-slate-500">({Math.round(file.size / 1024)} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1"
                aria-label="Retirer le fichier"
                title="Retirer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
