import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Volume2, VolumeX } from 'lucide-react';
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
        s.soundLevel === 'NORMAL' &&
        s.temperature >= 18 &&
        s.temperature <= 30 &&
        s.humidity <= 75;
      return ok
        ? {
            text: `Room ${String(command.room).padStart(2, '0')}: ${s.temperature.toFixed(1)}°C, ${Math.round(s.humidity)}% humidity — all clear.`,
            kind: 'success',
          }
        : {
            text: `Room ${String(command.room).padStart(2, '0')}: ${s.temperature.toFixed(1)}°C, ${Math.round(s.humidity)}% humidity, ${Math.round(s.sound)} dB — attention needed.`,
            kind: 'warning',
          };
    }
    case 'go_to_room': {
      if (!command.room) return { text: 'Specify a room number.', kind: 'info' };
      deviceApi.sendCommand(command);
      return {
        text: `Navigating to Room ${String(command.room).padStart(2, '0')}.`,
        kind: 'info',
      };
    }
    case 'patrol': {
      deviceApi.sendCommand(command);
      return { text: 'Patrol started. Monitoring all rooms.', kind: 'success' };
    }
    case 'stop': {
      deviceApi.sendCommand(command);
      return { text: 'Rover stopped.', kind: 'warning' };
    }
    case 'move': {
      return { text: `Moving ${command.direction}.`, kind: 'info' };
    }
    case 'status': {
      const robot = sim.getRobot();
      return {
        text: `${robot.state} at Room ${String(robot.currentRoom).padStart(2, '0')}. Battery ${Math.round(robot.battery)}%, signal ${Math.round(robot.connection)}%.`,
        kind: 'info',
      };
    }
    case 'report': {
      const rooms = sim.getRooms();
      const issues = rooms.filter((r) => r.safety !== 'safe');
      if (!issues.length) return { text: 'All rooms clear. No active alerts.', kind: 'success' };
      return {
        text: `${issues.length} room(s) need attention: ${issues
          .map((r) => `Room ${String(r.id).padStart(2, '0')} (${r.safety})`)
          .join(', ')}.`,
        kind: 'warning',
      };
    }
    default:
      return {
        text: 'Unknown command. Try: patrol, stop, status, report, check room 2, go to room 3.',
        kind: 'warning',
      };
  }
}

const HINTS = ['patrol', 'stop', 'status', 'check room 2', 'go to room 3', 'report'];

const MIC_COLORS: Record<MicState, string> = {
  idle: 'text-ink-faint hover:text-ink-muted',
  listening: 'text-green animate-pulse-green',
  processing: 'text-amber',
  error: 'text-red',
  unsupported: 'text-ink-faint opacity-40',
};

// Voice waveform — shows listening activity
function VoiceWaveform({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-px h-3" aria-hidden="true">
      {[3, 5, 8, 6, 9, 7, 4].map((h, i) => (
        <div
          key={i}
          className="w-px bg-green animate-waveform"
          style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

export function CommandConsole({ onSelectAlert: _onSelectAlert }: CommandConsoleProps) {
  const sim = useSimulation();
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: 'sys-init',
      source: 'SYS',
      text: 'SAFEROOM command console ready.',
      timestamp: Date.now(),
      kind: 'info',
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { enabled: voiceEnabled, speak, toggle: toggleVoice } = useSpeechSynthesis();

  const executeCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const userMsg: ConsoleMessage = {
        id: `you-${Date.now()}`,
        source: 'YOU',
        text: trimmed,
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
      if (voiceEnabled) speak(response.text);
    },
    [sim, voiceEnabled, speak],
  );

  const { micState, start, stop, isSupported } = useSpeechRecognition(executeCommand);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
  };

  const handleMicClick = () => {
    micState === 'listening' ? stop() : start();
  };

  return (
    <div className="panel flex flex-col" style={{ borderTop: '2px solid #263540' }}>
      {/* Header */}
      <div className="panel-header bg-base-elevated">
        <div className="flex items-center gap-2">
          <span className="text-green mono text-xs font-bold">{'>'}_</span>
          <span className="section-title">COMMAND CONSOLE</span>
        </div>
        <div className="flex items-center gap-3">
          <VoiceWaveform active={micState === 'listening'} />
          {micState === 'listening' && (
            <span className="text-3xs mono text-green tracking-widest">LISTENING</span>
          )}
          {micState === 'processing' && (
            <span className="text-3xs mono text-amber tracking-widest">PROCESSING</span>
          )}
          <button
            onClick={toggleVoice}
            className="flex items-center gap-1 text-3xs mono text-ink-faint hover:text-ink-muted transition-colors"
            title={voiceEnabled ? 'Voice response on' : 'Voice response off'}
          >
            {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            <span className="hidden sm:inline tracking-widest">
              {voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Message stream — terminal style */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 bg-base"
        style={{
          minHeight: 140,
          maxHeight: 220,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.7rem',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.source === 'YOU';
          return (
            <div key={msg.id} className="py-0.5 leading-relaxed">
              <span className="text-ink-faint mr-2 select-none">
                {isUser
                  ? '>'
                  : msg.kind === 'success'
                  ? '◆'
                  : msg.kind === 'warning'
                  ? '▲'
                  : msg.kind === 'critical'
                  ? '!'
                  : '·'}
              </span>
              <span className="text-ink-faint mr-1.5 select-none">
                {isUser ? 'YOU' : 'SYS'}
              </span>
              <span
                className={
                  isUser
                    ? 'text-ink'
                    : msg.kind === 'success'
                    ? 'text-green'
                    : msg.kind === 'warning'
                    ? 'text-amber'
                    : msg.kind === 'critical'
                    ? 'text-red'
                    : 'text-ink-muted'
                }
              >
                {msg.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick commands */}
      <div className="px-3 py-1.5 border-t border-line-faint flex items-center gap-1.5 flex-wrap bg-base">
        {HINTS.map((hint) => (
          <button
            key={hint}
            onClick={() => {
              executeCommand(hint);
              inputRef.current?.focus();
            }}
            className="px-1.5 py-0.5 text-3xs mono text-ink-faint border border-line hover:border-line-strong hover:text-ink-muted transition-colors tracking-wider"
          >
            {hint}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="border-t border-line px-3 py-2 flex items-center gap-2 bg-base-elevated">
        <span className="text-green mono text-sm font-bold shrink-0 select-none">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="enter command..."
          className="flex-1 bg-transparent text-xs mono text-ink placeholder:text-ink-faint focus:outline-none tracking-wide"
          aria-label="Enter command"
        />

        {isSupported && (
          <button
            onClick={handleMicClick}
            className={`w-7 h-7 flex items-center justify-center transition-colors ${MIC_COLORS[micState]}`}
            aria-label={micState === 'listening' ? 'Stop listening' : 'Start voice command'}
            title={micState === 'listening' ? 'Stop' : 'Speak command'}
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="w-7 h-7 flex items-center justify-center text-ink-faint hover:text-ink disabled:opacity-25 transition-colors"
          aria-label="Send command"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
