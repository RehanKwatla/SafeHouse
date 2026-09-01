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

const MIC_STATE_LABEL: Record<MicState, string> = {
  idle: 'MIC',
  listening: 'LISTENING',
  processing: 'PROCESSING',
  error: 'ERROR',
  unsupported: 'NO MIC',
};

function generateResponse(
  command: ParsedCommand,
  sim: ReturnType<typeof useSimulation>
): { text: string; kind: ConsoleMessage['kind'] } {
  switch (command.action) {
    case 'check_room': {
      if (!command.room) return { text: 'Specify a room number.', kind: 'info' };
      const sensors = sim.getRoomSensors(command.room);
      const temp = sensors.temperature.toFixed(1);
      const hum = Math.round(sensors.humidity);
      const sound = Math.round(sensors.sound);
      if (sensors.soundLevel !== 'NORMAL' || sensors.temperature < 18 || sensors.temperature > 30 || sensors.humidity > 75) {
        return {
          text: `Room ${String(command.room).padStart(2, '0')}: ${temp}°C, ${hum}% humidity, ${sound} dB — attention needed.`,
          kind: 'warning',
        };
      }
      return {
        text: `Room ${String(command.room).padStart(2, '0')}: ${temp}°C, ${hum}% humidity, ${sound} dB — all clear.`,
        kind: 'success',
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
      const room = String(robot.currentRoom).padStart(2, '0');
      return {
        text: `${robot.state} at Room ${room}. Battery ${Math.round(robot.battery)}%, signal ${Math.round(robot.connection)}%.`,
        kind: 'info',
      };
    }
    case 'report': {
      const rooms = sim.getRooms();
      const issues = rooms.filter((r) => r.safety !== 'safe');
      if (issues.length === 0) {
        return { text: 'All rooms clear. No active alerts.', kind: 'success' };
      }
      const issueList = issues
        .map((r) => `Room ${String(r.id).padStart(2, '0')} (${r.safety})`)
        .join(', ');
      return { text: `${issues.length} room(s) need attention: ${issueList}.`, kind: 'warning' };
    }
    default:
      return {
        text: 'Unknown command. Try: patrol, stop, status, report, check room 2, go to room 3.',
        kind: 'warning',
      };
  }
}

// Hint suggestions shown below the input — operational not conversational
const HINTS = ['patrol', 'stop', 'status', 'check room 2', 'go to room 3', 'report'];

export function CommandConsole({ onSelectAlert: _onSelectAlert }: CommandConsoleProps) {
  const sim = useSimulation();
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: 'sys-init',
      source: 'SYS',
      text: 'Console ready.',
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

      const command = parseCommand(trimmed);
      const response = generateResponse(command, sim);
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
    [sim, voiceEnabled, speak]
  );

  const { micState, start, stop, isSupported } = useSpeechRecognition(executeCommand);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
  };

  const handleHint = (hint: string) => {
    executeCommand(hint);
    inputRef.current?.focus();
  };

  const handleMicClick = () => {
    if (micState === 'listening') stop();
    else start();
  };

  return (
    <div className="panel flex flex-col h-full">
      {/* Header — control console framing, not chat assistant framing */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          {/* Prompt character communicates: this is a command interface */}
          <span className="text-green mono text-sm font-medium">{'>'}</span>
          <span className="label-text">COMMAND</span>
        </div>
        <button
          onClick={toggleVoice}
          className="flex items-center gap-1 text-2xs mono text-ink-faint hover:text-ink-muted transition-colors"
          title={voiceEnabled ? 'Voice response on' : 'Voice response off'}
        >
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span className="hidden sm:inline">{voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
        </button>
      </div>

      {/* Message stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2 space-y-0 font-mono text-xs"
        style={{ minHeight: 140, maxHeight: 260 }}
      >
        {messages.map((msg) => {
          const isUser = msg.source === 'YOU';
          return (
            <div key={msg.id} className="py-0.5 leading-relaxed">
              {isUser ? (
                // User input: prompt character prefix
                <span className="text-ink">
                  <span className="text-ink-faint mr-1.5">{'>'}</span>
                  {msg.text}
                </span>
              ) : (
                // System response: colored by kind
                <span
                  className={
                    msg.kind === 'success'
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
              )}
            </div>
          );
        })}
      </div>

      {/* Quick-command hints — show operational vocabulary, not generic suggestions */}
      <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap border-t border-line-faint pt-2">
        {HINTS.map((hint) => (
          <button
            key={hint}
            onClick={() => handleHint(hint)}
            className="px-2 py-0.5 text-2xs mono text-ink-faint border border-line hover:border-line-strong hover:text-ink-muted transition-colors"
            style={{ borderRadius: 2 }}
          >
            {hint}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="border-t border-line px-3 py-2.5 flex items-center gap-2">
        {/* Prompt prefix inside input area */}
        <span className="text-green mono text-sm shrink-0">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="enter command..."
          className="flex-1 bg-transparent text-xs mono text-ink placeholder:text-ink-faint focus:outline-none"
        />
        {/* Mic button */}
        {isSupported && (
          <button
            onClick={handleMicClick}
            className={`flex items-center justify-center w-7 h-7 transition-colors ${
              micState === 'listening'
                ? 'text-green animate-pulse-green'
                : micState === 'processing'
                ? 'text-amber'
                : micState === 'error'
                ? 'text-red'
                : 'text-ink-faint hover:text-ink-muted'
            }`}
            title={MIC_STATE_LABEL[micState]}
            aria-label={MIC_STATE_LABEL[micState]}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="flex items-center justify-center w-7 h-7 text-ink-faint hover:text-ink disabled:opacity-30 transition-colors"
          aria-label="Send command"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
