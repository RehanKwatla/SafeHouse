// Core domain types for SAFEROOM

export type SafetyState = 'safe' | 'warning' | 'critical';
export type RobotMode = 'MONITORING' | 'IDLE' | 'MANUAL' | 'EMERGENCY';
export type RobotState = 'MONITORING' | 'IDLE' | 'MOVING' | 'STOPPED' | 'CHARGING';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING';
export type DataSource = 'LIVE' | 'SIMULATION';
export type Severity = 'critical' | 'warning' | 'info';
export type AlertState = 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
export type SoundLevel = 'NORMAL' | 'LOUD' | 'HIGH';

// Air quality states derived from AQI value
export type AirQualityLevel = 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL';

// Tilt / orientation states
export type TiltState = 'LEVEL' | 'TILTED' | 'UNSTABLE';

// Smoke detection state
export type SmokeState = 'CLEAR' | 'DETECTED';

// Obstacle detection state
export type ObstacleState = 'CLEAR' | 'NEAR' | 'BLOCKED';

// ── Core sensor reading (base sensors on rover) ──
export interface SensorReading {
  temperature: number;   // °C
  humidity: number;      // %
  sound: number;         // dB
  airQuality: number;    // AQI index (0–500 scale, simulated)
  tiltX: number;         // degrees — roll axis
  tiltY: number;         // degrees — pitch axis
  smoke: boolean;        // true = smoke detected
  obstacleDistance: number; // metres (ultrasonic)
}

// Extended reading with derived/classified fields
export interface RoverSensors extends SensorReading {
  soundLevel: SoundLevel;
  airQualityLevel: AirQualityLevel;
  tiltState: TiltState;
  obstacleState: ObstacleState;
}

// ── Legacy room sensor shape kept for safetyEngine compat ──
export interface RoomSensors {
  temperature: number;
  humidity: number;
  sound: number;
  soundLevel: SoundLevel;
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
  sensors: {
    temperature: boolean;
    humidity: boolean;
    sound: boolean;
    airQuality: boolean;
    tilt: boolean;
    smoke: boolean;
    ultrasonic: boolean;
  };
}

// Alert metric now covers all sensor types
export type AlertMetric =
  | 'temperature'
  | 'humidity'
  | 'sound'
  | 'airQuality'
  | 'tilt'
  | 'smoke'
  | 'obstacle'
  | 'system';

export interface Alert {
  id: string;
  timestamp: number;
  description: string;
  severity: Severity;
  state: AlertState;
  metric: AlertMetric;
  value?: number;
  threshold?: number;
}

export type CommandAction =
  | 'check_sensors'
  | 'check_air'
  | 'check_tilt'
  | 'check_smoke'
  | 'check_obstacle'
  | 'stop'
  | 'move'
  | 'status'
  | 'report'
  | 'unknown';

export type MoveDirection = 'forward' | 'backward' | 'left' | 'right';

export interface ParsedCommand {
  action: CommandAction;
  direction?: MoveDirection;
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
  airQuality: { moderate: number; poor: number; critical: number };
  tilt: { tilted: number; unstable: number };
  obstacleDistance: { near: number; blocked: number };
}

export interface SensorHistoryPoint {
  time: number;
  label: string;
  temperature: number;
  humidity: number;
  sound: number;
  airQuality: number;
}

export interface SafetyEvaluation {
  state: SafetyState;
  violations: SafetyViolation[];
}

export interface SafetyViolation {
  metric: AlertMetric;
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
