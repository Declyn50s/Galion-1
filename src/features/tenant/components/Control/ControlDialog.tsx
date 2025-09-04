// modale avec résultats + CTA décision
// src/features/tenant/components/ControlDialog/ControlDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ControlPanel from "./ControlPanel";


// Aligné avec tes usages actuels
export type LawKind = "LC.75" | "LC.2007" | "RC" | "UNKNOWN";

type Exceptions = {
  dm4Concierge?: boolean;
  dm5AVSSeul3p?: boolean;
};

type ChangeDelta = {
  rooms?: number;
  rentNetMonthly?: number;
  rduTotal?: number;
  exceptions?: Exceptions;
};

export interface ControlDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;

  // Données d’entrée pour le contrôle
  law: LawKind;
  adults: number;
  minors: number;

  // Infos bail + revenu
  rooms?: number;
  rentNetMonthly?: number;
  rduTotal?: number;

  // Exceptions (DM4/DM5)
  exceptions?: Exceptions;

  // Callbacks
  onChange?: (delta: ChangeDelta) => void;
  onRun?: (result: any) => void;

  title?: string;
}

/**
 * Modale d’orchestration du contrôle.
 * Rôle: encapsuler ControlPanel dans un Dialog shadcn/ui.
 */
const ControlDialog: React.FC<ControlDialogProps> = ({
  open,
  onOpenChange,
  law,
  adults,
  minors,
  rooms,
  rentNetMonthly,
  rduTotal,
  exceptions,
  onChange,
  onRun,
  title = "Contrôle du locataire",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ControlPanel
          law={law}
          adults={adults}
          minors={minors}
          rooms={rooms}
          rentNetMonthly={rentNetMonthly}
          rduTotal={rduTotal}
          exceptions={exceptions}
          onChange={onChange}
          onRun={onRun}
        />

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ControlDialog;
