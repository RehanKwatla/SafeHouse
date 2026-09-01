import type {
  SafetyThresholds,
  SensorReading,
  SafetyEvaluation,
  SafetyViolation,
  SafetyState,
  SoundLevel,
  RoomSensors,
} from '@/types';
import { DEFAULT_THRESHOLDS } from '@/config';

function classifySound(value: number): SoundLevel {
  if (value >= 70) return 'HIGH';
  if (value >= 55) return 'LOUD';
  return 'NORMAL';
}

function evaluateMetric(
  reading: SensorReading,
  thresholds: SafetyThresholds
): SafetyViolation[] {
  const violations: SafetyViolation[] = [];

  if (reading.temperature < thresholds.temperature.min) {
    violations.push({
      metric: 'temperature',
      message: 'Temperature below threshold',
      humanMessage: `Room too cold — ${reading.temperature.toFixed(1)}°C`,
      severity: 'warning',
      value: reading.temperature,
      threshold: thresholds.temperature.min,
    });
  } else if (reading.temperature > thresholds.temperature.max) {
    violations.push({
      metric: 'temperature',
      message: 'Temperature above threshold',
      humanMessage: `Room too hot — ${reading.temperature.toFixed(1)}°C`,
      severity: 'critical',
      value: reading.temperature,
      threshold: thresholds.temperature.max,
    });
  }

  if (reading.humidity > thresholds.humidity.max) {
    violations.push({
      metric: 'humidity',
      message: 'Humidity above threshold',
      humanMessage: `Humidity too high — ${Math.round(reading.humidity)}%`,
      severity: reading.humidity > 85 ? 'critical' : 'warning',
      value: reading.humidity,
      threshold: thresholds.humidity.max,
    });
  }

  if (reading.sound > thresholds.sound.max) {
    violations.push({
      metric: 'sound',
      message: 'Unusual sound detected',
      humanMessage: `Unusual sound — ${Math.round(reading.sound)} dB`,
      severity: reading.sound > 85 ? 'critical' : 'warning',
      value: reading.sound,
      threshold: thresholds.sound.max,
    });
  }

  return violations;
}

export function evaluateSafety(
  reading: SensorReading,
  thresholds: SafetyThresholds = DEFAULT_THRESHOLDS
): SafetyEvaluation {
  const violations = evaluateMetric(reading, thresholds);

  let state: SafetyState = 'safe';
  if (violations.some((v) => v.severity === 'critical')) {
    state = 'critical';
  } else if (violations.length > 0) {
    state = 'warning';
  }

  return { state, violations };
}

export function roomSensorsFromReading(reading: SensorReading): RoomSensors {
  return {
    ...reading,
    soundLevel: classifySound(reading.sound),
  };
}

export function classifySoundLevel(value: number): SoundLevel {
  return classifySound(value);
}

export function safetyStateFromReading(
  reading: SensorReading,
  thresholds: SafetyThresholds = DEFAULT_THRESHOLDS
): SafetyState {
  return evaluateSafety(reading, thresholds).state;
}
