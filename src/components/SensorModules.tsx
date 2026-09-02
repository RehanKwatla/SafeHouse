/**
 * SensorModules.tsx
 * Individual sensor monitoring cards for the new Overview layout.
 * Each module shows one sensor's live value, state, and mini-visual.
 * All data comes from simulation.getSensors() — no fake/hardcoded values.
 */

import { Wind, Activity, Flame, Radar, AlertTriangle, CheckCircle2, Thermometer, Droplets, AudioLines } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import type { AirQualityLevel, TiltState, SmokeState, ObstacleState, SafetyState } from '@/types';
import { formatTimeSec } from '@/utils/style';
import { useMemo } from 'react';
import type { SensorHistoryPoint } from '@/types';

// ─── Shared mini sparkline ────────────────────────────────────────────────────

function MiniSparkline({
  data, color, w = 80, h = 28,
}: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── GlobalSafetyStatus ───────────────────────────────────────────────────────

export function GlobalSafetyStatus({ onViewAlerts }: { onViewAlerts: () => void }) {
  const sim = useSimulation();
  const sensors = sim.getSensors();
  const activeAlerts = sim.getActiveAlerts();

  // Derive global state: smoke > any critical > any warning > safe
  let globalState: SafetyState = 'safe';
  let primaryMessage = 'ALL SYSTEMS NORMAL';
  let subMessage = 'All sensors within safe limits.';

  if (sensors.smoke) {
    globalState = 'critical';
    primaryMessage = 'SMOKE DETECTED';
    subMessage = 'Immediate attention required.';
  } else if (activeAlerts.some((a) => a.severity === 'critical')) {
    globalState = 'critical';
    const a = activeAlerts.find((x) => x.severity === 'critical')!;
    primaryMessage = 'CRITICAL ALERT';
    subMessage = a.description;
  } else if (activeAlerts.some((a) => a.severity === 'warning')) {
    globalState = 'warning';
    const a = activeAlerts.find((x) => x.severity === 'warning')!;
    primaryMessage = 'ATTENTION REQUIRED';
    subMessage = a.description;
  }

  const stateColor =
    globalState === 'critical' ? 'text-red' :
    globalState === 'warning'  ? 'text-amber' : 'text-green';

  const borderColor =
    globalState === 'critical' ? '#FF3B30' :
    globalState === 'warning'  ? '#F2B84B' : '#9CFF32';

  const glowClass =
    globalState === 'critical' ? 'hud-glow-red' :
    globalState === 'warning'  ? 'hud-glow-amber' : '';

  const symbol =
    globalState === 'critical' ? '■' :
    globalState === 'warning'  ? '▲' : '◆';

  return (
    <div
      className={`hud-panel ${glowClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4`}
      style={{ borderTop: `2px solid ${borderColor}` }}
    >
      {/* Main status */}
      <div className="flex items-center gap-4">
        <div className={`text-3xl font-black mono ${stateColor}`} aria-label="Safety state symbol">
          {symbol}
        </div>
        <div>
          <p className="hud-label-text mb-0.5">SYSTEM SAFETY STATUS</p>
          <p className={`text-base mono font-black tracking-wider ${stateColor}`}>
            {primaryMessage}
          </p>
          <p className="text-2xs mono text-ink-muted mt-0.5 max-w-xs">{subMessage}</p>
        </div>
      </div>

      {/* Right: alert count + button */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="hud-label-text mb-0.5">ACTIVE ALERTS</p>
          <p className={`text-2xl mono font-black tabular-nums ${activeAlerts.length > 0 ? 'text-red' : 'text-green'}`}>
            {activeAlerts.length}
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={onViewAlerts}
            className="btn-hud btn-hud-red text-2xs cursor-pointer"
          >
            VIEW ALERTS
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AirQualityCard ───────────────────────────────────────────────────────────

const AQI_CONFIG: Record<AirQualityLevel, { color: string; textClass: string; bg: string }> = {
  GOOD:     { color: '#9CFF32', textClass: 'text-green',     bg: 'rgba(156,255,50,0.05)' },
  MODERATE: { color: '#F2B84B', textClass: 'text-amber',     bg: 'rgba(242,184,75,0.06)' },
  POOR:     { color: '#FF7043', textClass: 'text-orange-400', bg: 'rgba(255,112,67,0.06)' },
  CRITICAL: { color: '#FF3B30', textClass: 'text-red',       bg: 'rgba(255,59,48,0.06)' },
};

export function AirQualityCard({ history }: { history: SensorHistoryPoint[] }) {
  const sim = useSimulation();
  const sensors = sim.getSensors();
  const aqi   = sensors.airQuality;
  const level = sensors.airQualityLevel;
  const cfg   = AQI_CONFIG[level];

  const aqiHistory = useMemo(
    () => history.slice(-20).map((h) => h.airQuality),
    [history],
  );

  return (
    <div
      className="hud-panel p-3 flex flex-col justify-between min-h-[160px]"
      style={{ borderTop: `2px solid ${cfg.color}`, background: cfg.bg }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Wind className={`w-4 h-4 ${cfg.textClass}`} strokeWidth={1.75} />
          <span className="hud-label-text">AIR QUALITY</span>
        </div>
        <span className={`text-2xs mono font-black tracking-widest ${cfg.textClass}`}>
          {level}
        </span>
      </div>

      <div className="my-1">
        <span className={`text-3xl mono font-black tabular-nums leading-none ${cfg.textClass}`}>
          {Math.round(aqi)}
        </span>
        <span className="text-sm mono text-ink-muted ml-1">AQI</span>
      </div>

      <div className="my-2 overflow-hidden">
        <MiniSparkline data={aqiHistory} color={cfg.color} />
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
        <span className={`font-bold ${cfg.textClass}`}>{level}</span>
        <span className="text-ink-muted">CURRENT LEVEL</span>
      </div>
    </div>
  );
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────

function ArtificialHorizon({ tiltX, tiltY }: { tiltX: number; tiltY: number }) {
  const clampedX = Math.max(-25, Math.min(25, tiltX));
  const clampedY = Math.max(-25, Math.min(25, tiltY));
  // Horizon line rotates by roll (tiltX), and shifts vertically by pitch (tiltY)
  const rotate = clampedX;
  const shift  = clampedY * 0.8; // px

  const mag   = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
  const color = mag >= 15 ? '#FF3B30' : mag >= 5 ? '#F2B84B' : '#9CFF32';

  return (
    <svg viewBox="0 0 80 56" width="80" height="56" className="overflow-visible">
      {/* Outer ring */}
      <circle cx="40" cy="28" r="26" fill="none" stroke="#1F4046" strokeWidth="1" />
      {/* Sky */}
      <clipPath id="ahClip">
        <circle cx="40" cy="28" r="25" />
      </clipPath>
      <g clipPath="url(#ahClip)">
        <rect x="15" y="3" width="50" height="50" fill="#050D10" />
        {/* Horizon */}
        <g transform={`translate(40,${28 + shift}) rotate(${rotate})`}>
          <rect x="-30" y="-12" width="60" height="12" fill="#0A2820" opacity="0.8" />
          <line x1="-28" y1="0" x2="28" y2="0" stroke={color} strokeWidth="1.5" />
          {/* Pitch marks */}
          <line x1="-8" y1="-5"  x2="8"  y2="-5"  stroke={color} strokeWidth="0.8" opacity="0.5" />
          <line x1="-6" y1="-10" x2="6"  y2="-10" stroke={color} strokeWidth="0.8" opacity="0.4" />
          <line x1="-8" y1="5"   x2="8"  y2="5"   stroke={color} strokeWidth="0.8" opacity="0.5" />
        </g>
      </g>
      {/* Fixed aircraft symbol */}
      <line x1="22" y1="28" x2="34" y2="28" stroke="#35D9E8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="46" y1="28" x2="58" y2="28" stroke="#35D9E8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="28" r="2.5" fill="#35D9E8" />
      {/* Outer ring again (on top) */}
      <circle cx="40" cy="28" r="26" fill="none" stroke="#1F4046" strokeWidth="1" />
      {/* Top tick marks */}
      {[-30,-15,0,15,30].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1  = 40 + Math.sin(rad) * 24;
        const y1  = 28 - Math.cos(rad) * 24;
        const x2  = 40 + Math.sin(rad) * 22;
        const y2  = 28 - Math.cos(rad) * 22;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1F4046" strokeWidth="1" />;
      })}
    </svg>
  );
}

export function TiltCard() {
  const sim = useSimulation();
  const sensors = sim.getSensors();
  const { tiltX, tiltY, tiltState } = sensors;
  const magnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);

  const stateColor =
    tiltState === 'UNSTABLE' ? 'text-red' :
    tiltState === 'TILTED'   ? 'text-amber' : 'text-green';

  const borderColor =
    tiltState === 'UNSTABLE' ? '#FF3B30' :
    tiltState === 'TILTED'   ? '#F2B84B' : '#9CFF32';

  return (
    <div
      className="hud-panel p-3 flex flex-col justify-between min-h-[160px]"
      style={{ borderTop: `2px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-4 h-4 ${stateColor}`} strokeWidth={1.75} />
          <span className="hud-label-text">ROVER TILT</span>
        </div>
        <span className={`text-2xs mono font-black tracking-widest ${stateColor}`}>
          {tiltState}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 my-1">
        {/* Horizon visualization */}
        <ArtificialHorizon tiltX={tiltX} tiltY={tiltY} />

        {/* Numeric values */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div>
            <p className="hud-label-text mb-0.5">ROLL</p>
            <p className={`text-lg mono font-black tabular-nums leading-none ${stateColor}`}>
              {tiltX >= 0 ? '+' : ''}{tiltX.toFixed(1)}°
            </p>
          </div>
          <div>
            <p className="hud-label-text mb-0.5">PITCH</p>
            <p className={`text-lg mono font-black tabular-nums leading-none ${stateColor}`}>
              {tiltY >= 0 ? '+' : ''}{tiltY.toFixed(1)}°
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
        <span className={`font-bold ${stateColor}`}>{magnitude.toFixed(1)}° TOTAL</span>
        <span className="text-ink-muted">ACCELEROMETER</span>
      </div>
    </div>
  );
}

// ─── SmokeCard ────────────────────────────────────────────────────────────────

export function SmokeCard() {
  const sim = useSimulation();
  const sensors = sim.getSensors();
  const smokeState: SmokeState = sensors.smoke ? 'DETECTED' : 'CLEAR';
  const activeAlerts = sim.getActiveAlerts();
  const smokeAlert = activeAlerts.find((a) => a.metric === 'smoke');

  const isDetected = smokeState === 'DETECTED';

  return (
    <div
      className={`hud-panel p-3 flex flex-col justify-between min-h-[160px] ${
        isDetected ? 'hud-glow-red' : ''
      }`}
      style={{ borderTop: `2px solid ${isDetected ? '#FF3B30' : '#9CFF32'}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Flame className={`w-4 h-4 ${isDetected ? 'text-red animate-pulse' : 'text-green'}`} strokeWidth={1.75} />
          <span className="hud-label-text">SMOKE DETECTION</span>
        </div>
        <span className={`status-dot ${isDetected ? 'bg-red animate-pulse-red' : 'bg-green'}`} />
      </div>

      {/* Central status */}
      <div className="flex-1 flex flex-col items-center justify-center py-2">
        {isDetected ? (
          <>
            <AlertTriangle className="w-8 h-8 text-red mb-2 animate-pulse" strokeWidth={2} />
            <p className="text-sm mono font-black text-red tracking-widest">SMOKE DETECTED</p>
            <p className="text-2xs mono text-red/80 mt-0.5">CRITICAL — IMMEDIATE ACTION</p>
            {smokeAlert && (
              <p className="text-3xs mono text-ink-muted mt-1">
                {formatTimeSec(smokeAlert.timestamp)}
              </p>
            )}
          </>
        ) : (
          <>
            <CheckCircle2 className="w-8 h-8 text-green mb-2" strokeWidth={1.5} />
            <p className="text-sm mono font-black text-green tracking-widest">CLEAR</p>
            <p className="text-2xs mono text-ink-muted mt-0.5">Smoke sensor normal</p>
          </>
        )}
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
        <span className={`font-bold ${isDetected ? 'text-red' : 'text-green'}`}>
          {isDetected ? 'ACTIVE ALERT' : 'SENSOR NORMAL'}
        </span>
        <span className="text-ink-muted">SMOKE DETECTOR</span>
      </div>
    </div>
  );
}

// ─── ObstacleCard ─────────────────────────────────────────────────────────────

function ObstacleSonar({ distance, state }: { distance: number; state: ObstacleState }) {
  const MAX_DIST = 4.0;
  const normDist = Math.min(distance / MAX_DIST, 1);
  const color =
    state === 'BLOCKED' ? '#FF3B30' :
    state === 'NEAR'    ? '#F2B84B' : '#9CFF32';

  // Draw concentric arcs representing sonar range
  const arcs = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 80 48" width="80" height="48" className="overflow-visible">
      {/* Arc rings */}
      {arcs.map((f, i) => {
        const r = f * 36;
        return (
          <path
            key={i}
            d={`M ${40 - r * 0.95},${40} A ${r} ${r} 0 0 1 ${40 + r * 0.95},${40}`}
            fill="none"
            stroke={normDist <= f ? color : '#0C2024'}
            strokeWidth="1.2"
            opacity={normDist <= f ? 0.8 : 0.4}
          />
        );
      })}
      {/* Obstacle dot */}
      {state !== 'CLEAR' && (
        <circle
          cx={40}
          cy={40 - normDist * 34}
          r="4"
          fill={color}
          opacity="0.9"
        />
      )}
      {/* Rover origin */}
      <polygon points="40,40 36,46 44,46" fill="#9CFF32" opacity="0.8" />
      {/* Spoke lines */}
      {[-40, -20, 0, 20, 40].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={40}
            y1={40}
            x2={40 + Math.sin(rad) * 36}
            y2={40 - Math.cos(rad) * 36}
            stroke="#0C2024"
            strokeWidth="0.6"
          />
        );
      })}
    </svg>
  );
}

export function ObstacleCard() {
  const sim = useSimulation();
  const sensors = sim.getSensors();
  const { obstacleDistance, obstacleState } = sensors;

  const stateColor =
    obstacleState === 'BLOCKED' ? 'text-red' :
    obstacleState === 'NEAR'    ? 'text-amber' : 'text-green';

  const borderColor =
    obstacleState === 'BLOCKED' ? '#FF3B30' :
    obstacleState === 'NEAR'    ? '#F2B84B' : '#9CFF32';

  return (
    <div
      className="hud-panel p-3 flex flex-col justify-between min-h-[160px]"
      style={{ borderTop: `2px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Radar className={`w-4 h-4 ${stateColor}`} strokeWidth={1.75} />
          <span className="hud-label-text">OBSTACLE SENSOR</span>
        </div>
        <span className={`text-2xs mono font-black tracking-widest ${stateColor}`}>
          {obstacleState}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 my-1">
        <ObstacleSonar distance={obstacleDistance} state={obstacleState} />
        <div className="flex-1">
          <p className="hud-label-text mb-0.5">DISTANCE</p>
          <p className={`text-2xl mono font-black tabular-nums leading-none ${stateColor}`}>
            {obstacleDistance.toFixed(2)}
            <span className="text-sm mono text-ink-muted ml-1">m</span>
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
        <span className={`font-bold ${stateColor}`}>
          {obstacleState === 'BLOCKED' ? 'PATH BLOCKED' :
           obstacleState === 'NEAR'    ? 'OBSTACLE NEAR' : 'PATH CLEAR'}
        </span>
        <span className="text-ink-muted">ULTRASONIC</span>
      </div>
    </div>
  );
}

// ─── RobotHealthCard ──────────────────────────────────────────────────────────

export function RobotHealthCard() {
  const sim = useSimulation();
  const robot = sim.getRobot();

  const batteryColor =
    robot.battery > 50 ? 'text-green' :
    robot.battery > 20 ? 'text-amber' : 'text-red';

  const connColor =
    robot.connection > 85 ? 'text-green' :
    robot.connection > 60 ? 'text-amber' : 'text-red';

  return (
    <div className="hud-panel p-3 flex flex-col justify-between min-h-[160px]"
      style={{ borderTop: '2px solid #35D9E8' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="hud-label-text text-cyan">ROBOT HEALTH</span>
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${robot.connected ? 'bg-green animate-pulse-green' : 'bg-red'}`} />
          <span className={`text-2xs mono font-bold ${robot.connected ? 'text-green' : 'text-red'}`}>
            RVR-01
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="hud-panel-inset p-2 border border-line">
          <p className="hud-label-text mb-0.5">STATE</p>
          <p className={`text-xs mono font-black tracking-wider ${
            robot.state === 'MONITORING' ? 'text-green' :
            robot.state === 'IDLE'       ? 'text-amber' : 'text-ink-muted'
          }`}>{robot.state}</p>
        </div>
        <div className="hud-panel-inset p-2 border border-line">
          <p className="hud-label-text mb-0.5">MODE</p>
          <p className="text-xs mono font-black text-cyan">{robot.mode}</p>
        </div>
        <div className="hud-panel-inset p-2 border border-line">
          <p className="hud-label-text mb-0.5">BATTERY</p>
          <p className={`text-sm mono font-black tabular-nums ${batteryColor}`}>
            {Math.round(robot.battery)}%
          </p>
        </div>
        <div className="hud-panel-inset p-2 border border-line">
          <p className="hud-label-text mb-0.5">SIGNAL</p>
          <p className={`text-sm mono font-black tabular-nums ${connColor}`}>
            {Math.round(robot.connection)}%
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between text-3xs mono">
        <span className="text-green font-bold">SYSTEM ONLINE</span>
        <span className="text-ink-muted">ESP32 CONNECTED</span>
      </div>
    </div>
  );
}

// ─── Updated SensorRow (replaces old SensorCards) ────────────────────────────
// Shows: Temperature · Humidity · Sound · Air Quality — four cards in a row

function AudioFrequencyBars({ value }: { value: number }) {
  const bars  = 20;
  const ratio = Math.min(value / 90, 1);
  return (
    <div className="flex items-center justify-between gap-[2px] h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const env   = 1 - Math.abs(i / (bars - 1) - 0.5) * 1.2;
        const h     = Math.max(2, Math.round(env * ratio * 28));
        const color =
          ratio > 0.8 ? '#FF3B30' :
          ratio > 0.6 ? '#F2B84B' : '#9CFF32';
        return (
          <div key={i}
            className="w-[3px] transition-all duration-300"
            style={{ height: `${h}px`, backgroundColor: color, borderRadius: 1, opacity: 0.85 }}
          />
        );
      })}
    </div>
  );
}

export function PrimarySensorRow({ history }: { history: SensorHistoryPoint[] }) {
  const sim     = useSimulation();
  const sensors = sim.getSensors();

  const tempHist = useMemo(() => history.slice(-20).map((h) => h.temperature), [history]);
  const humHist  = useMemo(() => history.slice(-20).map((h) => h.humidity), [history]);

  const tempOk = sensors.temperature >= 18 && sensors.temperature <= 30;
  const humOk  = sensors.humidity <= 75;

  return (
    <div className="hud-panel">
      <div className="hud-header">
        <span className="hud-section-title">LIVE TELEMETRY</span>
        <span className="text-3xs mono text-ink-muted">
          ACTIVE SENSORS · {new Date().toLocaleTimeString('en-GB')}
        </span>
      </div>

      <div className="p-3 grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Temperature */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line"
          style={{ borderTop: `2px solid ${tempOk ? '#9CFF32' : '#F2B84B'}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Thermometer className={`w-3.5 h-3.5 ${tempOk ? 'text-green' : 'text-amber'}`} strokeWidth={1.75} />
              <span className="hud-label-text">TEMPERATURE</span>
            </div>
            <span className={`text-3xs mono font-bold ${tempOk ? 'text-green' : 'text-amber'}`}>
              {tempOk ? 'NORMAL' : 'WARNING'}
            </span>
          </div>
          <p className="text-3xl mono font-black text-ink tabular-nums leading-none my-1">
            {sensors.temperature.toFixed(1)}
            <span className="text-base text-ink-muted ml-0.5">°C</span>
          </p>
          <div className="my-1 overflow-hidden">
            <MiniSparkline data={tempHist} color={tempOk ? '#9CFF32' : '#F2B84B'} />
          </div>
          <div className="pt-2 border-t border-line text-3xs mono text-ink-muted flex justify-between">
            <span>LIMIT 18–30°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line"
          style={{ borderTop: `2px solid ${humOk ? '#35D9E8' : '#F2B84B'}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Droplets className={`w-3.5 h-3.5 ${humOk ? 'text-cyan' : 'text-amber'}`} strokeWidth={1.75} />
              <span className="hud-label-text">HUMIDITY</span>
            </div>
            <span className={`text-3xs mono font-bold ${humOk ? 'text-cyan' : 'text-amber'}`}>
              {humOk ? 'NORMAL' : 'HIGH'}
            </span>
          </div>
          <p className="text-3xl mono font-black text-ink tabular-nums leading-none my-1">
            {Math.round(sensors.humidity)}
            <span className="text-base text-ink-muted ml-0.5">%</span>
          </p>
          <div className="my-1 overflow-hidden">
            <MiniSparkline data={humHist} color={humOk ? '#35D9E8' : '#F2B84B'} />
          </div>
          <div className="pt-2 border-t border-line text-3xs mono text-ink-muted flex justify-between">
            <span>LIMIT &lt;75%</span>
          </div>
        </div>

        {/* Sound */}
        <div className="hud-panel-inset p-3 flex flex-col justify-between border border-line"
          style={{ borderTop: `2px solid ${sensors.soundLevel === 'NORMAL' ? '#9CFF32' : sensors.soundLevel === 'LOUD' ? '#F2B84B' : '#FF3B30'}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <AudioLines className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
              <span className="hud-label-text">SOUND LEVEL</span>
            </div>
            <span className={`text-3xs mono font-bold ${
              sensors.soundLevel === 'NORMAL' ? 'text-green' :
              sensors.soundLevel === 'LOUD'   ? 'text-amber' : 'text-red'
            }`}>{sensors.soundLevel}</span>
          </div>
          <p className="text-3xl mono font-black text-ink tabular-nums leading-none my-1">
            {Math.round(sensors.sound)}
            <span className="text-base text-ink-muted ml-0.5">dB</span>
          </p>
          <div className="my-1">
            <AudioFrequencyBars value={sensors.sound} />
          </div>
          <div className="pt-2 border-t border-line text-3xs mono text-ink-muted flex justify-between">
            <span>LIMIT &lt;70 dB</span>
          </div>
        </div>

        {/* Air Quality (replaces old Robot State card) */}
        <AirQualityCard history={history} />

      </div>
    </div>
  );
}
