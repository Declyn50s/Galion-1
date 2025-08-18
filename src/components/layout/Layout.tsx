import React, { useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SearchResult } from '@/types/search';
import { navigationSections } from '@/types/navigation';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
export const Layout: React.FC = () => {
  const location = useLocation();

  // Aplatis les items de navigation
  const allItems = useMemo(() => navigationSections.flatMap(s => s.items), []);

  // Trouve l'item actif par "longest prefix match"
  const activeItem = useMemo(() => {
    const pathname = location.pathname;
    const sorted = [...allItems].sort((a, b) => b.path.length - a.path.length);
    return sorted.find(i => pathname === i.path || pathname.startsWith(i.path + '/'));
  }, [location.pathname, allItems]);

  const activeSection = activeItem?.id ?? 'unknown';

  const handleSearchResultSelect = (result: SearchResult) => {
    console.log('Selected search result:', result);
  };

  const getPageTitle = (): string => activeItem?.label || 'Page non trouvée';

  const getPageDescription = (): string => {
    const descriptions: Record<string, string> = {
      dashboard: "Vue d'ensemble de l'activité et des indicateurs clés",
      tasks: 'Gestion des tâches et suivi des actions à effectuer',
      users: 'Gestion des usagers et de leurs dossiers',
      journal: 'Historique des actions et événements',
      housing: 'Gestion du parc de logements disponibles',
      leases: 'Gestion des contrats de bail et locations',
      calendar: 'Planification et suivi des rendez-vous',
      reports: 'Analyses et rapports statistiques',
      settings: 'Configuration système et gestion des utilisateurs',
      session: 'Gestion des séances et décisions',
    };
    return descriptions[activeSection] || 'Section non configurée';
  };

  // Libellés de sous-rubriques
  const subHousingMap: Record<string, string> = {
    'llm-vacant': 'Liste des LLM vacants',
    'gerances': 'Liste des gérances',
    'immeubles': 'Liste des immeubles',
  };
  const subSessionMap: Record<string, string> = {
    'equipe': "Séance d'équipe",
    'recours': 'Recours / réclamation',
    'derogation': 'Dérogation',
  };

  const seg2 = location.pathname.split('/')[2]; // ex: "/housing/llm-vacant" -> "llm-vacant"
  const subCrumb =
    location.pathname.startsWith('/housing') ? subHousingMap[seg2] :
    location.pathname.startsWith('/session') ? subSessionMap[seg2] :
    undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <Header onSearchResultSelect={handleSearchResultSelect} />

      <div className="ml-64 pt-16">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-[calc(100vh-4rem)]">
          {/* Header de contenu */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {getPageDescription()}
                </p>
              </div>
            </div>
          </div>

          {/* Fil d’Ariane */}
          <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">{getPageTitle()}</span>

              {/* Exemple spécifique Users (garde si tu veux) */}
              {location.pathname.startsWith('/users') && (
                <>
                  <span className="mx-2">›</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">MARTIN Sophie</span>
                </>
              )}

              {/* Sous-rubriques Housing / Session */}
              {subCrumb && (
                <>
                  <span className="mx-2">›</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{subCrumb}</span>
                </>
              )}
            </div>
          </div>

          {/* Contenu des routes */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
