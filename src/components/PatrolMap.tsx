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

// Robot marker: a directional chevron/arrow shape that communicates movement
function RobotMarker({ x, y, moving }: { x: number; y: number; moving: boolean }) {
  return (
    <g>
      {/* Position ring — communicates: this is a precise location */}
      <circle
        cx={x}
        cy={y}
        r="12"
        fill="none"
        stroke="#B8F34A"
        strokeWidth="1"
        opacity="0.25"
      />
      {/* Body */}
      <rect
        x={x - 6}
        y={y - 6}
        width={12}
        height={12}
        rx="1"
        fill="#B8F34A"
        fillOpacity={moving ? '1' : '0.85'}
      />
      {/* Direction nub — top of the square, indicates heading */}
      <rect x={x - 2} y={y - 9} width={4} height={4} rx="0.5" fill="#B8F34A" />
      {/* Inner cross — identifies it as a robot, not a waypoint */}
      <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#080A0C" strokeWidth="1.5" />
      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#080A0C" strokeWidth="1.5" />
      {/* Pulse ring — only when moving, communicates active state */}
      {moving && (
        <circle
          cx={x}
          cy={y}
          r="18"
          fill="none"
          stroke="#B8F34A"
          strokeWidth="0.75"
          opacity="0.2"
        >
          <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

export function PatrolMap({ selectedRoom, onSelectRoom }: PatrolMapProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();
  const robot = sim.getRobot();
  const patrol = sim.getPatrol();

  const routeLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; completed: boolean }[] = [];
    const order = patrol.rooms;
    for (let i = 0; i < order.length - 1; i++) {
      const a = rooms.find((r) => r.id === order[i]);
      const b = rooms.find((r) => r.id === order[i + 1]);
      if (a && b) {
        const ca = roomCenter(a.position);
        const cb = roomCenter(b.position);
        const aComp = patrol.completedRooms.includes(order[i]);
        const bComp = patrol.completedRooms.includes(order[i + 1]);
        lines.push({ x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y, completed: aComp && bComp });
      }
    }
    return lines;
  }, [rooms, patrol.rooms, patrol.completedRooms]);

  const isMoving = robot.state === 'MOVING';

  return (
    <div className="panel relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-3">
          <span className="label-text">PATROL MAP</span>
          {/* Live dot — communicates active data, not decoration */}
          <span className="flex items-center gap-1.5 text-2xs mono text-ink-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-green" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xs mono text-ink-muted">
            {isMoving
              ? `${formatRoom(robot.currentRoom)} → ${formatRoom(robot.targetRoom ?? 0)}`
              : `AT ${formatRoom(robot.currentRoom)}`}
          </span>
          {isMoving && robot.etaSeconds > 0 && (
            <span className="text-2xs mono text-green tabular-nums">
              ETA {robot.etaSeconds}s
            </span>
          )}
          <span className={`text-2xs mono font-medium tracking-wider ${
            robot.state === 'PATROLLING' || robot.state === 'MOVING'
              ? 'text-green'
              : robot.state === 'IDLE'
              ? 'text-amber'
              : 'text-ink-faint'
          }`}>
            {robot.state}
          </span>
        </div>
      </div>

      {/* SVG map */}
      <div className="relative bg-base p-3" style={{ minHeight: 320 }}>
        <svg
          viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
          className="w-full h-auto"
          style={{ maxHeight: 400 }}
        >
          <defs>
            {/* Subtle dot grid — industrial monitoring aesthetic */}
            <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.75" fill="#151B20" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width={MAP_DIMENSIONS.width} height={MAP_DIMENSIONS.height} fill="#080A0C" />
          <rect width={MAP_DIMENSIONS.width} height={MAP_DIMENSIONS.height} fill="url(#dotgrid)" />

          {/* Patrol route lines — drawn first, rooms on top */}
          {routeLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.completed ? '#B8F34A' : '#252C32'}
              strokeWidth={line.completed ? '1.5' : '1'}
              strokeDasharray={line.completed ? 'none' : '5 4'}
              opacity={line.completed ? 0.55 : 0.7}
            />
          ))}

          {/* Waypoint dots on route */}
          {patrol.rooms.map((roomId) => {
            const room = rooms.find((r) => r.id === roomId);
            if (!room) return null;
            const c = roomCenter(room.position);
            const done = patrol.completedRooms.includes(roomId);
            return (
              <circle
                key={`wp-${roomId}`}
                cx={c.x}
                cy={c.y}
                r="3"
                fill={done ? '#B8F34A' : '#252C32'}
                stroke={done ? '#B8F34A' : '#333C44'}
                strokeWidth="1"
                opacity="0.6"
              />
            );
          })}

          {/* Rooms */}
          {rooms.map((room) => {
            const stroke = safetyStroke(room.safety);
            const isSelected = selectedRoom === room.id;
            const isCurrent = robot.currentRoom === room.id;
            const isCompleted = patrol.completedRooms.includes(room.id);
            const hasIssue = room.safety !== 'safe';

            // Fill: current room slightly brighter, selected has accent tint, issues get safety color tint
            const fillColor = isSelected
              ? `${stroke}18`
              : isCurrent
              ? `${stroke}0E`
              : hasIssue
              ? `${stroke}08`
              : '#0D1216';

            return (
              <g key={room.id} onClick={() => onSelectRoom(room.id)} style={{ cursor: 'pointer' }}>
                {/* Room body */}
                <rect
                  x={room.position.x}
                  y={room.position.y}
                  width={room.position.width}
                  height={room.position.height}
                  rx="2"
                  fill={fillColor}
                  stroke={stroke}
                  strokeWidth={isCurrent || isSelected ? 1.5 : hasIssue ? 1.5 : 1}
                  opacity="0.95"
                />

                {/* Top bar accent for rooms with issues — draws the eye */}
                {hasIssue && (
                  <rect
                    x={room.position.x}
                    y={room.position.y}
                    width={room.position.width}
                    height={3}
                    rx="2"
                    fill={stroke}
                    opacity="0.7"
                  />
                )}

                {/* Room ID */}
                <text
                  x={room.position.x + 10}
                  y={room.position.y + 22}
                  fill="#E8ECEF"
                  fontSize="11"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                  letterSpacing="0.06em"
                >
                  {formatRoom(room.id)}
                </text>

                {/* Room name */}
                <text
                  x={room.position.x + 10}
                  y={room.position.y + 36}
                  fill="#4A5258"
                  fontSize="8.5"
                  fontFamily="Inter, sans-serif"
                >
                  {room.name}
                </text>

                {/* Safety state — human-readable, not raw value */}
                <text
                  x={room.position.x + 10}
                  y={room.position.y + room.position.height - 32}
                  fill={stroke}
                  fontSize="7.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="700"
                  letterSpacing="0.1em"
                >
                  {room.safety === 'safe' ? 'SAFE' : room.safety === 'warning' ? 'ATTENTION' : 'CRITICAL'}
                </text>

                {/* Sensor readout */}
                <text
                  x={room.position.x + 10}
                  y={room.position.y + room.position.height - 18}
                  fill={room.safety === 'safe' ? '#4A5258' : stroke}
                  fontSize="8.5"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {room.sensors.temperature.toFixed(1)}°C  {Math.round(room.sensors.humidity)}%  {Math.round(room.sensors.sound)}dB
                </text>

                {/* Completed mark — small, not flashy */}
                {isCompleted && !isCurrent && (
                  <text
                    x={room.position.x + room.position.width - 12}
                    y={room.position.y + 18}
                    textAnchor="middle"
                    fill="#B8F34A"
                    fontSize="9"
                    fontFamily="monospace"
                    opacity="0.6"
                  >
                    ✓
                  </text>
                )}
              </g>
            );
          })}

          {/* Robot marker — on top of everything */}
          <RobotMarker x={robot.position.x} y={robot.position.y} moving={isMoving} />

          {/* North indicator — industrial map convention */}
          <g transform={`translate(${MAP_DIMENSIONS.width - 28}, 22)`}>
            <line x1="0" y1="8" x2="0" y2="-8" stroke="#333C44" strokeWidth="1" />
            <polygon points="0,-10 -3,-4 3,-4" fill="#7D8790" />
            <text x="0" y="18" textAnchor="middle" fill="#4A5258" fontSize="7" fontFamily="monospace">N</text>
          </g>
        </svg>

        {/* Legend — compact, bottom right */}
        <div className="absolute bottom-2 right-2 flex items-center gap-3 px-2.5 py-1.5 bg-base-surface border border-line" style={{ borderRadius: 2 }}>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-green" style={{ borderRadius: 1 }} />
            <span className="text-2xs mono text-ink-faint">ROVER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: '#333C44' }} />
            <span className="text-2xs mono text-ink-faint">ROUTE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
