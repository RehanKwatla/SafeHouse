import type { Alert } from '@/types';
import { formatTimeSec } from '@/utils/style';

interface AlertRowProps {
  alert: Alert;
  /** Human-readable sensor label, e.g. "AIR QUALITY" */
  metricLabel?: string;
  onClick?: () => void;
}

export function AlertRow({ alert, metricLabel, onClick }: AlertRowProps) {
  const isCritical = alert.severity === 'critical';
  const isActive   = alert.state === 'ACTIVE';
  const label      = metricLabel ?? alert.metric.toUpperCase();

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      className={`
        hud-panel-inset px-3 py-2 flex items-center justify-between gap-2.5
        border transition-all duration-150 text-2xs mono
        ${isCritical
          ? 'border-red/40 bg-[#160809] hover:border-red hover:bg-red/10'
          : 'border-amber/40 bg-[#161208] hover:border-amber hover:bg-amber/10'
        }
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Time */}
      <span className="text-ink-muted text-3xs tabular-nums shrink-0 w-[54px]">
        {formatTimeSec(alert.timestamp)}
      </span>

      {/* Separator */}
      <span className="text-ink-faint shrink-0">{'}'}</span>

      {/* Sensor label */}
      <span className={`font-bold text-3xs shrink-0 w-[80px] truncate ${isCritical ? 'text-red' : 'text-amber'}`}>
        {label}
      </span>

      {/* Description */}
      <span className="text-ink-muted flex-1 truncate uppercase font-semibold text-3xs min-w-0">
        {alert.description}
      </span>

      {/* State */}
      <span className={`font-black text-3xs shrink-0 tracking-widest ${
        isActive
          ? isCritical ? 'text-red' : 'text-amber'
          : 'text-green'
      }`}>
        {alert.state}
      </span>
    </div>
  );
}
