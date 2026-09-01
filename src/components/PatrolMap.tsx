import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import {
  ISO_ROOMS,
  ISO_CORRIDORS,
  isoToSvg,
  isoRoomCenter,
  robotToSvg,
} from '@/config';
import { safetyStroke, formatRoom } from '@/utils/style';
import type { SafetyState, RobotStatusData, PatrolMission, Room } from '@/types';

interface PatrolMapProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
}

// ── SVG helpers ──

function ptsStr(points: [number, number][]): string {
  return points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

function isoQuad(
  gx: number, gy: number, gw: number, gd: number, gz: number,
): [number, number][] {
  return [
    isoToSvg(gx, gy, gz),
    isoToSvg(gx + gw, gy, gz),
    isoToSvg(gx + gw, gy + gd, gz),
    isoToSvg(gx, gy + gd, gz),
  ];
}

// ── Floor Grid ──

function FloorGrid() {
  const lines: JSX.Element[] = [];
  for (let i = -1; i <= 8; i++) {
    const a = isoToSvg(i, -0.5, 0);
    const b = isoToSvg(i, 4, 0);
    lines.push(
      <line key={`v${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
        stroke="#111C20" strokeWidth="0.5" />,
    );
    const c = isoToSvg(-0.5, i, 0);
    const d = isoToSvg(7, i, 0);
    lines.push(
      <line key={`h${i}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]}
        stroke="#111C20" strokeWidth="0.5" />,
    );
  }
  return <g opacity={0.6}>{lines}</g>;
}

// ── Isometric Box ──

function IsometricBox({
  gx, gy, gw, gd, wh,
  fillColor, strokeColor, opacity = 1, strokeWidth = 1,
  showWalls = true, wallDarken = 0.3,
}: {
  gx: number; gy: number; gw: number; gd: number; wh: number;
  fillColor: string; strokeColor: string;
  opacity?: number; strokeWidth?: number;
  showWalls?: boolean; wallDarken?: number;
}) {
  const top = isoQuad(gx, gy, gw, gd, wh);
  const leftWall = [
    isoToSvg(gx, gy + gd, wh),
    isoToSvg(gx + gw, gy + gd, wh),
    isoToSvg(gx + gw, gy + gd, 0),
    isoToSvg(gx, gy + gd, 0),
  ];
  const rightWall = [
    isoToSvg(gx + gw, gy, wh),
    isoToSvg(gx + gw, gy + gd, wh),
    isoToSvg(gx + gw, gy + gd, 0),
    isoToSvg(gx + gw, gy, 0),
  ];

  // Darken colors for walls
  const darken = (color: string, amount: number) => {
    if (!color.startsWith('#') || color.length < 7) return color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const f = 1 - amount;
    return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
  };

  const wallColor = darken(strokeColor, wallDarken);

  return (
    <g opacity={opacity}>
      {/* Left wall */}
      {showWalls && (
        <polygon
          points={ptsStr(leftWall)}
          fill={wallColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.6}
          strokeLinejoin="miter"
        />
      )}
      {/* Right wall */}
      {showWalls && (
        <polygon
          points={ptsStr(rightWall)}
          fill={darken(strokeColor, wallDarken + 0.1)}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.6}
          strokeLinejoin="miter"
        />
      )}
      {/* Top face (floor) */}
      <polygon
        points={ptsStr(top)}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
      />
    </g>
  );
}

// ── Room Component ──

