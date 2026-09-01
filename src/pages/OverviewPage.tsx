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

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlert(alertId);
    const alert = sim.getAlerts().find((a) => a.id === alertId);
    if (alert) {
      setSelectedRoom(alert.room);
    }
  };

  return (
    <div className="space-y-3">
      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <span className="hud-section-title text-sm">MISSION OVERVIEW</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            SECTOR 01 · FULL SYSTEM TELEMETRY
          </span>
        </div>
        <SimulationToggle />
      </div>

      {/* Hero Map + Room Status Row */}
      {/* h-full on children requires the row itself to define a height */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-3 xl:items-stretch">
        {/* Map wrapper: explicit height on every breakpoint so the SVG always has room */}
        <div className="h-[380px] sm:h-[420px] lg:h-[460px]">
          <PatrolMap selectedRoom={selectedRoom} onSelectRoom={handleSelectRoom} />
        </div>
        {/* Room panel fills the same row height on xl, scrolls internally */}
        <div className="xl:h-[460px]">
          <RoomStatusPanel
            selectedRoom={selectedRoom}
            onSelectRoom={handleSelectRoom}
            onViewAllRooms={onNavigateAlerts}
          />
        </div>
      </div>

      {/* Live Telemetry Row */}
      <SensorCards history={history} />

      {/* Alert Console + Command Console Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <AlertPanel onViewAll={onNavigateAlerts} onSelectAlert={handleSelectAlert} />
        <CommandConsole onSelectAlert={handleSelectAlert} />
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
