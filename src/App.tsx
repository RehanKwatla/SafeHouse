import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { OverviewPage } from '@/pages/OverviewPage';
import { PatrolPage } from '@/pages/PatrolPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { useSimulation } from '@/hooks/useSimulation';
import { simulation } from '@/engine/simulationEngine';

export type PageId = 'overview' | 'patrol' | 'alerts' | 'history';

function App() {
  const sim = useSimulation();
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Start the simulation engine on mount
  useEffect(() => {
    simulation.start();
    return () => simulation.stop();
  }, []);

  const activeAlertCount = sim.getActiveAlerts().length;
  const dataSource = sim.getDataSource();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base">
      {/* Header */}
      <Header
        dataSource={dataSource}
        alertCount={activeAlertCount}
        onAlertClick={() => setCurrentPage('alerts')}
      />

      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-line bg-base-surface">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink"
        >
          <Menu className="w-4 h-4" />
          MENU
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-5">
          {currentPage === 'overview' && <OverviewPage onNavigateAlerts={() => setCurrentPage('alerts')} />}
          {currentPage === 'patrol' && <PatrolPage />}
          {currentPage === 'alerts' && <AlertsPage />}
          {currentPage === 'history' && <HistoryPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
