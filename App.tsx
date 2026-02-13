import React, { useState, useEffect, useRef } from 'react';
import { Power, Activity, Lock, Unlock, HardDrive, Wifi, MessageSquare, Monitor, Cpu, Smartphone, Zap, Shield } from 'lucide-react';
import { LiveClient } from './services/liveClient';
import { TranscriptionItem, LiveSessionState } from './types';
import ArcReactor from './components/ArcReactor';
import TerminalOutput from './components/TerminalOutput';
import SystemDiagnostics from './components/SystemDiagnostics';
import ApiIntegrations from './components/ApiIntegrations';

const API_KEY = process.env.API_KEY || '';

const App: React.FC = () => {
  const [sessionState, setSessionState] = useState<LiveSessionState>({
    isConnected: false,
    isSpeaking: false,
    isAiSpeaking: false,
    volume: 0,
    transcripts: [],
    error: null
  });

  const [isDiagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [isApiOpen, setApiOpen] = useState(false);
  const liveClientRef = useRef<LiveClient | null>(null);

  useEffect(() => {
    return () => { liveClientRef.current?.disconnect(); };
  }, []);

  const handleConnect = async () => {
    if (!API_KEY) {
        setSessionState(prev => ({ ...prev, error: "API Key not found." }));
        return;
    }

    if (sessionState.isConnected) {
      await liveClientRef.current?.disconnect();
      setSessionState(prev => ({ ...prev, isConnected: false, transcripts: [] }));
      return;
    }

    const client = new LiveClient(API_KEY);
    liveClientRef.current = client;

    client.onStateChange = (updates) => setSessionState(prev => ({ ...prev, ...updates }));
    client.onTranscript = (item) => {
        setSessionState(prev => {
            const exists = prev.transcripts.find(t => t.text === item.text && t.sender === item.sender);
            if (exists) return prev; 
            return { ...prev, transcripts: [...prev.transcripts, item].slice(-50) };
        });
    };

    await client.connect();
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-display flex flex-col relative overflow-hidden selection:bg-cyan-500/30">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,20,30,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,20,30,0.3)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] pointer-events-none"></div>

        <SystemDiagnostics isOpen={isDiagnosticsOpen} onClose={() => setDiagnosticsOpen(false)} />
        <ApiIntegrations isOpen={isApiOpen} onClose={() => setApiOpen(false)} />

        {/* Header */}
        <header className="relative z-10 flex flex-col md:flex-row justify-between items-center p-6 border-b border-cyan-900/30 bg-black/50 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-10 h-10 border-2 border-cyan-500 rounded-full flex items-center justify-center neon-glow animate-pulse">
                    <Activity size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-widest text-white">JARVIS</h1>
                    <p className="text-[10px] text-cyan-600 tracking-[0.2em]">GEMINI 3.0 PRO // LIVE INTERFACE</p>
                </div>
            </div>
            
            {/* Active Modules Indicator */}
            <div className="flex gap-4 text-xs font-mono flex-wrap justify-center">
                <button onClick={() => setDiagnosticsOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="Memory Core">
                    <HardDrive size={14} /> <span>MEM</span>
                </button>
                <button onClick={() => setDiagnosticsOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="Network">
                    <Wifi size={14} /> <span>NET</span>
                </button>
                 <button onClick={() => setDiagnosticsOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="Messaging">
                    <MessageSquare size={14} /> <span>MSG</span>
                </button>
                 <button onClick={() => setDiagnosticsOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="System">
                    <Monitor size={14} /> <span>SYS</span>
                </button>
                <button onClick={() => setDiagnosticsOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="Mobile Devices">
                    <Smartphone size={14} /> <span>DEV</span>
                </button>
                <button onClick={() => setApiOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="Plugins/API">
                    <Zap size={14} /> <span>API</span>
                </button>
                 <button onClick={() => setDiagnosticsOpen(true)} className="flex items-center gap-1 text-cyan-700 opacity-80 hover:text-cyan-400 hover:opacity-100 transition-all cursor-pointer" title="Processing">
                    <Cpu size={14} /> <span>CPU</span>
                </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-cyan-700 mt-4 md:mt-0">
                 <button 
                    onClick={() => setDiagnosticsOpen(true)}
                    className="flex items-center gap-2 text-cyan-500 hover:text-cyan-300 transition-colors border border-cyan-500/30 px-3 py-1 rounded bg-cyan-900/10"
                >
                    <Shield size={14} />
                    <span>DIAGNOSTICS</span>
                </button>
                
                <div className="flex items-center gap-2 text-yellow-500 animate-pulse">
                    <Unlock size={14} />
                    <span className="tracking-widest">AUTHORIZED</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sessionState.isConnected ? 'bg-green-500 neon-glow' : 'bg-red-900'}`}></span>
                    <span>{sessionState.isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>
        </header>

        {/* Main Interface */}
        <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4 gap-8">
            <div className="relative">
                <ArcReactor 
                    isActive={sessionState.isConnected}
                    isAiSpeaking={sessionState.isAiSpeaking}
                    isUserSpeaking={sessionState.isSpeaking}
                    analyser={liveClientRef.current?.getAnalyser() || null}
                />
            </div>

            <div className="h-8 font-mono text-center">
                {sessionState.error ? (
                    <span className="text-red-500 font-bold animate-pulse">ERROR: {sessionState.error}</span>
                ) : sessionState.isAiSpeaking ? (
                    <span className="text-cyan-300 tracking-widest animate-pulse">PROCESSING RESPONSE...</span>
                ) : sessionState.isSpeaking ? (
                    <span className="text-green-400 tracking-widest">RECEIVING AUDIO...</span>
                ) : sessionState.isConnected ? (
                    <span className="text-cyan-700 tracking-widest">AWAITING COMMAND</span>
                ) : (
                    <span className="text-slate-600 tracking-widest">SYSTEM STANDBY</span>
                )}
            </div>

            <div className="flex gap-6">
                <button 
                    onClick={handleConnect}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 group
                        ${sessionState.isConnected 
                            ? 'border-red-500 hover:bg-red-500/10 text-red-500' 
                            : 'border-cyan-500 hover:bg-cyan-500/10 text-cyan-500 neon-glow hover:scale-105'
                        }
                    `}
                >
                    <Power size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            <TerminalOutput logs={sessionState.transcripts} />
        </main>

        <footer className="relative z-10 p-4 border-t border-cyan-900/30 text-center">
            <p className="text-[10px] text-cyan-900 font-mono">
                STARK INDUSTRIES // PROTOTYPE MARK VII // DEVELOPED BY NABIN // © 2025
            </p>
        </footer>
    </div>
  );
};

export default App;