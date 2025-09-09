'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Activity } from 'lucide-react';
import { AudioSettings } from '@/types/music';

interface AudioControlsProps {
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

export default function AudioControls({ settings, onSettingsChange }: AudioControlsProps) {
  const waveformOptions: Array<{ value: AudioSettings['waveform']; label: string; description: string }> = [
    { value: 'sine', label: 'Sinusoïdale', description: 'Son pur' },
    { value: 'square', label: 'Carrée', description: 'Son numérique' },
    { value: 'triangle', label: 'Triangulaire', description: 'Son doux' },
  ];

  const handleSliderChange = (key: keyof AudioSettings, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleWaveformChange = (waveform: AudioSettings['waveform']) => {
    onSettingsChange({
      ...settings,
      waveform,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-gray-600/50 pt-4 mt-4 space-y-4"
    >
      <h4 className="font-bold text-white flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Paramètres Audio
      </h4>

      {/* Waveform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Type de Son
        </label>
        <div className="grid grid-cols-3 gap-2">
          {waveformOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleWaveformChange(option.value)}
              className={`p-2 text-center rounded-lg border transition-all ${
                settings.waveform === option.value
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="font-medium text-xs">{option.label}</div>
              <div className="text-xs opacity-75 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Volume Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Volume : {Math.round(settings.volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.volume}
          onChange={(e) => handleSliderChange('volume', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

    </motion.div>
  );
}
