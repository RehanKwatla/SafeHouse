import type { ParsedCommand, CommandAction, MoveDirection } from '@/types';

const ROOM_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

function extractRoom(text: string): number | undefined {
  const digitMatch = text.match(/\broom\s*(\d)\b/i);
  if (digitMatch) return parseInt(digitMatch[1], 10);

  const wordMatch = text.match(/\broom\s*(one|two|three|four)\b/i);
  if (wordMatch && wordMatch[1] in ROOM_WORDS) {
    return ROOM_WORDS[wordMatch[1]];
  }

  const bareDigit = text.match(/\b(\d)\b/);
  if (bareDigit) return parseInt(bareDigit[1], 10);

  return undefined;
}

function extractDirection(text: string): MoveDirection | undefined {
  if (/\bforward\b|\bahead\b|\bstraight\b/i.test(text)) return 'forward';
  if (/\bbackward\b|\bback\b|\breverse\b/i.test(text)) return 'backward';
  if (/\bleft\b/i.test(text)) return 'left';
  if (/\bright\b/i.test(text)) return 'right';
  return undefined;
}

export function parseCommand(raw: string): ParsedCommand {
  const text = raw.trim();
  const lower = text.toLowerCase();

  if (/\bstop\b|\bhalt\b|\babort\b/i.test(lower)) {
    return { action: 'stop', raw: text };
  }

  if (/\bcheck\b|\binspect\b|\bexamine\b|\breport\s+(on\s+)?room\b/i.test(lower)) {
    const room = extractRoom(lower);
    return { action: 'check_room', room, raw: text };
  }

  if (/\bgo\s*to\b|\bnavigate\b|\bhead\s*to\b|\bmove\s*to\b|\bproceed\s*to\b/i.test(lower)) {
    const room = extractRoom(lower);
    return { action: 'go_to_room', room, raw: text };
  }

  if (/\bpatrol\b|\bsweep\b|\bround\b/i.test(lower)) {
    if (/\ball\b|\bevery\b/i.test(lower)) {
      return { action: 'patrol', rooms: [1, 2, 3, 4], raw: text };
    }
    return { action: 'patrol', rooms: [1, 2, 3, 4], raw: text };
  }

  if (/\bmove\b|\bdrive\b|\bgo\b/i.test(lower)) {
    const direction = extractDirection(lower);
    if (direction) {
      return { action: 'move', direction, raw: text };
    }
  }

  if (/\bstatus\b|\bstate\b|\bcondition\b|\bhow\s+(are|is)\b/i.test(lower)) {
    return { action: 'status', raw: text };
  }

  if (/\breport\b|\bsummary\b|\bbriefing\b/i.test(lower)) {
    return { action: 'report', raw: text };
  }

  return { action: 'unknown', raw: text };
}
