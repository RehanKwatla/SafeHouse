import { LayoutGrid, Map, AlertTriangle, History, X, Battery, Wifi, Thermometer, Droplets, AudioLines } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import type { PageId } from '@/App';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutGrid; code: string }[] = [
  { id: 'overview', label: 'OVERVIEW',  icon: LayoutGrid,    code: '01' },
  { id: 'patrol',   label: 'PATROL',    icon: Map,            code: '02' },
  { id: 'alerts',   label: 'ALERTS',    icon: AlertTriangle,  code: '03' },
  { id: 'history',  label: 'HISTORY',   icon: History,        code: '04' },
];

function SegmentedBar({ value, color }: { value: number; color: string }) {
  const segments = 12;
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-px">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-1.5 ${i < filled ? color : 'bg-base-elevated'}`}
        />
      ))}
    </div>
  );
}

function RobotStatusPanel() {
  const sim = useSimulation();
  const robot = sim.getRobot();

  const stateColor =
    robot.state === 'PATROLLING' || robot.state === 'MOVING' ? 'text-green' :
    robot.state === 'IDLE' ? 'text-amber' : 'text-ink-faint';

  const batteryColor =
    robot.battery > 50 ? 'bg-green' : robot.battery > 20 ? 'bg-amber' : 'bg-red';

  return (
    <div className="px-3 py-3 border-t border-line">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="section-title">ROBOT STATUS</span>
        <span className="text-3xs mono text-ink-faint">RVR-01</span>
      </div>

      {/* State block */}
      <div className="bg-base px-3 py-2.5 mb-3 relative" style={{ borderLeft: '2px solid' , borderLeftColor: robot.state === 'PATROLLING' || robot.state === 'MOVING' ? '#A8F04D' : robot.state === 'IDLE' ? '#F2B84B' : '#3D4F55' }}>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`status-dot ${
              robot.state === 'PATROLLING' || robot.state === 'MOVING' ? 'bg-green animate-pulse-green' :
              robot.state === 'IDLE' ? 'bg-amber' : 'bg-ink-faint'
            }`} />
            <span className={`text-xs mono font-bold tracking-widest ${stateColor}`}>
              {robot.state}
            </span>
          </div>
          <span className="text-3xs mono text-ink-faint">{robot.mode}</span>
        </div>

        {robot.targetRoom !== null ? (
          <p className="text-2xs mono text-ink-muted">
            ROOM {String(robot.currentRoom).padStart(2,'0')} → ROOM {String(robot.targetRoom).padStart(2,'0')}
          </p>
        ) : (
          <p className="text-2xs mono text-ink-faint">
            AT ROOM {String(robot.currentRoom).padStart(2,'0')}
          </p>
        )}

        {robot.etaSeconds > 0 && (
          <p className="text-2xs mono text-cyan mt-0.5">ETA {robot.etaSeconds}s</p>
        )}
      </div>

      {/* Battery */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 label-text">
            <Battery className="w-2.5 h-2.5" /> BATTERY
          </span>
          <span className="text-2xs mono text-ink-muted tabular-nums">
            {Math.round(robot.battery)}%
          </span>
        </div>
        <SegmentedBar value={robot.battery} color={batteryColor} />
      </div>

      {/* Connection */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 label-text">
            <Wifi className="w-2.5 h-2.5" /> SIGNAL
          </span>
          <span className="text-2xs mono text-ink-muted tabular-nums">
            {Math.round(robot.connection)}%
          </span>
        </div>
        <SegmentedBar value={robot.connection} color="bg-green" />
      </div>

      {/* Sensors */}
      <div>
        <span className="label-text block mb-2">SENSORS</span>
        <div className="space-y-1.5">
          {[
            { label: 'TEMPERATURE', icon: Thermometer, ok: robot.sensors.temperature },
            { label: 'HUMIDITY',    icon: Droplets,    ok: robot.sensors.humidity },
            { label: 'SOUND',       icon: AudioLines,  ok: robot.sensors.sound },
          ].map(({ label, icon: Icon, ok }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-2xs mono text-ink-faint">
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
              <div className="flex items-center gap-1">
                <span className={`status-dot ${ok ? 'bg-green' : 'bg-red animate-pulse-red'}`} />
                <span className={`text-3xs mono ${ok ? 'text-green' : 'text-red'}`}>
                  {ok ? 'OK' : 'ERR'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical footer — small system identifiers */}
      <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between">
        <span className="text-3xs mono text-ink-faint">NODE 04</span>
        <span className="text-3xs mono text-ink-faint">SYS_OK</span>
        <span className="text-3xs mono text-ink-faint">SYNC</span>
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
        <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[220px] bg-base-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line lg:hidden">
          <span className="section-title">NAVIGATION</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav section label */}
        <div className="px-4 pt-4 pb-1">
          <span className="section-title">MISSION CONTROL</span>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-1 space-y-px">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <div
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span className="flex-1 text-2xs tracking-widest">{item.label}</span>
                {item.id === 'alerts' && activeAlerts > 0 ? (
                  <span className="text-2xs mono font-bold text-red tabular-nums">
                    {activeAlerts}
                  </span>
                ) : (
                  <span className="text-3xs mono text-ink-faint">{item.code}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 my-2 border-t border-line" />

        {/* Robot status */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <RobotStatusPanel />
        </div>
      </aside>
    </>
  );
}
