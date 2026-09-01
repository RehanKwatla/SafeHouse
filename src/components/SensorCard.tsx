import { useSimulation, usePreviousValue } from '@/hooks/useSimulation';
import type { SensorHistoryPoint } from '@/types';
import { useMemo } from 'react';
import { ChevronRight, ChevronsRight } from 'lucide-react';
import { WireframeRoverGraphic } from './Sidebar';

interface SensorCardProps {
  history: SensorHistoryPoint[];
}

// Glowing Mini SVG Line Chart for Telemetry Cards
function TelemetryLineChart({
  data,
  color,
  width = 110,
  height = 36,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(' ');
  const areaStr = `0,${height} ${polylineStr} ${width},${height}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon points={areaStr} fill={`url(#grad-${color})`} />
      {/* Glow line */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        opacity="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Main Line */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Frequency waveform bars for Sound Level
function AudioFrequencyBars({ value }: { value: number }) {
  const bars = 22;
  const ratio = Math.min(value / 90, 1);

  return (
    <div className="flex items-center justify-between gap-[2px] h-9 px-1">
      {Array.from({ length: bars }).map((_, i) => {
        const envelope = 1 - Math.abs(i / (bars - 1) - 0.5) * 1.3;
        const h = Math.max(3, Math.round(envelope * ratio * 34));
        const color = ratio > 0.8 ? '#FF3B30' : ratio > 0.6 ? '#F2B84B' : '#9CFF32';
        return (
          <div
            key={i}
            className="w-[3px] rounded-xs transition-all duration-300"
            style={{
              height: `${h}px`,
              backgroundColor: color,
              boxShadow: `0 0 4px ${color}66`,
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
}

export function SensorCards({ history }: SensorCardProps) {
  const sim = useSimulation();
  const robot = sim.getRobot();
  const sensors = sim.getCurrentRoomSensors();

  const tempHistory = useMemo(
    () => history.slice(-20).map((h) => h.temperature),
    [history],
  );
  const humHistory = useMemo(
    () => history.slice(-20).map((h) => h.humidity),
    [history],
  );

  const prevTemp = usePreviousValue(sensors.temperature);

  return (
    <div className="hud-panel select-none">
      {/* Header */}
      <div className="hud-header">
        <span className="hud-section-title">LIVE TELEMETRY</span>
      </div>

      {/* 4 Inset Cards Row */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. TEMPERATURE */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="hud-label-text">TEMPERATURE</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
          </div>
          <div className="mb-2">
            <span
              className="text-2xl lg:text-3xl mono font-black text-ink tabular-nums leading-none tracking-tight"
              style={{
                transition: 'opacity 0.3s',
                opacity: prevTemp !== sensors.temperature ? 0.8 : 1,
              }}
            >
              {sensors.temperature.toFixed(1)}°C
            </span>
          </div>
          <div className="my-1">
            <TelemetryLineChart data={tempHistory} color="#9CFF32" />
          </div>
          <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
            <span className="text-green font-bold">+0.3°C</span>
            <span className="text-ink-muted">VS LAST HOUR</span>
          </div>
        </div>

        {/* 2. HUMIDITY */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="hud-label-text">HUMIDITY</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
          </div>
          <div className="mb-2">
            <span className="text-2xl lg:text-3xl mono font-black text-ink tabular-nums leading-none tracking-tight">
              {Math.round(sensors.humidity)}%
            </span>
          </div>
          <div className="my-1">
            <TelemetryLineChart data={humHistory} color="#35D9E8" />
          </div>
          <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
            <span className="text-cyan font-bold">-2%</span>
            <span className="text-ink-muted">VS LAST HOUR</span>
          </div>
        </div>

        {/* 3. SOUND LEVEL */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="hud-label-text">SOUND LEVEL</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
          </div>
          <div className="mb-2">
            <span className="text-2xl lg:text-3xl mono font-black text-ink tabular-nums leading-none tracking-tight">
              {Math.round(sensors.sound)} dB
            </span>
          </div>
          <div className="my-1">
            <AudioFrequencyBars value={sensors.sound} />
          </div>
          <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
            <span className="text-green font-bold">
              {sensors.soundLevel}
            </span>
            <span className="text-ink-muted">CURRENT LEVEL</span>
          </div>
        </div>

        {/* 4. ROBOT STATE */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="hud-label-text">ROBOT STATE</span>
            <ChevronsRight className="w-3.5 h-3.5 text-green" />
          </div>
          <div className="mb-1">
            <span className="text-lg lg:text-xl mono font-black text-green leading-none tracking-wider block">
              {robot.state}
            </span>
            <span className="text-3xs mono text-cyan mt-1 block font-semibold">
              ROOM {String(robot.currentRoom).padStart(2, '0')} → ROOM {String(robot.targetRoom || 3).padStart(2, '0')}
            </span>
          </div>
          <div className="h-10 flex items-center justify-center my-0.5 opacity-80">
            <WireframeRoverGraphic className="w-24 h-10" />
          </div>
          <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
            <span className="text-ink-muted">ETA:</span>
            <span className="text-green font-bold tabular-nums">
              {robot.etaSeconds > 0 ? `${robot.etaSeconds} SEC` : '12 SEC'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
