//src/components/entry/EntryAttachments.tsx
import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

type Props = {
  onFilesSelected: (files: FileList | null) => void;
};

const EntryAttachments: React.FC<Props> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-400">Pièces jointes</label>
      <div
        className={`mt-2 rounded border-2 border-dashed p-4 text-sm cursor-pointer select-none ${
          dragOver ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFilesSelected(e.dataTransfer.files);
        }}
        role="button"
        aria-label="Déposer des fichiers ici ou cliquer pour sélectionner"
      >
        <div className="flex items-center justify-center gap-2">
          <UploadCloud className="h-5 w-5" />
          <span>
            Glisser-déposer, ou <span className="underline">cliquer</span>
          </span>
        </div>
        <div className="mt-1 text-[11px] text-gray-500">PDF, PNG/JPG, DOCX • 10 Mo max/fichier</div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => onFilesSelected(e.target.files)}
          aria-hidden
        />
      </div>
    </div>
  );
};

export default EntryAttachments;
