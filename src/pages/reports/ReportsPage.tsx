import React, { useEffect } from 'react';
import {
  useLocation,
  useNavigate,
  useInRouterContext,
  MemoryRouter,
} from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart, LineChart } from 'lucide-react';
import ReportsOCL from '@/pages/reports/ReportsOCL';


/**
 * Statistiques / Rapports — Page parent avec sous-onglets
 * - Deux sous-onglets: "Stats Gestion OCL" et "Stat Personnelles"
 * - Onglets synchronisés avec l'URL: /reports/ocl et /reports/personnelles
 * - Desktop-first, Tailwind + shadcn/ui
 *
 * 🔧 Robustesse: si ce composant est monté en dehors d'un <Router>,
 *   on fournit un fallback <MemoryRouter> pour éviter l'erreur
 *   "useLocation() may be used only in the context of a <Router>".
 */

const TAB_OCL = 'ocl';
const TAB_PERSONNELLES = 'personnelles';

/**
 * Wrapper résilient: si on n'est PAS dans un Router, on encapsule
 * la version interne dans un <MemoryRouter> avec /reports/ocl par défaut.
 */
export const ReportsPage: React.FC = () => {
  const inRouter = useInRouterContext();

  if (!inRouter) {
    if (typeof window !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
      // Aide dev : signale le fallback pour corriger l'intégration au besoin
      // (ne bloque pas l'exécution)
      console.warn(
        '[ReportsPage] Monté en dehors d\'un <Router>. Fallback MemoryRouter activé.\n' +
          '➡️ Intègre ce composant sous <BrowserRouter> et une route: <Route path="/reports/*" element={<ReportsPage/>} />'
      );
    }
    return (
      <MemoryRouter initialEntries={[`/reports/${TAB_OCL}`]}>
        <ReportsPageInner />
      </MemoryRouter>
    );
  }

  return <ReportsPageInner />;
};

/**
 * Version interne: suppose la présence d'un Router (fourni par l'app
 * ou par le fallback MemoryRouter ci-dessus). Utilise useLocation/useNavigate.
 */
const ReportsPageInner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Déduire l'onglet actif depuis l'URL
  const pathname = location.pathname;
  const activeTab = pathname.includes(`/${TAB_PERSONNELLES}`) ? TAB_PERSONNELLES : TAB_OCL;

  // Rediriger /reports -> /reports/ocl par défaut
  useEffect(() => {
    const endsWithReports = /\/reports\/?$/.test(pathname);
    if (endsWithReports) navigate(`/reports/${TAB_OCL}`, { replace: true });
  }, [pathname, navigate]);

  const handleTabChange = (value: string) => {
    if (value === TAB_OCL) navigate('/reports/ocl');
    else if (value === TAB_PERSONNELLES) navigate('/reports/personnelles');
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value={TAB_OCL} className="gap-2">
            <BarChart3 className="h-4 w-4" /> Stats Gestion OCL
          </TabsTrigger>
          <TabsTrigger value={TAB_PERSONNELLES} className="gap-2">
            <PieChart className="h-4 w-4" /> Stat Personnelles
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_OCL} className="space-y-4">
  <ReportsOCL />
</TabsContent>


        <TabsContent value={TAB_PERSONNELLES} className="space-y-4">
          <SectionIntro
            title="Statistiques personnelles"
            description="Vue centrée sur l'agent connecté: productivité, tâches, délais."
          />

          <div className="grid grid-cols-3 gap-4">
            <KPI title="Dossiers traités" value="24" note="Semaine en cours" />
            <KPI title="Rendez-vous tenus" value="9" note="Sur 10 planifiés" />
            <KPI title="SLA respectés" value="95%" note="Mois en cours" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Répartition par type</CardTitle>
              <CardDescription>Période: M-1 (mock)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] grid place-items-center text-slate-500">
                <span>Graphique à intégrer (Recharts/ECharts)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Sous-composants simples (KPI & Intro) ---

const KPI: React.FC<{ title: string; value: string | number; note?: string }> = ({ title, value, note }) => (
  <Card className="border-slate-200 dark:border-slate-700">
    <CardHeader>
      <CardTitle className="text-sm text-slate-600 dark:text-slate-300">{title}</CardTitle>
      <CardDescription className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</CardDescription>
    </CardHeader>
    {note ? (
      <CardContent>
        <Badge variant="secondary">{note}</Badge>
      </CardContent>
    ) : null}
  </Card>
);

const SectionIntro: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="mb-2">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    {description ? (
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    ) : null}
  </div>
);

// --- Export testable (smoke) ---
// Permet de monter la page de manière autonome dans des tests/storybooks.
export const __TEST__ReportsPageStandalone: React.FC = () => (
  <MemoryRouter initialEntries={[`/reports/${TAB_OCL}`]}>
    <ReportsPageInner />
  </MemoryRouter>
);

export default ReportsPage;
