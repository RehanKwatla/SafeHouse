import { useSimulation } from '@/hooks/useSimulation';
import { RoomCard } from './RoomCard';
import type { SafetyState } from '@/types';

interface RoomStatusPanelProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
}

export function RoomStatusPanel({ selectedRoom, onSelectRoom }: RoomStatusPanelProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();

  return (
    <div className="panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="label-text">ROOM STATUS</span>
        <span className="text-2xs mono text-ink-muted">{rooms.length} ROOMS</span>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto scrollbar-thin" style={{ maxHeight: 420 }}>
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isSelected={selectedRoom === room.id}
            onClick={() => onSelectRoom(room.id)}
          />
        ))}

        {/* Summary footer */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-line-faint">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-2xs mono text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              {rooms.filter((r) => r.safety === 'safe').length} SAFE
            </span>
            <span className="flex items-center gap-1 text-2xs mono text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              {rooms.filter((r) => r.safety === 'warning').length} WARN
            </span>
            <span className="flex items-center gap-1 text-2xs mono text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-red" />
              {rooms.filter((r) => r.safety === 'critical').length} CRIT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
