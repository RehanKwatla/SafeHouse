import { ChevronRight, Inbox } from 'lucide-react';
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
            <span className="flex items-center gap-1 text-2xs mono text-red">
              <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-red" />
              {activeCount} ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-2xs mono text-ink-muted hover:text-green transition-colors"
        >
          VIEW ALL
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Inbox className="w-8 h-8 text-ink-faint" />
          <span className="text-xs text-ink-muted">No alerts</span>
          <span className="text-2xs mono text-ink-faint">All rooms within safe limits</span>
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 240 }}>
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onClick={() => onSelectAlert(alert.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
