import React from 'react';
import { NavLink } from 'react-router-dom';
import { navigationSections } from '@/types/navigation';
import * as Icons from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-6">
      {navigationSections.map(section => (
        <nav key={section.id} className="space-y-1">
          {section.items.map(item => {
            const Icon = (Icons as any)[item.icon] ?? Icons.Circle;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition
                   ${isActive ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      ))}
    </aside>
  );
};
