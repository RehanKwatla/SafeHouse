import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Volume2, VolumeX, Terminal } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { useSpeechRecognition, useSpeechSynthesis, type MicState } from '@/hooks/useSpeech';
import { parseCommand } from '@/engine/commandParser';
import { deviceApi, sensorApi } from '@/api';
import type { ConsoleMessage, ParsedCommand } from '@/types';
import { AlertRow } from './AlertRow';

interface CommandConsoleProps {
  onSelectAlert?: (alertId: string) => void;
}

const MIC_STATE_STYLES: Record<MicState, { color: string; label: string; pulse?: boolean }> = {
  idle: { color: 'text-ink-muted border-line hover:border-green/40 hover:text-green', label: 'TAP TO SPEAK' },
  listening: { color: 'text-green border-green/50 bg-green-tint', label: 'LISTENING...', pulse: true },
  processing: { color: 'text-amber border-amber/50 bg-amber-tint', label: 'PROCESSING...' },
  error: { color: 'text-red border-red/50 bg-red-tint', label: 'ERROR' },
  unsupported: { color: 'text-ink-faint border-line', label: 'NOT SUPPORTED' },
};

function generateResponse(
  command: ParsedCommand,
  sim: ReturnType<typeof useSimulation>
): { text: string; kind: ConsoleMessage['kind'] } {
  switch (command.action) {
    case 'check_room': {
      if (!command.room) return { text: 'Which room should I check?', kind: 'info' };
      const sensors = sim.getRoomSensors(command.room);
      const temp = sensors.temperature.toFixed(1);
      const hum = Math.round(sensors.humidity);
      const sound = Math.round(sensors.sound);
      if (sensors.soundLevel !== 'NORMAL' || sensors.temperature < 18 || sensors.temperature > 30 || sensors.humidity > 75) {
        return {
          text: `Room ${String(command.room).padStart(2, '0')} requires attention. Temperature ${temp}°C, humidity ${hum}%, sound ${sound} dB.`,
          kind: 'warning',
        };
      }
      return {
        text: `Room ${String(command.room).padStart(2, '0')} is within safe limits. Temperature ${temp}°C, humidity ${hum}%, sound ${sound} dB.`,
        kind: 'success',
      };
    }
    case 'go_to_room': {
      if (!command.room) return { text: 'Specify a room to navigate to.', kind: 'info' };
      deviceApi.sendCommand(command);
      return {
        text: `Navigating to Room ${String(command.room).padStart(2, '0')}. Estimated travel time 6 seconds.`,
        kind: 'info',
      };
    }
    case 'patrol': {
      deviceApi.sendCommand(command);
      return { text: 'Patrol initiated. Monitoring all rooms.', kind: 'success' };
    }
    case 'stop': {
      deviceApi.sendCommand(command);
      return { text: 'Rover stopped. All movement halted.', kind: 'warning' };
    }
    case 'move': {
      return { text: `Moving ${command.direction}.`, kind: 'info' };
    }
    case 'status': {
      const robot = sim.getRobot();
      const room = String(robot.currentRoom).padStart(2, '0');
      return {
        text: `Rover is ${robot.state === 'PATROLLING' ? 'patrolling' : robot.state.toLowerCase()} at Room ${room}. Battery ${Math.round(robot.battery)}%, connection ${Math.round(robot.connection)}%.`,
        kind: 'info',
      };
    }
    case 'report': {
      const rooms = sim.getRooms();
      const issues = rooms.filter((r) => r.safety !== 'safe');
      if (issues.length === 0) {
        return { text: 'All rooms are within safe limits. No active alerts.', kind: 'success' };
      }
      const issueList = issues.map((r) => `Room ${String(r.id).padStart(2, '0')} (${r.safety})`).join(', ');
      return { text: `${issues.length} room(s) require attention: ${issueList}.`, kind: 'warning' };
    }
    default:
      return { text: 'Command not recognized. Try: check room 3, go to room 4, patrol, stop, status, report.', kind: 'warning' };
  }
}

