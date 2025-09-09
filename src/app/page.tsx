// src/app/page.tsx
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
  // Exemples de prompts
    "Mélodie exacte de Seven Nation Army",
    "Joyeux Anniversaire mélodie complète",
    "Canon de Pachelbel ouverture",
    "La Marseillaise couplet principal",
    "Ah! vous dirai-je, maman",
    "Hymne à la joie de Beethoven",
    "Frère Jacques mélodie",
    "Au clair de la lune"
  ];

  const generateArrangement = async () => {
  // Générer un arrangement
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

      const data = await response.json() as ArrangeResponse;

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
  // Utiliser un exemple de prompt
    setPrompt(example);
  };

  return (
  // Rendu principal
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Subtle dark background elements */}
      // Sombres éléments de fond
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-8 w-80 h-80 bg-gradient-to-l from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>
      // Conteneur principal
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          // En-tête
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white">
              <Music className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Generateur de notes musicales
            </h1>
          </div>
          // Description
          <p className="text-gray-400 max-w-lg mx-auto">
            Créez des arrangements musicaux avec l'intelligence artificielle
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <form onSubmit={handleSubmit}>
              // Formulaire
              <div className="relative">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Décrivez votre musique... (ex: Mélodie de Seven Nation Army, Joyeux Anniversaire)"
                  className="w-full px-4 py-4 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all bg-gray-900/50 text-gray-100 placeholder-gray-400"
                  rows={2}
                  disabled={isLoading}
                />
                // Bouton de génération
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-300"
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

              {/* Example Prompts */}
              <div className="mt-4">
                // Exemples de prompts
                <div className="flex flex-wrap gap-2 justify-center">
                  {examplePrompts.slice(0, 4).map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => useExamplePrompt(example)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 disabled:bg-gray-800 text-gray-300 hover:text-white rounded-full transition-all duration-300 border border-gray-600/50"
                    >
                      {example.split(' ').slice(0, 3).join(' ')}...
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Error Display */}
            // Affichage des erreurs
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-300 font-medium">Erreur de génération</h4>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Music Player */}
        // Lecteur musical
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mx-auto px-4 ${
            arrangement && arrangement.notes.length > 15 
              ? 'max-w-full' 
              // Largeur maximale pour les longues mélodies
              : arrangement && arrangement.notes.length > 8 
                ? 'max-w-6xl' 
                : 'max-w-4xl'
          }`}
        >
          // Lecteur musical
          <MusicPlayer arrangement={arrangement} isLoading={isLoading} />
        </motion.div>
      </div>
    </div>
  );
}