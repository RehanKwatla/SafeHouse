import { useState, useMemo } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { AlertRow } from '@/components/AlertRow';
import { AlertDetail } from '@/components/AlertDetail';
import { alertApi } from '@/api';
import { SimulationToggle } from '@/components/SimulationToggle';

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
    <div className="space-y-3 select-none">
      {/* Subheader */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <span className="hud-section-title text-sm">ALERT OPERATIONS</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            SAFETY THRESHOLD VIOLATIONS · SYSTEM LOG
          </span>
        </div>
        <SimulationToggle />
      </div>

      {/* Stats row */}
      <div className="hud-panel">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
          <div className="p-3.5">
            <span className="hud-label-text">TOTAL RECORDED</span>
            <p className="text-2xl mono font-black text-ink mt-1 tabular-nums">{counts.all}</p>
          </div>
          <div className="p-3.5">
            <span className="hud-label-text text-red">ACTIVE ALERTS</span>
            <p className="text-2xl mono font-black text-red mt-1 tabular-nums">{counts.active}</p>
          </div>
          <div className="p-3.5">
            <span className="hud-label-text text-amber">WARNINGS</span>
            <p className="text-2xl mono font-black text-amber mt-1 tabular-nums">
              {counts.warning}
            </p>
          </div>
          <div className="p-3.5">
            <span className="hud-label-text text-green">RESOLVED</span>
            <p className="text-2xl mono font-black text-green mt-1 tabular-nums">
              {counts.resolved}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs — all use btn-hud base, active gets green variant */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`btn-hud cursor-pointer ${
              filter === f.id
                ? 'btn-hud-green'
                : 'btn-hud-inactive'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Alert Log Table */}
      <div className="hud-panel">
        <div className="hud-header">
          <span className="text-xs mono font-black text-red tracking-wider">ACTIVE INCIDENT LOG</span>
          <span className="text-3xs mono text-ink-muted">{filtered.length} INCIDENTS</span>
        </div>

        <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs mono text-green">
              NO ALERTS IN THIS CATEGORY · ALL SYSTEMS OPERATING WITHIN THRESHOLDS
            </div>
          ) : (
            filtered.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onClick={() => setSelectedAlert(alert.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
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
