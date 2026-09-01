import { Play, Pause, Square, CheckCircle2, Circle, ArrowRight, MapPin } from 'lucide-react';
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

  const statusColor =
    patrol.status === 'IN_PROGRESS' ? 'text-green' : patrol.status === 'PAUSED' ? 'text-amber' : 'text-ink-muted';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink tracking-wide">PATROL MISSION CONTROL</h2>
          <p className="text-2xs mono text-ink-faint">Waypoint navigation · Automated room sweep</p>
        </div>
        <SimulationToggle />
      </div>

      {/* Mission status */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${patrol.status === 'IN_PROGRESS' ? 'bg-green animate-pulse-green' : patrol.status === 'PAUSED' ? 'bg-amber' : 'bg-ink-faint'}`} />
              <span className={`text-xs mono font-semibold tracking-wider ${statusColor}`}>{patrol.status.replace('_', ' ')}</span>
            </div>
            <span className="text-xs mono text-ink-muted">MISSION #{String(patrol.id).padStart(3, '0')}</span>
          </div>
          <span className="text-2xs mono text-ink-faint">STARTED {formatTime(patrol.startedAt)}</span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="label-text">PROGRESS</span>
            <span className="text-xs mono text-ink">{Math.round(patrol.progress)}%</span>
          </div>
          <div className="h-2 bg-base-hover rounded-sm overflow-hidden">
            <div
              className="h-full bg-green transition-all duration-500 rounded-sm"
              style={{ width: `${patrol.progress}%` }}
            />
          </div>
        </div>

        {/* Room waypoints */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {patrol.rooms.map((roomId) => {
            const isCompleted = patrol.completedRooms.includes(roomId);
            const isCurrent = robot.currentRoom === roomId && !isCompleted;
            const isUpcoming = !isCompleted && !isCurrent;

            return (
              <div
                key={roomId}
                className={`panel-elevated p-3 border-l-2 ${
                  isCompleted ? 'border-l-green' : isCurrent ? 'border-l-green animate-pulse-green' : 'border-l-line'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green" />
                  ) : isCurrent ? (
                    <ArrowRight className="w-4 h-4 text-green" />
                  ) : (
                    <Circle className="w-4 h-4 text-ink-faint" />
                  )}
                  <span className="text-xs mono font-semibold text-ink">{formatRoom(roomId)}</span>
                </div>
                <p className={`text-2xs mono ${isCompleted ? 'text-green' : isCurrent ? 'text-green' : 'text-ink-faint'}`}>
                  {isCompleted ? 'COMPLETE' : isCurrent ? 'IN PROGRESS' : isUpcoming ? 'PENDING' : ''}
                </p>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {patrol.status === 'IN_PROGRESS' ? (
            <button
              onClick={() => patrolApi.pause()}
              className="flex items-center gap-2 px-4 py-2 bg-amber/10 border border-amber/30 rounded text-amber text-xs mono font-medium tracking-wider hover:bg-amber/20 transition-colors"
            >
              <Pause className="w-4 h-4" /> PAUSE
            </button>
          ) : patrol.status === 'PAUSED' ? (
            <button
              onClick={() => patrolApi.resume()}
              className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/30 rounded text-green text-xs mono font-medium tracking-wider hover:bg-green/20 transition-colors"
            >
              <Play className="w-4 h-4" /> RESUME
            </button>
          ) : (
            <button
              onClick={() => patrolApi.start()}
              className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/30 rounded text-green text-xs mono font-medium tracking-wider hover:bg-green/20 transition-colors"
            >
              <Play className="w-4 h-4" /> START PATROL
            </button>
          )}
          <button
            onClick={() => patrolApi.stop()}
            className="flex items-center gap-2 px-4 py-2 bg-red/10 border border-red/30 rounded text-red text-xs mono font-medium tracking-wider hover:bg-red/20 transition-colors"
          >
            <Square className="w-4 h-4" /> STOP
          </button>
        </div>
      </div>

      {/* Current room detail */}
      <div className="panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-green" />
          <span className="label-text">CURRENT LOCATION</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="label-text">ROOM</span>
            <p className="text-lg mono font-semibold text-ink mt-0.5">{formatRoom(robot.currentRoom)}</p>
          </div>
          <div>
            <span className="label-text">STATE</span>
            <p className="text-lg mono font-semibold text-green mt-0.5">{robot.state}</p>
          </div>
          {robot.targetRoom !== null && (
            <div>
              <span className="label-text">TARGET</span>
              <p className="text-lg mono font-semibold text-ink mt-0.5">{formatRoom(robot.targetRoom)}</p>
            </div>
          )}
          {robot.etaSeconds > 0 && (
            <div>
              <span className="label-text">ETA</span>
              <p className="text-lg mono font-semibold text-ink mt-0.5">{robot.etaSeconds}s</p>
            </div>
          )}
        </div>
      </div>

      {/* Sensor telemetry */}
      <SensorCards history={history} />

      {/* Patrol history */}
      <div className="panel">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
          <span className="label-text">PATROL HISTORY</span>
          <span className="text-2xs mono text-ink-muted">{records.length} MISSIONS</span>
        </div>
        {records.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <span className="text-xs text-ink-muted">No completed patrols yet</span>
          </div>
        ) : (
          <div className="divide-y divide-line-faint">
            {records.slice(0, 10).map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`w-2 h-2 rounded-full ${rec.status === 'COMPLETED' ? 'bg-green' : rec.status === 'WARNING' ? 'bg-amber' : 'bg-red'}`} />
                <span className="text-xs mono text-ink-muted w-20">{formatTime(rec.timestamp)}</span>
                <span className="text-xs mono text-ink">PATROL #{String(rec.id).padStart(3, '0')}</span>
                <span className={`text-2xs mono ml-auto ${rec.status === 'COMPLETED' ? 'text-green' : rec.status === 'WARNING' ? 'text-amber' : 'text-red'}`}>
                  {rec.status === 'COMPLETED' ? '✓ COMPLETE' : rec.status === 'WARNING' ? '⚠ WITH ALERTS' : '✗ ABORTED'}
                </span>
                {rec.alerts > 0 && <span className="text-2xs mono text-ink-faint">{rec.alerts} ALERTS</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
