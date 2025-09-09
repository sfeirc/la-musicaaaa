export interface Note {
  frequency: number;
  duration: number;
  note_name?: string;
  is_rest?: boolean;
}

export interface Arrangement {
  title: string;
  tempo_bpm: number;
  key_signature: string;
  notes: Note[];
  total_duration: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentNoteIndex: number;
  currentTime: number;
  totalDuration: number;
}

export interface ArrangeResponse {
  success: boolean;
  arrangement: Arrangement;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AudioSettings {
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number;
}
