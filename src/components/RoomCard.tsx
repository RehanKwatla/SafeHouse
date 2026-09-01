import type { Room } from '@/types';
import { safetyColor, safetyBorder } from '@/utils/style';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

function describePrimaryIssue(room: Room): string | null {
  const { sensors, safety } = room;
  if (safety === 'safe') return null;
  if (sensors.temperature < 18) return `Too cold — ${sensors.temperature.toFixed(1)}°C`;
  if (sensors.temperature > 30) return `Too hot — ${sensors.temperature.toFixed(1)}°C`;
  if (sensors.humidity > 75) return `Humidity high — ${Math.round(sensors.humidity)}%`;
  if (sensors.soundLevel === 'HIGH') return `High sound — ${Math.round(sensors.sound)} dB`;
  if (sensors.soundLevel === 'LOUD') return `Elevated sound — ${Math.round(sensors.sound)} dB`;
  return null;
}

const SAFETY_SYMBOL = {
  safe: '◆',
  warning: '▲',
  critical: '▲',
} as const;

export function RoomCard({ room, isSelected, onClick }: RoomCardProps) {
  const color = safetyColor(room.safety);
  const issue = describePrimaryIssue(room);
  const hasProblem = room.safety !== 'safe';

  return (
    <div
      onClick={onClick}
      className={`
        border-l-2 ${safetyBorder(room.safety)} px-3 py-2.5
        cursor-pointer transition-colors duration-100
        ${isSelected ? 'bg-base-hover' : 'bg-base-elevated hover:bg-base-hover'}
      `}
    >
      {/* Row 1: room ID + state */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs mono font-bold text-ink tracking-widest">
          ROOM {String(room.id).padStart(2,'0')}
        </span>
        <div className={`flex items-center gap-1 ${color}`}>
          <span className="text-3xs">{SAFETY_SYMBOL[room.safety]}</span>
          <span className="text-2xs mono font-bold tracking-widest">
            {room.safety === 'safe' ? 'SAFE' : room.safety === 'warning' ? 'ATTENTION' : 'ALERT'}
          </span>
        </div>
      </div>

      {/* Row 2: room name */}
      <p className="text-2xs text-ink-faint mb-1.5 tracking-wide">{room.name}</p>

      {/* Row 3: issue OR sensor strip */}
      {hasProblem && issue ? (
        <p className={`text-xs font-medium ${color}`}>{issue}</p>
      ) : (
        <div className="flex items-center gap-3 text-2xs mono">
          <span className="text-ink-muted tabular-nums">{room.sensors.temperature.toFixed(1)}°C</span>
          <span className="text-ink-faint tabular-nums">{Math.round(room.sensors.humidity)}%</span>
          <span className={
            room.sensors.soundLevel === 'NORMAL' ? 'text-ink-faint' :
            room.sensors.soundLevel === 'LOUD'   ? 'text-amber' : 'text-red'
          }>
            {room.sensors.soundLevel}
          </span>
        </div>
      )}
    </div>
  );
}
