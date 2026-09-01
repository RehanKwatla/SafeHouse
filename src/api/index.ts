import type {
  RobotStatusData,
  SensorReading,
  Alert,
  PatrolMission,
  SensorHistoryPoint,
  Room,
  DataSource,
  ParsedCommand,
  RoomSensors,
} from '@/types';
import { simulation } from '@/engine/simulationEngine';

// API abstraction layer — currently backed by the simulation engine.
// Each method maps to a future ESP32 HTTP endpoint. To connect real hardware,
// replace the simulation calls with fetch() to the ESP32's IP.

export const deviceApi = {
  getStatus(): RobotStatusData {
    // Future: GET /status
    return simulation.getRobot();
  },

  sendCommand(command: ParsedCommand): { accepted: boolean; message: string } {
    // Future: POST /command
    switch (command.action) {
      case 'go_to_room':
        if (command.room) {
          simulation.goToRoom(command.room);
          return { accepted: true, message: `Navigating to Room ${String(command.room).padStart(2, '0')}` };
        }
        return { accepted: false, message: 'No room specified' };
      case 'stop':
        simulation.stopRobot();
        return { accepted: true, message: 'Rover stopped' };
      case 'patrol':
        simulation.startPatrol();
        return { accepted: true, message: 'Patrol initiated' };
      case 'move':
        return { accepted: true, message: `Moving ${command.direction}` };
      default:
        return { accepted: false, message: 'Command not recognized by device' };
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
  getReadings(): SensorReading {
    // Future: GET /sensors
    return simulation.getCurrentRoomSensors();
  },

  getRoomSensors(roomId: number): RoomSensors {
    return simulation.getRoomSensors(roomId);
  },

  getRooms(): Room[] {
    return simulation.getRooms();
  },

  getHistory(): SensorHistoryPoint[] {
    return simulation.getHistory();
  },
};

export const patrolApi = {
  getPatrol(): PatrolMission {
    // Future: GET /patrol
    return simulation.getPatrol();
  },

  start(): void {
    simulation.startPatrol();
  },

  pause(): void {
    simulation.pausePatrol();
  },

  resume(): void {
    simulation.resumePatrol();
  },

  stop(): void {
    simulation.stopPatrol();
  },

  getRecords() {
    return simulation.getPatrolRecords();
  },
};

export const alertApi = {
  getAlerts(): Alert[] {
    // Future: GET /alerts
    return simulation.getAlerts();
  },

  getActive(): Alert[] {
    return simulation.getActiveAlerts();
  },

  resolve(alertId: string): void {
    simulation.resolveAlert(alertId);
  },
};
