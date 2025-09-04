// src/features/user-profile/components/HeaderBar.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Copy, FileText, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  isApplicant: boolean;
  isTenant: boolean;
  onSave: () => void;
  onCopyAddress: () => void;

  /** Handler du bouton d’action (si fourni on affiche le bouton) */
  onAction?: () => void;

  /** Routes pour naviguer entre Demandeur / Locataire */
  applicantTo?: string;
  tenantTo?: string;

  /** Optionnel : forcer le libellé (sinon auto: Demandeur=Attestation, Locataire=Contrôle) */
  actionLabel?: string;
};

const pillBase =
  "inline-flex items-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-3 py-1.5 text-sm font-medium";

const HeaderBar: React.FC<Props> = ({
  isApplicant,
  isTenant,
  onSave,
  onCopyAddress,
  onAction,
  applicantTo,
  tenantTo,
  actionLabel,
}) => {
  const { pathname } = useLocation();
  const onApplicantView = pathname.startsWith("/users/");
  const onTenantView = pathname.startsWith("/tenants/");

  // Libellé d’action automatique si non fourni
  const effectiveActionLabel =
    actionLabel ?? (onTenantView ? "Contrôle" : "Attestation");

  // Styles des pills — on met un anneau bien visible sur la page active
  const applicantPill = (() => {
    const active = onApplicantView && isApplicant;
    const clickable = !!applicantTo && !active && isApplicant;
    if (active) return `${pillBase} text-white bg-red-600 border-red-600 ring-2 ring-red-300`;
    if (clickable) return `${pillBase} text-red-700 bg-red-50 border-red-200 hover:bg-red-100`;
    if (isApplicant) return `${pillBase} text-red-700 bg-red-50 border-red-200`;
    return `${pillBase} text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed`;
  })();

  const tenantPill = (() => {
    const active = onTenantView && isTenant;
    const clickable = !!tenantTo && !active && isTenant;
    if (active) return `${pillBase} text-white bg-green-500 border-green-500 ring-2 ring-green-300`;
    if (clickable) return `${pillBase} text-green-700 bg-green-50 border-green-200 hover:bg-green-100`;
    if (isTenant) return `${pillBase} text-green-700 bg-green-50 border-green-200`;
    return `${pillBase} text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed`;
  })();

  // Icône d’action selon page (docs vs contrôle)
  const ActionIcon = onTenantView ? ShieldCheck : FileText;

  return (
    <div className="flex justify-between items-center">
      {/* Pills Demandeur / Locataire */}
      <div className="flex gap-2">
        {isApplicant && applicantTo ? (
          <Link
            to={applicantTo}
            className={applicantPill}
            aria-current={onApplicantView ? "page" : undefined}
          >
            Demandeur
          </Link>
        ) : (
          <div className={applicantPill}>
            <span>Demandeur</span>
          </div>
        )}

        {isTenant && tenantTo ? (
          <Link
            to={tenantTo}
            className={tenantPill}
            aria-current={onTenantView ? "page" : undefined}
          >
            Locataire
          </Link>
        ) : (
          <div className={tenantPill}>
            <span>Locataire</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={onCopyAddress}>
          <Copy className="h-4 w-4" /> Copier adresse
        </Button>

        {onAction && (
          <Button variant="outline" className="gap-2" onClick={onAction}>
            <ActionIcon className="h-4 w-4" />
            {effectiveActionLabel}
          </Button>
        )}

        <Button className="gap-2" onClick={onSave}>
          <Save className="h-4 w-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default HeaderBar;
