import type { SafetyState, Severity, AlertState } from '@/types';

export function safetyColor(state: SafetyState): string {
  switch (state) {
    case 'safe': return 'text-green';
    case 'warning': return 'text-amber';
    case 'critical': return 'text-red';
  }
}

export function safetyBorder(state: SafetyState): string {
  switch (state) {
    case 'safe': return 'border-l-green';
    case 'warning': return 'border-l-amber';
    case 'critical': return 'border-l-red';
  }
}

export function safetyBg(state: SafetyState): string {
  switch (state) {
    case 'safe': return 'bg-green-tint';
    case 'warning': return 'bg-amber-tint';
    case 'critical': return 'bg-red-tint';
  }
}

export function safetyStroke(state: SafetyState): string {
  switch (state) {
    case 'safe': return '#9CFF32';
    case 'warning': return '#F2B84B';
    case 'critical': return '#FF3B30';
  }
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'text-red';
    case 'warning': return 'text-amber';
    case 'info': return 'text-ink-muted';
  }
}

export function severityBg(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-red-tint text-red';
    case 'warning': return 'bg-amber-tint text-amber';
    case 'info': return 'bg-base-hover text-ink-muted';
  }
}

export function alertStateColor(state: AlertState): string {
  switch (state) {
    case 'ACTIVE': return 'text-red';
    case 'RESOLVED': return 'text-green';
    case 'ACKNOWLEDGED': return 'text-amber';
  }
}

export function severityDot(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-red';
    case 'warning': return 'bg-amber';
    case 'info': return 'bg-ink-faint';
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatTimeSec(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatRoom(roomId: number): string {
  return `ROOM ${String(roomId).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}
