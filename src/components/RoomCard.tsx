import type { Room } from '@/types';
import { safetyColor, safetyBorder, formatRoom } from '@/utils/style';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

// Human-readable event descriptions instead of raw sensor dumps
function describeSafetyEvent(room: Room): string | null {
  const { sensors, safety } = room;
  if (safety === 'safe') return null;

  const issues: string[] = [];

  if (sensors.temperature < 18) {
    issues.push(`Too cold — ${sensors.temperature.toFixed(1)}°C`);
  } else if (sensors.temperature > 30) {
    issues.push(`Too hot — ${sensors.temperature.toFixed(1)}°C`);
  }

  if (sensors.humidity > 75) {
    issues.push(`Humidity high — ${Math.round(sensors.humidity)}%`);
  }

  if (sensors.soundLevel === 'HIGH') {
    issues.push(`Loud sound — ${Math.round(sensors.sound)} dB`);
  } else if (sensors.soundLevel === 'LOUD') {
    issues.push(`Elevated sound — ${Math.round(sensors.sound)} dB`);
  }

  return issues[0] ?? null;
}

export function RoomCard({ room, isSelected, onClick }: RoomCardProps) {
  const color = safetyColor(room.safety);
  const event = describeSafetyEvent(room);
  const hasProblem = room.safety !== 'safe';

  return (
    <div
      onClick={onClick}
      className={`
        relative border-l-2 ${safetyBorder(room.safety)}
        px-3 py-2.5 cursor-pointer transition-colors duration-100
        ${isSelected
          ? 'bg-base-hover'
          : hasProblem
          ? 'bg-base-elevated hover:bg-base-hover'
          : 'bg-base-elevated hover:bg-base-hover'
        }
      `}
    >
      {/* Room ID + safety state on one line */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs mono font-semibold text-ink tracking-wider">
          {formatRoom(room.id)}
        </span>
        <span className={`text-2xs mono font-semibold tracking-wider ${color}`}>
          {room.safety === 'safe' ? 'SAFE' : room.safety === 'warning' ? 'WARNING' : 'CRITICAL'}
        </span>
      </div>

      {/* Room name */}
      <p className="text-2xs text-ink-faint mb-1.5">{room.name}</p>

      {/* Show event description OR compact sensor row depending on state */}
      {hasProblem && event ? (
        <p className={`text-xs font-medium ${color}`}>{event}</p>
      ) : (
        <div className="flex items-center gap-3 text-2xs mono text-ink-faint">
          <span className="text-ink-muted tabular-nums">{room.sensors.temperature.toFixed(1)}°C</span>
          <span className="tabular-nums">{Math.round(room.sensors.humidity)}%</span>
          <span className={
            room.sensors.soundLevel === 'NORMAL'
              ? ''
              : room.sensors.soundLevel === 'LOUD'
              ? 'text-amber'
              : 'text-red'
          }>
            {room.sensors.soundLevel === 'NORMAL' ? 'quiet' : room.sensors.soundLevel === 'LOUD' ? 'loud' : 'high sound'}
          </span>
        </div>
      )}
    </div>
  );
}
