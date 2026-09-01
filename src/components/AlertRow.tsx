import type { Alert } from '@/types';
import { formatTimeSec, formatRoom, alertStateColor } from '@/utils/style';

interface AlertRowProps {
  alert: Alert;
  onClick?: () => void;
  compact?: boolean;
}

const SEVERITY_LEFT: Record<string, string> = {
  critical: '#FF4D4D',
  warning:  '#F2B84B',
  info:     '#263540',
};

export function AlertRow({ alert, onClick, compact }: AlertRowProps) {
  const isActive = alert.state === 'ACTIVE';
  const isResolved = alert.state === 'RESOLVED';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        flex items-center gap-0 border-b border-line-faint
        ${isActive ? 'bg-base-elevated' : ''}
        ${onClick ? 'cursor-pointer hover:bg-base-hover' : ''}
        transition-colors animate-slide-in
      `}
      style={{ borderLeft: `2px solid ${SEVERITY_LEFT[alert.severity]}` }}
    >
      {/* Time */}
      <span className="text-3xs mono text-ink-faint tabular-nums px-3 py-2.5 shrink-0 w-[62px]">
        {formatTimeSec(alert.timestamp)}
      </span>

      {/* Room */}
      <span className="text-2xs mono text-cyan tabular-nums px-2 py-2.5 shrink-0 w-[64px]">
        {formatRoom(alert.room)}
      </span>

      {/* Description */}
      <span className={`
        flex-1 text-xs py-2.5 px-2 truncate
        ${isActive
          ? alert.severity === 'critical' ? 'text-red' : 'text-amber'
          : isResolved ? 'text-ink-faint' : 'text-ink-muted'
        }
      `}>
        {alert.description.toUpperCase()}
      </span>

      {/* State */}
      {!compact && (
        <span className={`
          text-2xs mono font-semibold tracking-widest px-3 py-2.5 shrink-0
          ${alertStateColor(alert.state)}
        `}>
          {alert.state}
        </span>
      )}

      {compact && (
        <span className={`
          text-3xs mono px-3 py-2.5 shrink-0
          ${isActive ? 'text-red' : 'text-ink-faint'}
        `}>
          {isActive ? 'ACTIVE' : 'RESOLVED'}
        </span>
      )}
    </div>
  );
}
