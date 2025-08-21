import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Mail, CalendarDays, Plane } from 'lucide-react';

/**
 * AgendaPage
 * - Page parent pour l'Agenda avec sous-navigation (Convocation, Planning, Vacances)
 * - Rend un <Outlet /> pour les sous-routes
 * - Tabs basés sur l'URL (NavLink)
 */
export default function AgendaPage() {
  const location = useLocation();

  const tabs = [
    { to: '/agenda/convocation', label: 'Convocation', icon: Mail },
    { to: '/agenda/planning', label: 'Planning', icon: CalendarDays },
    { to: '/agenda/vacances', label: 'Vacances', icon: Plane },
  ];

  return (
    <div className="space-y-6">
      {/* Sous-nav (onglets) */}
      <nav className="flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" aria-label="Sous-navigation Agenda">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-[140px] items-center gap-2 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
               ${isActive || location.pathname.startsWith(to)
                 ? 'bg-slate-900 text-white dark:bg-slate-700'
                 : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60'}`
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Contenu des sous-pages */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <Outlet />
      </div>
    </div>
  );
}