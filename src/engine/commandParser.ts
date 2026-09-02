import type { ParsedCommand, CommandAction, MoveDirection } from '@/types';

function extractDirection(text: string): MoveDirection | undefined {
  if (/\bforward\b|\bahead\b|\bstraight\b/i.test(text)) return 'forward';
  if (/\bbackward\b|\bback\b|\breverse\b/i.test(text))  return 'backward';
  if (/\bleft\b/i.test(text))  return 'left';
  if (/\bright\b/i.test(text)) return 'right';
  return undefined;
}

export function parseCommand(raw: string): ParsedCommand {
  const text  = raw.trim();
  const lower = text.toLowerCase();

  // Stop / halt
  if (/\bstop\b|\bhalt\b|\babort\b/i.test(lower)) {
    return { action: 'stop', raw: text };
  }

  // Status / state
  if (/\bstatus\b|\bstate\b|\bcondition\b|\bhow\s+(are|is)\b/i.test(lower)) {
    return { action: 'status', raw: text };
  }

  // Full report / summary
  if (/\breport\b|\bsummary\b|\bbriefing\b/i.test(lower)) {
    return { action: 'report', raw: text };
  }

  // Air quality
  if (/\bair\b|\bair\s*quality\b|\baqi\b|\bair\s*quality\b/i.test(lower)) {
    return { action: 'check_air', raw: text };
  }

  // Tilt / orientation / accelerometer
  if (/\btilt\b|\borientation\b|\broll\b|\bpitch\b|\bangle\b|\baccelerom/i.test(lower)) {
    return { action: 'check_tilt', raw: text };
  }

  // Smoke
  if (/\bsmoke\b|\bfire\b|\bdetect/i.test(lower)) {
    return { action: 'check_smoke', raw: text };
  }

  // Obstacle / distance / ultrasonic
  if (/\bobstacle\b|\bdistance\b|\bultra\b|\bpath\b|\bclear\b/i.test(lower)) {
    return { action: 'check_obstacle', raw: text };
  }

  // General sensor check
  if (/\bcheck\b|\binspect\b|\bsensor\b|\btemperature\b|\bhumidity\b|\bsound\b/i.test(lower)) {
    return { action: 'check_sensors', raw: text };
  }

  // Manual movement
  if (/\bmove\b|\bdrive\b|\bgo\b/i.test(lower)) {
    const direction = extractDirection(lower);
    if (direction) return { action: 'move', direction, raw: text };
  }

  return { action: 'unknown', raw: text };
}
