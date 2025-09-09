import { AudioSettings } from '@/types/music';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;
  private settings: AudioSettings;
  private scheduledNotes: Array<{oscillator: OscillatorNode, gainNode: GainNode}> = [];
  private isPlaying: boolean = false;

  constructor(settings: AudioSettings) {
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.settings.volume;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  async playFrequency(frequency: number, duration: number, startTime?: number): Promise<void> {
    // Initialize audio context if not already done
    if (!this.audioContext || !this.masterGain) {
      await this.initialize();
    }

    if (!this.audioContext || !this.masterGain) {
      throw new Error('Failed to initialize audio context');
    }

    // Stop any currently playing note
    this.stopCurrentNote();

    // Handle silence (frequency 0)
    if (frequency === 0) {
      return;
    }

    // Create oscillator and gain nodes
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentGain = this.audioContext.createGain();

    // Set up the audio chain
    this.currentOscillator.connect(this.currentGain);
    this.currentGain.connect(this.masterGain);

    // Configure oscillator with precise frequency
    this.currentOscillator.type = this.settings.waveform;
    this.currentOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Use audio context time for precise timing
    const now = startTime || this.audioContext.currentTime;
    const noteDuration = Math.max(0.05, duration - 0.02); // Minimum 50ms duration, with 20ms gap
    const fadeIn = Math.min(0.01, noteDuration * 0.1); // Quick fade in
    const fadeOut = Math.min(0.02, noteDuration * 0.2); // Quick fade out

    // Simple but clear envelope
    this.currentGain.gain.setValueAtTime(0, now);
    this.currentGain.gain.linearRampToValueAtTime(0.8, now + fadeIn); // Quick attack
    this.currentGain.gain.setValueAtTime(0.8, now + noteDuration - fadeOut); // Sustain
    this.currentGain.gain.linearRampToValueAtTime(0, now + noteDuration); // Quick release

    // Start and schedule stop with precise timing
    this.currentOscillator.start(now);
    this.currentOscillator.stop(now + noteDuration);

    // Clean up when finished
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      this.currentGain = null;
    };
  }

  stopCurrentNote(): void {
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
      this.currentOscillator = null;
      this.currentGain = null;
    }
  }

  // Method to stop all scheduled notes (for pause functionality)
  private stopAllNotes(): void {
    this.isPlaying = false;
    
    // Stop all scheduled notes
    this.scheduledNotes.forEach(({ oscillator, gainNode }) => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    
    // Clear the array
    this.scheduledNotes = [];
    
    // Also stop current single note if playing
    this.stopCurrentNote();
  }

  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.masterGain && newSettings.volume !== undefined) {
      this.masterGain.gain.value = newSettings.volume;
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // New pausable method for playing note sequences
  async playNoteSequence(notes: Array<{frequency: number, duration: number, is_rest?: boolean}>): Promise<void> {
    // Initialize audio context if not already done
    if (!this.audioContext || !this.masterGain) {
      await this.initialize();
    }

    if (!this.audioContext || !this.masterGain) {
      throw new Error('Failed to initialize audio context');
    }

    this.stopAllNotes();
    this.isPlaying = true;
    
    let currentTime = this.audioContext.currentTime;
    
    notes.forEach((note) => {
      if (!note.is_rest && note.frequency > 0) {
        this.scheduleNote(note.frequency, note.duration, currentTime);
      }
      currentTime += note.duration;
    });
  }

  // Method to pause/stop all scheduled notes
  pausePlayback(): void {
    this.isPlaying = false;
    this.stopAllNotes();
  }

  // Method to check if currently playing
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  private scheduleNote(frequency: number, duration: number, startTime: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create oscillator and gain nodes for this specific note
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Set up the audio chain
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Configure oscillator
    oscillator.type = this.settings.waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Clear envelope with small gap between notes
    const noteDuration = Math.max(0.05, duration - 0.02); // 20ms gap between notes
    const fadeIn = Math.min(0.005, noteDuration * 0.05); // Very quick fade in (5ms max)
    const fadeOut = Math.min(0.01, noteDuration * 0.1); // Quick fade out (10ms max)

    // Clean envelope for clarity
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.7, startTime + fadeIn);
    gainNode.gain.setValueAtTime(0.7, startTime + noteDuration - fadeOut);
    gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

    // Schedule the note
    oscillator.start(startTime);
    oscillator.stop(startTime + noteDuration);

    // Track scheduled notes for pause functionality
    this.scheduledNotes.push({ oscillator, gainNode });

    // Clean up when finished
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
      // Remove from tracked notes
      const index = this.scheduledNotes.findIndex(n => n.oscillator === oscillator);
      if (index >= 0) {
        this.scheduledNotes.splice(index, 1);
      }
      // Check if all notes finished
      if (this.scheduledNotes.length === 0) {
        this.isPlaying = false;
      }
    };
  }

  destroy(): void {
    this.stopAllNotes();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// Utility function to convert note names to frequencies
export function noteNameToFrequency(noteName: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
  };

  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const semitone = noteMap[note];

  if (semitone === undefined) {
    throw new Error(`Invalid note: ${note}`);
  }

  // A4 = 440Hz is our reference (A4 is octave 4, semitone 9)
  const A4_FREQUENCY = 440;
  const A4_MIDI_NUMBER = 69; // A4 is MIDI note 69
  const midiNumber = (octave + 1) * 12 + semitone;
  
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);
}

// Utility function to convert frequency to note name
export function frequencyToNoteName(frequency: number): string {
  const A4_FREQUENCY = 440;
  const A4_MIDI_NUMBER = 69;
  
  const midiNumber = Math.round(A4_MIDI_NUMBER + 12 * Math.log2(frequency / A4_FREQUENCY));
  const octave = Math.floor(midiNumber / 12) - 1;
  const semitone = midiNumber % 12;
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteName = noteNames[semitone];
  
  return `${noteName}${octave}`;
}
