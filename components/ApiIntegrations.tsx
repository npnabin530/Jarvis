import React, { useState, useEffect } from 'react';
import { X, Globe, Music, Home, Code, CheckCircle, AlertCircle, Save, Trash2, Link as LinkIcon, Activity, TrendingUp } from 'lucide-react';

interface ApiIntegrationsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  fields: { name: string; label: string; type: string; value: string }[];
  isConnected: boolean;
}

const ApiIntegrations: React.FC<ApiIntegrationsProps> = ({ isOpen, onClose }) => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'weather',
      name: 'Global Weather Net',
      icon: Globe,
      description: 'Real-time atmospheric data and forecasting.',
      fields: [{ name: 'apiKey', label: 'API Key (OpenWeatherMap)', type: 'password', value: 'stark_owm_8f9e2d1c3b4a592817' }],
      isConnected: true
    },
    {
      id: 'spotify',
      name: 'Spotify Connect',
      icon: Music,
      description: 'Media playback control and library access.',
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', value: 'stark_spot_id_9928374' },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', value: 'stark_spot_sec_11223344' }
      ],
      isConnected: true
    },
    {
      id: 'stock_tracker',
      name: 'Stock Market Tracker',
      icon: TrendingUp,
      description: 'Real-time financial data and market analysis.',
      fields: [{ name: 'symbol', label: 'Default Symbol (e.g., AAPL)', type: 'text', value: 'GOOGL' }],
      isConnected: true
    },
    {
      id: 'smarthome',
      name: 'Home IoT Grid',
      icon: Home,
      description: 'Philips Hue / SmartThings bridge connection.',
      fields: [{ name: 'bridgeIp', label: 'Bridge IP Address', type: 'text', value: '192.168.1.200' }],
      isConnected: true
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      icon: Code,
      description: 'Generic REST endpoint for custom automation scripts.',
      fields: [{ name: 'endpoint', label: 'Webhook URL', type: 'text', value: 'https://api.stark-industries.com/v1/auto' }],
      isConnected: true
    },
    {
      id: 'system_monitor',
      name: 'System Online Monitor',
      icon: Activity,
      description: 'Ping remote servers to verify system uptime.',
      fields: [{ name: 'host', label: 'Target Host / IP', type: 'text', value: '10.0.0.1 (Mainframe)' }],
      isConnected: true
    }
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('jarvis_integrations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIntegrations(prev => prev.map(p => {
            const savedItem = parsed.find((s: any) => s.id === p.id);
            // If local storage has data, prefer it, otherwise keep default (pre-filled)
            return savedItem ? { ...p, ...savedItem } : p;
        }));
      } catch (e) { console.error("Failed to load integrations", e); }
    } else {
        // If no local storage exists, save the pre-filled defaults immediately
        localStorage.setItem('jarvis_integrations', JSON.stringify(integrations.map(i => ({
            id: i.id,
            fields: i.fields,
            isConnected: i.isConnected
        }))));
    }
  }, []);

  const handleSave = (id: string) => {
    setIntegrations(prev => {
        const updated = prev.map(item => {
            if (item.id === id) {
                const hasValues = item.fields.every(f => f.value.trim().length > 0);
                return { ...item, isConnected: hasValues };
            }
            return item;
        });
        
        localStorage.setItem('jarvis_integrations', JSON.stringify(updated.map(i => ({
            id: i.id,
            fields: i.fields,
            isConnected: i.isConnected
        }))));
        
        return updated;
    });
    setActiveId(null);
  };

  const handleChange = (id: string, fieldName: string, val: string) => {
    setIntegrations(prev => prev.map(item => {
        if (item.id === id) {
            return {
                ...item,
                fields: item.fields.map(f => f.name === fieldName ? { ...f, value: val } : f)
            };
        }
        return item;
    }));
  };

  const handleDisconnect = (id: string) => {
      setIntegrations(prev => {
          const updated = prev.map(item => {
              if (item.id === id) {
                  return {
                      ...item,
                      isConnected: false,
                      fields: item.fields.map(f => ({ ...f, value: '' }))
                  };
              }
              return item;
          });
          localStorage.setItem('jarvis_integrations', JSON.stringify(updated.map(i => ({
              id: i.id,
              fields: i.fields,
              isConnected: i.isConnected
          }))));
          return updated;
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-black border border-cyan-500/50 rounded-lg shadow-[0_0_50px_rgba(8,145,178,0.2)] flex flex-col max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-900/50 bg-cyan-950/20">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-cyan-500 rounded bg-cyan-500/10">
                <LinkIcon className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-400 tracking-widest font-display">EXTERNAL INTEGRATION MATRIX</h2>
              <p className="text-[10px] text-cyan-600 font-mono tracking-[0.2em]">API GATEWAY // PLUGIN CONFIGURATION</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cyan-900/30 rounded-full transition-colors text-cyan-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {integrations.map((item) => (
                    <div key={item.id} className={`relative border rounded-lg p-5 transition-all duration-300 ${item.isConnected ? 'border-green-500/50 bg-green-950/10' : 'border-cyan-900/30 bg-cyan-950/5 hover:border-cyan-500/50'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${item.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-cyan-900/20 text-cyan-600'}`}>
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <h3 className={`font-display tracking-wider ${item.isConnected ? 'text-green-400' : 'text-cyan-300'}`}>{item.name}</h3>
                                    <p className="text-[10px] font-mono text-slate-500 mt-1">{item.description}</p>
                                </div>
                            </div>
                            {item.isConnected ? (
                                <div className="flex items-center gap-1 text-green-500 text-xs font-mono border border-green-500/30 px-2 py-1 rounded bg-green-500/10">
                                    <CheckCircle size={12} /> LINKED
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-slate-500 text-xs font-mono border border-slate-700 px-2 py-1 rounded">
                                    <AlertCircle size={12} /> OFFLINE
                                </div>
                            )}
                        </div>

                        {activeId === item.id ? (
                            <div className="mt-4 space-y-4 border-t border-cyan-900/30 pt-4 animate-in slide-in-from-top-2 duration-200">
                                {item.fields.map(field => (
                                    <div key={field.name}>
                                        <label className="block text-[10px] font-mono text-cyan-700 mb-1 uppercase">{field.label}</label>
                                        <input 
                                            type={field.type} 
                                            value={field.value}
                                            onChange={(e) => handleChange(item.id, field.name, e.target.value)}
                                            className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 rounded focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_10px_rgba(8,145,178,0.3)] placeholder-cyan-900"
                                            placeholder={`Enter ${field.label}...`}
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-2 justify-end mt-2">
                                    <button 
                                        onClick={() => setActiveId(null)}
                                        className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-3 py-1"
                                    >
                                        CANCEL
                                    </button>
                                    <button 
                                        onClick={() => handleSave(item.id)}
                                        className="flex items-center gap-2 text-xs font-bold bg-cyan-900/50 hover:bg-cyan-500 text-cyan-300 hover:text-black px-4 py-2 rounded transition-all"
                                    >
                                        <Save size={14} /> SAVE CONFIG
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 flex justify-end">
                                {item.isConnected ? (
                                     <button 
                                        onClick={() => handleDisconnect(item.id)}
                                        className="flex items-center gap-2 text-[10px] font-mono text-red-400 hover:text-red-300 border border-transparent hover:border-red-900 px-3 py-1 rounded transition-colors"
                                    >
                                        <Trash2 size={12} /> DISCONNECT
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setActiveId(item.id)}
                                        className="flex items-center gap-2 text-[10px] font-mono text-cyan-500 hover:text-cyan-300 border border-cyan-900 hover:border-cyan-500 px-3 py-1 rounded transition-all"
                                    >
                                        CONFIGURE
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-900/50 bg-cyan-950/20 text-center">
            <p className="font-mono text-[10px] text-cyan-700">
                DATA ENCRYPTION PROTOCOL: KEYS STORED LOCALLY. DO NOT SHARE SCREEN WHILE CONFIGURING.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegrations;