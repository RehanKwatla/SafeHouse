import { useSimulation } from '@/hooks/useSimulation';
import { AlertRow } from './AlertRow';
import type { AlertMetric } from '@/types';

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

interface AlertPanelProps {
  onViewAll: () => void;
  onSelectAlert: (alertId: string) => void;
  maxItems?: number;
}

export function AlertPanel({ onViewAll, onSelectAlert, maxItems = 5 }: AlertPanelProps) {
  const sim          = useSimulation();
  const alerts       = sim.getAlerts().slice(0, maxItems);
  const activeCount  = sim.getActiveAlerts().length;

  return (
    <div className="hud-panel flex flex-col h-full select-none">
      <div className="hud-header">
        <div className="flex items-center gap-2">
          <span className="text-xs mono font-black text-red tracking-wider">ALERT CONSOLE</span>
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-red animate-pulse-red" />
              <span className="text-2xs mono font-bold text-red">{activeCount} ACTIVE</span>
            </div>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-3xs mono text-ink-muted hover:text-ink transition-colors tracking-widest cursor-pointer"
        >
          VIEW ALL →
        </button>
      </div>

      <div className="p-3 space-y-2 flex-1 overflow-y-auto scrollbar-thin">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs mono text-green">
            NO ACTIVE ALERTS · ALL SENSORS NORMAL
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              metricLabel={METRIC_LABELS[alert.metric]}
              onClick={() => onSelectAlert(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
