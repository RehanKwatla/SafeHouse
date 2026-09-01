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
  { id: 'patrol', label: 'PATROL', icon: Route },
  { id: 'alerts', label: 'ALERTS', icon: AlertTriangle },
  { id: 'history', label: 'HISTORY', icon: History },
];

// High-tech 3D Isometric Wireframe Rover Graphic from the reference screenshot
export function WireframeRoverGraphic({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 85" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wireframeAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9CFF32" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9CFF32" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient shadow / glow under rover */}
      <ellipse cx="80" cy="65" rx="55" ry="14" fill="url(#wireframeAura)" />

      {/* Left Front Wheel / Tread */}
      <ellipse cx="38" cy="58" rx="14" ry="9" stroke="#9CFF32" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="38" cy="58" rx="8" ry="5" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="30" y1="58" x2="46" y2="58" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="38" y1="50" x2="38" y2="66" stroke="#9CFF32" strokeWidth="0.8" />

      {/* Right Front Wheel / Tread */}
      <ellipse cx="122" cy="58" rx="14" ry="9" stroke="#9CFF32" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="122" cy="58" rx="8" ry="5" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="114" y1="58" x2="130" y2="58" stroke="#9CFF32" strokeWidth="0.8" />
      <line x1="122" y1="50" x2="122" y2="66" stroke="#9CFF32" strokeWidth="0.8" />

      {/* Rear Wheels / Shadow */}
      <ellipse cx="55" cy="42" rx="10" ry="6" stroke="#9CFF32" strokeWidth="0.7" opacity="0.6" />
      <ellipse cx="105" cy="42" rx="10" ry="6" stroke="#9CFF32" strokeWidth="0.7" opacity="0.6" />

      {/* Chassis Base Structure */}
      <polygon
        points="32,46 80,62 128,46 80,32"
        stroke="#9CFF32"
        strokeWidth="1.4"
        fill="#070E10"
        fillOpacity="0.8"
      />
      {/* Chassis Top Pod */}
      <polygon
        points="48,34 80,44 112,34 80,24"
        stroke="#9CFF32"
        strokeWidth="1.2"
        fill="#0C1719"
      />

      {/* Vertical Body Struts */}
      <line x1="32" y1="46" x2="48" y2="34" stroke="#9CFF32" strokeWidth="1" />
      <line x1="80" y1="62" x2="80" y2="44" stroke="#9CFF32" strokeWidth="1" />
      <line x1="128" y1="46" x2="112" y2="34" stroke="#9CFF32" strokeWidth="1" />
      <line x1="80" y1="32" x2="80" y2="24" stroke="#9CFF32" strokeWidth="1" />

      {/* Sensor Mast / Ultrasonic Turret */}
      <line x1="80" y1="24" x2="80" y2="14" stroke="#9CFF32" strokeWidth="1.4" />
      <ellipse cx="80" cy="14" rx="6" ry="3" stroke="#35D9E8" strokeWidth="1.2" fill="#091315" />
      <circle cx="80" cy="14" r="1.5" fill="#35D9E8" />

      {/* Front Light / Sensor Beams */}
      <line x1="72" y1="56" x2="60" y2="68" stroke="#35D9E8" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.7" />
      <line x1="88" y1="56" x2="100" y2="68" stroke="#35D9E8" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.7" />

      {/* Blueprint Grid Cross-markers */}
      <text x="14" y="20" fill="#1F4046" fontSize="6" fontFamily="monospace">+ RVR-01</text>
      <text x="110" y="20" fill="#1F4046" fontSize="6" fontFamily="monospace">GRID.04 +</text>
    </svg>
  );
}

