import type { Alert } from '@/types';
import { formatTimeSec, formatRoom, alertStateColor } from '@/utils/style';

interface AlertRowProps {
  alert: Alert;
  onClick?: () => void;
  compact?: boolean;
}

// Severity indicator: a left-border accent, no dot/badge overload
const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-red',
  warning: 'border-l-amber',
  info: 'border-l-line',
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: 'text-red',
  warning: 'text-amber',
  info: 'text-ink-muted',
};

export function AlertRow({ alert, onClick, compact }: AlertRowProps) {
  const isActive = alert.state === 'ACTIVE';

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-3 px-3 py-2.5 border-b border-line-faint border-l-2
        ${SEVERITY_BORDER[alert.severity]}
        ${isActive ? 'bg-base-elevated' : ''}
        ${onClick ? 'cursor-pointer hover:bg-base-hover' : 'cursor-default'}
        transition-colors
      `}
    >
      {/* Time */}
      <span className="text-2xs mono text-ink-faint tabular-nums shrink-0 pt-0.5 w-[52px]">
        {formatTimeSec(alert.timestamp)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-2xs mono text-ink-muted shrink-0">{formatRoom(alert.room)}</span>
          {!compact && (
            <span className={`text-2xs mono font-semibold ${alertStateColor(alert.state)}`}>
              {alert.state}
            </span>
          )}
        </div>
        <p className={`text-xs leading-snug ${isActive ? SEVERITY_TEXT[alert.severity] : 'text-ink-muted'}`}>
          {alert.description}
        </p>
        {alert.value !== undefined && (
          <p className="text-2xs mono text-ink-faint mt-0.5">
            {alert.value.toFixed(1)}
            {alert.metric === 'temperature' ? '°C' : alert.metric === 'humidity' ? '%' : ' dB'}
            {alert.threshold !== undefined ? ` — limit ${alert.threshold}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
