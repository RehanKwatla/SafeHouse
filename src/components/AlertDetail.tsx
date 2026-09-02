import React from 'react';
import { X, CheckCircle2, Thermometer, Droplets, AudioLines, Wind, Activity, Flame, Radar, AlertTriangle } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { alertStateColor, formatTimeSec } from '@/utils/style';
import type { AlertMetric } from '@/types';

interface AlertDetailProps {
  alertId: string;
  onClose: () => void;
  onResolve: (alertId: string) => void;
}

// Use React.ElementType so Lucide's ForwardRef components are accepted
const METRIC_ICONS: Record<AlertMetric, React.ElementType> = {
  temperature: Thermometer,
  humidity:    Droplets,
  sound:       AudioLines,
  airQuality:  Wind,
  tilt:        Activity,
  smoke:       Flame,
  obstacle:    Radar,
  system:      AlertTriangle,
};

const METRIC_UNITS: Record<AlertMetric, string> = {
  temperature: '°C',
  humidity:    '%',
  sound:       ' dB',
  airQuality:  ' AQI',
  tilt:        '°',
  smoke:       '',
  obstacle:    ' m',
  system:      '',
};

const METRIC_LABELS: Record<AlertMetric, string> = {
  temperature: 'TEMPERATURE',
  humidity:    'HUMIDITY',
  sound:       'SOUND LEVEL',
  airQuality:  'AIR QUALITY',
  tilt:        'TILT / ORIENTATION',
  smoke:       'SMOKE DETECTOR',
  obstacle:    'OBSTACLE SENSOR',
  system:      'SYSTEM',
};

export function AlertDetail({ alertId, onClose, onResolve }: AlertDetailProps) {
  const sim   = useSimulation();
  const alert = sim.getAlerts().find((a) => a.id === alertId);
  if (!alert) return null;

  const Icon     = METRIC_ICONS[alert.metric] ?? AlertTriangle;
  const isActive = alert.state === 'ACTIVE';

  const severityBorderColor =
    alert.severity === 'critical' ? '#FF3B30' :
    alert.severity === 'warning'  ? '#F2B84B' : '#1C292D';

  const severityTextClass =
    alert.severity === 'critical' ? 'text-red' :
    alert.severity === 'warning'  ? 'text-amber' : 'text-ink-muted';

  const glowClass =
    alert.severity === 'critical' ? 'hud-glow-red' :
    alert.severity === 'warning'  ? 'hud-glow-amber' : '';

  const unit = METRIC_UNITS[alert.metric] ?? '';

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`hud-panel w-full max-w-sm animate-slide-in ${glowClass}`}
        style={{ borderTop: `2px solid ${severityBorderColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hud-header">
          <div className="flex items-center gap-2">
            <Icon className={`w-3.5 h-3.5 ${severityTextClass}`} strokeWidth={1.75} />
            <span className="hud-section-title">ALERT DETAIL</span>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 bg-[#03080A]">
          {/* Severity + state */}
          <div className="flex items-center justify-between py-2 border-b border-line">
            <span className={`text-sm mono font-black tracking-widest ${severityTextClass}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className={`text-2xs mono font-bold tracking-widest ${alertStateColor(alert.state)}`}>
              {alert.state}
            </span>
          </div>

          {/* Detail grid */}
          <div className="space-y-2.5">
            {[
              { label: 'SENSOR',   value: METRIC_LABELS[alert.metric] },
              { label: 'DETECTED', value: formatTimeSec(alert.timestamp) },
              ...(alert.value !== undefined
                ? [{ label: 'READING',   value: `${alert.value.toFixed(alert.metric === 'obstacle' ? 2 : 1)}${unit}` }]
                : []),
              ...(alert.threshold !== undefined
                ? [{ label: 'THRESHOLD', value: `${alert.threshold}${unit}` }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="hud-label-text">{label}</span>
                <span className="text-xs mono text-ink font-semibold">{value}</span>
              </div>
            ))}

            <div>
              <span className="hud-label-text block mb-1">DESCRIPTION</span>
              <p className={`text-xs mono font-semibold ${severityTextClass}`}>
                {alert.description}
              </p>
            </div>
          </div>

          {isActive && (
            <button
              onClick={() => { onResolve(alertId); onClose(); }}
              className="btn-hud btn-hud-green w-full justify-center mt-2 cursor-pointer"
              aria-label="Mark resolved"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              MARK RESOLVED
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
