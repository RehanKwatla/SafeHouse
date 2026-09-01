import { LayoutGrid, Map, AlertTriangle, History, X } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import type { PageId } from '@/App';
import { RobotStatus } from './RobotStatus';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: LayoutGrid },
  { id: 'patrol', label: 'PATROL', icon: Map },
  { id: 'alerts', label: 'ALERTS', icon: AlertTriangle },
  { id: 'history', label: 'HISTORY', icon: History },
];

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const sim = useSimulation();
  const robot = sim.getRobot();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[240px] bg-base-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <span className="label-text">NAVIGATION</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="px-3 py-3 space-y-0.5">
          <p className="label-text px-3 mb-2 hidden lg:block">NAVIGATION</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Robot status panel */}
        <div className="mt-2 px-3 pb-4 flex-1 overflow-y-auto scrollbar-thin">
          <p className="label-text px-1 mb-2">ROBOT STATUS</p>
          <RobotStatus robot={robot} />
        </div>
      </aside>
    </>
  );
}