function FacilityRoom({
  room, isoRoom, isSelected, isCurrent, isCompleted,
  onSelect, robot,
}: {
  room: Room;
  isoRoom: typeof ISO_ROOMS[number];
  isSelected: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  onSelect: () => void;
  robot: RobotStatusData;
}) {
  const stroke = safetyStroke(room.safety);
  const hasIssue = room.safety !== 'safe';

  // Floor fill: tinted based on state and selection
  const fillBase = isSelected
    ? `${stroke}18`
    : isCurrent
    ? `${stroke}10`
    : hasIssue
    ? `${stroke}08`
    : '#0D1417';

  const floorLines: JSX.Element[] = [];
  const { gx, gy, gw, gd, wh } = isoRoom;
  // Subtle floor grid lines
  for (let i = 1; i < 4; i++) {
    const frac = i / 4;
    const a = isoToSvg(gx + frac * gw, gy, wh);
    const b = isoToSvg(gx + frac * gw, gy + gd, wh);
    floorLines.push(
      <line key={`fl${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
        stroke={stroke} strokeWidth="0.3" opacity={0.12} />,
    );
  }
  for (let i = 1; i < 3; i++) {
    const frac = i / 3;
    const a = isoToSvg(gx, gy + frac * gd, wh);
    const b = isoToSvg(gx + gw, gy + frac * gd, wh);
    floorLines.push(
      <line key={`fd${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
        stroke={stroke} strokeWidth="0.3" opacity={0.12} />,
    );
  }

  // Corner bracket accent for current room
  const cornerSize = 0.12;
  const bracketLines: JSX.Element[] = [];
  if (isCurrent) {
    // Top-left corner of floor
    const c1a = isoToSvg(gx, gy, wh);
    const c1b = isoToSvg(gx + cornerSize, gy, wh);
    const c1c = isoToSvg(gx, gy + cornerSize, wh);
    bracketLines.push(
      <line key="bt1" x1={c1a[0]} y1={c1a[1]} x2={c1b[0]} y2={c1b[1]}
        stroke={stroke} strokeWidth="1.5" />,
      <line key="bt2" x1={c1a[0]} y1={c1a[1]} x2={c1c[0]} y2={c1c[1]}
        stroke={stroke} strokeWidth="1.5" />,
    );
    // Bottom-right corner
    const c2 = isoToSvg(gx + gw, gy + gd, wh);
    const c2b = isoToSvg(gx + gw - cornerSize, gy + gd, wh);
    const c2c = isoToSvg(gx + gw, gy + gd - cornerSize, wh);
    bracketLines.push(
      <line key="bb1" x1={c2[0]} y1={c2[1]} x2={c2b[0]} y2={c2b[1]}
        stroke={stroke} strokeWidth="1.5" />,
      <line key="bb2" x1={c2[0]} y1={c2[1]} x2={c2c[0]} y2={c2c[1]}
        stroke={stroke} strokeWidth="1.5" />,
    );
  }

  // Label position (floating above room center)
  const center = isoToSvg(gx + gw / 2, gy + gd / 2, wh);
  const labelAbove = isoToSvg(gx + gw / 2, gy + gd / 2, wh + 0.9);
  const pinBase = isoToSvg(gx + gw / 2, gy + gd / 2, wh + 0.05);

  const stateLabel = room.safety === 'safe' ? 'SAFE'
    : room.safety === 'warning' ? 'ATTENTION' : 'CRITICAL';
  const stateSymbol = room.safety === 'safe' ? '◆'
    : room.safety === 'warning' ? '▲' : '▲';

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Shadow */}
      <polygon
        points={ptsStr(isoQuad(gx + 0.06, gy + 0.06, gw, gd, 0))}
        fill="#000" opacity={0.25}
      />

      {/* Box */}
      <IsometricBox
        gx={gx} gy={gy} gw={gw} gd={gd} wh={wh}
        fillColor={fillBase} strokeColor={stroke}
        strokeWidth={isCurrent || isSelected ? 1.2 : hasIssue ? 1 : 0.6}
        opacity={1}
      />

      {/* Floor detail lines */}
      {floorLines}

      {/* Current room brackets */}
      {bracketLines}

      {/* State accent bar on top face front edge */}
      {hasIssue && (
        <line
          x1={isoToSvg(gx, gy + gd, wh)[0]}
          y1={isoToSvg(gx, gy + gd, wh)[1]}
          x2={isoToSvg(gx + gw, gy + gd, wh)[0]}
          y2={isoToSvg(gx + gw, gy + gd, wh)[1]}
          stroke={stroke} strokeWidth="2" opacity={0.7}
        />
      )}

      {/* Connector pin line from room to label */}
      <line
        x1={center[0]} y1={center[1]}
        x2={pinBase[0]} y2={pinBase[1]}
        stroke={stroke} strokeWidth="0.5" opacity={0.3}
        strokeDasharray="2 2"
      />

      {/* Floating label */}
      <g>
        {/* Label background */}
        <rect
          x={labelAbove[0] - 52} y={labelAbove[1] - 28}
          width={104} height={52}
          fill="#0B1114" stroke={stroke}
          strokeWidth={isSelected ? 0.8 : 0.4}
          opacity={0.92}
        />
        {/* Room ID */}
        <text
          x={labelAbove[0]} y={labelAbove[1] - 14}
          textAnchor="middle" fill="#E6ECEE"
          fontSize="9" fontFamily="'JetBrains Mono', monospace"
          fontWeight="700" letterSpacing="0.1em"
        >
          {formatRoom(room.id)}
        </text>
        {/* Room name */}
        <text
          x={labelAbove[0]} y={labelAbove[1] - 3}
          textAnchor="middle" fill="#758287"
          fontSize="7" fontFamily="Inter, sans-serif"
          letterSpacing="0.02em"
        >
          {room.name.toUpperCase()}
        </text>
        {/* State */}
        <text
          x={labelAbove[0]} y={labelAbove[1] + 10}
          textAnchor="middle" fill={stroke}
          fontSize="7" fontFamily="'JetBrains Mono', monospace"
          fontWeight="700" letterSpacing="0.12em"
        >
          {stateSymbol} {stateLabel}
        </text>
        {/* Sensor readings */}
        <text
          x={labelAbove[0]} y={labelAbove[1] + 20}
          textAnchor="middle" fill={hasIssue ? stroke : '#3D4F55'}
          fontSize="7" fontFamily="'JetBrains Mono', monospace"
        >
          {room.sensors.temperature.toFixed(1)}° {Math.round(room.sensors.humidity)}% {Math.round(room.sensors.sound)}dB
        </text>
      </g>

      {/* Completed checkmark on floor */}
      {isCompleted && !isCurrent && (
        <text
          x={center[0]} y={center[1] + 3}
          textAnchor="middle" fill="#A8F04D"
          fontSize="10" fontFamily="monospace" opacity={0.5}
        >
          ✓
        </text>
      )}
    </g>
  );
}

