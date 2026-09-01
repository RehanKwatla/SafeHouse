import { useState } from 'react';
import { Play, Pause, Square, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { patrolApi } from '@/api';
import { SimulationToggle } from '@/components/SimulationToggle';
import { formatRoom, formatTime } from '@/utils/style';
import { SensorCards } from '@/components/SensorCard';
import { PatrolMap } from '@/components/PatrolMap';

export function PatrolPage() {
  const sim = useSimulation();
  const patrol = sim.getPatrol();
  const robot = sim.getRobot();
  const history = sim.getHistory();
  const records = sim.getPatrolRecords();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  const isRunning = patrol.status === 'IN_PROGRESS';
  const isPaused = patrol.status === 'PAUSED';

  const statusColor = isRunning ? 'text-green' : isPaused ? 'text-amber' : 'text-ink-muted';

  return (
    <div className="space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <span className="hud-section-title text-sm">PATROL OPERATIONS</span>
          <span className="text-3xs mono text-ink-muted hidden sm:inline">
            AUTONOMOUS WAYPOINT SWEEP · MISSION CONTROL
          </span>
        </div>
        <SimulationToggle />
      </div>

      {/* Live Map Centerpiece */}
      <div className="h-[380px] sm:h-[420px] lg:h-[460px]">
        <PatrolMap
          selectedRoom={selectedRoom}
          onSelectRoom={(id) => setSelectedRoom((prev) => (prev === id ? null : id))}
        />
      </div>

      {/* Mission Status & Controls */}
      <div className="hud-panel">
        <div className="hud-header">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`status-dot ${
                  isRunning
                    ? 'bg-green animate-pulse-green'
                    : isPaused
                    ? 'bg-amber'
                    : 'bg-ink-muted'
                }`}
              />
              <span className={`text-sm mono font-black tracking-widest ${statusColor}`}>
                {patrol.status.replace('_', ' ')}
              </span>
            </div>
            <span className="text-2xs mono text-ink-muted">
              MISSION #{String(patrol.id).padStart(3, '0')}
            </span>
          </div>
          <span className="text-3xs mono text-ink-muted">
            STARTED {formatTime(patrol.startedAt)}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="hud-label-text">PATROL SWEEP PROGRESS</span>
              <span className="text-xs mono text-green font-black tabular-nums">
                {Math.round(patrol.progress)}%
              </span>
            </div>
            <div className="h-2 bg-base-surface border border-line rounded-[1px] overflow-hidden">
              <div
                className="h-full bg-green hud-glow-green transition-all duration-500"
                style={{ width: `${patrol.progress}%` }}
              />
            </div>
          </div>

          {/* Waypoints */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {patrol.rooms.map((roomId) => {
              const done = patrol.completedRooms.includes(roomId);
              const current = robot.currentRoom === roomId && !done;
              return (
                <div
                  key={roomId}
                  className={`hud-panel-inset p-3 border transition-all ${
                    done
                      ? 'border-green/50 bg-[#07130E]'
                      : current
                      ? 'border-green hud-glow-green bg-green/10'
                      : 'border-line'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green" />
                    ) : current ? (
                      <ArrowRight className="w-3.5 h-3.5 text-green animate-pulse" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-ink-faint" />
                    )}
                    <span className="text-xs mono font-black text-ink">
                      {formatRoom(roomId)}
                    </span>
                  </div>
                  <p
                    className={`text-3xs mono font-bold tracking-widest ${
                      done ? 'text-green' : current ? 'text-green' : 'text-ink-muted'
                    }`}
                  >
                    {done ? 'COMPLETE' : current ? 'IN PROGRESS' : 'PENDING'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-line">
            {isRunning ? (
              <button onClick={() => patrolApi.pause()} className="btn-hud btn-hud-amber">
                <Pause className="w-3.5 h-3.5" /> PAUSE PATROL
              </button>
            ) : isPaused ? (
              <button onClick={() => patrolApi.resume()} className="btn-hud btn-hud-green">
                <Play className="w-3.5 h-3.5" /> RESUME PATROL
              </button>
            ) : (
              <button onClick={() => patrolApi.start()} className="btn-hud btn-hud-green">
                <Play className="w-3.5 h-3.5" /> START PATROL
              </button>
            )}
            <button onClick={() => patrolApi.stop()} className="btn-hud btn-hud-red">
              <Square className="w-3.5 h-3.5" /> ABORT MISSION
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Strip */}
      <SensorCards history={history} />

      {/* Patrol Mission History Log */}
      <div className="hud-panel">
        <div className="hud-header">
          <span className="hud-section-title">PATROL MISSION LOG</span>
          <span className="text-3xs mono text-ink-muted">{records.length} MISSIONS COMPLETED</span>
        </div>
        {records.length === 0 ? (
          <p className="px-4 py-6 text-2xs mono text-ink-muted text-center">No completed missions recorded yet.</p>
        ) : (
          <div className="divide-y divide-line p-2">
            {records.slice(0, 8).map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 px-3 py-2 text-xs mono">
                <span
                  className={`status-dot ${
                    rec.status === 'COMPLETED' ? 'bg-green' :
                    rec.status === 'WARNING'   ? 'bg-amber' : 'bg-red'
                  }`}
                />
                <span className="text-3xs text-ink-muted w-16">
                  {formatTime(rec.timestamp)}
                </span>
                <span className="text-ink font-bold">
                  MISSION #{String(rec.id).padStart(3, '0')}
                </span>
                <span
                  className={`ml-auto font-black text-3xs tracking-widest ${
                    rec.status === 'COMPLETED'
                      ? 'text-green'
                      : rec.status === 'WARNING'
                      ? 'text-amber'
                      : 'text-red'
                  }`}
                >
                  {rec.status === 'COMPLETED'
                    ? '✓ COMPLETED'
                    : rec.status === 'WARNING'
                    ? '▲ WITH ALERTS'
                    : '✗ ABORTED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