// Glowing Segmented Level Meter
function SegmentedMeter({ value, segments = 12 }: { value: number; segments?: number }) {
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2 rounded-[1px] transition-colors ${
            i < filled
              ? 'bg-green hud-glow-green shadow-[0_0_6px_#9CFF32]'
              : 'bg-base-elevated border border-line opacity-35'
          }`}
        />
      ))}
    </div>
  );
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const sim = useSimulation();
  const robot = sim.getRobot();
  const activeAlerts = sim.getActiveAlerts().length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-base-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 select-none overflow-y-auto scrollbar-thin ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-line lg:hidden">
          <span className="hud-section-title">NAVIGATION</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MISSION CONTROL Nav Section */}
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
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full hud-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-current" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'alerts' && activeAlerts > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-red text-base font-black text-3xs flex items-center justify-center">
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

        {/* Divider */}
        <div className="border-t border-line mx-3" />

        {/* 2. ROBOT STATUS Section */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="hud-section-title">ROBOT STATUS</span>
            <span className="text-3xs mono text-ink-muted">RVR-01</span>
          </div>

          {/* Status badge & Current route */}
          <div className="hud-panel-inset p-2.5 border border-line">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="status-dot bg-green animate-pulse-green" />
              <span className="text-xs mono font-bold text-green tracking-widest">
                {robot.state}
              </span>
            </div>
            {robot.targetRoom !== null ? (
              <p className="text-2xs mono text-cyan flex items-center gap-1 font-semibold">
                <span>ROOM {String(robot.currentRoom).padStart(2, '0')}</span>
                <span>→</span>
                <span>ROOM {String(robot.targetRoom).padStart(2, '0')}</span>
              </p>
            ) : (
              <p className="text-2xs mono text-ink-muted">
                AT ROOM {String(robot.currentRoom).padStart(2, '0')}
              </p>
            )}
          </div>

          {/* 3D Wireframe Rover Graphic */}
          <div className="hud-panel p-2 border border-line flex items-center justify-center bg-[#050B0D]">
            <WireframeRoverGraphic className="w-full h-20" />
          </div>

          {/* Battery Meter */}
          <div>
            <div className="flex items-center justify-between text-3xs mono font-bold mb-1">
              <span className="text-ink-muted">BATTERY</span>
              <span className="text-ink tabular-nums">{Math.round(robot.battery)}%</span>
            </div>
            <SegmentedMeter value={robot.battery} />
          </div>

          {/* Connection Meter */}
          <div>
            <div className="flex items-center justify-between text-3xs mono font-bold mb-1">
              <span className="text-ink-muted">CONNECTION</span>
              <span className="text-ink tabular-nums">{Math.round(robot.connection)}%</span>
            </div>
            <SegmentedMeter value={robot.connection} />
          </div>

          {/* Mode */}
          <div className="flex items-center justify-between text-2xs mono pt-1 border-t border-line">
            <span className="text-ink-muted">MODE</span>
            <span className="text-cyan font-bold tracking-wider">{robot.mode}</span>
          </div>

          {/* Sensors Diagnostic Bus */}
          <div className="pt-2 border-t border-line">
            <span className="hud-label-text block mb-2">SENSORS</span>
            <div className="space-y-1.5">
              {[
                { name: 'TEMPERATURE', ok: robot.sensors.temperature },
                { name: 'HUMIDITY', ok: robot.sensors.humidity },
                { name: 'SOUND', ok: robot.sensors.sound },
                { name: 'ULTRASONIC', ok: robot.sensors.ultrasonic },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between text-2xs mono">
                  <div className="flex items-center gap-1.5">
                    <span className={`status-dot ${s.ok ? 'bg-green' : 'bg-red'}`} />
                    <span className="text-ink-muted text-3xs font-semibold">{s.name}</span>
                  </div>
                  <span className={`text-3xs font-bold ${s.ok ? 'text-green' : 'text-red'}`}>
                    {s.ok ? 'NORMAL' : 'FAULT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Bottom SYSTEM LOG section */}
        <div className="mt-auto p-3 border-t border-line">
          <span className="hud-label-text block mb-1.5">SYSTEM LOG</span>
          <div className="hud-panel-inset px-3 py-2 flex items-center justify-between border border-line">
            <div className="flex items-center gap-2 text-2xs mono text-ink">
              <Radio className="w-3.5 h-3.5 text-cyan animate-pulse" />
              <span className="font-semibold text-3xs">311 NEW ENTRIES</span>
            </div>
            <span className="text-3xs mono text-green font-bold">LIVE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
