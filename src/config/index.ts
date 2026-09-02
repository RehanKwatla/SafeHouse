import type { SafetyThresholds } from '@/types';

export const DEFAULT_THRESHOLDS: SafetyThresholds = {
  temperature:       { min: 18, max: 30 },
  humidity:          { max: 75 },
  sound:             { max: 70 },
  airQuality:        { moderate: 50, poor: 100, critical: 200 },
  tilt:              { tilted: 5, unstable: 15 },
  obstacleDistance:  { near: 1.0, blocked: 0.4 },
};

export const SENSOR_UPDATE_INTERVAL_MS = 2000;
