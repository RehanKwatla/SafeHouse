import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Thermometer, Droplets, AudioLines, Map as MapIcon } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { formatTime, formatRoom } from '@/utils/style';
import type { SensorHistoryPoint } from '@/types';

type TimeRange = '1H' | '12H' | '24H';

const RANGES: { id: TimeRange; label: string }[] = [
  { id: '1H', label: '1 HOUR' },
  { id: '12H', label: '12 HOURS' },
  { id: '24H', label: '24 HOURS' },
];

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="panel-elevated px-3 py-2">
      <p className="text-2xs mono text-ink-faint mb-1">{label}</p>
      <p className="text-xs mono text-ink">
        {payload[0].value.toFixed(1)}{unit}
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

  // For demo purposes, we slice based on available data points.
  // Real 24h/12h would require more historical data, but we show what we have.
  const history = useMemo(() => {
    if (range === '1H') return allHistory.slice(-60);
    if (range === '12H') return allHistory.slice(-90);
    return allHistory;
  }, [allHistory, range]);

  const chartData = useMemo(() => {
    return history.map((h) => ({
      time: h.label,
      temperature: h.temperature,
      humidity: h.humidity,
      sound: h.sound,
    }));
  }, [history]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink tracking-wide">HISTORY & TELEMETRY</h2>
          <p className="text-2xs mono text-ink-faint">Sensor trends · Patrol records · Alert log</p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded text-2xs mono tracking-wider transition-colors ${
                range === r.id
                  ? 'bg-green-tint text-green border border-green/30'
                  : 'bg-base-surface text-ink-muted border border-line hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Temperature */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label-text flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-amber" /> TEMPERATURE
            </span>
            <span className="text-2xs mono text-ink-muted">°C</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2228" />
              <XAxis dataKey="time" tick={{ fill: '#4A5258', fontSize: 8, fontFamily: 'monospace' }} axisLine={{ stroke: '#252C32' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#4A5258', fontSize: 8, fontFamily: 'monospace' }} axisLine={{ stroke: '#252C32' }} tickLine={false} domain={[10, 35]} />
              <Tooltip content={<ChartTooltip unit="°C" />} />
              <Line type="monotone" dataKey="temperature" stroke="#F5B942" strokeWidth={1.5} dot={false} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label-text flex items-center gap-1.5">
              <Droplets className="w-3 h-3 text-green" /> HUMIDITY
            </span>
            <span className="text-2xs mono text-ink-muted">%</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2228" />
              <XAxis dataKey="time" tick={{ fill: '#4A5258', fontSize: 8, fontFamily: 'monospace' }} axisLine={{ stroke: '#252C32' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#4A5258', fontSize: 8, fontFamily: 'monospace' }} axisLine={{ stroke: '#252C32' }} tickLine={false} domain={[20, 100]} />
              <Tooltip content={<ChartTooltip unit="%" />} />
              <Line type="monotone" dataKey="humidity" stroke="#B8F34A" strokeWidth={1.5} dot={false} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sound */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label-text flex items-center gap-1.5">
              <AudioLines className="w-3 h-3 text-ink-muted" /> SOUND LEVEL
            </span>
            <span className="text-2xs mono text-ink-muted">dB</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2228" />
              <XAxis dataKey="time" tick={{ fill: '#4A5258', fontSize: 8, fontFamily: 'monospace' }} axisLine={{ stroke: '#252C32' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#4A5258', fontSize: 8, fontFamily: 'monospace' }} axisLine={{ stroke: '#252C32' }} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip unit=" dB" />} />
              <Line type="monotone" dataKey="sound" stroke="#7D8790" strokeWidth={1.5} dot={false} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patrol + Alert history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Patrol history */}
        <div className="panel">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="label-text flex items-center gap-1.5">
              <MapIcon className="w-3 h-3" /> PATROL HISTORY
            </span>
          </div>
          {records.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="text-xs text-ink-muted">No patrol records yet</span>
            </div>
          ) : (
            <div className="divide-y divide-line-faint max-h-80 overflow-y-auto scrollbar-thin">
              {records.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`w-2 h-2 rounded-full ${rec.status === 'COMPLETED' ? 'bg-green' : rec.status === 'WARNING' ? 'bg-amber' : 'bg-red'}`} />
                  <span className="text-xs mono text-ink-muted w-16">{formatTime(rec.timestamp)}</span>
                  <span className="text-xs mono text-ink">PATROL #{String(rec.id).padStart(3, '0')}</span>
                  <span className={`text-2xs mono ml-auto ${rec.status === 'COMPLETED' ? 'text-green' : rec.status === 'WARNING' ? 'text-amber' : 'text-red'}`}>
                    {rec.status === 'COMPLETED' ? '✓' : rec.status === 'WARNING' ? '⚠' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert history */}
        <div className="panel">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="label-text flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> ALERT HISTORY
            </span>
          </div>
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="text-xs text-ink-muted">No alerts recorded</span>
            </div>
          ) : (
            <div className="divide-y divide-line-faint max-h-80 overflow-y-auto scrollbar-thin">
              {alerts.slice(0, 15).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red' : alert.severity === 'warning' ? 'bg-amber' : 'bg-ink-faint'
                  }`} />
                  <span className="text-xs mono text-ink-muted w-16">{formatTime(alert.timestamp)}</span>
                  <span className="text-xs mono text-ink-muted w-14">{formatRoom(alert.room)}</span>
                  <span className="text-xs text-ink flex-1 truncate">{alert.description}</span>
                  <span className={`text-2xs mono ${alert.state === 'ACTIVE' ? 'text-red' : 'text-green'}`}>
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

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
