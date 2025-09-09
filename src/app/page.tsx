'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Send, AlertCircle } from 'lucide-react';
import { Arrangement, ArrangeResponse } from '@/types/music';
import MusicPlayer from '@/components/MusicPlayer';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const examplePrompts = [
    "Seven Nation Army-style riff ~120 bpm in A minor",
    "Happy birthday melody in C major",
    "Pachelbel's Canon opening progression",
    "Simple blues scale riff in E minor",
    "Twinkle Twinkle Little Star in F major",
    "Dramatic minor chord progression",
  ];

  const generateArrangement = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/arrange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data: ArrangeResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate arrangement');
      }

      if (data.success && data.arrangement) {
        setArrangement(data.arrangement);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating arrangement:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateArrangement();
  };

  const useExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white">
              <Music className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              GPT-4o Music Generator
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your musical ideas into playable arrangements using GPT-4o's structured outputs. 
            Type any musical request and get precise frequencies, durations, and real-time visualization.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your musical arrangement
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Seven Nation Army-style riff ~120 bpm in A minor"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example Prompts */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => useExamplePrompt(example)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded-full transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium">Error generating arrangement</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  {error.includes('OpenAI API key') && (
                    <p className="text-red-600 text-xs mt-2">
                      Make sure to add your OpenAI API key to the `.env.local` file.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Music Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <MusicPlayer arrangement={arrangement} isLoading={isLoading} />
        </motion.div>

        {/* Features */}
        {!arrangement && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mt-12"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-lg shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
                <p className="text-gray-600 text-sm">
                  GPT-4o with structured outputs creates precise musical arrangements from natural language descriptions.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Music className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Playback</h3>
                <p className="text-gray-600 text-sm">
                  Web Audio API with ADSR envelope synthesis and customizable waveforms for high-quality sound.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Easy Export</h3>
                <p className="text-gray-600 text-sm">
                  Export to Python play_frequency() calls or JSON format for use in your own projects.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}