import React from "react";
import { NavLink, Link } from "react-router-dom";
import { navigationSections } from "@/types/navigation";
import * as Icons from "lucide-react";
// import logoUrl from '../../images/logo.png';
import logoUrl from "@/images/Galion-Logo.png";

export const Sidebar: React.FC = () => {
  const [journalPulse, setJournalPulse] = React.useState(false);
  const pulseTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const onAdd = () => {
      // reset si plusieurs publications rapprochées
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      setJournalPulse(true);
      pulseTimeoutRef.current = window.setTimeout(() => {
        setJournalPulse(false);
        pulseTimeoutRef.current = null;
      }, 1200);
    };

    window.addEventListener("journal:add", onAdd as EventListener);
    return () => {
      window.removeEventListener("journal:add", onAdd as EventListener);
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-6">
      {/* Logo en tête */}
      <div className="px-3">
        <Link to="/" className="inline-flex items-center">
          <img
            src={logoUrl}
            alt="Galion"
            className="h-15 w-auto"
            loading="eager"
          />
        </Link>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-800" />

      {navigationSections.map((section) => (
        <nav key={section.id} className="space-y-1">
          {section.items.map((item) => {
            const Icon = (Icons as any)[item.icon] ?? Icons.Circle;
            const isJournal = item.path === "/journal" || item.id === "journal";
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2 rounded-lg transition
                   ${
                     isActive
                       ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                       : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                   }
                   ${
                     isJournal && journalPulse
                       ? "ring-2 ring-emerald-400 animate-pulse"
                       : ""
                   }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isJournal && (
                  <span
                    className={`ml-auto h-2 w-2 rounded-full bg-emerald-500 ${
                      journalPulse ? "animate-ping" : "hidden"
                    }`}
                    aria-hidden
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
      ))}
    </aside>
  );
};
