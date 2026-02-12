export interface AudioStreamConfig {
  sampleRate: number;
}

export interface LiveSessionState {
  isConnected: boolean;
  isSpeaking: boolean; // User is speaking
  isAiSpeaking: boolean; // AI is speaking
  volume: number; // For visualizer (0-1)
  transcripts: TranscriptionItem[];
  error: string | null;
}

export interface TranscriptionItem {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: number;
  isComplete: boolean;
}

export interface VisualizerData {
  frequencyData: Uint8Array;
}
