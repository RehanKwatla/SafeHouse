import type { Room } from '@/types';
import { Shield, AlertTriangle, AlertOctagon, Thermometer, Droplets, Activity } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

export function RoomCard({ room, isSelected, onClick }: RoomCardProps) {
  const isSafe = room.safety === 'safe';
  const isWarning = room.safety === 'warning';
  const isCritical = room.safety === 'critical';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={`
        hud-panel p-3 cursor-pointer transition-all duration-150 relative select-none
        ${
          isSelected
            ? 'hud-glow-cyan border-cyan bg-[#09181C]'
            : isCritical
            ? 'hud-glow-red border-red bg-[#140A0B]'
            : isWarning
            ? 'hud-glow-amber border-amber bg-[#141008]'
            : 'border-line hover:border-line-strong hover:bg-base-elevated'
        }
      `}
    >
      {/* Top Row: Room Label & Corner Marker */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs mono font-black text-ink tracking-widest">
          ROOM {String(room.id).padStart(2, '0')}
        </span>
        <span className="text-3xs mono text-ink-faint">⛶</span>
      </div>

      {/* State Badge */}
      <div className="flex items-center gap-2 mb-2.5">
        {isSafe && (
          <div className="flex items-center gap-1.5 text-green">
            <Shield className="w-4 h-4 text-green" />
            <span className="text-xs mono font-black tracking-widest">SAFE</span>
          </div>
        )}
        {isWarning && (
          <div className="flex items-center gap-1.5 text-amber">
            <AlertTriangle className="w-4 h-4 text-amber" />
            <span className="text-xs mono font-black tracking-widest">ATTENTION</span>
          </div>
        )}
        {isCritical && (
          <div className="flex items-center gap-1.5 text-red">
            <AlertOctagon className="w-4 h-4 text-red animate-pulse" />
            <span className="text-xs mono font-black tracking-widest">ALERT</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Exact Telemetry Icons from Screenshot */}
      <div className="flex items-center justify-between text-2xs mono pt-1.5 border-t border-line/60">
        <div className="flex items-center gap-1">
          <Thermometer className="w-3 h-3 opacity-60 text-ink-muted" />
          <span className="tabular-nums font-semibold text-ink">
            {room.sensors.temperature.toFixed(1)}°C
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3 opacity-60 text-cyan" />
          <span className="tabular-nums font-semibold text-ink">
            {Math.round(room.sensors.humidity)}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 opacity-60 text-ink-muted" />
          <span
            className={`font-bold tracking-wider text-3xs ${
              room.sensors.soundLevel === 'NORMAL'
                ? 'text-ink-muted'
                : room.sensors.soundLevel === 'LOUD'
                ? 'text-amber'
                : 'text-red'
            }`}
          >
            {room.sensors.soundLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
