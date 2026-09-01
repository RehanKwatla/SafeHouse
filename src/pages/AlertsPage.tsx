import { useState, useMemo } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { AlertRow } from '@/components/AlertRow';
import { AlertDetail } from '@/components/AlertDetail';
import { alertApi } from '@/api';

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

  const counts = useMemo(
    () => ({
      all: alerts.length,
      active: alerts.filter((a) => a.state === 'ACTIVE').length,
      resolved: alerts.filter((a) => a.state === 'RESOLVED').length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
    }),
    [alerts],
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="section-title text-ink">ALERT CENTER</span>
        <span className="text-3xs mono text-ink-faint hidden sm:inline">
          SAFETY VIOLATIONS · THRESHOLDS · SYSTEM EVENTS
        </span>
      </div>

      {/* Stats */}
      <div className="panel" style={{ borderTop: '2px solid #263540' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
          <div className="px-4 py-3">
            <span className="label-text">TOTAL</span>
            <p className="text-2xl mono font-bold text-ink mt-0.5 tabular-nums">{counts.all}</p>
          </div>
          <div className="px-4 py-3">
            <span className="label-text text-red">ACTIVE</span>
            <p className="text-2xl mono font-bold text-red mt-0.5 tabular-nums">{counts.active}</p>
          </div>
          <div className="px-4 py-3">
            <span className="label-text text-amber">WARNINGS</span>
            <p className="text-2xl mono font-bold text-amber mt-0.5 tabular-nums">
              {counts.warning}
            </p>
          </div>
          <div className="px-4 py-3">
            <span className="label-text text-green">RESOLVED</span>
            <p className="text-2xl mono font-bold text-green mt-0.5 tabular-nums">
              {counts.resolved}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-2xs mono tracking-widest transition-colors border ${
              filter === f.id
                ? 'border-green text-green bg-green-tint'
                : 'border-line text-ink-muted hover:text-ink hover:border-line-strong bg-base-surface'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert log */}
      <div className="panel" style={{ borderTop: '2px solid #FF4D4D' }}>
        <div className="panel-header bg-base-elevated">
          <span className="section-title text-red">ALERT LOG</span>
          <span className="text-3xs mono text-ink-faint">{filtered.length} ENTRIES</span>
        </div>

        <div className="flex items-center border-b border-line px-0 py-1 bg-base">
          <span className="text-3xs mono text-ink-faint w-[62px] px-3">TIME</span>
          <span className="text-3xs mono text-ink-faint w-[64px] px-2">LOCATION</span>
          <span className="text-3xs mono text-ink-faint flex-1 px-2">EVENT</span>
          <span className="text-3xs mono text-ink-faint px-3">STATE</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-xs mono text-green">ALL CLEAR</p>
            <p className="text-3xs mono text-ink-faint mt-1">No alerts in this category.</p>
          </div>
        ) : (
          <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 560 }}>
            {filtered.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onClick={() => setSelectedAlert(alert.id)}
              />
            ))}
          </div>
        )}
      </div>

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
