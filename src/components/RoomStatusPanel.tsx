import { useSimulation } from '@/hooks/useSimulation';
import { RoomCard } from './RoomCard';

interface RoomStatusPanelProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
}

export function RoomStatusPanel({ selectedRoom, onSelectRoom }: RoomStatusPanelProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();

  const safe = rooms.filter((r) => r.safety === 'safe').length;
  const warn = rooms.filter((r) => r.safety === 'warning').length;
  const crit = rooms.filter((r) => r.safety === 'critical').length;

  return (
    <div className="panel flex flex-col" style={{ borderTop: '2px solid #263540' }}>
      {/* Header */}
      <div className="panel-header bg-base-elevated">
        <span className="section-title">ROOM STATUS</span>
        <div className="flex items-center gap-2">
          {crit > 0 && (
            <span className="flex items-center gap-1 text-2xs mono font-bold text-red">
              <span className="status-dot bg-red" />
              {crit}
            </span>
          )}
          {warn > 0 && (
            <span className="flex items-center gap-1 text-2xs mono text-amber">
              <span className="status-dot bg-amber" />
              {warn}
            </span>
          )}
          <span className="text-2xs mono text-ink-faint">
            {safe}/{rooms.length}
          </span>
        </div>
      </div>

      {/* Rooms */}
      <div className="divide-y divide-line-faint overflow-y-auto scrollbar-thin flex-1">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isSelected={selectedRoom === room.id}
            onClick={() => onSelectRoom(room.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-line flex items-center justify-between">
        <span className="text-3xs mono text-ink-faint">SENSOR BUS NORMAL</span>
        <span className="text-3xs mono text-ink-faint">ZONE A</span>
      </div>
    </div>
  );
}
