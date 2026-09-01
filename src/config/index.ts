import type { RoomPosition, SafetyThresholds } from '@/types';

export const ROOMS_LAYOUT: Record<number, RoomPosition> = {
  1: { x: 40, y: 30, width: 180, height: 130 },
  2: { x: 280, y: 30, width: 180, height: 130 },
  3: { x: 520, y: 30, width: 180, height: 130 },
  4: { x: 280, y: 230, width: 180, height: 130 },
};

export const ROOM_ORDER = [1, 2, 3, 4];

export const ROOM_NAMES: Record<number, string> = {
  1: 'Server Room',
  2: 'Storage Area',
  3: 'Main Hall',
  4: 'Workshop',
};

export const DEFAULT_THRESHOLDS: SafetyThresholds = {
  temperature: { min: 18, max: 30 },
  humidity: { max: 75 },
  sound: { max: 70 },
};

export const MAP_DIMENSIONS = { width: 740, height: 390 };

export const MOVE_DURATION_MS = 6000;
export const SENSOR_UPDATE_INTERVAL_MS = 2000;
export const PATROL_DWELL_TIME_MS = 4000;
