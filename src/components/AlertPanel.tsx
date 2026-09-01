import { useSimulation } from '@/hooks/useSimulation';
import { AlertRow } from './AlertRow';

interface AlertPanelProps {
  onViewAll: () => void;
  onSelectAlert: (alertId: string) => void;
  maxItems?: number;
}

export function AlertPanel({ onViewAll, onSelectAlert, maxItems = 5 }: AlertPanelProps) {
  const sim = useSimulation();
  const alerts = sim.getAlerts().slice(0, maxItems);
  const activeCount = sim.getActiveAlerts().length;

  return (
    <div className="panel flex flex-col" style={{ borderTop: '2px solid #FF4D4D' }}>
      {/* Header — log-style */}
      <div className="panel-header bg-base-elevated">
        <div className="flex items-center gap-3">
          <span className="section-title text-red">ALERT CONSOLE</span>
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="status-dot bg-red animate-pulse-red" />
              <span className="text-2xs mono font-bold text-red">{activeCount} ACTIVE</span>
            </div>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-3xs mono text-ink-faint hover:text-ink-muted transition-colors tracking-widest"
        >
          VIEW ALL →
        </button>
      </div>

      {/* Column headers — log format */}
      <div className="flex items-center border-b border-line px-0 py-1 bg-base">
        <span className="text-3xs mono text-ink-faint w-[62px] px-3">TIME</span>
        <span className="text-3xs mono text-ink-faint w-[64px] px-2">LOCATION</span>
        <span className="text-3xs mono text-ink-faint flex-1 px-2">EVENT</span>
        <span className="text-3xs mono text-ink-faint px-3">STATE</span>
      </div>

      {alerts.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-2xs mono text-green">ALL CLEAR</p>
          <p className="text-3xs mono text-ink-faint mt-1">No alerts. All rooms within safe limits.</p>
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin flex-1">
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
