import { Shield, Wifi, Bell } from 'lucide-react';
import { useClock } from '@/hooks/useSimulation';
import { useSimulation } from '@/hooks/useSimulation';
import type { DataSource } from '@/types';

function formatClock(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    <header className="flex items-center justify-between px-5 h-[72px] bg-base-surface border-b border-line shrink-0 z-20">
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-green-tint border border-green/30 rounded">
          <Shield className="w-5 h-5 text-green" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider text-ink leading-none">SAFEROOM</h1>
          <p className="text-2xs text-ink-muted tracking-widest mt-1 mono">AUTONOMOUS SAFETY PATROL SYSTEM</p>
        </div>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-5">
        {/* Data source badge */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-2xs mono tracking-wider ${dataSource === 'LIVE' ? 'border-green/30 bg-green-tint text-green' : 'border-amber/30 bg-amber-tint text-amber'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'LIVE' ? 'bg-green' : 'bg-amber'}`} />
          {dataSource === 'LIVE' ? 'LIVE ESP32' : 'SIMULATION MODE'}
        </div>

        {/* System online */}
        <div className="flex items-center gap-2">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-green animate-pulse-green" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-green" />
          </span>
          <span className="text-2xs mono tracking-wider text-green">SYSTEM ONLINE</span>
        </div>

        {/* Clock */}
        <div className="text-sm mono font-medium text-ink tabular-nums">{formatClock(clock)}</div>

        {/* Link quality */}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-ink-muted" />
          <span className="text-2xs mono text-ink-muted">{Math.round(robot.connection)}% LINK</span>
        </div>

        {/* Alert indicator */}
        <button
          onClick={onAlertClick}
          className="relative flex items-center justify-center w-8 h-8 rounded border border-line hover:border-line-strong hover:bg-base-hover transition-colors"
        >
          <Bell className="w-4 h-4 text-ink-muted" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red text-white text-2xs font-bold rounded">
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
