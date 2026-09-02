import type {
  RoverSensors,
  RobotStatusData,
  Alert,
  SensorHistoryPoint,
  DataSource,
  SafetyViolation,
  AlertMetric,
  SoundLevel,
  AirQualityLevel,
  TiltState,
  ObstacleState,
} from '@/types';
import { DEFAULT_THRESHOLDS, SENSOR_UPDATE_INTERVAL_MS } from '@/config';

type Listener = () => void;

// ── helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomWalk(value: number, volatility: number, min: number, max: number) {
  return clamp(value + (Math.random() - 0.5) * volatility, min, max);
}

function formatLabel(d: Date): string {
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function classifySound(v: number): SoundLevel {
  if (v >= 70) return 'HIGH';
  if (v >= 55) return 'LOUD';
  return 'NORMAL';
}

function classifyAirQuality(aqi: number): AirQualityLevel {
  const t = DEFAULT_THRESHOLDS.airQuality;
  if (aqi >= t.critical) return 'CRITICAL';
  if (aqi >= t.poor)     return 'POOR';
  if (aqi >= t.moderate) return 'MODERATE';
  return 'GOOD';
}

function classifyTilt(x: number, y: number): TiltState {
  const magnitude = Math.sqrt(x * x + y * y);
  const t = DEFAULT_THRESHOLDS.tilt;
  if (magnitude >= t.unstable) return 'UNSTABLE';
  if (magnitude >= t.tilted)   return 'TILTED';
  return 'LEVEL';
}

function classifyObstacle(dist: number): ObstacleState {
  const t = DEFAULT_THRESHOLDS.obstacleDistance;
  if (dist <= t.blocked) return 'BLOCKED';
  if (dist <= t.near)    return 'NEAR';
  return 'CLEAR';
}

// ── Initial sensor state ──────────────────────────────────────────────────────

const INITIAL_SENSORS = {
  temperature:       22.4,
  humidity:          58,
  sound:             32,
  airQuality:        38,   // Good AQI
  tiltX:             1.2,  // degrees
  tiltY:            -0.8,
  smoke:             false,
  obstacleDistance:  2.6,  // metres
};

// ── Main engine ───────────────────────────────────────────────────────────────

export class SimulationEngine {
  private listeners = new Set<Listener>();
  private sensorInterval: ReturnType<typeof setInterval> | null = null;

  private raw = { ...INITIAL_SENSORS };
  private robot: RobotStatusData;
  private alerts: Alert[] = [];
  private history: SensorHistoryPoint[] = [];
  private dataSource: DataSource = 'SIMULATION';
  private startTime = Date.now();
  private alertCooldowns = new Map<string, number>();

  // Smoke event persistence: once triggered, stays active for ~30 s
  private smokeEventEnd = 0;

  constructor() {
    this.robot = {
      connected: true,
      battery: 82,
      connection: 98,
      mode: 'MONITORING',
      state: 'MONITORING',
      sensors: {
        temperature: true,
        humidity:    true,
        sound:       true,
        airQuality:  true,
        tilt:        true,
        smoke:       true,
        ultrasonic:  true,
      },
    };

    this._seedHistory();
    this._seedInitialAlerts();
  }

  // ── Seeding ─────────────────────────────────────────────────────────────────

  private _seedHistory() {
    const now = Date.now();
    let temp = 22.4, hum = 58, snd = 32, aqi = 38;
    for (let i = 90; i >= 0; i--) {
      const t = now - i * 10000; // every 10 s
      temp = clamp(temp + (Math.random() - 0.5) * 0.6, 15, 33);
      hum  = clamp(hum  + (Math.random() - 0.5) * 2,   25, 88);
      snd  = clamp(snd  + (Math.random() - 0.5) * 4,   18, 90);
      aqi  = clamp(aqi  + (Math.random() - 0.5) * 6,   5,  180);
      this.history.push({
        time: t,
        label: formatLabel(new Date(t)),
        temperature: parseFloat(temp.toFixed(1)),
        humidity:    parseFloat(hum.toFixed(1)),
        sound:       parseFloat(snd.toFixed(1)),
        airQuality:  parseFloat(aqi.toFixed(1)),
      });
    }
  }

  private _seedInitialAlerts() {
    const now = Date.now();
    // One pre-existing warning so the UI has content on first load
    this.alerts.push({
      id:          `alert-seed-1`,
      timestamp:   now - 420000,
      description: 'Humidity above threshold',
      severity:    'warning',
      state:       'RESOLVED',
      metric:      'humidity',
      value:       77,
      threshold:   DEFAULT_THRESHOLDS.humidity.max,
    });
    this.alerts.push({
      id:          `alert-seed-2`,
      timestamp:   now - 180000,
      description: 'Air quality degraded',
      severity:    'warning',
      state:       'ACTIVE',
      metric:      'airQuality',
      value:       62,
      threshold:   DEFAULT_THRESHOLDS.airQuality.moderate,
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  start() {
    if (this.sensorInterval) return;
    this.sensorInterval = setInterval(() => this._tick(), SENSOR_UPDATE_INTERVAL_MS);
  }

  stop() {
    if (this.sensorInterval) {
      clearInterval(this.sensorInterval);
      this.sensorInterval = null;
    }
  }

  // ── Simulation tick ──────────────────────────────────────────────────────────

  private _tick() {
    this._updateSensors();
    this._updateBattery();
    this._recordHistory();
    this._checkAlerts();
    this.emit();
  }

  private _updateSensors() {
    const anomaly = Math.random();

    // Temperature — slow drift, occasional spike
    this.raw.temperature = randomWalk(
      this.raw.temperature,
      anomaly < 0.03 ? 4 : 0.4,
      14, 34,
    );

    // Humidity — medium drift
    this.raw.humidity = randomWalk(
      this.raw.humidity,
      anomaly < 0.04 ? 8 : 1.5,
      25, 90,
    );

    // Sound — fast, occasional burst
    this.raw.sound = randomWalk(
      this.raw.sound,
      anomaly < 0.05 ? 22 : 3,
      18, 92,
    );

    // Air quality — slow degradation/improvement
    this.raw.airQuality = randomWalk(
      this.raw.airQuality,
      anomaly < 0.04 ? 15 : 2,
      5, 200,
    );

    // Tilt — small jitter, occasional bump
    this.raw.tiltX = randomWalk(this.raw.tiltX, anomaly < 0.03 ? 6 : 0.3, -20, 20);
    this.raw.tiltY = randomWalk(this.raw.tiltY, anomaly < 0.03 ? 6 : 0.3, -20, 20);

    // Smoke — rare event, auto-clears after ~30 s
    const now = Date.now();
    if (!this.raw.smoke && anomaly < 0.005 && now > this.smokeEventEnd) {
      this.raw.smoke = true;
      this.smokeEventEnd = now + 30000;
    }
    if (this.raw.smoke && now > this.smokeEventEnd) {
      this.raw.smoke = false;
    }

    // Obstacle distance — fluctuates during monitoring
    this.raw.obstacleDistance = randomWalk(this.raw.obstacleDistance, 0.12, 0.3, 4.0);
  }

  private _updateBattery() {
    this.robot.battery = clamp(this.robot.battery - 0.01, 0, 100);
    this.robot.connection = clamp(
      this.robot.connection + (Math.random() - 0.5) * 1.5,
      88, 100,
    );
  }

  private _recordHistory() {
    const now = Date.now();
    this.history.push({
      time:        now,
      label:       formatLabel(new Date(now)),
      temperature: parseFloat(this.raw.temperature.toFixed(1)),
      humidity:    parseFloat(this.raw.humidity.toFixed(1)),
      sound:       parseFloat(this.raw.sound.toFixed(1)),
      airQuality:  parseFloat(this.raw.airQuality.toFixed(1)),
    });
    if (this.history.length > 120) this.history.shift();
  }

  private _checkAlerts() {
    const now = Date.now();
    const COOLDOWN = 30000;

    const violations: SafetyViolation[] = [];
    const t = DEFAULT_THRESHOLDS;

    // Temperature
    if (this.raw.temperature < t.temperature.min) {
      violations.push({
        metric: 'temperature', severity: 'warning',
        message: 'Temperature below threshold',
        humanMessage: `Too cold — ${this.raw.temperature.toFixed(1)}°C`,
        value: this.raw.temperature, threshold: t.temperature.min,
      });
    } else if (this.raw.temperature > t.temperature.max) {
      violations.push({
        metric: 'temperature', severity: 'critical',
        message: 'Temperature above threshold',
        humanMessage: `Too hot — ${this.raw.temperature.toFixed(1)}°C`,
        value: this.raw.temperature, threshold: t.temperature.max,
      });
    }

    // Humidity
    if (this.raw.humidity > t.humidity.max) {
      violations.push({
        metric: 'humidity',
        severity: this.raw.humidity > 85 ? 'critical' : 'warning',
        message: 'Humidity above threshold',
        humanMessage: `Humidity too high — ${Math.round(this.raw.humidity)}%`,
        value: this.raw.humidity, threshold: t.humidity.max,
      });
    }

    // Sound
    if (this.raw.sound > t.sound.max) {
      violations.push({
        metric: 'sound',
        severity: this.raw.sound > 85 ? 'critical' : 'warning',
        message: 'Unusual sound detected',
        humanMessage: `Unusual sound — ${Math.round(this.raw.sound)} dB`,
        value: this.raw.sound, threshold: t.sound.max,
      });
    }

    // Air quality
    if (this.raw.airQuality >= t.airQuality.critical) {
      violations.push({
        metric: 'airQuality', severity: 'critical',
        message: 'Air quality critical',
        humanMessage: `Air quality critical — AQI ${Math.round(this.raw.airQuality)}`,
        value: this.raw.airQuality, threshold: t.airQuality.critical,
      });
    } else if (this.raw.airQuality >= t.airQuality.poor) {
      violations.push({
        metric: 'airQuality', severity: 'warning',
        message: 'Air quality poor',
        humanMessage: `Air quality poor — AQI ${Math.round(this.raw.airQuality)}`,
        value: this.raw.airQuality, threshold: t.airQuality.poor,
      });
    } else if (this.raw.airQuality >= t.airQuality.moderate) {
      violations.push({
        metric: 'airQuality', severity: 'warning',
        message: 'Air quality degraded',
        humanMessage: `Air quality moderate — AQI ${Math.round(this.raw.airQuality)}`,
        value: this.raw.airQuality, threshold: t.airQuality.moderate,
      });
    }

    // Tilt
    const tiltMag = Math.sqrt(this.raw.tiltX ** 2 + this.raw.tiltY ** 2);
    if (tiltMag >= t.tilt.unstable) {
      violations.push({
        metric: 'tilt', severity: 'critical',
        message: 'Rover unstable — tilt critical',
        humanMessage: `Rover unstable — ${tiltMag.toFixed(1)}° tilt`,
        value: tiltMag, threshold: t.tilt.unstable,
      });
    } else if (tiltMag >= t.tilt.tilted) {
      violations.push({
        metric: 'tilt', severity: 'warning',
        message: 'Rover tilt detected',
        humanMessage: `Tilt detected — ${tiltMag.toFixed(1)}°`,
        value: tiltMag, threshold: t.tilt.tilted,
      });
    }

    // Smoke
    if (this.raw.smoke) {
      violations.push({
        metric: 'smoke', severity: 'critical',
        message: 'Smoke detected',
        humanMessage: 'Smoke detected — immediate attention required',
        value: 1, threshold: 0,
      });
    }

    // Obstacle
    if (this.raw.obstacleDistance <= t.obstacleDistance.blocked) {
      violations.push({
        metric: 'obstacle', severity: 'warning',
        message: 'Obstacle blocking path',
        humanMessage: `Obstacle blocked — ${this.raw.obstacleDistance.toFixed(2)} m`,
        value: this.raw.obstacleDistance, threshold: t.obstacleDistance.blocked,
      });
    } else if (this.raw.obstacleDistance <= t.obstacleDistance.near) {
      violations.push({
        metric: 'obstacle', severity: 'info',
        message: 'Obstacle near',
        humanMessage: `Obstacle near — ${this.raw.obstacleDistance.toFixed(2)} m`,
        value: this.raw.obstacleDistance, threshold: t.obstacleDistance.near,
      });
    }

    // Create new alerts with cooldown per metric
    for (const v of violations) {
      if (v.severity === 'info') continue; // don't spam alerts for info
      const key = v.metric;
      const last = this.alertCooldowns.get(key) ?? 0;
      if (now - last < COOLDOWN) continue;

      this.alerts.unshift({
        id:          `alert-${now}-${key}`,
        timestamp:   now,
        description: v.message,
        severity:    v.severity,
        state:       'ACTIVE',
        metric:      v.metric as AlertMetric,
        value:       v.value,
        threshold:   v.threshold,
      });
      this.alertCooldowns.set(key, now);
    }

    // Auto-resolve alerts whose metric is now within bounds
    const violatedMetrics = new Set(violations.map((v) => v.metric));
    for (const alert of this.alerts) {
      if (alert.state === 'ACTIVE' && !violatedMetrics.has(alert.metric)) {
        alert.state = 'RESOLVED';
      }
    }

    // Cap total alerts
    if (this.alerts.length > 60) {
      this.alerts = this.alerts.slice(0, 60);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  /** Full current rover sensor reading with classified fields */
  getSensors(): RoverSensors {
    return {
      ...this.raw,
      soundLevel:      classifySound(this.raw.sound),
      airQualityLevel: classifyAirQuality(this.raw.airQuality),
      tiltState:       classifyTilt(this.raw.tiltX, this.raw.tiltY),
      obstacleState:   classifyObstacle(this.raw.obstacleDistance),
    };
  }

  getRobot(): RobotStatusData {
    return { ...this.robot };
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => a.state === 'ACTIVE');
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

  resolveAlert(alertId: string) {
    const a = this.alerts.find((x) => x.id === alertId);
    if (a) { a.state = 'RESOLVED'; this.emit(); }
  }

  setDataSource(source: DataSource) {
    this.dataSource = source;
    this.emit();
  }

  stopRobot() {
    this.robot.state = 'STOPPED';
    this.robot.mode  = 'IDLE';
    this.emit();
  }

  resumeMonitoring() {
    this.robot.state = 'MONITORING';
    this.robot.mode  = 'MONITORING';
    this.emit();
  }

  // Expose raw values for targeted command responses
  getRawSensor(key: keyof typeof this.raw) {
    return this.raw[key];
  }
}

export const simulation = new SimulationEngine();
