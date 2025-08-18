export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    id: 'main',
    items: [
      {
        id: 'dashboard',
        label: 'Tableau de bord',
        icon: 'LayoutDashboard',
        path: '/dashboard'
      },
      {
        id: 'tasks',
        label: 'Tâches',
        icon: 'CheckSquare',
        path: '/tasks'
      },
      {
        id: 'users',
        label: 'Usagers',
        icon: 'Users',
        path: '/users'
      },
      {
        id: 'journal',
        label: 'Journal',
        icon: 'BookOpen',
        path: '/journal'
      }
    ]
  },
  {
    id: 'housing',
    items: [
      {
        id: 'housing',
        label: 'Logements',
        icon: 'Home',
        path: '/housing'
      },
      {
        id: 'leases',
        label: 'Baux',
        icon: 'FileText',
        path: '/leases'
      }
    ]
  },
  {
    id: 'tools',
    items: [
      {
        id: 'calendar',
        label: 'Agenda',
        icon: 'Calendar',
        path: '/calendar'
      },
      {
        id: 'reports',
        label: 'Statistiques / Rapports',
        icon: 'BarChart3',
        path: '/reports'
      },
      {
        id: 'session',
        label: 'Séances',
        icon: 'Presentation',
        path: '/session'
      },
      {
        id: 'memo',
        label: 'Mémento',
        icon: 'StickyNote',
        path: '/memo'
      }
    ]
  },
  {
    id: 'admin',
    items: [
      {
        id: 'settings',
        label: 'Paramètres / Gestion des utilisateurs',
        icon: 'Settings',
        path: '/settings'
      }
    ]
  }
];