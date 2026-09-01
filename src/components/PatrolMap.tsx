import { useMemo } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { MAP_DIMENSIONS, ROOM_NAMES } from '@/config';
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

// Technical rover marker — directional, physical-looking
function RoverMarker({ x, y, moving, state }: {
  x: number; y: number; moving: boolean; state: string;
}) {
  const color = state === 'IDLE' ? '#F2B84B' : '#A8F04D';

  return (
    <g>
      {/* Outer targeting ring — position indicator */}
      <circle cx={x} cy={y} r="16" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" strokeDasharray="3 3" />

      {/* Moving pulse ring */}
      {moving && (
        <circle cx={x} cy={y} r="20" fill="none" stroke={color} strokeWidth="0.75" opacity="0.15">
          <animate attributeName="r" values="14;24;14" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Rover body — small tracked vehicle silhouette */}
      {/* Main chassis */}
      <rect x={x - 8} y={y - 5} width={16} height={10} rx="1" fill={color} opacity="0.9" />
      {/* Front sensor bump */}
      <rect x={x + 6} y={y - 2} width={4} height={4} rx="0.5" fill={color} opacity="0.7" />
      {/* Left track */}
      <rect x={x - 9} y={y - 7} width={4} height={14} rx="2" fill={color} opacity="0.5" />
      {/* Right track */}
      <rect x={x + 5} y={y - 7} width={4} height={14} rx="2" fill={color} opacity="0.5" />
      {/* Inner cross-hatch detail */}
      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#06090B" strokeWidth="1" opacity="0.6" />
      <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#06090B" strokeWidth="1" opacity="0.6" />

      {/* Crosshair lines — precise positioning */}
      <line x1={x} y1={y - 22} x2={x} y2={y - 14} stroke={color} strokeWidth="0.75" opacity="0.3" />
      <line x1={x} y1={y + 14} x2={x} y2={y + 22} stroke={color} strokeWidth="0.75" opacity="0.3" />
      <line x1={x - 22} y1={y} x2={x - 14} y2={y} stroke={color} strokeWidth="0.75" opacity="0.3" />
      <line x1={x + 14} y1={y} x2={x + 22} y2={y} stroke={color} strokeWidth="0.75" opacity="0.3" />
    </g>
  );
}

export function PatrolMap({ selectedRoom, onSelectRoom }: PatrolMapProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();
  const robot = sim.getRobot();
  const patrol = sim.getPatrol();

  const routeLines = useMemo(() => {
    const lines: {
      x1: number; y1: number; x2: number; y2: number;
      completed: boolean; active: boolean;
    }[] = [];
    const order = patrol.rooms;
    for (let i = 0; i < order.length - 1; i++) {
      const a = rooms.find((r) => r.id === order[i]);
      const b = rooms.find((r) => r.id === order[i + 1]);
      if (a && b) {
        const ca = roomCenter(a.position);
        const cb = roomCenter(b.position);
        const aComp = patrol.completedRooms.includes(order[i]);
        const bComp = patrol.completedRooms.includes(order[i + 1]);
        // Active leg: rover is currently on this leg
        const isActive = robot.currentRoom === order[i] && robot.targetRoom === order[i + 1];
        lines.push({
          x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y,
          completed: aComp && bComp,
          active: isActive,
        });
      }
    }
    return lines;
  }, [rooms, patrol.rooms, patrol.completedRooms, robot.currentRoom, robot.targetRoom]);

  const isMoving = robot.state === 'MOVING';
  const progress = Math.round(patrol.progress);

  return (
    <div className="panel relative overflow-hidden" style={{ borderTop: '2px solid #A8F04D' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-base-elevated">
        <div className="flex items-center gap-3">
          <span className="section-title text-green">LIVE PATROL MAP</span>
          <div className="flex items-center gap-1">
            <span className="status-dot bg-green animate-pulse-green" />
            <span className="text-3xs mono text-green">LIVE</span>
          </div>
        </div>

        {/* Status metadata */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-3xs label-text">CURRENT</span>
            <span className="text-2xs mono text-cyan">{formatRoom(robot.currentRoom)}</span>
          </div>
          {robot.targetRoom !== null && (
            <div className="flex flex-col items-end">
              <span className="text-3xs label-text">NEXT</span>
              <span className="text-2xs mono text-ink">{formatRoom(robot.targetRoom)}</span>
            </div>
          )}
          {isMoving && robot.etaSeconds > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-3xs label-text">ETA</span>
              <span className="text-2xs mono text-green tabular-nums">
                {String(Math.floor(robot.etaSeconds / 60)).padStart(2,'0')}:{String(robot.etaSeconds % 60).padStart(2,'0')}
              </span>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-3xs label-text">PROGRESS</span>
            <span className="text-2xs mono text-ink tabular-nums">{progress}%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xs label-text">STATUS</span>
            <span className={`text-2xs mono font-semibold tracking-wider ${
              robot.state === 'PATROLLING' || robot.state === 'MOVING' ? 'text-green' :
              robot.state === 'IDLE' ? 'text-amber' : 'text-ink-faint'
            }`}>{patrol.status.replace('_',' ')}</span>
          </div>
        </div>
      </div>

      {/* Progress bar — thin strip below header */}
      <div className="h-px bg-base-elevated">
        <div
          className="h-full bg-green transition-all duration-700"
          style={{ width: `${progress}%`, opacity: 0.6 }}
        />
      </div>

      {/* SVG floor plan */}
      <div className="relative bg-base">
        <svg
          viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
          className="w-full h-auto"
          style={{ maxHeight: 380 }}
        >
          <defs>
            {/* Engineering blueprint dot grid */}
            <pattern id="mapdotgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.6" fill="#1C292D" />
            </pattern>
            {/* Subtle scan overlay */}
            <linearGradient id="scanOverlay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#A8F04D" stopOpacity="0.015" />
              <stop offset="50%"  stopColor="#A8F04D" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#A8F04D" stopOpacity="0.015" />
            </linearGradient>
          </defs>

          {/* Background + grid */}
          <rect width={MAP_DIMENSIONS.width} height={MAP_DIMENSIONS.height} fill="#06090B" />
          <rect width={MAP_DIMENSIONS.width} height={MAP_DIMENSIONS.height} fill="url(#mapdotgrid)" />
          <rect width={MAP_DIMENSIONS.width} height={MAP_DIMENSIONS.height} fill="url(#scanOverlay)" />

          {/* Major grid lines — blueprint feel */}
          {[130, 260, 390, 520, 650].map(x => (
            <line key={`vg-${x}`} x1={x} y1={0} x2={x} y2={MAP_DIMENSIONS.height}
              stroke="#1C292D" strokeWidth="0.5" opacity="0.5" />
          ))}
          {[130, 260].map(y => (
            <line key={`hg-${y}`} x1={0} y1={y} x2={MAP_DIMENSIONS.width} y2={y}
              stroke="#1C292D" strokeWidth="0.5" opacity="0.5" />
          ))}

          {/* Coordinate labels — engineering blueprint */}
          {[0, 1, 2, 3].map(i => (
            <text key={`cx-${i}`}
              x={i * 185 + 92} y={MAP_DIMENSIONS.height - 4}
              textAnchor="middle" fill="#1C292D"
              fontSize="7" fontFamily="monospace"
            >
              {String(i * 185 + 92).padStart(3,'0')}
            </text>
          ))}
          {[0, 1, 2].map(i => (
            <text key={`cy-${i}`}
              x={6} y={i * 130 + 65}
              textAnchor="middle" fill="#1C292D"
              fontSize="7" fontFamily="monospace"
            >
              {String(i * 130 + 65).padStart(3,'0')}
            </text>
          ))}

          {/* Patrol route lines — drawn under rooms */}
          {routeLines.map((line, i) => (
            <g key={i}>
              {/* Glow trace for completed */}
              {line.completed && (
                <line
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke="#A8F04D" strokeWidth="4" opacity="0.06"
                />
              )}
              <line
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke={line.active ? '#A8F04D' : line.completed ? '#A8F04D' : '#263540'}
                strokeWidth={line.active ? '2' : line.completed ? '1.5' : '1'}
                strokeDasharray={line.completed || line.active ? 'none' : '6 4'}
                opacity={line.active ? 1 : line.completed ? 0.5 : 0.6}
              />
            </g>
          ))}

          {/* Waypoint markers on route */}
          {patrol.rooms.map((roomId) => {
            const room = rooms.find((r) => r.id === roomId);
            if (!room) return null;
            const c = roomCenter(room.position);
            const done = patrol.completedRooms.includes(roomId);
            return (
              <circle key={`wp-${roomId}`}
                cx={c.x} cy={c.y} r="3"
                fill={done ? '#A8F04D' : '#1C292D'}
                stroke={done ? '#A8F04D' : '#263540'}
                strokeWidth="1"
                opacity="0.7"
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
            const { x, y, width, height } = room.position;

            const fill = isSelected ? `${stroke}20` :
                         isCurrent  ? `${stroke}12` :
                         hasIssue   ? `${stroke}08` : '#0B1114';

            return (
              <g key={room.id} onClick={() => onSelectRoom(room.id)} style={{ cursor: 'pointer' }}>
                {/* Room body */}
                <rect
                  x={x} y={y} width={width} height={height}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCurrent || isSelected ? 1.5 : hasIssue ? 1.5 : 1}
                />

                {/* Issue accent bar across top */}
                {hasIssue && (
                  <rect x={x} y={y} width={width} height={2} fill={stroke} opacity="0.8" />
                )}

                {/* Current room: corner brackets */}
                {isCurrent && (
                  <>
                    <line x1={x} y1={y} x2={x+10} y2={y} stroke={stroke} strokeWidth="1.5" />
                    <line x1={x} y1={y} x2={x} y2={y+10} stroke={stroke} strokeWidth="1.5" />
                    <line x1={x+width} y1={y+height} x2={x+width-10} y2={y+height} stroke={stroke} strokeWidth="1.5" />
                    <line x1={x+width} y1={y+height} x2={x+width} y2={y+height-10} stroke={stroke} strokeWidth="1.5" />
                  </>
                )}

                {/* Room label */}
                <text x={x+10} y={y+20}
                  fill="#E6ECEE" fontSize="11"
                  fontFamily="'JetBrains Mono', monospace" fontWeight="700"
                  letterSpacing="0.06em"
                >
                  {formatRoom(room.id)}
                </text>

                {/* Room name */}
                <text x={x+10} y={y+33}
                  fill="#3D4F55" fontSize="8"
                  fontFamily="Inter, sans-serif"
                >
                  {room.name}
                </text>

                {/* Safety state */}
                <text
                  x={x+10} y={y+height-30}
                  fill={stroke} fontSize="7.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="700" letterSpacing="0.12em"
                >
                  {room.safety === 'safe' ? '◆ SAFE' : room.safety === 'warning' ? '▲ ATTENTION' : '▲ CRITICAL'}
                </text>

                {/* Sensor readout */}
                <text
                  x={x+10} y={y+height-16}
                  fill={hasIssue ? stroke : '#3D4F55'} fontSize="8.5"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {room.sensors.temperature.toFixed(1)}°  {Math.round(room.sensors.humidity)}%  {Math.round(room.sensors.sound)}dB
                </text>

                {/* Completed checkmark */}
                {isCompleted && !isCurrent && (
                  <text x={x+width-12} y={y+18}
                    textAnchor="middle" fill="#A8F04D"
                    fontSize="10" fontFamily="monospace" opacity="0.55"
                  >
                    ✓
                  </text>
                )}

                {/* Room position coordinates — technical detail */}
                <text x={x+width-8} y={y+height-6}
                  textAnchor="end" fill="#1C292D"
                  fontSize="6.5" fontFamily="monospace"
                >
                  {String(x+width/2).padStart(3,'0')},{String(y+height/2).padStart(3,'0')}
                </text>
              </g>
            );
          })}

          {/* Rover */}
          <RoverMarker
            x={robot.position.x}
            y={robot.position.y}
            moving={isMoving}
            state={robot.state}
          />

          {/* North compass */}
          <g transform={`translate(${MAP_DIMENSIONS.width - 26}, 22)`}>
            <circle cx="0" cy="0" r="10" fill="#0B1114" stroke="#1C292D" strokeWidth="1" />
            <polygon points="0,-7 -2.5,-1 2.5,-1" fill="#A8F04D" opacity="0.8" />
            <polygon points="0,7 -2.5,1 2.5,1" fill="#263540" />
            <text x="0" y="18" textAnchor="middle"
              fill="#3D4F55" fontSize="7" fontFamily="monospace" letterSpacing="0.05em"
            >N</text>
          </g>

          {/* Patrol sequence label */}
          <text x="10" y="12"
            fill="#1C292D" fontSize="7" fontFamily="monospace"
          >
            PATROL SEQ {String(patrol.id).padStart(3,'0')}
          </text>

          {/* Mission ID */}
          <text x={MAP_DIMENSIONS.width - 10} y="12"
            textAnchor="end" fill="#1C292D" fontSize="7" fontFamily="monospace"
          >
            ZONE A · FLOOR 01
          </text>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green opacity-70" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }} />
            <span className="text-3xs mono text-ink-faint">ROVER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 border-t border-green opacity-50" />
            <span className="text-3xs mono text-ink-faint">COMPLETED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 border-t border-dashed" style={{ borderColor: '#263540' }} />
            <span className="text-3xs mono text-ink-faint">PENDING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
