// Core domain types for SAFEROOM

export type SafetyState = 'safe' | 'warning' | 'critical';
export type RobotMode = 'PATROL' | 'IDLE' | 'MANUAL' | 'EMERGENCY';
export type RobotState = 'PATROLLING' | 'IDLE' | 'MOVING' | 'STOPPED' | 'CHARGING';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING';
export type DataSource = 'LIVE' | 'SIMULATION';
export type Severity = 'critical' | 'warning' | 'info';
export type AlertState = 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
export type SoundLevel = 'NORMAL' | 'LOUD' | 'HIGH';

export interface SensorReading {
  temperature: number;
  humidity: number;
  sound: number;
}

export interface RoomSensors extends SensorReading {
  soundLevel: SoundLevel;
}

export interface RoomPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Room {
  id: number;
  name: string;
  position: RoomPosition;
  sensors: RoomSensors;
  safety: SafetyState;
}

export interface RobotPosition {
  x: number;
  y: number;
}

export interface RobotStatusData {
  connected: boolean;
  battery: number;
  connection: number;
  mode: RobotMode;
  state: RobotState;
  currentRoom: number;
  targetRoom: number | null;
  position: RobotPosition;
  etaSeconds: number;
  sensors: {
    temperature: boolean;
    humidity: boolean;
    sound: boolean;
  };
}

export interface Alert {
  id: string;
  timestamp: number;
  room: number;
  description: string;
  severity: Severity;
  state: AlertState;
  metric: 'temperature' | 'humidity' | 'sound' | 'system';
  value?: number;
  threshold?: number;
}

export interface PatrolMission {
  id: number;
  startedAt: number;
  rooms: number[];
  completedRooms: number[];
  currentRoom: number | null;
  targetRoom: number | null;
  progress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'STOPPED';
}

export interface PatrolRecord {
  id: number;
  timestamp: number;
  durationSec: number;
  rooms: number[];
  status: 'COMPLETED' | 'WARNING' | 'ABORTED';
  alertsTriggered: number;
}

export type CommandAction =
  | 'check_room'
  | 'go_to_room'
  | 'patrol'
  | 'stop'
  | 'move'
  | 'status'
  | 'report'
  | 'unknown';

export type MoveDirection = 'forward' | 'backward' | 'left' | 'right';

export interface ParsedCommand {
  action: CommandAction;
  room?: number;
  rooms?: number[];
  direction?: MoveDirection;
  duration?: number;
  raw: string;
}

export interface ConsoleMessage {
  id: string;
  source: 'SYS' | 'YOU' | 'ERR';
  text: string;
  timestamp: number;
  kind?: 'info' | 'success' | 'warning' | 'critical';
}

export interface SafetyThresholds {
  temperature: { min: number; max: number };
  humidity: { max: number };
  sound: { max: number };
}

export interface SensorHistoryPoint {
  time: number;
  label: string;
  temperature: number;
  humidity: number;
  sound: number;
}

export interface SafetyEvaluation {
  state: SafetyState;
  violations: SafetyViolation[];
}

export interface SafetyViolation {
  metric: keyof SafetyThresholds;
  message: string;
  humanMessage: string;
  severity: Severity;
  value: number;
  threshold: number;
}

export interface SystemStatusData {
  online: boolean;
  uptime: number;
  currentTime: number;
  link: number;
  dataSource: DataSource;
  alertCount: number;
}
