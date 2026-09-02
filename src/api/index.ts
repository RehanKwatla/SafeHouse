import type {
  RobotStatusData,
  Alert,
  SensorHistoryPoint,
  DataSource,
  ParsedCommand,
  RoverSensors,
} from '@/types';
import { simulation } from '@/engine/simulationEngine';

// API abstraction layer — currently backed by the simulation engine.
// To connect real ESP32 hardware, replace simulation calls with fetch()
// calls to the rover's IP address.

export const deviceApi = {
  /** Future: GET /status */
  getStatus(): RobotStatusData {
    return simulation.getRobot();
  },

  /** Future: POST /command */
  sendCommand(command: ParsedCommand): { accepted: boolean; message: string } {
    switch (command.action) {
      case 'stop':
        simulation.stopRobot();
        return { accepted: true, message: 'Rover stopped' };
      case 'status':
        return { accepted: true, message: 'Status read' };
      default:
        return { accepted: true, message: 'Command noted' };
    }
  },

  setDataSource(source: DataSource): void {
    simulation.setDataSource(source);
  },

  getDataSource(): DataSource {
    return simulation.getDataSource();
  },
};

export const sensorApi = {
  /** Future: GET /sensors — returns full rover sensor reading */
  getAll(): RoverSensors {
    return simulation.getSensors();
  },

  /** Future: GET /history */
  getHistory(): SensorHistoryPoint[] {
    return simulation.getHistory();
  },
};

export const alertApi = {
  /** Future: GET /alerts */
  getAlerts(): Alert[] {
    return simulation.getAlerts();
  },

  getActive(): Alert[] {
    return simulation.getActiveAlerts();
  },

  resolve(alertId: string): void {
    simulation.resolveAlert(alertId);
  },
};
