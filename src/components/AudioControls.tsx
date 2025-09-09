'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Zap, Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { AudioSettings } from '@/types/music';

interface AudioControlsProps {
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

export default function AudioControls({ settings, onSettingsChange }: AudioControlsProps) {
  const waveformOptions: Array<{ value: AudioSettings['waveform']; label: string; description: string }> = [
    { value: 'sine', label: 'Sine', description: 'Smooth, pure tone' },
    { value: 'square', label: 'Square', description: 'Sharp, digital sound' },
    { value: 'sawtooth', label: 'Sawtooth', description: 'Bright, buzzy tone' },
    { value: 'triangle', label: 'Triangle', description: 'Soft, mellow sound' },
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
      className="border-t pt-4 mt-4 space-y-6"
    >
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Audio Settings
      </h4>

      {/* Waveform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Waveform
        </label>
        <div className="grid grid-cols-2 gap-2">
          {waveformOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleWaveformChange(option.value)}
              className={`p-3 text-left rounded-lg border transition-all ${
                settings.waveform === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Volume Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Volume: {Math.round(settings.volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.volume}
          onChange={(e) => handleSliderChange('volume', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* ADSR Envelope Controls */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          ADSR Envelope
        </h5>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Attack */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Attack: {(settings.attack * 1000).toFixed(0)}ms
            </label>
            <input
              type="range"
              min="0.001"
              max="1"
              step="0.001"
              value={settings.attack}
              onChange={(e) => handleSliderChange('attack', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Decay */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Decay: {(settings.decay * 1000).toFixed(0)}ms
            </label>
            <input
              type="range"
              min="0.001"
              max="1"
              step="0.001"
              value={settings.decay}
              onChange={(e) => handleSliderChange('decay', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Sustain */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sustain: {Math.round(settings.sustain * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.sustain}
              onChange={(e) => handleSliderChange('sustain', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Release */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Release: {(settings.release * 1000).toFixed(0)}ms
            </label>
            <input
              type="range"
              min="0.001"
              max="2"
              step="0.001"
              value={settings.release}
              onChange={(e) => handleSliderChange('release', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* ADSR Visualization */}
      <div>
        <h6 className="text-xs font-medium text-gray-600 mb-2">Envelope Shape</h6>
        <div className="h-16 bg-gray-50 rounded border p-2">
          <svg width="100%" height="100%" viewBox="0 0 400 48" className="overflow-visible">
            {/* Grid lines */}
            <defs>
              <pattern id="envelope-grid" width="40" height="12" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 12" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#envelope-grid)" />
            
            {/* ADSR Curve */}
            <path
              d={`M 0 48 
                  L ${settings.attack * 100} 0 
                  L ${(settings.attack + settings.decay) * 100} ${(1 - settings.sustain) * 48}
                  L ${400 - settings.release * 100} ${(1 - settings.sustain) * 48}
                  L 400 48`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            
            {/* Phase labels */}
            <text x="10" y="44" fontSize="8" fill="#6b7280">A</text>
            <text x={`${settings.attack * 100 + 5}`} y="44" fontSize="8" fill="#6b7280">D</text>
            <text x="200" y="44" fontSize="8" fill="#6b7280">S</text>
            <text x="380" y="44" fontSize="8" fill="#6b7280">R</text>
          </svg>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Presets
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onSettingsChange({
              ...settings,
              attack: 0.01,
              decay: 0.1,
              sustain: 0.7,
              release: 0.3,
            })}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Default
          </button>
          <button
            onClick={() => onSettingsChange({
              ...settings,
              attack: 0.001,
              decay: 0.05,
              sustain: 0.3,
              release: 0.1,
            })}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Pluck
          </button>
          <button
            onClick={() => onSettingsChange({
              ...settings,
              attack: 0.5,
              decay: 0.3,
              sustain: 0.8,
              release: 1.0,
            })}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Pad
          </button>
          <button
            onClick={() => onSettingsChange({
              ...settings,
              attack: 0.001,
              decay: 0.001,
              sustain: 1.0,
              release: 0.001,
            })}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Organ
          </button>
        </div>
      </div>
    </motion.div>
  );
}
