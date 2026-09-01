import { Thermometer, Droplets, AudioLines, Bot, TrendingUp, TrendingDown } from 'lucide-react';
import { useSimulation, usePreviousValue } from '@/hooks/useSimulation';
import type { SensorHistoryPoint } from '@/types';
import { useMemo } from 'react';

interface SensorCardProps {
  history: SensorHistoryPoint[];
}

function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Delta({ value, unit }: { value: number; unit: string }) {
  if (Math.abs(value) < 0.05) return <span className="text-2xs mono text-ink-faint">— {unit}</span>;
  const positive = value > 0;
  return (
    <span className={`text-2xs mono flex items-center gap-0.5 ${positive ? 'text-amber' : 'text-green'}`}>
      {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {positive ? '+' : ''}{value.toFixed(1)}{unit}
    </span>
  );
}

export function SensorCards({ history }: SensorCardProps) {
  const sim = useSimulation();
  const robot = sim.getRobot();
  const currentSensors = sim.getCurrentRoomSensors();

  const tempHistory = useMemo(() => history.slice(-20).map((h) => h.temperature), [history]);
  const humidityHistory = useMemo(() => history.slice(-20).map((h) => h.humidity), [history]);
  const soundHistory = useMemo(() => history.slice(-20).map((h) => h.sound), [history]);

  // Calculate deltas from ~1 hour ago (60 points at 1 min intervals — but our history is 2s intervals, so ~30 points for 1 min)
  const tempDelta = history.length > 30 ? currentSensors.temperature - history[history.length - 30].temperature : 0;
  const humidityDelta = history.length > 30 ? currentSensors.humidity - history[history.length - 30].humidity : 0;
  const soundDelta = history.length > 30 ? currentSensors.sound - history[history.length - 30].sound : 0;

  const prevTemp = usePreviousValue(currentSensors.temperature);

  const soundStatus = currentSensors.soundLevel;
  const soundColor = soundStatus === 'NORMAL' ? 'text-green' : soundStatus === 'LOUD' ? 'text-amber' : 'text-red';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Temperature */}
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="label-text flex items-center gap-1.5">
            <Thermometer className="w-3 h-3 text-amber" /> TEMPERATURE
          </span>
          <Delta value={tempDelta} unit="°C" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span
              className="text-2xl font-semibold mono text-ink tabular-nums transition-all duration-300"
              key={currentSensors.temperature}
              style={{ opacity: prevTemp !== currentSensors.temperature ? 0.8 : 1 }}
            >
              {currentSensors.temperature.toFixed(1)}
            </span>
            <span className="text-sm text-ink-muted ml-1 mono">°C</span>
            <p className="text-2xs text-ink-faint mt-0.5">Current room sensor</p>
          </div>
          <Sparkline data={tempHistory} color="#F5B942" />
        </div>
      </div>

      {/* Humidity */}
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="label-text flex items-center gap-1.5">
            <Droplets className="w-3 h-3 text-green" /> HUMIDITY
          </span>
          <Delta value={humidityDelta} unit="%" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-semibold mono text-ink tabular-nums">
              {Math.round(currentSensors.humidity)}
            </span>
            <span className="text-sm text-ink-muted ml-1 mono">%</span>
            <p className="text-2xs text-ink-faint mt-0.5">Relative humidity</p>
          </div>
          <Sparkline data={humidityHistory} color="#B8F34A" />
        </div>
      </div>

      {/* Sound */}
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="label-text flex items-center gap-1.5">
            <AudioLines className="w-3 h-3 text-ink-muted" /> SOUND
          </span>
          <Delta value={soundDelta} unit="dB" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-lg font-semibold mono ${soundColor}`}>{soundStatus}</span>
            <p className="text-2xs mono text-ink-muted mt-0.5">{Math.round(currentSensors.sound)} dB · Current level</p>
          </div>
          <Sparkline data={soundHistory} color={soundStatus === 'NORMAL' ? '#7D8790' : soundStatus === 'LOUD' ? '#F5B942' : '#FF4D4D'} />
        </div>
      </div>

      {/* Robot */}
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="label-text flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-green" /> ROBOT
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-green" />
        </div>
        <div>
          <span className="text-lg font-semibold mono text-green">{robot.state}</span>
          {robot.targetRoom !== null ? (
            <p className="text-2xs mono text-ink-muted mt-0.5">
              ROOM {String(robot.currentRoom).padStart(2, '0')} → ROOM {String(robot.targetRoom).padStart(2, '0')}
            </p>
          ) : (
            <p className="text-2xs mono text-ink-muted mt-0.5">AT ROOM {String(robot.currentRoom).padStart(2, '0')}</p>
          )}
          {robot.etaSeconds > 0 && <p className="text-2xs mono text-ink-faint">ETA: {robot.etaSeconds} sec</p>}
        </div>
      </div>
    </div>
  );
}
