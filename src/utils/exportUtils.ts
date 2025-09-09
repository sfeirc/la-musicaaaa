import { Arrangement, Note } from '@/types/music';
import { frequencyToNoteName } from './audioEngine';

export function exportToPython(arrangement: Arrangement): string {
  const lines: string[] = [];
  
  lines.push(`# ${arrangement.title}`);
  lines.push(`# Key: ${arrangement.key_signature}, Tempo: ${arrangement.tempo_bpm} BPM`);
  lines.push(`# Total duration: ${arrangement.total_duration.toFixed(2)}s`);
  lines.push('');
  lines.push('import time');
  lines.push('');
  lines.push('def play_frequency(frequency, duration):');
  lines.push('    """Play a frequency for a given duration."""');
  lines.push('    # Implement your audio playback logic here');
  lines.push('    print(f"Playing {frequency:.2f} Hz for {duration:.2f}s")');
  lines.push('    time.sleep(duration)');
  lines.push('');
  lines.push('def play_arrangement():');
  lines.push('    """Play the complete musical arrangement."""');
  
  arrangement.notes.forEach((note, index) => {
    if (note.is_rest) {
      lines.push(`    time.sleep(${note.duration.toFixed(2)})  # Rest`);
    } else {
      const noteName = note.note_name || frequencyToNoteName(note.frequency);
      lines.push(`    play_frequency(${note.frequency.toFixed(2)}, ${note.duration.toFixed(2)})  # ${noteName}`);
    }
  });
  
  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push('    play_arrangement()');
  
  return lines.join('\n');
}

export function exportToJSON(arrangement: Arrangement): string {
  return JSON.stringify(arrangement, null, 2);
}

export function exportToMIDI(arrangement: Arrangement): Uint8Array {
  // Simplified MIDI export - this creates a basic MIDI file
  // For a full implementation, you'd want to use a library like 'midi-file'
  
  const ticksPerQuarter = 480;
  const microsecondsPerQuarter = Math.round(60000000 / arrangement.tempo_bpm);
  
  // MIDI header
  const header = new Uint8Array([
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Header length (6 bytes)
    0x00, 0x00, // Format 0
    0x00, 0x01, // 1 track
    0x01, 0xE0  // 480 ticks per quarter note
  ]);
  
  // Track header
  const trackHeader = new Uint8Array([
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    0x00, 0x00, 0x00, 0x00  // Track length (to be filled)
  ]);
  
  // Track events
  const events: number[] = [];
  
  // Tempo event
  events.push(0x00, 0xFF, 0x51, 0x03); // Delta time, Meta event, Tempo, Length
  events.push(
    (microsecondsPerQuarter >> 16) & 0xFF,
    (microsecondsPerQuarter >> 8) & 0xFF,
    microsecondsPerQuarter & 0xFF
  );
  
  let currentTime = 0;
  
  arrangement.notes.forEach((note) => {
    if (!note.is_rest) {
      // Convert frequency to MIDI note number
      const midiNote = Math.round(69 + 12 * Math.log2(note.frequency / 440));
      const deltaTime = Math.round((currentTime * ticksPerQuarter * arrangement.tempo_bpm) / 60);
      const duration = Math.round((note.duration * ticksPerQuarter * arrangement.tempo_bpm) / 60);
      
      // Note on
      events.push(
        ...encodeVariableLength(deltaTime),
        0x90, // Note on, channel 0
        midiNote,
        0x64 // Velocity
      );
      
      // Note off
      events.push(
        ...encodeVariableLength(duration),
        0x80, // Note off, channel 0
        midiNote,
        0x00 // Velocity
      );
    }
    currentTime += note.duration;
  });
  
  // End of track
  events.push(0x00, 0xFF, 0x2F, 0x00);
  
  // Update track length
  const trackLength = events.length;
  trackHeader[7] = trackLength & 0xFF;
  trackHeader[6] = (trackLength >> 8) & 0xFF;
  trackHeader[5] = (trackLength >> 16) & 0xFF;
  trackHeader[4] = (trackLength >> 24) & 0xFF;
  
  // Combine all parts
  const result = new Uint8Array(header.length + trackHeader.length + events.length);
  result.set(header, 0);
  result.set(trackHeader, header.length);
  result.set(events, header.length + trackHeader.length);
  
  return result;
}

function encodeVariableLength(value: number): number[] {
  const result: number[] = [];
  let v = value;
  
  while (v > 0x7F) {
    result.unshift((v & 0x7F) | 0x80);
    v >>= 7;
  }
  result.push(v & 0x7F);
  
  return result;
}

export function downloadFile(content: string | Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve();
      } else {
        reject(new Error('Failed to copy to clipboard'));
      }
      document.body.removeChild(textArea);
    });
  }
}