export function CommandConsole({ onSelectAlert }: CommandConsoleProps) {
  const sim = useSimulation();
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: 'sys-init',
      source: 'SYS',
      text: 'SAFEROOM command console ready. Awaiting instruction.',
      timestamp: Date.now(),
      kind: 'info',
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { enabled: voiceEnabled, speak, toggle: toggleVoice } = useSpeechSynthesis();

  const executeCommand = useCallback(
    (raw: string) => {
      const userMsg: ConsoleMessage = {
        id: `you-${Date.now()}`,
        source: 'YOU',
        text: `"${raw}"`,
        timestamp: Date.now(),
      };

      const command = parseCommand(raw);
      const response = generateResponse(command, sim);
      const sysMsg: ConsoleMessage = {
        id: `sys-${Date.now()}`,
        source: 'SYS',
        text: response.text,
        timestamp: Date.now(),
        kind: response.kind,
      };

      setMessages((prev) => [...prev, userMsg, sysMsg]);

      if (voiceEnabled) {
        speak(response.text);
      }
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

  const handleMicClick = () => {
    if (micState === 'listening') {
      stop();
    } else {
      start();
    }
  };

  const micStyle = MIC_STATE_STYLES[micState];

  return (
    <div className="panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-green" />
          <span className="label-text">SAFEROOM COMMAND CONSOLE</span>
        </div>
        {/* Voice response toggle */}
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-2xs mono tracking-wider transition-colors ${
            voiceEnabled
              ? 'border-green/30 bg-green-tint text-green'
              : 'border-line text-ink-muted hover:text-ink'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          VOICE {voiceEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2 min-h-[180px]" style={{ maxHeight: 300 }}>
        {messages.map((msg) => (
          <div key={msg.id} className="animate-slide-in">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xs mono font-semibold tracking-wider shrink-0 ${
                  msg.source === 'YOU'
                    ? 'text-ink'
                    : msg.source === 'ERR'
                    ? 'text-red'
                    : msg.kind === 'success'
                    ? 'text-green'
                    : msg.kind === 'warning'
                    ? 'text-amber'
                    : msg.kind === 'critical'
                    ? 'text-red'
                    : 'text-ink-muted'
                }`}
              >
                {msg.source}
              </span>
              <span className="text-2xs mono text-ink-faint tabular-nums">
                {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 ml-8 ${
                msg.kind === 'success'
                  ? 'text-green'
                  : msg.kind === 'warning'
                  ? 'text-amber'
                  : msg.kind === 'critical'
                  ? 'text-red'
                  : msg.source === 'YOU'
                  ? 'text-ink'
                  : 'text-ink-muted'
              }`}
            >
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-line p-3">
        {/* Mic status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMicClick}
              disabled={!isSupported && micState === 'unsupported'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-2xs mono tracking-wider transition-all ${micStyle.color} ${
                micStyle.pulse ? 'animate-pulse-green' : ''
              }`}
            >
              <Mic className="w-3 h-3" />
              {micStyle.label}
            </button>
            {!isSupported && (
              <span className="text-2xs text-ink-faint">Voice not supported — use text input</span>
            )}
          </div>
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type a command..."
            className="flex-1 bg-base border border-line rounded px-3 py-2 text-xs mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-green/40 transition-colors"
          />
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center w-9 h-9 bg-green/10 border border-green/30 rounded text-green hover:bg-green/20 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick commands */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['Check room 3', 'Patrol all rooms', 'Status', 'Report'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => executeCommand(cmd)}
              className="text-2xs mono px-2 py-1 bg-base-hover border border-line-faint rounded text-ink-muted hover:text-green hover:border-green/30 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* onSelectAlert is passed through but alerts are shown in AlertPanel */}
      {onSelectAlert ? null : null}
    </div>
  );
}
