'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Arrangement, PlaybackState } from '@/types/music';
import { frequencyToNoteName } from '@/utils/audioEngine';

interface PianoRollProps {
  arrangement: Arrangement;
  playbackState: PlaybackState;
}

interface VisualNote {
  id: number;
  frequency: number;
  duration: number;
  startTime: number;
  note_name?: string;
  is_rest?: boolean;
  midiNote: number;
}

export default function PianoRoll({ arrangement, playbackState }: PianoRollProps) {
  const visualNotes = useMemo(() => {
    let currentTime = 0;
    const notes: VisualNote[] = [];

    arrangement.notes.forEach((note, index) => {
      if (!note.is_rest) {
        const midiNote = Math.round(69 + 12 * Math.log2(note.frequency / 440));
        notes.push({
          id: index,
          frequency: note.frequency,
          duration: note.duration,
          startTime: currentTime,
          note_name: note.note_name || frequencyToNoteName(note.frequency),
          is_rest: note.is_rest,
          midiNote,
        });
      }
      currentTime += note.duration;
    });

    return notes;
  }, [arrangement]);

  const { minMidi, maxMidi, totalDuration } = useMemo(() => {
    if (visualNotes.length === 0) return { minMidi: 60, maxMidi: 72, totalDuration: 0 };
    
    const midiNotes = visualNotes.map(n => n.midiNote);
    const min = Math.min(...midiNotes);
    const max = Math.max(...midiNotes);
    
    // Add some padding
    return {
      minMidi: min - 2,
      maxMidi: max + 2,
      totalDuration: arrangement.total_duration,
    };
  }, [visualNotes, arrangement.total_duration]);

  const noteRange = maxMidi - minMidi + 1;
  const rollHeight = Math.max(300, noteRange * 20);
  const rollWidth = Math.max(800, totalDuration * 100);

  // Get note name from MIDI number
  const getMidiNoteName = (midiNote: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  };

  // Check if a note is a black key
  const isBlackKey = (midiNote: number): boolean => {
    const semitone = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(semitone); // C#, D#, F#, G#, A#
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Piano Roll</h3>
        {playbackState.currentNoteIndex >= 0 && (
          <div className="text-sm text-gray-600">
            Now playing: {arrangement.notes[playbackState.currentNoteIndex]?.note_name || 
              frequencyToNoteName(arrangement.notes[playbackState.currentNoteIndex]?.frequency || 440)}
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto overflow-y-hidden border rounded-lg bg-gray-50">
        <svg
          width={rollWidth + 100}
          height={rollHeight + 40}
          className="block"
          style={{ minWidth: '800px' }}
        >
          {/* Background grid */}
          <defs>
            <pattern
              id="grid"
              width="50"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 20"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Piano keys on the left */}
          <g>
            {Array.from({ length: noteRange }, (_, i) => {
              const midiNote = maxMidi - i;
              const y = i * 20 + 20;
              const isBlack = isBlackKey(midiNote);
              
              return (
                <g key={midiNote}>
                  <rect
                    x={0}
                    y={y}
                    width={80}
                    height={20}
                    fill={isBlack ? '#374151' : '#ffffff'}
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                  />
                  <text
                    x={75}
                    y={y + 14}
                    textAnchor="end"
                    fontSize="10"
                    fill={isBlack ? '#ffffff' : '#374151'}
                    fontFamily="monospace"
                  >
                    {getMidiNoteName(midiNote)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Time markers */}
          <g>
            {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
              <g key={i}>
                <line
                  x1={100 + i * 100}
                  y1={0}
                  x2={100 + i * 100}
                  y2={rollHeight + 20}
                  stroke="#d1d5db"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                <text
                  x={100 + i * 100}
                  y={15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {i}s
                </text>
              </g>
            ))}
          </g>

          {/* Notes */}
          {visualNotes.map((note) => {
            const x = 100 + (note.startTime / totalDuration) * (rollWidth - 100);
            const width = (note.duration / totalDuration) * (rollWidth - 100);
            const y = (maxMidi - note.midiNote) * 20 + 20;
            const isCurrentNote = playbackState.currentNoteIndex >= 0 && 
              arrangement.notes[playbackState.currentNoteIndex]?.frequency === note.frequency;
            
            return (
              <motion.g key={note.id}>
                <motion.rect
                  x={x}
                  y={y + 2}
                  width={width}
                  height={16}
                  rx={2}
                  fill={isCurrentNote ? '#ef4444' : '#3b82f6'}
                  stroke={isCurrentNote ? '#dc2626' : '#2563eb'}
                  strokeWidth={1}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    fill: isCurrentNote ? '#ef4444' : '#3b82f6'
                  }}
                  transition={{ duration: 0.2 }}
                />
                {width > 40 && (
                  <text
                    x={x + 4}
                    y={y + 13}
                    fontSize="10"
                    fill="white"
                    fontFamily="monospace"
                  >
                    {note.note_name}
                  </text>
                )}
              </motion.g>
            );
          })}

          {/* Playhead */}
          {playbackState.isPlaying && playbackState.currentTime > 0 && (
            <motion.line
              x1={100 + (playbackState.currentTime / totalDuration) * (rollWidth - 100)}
              y1={20}
              x2={100 + (playbackState.currentTime / totalDuration) * (rollWidth - 100)}
              y2={rollHeight + 20}
              stroke="#ef4444"
              strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Currently playing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Black keys</span>
        </div>
      </div>
    </div>
  );
}
