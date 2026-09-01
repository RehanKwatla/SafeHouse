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

// Hexadecimal / telemetry numbers scrolling vertically along screen borders
function BorderDataStreams() {
  const hexChars = [
    '2', '3', '9', 'F', '3', '1', '7', 'A', '8', '2', '4', '8', '7', '6',
    'B', '4', '0', '1', '5', 'C', 'E', '9', '2', '8', '3', 'A', '6', 'D',
    '2', '3', '9', 'F', '3', '1', '7', 'A', '8', '2', '4', '8', '7', '6',
    'B', '4', '0', '1', '5', 'C', 'E', '9', '2', '8', '3', 'A', '6', 'D',
  ];

  return (
    <>
      {/* Left Stream */}
      <div className="hud-data-stream hud-data-stream-left hidden 2xl:flex">
        <div className="hud-data-stream-inner">
          {hexChars.map((c, i) => (
            <span key={`l-${i}`} style={{ opacity: i % 3 === 0 ? 0.9 : 0.4 }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Right Stream */}
      <div className="hud-data-stream hud-data-stream-right hidden 2xl:flex">
        <div className="hud-data-stream-inner" style={{ animationDirection: 'reverse' }}>
          {hexChars.map((c, i) => (
            <span key={`r-${i}`} style={{ opacity: i % 2 === 0 ? 0.9 : 0.4 }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

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
    <div className="min-h-screen max-h-screen h-screen overflow-hidden bg-[#030607] p-1.5 lg:p-2.5 flex flex-col justify-between select-none relative">
      {/* 1. Matrix Edge Telemetry Streams */}
      <BorderDataStreams />

      {/* 2. Outer Blue/Cyan Technical Enclosure Frame */}
      <div className="hud-outer-chassis flex-1 flex flex-col overflow-hidden relative rounded-xs">
        {/* Technical Corner Brackets */}
        <div className="hud-bracket-tl" />
        <div className="hud-bracket-tr" />
        <div className="hud-bracket-bl" />
        <div className="hud-bracket-br" />

        {/* Outer Frame Top System Metadata Marking */}
        <div className="hidden md:flex items-center justify-between px-4 py-0.5 bg-[#050C0E] border-b border-[#123B42] text-3xs mono text-[#35D9E8] font-bold tracking-[0.2em]">
          <span>[ SEC.01 // SYSTEM CHASSIS // HARDWARE LOCKED ]</span>
          <span>AUTONOMOUS SAFETY PATROL ENCLOSURE · REV 2.5</span>
          <span>[ GRID 04 // 24.872N 121.439E ]</span>
        </div>

        {/* Global Top Header */}
        <Header
          dataSource={dataSource}
          alertCount={activeAlertCount}
          onAlertClick={() => setCurrentPage('alerts')}
        />

        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between px-3 py-1.5 border-b border-line bg-base-surface shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 text-2xs mono text-ink-muted hover:text-green tracking-widest cursor-pointer"
          >
            <Menu className="w-4 h-4 text-green" />
            MENU
          </button>
          <span className="text-2xs mono text-green font-bold tracking-widest uppercase">
            {currentPage}
          </span>
        </div>

        {/* Main App Body */}
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto scrollbar-thin p-2 lg:p-3 flex flex-col justify-between">
            <div>
              {currentPage === 'overview' && (
                <OverviewPage onNavigateAlerts={() => setCurrentPage('alerts')} />
              )}
              {currentPage === 'patrol' && <PatrolPage />}
              {currentPage === 'alerts' && <AlertsPage />}
              {currentPage === 'history' && <HistoryPage />}
            </div>

            {/* Bottom System Footer */}
            <footer className="flex items-center justify-center pt-3 pb-1 shrink-0">
              <span className="text-3xs mono font-black text-green tracking-[0.25em] flex items-center gap-2 opacity-80">
                <span className="text-green/40">///</span>
                <span>SAFEROOM OS v2.5.0</span>
                <span className="text-green/40">///</span>
              </span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
