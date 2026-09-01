import { useSimulation } from '@/hooks/useSimulation';
import { AlertRow } from './AlertRow';

interface AlertPanelProps {
  onViewAll: () => void;
  onSelectAlert: (alertId: string) => void;
  maxItems?: number;
}

export function AlertPanel({ onViewAll, onSelectAlert, maxItems = 6 }: AlertPanelProps) {
  const sim = useSimulation();
  const alerts = sim.getAlerts().slice(0, maxItems);
  const activeCount = sim.getActiveAlerts().length;

  return (
    <div className="panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="label-text">ALERTS</span>
          {activeCount > 0 && (
            <span className="text-2xs mono text-red font-semibold">{activeCount} active</span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-2xs mono text-ink-faint hover:text-ink-muted transition-colors"
        >
          view all
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-xs text-ink-muted">No alerts.</p>
          <p className="text-2xs mono text-ink-faint mt-1">All rooms within safe limits.</p>
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 260 }}>
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onClick={() => onSelectAlert(alert.id)}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
