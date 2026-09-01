import type {
  SensorReading,
  Room,
  RobotStatusData,
  Alert,
  PatrolMission,
  SensorHistoryPoint,
  DataSource,
  RoomSensors,
} from '@/types';
import {
  ROOMS_LAYOUT,
  ROOM_ORDER,
  ROOM_NAMES,
  DEFAULT_THRESHOLDS,
  MOVE_DURATION_MS,
  SENSOR_UPDATE_INTERVAL_MS,
  PATROL_DWELL_TIME_MS,
} from '@/config';
import { evaluateSafety, roomSensorsFromReading, safetyStateFromReading } from './safetyEngine';

type Listener = () => void;

function roomCenter(roomId: number) {
  const pos = ROOMS_LAYOUT[roomId];
  return { x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomWalk(value: number, volatility: number, min: number, max: number) {
  const next = value + (Math.random() - 0.5) * volatility;
  return clamp(next, min, max);
}

function formatLabel(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Initial sensor state per room — varied so we get interesting conditions
const INITIAL_ROOM_SENSORS: Record<number, SensorReading> = {
  1: { temperature: 22.4, humidity: 61, sound: 32 },
  2: { temperature: 16.2, humidity: 73, sound: 58 },
  3: { temperature: 24.1, humidity: 45, sound: 28 },
  4: { temperature: 15.8, humidity: 81, sound: 82 },
};

export class SimulationEngine {
  private listeners = new Set<Listener>();
  private sensorInterval: ReturnType<typeof setInterval> | null = null;
  private patrolTimer: ReturnType<typeof setTimeout> | null = null;

  private roomSensors: Record<number, SensorReading> = structuredClone(INITIAL_ROOM_SENSORS);
  private robot: RobotStatusData;
  private alerts: Alert[] = [];
  private patrol: PatrolMission;
  private history: SensorHistoryPoint[] = [];
  private dataSource: DataSource = 'SIMULATION';
  private startTime = Date.now();
  private alertCooldowns = new Map<string, number>();
  private patrolMissionCount = 27;
  private isPatrolPaused = false;
  private moveStartTime = 0;
  private moveFromRoom = 1;
  private moveToRoom = 2;
  private patrolRecords: { id: number; timestamp: number; status: 'COMPLETED' | 'WARNING' | 'ABORTED'; alerts: number }[] = [];

  constructor() {
    const center = roomCenter(1);
    this.robot = {
      connected: true,
      battery: 82,
      connection: 98,
      mode: 'PATROL',
      state: 'PATROLLING',
      currentRoom: 2,
      targetRoom: 3,
      position: center,
      etaSeconds: 12,
      sensors: { temperature: true, humidity: true, sound: true, ultrasonic: true },
      obstacleDistance: 2.4,
      obstacleDetected: false,
      speed: 0.24,
    };

    this.patrol = {
      id: this.patrolMissionCount,
      startedAt: Date.now() - 120000,
      rooms: [...ROOM_ORDER],
      completedRooms: [1, 2],
      currentRoom: 2,
      targetRoom: 3,
      progress: 50,
      status: 'IN_PROGRESS',
    };

    this.seedHistory();
    this.generateInitialAlerts();
  }

  private seedHistory() {
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      const time = now - i * 60000;
      const date = new Date(time);
      this.history.push({
        time,
        label: formatLabel(date),
        temperature: clamp(22 + (Math.random() - 0.5) * 4, 15, 30),
        humidity: clamp(60 + (Math.random() - 0.5) * 20, 30, 85),
        sound: clamp(35 + (Math.random() - 0.5) * 30, 20, 90),
      });
    }
  }

  private generateInitialAlerts() {
    const now = Date.now();
    const eval2 = evaluateSafety(this.roomSensors[2], DEFAULT_THRESHOLDS);
    const eval4 = evaluateSafety(this.roomSensors[4], DEFAULT_THRESHOLDS);

    if (eval2.violations[0]) {
      this.alerts.push({
        id: `alert-${now - 300000}`,
        timestamp: now - 300000,
        room: 2,
        description: eval2.violations[0].message,
        severity: eval2.violations[0].severity,
        state: 'ACTIVE',
        metric: eval2.violations[0].metric,
        value: eval2.violations[0].value,
        threshold: eval2.violations[0].threshold,
      });
    }
    if (eval4.violations[0]) {
      this.alerts.push({
        id: `alert-${now - 180000}`,
        timestamp: now - 180000,
        room: 4,
        description: eval4.violations[0].message,
        severity: eval4.violations[0].severity,
        state: 'ACTIVE',
        metric: eval4.violations[0].metric,
        value: eval4.violations[0].value,
        threshold: eval4.violations[0].threshold,
      });
    }
    // A resolved alert
    this.alerts.push({
      id: `alert-${now - 600000}`,
      timestamp: now - 600000,
      room: 3,
      description: 'Humidity above threshold',
      severity: 'warning',
      state: 'RESOLVED',
      metric: 'humidity',
      value: 76,
      threshold: 75,
    });

    this.alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  start() {
    if (this.sensorInterval) return;
    this.sensorInterval = setInterval(() => this.tick(), SENSOR_UPDATE_INTERVAL_MS);
    this.scheduleNextPatrolStep();
  }

  stop() {
    if (this.sensorInterval) {
      clearInterval(this.sensorInterval);
      this.sensorInterval = null;
    }
    if (this.patrolTimer) {
      clearTimeout(this.patrolTimer);
      this.patrolTimer = null;
    }
  }

  private tick() {
    this.updateSensors();
    this.updateRobotPosition();
    this.updatePatrolProgress();
    this.updateBattery();
    this.recordHistoryPoint();
    this.checkAlerts();
    this.emit();
  }

  private updateSensors() {
    for (const roomId of ROOM_ORDER) {
  const s = this.roomSensors[roomId];
      // Occasionally inject anomalous conditions
      const anomalyChance = Math.random();
      let tempVolatility = 0.4;
      let humidityVolatility = 1.5;
      let soundVolatility = 3;

      if (anomalyChance < 0.03) {
        tempVolatility = 3;
      }
      if (anomalyChance < 0.04 && anomalyChance > 0.02) {
        humidityVolatility = 8;
      }
      if (anomalyChance < 0.05 && anomalyChance > 0.03) {
        soundVolatility = 20;
      }

      this.roomSensors[roomId] = {
        temperature: randomWalk(s.temperature, tempVolatility, 14, 34),
        humidity: randomWalk(s.humidity, humidityVolatility, 30, 90),
        sound: randomWalk(s.sound, soundVolatility, 20, 95),
      };
    }
  }

  private updateRobotPosition() {
    if (this.robot.state !== 'MOVING' || this.robot.targetRoom === null) {
      // If patrolling but not moving, stay at current room center
      if (this.robot.state === 'PATROLLING' && this.robot.currentRoom) {
        const c = roomCenter(this.robot.currentRoom);
        this.robot.position = c;
      }
      this.robot.speed = 0;
      this.robot.obstacleDistance = clamp(2.2 + (Math.random() - 0.5) * 0.4, 1.8, 3.0);
      this.robot.obstacleDetected = false;
      return;
    }

    const elapsed = Date.now() - this.moveStartTime;
    const progress = clamp(elapsed / MOVE_DURATION_MS, 0, 1);
    const from = roomCenter(this.moveFromRoom);
    const to = roomCenter(this.moveToRoom);
    const eased = 1 - Math.pow(1 - progress, 3);

    this.robot.position = {
      x: from.x + (to.x - from.x) * eased,
      y: from.y + (to.y - from.y) * eased,
    };
    this.robot.etaSeconds = Math.max(0, Math.ceil((1 - progress) * (MOVE_DURATION_MS / 1000)));
    this.robot.speed = 0.24 + (Math.random() - 0.5) * 0.04;
    
    // Dynamic obstacle detection during movement
    const dist = clamp(1.4 + Math.sin(progress * Math.PI) * 1.5 + (Math.random() - 0.5) * 0.3, 0.8, 2.8);
    this.robot.obstacleDistance = dist;
    this.robot.obstacleDetected = dist < 1.2;

    if (progress >= 1) {
      this.robot.currentRoom = this.moveToRoom;
      this.robot.targetRoom = null;
      this.robot.state = 'PATROLLING';
      this.robot.etaSeconds = 0;
      this.robot.speed = 0;
      this.onArriveAtRoom(this.moveToRoom);
    }
  }

  private updatePatrolProgress() {
    if (this.patrol.status !== 'IN_PROGRESS') return;
    const total = this.patrol.rooms.length;
    const completed = this.patrol.completedRooms.length;
    const currentIdx = this.patrol.rooms.indexOf(this.robot.currentRoom);
    const partial = currentIdx >= 0 && this.robot.state === 'PATROLLING' ? 0.5 : 0;
    this.patrol.progress = clamp(((completed + partial) / total) * 100, 0, 100);
    this.patrol.currentRoom = this.robot.currentRoom;
    this.patrol.targetRoom = this.robot.targetRoom;

    if (completed >= total) {
      this.completePatrol();
    }
  }

  private completePatrol() {
    this.patrol.status = 'COMPLETED';
    const hadAlerts = this.alerts.some(
      (a) => a.state === 'ACTIVE' && a.timestamp > this.patrol.startedAt
    );
    this.patrolRecords.unshift({
      id: this.patrol.id,
      timestamp: Date.now(),
      status: hadAlerts ? 'WARNING' : 'COMPLETED',
      alerts: this.alerts.filter((a) => a.timestamp > this.patrol.startedAt).length,
    });
    this.emit();
    // Auto-start next patrol after a brief pause
    setTimeout(() => this.startPatrol(), 3000);
  }

  private updateBattery() {
    if (this.robot.state === 'MOVING' || this.robot.state === 'PATROLLING') {
      this.robot.battery = clamp(this.robot.battery - 0.02, 0, 100);
    }
    // Small connection fluctuation
    this.robot.connection = clamp(this.robot.connection + (Math.random() - 0.5) * 2, 90, 100);
  }

  private recordHistoryPoint() {
    const now = Date.now();
    const currentSensors = this.roomSensors[this.robot.currentRoom];
    this.history.push({
      time: now,
      label: formatLabel(new Date(now)),
      temperature: currentSensors.temperature,
      humidity: currentSensors.humidity,
      sound: currentSensors.sound,
    });
    // Keep last 120 points
    if (this.history.length > 120) this.history.shift();
  }

  private checkAlerts() {
    const now = Date.now();
    const COOLDOWN_MS = 30000;

    for (const roomId of ROOM_ORDER) {
      const reading = this.roomSensors[roomId];
      const evalResult = evaluateSafety(reading, DEFAULT_THRESHOLDS);

      for (const violation of evalResult.violations) {
        const key = `${roomId}-${violation.metric}`;
        const lastTime = this.alertCooldowns.get(key);
        if (lastTime && now - lastTime < COOLDOWN_MS) continue;

        this.alerts.unshift({
          id: `alert-${now}-${roomId}-${violation.metric}`,
          timestamp: now,
          room: roomId,
          description: violation.message,
          severity: violation.severity,
          state: 'ACTIVE',
          metric: violation.metric,
          value: violation.value,
          threshold: violation.threshold,
        });
        this.alertCooldowns.set(key, now);
      }

      // Auto-resolve alerts for rooms that are now safe
      if (evalResult.state === 'safe') {
        for (const alert of this.alerts) {
          if (alert.room === roomId && alert.state === 'ACTIVE' && alert.metric !== 'system') {
            // Check if the specific metric is now within bounds
            const stillViolating = evalResult.violations.some((v) => v.metric === alert.metric);
            if (!stillViolating) {
              alert.state = 'RESOLVED';
            }
          }
        }
      }
    }

    // Keep alerts manageable
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
  }

  private scheduleNextPatrolStep() {
    if (this.patrol.status !== 'IN_PROGRESS' || this.isPatrolPaused) return;

    if (this.robot.state === 'PATROLLING' && this.robot.targetRoom === null) {
      // Dwell at current room, then move to next
      this.patrolTimer = setTimeout(() => {
        const currentIdx = this.patrol.rooms.indexOf(this.robot.currentRoom);
        const nextIdx = currentIdx + 1;
        if (nextIdx < this.patrol.rooms.length) {
          this.navigateTo(this.patrol.rooms[nextIdx]);
        }
      }, PATROL_DWELL_TIME_MS);
    }
  }

  private onArriveAtRoom(roomId: number) {
    if (!this.patrol.completedRooms.includes(roomId)) {
      this.patrol.completedRooms.push(roomId);
    }
    this.scheduleNextPatrolStep();
  }

  private navigateTo(roomId: number) {
    this.moveFromRoom = this.robot.currentRoom;
    this.moveToRoom = roomId;
    this.moveStartTime = Date.now();
    this.robot.state = 'MOVING';
    this.robot.targetRoom = roomId;
    this.robot.mode = 'PATROL';
    this.emit();
  }

  // Public control methods
  startPatrol() {
    this.patrolMissionCount++;
    this.patrol = {
      id: this.patrolMissionCount,
      startedAt: Date.now(),
      rooms: [...ROOM_ORDER],
      completedRooms: [],
      currentRoom: this.robot.currentRoom,
      targetRoom: null,
      progress: 0,
      status: 'IN_PROGRESS',
    };
    this.isPatrolPaused = false;
    this.robot.mode = 'PATROL';
    this.robot.state = 'PATROLLING';
    this.scheduleNextPatrolStep();
    this.emit();
  }

  pausePatrol() {
    this.isPatrolPaused = true;
    if (this.patrolTimer) {
      clearTimeout(this.patrolTimer);
      this.patrolTimer = null;
    }
    if (this.patrol.status === 'IN_PROGRESS') {
      this.patrol.status = 'PAUSED';
    }
    this.robot.state = 'IDLE';
    this.emit();
  }

  resumePatrol() {
    this.isPatrolPaused = false;
    if (this.patrol.status === 'PAUSED') {
      this.patrol.status = 'IN_PROGRESS';
    }
    this.robot.state = 'PATROLLING';
    this.scheduleNextPatrolStep();
    this.emit();
  }

  stopPatrol() {
    this.isPatrolPaused = false;
    if (this.patrolTimer) {
      clearTimeout(this.patrolTimer);
      this.patrolTimer = null;
    }
    this.patrol.status = 'STOPPED';
    this.robot.state = 'STOPPED';
    this.robot.mode = 'IDLE';
    this.robot.targetRoom = null;
    this.emit();
  }

  goToRoom(roomId: number) {
    if (!ROOM_ORDER.includes(roomId)) return;
    this.robot.mode = 'MANUAL';
    this.navigateTo(roomId);
  }

  stopRobot() {
    if (this.patrolTimer) {
      clearTimeout(this.patrolTimer);
      this.patrolTimer = null;
    }
    this.robot.state = 'STOPPED';
    this.robot.mode = 'IDLE';
    this.robot.targetRoom = null;
    this.patrol.status = 'STOPPED';
    this.emit();
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.state = 'RESOLVED';
      this.emit();
    }
  }

  setDataSource(source: DataSource) {
    this.dataSource = source;
    this.emit();
  }

  // Getters
  getRooms(): Room[] {
    return ROOM_ORDER.map((id) => {
      const reading = this.roomSensors[id];
      return {
        id,
        name: ROOM_NAMES[id],
        position: ROOMS_LAYOUT[id],
        sensors: roomSensorsFromReading(reading),
        safety: safetyStateFromReading(reading),
      };
    });
  }

  getRobot(): RobotStatusData {
    return { ...this.robot, position: { ...this.robot.position } };
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => a.state === 'ACTIVE');
  }

  getPatrol(): PatrolMission {
    return { ...this.patrol };
  }

  getHistory(): SensorHistoryPoint[] {
    return [...this.history];
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  getPatrolRecords() {
    return [...this.patrolRecords];
  }

  getRoomSensors(roomId: number): RoomSensors {
    return roomSensorsFromReading(this.roomSensors[roomId]);
  }

  getCurrentRoomSensors(): RoomSensors {
    return roomSensorsFromReading(this.roomSensors[this.robot.currentRoom]);
  }
}

export const simulation = new SimulationEngine();
