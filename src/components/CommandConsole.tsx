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

// ── Response generator ────────────────────────────────────────────────────────

function generateResponse(
  command: ParsedCommand,
  sim: ReturnType<typeof useSimulation>,
): { text: string; kind: ConsoleMessage['kind'] } {
  const sensors = sim.getSensors();
  const robot   = sim.getRobot();

  switch (command.action) {

    case 'check_sensors': {
      const issues = [];
      if (sensors.temperature < 18 || sensors.temperature > 30)
        issues.push(`Temp ${sensors.temperature.toFixed(1)}°C`);
      if (sensors.humidity > 75)
        issues.push(`Humidity ${Math.round(sensors.humidity)}%`);
      if (sensors.soundLevel !== 'NORMAL')
        issues.push(`Sound ${Math.round(sensors.sound)} dB`);
      if (sensors.airQualityLevel !== 'GOOD')
        issues.push(`AQI ${Math.round(sensors.airQuality)}`);
      if (sensors.smoke)
        issues.push('SMOKE DETECTED');
      if (issues.length === 0)
        return { text: 'All sensors within safe limits.', kind: 'success' };
      return { text: `Attention needed — ${issues.join(', ')}.`, kind: 'warning' };
    }

    case 'check_air': {
      const aqi   = Math.round(sensors.airQuality);
      const level = sensors.airQualityLevel;
      const kind  = level === 'GOOD' ? 'success' : level === 'MODERATE' || level === 'POOR' ? 'warning' : 'critical';
      return {
        text: `Air quality: AQI ${aqi} — ${level}.`,
        kind,
      };
    }

    case 'check_tilt': {
      const mag   = Math.sqrt(sensors.tiltX ** 2 + sensors.tiltY ** 2);
      const state = sensors.tiltState;
      const kind  = state === 'LEVEL' ? 'success' : state === 'TILTED' ? 'warning' : 'critical';
      return {
        text: `Tilt: Roll ${sensors.tiltX >= 0 ? '+' : ''}${sensors.tiltX.toFixed(1)}°, Pitch ${sensors.tiltY >= 0 ? '+' : ''}${sensors.tiltY.toFixed(1)}° — ${state}.`,
        kind,
      };
    }

    case 'check_smoke': {
      if (sensors.smoke)
        return { text: 'SMOKE DETECTED — immediate attention required.', kind: 'critical' };
      return { text: 'Smoke sensor clear. No smoke detected.', kind: 'success' };
    }

    case 'check_obstacle': {
      const dist  = sensors.obstacleDistance.toFixed(2);
      const state = sensors.obstacleState;
      const kind  = state === 'CLEAR' ? 'success' : state === 'NEAR' ? 'warning' : 'critical';
      return {
        text: `Obstacle sensor: ${dist} m — ${state}.`,
        kind,
      };
    }

    case 'stop': {
      deviceApi.sendCommand(command);
      return { text: 'Rover stopped and standing by.', kind: 'warning' };
    }

    case 'move': {
      return { text: `Moving ${command.direction}.`, kind: 'info' };
    }

    case 'status': {
      return {
        text: `RVR-01 ${robot.state}. Battery ${Math.round(robot.battery)}%, signal ${Math.round(robot.connection)}%.`,
        kind: 'info',
      };
    }

    case 'report': {
      const activeAlerts = sim.getActiveAlerts();
      if (activeAlerts.length === 0)
        return { text: 'All sensors clear. No active alerts.', kind: 'success' };
      return {
        text: `${activeAlerts.length} active alert(s): ${activeAlerts.map((a) => a.description).slice(0, 3).join('; ')}.`,
        kind: 'warning',
      };
    }

    default:
      return {
        text: 'Unknown command. Try: status, report, check air, check tilt, check smoke, stop.',
        kind: 'warning',
      };
  }
}

// ── Hint chips — sensor-focused, not patrol-focused ──────────────────────────

const HINTS = [
  'status',
  'report',
  'check air',
  'check tilt',
  'check smoke',
  'stop',
];

function micLabel(state: MicState, voiceStatus: string): string {
  if (state === 'listening')   return '● LISTENING...';
  if (state === 'processing')  return '◌ PROCESSING...';
  if (state === 'error')       return '⚠ VOICE ERROR';
  if (state === 'unsupported') return 'NO MIC';
  return voiceStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandConsole({ onSelectAlert: _onSelectAlert }: CommandConsoleProps) {
  const sim = useSimulation();

  const [messages, setMessages] = useState<ConsoleMessage[]>([
    { id: 'sys-1', source: 'SYS', text: 'SAFEROOM OS ready. Safety monitoring active.', timestamp: Date.now(),       kind: 'info' },
    { id: 'sys-2', source: 'SYS', text: 'All sensors online. Type a command or speak.',  timestamp: Date.now() - 3000, kind: 'success' },
  ]);
  const [input, setInput]               = useState('');
  const [acceptedFlash, setAcceptedFlash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const { enabled: voiceEnabled, toggle: toggleVoice, speak } = useSpeechSynthesis();

  const executeCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const userMsg: ConsoleMessage = {
      id: `you-${Date.now()}`,
      source: 'YOU',
      text: `"${trimmed}"`,
      timestamp: Date.now(),
    };
    const response = generateResponse(parseCommand(trimmed), sim);
    const sysMsg: ConsoleMessage = {
      id: `sys-${Date.now()}`,
      source: 'SYS',
      text: response.text,
      timestamp: Date.now(),
      kind: response.kind,
    };

    setMessages((prev) => [...prev, userMsg, sysMsg]);
    setAcceptedFlash(true);
    setTimeout(() => setAcceptedFlash(false), 3500);
    if (voiceEnabled) speak(response.text);
  }, [sim, voiceEnabled, speak]);

  const { micState, start, stop } = useSpeechRecognition(executeCommand);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
  };

  const buttonLabel = micLabel(
    micState,
    acceptedFlash ? '✓ ACCEPTED' : 'SPEAK COMMAND...',
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
          className={`flex items-center gap-1 text-3xs mono font-bold cursor-pointer transition-colors ${
            voiceEnabled ? 'text-green' : 'text-ink-muted hover:text-ink'
          }`}
          title="Toggle Voice Readout"
        >
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{voiceEnabled ? 'TTS ON' : 'TTS OFF'}</span>
        </button>
      </div>

      {/* Terminal stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-3 bg-[#03080A] space-y-1.5 font-mono text-xs"
        style={{ minHeight: '130px', maxHeight: '220px' }}
      >
        {messages.map((msg) => {
          const isUser = msg.source === 'YOU';
          return (
            <div key={msg.id} className="flex items-start gap-2.5 leading-tight">
              <span className={`font-bold text-3xs w-7 shrink-0 ${isUser ? 'text-cyan' : 'text-green'}`}>
                {msg.source}
              </span>
              <span className={`text-xs break-words min-w-0 ${
                isUser              ? 'text-cyan font-semibold'
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

      {/* Hint chips */}
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
