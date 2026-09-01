import { useSimulation } from '@/hooks/useSimulation';
import { RoomCard } from './RoomCard';
import { LayoutGrid } from 'lucide-react';

interface RoomStatusPanelProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
  onViewAllRooms?: () => void;
}

export function RoomStatusPanel({ selectedRoom, onSelectRoom, onViewAllRooms }: RoomStatusPanelProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();

  return (
    <div className="hud-panel flex flex-col h-full select-none">
      {/* Header */}
      <div className="hud-header">
        <span className="hud-section-title">ROOM STATUS</span>
        <span className="text-3xs mono text-ink-muted">ZONE 01</span>
      </div>

      {/* Room list */}
      <div className="p-3 space-y-2.5 overflow-y-auto scrollbar-thin flex-1">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isSelected={selectedRoom === room.id}
            onClick={() => onSelectRoom(room.id)}
          />
        ))}
      </div>

      {/* Footer action button from screenshot */}
      <div className="p-3 border-t border-line">
        <button
          onClick={onViewAllRooms}
          className="w-full btn-hud btn-hud-green flex items-center justify-center gap-2 py-2 text-2xs mono font-bold tracking-widest cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>VIEW ALL ROOMS</span>
        </button>
      </div>
    </div>
  );
}
