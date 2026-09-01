import { ChevronRight } from 'lucide-react';
import type { Alert } from '@/types';
import { formatTimeSec, formatRoom, severityDot, alertStateColor } from '@/utils/style';

interface AlertRowProps {
  alert: Alert;
  onClick?: () => void;
  compact?: boolean;
}

export function AlertRow({ alert, onClick, compact }: AlertRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 border-b border-line-faint hover:bg-base-hover transition-colors animate-slide-in cursor-pointer ${
        onClick ? '' : 'cursor-default'
      }`}
    >
      {/* Severity dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${severityDot(alert.severity)} ${
        alert.state === 'ACTIVE' && alert.severity === 'critical' ? 'animate-pulse-red' : ''
      }`} />

      {/* Timestamp */}
      <span className="text-2xs mono text-ink-faint tabular-nums shrink-0 w-16">{formatTimeSec(alert.timestamp)}</span>

      {/* Room */}
      <span className="text-2xs mono text-ink-muted shrink-0 w-16">{formatRoom(alert.room)}</span>

      {/* Description */}
      <span className="text-xs text-ink flex-1 truncate">{alert.description}</span>

      {/* State */}
      <span className={`text-2xs mono font-semibold tracking-wider shrink-0 ${alertStateColor(alert.state)}`}>
        {alert.state}
      </span>

      {onClick && !compact && <ChevronRight className="w-3.5 h-3.5 text-ink-faint shrink-0" />}
    </div>
  );
}
