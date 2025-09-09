import { AudioSettings } from '@/types/music';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;
  private settings: AudioSettings;

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

  async playFrequency(frequency: number, duration: number): Promise<void> {
    if (!this.audioContext || !this.masterGain) {
      await this.initialize();
    }

    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio context not available');
    }

    // Stop any currently playing note
    this.stopCurrentNote();

    // Handle silence (frequency 0)
    if (frequency === 0) {
      // Just wait for the duration without playing anything
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      return;
    }

    // Create oscillator and gain nodes
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentGain = this.audioContext.createGain();

    // Set up the audio chain
    this.currentOscillator.connect(this.currentGain);
    this.currentGain.connect(this.masterGain);

    // Configure oscillator
    this.currentOscillator.type = this.settings.waveform;
    this.currentOscillator.frequency.value = frequency;

    // Configure ADSR envelope
    const now = this.audioContext.currentTime;
    const attackTime = this.settings.attack;
    const decayTime = this.settings.decay;
    const sustainLevel = this.settings.sustain;
    const releaseTime = this.settings.release;

    // Start with gain at 0
    this.currentGain.gain.setValueAtTime(0, now);

    // Attack phase
    this.currentGain.gain.linearRampToValueAtTime(1, now + attackTime);

    // Decay phase
    this.currentGain.gain.linearRampToValueAtTime(
      sustainLevel,
      now + attackTime + decayTime
    );

    // Sustain phase (hold at sustain level until release)
    const releaseStartTime = now + duration - releaseTime;
    this.currentGain.gain.setValueAtTime(sustainLevel, releaseStartTime);

    // Release phase
    this.currentGain.gain.linearRampToValueAtTime(0, now + duration);

    // Start and schedule stop
    this.currentOscillator.start(now);
    this.currentOscillator.stop(now + duration);

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

  destroy(): void {
    this.stopCurrentNote();
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
