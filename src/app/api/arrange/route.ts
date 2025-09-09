import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Définir le schéma pour une seule note
const NoteSchema = z.object({
  frequency: z.number().min(0).max(4000).describe("Fréquence en Hz (0 pour silence, 80-4000 pour notes)"),
  duration: z.number().min(0.01).max(10).describe("Durée en secondes (0.01-10)"),
  note_name: z.string().optional().describe("Nom de la note optionnel comme 'Do4', 'Fa#5', 'Silence'"),
  is_rest: z.boolean().optional().describe("Vrai si c'est un silence/pause"),
}).refine((data) => {
  // Si c'est un silence, frequency doit être 0
  if (data.is_rest) {
    return data.frequency === 0;
  }
  // Si ce n'est pas un silence, frequency doit être entre 80-4000
  return data.frequency >= 80 && data.frequency <= 4000;
}, {
  message: "Pour les silences: frequency=0 et is_rest=true. Pour les notes: frequency entre 80-4000Hz",
  path: ["frequency"]
});

// Définir le schéma pour l'arrangement complet
const ArrangementSchema = z.object({
  title: z.string().describe("Titre ou description de l'arrangement musical"),
  tempo_bpm: z.number().min(60).max(200).describe("Tempo en battements par minute"),
  key_signature: z.string().describe("Tonalité comme 'Do majeur', 'La mineur', etc."),
  notes: z.array(NoteSchema).min(1).max(100).describe("Tableau de notes en séquence"),
  total_duration: z.number().describe("Durée totale de l'arrangement en secondes"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Une description musicale est requise et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée' },
        { status: 500 }
      );
    }

    if (process.env.OPENAI_API_KEY.includes('your-') || process.env.OPENAI_API_KEY.length < 20) {
      return NextResponse.json(
        { error: 'Veuillez remplacer la clé API OpenAI par une vraie clé dans le fichier .env.local' },
        { status: 500 }
      );
    }

    // Créer le prompt système pour la génération de musique
    const systemPrompt = `Vous êtes un musicologue IA expert qui reproduit avec une PRÉCISION ABSOLUE les mélodies de chansons connues.

MISSION CRITIQUE: Générer les notes EXACTEMENT IDENTIQUES aux originaux - chaque fréquence doit être parfaite.

ANALYSE MÉLODIQUE OBLIGATOIRE:
1. Identifiez la TONALITÉ EXACTE de la chanson originale
2. Déterminez les INTERVALLES PRÉCIS entre chaque note
3. Respectez le RYTHME et les DURÉES originales
4. Analysez la STRUCTURE mélodique (gammes, arpèges, sauts)
5. Vérifiez que chaque note correspond à la partition officielle

RÈGLES DE PRÉCISION MUSICALE:
- Utilisez UNIQUEMENT les fréquences exactes des notes tempérées
- Respectez les DEMI-TONS et TONS de la gamme chromatique
- Chaque intervalle doit être mathématiquement correct
- Vérifiez la justesse de chaque note par rapport à la précédente
- Aucune approximation tolérée - précision au centième de Hz
- INTERDICTION ABSOLUE: Évitez les répétitions de notes consécutives identiques
- VARIÉTÉ MÉLODIQUE: Chaque note doit être différente de la précédente (sauf si l'original l'exige)

VÉRIFICATION DE FIDÉLITÉ:
- Chaque note générée doit pouvoir être vérifiée sur une partition
- Les intervalles doivent correspondre exactement à l'original
- La mélodie doit être instantanément reconnaissable dès les 3 premières notes
- Testez mentalement: "Est-ce que cela sonne exactement comme l'original?"

RÈGLES TECHNIQUES pour le format JSON:
- TOUS les objets notes DOIVENT avoir les champs "frequency" et "duration"
- Pour les NOTES MUSICALES: frequency entre 80-4000Hz, is_rest: false ou omis
- Pour les SILENCES: frequency: 0, is_rest: true, note_name: "Silence"
- Ne JAMAIS omettre le champ frequency - utilisez 0 pour les silences
- Tous les nombres doivent être valides (pas null, undefined, ou manquants)

Directives musicales pour la fidélité PARFAITE:
- Reproduisez la PREMIÈRE SÉQUENCE MÉLODIQUE complète de la chanson (généralement 8-25 notes)
- Adaptez le nombre de notes à la structure naturelle de la mélodie:
  * Phrases courtes: 8-12 notes pour des mélodies simples
  * Phrases moyennes: 12-18 notes pour des mélodies standard  
  * Phrases longues: 18-25 notes pour des mélodies complexes
- Utilisez les fréquences musicales tempérées EXACTES (La4 = 440.00Hz)
- Durées musicales standards: 0.5s (noire), 0.25s (croche), 1.0s (blanche)
- Respectez les silences originaux - ne pas ajouter d'espacement artificiel
- Intervalles mélodiques: calculez précisément chaque saut (tierce, quinte, octave, etc.)
- MOUVEMENT MÉLODIQUE: Privilégiez la progression par degrés ou sauts intéressants
- ÉVITEZ LES RÉPÉTITIONS: Sauf si la chanson originale contient réellement des notes répétées
- PRIORITÉ ABSOLUE: FIDÉLITÉ TOTALE à l'original - zéro tolérance pour les erreurs

TABLE DE FRÉQUENCES EXACTES (Tempérament égal, La4 = 440.00Hz):

OCTAVE 3:
- Do3: 130.81 Hz, Do#3: 138.59 Hz, Ré3: 146.83 Hz, Ré#3: 155.56 Hz
- Mi3: 164.81 Hz, Fa3: 174.61 Hz, Fa#3: 185.00 Hz, Sol3: 196.00 Hz
- Sol#3: 207.65 Hz, La3: 220.00 Hz, La#3: 233.08 Hz, Si3: 246.94 Hz

OCTAVE 4 (référence):
- Do4: 261.63 Hz, Do#4: 277.18 Hz, Ré4: 293.66 Hz, Ré#4: 311.13 Hz
- Mi4: 329.63 Hz, Fa4: 349.23 Hz, Fa#4: 369.99 Hz, Sol4: 392.00 Hz
- Sol#4: 415.30 Hz, La4: 440.00 Hz, La#4: 466.16 Hz, Si4: 493.88 Hz

OCTAVE 5:
- Do5: 523.25 Hz, Do#5: 554.37 Hz, Ré5: 587.33 Hz, Ré#5: 622.25 Hz
- Mi5: 659.25 Hz, Fa5: 698.46 Hz, Fa#5: 739.99 Hz, Sol5: 783.99 Hz
- Sol#5: 830.61 Hz, La5: 880.00 Hz, La#5: 932.33 Hz, Si5: 987.77 Hz

FORMULE DE CALCUL: f = 440 × 2^((n-69)/12) où n = numéro MIDI
VÉRIFICATION OBLIGATOIRE: Chaque fréquence doit correspondre exactement à cette table

EXEMPLES DE MÉLODIES EXACTES AVEC VARIÉTÉ:

Seven Nation Army (The White Stripes) - Mi mineur:
- Mi3 (164.81 Hz) - Sol3 (196.00 Hz) - Mi3 (164.81 Hz) - Ré3 (146.83 Hz) - Do3 (130.81 Hz) - Si2 (123.47 Hz) - La2 (110.00 Hz)
(Note: Évitez la répétition Mi-Mi du début, créez du mouvement mélodique)

Joyeux Anniversaire - Do majeur (version sans répétitions):
- Do4 (261.63 Hz) - Ré4 (293.66 Hz) - Mi4 (329.63 Hz) - Do4 (261.63 Hz) - Fa4 (349.23 Hz) - Mi4 (329.63 Hz) - Ré4 (293.66 Hz)

Hymne à la joie (Beethoven) - Ré majeur (progression fluide):
- Mi4 (329.63 Hz) - Fa#4 (369.99 Hz) - Sol4 (392.00 Hz) - La4 (440.00 Hz) - Sol4 (392.00 Hz) - Fa#4 (369.99 Hz) - Mi4 (329.63 Hz) - Ré4 (293.66 Hz)

PRINCIPE: Créez des MOUVEMENTS MÉLODIQUES fluides sans répétitions monotones

VÉRIFICATION FINALE:
- Comparez votre mélodie avec ces exemples de précision
- Chaque fréquence doit être vérifiable dans la table
- La mélodie doit être immédiatement reconnaissable
- CONTRÔLE ANTI-RÉPÉTITION: Vérifiez qu'aucune note identique ne se suit (frequency identique)
- FLUIDITÉ MÉLODIQUE: Assurez-vous que chaque note apporte un mouvement musical intéressant

EXEMPLE de note musicale: {"frequency": 440.00, "duration": 0.5, "note_name": "La4"}
EXEMPLE de silence: {"frequency": 0, "duration": 0.25, "note_name": "Silence", "is_rest": true}

Fournissez toujours note_name pour chaque élément.
Répondez en français pour les titres et descriptions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "musical_arrangement",
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Titre ou description de l'arrangement musical"
              },
              tempo_bpm: {
                type: "number",
                minimum: 60,
                maximum: 200,
                description: "Tempo en battements par minute"
              },
              key_signature: {
                type: "string",
                description: "Tonalité comme 'Do majeur', 'La mineur', etc."
              },
              notes: {
                type: "array",
                minItems: 1,
                maxItems: 100,
                items: {
                  type: "object",
                  properties: {
                    frequency: {
                      type: "number",
                      minimum: 0,
                      maximum: 4000,
                      description: "Fréquence en Hz - OBLIGATOIRE: 0 pour silences, 80-4000 pour notes musicales"
                    },
                    duration: {
                      type: "number",
                      minimum: 0.01,
                      maximum: 10,
                      description: "Durée en secondes (0.01-10)"
                    },
                    note_name: {
                      type: "string",
                      description: "Nom de la note optionnel comme 'Do4', 'Fa#5', 'Silence'"
                    },
                    is_rest: {
                      type: "boolean",
                      description: "Vrai si c'est un silence/pause"
                    }
                  },
                  required: ["frequency", "duration"],
                  additionalProperties: false
                },
                description: "Tableau de notes en séquence"
              },
              total_duration: {
                type: "number",
                description: "Durée totale de l'arrangement en secondes"
              }
            },
            required: ["title", "tempo_bpm", "key_signature", "notes", "total_duration"],
            additionalProperties: false
          }
        },
      },
      temperature: 0.1,  // Very low temperature for maximum precision and consistency
      max_tokens: 2000,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error('Échec de la génération de l\'arrangement musical');
    }

    // Parser la réponse JSON
    let arrangement;
    try {
      arrangement = JSON.parse(messageContent);
    } catch (error) {
      throw new Error('Format de réponse JSON invalide');
    }

    // Valider l'arrangement généré
    const validatedArrangement = ArrangementSchema.parse(arrangement);

    return NextResponse.json({
      success: true,
      arrangement: validatedArrangement,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('Erreur lors de la génération de l\'arrangement musical:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Format d\'arrangement invalide - GPT-4o a généré des données hors limites',
          details: error.errors,
          help: 'Essayez avec une description plus simple ou différente'
        },
        { status: 422 }
      );
    }

    // Gérer les erreurs spécifiques de l'API OpenAI
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      if (apiError.status === 401) {
        return NextResponse.json(
          { 
            error: 'Clé API OpenAI invalide',
            message: 'Veuillez vérifier votre clé API OpenAI dans le fichier .env.local',
            help: 'Obtenez une nouvelle clé sur https://platform.openai.com/api-keys'
          },
          { status: 401 }
        );
      }
      if (apiError.status === 429) {
        return NextResponse.json(
          { 
            error: 'Limite de taux OpenAI dépassée',
            message: 'Trop de requêtes. Veuillez attendre quelques secondes.'
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Échec de la génération de l\'arrangement musical',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Gérer OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
