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
    <div className="panel flex flex-col">
      {/* Header with summary counts */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="label-text">ROOM STATUS</span>
        <div className="flex items-center gap-3">
          {crit > 0 && (
            <span className="text-2xs mono text-red font-semibold">{crit} CRIT</span>
          )}
          {warn > 0 && (
            <span className="text-2xs mono text-amber">{warn} WARN</span>
          )}
          <span className="text-2xs mono text-ink-faint">{safe}/{rooms.length} safe</span>
        </div>
      </div>

      {/* Room list — no padding between cards, uses border separation */}
      <div className="divide-y divide-line-faint overflow-y-auto scrollbar-thin" style={{ maxHeight: 420 }}>
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isSelected={selectedRoom === room.id}
            onClick={() => onSelectRoom(room.id)}
          />
        ))}
      </div>
    </div>
  );
}
