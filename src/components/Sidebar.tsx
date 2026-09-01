import { LayoutGrid, Map, AlertTriangle, History, X, Battery, Wifi, Thermometer, Droplets, AudioLines } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import type { PageId } from '@/App';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'patrol', label: 'Patrol', icon: Map },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'history', label: 'History', icon: History },
];

function RobotStatusCompact() {
  const sim = useSimulation();
  const robot = sim.getRobot();

  const stateColor =
    robot.state === 'PATROLLING' || robot.state === 'MOVING'
      ? 'text-green'
      : robot.state === 'IDLE'
      ? 'text-amber'
      : 'text-ink-faint';

  const batteryColor =
    robot.battery > 50 ? 'bg-green' : robot.battery > 20 ? 'bg-amber' : 'bg-red';

  return (
    <div className="px-3 py-3 border-t border-line">
      <p className="label-text mb-2.5 px-1">ROVER</p>

      {/* State row */}
      <div className="px-2 py-2 bg-base rounded-sm mb-2" style={{ borderRadius: 2 }}>
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-xs mono font-semibold tracking-wider ${stateColor}`}>
            {robot.state}
          </span>
          {(robot.state === 'PATROLLING' || robot.state === 'MOVING') && (
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-green" />
          )}
        </div>
        {robot.targetRoom !== null ? (
          <p className="text-2xs mono text-ink-faint">
            ROOM {String(robot.currentRoom).padStart(2, '0')} → ROOM {String(robot.targetRoom).padStart(2, '0')}
          </p>
        ) : (
          <p className="text-2xs mono text-ink-faint">
            AT ROOM {String(robot.currentRoom).padStart(2, '0')}
          </p>
        )}
        {robot.etaSeconds > 0 && (
          <p className="text-2xs mono text-ink-faint">ETA {robot.etaSeconds}s</p>
        )}
      </div>

      {/* Battery */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 label-text">
            <Battery className="w-2.5 h-2.5" /> BATTERY
          </span>
          <span className="text-2xs mono text-ink-muted tabular-nums">{Math.round(robot.battery)}%</span>
        </div>
        <div className="h-1 bg-base rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${batteryColor}`}
            style={{ width: `${robot.battery}%` }}
          />
        </div>
      </div>

      {/* Connection */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 label-text">
            <Wifi className="w-2.5 h-2.5" /> SIGNAL
          </span>
          <span className="text-2xs mono text-ink-muted tabular-nums">{Math.round(robot.connection)}%</span>
        </div>
        <div className="h-1 bg-base rounded-full overflow-hidden">
          <div
            className="h-full bg-green transition-all duration-500"
            style={{ width: `${robot.connection}%` }}
          />
        </div>
      </div>

      {/* Sensor status — dots only, compact */}
      <div className="flex items-center gap-3 px-1">
        <span className="label-text">SENSORS</span>
        <div className="flex items-center gap-2 ml-auto">
          <span title="Temperature" className={`flex items-center gap-0.5 text-2xs mono ${robot.sensors.temperature ? 'text-green' : 'text-red'}`}>
            <Thermometer className="w-3 h-3" />
          </span>
          <span title="Humidity" className={`flex items-center gap-0.5 text-2xs mono ${robot.sensors.humidity ? 'text-green' : 'text-red'}`}>
            <Droplets className="w-3 h-3" />
          </span>
          <span title="Sound" className={`flex items-center gap-0.5 text-2xs mono ${robot.sensors.sound ? 'text-green' : 'text-red'}`}>
            <AudioLines className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const sim = useSimulation();
  const activeAlerts = sim.getActiveAlerts().length;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[220px] bg-base-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line lg:hidden">
          <span className="label-text">NAVIGATION</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <div
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {/* Alert count badge only on alerts nav item */}
                {item.id === 'alerts' && activeAlerts > 0 && (
                  <span className="text-2xs mono font-semibold text-red tabular-nums">
                    {activeAlerts}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Robot status — pushed down, not competing with nav */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <RobotStatusCompact />
        </div>
      </aside>
    </>
  );
}
