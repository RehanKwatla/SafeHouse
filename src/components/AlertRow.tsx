import type { Alert } from '@/types';
import { formatTimeSec, formatRoom } from '@/utils/style';

interface AlertRowProps {
  alert: Alert;
  onClick?: () => void;
  compact?: boolean;
}

export function AlertRow({ alert, onClick }: AlertRowProps) {
  const isCritical = alert.severity === 'critical';
  const isActive = alert.state === 'ACTIVE';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        hud-panel-inset px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer
        border transition-all duration-150 text-2xs mono
        ${
          isCritical
            ? 'border-red/40 bg-[#160809] hover:border-red hover:bg-red/10'
            : 'border-amber/40 bg-[#161208] hover:border-amber hover:bg-amber/10'
        }
      `}
    >
      {/* Time */}
      <span className="text-ink-muted text-3xs tabular-nums shrink-0">
        {formatTimeSec(alert.timestamp)}
      </span>

      {/* Bracket separator */}
      <span className="text-ink-faint shrink-0">{'}'}</span>

      {/* Room Badge */}
      <span
        className={`font-bold shrink-0 ${
          isCritical ? 'text-red' : 'text-amber'
        }`}
      >
        {formatRoom(alert.room)}
      </span>

      {/* Description */}
      <span className="text-ink-muted flex-1 truncate uppercase font-semibold text-3xs">
        {alert.description}
      </span>

      {/* State */}
      <span
        className={`font-black text-3xs shrink-0 tracking-widest ${
          isActive
            ? isCritical
              ? 'text-red'
              : 'text-amber'
            : 'text-green'
        }`}
      >
        {alert.state}
      </span>
    </div>
  );
}
