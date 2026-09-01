import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Mic, Volume2, VolumeX } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { useSpeechRecognition, useSpeechSynthesis, type MicState } from '@/hooks/useSpeech';
import { parseCommand } from '@/engine/commandParser';
import { deviceApi } from '@/api';
import type { ConsoleMessage, ParsedCommand } from '@/types';

interface CommandConsoleProps {
  onSelectAlert?: (alertId: string) => void;
}

function generateResponse(
  command: ParsedCommand,
  sim: ReturnType<typeof useSimulation>,
): { text: string; kind: ConsoleMessage['kind'] } {
  switch (command.action) {
    case 'check_room': {
      if (!command.room) return { text: 'Specify a room number.', kind: 'info' };
      const s = sim.getRoomSensors(command.room);
      const ok =
        s.soundLevel === 'NORMAL' && s.temperature >= 18 &&
        s.temperature <= 30 && s.humidity <= 75;
      return ok
        ? { text: `Room ${String(command.room).padStart(2,'0')} is within configured safety limits.`, kind: 'success' }
        : { text: `Room ${String(command.room).padStart(2,'0')}: ${s.temperature.toFixed(1)}°C, ${Math.round(s.humidity)}% humidity, ${Math.round(s.sound)} dB — attention needed.`, kind: 'warning' };
    }
    case 'go_to_room': {
      if (!command.room) return { text: 'Specify a room number.', kind: 'info' };
      deviceApi.sendCommand(command);
      return { text: `Navigating to Room ${String(command.room).padStart(2,'0')}...`, kind: 'info' };
    }
    case 'patrol': {
      deviceApi.sendCommand(command);
      return { text: 'Patrol cycle initiated. Monitoring all facility sectors.', kind: 'success' };
    }
    case 'stop': {
      deviceApi.sendCommand(command);
      return { text: 'Rover stopped and standing by.', kind: 'warning' };
    }
    case 'move': {
      return { text: `Moving ${command.direction}.`, kind: 'info' };
    }
    case 'status': {
      const robot = sim.getRobot();
      return {
        text: `RVR-01 ${robot.state} at Room ${String(robot.currentRoom).padStart(2,'0')}. Battery ${Math.round(robot.battery)}%, signal ${Math.round(robot.connection)}%.`,
        kind: 'info',
      };
    }
    case 'report': {
      const rooms = sim.getRooms();
      const issues = rooms.filter((r) => r.safety !== 'safe');
      if (!issues.length) return { text: 'All rooms clear. No active alerts.', kind: 'success' };
      return {
        text: `${issues.length} sector(s) need attention: ${issues.map((r) => `Room ${String(r.id).padStart(2,'0')} (${r.safety})`).join(', ')}.`,
        kind: 'warning',
      };
    }
    default:
      return {
        text: 'Unknown instruction. Try: patrol, stop, status, report, check room 2, go to room 3.',
        kind: 'warning',
      };
  }
}

const HINTS = ['patrol', 'stop', 'status', 'check room 2', 'go to room 3', 'report'];

// Derive a display label from micState — used for button label
function micLabel(state: MicState, voiceStatus: string): string {
  if (state === 'listening')   return '● LISTENING...';
  if (state === 'processing')  return '◌ PROCESSING...';
  if (state === 'error')       return '⚠ VOICE ERROR';
  if (state === 'unsupported') return 'NO MIC';
  return voiceStatus;
}

