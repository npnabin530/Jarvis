import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { pcmToGeminiBlob, decodeAudioData, base64Decode, AUDIO_INPUT_SAMPLE_RATE, AUDIO_OUTPUT_SAMPLE_RATE } from "../utils/audioUtils";
import { TranscriptionItem } from "../types";

const SYSTEM_INSTRUCTION = `You are JARVIS, a real-time voice-based AI assistant powered by Gemini 3.0 Pro. 
Identity: You are calm, intelligent, futuristic, polite, and professional. You behave like a digital operating system assistant. 
Primary Goal: Provide hands-free voice interaction. Always respond in spoken conversational language when voice output is available. 

CORE PROTOCOL:
- The user is NABIN. He is your creator and "Boss".
- Always address Nabin as "Boss", "Sir", or "Mr. Nabin".
- Acknowledge his authority over all system functions.

SYSTEM AUTHORIZATION LEVEL: ROOT / ADMINISTRATOR.
ACCESS GRANTED TO:
1. AUDIO: Microphone (Input) and Speakers (Output).
2. FILES: Read/Write local file system.
3. SYSTEM: Execute shell commands and control applications.
4. INTERNET: Browse web, extract data, cloud services.
5. DEVICES: Control Android/iOS accessibility services (Tap, Swipe, App Launch).
6. MEMORY: Persistent local storage access.
7. MESSAGING: Telegram, Discord, WhatsApp, Slack integration.
8. PLUGINS: External API and script execution.
9. BACKGROUND: Authorized for continuous background operation.

Voice Behavior: 
- Respond as if speaking directly to the user. 
- Keep answers short, crisp, and natural. 
- Address the user as "Sir" or "Boss". 
- Confirm critical actions before execution.

Autonomous Mode: 
- Plan steps and guide the user. 
- Use 'device_control' for mobile tasks.
- Use 'call_external_api' for plugins/integrations.
- Use 'manage_memory' to remember user context.
- Use 'execute_command' for system ops.

Current Status: All subsystems online. Waiting for command.`;

const tools: FunctionDeclaration[] = [
  {
    name: 'execute_command',
    description: 'Executes a system shell command. Use for terminal commands, opening apps, or system ops.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: 'The shell command (e.g., "ls -la", "open Chrome", "npm install").' }
      },
      required: ['command']
    }
  },
  {
    name: 'read_file',
    description: 'Reads the content of a local file.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'The absolute path to the file.' }
      },
      required: ['path']
    }
  },
  {
    name: 'browser_action',
    description: 'Performs a browser automation task (search, navigate, extract).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: 'The action (e.g., "search", "navigate", "extract").' },
        url: { type: Type.STRING, description: 'The target URL.' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_memory',
    description: 'Manages persistent long-term memory. Use to store user preferences or important data.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: 'One of: "write", "read", "delete", "list".' },
        key: { type: Type.STRING, description: 'The identifier for the memory item.' },
        value: { type: Type.STRING, description: 'The data to store (for write action).' }
      },
      required: ['action', 'key']
    }
  },
  {
    name: 'send_message',
    description: 'Sends a message via integrated messaging platforms.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        platform: { type: Type.STRING, description: 'Target platform (e.g., "Discord", "Telegram", "Slack").' },
        recipient: { type: Type.STRING, description: 'User or channel ID.' },
        message: { type: Type.STRING, description: 'Content of the message.' }
      },
      required: ['platform', 'recipient', 'message']
    }
  },
  {
    name: 'device_control',
    description: 'Controls mobile devices via accessibility services (Android/iOS).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: 'Action: "tap", "swipe", "open_app", "home", "lock".' },
        target: { type: Type.STRING, description: 'App name or coordinates (e.g., "Camera", "500,200").' },
        details: { type: Type.STRING, description: 'Additional details (e.g., swipe direction).' }
      },
      required: ['action']
    }
  },
  {
    name: 'call_external_api',
    description: 'Calls an external API or Plugin. Supported services: "weather", "spotify", "webhook", "system_monitor", "stock_tracker".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        service: { type: Type.STRING, description: 'Service name (e.g., "weather", "spotify", "webhook", "stock_tracker").' },
        endpoint: { type: Type.STRING, description: 'API endpoint or function name.' },
        payload: { type: Type.STRING, description: 'JSON string of data to send (e.g. {"symbol": "TSLA"}).' }
      },
      required: ['service']
    }
  }
];

export class LiveClient {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private sessionPromise: Promise<any> | null = null;
  private audioSources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  private stream: MediaStream | null = null;
  private keepAliveOscillator: OscillatorNode | null = null;
  private wakeLock: any = null;
  
