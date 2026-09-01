import { useState, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { AlertRow } from '@/components/AlertRow';
import { AlertDetail } from '@/components/AlertDetail';
import { alertApi } from '@/api';
import type { AlertState, Severity } from '@/types';
import { formatTimeSec, formatRoom } from '@/utils/style';

type FilterType = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'CRITICAL' | 'WARNING';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'ALL' },
  { id: 'ACTIVE', label: 'ACTIVE' },
  { id: 'RESOLVED', label: 'RESOLVED' },
  { id: 'CRITICAL', label: 'CRITICAL' },
  { id: 'WARNING', label: 'WARNING' },
];

export function AlertsPage() {
  const sim = useSimulation();
  const alerts = sim.getAlerts();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'ACTIVE':
        return alerts.filter((a) => a.state === 'ACTIVE');
      case 'RESOLVED':
        return alerts.filter((a) => a.state === 'RESOLVED');
      case 'CRITICAL':
        return alerts.filter((a) => a.severity === 'critical');
      case 'WARNING':
        return alerts.filter((a) => a.severity === 'warning');
      default:
        return alerts;
    }
  }, [alerts, filter]);

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      active: alerts.filter((a) => a.state === 'ACTIVE').length,
      resolved: alerts.filter((a) => a.state === 'RESOLVED').length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
    };
  }, [alerts]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-ink tracking-wide">ALERT CENTER</h2>
        <p className="text-2xs mono text-ink-faint">Safety violations · Environmental thresholds · System events</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel p-3">
          <span className="label-text">TOTAL</span>
          <p className="text-2xl mono font-semibold text-ink mt-1">{counts.all}</p>
        </div>
        <div className="panel p-3 border-l-2 border-l-red">
          <span className="label-text">ACTIVE</span>
          <p className="text-2xl mono font-semibold text-red mt-1">{counts.active}</p>
        </div>
        <div className="panel p-3 border-l-2 border-l-amber">
          <span className="label-text">WARNINGS</span>
          <p className="text-2xl mono font-semibold text-amber mt-1">{counts.warning}</p>
        </div>
        <div className="panel p-3 border-l-2 border-l-green">
          <span className="label-text">RESOLVED</span>
          <p className="text-2xl mono font-semibold text-green mt-1">{counts.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded text-2xs mono tracking-wider transition-colors ${
              filter === f.id
                ? 'bg-green-tint text-green border border-green/30'
                : 'bg-base-surface text-ink-muted border border-line hover:text-ink hover:border-line-strong'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="panel">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
          <span className="label-text">ALERT LOG</span>
          <span className="text-2xs mono text-ink-muted">{filtered.length} ITEMS</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Inbox className="w-10 h-10 text-ink-faint" />
            <span className="text-sm text-ink-muted">No alerts in this category</span>
            <span className="text-2xs mono text-ink-faint">All clear</span>
          </div>
        ) : (
          <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 600 }}>
            {filtered.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onClick={() => setSelectedAlert(alert.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Alert detail modal */}
      {selectedAlert && (
        <AlertDetail
          alertId={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={(id) => alertApi.resolve(id)}
        />
      )}
    </div>
  );
}
