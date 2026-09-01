import type { Room } from '@/types';
import { safetyColor, safetyBorder, safetyStroke } from '@/utils/style';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

const SAFETY_SYMBOL = {
  safe: '◆',
  warning: '▲',
  critical: '▲',
} as const;

export function RoomCard({ room, isSelected, onClick }: RoomCardProps) {
  const color = safetyColor(room.safety);
  const stroke = safetyStroke(room.safety);
  const hasProblem = room.safety !== 'safe';

  return (
    <div
      onClick={onClick}
      className={`
        border-l-2 ${safetyBorder(room.safety)}
        px-3 py-2.5 cursor-pointer transition-colors duration-100
        ${isSelected ? 'bg-base-hover' : 'bg-base-elevated hover:bg-base-hover'}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {/* Room ID + State */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs mono font-bold text-ink tracking-widest">
          ROOM {String(room.id).padStart(2, '0')}
        </span>
        <div className={`flex items-center gap-1 ${color}`}>
          <span className="text-3xs">{SAFETY_SYMBOL[room.safety]}</span>
          <span className="text-2xs mono font-bold tracking-widest">
            {room.safety === 'safe' ? 'SAFE' : room.safety === 'warning' ? 'ATTENTION' : 'ALERT'}
          </span>
        </div>
      </div>

      {/* Room name */}
      <p className="text-2xs text-ink-faint mb-1.5 tracking-wide">{room.name}</p>

      {/* Sensor readings */}
      <div className="flex items-center gap-3 text-2xs mono">
        <span className="tabular-nums" style={{ color: hasProblem ? stroke : '#758287' }}>
          {room.sensors.temperature.toFixed(1)}°C
        </span>
        <span className="tabular-nums" style={{ color: hasProblem ? stroke : '#3D4F55' }}>
          {Math.round(room.sensors.humidity)}%
        </span>
        <span className={
          room.sensors.soundLevel === 'NORMAL' ? 'text-ink-faint' :
          room.sensors.soundLevel === 'LOUD' ? 'text-amber' : 'text-red'
        }>
          {Math.round(room.sensors.sound)}dB
        </span>
      </div>
    </div>
  );
}
