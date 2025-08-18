// src/pages/housing/HousingPage.tsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const SubTab: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-lg text-sm transition
       ${isActive
         ? 'bg-blue-600 text-white'
         : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`
    }
  >
    {label}
  </NavLink>
);

const HousingPage: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 flex-wrap">
        <SubTab to="/housing/llm-vacant" label="Liste des LLM vacants" />
        <SubTab to="/housing/gerances" label="Liste des gérances" />
        <SubTab to="/housing/immeubles" label="Liste des immeubles" />
      </div>

      {/* Ici s'affichent les sous-pages */}
      <Outlet />
    </div>
  );
};

export default HousingPage;
