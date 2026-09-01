import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  Route,
} from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { formatTime, formatRoom } from '@/utils/style';
import { SimulationToggle } from '@/components/SimulationToggle';

type TimeRange = '1H' | '12H' | '24H';

const RANGES: { id: TimeRange; label: string }[] = [
  { id: '1H', label: '1H' },
  { id: '12H', label: '12H' },
  { id: '24H', label: '24H' },
];

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="hud-panel-inset px-2.5 py-1.5 border border-line">
      <p className="text-3xs mono text-ink-muted">{label}</p>
      <p className="text-xs mono font-black text-green">
        {payload[0].value.toFixed(1)} {unit}
      </p>
    </div>
  );
}

export function HistoryPage() {
  const sim = useSimulation();
  const allHistory = sim.getHistory();
  const records = sim.getPatrolRecords();
  const alerts = sim.getAlerts();
  const [range, setRange] = useState<TimeRange>('1H');

  const history = useMemo(() => {
    if (range === '1H') return allHistory.slice(-60);
    if (range === '12H') return allHistory.slice(-90);
    return allHistory;
  }, [allHistory, range]);

  const chartData = useMemo(
    () =>
      history.map((h) => ({
        time: h.label,
        temperature: h.temperature,
        humidity: h.humidity,
        sound: h.sound,
      })),
    [history],
  );

  return (
    <div className="space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="hud-section-title text-sm">TELEMETRY & PATROL HISTORY</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            SENSOR TREND ARCHIVES · INCIDENT LOGS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-line bg-base-surface">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1 text-2xs mono font-bold tracking-widest transition-colors cursor-pointer ${
                  range === r.id
                    ? 'bg-green/10 text-green border-r border-green'
                    : 'text-ink-muted hover:text-ink border-r border-line last:border-r-0'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <SimulationToggle />
        </div>
      </div>

      {/* Sensor Trend Charts */}
      <div className="hud-panel">
        <div className="hud-header">
          <span className="hud-section-title">SENSOR TELEMETRY CHARTS</span>
          <span className="text-3xs mono text-ink-muted">{chartData.length} SAMPLES</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line p-1">
          {/* 1. Temperature */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="hud-label-text flex items-center gap-1.5 text-green font-bold">
                <Thermometer className="w-3.5 h-3.5" /> TEMPERATURE (°C)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }}
                  tickLine={false}
                  domain={[12, 34]}
                />
                <Tooltip content={<ChartTooltip unit="°C" />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#9CFF32"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Humidity */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="hud-label-text flex items-center gap-1.5 text-cyan font-bold">
                <Droplets className="w-3.5 h-3.5" /> HUMIDITY (%)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }}
                  tickLine={false}
                  domain={[25, 95]}
                />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#35D9E8"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 3. Sound */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="hud-label-text flex items-center gap-1.5 text-ink font-bold">
                <Activity className="w-3.5 h-3.5" /> SOUND LEVEL (dB)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }}
                  tickLine={false}
                  domain={[15, 95]}
                />
                <Tooltip content={<ChartTooltip unit="dB" />} />
                <Line
                  type="monotone"
                  dataKey="sound"
                  stroke="#F2B84B"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Log Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Patrol History */}
        <div className="hud-panel">
          <div className="hud-header">
            <span className="hud-section-title flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5" /> PATROL MISSION ARCHIVES
            </span>
            <span className="text-3xs mono text-ink-muted">{records.length} MISSIONS</span>
          </div>
          <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="hud-panel-inset px-3 py-2 flex items-center justify-between text-2xs mono border border-line"
              >
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${rec.status === 'COMPLETED' ? 'bg-green' : 'bg-amber'}`} />
                  <span className="text-ink font-bold">MISSION #{String(rec.id).padStart(3, '0')}</span>
                </div>
                <span className="text-3xs text-ink-muted">{formatTime(rec.timestamp)}</span>
                <span className={`font-black text-3xs ${rec.status === 'COMPLETED' ? 'text-green' : 'text-amber'}`}>
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert History */}
        <div className="hud-panel">
          <div className="hud-header">
            <span className="hud-section-title flex items-center gap-1.5 text-red">
              <AlertTriangle className="w-3.5 h-3.5" /> INCIDENT HISTORY LOG
            </span>
            <span className="text-3xs mono text-ink-muted">{alerts.length} ENTRIES</span>
          </div>
          <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`hud-panel-inset px-3 py-2 flex items-center justify-between text-2xs mono border ${
                  alert.severity === 'critical' ? 'border-red/40' : 'border-amber/40'
                }`}
              >
                <span className="text-3xs text-ink-muted">{formatTime(alert.timestamp)}</span>
                <span className="text-cyan font-bold">{formatRoom(alert.room)}</span>
                <span className="text-ink-muted truncate max-w-[140px] text-3xs font-semibold">
                  {alert.description}
                </span>
                <span className={`font-black text-3xs ${alert.state === 'ACTIVE' ? 'text-red' : 'text-green'}`}>
                  {alert.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
