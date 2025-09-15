//src/components/interaction/useAutosave.ts
import { useEffect, useRef, useState } from "react";
import { mockAPI, InteractionFormData } from "@/types/interaction";

type AutosaveMeta = {
  appointmentDate: string;
  appointmentMoved: boolean;
  convocationSelected: boolean;
  convocationReason: string;
  convocationDate: string;
  signatureConvention: boolean;
  terminationDate: string;
  selectedProlongations: string[];
  prolongationDates: Record<string, string>;
  files: { name: string; size: number; type: string }[];
};

export function useAutosave(payload: {
  formData: InteractionFormData;
  meta: AutosaveMeta;
  enabled?: boolean;
}) {
  const { formData, meta, enabled = true } = payload;
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !formData.subject) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      mockAPI
        .update("temp-id", { ...formData, meta } as any)
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [enabled, formData, meta]);

  return { isSaving };
}