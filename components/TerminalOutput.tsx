import React, { useEffect, useRef } from 'react';
import { TranscriptionItem } from '../types';

interface TerminalOutputProps {
  logs: TranscriptionItem[];
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogStyle = (sender: TranscriptionItem['sender']) => {
    switch(sender) {
      case 'ai': 
        return 'justify-start text-cyan-300 border-l-2 border-cyan-500 bg-cyan-900/20';
      case 'user':
        return 'justify-end text-slate-300 border-r-2 border-slate-500 bg-slate-800';
      case 'system':
        return 'justify-center w-full text-yellow-400 border-b border-yellow-500/50 bg-yellow-900/10 font-bold';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-2xl h-48 bg-slate-900/80 border border-slate-700 rounded-lg p-4 font-mono text-xs overflow-y-auto relative shadow-inner backdrop-blur-sm">
      <div className="absolute top-2 right-2 text-cyan-600/50 text-[10px]">SECURE CONNECTION // LOGS</div>
      <div ref={scrollRef} className="space-y-2 mt-2">
        {logs.map((log) => (
          <div key={log.id} className={`flex w-full ${log.sender === 'user' ? 'justify-end' : log.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded ${getLogStyle(log.sender)}`}>
              <span className="block text-[9px] opacity-50 mb-1">
                {log.sender === 'ai' ? 'JARVIS' : log.sender === 'user' ? 'USER' : 'SYSTEM_KERNEL'} // {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.text}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center text-slate-600 italic mt-10">Waiting for voice input...</div>
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
