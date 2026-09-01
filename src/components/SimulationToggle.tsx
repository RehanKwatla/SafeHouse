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
      <span className="label-text hidden sm:inline">DATA SOURCE</span>
      <div className="flex items-center bg-base border border-line rounded p-0.5">
        <button
          onClick={() => setSource('SIMULATION')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-2xs mono tracking-wider transition-colors ${
            current === 'SIMULATION'
              ? 'bg-amber-tint text-amber border border-amber/30'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Cpu className="w-3 h-3" />
          SIM
        </button>
        <button
          onClick={() => setSource('LIVE')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-2xs mono tracking-wider transition-colors ${
            current === 'LIVE'
              ? 'bg-green-tint text-green border border-green/30'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Radio className="w-3 h-3" />
          LIVE
        </button>
      </div>
    </div>
  );
}
