import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Thermometer, Droplets, AudioLines, Wind, AlertTriangle } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { formatTime } from '@/utils/style';
import { SimulationToggle } from '@/components/SimulationToggle';
import type { AlertMetric } from '@/types';

type TimeRange = '1H' | '12H' | '24H';

const RANGES: { id: TimeRange; label: string }[] = [
  { id: '1H',  label: '1H'  },
  { id: '12H', label: '12H' },
  { id: '24H', label: '24H' },
];

const METRIC_LABELS: Record<AlertMetric, string> = {
  temperature: 'TEMPERATURE',
  humidity:    'HUMIDITY',
  sound:       'SOUND',
  airQuality:  'AIR QUALITY',
  tilt:        'TILT',
  smoke:       'SMOKE',
  obstacle:    'OBSTACLE',
  system:      'SYSTEM',
};

function ChartTooltip({
  active, payload, label, unit,
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
  const sim        = useSimulation();
  const allHistory = sim.getHistory();
  const alerts     = sim.getAlerts();
  const [range, setRange] = useState<TimeRange>('1H');

  const history = useMemo(() => {
    if (range === '1H')  return allHistory.slice(-60);
    if (range === '12H') return allHistory.slice(-90);
    return allHistory;
  }, [allHistory, range]);

  const chartData = useMemo(
    () => history.map((h) => ({
      time:        h.label,
      temperature: h.temperature,
      humidity:    h.humidity,
      sound:       h.sound,
      airQuality:  h.airQuality,
    })),
    [history],
  );

  return (
    <div className="space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="hud-section-title text-sm">TELEMETRY HISTORY</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            SENSOR TREND ARCHIVES · INCIDENT LOG
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center border border-line bg-base-surface">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1 text-2xs mono font-bold tracking-widest transition-colors cursor-pointer border-r border-line last:border-r-0 ${
                  range === r.id
                    ? 'bg-green/10 text-green'
                    : 'text-ink-muted hover:text-ink hover:bg-base-hover'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <SimulationToggle />
        </div>
      </div>

      {/* ── Sensor trend charts ── */}
      <div className="hud-panel">
        <div className="hud-header">
          <span className="hud-section-title">SENSOR TRENDS</span>
          <span className="text-3xs mono text-ink-muted">{chartData.length} SAMPLES</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line p-1">
          {/* Temperature */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Thermometer className="w-3.5 h-3.5 text-green" />
              <span className="hud-label-text text-green">TEMPERATURE</span>
              <span className="text-3xs mono text-ink-faint ml-auto">°C</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} domain={[12, 34]} />
                <Tooltip content={<ChartTooltip unit="°C" />} />
                <Line type="monotone" dataKey="temperature"
                  stroke="#9CFF32" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Humidity */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets className="w-3.5 h-3.5 text-cyan" />
              <span className="hud-label-text text-cyan">HUMIDITY</span>
              <span className="text-3xs mono text-ink-faint ml-auto">%</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} domain={[25, 95]} />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <Line type="monotone" dataKey="humidity"
                  stroke="#35D9E8" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sound */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AudioLines className="w-3.5 h-3.5 text-amber" />
              <span className="hud-label-text text-amber">SOUND LEVEL</span>
              <span className="text-3xs mono text-ink-faint ml-auto">dB</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} domain={[15, 95]} />
                <Tooltip content={<ChartTooltip unit=" dB" />} />
                <Line type="monotone" dataKey="sound"
                  stroke="#F2B84B" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Air Quality */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Wind className="w-3.5 h-3.5 text-green" />
              <span className="hud-label-text">AIR QUALITY</span>
              <span className="text-3xs mono text-ink-faint ml-auto">AQI</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#0D1E22" />
                <XAxis dataKey="time"
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: '#4E686E', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#142A2E' }} tickLine={false} domain={[0, 200]} />
                <Tooltip content={<ChartTooltip unit=" AQI" />} />
                <Line type="monotone" dataKey="airQuality"
                  stroke="#9CFF32" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Incident history log ── */}
      <div className="hud-panel">
        <div className="hud-header">
          <span className="hud-section-title flex items-center gap-1.5 text-red">
            <AlertTriangle className="w-3.5 h-3.5" />
            INCIDENT HISTORY
          </span>
          <span className="text-3xs mono text-ink-muted">{alerts.length} ENTRIES</span>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-3 py-1 border-b border-line bg-[#050C0E] text-3xs mono text-ink-faint">
          <span className="w-14 shrink-0">TIME</span>
          <span className="w-[90px] shrink-0">SENSOR</span>
          <span className="flex-1">DESCRIPTION</span>
          <span className="w-20 shrink-0 text-right">STATE</span>
        </div>

        <div className="divide-y divide-line-faint max-h-80 overflow-y-auto scrollbar-thin">
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs mono text-green">
              NO INCIDENTS RECORDED
            </div>
          ) : (
            alerts.slice(0, 40).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 px-3 py-2 text-2xs mono border-l-2 ${
                  alert.severity === 'critical' ? 'border-l-red' :
                  alert.severity === 'warning'  ? 'border-l-amber' : 'border-l-line'
                }`}
              >
                <span className="text-ink-faint tabular-nums w-14 shrink-0">
                  {formatTime(alert.timestamp)}
                </span>
                <span className={`w-[90px] shrink-0 font-bold text-3xs tracking-wider ${
                  alert.severity === 'critical' ? 'text-red' : 'text-amber'
                }`}>
                  {METRIC_LABELS[alert.metric] ?? alert.metric.toUpperCase()}
                </span>
                <span className="flex-1 text-ink-muted truncate text-3xs font-semibold">
                  {alert.description}
                </span>
                <span className={`w-20 text-right font-black text-3xs tracking-widest ${
                  alert.state === 'ACTIVE' ? 'text-red' : 'text-green'
                }`}>
                  {alert.state}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