// ── Robot Marker ──

function RobotMarker({
  x, y, moving, state, robot,
}: {
  x: number; y: number; moving: boolean;
  state: string; robot: RobotStatusData;
}) {
  const color = state === 'IDLE' ? '#F2B84B' : '#A8F04D';
  const isPatrolling = state === 'PATROLLING' || state === 'MOVING';

  return (
    <g>
      {/* Sensor range — subtle arc */}
      <ellipse
        cx={x} cy={y + 4}
        rx={18} ry={10}
        fill="none" stroke={color}
        strokeWidth="0.5" opacity={0.15}
        strokeDasharray="3 3"
      />
      <ellipse
        cx={x} cy={y + 4}
        rx={28} ry={16}
        fill="none" stroke={color}
        strokeWidth="0.4" opacity={0.08}
        strokeDasharray="2 4"
      />

      {/* Moving pulse */}
      {moving && (
        <ellipse
          cx={x} cy={y + 2}
          rx={14} ry={8}
          fill="none" stroke={color}
          strokeWidth="1" opacity={0.3}
        >
          <animate attributeName="rx" values="12;24;12" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="ry" values="6;14;6" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.8s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Robot body — small isometric box */}
      {/* Shadow */}
      <ellipse cx={x + 1} cy={y + 5} rx={8} ry={4} fill="#000" opacity={0.3} />
      {/* Body top */}
      <polygon
        points={`${x},${y - 3} ${x + 8},${y + 1} ${x},${y + 5} ${x - 8},${y + 1}`}
        fill={color} opacity={0.9}
      />
      {/* Body left wall */}
      <polygon
        points={`${x - 8},${y + 1} ${x},${y + 5} ${x},${y + 8} ${x - 8},${y + 4}`}
        fill={color} opacity={0.5}
      />
      {/* Body right wall */}
      <polygon
        points={`${x},${y + 5} ${x + 8},${y + 1} ${x + 8},${y + 4} ${x},${y + 8}`}
        fill={color} opacity={0.4}
      />
      {/* Cross-hatch detail */}
      <line x1={x - 3} y1={y + 1} x2={x + 3} y2={y + 1}
        stroke="#06090B" strokeWidth="0.8" opacity={0.5} />
      <line x1={x} y1={y - 1} x2={x} y2={y + 3}
        stroke="#06090B" strokeWidth="0.8" opacity={0.5} />

      {/* Direction indicator (front sensor bump) */}
      <polygon
        points={`${x + 8},${y + 1} ${x + 12},${y} ${x + 12},${y + 3} ${x + 8},${y + 4}`}
        fill={color} opacity={0.6}
      />

      {/* Crosshair */}
      <line x1={x} y1={y - 16} x2={x} y2={y - 10} stroke={color} strokeWidth="0.6" opacity={0.3} />
      <line x1={x} y1={y + 12} x2={x} y2={y + 18} stroke={color} strokeWidth="0.6" opacity={0.3} />
      <line x1={x - 16} y1={y + 1} x2={x - 10} y2={y + 1} stroke={color} strokeWidth="0.6" opacity={0.3} />
      <line x1={x + 10} y1={y + 1} x2={x + 16} y2={y + 1} stroke={color} strokeWidth="0.6" opacity={0.3} />

      {/* Robot label */}
      <text
        x={x} y={y - 18}
        textAnchor="middle" fill={color}
        fontSize="7" fontFamily="'JetBrains Mono', monospace"
        fontWeight="700" letterSpacing="0.08em"
      >
        RVR-01
      </text>
      <text
        x={x} y={y - 10}
        textAnchor="middle" fill={color}
        fontSize="6" fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.1em" opacity={0.7}
      >
        {isPatrolling ? 'PATROLLING' : state}
      </text>
    </g>
  );
}

// ── Patrol Route ──

function PatrolRoute({
  rooms, patrol, robot,
}: {
  rooms: Room[];
  patrol: PatrolMission;
  robot: RobotStatusData;
}) {
  const routeSegments = useMemo(() => {
    const segs: {
      from: [number, number];
      to: [number, number];
      completed: boolean;
      active: boolean;
      planned: boolean;
    }[] = [];

    const order = patrol.rooms;
    for (let i = 0; i < order.length - 1; i++) {
      const aCenter = isoRoomCenter(order[i]);
      const bCenter = isoRoomCenter(order[i + 1]);
      const aDone = patrol.completedRooms.includes(order[i]);
      const bDone = patrol.completedRooms.includes(order[i + 1]);
      const isActive = robot.currentRoom === order[i] && robot.targetRoom === order[i + 1];
      const isPlanned = !aDone && !isActive;

      segs.push({
        from: aCenter,
        to: bCenter,
        completed: aDone && bDone,
        active: isActive,
        planned: isPlanned,
      });
    }
    return segs;
  }, [rooms, patrol.rooms, patrol.completedRooms, robot.currentRoom, robot.targetRoom]);

  return (
    <g>
      {routeSegments.map((seg, i) => {
        if (seg.completed) {
          return (
            <g key={i}>
              <line
                x1={seg.from[0]} y1={seg.from[1]}
                x2={seg.to[0]} y2={seg.to[1]}
                stroke="#A8F04D" strokeWidth="3" opacity={0.08}
              />
              <line
                x1={seg.from[0]} y1={seg.from[1]}
                x2={seg.to[0]} y2={seg.to[1]}
                stroke="#A8F04D" strokeWidth="1.5" opacity={0.4}
              />
            </g>
          );
        }
        if (seg.active) {
          return (
            <g key={i}>
              <line
                x1={seg.from[0]} y1={seg.from[1]}
                x2={seg.to[0]} y2={seg.to[1]}
                stroke="#A8F04D" strokeWidth="2.5" opacity={0.9}
                strokeDasharray="6 3"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-18" dur="1s" repeatCount="indefinite"
                />
              </line>
              {/* Glow */}
              <line
                x1={seg.from[0]} y1={seg.from[1]}
                x2={seg.to[0]} y2={seg.to[1]}
                stroke="#A8F04D" strokeWidth="6" opacity={0.1}
              />
            </g>
          );
        }
        // Planned
        return (
          <line key={i}
            x1={seg.from[0]} y1={seg.from[1]}
            x2={seg.to[0]} y2={seg.to[1]}
            stroke="#263540" strokeWidth="1"
            strokeDasharray="4 4" opacity={0.6}
          />
        );
      })}

      {/* Waypoint dots */}
      {patrol.rooms.map((roomId) => {
        const c = isoRoomCenter(roomId);
        const done = patrol.completedRooms.includes(roomId);
        const current = robot.currentRoom === roomId && !done;
        return (
          <circle
            key={`wp-${roomId}`}
            cx={c[0]} cy={c[1]}
            r={done ? 3.5 : current ? 4 : 2.5}
            fill={done ? '#A8F04D' : current ? '#A8F04D' : '#1C292D'}
            stroke={done ? '#A8F04D' : current ? '#A8F04D' : '#263540'}
            strokeWidth="1"
            opacity={done ? 0.6 : current ? 0.9 : 0.4}
          />
        );
      })}
    </g>
  );
}

// ── Compass ──

function Compass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="0" r="11" fill="#0B1114" stroke="#1C292D" strokeWidth="0.8" />
      <polygon points="0,-8 -2.5,-1 2.5,-1" fill="#A8F04D" opacity={0.8} />
      <polygon points="0,8 -2.5,1 2.5,1" fill="#263540" />
      <text x="0" y="19" textAnchor="middle"
        fill="#3D4F55" fontSize="7" fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.05em"
      >N</text>
    </g>
  );
}