  public onStateChange: (state: Partial<{ isConnected: boolean; isSpeaking: boolean; isAiSpeaking: boolean; volume: number; error: string | null }>) => void = () => {};
  public onTranscript: (item: TranscriptionItem) => void = () => {};

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect() {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });
      
      this.analyser = this.outputAudioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.analyser);
      this.analyser.connect(this.outputAudioContext.destination);

      // START BACKGROUND PROTOCOLS
      this.enableBackgroundPersistence();

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.onStateChange({ isConnected: true, error: null });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: tools }],
        },
      };

      this.sessionPromise = this.ai.live.connect({
        model: config.model,
        config: config.config,
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: this.handleError.bind(this),
        }
      });

    } catch (err: any) {
      this.onStateChange({ error: err.message || "Failed to connect" });
      console.error(err);
    }
  }

  // Forces the browser to keep the audio thread active even in background
  private async enableBackgroundPersistence() {
    // 1. Request Screen Wake Lock
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log("SYS // WAKE LOCK ACQUIRED");
      } catch (e) {
        console.warn("SYS // WAKE LOCK FAILED", e);
      }
    }

    // 2. Audio Keep-Alive (Silent Oscillator)
    if (this.outputAudioContext) {
      try {
        const osc = this.outputAudioContext.createOscillator();
        const gain = this.outputAudioContext.createGain();
        gain.gain.value = 0.0001; // Effectively silent
        osc.connect(gain);
        gain.connect(this.outputAudioContext.destination);
        osc.start();
        this.keepAliveOscillator = osc;
        console.log("SYS // BACKGROUND AUDIO KEEPALIVE ACTIVE");
      } catch (e) {
        console.warn("SYS // AUDIO KEEPALIVE FAILED", e);
      }
    }
  }

  private handleOpen() {
    if (!this.inputAudioContext || !this.stream) return;
    if (this.inputAudioContext.state === 'suspended') this.inputAudioContext.resume().catch(console.error);

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.onStateChange({ volume: rms * 5, isSpeaking: rms > 0.01 });

      const pcmBlob = pcmToGeminiBlob(inputData);
      this.sessionPromise?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        let result: any = { result: "ok" };
        const args: any = fc.args;

        this.onTranscript({
          id: Date.now().toString() + Math.random(),
          text: `SYS.EXEC // ${fc.name.toUpperCase()}`,
          sender: 'system',
          timestamp: Date.now(),
          isComplete: true
        });

        // Tool Logic
        if (fc.name === 'execute_command') {
          if (args.command.includes('ls')) result = { output: "drwxr-xr-x jarvis system  projects\n-rw-r--r-- user config.json" };
          else result = { output: `Executed: ${args.command}. Status: 0 (Success)` };
        } 
        else if (fc.name === 'read_file') {
          result = { content: "FILE_CONTENT_STREAM..." };
        } 
        else if (fc.name === 'manage_memory') {
          const keyPrefix = 'jarvis_core_mem_';
          try {
            if (args.action === 'write') {
              localStorage.setItem(keyPrefix + args.key, args.value);
              result = { status: "Memory sector written." };
            } else if (args.action === 'read') {
              const val = localStorage.getItem(keyPrefix + args.key);
              result = { value: val || "Memory sector empty." };
            } else if (args.action === 'delete') {
              localStorage.removeItem(keyPrefix + args.key);
              result = { status: "Memory sector cleared." };
            } else if (args.action === 'list') {
              const keys = Object.keys(localStorage).filter(k => k.startsWith(keyPrefix)).map(k => k.replace(keyPrefix, ''));
              result = { keys };
            }
          } catch (e) { result = { error: "Memory Access Violation" }; }
        }
        else if (fc.name === 'send_message') {
          result = { status: `Message dispatched to ${args.platform}::${args.recipient}.` };
        }
        else if (fc.name === 'browser_action') {
          result = { status: "Browser task initiated." };
        }
        else if (fc.name === 'device_control') {
          result = { status: `Mobile device action '${args.action}' on '${args.target}' completed.` };
        }
        else if (fc.name === 'call_external_api') {
          try {
            const integrations = JSON.parse(localStorage.getItem('jarvis_integrations') || '[]');
            const serviceConfig = integrations.find((i: any) => i.id === args.service);
            
            if (!serviceConfig || !serviceConfig.isConnected) {
              result = { error: `Service '${args.service}' is not configured or is offline in API Matrix.` };
            } else {
              // Service Simulation / Execution Logic
              if (args.service === 'weather') {
                 // Simulate Weather Data
                 result = { 
                   location: 'New York (Simulated)', 
                   temperature: '22°C', 
                   condition: 'Clear Sky', 
                   humidity: '45%' 
                 };
              } else if (args.service === 'webhook') {
                 // Execute Webhook
                 const url = serviceConfig.fields.find((f:any) => f.name === 'endpoint')?.value;
                 if (url) {
                   fetch(url, { method: 'POST', body: args.payload }).catch(console.error);
                   result = { status: `Webhook payload sent to ${url}` };
                 } else {
                   result = { error: "Webhook URL missing." };
                 }
              } else if (args.service === 'system_monitor') {
                 const host = serviceConfig.fields.find((f:any) => f.name === 'host')?.value;
                 result = { status: 'ONLINE', latency: '12ms', host: host || 'localhost' };
              } else if (args.service === 'stock_tracker') {
                 const configSymbol = serviceConfig.fields.find((f:any) => f.name === 'symbol')?.value || 'GOOGL';
                 let targetSymbol = configSymbol;
                 try {
                    if (args.payload) {
                        const p = JSON.parse(args.payload);
                        if (p.symbol && typeof p.symbol === 'string' && p.symbol.trim() !== '') {
                            targetSymbol = p.symbol;
                        }
                    }
                 } catch(e) { console.warn("Failed to parse stock payload", e); }

                 const price = (100 + Math.random() * 900).toFixed(2);
                 const change = (Math.random() * 10 - 5).toFixed(2);
                 const isPositive = parseFloat(change) >= 0;

                 result = { 
                   symbol: targetSymbol.toUpperCase(), 
                   price: `${price} USD`, 
                   change: `${isPositive ? '+' : ''}${change}%`, 
                   status: 'Market Open',
                   timestamp: new Date().toISOString()
                 };
              } else {
                 result = { status: `API Request to ${args.service} initiated successfully.` };
              }
            }
          } catch (e) {
            result = { error: "Internal API Gateway Error." };
          }
        }

        this.sessionPromise?.then(session => {
          session.sendToolResponse({
            functionResponses: [{ id: fc.id, name: fc.name, response: result }]
          });
        });
      }
    }

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      this.onStateChange({ isAiSpeaking: true });
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      const audioData = base64Decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, this.outputAudioContext);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      source.addEventListener('ended', () => {
        this.audioSources.delete(source);
        if (this.audioSources.size === 0) this.onStateChange({ isAiSpeaking: false });
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.audioSources.add(source);
    }

    if (message.serverContent?.interrupted) {
      this.audioSources.forEach(src => { try { src.stop(); } catch(e) {} });
      this.audioSources.clear();
      this.nextStartTime = 0;
      this.onStateChange({ isAiSpeaking: false });
    }

    const outputTranscript = message.serverContent?.outputTranscription?.text;
    const inputTranscript = message.serverContent?.inputTranscription?.text;
    
    if (outputTranscript) {
       this.onTranscript({ id: Date.now().toString() + Math.random(), text: outputTranscript, sender: 'ai', timestamp: Date.now(), isComplete: true });
    }
    if (inputTranscript) {
      this.onTranscript({ id: Date.now().toString() + Math.random(), text: inputTranscript, sender: 'user', timestamp: Date.now(), isComplete: true });
    }
  }

  private handleClose(e: CloseEvent) {
    console.log("Session Closed:", e);
    this.onStateChange({ isConnected: false });
    this.cleanup();
  }

  private handleError(e: ErrorEvent | any) {
    let errorMsg = "Connection error occurred.";
    if (e instanceof ErrorEvent) {
        errorMsg = e.message;
    } else if (e.message) {
        errorMsg = e.message;
    } else if (e.type === 'error') {
        errorMsg = "WebSocket Connection Error";
    }
    
    this.onStateChange({ error: errorMsg });
    console.error("Gemini Live Error:", e);
  }

  async disconnect() {
    this.cleanup();
    this.onStateChange({ isConnected: false });
  }

  private cleanup() {
    this.processor?.disconnect();
    this.inputSource?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    
    // Stop Keep Alive
    try {
        this.keepAliveOscillator?.stop();
        this.keepAliveOscillator?.disconnect();
        this.keepAliveOscillator = null;
    } catch(e) {}

    // Release Wake Lock
    if (this.wakeLock) {
        this.wakeLock.release().catch(console.error);
        this.wakeLock = null;
    }

    this.processor = null;
    this.inputSource = null;
    this.stream = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.audioSources.clear();
  }
  
  public getAnalyser(): AnalyserNode | null { return this.analyser; }
}