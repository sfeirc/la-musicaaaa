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
  
  // Fully adaptive width based on actual number of notes
  const notesCount = visualNotes.length;
  let noteWidth, minWidth;
  
  if (notesCount <= 8) {
    noteWidth = 80; // Wide notes for short sequences
    minWidth = 800;
  } else if (notesCount <= 15) {
    noteWidth = 60; // Medium notes for medium sequences  
    minWidth = 1000;
  } else {
    noteWidth = 45; // Compact notes for long sequences
    minWidth = 1200;
  }
  
  const baseWidth = Math.max(minWidth, notesCount * noteWidth);
  const rollWidth = Math.max(baseWidth, totalDuration * (noteWidth * 2));

  // Get note name from MIDI number
  const getMidiNoteName = (midiNote: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  };

  // Get frequency from MIDI note
  const getFrequencyFromMidi = (midiNote: number): number => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  };

  // Check if a note is a black key
  const isBlackKey = (midiNote: number): boolean => {
    const semitone = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(semitone); // C#, D#, F#, G#, A#
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">🎹 Rouleau de Piano</h3>
        {playbackState.currentNoteIndex >= 0 && (
          <div className="text-sm font-medium text-blue-300 bg-blue-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="animate-pulse">🎵</span>
            <span>En cours :</span>
            <span className="font-bold">
              {arrangement.notes[playbackState.currentNoteIndex]?.note_name || 
                frequencyToNoteName(arrangement.notes[playbackState.currentNoteIndex]?.frequency || 440)}
            </span>
            <span className="text-xs opacity-75">
              {arrangement.notes[playbackState.currentNoteIndex]?.frequency?.toFixed(1)}Hz
            </span>
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto overflow-y-hidden border border-gray-600/50 rounded-xl bg-gray-900/50">
        <svg
          width={rollWidth + 120}
          height={rollHeight + 40}
          className="block"
          style={{ minWidth: `${minWidth}px` }}
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
                stroke="#374151"
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
                    fill={isBlack ? '#1f2937' : '#374151'}
                    stroke="#4b5563"
                    strokeWidth={0.5}
                  />
                  <text
                    x={75}
                    y={y + 10}
                    textAnchor="end"
                    fontSize="9"
                    fill={isBlack ? '#d1d5db' : '#f3f4f6'}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {getMidiNoteName(midiNote)}
                  </text>
                  <text
                    x={75}
                    y={y + 18}
                    textAnchor="end"
                    fontSize="7"
                    fill={isBlack ? '#9ca3af' : '#d1d5db'}
                    fontFamily="monospace"
                  >
                    {getFrequencyFromMidi(midiNote).toFixed(1)}Hz
                  </text>
                </g>
              );
            })}
          </g>

          {/* Time markers */}
          <g>
            {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => {
              const xPos = 100 + (i / totalDuration) * (rollWidth - 100);
              return (
                <g key={i}>
                  <line
                    x1={xPos}
                    y1={0}
                    x2={xPos}
                    y2={rollHeight + 20}
                    stroke="#4b5563"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={xPos}
                    y={15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                  >
                    {i}s
                  </text>
                </g>
              );
            })}
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
                {width > noteWidth * 0.4 && (
                  <>
                    <text
                      x={x + Math.max(2, width * 0.05)}
                      y={y + 10}
                      fontSize={Math.max(7, Math.min(10, width * 0.15))}
                      fill="white"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {note.note_name}
                    </text>
                    {width > noteWidth * 0.7 && (
                      <text
                        x={x + Math.max(2, width * 0.05)}
                        y={y + 16}
                        fontSize={Math.max(6, Math.min(8, width * 0.12))}
                        fill="rgba(255,255,255,0.8)"
                        fontFamily="monospace"
                      >
                        {note.frequency.toFixed(0)}Hz
                      </text>
                    )}
                  </>
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

      {/* Simplified Stats */}
      {arrangement && (
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-400">
          <span>{visualNotes.length} notes</span>
          <span>{getMidiNoteName(minMidi)} - {getMidiNoteName(maxMidi)}</span>
          <span>{getFrequencyFromMidi(minMidi).toFixed(0)} - {getFrequencyFromMidi(maxMidi).toFixed(0)}Hz</span>
          <span>{totalDuration.toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
}
