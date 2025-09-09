'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Settings, 
  Download,
  Copy,
  Loader2
} from 'lucide-react';
import { Arrangement, PlaybackState, AudioSettings } from '@/types/music';
import { AudioEngine } from '@/utils/audioEngine';
import { exportToPython, exportToJSON, downloadFile, copyToClipboard } from '@/utils/exportUtils';
import PianoRoll from './PianoRoll';
import AudioControls from './AudioControls';

interface MusicPlayerProps {
  arrangement: Arrangement | null;
  isLoading: boolean;
}

const defaultAudioSettings: AudioSettings = {
  waveform: 'sine',
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
  volume: 0.5,
};

export default function MusicPlayer({ arrangement, isLoading }: MusicPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentNoteIndex: -1,
    currentTime: 0,
    totalDuration: 0,
  });
  
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>('');
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine(audioSettings);
    
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.destroy();
      }
    };
  }, []);

  // Update audio settings
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateSettings(audioSettings);
    }
  }, [audioSettings]);

  // Update total duration when arrangement changes
  useEffect(() => {
    if (arrangement) {
      setPlaybackState(prev => ({
        ...prev,
        totalDuration: arrangement.total_duration,
      }));
    }
  }, [arrangement]);

  const playArrangement = async () => {
    if (!arrangement || !audioEngineRef.current) return;

    try {
      await audioEngineRef.current.resume();
      
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        currentNoteIndex: 0,
        currentTime: 0,
      }));

      startTimeRef.current = Date.now();
      await playNotesSequentially(arrangement.notes, 0);
      
    } catch (error) {
      console.error('Error playing arrangement:', error);
      stopPlayback();
    }
  };

  const playNotesSequentially = async (notes: typeof arrangement.notes, startIndex: number) => {
    if (!audioEngineRef.current) return;

    for (let i = startIndex; i < notes.length; i++) {
      const note = notes[i];
      
      setPlaybackState(prev => ({
        ...prev,
        currentNoteIndex: i,
        currentTime: prev.currentTime + (i > 0 ? notes[i-1].duration : 0),
      }));

      if (!note.is_rest) {
        await audioEngineRef.current.playFrequency(note.frequency, note.duration);
      }

      // Wait for the note duration
      await new Promise(resolve => {
        playbackTimerRef.current = setTimeout(resolve, note.duration * 1000);
      });

      // Check if playback was stopped
      if (!playbackState.isPlaying) break;
    }

    // Playback finished
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      currentNoteIndex: -1,
      currentTime: 0,
    }));
  };

  const stopPlayback = () => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    if (audioEngineRef.current) {
      audioEngineRef.current.stopCurrentNote();
    }

    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      currentNoteIndex: -1,
      currentTime: 0,
    }));
  };

  const handleExportPython = async () => {
    if (!arrangement) return;
    
    const pythonCode = exportToPython(arrangement);
    try {
      await copyToClipboard(pythonCode);
      setCopyStatus('Python code copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      downloadFile(pythonCode, `${arrangement.title}.py`, 'text/x-python');
    }
  };

  const handleExportJSON = () => {
    if (!arrangement) return;
    
    const jsonData = exportToJSON(arrangement);
    downloadFile(jsonData, `${arrangement.title}.json`, 'application/json');
  };

  if (!arrangement && !isLoading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-8xl mb-6">🎵</div>
        <p className="text-xl font-medium">Générez un arrangement musical pour voir le lecteur</p>
        <p className="text-gray-500 mt-2">Décrivez votre musique et laissez l'IA créer pour vous</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {arrangement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {arrangement.title}
          </h2>
          <div className="flex justify-center gap-6 text-sm text-gray-600 font-medium">
            <span>🎼 Tonalité: {arrangement.key_signature}</span>
            <span>🥁 Tempo: {arrangement.tempo_bpm} BPM</span>
            <span>⏱️ Durée: {arrangement.total_duration.toFixed(1)}s</span>
            <span>🎹 Notes: {arrangement.notes.length}</span>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600 font-medium">Génération de l'arrangement musical...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Piano Roll Visualizer */}
      {arrangement && (
        <PianoRoll
          arrangement={arrangement}
          playbackState={playbackState}
        />
      )}

      {/* Playback Controls */}
      {arrangement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={playbackState.isPlaying ? stopPlayback : playArrangement}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {playbackState.isPlaying ? (
                  <>
                    <Square className="w-4 h-4" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Jouer
                  </>
                )}
              </button>

              {playbackState.currentNoteIndex >= 0 && (
                <div className="text-sm text-gray-600 font-medium">
                  Note {playbackState.currentNoteIndex + 1} sur {arrangement.notes.length}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleExportPython}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-purple-700 rounded-xl hover:bg-purple-50 transition-all duration-300 border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md"
              >
                <Copy className="w-4 h-4" />
                Python
              </button>
              
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-700 rounded-xl hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${(playbackState.currentTime / playbackState.totalDuration) * 100}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Audio Settings */}
          <AnimatePresence>
            {showSettings && (
              <AudioControls
                settings={audioSettings}
                onSettingsChange={setAudioSettings}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Copy Status */}
      <AnimatePresence>
        {copyStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {copyStatus}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
