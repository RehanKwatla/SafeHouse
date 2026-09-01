import {
  Crosshair,
  Route,
  AlertTriangle,
  History,
  X,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import type { PageId } from '@/App';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Crosshair }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: Crosshair },
  { id: 'patrol',   label: 'PATROL',   icon: Route },
  { id: 'alerts',   label: 'ALERTS',   icon: AlertTriangle },
  { id: 'history',  label: 'HISTORY',  icon: History },
];

// Wireframe rover SVG — product-specific illustration
export function WireframeRoverGraphic({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 85" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wireframeAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#9CFF32" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9CFF32" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground glow */}
      <ellipse cx="80" cy="65" rx="55" ry="14" fill="url(#wireframeAura)" />

      {/* Left wheel */}
      <ellipse cx="38" cy="58" rx="14" ry="9" stroke="#9CFF32" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="38" cy="58" rx="8" ry="5" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="30" y1="58" x2="46" y2="58" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="38" y1="50" x2="38" y2="66" stroke="#9CFF32" strokeWidth="0.8" />

      {/* Right wheel */}
      <ellipse cx="122" cy="58" rx="14" ry="9" stroke="#9CFF32" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="122" cy="58" rx="8" ry="5" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="114" y1="58" x2="130" y2="58" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="122" y1="50" x2="122" y2="66" stroke="#9CFF32" strokeWidth="0.8" />

      {/* Rear wheels */}
      <ellipse cx="55" cy="42" rx="10" ry="6" stroke="#9CFF32" strokeWidth="0.7" opacity="0.6" />
      <ellipse cx="105" cy="42" rx="10" ry="6" stroke="#9CFF32" strokeWidth="0.7" opacity="0.6" />

      {/* Chassis base */}
      <polygon points="32,46 80,62 128,46 80,32" stroke="#9CFF32" strokeWidth="1.4" fill="#070E10" fillOpacity="0.8" />
      {/* Chassis top pod */}
      <polygon points="48,34 80,44 112,34 80,24" stroke="#9CFF32" strokeWidth="1.2" fill="#0C1719" />

      {/* Struts */}
      <line x1="32" y1="46" x2="48" y2="34" stroke="#9CFF32" strokeWidth="1" />
      <line x1="80" y1="62" x2="80" y2="44" stroke="#9CFF32" strokeWidth="1" />
      <line x1="128" y1="46" x2="112" y2="34" stroke="#9CFF32" strokeWidth="1" />
      <line x1="80" y1="32" x2="80" y2="24" stroke="#9CFF32" strokeWidth="1" />

      {/* Sensor mast */}
      <line x1="80" y1="24" x2="80" y2="14" stroke="#9CFF32" strokeWidth="1.4" />
      <ellipse cx="80" cy="14" rx="6" ry="3" stroke="#35D9E8" strokeWidth="1.2" fill="#091315" />
      <circle cx="80" cy="14" r="1.5" fill="#35D9E8" />

      {/* Sensor beams */}
      <line x1="72" y1="56" x2="60" y2="68" stroke="#35D9E8" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.7" />
      <line x1="88" y1="56" x2="100" y2="68" stroke="#35D9E8" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.7" />

      {/* Blueprint markers */}
      <text x="14"  y="20" fill="#1F4046" fontSize="6" fontFamily="monospace">+ RVR-01</text>
      <text x="110" y="20" fill="#1F4046" fontSize="6" fontFamily="monospace">GRID.04 +</text>
    </svg>
  );
}

