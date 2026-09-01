import { X, CheckCircle2, Thermometer, Droplets, AudioLines, AlertTriangle } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { alertStateColor, formatTimeSec, formatRoom } from '@/utils/style';

interface AlertDetailProps {
  alertId: string;
  onClose: () => void;
  onResolve: (alertId: string) => void;
}

const METRIC_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  sound: AudioLines,
  system: AlertTriangle,
} as const;

export function AlertDetail({ alertId, onClose, onResolve }: AlertDetailProps) {
  const sim = useSimulation();
  const alert = sim.getAlerts().find((a) => a.id === alertId);
  if (!alert) return null;

  const Icon = METRIC_ICONS[alert.metric];
  const isActive = alert.state === 'ACTIVE';

  const severityBorderColor =
    alert.severity === 'critical' ? '#FF3B30' :
    alert.severity === 'warning'  ? '#F2B84B' : '#1C292D';

  const severityTextClass =
    alert.severity === 'critical' ? 'text-red' :
    alert.severity === 'warning'  ? 'text-amber' : 'text-ink-muted';

  const severityGlowClass =
    alert.severity === 'critical' ? 'hud-glow-red' :
    alert.severity === 'warning'  ? 'hud-glow-amber' : '';

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`hud-panel w-full max-w-sm animate-slide-in ${severityGlowClass}`}
        style={{ borderTop: `2px solid ${severityBorderColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hud-header">
          <div className="flex items-center gap-2">
            <Icon className={`w-3.5 h-3.5 ${severityTextClass}`} />
            <span className="hud-section-title">ALERT DETAIL</span>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors cursor-pointer"
            aria-label="Close alert detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 bg-[#03080A]">
          {/* Severity + state row */}
          <div className="flex items-center justify-between py-2 border-b border-line">
            <span className={`text-sm mono font-black tracking-widest ${severityTextClass}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className={`text-2xs mono font-bold tracking-widest ${alertStateColor(alert.state)}`}>
              {alert.state}
            </span>
          </div>

          {/* Detail rows */}
          <div className="space-y-2.5">
            {[
              { label: 'ROOM',      value: formatRoom(alert.room) },
              { label: 'SENSOR',    value: alert.metric.toUpperCase() },
              { label: 'DETECTED',  value: formatTimeSec(alert.timestamp) },
              ...(alert.value !== undefined ? [{
                label: 'READING',
                value: `${alert.value.toFixed(1)}${alert.metric === 'temperature' ? '°C' : alert.metric === 'humidity' ? '%' : ' dB'}`,
              }] : []),
              ...(alert.threshold !== undefined ? [{
                label: 'THRESHOLD',
                value: `${alert.threshold}${alert.metric === 'temperature' ? '°C' : alert.metric === 'humidity' ? '%' : ' dB'}`,
              }] : []),
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

          {/* Resolve action */}
          {isActive && (
            <button
              onClick={() => { onResolve(alertId); onClose(); }}
              className="btn-hud btn-hud-green w-full justify-center mt-2 cursor-pointer"
              aria-label="Mark alert as resolved"
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
