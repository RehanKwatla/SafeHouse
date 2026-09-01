import type { RoomPosition, SafetyThresholds } from '@/types';

// ── Original 2D layout (used by simulation engine — do not modify) ──

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

// ── Isometric facility map configuration ──

export interface IsoRoomDef {
  id: number;
  gx: number;
  gy: number;
  gw: number;
  gd: number;
  wh: number;
}

export const ISO_ROOMS: IsoRoomDef[] = [
  { id: 1, gx: 0.5, gy: 0.3, gw: 1.6, gd: 1.2, wh: 0.55 },
  { id: 2, gx: 2.5, gy: 0.3, gw: 1.6, gd: 1.2, wh: 0.55 },
  { id: 3, gx: 4.5, gy: 0.3, gw: 1.6, gd: 1.2, wh: 0.55 },
  { id: 4, gx: 2.5, gy: 2.0, gw: 1.6, gd: 1.2, wh: 0.55 },
];

export const ISO_CORRIDORS = [
  { gx: 2.1, gy: 0.6, gw: 0.4, gd: 0.6, wh: 0.3 },
  { gx: 4.1, gy: 0.6, gw: 0.4, gd: 0.6, wh: 0.3 },
  { gx: 2.8, gy: 1.5, gw: 0.7, gd: 0.5, wh: 0.3 },
];

export const ISO_PROJ = {
  cx: 380,
  cy: 30,
  sx: 72,
  sy: 36,
  sz: 42,
};

/** Convert isometric grid coords to SVG pixel coords */
export function isoToSvg(gx: number, gy: number, gz: number = 0): [number, number] {
  return [
    ISO_PROJ.cx + (gx - gy) * ISO_PROJ.sx,
    ISO_PROJ.cy + (gx + gy) * ISO_PROJ.sy - gz * ISO_PROJ.sz,
  ];
}

/** Convert original 2D simulation coords to isometric grid coords */
export function simToGrid(rx: number, ry: number): [number, number] {
  const gx = 1.3 + (rx - 130) / 480 * 4;
  const gy = 0.9 + (ry - 95) / 200 * 1.7;
  return [gx, gy];
}

/** Get isometric room center in SVG space */
export function isoRoomCenter(roomId: number): [number, number] {
  const r = ISO_ROOMS.find((r) => r.id === roomId);
  if (!r) return [0, 0];
  return isoToSvg(r.gx + r.gw / 2, r.gy + r.gd / 2, r.wh);
}

/** Get robot position mapped to isometric SVG space */
export function robotToSvg(rx: number, ry: number): [number, number] {
  const [gx, gy] = simToGrid(rx, ry);
  return isoToSvg(gx, gy, 0.55);
}
