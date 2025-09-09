import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema for a single note
const NoteSchema = z.object({
  frequency: z.number().min(0).max(4000).describe("Fréquence en Hz (0 pour silence, 80-4000 pour notes)"),
  duration: z.number().min(0.01).max(10).describe("Durée en secondes (0.01-10)"),
  note_name: z.string().optional().describe("Nom de la note optionnel comme 'Do4', 'Fa#5', 'Silence'"),
  is_rest: z.boolean().optional().describe("Vrai si c'est un silence/pause"),
}).refine((data) => {
  // If it's a rest, frequency should be 0
  if (data.is_rest) {
    return data.frequency === 0;
  }
  // If it's not a rest, frequency should be between 80-4000
  return data.frequency >= 80 && data.frequency <= 4000;
}, {
  message: "Pour les silences: frequency=0 et is_rest=true. Pour les notes: frequency entre 80-4000Hz",
  path: ["frequency"]
});

// Define the schema for the complete arrangement
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

    // Create the system prompt for music generation
    const systemPrompt = `Vous êtes un compositeur IA qui crée des arrangements musicaux précis.

À partir de la demande musicale de l'utilisateur, générez une séquence de notes avec des fréquences et durées exactes.

RÈGLES ABSOLUES pour le format JSON:
- TOUS les objets notes DOIVENT avoir les champs "frequency" et "duration"
- Pour les NOTES MUSICALES: frequency entre 80-4000Hz, is_rest: false ou omis
- Pour les SILENCES: frequency: 0, is_rest: true, note_name: "Silence"
- Ne JAMAIS omettre le champ frequency - utilisez 0 pour les silences
- Tous les nombres doivent être valides (pas null, undefined, ou manquants)

Directives musicales:
- Utilisez les fréquences musicales occidentales standard (La4 = 440Hz)
- Gardez les arrangements entre 8-25 notes pour la jouabilité
- Incluez 1-2 silences pour le phrasé musical si nécessaire
- Utilisez des durées réalistes (0.1-2.0 secondes typiquement)
- Respectez le style, tempo et tonalité demandés

Références de fréquences VALIDES (80-4000Hz):
- Do3: 130.81 Hz, Do4: 261.63 Hz, Do5: 523.25 Hz
- Ré3: 146.83 Hz, Ré4: 293.66 Hz, Ré5: 587.33 Hz  
- Mi3: 164.81 Hz, Mi4: 329.63 Hz, Mi5: 659.25 Hz
- Fa3: 174.61 Hz, Fa4: 349.23 Hz, Fa5: 698.46 Hz
- Sol3: 196.00 Hz, Sol4: 392.00 Hz, Sol5: 783.99 Hz
- La3: 220.00 Hz, La4: 440.00 Hz, La5: 880.00 Hz
- Si3: 246.94 Hz, Si4: 493.88 Hz, Si5: 987.77 Hz

EXEMPLE de note musicale: {"frequency": 440, "duration": 0.5, "note_name": "La4"}
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
      temperature: 0.7,
      max_tokens: 2000,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error('Échec de la génération de l\'arrangement musical');
    }

    // Parse the JSON response
    let arrangement;
    try {
      arrangement = JSON.parse(messageContent);
    } catch (error) {
      throw new Error('Format de réponse JSON invalide');
    }

    // Validate the generated arrangement
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

    // Handle OpenAI API errors specifically
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

// Handle OPTIONS for CORS
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
