import React from 'react';
import { User } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { SearchResult } from '@/types/search';

interface HeaderProps {
  onSearchResultSelect: (result: SearchResult) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchResultSelect }) => {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Barre de recherche globale */}
        <div className="flex-1 flex justify-center">
          <GlobalSearch onResultSelect={onSearchResultSelect} />
        </div>

        {/* Informations utilisateur */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Derval Botuna
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};