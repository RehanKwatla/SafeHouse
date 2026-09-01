import { Cpu, Radio } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { deviceApi } from '@/api';
import type { DataSource } from '@/types';

export function SimulationToggle() {
  const sim = useSimulation();
  const current = sim.getDataSource();

  const setSource = (source: DataSource) => {
    deviceApi.setDataSource(source);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hud-label-text hidden sm:inline">DATA SOURCE</span>
      <div className="flex items-center border border-line bg-base-surface">
        <button
          onClick={() => setSource('SIMULATION')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-2xs mono font-bold tracking-widest transition-colors border-r border-line cursor-pointer ${
            current === 'SIMULATION'
              ? 'bg-amber/10 text-amber border-amber/40'
              : 'text-ink-muted hover:text-ink hover:bg-base-elevated'
          }`}
        >
          <Cpu className="w-3 h-3" />
          SIM
        </button>
        <button
          onClick={() => setSource('LIVE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-2xs mono font-bold tracking-widest transition-colors cursor-pointer ${
            current === 'LIVE'
              ? 'bg-green/10 text-green'
              : 'text-ink-muted hover:text-ink hover:bg-base-elevated'
          }`}
        >
          <Radio className="w-3 h-3" />
          LIVE
        </button>
      </div>
    </div>
  );
}
