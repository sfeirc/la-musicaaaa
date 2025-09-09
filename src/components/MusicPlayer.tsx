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
  attack: 0.005,  // Very quick attack for clarity
  decay: 0.05,    // Short decay
  sustain: 0.8,   // High sustain for clear notes
  release: 0.02,  // Quick release to separate notes
  volume: 0.6,    // Slightly louder default
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
  const isPlayingRef = useRef<boolean>(false);

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
      
      isPlayingRef.current = true;
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        currentNoteIndex: 0,
        currentTime: 0,
      }));

      startTimeRef.current = Date.now();
      
      // Use the new precise timing method
      await audioEngineRef.current.playNoteSequence(arrangement.notes);
      
      // Start the visual progress tracking
      trackPlaybackProgress(arrangement.notes);
      
    } catch (error) {
      console.error('Error playing arrangement:', error);
      stopPlayback();
    }
  };

  const trackPlaybackProgress = (notes: typeof arrangement.notes) => {
    let cumulativeTime = 0;
    let currentNoteIndex = 0;
    
    const updateProgress = () => {
      if (!isPlayingRef.current) return;
      
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      
      // Find current note based on elapsed time
      let noteTime = 0;
      let noteIndex = 0;
      
      for (let i = 0; i < notes.length; i++) {
        if (elapsedTime >= noteTime && elapsedTime < noteTime + notes[i].duration) {
          noteIndex = i;
          break;
        }
        noteTime += notes[i].duration;
      }
      
      setPlaybackState(prev => ({
        ...prev,
        currentNoteIndex: noteIndex,
        currentTime: elapsedTime,
      }));
      
      // Continue tracking if still playing and not finished
      if (elapsedTime < arrangement!.total_duration) {
        playbackTimerRef.current = setTimeout(updateProgress, 50); // Update every 50ms
      } else {
        // Playback finished
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: false,
          currentNoteIndex: -1,
          currentTime: 0,
        }));
        isPlayingRef.current = false;
      }
    };
    
    // Start progress tracking
    updateProgress();
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    if (audioEngineRef.current) {
      audioEngineRef.current.pausePlayback();
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
      <div className="text-center py-16 text-gray-400">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-lg">Générez de la musique pour voir le lecteur</p>
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
          <h2 className="text-xl font-bold text-white mb-3">
            {arrangement.title}
          </h2>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>{arrangement.key_signature}</span>
            <span>{arrangement.tempo_bpm} BPM</span>
            <span>{arrangement.total_duration.toFixed(1)}s</span>
            <span>{arrangement.notes.length} notes</span>
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
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-3" />
            <span className="text-gray-300">Création de l'arrangement...</span>
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
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={playbackState.isPlaying ? stopPlayback : playArrangement}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300"
              >
                {playbackState.isPlaying ? (
                  <>
                    <Square className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Jouer
                  </>
                )}
              </button>

              {playbackState.currentNoteIndex >= 0 && (
                <div className="text-sm text-gray-400">
                  {playbackState.currentNoteIndex + 1} / {arrangement.notes.length}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleExportPython}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-purple-300 rounded-lg hover:bg-gray-700/50 transition-all duration-300 border border-gray-600/50"
              >
                <Copy className="w-4 h-4" />
                Python
              </button>
              
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-blue-300 rounded-lg hover:bg-gray-700/50 transition-all duration-300 border border-gray-600/50"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
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
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {copyStatus}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