export function CommandConsole({ onSelectAlert: _onSelectAlert }: CommandConsoleProps) {
  const sim = useSimulation();
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    { id: 'sys-init',  source: 'SYS', text: 'Ready for instruction.', timestamp: Date.now(), kind: 'info' },
    { id: 'you-prev',  source: 'YOU', text: '"Check Room 03."',        timestamp: Date.now() - 30000 },
    { id: 'sys-prev1', source: 'SYS', text: 'Navigating to Room 03...', timestamp: Date.now() - 25000, kind: 'info' },
    { id: 'sys-prev2', source: 'SYS', text: 'Room 03 is within configured safety limits.', timestamp: Date.now() - 20000, kind: 'success' },
  ]);
  const [input, setInput] = useState('');
  // Persistent "accepted" status — resets back to VOICE READY after 3.5 s
  const [acceptedFlash, setAcceptedFlash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const { enabled: voiceEnabled, toggle: toggleVoice, speak } = useSpeechSynthesis();

  const executeCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const userMsg: ConsoleMessage = { id: `you-${Date.now()}`, source: 'YOU', text: `"${trimmed}"`, timestamp: Date.now() };
    const response = generateResponse(parseCommand(trimmed), sim);
    const sysMsg: ConsoleMessage  = { id: `sys-${Date.now()}`,  source: 'SYS', text: response.text, timestamp: Date.now(), kind: response.kind };
    setMessages((prev) => [...prev, userMsg, sysMsg]);
    setAcceptedFlash(true);
    const t = setTimeout(() => setAcceptedFlash(false), 3500);
    if (voiceEnabled) speak(response.text);
    return () => clearTimeout(t);
  }, [sim, voiceEnabled, speak]);

  const { micState, start, stop } = useSpeechRecognition(executeCommand);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
  };

  // Button label: mic state overrides accepted flash
  const buttonLabel = micLabel(
    micState,
    acceptedFlash ? '✓ COMMAND ACCEPTED' : 'SPEAK COMMAND...',
  );

  const micBtnClass =
    micState === 'listening'   ? 'border-green bg-green/20 text-green animate-pulse' :
    micState === 'processing'  ? 'border-amber bg-amber/10 text-amber' :
    micState === 'error'       ? 'border-red bg-red/10 text-red' :
    micState === 'unsupported' ? 'border-line text-ink-muted opacity-50 cursor-not-allowed' :
    acceptedFlash              ? 'border-green/60 bg-green/10 text-green' :
                                 'border-green/40 bg-green/10 text-green hover:border-green hover:bg-green/15';

  return (
    <div className="hud-panel flex flex-col h-full select-none">
      {/* Header */}
      <div className="hud-header">
        <span className="hud-section-title">COMMAND CONSOLE</span>
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1 text-3xs mono font-bold cursor-pointer transition-colors ${voiceEnabled ? 'text-green' : 'text-ink-muted hover:text-ink'}`}
          title="Toggle Voice Readout"
        >
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{voiceEnabled ? 'TTS ON' : 'TTS OFF'}</span>
        </button>
      </div>

      {/* Terminal message stream — taller than before to show 4+ messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-3 bg-[#03080A] space-y-1.5 font-mono text-xs"
        style={{ minHeight: '130px', maxHeight: '200px' }}
      >
        {messages.map((msg) => {
          const isUser = msg.source === 'YOU';
          return (
            <div key={msg.id} className="flex items-start gap-2.5 leading-tight">
              <span className={`font-bold text-3xs w-7 shrink-0 ${isUser ? 'text-cyan' : 'text-green'}`}>
                {msg.source}
              </span>
              <span className={`text-xs break-words min-w-0 ${
                isUser             ? 'text-cyan font-semibold'
                : msg.kind === 'success'  ? 'text-ink'
                : msg.kind === 'warning'  ? 'text-amber'
                : msg.kind === 'critical' ? 'text-red'
                : 'text-ink-muted'
              }`}>
                {msg.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick-command hint chips */}
      <div className="px-2.5 py-1.5 bg-[#050C0E] border-t border-line flex items-center gap-1.5 overflow-x-auto scrollbar-thin flex-wrap">
        <span className="text-3xs mono text-ink-muted shrink-0">HINTS:</span>
        {HINTS.map((hint) => (
          <button
            key={hint}
            onClick={() => executeCommand(hint)}
            className="px-1.5 py-0.5 bg-base-elevated border border-line hover:border-green text-3xs mono text-ink-muted hover:text-green transition-colors shrink-0 cursor-pointer"
            style={{ borderRadius: 1 }}
          >
            {hint}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-2 border-t border-line bg-base-surface flex items-center gap-2">
        {/* Voice button — full label, but shrinks gracefully */}
        <button
          onClick={() => micState === 'listening' ? stop() : start()}
          disabled={micState === 'unsupported'}
          className={`flex items-center gap-1.5 px-2 py-1.5 border transition-all cursor-pointer shrink-0 ${micBtnClass}`}
          style={{ borderRadius: 2, minWidth: 0 }}
          title="Toggle Voice Command"
          aria-label={buttonLabel}
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span className="text-3xs mono font-black tracking-widest whitespace-nowrap hidden xs:inline sm:inline">
            {buttonLabel}
          </span>
          {/* Show waveform bars when actively listening */}
          {micState === 'listening' && (
            <span className="flex items-center gap-[2px] h-3 ml-1">
              {[4, 8, 12, 6, 10, 4].map((h, i) => (
                <span
                  key={i}
                  className="w-[2px] bg-green animate-hud-wave inline-block"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </span>
          )}
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="TYPE INSTRUCTION..."
          className="flex-1 min-w-0 bg-transparent text-xs mono text-ink placeholder:text-ink-faint focus:outline-none tracking-wider px-1"
          aria-label="Enter command"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="w-7 h-7 flex items-center justify-center border border-line hover:border-green text-ink-muted hover:text-green disabled:opacity-30 transition-colors shrink-0 cursor-pointer"
          style={{ borderRadius: 2 }}
          aria-label="Send command"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
