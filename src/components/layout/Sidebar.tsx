import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Home, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationSections } from '@/types/navigation';

const iconMap = {
  LayoutDashboard,
  CheckSquare,
  Users,
  BookOpen,
  Home,
  FileText,
  Calendar,
  BarChart3,
  Settings
};

interface SidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: keyof typeof iconMap;
}

const SidebarItem: React.FC<{
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const IconComponent = iconMap[item.icon] ?? FileText;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
        isActive
          ? // Active inversé
            "bg-blue-600 text-white dark:bg-white dark:text-slate-900 shadow-sm"
          : // Normal avec hover doux
            "text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <IconComponent
        className={cn(
          "h-5 w-5 transition-colors",
          isActive
            ? "text-white dark:text-slate-900"
            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white"
        )}
      />
      <span className="flex-1 text-left">{item.label}</span>
      {isActive && (
        <ChevronRight
          className={cn(
            "h-4 w-4",
            "text-white dark:text-slate-900"
          )}
        />
      )}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-sm z-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Galion
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestion d'usagers
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.id}>
            {sectionIndex > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 mb-4" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={activeSection === item.id}
                  onClick={() => onSectionChange(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};
