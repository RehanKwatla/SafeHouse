import { Shield, Bell } from 'lucide-react';
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
    <header className="flex items-center justify-between px-5 h-14 bg-base-surface border-b border-line shrink-0 z-20">
      {/* Left: branding — compact, no over-decoration */}
      <div className="flex items-center gap-3">
        <Shield className="w-4 h-4 text-green shrink-0" strokeWidth={2} />
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold tracking-widest text-ink mono">SAFEROOM</span>
          <span className="hidden sm:inline text-2xs text-ink-faint tracking-wider">
            AUTONOMOUS SAFETY PATROL
          </span>
        </div>
      </div>

      {/* Right: essential status only — no badge overload */}
      <div className="flex items-center gap-5">
        {/* Data source — one indicator, not two */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dataSource === 'LIVE' ? 'bg-green animate-pulse-green' : 'bg-amber'
            }`}
          />
          <span className="text-2xs mono text-ink-muted">
            {dataSource === 'LIVE' ? 'LIVE' : 'SIM'}
          </span>
        </div>

        {/* Connection quality — only shows when below 95% */}
        {robot.connection < 95 && (
          <span className="text-2xs mono text-amber tabular-nums">
            {Math.round(robot.connection)}% LINK
          </span>
        )}

        {/* Clock */}
        <span className="text-sm mono font-medium text-ink tabular-nums hidden md:inline">
          {formatClock(clock)}
        </span>

        {/* Alert bell — the only prominent action in the header */}
        <button
          onClick={onAlertClick}
          className="relative flex items-center justify-center w-8 h-8 hover:bg-base-hover transition-colors"
          style={{ borderRadius: 2 }}
          aria-label={alertCount > 0 ? `${alertCount} active alerts` : 'No active alerts'}
        >
          <Bell
            className={`w-4 h-4 ${alertCount > 0 ? 'text-red' : 'text-ink-muted'}`}
            strokeWidth={alertCount > 0 ? 2 : 1.5}
          />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red text-white text-2xs font-bold mono">
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
