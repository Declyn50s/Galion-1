// src/features/tenant/components/LeaseCard.tsx
import React from "react";
import BailCard from "./lease/BailCard";
import RentAidCard from "./lease/RentAidCard";
import TerminationCard from "./lease/TerminationCard";
import type { LeaseValue } from "./lease/types";

export type LeaseCardProps = {
  value?: LeaseValue;
  onChange?: (next: LeaseValue) => void;

  onModifyDates?: () => void;
  onModifyRent?: () => void;
  onTerminateLease?: () => void;

  className?: string;
};

const LeaseCard: React.FC<LeaseCardProps> = ({
  value,
  onChange,
  onModifyDates,
  onModifyRent,
  onTerminateLease,
  className,
}) => {
  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      <BailCard value={value} onChange={onChange} onModifyDates={onModifyDates} />
      <RentAidCard value={value} onChange={onChange} onModifyRent={onModifyRent} />
      <TerminationCard value={value} onChange={onChange} onTerminateLease={onTerminateLease} />
    </div>
  );
};

export default LeaseCard;
