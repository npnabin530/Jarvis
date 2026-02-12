import React from 'react';
import { Mic, Volume2, HardDrive, Terminal, Globe, Smartphone, Brain, MessageSquare, Zap, Activity, X, ShieldCheck } from 'lucide-react';

interface SystemDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const modules = [
  { icon: Mic, name: 'MICROPHONE', desc: 'Listen for voice commands & wake words.' },
  { icon: Volume2, name: 'AUDIO OUTPUT', desc: 'Speech synthesis & system alerts.' },
  { icon: HardDrive, name: 'FILE SYSTEM', desc: 'Read/Write access for docs & logs.' },
  { icon: Terminal, name: 'COMMAND LINE', desc: 'App control & shell execution.' },
  { icon: Globe, name: 'INTERNET', desc: 'Web browsing & data extraction.' },
  { icon: Smartphone, name: 'DEVICE CONTROL', desc: 'Android/iOS accessibility bridge.' },
  { icon: Brain, name: 'MEMORY CORE', desc: 'Persistent storage for user prefs.' },
  { icon: MessageSquare, name: 'MESSAGING', desc: 'Telegram/Discord/Slack integration.' },
  { icon: Zap, name: 'PLUGINS', desc: 'External API & script execution.' },
  { icon: Activity, name: 'BACKGROUND', desc: 'Continuous startup service active.' },
];

const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-black border border-cyan-500/50 rounded-lg shadow-[0_0_50px_rgba(8,145,178,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-900/50 bg-cyan-950/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-cyan-400 tracking-widest font-display">SYSTEM CAPABILITIES</h2>
              <p className="text-[10px] text-cyan-600 font-mono tracking-[0.2em]">AUTHORIZATION LEVEL: ROOT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cyan-900/30 rounded-full transition-colors text-cyan-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {modules.map((mod, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 border border-cyan-900/30 rounded bg-cyan-950/10 hover:bg-cyan-950/30 transition-colors group">
              <div className="p-3 bg-cyan-900/20 rounded text-cyan-400 group-hover:text-cyan-200 group-hover:neon-glow transition-all">
                <mod.icon size={24} />
              </div>
              <div>
                <h3 className="font-display text-cyan-300 text-sm tracking-wider mb-1">{mod.name}</h3>
                <p className="font-mono text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-900/50 bg-cyan-950/20 text-center">
          <p className="font-mono text-[10px] text-cyan-700">
            PRIVACY PROTOCOL ACTIVE: SENSITIVE ACTIONS REQUIRE EXPLICIT USER CONFIRMATION.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnostics;
