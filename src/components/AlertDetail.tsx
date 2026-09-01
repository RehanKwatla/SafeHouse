import { X, CheckCircle2, Thermometer, Droplets, AudioLines } from 'lucide-react';
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

function AlertTriangle({ className }: { className?: string }) {
  return <span className={className}>⚠</span>;
}

export function AlertDetail({ alertId, onClose, onResolve }: AlertDetailProps) {
  const sim = useSimulation();
  const alert = sim.getAlerts().find((a) => a.id === alertId);

  if (!alert) return null;

  const Icon = METRIC_ICONS[alert.metric];
  const severityColor =
    alert.severity === 'critical' ? 'text-red' : alert.severity === 'warning' ? 'text-amber' : 'text-ink-muted';
  const severityBg =
    alert.severity === 'critical' ? 'bg-red-tint border-red/30' : alert.severity === 'warning' ? 'bg-amber-tint border-amber/30' : 'bg-base-hover border-line';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="panel-elevated w-full max-w-md animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <span className="label-text">ALERT DETAIL</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Severity badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded border ${severityBg}`}>
            <Icon className={`w-4 h-4 ${severityColor}`} />
            <span className={`text-xs mono font-semibold tracking-wider ${severityColor}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className={`text-2xs mono ml-auto ${alertStateColor(alert.state)}`}>{alert.state}</span>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-text">ROOM</span>
              <span className="text-xs mono text-ink">{formatRoom(alert.room)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="label-text">METRIC</span>
              <span className="text-xs mono text-ink uppercase">{alert.metric}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="label-text">DESCRIPTION</span>
              <span className="text-xs text-ink">{alert.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="label-text">DETECTED</span>
              <span className="text-xs mono text-ink-muted tabular-nums">{formatTimeSec(alert.timestamp)}</span>
            </div>
            {alert.value !== undefined && (
              <div className="flex items-center justify-between">
                <span className="label-text">VALUE</span>
                <span className="text-xs mono text-ink">
                  {alert.value.toFixed(1)} {alert.metric === 'temperature' ? '°C' : alert.metric === 'humidity' ? '%' : 'dB'}
                </span>
              </div>
            )}
            {alert.threshold !== undefined && (
              <div className="flex items-center justify-between">
                <span className="label-text">THRESHOLD</span>
                <span className="text-xs mono text-ink-muted">
                  {alert.threshold} {alert.metric === 'temperature' ? '°C' : alert.metric === 'humidity' ? '%' : 'dB'}
                </span>
              </div>
            )}
          </div>

          {/* Action */}
          {alert.state === 'ACTIVE' && (
            <button
              onClick={() => {
                onResolve(alertId);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-green/10 border border-green/30 rounded text-green text-xs mono font-medium tracking-wider hover:bg-green/20 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              MARK RESOLVED
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
