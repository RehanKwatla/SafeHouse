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
  AudioLines,
  AlertTriangle,
  Map as MapIcon,
} from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { formatTime, formatRoom } from '@/utils/style';

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
    <div className="panel-elevated px-2.5 py-1.5">
      <p className="text-3xs mono text-ink-faint">{label}</p>
      <p className="text-xs mono text-ink">
        {payload[0].value.toFixed(1)}
        {unit}
      </p>
    </div>
  );
}

const CHART_PROPS = {
  gridStroke: '#111C20',
  axisStroke: '#1C292D',
  tickFill: '#3D4F55',
};

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="section-title text-ink">HISTORY & TELEMETRY</span>
          <span className="text-3xs mono text-ink-faint hidden sm:inline">
            SENSOR TRENDS · PATROL LOG · ALERT LOG
          </span>
        </div>

        <div className="flex items-center border border-line bg-base">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-4 py-1.5 text-2xs mono tracking-widest transition-colors border-r border-line last:border-r-0 ${
                range === r.id
                  ? 'bg-green-tint text-green'
                  : 'text-ink-muted hover:text-ink hover:bg-base-hover'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="panel" style={{ borderTop: '2px solid #263540' }}>
        <div className="panel-header bg-base-elevated">
          <span className="section-title">SENSOR TRENDS</span>
          <span className="text-3xs mono text-ink-faint">{chartData.length} DATA POINTS</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line">
          {/* Temperature */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="label-text flex items-center gap-1.5 text-amber">
                <Thermometer className="w-3 h-3" /> TEMPERATURE
              </span>
              <span className="text-3xs mono text-ink-faint">°C</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_PROPS.gridStroke} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: CHART_PROPS.tickFill, fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: CHART_PROPS.axisStroke }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: CHART_PROPS.tickFill, fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: CHART_PROPS.axisStroke }}
                  tickLine={false}
                  domain={[10, 35]}
                />
                <Tooltip content={<ChartTooltip unit="°C" />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#F2B84B"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Humidity */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="label-text flex items-center gap-1.5 text-cyan">
                <Droplets className="w-3 h-3" /> HUMIDITY
              </span>
              <span className="text-3xs mono text-ink-faint">%</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_PROPS.gridStroke} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: CHART_PROPS.tickFill, fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: CHART_PROPS.axisStroke }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: CHART_PROPS.tickFill, fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: CHART_PROPS.axisStroke }}
                  tickLine={false}
                  domain={[20, 100]}
                />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#55D6E8"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sound */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="label-text flex items-center gap-1.5">
                <AudioLines className="w-3 h-3" /> SOUND LEVEL
              </span>
              <span className="text-3xs mono text-ink-faint">dB</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={CHART_PROPS.gridStroke} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: CHART_PROPS.tickFill, fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: CHART_PROPS.axisStroke }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: CHART_PROPS.tickFill, fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: CHART_PROPS.axisStroke }}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip unit=" dB" />} />
                <Line
                  type="monotone"
                  dataKey="sound"
                  stroke="#758287"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patrol + Alert log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Patrol log */}
        <div className="panel" style={{ borderTop: '2px solid #263540' }}>
          <div className="panel-header bg-base-elevated">
            <span className="section-title flex items-center gap-1.5">
              <MapIcon className="w-3 h-3" /> PATROL LOG
            </span>
            <span className="text-3xs mono text-ink-faint">{records.length} MISSIONS</span>
          </div>
          {records.length === 0 ? (
            <p className="px-4 py-6 text-2xs mono text-ink-faint">No patrol records yet.</p>
          ) : (
            <div className="divide-y divide-line-faint max-h-72 overflow-y-auto scrollbar-thin">
              {records.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`status-dot ${
                      rec.status === 'COMPLETED'
                        ? 'bg-green'
                        : rec.status === 'WARNING'
                        ? 'bg-amber'
                        : 'bg-red'
                    }`}
                  />
                  <span className="text-2xs mono text-ink-faint w-14">
                    {formatTime(rec.timestamp)}
                  </span>
                  <span className="text-2xs mono text-ink">
                    MISSION #{String(rec.id).padStart(3, '0')}
                  </span>
                  <span
                    className={`text-2xs mono ml-auto ${
                      rec.status === 'COMPLETED'
                        ? 'text-green'
                        : rec.status === 'WARNING'
                        ? 'text-amber'
                        : 'text-red'
                    }`}
                  >
                    {rec.status === 'COMPLETED' ? '✓' : rec.status === 'WARNING' ? '⚠' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert log */}
        <div className="panel" style={{ borderTop: '2px solid #263540' }}>
          <div className="panel-header bg-base-elevated">
            <span className="section-title flex items-center gap-1.5 text-red">
              <AlertTriangle className="w-3 h-3" /> ALERT LOG
            </span>
            <span className="text-3xs mono text-ink-faint">{alerts.length} ENTRIES</span>
          </div>
          {alerts.length === 0 ? (
            <p className="px-4 py-6 text-2xs mono text-ink-faint">No alerts recorded.</p>
          ) : (
            <div className="divide-y divide-line-faint max-h-72 overflow-y-auto scrollbar-thin">
              {alerts.slice(0, 20).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderLeft: `2px solid ${
                      alert.severity === 'critical'
                        ? '#FF4D4D'
                        : alert.severity === 'warning'
                        ? '#F2B84B'
                        : '#263540'
                    }`,
                  }}
                >
                  <span className="text-2xs mono text-ink-faint w-14">
                    {formatTime(alert.timestamp)}
                  </span>
                  <span className="text-2xs mono text-cyan w-14">{formatRoom(alert.room)}</span>
                  <span className="text-xs text-ink-muted flex-1 truncate">
                    {alert.description}
                  </span>
                  <span
                    className={`text-3xs mono ${
                      alert.state === 'ACTIVE' ? 'text-red' : 'text-green'
                    }`}
                  >
                    {alert.state}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
