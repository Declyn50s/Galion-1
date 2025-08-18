import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SearchResult } from '@/types/search';
import { navigationSections } from '@/types/navigation';

interface LayoutProps {
  children?: React.ReactNode;
  defaultSection?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, defaultSection = 'users' }) => {
  const [activeSection, setActiveSection] = useState(defaultSection);

  const handleSearchResultSelect = (result: SearchResult) => {
    // Logique de sélection de résultat de recherche (à implémenter)
    console.log('Selected search result:', result);
  };

  const getPageTitle = (): string => {
    const activeItem = navigationSections
      .flatMap(section => section.items)
      .find(item => item.id === activeSection);
    
    return activeItem?.label || 'Page non trouvée';
  };

  const getPageDescription = (): string => {
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
    
    return descriptions[activeSection] || 'Section non configurée';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <Header onSearchResultSelect={handleSearchResultSelect} />
      
      <div className="ml-64 pt-16">
        {/* Contenu principal */}
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
          
          {/* Fil d'Ariane */}
          <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">{getPageTitle()}</span>
              {activeSection === 'users' && (
                <>
                  <span className="mx-2">›</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">MARTIN Sophie</span>
                </>
              )}
            </div>
          </div>
          
          {/* Contenu */}
          <main className="p-6">
            {children || (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {getPageTitle()}
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
      </div>
    </div>
  );
};