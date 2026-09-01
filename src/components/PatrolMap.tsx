import { useMemo, useState, useCallback, useRef } from 'react';
import { RotateCcw, Crosshair, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { formatRoom } from '@/utils/style';

interface PatrolMapProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
}

// Blueprint room definitions — perfectly laid out with ample margin
const BLUEPRINT_ROOMS = [
  { id: 1, name: 'ROOM 01', type: 'SERVER ROOM',   x: 45,  y: 50, w: 110, h: 88, wp: 'W01' },
  { id: 2, name: 'ROOM 02', type: 'STORAGE AREA',  x: 230, y: 50, w: 110, h: 88, wp: 'W02' },
  { id: 3, name: 'ROOM 03', type: 'MAIN HALL',     x: 415, y: 50, w: 110, h: 88, wp: 'W03' },
  { id: 4, name: 'ROOM 04', type: 'WORKSHOP',      x: 230, y: 185, w: 110, h: 88, wp: 'W04' },
];

// Map the simulation's 2D room-center coords to blueprint pixel coords.
// Simulation rooms are defined in ROOMS_LAYOUT (x:40-700, y:30-360).
// Blueprint viewBox is 570×310. We map linearly.
const SIM_X_MIN = 40,  SIM_X_MAX = 700;
const SIM_Y_MIN = 30,  SIM_Y_MAX = 360;
const BP_X_MIN  = 45,  BP_X_MAX  = 525;   // usable x range in blueprint
const BP_Y_MIN  = 50,  BP_Y_MAX  = 275;   // usable y range in blueprint

function simToBlueprintX(sx: number): number {
  return BP_X_MIN + ((sx - SIM_X_MIN) / (SIM_X_MAX - SIM_X_MIN)) * (BP_X_MAX - BP_X_MIN);
}
function simToBlueprintY(sy: number): number {
  return BP_Y_MIN + ((sy - SIM_Y_MIN) / (SIM_Y_MAX - SIM_Y_MIN)) * (BP_Y_MAX - BP_Y_MIN);
}

