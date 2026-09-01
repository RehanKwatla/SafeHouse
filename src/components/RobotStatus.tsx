import { Thermometer, Droplets, AudioLines, Battery, Wifi } from 'lucide-react';
import type { RobotStatusData } from '@/types';
import { formatRoom } from '@/utils/style';

interface RobotStatusProps {
  robot: RobotStatusData;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-base-hover rounded-sm overflow-hidden">
      <div
        className={`h-full rounded-sm transition-all duration-500 ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function RobotStatus({ robot }: RobotStatusProps) {
  const stateColor =
    robot.state === 'PATROLLING' || robot.state === 'MOVING'
      ? 'text-green'
      : robot.state === 'IDLE'
      ? 'text-amber'
      : 'text-ink-muted';

  const stateDot =
    robot.state === 'PATROLLING' || robot.state === 'MOVING'
      ? 'bg-green'
      : robot.state === 'IDLE'
      ? 'bg-amber'
      : 'bg-ink-faint';

  return (
    <div className="panel p-3 space-y-3">
      {/* State */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${stateDot} ${robot.state === 'PATROLLING' ? 'animate-pulse-green' : ''}`} />
          <span className={`text-xs mono font-medium tracking-wider ${stateColor}`}>{robot.state}</span>
        </div>
        {robot.targetRoom !== null && robot.state === 'MOVING' ? (
          <p className="text-2xs mono text-ink-muted">
            {formatRoom(robot.currentRoom)} → {formatRoom(robot.targetRoom)}
          </p>
        ) : (
          <p className="text-2xs mono text-ink-muted">AT {formatRoom(robot.currentRoom)}</p>
        )}
        {robot.state === 'MOVING' && robot.etaSeconds > 0 && (
          <p className="text-2xs mono text-ink-faint mt-0.5">ETA: {robot.etaSeconds} SEC</p>
        )}
      </div>

      {/* Battery */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="label-text flex items-center gap-1">
            <Battery className="w-3 h-3" /> BATTERY
          </span>
          <span className="text-2xs mono text-ink-muted">{Math.round(robot.battery)}%</span>
        </div>
        <ProgressBar
          value={robot.battery}
          color={robot.battery > 50 ? 'bg-green' : robot.battery > 20 ? 'bg-amber' : 'bg-red'}
        />
      </div>

      {/* Connection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="label-text flex items-center gap-1">
            <Wifi className="w-3 h-3" /> CONNECTION
          </span>
          <span className="text-2xs mono text-ink-muted">{Math.round(robot.connection)}%</span>
        </div>
        <ProgressBar value={robot.connection} color="bg-green" />
      </div>

      {/* Mode */}
      <div className="flex items-center justify-between">
        <span className="label-text">MODE</span>
        <span className="text-2xs mono text-ink font-medium">{robot.mode}</span>
      </div>

      {/* Sensors */}
      <div>
        <p className="label-text mb-2">SENSORS</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-ink-muted flex items-center gap-1.5">
              <Thermometer className="w-3 h-3" /> TEMP
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${robot.sensors.temperature ? 'bg-green' : 'bg-red'}`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xs text-ink-muted flex items-center gap-1.5">
              <Droplets className="w-3 h-3" /> HUMIDITY
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${robot.sensors.humidity ? 'bg-green' : 'bg-red'}`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xs text-ink-muted flex items-center gap-1.5">
              <AudioLines className="w-3 h-3" /> SOUND
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${robot.sensors.sound ? 'bg-green' : 'bg-red'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
