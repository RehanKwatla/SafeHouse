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
  code: string;
  type: string;
}

export const ISO_ROOMS: IsoRoomDef[] = [
  { id: 1, gx: 0.8, gy: 0.4, gw: 1.8, gd: 1.4, wh: 0.6, code: 'SRV-01', type: 'SERVER INFRASTRUCTURE' },
  { id: 2, gx: 3.1, gy: 0.4, gw: 1.8, gd: 1.4, wh: 0.6, code: 'STR-02', type: 'STORAGE DEPOT' },
  { id: 3, gx: 5.4, gy: 0.4, gw: 1.8, gd: 1.4, wh: 0.6, code: 'HAL-03', type: 'MAIN CONCOURSE' },
  { id: 4, gx: 3.1, gy: 2.3, gw: 1.8, gd: 1.4, wh: 0.6, code: 'WKS-04', type: 'MAINTENANCE WORKSHOP' },
];

export interface IsoCorridorDef {
  gx: number;
  gy: number;
  gw: number;
  gd: number;
  wh: number;
}

export const ISO_CORRIDORS: IsoCorridorDef[] = [
  // Horizontal corridor connecting Room 1 to Room 2
  { gx: 2.6, gy: 0.85, gw: 0.5, gd: 0.5, wh: 0.35 },
  // Horizontal corridor connecting Room 2 to Room 3
  { gx: 4.9, gy: 0.85, gw: 0.5, gd: 0.5, wh: 0.35 },
  // Vertical corridor connecting Room 2 to Room 4
  { gx: 3.65, gy: 1.8, gw: 0.7, gd: 0.5, wh: 0.35 },
];

export interface WaypointDef {
  id: number;
  label: string;
  roomId: number;
  gx: number;
  gy: number;
}

export const ISO_WAYPOINTS: WaypointDef[] = [
  { id: 1, label: 'W01', roomId: 1, gx: 1.7, gy: 1.1 },
  { id: 2, label: 'W02', roomId: 2, gx: 4.0, gy: 1.1 },
  { id: 3, label: 'W03', roomId: 3, gx: 6.3, gy: 1.1 },
  { id: 4, label: 'W04', roomId: 4, gx: 4.0, gy: 3.0 },
];

export const ISO_PROJ = {
  cx: 480,
  cy: 70,
  sx: 74,
  sy: 37,
  sz: 44,
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
  const gx = 1.7 + ((rx - 130) / 480) * 4.6;
  const gy = 1.1 + ((ry - 95) / 200) * 1.9;
  return [gx, gy];
}

/** Get isometric room center in SVG space */
export function isoRoomCenter(roomId: number): [number, number] {
  const r = ISO_ROOMS.find((r) => r.id === roomId);
  if (!r) return [0, 0];
  return isoToSvg(r.gx + r.gw / 2, r.gy + r.gd / 2, r.wh);
}

/** Get isometric waypoint position in SVG space */
export function isoWaypointCenter(waypointId: number): [number, number] {
  const wp = ISO_WAYPOINTS.find((w) => w.id === waypointId);
  if (!wp) return [0, 0];
  return isoToSvg(wp.gx, wp.gy, 0.4);
}

/** Get robot position mapped to isometric SVG space */
export function robotToSvg(rx: number, ry: number): [number, number] {
  const [gx, gy] = simToGrid(rx, ry);
  return isoToSvg(gx, gy, 0.55);
}
