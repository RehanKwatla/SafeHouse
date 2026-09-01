import { useMemo } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { MAP_DIMENSIONS } from '@/config';
import type { RoomPosition } from '@/types';
import { safetyStroke } from '@/utils/style';
import { formatRoom } from '@/utils/style';

interface PatrolMapProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
}

function roomCenter(pos: RoomPosition) {
  return { x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 };
}

export function PatrolMap({ selectedRoom, onSelectRoom }: PatrolMapProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();
  const robot = sim.getRobot();
  const patrol = sim.getPatrol();

  // Build patrol route connections — sequential room-to-room lines
  const routeLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const order = patrol.rooms;
    for (let i = 0; i < order.length - 1; i++) {
      const a = rooms.find((r) => r.id === order[i]);
      const b = rooms.find((r) => r.id === order[i + 1]);
      if (a && b) {
        const ca = roomCenter(a.position);
        const cb = roomCenter(b.position);
        lines.push({ x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y });
      }
    }
    return lines;
  }, [rooms, patrol.rooms]);

  const completedRooms = patrol.completedRooms;
  const isRoomCompleted = (id: number) => completedRooms.includes(id);

  return (
    <div className="panel relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="label-text">LIVE PATROL MAP</span>
          <span className="w-1 h-1 rounded-full bg-green" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xs mono text-ink-muted">
            {robot.state === 'MOVING'
              ? `${formatRoom(robot.currentRoom)} → ${formatRoom(robot.targetRoom ?? 0)}`
              : `AT ${formatRoom(robot.currentRoom)}`}
          </span>
          {robot.state === 'MOVING' && (
            <span className="text-2xs mono text-green">ETA: {robot.etaSeconds}S</span>
          )}
        </div>
      </div>

      {/* SVG map */}
      <div className="relative bg-base p-4" style={{ minHeight: 360 }}>
        {/* Grid background */}
        <svg
          viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
          className="w-full h-auto"
          style={{ maxHeight: 420 }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#151B20" strokeWidth="0.5" />
            </pattern>
            <filter id="robot-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={MAP_DIMENSIONS.width} height={MAP_DIMENSIONS.height} fill="url(#grid)" />

          {/* Patrol route dashed lines */}
          {routeLines.map((line, i) => {
            const isCompleted =
              isRoomCompleted(patrol.rooms[i]) && isRoomCompleted(patrol.rooms[i + 1]);
            return (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={isCompleted ? '#B8F34A' : '#3A4550'}
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity={isCompleted ? 0.5 : 0.8}
              />
            );
          })}

          {/* Rooms */}
          {rooms.map((room) => {
            const stroke = safetyStroke(room.safety);
            const isSelected = selectedRoom === room.id;
            const isCurrent = robot.currentRoom === room.id;
            const isCompleted = isRoomCompleted(room.id);

            return (
              <g key={room.id} onClick={() => onSelectRoom(room.id)} style={{ cursor: 'pointer' }}>
                {/* Room rectangle */}
                <rect
                  x={room.position.x}
                  y={room.position.y}
                  width={room.position.width}
                  height={room.position.height}
                  rx="3"
                  fill={isSelected ? `${stroke}15` : isCurrent ? `${stroke}10` : '#101419'}
                  stroke={stroke}
                  strokeWidth={isCurrent || isSelected ? 2 : 1.2}
                  opacity={0.95}
                />

                {/* Completed checkmark */}
                {isCompleted && (
                  <circle
                    cx={room.position.x + room.position.width - 14}
                    cy={room.position.y + 14}
                    r="8"
                    fill="#B8F34A"
                    opacity="0.2"
                  />
                )}
                {isCompleted && (
                  <text
                    x={room.position.x + room.position.width - 14}
                    y={room.position.y + 17}
                    textAnchor="middle"
                    fill="#B8F34A"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ✓
                  </text>
                )}

                {/* Room label */}
                <text
                  x={room.position.x + 12}
                  y={room.position.y + 24}
                  fill="#E8ECEF"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="600"
                  letterSpacing="0.05em"
                >
                  {formatRoom(room.id)}
                </text>

                {/* Room name */}
                <text
                  x={room.position.x + 12}
                  y={room.position.y + 40}
                  fill="#7D8790"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {room.name}
                </text>

                {/* Sensor mini-readout inside room */}
                <text
                  x={room.position.x + 12}
                  y={room.position.y + room.position.height - 16}
                  fill={room.safety === 'safe' ? '#7D8790' : stroke}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {room.sensors.temperature.toFixed(1)}°C · {Math.round(room.sensors.humidity)}% · {Math.round(room.sensors.sound)}dB
                </text>

                {/* Safety state label */}
                <text
                  x={room.position.x + 12}
                  y={room.position.y + room.position.height - 30}
                  fill={stroke}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="600"
                  letterSpacing="0.08em"
                >
                  {room.safety === 'safe' ? 'SAFE' : room.safety === 'warning' ? 'ATTENTION' : 'CRITICAL'}
                </text>
              </g>
            );
          })}

          {/* Robot marker */}
          <g filter="url(#robot-glow)">
            {/* Outer pulse ring */}
            <circle
              cx={robot.position.x}
              cy={robot.position.y}
              r="14"
              fill="none"
              stroke="#B8F34A"
              strokeWidth="1"
              opacity="0.3"
            >
              <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Inner ring */}
            <circle
              cx={robot.position.x}
              cy={robot.position.y}
              r="9"
              fill="#B8F34A"
              fillOpacity="0.15"
              stroke="#B8F34A"
              strokeWidth="1.5"
            />
            {/* Core */}
            <circle cx={robot.position.x} cy={robot.position.y} r="4" fill="#B8F34A" />
            {/* Direction indicator */}
            {robot.state === 'MOVING' && robot.targetRoom !== null && (
              <text
                x={robot.position.x}
                y={robot.position.y + 3}
                textAnchor="middle"
                fill="#080A0C"
                fontSize="7"
                fontWeight="700"
                fontFamily="monospace"
              >
                R
              </text>
            )}
          </g>

          {/* Scan line effect */}
          <rect
            x="0"
            y="0"
            width="2"
            height={MAP_DIMENSIONS.height}
            fill="#B8F34A"
            opacity="0.06"
          >
            <animate attributeName="x" values={`0;${MAP_DIMENSIONS.width}`} dur="6s" repeatCount="indefinite" />
          </rect>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 panel-elevated px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green" />
            <span className="text-2xs mono text-ink-muted">ROBOT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-px border-t border-dashed border-ink-faint" />
            <span className="text-2xs mono text-ink-muted">PATROL ROUTE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border border-ink-muted" />
            <span className="text-2xs mono text-ink-muted">ROOM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
