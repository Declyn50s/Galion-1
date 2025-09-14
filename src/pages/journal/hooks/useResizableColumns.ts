import { useEffect, useRef, useState } from "react";
import type { ColKey } from "../types";
import { INITIAL_WIDTHS, MIN_WIDTHS } from "../constants";

export function useResizableColumns() {
  const [colWidths, setColWidths] =
    useState<Record<ColKey, number>>(INITIAL_WIDTHS);

  const dragState = useRef<{ key: ColKey | null; startX: number; startW: number } | null>(null);
  const resizeStartRef = useRef<(key: ColKey, startX: number) => void>(() => {});

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragState.current;
      if (!d || !d.key) return;
      const dx = e.clientX - d.startX;
      setColWidths((prev) => {
        const next = { ...prev };
        const min = MIN_WIDTHS[d.key];
        next[d.key] = Math.max(min, d.startW + dx);
        return next;
      });
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    };
    const onUp = () => {
      dragState.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    const start = (key: ColKey, startX: number) => {
      dragState.current = { key, startX, startW: colWidths[key] };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
    (resizeStartRef as any).current = start;
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [colWidths]);

  const onResizeMouseDown = (key: ColKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current(key, e.clientX);
  };

  return { colWidths, onResizeMouseDown };
}