// ── Map Controls ──

function MapControls({
  onCenter, onReset, zoom, onZoom,
}: {
  onCenter: () => void;
  onReset: () => void;
  zoom: number;
  onZoom: (z: number) => void;
}) {
  const btn = 'w-7 h-7 flex items-center justify-center bg-base-elevated border border-line text-ink-faint hover:text-ink hover:border-line-strong transition-colors';
  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
      <button onClick={() => onZoom(Math.min(zoom + 0.15, 1.8))} className={btn} aria-label="Zoom in">
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onZoom(Math.max(zoom - 0.15, 0.6))} className={btn} aria-label="Zoom out">
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <div className="h-px bg-line mx-1" />
      <button onClick={onCenter} className={btn} aria-label="Center on rover">
        <Crosshair className="w-3.5 h-3.5" />
      </button>
      <button onClick={onReset} className={btn} aria-label="Reset view">
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Main Component ──

export function PatrolMap({ selectedRoom, onSelectRoom }: PatrolMapProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();
  const robot = sim.getRobot();
  const patrol = sim.getPatrol();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const isMoving = robot.state === 'MOVING';
  const progress = Math.round(patrol.progress);

  // Robot position in SVG space
  const robotSvg = useMemo(() => robotToSvg(robot.position.x, robot.position.y), [robot.position.x, robot.position.y]);

  // Center viewBox on robot
  const handleCenter = useCallback(() => {
    setPan({ x: -robotSvg[0] + 480, y: -robotSvg[1] + 220 });
    setZoom(1.1);
  }, [robotSvg]);

  const handleReset = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Mouse drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPanX: pan.x, startPanY: pan.y,
    };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({
      x: dragRef.current.startPanX + dx / zoom,
      y: dragRef.current.startPanY + dy / zoom,
    });
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(Math.max(z + delta, 0.6), 1.8));
  }, []);

  // Compute viewBox
  const vbW = 960;
  const vbH = 440;
  const cx = vbW / 2 + pan.x;
  const cy = vbH / 2 + pan.y;
  const halfW = vbW / (2 * zoom);
  const halfH = vbH / (2 * zoom);

  const isoRoomMap = useMemo(() => {
    const map = new Map<number, typeof ISO_ROOMS[number]>();
    ISO_ROOMS.forEach((r) => map.set(r.id, r));
    return map;
  }, []);

  return (
    <div className="panel relative overflow-hidden flex flex-col" style={{ borderTop: '2px solid #A8F04D' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-base-elevated shrink-0">
        <div className="flex items-center gap-3">
          <span className="section-title text-green">FACILITY MAP</span>
          <div className="flex items-center gap-1">
            <span className="status-dot bg-green animate-pulse-green" />
            <span className="text-3xs mono text-green">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-3xs label-text">PATROL</span>
            <span className="text-2xs mono text-ink tabular-nums">
              {patrol.completedRooms.length}/{patrol.rooms.length}
            </span>
          </div>
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
              <span className="text-2xs mono text-green tabular-nums">{robot.etaSeconds}s</span>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-3xs label-text">PROGRESS</span>
            <span className="text-2xs mono text-ink tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-px bg-base-elevated shrink-0">
        <div
          className="h-full bg-green transition-all duration-700"
          style={{ width: `${progress}%`, opacity: 0.6 }}
        />
      </div>

      {/* Map area */}
      <div
        className="relative bg-base flex-1 min-h-0"
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <MapControls
          onCenter={handleCenter}
          onReset={handleReset}
          zoom={zoom}
          onZoom={setZoom}
        />

        <svg
          ref={svgRef}
          viewBox={`${cx - halfW} ${cy - halfH} ${vbW / zoom} ${vbH / zoom}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="isoGridDots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="#151D21" />
            </pattern>
            <radialGradient id="robotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A8F04D" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#A8F04D" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background */}
          <rect
            x={cx - halfW} y={cy - halfH}
            width={vbW / zoom} height={vbH / zoom}
            fill="#06090B"
          />
          <rect
            x={cx - halfW} y={cy - halfH}
            width={vbW / zoom} height={vbH / zoom}
            fill="url(#isoGridDots)"
          />

          {/* Floor grid */}
          <FloorGrid />

          {/* Corridors (behind rooms) */}
          {ISO_CORRIDORS.map((c, i) => (
            <IsometricBox
              key={`corr-${i}`}
              gx={c.gx} gy={c.gy} gw={c.gw} gd={c.gd} wh={c.wh}
              fillColor="#0A1013" strokeColor="#1C292D"
              strokeWidth={0.5} opacity={0.8}
              showWalls={true} wallDarken={0.5}
            />
          ))}

          {/* Patrol route (on floor level) */}
          <g transform="translate(0, -1)">
            <PatrolRoute rooms={rooms} patrol={patrol} robot={robot} />
          </g>

          {/* Rooms — back-to-front order */}
          {rooms.map((room) => {
            const isoRoom = isoRoomMap.get(room.id)!;
            const isSelected = selectedRoom === room.id;
            const isCurrent = robot.currentRoom === room.id;
            const isCompleted = patrol.completedRooms.includes(room.id);

            return (
              <FacilityRoom
                key={room.id}
                room={room}
                isoRoom={isoRoom}
                isSelected={isSelected}
                isCurrent={isCurrent}
                isCompleted={isCompleted}
                onSelect={() => onSelectRoom(room.id)}
                robot={robot}
              />
            );
          })}

          {/* Robot glow */}
          <circle
            cx={robotSvg[0]} cy={robotSvg[1]}
            r={30} fill="url(#robotGlow)"
          />

          {/* Robot marker */}
          <RobotMarker
            x={robotSvg[0]} y={robotSvg[1]}
            moving={isMoving}
            state={robot.state}
            robot={robot}
          />

          {/* Compass */}
          <Compass x={880} y={45} />

          {/* Technical metadata — sparse */}
          <text x={cx - halfW + 8} y={cy - halfH + 14}
            fill="#1C292D" fontSize="7" fontFamily="'JetBrains Mono', monospace"
          >
            FACILITY MAP · FLOOR 01
          </text>
          <text x={cx + halfW - 8} y={cy - halfH + 14}
            textAnchor="end" fill="#1C292D" fontSize="7" fontFamily="'JetBrains Mono', monospace"
          >
            SCALE 1:100 · ZONE A
          </text>

          {/* Pose data bottom-right */}
          <text x={cx + halfW - 8} y={cy + halfH - 8}
            textAnchor="end" fill="#1C292D" fontSize="6.5" fontFamily="'JetBrains Mono', monospace"
          >
            RVR-01 · SYS_OK · NODE 04
          </text>

          {/* Legend */}
          <g transform={`translate(${cx - halfW + 8}, ${cy + halfH - 20})`}>
            <rect x="-4" y="-10" width="160" height="18" fill="#06090B" opacity={0.8} />
            <line x1="0" y1="0" x2="16" y2="0" stroke="#A8F04D" strokeWidth="1.5" opacity={0.5} />
            <text x="20" y="3" fill="#3D4F55" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              COMPLETED
            </text>
            <line x1="70" y1="0" x2="86" y2="0" stroke="#A8F04D" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="90" y="3" fill="#3D4F55" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              ACTIVE
            </text>
            <line x1="132" y1="0" x2="148" y2="0" stroke="#263540" strokeWidth="1" strokeDasharray="3 3" />
            <text x="152" y="3" fill="#3D4F55" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              PLANNED
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
