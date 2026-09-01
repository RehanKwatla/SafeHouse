import { useClock, useSimulation } from '@/hooks/useSimulation';
import type { DataSource } from '@/types';
import { Shield } from 'lucide-react';

function formatClock(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(epoch: number): string {
  return new Date(epoch * 1000)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

// ECG / Heartbeat waveform from the reference screenshot
function HeartbeatWaveform() {
  return (
    <svg width="64" height="18" viewBox="0 0 64 18" fill="none" className="opacity-90">
      <path
        d="M0,9 L14,9 L18,3 L22,15 L26,7 L30,11 L34,9 L64,9"
        stroke="#9CFF32"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Vertical Link Strength Signal Bars
function SignalStrengthBars({ percent }: { percent: number }) {
  const bars = [4, 7, 10, 13, 16];
  const filledCount = Math.ceil((percent / 100) * 5);

  return (
    <div className="flex items-end gap-1 h-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-xs transition-colors ${
            i < filledCount ? 'bg-green' : 'bg-line-strong opacity-40'
          }`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
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
    <header className="flex items-center justify-between h-[64px] bg-base-surface border-b border-line px-3 lg:px-4 shrink-0 z-30 relative select-none">
      {/* 1. Left Branding */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center border border-green/40 bg-green/10 rounded-sm">
          <Shield className="w-5 h-5 text-green" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base lg:text-lg font-black tracking-[0.22em] text-green mono leading-none">
              SAFEROOM
            </span>
          </div>
          <p className="text-3xs text-ink-muted tracking-[0.14em] mono mt-1">
            AUTONOMOUS SAFETY PATROL SYSTEM
          </p>
        </div>
      </div>

      {/* 2. Center Inset Status Modules */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Module A: System Status */}
        <div className="hud-panel-inset px-3.5 py-1.5 flex items-center gap-3 border border-line">
          <div className="flex flex-col">
            <span className="hud-label-text">SYSTEM STATUS</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="status-dot bg-green animate-pulse-green" />
              <span className="text-2xs mono font-bold text-green tracking-widest">ONLINE</span>
            </div>
          </div>
          <HeartbeatWaveform />
        </div>

        {/* Module B: Link Strength */}
        <div className="hud-panel-inset px-3.5 py-1.5 flex items-center gap-3 border border-line">
          <div className="flex flex-col">
            <span className="hud-label-text">LINK STRENGTH</span>
            <span className="text-xs mono font-bold text-ink tracking-wider mt-0.5 tabular-nums">
              {Math.round(robot.connection)}%
            </span>
          </div>
          <SignalStrengthBars percent={robot.connection} />
        </div>

        {/* Module C: Data Source */}
        <div className="hud-panel-inset px-3.5 py-1.5 flex flex-col border border-line hidden lg:flex">
          <span className="hud-label-text">DATA SOURCE</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`status-dot ${dataSource === 'LIVE' ? 'bg-green' : 'bg-amber animate-pulse-amber'}`} />
            <span className={`text-2xs mono font-bold tracking-widest ${dataSource === 'LIVE' ? 'text-green' : 'text-amber'}`}>
              {dataSource === 'LIVE' ? 'LIVE ESP32' : 'SIMULATION'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Right Status: Clock & Active Alerts */}
      <div className="flex items-center gap-2.5">
        {/* Time & Date */}
        <div className="hud-panel-inset px-3.5 py-1.5 flex flex-col items-center justify-center border border-line min-w-[110px]">
          <span className="text-sm mono font-bold text-ink tracking-wider leading-none tabular-nums">
            {formatClock(clock)}
          </span>
          <span className="text-3xs mono text-ink-muted tracking-widest mt-1">
            {formatDate(clock)}
          </span>
        </div>

        {/* Active Alerts Box */}
        <button
          onClick={onAlertClick}
          className={`hud-panel px-3.5 py-1.5 flex items-center gap-3 cursor-pointer transition-all ${
            alertCount > 0
              ? 'border-red bg-red/10 hud-glow-red hover:bg-red/15'
              : 'border-line hover:border-line-strong'
          }`}
          aria-label={`${alertCount} active alerts`}
        >
          <span className={`text-2xl mono font-black leading-none tabular-nums ${alertCount > 0 ? 'text-red' : 'text-ink-faint'}`}>
            {alertCount}
          </span>
          <div className="flex flex-col items-start leading-tight">
            <span className={`text-3xs mono font-bold tracking-widest ${alertCount > 0 ? 'text-red' : 'text-ink-faint'}`}>
              ACTIVE
            </span>
            <span className={`text-3xs mono font-bold tracking-widest ${alertCount > 0 ? 'text-red' : 'text-ink-faint'}`}>
              ALERTS
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
