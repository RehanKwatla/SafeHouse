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

      {/* Mobile menu bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b border-line bg-base-surface shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-2xs mono text-ink-muted hover:text-ink tracking-widest"
        >
          <Menu className="w-4 h-4" />
          MENU
        </button>
        {/* Current page on mobile */}
        <span className="text-2xs mono text-ink-faint tracking-widest uppercase">{currentPage}</span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-3 lg:p-4">
          {currentPage === 'overview' && <OverviewPage onNavigateAlerts={() => setCurrentPage('alerts')} />}
          {currentPage === 'patrol'   && <PatrolPage />}
          {currentPage === 'alerts'   && <AlertsPage />}
          {currentPage === 'history'  && <HistoryPage />}

          {/* Footer identifier — mission control aesthetic */}
          <div className="flex items-center justify-between mt-6 pt-3 border-t border-line-faint">
            <span className="text-3xs mono text-ink-faint tracking-widest">SAFEROOM OS v2.5.0</span>
            <span className="text-3xs mono text-ink-faint tracking-widest">NODE 04 · SENSOR BUS NORMAL</span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
