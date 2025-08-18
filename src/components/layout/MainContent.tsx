import React from 'react';
import { navigationSections } from '@/types/navigation';

interface MainContentProps {
  activeSection: string;
  children?: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ activeSection, children }) => {
  // Trouver l'item actif pour afficher le titre
  const activeItem = navigationSections
    .flatMap(section => section.items)
    .find(item => item.id === activeSection);

  return (
    <div className="ml-64 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {activeItem?.label || 'Page non trouvée'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {getPageDescription(activeSection)}
              </p>
            </div>
            
            {/* Actions contextuelles */}
            <div className="flex items-center gap-3">
              {/* Ici on pourra ajouter des boutons spécifiques à chaque section */}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="p-6">
        {children || (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {activeItem?.label}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Cette section est en cours de développement.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Bientôt disponible
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function getPageDescription(sectionId: string): string {
  const descriptions: Record<string, string> = {
    dashboard: 'Vue d\'ensemble de l\'activité et des indicateurs clés',
    tasks: 'Gestion des tâches et suivi des actions à effectuer',
    users: 'Gestion des usagers et de leurs dossiers',
    journal: 'Historique des actions et événements',
    housing: 'Gestion du parc de logements disponibles',
    leases: 'Gestion des contrats de bail et locations',
    calendar: 'Planification et suivi des rendez-vous',
    reports: 'Analyses et rapports statistiques',
    settings: 'Configuration système et gestion des utilisateurs'
  };
  
  return descriptions[sectionId] || 'Section non configurée';
}