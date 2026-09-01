import { useState } from 'react';
import { PatrolMap } from '@/components/PatrolMap';
import { RoomStatusPanel } from '@/components/RoomStatusPanel';
import { SensorCards } from '@/components/SensorCard';
import { AlertPanel } from '@/components/AlertPanel';
import { CommandConsole } from '@/components/CommandConsole';
import { SimulationToggle } from '@/components/SimulationToggle';
import { useSimulation } from '@/hooks/useSimulation';
import { AlertDetail } from '@/components/AlertDetail';
import { alertApi } from '@/api';

interface OverviewPageProps {
  onNavigateAlerts: () => void;
}

export function OverviewPage({ onNavigateAlerts }: OverviewPageProps) {
  const sim = useSimulation();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const history = sim.getHistory();

  const handleSelectRoom = (roomId: number) => {
    setSelectedRoom((prev) => (prev === roomId ? null : roomId));
  };

  return (
    <div className="space-y-3">
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink tracking-wide">COMMAND CENTER OVERVIEW</h2>
          <p className="text-2xs mono text-ink-faint">Real-time monitoring · All systems operational</p>
        </div>
        <SimulationToggle />
      </div>

      {/* Map + Room status */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3">
        <PatrolMap selectedRoom={selectedRoom} onSelectRoom={handleSelectRoom} />
        <RoomStatusPanel selectedRoom={selectedRoom} onSelectRoom={handleSelectRoom} />
      </div>

      {/* Sensor cards */}
      <SensorCards history={history} />

      {/* Alerts + Command console */}
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
