import { Thermometer, Droplets, AudioLines, Bot } from 'lucide-react';
import { useSimulation, usePreviousValue } from '@/hooks/useSimulation';
import type { SensorHistoryPoint } from '@/types';
import { useMemo } from 'react';

interface SensorCardProps {
  history: SensorHistoryPoint[];
}

// Sparkline trace — real telemetry visualization
function Sparkline({
  data,
  color,
  width = 72,
  height = 28,
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
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible opacity-70">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Sound waveform bars — communicates level through bar heights
function SoundWaveform({ value, max = 95 }: { value: number; max?: number }) {
  const ratio = Math.min(value / max, 1);
  const bars = 14;
  return (
    <div className="flex items-center gap-px h-7">
      {Array.from({ length: bars }).map((_, i) => {
        const env = 1 - Math.abs((i / (bars - 1)) - 0.5) * 1.2;
        const h = Math.max(2, Math.round(env * ratio * 28));
        const color = ratio > 0.85 ? '#FF4D4D' : ratio > 0.6 ? '#F2B84B' : '#A8F04D';
        return (
          <div
            key={i}
            className="w-1 animate-waveform"
            style={{
              height: `${h}px`,
              backgroundColor: color,
              opacity: 0.8,
              animationDelay: `${i * 0.06}s`,
            }}
          />
        );
      })}
    </div>
  );
}

// Delta indicator — trend direction
function Trend({ value, unit }: { value: number; unit: string }) {
  if (Math.abs(value) < 0.05)
    return <span className="text-3xs mono text-ink-faint">—</span>;
  const up = value > 0;
  return (
    <span className={`text-3xs mono ${up ? 'text-amber' : 'text-green'}`}>
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(1)}
      {unit}
    </span>
  );
}

export function SensorCards({ history }: SensorCardProps) {
  const sim = useSimulation();
  const robot = sim.getRobot();
  const sensors = sim.getCurrentRoomSensors();

  const tempHistory = useMemo(
    () => history.slice(-24).map((h) => h.temperature),
    [history],
  );
  const humHistory = useMemo(
    () => history.slice(-24).map((h) => h.humidity),
    [history],
  );
  const sndHistory = useMemo(
    () => history.slice(-24).map((h) => h.sound),
    [history],
  );

  const tempDelta =
    history.length > 15
      ? sensors.temperature - history[history.length - 15].temperature
      : 0;
  const humDelta =
    history.length > 15
      ? sensors.humidity - history[history.length - 15].humidity
      : 0;

  const prevTemp = usePreviousValue(sensors.temperature);
  const soundColor =
    sensors.soundLevel === 'NORMAL'
      ? 'text-green'
      : sensors.soundLevel === 'LOUD'
      ? 'text-amber'
      : 'text-red';

  return (
    <div className="panel" style={{ borderTop: '2px solid #263540' }}>
      {/* Header */}
      <div className="panel-header bg-base-elevated">
        <span className="section-title">LIVE TELEMETRY</span>
        <span className="text-3xs mono text-ink-faint">
          ROOM {String(robot.currentRoom).padStart(2, '0')} · SENSOR BUS
        </span>
      </div>

      {/* Four metrics side by side */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-line">
        {/* Temperature */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 label-text text-amber">
              <Thermometer className="w-3 h-3" /> TEMPERATURE
            </span>
            <Trend value={tempDelta} unit="°C" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span
                className="text-2xl mono font-bold text-ink tabular-nums leading-none"
                style={{
                  transition: 'opacity 0.3s',
                  opacity: prevTemp !== sensors.temperature ? 0.75 : 1,
                }}
              >
                {sensors.temperature.toFixed(1)}
              </span>
              <span className="text-xs mono text-ink-muted ml-0.5">°C</span>
            </div>
            <Sparkline data={tempHistory} color="#F2B84B" />
          </div>
          <p className="text-3xs mono text-ink-faint mt-1">LIMIT 18–30°C</p>
        </div>

        {/* Humidity */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 label-text text-cyan">
              <Droplets className="w-3 h-3" /> HUMIDITY
            </span>
            <Trend value={humDelta} unit="%" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl mono font-bold text-ink tabular-nums leading-none">
                {Math.round(sensors.humidity)}
              </span>
              <span className="text-xs mono text-ink-muted ml-0.5">%</span>
            </div>
            <Sparkline data={humHistory} color="#55D6E8" />
          </div>
          <p className="text-3xs mono text-ink-faint mt-1">LIMIT &lt;75%</p>
        </div>

        {/* Sound */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 label-text">
              <AudioLines className="w-3 h-3" /> SOUND LEVEL
            </span>
            <span className={`text-3xs mono font-semibold ${soundColor}`}>
              {sensors.soundLevel}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-2xl mono font-bold tabular-nums leading-none ${soundColor}`}>
                {Math.round(sensors.sound)}
              </span>
              <span className="text-xs mono text-ink-muted ml-0.5">dB</span>
            </div>
            <SoundWaveform value={sensors.sound} />
          </div>
          <p className="text-3xs mono text-ink-faint mt-1">LIMIT &lt;70 dB</p>
        </div>

        {/* Robot state */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 label-text text-green">
              <Bot className="w-3 h-3" /> ROBOT STATE
            </span>
            <span className="status-dot bg-green animate-pulse-green" />
          </div>
          <div>
            <span
              className={`text-lg mono font-bold leading-none ${
                robot.state === 'PATROLLING' || robot.state === 'MOVING'
                  ? 'text-green'
                  : robot.state === 'IDLE'
                  ? 'text-amber'
                  : 'text-ink-faint'
              }`}
            >
              {robot.state}
            </span>
          </div>
          {robot.targetRoom !== null ? (
            <p className="text-2xs mono text-ink-muted mt-1.5">
              ROOM {String(robot.currentRoom).padStart(2, '0')} → ROOM{' '}
              {String(robot.targetRoom).padStart(2, '0')}
            </p>
          ) : (
            <p className="text-2xs mono text-ink-faint mt-1.5">
              AT ROOM {String(robot.currentRoom).padStart(2, '0')}
            </p>
          )}
          {robot.etaSeconds > 0 && (
            <p className="text-3xs mono text-cyan mt-0.5">ETA {robot.etaSeconds}s</p>
          )}
        </div>
      </div>
    </div>
  );
}
