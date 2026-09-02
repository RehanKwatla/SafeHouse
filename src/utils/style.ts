import type { Severity, AlertState } from '@/types';

export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'text-red';
    case 'warning':  return 'text-amber';
    case 'info':     return 'text-ink-muted';
  }
}

export function alertStateColor(state: AlertState): string {
  switch (state) {
    case 'ACTIVE':       return 'text-red';
    case 'RESOLVED':     return 'text-green';
    case 'ACKNOWLEDGED': return 'text-amber';
  }
}

export function severityDot(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-red';
    case 'warning':  return 'bg-amber';
    case 'info':     return 'bg-ink-faint';
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeSec(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
