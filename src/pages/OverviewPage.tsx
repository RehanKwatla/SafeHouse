import { useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { alertApi } from '@/api';
import { AlertPanel } from '@/components/AlertPanel';
import { CommandConsole } from '@/components/CommandConsole';
import { SimulationToggle } from '@/components/SimulationToggle';
import { AlertDetail } from '@/components/AlertDetail';
import {
  GlobalSafetyStatus,
  PrimarySensorRow,
  RobotHealthCard,
  TiltCard,
  SmokeCard,
  ObstacleCard,
} from '@/components/SensorModules';

interface OverviewPageProps {
  onNavigateAlerts: () => void;
}

export function OverviewPage({ onNavigateAlerts }: OverviewPageProps) {
  const sim = useSimulation();
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const history = sim.getHistory();

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="hud-section-title text-sm">SAFETY MONITORING</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            REAL-TIME SENSOR TELEMETRY · ALL SYSTEMS
          </span>
        </div>
        <SimulationToggle />
      </div>

      {/* ── Row 1: Global system safety status ── */}
      <GlobalSafetyStatus onViewAlerts={onNavigateAlerts} />

      {/* ── Row 2: Primary 4-sensor telemetry ── */}
      <PrimarySensorRow history={history} />

      {/* ── Row 3: Robot Health + Tilt ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RobotHealthCard />
        <TiltCard />
      </div>

      {/* ── Row 4: Smoke + Obstacle ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SmokeCard />
        <ObstacleCard />
      </div>

      {/* ── Row 5: Alert Console + Command Console ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <AlertPanel onViewAll={onNavigateAlerts} onSelectAlert={setSelectedAlert} />
        <CommandConsole onSelectAlert={setSelectedAlert} />
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
