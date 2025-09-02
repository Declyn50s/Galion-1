import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Save, Copy } from "lucide-react";

type Props = {
  /** Statuts “métier” (coloration) */
  isApplicant?: boolean; // => pill Demandeur rouge si true
  isTenant?: boolean;    // => pill Locataire verte si true

  /** Actions */
  onSave: () => void;
  onAttestation: () => void;
  onCopyAddress: () => void;

  /** Routes de navigation (si définies => cliquable) */
  applicantTo?: string;  // ex: `/users/:id`
  tenantTo?: string;     // ex: `/tenants/:id` (ne pas fournir si non-locataire)
};

const pillBase =
  "inline-flex items-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-3 py-1.5 text-sm font-medium";
const pillNeutral = "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100";
const pillApplicantActive = "bg-rose-500 text-white border-rose-500";
const pillTenantActive   = "bg-green-500 text-white border-green-500";
const pillActiveOutline  = "ring-2 ring-slate-300"; // sur la vue en cours (visuel léger)

function Pill({
  to,
  children,
  className,
  title,
  isActive,
}: {
  to?: string;
  children: React.ReactNode;
  className: string;
  title?: string;
  isActive?: boolean;
}) {
  const cls = `${pillBase} ${className} ${isActive ? pillActiveOutline : ""}`;
  return to ? (
    <Link to={to} className={cls} title={title}>
      {children}
    </Link>
  ) : (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

const HeaderBar: React.FC<Props> = ({
  isApplicant = false,
  isTenant = false,
  onSave,
  onAttestation,
  onCopyAddress,
  applicantTo,
  tenantTo,
}) => {
  const { pathname } = useLocation();
  const onApplicantView = applicantTo && pathname.startsWith(applicantTo);
  const onTenantView = tenantTo && pathname.startsWith(tenantTo);

  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        {/* Toujours ROUGE si isApplicant=true (même sur Locataire) ; neutre sinon */}
        <Pill
          to={applicantTo}
          className={isApplicant ? pillApplicantActive : pillNeutral}
          title="Aller à la vue Demandeur"
          isActive={!!onApplicantView}
        >
          Demandeur
        </Pill>

        {/* VERTE uniquement si isTenant=true, sinon neutre.
            Si la personne n’est pas locataire, ne PAS fournir tenantTo => non cliquable */}
        <Pill
          to={tenantTo}
          className={isTenant ? pillTenantActive : pillNeutral}
          title={tenantTo ? "Aller à la vue Locataire" : "Non locataire"}
          isActive={!!onTenantView}
        >
          Locataire
        </Pill>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={onAttestation}>
          <FileText className="h-4 w-4" /> Attestation
        </Button>
        <Button variant="outline" className="gap-2" onClick={onCopyAddress}>
          <Copy className="h-4 w-4" /> Copier adresse
        </Button>
        <Button className="gap-2" onClick={onSave}>
          <Save className="h-4 w-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default HeaderBar;
