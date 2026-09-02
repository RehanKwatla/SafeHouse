import {
  Crosshair,
  AlertTriangle,
  History,
  X,
  ChevronRight,
  Radio,
  Thermometer,
  Droplets,
  AudioLines,
  Wind,
  Activity,
  Flame,
  Radar,
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
  { id: 'alerts',   label: 'ALERTS',   icon: AlertTriangle },
  { id: 'history',  label: 'HISTORY',  icon: History },
];

// Wireframe rover SVG — product-specific illustration, no camera
export function WireframeRoverGraphic({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 85" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="roverAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#9CFF32" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9CFF32" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="65" rx="55" ry="14" fill="url(#roverAura)" />
      {/* Left wheel */}
      <ellipse cx="38" cy="58" rx="14" ry="9" stroke="#9CFF32" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="38" cy="58" rx="8"  ry="5" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="30" y1="58" x2="46" y2="58" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="38" y1="50" x2="38" y2="66" stroke="#9CFF32" strokeWidth="0.8" />
      {/* Right wheel */}
      <ellipse cx="122" cy="58" rx="14" ry="9" stroke="#9CFF32" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="122" cy="58" rx="8"  ry="5" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="114" y1="58" x2="130" y2="58" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="122" y1="50" x2="122" y2="66" stroke="#9CFF32" strokeWidth="0.8" />
      {/* Rear wheels */}
      <ellipse cx="55"  cy="42" rx="10" ry="6" stroke="#9CFF32" strokeWidth="0.7" opacity="0.6" />
      <ellipse cx="105" cy="42" rx="10" ry="6" stroke="#9CFF32" strokeWidth="0.7" opacity="0.6" />
      {/* Chassis */}
      <polygon points="32,46 80,62 128,46 80,32" stroke="#9CFF32" strokeWidth="1.4" fill="#070E10" fillOpacity="0.8" />
      <polygon points="48,34 80,44 112,34 80,24" stroke="#9CFF32" strokeWidth="1.2" fill="#0C1719" />
      {/* Struts */}
      <line x1="32"  y1="46" x2="48"  y2="34" stroke="#9CFF32" strokeWidth="1" />
      <line x1="80"  y1="62" x2="80"  y2="44" stroke="#9CFF32" strokeWidth="1" />
      <line x1="128" y1="46" x2="112" y2="34" stroke="#9CFF32" strokeWidth="1" />
      <line x1="80"  y1="32" x2="80"  y2="24" stroke="#9CFF32" strokeWidth="1" />
      {/* Sensor mast */}
      <line x1="80" y1="24" x2="80" y2="14" stroke="#9CFF32" strokeWidth="1.4" />
      <ellipse cx="80" cy="14" rx="6" ry="3" stroke="#35D9E8" strokeWidth="1.2" fill="#091315" />
      <circle cx="80" cy="14" r="1.5" fill="#35D9E8" />
      {/* Sensor beams */}
      <line x1="72"  y1="56" x2="60"  y2="68" stroke="#35D9E8" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.7" />
      <line x1="88"  y1="56" x2="100" y2="68" stroke="#35D9E8" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.7" />
      {/* Markers */}
      <text x="14"  y="20" fill="#1F4046" fontSize="6" fontFamily="monospace">+ RVR-01</text>
      <text x="110" y="20" fill="#1F4046" fontSize="6" fontFamily="monospace">GRID.04 +</text>
    </svg>
  );
}

function SegmentedMeter({
  value,
  segments = 12,
  color = 'bg-green',
}: {
  value: number;
  segments?: number;
  color?: string;
}) {
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled   = i < filled;
        const isBoundary = i === filled - 1;
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
  const robot  = sim.getRobot();
  const activeAlerts = sim.getActiveAlerts().length;

  const batteryColor =
    robot.battery > 50 ? 'bg-green' :
    robot.battery > 20 ? 'bg-amber' : 'bg-red';

  const SENSOR_ROWS: { label: string; icon: typeof Thermometer; ok: boolean }[] = [
    { label: 'TEMPERATURE', icon: Thermometer, ok: robot.sensors.temperature },
    { label: 'HUMIDITY',    icon: Droplets,    ok: robot.sensors.humidity },
    { label: 'SOUND',       icon: AudioLines,  ok: robot.sensors.sound },
    { label: 'AIR QUALITY', icon: Wind,        ok: robot.sensors.airQuality },
    { label: 'TILT',        icon: Activity,    ok: robot.sensors.tilt },
    { label: 'SMOKE',       icon: Flame,       ok: robot.sensors.smoke },
    { label: 'ULTRASONIC',  icon: Radar,       ok: robot.sensors.ultrasonic },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-base-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 overflow-y-auto scrollbar-thin ${
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

        {/* Nav */}
        <div className="p-3">
          <span className="hud-section-title block mb-2">MISSION CONTROL</span>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = currentPage === id;
              return (
                <button
                  key={id}
                  onClick={() => { onNavigate(id); onClose(); }}
                  className={`w-full hud-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-current" strokeWidth={1.75} />
                  <span className="flex-1 text-left">{label}</span>
                  {id === 'alerts' && activeAlerts > 0 ? (
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
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`status-dot ${
                robot.state === 'MONITORING' ? 'bg-green animate-pulse-green' :
                robot.state === 'IDLE'       ? 'bg-amber' : 'bg-ink-muted'
              }`} />
              <span className={`text-xs mono font-bold tracking-widest ${
                robot.state === 'MONITORING' ? 'text-green' :
                robot.state === 'IDLE'       ? 'text-amber' : 'text-ink-muted'
              }`}>
                {robot.state}
              </span>
            </div>
            <p className="text-3xs mono text-ink-muted mt-0.5">
              MODE: <span className="text-cyan font-bold">{robot.mode}</span>
            </p>
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

          {/* All 7 sensors */}
          <div className="pt-2 border-t border-line">
            <span className="hud-label-text block mb-2">SENSORS</span>
            <div className="space-y-1.5">
              {SENSOR_ROWS.map(({ label, icon: Icon, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3 h-3 ${ok ? 'text-ink-muted' : 'text-red'}`} strokeWidth={1.5} />
                    <span className="text-3xs mono text-ink-muted font-semibold">{label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`status-dot ${ok ? 'bg-green' : 'bg-red animate-pulse-red'}`} />
                    <span className={`text-3xs mono font-bold ${ok ? 'text-green' : 'text-red'}`}>
                      {ok ? 'OK' : 'FAULT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System log footer */}
        <div className="mt-auto p-3 border-t border-line">
          <span className="hud-label-text block mb-1.5">SYSTEM LOG</span>
          <div className="hud-panel-inset px-3 py-2 flex items-center justify-between border border-line">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan animate-pulse shrink-0" />
              <span className="text-3xs mono text-ink font-semibold">311 NEW ENTRIES</span>
            </div>
            <span className="text-3xs mono text-green font-bold">LIVE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
