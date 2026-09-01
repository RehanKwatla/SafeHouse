import { Play, Pause, Square, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { patrolApi } from '@/api';
import { SimulationToggle } from '@/components/SimulationToggle';
import { formatRoom, formatTime } from '@/utils/style';
import { SensorCards } from '@/components/SensorCard';

export function PatrolPage() {
  const sim = useSimulation();
  const patrol = sim.getPatrol();
  const robot = sim.getRobot();
  const history = sim.getHistory();
  const records = sim.getPatrolRecords();

  const isRunning = patrol.status === 'IN_PROGRESS';
  const isPaused = patrol.status === 'PAUSED';

  const statusColor = isRunning ? 'text-green' : isPaused ? 'text-amber' : 'text-ink-faint';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="section-title text-ink">PATROL</span>
          <span className="text-3xs mono text-ink-faint hidden sm:inline">
            WAYPOINT NAVIGATION · AUTOMATED ROOM SWEEP
          </span>
        </div>
        <SimulationToggle />
      </div>

      {/* Mission status */}
      <div className="panel" style={{ borderTop: '2px solid #263540' }}>
        <div className="panel-header bg-base-elevated">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`status-dot ${
                  isRunning
                    ? 'bg-green animate-pulse-green'
                    : isPaused
                    ? 'bg-amber'
                    : 'bg-ink-faint'
                }`}
              />
              <span className={`text-sm mono font-bold tracking-widest ${statusColor}`}>
                {patrol.status.replace('_', ' ')}
              </span>
            </div>
            <span className="text-2xs mono text-ink-faint">
              MISSION #{String(patrol.id).padStart(3, '0')}
            </span>
          </div>
          <span className="text-3xs mono text-ink-faint">
            STARTED {formatTime(patrol.startedAt)}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="label-text">PATROL PROGRESS</span>
              <span className="text-xs mono text-ink font-semibold tabular-nums">
                {Math.round(patrol.progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-base">
              <div
                className="h-full bg-green transition-all duration-500"
                style={{ width: `${patrol.progress}%` }}
              />
            </div>
          </div>

          {/* Waypoints */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {patrol.rooms.map((roomId) => {
              const done = patrol.completedRooms.includes(roomId);
              const current = robot.currentRoom === roomId && !done;
              return (
                <div
                  key={roomId}
                  className="panel-elevated px-3 py-2.5"
                  style={{
                    borderLeft: `2px solid ${
                      done ? '#A8F04D' : current ? '#A8F04D' : '#1C292D'
                    }`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green" />
                    ) : current ? (
                      <ArrowRight className="w-3.5 h-3.5 text-green" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-ink-faint" />
                    )}
                    <span className="text-2xs mono font-bold text-ink">
                      {formatRoom(roomId)}
                    </span>
                  </div>
                  <p
                    className={`text-3xs mono tracking-widest ${
                      done ? 'text-green' : current ? 'text-green' : 'text-ink-faint'
                    }`}
                  >
                    {done ? 'COMPLETE' : current ? 'IN PROGRESS' : 'PENDING'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button onClick={() => patrolApi.pause()} className="btn-tech btn-amber">
                <Pause className="w-3.5 h-3.5" /> PAUSE
              </button>
            ) : isPaused ? (
              <button onClick={() => patrolApi.resume()} className="btn-tech btn-green">
                <Play className="w-3.5 h-3.5" /> RESUME
              </button>
            ) : (
              <button onClick={() => patrolApi.start()} className="btn-tech btn-green">
                <Play className="w-3.5 h-3.5" /> START PATROL
              </button>
            )}
            <button onClick={() => patrolApi.stop()} className="btn-tech btn-red">
              <Square className="w-3.5 h-3.5" /> STOP
            </button>
          </div>
        </div>
      </div>

      {/* Current location */}
      <div className="panel" style={{ borderTop: '2px solid #263540' }}>
        <div className="panel-header bg-base-elevated">
          <span className="section-title">CURRENT LOCATION</span>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'ROOM', value: formatRoom(robot.currentRoom), color: 'text-cyan' },
            { label: 'STATE', value: robot.state, color: 'text-green' },
            ...(robot.targetRoom !== null
              ? [{ label: 'TARGET', value: formatRoom(robot.targetRoom), color: 'text-ink' }]
              : []),
            ...(robot.etaSeconds > 0
              ? [{ label: 'ETA', value: `${robot.etaSeconds}s`, color: 'text-green' }]
              : []),
          ].map(({ label, value, color }) => (
            <div key={label}>
              <span className="label-text">{label}</span>
              <p className={`text-base mono font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry */}
      <SensorCards history={history} />

      {/* Patrol history */}
      <div className="panel" style={{ borderTop: '2px solid #263540' }}>
        <div className="panel-header bg-base-elevated">
          <span className="section-title">PATROL HISTORY</span>
          <span className="text-3xs mono text-ink-faint">{records.length} MISSIONS</span>
        </div>
        {records.length === 0 ? (
          <p className="px-4 py-6 text-2xs mono text-ink-faint">No completed patrols yet.</p>
        ) : (
          <div className="divide-y divide-line-faint">
            {records.slice(0, 10).map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`status-dot ${
                    rec.status === 'COMPLETED'
                      ? 'bg-green'
                      : rec.status === 'WARNING'
                      ? 'bg-amber'
                      : 'bg-red'
                  }`}
                />
                <span className="text-2xs mono text-ink-faint w-14">
                  {formatTime(rec.timestamp)}
                </span>
                <span className="text-2xs mono text-ink">
                  MISSION #{String(rec.id).padStart(3, '0')}
                </span>
                <span
                  className={`text-2xs mono ml-auto ${
                    rec.status === 'COMPLETED'
                      ? 'text-green'
                      : rec.status === 'WARNING'
                      ? 'text-amber'
                      : 'text-red'
                  }`}
                >
                  {rec.status === 'COMPLETED'
                    ? '✓ COMPLETE'
                    : rec.status === 'WARNING'
                    ? '⚠ WITH ALERTS'
                    : '✗ ABORTED'}
                </span>
                {rec.alerts > 0 && (
                  <span className="text-3xs mono text-ink-faint">{rec.alerts} ALERTS</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
