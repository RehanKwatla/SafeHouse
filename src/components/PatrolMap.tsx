import { useMemo, useState, useCallback, useRef } from 'react';
import { RotateCcw, Crosshair, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { formatRoom } from '@/utils/style';

interface PatrolMapProps {
  selectedRoom: number | null;
  onSelectRoom: (roomId: number) => void;
}

// Room Blueprint Definitions in Map Space — perfectly centered with ample margins
const BLUEPRINT_ROOMS = [
  { id: 1, name: 'ROOM 01', type: 'SERVER ROOM', x: 45, y: 50, w: 110, h: 88, wp: 'W01' },
  { id: 2, name: 'ROOM 02', type: 'STORAGE AREA', x: 230, y: 50, w: 110, h: 88, wp: 'W02' },
  { id: 3, name: 'ROOM 03', type: 'MAIN HALL', x: 415, y: 50, w: 110, h: 88, wp: 'W03' },
  { id: 4, name: 'ROOM 04', type: 'WORKSHOP', x: 230, y: 185, w: 110, h: 88, wp: 'W04' },
];

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

  // Compute active robot position on the blueprint map
  const robotMapCoords = useMemo(() => {
    const currentRoomDef = BLUEPRINT_ROOMS.find((r) => r.id === robot.currentRoom) || BLUEPRINT_ROOMS[1];
    const targetRoomDef = BLUEPRINT_ROOMS.find((r) => r.id === robot.targetRoom);

    if (robot.state === 'MOVING' && targetRoomDef) {
      const c1x = currentRoomDef.x + currentRoomDef.w / 2;
      const c1y = currentRoomDef.y + currentRoomDef.h / 2;
      const c2x = targetRoomDef.x + targetRoomDef.w / 2;
      const c2y = targetRoomDef.y + targetRoomDef.h / 2;
      const frac = 0.5;
      return { x: c1x + (c2x - c1x) * frac, y: c1y + (c2y - c1y) * frac };
    }

    return {
      x: currentRoomDef.x + currentRoomDef.w / 2,
      y: currentRoomDef.y + currentRoomDef.h / 2 + 10,
    };
  }, [robot.currentRoom, robot.targetRoom, robot.state]);

  const handleFitView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleCenterRover = useCallback(() => {
    setPan({ x: -robotMapCoords.x + 285, y: -robotMapCoords.y + 155 });
    setZoom(1.2);
  }, [robotMapCoords]);

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom((z) => Math.min(Math.max(z + delta, 0.7), 1.6));
  }, []);

  const vbW = 570;
  const vbH = 310;
  const cx = vbW / 2 + pan.x;
  const cy = vbH / 2 + pan.y;
  const halfW = vbW / (2 * zoom);
  const halfH = vbH / (2 * zoom);

  return (
    <div className="hud-panel relative overflow-hidden flex flex-col h-full select-none">
      {/* Header bar */}
      <div className="hud-header">
        <div className="flex items-center gap-2">
          <span className="hud-section-title">LIVE PATROL MAP</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            DIGITAL FACILITY TWIN · 1:100 SCALE
          </span>
        </div>
      </div>

      {/* Map Control Buttons: Fit, Center, Zoom In/Out, Reset */}
      <div className="absolute top-10 right-2.5 flex flex-col gap-1 z-10">
        <button
          onClick={handleFitView}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-cyan hover:border-cyan hover:bg-cyan/10 transition-colors cursor-pointer"
          title="Fit View"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.7))}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <div className="h-px bg-line my-0.5" />
        <button
          onClick={handleCenterRover}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-green hover:border-green hover:bg-green/10 transition-colors cursor-pointer"
          title="Center on Rover"
        >
          <Crosshair className="w-3 h-3" />
        </button>
        <button
          onClick={handleReset}
          className="w-6 h-6 flex items-center justify-center bg-base-elevated border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Main SVG Blueprint Canvas */}
      <div
        className="relative bg-[#03080A] flex-1 min-h-[320px]"
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          viewBox={`${cx - halfW} ${cy - halfH} ${vbW / zoom} ${vbH / zoom}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Technical grid pattern */}
            <pattern id="blueprintGrid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#08181C" strokeWidth="0.5" />
            </pattern>
            {/* Ultrasonic Sonar Gradient */}
            <radialGradient id="ultrasonicSonar" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#9CFF32" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#9CFF32" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#9CFF32" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect x={cx - halfW} y={cy - halfH} width={vbW / zoom} height={vbH / zoom} fill="#03080A" />
          <rect x={cx - halfW} y={cy - halfH} width={vbW / zoom} height={vbH / zoom} fill="url(#blueprintGrid)" />

          {/* Facility Outer Perimeter */}
          <rect
            x="25"
            y="25"
            width="520"
            height="260"
            fill="none"
            stroke="#0C262C"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />

          {/* 1. Patrol Routes / Corridors */}
          {/* Room 01 to Room 02 */}
          <line
            x1="155"
            y1="94"
            x2="230"
            y2="94"
            stroke="#9CFF32"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            opacity={0.85}
          />
          {/* Room 02 to Room 03 */}
          <line
            x1="340"
            y1="94"
            x2="415"
            y2="94"
            stroke="#35D9E8"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            opacity={0.85}
          />
          {/* Room 02 to Room 04 */}
          <line
            x1="285"
            y1="138"
            x2="285"
            y2="185"
            stroke="#35D9E8"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            opacity={0.85}
          />

          {/* 2. Blueprint Rooms */}
          {BLUEPRINT_ROOMS.map((br) => {
            const roomData = rooms.find((r) => r.id === br.id);
            const isRobotHere = robot.currentRoom === br.id;
            const isSelected = selectedRoom === br.id;
            const hasAttention = roomData?.safety === 'warning';
            const hasAlert = roomData?.safety === 'critical';

            const borderColor = isRobotHere || isSelected
              ? '#9CFF32'
              : hasAlert
              ? '#FF3B30'
              : hasAttention
              ? '#F2B84B'
              : '#16363E';

            const roomBg = isRobotHere
              ? 'rgba(156, 255, 50, 0.06)'
              : isSelected
              ? 'rgba(53, 217, 232, 0.08)'
              : '#050D10';

            return (
              <g
                key={br.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRoom(br.id);
                }}
                className="cursor-pointer transition-all"
              >
                {/* Room Floor Surface */}
                <rect
                  x={br.x}
                  y={br.y}
                  width={br.w}
                  height={br.h}
                  fill={roomBg}
                  stroke={borderColor}
                  strokeWidth={isRobotHere || isSelected ? 1.6 : 1}
                  className={isRobotHere ? 'filter drop-shadow-[0_0_8px_rgba(156,255,50,0.3)]' : ''}
                />

                {/* Inner Wall Thickness Stroke */}
                <rect
                  x={br.x + 3}
                  y={br.y + 3}
                  width={br.w - 6}
                  height={br.h - 6}
                  fill="none"
                  stroke={borderColor}
                  strokeWidth="0.4"
                  strokeDasharray="2 3"
                  opacity={0.5}
                />

                {/* Waypoint Badge (W01, W02, W03, W04) */}
                <rect
                  x={br.x + 6}
                  y={br.y + 6}
                  width="22"
                  height="11"
                  fill="#0A181C"
                  stroke={borderColor}
                  strokeWidth="0.5"
                  rx="1"
                />
                <text
                  x={br.x + 17}
                  y={br.y + 14.5}
                  textAnchor="middle"
                  fill={borderColor}
                  fontSize="6.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="bold"
                >
                  {br.wp}
                </text>

                {/* Room Title */}
                <text
                  x={br.x + br.w / 2}
                  y={br.y + (isRobotHere ? 26 : br.h / 2 + 3)}
                  textAnchor="middle"
                  fill={isRobotHere ? '#9CFF32' : hasAlert ? '#FF3B30' : hasAttention ? '#F2B84B' : '#DDE8E8'}
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                >
                  {br.name}
                </text>

                {/* Room Type Subtext */}
                {!isRobotHere && (
                  <text
                    x={br.x + br.w / 2}
                    y={br.y + br.h / 2 + 15}
                    textAnchor="middle"
                    fill="#718385"
                    fontSize="7"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {br.type}
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Rover Icon & Ultrasonic Sonar Arc */}
          <g transform={`translate(${robotMapCoords.x}, ${robotMapCoords.y})`}>
            {/* Ultrasonic Radar Scan Cone */}
            <path
              d="M -26,-4 C -26,-28 26,-28 26,-4 Z"
              fill="url(#ultrasonicSonar)"
              stroke="#9CFF32"
              strokeWidth="0.8"
              opacity="0.8"
            />
            <path
              d="M -18,-4 C -18,-20 18,-20 18,-4"
              fill="none"
              stroke="#9CFF32"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />

            {/* Rover Body Graphic */}
            <g transform="translate(-12, -7)">
              <rect x="2" y="2" width="20" height="10" rx="2" fill="#040A0C" stroke="#9CFF32" strokeWidth="1.2" />
              <circle cx="4" cy="12" r="3" fill="#0B1619" stroke="#9CFF32" strokeWidth="1" />
              <circle cx="20" cy="12" r="3" fill="#0B1619" stroke="#9CFF32" strokeWidth="1" />
              <circle cx="12" cy="2" r="2" fill="#9CFF32" />
            </g>
          </g>

          {/* 4. Top-Right Compass (N) */}
          <g transform="translate(520, 48)">
            <circle cx="0" cy="0" r="10" fill="#060E10" stroke="#1F4046" strokeWidth="0.8" />
            <text x="0" y="3" textAnchor="middle" fill="#718385" fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              N
            </text>
            <polygon points="0,-9 -2,-4 2,-4" fill="#9CFF32" />
            <polygon points="0,9 -2,4 2,4" fill="#1F4046" />
          </g>

          {/* 5. Map Legend (Bottom-Left) */}
          <g transform="translate(42, 255)">
            <circle cx="5" cy="5" r="3" fill="#9CFF32" />
            <text x="14" y="8" fill="#9CFF32" fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              ROBOT
            </text>
            <line x1="0" y1="18" x2="12" y2="18" stroke="#35D9E8" strokeWidth="1.4" strokeDasharray="3 2" />
            <text x="16" y="21" fill="#718385" fontSize="7" fontFamily="'JetBrains Mono', monospace">
              PATROL ROUTE
            </text>
          </g>

          {/* 6. Map Telemetry Info Overlay (Bottom-Right) */}
          <g transform="translate(415, 175)">
            <text x="0" y="0" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              PATROL STATUS
            </text>
            <text x="0" y="14" fill="#9CFF32" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              {robot.state}
            </text>

            <text x="0" y="32" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              CURRENT
            </text>
            <text x="0" y="44" fill="#DDE8E8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              {formatRoom(robot.currentRoom)}
            </text>

            <text x="0" y="59" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              NEXT
            </text>
            <text x="0" y="71" fill="#DDE8E8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              {formatRoom(robot.targetRoom || 3)}
            </text>

            <text x="0" y="86" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              ETA
            </text>
            <text x="0" y="98" fill="#DDE8E8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              00:12:{String(robot.etaSeconds).padStart(2, '0')}
            </text>

            <text x="0" y="112" fill="#718385" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">
              PROGRESS
            </text>
            <text x="65" y="112" textAnchor="end" fill="#9CFF32" fontSize="6.5" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              {progress}%
            </text>
            <line x1="0" y1="117" x2="65" y2="117" stroke="#122428" strokeWidth="2.5" />
            <line x1="0" y1="117" x2={`${(progress / 100) * 65}`} y2="117" stroke="#9CFF32" strokeWidth="2.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}
