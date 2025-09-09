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
    "Riff style Seven Nation Army ~120 bpm en La mineur",
    "Mélodie de Joyeux Anniversaire en Do majeur",
    "Progression d'ouverture du Canon de Pachelbel",
    "Riff simple en gamme blues Mi mineur",
    "Ah! vous dirai-je, maman en Fa majeur",
    "Progression d'accords dramatique en mineur",
    "Mélodie de La Marseillaise en Sib majeur",
    "Thème principal de l'Hymne à la joie"
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 via-rose-50 to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-8 w-80 h-80 bg-gradient-to-l from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gradient-to-t from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
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
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
              Générateur Musical GPT-4o
            </h1>
          </div>
          <p className="text-gray-700 max-w-3xl mx-auto text-lg leading-relaxed">
            Transformez vos idées musicales en arrangements jouables grâce aux sorties structurées de GPT-4o. 
            Saisissez n'importe quelle demande musicale et obtenez des fréquences précises, des durées exactes, 
            et une visualisation en temps réel époustouflante.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-800 mb-3">
                  ✨ Décrivez votre arrangement musical
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="ex: Riff style Seven Nation Army ~120 bpm en La mineur, mélodie romantique en Do majeur..."
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                    rows={3}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                      {isLoading ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Générer
                        </>
                      )}
                  </button>
                </div>
              </div>

              {/* Example Prompts */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">🎵 Essayez ces exemples :</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => useExamplePrompt(example)}
                      disabled={isLoading}
                      className="text-xs px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-purple-100 hover:to-blue-100 disabled:bg-gray-50 text-gray-700 hover:text-purple-700 rounded-full transition-all duration-300 border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md"
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
                className="mt-6 p-6 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3 shadow-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-semibold">Erreur lors de la génération de l'arrangement</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  {error.includes('OpenAI API key') && (
                    <p className="text-red-600 text-xs mt-2">
                      Assurez-vous d'ajouter votre clé API OpenAI dans le fichier `.env.local`.
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
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">🤖 Génération par IA</h3>
                <p className="text-gray-700 leading-relaxed">
                  GPT-4o avec sorties structurées crée des arrangements musicaux précis à partir de descriptions en langage naturel.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Music className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">🎵 Lecture Temps Réel</h3>
                <p className="text-gray-700 leading-relaxed">
                  API Web Audio avec synthèse d'enveloppe ADSR et formes d'onde personnalisables pour un son haute qualité.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">📤 Export Facile</h3>
                <p className="text-gray-700 leading-relaxed">
                  Exportez vers des appels Python play_frequency() ou format JSON pour vos propres projets.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}