// Segmented level meter — glow only on the boundary (last filled) segment to avoid per-tick repaint
function SegmentedMeter({ value, segments = 12, color = 'bg-green' }: {
  value: number;
  segments?: number;
  color?: string;
}) {
  const filled = Math.round((value / 100) * segments);

  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled  = i < filled;
        const isBoundary = i === filled - 1; // only the last filled segment glows
        return (
          <div
            key={i}
            className={`h-2.5 w-2 transition-colors ${
              isFilled
                ? `${color} ${isBoundary ? 'opacity-100' : 'opacity-75'}`
                : 'bg-base-elevated border border-line opacity-30'
            }`}
            style={isBoundary ? { boxShadow: '0 0 5px #9CFF32' } : undefined}
          />
        );
      })}
    </div>
  );
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const sim = useSimulation();
  const robot = sim.getRobot();
  const activeAlerts = sim.getActiveAlerts().length;

  const batteryColor = robot.battery > 50 ? 'bg-green' : robot.battery > 20 ? 'bg-amber' : 'bg-red';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-base-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 select-none overflow-y-auto scrollbar-thin ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-line lg:hidden">
          <span className="hud-section-title">NAVIGATION</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="hud-section-title">MISSION CONTROL</span>
          </div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full hud-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-current" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'alerts' && activeAlerts > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-red text-base font-black text-3xs flex items-center justify-center tabular-nums">
                      {activeAlerts}
                    </span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-line mx-3" />

        {/* Robot status */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="hud-section-title">ROBOT STATUS</span>
            <span className="text-3xs mono text-ink-muted">RVR-01</span>
          </div>

          {/* State block */}
          <div className="hud-panel-inset p-2.5 border border-line">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`status-dot ${
                robot.state === 'PATROLLING' || robot.state === 'MOVING' ? 'bg-green animate-pulse-green' :
                robot.state === 'IDLE' ? 'bg-amber' : 'bg-ink-muted'
              }`} />
              <span className={`text-xs mono font-bold tracking-widest ${
                robot.state === 'PATROLLING' || robot.state === 'MOVING' ? 'text-green' :
                robot.state === 'IDLE' ? 'text-amber' : 'text-ink-muted'
              }`}>
                {robot.state}
              </span>
            </div>
            {robot.targetRoom !== null ? (
              <p className="text-2xs mono text-cyan flex items-center gap-1 font-semibold">
                <span>ROOM {String(robot.currentRoom).padStart(2,'0')}</span>
                <span>→</span>
                <span>ROOM {String(robot.targetRoom).padStart(2,'0')}</span>
              </p>
            ) : (
              <p className="text-2xs mono text-ink-muted">
                AT ROOM {String(robot.currentRoom).padStart(2,'0')}
              </p>
            )}
            {robot.etaSeconds > 0 && (
              <p className="text-3xs mono text-cyan mt-0.5">ETA {robot.etaSeconds}s</p>
            )}
          </div>

          {/* Rover illustration */}
          <div className="hud-panel p-2 border border-line flex items-center justify-center bg-[#050B0D] overflow-hidden">
            <WireframeRoverGraphic className="w-full h-20" />
          </div>

          {/* Battery */}
          <div>
            <div className="flex items-center justify-between text-3xs mono font-bold mb-1">
              <span className="text-ink-muted">BATTERY</span>
              <span className="text-ink tabular-nums">{Math.round(robot.battery)}%</span>
            </div>
            <SegmentedMeter value={robot.battery} color={batteryColor} />
          </div>

          {/* Connection */}
          <div>
            <div className="flex items-center justify-between text-3xs mono font-bold mb-1">
              <span className="text-ink-muted">CONNECTION</span>
              <span className="text-ink tabular-nums">{Math.round(robot.connection)}%</span>
            </div>
            <SegmentedMeter value={robot.connection} color="bg-green" />
          </div>

          {/* Mode */}
          <div className="flex items-center justify-between text-2xs mono pt-1 border-t border-line">
            <span className="text-ink-muted">MODE</span>
            <span className="text-cyan font-bold tracking-wider">{robot.mode}</span>
          </div>

          {/* Sensors */}
          <div className="pt-2 border-t border-line">
            <span className="hud-label-text block mb-2">SENSORS</span>
            <div className="space-y-1.5">
              {([
                ['TEMPERATURE', robot.sensors.temperature],
                ['HUMIDITY',    robot.sensors.humidity],
                ['SOUND',       robot.sensors.sound],
                ['ULTRASONIC',  robot.sensors.ultrasonic],
              ] as [string, boolean][]).map(([name, ok]) => (
                <div key={name} className="flex items-center justify-between text-2xs mono">
                  <div className="flex items-center gap-1.5">
                    <span className={`status-dot ${ok ? 'bg-green' : 'bg-red'}`} />
                    <span className="text-ink-muted text-3xs font-semibold">{name}</span>
                  </div>
                  <span className={`text-3xs font-bold ${ok ? 'text-green' : 'text-red'}`}>
                    {ok ? 'NORMAL' : 'FAULT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System log footer */}
        <div className="mt-auto p-3 border-t border-line">
          <span className="hud-label-text block mb-1.5">SYSTEM LOG</span>
          <div className="hud-panel-inset px-3 py-2 flex items-center justify-between border border-line">
            <div className="flex items-center gap-2 text-2xs mono text-ink">
              <Radio className="w-3.5 h-3.5 text-cyan animate-pulse shrink-0" />
              <span className="font-semibold text-3xs">311 NEW ENTRIES</span>
            </div>
            <span className="text-3xs mono text-green font-bold">LIVE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