export function PatrolMap({ selectedRoom, onSelectRoom }: PatrolMapProps) {
  const sim = useSimulation();
  const rooms = sim.getRooms();
  const robot = sim.getRobot();
  const patrol = sim.getPatrol();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const progress = Math.round(patrol.progress);

  // Map robot simulation position directly to blueprint coords for smooth animation
  const robotBlueprintX = simToBlueprintX(robot.position.x);
  const robotBlueprintY = simToBlueprintY(robot.position.y);

  const handleFitView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleCenterRover = useCallback(() => {
    const vbW = 570, vbH = 310;
    setPan({
      x: -(robotBlueprintX - vbW / 2),
      y: -(robotBlueprintY - vbH / 2),
    });
    setZoom(1.3);
  }, [robotBlueprintX, robotBlueprintY]);

  const handleReset = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.startPanX + (e.clientX - dragRef.current.startX) / zoom,
      y: dragRef.current.startPanY + (e.clientY - dragRef.current.startY) / zoom,
    });
  }, [zoom]);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(Math.max(z + (e.deltaY > 0 ? -0.06 : 0.06), 0.7), 1.6));
  }, []);

  const vbW = 570, vbH = 310;
  const cx = vbW / 2 + pan.x;
  const cy = vbH / 2 + pan.y;

  return (
    <div className="hud-panel relative overflow-hidden flex flex-col h-full select-none min-h-0">
      {/* Header */}
      <div className="hud-header">
        <div className="flex items-center gap-2">
          <span className="hud-section-title">LIVE PATROL MAP</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            DIGITAL FACILITY TWIN · 1:100 SCALE
          </span>
        </div>
        {/* Status summary in header */}
        <div className="flex items-center gap-3">
          <span className="text-3xs mono text-ink-muted hidden md:inline">
            {robot.state === 'MOVING'
              ? `${formatRoom(robot.currentRoom)} → ${formatRoom(robot.targetRoom ?? 0)}`
              : `AT ${formatRoom(robot.currentRoom)}`}
          </span>
          {robot.state === 'MOVING' && robot.etaSeconds > 0 && (
            <span className="text-3xs mono text-green tabular-nums">ETA {robot.etaSeconds}s</span>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-10 right-2.5 flex flex-col gap-1 z-10">
        {[
          { icon: Maximize2, action: handleFitView,                              title: 'Fit View',         cls: 'text-cyan hover:border-cyan hover:bg-cyan/10' },
          { icon: ZoomIn,    action: () => setZoom((z) => Math.min(z + 0.15, 1.6)), title: 'Zoom In',     cls: 'text-ink-muted hover:text-ink hover:border-line-strong' },
          { icon: ZoomOut,   action: () => setZoom((z) => Math.max(z - 0.15, 0.7)), title: 'Zoom Out',    cls: 'text-ink-muted hover:text-ink hover:border-line-strong' },
        ].map(({ icon: Icon, action, title, cls }) => (
          <button key={title} onClick={action}
            className={`w-6 h-6 flex items-center justify-center bg-base-elevated border border-line transition-colors cursor-pointer ${cls}`}
            title={title}
          >
            <Icon className="w-3 h-3" />
          </button>
        ))}
        <div className="h-px bg-line my-0.5" />
        <button onClick={handleCenterRover}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-green hover:border-green hover:bg-green/10 transition-colors cursor-pointer"
          title="Center on Rover"
        >
          <Crosshair className="w-3 h-3" />
        </button>
        <button onClick={handleReset}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* SVG Canvas — flex-1 fills whatever height the parent provides */}
      <div
        className="relative bg-[#03080A] flex-1 overflow-hidden"
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab', minHeight: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          viewBox={`${cx - vbW / (2 * zoom)} ${cy - vbH / (2 * zoom)} ${vbW / zoom} ${vbH / zoom}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="bpGrid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#08181C" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="sonarGrad" cx="50%" cy="100%" r="100%">
              <stop offset="0%"   stopColor="#9CFF32" stopOpacity="0.4" />
              <stop offset="60%"  stopColor="#9CFF32" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#9CFF32" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background */}
          <rect x={cx - vbW / (2*zoom)} y={cy - vbH / (2*zoom)} width={vbW/zoom} height={vbH/zoom} fill="#03080A" />
          <rect x={cx - vbW / (2*zoom)} y={cy - vbH / (2*zoom)} width={vbW/zoom} height={vbH/zoom} fill="url(#bpGrid)" />

          {/* Facility perimeter */}
          <rect x="25" y="25" width="520" height="260" fill="none" stroke="#0C262C" strokeWidth="0.8" strokeDasharray="4 4" />

          {/* Patrol route corridors */}
          {/* R01 → R02 */}
          <line x1="155" y1="94" x2="230" y2="94"
            stroke={patrol.completedRooms.includes(1) && patrol.completedRooms.includes(2) ? '#9CFF32' : '#35D9E8'}
            strokeWidth="1.6" strokeDasharray="4 3" opacity="0.85" />
          {/* R02 → R03 */}
          <line x1="340" y1="94" x2="415" y2="94"
            stroke={patrol.completedRooms.includes(2) && patrol.completedRooms.includes(3) ? '#9CFF32' : '#35D9E8'}
            strokeWidth="1.6" strokeDasharray="4 3" opacity="0.85" />
          {/* R02 → R04 */}
          <line x1="285" y1="138" x2="285" y2="185"
            stroke={patrol.completedRooms.includes(2) && patrol.completedRooms.includes(4) ? '#9CFF32' : '#35D9E8'}
            strokeWidth="1.6" strokeDasharray="4 3" opacity="0.85" />

          {/* Rooms */}
          {BLUEPRINT_ROOMS.map((br) => {
            const roomData = rooms.find((r) => r.id === br.id);
            const isRobotHere = robot.currentRoom === br.id && robot.state !== 'MOVING';
            const isSelected = selectedRoom === br.id;
            const hasAttention = roomData?.safety === 'warning';
            const hasAlert = roomData?.safety === 'critical';

            const borderColor = isRobotHere || isSelected ? '#9CFF32'
              : hasAlert ? '#FF3B30'
              : hasAttention ? '#F2B84B'
              : '#16363E';

            const roomBg = isRobotHere ? 'rgba(156,255,50,0.06)'
              : isSelected ? 'rgba(53,217,232,0.08)'
              : '#050D10';

            return (
              <g key={br.id} onClick={(e) => { e.stopPropagation(); onSelectRoom(br.id); }}
                className="cursor-pointer">
                <rect
                  x={br.x} y={br.y} width={br.w} height={br.h}
                  fill={roomBg} stroke={borderColor}
                  strokeWidth={isRobotHere || isSelected ? 1.6 : 1}
                />
                {/* Inner dashed wall */}
                <rect
                  x={br.x + 3} y={br.y + 3} width={br.w - 6} height={br.h - 6}
                  fill="none" stroke={borderColor} strokeWidth="0.4"
                  strokeDasharray="2 3" opacity={0.5}
                />
                {/* Waypoint badge */}
                <rect x={br.x + 6} y={br.y + 6} width="22" height="11"
                  fill="#0A181C" stroke={borderColor} strokeWidth="0.5" rx="1" />
                <text x={br.x + 17} y={br.y + 14.5} textAnchor="middle"
                  fill={borderColor} fontSize="6.5"
                  fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
                  {br.wp}
                </text>
                {/* Room name */}
                <text
                  x={br.x + br.w / 2}
                  y={br.y + (isRobotHere ? 38 : br.h / 2 + 3)}
                  textAnchor="middle"
                  fill={isRobotHere ? '#9CFF32' : hasAlert ? '#FF3B30' : hasAttention ? '#F2B84B' : '#DDE8E8'}
                  fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold"
                  letterSpacing="0.08em">
                  {br.name}
                </text>
                {/* Room type subtext */}
                {!isRobotHere && (
                  <text
                    x={br.x + br.w / 2} y={br.y + br.h / 2 + 15}
                    textAnchor="middle" fill="#718385" fontSize="7"
                    fontFamily="'JetBrains Mono', monospace">
                    {br.type}
                  </text>
                )}
                {/* Completed check */}
                {patrol.completedRooms.includes(br.id) && !isRobotHere && (
                  <text
                    x={br.x + br.w - 10} y={br.y + 18}
                    textAnchor="middle" fill="#9CFF32"
                    fontSize="9" fontFamily="monospace" opacity="0.6">
                    ✓
                  </text>
                )}
              </g>
            );
          })}

          {/* Rover — position driven by live robot.position mapped to blueprint space */}
          <g transform={`translate(${robotBlueprintX}, ${robotBlueprintY})`}>
            {/* Sonar cone */}
            <path d="M -26,-4 C -26,-28 26,-28 26,-4 Z"
              fill="url(#sonarGrad)" stroke="#9CFF32" strokeWidth="0.8" opacity="0.8" />
            <path d="M -18,-4 C -18,-20 18,-20 18,-4"
              fill="none" stroke="#9CFF32" strokeWidth="0.6" strokeDasharray="2 2" />
            {/* Rover body */}
            <g transform="translate(-12, -7)">
              <rect x="2" y="2" width="20" height="10" rx="2"
                fill="#040A0C" stroke="#9CFF32" strokeWidth="1.2" />
              <circle cx="4"  cy="12" r="3" fill="#0B1619" stroke="#9CFF32" strokeWidth="1" />
              <circle cx="20" cy="12" r="3" fill="#0B1619" stroke="#9CFF32" strokeWidth="1" />
              <circle cx="12" cy="2"  r="2" fill="#9CFF32" />
            </g>
            {/* Pulse ring when moving */}
            {robot.state === 'MOVING' && (
              <circle cx="0" cy="0" r="18" fill="none" stroke="#9CFF32" strokeWidth="0.8" opacity="0.3">
                <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* Compass */}
          <g transform="translate(520, 48)">
            <circle cx="0" cy="0" r="10" fill="#060E10" stroke="#1F4046" strokeWidth="0.8" />
            <text x="0" y="3" textAnchor="middle" fill="#718385" fontSize="7"
              fontFamily="'JetBrains Mono', monospace" fontWeight="bold">N</text>
            <polygon points="0,-9 -2,-4 2,-4" fill="#9CFF32" />
            <polygon points="0,9 -2,4 2,4" fill="#1F4046" />
          </g>

          {/* Legend */}
          <g transform="translate(42, 255)">
            <circle cx="5" cy="5" r="3" fill="#9CFF32" />
            <text x="14" y="8" fill="#9CFF32" fontSize="7"
              fontFamily="'JetBrains Mono', monospace" fontWeight="bold">ROBOT</text>
            <line x1="0" y1="18" x2="12" y2="18" stroke="#35D9E8" strokeWidth="1.4" strokeDasharray="3 2" />
            <text x="16" y="21" fill="#718385" fontSize="7"
              fontFamily="'JetBrains Mono', monospace">PATROL ROUTE</text>
          </g>

          {/* Status overlay — bottom-right */}
          <g transform="translate(415, 175)">
            <text x="0" y="0"  fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">PATROL STATUS</text>
            <text x="0" y="14" fill="#9CFF32" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">{robot.state}</text>

            <text x="0" y="32" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">CURRENT</text>
            <text x="0" y="44" fill="#DDE8E8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">{formatRoom(robot.currentRoom)}</text>

            {robot.targetRoom !== null && (
              <>
                <text x="0" y="59" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">NEXT</text>
                <text x="0" y="71" fill="#DDE8E8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">{formatRoom(robot.targetRoom)}</text>
              </>
            )}

            {robot.etaSeconds > 0 && (
              <>
                <text x="0" y="86" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">ETA</text>
                <text x="0" y="98" fill="#DDE8E8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
                  {String(Math.floor(robot.etaSeconds / 60)).padStart(2, '0')}:{String(robot.etaSeconds % 60).padStart(2, '0')}s
                </text>
              </>
            )}

            <text x="0" y="112" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">PROGRESS</text>
            <text x="65" y="112" textAnchor="end" fill="#9CFF32" fontSize="6.5"
              fontFamily="'JetBrains Mono', monospace" fontWeight="bold">{progress}%</text>
            <line x1="0" y1="117" x2="65" y2="117" stroke="#122428" strokeWidth="2.5" />
            <line x1="0" y1="117" x2={`${(progress / 100) * 65}`} y2="117" stroke="#9CFF32" strokeWidth="2.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}
