import { AlertTriangle, ShieldCheck, AlertOctagon } from 'lucide-react';
import type { Room } from '@/types';
import { safetyBorder, safetyColor, formatRoom } from '@/utils/style';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

const SAFETY_ICONS = {
  safe: ShieldCheck,
  warning: AlertTriangle,
  critical: AlertOctagon,
} as const;

const SAFETY_LABELS = {
  safe: 'SAFE',
  warning: 'ATTENTION',
  critical: 'CRITICAL',
} as const;

export function RoomCard({ room, isSelected, onClick }: RoomCardProps) {
  const Icon = SAFETY_ICONS[room.safety];
  const color = safetyColor(room.safety);

  return (
    <div
      onClick={onClick}
      className={`panel-elevated border-l-2 ${safetyBorder(room.safety)} px-3 py-2.5 cursor-pointer transition-all duration-150 ${
        isSelected ? 'ring-1 ring-green/40 bg-base-hover' : 'hover:bg-base-hover'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs mono font-semibold text-ink tracking-wider">{formatRoom(room.id)}</span>
        <div className={`flex items-center gap-1 ${color}`}>
          <Icon className="w-3 h-3" strokeWidth={2} />
          <span className="text-2xs mono font-semibold tracking-wider">{SAFETY_LABELS[room.safety]}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-2xs mono text-ink-muted">
        <span className="text-ink">{room.sensors.temperature.toFixed(1)}°C</span>
        <span>{Math.round(room.sensors.humidity)}% HUMIDITY</span>
        <span className={room.sensors.soundLevel === 'NORMAL' ? '' : room.sensors.soundLevel === 'LOUD' ? 'text-amber' : 'text-red'}>
          {room.sensors.soundLevel === 'NORMAL'
            ? 'SOUND NORMAL'
            : room.sensors.soundLevel === 'LOUD'
            ? 'LOUD SOUND'
            : 'HIGH SOUND'}
        </span>
      </div>
    </div>
  );
}
