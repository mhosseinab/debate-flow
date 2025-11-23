
export type Gender = 'Male' | 'Female';
export type PodcastDuration = 5 | 15 | 30 | 45 | 60;

export interface VoiceProfile {
  name: string;
  gender: Gender;
  description: string;
}

export interface PodcastConfig {
  podcastName: string;
  duration: PodcastDuration;
  tone: string;
  format: string;
  audience: string;
  language: string;
  introStyle: string;
  pacing: string;
  
  speaker1Name: string;
  speaker1Gender: Gender;
  speaker1Voice: string;
  
  speaker2Name: string;
  speaker2Gender: Gender;
  speaker2Voice: string;
  
  speakerBalance: string;
  soundDesign: string;
  musicGenre: string;
  vocabularyLevel: string;
  conclusionStyle: string;
  
  generateShowNotes: boolean;
  generateViralClip: boolean;
  criticalAnalysis: boolean;
  customPrompt: string;
}

export interface ParsedLine {
  id: string;
  type: 'dialogue' | 'action' | 'separator' | 'note' | 'text';
  speaker?: string;
  content: string;
  isHost?: boolean;
}

export interface AudioProgress {
  current: number;
  total: number;
}

export type LogStatus = 'PENDING' | 'SUCCESS' | 'ERROR';
export type LogType = 'NAME' | 'SCRIPT' | 'AUDIO';

export interface DebugLog {
  id: string;
  timestamp: string;
  type: LogType;
  prompt: string;
  response?: string;
  status: LogStatus;
}

export type Logger = (action: 'REQUEST' | 'RESPONSE' | 'ERROR', type: LogType, prompt: string, content?: string, id?: string) => string | undefined;
