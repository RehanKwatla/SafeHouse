import { useClock } from '@/hooks/useSimulation';
import { useSimulation } from '@/hooks/useSimulation';
import type { DataSource } from '@/types';

function formatClock(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

// Heartbeat / waveform — communicates system is alive, not decoration
function SystemHeartbeat() {
  const bars = [2, 3, 2, 5, 8, 12, 8, 5, 3, 2, 2, 3, 2];
  return (
    <div className="flex items-center gap-px h-4" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-px bg-green animate-heartbeat"
          style={{
            height: `${h}px`,
            animationDelay: `${i * 0.1}s`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

// SafeRoom logo — unique to this product, not generic icon library icon
function SafeRoomMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Outer hex-ish frame */}
      <polygon
        points="14,2 24,7.5 24,20.5 14,26 4,20.5 4,7.5"
        stroke="#A8F04D"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      {/* Inner cross — sensor/coverage symbol */}
      <line x1="14" y1="8" x2="14" y2="20" stroke="#A8F04D" strokeWidth="1.5" />
      <line x1="8" y1="14" x2="20" y2="14" stroke="#A8F04D" strokeWidth="1.5" />
      {/* Center node */}
      <circle cx="14" cy="14" r="2.5" fill="#A8F04D" />
      {/* Corner marks */}
      <line x1="10" y1="10" x2="12" y2="10" stroke="#A8F04D" strokeWidth="1" opacity="0.5" />
      <line x1="10" y1="10" x2="10" y2="12" stroke="#A8F04D" strokeWidth="1" opacity="0.5" />
      <line x1="18" y1="18" x2="16" y2="18" stroke="#A8F04D" strokeWidth="1" opacity="0.5" />
      <line x1="18" y1="18" x2="18" y2="16" stroke="#A8F04D" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

interface HeaderProps {
  dataSource: DataSource;
  alertCount: number;
  onAlertClick: () => void;
}

export function Header({ dataSource, alertCount, onAlertClick }: HeaderProps) {
  const sim = useSimulation();
  const clock = useClock();
  const robot = sim.getRobot();

  return (
    <header className="flex items-stretch h-[56px] bg-base-surface border-b border-line shrink-0 z-20 relative">

      {/* Left: branding */}
      <div className="flex items-center gap-3 px-4 border-r border-line min-w-[220px]">
        <SafeRoomMark />
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-[0.2em] text-green mono">SAFEROOM</span>
          </div>
          <p className="text-3xs text-ink-faint tracking-[0.12em] mono mt-0.5">
            AUTONOMOUS SAFETY PATROL SYSTEM
          </p>
        </div>
      </div>

      {/* Center: system status */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4">
        {/* Online status */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-start">
            <span className="text-3xs label-text">SYSTEM STATUS</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="status-dot bg-green animate-pulse-green" />
              <span className="text-xs mono font-semibold text-green tracking-widest">ONLINE</span>
            </div>
          </div>
        </div>

        {/* Heartbeat — shows system is live */}
        <div className="hidden md:flex items-center gap-2">
          <SystemHeartbeat />
        </div>

        {/* Link quality */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-3xs label-text">LINK</span>
          <span className={`text-xs mono font-semibold mt-0.5 tabular-nums ${
            robot.connection >= 90 ? 'text-green' : robot.connection >= 70 ? 'text-amber' : 'text-red'
          }`}>
            {Math.round(robot.connection)}%
          </span>
        </div>

        {/* Data source */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-3xs label-text">DATA SOURCE</span>
          <span className={`text-2xs mono font-semibold mt-0.5 ${dataSource === 'LIVE' ? 'text-green' : 'text-amber'}`}>
            {dataSource === 'LIVE' ? 'ESP32 LIVE' : 'SIMULATION'}
          </span>
        </div>
      </div>

      {/* Right: clock + alerts */}
      <div className="flex items-stretch border-l border-line">
        {/* Clock */}
        <div className="flex flex-col items-center justify-center px-5 border-r border-line">
          <span className="text-base mono font-bold text-ink tabular-nums tracking-wider">
            {formatClock(clock)}
          </span>
          <span className="text-3xs mono text-ink-faint tracking-widest mt-0.5">
            {formatDate(clock)}
          </span>
        </div>

        {/* Active alerts — the one thing that should be prominent */}
        <button
          onClick={onAlertClick}
          className={`flex flex-col items-center justify-center px-5 transition-colors ${
            alertCount > 0
              ? 'bg-red-tint hover:bg-red/10 cursor-pointer'
              : 'hover:bg-base-hover cursor-pointer'
          }`}
          aria-label={`${alertCount} active alerts`}
        >
          <span className={`text-xl mono font-bold tabular-nums ${alertCount > 0 ? 'text-red' : 'text-ink-faint'}`}>
            {alertCount}
          </span>
          <span className={`text-3xs mono tracking-widest ${alertCount > 0 ? 'text-red' : 'text-ink-faint'}`}>
            {alertCount === 1 ? 'ACTIVE ALERT' : 'ACTIVE ALERTS'}
          </span>
        </button>
      </div>
    </header>
  );
}
